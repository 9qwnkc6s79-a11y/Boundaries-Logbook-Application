/**
 * Immutable logbook records and the gap report. No Firestore.
 * Run: npx tsx scripts/verify-logbook-records.ts
 */
import { readFileSync } from 'node:fs';
import {
  applyRecordWrite,
  buildLogbookRecord,
  decideRecordWrite,
  planHistoryRebuild,
} from '../utils/logbookRecords.ts';

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

const draft = buildLogbookRecord({
  id: 'sub-1',
  storeId: 'store-elm',
  templateId: 'open-elm',
  date: '2026-10-06',
  status: 'DRAFT',
  userId: 'u-1',
  taskResults: [
    { taskId: 't1', completed: true, completedAt: '2026-10-06T12:00:00.000Z', photoUrl: 'data:image/jpeg;base64,abc' },
    { taskId: 't2', completed: false },
  ],
}, { source: 'client' }, 'OPENING');
assert(draft && draft.completionPercent === 50, 'half complete');
assert(draft!.startedAt === '2026-10-06T12:00:00.000Z', 'started at first task');
assert(draft!.sealed === false, 'draft is not sealed');
assert(decideRecordWrite(null, draft) === 'create', 'first draft is created');

const sealed = { ...draft!, status: 'PENDING', sealed: true, submittedAt: '2026-10-06T13:00:00.000Z' };
assert(decideRecordWrite(draft, sealed) === 'seal', 'draft can be sealed once');
assert(decideRecordWrite(sealed, { ...sealed, items: [] }) === 'patch-photos' || decideRecordWrite(sealed, { ...sealed, completionPercent: 0 }) === 'skip-immutable', 'sealed body is not replaced');
assert(decideRecordWrite(sealed, { ...sealed, items: sealed.items.map(item => ({ ...item, completed: false })) }) === 'skip-immutable', 'answers are not overwritten');

const withUrl = {
  ...sealed,
  photoRefs: [{ taskId: 't1', urls: ['https://example.com/photo.jpg'] }],
};
assert(decideRecordWrite(sealed, withUrl) === 'patch-photos', 'https can replace an inline photo ref');
const patched = applyRecordWrite(sealed, withUrl);
assert(patched?.photoRefs[0].urls.includes('https://example.com/photo.jpg'), 'url kept');
assert(!patched?.photoRefs[0].urls.some(url => url.startsWith('data:')), 'inline url removed once https exists');
assert(patched?.items[0].completed === true, 'patch does not touch answers');

const plan = planHistoryRebuild({
  endDate: '2026-10-07',
  templates: [{ id: 'close-elm', type: 'CLOSING', storeId: 'store-elm' }],
  archives: {
    'submissionsArchive-2026-10': {
      rows: [{
        id: 'sub-close',
        storeId: 'store-elm',
        templateId: 'close-elm',
        date: '2026-10-06',
        status: 'PENDING',
        userId: 'u-1',
        submittedAt: '2026-10-06T22:00:00.000Z',
        taskResults: [{ taskId: 't1', completed: true }],
      }],
    },
  },
  exportDays: [{
    storeId: 'store-prosper',
    date: '2026-10-06',
    checklists: [{ type: 'OPENING', status: 'PENDING', tasksDone: 3, tasksTotal: 4, submittedAt: '2026-10-06T08:00:00.000Z' }],
  }],
}, '2026-11-17T00:00:00.000Z');

assert(plan.summary.fromArchive === 1, 'archive row rebuilt');
assert(plan.summary.fromExport === 1, 'export stub written without task rows');
assert(plan.records.find(r => r.provenance.source === 'logbook-export')?.itemsOmitted === true, 'export has no invented items');
const elmClose = plan.gaps.find(g => g.storeId === 'store-elm' && g.date === '2026-10-06' && g.checklistType === 'CLOSING');
const elmOpen = plan.gaps.find(g => g.storeId === 'store-elm' && g.date === '2026-10-06' && g.checklistType === 'OPENING');
const sep = plan.gaps.find(g => g.date === '2026-09-01');
const prosperOpen = plan.gaps.find(g => g.storeId === 'store-prosper' && g.date === '2026-10-06' && g.checklistType === 'OPENING');
assert(elmClose?.status === 'present', 'archived close is present');
assert(elmOpen?.status === 'gap', 'missing opening in a covered month is a gap');
assert(sep?.status === 'no-source', 'September without an archive is no-source, not a fake gap');
assert(prosperOpen?.status === 'partial-export', 'export-only checklist is not a full record and not a gap');
assert(!plan.records.some(r => r.businessDate === '2026-09-15'), 'no September record was fabricated');

const again = planHistoryRebuild({
  endDate: '2026-10-07',
  templates: [{ id: 'close-elm', type: 'CLOSING' }],
  archives: {
    'submissionsArchive-2026-10': {
      rows: [{
        id: 'sub-close',
        storeId: 'store-elm',
        templateId: 'close-elm',
        date: '2026-10-06',
        status: 'PENDING',
        taskResults: [{ taskId: 't1', completed: false }],
      }],
    },
  },
}, '2026-11-17T00:00:00.000Z');
assert(again.records.length === 1, 'same id is one record');
assert(again.records[0].items[0].completed === false, 'a single input row is stored as given');

const db = readFileSync(new URL('../services/db.ts', import.meta.url), 'utf8');
assert(db.includes('writeLogbookRecord('), 'a live save also writes the immutable record');
assert(db.includes('logbookSubmissions'), 'records use the per-submission collection');
const push = db.slice(db.indexOf('async pushSubmission('), db.indexOf('async restoreOct6to12Submissions'));
assert(!push.includes('this.remoteSet(DOC_KEYS.SUBMISSIONS'), 'the live doc is still not blind-set');

console.log('verify-logbook-records: OK');
