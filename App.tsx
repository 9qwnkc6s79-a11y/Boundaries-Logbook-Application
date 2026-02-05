import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { User, UserRole, UserProgress, ChecklistSubmission, ChecklistTemplate, Store, TrainingModule, ManualSection, Recipe, ToastSalesData, ToastTimeEntry, Organization } from './types';
import { TRAINING_CURRICULUM, CHECKLIST_TEMPLATES, MOCK_USERS, MOCK_STORES, BOUNDARIES_MANUAL, BOUNDARIES_RECIPES } from './data/mockData';
import { db } from './services/db';
import Layout from './components/Layout';
import TrainingView from './components/TrainingView';
import OpsView from './components/OpsView';
import ManagerHub from './components/ManagerHub';
import StaffDashboard from './components/StaffDashboard';
import RecipeBook from './components/RecipeBook';
import Login from './components/Login';
import Onboarding, { OnboardingData } from './components/Onboarding';
import { getStarterPack } from './data/starterPacks';
import { GoogleGenAI } from "@google/genai";
import { hashPassword, verifyPassword, isHashed } from './utils/passwordUtils';

const APP_VERSION = '3.6.0';

const DEFAULT_ORG_ID = 'org-boundaries';

// Default Boundaries Coffee organization
const DEFAULT_ORG: Organization = {
  id: DEFAULT_ORG_ID,
  name: 'BOUNDARIES',
  primaryColor: '#0F2B3C',
  accentColor: '#C77B3C',
  stores: MOCK_STORES,
  createdAt: new Date().toISOString(),
};

// Apply org theme to CSS custom properties
function applyOrgTheme(org: Organization | null) {
  const root = document.documentElement;
  const primary = org?.primaryColor || '#0F2B3C';
  const accent = org?.accentColor || '#C77B3C';
  root.style.setProperty('--primary', primary);
  root.style.setProperty('--accent', accent);
}

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('training');
  const [currentStoreId, setCurrentStoreId] = useState<string>(MOCK_STORES[0].id);
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [onboardingMode, setOnboardingMode] = useState(false);

  // System States
  const [isSyncing, setIsSyncing] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Toast POS Data (for sidebar widgets)
  const [toastSales, setToastSales] = useState<ToastSalesData | null>(null);
  const [toastClockedIn, setToastClockedIn] = useState<ToastTimeEntry[]>([]);
  const [salesComparison, setSalesComparison] = useState<{
    salesDiff: number;
    salesPercent: number;
    ordersDiff: number;
    ordersPercent: number;
  } | null>(null);

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

  // Initialize org on first load
  const initOrg = useCallback(async () => {
    // Try to load the Boundaries org
    let org = await db.fetchOrg(DEFAULT_ORG_ID);
    if (!org) {
      // First time: create org and migrate data
      console.log('[App] No org found, creating default Boundaries Coffee org...');
      org = { ...DEFAULT_ORG, stores: MOCK_STORES };
      await db.createOrg(org);
      // Migrate existing appData to org
      await db.migrateToOrg(DEFAULT_ORG_ID);
      console.log('[App] Default org created and data migrated');
    }
    db.setOrg(org.id);
    setCurrentOrg(org);
    applyOrgTheme(org);
    return org;
  }, []);

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
    const init = async () => {
      await initOrg();
      await performCloudSync();
    };
    init();
  }, [performCloudSync, initOrg]);

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

  // Clear Toast POS data when switching stores to prevent showing wrong store's data
  useEffect(() => {
    console.log(`[App] Store changed to ${currentStoreId}, clearing Toast data`);
    setToastSales(null);
    setToastClockedIn([]);
  }, [currentStoreId]);

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
    
    const found = userList.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
    if (!found || !found.password) throw new Error("Invalid credentials or account not found.");

    const passwordMatch = await verifyPassword(pass, found.password);
    if (!passwordMatch) throw new Error("Invalid credentials or account not found.");

    // Check if account has been deactivated by an admin
    if (found.active === false) {
      throw new Error("Your account has been deactivated. Contact your manager.");
    }

    // Auto-migrate plaintext password to hashed on successful login
    if (!isHashed(found.password)) {
      try {
        const hashed = await hashPassword(pass);
        const updated = { ...found, password: hashed };
        await db.syncUser(updated);
        console.log(`[Auth] Auto-migrated password hash for ${found.email}`);
      } catch (e) {
        // Migration failure is non-blocking — user can still log in
        console.warn('[Auth] Password migration failed:', e);
      }
    }

    // Ensure user has orgId set (migrate legacy users)
    if (!found.orgId) {
      const orgId = DEFAULT_ORG_ID;
      found.orgId = orgId;
      try {
        await db.syncUser(found);
        console.log(`[Auth] Migrated user ${found.email} to org ${orgId}`);
      } catch (e) {
        console.warn('[Auth] Org migration failed for user:', e);
      }
    }

    // Load org config for user
    const orgId = found.orgId || DEFAULT_ORG_ID;
    if (!currentOrg || currentOrg.id !== orgId) {
      const org = await db.fetchOrg(orgId);
      if (org) {
        db.setOrg(org.id);
        setCurrentOrg(org);
        applyOrgTheme(org);
      }
    }

    setCurrentUser(found);
    return found;
  };

  const handleSignupAction = async (user: User) => {
    // Hash password before saving
    const hashed = await hashPassword(user.password || '');
    const secureUser = { ...user, password: hashed };
    await db.syncUser(secureUser);
    const freshData = await performCloudSync();
    setAllUsers(freshData?.users || []);
    setCurrentUser(secureUser);
  };

  const handlePasswordResetAction = async (email: string, pass: string) => {
    const freshData = await performCloudSync();
    const userList = freshData?.users || allUsers;
    const user = userList.find(u => u.email === email);
    
    if (user) {
      const hashed = await hashPassword(pass);
      const updated = { ...user, password: hashed };
      await db.syncUser(updated);
      await performCloudSync(true);
    }
  };

  const handleOnboardingComplete = async (data: OnboardingData) => {
    // Generate orgId from shop name
    let orgId = 'org-' + data.orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    // Check for collision
    const existing = await db.fetchOrg(orgId);
    if (existing) {
      orgId = orgId + '-' + Date.now();
    }

    // Create organization
    const org: Organization = {
      id: orgId,
      name: data.orgName.toUpperCase(),
      primaryColor: data.branding.primaryColor,
      accentColor: data.branding.accentColor,
      logo: data.branding.logo,
      stores: data.stores,
      createdAt: new Date().toISOString(),
    };

    await db.createOrg(org);
    db.setOrg(orgId);

    // Get starter pack data and seed to Firestore
    const pack = getStarterPack(data.packId, data.stores.map(s => s.id));
    await db.seedOrgData(orgId, {
      curriculum: pack.curriculum,
      templates: pack.templates,
      recipes: pack.recipes,
      manual: pack.manual,
    });

    // Create admin user with hashed password
    const hashedPassword = await hashPassword(data.user.password);
    const adminUser: User = {
      id: `u-admin-${Date.now()}`,
      name: data.user.name,
      email: data.user.email,
      password: hashedPassword,
      role: UserRole.ADMIN,
      storeId: data.stores[0].id,
      orgId: orgId,
    };

    await db.syncUser(adminUser);

    // Set org state and auto-login
    setCurrentOrg(org);
    applyOrgTheme(org);
    setCurrentUser(adminUser);
    setCurrentStoreId(data.stores[0].id);
    setOnboardingMode(false);

    // Load the new org's data
    setCurriculum(pack.curriculum);
    setTemplates(pack.templates);
    setRecipes(pack.recipes);
    setManual(pack.manual);
    setAllUsers([adminUser]);
    setSubmissions([]);
    setProgress([]);

    console.log(`[Onboarding] Organization "${org.name}" (${orgId}) created with pack "${data.packId}"`);
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

    // Capture Toast metrics snapshot when finalizing for leader performance scoring
    const toastSnapshotData = data.isFinal && toastSales ? {
      averageTurnTime: toastSales.averageTurnTime,
      averageCheck: toastSales.averageCheck,
      totalSales: toastSales.totalSales,
      totalOrders: toastSales.totalOrders,
      snapshotAt: new Date().toISOString(),
    } : undefined;

    const submission: ChecklistSubmission = existing ? {
      ...existing,
      taskResults,
      status: data.isFinal ? 'PENDING' : 'DRAFT' as any,
      submittedAt: data.isFinal ? new Date().toISOString() : existing.submittedAt,
      toastSnapshot: toastSnapshotData || existing.toastSnapshot,
    } : {
      id: data.id || `sub-${Date.now()}`,
      userId: currentUser?.id || 'anonymous',
      storeId: currentStoreId,
      templateId: data.templateId,
      date: data.targetDate,
      status: data.isFinal ? 'PENDING' : 'DRAFT',
      submittedAt: data.isFinal ? new Date().toISOString() : undefined,
      taskResults,
      toastSnapshot: toastSnapshotData,
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

  // Derive stores from org, fallback to MOCK_STORES
  const orgStores = useMemo(() => {
    return currentOrg?.stores && currentOrg.stores.length > 0 ? currentOrg.stores : MOCK_STORES;
  }, [currentOrg]);

  // Handler for saving org config (used by ManagerHub branding/stores)
  const handleSaveOrg = useCallback(async (updatedOrg: Organization) => {
    const success = await db.saveOrg(updatedOrg);
    if (success) {
      setCurrentOrg(updatedOrg);
      applyOrgTheme(updatedOrg);
      console.log('[App] Organization config saved');
    }
    return success;
  }, []);

  if (isInitialLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-white p-12 text-center" style={{ backgroundColor: 'var(--primary, #0F2B3C)' }}>
        <div className="bg-white p-6 rounded-[2.5rem] mb-8 animate-bounce shadow-2xl">
          <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--primary, #0F2B3C)', borderTopColor: 'transparent' }} />
        </div>
        <h2 className="text-3xl font-black uppercase tracking-tighter mb-2">Connecting to Store Cloud</h2>
        <p className="text-blue-300 font-bold uppercase tracking-widest text-[10px]">Authorizing Team Context...</p>
      </div>
    );
  }

  if (!currentUser || !effectiveUser) {
    if (onboardingMode) {
      return (
        <Onboarding
          onComplete={handleOnboardingComplete}
          onBack={() => setOnboardingMode(false)}
        />
      );
    }

    return (
      <Login 
        onLogin={handleLoginAction}
        onSignup={handleSignupAction}
        onPasswordReset={handlePasswordResetAction}
        users={allUsers} 
        stores={orgStores}
        version={APP_VERSION}
        org={currentOrg}
        onStartOnboarding={() => setOnboardingMode(true)}
      />
    );
  }

  const storeTemplates = templates.filter(t => t.storeId === currentStoreId);
  const storeSubmissions = submissions.filter(s => s.storeId === currentStoreId);
  // Include users assigned to this store OR users without a storeId (show in all stores until assigned)
  const storeUsers = allUsers.filter(u => u.storeId === currentStoreId || !u.storeId);
  const storeProgress = progress.filter(p => storeUsers.some(u => u.id === p.userId));
  const isManager = currentUser.role === UserRole.MANAGER || currentUser.role === UserRole.ADMIN;
  const activeStores = orgStores;

  return (
    <Layout
      user={effectiveUser}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onLogout={() => setCurrentUser(null)}
      stores={activeStores}
      currentStoreId={currentStoreId}
      onStoreChange={setCurrentStoreId}
      onUserStoreChange={handleUpdateUserHomeStore}
      isSyncing={isSyncing}
      manual={manual}
      recipes={recipes}
      version={APP_VERSION}
      toastSales={toastSales}
      toastClockedIn={toastClockedIn}
      salesComparison={salesComparison}
      org={currentOrg}
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
            onResetLessonProgress={async (lessonId) => {
              console.log(`[App] Resetting progress for lesson ${lessonId} for user ${currentUser.id}`);
              await db.deleteProgress(currentUser.id, lessonId);
              const updatedProgress = progress.filter(p => !(p.userId === currentUser.id && p.lessonId === lessonId));
              setProgress(updatedProgress);
              performCloudSync(true);
              console.log(`[App] Progress reset complete - lesson should now show interactive elements`);
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
        {activeTab === 'dashboard' && (
          <StaffDashboard
            currentUser={currentUser}
            allUsers={allUsers}
            submissions={storeSubmissions}
            templates={storeTemplates}
            progress={progress.filter(p => p.userId === currentUser.id)}
            curriculum={curriculum}
            toastSales={toastSales}
            toastClockedIn={toastClockedIn}
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
            currentUser={currentUser}
            submissions={storeSubmissions}
            templates={storeTemplates}
            curriculum={curriculum}
            allProgress={storeProgress}
            manual={manual}
            recipes={recipes}
            onReview={handleReview}
            onOverrideAIFlag={handleOverrideAIFlag}
            onResetSubmission={handleResetSubmission}
            org={currentOrg}
            onSaveOrg={handleSaveOrg}
            onPhotoComment={async (submissionId, taskId, comment) => {
              const submission = submissions.find(s => s.id === submissionId);
              if (!submission) return;

              const updatedResults = submission.taskResults.map(tr =>
                tr.taskId === taskId
                  ? {
                      ...tr,
                      managerPhotoComment: comment,
                      managerPhotoCommentBy: currentUser.id,
                      managerPhotoCommentAt: new Date().toISOString()
                    }
                  : tr
              );

              const updatedSubmission = {
                ...submission,
                taskResults: updatedResults
              };

              const allUpdated = submissions.map(s =>
                s.id === submissionId ? updatedSubmission : s
              );

              setSubmissions(allUpdated);
              await db.pushSubmission(updatedSubmission);
              performCloudSync(true);
            }}
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
            stores={activeStores}
            onUserUpdated={() => performCloudSync(true)}
            onToastSalesUpdate={setToastSales}
            onToastClockedInUpdate={setToastClockedIn}
            onSalesComparisonUpdate={setSalesComparison}
          />
        )}
      </div>
    </Layout>
  );
};

export default App;