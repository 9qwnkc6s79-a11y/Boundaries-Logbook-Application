import { UserProgress } from '../types';

/**
 * Training progress lives in ONE Firestore doc (1 MB limit). Inline base64
 * certificates / practice photos filled it to ~995 KB, so every new upload
 * was blocked by remoteSet's size guard and silently "reset" in the UI.
 * Files go to Firebase Storage; progress only ever stores URLs.
 */
export const PROGRESS_INLINE_MIGRATION_KEY = 'progressInlineFilesMigrated-v1';

export function isDataUrl(v: unknown): v is string {
  return typeof v === 'string' && v.startsWith('data:');
}

export function extFromDataUrl(dataUrl: string): string {
  const mime = /^data:([^;,]+)/.exec(dataUrl)?.[1] || '';
  if (mime === 'application/pdf') return 'pdf';
  if (mime === 'image/png') return 'png';
  if (mime === 'image/heic') return 'heic';
  if (mime.startsWith('image/')) return 'jpg';
  return 'bin';
}

export function extFromFileName(name: string): string {
  const m = /\.([a-z0-9]{1,5})$/i.exec(name || '');
  return m ? m[1].toLowerCase() : 'bin';
}

export function safeSegment(s: string): string {
  return String(s || 'unknown').replace(/[^a-zA-Z0-9_-]/g, '_');
}

export function certificationStoragePath(userId: string, lessonId: string, ext: string, ts: number): string {
  return `training/certifications/${safeSegment(userId)}/${safeSegment(lessonId)}-${ts}.${ext}`;
}

export function entryHasInlineData(p: UserProgress): boolean {
  if (isDataUrl(p.fileUrl)) return true;
  if (p.checklistPhotos && Object.values(p.checklistPhotos).some(isDataUrl)) return true;
  if (p.practiceSubmissions?.some(s => (s as any).checklistPhotos && Object.values((s as any).checklistPhotos).some(isDataUrl))) return true;
  return false;
}

/**
 * Apply migrated URLs onto the LATEST progress list. Only swaps a field
 * whose value is still the exact data URL that was uploaded, so a newer
 * save is never clobbered.
 */
export function applyMigratedUrls(
  latest: UserProgress[],
  replacements: Map<string, string>,
): { next: UserProgress[]; replaced: number } {
  let replaced = 0;
  const swap = (v: string | undefined) => {
    if (v && replacements.has(v)) { replaced++; return replacements.get(v)!; }
    return v;
  };
  const next = latest.map(p => {
    if (!entryHasInlineData(p)) return p;
    const out: UserProgress = { ...p, fileUrl: swap(p.fileUrl) };
    if (p.checklistPhotos) {
      out.checklistPhotos = Object.fromEntries(
        Object.entries(p.checklistPhotos).map(([k, v]) => [k, swap(v) as string]),
      );
    }
    return out;
  });
  return { next, replaced };
}

/**
 * Keep a just-saved-locally entry on screen across a background sync until
 * the cloud copy has it. Never applies an empty cloud list.
 */
export function mergePendingProgress(
  cloud: UserProgress[],
  pending: UserProgress[],
): UserProgress[] {
  if (pending.length === 0) return cloud;
  const merged = [...cloud];
  for (const p of pending) {
    const idx = merged.findIndex(m => m.userId === p.userId && m.lessonId === p.lessonId);
    if (idx === -1) merged.push(p);
    else if ((merged[idx].completedAt || '') < (p.completedAt || '')) merged[idx] = p;
  }
  return merged;
}

/** Fallback when Storage rejects uploads: file lives in its own Firestore doc. */
export const FSDOC_PREFIX = 'fsdoc:';
/** Keep each file doc well under Firestore's 1 MB limit. */
export const FSDOC_MAX_CHARS = 900_000;

export function isFsDocRef(v: unknown): v is string {
  return typeof v === 'string' && v.startsWith(FSDOC_PREFIX);
}

export function fsDocIdFromRef(ref: string): string {
  return ref.slice(FSDOC_PREFIX.length);
}

export function progressFileDocId(userId: string, lessonId: string, ts: number, i = 0): string {
  return `progressFiles-${safeSegment(userId)}-${safeSegment(lessonId)}-${ts}-${i}`;
}
