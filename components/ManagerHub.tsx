
import React, { useState, useMemo } from 'react';
import { User, ChecklistSubmission, ChecklistTemplate, ChecklistTask, UserRole, TrainingModule, UserProgress, ManualSection, Recipe, Store } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { 
  CheckCircle2, AlertCircle, Eye, User as UserIcon, Calendar, Check, X, 
  Sparkles, Settings, Plus, Trash2, Edit3, BarChart3, ListTodo, BrainCircuit, Clock, TrendingDown, TrendingUp,
  ArrowRight, MessageSquare, Save, Users, LayoutDashboard, Flag, Activity, GraduationCap, Award, FileText, MoveUp, MoveDown, Coffee, Camera, Hash, AlertTriangle, ExternalLink, FileText as FileIcon, Image as ImageIcon, Search, ShieldCheck,
  RefreshCw, CalendarDays, Timer, Store as StoreIcon, MapPin, GripVertical
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
  onUpdateTemplate: (template: ChecklistTemplate) => void;
  onAddTemplate: (template: ChecklistTemplate) => void;
  onDeleteTemplate: (id: string) => void;
  onUpdateManual: (manual: ManualSection[]) => void;
  onUpdateRecipes: (recipes: Recipe[]) => void;
  currentStoreId: string;
  stores: Store[];
}

const ManagerHub: React.FC<ManagerHubProps> = ({ 
  staff, allUsers, submissions, templates, curriculum, allProgress, manual, recipes, onReview, 
  onUpdateTemplate, onAddTemplate, onDeleteTemplate, onUpdateManual, onUpdateRecipes,
  currentStoreId, stores
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'compliance' | 'editor' | 'staff' | 'gallery' | 'manual'>('dashboard');
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [fullscreenPhoto, setFullscreenPhoto] = useState<{url: string, title: string, user: string} | null>(null);
  
  const [localTemplates, setLocalTemplates] = useState<ChecklistTemplate[]>(templates);
  const [localManual, setLocalManual] = useState<ManualSection[]>(manual);

  const [savingStatus, setSavingStatus] = useState<Record<string, 'IDLE' | 'SAVING' | 'SAVED'>>({});

  const currentStoreName = useMemo(() => stores.find(s => s.id === currentStoreId)?.name || 'Unknown Store', [currentStoreId, stores]);

  React.useEffect(() => {
    setLocalTemplates(templates);
  }, [templates]);

  React.useEffect(() => {
    setLocalManual(manual);
  }, [manual]);

  // Activity Feed Logic
  const activityFeed = useMemo(() => {
    const feed: { id: string, type: 'CHECKLIST' | 'TRAINING', title: string, user: string, time: Date, details?: string }[] = [];
    
    // Checklist Activities
    submissions.forEach(s => {
      s.taskResults.forEach(tr => {
        if (tr.completed) {
          const tpl = templates.find(t => t.id === s.templateId);
          const task = tpl?.tasks.find(tk => tk.id === tr.taskId);
          const user = allUsers.find(u => u.id === tr.completedByUserId)?.name || 'Unknown Staff';
          feed.push({
            id: `${s.id}-${tr.taskId}`,
            type: 'CHECKLIST',
            title: task?.title || 'Task Completed',
            user,
            time: new Date(tr.completedAt),
            details: tpl?.name
          });
        }
      });
    });

    // Sort by time descending
    return feed.sort((a, b) => b.time.getTime() - a.time.getTime()).slice(0, 20);
  }, [submissions, templates, allUsers]);

  // Compliance Logic: Strictly scoped to the store selection
  const complianceMatrix = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    const mainTemplates = templates.filter(t => ['OPENING', 'CLOSING', 'WEEKLY'].includes(t.type));

    return last7Days.map(date => {
      const dayStatus = mainTemplates.map(tpl => {
        const submission = submissions.find(s => s.templateId === tpl.id && s.date === date);
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        
        const isPastDeadline = now.getHours() >= tpl.deadlineHour && todayStr === date;
        const isHistory = todayStr > date;

        let status: 'MISSING' | 'COMPLETED' | 'PENDING' | 'LATE' = 'PENDING';
        
        if (submission && submission.status !== 'DRAFT') {
          const submittedDate = submission.submittedAt ? new Date(submission.submittedAt) : null;
          if (submittedDate && submittedDate.getHours() >= tpl.deadlineHour) {
            status = 'LATE';
          } else {
            status = 'COMPLETED';
          }
        } else if (isHistory || isPastDeadline) {
          status = 'MISSING';
        }

        return {
          templateName: tpl.name,
          templateType: tpl.type,
          status
        };
      });

      return {
        date,
        shortDate: date.split('-').slice(1).join('/'),
        statuses: dayStatus
      };
    });
  }, [submissions, templates]);

  const performanceData = useMemo(() => {
    return staff.filter(u => u.role === UserRole.TRAINEE || u.role === UserRole.TRAINER).map(member => {
      const tasksCompleted = submissions.flatMap(s => s.taskResults).filter(tr => tr.completed && tr.completedByUserId === member.id);
      const totalSubmissionsParticipated = submissions.filter(s => s.taskResults.some(tr => tr.completedByUserId === member.id)).length;
      const criticalTasksCompleted = submissions.flatMap(s => {
        const tpl = templates.find(t => t.id === s.templateId);
        return s.taskResults.filter(tr => {
          const task = tpl?.tasks.find(tk => tk.id === tr.taskId);
          return task?.isCritical && tr.completed && tr.completedByUserId === member.id;
        });
      }).length;
      
      return {
        id: member.id,
        name: member.name,
        completionRate: tasksCompleted.length,
        submissionsCount: totalSubmissionsParticipated,
        criticalRate: criticalTasksCompleted
      };
    });
  }, [staff, submissions, templates]);

  const allPhotos = useMemo(() => {
    return submissions.flatMap(s => {
      const tpl = templates.find(t => t.id === s.templateId);
      return s.taskResults
        .filter(tr => tr.photoUrl)
        .map(tr => ({
          url: tr.photoUrl!,
          title: tpl?.tasks.find(tk => tk.id === tr.taskId)?.title || 'Untitled Checkpoint',
          user: allUsers.find(u => u.id === tr.completedByUserId)?.name || 'Unknown',
          date: new Date(tr.completedAt).toLocaleString(),
          templateName: tpl?.name || 'Log'
        }));
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [submissions, templates, allUsers]);

  const activeDrafts = useMemo(() => {
    return templates.map(tpl => {
      const draft = submissions.find(s => s.templateId === tpl.id && (s.status === 'DRAFT' || s.status === 'PENDING'));
      if (!draft) return null;
      
      const totalTasks = tpl.tasks.length;
      const completedTasks = draft.taskResults.filter(tr => tr.completed).length;
      const percent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      const activeUsers = new Set(draft.taskResults.map(tr => tr.completedByUserId)).size;

      return {
        id: tpl.id,
        name: tpl.name,
        status: draft.status,
        completed: completedTasks,
        total: totalTasks,
        percent,
        activeUsers
      };
    }).filter(Boolean);
  }, [templates, submissions]);

  const generateAiInsight = async () => {
    setIsGenerating(true);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const context = {
      store: currentStoreName,
      compliance: complianceMatrix,
      performance: performanceData,
      onboarding: staff.map(s => s.name),
      recentLogs: submissions.slice(0, 5).map(s => ({
        template: templates.find(t => t.id === s.templateId)?.name,
        status: s.status,
        date: s.date
      }))
    };

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Act as the "Barista Brain" Operations Auditor for Boundaries Coffee. Analyze this store's operational compliance (Opening 7am, Closing 9pm).
        
        STORE: ${currentStoreName}
        
        1. Identify any missed or late checklist patterns in the last 7 days.
        2. Identify the 'Operational MVP' based on critical task performance and punctuality.
        3. Provide 3 specific action items for the manager regarding time-standards.
        
        Data Context: ${JSON.stringify(context)}
        Format: Markdown with clean headers.`,
      });
      setAiInsight(response.text || "Insight engine returned empty response.");
    } catch (e) {
      setAiInsight("AI Engine offline. Please check API configuration.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdateTemplateLocal = (templateId: string, updates: Partial<ChecklistTemplate>) => {
    setLocalTemplates(prev => prev.map(t => t.id === templateId ? { ...t, ...updates } : t));
  };

  const handleTaskUpdate = (templateId: string, taskId: string, updates: Partial<ChecklistTask>) => {
    setLocalTemplates(prev => prev.map(t => {
      if (t.id !== templateId) return t;
      return {
        ...t,
        tasks: t.tasks.map(task => task.id === taskId ? { ...task, ...updates } : task)
      };
    }));
  };

  const handleAddTask = (templateId: string) => {
    setLocalTemplates(prev => prev.map(t => {
      if (t.id !== templateId) return t;
      const newTask: ChecklistTask = {
        id: `t-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        title: 'New Standard',
        requiresPhoto: false,
        isCritical: false
      };
      return { ...t, tasks: [...t.tasks, newTask] };
    }));
  };

  const handleDeleteTask = (templateId: string, taskId: string) => {
    if(!confirm('Delete this task?')) return;
    setLocalTemplates(prev => prev.map(t => {
      if (t.id !== templateId) return t;
      return { ...t, tasks: t.tasks.filter(task => task.id !== taskId) };
    }));
  };

  const handleMoveTask = (templateId: string, index: number, direction: -1 | 1) => {
    setLocalTemplates(prev => prev.map(t => {
      if (t.id !== templateId) return t;
      const newTasks = [...t.tasks];
      if (index + direction < 0 || index + direction >= newTasks.length) return t;
      
      const temp = newTasks[index];
      newTasks[index] = newTasks[index + direction];
      newTasks[index + direction] = temp;
      
      return { ...t, tasks: newTasks };
    }));
  };

  const handleCreateTemplate = () => {
    const newTpl: ChecklistTemplate = {
      id: `ct-new-${Date.now()}`,
      storeId: currentStoreId,
      name: 'NEW PROTOCOL',
      type: 'OPENING',
      deadlineHour: 12,
      tasks: []
    };
    onAddTemplate(newTpl);
    setLocalTemplates(prev => [...prev, newTpl]);
  };
  
  const handleDeleteTemplateLocal = (id: string) => {
      if(!confirm('Permanently delete this entire protocol?')) return;
      onDeleteTemplate(id);
      setLocalTemplates(prev => prev.filter(t => t.id !== id));
  };

  const handleSaveTemplate = async (templateId: string) => {
    const tpl = localTemplates.find(t => t.id === templateId);
    if (!tpl) return;
    setSavingStatus(prev => ({ ...prev, [templateId]: 'SAVING' }));
    await new Promise(resolve => setTimeout(resolve, 800));
    onUpdateTemplate(tpl);
    setSavingStatus(prev => ({ ...prev, [templateId]: 'SAVED' }));
    setTimeout(() => {
      setSavingStatus(prev => ({ ...prev, [templateId]: 'IDLE' }));
    }, 2000);
  };

  const handleUpdateManualSection = (id: string, updates: Partial<ManualSection>) => {
    setLocalManual(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const pendingSubmissions = submissions.filter(s => s.status === 'PENDING');

  return (
    <div className="space-y-6 sm:space-y-8 pb-20">
      {fullscreenPhoto && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 sm:p-12 animate-in fade-in duration-300"
          onClick={() => setFullscreenPhoto(null)}
        >
          <button className="absolute top-8 right-8 text-white p-3 hover:bg-white/10 rounded-full">
            <X size={32} />
          </button>
          <div className="max-w-5xl w-full flex flex-col items-center">
            <div className="bg-white/10 p-2 rounded-[2.5rem] shadow-2xl mb-6">
              <img src={fullscreenPhoto.url} className="max-h-[70vh] rounded-[2rem] object-contain" alt="Verification" />
            </div>
            <div className="text-center">
              <h3 className="text-white text-2xl font-black uppercase tracking-tight mb-2">{fullscreenPhoto.title}</h3>
              <p className="text-blue-200 font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2">
                <ShieldCheck size={14} /> Verified by {fullscreenPhoto.user}
              </p>
            </div>
          </div>
        </div>
      )}

      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-[#001F3F] text-white rounded-lg">
              <StoreIcon size={14} />
            </div>
            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">{currentStoreName} Context</p>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#001F3F] uppercase tracking-tighter leading-none">Manager Hub</h1>
        </div>
        <div className="flex bg-neutral-100 p-1 rounded-xl sm:rounded-2xl border border-neutral-200 overflow-x-auto no-scrollbar scroll-smooth">
          {[
            { id: 'dashboard', label: 'DASHBOARD', icon: LayoutDashboard },
            { id: 'compliance', label: 'COMPLIANCE', icon: Timer },
            { id: 'staff', label: 'STAFF', icon: Users },
            { id: 'gallery', label: 'AUDIT', icon: ImageIcon },
            { id: 'manual', label: 'MANUAL', icon: FileText },
            { id: 'editor', label: 'PROTOCOLS', icon: Settings }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-5 py-2.5 text-[9px] font-black rounded-lg transition-all flex items-center gap-2 whitespace-nowrap tracking-widest ${
                activeSubTab === tab.id ? 'bg-[#001F3F] text-white shadow-lg' : 'text-neutral-500 hover:text-[#001F3F]'
              }`}
            >
              <tab.icon size={14} /> {tab.label}
              {tab.id === 'dashboard' && pendingSubmissions.length > 0 && (
                <span className="bg-red-500 text-white px-1 py-0.5 rounded text-[8px] animate-pulse">{pendingSubmissions.length}</span>
              )}
            </button>
          ))}
        </div>
      </header>

      <div className="space-y-8 sm:space-y-12">
        {activeSubTab === 'dashboard' && (
          <div className="space-y-12 animate-in fade-in duration-500">
            <section className="bg-white p-8 sm:p-10 rounded-[2.5rem] border border-neutral-100 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[80px] -mr-32 -mt-32" />
              <div className="relative flex flex-col sm:flex-row items-center justify-between gap-8">
                <div className="flex-1 text-center sm:text-left">
                  <h2 className="text-2xl font-black text-[#001F3F] uppercase tracking-tight flex items-center justify-center sm:justify-start gap-3">
                    <BrainCircuit size={28} className="text-blue-600" /> Barista Brain Auditor
                  </h2>
                  <p className="text-neutral-400 text-sm font-medium mt-2 max-w-lg">
                    Analyzing store compliance for <strong>{currentStoreName}</strong> across Opening and Closing standards.
                  </p>
                </div>
                <button 
                  onClick={generateAiInsight}
                  disabled={isGenerating}
                  className="bg-[#001F3F] text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-3 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isGenerating ? <RefreshCw className="animate-spin" size={18} /> : <Sparkles size={18} />}
                  {isGenerating ? 'Auditing Cloud Data...' : 'Analyze Operational Gaps'}
                </button>
              </div>

              {aiInsight && (
                <div className="mt-8 p-8 bg-blue-50/50 rounded-[2rem] border border-blue-100/50 text-[#001F3F] prose prose-sm max-w-none animate-in slide-in-from-top-4 duration-500">
                  <div className="font-medium whitespace-pre-wrap leading-relaxed text-sm">
                    {aiInsight}
                  </div>
                </div>
              )}
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between px-2">
                   <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">Live Activity Feed</h3>
                   <div className="flex items-center gap-2 text-green-500 animate-pulse">
                     <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                     <span className="text-[7px] font-bold uppercase">Real-time</span>
                   </div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-neutral-100 shadow-sm h-[400px] overflow-y-auto custom-scrollbar">
                  {activityFeed.length === 0 ? (
                     <div className="h-full flex items-center justify-center text-neutral-300 font-bold uppercase tracking-widest text-[10px]">
                       No recent activity logged.
                     </div>
                  ) : (
                    <div className="space-y-3">
                      {activityFeed.map((activity) => (
                        <div key={activity.id} className="flex items-start gap-4 p-4 rounded-2xl bg-neutral-50/50 border border-neutral-100 animate-in slide-in-from-right-2">
                          <div className="w-8 h-8 rounded-full bg-[#001F3F] text-white flex items-center justify-center text-[10px] font-black shrink-0">
                            {activity.user.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <h4 className="text-sm font-bold text-[#001F3F] leading-tight">{activity.title}</h4>
                              <span className="text-[9px] font-medium text-neutral-400 tabular-nums">
                                {activity.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-[10px] text-neutral-500 mt-1">
                              <span className="font-black text-[#001F3F] uppercase tracking-wide">{activity.user}</span> completed in <span className="italic">{activity.details}</span>
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] ml-2">Active Sessions ({currentStoreName})</h3>
                {activeDrafts.length === 0 ? (
                  <div className="p-10 bg-white border border-dashed border-neutral-100 rounded-[2rem] text-center">
                    <p className="text-[9px] font-bold text-neutral-300 uppercase tracking-widest">No Active Logs.</p>
                  </div>
                ) : (
                  activeDrafts.map(draft => (
                    <div key={draft?.id} className="bg-white p-6 rounded-[1.5rem] border border-neutral-100 shadow-sm animate-in zoom-in duration-300">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="font-black text-[#001F3F] text-[10px] uppercase tracking-tight truncate flex-1">{draft?.name}</h4>
                        <span className="text-[7px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-100 text-[#001F3F]">{draft?.status}</span>
                      </div>
                      <div className="flex items-end justify-between mb-2">
                        <span className="text-xl font-black text-[#001F3F] leading-none">{draft?.percent}%</span>
                        <div className="flex flex-col items-end">
                          <span className="text-[8px] font-bold text-neutral-400 uppercase tracking-widest">{draft?.completed}/{draft?.total}</span>
                          <span className="text-[7px] font-bold text-green-600 uppercase tracking-tight flex items-center gap-1">
                            <Users size={8} /> {draft?.activeUsers} Active
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-1.5 bg-neutral-50 rounded-full overflow-hidden">
                        <div className="h-full bg-[#001F3F] transition-all duration-500" style={{ width: `${draft?.percent}%` }} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        )}

        {/* ... compliance, staff, audit sections ... */}
        
        {activeSubTab === 'compliance' && (
          <section className="animate-in fade-in duration-500 space-y-8">
            <header>
              <h2 className="text-2xl font-black text-[#001F3F] uppercase tracking-tight flex items-center gap-3">
                <Timer size={24} /> Compliance: {currentStoreName}
              </h2>
              <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest mt-1">7-Day Punctuality Audit.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.filter(t => ['OPENING', 'CLOSING', 'WEEKLY'].includes(t.type)).map(tpl => {
                const totalChecks = complianceMatrix.length;
                const completedOnTime = complianceMatrix.filter(d => 
                  d.statuses.find(s => s.templateName === tpl.name)?.status === 'COMPLETED'
                ).length;
                const completedLate = complianceMatrix.filter(d => 
                  d.statuses.find(s => s.templateName === tpl.name)?.status === 'LATE'
                ).length;
                const completionRate = Math.round(((completedOnTime + completedLate) / totalChecks) * 100);

                return (
                  <div key={tpl.id} className="bg-white p-8 rounded-[2.5rem] border border-neutral-100 shadow-sm space-y-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-black text-lg text-[#001F3F] uppercase tracking-tight">{tpl.name}</h3>
                        <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Cutoff: {tpl.deadlineHour}:00</p>
                      </div>
                      <div className={`p-3 rounded-2xl ${completionRate > 80 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                        {completionRate > 80 ? <CheckCircle2 size={24} /> : <AlertTriangle size={24} />}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[8px] font-black uppercase tracking-widest text-neutral-400">Punctuality Score</span>
                          <span className="text-lg font-black">{Math.round((completedOnTime / totalChecks) * 100)}%</span>
                        </div>
                        <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 transition-all duration-1000" style={{ width: `${(completedOnTime / totalChecks) * 100}%` }} />
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-neutral-50 grid grid-cols-7 gap-1">
                      {complianceMatrix.map(day => {
                        const status = day.statuses.find(s => s.templateName === tpl.name)?.status;
                        return (
                          <div key={day.date} className="flex flex-col items-center gap-1">
                            <div className={`w-full h-6 rounded ${
                              status === 'COMPLETED' ? 'bg-green-500' : 
                              status === 'LATE' ? 'bg-amber-500' :
                              status === 'MISSING' ? 'bg-red-500' : 
                              'bg-neutral-100'
                            }`} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {activeSubTab === 'staff' && (
          <section className="animate-in fade-in duration-500 space-y-8">
            <h2 className="text-2xl font-black text-[#001F3F] uppercase tracking-tight flex items-center gap-3">
              <Users size={24} /> {currentStoreName} Team
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {staff.map(member => {
                const perf = performanceData.find(p => p.id === member.id);
                return (
                  <div key={member.id} className="bg-white p-8 rounded-[2.5rem] border border-neutral-100 shadow-sm space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-[#001F3F] text-white flex items-center justify-center font-black text-lg">
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-black text-lg text-[#001F3F] tracking-tight">{member.name}</h3>
                        <span className="text-[8px] font-black text-neutral-400 uppercase tracking-[0.2em] bg-neutral-50 px-2 py-0.5 rounded-full">{member.role}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-neutral-50">
                      <div>
                        <p className="text-[7px] font-black text-neutral-400 uppercase tracking-widest mb-1">Total Logs</p>
                        <p className="text-lg font-black text-[#001F3F]">{perf?.completionRate || 0}</p>
                      </div>
                      <div>
                        <p className="text-[7px] font-black text-neutral-400 uppercase tracking-widest mb-1">Criticals</p>
                        <p className="text-lg font-black text-blue-600">{perf?.criticalRate || 0}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {activeSubTab === 'gallery' && (
          <section className="animate-in fade-in duration-500 space-y-8">
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-[#001F3F] uppercase tracking-tight flex items-center gap-3">
                  <ImageIcon size={24} /> Audit Gallery
                </h2>
                <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest mt-1">Verified maintenance snapshots for {currentStoreName}.</p>
              </div>
            </header>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {allPhotos.map((photo, i) => (
                <div key={i} className="group relative bg-white rounded-[2rem] border border-neutral-100 overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer" onClick={() => setFullscreenPhoto(photo)}>
                  <div className="aspect-square relative overflow-hidden">
                    <img src={photo.url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="Audit" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#001F3F]/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                      <p className="text-white text-[10px] font-black uppercase leading-tight mb-1">{photo.title}</p>
                      <p className="text-blue-300 text-[8px] font-bold uppercase tracking-widest">{photo.user}</p>
                    </div>
                  </div>
                </div>
              ))}
              {allPhotos.length === 0 && (
                <div className="col-span-full py-20 text-center border-2 border-dashed border-neutral-100 rounded-[2.5rem]">
                  <p className="text-[10px] font-black text-neutral-300 uppercase tracking-widest">No verification photos found in store logs.</p>
                </div>
              )}
            </div>
          </section>
        )}

        {activeSubTab === 'manual' && (
          <section className="animate-in fade-in duration-500 space-y-6">
            <h2 className="text-2xl font-black text-[#001F3F] uppercase tracking-tight">Ops Manual Editor</h2>
            <div className="space-y-6">
              {localManual.map(section => (
                <div key={section.id} className="bg-white p-8 rounded-[2.5rem] border border-neutral-100 shadow-sm space-y-4">
                  <div className="flex items-center gap-4 border-b border-neutral-50 pb-4">
                    <span className="w-10 h-10 rounded-xl bg-neutral-50 flex items-center justify-center font-black text-[#001F3F] border border-neutral-100">{section.number}</span>
                    <input 
                      value={section.title} 
                      onChange={(e) => handleUpdateManualSection(section.id, { title: e.target.value })}
                      className="flex-1 text-xl font-black text-[#001F3F] uppercase bg-transparent border-none p-0 focus:ring-0"
                    />
                  </div>
                  <textarea 
                    value={section.content}
                    rows={6}
                    onChange={(e) => handleUpdateManualSection(section.id, { content: e.target.value })}
                    className="w-full bg-neutral-50/50 p-4 rounded-xl border border-neutral-100 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/10"
                  />
                  <div className="flex justify-end">
                    <button 
                      onClick={() => onUpdateManual(localManual)}
                      className="bg-[#001F3F] text-white px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2"
                    >
                      <Save size={16} /> Save Changes
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeSubTab === 'editor' && (
          <section className="animate-in fade-in duration-300 space-y-8">
            <div className="flex justify-between items-center bg-white p-8 rounded-[2rem] border border-neutral-100 shadow-sm">
              <div>
                <h2 className="text-2xl font-black text-[#001F3F] uppercase tracking-tight">Protocol Standards</h2>
                <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mt-1">Reflects globally for {currentStoreName} staff.</p>
              </div>
              <button 
                onClick={handleCreateTemplate}
                className="bg-[#001F3F] text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-blue-900 transition-colors shadow-lg"
              >
                <Plus size={16} /> Create Protocol
              </button>
            </div>
            
            <div className="space-y-8">
              {localTemplates.map(tpl => {
                const status = savingStatus[tpl.id] || 'IDLE';
                return (
                  <div key={tpl.id} className="bg-white rounded-[2.5rem] border border-neutral-100 shadow-sm overflow-hidden flex flex-col group relative">
                    <div className="p-8 bg-neutral-50/50 border-b border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-3">
                          <input 
                            value={tpl.name} 
                            onChange={(e) => handleUpdateTemplateLocal(tpl.id, { name: e.target.value })} 
                            className="text-xl sm:text-2xl font-black text-[#001F3F] uppercase bg-transparent border-none p-0 focus:ring-0 w-full sm:w-auto" 
                          />
                        </div>
                        <div className="flex flex-wrap items-center gap-6">
                          <div className="space-y-1">
                            <label className="text-[7px] font-black uppercase tracking-[0.2em] text-neutral-400">Compliance Deadline</label>
                            <div className="flex items-center gap-2">
                              <input 
                                type="number"
                                min="0"
                                max="23"
                                value={tpl.deadlineHour}
                                onChange={(e) => handleUpdateTemplateLocal(tpl.id, { deadlineHour: parseInt(e.target.value) })}
                                className="w-16 bg-white border border-neutral-200 rounded-lg px-2 py-1 text-sm font-black text-[#001F3F] shadow-sm"
                              />
                              <span className="text-[9px] font-bold text-neutral-400 uppercase">:00 Daily</span>
                            </div>
                          </div>
                          
                          <div className="space-y-1">
                             <label className="text-[7px] font-black uppercase tracking-[0.2em] text-neutral-400">Protocol Type</label>
                             <select 
                               value={tpl.type}
                               onChange={(e) => handleUpdateTemplateLocal(tpl.id, { type: e.target.value as any })}
                               className="bg-white border border-neutral-200 rounded-lg px-2 py-1 text-xs font-bold text-[#001F3F] shadow-sm outline-none"
                             >
                               <option value="OPENING">OPENING</option>
                               <option value="CLOSING">CLOSING</option>
                               <option value="SHIFT_CHANGE">SHIFT CHANGE</option>
                               <option value="WEEKLY">WEEKLY</option>
                               <option value="MONTHLY">MONTHLY</option>
                             </select>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 self-end sm:self-center">
                         <button 
                           onClick={() => handleDeleteTemplateLocal(tpl.id)}
                           className="p-3 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all"
                           title="Delete Protocol"
                         >
                           <Trash2 size={18} />
                         </button>
                         <button 
                           onClick={() => handleSaveTemplate(tpl.id)} 
                           disabled={status === 'SAVING'}
                           className={`min-w-[140px] px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg transition-all duration-300 ${
                             status === 'SAVED' ? 'bg-green-600 text-white' : status === 'SAVING' ? 'bg-blue-800 text-white animate-pulse' : 'bg-[#001F3F] text-white'
                           }`}
                         >
                           {status === 'SAVING' ? <RefreshCw className="animate-spin" size={14} /> : <Save size={14} />}
                           {status === 'SAVING' ? 'Saving...' : status === 'SAVED' ? 'Saved!' : 'Save Standard'}
                         </button>
                      </div>
                    </div>

                    <div className="p-8 space-y-4">
                      {tpl.tasks.length === 0 && (
                        <div className="text-center py-8 text-neutral-300 font-bold uppercase tracking-widest text-[10px] border-2 border-dashed border-neutral-100 rounded-2xl">
                          No tasks defined. Add one below.
                        </div>
                      )}
                      
                      {tpl.tasks.map((task, index) => (
                        <div key={task.id} className="group/task relative flex flex-col sm:flex-row items-start gap-4 p-5 bg-white border border-neutral-100 rounded-2xl hover:border-blue-100 hover:shadow-md transition-all duration-300">
                           {/* Reorder controls */}
                           <div className="flex sm:flex-col gap-1 items-center justify-center sm:pt-2">
                              <button 
                                onClick={() => handleMoveTask(tpl.id, index, -1)} 
                                disabled={index === 0}
                                className="p-1 text-neutral-300 hover:text-[#001F3F] disabled:opacity-20 transition-colors"
                              >
                                <MoveUp size={14} />
                              </button>
                              <div className="text-neutral-200">
                                <GripVertical size={14} />
                              </div>
                              <button 
                                onClick={() => handleMoveTask(tpl.id, index, 1)} 
                                disabled={index === tpl.tasks.length - 1}
                                className="p-1 text-neutral-300 hover:text-[#001F3F] disabled:opacity-20 transition-colors"
                              >
                                <MoveDown size={14} />
                              </button>
                           </div>

                           <div className="flex-1 w-full space-y-4">
                              <input 
                                 value={task.title} 
                                 placeholder="Enter task description..."
                                 onChange={(e) => handleTaskUpdate(tpl.id, task.id, { title: e.target.value })}
                                 className="w-full font-bold text-neutral-800 placeholder:text-neutral-300 bg-transparent border-none p-0 focus:ring-0" 
                              />
                              
                              <div className="flex flex-wrap items-center gap-3">
                                 <button 
                                    onClick={() => handleTaskUpdate(tpl.id, task.id, { requiresPhoto: !task.requiresPhoto })}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${
                                      task.requiresPhoto ? 'bg-[#001F3F] text-white border-[#001F3F]' : 'bg-neutral-50 text-neutral-400 border-neutral-100 hover:border-neutral-200'
                                    }`}
                                 >
                                    <Camera size={12} /> Photo Required
                                 </button>
                                 
                                 <button 
                                    onClick={() => handleTaskUpdate(tpl.id, task.id, { isCritical: !task.isCritical })}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${
                                      task.isCritical ? 'bg-red-50 text-red-600 border-red-100' : 'bg-neutral-50 text-neutral-400 border-neutral-100 hover:border-neutral-200'
                                    }`}
                                 >
                                    <AlertCircle size={12} /> Critical Path
                                 </button>

                                 <div className="flex items-center gap-2 bg-neutral-50 px-3 py-1.5 rounded-lg border border-neutral-100">
                                    <Hash size={12} className="text-neutral-400" />
                                    <input 
                                       placeholder="Add numeric value label..." 
                                       value={task.requiresValue || ''}
                                       onChange={(e) => handleTaskUpdate(tpl.id, task.id, { requiresValue: e.target.value })}
                                       className="bg-transparent border-none p-0 text-[9px] font-bold text-[#001F3F] placeholder:text-neutral-300 focus:ring-0 min-w-[140px]"
                                    />
                                 </div>
                              </div>
                           </div>

                           <button 
                             onClick={() => handleDeleteTask(tpl.id, task.id)}
                             className="absolute top-4 right-4 sm:static p-2 text-neutral-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                           >
                             <Trash2 size={16} />
                           </button>
                        </div>
                      ))}

                      <button 
                        onClick={() => handleAddTask(tpl.id)}
                        className="w-full py-4 border-2 border-dashed border-neutral-100 rounded-2xl text-neutral-400 font-bold uppercase tracking-widest text-[10px] hover:border-[#001F3F] hover:text-[#001F3F] hover:bg-blue-50/50 transition-all flex items-center justify-center gap-2"
                      >
                        <Plus size={16} /> Add Standard Task
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default ManagerHub;
