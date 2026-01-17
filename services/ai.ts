import { GoogleGenAI } from '@google/genai';
import {
  QuarterlyGoal,
  DailyPage,
  Task,
  Note,
  LifeDomain,
  GoalType,
} from '../types';

// AI Service for planner organization and insights
// Uses Google Gemini for AI capabilities

let ai: GoogleGenAI | null = null;

const initAI = (apiKey: string) => {
  ai = new GoogleGenAI({ apiKey });
};

const getAI = () => {
  if (!ai) {
    throw new Error('AI not initialized. Please set your API key in settings.');
  }
  return ai;
};

export interface AIInsight {
  type: 'tip' | 'warning' | 'suggestion' | 'celebration';
  title: string;
  message: string;
  actionable?: string;
}

export interface TaskBreakdown {
  subtasks: string[];
  estimatedDuration: string;
  suggestedOrder: number[];
}

export interface GoalSuggestion {
  title: string;
  domain: LifeDomain;
  type: GoalType;
  rationale: string;
  keyResults: string[];
}

// Initialize AI with API key
export const initializeAI = (apiKey: string) => {
  initAI(apiKey);
};

// Check if AI is available
export const isAIAvailable = (): boolean => {
  return ai !== null;
};

// Generate daily insights based on tasks and goals
export const generateDailyInsights = async (
  dailyPage: DailyPage,
  quarterlyGoals: QuarterlyGoal[]
): Promise<AIInsight[]> => {
  try {
    const genai = getAI();
    const model = genai.models.generateContent;

    const prompt = `You are a productivity coach helping with a Full Focus Planner.

Current Daily Page Data:
- Big 3 Tasks: ${dailyPage.dailyBig3.map(t => `${t.title} (${t.completed ? 'done' : 'pending'})`).join(', ')}
- Other Tasks: ${dailyPage.tasks.map(t => `${t.title} (${t.completed ? 'done' : 'pending'})`).join(', ')}
- Appointments: ${dailyPage.appointments.length} scheduled
- Morning Rituals: ${dailyPage.morningRituals.filter(r => r.completed).length}/${dailyPage.morningRituals.length} completed
- Evening Rituals: ${dailyPage.eveningRituals.filter(r => r.completed).length}/${dailyPage.eveningRituals.length} completed
- Gratitude entries: ${dailyPage.gratitude.filter(g => g.trim()).length}
- Wins logged: ${dailyPage.wins.filter(w => w.trim()).length}

Quarterly Goals:
${quarterlyGoals.map(g => `- ${g.title} (${g.domain}, ${g.type}): ${g.progress}% complete`).join('\n')}

Generate 2-3 brief, actionable insights. Return as JSON array with objects containing:
- type: "tip" | "warning" | "suggestion" | "celebration"
- title: short title (3-5 words)
- message: brief insight (1-2 sentences)
- actionable: optional specific action to take

Focus on:
1. Progress celebration if tasks are being completed
2. Warnings if Big 3 alignment with quarterly goals seems off
3. Tips for better productivity based on patterns
4. Suggestions for reflection if gratitude/wins are empty`;

    const result = await genai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    });

    const text = result.text || '';
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return [{
      type: 'tip',
      title: 'Stay Focused',
      message: 'Focus on completing your Big 3 tasks before moving to other items.',
    }];
  } catch (error) {
    console.error('AI insight generation failed:', error);
    return [];
  }
};

// Break down a complex task into subtasks
export const breakdownTask = async (taskTitle: string, context?: string): Promise<TaskBreakdown> => {
  try {
    const genai = getAI();

    const prompt = `Break down this task into actionable subtasks:

Task: "${taskTitle}"
${context ? `Context: ${context}` : ''}

Return as JSON with:
- subtasks: array of 3-7 specific, actionable subtask strings
- estimatedDuration: total time estimate (e.g., "2-3 hours")
- suggestedOrder: array of indices indicating recommended order

Make subtasks specific and completable in 15-60 minutes each.`;

    const result = await genai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    });

    const text = result.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return {
      subtasks: [`Start working on: ${taskTitle}`],
      estimatedDuration: 'Unknown',
      suggestedOrder: [0],
    };
  } catch (error) {
    console.error('Task breakdown failed:', error);
    return {
      subtasks: [`Work on: ${taskTitle}`],
      estimatedDuration: 'Unknown',
      suggestedOrder: [0],
    };
  }
};

// Suggest goals based on life domains and current goals
export const suggestGoals = async (
  existingGoals: QuarterlyGoal[],
  focusDomains: LifeDomain[]
): Promise<GoalSuggestion[]> => {
  try {
    const genai = getAI();

    const prompt = `As a productivity coach, suggest quarterly goals for someone using the Full Focus Planner methodology.

Current Goals:
${existingGoals.map(g => `- ${g.title} (${g.domain}, ${g.type})`).join('\n') || 'None set'}

Focus Domains they want to prioritize:
${focusDomains.join(', ')}

Life Domains available: Health, Relationships, Personal, Work, Finance, Fun

Suggest 2-3 SMARTER goals (Specific, Measurable, Actionable, Risky, Time-keyed, Exciting, Relevant).

Return as JSON array with objects containing:
- title: goal title (action-oriented, specific)
- domain: one of the life domains
- type: "achievement" or "habit"
- rationale: why this goal matters (1 sentence)
- keyResults: array of 2-3 measurable key results

Goals should be ambitious but achievable in a quarter.`;

    const result = await genai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    });

    const text = result.text || '';
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return [];
  } catch (error) {
    console.error('Goal suggestion failed:', error);
    return [];
  }
};

// Categorize and tag notes automatically
export const categorizeNote = async (
  noteContent: string,
  existingTags: string[]
): Promise<{ suggestedTags: string[]; summary: string }> => {
  try {
    const genai = getAI();

    const prompt = `Analyze this note and suggest categorization:

Note Content:
"${noteContent.substring(0, 1000)}"

Existing tags in the system:
${existingTags.join(', ') || 'None'}

Return JSON with:
- suggestedTags: array of 1-3 relevant tags (use existing tags when appropriate, or suggest new ones)
- summary: one-line summary of the note (max 100 characters)`;

    const result = await genai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    });

    const text = result.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return {
      suggestedTags: [],
      summary: noteContent.substring(0, 100),
    };
  } catch (error) {
    console.error('Note categorization failed:', error);
    return {
      suggestedTags: [],
      summary: noteContent.substring(0, 100),
    };
  }
};

// Generate weekly review insights
export const generateWeeklyReviewPrompts = async (
  weeklyData: {
    completedTasks: number;
    totalTasks: number;
    big3Completion: number;
    goalsProgress: { title: string; progress: number }[];
    wins: string[];
  }
): Promise<{ reflection: string; questions: string[] }> => {
  try {
    const genai = getAI();

    const prompt = `Generate weekly review reflection prompts based on this data:

Week Summary:
- Tasks completed: ${weeklyData.completedTasks}/${weeklyData.totalTasks}
- Big 3 completion rate: ${weeklyData.big3Completion}%
- Goal Progress:
${weeklyData.goalsProgress.map(g => `  - ${g.title}: ${g.progress}%`).join('\n')}
- Wins logged: ${weeklyData.wins.join('; ') || 'None recorded'}

Return JSON with:
- reflection: A personalized 2-3 sentence reflection on the week
- questions: Array of 3-4 thought-provoking questions for self-review`;

    const result = await genai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    });

    const text = result.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return {
      reflection: 'Take time to reflect on what went well and what could improve.',
      questions: [
        'What was your biggest win this week?',
        'What obstacle slowed you down the most?',
        'What will you do differently next week?',
      ],
    };
  } catch (error) {
    console.error('Weekly review generation failed:', error);
    return {
      reflection: 'Reflect on your progress and plan for improvement.',
      questions: [
        'What worked well this week?',
        'What needs improvement?',
        'What is your top priority for next week?',
      ],
    };
  }
};

// Prioritize tasks using AI
export const prioritizeTasks = async (
  tasks: Task[],
  quarterlyGoals: QuarterlyGoal[],
  context?: string
): Promise<{ taskId: string; priority: number; reason: string }[]> => {
  try {
    const genai = getAI();

    const prompt = `Help prioritize these tasks based on Full Focus Planner methodology.

Tasks to prioritize:
${tasks.map((t, i) => `${i + 1}. [${t.id}] ${t.title}`).join('\n')}

Quarterly Goals (for alignment):
${quarterlyGoals.map(g => `- ${g.title}`).join('\n')}

${context ? `Additional context: ${context}` : ''}

Return JSON array with objects containing:
- taskId: the task ID
- priority: 1-3 (1=highest, should be in Big 3)
- reason: brief reason for priority (under 50 chars)

Consider:
1. Alignment with quarterly goals
2. Impact vs effort
3. Urgency and deadlines
4. Energy/focus required`;

    const result = await genai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    });

    const text = result.text || '';
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return tasks.map((t, i) => ({
      taskId: t.id,
      priority: Math.min(i + 1, 3),
      reason: 'Default order',
    }));
  } catch (error) {
    console.error('Task prioritization failed:', error);
    return [];
  }
};

// Export the AI service
export const aiService = {
  initialize: initializeAI,
  isAvailable: isAIAvailable,
  generateDailyInsights,
  breakdownTask,
  suggestGoals,
  categorizeNote,
  generateWeeklyReviewPrompts,
  prioritizeTasks,
};

export default aiService;
