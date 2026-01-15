
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { User, UserRole, UserProgress, ChecklistSubmission, ChecklistTemplate, Store, TrainingModule, ManualSection, Recipe } from './types';
import { TRAINING_CURRICULUM, CHECKLIST_TEMPLATES, MOCK_USERS, MOCK_STORES, BOUNDARIES_MANUAL, BOUNDARIES_RECIPES } from './data/mockData';
import { db } from './services/db';
import Layout from './components/Layout';
import TrainingView from './components/TrainingView';
import OpsView from './components/OpsView';
import ManagerHub from './components/ManagerHub';
import RecipeBook from './components/RecipeBook';
import Login from './components/Login';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('training');
  const [currentStoreId, setCurrentStoreId] = useState<string>(MOCK_STORES[0].id);
  
  // System States
  const [isSyncing, setIsSyncing] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Persistent App Context (Shared with Team)
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [submissions, setSubmissions] = useState<ChecklistSubmission[]>([]);
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [curriculum, setCurriculum] = useState<TrainingModule[]>([]);
  const [manual, setManual] = useState<ManualSection[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);

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
      
      // IMPORTANT: Update state
      setAllUsers(data.users);
      setSubmissions(data.submissions);
      setProgress(data.progress);
      setTemplates(data.templates);
      setCurriculum(data.curriculum);
      setManual(data.manual);
      setRecipes(data.recipes);

      return data; // Return data for immediate usage
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

  // --- Actions ---

  const handleLoginAction = async (email: string, pass: string): Promise<User> => {
    // CRITICAL FIX: Force a fresh sync from DB before checking credentials
    // This solves the "User not found" issue if the state was stale
    const freshData = await performCloudSync();
    const userList = freshData?.users || allUsers;
    
    const found = userList.find(u => u.email.toLowerCase() === email.toLowerCase().trim() && u.password === pass);
    if (!found) throw new Error("Invalid credentials or account not found.");
    
    setCurrentUser(found);
    return found;
  };

  const handleSignupAction = async (user: User) => {
    // 1. Save to DB immediately
    await db.syncUser(user);
    // 2. Refresh local state fully
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

  const handleLessonComplete = async (lessonId: string, score?: number, fileData?: { url: string, name: string }) => {
    if (!currentUser) return;
    const entry: UserProgress = { 
      userId: currentUser.id, 
      lessonId, 
      status: 'COMPLETED', 
      score, 
      completedAt: new Date().toISOString(),
      fileUrl: fileData?.url,
      fileName: fileData?.name
    };
    
    // Optimistic Update
    setProgress(prev => [...prev, entry]);
    
    // DB Update
    await db.pushProgress([entry]);
    performCloudSync(true);
  };

  const handleChecklistUpdate = async (data: { id?: string, templateId: string, responses: any, isFinal: boolean, targetDate: string }) => {
    const taskResults = Object.entries(data.responses).map(([taskId, res]: any) => ({
      taskId, 
      completed: res.completed, 
      photoUrl: res.photo, 
      value: res.value, 
      comment: res.comment,
      completedByUserId: res.completedByUserId || currentUser?.id || 'unknown', 
      completedAt: res.completedAt || new Date().toISOString()
    }));

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

    // Optimistic Update
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
        users={allUsers} // Still passed for fallback UI checks, but Login now uses onLogin promise for auth
        stores={MOCK_STORES} 
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
      isSyncing={isSyncing}
      manual={manual}
      recipes={recipes}
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
          />
        )}
      </div>
    </Layout>
  );
};

export default App;
