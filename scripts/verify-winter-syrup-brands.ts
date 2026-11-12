/**
 * Daniel Nov 12 2026 winter syrup brands.
 * Run: npx --yes tsx scripts/verify-winter-syrup-brands.ts
 */
import { readFileSync } from 'node:fs';
import { SEED_INVENTORY } from '../data/inventoryItems.ts';
import { TRAINING_CURRICULUM } from '../data/mockData.ts';
import { BOUNDARIES_RECIPES } from '../data/recipes_new.ts';
import type { InventoryCount, InventoryItem, Recipe, TrainingModule } from '../types.ts';
import {
  CUPCAKE_MONIN_ID,
  CUPCAKE_TORANI_ID,
  GINGERBREAD_1883_ID,
  GINGERBREAD_MONIN_ID,
  PEPPERMINT_1883_ID,
  SF_DARK_CHOCOLATE_ID,
  SF_PEPPERMINT_SOURCE_TODO,
  SF_PEPPERMINT_TORANI_ID,
  correctWinterBrandText,
  correctWinterCurriculum,
  correctWinterInventory,
  correctWinterRecipes,
  remapWinterInventoryCounts,
} from '../utils/winterSyrupBrands.ts';

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

const REMOVED_IDS = [CUPCAKE_TORANI_ID, GINGERBREAD_MONIN_ID, SF_PEPPERMINT_TORANI_ID];

function item(partial: Partial<InventoryItem> & Pick<InventoryItem, 'id' | 'name'>): InventoryItem {
  return {
    category: 'Seasonal Syrups',
    storageLocation: 'Dry Storage',
    vendor: 'TSB',
    par: 0,
    unit: 'bottles',
    active: true,
    sortOrder: 1,
    ...partial,
  };
}

function blob(recipe: Recipe): string {
  return [
    recipe.title,
    recipe.notes || '',
    ...(recipe.steps || []),
    ...(recipe.ingredients || []).map(ingredient => `${ingredient.quantity} ${ingredient.name}`),
    ...(recipe.gridRows || []).flatMap(row => [row.label, ...row.values]),
  ].join('\n');
}

// ── Seed: both stores, corrected labels, no leftover wrong SKUs ──
for (const storeId of ['store-prosper', 'store-elm'] as const) {
  const items = SEED_INVENTORY[storeId];
  assert(items, `missing seed for ${storeId}`);
  const names = items.map(entry => `${entry.name} ${entry.brand || ''}`).join('\n');
  assert(!/Cupcake \(Torani\)|Torani Cupcake/i.test(names), `${storeId} still has Torani Cupcake`);
  assert(!/SF Peppermint \(Torani\)|Torani SF Peppermint/i.test(names), `${storeId} still has Torani SF Peppermint`);
  assert(!/SF Dark Chocolate Sauce \(Monin\)|Monin SF Dark Chocolate/i.test(names), `${storeId} still has Monin SF Dark Chocolate`);
  assert(!items.some(entry => entry.id === GINGERBREAD_MONIN_ID || /Gingerbread \(Monin\)/.test(entry.name)), `${storeId} still has Monin Gingerbread`);
  for (const id of REMOVED_IDS) {
    assert(!items.some(entry => entry.id === id), `${storeId} still seeds ${id}`);
  }

  const cupcakes = items.filter(entry => /cupcake/i.test(entry.name));
  assert(cupcakes.length === 1 && cupcakes[0].id === CUPCAKE_MONIN_ID, `${storeId} cupcake should be the one Monin row`);
  assert(cupcakes[0].name === 'Cupcake (Monin)' && cupcakes[0].brand === 'Monin' && cupcakes[0].vendor === 'TSB', 'Monin cupcake vendor');

  const ginger = items.filter(entry => /gingerbread/i.test(entry.name));
  assert(ginger.length === 1 && ginger[0].id === GINGERBREAD_1883_ID, `${storeId} gingerbread should be the one 1883 row`);
  assert(ginger[0].name === 'Gingerbread (1883)' && ginger[0].brand === '1883' && ginger[0].vendor === 'TSB', '1883 gingerbread vendor');

  const peppermint = items.find(entry => entry.id === PEPPERMINT_1883_ID);
  assert(peppermint?.name === 'Peppermint (1883)' && peppermint.brand === '1883' && peppermint.vendor === 'TSB', 'peppermint stays 1883');

  const sfDark = items.find(entry => entry.id === SF_DARK_CHOCOLATE_ID);
  assert(sfDark?.name === 'Sugar-Free Dark Chocolate (1883)', 'sf dark chocolate name');
  assert(sfDark?.brand === '1883' && sfDark.vendor === 'TSB', '1883 stays on the TSB vendor');
  assert(sfDark?.category === 'Seasonal Syrups', 'sf dark chocolate is a syrup');
  assert(sfDark?.unit === 'bottles', 'sf dark chocolate unit');

  const prosper = storeId === 'store-prosper';
  assert(cupcakes[0].par === (prosper ? 4 : 0), 'seed cupcake par');
  assert(ginger[0].par === (prosper ? 2 : 0), 'seed gingerbread par');
  assert(peppermint?.par === (prosper ? 3 : 0), 'seed peppermint par');
  assert(sfDark?.par === (prosper ? 1 : 0), 'seed sf dark chocolate par');

  const yearRoundSf = items.find(entry => entry.id === 'inv-syrup-sf-chocolate');
  assert(yearRoundSf?.name === 'Sugar Free Chocolate (Monin)' && yearRoundSf.brand === 'Monin', 'do not rename year-round Monin sugar free chocolate');
  assert(items.some(entry => entry.id === 'inv-seasonal-shortbread-torani' && entry.brand === 'Torani'), 'leave Shortbread (Torani)');
  assert(items.some(entry => entry.id === 'inv-seasonal-orange-torani'), 'leave Orange (Torani)');
  assert(items.some(entry => entry.id === 'inv-seasonal-peanutbutter'), 'leave Peanut Butter (Monin)');

  const corrected = correctWinterInventory(items);
  assert(!corrected.mutated, `${storeId} seed is already corrected`);
  assert(corrected.items === items, `${storeId} seed correction keeps the same array`);
}

// ── Stored rows: pars and counts map, old names do not linger ──
function storedRows(sfDarkPar: number, cupcakePar: number): InventoryItem[] {
  return [
    item({ id: CUPCAKE_MONIN_ID, name: 'Cupcake (Monin)', brand: 'Monin', par: cupcakePar, sortOrder: 10 }),
    item({ id: CUPCAKE_TORANI_ID, name: 'Cupcake (Torani)', brand: 'Torani', par: 1, sortOrder: 80 }),
    item({ id: GINGERBREAD_MONIN_ID, name: 'Gingerbread (Monin)', brand: 'Monin', par: 6, sortOrder: 11 }),
    item({ id: GINGERBREAD_1883_ID, name: 'Gingerbread (1883)', brand: '1883', par: 2, sortOrder: 81 }),
    item({ id: PEPPERMINT_1883_ID, name: 'Peppermint (1883)', brand: '1883', par: 3, sortOrder: 12 }),
    item({ id: SF_PEPPERMINT_TORANI_ID, name: 'SF Peppermint (Torani)', brand: 'Torani', par: 1, sortOrder: 82 }),
    item({
      id: SF_DARK_CHOCOLATE_ID,
      name: 'SF Dark Chocolate Sauce (Monin)',
      brand: 'Monin',
      category: 'Sauces',
      par: sfDarkPar,
      sortOrder: 83,
      storageLocation: 'Dry Storage',
      unit: 'bottles',
    }),
    item({ id: 'inv-syrup-sf-chocolate', name: 'Sugar Free Chocolate (Monin)', brand: 'Monin', category: 'Syrups', par: 4, sortOrder: 20 }),
    item({ id: 'inv-seasonal-shortbread-torani', name: 'Shortbread (Torani)', brand: 'Torani', par: 1, sortOrder: 84 }),
  ];
}

for (const [storeId, sfDarkPar, cupcakePar] of [
  ['store-prosper', 1, 4],
  ['store-elm', 4, 4],
] as const) {
  const fixed = correctWinterInventory(storedRows(sfDarkPar, cupcakePar));
  assert(fixed.mutated, `${storeId} stored rows should change`);
  for (const id of REMOVED_IDS) {
    assert(!fixed.items.some(entry => entry.id === id), `${storeId} kept ${id}`);
  }
  assert(fixed.items.filter(entry => /cupcake/i.test(entry.name)).length === 1, `${storeId} duplicate cupcake`);
  assert(fixed.items.filter(entry => /gingerbread/i.test(entry.name)).length === 1, `${storeId} duplicate gingerbread`);
  const cupcake = fixed.items.find(entry => entry.id === CUPCAKE_MONIN_ID);
  assert(cupcake?.par === cupcakePar && cupcake.brand === 'Monin' && cupcake.vendor === 'TSB', `${storeId} cupcake par carries on the Monin row`);
  const ginger = fixed.items.find(entry => entry.id === GINGERBREAD_1883_ID);
  assert(ginger?.par === 2 && ginger.brand === '1883' && ginger.vendor === 'TSB', `${storeId} gingerbread keeps the 1883 par`);
  const peppermint = fixed.items.find(entry => entry.id === PEPPERMINT_1883_ID);
  assert(peppermint?.par === 3 && peppermint.name === 'Peppermint (1883)', `${storeId} peppermint par stays put`);
  const sfDark = fixed.items.find(entry => entry.id === SF_DARK_CHOCOLATE_ID);
  assert(sfDark?.name === 'Sugar-Free Dark Chocolate (1883)' && sfDark.brand === '1883' && sfDark.vendor === 'TSB', `${storeId} sf dark chocolate label`);
  assert(sfDark?.par === sfDarkPar && sfDark.category === 'Seasonal Syrups' && sfDark.unit === 'bottles', `${storeId} sf dark chocolate par and id stay`);
  assert(fixed.items.find(entry => entry.id === 'inv-syrup-sf-chocolate')?.name === 'Sugar Free Chocolate (Monin)', 'year-round SF chocolate untouched');
  assert(fixed.items.find(entry => entry.id === 'inv-seasonal-shortbread-torani')?.name === 'Shortbread (Torani)', 'shortbread untouched');

  const again = correctWinterInventory(fixed.items);
  assert(!again.mutated, `${storeId} second pass is a no-op`);
}

const carried = correctWinterInventory([
  item({ id: CUPCAKE_MONIN_ID, name: 'Cupcake (Monin)', brand: 'Monin', par: 0 }),
  item({ id: CUPCAKE_TORANI_ID, name: 'Cupcake (Torani)', brand: 'Torani', par: 1 }),
  item({ id: GINGERBREAD_1883_ID, name: 'Gingerbread (1883)', brand: '1883', par: 0 }),
  item({ id: GINGERBREAD_MONIN_ID, name: 'Gingerbread (Monin)', brand: 'Monin', par: 6 }),
]);
assert(carried.items.find(entry => entry.id === CUPCAKE_MONIN_ID)?.par === 1, 'empty Monin cupcake par takes the Torani par');
assert(carried.items.find(entry => entry.id === GINGERBREAD_1883_ID)?.par === 6, 'empty 1883 gingerbread par takes the Monin par');

const renamedOnly = correctWinterInventory([
  item({ id: CUPCAKE_TORANI_ID, name: 'Cupcake (Torani)', brand: 'Torani', par: 1, sortOrder: 9 }),
]);
const renamedCupcake = renamedOnly.items.find(entry => entry.id === CUPCAKE_MONIN_ID);
assert(renamedCupcake?.par === 1 && renamedCupcake.brand === 'Monin' && renamedCupcake.sortOrder === 9, 'missing Monin row is the renamed Torani row');
assert(!renamedOnly.items.some(entry => entry.id === CUPCAKE_TORANI_ID), 'renamed row does not keep the Torani id');

// ── Counts stay on the surviving id and do not invent a peppermint count ──
const count = (id: string, storeId: string, counts: Record<string, number>): InventoryCount => ({
  id,
  storeId,
  date: '2026-11-10',
  submittedBy: 'u1',
  submittedByName: 'Alex',
  submittedAt: '2026-11-10T15:00:00.000Z',
  counts,
});

const sheets = remapWinterInventoryCounts([
  count('c1', 'store-elm', {
    [CUPCAKE_TORANI_ID]: 2,
    [CUPCAKE_MONIN_ID]: 5,
    [SF_PEPPERMINT_TORANI_ID]: 1,
    [PEPPERMINT_1883_ID]: 3,
    'inv-syrup-vanilla': 4,
  }),
  count('c2', 'store-prosper', {
    [CUPCAKE_TORANI_ID]: 2,
    [GINGERBREAD_MONIN_ID]: 6,
  }),
]);
assert(sheets.mutated && sheets.counts.length === 2, 'both count sheets are kept');
const elm = sheets.counts[0].counts;
assert(elm[CUPCAKE_MONIN_ID] === 5, 'existing Monin cupcake count wins when both were counted');
assert(!(CUPCAKE_TORANI_ID in elm), 'Torani cupcake count key is gone');
assert(!(SF_PEPPERMINT_TORANI_ID in elm), 'Torani SF Peppermint count key is gone');
assert(elm[PEPPERMINT_1883_ID] === 3, 'SF peppermint count is not added to 1883 peppermint');
assert(elm['inv-syrup-vanilla'] === 4, 'unrelated counts stay');
const prosperCounts = sheets.counts[1].counts;
assert(prosperCounts[CUPCAKE_MONIN_ID] === 2, 'Torani cupcake count moves when Monin was not counted');
assert(prosperCounts[GINGERBREAD_1883_ID] === 6, 'Monin gingerbread count moves onto 1883');
assert(!(GINGERBREAD_MONIN_ID in prosperCounts), 'Monin gingerbread count key is gone');
const sheetsAgain = remapWinterInventoryCounts(sheets.counts);
assert(!sheetsAgain.mutated, 'count remap second pass is a no-op');

// ── Recipes and Academy: bad brand names, no guessed SF peppermint syrup ──
assert(correctWinterBrandText('Sugar Free Chocolate (Monin)') === 'Sugar Free Chocolate (Monin)', 'year-round SF chocolate text stays');
assert(correctWinterBrandText('Shortbread (Torani)') === 'Shortbread (Torani)', 'shortbread text stays');
assert(correctWinterBrandText('0.5 oz 1883 Peppermint') === '0.5 oz 1883 Peppermint', 'regular 1883 peppermint stays');

const regularMocha: Recipe = {
  id: 'r-peppermint-mocha',
  title: 'Peppermint Mocha Latte',
  category: 'Seasonal',
  type: 'STANDARD',
  ingredients: [{ name: '1883 Peppermint', quantity: '0.5 oz' }],
  notes: 'Regular build',
};
const regularFixed = correctWinterRecipes([regularMocha]);
assert(!regularFixed.mutated && regularFixed.recipes[0] === regularMocha, 'regular peppermint mocha is left alone');

const sfWith1883: Recipe = {
  id: 'r-sf-pm',
  title: 'SF Peppermint Mocha',
  category: 'Seasonal',
  type: 'STANDARD',
  ingredients: [
    { name: 'Hollander Dark', quantity: '20 g' },
    { name: '1883 Peppermint', quantity: '0.5 oz' },
  ],
  notes: 'SF option uses the dark chocolate below.',
};
const keptPeppermint = sfWith1883.ingredients![1];
const sfFixed = correctWinterRecipes([sfWith1883]);
assert(sfFixed.mutated, 'SF peppermint mocha gets the TODO');
assert(sfFixed.recipes[0].ingredients![1] === keptPeppermint, 'existing peppermint source is not replaced');
assert(sfFixed.recipes[0].notes?.includes(SF_PEPPERMINT_SOURCE_TODO), 'TODO note is on the recipe');
assert(!/1883 Peppermint/.test(sfFixed.recipes[0].notes || ''), 'TODO does not name a peppermint syrup');
const sfAgain = correctWinterRecipes(sfFixed.recipes);
assert(!sfAgain.mutated, 'recipe TODO second pass is a no-op');

const sfWrong: Recipe = {
  id: 'r-sf-pm-wrong',
  title: 'Sugar-Free Peppermint Mocha',
  category: 'Seasonal',
  type: 'GRID',
  gridColumns: ['Build'],
  gridRows: [{ label: 'SF', values: ['0.5 oz Torani SF Peppermint + Monin SF Dark Chocolate'] }],
  ingredients: [
    { name: 'Cupcake (Torani)', quantity: '0.25 oz' },
    { name: 'SF Peppermint (Torani)', quantity: '0.5 oz' },
    { name: 'SF Dark Chocolate Sauce (Monin)', quantity: '20 g' },
  ],
  steps: ['Pump Torani Cupcake', 'Add Torani SF Peppermint'],
};
const wrongFixed = correctWinterRecipes([sfWrong]);
const wrongText = blob(wrongFixed.recipes[0]);
assert(!/Torani Cupcake|Cupcake \(Torani\)/i.test(wrongText), 'Torani Cupcake text is updated');
assert(wrongText.includes('Cupcake (Monin)'), 'cupcake text uses Monin');
assert(!/Monin SF Dark Chocolate|SF Dark Chocolate Sauce \(Monin\)/i.test(wrongText), 'Monin SF dark chocolate text is updated');
assert(wrongText.includes('Sugar-Free Dark Chocolate (1883)'), 'dark chocolate text uses 1883');
assert(!/Torani SF Peppermint|SF Peppermint \(Torani\)/i.test(wrongText), 'Torani SF Peppermint text is updated');
assert(!/1883 Peppermint|Monin Peppermint|Peppermint \(1883\)|Peppermint \(Monin\)/i.test(wrongText), 'SF peppermint source is not guessed');
assert(wrongText.includes('SF peppermint (source undecided)'), 'undecided peppermint stays unnamed');
assert(wrongFixed.recipes[0].notes?.includes(SF_PEPPERMINT_SOURCE_TODO), 'TODO is added instead of a syrup');

const untouched: Recipe = {
  id: 'r-latte',
  title: 'Standard Latte Build',
  category: 'Espresso',
  type: 'STANDARD',
  notes: 'No winter syrups',
};
const untouchedFixed = correctWinterRecipes([untouched, sfWrong]);
assert(untouchedFixed.recipes[0] === untouched, 'unrelated recipe object stays');

for (const recipe of BOUNDARIES_RECIPES) {
  const text = blob(recipe);
  assert(!/Torani Cupcake|Cupcake \(Torani\)|Torani SF Peppermint|SF Peppermint \(Torani\)|Monin SF Dark Chocolate|SF Dark Chocolate Sauce \(Monin\)/i.test(text), `${recipe.id} seed text still has a corrected brand`);
}
const seedRecipes = correctWinterRecipes(BOUNDARIES_RECIPES);
assert(!seedRecipes.mutated, 'seed recipe book has no SF Peppermint Mocha card to annotate');
const seedAcademy = correctWinterCurriculum(TRAINING_CURRICULUM);
assert(!seedAcademy.mutated, 'seed Academy has no winter brand text to correct');

const academy: TrainingModule[] = [{
  id: 'm-winter',
  title: 'Winter drinks',
  description: 'Use Torani Cupcake in the steamer.',
  category: 'BARISTA_SKILLS',
  lessons: [{
    id: 'l-sf',
    moduleId: 'm-winter',
    title: 'SF Peppermint Mocha',
    type: 'CONTENT',
    content: 'Chocolate is Monin SF Dark Chocolate. Peppermint is Torani SF Peppermint.',
  }, {
    id: 'l-quiz',
    moduleId: 'm-winter',
    title: 'Quiz',
    type: 'QUIZ',
    quizQuestions: [{
      id: 'q1',
      type: 'MULTIPLE_CHOICE',
      question: 'Which cupcake syrup?',
      options: ['Torani Cupcake', 'Vanilla'],
      correctAnswers: ['Torani Cupcake'],
    }],
  }],
}];
const academyFixed = correctWinterCurriculum(academy);
assert(academyFixed.mutated, 'academy text is updated');
const lesson = academyFixed.modules[0].lessons[0];
assert(lesson.content?.includes('Sugar-Free Dark Chocolate (1883)'), 'academy dark chocolate');
assert(lesson.content?.includes(SF_PEPPERMINT_SOURCE_TODO), 'academy SF peppermint mocha gets the TODO');
assert(!/Torani SF Peppermint/i.test(lesson.content || ''), 'academy does not keep Torani SF Peppermint');
assert(!/1883 Peppermint/.test(lesson.content || ''), 'academy TODO does not guess 1883 peppermint');
const quiz = academyFixed.modules[0].lessons[1].quizQuestions![0];
assert(quiz.options?.[0] === 'Cupcake (Monin)' && quiz.correctAnswers[0] === 'Cupcake (Monin)', 'quiz answer stays aligned with the option');
assert(academyFixed.modules[0].description.includes('Cupcake (Monin)'), 'module description is updated');
const academyAgain = correctWinterCurriculum(academyFixed.modules);
assert(!academyAgain.mutated, 'academy second pass is a no-op');

const plainAcademy: TrainingModule[] = [{
  id: 'm-plain',
  title: 'Latte',
  description: 'Milk and espresso',
  category: 'ONBOARDING',
  lessons: [{ id: 'l1', moduleId: 'm-plain', title: 'Build', type: 'CONTENT', content: 'Steam the milk.' }],
}];
const plainFixed = correctWinterCurriculum(plainAcademy);
assert(!plainFixed.mutated && plainFixed.modules === plainAcademy, 'unrelated academy module stays');

const dbSrc = readFileSync(new URL('../services/db.ts', import.meta.url), 'utf8');
assert(!dbSrc.includes(`'${CUPCAKE_TORANI_ID}'`), 'sync must not re-add Torani Cupcake');
assert(!dbSrc.includes(`'${SF_PEPPERMINT_TORANI_ID}'`), 'sync must not re-add Torani SF Peppermint');
assert(dbSrc.includes('correctWinterInventory'), 'sync applies the inventory correction');
assert(dbSrc.includes('remapWinterInventoryCounts'), 'sync remaps stored counts');
assert(dbSrc.includes('correctWinterRecipes'), 'sync corrects recipe text');
assert(dbSrc.includes('correctWinterCurriculum'), 'sync corrects Academy text');
assert(/const CONTENT_DEFAULTS_VERSION = 8;/.test(dbSrc), 'do not bump CONTENT_DEFAULTS_VERSION');

console.log('verify-winter-syrup-brands: ok');
