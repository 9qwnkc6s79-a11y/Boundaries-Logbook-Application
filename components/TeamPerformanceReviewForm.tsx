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
  SOP_SECTIONS,
  assessmentRows,
  canEditSopReview,
  canSetPip,
  chicagoYmd,
  defaultSubjectRole,
  findSopReview,
  formatSopPeriod,
  isSopSubmittedLocked,
  makeSopReviewId,
  periodForReviewType,
  roundedOverallDefault,
  visibleSopSections,
  weightedScore,
} from '../utils/teamPerformanceReviews';

interface TeamPerformanceReviewFormProps {
  currentUser: User;
  subject: User;
  roster: User[];
  storeId: string;
  reviews: TeamPerformanceReview[];
  onSubjectChange: (userId: string) => void;
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
  period: string;
  reviewType: SopReviewType;
  reviewedByName: string;
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
  pipDate: string;
  managerPrintName: string;
  managerSignedDate: string;
  teamMemberPrintName: string;
  teamMemberSignedDate: string;
}

function formFromReview(review: TeamPerformanceReview | undefined, subject: User, currentUser: User): FormState {
  const today = chicagoYmd();
  if (!review) {
    const reviewType: SopReviewType = 'QUARTERLY';
    return {
      subjectRole: defaultSubjectRole(subject),
      reviewDate: today,
      period: periodForReviewType(reviewType, today),
      reviewType,
      reviewedByName: currentUser.name,
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
    period: review.period,
    reviewType: review.reviewType,
    reviewedByName: review.reviewedByName || currentUser.name,
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
    pipDate: review.pipDate || '',
    managerPrintName: review.managerPrintName || currentUser.name,
    managerSignedDate: review.managerSignedDate || today,
    teamMemberPrintName: review.teamMemberPrintName || subject.name,
    teamMemberSignedDate: review.teamMemberSignedDate || '',
  };
}

const inputClass = 'w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm text-[#0F2B3C] font-semibold bg-white outline-none focus:ring-2 focus:ring-[#0F2B3C]/20 focus:border-[#0F2B3C]';
const labelClass = 'text-[9px] font-black text-neutral-400 uppercase tracking-widest block mb-1';

const TeamPerformanceReviewForm: React.FC<TeamPerformanceReviewFormProps> = ({
  currentUser,
  subject,
  roster,
  storeId,
  reviews,
  onSubjectChange,
  onSaved,
}) => {
  const [reviewType, setReviewType] = useState<SopReviewType>('QUARTERLY');
  const existing = useMemo(
    () => findSopReview(reviews, subject.id, periodForReviewType(reviewType, chicagoYmd()), reviewType),
    [reviews, subject.id, reviewType]
  );

  const [form, setForm] = useState<FormState>(() => formFromReview(existing, subject, currentUser));
  const [saving, setSaving] = useState<'IDLE' | 'DRAFT' | 'SUBMIT' | 'SAVED' | 'ERROR'>('IDLE');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const match = findSopReview(reviews, subject.id, periodForReviewType(reviewType, chicagoYmd()), reviewType);
    setForm(formFromReview(match, subject, currentUser));
    setSaving('IDLE');
    setError(null);
  }, [subject.id, reviewType, existing?.id, existing?.updatedAt, currentUser.id]);

  const locked = existing ? isSopSubmittedLocked(existing, currentUser) : false;
  const editable = !existing || canEditSopReview(existing, currentUser);
  const disabled = !editable || locked;

  const score = useMemo(() => weightedScore(form.subjectRole, form.ratings), [form.subjectRole, form.ratings]);
  const suggestedOverall = roundedOverallDefault(score);
  const displayOverall = form.overallTouched ? form.overallRating : suggestedOverall;
  const rows = useMemo(() => assessmentRows(form.subjectRole, form.ratings), [form.subjectRole, form.ratings]);
  const sections = visibleSopSections(form.subjectRole);

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
    const period = form.period.trim() || periodForReviewType(form.reviewType, form.reviewDate);
    const review: TeamPerformanceReview = {
      id: makeSopReviewId(subject.id, period, form.reviewType),
      subjectId: subject.id,
      subjectName: subject.name,
      subjectRole: form.subjectRole,
      storeId,
      reviewerId: currentUser.id,
      reviewerName: currentUser.name,
      reviewedByName: form.reviewedByName.trim() || currentUser.name,
      reviewDate: form.reviewDate,
      period,
      reviewType: form.reviewType,
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
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                type="button"
                disabled={disabled}
                onClick={() => patch({ overallRating: n, overallTouched: true })}
                className={`w-8 h-8 rounded-lg text-xs font-black border-2 ${
                  displayOverall === n
                    ? 'bg-[#0F2B3C] text-white border-[#0F2B3C]'
                    : 'bg-white text-neutral-500 border-neutral-200 hover:border-[#0F2B3C]'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
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
            <label className={labelClass}>Team Member Name</label>
            <select
              className={inputClass}
              value={subject.id}
              disabled={disabled && !!existing}
              onChange={e => onSubjectChange(e.target.value)}
            >
              {roster.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
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
            <label className={labelClass}>Review Date / Period</label>
            <div className="flex gap-2">
              <input
                type="date"
                className={inputClass}
                disabled={disabled}
                value={form.reviewDate}
                onChange={e => {
                  const reviewDate = e.target.value;
                  patch({ reviewDate, period: periodForReviewType(form.reviewType, reviewDate) });
                }}
              />
              <input
                className={inputClass}
                disabled={disabled}
                value={form.period}
                onChange={e => patch({ period: e.target.value })}
                aria-label="Period"
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Reviewed By</label>
            <input
              className={inputClass}
              disabled={disabled}
              value={form.reviewedByName}
              onChange={e => patch({ reviewedByName: e.target.value })}
            />
          </div>
          <div>
            <label className={labelClass}>Review Type</label>
            <select
              className={inputClass}
              disabled={disabled && !!existing}
              value={form.reviewType}
              onChange={e => {
                const nextType = e.target.value as SopReviewType;
                setReviewType(nextType);
                patch({ reviewType: nextType, period: periodForReviewType(nextType, form.reviewDate) });
              }}
            >
              <option value="QUARTERLY">Quarterly</option>
              <option value="ANNUAL">Annual</option>
              <option value="PIP">PIP</option>
            </select>
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
                <div className="flex gap-1 shrink-0">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      type="button"
                      disabled={disabled}
                      onClick={() => setRating(item.id, form.ratings[item.id] === n ? null : n)}
                      className={`w-8 h-8 rounded-lg text-xs font-black border-2 ${
                        form.ratings[item.id] === n
                          ? 'bg-[#0F2B3C] text-white border-[#0F2B3C]'
                          : 'bg-white text-neutral-500 border-neutral-200 hover:border-[#0F2B3C]'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
          <div>
            <label className={labelClass}>Comments / Notes</label>
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
        <label className={labelClass}>Summary — Key Themes</label>
        <textarea
          className={`${inputClass} min-h-[96px] font-medium`}
          disabled={disabled}
          value={form.keyThemes}
          onChange={e => patch({ keyThemes: e.target.value })}
        />
      </section>

      <section className="bg-white border border-neutral-100 rounded-xl shadow-sm p-4 md:p-5 space-y-3">
        <h3 className="text-sm font-black text-[#0F2B3C] uppercase tracking-tight">Development & Action Plan</h3>
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
      </section>

      <section className="bg-white border border-neutral-100 rounded-xl shadow-sm p-4 md:p-5 space-y-3">
        <h3 className="text-sm font-black text-[#0F2B3C] uppercase tracking-tight">Goals for Next Period</h3>
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
      </section>

      <section className="bg-white border border-neutral-100 rounded-xl shadow-sm p-4 md:p-5 space-y-3">
        <h3 className="text-sm font-black text-[#0F2B3C] uppercase tracking-tight">Disciplinary Status</h3>
        {(['NO_CONCERNS', 'ACTIVE_STRIKE', 'PIP_REQUIRED'] as SopDisciplinaryStatus[]).map(status => {
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
        {form.disciplinaryStatus === 'PIP_REQUIRED' && (
          <div className="pl-6 max-w-xs">
            <label className={labelClass}>Date</label>
            <input type="date" className={inputClass} disabled={disabled || !canSetPip(currentUser)} value={form.pipDate} onChange={e => patch({ pipDate: e.target.value })} />
          </div>
        )}
      </section>

      <section className="bg-white border border-neutral-100 rounded-xl shadow-sm p-4 md:p-5 space-y-3">
        <h3 className="text-sm font-black text-[#0F2B3C] uppercase tracking-tight">Signatures</h3>
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
      </section>
    </div>
  );
};

export default TeamPerformanceReviewForm;
