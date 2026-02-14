
// No imports needed - Firebase is loaded globally via CDN script tags in index.html
import { User, UserProgress, ChecklistSubmission, ChecklistTemplate, TrainingModule, ManualSection, Recipe, CashDeposit, GoogleReviewsData, Organization, Store, AttributedOrder } from '../types';

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

  // Initialize Storage with error handling
  try {
    storage = firebase.storage();
    console.log('[Firebase] Firestore and Storage connected');
  } catch (error) {
    console.warn('[Firebase] Storage initialization failed - photo uploads will not work:', error);
    console.log('[Firebase] Firestore connected (Storage unavailable)');
  }
} else {
  console.error('[Firebase] Firebase SDK not loaded! Check that CDN scripts are in index.html');
}

// Increment this version whenever curriculum structure or lesson properties change
// This forces Firebase to update cached curriculum data
const CURRICULUM_VERSION = 5;

const DOC_KEYS = {
  USERS: 'users',
  PROGRESS: 'progress',
  SUBMISSIONS: 'submissions',
  TEMPLATES: 'templates',
  CURRICULUM: 'curriculum',
  CURRICULUM_VERSION: 'curriculum_version',
  MANUAL: 'manual',
  RECIPES: 'recipes',
  DEPOSITS: 'deposits',
  GOOGLE_REVIEWS: 'googleReviews',
  ATTRIBUTED_ORDERS: 'attributedOrders',
  FCM_TOKENS: 'fcmTokens',
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
  private currentOrgId: string | null = null;

  setOrg(orgId: string) {
    this.currentOrgId = orgId;
    console.log(`[Firestore] Organization context set to: ${orgId}`);
  }

  getOrgId(): string | null {
    return this.currentOrgId;
  }

  private getCollectionPath(): string {
    if (this.currentOrgId) {
      // Firestore doc refs need even segments: organizations/{orgId}/data/{docId} = 4 segments
      return `organizations/${this.currentOrgId}/data`;
    }
    return 'appData';
  }

  private async remoteGet<T>(docId: string, defaultValue: T): Promise<T> {
    if (!firestore) {
      console.warn(`[Firestore] remoteGet(${docId}): Firestore not available, returning default`);
      return defaultValue;
    }
    const collectionPath = this.getCollectionPath();

    // Helper to try appData fallback
    const tryAppDataFallback = async (): Promise<T | null> => {
      if (!this.currentOrgId) return null;
      try {
        console.log(`[Firestore] remoteGet(${docId}): Trying appData fallback`);
        const fallbackRef = firestore.collection('appData').doc(docId);
        const fallbackSnap = await fallbackRef.get();
        if (fallbackSnap.exists) {
          const fallbackData = fallbackSnap.data();
          const result = fallbackData && fallbackData.data ? fallbackData.data : null;
          if (result && (!Array.isArray(result) || result.length > 0)) {
            console.log(`[Firestore] remoteGet(${docId}): Retrieved ${Array.isArray(result) ? result.length + ' items' : 'data'} from appData fallback`);
            return result;
          }
        }
      } catch (fallbackError) {
        console.error(`[Firestore] remoteGet(${docId}): appData fallback failed:`, fallbackError);
      }
      return null;
    };

    try {
      const docRef = collectionPath.includes('/')
        ? firestore.doc(`${collectionPath}/${docId}`)
        : firestore.collection(collectionPath).doc(docId);
      const snap = await docRef.get();

      if (!snap.exists) {
        // Document doesn't exist in org path, try appData fallback
        const fallbackResult = await tryAppDataFallback();
        if (fallbackResult !== null) return fallbackResult;
        console.log(`[Firestore] remoteGet(${collectionPath}/${docId}): Document doesn't exist, returning default`);
        return defaultValue;
      }

      const data = snap.data();
      const result = data && data.data ? data.data : null;

      // If org path exists but has no data or empty array, try appData fallback
      if (result === null || (Array.isArray(result) && result.length === 0)) {
        console.log(`[Firestore] remoteGet(${collectionPath}/${docId}): Org path empty, trying appData fallback`);
        const fallbackResult = await tryAppDataFallback();
        if (fallbackResult !== null) return fallbackResult;
        return defaultValue;
      }

      console.log(`[Firestore] remoteGet(${collectionPath}/${docId}): Retrieved ${Array.isArray(result) ? result.length + ' items' : 'data'}`);
      return result;
    } catch (error) {
      console.error(`[Firestore] remoteGet(${collectionPath}/${docId}): Error:`, error);
      // On error, also try appData fallback
      const fallbackResult = await tryAppDataFallback();
      if (fallbackResult !== null) return fallbackResult;
      return defaultValue;
    }
  }

  private async remoteSet<T>(docId: string, data: T): Promise<boolean> {
    const collectionPath = this.getCollectionPath();
    const path = `${collectionPath}/${docId}`;
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

      const docRef = collectionPath.includes('/')
        ? firestore.doc(`${collectionPath}/${docId}`)
        : firestore.collection(collectionPath).doc(docId);
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

  // ── Organization CRUD ──

  async fetchOrg(orgId: string): Promise<Organization | null> {
    if (!firestore) return null;
    try {
      const docRef = firestore.doc(`organizations/${orgId}/config/main`);
      const snap = await docRef.get();
      if (!snap.exists) return null;
      const data = snap.data();
      return data?.data || null;
    } catch (error) {
      console.error(`[Firestore] fetchOrg(${orgId}): Error:`, error);
      return null;
    }
  }

  async saveOrg(org: Organization): Promise<boolean> {
    if (!firestore) return false;
    try {
      const cleaned = removeUndefined(org);
      const docRef = firestore.doc(`organizations/${org.id}/config/main`);
      await docRef.set({
        data: cleaned,
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: false });
      console.log(`[Firestore] saveOrg(${org.id}): SUCCESS`);
      return true;
    } catch (error) {
      console.error(`[Firestore] saveOrg(${org.id}): Error:`, error);
      return false;
    }
  }

  async createOrg(org: Organization): Promise<boolean> {
    return this.saveOrg(org);
  }

  async migrateToOrg(orgId: string): Promise<boolean> {
    if (!firestore) return false;
    console.log(`[Firestore] migrateToOrg(${orgId}): Starting migration from appData...`);

    try {
      // Copy each document from appData to organizations/{orgId}/
      const docKeys = Object.values(DOC_KEYS);
      for (const docKey of docKeys) {
        const sourceRef = firestore.collection('appData').doc(docKey);
        const snap = await sourceRef.get();
        if (snap.exists) {
          const data = snap.data();
          const targetRef = firestore.doc(`organizations/${orgId}/${docKey}`);
          await targetRef.set(data);
          console.log(`[Firestore] migrateToOrg: Copied appData/${docKey} → organizations/${orgId}/${docKey}`);
        }
      }

      // Update all users with orgId
      const usersRef = firestore.collection('appData').doc('users');
      const usersSnap = await usersRef.get();
      if (usersSnap.exists) {
        const usersData = usersSnap.data();
        if (usersData?.data && Array.isArray(usersData.data)) {
          const updatedUsers = usersData.data.map((u: User) => ({ ...u, orgId }));
          // Save to both locations
          await firestore.doc(`organizations/${orgId}/users`).set({
            data: updatedUsers,
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
          });
          await usersRef.set({
            data: updatedUsers,
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
          });
          console.log(`[Firestore] migrateToOrg: Updated ${updatedUsers.length} users with orgId=${orgId}`);
        }
      }

      console.log(`[Firestore] migrateToOrg(${orgId}): Migration complete`);
      return true;
    } catch (error) {
      console.error(`[Firestore] migrateToOrg(${orgId}): Error:`, error);
      return false;
    }
  }

  async seedOrgData(orgId: string, pack: {
    curriculum: TrainingModule[];
    templates: ChecklistTemplate[];
    recipes: Recipe[];
    manual: ManualSection[];
  }): Promise<void> {
    const previousOrg = this.currentOrgId;
    this.setOrg(orgId);

    try {
      console.log(`[Firestore] seedOrgData(${orgId}): Seeding ${pack.curriculum.length} modules, ${pack.templates.length} templates, ${pack.recipes.length} recipes, ${pack.manual.length} manual sections`);

      await Promise.all([
        this.remoteSet(DOC_KEYS.CURRICULUM, pack.curriculum),
        this.remoteSet(DOC_KEYS.TEMPLATES, pack.templates),
        this.remoteSet(DOC_KEYS.RECIPES, pack.recipes),
        this.remoteSet(DOC_KEYS.MANUAL, pack.manual),
        this.remoteSet(DOC_KEYS.SUBMISSIONS, []),
        this.remoteSet(DOC_KEYS.PROGRESS, []),
        this.remoteSet(DOC_KEYS.CURRICULUM_VERSION, CURRICULUM_VERSION),
      ]);

      console.log(`[Firestore] seedOrgData(${orgId}): Seeding complete`);
    } catch (error) {
      console.error(`[Firestore] seedOrgData(${orgId}): Error:`, error);
      throw error;
    } finally {
      // Restore previous org context if it was different
      if (previousOrg && previousOrg !== orgId) {
        this.setOrg(previousOrg);
      }
    }
  }

  async fetchAllOrgs(): Promise<Organization[]> {
    if (!firestore) return [];
    try {
      // We need to scan organizations collection - each org has a config/main sub-doc
      // For now, we look for known orgs. In future, maintain an index.
      const orgs: Organization[] = [];
      const boundariesOrg = await this.fetchOrg('org-boundaries');
      if (boundariesOrg) orgs.push(boundariesOrg);
      return orgs;
    } catch (error) {
      console.error('[Firestore] fetchAllOrgs: Error:', error);
      return [];
    }
  }

  async fetchUsers(defaults: User[]): Promise<User[]> {
    console.log('[Firestore] fetchUsers: Loading users...');
    console.log('[Firestore] fetchUsers: Default users:', defaults.length);
    const persistedUsers = await this.remoteGet(DOC_KEYS.USERS, [] as User[]);
    console.log('[Firestore] fetchUsers: Persisted users from cloud:', persistedUsers.length);

    // Build a map of default users by email for easy lookup
    const defaultsMap = new Map<string, User>();
    defaults.forEach(def => defaultsMap.set(def.email.toLowerCase(), def));

    // Merge: start with all persisted users
    const userMap = new Map<string, User>();
    persistedUsers.forEach(u => userMap.set(u.email.toLowerCase(), u));

    // Add any missing default users and detect if we need to update
    let needsUpdate = false;
    defaults.forEach(def => {
      const email = def.email.toLowerCase();
      if (!userMap.has(email)) {
        console.log('[Firestore] fetchUsers: Adding missing default user:', def.email);
        userMap.set(email, def);
        needsUpdate = true;
      }
    });

    const result = Array.from(userMap.values());

    // Save back to database if we added any missing defaults
    if (needsUpdate) {
      console.log('[Firestore] fetchUsers: Saving updated user list to database');
      await this.remoteSet(DOC_KEYS.USERS, result);
    }

    console.log('[Firestore] fetchUsers: Final merged users:', result.length, result.map(u => u.email));
    return result;
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

  async deleteProgress(userId: string, lessonId: string): Promise<void> {
    const existing = await this.fetchProgress();
    const filtered = existing.filter(p => !(p.userId === userId && p.lessonId === lessonId));
    await this.remoteSet(DOC_KEYS.PROGRESS, filtered);
  }

  // ── Templates (with fetch-merge-save to prevent overwrites) ──

  async fetchTemplates(): Promise<ChecklistTemplate[]> {
    return this.remoteGet(DOC_KEYS.TEMPLATES, []);
  }

  async pushTemplates(templates: ChecklistTemplate[]): Promise<void> {
    await this.remoteSet(DOC_KEYS.TEMPLATES, templates);
  }

  /**
   * Update a single template using fetch-merge-save pattern.
   * This prevents overwriting other users' changes.
   */
  async updateTemplate(template: ChecklistTemplate): Promise<boolean> {
    console.log(`[DB] updateTemplate: Fetching latest templates before merge...`);
    const current = await this.fetchTemplates();

    const existingIdx = current.findIndex(t => t.id === template.id);
    let next;
    if (existingIdx > -1) {
      next = current.map((t, i) => i === existingIdx ? template : t);
      console.log(`[DB] updateTemplate: Merged update for ${template.id} at index ${existingIdx}`);
    } else {
      next = [...current, template];
      console.log(`[DB] updateTemplate: Added new template ${template.id}`);
    }

    return this.remoteSet(DOC_KEYS.TEMPLATES, next);
  }

  /**
   * Delete a template using fetch-merge-save pattern.
   */
  async deleteTemplate(templateId: string): Promise<boolean> {
    console.log(`[DB] deleteTemplate: Fetching latest templates before delete...`);
    const current = await this.fetchTemplates();
    const next = current.filter(t => t.id !== templateId);
    console.log(`[DB] deleteTemplate: Removing ${templateId}, ${current.length} → ${next.length} templates`);
    return this.remoteSet(DOC_KEYS.TEMPLATES, next);
  }

  // ── Curriculum (with fetch-merge-save) ──

  async fetchCurriculum(): Promise<TrainingModule[]> {
    return this.remoteGet(DOC_KEYS.CURRICULUM, []);
  }

  async pushCurriculum(curriculum: TrainingModule[]): Promise<void> {
    await this.remoteSet(DOC_KEYS.CURRICULUM, curriculum);
  }

  async updateModule(module: TrainingModule): Promise<boolean> {
    console.log(`[DB] updateModule: Fetching latest curriculum before merge...`);
    const current = await this.fetchCurriculum();

    const existingIdx = current.findIndex(m => m.id === module.id);
    let next;
    if (existingIdx > -1) {
      next = current.map((m, i) => i === existingIdx ? module : m);
    } else {
      next = [...current, module];
    }

    return this.remoteSet(DOC_KEYS.CURRICULUM, next);
  }

  // ── Manual (with fetch-merge-save) ──

  async fetchManual(): Promise<ManualSection[]> {
    return this.remoteGet(DOC_KEYS.MANUAL, []);
  }

  async pushManual(manual: ManualSection[]): Promise<void> {
    await this.remoteSet(DOC_KEYS.MANUAL, manual);
  }

  async updateManualSection(section: ManualSection): Promise<boolean> {
    console.log(`[DB] updateManualSection: Fetching latest manual before merge...`);
    const current = await this.fetchManual();

    const existingIdx = current.findIndex(s => s.id === section.id);
    let next;
    if (existingIdx > -1) {
      next = current.map((s, i) => i === existingIdx ? section : s);
    } else {
      next = [...current, section];
    }

    return this.remoteSet(DOC_KEYS.MANUAL, next);
  }

  // ── Recipes (with fetch-merge-save) ──

  async fetchRecipes(): Promise<Recipe[]> {
    return this.remoteGet(DOC_KEYS.RECIPES, []);
  }

  async pushRecipes(recipes: Recipe[]): Promise<void> {
    await this.remoteSet(DOC_KEYS.RECIPES, recipes);
  }

  async updateRecipe(recipe: Recipe): Promise<boolean> {
    console.log(`[DB] updateRecipe: Fetching latest recipes before merge...`);
    const current = await this.fetchRecipes();

    const existingIdx = current.findIndex(r => r.id === recipe.id);
    let next;
    if (existingIdx > -1) {
      next = current.map((r, i) => i === existingIdx ? recipe : r);
    } else {
      next = [...current, recipe];
    }

    return this.remoteSet(DOC_KEYS.RECIPES, next);
  }

  async deleteRecipe(recipeId: string): Promise<boolean> {
    const current = await this.fetchRecipes();
    const next = current.filter(r => r.id !== recipeId);
    return this.remoteSet(DOC_KEYS.RECIPES, next);
  }

  async fetchDeposits(): Promise<CashDeposit[]> {
    return this.remoteGet(DOC_KEYS.DEPOSITS, []);
  }

  async pushDeposit(deposit: CashDeposit): Promise<boolean> {
    console.log(`[DB] pushDeposit START: id=${deposit.id}, storeId=${deposit.storeId}`);

    const all = await this.fetchDeposits();
    console.log(`[DB] pushDeposit: Fetched ${all.length} existing deposits`);

    const existingIdx = all.findIndex(d => d.id === deposit.id);
    let next;
    if (existingIdx > -1) {
      console.log(`[DB] pushDeposit: Updating existing deposit at index ${existingIdx}`);
      next = all.map((d, i) => i === existingIdx ? deposit : d);
    } else {
      console.log(`[DB] pushDeposit: Adding new deposit`);
      next = [deposit, ...all];
    }

    console.log(`[DB] pushDeposit: Saving ${next.length} total deposits`);
    const success = await this.remoteSet(DOC_KEYS.DEPOSITS, next);
    console.log(`[DB] pushDeposit END: success=${success}`);
    return success;
  }

  async fetchGoogleReviews(): Promise<GoogleReviewsData> {
    return this.remoteGet(DOC_KEYS.GOOGLE_REVIEWS, { trackedReviews: [], lastPolled: {} });
  }

  async pushGoogleReviews(data: GoogleReviewsData): Promise<boolean> {
    // Deduplicate by review ID before saving
    const uniqueMap = new Map(data.trackedReviews.map(r => [r.id, r]));
    data.trackedReviews = Array.from(uniqueMap.values());
    return this.remoteSet(DOC_KEYS.GOOGLE_REVIEWS, data);
  }

  // ── Order Attribution ──

  async fetchAttributedOrders(storeId?: string, startDate?: string, endDate?: string): Promise<AttributedOrder[]> {
    const allOrders = await this.remoteGet<AttributedOrder[]>(DOC_KEYS.ATTRIBUTED_ORDERS, []);

    // Filter by store and date range if provided
    let filtered = allOrders;

    if (storeId) {
      filtered = filtered.filter(o => o.storeId === storeId);
    }

    if (startDate) {
      const start = new Date(startDate);
      filtered = filtered.filter(o => new Date(o.openedAt) >= start);
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter(o => new Date(o.openedAt) <= end);
    }

    return filtered;
  }

  /**
   * Clear all attributed orders for a store (forces fresh re-attribution on next sync)
   */
  async clearAttributedOrders(storeId?: string): Promise<boolean> {
    if (storeId) {
      const existing = await this.remoteGet<AttributedOrder[]>(DOC_KEYS.ATTRIBUTED_ORDERS, []);
      const filtered = existing.filter(o => o.storeId !== storeId);
      console.log(`[DB] clearAttributedOrders: Cleared ${existing.length - filtered.length} orders for ${storeId}`);
      return this.remoteSet(DOC_KEYS.ATTRIBUTED_ORDERS, filtered);
    } else {
      console.log(`[DB] clearAttributedOrders: Clearing ALL orders`);
      return this.remoteSet(DOC_KEYS.ATTRIBUTED_ORDERS, []);
    }
  }

  async pushAttributedOrders(orders: AttributedOrder[]): Promise<boolean> {
    console.log(`[DB] pushAttributedOrders START: ${orders.length} new orders`);

    const existing = await this.remoteGet<AttributedOrder[]>(DOC_KEYS.ATTRIBUTED_ORDERS, []);
    console.log(`[DB] pushAttributedOrders: ${existing.length} existing orders`);

    // Merge: use order id + checkGuid as unique key to avoid duplicates
    const orderMap = new Map<string, AttributedOrder>();
    existing.forEach(o => orderMap.set(`${o.id}-${o.checkGuid}`, o));

    let newCount = 0;
    orders.forEach(o => {
      const key = `${o.id}-${o.checkGuid}`;
      if (!orderMap.has(key)) {
        newCount++;
      }
      orderMap.set(key, o);
    });

    const merged = Array.from(orderMap.values());

    // Sort by openedAt descending (newest first)
    merged.sort((a, b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime());

    // Keep only last 90 days of orders to prevent document bloat
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90);
    const pruned = merged.filter(o => new Date(o.openedAt) >= cutoff);

    if (pruned.length < merged.length) {
      console.log(`[DB] pushAttributedOrders: Pruned ${merged.length - pruned.length} orders older than 90 days`);
    }

    console.log(`[DB] pushAttributedOrders: Saving ${pruned.length} total orders (${newCount} new)`);
    const success = await this.remoteSet(DOC_KEYS.ATTRIBUTED_ORDERS, pruned);
    console.log(`[DB] pushAttributedOrders END: success=${success}`);
    return success;
  }

  // ── FCM Token Management ──

  async saveFCMToken(token: {
    userId: string;
    userEmail: string;
    storeId: string;
    token: string;
    createdAt: string;
    userAgent: string;
  }): Promise<boolean> {
    console.log(`[DB] saveFCMToken: Saving token for ${token.userEmail}`);
    const existing = await this.remoteGet<any[]>(DOC_KEYS.FCM_TOKENS, []);

    // Remove any existing token for this user on this device
    const filtered = existing.filter(t =>
      !(t.userId === token.userId && t.userAgent === token.userAgent)
    );

    // Add new token
    filtered.push(token);

    return this.remoteSet(DOC_KEYS.FCM_TOKENS, filtered);
  }

  async removeFCMToken(userId: string, token: string): Promise<boolean> {
    console.log(`[DB] removeFCMToken: Removing token for user ${userId}`);
    const existing = await this.remoteGet<any[]>(DOC_KEYS.FCM_TOKENS, []);
    const filtered = existing.filter(t => !(t.userId === userId && t.token === token));
    return this.remoteSet(DOC_KEYS.FCM_TOKENS, filtered);
  }

  async getManagerTokensForStore(storeId: string): Promise<any[]> {
    const allTokens = await this.remoteGet<any[]>(DOC_KEYS.FCM_TOKENS, []);
    return allTokens.filter(t => t.storeId === storeId);
  }

  async getAllFCMTokens(): Promise<any[]> {
    return this.remoteGet<any[]>(DOC_KEYS.FCM_TOKENS, []);
  }

  async getGoogleReviewsData(): Promise<{ trackedReviews: any[]; lastPolled: Record<string, string> }> {
    return this.remoteGet(DOC_KEYS.GOOGLE_REVIEWS, { trackedReviews: [], lastPolled: {} });
  }

  async getAttributedOrders(): Promise<any[]> {
    return this.remoteGet<any[]>(DOC_KEYS.ATTRIBUTED_ORDERS, []);
  }

  async globalSync(defaults: {
    users: User[],
    templates: ChecklistTemplate[],
    curriculum: TrainingModule[],
    manual: ManualSection[],
    recipes: Recipe[]
  }) {
    const [users, submissions, progress, templates, cloudCurriculum, manual, recipes, cloudVersion] = await Promise.all([
      this.fetchUsers(defaults.users),
      this.fetchSubmissions(),
      this.fetchProgress(),
      this.remoteGet(DOC_KEYS.TEMPLATES, defaults.templates),
      this.remoteGet(DOC_KEYS.CURRICULUM, defaults.curriculum),
      this.remoteGet(DOC_KEYS.MANUAL, defaults.manual),
      this.remoteGet(DOC_KEYS.RECIPES, defaults.recipes),
      this.remoteGet(DOC_KEYS.CURRICULUM_VERSION, 0)
    ]);

    // Check if we need to force update due to version change
    const needsVersionUpdate = cloudVersion < CURRICULUM_VERSION;
    if (needsVersionUpdate) {
      console.log(`[Firestore] globalSync: Curriculum version updated (${cloudVersion} → ${CURRICULUM_VERSION}), forcing full refresh`);
    }

    // Merge new modules from defaults that don't exist in cloud
    // This ensures new modules added to mockData.ts appear in the app
    const cloudModuleIds = new Set(cloudCurriculum.map((m: TrainingModule) => m.id));
    const newModules = defaults.curriculum.filter(m => !cloudModuleIds.has(m.id));

    // Update existing modules if:
    // 1. Version changed (force update all)
    // 2. Default has more lessons
    // 3. Lesson properties changed (type, videoUrl, title)
    const updatedModules = cloudCurriculum.map((cloudModule: TrainingModule) => {
      const defaultModule = defaults.curriculum.find(m => m.id === cloudModule.id);

      if (!defaultModule) return cloudModule;

      // Force update if version changed
      if (needsVersionUpdate) {
        console.log(`[Firestore] globalSync: Force updating module ${cloudModule.id} due to version change`);
        return defaultModule;
      }

      // Update if default has more lessons
      if (defaultModule.lessons.length > cloudModule.lessons.length) {
        console.log(`[Firestore] globalSync: Updating module ${cloudModule.id} with new lessons`);
        return defaultModule;
      }

      // Check if any lesson properties changed
      const hasLessonChanges = defaultModule.lessons.some((defaultLesson, idx) => {
        const cloudLesson = cloudModule.lessons[idx];
        if (!cloudLesson) return true; // New lesson added

        // Check critical properties that affect display
        return defaultLesson.type !== cloudLesson.type ||
               defaultLesson.videoUrl !== cloudLesson.videoUrl ||
               defaultLesson.title !== cloudLesson.title;
      });

      if (hasLessonChanges) {
        console.log(`[Firestore] globalSync: Updating module ${cloudModule.id} - lesson properties changed`);
        return defaultModule;
      }

      return cloudModule;
    });

    let curriculum = updatedModules;
    let needsCurriculumUpdate = false;

    if (newModules.length > 0) {
      console.log(`[Firestore] globalSync: Found ${newModules.length} new curriculum module(s), merging...`);
      curriculum = [...updatedModules, ...newModules];
      needsCurriculumUpdate = true;
    }

    // Check if any modules were updated
    const modulesUpdated = updatedModules.some((module, idx) => module !== cloudCurriculum[idx]);
    if (modulesUpdated) {
      needsCurriculumUpdate = true;
    }

    // Save curriculum and version if changes detected
    if (needsCurriculumUpdate || needsVersionUpdate) {
      console.log(`[Firestore] globalSync: Saving updated curriculum to Firebase`);
      await Promise.all([
        this.remoteSet(DOC_KEYS.CURRICULUM, curriculum),
        this.remoteSet(DOC_KEYS.CURRICULUM_VERSION, CURRICULUM_VERSION)
      ]);
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
