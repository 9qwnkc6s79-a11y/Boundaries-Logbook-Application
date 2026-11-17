/**
 * IndexedDB copy of the upload queue so a refresh does not drop a photo.
 * Falls back to memory when IndexedDB is missing (tests, very old webviews).
 */

import {
  dueUploads,
  markUploaded,
  recordFailure,
  type QueuedUpload,
} from '../utils/uploadQueue';

const DB_NAME = 'boundaries-upload-queue';
const STORE = 'uploads';

let memory: QueuedUpload[] | null = null;

function openDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  return new Promise((resolve) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
  });
}

async function readAll(): Promise<QueuedUpload[]> {
  const db = await openDb();
  if (!db) return memory || [];
  return new Promise((resolve) => {
    const tx = db.transaction(STORE, 'readonly');
    const request = tx.objectStore(STORE).getAll();
    request.onsuccess = () => resolve((request.result || []) as QueuedUpload[]);
    request.onerror = () => resolve(memory || []);
  });
}

async function writeAll(items: QueuedUpload[]): Promise<void> {
  const db = await openDb();
  if (!db) {
    memory = items;
    return;
  }
  await new Promise<void>((resolve) => {
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    store.clear();
    for (const item of items) store.put(item);
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
}

export async function countQueuedUploads(): Promise<number> {
  return (await readAll()).length;
}

export async function listQueuedUploads(): Promise<QueuedUpload[]> {
  return readAll();
}

export async function rememberFailedUpload(input: { storagePath: string; dataUrl: string; error?: string }): Promise<void> {
  const items = recordFailure(await readAll(), input);
  await writeAll(items);
}

export async function forgetUploaded(storagePath: string): Promise<void> {
  await writeAll(markUploaded(await readAll(), storagePath));
}

export async function uploadsDue(now = new Date()): Promise<QueuedUpload[]> {
  return dueUploads(await readAll(), now);
}
