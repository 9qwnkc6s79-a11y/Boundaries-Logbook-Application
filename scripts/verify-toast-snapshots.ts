/**
 * Snapshot fallback never turns a missing day into $0.
 * Run: npx tsx scripts/verify-toast-snapshots.ts
 */
import { readFileSync } from 'node:fs';
import {
  applyToastSnapshots,
  mergeSnapshot,
  retryDelayMs,
  snapshotDocId,
  type BudgetSlice,
  type StoreDaySnapshot,
} from '../utils/toastSnapshot.ts';
import { cronAuthorized } from '../api/cron/toast-snapshots.ts';

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

assert(snapshotDocId('store-prosper', '2026-11-17') === 'store-prosper_2026-11-17', 'doc id');
assert(retryDelayMs(0, null) === 500, 'first backoff');
assert(retryDelayMs(3, null) === 4000, 'exponential backoff');
assert(retryDelayMs(1, '2') === 2000, 'Retry-After wins');
assert(cronAuthorized('Bearer secret', 'secret'), 'cron secret matches');
assert(!cronAuthorized('Bearer no', 'secret'), 'cron secret rejects');
assert(!cronAuthorized('Bearer secret', undefined), 'missing secret rejects');

const failed: StoreDaySnapshot = {
  storeId: 'store-prosper',
  businessDate: '2026-11-02',
  capturedAt: '2026-11-02T23:00:00.000Z',
  salesGross: null,
  orders: null,
  laborDollars: null,
  laborStatus: 'unavailable',
  salesStatus: 'unavailable',
  laborHours: null,
  error: '429',
};
const good: StoreDaySnapshot = { ...failed, salesGross: 1200, orders: 80, laborDollars: 300, salesStatus: 'ok', laborStatus: 'ok' };
const kept = mergeSnapshot(good, failed);
assert(kept.laborDollars === 300 && kept.salesGross === 1200, 'a 429 does not wipe a good snapshot');
assert(mergeSnapshot(null, failed).laborDollars === null, 'first failure is not stored as zero');

const store = {
  todaySales: null,
  mtdSales: null,
  mtdLaborDollars: null,
  mtdLaborPercent: null,
  laborStatus: 'unavailable',
  laborVsTarget: 'unavailable',
  laborMessage: 'Toast rate limit',
};
const budget: BudgetSlice = {
  businessDate: '2026-11-02',
  period: { startDate: '2026-11-01', endDate: '2026-11-02' },
  salesComplete: true,
  laborTargetPercent: 26,
  littleElm: { ...store, laborStatus: 'ok', mtdSales: 5000, mtdLaborDollars: 1000, mtdLaborPercent: 20, laborVsTarget: 'under', laborMessage: 'live' },
  prosper: { ...store, mtdSales: 4000 },
  labor: { status: 'unavailable', message: 'prosper failed', source: null },
};
const day = (date: string, storeId: StoreDaySnapshot['storeId'], labor: number): StoreDaySnapshot => ({
  storeId,
  businessDate: date,
  capturedAt: '2026-11-02T23:00:00.000Z',
  salesGross: 1000,
  orders: 10,
  laborDollars: labor,
  laborHours: 8,
  salesStatus: 'ok',
  laborStatus: 'ok',
});
const full = applyToastSnapshots(budget, [
  day('2026-11-01', 'store-prosper', 100),
  day('2026-11-02', 'store-prosper', 150),
]);
assert(full.prosper.laborStatus === 'ok', 'complete snapshot replaces Unavailable');
assert(full.prosper.mtdLaborDollars === 250, 'labor is the sum of snapshot days');
assert(full.prosper.laborMessage.includes('snapshot'), 'tile says the number is a snapshot');
assert(full.littleElm.mtdLaborDollars === 1000, 'a live ok store is left alone');

const partial = applyToastSnapshots(budget, [day('2026-11-01', 'store-prosper', 100)]);
assert(partial.prosper.laborStatus === 'unavailable', 'a missing day stays unavailable');
assert(partial.prosper.mtdLaborDollars === null, 'partial snapshot is not summed as if the month were complete');
assert(partial.prosper.laborMessage.includes('1 of 2'), 'the gap is visible');

const src = readFileSync(new URL('../api/manager-budget.ts', import.meta.url), 'utf8');
assert(!src.includes("from '../utils/"), 'the tile function must not import utils (Vercel drops them)');
assert(src.includes('saveDailySnapshots'), 'the cron secret path saves snapshots from the tile function');
assert(src.includes('CRON_SECRET'), 'snapshot saves require the cron secret');

console.log('verify-toast-snapshots: OK');
