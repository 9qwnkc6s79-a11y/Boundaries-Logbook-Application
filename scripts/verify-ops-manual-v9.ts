/**
 * Ops Manual v9: §12 Supplier & menu, §7 Dirty Sodas, §7 Fall Frozen Pumpkin Pie.
 * Append-only and idempotent. Menu prices are allowed; invoice/cost dollars are not.
 * Run: npx --yes tsx scripts/verify-ops-manual-v9.ts
 */
import { readFileSync } from 'node:fs';
import { BOUNDARIES_MANUAL } from '../data/mockData.ts';
import { BOUNDARIES_RECIPES } from '../data/recipes_new.ts';
import { TACO_REHEAT_HEADING } from '../data/tacoReheatManual.ts';
import { patchFoodCloseManualSections } from '../data/foodCloseTasks.ts';
import {
  applyOpsManualV9,
  DIRTY_SODAS_HEADING,
  DIRTY_SODAS_MD,
  FALL_FROZEN_HEADING,
  FALL_FROZEN_MD,
  MACHINE_CARE_FALLBACK,
  pickMachineCareReference,
  resolveMachineCareReference,
  retargetMachineCareRecipes,
  TACO_SUPPLIER_HEADING,
  TACO_SUPPLIER_MD,
} from '../data/opsManualV9.ts';
import type { ManualSection, Recipe } from '../types.ts';

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

function section(id: string): ManualSection {
  const found = BOUNDARIES_MANUAL.find(item => item.id === id);
  assert(found, `missing manual section ${id}`);
  return found;
}

function once(text: string, heading: string, label: string): void {
  assert(text.split(heading).length === 2, `${label} must contain ${heading} exactly once`);
}

const MENU_PRICES = new Set(['$4.50', '$4.25', '$3.25', '$3.75', '$5.25']);
const NEW_BLOCKS = [TACO_SUPPLIER_MD, DIRTY_SODAS_MD, FALL_FROZEN_MD];

// ── Real section numbers ──
const drinks = section('s-7');
const food = section('s-12');
const care = section('s-15');
assert(drinks.number === 7 && drinks.title === 'Not Coffee Bar', 'drinks are §7 Not Coffee Bar');
assert(food.number === 12 && food.title === 'Food Prep & Kitchen Standards', 'tacos are §12');
assert(care.number === 15 && care.title === 'Maintenance & Equipment Care', 'machine care is §15');
assert(care.content.includes('## 15.1 Frozen Machine — Spaceman 6455-CL'), 'frozen machine care is §15.1');
assert(resolveMachineCareReference(BOUNDARIES_MANUAL) === MACHINE_CARE_FALLBACK, 'seed machine-care pointer');
assert(!MACHINE_CARE_FALLBACK.includes('v1.2'), 'pointer must not cite Ops Manual v1.2');

const renumbered = BOUNDARIES_MANUAL.map(item => (
  item.id === 's-15' ? { ...item, number: 18 } : item
));
const renumberedRef = resolveMachineCareReference(renumbered);
assert(renumberedRef?.includes('Section 18'), 'a renumbered live machine-care section keeps its number');
assert(renumberedRef?.includes('15.1 Frozen Machine (Spaceman 6455-CL)'), 'renumbered section still names 15.1');

const stub: ManualSection[] = [
  { id: 's-15', number: 15, title: 'Maintenance & Equipment Care', content: 'placeholder' },
];
assert(
  pickMachineCareReference(stub, BOUNDARIES_MANUAL) === MACHINE_CARE_FALLBACK,
  'a stub §15 falls back to the seed machine-care section',
);

// ── No invoice / cost dollars in the new staff text ──
for (const block of NEW_BLOCKS) {
  assert(!/invoice|wholesale|\bcogs\b|\bcost\b/i.test(block), 'no invoice or cost language');
  const dollars = block.match(/\$\d+(?:\.\d{2})?/g) || [];
  for (const amount of dollars) {
    assert(MENU_PRICES.has(amount), `unexpected dollar amount ${amount}`);
  }
}

// ── §12 Supplier & menu ──
once(food.content, TACO_SUPPLIER_HEADING, 'seed §12');
once(food.content, TACO_REHEAT_HEADING, 'seed §12 reheat');
assert(food.content.includes('Tacos y Rocky'), 'supplier name');
assert(food.content.includes('delivered weekly to each store'), 'weekly delivery');
assert(food.content.includes('Oct 2, 2026'), 'taco supply date');
assert(food.content.includes('Refrigerate on arrival'), 'refrigerate on arrival');
const breakfast = TACO_SUPPLIER_MD.split('\n').find(line => line.includes('Breakfast Taco'));
const lunch = TACO_SUPPLIER_MD.split('\n').find(line => line.includes('Lunch Taco'));
assert(breakfast?.includes('$4.50'), 'breakfast menu price');
assert(breakfast?.includes('Wagyu Barbacoa, Sausage, and Potato Egg & Cheese'), 'breakfast flavors');
assert(lunch?.includes('$4.25') && /TBD/i.test(lunch || ''), 'lunch price with flavors TBD');
assert(!/wagyu|sausage|potato|bacon|chorizo|barbacoa/i.test(lunch || ''), 'do not invent lunch flavors');
assert(TACO_SUPPLIER_MD.includes('Reheat only on the TurboChef program in Section 12'), 'reheat stays on the §12 program');
assert(TACO_SUPPLIER_MD.includes('Daniel sets the oven buttons, and staff never change them'), 'staff do not change oven buttons');

// ── §7 Dirty Sodas ──
once(drinks.content, DIRTY_SODAS_HEADING, 'seed §7 dirty sodas');
assert(DIRTY_SODAS_MD.includes('Oct 3, 2026'), 'dirty soda launch date');
assert(DIRTY_SODAS_MD.includes('Pepsi, Pepsi Zero Sugar, or Dr Pepper'), 'soda bases');
assert(DIRTY_SODAS_MD.includes('Cream = Coffee Mate'), 'cream is Coffee Mate');
assert(DIRTY_SODAS_MD.includes('Cowboy Cola | Pepsi + Vanilla + Coconut + Cream'), 'Cowboy Cola');
assert(DIRTY_SODAS_MD.includes('Peaches & Cream DP | Dr Pepper + White Peach + Vanilla + Cream'), 'Peaches & Cream DP');
assert(DIRTY_SODAS_MD.includes('Strawberry Sunset DP | Dr Pepper + Strawberry + Cream'), 'Strawberry Sunset DP');
assert(DIRTY_SODAS_MD.includes('Cake Pop Cola | Pepsi + Cupcake'), 'Cake Pop Cola');
assert(DIRTY_SODAS_MD.includes('Syrup by Drink Size'), 'syrup table reference');
assert(DIRTY_SODAS_MD.includes('Multi-flavor drinks split it equally'), 'multi-flavor split');
assert(DIRTY_SODAS_MD.includes('K $3.25 / S $3.75 / M $4.50 / L $5.25'), 'dirty soda menu prices');
assert(/Cup sizes and creamer amounts are pending/.test(DIRTY_SODAS_MD), 'cup sizes and creamer pending');
assert(!/\d+\s*oz/i.test(DIRTY_SODAS_MD), 'do not invent dirty-soda ounce amounts');
assert(!/\d+\s*g/i.test(DIRTY_SODAS_MD), 'do not invent dirty-soda gram amounts');
const syrupCard = BOUNDARIES_RECIPES.find(recipe => recipe.id === 'r-qr-syrup');
assert(syrupCard?.title.includes('Syrup by Drink Size'), 'Recipe Book still has the Syrup by Drink Size table');

// ── Frozen ──
once(drinks.content, FALL_FROZEN_HEADING, 'seed §7 frozen pumpkin pie');
assert(FALL_FROZEN_MD.includes('30 g Hollander Pumpkin Pie sauce + 10 g white chocolate'), 'pumpkin pie sauce ratio');
assert(/cinnamon/i.test(FALL_FROZEN_MD) && /no whip/i.test(FALL_FROZEN_MD) && /dairy only/i.test(FALL_FROZEN_MD), 'cinnamon, no whip, dairy only');
assert(drinks.content.includes('Frozen coffee is the only product on the Spaceman 6455-CL'), 'only frozen coffee on the Spaceman');
assert(drinks.content.includes('Frozen energy and lemonade are blended to order'), 'energy and lemonade blended to order');
const pie = BOUNDARIES_RECIPES.find(recipe => recipe.id === 'r-fall-frozen-pumpkin-pie');
assert(pie, 'recipe book keeps Fall Frozen Pumpkin Pie');
const pieText = JSON.stringify(pie);
assert(/30g/.test(pieText) && /10g/.test(pieText) && /No whip/.test(pieText) && /dairy/i.test(pieText), 'recipe card still matches the frozen spec');

// ── Seed has no stale v1.2 machine-care citation ──
assert(!/Ops Manual v1\.2/.test(JSON.stringify(BOUNDARIES_MANUAL)), 'seed manual has no v1.2 citation');
assert(!/Ops Manual v1\.2/.test(JSON.stringify(BOUNDARIES_RECIPES)), 'seed recipe book has no v1.2 citation');

// ── Append-only, idempotent, leaves other sections alone ──
const live: ManualSection[] = [
  { id: 's-7', number: '7' as unknown as number, title: 'Not Coffee Bar', content: 'LIVE drinks\n' },
  { id: 's-11', number: 11, title: 'Expo', content: 'live expo' },
  { id: 's-12', number: 12, title: 'Food Prep & Kitchen Standards', content: `LIVE §12 manager text\n\n${TACO_REHEAT_HEADING}\nlocked reheat` },
  { id: 's-15', number: 15, title: 'Maintenance & Equipment Care', content: '## 15.1 Frozen Machine — Spaceman 6455-CL\nSee Ops Manual v1.2 / Section 15 for teardown.' },
  { id: 's-16', number: 16, title: 'Close', content: 'live close' },
];
const patched = applyOpsManualV9(live);
assert(patched.mutated, 'v9 patch mutates a manual that is missing the new blocks');
assert(patched.next[0].content.startsWith('LIVE drinks'), 'keeps live §7 text');
assert(patched.next[2].content.startsWith('LIVE §12 manager text'), 'keeps live §12 text');
once(patched.next[0].content, DIRTY_SODAS_HEADING, 'patched §7 sodas');
once(patched.next[0].content, FALL_FROZEN_HEADING, 'patched §7 frozen');
once(patched.next[2].content, TACO_SUPPLIER_HEADING, 'patched §12 supplier');
once(patched.next[2].content, TACO_REHEAT_HEADING, 'patched §12 does not duplicate reheat');
assert(patched.next[1] === live[1] && patched.next[4] === live[4], 'expo and close untouched');
assert(!/Ops Manual v1\.2/.test(patched.next[3].content), 'stale machine-care citation removed');
assert(patched.next[3].content.includes('Ops Manual Section 15 (Maintenance & Equipment Care) — 15.1 Frozen Machine (Spaceman 6455-CL)'), 'citation points at §15.1');
assert(patched.next[3].content.includes('for teardown.'), 'citation rewrite keeps the surrounding sentence');

const again = applyOpsManualV9(patched.next);
assert(!again.mutated, 'second v9 patch is a no-op');
assert(again.next === patched.next, 'idempotent patch returns the same manual');

const seedPass = applyOpsManualV9(BOUNDARIES_MANUAL);
assert(!seedPass.mutated, 'seed manual already contains v9 and needs no append');

// v7 replacement still only runs for clouds below 7; v9 does not depend on it.
const cloud = 8;
const foodClose = cloud < 7 ? patchFoodCloseManualSections(live, []) : live;
assert(foodClose === live, 'v8/v9 path must not replace §12 / §14 / §16 from seed');

// ── Recipe book: rewrite the citation only ──
const untouched: Recipe = {
  id: 'r-keep',
  title: 'Keep me',
  category: 'Sodas',
  type: 'STANDARD',
  notes: 'manager note',
};
const stale: Recipe = {
  id: 'r-frozen-coffee-build',
  title: 'Frozen Coffee — Build Process & Machine',
  category: 'Frozen Coffee',
  type: 'STANDARD',
  notes: 'Nightly care: Ops Manual v1.2 / Section 15. Viscosity stays at 1.',
};
const recipes = retargetMachineCareRecipes([untouched, stale], MACHINE_CARE_FALLBACK);
assert(recipes.mutated, 'recipe citation is rewritten');
assert(recipes.next[0] === untouched, 'cards without the citation stay the same object');
assert(!/v1\.2/.test(recipes.next[1].notes || ''), 'stale recipe citation removed');
assert(recipes.next[1].notes?.includes(MACHINE_CARE_FALLBACK), 'recipe citation points at the real section');
assert(recipes.next[1].notes?.includes('Viscosity stays at 1.'), 'recipe note around the citation is kept');
const recipesAgain = retargetMachineCareRecipes(recipes.next, MACHINE_CARE_FALLBACK);
assert(!recipesAgain.mutated, 'recipe retarget is idempotent');

// Section 15.1 already written correctly must not be eaten by the v1.2 matcher.
const correct = 'Frozen machine nightly close — Section 15.1.';
const kept = applyOpsManualV9([
  { id: 's-14', number: 14, title: 'Restocking', content: correct },
]);
assert(!kept.mutated && kept.next[0].content === correct, 'a real Section 15.1 reference is left alone');

// ── db.ts wires v9 without replacing the recipe book ──
const dbSrc = readFileSync(new URL('../services/db.ts', import.meta.url), 'utf8');
assert(/const CONTENT_DEFAULTS_VERSION = 9;/.test(dbSrc), 'content_version is v9');
assert(/applyOpsManualV9\(/.test(dbSrc), 'globalSync applies the v9 manual patch');
assert(/appendTacoReheatToManual\(/.test(dbSrc), 'v8 taco reheat append still runs');
assert(/cloudContentVersion < 7/.test(dbSrc), 'food-close section replace stays gated below v7');
assert(/retargetMachineCareRecipes\(/.test(dbSrc), 'recipe citations are retargeted in place');
assert(!/remoteSet\(DOC_KEYS\.RECIPES,\s*defaults\.recipes\)/.test(dbSrc), 'do not write the seed recipe book over live cards');
assert(/pickMachineCareReference\(/.test(dbSrc), 'machine-care pointer uses the live section when it is the real one');

console.log('ops manual v9: ok');
