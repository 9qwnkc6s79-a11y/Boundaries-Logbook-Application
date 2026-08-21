import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, RefreshCw, UtensilsCrossed } from 'lucide-react';
import { db } from '../services/db';
import { toastAPI } from '../services/toast';
import { Food86Event, FoodClosingWasteEntry, FoodSkuDay, FoodSoldResponse, User } from '../types';

function locationForStore(storeId: string): string {
  return storeId === 'store-prosper' ? 'prosper' : 'littleelm';
}

function chicagoNowDate(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
}

function formatChicagoTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleTimeString('en-US', {
    timeZone: 'America/Chicago',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function qtyLabel(item: FoodSkuDay): string {
  if (item.status === 'OUT_OF_STOCK') return '0';
  if (item.quantity === null || item.quantity === undefined) return '—';
  return String(item.quantity);
}

interface Food86PanelProps {
  storeId: string;
  storeName?: string;
  user?: User;
  mode: 'report' | 'closing';
  readOnly?: boolean;
}

const Food86Panel: React.FC<Food86PanelProps> = ({ storeId, storeName, user, mode, readOnly }) => {
  const [payload, setPayload] = useState<FoodSoldResponse | null>(null);
  const [wasteByGuid, setWasteByGuid] = useState<Record<string, FoodClosingWasteEntry>>({});
  const [loading, setLoading] = useState(true);
  const [savingGuid, setSavingGuid] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, { leftover: string; waste: string }>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const location = locationForStore(storeId);
    const businessDate = chicagoNowDate();

    const [sold, events, wasteRows] = await Promise.all([
      toastAPI.getFoodSold(location, businessDate).catch((err): FoodSoldResponse => ({
        ok: false,
        location,
        storeId,
        businessDate,
        stockScopeOk: false,
        error: err?.message || 'Failed to load Toast food stock',
        items: [],
        excludedDrinkCount: 0,
      })),
      db.fetchFood86Events(storeId).catch((): Food86Event[] => []),
      db.fetchFoodClosingWaste(storeId, businessDate).catch((): FoodClosingWasteEntry[] => []),
    ]);

    const pollEvents = sold.items
      .filter(item => item.status === 'OUT_OF_STOCK')
      .map(item => ({
        storeId,
        location,
        businessDate: sold.businessDate || businessDate,
        itemGuid: item.itemGuid,
        itemName: item.name,
        soldOutAt: item.soldOutAt || new Date().toISOString(),
        source: 'poll' as const,
      }));

    let mergedEvents = events;
    if (pollEvents.length > 0) {
      const recorded = await db.recordFood86Events(pollEvents);
      if (recorded) mergedEvents = recorded;
    }

    const eventMap = new Map<string, Food86Event>(
      mergedEvents.map(e => [`${e.businessDate}:${e.itemGuid}`, e])
    );
    const mergedItems = sold.items.map(item => {
      const ev = eventMap.get(`${sold.businessDate}:${item.itemGuid}`);
      if (!ev) return item;
      if (!item.soldOutAt || ev.soldOutAt < item.soldOutAt) {
        return { ...item, soldOutAt: ev.soldOutAt };
      }
      return item;
    });

    setPayload({ ...sold, items: mergedItems });

    const wasteMap: Record<string, FoodClosingWasteEntry> = {};
    const nextDraft: Record<string, { leftover: string; waste: string }> = {};
    wasteRows.forEach(row => {
      wasteMap[row.itemGuid] = row;
      nextDraft[row.itemGuid] = {
        leftover: row.leftoverQty === null || row.leftoverQty === undefined ? '' : String(row.leftoverQty),
        waste: row.wasteQty === null || row.wasteQty === undefined ? '' : String(row.wasteQty),
      };
    });
    setWasteByGuid(wasteMap);
    setDraft(nextDraft);
    setLoading(false);
  }, [storeId]);

  useEffect(() => {
    load();
  }, [load]);

  const rows = useMemo(() => {
    const items = payload?.items || [];
    return items.filter(item => item.includeInFoodView);
  }, [payload]);

  const persistWaste = async (item: FoodSkuDay, leftover: string, waste: string) => {
    if (!user || readOnly) return;
    setSavingGuid(item.itemGuid);
    const parse = (raw: string): number | null => {
      const trimmed = raw.trim();
      if (trimmed === '') return null;
      const n = Number(trimmed);
      return Number.isFinite(n) ? n : null;
    };
    const entry: FoodClosingWasteEntry = {
      storeId,
      businessDate: payload?.businessDate || chicagoNowDate(),
      itemGuid: item.itemGuid,
      itemName: item.name,
      leftoverQty: parse(leftover),
      wasteQty: parse(waste),
      updatedAt: new Date().toISOString(),
      updatedBy: user.id,
      updatedByName: user.name,
    };
    const next = await db.upsertFoodClosingWaste(entry);
    if (next) {
      const match = next.find(r => r.itemGuid === item.itemGuid && r.businessDate === entry.businessDate);
      if (match) setWasteByGuid(prev => ({ ...prev, [item.itemGuid]: match }));
    }
    setSavingGuid(null);
  };

  const scopeMissing = payload && !payload.stockScopeOk;
  const title = mode === 'closing' ? 'Food leftover & waste' : 'Food 86 / last sold';
  const subtitle = mode === 'closing'
    ? 'At open GMs enter starting qty in Toast. When it hits 0, Toast 86s. At close enter leftover qty and waste qty here — Toast food SKUs only, not the syrup catalog.'
    : `${storeName || 'This store'} · today (America/Chicago). 86 time and last-sold time are both shown. Leftover and waste come from the closing food list.`;

  return (
    <section className={`rounded-xl border shadow-sm ${mode === 'closing' ? 'border-amber-100 bg-amber-50/20' : 'border-neutral-100 bg-white'} p-4 sm:p-6`}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-[#0F2B3C] text-white rounded-xl shrink-0">
            <UtensilsCrossed size={16} />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-[#0F2B3C] uppercase tracking-tight">{title}</h2>
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-0.5">{subtitle}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="p-2 rounded-xl bg-neutral-50 text-neutral-500 hover:bg-neutral-100 disabled:opacity-50"
          aria-label="Refresh food stock"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {scopeMissing && (
        <div className="mb-4 flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-100">
          <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-black text-red-700 uppercase tracking-widest">Toast stock:read missing</p>
            <p className="text-xs text-red-600 mt-1 font-medium">
              {payload?.error || 'The machine client was rejected by GET /stock/v1/inventory.'}
              {payload?.hint ? ` ${payload.hint}` : ''}
            </p>
            <p className="text-[10px] text-red-500 mt-1 font-bold uppercase tracking-widest">No quantities invented.</p>
          </div>
        </div>
      )}

      {!scopeMissing && payload?.error && !payload.ok && (
        <div className="mb-4 flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-100">
          <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 font-medium">{payload.error}</p>
        </div>
      )}

      {loading && !payload && (
        <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest">Loading Toast food stock…</p>
      )}

      {!loading && !scopeMissing && rows.length === 0 && payload?.ok && (
        <p className="text-xs text-neutral-400 font-medium">
          No QUANTITY / OUT_OF_STOCK food items from Toast right now. GMs only see items they qty-track at open.
        </p>
      )}

      {rows.length > 0 && (
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-left min-w-[640px]">
            <thead>
              <tr className="text-[9px] font-black uppercase tracking-widest text-neutral-400 border-b border-neutral-100">
                <th className="py-2 pr-3">Name</th>
                <th className="py-2 pr-3">Remaining</th>
                <th className="py-2 pr-3">86 at</th>
                <th className="py-2 pr-3">Last sold at</th>
                <th className="py-2 pr-3">{mode === 'closing' ? 'Leftover qty' : 'Leftover'}</th>
                <th className="py-2">{mode === 'closing' ? 'Waste qty' : 'Waste'}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(item => {
                const saved = wasteByGuid[item.itemGuid];
                const leftover = draft[item.itemGuid]?.leftover ?? (saved?.leftoverQty ?? '');
                const waste = draft[item.itemGuid]?.waste ?? (saved?.wasteQty ?? '');
                const editable = mode === 'closing' && !readOnly && !!user;
                return (
                  <tr key={item.itemGuid} className="border-b border-neutral-50 last:border-0">
                    <td className="py-3 pr-3">
                      <div className="text-sm font-bold text-[#0F2B3C]">{item.name}</div>
                      <div className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">
                        {item.menuGroup || item.menuName || item.categoryHint}
                        {item.soldCount > 0 ? ` · ${item.soldCount} sold` : ''}
                      </div>
                    </td>
                    <td className="py-3 pr-3">
                      <span className={`text-sm font-black ${item.status === 'OUT_OF_STOCK' ? 'text-red-600' : 'text-[#0F2B3C]'}`}>
                        {qtyLabel(item)}
                      </span>
                    </td>
                    <td className="py-3 pr-3 text-sm font-bold text-neutral-700">{formatChicagoTime(item.soldOutAt)}</td>
                    <td className="py-3 pr-3 text-sm font-bold text-neutral-700">{formatChicagoTime(item.lastSoldAt)}</td>
                    <td className="py-3 pr-3">
                      {editable ? (
                        <input
                          type="number"
                          inputMode="decimal"
                          min="0"
                          step="1"
                          value={typeof leftover === 'number' ? String(leftover) : leftover}
                          onChange={e => setDraft(prev => ({
                            ...prev,
                            [item.itemGuid]: { leftover: e.target.value, waste: String(draft[item.itemGuid]?.waste ?? waste ?? '') },
                          }))}
                          onBlur={e => persistWaste(item, e.target.value, String(draft[item.itemGuid]?.waste ?? waste ?? ''))}
                          className="w-20 border border-neutral-100 rounded-lg px-2 py-1.5 text-sm font-bold bg-neutral-50 focus:bg-white outline-none"
                          placeholder="—"
                        />
                      ) : (
                        <span className="text-sm font-bold text-neutral-700">
                          {saved?.leftoverQty === null || saved?.leftoverQty === undefined ? '—' : saved.leftoverQty}
                        </span>
                      )}
                    </td>
                    <td className="py-3">
                      {editable ? (
                        <input
                          type="number"
                          inputMode="decimal"
                          min="0"
                          step="1"
                          value={typeof waste === 'number' ? String(waste) : waste}
                          onChange={e => setDraft(prev => ({
                            ...prev,
                            [item.itemGuid]: { leftover: String(draft[item.itemGuid]?.leftover ?? leftover ?? ''), waste: e.target.value },
                          }))}
                          onBlur={e => persistWaste(item, String(draft[item.itemGuid]?.leftover ?? leftover ?? ''), e.target.value)}
                          className="w-20 border border-neutral-100 rounded-lg px-2 py-1.5 text-sm font-bold bg-neutral-50 focus:bg-white outline-none"
                          placeholder="—"
                        />
                      ) : (
                        <span className="text-sm font-bold text-neutral-700">
                          {saved?.wasteQty === null || saved?.wasteQty === undefined ? '—' : saved.wasteQty}
                          {savingGuid === item.itemGuid ? <span className="ml-1 text-[9px] text-neutral-400">saving</span> : null}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {(payload?.excludedDrinkCount || 0) > 0 && (
        <p className="mt-3 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
          {payload?.excludedDrinkCount} likely-drink item{payload?.excludedDrinkCount === 1 ? '' : 's'} hidden (syrups / espresso). Unknown items stay listed.
        </p>
      )}
    </section>
  );
};

export default Food86Panel;
