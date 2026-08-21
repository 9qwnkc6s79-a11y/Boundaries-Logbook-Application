/**
 * Local smoke: bakery + taco filter + Food 86 API modules load (no Toast call).
 */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const UNRESOLVED_ITEM_NAME = /^(unknown(\s+item)?|item\s+[0-9a-f]{4,})$/i;
const EXCLUDED_NONFOOD = /\b(retail|5\s*lb|drip|teas?|fairlife|half\s*(and|&)\s*half)\b/i;

function itemText(item) {
  return `${item?.name || ''} ${item?.menuName || ''} ${item?.menuGroup || ''}`.toLowerCase();
}

function isUnresolvedStockName(name) {
  const n = (name || '').trim();
  return !n || UNRESOLVED_ITEM_NAME.test(n);
}

function isBakeryMenu(meta) {
  return `${meta?.menuName || ''} ${meta?.menuGroup || ''}`.toLowerCase().includes('bakery');
}

function isTacoNamed(item) {
  return itemText(item).includes('taco');
}

function isTacoTypeModifier(item) {
  if (!(item?.menuGroup || '').toLowerCase().includes('modifier')) return false;
  const name = (item?.name || '').toLowerCase();
  return (name.includes('bacon') && name.includes('egg')) || name.includes('chorizo');
}

function isExcludedNonFood(item) {
  return EXCLUDED_NONFOOD.test(itemText(item));
}

function isBakeryFoodItem(item) {
  if (!item) return false;
  if (item.includeInFoodView === false) return false;
  if (isUnresolvedStockName(item.name)) return false;
  if (isBakeryMenu(item)) return true;
  if (isExcludedNonFood(item)) return false;
  return isTacoNamed(item) || isTacoTypeModifier(item);
}

const keep = [
  { name: 'Almond Croissant', menuGroup: 'Bakery', menuName: 'Menu', includeInFoodView: true },
  { name: 'Blueberry Muffin', menuGroup: 'bakery', includeInFoodView: true },
  { name: 'Chocolate Croissant', menuGroup: 'Bakery', status: 'OUT_OF_STOCK', quantity: 0, includeInFoodView: true },
  { name: 'Kolache (Sausage/Cheese)', menuName: 'Weekend Bakery', includeInFoodView: true },
  { name: 'Bacon Egg and Cheese', menuGroup: 'Modifier', includeInFoodView: true },
  { name: 'Chorizo (Beef) Egg and Cheese', menuGroup: 'Modifier', includeInFoodView: true },
  { name: 'Lunch Taco', menuGroup: 'Bakery', includeInFoodView: true },
  { name: 'Lunch Taco', menuGroup: 'Food', includeInFoodView: true },
];
const drop = [
  { name: 'Item 2b36a013', includeInFoodView: true },
  { name: 'UNKNOWN', includeInFoodView: true },
  { name: 'Decaf House Drip (Columbian Huila)', menuGroup: 'Drip Coffee', includeInFoodView: true },
  { name: 'Hot Black Tea', menuGroup: 'Hot Teas', includeInFoodView: true },
  { name: "Mother's Day Combo (5/10 Pickup)", menuGroup: 'Retail', includeInFoodView: true },
  { name: 'Fairlife Protein Milk', menuGroup: 'Modifier', includeInFoodView: true },
  { name: 'Half and Half', menuGroup: 'Modifier', includeInFoodView: true },
  { name: 'House Blend 5lb', menuGroup: 'Retail', includeInFoodView: true },
  { name: 'Vanilla Syrup', menuGroup: 'Modifier', includeInFoodView: true },
  { name: 'Almond Croissant', menuGroup: 'Bakery', includeInFoodView: false },
];

let failed = 0;
for (const item of keep) {
  if (!isBakeryFoodItem(item)) {
    console.error('expected keep', item);
    failed++;
  }
}
for (const item of drop) {
  if (isBakeryFoodItem(item)) {
    console.error('expected drop', item);
    failed++;
  }
}
if (failed) {
  console.error(`filter smoke failed (${failed})`);
  process.exit(1);
}
console.log('food86 bakery+taco filter: ok');

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const loader = spawnSync(
  process.execPath,
  [
    '--experimental-strip-types',
    '--no-warnings=ExperimentalWarning',
    '--input-type=module',
    '-e',
    `
      const stock = await import(${JSON.stringify(join(root, 'api/toast-stock.ts'))});
      const sold = await import(${JSON.stringify(join(root, 'api/toast-food-sold.ts'))});
      const filter = await import(${JSON.stringify(join(root, 'utils/food86Bakery.ts'))});
      if (typeof stock.default !== 'function') throw new Error('toast-stock default export missing');
      if (typeof sold.default !== 'function') throw new Error('toast-food-sold default export missing');
      const bacon = { name: 'Bacon Egg and Cheese', menuGroup: 'Modifier' };
      const hex = { name: 'Item 8a142d5c', menuGroup: 'Bakery' };
      if (!filter.isBakeryFoodItem(bacon)) throw new Error('util should keep bacon taco modifier');
      if (filter.isBakeryFoodItem(hex)) throw new Error('util should drop unnamed hex');
      console.log('module load api/toast-stock.ts: ok');
      console.log('module load api/toast-food-sold.ts: ok');
      console.log('module load utils/food86Bakery.ts: ok');
    `,
  ],
  { encoding: 'utf8' }
);

if (loader.status !== 0) {
  console.error((loader.stderr || loader.stdout || 'module load failed').trim());
  process.exit(loader.status || 1);
}
process.stdout.write(loader.stdout);
