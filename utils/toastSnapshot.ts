/**
 * Daily Toast sales/labor snapshots. Tiles use a complete snapshot instead of
 * showing Unavailable after a live 429. A missing day is never stored as $0.
 */

import { eachDate } from './logbookRecords';

export interface StoreDaySnapshot {
  storeId: 'store-elm' | 'store-prosper';
  businessDate: string;
  capturedAt: string;
  salesGross: number | null;
  orders: number | null;
  laborDollars: number | null;
  laborHours: number | null;
  salesStatus: 'ok' | 'unavailable';
  laborStatus: 'ok' | 'unavailable' | 'incomplete';
  error?: string;
}

export interface BudgetStoreSlice {
  todaySales: number | null;
  mtdSales: number | null;
  mtdLaborDollars: number | null;
  mtdLaborPercent: number | null;
  laborStatus: string;
  laborVsTarget: string;
  laborMessage: string;
}

export interface BudgetSlice {
  businessDate: string;
  period: { startDate: string; endDate: string };
  salesComplete: boolean;
  salesNote?: string;
  laborTargetPercent: number;
  littleElm: BudgetStoreSlice;
  prosper: BudgetStoreSlice;
  labor: { status: string; message: string; source: string | null };
}

export function snapshotDocId(storeId: string, businessDate: string): string {
  return `${storeId}_${businessDate}`;
}

export function retryDelayMs(attempt: number, retryAfter: string | null): number {
  const header = retryAfter == null ? NaN : Number(retryAfter);
  if (Number.isFinite(header) && header >= 0) return Math.min(header * 1000, 30_000);
  return Math.min(500 * 2 ** attempt, 15_000);
}

/** Keep a previous good value when a later pull is rate-limited. */
export function mergeSnapshot(previous: StoreDaySnapshot | null, incoming: StoreDaySnapshot): StoreDaySnapshot {
  if (!previous) return incoming;
  const salesOk = incoming.salesStatus === 'ok' && incoming.salesGross != null;
  const laborOk = incoming.laborStatus === 'ok' && incoming.laborDollars != null;
  return {
    ...previous,
    ...incoming,
    salesGross: salesOk ? incoming.salesGross : previous.salesGross,
    orders: salesOk ? incoming.orders : previous.orders,
    salesStatus: salesOk ? 'ok' : previous.salesStatus,
    laborDollars: laborOk ? incoming.laborDollars : previous.laborDollars,
    laborHours: laborOk ? incoming.laborHours : previous.laborHours,
    laborStatus: laborOk ? 'ok' : (previous.laborStatus === 'ok' ? 'ok' : incoming.laborStatus),
    capturedAt: incoming.capturedAt,
    error: incoming.error || previous.error,
  };
}

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

function laborPercent(labor: number | null, sales: number | null): number | null {
  if (labor == null || sales == null || !(sales > 0)) return null;
  return Math.round((labor / sales) * 10000) / 100;
}

function rowsFor(storeId: string, dates: string[], snapshots: StoreDaySnapshot[]): (StoreDaySnapshot | undefined)[] {
  return dates.map(date => snapshots.find(row => row.storeId === storeId && row.businessDate === date));
}

function coverStore(
  store: BudgetStoreSlice,
  storeId: 'store-elm' | 'store-prosper',
  dates: string[],
  snapshots: StoreDaySnapshot[],
  businessDate: string,
  salesComplete: boolean,
  target: number,
): { store: BudgetStoreSlice; salesFilled: boolean } {
  const rows = rowsFor(storeId, dates, snapshots);
  const salesOk = rows.every(row => row && row.salesStatus === 'ok' && row.salesGross != null);
  const laborOk = rows.every(row => row && row.laborStatus === 'ok' && row.laborDollars != null);
  const next = { ...store };
  let salesFilled = false;
  if (!salesComplete && salesOk) {
    next.mtdSales = roundMoney(rows.reduce((sum, row) => sum + (row!.salesGross || 0), 0));
    const today = rows.find(row => row!.businessDate === businessDate);
    if (today) next.todaySales = today.salesGross;
    salesFilled = true;
  }
  const liveFailed = store.laborStatus === 'unavailable' || store.laborStatus === 'blocked';
  if (liveFailed && laborOk) {
    const dollars = roundMoney(rows.reduce((sum, row) => sum + (row!.laborDollars || 0), 0));
    next.mtdLaborDollars = dollars;
    next.laborStatus = 'ok';
    next.mtdLaborPercent = laborPercent(dollars, next.mtdSales);
    next.laborVsTarget = next.mtdLaborPercent == null ? 'unavailable' : next.mtdLaborPercent < target ? 'under' : 'over';
    next.laborMessage = `Daily Toast snapshot ${dates[0]} to ${dates[dates.length - 1]}. Live Toast was unavailable.`;
  } else if (liveFailed) {
    const have = rows.filter(row => row && row.laborStatus === 'ok').length;
    next.laborMessage = `${store.laborMessage} Snapshot covers ${have} of ${dates.length} days; missing days are not shown as $0.`;
  }
  return { store: next, salesFilled };
}

export function applyToastSnapshots<T extends BudgetSlice>(budget: T, snapshots: StoreDaySnapshot[]): T {
  const dates = eachDate(budget.period.startDate, budget.period.endDate);
  if (dates.length === 0) return budget;
  const little = coverStore(budget.littleElm, 'store-elm', dates, snapshots, budget.businessDate, budget.salesComplete, budget.laborTargetPercent);
  const prosper = coverStore(budget.prosper, 'store-prosper', dates, snapshots, budget.businessDate, budget.salesComplete, budget.laborTargetPercent);
  const next: T = {
    ...budget,
    littleElm: little.store,
    prosper: prosper.store,
  };
  if ((little.salesFilled || prosper.salesFilled) && little.salesFilled && prosper.salesFilled) {
    next.salesComplete = true;
    next.salesNote = `Sales filled from daily Toast snapshots ${dates[0]} to ${dates[dates.length - 1]}.`;
  }
  const bothOk = next.littleElm.laborStatus === 'ok' && next.prosper.laborStatus === 'ok';
  if (bothOk && (budget.littleElm.laborStatus !== 'ok' || budget.prosper.laborStatus !== 'ok')) {
    next.labor = {
      ...budget.labor,
      status: 'ok',
      source: null,
      message: 'Labor dollars are from daily Toast snapshots because the live call was unavailable.',
    };
  }
  return next;
}
