/**
 * Smoke: closing leftover + waste completeness gate.
 * 0 is valid. Blank / "—" / null is not. Empty list does not block close.
 * Run: npx --yes tsx scripts/verify-closing-waste-complete.ts
 */
import {
  closingWasteBlocksSubmit,
  formatIncompleteWasteMessage,
  incompleteClosingWasteRows,
  isEnteredWasteQty,
} from '../utils/closingWasteComplete.ts';

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

assert(isEnteredWasteQty(0) === true, '0 leftover/waste must count as entered');
assert(isEnteredWasteQty('0') === true, '"0" must count as entered');
assert(isEnteredWasteQty(2) === true, 'positive numbers must count');
assert(isEnteredWasteQty('3.5') === true, 'decimal strings must count');
assert(isEnteredWasteQty('') === false, 'empty string is not complete');
assert(isEnteredWasteQty('   ') === false, 'whitespace is not complete');
assert(isEnteredWasteQty('—') === false, 'placeholder dash is not complete');
assert(isEnteredWasteQty(null) === false, 'null is not complete');
assert(isEnteredWasteQty(undefined) === false, 'undefined is not complete');
assert(isEnteredWasteQty(Number.NaN) === false, 'NaN is not complete');

const rows = [
  { itemGuid: 'croissant', name: 'Almond Croissant' },
  { itemGuid: 'taco', name: 'Breakfast Taco' },
];

const bothMissing = incompleteClosingWasteRows(rows, () => ({ leftover: '', waste: null }));
assert(bothMissing.length === 2, 'blank rows must all be incomplete');
assert(bothMissing[0].missingLeftover && bothMissing[0].missingWaste, 'both fields missing on croissant');

const halfFilled = incompleteClosingWasteRows(rows, guid => (
  guid === 'croissant'
    ? { leftover: 0, waste: '' }
    : { leftover: 1, waste: 0 }
));
assert(halfFilled.length === 1, 'only croissant waste is still missing');
assert(halfFilled[0].itemGuid === 'croissant' && halfFilled[0].missingWaste && !halfFilled[0].missingLeftover, 'croissant leftover 0 is enough; waste still required');

const complete = incompleteClosingWasteRows(rows, () => ({ leftover: 0, waste: 0 }));
assert(complete.length === 0, '0 + 0 on every row is complete');

assert(closingWasteBlocksSubmit(null) === true, 'unknown gate (still mounting) must block close');
assert(closingWasteBlocksSubmit({ ready: false, rowCount: 0, incomplete: [] }) === true, 'loading must block so we do not skip a list that is about to appear');
assert(closingWasteBlocksSubmit({ ready: true, rowCount: 0, incomplete: [] }) === false, 'empty list after load must not block');
assert(closingWasteBlocksSubmit({ ready: true, rowCount: 2, incomplete: complete }) === false, 'complete list must not block');
assert(closingWasteBlocksSubmit({ ready: true, rowCount: 2, incomplete: bothMissing }) === true, 'visible rows with blanks must block');

const message = formatIncompleteWasteMessage(halfFilled);
assert(/Almond Croissant/.test(message), 'submit message must name the missing item');
assert(/waste qty/.test(message), 'submit message must say which field is missing');
assert(!/Breakfast Taco/.test(message), 'complete items must not appear in the missing list');

console.log('verify-closing-waste-complete: ok');
