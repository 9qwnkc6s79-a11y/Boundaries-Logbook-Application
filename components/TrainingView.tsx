
import React, { useState, useEffect, useRef } from 'react';
import { TrainingModule, Lesson, UserProgress, QuizQuestion } from '../types';
import { CheckCircle2, Clock, ChevronRight, Play, BookOpen, PenTool, ClipboardCheck, ArrowLeft, RefreshCw, XCircle, Video, Settings, Plus, Save, Trash2, Edit3, X, Zap, Target, Eye, EyeOff, Trash, Check, Square, CheckSquare, Circle, Dot, Upload, FileText, File as FileIcon, GripVertical } from 'lucide-react';

interface TrainingViewProps {
  curriculum: TrainingModule[];
  progress: UserProgress[];
  onCompleteLesson: (lessonId: string, score?: number, fileData?: { url: string, name: string }) => void;
  canEdit?: boolean;
  onUpdateCurriculum?: (curriculum: TrainingModule[]) => void;
}

const TrainingView: React.FC<TrainingViewProps> = ({ curriculum, progress, onCompleteLesson, canEdit, onUpdateCurriculum }) => {
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

  const getStatus = (lessonId: string) => progress.find(p => p.lessonId === lessonId)?.status || 'NOT_STARTED';
  const getProgressData = (lessonId: string) => progress.find(p => p.lessonId === lessonId);

  // Safety filter
  const curriculumArray = Array.isArray(curriculum) ? curriculum : [];

  const onboardingModules = curriculumArray.filter(m => m.category === 'ONBOARDING');
  const onboardingLessons = onboardingModules.flatMap(m => m.lessons);
  const completedOnboardingCount = onboardingLessons.filter(l => getStatus(l.id) === 'COMPLETED').length;
  // Fixed typo: removed space in variable name
  const isOnboardingFullyComplete = onboardingLessons.length > 0 && completedOnboardingCount === onboardingLessons.length;

  useEffect(() => {
    let interval: any;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && timerActive) {
      setTimerActive(false);
      alert('Practice time complete!');
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

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

  const handleDeleteModule = (moduleId: string) => {
    if (!onUpdateCurriculum) return;
    const confirmation = window.prompt('To confirm deletion, type "DELETE":');
    if (confirmation !== 'DELETE') return;
    onUpdateCurriculum(curriculumArray.filter(m => m.id !== moduleId));
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
    
    return (
      <div className="space-y-6 sm:space-y-8 animate-in slide-in-from-right-4 duration-500">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => { setSelectedLesson(null); setIsQuizSubmitted(false); setQuizScore(null); setUserAnswers({}); }}
            className="flex items-center gap-2 text-neutral-400 hover:text-[#001F3F] font-bold text-[10px] sm:text-xs uppercase tracking-widest transition-colors"
          >
            <ArrowLeft size={14} strokeWidth={3} /> Return to Academy
          </button>
          
          {isEditMode && (
            <button 
              onClick={() => {
                if(confirm('Delete this lesson?')) {
                   const nextCurriculum = curriculumArray.map(m => ({
                    ...m,
                    lessons: m.lessons.filter(l => l.id !== selectedLesson.id)
                  }));
                  onUpdateCurriculum?.(nextCurriculum);
                  setSelectedLesson(null);
                }
              }} 
              className="p-2 sm:p-3 text-red-500 hover:bg-red-50 rounded-xl transition-all"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>

        <div className="bg-white rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-14 shadow-2xl border border-neutral-100 relative overflow-hidden">
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
                        className="px-4 py-2 rounded-full bg-[#001F3F] text-white text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] outline-none shadow-lg"
                      >
                        <option value="CONTENT">CONTENT</option>
                        <option value="QUIZ">QUIZ</option>
                        <option value="PRACTICE">PRACTICE</option>
                        <option value="FILE_UPLOAD">FILE UPLOAD</option>
                      </select>
                      <input 
                        value={selectedLesson.title}
                        onChange={(e) => handleUpdateLesson(selectedLesson.id, { title: e.target.value })}
                        className="text-2xl sm:text-4xl md:text-5xl font-black text-[#001F3F] tracking-tighter leading-tight w-full bg-neutral-50 border-none p-2 focus:ring-0 rounded-xl"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <span className="inline-block px-3 py-1 rounded-full bg-[#001F3F] text-white text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] mb-3 sm:mb-4">
                      {selectedLesson.type}
                    </span>
                    <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-[#001F3F] tracking-tighter leading-tight">{selectedLesson.title}</h2>
                  </>
                )}
              </div>
              {lessonStatus === 'COMPLETED' && !isEditMode && (
                <div className="flex items-center gap-2 text-green-600 font-bold bg-green-50 px-4 py-2 rounded-xl border border-green-100 shadow-sm animate-in zoom-in duration-300">
                  <CheckCircle2 size={18} />
                  <span>COMPLETED</span>
                </div>
              )}
            </div>

            {(selectedLesson.videoUrl || isEditMode) && (
              <div className="mb-8 sm:mb-12 rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden bg-black aspect-video shadow-2xl border-4 border-[#001F3F]/10 group relative">
                {selectedLesson.videoUrl ? (
                  <iframe
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
            )}

            {isEditMode && (
              <div className="mb-8 p-6 bg-neutral-50 rounded-2xl border border-neutral-100">
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

            {selectedLesson.type === 'FILE_UPLOAD' && (
              <div className="bg-neutral-50 rounded-[2rem] p-10 border border-neutral-100 mb-8 text-center">
                {lessonStatus === 'COMPLETED' ? (
                  <div className="flex flex-col items-center gap-4">
                    <FileCheckIcon size={48} />
                    <p className="font-black text-[#001F3F] uppercase tracking-tight">Certification Logged: {progressData?.fileName}</p>
                    {progressData?.fileUrl && (
                      <button onClick={() => window.open(progressData.fileUrl)} className="text-xs font-bold text-[#001F3F] underline">View Copy</button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-neutral-200 rounded-[2rem] p-12 hover:border-[#001F3F] hover:bg-white transition-all group cursor-pointer"
                    >
                      <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                      <div className="flex flex-col items-center gap-4">
                        <Upload size={32} className="text-neutral-300 group-hover:text-[#001F3F] transition-colors" />
                        <p className="font-black text-[#001F3F] tracking-tight text-lg">{uploadingFile ? uploadingFile.name : (selectedLesson.fileLabel || 'Choose File')}</p>
                      </div>
                    </div>
                    {uploadingFile && (
                      <button onClick={submitFileUpload} className="w-full sm:w-auto px-10 py-4 bg-[#001F3F] text-white rounded-2xl font-black shadow-xl hover:bg-blue-900 transition-all uppercase tracking-widest text-xs">
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
                    className="w-full py-4 border-2 border-dashed border-neutral-200 rounded-2xl text-neutral-400 font-bold hover:bg-neutral-50 hover:text-[#001F3F] hover:border-[#001F3F] transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-[10px]"
                  >
                    <Plus size={16} /> Add Question
                  </button>
                )}
                
                {selectedLesson.quizQuestions?.map((q, idx) => (
                  <div key={q.id} className="bg-neutral-50 p-6 sm:p-8 rounded-[2rem] border border-neutral-100 group relative">
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
                        <div className="space-y-2">
                          <label className="text-[8px] font-black text-neutral-400 uppercase tracking-widest block">Question 0{idx + 1}</label>
                          <input 
                            value={q.question}
                            onChange={(e) => handleUpdateQuizQuestion(q.id, { question: e.target.value })}
                            className="w-full font-bold text-lg bg-transparent border-none p-0 focus:ring-0 text-[#001F3F]"
                          />
                        </div>
                      ) : (
                        <p className="font-bold text-lg text-[#001F3F]">0{idx + 1}. {q.question}</p>
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
                              className={`flex-1 flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${isSelected ? 'border-[#001F3F] bg-blue-50/50' : 'bg-white border-neutral-100 hover:border-neutral-200'}`}
                            >
                              <div className={`w-5 h-5 rounded flex items-center justify-center border ${isSelected ? 'bg-[#001F3F] text-white' : 'bg-white border-neutral-200'}`}>
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
                  <div className="flex flex-col items-center gap-4 animate-in zoom-in duration-300">
                    <div className={`text-xl font-black uppercase tracking-widest ${quizScore! >= 80 ? 'text-green-600' : 'text-red-600'}`}>
                      Score: {quizScore}% {quizScore! >= 80 ? '- PASS' : '- FAIL'}
                    </div>
                    {quizScore! < 80 && (
                      <button 
                        onClick={() => { setIsQuizSubmitted(false); setQuizScore(null); setUserAnswers({}); }}
                        className="flex items-center gap-2 px-10 py-4 bg-neutral-100 text-[#001F3F] rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-neutral-200 transition-all shadow-md"
                      >
                        <RefreshCw size={14} strokeWidth={3} /> Reset Quiz & Retake
                      </button>
                    )}
                  </div>
                ) : (
                  selectedLesson.type !== 'FILE_UPLOAD' && (
                    <button 
                      onClick={selectedLesson.type === 'QUIZ' ? submitQuiz : () => onCompleteLesson(selectedLesson.id)}
                      disabled={lessonStatus === 'COMPLETED' || (selectedLesson.type === 'QUIZ' && !allQuestionsAnswered)}
                      className="w-full sm:w-auto px-12 py-5 bg-[#001F3F] text-white rounded-2xl font-black hover:bg-blue-900 disabled:opacity-50 transition-all shadow-xl tracking-widest uppercase text-xs"
                    >
                      {selectedLesson.type === 'QUIZ' ? 'Submit Knowledge Check' : 'Complete Lesson'}
                    </button>
                  )
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
          <div className="p-3 bg-[#001F3F] text-white rounded-2xl shadow-xl">
            {React.createElement(icon, { size: 24, strokeWidth: 3 })}
          </div>
          <div>
            <h2 className="text-xl sm:text-3xl font-black text-[#001F3F] tracking-tighter uppercase leading-none">{title}</h2>
            <p className="text-neutral-400 text-xs sm:text-sm font-medium mt-1">{subtitle}</p>
          </div>
        </div>
        {isEditMode && (
          <button onClick={() => handleAddModule(modules[0]?.category || 'ONBOARDING')} className="p-3 bg-[#001F3F] text-white rounded-xl shadow-lg active:scale-90 transition-all">
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
                    className="text-xl font-black text-[#001F3F] tracking-tight uppercase bg-neutral-50 border-none p-1 rounded w-full"
                  />
                  <input 
                    value={module.description}
                    onChange={(e) => handleUpdateModule(module.id, { description: e.target.value })}
                    className="text-xs text-neutral-400 font-medium block bg-neutral-50 border-none p-1 rounded w-full"
                  />
                </div>
              ) : (
                <h3 className="text-xl font-black text-[#001F3F] tracking-tight uppercase">{module.title}</h3>
              )}
              {isEditMode && (
                <button onClick={() => handleDeleteModule(module.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors">
                  <Trash2 size={18} />
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {module.lessons.map(lesson => {
                const status = getStatus(lesson.id);
                const isHidden = !showCompletedOnboarding && status === 'COMPLETED' && !isEditMode;
                if (isHidden) return null;

                return (
                  <button
                    key={lesson.id}
                    onClick={() => setSelectedLesson(lesson)}
                    className={`flex items-center justify-between p-6 bg-white rounded-[2rem] border transition-all duration-300 text-left hover:border-[#001F3F] hover:shadow-xl group ${status === 'COMPLETED' ? 'border-green-100' : 'border-neutral-100'}`}
                  >
                    <div className="flex items-center gap-5">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${status === 'COMPLETED' ? 'bg-green-50 text-green-600' : 'bg-neutral-50 text-neutral-300 group-hover:bg-[#001F3F] group-hover:text-white'}`}>
                        {lesson.type === 'QUIZ' ? <PenTool size={20} /> : lesson.type === 'FILE_UPLOAD' ? <Upload size={20} /> : <BookOpen size={20} />}
                      </div>
                      <div>
                        <h4 className="font-bold text-black text-sm tracking-tight">{lesson.title}</h4>
                        <span className="text-[8px] font-black text-neutral-400 uppercase tracking-widest">{lesson.type}</span>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-neutral-200 group-hover:text-[#001F3F]" />
                  </button>
                );
              })}
              {isEditMode && (
                <button onClick={() => handleAddLesson(module.id)} className="flex items-center justify-center p-6 bg-neutral-50 border-2 border-dashed border-neutral-200 rounded-[2rem] text-neutral-400 hover:border-[#001F3F] hover:text-[#001F3F] transition-all">
                  <Plus size={24} strokeWidth={3} />
                </button>
              )}
            </div>
          </div>
        ))}
        {modules.length === 0 && !isEditMode && (
          <div className="p-12 text-center border-2 border-dashed border-neutral-100 rounded-[3rem] text-neutral-300 font-bold uppercase tracking-widest text-[10px]">
            No modules currently assigned to this track.
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-16 sm:space-y-24 animate-in fade-in duration-700">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl sm:text-6xl font-[900] text-[#001F3F] tracking-tighter mb-4 uppercase">Academy</h1>
          <p className="text-neutral-500 font-medium text-base sm:text-lg">Operational mastery through self-paced learning.</p>
        </div>
        {canEdit && (
          <button 
            onClick={() => setIsEditMode(!isEditMode)}
            className={`px-8 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-lg transition-all ${isEditMode ? 'bg-green-600 text-white' : 'bg-[#001F3F] text-white'}`}
          >
            {isEditMode ? <><Save size={16} /> Finish Editing</> : <><Edit3 size={16} /> Edit Curriculum</>}
          </button>
        )}
      </header>

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
                className="text-[10px] font-black uppercase text-[#001F3F] border-b-2 border-[#001F3F]/10 hover:border-[#001F3F] transition-all flex items-center gap-2"
              >
                {showCompletedOnboarding ? <><EyeOff size={14} /> Hide Completed</> : <><Eye size={14} /> Review Completed Pathway</>}
              </button>
            </div>
          )}
        </div>
      )}
      
      {renderModuleSection(continuedModules, "Continued Excellence", "Ongoing operational training.", Zap)}
    </div>
  );
};

function FileCheckIcon({ size }: { size: number }) {
  return (
    <div className="relative">
      <FileIcon size={size} className="text-[#001F3F]" />
      <div className="absolute -bottom-1 -right-1 bg-white rounded-full">
        <CheckCircle2 size={size / 2} className="text-green-600" />
      </div>
    </div>
  );
}

export default TrainingView;
