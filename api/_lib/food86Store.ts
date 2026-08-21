/**
 * Persist first-observed 86 times to the same org-scoped Firestore docs
 * the client reads via services/db.ts.
 *
 * Path: organizations/{orgId}/data/food86Events-{storeId}
 * Shape: { data: Food86Event[], lastUpdated }
 *
 * Earliest soldOutAt wins. Empty-read retry before write.
 */

import type { Food86Event } from '../../types';
import { DEFAULT_ORG_ID } from './toastAuth';

const PROJECT = 'boundaries-logbook-app';
const API_KEY = 'AIzaSyDbOuTQGRW2LtQUpRFHmcXj782Zp4tEKvQ';

function eventsDocId(storeId: string): string {
  return `food86Events-${storeId}`;
}

function docUrl(docId: string, orgId = DEFAULT_ORG_ID): string {
  const path = `organizations/${orgId}/data/${docId}`;
  return `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/${path}?key=${API_KEY}`;
}

function encodeValue(value: any): any {
  if (value === null) return { nullValue: null };
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number') {
    return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  }
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map(encodeValue) } };
  }
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

async function readEvents(storeId: string): Promise<Food86Event[] | null> {
  const url = docUrl(eventsDocId(storeId));
  const response = await fetch(url);
  if (response.status === 404) return [];
  if (!response.ok) {
    const text = await response.text();
    console.error(`[Food86Store] GET failed (${response.status}): ${text.substring(0, 200)}`);
    return null;
  }
  const json = await response.json();
  const data = decodeValue(json.fields?.data);
  return Array.isArray(data) ? data : [];
}

async function writeEvents(storeId: string, events: Food86Event[]): Promise<boolean> {
  const url = docUrl(eventsDocId(storeId));
  const body = {
    fields: {
      data: encodeValue(events),
      lastUpdated: { timestampValue: new Date().toISOString() },
    },
  };
  const response = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const text = await response.text();
    console.error(`[Food86Store] PATCH failed (${response.status}): ${text.substring(0, 200)}`);
    return false;
  }
  return true;
}

function eventKey(e: Pick<Food86Event, 'businessDate' | 'itemGuid'>): string {
  return `${e.businessDate}:${e.itemGuid}`;
}

function pruneOld(events: Food86Event[]): Food86Event[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);
  const cutoffStr = cutoff.toISOString().split('T')[0];
  return events.filter(e => e.businessDate >= cutoffStr);
}

export async function fetchFood86Events(storeId: string): Promise<Food86Event[]> {
  let events = await readEvents(storeId);
  if (events === null || events.length === 0) {
    const retry = await readEvents(storeId);
    if (retry === null) return [];
    events = retry;
  }
  return events;
}

export async function recordFood86Events(incoming: Food86Event[]): Promise<{
  ok: boolean;
  written: number;
  events: Food86Event[];
  error?: string;
}> {
  if (incoming.length === 0) {
    return { ok: true, written: 0, events: [] };
  }

  const storeId = incoming[0].storeId;
  let existing = await readEvents(storeId);
  if (existing === null) {
    await new Promise(r => setTimeout(r, 400));
    existing = await readEvents(storeId);
    if (existing === null) {
      return { ok: false, written: 0, events: [], error: 'Firestore read failed; refusing to overwrite 86 events' };
    }
  }

  const map = new Map<string, Food86Event>();
  existing.forEach(e => map.set(eventKey(e), e));

  let written = 0;
  for (const event of incoming) {
    const key = eventKey(event);
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

  const next = pruneOld(Array.from(map.values()));
  if (written === 0) {
    return { ok: true, written: 0, events: next };
  }

  const saved = await writeEvents(storeId, next);
  if (!saved) {
    return { ok: false, written: 0, events: existing, error: 'Firestore write failed' };
  }
  return { ok: true, written, events: next };
}

export function soldOutAtFor(
  events: Food86Event[],
  businessDate: string,
  itemGuid: string
): string | null {
  const match = events.find(e => e.businessDate === businessDate && e.itemGuid === itemGuid);
  return match?.soldOutAt || null;
}
