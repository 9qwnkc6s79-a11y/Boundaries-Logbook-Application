import React, { useState, useEffect } from 'react';
import { CheckSquare, Plus, Trash2, Star, ThumbsUp, ThumbsDown, Lightbulb } from 'lucide-react';
import { WeeklyReview, QuarterlyGoal, generateId } from '../types';

interface WeeklyReviewViewProps {
  year: number;
  weekNumber: number;
  review?: WeeklyReview;
  quarterlyGoals: QuarterlyGoal[];
  onSave: (review: WeeklyReview) => Promise<void>;
}

const WeeklyReviewView: React.FC<WeeklyReviewViewProps> = ({
  year,
  weekNumber,
  review,
  quarterlyGoals,
  onSave,
}) => {
  const [currentReview, setCurrentReview] = useState<WeeklyReview>(() =>
    review || createEmptyReview(year, weekNumber)
  );

  useEffect(() => {
    if (review) {
      setCurrentReview(review);
    } else {
      setCurrentReview(createEmptyReview(year, weekNumber));
    }
  }, [review, year, weekNumber]);

  const saveReview = async (updates: Partial<WeeklyReview>) => {
    const updated = { ...currentReview, ...updates };
    setCurrentReview(updated);
    await onSave(updated);
  };

  const addItem = (field: 'biggestWins' | 'accomplishments' | 'incomplete' | 'lessonsLearned' | 'gratitude') => {
    saveReview({ [field]: [...currentReview[field], ''] });
  };

  const updateItem = (field: 'biggestWins' | 'accomplishments' | 'incomplete' | 'lessonsLearned' | 'gratitude', index: number, value: string) => {
    const newItems = [...currentReview[field]];
    newItems[index] = value;
    saveReview({ [field]: newItems });
  };

  const removeItem = (field: 'biggestWins' | 'accomplishments' | 'incomplete' | 'lessonsLearned' | 'gratitude', index: number) => {
    saveReview({ [field]: currentReview[field].filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-amber-200 pb-6">
        <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-3">
          <CheckSquare className="w-8 h-8 text-amber-700" />
          Week {weekNumber} Review
        </h1>
        <p className="text-sm opacity-60 mt-1">
          Reflect on your week and prepare for the next one
        </p>
      </div>

      {/* Overall Score */}
      <div className="planner-card p-6">
        <h2 className="text-xl font-bold mb-4">Overall Week Rating</h2>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(score => (
            <button
              key={score}
              onClick={() => saveReview({ overallScore: score })}
              className={`w-10 h-10 rounded-full font-bold transition-all touch-manipulation ${
                currentReview.overallScore === score
                  ? 'bg-amber-600 text-white scale-110'
                  : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
              }`}
            >
              {score}
            </button>
          ))}
        </div>
        <p className="text-sm opacity-60 mt-2">
          Rate your week from 1 (challenging) to 10 (exceptional)
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Biggest Wins */}
        <div className="planner-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              Biggest Wins
            </h2>
            <button
              onClick={() => addItem('biggestWins')}
              className="p-2 rounded-lg hover:bg-amber-100 transition-colors touch-manipulation"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-2">
            {currentReview.biggestWins.map((win, index) => (
              <div key={index} className="flex items-center gap-2 group">
                <span className="text-yellow-500">★</span>
                <input
                  type="text"
                  value={win}
                  onChange={(e) => updateItem('biggestWins', index, e.target.value)}
                  placeholder="What went well?"
                  className="flex-1 bg-transparent border-b border-amber-200 focus:border-amber-500 outline-none py-1"
                />
                <button
                  onClick={() => removeItem('biggestWins', index)}
                  className="p-1 opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-50 rounded transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {currentReview.biggestWins.length === 0 && (
              <p className="text-center py-4 opacity-50">What were your wins this week?</p>
            )}
          </div>
        </div>

        {/* Accomplishments */}
        <div className="planner-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <ThumbsUp className="w-5 h-5 text-green-500" />
              Accomplishments
            </h2>
            <button
              onClick={() => addItem('accomplishments')}
              className="p-2 rounded-lg hover:bg-amber-100 transition-colors touch-manipulation"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-2">
            {currentReview.accomplishments.map((item, index) => (
              <div key={index} className="flex items-center gap-2 group">
                <span className="text-green-500">✓</span>
                <input
                  type="text"
                  value={item}
                  onChange={(e) => updateItem('accomplishments', index, e.target.value)}
                  placeholder="What did you complete?"
                  className="flex-1 bg-transparent border-b border-amber-200 focus:border-amber-500 outline-none py-1"
                />
                <button
                  onClick={() => removeItem('accomplishments', index)}
                  className="p-1 opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-50 rounded transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {currentReview.accomplishments.length === 0 && (
              <p className="text-center py-4 opacity-50">List your accomplishments</p>
            )}
          </div>
        </div>

        {/* Incomplete */}
        <div className="planner-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <ThumbsDown className="w-5 h-5 text-orange-500" />
              Didn't Get Done
            </h2>
            <button
              onClick={() => addItem('incomplete')}
              className="p-2 rounded-lg hover:bg-amber-100 transition-colors touch-manipulation"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-2">
            {currentReview.incomplete.map((item, index) => (
              <div key={index} className="flex items-center gap-2 group">
                <span className="text-orange-500">○</span>
                <input
                  type="text"
                  value={item}
                  onChange={(e) => updateItem('incomplete', index, e.target.value)}
                  placeholder="What didn't get done?"
                  className="flex-1 bg-transparent border-b border-amber-200 focus:border-amber-500 outline-none py-1"
                />
                <button
                  onClick={() => removeItem('incomplete', index)}
                  className="p-1 opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-50 rounded transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {currentReview.incomplete.length === 0 && (
              <p className="text-center py-4 opacity-50">What didn't get done?</p>
            )}
          </div>
        </div>

        {/* Lessons Learned */}
        <div className="planner-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-blue-500" />
              Lessons Learned
            </h2>
            <button
              onClick={() => addItem('lessonsLearned')}
              className="p-2 rounded-lg hover:bg-amber-100 transition-colors touch-manipulation"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-2">
            {currentReview.lessonsLearned.map((item, index) => (
              <div key={index} className="flex items-center gap-2 group">
                <span className="text-blue-500">💡</span>
                <input
                  type="text"
                  value={item}
                  onChange={(e) => updateItem('lessonsLearned', index, e.target.value)}
                  placeholder="What did you learn?"
                  className="flex-1 bg-transparent border-b border-amber-200 focus:border-amber-500 outline-none py-1"
                />
                <button
                  onClick={() => removeItem('lessonsLearned', index)}
                  className="p-1 opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-50 rounded transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {currentReview.lessonsLearned.length === 0 && (
              <p className="text-center py-4 opacity-50">What insights did you gain?</p>
            )}
          </div>
        </div>
      </div>

      {/* Gratitude */}
      <div className="planner-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Weekly Gratitude</h2>
          <button
            onClick={() => addItem('gratitude')}
            className="p-2 rounded-lg hover:bg-pink-100 transition-colors touch-manipulation"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-2">
          {currentReview.gratitude.map((item, index) => (
            <div key={index} className="flex items-center gap-2 group bg-pink-50 rounded-lg p-2">
              <span className="text-pink-500">♥</span>
              <input
                type="text"
                value={item}
                onChange={(e) => updateItem('gratitude', index, e.target.value)}
                placeholder="Grateful for..."
                className="flex-1 bg-transparent border-b border-pink-200 focus:border-pink-500 outline-none py-1 text-sm"
              />
              <button
                onClick={() => removeItem('gratitude', index)}
                className="p-1 opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-50 rounded transition-all"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Next Week Focus */}
      <div className="planner-card p-6">
        <h2 className="text-xl font-bold mb-4">Next Week's Focus</h2>
        <textarea
          value={currentReview.nextWeekFocus || ''}
          onChange={(e) => saveReview({ nextWeekFocus: e.target.value })}
          placeholder="What's most important for next week?"
          className="w-full bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 focus:border-amber-500 outline-none resize-none"
          rows={3}
        />
      </div>

      {/* Notes */}
      <div className="planner-card p-6">
        <h2 className="text-xl font-bold mb-4">Additional Notes</h2>
        <textarea
          value={currentReview.notes}
          onChange={(e) => saveReview({ notes: e.target.value })}
          placeholder="Any other reflections..."
          className="w-full min-h-[100px] bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 focus:border-amber-500 outline-none resize-y"
        />
      </div>
    </div>
  );
};

function createEmptyReview(year: number, weekNumber: number): WeeklyReview {
  return {
    id: generateId(),
    year,
    weekNumber,
    biggestWins: [],
    accomplishments: [],
    incomplete: [],
    lessonsLearned: [],
    gratitude: [],
    notes: '',
    createdAt: new Date().toISOString(),
  };
}

export default WeeklyReviewView;
