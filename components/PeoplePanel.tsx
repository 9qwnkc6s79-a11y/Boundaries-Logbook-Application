import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Users } from 'lucide-react';
import { Store, TeamPerformanceReview, User } from '../types';
import { db } from '../services/db';
import {
  canWriteSopReview,
  chicagoYmd,
  formatSopPeriod,
  isSopOverdue,
  latestSubmittedSop,
  nextSopDueDate,
  rosterRoleLabel,
  storeRoster,
} from '../utils/teamPerformanceReviews';
import { storeLabel } from '../utils/performanceReviews';
import TeamPerformanceReviewForm from './TeamPerformanceReviewForm';

interface PeoplePanelProps {
  currentUser: User;
  allUsers: User[];
  storeId: string;
  stores?: Store[];
}

function formatDisplayDate(ymd?: string): string {
  if (!ymd) return '—';
  const [year, month, day] = ymd.split('-').map(Number);
  if (!year || !month || !day) return ymd;
  return new Date(year, month - 1, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const PeoplePanel: React.FC<PeoplePanelProps> = ({ currentUser, allUsers, storeId, stores }) => {
  const [reviews, setReviews] = useState<TeamPerformanceReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const all = await db.fetchTeamPerformanceReviews();
      setReviews(Array.isArray(all) ? all : []);
    } catch (err) {
      console.error('[People] fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, storeId]);

  const roster = useMemo(() => storeRoster(allUsers, storeId), [allUsers, storeId]);
  const selected = roster.find(u => u.id === selectedId) || null;
  const allowed = canWriteSopReview(currentUser);

  const rows = useMemo(() => {
    const today = chicagoYmd();
    return roster.map(user => {
      const last = latestSubmittedSop(reviews, user.id);
      const lastDate = last ? (last.submittedAt || last.reviewDate || last.updatedAt).slice(0, 10) : undefined;
      const due = nextSopDueDate(user, reviews);
      return {
        user,
        lastDate,
        lastPeriod: last ? formatSopPeriod(last.period) : undefined,
        due,
        overdue: isSopOverdue(due),
        dueToday: due === today,
      };
    });
  }, [roster, reviews]);

  if (!allowed) {
    return (
      <section className="bg-white p-6 rounded-xl border border-neutral-100 shadow-sm">
        <p className="text-sm font-bold text-neutral-500">SOP reviews are completed by GMs and ADMIN only.</p>
      </section>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <section className="bg-white p-4 md:p-6 rounded-xl border border-neutral-100 shadow-sm">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 bg-[#0F2B3C] text-white rounded-xl"><Users size={16} /></div>
          <div>
            <h2 className="text-lg md:text-xl font-black text-[#0F2B3C] uppercase tracking-tight">People</h2>
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
              {storeLabel(stores, storeId)} · Team Member Performance Review SOP
            </p>
          </div>
        </div>
      </section>

      {selected ? (
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setSelectedId(null)}
            className="text-[9px] font-black uppercase tracking-widest text-neutral-500 hover:text-[#0F2B3C] flex items-center gap-1"
          >
            <ArrowLeft size={12} /> Back to roster
          </button>
          <TeamPerformanceReviewForm
            currentUser={currentUser}
            subject={selected}
            roster={roster}
            storeId={storeId}
            reviews={reviews}
            onSubjectChange={setSelectedId}
            onSaved={next => {
              setReviews(next);
            }}
          />
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
                      onClick={() => setSelectedId(row.user.id)}
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
                        {formatDisplayDate(row.due)}
                        {row.overdue ? ' · Overdue' : ''}
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
