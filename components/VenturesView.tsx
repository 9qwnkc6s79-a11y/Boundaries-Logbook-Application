import React, { useMemo, useState } from 'react';
import { User, Venture, VentureStage, VentureTask, VentureWorkstream, VentureBudgetItem, VentureNote, VentureLink } from '../types';
import {
  WORKSTREAM_META, WORKSTREAM_ORDER, STAGE_META, STAGE_ORDER, PIPELINE_STAGES,
  buildPlaybookTasks, PITCH_SLIDES,
} from '../data/venturePlaybook';
import {
  Lightbulb, Plus, ChevronLeft, ChevronRight, ChevronDown, Rocket, Archive,
  Trash2, Check, X, Star, DollarSign, Presentation, StickyNote, LayoutGrid,
  ClipboardList, Link as LinkIcon, Pin, Copy, TrendingUp, Pencil, CircleDollarSign,
} from 'lucide-react';

interface VenturesViewProps {
  currentUser: User;
  ventures: Venture[];
  onSave: (next: Venture[]) => void;
}

type DetailTab = 'overview' | 'roadmap' | 'budget' | 'pitch' | 'notes';

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const fmtMoney = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

const taskProgress = (tasks: VentureTask[]) => {
  if (tasks.length === 0) return 0;
  return Math.round((tasks.filter(t => t.done).length / tasks.length) * 100);
};

// ─── Small shared pieces ─────────────────────────────────────────────

const SectionLabel: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <label className={`text-[10px] font-black text-neutral-400 uppercase tracking-widest block ${className}`}>{children}</label>
);

const StageChip: React.FC<{ stage: VentureStage; small?: boolean }> = ({ stage, small }) => {
  const meta = STAGE_META[stage];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-black uppercase tracking-wider ${small ? 'text-[9px] px-2 py-0.5' : 'text-[10px] px-2.5 py-1'}`}
      style={{ backgroundColor: `${meta.color}1A`, color: meta.color }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
      {meta.label}
    </span>
  );
};

const ScoreDots: React.FC<{ value: number; onChange: (v: number) => void; color?: string }> = ({ value, onChange, color = '#0F2B3C' }) => (
  <div className="flex gap-1.5">
    {[1, 2, 3, 4, 5].map(n => (
      <button
        key={n}
        type="button"
        onClick={() => onChange(n === value ? 0 : n)}
        className="p-0.5 active:scale-90 transition-transform"
        aria-label={`Set score to ${n}`}
      >
        <Star size={18} fill={n <= value ? color : 'none'} style={{ color: n <= value ? color : '#D4D4D4' }} />
      </button>
    ))}
  </div>
);

const ProgressBar: React.FC<{ percent: number; color: string; height?: string }> = ({ percent, color, height = 'h-1.5' }) => (
  <div className={`w-full bg-neutral-100 rounded-full overflow-hidden ${height}`}>
    <div className={`${height} rounded-full transition-all duration-500`} style={{ width: `${percent}%`, backgroundColor: color }} />
  </div>
);

// ─── Quick capture ───────────────────────────────────────────────────

const QuickCapture: React.FC<{ onCreate: (name: string, oneLiner: string) => void }> = ({ onCreate }) => {
  const [name, setName] = useState('');
  const [oneLiner, setOneLiner] = useState('');
  const [expanded, setExpanded] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate(name.trim(), oneLiner.trim());
    setName('');
    setOneLiner('');
    setExpanded(false);
  };

  return (
    <form onSubmit={submit} className="bg-white rounded-xl border border-neutral-100 shadow-sm p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-lg bg-amber-50 shrink-0">
          <Lightbulb size={20} className="text-amber-500" />
        </div>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          onFocus={() => setExpanded(true)}
          placeholder="Got an idea? Capture it before it slips away..."
          className="flex-1 bg-neutral-50 border border-neutral-100 rounded-lg px-4 py-3 focus:bg-white focus:ring-4 focus:ring-blue-900/10 focus:border-blue-900 transition-all outline-none font-medium text-sm min-w-0"
        />
        <button
          type="submit"
          disabled={!name.trim()}
          className="bg-[#0F2B3C] text-white font-black px-4 sm:px-6 py-3 rounded-lg active:scale-[0.97] transition-all disabled:opacity-40 flex items-center gap-2 shrink-0"
        >
          <Plus size={16} /><span className="hidden sm:inline">CAPTURE</span>
        </button>
      </div>
      {expanded && (
        <input
          value={oneLiner}
          onChange={e => setOneLiner(e.target.value)}
          placeholder="One-liner: what is it, in a sentence? (optional — you can add this later)"
          className="mt-3 w-full bg-neutral-50 border border-neutral-100 rounded-lg px-4 py-3 focus:bg-white focus:ring-4 focus:ring-blue-900/10 focus:border-blue-900 transition-all outline-none text-sm animate-in fade-in duration-300"
        />
      )}
    </form>
  );
};

// ─── Venture card ────────────────────────────────────────────────────

const VentureCard: React.FC<{ venture: Venture; onOpen: () => void }> = ({ venture, onOpen }) => {
  const progress = taskProgress(venture.tasks);
  const startupCost = venture.budgetItems.filter(b => b.kind === 'STARTUP').reduce((s, b) => s + (b.estimated || 0), 0);
  return (
    <button
      onClick={onOpen}
      className="w-full text-left bg-white rounded-xl border border-neutral-100 shadow-sm p-4 hover:shadow-md hover:border-neutral-200 active:scale-[0.99] transition-all"
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <h3 className="font-black text-[#0F2B3C] leading-tight">{venture.name}</h3>
        {(venture.excitement || 0) > 0 && (
          <span className="flex items-center gap-0.5 text-amber-500 text-xs font-black shrink-0">
            <Star size={12} fill="currentColor" />{venture.excitement}
          </span>
        )}
      </div>
      {venture.oneLiner && <p className="text-xs text-neutral-500 mb-3 line-clamp-2">{venture.oneLiner}</p>}
      <div className="flex items-center justify-between gap-3">
        <StageChip stage={venture.stage} small />
        {startupCost > 0 && (
          <span className="text-[10px] font-bold text-neutral-400">{fmtMoney(startupCost)} to start</span>
        )}
      </div>
      {venture.tasks.length > 0 && (
        <div className="mt-3 flex items-center gap-2">
          <ProgressBar percent={progress} color={STAGE_META[venture.stage].color} />
          <span className="text-[10px] font-black text-neutral-400 shrink-0">{progress}%</span>
        </div>
      )}
    </button>
  );
};

// ─── Main component ──────────────────────────────────────────────────

const VenturesView: React.FC<VenturesViewProps> = ({ currentUser, ventures, onSave }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>('overview');

  const selected = ventures.find(v => v.id === selectedId) || null;

  const createVenture = (name: string, oneLiner: string) => {
    const id = uid();
    const now = new Date().toISOString();
    const venture: Venture = {
      id,
      ownerId: currentUser.id,
      name,
      oneLiner,
      stage: 'IDEA',
      tasks: buildPlaybookTasks(id),
      budgetItems: [],
      pitch: {},
      notes: [],
      links: [],
      createdAt: now,
      updatedAt: now,
    };
    onSave([venture, ...ventures]);
  };

  const updateVenture = (id: string, patch: Partial<Venture>) => {
    onSave(ventures.map(v => (v.id === id ? { ...v, ...patch, updatedAt: new Date().toISOString() } : v)));
  };

  const deleteVenture = (id: string) => {
    onSave(ventures.filter(v => v.id !== id));
    setSelectedId(null);
  };

  // ── Portfolio (list) view ──
  if (!selected) {
    const active = ventures.filter(v => v.stage !== 'PARKED');
    const parked = ventures.filter(v => v.stage === 'PARKED');
    const launched = ventures.filter(v => v.stage === 'LAUNCHED');
    const totalPlanned = ventures
      .filter(v => v.stage !== 'PARKED' && v.stage !== 'LAUNCHED')
      .reduce((s, v) => s + v.budgetItems.filter(b => b.kind === 'STARTUP').reduce((t, b) => t + (b.estimated || 0), 0), 0);

    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0F2B3C] uppercase tracking-tight flex items-center gap-3">
            <Rocket className="text-[#C77B3C]" size={28} /> Ventures
          </h1>
          <p className="text-sm text-neutral-500 mt-1 font-medium">
            Your business idea pipeline — capture everything, then take them from idea to launch.
          </p>
        </div>

        <QuickCapture onCreate={createVenture} />

        {ventures.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Ideas Captured', value: String(ventures.length), icon: Lightbulb, color: '#F59E0B' },
              { label: 'In Motion', value: String(active.length - launched.length), icon: TrendingUp, color: '#3B82F6' },
              { label: 'Launched', value: String(launched.length), icon: Rocket, color: '#10B981' },
              { label: 'Planned Startup $', value: totalPlanned > 0 ? fmtMoney(totalPlanned) : '—', icon: CircleDollarSign, color: '#C77B3C' },
            ].map(stat => (
              <div key={stat.label} className="bg-white rounded-xl border border-neutral-100 shadow-sm p-4">
                <stat.icon size={18} style={{ color: stat.color }} className="mb-2" />
                <div className="text-xl font-black text-[#0F2B3C] leading-none">{stat.value}</div>
                <div className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mt-1.5">{stat.label}</div>
              </div>
            ))}
          </div>
        )}

        {ventures.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-neutral-200 p-10 sm:p-16 text-center">
            <div className="inline-flex p-4 rounded-xl bg-amber-50 mb-4">
              <Lightbulb size={32} className="text-amber-500" />
            </div>
            <h3 className="font-black text-[#0F2B3C] text-lg mb-2">Every business starts as a note</h3>
            <p className="text-sm text-neutral-500 max-w-md mx-auto">
              Capture your ideas above. Each one gets a full launch playbook — legal setup, budget,
              market research, pitch deck, and an operations checklist — ready when you are.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {PIPELINE_STAGES.map(stage => {
                const inStage = active.filter(v => v.stage === stage);
                if (inStage.length === 0) return null;
                const meta = STAGE_META[stage];
                return (
                  <div key={stage} className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: meta.color }} />
                        <span className="text-[11px] font-black uppercase tracking-widest text-neutral-500">{meta.label}</span>
                        <span className="text-[11px] font-black text-neutral-300">{inStage.length}</span>
                      </div>
                      <span className="text-[9px] font-bold text-neutral-300 uppercase tracking-wider hidden sm:block">{meta.hint}</span>
                    </div>
                    {inStage.map(v => (
                      <VentureCard key={v.id} venture={v} onOpen={() => { setSelectedId(v.id); setDetailTab('overview'); }} />
                    ))}
                  </div>
                );
              })}
            </div>

            {parked.length > 0 && (
              <div>
                <div className="flex items-center gap-2 px-1 mb-3">
                  <Archive size={13} className="text-neutral-400" />
                  <span className="text-[11px] font-black uppercase tracking-widest text-neutral-500">Parked for Later</span>
                  <span className="text-[11px] font-black text-neutral-300">{parked.length}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 opacity-70">
                  {parked.map(v => (
                    <VentureCard key={v.id} venture={v} onOpen={() => { setSelectedId(v.id); setDetailTab('overview'); }} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // ── Detail view ──
  return (
    <VentureDetail
      venture={selected}
      tab={detailTab}
      onTabChange={setDetailTab}
      onBack={() => setSelectedId(null)}
      onUpdate={patch => updateVenture(selected.id, patch)}
      onDelete={() => deleteVenture(selected.id)}
    />
  );
};

// ─── Detail view ─────────────────────────────────────────────────────

const DETAIL_TABS: { id: DetailTab; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid },
  { id: 'roadmap', label: 'Roadmap', icon: ClipboardList },
  { id: 'budget', label: 'Budget', icon: DollarSign },
  { id: 'pitch', label: 'Pitch', icon: Presentation },
  { id: 'notes', label: 'Notes', icon: StickyNote },
];

const VentureDetail: React.FC<{
  venture: Venture;
  tab: DetailTab;
  onTabChange: (t: DetailTab) => void;
  onBack: () => void;
  onUpdate: (patch: Partial<Venture>) => void;
  onDelete: () => void;
}> = ({ venture, tab, onTabChange, onBack, onUpdate, onDelete }) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(venture.name);

  const stageIdx = PIPELINE_STAGES.indexOf(venture.stage);
  const isParked = venture.stage === 'PARKED';
  const progress = taskProgress(venture.tasks);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <button onClick={onBack} className="flex items-center gap-1 text-neutral-400 hover:text-[#0F2B3C] font-bold text-xs uppercase tracking-widest mb-4 transition-colors">
          <ChevronLeft size={16} /> All Ventures
        </button>
        <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-[220px]">
              {editingName ? (
                <div className="flex items-center gap-2">
                  <input
                    value={nameDraft}
                    onChange={e => setNameDraft(e.target.value)}
                    className="text-xl font-black text-[#0F2B3C] bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-1.5 outline-none focus:border-blue-900 w-full"
                    autoFocus
                  />
                  <button
                    onClick={() => { if (nameDraft.trim()) onUpdate({ name: nameDraft.trim() }); setEditingName(false); }}
                    className="p-2 bg-green-50 text-green-600 rounded-lg shrink-0"
                  ><Check size={16} /></button>
                </div>
              ) : (
                <h1 className="text-xl sm:text-2xl font-black text-[#0F2B3C] flex items-center gap-2 group">
                  {venture.name}
                  <button onClick={() => { setNameDraft(venture.name); setEditingName(true); }} className="opacity-30 hover:opacity-100 transition-opacity"><Pencil size={14} /></button>
                </h1>
              )}
              <EditableText
                value={venture.oneLiner}
                placeholder="Add a one-liner — what is it, in a sentence?"
                onSave={oneLiner => onUpdate({ oneLiner })}
                className="text-sm text-neutral-500 mt-1"
              />
            </div>
            <div className="flex items-center gap-2">
              <StageChip stage={venture.stage} />
              {venture.tasks.length > 0 && (
                <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">{progress}% ready</span>
              )}
            </div>
          </div>

          {/* Stage stepper */}
          <div className="mt-5 flex items-center gap-1.5 flex-wrap">
            {PIPELINE_STAGES.map((s, i) => {
              const meta = STAGE_META[s];
              const isCurrent = s === venture.stage;
              const isPast = !isParked && i < stageIdx;
              return (
                <React.Fragment key={s}>
                  {i > 0 && <div className={`h-px w-3 sm:w-5 ${isPast || isCurrent ? 'bg-neutral-300' : 'bg-neutral-100'}`} />}
                  <button
                    onClick={() => onUpdate({ stage: s })}
                    className={`text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-full transition-all active:scale-95 ${
                      isCurrent ? 'text-white shadow-sm' : isPast ? 'text-neutral-500 bg-neutral-100' : 'text-neutral-300 bg-neutral-50 hover:bg-neutral-100'
                    }`}
                    style={isCurrent ? { backgroundColor: meta.color } : undefined}
                  >
                    {isPast ? '✓ ' : ''}{meta.label}
                  </button>
                </React.Fragment>
              );
            })}
            <div className="flex-1" />
            <button
              onClick={() => onUpdate({ stage: isParked ? 'IDEA' : 'PARKED' })}
              className={`text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all active:scale-95 ${
                isParked ? 'bg-blue-50 text-blue-600' : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
              }`}
            >
              <Archive size={11} /> {isParked ? 'Reactivate' : 'Park It'}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-xl border border-neutral-100 shadow-sm p-1.5 overflow-x-auto">
        {DETAIL_TABS.map(t => (
          <button
            key={t.id}
            onClick={() => onTabChange(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
              tab === t.id ? 'bg-[#0F2B3C] text-white shadow-sm' : 'text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50'
            }`}
          >
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <OverviewTab venture={venture} onUpdate={onUpdate} onGoToTab={onTabChange} />}
      {tab === 'roadmap' && <RoadmapTab venture={venture} onUpdate={onUpdate} />}
      {tab === 'budget' && <BudgetTab venture={venture} onUpdate={onUpdate} />}
      {tab === 'pitch' && <PitchTab venture={venture} onUpdate={onUpdate} />}
      {tab === 'notes' && <NotesTab venture={venture} onUpdate={onUpdate} />}

      {/* Danger zone */}
      <div className="pt-2 flex justify-end">
        {confirmDelete ? (
          <div className="flex items-center gap-2 bg-red-50 rounded-lg px-3 py-2">
            <span className="text-xs font-bold text-red-600">Delete "{venture.name}" forever?</span>
            <button onClick={onDelete} className="text-xs font-black text-white bg-red-600 px-3 py-1.5 rounded-lg active:scale-95">DELETE</button>
            <button onClick={() => setConfirmDelete(false)} className="text-xs font-black text-neutral-500 px-2 py-1.5">Cancel</button>
          </div>
        ) : (
          <button onClick={() => setConfirmDelete(true)} className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-neutral-300 hover:text-red-500 transition-colors">
            <Trash2 size={12} /> Delete Venture
          </button>
        )}
      </div>
    </div>
  );
};

// ─── Inline editable text ────────────────────────────────────────────

const EditableText: React.FC<{
  value?: string;
  placeholder: string;
  onSave: (v: string) => void;
  className?: string;
  multiline?: boolean;
}> = ({ value, placeholder, onSave, className = '', multiline }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || '');

  const save = () => { onSave(draft.trim()); setEditing(false); };

  if (editing) {
    return multiline ? (
      <textarea
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={save}
        rows={3}
        autoFocus
        placeholder={placeholder}
        className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-900 resize-y"
      />
    ) : (
      <input
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={save}
        onKeyDown={e => e.key === 'Enter' && save()}
        autoFocus
        placeholder={placeholder}
        className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-900"
      />
    );
  }
  return (
    <button onClick={() => { setDraft(value || ''); setEditing(true); }} className={`text-left w-full hover:bg-neutral-50 rounded-lg -mx-1 px-1 py-0.5 transition-colors ${className}`}>
      {value ? <span className="whitespace-pre-wrap">{value}</span> : <span className="text-neutral-300 italic">{placeholder}</span>}
    </button>
  );
};

// ─── Overview tab ────────────────────────────────────────────────────

const CANVAS_FIELDS: { key: keyof Venture; label: string; placeholder: string }[] = [
  { key: 'problem', label: 'The Problem', placeholder: 'What painful, expensive, or annoying problem does this solve?' },
  { key: 'solution', label: 'The Solution', placeholder: 'How do you solve it? What changes for the customer?' },
  { key: 'targetCustomer', label: 'Target Customer', placeholder: 'Who exactly buys this? Be specific.' },
  { key: 'revenueModel', label: 'How It Makes Money', placeholder: 'What do you charge, and how often do they pay?' },
  { key: 'competition', label: 'Competition', placeholder: 'Who else solves this, and why would customers pick you?' },
  { key: 'unfairAdvantage', label: 'Your Unfair Advantage', placeholder: 'What do you have that others can\'t easily copy?' },
];

const OverviewTab: React.FC<{ venture: Venture; onUpdate: (p: Partial<Venture>) => void; onGoToTab: (t: DetailTab) => void }> = ({ venture, onUpdate, onGoToTab }) => {
  return (
    <div className="space-y-5">
      {/* Scores */}
      <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-5">
        <h3 className="text-xs font-black uppercase tracking-widest text-neutral-400 mb-4">Gut Check</h3>
        <div className="grid sm:grid-cols-3 gap-5">
          <div>
            <SectionLabel className="mb-2">How excited are you?</SectionLabel>
            <ScoreDots value={venture.excitement || 0} onChange={v => onUpdate({ excitement: v })} color="#F59E0B" />
          </div>
          <div>
            <SectionLabel className="mb-2">How confident it works?</SectionLabel>
            <ScoreDots value={venture.confidence || 0} onChange={v => onUpdate({ confidence: v })} color="#10B981" />
          </div>
          <div>
            <SectionLabel className="mb-2">How heavy a lift?</SectionLabel>
            <ScoreDots value={venture.effort || 0} onChange={v => onUpdate({ effort: v })} color="#EF4444" />
          </div>
        </div>
      </div>

      {/* Idea canvas */}
      <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-5">
        <h3 className="text-xs font-black uppercase tracking-widest text-neutral-400 mb-1">Idea Canvas</h3>
        <p className="text-xs text-neutral-400 mb-4">Answer these six and you have the core of a business plan (and most of your pitch).</p>
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-4">
          {CANVAS_FIELDS.map(f => (
            <div key={f.key}>
              <SectionLabel className="mb-1.5">{f.label}</SectionLabel>
              <EditableText
                value={venture[f.key] as string | undefined}
                placeholder={f.placeholder}
                onSave={v => onUpdate({ [f.key]: v } as Partial<Venture>)}
                className="text-sm text-neutral-700 min-h-[2rem]"
                multiline
              />
            </div>
          ))}
        </div>
        <div className="mt-4">
          <SectionLabel className="mb-1.5">Industry / Category</SectionLabel>
          <EditableText
            value={venture.industry}
            placeholder="e.g., Food & beverage, services, e-commerce..."
            onSave={v => onUpdate({ industry: v })}
            className="text-sm text-neutral-700"
          />
        </div>
      </div>

      {/* Readiness by workstream */}
      <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-neutral-400">Launch Readiness</h3>
          <button onClick={() => onGoToTab('roadmap')} className="text-[10px] font-black uppercase tracking-widest text-blue-900 flex items-center gap-1">
            Open Roadmap <ChevronRight size={12} />
          </button>
        </div>
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
          {WORKSTREAM_ORDER.map(ws => {
            const meta = WORKSTREAM_META[ws];
            const tasks = venture.tasks.filter(t => t.workstream === ws);
            const pct = taskProgress(tasks);
            return (
              <div key={ws}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-black text-neutral-600">{meta.label}</span>
                  <span className="text-[10px] font-black text-neutral-400">{tasks.filter(t => t.done).length}/{tasks.length}</span>
                </div>
                <ProgressBar percent={pct} color={meta.color} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ─── Roadmap tab ─────────────────────────────────────────────────────

const RoadmapTab: React.FC<{ venture: Venture; onUpdate: (p: Partial<Venture>) => void }> = ({ venture, onUpdate }) => {
  const [openWs, setOpenWs] = useState<VentureWorkstream | null>('MARKET');
  const [addingTo, setAddingTo] = useState<VentureWorkstream | null>(null);
  const [newTask, setNewTask] = useState('');

  const toggleTask = (taskId: string) => {
    onUpdate({
      tasks: venture.tasks.map(t =>
        t.id === taskId ? { ...t, done: !t.done, completedAt: !t.done ? new Date().toISOString() : undefined } : t
      ),
    });
  };

  const addTask = (ws: VentureWorkstream) => {
    if (!newTask.trim()) return;
    const task: VentureTask = { id: uid(), workstream: ws, title: newTask.trim(), done: false, custom: true };
    onUpdate({ tasks: [...venture.tasks, task] });
    setNewTask('');
  };

  const removeTask = (taskId: string) => {
    onUpdate({ tasks: venture.tasks.filter(t => t.id !== taskId) });
  };

  return (
    <div className="space-y-3">
      {WORKSTREAM_ORDER.map(ws => {
        const meta = WORKSTREAM_META[ws];
        const tasks = venture.tasks.filter(t => t.workstream === ws);
        const doneCount = tasks.filter(t => t.done).length;
        const pct = taskProgress(tasks);
        const isOpen = openWs === ws;
        return (
          <div key={ws} className="bg-white rounded-xl border border-neutral-100 shadow-sm overflow-hidden">
            <button
              onClick={() => setOpenWs(isOpen ? null : ws)}
              className="w-full flex items-center gap-3 p-4 sm:p-5 text-left hover:bg-neutral-50/50 transition-colors"
            >
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: meta.color }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-black text-[#0F2B3C] text-sm">{meta.label}</h3>
                  <span className="text-[10px] font-black text-neutral-400 shrink-0">{doneCount}/{tasks.length}</span>
                </div>
                <div className="mt-1.5"><ProgressBar percent={pct} color={meta.color} /></div>
              </div>
              <ChevronDown size={16} className={`text-neutral-300 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
              <div className="px-4 sm:px-5 pb-4 sm:pb-5 space-y-1 animate-in fade-in duration-200">
                <p className="text-xs text-neutral-400 mb-3">{meta.description}</p>
                {tasks.map(t => (
                  <div key={t.id} className={`group flex items-start gap-3 rounded-lg px-2 py-2 -mx-2 hover:bg-neutral-50 transition-colors ${t.done ? 'opacity-60' : ''}`}>
                    <button
                      onClick={() => toggleTask(t.id)}
                      className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all active:scale-90 ${
                        t.done ? 'border-transparent text-white' : 'border-neutral-200 hover:border-neutral-400 text-transparent'
                      }`}
                      style={t.done ? { backgroundColor: meta.color } : undefined}
                    >
                      <Check size={12} strokeWidth={4} />
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-bold text-neutral-700 ${t.done ? 'line-through' : ''}`}>{t.title}</div>
                      {t.description && !t.done && <div className="text-xs text-neutral-400 mt-0.5">{t.description}</div>}
                    </div>
                    {t.custom && (
                      <button onClick={() => removeTask(t.id)} className="opacity-0 group-hover:opacity-100 text-neutral-300 hover:text-red-500 transition-all shrink-0 mt-1">
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                ))}
                {addingTo === ws ? (
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      value={newTask}
                      onChange={e => setNewTask(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addTask(ws)}
                      autoFocus
                      placeholder="New task..."
                      className="flex-1 bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-900"
                    />
                    <button onClick={() => addTask(ws)} className="p-2 bg-[#0F2B3C] text-white rounded-lg active:scale-95"><Plus size={14} /></button>
                    <button onClick={() => { setAddingTo(null); setNewTask(''); }} className="p-2 text-neutral-400"><X size={14} /></button>
                  </div>
                ) : (
                  <button onClick={() => setAddingTo(ws)} className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-blue-900 pt-2 transition-colors">
                    <Plus size={12} /> Add Task
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ─── Budget tab ──────────────────────────────────────────────────────

const BudgetTab: React.FC<{ venture: Venture; onUpdate: (p: Partial<Venture>) => void }> = ({ venture, onUpdate }) => {
  const startup = venture.budgetItems.filter(b => b.kind === 'STARTUP');
  const monthly = venture.budgetItems.filter(b => b.kind === 'MONTHLY');
  const startupTotal = startup.reduce((s, b) => s + (b.estimated || 0), 0);
  const monthlyTotal = monthly.reduce((s, b) => s + (b.estimated || 0), 0);
  const revenue = venture.monthlyRevenueTarget || 0;
  const monthlyProfit = revenue - monthlyTotal;
  const monthsToBreakEven = monthlyProfit > 0 && startupTotal > 0 ? Math.ceil(startupTotal / monthlyProfit) : null;

  const updateItem = (id: string, patch: Partial<VentureBudgetItem>) => {
    onUpdate({ budgetItems: venture.budgetItems.map(b => (b.id === id ? { ...b, ...patch } : b)) });
  };
  const addItem = (kind: 'STARTUP' | 'MONTHLY') => {
    onUpdate({ budgetItems: [...venture.budgetItems, { id: uid(), label: '', kind, estimated: 0 }] });
  };
  const removeItem = (id: string) => {
    onUpdate({ budgetItems: venture.budgetItems.filter(b => b.id !== id) });
  };

  const renderTable = (items: VentureBudgetItem[], kind: 'STARTUP' | 'MONTHLY', title: string, subtitle: string, total: number) => (
    <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-xs font-black uppercase tracking-widest text-neutral-400">{title}</h3>
        <span className="font-black text-[#0F2B3C]">{fmtMoney(total)}</span>
      </div>
      <p className="text-xs text-neutral-400 mb-4">{subtitle}</p>
      {items.length > 0 && (
        <div className="space-y-2 mb-3">
          <div className="grid grid-cols-[1fr_5.5rem_5.5rem_1.5rem] gap-2 px-1">
            <SectionLabel>Item</SectionLabel>
            <SectionLabel className="text-right">Estimated</SectionLabel>
            <SectionLabel className="text-right">Actual</SectionLabel>
            <span />
          </div>
          {items.map(b => (
            <div key={b.id} className="grid grid-cols-[1fr_5.5rem_5.5rem_1.5rem] gap-2 items-center group">
              <input
                value={b.label}
                onChange={e => updateItem(b.id, { label: e.target.value })}
                placeholder={kind === 'STARTUP' ? 'e.g., Equipment, LLC filing, deposit...' : 'e.g., Rent, software, payroll...'}
                className="bg-neutral-50 border border-neutral-100 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-900 focus:bg-white min-w-0"
              />
              <input
                type="number"
                min={0}
                value={b.estimated || ''}
                onChange={e => updateItem(b.id, { estimated: parseFloat(e.target.value) || 0 })}
                placeholder="0"
                className="bg-neutral-50 border border-neutral-100 rounded-lg px-2 py-2 text-sm text-right outline-none focus:border-blue-900 focus:bg-white"
              />
              <input
                type="number"
                min={0}
                value={b.actual ?? ''}
                onChange={e => updateItem(b.id, { actual: e.target.value === '' ? undefined : parseFloat(e.target.value) || 0 })}
                placeholder="—"
                className="bg-neutral-50 border border-neutral-100 rounded-lg px-2 py-2 text-sm text-right outline-none focus:border-blue-900 focus:bg-white"
              />
              <button onClick={() => removeItem(b.id)} className="opacity-0 group-hover:opacity-100 text-neutral-300 hover:text-red-500 transition-all">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
      <button onClick={() => addItem(kind)} className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-blue-900 transition-colors">
        <Plus size={12} /> Add Line Item
      </button>
    </div>
  );

  return (
    <div className="space-y-5">
      {renderTable(startup, 'STARTUP', 'Startup Costs (One-Time)', 'Everything it takes to get to opening day.', startupTotal)}
      {renderTable(monthly, 'MONTHLY', 'Monthly Operating Costs', 'Your recurring burn once you\'re running.', monthlyTotal)}

      {/* Break-even */}
      <div className="bg-[#0F2B3C] rounded-xl shadow-sm p-5 text-white">
        <h3 className="text-xs font-black uppercase tracking-widest text-white/50 mb-4">Break-Even Math</h3>
        <div className="grid sm:grid-cols-2 gap-5 items-end">
          <div>
            <SectionLabel className="!text-white/50 mb-2">Monthly Revenue Target</SectionLabel>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 font-black">$</span>
              <input
                type="number"
                min={0}
                value={venture.monthlyRevenueTarget || ''}
                onChange={e => onUpdate({ monthlyRevenueTarget: parseFloat(e.target.value) || 0 })}
                placeholder="0"
                className="w-full bg-white/10 border border-white/10 rounded-lg pl-7 pr-3 py-2.5 font-black outline-none focus:border-white/40 text-white placeholder:text-white/30"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className={`text-2xl font-black ${monthlyProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {revenue > 0 || monthlyTotal > 0 ? fmtMoney(monthlyProfit) : '—'}
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest text-white/50 mt-1">Monthly Profit</div>
            </div>
            <div>
              <div className="text-2xl font-black text-amber-400">
                {monthsToBreakEven !== null ? `${monthsToBreakEven} mo` : '—'}
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest text-white/50 mt-1">To Recoup Startup</div>
            </div>
          </div>
        </div>
        {revenue > 0 && monthlyProfit <= 0 && (
          <p className="text-xs text-red-300 font-bold mt-4">
            At this revenue target you lose money every month — raise prices, cut monthly costs, or rethink the target.
          </p>
        )}
      </div>
    </div>
  );
};

// ─── Pitch tab ───────────────────────────────────────────────────────

const PitchTab: React.FC<{ venture: Venture; onUpdate: (p: Partial<Venture>) => void }> = ({ venture, onUpdate }) => {
  const [copied, setCopied] = useState(false);
  const drafted = PITCH_SLIDES.filter(s => (venture.pitch[s.id] || '').trim()).length;

  const copyOutline = () => {
    const text = [
      `# ${venture.name} — Pitch Outline`,
      venture.oneLiner ? `> ${venture.oneLiner}\n` : '',
      ...PITCH_SLIDES.map((s, i) => {
        const content = (venture.pitch[s.id] || '').trim();
        return `## ${i + 1}. ${s.title}\n${content || '_(not drafted yet)_'}`;
      }),
    ].filter(Boolean).join('\n\n');
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-5 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h3 className="font-black text-[#0F2B3C] text-sm">Pitch Deck Outline</h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            {drafted}/{PITCH_SLIDES.length} slides drafted — answer each prompt, then build the real deck from this outline.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-24"><ProgressBar percent={(drafted / PITCH_SLIDES.length) * 100} color="#EC4899" /></div>
          <button
            onClick={copyOutline}
            className="flex items-center gap-2 bg-[#0F2B3C] text-white font-black text-[10px] uppercase tracking-widest px-4 py-2.5 rounded-lg active:scale-95 transition-all"
          >
            {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? 'Copied!' : 'Copy Outline'}
          </button>
        </div>
      </div>

      {PITCH_SLIDES.map((slide, i) => {
        const content = venture.pitch[slide.id] || '';
        const hasContent = content.trim().length > 0;
        return (
          <div key={slide.id} className="bg-white rounded-xl border border-neutral-100 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-1">
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${hasContent ? 'bg-pink-500 text-white' : 'bg-neutral-100 text-neutral-400'}`}
              >
                {hasContent ? <Check size={12} strokeWidth={4} /> : i + 1}
              </span>
              <h4 className="font-black text-[#0F2B3C] text-sm">{slide.title}</h4>
            </div>
            <p className="text-xs text-neutral-400 mb-3 ml-9">{slide.prompt}</p>
            <textarea
              value={content}
              onChange={e => onUpdate({ pitch: { ...venture.pitch, [slide.id]: e.target.value } })}
              placeholder={slide.placeholder}
              rows={hasContent ? Math.min(6, Math.max(2, content.split('\n').length)) : 2}
              className="w-full bg-neutral-50 border border-neutral-100 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-900 focus:bg-white resize-y transition-colors"
            />
          </div>
        );
      })}
    </div>
  );
};

// ─── Notes tab ───────────────────────────────────────────────────────

const NotesTab: React.FC<{ venture: Venture; onUpdate: (p: Partial<Venture>) => void }> = ({ venture, onUpdate }) => {
  const [noteDraft, setNoteDraft] = useState('');
  const [linkLabel, setLinkLabel] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [addingLink, setAddingLink] = useState(false);

  const addNote = () => {
    if (!noteDraft.trim()) return;
    const note: VentureNote = { id: uid(), text: noteDraft.trim(), createdAt: new Date().toISOString() };
    onUpdate({ notes: [note, ...venture.notes] });
    setNoteDraft('');
  };

  const addLink = () => {
    if (!linkUrl.trim()) return;
    const url = linkUrl.trim().startsWith('http') ? linkUrl.trim() : `https://${linkUrl.trim()}`;
    const link: VentureLink = { id: uid(), label: linkLabel.trim() || linkUrl.trim(), url };
    onUpdate({ links: [...venture.links, link] });
    setLinkLabel(''); setLinkUrl(''); setAddingLink(false);
  };

  const sortedNotes = useMemo(
    () => [...venture.notes].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.createdAt.localeCompare(a.createdAt)),
    [venture.notes]
  );

  return (
    <div className="space-y-5">
      {/* Links */}
      <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-5">
        <h3 className="text-xs font-black uppercase tracking-widest text-neutral-400 mb-3">Links & Resources</h3>
        {venture.links.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {venture.links.map(l => (
              <span key={l.id} className="group inline-flex items-center gap-1.5 bg-blue-50 text-blue-800 rounded-lg pl-3 pr-2 py-1.5 text-xs font-bold">
                <LinkIcon size={11} />
                <a href={l.url} target="_blank" rel="noopener noreferrer" className="hover:underline">{l.label}</a>
                <button
                  onClick={() => onUpdate({ links: venture.links.filter(x => x.id !== l.id) })}
                  className="opacity-40 hover:opacity-100 transition-opacity"
                ><X size={11} /></button>
              </span>
            ))}
          </div>
        )}
        {addingLink ? (
          <div className="flex flex-col sm:flex-row gap-2">
            <input value={linkLabel} onChange={e => setLinkLabel(e.target.value)} placeholder="Label (e.g., Domain registrar)"
              className="flex-1 bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-900" />
            <input value={linkUrl} onChange={e => setLinkUrl(e.target.value)} onKeyDown={e => e.key === 'Enter' && addLink()} placeholder="URL"
              className="flex-1 bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-900" />
            <div className="flex gap-2">
              <button onClick={addLink} className="p-2 bg-[#0F2B3C] text-white rounded-lg active:scale-95"><Plus size={14} /></button>
              <button onClick={() => setAddingLink(false)} className="p-2 text-neutral-400"><X size={14} /></button>
            </div>
          </div>
        ) : (
          <button onClick={() => setAddingLink(true)} className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-blue-900 transition-colors">
            <Plus size={12} /> Add Link
          </button>
        )}
      </div>

      {/* Notes */}
      <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-5">
        <h3 className="text-xs font-black uppercase tracking-widest text-neutral-400 mb-3">Notes</h3>
        <div className="flex gap-2 mb-4">
          <textarea
            value={noteDraft}
            onChange={e => setNoteDraft(e.target.value)}
            placeholder="Customer conversations, supplier quotes, random thoughts — dump it all here."
            rows={2}
            className="flex-1 bg-neutral-50 border border-neutral-100 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-900 focus:bg-white resize-y"
          />
          <button onClick={addNote} disabled={!noteDraft.trim()}
            className="bg-[#0F2B3C] text-white font-black px-4 rounded-lg active:scale-95 transition-all disabled:opacity-40 self-stretch">
            <Plus size={16} />
          </button>
        </div>
        {sortedNotes.length === 0 ? (
          <p className="text-xs text-neutral-300 italic">No notes yet.</p>
        ) : (
          <div className="space-y-2">
            {sortedNotes.map(n => (
              <div key={n.id} className={`group rounded-lg border p-3 ${n.pinned ? 'bg-amber-50/50 border-amber-100' : 'bg-neutral-50/50 border-neutral-100'}`}>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm text-neutral-700 whitespace-pre-wrap flex-1">{n.text}</p>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      onClick={() => onUpdate({ notes: venture.notes.map(x => x.id === n.id ? { ...x, pinned: !x.pinned } : x) })}
                      className={`p-1 rounded ${n.pinned ? 'text-amber-500' : 'text-neutral-300 hover:text-amber-500'}`}
                    ><Pin size={13} /></button>
                    <button
                      onClick={() => onUpdate({ notes: venture.notes.filter(x => x.id !== n.id) })}
                      className="p-1 rounded text-neutral-300 hover:text-red-500"
                    ><Trash2 size={13} /></button>
                  </div>
                </div>
                <div className="text-[10px] font-bold text-neutral-300 mt-1.5">
                  {n.pinned && <span className="text-amber-500 mr-2">PINNED</span>}
                  {new Date(n.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VenturesView;
