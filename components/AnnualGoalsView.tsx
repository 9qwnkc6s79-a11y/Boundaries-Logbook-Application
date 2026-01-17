import React, { useState } from 'react';
import { Target, Plus, Trash2, Edit2 } from 'lucide-react';
import {
  AnnualGoal,
  GoalStatus,
  GoalType,
  LifeDomain,
  generateId,
} from '../types';

interface AnnualGoalsViewProps {
  goals: AnnualGoal[];
  year: number;
  onSave: (goal: AnnualGoal) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onNavigateToGoal: (goalId: string) => void;
  onYearChange: (year: number) => void;
}

const AnnualGoalsView: React.FC<AnnualGoalsViewProps> = ({
  goals,
  year,
  onSave,
  onDelete,
  onNavigateToGoal,
  onYearChange,
}) => {
  const [editingGoal, setEditingGoal] = useState<AnnualGoal | null>(null);
  const [showForm, setShowForm] = useState(false);

  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1];

  const groupedGoals = Object.values(LifeDomain).reduce((acc, domain) => {
    acc[domain] = goals.filter(g => g.domain === domain);
    return acc;
  }, {} as Record<LifeDomain, AnnualGoal[]>);

  const createNewGoal = (): AnnualGoal => ({
    id: generateId(),
    year,
    title: '',
    description: '',
    domain: LifeDomain.WORK,
    type: GoalType.ACHIEVEMENT,
    status: GoalStatus.NOT_STARTED,
    keyMotivations: [''],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const handleSaveGoal = async () => {
    if (!editingGoal || !editingGoal.title.trim()) {
      alert('Please enter a goal title');
      return;
    }
    await onSave({
      ...editingGoal,
      keyMotivations: editingGoal.keyMotivations.filter(m => m.trim()),
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
      case GoalStatus.COMPLETED: return 'bg-green-100 text-green-800';
      case GoalStatus.IN_PROGRESS: return 'bg-blue-100 text-blue-800';
      case GoalStatus.ABANDONED: return 'bg-gray-100 text-gray-800';
      default: return 'bg-amber-100 text-amber-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-amber-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Target className="w-8 h-8 text-amber-700" />
            Annual Goals
          </h1>
          <p className="text-sm opacity-60 mt-1">
            Your vision for the year across all life domains
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

          <button
            onClick={() => {
              setEditingGoal(createNewGoal());
              setShowForm(true);
            }}
            className="flex items-center gap-2 bg-amber-700 text-white px-4 py-2 rounded-lg hover:bg-amber-800 transition-colors touch-manipulation"
          >
            <Plus className="w-5 h-5" />
            Add Goal
          </button>
        </div>
      </div>

      {/* Goals by Domain */}
      <div className="space-y-8">
        {Object.values(LifeDomain).map(domain => {
          const domainGoals = groupedGoals[domain];

          return (
            <div key={domain} className="planner-card p-6">
              <h2 className="text-xl font-bold mb-4 pb-2 border-b border-amber-200">
                {domain}
              </h2>

              {domainGoals.length > 0 ? (
                <div className="space-y-3">
                  {domainGoals.map(goal => (
                    <div
                      key={goal.id}
                      className="flex items-start justify-between p-3 bg-amber-50 rounded-lg group"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{goal.title}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(goal.status)}`}>
                            {goal.status.replace('_', ' ')}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                            {goal.type}
                          </span>
                        </div>
                        {goal.description && (
                          <p className="text-sm opacity-60 line-clamp-1">{goal.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setEditingGoal({ ...goal });
                            setShowForm(true);
                          }}
                          className="p-2 text-amber-700 hover:bg-amber-100 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteGoal(goal.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-4 opacity-40 text-sm">
                  No goals set for {domain}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Edit Modal */}
      {showForm && editingGoal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-amber-200 p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">
                {goals.some(g => g.id === editingGoal.id) ? 'Edit Goal' : 'New Annual Goal'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingGoal(null);
                }}
                className="p-2 hover:bg-amber-100 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Goal Title *</label>
                <input
                  type="text"
                  value={editingGoal.title}
                  onChange={(e) => setEditingGoal({ ...editingGoal, title: e.target.value })}
                  placeholder="What do you want to achieve this year?"
                  className="w-full bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Description</label>
                <textarea
                  value={editingGoal.description || ''}
                  onChange={(e) => setEditingGoal({ ...editingGoal, description: e.target.value })}
                  placeholder="Describe your goal..."
                  rows={3}
                  className="w-full bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 focus:border-amber-500 outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
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

              <div>
                <label className="block text-sm font-semibold mb-2">Key Motivations</label>
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
                      placeholder="Why is this important?"
                      className="flex-1 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 focus:border-amber-500 outline-none"
                    />
                    {editingGoal.keyMotivations.length > 1 && (
                      <button
                        onClick={() => setEditingGoal({
                          ...editingGoal,
                          keyMotivations: editingGoal.keyMotivations.filter((_, i) => i !== index),
                        })}
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
            </div>

            <div className="sticky bottom-0 bg-white border-t border-amber-200 p-4 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingGoal(null);
                }}
                className="px-6 py-2 text-amber-700 font-medium hover:bg-amber-50 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveGoal}
                className="px-6 py-2 bg-amber-700 text-white font-medium rounded-lg hover:bg-amber-800"
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

export default AnnualGoalsView;
