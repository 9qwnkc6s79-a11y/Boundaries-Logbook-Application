/** Smoke: Oct 6–12 restore adds by id only, file is valid, code is guarded. */
import { readFileSync } from 'node:fs';
import { mergeRestoredSubmissions, SUBMISSIONS_RESTORE_COUNT, SUBMISSIONS_RESTORE_KEY } from '../utils/submissionsRestore.ts';
function assert(c: unknown, m: string): asserts c { if (!c) throw new Error(m); }
assert(SUBMISSIONS_RESTORE_KEY === 'submissionsRestore-oct6-12-v1', 'marker key');
const rows = JSON.parse(readFileSync(new URL('../public/restore/submissions-oct6-12-v1.json', import.meta.url), 'utf8'));
assert(Array.isArray(rows) && rows.length === SUBMISSIONS_RESTORE_COUNT, '43 rows');
assert(new Set(rows.map((r: any) => r.id)).size === 43, 'unique ids');
assert(rows.every((r: any) => r.date >= '2026-10-06' && r.date <= '2026-10-12'), 'dates Oct 6–12');
assert(rows.filter((r: any) => r.storeId === 'store-elm').length === 19, '19 Little Elm');
assert(rows.filter((r: any) => r.storeId === 'store-prosper').length === 24, '24 Prosper');
const live = [{ id: 'cur-1', v: 'live' }, { id: rows[0].id, v: 'live-wins' }];
const { next, added } = mergeRestoredSubmissions(live as any[], rows);
assert(added === 42 && next.length === 44, 'adds only missing ids');
assert(next[0] === live[0] && next[1] === live[1] && (next[1] as any).v === 'live-wins', 'live rows kept, never overwritten');
assert(mergeRestoredSubmissions(next, rows).added === 0, 'idempotent');
assert(JSON.stringify(next).length < 900_000, 'size ok');
const db = readFileSync(new URL('../services/db.ts', import.meta.url), 'utf8');
const fn = db.slice(db.indexOf('async restoreOct6to12Submissions'), db.indexOf('async fetchAuditFeedback'));
assert(fn.includes('fetchSubmissionsForWrite()') && fn.includes('live.length === 0'), 'guarded re-read');
assert(fn.indexOf('SUBMISSIONS_MAX_BYTES') < fn.indexOf('remoteSet(DOC_KEYS.SUBMISSIONS'), 'size check before write');
assert(fn.indexOf('if (!ok) return;') < fn.indexOf('remoteSet(SUBMISSIONS_RESTORE_KEY'), 'marker after successful save');
console.log('verify-submissions-restore: OK');
