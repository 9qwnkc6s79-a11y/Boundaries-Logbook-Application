/**
 * Read-only logbook export for the weekly manager pack.
 *
 * GET /api/logbook-export?location=littleelm|prosper|le&start=YYYY-MM-DD&end=YYYY-MM-DD
 * Authorization: Bearer <LOGBOOK_EXPORT_TOKEN>
 *
 * Self-contained Vercel function — do not import ./_lib (Node ESM on Vercel
 * cannot resolve those and the function crashes at boot).
 *
 * Firestore is read the same way as /api/toast-food-sold: the project's
 * existing REST client (web API key, no Firebase Auth). There is no Firebase
 * Admin service account on the Vercel project. The route itself is closed
 * unless LOGBOOK_EXPORT_TOKEN matches.
 *
 * Required env:
 *   LOGBOOK_EXPORT_TOKEN  shared secret. Any non-empty string. Generate with
 *                         `openssl rand -base64 32`. The consumer stores the
 *                         same value as BREWSHIFT_EXPORT_TOKEN.
 * Optional env:
 *   LOGBOOK_EXPORT_ORG_ID Firestore org id. Defaults to org-boundaries.
 *
 * Store ids (live organizations/org-boundaries data):
 *   littleelm, le -> store-elm
 *   prosper       -> store-prosper
 *
 * Dates are America/Chicago business dates already stored on the records
 * (YYYY-MM-DD). On-time compares submittedAt to deadlineHour in that timezone.
 * An Opening stored on day D but submitted before its deadline on Chicago
 * day D+1 is reported on D+1 (stored rows are not rewritten).
 */

import { createHash, timingSafeEqual } from 'crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = { maxDuration: 60 };

const PROJECT = 'boundaries-logbook-app';
const API_KEY = 'AIzaSyDbOuTQGRW2LtQUpRFHmcXj782Zp4tEKvQ';
const CHICAGO_TZ = 'America/Chicago';
export const MAX_RANGE_DAYS = 120;
export const MAX_ARCHIVE_SHARDS = 24;

const DAILY_TYPES = new Set(['OPENING', 'SHIFT_CHANGE', 'CLOSING']);
const TYPE_ORDER: Record<string, number> = { OPENING: 0, SHIFT_CHANGE: 1, CLOSING: 2 };

export const LOCATION_STORE_IDS: Record<string, { location: 'littleelm' | 'prosper'; storeId: string }> = {
  littleelm: { location: 'littleelm', storeId: 'store-elm' },
  le: { location: 'littleelm', storeId: 'store-elm' },
  prosper: { location: 'prosper', storeId: 'store-prosper' },
};

type QueryValue = string | string[] | undefined;

export interface ExportSubmission {
  id: string;
  userId?: string;
  storeId?: string;
  templateId?: string;
  date?: string;
  status?: string;
  submittedAt?: string;
  taskResults?: { completed?: boolean; taskId?: string }[];
}

export interface ExportTemplate {
  id: string;
  name?: string;
  storeId?: string;
  type?: string;
  deadlineHour?: number;
  tasks?: { id?: string }[];
}

export interface ExportUser {
  id: string;
  name?: string;
}

export interface ChecklistExport {
  name: string | null;
  type: string | null;
  deadlineHour: number | null;
  status: string | null;
  submittedAt: string | null;
  onTime: boolean | null;
  tasksDone: number;
  tasksTotal: number;
  submittedBy: string | null;
}

export interface DayExport {
  date: string;
  checklists: ChecklistExport[];
  deposits: {
    expectedDeposit: number | null;
    actualDeposit: number | null;
    variance: number | null;
    status: string | null;
  }[];
  closingWaste: {
    itemName: string | null;
    leftoverQty: number | null;
    wasteQty: number | null;
  }[];
  inventoryCounts: Record<string, unknown>[];
  food86Events: Record<string, unknown>[];
}

export function firstQuery(value: QueryValue | unknown): string {
  if (Array.isArray(value)) return firstQuery(value[0]);
  if (typeof value === 'string') return value.trim();
  return '';
}

export function headerValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] || '';
  return value || '';
}

/** SHA-256 both sides so timingSafeEqual does not throw on length mismatch. */
export function tokenMatches(provided: string, expected: string): boolean {
  const a = createHash('sha256').update(provided).digest();
  const b = createHash('sha256').update(expected).digest();
  return timingSafeEqual(a, b);
}

export function readBearer(authorization: string | undefined): string | null {
  const match = /^Bearer\s+(\S+)\s*$/i.exec((authorization || '').trim());
  return match ? match[1] : null;
}

export function authorizeExport(
  authorization: string | undefined,
  expectedToken: string | undefined
): { ok: true } | { ok: false; status: number; error: string } {
  if (!expectedToken) return { ok: false, status: 500, error: 'server not configured' };
  const bearer = readBearer(authorization);
  if (!bearer || !tokenMatches(bearer, expectedToken)) {
    return { ok: false, status: 401, error: 'unauthorized' };
  }
  return { ok: true };
}

function parseYmd(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const utc = new Date(Date.UTC(year, month - 1, day));
  return utc.getUTCFullYear() === year && utc.getUTCMonth() === month - 1 && utc.getUTCDate() === day;
}

export function enumerateDates(start: string, end: string): string[] {
  const dates: string[] = [];
  const [y, m, d] = start.split('-').map(Number);
  const cursor = new Date(Date.UTC(y, m - 1, d));
  const last = end;
  while (dates.length <= MAX_RANGE_DAYS + 1) {
    const ymd = cursor.toISOString().slice(0, 10);
    dates.push(ymd);
    if (ymd === last) break;
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

export function parseExportQuery(query: {
  location?: QueryValue;
  start?: QueryValue;
  end?: QueryValue;
}): | { ok: true; location: 'littleelm' | 'prosper'; storeId: string; start: string; end: string; dates: string[] }
  | { ok: false; status: 400; error: string } {
  const locationKey = firstQuery(query.location).toLowerCase();
  const start = firstQuery(query.start);
  const end = firstQuery(query.end);
  const mapped = LOCATION_STORE_IDS[locationKey];
  if (!mapped) {
    return { ok: false, status: 400, error: 'location must be littleelm, le, or prosper' };
  }
  if (!start || !end) {
    return { ok: false, status: 400, error: 'start and end are required (YYYY-MM-DD)' };
  }
  if (!parseYmd(start) || !parseYmd(end)) {
    return { ok: false, status: 400, error: 'start and end must be real YYYY-MM-DD dates' };
  }
  if (end < start) {
    return { ok: false, status: 400, error: 'end must be on or after start' };
  }
  const dates = enumerateDates(start, end);
  if (dates.length > MAX_RANGE_DAYS) {
    return { ok: false, status: 400, error: `Date range exceeds ${MAX_RANGE_DAYS} days` };
  }
  return { ok: true, location: mapped.location, storeId: mapped.storeId, start, end, dates };
}

export function businessDate(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(value);
  return match ? match[1] : null;
}

function chicagoOffsetMs(utcMs: number): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: CHICAGO_TZ,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(utcMs));
  const n = (type: string) => {
    const raw = parts.find(p => p.type === type)?.value || '0';
    return Number(raw);
  };
  let hour = n('hour');
  let day = n('day');
  let month = n('month');
  let year = n('year');
  if (hour === 24) {
    hour = 0;
    const rolled = new Date(Date.UTC(year, month - 1, day));
    rolled.setUTCDate(rolled.getUTCDate() + 1);
    year = rolled.getUTCFullYear();
    month = rolled.getUTCMonth() + 1;
    day = rolled.getUTCDate();
  }
  const asUtc = Date.UTC(year, month - 1, day, hour, n('minute'), n('second'));
  return asUtc - utcMs;
}

/** UTC millis of deadlineHour:00 America/Chicago on the business date. */
export function chicagoDeadlineMs(ymd: string, hour: number): number {
  const [y, m, d] = ymd.split('-').map(Number);
  const desired = Date.UTC(y, m - 1, d, hour, 0, 0);
  let utc = desired;
  for (let i = 0; i < 4; i++) {
    const next = desired - chicagoOffsetMs(utc);
    if (next === utc) break;
    utc = next;
  }
  return utc;
}

export function addCalendarDays(ymd: string, days: number): string {
  const [y, m, d] = ymd.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

/** America/Chicago calendar date and clock time for an ISO timestamp. */
export function chicagoWallClock(iso: string): { ymd: string; hour: number; minute: number } | null {
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return null;
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: CHICAGO_TZ,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(at);
  const n = (type: string) => Number(parts.find(p => p.type === type)?.value || '0');
  let hour = n('hour');
  let day = n('day');
  let month = n('month');
  let year = n('year');
  if (hour === 24) {
    hour = 0;
    const rolled = new Date(Date.UTC(year, month - 1, day));
    rolled.setUTCDate(rolled.getUTCDate() + 1);
    year = rolled.getUTCFullYear();
    month = rolled.getUTCMonth() + 1;
    day = rolled.getUTCDate();
  }
  const ymd = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return { ymd, hour, minute: n('minute') };
}

/**
 * Date the export reports for a submission.
 * Stored dates are not rewritten. The one correction: an Opening whose stored
 * date is D, but which was submitted on Chicago day D+1 at or before
 * deadlineHour:00, is reported on D+1. That is the Prosper Opening case
 * (unlockHour 24 booked every morning open onto the previous day). Anything
 * else, including a next-morning submit after the deadline, stays on D.
 */
export function reportedBusinessDate(sub: ExportSubmission, template: ExportTemplate | undefined): string | null {
  const stored = businessDate(sub.date);
  if (!stored) return null;
  if (template?.type !== 'OPENING' || !sub.submittedAt || typeof template.deadlineHour !== 'number') {
    return stored;
  }
  const wall = chicagoWallClock(sub.submittedAt);
  if (!wall) return stored;
  const nextDay = addCalendarDays(stored, 1);
  if (wall.ymd !== nextDay) return stored;
  const at = new Date(sub.submittedAt).getTime();
  if (at <= chicagoDeadlineMs(nextDay, template.deadlineHour)) return nextDay;
  return stored;
}

export function isOnTime(submittedAt: string | undefined, ymd: string, deadlineHour: number | undefined): boolean | null {
  if (!submittedAt || typeof deadlineHour !== 'number' || !Number.isFinite(deadlineHour) || !businessDate(ymd)) {
    return null;
  }
  const at = new Date(submittedAt);
  if (Number.isNaN(at.getTime())) return null;
  return at.getTime() <= chicagoDeadlineMs(ymd, deadlineHour);
}

function humanName(users: ExportUser[], userId: string | undefined): string | null {
  if (!userId) return null;
  const user = users.find(u => u.id === userId);
  const name = typeof user?.name === 'string' ? user.name.trim() : '';
  return name || null;
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function passThrough(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    if (value !== undefined) out[key] = value;
  }
  return out;
}

function pickSubmission(matches: ExportSubmission[]): ExportSubmission | null {
  if (matches.length === 0) return null;
  return [...matches].sort((a, b) => (b.submittedAt || '').localeCompare(a.submittedAt || ''))[0];
}

/** Count completed tasks that are still on the template, and never above tasksTotal. */
export function taskProgress(
  sub: ExportSubmission,
  template: ExportTemplate | undefined
): { tasksDone: number; tasksTotal: number } {
  const results = sub.taskResults || [];
  const templateTasks = Array.isArray(template?.tasks) ? template.tasks : null;
  if (!templateTasks) {
    const tasksTotal = results.length;
    const tasksDone = results.filter(t => t?.completed === true).length;
    return { tasksDone: Math.min(tasksDone, tasksTotal), tasksTotal };
  }
  const ids = new Set(templateTasks.map(t => (typeof t?.id === 'string' && t.id ? t.id : '')).filter(Boolean));
  const tasksTotal = templateTasks.length;
  let tasksDone: number;
  if (ids.size > 0) {
    const done = new Set<string>();
    for (const result of results) {
      if (result?.completed === true && result.taskId && ids.has(result.taskId)) done.add(result.taskId);
    }
    tasksDone = done.size;
  } else {
    tasksDone = results.filter(t => t?.completed === true).length;
  }
  return { tasksDone: Math.min(tasksDone, tasksTotal), tasksTotal };
}

function checklistFromSubmission(
  sub: ExportSubmission,
  template: ExportTemplate | undefined,
  users: ExportUser[],
  ymd: string
): ChecklistExport {
  const { tasksDone, tasksTotal } = taskProgress(sub, template);
  return {
    name: template?.name || sub.templateId || null,
    type: template?.type || null,
    deadlineHour: typeof template?.deadlineHour === 'number' ? template.deadlineHour : null,
    status: sub.status || null,
    submittedAt: sub.submittedAt || null,
    onTime: isOnTime(sub.submittedAt, ymd, template?.deadlineHour),
    tasksDone,
    tasksTotal,
    submittedBy: humanName(users, sub.userId),
  };
}

function missingChecklist(template: ExportTemplate): ChecklistExport {
  return {
    name: template.name || template.id,
    type: template.type || null,
    deadlineHour: typeof template.deadlineHour === 'number' ? template.deadlineHour : null,
    status: 'MISSING',
    submittedAt: null,
    onTime: null,
    tasksDone: 0,
    tasksTotal: Array.isArray(template.tasks) ? template.tasks.length : 0,
    submittedBy: null,
  };
}

export function parseArchivePayload(data: unknown): { rows: unknown[]; shardCount: number; recognized: boolean } {
  if (data == null) return { rows: [], shardCount: 1, recognized: true };
  if (Array.isArray(data)) return { rows: data, shardCount: 1, recognized: true };
  if (typeof data === 'object' && Array.isArray((data as { rows?: unknown }).rows)) {
    const raw = Number((data as { shardCount?: unknown }).shardCount);
    const shardCount = Number.isFinite(raw) && raw >= 1 ? Math.min(MAX_ARCHIVE_SHARDS, Math.floor(raw)) : 1;
    return { rows: (data as { rows: unknown[] }).rows, shardCount, recognized: true };
  }
  return { rows: [], shardCount: 1, recognized: false };
}

export function mergeSubmissionRows(archived: ExportSubmission[], live: ExportSubmission[]): ExportSubmission[] {
  const map = new Map<string, ExportSubmission>();
  for (const row of archived) {
    if (row?.id) map.set(row.id, row);
  }
  for (const row of live) {
    if (!row?.id) continue;
    const prev = map.get(row.id);
    if (!prev || (row.submittedAt || '') >= (prev.submittedAt || '')) map.set(row.id, row);
  }
  return Array.from(map.values());
}

export function buildLogbookDays(input: {
  dates: string[];
  storeId: string;
  submissions: ExportSubmission[];
  templates: ExportTemplate[];
  users: ExportUser[];
  deposits: Record<string, unknown>[];
  closingWaste: Record<string, unknown>[];
  inventoryCounts: Record<string, unknown>[];
  food86Events: Record<string, unknown>[];
}): { days: DayExport[] } {
  const dailyTemplates = input.templates
    .filter(t => t.storeId === input.storeId && !!t.type && DAILY_TYPES.has(t.type))
    .sort((a, b) => (TYPE_ORDER[a.type || ''] ?? 99) - (TYPE_ORDER[b.type || ''] ?? 99) || (a.name || '').localeCompare(b.name || ''));

  const templatesById = new Map(input.templates.map(t => [t.id, t]));

  const days: DayExport[] = input.dates.map(date => {
    const subs = input.submissions.filter(s => {
      if (s.storeId !== input.storeId || s.status === 'DRAFT') return false;
      const template = s.templateId ? templatesById.get(s.templateId) : undefined;
      return reportedBusinessDate(s, template) === date;
    });
    const used = new Set<string>();
    const checklists: ChecklistExport[] = [];

    for (const template of dailyTemplates) {
      const best = pickSubmission(subs.filter(s => s.templateId === template.id));
      if (!best) {
        checklists.push(missingChecklist(template));
        continue;
      }
      used.add(best.id);
      checklists.push(checklistFromSubmission(best, template, input.users, date));
    }

    for (const sub of subs) {
      if (used.has(sub.id)) continue;
      const template = sub.templateId ? templatesById.get(sub.templateId) : undefined;
      if (template?.type && !DAILY_TYPES.has(template.type)) continue;
      if (template?.storeId && template.storeId !== input.storeId) continue;
      checklists.push(checklistFromSubmission(sub, template, input.users, date));
    }

    const deposits = input.deposits
      .filter(d => d.storeId === input.storeId && businessDate(d.depositDate || d.periodEnd) === date)
      .map(d => ({
        expectedDeposit: asNumber(d.expectedDeposit),
        actualDeposit: asNumber(d.actualDeposit),
        variance: asNumber(d.variance),
        status: typeof d.status === 'string' ? d.status : null,
      }));

    const closingWaste = input.closingWaste
      .filter(r => (r.storeId == null || r.storeId === input.storeId) && businessDate(r.businessDate) === date)
      .map(r => ({
        itemName: typeof r.itemName === 'string' ? r.itemName : null,
        leftoverQty: asNumber(r.leftoverQty),
        wasteQty: asNumber(r.wasteQty),
      }));

    const inventoryCounts = input.inventoryCounts
      .filter(r => (r.storeId == null || r.storeId === input.storeId) && businessDate(r.date) === date)
      .map(passThrough);

    const food86Events = input.food86Events
      .filter(r => (r.storeId == null || r.storeId === input.storeId) && businessDate(r.businessDate) === date)
      .map(passThrough);

    return { date, checklists, deposits, closingWaste, inventoryCounts, food86Events };
  });

  return { days };
}

function decodeValue(value: any): any {
  if (!value || typeof value !== 'object') return null;
  if ('nullValue' in value) return null;
  if ('stringValue' in value) return value.stringValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return value.doubleValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('timestampValue' in value) return value.timestampValue;
  if ('arrayValue' in value) return (value.arrayValue?.values || []).map(decodeValue);
  if ('mapValue' in value) {
    const fields = value.mapValue?.fields || {};
    return Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, decodeValue(v)]));
  }
  return null;
}

function asArray<T = any>(data: unknown): T[] {
  return Array.isArray(data) ? data as T[] : [];
}

function orgId(): string {
  return process.env.LOGBOOK_EXPORT_ORG_ID || 'org-boundaries';
}

function docUrl(docId: string): string {
  const path = `organizations/${orgId()}/data/${docId}`;
  return `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/${path}?key=${API_KEY}`;
}

async function readDoc(docId: string): Promise<{ missing: boolean; data: unknown }> {
  const response = await fetch(docUrl(docId));
  if (response.status === 404) return { missing: true, data: null };
  if (!response.ok) {
    throw new Error(`Firestore read failed for ${docId} (${response.status})`);
  }
  const json = await response.json();
  return { missing: false, data: decodeValue(json.fields?.data) };
}

function monthsCovering(dates: string[]): string[] {
  const months = new Set<string>();
  for (const date of dates) {
    const month = /^(\d{4}-\d{2})/.exec(date);
    if (month) months.add(month[1]);
  }
  return [...months].sort();
}

async function readArchivedSubmissions(dates: string[]): Promise<ExportSubmission[]> {
  const months = monthsCovering(dates);
  const perMonth = await Promise.all(months.map(async month => {
    const first = await readDoc(`submissionsArchive-${month}`);
    if (first.missing) return [] as ExportSubmission[];
    const parsed = parseArchivePayload(first.data);
    if (!parsed.recognized) {
      console.error(`[logbook-export] unrecognized archive shape for ${month}`);
      return [] as ExportSubmission[];
    }
    const rows = asArray<ExportSubmission>(parsed.rows);
    if (parsed.shardCount <= 1) return rows;
    const parts = await Promise.all(
      Array.from({ length: parsed.shardCount - 1 }, (_, i) => readDoc(`submissionsArchive-${month}-p${i + 2}`))
    );
    for (const part of parts) {
      if (part.missing) {
        console.error(`[logbook-export] missing archive shard for ${month}`);
        continue;
      }
      const parsedPart = parseArchivePayload(part.data);
      if (parsedPart.recognized) rows.push(...asArray<ExportSubmission>(parsedPart.rows));
    }
    return rows;
  }));
  return perMonth.flat();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = authorizeExport(headerValue(req.headers.authorization), process.env.LOGBOOK_EXPORT_TOKEN);
  if (auth.ok === false) return res.status(auth.status).json({ error: auth.error });

  const parsed = parseExportQuery(req.query);
  if (parsed.ok === false) return res.status(400).json({ error: parsed.error });

  try {
    const storeId = parsed.storeId;
    const [submissionsDoc, templatesDoc, usersDoc, depositsDoc, wasteDoc, countsDoc, eventsDoc, archived] = await Promise.all([
      readDoc('submissions'),
      readDoc('templates'),
      readDoc('users'),
      readDoc('deposits'),
      readDoc(`foodClosingWaste-${storeId}`),
      readDoc(`inventoryCounts-${storeId}`),
      readDoc(`food86Events-${storeId}`),
      readArchivedSubmissions(parsed.dates),
    ]);

    const live = asArray<ExportSubmission>(submissionsDoc.data);
    const submissions = mergeSubmissionRows(archived, live);
    const body = buildLogbookDays({
      dates: parsed.dates,
      storeId,
      submissions,
      templates: asArray<ExportTemplate>(templatesDoc.data),
      users: asArray<ExportUser>(usersDoc.data).map(u => ({ id: u.id, name: u.name })),
      deposits: asArray<Record<string, unknown>>(depositsDoc.data),
      closingWaste: asArray<Record<string, unknown>>(wasteDoc.data),
      inventoryCounts: asArray<Record<string, unknown>>(countsDoc.data),
      food86Events: asArray<Record<string, unknown>>(eventsDoc.data),
    });
    return res.status(200).json(body);
  } catch (error) {
    console.error('[logbook-export] read failed', error instanceof Error ? error.message : 'unknown');
    return res.status(500).json({ error: 'Failed to read logbook data' });
  }
}
