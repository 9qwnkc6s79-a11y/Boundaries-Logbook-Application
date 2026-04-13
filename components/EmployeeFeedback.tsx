import React, { useState, useMemo } from 'react';
import { User, UserRole, EmployeeFeedback as EmployeeFeedbackType, FeedbackCategory } from '../types';
import {
  MessageSquare, Send, Star, User as UserIcon, Search, ChevronDown, ChevronUp,
  Clock, CheckCircle, AlertTriangle, Filter, Calendar, ArrowRight, Eye
} from 'lucide-react';

const CATEGORY_CONFIG: Record<FeedbackCategory, { label: string; color: string; bgColor: string }> = {
  CLOSING: { label: 'Closing Procedures', color: 'text-indigo-700', bgColor: 'bg-indigo-50 border-indigo-200' },
  SHIFT_CHAIN: { label: 'Shift Chain', color: 'text-blue-700', bgColor: 'bg-blue-50 border-blue-200' },
  VALUES: { label: 'Company Values', color: 'text-purple-700', bgColor: 'bg-purple-50 border-purple-200' },
  CUSTOMER_SERVICE: { label: 'Customer Service', color: 'text-green-700', bgColor: 'bg-green-50 border-green-200' },
  QUALITY: { label: 'Quality & Standards', color: 'text-amber-700', bgColor: 'bg-amber-50 border-amber-200' },
  TEAMWORK: { label: 'Teamwork', color: 'text-teal-700', bgColor: 'bg-teal-50 border-teal-200' },
  OTHER: { label: 'Other', color: 'text-neutral-700', bgColor: 'bg-neutral-50 border-neutral-200' },
};

const RATING_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: 'Needs Immediate Improvement', color: 'text-red-600' },
  2: { label: 'Needs Improvement', color: 'text-orange-600' },
  3: { label: 'Meets Expectations', color: 'text-amber-600' },
  4: { label: 'Above Expectations', color: 'text-green-600' },
  5: { label: 'Exceeds Expectations', color: 'text-emerald-600' },
};

interface EmployeeFeedbackProps {
  currentUser: User;
  staff: User[];
  feedback: EmployeeFeedbackType[];
  onSubmitFeedback: (feedback: EmployeeFeedbackType) => Promise<void>;
  currentStoreId: string;
}

const EmployeeFeedbackComponent: React.FC<EmployeeFeedbackProps> = ({
  currentUser,
  staff,
  feedback,
  onSubmitFeedback,
  currentStoreId
}) => {
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [category, setCategory] = useState<FeedbackCategory>('CLOSING');
  const [rating, setRating] = useState<number>(3);
  const [observation, setObservation] = useState('');
  const [improvement, setImprovement] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [saving, setSaving] = useState(false);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<FeedbackCategory | 'ALL'>('ALL');
  const [filterEmployee, setFilterEmployee] = useState<string>('ALL');
  const [expandedFeedbackId, setExpandedFeedbackId] = useState<string | null>(null);

  const activeStaff = useMemo(() =>
    staff.filter(u => u.active !== false && u.storeId === currentStoreId && u.id !== currentUser.id),
    [staff, currentStoreId, currentUser.id]
  );

  const storeFeedback = useMemo(() => {
    let filtered = feedback.filter(f => f.storeId === currentStoreId);

    if (filterCategory !== 'ALL') {
      filtered = filtered.filter(f => f.category === filterCategory);
    }
    if (filterEmployee !== 'ALL') {
      filtered = filtered.filter(f => f.employeeId === filterEmployee);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(f =>
        f.employeeName.toLowerCase().includes(q) ||
        f.observation.toLowerCase().includes(q) ||
        f.improvement.toLowerCase().includes(q)
      );
    }

    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [feedback, currentStoreId, filterCategory, filterEmployee, searchQuery]);

  // Stats
  const feedbackStats = useMemo(() => {
    const storeFb = feedback.filter(f => f.storeId === currentStoreId);
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    const thisMonthFb = storeFb.filter(f => new Date(f.createdAt) >= thisMonth);
    const unacknowledged = storeFb.filter(f => !f.acknowledged);

    const categoryBreakdown: Record<string, number> = {};
    storeFb.forEach(f => {
      categoryBreakdown[f.category] = (categoryBreakdown[f.category] || 0) + 1;
    });

    return {
      total: storeFb.length,
      thisMonth: thisMonthFb.length,
      unacknowledged: unacknowledged.length,
      categoryBreakdown,
    };
  }, [feedback, currentStoreId]);

  const resetForm = () => {
    setSelectedEmployeeId('');
    setCategory('CLOSING');
    setRating(3);
    setObservation('');
    setImprovement('');
    setFollowUpDate('');
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeId || !observation.trim() || !improvement.trim()) return;

    const employee = activeStaff.find(u => u.id === selectedEmployeeId);
    if (!employee) return;

    setSaving(true);
    try {
      const newFeedback: EmployeeFeedbackType = {
        id: `fb-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        employeeId: employee.id,
        employeeName: employee.name,
        managerId: currentUser.id,
        managerName: currentUser.name,
        storeId: currentStoreId,
        category,
        rating: rating as 1 | 2 | 3 | 4 | 5,
        observation: observation.trim(),
        improvement: improvement.trim(),
        followUpDate: followUpDate || undefined,
        acknowledged: false,
        createdAt: new Date().toISOString(),
      };

      await onSubmitFeedback(newFeedback);
      resetForm();
    } catch (err) {
      console.error('[EmployeeFeedback] Failed to submit:', err);
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header + Stats */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <MessageSquare size={18} className="text-[#0F2B3C]" />
            <h2 className="text-lg font-black text-[#0F2B3C] uppercase tracking-tight">Employee Feedback</h2>
          </div>
          <p className="text-xs text-neutral-500 font-medium">Formal coaching feedback for team development</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-5 py-2.5 bg-[#0F2B3C] text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-900 transition-all shadow-lg flex items-center gap-2 active:scale-95"
        >
          {showForm ? <><ChevronUp size={14} /> Cancel</> : <><Send size={14} /> Give Feedback</>}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-xl border border-neutral-100 shadow-sm">
          <div className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-1">Total</div>
          <div className="text-2xl font-black text-[#0F2B3C]">{feedbackStats.total}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-neutral-100 shadow-sm">
          <div className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-1">This Month</div>
          <div className="text-2xl font-black text-blue-600">{feedbackStats.thisMonth}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-neutral-100 shadow-sm">
          <div className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-1">Pending Review</div>
          <div className="text-2xl font-black text-amber-600">{feedbackStats.unacknowledged}</div>
        </div>
      </div>

      {/* New Feedback Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border-2 border-[#0F2B3C]/10 shadow-md space-y-5">
          <h3 className="text-sm font-black text-[#0F2B3C] uppercase tracking-tight flex items-center gap-2">
            <Send size={14} /> New Feedback Entry
          </h3>

          {/* Employee Selection */}
          <div>
            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2 block">Employee</label>
            <select
              value={selectedEmployeeId}
              onChange={e => setSelectedEmployeeId(e.target.value)}
              required
              className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-[#0F2B3C]/20 focus:border-[#0F2B3C] outline-none"
            >
              <option value="">Select an employee...</option>
              {activeStaff.map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2 block">Category</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(Object.entries(CATEGORY_CONFIG) as [FeedbackCategory, typeof CATEGORY_CONFIG[FeedbackCategory]][]).map(([key, cfg]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setCategory(key)}
                  className={`px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all ${
                    category === key
                      ? `${cfg.bgColor} ${cfg.color} border-current shadow-sm`
                      : 'bg-neutral-50 text-neutral-400 border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  {cfg.label}
                </button>
              ))}
            </div>
          </div>

          {/* Rating */}
          <div>
            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2 block">Performance Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRating(r)}
                  className={`flex-1 py-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${
                    rating === r
                      ? 'border-[#0F2B3C] bg-[#0F2B3C]/5 shadow-sm'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <Star
                    size={20}
                    className={rating >= r ? 'text-amber-400 fill-amber-400' : 'text-neutral-300'}
                  />
                  <span className="text-[8px] font-bold text-neutral-500 hidden sm:block">{r}</span>
                </button>
              ))}
            </div>
            <p className={`text-xs font-bold mt-2 ${RATING_LABELS[rating].color}`}>
              {RATING_LABELS[rating].label}
            </p>
          </div>

          {/* Observation */}
          <div>
            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2 block">
              What did you observe?
            </label>
            <textarea
              value={observation}
              onChange={e => setObservation(e.target.value)}
              required
              rows={3}
              placeholder="Describe the specific situation or behavior you observed..."
              className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-[#0F2B3C]/20 focus:border-[#0F2B3C] outline-none resize-none"
            />
          </div>

          {/* Improvement */}
          <div>
            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2 block">
              How can they improve?
            </label>
            <textarea
              value={improvement}
              onChange={e => setImprovement(e.target.value)}
              required
              rows={3}
              placeholder="Provide clear, actionable steps for improvement..."
              className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-[#0F2B3C]/20 focus:border-[#0F2B3C] outline-none resize-none"
            />
          </div>

          {/* Follow-up Date */}
          <div>
            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2 block">
              Follow-up Date (optional)
            </label>
            <input
              type="date"
              value={followUpDate}
              onChange={e => setFollowUpDate(e.target.value)}
              className="w-full sm:w-auto bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-[#0F2B3C]/20 focus:border-[#0F2B3C] outline-none"
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={resetForm}
              className="px-6 py-3 bg-neutral-100 text-neutral-600 rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-neutral-200 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !selectedEmployeeId || !observation.trim() || !improvement.trim()}
              className="px-6 py-3 bg-[#0F2B3C] text-white rounded-lg font-black text-xs uppercase tracking-wider hover:bg-blue-900 transition-all shadow-md flex items-center gap-2 disabled:opacity-50 active:scale-95"
            >
              {saving ? 'Submitting...' : <><Send size={14} /> Submit Feedback</>}
            </button>
          </div>
        </form>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-neutral-100 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search feedback..."
              className="w-full bg-neutral-50 border border-neutral-200 rounded-lg pl-9 pr-4 py-2.5 text-xs font-medium focus:ring-2 focus:ring-[#0F2B3C]/20 focus:border-[#0F2B3C] outline-none"
            />
          </div>
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value as any)}
            className="bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2.5 text-xs font-bold uppercase tracking-wider focus:ring-2 focus:ring-[#0F2B3C]/20 focus:border-[#0F2B3C] outline-none"
          >
            <option value="ALL">All Categories</option>
            {(Object.entries(CATEGORY_CONFIG) as [FeedbackCategory, typeof CATEGORY_CONFIG[FeedbackCategory]][]).map(([key, cfg]) => (
              <option key={key} value={key}>{cfg.label}</option>
            ))}
          </select>
          <select
            value={filterEmployee}
            onChange={e => setFilterEmployee(e.target.value)}
            className="bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2.5 text-xs font-bold uppercase tracking-wider focus:ring-2 focus:ring-[#0F2B3C]/20 focus:border-[#0F2B3C] outline-none"
          >
            <option value="ALL">All Employees</option>
            {activeStaff.map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Feedback List */}
      <div className="space-y-3">
        {storeFeedback.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border border-neutral-100 shadow-sm text-center">
            <MessageSquare size={32} className="text-neutral-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-neutral-400">No feedback yet</p>
            <p className="text-xs text-neutral-400 mt-1">Click "Give Feedback" to start coaching your team</p>
          </div>
        ) : (
          storeFeedback.map(fb => {
            const catCfg = CATEGORY_CONFIG[fb.category];
            const ratingCfg = RATING_LABELS[fb.rating];
            const isExpanded = expandedFeedbackId === fb.id;

            return (
              <div
                key={fb.id}
                className="bg-white rounded-xl border border-neutral-100 shadow-sm overflow-hidden transition-all"
              >
                {/* Summary Row */}
                <button
                  onClick={() => setExpandedFeedbackId(isExpanded ? null : fb.id)}
                  className="w-full p-4 flex items-center gap-3 text-left hover:bg-neutral-50 transition-colors"
                >
                  {/* Rating indicator */}
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-black text-sm ${
                    fb.rating >= 4 ? 'bg-green-100 text-green-700' :
                    fb.rating === 3 ? 'bg-amber-100 text-amber-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {fb.rating}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-black text-[#0F2B3C] uppercase tracking-tight truncate">
                        {fb.employeeName}
                      </span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${catCfg.bgColor} ${catCfg.color}`}>
                        {catCfg.label}
                      </span>
                    </div>
                    <div className="text-[10px] text-neutral-500 font-medium truncate">
                      {fb.observation.substring(0, 80)}{fb.observation.length > 80 ? '...' : ''}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {fb.acknowledged ? (
                      <CheckCircle size={14} className="text-green-500" />
                    ) : (
                      <Clock size={14} className="text-amber-500" />
                    )}
                    <div className="text-right hidden sm:block">
                      <div className="text-[10px] font-bold text-neutral-500">{formatDate(fb.createdAt)}</div>
                      <div className="text-[9px] text-neutral-400">{formatTime(fb.createdAt)}</div>
                    </div>
                    {isExpanded ? <ChevronUp size={14} className="text-neutral-400" /> : <ChevronDown size={14} className="text-neutral-400" />}
                  </div>
                </button>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-0 border-t border-neutral-100 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                      <div>
                        <div className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-1">Employee</div>
                        <div className="text-sm font-bold text-[#0F2B3C] flex items-center gap-1.5">
                          <UserIcon size={14} /> {fb.employeeName}
                        </div>
                      </div>
                      <div>
                        <div className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-1">Given By</div>
                        <div className="text-sm font-bold text-[#0F2B3C]">{fb.managerName}</div>
                      </div>
                      <div>
                        <div className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-1">Rating</div>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map(r => (
                              <Star
                                key={r}
                                size={14}
                                className={fb.rating >= r ? 'text-amber-400 fill-amber-400' : 'text-neutral-300'}
                              />
                            ))}
                          </div>
                          <span className={`text-xs font-bold ${ratingCfg.color}`}>{ratingCfg.label}</span>
                        </div>
                      </div>
                      <div>
                        <div className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-1">Status</div>
                        {fb.acknowledged ? (
                          <span className="text-xs font-bold text-green-600 flex items-center gap-1">
                            <CheckCircle size={12} /> Acknowledged {fb.acknowledgedAt && `on ${formatDate(fb.acknowledgedAt)}`}
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-amber-600 flex items-center gap-1">
                            <Clock size={12} /> Pending acknowledgment
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-100">
                      <div className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-2">
                        <Eye size={10} className="inline mr-1" /> Observation
                      </div>
                      <p className="text-sm text-[#0F2B3C] font-medium leading-relaxed">{fb.observation}</p>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                      <div className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-2">
                        <ArrowRight size={10} className="inline mr-1" /> How to Improve
                      </div>
                      <p className="text-sm text-[#0F2B3C] font-medium leading-relaxed">{fb.improvement}</p>
                    </div>

                    {fb.followUpDate && (
                      <div className="flex items-center gap-2 text-xs font-bold text-neutral-500">
                        <Calendar size={12} />
                        <span>Follow-up scheduled: {formatDate(fb.followUpDate)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default EmployeeFeedbackComponent;
