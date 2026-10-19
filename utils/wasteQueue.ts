/**
 * Closing leftover/waste saves.
 *
 * Each waste save is a read-modify-write of one per-store doc. Saves fired on
 * every blur used to overlap: a closer tabbing quickly through the list started
 * several reads before any write landed, and the last write dropped the rows
 * the others added (Prosper Oct 18: Breakfast Taco lost, close submitted 1s later).
 * Saves now run one at a time per store, and the close submit re-saves every
 * row in a single write.
 */
import type { FoodClosingWasteEntry } from '../types';

/** Runs tasks one at a time per key. A failed task does not block the next one. */
export function createKeyedSerialQueue() {
  const tails = new Map<string, Promise<unknown>>();
  return function enqueue<T>(key: string, task: () => Promise<T>): Promise<T> {
    const prev = tails.get(key) || Promise.resolve();
    const run = prev.catch(() => undefined).then(task);
    const tail = run.catch(() => undefined);
    tails.set(key, tail);
    void tail.then(() => {
      if (tails.get(key) === tail) tails.delete(key);
    });
    return run;
  };
}

export function wasteEntryKey(row: { businessDate: string; itemGuid: string }): string {
  return `${row.businessDate}:${row.itemGuid}`;
}

/** Merge new entries over existing rows (same business date + item = replaced). */
export function mergeWasteEntries(
  existing: FoodClosingWasteEntry[],
  entries: FoodClosingWasteEntry[],
): FoodClosingWasteEntry[] {
  const map = new Map<string, FoodClosingWasteEntry>();
  for (const row of existing) map.set(wasteEntryKey(row), row);
  for (const entry of entries) map.set(wasteEntryKey(entry), entry);
  return Array.from(map.values());
}

/** Parse a leftover/waste input. Blank or non-numeric -> null. 0 is a real value. */
export function parseWasteQty(raw: unknown): number | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null;
  const trimmed = String(raw).trim();
  if (trimmed === '') return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}
