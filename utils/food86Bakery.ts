/**
 * Food 86 / leftover-waste visibility.
 * Keep named Toast Bakery SKUs and taco SKUs (including bacon / chorizo
 * modifier types). Match by menu/name text — never by hardcoded GUIDs.
 * Null quantity / missing stock is still visible — do not hide 86'd bakery.
 * Unnamed stock GUIDs ("Item 8a142d5c") never belong on the close list.
 * Daniel no longer stocks a short name list (brownie, donut, lunch taco,
 * muffin for MWM, plain croissant, taco toppings / toppngs) — drop those by name only.
 */

const UNRESOLVED_ITEM_NAME = /^(unknown(\s+item)?|item\s+[0-9a-f]{4,})$/i;
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

type Food86Meta = {
  name?: string | null;
  menuName?: string | null;
  menuGroup?: string | null;
  includeInFoodView?: boolean;
};

function menuText(meta?: { menuName?: string | null; menuGroup?: string | null }): string {
  return `${meta?.menuName || ''} ${meta?.menuGroup || ''}`.toLowerCase();
}

function itemText(item?: Food86Meta | null): string {
  return `${item?.name || ''} ${item?.menuName || ''} ${item?.menuGroup || ''}`.toLowerCase();
}

export function isUnresolvedStockName(name?: string | null): boolean {
  const n = (name || '').trim();
  return !n || UNRESOLVED_ITEM_NAME.test(n);
}

export function isBakeryMenu(meta?: { menuName?: string | null; menuGroup?: string | null }): boolean {
  return menuText(meta).includes('bakery');
}

export function isTacoNamed(item?: Food86Meta | null): boolean {
  return itemText(item).includes('taco');
}

export function isModifierGroup(menuGroup?: string | null): boolean {
  return (menuGroup || '').toLowerCase().includes('modifier');
}

/** Bacon/chorizo breakfast-taco types. Names do not need the word "taco". */
export function isTacoTypeModifier(item?: Food86Meta | null): boolean {
  if (!isModifierGroup(item?.menuGroup)) return false;
  const name = (item?.name || '').toLowerCase();
  return (name.includes('bacon') && name.includes('egg')) || name.includes('chorizo');
}

export function isExcludedNonFood(item?: Food86Meta | null): boolean {
  return EXCLUDED_NONFOOD.test(itemText(item));
}

function normalizeFood86Name(name?: string | null): string {
  return (name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Unstocked SKU names. Case/punctuation/spacing flexible.
 * "Blueberry muffin" is not "Muffin for MWM". Lunch Taco the menu item
 * drops; bacon/chorizo taco modifiers stay (name-only match).
 */
export function isUnstockedFood86Name(item?: Food86Meta | null): boolean {
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

export function isFood86VisibleItem(item?: Food86Meta | null): boolean {
  if (!item) return false;
  if (item.includeInFoodView === false) return false;
  if (isUnresolvedStockName(item.name)) return false;
  if (isUnstockedFood86Name(item)) return false;
  if (isBakeryMenu(item)) return true;
  if (isExcludedNonFood(item)) return false;
  return isTacoNamed(item) || isTacoTypeModifier(item);
}

/** Named bakery + taco SKUs. Used by Food86Panel against any payload, including menu-only (quantity null) rows. */
export function isBakeryFoodItem(item?: Food86Meta | null): boolean {
  return isFood86VisibleItem(item);
}
