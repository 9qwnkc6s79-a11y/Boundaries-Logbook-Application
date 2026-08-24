/**
 * Smoke: Prosper midshift rematch clones Little Elm SHIFT_CHANGE only.
 * Does not invent tasks. Second apply is a no-op when Prosper already has one.
 * Run: npx --yes tsx scripts/verify-midshift-rematch.ts
 */
import { CHECKLIST_TEMPLATES } from '../data/mockData.ts';
import { sortChecklistsByStoreDay } from '../utils/checklistOrder.ts';
import {
  STORE_ELM,
  STORE_PROSPER,
  cloneElmShiftChangeForProsper,
  decideProsperMidshiftRematch,
  findStoreShiftChange,
  prosperIdFromElmTemplate,
} from '../utils/midshiftTemplateRematch.ts';
import type { ChecklistTemplate } from '../types.ts';

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

function titlesOf(tpl: ChecklistTemplate): string[] {
  return tpl.tasks.map(t => t.title);
}

const elmMidshift: ChecklistTemplate = {
  id: 'ct-midshift-store-elm',
  name: 'Mid-Shift Checklist',
  storeId: STORE_ELM,
  type: 'SHIFT_CHANGE',
  deadlineHour: 15,
  unlockHour: 11,
  tasks: [
    { id: 'ms-1', title: 'Count drawer and log till', requiresPhoto: false, isCritical: true },
    { id: 'ms-2', title: 'Photo of pastry case', requiresPhoto: true, requiredPhotos: 2 },
    { id: 'ms-3', title: 'Record remaining milk gallons', requiresPhoto: false, requiresValue: 'Gallons' },
  ],
};

const opening: ChecklistTemplate = {
  id: 'ct-opening-store-prosper',
  name: 'Opening Checklist',
  storeId: STORE_PROSPER,
  type: 'OPENING',
  deadlineHour: 7,
  unlockHour: 0,
  tasks: [{ id: 'o-1', title: 'Unlock doors', requiresPhoto: false }],
};

const closing: ChecklistTemplate = {
  id: 'ct-closing-store-prosper',
  name: 'Closing Checklist',
  storeId: STORE_PROSPER,
  type: 'CLOSING',
  deadlineHour: 21,
  unlockHour: 10,
  tasks: [{ id: 'c-1', title: 'Lock doors', requiresPhoto: false }],
};

// Seed has no Little Elm midshift — rematch must not invent from seed.
assert(
  !findStoreShiftChange(CHECKLIST_TEMPLATES, STORE_ELM),
  'seed CHECKLIST_TEMPLATES must not contain a Little Elm SHIFT_CHANGE (rely on live rematch)'
);
assert(
  !findStoreShiftChange(CHECKLIST_TEMPLATES, STORE_PROSPER),
  'seed CHECKLIST_TEMPLATES must not contain a Prosper SHIFT_CHANGE'
);
assert(
  decideProsperMidshiftRematch(CHECKLIST_TEMPLATES).kind === 'no-source',
  'seed-only list must skip rematch (no invented tasks)'
);

// Empty / missing source → do nothing
assert(decideProsperMidshiftRematch([]).kind === 'skip-empty', 'empty list is a skip, not a clone');
assert(
  decideProsperMidshiftRematch([opening, closing]).kind === 'no-source',
  'no Little Elm SHIFT_CHANGE → do nothing'
);

// Clone when Prosper has none
const first = decideProsperMidshiftRematch([opening, closing, elmMidshift]);
assert(first.kind === 'clone', `expected clone, got ${first.kind}`);
assert(first.template.storeId === STORE_PROSPER, 'clone must use store-prosper');
assert(first.template.type === 'SHIFT_CHANGE', 'clone must stay SHIFT_CHANGE');
assert(first.template.name === elmMidshift.name, 'clone must keep Little Elm name');
assert(first.template.deadlineHour === 15, 'clone must keep deadlineHour');
assert(first.template.unlockHour === 11, 'clone must keep unlockHour');
assert(first.template.id === 'ct-midshift-store-prosper', 'id should swap store-elm → store-prosper');
assert(
  titlesOf(first.template).join('|') === titlesOf(elmMidshift).join('|'),
  'task titles must match Little Elm one-for-one'
);
assert(first.template.tasks[0].isCritical === true, 'critical flag must copy');
assert(first.template.tasks[1].requiresPhoto === true, 'photo flag must copy');
assert(first.template.tasks[1].requiredPhotos === 2, 'requiredPhotos must copy');
assert(first.template.tasks[2].requiresValue === 'Gallons', 'requiresValue must copy');
assert(first.template.tasks !== elmMidshift.tasks, 'tasks array must be a deep copy');
first.template.tasks[0].title = 'MUTATED';
assert(elmMidshift.tasks[0].title === 'Count drawer and log till', 'mutating clone must not change Little Elm');

// Already-has → do not overwrite (second load)
const afterClone = decideProsperMidshiftRematch([opening, closing, elmMidshift, first.template]);
assert(afterClone.kind === 'already-has', 'second load must not create another Prosper midshift');

const prosperOwn: ChecklistTemplate = {
  ...cloneElmShiftChangeForProsper(elmMidshift),
  name: 'Prosper already has this',
  tasks: [{ id: 'keep', title: 'Do not overwrite me', requiresPhoto: false }],
};
const noOverwrite = decideProsperMidshiftRematch([elmMidshift, prosperOwn]);
assert(noOverwrite.kind === 'already-has', 'existing Prosper SHIFT_CHANGE must not be overwritten');

// Deterministic id when Little Elm id has no store-elm suffix
assert(
  prosperIdFromElmTemplate('ct-new-12345') === 'ct-new-12345-store-prosper',
  'non-suffixed elm id should append -store-prosper (not a GUID)'
);

// Daily protocols sort Opening → Mid-Shift → Closing
const daily = sortChecklistsByStoreDay([closing, first.template, opening]);
assert(
  daily.map(t => t.type).join(',') === 'OPENING,SHIFT_CHANGE,CLOSING',
  `Prosper daily protocols should be Opening → Mid-Shift → Closing, got ${daily.map(t => t.type).join(' → ')}`
);

console.log('verify-midshift-rematch: ok');
