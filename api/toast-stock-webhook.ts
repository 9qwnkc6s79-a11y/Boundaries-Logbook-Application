/**
 * Toast stock webhook receiver.
 *
 * Register in Toast: stock / out_of_stock (and optionally in_stock / low_quantity)
 *   POST https://<your-host>/api/toast-stock-webhook
 *
 * Writes the same food86Events-{storeId} Firestore doc as the stock poll path.
 * First observed OUT_OF_STOCK time per (store, America/Chicago business date, itemGuid).
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Food86Event } from '../types';
import {
  locationForRestaurant,
  setCors,
  storeIdForLocation,
} from './_lib/toastAuth';
import { chicagoBusinessDate } from './_lib/chicagoDate';
import { recordFood86Events } from './_lib/food86Store';

interface ParsedStockEvent {
  eventType?: string;
  itemGuid: string;
  restaurantGuid: string;
  status?: string;
  timestamp: string;
  multiLocationId?: string;
}

function asArray(body: any): any[] {
  if (Array.isArray(body)) return body;
  if (body?.messages && Array.isArray(body.messages)) return body.messages;
  if (body) return [body];
  return [];
}

function parseEvents(body: any): ParsedStockEvent[] {
  const events: ParsedStockEvent[] = [];
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
      multiLocationId: details.multiLocationId || msg.multiLocationId,
    });
  }
  return events;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
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

  const outgoing: Food86Event[] = [];
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

  const byStore = new Map<string, Food86Event[]>();
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
}
