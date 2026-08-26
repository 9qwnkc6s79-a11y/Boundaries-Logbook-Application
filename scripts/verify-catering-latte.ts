/**
 * Smoke: locked 96oz catering latte pours only.
 * Regular cup-size lattes stay 2 oz espresso / 1 oz syrup. No 64oz card.
 * Run: npx --yes tsx scripts/verify-catering-latte.ts
 */
import { readFileSync } from 'node:fs';
import { BOUNDARIES_RECIPES } from '../data/recipes_new.ts';
import type { Recipe } from '../types.ts';

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

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

const catering = BOUNDARIES_RECIPES.find(r => r.id === 'r-catering-latte-96');
assert(catering, 'missing r-catering-latte-96');
assert(catering.category === 'Lattes', 'catering latte must live under Lattes');
assert(catering.type === 'STANDARD', 'catering latte must use STANDARD so it shows in the Recipe book');
assert(/96oz Catering Latte/i.test(catering.title), 'title must be the 96oz catering latte');

const text = recipeText(catering);
assert(/14 oz espresso \(7 doubles\)/i.test(text), 'espresso must be 14 oz (7 doubles)');
assert(/7 oz syrup/i.test(text), 'syrup must be 7 oz');
assert(/75 oz milk/i.test(text), 'milk must be 75 oz');
assert(/no ice/i.test(text), 'must say no ice');
assert(/96 oz liquid in the jug/i.test(text), 'must say 96 oz liquid in the jug');
assert(/3\.5 oz \+ 3\.5 oz/i.test(text), 'split flavor must be 3.5 oz + 3.5 oz');
assert(/280 g/i.test(text), 'sauce instead of syrup must be 280 g');
assert(/20oz iced liquid mix/i.test(text), 'must name the 20oz iced liquid mix scale');

assert(!BOUNDARIES_RECIPES.some(r => r.id === 'r-catering-latte-64'), 'do not add a 64oz catering card');
assert(
  !BOUNDARIES_RECIPES.some(r => /64\s*oz catering/i.test(recipeText(r))),
  'do not invent a 64oz catering pour'
);
assert(
  !BOUNDARIES_RECIPES.some(r => r.id.startsWith('r-catering-') && r.id !== 'r-catering-latte-96'),
  'only the locked 96oz catering latte — no hot/matcha/other catering cards'
);

const latteBuild = BOUNDARIES_RECIPES.find(r => r.id === 'r-latte-build')!;
assert(latteBuild.steps?.includes('1 oz total syrup/sauce (ALL sizes, ALL temperatures)'), 'regular latte syrup stay 1 oz');
assert(latteBuild.steps?.includes('2 oz espresso (ALL sizes)'), 'regular latte espresso stay 2 oz');
assert(/Hot: 12oz, 16oz \| Iced: 16oz, 20oz/.test(latteBuild.notes || ''), 'regular latte sizes unchanged');

const latteMilk = BOUNDARIES_RECIPES.find(r => r.id === 'r-latte-milk')!;
assert(latteMilk.gridRows?.length === 4, 'latte milk card stays the four regular sizes');
assert(latteMilk.gridRows?.some(row => row.label === 'Iced 20oz' && row.values[0] === 'Fill to 14 oz line'), 'iced 20oz milk line unchanged');
assert(!latteMilk.gridRows?.some(row => /96|64|catering/i.test(row.label)), 'do not put catering on the regular milk card');

const shotStandards = BOUNDARIES_RECIPES.find(r => r.id === 'r-shot-standards')!;
assert(shotStandards.gridRows?.some(row => row.label === 'Hot Lattes (all sizes)' && row.values[0] === '2 oz'), 'hot latte shots stay 2 oz');
assert(shotStandards.gridRows?.some(row => row.label === 'Iced Lattes (all sizes)' && row.values[0] === '2 oz'), 'iced latte shots stay 2 oz');

const syrupMaster = BOUNDARIES_RECIPES.find(r => r.id === 'r-qr-syrup')!;
const latteSyrup = syrupMaster.gridRows?.find(row => row.label === 'Lattes');
assert(latteSyrup?.values.join(',') === '1 oz,1 oz,1 oz,—', 'master syrup table latte row unchanged');

const dbSrc = readFileSync(new URL('../services/db.ts', import.meta.url), 'utf8');
assert(/const CONTENT_DEFAULTS_VERSION = 7;/.test(dbSrc), 'do not bump CONTENT_DEFAULTS_VERSION (that overwrites the book)');

console.log('verify-catering-latte: ok');
