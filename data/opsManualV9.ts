import { ManualSection, Recipe } from '../types';

/** Idempotency marker for the §12 supplier subsection. */
export const TACO_SUPPLIER_HEADING = '### Supplier & menu';

/** Idempotency marker for the §7 Dirty Sodas subsection. */
export const DIRTY_SODAS_HEADING = '### 7.4 Dirty Sodas';

/** Idempotency marker for the §7 fall frozen subsection. */
export const FALL_FROZEN_HEADING = '### 7.5 Fall Frozen Pumpkin Pie';

/**
 * Stale Drive citation. The in-app machine-care writeup is not Ops Manual v1.2.
 * Matched only as a whole citation so a correct "Section 15.1" is left alone.
 */
export const STALE_MACHINE_CARE_REF = /Ops Manual v1\.2\s*\/\s*Section 15(?:\.1)?/gi;

/**
 * Seed fallback when neither the live manual nor the seed contains a
 * machine-care section. Matches BOUNDARIES_MANUAL §15.
 */
export const MACHINE_CARE_FALLBACK =
  'Ops Manual Section 15 (Maintenance & Equipment Care) — 15.1 Frozen Machine (Spaceman 6455-CL)';

export const TACO_SUPPLIER_MD = `${TACO_SUPPLIER_HEADING}
Tacos are supplied by Tacos y Rocky and delivered weekly to each store (since Oct 2, 2026). Refrigerate on arrival.

| Item | Menu price | Flavors |
| :--- | :--- | :--- |
| Breakfast Taco | $4.50 | Wagyu Barbacoa, Sausage, and Potato Egg & Cheese |
| Lunch Taco | $4.25 | Flavors TBD |

Reheat only on the TurboChef program in Section 12. Daniel sets the oven buttons, and staff never change them.`;

export const DIRTY_SODAS_MD = `${DIRTY_SODAS_HEADING}
Launched Oct 3, 2026.

**Base**: Pepsi, Pepsi Zero Sugar, or Dr Pepper. Cream = Coffee Mate.

| Drink | Build |
| :--- | :--- |
| Cowboy Cola | Pepsi + Vanilla + Coconut + Cream |
| Peaches & Cream DP | Dr Pepper + White Peach + Vanilla + Cream |
| Strawberry Sunset DP | Dr Pepper + Strawberry + Cream |
| Cake Pop Cola | Pepsi + Cupcake |

Syrup amount by size follows the Recipe Book **Syrup by Drink Size** table. Multi-flavor drinks split it equally.

**Prices**: K $3.25 / S $3.75 / M $4.50 / L $5.25.

Cup sizes and creamer amounts are pending.`;

export const FALL_FROZEN_MD = `${FALL_FROZEN_HEADING}
Fall Frozen Pumpkin Pie = 30 g Hollander Pumpkin Pie sauce + 10 g white chocolate, cinnamon, no whip, dairy only.

Frozen coffee is the only product on the Spaceman 6455-CL. Frozen energy and lemonade are blended to order.`;

function isSection(section: ManualSection, id: string, number: number): boolean {
  return section.id === id || Number(section.number) === number;
}

function appendIfMissing(
  section: ManualSection,
  heading: string,
  block: string,
): { section: ManualSection; mutated: boolean } {
  const content = section.content || '';
  if (content.includes(heading)) return { section, mutated: false };
  return {
    section: { ...section, content: `${content.replace(/\s+$/, '')}\n\n${block}` },
    mutated: true,
  };
}

/** The live machine-care section: id s-15, else §15 equipment care, else the Spaceman 15.1 writeup. */
export function findMachineCareSection(sections: ManualSection[]): ManualSection | undefined {
  if (!Array.isArray(sections)) return undefined;
  return (
    sections.find(section => section.id === 's-15') ||
    sections.find(section => Number(section.number) === 15 && /equipment|maintenance/i.test(section.title || '')) ||
    sections.find(section => /15\.1/.test(section.content || '') && /Spaceman 6455-CL/.test(section.content || ''))
  );
}

/**
 * Pointer used when patching. Prefer a live section that actually contains
 * the 15.1 Spaceman care writeup (so a renumber sticks). Otherwise use the
 * seed section, which is the real machine-care section.
 */
export function pickMachineCareReference(live: ManualSection[], seed: ManualSection[]): string {
  const liveRef = Array.isArray(live) && live.length > 0 ? resolveMachineCareReference(live) : null;
  const seedRef = resolveMachineCareReference(seed);
  if (liveRef && liveRef.includes('15.1')) return liveRef;
  return seedRef || liveRef || MACHINE_CARE_FALLBACK;
}

/** Pointer at the real machine-care section, using that section's own number and title. */
export function resolveMachineCareReference(sections: ManualSection[]): string | null {
  const section = findMachineCareSection(sections);
  if (!section) return null;
  const title = (section.title || 'Maintenance & Equipment Care').trim();
  const hasFrozenCare = /15\.1/.test(section.content || '') && /6455-CL/.test(section.content || '');
  const suffix = hasFrozenCare ? ' — 15.1 Frozen Machine (Spaceman 6455-CL)' : '';
  return `Ops Manual Section ${section.number} (${title})${suffix}`;
}

export function retargetMachineCareText(text: string, reference: string): string {
  if (!text || !reference) return text;
  // Fresh regex so a shared /g pattern cannot skip matches via lastIndex.
  return text.replace(new RegExp(STALE_MACHINE_CARE_REF.source, 'gi'), reference);
}

function retargetSection(
  section: ManualSection,
  reference: string,
): { section: ManualSection; mutated: boolean } {
  const content = section.content || '';
  const next = retargetMachineCareText(content, reference);
  if (next === content) return { section, mutated: false };
  return { section: { ...section, content: next }, mutated: true };
}

/**
 * Append-only v9 Ops Manual patch. Existing section text stays put.
 * Adds §12 Supplier & menu and §7 Dirty Sodas / Fall Frozen Pumpkin Pie
 * when those headings are missing, and rewrites a stale v1.2 machine-care
 * citation to the live machine-care section.
 */
export function applyOpsManualV9(
  live: ManualSection[],
  machineCareRef?: string,
): { next: ManualSection[]; mutated: boolean } {
  if (!Array.isArray(live) || live.length === 0) return { next: live, mutated: false };
  const reference = machineCareRef || resolveMachineCareReference(live) || MACHINE_CARE_FALLBACK;
  let mutated = false;
  const next = live.map(section => {
    let current = section;
    if (isSection(section, 's-12', 12)) {
      const added = appendIfMissing(current, TACO_SUPPLIER_HEADING, TACO_SUPPLIER_MD);
      current = added.section;
      mutated = mutated || added.mutated;
    }
    if (isSection(section, 's-7', 7)) {
      const sodas = appendIfMissing(current, DIRTY_SODAS_HEADING, DIRTY_SODAS_MD);
      const frozen = appendIfMissing(sodas.section, FALL_FROZEN_HEADING, FALL_FROZEN_MD);
      current = frozen.section;
      mutated = mutated || sodas.mutated || frozen.mutated;
    }
    const retargeted = retargetSection(current, reference);
    if (retargeted.mutated) mutated = true;
    return retargeted.section;
  });
  return { next: mutated ? next : live, mutated };
}

function retargetRecipe(recipe: Recipe, reference: string): { recipe: Recipe; mutated: boolean } {
  let mutated = false;
  const fix = (value: string | undefined): string | undefined => {
    if (value == null) return value;
    const next = retargetMachineCareText(value, reference);
    if (next !== value) mutated = true;
    return next;
  };

  const title = fix(recipe.title) as string;
  const category = fix(recipe.category) as string;
  const notes = fix(recipe.notes);
  const dose = fix(recipe.dose);
  const yieldAmount = fix(recipe.yield);
  const time = fix(recipe.time);
  const ingredients = recipe.ingredients?.map(item => ({
    ...item,
    name: fix(item.name) as string,
    quantity: fix(item.quantity) as string,
  }));
  const steps = recipe.steps?.map(step => fix(step) as string);
  const gridColumns = recipe.gridColumns?.map(column => fix(column) as string);
  const gridRows = recipe.gridRows?.map(row => ({
    ...row,
    label: fix(row.label) as string,
    values: row.values.map(value => fix(value) as string),
  }));

  if (!mutated) return { recipe, mutated: false };
  return {
    recipe: {
      ...recipe,
      title,
      category,
      notes,
      dose,
      yield: yieldAmount,
      time,
      ingredients,
      steps,
      gridColumns,
      gridRows,
    },
    mutated: true,
  };
}

/**
 * Rewrite a stale "Ops Manual v1.2 / Section 15" citation inside live recipe
 * cards. Cards without that citation are returned unchanged. Never replaces
 * the book with seed recipes.
 */
export function retargetMachineCareRecipes(
  recipes: Recipe[],
  reference: string,
): { next: Recipe[]; mutated: boolean } {
  if (!Array.isArray(recipes) || recipes.length === 0 || !reference) {
    return { next: recipes, mutated: false };
  }
  let mutated = false;
  const next = recipes.map(recipe => {
    const updated = retargetRecipe(recipe, reference);
    if (updated.mutated) mutated = true;
    return updated.recipe;
  });
  return { next: mutated ? next : recipes, mutated };
}
