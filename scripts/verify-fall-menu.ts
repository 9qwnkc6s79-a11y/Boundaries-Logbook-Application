/**
 * Smoke: Thursday Sept 4, 2026 fall menu — three SKUs, new recipes only,
 * no invented 1/2+1/2 ounce totals, pumpkin spice vs pumpkin pie never swapped.
 * Run: npx --yes tsx scripts/verify-fall-menu.ts
 */
import { readFileSync } from 'node:fs';
import { SEED_INVENTORY } from '../data/inventoryItems.ts';
import { BOUNDARIES_RECIPES } from '../data/recipes_new.ts';
import { appendFallAvailableFlavors, FALL_AVAILABLE_FLAVORS } from '../utils/fallMenuRematch.ts';
import type { Recipe } from '../types.ts';

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

const FALL_SKU_IDS = [
  'inv-seasonal-pumpkin-spice',
  'inv-seasonal-pumpkin-spice-zero',
  'inv-sauce-pumpkin-pie',
] as const;

const FALL_RECIPE_IDS = [
  'r-fall-pumpkin-spice-sweet-cream',
  'r-fall-maple-brown-sugar-sweet-cream',
  'r-fall-maple-pumpkin-spice-latte',
  'r-fall-maple-pumpkin-matcha',
  'r-fall-maple-brown-sugar-nitro',
  'r-fall-pumpkin-pie-chai',
  'r-fall-frozen-pumpkin-pie',
  'r-fall-caramel-apple-energy',
  'r-fall-cinnamon-roll',
] as const;

function recipeText(r: Recipe): string {
  const parts = [
    r.title,
    r.notes || '',
    ...(r.steps || []),
    ...(r.ingredients || []).map(i => `${i.quantity} ${i.name}`),
    ...(r.gridColumns || []),
    ...(r.gridRows || []).flatMap(row => [row.label, ...row.values]),
  ];
  return parts.join('\n');
}

function mentionsAsUse(text: string, phrase: string): boolean {
  const lower = text.toLowerCase();
  const target = phrase.toLowerCase();
  let idx = 0;
  while (idx < lower.length) {
    const found = lower.indexOf(target, idx);
    if (found === -1) return false;
    const before = lower.slice(Math.max(0, found - 16), found);
    if (!/do not use\s+$|not\s+$/.test(before)) return true;
    idx = found + target.length;
  }
  return false;
}

// ── Inventory SKUs ──
for (const storeId of ['store-prosper', 'store-elm'] as const) {
  const items = SEED_INVENTORY[storeId];
  assert(items, `Missing seed inventory for ${storeId}`);

  const pumpkinSpice = items.find(i => i.id === 'inv-seasonal-pumpkin-spice');
  assert(pumpkinSpice, `${storeId} missing inv-seasonal-pumpkin-spice`);
  assert(pumpkinSpice.name === 'Pumpkin Spice (1883)', 'pumpkin spice name');
  assert(pumpkinSpice.category === 'Seasonal Syrups', 'pumpkin spice category');
  assert(pumpkinSpice.storageLocation === 'Dry Storage', 'pumpkin spice storage');
  assert(pumpkinSpice.vendor === 'TSB', 'pumpkin spice vendor');
  assert(pumpkinSpice.brand === '1883', 'pumpkin spice brand');
  assert(pumpkinSpice.unit === 'bottles', 'pumpkin spice unit');
  assert(pumpkinSpice.par === 0, `${storeId} pumpkin spice par must be 0 until Daniel sets it`);

  const zero = items.find(i => i.id === 'inv-seasonal-pumpkin-spice-zero');
  assert(zero, `${storeId} missing inv-seasonal-pumpkin-spice-zero`);
  assert(zero.name === 'Pumpkin Spice Zero (Monin)', 'zero name');
  assert(zero.category === 'Seasonal Syrups', 'zero category');
  assert(zero.brand === 'Monin', 'zero brand');
  assert(zero.par === 0, `${storeId} pumpkin spice zero par must be 0`);

  const pie = items.find(i => i.id === 'inv-sauce-pumpkin-pie');
  assert(pie, `${storeId} missing inv-sauce-pumpkin-pie`);
  assert(pie.name === 'Pumpkin Pie (Hollander)', 'pie name');
  assert(pie.category === 'Sauces', 'pie category');
  assert(pie.brand === 'Hollander', 'new pumpkin pie sauce uses Hollander as written');
  assert(pie.par === 0, `${storeId} pumpkin pie par must be 0`);

  const caramel = items.find(i => i.id === 'inv-sauce-caramel');
  assert(caramel?.brand === 'Hollinder' && caramel.name === 'Caramel (Hollinder)', 'do not rename live Hollinder caramel');
  const white = items.find(i => i.id === 'inv-sauce-whitechoc');
  assert(white?.brand === 'Hollinder' && white.name === 'White Chocolate (Hollinder)', 'do not rename live Hollinder white choc');

  const fairlife = items.find(i => i.id === 'inv-dairy-fairlife');
  assert(fairlife?.name === 'FairLife' && fairlife.par === (storeId === 'store-prosper' ? 15 : 0), 'do not touch Fairlife');

  assert(
    !items.some(i => i.id === 'inv-syrup-greenapple' || i.id === 'inv-seasonal-green-apple' || i.id === 'inv-syrup-cinnamon' || i.id === 'inv-syrup-brownsugar'),
    'do not add green apple, cinnamon, or brown sugar SKUs'
  );
}

// ── Recipes exist ──
for (const id of FALL_RECIPE_IDS) {
  assert(BOUNDARIES_RECIPES.some(r => r.id === id), `missing recipe ${id}`);
}

const flavors = BOUNDARIES_RECIPES.find(r => r.id === 'r-qr-flavors');
assert(flavors?.ingredients?.some(i => /pumpkin spice/i.test(i.name)), 'Available Flavors must list pumpkin spice');
assert(flavors?.ingredients?.some(i => /pumpkin pie/i.test(i.name)), 'Available Flavors must list pumpkin pie');
assert(flavors?.ingredients?.some(i => i.name === 'Seasonal Offerings'), 'keep Seasonal Offerings row');

// ── 1/2 + 1/2 drinks: ratio only, no invented ounce totals ──
for (const id of ['r-fall-maple-pumpkin-spice-latte', 'r-fall-maple-pumpkin-matcha'] as const) {
  const r = BOUNDARIES_RECIPES.find(x => x.id === id)!;
  const text = recipeText(r);
  assert(/1\/2 pumpkin spice/i.test(text), `${id} must keep the 1/2 pumpkin spice ratio`);
  assert(/1\/2 maple/i.test(text), `${id} must keep the 1/2 maple ratio`);
  assert(!/\b0\.5\s*oz\s+(pumpkin|maple)/i.test(text), `${id} must not invent 0.5 oz pours for the 1/2 + 1/2 drink`);
  assert(!r.gridRows?.some(row => /12\s*oz/i.test(row.label)), `${id} must not invent size columns`);
}

const caramelApple = BOUNDARIES_RECIPES.find(r => r.id === 'r-fall-caramel-apple-energy')!;
assert(!caramelApple.gridRows?.some(row => /12\s*oz/i.test(row.label)), 'Caramel Apple Energy must not invent a 12oz row');
assert(caramelApple.gridRows?.length === 3, 'Caramel Apple Energy has 16/20/24 only');

const mapleCream = BOUNDARIES_RECIPES.find(r => r.id === 'r-fall-maple-brown-sugar-sweet-cream')!;
assert(/0\.5 oz maple brown sugar flavor/i.test(recipeText(mapleCream)), 'maple brown sugar uses 0.5 oz total flavor, no invented split');
assert(/unset pending taste test/i.test(mapleCream.notes || ''), 'maple/brown-sugar split note');
assert(/topping, not a vendor sku/i.test(recipeText(mapleCream)), 'sweet cream is a topping, not a vendor SKU');

const pumpkinCream = BOUNDARIES_RECIPES.find(r => r.id === 'r-fall-pumpkin-spice-sweet-cream')!;
assert(/topping, not a vendor sku/i.test(recipeText(pumpkinCream)), 'pumpkin spice sweet cream is a topping');

const frozen = BOUNDARIES_RECIPES.find(r => r.id === 'r-fall-frozen-pumpkin-pie')!;
assert(/Contains dairy — cannot be oat or almond/.test(frozen.notes || ''), 'frozen dairy note must use Daniel\'s words');

const nitro = BOUNDARIES_RECIPES.find(r => r.id === 'r-fall-maple-brown-sugar-nitro')!;
assert(/do not add the standard nitro 0\.5 oz syrup/i.test(recipeText(nitro)), 'nitro must not stack standard 0.5 oz syrup');

// ── Name swap: spice = latte/matcha only; pie = chai/frozen only ──
const spiceOnly = [
  'r-fall-pumpkin-spice-sweet-cream',
  'r-fall-maple-pumpkin-spice-latte',
  'r-fall-maple-pumpkin-matcha',
];
const pieOnly = [
  'r-fall-pumpkin-pie-chai',
  'r-fall-frozen-pumpkin-pie',
];
for (const id of spiceOnly) {
  const text = recipeText(BOUNDARIES_RECIPES.find(r => r.id === id)!);
  assert(mentionsAsUse(text, 'pumpkin spice'), `${id} uses pumpkin spice`);
  assert(!mentionsAsUse(text, 'pumpkin pie'), `${id} must not use pumpkin pie as the flavor`);
}
for (const id of pieOnly) {
  const text = recipeText(BOUNDARIES_RECIPES.find(r => r.id === id)!);
  assert(mentionsAsUse(text, 'pumpkin pie'), `${id} uses pumpkin pie`);
  assert(!mentionsAsUse(text, 'pumpkin spice'), `${id} must not use pumpkin spice as the flavor`);
}

// ── Flavors rematch appends only ──
const cloudCard: Recipe = {
  id: 'r-qr-flavors',
  title: 'Available Flavors',
  category: 'Quick Reference',
  type: 'STANDARD',
  ingredients: [{ name: 'Maple', quantity: '' }, { name: 'Seasonal Offerings', quantity: '' }],
  notes: 'manager edited note',
};
const appended = appendFallAvailableFlavors([cloudCard]);
assert(appended.mutated, 'rematch should append missing fall flavors');
assert(appended.recipes[0].notes === 'manager edited note', 'rematch must not overwrite notes');
assert(appended.recipes[0].ingredients?.some(i => i.name === 'Maple'), 'rematch keeps existing flavors');
for (const f of FALL_AVAILABLE_FLAVORS) {
  assert(appended.recipes[0].ingredients?.some(i => i.name === f.name), `rematch adds ${f.name}`);
}
const second = appendFallAvailableFlavors(appended.recipes);
assert(!second.mutated, 'second rematch is a no-op');

const dbSrc = readFileSync(new URL('../services/db.ts', import.meta.url), 'utf8');
assert(/const CONTENT_DEFAULTS_VERSION = 7;/.test(dbSrc), 'do not bump CONTENT_DEFAULTS_VERSION (that overwrites the book)');
for (const id of FALL_SKU_IDS) {
  assert(dbSrc.includes(`'${id}'`), `live inventory rematch must include ${id}`);
}

console.log('verify-fall-menu: ok');
