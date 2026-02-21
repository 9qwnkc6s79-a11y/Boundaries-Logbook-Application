import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { User, UserRole, Store, InventoryItem, InventoryCount } from '../types';
import {
  Package, ChevronDown, ChevronRight, Minus, Plus, Send, Search,
  AlertTriangle, CheckCircle, ShoppingCart, Edit3, Save, X, Trash2,
  Clock, BarChart3, Filter, ChevronUp, PlusCircle, Archive
} from 'lucide-react';

interface InventoryViewProps {
  currentUser: User;
  stores: Store[];
  currentStoreId: string;
  inventoryItems: InventoryItem[];
  inventoryCounts: InventoryCount[];
  onSubmitCount: (count: InventoryCount) => Promise<void>;
  onUpdateItems: (items: InventoryItem[]) => Promise<void>;
}

const STORAGE_LOCATIONS = ['Walk-In Cooler', 'Dry Storage', 'Back Stock', 'Bar/Counter'];


const InventoryView: React.FC<InventoryViewProps> = ({
  currentUser, stores, currentStoreId, inventoryItems, inventoryCounts,
  onSubmitCount, onUpdateItems
}) => {
  const isManager = currentUser.role === UserRole.MANAGER || currentUser.role === UserRole.ADMIN;
  const [managerTab, setManagerTab] = useState<'count' | 'orders' | 'pars' | 'history'>('count');
  const [countDate, setCountDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['Coffee']));
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showBelowParOnly, setShowBelowParOnly] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [addingItem, setAddingItem] = useState(false);
  const [newItem, setNewItem] = useState<Partial<InventoryItem>>({
    name: '', category: '', storageLocation: 'Dry Storage', vendor: '',
    par: 0, unit: '', active: true, brand: ''
  });

  const activeItems = useMemo(() =>
    inventoryItems.filter(i => i.active).sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999)),
    [inventoryItems]
  );

  const storeCounts = useMemo(() =>
    inventoryCounts.filter(c => c.storeId === currentStoreId).sort((a, b) => b.date.localeCompare(a.date)),
    [inventoryCounts, currentStoreId]
  );

  const latestCount = storeCounts[0];

  // Pre-populate counts from latest count as reference
  const lastCountValues = useMemo(() => latestCount?.counts || {}, [latestCount]);

  // Group items by category for the count form
  const itemsByCategory = useMemo(() => {
    const map: Record<string, InventoryItem[]> = {};
    for (const item of activeItems) {
      if (!map[item.category]) map[item.category] = [];
      map[item.category].push(item);
    }
    return map;
  }, [activeItems]);

  // Ordered category list (preserving seed order via first item's sortOrder)
  const categoryOrder = useMemo(() => {
    return Object.keys(itemsByCategory).sort((a, b) => {
      const aFirst = itemsByCategory[a][0]?.sortOrder ?? 999;
      const bFirst = itemsByCategory[b][0]?.sortOrder ?? 999;
      return aFirst - bFirst;
    });
  }, [itemsByCategory]);

  // Vendors list
  const vendors = useMemo(() => {
    const set = new Set(activeItems.map(i => i.vendor));
    return Array.from(set).sort();
  }, [activeItems]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set(activeItems.map(i => i.category));
    return Array.from(set).sort();
  }, [activeItems]);

  const toggleSection = (key: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const updateCount = useCallback((itemId: string, value: number) => {
    setCounts(prev => ({ ...prev, [itemId]: Math.max(0, value) }));
  }, []);

  const handleSubmitCount = async () => {
    if (Object.keys(counts).length === 0) return;
    setSubmitting(true);
    try {
      const count: InventoryCount = {
        id: `count-${currentStoreId}-${countDate}-${Date.now()}`,
        storeId: currentStoreId,
        date: countDate,
        submittedBy: currentUser.id,
        submittedByName: currentUser.name,
        submittedAt: new Date().toISOString(),
        counts: { ...counts }
      };
      await onSubmitCount(count);
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  // Order report data
  const orderReport = useMemo(() => {
    const latestCounts = latestCount?.counts || {};
    return activeItems.map(item => {
      const currentCount = latestCounts[item.id] ?? null;
      const par = item.par ?? 0;
      const orderQty = currentCount !== null ? Math.max(0, par - currentCount) : null;
      return { item, currentCount, par, orderQty };
    }).sort((a, b) => {
      // Below par items first
      const aBelow = a.orderQty !== null && a.orderQty > 0;
      const bBelow = b.orderQty !== null && b.orderQty > 0;
      if (aBelow && !bBelow) return -1;
      if (!aBelow && bBelow) return 1;
      return (a.item.sortOrder ?? 999) - (b.item.sortOrder ?? 999);
    });
  }, [activeItems, latestCount, currentStoreId]);

  type OrderEntry = { item: InventoryItem; currentCount: number | null; par: number; orderQty: number | null };

  // Group by vendor for order view
  const ordersByVendor = useMemo(() => {
    const map: Record<string, OrderEntry[]> = {};
    for (const entry of orderReport) {
      if (showBelowParOnly && (entry.orderQty === null || entry.orderQty <= 0)) continue;
      const vendor = entry.item.vendor;
      if (!map[vendor]) map[vendor] = [];
      map[vendor].push(entry);
    }
    return map;
  }, [orderReport, showBelowParOnly]);

  // Vendor summary cards
  const vendorSummary = useMemo(() => {
    const summary: { vendor: string; itemsToOrder: number; totalItems: number }[] = [];
    const vendorMap: Record<string, { toOrder: number; total: number }> = {};
    for (const entry of orderReport) {
      const v = entry.item.vendor;
      if (!vendorMap[v]) vendorMap[v] = { toOrder: 0, total: 0 };
      vendorMap[v].total++;
      if (entry.orderQty !== null && entry.orderQty > 0) vendorMap[v].toOrder++;
    }
    for (const [vendor, data] of Object.entries(vendorMap)) {
      if (data.toOrder > 0) {
        summary.push({ vendor, itemsToOrder: data.toOrder, totalItems: data.total });
      }
    }
    return summary.sort((a, b) => b.itemsToOrder - a.itemsToOrder);
  }, [orderReport]);

  const handleSaveItem = async (item: InventoryItem) => {
    const updated = inventoryItems.map(i => i.id === item.id ? item : i);
    await onUpdateItems(updated);
    setEditingItem(null);
  };

  const handleAddNewItem = async () => {
    if (!newItem.name || !newItem.category || !newItem.vendor) return;
    const id = `inv-${newItem.name!.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`;
    const item: InventoryItem = {
      id,
      name: newItem.name!,
      brand: newItem.brand || undefined,
      category: newItem.category!,
      storageLocation: newItem.storageLocation || 'Dry Storage',
      vendor: newItem.vendor!,
      par: newItem.par ?? 0,
      unit: newItem.unit || undefined,
      active: true,
      sortOrder: inventoryItems.length,
    };
    await onUpdateItems([...inventoryItems, item]);
    setAddingItem(false);
    setNewItem({ name: '', category: '', storageLocation: 'Dry Storage', vendor: '', par: 0, unit: '', active: true, brand: '' });
  };

  const handleDeactivateItem = async (itemId: string) => {
    const updated = inventoryItems.map(i => i.id === itemId ? { ...i, active: false } : i);
    await onUpdateItems(updated);
  };

  const handleDeleteItem = async (itemId: string) => {
    const updated = inventoryItems.filter(i => i.id !== itemId);
    await onUpdateItems(updated);
    if (editingItem?.id === itemId) setEditingItem(null);
  };

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const currentStoreName = stores.find(s => s.id === currentStoreId)?.name || currentStoreId;
  const countedCount = Object.keys(counts).length;
  const totalItems = activeItems.length;

  // ─── STAFF COUNT VIEW ───

  const renderCountForm = () => (
    <div className="space-y-4">
      {/* Date picker */}
      <div className="flex items-center gap-3 bg-white rounded-xl p-4 shadow-sm border border-neutral-100">
        <Clock size={18} className="text-neutral-400" />
        <div className="flex-1">
          <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400 block mb-1">Count Date</label>
          <input
            type="date"
            value={countDate}
            onChange={e => setCountDate(e.target.value)}
            className="w-full text-sm font-bold text-[#0F2B3C] bg-transparent outline-none"
          />
        </div>
        <div className="text-right">
          <p className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Progress</p>
          <p className="text-lg font-black text-[#0F2B3C]">{countedCount}<span className="text-neutral-300">/{totalItems}</span></p>
        </div>
      </div>

      {/* Last count reference */}
      {latestCount && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-center gap-2">
          <BarChart3 size={14} className="text-blue-500" />
          <p className="text-xs text-blue-700 font-medium">
            Last count: {new Date(latestCount.date).toLocaleDateString()} by {latestCount.submittedByName}
          </p>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-300" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search items..."
          className="w-full pl-10 pr-4 py-3 bg-white border border-neutral-100 rounded-xl text-sm outline-none focus:border-[#0F2B3C] transition-colors"
        />
      </div>

      {/* Category sections */}
      {categoryOrder.map(category => {
        const items = itemsByCategory[category];
        if (!items || items.length === 0) return null;

        const filtered = searchQuery
          ? items.filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()) || i.category.toLowerCase().includes(searchQuery.toLowerCase()))
          : items;
        if (filtered.length === 0) return null;

        const isExpanded = expandedSections.has(category);
        const countedInCat = filtered.filter(i => counts[i.id] !== undefined).length;

        return (
          <div key={category} className="bg-white rounded-xl shadow-sm border border-neutral-100 overflow-hidden">
            <button
              onClick={() => toggleSection(category)}
              className="w-full flex items-center justify-between p-4 text-left active:bg-neutral-50 transition-colors"
            >
              <div className="flex-1">
                <h3 className="font-black text-[#0F2B3C] text-sm uppercase tracking-tight">{category}</h3>
                <p className="text-[10px] text-neutral-400 font-bold">{filtered.length} items {countedInCat > 0 && `· ${countedInCat} counted`}</p>
              </div>
              <div className="flex items-center gap-2">
                {countedInCat === filtered.length && filtered.length > 0 && (
                  <CheckCircle size={16} className="text-green-500" />
                )}
                {isExpanded ? <ChevronUp size={18} className="text-neutral-400" /> : <ChevronDown size={18} className="text-neutral-400" />}
              </div>
            </button>

            {isExpanded && (
              <div className="border-t border-neutral-100">
                {filtered.map(item => {
                  const par = item.par ?? 0;
                  const lastVal = lastCountValues[item.id];
                  const currentVal = counts[item.id];
                  const isCounted = currentVal !== undefined;

                  return (
                    <div key={item.id} className={`flex items-center justify-between px-4 py-3 border-b border-neutral-50 ${isCounted ? 'bg-green-50/30' : ''}`}>
                      <div className="flex-1 min-w-0 mr-3">
                        <p className="text-sm font-bold text-[#0F2B3C] truncate">{item.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {par > 0 && <span className="text-[9px] font-black text-neutral-400 uppercase">Par: {par}</span>}
                          {lastVal !== undefined && <span className="text-[9px] font-bold text-blue-400">Last: {lastVal}</span>}
                          {item.unit && <span className="text-[9px] text-neutral-300 font-medium">{item.unit}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateCount(item.id, (currentVal ?? lastVal ?? 0) - 1)}
                          className="w-11 h-11 flex items-center justify-center rounded-xl bg-neutral-100 text-neutral-600 active:bg-neutral-200 transition-colors font-bold text-lg"
                        >
                          <Minus size={18} />
                        </button>
                        <input
                          type="number"
                          inputMode="numeric"
                          value={currentVal ?? ''}
                          placeholder={lastVal !== undefined ? String(lastVal) : '0'}
                          onChange={e => {
                            const val = e.target.value;
                            if (val === '') {
                              setCounts(prev => { const n = { ...prev }; delete n[item.id]; return n; });
                            } else {
                              updateCount(item.id, Math.max(0, parseInt(val) || 0));
                            }
                          }}
                          className="w-14 h-11 text-center text-lg font-black text-[#0F2B3C] bg-white border-2 border-neutral-200 rounded-xl outline-none focus:border-[#0F2B3C] transition-colors"
                        />
                        <button
                          onClick={() => updateCount(item.id, (currentVal ?? lastVal ?? 0) + 1)}
                          className="w-11 h-11 flex items-center justify-center rounded-xl bg-[#0F2B3C] text-white active:bg-[#1a3d54] transition-colors font-bold text-lg"
                        >
                          <Plus size={18} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Submit */}
      <button
        onClick={handleSubmitCount}
        disabled={countedCount === 0 || submitting}
        className={`w-full py-5 rounded-xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-lg ${
          submitted
            ? 'bg-green-600 text-white'
            : countedCount === 0
              ? 'bg-neutral-100 text-neutral-400'
              : 'bg-[#0F2B3C] text-white hover:bg-[#1a3d54]'
        }`}
      >
        {submitted ? (
          <><CheckCircle size={18} /> Count Submitted</>
        ) : submitting ? (
          'Submitting...'
        ) : (
          <><Send size={16} /> Submit Count ({countedCount} items)</>
        )}
      </button>
    </div>
  );

  // ─── MANAGER: ORDER REPORT ───

  const renderOrderReport = () => (
    <div className="space-y-4">
      {/* Vendor summary cards */}
      {vendorSummary.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {vendorSummary.map(vs => (
            <div key={vs.vendor} className="bg-white rounded-xl p-4 shadow-sm border border-neutral-100">
              <p className="text-[9px] font-black uppercase tracking-widest text-neutral-400 mb-1">{vs.vendor}</p>
              <p className="text-2xl font-black text-red-600">{vs.itemsToOrder}</p>
              <p className="text-[10px] text-neutral-400 font-bold">items to order</p>
            </div>
          ))}
        </div>
      )}

      {/* Last count info */}
      {latestCount && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-neutral-100 flex items-center justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-neutral-400 mb-0.5">Based on count from</p>
            <p className="text-sm font-bold text-[#0F2B3C]">{new Date(latestCount.date).toLocaleDateString()} by {latestCount.submittedByName}</p>
          </div>
          <BarChart3 size={20} className="text-neutral-300" />
        </div>
      )}

      {/* Filter toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowBelowParOnly(!showBelowParOnly)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
            showBelowParOnly ? 'bg-red-600 text-white' : 'bg-neutral-100 text-neutral-500'
          }`}
        >
          <Filter size={14} />
          {showBelowParOnly ? 'Below Par Only' : 'Show All'}
        </button>
      </div>

      {/* Items by vendor */}
      {(Object.entries(ordersByVendor) as [string, OrderEntry[]][]).sort(([a], [b]) => a.localeCompare(b)).map(([vendor, items]) => (
        <div key={vendor} className="bg-white rounded-xl shadow-sm border border-neutral-100 overflow-hidden">
          <div className="px-4 py-3 bg-[#0F2B3C] flex items-center justify-between">
            <h3 className="font-black text-white text-xs uppercase tracking-widest">{vendor}</h3>
            <span className="text-[10px] font-bold text-white/60">{items.length} items</span>
          </div>
          <div className="divide-y divide-neutral-50">
            {items.map(({ item, currentCount, par, orderQty }) => {
              const needsOrder = orderQty !== null && orderQty > 0;
              return (
                <div key={item.id} className={`flex items-center justify-between px-4 py-3 ${needsOrder ? 'bg-red-50/50' : ''}`}>
                  <div className="flex-1 min-w-0 mr-3">
                    <p className="text-sm font-bold text-[#0F2B3C] truncate">{item.name}</p>
                    <p className="text-[10px] text-neutral-400 font-medium">{item.category} {item.unit && `· ${item.unit}`}</p>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Count</p>
                      <p className="text-sm font-bold text-[#0F2B3C]">{currentCount ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Par</p>
                      <p className="text-sm font-bold text-[#0F2B3C]">{par}</p>
                    </div>
                    <div className="min-w-[50px]">
                      <p className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Order</p>
                      {needsOrder ? (
                        <p className="text-sm font-black text-red-600">{orderQty}</p>
                      ) : (
                        <p className="text-sm font-bold text-green-600">OK</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {Object.keys(ordersByVendor).length === 0 && (
        <div className="py-16 text-center">
          <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
          <p className="text-neutral-400 uppercase font-black text-xs tracking-widest">
            {showBelowParOnly ? 'All items are at or above par' : 'No items to display'}
          </p>
        </div>
      )}
    </div>
  );

  // ─── MANAGER: PAR MANAGEMENT ───

  const renderParManagement = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-[#0F2B3C] uppercase tracking-tight">Manage Items & Pars</h3>
        <button
          onClick={() => setAddingItem(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#0F2B3C] text-white rounded-lg text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all"
        >
          <PlusCircle size={14} /> Add Item
        </button>
      </div>

      {/* Add new item form */}
      {addingItem && (
        <div className="bg-white rounded-xl p-4 shadow-sm border-2 border-[#0F2B3C] space-y-3">
          <h4 className="font-black text-sm text-[#0F2B3C] uppercase tracking-tight">New Item</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400 mb-1 block">Name</label>
              <input value={newItem.name || ''} onChange={e => setNewItem(p => ({ ...p, name: e.target.value }))}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm outline-none focus:border-[#0F2B3C]" placeholder="Item name" />
            </div>
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400 mb-1 block">Brand</label>
              <input value={newItem.brand || ''} onChange={e => setNewItem(p => ({ ...p, brand: e.target.value }))}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm outline-none focus:border-[#0F2B3C]" placeholder="Brand (optional)" />
            </div>
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400 mb-1 block">Category</label>
              <input list="categories" value={newItem.category || ''} onChange={e => setNewItem(p => ({ ...p, category: e.target.value }))}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm outline-none focus:border-[#0F2B3C]" placeholder="Category" />
              <datalist id="categories">{categories.map(c => <option key={c} value={c} />)}</datalist>
            </div>
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400 mb-1 block">Vendor</label>
              <input list="vendors" value={newItem.vendor || ''} onChange={e => setNewItem(p => ({ ...p, vendor: e.target.value }))}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm outline-none focus:border-[#0F2B3C]" placeholder="Vendor" />
              <datalist id="vendors">{vendors.map(v => <option key={v} value={v} />)}</datalist>
            </div>
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400 mb-1 block">Storage Location</label>
              <select value={newItem.storageLocation || 'Dry Storage'} onChange={e => setNewItem(p => ({ ...p, storageLocation: e.target.value }))}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm outline-none focus:border-[#0F2B3C]">
                {STORAGE_LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400 mb-1 block">Unit</label>
              <input value={newItem.unit || ''} onChange={e => setNewItem(p => ({ ...p, unit: e.target.value }))}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm outline-none focus:border-[#0F2B3C]" placeholder="e.g., bottles, bags" />
            </div>
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400 mb-1 block">Par</label>
              <input type="number" inputMode="numeric" value={newItem.par ?? ''} onChange={e => setNewItem(p => ({ ...p, par: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm outline-none focus:border-[#0F2B3C]" placeholder="0" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={handleAddNewItem} disabled={!newItem.name || !newItem.category || !newItem.vendor}
              className="flex-1 py-3 bg-green-600 text-white rounded-lg font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 disabled:opacity-40 active:scale-95 transition-all">
              <Save size={14} /> Save Item
            </button>
            <button onClick={() => setAddingItem(false)}
              className="px-6 py-3 bg-neutral-100 text-neutral-500 rounded-lg font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Existing items by category */}
      {categories.map(category => {
        const items = activeItems.filter(i => i.category === category);
        if (items.length === 0) return null;
        return (
          <div key={category} className="bg-white rounded-xl shadow-sm border border-neutral-100 overflow-hidden">
            <div className="px-4 py-3 bg-neutral-50 border-b border-neutral-100">
              <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">{category} ({items.length})</p>
            </div>
            <div className="divide-y divide-neutral-50">
              {items.map(item => {
                const isEditing = editingItem?.id === item.id;
                if (isEditing) {
                  return (
                    <div key={item.id} className="p-4 bg-blue-50/30 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400 mb-1 block">Name</label>
                          <input value={editingItem.name} onChange={e => setEditingItem({ ...editingItem, name: e.target.value })}
                            className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm outline-none focus:border-[#0F2B3C]" />
                        </div>
                        <div>
                          <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400 mb-1 block">Vendor</label>
                          <input list="vendors-edit" value={editingItem.vendor} onChange={e => setEditingItem({ ...editingItem, vendor: e.target.value })}
                            className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm outline-none focus:border-[#0F2B3C]" />
                          <datalist id="vendors-edit">{vendors.map(v => <option key={v} value={v} />)}</datalist>
                        </div>
                        <div>
                          <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400 mb-1 block">Category</label>
                          <input list="categories-edit" value={editingItem.category} onChange={e => setEditingItem({ ...editingItem, category: e.target.value })}
                            className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm outline-none focus:border-[#0F2B3C]" />
                          <datalist id="categories-edit">{categories.map(c => <option key={c} value={c} />)}</datalist>
                        </div>
                        <div>
                          <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400 mb-1 block">Storage</label>
                          <select value={editingItem.storageLocation} onChange={e => setEditingItem({ ...editingItem, storageLocation: e.target.value })}
                            className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm outline-none focus:border-[#0F2B3C]">
                            {STORAGE_LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400 mb-1 block">Unit</label>
                          <input value={editingItem.unit || ''} onChange={e => setEditingItem({ ...editingItem, unit: e.target.value })}
                            className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm outline-none focus:border-[#0F2B3C]" />
                        </div>
                        <div>
                          <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400 mb-1 block">Brand</label>
                          <input value={editingItem.brand || ''} onChange={e => setEditingItem({ ...editingItem, brand: e.target.value })}
                            className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm outline-none focus:border-[#0F2B3C]" />
                        </div>
                        <div>
                          <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400 mb-1 block">Par</label>
                          <input type="number" inputMode="numeric" value={editingItem.par ?? 0}
                            onChange={e => setEditingItem({ ...editingItem, par: parseInt(e.target.value) || 0 })}
                            className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm outline-none focus:border-[#0F2B3C]" />
                        </div>
                      </div>
                      <div className="flex gap-3 pt-1">
                        <button onClick={() => handleSaveItem(editingItem)}
                          className="flex-1 py-2.5 bg-green-600 text-white rounded-lg font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all">
                          <Save size={14} /> Save
                        </button>
                        <button onClick={() => setEditingItem(null)}
                          className="px-4 py-2.5 bg-neutral-100 text-neutral-500 rounded-lg font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all">
                          Cancel
                        </button>
                        <button onClick={() => { handleDeactivateItem(item.id); setEditingItem(null); }}
                          className="px-4 py-2.5 bg-red-50 text-red-600 rounded-lg font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-1 active:scale-95 transition-all">
                          <Trash2 size={12} /> Remove
                        </button>
                      </div>
                    </div>
                  );
                }

                const par = item.par ?? 0;
                const isConfirmingDelete = confirmDeleteId === item.id;
                return (
                  <div key={item.id} className="px-4 py-3 border-b border-neutral-50">
                    {isConfirmingDelete ? (
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-bold text-red-700 flex-1">Delete "{item.name}" permanently?</p>
                        <button onClick={() => { handleDeleteItem(item.id); setConfirmDeleteId(null); }}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all">
                          Delete
                        </button>
                        <button onClick={() => setConfirmDeleteId(null)}
                          className="px-4 py-2 bg-neutral-100 text-neutral-500 rounded-lg font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all">
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0 mr-3">
                          <p className="text-sm font-bold text-[#0F2B3C] truncate">{item.name}</p>
                          <p className="text-[10px] text-neutral-400 font-medium">{item.vendor} {item.brand && `· ${item.brand}`} {item.unit && `· ${item.unit}`}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right mr-1">
                            <p className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Par</p>
                            <p className="text-sm font-bold text-[#0F2B3C]">{par}</p>
                          </div>
                          <button onClick={() => setEditingItem({ ...item })}
                            className="p-2 rounded-lg bg-neutral-100 text-neutral-500 hover:bg-neutral-200 transition-colors active:scale-95">
                            <Edit3 size={14} />
                          </button>
                          <button onClick={() => setConfirmDeleteId(item.id)}
                            className="p-2 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 transition-colors active:scale-95">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );

  // ─── MANAGER: COUNT HISTORY ───

  const renderHistory = () => (
    <div className="space-y-4">
      {storeCounts.length === 0 ? (
        <div className="py-16 text-center">
          <Archive size={48} className="mx-auto text-neutral-300 mb-4" />
          <p className="text-neutral-400 uppercase font-black text-xs tracking-widest">No counts submitted yet</p>
        </div>
      ) : (
        storeCounts.map(count => (
          <div key={count.id} className="bg-white rounded-xl shadow-sm border border-neutral-100 overflow-hidden">
            <div className="px-4 py-3 bg-neutral-50 border-b border-neutral-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-black text-[#0F2B3C]">{new Date(count.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</p>
                <p className="text-[10px] text-neutral-400 font-bold">By {count.submittedByName} at {new Date(count.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                {Object.keys(count.counts).length} items
              </span>
            </div>
            <div className="divide-y divide-neutral-50 max-h-64 overflow-y-auto">
              {Object.entries(count.counts).map(([itemId, qty]) => {
                const item = inventoryItems.find(i => i.id === itemId);
                if (!item) return null;
                const par = item.par ?? 0;
                const belowPar = par > 0 && qty < par;
                return (
                  <div key={itemId} className={`flex items-center justify-between px-4 py-2 ${belowPar ? 'bg-red-50/50' : ''}`}>
                    <p className="text-xs font-medium text-[#0F2B3C] truncate flex-1 mr-2">{item.name}</p>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-black ${belowPar ? 'text-red-600' : 'text-[#0F2B3C]'}`}>{qty}</span>
                      {par > 0 && <span className="text-[10px] text-neutral-300">/ {par}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );

  // ─── MAIN RENDER ───

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 bg-[#0F2B3C] text-white rounded-xl shadow-lg">
          <Package size={24} />
        </div>
        <div>
          <h1 className="text-xl font-black text-[#0F2B3C] uppercase tracking-tight">Inventory</h1>
          <p className="text-xs text-neutral-400 font-bold">{currentStoreName}</p>
        </div>
      </div>

      {/* Manager sub-tabs */}
      {isManager ? (
        <>
          <div className="flex gap-1 bg-neutral-100 rounded-xl p-1">
            {([
              { id: 'count', label: 'Count', icon: Package },
              { id: 'orders', label: 'Orders', icon: ShoppingCart },
              { id: 'pars', label: 'Par Mgmt', icon: Edit3 },
              { id: 'history', label: 'History', icon: Clock },
            ] as const).map(tab => (
              <button
                key={tab.id}
                onClick={() => setManagerTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                  managerTab === tab.id
                    ? 'bg-white text-[#0F2B3C] shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-600'
                }`}
              >
                <tab.icon size={14} />
                {tab.label}
              </button>
            ))}
          </div>

          {managerTab === 'count' && renderCountForm()}
          {managerTab === 'orders' && renderOrderReport()}
          {managerTab === 'pars' && renderParManagement()}
          {managerTab === 'history' && renderHistory()}
        </>
      ) : (
        renderCountForm()
      )}
    </div>
  );
};

export default InventoryView;
