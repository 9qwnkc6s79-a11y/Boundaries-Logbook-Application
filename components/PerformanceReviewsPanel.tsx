import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ClipboardCheck, Lock, MessageSquare, Star, UserCheck } from 'lucide-react';
import { PerformanceReview, ReviewDirection, Store, User, UserRole } from '../types';
import { db } from '../services/db';
import {
  canEditReview,
  canWriteDown,
  canWriteUp,
  currentReviewPeriod,
  downSubjects,
  dueDownSubjects,
  dueUpSubjects,
  employeesDueToReviewManager,
  findReview,
  formatReviewPeriod,
  incomingSubmittedReviews,
  isSubmittedLocked,
  makeReviewId,
  storeLabel,
  upSubjects,
  visibleReviews,
} from '../utils/performanceReviews';

type Variant = 'workspace' | 'due-card' | 'staff';

interface PerformanceReviewsPanelProps {
  currentUser: User;
  allUsers: User[];
  storeId: string;
  stores?: Store[];
  variant: Variant;
  onOpenWorkspace?: () => void;
}

interface FormState {
  overall: number;
  keepDoing: string;
  startDoing: string;
  notes: string;
}

const EMPTY_FORM: FormState = { overall: 0, keepDoing: '', startDoing: '', notes: '' };

function formFromReview(review?: PerformanceReview): FormState {
  if (!review) return EMPTY_FORM;
  return {
    overall: review.overall || 0,
    keepDoing: review.keepDoing || '',
    startDoing: review.startDoing || '',
    notes: review.notes || '',
  };
}

function StarPicker({
  value,
  onChange,
  disabled,
  id,
}: {
  value: number;
  onChange: (n: number) => void;
  disabled?: boolean;
  id: string;
}) {
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-labelledby={id}>
      {[1, 2, 3, 4, 5].map(n => {
        const selected = n <= value;
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} out of 5`}
            disabled={disabled}
            onClick={() => onChange(n)}
            className={`p-1 rounded-lg transition-colors ${disabled ? 'cursor-not-allowed' : 'hover:bg-amber-50'}`}
          >
            <Star
              size={22}
              className={selected ? 'text-amber-500 fill-amber-500' : 'text-neutral-300'}
            />
          </button>
        );
      })}
    </div>
  );
}

function ReviewReadout({ review, showReviewer, stores }: { review: PerformanceReview; showReviewer?: boolean; stores?: Store[] }) {
  return (
    <div className="rounded-xl border border-neutral-100 bg-neutral-50/60 p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">
            {formatReviewPeriod(review.period)} · {review.direction === 'DOWN' ? 'Manager → Staff' : 'Staff → Manager'}
            {stores ? ` · ${storeLabel(stores, review.storeId)}` : ''}
          </div>
          <div className="text-xs font-black text-[#0F2B3C] uppercase tracking-tight mt-0.5">
            {showReviewer ? `From ${review.reviewerName}` : review.subjectName}
          </div>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          {[1, 2, 3, 4, 5].map(n => (
            <Star key={n} size={12} className={n <= review.overall ? 'text-amber-500 fill-amber-500' : 'text-neutral-200'} />
          ))}
        </div>
      </div>
      {review.keepDoing && (
        <p className="text-xs text-neutral-600"><span className="font-black text-[#0F2B3C] uppercase tracking-widest text-[9px]">Keep doing · </span>{review.keepDoing}</p>
      )}
      {review.startDoing && (
        <p className="text-xs text-neutral-600"><span className="font-black text-[#0F2B3C] uppercase tracking-widest text-[9px]">Start doing · </span>{review.startDoing}</p>
      )}
      {review.notes && (
        <p className="text-xs text-neutral-600"><span className="font-black text-[#0F2B3C] uppercase tracking-widest text-[9px]">Notes · </span>{review.notes}</p>
      )}
      <div className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">
        {review.status === 'SUBMITTED' ? 'Submitted' : 'Draft'}
        {showReviewer ? ` · ${review.reviewerName}` : ''}
      </div>
    </div>
  );
}

function ReviewForm({
  subject,
  existing,
  currentUser,
  storeId,
  direction,
  period,
  disabled,
  onSaved,
}: {
  subject: User;
  existing?: PerformanceReview;
  currentUser: User;
  storeId: string;
  direction: ReviewDirection;
  period: string;
  disabled?: boolean;
  onSaved: (reviews: PerformanceReview[]) => void;
}) {
  const locked = existing ? isSubmittedLocked(existing) : false;
  const editable = !disabled && (!existing || canEditReview(existing, currentUser));
  const [form, setForm] = useState<FormState>(() => formFromReview(existing));
  const [saving, setSaving] = useState<'IDLE' | 'DRAFT' | 'SUBMIT' | 'SAVED' | 'ERROR'>('IDLE');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm(formFromReview(existing));
    setSaving('IDLE');
    setError(null);
  }, [existing?.id, existing?.updatedAt, subject.id, direction, period]);

  const persist = async (status: 'DRAFT' | 'SUBMITTED') => {
    if (!editable) return;
    if (!form.overall) {
      setError('Overall rating (1–5) is required.');
      return;
    }
    setError(null);
    setSaving(status === 'DRAFT' ? 'DRAFT' : 'SUBMIT');
    const now = new Date().toISOString();
    const review: PerformanceReview = {
      id: makeReviewId(currentUser.id, subject.id, period, direction),
      reviewerId: currentUser.id,
      reviewerName: currentUser.name,
      subjectId: subject.id,
      subjectName: subject.name,
      storeId,
      period,
      direction,
      status,
      overall: form.overall,
      keepDoing: form.keepDoing,
      startDoing: form.startDoing,
      notes: form.notes,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
      submittedAt: status === 'SUBMITTED' ? now : undefined,
    };
    const next = await db.pushPerformanceReview(review);
    if (!next) {
      setSaving('ERROR');
      setError(status === 'SUBMITTED' && existing && isSubmittedLocked(existing)
        ? 'This review is already submitted and locked.'
        : 'Could not save. Try again in a moment.');
      return;
    }
    onSaved(next);
    setSaving('SAVED');
  };

  return (
    <div className="space-y-3">
      <div>
        <label id={`overall-${subject.id}-${direction}`} className="text-[9px] font-black text-neutral-400 uppercase tracking-widest block mb-1">
          Overall (required)
        </label>
        <StarPicker
          id={`overall-${subject.id}-${direction}`}
          value={form.overall}
          onChange={n => setForm(f => ({ ...f, overall: n }))}
          disabled={!editable}
        />
      </div>
      {([
        ['keepDoing', 'Keep doing'],
        ['startDoing', 'Start doing'],
        ['notes', 'Notes'],
      ] as const).map(([key, label]) => (
        <div key={key}>
          <label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest block mb-1" htmlFor={`${key}-${subject.id}-${direction}`}>
            {label} <span className="text-neutral-300">optional</span>
          </label>
          <textarea
            id={`${key}-${subject.id}-${direction}`}
            rows={2}
            disabled={!editable}
            value={form[key]}
            onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
            className="w-full bg-neutral-50 border border-neutral-100 rounded-xl px-3 py-2 text-sm font-medium text-[#0F2B3C] outline-none focus:bg-white focus:ring-4 focus:ring-[#0F2B3C]/10 focus:border-[#0F2B3C] disabled:opacity-70"
          />
        </div>
      ))}

      {locked && (
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-neutral-500">
          <Lock size={12} /> Submitted · locked
        </div>
      )}
      {error && <p className="text-xs font-bold text-red-600">{error}</p>}

      {editable && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => persist('DRAFT')}
            disabled={saving === 'DRAFT' || saving === 'SUBMIT'}
            className="flex-1 py-3 bg-neutral-100 text-neutral-600 font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-neutral-200 disabled:opacity-50"
          >
            {saving === 'DRAFT' ? 'Saving…' : 'Save draft'}
          </button>
          <button
            type="button"
            onClick={() => persist('SUBMITTED')}
            disabled={saving === 'DRAFT' || saving === 'SUBMIT'}
            className="flex-1 py-3 bg-[#0F2B3C] text-white font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-[#1a3d52] disabled:opacity-50"
          >
            {saving === 'SUBMIT' ? 'Submitting…' : 'Submit'}
          </button>
        </div>
      )}
      {saving === 'SAVED' && !locked && (
        <p className="text-[10px] font-black uppercase tracking-widest text-green-600 flex items-center gap-1">
          <CheckCircle2 size={12} /> Saved
        </p>
      )}
    </div>
  );
}

const PerformanceReviewsPanel: React.FC<PerformanceReviewsPanelProps> = ({
  currentUser,
  allUsers,
  storeId,
  stores = [],
  variant,
  onOpenWorkspace,
}) => {
  const period = useMemo(() => currentReviewPeriod(), []);
  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string>('');

  const load = useCallback(async () => {
    try {
      const all = await db.fetchPerformanceReviews();
      setReviews(visibleReviews(all, currentUser));
    } catch (err) {
      console.error('[PerformanceReviews] fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    load();
  }, [load]);

  const visible = reviews;
  const downDue = useMemo(
    () => canWriteDown(currentUser) ? dueDownSubjects(allUsers, visible, currentUser, storeId, period) : [],
    [allUsers, visible, currentUser, storeId, period]
  );
  const upDue = useMemo(
    () => canWriteUp(currentUser) ? dueUpSubjects(allUsers, visible, currentUser, storeId, period) : [],
    [allUsers, visible, currentUser, storeId, period]
  );
  const incomingDue = useMemo(
    () => currentUser.role === UserRole.MANAGER
      ? employeesDueToReviewManager(allUsers, visible, currentUser, storeId, period)
      : [],
    [allUsers, visible, currentUser, storeId, period]
  );
  const incomingAboutMe = useMemo(
    () => incomingSubmittedReviews(visible, currentUser.id),
    [visible, currentUser.id]
  );

  const workspaceSubjects = useMemo(() => {
    if (canWriteDown(currentUser)) return downSubjects(allUsers, currentUser, storeId);
    if (canWriteUp(currentUser)) return upSubjects(allUsers, currentUser, storeId);
    return [];
  }, [allUsers, currentUser, storeId]);

  useEffect(() => {
    if (!selectedId && workspaceSubjects[0]) {
      setSelectedId(workspaceSubjects[0].id);
    }
  }, [selectedId, workspaceSubjects]);

  const selected = workspaceSubjects.find(u => u.id === selectedId);
  const formDirection: ReviewDirection = canWriteDown(currentUser) ? 'DOWN' : 'UP';
  const existingForSelected = selected
    ? findReview(visible, currentUser.id, selected.id, period, formDirection)
    : undefined;
  const historyForSelected = selected
    ? visible
        .filter(r => r.subjectId === selected.id && (currentUser.role === UserRole.ADMIN || r.reviewerId === currentUser.id))
        .sort((a, b) => b.period.localeCompare(a.period) || b.updatedAt.localeCompare(a.updatedAt))
    : [];

  const monthLabel = formatReviewPeriod(period);
  const dueCount = canWriteDown(currentUser) ? downDue.length : upDue.length;

  if (variant === 'due-card') {
    return (
      <section className="bg-white p-4 md:p-6 rounded-xl border border-neutral-100 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-[#0F2B3C] text-white rounded-xl">
            <UserCheck size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-black text-[#0F2B3C] uppercase tracking-tight">Reviews</h2>
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{monthLabel} · America/Chicago</p>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-black ${dueCount > 0 ? 'text-amber-600' : 'text-green-600'}`}>{loading ? '—' : dueCount}</div>
            <div className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Due</div>
          </div>
        </div>

        {canWriteDown(currentUser) && (
          <div className="mb-3">
            <div className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-2">Staff still due (your DOWN reviews)</div>
            {downDue.length === 0 ? (
              <p className="text-xs font-medium text-green-700">All store staff reviewed for this month.</p>
            ) : (
              <ul className="space-y-1">
                {downDue.slice(0, 8).map(u => (
                  <li key={u.id} className="text-xs font-bold text-[#0F2B3C]">{u.name}</li>
                ))}
                {downDue.length > 8 && (
                  <li className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">+{downDue.length - 8} more</li>
                )}
              </ul>
            )}
          </div>
        )}

        {currentUser.role === UserRole.MANAGER && (
          <div className="mb-3">
            <div className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-2">Incoming UP still due (about you)</div>
            {incomingDue.length === 0 ? (
              <p className="text-xs font-medium text-green-700">Everyone who can review you has submitted.</p>
            ) : (
              <ul className="space-y-1">
                {incomingDue.slice(0, 8).map(u => (
                  <li key={u.id} className="text-xs font-bold text-[#0F2B3C]">{u.name}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {currentUser.role === UserRole.MANAGER && incomingAboutMe.length > 0 && (
          <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-3">
            {incomingAboutMe.length} submitted review{incomingAboutMe.length === 1 ? '' : 's'} about you
          </p>
        )}

        <button
          type="button"
          onClick={onOpenWorkspace}
          className="w-full py-2 bg-neutral-50 hover:bg-neutral-100 rounded-xl text-[9px] font-black text-neutral-600 uppercase tracking-widest transition-all"
        >
          Open reviews
        </button>
      </section>
    );
  }

  const subjects = workspaceSubjects;
  const dueList = formDirection === 'DOWN' ? downDue : upDue;
  const title = variant === 'staff' ? 'Review your manager' : 'Performance reviews';
  const emptyHint = formDirection === 'UP'
    ? 'No store manager to review this month. ADMIN accounts are not review targets.'
    : 'No active employees on this store.';

  return (
    <section className="bg-white p-4 md:p-6 rounded-xl border border-neutral-100 shadow-sm space-y-5">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-[#0F2B3C] text-white rounded-xl">
          {variant === 'staff' ? <MessageSquare size={16} /> : <ClipboardCheck size={16} />}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-black text-[#0F2B3C] uppercase tracking-tight">{title}</h2>
          <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
            {monthLabel} · named, not anonymous · {formDirection === 'DOWN' ? 'you review staff' : 'you review your GM'}
          </p>
        </div>
      </div>

      {dueList.length > 0 && (
        <div className="rounded-xl border border-amber-100 bg-amber-50/70 p-3">
          <div className="text-[9px] font-black text-amber-700 uppercase tracking-widest mb-1">Still due this month</div>
          <p className="text-xs font-bold text-[#0F2B3C]">{dueList.map(u => u.name).join(', ')}</p>
        </div>
      )}
      {dueList.length === 0 && subjects.length > 0 && (
        <div className="rounded-xl border border-green-100 bg-green-50/70 p-3 text-xs font-bold text-green-800">
          All {formDirection === 'DOWN' ? 'staff' : 'manager'} reviews submitted for {monthLabel}.
        </div>
      )}

      {subjects.length === 0 ? (
        <p className="text-sm font-medium text-neutral-500">{emptyHint}</p>
      ) : (
        <>
          <div>
            <label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest block mb-1" htmlFor="review-subject">
              {formDirection === 'DOWN' ? 'Employee' : 'Store manager'}
            </label>
            <select
              id="review-subject"
              value={selectedId}
              onChange={e => setSelectedId(e.target.value)}
              className="w-full bg-neutral-50 border border-neutral-100 rounded-xl px-3 py-3 text-sm font-bold text-[#0F2B3C] outline-none focus:ring-4 focus:ring-[#0F2B3C]/10 focus:border-[#0F2B3C]"
            >
              {subjects.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name}{dueList.some(d => d.id === u.id) ? ' · due' : ' · submitted'}
                </option>
              ))}
            </select>
          </div>

          {selected && (
            <ReviewForm
              subject={selected}
              existing={existingForSelected}
              currentUser={currentUser}
              storeId={storeId}
              direction={formDirection}
              period={period}
              onSaved={next => setReviews(visibleReviews(next, currentUser))}
            />
          )}

          {historyForSelected.length > 0 && (
            <div className="space-y-2">
              <div className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">History</div>
              {historyForSelected.map(r => (
                <div key={r.id}>
                  <ReviewReadout review={r} showReviewer={currentUser.role === UserRole.ADMIN && r.reviewerId !== currentUser.id} stores={currentUser.role === UserRole.ADMIN ? stores : undefined} />
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {variant === 'staff' && (
        <div className="space-y-2 pt-2 border-t border-neutral-100">
          <div className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Reviews about you</div>
          {incomingAboutMe.length === 0 ? (
            <p className="text-xs font-medium text-neutral-500">No submitted reviews about you yet.</p>
          ) : (
            incomingAboutMe.map(r => (
              <div key={r.id}>
                <ReviewReadout review={r} showReviewer stores={stores} />
              </div>
            ))
          )}
        </div>
      )}

      {variant === 'workspace' && currentUser.role === UserRole.MANAGER && (
        <div className="space-y-2 pt-2 border-t border-neutral-100">
          <div className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Incoming UP reviews about you</div>
          {incomingAboutMe.filter(r => r.direction === 'UP').length === 0 ? (
            <p className="text-xs font-medium text-neutral-500">None submitted this cycle yet.</p>
          ) : (
            incomingAboutMe.filter(r => r.direction === 'UP').map(r => (
              <div key={r.id}>
                <ReviewReadout review={r} showReviewer />
              </div>
            ))
          )}
        </div>
      )}

      {variant === 'workspace' && currentUser.role === UserRole.ADMIN && (
        <div className="space-y-2 pt-2 border-t border-neutral-100">
          <div className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">All stores · submitted</div>
          {visible.filter(r => r.status === 'SUBMITTED').length === 0 ? (
            <p className="text-xs font-medium text-neutral-500">No submitted reviews yet.</p>
          ) : (
            visible
              .filter(r => r.status === 'SUBMITTED')
              .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
              .slice(0, 20)
              .map(r => (
                <div key={r.id}>
                  <ReviewReadout review={r} showReviewer stores={stores} />
                </div>
              ))
          )}
        </div>
      )}
    </section>
  );
};

export default PerformanceReviewsPanel;
