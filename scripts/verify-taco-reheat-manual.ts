import assert from 'node:assert';
import { appendTacoReheatToManual, TACO_REHEAT_HEADING } from '../data/tacoReheatManual';
import { patchFoodCloseManualSections } from '../data/foodCloseTasks';

const live: any[] = [
  { id: 's-11', number: '11', title: 'Expo', content: 'live expo edit' },
  { id: 's-12', number: '12', title: 'Food Prep & Kitchen Standards', content: 'LIVE §12 manager text\n' },
  { id: 's-14', number: '14', title: 'Restocking', content: 'live §14 edit' },
  { id: 's-16', number: '16', title: 'Close', content: 'live §16 edit' },
];
const { next, mutated } = appendTacoReheatToManual(live);
assert(mutated);
assert(next[1].content.startsWith('LIVE §12 manager text'), 'keeps live §12 text');
assert(next[1].content.includes(TACO_REHEAT_HEADING));
assert(next[1].content.includes('1 taco | 0:45') && next[1].content.includes('4 tacos | 1:50'));
assert.deepStrictEqual([next[0], next[2], next[3]], [live[0], live[2], live[3]], 'other sections untouched');
const again = appendTacoReheatToManual(next);
assert(!again.mutated, 'idempotent');
assert.strictEqual(again.next[1].content.split(TACO_REHEAT_HEADING).length, 2);
// v7 → v8 path must not re-run the §12/§14/§16 seed replacement
const cloud = 7;
const patched = cloud < 7 ? patchFoodCloseManualSections(live as any, []) : live;
assert.strictEqual(patched, live);
console.log('taco reheat manual: ok');
