/**
 * Failed uploads stay queued and retry with backoff. No Storage calls.
 * Run: npx tsx scripts/verify-upload-queue.ts
 */
import { readFileSync } from 'node:fs';
import {
  backoffMs,
  dueUploads,
  markUploaded,
  recordFailure,
  replaceDataUrl,
} from '../utils/uploadQueue.ts';

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

const now = new Date('2026-11-17T12:00:00.000Z');
let items = recordFailure([], {
  storagePath: 'photos/store-elm/2026-11-17/sub-1/task-1.jpg',
  dataUrl: 'data:image/jpeg;base64,abc',
  error: 'permission denied',
}, now);
assert(items.length === 1, 'failure is kept');
assert(items[0].attempts === 1, 'first attempt');
assert(items[0].lastError === 'permission denied', 'error kept');
assert(dueUploads(items, now).length === 0, 'not due immediately');
assert(dueUploads(items, new Date(now.getTime() + backoffMs(1))).length === 1, 'due after backoff');

items = recordFailure(items, {
  storagePath: 'photos/store-elm/2026-11-17/sub-1/task-1.jpg',
  dataUrl: 'data:image/jpeg;base64,abc',
  error: 'still denied',
}, new Date(now.getTime() + 10_000));
assert(items.length === 1, 'same path does not duplicate');
assert(items[0].attempts === 2, 'attempts increase');
assert(items[0].dataUrl.startsWith('data:'), 'bytes stay on the queue');

items = recordFailure(items, { storagePath: 'other.jpg', dataUrl: 'https://nope' }, now);
assert(items.length === 1, 'non-data urls are not queued');

const cleared = markUploaded(items, 'photos/store-elm/2026-11-17/sub-1/task-1.jpg');
assert(cleared.length === 0, 'success removes the item');

const submission = {
  id: 'sub-1',
  taskResults: [{ taskId: 't1', photoUrl: 'data:image/jpeg;base64,abc', photoUrls: ['data:image/jpeg;base64,abc'] }],
};
const replaced = replaceDataUrl(submission, 'data:image/jpeg;base64,abc', 'https://cdn.example/photo.jpg');
assert(replaced.taskResults[0].photoUrl === 'https://cdn.example/photo.jpg', 'photo url replaced');
assert(replaced.taskResults[0].photoUrls[0].startsWith('https://'), 'photo list replaced');
assert(replaced.id === 'sub-1', 'other fields stay');

const db = readFileSync(new URL('../services/db.ts', import.meta.url), 'utf8');
assert(db.includes('rememberFailedUpload'), 'uploadPhoto records a failed Storage upload');
assert(db.includes('forgetUploaded'), 'a successful upload leaves the queue');
const app = readFileSync(new URL('../App.tsx', import.meta.url), 'utf8');
assert(app.includes('waiting to upload'), 'the app tells staff a photo is still queued');

console.log('verify-upload-queue: OK');
