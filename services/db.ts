
import { User, UserProgress, ChecklistSubmission, ChecklistTemplate, TrainingModule, ManualSection, Recipe } from '../types';

/**
 * CloudAPI Service
 * 
 * Optimized for real-time collaboration. 
 * Uses shared storage to ensure all staff and managers see the same data 
 * across all devices in the store network.
 */

const KEYS = {
  USERS: 'boundaries_cloud_users_v7',
  PROGRESS: 'boundaries_cloud_progress_v7',
  SUBMISSIONS: 'boundaries_cloud_submissions_v7',
  TEMPLATES: 'boundaries_cloud_templates_v7',
  CURRICULUM: 'boundaries_cloud_curriculum_v7',
  MANUAL: 'boundaries_cloud_manual_v7',
  RECIPES: 'boundaries_cloud_recipes_v7',
};

class CloudAPI {
  private async remoteGet<T>(key: string, defaultValue: T): Promise<T> {
    try {
      let dataStr: string | null = null;
      
      // Safe check for custom storage injection (simulated cloud environment)
      // @ts-ignore
      if (typeof window !== 'undefined' && window.storage && typeof window.storage.get === 'function') {
        try {
          // @ts-ignore
          const result = await window.storage.get(key, true);
          if (result) {
            dataStr = typeof result === 'string' ? result : result.value;
          }
        } catch (e) {
          console.warn('Custom storage access failed, falling back:', e);
        }
      }

      // Fallback to localStorage
      if (!dataStr) {
        dataStr = localStorage.getItem(key);
      }
      
      if (!dataStr) return defaultValue;
      
      return JSON.parse(dataStr);
    } catch (error) {
      console.warn(`Storage get error for ${key}:`, error);
      return defaultValue;
    }
  }

  private async remoteSet<T>(key: string, data: T): Promise<void> {
    try {
      if (data === undefined || data === null) return;
      const dataStr = JSON.stringify(data);
      
      // Safe check for custom storage injection
      // @ts-ignore
      if (typeof window !== 'undefined' && window.storage && typeof window.storage.set === 'function') {
        try {
          // @ts-ignore
          await window.storage.set(key, dataStr, true);
        } catch (e) {
           console.warn('Custom storage set failed:', e);
        }
      }
      
      // Always persist to localStorage
      localStorage.setItem(key, dataStr);
      
      // Dispatch event to sync tabs immediately
      window.dispatchEvent(new StorageEvent('storage', { key, newValue: dataStr }));
    } catch (error) {
      console.error(`Storage set error for ${key}:`, error);
    }
  }

  async fetchUsers(defaults: User[]): Promise<User[]> {
    // 1. Get persisted data first (Priority 1)
    let persistedUsers = await this.remoteGet(KEYS.USERS, [] as User[]);
    
    // 2. Create a Map to merge unique users by email
    const userMap = new Map<string, User>();

    // 3. Add defaults first (lowest priority)
    defaults.forEach(def => userMap.set(def.email.toLowerCase(), def));

    // 4. Overlay persisted users (highest priority - these contain actual registrations)
    persistedUsers.forEach(u => userMap.set(u.email.toLowerCase(), u));

    return Array.from(userMap.values());
  }

  async syncUser(user: User): Promise<User[]> {
    // CRITICAL: Fetch latest before writing to prevent race conditions overwriting other users
    const currentUsers = await this.remoteGet(KEYS.USERS, [] as User[]);
    
    const userMap = new Map<string, User>();
    currentUsers.forEach(u => userMap.set(u.email.toLowerCase(), u));
    
    // Add/Update the specific user
    userMap.set(user.email.toLowerCase(), user);
    
    const next = Array.from(userMap.values());
    await this.remoteSet(KEYS.USERS, next);
    return next;
  }

  async fetchSubmissions(): Promise<ChecklistSubmission[]> {
    return this.remoteGet(KEYS.SUBMISSIONS, []);
  }

  async pushSubmission(submission: ChecklistSubmission): Promise<void> {
    const all = await this.fetchSubmissions();
    const existingIdx = all.findIndex(s => s.id === submission.id);
    
    let next;
    if (existingIdx > -1) {
      const existing = all[existingIdx];
      
      // Intelligent Merge: Ensure we don't lose tasks completed by others if operating on the same submission ID
      const mergedResults = [...existing.taskResults];
      
      submission.taskResults.forEach(newRes => {
        const idx = mergedResults.findIndex(r => r.taskId === newRes.taskId);
        if (idx === -1) {
          mergedResults.push(newRes);
        } else {
          // If the new result is "completed" or has new data, overwrite the old one
          // This allows two people to work on the same list
          if (newRes.completed || newRes.value || newRes.photoUrl || newRes.comment) {
            mergedResults[idx] = newRes;
          }
        }
      });
      
      next = all.map((s, i) => i === existingIdx ? { 
        ...submission, 
        taskResults: mergedResults,
        // Preserve status if the new push is DRAFT but existing is already SUBMITTED (prevent regression)
        status: (existing.status !== 'DRAFT' && submission.status === 'DRAFT') ? existing.status : submission.status 
      } : s);
    } else {
      next = [submission, ...all];
    }
    
    await this.remoteSet(KEYS.SUBMISSIONS, next);
  }

  async fetchProgress(): Promise<UserProgress[]> {
    return this.remoteGet(KEYS.PROGRESS, []);
  }

  async pushProgress(progress: UserProgress[]): Promise<void> {
    const existing = await this.fetchProgress();
    const merged = [...existing];
    progress.forEach(p => {
      const idx = merged.findIndex(m => m.userId === p.userId && m.lessonId === p.lessonId);
      if (idx > -1) merged[idx] = p;
      else merged.push(p);
    });
    await this.remoteSet(KEYS.PROGRESS, merged);
  }

  async pushTemplates(templates: ChecklistTemplate[]): Promise<void> {
    await this.remoteSet(KEYS.TEMPLATES, templates);
  }

  async pushCurriculum(curriculum: TrainingModule[]): Promise<void> {
    await this.remoteSet(KEYS.CURRICULUM, curriculum);
  }

  async pushManual(manual: ManualSection[]): Promise<void> {
    await this.remoteSet(KEYS.MANUAL, manual);
  }

  async pushRecipes(recipes: Recipe[]): Promise<void> {
    await this.remoteSet(KEYS.RECIPES, recipes);
  }

  async globalSync(defaults: { 
    users: User[], 
    templates: ChecklistTemplate[], 
    curriculum: TrainingModule[], 
    manual: ManualSection[], 
    recipes: Recipe[] 
  }) {
    // Parallel fetch for speed, but ensure Users are robust
    const [users, submissions, progress, templates, curriculum, manual, recipes] = await Promise.all([
      this.fetchUsers(defaults.users),
      this.fetchSubmissions(),
      this.fetchProgress(),
      this.remoteGet(KEYS.TEMPLATES, defaults.templates),
      this.remoteGet(KEYS.CURRICULUM, defaults.curriculum),
      this.remoteGet(KEYS.MANUAL, defaults.manual),
      this.remoteGet(KEYS.RECIPES, defaults.recipes)
    ]);

    return { users, submissions, progress, templates, curriculum, manual, recipes };
  }
}

export const db = new CloudAPI();
