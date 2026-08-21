import { TOAST_API } from './toastAuth';
import { loadMenuLookup, resolveStockItems, type ResolvedStockItem } from './toastMenus';

export interface StockFetchResult {
  ok: boolean;
  status: number;
  items: ResolvedStockItem[];
  scopeMissing: boolean;
  menusForbidden: boolean;
  error?: string;
  hint?: string;
  rawCount: number;
}

export async function fetchToastStock(
  token: string,
  restaurantGuid: string
): Promise<StockFetchResult> {
  const response = await fetch(`${TOAST_API}/stock/v1/inventory`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Toast-Restaurant-External-ID': restaurantGuid,
    },
  });

  if (response.status === 403 || response.status === 401) {
    const body = await response.text();
    return {
      ok: false,
      status: response.status,
      items: [],
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
      items: [],
      scopeMissing: false,
      menusForbidden: false,
      rawCount: 0,
      error: `Toast stock API error (${response.status}): ${body.substring(0, 120)}`,
    };
  }

  const rows = await response.json();
  const list = Array.isArray(rows) ? rows : [];
  const lookup = await loadMenuLookup(token, restaurantGuid);
  const items = resolveStockItems(list, lookup);

  return {
    ok: true,
    status: 200,
    items,
    scopeMissing: false,
    menusForbidden: lookup.menusForbidden,
    rawCount: list.length,
  };
}
