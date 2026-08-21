/**
 * Per food SKU for today: remaining qty, 86 status, lastSoldAt, soldCount.
 *
 * GET /api/toast-food-sold?location=littleelm|prosper&date=YYYY-MM-DD
 *
 * lastSoldAt = latest non-voided ordersBulk selection time for that item guid
 * on the America/Chicago business date. Check against 86 time — not a substitute.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Food86Event, FoodSkuDay } from '../types';
import {
  TOAST_API,
  getAuthToken,
  resolveLocation,
  restaurantForLocation,
  setCors,
  storeIdForLocation,
} from './_lib/toastAuth';
import { chicagoBusinessDate, chicagoDayBounds } from './_lib/chicagoDate';
import { fetchToastStock } from './_lib/toastStock';
import { fetchFood86Events, recordFood86Events, soldOutAtFor } from './_lib/food86Store';

interface SoldAgg {
  lastSoldAt: string | null;
  soldCount: number;
}

async function getOrdersBulk(
  restaurantGuid: string,
  startIso: string,
  endIso: string,
  token: string
): Promise<any[]> {
  const all: any[] = [];
  let page = 1;
  const pageSize = 100;

  while (page <= 50) {
    const url = `${TOAST_API}/orders/v2/ordersBulk?startDate=${encodeURIComponent(startIso)}&endDate=${encodeURIComponent(endIso)}&pageSize=${pageSize}&page=${page}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Toast-Restaurant-External-ID': restaurantGuid,
      },
    });

    if (!response.ok) {
      if (response.status === 404) break;
      const errorText = await response.text();
      throw new Error(`Toast ordersBulk (${response.status}): ${errorText.substring(0, 100)}`);
    }

    const orders = await response.json();
    if (!Array.isArray(orders) || orders.length === 0) break;
    all.push(...orders);
    if (orders.length < pageSize) break;
    page++;
  }

  return all;
}

function selectionItemGuid(selection: any): string | null {
  return selection?.item?.guid || selection?.itemGuid || null;
}

function selectionItemMultiId(selection: any): string | null {
  return selection?.item?.multiLocationId || selection?.multiLocationId || null;
}

function selectionTime(selection: any, check: any, order: any): string | null {
  return (
    selection?.createdDate ||
    selection?.modifiedDate ||
    selection?.fulfilledDate ||
    check?.closedDate ||
    order?.closedDate ||
    order?.openedDate ||
    null
  );
}

function aggregateSold(
  orders: any[],
  businessDate: string
): { byGuid: Map<string, SoldAgg>; byMulti: Map<string, SoldAgg> } {
  const byGuid = new Map<string, SoldAgg>();
  const byMulti = new Map<string, SoldAgg>();

  const bump = (map: Map<string, SoldAgg>, key: string | null, when: string, qty: number) => {
    if (!key) return;
    const prev = map.get(key) || { lastSoldAt: null, soldCount: 0 };
    prev.soldCount += qty;
    if (!prev.lastSoldAt || when > prev.lastSoldAt) prev.lastSoldAt = when;
    map.set(key, prev);
  };

  for (const order of orders) {
    if (order?.voided) continue;
    for (const check of order.checks || []) {
      if (check?.voided) continue;
      for (const selection of check.selections || []) {
        if (selection?.voided) continue;
        const when = selectionTime(selection, check, order);
        if (!when) continue;
        if (chicagoBusinessDate(when) !== businessDate) continue;
        const qty = typeof selection.quantity === 'number' ? selection.quantity : 1;
        bump(byGuid, selectionItemGuid(selection), when, qty);
        bump(byMulti, selectionItemMultiId(selection), when, qty);
      }
    }
  }

  return { byGuid, byMulti };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res, 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const location = resolveLocation(req.query.location);
  const restaurantGuid = restaurantForLocation(location);
  const storeId = storeIdForLocation(location);
  const dateParam = Array.isArray(req.query.date) ? req.query.date[0] : req.query.date;
  const businessDate = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)
    ? dateParam
    : chicagoBusinessDate();

  try {
    const token = await getAuthToken();
    const [stock, existing86] = await Promise.all([
      fetchToastStock(token, restaurantGuid),
      fetchFood86Events(storeId),
    ]);

    if (!stock.ok) {
      return res.status(stock.status || 500).json({
        ok: false,
        location,
        storeId,
        businessDate,
        stockScopeOk: !stock.scopeMissing,
        code: stock.scopeMissing ? 'STOCK_SCOPE_MISSING' : 'STOCK_API_ERROR',
        error: stock.error,
        hint: stock.hint,
        status: stock.status,
        items: [],
        excludedDrinkCount: 0,
      });
    }

    const outOfStock = stock.items.filter(i => i.status === 'OUT_OF_STOCK');
    let persisted86Count = 0;
    let events = existing86;
    if (outOfStock.length > 0) {
      const nowIso = new Date().toISOString();
      const incoming: Food86Event[] = outOfStock.map(item => ({
        storeId,
        location,
        businessDate,
        itemGuid: item.itemGuid,
        itemName: item.name,
        soldOutAt: nowIso,
        source: 'poll',
      }));
      const persist = await recordFood86Events(incoming);
      persisted86Count = persist.written;
      if (persist.ok) events = persist.events;
    }

    const bounds = chicagoDayBounds(businessDate);
    let sold = { byGuid: new Map<string, SoldAgg>(), byMulti: new Map<string, SoldAgg>() };
    try {
      const orders = await getOrdersBulk(restaurantGuid, bounds.startIso, bounds.endIso, token);
      sold = aggregateSold(orders, businessDate);
    } catch (orderErr: any) {
      console.warn('[Toast Food Sold] ordersBulk failed; last-sold will be empty:', orderErr.message);
    }

    const items: FoodSkuDay[] = stock.items.map(item => {
      const byGuid = sold.byGuid.get(item.itemGuid);
      const byMulti = item.multiLocationId ? sold.byMulti.get(item.multiLocationId) : undefined;
      const lastSoldAt = [byGuid?.lastSoldAt, byMulti?.lastSoldAt].filter(Boolean).sort().pop() || null;
      const soldCount = byGuid ? byGuid.soldCount : (byMulti?.soldCount || 0);
      return {
        ...item,
        quantity: item.status === 'OUT_OF_STOCK' ? 0 : item.quantity,
        lastSoldAt,
        soldCount,
        soldOutAt: soldOutAtFor(events, businessDate, item.itemGuid),
      };
    });

    items.sort((a, b) => a.name.localeCompare(b.name));

    res.setHeader('Cache-Control', 's-maxage=30');
    return res.status(200).json({
      ok: true,
      location,
      storeId,
      businessDate,
      stockScopeOk: true,
      menusResolved: !stock.menusForbidden,
      items,
      excludedDrinkCount: items.filter(i => !i.includeInFoodView).length,
      persisted86Count,
    });
  } catch (error: any) {
    console.error('[Toast Food Sold] ERROR:', error.message);
    return res.status(500).json({
      ok: false,
      location,
      storeId,
      businessDate,
      stockScopeOk: false,
      error: 'Failed to fetch food sold data',
      message: error.message,
      items: [],
      excludedDrinkCount: 0,
    });
  }
}
