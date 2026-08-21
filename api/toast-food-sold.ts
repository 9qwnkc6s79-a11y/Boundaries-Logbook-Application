/**
 * Per food SKU for today: remaining qty, 86 status, lastSoldAt, soldCount.
 * Named Bakery menu items stay listed even when Toast drops the stock row
 * (quantity null — do not invent a count). Self-contained — Vercel ESM
 * cannot resolve extensionless `./_lib/*` imports.
 *
 * GET /api/toast-food-sold?location=littleelm|prosper&date=YYYY-MM-DD
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

const UNRESOLVED_ITEM_NAME = /^(unknown(\s+item)?|item\s+[0-9a-f]{4,})$/i;

interface SoldAgg {
  lastSoldAt: string | null;
  soldCount: number;
}

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

function chicagoDayBounds(ymd: string): { startIso: string; endIso: string } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!match) return chicagoDayBounds(chicagoBusinessDate());

  let utc = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12, 0, 0);
  const ymdAt = (ms: number) => new Date(ms).toLocaleDateString('en-CA', { timeZone: CHICAGO_TZ });

  while (ymdAt(utc) === ymd) utc -= 30 * 60 * 1000;
  utc += 30 * 60 * 1000;
  while (ymdAt(utc - 60 * 1000) === ymd) utc -= 60 * 1000;

  return {
    startIso: new Date(utc).toISOString(),
    endIso: new Date(utc + 24 * 60 * 60 * 1000 - 1).toISOString(),
  };
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

const EXCLUDED_NONFOOD = /\b(retail|5\s*lb|drip|teas?|fairlife|half\s*(and|&)\s*half)\b/i;

/** No longer stocked. Item name only — do not match menu/group (taco family). */
const UNSTOCKED_FOOD86_NAMES = [
  'brownie',
  'donut',
  'doughnut',
  'lunch taco',
  'muffin for mwm',
  'plain croissant',
  'taco toppings',
  'taco toppngs', // live Toast typo (missing i)
];

type Food86Meta = { name?: string; menuName?: string; menuGroup?: string; includeInFoodView?: boolean };

function itemText(item?: Food86Meta): string {
  return `${item?.name || ''} ${item?.menuName || ''} ${item?.menuGroup || ''}`.toLowerCase();
}

function isUnresolvedStockName(name?: string): boolean {
  const n = (name || '').trim();
  return !n || UNRESOLVED_ITEM_NAME.test(n);
}

function isBakeryMenu(meta?: Food86Meta): boolean {
  return `${meta?.menuName || ''} ${meta?.menuGroup || ''}`.toLowerCase().includes('bakery');
}

function isTacoNamed(item?: Food86Meta): boolean {
  return itemText(item).includes('taco');
}

function isTacoTypeModifier(item?: Food86Meta): boolean {
  if (!(item?.menuGroup || '').toLowerCase().includes('modifier')) return false;
  const name = (item?.name || '').toLowerCase();
  return (name.includes('bacon') && name.includes('egg')) || name.includes('chorizo');
}

function isExcludedNonFood(item?: Food86Meta): boolean {
  return EXCLUDED_NONFOOD.test(itemText(item));
}

function normalizeFood86Name(name?: string): string {
  return (name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

/** Unstocked SKU names. Case/punctuation/spacing flexible. Name only. */
function isUnstockedFood86Name(item?: Food86Meta): boolean {
  const name = normalizeFood86Name(item?.name);
  if (!name) return false;
  const compact = name.replace(/\s+/g, '');
  return UNSTOCKED_FOOD86_NAMES.some((excluded) => {
    if (name === excluded || name === `${excluded}s`) return true;
    if (name.startsWith(`${excluded} `)) return true;
    const excludedCompact = excluded.replace(/\s+/g, '');
    return compact === excludedCompact || compact === `${excludedCompact}s`;
  });
}

/** Named Toast Bakery SKUs + taco types (bacon/chorizo modifiers). No hardcoded GUIDs. */
function isFood86VisibleItem(item?: Food86Meta): boolean {
  if (!item) return false;
  if (item.includeInFoodView === false) return false;
  if (isUnresolvedStockName(item.name)) return false;
  if (isUnstockedFood86Name(item)) return false;
  if (isBakeryMenu(item)) return true;
  if (isExcludedNonFood(item)) return false;
  return isTacoNamed(item) || isTacoTypeModifier(item);
}

function classifyFoodItem(meta: { name?: string; menuName?: string; menuGroup?: string }) {
  const keep = isFood86VisibleItem(meta);
  if (keep) {
    return { categoryHint: 'food' as const, includeInFoodView: true };
  }
  return { categoryHint: 'unknown' as const, includeInFoodView: false };
}

function keepFood86Item(item: Food86Meta): boolean {
  return item.includeInFoodView === true && isFood86VisibleItem(item);
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

function food86IdentityKeys(item: any): string[] {
  const keys: string[] = [];
  if (item?.itemGuid) keys.push(`g:${item.itemGuid}`);
  if (item?.guid && item.guid !== item.itemGuid) keys.push(`g:${item.guid}`);
  if (item?.multiLocationId) keys.push(`m:${item.multiLocationId}`);
  return keys;
}

/** Named Bakery + taco keepers from Toast menus. quantity is always null. */
export function collectNamedFood86MenuItems(lookup: { byGuid: Map<string, any>; byMl: Map<string, any> }) {
  const seen = new Set<string>();
  const items: any[] = [];

  const consider = (meta: any) => {
    if (!meta) return;
    const guid = meta.guid || '';
    const ml = meta.multiLocationId;
    const identity = guid || ml;
    if (!identity) return;
    const keys = food86IdentityKeys({ guid, itemGuid: guid || ml, multiLocationId: ml });
    if (keys.some(k => seen.has(k))) return;
    if (isUnresolvedStockName(meta.name)) return;
    if (!isFood86VisibleItem({
      name: meta.name,
      menuName: meta.menuName,
      menuGroup: meta.menuGroup,
    })) return;
    keys.forEach(k => seen.add(k));
    items.push({
      guid: guid || ml,
      itemGuid: guid || ml,
      status: 'UNKNOWN',
      quantity: null,
      multiLocationId: ml,
      name: meta.name,
      menuName: meta.menuName,
      menuGroup: meta.menuGroup,
      categoryHint: 'food' as const,
      includeInFoodView: true,
    });
  };

  for (const meta of lookup.byGuid.values()) consider(meta);
  for (const meta of lookup.byMl.values()) consider(meta);
  return items;
}

/** Stock rows win (qty / status / last-sold overlay later). Menu-only rows keep quantity null. */
export function unionFood86StockAndMenu(stockItems: any[], menuItems: any[]) {
  const seen = new Set<string>();
  const out: any[] = [];

  const remember = (item: any) => {
    for (const k of food86IdentityKeys(item)) seen.add(k);
  };
  const already = (item: any) => food86IdentityKeys(item).some(k => seen.has(k));

  for (const item of stockItems) {
    out.push(item);
    remember(item);
  }
  for (const item of menuItems) {
    if (already(item) || food86IdentityKeys(item).length === 0) continue;
    out.push(item);
    remember(item);
  }
  return out;
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
    console.warn(`[Toast Food Sold] ${url} failed (${response.status})`);
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

export function buildFood86Items(stockRows: any[], lookup: { byGuid: Map<string, any>; byMl: Map<string, any> }) {
  const resolved = resolveStockItems(stockRows, lookup);
  const fromStock = resolved.filter(keepFood86Item);
  const fromMenu = collectNamedFood86MenuItems(lookup);
  return {
    items: unionFood86StockAndMenu(fromStock, fromMenu),
    excludedNonBakeryCount: resolved.length - fromStock.length,
  };
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
      excludedNonBakeryCount: 0,
      scopeMissing: true,
      menusForbidden: false,
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
      excludedNonBakeryCount: 0,
      scopeMissing: false,
      menusForbidden: false,
      error: `Toast stock API error (${response.status}): ${body.substring(0, 120)}`,
      hint: undefined as string | undefined,
    };
  }

  const rows = await response.json();
  const list = Array.isArray(rows) ? rows : [];
  const lookup = await loadMenuLookup(token, restaurantGuid);
  const built = buildFood86Items(list, lookup);
  return {
    ok: true,
    status: 200,
    items: built.items,
    excludedNonBakeryCount: built.excludedNonBakeryCount,
    scopeMissing: false,
    menusForbidden: lookup.menusForbidden,
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
    console.error(`[Toast Food Sold] 86 GET failed (${response.status})`);
    return null;
  }
  const json = await response.json();
  const data = decodeValue(json.fields?.data);
  return Array.isArray(data) ? data : [];
}

async function fetchFood86Events(storeId: string): Promise<any[]> {
  let events = await readEvents(storeId);
  if (events === null || events.length === 0) {
    const retry = await readEvents(storeId);
    if (retry === null) return [];
    events = retry;
  }
  return events;
}

async function recordFood86Events(incoming: any[]): Promise<{ ok: boolean; written: number; events: any[]; error?: string }> {
  if (incoming.length === 0) return { ok: true, written: 0, events: [] };
  const storeId = incoming[0].storeId;
  let existing = await readEvents(storeId);
  if (existing === null) {
    await new Promise(r => setTimeout(r, 400));
    existing = await readEvents(storeId);
    if (existing === null) return { ok: false, written: 0, events: [], error: 'Firestore read failed; refusing to overwrite 86 events' };
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

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);
  const cutoffStr = cutoff.toISOString().split('T')[0];
  const next = Array.from(map.values()).filter((e: any) => e.businessDate >= cutoffStr);
  if (written === 0) return { ok: true, written: 0, events: next };

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
  if (!response.ok) return { ok: false, written: 0, events: existing, error: 'Firestore write failed' };
  return { ok: true, written, events: next };
}

function soldOutAtFor(events: any[], businessDate: string, itemGuid: string): string | null {
  const match = events.find(e => e.businessDate === businessDate && e.itemGuid === itemGuid);
  return match?.soldOutAt || null;
}

async function getOrdersBulk(restaurantGuid: string, startIso: string, endIso: string, token: string): Promise<any[]> {
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

function aggregateSold(orders: any[], businessDate: string) {
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
  try {
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
        return res.status(200).json({
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
          excludedNonBakeryCount: 0,
        });
      }

      const outOfStock = stock.items.filter(i => i.status === 'OUT_OF_STOCK');
      let persisted86Count = 0;
      let events = existing86;
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
        if (persist.ok) events = persist.events;
      }

      const bounds = chicagoDayBounds(businessDate);
      let sold = { byGuid: new Map<string, SoldAgg>(), byMulti: new Map<string, SoldAgg>() };
      try {
        const orders = await getOrdersBulk(restaurantGuid, bounds.startIso, bounds.endIso, token);
        sold = aggregateSold(orders, businessDate);
      } catch (orderErr: any) {
        console.warn('[Toast Food Sold] ordersBulk failed; last-sold will be empty:', orderErr?.message);
      }

      const items = stock.items.map(item => {
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
        excludedDrinkCount: stock.excludedNonBakeryCount,
        excludedNonBakeryCount: stock.excludedNonBakeryCount,
        persisted86Count,
      });
    } catch (error: any) {
      console.error('[Toast Food Sold] ERROR:', error?.message);
      return res.status(200).json({
        ok: false,
        location,
        storeId,
        businessDate,
        stockScopeOk: false,
        error: 'Failed to fetch food sold data',
        message: error?.message,
        items: [],
        excludedDrinkCount: 0,
        excludedNonBakeryCount: 0,
      });
    }
  } catch (error: any) {
    console.error('[Toast Food Sold] FATAL:', error?.message);
    try {
      return res.status(200).json({
        ok: false,
        stockScopeOk: false,
        error: 'Failed to fetch food sold data',
        message: error?.message,
        items: [],
        excludedDrinkCount: 0,
        excludedNonBakeryCount: 0,
      });
    } catch {
      return res.status(200).end('{"ok":false,"stockScopeOk":false,"items":[]}');
    }
  }
}
