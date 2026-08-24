import { ChecklistTask, ChecklistTemplate } from '../types';

/**
 * One-time rematch: clone Little Elm's live SHIFT_CHANGE (Mid-Shift)
 * checklist onto Prosper. Never invents tasks — copies whatever store-elm
 * already has. Store IDs are the ones already used in this app.
 */

export const STORE_ELM = 'store-elm';
export const STORE_PROSPER = 'store-prosper';

/** Firestore marker doc — same one-time pattern as inventory / review rematches. */
export const PROSPER_MIDSHIFT_REMATCH_KEY = 'templateRematch-prosper-shift-change';

export type MidshiftRematchDecision =
  | { kind: 'skip-empty' }
  | { kind: 'already-has' }
  | { kind: 'no-source' }
  | { kind: 'clone'; template: ChecklistTemplate };

export function findStoreShiftChange(
  templates: ChecklistTemplate[],
  storeId: string,
): ChecklistTemplate | undefined {
  return templates.find(t => t.storeId === storeId && t.type === 'SHIFT_CHANGE');
}

/** Deterministic Prosper id from the Little Elm template — not a new GUID. */
export function prosperIdFromElmTemplate(elmId: string): string {
  if (elmId.includes(STORE_ELM)) {
    return elmId.split(STORE_ELM).join(STORE_PROSPER);
  }
  return `${elmId}-${STORE_PROSPER}`;
}

function copyTask(task: ChecklistTask): ChecklistTask {
  return { ...task };
}

export function cloneElmShiftChangeForProsper(elm: ChecklistTemplate): ChecklistTemplate {
  return {
    id: prosperIdFromElmTemplate(elm.id),
    name: elm.name,
    storeId: STORE_PROSPER,
    type: 'SHIFT_CHANGE',
    deadlineHour: elm.deadlineHour,
    unlockHour: elm.unlockHour,
    tasks: elm.tasks.map(copyTask),
  };
}

/**
 * Decide whether to clone store-elm SHIFT_CHANGE onto store-prosper.
 * - Prosper already has a SHIFT_CHANGE → do nothing (do not overwrite).
 * - Little Elm has none → do nothing (do not invent tasks).
 * - Empty list → treat as a transient read, do nothing.
 */
export function decideProsperMidshiftRematch(
  templates: ChecklistTemplate[],
): MidshiftRematchDecision {
  if (!Array.isArray(templates) || templates.length === 0) {
    return { kind: 'skip-empty' };
  }
  if (findStoreShiftChange(templates, STORE_PROSPER)) {
    return { kind: 'already-has' };
  }
  const elm = findStoreShiftChange(templates, STORE_ELM);
  if (!elm) {
    return { kind: 'no-source' };
  }
  const clone = cloneElmShiftChangeForProsper(elm);
  if (templates.some(t => t.id === clone.id)) {
    return { kind: 'already-has' };
  }
  return { kind: 'clone', template: clone };
}
