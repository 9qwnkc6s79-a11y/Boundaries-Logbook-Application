/**
 * Current Toast QUANTITY + OUT_OF_STOCK (+ IN_STOCK-with-qty) items.
 * Self-contained — Vercel ESM (`package.json` "type": "module") cannot
 * resolve extensionless `./_lib/*` imports and crashes at boot.
 *
 * GET /api/toast-stock?location=littleelm|prosper
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

const TOAST_API = 'https://ws-api.toasttab.com';
const CHICAGO_TZ = 'America/Chicago';
const PROJECT = 'boundaries-logbook-app';
const API_KEY = 'AIzaSyDbOuTQGRW2LtQUpRFHmcXj782Zp4tEKvQ';
const DEFAULT_ORG_ID = 'org-boundaries';

const RESTAURANTS: Record<string, string> = {
  littleelm: process.env.TOAST_RESTAURANT_LITTLEELM || '40980097-47ac-447d-8221-a5574db1b2f7',
  prosper: process.env.TOAST_RESTAURANT_PROSPER || 'f5e036bc-d8d0-4da9-8ec7-aec94806253b',
};

const STORE_BY_LOCATION: Record<string, string> = {
  littleelm: 'store-elm',
  prosper: 'store-prosper',
};

const FOOD_MENU_PHRASES = [
  'main street', 'bistro', 'lisa cordero', 'sysco', 'food', 'pastry', 'bakery',
  'taco', 'sandwich', 'breakfast', 'lunch', 'dinner', 'entree', 'entrée',
  'snack', 'grab and go', 'grab n go', 'kitchen',
];

const FOOD_ITEM_KEYWORDS = [
  'taco', 'sandwich', 'pastry', 'croissant', 'muffin', 'bagel', 'cookie',
  'brownie', 'cake', 'cupcake', 'quiche', 'wrap', 'burrito', 'salad', 'soup',
  'empanada', 'quesadilla', 'nacho', 'pizza', 'panini', 'scone', 'donut',
  'doughnut', 'kolache', 'biscuit', 'bread', 'pretzel', 'chip', 'fruit',
  'yogurt', 'parfait', 'granola', 'slider', 'burger', 'hot dog', 'danish',
  'turnover', 'strudel', 'churro', 'flauta', 'tostada', 'tortilla', 'chicken',
  'beef', 'pork', 'bacon', 'sausage', 'avocado toast', 'acai', 'waffle',
  'pancake', 'french toast', 'hummus', 'pita', 'falafel', 'protein', 'platter',
  'entree', 'entrée', 'appetizer', 'queso', 'guacamole', 'rice bowl',
];

const DRINK_MENU_PHRASES = [
  'syrup', 'espresso bar', 'coffee drinks', 'beverages', 'hot drinks',
  'cold drinks', 'specialty drinks', 'tea menu',
];

const DRINK_ITEM_KEYWORDS = [
  'latte', 'mocha', 'cappuccino', 'espresso', 'americano', 'macchiato',
  'cold brew', 'nitro', 'cortado', 'flat white', 'affogato', 'pour over',
  'drip coffee', 'brewed coffee', 'matcha', 'chai', 'lemonade', 'refresher',
  'frappe', 'frappuccino', 'smoothie', 'milkshake', 'red bull', 'energy drink',
  'sparkling', 'syrup', 'hot chocolate', 'cocoa', 'kombucha', 'horchata',
  'steamer', 'breve',
];

let cachedToken: { token: string; expires: number } | null = null;
const menuCache = new Map<string, { expires: number; byGuid: Map<string, any>; byMl: Map<string, any> }>();

function setCors(res: VercelResponse, methods = 'GET, OPTIONS') {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', methods);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Toast-Restaurant-External-ID');
}

function resolveLocation(raw?: string | string[]): string {
  const key = (Array.isArray(raw) ? raw[0] : raw)?.toLowerCase() || 'littleelm';
  return RESTAURANTS[key] ? key : 'littleelm';
}

function restaurantForLocation(location: string): string {
  return RESTAURANTS[location] || RESTAURANTS.littleelm;
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

async function getAuthToken(): Promise<string> {
  if (cachedToken && cachedToken.expires > Date.now()) return cachedToken.token;

  const clientId = process.env.VITE_TOAST_CLIENT_ID || process.env.TOAST_CLIENT_ID;
  const clientSecret = process.env.VITE_TOAST_API_KEY || process.env.TOAST_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error('Toast credentials not configured');

  const response = await fetch(`${TOAST_API}/authentication/v1/authentication/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientId, clientSecret, userAccessType: 'TOAST_MACHINE_CLIENT' }),
  });
  if (!response.ok) throw new Error(`Toast auth failed (${response.status})`);

  const data = await response.json();
  const token = data.token?.accessToken || data.accessToken;
  if (!token) throw new Error('Invalid auth response');

  cachedToken = { token, expires: Date.now() + 23 * 60 * 60 * 1000 };
  return token;
}

function includesAny(haystack: string, needles: string[]): boolean {
  return needles.some(n => haystack.includes(n));
}

function classifyFoodItem(meta: { name?: string; menuName?: string; menuGroup?: string }) {
  const name = (meta.name || '').trim();
  const menuName = (meta.menuName || '').trim();
  const menuGroup = (meta.menuGroup || '').trim();

  if (!name && !menuName && !menuGroup) {
    return { categoryHint: 'unknown' as const, includeInFoodView: true };
  }

  const menuText = `${menuName} ${menuGroup}`.toLowerCase();
  const itemText = name.toLowerCase();
  const menuIsFood = includesAny(menuText, FOOD_MENU_PHRASES);
  const menuIsDrink = includesAny(menuText, DRINK_MENU_PHRASES);
  const itemIsFood = includesAny(itemText, FOOD_ITEM_KEYWORDS);
  const itemIsDrink = includesAny(itemText, DRINK_ITEM_KEYWORDS);

  if (menuIsFood && itemIsFood) return { categoryHint: 'food' as const, includeInFoodView: true };
  if (menuIsFood && !itemIsDrink) return { categoryHint: 'food' as const, includeInFoodView: true };
  if (itemIsFood && !itemIsDrink) return { categoryHint: 'food' as const, includeInFoodView: true };
  if (itemIsDrink && !itemIsFood && !menuIsFood) return { categoryHint: 'drink' as const, includeInFoodView: false };
  if (menuIsDrink && !itemIsFood) return { categoryHint: 'drink' as const, includeInFoodView: false };
  if (itemIsFood && itemIsDrink) {
    if (menuIsFood) return { categoryHint: 'food' as const, includeInFoodView: true };
    return { categoryHint: 'unknown' as const, includeInFoodView: true };
  }
  return { categoryHint: 'unknown' as const, includeInFoodView: true };
}

function parseQuantity(raw: any): number | null {
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  if (typeof raw === 'string' && raw.trim() !== '') {
    const n = Number(raw);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function includeStockRow(row: any): boolean {
  if (!row) return false;
  if (row.status === 'QUANTITY' || row.status === 'OUT_OF_STOCK') return true;
  return row.status === 'IN_STOCK' && parseQuantity(row.quantity) !== null;
}

function remember(byGuid: Map<string, any>, byMl: Map<string, any>, entry: any) {
  if (entry.guid) byGuid.set(entry.guid, entry);
  if (entry.multiLocationId) byMl.set(entry.multiLocationId, entry);
}

function walkMenuGroups(groups: any[] | undefined, menuName: string, parentGroup: string | undefined, byGuid: Map<string, any>, byMl: Map<string, any>) {
  if (!Array.isArray(groups)) return;
  for (const group of groups) {
    const groupName = group?.name || parentGroup;
    for (const item of group?.menuItems || []) {
      if (!item?.guid && !item?.multiLocationId) continue;
      remember(byGuid, byMl, {
        guid: item.guid,
        name: item.name || item.posName || item.kitchenName || 'Unnamed item',
        menuName,
        menuGroup: groupName,
        multiLocationId: item.multiLocationId,
      });
    }
    walkMenuGroups(group?.menuGroups, menuName, groupName, byGuid, byMl);
  }
}

function indexModifierRefs(refs: any, byGuid: Map<string, any>, byMl: Map<string, any>) {
  if (!refs) return;
  const list = Array.isArray(refs) ? refs : Object.values(refs);
  for (const ref of list) {
    if (!ref?.guid && !ref?.multiLocationId) continue;
    remember(byGuid, byMl, {
      guid: ref.guid,
      name: ref.name || ref.posName || 'Unnamed modifier',
      menuName: ref.menuName,
      menuGroup: ref.groupName || 'Modifier',
      multiLocationId: ref.multiLocationId,
    });
  }
}

async function loadMenuLookup(token: string, restaurantGuid: string) {
  const cached = menuCache.get(restaurantGuid);
  if (cached && cached.expires > Date.now()) {
    return { byGuid: cached.byGuid, byMl: cached.byMl, menusForbidden: false };
  }

  const urls = [`${TOAST_API}/menus/v2/menus`, `${TOAST_API}/menus/v3/menus`];
  let json: any = null;
  for (const url of urls) {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, 'Toast-Restaurant-External-ID': restaurantGuid },
    });
    if (response.ok) {
      json = await response.json();
      break;
    }
    console.warn(`[Toast Stock] ${url} failed (${response.status})`);
    if (response.status === 401 || response.status === 403) {
      return { byGuid: new Map(), byMl: new Map(), menusForbidden: true };
    }
  }

  const byGuid = new Map<string, any>();
  const byMl = new Map<string, any>();
  const menus = Array.isArray(json) ? json : json?.menus || [];
  for (const menu of menus) {
    walkMenuGroups(menu?.menuGroups, menu?.name || 'Menu', undefined, byGuid, byMl);
  }
  indexModifierRefs(json?.modifierOptionReferences, byGuid, byMl);
  indexModifierRefs(json?.modifierGroupReferences, byGuid, byMl);
  menuCache.set(restaurantGuid, { expires: Date.now() + 15 * 60 * 1000, byGuid, byMl });
  return { byGuid, byMl, menusForbidden: false };
}

function resolveStockItems(stockRows: any[], lookup: { byGuid: Map<string, any>; byMl: Map<string, any> }) {
  return stockRows.filter(includeStockRow).map(row => {
    const guid = row.guid || row.itemGuid || '';
    const meta = lookup.byGuid.get(guid) || (row.multiLocationId ? lookup.byMl.get(row.multiLocationId) : undefined);
    const name = meta?.name || (guid ? `Item ${guid.substring(0, 8)}` : 'Unknown item');
    const classified = classifyFoodItem({
      name: meta?.name,
      menuName: meta?.menuName,
      menuGroup: meta?.menuGroup,
    });
    const parsed = parseQuantity(row.quantity);
    const quantity = row.status === 'OUT_OF_STOCK' ? 0 : parsed;
    return {
      guid,
      itemGuid: guid,
      status: row.status,
      quantity,
      multiLocationId: row.multiLocationId,
      name,
      menuName: meta?.menuName,
      menuGroup: meta?.menuGroup,
      categoryHint: classified.categoryHint,
      includeInFoodView: classified.includeInFoodView,
    };
  });
}

async function fetchToastStock(token: string, restaurantGuid: string) {
  const response = await fetch(`${TOAST_API}/stock/v1/inventory`, {
    headers: { Authorization: `Bearer ${token}`, 'Toast-Restaurant-External-ID': restaurantGuid },
  });

  if (response.status === 403 || response.status === 401) {
    const body = await response.text();
    return {
      ok: false,
      status: response.status,
      items: [] as any[],
      scopeMissing: true,
      menusForbidden: false,
      rawCount: 0,
      error: `Toast stock:read was rejected (${response.status}). ${body.substring(0, 120)}`.trim(),
      hint: 'The machine client does not have stock:read (or the restaurant header was rejected). Add stock:read on the Toast API client — do not invent quantities.',
    };
  }

  if (!response.ok) {
    const body = await response.text();
    return {
      ok: false,
      status: response.status,
      items: [] as any[],
      scopeMissing: false,
      menusForbidden: false,
      rawCount: 0,
      error: `Toast stock API error (${response.status}): ${body.substring(0, 120)}`,
      hint: undefined as string | undefined,
    };
  }

  const rows = await response.json();
  const list = Array.isArray(rows) ? rows : [];
  const lookup = await loadMenuLookup(token, restaurantGuid);
  return {
    ok: true,
    status: 200,
    items: resolveStockItems(list, lookup),
    scopeMissing: false,
    menusForbidden: lookup.menusForbidden,
    rawCount: list.length,
    error: undefined as string | undefined,
    hint: undefined as string | undefined,
  };
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
    console.error(`[Toast Stock] 86 GET failed (${response.status})`);
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

function failJson(
  res: VercelResponse,
  status: number,
  body: Record<string, unknown>
) {
  return res.status(status).json(body);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
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
        return failJson(res, 200, {
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
        const persist = await recordFood86Events(outOfStock.map(item => ({
          storeId,
          location,
          businessDate,
          itemGuid: item.itemGuid,
          itemName: item.name,
          soldOutAt: nowIso,
          source: 'poll',
        })));
        persisted86Count = persist.written;
        if (!persist.ok) console.warn('[Toast Stock] 86 persist failed:', persist.error);
      }

      res.setHeader('Cache-Control', 's-maxage=30');
      return res.status(200).json({
        ok: true,
        location,
        storeId,
        businessDate,
        stockScopeOk: true,
        menusResolved: !stock.menusForbidden,
        items: stock.items,
        excludedDrinkCount: stock.items.filter(i => !i.includeInFoodView).length,
        persisted86Count,
        rawCount: stock.rawCount,
      });
    } catch (error: any) {
      console.error('[Toast Stock] ERROR:', error?.message);
      return failJson(res, 200, {
        ok: false,
        location,
        storeId,
        businessDate,
        stockScopeOk: false,
        error: 'Failed to fetch Toast stock',
        message: error?.message,
        items: [],
        excludedDrinkCount: 0,
      });
    }
  } catch (error: any) {
    console.error('[Toast Stock] FATAL:', error?.message);
    try {
      return res.status(200).json({
        ok: false,
        stockScopeOk: false,
        error: 'Failed to fetch Toast stock',
        message: error?.message,
        items: [],
        excludedDrinkCount: 0,
      });
    } catch {
      return res.status(200).end('{"ok":false,"stockScopeOk":false,"items":[]}');
    }
  }
}
