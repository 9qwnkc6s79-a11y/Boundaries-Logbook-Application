/**
 * Smoke: store-day protocol lists sort Opening → Mid-Shift → Closing,
 * then weekly/monthly. Display order only.
 * Run: npx --yes tsx scripts/verify-checklist-order.ts
 */
import { sortChecklistsByStoreDay } from '../utils/checklistOrder.ts';

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

const shuffled = [
  { id: 'monthly', type: 'MONTHLY' as const },
  { id: 'closing', type: 'CLOSING' as const },
  { id: 'weekly', type: 'WEEKLY' as const },
  { id: 'opening', type: 'OPENING' as const },
  { id: 'midshift', type: 'SHIFT_CHANGE' as const },
];

const sorted = sortChecklistsByStoreDay(shuffled);
assert(
  sorted.map(t => t.id).join(',') === 'opening,midshift,closing,weekly,monthly',
  `Expected Opening → Mid-Shift → Closing → Weekly → Monthly, got ${sorted.map(t => t.id).join(' → ')}`
);

const pulse = sortChecklistsByStoreDay(
  shuffled.filter(t => ['OPENING', 'CLOSING', 'SHIFT_CHANGE'].includes(t.type))
);
assert(
  pulse.map(t => t.id).join(',') === 'opening,midshift,closing',
  `Operational Pulse order should be Opening, Mid-Shift, Closing; got ${pulse.map(t => t.id).join(', ')}`
);

// Stable copy — input is not mutated
assert(shuffled[0].id === 'monthly', 'sortChecklistsByStoreDay must not mutate the input array');

console.log('verify-checklist-order: ok');
