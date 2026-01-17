import React, { useState } from 'react';
import { Clock, Plus, Trash2, Edit2, Check } from 'lucide-react';
import { IdealWeek, IdealWeekBlock, generateId } from '../types';

interface IdealWeekViewProps {
  idealWeeks: IdealWeek[];
  onSave: (week: IdealWeek) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

const CATEGORY_COLORS: Record<IdealWeekBlock['category'], string> = {
  deep_work: 'bg-blue-200 border-blue-400 text-blue-900',
  meetings: 'bg-purple-200 border-purple-400 text-purple-900',
  self_care: 'bg-green-200 border-green-400 text-green-900',
  admin: 'bg-gray-200 border-gray-400 text-gray-900',
  personal: 'bg-pink-200 border-pink-400 text-pink-900',
  buffer: 'bg-yellow-200 border-yellow-400 text-yellow-900',
  other: 'bg-amber-200 border-amber-400 text-amber-900',
};

const IdealWeekView: React.FC<IdealWeekViewProps> = ({
  idealWeeks,
  onSave,
  onDelete,
}) => {
  const [selectedWeek, setSelectedWeek] = useState<IdealWeek | null>(
    idealWeeks.find(w => w.isActive) || idealWeeks[0] || null
  );
  const [editingBlock, setEditingBlock] = useState<IdealWeekBlock | null>(null);
  const [showBlockForm, setShowBlockForm] = useState(false);
  const [newWeekName, setNewWeekName] = useState('');
  const [showNewWeekForm, setShowNewWeekForm] = useState(false);

  const createNewWeek = async () => {
    if (!newWeekName.trim()) return;
    const newWeek: IdealWeek = {
      id: generateId(),
      name: newWeekName,
      isActive: idealWeeks.length === 0,
      blocks: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await onSave(newWeek);
    setSelectedWeek(newWeek);
    setNewWeekName('');
    setShowNewWeekForm(false);
  };

  const setWeekActive = async (week: IdealWeek) => {
    await onSave({ ...week, isActive: true });
  };

  const addBlock = (dayOfWeek: number, hour: number) => {
    setEditingBlock({
      id: generateId(),
      dayOfWeek: dayOfWeek as IdealWeekBlock['dayOfWeek'],
      startTime: `${hour.toString().padStart(2, '0')}:00`,
      endTime: `${(hour + 1).toString().padStart(2, '0')}:00`,
      title: '',
      category: 'deep_work',
    });
    setShowBlockForm(true);
  };

  const saveBlock = async () => {
    if (!selectedWeek || !editingBlock || !editingBlock.title.trim()) return;

    const existingIndex = selectedWeek.blocks.findIndex(b => b.id === editingBlock.id);
    let newBlocks: IdealWeekBlock[];

    if (existingIndex >= 0) {
      newBlocks = selectedWeek.blocks.map(b => b.id === editingBlock.id ? editingBlock : b);
    } else {
      newBlocks = [...selectedWeek.blocks, editingBlock];
    }

    const updatedWeek = { ...selectedWeek, blocks: newBlocks };
    await onSave(updatedWeek);
    setSelectedWeek(updatedWeek);
    setEditingBlock(null);
    setShowBlockForm(false);
  };

  const deleteBlock = async (blockId: string) => {
    if (!selectedWeek) return;
    const updatedWeek = {
      ...selectedWeek,
      blocks: selectedWeek.blocks.filter(b => b.id !== blockId),
    };
    await onSave(updatedWeek);
    setSelectedWeek(updatedWeek);
  };

  const getBlocksForDay = (dayOfWeek: number) => {
    if (!selectedWeek) return [];
    return selectedWeek.blocks.filter(b => b.dayOfWeek === dayOfWeek);
  };

  const getBlockPosition = (block: IdealWeekBlock) => {
    const startHour = parseInt(block.startTime.split(':')[0]);
    const endHour = parseInt(block.endTime.split(':')[0]);
    const startMinute = parseInt(block.startTime.split(':')[1]);
    const endMinute = parseInt(block.endTime.split(':')[1]);

    const top = (startHour - 6) * 48 + (startMinute / 60) * 48;
    const height = ((endHour - startHour) * 60 + (endMinute - startMinute)) / 60 * 48;

    return { top: `${top}px`, height: `${Math.max(height, 24)}px` };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-amber-200 pb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-3">
            <Clock className="w-8 h-8 text-amber-700" />
            Ideal Week
          </h1>
          <p className="text-sm opacity-60 mt-1">
            Design your perfect week template
          </p>
        </div>

        <div className="flex items-center gap-3">
          {idealWeeks.length > 0 && (
            <select
              value={selectedWeek?.id || ''}
              onChange={(e) => {
                const week = idealWeeks.find(w => w.id === e.target.value);
                setSelectedWeek(week || null);
              }}
              className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 font-medium"
            >
              {idealWeeks.map(week => (
                <option key={week.id} value={week.id}>
                  {week.name} {week.isActive ? '(Active)' : ''}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={() => setShowNewWeekForm(true)}
            className="flex items-center gap-2 bg-amber-700 text-white px-4 py-2 rounded-lg hover:bg-amber-800 transition-colors touch-manipulation"
          >
            <Plus className="w-5 h-5" />
            New Template
          </button>
        </div>
      </div>

      {/* Week Actions */}
      {selectedWeek && (
        <div className="flex items-center gap-3">
          {!selectedWeek.isActive && (
            <button
              onClick={() => setWeekActive(selectedWeek)}
              className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors"
            >
              <Check className="w-4 h-4" />
              Set as Active
            </button>
          )}
          <button
            onClick={() => {
              if (confirm('Delete this template?')) {
                onDelete(selectedWeek.id);
                setSelectedWeek(idealWeeks.find(w => w.id !== selectedWeek.id) || null);
              }
            }}
            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      )}

      {/* Category Legend */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(CATEGORY_COLORS).map(([category, color]) => (
          <span key={category} className={`px-3 py-1 rounded-full text-xs font-medium ${color}`}>
            {category.replace('_', ' ')}
          </span>
        ))}
      </div>

      {/* Week Grid */}
      {selectedWeek ? (
        <div className="planner-card overflow-x-auto">
          <div className="min-w-[900px]">
            {/* Day Headers */}
            <div className="grid grid-cols-8 border-b border-amber-200">
              <div className="p-2 text-center font-semibold text-sm opacity-60">Time</div>
              {DAYS.map((day, index) => (
                <div key={day} className="p-2 text-center font-semibold border-l border-amber-200">
                  {day}
                </div>
              ))}
            </div>

            {/* Time Grid */}
            <div className="grid grid-cols-8 relative" style={{ height: '864px' }}>
              {/* Time Labels */}
              <div className="border-r border-amber-200">
                {HOURS.filter(h => h >= 6 && h < 24).map(hour => (
                  <div
                    key={hour}
                    className="h-12 border-b border-amber-100 px-2 text-xs text-right opacity-60 pt-1"
                  >
                    {hour.toString().padStart(2, '0')}:00
                  </div>
                ))}
              </div>

              {/* Day Columns */}
              {DAYS.map((_, dayIndex) => (
                <div key={dayIndex} className="relative border-l border-amber-200">
                  {/* Hour slots */}
                  {HOURS.filter(h => h >= 6 && h < 24).map(hour => (
                    <div
                      key={hour}
                      className="h-12 border-b border-amber-100 hover:bg-amber-50 cursor-pointer transition-colors"
                      onClick={() => addBlock(dayIndex, hour)}
                    />
                  ))}

                  {/* Blocks */}
                  {getBlocksForDay(dayIndex).map(block => {
                    const pos = getBlockPosition(block);
                    return (
                      <div
                        key={block.id}
                        className={`absolute left-1 right-1 rounded px-2 py-1 text-xs cursor-pointer border ${CATEGORY_COLORS[block.category]} overflow-hidden`}
                        style={pos}
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingBlock(block);
                          setShowBlockForm(true);
                        }}
                      >
                        <div className="font-medium truncate">{block.title}</div>
                        <div className="opacity-70 truncate">
                          {block.startTime} - {block.endTime}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-16">
          <Clock className="w-16 h-16 text-amber-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">No Ideal Week Templates</h3>
          <p className="opacity-60 mb-6">Create your first template to design your perfect week</p>
          <button
            onClick={() => setShowNewWeekForm(true)}
            className="inline-flex items-center gap-2 bg-amber-700 text-white px-6 py-3 rounded-lg hover:bg-amber-800"
          >
            <Plus className="w-5 h-5" />
            Create Template
          </button>
        </div>
      )}

      {/* New Week Modal */}
      {showNewWeekForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">New Ideal Week Template</h2>
            <input
              type="text"
              value={newWeekName}
              onChange={(e) => setNewWeekName(e.target.value)}
              placeholder="Template name (e.g., Default, Summer, Project Mode)"
              className="w-full bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4 focus:border-amber-500 outline-none"
              autoFocus
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowNewWeekForm(false);
                  setNewWeekName('');
                }}
                className="px-4 py-2 text-amber-700 hover:bg-amber-50 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={createNewWeek}
                className="px-4 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Block Editor Modal */}
      {showBlockForm && editingBlock && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">
              {selectedWeek?.blocks.some(b => b.id === editingBlock.id) ? 'Edit Block' : 'Add Block'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Title</label>
                <input
                  type="text"
                  value={editingBlock.title}
                  onChange={(e) => setEditingBlock({ ...editingBlock, title: e.target.value })}
                  placeholder="Block title"
                  className="w-full bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 focus:border-amber-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Start Time</label>
                  <input
                    type="time"
                    value={editingBlock.startTime}
                    onChange={(e) => setEditingBlock({ ...editingBlock, startTime: e.target.value })}
                    className="w-full bg-amber-50 border border-amber-200 rounded-lg px-4 py-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">End Time</label>
                  <input
                    type="time"
                    value={editingBlock.endTime}
                    onChange={(e) => setEditingBlock({ ...editingBlock, endTime: e.target.value })}
                    className="w-full bg-amber-50 border border-amber-200 rounded-lg px-4 py-3"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Day</label>
                <select
                  value={editingBlock.dayOfWeek}
                  onChange={(e) => setEditingBlock({ ...editingBlock, dayOfWeek: parseInt(e.target.value) as IdealWeekBlock['dayOfWeek'] })}
                  className="w-full bg-amber-50 border border-amber-200 rounded-lg px-4 py-3"
                >
                  {DAYS.map((day, index) => (
                    <option key={day} value={index}>{day}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Category</label>
                <select
                  value={editingBlock.category}
                  onChange={(e) => setEditingBlock({ ...editingBlock, category: e.target.value as IdealWeekBlock['category'] })}
                  className="w-full bg-amber-50 border border-amber-200 rounded-lg px-4 py-3"
                >
                  <option value="deep_work">Deep Work</option>
                  <option value="meetings">Meetings</option>
                  <option value="self_care">Self Care</option>
                  <option value="admin">Admin</option>
                  <option value="personal">Personal</option>
                  <option value="buffer">Buffer</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="flex justify-between mt-6">
              {selectedWeek?.blocks.some(b => b.id === editingBlock.id) && (
                <button
                  onClick={() => {
                    deleteBlock(editingBlock.id);
                    setShowBlockForm(false);
                    setEditingBlock(null);
                  }}
                  className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  Delete
                </button>
              )}
              <div className="flex gap-3 ml-auto">
                <button
                  onClick={() => {
                    setShowBlockForm(false);
                    setEditingBlock(null);
                  }}
                  className="px-4 py-2 text-amber-700 hover:bg-amber-50 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={saveBlock}
                  className="px-4 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IdealWeekView;
