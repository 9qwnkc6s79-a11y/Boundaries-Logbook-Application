/**
 * Current Toast QUANTITY + OUT_OF_STOCK items for a location,
 * names resolved via menus, tagged food vs drink.
 *
 * GET /api/toast-stock?location=littleelm|prosper
 *
 * Also polls OUT_OF_STOCK rows and persists the first 86 time for today
 * so sold-out time works before the stock webhook is registered.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Food86Event } from '../types';
import {
  getAuthToken,
  resolveLocation,
  restaurantForLocation,
  setCors,
  storeIdForLocation,
} from './_lib/toastAuth';
import { chicagoBusinessDate } from './_lib/chicagoDate';
import { fetchToastStock } from './_lib/toastStock';
import { recordFood86Events } from './_lib/food86Store';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res, 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const location = resolveLocation(req.query.location);
  const restaurantGuid = restaurantForLocation(location);
  const storeId = storeIdForLocation(location);
  const businessDate = chicagoBusinessDate();

  try {
    const token = await getAuthToken();
    const stock = await fetchToastStock(token, restaurantGuid);

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
      if (!persist.ok) {
        console.warn('[Toast Stock] 86 persist failed:', persist.error);
      }
    }

    const excludedDrinkCount = stock.items.filter(i => !i.includeInFoodView).length;

    res.setHeader('Cache-Control', 's-maxage=30');
    return res.status(200).json({
      ok: true,
      location,
      storeId,
      businessDate,
      stockScopeOk: true,
      menusResolved: !stock.menusForbidden,
      items: stock.items,
      excludedDrinkCount,
      persisted86Count,
      rawCount: stock.rawCount,
    });
  } catch (error: any) {
    console.error('[Toast Stock] ERROR:', error.message);
    return res.status(500).json({
      ok: false,
      location,
      storeId,
      businessDate,
      stockScopeOk: false,
      error: 'Failed to fetch Toast stock',
      message: error.message,
      items: [],
      excludedDrinkCount: 0,
    });
  }
}
