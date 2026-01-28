
export enum UserRole {
  TRAINEE = 'TRAINEE',
  TRAINER = 'TRAINER',
  MANAGER = 'MANAGER',
  ADMIN = 'ADMIN'
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  storeId: string;
}

export interface Store {
  id: string;
  name: string;
}

export interface ManualSection {
  id: string;
  number: number;
  title: string;
  content: string;
  isPlaceholder?: boolean;
}

export interface ChecklistItem {
  id: string;
  title: string;
  description?: string;
  requiresPhoto?: boolean;
  examplePhotoUrl?: string; // Reference photo showing what the result should look like
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  type: 'CONTENT' | 'VIDEO' | 'PRACTICE' | 'QUIZ' | 'SIGN_OFF' | 'FILE_UPLOAD';
  content?: string;
  videoUrl?: string;
  durationMinutes?: number;
  quizQuestions?: QuizQuestion[];
  signOffRequired?: boolean;
  fileLabel?: string;
  checklistItems?: ChecklistItem[]; // For PRACTICE lessons with checkable items
  requiredWatchPercentage?: number; // Minimum % of video required to watch (default 80)
}

export interface QuizQuestion {
  id: string;
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SELECT_ALL';
  question: string;
  options?: string[];
  correctAnswers: string[];
  explanation?: string; // Why this answer is correct / what trainees should know
}

export interface TrainingModule {
  id: string;
  title: string;
  description: string;
  category: 'ONBOARDING' | 'CONTINUED' | 'BARISTA_SKILLS';
  lessons: Lesson[];
}

export interface PracticeSubmission {
  id: string;
  lessonId: string;
  userId: string;
  submittedAt: string;
  checklistCompleted: string[];
  checklistPhotos: Record<string, string>;
  managerFeedback?: string; // Optional feedback from manager
  managerRating?: number; // 1-5 star rating
}

export interface VideoProgress {
  lessonId: string;
  userId: string;
  watchedSeconds: number;
  totalSeconds: number;
  lastWatchedAt: string;
  completed: boolean;
}

export interface UserProgress {
  userId: string;
  lessonId: string;
  status: 'LOCKED' | 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  score?: number;
  signedOffBy?: string;
  completedAt?: string;
  fileUrl?: string;
  fileName?: string;
  checklistCompleted?: string[]; // IDs of completed checklist items (latest submission)
  checklistPhotos?: Record<string, string>; // Photos for checklist items (latest submission)
  practiceSubmissions?: PracticeSubmission[]; // History of all practice attempts
  videoProgress?: VideoProgress; // Video watch tracking
  attemptCount?: number; // Number of times lesson was attempted
  lastAttemptDate?: string; // Date of most recent attempt
}

export interface ChecklistTask {
  id: string;
  title: string;
  requiresPhoto: boolean;
  requiredPhotos?: number; // Number of photos required (1 if requiresPhoto is true and this is not set)
  requiresValue?: string;
  isCritical?: boolean;
}

export interface ChecklistTemplate {
  id: string;
  name: string;
  storeId: string;
  type: 'OPENING' | 'SHIFT_CHANGE' | 'CLOSING' | 'WEEKLY' | 'MONTHLY';
  deadlineHour: number; // 24h format (e.g., 7 for 7am, 21 for 9pm)
  unlockHour: number; // 24h format - when the checklist rolls over to the current calendar day
  tasks: ChecklistTask[];
}

export interface ChecklistSubmission {
  id: string;
  userId: string; 
  storeId: string;
  templateId: string;
  date: string; // ISO string for the specific "target date" this checklist covers
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';
  submittedAt?: string; // Actual time the user pressed "Finalize"
  taskResults: {
    taskId: string;
    completed: boolean;
    photoUrl?: string;
    photoUrls?: string[]; // Support for multiple photos
    value?: string;
    comment?: string;
    completedByUserId: string;
    completedAt: string;
    aiFlagged?: boolean;
    aiReason?: string;
    managerOverride?: boolean; // Manager approved despite AI flag
    overrideBy?: string; // Manager user ID who approved
    overrideAt?: string; // Timestamp of override
  }[];
  managerNotes?: string;
}

export interface Recipe {
  id: string;
  title: string;
  category: string; // e.g. "Espresso", "Lemonades", "Seasonal"
  type: 'ESPRESSO' | 'GRID' | 'BATCH' | 'STANDARD';

  // Espresso Stats
  dose?: string;
  yield?: string;
  time?: string;

  // Grid Data (for sizing charts)
  gridColumns?: string[];
  gridRows?: { label: string; values: string[] }[];

  // Batch / Standard Data
  ingredients?: { name: string; quantity: string }[];
  steps?: string[];

  notes?: string;
  lastUpdated?: string;
}

// Toast POS Integration Types
export interface ToastEmployee {
  guid: string;
  entityId: string;
  firstName: string;
  lastName: string;
  email?: string;
  externalEmployeeId?: string;
  chosenName?: string;
  deleted: boolean;
}

export interface ToastTimeEntry {
  employeeGuid: string;
  employeeName: string;
  jobName: string;
  inDate: string; // ISO timestamp
  outDate?: string; // ISO timestamp (undefined if still clocked in)
  regularHours: number;
  overtimeHours: number;
  totalHours: number;
  deleted: boolean;
}

export interface ToastLaborEntry {
  employeeGuid: string;
  employeeName: string;
  jobName: string;
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  shifts: number;
}

export interface ToastSalesData {
  startDate: string;
  endDate: string;
  totalSales: number;
  totalOrders: number;
  averageCheck: number;
  totalTips: number;
  averageTurnTime: number; // in minutes
  paymentMethods: Record<string, number>;
  hourlySales: Record<number, number>;
  lastUpdated: string;
}

// Cash Audit Types
export interface CashAudit {
  id: string;
  storeId: string;
  date: string; // ISO date string
  auditedBy: string; // User ID of manager who performed audit
  auditedByName: string; // Name for display
  auditedAt: string; // ISO timestamp when audit was performed
  expectedCash: number; // Expected cash based on sales/transactions
  actualCash: number; // Actual cash counted in drawer
  variance: number; // Difference (actualCash - expectedCash)
  status: 'PASS' | 'FAIL' | 'REVIEW'; // Based on variance threshold
  notes?: string; // Optional notes about the audit
  denominations?: { // Optional breakdown by denomination
    hundreds: number;
    fifties: number;
    twenties: number;
    tens: number;
    fives: number;
    ones: number;
    quarters: number;
    dimes: number;
    nickels: number;
    pennies: number;
  };
}
