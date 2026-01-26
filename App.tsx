import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { User, UserRole, UserProgress, ChecklistSubmission, ChecklistTemplate, Store, TrainingModule, ManualSection, Recipe, ToastSalesData, ToastTimeEntry } from './types';
import { TRAINING_CURRICULUM, CHECKLIST_TEMPLATES, MOCK_USERS, MOCK_STORES, BOUNDARIES_MANUAL, BOUNDARIES_RECIPES } from './data/mockData';
import { db } from './services/db';
import Layout from './components/Layout';
import TrainingView from './components/TrainingView';
import OpsView from './components/OpsView';
import ManagerHub from './components/ManagerHub';
import RecipeBook from './components/RecipeBook';
import Login from './components/Login';
import { GoogleGenAI } from "@google/genai";

const APP_VERSION = '3.4.2';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('training');
  const [currentStoreId, setCurrentStoreId] = useState<string>(MOCK_STORES[0].id);

  // System States
  const [isSyncing, setIsSyncing] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Toast POS Data (for sidebar widgets)
  const [toastSales, setToastSales] = useState<ToastSalesData | null>(null);
  const [toastClockedIn, setToastClockedIn] = useState<ToastTimeEntry[]>([]);

  // Persistent App Context (Shared with Team)
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [submissions, setSubmissions] = useState<ChecklistSubmission[]>([]);
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [curriculum, setCurriculum] = useState<TrainingModule[]>([]);
  const [manual, setManual] = useState<ManualSection[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);

  // Track the last time we updated a submission locally to avoid the "sync overwrite flicker"
  const lastSubmissionUpdateRef = useRef<number>(0);

  const performCloudSync = useCallback(async (background = false) => {
    if (!background) setIsSyncing(true);
    try {
      const data = await db.globalSync({
        users: MOCK_USERS,
        templates: CHECKLIST_TEMPLATES,
        curriculum: TRAINING_CURRICULUM,
        manual: BOUNDARIES_MANUAL,
        recipes: BOUNDARIES_RECIPES
      });
      
      setAllUsers(data.users);
      
      // OPTIMISTIC UI PROTECTION: 
      // If we recently updated a submission, don't overwrite the state with 
      // potentially stale data from the server for 7 seconds.
      if (Date.now() - lastSubmissionUpdateRef.current > 7000) {
        setSubmissions(data.submissions || []);
      }
      
      setProgress(data.progress || []);
      setTemplates(data.templates || []);
      setCurriculum(data.curriculum || []);
      setManual(data.manual || []);
      setRecipes(data.recipes || []);

      return data;
    } catch (err) {
      console.error("Cloud Sync Error:", err);
      return null;
    } finally {
      setIsSyncing(false);
      setIsInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    performCloudSync();
  }, [performCloudSync]);

  // Aggressive sync heartbeat to ensure Manager sees Trainee work near real-time
  useEffect(() => {
    if (!currentUser) return;
    const heartbeat = setInterval(() => {
      performCloudSync(true); 
    }, 4000); 
    return () => clearInterval(heartbeat);
  }, [currentUser, performCloudSync]);

  // Listen for cross-tab storage changes
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key && e.key.includes('boundaries_cloud')) {
        performCloudSync(true);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [performCloudSync]);

  useEffect(() => {
    if (currentUser) {
      setCurrentStoreId(currentUser.storeId);
      if (currentUser.role === UserRole.TRAINEE) setActiveTab('training');
      else if (currentUser.role === UserRole.MANAGER || currentUser.role === UserRole.ADMIN) setActiveTab('manager');
      else setActiveTab('ops');
    }
  }, [currentUser]);

  const effectiveUser = useMemo(() => {
    if (!currentUser) return null;
    const userProgress = progress.filter(p => p.userId === currentUser.id);
    const onboardingLessons = curriculum
      .filter(m => m.category === 'ONBOARDING')
      .flatMap(m => m.lessons);
    
    if (onboardingLessons.length === 0) return currentUser;
    const finishedCount = onboardingLessons.filter(l => 
      userProgress.some(p => p.lessonId === l.id && p.status === 'COMPLETED')
    ).length;

    if (currentUser.role === UserRole.TRAINEE && finishedCount === onboardingLessons.length) {
      return { ...currentUser, role: UserRole.TRAINER as any };
    }
    return currentUser;
  }, [currentUser, progress, curriculum]);

  const handleLoginAction = async (email: string, pass: string): Promise<User> => {
    const freshData = await performCloudSync();
    const userList = freshData?.users || allUsers;
    
    const found = userList.find(u => u.email.toLowerCase() === email.toLowerCase().trim() && u.password === pass);
    if (!found) throw new Error("Invalid credentials or account not found.");
    
    setCurrentUser(found);
    return found;
  };

  const handleSignupAction = async (user: User) => {
    await db.syncUser(user);
    const freshData = await performCloudSync();
    setAllUsers(freshData?.users || []);
    setCurrentUser(user);
  };

  const handlePasswordResetAction = async (email: string, pass: string) => {
    const freshData = await performCloudSync();
    const userList = freshData?.users || allUsers;
    const user = userList.find(u => u.email === email);
    
    if (user) {
      const updated = { ...user, password: pass };
      await db.syncUser(updated);
      await performCloudSync(true);
    }
  };

  const handleLessonComplete = async (lessonId: string, score?: number, fileData?: { url: string, name: string }, checklistCompleted?: string[], checklistPhotos?: Record<string, string>) => {
    if (!currentUser) return;
    const entry: UserProgress = {
      userId: currentUser.id,
      lessonId,
      status: 'COMPLETED',
      score,
      completedAt: new Date().toISOString(),
      fileUrl: fileData?.url,
      fileName: fileData?.name,
      checklistCompleted,
      checklistPhotos
    };

    setProgress(prev => [...prev, entry]);
    await db.pushProgress([entry]);
    performCloudSync(true);
  };

  const auditPhotoWithAI = async (photoUrl: string, taskTitle: string): Promise<{ flagged: boolean; reason: string }> => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const base64Data = photoUrl.split(',')[1];
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
            { text: `You are an operations auditor for Boundaries Coffee. The task name is: "${taskTitle}". Determine if this photo actually shows proof of the task being completed correctly in a cafe setting. Return ONLY a JSON object in this format: {"flagged": boolean, "reason": "Short explanation"}. Flag it if it is irrelevant, blurry, or incorrect.` }
          ]
        },
      });
      const text = response.text || '{"flagged": false, "reason": "No data"}';
      return JSON.parse(text);
    } catch (e) {
      console.error("AI Audit Error:", e);
      return { flagged: false, reason: "Audit service unavailable" };
    }
  };

  const handleChecklistUpdate = async (data: { id?: string, templateId: string, responses: any, isFinal: boolean, targetDate: string }) => {
    // Mark the timestamp to protect against stale sync heartbeat
    lastSubmissionUpdateRef.current = Date.now();

    let taskResults = Object.entries(data.responses).map(([taskId, res]: any) => ({
      taskId,
      completed: res.completed,
      photoUrl: res.photo, // Keep for backwards compatibility
      photoUrls: res.photos || (res.photo ? [res.photo] : undefined), // New array format
      value: res.value,
      comment: res.comment,
      completedByUserId: res.completedByUserId || currentUser?.id || 'unknown',
      completedAt: res.completedAt || new Date().toISOString(),
      aiFlagged: res.aiFlagged,
      aiReason: res.aiReason
    }));

    // Log photo task info for debugging
    const photoTasks = taskResults.filter(r => r.photoUrls && r.photoUrls.length > 0);
    if (photoTasks.length > 0) {
      const totalPhotos = photoTasks.reduce((sum, r) => sum + (r.photoUrls?.length || 0), 0);
      const totalPhotoSize = photoTasks.reduce((sum, r) => sum + (r.photoUrls?.reduce((s: number, p: string) => s + (p?.length || 0), 0) || 0), 0);
      console.log(`[Checklist] ${photoTasks.length} task(s) with ${totalPhotos} total photo(s), size: ${Math.round(totalPhotoSize / 1024)}KB`);
    }

    if (data.isFinal) {
      const template = templates.find(t => t.id === data.templateId);
      const auditPromises = taskResults.map(async (res) => {
        if (res.photoUrl && !res.aiFlagged) {
          const task = template?.tasks.find(t => t.id === res.taskId);
          console.log(`[AI Audit] Auditing photo for task: ${task?.title}`);
          const audit = await auditPhotoWithAI(res.photoUrl, task?.title || 'Unknown Task');
          console.log(`[AI Audit] Result: flagged=${audit.flagged}, reason="${audit.reason}"`);
          return { ...res, aiFlagged: audit.flagged, aiReason: audit.reason };
        }
        return res;
      });
      taskResults = await Promise.all(auditPromises);
    }

    const existing = data.id 
      ? submissions.find(s => s.id === data.id)
      : submissions.find(s => s.templateId === data.templateId && s.storeId === currentStoreId && s.date === data.targetDate && s.status === 'DRAFT');

    const submission: ChecklistSubmission = existing ? {
      ...existing,
      taskResults,
      status: data.isFinal ? 'PENDING' : 'DRAFT' as any,
      submittedAt: data.isFinal ? new Date().toISOString() : existing.submittedAt
    } : {
      id: data.id || `sub-${Date.now()}`,
      userId: currentUser?.id || 'anonymous',
      storeId: currentStoreId,
      templateId: data.templateId,
      date: data.targetDate,
      status: data.isFinal ? 'PENDING' : 'DRAFT',
      submittedAt: data.isFinal ? new Date().toISOString() : undefined,
      taskResults
    };

    setSubmissions(prev => {
      const filtered = prev.filter(s => s.id !== submission.id);
      return [submission, ...filtered];
    });
    
    await db.pushSubmission(submission);
    performCloudSync(true); 
  };

  const handleReview = async (id: string, approved: boolean) => {
    const sub = submissions.find(s => s.id === id);
    if (sub) {
      const updated = { ...sub, status: approved ? 'APPROVED' : 'REJECTED' as any };
      setSubmissions(prev => prev.map(s => s.id === id ? updated : s));
      await db.pushSubmission(updated);
      performCloudSync(true);
    }
  };

  const handleOverrideAIFlag = async (submissionId: string, taskId: string, approve: boolean) => {
    if (!currentUser) return;
    const sub = submissions.find(s => s.id === submissionId);
    if (!sub) return;

    const updatedTaskResults = sub.taskResults.map(tr => {
      if (tr.taskId === taskId) {
        if (approve) {
          return {
            ...tr,
            aiFlagged: false,
            managerOverride: true,
            overrideBy: currentUser.id,
            overrideAt: new Date().toISOString()
          };
        }
        // Keep flagged - just mark as reviewed (optional: could add reviewedBy field)
        return tr;
      }
      return tr;
    });

    const updated = { ...sub, taskResults: updatedTaskResults };
    setSubmissions(prev => prev.map(s => s.id === submissionId ? updated : s));
    await db.pushSubmission(updated);
    performCloudSync(true);
  };

  const handleResetSubmission = async (id: string) => {
    // Mark interaction to prevent sync overwrites
    lastSubmissionUpdateRef.current = Date.now();
    
    // Wipe locally
    const nextSubmissions = submissions.filter(s => s.id !== id);
    setSubmissions(nextSubmissions);
    
    // Wipe on cloud
    await db.pushFullSubmissionsRegistry(nextSubmissions);
    performCloudSync(true);
  };

  const handleUpdateTemplate = async (tpl: ChecklistTemplate) => {
    const updated = templates.map(t => t.id === tpl.id ? tpl : t);
    setTemplates(updated);
    await db.pushTemplates(updated);
    performCloudSync(true);
  };
  
  const handleUpdateRecipes = async (nextRecipes: Recipe[]) => {
    setRecipes(nextRecipes);
    await db.pushRecipes(nextRecipes);
    performCloudSync(true);
  };

  const handleUpdateUserHomeStore = async (storeId: string) => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, storeId };
    setCurrentUser(updatedUser);
    setCurrentStoreId(storeId);
    await db.syncUser(updatedUser);
    performCloudSync(true);
  };

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-[#001F3F] flex flex-col items-center justify-center text-white p-12 text-center">
        <div className="bg-white p-6 rounded-[2.5rem] mb-8 animate-bounce shadow-2xl">
          <div className="w-12 h-12 border-4 border-[#001F3F] border-t-transparent rounded-full animate-spin" />
        </div>
        <h2 className="text-3xl font-black uppercase tracking-tighter mb-2">Connecting to Store Cloud</h2>
        <p className="text-blue-300 font-bold uppercase tracking-widest text-[10px]">Authorizing Team Context...</p>
      </div>
    );
  }

  if (!currentUser || !effectiveUser) {
    return (
      <Login 
        onLogin={handleLoginAction}
        onSignup={handleSignupAction}
        onPasswordReset={handlePasswordResetAction}
        users={allUsers} 
        stores={MOCK_STORES}
        version={APP_VERSION}
      />
    );
  }

  const storeTemplates = templates.filter(t => t.storeId === currentStoreId);
  const storeSubmissions = submissions.filter(s => s.storeId === currentStoreId);
  const storeUsers = allUsers.filter(u => u.storeId === currentStoreId);
  const storeProgress = progress.filter(p => storeUsers.some(u => u.id === p.userId));
  const isManager = currentUser.role === UserRole.MANAGER || currentUser.role === UserRole.ADMIN;

  return (
    <Layout
      user={effectiveUser}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onLogout={() => setCurrentUser(null)}
      stores={MOCK_STORES}
      currentStoreId={currentStoreId}
      onStoreChange={setCurrentStoreId}
      onUserStoreChange={handleUpdateUserHomeStore}
      isSyncing={isSyncing}
      manual={manual}
      recipes={recipes}
      version={APP_VERSION}
      toastSales={toastSales}
      toastClockedIn={toastClockedIn}
    >
      <div className="animate-in fade-in duration-500">
        {activeTab === 'training' && (
          <TrainingView 
            curriculum={curriculum} 
            progress={progress.filter(p => p.userId === currentUser.id)} 
            onCompleteLesson={handleLessonComplete} 
            canEdit={currentUser.email.toLowerCase().endsWith('@boundariescoffee.com')} 
            onUpdateCurriculum={async (next) => {
              setCurriculum(next);
              await db.pushCurriculum(next);
              performCloudSync(true);
            }} 
          />
        )}
        {activeTab === 'recipes' && (
          <RecipeBook 
            manual={manual} 
            recipes={recipes} 
            isManager={isManager}
            onUpdateRecipes={handleUpdateRecipes}
          />
        )}
        {activeTab === 'ops' && (
          <OpsView 
            user={currentUser} 
            allUsers={allUsers} 
            templates={storeTemplates} 
            existingSubmissions={storeSubmissions} 
            onUpdate={handleChecklistUpdate} 
            onResetSubmission={handleResetSubmission}
          />
        )}
        {activeTab === 'manager' && (
          <ManagerHub
            staff={storeUsers}
            allUsers={allUsers}
            submissions={storeSubmissions}
            templates={storeTemplates}
            curriculum={curriculum}
            allProgress={storeProgress}
            manual={manual}
            recipes={recipes}
            onReview={handleReview}
            onOverrideAIFlag={handleOverrideAIFlag}
            onResetSubmission={handleResetSubmission}
            onUpdateTemplate={handleUpdateTemplate}
            onAddTemplate={async (tpl) => {
              const next = [...templates, { ...tpl, storeId: currentStoreId }];
              setTemplates(next);
              await db.pushTemplates(next);
              performCloudSync(true);
            }}
            onDeleteTemplate={async (id) => {
              const next = templates.filter(t => t.id !== id);
              setTemplates(next);
              await db.pushTemplates(next);
              performCloudSync(true);
            }}
            onUpdateManual={async (next) => {
              setManual(next);
              await db.pushManual(next);
              performCloudSync(true);
            }}
            onUpdateRecipes={handleUpdateRecipes}
            currentStoreId={currentStoreId}
            stores={MOCK_STORES}
            onToastSalesUpdate={setToastSales}
            onToastClockedInUpdate={setToastClockedIn}
          />
        )}
      </div>
    </Layout>
  );
};

export default App;