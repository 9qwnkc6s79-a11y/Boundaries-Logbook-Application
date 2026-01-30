
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
    managerPhotoComment?: string; // Manager's feedback/notes on photo
    managerPhotoCommentBy?: string; // Manager user ID who commented
    managerPhotoCommentAt?: string; // Timestamp of comment
  }[];
  managerNotes?: string;
  toastSnapshot?: {
    averageTurnTime?: number;
    averageCheck?: number;
    totalSales?: number;
    totalOrders?: number;
    snapshotAt: string;
  };
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

// Toast Cash Management Types
export interface ToastCashData {
  location: string;
  startDate: string;
  endDate: string;
  cashIn: number; // Cash added to drawer
  cashOut: number; // Cash removed to safe (safe drops)
  payOuts: number; // Cash paid out for goods/services
  tipOuts: number; // Cash paid out for tips
  netCashRemoved: number; // Total cash removed (cashOut + payOuts + tipOuts)
  entries: {
    type: string;
    amount: number;
    createdDate: string;
    reason?: string;
    employeeName: string;
  }[];
  lastUpdated: string;
}

// Cash Deposit Tracking (Bank Deposits)
export interface CashDeposit {
  id: string;
  storeId: string;
  depositDate: string; // ISO date string when deposit was made to bank
  depositedBy: string; // User ID of manager who made deposit
  depositedByName: string; // Name for display
  depositedAt: string; // ISO timestamp when deposit was recorded in app

  // Calculation period
  periodStart: string; // Start date for this deposit period
  periodEnd: string; // End date for this deposit period

  // Expected cash calculation
  expectedDeposit: number; // Expected cash from sales minus safe drops
  actualDeposit: number; // Actual cash deposited at bank
  variance: number; // Difference (actualDeposit - expectedDeposit)
  variancePercent: number; // Variance as percentage of expected

  // Status based on variance
  status: 'PASS' | 'REVIEW' | 'FAIL';

  // Breakdown
  totalCashSales: number; // Total cash sales in period
  totalCashRemoved: number; // Total cash drops + pay-outs in period

  notes?: string; // Optional notes about the deposit
}

// Team Leader Performance Tracking
export interface ShiftOwnership {
  id: string;
  storeId: string;
  date: string; // ISO date (YYYY-MM-DD)
  shiftType: 'OPENING' | 'SHIFT_CHANGE' | 'CLOSING';

  // Leadership
  leaders: {
    userId: string;
    name: string;
    jobTitle: string;
    priority: number; // 1 = GM, 2 = Team Leader
    employeeGuid: string; // Toast employee GUID
  }[];
  multipleLeadersOnDuty: boolean; // True if 2+ leaders (both penalized)
  noLeaderOnDuty: boolean; // True if no leader clocked in

  // Team members (non-leaders)
  teamMembers: {
    userId: string;
    name: string;
    jobTitle: string;
  }[];

  // Checklist accountability
  checklistSubmittedBy?: string; // User ID who submitted
  checklistSubmittedAt?: string; // Timestamp
  checklistDueAt: string; // When it was due
  checklistOnTime: boolean;
  submissionDelayMinutes: number; // Negative if early, positive if late

  // Performance data (from Toast)
  averageTurnTime?: number; // Minutes
  totalSales?: number;
  totalOrders?: number;

  // Calculated scores
  timelinessScore: number; // 0-40
  turnTimeScore: number; // 0-40
  salesScore: number; // 0-20
  totalScore: number; // 0-100
}

export interface TeamLeaderPerformance {
  userId: string;
  name: string;
  storeId: string;
  period: {
    startDate: string;
    endDate: string;
  };

  // Shift statistics
  totalShiftsLed: number;
  shiftsWithMultipleLeaders: number; // How many times shared responsibility

  // Timeliness
  onTimeSubmissions: number;
  lateSubmissions: number;
  averageDelayMinutes: number;
  timelinessScore: number; // Average across all shifts

  // Turn time
  averageTurnTime: number; // Across all shifts they led
  bestTurnTime: number;
  worstTurnTime: number;
  turnTimeScore: number;

  // Sales
  averageSalesPerShift: number;
  totalSalesGenerated: number;
  salesScore: number;

  // Overall
  overallScore: number; // 0-100
  rank: number; // 1 = best, compared to other leaders
  trend: 'UP' | 'DOWN' | 'STABLE'; // Compared to last period
}
