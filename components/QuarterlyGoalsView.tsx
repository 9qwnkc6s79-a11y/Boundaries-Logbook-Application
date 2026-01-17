import React, { useState } from 'react';
import {
  Target,
  Plus,
  Trash2,
  ChevronRight,
  Award,
  TrendingUp,
} from 'lucide-react';
import {
  QuarterlyGoal,
  AnnualGoal,
  Quarter,
  GoalStatus,
  GoalType,
  LifeDomain,
  generateId,
} from '../types';

interface QuarterlyGoalsViewProps {
  goals: QuarterlyGoal[];
  annualGoals: AnnualGoal[];
  year: number;
  quarter: Quarter;
  onSave: (goal: QuarterlyGoal) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onNavigateToGoal: (goalId: string) => void;
  onQuarterChange: (quarter: Quarter) => void;
  onYearChange: (year: number) => void;
}

const QuarterlyGoalsView: React.FC<QuarterlyGoalsViewProps> = ({
  goals,
  annualGoals,
  year,
  quarter,
  onSave,
  onDelete,
  onNavigateToGoal,
  onQuarterChange,
  onYearChange,
}) => {
  const [editingGoal, setEditingGoal] = useState<QuarterlyGoal | null>(null);
  const [showForm, setShowForm] = useState(false);

  const sortedGoals = [...goals].sort((a, b) => a.rank - b.rank);
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1];
  const quarters: Quarter[] = [Quarter.Q1, Quarter.Q2, Quarter.Q3, Quarter.Q4];

  const getAvailableRanks = () => {
    const usedRanks = goals.filter(g => g.id !== editingGoal?.id).map(g => g.rank);
    return ([1, 2, 3] as const).filter(r => !usedRanks.includes(r));
  };

  const createNewGoal = (): QuarterlyGoal => {
    const availableRanks = getAvailableRanks();
    return {
      id: generateId(),
      year,
      quarter,
      title: '',
      description: '',
      domain: LifeDomain.WORK,
      type: GoalType.ACHIEVEMENT,
      status: GoalStatus.NOT_STARTED,
      rank: availableRanks[0] || 1,
      keyMotivations: [''],
      nextSteps: [''],
      weeklyTargets: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  };

  const handleAddGoal = () => {
    if (goals.length >= 3) {
      alert('You can only have 3 quarterly goals (Big 3). Delete one to add a new one.');
      return;
    }
    setEditingGoal(createNewGoal());
    setShowForm(true);
  };

  const handleEditGoal = (goal: QuarterlyGoal) => {
    setEditingGoal({ ...goal });
    setShowForm(true);
  };

  const handleSaveGoal = async () => {
    if (!editingGoal || !editingGoal.title.trim()) {
      alert('Please enter a goal title');
      return;
    }

    await onSave({
      ...editingGoal,
      keyMotivations: editingGoal.keyMotivations.filter(m => m.trim()),
      nextSteps: editingGoal.nextSteps.filter(s => s.trim()),
    });
    setEditingGoal(null);
    setShowForm(false);
  };

  const handleDeleteGoal = async (id: string) => {
    if (confirm('Are you sure you want to delete this goal?')) {
      await onDelete(id);
    }
  };

  const getStatusColor = (status: GoalStatus) => {
    switch (status) {
      case GoalStatus.COMPLETED:
        return 'bg-green-100 text-green-800';
      case GoalStatus.IN_PROGRESS:
        return 'bg-blue-100 text-blue-800';
      case GoalStatus.ABANDONED:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-amber-100 text-amber-800';
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
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-amber-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Target className="w-8 h-8 text-amber-700" />
            Quarterly Big 3
          </h1>
          <p className="text-sm opacity-60 mt-1">
            Your 3 most important goals for this quarter
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={year}
            onChange={(e) => onYearChange(parseInt(e.target.value))}
            className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 font-medium"
          >
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          <select
            value={quarter}
            onChange={(e) => onQuarterChange(e.target.value as Quarter)}
            className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 font-medium"
          >
            {quarters.map(q => (
              <option key={q} value={q}>{q}</option>
            ))}
          </select>

          {goals.length < 3 && (
            <button
              onClick={handleAddGoal}
              className="flex items-center gap-2 bg-amber-700 text-white px-4 py-2 rounded-lg hover:bg-amber-800 transition-colors touch-manipulation"
            >
              <Plus className="w-5 h-5" />
              Add Goal
            </button>
          )}
        </div>
      </div>

      {/* Goals Grid */}
      {sortedGoals.length > 0 ? (
        <div className="grid lg:grid-cols-3 gap-6">
          {sortedGoals.map((goal) => (
            <div
              key={goal.id}
              className="planner-card p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <span className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${getRankBadge(goal.rank)}`}>
                  {goal.rank}
                </span>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(goal.status)}`}>
                    {goal.status.replace('_', ' ')}
                  </span>
                  <button
                    onClick={() => handleDeleteGoal(goal.id)}
                    className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors touch-manipulation"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <h3 className="text-xl font-bold mb-2">{goal.title}</h3>

              <div className="flex items-center gap-2 text-sm opacity-60 mb-3">
                <span>{goal.domain}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  {goal.type === GoalType.HABIT ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <Award className="w-3 h-3" />
                  )}
                  {goal.type}
                </span>
              </div>

              {goal.description && (
                <p className="text-sm opacity-70 mb-4 line-clamp-2">
                  {goal.description}
                </p>
              )}

              {goal.keyMotivations.length > 0 && goal.keyMotivations[0] && (
                <div className="mb-4">
                  <div className="text-xs font-semibold uppercase tracking-wider opacity-50 mb-1">
                    Key Motivation
                  </div>
                  <p className="text-sm italic">"{goal.keyMotivations[0]}"</p>
                </div>
              )}

              <div className="flex gap-2 mt-4 pt-4 border-t border-amber-200">
                <button
                  onClick={() => handleEditGoal(goal)}
                  className="flex-1 py-2 text-center text-amber-700 font-medium hover:bg-amber-50 rounded-lg transition-colors touch-manipulation"
                >
                  Edit
                </button>
                <button
                  onClick={() => onNavigateToGoal(goal.id)}
                  className="flex-1 py-2 text-center bg-amber-100 text-amber-800 font-medium hover:bg-amber-200 rounded-lg transition-colors flex items-center justify-center gap-1 touch-manipulation"
                >
                  Details <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {/* Empty Slots */}
          {[...Array(3 - sortedGoals.length)].map((_, index) => (
            <button
              key={`empty-${index}`}
              onClick={handleAddGoal}
              className="planner-card p-6 border-2 border-dashed border-amber-300 hover:border-amber-500 transition-colors flex flex-col items-center justify-center min-h-[200px] touch-manipulation"
            >
              <Plus className="w-8 h-8 text-amber-400 mb-2" />
              <span className="text-amber-600 font-medium">Add Goal #{sortedGoals.length + index + 1}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <Target className="w-16 h-16 text-amber-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">No Quarterly Goals Set</h3>
          <p className="opacity-60 mb-6">
            Set your Big 3 goals for {quarter} {year}
          </p>
          <button
            onClick={handleAddGoal}
            className="inline-flex items-center gap-2 bg-amber-700 text-white px-6 py-3 rounded-lg hover:bg-amber-800 transition-colors touch-manipulation"
          >
            <Plus className="w-5 h-5" />
            Add Your First Goal
          </button>
        </div>
      )}

      {/* Edit Modal */}
      {showForm && editingGoal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-amber-200 p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">
                {editingGoal.id ? 'Edit Goal' : 'New Goal'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingGoal(null);
                }}
                className="p-2 hover:bg-amber-100 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-semibold mb-2">Goal Title *</label>
                <input
                  type="text"
                  value={editingGoal.title}
                  onChange={(e) => setEditingGoal({ ...editingGoal, title: e.target.value })}
                  placeholder="What do you want to achieve?"
                  className="w-full bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 focus:border-amber-500 outline-none"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold mb-2">Description</label>
                <textarea
                  value={editingGoal.description || ''}
                  onChange={(e) => setEditingGoal({ ...editingGoal, description: e.target.value })}
                  placeholder="Describe your goal in detail..."
                  rows={3}
                  className="w-full bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 focus:border-amber-500 outline-none resize-none"
                />
              </div>

              {/* Rank, Domain, Type, Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Rank</label>
                  <select
                    value={editingGoal.rank}
                    onChange={(e) => setEditingGoal({ ...editingGoal, rank: parseInt(e.target.value) as 1 | 2 | 3 })}
                    className="w-full bg-amber-50 border border-amber-200 rounded-lg px-4 py-3"
                  >
                    {([1, 2, 3] as const).map(r => (
                      <option key={r} value={r} disabled={goals.some(g => g.id !== editingGoal.id && g.rank === r)}>
                        #{r} {r === 1 ? '(Most Important)' : r === 2 ? '(Second)' : '(Third)'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Life Domain</label>
                  <select
                    value={editingGoal.domain}
                    onChange={(e) => setEditingGoal({ ...editingGoal, domain: e.target.value as LifeDomain })}
                    className="w-full bg-amber-50 border border-amber-200 rounded-lg px-4 py-3"
                  >
                    {Object.values(LifeDomain).map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Goal Type</label>
                  <select
                    value={editingGoal.type}
                    onChange={(e) => setEditingGoal({ ...editingGoal, type: e.target.value as GoalType })}
                    className="w-full bg-amber-50 border border-amber-200 rounded-lg px-4 py-3"
                  >
                    {Object.values(GoalType).map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Status</label>
                  <select
                    value={editingGoal.status}
                    onChange={(e) => setEditingGoal({ ...editingGoal, status: e.target.value as GoalStatus })}
                    className="w-full bg-amber-50 border border-amber-200 rounded-lg px-4 py-3"
                  >
                    {Object.values(GoalStatus).map(s => (
                      <option key={s} value={s}>{s.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Link to Annual Goal */}
              {annualGoals.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold mb-2">Link to Annual Goal</label>
                  <select
                    value={editingGoal.annualGoalId || ''}
                    onChange={(e) => setEditingGoal({ ...editingGoal, annualGoalId: e.target.value || undefined })}
                    className="w-full bg-amber-50 border border-amber-200 rounded-lg px-4 py-3"
                  >
                    <option value="">No link</option>
                    {annualGoals.map(g => (
                      <option key={g.id} value={g.id}>{g.title}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Key Motivations */}
              <div>
                <label className="block text-sm font-semibold mb-2">Key Motivations</label>
                <p className="text-xs opacity-60 mb-2">Why is this goal important to you?</p>
                {editingGoal.keyMotivations.map((motivation, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={motivation}
                      onChange={(e) => {
                        const newMotivations = [...editingGoal.keyMotivations];
                        newMotivations[index] = e.target.value;
                        setEditingGoal({ ...editingGoal, keyMotivations: newMotivations });
                      }}
                      placeholder={`Motivation ${index + 1}`}
                      className="flex-1 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 focus:border-amber-500 outline-none"
                    />
                    {editingGoal.keyMotivations.length > 1 && (
                      <button
                        onClick={() => {
                          setEditingGoal({
                            ...editingGoal,
                            keyMotivations: editingGoal.keyMotivations.filter((_, i) => i !== index),
                          });
                        }}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => setEditingGoal({
                    ...editingGoal,
                    keyMotivations: [...editingGoal.keyMotivations, ''],
                  })}
                  className="text-sm text-amber-700 font-medium hover:underline"
                >
                  + Add motivation
                </button>
              </div>

              {/* Next Steps */}
              <div>
                <label className="block text-sm font-semibold mb-2">Next Steps</label>
                <p className="text-xs opacity-60 mb-2">What are the immediate actions to take?</p>
                {editingGoal.nextSteps.map((step, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={step}
                      onChange={(e) => {
                        const newSteps = [...editingGoal.nextSteps];
                        newSteps[index] = e.target.value;
                        setEditingGoal({ ...editingGoal, nextSteps: newSteps });
                      }}
                      placeholder={`Step ${index + 1}`}
                      className="flex-1 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 focus:border-amber-500 outline-none"
                    />
                    {editingGoal.nextSteps.length > 1 && (
                      <button
                        onClick={() => {
                          setEditingGoal({
                            ...editingGoal,
                            nextSteps: editingGoal.nextSteps.filter((_, i) => i !== index),
                          });
                        }}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => setEditingGoal({
                    ...editingGoal,
                    nextSteps: [...editingGoal.nextSteps, ''],
                  })}
                  className="text-sm text-amber-700 font-medium hover:underline"
                >
                  + Add step
                </button>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-amber-200 p-4 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingGoal(null);
                }}
                className="px-6 py-2 text-amber-700 font-medium hover:bg-amber-50 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveGoal}
                className="px-6 py-2 bg-amber-700 text-white font-medium rounded-lg hover:bg-amber-800 transition-colors"
              >
                Save Goal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuarterlyGoalsView;
