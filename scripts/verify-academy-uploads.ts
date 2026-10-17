/**
 * Smoke: Academy uploads never inline base64 into progress, migration only
 * swaps exact data URLs, pending completions survive a background sync.
 * Run: npx --yes tsx scripts/verify-academy-uploads.ts
 */
import { readFileSync } from 'node:fs';
import type { UserProgress } from '../types.ts';
import {
  applyMigratedUrls, certificationStoragePath, entryHasInlineData, extFromDataUrl,
  extFromFileName, isDataUrl, mergePendingProgress, PROGRESS_INLINE_MIGRATION_KEY,
} from '../utils/progressUploads.ts';

function assert(c: unknown, m: string): asserts c { if (!c) throw new Error(m); }

assert(PROGRESS_INLINE_MIGRATION_KEY === 'progressInlineFilesMigrated-v1', 'marker key');
assert(isDataUrl('data:image/jpeg;base64,xx') && !isDataUrl('https://x'), 'isDataUrl');
assert(extFromDataUrl('data:application/pdf;base64,x') === 'pdf', 'pdf ext');
assert(extFromDataUrl('data:image/jpeg;base64,x') === 'jpg', 'jpg ext');
assert(extFromFileName('License.PDF') === 'pdf', 'file ext');
assert(certificationStoragePath('u 1', 'l-certification', 'pdf', 5) === 'training/certifications/u_1/l-certification-5.pdf', 'path');

const cert: UserProgress = { userId: 'u1', lessonId: 'l-certification', status: 'COMPLETED', completedAt: '2026-08-01', fileUrl: 'data:application/pdf;base64,AAA', fileName: 'x.pdf' };
const photo: UserProgress = { userId: 'u2', lessonId: 'l-practice', status: 'COMPLETED', completedAt: '2026-08-02', checklistPhotos: { a: 'data:image/jpeg;base64,BBB', b: 'https://ok' } };
const plain: UserProgress = { userId: 'u3', lessonId: 'l-quiz', status: 'COMPLETED', score: 90 };
const newer: UserProgress = { ...cert, userId: 'u4', fileUrl: 'data:application/pdf;base64,ZZZ' };
assert(entryHasInlineData(cert) && entryHasInlineData(photo) && !entryHasInlineData(plain), 'inline detect');

const repl = new Map([['data:application/pdf;base64,AAA', 'https://s/cert'], ['data:image/jpeg;base64,BBB', 'https://s/photo']]);
const { next, replaced } = applyMigratedUrls([cert, photo, plain, newer], repl);
assert(replaced === 2, `replaced 2, got ${replaced}`);
assert(next[0].fileUrl === 'https://s/cert' && next[0].fileName === 'x.pdf', 'cert swapped, name kept');
assert(next[1].checklistPhotos!.a === 'https://s/photo' && next[1].checklistPhotos!.b === 'https://ok', 'photo swapped');
assert(next[2] === plain, 'plain entry untouched');
assert(next[3].fileUrl === 'data:application/pdf;base64,ZZZ', 'non-uploaded data left in place (no loss)');
assert(next.length === 4, 'no entries dropped');

const local: UserProgress = { userId: 'g', lessonId: 'l-certification', status: 'COMPLETED', completedAt: '2026-10-13T10:00:00Z', fileUrl: 'https://s/g' };
const merged = mergePendingProgress([plain], [local]);
assert(merged.length === 2 && merged[1] === local, 'pending survives a sync without it');
const cloudHas = mergePendingProgress([{ ...local }], [local]);
assert(cloudHas.length === 1, 'no duplicate once cloud has it');
assert(mergePendingProgress([plain], []).length === 1, 'no pending = cloud as-is');

// Source guards: no base64 fallback, file upload goes to Storage, save result checked.
const dbSrc0 = readFileSync(new URL('../services/db.ts', import.meta.url), 'utf8');
const tv = readFileSync(new URL('../components/TrainingView.tsx', import.meta.url), 'utf8');
assert(!tv.includes('photoUrl = compressed'), 'TrainingView must not fall back to base64 photos');
assert(!/url: base64/.test(tv), 'certificate must not be saved as base64');
assert(tv.includes('db.uploadFile('), 'certificate uploads to Storage');
assert(tv.includes('db.storeInlineFile('), 'certificate falls back to Firestore file doc');
assert(dbSrc0.includes('saveTrainingFile(v, path'), 'migration falls back when Storage denies');
assert(!/\[selectedLesson, progress\]\)/.test(tv), 'checklist state must not reset on every progress sync');
const dbSrc = readFileSync(new URL('../services/db.ts', import.meta.url), 'utf8');
assert(/const ok = await this\.remoteSet\(DOC_KEYS\.PROGRESS, merged\);\s*if \(!ok\)/.test(dbSrc), 'pushProgress must throw when remoteSet refuses');
console.log('verify-academy-uploads: OK');
import { FSDOC_PREFIX, fsDocIdFromRef, isFsDocRef, progressFileDocId } from '../utils/progressUploads.ts';
const ref = FSDOC_PREFIX + progressFileDocId('u-1', 'l-certification', 0, 0);
assert(ref === 'fsdoc:progressFiles-u-1-l-certification-0-0', 'fsdoc ref format');
assert(isFsDocRef(ref) && !isDataUrl(ref) && fsDocIdFromRef(ref) === 'progressFiles-u-1-l-certification-0-0', 'fsdoc parse');
assert(!entryHasInlineData({ ...cert, fileUrl: ref }), 'fsdoc ref is not inline data');
console.log('verify-academy-uploads (fsdoc): OK');
const appSrc = readFileSync(new URL('../App.tsx', import.meta.url), 'utf8');
assert(!appSrc.includes('pushFullSubmissionsRegistry('), 'reset must not push the local submissions list');
assert(appSrc.includes('db.deleteSubmission(id)'), 'reset deletes by id');
console.log('verify reset-submission guard: OK');
