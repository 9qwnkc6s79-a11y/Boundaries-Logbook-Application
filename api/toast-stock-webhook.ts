/**
 * Toast stock webhook receiver.
 * Self-contained — Vercel ESM cannot resolve extensionless `./_lib/*` imports.
 *
 * Register in Toast: stock / out_of_stock (and optionally in_stock / low_quantity)
 *   POST https://<your-host>/api/toast-stock-webhook
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

const PROJECT = 'boundaries-logbook-app';
const API_KEY = 'AIzaSyDbOuTQGRW2LtQUpRFHmcXj782Zp4tEKvQ';
const DEFAULT_ORG_ID = 'org-boundaries';
const CHICAGO_TZ = 'America/Chicago';

const RESTAURANTS: Record<string, string> = {
  littleelm: process.env.TOAST_RESTAURANT_LITTLEELM || '40980097-47ac-447d-8221-a5574db1b2f7',
  prosper: process.env.TOAST_RESTAURANT_PROSPER || 'f5e036bc-d8d0-4da9-8ec7-aec94806253b',
};

const STORE_BY_LOCATION: Record<string, string> = {
  littleelm: 'store-elm',
  prosper: 'store-prosper',
};

const LOCATION_BY_RESTAURANT: Record<string, string> = Object.fromEntries(
  Object.entries(RESTAURANTS).map(([location, guid]) => [guid.toLowerCase(), location])
);

function setCors(res: VercelResponse, methods = 'GET, POST, OPTIONS') {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', methods);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Toast-Restaurant-External-ID');
}

function locationForRestaurant(restaurantGuid?: string): string | null {
  if (!restaurantGuid) return null;
  return LOCATION_BY_RESTAURANT[restaurantGuid.toLowerCase()] || null;
}

function storeIdForLocation(location: string): string {
  return STORE_BY_LOCATION[location] || 'store-elm';
}

function chicagoBusinessDate(at: Date | string = new Date()): string {
  const date = typeof at === 'string' ? new Date(at) : at;
  if (Number.isNaN(date.getTime())) {
    return new Date().toLocaleDateString('en-CA', { timeZone: CHICAGO_TZ });
  }
  return date.toLocaleDateString('en-CA', { timeZone: CHICAGO_TZ });
}

function encodeValue(value: any): any {
  if (value === null) return { nullValue: null };
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number') {
    return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  }
  if (Array.isArray(value)) return { arrayValue: { values: value.map(encodeValue) } };
  if (typeof value === 'object') {
    return {
      mapValue: {
        fields: Object.fromEntries(
          Object.entries(value)
            .filter(([, v]) => v !== undefined)
            .map(([k, v]) => [k, encodeValue(v)])
        ),
      },
    };
  }
  return { stringValue: String(value) };
}

function decodeValue(value: any): any {
  if (!value || typeof value !== 'object') return null;
  if ('nullValue' in value) return null;
  if ('stringValue' in value) return value.stringValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return value.doubleValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('timestampValue' in value) return value.timestampValue;
  if ('arrayValue' in value) return (value.arrayValue?.values || []).map(decodeValue);
  if ('mapValue' in value) {
    const fields = value.mapValue?.fields || {};
    return Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, decodeValue(v)]));
  }
  return null;
}

function eventsDocUrl(storeId: string): string {
  const path = `organizations/${DEFAULT_ORG_ID}/data/food86Events-${storeId}`;
  return `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/${path}?key=${API_KEY}`;
}

async function readEvents(storeId: string): Promise<any[] | null> {
  const response = await fetch(eventsDocUrl(storeId));
  if (response.status === 404) return [];
  if (!response.ok) {
    console.error(`[Stock Webhook] 86 GET failed (${response.status})`);
    return null;
  }
  const json = await response.json();
  const data = decodeValue(json.fields?.data);
  return Array.isArray(data) ? data : [];
}

async function recordFood86Events(incoming: any[]): Promise<{ ok: boolean; written: number; error?: string }> {
  if (incoming.length === 0) return { ok: true, written: 0 };
  const storeId = incoming[0].storeId;
  let existing = await readEvents(storeId);
  if (existing === null) {
    await new Promise(r => setTimeout(r, 400));
    existing = await readEvents(storeId);
    if (existing === null) return { ok: false, written: 0, error: 'Firestore read failed; refusing to overwrite 86 events' };
  }

  const map = new Map<string, any>();
  existing.forEach((e: any) => map.set(`${e.businessDate}:${e.itemGuid}`, e));
  let written = 0;
  for (const event of incoming) {
    const key = `${event.businessDate}:${event.itemGuid}`;
    const prev = map.get(key);
    if (!prev) {
      map.set(key, event);
      written++;
      continue;
    }
    if (event.soldOutAt < prev.soldOutAt) {
      map.set(key, { ...prev, ...event, soldOutAt: event.soldOutAt });
      written++;
    }
  }

  if (written === 0) return { ok: true, written: 0 };

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);
  const cutoffStr = cutoff.toISOString().split('T')[0];
  const next = Array.from(map.values()).filter((e: any) => e.businessDate >= cutoffStr);

  const response = await fetch(eventsDocUrl(storeId), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fields: {
        data: encodeValue(next),
        lastUpdated: { timestampValue: new Date().toISOString() },
      },
    }),
  });
  if (!response.ok) return { ok: false, written: 0, error: 'Firestore write failed' };
  return { ok: true, written };
}

function asArray(body: any): any[] {
  if (Array.isArray(body)) return body;
  if (body?.messages && Array.isArray(body.messages)) return body.messages;
  if (body) return [body];
  return [];
}

function parseEvents(body: any) {
  const events: { eventType?: string; itemGuid: string; restaurantGuid: string; status?: string; timestamp: string }[] = [];
  for (const msg of asArray(body)) {
    const details = msg.details || {};
    const itemGuid = details.itemGuid || msg.itemGuid || details.guid;
    const restaurantGuid = details.restaurantGuid || msg.restaurantGuid;
    if (!itemGuid || !restaurantGuid) continue;
    events.push({
      eventType: msg.eventType || details.eventType,
      itemGuid,
      restaurantGuid,
      status: details.status || msg.status,
      timestamp: msg.timestamp || details.timestamp || new Date().toISOString(),
    });
  }
  return events;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    setCors(res, 'GET, POST, OPTIONS');
    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method === 'GET') {
      return res.status(200).json({
        ok: true,
        endpoint: '/api/toast-stock-webhook',
        accepts: 'Toast stock webhook (out_of_stock, in_stock, low_quantity)',
        persists: 'organizations/{org}/data/food86Events-{storeId} on out_of_stock',
      });
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const events = parseEvents(req.body);
    if (events.length === 0) {
      return res.status(200).json({ ok: true, accepted: 0, persisted: 0, note: 'No itemGuid/restaurantGuid in payload' });
    }

    const outgoing: any[] = [];
    for (const event of events) {
      const is86 = event.eventType === 'out_of_stock' || event.status === 'OUT_OF_STOCK';
      if (!is86) continue;
      const location = locationForRestaurant(event.restaurantGuid);
      if (!location) {
        console.warn(`[Stock Webhook] Unknown restaurantGuid ${event.restaurantGuid}`);
        continue;
      }
      outgoing.push({
        storeId: storeIdForLocation(location),
        location,
        businessDate: chicagoBusinessDate(event.timestamp),
        itemGuid: event.itemGuid,
        soldOutAt: event.timestamp,
        source: 'webhook',
      });
    }

    if (outgoing.length === 0) {
      return res.status(200).json({ ok: true, accepted: events.length, persisted: 0, note: 'No out_of_stock events for known restaurants' });
    }

    const byStore = new Map<string, any[]>();
    outgoing.forEach(e => {
      const list = byStore.get(e.storeId) || [];
      list.push(e);
      byStore.set(e.storeId, list);
    });

    let persisted = 0;
    const errors: string[] = [];
    for (const [, list] of byStore) {
      const result = await recordFood86Events(list);
      persisted += result.written;
      if (!result.ok && result.error) errors.push(result.error);
    }

    return res.status(200).json({
      ok: errors.length === 0,
      accepted: events.length,
      persisted,
      errors: errors.length ? errors : undefined,
    });
  } catch (error: any) {
    console.error('[Stock Webhook] FATAL:', error?.message);
    try {
      return res.status(200).json({
        ok: false,
        error: 'Webhook handler failed',
        message: error?.message,
        accepted: 0,
        persisted: 0,
      });
    } catch {
      return res.status(200).end('{"ok":false,"accepted":0,"persisted":0}');
    }
  }
}
