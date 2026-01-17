import React, { useState } from 'react';
import { Sunrise, Moon, Plus, Trash2, Edit2, GripVertical } from 'lucide-react';
import { DailyRitual, generateId } from '../types';

interface RitualsViewProps {
  rituals: DailyRitual[];
  onSave: (ritual: DailyRitual) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const RitualsView: React.FC<RitualsViewProps> = ({
  rituals,
  onSave,
  onDelete,
}) => {
  const [editingRitual, setEditingRitual] = useState<DailyRitual | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'morning' | 'evening'>('morning');

  const morningRituals = rituals
    .filter(r => r.type === 'morning')
    .sort((a, b) => a.order - b.order);

  const eveningRituals = rituals
    .filter(r => r.type === 'evening')
    .sort((a, b) => a.order - b.order);

  const currentRituals = activeTab === 'morning' ? morningRituals : eveningRituals;

  const createNewRitual = (): DailyRitual => ({
    id: generateId(),
    title: '',
    type: activeTab,
    order: currentRituals.length + 1,
    isActive: true,
    duration: 5,
  });

  const handleSave = async () => {
    if (!editingRitual || !editingRitual.title.trim()) {
      alert('Please enter a ritual name');
      return;
    }
    await onSave(editingRitual);
    setEditingRitual(null);
    setShowForm(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this ritual?')) {
      await onDelete(id);
    }
  };

  const toggleActive = async (ritual: DailyRitual) => {
    await onSave({ ...ritual, isActive: !ritual.isActive });
  };

  const moveRitual = async (ritual: DailyRitual, direction: 'up' | 'down') => {
    const list = activeTab === 'morning' ? morningRituals : eveningRituals;
    const currentIndex = list.findIndex(r => r.id === ritual.id);
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (newIndex < 0 || newIndex >= list.length) return;

    const otherRitual = list[newIndex];
    await onSave({ ...ritual, order: otherRitual.order });
    await onSave({ ...otherRitual, order: ritual.order });
  };

  const totalDuration = currentRituals
    .filter(r => r.isActive)
    .reduce((sum, r) => sum + (r.duration || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-amber-200 pb-6">
        <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-3">
          <Sunrise className="w-8 h-8 text-amber-700" />
          Daily Rituals
        </h1>
        <p className="text-sm opacity-60 mt-1">
          Design your morning and evening routines
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('morning')}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors touch-manipulation ${
            activeTab === 'morning'
              ? 'bg-amber-600 text-white'
              : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
          }`}
        >
          <Sunrise className="w-5 h-5" />
          Morning ({morningRituals.length})
        </button>
        <button
          onClick={() => setActiveTab('evening')}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors touch-manipulation ${
            activeTab === 'evening'
              ? 'bg-indigo-600 text-white'
              : 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200'
          }`}
        >
          <Moon className="w-5 h-5" />
          Evening ({eveningRituals.length})
        </button>
      </div>

      {/* Summary */}
      <div className={`p-4 rounded-lg ${activeTab === 'morning' ? 'bg-amber-100' : 'bg-indigo-100'}`}>
        <div className="flex items-center justify-between">
          <div>
            <span className="font-semibold">Total Duration:</span>{' '}
            <span className="text-lg font-bold">{totalDuration} minutes</span>
          </div>
          <button
            onClick={() => {
              setEditingRitual(createNewRitual());
              setShowForm(true);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors touch-manipulation ${
              activeTab === 'morning'
                ? 'bg-amber-700 text-white hover:bg-amber-800'
                : 'bg-indigo-700 text-white hover:bg-indigo-800'
            }`}
          >
            <Plus className="w-5 h-5" />
            Add Ritual
          </button>
        </div>
      </div>

      {/* Rituals List */}
      <div className="planner-card">
        {currentRituals.length > 0 ? (
          <div className="divide-y divide-amber-200">
            {currentRituals.map((ritual, index) => (
              <div
                key={ritual.id}
                className={`p-4 flex items-center gap-4 ${
                  !ritual.isActive ? 'opacity-50' : ''
                }`}
              >
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => moveRitual(ritual, 'up')}
                    disabled={index === 0}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => moveRitual(ritual, 'down')}
                    disabled={index === currentRituals.length - 1}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                  >
                    ▼
                  </button>
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{ritual.title}</span>
                    {ritual.duration && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        activeTab === 'morning' ? 'bg-amber-200 text-amber-800' : 'bg-indigo-200 text-indigo-800'
                      }`}>
                        {ritual.duration} min
                      </span>
                    )}
                  </div>
                  {ritual.description && (
                    <p className="text-sm opacity-60 mt-1">{ritual.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleActive(ritual)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      ritual.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {ritual.isActive ? 'Active' : 'Inactive'}
                  </button>
                  <button
                    onClick={() => {
                      setEditingRitual({ ...ritual });
                      setShowForm(true);
                    }}
                    className="p-2 text-amber-700 hover:bg-amber-100 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(ritual.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="opacity-50 mb-4">No {activeTab} rituals set up yet</p>
            <button
              onClick={() => {
                setEditingRitual(createNewRitual());
                setShowForm(true);
              }}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${
                activeTab === 'morning'
                  ? 'bg-amber-700 text-white hover:bg-amber-800'
                  : 'bg-indigo-700 text-white hover:bg-indigo-800'
              }`}
            >
              <Plus className="w-5 h-5" />
              Add Your First Ritual
            </button>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showForm && editingRitual && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">
              {rituals.some(r => r.id === editingRitual.id) ? 'Edit Ritual' : 'New Ritual'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Ritual Name *</label>
                <input
                  type="text"
                  value={editingRitual.title}
                  onChange={(e) => setEditingRitual({ ...editingRitual, title: e.target.value })}
                  placeholder="e.g., Meditation, Journal, Exercise"
                  className="w-full bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Description</label>
                <textarea
                  value={editingRitual.description || ''}
                  onChange={(e) => setEditingRitual({ ...editingRitual, description: e.target.value })}
                  placeholder="Optional details..."
                  rows={2}
                  className="w-full bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 focus:border-amber-500 outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Duration (minutes)</label>
                  <input
                    type="number"
                    value={editingRitual.duration || ''}
                    onChange={(e) => setEditingRitual({ ...editingRitual, duration: parseInt(e.target.value) || 0 })}
                    placeholder="5"
                    min="1"
                    className="w-full bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 focus:border-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Type</label>
                  <select
                    value={editingRitual.type}
                    onChange={(e) => setEditingRitual({ ...editingRitual, type: e.target.value as 'morning' | 'evening' })}
                    className="w-full bg-amber-50 border border-amber-200 rounded-lg px-4 py-3"
                  >
                    <option value="morning">Morning</option>
                    <option value="evening">Evening</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="ritual-active"
                  checked={editingRitual.isActive}
                  onChange={(e) => setEditingRitual({ ...editingRitual, isActive: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="ritual-active" className="text-sm font-medium">
                  Active (include in daily pages)
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingRitual(null);
                }}
                className="px-4 py-2 text-amber-700 hover:bg-amber-50 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RitualsView;
