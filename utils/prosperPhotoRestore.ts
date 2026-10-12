import { ChecklistTemplate } from '../types';

/**
 * One-time restore: mapped Prosper checklist tasks that currently require
 * no photo get requiresPhoto + requiredPhotos. Never lowers an existing
 * count, never invents tasks, and leaves every other store untouched.
 */

export const PROSPER_PHOTO_RESTORE_KEY = 'templateRematch-prosper-photos-v1';

/** Live Prosper task ids → photo count to restore when the task has none. */
export const PROSPER_PHOTO_TASKS: Record<string, number> = {
  't-1786903547445': 1, // Wipe and clean espresso machine
  't-1786903641211': 1, // Sweep and mop floors
  't-1786903677845': 1, // Prepare DoorDash bags
  't-1784757330315': 1, // Set out pastries
  't-1784757884036': 1, // Wash pastry case/trays
  't-1784757697336': 1, // Sweep and mop entire store
  't-1784757659569': 1, // Clean and sanitize bar surfaces
};

const STORE_PROSPER = 'store-prosper';

/**
 * Raise photo requirements on mapped store-prosper tasks whose current
 * count is 0. Other templates are the same object. Only templates that
 * actually change are cloned.
 */
export function applyProsperPhotoRestore(
  templates: ChecklistTemplate[],
): { next: ChecklistTemplate[]; changed: string[] } {
  if (!Array.isArray(templates) || templates.length === 0) {
    return { next: templates, changed: [] };
  }

  const changed: string[] = [];
  let touched = false;

  const next = templates.map(template => {
    if (template.storeId !== STORE_PROSPER) return template;
    if (!Array.isArray(template.tasks) || template.tasks.length === 0) return template;

    let templateTouched = false;
    const tasks = template.tasks.map(task => {
      const mapped = PROSPER_PHOTO_TASKS[task.id];
      if (mapped === undefined) return task;

      const have = task.requiredPhotos || (task.requiresPhoto ? 1 : 0);
      if (have !== 0) return task;

      templateTouched = true;
      changed.push(task.id);
      return {
        ...task,
        requiresPhoto: true,
        requiredPhotos: mapped,
      };
    });

    if (!templateTouched) return template;
    touched = true;
    return { ...template, tasks };
  });

  if (!touched) return { next: templates, changed: [] };
  return { next, changed };
}
