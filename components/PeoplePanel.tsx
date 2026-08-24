import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Users } from 'lucide-react';
import { PerformanceReview, SopReviewType, Store, TeamPerformanceReview, User } from '../types';
import { db } from '../services/db';
import {
  SOP_DISCIPLINARY_LABELS,
  canWriteSopReview,
  chicagoMonth,
  chicagoYmd,
  formatSopPeriod,
  formatSopReviewType,
  latestSubmittedSop,
  primarySopDue,
  rosterRoleLabel,
  sopCheckpoints,
  storeRoster,
} from '../utils/teamPerformanceReviews';
import { formatReviewPeriod, storeLabel } from '../utils/performanceReviews';
import TeamPerformanceReviewForm from './TeamPerformanceReviewForm';

interface PeoplePanelProps {
  currentUser: User;
  allUsers: User[];
  storeId: string;
  stores?: Store[];
  variant?: 'workspace' | 'due-card';
  onOpenWorkspace?: () => void;
}

interface FormTarget {
  reviewType: SopReviewType;
  period: string;
}

function formatDisplayDate(ymd?: string): string {
  if (!ymd) return '—';
  const [year, month, day] = ymd.split('-').map(Number);
  if (!year || !month || !day) return ymd;
  return new Date(year, month - 1, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const PeoplePanel: React.FC<PeoplePanelProps> = ({
  currentUser,
  allUsers,
  storeId,
  stores,
  variant = 'workspace',
  onOpenWorkspace,
}) => {
  const [reviews, setReviews] = useState<TeamPerformanceReview[]>([]);
  const [legacyReviews, setLegacyReviews] = useState<PerformanceReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formTarget, setFormTarget] = useState<FormTarget | null>(null);

  const load = useCallback(async () => {
    try {
      const [all, legacy] = await Promise.all([
        db.fetchTeamPerformanceReviews(),
        variant === 'workspace'
          ? db.fetchPerformanceReviews().catch(() => [] as PerformanceReview[])
          : Promise.resolve([] as PerformanceReview[]),
      ]);
      setReviews(Array.isArray(all) ? all : []);
      setLegacyReviews(Array.isArray(legacy) ? legacy : []);
    } catch (err) {
      console.error('[People] fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, [variant]);

  useEffect(() => {
    load();
  }, [load, storeId]);

  useEffect(() => {
    setSelectedId(null);
    setFormTarget(null);
  }, [storeId]);

  const roster = useMemo(() => storeRoster(allUsers, storeId), [allUsers, storeId]);
  const selected = roster.find(u => u.id === selectedId) || null;
  const allowed = canWriteSopReview(currentUser);
  const month = useMemo(() => chicagoMonth(), []);

  const rows = useMemo(() => {
    const today = chicagoYmd();
    return roster.map(user => {
      const last = latestSubmittedSop(reviews, user.id);
      const lastDate = last ? (last.submittedAt || last.reviewDate || last.updatedAt).slice(0, 10) : undefined;
      const due = primarySopDue(user, reviews);
      const checkpoints = sopCheckpoints(user.id, reviews);
      return {
        user,
        lastDate,
        lastPeriod: last ? formatSopPeriod(last.period) : undefined,
        due: due.dueYmd,
        overdue: due.overdue,
        dueToday: due.dueYmd === today,
        dueLabel: due.label,
        checkpoints,
      };
    });
  }, [roster, reviews]);

  const monthlyDue = useMemo(
    () => rows.filter(row => !row.checkpoints.find(c => c.cadence === 'MONTHLY')?.submitted),
    [rows]
  );
  const quarterlyDue = useMemo(
    () => rows.filter(row => {
      const q = row.checkpoints.find(c => c.cadence === 'QUARTERLY');
      return q && !q.submitted;
    }),
    [rows]
  );
  const annualDue = useMemo(
    () => rows.filter(row => {
      const a = row.checkpoints.find(c => c.cadence === 'ANNUAL');
      return a && !a.submitted;
    }),
    [rows]
  );
  const overdueCount = useMemo(
    () => rows.filter(row => row.checkpoints.some(c => c.overdue)).length,
    [rows]
  );

  const openAccount = (userId: string) => {
    setSelectedId(userId);
    setFormTarget(null);
  };

  const startReview = (reviewType: SopReviewType, period: string) => {
    setFormTarget({ reviewType, period });
  };

  if (!allowed) {
    if (variant === 'due-card') return null;
    return (
      <section className="bg-white p-6 rounded-xl border border-neutral-100 shadow-sm">
        <p className="text-sm font-bold text-neutral-500">SOP reviews are completed by GMs and ADMIN only.</p>
      </section>
    );
  }

  if (variant === 'due-card') {
    return (
      <section className="bg-white p-4 md:p-6 rounded-xl border border-neutral-100 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-[#0F2B3C] text-white rounded-xl">
            <Users size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-black text-[#0F2B3C] uppercase tracking-tight">People reviews</h2>
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
              {formatSopPeriod(month.id)} · America/Chicago
            </p>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-black ${monthlyDue.length > 0 ? 'text-amber-600' : 'text-green-600'}`}>
              {loading ? '—' : monthlyDue.length}
            </div>
            <div className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Monthly due</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="rounded-xl border border-neutral-100 bg-neutral-50/40 p-3">
            <div className={`text-lg font-black ${quarterlyDue.length > 0 ? 'text-amber-600' : 'text-[#0F2B3C]'}`}>
              {loading ? '—' : quarterlyDue.length}
            </div>
            <div className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Quarterly checkpoint</div>
          </div>
          <div className="rounded-xl border border-neutral-100 bg-neutral-50/40 p-3">
            <div className={`text-lg font-black ${annualDue.length > 0 ? 'text-amber-600' : 'text-[#0F2B3C]'}`}>
              {loading ? '—' : annualDue.length}
            </div>
            <div className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Annual checkpoint</div>
          </div>
        </div>

        {overdueCount > 0 && (
          <p className="text-xs font-black text-red-600 mb-3">{overdueCount} overdue</p>
        )}

        <div className="mb-3">
          <div className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-2">
            Still due this month
          </div>
          {monthlyDue.length === 0 ? (
            <p className="text-xs font-medium text-green-700">All store staff have a monthly review for {formatSopPeriod(month.id)}.</p>
          ) : (
            <ul className="space-y-1">
              {monthlyDue.slice(0, 8).map(row => (
                <li key={row.user.id} className="text-xs font-bold text-[#0F2B3C]">{row.user.name}</li>
              ))}
              {monthlyDue.length > 8 && (
                <li className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">+{monthlyDue.length - 8} more</li>
              )}
            </ul>
          )}
        </div>

        <button
          type="button"
          onClick={onOpenWorkspace}
          className="w-full py-2 bg-neutral-50 hover:bg-neutral-100 rounded-xl text-[9px] font-black text-neutral-600 uppercase tracking-widest transition-all"
        >
          Open People
        </button>
      </section>
    );
  }

  const accountReviews = selected
    ? reviews
        .filter(r => r.subjectId === selected.id)
        .sort((a, b) => (b.submittedAt || b.updatedAt).localeCompare(a.submittedAt || a.updatedAt))
    : [];
  const accountFiles = accountReviews.filter(r => r.status === 'SUBMITTED' && r.disciplinaryStatus !== 'NO_CONCERNS');
  const lastSubmitted = selected ? latestSubmittedSop(reviews, selected.id) : undefined;
  const accountCheckpoints = selected ? sopCheckpoints(selected.id, reviews) : [];
  const legacyAbout = selected
    ? legacyReviews
        .filter(r => r.subjectId === selected.id && r.status === 'SUBMITTED')
        .sort((a, b) => b.period.localeCompare(a.period) || b.updatedAt.localeCompare(a.updatedAt))
    : [];

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <section className="bg-white p-4 md:p-6 rounded-xl border border-neutral-100 shadow-sm">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 bg-[#0F2B3C] text-white rounded-xl"><Users size={16} /></div>
          <div>
            <h2 className="text-lg md:text-xl font-black text-[#0F2B3C] uppercase tracking-tight">People</h2>
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
              {storeLabel(stores, storeId)} · Roster accounts
            </p>
          </div>
        </div>
      </section>

      {selected && formTarget ? (
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setFormTarget(null)}
            className="text-[9px] font-black uppercase tracking-widest text-neutral-500 hover:text-[#0F2B3C] flex items-center gap-1"
          >
            <ArrowLeft size={12} /> Back to {selected.name}
          </button>
          <TeamPerformanceReviewForm
            currentUser={currentUser}
            subject={selected}
            storeId={storeId}
            reviews={reviews}
            reviewType={formTarget.reviewType}
            period={formTarget.period}
            onSaved={next => {
              setReviews(next);
            }}
          />
        </div>
      ) : selected ? (
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setSelectedId(null)}
            className="text-[9px] font-black uppercase tracking-widest text-neutral-500 hover:text-[#0F2B3C] flex items-center gap-1"
          >
            <ArrowLeft size={12} /> Back to roster
          </button>

          <section className="bg-white border border-neutral-100 rounded-xl shadow-sm p-4 md:p-5 space-y-4">
            <div>
              <h3 className="text-xl font-black text-[#0F2B3C]">{selected.name}</h3>
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                {rosterRoleLabel(selected)} · {storeLabel(stores, storeId)}
              </p>
            </div>

            <div>
              <div className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-2">Due</div>
              <div className="space-y-2">
                {accountCheckpoints.map(point => (
                  <div
                    key={`${point.reviewType}:${point.period}`}
                    className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-xl border border-neutral-100 px-3 py-2"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-black text-[#0F2B3C]">{point.label}</div>
                      <div className={`text-[10px] font-black uppercase tracking-widest ${point.overdue ? 'text-red-600' : 'text-neutral-400'}`}>
                        Due {formatDisplayDate(point.dueYmd)}
                        {point.submitted ? ' · Done' : point.overdue ? ' · Overdue' : ''}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => startReview(point.reviewType, point.period)}
                      className="px-3 py-2 rounded-xl bg-[#0F2B3C] text-white text-[9px] font-black uppercase tracking-widest"
                    >
                      {point.submitted ? 'View / update' : `Submit ${point.cadence === 'MONTHLY' ? 'monthly' : 'checkpoint'}`}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="bg-white border border-neutral-100 rounded-xl shadow-sm p-4 md:p-5 space-y-3">
            <h3 className="text-sm font-black text-[#0F2B3C] uppercase tracking-tight">Files</h3>
            <p className="text-xs font-semibold text-neutral-600">
              Strikes on file: {lastSubmitted?.strikesOnFile ?? 0}
            </p>
            {accountFiles.length === 0 ? (
              <p className="text-xs font-medium text-neutral-500">No strikes, tardy / no-show, or PIP on file.</p>
            ) : (
              <ul className="space-y-2">
                {accountFiles.map(file => (
                  <li key={file.id} className="text-xs font-semibold text-[#0F2B3C]">
                    {SOP_DISCIPLINARY_LABELS[file.disciplinaryStatus]}
                    {file.strikeNumber ? ` · #${file.strikeNumber}` : ''}
                    {file.strikeDate || file.tardyDate || file.pipDate
                      ? ` · ${formatDisplayDate(file.strikeDate || file.tardyDate || file.pipDate)}`
                      : ''}
                    {` · ${formatSopPeriod(file.period)}`}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="bg-white border border-neutral-100 rounded-xl shadow-sm p-4 md:p-5 space-y-3">
            <h3 className="text-sm font-black text-[#0F2B3C] uppercase tracking-tight">Review history</h3>
            {accountReviews.length === 0 ? (
              <p className="text-xs font-medium text-neutral-500">No SOP reviews on this account yet.</p>
            ) : (
              <ul className="space-y-2">
                {accountReviews.map(review => (
                  <li key={review.id}>
                    <button
                      type="button"
                      onClick={() => startReview(review.reviewType, review.period)}
                      className="w-full text-left rounded-xl border border-neutral-100 px-3 py-2 hover:bg-neutral-50"
                    >
                      <div className="text-sm font-black text-[#0F2B3C]">
                        {formatSopReviewType(review.reviewType)} · {formatSopPeriod(review.period)}
                      </div>
                      <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                        {review.status} · {review.reviewerName} · {review.overallRating ? `${review.overallRating}/5` : 'no score'}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {legacyAbout.length > 0 && (
              <div className="pt-2 border-t border-neutral-100 space-y-2">
                <div className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">
                  Earlier monthly notes (retired Reviews tab)
                </div>
                {legacyAbout.map(review => (
                  <div key={review.id} className="rounded-xl border border-neutral-100 px-3 py-2">
                    <div className="text-sm font-black text-[#0F2B3C]">{formatReviewPeriod(review.period)}</div>
                    <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                      {review.reviewerName} · {review.overall}/5
                    </div>
                    {(review.keepDoing || review.startDoing || review.notes) && (
                      <p className="text-xs text-neutral-600 mt-1">
                        {[review.keepDoing, review.startDoing, review.notes].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      ) : (
        <section className="bg-white rounded-xl border border-neutral-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-6 text-xs font-bold text-neutral-400 uppercase tracking-widest">Loading roster…</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[9px] font-black text-neutral-400 uppercase tracking-widest border-b border-neutral-100">
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Last SOP Review</th>
                    <th className="px-4 py-3">Next Due</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(row => (
                    <tr
                      key={row.user.id}
                      onClick={() => openAccount(row.user.id)}
                      className="border-b border-neutral-50 hover:bg-neutral-50 cursor-pointer"
                    >
                      <td className="px-4 py-3">
                        <div className="text-sm font-black text-[#0F2B3C]">{row.user.name}</div>
                      </td>
                      <td className="px-4 py-3 text-xs font-bold text-neutral-500 uppercase tracking-wide">{rosterRoleLabel(row.user)}</td>
                      <td className="px-4 py-3 text-xs font-semibold text-neutral-600">
                        {row.lastDate ? `${formatDisplayDate(row.lastDate)}${row.lastPeriod ? ` · ${row.lastPeriod}` : ''}` : '—'}
                      </td>
                      <td className={`px-4 py-3 text-xs font-black ${row.overdue ? 'text-red-600' : 'text-[#0F2B3C]'}`}>
                        <div>
                          {formatDisplayDate(row.due)}
                          {row.overdue ? ' · Overdue' : ''}
                        </div>
                        <div className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">{row.dueLabel}</div>
                        {row.checkpoints.some(c => c.cadence !== 'MONTHLY' && c.overdue) && (
                          <div className="text-[9px] font-bold text-red-600 uppercase tracking-widest mt-0.5">
                            {row.checkpoints
                              .filter(c => c.cadence !== 'MONTHLY' && c.overdue)
                              .map(c => `${c.cadence === 'QUARTERLY' ? 'Q' : 'Annual'} overdue`)
                              .join(' · ')}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-xs font-bold text-neutral-400 uppercase tracking-widest">
                        No active users on this store roster.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default PeoplePanel;
