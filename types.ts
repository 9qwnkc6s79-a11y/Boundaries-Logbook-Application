// Full Focus Planner - TypeScript Type Definitions

// ============================================
// CORE ENUMS
// ============================================

export enum GoalStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  ABANDONED = 'ABANDONED'
}

export enum TaskStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  DEFERRED = 'DEFERRED',
  DELETED = 'DELETED'
}

export enum Quarter {
  Q1 = 'Q1',
  Q2 = 'Q2',
  Q3 = 'Q3',
  Q4 = 'Q4'
}

export enum LifeDomain {
  SELF = 'Self',
  RELATIONSHIPS = 'Relationships',
  WORK = 'Work',
  HEALTH = 'Health',
  FINANCES = 'Finances',
  HOBBIES = 'Hobbies',
  SPIRITUALITY = 'Spirituality',
  PERSONAL_GROWTH = 'Personal Growth'
}

export enum GoalType {
  ACHIEVEMENT = 'Achievement', // One-time accomplishment
  HABIT = 'Habit' // Ongoing behavior
}

// ============================================
// ANNUAL GOALS
// ============================================

export interface AnnualGoal {
  id: string;
  year: number;
  title: string;
  description?: string;
  domain: LifeDomain;
  type: GoalType;
  status: GoalStatus;
  keyMotivations: string[]; // Why this goal matters
  createdAt: string;
  updatedAt: string;
}

// ============================================
// QUARTERLY GOALS (Big 3)
// ============================================

export interface QuarterlyGoal {
  id: string;
  year: number;
  quarter: Quarter;
  annualGoalId?: string; // Links to parent annual goal
  title: string;
  description?: string;
  domain: LifeDomain;
  type: GoalType;
  status: GoalStatus;
  rank: 1 | 2 | 3; // Big 3 ranking
  keyMotivations: string[];
  nextSteps: string[]; // Immediate action items
  weeklyTargets: WeeklyTarget[];
  streakDays?: number; // For habit goals
  createdAt: string;
  updatedAt: string;
}

export interface WeeklyTarget {
  id: string;
  goalId: string;
  weekNumber: number; // 1-13 for the quarter
  target: string;
  completed: boolean;
  notes?: string;
}

// ============================================
// GOAL DETAIL
// ============================================

export interface GoalDetail {
  id: string;
  goalId: string; // Links to QuarterlyGoal
  smpiBreakdown: {
    specific: string;
    measurable: string;
    actionable: string; // Sometimes called "Achievable"
    risky: string; // Stretch goal aspect
    timeBound: string;
  };
  keyMotivations: string[];
  nextSteps: GoalNextStep[];
  celebrationPlan?: string;
  potentialObstacles: string[];
  strategies: string[];
  weeklyTargets: WeeklyTarget[];
  progressNotes: ProgressNote[];
}

export interface GoalNextStep {
  id: string;
  description: string;
  completed: boolean;
  dueDate?: string;
}

export interface ProgressNote {
  id: string;
  date: string;
  content: string;
}

// ============================================
// DAILY PAGE
// ============================================

export interface DailyPage {
  id: string;
  date: string; // ISO date string YYYY-MM-DD

  // Top Section
  topPriority?: string; // The ONE thing
  dailyBig3: DailyBig3Task[];

  // Schedule
  appointments: Appointment[];

  // Other Tasks
  tasks: Task[];

  // Rituals
  morningRituals: RitualCheck[];
  eveningRituals: RitualCheck[];

  // Reflection
  gratitude: string[];
  wins: string[]; // Daily wins/accomplishments
  dailyReflection?: string;

  // Extended Notes (unlimited)
  notes: string;

  // Metadata
  createdAt: string;
  updatedAt: string;
}

export interface DailyBig3Task {
  id: string;
  rank: 1 | 2 | 3;
  title: string;
  completed: boolean;
  linkedGoalId?: string; // Optional link to quarterly goal
  notes?: string;
}

export interface Appointment {
  id: string;
  time: string; // HH:MM format
  endTime?: string;
  title: string;
  location?: string;
  notes?: string;
  completed?: boolean;
}

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  priority?: 'high' | 'medium' | 'low';
  dueDate?: string;
  linkedGoalId?: string;
  linkedProjectId?: string;
  notes?: string;
  createdAt: string;
}

export interface RitualCheck {
  ritualId: string;
  completed: boolean;
  notes?: string;
}

// ============================================
// WEEKLY PLANNING
// ============================================

export interface WeeklyPreview {
  id: string;
  year: number;
  weekNumber: number;
  startDate: string; // Monday of the week

  // Review of quarterly goals
  quarterlyGoalProgress: {
    goalId: string;
    weeklyTarget: string;
    progressNotes: string;
  }[];

  // Weekly Big 3
  weeklyBig3: {
    rank: 1 | 2 | 3;
    title: string;
    linkedGoalId?: string;
  }[];

  // Key dates and deadlines
  keyDates: {
    date: string;
    event: string;
  }[];

  // Self-care planning
  selfCarePlan?: string;

  // Notes
  notes: string;

  createdAt: string;
  updatedAt: string;
}

export interface WeeklyReview {
  id: string;
  year: number;
  weekNumber: number;

  // Wins
  biggestWins: string[];

  // What got done
  accomplishments: string[];

  // What didn't get done
  incomplete: string[];

  // Lessons learned
  lessonsLearned: string[];

  // Gratitude
  gratitude: string[];

  // Score (1-10)
  overallScore?: number;

  // Planning for next week
  nextWeekFocus?: string;

  notes: string;
  createdAt: string;
}

// ============================================
// QUARTERLY PLANNING
// ============================================

export interface QuarterlyPreview {
  id: string;
  year: number;
  quarter: Quarter;

  // Life domains review
  domainReflections: {
    domain: LifeDomain;
    currentState: string;
    desiredState: string;
    rating: number; // 1-10
  }[];

  // Goals for the quarter (Big 3)
  quarterlyGoalIds: string[];

  // Key dates
  keyDates: {
    date: string;
    event: string;
  }[];

  // Focus areas
  focusAreas: string[];

  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuarterlyReview {
  id: string;
  year: number;
  quarter: Quarter;

  // Goal review
  goalReviews: {
    goalId: string;
    achieved: boolean;
    lessonsLearned: string;
    celebration?: string;
  }[];

  // Overall reflection
  wins: string[];
  challenges: string[];
  lessonsLearned: string[];

  // Life domain assessment
  domainAssessment: {
    domain: LifeDomain;
    rating: number;
    notes: string;
  }[];

  notes: string;
  createdAt: string;
}

// ============================================
// IDEAL WEEK
// ============================================

export interface IdealWeek {
  id: string;
  name: string; // e.g., "Default", "Summer Schedule", "Project Crunch"
  isActive: boolean;

  // Time blocks for each day
  blocks: IdealWeekBlock[];

  createdAt: string;
  updatedAt: string;
}

export interface IdealWeekBlock {
  id: string;
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday
  startTime: string; // HH:MM
  endTime: string;
  title: string;
  category: 'deep_work' | 'meetings' | 'self_care' | 'admin' | 'personal' | 'buffer' | 'other';
  color?: string;
  notes?: string;
}

// ============================================
// DAILY RITUALS
// ============================================

export interface DailyRitual {
  id: string;
  title: string;
  type: 'morning' | 'evening' | 'workday_startup' | 'workday_shutdown';
  order: number;
  isActive: boolean;
  description?: string;
  duration?: number; // in minutes
}

export interface RitualTemplate {
  id: string;
  name: string;
  rituals: DailyRitual[];
  isDefault: boolean;
  createdAt: string;
}

// ============================================
// PROJECT TRACKER
// ============================================

export interface Project {
  id: string;
  title: string;
  description?: string;
  status: 'active' | 'on_hold' | 'completed' | 'archived';
  linkedGoalId?: string;
  startDate?: string;
  targetDate?: string;
  completedDate?: string;

  // Milestones
  milestones: ProjectMilestone[];

  // Tasks
  tasks: ProjectTask[];

  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMilestone {
  id: string;
  title: string;
  targetDate?: string;
  completed: boolean;
  completedDate?: string;
}

export interface ProjectTask {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: string;
  completedDate?: string;
  notes?: string;
}

// ============================================
// NOTES & INDEX
// ============================================

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  linkedGoalId?: string;
  linkedProjectId?: string;
  linkedDate?: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IndexEntry {
  id: string;
  term: string;
  references: {
    type: 'daily_page' | 'goal' | 'project' | 'note' | 'weekly' | 'quarterly';
    id: string;
    pageNumber?: number;
    description: string;
  }[];
}

// ============================================
// CALENDAR
// ============================================

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  endDate?: string;
  isAllDay: boolean;
  time?: string;
  endTime?: string;
  category: 'deadline' | 'event' | 'reminder' | 'holiday' | 'milestone';
  color?: string;
  linkedGoalId?: string;
  linkedProjectId?: string;
  notes?: string;
  recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    endDate?: string;
  };
}

// ============================================
// USER SETTINGS & PREFERENCES
// ============================================

export interface UserSettings {
  id: string;

  // Display
  theme: 'light' | 'dark' | 'sepia' | 'paper';
  fontSize: 'small' | 'medium' | 'large';
  fontFamily: 'serif' | 'sans-serif' | 'handwriting';

  // Week settings
  weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday, 1 = Monday

  // Default rituals
  defaultMorningRitualIds: string[];
  defaultEveningRitualIds: string[];

  // Work hours
  workdayStart: string; // HH:MM
  workdayEnd: string;

  // Notifications (for future use)
  reminderTime?: string;

  // Current year for planning
  currentPlanningYear: number;
  currentQuarter: Quarter;

  // AI Features
  aiEnabled: boolean;
  aiApiKey?: string; // Google AI API key for Gemini

  updatedAt: string;
}

// ============================================
// APP STATE
// ============================================

export interface PlannerState {
  settings: UserSettings;
  annualGoals: AnnualGoal[];
  quarterlyGoals: QuarterlyGoal[];
  goalDetails: GoalDetail[];
  dailyPages: DailyPage[];
  weeklyPreviews: WeeklyPreview[];
  weeklyReviews: WeeklyReview[];
  quarterlyPreviews: QuarterlyPreview[];
  quarterlyReviews: QuarterlyReview[];
  idealWeeks: IdealWeek[];
  rituals: DailyRitual[];
  ritualTemplates: RitualTemplate[];
  projects: Project[];
  notes: Note[];
  calendarEvents: CalendarEvent[];
  indexEntries: IndexEntry[];
}

// ============================================
// AI FEATURES
// ============================================

export interface AIOrganizationSuggestion {
  id: string;
  type: 'task_grouping' | 'goal_alignment' | 'time_blocking' | 'priority_adjustment' | 'note_categorization';
  title: string;
  description: string;
  actionItems: string[];
  relatedIds: string[];
  confidence: number;
  createdAt: string;
  dismissed: boolean;
  applied: boolean;
}

export interface AISearchResult {
  type: 'goal' | 'task' | 'note' | 'project' | 'daily_page';
  id: string;
  title: string;
  snippet: string;
  relevanceScore: number;
  date?: string;
}

// ============================================
// UTILITY TYPES
// ============================================

export type ViewType =
  | 'dashboard'
  | 'annual_goals'
  | 'quarterly_goals'
  | 'goal_detail'
  | 'daily_page'
  | 'weekly_preview'
  | 'weekly_review'
  | 'quarterly_preview'
  | 'quarterly_review'
  | 'ideal_week'
  | 'rituals'
  | 'projects'
  | 'project_detail'
  | 'calendar'
  | 'notes'
  | 'note_detail'
  | 'search'
  | 'settings'
  | 'index';

export interface NavigationState {
  currentView: ViewType;
  selectedDate?: string;
  selectedGoalId?: string;
  selectedProjectId?: string;
  selectedNoteId?: string;
  selectedWeek?: number;
  selectedYear?: number;
  selectedQuarter?: Quarter;
}

// Helper function to generate unique IDs
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Helper to get current date in YYYY-MM-DD format
export const getTodayString = (): string => {
  return new Date().toISOString().split('T')[0];
};

// Helper to get current quarter
export const getCurrentQuarter = (): Quarter => {
  const month = new Date().getMonth();
  if (month < 3) return Quarter.Q1;
  if (month < 6) return Quarter.Q2;
  if (month < 9) return Quarter.Q3;
  return Quarter.Q4;
};

// Helper to get week number
export const getWeekNumber = (date: Date): number => {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  return Math.ceil((days + startOfYear.getDay() + 1) / 7);
};
