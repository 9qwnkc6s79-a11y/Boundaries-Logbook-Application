/**
 * Manager Hub waste history: last N business nights per store from the
 * existing foodClosingWaste-{storeId} rows. Nights with no rows are flagged
 * "not logged" (today stays "pending" until it has rows).
 */
import type { FoodClosingWasteEntry } from '../types';

export interface WasteHistoryItem {
  itemGuid: string;
  name: string;
  leftover: number | null;
  waste: number | null;
}

export interface WasteHistoryNight {
  date: string;
  isToday: boolean;
  /** 'logged' | 'not_logged' | 'pending' (today, nothing yet) */
  state: 'logged' | 'not_logged' | 'pending';
  items: WasteHistoryItem[];
  totalLeftover: number;
  totalWaste: number;
  /** Rows saved with a blank leftover or waste number. */
  blanks: number;
  loggedBy: string[];
}

export function shiftYmd(ymd: string, days: number): string {
  const [y, m, d] = ymd.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days, 12, 0, 0));
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`;
}

export function chicagoToday(now: Date = new Date()): string {
  return now.toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
}

/** Newest night first. */
export function buildWasteHistory(
  rows: FoodClosingWasteEntry[],
  opts: { days: number; today: string },
): WasteHistoryNight[] {
  const byDate = new Map<string, FoodClosingWasteEntry[]>();
  for (const row of rows || []) {
    if (!row?.businessDate) continue;
    const list = byDate.get(row.businessDate) || [];
    list.push(row);
    byDate.set(row.businessDate, list);
  }

  const nights: WasteHistoryNight[] = [];
  for (let i = 0; i < opts.days; i++) {
    const date = shiftYmd(opts.today, -i);
    const dayRows = byDate.get(date) || [];
    const isToday = date === opts.today;
    const items = dayRows
      .map(r => ({
        itemGuid: r.itemGuid,
        name: r.itemName || r.itemGuid,
        leftover: typeof r.leftoverQty === 'number' ? r.leftoverQty : null,
        waste: typeof r.wasteQty === 'number' ? r.wasteQty : null,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
    const loggedBy = Array.from(new Set(dayRows.map(r => r.updatedByName || '').filter(Boolean))).sort();
    nights.push({
      date,
      isToday,
      state: dayRows.length > 0 ? 'logged' : isToday ? 'pending' : 'not_logged',
      items,
      totalLeftover: items.reduce((s, it) => s + (it.leftover ?? 0), 0),
      totalWaste: items.reduce((s, it) => s + (it.waste ?? 0), 0),
      blanks: items.filter(it => it.leftover === null || it.waste === null).length,
      loggedBy,
    });
  }
  return nights;
}

export function wasteHistorySummary(nights: WasteHistoryNight[]) {
  const scored = nights.filter(n => n.state !== 'pending');
  return {
    logged: scored.filter(n => n.state === 'logged').length,
    nights: scored.length,
    notLogged: scored.filter(n => n.state === 'not_logged').map(n => n.date),
    totalWaste: scored.reduce((s, n) => s + n.totalWaste, 0),
    totalLeftover: scored.reduce((s, n) => s + n.totalLeftover, 0),
  };
}
