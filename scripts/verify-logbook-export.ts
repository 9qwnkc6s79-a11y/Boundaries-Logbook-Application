/**
 * Smoke: /api/logbook-export auth, query parsing, and response mapping,
 * plus submission retention archive packing.
 * Run: npx --yes tsx scripts/verify-logbook-export.ts
 */
import handler, {
  authorizeExport,
  buildLogbookDays,
  chicagoDeadlineMs,
  parseArchivePayload as parseArchiveFromApi,
  parseExportQuery,
  reportedBusinessDate,
  taskProgress,
  tokenMatches,
} from '../api/logbook-export.ts';
import {
  ARCHIVE_MAX_BYTES,
  archiveDocId,
  groupRemovedByMonth,
  mergeSubmissionsById,
  parseArchivePayload as parseArchiveFromUtil,
  partitionSubmissionsForRetention,
  retentionCutoff,
  shardSubmissionRows,
} from '../utils/submissionArchive.ts';

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

function mockRes() {
  return {
    statusCode: 200,
    body: undefined as unknown,
    headers: {} as Record<string, string>,
    setHeader(key: string, value: string) {
      this.headers[key] = value;
      return this;
    },
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };
}

function enc(value: any): any {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number') {
    return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  }
  if (Array.isArray(value)) return { arrayValue: { values: value.map(enc) } };
  if (typeof value === 'object') {
    return {
      mapValue: {
        fields: Object.fromEntries(Object.entries(value).map(([k, v]) => [k, enc(v)])),
      },
    };
  }
  return { stringValue: String(value) };
}

function rest(data: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => ({ fields: { data: enc(data) } }),
    text: async () => '',
  };
}

const TOKEN = 'export-test-token';

function req(query: Record<string, string>, authorization?: string, method = 'GET') {
  return {
    method,
    query,
    headers: authorization ? { authorization } : {},
  } as any;
}

async function call(query: Record<string, string>, authorization?: string, method = 'GET') {
  const res = mockRes();
  await handler(req(query, authorization, method), res as any);
  return res;
}

function denied(result: ReturnType<typeof authorizeExport>) {
  if (result.ok !== false) throw new Error('expected a denial');
  return result;
}

// --- auth ---
assert(denied(authorizeExport(undefined, '')).status === 500, 'missing env token is 500');
assert(denied(authorizeExport(undefined, undefined)).error === 'server not configured', 'missing env token message');
assert(denied(authorizeExport(undefined, TOKEN)).status === 401, 'missing header is 401');
assert(denied(authorizeExport('Basic abc', TOKEN)).status === 401, 'non-bearer is 401');
assert(denied(authorizeExport('Bearer wrong', TOKEN)).status === 401, 'wrong token is 401');
assert(authorizeExport(`Bearer ${TOKEN}`, TOKEN).ok === true, 'matching bearer is allowed');
assert(authorizeExport(`bearer ${TOKEN}`, TOKEN).ok === true, 'bearer scheme is case-insensitive');
assert(tokenMatches('short', 'a-much-longer-token') === false, 'different lengths compare as not equal and do not throw');
assert(tokenMatches(TOKEN, TOKEN), 'equal tokens match');

// --- query ---
const le = parseExportQuery({ location: 'LE', start: '2026-10-05', end: '2026-10-06' });
assert(le.ok && le.storeId === 'store-elm' && le.location === 'littleelm', 'le aliases littleelm / store-elm');
const prosper = parseExportQuery({ location: 'Prosper', start: '2026-01-01', end: '2026-01-01' });
assert(prosper.ok && prosper.storeId === 'store-prosper' && prosper.dates.length === 1, 'prosper maps to store-prosper');
assert(!parseExportQuery({ location: 'dallas', start: '2026-10-01', end: '2026-10-02' }).ok, 'unknown location is 400');
assert(!parseExportQuery({ location: 'littleelm', start: '', end: '2026-10-02' }).ok, 'missing start is 400');
assert(!parseExportQuery({ location: 'littleelm', start: '2026-02-31', end: '2026-03-01' }).ok, 'impossible date is 400');
assert(!parseExportQuery({ location: 'littleelm', start: '2026-10-06', end: '2026-10-05' }).ok, 'end before start is 400');

function addUtcDays(ymd: string, days: number): string {
  const [y, m, d] = ymd.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}
const maxOk = parseExportQuery({ location: 'littleelm', start: '2026-01-01', end: addUtcDays('2026-01-01', 119) });
assert(maxOk.ok && maxOk.dates.length === 120, '120 inclusive days is allowed');
const tooLong = parseExportQuery({ location: 'littleelm', start: '2026-01-01', end: addUtcDays('2026-01-01', 120) });
assert(tooLong.ok === false && tooLong.error.includes('120'), '121 days is rejected');

// --- Chicago deadline ---
assert(
  chicagoDeadlineMs('2026-10-05', 7) === Date.parse('2026-10-05T12:00:00.000Z'),
  '7:00 America/Chicago in October (CDT) is 12:00Z'
);
assert(
  chicagoDeadlineMs('2026-01-15', 7) === Date.parse('2026-01-15T13:00:00.000Z'),
  '7:00 America/Chicago in January (CST) is 13:00Z'
);

const october = buildLogbookDays({
  dates: ['2026-10-05'],
  storeId: 'store-elm',
  templates: [{ id: 'open', name: 'Opening Checklist', storeId: 'store-elm', type: 'OPENING', deadlineHour: 7, tasks: [{}, {}] }],
  users: [{ id: 'u1', name: 'Alex Manager' }],
  deposits: [],
  closingWaste: [],
  inventoryCounts: [],
  food86Events: [],
  submissions: [
    {
      id: 'early',
      userId: 'u1',
      storeId: 'store-elm',
      templateId: 'open',
      date: '2026-10-05',
      status: 'PENDING',
      submittedAt: '2026-10-05T11:59:00.000Z',
      taskResults: [{ completed: true }, { completed: false }],
    },
  ],
});
assert(october.days[0].checklists[0].onTime === true, '11:59Z is on time for a 7:00 CDT deadline');
assert(october.days[0].checklists[0].tasksDone === 1, 'tasksDone counts completed tasks');
assert(october.days[0].checklists[0].tasksTotal === 2, 'tasksTotal comes from the template');
assert(october.days[0].checklists[0].submittedBy === 'Alex Manager', 'submittedBy is the user name');

const late = buildLogbookDays({
  dates: ['2026-10-05'],
  storeId: 'store-elm',
  templates: [{ id: 'open', name: 'Opening Checklist', storeId: 'store-elm', type: 'OPENING', deadlineHour: 7, tasks: [{}, {}] }],
  users: [{ id: 'u1', name: 'Alex Manager' }],
  deposits: [],
  closingWaste: [],
  inventoryCounts: [],
  food86Events: [],
  submissions: [{
    id: 'late',
    userId: 'u1',
    storeId: 'store-elm',
    templateId: 'open',
    date: '2026-10-05',
    status: 'PENDING',
    submittedAt: '2026-10-05T12:01:00.000Z',
    taskResults: [],
  }],
});
assert(late.days[0].checklists[0].onTime === false, '12:01Z is late for a 7:00 CDT deadline');

const january = buildLogbookDays({
  dates: ['2026-01-15'],
  storeId: 'store-elm',
  templates: [{ id: 'open', name: 'Opening Checklist', storeId: 'store-elm', type: 'OPENING', deadlineHour: 7, tasks: [] }],
  users: [],
  deposits: [],
  closingWaste: [],
  inventoryCounts: [],
  food86Events: [],
  submissions: [{
    id: 'jan',
    userId: 'missing-user',
    storeId: 'store-elm',
    templateId: 'open',
    date: '2026-01-15',
    status: 'PENDING',
    submittedAt: '2026-01-15T12:59:00.000Z',
    taskResults: [],
  }],
});
assert(january.days[0].checklists[0].onTime === true, '12:59Z is on time for a 7:00 CST deadline');
assert(january.days[0].checklists[0].submittedBy === null, 'unknown user id does not become submittedBy');

// Prosper Opening was stored on D but submitted before the deadline on D+1.
// 2026-10-06 06:14 America/Chicago (CDT) is 11:14Z. Do not rewrite the row;
// report it on the 6th, on time. A submit after 7:00 stays on the stored day.
const openingTpl = { id: 'open', name: 'Opening Checklist', storeId: 'store-prosper', type: 'OPENING', deadlineHour: 7, tasks: [{ id: 'a' }, { id: 'b' }] };
const moved = reportedBusinessDate(
  { id: 'p', date: '2026-10-05', submittedAt: '2026-10-06T11:14:00.000Z', templateId: 'open' },
  openingTpl,
);
assert(moved === '2026-10-06', `opening before the next morning's deadline reports D+1, got ${moved}`);
const stayed = reportedBusinessDate(
  { id: 'p2', date: '2026-10-05', submittedAt: '2026-10-06T13:00:00.000Z', templateId: 'open' },
  openingTpl,
);
assert(stayed === '2026-10-05', 'opening after the next morning deadline stays on the stored date');
const sameDay = reportedBusinessDate(
  { id: 'le', date: '2026-10-06', submittedAt: '2026-10-06T11:45:00.000Z', templateId: 'open' },
  { ...openingTpl, storeId: 'store-elm' },
);
assert(sameDay === '2026-10-06', 'Little Elm opening already on the Chicago date is not moved');

const prosperDays = buildLogbookDays({
  dates: ['2026-10-05', '2026-10-06'],
  storeId: 'store-prosper',
  templates: [openingTpl],
  users: [{ id: 'u1', name: 'Alex Manager' }],
  deposits: [],
  closingWaste: [],
  inventoryCounts: [],
  food86Events: [],
  submissions: [{
    id: 'prosper-open',
    userId: 'u1',
    storeId: 'store-prosper',
    templateId: 'open',
    date: '2026-10-05',
    status: 'PENDING',
    submittedAt: '2026-10-06T11:14:00.000Z',
    taskResults: [{ taskId: 'a', completed: true }, { taskId: 'b', completed: true }],
  }],
});
assert(prosperDays.days[0].checklists[0].status === 'MISSING', 'stored date no longer shows the moved opening');
assert(prosperDays.days[1].checklists[0].status === 'PENDING', 'opening is reported on the morning it was submitted');
assert(prosperDays.days[1].checklists[0].onTime === true, 'moved opening is on time against D+1 7:00');
assert(prosperDays.days[1].date === '2026-10-06', 'reported day is Oct 6');
const closingStay = reportedBusinessDate(
  { id: 'c', date: '2026-10-05', submittedAt: '2026-10-06T11:14:00.000Z', templateId: 'close' },
  { id: 'close', type: 'CLOSING', deadlineHour: 21, tasks: [] },
);
assert(closingStay === '2026-10-05', 'a next-morning close is not moved the way an opening is');

const midTasks = Array.from({ length: 13 }, (_, i) => ({ id: `t${i + 1}` }));
const midResults = [
  ...midTasks.map(t => ({ taskId: t.id, completed: true })),
  { taskId: 'removed-task', completed: true },
];
const progress = taskProgress(
  { id: 'mid', taskResults: midResults },
  { id: 'mid-tpl', type: 'SHIFT_CHANGE', tasks: midTasks },
);
assert(progress.tasksDone === 13 && progress.tasksTotal === 13, `tasksDone must not exceed tasksTotal, got ${progress.tasksDone}/${progress.tasksTotal}`);

// --- retention archive ---
const now = new Date('2026-10-06T18:00:00.000Z');
const c90 = retentionCutoff(now, 90);
const c60 = retentionCutoff(now, 60);
const c30 = retentionCutoff(now, 30);
const dayBefore = (ymd: string) => addUtcDays(ymd, -1);
const row = (id: string, date: string) => ({ id, date, submittedAt: `${date}T12:00:00.000Z` });

const ageSplit = partitionSubmissionsForRetention([
  row('old', dayBefore(c90)),
  row('edge', c90),
  row('new', c30),
], 900_000, now);
assert(ageSplit.kept.some(r => r.id === 'edge') && ageSplit.kept.some(r => r.id === 'new'), '90-day cutoff is inclusive');
assert(ageSplit.removed.some(r => r.id === 'old') && !ageSplit.kept.some(r => r.id === 'old'), 'older than 90 days is removed');
assert(ageSplit.kept[0].id === 'new', 'kept rows stay newest-first');

const bulky = (id: string, date: string) => ({ id, date, submittedAt: '', blob: 'x'.repeat(80) });
const sized = partitionSubmissionsForRetention([
  bulky('a90', c90),
  bulky('a60', c60),
  bulky('a30', c30),
], 100, now);
assert(sized.kept.length === 1 && sized.kept[0].id === 'a30', 'over-size rows fall through 60 days down to the 30-day window');
assert(sized.removed.map(r => r.id).sort().join() === 'a60,a90', '60- and 90-day rows are the ones removed');

const inside30 = partitionSubmissionsForRetention([
  bulky('keep-me', c30),
  bulky('also', addUtcDays(c30, 1)),
], 10, now);
assert(inside30.removed.length === 0, 'rows inside 30 days are not dropped for size');

const grouped = groupRemovedByMonth([
  { id: '1', date: '2026-08-02' },
  { id: '2', date: '2026-08-19' },
  { id: '3', date: 'not-a-date' },
]);
assert(grouped.byMonth.get('2026-08')?.length === 2, 'archive groups by YYYY-MM');
assert(grouped.undated.length === 1, 'undated rows are not archived');

const merged = mergeSubmissionsById(
  [{ id: 's', date: '2026-08-01', submittedAt: '2026-08-01T10:00:00.000Z', status: 'OLD' }],
  [{ id: 's', date: '2026-08-01', submittedAt: '2026-08-01T11:00:00.000Z', status: 'NEW' }]
);
assert(merged.length === 1 && (merged[0] as { status: string }).status === 'NEW', 'archive merge keeps the newer submittedAt');

const packed = shardSubmissionRows(
  [{ n: 1, blob: 'x'.repeat(30) }, { n: 2, blob: 'y'.repeat(30) }, { n: 3, blob: 'z'.repeat(30) }],
  80
);
assert(packed.length >= 2, 'rows pack into more than one shard when they exceed the cap');
for (const shard of packed) {
  if (shard.length > 1) assert(JSON.stringify(shard).length <= 80, 'multi-row shards stay under the byte cap');
}
assert(shardSubmissionRows([{ blob: 'x'.repeat(50) }], 10).length === 1, 'a single oversized row is not split');
assert(JSON.stringify(shardSubmissionRows([1, 2, 3], ARCHIVE_MAX_BYTES)).length < ARCHIVE_MAX_BYTES, 'default cap is under 1 MB');
assert(archiveDocId('2026-08', 1) === 'submissionsArchive-2026-08', 'first shard id');
assert(archiveDocId('2026-08', 2) === 'submissionsArchive-2026-08-p2', 'later shard id');

const wrapper = { rows: [{ id: 'a' }], shardCount: 2 };
assert(JSON.stringify(parseArchiveFromUtil(wrapper)) === JSON.stringify(parseArchiveFromApi(wrapper)), 'api and client parse the same archive wrapper');
assert(parseArchiveFromUtil([{ id: 'a' }]).recognized && parseArchiveFromUtil([{ id: 'a' }]).shardCount === 1, 'bare array archives are recognized');
assert(parseArchiveFromUtil({ nope: true }).recognized === false, 'unknown archive shapes are refused');

// --- handler, with Firestore stubbed ---
const originalFetch = globalThis.fetch;
const originalToken = process.env.LOGBOOK_EXPORT_TOKEN;
let fetchCount = 0;
let failSubmissions = false;

const docs: Record<string, unknown> = {
  submissions: [
    {
      id: 'sub-open',
      userId: 'u1',
      storeId: 'store-elm',
      templateId: 'tpl-open',
      date: '2026-10-05',
      status: 'PENDING',
      submittedAt: '2026-10-05T11:30:00.000Z',
      taskResults: [
        { completed: true, photoUrl: 'https://secret.example/photo.jpg' },
        { completed: true },
      ],
    },
    {
      id: 'sub-close-draft',
      userId: 'u1',
      storeId: 'store-elm',
      templateId: 'tpl-close',
      date: '2026-10-05',
      status: 'DRAFT',
      submittedAt: '2026-10-05T20:00:00.000Z',
      taskResults: [{ completed: true }],
    },
    {
      id: 'sub-prosper',
      userId: 'u1',
      storeId: 'store-prosper',
      templateId: 'tpl-open',
      date: '2026-10-05',
      status: 'PENDING',
      submittedAt: '2026-10-05T11:00:00.000Z',
      taskResults: [{ completed: true }],
    },
  ],
  templates: [
    { id: 'tpl-open', name: 'Opening Checklist', storeId: 'store-elm', type: 'OPENING', deadlineHour: 7, tasks: [{}, {}] },
    { id: 'tpl-mid', name: 'Mid-Shift Checklist', storeId: 'store-elm', type: 'SHIFT_CHANGE', deadlineHour: 5, tasks: [{}] },
    { id: 'tpl-close', name: 'Closing Checklist', storeId: 'store-elm', type: 'CLOSING', deadlineHour: 21, tasks: [{}, {}, {}] },
    { id: 'tpl-weekly', name: 'Monday Deep Clean', storeId: 'store-elm', type: 'WEEKLY', deadlineHour: 23, tasks: [{}] },
    { id: 'tpl-pro', name: 'Opening Checklist', storeId: 'store-prosper', type: 'OPENING', deadlineHour: 7, tasks: [{}] },
  ],
  users: [{ id: 'u1', name: 'Alex Manager', email: 'alex@example.com', password: 'hashed-secret-value' }],
  deposits: [
    {
      id: 'dep-elm',
      storeId: 'store-elm',
      depositDate: '2026-10-05',
      expectedDeposit: 100,
      actualDeposit: 90,
      variance: -10,
      status: 'FAIL',
      depositedByName: 'Alex Manager',
    },
    { id: 'dep-pro', storeId: 'store-prosper', depositDate: '2026-10-05', expectedDeposit: 5, actualDeposit: 5, variance: 0, status: 'PASS' },
  ],
  'foodClosingWaste-store-elm': [
    { storeId: 'store-elm', businessDate: '2026-10-05', itemName: 'Bagel', leftoverQty: 2, wasteQty: 0, updatedBy: 'u1' },
    { storeId: 'store-elm', businessDate: '2026-09-01', itemName: 'Old', leftoverQty: 1, wasteQty: 1 },
  ],
  'inventoryCounts-store-elm': [
    { id: 'cnt-1', storeId: 'store-elm', date: '2026-10-06', submittedBy: 'u1', submittedByName: 'Alex Manager', submittedAt: '2026-10-06T15:00:00.000Z', counts: { cups: 4 } },
  ],
  'food86Events-store-elm': [
    { storeId: 'store-elm', location: 'littleelm', businessDate: '2026-10-05', itemGuid: 'guid-1', itemName: 'Croissant', soldOutAt: '2026-10-05T18:00:00.000Z', source: 'poll' },
  ],
  'submissionsArchive-2026-10': {
    shardCount: 2,
    rows: [],
  },
  'submissionsArchive-2026-10-p2': {
    rows: [{
      id: 'sub-mid',
      userId: 'u1',
      storeId: 'store-elm',
      templateId: 'tpl-mid',
      date: '2026-10-05',
      status: 'PENDING',
      submittedAt: '2026-10-05T15:00:00.000Z',
      taskResults: [{ completed: true }],
    }],
  },
};

globalThis.fetch = (async (input: any) => {
  fetchCount++;
  const url = String(input);
  const match = /\/data\/([^?]+)/.exec(url);
  const id = match ? decodeURIComponent(match[1]) : '';
  if (failSubmissions && id === 'submissions') {
    return rest(null, 503);
  }
  if (!(id in docs)) return rest(null, 404);
  return rest(docs[id]);
}) as typeof fetch;

try {
  process.env.LOGBOOK_EXPORT_TOKEN = '';
  const unconfigured = await call({ location: 'littleelm', start: '2026-10-05', end: '2026-10-05' }, `Bearer ${TOKEN}`);
  assert(unconfigured.statusCode === 500 && (unconfigured.body as any).error === 'server not configured', 'unset token returns server not configured');
  assert(fetchCount === 0, 'auth failure does not read Firestore');

  delete process.env.LOGBOOK_EXPORT_TOKEN;
  const missingEnv = await call({ location: 'le', start: '2026-10-05', end: '2026-10-05' }, `Bearer ${TOKEN}`);
  assert(missingEnv.statusCode === 500, 'absent token env returns 500');

  process.env.LOGBOOK_EXPORT_TOKEN = TOKEN;
  const noAuth = await call({ location: 'le', start: '2026-10-05', end: '2026-10-06' });
  assert(noAuth.statusCode === 401, 'handler 401 without a bearer token');
  const badAuth = await call({ location: 'le', start: '2026-10-05', end: '2026-10-06' }, 'Bearer nope');
  assert(badAuth.statusCode === 401, 'handler 401 for the wrong token');
  const badRange = await call({ location: 'le', start: '2026-10-06', end: '2026-10-01' }, `Bearer ${TOKEN}`);
  assert(badRange.statusCode === 400, 'handler 400 for a bad range');
  const badMethod = await call({ location: 'le', start: '2026-10-05', end: '2026-10-05' }, `Bearer ${TOKEN}`, 'POST');
  assert(badMethod.statusCode === 405, 'handler 405 for POST');

  const before = fetchCount;
  const ok = await call({ location: 'le', start: '2026-10-05', end: '2026-10-06' }, `Bearer ${TOKEN}`);
  assert(ok.statusCode === 200, `handler 200, got ${ok.statusCode} ${JSON.stringify(ok.body)}`);
  assert(fetchCount > before, 'authorized request reads Firestore');
  const body = ok.body as { days: any[] };
  assert(Array.isArray(body.days) && body.days.length === 2, 'response includes every date in the range');
  assert(body.days[0].date === '2026-10-05' && body.days[1].date === '2026-10-06', 'days are ordered');

  const day = body.days[0];
  assert(day.checklists.length === 3, 'daily checklists are opening, mid-shift, and close only');
  assert(day.checklists.map((c: any) => c.type).join() === 'OPENING,SHIFT_CHANGE,CLOSING', 'checklist type order');
  const opening = day.checklists[0];
  assert(opening.name === 'Opening Checklist', 'opening name');
  assert(opening.deadlineHour === 7, 'opening deadlineHour');
  assert(opening.status === 'PENDING', 'opening status');
  assert(opening.onTime === true, 'opening on time');
  assert(opening.tasksDone === 2 && opening.tasksTotal === 2, 'opening task counts');
  assert(opening.submittedBy === 'Alex Manager', 'opening submittedBy');
  assert(opening.submittedAt === '2026-10-05T11:30:00.000Z', 'opening submittedAt');

  const mid = day.checklists[1];
  assert(mid.name === 'Mid-Shift Checklist' && mid.status === 'PENDING' && mid.onTime === false, 'archived mid-shift is included and late');
  assert(day.checklists[2].status === 'MISSING' && day.checklists[2].submittedBy === null && day.checklists[2].tasksTotal === 3, 'draft close is missing');
  assert(!day.checklists.some((c: any) => c.name === 'Monday Deep Clean'), 'weekly templates are not daily rows');

  assert(day.deposits.length === 1 && day.deposits[0].variance === -10 && day.deposits[0].status === 'FAIL', 'deposit is the store day');
  assert(day.closingWaste.length === 1 && day.closingWaste[0].itemName === 'Bagel' && day.closingWaste[0].wasteQty === 0, 'closing waste fields');
  assert(day.food86Events.length === 1 && day.food86Events[0].source === 'poll' && day.food86Events[0].itemGuid === 'guid-1', 'food86 events pass through their fields');
  assert(day.inventoryCounts.length === 0, 'Oct 5 has no inventory count');

  const nextDay = body.days[1];
  assert(nextDay.checklists.every((c: any) => c.status === 'MISSING'), 'a day with no submissions still lists the three checklists');
  assert(nextDay.inventoryCounts.length === 1 && nextDay.inventoryCounts[0].counts.cups === 4, 'inventory count keeps its counts map');
  assert(nextDay.inventoryCounts[0].submittedByName === 'Alex Manager', 'inventory count keeps submittedByName');
  assert(nextDay.deposits.length === 0 && nextDay.closingWaste.length === 0 && nextDay.food86Events.length === 0, 'empty sections are arrays');

  const serialized = JSON.stringify(body);
  assert(!serialized.includes('hashed-secret-value'), 'user password hashes are not exported');
  assert(!serialized.includes('secret.example'), 'task photo URLs are not exported');
  assert(!serialized.includes('alex@example.com'), 'user emails are not exported');

  failSubmissions = true;
  const broke = await call({ location: 'littleelm', start: '2026-10-05', end: '2026-10-05' }, `Bearer ${TOKEN}`);
  assert(broke.statusCode === 500 && (broke.body as any).error === 'Failed to read logbook data', 'Firestore failure is a 500 and does not crash');
} finally {
  globalThis.fetch = originalFetch;
  if (originalToken === undefined) delete process.env.LOGBOOK_EXPORT_TOKEN;
  else process.env.LOGBOOK_EXPORT_TOKEN = originalToken;
}

console.log('logbook export ok');
