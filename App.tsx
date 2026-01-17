import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ViewType,
  NavigationState,
  UserSettings,
  AnnualGoal,
  QuarterlyGoal,
  GoalDetail,
  DailyPage,
  WeeklyPreview,
  WeeklyReview,
  QuarterlyPreview,
  IdealWeek,
  DailyRitual,
  Project,
  Note,
  CalendarEvent,
  Quarter,
  generateId,
  getTodayString,
  getCurrentQuarter,
  getWeekNumber,
} from './types';
import { db } from './services/db';
import { initializeAI } from './services/ai';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import AnnualGoalsView from './components/AnnualGoalsView';
import QuarterlyGoalsView from './components/QuarterlyGoalsView';
import GoalDetailView from './components/GoalDetailView';
import DailyPageView from './components/DailyPageView';
import WeeklyPreviewView from './components/WeeklyPreviewView';
import WeeklyReviewView from './components/WeeklyReviewView';
import QuarterlyPreviewView from './components/QuarterlyPreviewView';
import IdealWeekView from './components/IdealWeekView';
import RitualsView from './components/RitualsView';
import ProjectsView from './components/ProjectsView';
import CalendarView from './components/CalendarView';
import NotesView from './components/NotesView';
import SearchView from './components/SearchView';
import SettingsView from './components/SettingsView';

const App: React.FC = () => {
  // Navigation state
  const [navigation, setNavigation] = useState<NavigationState>({
    currentView: 'dashboard',
    selectedDate: getTodayString(),
    selectedYear: new Date().getFullYear(),
    selectedQuarter: getCurrentQuarter(),
  });

  // App data state
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [annualGoals, setAnnualGoals] = useState<AnnualGoal[]>([]);
  const [quarterlyGoals, setQuarterlyGoals] = useState<QuarterlyGoal[]>([]);
  const [goalDetails, setGoalDetails] = useState<GoalDetail[]>([]);
  const [dailyPages, setDailyPages] = useState<DailyPage[]>([]);
  const [weeklyPreviews, setWeeklyPreviews] = useState<WeeklyPreview[]>([]);
  const [weeklyReviews, setWeeklyReviews] = useState<WeeklyReview[]>([]);
  const [quarterlyPreviews, setQuarterlyPreviews] = useState<QuarterlyPreview[]>([]);
  const [idealWeeks, setIdealWeeks] = useState<IdealWeek[]>([]);
  const [rituals, setRituals] = useState<DailyRitual[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);

  // Loading state
  const [isLoading, setIsLoading] = useState(true);

  // Load all data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [
          loadedSettings,
          loadedAnnualGoals,
          loadedQuarterlyGoals,
          loadedGoalDetails,
          loadedDailyPages,
          loadedWeeklyPreviews,
          loadedWeeklyReviews,
          loadedQuarterlyPreviews,
          loadedIdealWeeks,
          loadedRituals,
          loadedProjects,
          loadedNotes,
          loadedCalendarEvents,
        ] = await Promise.all([
          db.getSettings(),
          db.getAnnualGoals(),
          db.getQuarterlyGoals(),
          db.getGoalDetails(),
          db.getDailyPages(),
          db.getWeeklyPreviews(),
          db.getWeeklyReviews(),
          db.getQuarterlyPreviews(),
          db.getIdealWeeks(),
          db.getRituals(),
          db.getProjects(),
          db.getNotes(),
          db.getCalendarEvents(),
        ]);

        setSettings(loadedSettings);
        setAnnualGoals(loadedAnnualGoals);
        setQuarterlyGoals(loadedQuarterlyGoals);
        setGoalDetails(loadedGoalDetails);
        setDailyPages(loadedDailyPages);
        setWeeklyPreviews(loadedWeeklyPreviews);
        setWeeklyReviews(loadedWeeklyReviews);
        setQuarterlyPreviews(loadedQuarterlyPreviews);
        setIdealWeeks(loadedIdealWeeks);
        setRituals(loadedRituals);
        setProjects(loadedProjects);
        setNotes(loadedNotes);
        setCalendarEvents(loadedCalendarEvents);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Initialize AI when settings change
  useEffect(() => {
    if (settings?.aiEnabled && settings?.aiApiKey) {
      initializeAI(settings.aiApiKey);
    }
  }, [settings?.aiEnabled, settings?.aiApiKey]);

  // Navigation handlers
  const navigate = useCallback((view: ViewType, params?: Partial<NavigationState>) => {
    setNavigation(prev => ({
      ...prev,
      currentView: view,
      ...params,
    }));
  }, []);

  const navigateToDaily = useCallback((date: string) => {
    navigate('daily_page', { selectedDate: date });
  }, [navigate]);

  const navigateToGoal = useCallback((goalId: string) => {
    navigate('goal_detail', { selectedGoalId: goalId });
  }, [navigate]);

  const navigateToProject = useCallback((projectId: string) => {
    navigate('project_detail', { selectedProjectId: projectId });
  }, [navigate]);

  const navigateToNote = useCallback((noteId: string) => {
    navigate('note_detail', { selectedNoteId: noteId });
  }, [navigate]);

  // Data handlers
  const handleSaveSettings = useCallback(async (newSettings: UserSettings) => {
    await db.saveSettings(newSettings);
    setSettings(newSettings);
  }, []);

  const handleSaveAnnualGoal = useCallback(async (goal: AnnualGoal) => {
    await db.saveAnnualGoal(goal);
    setAnnualGoals(prev => {
      const existing = prev.findIndex(g => g.id === goal.id);
      if (existing >= 0) {
        return prev.map(g => g.id === goal.id ? goal : g);
      }
      return [...prev, goal];
    });
  }, []);

  const handleDeleteAnnualGoal = useCallback(async (id: string) => {
    await db.deleteAnnualGoal(id);
    setAnnualGoals(prev => prev.filter(g => g.id !== id));
  }, []);

  const handleSaveQuarterlyGoal = useCallback(async (goal: QuarterlyGoal) => {
    await db.saveQuarterlyGoal(goal);
    setQuarterlyGoals(prev => {
      const existing = prev.findIndex(g => g.id === goal.id);
      if (existing >= 0) {
        return prev.map(g => g.id === goal.id ? goal : g);
      }
      return [...prev, goal];
    });
  }, []);

  const handleDeleteQuarterlyGoal = useCallback(async (id: string) => {
    await db.deleteQuarterlyGoal(id);
    setQuarterlyGoals(prev => prev.filter(g => g.id !== id));
  }, []);

  const handleSaveGoalDetail = useCallback(async (detail: GoalDetail) => {
    await db.saveGoalDetail(detail);
    setGoalDetails(prev => {
      const existing = prev.findIndex(d => d.id === detail.id);
      if (existing >= 0) {
        return prev.map(d => d.id === detail.id ? detail : d);
      }
      return [...prev, detail];
    });
  }, []);

  const handleSaveDailyPage = useCallback(async (page: DailyPage) => {
    await db.saveDailyPage(page);
    setDailyPages(prev => {
      const existing = prev.findIndex(p => p.id === page.id);
      if (existing >= 0) {
        return prev.map(p => p.id === page.id ? page : p);
      }
      return [...prev, page];
    });
  }, []);

  const handleSaveWeeklyPreview = useCallback(async (preview: WeeklyPreview) => {
    await db.saveWeeklyPreview(preview);
    setWeeklyPreviews(prev => {
      const existing = prev.findIndex(p => p.id === preview.id);
      if (existing >= 0) {
        return prev.map(p => p.id === preview.id ? preview : p);
      }
      return [...prev, preview];
    });
  }, []);

  const handleSaveWeeklyReview = useCallback(async (review: WeeklyReview) => {
    await db.saveWeeklyReview(review);
    setWeeklyReviews(prev => {
      const existing = prev.findIndex(r => r.id === review.id);
      if (existing >= 0) {
        return prev.map(r => r.id === review.id ? review : r);
      }
      return [...prev, review];
    });
  }, []);

  const handleSaveQuarterlyPreview = useCallback(async (preview: QuarterlyPreview) => {
    await db.saveQuarterlyPreview(preview);
    setQuarterlyPreviews(prev => {
      const existing = prev.findIndex(p => p.id === preview.id);
      if (existing >= 0) {
        return prev.map(p => p.id === preview.id ? preview : p);
      }
      return [...prev, preview];
    });
  }, []);

  const handleSaveIdealWeek = useCallback(async (week: IdealWeek) => {
    await db.saveIdealWeek(week);
    setIdealWeeks(prev => {
      const existing = prev.findIndex(w => w.id === week.id);
      if (existing >= 0) {
        return prev.map(w => w.id === week.id ? week : w);
      }
      return [...prev, week];
    });
  }, []);

  const handleDeleteIdealWeek = useCallback(async (id: string) => {
    await db.deleteIdealWeek(id);
    setIdealWeeks(prev => prev.filter(w => w.id !== id));
  }, []);

  const handleSaveRitual = useCallback(async (ritual: DailyRitual) => {
    await db.saveRitual(ritual);
    setRituals(prev => {
      const existing = prev.findIndex(r => r.id === ritual.id);
      if (existing >= 0) {
        return prev.map(r => r.id === ritual.id ? ritual : r);
      }
      return [...prev, ritual];
    });
  }, []);

  const handleDeleteRitual = useCallback(async (id: string) => {
    await db.deleteRitual(id);
    setRituals(prev => prev.filter(r => r.id !== id));
  }, []);

  const handleSaveProject = useCallback(async (project: Project) => {
    await db.saveProject(project);
    setProjects(prev => {
      const existing = prev.findIndex(p => p.id === project.id);
      if (existing >= 0) {
        return prev.map(p => p.id === project.id ? project : p);
      }
      return [...prev, project];
    });
  }, []);

  const handleDeleteProject = useCallback(async (id: string) => {
    await db.deleteProject(id);
    setProjects(prev => prev.filter(p => p.id !== id));
  }, []);

  const handleSaveNote = useCallback(async (note: Note) => {
    await db.saveNote(note);
    setNotes(prev => {
      const existing = prev.findIndex(n => n.id === note.id);
      if (existing >= 0) {
        return prev.map(n => n.id === note.id ? note : n);
      }
      return [...prev, note];
    });
  }, []);

  const handleDeleteNote = useCallback(async (id: string) => {
    await db.deleteNote(id);
    setNotes(prev => prev.filter(n => n.id !== id));
  }, []);

  const handleSaveCalendarEvent = useCallback(async (event: CalendarEvent) => {
    await db.saveCalendarEvent(event);
    setCalendarEvents(prev => {
      const existing = prev.findIndex(e => e.id === event.id);
      if (existing >= 0) {
        return prev.map(e => e.id === event.id ? event : e);
      }
      return [...prev, event];
    });
  }, []);

  const handleDeleteCalendarEvent = useCallback(async (id: string) => {
    await db.deleteCalendarEvent(id);
    setCalendarEvents(prev => prev.filter(e => e.id !== id));
  }, []);

  // Export data
  const handleExportData = useCallback(async () => {
    const data = await db.exportAllData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `full-focus-planner-backup-${getTodayString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  // Import data
  const handleImportData = useCallback(async (file: File) => {
    const text = await file.text();
    const data = JSON.parse(text);
    await db.importAllData(data);
    // Reload all data
    window.location.reload();
  }, []);

  // Get current quarterly goals for the selected year/quarter
  const currentQuarterlyGoals = useMemo(() => {
    return quarterlyGoals.filter(
      g => g.year === navigation.selectedYear && g.quarter === navigation.selectedQuarter
    );
  }, [quarterlyGoals, navigation.selectedYear, navigation.selectedQuarter]);

  // Get current daily page
  const currentDailyPage = useMemo(() => {
    return dailyPages.find(p => p.date === navigation.selectedDate);
  }, [dailyPages, navigation.selectedDate]);

  if (isLoading || !settings) {
    return (
      <div className="min-h-screen bg-amber-50 flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-800 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-serif text-amber-900">Full Focus Planner</h2>
          <p className="text-amber-700 mt-2">Loading your planner...</p>
        </div>
      </div>
    );
  }

  const renderView = () => {
    switch (navigation.currentView) {
      case 'dashboard':
        return (
          <Dashboard
            settings={settings}
            quarterlyGoals={currentQuarterlyGoals}
            dailyPage={currentDailyPage}
            projects={projects.filter(p => p.status === 'active')}
            rituals={rituals}
            onNavigate={navigate}
            onNavigateToDaily={navigateToDaily}
            onNavigateToGoal={navigateToGoal}
          />
        );

      case 'annual_goals':
        return (
          <AnnualGoalsView
            goals={annualGoals.filter(g => g.year === navigation.selectedYear)}
            year={navigation.selectedYear!}
            onSave={handleSaveAnnualGoal}
            onDelete={handleDeleteAnnualGoal}
            onNavigateToGoal={navigateToGoal}
            onYearChange={(year) => setNavigation(prev => ({ ...prev, selectedYear: year }))}
          />
        );

      case 'quarterly_goals':
        return (
          <QuarterlyGoalsView
            goals={currentQuarterlyGoals}
            annualGoals={annualGoals.filter(g => g.year === navigation.selectedYear)}
            year={navigation.selectedYear!}
            quarter={navigation.selectedQuarter!}
            onSave={handleSaveQuarterlyGoal}
            onDelete={handleDeleteQuarterlyGoal}
            onNavigateToGoal={navigateToGoal}
            onQuarterChange={(quarter) => setNavigation(prev => ({ ...prev, selectedQuarter: quarter }))}
            onYearChange={(year) => setNavigation(prev => ({ ...prev, selectedYear: year }))}
          />
        );

      case 'goal_detail':
        const selectedGoal = quarterlyGoals.find(g => g.id === navigation.selectedGoalId);
        const selectedDetail = goalDetails.find(d => d.goalId === navigation.selectedGoalId);
        return (
          <GoalDetailView
            goal={selectedGoal}
            detail={selectedDetail}
            onSaveGoal={handleSaveQuarterlyGoal}
            onSaveDetail={handleSaveGoalDetail}
            onBack={() => navigate('quarterly_goals')}
          />
        );

      case 'daily_page':
        return (
          <DailyPageView
            date={navigation.selectedDate!}
            page={currentDailyPage}
            quarterlyGoals={currentQuarterlyGoals}
            rituals={rituals}
            onSave={handleSaveDailyPage}
            onDateChange={navigateToDaily}
          />
        );

      case 'weekly_preview':
        const weekNum = getWeekNumber(new Date(navigation.selectedDate || getTodayString()));
        const weeklyPreview = weeklyPreviews.find(
          p => p.year === navigation.selectedYear && p.weekNumber === weekNum
        );
        return (
          <WeeklyPreviewView
            year={navigation.selectedYear!}
            weekNumber={weekNum}
            preview={weeklyPreview}
            quarterlyGoals={currentQuarterlyGoals}
            onSave={handleSaveWeeklyPreview}
            onWeekChange={(week) => {
              const date = new Date(navigation.selectedYear!, 0, 1 + (week - 1) * 7);
              setNavigation(prev => ({ ...prev, selectedDate: date.toISOString().split('T')[0] }));
            }}
          />
        );

      case 'weekly_review':
        const reviewWeekNum = getWeekNumber(new Date(navigation.selectedDate || getTodayString()));
        const weeklyReview = weeklyReviews.find(
          r => r.year === navigation.selectedYear && r.weekNumber === reviewWeekNum
        );
        return (
          <WeeklyReviewView
            year={navigation.selectedYear!}
            weekNumber={reviewWeekNum}
            review={weeklyReview}
            quarterlyGoals={currentQuarterlyGoals}
            onSave={handleSaveWeeklyReview}
          />
        );

      case 'quarterly_preview':
        const quarterlyPreview = quarterlyPreviews.find(
          p => p.year === navigation.selectedYear && p.quarter === navigation.selectedQuarter
        );
        return (
          <QuarterlyPreviewView
            year={navigation.selectedYear!}
            quarter={navigation.selectedQuarter!}
            preview={quarterlyPreview}
            quarterlyGoals={currentQuarterlyGoals}
            onSave={handleSaveQuarterlyPreview}
            onQuarterChange={(quarter) => setNavigation(prev => ({ ...prev, selectedQuarter: quarter }))}
          />
        );

      case 'ideal_week':
        return (
          <IdealWeekView
            idealWeeks={idealWeeks}
            onSave={handleSaveIdealWeek}
            onDelete={handleDeleteIdealWeek}
          />
        );

      case 'rituals':
        return (
          <RitualsView
            rituals={rituals}
            onSave={handleSaveRitual}
            onDelete={handleDeleteRitual}
          />
        );

      case 'projects':
      case 'project_detail':
        return (
          <ProjectsView
            projects={projects}
            quarterlyGoals={quarterlyGoals}
            selectedProjectId={navigation.selectedProjectId}
            onSave={handleSaveProject}
            onDelete={handleDeleteProject}
            onSelectProject={navigateToProject}
          />
        );

      case 'calendar':
        return (
          <CalendarView
            events={calendarEvents}
            dailyPages={dailyPages}
            quarterlyGoals={quarterlyGoals}
            year={navigation.selectedYear!}
            onSaveEvent={handleSaveCalendarEvent}
            onDeleteEvent={handleDeleteCalendarEvent}
            onNavigateToDaily={navigateToDaily}
            onYearChange={(year) => setNavigation(prev => ({ ...prev, selectedYear: year }))}
          />
        );

      case 'notes':
      case 'note_detail':
        return (
          <NotesView
            notes={notes}
            selectedNoteId={navigation.selectedNoteId}
            onSave={handleSaveNote}
            onDelete={handleDeleteNote}
            onSelectNote={navigateToNote}
          />
        );

      case 'search':
        return (
          <SearchView
            onNavigateToDaily={navigateToDaily}
            onNavigateToGoal={navigateToGoal}
            onNavigateToProject={navigateToProject}
            onNavigateToNote={navigateToNote}
          />
        );

      case 'settings':
        return (
          <SettingsView
            settings={settings}
            onSave={handleSaveSettings}
            onExport={handleExportData}
            onImport={handleImportData}
          />
        );

      default:
        return <Dashboard
          settings={settings}
          quarterlyGoals={currentQuarterlyGoals}
          dailyPage={currentDailyPage}
          projects={projects.filter(p => p.status === 'active')}
          rituals={rituals}
          onNavigate={navigate}
          onNavigateToDaily={navigateToDaily}
          onNavigateToGoal={navigateToGoal}
        />;
    }
  };

  return (
    <Layout
      currentView={navigation.currentView}
      settings={settings}
      onNavigate={navigate}
      selectedDate={navigation.selectedDate}
      selectedYear={navigation.selectedYear}
      selectedQuarter={navigation.selectedQuarter}
    >
      <div className="animate-fadeIn">
        {renderView()}
      </div>
    </Layout>
  );
};

export default App;
