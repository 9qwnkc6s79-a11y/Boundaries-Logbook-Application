import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ChevronDown, ClipboardList, RefreshCw } from 'lucide-react';
import { db } from '../services/db';
import { FoodClosingWasteEntry, Store } from '../types';
import { buildWasteHistory, chicagoToday, wasteHistorySummary, WasteHistoryNight } from '../utils/wasteHistory';

interface WasteHistoryPanelProps {
  stores: Pick<Store, 'id' | 'name'>[];
  currentStoreId?: string;
}

type RangeDays = 7 | 14;

function formatNight(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12)).toLocaleDateString('en-US', {
    timeZone: 'UTC',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function StateBadge({ night }: { night: WasteHistoryNight }) {
  if (night.state === 'logged') {
    return (
      <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-700 border border-emerald-200">
        Logged
      </span>
    );
  }
  if (night.state === 'pending') {
    return (
      <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest bg-neutral-50 text-neutral-500 border border-neutral-200">
        Tonight
      </span>
    );
  }
  return (
    <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest bg-red-50 text-red-700 border border-red-200 inline-flex items-center gap-1">
      <AlertTriangle size={10} /> Not logged
    </span>
  );
}

const StoreWasteTable: React.FC<{ storeName: string; nights: WasteHistoryNight[] }> = ({ storeName, nights }) => {
  const [open, setOpen] = useState<string | null>(null);
  const summary = wasteHistorySummary(nights);
  return (
    <div className="border border-neutral-100 rounded-xl overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-neutral-50 border-b border-neutral-100">
        <h3 className="text-sm font-black text-[#0F2B3C] uppercase tracking-tight">{storeName}</h3>
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest">
          <span className={summary.notLogged.length ? 'text-red-600' : 'text-emerald-700'}>
            {summary.logged}/{summary.nights} nights logged
          </span>
          <span className="text-neutral-500">Waste {summary.totalWaste}</span>
          <span className="text-neutral-500">Leftover {summary.totalLeftover}</span>
        </div>
      </div>
      <table className="w-full text-left text-xs">
        <thead className="text-[9px] font-black uppercase tracking-widest text-neutral-400">
          <tr>
            <th className="px-4 py-2">Night</th>
            <th className="px-4 py-2">Status</th>
            <th className="px-4 py-2 text-right">Items</th>
            <th className="px-4 py-2 text-right">Leftover</th>
            <th className="px-4 py-2 text-right">Waste</th>
            <th className="px-4 py-2 hidden sm:table-cell">Logged by</th>
          </tr>
        </thead>
        <tbody>
          {nights.map(night => {
            const expanded = open === night.date;
            const canExpand = night.items.length > 0;
            return (
              <React.Fragment key={night.date}>
                <tr
                  className={`border-t border-neutral-100 ${night.state === 'not_logged' ? 'bg-red-50/40' : ''} ${canExpand ? 'cursor-pointer hover:bg-neutral-50' : ''}`}
                  onClick={() => canExpand && setOpen(expanded ? null : night.date)}
                >
                  <td className="px-4 py-2 font-bold text-[#0F2B3C] whitespace-nowrap">
                    {canExpand && (
                      <ChevronDown size={12} className={`inline mr-1 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                    )}
                    {formatNight(night.date)}
                  </td>
                  <td className="px-4 py-2"><StateBadge night={night} /></td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {night.items.length || '—'}
                    {night.blanks > 0 && (
                      <span className="ml-1 text-amber-600 font-bold" title="Rows saved with a blank number">({night.blanks} blank)</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">{night.items.length ? night.totalLeftover : '—'}</td>
                  <td className="px-4 py-2 text-right tabular-nums font-bold">{night.items.length ? night.totalWaste : '—'}</td>
                  <td className="px-4 py-2 hidden sm:table-cell text-neutral-500">{night.loggedBy.join(', ') || '—'}</td>
                </tr>
                {expanded && (
                  <tr className="bg-neutral-50/60">
                    <td colSpan={6} className="px-6 py-2">
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
                        {night.items.map(item => (
                          <li key={item.itemGuid} className="flex justify-between gap-3">
                            <span className="text-neutral-600 truncate">{item.name}</span>
                            <span className="tabular-nums text-neutral-500 whitespace-nowrap">
                              left {item.leftover ?? '—'} · waste <b className="text-[#0F2B3C]">{item.waste ?? '—'}</b>
                            </span>
                          </li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

/** Read-only: last 7/14 business nights of closing leftover/waste per store. */
const WasteHistoryPanel: React.FC<WasteHistoryPanelProps> = ({ stores, currentStoreId }) => {
  const [days, setDays] = useState<RangeDays>(7);
  const [rowsByStore, setRowsByStore] = useState<Record<string, FoodClosingWasteEntry[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const orderedStores = useMemo(() => {
    const list = stores.filter(s => s?.id);
    return [...list].sort((a, b) => (a.id === currentStoreId ? -1 : b.id === currentStoreId ? 1 : 0));
  }, [stores, currentStoreId]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const pairs = await Promise.all(
        orderedStores.map(async s => [s.id, await db.fetchFoodClosingWaste(s.id)] as const),
      );
      setRowsByStore(Object.fromEntries(pairs));
    } catch (err) {
      console.error('[WasteHistory] load failed', err);
      setError('Could not load waste history.');
    } finally {
      setLoading(false);
    }
  }, [orderedStores]);

  useEffect(() => {
    load();
  }, [load]);

  const today = chicagoToday();

  return (
    <section className="bg-white p-6 rounded-xl border border-neutral-100 shadow-sm space-y-4 mt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-50 text-amber-700 rounded-xl"><ClipboardList size={20} /></div>
          <div>
            <h2 className="text-xl font-black text-[#0F2B3C] uppercase tracking-tight">Waste History</h2>
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
              Closing leftover / waste by night · Central Time
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-neutral-100 p-1 rounded-xl border border-neutral-200">
            {([7, 14] as RangeDays[]).map(n => (
              <button
                key={n}
                onClick={() => setDays(n)}
                className={`px-3 py-1 text-[10px] font-black rounded-lg tracking-widest ${days === n ? 'bg-[#0F2B3C] text-white' : 'text-neutral-500'}`}
              >
                {n} DAYS
              </button>
            ))}
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="p-2 rounded-lg border border-neutral-200 text-neutral-500 hover:text-[#0F2B3C] disabled:opacity-50"
            aria-label="Refresh waste history"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {error && <p className="text-xs font-bold text-red-600">{error}</p>}
      {!error && orderedStores.length === 0 && <p className="text-xs text-neutral-500">No stores.</p>}

      <div className="space-y-4">
        {orderedStores.filter(store => rowsByStore[store.id]).map(store => (
          <StoreWasteTable
            key={store.id}
            storeName={store.name || store.id}
            nights={buildWasteHistory(rowsByStore[store.id], { days, today })}
          />
        ))}
      </div>
      {loading && Object.keys(rowsByStore).length === 0 && (
        <p className="text-xs text-neutral-400">Loading…</p>
      )}
    </section>
  );
};

export default WasteHistoryPanel;
