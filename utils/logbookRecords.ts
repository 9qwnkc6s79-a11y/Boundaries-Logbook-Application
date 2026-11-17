/**
 * One immutable document per logbook submission.
 * Path: organizations/{orgId}/logbookSubmissions/{submissionId}
 *
 * Drafts may be updated. A non-draft record is not replaced. The only later
 * change allowed is swapping an inline data URL for an https Storage URL
 * on the same task, so a photo that finished uploading is not dropped.
 * Missing days are reported. Nothing is invented to fill them.
 */

export const GAP_REPORT_START = '2026-09-01';
export const LOGBOOK_STORES = ['store-elm', 'store-prosper'] as const;
export const DAILY_CHECKLIST_TYPES = ['OPENING', 'SHIFT_CHANGE', 'CLOSING'] as const;

export type DailyChecklistType = (typeof DAILY_CHECKLIST_TYPES)[number];
export type GapStatus = 'present' | 'partial-export' | 'gap' | 'no-source';

export interface LogbookTaskItem {
  taskId: string;
  completed?: boolean;
  photoUrl?: string;
  photoUrls?: string[];
  value?: string;
  comment?: string;
  completedByUserId?: string;
  completedAt?: string;
}

export interface LogbookPhotoRef {
  taskId: string;
  urls: string[];
}

export interface LogbookRecord {
  id: string;
  storeId: string;
  businessDate: string;
  templateId?: string;
  checklistType?: string;
  userId?: string;
  startedAt?: string;
  submittedAt?: string;
  status: string;
  items: LogbookTaskItem[];
  itemsOmitted?: boolean;
  completionPercent: number | null;
  photoRefs: LogbookPhotoRef[];
  sealed: boolean;
  provenance: {
    source: 'client' | 'archive' | 'live' | 'logbook-export';
    rebuiltAt?: string;
    archiveDocId?: string;
    note?: string;
  };
}

export interface SubmissionLike {
  id?: string;
  userId?: string;
  storeId?: string;
  templateId?: string;
  date?: string;
  status?: string;
  submittedAt?: string;
  taskResults?: LogbookTaskItem[];
}

export interface TemplateLike {
  id?: string;
  storeId?: string;
  type?: string;
}

export interface ExportChecklistLike {
  type?: string | null;
  status?: string | null;
  submittedAt?: string | null;
  tasksDone?: number;
  tasksTotal?: number;
  submittedBy?: string | null;
  name?: string | null;
}

export type RecordWrite = 'create' | 'update-draft' | 'seal' | 'patch-photos' | 'skip-immutable' | 'skip-invalid';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const DOC_ID_RE = /^[A-Za-z0-9_-]{1,200}$/;

export function isBusinessDate(value: string | undefined | null): value is string {
  return !!value && DATE_RE.test(value);
}

export function addDays(iso: string, days: number): string {
  const [year, month, day] = iso.split('-').map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + days));
  return next.toISOString().slice(0, 10);
}

export function eachDate(start: string, end: string): string[] {
  if (!isBusinessDate(start) || !isBusinessDate(end) || start > end) return [];
  const dates: string[] = [];
  for (let cursor = start; cursor <= end; cursor = addDays(cursor, 1)) dates.push(cursor);
  return dates;
}

export function monthKey(date: string): string | null {
  const match = /^(\d{4}-\d{2})-\d{2}$/.exec(date);
  return match ? match[1] : null;
}

export function completionPercent(items: { completed?: boolean }[] | undefined): number | null {
  if (!items || items.length === 0) return null;
  const done = items.filter(item => item.completed).length;
  return Math.round((done / items.length) * 1000) / 10;
}

export function photoRefsFromItems(items: LogbookTaskItem[] | undefined): LogbookPhotoRef[] {
  const refs: LogbookPhotoRef[] = [];
  for (const item of items || []) {
    const urls = [
      ...(item.photoUrl ? [item.photoUrl] : []),
      ...((item.photoUrls || []).filter(Boolean)),
    ];
    const unique = Array.from(new Set(urls));
    if (unique.length) refs.push({ taskId: item.taskId, urls: unique });
  }
  return refs;
}

function earliest(items: LogbookTaskItem[] | undefined): string | undefined {
  const stamps = (items || []).map(item => item.completedAt).filter((v): v is string => !!v).sort();
  return stamps[0];
}

export function buildLogbookRecord(
  submission: SubmissionLike,
  provenance: LogbookRecord['provenance'],
  checklistType?: string,
): LogbookRecord | null {
  if (!submission.id || !DOC_ID_RE.test(submission.id)) return null;
  if (!submission.storeId || !isBusinessDate(submission.date)) return null;
  const items = Array.isArray(submission.taskResults) ? submission.taskResults : [];
  const status = submission.status || 'DRAFT';
  return {
    id: submission.id,
    storeId: submission.storeId,
    businessDate: submission.date,
    templateId: submission.templateId,
    checklistType,
    userId: submission.userId,
    startedAt: earliest(items),
    submittedAt: submission.submittedAt,
    status,
    items,
    completionPercent: completionPercent(items),
    photoRefs: photoRefsFromItems(items),
    sealed: status !== 'DRAFT',
    provenance,
  };
}

function isInline(url: string): boolean {
  return url.startsWith('data:');
}

export function photoPatch(existing: LogbookRecord, incoming: LogbookRecord): LogbookPhotoRef[] | null {
  let improved = false;
  const next = existing.photoRefs.map(ref => ({ ...ref, urls: [...ref.urls] }));
  for (const incomingRef of incoming.photoRefs) {
    const found = next.find(ref => ref.taskId === incomingRef.taskId);
    const https = incomingRef.urls.filter(url => url.startsWith('https://') || url.startsWith('http://'));
    if (!https.length) continue;
    if (!found) {
      if (existing.photoRefs.some(ref => ref.urls.some(isInline))) {
        next.push({ taskId: incomingRef.taskId, urls: https });
        improved = true;
      }
      continue;
    }
    if (found.urls.some(isInline)) {
      found.urls = Array.from(new Set([...found.urls.filter(url => !isInline(url)), ...https]));
      improved = true;
    }
  }
  return improved ? next : null;
}

export function decideRecordWrite(existing: LogbookRecord | null, incoming: LogbookRecord | null): RecordWrite {
  if (!incoming) return 'skip-invalid';
  if (!existing) return incoming.sealed ? 'seal' : 'create';
  if (!existing.sealed && existing.status === 'DRAFT') {
    return incoming.sealed ? 'seal' : 'update-draft';
  }
  if (photoPatch(existing, incoming)) return 'patch-photos';
  return 'skip-immutable';
}

export function applyRecordWrite(existing: LogbookRecord | null, incoming: LogbookRecord): LogbookRecord | null {
  const decision = decideRecordWrite(existing, incoming);
  if (decision === 'skip-immutable' || decision === 'skip-invalid') return null;
  if (decision === 'patch-photos' && existing) {
    const refs = photoPatch(existing, incoming);
    if (!refs) return null;
    return {
      ...existing,
      photoRefs: refs,
      provenance: {
        ...existing.provenance,
        note: 'photo refs updated from a later upload; answers were not changed',
      },
    };
  }
  return incoming;
}

export interface ArchiveInput {
  [docId: string]: { rows?: SubmissionLike[] } | SubmissionLike[] | undefined;
}

export interface ExportDayInput {
  storeId: string;
  date: string;
  checklists?: ExportChecklistLike[];
}

export interface HistoryRebuildInput {
  archives?: ArchiveInput;
  live?: SubmissionLike[];
  templates?: TemplateLike[];
  exportDays?: ExportDayInput[];
  endDate: string;
}

export interface GapCell {
  storeId: string;
  date: string;
  checklistType: DailyChecklistType;
  status: GapStatus;
}

function templateType(templates: TemplateLike[] | undefined, templateId: string | undefined): string | undefined {
  if (!templateId) return undefined;
  return templates?.find(template => template.id === templateId)?.type;
}

function archiveRows(archives: ArchiveInput | undefined): { docId: string; row: SubmissionLike }[] {
  const out: { docId: string; row: SubmissionLike }[] = [];
  for (const [docId, payload] of Object.entries(archives || {})) {
    const rows = Array.isArray(payload) ? payload : payload?.rows;
    for (const row of rows || []) out.push({ docId, row });
  }
  return out;
}

function coveredMonths(input: HistoryRebuildInput): Set<string> {
  const months = new Set<string>();
  for (const docId of Object.keys(input.archives || {})) {
    const match = /submissionsArchive-(\d{4}-\d{2})/.exec(docId);
    if (match) months.add(match[1]);
  }
  for (const row of input.live || []) {
    const month = monthKey(row.date || '');
    if (month) months.add(month);
  }
  for (const day of input.exportDays || []) {
    const month = monthKey(day.date);
    if (month) months.add(month);
  }
  return months;
}

export function exportStubId(storeId: string, date: string, type: string): string {
  return `export-${storeId}-${date}-${type}`.replace(/[^A-Za-z0-9_-]/g, '_');
}

export interface HistoryRebuildPlan {
  records: LogbookRecord[];
  skipped: { id: string; reason: string }[];
  gaps: GapCell[];
  summary: {
    records: number;
    fromArchive: number;
    fromLive: number;
    fromExport: number;
    skipped: number;
    gaps: number;
    noSource: number;
    present: number;
  };
}

export function planHistoryRebuild(input: HistoryRebuildInput, rebuiltAt: string): HistoryRebuildPlan {
  const records = new Map<string, LogbookRecord>();
  const skipped: { id: string; reason: string }[] = [];
  const presentKeys = new Set<string>();
  const partialKeys = new Set<string>();

  const take = (record: LogbookRecord | null, reason: string) => {
    if (!record) {
      skipped.push({ id: '?', reason });
      return;
    }
    const existing = records.get(record.id) || null;
    const next = applyRecordWrite(existing, record);
    if (!next) {
      skipped.push({ id: record.id, reason: decideRecordWrite(existing, record) });
      return;
    }
    records.set(record.id, next);
  };

  for (const { docId, row } of archiveRows(input.archives)) {
    const type = templateType(input.templates, row.templateId);
    take(buildLogbookRecord(row, {
      source: 'archive',
      rebuiltAt,
      archiveDocId: docId,
      note: 'rebuilt from submissions archive; not invented',
    }, type), 'archive row missing id, store, or business date');
  }
  for (const row of input.live || []) {
    const type = templateType(input.templates, row.templateId);
    take(buildLogbookRecord(row, {
      source: 'live',
      rebuiltAt,
      note: 'rebuilt from the live submissions doc; not invented',
    }, type), 'live row missing id, store, or business date');
  }

  for (const record of records.values()) {
    if (!record.checklistType) continue;
    presentKeys.add(`${record.storeId}|${record.businessDate}|${record.checklistType}`);
  }

  for (const day of input.exportDays || []) {
    if (!isBusinessDate(day.date)) continue;
    for (const checklist of day.checklists || []) {
      const type = checklist.type || '';
      if (!DAILY_CHECKLIST_TYPES.includes(type as DailyChecklistType)) continue;
      const key = `${day.storeId}|${day.date}|${type}`;
      if (presentKeys.has(key)) continue;
      partialKeys.add(key);
      const tasksTotal = checklist.tasksTotal ?? 0;
      const tasksDone = checklist.tasksDone ?? 0;
      const id = exportStubId(day.storeId, day.date, type);
      take({
        id,
        storeId: day.storeId,
        businessDate: day.date,
        checklistType: type,
        status: checklist.status || 'UNKNOWN',
        submittedAt: checklist.submittedAt || undefined,
        items: [],
        itemsOmitted: true,
        completionPercent: tasksTotal > 0 ? Math.round((tasksDone / tasksTotal) * 1000) / 10 : null,
        photoRefs: [],
        sealed: checklist.status !== 'DRAFT',
        provenance: {
          source: 'logbook-export',
          rebuiltAt,
          note: 'Export has no task rows or photo refs. Counts only; nothing was filled in.',
        },
      }, 'export stub rejected');
    }
  }

  const months = coveredMonths(input);
  const gaps: GapCell[] = [];
  for (const date of eachDate(GAP_REPORT_START, input.endDate)) {
    const month = monthKey(date);
    const covered = !!month && months.has(month);
    for (const storeId of LOGBOOK_STORES) {
      for (const checklistType of DAILY_CHECKLIST_TYPES) {
        const key = `${storeId}|${date}|${checklistType}`;
        let status: GapStatus;
        if (presentKeys.has(key)) status = 'present';
        else if (partialKeys.has(key)) status = 'partial-export';
        else if (!covered) status = 'no-source';
        else status = 'gap';
        gaps.push({ storeId, date, checklistType, status });
      }
    }
  }

  const list = Array.from(records.values());
  return {
    records: list,
    skipped,
    gaps,
    summary: {
      records: list.length,
      fromArchive: list.filter(r => r.provenance.source === 'archive').length,
      fromLive: list.filter(r => r.provenance.source === 'live').length,
      fromExport: list.filter(r => r.provenance.source === 'logbook-export').length,
      skipped: skipped.length,
      gaps: gaps.filter(g => g.status === 'gap').length,
      noSource: gaps.filter(g => g.status === 'no-source').length,
      present: gaps.filter(g => g.status === 'present' || g.status === 'partial-export').length,
    },
  };
}
