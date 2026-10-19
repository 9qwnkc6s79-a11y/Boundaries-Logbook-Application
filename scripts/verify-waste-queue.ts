/**
 * Smoke: closing waste saves cannot drop rows when a closer tabs quickly.
 * Uses an in-memory fake doc with async read/write latency (no Firestore).
 * Run: npx --yes tsx scripts/verify-waste-queue.ts
 */
import type { FoodClosingWasteEntry } from '../types.ts';
import { createKeyedSerialQueue, mergeWasteEntries, parseWasteQty, wasteEntryKey } from '../utils/wasteQueue.ts';

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

function fakeDoc() {
  let doc: FoodClosingWasteEntry[] = [];
  return {
    async get() { await sleep(20); return doc.map(r => ({ ...r })); },
    async set(rows: FoodClosingWasteEntry[]) { await sleep(20); doc = rows.map(r => ({ ...r })); return true; },
    peek: () => doc,
  };
}

const row = (itemGuid: string, itemName: string, leftoverQty: number | null, wasteQty: number | null): FoodClosingWasteEntry => ({
  storeId: 'store-prosper', businessDate: '2026-10-18', itemGuid, itemName, leftoverQty, wasteQty,
  updatedAt: '2026-10-19T00:06:31Z', updatedBy: 'u1', updatedByName: 'Camden',
});

// Oct 18 Prosper: four blur saves ~1s apart in real life; here they overlap fully.
const tabbing = [
  row('almond', 'Almond Croissant', 1, 1),
  row('choc', 'Chocolate Croissant', 0, 0),
  row('kolache', 'Kolache (Sausage/Cheese)', 2, 2),
  row('taco', 'Breakfast Taco', 3, 3),
];

async function readModifyWrite(doc: ReturnType<typeof fakeDoc>, entries: FoodClosingWasteEntry[]) {
  const existing = await doc.get();
  return doc.set(mergeWasteEntries(existing, entries));
}

// 1. Old behaviour: overlapping read-modify-writes lose rows.
{
  const doc = fakeDoc();
  await Promise.all(tabbing.map(e => readModifyWrite(doc, [e])));
  assert(doc.peek().length < tabbing.length, 'control: unqueued overlapping saves should drop rows (race reproduced)');
  console.log(`unqueued overlapping saves kept ${doc.peek().length}/${tabbing.length} rows (race reproduced)`);
}

// 2. Queued per store: every row survives, in order.
{
  const doc = fakeDoc();
  const enqueue = createKeyedSerialQueue();
  let running = 0;
  let maxRunning = 0;
  await Promise.all(tabbing.map(e => enqueue('store-prosper', async () => {
    running++; maxRunning = Math.max(maxRunning, running);
    try { return await readModifyWrite(doc, [e]); } finally { running--; }
  })));
  assert(maxRunning === 1, 'queue must run one save at a time per store');
  const names = doc.peek().map(r => r.itemName).sort();
  assert(names.length === 4 && names.includes('Breakfast Taco'), `queued saves must keep all rows, got ${names}`);
  console.log('queued saves keep all 4 rows incl. Breakfast Taco: ok');
}

// 3. A failed save does not block the next one; different stores run in parallel.
{
  const enqueue = createKeyedSerialQueue();
  const order: string[] = [];
  const a = enqueue('s1', async () => { await sleep(10); order.push('fail'); throw new Error('boom'); });
  const b = enqueue('s1', async () => { order.push('next'); return 'ok'; });
  const c = enqueue('s2', async () => { order.push('other-store'); return 'ok'; });
  await a.then(() => assert(false, 'failed task should reject'), err => assert(String(err).includes('boom'), 'error propagates'));
  assert((await b) === 'ok', 'task after a failure still runs');
  await c;
  assert(order[0] === 'other-store', 'other store is not blocked by s1');
  assert(order.indexOf('fail') < order.indexOf('next'), 's1 tasks stay ordered');
  console.log('failed save does not block queue; stores independent: ok');
}

// 4. Close-submit flush: one batch write after racing blur saves restores lost rows.
{
  const doc = fakeDoc();
  await Promise.all(tabbing.map(e => readModifyWrite(doc, [e]))); // lossy, as on Oct 18
  await readModifyWrite(doc, tabbing); // flush on submit
  assert(doc.peek().length === 4, 'submit flush must save every row');
  console.log('submit flush re-saves every row (4/4): ok');
}

// 5. Merge + parse helpers.
{
  const merged = mergeWasteEntries([row('taco', 'Breakfast Taco', 5, 5), row('almond', 'Almond Croissant', 1, 1)], [row('taco', 'Breakfast Taco', 3, 2)]);
  assert(merged.length === 2, 'merge keeps distinct items');
  assert(merged.find(r => r.itemGuid === 'taco')!.wasteQty === 2, 'newer entry wins');
  const otherNight = { ...row('taco', 'Breakfast Taco', 1, 1), businessDate: '2026-10-17' };
  assert(mergeWasteEntries([otherNight], [row('taco', 'Breakfast Taco', 3, 3)]).length === 2, 'different nights do not collide');
  assert(wasteEntryKey(otherNight) === '2026-10-17:taco', 'entry key');
  assert(parseWasteQty('') === null && parseWasteQty('  ') === null && parseWasteQty(null) === null, 'blank -> null');
  assert(parseWasteQty('0') === 0 && parseWasteQty(0) === 0, '0 is a real value');
  assert(parseWasteQty('2.5') === 2.5 && parseWasteQty('abc') === null && parseWasteQty(Number.NaN) === null, 'parse');
  console.log('mergeWasteEntries / parseWasteQty: ok');
}

console.log('verify-waste-queue: ok');
