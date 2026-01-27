
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
let firestore: any = null;
let storage: any = null;

if (typeof firebase !== 'undefined') {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
    console.log('[Firebase] Initialized app:', firebaseConfig.projectId);
  }
  firestore = firebase.firestore();
  storage = firebase.storage();
  console.log('[Firebase] Firestore and Storage connected');
} else {
  console.error('[Firebase] Firebase SDK not loaded! Check that CDN scripts are in index.html');
}

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
    if (!firestore) {
      console.warn(`[Firestore] remoteGet(${docId}): Firestore not available, returning default`);
      return defaultValue;
    }
    try {
      const docRef = firestore.collection('appData').doc(docId);
      const snap = await docRef.get();
      if (!snap.exists) {
        console.log(`[Firestore] remoteGet(${docId}): Document doesn't exist, returning default`);
        return defaultValue;
      }
      const data = snap.data();
      const result = data && data.data ? data.data : defaultValue;
      console.log(`[Firestore] remoteGet(${docId}): Retrieved ${Array.isArray(result) ? result.length + ' items' : 'data'}`);
      return result;
    } catch (error) {
      console.error(`[Firestore] remoteGet(${docId}): Error:`, error);
      return defaultValue;
    }
  }

  private async remoteSet<T>(docId: string, data: T): Promise<boolean> {
    const path = `appData/${docId}`;
    console.log(`[Firestore] remoteSet START: ${path}`);

    if (!firestore) {
      console.error(`[Firestore] remoteSet(${path}): FAILED - Firestore not initialized!`);
      return false;
    }

    if (data === undefined || data === null) {
      console.warn(`[Firestore] remoteSet(${path}): SKIPPED - data is null/undefined`);
      return false;
    }

    try {
      const cleanedData = removeUndefined(data);

      // Estimate document size to warn about Firestore 1MB limit
      const jsonStr = JSON.stringify(cleanedData);
      const jsonSize = jsonStr.length;
      const estimatedDocSize = Math.round(jsonSize / 1024);

      console.log(`[Firestore] remoteSet(${path}): Attempting write, size ~${estimatedDocSize}KB, items: ${Array.isArray(cleanedData) ? cleanedData.length : 'N/A'}`);

      if (jsonSize > 1000000) {
        console.error(`[Firestore] remoteSet(${path}): BLOCKED - Document size ${estimatedDocSize}KB exceeds 1MB limit!`);
        return false;
      }

      if (jsonSize > 900000) {
        console.warn(`[Firestore] remoteSet(${path}): WARNING - Document size ${estimatedDocSize}KB is dangerously close to 1MB limit`);
      }

      const docRef = firestore.collection('appData').doc(docId);
      console.log(`[Firestore] remoteSet(${path}): Calling set()...`);

      await docRef.set({
        data: cleanedData,
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: false });

      console.log(`[Firestore] remoteSet(${path}): SUCCESS - Saved ${Array.isArray(cleanedData) ? cleanedData.length + ' items' : 'data'} (~${estimatedDocSize}KB)`);
      return true;

    } catch (error: any) {
      console.error(`[Firestore] remoteSet(${path}): FAILED with error:`, error);
      console.error(`[Firestore] Error code: ${error?.code}`);
      console.error(`[Firestore] Error message: ${error?.message}`);

      if (error?.code === 'permission-denied') {
        console.error(`[Firestore] PERMISSION DENIED - Check Firestore security rules in Firebase Console`);
      } else if (error?.code === 'resource-exhausted' || error?.message?.includes('exceeds the maximum')) {
        console.error(`[Firestore] DOCUMENT TOO LARGE - Compress images or use Firebase Storage`);
      } else if (error?.code === 'unavailable') {
        console.error(`[Firestore] SERVICE UNAVAILABLE - Check internet connection`);
      }

      return false;
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

  /**
   * Upload photo to Firebase Storage and return download URL
   * @param dataUrl - Base64 data URL from canvas
   * @param storagePath - Full storage path (e.g., "photos/store123/2026-01-26/sub-123/task-1.jpg")
   * @returns Download URL from Firebase Storage
   */
  async uploadPhoto(dataUrl: string, storagePath: string): Promise<string> {
    if (!storage) {
      throw new Error('Firebase Storage not initialized');
    }

    try {
      // Convert data URL to blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();

      console.log(`[Storage] Uploading photo: ${storagePath}, size: ${Math.round(blob.size / 1024)}KB`);

      // Upload to Firebase Storage
      const storageRef = storage.ref(storagePath);
      const snapshot = await storageRef.put(blob);

      // Get download URL
      const downloadUrl = await snapshot.ref.getDownloadURL();
      console.log(`[Storage] Upload successful: ${downloadUrl.substring(0, 60)}...`);

      return downloadUrl;
    } catch (error: any) {
      console.error('[Storage] Upload failed:', error);
      throw new Error(`Photo upload failed: ${error.message}`);
    }
  }

  async pushSubmission(submission: ChecklistSubmission): Promise<boolean> {
    console.log(`[DB] pushSubmission START: id=${submission.id}, status=${submission.status}`);

    // Log photo info
    const photoTasks = submission.taskResults.filter(t => t.photoUrl || t.photoUrls);
    if (photoTasks.length > 0) {
      const totalPhotoCount = photoTasks.reduce((sum, t) =>
        sum + (t.photoUrls?.length || (t.photoUrl ? 1 : 0)), 0
      );
      console.log(`[DB] pushSubmission: ${totalPhotoCount} photo URLs`);
    }

    const all = await this.fetchSubmissions();
    console.log(`[DB] pushSubmission: Fetched ${all.length} existing submissions`);

    const existingIdx = all.findIndex(s => s.id === submission.id);
    let next;
    if (existingIdx > -1) {
      console.log(`[DB] pushSubmission: Updating existing submission at index ${existingIdx}`);
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
      console.log(`[DB] pushSubmission: Adding new submission`);
      next = [submission, ...all];
    }

    // Log document size (should be small now that we use Storage URLs)
    const jsonSize = JSON.stringify(next).length;
    console.log(`[DB] pushSubmission: Document size: ${Math.round(jsonSize / 1024)}KB`);

    if (jsonSize > 900000) {
      console.warn(`[DB] pushSubmission: Document size is large (${Math.round(jsonSize / 1024)}KB) - consider archiving old submissions`);
    }

    console.log(`[DB] pushSubmission: Saving ${next.length} total submissions`);
    const success = await this.remoteSet(DOC_KEYS.SUBMISSIONS, next);
    console.log(`[DB] pushSubmission END: success=${success}`);
    return success;
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
    const [users, submissions, progress, templates, cloudCurriculum, manual, recipes] = await Promise.all([
      this.fetchUsers(defaults.users),
      this.fetchSubmissions(),
      this.fetchProgress(),
      this.remoteGet(DOC_KEYS.TEMPLATES, defaults.templates),
      this.remoteGet(DOC_KEYS.CURRICULUM, defaults.curriculum),
      this.remoteGet(DOC_KEYS.MANUAL, defaults.manual),
      this.remoteGet(DOC_KEYS.RECIPES, defaults.recipes)
    ]);

    // Merge new modules from defaults that don't exist in cloud
    // This ensures new modules added to mockData.ts appear in the app
    const cloudModuleIds = new Set(cloudCurriculum.map((m: TrainingModule) => m.id));
    const newModules = defaults.curriculum.filter(m => !cloudModuleIds.has(m.id));

    // Force-update specific modules that have been restructured
    const forceUpdateModuleIds = ['m-drink-making-basics']; // Module 12 with new practice structure

    // Update existing modules - force replace modules in forceUpdateModuleIds list
    const updatedModules = cloudCurriculum.map((cloudModule: TrainingModule) => {
      const defaultModule = defaults.curriculum.find(m => m.id === cloudModule.id);

      // Force update modules that need restructuring
      if (defaultModule && forceUpdateModuleIds.includes(cloudModule.id)) {
        console.log(`[Firestore] globalSync: Force-updating module ${cloudModule.id}`);
        return defaultModule;
      }

      // Update if default has more lessons
      if (defaultModule && defaultModule.lessons.length > cloudModule.lessons.length) {
        console.log(`[Firestore] globalSync: Updating module ${cloudModule.id} with new lessons`);
        return defaultModule;
      }

      return cloudModule;
    });

    let curriculum = updatedModules;
    if (newModules.length > 0) {
      console.log(`[Firestore] globalSync: Found ${newModules.length} new curriculum module(s), merging...`);
      curriculum = [...updatedModules, ...newModules];
    }

    // Always push to ensure updates are saved
    if (newModules.length > 0 || forceUpdateModuleIds.length > 0) {
      console.log(`[Firestore] globalSync: Pushing updated curriculum to cloud...`);
      await this.remoteSet(DOC_KEYS.CURRICULUM, curriculum);
    }

    // Merge new recipes from defaults that don't exist in cloud
    // This ensures new recipes added to mockData.ts appear in the app
    const cloudRecipeIds = new Set(recipes.map((r: Recipe) => r.id));
    const newRecipes = defaults.recipes.filter(r => !cloudRecipeIds.has(r.id));

    let mergedRecipes = recipes;
    if (newRecipes.length > 0) {
      console.log(`[Firestore] globalSync: Found ${newRecipes.length} new recipe(s), merging...`);
      mergedRecipes = [...recipes, ...newRecipes];
      // Push merged recipes back to cloud
      await this.remoteSet(DOC_KEYS.RECIPES, mergedRecipes);
    }

    return { users, submissions, progress, templates, curriculum, manual, recipes: mergedRecipes };
  }
}

export const db = new CloudAPI();
