import React, { useState, useMemo, useEffect } from 'react';
import { User, ChecklistSubmission, ChecklistTemplate, ChecklistTask, UserRole, TrainingModule, UserProgress, ManualSection, Recipe, Store, ToastSalesData, ToastLaborEntry, ToastTimeEntry } from '../types';
import {
  CheckCircle2, AlertCircle, Eye, User as UserIcon, Calendar, Check, X,
  Sparkles, Settings, Plus, Trash2, Edit3, BarChart3, ListTodo, BrainCircuit, Clock, TrendingDown, TrendingUp,
  ArrowRight, MessageSquare, Save, Users, LayoutDashboard, Flag, Activity, GraduationCap, Award, FileText, MoveUp, MoveDown, Coffee, Camera, Hash, AlertTriangle, ExternalLink, FileText as FileIcon, Image as ImageIcon, Search, ShieldCheck,
  RefreshCw, RotateCcw, CalendarDays, Timer, Store as StoreIcon, MapPin, GripVertical, AlertOctagon, Info, Zap, Gauge, History, SearchCheck, ChevronUp, ChevronDown, ClipboardList, DollarSign, TrendingUp as TrendingUpIcon, UserCheck
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { toastAPI } from '../services/toast';

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
  onOverrideAIFlag: (submissionId: string, taskId: string, approve: boolean) => void;
  onResetSubmission?: (id: string) => void;
  onUpdateTemplate: (template: ChecklistTemplate) => void;
  onAddTemplate: (template: ChecklistTemplate) => void;
  onDeleteTemplate: (id: string) => void;
  onUpdateManual: (manual: ManualSection[]) => void;
  onUpdateRecipes: (recipes: Recipe[]) => void;
  currentStoreId: string;
  stores: Store[];
  onToastSalesUpdate?: (sales: ToastSalesData | null) => void;
  onToastClockedInUpdate?: (clockedIn: ToastTimeEntry[]) => void;
}

const ManagerHub: React.FC<ManagerHubProps> = ({
  staff = [], allUsers = [], submissions = [], templates = [], curriculum = [], allProgress = [], manual = [], recipes = [], onReview, onOverrideAIFlag, onResetSubmission,
  onUpdateTemplate, onAddTemplate, onDeleteTemplate, onUpdateManual, onUpdateRecipes,
  currentStoreId, stores = [], onToastSalesUpdate, onToastClockedInUpdate
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'compliance' | 'editor' | 'staff' | 'gallery' | 'audit' | 'manual'>('dashboard');
  const [auditFilter, setAuditFilter] = useState<'pending' | 'approved' | 'all'>('pending');
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

  // Toast POS Integration State
  const [toastSales, setToastSales] = useState<ToastSalesData | null>(null);
  const [toastLabor, setToastLabor] = useState<ToastLaborEntry[]>([]);
  const [toastClockedIn, setToastClockedIn] = useState<ToastTimeEntry[]>([]);
  const [toastLoading, setToastLoading] = useState(false);
  const [toastError, setToastError] = useState<string | null>(null);
  const [isToastConfigured, setIsToastConfigured] = useState(false);

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

    // Helper to get deadline for a template on a specific date
    const getDeadline = (tpl: ChecklistTemplate, dateStr: string): Date => {
      const deadline = new Date(dateStr + 'T00:00:00');

      if (tpl.type === 'OPENING') {
        // Opening Checklist: deadline is noon that day
        deadline.setHours(12, 0, 0, 0);
      } else if (tpl.type === 'CLOSING') {
        // Closing Checklist: deadline is midnight (end of that day)
        deadline.setHours(23, 59, 59, 999);
      } else if (tpl.type === 'WEEKLY') {
        // Weekly cleans: deadline is end of that day (must be submitted on correct day)
        deadline.setHours(23, 59, 59, 999);
      } else {
        // Default: noon
        deadline.setHours(12, 0, 0, 0);
      }

      return deadline;
    };

    // Helper to check if a date is applicable for a weekly template
    const isWeeklyDateApplicable = (tpl: ChecklistTemplate, dateStr: string): boolean => {
      if (tpl.type !== 'WEEKLY') return true;

      const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayNameInTemplate = daysOfWeek.find(d => tpl.name.includes(d));
      if (!dayNameInTemplate) return true;

      const date = new Date(dateStr + 'T12:00:00');
      const dateDayName = daysOfWeek[date.getDay()];
      return dateDayName === dayNameInTemplate;
    };

    return last7Days.map(date => {
      const now = new Date();
      const todayStr = getLocalStr(now);
      const isFuture = date > todayStr;

      const dayStatus = mainTemplates.map(tpl => {
        // For weekly templates, check if this day is applicable
        if (!isWeeklyDateApplicable(tpl, date)) {
          return { templateName: tpl.name, templateType: tpl.type, status: 'N/A' as const };
        }

        // Find submission for this template submitted on this date (by submittedAt, not target date)
        const submission = submissions.find(s => {
          if (s.templateId !== tpl.id || s.status === 'DRAFT') return false;
          // Match by the date portion of submittedAt (when actually submitted)
          // Fall back to s.date for older submissions without submittedAt
          const submittedDate = s.submittedAt
            ? s.submittedAt.split('T')[0]
            : s.date;
          return submittedDate === date;
        });

        // Future date - not yet due
        if (isFuture) {
          return { templateName: tpl.name, templateType: tpl.type, status: 'FUTURE' as const };
        }

        const deadline = getDeadline(tpl, date);
        const isToday = date === todayStr;
        const isPastDeadline = now > deadline;

        let status: 'MISSING' | 'COMPLETED' | 'LATE' | 'FUTURE' | 'N/A' = 'MISSING';

        if (submission) {
          const submittedAt = submission.submittedAt ? new Date(submission.submittedAt) : null;
          if (submittedAt) {
            // Check if submitted before or after deadline
            status = submittedAt <= deadline ? 'COMPLETED' : 'LATE';
          } else {
            // No submittedAt timestamp, assume on time
            status = 'COMPLETED';
          }
        } else if (isToday && !isPastDeadline) {
          // Today but deadline hasn't passed yet - show as future/pending
          status = 'FUTURE';
        }
        // else: no submission and past deadline = MISSING (default)

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
      return (s.taskResults || []).flatMap(tr => {
        // Support both old photoUrl format and new photoUrls array format
        const photoUrls = tr.photoUrls || (tr.photoUrl ? [tr.photoUrl] : []);

        // Create an entry for each photo, filtering out stripped photos
        return photoUrls
          .filter(url => url && !url.includes('[photo-stripped-size-limit]'))
          .map((url, idx) => ({
            id: `${s.id}-${tr.taskId}-${idx}`,
            submissionId: s.id,
            taskId: tr.taskId,
            url: url,
            title: tpl?.tasks?.find(tk => tk.id === tr.taskId)?.title || 'Standard',
            user: allUsers.find(u => u.id === tr.completedByUserId)?.name || 'Unknown',
            date: s.date,
            templateName: tpl?.name || 'Log',
            aiFlagged: tr.aiFlagged,
            aiReason: tr.aiReason,
            managerOverride: tr.managerOverride,
            overrideBy: tr.overrideBy,
            overrideAt: tr.overrideAt
          }));
      });
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [submissions, templates, allUsers]);

  // Photos that need audit review (flagged by AI)
  const auditPhotos = useMemo(() => {
    const flaggedPhotos = allPhotos.filter(p => p.aiFlagged || p.managerOverride);
    switch (auditFilter) {
      case 'pending':
        return flaggedPhotos.filter(p => p.aiFlagged && !p.managerOverride);
      case 'approved':
        return flaggedPhotos.filter(p => p.managerOverride);
      case 'all':
      default:
        return flaggedPhotos;
    }
  }, [allPhotos, auditFilter]);

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
    // Only count statuses that are applicable (not FUTURE or N/A)
    const applicableStatuses = complianceMatrix.flatMap(day =>
      (day.statuses || []).filter(s => s.status !== 'FUTURE' && s.status !== 'N/A')
    );
    const totalPossible = applicableStatuses.length;
    const totalCompleted = applicableStatuses.filter(s => s.status === 'COMPLETED' || s.status === 'LATE').length;
    const totalOnTime = applicableStatuses.filter(s => s.status === 'COMPLETED').length;
    const totalMissed = applicableStatuses.filter(s => s.status === 'MISSING').length;
    const completionRate = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 100;
    const punctualityRate = totalCompleted > 0 ? Math.round((totalOnTime / totalCompleted) * 100) : 100;
    return { completionRate, punctualityRate, totalMissed };
  }, [complianceMatrix]);

  const concernNotes = useMemo(() => {
    // Only show photos that are flagged AND not yet overridden by manager
    return allPhotos.filter(p => p.aiFlagged && !p.managerOverride).slice(0, 5);
  }, [allPhotos]);

  // Map Toast employee metrics to app staff by matching names
  const enrichedPerformanceData = useMemo(() => {
    const enriched = performanceData.map(p => ({
      ...p,
      avgTicket: null as number | null,
      turnTime: null as number | null,
      shiftsLed: 0,
    }));

    if (!toastSales?.employeeMetrics || toastLabor.length === 0) return enriched;

    // Build GUID -> name map from labor data
    const guidToName = new Map<string, string>();
    toastLabor.forEach(entry => {
      guidToName.set(entry.employeeGuid, entry.employeeName);
    });
    toastClockedIn.forEach(entry => {
      guidToName.set(entry.employeeGuid, entry.employeeName);
    });

    // Build name -> Toast metrics map
    const nameToMetrics = new Map<string, { avgTicket: number; turnTime: number | null; orderCount: number }>();
    (toastSales.employeeMetrics || []).forEach(metric => {
      const name = guidToName.get(metric.employeeGuid);
      if (name) {
        nameToMetrics.set(name.toLowerCase().trim(), {
          avgTicket: metric.avgTicket,
          turnTime: metric.avgTurnTimeMinutes,
          orderCount: metric.orderCount,
        });
      }
    });

    // Count leadership shifts from labor data
    const leadershipKeywords = ['team leader', 'shift lead', 'lead', 'manager'];
    const shiftsLedMap = new Map<string, number>();
    toastLabor.forEach(entry => {
      if (leadershipKeywords.some(k => entry.jobName.toLowerCase().includes(k))) {
        const key = entry.employeeName.toLowerCase().trim();
        shiftsLedMap.set(key, (shiftsLedMap.get(key) || 0) + entry.shifts);
      }
    });

    return enriched.map(p => {
      const nameKey = p.name.toLowerCase().trim();
      const firstName = nameKey.split(' ')[0];

      // Try exact match, then first-name match
      const toastData = nameToMetrics.get(nameKey)
        || Array.from(nameToMetrics.entries()).find(([key]) => key.startsWith(firstName))?.[1]
        || null;

      const shifts = shiftsLedMap.get(nameKey)
        || Array.from(shiftsLedMap.entries()).find(([key]) => key.startsWith(firstName))?.[1]
        || 0;

      return {
        ...p,
        avgTicket: toastData?.avgTicket ?? null,
        turnTime: toastData?.turnTime ?? null,
        shiftsLed: shifts,
      };
    });
  }, [performanceData, toastSales, toastLabor, toastClockedIn]);

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

  // Toast POS Data Fetching
  const fetchToastData = async () => {
    if (!toastAPI.isConfigured()) {
      console.log('[Toast] API not configured, skipping fetch');
      setIsToastConfigured(false);
      return;
    }

    setIsToastConfigured(true);

    // Map store IDs to Toast location names
    const location = currentStoreId === 'store-prosper' ? 'prosper' : 'littleelm';

    // Check cache first (5-minute cache to avoid rate limits) - LOCATION-SPECIFIC
    const cacheKey = `toast_data_cache_${location}`;
    const cacheTimeKey = `toast_data_cache_time_${location}`;
    const cachedData = localStorage.getItem(cacheKey);
    const cacheTime = localStorage.getItem(cacheTimeKey);

    if (cachedData && cacheTime) {
      const age = Date.now() - parseInt(cacheTime);
      if (age < 5 * 60 * 1000) { // 5 minutes
        console.log(`[Toast] Using cached ${location} data (age: ${Math.floor(age / 1000)}s)`);
        const parsed = JSON.parse(cachedData);
        setToastSales(parsed.sales);
        setToastLabor(parsed.labor);
        setToastClockedIn(parsed.clockedIn);
        onToastSalesUpdate?.(parsed.sales);
        onToastClockedInUpdate?.(parsed.clockedIn);
        setToastLoading(false);
        return;
      }
    }

    setToastLoading(true);
    setToastError(null);

    try {
      console.log(`[Toast] Fetching fresh POS data for ${location}...`);
      const today = new Date().toISOString().split('T')[0];

      // Fetch all data in parallel
      const [sales, laborData] = await Promise.all([
        toastAPI.getTodaySales(location).catch(err => {
          console.error('[Toast] Sales fetch failed:', err);
          if (err.message?.includes('Too Many Requests')) {
            throw new Error('Rate limited - please wait a few minutes and refresh');
          }
          return null;
        }),
        toastAPI.getLaborData(today, today, location).catch(err => {
          console.error('[Toast] Labor fetch failed:', err);
          if (err.message?.includes('Too Many Requests')) {
            throw new Error('Rate limited - please wait a few minutes and refresh');
          }
          return { laborSummary: [], currentlyClocked: [], timeEntries: [] };
        }),
      ]);

      setToastSales(sales);
      setToastLabor(laborData.laborSummary);
      setToastClockedIn(laborData.currentlyClocked);
      onToastSalesUpdate?.(sales);
      onToastClockedInUpdate?.(laborData.currentlyClocked);

      // Cache the results
      localStorage.setItem(cacheKey, JSON.stringify({
        sales,
        labor: laborData.laborSummary,
        clockedIn: laborData.currentlyClocked
      }));
      localStorage.setItem(cacheTimeKey, Date.now().toString());

      console.log('[Toast] Data fetched and cached successfully');
    } catch (error: any) {
      console.error('[Toast] Failed to fetch POS data:', error);
      setToastError(error.message || 'Failed to connect to Toast POS');
    } finally {
      setToastLoading(false);
    }
  };

  // Fetch Toast data on mount, when campus changes, and refresh every 5 minutes
  useEffect(() => {
    fetchToastData();
    const interval = setInterval(fetchToastData, 5 * 60 * 1000); // 5 minutes
    return () => clearInterval(interval);
  }, [currentStoreId]); // Re-fetch when campus changes

  return (
    <div className="space-y-6 sm:space-y-8">
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
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <SearchCheck size={16} className="text-red-500" />
                      <h3 className="text-[11px] font-black text-red-600 uppercase tracking-widest">Audit Alerts</h3>
                    </div>
                    {concernNotes.length > 0 && (
                      <span className="px-2 py-1 bg-red-100 text-red-600 text-[9px] font-black rounded-full">{concernNotes.length} pending</span>
                    )}
                  </div>
                  <div className="space-y-4">
                    {concernNotes.length > 0 ? concernNotes.map((concern, idx) => (
                      <div key={idx} className="bg-red-50 rounded-2xl border border-red-200 overflow-hidden">
                        <div className="flex gap-4 p-4">
                          {/* Photo thumbnail - clickable to view full size */}
                          <div
                            className="w-20 h-20 rounded-xl overflow-hidden shrink-0 border-2 border-red-300 cursor-pointer hover:border-red-400 transition-colors bg-red-100"
                            onClick={() => setFullscreenPhoto({ url: concern.url, title: concern.title, user: concern.user, aiReview: { flagged: true, reason: concern.aiReason || '' } })}
                          >
                            {concern.url ? (
                              <img
                                src={concern.url}
                                className="w-full h-full object-cover"
                                alt={concern.title}
                                onError={(e) => {
                                  console.error('[Image Error] Failed to load:', concern.url);
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  target.parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center text-red-400"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg></div>';
                                }}
                                onLoad={() => console.log('[Image Loaded]', concern.url)}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-red-400">
                                <ImageIcon size={24} />
                              </div>
                            )}
                          </div>

                          {/* Info section */}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-black text-red-800 uppercase tracking-tight mb-1">{concern.title}</p>
                            <p className="text-[10px] text-red-600 font-medium line-clamp-2 mb-2">{concern.aiReason || 'Flagged for review'}</p>
                            <p className="text-[9px] text-red-500 font-bold uppercase tracking-widest">{concern.user} • {concern.date}</p>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-2 px-4 pb-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onOverrideAIFlag(concern.submissionId, concern.taskId, true);
                            }}
                            className="flex-1 py-2.5 bg-green-600 text-white rounded-xl font-black uppercase text-[9px] tracking-widest flex items-center justify-center gap-1.5 hover:bg-green-700 transition-all active:scale-95 shadow-sm"
                          >
                            <Check size={14} /> Approve Override
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onOverrideAIFlag(concern.submissionId, concern.taskId, false);
                            }}
                            className="flex-1 py-2.5 bg-neutral-200 text-neutral-600 rounded-xl font-black uppercase text-[9px] tracking-widest flex items-center justify-center gap-1.5 hover:bg-neutral-300 transition-all"
                          >
                            <X size={14} /> Keep Flagged
                          </button>
                        </div>
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

            {/* Toast POS Integration Section */}
            {isToastConfigured && (
              <section className="bg-white p-8 rounded-[2.5rem] border border-neutral-100 shadow-sm overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-50 text-green-600 rounded-xl"><DollarSign size={20} /></div>
                    <div>
                      <h2 className="text-xl font-black text-[#001F3F] uppercase tracking-tight">Toast POS Data</h2>
                      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Live Sales & Labor Tracking</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={fetchToastData}
                      disabled={toastLoading}
                      className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-neutral-600 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      <RefreshCw size={14} className={toastLoading ? 'animate-spin' : ''} />
                      Refresh
                    </button>
                    {toastSales && (
                      <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">
                        Updated {new Date(toastSales.lastUpdated).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                </div>

                {toastError && (
                  <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
                    <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-black text-amber-900 uppercase tracking-tight mb-1">Toast API Error</p>
                      <p className="text-[10px] text-amber-700 font-medium">{toastError}</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Sales Section */}
                  <div className="space-y-6">
                    <h3 className="text-[11px] font-black text-[#001F3F] uppercase tracking-widest flex items-center gap-2">
                      <DollarSign size={14} /> Today's Sales
                    </h3>
                    {toastSales ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-5 bg-green-50 rounded-2xl border border-green-100">
                            <p className="text-[7px] font-black text-green-600 uppercase tracking-widest mb-1">Total Sales</p>
                            <p className="text-2xl font-black text-green-700">${toastSales.totalSales.toFixed(2)}</p>
                          </div>
                          <div className="p-5 bg-blue-50 rounded-2xl border border-blue-100">
                            <p className="text-[7px] font-black text-blue-600 uppercase tracking-widest mb-1">Orders</p>
                            <p className="text-2xl font-black text-blue-700">{toastSales.totalOrders}</p>
                          </div>
                          <div className="p-5 bg-purple-50 rounded-2xl border border-purple-100">
                            <p className="text-[7px] font-black text-purple-600 uppercase tracking-widest mb-1">Avg Check</p>
                            <p className="text-2xl font-black text-purple-700">${toastSales.averageCheck.toFixed(2)}</p>
                          </div>
                          <div className="p-5 bg-amber-50 rounded-2xl border border-amber-100">
                            <p className="text-[7px] font-black text-amber-600 uppercase tracking-widest mb-1">Tips</p>
                            <p className="text-2xl font-black text-amber-700">${toastSales.totalTips.toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    ) : toastLoading ? (
                      <div className="flex items-center justify-center p-12">
                        <RefreshCw size={24} className="animate-spin text-neutral-300" />
                      </div>
                    ) : (
                      <div className="p-8 border-2 border-dashed border-neutral-100 rounded-2xl text-center">
                        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">No sales data available</p>
                      </div>
                    )}
                  </div>

                  {/* Labor Section */}
                  <div className="space-y-6">
                    <h3 className="text-[11px] font-black text-[#001F3F] uppercase tracking-widest flex items-center gap-2">
                      <UserCheck size={14} /> Currently Clocked In
                    </h3>
                    {toastClockedIn.length > 0 ? (
                      <div className="space-y-3">
                        {toastClockedIn.slice(0, 5).map((entry, idx) => (
                          <div key={idx} className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100 flex items-center justify-between">
                            <div>
                              <p className="text-xs font-black text-[#001F3F] uppercase tracking-tight">{entry.employeeName}</p>
                              <p className="text-[9px] text-neutral-500 font-bold uppercase tracking-widest">{entry.jobName}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-black text-green-600">{Math.floor(entry.totalHours)}h {Math.round((entry.totalHours % 1) * 60)}m</p>
                              <p className="text-[8px] text-neutral-400 font-bold uppercase">On Clock</p>
                            </div>
                          </div>
                        ))}
                        {toastClockedIn.length > 5 && (
                          <p className="text-center text-[9px] font-bold text-neutral-400 uppercase tracking-widest">
                            +{toastClockedIn.length - 5} more
                          </p>
                        )}
                      </div>
                    ) : toastLoading ? (
                      <div className="flex items-center justify-center p-12">
                        <RefreshCw size={24} className="animate-spin text-neutral-300" />
                      </div>
                    ) : (
                      <div className="p-8 border-2 border-dashed border-neutral-100 rounded-2xl text-center">
                        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">No staff currently clocked in</p>
                      </div>
                    )}

                    {toastLabor.length > 0 && (
                      <div className="mt-6 pt-6 border-t border-neutral-100">
                        <h4 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3">Labor Summary (Today)</h4>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="p-3 bg-neutral-50 rounded-xl text-center">
                            <p className="text-[7px] font-black text-neutral-400 uppercase mb-1">Total Hours</p>
                            <p className="text-lg font-black text-[#001F3F]">
                              {toastLabor.reduce((sum, e) => sum + e.totalHours, 0).toFixed(1)}
                            </p>
                          </div>
                          <div className="p-3 bg-neutral-50 rounded-xl text-center">
                            <p className="text-[7px] font-black text-neutral-400 uppercase mb-1">Shifts</p>
                            <p className="text-lg font-black text-[#001F3F]">
                              {toastLabor.reduce((sum, e) => sum + e.shifts, 0)}
                            </p>
                          </div>
                          <div className="p-3 bg-neutral-50 rounded-xl text-center">
                            <p className="text-[7px] font-black text-neutral-400 uppercase mb-1">Staff</p>
                            <p className="text-lg font-black text-[#001F3F]">{toastLabor.length}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}

            {!isToastConfigured && (
              <section className="bg-gradient-to-r from-blue-50 to-purple-50 p-8 rounded-[2.5rem] border border-blue-100 shadow-sm">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="p-4 bg-white rounded-2xl shadow-sm">
                    <Coffee size={40} className="text-[#001F3F]" />
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-xl font-black text-[#001F3F] uppercase tracking-tight mb-2">Connect Toast POS</h3>
                    <p className="text-sm text-neutral-600 font-medium mb-4">
                      Sync sales and labor data from your Toast POS system to get real-time insights in your dashboard.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 items-center">
                      <a
                        href="https://pos.toasttab.com/login"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-6 py-3 bg-[#001F3F] text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-900 transition-all flex items-center gap-2 shadow-lg"
                      >
                        <ExternalLink size={14} />
                        Get Toast API Keys
                      </a>
                      <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">
                        Add credentials to .env.local
                      </span>
                    </div>
                  </div>
                </div>
              </section>
            )}

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
            {/* Audit Filter Tabs */}
            <div className="bg-white p-6 rounded-[2rem] border border-neutral-100 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-50 text-red-600 rounded-xl"><SearchCheck size={20} /></div>
                  <div>
                    <h2 className="text-xl font-black text-[#001F3F] uppercase tracking-tight">Photo Audit Queue</h2>
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Review AI-flagged photos</p>
                  </div>
                </div>
                <div className="flex bg-neutral-100 p-1 rounded-xl border border-neutral-200">
                  {[
                    { id: 'pending', label: 'Pending Review', count: allPhotos.filter(p => p.aiFlagged && !p.managerOverride).length },
                    { id: 'approved', label: 'Approved', count: allPhotos.filter(p => p.managerOverride).length },
                    { id: 'all', label: 'All Flagged', count: allPhotos.filter(p => p.aiFlagged || p.managerOverride).length }
                  ].map(filter => (
                    <button
                      key={filter.id}
                      onClick={() => setAuditFilter(filter.id as 'pending' | 'approved' | 'all')}
                      className={`px-4 py-2 text-[9px] font-black rounded-lg transition-all flex items-center gap-2 whitespace-nowrap tracking-widest ${
                        auditFilter === filter.id
                          ? 'bg-[#001F3F] text-white shadow-lg'
                          : 'text-neutral-500 hover:text-[#001F3F]'
                      }`}
                    >
                      {filter.label}
                      <span className={`px-1.5 py-0.5 rounded-md text-[8px] ${
                        auditFilter === filter.id ? 'bg-white/20' : 'bg-neutral-200'
                      }`}>{filter.count}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Audit Photo Cards */}
            {auditPhotos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {auditPhotos.map(photo => (
                  <div key={photo.id} className={`bg-white rounded-[2rem] overflow-hidden border shadow-sm ${
                    photo.managerOverride ? 'border-green-200' : 'border-red-200'
                  }`}>
                    {/* Photo Preview */}
                    <div
                      className="relative aspect-video cursor-pointer group"
                      onClick={() => setFullscreenPhoto({
                        url: photo.url,
                        title: photo.title,
                        user: photo.user,
                        aiReview: { flagged: photo.aiFlagged || false, reason: photo.aiReason || '' }
                      })}
                    >
                      <img src={photo.url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="Flagged" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                      {/* Status Badge */}
                      <div className={`absolute top-4 right-4 px-3 py-1.5 rounded-xl flex items-center gap-2 ${
                        photo.managerOverride
                          ? 'bg-green-600 text-white'
                          : 'bg-red-600 text-white'
                      }`}>
                        {photo.managerOverride ? <ShieldCheck size={14} /> : <AlertOctagon size={14} />}
                        <span className="text-[9px] font-black uppercase tracking-widest">
                          {photo.managerOverride ? 'Approved' : 'Flagged'}
                        </span>
                      </div>

                      {/* Photo Info Overlay */}
                      <div className="absolute bottom-4 left-4 right-4">
                        <p className="text-white text-sm font-black uppercase truncate">{photo.title}</p>
                        <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest">{photo.user} • {photo.date}</p>
                      </div>
                    </div>

                    {/* AI Reason & Actions */}
                    <div className="p-6 space-y-4">
                      <div className={`p-4 rounded-xl ${photo.managerOverride ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'}`}>
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg shrink-0 ${photo.managerOverride ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                            <BrainCircuit size={16} />
                          </div>
                          <div>
                            <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${photo.managerOverride ? 'text-green-600' : 'text-red-600'}`}>
                              {photo.managerOverride ? 'Manager Override' : 'AI Detection'}
                            </p>
                            <p className={`text-sm font-medium leading-relaxed ${photo.managerOverride ? 'text-green-800' : 'text-red-800'}`}>
                              {photo.aiReason || 'Flagged for review'}
                            </p>
                            {photo.managerOverride && photo.overrideAt && (
                              <p className="text-[9px] text-green-600 font-bold mt-2 uppercase tracking-widest">
                                Approved {new Date(photo.overrideAt).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons - Only show for pending items */}
                      {photo.aiFlagged && !photo.managerOverride && (
                        <div className="flex gap-3">
                          <button
                            onClick={() => onOverrideAIFlag(photo.submissionId, photo.taskId, true)}
                            className="flex-1 py-4 bg-green-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-green-700 transition-all active:scale-95 shadow-lg"
                          >
                            <Check size={16} /> Approve Override
                          </button>
                          <button
                            onClick={() => onOverrideAIFlag(photo.submissionId, photo.taskId, false)}
                            className="flex-1 py-4 bg-neutral-100 text-neutral-500 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-neutral-200 transition-all"
                          >
                            <X size={16} /> Keep Flagged
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center border-2 border-dashed border-neutral-200 rounded-[3rem]">
                <ShieldCheck size={48} className="mx-auto text-green-500 mb-4" />
                <p className="text-neutral-400 uppercase font-black text-xs tracking-widest">
                  {auditFilter === 'pending' ? 'No photos pending review' :
                   auditFilter === 'approved' ? 'No approved overrides yet' :
                   'No flagged photos found'}
                </p>
              </div>
            )}

            {/* All Photos Gallery (below audit queue) */}
            <div className="pt-8 border-t border-neutral-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-neutral-100 text-neutral-600 rounded-xl"><ImageIcon size={20} /></div>
                <h3 className="text-lg font-black text-[#001F3F] uppercase tracking-tight">All Verification Photos</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {allPhotos.map(photo => (
                  <div
                    key={photo.id}
                    onClick={() => setFullscreenPhoto({
                      url: photo.url,
                      title: photo.title,
                      user: photo.user,
                      aiReview: photo.aiFlagged ? { flagged: true, reason: photo.aiReason || '' } : undefined
                    })}
                    className="group relative aspect-square bg-white rounded-2xl overflow-hidden cursor-pointer hover:shadow-xl transition-all border border-neutral-100 shadow-sm"
                  >
                    <img src={photo.url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Audit" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end">
                      <p className="text-[8px] font-black text-white uppercase truncate">{photo.title}</p>
                    </div>
                    {/* Status indicator */}
                    {(photo.aiFlagged || photo.managerOverride) && (
                      <div className={`absolute top-2 right-2 p-1.5 rounded-lg shadow-lg ${
                        photo.managerOverride ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                      }`}>
                        {photo.managerOverride ? <ShieldCheck size={12} /> : <AlertOctagon size={12} />}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {allPhotos.length === 0 && (
                <div className="py-12 text-center border-2 border-dashed border-neutral-200 rounded-2xl text-neutral-300 uppercase font-black text-xs">
                  No verification photos found.
                </div>
              )}
            </div>
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
                            const status = day.statuses?.find(s => s.templateName === tpl.name)?.status || 'FUTURE';
                            return (
                              <td key={`${tpl.id}-${day.date}`} className="py-4 px-3 text-center">
                                <div className={`w-8 h-8 rounded-xl mx-auto flex items-center justify-center ${
                                  status === 'COMPLETED' ? 'bg-green-100 text-green-600' :
                                  status === 'LATE' ? 'bg-amber-100 text-amber-600' :
                                  status === 'MISSING' ? 'bg-red-100 text-red-600' :
                                  status === 'N/A' ? 'bg-transparent' : 'bg-neutral-50 text-neutral-300'
                                }`}>
                                  {status === 'COMPLETED' ? <Check size={14} strokeWidth={3}/> :
                                   status === 'LATE' ? <Clock size={14} strokeWidth={3}/> :
                                   status === 'MISSING' ? <X size={14} strokeWidth={3}/> :
                                   status === 'N/A' ? null : <div className="w-1.5 h-1.5 rounded-full bg-neutral-300" />}
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
                <div className="flex items-center justify-between mb-8 px-2">
                  <div className="flex items-center gap-3">
                    <Award size={20} className="text-amber-500" />
                    <h3 className="text-lg font-black text-[#001F3F] uppercase tracking-tight">Team Leader Leaderboard</h3>
                  </div>
                  <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Last 7 Days</span>
                </div>
                <div className="space-y-6">
                  {enrichedPerformanceData.sort((a,b) => (b.score || 0) - (a.score || 0)).map((member, idx) => (
                    <div key={member.id} className={`p-6 rounded-3xl border transition-colors ${idx === 0 ? 'border-amber-200 bg-amber-50/30' : 'border-neutral-100 bg-neutral-50/30'}`}>
                       <div className="flex items-center gap-4 mb-5">
                          <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm text-white ${idx === 0 ? 'bg-amber-500' : idx === 1 ? 'bg-neutral-400' : 'bg-neutral-300'}`}>#{idx + 1}</div>
                          <div>
                            <p className="font-black text-sm text-[#001F3F] uppercase tracking-tight">{member.name}</p>
                            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{member.shiftsLed > 0 ? `${member.shiftsLed} shift${member.shiftsLed !== 1 ? 's' : ''} led` : `${member.completionRate} tasks`}</p>
                          </div>
                       </div>
                       <div className="grid grid-cols-5 gap-3">
                          <div className="text-center">
                            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Timeliness</p>
                            <p className={`text-sm font-black ${(member.score || 0) >= 50 ? 'text-green-600' : 'text-red-500'}`}>
                              {Math.round(((member.submissionsCount > 0 ? performanceData.find(p => p.id === member.id)?.score || 0 : 0) * 0.4))}
                              <span className="text-neutral-300">/40</span>
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Turn Time</p>
                            <p className={`text-sm font-black ${member.turnTime !== null ? 'text-[#001F3F]' : 'text-neutral-300'}`}>
                              {member.turnTime !== null ? `${member.turnTime}m` : 'N/A'}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Avg Ticket</p>
                            <p className={`text-sm font-black ${member.avgTicket !== null ? 'text-[#001F3F]' : 'text-neutral-300'}`}>
                              {member.avgTicket !== null ? `$${member.avgTicket.toFixed(2)}` : 'N/A'}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Reviews</p>
                            <p className="text-sm font-black text-neutral-300">&mdash;</p>
                          </div>
                          <div className="text-center">
                            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Score</p>
                            <p className={`text-lg font-black ${(member.score || 0) >= 50 ? 'text-green-600' : 'text-red-500'}`}>{member.score}</p>
                          </div>
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
                    {tpl.tasks.map((task, taskIndex) => (
                      <div key={task.id} className="flex items-center gap-4 bg-neutral-50/50 p-5 rounded-2xl border border-neutral-100 hover:bg-white transition-all shadow-sm group/task">
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => {
                              if (taskIndex === 0) return;
                              const newTasks = [...tpl.tasks];
                              [newTasks[taskIndex - 1], newTasks[taskIndex]] = [newTasks[taskIndex], newTasks[taskIndex - 1]];
                              handleUpdateTemplateLocal(tpl.id, { tasks: newTasks });
                            }}
                            disabled={taskIndex === 0}
                            className={`p-1 rounded transition-all ${taskIndex === 0 ? 'text-neutral-200 cursor-not-allowed' : 'text-neutral-400 hover:text-[#001F3F] hover:bg-neutral-100'}`}
                            title="Move Up"
                          >
                            <MoveUp size={16}/>
                          </button>
                          <button
                            onClick={() => {
                              if (taskIndex === tpl.tasks.length - 1) return;
                              const newTasks = [...tpl.tasks];
                              [newTasks[taskIndex], newTasks[taskIndex + 1]] = [newTasks[taskIndex + 1], newTasks[taskIndex]];
                              handleUpdateTemplateLocal(tpl.id, { tasks: newTasks });
                            }}
                            disabled={taskIndex === tpl.tasks.length - 1}
                            className={`p-1 rounded transition-all ${taskIndex === tpl.tasks.length - 1 ? 'text-neutral-200 cursor-not-allowed' : 'text-neutral-400 hover:text-[#001F3F] hover:bg-neutral-100'}`}
                            title="Move Down"
                          >
                            <MoveDown size={16}/>
                          </button>
                        </div>
                        <input value={task.title} onChange={e => {
                          const next = tpl.tasks.map(tk => tk.id === task.id ? { ...tk, title: e.target.value } : tk);
                          handleUpdateTemplateLocal(tpl.id, { tasks: next });
                        }} className="flex-1 bg-transparent text-sm font-bold text-[#001F3F] outline-none" />
                        <div className="flex items-center gap-2">
                           {/* Photo requirement control */}
                           <div className="flex items-center gap-1">
                             <button
                               onClick={() => {
                                 const currentPhotos = task.requiredPhotos || (task.requiresPhoto ? 1 : 0);
                                 const newPhotos = Math.max(0, currentPhotos - 1);
                                 const next = tpl.tasks.map(tk => tk.id === task.id ? {
                                   ...tk,
                                   requiresPhoto: newPhotos > 0,
                                   requiredPhotos: newPhotos > 0 ? newPhotos : undefined
                                 } : tk);
                                 handleUpdateTemplateLocal(tpl.id, { tasks: next });
                               }}
                               className="p-2 rounded-lg bg-neutral-100 text-neutral-400 hover:bg-neutral-200 hover:text-neutral-600 transition-all"
                               title="Decrease photos"
                             >
                               <ChevronDown size={14}/>
                             </button>
                             <div
                               className={`px-3 py-2 rounded-xl flex items-center gap-2 min-w-[70px] justify-center ${
                                 (task.requiredPhotos || (task.requiresPhoto ? 1 : 0)) > 0
                                   ? 'bg-blue-600 text-white shadow-lg'
                                   : 'bg-neutral-100 text-neutral-400'
                               }`}
                               title="Required photos"
                             >
                               <Camera size={16}/>
                               <span className="text-xs font-black">{task.requiredPhotos || (task.requiresPhoto ? 1 : 0)}</span>
                             </div>
                             <button
                               onClick={() => {
                                 const currentPhotos = task.requiredPhotos || (task.requiresPhoto ? 1 : 0);
                                 const newPhotos = currentPhotos + 1;
                                 const next = tpl.tasks.map(tk => tk.id === task.id ? {
                                   ...tk,
                                   requiresPhoto: true,
                                   requiredPhotos: newPhotos
                                 } : tk);
                                 handleUpdateTemplateLocal(tpl.id, { tasks: next });
                               }}
                               className="p-2 rounded-lg bg-neutral-100 text-neutral-400 hover:bg-neutral-200 hover:text-neutral-600 transition-all"
                               title="Increase photos"
                             >
                               <ChevronUp size={14}/>
                             </button>
                           </div>
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