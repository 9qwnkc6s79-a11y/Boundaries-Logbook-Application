import React from 'react';
import {
  Target,
  CheckCircle2,
  Circle,
  Calendar,
  ArrowRight,
  Sunrise,
  Moon,
  Clock,
  FolderOpen,
} from 'lucide-react';
import {
  ViewType,
  UserSettings,
  QuarterlyGoal,
  DailyPage,
  Project,
  DailyRitual,
  getTodayString,
} from '../types';

interface DashboardProps {
  settings: UserSettings;
  quarterlyGoals: QuarterlyGoal[];
  dailyPage?: DailyPage;
  projects: Project[];
  rituals: DailyRitual[];
  onNavigate: (view: ViewType) => void;
  onNavigateToDaily: (date: string) => void;
  onNavigateToGoal: (goalId: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  settings,
  quarterlyGoals,
  dailyPage,
  projects,
  rituals,
  onNavigate,
  onNavigateToDaily,
  onNavigateToGoal,
}) => {
  const today = getTodayString();
  const todayDate = new Date();
  const greeting = todayDate.getHours() < 12
    ? 'Good Morning'
    : todayDate.getHours() < 17
    ? 'Good Afternoon'
    : 'Good Evening';

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Get Big 3 progress
  const dailyBig3 = dailyPage?.dailyBig3 || [];
  const completedBig3 = dailyBig3.filter(t => t.completed).length;

  // Get morning rituals status
  const morningRituals = rituals.filter(r => r.type === 'morning' && r.isActive);
  const completedMorningRituals = dailyPage?.morningRituals.filter(r => r.completed).length || 0;

  // Get evening rituals status
  const eveningRituals = rituals.filter(r => r.type === 'evening' && r.isActive);
  const completedEveningRituals = dailyPage?.eveningRituals.filter(r => r.completed).length || 0;

  // Sort goals by rank
  const sortedGoals = [...quarterlyGoals].sort((a, b) => a.rank - b.rank);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-amber-200 pb-6">
        <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">{greeting}</h1>
        <p className="text-lg opacity-70 mt-1">{formatDate(todayDate)}</p>
        <p className="text-sm opacity-50 mt-1">
          {settings.currentPlanningYear} • {settings.currentQuarter}
        </p>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => onNavigateToDaily(today)}
          className="planner-card p-4 text-left hover:shadow-md transition-shadow touch-manipulation"
        >
          <Calendar className="w-8 h-8 text-amber-700 mb-2" />
          <div className="font-semibold">Today's Page</div>
          <div className="text-sm opacity-70 mt-1">
            {completedBig3}/3 Big 3 done
          </div>
        </button>

        <button
          onClick={() => onNavigate('quarterly_goals')}
          className="planner-card p-4 text-left hover:shadow-md transition-shadow touch-manipulation"
        >
          <Target className="w-8 h-8 text-amber-700 mb-2" />
          <div className="font-semibold">Quarterly Goals</div>
          <div className="text-sm opacity-70 mt-1">
            {quarterlyGoals.length} active goals
          </div>
        </button>

        <button
          onClick={() => onNavigate('weekly_preview')}
          className="planner-card p-4 text-left hover:shadow-md transition-shadow touch-manipulation"
        >
          <Clock className="w-8 h-8 text-amber-700 mb-2" />
          <div className="font-semibold">Weekly Preview</div>
          <div className="text-sm opacity-70 mt-1">
            Plan your week
          </div>
        </button>

        <button
          onClick={() => onNavigate('projects')}
          className="planner-card p-4 text-left hover:shadow-md transition-shadow touch-manipulation"
        >
          <FolderOpen className="w-8 h-8 text-amber-700 mb-2" />
          <div className="font-semibold">Projects</div>
          <div className="text-sm opacity-70 mt-1">
            {projects.length} active
          </div>
        </button>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Today's Big 3 */}
        <div className="planner-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Target className="w-5 h-5 text-amber-700" />
              Today's Big 3
            </h2>
            <button
              onClick={() => onNavigateToDaily(today)}
              className="text-amber-700 hover:text-amber-800 text-sm font-medium flex items-center gap-1"
            >
              View <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {dailyBig3.length > 0 ? (
            <ul className="space-y-3">
              {dailyBig3.map((task) => (
                <li key={task.id} className="flex items-start gap-3">
                  {task.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                  )}
                  <span className={task.completed ? 'line-through opacity-50' : ''}>
                    <span className="font-semibold text-amber-700 mr-2">#{task.rank}</span>
                    {task.title || 'Untitled task'}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-8 opacity-50">
              <p>No Big 3 set for today</p>
              <button
                onClick={() => onNavigateToDaily(today)}
                className="mt-2 text-amber-700 font-medium underline"
              >
                Set your priorities
              </button>
            </div>
          )}
        </div>

        {/* Quarterly Big 3 Goals */}
        <div className="planner-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Target className="w-5 h-5 text-amber-700" />
              Quarterly Big 3
            </h2>
            <button
              onClick={() => onNavigate('quarterly_goals')}
              className="text-amber-700 hover:text-amber-800 text-sm font-medium flex items-center gap-1"
            >
              View <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {sortedGoals.length > 0 ? (
            <ul className="space-y-3">
              {sortedGoals.slice(0, 3).map((goal) => (
                <li key={goal.id}>
                  <button
                    onClick={() => onNavigateToGoal(goal.id)}
                    className="w-full text-left hover:bg-amber-50 p-2 rounded-lg transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {goal.rank}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{goal.title}</div>
                        <div className="text-sm opacity-60">{goal.domain} • {goal.type}</div>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-8 opacity-50">
              <p>No quarterly goals set</p>
              <button
                onClick={() => onNavigate('quarterly_goals')}
                className="mt-2 text-amber-700 font-medium underline"
              >
                Set your goals
              </button>
            </div>
          )}
        </div>

        {/* Daily Rituals */}
        <div className="planner-card p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Sunrise className="w-5 h-5 text-amber-700" />
            Daily Rituals
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-amber-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Sunrise className="w-4 h-4 text-amber-600" />
                <span className="font-medium">Morning</span>
              </div>
              <div className="text-2xl font-bold text-amber-700">
                {completedMorningRituals}/{morningRituals.length}
              </div>
              <div className="text-sm opacity-60">completed</div>
            </div>

            <div className="bg-indigo-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Moon className="w-4 h-4 text-indigo-600" />
                <span className="font-medium">Evening</span>
              </div>
              <div className="text-2xl font-bold text-indigo-700">
                {completedEveningRituals}/{eveningRituals.length}
              </div>
              <div className="text-sm opacity-60">completed</div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('rituals')}
            className="mt-4 w-full py-2 text-center text-amber-700 font-medium hover:bg-amber-50 rounded-lg transition-colors"
          >
            Manage Rituals
          </button>
        </div>

        {/* Active Projects */}
        <div className="planner-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-amber-700" />
              Active Projects
            </h2>
            <button
              onClick={() => onNavigate('projects')}
              className="text-amber-700 hover:text-amber-800 text-sm font-medium flex items-center gap-1"
            >
              View All <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {projects.length > 0 ? (
            <ul className="space-y-3">
              {projects.slice(0, 4).map((project) => {
                const completedTasks = project.tasks.filter(t => t.completed).length;
                const totalTasks = project.tasks.length;
                const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

                return (
                  <li key={project.id} className="hover:bg-amber-50 p-2 rounded-lg transition-colors">
                    <div className="font-medium">{project.title}</div>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="flex-1 h-2 bg-amber-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="text-xs opacity-60">
                        {completedTasks}/{totalTasks}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="text-center py-8 opacity-50">
              <p>No active projects</p>
              <button
                onClick={() => onNavigate('projects')}
                className="mt-2 text-amber-700 font-medium underline"
              >
                Create a project
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quote of the Day */}
      <div className="planner-card p-6 text-center">
        <blockquote className="text-lg italic opacity-80">
          "The secret of getting ahead is getting started."
        </blockquote>
        <cite className="text-sm opacity-50 mt-2 block">— Mark Twain</cite>
      </div>
    </div>
  );
};

export default Dashboard;
