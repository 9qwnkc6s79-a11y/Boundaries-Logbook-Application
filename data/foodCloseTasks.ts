import { ChecklistTask, ChecklistTemplate, ManualSection } from '../types';

/** Closing checklist task — leftover qty + waste qty on the logbook food list. */
export const FOOD_WASTE_TASK: ChecklistTask = {
  id: 'c-food-waste',
  title: 'Enter leftover qty + waste qty on the food list (Toast food SKUs)',
  requiresPhoto: false,
};

/** Opening checklist task — GM starting qty in Toast. */
export const TOAST_QTY_OPEN_TASK: ChecklistTask = {
  id: 'o-food-toast-qty',
  title: 'GM: enter starting food qty in Toast inventory',
  requiresPhoto: false,
};

const FOOD_CLOSE_SECTION_IDS = new Set(['s-12', 's-14', 's-16']);
const FOOD_CLOSE_SECTION_NUMBERS = new Set([12, 14, 16]);

export function templateHasFoodWasteTask(template: ChecklistTemplate): boolean {
  return template.tasks.some(task =>
    task.id === 'c-food-waste' ||
    task.id === 'ct-food-waste' ||
    (/leftover qty/i.test(task.title) && /waste qty/i.test(task.title))
  );
}

export function templateHasToastQtyTask(template: ChecklistTemplate): boolean {
  return template.tasks.some(task =>
    task.id === 'o-food-toast-qty' ||
    task.id === 'ot-food-toast-qty' ||
    /starting food qty in Toast/i.test(task.title)
  );
}

export function insertFoodWasteTask(tasks: ChecklistTask[]): ChecklistTask[] {
  if (tasks.some(task =>
    task.id === 'c-food-waste' ||
    task.id === 'ct-food-waste' ||
    (/leftover qty/i.test(task.title) && /waste qty/i.test(task.title))
  )) {
    return tasks;
  }
  const after = tasks.findIndex(task => /pastry case|perishab/i.test(task.title));
  if (after >= 0) {
    return [...tasks.slice(0, after + 1), FOOD_WASTE_TASK, ...tasks.slice(after + 1)];
  }
  return [...tasks, FOOD_WASTE_TASK];
}

export function insertToastQtyTask(tasks: ChecklistTask[]): ChecklistTask[] {
  if (tasks.some(task =>
    task.id === 'o-food-toast-qty' ||
    task.id === 'ot-food-toast-qty' ||
    /starting food qty in Toast/i.test(task.title)
  )) {
    return tasks;
  }
  const after = tasks.findIndex(task => /pastry case|food qty|inventory/i.test(task.title));
  if (after >= 0) {
    return [...tasks.slice(0, after + 1), TOAST_QTY_OPEN_TASK, ...tasks.slice(after + 1)];
  }
  return [...tasks, TOAST_QTY_OPEN_TASK];
}

/** Additive close/open food-count tasks on live templates. Does not replace custom tasks. */
export function applyFoodCloseTemplatePatch(templates: ChecklistTemplate[]): {
  next: ChecklistTemplate[];
  mutated: boolean;
} {
  let mutated = false;
  const next = templates.map(template => {
    if (template.type === 'CLOSING' && !templateHasFoodWasteTask(template)) {
      mutated = true;
      return { ...template, tasks: insertFoodWasteTask(template.tasks) };
    }
    if (template.type === 'OPENING' && !templateHasToastQtyTask(template)) {
      mutated = true;
      return { ...template, tasks: insertToastQtyTask(template.tasks) };
    }
    return template;
  });
  return { next, mutated };
}

/** Replace in-app Ops Manual §12 / §14 / §16 from seed. Leaves every other live section alone. */
export function patchFoodCloseManualSections(
  live: ManualSection[],
  defaults: ManualSection[],
): ManualSection[] {
  if (!Array.isArray(live) || live.length === 0) return live;
  const defaultById = new Map(defaults.map(section => [section.id, section]));
  const defaultByNumber = new Map(defaults.map(section => [section.number, section]));
  return live.map(section => {
    if (!FOOD_CLOSE_SECTION_IDS.has(section.id) && !FOOD_CLOSE_SECTION_NUMBERS.has(section.number)) {
      return section;
    }
    return defaultById.get(section.id) || defaultByNumber.get(section.number) || section;
  });
}
