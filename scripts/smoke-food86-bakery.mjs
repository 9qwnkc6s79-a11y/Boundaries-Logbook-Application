/**
 * Local smoke: bakery + taco filter + Food 86 API modules load (no Toast call).
 */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const UNRESOLVED_ITEM_NAME = /^(unknown(\s+item)?|item\s+[0-9a-f]{4,})$/i;
const EXCLUDED_NONFOOD = /\b(retail|5\s*lb|drip|teas?|fairlife|half\s*(and|&)\s*half)\b/i;
const UNSTOCKED_FOOD86_NAMES = [
  'brownie',
  'donut',
  'doughnut',
  'lunch taco',
  'muffin for mwm',
  'plain croissant',
  'taco toppings',
];

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

function normalizeFood86Name(name) {
  return (name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function isUnstockedFood86Name(item) {
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

function isBakeryFoodItem(item) {
  if (!item) return false;
  if (item.includeInFoodView === false) return false;
  if (isUnresolvedStockName(item.name)) return false;
  if (isUnstockedFood86Name(item)) return false;
  if (isBakeryMenu(item)) return true;
  if (isExcludedNonFood(item)) return false;
  return isTacoNamed(item) || isTacoTypeModifier(item);
}

const keep = [
  { name: 'Almond Croissant', menuGroup: 'Bakery', menuName: 'Menu', includeInFoodView: true },
  { name: 'Blueberry Muffin', menuGroup: 'bakery', includeInFoodView: true },
  { name: 'Chocolate Croissant', menuGroup: 'Bakery', status: 'OUT_OF_STOCK', quantity: 0, includeInFoodView: true },
  { name: 'Chocolate Croissant', menuGroup: 'Bakery', status: 'UNKNOWN', quantity: null, includeInFoodView: true },
  { name: 'Kolache (Sausage/Cheese)', menuName: 'Weekend Bakery', includeInFoodView: true },
  { name: 'Bacon Egg and Cheese', menuGroup: 'Modifier', menuName: 'Tacos', includeInFoodView: true },
  { name: 'Chorizo (Beef) Egg and Cheese', menuGroup: 'Modifier', menuName: 'Tacos', includeInFoodView: true },
];
const drop = [
  { name: 'Brownie', menuGroup: 'Bakery', includeInFoodView: true },
  { name: 'Donut', menuGroup: 'Bakery', includeInFoodView: true },
  { name: 'Lunch Taco', menuGroup: 'Bakery', includeInFoodView: true },
  { name: 'Lunch Taco', menuGroup: 'Food', includeInFoodView: true },
  { name: 'Muffin for MWM', menuGroup: 'Bakery', includeInFoodView: true },
  { name: 'muffin for mwm', menuGroup: 'Bakery', includeInFoodView: true },
  { name: 'Plain Croissant', menuGroup: 'Bakery', includeInFoodView: true },
  { name: 'Taco Toppings', menuGroup: 'Modifier', includeInFoodView: true },
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
      const bacon = { name: 'Bacon Egg and Cheese', menuGroup: 'Modifier', menuName: 'Tacos' };
      const hex = { name: 'Item 8a142d5c', menuGroup: 'Bakery' };
      const menuOnly = { name: 'Chocolate Croissant', menuGroup: 'Bakery', quantity: null, includeInFoodView: true };
      const blueberry = { name: 'Blueberry Muffin', menuGroup: 'Bakery' };
      const lunchTaco = { name: 'Lunch Taco', menuGroup: 'Bakery' };
      const muffinMwm = { name: 'Muffin for MWM', menuGroup: 'Bakery' };
      if (!filter.isBakeryFoodItem(bacon)) throw new Error('util should keep bacon taco modifier');
      if (filter.isBakeryFoodItem(hex)) throw new Error('util should drop unnamed hex');
      if (!filter.isBakeryFoodItem(menuOnly)) throw new Error('util should keep bakery with no stock qty');
      if (!filter.isBakeryFoodItem(blueberry)) throw new Error('util should keep blueberry muffin (not muffin for MWM)');
      if (filter.isBakeryFoodItem(lunchTaco)) throw new Error('util should drop unstocked lunch taco');
      if (filter.isBakeryFoodItem(muffinMwm)) throw new Error('util should drop unstocked muffin for MWM');
      if (typeof filter.isUnstockedFood86Name === 'function' && !filter.isUnstockedFood86Name(lunchTaco)) {
        throw new Error('util should flag lunch taco as unstocked');
      }

      const lookup = {
        byGuid: new Map([
          ['cc-guid', { guid: 'cc-guid', name: 'Chocolate Croissant', menuName: 'All Day', menuGroup: 'Bakery' }],
          ['hex-guid', { guid: 'hex-guid', name: 'Item 8a142d5c', menuName: 'All Day', menuGroup: 'Bakery' }],
          ['almond-guid', { guid: 'almond-guid', name: 'Almond Croissant', menuName: 'All Day', menuGroup: 'Bakery' }],
          ['muffin-guid', { guid: 'muffin-guid', name: 'Blueberry Muffin', menuName: 'All Day', menuGroup: 'Bakery' }],
          ['drip-guid', { guid: 'drip-guid', name: 'House Drip', menuName: 'Drinks', menuGroup: 'Drip Coffee' }],
          ['bacon-guid', { guid: 'bacon-guid', name: 'Bacon Egg and Cheese', menuName: 'Tacos', menuGroup: 'Modifier' }],
          ['chorizo-guid', { guid: 'chorizo-guid', name: 'Chorizo (Beef) Egg and Cheese', menuName: 'Tacos', menuGroup: 'Modifier' }],
          ['kolache-guid', { guid: 'kolache-guid', name: 'Kolache', menuName: 'All Day', menuGroup: 'Bakery' }],
          ['brownie-guid', { guid: 'brownie-guid', name: 'Brownie', menuName: 'All Day', menuGroup: 'Bakery' }],
          ['donut-guid', { guid: 'donut-guid', name: 'Donut', menuName: 'All Day', menuGroup: 'Bakery' }],
          ['lunch-guid', { guid: 'lunch-guid', name: 'Lunch Taco', menuName: 'All Day', menuGroup: 'Bakery' }],
          ['mwm-guid', { guid: 'mwm-guid', name: 'Muffin for MWM', menuName: 'All Day', menuGroup: 'Bakery' }],
          ['plain-guid', { guid: 'plain-guid', name: 'Plain Croissant', menuName: 'All Day', menuGroup: 'Bakery' }],
          ['toppings-guid', { guid: 'toppings-guid', name: 'Taco Toppings', menuName: 'Tacos', menuGroup: 'Modifier' }],
        ]),
        byMl: new Map(),
      };
      const stockRows = [
        { guid: 'almond-guid', status: 'QUANTITY', quantity: 3 },
        { guid: 'muffin-guid', status: 'OUT_OF_STOCK', quantity: 0 },
        { guid: 'hex-guid', status: 'QUANTITY', quantity: 1 },
        { guid: 'drip-guid', status: 'QUANTITY', quantity: 10 },
        { guid: 'bacon-guid', status: 'QUANTITY', quantity: 2 },
        { guid: 'brownie-guid', status: 'QUANTITY', quantity: 4 },
        { guid: 'lunch-guid', status: 'QUANTITY', quantity: 1 },
      ];

      for (const mod of [stock, sold]) {
        const src = mod === stock ? 'toast-stock' : 'toast-food-sold';
        if (typeof mod.buildFood86Items !== 'function') throw new Error(src + ' buildFood86Items missing');
        const built = mod.buildFood86Items(stockRows, lookup);
        const byName = Object.fromEntries(built.items.map((i) => [i.name, i]));
        if (!byName['Chocolate Croissant']) throw new Error(src + ' should keep bakery menu item with no stock row');
        if (byName['Chocolate Croissant'].quantity !== null) throw new Error(src + ' must not invent qty for menu-only bakery');
        if (byName['Chocolate Croissant'].status !== 'UNKNOWN') throw new Error(src + ' menu-only bakery status should be UNKNOWN');
        if (!byName['Almond Croissant'] || byName['Almond Croissant'].quantity !== 3) throw new Error(src + ' should overlay stock qty on bakery');
        if (!byName['Blueberry Muffin'] || byName['Blueberry Muffin'].quantity !== 0) throw new Error(src + ' should keep OUT_OF_STOCK bakery qty 0');
        if (!byName['Bacon Egg and Cheese'] || byName['Bacon Egg and Cheese'].quantity !== 2) throw new Error(src + ' should keep taco modifier from stock');
        if (!byName['Chorizo (Beef) Egg and Cheese'] || byName['Chorizo (Beef) Egg and Cheese'].quantity !== null) {
          throw new Error(src + ' should keep taco keeper from menu with no invented qty');
        }
        if (!byName['Kolache'] || byName['Kolache'].quantity !== null) {
          throw new Error(src + ' should keep kolache from menu with no invented qty');
        }
        if (byName['Item 8a142d5c'] || built.items.some((i) => /^Item\\s+[0-9a-f]/i.test(i.name))) {
          throw new Error(src + ' should drop unnamed hex rows');
        }
        if (byName['House Drip']) throw new Error(src + ' should drop drinks');
        for (const dropped of ['Brownie', 'Donut', 'Lunch Taco', 'Muffin for MWM', 'Plain Croissant', 'Taco Toppings']) {
          if (byName[dropped]) throw new Error(src + ' should drop unstocked ' + dropped);
        }
      }
      console.log('module load api/toast-stock.ts: ok');
      console.log('module load api/toast-food-sold.ts: ok');
      console.log('module load utils/food86Bakery.ts: ok');
      console.log('menu-only bakery union: ok');
    `,
  ],
  { encoding: 'utf8' }
);

if (loader.status !== 0) {
  console.error((loader.stderr || loader.stdout || 'module load failed').trim());
  process.exit(loader.status || 1);
}
process.stdout.write(loader.stdout);
