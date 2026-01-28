import React, { useState, useMemo, useEffect } from 'react';
import { User, ChecklistSubmission, ChecklistTemplate, ChecklistTask, UserRole, TrainingModule, UserProgress, ManualSection, Recipe, Store, ToastSalesData, ToastLaborEntry, ToastTimeEntry, CashDeposit } from '../types';
import {
  CheckCircle2, AlertCircle, Eye, User as UserIcon, Calendar, Check, X,
  Sparkles, Settings, Plus, Trash2, Edit3, BarChart3, ListTodo, BrainCircuit, Clock, TrendingDown, TrendingUp,
  ArrowRight, MessageSquare, Save, Users, LayoutDashboard, Flag, Activity, GraduationCap, Award, FileText, MoveUp, MoveDown, Coffee, Camera, Hash, AlertTriangle, ExternalLink, FileText as FileIcon, Image as ImageIcon, Search, ShieldCheck,
  RefreshCw, RotateCcw, CalendarDays, Timer, Store as StoreIcon, MapPin, GripVertical, AlertOctagon, Info, Zap, Gauge, History, SearchCheck, ChevronUp, ChevronDown, ClipboardList, DollarSign, TrendingUp as TrendingUpIcon, UserCheck, Target, Trophy
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { toastAPI } from '../services/toast';
import { db } from '../services/db';
import { detectLeaders, calculateTimelinessScore, calculateTurnTimeScore, calculateSalesScore, determineShiftOwnership } from '../utils/leadershipTracking';

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
  onPhotoComment?: (submissionId: string, taskId: string, comment: string) => Promise<void>;
  currentStoreId: string;
  stores: Store[];
  onToastSalesUpdate?: (sales: ToastSalesData | null) => void;
  onToastClockedInUpdate?: (clockedIn: ToastTimeEntry[]) => void;
}

const ManagerHub: React.FC<ManagerHubProps> = ({
  staff = [], allUsers = [], submissions = [], templates = [], curriculum = [], allProgress = [], manual = [], recipes = [], onReview, onOverrideAIFlag, onResetSubmission,
  onUpdateTemplate, onAddTemplate, onDeleteTemplate, onUpdateManual, onUpdateRecipes, onPhotoComment,
  currentStoreId, stores = [], onToastSalesUpdate, onToastClockedInUpdate
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'compliance' | 'editor' | 'staff' | 'gallery' | 'audit' | 'manual' | 'cash-audit' | 'performance'>('dashboard');
  const [auditFilter, setAuditFilter] = useState<'pending' | 'approved' | 'all'>('pending');
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [fullscreenPhoto, setFullscreenPhoto] = useState<{
    url: string;
    title: string;
    user: string;
    aiReview?: { flagged: boolean; reason: string };
    submissionId?: string;
    taskId?: string;
    existingComment?: string;
  } | null>(null);
  const [photoComment, setPhotoComment] = useState('');
  const [savingComment, setSavingComment] = useState(false);

  // Cash Deposit State
  const [cashDeposits, setCashDeposits] = useState<CashDeposit[]>([]);
  const [toastCashData, setToastCashData] = useState<any | null>(null); // Cash entries from Toast
  const [showDepositForm, setShowDepositForm] = useState(false);
  const [depositFormData, setDepositFormData] = useState({
    actualDeposit: '',
    notes: ''
  });
  const [lastDepositDate, setLastDepositDate] = useState<string | null>(null);
  const [depositSaving, setDepositSaving] = useState(false);
  
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
  const [expandedStaffId, setExpandedStaffId] = useState<string | null>(null);
  const [expandedProtocolId, setExpandedProtocolId] = useState<string | null>(null);

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

  // Load existing comment when photo modal opens
  useEffect(() => {
    if (fullscreenPhoto?.existingComment) {
      setPhotoComment(fullscreenPhoto.existingComment);
    } else {
      setPhotoComment('');
    }
  }, [fullscreenPhoto]);

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
      const percent = Math.min(100, Math.round((tasksCompleted / totalTasks) * 100));

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
  const fetchToastData = async (forceRefresh: boolean = false) => {
    if (!toastAPI.isConfigured()) {
      console.log('[Toast] API not configured, skipping fetch');
      setIsToastConfigured(false);
      return;
    }

    setIsToastConfigured(true);

    // Map store IDs to Toast location names
    const location = currentStoreId === 'store-prosper' ? 'prosper' : 'littleelm';
    console.log(`[Toast] Fetching data for store: ${currentStoreId} -> location: ${location} (forceRefresh: ${forceRefresh})`);

    // Check cache first (5-minute cache to avoid rate limits) - LOCATION-SPECIFIC
    const cacheKey = `toast_data_cache_${location}`;
    const cacheTimeKey = `toast_data_cache_time_${location}`;

    if (forceRefresh) {
      console.log(`[Toast] Force refresh - clearing cache for ${location}`);
      localStorage.removeItem(cacheKey);
      localStorage.removeItem(cacheTimeKey);
    }

    const cachedData = localStorage.getItem(cacheKey);
    const cacheTime = localStorage.getItem(cacheTimeKey);

    if (!forceRefresh && cachedData && cacheTime) {
      const age = Date.now() - parseInt(cacheTime);
      if (age < 5 * 60 * 1000) { // 5 minutes
        console.log(`[Toast] Using cached ${location} data (age: ${Math.floor(age / 1000)}s)`);
        const parsed = JSON.parse(cachedData);
        console.log(`[Toast] Cached data location verification: ${parsed.sales?.location || 'unknown'}`);

        // Verify the cached data is for the correct location
        if (parsed.sales && parsed.sales.location !== location) {
          console.warn(`[Toast] Cache mismatch! Cached location: ${parsed.sales.location}, Expected: ${location}. Fetching fresh data.`);
          localStorage.removeItem(cacheKey);
          localStorage.removeItem(cacheTimeKey);
        } else {
          setToastSales(parsed.sales);
          setToastLabor(parsed.labor);
          setToastClockedIn(parsed.clockedIn);
          onToastSalesUpdate?.(parsed.sales);
          onToastClockedInUpdate?.(parsed.clockedIn);
          setToastLoading(false);
          return;
        }
      } else {
        console.log(`[Toast] Cache expired for ${location} (age: ${Math.floor(age / 1000)}s), fetching fresh data`);
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

      console.log(`[Toast] Fresh data fetched for ${location}:`, {
        salesLocation: sales?.location,
        totalSales: sales?.totalSales,
        totalOrders: sales?.totalOrders,
        clockedIn: laborData.currentlyClocked.length,
        clockedInNames: laborData.currentlyClocked.map(e => e.employeeName)
      });

      // Verify the fetched data matches the requested location
      if (sales && sales.location !== location) {
        console.error(`[Toast] API returned wrong location! Expected: ${location}, Got: ${sales.location}`);
        throw new Error(`API returned data for wrong location: ${sales.location}`);
      }

      setToastSales(sales);
      setToastLabor(laborData.laborSummary);
      setToastClockedIn(laborData.currentlyClocked);
      onToastSalesUpdate?.(sales);
      onToastClockedInUpdate?.(laborData.currentlyClocked);

      // Cache the results with location verification
      localStorage.setItem(cacheKey, JSON.stringify({
        sales,
        labor: laborData.laborSummary,
        clockedIn: laborData.currentlyClocked
      }));
      localStorage.setItem(cacheTimeKey, Date.now().toString());

      console.log(`[Toast] Data cached successfully for ${location} at key: ${cacheKey}`);
    } catch (error: any) {
      console.error('[Toast] Failed to fetch POS data:', error);
      setToastError(error.message || 'Failed to connect to Toast POS');
    } finally {
      setToastLoading(false);
    }
  };

  // Load deposits from Firebase
  const loadDeposits = async () => {
    try {
      console.log('[Deposits] Loading from Firebase...');
      const allDeposits = await db.fetchDeposits();

      // Filter by current store and sort by deposit date descending
      const storeDeposits = allDeposits
        .filter(d => d.storeId === currentStoreId)
        .sort((a, b) => new Date(b.depositDate).getTime() - new Date(a.depositDate).getTime());

      setCashDeposits(storeDeposits);

      // Set last deposit date to reset cash accumulation period
      if (storeDeposits.length > 0) {
        setLastDepositDate(storeDeposits[0].depositDate);
      }

      console.log(`[Deposits] Loaded ${storeDeposits.length} deposits for store ${currentStoreId}`);
    } catch (error: any) {
      console.error('[Deposits] Failed to load deposits:', error);
    }
  };

  // Fetch Toast data on mount, when campus changes, and refresh every 5 minutes
  useEffect(() => {
    console.log(`[Toast] Store changed to: ${currentStoreId}, forcing refresh and clearing all caches`);

    // Clear ALL Toast cache keys (both locations) when store changes
    localStorage.removeItem('toast_data_cache_littleelm');
    localStorage.removeItem('toast_data_cache_time_littleelm');
    localStorage.removeItem('toast_data_cache_prosper');
    localStorage.removeItem('toast_data_cache_time_prosper');

    // Force refresh when store changes to clear cache and fetch new data
    fetchToastData(true);
    fetchCashData(); // Also fetch cash entry data
    loadDeposits(); // Load cash deposits from Firebase

    // Set up interval for automatic refreshes (without forcing)
    const interval = setInterval(() => {
      fetchToastData(false);
      fetchCashData();
    }, 5 * 60 * 1000); // 5 minutes
    return () => clearInterval(interval);
  }, [currentStoreId]); // Re-fetch when campus changes

  // Fetch Toast Cash Entry Data
  const fetchCashData = async () => {
    if (!toastAPI.isConfigured()) return;

    const location = currentStoreId === 'store-prosper' ? 'prosper' : 'littleelm';

    try {
      // Determine start date (last deposit or beginning of month)
      const startDate = lastDepositDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
      const endDate = new Date().toISOString().split('T')[0];

      console.log(`[Toast Cash] Fetching cash entries from ${startDate} to ${endDate}`);

      const response = await fetch(`/api/toast-cash?startDate=${startDate}&endDate=${endDate}&location=${location}`);

      if (!response.ok) {
        const errorData = await response.json();
        // Silently skip if 403 (permissions issue with Toast API account)
        if (response.status === 403) {
          console.warn('[Toast Cash] Cash Management API not enabled for this Toast account (403 Forbidden)');
          return;
        }
        throw new Error(errorData.message || 'Failed to fetch cash data');
      }

      const data = await response.json();
      setToastCashData(data);
      console.log(`[Toast Cash] Fetched: Cash Out: $${data.cashOut}, Pay Outs: $${data.payOuts}, Tip Outs: $${data.tipOuts}`);
    } catch (error: any) {
      console.warn('[Toast Cash] Cash data not available:', error.message);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-20">
      {fullscreenPhoto && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 sm:p-12 animate-in fade-in duration-300"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setFullscreenPhoto(null);
              setPhotoComment('');
            }
          }}
        >
          <button
            className="absolute top-8 right-8 text-white p-3 hover:bg-white/10 rounded-full"
            onClick={() => {
              setFullscreenPhoto(null);
              setPhotoComment('');
            }}
          >
            <X size={32} />
          </button>
          <div className="max-w-5xl w-full flex flex-col items-center">
            <div className="bg-white/10 p-2 rounded-[2.5rem] shadow-2xl mb-6 relative">
              <img src={fullscreenPhoto.url} className="max-h-[60vh] rounded-[2rem] object-contain" alt="Verification" />
              {fullscreenPhoto.aiReview?.flagged && <div className="absolute top-6 right-6 bg-red-600 text-white p-3 rounded-2xl shadow-2xl animate-bounce"><AlertOctagon size={32} /></div>}
            </div>
            <div className="text-center bg-white/5 backdrop-blur-md p-6 rounded-3xl w-full">
              <h3 className="text-white text-2xl font-black uppercase tracking-tight mb-2">{fullscreenPhoto.title}</h3>
              <p className="text-blue-200 font-bold uppercase tracking-widest text-xs mb-4">Verified by {fullscreenPhoto.user}</p>
              {fullscreenPhoto.aiReview && (
                <div className={`p-4 rounded-2xl border ${fullscreenPhoto.aiReview.flagged ? 'bg-red-500/20 border-red-500 text-red-200' : 'bg-green-500/20 border-green-500 text-green-200'} mb-4`}>
                  <p className="text-[10px] font-black uppercase tracking-widest mb-1">AI Audit Result</p>
                  <p className="text-sm font-bold">{fullscreenPhoto.aiReview.reason}</p>
                </div>
              )}

              {/* Manager Comment Section */}
              {fullscreenPhoto.submissionId && fullscreenPhoto.taskId && (
                <div className="mt-6 text-left" onClick={(e) => e.stopPropagation()}>
                  <label className="text-white text-xs font-black uppercase tracking-widest mb-2 block">
                    <MessageSquare size={12} className="inline mr-1" />
                    Manager Feedback
                  </label>
                  <textarea
                    value={photoComment}
                    onChange={(e) => setPhotoComment(e.target.value)}
                    placeholder="Add feedback or notes about this photo..."
                    className="w-full bg-white/10 border border-white/20 rounded-xl p-4 text-white placeholder-white/40 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px] resize-none"
                  />
                  {fullscreenPhoto.existingComment && !photoComment && (
                    <p className="text-xs text-blue-200/60 mt-2 italic">Previous: {fullscreenPhoto.existingComment}</p>
                  )}
                  <button
                    onClick={async () => {
                      if (!photoComment.trim() || !onPhotoComment) return;
                      setSavingComment(true);
                      try {
                        await onPhotoComment(fullscreenPhoto.submissionId!, fullscreenPhoto.taskId!, photoComment.trim());
                        setFullscreenPhoto(null);
                        setPhotoComment('');
                      } catch (error) {
                        console.error('Failed to save comment:', error);
                        alert('Failed to save comment');
                      } finally {
                        setSavingComment(false);
                      }
                    }}
                    disabled={!photoComment.trim() || savingComment}
                    className="mt-3 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white py-3 px-6 rounded-xl font-black uppercase text-xs tracking-widest transition-all"
                  >
                    {savingComment ? 'Saving...' : 'Save Feedback'}
                  </button>
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

        {/* Tab navigation with scroll indicators */}
        <div className="relative">
          {/* Left fade gradient - mobile only */}
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white via-white/80 to-transparent z-10 pointer-events-none md:hidden" />

          {/* Tabs */}
          <div className="flex bg-neutral-100 p-1 rounded-xl sm:rounded-2xl border border-neutral-200 overflow-x-auto no-scrollbar">
            {[
              { id: 'dashboard', label: 'DASHBOARD', icon: LayoutDashboard },
              { id: 'compliance', label: 'COMPLIANCE', icon: Timer },
              { id: 'performance', label: 'PERFORMANCE', icon: Target },
              { id: 'staff', label: 'STAFF', icon: Users },
              { id: 'gallery', label: 'AUDIT', icon: ImageIcon },
              { id: 'cash-audit', label: 'CASH', icon: DollarSign },
              { id: 'manual', label: 'MANUAL', icon: FileText },
              { id: 'editor', label: 'PROTOCOLS', icon: Settings }
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveSubTab(tab.id as any)} className={`px-5 py-2.5 text-[9px] font-black rounded-lg transition-all flex items-center gap-2 whitespace-nowrap tracking-widest ${activeSubTab === tab.id ? 'bg-[#001F3F] text-white shadow-lg' : 'text-neutral-500 hover:text-[#001F3F]'}`}>
                <tab.icon size={14} /> {tab.label}
              </button>
            ))}
          </div>

          {/* Right fade gradient - mobile only */}
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white via-white/80 to-transparent z-10 pointer-events-none md:hidden" />
        </div>
      </header>

      <div className="space-y-8 sm:space-y-12">
        {activeSubTab === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* Live Store Performance - Top Priority */}
            <section className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-[2.5rem] shadow-xl text-white">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-xl"><Gauge size={20} /></div>
                  <h2 className="text-xl font-black uppercase tracking-tight">Live Store Performance</h2>
                </div>
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Live</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Today's Sales */}
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign size={16} className="text-green-300" />
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-white/80">Today's Sales</h3>
                  </div>
                  <div className="text-3xl font-black mb-2">${toastSales?.totalSales?.toFixed(0) || '—'}</div>
                  <div className="text-[10px] font-bold text-white/60">{toastSales?.totalOrders || 0} orders • ${toastSales?.averageCheck?.toFixed(2) || '—'} avg</div>
                </div>

                {/* Turn Time - Critical Metric */}
                <div className={`backdrop-blur-sm rounded-2xl p-6 border-2 ${
                  !toastSales?.averageTurnTime ? 'bg-white/10 border-white/20' :
                  toastSales.averageTurnTime < 5 ? 'bg-green-500/30 border-green-300' :
                  toastSales.averageTurnTime < 6 ? 'bg-blue-500/30 border-blue-300' :
                  toastSales.averageTurnTime < 7 ? 'bg-amber-500/30 border-amber-300' :
                  'bg-red-500/30 border-red-300'
                }`}>
                  <div className="flex items-center gap-2 mb-3">
                    <Timer size={16} className="text-white" />
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-white/80">Turn Time</h3>
                  </div>
                  <div className="text-3xl font-black mb-2">{toastSales?.averageTurnTime?.toFixed(1) || '—'}<span className="text-xl ml-1">min</span></div>
                  <div className="text-[10px] font-bold text-white/80">
                    {!toastSales?.averageTurnTime ? 'No data' :
                     toastSales.averageTurnTime < 5 ? 'Excellent (40pts)' :
                     toastSales.averageTurnTime < 6 ? 'Good (35pts)' :
                     toastSales.averageTurnTime < 7 ? 'Fair (25pts)' : 'Needs Improvement (15pts)'}
                  </div>
                </div>

                {/* Staff Clocked In */}
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                  <div className="flex items-center gap-2 mb-3">
                    <Users size={16} className="text-blue-300" />
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-white/80">Staff On Duty</h3>
                  </div>
                  <div className="text-3xl font-black mb-2">{toastClockedIn.length}</div>
                  <div className="text-[10px] font-bold text-white/60 truncate">
                    {toastClockedIn.length > 0 ? toastClockedIn.slice(0, 2).map(e => e.employeeName.split(' ')[0]).join(', ') + (toastClockedIn.length > 2 ? '...' : '') : 'No one clocked in'}
                  </div>
                </div>

                {/* Current Leader */}
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                  <div className="flex items-center gap-2 mb-3">
                    <Trophy size={16} className="text-amber-300" />
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-white/80">Shift Leader</h3>
                  </div>
                  {(() => {
                    const leaders = detectLeaders(toastClockedIn, allUsers);
                    const highestPriority = leaders.length > 0 ? Math.min(...leaders.map(l => l.priority)) : 999;
                    const activeLeaders = leaders.filter(l => l.priority === highestPriority);

                    if (activeLeaders.length === 0) {
                      return (
                        <>
                          <div className="text-2xl font-black mb-2">—</div>
                          <div className="text-[10px] font-bold text-amber-300">No leader on duty</div>
                        </>
                      );
                    }

                    if (activeLeaders.length > 1) {
                      return (
                        <>
                          <div className="text-lg font-black mb-2">Multiple</div>
                          <div className="text-[10px] font-bold text-red-300">⚠️ {activeLeaders.length} leaders</div>
                        </>
                      );
                    }

                    return (
                      <>
                        <div className="text-lg font-black mb-2 truncate">{activeLeaders[0].name}</div>
                        <div className="text-[10px] font-bold text-white/60 truncate">{activeLeaders[0].jobTitle}</div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </section>

            {/* Action Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Pending Checklists */}
              <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <ClipboardList size={16} className={realTimeCompliance.filter(c => c.percent < 100).length > 0 ? 'text-amber-500' : 'text-green-500'} />
                  <h3 className="text-sm font-black text-[#001F3F] uppercase tracking-tight">Today's Protocols</h3>
                </div>
                <div className="space-y-3">
                  {realTimeCompliance.length === 0 ? (
                    <p className="text-xs text-neutral-400 font-medium">No protocols due today</p>
                  ) : (
                    realTimeCompliance.slice(0, 3).map((stat, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-neutral-700 truncate">{stat.name}</div>
                          <div className="text-[9px] text-neutral-400 font-medium">{stat.completed}/{stat.total} tasks</div>
                        </div>
                        <div className={`px-2 py-1 rounded-lg text-[9px] font-black ${
                          stat.percent === 100 ? 'bg-green-100 text-green-700' :
                          stat.percent > 0 ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {stat.percent}%
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {realTimeCompliance.length > 3 && (
                  <button
                    onClick={() => setActiveSubTab('compliance')}
                    className="mt-4 w-full py-2 bg-neutral-50 hover:bg-neutral-100 rounded-xl text-[9px] font-black text-neutral-600 uppercase tracking-widest transition-all"
                  >
                    View All Protocols
                  </button>
                )}
              </div>

              {/* Audit Alerts */}
              <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle size={16} className={concernNotes.length > 0 ? 'text-red-500' : 'text-green-500'} />
                  <h3 className="text-sm font-black text-[#001F3F] uppercase tracking-tight">Audit Alerts</h3>
                </div>
                {concernNotes.length === 0 ? (
                  <div className="text-center py-8">
                    <ShieldCheck size={32} className="text-green-500 mx-auto mb-2" />
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">All Clear</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      {concernNotes.slice(0, 2).map((concern, idx) => (
                        <div
                          key={idx}
                          className="flex gap-3 p-3 bg-red-50 rounded-xl border border-red-100 cursor-pointer hover:border-red-200 transition-colors"
                          onClick={() => {
                            const submission = submissions.find(s => s.id === concern.submissionId);
                            const taskResult = submission?.taskResults.find(tr => tr.taskId === concern.taskId);
                            setFullscreenPhoto({
                              url: concern.url,
                              title: concern.title,
                              user: concern.user,
                              aiReview: { flagged: true, reason: concern.aiReason || '' },
                              submissionId: concern.submissionId,
                              taskId: concern.taskId,
                              existingComment: taskResult?.managerPhotoComment
                            });
                          }}
                        >
                          <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-red-200 bg-red-100">
                            {concern.url && (
                              <img src={concern.url} className="w-full h-full object-cover" alt={concern.title} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-black text-red-800 uppercase tracking-tight truncate">{concern.title}</p>
                            <p className="text-[9px] text-red-600 font-medium truncate">{concern.aiReason || 'Flagged'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => setActiveSubTab('gallery')}
                      className="mt-4 w-full py-2 bg-red-50 hover:bg-red-100 rounded-xl text-[9px] font-black text-red-600 uppercase tracking-widest transition-all"
                    >
                      Review All ({concernNotes.length})
                    </button>
                  </>
                )}
              </div>

              {/* Cash Status */}
              <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <DollarSign size={16} className="text-green-600" />
                  <h3 className="text-sm font-black text-[#001F3F] uppercase tracking-tight">Cash Status</h3>
                </div>
                {(() => {
                  const lastDeposit = cashDeposits[0];
                  const daysSinceDeposit = lastDeposit ? Math.floor((Date.now() - new Date(lastDeposit.depositDate).getTime()) / (1000 * 60 * 60 * 24)) : 999;

                  // Calculate expected cash accumulation since last deposit
                  const cashSalesSinceDeposit = toastSales?.totalSales ? toastSales.totalSales * 0.15 : 0; // Estimate 15% cash
                  const safeDropsSinceDeposit = toastCashData?.cashOut || 0;
                  const expectedSafe = cashSalesSinceDeposit - safeDropsSinceDeposit;

                  return (
                    <div className="space-y-4">
                      <div>
                        <div className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Est. Safe Balance</div>
                        <div className="text-2xl font-black text-green-600">${expectedSafe.toFixed(0)}</div>
                        <div className="text-[9px] text-neutral-500 font-medium mt-1">
                          Based on ~15% cash sales
                        </div>
                      </div>

                      <div className="pt-4 border-t border-neutral-100">
                        <div className="flex justify-between text-[9px] mb-2">
                          <span className="font-bold text-neutral-500">Last Deposit:</span>
                          <span className="font-black text-neutral-700">
                            {lastDeposit ? `${daysSinceDeposit}d ago` : 'Never'}
                          </span>
                        </div>
                        {daysSinceDeposit > 7 && (
                          <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-center">
                            <p className="text-[9px] font-bold text-amber-700 uppercase tracking-wide">Deposit Due Soon</p>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => setActiveSubTab('cash-audit')}
                        className="w-full py-2 bg-green-50 hover:bg-green-100 rounded-xl text-[9px] font-black text-green-700 uppercase tracking-widest transition-all"
                      >
                        Cash Audit
                      </button>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Quick Stats Bar */}
            <section className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-black text-[#001F3F] mb-1">{staff.length}</div>
                  <div className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Total Staff</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-black text-[#001F3F] mb-1">
                    {submissions.filter(s => s.status === 'PENDING').length}
                  </div>
                  <div className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Pending Reviews</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-black text-[#001F3F] mb-1">
                    {allProgress.filter(p => p.status === 'COMPLETED').length}
                  </div>
                  <div className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Lessons Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-black text-[#001F3F] mb-1">
                    {templates.length}
                  </div>
                  <div className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Active Protocols</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-black text-green-600 mb-1">
                    {Math.round((submissions.filter(s => s.status === 'APPROVED').length / Math.max(submissions.length, 1)) * 100)}%
                  </div>
                  <div className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Approval Rate</div>
                </div>
              </div>
            </section>

            {/* Barista Brain AI Audit */}
            <section className="bg-gradient-to-br from-purple-50 to-blue-50 p-6 rounded-2xl border border-purple-100">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-xl">
                    <BrainCircuit size={20} className="text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-[#001F3F] uppercase tracking-tight">Barista Brain Audit</h3>
                    <p className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest mt-0.5">AI-powered store analysis</p>
                  </div>
                </div>
                <button
                  onClick={generateAiInsight}
                  disabled={isGenerating}
                  className="px-6 py-3 bg-purple-600 text-white rounded-xl font-black uppercase text-[9px] tracking-widest hover:bg-purple-700 transition-all flex items-center gap-2 shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? <RefreshCw className="animate-spin" size={14}/> : <Sparkles size={14}/>}
                  {isGenerating ? 'Analyzing...' : 'Run Audit'}
                </button>
              </div>
            </section>

            {aiInsight && (
              <section className="bg-white p-8 rounded-2xl border border-purple-100 shadow-xl animate-in slide-in-from-bottom-4">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-black text-[#001F3F] uppercase flex items-center gap-3">
                    <BrainCircuit className="text-purple-500" size={24} />
                    Audit Results
                  </h3>
                  <button onClick={() => setAiInsight(null)} className="text-neutral-400 hover:text-neutral-600 transition-colors">
                    <X size={20}/>
                  </button>
                </div>
                <div className="prose prose-sm max-w-none text-neutral-600 whitespace-pre-wrap leading-relaxed">
                  {aiInsight}
                </div>
              </section>
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
                      onClick={() => {
                        const submission = submissions.find(s => s.id === photo.submissionId);
                        const taskResult = submission?.taskResults.find(tr => tr.taskId === photo.taskId);
                        setFullscreenPhoto({
                          url: photo.url,
                          title: photo.title,
                          user: photo.user,
                          aiReview: { flagged: photo.aiFlagged || false, reason: photo.aiReason || '' },
                          submissionId: photo.submissionId,
                          taskId: photo.taskId,
                          existingComment: taskResult?.managerPhotoComment
                        });
                      }}
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
                    onClick={() => {
                      const submission = submissions.find(s => s.id === photo.submissionId);
                      const taskResult = submission?.taskResults.find(tr => tr.taskId === photo.taskId);
                      setFullscreenPhoto({
                        url: photo.url,
                        title: photo.title,
                        user: photo.user,
                        aiReview: photo.aiFlagged ? { flagged: true, reason: photo.aiReason || '' } : undefined,
                        submissionId: photo.submissionId,
                        taskId: photo.taskId,
                        existingComment: taskResult?.managerPhotoComment
                      });
                    }}
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
             {/* Trailing Summary Stats */}
             <div className="bg-white p-8 rounded-[2.5rem] border border-neutral-100 shadow-sm">
                <div className="flex items-center gap-2 mb-8">
                  <History size={18} className="text-neutral-400" />
                  <h3 className="text-lg font-black text-[#001F3F] uppercase tracking-tight">7-Day Performance Summary</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-8 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-100 text-center">
                    <p className="text-[9px] font-black text-green-600/60 uppercase tracking-widest mb-3">Completion Rate</p>
                    <p className={`text-5xl font-black mb-2 ${trailingSummary.completionRate > 85 ? 'text-green-600' : 'text-amber-600'}`}>{trailingSummary.completionRate}%</p>
                    <p className="text-[10px] font-bold text-green-700/60 uppercase tracking-wider">Of protocols completed</p>
                  </div>
                  <div className="p-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 text-center">
                    <p className="text-[9px] font-black text-blue-600/60 uppercase tracking-widest mb-3">On-Time Rate</p>
                    <p className="text-5xl font-black text-blue-600 mb-2">{trailingSummary.punctualityRate}%</p>
                    <p className="text-[10px] font-bold text-blue-700/60 uppercase tracking-wider">Submitted before deadline</p>
                  </div>
                  <div className="p-8 bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl border border-red-100 text-center">
                    <p className="text-[9px] font-black text-red-600/60 uppercase tracking-widest mb-3">Missed Protocols</p>
                    <p className="text-5xl font-black text-red-600 mb-2">{trailingSummary.totalMissed}</p>
                    <p className="text-[10px] font-bold text-red-700/60 uppercase tracking-wider">Total missed submissions</p>
                  </div>
                </div>
             </div>

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

                {/* Legend */}
                <div className="mt-8 pt-6 border-t border-neutral-100">
                  <p className="text-[8px] font-black text-neutral-400 uppercase tracking-widest mb-4 px-2">Status Legend</p>
                  <div className="flex flex-wrap gap-6 px-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-green-100 text-green-600 flex items-center justify-center">
                        <Check size={12} strokeWidth={3}/>
                      </div>
                      <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider">On-Time</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                        <Clock size={12} strokeWidth={3}/>
                      </div>
                      <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider">Late</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
                        <X size={12} strokeWidth={3}/>
                      </div>
                      <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider">Missed</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-neutral-50 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-neutral-300" />
                      </div>
                      <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider">Pending</span>
                    </div>
                  </div>
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
          <section className="animate-in fade-in">
            {staff.length === 0 ? (
              <div className="bg-white p-16 rounded-[2.5rem] border border-neutral-100 shadow-sm text-center">
                <div className="max-w-md mx-auto space-y-6">
                  <div className="w-20 h-20 bg-neutral-100 text-neutral-300 rounded-full flex items-center justify-center mx-auto">
                    <Users size={40} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-[#001F3F] uppercase tracking-tight mb-3">No Staff Assigned</h3>
                    <p className="text-neutral-500 font-medium text-sm leading-relaxed">
                      There are no staff members assigned to <span className="font-black text-[#001F3F]">{currentStoreName}</span> yet. Staff will appear here once they're added to the system.
                    </p>
                  </div>
                  <div className="pt-4">
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                      Contact your administrator to add staff members
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {staff.map(member => {
              const stats = trainingStats.find(s => s.userId === member.id);
              const perf = performanceData.find(p => p.id === member.id);
              const isExpanded = expandedStaffId === member.id;
              const recentSubmissions = submissions
                .filter(s => s.taskResults?.some(tr => tr.completedByUserId === member.id))
                .slice(0, 5);

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
                        <div className={`h-full transition-all duration-1000 ${(perf?.score || 0) === 100 ? 'bg-green-500' : (perf?.score || 0) > 0 ? 'bg-blue-500' : 'bg-neutral-300'}`} style={{ width: `${perf?.score || 0}%` }} />
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

                   {/* Quick Actions */}
                   <div className="pt-6 border-t border-neutral-100 space-y-3">
                     <button
                       onClick={() => setExpandedStaffId(isExpanded ? null : member.id)}
                       className="w-full py-3 bg-[#001F3F] text-white rounded-xl font-black uppercase text-[9px] tracking-widest hover:bg-blue-900 transition-all flex items-center justify-center gap-2"
                     >
                       <ClipboardList size={14} />
                       {isExpanded ? 'Hide Recent Logs' : 'View Recent Logs'}
                     </button>

                     {isExpanded && recentSubmissions.length > 0 && (
                       <div className="space-y-2 max-h-48 overflow-y-auto animate-in slide-in-from-top-2">
                         {recentSubmissions.map(sub => {
                           const tpl = templates.find(t => t.id === sub.templateId);
                           const userTasks = sub.taskResults?.filter(tr => tr.completedByUserId === member.id).length || 0;
                           return (
                             <div key={sub.id} className="p-3 bg-neutral-50 rounded-xl border border-neutral-100">
                               <div className="flex items-center justify-between">
                                 <div>
                                   <p className="text-[9px] font-black text-[#001F3F] uppercase tracking-tight">{tpl?.name || 'Log'}</p>
                                   <p className="text-[8px] text-neutral-500 font-bold uppercase tracking-widest">{sub.date}</p>
                                 </div>
                                 <span className="text-[10px] font-bold text-neutral-400">{userTasks} tasks</span>
                               </div>
                             </div>
                           );
                         })}
                       </div>
                     )}

                     {isExpanded && recentSubmissions.length === 0 && (
                       <div className="p-6 border-2 border-dashed border-neutral-100 rounded-xl text-center">
                         <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">No recent submissions</p>
                       </div>
                     )}
                   </div>
                </div>
              );
            })}
              </div>
            )}
          </section>
        )}

        {activeSubTab === 'performance' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* Current Shift Leadership */}
            <section className="bg-white p-8 rounded-[2.5rem] border border-neutral-100 shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Target size={20} /></div>
                <h2 className="text-xl font-black text-[#001F3F] uppercase tracking-tight">Current Shift Leadership</h2>
              </div>

              {(() => {
                // Detect current leaders
                const currentLeaders = detectLeaders(toastClockedIn, allUsers);

                if (currentLeaders.length === 0) {
                  return (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
                      <AlertTriangle size={32} className="text-amber-600 mx-auto mb-3" />
                      <h3 className="text-sm font-black text-amber-900 uppercase tracking-tight mb-2">No Leader On Duty</h3>
                      <p className="text-xs text-amber-700 font-medium">No team leader or GM is currently clocked in. Performance metrics cannot be tracked.</p>
                    </div>
                  );
                }

                // Check for multiple leaders at same priority
                const priorityGroups = new Map<number, typeof currentLeaders>();
                currentLeaders.forEach(leader => {
                  const group = priorityGroups.get(leader.priority) || [];
                  group.push(leader);
                  priorityGroups.set(leader.priority, group);
                });

                const highestPriority = Math.min(...currentLeaders.map(l => l.priority));
                const highestPriorityLeaders = priorityGroups.get(highestPriority) || [];
                const multipleLeaders = highestPriorityLeaders.length > 1;

                return (
                  <div className="space-y-6">
                    {multipleLeaders && (
                      <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
                        <div className="flex items-start gap-3">
                          <AlertOctagon size={24} className="text-red-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <h3 className="text-sm font-black text-red-900 uppercase tracking-tight mb-2">Multiple Leaders Detected</h3>
                            <p className="text-xs text-red-700 font-medium mb-3">
                              Multiple leaders at the same priority level are clocked in. Both will share accountability for this shift's performance.
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {highestPriorityLeaders.map(leader => (
                                <div key={leader.userId} className="bg-red-100 text-red-800 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wide">
                                  {leader.name} ({leader.jobTitle})
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {currentLeaders.map(leader => (
                        <div key={leader.userId} className={`p-6 rounded-2xl border-2 ${leader.priority === highestPriority ? 'bg-blue-50 border-blue-200' : 'bg-neutral-50 border-neutral-200'}`}>
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-[#001F3F] text-white rounded-xl flex items-center justify-center font-black text-lg">
                              {leader.name.charAt(0)}
                            </div>
                            <div>
                              <h3 className="font-black text-base text-[#001F3F] uppercase tracking-tight leading-none">{leader.name}</h3>
                              <p className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest mt-1">{leader.jobTitle}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {leader.priority === highestPriority ? (
                              <>
                                <Trophy size={14} className="text-blue-600" />
                                <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Shift Owner</span>
                              </>
                            ) : (
                              <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">On Duty</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {toastSales && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                        <div className="bg-neutral-50 p-6 rounded-2xl border border-neutral-200">
                          <div className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2">Turn Time</div>
                          <div className="text-2xl font-black text-[#001F3F]">{toastSales.averageTurnTime?.toFixed(1) || '—'} min</div>
                          <div className={`text-[9px] font-bold uppercase tracking-wide mt-1 ${
                            (toastSales.averageTurnTime || 0) < 5 ? 'text-green-600' :
                            (toastSales.averageTurnTime || 0) < 6 ? 'text-blue-600' :
                            (toastSales.averageTurnTime || 0) < 7 ? 'text-amber-600' : 'text-red-600'
                          }`}>
                            {(toastSales.averageTurnTime || 0) < 5 ? '40 pts' :
                             (toastSales.averageTurnTime || 0) < 6 ? '35 pts' :
                             (toastSales.averageTurnTime || 0) < 7 ? '25 pts' : '15 pts'}
                          </div>
                        </div>
                        <div className="bg-neutral-50 p-6 rounded-2xl border border-neutral-200">
                          <div className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2">Total Sales</div>
                          <div className="text-2xl font-black text-[#001F3F]">${toastSales.totalSales?.toFixed(0) || '—'}</div>
                          <div className="text-[9px] font-bold text-neutral-500 uppercase tracking-wide mt-1">{toastSales.totalOrders || 0} orders</div>
                        </div>
                        <div className="bg-neutral-50 p-6 rounded-2xl border border-neutral-200">
                          <div className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2">Avg Check</div>
                          <div className="text-2xl font-black text-[#001F3F]">${toastSales.averageCheck?.toFixed(2) || '—'}</div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </section>

            {/* Team Leader Leaderboard */}
            <section className="bg-white p-8 rounded-[2.5rem] border border-neutral-100 shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl"><Trophy size={20} /></div>
                <h2 className="text-xl font-black text-[#001F3F] uppercase tracking-tight">Team Leader Leaderboard</h2>
                <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest ml-auto">Last 7 Days</span>
              </div>

              {(() => {
                // Calculate leader performance from submissions
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

                // Get recent submissions
                const recentSubmissions = submissions.filter(sub =>
                  sub.submittedAt && new Date(sub.submittedAt) >= sevenDaysAgo
                );

                // Group by template and date to determine shift ownership
                const shiftData = new Map<string, any>();

                recentSubmissions.forEach(sub => {
                  const template = templates.find(t => t.id === sub.templateId);
                  if (!template) return;

                  const key = `${sub.date}-${sub.templateId}`;

                  // Calculate deadline
                  const deadline = new Date(sub.date);
                  deadline.setHours(template.deadlineHour, 0, 0, 0);

                  // Calculate delay
                  const submittedDate = sub.submittedAt ? new Date(sub.submittedAt) : null;
                  const delayMinutes = submittedDate ? Math.floor((submittedDate.getTime() - deadline.getTime()) / 60000) : 9999;
                  const onTime = delayMinutes <= 0;

                  shiftData.set(key, {
                    date: sub.date,
                    template: template,
                    submittedBy: sub.userId,
                    onTime,
                    delayMinutes,
                    submittedAt: sub.submittedAt
                  });
                });

                // Get leaders who submitted
                const leaderStats = new Map<string, any>();

                shiftData.forEach(shift => {
                  const user = allUsers.find(u => u.id === shift.submittedBy);
                  if (!user) return;

                  // Only count submissions from users, we'll need to correlate with Toast data later
                  // For now, just track submissions
                  const existing = leaderStats.get(shift.submittedBy);
                  if (existing) {
                    existing.totalShifts++;
                    if (shift.onTime) existing.onTimeSubmissions++;
                    else existing.lateSubmissions++;
                    existing.totalDelayMinutes += Math.max(0, shift.delayMinutes);
                  } else {
                    leaderStats.set(shift.submittedBy, {
                      userId: shift.submittedBy,
                      name: user.name,
                      totalShifts: 1,
                      onTimeSubmissions: shift.onTime ? 1 : 0,
                      lateSubmissions: shift.onTime ? 0 : 1,
                      totalDelayMinutes: Math.max(0, shift.delayMinutes)
                    });
                  }
                });

                const leaderArray = Array.from(leaderStats.values())
                  .map(leader => {
                    const avgDelay = leader.totalDelayMinutes / leader.totalShifts;
                    const onTimeRate = (leader.onTimeSubmissions / leader.totalShifts) * 100;
                    return { ...leader, avgDelay, onTimeRate };
                  })
                  .sort((a, b) => b.onTimeRate - a.onTimeRate);

                if (leaderArray.length === 0) {
                  return (
                    <div className="text-center py-12">
                      <Users size={48} className="text-neutral-300 mx-auto mb-4" />
                      <p className="text-neutral-400 font-bold text-sm">No shift data available for the last 7 days</p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-4">
                    {leaderArray.map((leader, index) => (
                      <div key={leader.userId} className={`p-6 rounded-2xl border-2 transition-all ${
                        index === 0 ? 'bg-amber-50 border-amber-200' :
                        index === 1 ? 'bg-neutral-50 border-neutral-200' :
                        index === 2 ? 'bg-orange-50 border-orange-200' :
                        'bg-neutral-50 border-neutral-100'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl ${
                              index === 0 ? 'bg-amber-500 text-white' :
                              index === 1 ? 'bg-neutral-400 text-white' :
                              index === 2 ? 'bg-orange-400 text-white' :
                              'bg-neutral-200 text-neutral-600'
                            }`}>
                              #{index + 1}
                            </div>
                            <div>
                              <h3 className="font-black text-lg text-[#001F3F] uppercase tracking-tight">{leader.name}</h3>
                              <p className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest mt-1">
                                {leader.totalShifts} shifts led
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-8">
                            <div className="text-right">
                              <div className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-1">On-Time Rate</div>
                              <div className={`text-2xl font-black ${
                                leader.onTimeRate >= 90 ? 'text-green-600' :
                                leader.onTimeRate >= 70 ? 'text-blue-600' :
                                leader.onTimeRate >= 50 ? 'text-amber-600' : 'text-red-600'
                              }`}>
                                {leader.onTimeRate.toFixed(0)}%
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-1">Avg Delay</div>
                              <div className="text-lg font-black text-neutral-600">
                                {leader.avgDelay > 0 ? `+${leader.avgDelay.toFixed(0)}m` : '—'}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-1">Score</div>
                              <div className="text-lg font-black text-[#001F3F]">
                                {leader.onTimeSubmissions > 0 ? '40' : leader.totalShifts > 0 ? '25' : '0'}/40
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </section>

            {/* Performance Scoring Guide */}
            <section className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-[2.5rem] border border-blue-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-xl"><Info size={20} /></div>
                <h2 className="text-lg font-black text-[#001F3F] uppercase tracking-tight">Performance Scoring Guide</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-blue-100">
                  <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-4">Timeliness (40 pts)</h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between"><span className="font-bold text-neutral-600">On time:</span><span className="font-black text-green-600">40 pts</span></div>
                    <div className="flex justify-between"><span className="font-bold text-neutral-600">Late &lt;1hr:</span><span className="font-black text-amber-600">25 pts</span></div>
                    <div className="flex justify-between"><span className="font-bold text-neutral-600">Late &gt;1hr:</span><span className="font-black text-red-600">10 pts</span></div>
                    <div className="flex justify-between"><span className="font-bold text-neutral-600">Not submitted:</span><span className="font-black text-neutral-400">0 pts</span></div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-blue-100">
                  <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-4">Turn Time (40 pts)</h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between"><span className="font-bold text-neutral-600">Under 5 min:</span><span className="font-black text-green-600">40 pts</span></div>
                    <div className="flex justify-between"><span className="font-bold text-neutral-600">5-6 min:</span><span className="font-black text-blue-600">35 pts</span></div>
                    <div className="flex justify-between"><span className="font-bold text-neutral-600">6-7 min:</span><span className="font-black text-amber-600">25 pts</span></div>
                    <div className="flex justify-between"><span className="font-bold text-neutral-600">7+ min:</span><span className="font-black text-red-600">15 pts</span></div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-blue-100">
                  <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-4">Sales (20 pts)</h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between"><span className="font-bold text-neutral-600">Above target:</span><span className="font-black text-green-600">20 pts</span></div>
                    <div className="flex justify-between"><span className="font-bold text-neutral-600">Within 10%:</span><span className="font-black text-amber-600">15 pts</span></div>
                    <div className="flex justify-between"><span className="font-bold text-neutral-600">Below target:</span><span className="font-black text-red-600">10 pts</span></div>
                  </div>
                </div>
              </div>

              <div className="mt-6 bg-white/50 p-4 rounded-xl border border-blue-100">
                <p className="text-xs font-bold text-neutral-600 leading-relaxed">
                  <span className="font-black text-[#001F3F]">Note:</span> Leaders are accountable for their shift's performance. If multiple leaders at the same priority level are clocked in, both share accountability and scoring.
                </p>
              </div>
            </section>
          </div>
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
              {localTemplates.map(tpl => {
                const isExpanded = expandedProtocolId === tpl.id;
                const criticalCount = tpl.tasks.filter(t => t.isCritical).length;
                const photoCount = tpl.tasks.filter(t => t.requiresPhoto || (t.requiredPhotos || 0) > 0).length;

                return (
                <div key={tpl.id} className="bg-white rounded-[2.5rem] border border-neutral-100 shadow-sm overflow-hidden group relative">
                  <div className="p-8 bg-neutral-50 flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-neutral-100">
                    <div className="flex-1 space-y-5">
                      <div className="flex items-center gap-4">
                        <input value={tpl.name} onChange={e => handleUpdateTemplateLocal(tpl.id, { name: e.target.value })} className="text-2xl font-black text-[#001F3F] uppercase bg-transparent outline-none flex-1 focus:ring-0 border-none p-0" />
                        <button
                          onClick={() => setExpandedProtocolId(isExpanded ? null : tpl.id)}
                          className="px-4 py-2 bg-white text-[#001F3F] rounded-xl font-black uppercase text-[9px] tracking-widest hover:bg-neutral-100 transition-all flex items-center gap-2 border border-neutral-200"
                        >
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          {isExpanded ? 'Collapse' : `${tpl.tasks.length} Tasks`}
                        </button>
                      </div>

                      {/* Summary badges when collapsed */}
                      {!isExpanded && (
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg border border-neutral-200">
                            <ListTodo size={12} className="text-neutral-400" />
                            <span className="text-[9px] font-black text-neutral-600 uppercase">{tpl.tasks.length} Standards</span>
                          </div>
                          {criticalCount > 0 && (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 rounded-lg border border-red-100">
                              <AlertTriangle size={12} className="text-red-500" />
                              <span className="text-[9px] font-black text-red-600 uppercase">{criticalCount} Critical</span>
                            </div>
                          )}
                          {photoCount > 0 && (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 rounded-lg border border-blue-100">
                              <Camera size={12} className="text-blue-500" />
                              <span className="text-[9px] font-black text-blue-600 uppercase">{photoCount} Photo Tasks</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Configuration fields - always visible */}
                      {isExpanded && (
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
                      )}
                    </div>
                    <div className="flex flex-col gap-3">
                      <button onClick={() => handleSaveTemplate(tpl.id)} disabled={savingStatus[tpl.id] === 'SAVING'} className={`px-10 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl transition-all active:scale-95 ${savingStatus[tpl.id] === 'SAVED' ? 'bg-green-600 text-white' : 'bg-[#001F3F] text-white'}`}>
                        {savingStatus[tpl.id] === 'SAVING' ? <RefreshCw className="animate-spin" size={18}/> : <Save size={18}/>}
                        <span className="ml-2">{savingStatus[tpl.id] === 'SAVING' ? 'Syncing...' : 'Save Changes'}</span>
                      </button>
                      <button onClick={() => setDeleteConfirm({ type: 'TEMPLATE', id: tpl.id, title: tpl.name })} className="px-10 py-4 bg-red-50 text-red-600 rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-red-100 transition-all">Delete Protocol</button>
                    </div>
                  </div>

                  {/* Task list - only show when expanded */}
                  {isExpanded && (
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
                  )}
                </div>
              );
            })}
            </div>
          </section>
        )}

        {activeSubTab === 'cash-audit' && (() => {
          // Calculate expected cash on hand for theft detection
          const totalCashSales = toastSales?.paymentMethods?.['CASH'] || toastSales?.paymentMethods?.['Cash'] || 0;
          const totalCashRemoved = (toastCashData?.cashOut || 0) + (toastCashData?.payOuts || 0) + (toastCashData?.tipOuts || 0);
          const expectedCashOnHand = totalCashSales - totalCashRemoved;

          const hasCashData = totalCashSales > 0 || totalCashRemoved > 0;

          return (
            <section className="animate-in fade-in space-y-8">
              {/* Theft Detection Alert */}
              {hasCashData && expectedCashOnHand > 500 && (
                <div className="bg-yellow-50 border-2 border-yellow-300 rounded-2xl p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-yellow-500 text-white rounded-xl flex items-center justify-center shrink-0">
                      <AlertOctagon size={24} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-black text-yellow-900 text-lg uppercase tracking-tight mb-2">Cash Deposit Needed</h3>
                      <p className="text-yellow-800 text-sm font-medium mb-3">
                        Expected cash on hand: <span className="font-black text-2xl">${expectedCashOnHand.toFixed(2)}</span>
                      </p>
                      <p className="text-yellow-700 text-xs">Make a bank deposit soon to reduce cash risk and verify accuracy.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-8 rounded-[2rem] border border-neutral-100 shadow-sm">
                <div>
                  <h2 className="text-2xl font-black text-[#001F3F] uppercase tracking-tight flex items-center gap-3">
                    <DollarSign size={28} />
                    Bank Deposit Tracking
                  </h2>
                  <p className="text-neutral-400 text-xs font-bold uppercase tracking-widest mt-1">Detect theft & cash discrepancies</p>
                </div>
                <button
                  onClick={() => {
                    if (!showDepositForm && hasCashData) {
                      setDepositFormData({ actualDeposit: '', notes: '' });
                    }
                    setShowDepositForm(!showDepositForm);
                  }}
                  disabled={!hasCashData}
                  className="px-8 py-4 bg-[#001F3F] text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-blue-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg flex items-center gap-2"
                >
                  <Plus size={18} />
                  {showDepositForm ? 'Cancel' : 'Record Deposit'}
                </button>
              </div>

              {/* Expected Cash Breakdown */}
              {hasCashData && (
                <div className="bg-white p-8 rounded-[2rem] border border-neutral-100 shadow-sm">
                  <h3 className="text-lg font-black text-[#001F3F] uppercase tracking-tight mb-6">Current Cash Status</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-green-50 p-6 rounded-2xl border-2 border-green-200">
                      <p className="text-[10px] font-black uppercase tracking-widest text-green-600 mb-2">Cash Sales</p>
                      <p className="text-3xl font-black text-green-700">${totalCashSales.toFixed(2)}</p>
                      <p className="text-xs text-green-600 mt-2">Money in</p>
                    </div>
                    <div className="bg-red-50 p-6 rounded-2xl border-2 border-red-200">
                      <p className="text-[10px] font-black uppercase tracking-widest text-red-600 mb-2">Safe Drops</p>
                      <p className="text-3xl font-black text-red-700">${(toastCashData?.cashOut || 0).toFixed(2)}</p>
                      <p className="text-xs text-red-600 mt-2">To safe</p>
                    </div>
                    <div className="bg-orange-50 p-6 rounded-2xl border-2 border-orange-200">
                      <p className="text-[10px] font-black uppercase tracking-widest text-orange-600 mb-2">Pay/Tip Outs</p>
                      <p className="text-3xl font-black text-orange-700">${((toastCashData?.payOuts || 0) + (toastCashData?.tipOuts || 0)).toFixed(2)}</p>
                      <p className="text-xs text-orange-600 mt-2">Paid out</p>
                    </div>
                    <div className={`p-6 rounded-2xl border-2 ${expectedCashOnHand >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-300'}`}>
                      <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${expectedCashOnHand >= 0 ? 'text-blue-600' : 'text-red-600'}`}>Expected On Hand</p>
                      <p className={`text-3xl font-black ${expectedCashOnHand >= 0 ? 'text-blue-700' : 'text-red-700'}`}>${expectedCashOnHand.toFixed(2)}</p>
                      <p className={`text-xs mt-2 ${expectedCashOnHand >= 0 ? 'text-blue-600' : 'text-red-600'}`}>Should be in safe</p>
                    </div>
                  </div>
                  <div className="mt-4 p-4 bg-blue-50 rounded-xl">
                    <p className="text-xs text-blue-700 font-medium flex items-center gap-2">
                      <Info size={14} />
                      Expected On Hand = Cash Sales - Safe Drops - Pay/Tip Outs. When you deposit, we'll compare actual to expected.
                    </p>
                  </div>
                </div>
              )}

              {/* Deposit Form */}
              {showDepositForm && (
                <div className="bg-white p-8 rounded-[2rem] border border-neutral-100 shadow-sm">
                  <h3 className="text-lg font-black text-[#001F3F] uppercase tracking-tight mb-6">Record Bank Deposit</h3>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-xs font-black text-neutral-600 uppercase tracking-widest mb-2">Expected Deposit</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 font-bold">$</span>
                        <input
                          type="text"
                          value={expectedCashOnHand.toFixed(2)}
                          readOnly
                          className="w-full pl-8 pr-4 py-4 rounded-xl border-2 border-green-200 bg-green-50 outline-none font-bold text-lg text-green-700"
                        />
                      </div>
                      <p className="text-[10px] text-green-600 font-bold uppercase tracking-widest mt-2">From Toast sales data</p>
                    </div>
                    <div>
                      <label className="block text-xs font-black text-neutral-600 uppercase tracking-widest mb-2">Actual Cash Counted & Deposited</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 font-bold">$</span>
                        <input
                          type="number"
                          step="0.01"
                          value={depositFormData.actualDeposit}
                          onChange={(e) => setDepositFormData({ ...depositFormData, actualDeposit: e.target.value })}
                          placeholder="0.00"
                          className="w-full pl-8 pr-4 py-4 rounded-xl border-2 border-neutral-200 focus:border-[#001F3F] outline-none font-bold text-lg"
                          autoFocus
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-black text-neutral-600 uppercase tracking-widest mb-2">Notes (Optional)</label>
                      <textarea
                        value={depositFormData.notes}
                        onChange={(e) => setDepositFormData({ ...depositFormData, notes: e.target.value })}
                        placeholder="Any discrepancies or issues to note..."
                        rows={3}
                        className="w-full px-4 py-4 rounded-xl border-2 border-neutral-200 focus:border-[#001F3F] outline-none font-medium resize-none"
                      />
                    </div>

                    {/* Variance Preview */}
                    {depositFormData.actualDeposit && (() => {
                      const actual = parseFloat(depositFormData.actualDeposit);
                      const variance = actual - expectedCashOnHand;
                      const variancePercent = expectedCashOnHand > 0 ? (variance / expectedCashOnHand) * 100 : 0;
                      const status = Math.abs(variance) <= 10 ? 'PASS' : Math.abs(variance) <= 50 ? 'REVIEW' : 'FAIL';

                      return (
                        <div className={`p-6 rounded-2xl ${status === 'PASS' ? 'bg-green-50 border-2 border-green-200' : status === 'REVIEW' ? 'bg-yellow-50 border-2 border-yellow-300' : 'bg-red-50 border-2 border-red-300'}`}>
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <p className="text-xs font-black uppercase tracking-widest text-neutral-600 mb-1">Variance</p>
                              <p className={`text-4xl font-black ${variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {variance >= 0 ? '+' : ''}{variance.toFixed(2)}
                              </p>
                              <p className="text-sm font-bold text-neutral-500 mt-1">
                                {variancePercent >= 0 ? '+' : ''}{variancePercent.toFixed(1)}%
                              </p>
                            </div>
                            <div className={`px-6 py-3 rounded-xl font-black uppercase text-xs tracking-widest ${status === 'PASS' ? 'bg-green-600 text-white' : status === 'REVIEW' ? 'bg-yellow-600 text-white' : 'bg-red-600 text-white'}`}>
                              {status}
                            </div>
                          </div>
                          <p className="text-xs font-medium">
                            {status === 'PASS' && '✓ Variance within acceptable range (±$10)'}
                            {status === 'REVIEW' && '⚠️ Moderate variance (±$10-$50) - Review needed'}
                            {status === 'FAIL' && variance < 0 && '🚨 SHORTAGE DETECTED - Possible theft or error (>$50)'}
                            {status === 'FAIL' && variance > 0 && '⚠️ OVERAGE DETECTED - Recount needed (>$50)'}
                          </p>
                        </div>
                      );
                    })()}

                    <div className="flex gap-4">
                      <button
                        onClick={async () => {
                          if (!depositFormData.actualDeposit) return;

                          setDepositSaving(true);

                          try {
                            const actual = parseFloat(depositFormData.actualDeposit);
                            const variance = actual - expectedCashOnHand;
                            const variancePercent = expectedCashOnHand > 0 ? (variance / expectedCashOnHand) * 100 : 0;
                            const status = Math.abs(variance) <= 10 ? 'PASS' : Math.abs(variance) <= 50 ? 'REVIEW' : 'FAIL';

                            const deposit: CashDeposit = {
                              id: `dep-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                              storeId: currentStoreId,
                              depositDate: new Date().toISOString().split('T')[0],
                              depositedBy: 'current-user', // TODO: Replace with actual user ID
                              depositedByName: 'Manager', // TODO: Replace with actual user name
                              depositedAt: new Date().toISOString(),
                              periodStart: lastDepositDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
                              periodEnd: new Date().toISOString().split('T')[0],
                              expectedDeposit: expectedCashOnHand,
                              actualDeposit: actual,
                              variance: variance,
                              variancePercent: variancePercent,
                              status: status as 'PASS' | 'REVIEW' | 'FAIL',
                              totalCashSales: totalCashSales,
                              totalCashRemoved: totalCashRemoved,
                              notes: depositFormData.notes
                            };

                            console.log('[Deposits] Saving deposit:', deposit);

                            const success = await db.pushDeposit(deposit);

                            if (success) {
                              console.log('[Deposits] Save successful');
                              // Reload deposits to show the new one
                              await loadDeposits();
                              setShowDepositForm(false);
                              setDepositFormData({ actualDeposit: '', notes: '' });
                              setLastDepositDate(new Date().toISOString().split('T')[0]);
                              // Clear cash data to start fresh
                              setToastCashData(null);
                            } else {
                              console.error('[Deposits] Save failed');
                              alert('Failed to save deposit. Please try again.');
                            }
                          } catch (error: any) {
                            console.error('[Deposits] Error saving deposit:', error);
                            alert(`Failed to save deposit: ${error.message}`);
                          } finally {
                            setDepositSaving(false);
                          }
                        }}
                        disabled={!depositFormData.actualDeposit || depositSaving}
                        className="flex-1 px-8 py-4 bg-[#001F3F] text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-blue-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                      >
                        {depositSaving ? 'Saving...' : 'Save Deposit'}
                      </button>
                      <button
                        onClick={() => {
                          setShowDepositForm(false);
                          setDepositFormData({ actualDeposit: '', notes: '' });
                        }}
                        className="px-8 py-4 bg-neutral-100 text-neutral-600 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-neutral-200 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Deposit History */}
              <div className="bg-white p-8 rounded-[2rem] border border-neutral-100 shadow-sm">
                <h3 className="text-lg font-black text-[#001F3F] uppercase tracking-tight mb-6">Deposit History</h3>

                {cashDeposits.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 bg-neutral-100 text-neutral-300 rounded-full flex items-center justify-center mx-auto mb-4">
                      <DollarSign size={32} />
                    </div>
                    <p className="text-neutral-400 font-bold uppercase text-xs tracking-widest">No deposits recorded yet</p>
                    <p className="text-neutral-300 text-xs mt-2">Record your first bank deposit to start tracking cash accuracy</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cashDeposits.map((deposit: any) => (
                      <div key={deposit.id} className={`border-2 rounded-2xl p-6 ${deposit.status === 'PASS' ? 'border-green-200 bg-green-50' : deposit.status === 'REVIEW' ? 'border-yellow-200 bg-yellow-50' : 'border-red-200 bg-red-50'}`}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <p className="font-black text-neutral-800">{new Date(deposit.depositDate).toLocaleDateString()}</p>
                              <div className={`px-3 py-1 rounded-lg font-black uppercase text-[10px] tracking-widest ${deposit.status === 'PASS' ? 'bg-green-600 text-white' : deposit.status === 'REVIEW' ? 'bg-yellow-600 text-white' : 'bg-red-600 text-white'}`}>
                                {deposit.status}
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1">Expected</p>
                                <p className="font-bold text-neutral-700">${deposit.expectedDeposit.toFixed(2)}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1">Actual</p>
                                <p className="font-bold text-neutral-700">${deposit.actualDeposit.toFixed(2)}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1">Variance</p>
                                <p className={`font-bold ${deposit.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {deposit.variance >= 0 ? '+' : ''}{deposit.variance.toFixed(2)}
                                </p>
                              </div>
                            </div>
                            {deposit.notes && (
                              <p className="text-xs text-neutral-600 mt-3 italic bg-white p-3 rounded-lg">{deposit.notes}</p>
                            )}
                            <p className="text-[10px] text-neutral-400 font-medium mt-2">Recorded by {deposit.depositedByName}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          );
        })()}

      </div>
    </div>
  );
};

export default ManagerHub;