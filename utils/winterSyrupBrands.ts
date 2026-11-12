import type { InventoryCount, InventoryItem, Lesson, Recipe, TrainingModule } from '../types';

/**
 * Daniel, Nov 12 2026: winter syrup brands.
 * Cupcake is the existing Monin cupcake (vendor TSB, brand Monin). There is no Torani Cupcake.
 * SF dark chocolate is 1883, on the same TSB vendor as every other 1883 syrup (shown TSB · 1883).
 * Peppermint is already 1883. Torani SF Peppermint is not carried.
 * Gingerbread is 1883, not the older Monin line.
 *
 * Stored inventory is one array per store. Counts are keyed by item id.
 * Renames keep the id so pars and counts stay put. Replacements collapse the
 * wrong id onto the surviving id and move a count only when that sheet has
 * no number for the survivor. A par already set on the survivor is kept.
 */

export const CUPCAKE_MONIN_ID = 'inv-syrup-cupcake';
export const CUPCAKE_TORANI_ID = 'inv-seasonal-cupcake-torani';
export const GINGERBREAD_1883_ID = 'inv-seasonal-gingerbread-1883';
export const GINGERBREAD_MONIN_ID = 'inv-seasonal-gingerbread';
export const PEPPERMINT_1883_ID = 'inv-seasonal-peppermint';
export const SF_PEPPERMINT_TORANI_ID = 'inv-seasonal-sf-peppermint-torani';
export const SF_DARK_CHOCOLATE_ID = 'inv-sauce-sf-dark-chocolate';

export const SF_PEPPERMINT_SOURCE_TODO =
  'TODO: SF peppermint source is undecided (Daniel, Nov 12 2026). Do not substitute a syrup until Daniel decides.';

const CUPCAKE_LABEL: Partial<InventoryItem> = {
  name: 'Cupcake (Monin)',
  brand: 'Monin',
  vendor: 'TSB',
};

const GINGERBREAD_LABEL: Partial<InventoryItem> = {
  name: 'Gingerbread (1883)',
  brand: '1883',
  vendor: 'TSB',
};

const PEPPERMINT_LABEL: Partial<InventoryItem> = {
  name: 'Peppermint (1883)',
  brand: '1883',
  vendor: 'TSB',
};

const SF_DARK_CHOCOLATE_LABEL: Partial<InventoryItem> = {
  name: 'Sugar-Free Dark Chocolate (1883)',
  brand: '1883',
  vendor: 'TSB',
  category: 'Seasonal Syrups',
};

/** Wrong id -> survivor id. null drops the count key (no product to map it to). */
export const WINTER_COUNT_KEY_REMAP: Record<string, string | null> = {
  [CUPCAKE_TORANI_ID]: CUPCAKE_MONIN_ID,
  [GINGERBREAD_MONIN_ID]: GINGERBREAD_1883_ID,
  [SF_PEPPERMINT_TORANI_ID]: null,
};

const LABEL_KEYS = ['name', 'brand', 'vendor', 'category'] as const;

function applyLabel(item: InventoryItem, label: Partial<InventoryItem>): { item: InventoryItem; changed: boolean } {
  let changed = false;
  const next: InventoryItem = { ...item };
  for (const key of LABEL_KEYS) {
    const value = label[key];
    if (value !== undefined && next[key] !== value) {
      next[key] = value;
      changed = true;
    }
  }
  return { item: next, changed };
}

function labelById(items: InventoryItem[], id: string, label: Partial<InventoryItem>): { items: InventoryItem[]; changed: boolean } {
  const idx = items.findIndex(item => item.id === id);
  if (idx === -1) return { items, changed: false };
  const applied = applyLabel(items[idx], label);
  if (!applied.changed) return { items, changed: false };
  const next = items.slice();
  next[idx] = applied.item;
  return { items: next, changed: true };
}

/**
 * Drop `fromId`. If the survivor is missing, the old row becomes it and keeps its par.
 * If both exist, the survivor keeps a par that is already set; a 0 par takes the old par.
 */
function collapseItem(
  items: InventoryItem[],
  fromId: string,
  toId: string,
  toLabel: Partial<InventoryItem>,
): { items: InventoryItem[]; changed: boolean } {
  const fromIdx = items.findIndex(item => item.id === fromId);
  if (fromIdx === -1) return { items, changed: false };
  const from = items[fromIdx];
  const toIdx = items.findIndex(item => item.id === toId);
  if (toIdx === -1) {
    const renamed = applyLabel({ ...from, id: toId }, toLabel).item;
    const next = items.slice();
    next[fromIdx] = renamed;
    return { items: next, changed: true };
  }
  let survivor = applyLabel(items[toIdx], toLabel).item;
  if (!(survivor.par > 0) && from.par > 0) {
    survivor = { ...survivor, par: from.par };
  }
  const next = items
    .filter(item => item.id !== fromId)
    .map(item => (item.id === toId ? survivor : item));
  return { items: next, changed: true };
}

function removeItem(items: InventoryItem[], id: string): { items: InventoryItem[]; changed: boolean } {
  if (!items.some(item => item.id === id)) return { items, changed: false };
  return { items: items.filter(item => item.id !== id), changed: true };
}

export function correctWinterInventory(items: InventoryItem[]): { items: InventoryItem[]; mutated: boolean } {
  let next = items;
  let mutated = false;
  const step = (result: { items: InventoryItem[]; changed: boolean }) => {
    if (!result.changed) return;
    next = result.items;
    mutated = true;
  };

  step(labelById(next, PEPPERMINT_1883_ID, PEPPERMINT_LABEL));
  step(labelById(next, GINGERBREAD_1883_ID, GINGERBREAD_LABEL));
  step(labelById(next, CUPCAKE_MONIN_ID, CUPCAKE_LABEL));
  step(labelById(next, SF_DARK_CHOCOLATE_ID, SF_DARK_CHOCOLATE_LABEL));
  step(collapseItem(next, CUPCAKE_TORANI_ID, CUPCAKE_MONIN_ID, CUPCAKE_LABEL));
  step(collapseItem(next, GINGERBREAD_MONIN_ID, GINGERBREAD_1883_ID, GINGERBREAD_LABEL));
  step(removeItem(next, SF_PEPPERMINT_TORANI_ID));

  return { items: next, mutated };
}

export function remapWinterCountKeys(counts: Record<string, number>): { counts: Record<string, number>; mutated: boolean } {
  let mutated = false;
  const next: Record<string, number> = { ...counts };
  for (const [fromId, toId] of Object.entries(WINTER_COUNT_KEY_REMAP)) {
    if (!(fromId in next)) continue;
    const qty = next[fromId];
    delete next[fromId];
    if (toId && !(toId in next)) next[toId] = qty;
    mutated = true;
  }
  return { counts: next, mutated };
}

export function remapWinterInventoryCounts(counts: InventoryCount[]): { counts: InventoryCount[]; mutated: boolean } {
  let mutated = false;
  const next = counts.map(count => {
    const remapped = remapWinterCountKeys(count.counts);
    if (!remapped.mutated) return count;
    mutated = true;
    return { ...count, counts: remapped.counts };
  });
  return { counts: mutated ? next : counts, mutated };
}

export function correctWinterBrandText(text: string): string {
  return text
    .replace(/Monin SF Dark Chocolate Sauce/gi, 'Sugar-Free Dark Chocolate (1883)')
    .replace(/SF Dark Chocolate Sauce \(Monin\)/gi, 'Sugar-Free Dark Chocolate (1883)')
    .replace(/Monin SF Dark Chocolate/gi, 'Sugar-Free Dark Chocolate (1883)')
    .replace(/SF Dark Chocolate \(Monin\)/gi, 'Sugar-Free Dark Chocolate (1883)')
    .replace(/Gingerbread \(Monin\)/gi, 'Gingerbread (1883)')
    .replace(/Monin Gingerbread/gi, 'Gingerbread (1883)')
    .replace(/Cupcake \(Torani\)/gi, 'Cupcake (Monin)')
    .replace(/Torani Cupcake/gi, 'Cupcake (Monin)')
    .replace(/SF Peppermint \(Torani\)/gi, 'SF peppermint (source undecided)')
    .replace(/Torani SF Peppermint/gi, 'SF peppermint (source undecided)');
}

function recipeBlob(recipe: Recipe): string {
  return [
    recipe.title,
    recipe.notes || '',
    recipe.dose || '',
    recipe.yield || '',
    recipe.time || '',
    ...(recipe.steps || []),
    ...(recipe.ingredients || []).map(ingredient => `${ingredient.quantity} ${ingredient.name}`),
    ...(recipe.gridColumns || []),
    ...(recipe.gridRows || []).flatMap(row => [row.label, ...row.values]),
  ].join('\n');
}

/** SF Peppermint Mocha card, including a Peppermint Mocha card that has an SF option. */
export function textIsSfPeppermintMocha(text: string): boolean {
  if (/sugar-?free peppermint mocha|sf peppermint mocha/i.test(text)) return true;
  return /peppermint mocha/i.test(text) && /sugar-?free|\bSF\b/i.test(text);
}

function isSfPeppermintMocha(recipe: Recipe): boolean {
  return textIsSfPeppermintMocha(recipeBlob(recipe));
}

function mapText(value: string | undefined): { value: string | undefined; changed: boolean } {
  if (value === undefined) return { value, changed: false };
  const next = correctWinterBrandText(value);
  return { value: next, changed: next !== value };
}

export function correctWinterRecipes(recipes: Recipe[]): { recipes: Recipe[]; mutated: boolean } {
  let mutated = false;
  const next = recipes.map(recipe => {
    let changed = false;
    const title = mapText(recipe.title);
    const notes = mapText(recipe.notes);
    const dose = mapText(recipe.dose);
    const yieldText = mapText(recipe.yield);
    const time = mapText(recipe.time);
    changed = changed || title.changed || notes.changed || dose.changed || yieldText.changed || time.changed;

    let steps = recipe.steps;
    if (steps) {
      const mapped = steps.map(step => correctWinterBrandText(step));
      if (mapped.some((step, idx) => step !== steps![idx])) {
        steps = mapped;
        changed = true;
      }
    }

    let ingredients = recipe.ingredients;
    if (ingredients) {
      const mapped = ingredients.map(ingredient => {
        const name = correctWinterBrandText(ingredient.name);
        const quantity = correctWinterBrandText(ingredient.quantity);
        return name === ingredient.name && quantity === ingredient.quantity
          ? ingredient
          : { ...ingredient, name, quantity };
      });
      if (mapped.some((ingredient, idx) => ingredient !== ingredients![idx])) {
        ingredients = mapped;
        changed = true;
      }
    }

    let gridColumns = recipe.gridColumns;
    if (gridColumns) {
      const mapped = gridColumns.map(column => correctWinterBrandText(column));
      if (mapped.some((column, idx) => column !== gridColumns![idx])) {
        gridColumns = mapped;
        changed = true;
      }
    }

    let gridRows = recipe.gridRows;
    if (gridRows) {
      const mapped = gridRows.map(row => {
        const label = correctWinterBrandText(row.label);
        const values = row.values.map(value => correctWinterBrandText(value));
        const valuesChanged = values.some((value, idx) => value !== row.values[idx]);
        return label === row.label && !valuesChanged ? row : { ...row, label, values };
      });
      if (mapped.some((row, idx) => row !== gridRows![idx])) {
        gridRows = mapped;
        changed = true;
      }
    }

    let nextNotes = notes.value;
    if (isSfPeppermintMocha(recipe) && !(nextNotes || '').includes('TODO: SF peppermint source')) {
      nextNotes = nextNotes
        ? `${nextNotes}\n${SF_PEPPERMINT_SOURCE_TODO}`
        : SF_PEPPERMINT_SOURCE_TODO;
      changed = true;
    }

    if (!changed) return recipe;
    mutated = true;
    return {
      ...recipe,
      title: title.value ?? recipe.title,
      notes: nextNotes,
      dose: dose.value,
      yield: yieldText.value,
      time: time.value,
      steps,
      ingredients,
      gridColumns,
      gridRows,
    };
  });
  return { recipes: mutated ? next : recipes, mutated };
}

function correctLesson(lesson: Lesson): { lesson: Lesson; changed: boolean } {
  let changed = false;
  const title = mapText(lesson.title);
  const content = mapText(lesson.content);
  const fileLabel = mapText(lesson.fileLabel);
  changed = title.changed || content.changed || fileLabel.changed;

  let quizQuestions = lesson.quizQuestions;
  if (quizQuestions) {
    const mapped = quizQuestions.map(question => {
      const qText = correctWinterBrandText(question.question);
      const explanation = question.explanation ? correctWinterBrandText(question.explanation) : question.explanation;
      const options = question.options?.map(option => correctWinterBrandText(option));
      const correctAnswers = question.correctAnswers.map(answer => correctWinterBrandText(answer));
      const optionsChanged = !!options && options.some((option, idx) => option !== question.options![idx]);
      const answersChanged = correctAnswers.some((answer, idx) => answer !== question.correctAnswers[idx]);
      if (qText === question.question && explanation === question.explanation && !optionsChanged && !answersChanged) {
        return question;
      }
      return { ...question, question: qText, explanation, options, correctAnswers };
    });
    if (mapped.some((question, idx) => question !== quizQuestions![idx])) {
      quizQuestions = mapped;
      changed = true;
    }
  }

  let checklistItems = lesson.checklistItems;
  if (checklistItems) {
    const mapped = checklistItems.map(item => {
      const itemTitle = correctWinterBrandText(item.title);
      const description = item.description ? correctWinterBrandText(item.description) : item.description;
      return itemTitle === item.title && description === item.description
        ? item
        : { ...item, title: itemTitle, description };
    });
    if (mapped.some((item, idx) => item !== checklistItems![idx])) {
      checklistItems = mapped;
      changed = true;
    }
  }

  let nextContent = content.value;
  const lessonBlob = [lesson.title, lesson.content || ''].join('\n');
  if (textIsSfPeppermintMocha(lessonBlob) && !(nextContent || '').includes('TODO: SF peppermint source')) {
    nextContent = nextContent ? `${nextContent}\n${SF_PEPPERMINT_SOURCE_TODO}` : SF_PEPPERMINT_SOURCE_TODO;
    changed = true;
  }

  if (!changed) return { lesson, changed: false };
  return {
    lesson: {
      ...lesson,
      title: title.value ?? lesson.title,
      content: nextContent,
      fileLabel: fileLabel.value,
      quizQuestions,
      checklistItems,
    },
    changed: true,
  };
}

export function correctWinterCurriculum(modules: TrainingModule[]): { modules: TrainingModule[]; mutated: boolean } {
  let mutated = false;
  const next = modules.map(module => {
    let changed = false;
    const title = mapText(module.title);
    const description = mapText(module.description);
    changed = title.changed || description.changed;
    const lessons = module.lessons.map(lesson => {
      const corrected = correctLesson(lesson);
      if (corrected.changed) changed = true;
      return corrected.lesson;
    });
    if (!changed) return module;
    mutated = true;
    return {
      ...module,
      title: title.value ?? module.title,
      description: description.value ?? module.description,
      lessons,
    };
  });
  return { modules: mutated ? next : modules, mutated };
}
