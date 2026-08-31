import React, { useEffect, useMemo, useState } from 'react';
import { Lock, Plus, Save, Trash2 } from 'lucide-react';
import {
  SopActionRow,
  SopDisciplinaryStatus,
  SopGoalRow,
  SopReviewType,
  SopSubjectRole,
  TeamPerformanceReview,
  User,
} from '../types';
import { db } from '../services/db';
import {
  SOP_DISCIPLINARY_LABELS,
  SOP_FOOTER,
  SOP_RATING_SCALE,
  assessmentRows,
  canEditSopReview,
  canSetPip,
  chicagoYmd,
  defaultSubjectRole,
  findSopReview,
  formatSopPeriod,
  formatSopReviewType,
  isSlimMonthlyReview,
  isSopSubmittedLocked,
  makeSopReviewId,
  roundedOverallDefault,
  sopSectionsForReviewType,
  weightedScore,
} from '../utils/teamPerformanceReviews';

interface TeamPerformanceReviewFormProps {
  currentUser: User;
  subject: User;
  storeId: string;
  reviews: TeamPerformanceReview[];
  reviewType: SopReviewType;
  period: string;
  onSaved: (reviews: TeamPerformanceReview[]) => void;
}

function newRowId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function emptyAction(): SopActionRow {
  return { id: newRowId('dev'), area: '', action: '', targetDate: '' };
}

function emptyGoal(): SopGoalRow {
  return { id: newRowId('goal'), goal: '', measure: '', targetDate: '' };
}

interface FormState {
  subjectRole: SopSubjectRole;
  reviewDate: string;
  strikesOnFile: number;
  ratings: Record<string, number>;
  sectionComments: Record<string, string>;
  overallRating: number;
  overallTouched: boolean;
  keyThemes: string;
  developmentPlan: SopActionRow[];
  goals: SopGoalRow[];
  disciplinaryStatus: SopDisciplinaryStatus;
  strikeNumber: string;
  strikeDate: string;
  tardyDate: string;
  pipDate: string;
  managerPrintName: string;
  managerSignedDate: string;
  teamMemberPrintName: string;
  teamMemberSignedDate: string;
}

function formFromReview(review: TeamPerformanceReview | undefined, subject: User, currentUser: User): FormState {
  const today = chicagoYmd();
  if (!review) {
    return {
      subjectRole: defaultSubjectRole(subject),
      reviewDate: today,
      strikesOnFile: 0,
      ratings: {},
      sectionComments: {},
      overallRating: 0,
      overallTouched: false,
      keyThemes: '',
      developmentPlan: [emptyAction()],
      goals: [emptyGoal()],
      disciplinaryStatus: 'NO_CONCERNS',
      strikeNumber: '',
      strikeDate: '',
      tardyDate: '',
      pipDate: '',
      managerPrintName: currentUser.name,
      managerSignedDate: today,
      teamMemberPrintName: subject.name,
      teamMemberSignedDate: '',
    };
  }
  return {
    subjectRole: review.subjectRole,
    reviewDate: review.reviewDate,
    strikesOnFile: review.strikesOnFile || 0,
    ratings: { ...review.ratings },
    sectionComments: { ...review.sectionComments },
    overallRating: review.overallRating || 0,
    overallTouched: (review.overallRating || 0) >= 1,
    keyThemes: review.keyThemes || '',
    developmentPlan: review.developmentPlan.length ? review.developmentPlan.map(r => ({ ...r })) : [emptyAction()],
    goals: review.goals.length ? review.goals.map(r => ({ ...r })) : [emptyGoal()],
    disciplinaryStatus: review.disciplinaryStatus,
    strikeNumber: review.strikeNumber ? String(review.strikeNumber) : '',
    strikeDate: review.strikeDate || '',
    tardyDate: review.tardyDate || '',
    pipDate: review.pipDate || '',
    managerPrintName: review.managerPrintName || currentUser.name,
    managerSignedDate: review.managerSignedDate || today,
    teamMemberPrintName: review.teamMemberPrintName || subject.name,
    teamMemberSignedDate: review.teamMemberSignedDate || '',
  };
}

const inputClass = 'w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm text-[#0F2B3C] font-semibold bg-white outline-none focus:ring-2 focus:ring-[#0F2B3C]/20 focus:border-[#0F2B3C]';
const labelClass = 'text-[9px] font-black text-neutral-400 uppercase tracking-widest block mb-1';

function OptionalSopBlock({
  title,
  collapsed,
  children,
}: {
  title: string;
  collapsed: boolean;
  children: React.ReactNode;
}) {
  if (collapsed) {
    return (
      <details className="bg-white border border-neutral-100 rounded-xl shadow-sm p-4 md:p-5">
        <summary className="cursor-pointer text-sm font-black text-[#0F2B3C] uppercase tracking-tight">
          {title} <span className="text-neutral-400 font-bold normal-case tracking-normal">(optional)</span>
        </summary>
        <div className="space-y-3 mt-3">{children}</div>
      </details>
    );
  }
  return (
    <section className="bg-white border border-neutral-100 rounded-xl shadow-sm p-4 md:p-5 space-y-3">
      <h3 className="text-sm font-black text-[#0F2B3C] uppercase tracking-tight">{title}</h3>
      {children}
    </section>
  );
}

const TeamPerformanceReviewForm: React.FC<TeamPerformanceReviewFormProps> = ({
  currentUser,
  subject,
  storeId,
  reviews,
  reviewType,
  period,
  onSaved,
}) => {
  const existing = useMemo(
    () => findSopReview(reviews, subject.id, period, reviewType),
    [reviews, subject.id, period, reviewType]
  );

  const [form, setForm] = useState<FormState>(() => formFromReview(existing, subject, currentUser));
  const [saving, setSaving] = useState<'IDLE' | 'DRAFT' | 'SUBMIT' | 'SAVED' | 'ERROR'>('IDLE');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const match = findSopReview(reviews, subject.id, period, reviewType);
    setForm(formFromReview(match, subject, currentUser));
    setSaving('IDLE');
    setError(null);
  }, [subject.id, period, reviewType, existing?.id, existing?.updatedAt, currentUser.id]);

  const locked = existing ? isSopSubmittedLocked(existing, currentUser) : false;
  const editable = !existing || canEditSopReview(existing, currentUser);
  const disabled = !editable || locked;

  const score = useMemo(() => weightedScore(form.subjectRole, form.ratings), [form.subjectRole, form.ratings]);
  const suggestedOverall = roundedOverallDefault(score);
  const displayOverall = form.overallTouched ? form.overallRating : suggestedOverall;
  const rows = useMemo(() => assessmentRows(form.subjectRole, form.ratings), [form.subjectRole, form.ratings]);
  const sections = sopSectionsForReviewType(reviewType, form.subjectRole);
  const slimMonthly = isSlimMonthlyReview(reviewType);

  const patch = (partial: Partial<FormState>) => setForm(prev => ({ ...prev, ...partial }));

  const setRating = (itemId: string, value: number | null) => {
    setForm(prev => {
      const ratings = { ...prev.ratings };
      if (value === null) delete ratings[itemId];
      else ratings[itemId] = value;
      const nextScore = weightedScore(prev.subjectRole, ratings);
      return {
        ...prev,
        ratings,
        overallRating: prev.overallTouched ? prev.overallRating : roundedOverallDefault(nextScore),
      };
    });
  };

  const persist = async (status: 'DRAFT' | 'SUBMITTED') => {
    if (disabled) return;
    const overall = displayOverall;
    if (status === 'SUBMITTED' && !(overall >= 1 && overall <= 5)) {
      setError('Overall Rating 1–5 is required. Confirm the suggested score or pick one.');
      return;
    }
    if (form.disciplinaryStatus === 'PIP_REQUIRED' && !canSetPip(currentUser)) {
      setError('Only ADMIN (Daniel) can set PIP required.');
      return;
    }
    setError(null);
    setSaving(status === 'DRAFT' ? 'DRAFT' : 'SUBMIT');
    const now = new Date().toISOString();
    const review: TeamPerformanceReview = {
      id: makeSopReviewId(subject.id, period, reviewType),
      subjectId: subject.id,
      subjectName: subject.name,
      subjectRole: form.subjectRole,
      storeId,
      reviewerId: currentUser.id,
      reviewerName: currentUser.name,
      reviewedByName: currentUser.name,
      reviewDate: form.reviewDate,
      period,
      reviewType,
      strikesOnFile: Number(form.strikesOnFile) || 0,
      ratings: form.ratings,
      sectionComments: form.sectionComments,
      overallRating: status === 'SUBMITTED' ? overall : (form.overallTouched ? form.overallRating : suggestedOverall),
      keyThemes: form.keyThemes,
      developmentPlan: form.developmentPlan.filter(r => r.area.trim() || r.action.trim() || r.targetDate.trim()),
      goals: form.goals.filter(r => r.goal.trim() || r.measure.trim() || r.targetDate.trim()),
      disciplinaryStatus: form.disciplinaryStatus,
      strikeNumber: form.strikeNumber ? Number(form.strikeNumber) : undefined,
      strikeDate: form.strikeDate,
      tardyDate: form.tardyDate,
      pipDate: form.pipDate,
      managerPrintName: form.managerPrintName,
      managerSignedDate: form.managerSignedDate,
      teamMemberPrintName: form.teamMemberPrintName,
      teamMemberSignedDate: form.teamMemberSignedDate,
      status,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
      submittedAt: status === 'SUBMITTED' ? now : undefined,
    };
    const next = await db.pushTeamPerformanceReview(review, currentUser);
    if (!next) {
      setSaving('ERROR');
      setError(status === 'SUBMITTED' && existing && isSopSubmittedLocked(existing, currentUser)
        ? 'This review is already submitted and locked.'
        : 'Could not save. Try again in a moment.');
      return;
    }
    onSaved(next);
    setSaving('SAVED');
  };

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur border border-neutral-200 rounded-xl shadow-sm px-3 md:px-4 py-3 flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Overall Weighted Score</div>
          <div className="text-2xl font-black text-[#0F2B3C] leading-none mt-0.5">
            {score === null ? '—' : score.toFixed(2)}
            <span className="text-xs font-bold text-neutral-400 ml-1">/ 5</span>
          </div>
        </div>
        <div>
          <div className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-1">Overall Rating</div>
          <select
            disabled={disabled}
            aria-label="Overall Rating 1–5"
            className={`${inputClass} w-56`}
            value={displayOverall || ''}
            onChange={e => patch({ overallRating: e.target.value ? Number(e.target.value) : 0, overallTouched: true })}
          >
            <option value="">Confirm 1–5</option>
            {SOP_RATING_SCALE.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.value} {opt.label}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2 md:ml-auto">
          <button
            type="button"
            disabled={disabled || saving === 'DRAFT' || saving === 'SUBMIT'}
            onClick={() => persist('DRAFT')}
            className="px-3 py-2 rounded-xl border-2 border-neutral-200 text-[9px] font-black uppercase tracking-widest text-neutral-600 hover:border-[#0F2B3C] disabled:opacity-50 flex items-center gap-1.5"
          >
            <Save size={12} /> {saving === 'DRAFT' ? 'Saving…' : 'Save Draft'}
          </button>
          <button
            type="button"
            disabled={disabled || saving === 'DRAFT' || saving === 'SUBMIT'}
            onClick={() => persist('SUBMITTED')}
            className="px-3 py-2 rounded-xl bg-[#0F2B3C] text-white text-[9px] font-black uppercase tracking-widest disabled:opacity-50"
          >
            {saving === 'SUBMIT' ? 'Submitting…' : 'Submit'}
          </button>
        </div>
      </div>

      {locked && (
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
          <Lock size={12} /> Submitted — locked except ADMIN
        </div>
      )}
      {error && <div className="text-xs font-bold text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</div>}
      {saving === 'SAVED' && <div className="text-xs font-bold text-green-700 bg-green-50 border border-green-100 rounded-xl px-3 py-2">Saved.</div>}

      <section className="bg-white border border-neutral-100 rounded-xl shadow-sm p-4 md:p-5 space-y-4">
        <h2 className="text-sm font-black text-[#0F2B3C] uppercase tracking-tight">Team Member Performance Review</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className={labelClass}>Team Member</label>
            <div className={`${inputClass} bg-neutral-50`}>{subject.name}</div>
          </div>
          <div>
            <label className={labelClass}>Reviewer</label>
            <div className={`${inputClass} bg-neutral-50`}>{currentUser.name}</div>
          </div>
          <div>
            <label className={labelClass}>Period</label>
            <div className={`${inputClass} bg-neutral-50`}>
              {formatSopReviewType(reviewType)} · {formatSopPeriod(period)}
            </div>
          </div>
          <div>
            <label className={labelClass}>Role</label>
            <select
              className={inputClass}
              disabled={disabled}
              value={form.subjectRole}
              onChange={e => patch({ subjectRole: e.target.value as SopSubjectRole })}
            >
              <option value="TEAM_MEMBER">Team Member</option>
              <option value="TEAM_LEADER">Team Leader</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Review Date</label>
            <input
              type="date"
              className={inputClass}
              disabled={disabled}
              value={form.reviewDate}
              onChange={e => patch({ reviewDate: e.target.value })}
            />
          </div>
          <div>
            <label className={labelClass}>Strikes on File</label>
            <input
              type="number"
              min={0}
              className={inputClass}
              disabled={disabled}
              value={form.strikesOnFile}
              onChange={e => patch({ strikesOnFile: Number(e.target.value) || 0 })}
            />
          </div>
        </div>
        {existing && (
          <div className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">
            {existing.status} · {formatSopPeriod(existing.period)}
          </div>
        )}
      </section>

      <section className="bg-white border border-neutral-100 rounded-xl shadow-sm p-4 md:p-5">
        <h3 className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-3">Rating Scale</h3>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
          {SOP_RATING_SCALE.map(item => (
            <div key={item.value} className="rounded-lg border border-neutral-100 bg-neutral-50/60 px-3 py-2">
              <div className="text-lg font-black text-[#0F2B3C]">{item.value}</div>
              <div className="text-[10px] font-bold text-neutral-600 leading-tight">{item.label}</div>
            </div>
          ))}
        </div>
      </section>

      {slimMonthly && (
        <p className="text-xs font-semibold text-neutral-600 bg-neutral-50 border border-neutral-100 rounded-xl px-3 py-2">
          Monthly check-in: one 1–5 rating per section (optional commentary). Full SOP items, DAP, and goals stay on quarterly and annual.
        </p>
      )}

      {sections.map(section => (
        <section key={section.id} className="bg-white border border-neutral-100 rounded-xl shadow-sm p-4 md:p-5 space-y-4">
          <div>
            <div className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">
              Section {section.number}
            </div>
            <h3 className="text-sm font-black text-[#0F2B3C] uppercase tracking-tight">
              {section.title} <span className="text-neutral-400 font-bold normal-case tracking-normal">({section.weightLabel})</span>
            </h3>
          </div>
          {section.items.map(item => (
            <div key={item.id} className="border-t border-neutral-100 pt-3">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-xs font-black text-[#0F2B3C]">{item.title}</div>
                  <p className="text-[11px] text-neutral-500 mt-0.5 leading-snug">
                    {item.low} → {item.high}
                  </p>
                </div>
                <div className="shrink-0 w-full md:w-56">
                  <label className="sr-only" htmlFor={`rating-${item.id}`}>{item.title} rating 1–5</label>
                  <select
                    id={`rating-${item.id}`}
                    disabled={disabled}
                    className={inputClass}
                    value={form.ratings[item.id] || ''}
                    onChange={e => setRating(item.id, e.target.value ? Number(e.target.value) : null)}
                  >
                    <option value="">—</option>
                    {SOP_RATING_SCALE.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.value} {opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
          <div>
            <label className={labelClass}>Comments / Notes (optional)</label>
            <textarea
              className={`${inputClass} min-h-[72px] font-medium`}
              disabled={disabled}
              value={form.sectionComments[section.id] || ''}
              onChange={e => patch({ sectionComments: { ...form.sectionComments, [section.id]: e.target.value } })}
            />
          </div>
        </section>
      ))}

      <section className="bg-white border border-neutral-100 rounded-xl shadow-sm p-4 md:p-5 space-y-3">
        <h3 className="text-sm font-black text-[#0F2B3C] uppercase tracking-tight">Overall Assessment</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-[9px] font-black text-neutral-400 uppercase tracking-widest border-b border-neutral-100">
                <th className="py-2 pr-2">Category</th>
                <th className="py-2 pr-2">Score (1–5)</th>
                <th className="py-2 pr-2">TM Weight</th>
                <th className="py-2 pr-2">TL Weight</th>
                <th className="py-2">Wtd. Score</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.sectionId} className="border-b border-neutral-50">
                  <td className="py-2 pr-2 font-bold text-[#0F2B3C]">{row.title}</td>
                  <td className="py-2 pr-2">{row.score === null ? '—' : row.score.toFixed(2)}</td>
                  <td className="py-2 pr-2">{row.tmWeight ? `${row.tmWeight}%` : 'N/A'}</td>
                  <td className="py-2 pr-2">{row.tlWeight}%</td>
                  <td className="py-2 font-black text-[#0F2B3C]">
                    {row.sectionId === 'leadership' && form.subjectRole === 'TEAM_MEMBER'
                      ? '—'
                      : row.weightedScore === null ? '—' : row.weightedScore.toFixed(2)}
                  </td>
                </tr>
              ))}
              <tr>
                <td className="py-3 pr-2 font-black text-[#0F2B3C] uppercase tracking-tight" colSpan={4}>Overall Weighted Score</td>
                <td className="py-3 font-black text-[#0F2B3C] text-base">{score === null ? '—' : score.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="bg-white border border-neutral-100 rounded-xl shadow-sm p-4 md:p-5">
        <label className={labelClass}>Summary — Key Themes (optional)</label>
        <textarea
          className={`${inputClass} min-h-[96px] font-medium`}
          disabled={disabled}
          value={form.keyThemes}
          onChange={e => patch({ keyThemes: e.target.value })}
        />
      </section>

      <OptionalSopBlock title="Development & Action Plan" collapsed={slimMonthly}>
        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Optional — leave blank to submit</p>
        {form.developmentPlan.map((row, idx) => (
          <div key={row.id} className="grid grid-cols-1 md:grid-cols-7 gap-2">
            <input className={`${inputClass} md:col-span-3`} disabled={disabled} placeholder="Area for Improvement" value={row.area} onChange={e => {
              const developmentPlan = form.developmentPlan.map((r, i) => i === idx ? { ...r, area: e.target.value } : r);
              patch({ developmentPlan });
            }} />
            <input className={`${inputClass} md:col-span-2`} disabled={disabled} placeholder="Action Required" value={row.action} onChange={e => {
              const developmentPlan = form.developmentPlan.map((r, i) => i === idx ? { ...r, action: e.target.value } : r);
              patch({ developmentPlan });
            }} />
            <input type="date" className={inputClass} disabled={disabled} aria-label="Target Date" value={row.targetDate} onChange={e => {
              const developmentPlan = form.developmentPlan.map((r, i) => i === idx ? { ...r, targetDate: e.target.value } : r);
              patch({ developmentPlan });
            }} />
            <button type="button" disabled={disabled || form.developmentPlan.length <= 1} onClick={() => patch({ developmentPlan: form.developmentPlan.filter((_, i) => i !== idx) })} className="text-neutral-400 hover:text-red-600 disabled:opacity-30 flex items-center justify-center">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        <button type="button" disabled={disabled} onClick={() => patch({ developmentPlan: [...form.developmentPlan, emptyAction()] })} className="text-[9px] font-black uppercase tracking-widest text-[#0F2B3C] flex items-center gap-1">
          <Plus size={12} /> Add row
        </button>
      </OptionalSopBlock>

      <OptionalSopBlock title="Goals for Next Period" collapsed={slimMonthly}>
        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Optional — leave blank to submit</p>
        {form.goals.map((row, idx) => (
          <div key={row.id} className="grid grid-cols-1 md:grid-cols-7 gap-2">
            <input className={`${inputClass} md:col-span-3`} disabled={disabled} placeholder="Goal" value={row.goal} onChange={e => {
              const goals = form.goals.map((r, i) => i === idx ? { ...r, goal: e.target.value } : r);
              patch({ goals });
            }} />
            <input className={`${inputClass} md:col-span-2`} disabled={disabled} placeholder="How Success Is Measured" value={row.measure} onChange={e => {
              const goals = form.goals.map((r, i) => i === idx ? { ...r, measure: e.target.value } : r);
              patch({ goals });
            }} />
            <input type="date" className={inputClass} disabled={disabled} aria-label="Target Date" value={row.targetDate} onChange={e => {
              const goals = form.goals.map((r, i) => i === idx ? { ...r, targetDate: e.target.value } : r);
              patch({ goals });
            }} />
            <button type="button" disabled={disabled || form.goals.length <= 1} onClick={() => patch({ goals: form.goals.filter((_, i) => i !== idx) })} className="text-neutral-400 hover:text-red-600 disabled:opacity-30 flex items-center justify-center">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        <button type="button" disabled={disabled} onClick={() => patch({ goals: [...form.goals, emptyGoal()] })} className="text-[9px] font-black uppercase tracking-widest text-[#0F2B3C] flex items-center gap-1">
          <Plus size={12} /> Add row
        </button>
      </OptionalSopBlock>

      <section className="bg-white border border-neutral-100 rounded-xl shadow-sm p-4 md:p-5 space-y-3">
        <h3 className="text-sm font-black text-[#0F2B3C] uppercase tracking-tight">Disciplinary Status</h3>
        {(['NO_CONCERNS', 'ACTIVE_STRIKE', 'TARDY_NO_SHOW', 'PIP_REQUIRED'] as SopDisciplinaryStatus[]).map(status => {
          const pipBlocked = status === 'PIP_REQUIRED' && !canSetPip(currentUser);
          return (
            <label key={status} className={`flex items-start gap-2 text-sm ${pipBlocked ? 'opacity-50' : ''}`}>
              <input
                type="radio"
                name="disciplinary"
                className="mt-1"
                disabled={disabled || pipBlocked}
                checked={form.disciplinaryStatus === status}
                onChange={() => patch({ disciplinaryStatus: status })}
              />
              <span className="font-semibold text-[#0F2B3C]">{SOP_DISCIPLINARY_LABELS[status]}</span>
            </label>
          );
        })}
        {form.disciplinaryStatus === 'ACTIVE_STRIKE' && (
          <div className="grid grid-cols-2 gap-2 pl-6">
            <div>
              <label className={labelClass}>Strike #</label>
              <input className={inputClass} disabled={disabled} value={form.strikeNumber} onChange={e => patch({ strikeNumber: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Date</label>
              <input type="date" className={inputClass} disabled={disabled} value={form.strikeDate} onChange={e => patch({ strikeDate: e.target.value })} />
            </div>
          </div>
        )}
        {form.disciplinaryStatus === 'TARDY_NO_SHOW' && (
          <div className="pl-6 max-w-xs">
            <label className={labelClass}>Date</label>
            <input type="date" className={inputClass} disabled={disabled} value={form.tardyDate} onChange={e => patch({ tardyDate: e.target.value })} />
          </div>
        )}
        {form.disciplinaryStatus === 'PIP_REQUIRED' && (
          <div className="pl-6 max-w-xs">
            <label className={labelClass}>Date</label>
            <input type="date" className={inputClass} disabled={disabled || !canSetPip(currentUser)} value={form.pipDate} onChange={e => patch({ pipDate: e.target.value })} />
          </div>
        )}
      </section>

      <OptionalSopBlock title="Signatures" collapsed={slimMonthly}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Manager print name</label>
            <input className={inputClass} disabled={disabled} value={form.managerPrintName} onChange={e => patch({ managerPrintName: e.target.value })} />
          </div>
          <div>
            <label className={labelClass}>Manager date</label>
            <input type="date" className={inputClass} disabled={disabled} value={form.managerSignedDate} onChange={e => patch({ managerSignedDate: e.target.value })} />
          </div>
          <div>
            <label className={labelClass}>Team Member print name</label>
            <input className={inputClass} disabled={disabled} value={form.teamMemberPrintName} onChange={e => patch({ teamMemberPrintName: e.target.value })} />
          </div>
          <div>
            <label className={labelClass}>Team Member date</label>
            <input type="date" className={inputClass} disabled={disabled} value={form.teamMemberSignedDate} onChange={e => patch({ teamMemberSignedDate: e.target.value })} />
          </div>
        </div>
        <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest text-center pt-2">{SOP_FOOTER}</p>
      </OptionalSopBlock>
    </div>
  );
};

export default TeamPerformanceReviewForm;
