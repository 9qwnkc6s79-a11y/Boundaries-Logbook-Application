// Full Focus Planner - IndexedDB Storage Service
// Offline-first data persistence with full-text search support

import {
  PlannerState,
  UserSettings,
  AnnualGoal,
  QuarterlyGoal,
  GoalDetail,
  DailyPage,
  WeeklyPreview,
  WeeklyReview,
  QuarterlyPreview,
  QuarterlyReview,
  IdealWeek,
  DailyRitual,
  RitualTemplate,
  Project,
  Note,
  CalendarEvent,
  IndexEntry,
  Quarter,
  generateId,
  getCurrentQuarter,
} from '../types';

const DB_NAME = 'FullFocusPlannerDB';
const DB_VERSION = 1;

// Store names
const STORES = {
  SETTINGS: 'settings',
  ANNUAL_GOALS: 'annualGoals',
  QUARTERLY_GOALS: 'quarterlyGoals',
  GOAL_DETAILS: 'goalDetails',
  DAILY_PAGES: 'dailyPages',
  WEEKLY_PREVIEWS: 'weeklyPreviews',
  WEEKLY_REVIEWS: 'weeklyReviews',
  QUARTERLY_PREVIEWS: 'quarterlyPreviews',
  QUARTERLY_REVIEWS: 'quarterlyReviews',
  IDEAL_WEEKS: 'idealWeeks',
  RITUALS: 'rituals',
  RITUAL_TEMPLATES: 'ritualTemplates',
  PROJECTS: 'projects',
  NOTES: 'notes',
  CALENDAR_EVENTS: 'calendarEvents',
  INDEX_ENTRIES: 'indexEntries',
  SEARCH_INDEX: 'searchIndex',
};

// Default user settings
const getDefaultSettings = (): UserSettings => ({
  id: 'user-settings',
  theme: 'paper',
  fontSize: 'medium',
  fontFamily: 'serif',
  weekStartsOn: 0,
  defaultMorningRitualIds: [],
  defaultEveningRitualIds: [],
  workdayStart: '09:00',
  workdayEnd: '17:00',
  currentPlanningYear: new Date().getFullYear(),
  currentQuarter: getCurrentQuarter(),
  aiEnabled: false,
  aiApiKey: undefined,
  updatedAt: new Date().toISOString(),
});

// Default morning rituals
const getDefaultMorningRituals = (): DailyRitual[] => [
  { id: 'ritual-m1', title: 'Review goals', type: 'morning', order: 1, isActive: true, duration: 5 },
  { id: 'ritual-m2', title: 'Plan daily Big 3', type: 'morning', order: 2, isActive: true, duration: 5 },
  { id: 'ritual-m3', title: 'Check calendar', type: 'morning', order: 3, isActive: true, duration: 3 },
  { id: 'ritual-m4', title: 'Gratitude journaling', type: 'morning', order: 4, isActive: true, duration: 5 },
  { id: 'ritual-m5', title: 'Exercise/Movement', type: 'morning', order: 5, isActive: true, duration: 30 },
];

// Default evening rituals
const getDefaultEveningRituals = (): DailyRitual[] => [
  { id: 'ritual-e1', title: 'Review completed tasks', type: 'evening', order: 1, isActive: true, duration: 5 },
  { id: 'ritual-e2', title: 'Process inbox to zero', type: 'evening', order: 2, isActive: true, duration: 10 },
  { id: 'ritual-e3', title: 'Prepare tomorrow\'s tasks', type: 'evening', order: 3, isActive: true, duration: 5 },
  { id: 'ritual-e4', title: 'Daily reflection', type: 'evening', order: 4, isActive: true, duration: 5 },
  { id: 'ritual-e5', title: 'Reading', type: 'evening', order: 5, isActive: true, duration: 20 },
];

class PlannerDB {
  private db: IDBDatabase | null = null;
  private dbReady: Promise<IDBDatabase>;

  constructor() {
    this.dbReady = this.initDB();
  }

  private initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('IndexedDB error:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores with indexes
        if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
          db.createObjectStore(STORES.SETTINGS, { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains(STORES.ANNUAL_GOALS)) {
          const store = db.createObjectStore(STORES.ANNUAL_GOALS, { keyPath: 'id' });
          store.createIndex('year', 'year', { unique: false });
          store.createIndex('domain', 'domain', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.QUARTERLY_GOALS)) {
          const store = db.createObjectStore(STORES.QUARTERLY_GOALS, { keyPath: 'id' });
          store.createIndex('year', 'year', { unique: false });
          store.createIndex('quarter', 'quarter', { unique: false });
          store.createIndex('year_quarter', ['year', 'quarter'], { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.GOAL_DETAILS)) {
          const store = db.createObjectStore(STORES.GOAL_DETAILS, { keyPath: 'id' });
          store.createIndex('goalId', 'goalId', { unique: true });
        }

        if (!db.objectStoreNames.contains(STORES.DAILY_PAGES)) {
          const store = db.createObjectStore(STORES.DAILY_PAGES, { keyPath: 'id' });
          store.createIndex('date', 'date', { unique: true });
        }

        if (!db.objectStoreNames.contains(STORES.WEEKLY_PREVIEWS)) {
          const store = db.createObjectStore(STORES.WEEKLY_PREVIEWS, { keyPath: 'id' });
          store.createIndex('year_week', ['year', 'weekNumber'], { unique: true });
        }

        if (!db.objectStoreNames.contains(STORES.WEEKLY_REVIEWS)) {
          const store = db.createObjectStore(STORES.WEEKLY_REVIEWS, { keyPath: 'id' });
          store.createIndex('year_week', ['year', 'weekNumber'], { unique: true });
        }

        if (!db.objectStoreNames.contains(STORES.QUARTERLY_PREVIEWS)) {
          const store = db.createObjectStore(STORES.QUARTERLY_PREVIEWS, { keyPath: 'id' });
          store.createIndex('year_quarter', ['year', 'quarter'], { unique: true });
        }

        if (!db.objectStoreNames.contains(STORES.QUARTERLY_REVIEWS)) {
          const store = db.createObjectStore(STORES.QUARTERLY_REVIEWS, { keyPath: 'id' });
          store.createIndex('year_quarter', ['year', 'quarter'], { unique: true });
        }

        if (!db.objectStoreNames.contains(STORES.IDEAL_WEEKS)) {
          const store = db.createObjectStore(STORES.IDEAL_WEEKS, { keyPath: 'id' });
          store.createIndex('isActive', 'isActive', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.RITUALS)) {
          const store = db.createObjectStore(STORES.RITUALS, { keyPath: 'id' });
          store.createIndex('type', 'type', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.RITUAL_TEMPLATES)) {
          db.createObjectStore(STORES.RITUAL_TEMPLATES, { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains(STORES.PROJECTS)) {
          const store = db.createObjectStore(STORES.PROJECTS, { keyPath: 'id' });
          store.createIndex('status', 'status', { unique: false });
          store.createIndex('linkedGoalId', 'linkedGoalId', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.NOTES)) {
          const store = db.createObjectStore(STORES.NOTES, { keyPath: 'id' });
          store.createIndex('createdAt', 'createdAt', { unique: false });
          store.createIndex('isPinned', 'isPinned', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.CALENDAR_EVENTS)) {
          const store = db.createObjectStore(STORES.CALENDAR_EVENTS, { keyPath: 'id' });
          store.createIndex('date', 'date', { unique: false });
          store.createIndex('category', 'category', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.INDEX_ENTRIES)) {
          const store = db.createObjectStore(STORES.INDEX_ENTRIES, { keyPath: 'id' });
          store.createIndex('term', 'term', { unique: true });
        }

        if (!db.objectStoreNames.contains(STORES.SEARCH_INDEX)) {
          const store = db.createObjectStore(STORES.SEARCH_INDEX, { keyPath: 'id' });
          store.createIndex('type', 'type', { unique: false });
          store.createIndex('text', 'text', { unique: false });
        }
      };
    });
  }

  private async getDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    return this.dbReady;
  }

  // Generic CRUD operations
  private async getAll<T>(storeName: string): Promise<T[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  private async getById<T>(storeName: string, id: string): Promise<T | undefined> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async getByIndex<T>(storeName: string, indexName: string, value: IDBValidKey | IDBKeyRange): Promise<T[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  private async put<T>(storeName: string, item: T): Promise<T> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(item);
      request.onsuccess = () => resolve(item);
      request.onerror = () => reject(request.error);
    });
  }

  private async delete(storeName: string, id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async clear(storeName: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ===========================================
  // Settings
  // ===========================================
  async getSettings(): Promise<UserSettings> {
    const settings = await this.getById<UserSettings>(STORES.SETTINGS, 'user-settings');
    if (!settings) {
      const defaultSettings = getDefaultSettings();
      await this.put(STORES.SETTINGS, defaultSettings);
      return defaultSettings;
    }
    return settings;
  }

  async saveSettings(settings: UserSettings): Promise<UserSettings> {
    return this.put(STORES.SETTINGS, { ...settings, updatedAt: new Date().toISOString() });
  }

  // ===========================================
  // Annual Goals
  // ===========================================
  async getAnnualGoals(year?: number): Promise<AnnualGoal[]> {
    if (year) {
      return this.getByIndex<AnnualGoal>(STORES.ANNUAL_GOALS, 'year', year);
    }
    return this.getAll<AnnualGoal>(STORES.ANNUAL_GOALS);
  }

  async saveAnnualGoal(goal: AnnualGoal): Promise<AnnualGoal> {
    return this.put(STORES.ANNUAL_GOALS, { ...goal, updatedAt: new Date().toISOString() });
  }

  async deleteAnnualGoal(id: string): Promise<void> {
    return this.delete(STORES.ANNUAL_GOALS, id);
  }

  // ===========================================
  // Quarterly Goals
  // ===========================================
  async getQuarterlyGoals(year?: number, quarter?: Quarter): Promise<QuarterlyGoal[]> {
    if (year && quarter) {
      return this.getByIndex<QuarterlyGoal>(STORES.QUARTERLY_GOALS, 'year_quarter', [year, quarter]);
    }
    if (year) {
      return this.getByIndex<QuarterlyGoal>(STORES.QUARTERLY_GOALS, 'year', year);
    }
    return this.getAll<QuarterlyGoal>(STORES.QUARTERLY_GOALS);
  }

  async saveQuarterlyGoal(goal: QuarterlyGoal): Promise<QuarterlyGoal> {
    return this.put(STORES.QUARTERLY_GOALS, { ...goal, updatedAt: new Date().toISOString() });
  }

  async deleteQuarterlyGoal(id: string): Promise<void> {
    return this.delete(STORES.QUARTERLY_GOALS, id);
  }

  // ===========================================
  // Goal Details
  // ===========================================
  async getGoalDetails(): Promise<GoalDetail[]> {
    return this.getAll<GoalDetail>(STORES.GOAL_DETAILS);
  }

  async getGoalDetailByGoalId(goalId: string): Promise<GoalDetail | undefined> {
    const details = await this.getByIndex<GoalDetail>(STORES.GOAL_DETAILS, 'goalId', goalId);
    return details[0];
  }

  async saveGoalDetail(detail: GoalDetail): Promise<GoalDetail> {
    return this.put(STORES.GOAL_DETAILS, detail);
  }

  async deleteGoalDetail(id: string): Promise<void> {
    return this.delete(STORES.GOAL_DETAILS, id);
  }

  // ===========================================
  // Daily Pages
  // ===========================================
  async getDailyPages(): Promise<DailyPage[]> {
    return this.getAll<DailyPage>(STORES.DAILY_PAGES);
  }

  async getDailyPageByDate(date: string): Promise<DailyPage | undefined> {
    const pages = await this.getByIndex<DailyPage>(STORES.DAILY_PAGES, 'date', date);
    return pages[0];
  }

  async saveDailyPage(page: DailyPage): Promise<DailyPage> {
    return this.put(STORES.DAILY_PAGES, { ...page, updatedAt: new Date().toISOString() });
  }

  async deleteDailyPage(id: string): Promise<void> {
    return this.delete(STORES.DAILY_PAGES, id);
  }

  // ===========================================
  // Weekly Preview/Review
  // ===========================================
  async getWeeklyPreviews(year?: number): Promise<WeeklyPreview[]> {
    if (year) {
      const all = await this.getAll<WeeklyPreview>(STORES.WEEKLY_PREVIEWS);
      return all.filter(wp => wp.year === year);
    }
    return this.getAll<WeeklyPreview>(STORES.WEEKLY_PREVIEWS);
  }

  async getWeeklyPreview(year: number, weekNumber: number): Promise<WeeklyPreview | undefined> {
    const previews = await this.getByIndex<WeeklyPreview>(STORES.WEEKLY_PREVIEWS, 'year_week', [year, weekNumber]);
    return previews[0];
  }

  async saveWeeklyPreview(preview: WeeklyPreview): Promise<WeeklyPreview> {
    return this.put(STORES.WEEKLY_PREVIEWS, { ...preview, updatedAt: new Date().toISOString() });
  }

  async getWeeklyReviews(year?: number): Promise<WeeklyReview[]> {
    if (year) {
      const all = await this.getAll<WeeklyReview>(STORES.WEEKLY_REVIEWS);
      return all.filter(wr => wr.year === year);
    }
    return this.getAll<WeeklyReview>(STORES.WEEKLY_REVIEWS);
  }

  async getWeeklyReview(year: number, weekNumber: number): Promise<WeeklyReview | undefined> {
    const reviews = await this.getByIndex<WeeklyReview>(STORES.WEEKLY_REVIEWS, 'year_week', [year, weekNumber]);
    return reviews[0];
  }

  async saveWeeklyReview(review: WeeklyReview): Promise<WeeklyReview> {
    return this.put(STORES.WEEKLY_REVIEWS, review);
  }

  // ===========================================
  // Quarterly Preview/Review
  // ===========================================
  async getQuarterlyPreviews(year?: number): Promise<QuarterlyPreview[]> {
    if (year) {
      const all = await this.getAll<QuarterlyPreview>(STORES.QUARTERLY_PREVIEWS);
      return all.filter(qp => qp.year === year);
    }
    return this.getAll<QuarterlyPreview>(STORES.QUARTERLY_PREVIEWS);
  }

  async getQuarterlyPreview(year: number, quarter: Quarter): Promise<QuarterlyPreview | undefined> {
    const previews = await this.getByIndex<QuarterlyPreview>(STORES.QUARTERLY_PREVIEWS, 'year_quarter', [year, quarter]);
    return previews[0];
  }

  async saveQuarterlyPreview(preview: QuarterlyPreview): Promise<QuarterlyPreview> {
    return this.put(STORES.QUARTERLY_PREVIEWS, { ...preview, updatedAt: new Date().toISOString() });
  }

  async getQuarterlyReviews(year?: number): Promise<QuarterlyReview[]> {
    if (year) {
      const all = await this.getAll<QuarterlyReview>(STORES.QUARTERLY_REVIEWS);
      return all.filter(qr => qr.year === year);
    }
    return this.getAll<QuarterlyReview>(STORES.QUARTERLY_REVIEWS);
  }

  async getQuarterlyReview(year: number, quarter: Quarter): Promise<QuarterlyReview | undefined> {
    const reviews = await this.getByIndex<QuarterlyReview>(STORES.QUARTERLY_REVIEWS, 'year_quarter', [year, quarter]);
    return reviews[0];
  }

  async saveQuarterlyReview(review: QuarterlyReview): Promise<QuarterlyReview> {
    return this.put(STORES.QUARTERLY_REVIEWS, review);
  }

  // ===========================================
  // Ideal Weeks
  // ===========================================
  async getIdealWeeks(): Promise<IdealWeek[]> {
    return this.getAll<IdealWeek>(STORES.IDEAL_WEEKS);
  }

  async getActiveIdealWeek(): Promise<IdealWeek | undefined> {
    const active = await this.getByIndex<IdealWeek>(STORES.IDEAL_WEEKS, 'isActive', 1);
    return active[0];
  }

  async saveIdealWeek(week: IdealWeek): Promise<IdealWeek> {
    // If this week is being set as active, deactivate others
    if (week.isActive) {
      const allWeeks = await this.getIdealWeeks();
      for (const w of allWeeks) {
        if (w.id !== week.id && w.isActive) {
          await this.put(STORES.IDEAL_WEEKS, { ...w, isActive: false, updatedAt: new Date().toISOString() });
        }
      }
    }
    return this.put(STORES.IDEAL_WEEKS, { ...week, updatedAt: new Date().toISOString() });
  }

  async deleteIdealWeek(id: string): Promise<void> {
    return this.delete(STORES.IDEAL_WEEKS, id);
  }

  // ===========================================
  // Rituals
  // ===========================================
  async getRituals(): Promise<DailyRitual[]> {
    const rituals = await this.getAll<DailyRitual>(STORES.RITUALS);
    if (rituals.length === 0) {
      // Initialize with default rituals
      const defaultRituals = [...getDefaultMorningRituals(), ...getDefaultEveningRituals()];
      for (const ritual of defaultRituals) {
        await this.put(STORES.RITUALS, ritual);
      }
      return defaultRituals;
    }
    return rituals;
  }

  async getRitualsByType(type: DailyRitual['type']): Promise<DailyRitual[]> {
    return this.getByIndex<DailyRitual>(STORES.RITUALS, 'type', type);
  }

  async saveRitual(ritual: DailyRitual): Promise<DailyRitual> {
    return this.put(STORES.RITUALS, ritual);
  }

  async deleteRitual(id: string): Promise<void> {
    return this.delete(STORES.RITUALS, id);
  }

  async getRitualTemplates(): Promise<RitualTemplate[]> {
    return this.getAll<RitualTemplate>(STORES.RITUAL_TEMPLATES);
  }

  async saveRitualTemplate(template: RitualTemplate): Promise<RitualTemplate> {
    return this.put(STORES.RITUAL_TEMPLATES, template);
  }

  // ===========================================
  // Projects
  // ===========================================
  async getProjects(): Promise<Project[]> {
    return this.getAll<Project>(STORES.PROJECTS);
  }

  async getProjectsByStatus(status: Project['status']): Promise<Project[]> {
    return this.getByIndex<Project>(STORES.PROJECTS, 'status', status);
  }

  async getProjectsByGoal(goalId: string): Promise<Project[]> {
    return this.getByIndex<Project>(STORES.PROJECTS, 'linkedGoalId', goalId);
  }

  async saveProject(project: Project): Promise<Project> {
    return this.put(STORES.PROJECTS, { ...project, updatedAt: new Date().toISOString() });
  }

  async deleteProject(id: string): Promise<void> {
    return this.delete(STORES.PROJECTS, id);
  }

  // ===========================================
  // Notes
  // ===========================================
  async getNotes(): Promise<Note[]> {
    return this.getAll<Note>(STORES.NOTES);
  }

  async getNoteById(id: string): Promise<Note | undefined> {
    return this.getById<Note>(STORES.NOTES, id);
  }

  async saveNote(note: Note): Promise<Note> {
    return this.put(STORES.NOTES, { ...note, updatedAt: new Date().toISOString() });
  }

  async deleteNote(id: string): Promise<void> {
    return this.delete(STORES.NOTES, id);
  }

  // ===========================================
  // Calendar Events
  // ===========================================
  async getCalendarEvents(): Promise<CalendarEvent[]> {
    return this.getAll<CalendarEvent>(STORES.CALENDAR_EVENTS);
  }

  async getCalendarEventsByDate(date: string): Promise<CalendarEvent[]> {
    return this.getByIndex<CalendarEvent>(STORES.CALENDAR_EVENTS, 'date', date);
  }

  async getCalendarEventsByDateRange(startDate: string, endDate: string): Promise<CalendarEvent[]> {
    const allEvents = await this.getAll<CalendarEvent>(STORES.CALENDAR_EVENTS);
    return allEvents.filter(event => event.date >= startDate && event.date <= endDate);
  }

  async saveCalendarEvent(event: CalendarEvent): Promise<CalendarEvent> {
    return this.put(STORES.CALENDAR_EVENTS, event);
  }

  async deleteCalendarEvent(id: string): Promise<void> {
    return this.delete(STORES.CALENDAR_EVENTS, id);
  }

  // ===========================================
  // Index Entries
  // ===========================================
  async getIndexEntries(): Promise<IndexEntry[]> {
    return this.getAll<IndexEntry>(STORES.INDEX_ENTRIES);
  }

  async saveIndexEntry(entry: IndexEntry): Promise<IndexEntry> {
    return this.put(STORES.INDEX_ENTRIES, entry);
  }

  async deleteIndexEntry(id: string): Promise<void> {
    return this.delete(STORES.INDEX_ENTRIES, id);
  }

  // ===========================================
  // Full-Text Search
  // ===========================================
  async search(query: string): Promise<Array<{ type: string; id: string; title: string; snippet: string; date?: string }>> {
    const results: Array<{ type: string; id: string; title: string; snippet: string; date?: string }> = [];
    const lowerQuery = query.toLowerCase();

    // Search Daily Pages
    const dailyPages = await this.getDailyPages();
    for (const page of dailyPages) {
      const searchText = [
        page.topPriority,
        ...page.dailyBig3.map(t => t.title),
        ...(page.tasks || []).map(t => t.title),
        ...page.appointments.map(a => a.title),
        ...page.gratitude,
        ...(page.wins || []),
        page.dailyReflection,
        page.notes,
      ].filter(Boolean).join(' ').toLowerCase();

      if (searchText.includes(lowerQuery)) {
        results.push({
          type: 'daily_page',
          id: page.id,
          title: `Daily Page - ${page.date}`,
          snippet: this.extractSnippet(searchText, lowerQuery),
          date: page.date,
        });
      }
    }

    // Search Goals
    const annualGoals = await this.getAnnualGoals();
    for (const goal of annualGoals) {
      const searchText = [goal.title, goal.description, ...goal.keyMotivations].filter(Boolean).join(' ').toLowerCase();
      if (searchText.includes(lowerQuery)) {
        results.push({
          type: 'annual_goal',
          id: goal.id,
          title: goal.title,
          snippet: this.extractSnippet(searchText, lowerQuery),
        });
      }
    }

    const quarterlyGoals = await this.getQuarterlyGoals();
    for (const goal of quarterlyGoals) {
      const searchText = [goal.title, goal.description, ...goal.keyMotivations, ...goal.nextSteps].filter(Boolean).join(' ').toLowerCase();
      if (searchText.includes(lowerQuery)) {
        results.push({
          type: 'quarterly_goal',
          id: goal.id,
          title: goal.title,
          snippet: this.extractSnippet(searchText, lowerQuery),
        });
      }
    }

    // Search Notes
    const notes = await this.getNotes();
    for (const note of notes) {
      const searchText = [note.title, note.content, ...note.tags].filter(Boolean).join(' ').toLowerCase();
      if (searchText.includes(lowerQuery)) {
        results.push({
          type: 'note',
          id: note.id,
          title: note.title,
          snippet: this.extractSnippet(searchText, lowerQuery),
          date: note.createdAt,
        });
      }
    }

    // Search Projects
    const projects = await this.getProjects();
    for (const project of projects) {
      const searchText = [
        project.title,
        project.description,
        project.notes,
        ...project.milestones.map(m => m.title),
        ...project.tasks.map(t => t.title),
      ].filter(Boolean).join(' ').toLowerCase();

      if (searchText.includes(lowerQuery)) {
        results.push({
          type: 'project',
          id: project.id,
          title: project.title,
          snippet: this.extractSnippet(searchText, lowerQuery),
        });
      }
    }

    return results;
  }

  private extractSnippet(text: string, query: string, contextLength: number = 100): string {
    const index = text.indexOf(query);
    if (index === -1) return text.substring(0, contextLength) + '...';

    const start = Math.max(0, index - contextLength / 2);
    const end = Math.min(text.length, index + query.length + contextLength / 2);

    let snippet = text.substring(start, end);
    if (start > 0) snippet = '...' + snippet;
    if (end < text.length) snippet = snippet + '...';

    return snippet;
  }

  // ===========================================
  // Full State Export/Import
  // ===========================================
  async exportAllData(): Promise<PlannerState> {
    const [
      settings,
      annualGoals,
      quarterlyGoals,
      goalDetails,
      dailyPages,
      weeklyPreviews,
      weeklyReviews,
      quarterlyPreviews,
      quarterlyReviews,
      idealWeeks,
      rituals,
      ritualTemplates,
      projects,
      notes,
      calendarEvents,
      indexEntries,
    ] = await Promise.all([
      this.getSettings(),
      this.getAnnualGoals(),
      this.getQuarterlyGoals(),
      this.getGoalDetails(),
      this.getDailyPages(),
      this.getWeeklyPreviews(),
      this.getWeeklyReviews(),
      this.getQuarterlyPreviews(),
      this.getQuarterlyReviews(),
      this.getIdealWeeks(),
      this.getRituals(),
      this.getRitualTemplates(),
      this.getProjects(),
      this.getNotes(),
      this.getCalendarEvents(),
      this.getIndexEntries(),
    ]);

    return {
      settings,
      annualGoals,
      quarterlyGoals,
      goalDetails,
      dailyPages,
      weeklyPreviews,
      weeklyReviews,
      quarterlyPreviews,
      quarterlyReviews,
      idealWeeks,
      rituals,
      ritualTemplates,
      projects,
      notes,
      calendarEvents,
      indexEntries,
    };
  }

  async importAllData(state: Partial<PlannerState>): Promise<void> {
    if (state.settings) await this.saveSettings(state.settings);

    if (state.annualGoals) {
      for (const goal of state.annualGoals) {
        await this.saveAnnualGoal(goal);
      }
    }

    if (state.quarterlyGoals) {
      for (const goal of state.quarterlyGoals) {
        await this.saveQuarterlyGoal(goal);
      }
    }

    if (state.goalDetails) {
      for (const detail of state.goalDetails) {
        await this.saveGoalDetail(detail);
      }
    }

    if (state.dailyPages) {
      for (const page of state.dailyPages) {
        await this.saveDailyPage(page);
      }
    }

    if (state.weeklyPreviews) {
      for (const preview of state.weeklyPreviews) {
        await this.saveWeeklyPreview(preview);
      }
    }

    if (state.weeklyReviews) {
      for (const review of state.weeklyReviews) {
        await this.saveWeeklyReview(review);
      }
    }

    if (state.quarterlyPreviews) {
      for (const preview of state.quarterlyPreviews) {
        await this.saveQuarterlyPreview(preview);
      }
    }

    if (state.quarterlyReviews) {
      for (const review of state.quarterlyReviews) {
        await this.saveQuarterlyReview(review);
      }
    }

    if (state.idealWeeks) {
      for (const week of state.idealWeeks) {
        await this.saveIdealWeek(week);
      }
    }

    if (state.rituals) {
      for (const ritual of state.rituals) {
        await this.saveRitual(ritual);
      }
    }

    if (state.ritualTemplates) {
      for (const template of state.ritualTemplates) {
        await this.saveRitualTemplate(template);
      }
    }

    if (state.projects) {
      for (const project of state.projects) {
        await this.saveProject(project);
      }
    }

    if (state.notes) {
      for (const note of state.notes) {
        await this.saveNote(note);
      }
    }

    if (state.calendarEvents) {
      for (const event of state.calendarEvents) {
        await this.saveCalendarEvent(event);
      }
    }

    if (state.indexEntries) {
      for (const entry of state.indexEntries) {
        await this.saveIndexEntry(entry);
      }
    }
  }

  // Clear all data (for reset)
  async clearAllData(): Promise<void> {
    const storeNames = Object.values(STORES);
    for (const storeName of storeNames) {
      await this.clear(storeName);
    }
  }
}

// Singleton instance
export const db = new PlannerDB();
