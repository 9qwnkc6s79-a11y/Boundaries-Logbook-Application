/**
 * Client queue for photo/file uploads that Storage rejected.
 * Items stay until an upload returns an https URL. Nothing is dropped
 * after N failures. Callers still keep the inline copy they already had.
 */

export interface QueuedUpload {
  id: string;
  storagePath: string;
  dataUrl: string;
  attempts: number;
  lastError?: string;
  createdAt: string;
  nextAttemptAt: string;
}

export function queueId(storagePath: string): string {
  return `up-${storagePath.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
}

export function backoffMs(attempts: number): number {
  const steps = [5_000, 15_000, 60_000, 5 * 60_000, 15 * 60_000];
  return steps[Math.min(Math.max(attempts, 1), steps.length) - 1];
}

export function recordFailure(
  items: QueuedUpload[],
  input: { storagePath: string; dataUrl: string; error?: string },
  now: Date = new Date(),
): QueuedUpload[] {
  if (!input.dataUrl.startsWith('data:') || !input.storagePath) return items;
  const id = queueId(input.storagePath);
  const prev = items.find(item => item.id === id);
  const attempts = (prev?.attempts || 0) + 1;
  const next: QueuedUpload = {
    id,
    storagePath: input.storagePath,
    dataUrl: input.dataUrl,
    attempts,
    lastError: input.error || prev?.lastError,
    createdAt: prev?.createdAt || now.toISOString(),
    nextAttemptAt: new Date(now.getTime() + backoffMs(attempts)).toISOString(),
  };
  return [...items.filter(item => item.id !== id), next];
}

export function markUploaded(items: QueuedUpload[], storagePath: string): QueuedUpload[] {
  const id = queueId(storagePath);
  return items.filter(item => item.id !== id);
}

export function dueUploads(items: QueuedUpload[], now: Date = new Date()): QueuedUpload[] {
  const stamp = now.toISOString();
  return items.filter(item => item.nextAttemptAt <= stamp);
}

export function replaceDataUrl<T>(value: T, dataUrl: string, httpsUrl: string): T {
  if (typeof value === 'string') return (value === dataUrl ? httpsUrl : value) as T;
  if (Array.isArray(value)) return value.map(item => replaceDataUrl(item, dataUrl, httpsUrl)) as T;
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      out[key] = replaceDataUrl(child, dataUrl, httpsUrl);
    }
    return out as T;
  }
  return value;
}
