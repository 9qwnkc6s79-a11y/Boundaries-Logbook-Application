/**
 * Smoke: ported Sales Summary + labor fallback identities from dashboard @ 274056b.
 * Run: npx --yes tsx scripts/verify-manager-budget.ts
 */
import {
  DEFAULT_LABOR_TARGET_PERCENT,
  chicagoMonthToDateBusinessDates,
  laborPercent,
  laborVsTarget,
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

const incomplete = summariseTimeEntries([
  { regularHours: 8, overtimeHours: 0, hourlyWage: 15 },
  { regularHours: 6, overtimeHours: 0, hourlyWage: null },
]);
assert(incomplete.status === 'incomplete', 'null hourlyWage must be incomplete');
assert(incomplete.dollars === null, 'Incomplete labor must be null, never $0');
assert(incomplete.punchesMissingWage === 1, 'expected one punch missing wage');

const deletedIgnored = summariseTimeEntries([
  { regularHours: 8, overtimeHours: 0, hourlyWage: 15, deleted: true },
  { regularHours: 2, overtimeHours: 0, hourlyWage: 10 },
]);
assert(deletedIgnored.status === 'ok' && deletedIgnored.dollars === 20, 'deleted punches are skipped');

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
console.log('  target: 26%; 21.64 under; missing wage → no percent');
console.log('  dates: America/Chicago business month 20260801–20260821');
