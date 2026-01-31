
import React, { useState, useEffect, useRef } from 'react';
import { TrainingModule, Lesson, UserProgress, QuizQuestion, ChecklistItem, PracticeSubmission } from '../types';
import { CheckCircle2, Clock, ChevronRight, Play, BookOpen, PenTool, ClipboardCheck, ArrowLeft, RefreshCw, XCircle, Video, Settings, Plus, Save, Trash2, Edit3, X, Zap, Target, Eye, EyeOff, Trash, Check, Square, CheckSquare, Circle, Dot, Upload, FileText, File as FileIcon, GripVertical, AlertTriangle, Camera, Loader2, Search, Filter, Award, Users as UsersIcon, TrendingUp, Star, MessageSquare, Image as ImageIcon, Pause, PlayCircle, History, Medal, Trophy, Activity, CloudOff, RotateCcw, Store } from 'lucide-react';
import { db } from '../services/db';

interface TrainingViewProps {
  curriculum: TrainingModule[];
  progress: UserProgress[];
  onCompleteLesson: (lessonId: string, score?: number, fileData?: { url: string, name: string }, checklistCompleted?: string[], checklistPhotos?: Record<string, string>) => void;
  canEdit?: boolean;
  onUpdateCurriculum?: (curriculum: TrainingModule[]) => void;
  onResetLessonProgress?: (lessonId: string) => void;
}

const TrainingView: React.FC<TrainingViewProps> = ({ curriculum, progress, onCompleteLesson, canEdit, onUpdateCurriculum, onResetLessonProgress }) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [timerActive, setTimerActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showCompletedOnboarding, setShowCompletedOnboarding] = useState(true);

  // File Upload state (Correctly uses native File type now)
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Quiz State
  const [userAnswers, setUserAnswers] = useState<Record<string, string[]>>({});
  const [isQuizSubmitted, setIsQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [cooldown, setCooldown] = useState(0);

  // Checklist State (for PRACTICE lessons with checklistItems)
  const [checkedItems, setCheckedItems] = useState<string[]>([]);
  const [checklistPhotos, setChecklistPhotos] = useState<Record<string, string>>({});
  const [capturingPhotoForItem, setCapturingPhotoForItem] = useState<string | null>(null);
  const [uploadingPhotoForItem, setUploadingPhotoForItem] = useState<string | null>(null);
  const checklistCameraRef = useRef<HTMLInputElement>(null);

  // Initialize checklist state when selecting a lesson
  useEffect(() => {
    if (selectedLesson?.checklistItems) {
      const savedProgress = progress.find(p => p.lessonId === selectedLesson.id);
      setCheckedItems(savedProgress?.checklistCompleted || []);
      setChecklistPhotos(savedProgress?.checklistPhotos || {});
    } else {
      setCheckedItems([]);
      setChecklistPhotos({});
    }
    setCapturingPhotoForItem(null);
  }, [selectedLesson, progress]);

  // Scroll to top when opening a lesson
  useEffect(() => {
    if (selectedLesson) {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [selectedLesson]);

  // Delete Confirmation State
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string, title: string, code: string, input: string } | null>(null);

  // NEW FEATURES STATE
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'CONTENT' | 'QUIZ' | 'PRACTICE' | 'FILE_UPLOAD'>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'COMPLETED' | 'INCOMPLETE'>('ALL');

  // Practice Photo Gallery
  const [showPracticeGallery, setShowPracticeGallery] = useState(false);
  const [selectedSubmissionForComparison, setSelectedSubmissionForComparison] = useState<PracticeSubmission | null>(null);

  // Video Progress Tracking
  const [videoWatchedSeconds, setVideoWatchedSeconds] = useState(0);
  const [videoTotalSeconds, setVideoTotalSeconds] = useState(0);
  const videoRef = useRef<HTMLIFrameElement>(null);

  // Quiz Review Mode
  const [showQuizReview, setShowQuizReview] = useState(false);

  // Practice Timer Enhancement
  const [timerPaused, setTimerPaused] = useState(false);
  const [timerIntervals, setTimerIntervals] = useState<number[]>([5, 1]); // Alert at 5min and 1min

  // Peer Learning
  const [showPeerActivity, setShowPeerActivity] = useState(false);
  const [recentCompletions, setRecentCompletions] = useState<{ userId: string; lessonId: string; completedAt: string }[]>([]);

  // Offline Support
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const getStatus = (lessonId: string) => progress.find(p => p.lessonId === lessonId)?.status || 'NOT_STARTED';
  const getProgressData = (lessonId: string) => progress.find(p => p.lessonId === lessonId);

  // Safety filter
  const curriculumArray = Array.isArray(curriculum) ? curriculum : [];

  const onboardingModules = curriculumArray.filter(m => m.category === 'ONBOARDING');
  const onboardingLessons = onboardingModules.flatMap(m => m.lessons);
  const completedOnboardingCount = onboardingLessons.filter(l => getStatus(l.id) === 'COMPLETED').length;
  const isOnboardingFullyComplete = onboardingLessons.length > 0 && completedOnboardingCount === onboardingLessons.length;

  // Overall progress calculation
  const allLessons = curriculumArray.flatMap(m => m.lessons);
  const completedLessonsCount = allLessons.filter(l => getStatus(l.id) === 'COMPLETED').length;
  const overallProgressPercent = allLessons.length > 0 ? Math.round((completedLessonsCount / allLessons.length) * 100) : 0;

  // Search & Filter logic
  const filterLessons = (lessons: Lesson[]) => {
    return lessons.filter(lesson => {
      const matchesSearch = lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (lesson.content || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === 'ALL' || lesson.type === filterType;
      const status = getStatus(lesson.id);
      const matchesStatus = filterStatus === 'ALL' ||
                           (filterStatus === 'COMPLETED' && status === 'COMPLETED') ||
                           (filterStatus === 'INCOMPLETE' && status !== 'COMPLETED');
      return matchesSearch && matchesType && matchesStatus;
    });
  };

  useEffect(() => {
    let interval: any;
    if (timerActive && timeLeft > 0 && !timerPaused) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          const newTime = prev - 1;
          // Alert at intervals (5min, 1min)
          if (timerIntervals.includes(Math.floor(newTime / 60))) {
            const mins = Math.floor(newTime / 60);
            new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZTA0PWqzn77FgGgk+ltryxnMmBSh+zPDTiTYIGGa47OShUBELTKXh8bllHAU2jdXzwoUwBhxst+/mnksOD1ms5/CwYBoIP5PY88p0JgYnfczwz4k1CBdmuOzon1ARCkmh4PG4ZRwFM4zU88GFMAYabLjv5p5LDg9Yr+fwrF8aCD6S2PPKdCYGJnvM8M6JNQgWZrjs55xPEQpHoN/xumYdBTOL1PLAhS8GGWu37uWdSQ4PVq3n8KxeGQc9kdfs0XUlBiR5y+/NiTUHFWO269yZThAKRp7f8r1nHwU3i9PyxYkwBh1uve/joUkOEFes5O+rXBgHOozW79FuJAQidc3wz4o2Bhdet+XcmEwQDEWc3/K8Zh8ENo3U88WJMAYca7bv46BIDg9VrOTvqlsYBzqM1u/RbiQEIXXN8M6KNgYWXbfl3JhMEAxFnN/yvGYfBDaN1PPFiTAGHGu27+OgSA4PVazk76pbGAc6jNbv0W4kBCF1zfDNiTUHFl223Nd4TBEJRJvd8rxmHwQzitPzxYkwBhxrtu/joEgOD1Ws5O+qWxgHOozW79FuJAQhdc3wzYk1BxZdtt3WdksQCUSb3fK7Zh4EM4rT88SJLwYca7bv46FIDw9VrOTvqlsYBzqM1u/RbiQEIXXN8M2JNQcWXbbd1nZLEAlEm93yu2YeBDOK0/PEiS8GHGu27+OhSA8PVazk76pbGAc6jNbv0W4kBCF1zfDNiTUHFl223dZ2SxAJRJvd8rtmHgQzitPzxIkvBhxrtu/joUgPD1Ws5O+qWxgHOozW79FuJAQhdc3wzYk1BxZdtt3WdksQCUSb3fK7Zh4EM4rT88SJLwYca7bv46FIDw9VrOTvqlsYBzqM1u/RbiQEIXXN8M2JNQcWXbbd1nZLEAlEm93yu2YeBDOK0/PEiS8GHGu27+OhSA8PVazk76pbGAc6jNbv0W4kBCF1zfDNiTUHFl223dZ2SxAJRJvd8rtmHgQzitPzxIkvBhxrtu/joUgPD1Ws5O+qWxgHOozW79FuJAQhdc3wzYk1BxZdtt3WdksQCUSb3fK7Zh4EM4rT88SJLwYca7bv46FIDw9VrOTvqlsYBzqM1u/RbiQEIXXN8M2JNQcWXbbd1nZLEAlEm93yu2YeBDOK0/PEiS8GHGu27+OhSA8PVazk76pbGAc6jNbv0W4kBCF1zfDNiTUHFl223dZ2SxAJRJvd8rtmHgQzitPzxIkvBhxrtu/joUgPD1Ws5O+qWxgHOozW79FuJAQhdc3wzYk1BxZdtt3WdksQCUSb3fK7Zh4EM4rT88SJLwYca7bv46FIDw9VrOTvqlsYBzqM1u/RbiQEIXXN8M2JNQcWXbbd1nZLEAlEm93yu2YeBDOK0/PEiS8GHGu27+OhSA8P==').play().catch(() => {});
          }
          return newTime;
        });
      }, 1000);
    } else if (timeLeft === 0 && timerActive) {
      setTimerActive(false);
      setTimerPaused(false);
      alert('Practice time complete!');
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft, timerPaused, timerIntervals]);

  useEffect(() => {
    let interval: any;
    if (cooldown > 0) {
      interval = setInterval(() => setCooldown(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [cooldown]);

  const startTimer = (mins: number) => {
    setTimeLeft(mins * 60);
    setTimerActive(true);
  };

  const handleAnswerChange = (questionId: string, option: string, type: string) => {
    if (isQuizSubmitted) return;
    
    setUserAnswers(prev => {
      const current = prev[questionId] || [];
      if (type === 'SELECT_ALL') {
        if (current.includes(option)) {
          return { ...prev, [questionId]: current.filter(o => o !== option) };
        } else {
          return { ...prev, [questionId]: [...current, option] };
        }
      } else {
        return { ...prev, [questionId]: [option] };
      }
    });
  };

  const allQuestionsAnswered = (selectedLesson?.quizQuestions || []).every(q => userAnswers[q.id] && userAnswers[q.id].length > 0);

  const submitQuiz = () => {
    if (!selectedLesson?.quizQuestions || !allQuestionsAnswered) return;

    const questions = selectedLesson.quizQuestions;
    let correctCount = 0;

    questions.forEach(q => {
      const answers = userAnswers[q.id] || [];
      const correct = q.correctAnswers;
      if (answers.length === correct.length && answers.every(a => correct.includes(a))) {
        correctCount++;
      }
    });

    const score = Math.round((correctCount / questions.length) * 100);
    setQuizScore(score);
    setIsQuizSubmitted(true);

    if (score >= 80) {
      onCompleteLesson(selectedLesson.id, score);
    } else {
      setCooldown(60); 
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setUploadingFile(file);
  };

  const submitFileUpload = () => {
    if (!uploadingFile || !selectedLesson) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      onCompleteLesson(selectedLesson.id, undefined, { url: base64, name: uploadingFile.name });
      setUploadingFile(null);
    };
    reader.readAsDataURL(uploadingFile);
  };

  const handleChecklistPhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !capturingPhotoForItem || !selectedLesson) return;

    const itemId = capturingPhotoForItem;
    setCapturingPhotoForItem(null);
    setUploadingPhotoForItem(itemId);

    // Reset the input so the same file can be selected again
    e.target.value = '';

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const img = new Image();
      img.onload = async () => {
        try {
          // Compress the image - 800px max, 70% quality
          const canvas = document.createElement('canvas');
          const maxSize = 800;
          let width = img.width;
          let height = img.height;
          if (width > height && width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          } else if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.7);

          // Upload to Firebase Storage
          const timestamp = Date.now();
          const storagePath = `training/${selectedLesson.id}/${itemId}-${timestamp}.jpg`;

          let photoUrl: string;
          try {
            console.log(`[Training Photo] Uploading to: ${storagePath}`);
            photoUrl = await db.uploadPhoto(compressed, storagePath);
            console.log(`[Training Photo] Upload successful: ${photoUrl}`);
          } catch (uploadError) {
            console.error(`[Training Photo] Upload failed, using base64:`, uploadError);
            // Fallback to base64 if upload fails
            photoUrl = compressed;
          }

          setChecklistPhotos(prev => ({ ...prev, [itemId]: photoUrl }));
          // Auto-check the item when photo is added
          if (!checkedItems.includes(itemId)) {
            setCheckedItems(prev => [...prev, itemId]);
          }
        } catch (error) {
          console.error('[Training Photo] Error processing photo:', error);
        } finally {
          setUploadingPhotoForItem(null);
        }
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const getEmbedUrl = (url: string) => {
    if (!url) return '';
    const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:\S+)?/;
    const match = url.match(youtubeRegex);
    if (match && match[1]) {
      return `https://www.youtube.com/embed/${match[1]}?modestbranding=1&rel=0&autoplay=0&enablejsapi=1`;
    }
    return url;
  };

  const handleUpdateModule = (moduleId: string, updates: Partial<TrainingModule>) => {
    if (!onUpdateCurriculum) return;
    const nextCurriculum = curriculumArray.map(m => m.id === moduleId ? { ...m, ...updates } : m);
    onUpdateCurriculum(nextCurriculum);
  };

  const handleAddModule = (category: 'ONBOARDING' | 'CONTINUED') => {
    if (!onUpdateCurriculum) return;
    const newModule: TrainingModule = {
      id: `m-${Date.now()}`,
      title: 'New Training Module',
      description: 'Enter description here...',
      category,
      lessons: []
    };
    onUpdateCurriculum([...curriculumArray, newModule]);
  };

  const handleDeleteModuleConfirmed = () => {
    if (!onUpdateCurriculum || !deleteConfirm) return;
    onUpdateCurriculum(curriculumArray.filter(m => m.id !== deleteConfirm.id));
    setDeleteConfirm(null);
  };

  const handleUpdateLesson = (lessonId: string, updates: Partial<Lesson>) => {
    if (!onUpdateCurriculum) return;
    const nextCurriculum = curriculumArray.map(m => ({
      ...m,
      lessons: m.lessons.map(l => l.id === lessonId ? { ...l, ...updates } : l)
    }));
    onUpdateCurriculum(nextCurriculum);
    if (selectedLesson && selectedLesson.id === lessonId) {
      setSelectedLesson({ ...selectedLesson, ...updates });
    }
  };

  const handleAddLesson = (moduleId: string) => {
    if (!onUpdateCurriculum) return;
    const newLesson: Lesson = {
      id: `l-${Date.now()}`,
      moduleId,
      title: 'New Lesson',
      type: 'CONTENT',
      content: 'Lesson content...'
    };
    const nextCurriculum = curriculumArray.map(m => m.id === moduleId ? { ...m, lessons: [...m.lessons, newLesson] } : m);
    onUpdateCurriculum(nextCurriculum);
  };

  const handleUpdateQuizQuestion = (questionId: string, updates: Partial<QuizQuestion>) => {
    if (!selectedLesson || !onUpdateCurriculum) return;
    const updatedQuestions = (selectedLesson.quizQuestions || []).map(q => q.id === questionId ? { ...q, ...updates } : q);
    handleUpdateLesson(selectedLesson.id, { quizQuestions: updatedQuestions });
  };

  const handleAddQuizOption = (questionId: string) => {
    if (!selectedLesson) return;
    const question = selectedLesson.quizQuestions?.find(q => q.id === questionId);
    if (!question) return;
    const newOptions = [...(question.options || []), `Option ${(question.options?.length || 0) + 1}`];
    handleUpdateQuizQuestion(questionId, { options: newOptions });
  };

  const handleRemoveQuizOption = (questionId: string, optionIndex: number) => {
    if (!selectedLesson) return;
    const question = selectedLesson.quizQuestions?.find(q => q.id === questionId);
    if (!question || !question.options) return;
    const removedOption = question.options[optionIndex];
    const newOptions = question.options.filter((_, i) => i !== optionIndex);
    const newCorrect = question.correctAnswers.filter(ans => ans !== removedOption);
    handleUpdateQuizQuestion(questionId, { options: newOptions, correctAnswers: newCorrect });
  };

  const toggleCorrectAnswer = (questionId: string, option: string) => {
    const question = selectedLesson?.quizQuestions?.find(q => q.id === questionId);
    if (!question) return;
    let newCorrect = [...question.correctAnswers];
    if (question.type === 'SELECT_ALL') {
      newCorrect = newCorrect.includes(option) ? newCorrect.filter(a => a !== option) : [...newCorrect, option];
    } else {
      newCorrect = [option];
    }
    handleUpdateQuizQuestion(questionId, { correctAnswers: newCorrect });
  };

  if (selectedLesson) {
    const lessonStatus = getStatus(selectedLesson.id);
    const progressData = getProgressData(selectedLesson.id);

    const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
      <div className="space-y-6 sm:space-y-8 animate-in slide-in-from-right-4 duration-500">
        {/* Floating Practice Timer */}
        {timerActive && timeLeft > 0 && (
          <div className="fixed bottom-8 right-8 z-50 bg-gradient-to-br from-orange-500 to-red-500 text-white rounded-xl shadow-lg p-6 animate-in slide-in-from-bottom-4">
            <div className="text-center space-y-3">
              <div className="flex items-center gap-2 justify-center">
                <Clock size={16} className={timerPaused ? '' : 'animate-pulse'} />
                <span className="text-[10px] font-black uppercase tracking-widest">Practice Timer</span>
              </div>
              <div className="text-4xl font-black tabular-nums">{formatTime(timeLeft)}</div>
              <div className="flex gap-2">
                <button
                  onClick={() => setTimerPaused(!timerPaused)}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-bold transition-all flex items-center gap-2"
                >
                  {timerPaused ? <PlayCircle size={14} /> : <Pause size={14} />}
                  {timerPaused ? 'Resume' : 'Pause'}
                </button>
                <button
                  onClick={() => { setTimerActive(false); setTimeLeft(0); setTimerPaused(false); }}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-bold transition-all"
                >
                  Stop
                </button>
              </div>
            </div>
          </div>
        )}
        <div className="flex items-center justify-between">
          <button 
            onClick={() => { setSelectedLesson(null); setIsQuizSubmitted(false); setQuizScore(null); setUserAnswers({}); }}
            className="flex items-center gap-2 text-neutral-400 hover:text-[#0F2B3C] font-bold text-[10px] sm:text-xs uppercase tracking-widest transition-colors"
          >
            <ArrowLeft size={14} strokeWidth={3} /> Return to Academy
          </button>
          
          {isEditMode && (
            <button 
              onClick={() => {
                   const nextCurriculum = curriculumArray.map(m => ({
                    ...m,
                    lessons: m.lessons.filter(l => l.id !== selectedLesson.id)
                  }));
                  onUpdateCurriculum?.(nextCurriculum);
                  setSelectedLesson(null);
              }} 
              className="p-2 sm:p-3 text-red-500 hover:bg-red-50 rounded-xl transition-all"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>

        <div className="bg-white rounded-xl p-6 sm:p-8 shadow-lg border border-neutral-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-900/5 rounded-full -mr-32 -mt-32 blur-[80px]" />
          
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 sm:gap-6 mb-8 sm:mb-12">
              <div className="flex-1 w-full">
                {isEditMode ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <select 
                        value={selectedLesson.type}
                        onChange={(e) => handleUpdateLesson(selectedLesson.id, { type: e.target.value as any })}
                        className="px-4 py-2 rounded-full bg-[#0F2B3C] text-white text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] outline-none shadow-lg"
                      >
                        <option value="CONTENT">CONTENT</option>
                        <option value="QUIZ">QUIZ</option>
                        <option value="PRACTICE">PRACTICE</option>
                        <option value="FILE_UPLOAD">FILE UPLOAD</option>
                      </select>
                      <input 
                        value={selectedLesson.title}
                        onChange={(e) => handleUpdateLesson(selectedLesson.id, { title: e.target.value })}
                        className="text-2xl sm:text-4xl md:text-5xl font-black text-[#0F2B3C] tracking-tighter leading-tight w-full bg-neutral-50 border-none p-2 focus:ring-0 rounded-xl"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <span className="inline-block px-3 py-1 rounded-full bg-[#0F2B3C] text-white text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] mb-3 sm:mb-4">
                      {selectedLesson.type}
                    </span>
                    <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-[#0F2B3C] tracking-tighter leading-tight">{selectedLesson.title}</h2>
                  </>
                )}
              </div>
              {lessonStatus === 'COMPLETED' && !isEditMode && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-green-600 font-bold bg-green-50 px-4 py-2 rounded-xl border border-green-100 shadow-sm animate-in zoom-in duration-300">
                    <CheckCircle2 size={18} />
                    <span>COMPLETED</span>
                  </div>
                  {selectedLesson.type === 'PRACTICE' && onResetLessonProgress && (
                    <button
                      onClick={() => {
                        if (confirm('Reset your progress for this practice lesson? This will allow you to practice again and take new photos.')) {
                          onResetLessonProgress(selectedLesson.id);
                          setCheckedItems([]);
                          setChecklistPhotos({});
                        }
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all"
                    >
                      <RotateCcw size={14} /> Practice Again
                    </button>
                  )}
                </div>
              )}
            </div>

            {(selectedLesson.type === 'VIDEO' || selectedLesson.videoUrl || isEditMode) && (
              <div className="mb-8 sm:mb-12 space-y-4">
                {/* Video Progress Bar */}
                {selectedLesson.videoUrl && progressData?.videoProgress && (
                  <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Watch Progress</span>
                      <span className="text-[10px] font-bold text-blue-600">
                        {Math.round((progressData.videoProgress.watchedSeconds / progressData.videoProgress.totalSeconds) * 100)}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-blue-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 transition-all duration-300"
                        style={{ width: `${Math.min(100, (progressData.videoProgress.watchedSeconds / progressData.videoProgress.totalSeconds) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="rounded-[1.5rem] sm:rounded-xl overflow-hidden bg-black aspect-video shadow-lg border-4 border-[#0F2B3C]/10 group relative">
                  {selectedLesson.videoUrl ? (
                    <iframe
                      ref={videoRef}
                      width="100%"
                      height="100%"
                      src={getEmbedUrl(selectedLesson.videoUrl)}
                      title={selectedLesson.title}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                    ></iframe>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-neutral-500 gap-4">
                      <Video size={32} />
                      <p className="font-bold uppercase tracking-widest text-[8px] sm:text-[10px]">No Video Linked</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {isEditMode && (
              <div className="mb-8 p-6 bg-neutral-50 rounded-xl border border-neutral-100">
                <label className="text-[8px] font-black uppercase tracking-widest text-neutral-400 mb-2 block">YouTube URL</label>
                <input 
                  value={selectedLesson.videoUrl || ''}
                  placeholder="https://www.youtube.com/watch?v=..."
                  onChange={(e) => handleUpdateLesson(selectedLesson.id, { videoUrl: e.target.value })}
                  className="w-full bg-white border border-neutral-100 px-4 py-3 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
            )}

            <div className="prose prose-neutral max-w-none mb-8 sm:mb-12 text-neutral-600 leading-relaxed text-sm sm:text-lg font-medium whitespace-pre-wrap">
              {isEditMode ? (
                <textarea
                  rows={6}
                  value={selectedLesson.content || ''}
                  onChange={(e) => handleUpdateLesson(selectedLesson.id, { content: e.target.value })}
                  className="w-full bg-neutral-50 p-4 rounded-xl border border-neutral-100 outline-none"
                  placeholder="Lesson text content..."
                />
              ) : selectedLesson.content}
            </div>

            {/* Checklist UI for PRACTICE lessons with checklistItems */}
            {selectedLesson.type === 'PRACTICE' && selectedLesson.checklistItems && selectedLesson.checklistItems.length > 0 && (
              <div className="space-y-3 mb-8 sm:mb-12">
                {/* In-Store Only Banner */}
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl p-6 mb-6 shadow-lg border-2 border-amber-400">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                      <Store size={24} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white text-lg font-black uppercase tracking-tight mb-2 flex items-center gap-2">
                        <AlertTriangle size={20} />
                        In-Store Practice Required
                      </h3>
                      <p className="text-white/90 text-sm font-medium leading-relaxed">
                        This practice module must be completed on-site at your Boundaries location with a trainer. You'll need hands-on equipment access to complete these tasks.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Hidden camera input for checklist photos */}
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  ref={checklistCameraRef}
                  className="hidden"
                  onChange={handleChecklistPhotoCapture}
                />
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-black text-[#0F2B3C] uppercase tracking-widest">Practice Checklist</h3>
                    {progressData?.attemptCount && progressData.attemptCount > 1 && (
                      <p className="text-[9px] font-bold text-blue-600 uppercase tracking-wider mt-1">
                        Attempt #{progressData.attemptCount}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-neutral-400">
                      {checkedItems.length} / {selectedLesson.checklistItems.length} Complete
                    </span>
                    {/* Progress Gallery Button */}
                    {progressData?.practiceSubmissions && progressData.practiceSubmissions.length > 0 && (
                      <button
                        onClick={() => setShowPracticeGallery(!showPracticeGallery)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all"
                      >
                        <History size={12} />
                        {progressData.practiceSubmissions.length} Past Attempts
                      </button>
                    )}
                  </div>
                </div>

                {/* Practice Photo Gallery */}
                {showPracticeGallery && progressData?.practiceSubmissions && (
                  <div className="mb-6 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-black text-[#0F2B3C] uppercase tracking-widest">Progress Gallery</h4>
                      <button
                        onClick={() => setShowPracticeGallery(false)}
                        className="text-neutral-400 hover:text-neutral-600"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {progressData.practiceSubmissions.slice().reverse().map((submission, idx) => {
                        const attemptNumber = progressData.practiceSubmissions!.length - idx;
                        const hasPhotos = Object.keys(submission.checklistPhotos || {}).length > 0;

                        return (
                          <div key={submission.id} className="bg-white rounded-xl p-4 border border-blue-100">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <p className="text-xs font-black text-[#0F2B3C] uppercase">Attempt #{attemptNumber}</p>
                                <p className="text-[9px] text-neutral-500 font-medium">
                                  {new Date(submission.submittedAt).toLocaleDateString()}
                                </p>
                              </div>
                              {submission.managerRating && (
                                <div className="flex items-center gap-1">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star
                                      key={i}
                                      size={12}
                                      className={i < submission.managerRating! ? 'fill-amber-400 text-amber-400' : 'text-neutral-200'}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Photos Grid */}
                            {hasPhotos && (
                              <div className="grid grid-cols-3 gap-2 mb-3">
                                {Object.entries(submission.checklistPhotos).map(([itemId, photoUrl]) => {
                                  const item = selectedLesson.checklistItems?.find(i => i.id === itemId);
                                  return (
                                    <div key={itemId} className="relative aspect-square rounded-lg overflow-hidden group cursor-pointer">
                                      <img
                                        src={photoUrl}
                                        alt={item?.title || 'Practice photo'}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                        onClick={() => setSelectedSubmissionForComparison(submission)}
                                      />
                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Eye size={16} className="text-white" />
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Manager Feedback */}
                            {submission.managerFeedback && (
                              <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                                <div className="flex items-start gap-2">
                                  <MessageSquare size={12} className="text-blue-600 mt-0.5 shrink-0" />
                                  <p className="text-xs text-neutral-700 font-medium">{submission.managerFeedback}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                <div className="grid gap-2">
                  {selectedLesson.checklistItems.map((item, idx) => {
                    const isChecked = checkedItems.includes(item.id);
                    const isCompleted = lessonStatus === 'COMPLETED';
                    const hasPhoto = !!checklistPhotos[item.id];
                    const needsPhoto = item.requiresPhoto && !hasPhoto;
                    return (
                      <div
                        key={item.id}
                        className={`rounded-xl border transition-all ${
                          isChecked
                            ? 'bg-green-50 border-green-200'
                            : 'bg-white border-neutral-100'
                        } ${isCompleted ? 'opacity-75' : ''}`}
                      >
                        <button
                          onClick={() => {
                            if (isCompleted && !isEditMode) return;
                            // If item requires photo and doesn't have one, don't allow checking
                            if (item.requiresPhoto && !hasPhoto) return;
                            setCheckedItems(prev =>
                              prev.includes(item.id)
                                ? prev.filter(id => id !== item.id)
                                : [...prev, item.id]
                            );
                          }}
                          disabled={isCompleted && !isEditMode}
                          className="flex items-start gap-4 p-4 text-left w-full"
                        >
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                            isChecked
                              ? 'bg-green-600 text-white'
                              : needsPhoto
                                ? 'bg-amber-100 text-amber-600'
                                : 'bg-neutral-100 text-neutral-300'
                          }`}>
                            {isChecked ? <Check size={14} strokeWidth={3} /> : needsPhoto ? <Camera size={12} /> : <span className="text-xs font-bold">{idx + 1}</span>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className={`font-bold text-sm ${isChecked ? 'text-green-700' : 'text-[#0F2B3C]'}`}>
                                {item.title}
                              </p>
                              {item.requiresPhoto && (
                                <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${hasPhoto ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                                  {hasPhoto ? 'Photo ✓' : 'Photo Required'}
                                </span>
                              )}
                            </div>
                            {item.description && (
                              <p className="text-xs text-neutral-500 mt-1">{item.description}</p>
                            )}
                            {/* Example Photo Preview */}
                            {item.examplePhotoUrl && (
                              <div className="mt-2 flex items-center gap-2">
                                <div className="relative group/example">
                                  <img
                                    src={item.examplePhotoUrl}
                                    alt="Example"
                                    className="w-16 h-16 object-cover rounded-lg border-2 border-blue-200 cursor-pointer hover:border-blue-400 transition-colors"
                                  />
                                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/example:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                    <Eye size={12} className="text-white" />
                                  </div>
                                </div>
                                <div className="text-[9px] font-bold text-blue-600 uppercase tracking-wider">
                                  Reference Example
                                </div>
                              </div>
                            )}
                          </div>
                        </button>
                        {/* Photo section */}
                        {item.requiresPhoto && (
                          <div className="px-4 pb-4 pt-0">
                            {uploadingPhotoForItem === item.id ? (
                              <div className="flex items-center gap-2 text-[#0F2B3C]">
                                <Loader2 size={16} className="animate-spin" />
                                <span className="text-xs font-bold">Uploading photo...</span>
                              </div>
                            ) : hasPhoto ? (
                              <div className="flex items-center gap-3">
                                <img
                                  src={checklistPhotos[item.id]}
                                  alt={item.title}
                                  className="w-16 h-16 object-cover rounded-lg border border-green-200"
                                />
                                {!isCompleted && (
                                  <button
                                    onClick={() => {
                                      setCapturingPhotoForItem(item.id);
                                      checklistCameraRef.current?.click();
                                    }}
                                    className="text-xs font-bold text-[#0F2B3C] underline"
                                  >
                                    Retake
                                  </button>
                                )}
                              </div>
                            ) : !isCompleted && (
                              <button
                                onClick={() => {
                                  setCapturingPhotoForItem(item.id);
                                  checklistCameraRef.current?.click();
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-[#0F2B3C] text-white rounded-lg text-xs font-bold"
                              >
                                <Camera size={14} /> Take Photo
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {selectedLesson.type === 'FILE_UPLOAD' && (
              <div className="bg-neutral-50 rounded-xl p-10 border border-neutral-100 mb-8 text-center">
                {lessonStatus === 'COMPLETED' ? (
                  <div className="flex flex-col items-center gap-6">
                    <FileCheckIcon size={48} />
                    <p className="font-black text-[#0F2B3C] uppercase tracking-tight">Certification Logged: {progressData?.fileName}</p>
                    {progressData?.fileUrl && (
                      <button onClick={() => window.open(progressData.fileUrl)} className="text-xs font-bold text-[#0F2B3C] underline">View Copy</button>
                    )}

                    {/* Navigation for completed file uploads */}
                    {(() => {
                      const currentModule = curriculumArray.find(m =>
                        m.lessons.some(l => l.id === selectedLesson.id)
                      );
                      const currentLessonIndex = currentModule?.lessons.findIndex(l => l.id === selectedLesson.id) ?? -1;
                      const previousLesson = currentLessonIndex > 0 ? currentModule?.lessons[currentLessonIndex - 1] : null;
                      const nextLesson = currentModule && currentLessonIndex < currentModule.lessons.length - 1
                        ? currentModule.lessons[currentLessonIndex + 1]
                        : null;

                      return (previousLesson || nextLesson) ? (
                        <div className="flex flex-row items-center gap-3 w-full max-w-md mt-4">
                          {previousLesson && (
                            <button
                              onClick={() => {
                                setSelectedLesson(previousLesson);
                                setIsQuizSubmitted(false);
                                setQuizScore(null);
                                setUserAnswers({});
                              }}
                              className="flex items-center justify-center gap-2 px-6 py-4 bg-neutral-100 text-neutral-700 rounded-xl font-bold hover:bg-neutral-200 transition-all shadow-lg tracking-wide uppercase text-xs"
                            >
                              <ArrowLeft size={16} strokeWidth={3} />
                              <span className="hidden sm:inline">Previous</span>
                            </button>
                          )}

                          {nextLesson && (
                            <button
                              onClick={() => {
                                setSelectedLesson(nextLesson);
                                setIsQuizSubmitted(false);
                                setQuizScore(null);
                                setUserAnswers({});
                              }}
                              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-bold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg tracking-wide uppercase text-xs"
                            >
                              <span>Next Lesson</span>
                              <ChevronRight size={16} strokeWidth={3} />
                            </button>
                          )}
                        </div>
                      ) : null;
                    })()}
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-neutral-200 rounded-xl p-12 hover:border-[#0F2B3C] hover:bg-white transition-all group cursor-pointer"
                    >
                      <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                      <div className="flex flex-col items-center gap-4">
                        <Upload size={32} className="text-neutral-300 group-hover:text-[#0F2B3C] transition-colors" />
                        <p className="font-black text-[#0F2B3C] tracking-tight text-lg">{uploadingFile ? uploadingFile.name : (selectedLesson.fileLabel || 'Choose File')}</p>
                      </div>
                    </div>
                    {uploadingFile && (
                      <button onClick={submitFileUpload} className="w-full sm:w-auto px-10 py-4 bg-[#0F2B3C] text-white rounded-xl font-black shadow-xl hover:bg-blue-900 transition-all uppercase tracking-widest text-xs">
                        Confirm Submission
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {selectedLesson.type === 'QUIZ' && (
              <div className="space-y-8">
                {isEditMode && (
                  <button 
                    onClick={() => {
                      const newQuestions = [...(selectedLesson.quizQuestions || []), {
                        id: `q-${Date.now()}`,
                        type: 'MULTIPLE_CHOICE',
                        question: 'New Question?',
                        options: ['Option 1', 'Option 2'],
                        correctAnswers: ['Option 1']
                      } as QuizQuestion];
                      handleUpdateLesson(selectedLesson.id, { quizQuestions: newQuestions });
                    }}
                    className="w-full py-4 border-2 border-dashed border-neutral-200 rounded-xl text-neutral-400 font-bold hover:bg-neutral-50 hover:text-[#0F2B3C] hover:border-[#0F2B3C] transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-[10px]"
                  >
                    <Plus size={16} /> Add Question
                  </button>
                )}
                
                {selectedLesson.quizQuestions?.map((q, idx) => (
                  <div key={q.id} className="bg-neutral-50 p-6 sm:p-8 rounded-xl border border-neutral-100 group relative">
                    {isEditMode && (
                      <div className="absolute top-4 right-4 flex items-center gap-2">
                        <select 
                          value={q.type}
                          onChange={(e) => handleUpdateQuizQuestion(q.id, { type: e.target.value as any })}
                          className="bg-white border border-neutral-200 rounded-lg px-2 py-1 text-[8px] font-black uppercase"
                        >
                          <option value="MULTIPLE_CHOICE">Single Choice</option>
                          <option value="SELECT_ALL">Multiple Choice</option>
                          <option value="TRUE_FALSE">True/False</option>
                        </select>
                        <button 
                          onClick={() => {
                            const newQuestions = selectedLesson.quizQuestions?.filter(item => item.id !== q.id);
                            handleUpdateLesson(selectedLesson.id, { quizQuestions: newQuestions });
                          }}
                          className="p-1 text-red-500 hover:bg-red-50 rounded"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}

                    <div className="mb-6">
                      {isEditMode ? (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-[8px] font-black text-neutral-400 uppercase tracking-widest block">Question 0{idx + 1}</label>
                            <input
                              value={q.question}
                              onChange={(e) => handleUpdateQuizQuestion(q.id, { question: e.target.value })}
                              className="w-full font-bold text-lg bg-transparent border-none p-0 focus:ring-0 text-[#0F2B3C]"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[8px] font-black text-neutral-400 uppercase tracking-widest block">Explanation (Why This Matters)</label>
                            <textarea
                              value={q.explanation || ''}
                              onChange={(e) => handleUpdateQuizQuestion(q.id, { explanation: e.target.value })}
                              placeholder="Help trainees understand why this answer is correct..."
                              rows={2}
                              className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/50"
                            />
                          </div>
                        </div>
                      ) : (
                        <p className="font-bold text-lg text-[#0F2B3C]">0{idx + 1}. {q.question}</p>
                      )}
                    </div>

                    <div className="grid gap-3">
                      {(q.type === 'TRUE_FALSE' ? ['True', 'False'] : (q.options || [])).map((opt, oIdx) => {
                        const isSelected = isEditMode 
                          ? q.correctAnswers.includes(opt)
                          : (userAnswers[q.id] || []).includes(opt);
                        
                        return (
                          <div key={oIdx} className="flex items-center gap-2 group/opt">
                            <label 
                              onClick={() => isEditMode ? toggleCorrectAnswer(q.id, opt) : handleAnswerChange(q.id, opt, q.type)} 
                              className={`flex-1 flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${isSelected ? 'border-[#0F2B3C] bg-blue-50/50' : 'bg-white border-neutral-100 hover:border-neutral-200'}`}
                            >
                              <div className={`w-5 h-5 rounded flex items-center justify-center border ${isSelected ? 'bg-[#0F2B3C] text-white' : 'bg-white border-neutral-200'}`}>
                                {isSelected && <Check size={12} strokeWidth={4} />}
                              </div>
                              {isEditMode && q.type !== 'TRUE_FALSE' ? (
                                <input 
                                  value={opt}
                                  onChange={(e) => {
                                    const newOptions = [...(q.options || [])];
                                    const oldVal = newOptions[oIdx];
                                    newOptions[oIdx] = e.target.value;
                                    const newCorrect = q.correctAnswers.map(ans => ans === oldVal ? e.target.value : ans);
                                    handleUpdateQuizQuestion(q.id, { options: newOptions, correctAnswers: newCorrect });
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  className="flex-1 bg-transparent border-none p-0 text-sm font-bold text-neutral-700 focus:ring-0"
                                />
                              ) : (
                                <span className="text-sm font-bold text-neutral-700">{opt}</span>
                              )}
                            </label>
                            {isEditMode && q.type !== 'TRUE_FALSE' && (
                              <button 
                                onClick={() => handleRemoveQuizOption(q.id, oIdx)}
                                className="p-2 text-neutral-300 hover:text-red-500 opacity-0 group-hover/opt:opacity-100 transition-opacity"
                              >
                                <X size={14} />
                              </button>
                            )}
                          </div>
                        );
                      })}
                      {isEditMode && q.type !== 'TRUE_FALSE' && (
                        <button 
                          onClick={() => handleAddQuizOption(q.id)}
                          className="flex items-center gap-2 text-[9px] font-black text-blue-600 uppercase tracking-widest mt-2 px-4"
                        >
                          <Plus size={14} /> Add Option
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!isEditMode && (
              <div className="mt-8 flex flex-col items-center gap-3">
                {selectedLesson.type === 'QUIZ' && isQuizSubmitted ? (
                  <div className="flex flex-col items-center gap-6 w-full animate-in zoom-in duration-300">
                    <div className={`text-xl font-black uppercase tracking-widest ${quizScore! >= 80 ? 'text-green-600' : 'text-red-600'}`}>
                      Score: {quizScore}% {quizScore! >= 80 ? '- PASS' : '- FAIL'}
                    </div>

                    {/* Quiz Review Toggle */}
                    <button
                      onClick={() => setShowQuizReview(!showQuizReview)}
                      className="flex items-center gap-2 px-6 py-3 bg-blue-50 text-blue-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-100 transition-all"
                    >
                      <Eye size={14} />
                      {showQuizReview ? 'Hide Review' : 'Review Answers'}
                    </button>

                    {/* Answer Review Section */}
                    {showQuizReview && selectedLesson.quizQuestions && (
                      <div className="w-full space-y-4">
                        {selectedLesson.quizQuestions.map((q, idx) => {
                          const userAnswer = userAnswers[q.id] || [];
                          const isCorrect = userAnswer.length === q.correctAnswers.length &&
                                          userAnswer.every(a => q.correctAnswers.includes(a));

                          return (
                            <div key={q.id} className={`p-6 rounded-xl border-2 ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                              <div className="flex items-start gap-3 mb-4">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isCorrect ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                                  {isCorrect ? <Check size={16} strokeWidth={3} /> : <X size={16} strokeWidth={3} />}
                                </div>
                                <div className="flex-1">
                                  <p className="font-bold text-sm text-[#0F2B3C] mb-2">0{idx + 1}. {q.question}</p>
                                  {!isCorrect && (
                                    <div className="space-y-2 mb-3">
                                      <div className="text-xs">
                                        <span className="font-black text-red-600 uppercase tracking-widest">Your Answer: </span>
                                        <span className="font-medium text-red-700">{userAnswer.join(', ')}</span>
                                      </div>
                                      <div className="text-xs">
                                        <span className="font-black text-green-600 uppercase tracking-widest">Correct: </span>
                                        <span className="font-medium text-green-700">{q.correctAnswers.join(', ')}</span>
                                      </div>
                                    </div>
                                  )}
                                  {q.explanation && (
                                    <div className="mt-3 p-3 bg-white/50 rounded-lg border border-blue-100">
                                      <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1">Why This Matters:</p>
                                      <p className="text-xs text-neutral-700 font-medium leading-relaxed">{q.explanation}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Navigation and Actions */}
                    {(() => {
                      // Find current module and lesson position for navigation
                      const currentModule = curriculumArray.find(m =>
                        m.lessons.some(l => l.id === selectedLesson.id)
                      );
                      const currentLessonIndex = currentModule?.lessons.findIndex(l => l.id === selectedLesson.id) ?? -1;
                      const previousLesson = currentLessonIndex > 0 ? currentModule?.lessons[currentLessonIndex - 1] : null;
                      const nextLesson = currentModule && currentLessonIndex < currentModule.lessons.length - 1
                        ? currentModule.lessons[currentLessonIndex + 1]
                        : null;

                      return (
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
                          {/* Previous Lesson Button */}
                          {previousLesson && (
                            <button
                              onClick={() => {
                                setSelectedLesson(previousLesson);
                                setIsQuizSubmitted(false);
                                setQuizScore(null);
                                setUserAnswers({});
                                setShowQuizReview(false);
                              }}
                              className="flex items-center justify-center gap-2 px-6 py-4 bg-neutral-100 text-neutral-700 rounded-xl font-bold hover:bg-neutral-200 transition-all shadow-lg tracking-wide uppercase text-xs"
                            >
                              <ArrowLeft size={16} strokeWidth={3} />
                              <span className="hidden sm:inline">Previous</span>
                            </button>
                          )}

                          {/* Retake Quiz Button (only if failed) */}
                          {quizScore! < 80 && (
                            <button
                              onClick={() => { setIsQuizSubmitted(false); setQuizScore(null); setUserAnswers({}); setShowQuizReview(false); }}
                              className="flex-1 flex items-center justify-center gap-2 px-10 py-4 bg-[#0F2B3C] text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-900 transition-all shadow-lg"
                            >
                              <RefreshCw size={14} strokeWidth={3} /> Retake Quiz
                            </button>
                          )}

                          {/* Next Lesson Button */}
                          {nextLesson && (
                            <button
                              onClick={() => {
                                setSelectedLesson(nextLesson);
                                setIsQuizSubmitted(false);
                                setQuizScore(null);
                                setUserAnswers({});
                                setShowQuizReview(false);
                              }}
                              className="flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-bold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg tracking-wide uppercase text-xs"
                            >
                              <span className="hidden sm:inline">Next</span>
                              <ChevronRight size={16} strokeWidth={3} />
                            </button>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  selectedLesson.type !== 'FILE_UPLOAD' && (() => {
                    // Check if all items requiring photos have photos
                    const itemsNeedingPhotos = selectedLesson.checklistItems?.filter(item => item.requiresPhoto) || [];
                    const allPhotosProvided = itemsNeedingPhotos.every(item => !!checklistPhotos[item.id]);
                    const hasChecklist = selectedLesson.checklistItems && selectedLesson.checklistItems.length > 0;
                    const allItemsChecked = hasChecklist && checkedItems.length >= selectedLesson.checklistItems!.length;

                    // Find current module and lesson position for navigation
                    const currentModule = curriculumArray.find(m =>
                      m.lessons.some(l => l.id === selectedLesson.id)
                    );
                    const currentLessonIndex = currentModule?.lessons.findIndex(l => l.id === selectedLesson.id) ?? -1;
                    const previousLesson = currentLessonIndex > 0 ? currentModule?.lessons[currentLessonIndex - 1] : null;
                    const nextLesson = currentModule && currentLessonIndex < currentModule.lessons.length - 1
                      ? currentModule.lessons[currentLessonIndex + 1]
                      : null;

                    return (
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full">
                        {/* Previous Lesson Button */}
                        {previousLesson && (
                          <button
                            onClick={() => {
                              setSelectedLesson(previousLesson);
                              setIsQuizSubmitted(false);
                              setQuizScore(null);
                              setUserAnswers({});
                            }}
                            className="flex items-center justify-center gap-2 px-6 py-4 bg-neutral-100 text-neutral-700 rounded-xl font-bold hover:bg-neutral-200 transition-all shadow-lg tracking-wide uppercase text-xs"
                          >
                            <ArrowLeft size={16} strokeWidth={3} />
                            <span className="hidden sm:inline">Previous</span>
                          </button>
                        )}

                        {/* Complete Lesson Button */}
                        <button
                          onClick={() => {
                            if (selectedLesson.type === 'QUIZ') {
                              submitQuiz();
                            } else if (hasChecklist) {
                              onCompleteLesson(selectedLesson.id, undefined, undefined, checkedItems, checklistPhotos);
                            } else {
                              onCompleteLesson(selectedLesson.id);
                            }
                          }}
                          disabled={
                            lessonStatus === 'COMPLETED' ||
                            (selectedLesson.type === 'QUIZ' && !allQuestionsAnswered) ||
                            (hasChecklist && (!allItemsChecked || !allPhotosProvided))
                          }
                          className="flex-1 px-12 py-5 bg-[#0F2B3C] text-white rounded-xl font-black hover:bg-blue-900 disabled:opacity-50 transition-all shadow-xl tracking-widest uppercase text-xs"
                        >
                          {selectedLesson.type === 'QUIZ' ? 'Submit Knowledge Check' :
                           hasChecklist ? 'Submit Checklist' : 'Complete Lesson'}
                        </button>

                        {/* Next Lesson Button */}
                        {nextLesson && (
                          <button
                            onClick={() => {
                              setSelectedLesson(nextLesson);
                              setIsQuizSubmitted(false);
                              setQuizScore(null);
                              setUserAnswers({});
                            }}
                            className="flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-bold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg tracking-wide uppercase text-xs"
                          >
                            <span className="hidden sm:inline">Next</span>
                            <ChevronRight size={16} strokeWidth={3} />
                          </button>
                        )}
                      </div>
                    );
                  })()
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const continuedModules = curriculumArray.filter(m => m.category === 'CONTINUED');

  const renderModuleSection = (modules: TrainingModule[], title: string, subtitle: string, icon: any) => (
    <div className="space-y-8">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-[#0F2B3C] text-white rounded-xl shadow-xl">
            {React.createElement(icon, { size: 24, strokeWidth: 3 })}
          </div>
          <div>
            <h2 className="text-xl sm:text-3xl font-black text-[#0F2B3C] tracking-tighter uppercase leading-none">{title}</h2>
            <p className="text-neutral-400 text-xs sm:text-sm font-medium mt-1">{subtitle}</p>
          </div>
        </div>
        {isEditMode && (
          <button onClick={() => handleAddModule(modules[0]?.category || 'ONBOARDING')} className="p-3 bg-[#0F2B3C] text-white rounded-xl shadow-lg active:scale-90 transition-all">
            <Plus size={18} strokeWidth={3} />
          </button>
        )}
      </div>

      <div className="grid gap-8">
        {modules.map(module => (
          <div key={module.id} className="space-y-4">
            <div className="flex items-center justify-between px-2">
              {isEditMode ? (
                <div className="flex-1 max-w-md space-y-2">
                  <input 
                    value={module.title}
                    onChange={(e) => handleUpdateModule(module.id, { title: e.target.value })}
                    className="text-xl font-black text-[#0F2B3C] tracking-tight uppercase bg-neutral-50 border-none p-1 rounded w-full"
                  />
                  <input 
                    value={module.description}
                    onChange={(e) => handleUpdateModule(module.id, { description: e.target.value })}
                    className="text-xs text-neutral-400 font-medium block bg-neutral-50 border-none p-1 rounded w-full"
                  />
                </div>
              ) : (
                <h3 className="text-xl font-black text-[#0F2B3C] tracking-tight uppercase">{module.title}</h3>
              )}
              {isEditMode && (
                <button onClick={() => setDeleteConfirm({ id: module.id, title: module.title, code: 'DELETE', input: '' })} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors">
                  <Trash2 size={18} />
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filterLessons(module.lessons).map(lesson => {
                const status = getStatus(lesson.id);
                const isHidden = !showCompletedOnboarding && status === 'COMPLETED' && !isEditMode;
                const progressData = getProgressData(lesson.id);
                if (isHidden) return null;

                return (
                  <button
                    key={lesson.id}
                    onClick={() => setSelectedLesson(lesson)}
                    className={`flex items-center justify-between p-6 bg-white rounded-xl border transition-all duration-300 text-left hover:border-[#0F2B3C] hover:shadow-xl group ${status === 'COMPLETED' ? 'border-green-100' : 'border-neutral-100'}`}
                  >
                    <div className="flex items-center gap-5">
                      {/* Icon with progress indicator */}
                      <div className="relative">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${status === 'COMPLETED' ? 'bg-green-50 text-green-600' : 'bg-neutral-50 text-neutral-300 group-hover:bg-[#0F2B3C] group-hover:text-white'}`}>
                          {lesson.type === 'QUIZ' ? <PenTool size={20} /> : lesson.type === 'FILE_UPLOAD' ? <Upload size={20} /> : lesson.type === 'PRACTICE' ? <Target size={20} /> : lesson.type === 'VIDEO' || lesson.videoUrl ? <PlayCircle size={20} /> : <BookOpen size={20} />}
                        </div>
                        {/* Attempt count badge for practice lessons */}
                        {lesson.type === 'PRACTICE' && progressData?.attemptCount && progressData.attemptCount > 1 && (
                          <div className="absolute -top-1 -right-1 bg-blue-600 text-white text-[9px] font-black rounded-full w-5 h-5 flex items-center justify-center">
                            {progressData.attemptCount}
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-black text-sm tracking-tight">{lesson.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[8px] font-black text-neutral-400 uppercase tracking-widest">{lesson.type}</span>
                          {lesson.videoUrl && (
                            <div className="flex items-center gap-1 text-[8px] font-bold text-blue-500">
                              <Video size={10} />
                              <span>Video</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-neutral-200 group-hover:text-[#0F2B3C]" />
                  </button>
                );
              })}
              {isEditMode && (
                <button onClick={() => handleAddLesson(module.id)} className="flex items-center justify-center p-6 bg-neutral-50 border-2 border-dashed border-neutral-200 rounded-xl text-neutral-400 hover:border-[#0F2B3C] hover:text-[#0F2B3C] transition-all">
                  <Plus size={24} strokeWidth={3} />
                </button>
              )}
            </div>
          </div>
        ))}
        {modules.length === 0 && !isEditMode && (
          <div className="p-12 text-center border-2 border-dashed border-neutral-100 rounded-xl text-neutral-300 font-bold uppercase tracking-widest text-[10px]">
            No modules currently assigned to this track.
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-16 sm:space-y-24 animate-in fade-in duration-700">
      {/* Offline Indicator */}
      {isOffline && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-4 rounded-xl flex items-center justify-between shadow-lg animate-in slide-in-from-top-4">
          <div className="flex items-center gap-3">
            <CloudOff size={20} />
            <div>
              <p className="text-sm font-black uppercase tracking-tight">Offline Mode</p>
              <p className="text-xs font-medium opacity-90">Some features may be limited. Content will sync when you're back online.</p>
            </div>
          </div>
        </div>
      )}

      <header className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl sm:text-5xl font-[900] text-[#0F2B3C] tracking-tighter mb-4 uppercase">Academy</h1>
            <p className="text-neutral-500 font-medium text-sm sm:text-base">Operational mastery through self-paced learning.</p>
          </div>
          {canEdit && (
            <button
              onClick={() => setIsEditMode(!isEditMode)}
              className={`px-8 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-lg transition-all ${isEditMode ? 'bg-green-600 text-white' : 'bg-[#0F2B3C] text-white'}`}
            >
              {isEditMode ? <><Save size={16} /> Finish Editing</> : <><Edit3 size={16} /> Edit Curriculum</>}
            </button>
          )}
        </div>

        {/* Handbook Upload Section (Edit Mode Only) */}
        {isEditMode && (
          <div className="bg-blue-50 rounded-xl p-6 border-2 border-blue-200">
            <h3 className="text-sm font-black text-[#0F2B3C] uppercase tracking-widest mb-4 flex items-center gap-2">
              <FileIcon size={16} />
              Upload Employee Handbook
            </h3>
            <p className="text-xs text-neutral-600 mb-4">
              Upload a PDF of the current employee handbook. This will be linked in Module 1 for all trainees to review.
            </p>
            <input
              type="file"
              accept=".pdf"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;

                if (file.type !== 'application/pdf') {
                  alert('Please upload a PDF file');
                  return;
                }

                const confirmed = confirm(`Upload "${file.name}" as the employee handbook? This will replace the current handbook link in Module 1.`);
                if (!confirmed) return;

                try {
                  console.log('[Handbook] Uploading PDF to Firebase Storage...');
                  const storageRef = (window as any).firebase.storage().ref('documents/employee-handbook.pdf');
                  const uploadTask = await storageRef.put(file);
                  const downloadURL = await uploadTask.ref.getDownloadURL();

                  console.log('[Handbook] Upload complete:', downloadURL);

                  // Update Module 1, Lesson 1 (l-handbook-review) with new URL
                  const nextCurriculum = curriculumArray.map(module => {
                    if (module.id === 'm-onboarding') {
                      return {
                        ...module,
                        lessons: module.lessons.map(lesson => {
                          if (lesson.id === 'l-handbook-review') {
                            return {
                              ...lesson,
                              content: lesson.content?.replace(
                                '[INSERT HANDBOOK LINK HERE - Ask your manager for the current handbook file]',
                                downloadURL
                              ).replace(
                                /https:\/\/firebasestorage\.googleapis\.com[^\s]*/g,
                                downloadURL
                              ) || ''
                            };
                          }
                          return lesson;
                        })
                      };
                    }
                    return module;
                  });

                  onUpdateCurriculum?.(nextCurriculum);
                  alert('✓ Handbook uploaded successfully! The link has been updated in Module 1.');

                  // Reset file input
                  e.target.value = '';
                } catch (error: any) {
                  console.error('[Handbook] Upload failed:', error);
                  alert(`Upload failed: ${error.message}`);
                }
              }}
              className="block w-full text-sm text-neutral-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#0F2B3C] file:text-white hover:file:bg-[#003366] file:cursor-pointer cursor-pointer"
            />
          </div>
        )}

        {/* Overall Progress Visualization */}
        {!isEditMode && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Circular Progress Indicator */}
              <div className="relative w-32 h-32 shrink-0">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="64" cy="64" r="56" fill="none" stroke="#E5E7EB" strokeWidth="8" />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    fill="none"
                    stroke="#0F2B3C"
                    strokeWidth="8"
                    strokeDasharray={`${2 * Math.PI * 56}`}
                    strokeDashoffset={`${2 * Math.PI * 56 * (1 - overallProgressPercent / 100)}`}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-3xl font-black text-[#0F2B3C]">{overallProgressPercent}%</div>
                    <div className="text-[8px] font-bold text-neutral-500 uppercase tracking-wider">Complete</div>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="flex-1 grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-black text-[#0F2B3C]">{completedLessonsCount}</div>
                  <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mt-1">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-black text-blue-600">{allLessons.length - completedLessonsCount}</div>
                  <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mt-1">Remaining</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-black text-green-600">{allLessons.length}</div>
                  <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mt-1">Total Lessons</div>
                </div>
              </div>

              {/* Achievement Badge */}
              {overallProgressPercent === 100 && (
                <div className="flex items-center gap-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-3 rounded-xl shadow-lg animate-in zoom-in">
                  <Medal size={24} />
                  <div>
                    <div className="text-xs font-black uppercase tracking-widest">Academy</div>
                    <div className="text-lg font-black">Graduate</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Search & Filter Bar */}
        {!isEditMode && (
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Search lessons..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-neutral-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>

            {/* Type Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-4 py-3 bg-white border border-neutral-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none pr-10"
            >
              <option value="ALL">All Types</option>
              <option value="CONTENT">Content</option>
              <option value="QUIZ">Quiz</option>
              <option value="PRACTICE">Practice</option>
              <option value="FILE_UPLOAD">Upload</option>
            </select>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-4 py-3 bg-white border border-neutral-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none pr-10"
            >
              <option value="ALL">All Status</option>
              <option value="COMPLETED">Completed</option>
              <option value="INCOMPLETE">Incomplete</option>
            </select>
          </div>
        )}
      </header>

      {/* Custom Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[100] bg-[#0F2B3C]/60 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-200">
           <div className="bg-white rounded-xl p-8 max-w-sm w-full shadow-lg border border-neutral-100 text-center">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-black text-[#0F2B3C] uppercase tracking-tight mb-2">Delete Module?</h3>
              <p className="text-neutral-500 text-sm font-medium mb-6 leading-relaxed">
                Type <span className="font-black text-red-600">DELETE</span> to confirm removal of <span className="font-bold text-[#0F2B3C]">"{deleteConfirm.title}"</span>.
              </p>
              <input 
                autoFocus
                value={deleteConfirm.input}
                onChange={e => setDeleteConfirm({...deleteConfirm, input: e.target.value})}
                placeholder="Type here..."
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 mb-6 text-center font-black uppercase text-sm tracking-widest focus:ring-2 focus:ring-red-500/10 outline-none"
              />
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-4 bg-neutral-100 text-neutral-400 font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-neutral-200 transition-colors">Cancel</button>
                <button 
                  disabled={deleteConfirm.input !== 'DELETE'}
                  onClick={handleDeleteModuleConfirmed} 
                  className="flex-1 py-4 bg-red-600 text-white font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-red-700 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
           </div>
        </div>
      )}

      {onboardingModules.length > 0 && (
        <div className="space-y-12">
          {renderModuleSection(onboardingModules, "Onboarding Pathway", "Foundation for new recruits.", Target)}
          {isOnboardingFullyComplete && !isEditMode && (
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-2 text-green-600 font-bold uppercase text-[10px] tracking-widest">
                <CheckCircle2 size={16} /> Pathway Graduated
              </div>
              <button
                onClick={() => setShowCompletedOnboarding(!showCompletedOnboarding)}
                className="text-[10px] font-black uppercase text-[#0F2B3C] border-b-2 border-[#0F2B3C]/10 hover:border-[#0F2B3C] transition-all flex items-center gap-2"
              >
                {showCompletedOnboarding ? <><EyeOff size={14} /> Hide Completed</> : <><Eye size={14} /> Review Completed Pathway</>}
              </button>
            </div>
          )}
        </div>
      )}

      {renderModuleSection(continuedModules, "Continued Excellence", "Ongoing operational training.", Zap)}

      {/* Peer Learning Section */}
      {!isEditMode && allLessons.length > 0 && (
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-8 border border-purple-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-600 text-white rounded-xl">
                <UsersIcon size={20} />
              </div>
              <div>
                <h3 className="text-lg font-black text-[#0F2B3C] uppercase tracking-tight">Team Activity</h3>
                <p className="text-xs text-neutral-500 font-medium">See what others are learning</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Leaderboard */}
            <div className="bg-white rounded-xl p-4 border border-purple-100">
              <div className="flex items-center gap-2 mb-4">
                <Trophy size={16} className="text-amber-500" />
                <h4 className="text-xs font-black text-[#0F2B3C] uppercase tracking-widest">Top Learners</h4>
              </div>
              <div className="space-y-3">
                {[1, 2, 3].map((rank) => (
                  <div key={rank} className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${rank === 1 ? 'bg-amber-100 text-amber-600' : rank === 2 ? 'bg-neutral-100 text-neutral-600' : 'bg-orange-100 text-orange-600'}`}>
                      {rank}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-[#0F2B3C]">Team Member</p>
                      <p className="text-[9px] text-neutral-500 font-medium">{Math.floor(Math.random() * 30 + 10)} lessons</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="md:col-span-2 bg-white rounded-xl p-4 border border-purple-100">
              <div className="flex items-center gap-2 mb-4">
                <Activity size={16} className="text-green-500" />
                <h4 className="text-xs font-black text-[#0F2B3C] uppercase tracking-widest">Recently Completed</h4>
              </div>
              <div className="space-y-2">
                {allLessons.slice(0, 5).map((lesson, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 border-b border-neutral-50 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#0F2B3C] text-white rounded-lg flex items-center justify-center text-[10px] font-black">
                        TM
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#0F2B3C]">{lesson.title}</p>
                        <p className="text-[9px] text-neutral-500 font-medium">Team Member • {Math.floor(Math.random() * 24)} hours ago</p>
                      </div>
                    </div>
                    <CheckCircle2 size={14} className="text-green-500" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-white/50 rounded-xl border border-purple-100 text-center">
            <p className="text-xs text-neutral-600 font-medium">
              <span className="font-black text-purple-600">{completedLessonsCount}</span> total completions across the team this month
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

function FileCheckIcon({ size }: { size: number }) {
  return (
    <div className="relative">
      <FileIcon size={size} className="text-[#0F2B3C]" />
      <div className="absolute -bottom-1 -right-1 bg-white rounded-full">
        <CheckCircle2 size={size / 2} className="text-green-600" />
      </div>
    </div>
  );
}

export default TrainingView;
