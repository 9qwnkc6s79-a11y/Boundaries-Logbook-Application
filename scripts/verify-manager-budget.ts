/**
 * Smoke: ported Sales Summary + labor fallback identities from dashboard @ 274056b.
 * Run: npx --yes tsx scripts/verify-manager-budget.ts
 */
import {
  DEFAULT_LABOR_TARGET_PERCENT,
  chicagoDateTimeDisplay,
  chicagoMonthToDateBusinessDates,
  laborPercent,
  laborVsTarget,
  missingWageKind,
  summariseOrders,
  summariseTimeEntries,
} from '../api/manager-budget.ts';

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

function almost(a: number, b: number, eps = 0.001) {
  return Math.abs(a - b) < eps;
}

// --- Sales Summary identity (dashboard lib/toast-sales.ts) -----------------
// Gross = Net + sales discounts + sales refunds.
// Gift-card / deferred selections are dropped from the sales base.
// Waste write-offs are not sales discounts.
const fixtureOrders = [
  {
    checks: [
      {
        amount: 50.00,
        taxAmount: 4.00,
        totalAmount: 54.00,
        selections: [
          { price: 12.00, preDiscountPrice: 14.00, deferred: false },
          { price: 10.00, preDiscountPrice: 10.00, deferred: false },
          { price: 25.00, preDiscountPrice: 25.00, selectionType: 'TOAST_CARD_SELL', deferred: true },
          {
            price: 3.00,
            preDiscountPrice: 8.00,
            deferred: false,
            appliedDiscounts: [{ name: 'Waste', discountAmount: 5.00 }],
            refundDetails: { refundAmount: 3.41, taxRefundAmount: 0.28 },
          },
        ],
        payments: [{ tipAmount: 2.00 }],
      },
    ],
  },
];

const sales = summariseOrders(fixtureOrders);
assert(almost(sales.deferredGiftCards, 25), `gift cards excluded: got ${sales.deferredGiftCards}`);
assert(almost(sales.waste, 5), `waste tracked separately: got ${sales.waste}`);
assert(
  almost(sales.grossSales, sales.netSales + sales.salesDiscounts + sales.salesRefunds),
  `Gross identity failed: ${sales.grossSales} != ${sales.netSales} + ${sales.salesDiscounts} + ${sales.salesRefunds}`
);
// Net = check.amount − deferred − refunds = 50 − 25 − 3.41 = 21.59
assert(almost(sales.netSales, 21.59), `netSales expected 21.59, got ${sales.netSales}`);
// Sales discount on first item only (14−12). Waste item: preDiscount−price−waste = 8−3−5 = 0
assert(almost(sales.salesDiscounts, 2), `salesDiscounts expected 2, got ${sales.salesDiscounts}`);
assert(almost(sales.salesRefunds, 3.41), `salesRefunds expected 3.41, got ${sales.salesRefunds}`);
assert(almost(sales.grossSales, 27), `gross expected 27, got ${sales.grossSales}`);

// --- Labor: hours × wage; null wage = not hourly, excluded (not Incomplete) ---
const complete = summariseTimeEntries([
  { regularHours: 8, overtimeHours: 1, hourlyWage: 15 },
  { regularHours: 4, overtimeHours: 0, hourlyWage: 12 },
]);
assert(complete.status === 'ok', 'complete punches should be ok');
assert(complete.dollars === 183, `8*15 + 1*15 + 4*12 = 183, got ${complete.dollars}`);
assert(complete.missingWagePunches.length === 0, 'complete labor lists no missing punches');
assert(complete.punchesExcluded === 0, 'complete labor excludes nothing');

const excludedNullWage = summariseTimeEntries(
  [
    { regularHours: 8, overtimeHours: 0, hourlyWage: 15 },
    {
      regularHours: 6,
      overtimeHours: 0,
      hourlyWage: null,
      inDate: '2026-08-21T14:00:00.000+0000',
      outDate: '2026-08-21T20:00:00.000+0000',
      employeeReference: { guid: 'emp-owner', firstName: 'Avery', lastName: 'Nguyen' },
      jobReference: { guid: 'job-owner', name: 'Owner' },
    },
  ],
  Date.parse('2026-08-21T21:00:00.000Z'),
  { store: 'Prosper / Celina' }
);
assert(excludedNullWage.status === 'ok', 'null hourlyWage is excluded, not Incomplete');
assert(excludedNullWage.dollars === 120, `remaining hourly punch 8*15 = 120, got ${excludedNullWage.dollars}`);
assert(excludedNullWage.punchesExcluded === 1, 'Owner punch counted as excluded');
assert(excludedNullWage.punchesMissingWage === 0, 'null wage is not a missing-hours problem');
assert(excludedNullWage.missingWagePunches.length === 0, 'do not list excluded punches as Incomplete');
assert(!('hourlyWage' in excludedNullWage) && !('wage' in excludedNullWage), 'do not invent a wage');

assert(missingWageKind(null, 6) === 'hourlyWage', 'wage-only gap helper');
assert(missingWageKind(15, null) === 'hours', 'hours-only gap');
assert(missingWageKind(null, null) === 'both', 'both gap');

const hoursMissing = summariseTimeEntries(
  [
    {
      hourlyWage: 14,
      employeeReference: { guid: 'emp-open', entityId: '44821' },
      jobReference: { guid: 'job-shift-lead' },
    },
  ],
  Date.parse('2026-08-21T21:00:00.000Z'),
  {
    store: 'Little Elm',
    jobNames: new Map([['job-shift-lead', 'Shift Lead']]),
  }
);
assert(hoursMissing.status === 'incomplete' && hoursMissing.dollars === null, 'hourly punch with null hours is Incomplete');
assert(hoursMissing.missingWagePunches[0].missing === 'hours', 'hours-only missing');
assert(hoursMissing.missingWagePunches[0].hours === null, 'hours stay null');
assert(hoursMissing.missingWagePunches[0].nameUnknown === true, 'no Toast name');
assert(
  hoursMissing.missingWagePunches[0].employeeName === 'emp-open',
  'use guid when name is unknown, do not invent one'
);
assert(hoursMissing.missingWagePunches[0].jobName === 'Shift Lead', 'job lookup from /labor/v1/jobs map');
assert(!('hourlyWage' in hoursMissing.missingWagePunches[0]), 'do not include a wage amount');

const bothMissing = summariseTimeEntries(
  [{ employeeReference: { guid: 'emp-both' } }],
  Date.parse('2026-08-21T21:00:00.000Z'),
  { store: 'Prosper / Celina' }
);
assert(bothMissing.status === 'ok', 'null wage + null hours is excluded (not hourly)');
assert(bothMissing.punchesExcluded === 1, 'both-missing punch is excluded');
assert(bothMissing.missingWagePunches.length === 0, 'excluded punches are not listed as Incomplete');
assert(bothMissing.dollars === 0, 'no remaining hourly punches → $0 from hourly jobs, not Incomplete');

const namedFromMap = summariseTimeEntries(
  [
    {
      regularHours: 3,
      hourlyWage: null,
      employeeReference: { guid: 'guid-from-employees' },
      jobReference: { guid: 'job-from-jobs' },
    },
    { regularHours: 2, overtimeHours: 0, hourlyWage: 18 },
  ],
  Date.now(),
  {
    store: 'Prosper / Celina',
    employeeNames: new Map([['guid-from-employees', 'Jordan Cole']]),
    jobNames: new Map([['job-from-jobs', 'Trainer']]),
  }
);
assert(namedFromMap.status === 'ok', 'mapped null-wage punch is excluded');
assert(namedFromMap.punchesExcluded === 1, 'mapped null-wage punch counted as excluded');
assert(namedFromMap.missingWagePunches.length === 0, 'do not list excluded punches');
assert(namedFromMap.dollars === 36, `remaining hourly 2*18 = 36, got ${namedFromMap.dollars}`);

// Live Prosper shape: Owner + Manager punches with no hourlyWage must not
// mark the store Incomplete. Remaining hourly jobs (GM On Bar, Team Member)
// still produce labor dollars. Never invent Owner/Manager rates.
const prosperLiveShape = summariseTimeEntries(
  [
    {
      regularHours: 0,
      overtimeHours: 0,
      hourlyWage: null,
      inDate: '2026-08-03T10:31:00.000+0000',
      outDate: '2026-08-03T10:31:08.000+0000',
      employeeReference: { guid: 'emp-daniel', firstName: 'Daniel', lastName: 'Keene' },
      jobReference: { guid: 'job-owner', name: 'Owner' },
    },
    {
      regularHours: 0,
      overtimeHours: 0,
      hourlyWage: null,
      inDate: '2026-08-05T10:35:00.000+0000',
      outDate: '2026-08-05T10:35:06.000+0000',
      employeeReference: { guid: 'emp-daniel', firstName: 'Daniel', lastName: 'Keene' },
      jobReference: { guid: 'job-owner', name: 'Owner' },
    },
    {
      regularHours: 3.02,
      overtimeHours: 0,
      hourlyWage: null,
      inDate: '2026-08-20T12:02:00.000+0000',
      outDate: '2026-08-20T15:03:00.000+0000',
      employeeReference: { guid: 'emp-heath', firstName: 'Heath', lastName: 'Marcom' },
      jobReference: { guid: 'job-manager', name: 'Manager' },
    },
    {
      regularHours: 5,
      overtimeHours: 0,
      hourlyWage: 16.5,
      employeeReference: { guid: 'emp-gm', firstName: 'Alex', lastName: 'Rivera' },
      jobReference: { guid: 'job-gm-bar', name: 'GM (On Bar)' },
    },
    {
      regularHours: 4,
      overtimeHours: 0,
      hourlyWage: 12,
      employeeReference: { guid: 'emp-tm', firstName: 'Sam', lastName: 'Lee' },
      jobReference: { guid: 'job-tm', name: 'Team Member' },
    },
  ],
  Date.parse('2026-08-21T21:00:00.000Z'),
  { store: 'Prosper / Celina' }
);
assert(prosperLiveShape.status === 'ok', 'Prosper Owner/Manager punches must not mark Incomplete');
assert(prosperLiveShape.punchesExcluded === 3, `expected 3 excluded, got ${prosperLiveShape.punchesExcluded}`);
assert(prosperLiveShape.punchesMissingWage === 0, 'no hourly punch missing hours');
assert(prosperLiveShape.missingWagePunches.length === 0, 'do not banner Owner/Manager as a problem');
assert(
  prosperLiveShape.dollars === 130.5,
  `GM 5*16.5 + TM 4*12 = 130.50, got ${prosperLiveShape.dollars}`
);
assert(prosperLiveShape.punchesWithWage === 2, 'only GM and Team Member count toward labor $');

const chicago = chicagoDateTimeDisplay('2026-08-21T14:00:00.000+0000');
assert(typeof chicago === 'string' && chicago.includes('2026'), `Chicago display ${chicago}`);

const deletedIgnored = summariseTimeEntries([
  { regularHours: 8, overtimeHours: 0, hourlyWage: 15, deleted: true },
  { regularHours: 2, overtimeHours: 0, hourlyWage: 10 },
]);
assert(deletedIgnored.status === 'ok' && deletedIgnored.dollars === 20, 'deleted punches are skipped');
assert(deletedIgnored.missingWagePunches.length === 0, 'deleted punches are not listed');

// --- 26% target + live dashboard example numbers --------------------------
assert(DEFAULT_LABOR_TARGET_PERCENT === 26, 'labor target must stay 26');
const lePct = laborPercent(7430.94, 34345.74);
assert(lePct === 21.64, `Little Elm example 7430.94/34345.74 should be 21.64, got ${lePct}`);
assert(laborVsTarget(lePct) === 'under', '21.64 vs 26 must be under (green)');
assert(laborVsTarget(26) === 'over', 'exactly 26 is over (red), matching dashboard');
assert(laborVsTarget(null) === 'unavailable', 'no percent → unavailable, not 0%');
assert(laborPercent(null, 25603.76) === null, 'Prosper incomplete labor stays null %');

// --- Chicago MTD window ---------------------------------------------------
const mtd = chicagoMonthToDateBusinessDates({ year: 2026, month: 8, day: 21 });
assert(mtd[0] === '20260801', `MTD start ${mtd[0]}`);
assert(mtd[mtd.length - 1] === '20260821', `MTD end ${mtd[mtd.length - 1]}`);
assert(mtd.length === 21, `August 1–21 is 21 days, got ${mtd.length}`);

console.log('verify-manager-budget: ok');
console.log('  sales: Gross = Net + sales discounts + sales refunds; gift cards / waste excluded');
console.log('  labor: hours × hourlyWage; null wage = not hourly = excluded (not Incomplete)');
console.log('  punches: Incomplete only when an hourly punch is missing hours; no invented wages');
console.log('  target: 26%; 21.64 under; missing hours on hourly punch → no percent');
console.log('  dates: America/Chicago business month 20260801–20260821');
