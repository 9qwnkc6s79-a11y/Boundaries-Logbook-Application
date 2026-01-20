import React, { useState, useMemo, useEffect } from 'react';
import { User, ChecklistSubmission, ChecklistTemplate, ChecklistTask, UserRole, TrainingModule, UserProgress, ManualSection, Recipe, Store } from '../types';
import { 
  CheckCircle2, AlertCircle, Eye, User as UserIcon, Calendar, Check, X, 
  Sparkles, Settings, Plus, Trash2, Edit3, BarChart3, ListTodo, BrainCircuit, Clock, TrendingDown, TrendingUp,
  ArrowRight, MessageSquare, Save, Users, LayoutDashboard, Flag, Activity, GraduationCap, Award, FileText, MoveUp, MoveDown, Coffee, Camera, Hash, AlertTriangle, ExternalLink, FileText as FileIcon, Image as ImageIcon, Search, ShieldCheck,
  RefreshCw, RotateCcw, CalendarDays, Timer, Store as StoreIcon, MapPin, GripVertical, AlertOctagon, Info, Zap, Gauge, History, SearchCheck, ChevronUp, ChevronDown, ClipboardList
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface ManagerHubProps {
  staff: User[];
  allUsers: User[];
  submissions: ChecklistSubmission[];
  templates: ChecklistTemplate[];
  curriculum: TrainingModule[];
  allProgress: UserProgress[];
  manual: ManualSection[];
  recipes: Recipe[];
  onReview: (id: string, approved: boolean) => void;
  onResetSubmission?: (id: string) => void;
  onUpdateTemplate: (template: ChecklistTemplate) => void;
  onAddTemplate: (template: ChecklistTemplate) => void;
  onDeleteTemplate: (id: string) => void;
  onUpdateManual: (manual: ManualSection[]) => void;
  onUpdateRecipes: (recipes: Recipe[]) => void;
  currentStoreId: string;
  stores: Store[];
}

const ManagerHub: React.FC<ManagerHubProps> = ({ 
  staff = [], allUsers = [], submissions = [], templates = [], curriculum = [], allProgress = [], manual = [], recipes = [], onReview, onResetSubmission,
  onUpdateTemplate, onAddTemplate, onDeleteTemplate, onUpdateManual, onUpdateRecipes,
  currentStoreId, stores = []
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'compliance' | 'editor' | 'staff' | 'gallery' | 'manual'>('dashboard');
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [fullscreenPhoto, setFullscreenPhoto] = useState<{url: string, title: string, user: string, aiReview?: { flagged: boolean, reason: string }} | null>(null);
  
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'TASK' | 'TEMPLATE' | 'RESET_LOG',
    templateId?: string,
    id: string,
    title: string
  } | null>(null);

  const [localTemplates, setLocalTemplates] = useState<ChecklistTemplate[]>(templates);
  const [localManual, setLocalManual] = useState<ManualSection[]>(manual);
  const [savingStatus, setSavingStatus] = useState<Record<string, 'IDLE' | 'SAVING' | 'SAVED'>>({});
  const [isDirty, setIsDirty] = useState(false);

  const currentStoreName = useMemo(() => stores.find(s => s.id === currentStoreId)?.name || 'Unknown Store', [currentStoreId, stores]);

  const getLocalStr = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    if (!isDirty) {
      setLocalTemplates(templates);
    }
  }, [templates, isDirty]);

  useEffect(() => {
    setLocalManual(manual);
  }, [manual]);

  const trainingStats = useMemo(() => {
    const onboardingLessons = curriculum.filter(m => m.category === 'ONBOARDING').flatMap(m => m.lessons);
    const continuedLessons = curriculum.filter(m => m.category === 'CONTINUED').flatMap(m => m.lessons);

    return staff.map(member => {
      const memberProgress = allProgress.filter(p => p.userId === member.id && p.status === 'COMPLETED');
      const onboardingCompleted = memberProgress.filter(p => onboardingLessons.some(l => l.id === p.lessonId)).length;
      const onboardingPercent = onboardingLessons.length > 0 ? Math.round((onboardingCompleted / onboardingLessons.length) * 100) : 0;
      const continuedCompleted = memberProgress.filter(p => continuedLessons.some(l => l.id === p.lessonId)).length;
      const continuedPercent = continuedLessons.length > 0 ? Math.round((continuedCompleted / continuedLessons.length) * 100) : 0;
      const isUpToDate = continuedPercent === 100;

      return { userId: member.id, onboardingPercent, continuedPercent, isUpToDate, totalCompleted: memberProgress.length };
    });
  }, [staff, allProgress, curriculum]);

  const complianceMatrix = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return getLocalStr(d);
    }).reverse();

    const mainTemplates = templates.filter(t => ['OPENING', 'CLOSING', 'SHIFT_CHANGE', 'WEEKLY'].includes(t.type));

    return last7Days.map(date => {
      const dayStatus = mainTemplates.map(tpl => {
        const submission = submissions.find(s => s.templateId === tpl.id && s.date === date);
        const now = new Date();
        const todayStr = getLocalStr(now);
        const isPastDeadline = now.getHours() >= (tpl.deadlineHour ?? 12) && todayStr === date;
        const isHistory = todayStr > date;

        let status: 'MISSING' | 'COMPLETED' | 'PENDING' | 'LATE' = 'PENDING';
        if (submission && submission.status !== 'DRAFT') {
          const submittedDate = submission.submittedAt ? new Date(submission.submittedAt) : null;
          status = (submittedDate && submittedDate.getHours() >= (tpl.deadlineHour ?? 12)) ? 'LATE' : 'COMPLETED';
        } else if (isHistory || isPastDeadline) {
          status = 'MISSING';
        }
        return { templateName: tpl.name, templateType: tpl.type, status };
      });
      return { date, shortDate: date.split('-').slice(1).join('/'), statuses: dayStatus };
    });
  }, [submissions, templates]);

  const performanceData = useMemo(() => {
    return staff.map(member => {
      const userTasks = (submissions || []).flatMap(s => s.taskResults || []).filter(tr => tr.completed && tr.completedByUserId === member.id);
      const userSubs = (submissions || []).filter(s => (s.taskResults || []).some(tr => tr.completedByUserId === member.id));
      
      const stats = trainingStats.find(s => s.userId === member.id);
      
      const timelySubs = userSubs.filter(s => {
        const tpl = templates.find(t => t.id === s.templateId);
        if (!tpl || !s.submittedAt) return false;
        return new Date(s.submittedAt).getHours() < (tpl.deadlineHour ?? 24);
      }).length;

      const timelinessScore = userSubs.length > 0 ? (timelySubs / userSubs.length) * 40 : 20;

      const flaggedTasks = userTasks.filter(tr => tr.aiFlagged).length;
      const accuracyScore = userTasks.length > 0 ? ((userTasks.length - flaggedTasks) / userTasks.length) * 30 : 30;

      const onboardingWt = (stats?.onboardingPercent || 0) * 0.1;
      const continuedWt = (stats?.continuedPercent || 0) * 0.1;
      const educationScore = onboardingWt + continuedWt;

      const criticalTasks = (submissions || []).flatMap(s => {
        const tpl = templates.find(t => t.id === s.templateId);
        return (s.taskResults || []).filter(tr => {
          const task = tpl?.tasks?.find(tk => tk.id === tr.taskId);
          return task?.isCritical && tr.completed && tr.completedByUserId === member.id;
        });
      }).length;
      const criticalScore = Math.min(10, criticalTasks * 2);

      const totalScore = Math.round(timelinessScore + accuracyScore + educationScore + criticalScore);

      return {
        id: member.id,
        name: member.name,
        completionRate: userTasks.length,
        submissionsCount: userSubs.length,
        criticalRate: criticalTasks,
        score: totalScore
      };
    });
  }, [staff, submissions, templates, trainingStats]);

  const allPhotos = useMemo(() => {
    return (submissions || []).flatMap(s => {
      const tpl = templates.find(t => t.id === s.templateId);
      return (s.taskResults || []).filter(tr => tr.photoUrl).map(tr => ({
        id: `${s.id}-${tr.taskId}`,
        url: tr.photoUrl!,
        title: tpl?.tasks?.find(tk => tk.id === tr.taskId)?.title || 'Standard',
        user: allUsers.find(u => u.id === tr.completedByUserId)?.name || 'Unknown',
        date: s.date,
        templateName: tpl?.name || 'Log',
        aiFlagged: tr.aiFlagged,
        aiReason: tr.aiReason
      }));
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [submissions, templates, allUsers]);

  const realTimeCompliance = useMemo(() => {
    const now = new Date();
    const localHour = now.getHours();
    const todayStr = getLocalStr(now);
    const yesterdayStr = (() => {
      const d = new Date(now);
      d.setDate(now.getDate() - 1);
      return getLocalStr(d);
    })();

    const todayTemplates = templates.filter(t => t.type === 'OPENING' || t.type === 'CLOSING' || t.type === 'SHIFT_CHANGE');
    
    return todayTemplates.map(tpl => {
      const effectiveDate = (localHour < (tpl.unlockHour ?? 0)) ? yesterdayStr : todayStr;
      const sub = submissions.find(s => s.templateId === tpl.id && s.date === effectiveDate);
      const tasksCompleted = sub?.taskResults?.filter(tr => tr.completed).length || 0;
      const totalTasks = tpl.tasks?.length || 1;
      const status = sub?.status || 'PENDING';
      const percent = Math.round((tasksCompleted / totalTasks) * 100);

      return { 
        id: sub?.id,
        templateId: tpl.id,
        name: tpl.name, 
        percent, 
        status, 
        total: totalTasks, 
        completed: tasksCompleted,
        isYesterday: effectiveDate === yesterdayStr,
        isFinalized: sub && sub.status !== 'DRAFT'
      };
    });
  }, [templates, submissions]);

  const trailingSummary = useMemo(() => {
    const totalPossible = complianceMatrix.reduce((acc, day) => acc + (day.statuses?.length || 0), 0);
    const totalCompleted = complianceMatrix.reduce((acc, day) => 
      acc + (day.statuses?.filter(s => s.status === 'COMPLETED' || s.status === 'LATE').length || 0), 0
    );
    const totalOnTime = complianceMatrix.reduce((acc, day) => 
      acc + (day.statuses?.filter(s => s.status === 'COMPLETED').length || 0), 0
    );
    const totalMissed = complianceMatrix.reduce((acc, day) => 
      acc + (day.statuses?.filter(s => s.status === 'MISSING').length || 0), 0
    );
    const completionRate = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 100;
    const punctualityRate = totalCompleted > 0 ? Math.round((totalOnTime / totalCompleted) * 100) : 100;
    return { completionRate, punctualityRate, totalMissed };
  }, [complianceMatrix]);

  const concernNotes = useMemo(() => {
    return allPhotos.filter(p => p.aiFlagged).slice(0, 5);
  }, [allPhotos]);

  const handleUpdateTemplateLocal = (templateId: string, updates: Partial<ChecklistTemplate>) => {
    setIsDirty(true);
    setLocalTemplates(prev => prev.map(t => t.id === templateId ? { ...t, ...updates } : t));
  };

  const handleSaveTemplate = async (templateId: string) => {
    const tpl = localTemplates.find(t => t.id === templateId);
    if (!tpl) return;
    setSavingStatus(prev => ({ ...prev, [templateId]: 'SAVING' }));
    
    try {
      onUpdateTemplate(tpl);
      await new Promise(resolve => setTimeout(resolve, 800));
      setSavingStatus(prev => ({ ...prev, [templateId]: 'SAVED' }));
      setIsDirty(false); 
      setTimeout(() => setSavingStatus(prev => ({ ...prev, [templateId]: 'IDLE' })), 2000);
    } catch (e) {
      setSavingStatus(prev => ({ ...prev, [templateId]: 'IDLE' }));
      alert('Failed to save protocol to cloud.');
    }
  };

  const generateAiInsight = async () => {
    setIsGenerating(true);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const context = { store: currentStoreName, compliance: complianceMatrix, performance: performanceData, onboarding: trainingStats };
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Act as the "Barista Brain" Operations Auditor. Analyze store data: ${JSON.stringify(context)}. Provide 3 action items.`,
      });
      setAiInsight(response.text || "Insight engine returned empty response.");
    } catch (e) {
      setAiInsight("AI Engine offline.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-20">
      {fullscreenPhoto && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 sm:p-12 animate-in fade-in duration-300" onClick={() => setFullscreenPhoto(null)}>
          <button className="absolute top-8 right-8 text-white p-3 hover:bg-white/10 rounded-full"><X size={32} /></button>
          <div className="max-w-5xl w-full flex flex-col items-center">
            <div className="bg-white/10 p-2 rounded-[2.5rem] shadow-2xl mb-6 relative">
              <img src={fullscreenPhoto.url} className="max-h-[70vh] rounded-[2rem] object-contain" alt="Verification" />
              {fullscreenPhoto.aiReview?.flagged && <div className="absolute top-6 right-6 bg-red-600 text-white p-3 rounded-2xl shadow-2xl animate-bounce"><AlertOctagon size={32} /></div>}
            </div>
            <div className="text-center bg-white/5 backdrop-blur-md p-6 rounded-3xl w-full">
              <h3 className="text-white text-2xl font-black uppercase tracking-tight mb-2">{fullscreenPhoto.title}</h3>
              <p className="text-blue-200 font-bold uppercase tracking-widest text-xs mb-4">Verified by {fullscreenPhoto.user}</p>
              {fullscreenPhoto.aiReview && (
                <div className={`p-4 rounded-2xl border ${fullscreenPhoto.aiReview.flagged ? 'bg-red-500/20 border-red-500 text-red-200' : 'bg-green-500/20 border-green-500 text-green-200'}`}>
                  <p className="text-[10px] font-black uppercase tracking-widest mb-1">AI Audit Result</p>
                  <p className="text-sm font-bold">{fullscreenPhoto.aiReview.reason}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-[110] bg-[#001F3F]/60 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl border border-neutral-100">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 ${deleteConfirm.type === 'RESET_LOG' ? 'bg-amber-50 text-amber-500' : 'bg-red-50 text-red-500'}`}>
              {deleteConfirm.type === 'RESET_LOG' ? <RotateCcw size={32} /> : <Trash2 size={32} />}
            </div>
            <h3 className="text-2xl font-black text-[#001F3F] uppercase tracking-tight leading-tight mb-2">
              {deleteConfirm.type === 'RESET_LOG' ? 'Reset Protocol?' : `Delete ${deleteConfirm.type === 'TASK' ? 'Standard' : 'Protocol'}?`}
            </h3>
            <p className="text-neutral-500 text-sm font-medium mb-8 leading-relaxed">
              {deleteConfirm.type === 'RESET_LOG' 
                ? `This will completely wipe today's log for "${deleteConfirm.title}" and unlock it for a fresh submission. This cannot be undone.`
                : `Are you sure you want to remove "${deleteConfirm.title}"? This action cannot be undone.`}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-4 bg-neutral-100 text-neutral-400 font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-neutral-200 transition-colors">Cancel</button>
              <button onClick={() => {
                if (deleteConfirm.type === 'RESET_LOG') onResetSubmission?.(deleteConfirm.id);
                else if (deleteConfirm.type === 'TEMPLATE') onDeleteTemplate(deleteConfirm.id);
                setDeleteConfirm(null);
              }} className={`flex-1 py-4 text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-lg active:scale-95 ${deleteConfirm.type === 'RESET_LOG' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-red-600 hover:bg-red-700'}`}>
                {deleteConfirm.type === 'RESET_LOG' ? 'Confirm Reset' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-[#001F3F] text-white rounded-lg"><StoreIcon size={14} /></div>
            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">{currentStoreName}</p>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#001F3F] uppercase tracking-tighter leading-none">Manager Hub</h1>
        </div>
        <div className="flex bg-neutral-100 p-1 rounded-xl sm:rounded-2xl border border-neutral-200 overflow-x-auto no-scrollbar">
          {[
            { id: 'dashboard', label: 'DASHBOARD', icon: LayoutDashboard },
            { id: 'compliance', label: 'COMPLIANCE', icon: Timer },
            { id: 'staff', label: 'STAFF', icon: Users },
            { id: 'gallery', label: 'AUDIT', icon: ImageIcon },
            { id: 'manual', label: 'MANUAL', icon: FileText },
            { id: 'editor', label: 'PROTOCOLS', icon: Settings }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveSubTab(tab.id as any)} className={`px-5 py-2.5 text-[9px] font-black rounded-lg transition-all flex items-center gap-2 whitespace-nowrap tracking-widest ${activeSubTab === tab.id ? 'bg-[#001F3F] text-white shadow-lg' : 'text-neutral-500 hover:text-[#001F3F]'}`}>
              <tab.icon size={14} /> {tab.label}
            </button>
          ))}
        </div>
      </header>

      <div className="space-y-8 sm:space-y-12">
        {activeSubTab === 'dashboard' && (
          <div className="space-y-10 animate-in fade-in duration-500">
            <section className="bg-white p-8 rounded-[2.5rem] border border-neutral-100 shadow-sm overflow-hidden relative">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Activity size={20} /></div>
                  <h2 className="text-xl font-black text-[#001F3F] uppercase tracking-tight">Today's Store Snapshot</h2>
                </div>
                <div className="flex items-center gap-2 bg-neutral-50 px-3 py-1.5 rounded-full border border-neutral-100">
                   <Clock size={12} className="text-neutral-400" />
                   <span className="text-[10px] font-black text-[#001F3F] uppercase tracking-widest">Real-Time Sync</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                {realTimeCompliance.map((stat, i) => (
                  <div key={i} className="p-6 bg-neutral-50/50 rounded-3xl border border-neutral-100 group hover:shadow-lg transition-all relative">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex flex-col pr-8">
                        <h3 className="text-[10px] font-black text-[#001F3F] uppercase tracking-widest truncate">{stat.name}</h3>
                        {stat.isYesterday && <span className="text-[7px] font-bold text-amber-500 uppercase tracking-tighter">Archives Visible</span>}
                      </div>
                      {stat.id && (
                        <button 
                          onClick={() => setDeleteConfirm({ type: 'RESET_LOG', id: stat.id!, title: stat.name })}
                          className="absolute top-6 right-6 p-1.5 text-neutral-300 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all"
                          title="Force Reset (Wipe Submission)"
                        >
                          <RotateCcw size={14} />
                        </button>
                      )}
                    </div>
                    <div className="flex items-end justify-between mb-2">
                      <span className="text-3xl font-black text-[#001F3F] tabular-nums">{stat.percent}%</span>
                      <span className="text-[10px] font-bold text-neutral-400 uppercase">{stat.completed}/{stat.total}</span>
                    </div>
                    <div className="w-full h-2 bg-white rounded-full overflow-hidden border border-neutral-200">
                      <div className={`h-full transition-all duration-1000 ${stat.percent === 100 ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${stat.percent}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-10 border-t border-neutral-100 grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <div className="flex items-center gap-2">
                    <History size={16} className="text-neutral-400" />
                    <h3 className="text-[11px] font-black text-[#001F3F] uppercase tracking-widest">Trailing Summary</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100 text-center">
                      <p className="text-[7px] font-black text-neutral-400 uppercase tracking-widest mb-1">Success Rate</p>
                      <p className={`text-xl font-black ${trailingSummary.completionRate > 85 ? 'text-green-600' : 'text-amber-600'}`}>{trailingSummary.completionRate}%</p>
                    </div>
                    <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100 text-center">
                      <p className="text-[7px] font-black text-neutral-400 uppercase tracking-widest mb-1">On-Time</p>
                      <p className="text-xl font-black text-[#001F3F]">{trailingSummary.punctualityRate}%</p>
                    </div>
                    <div className="p-4 bg-red-50 rounded-2xl border border-red-100 text-center">
                      <p className="text-[7px] font-black text-red-400 uppercase tracking-widest mb-1">Missed</p>
                      <p className="text-xl font-black text-red-600">{trailingSummary.totalMissed}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-2">
                    <SearchCheck size={16} className="text-red-500" />
                    <h3 className="text-[11px] font-black text-red-600 uppercase tracking-widest">Audit Alerts</h3>
                  </div>
                  <div className="space-y-3">
                    {concernNotes.length > 0 ? concernNotes.map((concern, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-red-50 rounded-2xl border border-red-100 group cursor-pointer hover:bg-red-100 transition-colors" onClick={() => setFullscreenPhoto({ ...concern, aiReview: { flagged: true, reason: concern.aiReason || '' } })}>
                        <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-red-200">
                          <img src={concern.url} className="w-full h-full object-cover" alt="Concern" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-black text-red-800 uppercase tracking-tight truncate">{concern.title}</p>
                          <p className="text-[9px] font-bold text-red-600 line-clamp-1">{concern.aiReason}</p>
                        </div>
                        <AlertCircle size={14} className="text-red-400" />
                      </div>
                    )) : (
                      <div className="p-8 border-2 border-dashed border-neutral-100 rounded-2xl flex flex-col items-center justify-center text-center">
                        <ShieldCheck size={24} className="text-green-500 mb-2" />
                        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest leading-relaxed">No AI flags detected.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-[#001F3F] p-8 rounded-[2.5rem] text-white flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="space-y-4 text-center md:text-left">
                <h2 className="text-2xl font-black uppercase tracking-tight flex items-center justify-center md:justify-start gap-3"><BrainCircuit size={28}/> Barista Brain Auditor</h2>
                <p className="text-blue-100 text-sm max-w-md">Let AI analyze current compliance trends and team educational progress to identify operational risks.</p>
              </div>
              <button onClick={generateAiInsight} disabled={isGenerating} className="px-10 py-5 bg-white text-[#001F3F] rounded-2xl font-black uppercase text-xs shadow-2xl active:scale-95 disabled:opacity-50 flex items-center gap-3 shrink-0">
                {isGenerating ? <RefreshCw className="animate-spin" size={18}/> : <Sparkles size={18}/>}
                {isGenerating ? 'Analyzing...' : 'Generate AI Report'}
              </button>
            </section>

            {aiInsight && (
              <div className="bg-white p-10 rounded-[3rem] border border-blue-100 shadow-xl animate-in slide-in-from-bottom-4">
                 <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-black text-[#001F3F] uppercase flex items-center gap-3"><ShieldCheck className="text-blue-500"/> Auditor Observations</h3>
                    <button onClick={() => setAiInsight(null)} className="text-neutral-400 hover:text-neutral-600"><X size={20}/></button>
                 </div>
                 <div className="prose text-sm text-neutral-600 whitespace-pre-wrap leading-relaxed font-medium">{aiInsight}</div>
              </div>
            )}
          </div>
        )}

        {activeSubTab === 'gallery' && (
          <section className="animate-in fade-in space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {allPhotos.map(photo => (
                <div key={photo.id} onClick={() => setFullscreenPhoto(photo)} className="group relative aspect-square bg-white rounded-[2rem] overflow-hidden cursor-pointer hover:shadow-2xl transition-all border border-neutral-100 shadow-sm">
                  <img src={photo.url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Audit" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-6 flex flex-col justify-end">
                     <p className="text-[10px] font-black text-white uppercase truncate mb-1">{photo.title}</p>
                     <p className="text-[8px] text-blue-300 font-bold uppercase tracking-widest">{photo.user} • {photo.date}</p>
                  </div>
                  {photo.aiFlagged && (
                    <div className="absolute top-4 right-4 bg-red-600 text-white p-2 rounded-xl shadow-lg">
                      <AlertOctagon size={16} />
                    </div>
                  )}
                </div>
              ))}
            </div>
            {allPhotos.length === 0 && (
              <div className="py-20 text-center border-2 border-dashed border-neutral-200 rounded-[3rem] text-neutral-300 uppercase font-black text-xs">No verification photos found.</div>
            )}
          </section>
        )}

        {activeSubTab === 'manual' && (
          <section className="animate-in fade-in space-y-6">
            {localManual.map(section => (
              <div key={section.id} className="bg-white p-8 rounded-[2.5rem] border border-neutral-100 shadow-sm space-y-6">
                 <div className="flex items-center gap-4 border-b border-neutral-50 pb-6">
                    <div className="w-12 h-12 bg-[#001F3F] text-white rounded-2xl flex items-center justify-center font-black text-xl">{section.number}</div>
                    <div className="flex-1">
                      <label className="text-[8px] font-black text-neutral-400 uppercase tracking-widest block mb-1 ml-1">Section Header</label>
                      <input value={section.title} onChange={e => {
                        const next = localManual.map(s => s.id === section.id ? { ...s, title: e.target.value } : s);
                        setLocalManual(next);
                        setIsDirty(true);
                      }} className="text-2xl font-black text-[#001F3F] uppercase bg-transparent outline-none w-full focus:ring-0 border-none p-0" />
                    </div>
                    <button onClick={() => { onUpdateManual(localManual); setIsDirty(false); }} className="p-4 bg-blue-50 text-[#001F3F] rounded-2xl hover:bg-[#001F3F] hover:text-white transition-all shadow-sm active:scale-95"><Save size={20}/></button>
                 </div>
                 <textarea rows={10} value={section.content} onChange={e => {
                   const next = localManual.map(s => s.id === section.id ? { ...s, content: e.target.value } : s);
                   setLocalManual(next);
                   setIsDirty(true);
                 }} className="w-full bg-neutral-50 p-8 rounded-[2rem] border-none text-sm text-neutral-600 font-medium leading-relaxed resize-none outline-none focus:ring-4 focus:ring-[#001F3F]/5" />
              </div>
            ))}
          </section>
        )}

        {activeSubTab === 'compliance' && (
          <section className="animate-in fade-in space-y-12">
             <div className="bg-white p-8 rounded-[2.5rem] border border-neutral-100 shadow-sm overflow-hidden">
                <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest mb-8 px-2">Operational Pulse (Last 7 Days)</h3>
                <div className="overflow-x-auto no-scrollbar">
                  <table className="w-full text-left">
                    <thead>
                      <tr>
                        <th className="pb-4 pr-6 text-[8px] font-black text-neutral-400 uppercase tracking-widest">Protocol</th>
                        {complianceMatrix.map(day => (
                          <th key={day.date} className="pb-4 px-3 text-[8px] font-black text-neutral-400 uppercase tracking-widest text-center">{day.shortDate}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-50">
                      {(templates || []).filter(t => ['OPENING', 'CLOSING', 'SHIFT_CHANGE'].includes(t.type)).map(tpl => (
                        <tr key={tpl.id}>
                          <td className="py-4 pr-6 font-bold text-xs text-[#001F3F] uppercase tracking-tight">{tpl.name}</td>
                          {complianceMatrix.map(day => {
                            const status = day.statuses?.find(s => s.templateName === tpl.name)?.status || 'PENDING';
                            return (
                              <td key={`${tpl.id}-${day.date}`} className="py-4 px-3 text-center">
                                <div className={`w-8 h-8 rounded-xl mx-auto flex items-center justify-center ${
                                  status === 'COMPLETED' ? 'bg-green-100 text-green-600' :
                                  status === 'LATE' ? 'bg-amber-100 text-amber-600' :
                                  status === 'MISSING' ? 'bg-red-100 text-red-600' : 'bg-neutral-50 text-neutral-300'
                                }`}>
                                  {status === 'COMPLETED' ? <Check size={14} strokeWidth={3}/> : 
                                   status === 'MISSING' ? <X size={14} strokeWidth={3}/> : 
                                   status === 'LATE' ? <Clock size={14} strokeWidth={3}/> : <div className="w-1.5 h-1.5 rounded-full bg-neutral-200" />}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
             </div>

             <div className="bg-white p-8 rounded-[2.5rem] border border-neutral-100 shadow-sm">
                <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest mb-8 px-2">Top Performer Leaderboard</h3>
                <div className="space-y-6">
                  {performanceData.sort((a,b) => (b.score || 0) - (a.score || 0)).map((member, idx) => (
                    <div key={member.id} className="flex items-center justify-between gap-4 p-4 hover:bg-neutral-50 rounded-2xl transition-colors group">
                       <div className="flex items-center gap-4">
                          <span className="text-[10px] font-black text-neutral-300 w-4">{idx + 1}</span>
                          <div className="w-10 h-10 rounded-xl bg-[#001F3F] text-white flex items-center justify-center font-black text-xs">{member.name?.charAt(0)}</div>
                          <div><p className="font-black text-xs text-[#001F3F] uppercase tracking-tight">{member.name}</p><p className="text-[8px] font-bold text-neutral-400 uppercase tracking-widest">{member.completionRate} Total Tasks</p></div>
                       </div>
                       <div className="flex items-center gap-4">
                          <div className="text-right"><p className="text-lg font-black text-[#001F3F]">{member.score}%</p><p className="text-[7px] font-black text-neutral-400 uppercase">Audit Score</p></div>
                          {idx === 0 && <Award size={20} className="text-amber-500 fill-amber-500/10" />}
                       </div>
                    </div>
                  ))}
                </div>
             </div>
          </section>
        )}

        {activeSubTab === 'staff' && (
          <section className="animate-in fade-in grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {staff.map(member => {
              const stats = trainingStats.find(s => s.userId === member.id);
              const perf = performanceData.find(p => p.id === member.id);
              return (
                <div key={member.id} className="bg-white p-8 rounded-[2.5rem] border border-neutral-100 shadow-sm space-y-6">
                   <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-[#001F3F] text-white rounded-[1.5rem] flex items-center justify-center font-black text-2xl">{member.name.charAt(0)}</div>
                      <div>
                        <h3 className="font-black text-xl text-[#001F3F] uppercase tracking-tight leading-none">{member.name}</h3>
                        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-2">{member.role}</p>
                      </div>
                   </div>
                   <div className="space-y-4">
                      <div className="flex justify-between text-[9px] font-black uppercase text-neutral-400 tracking-widest"><span>Compliance Score</span><span>{perf?.score || 0}%</span></div>
                      <div className="w-full h-2.5 bg-neutral-100 rounded-full overflow-hidden border border-neutral-200">
                        <div className="h-full bg-[#001F3F] transition-all duration-1000" style={{ width: `${perf?.score || 0}%` }} />
                      </div>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="bg-neutral-50 p-5 rounded-2xl text-center border border-neutral-100">
                         <p className="text-[7px] font-black text-neutral-400 uppercase tracking-widest mb-1.5">Onboarding</p>
                         <p className="text-lg font-black text-[#001F3F]">{stats?.onboardingPercent || 0}%</p>
                      </div>
                      <div className="bg-neutral-50 p-5 rounded-2xl text-center border border-neutral-100">
                         <p className="text-[7px] font-black text-neutral-400 uppercase tracking-widest mb-1.5">Academy</p>
                         <p className="text-lg font-black text-[#001F3F]">{stats?.continuedPercent || 0}%</p>
                      </div>
                   </div>
                </div>
              );
            })}
          </section>
        )}

        {activeSubTab === 'editor' && (
          <section className="animate-in fade-in space-y-8">
            <div className="flex justify-between items-center bg-white p-8 rounded-[2rem] border border-neutral-100 shadow-sm mb-8">
              <div>
                <h2 className="text-2xl font-black text-[#001F3F] uppercase tracking-tight">Protocol Editor</h2>
                <p className="text-neutral-400 text-xs font-bold uppercase tracking-widest mt-1">Configure Daily & Weekly Cycles</p>
              </div>
              <div className="flex flex-col items-end gap-3">
                <button onClick={() => {
                  const newTpl: ChecklistTemplate = {
                    id: `ct-new-${Date.now()}`,
                    storeId: currentStoreId,
                    name: 'NEW PROTOCOL',
                    type: 'OPENING',
                    deadlineHour: 12,
                    unlockHour: 0,
                    tasks: []
                  };
                  onAddTemplate(newTpl);
                  setLocalTemplates(prev => [...prev, newTpl]);
                  setIsDirty(true);
                }} className="bg-[#001F3F] text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-xl hover:bg-blue-900 transition-all active:scale-95"><Plus size={18} /> New Protocol</button>
              </div>
            </div>
            
            <div className="space-y-8">
              {localTemplates.map(tpl => (
                <div key={tpl.id} className="bg-white rounded-[2.5rem] border border-neutral-100 shadow-sm overflow-hidden group relative">
                  <div className="p-8 bg-neutral-50 flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-neutral-100">
                    <div className="flex-1 space-y-5">
                      <input value={tpl.name} onChange={e => handleUpdateTemplateLocal(tpl.id, { name: e.target.value })} className="text-2xl font-black text-[#001F3F] uppercase bg-transparent outline-none w-full focus:ring-0 border-none p-0" />
                      <div className="flex flex-wrap gap-6">
                        <div className="space-y-2">
                           <label className="text-[8px] font-black text-neutral-400 uppercase tracking-[0.2em] block ml-1">Due Time (24h)</label>
                           <input type="number" value={tpl.deadlineHour} onChange={e => handleUpdateTemplateLocal(tpl.id, { deadlineHour: parseInt(e.target.value) || 0 })} className="w-24 bg-white border border-neutral-200 p-3 rounded-xl text-sm font-black text-[#001F3F] outline-none shadow-inner" />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[8px] font-black text-neutral-400 uppercase tracking-[0.2em] block ml-1">Refresh Time (24h)</label>
                           <input type="number" value={tpl.unlockHour} onChange={e => handleUpdateTemplateLocal(tpl.id, { unlockHour: parseInt(e.target.value) || 0 })} className="w-24 bg-white border border-neutral-200 p-3 rounded-xl text-sm font-black text-blue-600 outline-none shadow-inner" />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[8px] font-black text-neutral-400 uppercase tracking-[0.2em] block ml-1">Category</label>
                           <select value={tpl.type} onChange={e => handleUpdateTemplateLocal(tpl.id, { type: e.target.value as any })} className="w-40 bg-white border border-neutral-200 p-3 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none shadow-inner appearance-none">
                              <option value="OPENING">OPENING</option>
                              <option value="CLOSING">CLOSING</option>
                              <option value="SHIFT_CHANGE">SHIFT CHANGE</option>
                              <option value="WEEKLY">WEEKLY</option>
                           </select>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-3">
                      <button onClick={() => handleSaveTemplate(tpl.id)} disabled={savingStatus[tpl.id] === 'SAVING'} className={`px-10 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl transition-all active:scale-95 ${savingStatus[tpl.id] === 'SAVED' ? 'bg-green-600 text-white' : 'bg-[#001F3F] text-white'}`}>
                        {savingStatus[tpl.id] === 'SAVING' ? <RefreshCw className="animate-spin" size={18}/> : <Save size={18}/>}
                        <span className="ml-2">{savingStatus[tpl.id] === 'SAVING' ? 'Syncing...' : 'Save Changes'}</span>
                      </button>
                      <button onClick={() => setDeleteConfirm({ type: 'TEMPLATE', id: tpl.id, title: tpl.name })} className="px-10 py-4 bg-red-50 text-red-600 rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-red-100 transition-all">Delete Protocol</button>
                    </div>
                  </div>
                  <div className="p-8 space-y-4">
                    {tpl.tasks.map(task => (
                      <div key={task.id} className="flex items-center gap-4 bg-neutral-50/50 p-5 rounded-2xl border border-neutral-100 hover:bg-white transition-all shadow-sm group/task">
                        <GripVertical size={20} className="text-neutral-300"/>
                        <input value={task.title} onChange={e => {
                          const next = tpl.tasks.map(tk => tk.id === task.id ? { ...tk, title: e.target.value } : tk);
                          handleUpdateTemplateLocal(tpl.id, { tasks: next });
                        }} className="flex-1 bg-transparent text-sm font-bold text-[#001F3F] outline-none" />
                        <div className="flex items-center gap-2">
                           <button onClick={() => {
                             const next = tpl.tasks.map(tk => tk.id === task.id ? { ...tk, requiresPhoto: !tk.requiresPhoto } : tk);
                             handleUpdateTemplateLocal(tpl.id, { tasks: next });
                           }} className={`p-3 rounded-xl transition-all ${task.requiresPhoto ? 'bg-blue-600 text-white shadow-lg' : 'bg-neutral-100 text-neutral-300 hover:text-neutral-500'}`} title="Requires Photo Proof"><Camera size={18}/></button>
                           <button onClick={() => {
                             const next = tpl.tasks.map(tk => tk.id === task.id ? { ...tk, isCritical: !tk.isCritical } : tk);
                             handleUpdateTemplateLocal(tpl.id, { tasks: next });
                           }} className={`p-3 rounded-xl transition-all ${task.isCritical ? 'bg-red-600 text-white shadow-lg' : 'bg-neutral-100 text-neutral-300 hover:text-neutral-500'}`} title="Mark as Critical Standard"><AlertTriangle size={18}/></button>
                           <button onClick={() => {
                             const next = tpl.tasks.filter(tk => tk.id !== task.id);
                             handleUpdateTemplateLocal(tpl.id, { tasks: next });
                           }} className="p-3 text-neutral-200 hover:text-red-500 transition-all opacity-0 group-hover/task:opacity-100"><Trash2 size={18}/></button>
                        </div>
                      </div>
                    ))}
                    <button onClick={() => {
                      const newTask: ChecklistTask = { id: `t-${Date.now()}`, title: 'New Task Standard', requiresPhoto: false, isCritical: false };
                      handleUpdateTemplateLocal(tpl.id, { tasks: [...tpl.tasks, newTask] });
                    }} className="w-full py-6 border-2 border-dashed border-neutral-200 rounded-2xl text-neutral-400 font-black uppercase text-[10px] tracking-[0.2em] hover:bg-neutral-50 hover:text-[#001F3F] hover:border-[#001F3F] transition-all flex items-center justify-center gap-2"><Plus size={18}/> Append Standard</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default ManagerHub;