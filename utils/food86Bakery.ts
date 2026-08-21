/**
 * Food 86 / leftover-waste visibility.
 * Keep named Toast Bakery SKUs and taco SKUs (including bacon / chorizo
 * modifier types). Match by menu/name text — never by hardcoded GUIDs.
 * Unnamed stock GUIDs ("Item 8a142d5c") never belong on the close list.
 */

const UNRESOLVED_ITEM_NAME = /^(unknown(\s+item)?|item\s+[0-9a-f]{4,})$/i;
const EXCLUDED_NONFOOD = /\b(retail|5\s*lb|drip|teas?|fairlife|half\s*(and|&)\s*half)\b/i;

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

export function isFood86VisibleItem(item?: Food86Meta | null): boolean {
  if (!item) return false;
  if (item.includeInFoodView === false) return false;
  if (isUnresolvedStockName(item.name)) return false;
  if (isBakeryMenu(item)) return true;
  if (isExcludedNonFood(item)) return false;
  return isTacoNamed(item) || isTacoTypeModifier(item);
}

/** Named bakery + taco SKUs. Used by Food86Panel against any payload. */
export function isBakeryFoodItem(item?: Food86Meta | null): boolean {
  return isFood86VisibleItem(item);
}
