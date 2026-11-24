/**
 * Smoke: one checklist's form must never write into, or finalize, another checklist.
 *
 * Real case (Little Elm, Tue Nov 24 2026, America/Chicago): the Tuesday Deep Clean
 * was started at 5:57 AM and left open as a draft. At 11:48 AM the Mid-Shift
 * Checklist was opened (no draft yet). Its 19 taps were saved into the Deep Clean
 * draft and its Submit finalized the Deep Clean (2/3 of its own tasks). Mid-Shift
 * still showed not done, so it was redone at 11:50. Same pattern at Prosper on
 * Nov 10, Nov 11 and Nov 23 (a 5 PM Closing finalized with 7/21 tasks).
 *
 * Run: npx --yes tsx scripts/verify-checklist-crosswrite.ts
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { findExistingSubmissionForSave, submissionIdForTemplate } from '../utils/logbookSubmitGuard.ts';

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

type Row = { id: string; templateId: string; storeId: string; date: string; status: string; taskIds: string[] };

const STORE = 'store-elm';
const DEEP = 'ct-tue-store-elm';
const MID = 'ct-new-1786903263232';
const DATE = '2026-11-24';

// Simplified App.handleChecklistUpdate using the shared helper.
let seq = 0;
function save(rows: Row[], data: { id?: string; templateId: string; targetDate: string; taskIds: string[]; isFinal: boolean }): Row[] {
  const { existing, idMismatch } = findExistingSubmissionForSave(rows, data, STORE);
  const row: Row = existing
    ? { ...existing, taskIds: data.taskIds, status: data.isFinal ? 'PENDING' : 'DRAFT' }
    : {
        id: (!idMismatch && data.id) || `sub-new-${++seq}`,
        templateId: data.templateId,
        storeId: STORE,
        date: data.targetDate,
        status: data.isFinal ? 'PENDING' : 'DRAFT',
        taskIds: data.taskIds,
      };
  return [row, ...rows.filter(r => r.id !== row.id)];
}

// 1) Deep Clean draft left open from the morning.
let rows: Row[] = [
  { id: 'sub-deep', templateId: DEEP, storeId: STORE, date: DATE, status: 'DRAFT', taskIds: ['tue-1', 't-1787406154843'] },
];

// 2) Old bug: the Mid-Shift form still carried the Deep Clean id. The helper must drop it.
assert(submissionIdForTemplate('sub-deep', MID, rows) === undefined, 'a Deep Clean draft id must not be used by the Mid-Shift form');
assert(submissionIdForTemplate('sub-deep', DEEP, rows) === 'sub-deep', 'the Deep Clean form keeps its own draft id');
assert(submissionIdForTemplate('sub-unknown', MID, rows) === 'sub-unknown', 'an id not in the local list yet passes through');
assert(submissionIdForTemplate(null, MID, rows) === undefined, 'no id stays no id');

// 3) Even if a stale id reaches App, the save must not touch the Deep Clean row.
const midTasks = ['t-1786903468714', 't-1786903518330'];
rows = save(rows, { id: 'sub-deep', templateId: MID, targetDate: DATE, taskIds: midTasks, isFinal: true });
const deep = rows.find(r => r.id === 'sub-deep')!;
const mid = rows.find(r => r.templateId === MID)!;
assert(deep.status === 'DRAFT', 'Mid-Shift Submit must not finalize the Deep Clean draft');
assert(deep.taskIds.join() === 'tue-1,t-1787406154843', 'Deep Clean draft keeps only its own tasks');
assert(mid && mid.status === 'PENDING' && mid.id !== 'sub-deep', 'Mid-Shift is saved as its own submitted row');
assert(mid.taskIds.join() === midTasks.join(), 'Mid-Shift row has the Mid-Shift tasks');

// 4) A stale foreign id falls back to this checklist's own draft for the day.
rows = [
  { id: 'sub-close', templateId: 'ct-closing-store-prosper', storeId: STORE, date: '2026-11-23', status: 'DRAFT', taskIds: ['c-food-waste'] },
  { id: 'sub-mon', templateId: 'ct-mon-store-prosper', storeId: STORE, date: '2026-11-23', status: 'DRAFT', taskIds: [] },
];
const pick = findExistingSubmissionForSave(rows, { id: 'sub-close', templateId: 'ct-mon-store-prosper', targetDate: '2026-11-23' }, STORE);
assert(pick.idMismatch && pick.existing?.id === 'sub-mon', 'Monday Deep Clean save goes to the Monday draft, not the Closing draft');
const same = findExistingSubmissionForSave(rows, { id: 'sub-close', templateId: 'ct-closing-store-prosper', targetDate: '2026-11-23' }, STORE);
assert(!same.idMismatch && same.existing?.id === 'sub-close', 'Closing save by its own id still works');

// 5) The form resets when you open or leave a checklist, and every write uses the guarded id.
const here = dirname(fileURLToPath(import.meta.url));
const ops = readFileSync(join(here, '../components/OpsView.tsx'), 'utf8');
assert(!/activeSubmissionId \|\| undefined/.test(ops), 'OpsView must not send the raw activeSubmissionId');
assert(/onClick=\{\(\) => openTemplate\(tpl\)\}/.test(ops), 'grid opens checklists through openTemplate (clean form)');
assert(/if \(!isSaving\) openTemplate\(null\)/.test(ops), 'close button leaves through openTemplate (clean form)');
const openFn = ops.slice(ops.indexOf('const openTemplate'), ops.indexOf('const openTemplate') + 900);
for (const needle of ['setActiveSubmissionId(null)', 'setResponses({})', 'responsesRef.current = {}', 'lastSyncedSubmissionRef.current = null']) {
  assert(openFn.includes(needle), `openTemplate must reset: ${needle}`);
}
const app = readFileSync(join(here, '../App.tsx'), 'utf8');
assert(/findExistingSubmissionForSave<ChecklistSubmission>\(submissions, data, currentStoreId\)/.test(app), 'App save uses the template-checked lookup');

console.log('verify-checklist-crosswrite: ok');
