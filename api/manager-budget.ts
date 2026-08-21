/**
 * Manager Hub sales / labor budget.
 *
 * Self-contained Vercel function — do not import ./_lib (Node ESM on Vercel
 * cannot resolve those and the function crashes at boot).
 *
 * Port of Boundaries-Management-Dashboard @ 274056b (PR #3):
 *   lib/manager-budget.ts
 *   lib/toast-labor.ts
 *   lib/toast-sales.ts
 *   lib/toast-client.ts
 *   lib/chicago-time.ts
 *   lib/budget.ts  (DEFAULT_LABOR_TARGET_PERCENT = 26)
 *
 * Sales: Toast Sales Summary identity (gross = net + sales discounts + sales
 * refunds). Drop gift-card / deferred overcounts. NOT the old net-from-ordersBulk
 * formula in api/toast-sales.ts.
 *
 * Labor: prefer Analytics POST /era/v1/labor → totalCost. If that 403s (this
 * machine client is blocked), fall back to /labor/v1/timeEntries hours ×
 * hourlyWage. Null/missing hourlyWage = not an hourly job (Owner, Manager);
 * those punches are excluded — no invented rate, not $0 labor, and they do
 * not mark the store Incomplete. Incomplete only when a punch that IS hourly
 * (wage present) cannot be costed because hours cannot be determined.
 * Incomplete stores list those hourly punches (name or Toast guid, job, in/out).
 * Wages are never invented or returned on the missing-punch objects.
 *
 * Dates: America/Chicago business dates, not UTC calendar dates / UTC-6.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = { maxDuration: 60 };

const TOAST_API = 'https://ws-api.toasttab.com';
export const CHICAGO_TZ = 'America/Chicago';
export const DEFAULT_LABOR_TARGET_PERCENT = 26;

const LITTLE_ELM_GUID =
  process.env.TOAST_RESTAURANT_LITTLEELM || '40980097-47ac-447d-8221-a5574db1b2f7';
const PROSPER_GUID =
  process.env.TOAST_RESTAURANT_PROSPER || 'f5e036bc-d8d0-4da9-8ec7-aec94806253b';

const PAGE_SIZE = 100;
const MAX_PAGES = 50;
const MAX_CONCURRENT = 3;
const MIN_REQUEST_GAP_MS = 200;
const MAX_REQUEST_GAP_MS = 1500;
const MAX_ATTEMPTS = 5;
const BASE_BACKOFF_MS = 600;
const TIME_BUDGET_MS = 48_000;

// ---------------------------------------------------------------------------
// Types (same payload shape as the live dashboard /api/manager/budget)
// ---------------------------------------------------------------------------

export type LaborCostStatus = 'ok' | 'blocked' | 'incomplete' | 'unavailable';
export type LaborVsTarget = 'under' | 'over' | 'unavailable';
export type LaborCostSource = 'era.labor.totalCost' | 'timeEntries.hourlyWage' | null;
export type MissingWageField = 'hourlyWage' | 'hours' | 'both';

/** Punch that made a store Incomplete. Never includes a wage amount. */
export interface MissingWagePunch {
  store: string;
  /** Toast name when one exists; otherwise employeeGuid / entityId. Never invented. */
  employeeName: string | null;
  employeeGuid: string;
  nameUnknown: boolean;
  jobName: string;
  jobGuid: string;
  /** ISO string as Toast sent it. */
  inDate: string | null;
  outDate: string | null;
  inDateChicago: string | null;
  outDateChicago: string | null;
  hours: number | null;
  missing: MissingWageField;
}

export interface LaborEndpointProbe {
  method: string;
  path: string;
  status: number;
  code?: number | string;
  message?: string;
  requestId?: string;
}

export interface StoreBudget {
  name: string;
  todaySales: number | null;
  mtdSales: number | null;
  mtdNetSales: number | null;
  mtdDiscounts: number | null;
  mtdLaborDollars: number | null;
  mtdLaborPercent: number | null;
  laborStatus: LaborCostStatus;
  laborVsTarget: LaborVsTarget;
  laborMessage: string;
  missingWagePunches: MissingWagePunch[];
  /** Non-hourly punches (null hourlyWage: Owner, Manager, …). Not a problem. */
  punchesExcluded?: number;
}

export interface ManagerBudget {
  timezone: 'America/Chicago';
  businessDate: string;
  period: { startDate: string; endDate: string; daysRequested: number; daysSucceeded: number };
  salesBasis: 'gross';
  salesComplete: boolean;
  salesNote?: string;
  laborTargetPercent: number;
  littleElm: StoreBudget;
  prosper: StoreBudget;
  labor: {
    status: LaborCostStatus;
    source: LaborCostSource;
    message: string;
    probes: LaborEndpointProbe[];
    missingWagePunches: MissingWagePunch[];
  };
}

export interface SalesBreakdown {
  netSales: number;
  grossSales: number;
  salesDiscounts: number;
  salesRefunds: number;
  tax: number;
  totalWithTax: number;
  tips: number;
  orders: number;
  checkAmount: number;
  deferredGiftCards: number;
  deferredOther: number;
  deferredHouseAccount: number;
  deferredDiscounts: number;
  waste: number;
  fundraisingCharges: number;
  serviceCharges: number;
}

export interface TimeEntryLabor {
  status: 'ok' | 'incomplete';
  dollars: number | null;
  punches: number;
  punchesWithWage: number;
  punchesMissingWage: number;
  /** Null/missing hourlyWage — not an hourly job. Excluded, not Incomplete. */
  punchesExcluded: number;
  hours: number;
  usedCostField: boolean;
  usedHoursTimesWage: boolean;
  missingWagePunches: MissingWagePunch[];
}

export interface SummariseTimeEntriesOptions {
  store?: string;
  employeeNames?: Map<string, string>;
  jobNames?: Map<string, string>;
}

export interface ChicagoDate {
  year: number;
  month: number;
  day: number;
}

interface StoreLaborCost {
  status: LaborCostStatus;
  mtdLaborDollars: number | null;
  days: number;
  punches?: number;
  punchesMissingWage?: number;
  punchesExcluded?: number;
  missingWagePunches: MissingWagePunch[];
  source: LaborCostSource;
  message: string;
}

interface LaborCostResult {
  status: LaborCostStatus;
  source: LaborCostSource;
  littleElm: StoreLaborCost;
  prosper: StoreLaborCost;
  probes: LaborEndpointProbe[];
  message: string;
}

interface DaySummary {
  sales: number;
  grossSales: number;
  tax: number;
  totalWithTax: number;
  discounts: number;
  refunds: number;
  orders: number;
  tips: number;
}

interface CombinedDay {
  businessDate: string;
  totalSales: number;
  netSales: number;
  grossSales: number;
  discounts: number;
  refunds: number;
  littleElmSales: number;
  prosperSales: number;
  littleElmNetSales: number;
  prosperNetSales: number;
  littleElmDiscounts: number;
  prosperDiscounts: number;
  totalOrders: number;
  tips: number;
}

interface DayOutcome {
  businessDate: string;
  ok: boolean;
  data?: CombinedDay;
  error?: string;
}

class ToastFetchError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = 'ToastFetchError';
  }
}

// ---------------------------------------------------------------------------
// America/Chicago business dates (lib/chicago-time.ts @ 274056b)
// ---------------------------------------------------------------------------

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function chicagoToday(): ChicagoDate {
  const cstNow = new Date(new Date().toLocaleString('en-US', { timeZone: CHICAGO_TZ }));
  return {
    year: cstNow.getFullYear(),
    month: cstNow.getMonth() + 1,
    day: cstNow.getDate(),
  };
}

export function toBusinessDate(d: ChicagoDate): string {
  return `${d.year}${pad2(d.month)}${pad2(d.day)}`;
}

export function toIsoDate(d: ChicagoDate): string {
  return `${d.year}-${pad2(d.month)}-${pad2(d.day)}`;
}

export function chicagoMonthToDateBusinessDates(today: ChicagoDate = chicagoToday()): string[] {
  const dates: string[] = [];
  for (let day = 1; day <= today.day; day++) {
    dates.push(toBusinessDate({ year: today.year, month: today.month, day }));
  }
  return dates;
}

export function parseBusinessDate(ymd: string): ChicagoDate {
  return {
    year: Number(ymd.slice(0, 4)),
    month: Number(ymd.slice(4, 6)),
    day: Number(ymd.slice(6, 8)),
  };
}

export function addChicagoDays(d: ChicagoDate, days: number): ChicagoDate {
  const utc = new Date(Date.UTC(d.year, d.month - 1, d.day + days));
  return { year: utc.getUTCFullYear(), month: utc.getUTCMonth() + 1, day: utc.getUTCDate() };
}

function zoneOffsetMs(timeZone: string, date: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const hour = get('hour') === 24 ? 0 : get('hour');
  const asUTC = Date.UTC(get('year'), get('month') - 1, get('day'), hour, get('minute'), get('second'));
  return asUTC - date.getTime();
}

export function chicagoDateTimeISO(d: ChicagoDate, hour = 0, minute = 0, second = 0): string {
  const utcGuess = new Date(Date.UTC(d.year, d.month - 1, d.day, hour, minute, second));
  const offset1 = zoneOffsetMs(CHICAGO_TZ, utcGuess);
  const adjusted = new Date(utcGuess.getTime() - offset1);
  const offset2 = zoneOffsetMs(CHICAGO_TZ, adjusted);
  return new Date(utcGuess.getTime() - offset2).toISOString();
}

export function chicagoBusinessRangeISO(
  startYmd: string,
  endYmd: string
): { startISO: string; endISO: string } {
  return {
    startISO: chicagoDateTimeISO(parseBusinessDate(startYmd), 0, 0, 0),
    endISO: chicagoDateTimeISO(addChicagoDays(parseBusinessDate(endYmd), 1), 0, 0, 0),
  };
}

// ---------------------------------------------------------------------------
// Toast Sales Summary math (lib/toast-sales.ts @ 274056b)
// Gross = Net + Sales discounts + Sales refunds.
// Gift-card / deferred selections and Waste are excluded from Gross/discounts.
// ---------------------------------------------------------------------------

const GIFT_CARD_TYPES = new Set(['TOAST_CARD_SELL', 'TOAST_CARD_RELOAD', 'GIFT_CARD']);

function cents(n: unknown): number {
  if (typeof n !== 'number' || !Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

function dollars(c: number): number {
  return Math.round(c) / 100;
}

function discountCents(applied: unknown): number {
  if (!Array.isArray(applied)) return 0;
  return applied.reduce((sum: number, d: any) => sum + cents(d?.discountAmount), 0);
}

export function isGiftCardSelection(sel: any): boolean {
  const st = sel?.selectionType;
  return typeof st === 'string' && GIFT_CARD_TYPES.has(st);
}

export function isDeferredSelection(sel: any): boolean {
  if (!sel || sel.voided) return false;
  if (sel.deferred === true || sel.deferred === 'true') return true;
  const st = sel?.selectionType;
  return (
    st === 'TOAST_CARD_SELL' ||
    st === 'TOAST_CARD_RELOAD' ||
    st === 'GIFT_CARD' ||
    st === 'HOUSE_ACCOUNT_PAY_BALANCE'
  );
}

export function isWasteDiscount(d: any): boolean {
  const name = String(d?.name ?? d?.displayName ?? '').trim().toLowerCase();
  return name === 'waste';
}

export function wasteDiscountCents(sel: any): number {
  if (!Array.isArray(sel?.appliedDiscounts)) return 0;
  return sel.appliedDiscounts.reduce((sum: number, d: any) => {
    return isWasteDiscount(d) ? sum + cents(d?.discountAmount) : sum;
  }, 0);
}

export function selectionSalesDiscountCents(sel: any): number {
  if (!sel || sel.voided || isDeferredSelection(sel)) return 0;
  const waste = wasteDiscountCents(sel);
  if (typeof sel.preDiscountPrice === 'number' && typeof sel.price === 'number') {
    return Math.max(0, cents(sel.preDiscountPrice) - cents(sel.price) - waste);
  }
  const applied = Array.isArray(sel.appliedDiscounts) ? sel.appliedDiscounts : [];
  return applied.reduce((sum: number, d: any) => {
    if (isWasteDiscount(d) || d?.processingState === 'VOID') return sum;
    return sum + cents(d?.discountAmount);
  }, 0);
}

export function checkDiscountCents(check: any): number {
  if (typeof check?.appliedDiscountAmount === 'number' && check.appliedDiscountAmount > 0) {
    return cents(check.appliedDiscountAmount);
  }
  return discountCents(check?.appliedDiscounts);
}

function refundCents(check: any): { sales: number; tax: number } {
  let sales = 0;
  let tax = 0;

  for (const sel of Array.isArray(check?.selections) ? check.selections : []) {
    const rd = sel?.refundDetails;
    if (!rd) continue;
    sales += cents(rd.refundAmount);
    tax += cents(rd.taxRefundAmount);
  }
  for (const sc of Array.isArray(check?.appliedServiceCharges) ? check.appliedServiceCharges : []) {
    const rd = sc?.refundDetails;
    if (!rd) continue;
    sales += cents(rd.refundAmount);
    tax += cents(rd.taxRefundAmount);
  }
  if (sales === 0 && tax === 0) {
    const payments = Array.isArray(check?.payments) ? check.payments : [];
    for (const p of payments) {
      sales += cents(p?.refund?.refundAmount);
    }
  }
  return { sales, tax };
}

function paymentTipCents(check: any): number {
  const payments = Array.isArray(check?.payments) ? check.payments : [];
  return payments.reduce((sum: number, p: any) => sum + cents(p?.tipAmount), 0);
}

function fundraisingCents(check: any): number {
  const charges = Array.isArray(check?.appliedServiceCharges) ? check.appliedServiceCharges : [];
  return charges.reduce((sum: number, sc: any) => {
    if (sc?.serviceChargeCategory === 'FUNDRAISING_CAMPAIGN') {
      return sum + cents(sc?.chargeAmount);
    }
    return sum;
  }, 0);
}

function serviceChargeCents(check: any): number {
  const charges = Array.isArray(check?.appliedServiceCharges) ? check.appliedServiceCharges : [];
  return charges.reduce((sum: number, sc: any) => sum + cents(sc?.chargeAmount), 0);
}

export function salesDiscountCents(check: any): number {
  const selections = (Array.isArray(check?.selections) ? check.selections : []).filter(
    (sel: any) => !sel?.voided
  );
  if (selections.length === 0) {
    return checkDiscountCents(check);
  }
  return selections.reduce((sum: number, sel: any) => sum + selectionSalesDiscountCents(sel), 0);
}

export function deferredDiscountCents(check: any): number {
  const selections = Array.isArray(check?.selections) ? check.selections : [];
  return selections.reduce((sum: number, sel: any) => {
    if (sel?.voided || !isDeferredSelection(sel)) return sum;
    if (typeof sel.preDiscountPrice === 'number' && typeof sel.price === 'number') {
      return sum + Math.max(0, cents(sel.preDiscountPrice) - cents(sel.price));
    }
    return sum + discountCents(sel?.appliedDiscounts);
  }, 0);
}

export function summariseOrders(orders: any[]): SalesBreakdown {
  let net = 0;
  let salesDiscounts = 0;
  let salesRefunds = 0;
  let tax = 0;
  let totalWithTax = 0;
  let tips = 0;
  let ordersCounted = 0;
  let checkAmount = 0;
  let deferredGiftCards = 0;
  let deferredOther = 0;
  let deferredHouseAccount = 0;
  let deferredDiscounts = 0;
  let waste = 0;
  let fundraising = 0;
  let serviceCharges = 0;

  for (const order of orders) {
    if (order?.deleted || order?.voided || order?.excessFood) continue;

    const checks = Array.isArray(order?.checks) ? order.checks : [];
    let sawCheck = false;

    for (const check of checks) {
      if (check?.voided || check?.deleted) continue;
      sawCheck = true;

      const amount = cents(check?.amount);
      checkAmount += amount;

      let deferred = 0;
      const selections = Array.isArray(check?.selections) ? check.selections : [];
      for (const sel of selections) {
        if (sel?.voided) continue;
        if (!isDeferredSelection(sel)) continue;
        const price =
          typeof sel?.price === 'number' ? cents(sel.price) : cents(sel?.preDiscountPrice);
        deferred += price;
        if (sel.selectionType === 'HOUSE_ACCOUNT_PAY_BALANCE') {
          deferredHouseAccount += price;
        } else if (isGiftCardSelection(sel)) {
          deferredGiftCards += price;
        } else {
          deferredOther += price;
        }
      }

      const refunds = refundCents(check);
      const fund = fundraisingCents(check);
      const discounts = salesDiscountCents(check);
      const deferredDisc = deferredDiscountCents(check);
      for (const sel of selections) {
        if (!sel?.voided) waste += wasteDiscountCents(sel);
      }

      net += amount - deferred - fund - refunds.sales;
      salesDiscounts += discounts;
      salesRefunds += refunds.sales;
      deferredDiscounts += deferredDisc;
      fundraising += fund;
      serviceCharges += serviceChargeCents(check);
      tax += cents(check?.taxAmount) - refunds.tax;
      totalWithTax += cents(check?.totalAmount) || amount + cents(check?.taxAmount);
      tips += paymentTipCents(check);
    }

    if (sawCheck) ordersCounted++;
  }

  return {
    netSales: dollars(net),
    grossSales: dollars(net + salesDiscounts + salesRefunds),
    salesDiscounts: dollars(salesDiscounts),
    salesRefunds: dollars(salesRefunds),
    tax: dollars(tax),
    totalWithTax: dollars(totalWithTax),
    tips: dollars(tips),
    orders: ordersCounted,
    checkAmount: dollars(checkAmount),
    deferredGiftCards: dollars(deferredGiftCards),
    deferredOther: dollars(deferredOther),
    deferredHouseAccount: dollars(deferredHouseAccount),
    deferredDiscounts: dollars(deferredDiscounts),
    waste: dollars(waste),
    fundraisingCharges: dollars(fundraising),
    serviceCharges: dollars(serviceCharges),
  };
}

export function summariseDay(orders: any[]): DaySummary {
  const s = summariseOrders(orders);
  return {
    sales: s.netSales,
    grossSales: s.grossSales,
    tax: s.tax,
    totalWithTax: s.totalWithTax,
    discounts: s.salesDiscounts,
    refunds: s.salesRefunds,
    orders: s.orders,
    tips: s.tips,
  };
}

// ---------------------------------------------------------------------------
// Labor cost (lib/toast-labor.ts @ 274056b)
// ---------------------------------------------------------------------------

const COST_FIELD_CANDIDATES = ['totalCost', 'hourlyJobTotalPay', 'laborCost', 'wagesEarned'] as const;

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

function ymd(value: unknown): string {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value === 'string') return value.replace(/-/g, '');
  return '';
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

export function pickLaborCostAmount(row: Record<string, unknown>): number | null {
  for (const key of COST_FIELD_CANDIDATES) {
    const n = asNumber(row?.[key]);
    if (n !== null) return n;
  }
  return null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

function firstNonEmpty(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return null;
}

export function chicagoDateTimeDisplay(iso: unknown): string | null {
  if (typeof iso !== 'string' || !iso.trim()) return null;
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return null;
  return new Date(ms).toLocaleString('en-US', {
    timeZone: CHICAGO_TZ,
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function toastIsoString(value: unknown): string | null {
  return typeof value === 'string' && value ? value : null;
}

export function missingWageKind(wage: number | null, hours: number | null): MissingWageField {
  if (wage === null && hours === null) return 'both';
  if (wage === null) return 'hourlyWage';
  return 'hours';
}

function punchEmployeeGuid(entry: Record<string, unknown>): string {
  const emp = asRecord(entry.employee);
  const ref = asRecord(entry.employeeReference);
  return (
    firstNonEmpty(
      emp?.guid,
      ref?.guid,
      entry.employeeGuid,
      typeof entry.employee === 'string' ? entry.employee : null,
      emp?.id,
      ref?.id
    ) || ''
  );
}

function punchEmployeeEntityId(entry: Record<string, unknown>): string | null {
  const emp = asRecord(entry.employee);
  const ref = asRecord(entry.employeeReference);
  return firstNonEmpty(ref?.entityId, emp?.entityId, entry.entityId);
}

/** Toast-provided name only. Never "Unknown" and never a guessed wage-adjacent label. */
export function punchInlineEmployeeName(entry: Record<string, unknown>): string | null {
  const emp = asRecord(entry.employee);
  const ref = asRecord(entry.employeeReference);
  const chosen = firstNonEmpty(emp?.chosenName, ref?.chosenName);
  if (chosen) return chosen;
  const first = firstNonEmpty(emp?.firstName, ref?.firstName);
  const last = firstNonEmpty(emp?.lastName, ref?.lastName);
  if (first && last) return `${first} ${last}`;
  if (first) return first;
  return null;
}

function resolveEmployeeIdentity(
  entry: Record<string, unknown>,
  employeeNames?: Map<string, string>
): { employeeName: string | null; employeeGuid: string; nameUnknown: boolean } {
  const guid = punchEmployeeGuid(entry);
  const entityId = punchEmployeeEntityId(entry);
  const mapped = guid && employeeNames ? employeeNames.get(guid) ?? null : null;
  const name = mapped || punchInlineEmployeeName(entry);
  if (name) {
    return { employeeName: name, employeeGuid: guid || entityId || '', nameUnknown: false };
  }
  // No Toast name — return the id Toast gave us and mark name unknown.
  return {
    employeeName: guid || entityId || null,
    employeeGuid: guid || entityId || '',
    nameUnknown: true,
  };
}

function resolveJobIdentity(
  entry: Record<string, unknown>,
  jobNames?: Map<string, string>
): { jobName: string; jobGuid: string } {
  const job = asRecord(entry.job);
  const ref = asRecord(entry.jobReference);
  const jobGuid = firstNonEmpty(job?.guid, ref?.guid, entry.jobGuid, job?.id, ref?.id) || '';
  const inline = firstNonEmpty(job?.title, job?.name, ref?.name, ref?.title);
  const mapped = jobGuid && jobNames ? jobNames.get(jobGuid) ?? null : null;
  return { jobGuid, jobName: mapped || inline || jobGuid };
}

function describeMissingWagePunch(
  entry: Record<string, unknown>,
  hours: number | null,
  wage: number | null,
  opts: SummariseTimeEntriesOptions
): MissingWagePunch {
  const identity = resolveEmployeeIdentity(entry, opts.employeeNames);
  const job = resolveJobIdentity(entry, opts.jobNames);
  const inDate = toastIsoString(entry.inDate);
  const outDate = toastIsoString(entry.outDate);
  return {
    store: opts.store || '',
    employeeName: identity.employeeName,
    employeeGuid: identity.employeeGuid,
    nameUnknown: identity.nameUnknown,
    jobName: job.jobName,
    jobGuid: job.jobGuid,
    inDate,
    outDate,
    inDateChicago: chicagoDateTimeDisplay(inDate),
    outDateChicago: chicagoDateTimeDisplay(outDate),
    hours: hours === null ? null : roundMoney(hours),
    missing: missingWageKind(wage, hours),
  };
}

export function timeEntryHours(entry: Record<string, unknown>, asOfMs = Date.now()): number | null {
  const regular = asNumber(entry.regularHours) ?? 0;
  const overtime = asNumber(entry.overtimeHours) ?? 0;
  if (regular + overtime > 0) return regular + overtime;

  const inMs = typeof entry.inDate === 'string' ? Date.parse(entry.inDate) : NaN;
  if (!Number.isFinite(inMs)) return null;
  const outMs =
    typeof entry.outDate === 'string' && entry.outDate ? Date.parse(entry.outDate) : asOfMs;
  if (!Number.isFinite(outMs) || outMs < inMs) return null;

  let unpaidMs = 0;
  const breaks = Array.isArray(entry.breaks) ? entry.breaks : [];
  for (const brk of breaks) {
    if (!brk || brk.paid !== false) continue;
    const bIn = typeof brk.inDate === 'string' ? Date.parse(brk.inDate) : NaN;
    const bOut = typeof brk.outDate === 'string' && brk.outDate ? Date.parse(brk.outDate) : asOfMs;
    if (Number.isFinite(bIn) && Number.isFinite(bOut) && bOut > bIn) unpaidMs += bOut - bIn;
  }

  return Math.max(0, (outMs - inMs - unpaidMs) / 3_600_000);
}

export function summariseTimeEntries(
  entries: unknown[],
  asOfMs = Date.now(),
  opts: SummariseTimeEntriesOptions = {}
): TimeEntryLabor {
  let dollars = 0;
  let punches = 0;
  let punchesWithWage = 0;
  let punchesMissingWage = 0;
  let punchesExcluded = 0;
  let hours = 0;
  let usedCostField = false;
  let usedHoursTimesWage = false;
  const missingWagePunches: MissingWagePunch[] = [];

  for (const raw of entries) {
    if (!raw || typeof raw !== 'object') continue;
    const entry = raw as Record<string, unknown>;
    if (entry.deleted === true) continue;
    punches++;

    const listedCost = pickLaborCostAmount(entry);
    if (listedCost !== null) {
      dollars += listedCost;
      punchesWithWage++;
      usedCostField = true;
      continue;
    }

    const wage = asNumber(entry.hourlyWage);
    // Null/missing hourlyWage = not an hourly job (Owner, Manager, …).
    // Exclude from labor dollars. Never invent a rate. Do not mark Incomplete.
    if (wage === null) {
      punchesExcluded++;
      continue;
    }

    const punchHours = timeEntryHours(entry, asOfMs);
    if (punchHours === null) {
      punchesMissingWage++;
      missingWagePunches.push(describeMissingWagePunch(entry, punchHours, wage, opts));
      continue;
    }

    hours += punchHours;
    punchesWithWage++;
    dollars += wage * punchHours;
    usedHoursTimesWage = true;
  }

  if (punchesMissingWage > 0) {
    return {
      status: 'incomplete',
      dollars: null,
      punches,
      punchesWithWage,
      punchesMissingWage,
      punchesExcluded,
      hours: roundMoney(hours),
      usedCostField,
      usedHoursTimesWage,
      missingWagePunches,
    };
  }

  return {
    status: 'ok',
    dollars: roundMoney(dollars),
    punches,
    punchesWithWage,
    punchesMissingWage,
    punchesExcluded,
    hours: roundMoney(hours),
    usedCostField,
    usedHoursTimesWage,
    missingWagePunches,
  };
}

function toastErrorBits(
  data: unknown,
  text: string
): Pick<LaborEndpointProbe, 'code' | 'message' | 'requestId'> {
  if (data && typeof data === 'object') {
    const o = data as Record<string, unknown>;
    return {
      code: typeof o.code === 'number' || typeof o.code === 'string' ? o.code : undefined,
      message: typeof o.message === 'string' ? o.message : undefined,
      requestId: typeof o.requestId === 'string' ? o.requestId : undefined,
    };
  }
  return { message: text.slice(0, 240) || undefined };
}

async function toastCall(opts: {
  token: string;
  method: 'GET' | 'POST';
  path: string;
  restaurantGuid?: string;
  body?: unknown;
}): Promise<{ status: number; data: unknown; text: string }> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${opts.token}`,
    'Content-Type': 'application/json',
  };
  if (opts.restaurantGuid) {
    headers['Toast-Restaurant-External-ID'] = opts.restaurantGuid;
  }

  const response = await fetch(`${TOAST_API}${opts.path}`, {
    method: opts.method,
    headers,
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
  });
  const text = await response.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }
  return { status: response.status, data, text };
}

function normalizeGuid(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) {
    return value.replace(/^"+|"+$/g, '').trim();
  }
  return null;
}

interface LaborCostRow {
  restaurantGuid: string;
  businessDate: string;
  totalCost: number;
}

function rowsFromAnalytics(data: unknown): LaborCostRow[] {
  const list = Array.isArray(data) ? data : [];
  const rows: LaborCostRow[] = [];
  for (const item of list) {
    if (!item || typeof item !== 'object') continue;
    const rec = item as Record<string, unknown>;
    const restaurantGuid = typeof rec.restaurantGuid === 'string' ? rec.restaurantGuid : '';
    const businessDate = ymd(rec.businessDate);
    const totalCost = pickLaborCostAmount(rec);
    if (!restaurantGuid || !businessDate || totalCost === null) continue;
    rows.push({ restaurantGuid, businessDate, totalCost });
  }
  return rows;
}

function sumLaborCostRows(
  rows: LaborCostRow[],
  restaurantGuid: string
): { dollars: number; days: number } {
  const mine = rows.filter((r) => r.restaurantGuid === restaurantGuid);
  const byDay = new Map<string, number>();
  for (const row of mine) {
    const prev = byDay.get(row.businessDate) ?? 0;
    byDay.set(row.businessDate, prev + row.totalCost);
  }
  let dollars = 0;
  for (const amount of byDay.values()) dollars += amount;
  return { dollars: roundMoney(dollars), days: byDay.size };
}

async function retrieveLaborReport(
  token: string,
  reportGuid: string,
  restaurantGuid: string | undefined,
  probes: LaborEndpointProbe[]
): Promise<unknown | null> {
  const path = `/era/v1/labor/${reportGuid}`;
  for (let attempt = 0; attempt < 6; attempt++) {
    const got = await toastCall({ token, method: 'GET', path, restaurantGuid });
    probes.push({
      method: 'GET',
      path,
      status: got.status,
      ...toastErrorBits(got.data, got.text),
    });
    if (got.status === 200 && Array.isArray(got.data)) return got.data;
    if (got.status === 403 || got.status === 401) return null;
    if (got.status !== 202 && got.status !== 404 && got.status !== 409) return null;
    await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
  }
  return null;
}

function okStore(
  dollars: number,
  days: number,
  source: NonNullable<LaborCostSource>,
  extra: Partial<StoreLaborCost> = {}
): StoreLaborCost {
  return {
    status: 'ok',
    mtdLaborDollars: dollars,
    days,
    missingWagePunches: extra.missingWagePunches ?? [],
    source,
    message: `Toast ${source}`,
    ...extra,
  };
}

function rollupStatus(a: LaborCostStatus, b: LaborCostStatus): LaborCostStatus {
  if (a === 'ok' && b === 'ok') return 'ok';
  if (a === 'blocked' && b === 'blocked') return 'blocked';
  if (a === 'unavailable' && b === 'unavailable') return 'unavailable';
  if (a === 'incomplete' || b === 'incomplete') return 'incomplete';
  if (a === 'ok' || b === 'ok') return 'ok';
  return 'unavailable';
}

async function fetchEraLabor(opts: {
  accessToken: string;
  startBusinessDate: string;
  endBusinessDate: string;
  littleElmGuid: string;
  prosperGuid: string;
  probes: LaborEndpointProbe[];
}): Promise<LaborCostResult | null> {
  const timeRange = opts.startBusinessDate === opts.endBusinessDate ? 'day' : 'month';
  const body = {
    startBusinessDate: opts.startBusinessDate,
    endBusinessDate: opts.endBusinessDate,
    restaurantIds: [opts.littleElmGuid, opts.prosperGuid].filter(Boolean),
    excludedRestaurantIds: [] as string[],
  };

  const headers: Array<string | undefined> = [opts.littleElmGuid, undefined];

  for (const headerGuid of headers) {
    const path = `/era/v1/labor/${timeRange}`;
    const posted = await toastCall({
      token: opts.accessToken,
      method: 'POST',
      path,
      restaurantGuid: headerGuid,
      body,
    });
    opts.probes.push({
      method: 'POST',
      path,
      status: posted.status,
      ...toastErrorBits(posted.data, posted.text),
    });

    if (posted.status === 403 || posted.status === 401 || posted.status >= 400) {
      continue;
    }

    const reportGuid =
      normalizeGuid(posted.data) ||
      (posted.data && typeof posted.data === 'object'
        ? normalizeGuid((posted.data as Record<string, unknown>).reportRequestGuid)
        : null);
    if (!reportGuid) continue;

    const rowsRaw = await retrieveLaborReport(opts.accessToken, reportGuid, headerGuid, opts.probes);
    const rows = rowsFromAnalytics(rowsRaw);
    if (rows.length === 0) continue;

    const le = sumLaborCostRows(rows, opts.littleElmGuid);
    const pr = sumLaborCostRows(rows, opts.prosperGuid);
    return {
      status: 'ok',
      source: 'era.labor.totalCost',
      littleElm: okStore(le.dollars, le.days, 'era.labor.totalCost'),
      prosper: okStore(pr.dollars, pr.days, 'era.labor.totalCost'),
      probes: opts.probes,
      message: 'Toast Analytics labor reporting (sum of totalCost)',
    };
  }

  return null;
}

async function fetchTimeEntriesForStore(
  accessToken: string,
  restaurantGuid: string,
  startISO: string,
  endISO: string,
  probes: LaborEndpointProbe[]
): Promise<{ status: number; entries: unknown[] | null }> {
  const path =
    `/labor/v1/timeEntries?startDate=${encodeURIComponent(startISO)}` +
    `&endDate=${encodeURIComponent(endISO)}`;
  const got = await toastCall({
    token: accessToken,
    method: 'GET',
    path,
    restaurantGuid,
  });
  probes.push({
    method: 'GET',
    path: '/labor/v1/timeEntries',
    status: got.status,
    ...toastErrorBits(got.data, got.text),
  });
  if (got.status === 200 && Array.isArray(got.data)) {
    return { status: 200, entries: got.data };
  }
  return { status: got.status, entries: null };
}

function employeeNameFromToast(emp: Record<string, unknown>): string | null {
  const chosen = firstNonEmpty(emp.chosenName);
  if (chosen) return chosen;
  const first = firstNonEmpty(emp.firstName);
  const last = firstNonEmpty(emp.lastName);
  if (first && last) return `${first} ${last}`;
  if (first) return first;
  return null;
}

function jobNameFromToast(job: Record<string, unknown>): string | null {
  return firstNonEmpty(job.title, job.name);
}

async function fetchEmployeeNameMap(
  accessToken: string,
  restaurantGuid: string,
  probes: LaborEndpointProbe[]
): Promise<Map<string, string>> {
  const path = '/labor/v1/employees';
  const got = await toastCall({
    token: accessToken,
    method: 'GET',
    path,
    restaurantGuid,
  });
  probes.push({
    method: 'GET',
    path,
    status: got.status,
    ...toastErrorBits(got.data, got.text),
  });

  const map = new Map<string, string>();
  if (got.status !== 200) return map;

  const data = got.data;
  const employees = Array.isArray(data)
    ? data
    : asRecord(data)?.employees;
  if (!Array.isArray(employees)) return map;

  for (const raw of employees) {
    const emp = asRecord(raw);
    if (!emp) continue;
    const guid = firstNonEmpty(emp.guid, emp.id);
    const name = employeeNameFromToast(emp);
    if (guid && name) map.set(guid, name);
  }
  return map;
}

async function fetchJobNameMap(
  accessToken: string,
  restaurantGuid: string,
  probes: LaborEndpointProbe[]
): Promise<Map<string, string>> {
  const path = '/labor/v1/jobs';
  const got = await toastCall({
    token: accessToken,
    method: 'GET',
    path,
    restaurantGuid,
  });
  probes.push({
    method: 'GET',
    path,
    status: got.status,
    ...toastErrorBits(got.data, got.text),
  });

  const map = new Map<string, string>();
  if (got.status !== 200) return map;

  const data = got.data;
  const jobs = Array.isArray(data) ? data : asRecord(data)?.jobs;
  if (!Array.isArray(jobs)) return map;

  for (const raw of jobs) {
    const job = asRecord(raw);
    if (!job) continue;
    const guid = firstNonEmpty(job.guid, job.id);
    const name = jobNameFromToast(job);
    if (guid && name) map.set(guid, name);
  }
  return map;
}

async function summariseStoreTimeEntries(opts: {
  store: string;
  entries: unknown[];
  accessToken: string;
  restaurantGuid: string;
  probes: LaborEndpointProbe[];
}): Promise<TimeEntryLabor> {
  const first = summariseTimeEntries(opts.entries, Date.now(), { store: opts.store });
  if (first.status !== 'incomplete') return first;

  const [employeeNames, jobNames] = await Promise.all([
    fetchEmployeeNameMap(opts.accessToken, opts.restaurantGuid, opts.probes),
    fetchJobNameMap(opts.accessToken, opts.restaurantGuid, opts.probes),
  ]);
  return summariseTimeEntries(opts.entries, Date.now(), {
    store: opts.store,
    employeeNames,
    jobNames,
  });
}

function storeFromTimeEntries(name: string, summary: TimeEntryLabor, days: number): StoreLaborCost {
  if (summary.status === 'incomplete') {
    return {
      status: 'incomplete',
      mtdLaborDollars: null,
      days,
      punches: summary.punches,
      punchesMissingWage: summary.punchesMissingWage,
      punchesExcluded: summary.punchesExcluded,
      missingWagePunches: summary.missingWagePunches,
      source: 'timeEntries.hourlyWage',
      message:
        `Incomplete — ${summary.punchesMissingWage} of ${summary.punches} ${name} ` +
        `hourly time entries are missing hours. Not shown as $0 labor.`,
    };
  }
  const excludedNote =
    summary.punchesExcluded > 0
      ? `; ${summary.punchesExcluded} non-hourly punch${summary.punchesExcluded === 1 ? '' : 'es'} excluded`
      : '';
  return okStore(summary.dollars ?? 0, days, 'timeEntries.hourlyWage', {
    punches: summary.punches,
    punchesMissingWage: 0,
    punchesExcluded: summary.punchesExcluded,
    missingWagePunches: [],
    message:
      `Analytics labor 403; fallback /labor/v1/timeEntries ` +
      `(${summary.punchesWithWage} hourly punches, hours × hourlyWage; OT at base rate${excludedNote})`,
  });
}

async function fetchTimeEntryFallback(opts: {
  accessToken: string;
  startBusinessDate: string;
  endBusinessDate: string;
  littleElmGuid: string;
  prosperGuid: string;
  probes: LaborEndpointProbe[];
}): Promise<LaborCostResult> {
  const { startISO, endISO } = chicagoBusinessRangeISO(opts.startBusinessDate, opts.endBusinessDate);
  const days = (Date.parse(endISO) - Date.parse(startISO)) / 86_400_000;

  const [leRaw, prRaw] = await Promise.all([
    fetchTimeEntriesForStore(opts.accessToken, opts.littleElmGuid, startISO, endISO, opts.probes),
    fetchTimeEntriesForStore(opts.accessToken, opts.prosperGuid, startISO, endISO, opts.probes),
  ]);

  const blocked = (store: string, status: number): StoreLaborCost => ({
    status: status === 403 || status === 401 ? 'blocked' : 'unavailable',
    mtdLaborDollars: null,
    days: 0,
    missingWagePunches: [],
    source: null,
    message: `${store} /labor/v1/timeEntries failed (HTTP ${status})`,
  });

  const [littleElmSummary, prosperSummary] = await Promise.all([
    leRaw.entries
      ? summariseStoreTimeEntries({
          store: 'Little Elm',
          entries: leRaw.entries,
          accessToken: opts.accessToken,
          restaurantGuid: opts.littleElmGuid,
          probes: opts.probes,
        })
      : null,
    prRaw.entries
      ? summariseStoreTimeEntries({
          store: 'Prosper / Celina',
          entries: prRaw.entries,
          accessToken: opts.accessToken,
          restaurantGuid: opts.prosperGuid,
          probes: opts.probes,
        })
      : null,
  ]);

  const littleElm = littleElmSummary
    ? storeFromTimeEntries('Little Elm', littleElmSummary, Math.round(days))
    : blocked('Little Elm', leRaw.status);
  const prosper = prosperSummary
    ? storeFromTimeEntries('Prosper / Celina', prosperSummary, Math.round(days))
    : blocked('Prosper / Celina', prRaw.status);

  const status = rollupStatus(littleElm.status, prosper.status);
  const bothFailed =
    littleElm.mtdLaborDollars === null &&
    prosper.mtdLaborDollars === null &&
    littleElm.status !== 'incomplete' &&
    prosper.status !== 'incomplete';

  if (bothFailed && (littleElm.status === 'blocked' || prosper.status === 'blocked')) {
    return {
      status: 'blocked',
      source: null,
      littleElm,
      prosper,
      probes: opts.probes,
      message:
        'Analytics labor reporting is 403 and /labor/v1/timeEntries also failed. Stopped — no invented labor dollars.',
    };
  }

  return {
    status,
    source: 'timeEntries.hourlyWage',
    littleElm,
    prosper,
    probes: opts.probes,
    message:
      status === 'incomplete'
        ? 'Analytics labor 403. Time-entry fallback is incomplete — hourly punches missing hours, not shown as $0.'
        : 'Analytics labor 403. Using /labor/v1/timeEntries hours × hourlyWage. Null wage = not hourly, excluded.',
  };
}

export async function fetchToastLaborCost(opts: {
  accessToken: string;
  startBusinessDate: string;
  endBusinessDate: string;
  littleElmGuid: string;
  prosperGuid: string;
}): Promise<LaborCostResult> {
  const probes: LaborEndpointProbe[] = [];

  const era = await fetchEraLabor({ ...opts, probes });
  if (era) return era;

  const eraProbe = probes.find(
    (p) => p.path.startsWith('/era/v1/labor') && (p.status === 403 || p.status === 401)
  );
  const eraNote = eraProbe
    ? `POST /era/v1/labor → HTTP ${eraProbe.status}` +
      `${eraProbe.code != null ? ` code ${eraProbe.code}` : ''}` +
      `${eraProbe.message ? ` (${eraProbe.message})` : ''}`
    : 'POST /era/v1/labor did not return totalCost';

  const fallback = await fetchTimeEntryFallback({ ...opts, probes });
  if (fallback.status === 'blocked' || fallback.status === 'unavailable') {
    return {
      ...fallback,
      message: `${eraNote}. Time-entry fallback also failed. Stopped — no invented labor dollars. ${fallback.message}`,
    };
  }

  return {
    ...fallback,
    message: `${eraNote}. ${fallback.message}`,
  };
}

// ---------------------------------------------------------------------------
// Rate-limited Orders fetch (lib/toast-client.ts @ 274056b)
// Failed days are missing — never silent $0.
// ---------------------------------------------------------------------------

let inFlight = 0;
let lastDispatch = 0;
const waiters: Array<() => void> = [];
let currentGapMs = MIN_REQUEST_GAP_MS;

function acquireSlot(): Promise<void> {
  if (inFlight < MAX_CONCURRENT) {
    inFlight++;
    return Promise.resolve();
  }
  return new Promise<void>((resolve) => waiters.push(resolve));
}

function releaseSlot(): void {
  const next = waiters.shift();
  if (next) {
    next();
  } else {
    inFlight--;
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function recordThrottled(): void {
  currentGapMs = Math.min(Math.round(currentGapMs * 1.6), MAX_REQUEST_GAP_MS);
  console.warn(`[Manager Budget] Toast throttling — slowing to ${currentGapMs}ms`);
}

function recordSuccess(): void {
  if (currentGapMs > MIN_REQUEST_GAP_MS) {
    currentGapMs = Math.max(MIN_REQUEST_GAP_MS, Math.round(currentGapMs * 0.97));
  }
}

async function throttle(): Promise<void> {
  const now = Date.now();
  const wait = Math.max(0, lastDispatch + currentGapMs - now);
  lastDispatch = now + wait;
  if (wait > 0) await sleep(wait);
}

function backoffMs(attempt: number, retryAfterHeader: string | null): number {
  if (retryAfterHeader) {
    const seconds = Number(retryAfterHeader);
    if (Number.isFinite(seconds) && seconds > 0) return Math.min(seconds * 1000, 15_000);
  }
  const exponential = BASE_BACKOFF_MS * 2 ** attempt;
  const jitter = Math.floor(exponential * 0.25 * Math.random());
  return Math.min(exponential + jitter, 15_000);
}

async function toastFetch(url: string, accessToken: string, restaurantGuid: string): Promise<any> {
  let lastStatus: number | undefined;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    await acquireSlot();
    let response: Response;
    try {
      await throttle();
      response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Toast-Restaurant-External-ID': restaurantGuid,
          'Content-Type': 'application/json',
        },
      });
    } catch (networkError) {
      releaseSlot();
      if (attempt === MAX_ATTEMPTS - 1) {
        throw new ToastFetchError(
          `Network failure calling Toast: ${networkError instanceof Error ? networkError.message : 'unknown'}`
        );
      }
      await sleep(backoffMs(attempt, null));
      continue;
    }

    const retryAfter = response.headers.get('Retry-After');
    releaseSlot();

    if (response.ok) {
      recordSuccess();
      return response.json();
    }

    lastStatus = response.status;
    const retryable = response.status === 429 || response.status >= 500;
    if (response.status === 429) recordThrottled();
    if (!retryable || attempt === MAX_ATTEMPTS - 1) break;

    await sleep(backoffMs(attempt, retryAfter));
  }

  throw new ToastFetchError(
    lastStatus === 429
      ? `Toast rate limit (429) persisted after ${MAX_ATTEMPTS} attempts`
      : `Toast request failed with status ${lastStatus}`,
    lastStatus
  );
}

const dayCache = new Map<string, { value: DaySummary; cachedAt: number }>();

function todayBusinessDate(): string {
  return toBusinessDate(chicagoToday());
}

function cacheTtlMs(businessDate: string): number {
  return businessDate === todayBusinessDate() ? 3 * 60 * 1000 : 12 * 60 * 60 * 1000;
}

export async function fetchOrdersForDay(
  accessToken: string,
  restaurantGuid: string,
  businessDate: string
): Promise<any[]> {
  const collected: any[] = [];

  for (let page = 1; page <= MAX_PAGES; page++) {
    const url = `${TOAST_API}/orders/v2/ordersBulk?businessDate=${businessDate}&pageSize=${PAGE_SIZE}&page=${page}`;
    const orders = await toastFetch(url, accessToken, restaurantGuid);

    if (!Array.isArray(orders) || orders.length === 0) break;
    collected.push(...orders);
    if (orders.length < PAGE_SIZE) break;
  }

  return collected;
}

export async function getDaySummary(
  accessToken: string,
  restaurantGuid: string,
  businessDate: string
): Promise<DaySummary> {
  const key = `${restaurantGuid}:${businessDate}`;
  const hit = dayCache.get(key);
  if (hit && Date.now() - hit.cachedAt < cacheTtlMs(businessDate)) {
    return hit.value;
  }

  const orders = await fetchOrdersForDay(accessToken, restaurantGuid, businessDate);
  const value = summariseDay(orders);
  dayCache.set(key, { value, cachedAt: Date.now() });
  return value;
}

export async function fetchDays(
  accessToken: string,
  businessDates: string[],
  deadline?: number
): Promise<DayOutcome[]> {
  const restaurants = [
    { guid: LITTLE_ELM_GUID, name: 'Little Elm' as const },
    { guid: PROSPER_GUID, name: 'Prosper' as const },
  ];
  const outcomes: DayOutcome[] = [];

  for (const businessDate of businessDates) {
    if (deadline && Date.now() > deadline) {
      outcomes.push({ businessDate, ok: false, error: 'Skipped — time budget exhausted' });
      continue;
    }

    try {
      const [littleElm, prosper] = await Promise.all(
        restaurants.map((r) => getDaySummary(accessToken, r.guid, businessDate))
      );

      outcomes.push({
        businessDate,
        ok: true,
        data: {
          businessDate,
          totalSales: littleElm.grossSales + prosper.grossSales,
          netSales: littleElm.sales + prosper.sales,
          grossSales: littleElm.grossSales + prosper.grossSales,
          discounts: littleElm.discounts + prosper.discounts,
          refunds: littleElm.refunds + prosper.refunds,
          littleElmSales: littleElm.grossSales,
          prosperSales: prosper.grossSales,
          littleElmNetSales: littleElm.sales,
          prosperNetSales: prosper.sales,
          littleElmDiscounts: littleElm.discounts,
          prosperDiscounts: prosper.discounts,
          totalOrders: littleElm.orders + prosper.orders,
          tips: littleElm.tips + prosper.tips,
        },
      });
    } catch (error) {
      outcomes.push({
        businessDate,
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return outcomes;
}

// ---------------------------------------------------------------------------
// Budget rollup (lib/manager-budget.ts @ 274056b)
// ---------------------------------------------------------------------------

export function laborPercent(laborDollars: number | null, salesDollars: number | null): number | null {
  if (laborDollars === null || salesDollars === null) return null;
  if (!(salesDollars > 0)) return null;
  return Math.round((laborDollars / salesDollars) * 10000) / 100;
}

export function laborVsTarget(
  percent: number | null,
  target = DEFAULT_LABOR_TARGET_PERCENT
): LaborVsTarget {
  if (percent === null) return 'unavailable';
  return percent < target ? 'under' : 'over';
}

export async function getManagerBudget(
  accessToken: string,
  deadline?: number
): Promise<ManagerBudget> {
  const today = chicagoToday();
  const businessDates = chicagoMonthToDateBusinessDates(today);
  const todayBd = toBusinessDate(today);
  const startBd = businessDates[0];
  const startIso = toIsoDate({ year: today.year, month: today.month, day: 1 });
  const endIso = toIsoDate(today);

  const [salesOutcomes, labor] = await Promise.all([
    fetchDays(accessToken, businessDates, deadline),
    fetchToastLaborCost({
      accessToken,
      startBusinessDate: startBd,
      endBusinessDate: todayBd,
      littleElmGuid: LITTLE_ELM_GUID,
      prosperGuid: PROSPER_GUID,
    }),
  ]);

  const succeeded = salesOutcomes.filter((o) => o.ok && o.data);
  const missing = salesOutcomes.filter((o) => !o.ok);
  const salesComplete = missing.length === 0;

  const sum = (pick: (d: CombinedDay) => number) =>
    roundMoney(succeeded.reduce((acc, o) => acc + pick(o.data!), 0));

  const todayRow = succeeded.find((o) => o.businessDate === todayBd)?.data;

  const leMtd = succeeded.length ? sum((d) => d.littleElmSales) : null;
  const prMtd = succeeded.length ? sum((d) => d.prosperSales) : null;
  const leNet = succeeded.length ? sum((d) => d.littleElmNetSales) : null;
  const prNet = succeeded.length ? sum((d) => d.prosperNetSales) : null;
  const leDisc = succeeded.length ? sum((d) => d.littleElmDiscounts) : null;
  const prDisc = succeeded.length ? sum((d) => d.prosperDiscounts) : null;

  const leToday = todayRow ? roundMoney(todayRow.littleElmSales) : null;
  const prToday = todayRow ? roundMoney(todayRow.prosperSales) : null;

  const lePct = laborPercent(labor.littleElm.mtdLaborDollars, leMtd);
  const prPct = laborPercent(labor.prosper.mtdLaborDollars, prMtd);

  return {
    timezone: 'America/Chicago',
    businessDate: todayBd,
    period: {
      startDate: startIso,
      endDate: endIso,
      daysRequested: salesOutcomes.length,
      daysSucceeded: succeeded.length,
    },
    salesBasis: 'gross',
    salesComplete,
    salesNote: salesComplete
      ? undefined
      : `${missing.length} of ${salesOutcomes.length} sales days could not be read from Toast. Sales cover only the days that loaded.`,
    laborTargetPercent: DEFAULT_LABOR_TARGET_PERCENT,
    littleElm: {
      name: 'Little Elm',
      todaySales: leToday,
      mtdSales: leMtd,
      mtdNetSales: leNet,
      mtdDiscounts: leDisc,
      mtdLaborDollars: labor.littleElm.mtdLaborDollars,
      mtdLaborPercent: lePct,
      laborStatus: labor.littleElm.status,
      laborVsTarget: laborVsTarget(lePct),
      laborMessage: labor.littleElm.message,
      missingWagePunches: labor.littleElm.missingWagePunches,
      punchesExcluded: labor.littleElm.punchesExcluded,
    },
    prosper: {
      name: 'Prosper / Celina',
      todaySales: prToday,
      mtdSales: prMtd,
      mtdNetSales: prNet,
      mtdDiscounts: prDisc,
      mtdLaborDollars: labor.prosper.mtdLaborDollars,
      mtdLaborPercent: prPct,
      laborStatus: labor.prosper.status,
      laborVsTarget: laborVsTarget(prPct),
      laborMessage: labor.prosper.message,
      missingWagePunches: labor.prosper.missingWagePunches,
      punchesExcluded: labor.prosper.punchesExcluded,
    },
    labor: {
      status: labor.status,
      source: labor.source,
      message: labor.message,
      probes: labor.probes,
      missingWagePunches: [
        ...labor.littleElm.missingWagePunches,
        ...labor.prosper.missingWagePunches,
      ],
    },
  };
}

// ---------------------------------------------------------------------------
// Auth + HTTP handler
// ---------------------------------------------------------------------------

let cachedToken: { token: string; expires: number } | null = null;

async function getAuthToken(): Promise<string> {
  if (cachedToken && cachedToken.expires > Date.now()) {
    return cachedToken.token;
  }

  const clientId = process.env.VITE_TOAST_CLIENT_ID || process.env.TOAST_CLIENT_ID;
  const clientSecret = process.env.VITE_TOAST_API_KEY || process.env.TOAST_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Toast credentials not configured');
  }

  const response = await fetch(`${TOAST_API}/authentication/v1/authentication/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientId, clientSecret, userAccessType: 'TOAST_MACHINE_CLIENT' }),
  });

  if (!response.ok) {
    throw new Error(`Toast auth failed (${response.status})`);
  }

  const data = await response.json();
  const token = data.token?.accessToken || data.accessToken;
  if (!token) throw new Error('Invalid auth response');

  cachedToken = {
    token,
    expires: Date.now() + 23 * 60 * 60 * 1000,
  };
  return token;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const accessToken = await getAuthToken();
    const budget = await getManagerBudget(accessToken, Date.now() + TIME_BUDGET_MS);
    res.setHeader('Cache-Control', 's-maxage=60');
    return res.status(200).json({ success: true, budget });
  } catch (error: any) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Manager Budget] Failed:', message);
    return res.status(500).json({
      error: 'Failed to load manager budget tile',
      details: message,
    });
  }
}
