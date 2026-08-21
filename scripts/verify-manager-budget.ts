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

// --- Labor: hours × wage; null wage is Incomplete, not $0 -----------------
const complete = summariseTimeEntries([
  { regularHours: 8, overtimeHours: 1, hourlyWage: 15 },
  { regularHours: 4, overtimeHours: 0, hourlyWage: 12 },
]);
assert(complete.status === 'ok', 'complete punches should be ok');
assert(complete.dollars === 183, `8*15 + 1*15 + 4*12 = 183, got ${complete.dollars}`);
assert(complete.missingWagePunches.length === 0, 'complete labor lists no missing punches');

const incomplete = summariseTimeEntries(
  [
    { regularHours: 8, overtimeHours: 0, hourlyWage: 15 },
    {
      regularHours: 6,
      overtimeHours: 0,
      hourlyWage: null,
      inDate: '2026-08-21T14:00:00.000+0000',
      outDate: '2026-08-21T20:00:00.000+0000',
      employeeReference: { guid: 'emp-missing-wage', firstName: 'Avery', lastName: 'Nguyen' },
      jobReference: { guid: 'job-barista', name: 'Barista' },
    },
  ],
  Date.parse('2026-08-21T21:00:00.000Z'),
  { store: 'Prosper / Celina' }
);
assert(incomplete.status === 'incomplete', 'null hourlyWage must be incomplete');
assert(incomplete.dollars === null, 'Incomplete labor must be null, never $0');
assert(incomplete.punchesMissingWage === 1, 'expected one punch missing wage');
assert(incomplete.missingWagePunches.length === 1, 'must list the Incomplete punch');
const listed = incomplete.missingWagePunches[0];
assert(listed.store === 'Prosper / Celina', `store ${listed.store}`);
assert(listed.employeeName === 'Avery Nguyen', `name ${listed.employeeName}`);
assert(listed.employeeGuid === 'emp-missing-wage', `guid ${listed.employeeGuid}`);
assert(listed.nameUnknown === false, 'Toast supplied a name');
assert(listed.jobName === 'Barista', `job ${listed.jobName}`);
assert(listed.inDate === '2026-08-21T14:00:00.000+0000', 'keep Toast ISO inDate');
assert(listed.outDate === '2026-08-21T20:00:00.000+0000', 'keep Toast ISO outDate');
assert(listed.inDateChicago !== null, 'Chicago display for inDate');
assert(listed.hours === 6, `hours ${listed.hours}`);
assert(listed.missing === 'hourlyWage', `missing ${listed.missing}`);
assert(!('hourlyWage' in listed) && !('wage' in listed), 'do not include a wage amount');

assert(missingWageKind(null, 6) === 'hourlyWage', 'wage-only gap');
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
assert(hoursMissing.status === 'incomplete' && hoursMissing.dollars === null, 'null hours is Incomplete');
assert(hoursMissing.missingWagePunches[0].missing === 'hours', 'hours-only missing');
assert(hoursMissing.missingWagePunches[0].hours === null, 'hours stay null');
assert(hoursMissing.missingWagePunches[0].nameUnknown === true, 'no Toast name');
assert(
  hoursMissing.missingWagePunches[0].employeeName === 'emp-open',
  'use guid when name is unknown, do not invent one'
);
assert(hoursMissing.missingWagePunches[0].jobName === 'Shift Lead', 'job lookup from /labor/v1/jobs map');

const bothMissing = summariseTimeEntries(
  [{ employeeReference: { guid: 'emp-both' } }],
  Date.parse('2026-08-21T21:00:00.000Z'),
  { store: 'Prosper / Celina' }
);
assert(bothMissing.missingWagePunches[0].missing === 'both', 'both hourlyWage and hours');
assert(bothMissing.missingWagePunches[0].employeeName === 'emp-both', 'guid fallback');
assert(bothMissing.dollars === null, 'both-missing still not $0');

const namedFromMap = summariseTimeEntries(
  [
    {
      regularHours: 3,
      hourlyWage: null,
      employeeReference: { guid: 'guid-from-employees' },
      jobReference: { guid: 'job-from-jobs' },
    },
  ],
  Date.now(),
  {
    store: 'Prosper / Celina',
    employeeNames: new Map([['guid-from-employees', 'Jordan Cole']]),
    jobNames: new Map([['job-from-jobs', 'Trainer']]),
  }
);
assert(namedFromMap.missingWagePunches[0].employeeName === 'Jordan Cole', 'employees API name');
assert(namedFromMap.missingWagePunches[0].jobName === 'Trainer', 'jobs API name');
assert(namedFromMap.missingWagePunches[0].nameUnknown === false, 'mapped name is known');

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
console.log('  labor: hours × hourlyWage; null wage → Incomplete (not $0)');
console.log('  punches: Incomplete stores list name-or-guid, job, in/out; no invented wages');
console.log('  target: 26%; 21.64 under; missing wage → no percent');
console.log('  dates: America/Chicago business month 20260801–20260821');
