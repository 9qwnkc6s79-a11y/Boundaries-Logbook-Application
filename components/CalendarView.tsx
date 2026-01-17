import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { CalendarEvent, DailyPage, QuarterlyGoal, generateId } from '../types';

interface CalendarViewProps {
  events: CalendarEvent[];
  dailyPages: DailyPage[];
  quarterlyGoals: QuarterlyGoal[];
  year: number;
  onSaveEvent: (event: CalendarEvent) => Promise<void>;
  onDeleteEvent: (id: string) => Promise<void>;
  onNavigateToDaily: (date: string) => void;
  onYearChange: (year: number) => void;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const CalendarView: React.FC<CalendarViewProps> = ({
  events,
  dailyPages,
  quarterlyGoals,
  year,
  onSaveEvent,
  onDeleteEvent,
  onNavigateToDaily,
  onYearChange,
}) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const getEventsForDate = (date: string) => {
    return events.filter(e => e.date === date);
  };

  const hasPage = (date: string) => {
    return dailyPages.some(p => p.date === date);
  };

  const createNewEvent = (date: string): CalendarEvent => ({
    id: generateId(),
    title: '',
    date,
    isAllDay: true,
    category: 'event',
  });

  const handleSaveEvent = async () => {
    if (!editingEvent || !editingEvent.title.trim()) {
      alert('Please enter an event title');
      return;
    }
    await onSaveEvent(editingEvent);
    setEditingEvent(null);
    setShowEventForm(false);
  };

  const handleDeleteEvent = async (id: string) => {
    if (confirm('Delete this event?')) {
      await onDeleteEvent(id);
    }
  };

  const getCategoryColor = (category: CalendarEvent['category']) => {
    switch (category) {
      case 'deadline': return 'bg-red-200 text-red-800';
      case 'event': return 'bg-blue-200 text-blue-800';
      case 'reminder': return 'bg-yellow-200 text-yellow-800';
      case 'holiday': return 'bg-green-200 text-green-800';
      case 'milestone': return 'bg-purple-200 text-purple-800';
      default: return 'bg-gray-200 text-gray-800';
    }
  };

  const renderMonth = (monthIndex: number) => {
    const daysInMonth = getDaysInMonth(monthIndex, year);
    const firstDay = getFirstDayOfMonth(monthIndex, year);
    const days = [];

    // Empty cells for days before the first of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-1" />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${(monthIndex + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const dayEvents = getEventsForDate(dateStr);
      const isToday = dateStr === new Date().toISOString().split('T')[0];
      const pageExists = hasPage(dateStr);

      days.push(
        <button
          key={day}
          onClick={() => {
            setSelectedDate(dateStr);
            onNavigateToDaily(dateStr);
          }}
          className={`p-1 text-sm rounded-lg transition-colors hover:bg-amber-100 relative min-h-[40px] ${
            isToday ? 'bg-amber-200 font-bold' : ''
          } ${pageExists ? 'ring-2 ring-amber-400 ring-inset' : ''}`}
        >
          <span className="block">{day}</span>
          {dayEvents.length > 0 && (
            <div className="flex flex-wrap gap-0.5 mt-0.5">
              {dayEvents.slice(0, 2).map(event => (
                <span
                  key={event.id}
                  className={`block w-1.5 h-1.5 rounded-full ${getCategoryColor(event.category).split(' ')[0]}`}
                />
              ))}
              {dayEvents.length > 2 && (
                <span className="text-[8px] opacity-50">+{dayEvents.length - 2}</span>
              )}
            </div>
          )}
        </button>
      );
    }

    return days;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-amber-200 pb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Calendar</h1>
          <p className="text-sm opacity-60 mt-1">
            12-month view with events and daily pages
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onYearChange(year - 1)}
            className="p-2 rounded-lg hover:bg-amber-100 transition-colors touch-manipulation"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-xl font-bold min-w-[80px] text-center">{year}</span>
          <button
            onClick={() => onYearChange(year + 1)}
            className="p-2 rounded-lg hover:bg-amber-100 transition-colors touch-manipulation"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <button
            onClick={() => {
              setEditingEvent(createNewEvent(new Date().toISOString().split('T')[0]));
              setShowEventForm(true);
            }}
            className="flex items-center gap-2 bg-amber-700 text-white px-4 py-2 rounded-lg hover:bg-amber-800 transition-colors touch-manipulation ml-4"
          >
            <Plus className="w-5 h-5" />
            Add Event
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-sm">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-red-200" /> Deadline
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-blue-200" /> Event
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-yellow-200" /> Reminder
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-green-200" /> Holiday
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-purple-200" /> Milestone
        </span>
        <span className="flex items-center gap-1 ml-4">
          <span className="w-4 h-4 rounded ring-2 ring-amber-400" /> Has daily page
        </span>
      </div>

      {/* 12-Month Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {MONTHS.map((monthName, monthIndex) => (
          <div key={monthName} className="planner-card p-4">
            <h3 className="font-bold text-center mb-2">{monthName}</h3>
            <div className="grid grid-cols-7 gap-0.5 text-center">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <div key={i} className="text-xs font-semibold opacity-50 p-1">
                  {d}
                </div>
              ))}
              {renderMonth(monthIndex)}
            </div>
          </div>
        ))}
      </div>

      {/* Upcoming Events */}
      <div className="planner-card p-6">
        <h2 className="text-xl font-bold mb-4">Upcoming Events</h2>

        {(() => {
          const today = new Date().toISOString().split('T')[0];
          const upcoming = events
            .filter(e => e.date >= today)
            .sort((a, b) => a.date.localeCompare(b.date))
            .slice(0, 10);

          if (upcoming.length === 0) {
            return <p className="text-center py-8 opacity-50">No upcoming events</p>;
          }

          return (
            <div className="space-y-2">
              {upcoming.map(event => (
                <div key={event.id} className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg group">
                  <div className={`w-3 h-3 rounded-full ${getCategoryColor(event.category).split(' ')[0]}`} />
                  <div className="flex-1">
                    <div className="font-medium">{event.title}</div>
                    <div className="text-sm opacity-60">
                      {new Date(event.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                      {event.time && ` at ${event.time}`}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setEditingEvent(event);
                      setShowEventForm(true);
                    }}
                    className="p-2 opacity-0 group-hover:opacity-100 text-amber-700 hover:bg-amber-100 rounded transition-all"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteEvent(event.id)}
                    className="p-2 opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-50 rounded transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          );
        })()}
      </div>

      {/* Event Form Modal */}
      {showEventForm && editingEvent && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">
              {events.some(e => e.id === editingEvent.id) ? 'Edit Event' : 'New Event'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Event Title *</label>
                <input
                  type="text"
                  value={editingEvent.title}
                  onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                  placeholder="Event name"
                  className="w-full bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 focus:border-amber-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Date</label>
                  <input
                    type="date"
                    value={editingEvent.date}
                    onChange={(e) => setEditingEvent({ ...editingEvent, date: e.target.value })}
                    className="w-full bg-amber-50 border border-amber-200 rounded-lg px-4 py-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Category</label>
                  <select
                    value={editingEvent.category}
                    onChange={(e) => setEditingEvent({ ...editingEvent, category: e.target.value as CalendarEvent['category'] })}
                    className="w-full bg-amber-50 border border-amber-200 rounded-lg px-4 py-3"
                  >
                    <option value="event">Event</option>
                    <option value="deadline">Deadline</option>
                    <option value="reminder">Reminder</option>
                    <option value="holiday">Holiday</option>
                    <option value="milestone">Milestone</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="all-day"
                  checked={editingEvent.isAllDay}
                  onChange={(e) => setEditingEvent({ ...editingEvent, isAllDay: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="all-day" className="text-sm font-medium">All day event</label>
              </div>

              {!editingEvent.isAllDay && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Start Time</label>
                    <input
                      type="time"
                      value={editingEvent.time || ''}
                      onChange={(e) => setEditingEvent({ ...editingEvent, time: e.target.value })}
                      className="w-full bg-amber-50 border border-amber-200 rounded-lg px-4 py-3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">End Time</label>
                    <input
                      type="time"
                      value={editingEvent.endTime || ''}
                      onChange={(e) => setEditingEvent({ ...editingEvent, endTime: e.target.value })}
                      className="w-full bg-amber-50 border border-amber-200 rounded-lg px-4 py-3"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold mb-2">Notes</label>
                <textarea
                  value={editingEvent.notes || ''}
                  onChange={(e) => setEditingEvent({ ...editingEvent, notes: e.target.value })}
                  placeholder="Additional details..."
                  rows={2}
                  className="w-full bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 focus:border-amber-500 outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowEventForm(false);
                  setEditingEvent(null);
                }}
                className="px-4 py-2 text-amber-700 hover:bg-amber-50 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEvent}
                className="px-4 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800"
              >
                Save Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarView;
