/**
 * Closing leftover + waste completeness.
 * Every visible bakery/taco row needs leftover qty AND waste qty as real numbers.
 * 0 is valid. Blank / "—" / null / empty is not.
 * Empty list (Toast stock failed or no rows) does not block close.
 */

export type IncompleteWasteRow = {
  itemGuid: string;
  name: string;
  missingLeftover: boolean;
  missingWaste: boolean;
};

export type ClosingWasteGate = {
  /** False while the bakery/taco list is still loading. */
  ready: boolean;
  rowCount: number;
  incomplete: IncompleteWasteRow[];
};

/** True for an actual entered number. 0 counts. Blank / dash / null does not. */
export function isEnteredWasteQty(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '' || trimmed === '—' || trimmed === '-') return false;
    const n = Number(trimmed);
    return Number.isFinite(n);
  }
  return false;
}

export function incompleteClosingWasteRows(
  rows: { itemGuid: string; name: string }[],
  qtyFor: (itemGuid: string) => { leftover: unknown; waste: unknown },
): IncompleteWasteRow[] {
  const incomplete: IncompleteWasteRow[] = [];
  for (const row of rows) {
    const qty = qtyFor(row.itemGuid);
    const missingLeftover = !isEnteredWasteQty(qty.leftover);
    const missingWaste = !isEnteredWasteQty(qty.waste);
    if (missingLeftover || missingWaste) {
      incomplete.push({
        itemGuid: row.itemGuid,
        name: row.name,
        missingLeftover,
        missingWaste,
      });
    }
  }
  return incomplete;
}

/** Close submit gate. No rows → do not block. Still loading → block. */
export function closingWasteBlocksSubmit(gate: ClosingWasteGate | null): boolean {
  if (!gate || !gate.ready) return true;
  if (gate.rowCount === 0) return false;
  return gate.incomplete.length > 0;
}

export function formatIncompleteWasteMessage(incomplete: IncompleteWasteRow[]): string {
  const lines = incomplete.map(row => {
    const missing = [
      row.missingLeftover ? 'leftover qty' : null,
      row.missingWaste ? 'waste qty' : null,
    ].filter(Boolean).join(' + ');
    return `• ${row.name} (${missing})`;
  });
  return [
    'Enter leftover qty and waste qty for every bakery/taco item (0 is OK if none). Still missing:',
    ...lines,
  ].join('\n');
}
