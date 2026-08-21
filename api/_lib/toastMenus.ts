import { TOAST_API } from './toastAuth';
import { classifyFoodItem } from './foodClassify';

export interface MenuNameLookup {
  name: string;
  menuName?: string;
  menuGroup?: string;
  multiLocationId?: string;
}

export interface ResolvedStockItem {
  guid: string;
  itemGuid: string;
  status: string;
  quantity: number | null;
  multiLocationId?: string;
  name: string;
  menuName?: string;
  menuGroup?: string;
  categoryHint: 'food' | 'drink' | 'unknown';
  includeInFoodView: boolean;
}

interface CachedMenus {
  expires: number;
  byGuid: Map<string, MenuNameLookup>;
  byMultiLocationId: Map<string, MenuNameLookup>;
}

const menuCache = new Map<string, CachedMenus>();
const MENU_TTL_MS = 15 * 60 * 1000;

function remember(byGuid: Map<string, MenuNameLookup>, byMl: Map<string, MenuNameLookup>, entry: MenuNameLookup & { guid?: string }) {
  if (entry.guid) byGuid.set(entry.guid, entry);
  if (entry.multiLocationId) byMl.set(entry.multiLocationId, entry);
}

function walkMenuGroups(
  groups: any[] | undefined,
  menuName: string,
  parentGroup: string | undefined,
  byGuid: Map<string, MenuNameLookup>,
  byMl: Map<string, MenuNameLookup>
) {
  if (!Array.isArray(groups)) return;
  for (const group of groups) {
    const groupName = group?.name || parentGroup;
    const items = group?.menuItems || [];
    for (const item of items) {
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

function indexModifierRefs(
  refs: Record<string, any> | any[] | undefined,
  byGuid: Map<string, MenuNameLookup>,
  byMl: Map<string, MenuNameLookup>
) {
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

async function fetchMenusJson(token: string, restaurantGuid: string): Promise<any | null> {
  const urls = [
    `${TOAST_API}/menus/v2/menus`,
    `${TOAST_API}/menus/v3/menus`,
  ];

  for (const url of urls) {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Toast-Restaurant-External-ID': restaurantGuid,
      },
    });
    if (response.ok) {
      return response.json();
    }
    console.warn(`[Toast Menus] ${url} failed (${response.status})`);
    if (response.status === 401 || response.status === 403) {
      return { __forbidden: true, status: response.status };
    }
  }
  return null;
}

export async function loadMenuLookup(
  token: string,
  restaurantGuid: string
): Promise<{ byGuid: Map<string, MenuNameLookup>; byMultiLocationId: Map<string, MenuNameLookup>; menusForbidden: boolean }> {
  const cached = menuCache.get(restaurantGuid);
  if (cached && cached.expires > Date.now()) {
    return { byGuid: cached.byGuid, byMultiLocationId: cached.byMultiLocationId, menusForbidden: false };
  }

  const json = await fetchMenusJson(token, restaurantGuid);
  const byGuid = new Map<string, MenuNameLookup>();
  const byMl = new Map<string, MenuNameLookup>();

  if (json?.__forbidden) {
    return { byGuid, byMultiLocationId: byMl, menusForbidden: true };
  }

  const menus = Array.isArray(json) ? json : json?.menus || [];
  for (const menu of menus) {
    walkMenuGroups(menu?.menuGroups, menu?.name || 'Menu', undefined, byGuid, byMl);
  }
  indexModifierRefs(json?.modifierOptionReferences, byGuid, byMl);
  indexModifierRefs(json?.modifierGroupReferences, byGuid, byMl);

  menuCache.set(restaurantGuid, {
    expires: Date.now() + MENU_TTL_MS,
    byGuid,
    byMultiLocationId: byMl,
  });

  console.log(`[Toast Menus] Indexed ${byGuid.size} items for ${restaurantGuid.substring(0, 8)}`);
  return { byGuid, byMultiLocationId: byMl, menusForbidden: false };
}

export function resolveStockItems(
  stockRows: any[],
  lookup: { byGuid: Map<string, MenuNameLookup>; byMultiLocationId: Map<string, MenuNameLookup> }
): ResolvedStockItem[] {
  return stockRows
    .filter(row => row && (row.status === 'QUANTITY' || row.status === 'OUT_OF_STOCK'))
    .map(row => {
      const guid = row.guid || row.itemGuid || '';
      const meta = lookup.byGuid.get(guid) || (row.multiLocationId ? lookup.byMultiLocationId.get(row.multiLocationId) : undefined);
      const name = meta?.name || (guid ? `Item ${guid.substring(0, 8)}` : 'Unknown item');
      const classified = classifyFoodItem({
        name: meta?.name,
        menuName: meta?.menuName,
        menuGroup: meta?.menuGroup,
      });
      const quantity = row.status === 'OUT_OF_STOCK' ? 0 : (typeof row.quantity === 'number' ? row.quantity : row.quantity ?? null);
      return {
        guid,
        itemGuid: guid,
        status: row.status,
        quantity: row.status === 'OUT_OF_STOCK' ? 0 : quantity,
        multiLocationId: row.multiLocationId,
        name,
        menuName: meta?.menuName,
        menuGroup: meta?.menuGroup,
        categoryHint: classified.categoryHint,
        includeInFoodView: classified.includeInFoodView,
      };
    });
}
