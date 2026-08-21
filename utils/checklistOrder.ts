import { ChecklistTemplate } from '../types';

/**
 * Store-day display order for protocol lists.
 * OPENING → SHIFT_CHANGE (Mid-Shift) → CLOSING, then WEEKLY / MONTHLY.
 * Sort by type only — do not rely on Firestore / insertion order.
 * Display order only; does not change deadlines or completion logic.
 */
const STORE_DAY_TYPE_ORDER: Record<ChecklistTemplate['type'], number> = {
  OPENING: 0,
  SHIFT_CHANGE: 1,
  CLOSING: 2,
  WEEKLY: 3,
  MONTHLY: 4,
};

export function compareChecklistType(
  a: Pick<ChecklistTemplate, 'type'>,
  b: Pick<ChecklistTemplate, 'type'>
): number {
  return (STORE_DAY_TYPE_ORDER[a.type] ?? 99) - (STORE_DAY_TYPE_ORDER[b.type] ?? 99);
}

export function sortChecklistsByStoreDay<T extends Pick<ChecklistTemplate, 'type'>>(
  templates: T[]
): T[] {
  return [...templates].sort(compareChecklistType);
}
