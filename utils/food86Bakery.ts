/**
 * Bakery-only Food 86 / leftover-waste visibility.
 * Toast menu group or menu name must contain "bakery" (case-insensitive).
 * Unnamed stock GUIDs ("Item 8a142d5c") never belong on the close list.
 */

const UNRESOLVED_ITEM_NAME = /^(unknown(\s+item)?|item\s+[0-9a-f]{4,})$/i;

export function isUnresolvedStockName(name?: string | null): boolean {
  const n = (name || '').trim();
  return !n || UNRESOLVED_ITEM_NAME.test(n);
}

export function isBakeryMenu(meta?: { menuName?: string | null; menuGroup?: string | null }): boolean {
  const menuText = `${meta?.menuName || ''} ${meta?.menuGroup || ''}`.toLowerCase();
  return menuText.includes('bakery');
}

/** True only for named Toast Bakery SKUs. Used by Food86Panel against any payload. */
export function isBakeryFoodItem(item?: {
  name?: string | null;
  menuName?: string | null;
  menuGroup?: string | null;
  includeInFoodView?: boolean;
} | null): boolean {
  if (!item) return false;
  if (item.includeInFoodView === false) return false;
  if (isUnresolvedStockName(item.name)) return false;
  return isBakeryMenu(item);
}
