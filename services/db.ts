
// No imports needed - Firebase is loaded globally via CDN script tags in index.html
import { User, UserProgress, ChecklistSubmission, ChecklistTemplate, TrainingModule, ManualSection, Recipe } from '../types';

declare const firebase: any;

const firebaseConfig = {
  apiKey: "AIzaSyDbOuTQGRW2LtQUpRFHmcXj782Zp4tEKvQ",
  authDomain: "boundaries-logbook-app.firebaseapp.com",
  projectId: "boundaries-logbook-app",
  storageBucket: "boundaries-logbook-app.firebasestorage.app",
  messagingSenderId: "240460663130",
  appId: "1:240460663130:web:8976e8a967f8a101898b63"
};

// Initialize once using global firebase object
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const firestore = typeof firebase !== 'undefined' ? firebase.firestore() : null;

const DOC_KEYS = {
  USERS: 'users',
  PROGRESS: 'progress',
  SUBMISSIONS: 'submissions',
  TEMPLATES: 'templates',
  CURRICULUM: 'curriculum',
  MANUAL: 'manual',
  RECIPES: 'recipes',
};

function removeUndefined(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(item => removeUndefined(item));
  }
  if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) => [key, removeUndefined(value)])
    );
  }
  return obj;
}

class CloudAPI {
  private async remoteGet<T>(docId: string, defaultValue: T): Promise<T> {
    if (!firestore) return defaultValue;
    try {
      const docRef = firestore.collection('appData').doc(docId);
      const snap = await docRef.get();
      if (!snap.exists) return defaultValue;
      const data = snap.data();
      return data && data.data ? data.data : defaultValue;
    } catch (error) {
      console.warn(`[Firestore] Get error for ${docId}:`, error);
      return defaultValue;
    }
  }

  private async remoteSet<T>(docId: string, data: T): Promise<void> {
    if (!firestore) return;
    try {
      if (data === undefined || data === null) return;
      const cleanedData = removeUndefined(data);
      await firestore.collection('appData').doc(docId).set({ 
        data: cleanedData,
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: false });
    } catch (error) {
      console.error(`[Firestore] Set error for ${docId}:`, error);
    }
  }

  async fetchUsers(defaults: User[]): Promise<User[]> {
    const persistedUsers = await this.remoteGet(DOC_KEYS.USERS, [] as User[]);
    const userMap = new Map<string, User>();
    defaults.forEach(def => userMap.set(def.email.toLowerCase(), def));
    persistedUsers.forEach(u => userMap.set(u.email.toLowerCase(), u));
    return Array.from(userMap.values());
  }

  async syncUser(user: User): Promise<User[]> {
    const currentUsers = await this.remoteGet(DOC_KEYS.USERS, [] as User[]);
    const userMap = new Map<string, User>();
    currentUsers.forEach(u => userMap.set(u.email.toLowerCase(), u));
    userMap.set(user.email.toLowerCase(), user);
    const next = Array.from(userMap.values());
    await this.remoteSet(DOC_KEYS.USERS, next);
    return next;
  }

  async fetchSubmissions(): Promise<ChecklistSubmission[]> {
    return this.remoteGet(DOC_KEYS.SUBMISSIONS, []);
  }

  async pushFullSubmissionsRegistry(submissions: ChecklistSubmission[]): Promise<void> {
    await this.remoteSet(DOC_KEYS.SUBMISSIONS, submissions);
  }

  async pushSubmission(submission: ChecklistSubmission): Promise<void> {
    const all = await this.fetchSubmissions();
    const existingIdx = all.findIndex(s => s.id === submission.id);
    let next;
    if (existingIdx > -1) {
      const existing = all[existingIdx];
      const mergedResults = [...existing.taskResults];
      submission.taskResults.forEach(newRes => {
        const idx = mergedResults.findIndex(r => r.taskId === newRes.taskId);
        if (idx === -1) mergedResults.push(newRes);
        else if (newRes.completed || newRes.value || newRes.photoUrl || newRes.comment) mergedResults[idx] = newRes;
      });
      next = all.map((s, i) => i === existingIdx ? { 
        ...submission, 
        taskResults: mergedResults,
        status: (existing.status !== 'DRAFT' && submission.status === 'DRAFT') ? existing.status : submission.status 
      } : s);
    } else {
      next = [submission, ...all];
    }
    await this.remoteSet(DOC_KEYS.SUBMISSIONS, next);
  }

  async fetchProgress(): Promise<UserProgress[]> {
    return this.remoteGet(DOC_KEYS.PROGRESS, []);
  }

  async pushProgress(progress: UserProgress[]): Promise<void> {
    const existing = await this.fetchProgress();
    const merged = [...existing];
    progress.forEach(p => {
      const idx = merged.findIndex(m => m.userId === p.userId && m.lessonId === p.lessonId);
      if (idx > -1) merged[idx] = p;
      else merged.push(p);
    });
    await this.remoteSet(DOC_KEYS.PROGRESS, merged);
  }

  async pushTemplates(templates: ChecklistTemplate[]): Promise<void> {
    await this.remoteSet(DOC_KEYS.TEMPLATES, templates);
  }

  async pushCurriculum(curriculum: TrainingModule[]): Promise<void> {
    await this.remoteSet(DOC_KEYS.CURRICULUM, curriculum);
  }

  async pushManual(manual: ManualSection[]): Promise<void> {
    await this.remoteSet(DOC_KEYS.MANUAL, manual);
  }

  async pushRecipes(recipes: Recipe[]): Promise<void> {
    await this.remoteSet(DOC_KEYS.RECIPES, recipes);
  }

  async globalSync(defaults: { 
    users: User[], 
    templates: ChecklistTemplate[], 
    curriculum: TrainingModule[], 
    manual: ManualSection[], 
    recipes: Recipe[] 
  }) {
    const [users, submissions, progress, templates, curriculum, manual, recipes] = await Promise.all([
      this.fetchUsers(defaults.users),
      this.fetchSubmissions(),
      this.fetchProgress(),
      this.remoteGet(DOC_KEYS.TEMPLATES, defaults.templates),
      this.remoteGet(DOC_KEYS.CURRICULUM, defaults.curriculum),
      this.remoteGet(DOC_KEYS.MANUAL, defaults.manual),
      this.remoteGet(DOC_KEYS.RECIPES, defaults.recipes)
    ]);
    return { users, submissions, progress, templates, curriculum, manual, recipes };
  }
}

export const db = new CloudAPI();
