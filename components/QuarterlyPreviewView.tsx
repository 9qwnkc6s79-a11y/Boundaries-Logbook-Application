import React, { useState, useEffect } from 'react';
import { Sunrise, Plus, Trash2 } from 'lucide-react';
import { QuarterlyPreview, QuarterlyGoal, Quarter, LifeDomain, generateId } from '../types';

interface QuarterlyPreviewViewProps {
  year: number;
  quarter: Quarter;
  preview?: QuarterlyPreview;
  quarterlyGoals: QuarterlyGoal[];
  onSave: (preview: QuarterlyPreview) => Promise<void>;
  onQuarterChange: (quarter: Quarter) => void;
}

const QuarterlyPreviewView: React.FC<QuarterlyPreviewViewProps> = ({
  year,
  quarter,
  preview,
  quarterlyGoals,
  onSave,
  onQuarterChange,
}) => {
  const [currentPreview, setCurrentPreview] = useState<QuarterlyPreview>(() =>
    preview || createEmptyPreview(year, quarter)
  );

  useEffect(() => {
    if (preview) {
      setCurrentPreview(preview);
    } else {
      setCurrentPreview(createEmptyPreview(year, quarter));
    }
  }, [preview, year, quarter]);

  const savePreview = async (updates: Partial<QuarterlyPreview>) => {
    const updated = { ...currentPreview, ...updates, updatedAt: new Date().toISOString() };
    setCurrentPreview(updated);
    await onSave(updated);
  };

  const updateDomainReflection = (domain: LifeDomain, field: 'currentState' | 'desiredState' | 'rating', value: string | number) => {
    const existing = currentPreview.domainReflections.find(r => r.domain === domain);
    if (existing) {
      savePreview({
        domainReflections: currentPreview.domainReflections.map(r =>
          r.domain === domain ? { ...r, [field]: value } : r
        ),
      });
    } else {
      savePreview({
        domainReflections: [
          ...currentPreview.domainReflections,
          { domain, currentState: '', desiredState: '', rating: 5, [field]: value },
        ],
      });
    }
  };

  const getDomainReflection = (domain: LifeDomain) => {
    return currentPreview.domainReflections.find(r => r.domain === domain) || {
      domain,
      currentState: '',
      desiredState: '',
      rating: 5,
    };
  };

  const addKeyDate = () => {
    savePreview({
      keyDates: [...currentPreview.keyDates, { date: '', event: '' }],
    });
  };

  const updateKeyDate = (index: number, field: 'date' | 'event', value: string) => {
    const newDates = [...currentPreview.keyDates];
    newDates[index] = { ...newDates[index], [field]: value };
    savePreview({ keyDates: newDates });
  };

  const removeKeyDate = (index: number) => {
    savePreview({ keyDates: currentPreview.keyDates.filter((_, i) => i !== index) });
  };

  const addFocusArea = () => {
    savePreview({ focusAreas: [...currentPreview.focusAreas, ''] });
  };

  const updateFocusArea = (index: number, value: string) => {
    const newAreas = [...currentPreview.focusAreas];
    newAreas[index] = value;
    savePreview({ focusAreas: newAreas });
  };

  const removeFocusArea = (index: number) => {
    savePreview({ focusAreas: currentPreview.focusAreas.filter((_, i) => i !== index) });
  };

  const quarters: Quarter[] = [Quarter.Q1, Quarter.Q2, Quarter.Q3, Quarter.Q4];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-amber-200 pb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-3">
            <Sunrise className="w-8 h-8 text-amber-700" />
            Quarterly Preview
          </h1>
          <p className="text-sm opacity-60 mt-1">
            Plan and prepare for the quarter ahead
          </p>
        </div>

        <select
          value={quarter}
          onChange={(e) => onQuarterChange(e.target.value as Quarter)}
          className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 font-medium"
        >
          {quarters.map(q => (
            <option key={q} value={q}>{q} {year}</option>
          ))}
        </select>
      </div>

      {/* Life Domains Assessment */}
      <div className="planner-card p-6">
        <h2 className="text-xl font-bold mb-4">Life Domains Assessment</h2>
        <p className="text-sm opacity-60 mb-6">
          Rate each area of your life from 1-10 and reflect on where you are vs. where you want to be.
        </p>

        <div className="space-y-6">
          {Object.values(LifeDomain).map(domain => {
            const reflection = getDomainReflection(domain);
            return (
              <div key={domain} className="bg-amber-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold">{domain}</h3>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(score => (
                      <button
                        key={score}
                        onClick={() => updateDomainReflection(domain, 'rating', score)}
                        className={`w-7 h-7 rounded text-xs font-bold transition-all touch-manipulation ${
                          reflection.rating === score
                            ? 'bg-amber-600 text-white'
                            : 'bg-white text-amber-800 hover:bg-amber-200'
                        }`}
                      >
                        {score}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid lg:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold opacity-60 block mb-1">
                      Current State
                    </label>
                    <textarea
                      value={reflection.currentState}
                      onChange={(e) => updateDomainReflection(domain, 'currentState', e.target.value)}
                      placeholder="Where are you now?"
                      className="w-full bg-white border border-amber-200 rounded px-3 py-2 text-sm focus:border-amber-500 outline-none resize-none"
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold opacity-60 block mb-1">
                      Desired State
                    </label>
                    <textarea
                      value={reflection.desiredState}
                      onChange={(e) => updateDomainReflection(domain, 'desiredState', e.target.value)}
                      placeholder="Where do you want to be?"
                      className="w-full bg-white border border-amber-200 rounded px-3 py-2 text-sm focus:border-amber-500 outline-none resize-none"
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Quarterly Goals Summary */}
        <div className="planner-card p-6">
          <h2 className="text-xl font-bold mb-4">Quarterly Big 3 Goals</h2>

          {quarterlyGoals.length > 0 ? (
            <div className="space-y-3">
              {quarterlyGoals.sort((a, b) => a.rank - b.rank).map(goal => (
                <div key={goal.id} className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg">
                  <span className="w-8 h-8 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center font-bold flex-shrink-0">
                    {goal.rank}
                  </span>
                  <div>
                    <div className="font-medium">{goal.title}</div>
                    <div className="text-sm opacity-60">{goal.domain}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-8 opacity-50">No quarterly goals set yet</p>
          )}
        </div>

        {/* Focus Areas */}
        <div className="planner-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Focus Areas</h2>
            <button
              onClick={addFocusArea}
              className="p-2 rounded-lg hover:bg-amber-100 transition-colors touch-manipulation"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          <p className="text-sm opacity-60 mb-4">
            Key themes or areas to prioritize this quarter
          </p>

          {currentPreview.focusAreas.length > 0 ? (
            <div className="space-y-2">
              {currentPreview.focusAreas.map((area, index) => (
                <div key={index} className="flex items-center gap-2 group">
                  <span className="text-amber-500">→</span>
                  <input
                    type="text"
                    value={area}
                    onChange={(e) => updateFocusArea(index, e.target.value)}
                    placeholder="Focus area..."
                    className="flex-1 bg-transparent border-b border-amber-200 focus:border-amber-500 outline-none py-1"
                  />
                  <button
                    onClick={() => removeFocusArea(index)}
                    className="p-1 opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-50 rounded transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-4 opacity-50">Add your focus areas</p>
          )}
        </div>

        {/* Key Dates */}
        <div className="planner-card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Key Dates & Events</h2>
            <button
              onClick={addKeyDate}
              className="p-2 rounded-lg hover:bg-amber-100 transition-colors touch-manipulation"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {currentPreview.keyDates.length > 0 ? (
            <div className="grid lg:grid-cols-2 gap-2">
              {currentPreview.keyDates.map((item, index) => (
                <div key={index} className="flex items-center gap-2 group">
                  <input
                    type="date"
                    value={item.date}
                    onChange={(e) => updateKeyDate(index, 'date', e.target.value)}
                    className="bg-amber-50 border border-amber-200 rounded px-2 py-1 text-sm"
                  />
                  <input
                    type="text"
                    value={item.event}
                    onChange={(e) => updateKeyDate(index, 'event', e.target.value)}
                    placeholder="Event..."
                    className="flex-1 bg-transparent border-b border-amber-200 focus:border-amber-500 outline-none py-1"
                  />
                  <button
                    onClick={() => removeKeyDate(index)}
                    className="p-1 opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-50 rounded transition-all"
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
      </div>

      {/* Notes */}
      <div className="planner-card p-6">
        <h2 className="text-xl font-bold mb-4">Quarterly Notes</h2>
        <textarea
          value={currentPreview.notes}
          onChange={(e) => savePreview({ notes: e.target.value })}
          placeholder="Additional thoughts, plans, intentions for the quarter..."
          className="w-full min-h-[150px] bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 focus:border-amber-500 outline-none resize-y"
        />
      </div>
    </div>
  );
};

function createEmptyPreview(year: number, quarter: Quarter): QuarterlyPreview {
  return {
    id: generateId(),
    year,
    quarter,
    domainReflections: [],
    quarterlyGoalIds: [],
    keyDates: [],
    focusAreas: [],
    notes: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export default QuarterlyPreviewView;
