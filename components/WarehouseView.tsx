import React, { useState, useEffect, useMemo } from 'react';
import { User, Store, WarehouseItem, WarehouseTransaction } from '../types';
import { db } from '../services/db';
import {
  Warehouse, Plus, ArrowRight, PackagePlus, FileDown, Loader2, X, Pencil
} from 'lucide-react';

interface WarehouseViewProps {
  currentUser: User;
  stores: Store[];
}

const STANDARD_CUPS: { name: string; unit: string }[] = [
  { name: '8oz Hot Cups', unit: 'case' },
  { name: '12oz Hot Cups', unit: 'case' },
  { name: '16oz Hot Cups', unit: 'case' },
  { name: '12oz Iced Cups', unit: 'case' },
  { name: '16oz Iced Cups', unit: 'case' },
  { name: '20oz Iced Cups', unit: 'case' },
  { name: '24oz Iced Cups', unit: 'case' },
];

function fmtMoney(n: number): string {
  return `$${n.toFixed(2)}`;
}

function csvField(v: string | number | undefined | null): string {
  const s = v === undefined || v === null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const WarehouseView: React.FC<WarehouseViewProps> = ({ currentUser, stores }) => {
  const [items, setItems] = useState<WarehouseItem[]>([]);
  const [transactions, setTransactions] = useState<WarehouseTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [receiving, setReceiving] = useState<WarehouseItem | null>(null);
  const [transferring, setTransferring] = useState<WarehouseItem | null>(null);
  const [editing, setEditing] = useState<WarehouseItem | null>(null);
  const [addingItem, setAddingItem] = useState(false);

  // Form state
  const [formQty, setFormQty] = useState('');
  const [formCost, setFormCost] = useState('');
  const [formStore, setFormStore] = useState(stores[0]?.id || '');
  const [formName, setFormName] = useState('');
  const [formUnit, setFormUnit] = useState('case');

  // Report filters
  const [reportStore, setReportStore] = useState<string>('all');
  const [reportStart, setReportStart] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [reportEnd, setReportEnd] = useState(() => new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [wItems, wTx] = await Promise.all([
          db.fetchWarehouseItems(),
          db.fetchWarehouseTransactions(),
        ]);
        setItems(wItems);
        setTransactions(wTx);
      } catch (e) {
        console.error('[Warehouse] Load failed:', e);
        setError('Failed to load warehouse data.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const activeItems = useMemo(() => items.filter(i => i.active), [items]);
  const totalValue = useMemo(
    () => activeItems.reduce((s, i) => s + i.quantity * i.costPerUnit, 0),
    [activeItems]
  );

  const closeModals = () => {
    setReceiving(null);
    setTransferring(null);
    setEditing(null);
    setAddingItem(false);
    setFormQty('');
    setFormCost('');
    setFormName('');
    setFormUnit('case');
    setError(null);
  };

  const recordTransaction = async (
    tx: Omit<WarehouseTransaction, 'id' | 'date' | 'byUserId' | 'byUserName'>,
    updatedItems: WarehouseItem[]
  ): Promise<boolean> => {
    const full: WarehouseTransaction = {
      ...tx,
      id: `wtx-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      date: new Date().toISOString(),
      byUserId: currentUser.id,
      byUserName: currentUser.name,
    };
    const nextLedger = await db.appendWarehouseTransaction(full);
    if (!nextLedger) {
      setError('Could not record the transaction. Please try again.');
      return false;
    }
    const ok = await db.pushWarehouseItems(updatedItems);
    if (!ok) {
      setError('Transaction recorded but stock update failed — refresh and verify quantities.');
    }
    setTransactions(nextLedger);
    setItems(updatedItems);
    return true;
  };

  const handleAddItem = async () => {
    if (!formName.trim()) return;
    setBusy(true);
    try {
      const item: WarehouseItem = {
        id: `wh-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: formName.trim(),
        unit: formUnit.trim() || 'case',
        quantity: 0,
        costPerUnit: parseFloat(formCost) || 0,
        active: true,
        createdAt: new Date().toISOString(),
      };
      const next = [...items, item];
      const ok = await db.pushWarehouseItems(next);
      if (ok) {
        setItems(next);
        closeModals();
      } else {
        setError('Failed to save item.');
      }
    } finally {
      setBusy(false);
    }
  };

  const handleQuickAddCups = async () => {
    setBusy(true);
    try {
      const now = new Date().toISOString();
      const existingNames = new Set(items.map(i => i.name.toLowerCase()));
      const newOnes: WarehouseItem[] = STANDARD_CUPS
        .filter(c => !existingNames.has(c.name.toLowerCase()))
        .map((c, idx) => ({
          id: `wh-cup-${Date.now()}-${idx}`,
          name: c.name,
          unit: c.unit,
          quantity: 0,
          costPerUnit: 0,
          active: true,
          createdAt: now,
        }));
      if (newOnes.length === 0) return;
      const next = [...items, ...newOnes];
      const ok = await db.pushWarehouseItems(next);
      if (ok) setItems(next);
    } finally {
      setBusy(false);
    }
  };

  const handleReceive = async () => {
    if (!receiving) return;
    const qty = parseFloat(formQty);
    const cost = parseFloat(formCost);
    if (!qty || qty <= 0 || isNaN(cost) || cost < 0) return;
    setBusy(true);
    try {
      const updatedItems = items.map(i =>
        i.id === receiving.id ? { ...i, quantity: i.quantity + qty, costPerUnit: cost } : i
      );
      const ok = await recordTransaction({
        itemId: receiving.id,
        itemName: receiving.name,
        unit: receiving.unit,
        type: 'RECEIVE',
        quantity: qty,
        costPerUnit: cost,
        totalCost: Math.round(qty * cost * 100) / 100,
      }, updatedItems);
      if (ok) closeModals();
    } finally {
      setBusy(false);
    }
  };

  const handleTransfer = async () => {
    if (!transferring) return;
    const qty = parseFloat(formQty);
    if (!qty || qty <= 0) return;
    if (qty > transferring.quantity) {
      setError(`Only ${transferring.quantity} ${transferring.unit}(s) on hand.`);
      return;
    }
    const store = stores.find(s => s.id === formStore);
    if (!store) return;
    setBusy(true);
    try {
      const updatedItems = items.map(i =>
        i.id === transferring.id ? { ...i, quantity: i.quantity - qty } : i
      );
      const ok = await recordTransaction({
        itemId: transferring.id,
        itemName: transferring.name,
        unit: transferring.unit,
        type: 'TRANSFER',
        quantity: qty,
        costPerUnit: transferring.costPerUnit,
        totalCost: Math.round(qty * transferring.costPerUnit * 100) / 100,
        storeId: store.id,
        storeName: store.name,
      }, updatedItems);
      if (ok) closeModals();
    } finally {
      setBusy(false);
    }
  };

  const handleEditSave = async () => {
    if (!editing) return;
    setBusy(true);
    try {
      const cost = parseFloat(formCost);
      const updatedItems = items.map(i =>
        i.id === editing.id
          ? { ...i, name: formName.trim() || i.name, unit: formUnit.trim() || i.unit, costPerUnit: isNaN(cost) ? i.costPerUnit : cost }
          : i
      );
      const ok = await db.pushWarehouseItems(updatedItems);
      if (ok) {
        setItems(updatedItems);
        closeModals();
      } else {
        setError('Failed to save changes.');
      }
    } finally {
      setBusy(false);
    }
  };

  // ── COGS Report ──
  const reportTransfers = useMemo(() => {
    const startISO = new Date(`${reportStart}T00:00:00`).toISOString();
    const endISO = new Date(`${reportEnd}T23:59:59.999`).toISOString();
    return transactions.filter(t =>
      t.type === 'TRANSFER' &&
      t.date >= startISO && t.date <= endISO &&
      (reportStore === 'all' || t.storeId === reportStore)
    );
  }, [transactions, reportStore, reportStart, reportEnd]);

  const reportTotal = useMemo(
    () => reportTransfers.reduce((s, t) => s + t.totalCost, 0),
    [reportTransfers]
  );

  const downloadReport = () => {
    const lines: string[] = [];
    lines.push('Boundaries Coffee — Warehouse COGS Report');
    lines.push(`Period,${reportStart} to ${reportEnd}`);
    lines.push(`Store,${reportStore === 'all' ? 'All Stores' : (stores.find(s => s.id === reportStore)?.name || reportStore)}`);
    lines.push(`Generated,${csvField(new Date().toLocaleString())}`);
    lines.push('');
    lines.push('Date,Item,Qty,Unit,Cost Per Unit,Total Cost,Store,Moved By');
    reportTransfers.forEach(t => {
      lines.push([
        csvField(new Date(t.date).toLocaleString()),
        csvField(t.itemName),
        t.quantity,
        csvField(t.unit),
        t.costPerUnit.toFixed(2),
        t.totalCost.toFixed(2),
        csvField(t.storeName || ''),
        csvField(t.byUserName),
      ].join(','));
    });
    lines.push('');
    lines.push(`TOTAL COGS,,,,,${reportTotal.toFixed(2)}`);

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `warehouse-cogs-${reportStart}-to-${reportEnd}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-neutral-400">
        <Loader2 className="animate-spin mr-2" size={20} /> Loading warehouse...
      </div>
    );
  }

  const inputCls = "w-full p-3 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:border-blue-500";
  const modalWrap = "fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4";
  const modalBox = "bg-white rounded-2xl p-6 w-full max-w-md space-y-4";

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-xs font-bold border border-red-100">{error}</div>
      )}

      {/* Warehouse Stock */}
      <section className="bg-white p-4 md:p-6 rounded-xl border border-neutral-100 shadow-sm">
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><Warehouse size={20} /></div>
          <div className="flex-1 min-w-[160px]">
            <h2 className="text-lg font-black text-[#0F2B3C] uppercase tracking-tight">Warehouse Stock</h2>
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
              On-hand value: {fmtMoney(totalValue)}
            </p>
          </div>
          <button
            onClick={() => { closeModals(); setAddingItem(true); }}
            className="px-4 py-2.5 bg-[#0F2B3C] text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 active:scale-95"
          >
            <Plus size={14} /> Add Item
          </button>
        </div>

        {activeItems.length === 0 ? (
          <div className="text-center py-10 space-y-4">
            <p className="text-neutral-400 font-bold text-sm">No warehouse items yet.</p>
            <button
              onClick={handleQuickAddCups}
              disabled={busy}
              className="px-5 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
            >
              Quick-Add Standard Cups (all sizes)
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[9px] font-black text-neutral-400 uppercase tracking-widest border-b border-neutral-100">
                  <th className="text-left py-2 pr-2">Item</th>
                  <th className="text-right py-2 px-2">On Hand</th>
                  <th className="text-right py-2 px-2">Cost/Unit</th>
                  <th className="text-right py-2 px-2">Value</th>
                  <th className="text-right py-2 pl-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {activeItems.map(item => (
                  <tr key={item.id} className="border-b border-neutral-50">
                    <td className="py-3 pr-2">
                      <span className="font-bold text-[#0F2B3C]">{item.name}</span>
                      <span className="text-neutral-400 text-xs ml-1">({item.unit}s)</span>
                    </td>
                    <td className={`text-right py-3 px-2 font-black tabular-nums ${item.quantity === 0 ? 'text-red-500' : 'text-[#0F2B3C]'}`}>
                      {item.quantity}
                    </td>
                    <td className="text-right py-3 px-2 tabular-nums text-neutral-600">{fmtMoney(item.costPerUnit)}</td>
                    <td className="text-right py-3 px-2 tabular-nums font-bold text-neutral-700">{fmtMoney(item.quantity * item.costPerUnit)}</td>
                    <td className="text-right py-3 pl-2">
                      <div className="flex justify-end gap-1.5">
                        <button
                          title="Receive delivery"
                          onClick={() => { closeModals(); setReceiving(item); setFormCost(item.costPerUnit ? String(item.costPerUnit) : ''); }}
                          className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100"
                        >
                          <PackagePlus size={14} />
                        </button>
                        <button
                          title="Transfer to store"
                          onClick={() => { closeModals(); setTransferring(item); }}
                          disabled={item.quantity <= 0}
                          className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 disabled:opacity-30"
                        >
                          <ArrowRight size={14} />
                        </button>
                        <button
                          title="Edit item"
                          onClick={() => { closeModals(); setEditing(item); setFormName(item.name); setFormUnit(item.unit); setFormCost(String(item.costPerUnit)); }}
                          className="p-2 bg-neutral-100 text-neutral-500 rounded-lg hover:bg-neutral-200"
                        >
                          <Pencil size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* COGS Report */}
      <section className="bg-white p-4 md:p-6 rounded-xl border border-neutral-100 shadow-sm">
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="p-2 bg-green-50 text-green-600 rounded-xl"><FileDown size={20} /></div>
          <div className="flex-1 min-w-[160px]">
            <h2 className="text-lg font-black text-[#0F2B3C] uppercase tracking-tight">COGS Report</h2>
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
              Transfers = expensed to store
            </p>
          </div>
          <button
            onClick={downloadReport}
            disabled={reportTransfers.length === 0}
            className="px-4 py-2.5 bg-[#0F2B3C] text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 disabled:opacity-40 active:scale-95"
          >
            <FileDown size={14} /> Download CSV
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <select value={reportStore} onChange={e => setReportStore(e.target.value)} className={inputCls}>
            <option value="all">All Stores</option>
            {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <input type="date" value={reportStart} onChange={e => setReportStart(e.target.value)} className={inputCls} />
          <input type="date" value={reportEnd} onChange={e => setReportEnd(e.target.value)} className={inputCls} />
        </div>

        <div className="flex items-center justify-between bg-neutral-50 rounded-xl p-4 mb-4">
          <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">
            {reportTransfers.length} transfer{reportTransfers.length !== 1 ? 's' : ''} in period
          </span>
          <span className="text-xl font-black text-[#0F2B3C]">{fmtMoney(reportTotal)}</span>
        </div>

        {reportTransfers.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[9px] font-black text-neutral-400 uppercase tracking-widest border-b border-neutral-100">
                  <th className="text-left py-2 pr-2">Date</th>
                  <th className="text-left py-2 px-2">Item</th>
                  <th className="text-right py-2 px-2">Qty</th>
                  <th className="text-right py-2 px-2">Cost</th>
                  <th className="text-left py-2 px-2">Store</th>
                  <th className="text-left py-2 pl-2">By</th>
                </tr>
              </thead>
              <tbody>
                {reportTransfers.map(t => (
                  <tr key={t.id} className="border-b border-neutral-50">
                    <td className="py-2 pr-2 text-neutral-500">{new Date(t.date).toLocaleDateString()}</td>
                    <td className="py-2 px-2 font-bold text-[#0F2B3C]">{t.itemName}</td>
                    <td className="py-2 px-2 text-right tabular-nums">{t.quantity}</td>
                    <td className="py-2 px-2 text-right tabular-nums font-bold">{fmtMoney(t.totalCost)}</td>
                    <td className="py-2 px-2">{t.storeName}</td>
                    <td className="py-2 pl-2 text-neutral-500">{t.byUserName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Recent Activity */}
      <section className="bg-white p-4 md:p-6 rounded-xl border border-neutral-100 shadow-sm">
        <h2 className="text-sm font-black text-[#0F2B3C] uppercase tracking-tight mb-3">Recent Activity</h2>
        {transactions.length === 0 ? (
          <p className="text-neutral-400 text-xs font-medium">No warehouse activity yet.</p>
        ) : (
          <div className="space-y-2">
            {transactions.slice(0, 15).map(t => (
              <div key={t.id} className="flex items-center gap-3 text-xs py-2 border-b border-neutral-50">
                <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${
                  t.type === 'RECEIVE' ? 'bg-green-50 text-green-600' :
                  t.type === 'TRANSFER' ? 'bg-blue-50 text-blue-600' : 'bg-neutral-100 text-neutral-500'
                }`}>{t.type}</span>
                <span className="font-bold text-[#0F2B3C] flex-1 min-w-0 truncate">
                  {t.quantity} {t.unit}(s) {t.itemName}
                  {t.type === 'TRANSFER' && t.storeName ? ` → ${t.storeName}` : ''}
                </span>
                <span className="tabular-nums font-bold text-neutral-600">{fmtMoney(t.totalCost)}</span>
                <span className="text-neutral-400 hidden sm:inline">{new Date(t.date).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Modals ── */}
      {addingItem && (
        <div className={modalWrap} onClick={closeModals}>
          <div className={modalBox} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-black text-[#0F2B3C] uppercase tracking-tight">Add Warehouse Item</h3>
              <button onClick={closeModals}><X size={18} className="text-neutral-400" /></button>
            </div>
            <input type="text" placeholder="Item name (e.g. 12oz Hot Cups)" value={formName} onChange={e => setFormName(e.target.value)} className={inputCls} autoFocus />
            <input type="text" placeholder="Unit (e.g. case)" value={formUnit} onChange={e => setFormUnit(e.target.value)} className={inputCls} />
            <input type="number" step="0.01" min="0" placeholder="Cost per unit ($)" value={formCost} onChange={e => setFormCost(e.target.value)} className={inputCls} />
            <button onClick={handleAddItem} disabled={busy || !formName.trim()} className="w-full py-3 bg-[#0F2B3C] text-white rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-50">
              {busy ? 'Saving...' : 'Add Item'}
            </button>
          </div>
        </div>
      )}

      {receiving && (
        <div className={modalWrap} onClick={closeModals}>
          <div className={modalBox} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-black text-[#0F2B3C] uppercase tracking-tight">Receive — {receiving.name}</h3>
              <button onClick={closeModals}><X size={18} className="text-neutral-400" /></button>
            </div>
            <p className="text-xs text-neutral-400 font-medium">Currently on hand: {receiving.quantity} {receiving.unit}(s)</p>
            <input type="number" step="1" min="0" placeholder={`Quantity received (${receiving.unit}s)`} value={formQty} onChange={e => setFormQty(e.target.value)} className={inputCls} autoFocus />
            <input type="number" step="0.01" min="0" placeholder="Cost per unit ($)" value={formCost} onChange={e => setFormCost(e.target.value)} className={inputCls} />
            {formQty && formCost && (
              <p className="text-xs font-bold text-neutral-500">Total: {fmtMoney((parseFloat(formQty) || 0) * (parseFloat(formCost) || 0))}</p>
            )}
            <button onClick={handleReceive} disabled={busy || !formQty || !formCost} className="w-full py-3 bg-green-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-50">
              {busy ? 'Saving...' : 'Receive Into Warehouse'}
            </button>
          </div>
        </div>
      )}

      {transferring && (
        <div className={modalWrap} onClick={closeModals}>
          <div className={modalBox} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-black text-[#0F2B3C] uppercase tracking-tight">Transfer — {transferring.name}</h3>
              <button onClick={closeModals}><X size={18} className="text-neutral-400" /></button>
            </div>
            <p className="text-xs text-neutral-400 font-medium">
              On hand: {transferring.quantity} {transferring.unit}(s) at {fmtMoney(transferring.costPerUnit)} each
            </p>
            <select value={formStore} onChange={e => setFormStore(e.target.value)} className={inputCls}>
              {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <input type="number" step="1" min="1" max={transferring.quantity} placeholder={`Quantity (${transferring.unit}s)`} value={formQty} onChange={e => setFormQty(e.target.value)} className={inputCls} autoFocus />
            {formQty && (
              <p className="text-xs font-bold text-neutral-500">
                COGS to {stores.find(s => s.id === formStore)?.name}: {fmtMoney((parseFloat(formQty) || 0) * transferring.costPerUnit)}
              </p>
            )}
            <button onClick={handleTransfer} disabled={busy || !formQty} className="w-full py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-50">
              {busy ? 'Saving...' : 'Transfer To Store'}
            </button>
          </div>
        </div>
      )}

      {editing && (
        <div className={modalWrap} onClick={closeModals}>
          <div className={modalBox} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-black text-[#0F2B3C] uppercase tracking-tight">Edit — {editing.name}</h3>
              <button onClick={closeModals}><X size={18} className="text-neutral-400" /></button>
            </div>
            <input type="text" placeholder="Item name" value={formName} onChange={e => setFormName(e.target.value)} className={inputCls} />
            <input type="text" placeholder="Unit" value={formUnit} onChange={e => setFormUnit(e.target.value)} className={inputCls} />
            <input type="number" step="0.01" min="0" placeholder="Cost per unit ($)" value={formCost} onChange={e => setFormCost(e.target.value)} className={inputCls} />
            <p className="text-[10px] text-neutral-400 font-medium">
              Cost changes apply to FUTURE transfers only — past transactions keep the cost they were recorded at.
            </p>
            <button onClick={handleEditSave} disabled={busy} className="w-full py-3 bg-[#0F2B3C] text-white rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-50">
              {busy ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WarehouseView;
