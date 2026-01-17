import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Target,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Edit2,
  Award,
  TrendingUp,
} from 'lucide-react';
import {
  QuarterlyGoal,
  GoalDetail,
  GoalNextStep,
  WeeklyTarget,
  ProgressNote,
  GoalStatus,
  generateId,
} from '../types';

interface GoalDetailViewProps {
  goal?: QuarterlyGoal;
  detail?: GoalDetail;
  onSaveGoal: (goal: QuarterlyGoal) => Promise<void>;
  onSaveDetail: (detail: GoalDetail) => Promise<void>;
  onBack: () => void;
}

const GoalDetailView: React.FC<GoalDetailViewProps> = ({
  goal,
  detail,
  onSaveGoal,
  onSaveDetail,
  onBack,
}) => {
  const [currentDetail, setCurrentDetail] = useState<GoalDetail | null>(null);
  const [newNote, setNewNote] = useState('');

  useEffect(() => {
    if (detail) {
      setCurrentDetail(detail);
    } else if (goal) {
      setCurrentDetail(createEmptyDetail(goal.id));
    }
  }, [goal, detail]);

  if (!goal) {
    return (
      <div className="text-center py-16">
        <Target className="w-16 h-16 text-amber-300 mx-auto mb-4" />
        <h3 className="text-xl font-bold mb-2">Goal Not Found</h3>
        <button onClick={onBack} className="text-amber-700 hover:underline">
          Go back to goals
        </button>
      </div>
    );
  }

  const saveDetail = async (updates: Partial<GoalDetail>) => {
    if (!currentDetail) return;
    const updated = { ...currentDetail, ...updates };
    setCurrentDetail(updated);
    await onSaveDetail(updated);
  };

  const updateSMPI = (field: keyof GoalDetail['smpiBreakdown'], value: string) => {
    if (!currentDetail) return;
    saveDetail({
      smpiBreakdown: { ...currentDetail.smpiBreakdown, [field]: value },
    });
  };

  const addNextStep = () => {
    if (!currentDetail) return;
    const newStep: GoalNextStep = {
      id: generateId(),
      description: '',
      completed: false,
    };
    saveDetail({ nextSteps: [...currentDetail.nextSteps, newStep] });
  };

  const updateNextStep = (index: number, updates: Partial<GoalNextStep>) => {
    if (!currentDetail) return;
    const newSteps = [...currentDetail.nextSteps];
    newSteps[index] = { ...newSteps[index], ...updates };
    saveDetail({ nextSteps: newSteps });
  };

  const toggleNextStep = (index: number) => {
    if (!currentDetail) return;
    updateNextStep(index, { completed: !currentDetail.nextSteps[index].completed });
  };

  const removeNextStep = (index: number) => {
    if (!currentDetail) return;
    saveDetail({ nextSteps: currentDetail.nextSteps.filter((_, i) => i !== index) });
  };

  const addProgressNote = () => {
    if (!currentDetail || !newNote.trim()) return;
    const note: ProgressNote = {
      id: generateId(),
      date: new Date().toISOString(),
      content: newNote,
    };
    saveDetail({ progressNotes: [note, ...currentDetail.progressNotes] });
    setNewNote('');
  };

  const removeProgressNote = (id: string) => {
    if (!currentDetail) return;
    saveDetail({ progressNotes: currentDetail.progressNotes.filter(n => n.id !== id) });
  };

  const updateGoalStatus = async (status: GoalStatus) => {
    await onSaveGoal({ ...goal, status });
  };

  const getStatusColor = (status: GoalStatus) => {
    switch (status) {
      case GoalStatus.COMPLETED: return 'bg-green-100 text-green-800 border-green-300';
      case GoalStatus.IN_PROGRESS: return 'bg-blue-100 text-blue-800 border-blue-300';
      case GoalStatus.ABANDONED: return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-amber-100 text-amber-800 border-amber-300';
    }
  };

  const getRankBadge = (rank: 1 | 2 | 3) => {
    const colors = {
      1: 'bg-yellow-400 text-yellow-900',
      2: 'bg-gray-300 text-gray-800',
      3: 'bg-amber-600 text-amber-100',
    };
    return colors[rank];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4 border-b border-amber-200 pb-6">
        <button
          onClick={onBack}
          className="p-2 rounded-lg hover:bg-amber-100 transition-colors touch-manipulation mt-1"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${getRankBadge(goal.rank)}`}>
              {goal.rank}
            </span>
            <h1 className="text-2xl lg:text-3xl font-bold">{goal.title}</h1>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="opacity-60">{goal.domain}</span>
            <span className="opacity-40">•</span>
            <span className="flex items-center gap-1 opacity-60">
              {goal.type === 'Habit' ? <TrendingUp className="w-4 h-4" /> : <Award className="w-4 h-4" />}
              {goal.type}
            </span>
            <span className="opacity-40">•</span>
            <span className="opacity-60">{goal.quarter} {goal.year}</span>
          </div>

          {goal.description && (
            <p className="mt-3 opacity-70">{goal.description}</p>
          )}
        </div>

        <div>
          <select
            value={goal.status}
            onChange={(e) => updateGoalStatus(e.target.value as GoalStatus)}
            className={`px-4 py-2 rounded-lg border font-medium ${getStatusColor(goal.status)}`}
          >
            {Object.values(GoalStatus).map(s => (
              <option key={s} value={s}>{s.replace('_', ' ')}</option>
            ))}
          </select>
        </div>
      </div>

      {currentDetail && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* SMARTER Breakdown */}
            <div className="planner-card p-6">
              <h2 className="text-xl font-bold mb-4">SMARTER Goal Breakdown</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-1 text-amber-700">
                    S - Specific
                  </label>
                  <textarea
                    value={currentDetail.smpiBreakdown.specific}
                    onChange={(e) => updateSMPI('specific', e.target.value)}
                    placeholder="What exactly will you accomplish?"
                    className="w-full bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-sm focus:border-amber-500 outline-none resize-none"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1 text-amber-700">
                    M - Measurable
                  </label>
                  <textarea
                    value={currentDetail.smpiBreakdown.measurable}
                    onChange={(e) => updateSMPI('measurable', e.target.value)}
                    placeholder="How will you measure success?"
                    className="w-full bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-sm focus:border-amber-500 outline-none resize-none"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1 text-amber-700">
                    A - Actionable
                  </label>
                  <textarea
                    value={currentDetail.smpiBreakdown.actionable}
                    onChange={(e) => updateSMPI('actionable', e.target.value)}
                    placeholder="What actions will you take?"
                    className="w-full bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-sm focus:border-amber-500 outline-none resize-none"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1 text-amber-700">
                    R - Risky (Stretch)
                  </label>
                  <textarea
                    value={currentDetail.smpiBreakdown.risky}
                    onChange={(e) => updateSMPI('risky', e.target.value)}
                    placeholder="How does this stretch you outside your comfort zone?"
                    className="w-full bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-sm focus:border-amber-500 outline-none resize-none"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1 text-amber-700">
                    T - Time-bound
                  </label>
                  <textarea
                    value={currentDetail.smpiBreakdown.timeBound}
                    onChange={(e) => updateSMPI('timeBound', e.target.value)}
                    placeholder="What is the deadline?"
                    className="w-full bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-sm focus:border-amber-500 outline-none resize-none"
                    rows={2}
                  />
                </div>
              </div>
            </div>

            {/* Key Motivations */}
            <div className="planner-card p-6">
              <h2 className="text-xl font-bold mb-4">Key Motivations</h2>
              <ul className="space-y-2">
                {goal.keyMotivations.filter(m => m).map((motivation, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-amber-500 mt-1">•</span>
                    <span className="italic">"{motivation}"</span>
                  </li>
                ))}
                {goal.keyMotivations.filter(m => m).length === 0 && (
                  <p className="opacity-50">No motivations set</p>
                )}
              </ul>
            </div>

            {/* Celebration Plan */}
            <div className="planner-card p-6">
              <h2 className="text-xl font-bold mb-4">Celebration Plan</h2>
              <textarea
                value={currentDetail.celebrationPlan || ''}
                onChange={(e) => saveDetail({ celebrationPlan: e.target.value })}
                placeholder="How will you celebrate when you achieve this goal?"
                className="w-full bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 focus:border-amber-500 outline-none resize-none"
                rows={3}
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Next Steps */}
            <div className="planner-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Next Steps</h2>
                <button
                  onClick={addNextStep}
                  className="p-2 rounded-lg hover:bg-amber-100 transition-colors touch-manipulation"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {currentDetail.nextSteps.length > 0 ? (
                <div className="space-y-2">
                  {currentDetail.nextSteps.map((step, index) => (
                    <div key={step.id} className="flex items-start gap-3 group">
                      <button
                        onClick={() => toggleNextStep(index)}
                        className="mt-1 touch-manipulation"
                      >
                        {step.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        ) : (
                          <Circle className="w-5 h-5 text-amber-400" />
                        )}
                      </button>
                      <input
                        type="text"
                        value={step.description}
                        onChange={(e) => updateNextStep(index, { description: e.target.value })}
                        placeholder="Next step..."
                        className={`flex-1 bg-transparent border-b border-amber-200 focus:border-amber-500 outline-none py-1 ${
                          step.completed ? 'line-through opacity-50' : ''
                        }`}
                      />
                      <button
                        onClick={() => removeNextStep(index)}
                        className="p-1 opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-50 rounded transition-all touch-manipulation"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-4 opacity-50">No next steps defined</p>
              )}
            </div>

            {/* Obstacles & Strategies */}
            <div className="planner-card p-6">
              <h2 className="text-xl font-bold mb-4">Potential Obstacles</h2>
              {currentDetail.potentialObstacles.map((obstacle, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={obstacle}
                    onChange={(e) => {
                      const newObstacles = [...currentDetail.potentialObstacles];
                      newObstacles[index] = e.target.value;
                      saveDetail({ potentialObstacles: newObstacles });
                    }}
                    placeholder="What might get in the way?"
                    className="flex-1 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-sm focus:border-amber-500 outline-none"
                  />
                  <button
                    onClick={() => saveDetail({
                      potentialObstacles: currentDetail.potentialObstacles.filter((_, i) => i !== index),
                    })}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => saveDetail({
                  potentialObstacles: [...currentDetail.potentialObstacles, ''],
                })}
                className="text-sm text-amber-700 font-medium hover:underline"
              >
                + Add obstacle
              </button>

              <h2 className="text-xl font-bold mb-4 mt-6">Strategies</h2>
              {currentDetail.strategies.map((strategy, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={strategy}
                    onChange={(e) => {
                      const newStrategies = [...currentDetail.strategies];
                      newStrategies[index] = e.target.value;
                      saveDetail({ strategies: newStrategies });
                    }}
                    placeholder="How will you overcome obstacles?"
                    className="flex-1 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-sm focus:border-amber-500 outline-none"
                  />
                  <button
                    onClick={() => saveDetail({
                      strategies: currentDetail.strategies.filter((_, i) => i !== index),
                    })}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => saveDetail({
                  strategies: [...currentDetail.strategies, ''],
                })}
                className="text-sm text-amber-700 font-medium hover:underline"
              >
                + Add strategy
              </button>
            </div>

            {/* Progress Notes */}
            <div className="planner-card p-6">
              <h2 className="text-xl font-bold mb-4">Progress Notes</h2>

              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a progress note..."
                  className="flex-1 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 focus:border-amber-500 outline-none"
                  onKeyDown={(e) => e.key === 'Enter' && addProgressNote()}
                />
                <button
                  onClick={addProgressNote}
                  className="px-4 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition-colors"
                >
                  Add
                </button>
              </div>

              {currentDetail.progressNotes.length > 0 ? (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {currentDetail.progressNotes.map((note) => (
                    <div key={note.id} className="bg-amber-50 rounded-lg p-3 group">
                      <div className="flex items-start justify-between">
                        <div className="text-xs opacity-50 mb-1">
                          {new Date(note.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                        <button
                          onClick={() => removeProgressNote(note.id)}
                          className="p-1 opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-100 rounded transition-all"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-sm">{note.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-4 opacity-50">No progress notes yet</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function createEmptyDetail(goalId: string): GoalDetail {
  return {
    id: generateId(),
    goalId,
    smpiBreakdown: {
      specific: '',
      measurable: '',
      actionable: '',
      risky: '',
      timeBound: '',
    },
    keyMotivations: [],
    nextSteps: [],
    potentialObstacles: [],
    strategies: [],
    weeklyTargets: [],
    progressNotes: [],
  };
}

export default GoalDetailView;
