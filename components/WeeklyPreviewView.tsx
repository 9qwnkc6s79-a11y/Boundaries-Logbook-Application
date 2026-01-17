import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Target, Plus, Trash2 } from 'lucide-react';
import { WeeklyPreview, QuarterlyGoal, generateId } from '../types';

interface WeeklyPreviewViewProps {
  year: number;
  weekNumber: number;
  preview?: WeeklyPreview;
  quarterlyGoals: QuarterlyGoal[];
  onSave: (preview: WeeklyPreview) => Promise<void>;
  onWeekChange: (week: number) => void;
}

const WeeklyPreviewView: React.FC<WeeklyPreviewViewProps> = ({
  year,
  weekNumber,
  preview,
  quarterlyGoals,
  onSave,
  onWeekChange,
}) => {
  const [currentPreview, setCurrentPreview] = useState<WeeklyPreview>(() =>
    preview || createEmptyPreview(year, weekNumber)
  );

  useEffect(() => {
    if (preview) {
      setCurrentPreview(preview);
    } else {
      setCurrentPreview(createEmptyPreview(year, weekNumber));
    }
  }, [preview, year, weekNumber]);

  const savePreview = async (updates: Partial<WeeklyPreview>) => {
    const updated = { ...currentPreview, ...updates, updatedAt: new Date().toISOString() };
    setCurrentPreview(updated);
    await onSave(updated);
  };

  const getWeekDateRange = () => {
    const start = new Date(year, 0, 1 + (weekNumber - 1) * 7);
    const dayOffset = start.getDay();
    start.setDate(start.getDate() - dayOffset + 1); // Monday
    const end = new Date(start);
    end.setDate(end.getDate() + 6);

    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  const updateWeeklyBig3 = (index: number, updates: Partial<typeof currentPreview.weeklyBig3[0]>) => {
    const newBig3 = [...currentPreview.weeklyBig3];
    newBig3[index] = { ...newBig3[index], ...updates };
    savePreview({ weeklyBig3: newBig3 });
  };

  const addKeyDate = () => {
    savePreview({
      keyDates: [...currentPreview.keyDates, { date: '', event: '' }],
    });
  };

  const updateKeyDate = (index: number, updates: Partial<typeof currentPreview.keyDates[0]>) => {
    const newDates = [...currentPreview.keyDates];
    newDates[index] = { ...newDates[index], ...updates };
    savePreview({ keyDates: newDates });
  };

  const removeKeyDate = (index: number) => {
    savePreview({ keyDates: currentPreview.keyDates.filter((_, i) => i !== index) });
  };

  const updateGoalProgress = (goalId: string, field: 'weeklyTarget' | 'progressNotes', value: string) => {
    const existing = currentPreview.quarterlyGoalProgress.find(p => p.goalId === goalId);
    if (existing) {
      savePreview({
        quarterlyGoalProgress: currentPreview.quarterlyGoalProgress.map(p =>
          p.goalId === goalId ? { ...p, [field]: value } : p
        ),
      });
    } else {
      savePreview({
        quarterlyGoalProgress: [
          ...currentPreview.quarterlyGoalProgress,
          { goalId, weeklyTarget: field === 'weeklyTarget' ? value : '', progressNotes: field === 'progressNotes' ? value : '' },
        ],
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-amber-200 pb-6">
        <button
          onClick={() => onWeekChange(weekNumber - 1)}
          className="p-2 rounded-lg hover:bg-amber-100 transition-colors touch-manipulation"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <div className="text-center">
          <h1 className="text-2xl lg:text-3xl font-bold">Week {weekNumber}</h1>
          <p className="text-sm opacity-60 mt-1">{getWeekDateRange()}</p>
        </div>

        <button
          onClick={() => onWeekChange(weekNumber + 1)}
          className="p-2 rounded-lg hover:bg-amber-100 transition-colors touch-manipulation"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Weekly Big 3 */}
        <div className="planner-card p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-amber-700" />
            Weekly Big 3
          </h2>
          <p className="text-sm opacity-60 mb-4">
            What are the 3 most important outcomes for this week?
          </p>

          <div className="space-y-4">
            {currentPreview.weeklyBig3.map((item, index) => (
              <div key={index} className="flex items-start gap-3">
                <span className="w-8 h-8 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center font-bold flex-shrink-0">
                  {item.rank}
                </span>
                <div className="flex-1">
                  <input
                    type="text"
                    value={item.title}
                    onChange={(e) => updateWeeklyBig3(index, { title: e.target.value })}
                    placeholder={`Weekly priority #${item.rank}`}
                    className="w-full bg-transparent border-b border-amber-200 focus:border-amber-500 outline-none py-1 font-medium"
                  />
                  <select
                    value={item.linkedGoalId || ''}
                    onChange={(e) => updateWeeklyBig3(index, { linkedGoalId: e.target.value || undefined })}
                    className="text-xs bg-amber-50 border border-amber-200 rounded px-2 py-1 mt-2"
                  >
                    <option value="">Link to quarterly goal...</option>
                    {quarterlyGoals.map(goal => (
                      <option key={goal.id} value={goal.id}>
                        Q{goal.rank}: {goal.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quarterly Goals Progress */}
        <div className="planner-card p-6">
          <h2 className="text-xl font-bold mb-4">Quarterly Goals Progress</h2>

          {quarterlyGoals.length > 0 ? (
            <div className="space-y-4">
              {quarterlyGoals.map(goal => {
                const progress = currentPreview.quarterlyGoalProgress.find(p => p.goalId === goal.id);
                return (
                  <div key={goal.id} className="bg-amber-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-6 h-6 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center text-sm font-bold">
                        {goal.rank}
                      </span>
                      <span className="font-medium">{goal.title}</span>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <label className="text-xs font-semibold opacity-60 block mb-1">
                          This week's target
                        </label>
                        <input
                          type="text"
                          value={progress?.weeklyTarget || ''}
                          onChange={(e) => updateGoalProgress(goal.id, 'weeklyTarget', e.target.value)}
                          placeholder="What will you accomplish this week?"
                          className="w-full bg-white border border-amber-200 rounded px-3 py-2 text-sm focus:border-amber-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold opacity-60 block mb-1">
                          Progress notes
                        </label>
                        <textarea
                          value={progress?.progressNotes || ''}
                          onChange={(e) => updateGoalProgress(goal.id, 'progressNotes', e.target.value)}
                          placeholder="Notes on progress..."
                          className="w-full bg-white border border-amber-200 rounded px-3 py-2 text-sm focus:border-amber-500 outline-none resize-none"
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center py-8 opacity-50">No quarterly goals set</p>
          )}
        </div>

        {/* Key Dates */}
        <div className="planner-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-700" />
              Key Dates & Deadlines
            </h2>
            <button
              onClick={addKeyDate}
              className="p-2 rounded-lg hover:bg-amber-100 transition-colors touch-manipulation"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {currentPreview.keyDates.length > 0 ? (
            <div className="space-y-2">
              {currentPreview.keyDates.map((item, index) => (
                <div key={index} className="flex items-center gap-2 group">
                  <input
                    type="date"
                    value={item.date}
                    onChange={(e) => updateKeyDate(index, { date: e.target.value })}
                    className="bg-amber-50 border border-amber-200 rounded px-2 py-1 text-sm"
                  />
                  <input
                    type="text"
                    value={item.event}
                    onChange={(e) => updateKeyDate(index, { event: e.target.value })}
                    placeholder="Event or deadline..."
                    className="flex-1 bg-transparent border-b border-amber-200 focus:border-amber-500 outline-none py-1"
                  />
                  <button
                    onClick={() => removeKeyDate(index)}
                    className="p-1 opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-50 rounded transition-all touch-manipulation"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-4 opacity-50">No key dates added</p>
          )}
        </div>

        {/* Self-Care Plan */}
        <div className="planner-card p-6">
          <h2 className="text-xl font-bold mb-4">Self-Care Plan</h2>
          <p className="text-sm opacity-60 mb-4">
            How will you take care of yourself this week?
          </p>
          <textarea
            value={currentPreview.selfCarePlan || ''}
            onChange={(e) => savePreview({ selfCarePlan: e.target.value })}
            placeholder="Exercise, rest, hobbies, social time..."
            className="w-full bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 focus:border-amber-500 outline-none resize-none"
            rows={4}
          />
        </div>
      </div>

      {/* Notes */}
      <div className="planner-card p-6">
        <h2 className="text-xl font-bold mb-4">Weekly Notes</h2>
        <textarea
          value={currentPreview.notes}
          onChange={(e) => savePreview({ notes: e.target.value })}
          placeholder="Additional thoughts, ideas, reminders..."
          className="w-full min-h-[150px] bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 focus:border-amber-500 outline-none resize-y"
        />
      </div>
    </div>
  );
};

function createEmptyPreview(year: number, weekNumber: number): WeeklyPreview {
  const start = new Date(year, 0, 1 + (weekNumber - 1) * 7);
  const dayOffset = start.getDay();
  start.setDate(start.getDate() - dayOffset + 1);

  return {
    id: generateId(),
    year,
    weekNumber,
    startDate: start.toISOString().split('T')[0],
    quarterlyGoalProgress: [],
    weeklyBig3: [
      { rank: 1, title: '' },
      { rank: 2, title: '' },
      { rank: 3, title: '' },
    ],
    keyDates: [],
    notes: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export default WeeklyPreviewView;
