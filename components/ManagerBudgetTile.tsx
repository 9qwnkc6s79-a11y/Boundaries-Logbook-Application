import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, DollarSign, RefreshCw, Target } from 'lucide-react';
import { toastAPI } from '../services/toast';
import { ManagerBudget, ManagerStoreBudget } from '../types';

function money(n: number | null): string {
  if (n === null) return '—';
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

function pct(n: number | null): string {
  if (n === null) return '—';
  return `${n.toFixed(1)}%`;
}

function StoreRow({ store, target }: { store: ManagerStoreBudget; target: number }) {
  const laborReady = store.laborStatus === 'ok' && store.mtdLaborPercent !== null;
  const laborTone = !laborReady
    ? 'text-neutral-500'
    : store.laborVsTarget === 'under'
      ? 'text-green-600'
      : 'text-red-600';
  const badgeTone = !laborReady
    ? 'bg-neutral-50 text-neutral-500 border-neutral-100'
    : store.laborVsTarget === 'under'
      ? 'bg-green-50 text-green-700 border-green-100'
      : 'bg-red-50 text-red-700 border-red-100';

  const laborDollarsLabel =
    store.laborStatus === 'incomplete'
      ? 'Incomplete'
      : laborReady
        ? money(store.mtdLaborDollars)
        : 'Unavailable';

  const salesFailed = store.todaySales === null && store.mtdSales === null;
  const laborFailed = store.laborStatus === 'blocked' || store.laborStatus === 'unavailable';

  return (
    <div className="rounded-xl border border-neutral-100 bg-neutral-50/40 p-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h3 className="text-sm font-black text-[#0F2B3C] uppercase tracking-tight">{store.name}</h3>
        <span className={`inline-flex px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-full border ${badgeTone}`}>
          {target}% {laborReady ? (store.laborVsTarget === 'under' ? '· under' : '· over') : '· waiting'}
        </span>
      </div>

      {salesFailed && (
        <div className="mb-3 flex items-start gap-2 p-2.5 rounded-xl bg-red-50 border border-red-100">
          <AlertTriangle size={14} className="text-red-500 shrink-0 mt-0.5" />
          <p className="text-xs text-red-700 font-medium">Sales could not be loaded for this store. Not shown as $0.</p>
        </div>
      )}

      {laborFailed && (
        <div className="mb-3 flex items-start gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-100">
          <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 font-medium">{store.laborMessage || 'Labor cost failed for this store.'}</p>
        </div>
      )}

      {store.laborStatus === 'incomplete' && (
        <div className="mb-3 flex items-start gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-100">
          <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 font-medium">
            {store.laborMessage || 'Incomplete — some punches are missing a wage. Not shown as $0 labor.'}
          </p>
        </div>
      )}

      <dl className="space-y-2">
        <div className="flex justify-between gap-4">
          <dt className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Today sales</dt>
          <dd className="text-sm font-black text-[#0F2B3C]">{money(store.todaySales)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-[10px] font-black uppercase tracking-widest text-neutral-400">MTD sales</dt>
          <dd className="text-sm font-black text-[#0F2B3C]">{money(store.mtdSales)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-[10px] font-black uppercase tracking-widest text-neutral-400">MTD labor $</dt>
          <dd className={`text-sm font-black ${laborTone}`}>{laborDollarsLabel}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-[10px] font-black uppercase tracking-widest text-neutral-400">MTD labor %</dt>
          <dd className={`text-sm font-black ${laborTone}`}>{pct(store.mtdLaborPercent)}</dd>
        </div>
      </dl>
    </div>
  );
}

const ManagerBudgetTile: React.FC = () => {
  const [budget, setBudget] = useState<ManagerBudget | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const next = await toastAPI.getManagerBudget();
      setBudget(next);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load manager budget');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const target = budget?.laborTargetPercent ?? 26;

  return (
    <section className="bg-white p-4 md:p-6 rounded-xl border border-neutral-100 shadow-sm">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-[#0F2B3C] text-white rounded-xl shrink-0">
            <Target size={16} />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-[#0F2B3C] uppercase tracking-tight">
              Sales &amp; labor vs {target}%
            </h2>
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-0.5">
              Toast Sales Summary (gross) · America/Chicago · both stores
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="p-2 rounded-xl bg-neutral-50 text-neutral-500 hover:bg-neutral-100 disabled:opacity-50"
          aria-label="Refresh sales and labor budget"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {loading && !budget && (
        <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest">
          Loading today and month-to-date from Toast…
        </p>
      )}

      {error && (
        <div className="mb-4 flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-100">
          <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-black text-red-700 uppercase tracking-widest">Budget failed</p>
            <p className="text-xs text-red-600 mt-1 font-medium">{error}</p>
            <p className="text-[10px] text-red-500 mt-1 font-bold uppercase tracking-widest">
              Sales and labor are not invented as $0.
            </p>
          </div>
        </div>
      )}

      {budget && (
        <>
          {!budget.salesComplete && budget.salesNote && (
            <div className="mb-4 flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-100">
              <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 font-medium">{budget.salesNote}</p>
            </div>
          )}

          {budget.labor.status === 'ok' && budget.labor.source === 'timeEntries.hourlyWage' && (
            <div className="mb-4 flex items-start gap-2 p-3 rounded-xl bg-blue-50 border border-blue-100">
              <DollarSign size={16} className="text-blue-600 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-800 font-medium">
                Analytics labor reporting is blocked. Showing clocked time × Toast hourlyWage.
                OT premium is not in that API (base rate only).
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <StoreRow store={budget.littleElm} target={target} />
            <StoreRow store={budget.prosper} target={target} />
          </div>
        </>
      )}
    </section>
  );
};

export default ManagerBudgetTile;
