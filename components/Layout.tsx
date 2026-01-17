import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Target,
  CheckSquare,
  BookOpen,
  Clock,
  FolderOpen,
  FileText,
  Search,
  Settings,
  Menu,
  X,
  Home,
  Sun,
  Sunrise,
  BarChart3,
  CalendarDays,
  ListTodo,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { ViewType, UserSettings, Quarter } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentView: ViewType;
  settings: UserSettings;
  onNavigate: (view: ViewType) => void;
  selectedDate?: string;
  selectedYear?: number;
  selectedQuarter?: Quarter;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  currentView,
  settings,
  onNavigate,
  selectedDate,
  selectedYear,
  selectedQuarter,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Apply theme and font settings to body
  useEffect(() => {
    const body = document.body;

    // Remove old theme classes
    body.classList.remove('theme-paper', 'theme-light', 'theme-sepia', 'theme-dark');
    body.classList.add(`theme-${settings.theme}`);

    // Remove old font size classes
    body.classList.remove('font-size-small', 'font-size-medium', 'font-size-large');
    body.classList.add(`font-size-${settings.fontSize}`);

    // Remove old font family classes
    body.classList.remove('font-family-serif', 'font-family-sans', 'font-family-handwriting');
    if (settings.fontFamily === 'sans-serif') {
      body.classList.add('font-family-sans');
    } else if (settings.fontFamily === 'handwriting') {
      body.classList.add('font-family-handwriting');
    }
  }, [settings.theme, settings.fontSize, settings.fontFamily]);

  const navItems = [
    { view: 'dashboard' as ViewType, icon: Home, label: 'Dashboard' },
    { view: 'daily_page' as ViewType, icon: Sun, label: 'Today' },
    { view: 'calendar' as ViewType, icon: CalendarDays, label: 'Calendar' },
    { divider: true, label: 'Goals' },
    { view: 'annual_goals' as ViewType, icon: Target, label: 'Annual Goals' },
    { view: 'quarterly_goals' as ViewType, icon: BarChart3, label: 'Quarterly Big 3' },
    { view: 'quarterly_preview' as ViewType, icon: Sunrise, label: 'Quarterly Preview' },
    { divider: true, label: 'Weekly' },
    { view: 'weekly_preview' as ViewType, icon: ListTodo, label: 'Weekly Preview' },
    { view: 'weekly_review' as ViewType, icon: CheckSquare, label: 'Weekly Review' },
    { divider: true, label: 'Planning' },
    { view: 'ideal_week' as ViewType, icon: Clock, label: 'Ideal Week' },
    { view: 'rituals' as ViewType, icon: Sunrise, label: 'Daily Rituals' },
    { view: 'projects' as ViewType, icon: FolderOpen, label: 'Projects' },
    { divider: true, label: 'Reference' },
    { view: 'notes' as ViewType, icon: FileText, label: 'Notes' },
    { view: 'search' as ViewType, icon: Search, label: 'Search' },
    { view: 'settings' as ViewType, icon: Settings, label: 'Settings' },
  ];

  // Theme-aware classes using CSS variables
  const isDark = settings.theme === 'dark';

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* Mobile Header */}
      <header
        className="lg:hidden fixed top-0 left-0 right-0 z-50 border-b px-4 py-3 flex items-center justify-between pt-safe"
        style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
      >
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-lg hover:opacity-80 touch-manipulation"
        >
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-bold tracking-tight">Full Focus Planner</h1>
        <button
          onClick={() => onNavigate('search')}
          className="p-2 rounded-lg hover:opacity-80 touch-manipulation"
        >
          <Search className="w-6 h-6" />
        </button>
      </header>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 modal-backdrop z-50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 border-r z-50 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
        style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="p-6 border-b" style={{ borderColor: 'var(--border-color)' }}>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold tracking-tight">Full Focus</h1>
                <p className="text-sm opacity-70">Planner</p>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-2 rounded-lg hover:opacity-80"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {selectedDate && (
              <div className="mt-4 text-sm opacity-80">
                {formatDate(selectedDate)}
              </div>
            )}
            {selectedYear && selectedQuarter && (
              <div className="mt-1 text-xs opacity-60">
                {selectedYear} • {selectedQuarter}
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-1">
              {navItems.map((item, index) => {
                if ('divider' in item && item.divider) {
                  return (
                    <li key={index} className="pt-4 pb-2">
                      <span className="text-xs font-semibold uppercase tracking-wider opacity-50">
                        {item.label}
                      </span>
                    </li>
                  );
                }

                const Icon = item.icon!;
                const isActive = currentView === item.view;

                return (
                  <li key={index}>
                    <button
                      onClick={() => {
                        onNavigate(item.view!);
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors touch-manipulation`}
                      style={isActive ? {
                        backgroundColor: 'var(--accent-light)',
                        color: 'var(--accent-color)',
                      } : undefined}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
            <div className="text-xs opacity-50 text-center">
              Your personal productivity system
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-72 min-h-screen pt-16 lg:pt-0 pb-20 lg:pb-0">
        <div className="max-w-6xl mx-auto p-4 lg:p-8 page-transition">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t pb-safe"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
      >
        <div className="flex justify-around py-2">
          {[
            { view: 'dashboard' as ViewType, icon: Home, label: 'Home' },
            { view: 'daily_page' as ViewType, icon: Sun, label: 'Today' },
            { view: 'quarterly_goals' as ViewType, icon: Target, label: 'Goals' },
            { view: 'notes' as ViewType, icon: FileText, label: 'Notes' },
            { view: 'settings' as ViewType, icon: Settings, label: 'More' },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.view;
            return (
              <button
                key={item.view}
                onClick={() => onNavigate(item.view)}
                className="flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors touch-manipulation"
                style={{ color: isActive ? 'var(--accent-color)' : 'var(--text-secondary)' }}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default Layout;
