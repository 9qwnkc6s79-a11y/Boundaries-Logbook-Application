import React, { useState, useEffect, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Target,
  Clock,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Calendar,
  Sunrise,
  Moon,
  FileText,
  Heart,
  X,
} from 'lucide-react';
import {
  DailyPage,
  DailyBig3Task,
  Appointment,
  Task,
  RitualCheck,
  QuarterlyGoal,
  DailyRitual,
  TaskStatus,
  generateId,
  getTodayString,
} from '../types';

interface DailyPageViewProps {
  date: string;
  page?: DailyPage;
  quarterlyGoals: QuarterlyGoal[];
  rituals: DailyRitual[];
  onSave: (page: DailyPage) => Promise<void>;
  onDateChange: (date: string) => void;
}

const DailyPageView: React.FC<DailyPageViewProps> = ({
  date,
  page,
  quarterlyGoals,
  rituals,
  onSave,
  onDateChange,
}) => {
  const [currentPage, setCurrentPage] = useState<DailyPage>(() => createEmptyPage(date, rituals));
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);

  // Initialize or update page when date or page prop changes
  useEffect(() => {
    if (page) {
      setCurrentPage(page);
    } else {
      setCurrentPage(createEmptyPage(date, rituals));
    }
  }, [date, page, rituals]);

  // Auto-save with debounce
  const triggerAutoSave = useCallback((updatedPage: DailyPage) => {
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }
    const timeout = setTimeout(() => {
      onSave(updatedPage);
    }, 1000);
    setAutoSaveTimeout(timeout);
  }, [autoSaveTimeout, onSave]);

  const updatePage = useCallback((updates: Partial<DailyPage>) => {
    setCurrentPage(prev => {
      const updated = { ...prev, ...updates, updatedAt: new Date().toISOString() };
      triggerAutoSave(updated);
      return updated;
    });
  }, [triggerAutoSave]);

  // Date navigation
  const navigateDate = (direction: number) => {
    const current = new Date(date);
    current.setDate(current.getDate() + direction);
    onDateChange(current.toISOString().split('T')[0]);
  };

  const goToToday = () => {
    onDateChange(getTodayString());
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isToday = date === getTodayString();

  // Big 3 handlers
  const updateBig3 = (index: number, updates: Partial<DailyBig3Task>) => {
    const newBig3 = [...currentPage.dailyBig3];
    newBig3[index] = { ...newBig3[index], ...updates };
    updatePage({ dailyBig3: newBig3 });
  };

  const toggleBig3 = (index: number) => {
    updateBig3(index, { completed: !currentPage.dailyBig3[index].completed });
  };

  // Appointment handlers
  const addAppointment = () => {
    const newAppointment: Appointment = {
      id: generateId(),
      time: '09:00',
      title: '',
    };
    updatePage({ appointments: [...currentPage.appointments, newAppointment] });
  };

  const updateAppointment = (index: number, updates: Partial<Appointment>) => {
    const newAppointments = [...currentPage.appointments];
    newAppointments[index] = { ...newAppointments[index], ...updates };
    updatePage({ appointments: newAppointments });
  };

  const removeAppointment = (index: number) => {
    updatePage({ appointments: currentPage.appointments.filter((_, i) => i !== index) });
  };

  // Other tasks handlers
  const addTask = () => {
    const newTask: Task = {
      id: generateId(),
      title: '',
      status: TaskStatus.PENDING,
      createdAt: new Date().toISOString(),
    };
    updatePage({ otherTasks: [...currentPage.otherTasks, newTask] });
  };

  const updateTask = (index: number, updates: Partial<Task>) => {
    const newTasks = [...currentPage.otherTasks];
    newTasks[index] = { ...newTasks[index], ...updates };
    updatePage({ otherTasks: newTasks });
  };

  const toggleTask = (index: number) => {
    const task = currentPage.otherTasks[index];
    updateTask(index, {
      status: task.status === TaskStatus.COMPLETED ? TaskStatus.PENDING : TaskStatus.COMPLETED,
    });
  };

  const removeTask = (index: number) => {
    updatePage({ otherTasks: currentPage.otherTasks.filter((_, i) => i !== index) });
  };

  // Ritual handlers
  const toggleRitual = (type: 'morning' | 'evening', ritualId: string) => {
    const key = type === 'morning' ? 'morningRituals' : 'eveningRituals';
    const ritualChecks = [...currentPage[key]];
    const index = ritualChecks.findIndex(r => r.ritualId === ritualId);
    if (index >= 0) {
      ritualChecks[index] = { ...ritualChecks[index], completed: !ritualChecks[index].completed };
    } else {
      ritualChecks.push({ ritualId, completed: true });
    }
    updatePage({ [key]: ritualChecks });
  };

  const isRitualCompleted = (type: 'morning' | 'evening', ritualId: string) => {
    const key = type === 'morning' ? 'morningRituals' : 'eveningRituals';
    return currentPage[key].find(r => r.ritualId === ritualId)?.completed || false;
  };

  // Gratitude handlers
  const addGratitude = () => {
    updatePage({ gratitude: [...currentPage.gratitude, ''] });
  };

  const updateGratitude = (index: number, value: string) => {
    const newGratitude = [...currentPage.gratitude];
    newGratitude[index] = value;
    updatePage({ gratitude: newGratitude });
  };

  const removeGratitude = (index: number) => {
    updatePage({ gratitude: currentPage.gratitude.filter((_, i) => i !== index) });
  };

  const morningRitualsList = rituals.filter(r => r.type === 'morning' && r.isActive);
  const eveningRitualsList = rituals.filter(r => r.type === 'evening' && r.isActive);

  return (
    <div className="space-y-6">
      {/* Date Header */}
      <div className="flex items-center justify-between border-b border-amber-200 pb-4">
        <button
          onClick={() => navigateDate(-1)}
          className="p-2 rounded-lg hover:bg-amber-100 transition-colors touch-manipulation"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <div className="text-center">
          <h1 className="text-2xl lg:text-3xl font-bold">{formatDate(date)}</h1>
          {!isToday && (
            <button
              onClick={goToToday}
              className="mt-1 text-sm text-amber-700 hover:underline"
            >
              Go to Today
            </button>
          )}
        </div>

        <button
          onClick={() => navigateDate(1)}
          className="p-2 rounded-lg hover:bg-amber-100 transition-colors touch-manipulation"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Daily Big 3 */}
          <div className="planner-card p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-amber-700" />
              Daily Big 3
            </h2>
            <p className="text-sm opacity-60 mb-4">
              What are the 3 most important things to accomplish today?
            </p>

            <div className="space-y-4">
              {currentPage.dailyBig3.map((task, index) => (
                <div key={task.id} className="flex items-start gap-3">
                  <button
                    onClick={() => toggleBig3(index)}
                    className="mt-1 touch-manipulation"
                  >
                    {task.completed ? (
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                    ) : (
                      <Circle className="w-6 h-6 text-amber-400" />
                    )}
                  </button>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-6 h-6 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center text-sm font-bold">
                        {task.rank}
                      </span>
                      <input
                        type="text"
                        value={task.title}
                        onChange={(e) => updateBig3(index, { title: e.target.value })}
                        placeholder={`Priority #${task.rank}`}
                        className={`flex-1 bg-transparent border-b border-amber-200 focus:border-amber-500 outline-none py-1 font-medium ${
                          task.completed ? 'line-through opacity-50' : ''
                        }`}
                      />
                    </div>
                    <select
                      value={task.linkedGoalId || ''}
                      onChange={(e) => updateBig3(index, { linkedGoalId: e.target.value || undefined })}
                      className="text-xs bg-amber-50 border border-amber-200 rounded px-2 py-1 mt-1"
                    >
                      <option value="">Link to goal...</option>
                      {quarterlyGoals.map(goal => (
                        <option key={goal.id} value={goal.id}>
                          #{goal.rank}: {goal.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Schedule */}
          <div className="planner-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-700" />
                Schedule
              </h2>
              <button
                onClick={addAppointment}
                className="p-2 rounded-lg hover:bg-amber-100 transition-colors touch-manipulation"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {currentPage.appointments.length > 0 ? (
              <div className="space-y-3">
                {currentPage.appointments.map((apt, index) => (
                  <div key={apt.id} className="flex items-start gap-3 group">
                    <input
                      type="time"
                      value={apt.time}
                      onChange={(e) => updateAppointment(index, { time: e.target.value })}
                      className="bg-amber-50 border border-amber-200 rounded px-2 py-1 text-sm font-mono"
                    />
                    <input
                      type="text"
                      value={apt.title}
                      onChange={(e) => updateAppointment(index, { title: e.target.value })}
                      placeholder="Appointment..."
                      className="flex-1 bg-transparent border-b border-amber-200 focus:border-amber-500 outline-none py-1"
                    />
                    <button
                      onClick={() => removeAppointment(index)}
                      className="p-1 opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-50 rounded transition-all touch-manipulation"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-4 opacity-50">No appointments scheduled</p>
            )}
          </div>

          {/* Other Tasks */}
          <div className="planner-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-700" />
                Other Tasks
              </h2>
              <button
                onClick={addTask}
                className="p-2 rounded-lg hover:bg-amber-100 transition-colors touch-manipulation"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {currentPage.otherTasks.length > 0 ? (
              <div className="space-y-2">
                {currentPage.otherTasks.map((task, index) => (
                  <div key={task.id} className="flex items-center gap-3 group">
                    <button
                      onClick={() => toggleTask(index)}
                      className="touch-manipulation"
                    >
                      {task.status === TaskStatus.COMPLETED ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                    <input
                      type="text"
                      value={task.title}
                      onChange={(e) => updateTask(index, { title: e.target.value })}
                      placeholder="Task..."
                      className={`flex-1 bg-transparent border-b border-amber-200 focus:border-amber-500 outline-none py-1 ${
                        task.status === TaskStatus.COMPLETED ? 'line-through opacity-50' : ''
                      }`}
                    />
                    <button
                      onClick={() => removeTask(index)}
                      className="p-1 opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-50 rounded transition-all touch-manipulation"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-4 opacity-50">No additional tasks</p>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Morning Rituals */}
          <div className="planner-card p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Sunrise className="w-5 h-5 text-amber-600" />
              Morning Rituals
            </h2>

            {morningRitualsList.length > 0 ? (
              <div className="space-y-2">
                {morningRitualsList.map(ritual => (
                  <button
                    key={ritual.id}
                    onClick={() => toggleRitual('morning', ritual.id)}
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-amber-50 transition-colors text-left touch-manipulation"
                  >
                    {isRitualCompleted('morning', ritual.id) ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                    )}
                    <span className={isRitualCompleted('morning', ritual.id) ? 'line-through opacity-50' : ''}>
                      {ritual.title}
                    </span>
                    {ritual.duration && (
                      <span className="ml-auto text-xs opacity-50">{ritual.duration}m</span>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-center py-4 opacity-50">No morning rituals configured</p>
            )}
          </div>

          {/* Evening Rituals */}
          <div className="planner-card p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Moon className="w-5 h-5 text-indigo-600" />
              Evening Rituals
            </h2>

            {eveningRitualsList.length > 0 ? (
              <div className="space-y-2">
                {eveningRitualsList.map(ritual => (
                  <button
                    key={ritual.id}
                    onClick={() => toggleRitual('evening', ritual.id)}
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-indigo-50 transition-colors text-left touch-manipulation"
                  >
                    {isRitualCompleted('evening', ritual.id) ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                    )}
                    <span className={isRitualCompleted('evening', ritual.id) ? 'line-through opacity-50' : ''}>
                      {ritual.title}
                    </span>
                    {ritual.duration && (
                      <span className="ml-auto text-xs opacity-50">{ritual.duration}m</span>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-center py-4 opacity-50">No evening rituals configured</p>
            )}
          </div>

          {/* Gratitude */}
          <div className="planner-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Heart className="w-5 h-5 text-pink-500" />
                Gratitude
              </h2>
              <button
                onClick={addGratitude}
                className="p-2 rounded-lg hover:bg-pink-50 transition-colors touch-manipulation"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              {currentPage.gratitude.map((item, index) => (
                <div key={index} className="flex items-center gap-2 group">
                  <span className="text-pink-400">•</span>
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => updateGratitude(index, e.target.value)}
                    placeholder="I'm grateful for..."
                    className="flex-1 bg-transparent border-b border-pink-200 focus:border-pink-500 outline-none py-1"
                  />
                  <button
                    onClick={() => removeGratitude(index)}
                    className="p-1 opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-50 rounded transition-all touch-manipulation"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {currentPage.gratitude.length === 0 && (
                <p className="text-center py-4 opacity-50">What are you grateful for today?</p>
              )}
            </div>
          </div>

          {/* Daily Reflection */}
          <div className="planner-card p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-700" />
              Daily Reflection
            </h2>
            <textarea
              value={currentPage.dailyReflection || ''}
              onChange={(e) => updatePage({ dailyReflection: e.target.value })}
              placeholder="How was your day? What did you learn? What would you do differently?"
              className="w-full h-32 bg-amber-50 border border-amber-200 rounded-lg p-3 focus:border-amber-500 outline-none resize-none"
            />
          </div>
        </div>
      </div>

      {/* Extended Notes */}
      <div className="planner-card p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-amber-700" />
          Notes
        </h2>
        <textarea
          value={currentPage.notes}
          onChange={(e) => updatePage({ notes: e.target.value })}
          placeholder="Additional notes, ideas, thoughts..."
          className="w-full min-h-[200px] bg-amber-50 border border-amber-200 rounded-lg p-4 focus:border-amber-500 outline-none resize-y font-mono text-sm"
          style={{ lineHeight: '1.8' }}
        />
      </div>
    </div>
  );
};

function createEmptyPage(date: string, rituals: DailyRitual[]): DailyPage {
  return {
    id: generateId(),
    date,
    dailyBig3: [
      { id: generateId(), rank: 1, title: '', completed: false },
      { id: generateId(), rank: 2, title: '', completed: false },
      { id: generateId(), rank: 3, title: '', completed: false },
    ],
    appointments: [],
    otherTasks: [],
    morningRituals: rituals.filter(r => r.type === 'morning' && r.isActive).map(r => ({
      ritualId: r.id,
      completed: false,
    })),
    eveningRituals: rituals.filter(r => r.type === 'evening' && r.isActive).map(r => ({
      ritualId: r.id,
      completed: false,
    })),
    gratitude: [],
    notes: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export default DailyPageView;
