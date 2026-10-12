/**
 * Smoke: Prosper photo restore only raises mapped tasks that currently
 * require no photo. Existing counts stay. Other stores are the same object.
 * Run: npx --yes tsx scripts/verify-prosper-photos.ts
 */
import type { ChecklistTask, ChecklistTemplate } from '../types.ts';
import {
  PROSPER_PHOTO_RESTORE_KEY,
  PROSPER_PHOTO_TASKS,
  applyProsperPhotoRestore,
} from '../utils/prosperPhotoRestore.ts';

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

const MAPPED = [
  't-1786903547445', // Wipe and clean espresso machine
  't-1786903641211', // Sweep and mop floors
  't-1786903677845', // Prepare DoorDash bags
  't-1784757330315', // Set out pastries
  't-1784757884036', // Wash pastry case/trays
  't-1784757697336', // Sweep and mop entire store
  't-1784757659569', // Clean and sanitize bar surfaces
] as const;

assert(
  PROSPER_PHOTO_RESTORE_KEY === 'templateRematch-prosper-photos-v1',
  'marker key must be templateRematch-prosper-photos-v1',
);
assert(Object.keys(PROSPER_PHOTO_TASKS).length === 7, 'there are 7 mapped tasks');
assert(
  MAPPED.every(id => PROSPER_PHOTO_TASKS[id] === 1),
  'each mapped task restores to 1 photo',
);
assert(
  Object.keys(PROSPER_PHOTO_TASKS).every(id => (MAPPED as readonly string[]).includes(id)),
  'mapped ids must be exactly the Prosper photo tasks',
);

function task(partial: Partial<ChecklistTask> & Pick<ChecklistTask, 'id' | 'title'>): ChecklistTask {
  return { requiresPhoto: false, ...partial };
}

const unsetEspresso = task({ id: MAPPED[0], title: 'Wipe and clean espresso machine' });
const unsetFloors = task({ id: MAPPED[1], title: 'Sweep and mop floors' });
const unsetBags = task({
  id: MAPPED[2],
  title: 'Prepare DoorDash bags',
  requiresPhoto: false,
  requiredPhotos: 0,
});
const keptThree = task({
  id: MAPPED[3],
  title: 'Set out pastries',
  requiresPhoto: true,
  requiredPhotos: 3,
});
const keptTwo = task({
  id: MAPPED[4],
  title: 'Wash pastry case/trays',
  requiresPhoto: true,
  requiredPhotos: 2,
});
const alreadyFlagged = task({
  id: MAPPED[5],
  title: 'Sweep and mop entire store',
  requiresPhoto: true,
});
const unsetBar = task({ id: MAPPED[6], title: 'Clean and sanitize bar surfaces', isCritical: true });
const unmapped = task({ id: 't-unmapped', title: 'Restock lids', requiresPhoto: false });

const prosperOpening: ChecklistTemplate = {
  id: 'ct-opening-store-prosper',
  name: 'Opening Checklist',
  storeId: 'store-prosper',
  type: 'OPENING',
  deadlineHour: 7,
  unlockHour: 0,
  tasks: [unsetEspresso, unsetFloors, unsetBags, keptThree, unmapped],
};

const prosperClosing: ChecklistTemplate = {
  id: 'ct-closing-store-prosper',
  name: 'Closing Checklist',
  storeId: 'store-prosper',
  type: 'CLOSING',
  deadlineHour: 21,
  unlockHour: 10,
  tasks: [keptTwo, alreadyFlagged, unsetBar],
};

const prosperWeekly: ChecklistTemplate = {
  id: 'ct-weekly-store-prosper',
  name: 'Weekly Checklist',
  storeId: 'store-prosper',
  type: 'WEEKLY',
  deadlineHour: 18,
  unlockHour: 6,
  tasks: [task({ id: 't-weekly-only', title: 'Deep clean fridge', requiresPhoto: false })],
};

const elmTask = task({ id: MAPPED[0], title: 'Wipe and clean espresso machine' });
const elm: ChecklistTemplate = {
  id: 'ct-opening-store-elm',
  name: 'Opening Checklist',
  storeId: 'store-elm',
  type: 'OPENING',
  deadlineHour: 7,
  unlockHour: 0,
  tasks: [elmTask, task({ id: 't-elm-other', title: 'Unlock doors', requiresPhoto: false })],
};

const templates = [prosperOpening, elm, prosperClosing, prosperWeekly];
const first = applyProsperPhotoRestore(templates);

assert(
  first.changed.join(',') === [MAPPED[0], MAPPED[1], MAPPED[2], MAPPED[6]].join(','),
  `only unset mapped Prosper tasks should change, got ${first.changed.join(',')}`,
);

const nextOpening = first.next[0];
const nextElm = first.next[1];
const nextClosing = first.next[2];
const nextWeekly = first.next[3];

assert(nextElm === elm, 'Little Elm templates are the same object');
assert(elmTask.requiresPhoto === false, 'Little Elm mapped task must stay without a photo');
assert(elmTask.requiredPhotos === undefined, 'Little Elm requiredPhotos must stay unset');
assert(nextWeekly === prosperWeekly, 'Prosper template with no mapped edits stays the same object');
assert(nextOpening !== prosperOpening, 'a touched Prosper template is cloned');
assert(nextClosing !== prosperClosing, 'a touched Prosper closing template is cloned');

assert(nextOpening.tasks.length === prosperOpening.tasks.length, 'restore must not add opening tasks');
assert(nextClosing.tasks.length === prosperClosing.tasks.length, 'restore must not add closing tasks');
assert(
  nextOpening.tasks.map(t => t.id).join(',') === prosperOpening.tasks.map(t => t.id).join(','),
  'task ids stay in place',
);

assert(nextOpening.tasks[0] !== unsetEspresso, 'restored task is a new object');
assert(nextOpening.tasks[0].requiresPhoto === true, 'unset mapped task requires a photo');
assert(nextOpening.tasks[0].requiredPhotos === 1, 'unset mapped task restores to 1');
assert(nextOpening.tasks[0].title === 'Wipe and clean espresso machine', 'title is preserved');
assert(unsetEspresso.requiresPhoto === false, 'input task must not be mutated');

assert(nextOpening.tasks[2].requiresPhoto === true, 'explicit 0 count is restored');
assert(nextOpening.tasks[2].requiredPhotos === 1, 'explicit 0 count becomes 1');

assert(nextOpening.tasks[3] === keptThree, 'count of 3 stays the same task object');
assert(keptThree.requiredPhotos === 3, 'an existing count of 3 is kept');
assert(keptThree.requiresPhoto === true, 'existing photo flag stays');

assert(nextOpening.tasks[4] === unmapped, 'unmapped tasks are untouched');
assert(unmapped.requiresPhoto === false, 'unmapped task still has no photo');

assert(nextClosing.tasks[0] === keptTwo, 'count of 2 is not lowered');
assert(keptTwo.requiredPhotos === 2, 'existing count of 2 is kept');
assert(nextClosing.tasks[1] === alreadyFlagged, 'requiresPhoto without a count is already set');
assert(alreadyFlagged.requiredPhotos === undefined, 'an existing photo flag is not rewritten');
assert(nextClosing.tasks[2].requiresPhoto === true, 'closing bar task is restored');
assert(nextClosing.tasks[2].requiredPhotos === 1, 'closing bar task restores to 1');
assert(nextClosing.tasks[2].isCritical === true, 'other task fields are preserved');

const second = applyProsperPhotoRestore(first.next);
assert(second.changed.length === 0, 'the restore is idempotent');
assert(second.next === first.next, 'a second apply returns the same list');
assert(second.next[0].tasks[0].requiredPhotos === 1, 'restored count survives a second apply');
assert(second.next[0].tasks[3].requiredPhotos === 3, 'kept count survives a second apply');

const emptyInput: ChecklistTemplate[] = [];
const empty = applyProsperPhotoRestore(emptyInput);
assert(empty.changed.length === 0, 'empty input changes nothing');
assert(empty.next === emptyInput, 'empty input is returned unchanged');

const missing = applyProsperPhotoRestore(undefined as unknown as ChecklistTemplate[]);
assert(missing.changed.length === 0, 'non-array input changes nothing');
assert(missing.next == null, 'non-array input is returned unchanged');

console.log('verify-prosper-photos: ok');
