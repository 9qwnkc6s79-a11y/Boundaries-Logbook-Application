/**
 * One document per attributed order.
 * Path: organizations/{orgId}/attributedOrders/{docId}
 *
 * The legacy array organizations/{orgId}/data/attributedOrders is about
 * 2,134 rows and ~1.05 MB (backup 2026-11-17), so another array write can
 * be rejected. Docs are the durable copy. The array is still read and is
 * written only when the merged JSON stays under the size guard.
 * Docs are not pruned and not deleted by a store clear.
 */

export const ORDER_ARRAY_MAX_BYTES = 900_000;

export interface AttributedOrderLike {
  id?: string;
  storeId?: string;
  checkGuid?: string;
  openedAt?: string;
  [key: string]: unknown;
}

export function orderKey(order: AttributedOrderLike): string {
  return `${order.id || ''}-${order.checkGuid || ''}`;
}

export function orderDocId(order: AttributedOrderLike): string | null {
  if (!order.id) return null;
  const raw = order.checkGuid ? `${order.id}_${order.checkGuid}` : order.id;
  const safe = raw.replace(/[^A-Za-z0-9_-]/g, '_');
  if (!safe || safe.length > 700) return null;
  return safe;
}

/** Docs replace array rows with the same order id + check. Array-only rows stay. */
export function mergeAttributedOrders<T extends AttributedOrderLike>(arrayOrders: T[], docOrders: T[]): T[] {
  const map = new Map<string, T>();
  for (const order of arrayOrders || []) {
    if (!order?.id) continue;
    map.set(orderKey(order), order);
  }
  for (const order of docOrders || []) {
    if (!order?.id) continue;
    map.set(orderKey(order), order);
  }
  return Array.from(map.values());
}

export function arrayWriteFits(orders: unknown[], maxBytes = ORDER_ARRAY_MAX_BYTES): boolean {
  return JSON.stringify(orders).length <= maxBytes;
}

export type OrderDocAction = 'create' | 'update' | 'unchanged' | 'conflict';

export function planOrderDocMigration(source: AttributedOrderLike[], existing: AttributedOrderLike[]): {
  rows: { action: OrderDocAction; id: string; reason: string }[];
  summary: Record<OrderDocAction | 'total', number>;
} {
  const existingById = new Map<string, AttributedOrderLike>();
  for (const order of existing || []) {
    const id = orderDocId(order);
    if (id) existingById.set(id, order);
  }
  const rows: { action: OrderDocAction; id: string; reason: string }[] = [];
  const seen = new Set<string>();
  for (const order of source || []) {
    const id = orderDocId(order);
    if (!id) {
      rows.push({ action: 'conflict', id: order.id || '', reason: 'missing id or unsafe document id' });
      continue;
    }
    if (seen.has(id)) {
      rows.push({ action: 'conflict', id, reason: 'duplicate id in the array — not written twice' });
      continue;
    }
    seen.add(id);
    const prev = existingById.get(id);
    if (!prev) {
      rows.push({ action: 'create', id, reason: 'no order doc yet' });
      continue;
    }
    const same = (prev.storeId || '') === (order.storeId || '')
      && (prev.openedAt || '') === (order.openedAt || '')
      && (prev.shiftLeaderId || '') === (order.shiftLeaderId || '')
      && prev.netAmount === order.netAmount;
    if (same) rows.push({ action: 'unchanged', id, reason: 'already matches' });
    else rows.push({ action: 'update', id, reason: 'array row differs' });
  }
  const summary = {
    total: rows.length,
    create: rows.filter(r => r.action === 'create').length,
    update: rows.filter(r => r.action === 'update').length,
    unchanged: rows.filter(r => r.action === 'unchanged').length,
    conflict: rows.filter(r => r.action === 'conflict').length,
  };
  return { rows, summary };
}
