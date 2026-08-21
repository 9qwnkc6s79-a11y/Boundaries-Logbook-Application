/**
 * Local smoke: bakery filter + Food 86 API modules load (no Toast call).
 */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const UNRESOLVED_ITEM_NAME = /^(unknown(\s+item)?|item\s+[0-9a-f]{4,})$/i;

function isUnresolvedStockName(name) {
  const n = (name || '').trim();
  return !n || UNRESOLVED_ITEM_NAME.test(n);
}

function isBakeryMenu(meta) {
  const menuText = `${meta?.menuName || ''} ${meta?.menuGroup || ''}`.toLowerCase();
  return menuText.includes('bakery');
}

function isBakeryFoodItem(item) {
  if (!item) return false;
  if (item.includeInFoodView === false) return false;
  if (isUnresolvedStockName(item.name)) return false;
  return isBakeryMenu(item);
}

const keep = [
  { name: 'Almond Croissant', menuGroup: 'Bakery', menuName: 'Menu', includeInFoodView: true },
  { name: 'Blueberry Muffin', menuGroup: 'bakery', includeInFoodView: true },
  { name: 'Chocolate Croissant', menuGroup: 'Bakery', status: 'OUT_OF_STOCK', quantity: 0, includeInFoodView: true },
  { name: 'Kolache (Sausage/Cheese)', menuName: 'Weekend Bakery', includeInFoodView: true },
];
const drop = [
  { name: 'Item 2b36a013', includeInFoodView: true },
  { name: 'UNKNOWN', includeInFoodView: true },
  { name: 'Decaf House Drip (Columbian Huila)', menuGroup: 'Drip Coffee', includeInFoodView: true },
  { name: 'Hot Black Tea', menuGroup: 'Hot Teas', includeInFoodView: true },
  { name: "Mother's Day Combo (5/10 Pickup)", menuGroup: 'Retail', includeInFoodView: true },
  { name: 'Bacon Egg and Cheese', menuGroup: 'Modifier', includeInFoodView: true },
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
console.log('food86 bakery filter: ok');

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
      if (typeof stock.default !== 'function') throw new Error('toast-stock default export missing');
      if (typeof sold.default !== 'function') throw new Error('toast-food-sold default export missing');
      console.log('module load api/toast-stock.ts: ok');
      console.log('module load api/toast-food-sold.ts: ok');
    `,
  ],
  { encoding: 'utf8' }
);

if (loader.status !== 0) {
  console.error((loader.stderr || loader.stdout || 'module load failed').trim());
  process.exit(loader.status || 1);
}
process.stdout.write(loader.stdout);
