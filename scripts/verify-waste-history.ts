/**
 * Smoke: Hub waste history (last 7/14 nights, "not logged" flags).
 * Fake rows only; no Firestore.
 * Run: npx --yes tsx scripts/verify-waste-history.ts
 */
import type { FoodClosingWasteEntry } from '../types.ts';
import { buildWasteHistory, chicagoToday, shiftYmd, wasteHistorySummary } from '../utils/wasteHistory.ts';

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

const row = (businessDate: string, itemGuid: string, leftoverQty: number | null, wasteQty: number | null, by = 'Camden'): FoodClosingWasteEntry => ({
  storeId: 'store-elm', businessDate, itemGuid, itemName: itemGuid, leftoverQty, wasteQty,
  updatedAt: `${businessDate}T23:00:00Z`, updatedBy: by, updatedByName: by,
});

assert(shiftYmd('2026-10-01', -1) === '2026-09-30', 'shift across month');
assert(shiftYmd('2026-03-08', 1) === '2026-03-09', 'shift across DST');
assert(chicagoToday(new Date('2026-10-19T03:30:00Z')) === '2026-10-18', 'Chicago today before midnight CT is the previous UTC day');

const today = '2026-10-19';
const rows: FoodClosingWasteEntry[] = [
  row('2026-10-18', 'Breakfast Taco', 3, 3),
  row('2026-10-18', 'Almond Croissant', 0, 0, 'Megan'),
  row('2026-10-16', 'Breakfast Taco', 2, null),
  row('2026-10-13', 'Kolache', 1, 1),
  row('2026-10-01', 'Kolache', 9, 9), // outside 14 days
];

const week = buildWasteHistory(rows, { days: 7, today });
assert(week.length === 7, '7 nights');
assert(week[0].date === today && week[0].state === 'pending' && week[0].isToday, 'today is pending, not flagged');
assert(week[1].date === '2026-10-18' && week[1].state === 'logged', 'Oct 18 logged');
assert(week[1].totalWaste === 3 && week[1].totalLeftover === 3, 'Oct 18 totals (0 counts as entered)');
assert(week[1].loggedBy.join(',') === 'Camden,Megan', 'logged by');
assert(week[2].date === '2026-10-17' && week[2].state === 'not_logged', 'Oct 17 not logged');
assert(week[3].blanks === 1, 'blank waste counted');
assert(week[6].date === '2026-10-13' && week[6].state === 'logged', 'oldest night in 7-day window');

const s7 = wasteHistorySummary(week);
assert(s7.nights === 6 && s7.logged === 3, `7-day summary ${JSON.stringify(s7)}`);
assert(JSON.stringify(s7.notLogged) === JSON.stringify(['2026-10-17', '2026-10-15', '2026-10-14']), 'not-logged dates');

const fortnight = buildWasteHistory(rows, { days: 14, today });
assert(fortnight.length === 14 && fortnight[13].date === '2026-10-06', '14 nights');
assert(!fortnight.some(n => n.date === '2026-10-01'), 'older rows ignored');
const s14 = wasteHistorySummary(fortnight);
assert(s14.logged === 3 && s14.notLogged.length === 10, `14-day summary ${JSON.stringify(s14)}`);

const loggedToday = buildWasteHistory([row(today, 'Breakfast Taco', 1, 1)], { days: 7, today });
assert(loggedToday[0].state === 'logged', 'today flips to logged once rows exist');
assert(buildWasteHistory([], { days: 7, today }).filter(n => n.state === 'not_logged').length === 6, 'empty store: every past night flagged');

console.log('7-day:', week.map(n => `${n.date} ${n.state}`).join(' | '));
console.log('verify-waste-history: ok');
