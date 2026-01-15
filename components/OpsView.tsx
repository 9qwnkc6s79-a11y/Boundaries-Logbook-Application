
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChecklistTemplate, User, ChecklistSubmission } from '../types';
import { Camera, Check, AlertCircle, Info, Send, ChevronRight, X, Clock, User as UserIcon, MessageSquare, Save, RotateCcw, Users, RefreshCw, Trash2, CheckCircle2, ShieldCheck, AlertTriangle, Sunrise, Sunset, ClipboardList, CalendarCheck, CloudCheck, CalendarDays, Timer, Lock, Eye } from 'lucide-react';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (dataUrl: string) => void;
}

const CameraModal: React.FC<CameraModalProps> = ({ isOpen, onClose, onCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      startCamera();
      setPreviewUrl(null);
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen]);

  const startCamera = async () => {
    setIsStarting(true);
    setError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setError('Camera access denied. Please allow camera permissions in your browser settings.');
    } finally {
      setIsStarting(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const handleShutter = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setPreviewUrl(dataUrl);
      }
    }
  };

  const handleConfirm = () => {
    if (previewUrl) {
      onCapture(previewUrl);
      onClose();
    }
  };

  const handleRetake = () => {
    setPreviewUrl(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-[#001F3F]/95 backdrop-blur-xl flex flex-col items-center justify-center p-3 sm:p-8 animate-in fade-in duration-300">
      <div className="w-full max-w-2xl bg-black rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10 relative">
        <div className="aspect-[3/4] sm:aspect-video relative bg-neutral-900">
          {previewUrl ? (
            <img src={previewUrl} className="w-full h-full object-cover animate-in zoom-in-95 duration-300" alt="Preview" />
          ) : (
            <>
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="w-full h-full object-cover"
              />
              {isStarting && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
                  <RefreshCw className="animate-spin text-white mb-4" size={32} />
                  <p className="text-white text-[8px] font-black uppercase tracking-[0.2em]">Lens Syncing...</p>
                </div>
              )}
            </>
          )}

          {error && !previewUrl && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-neutral-900">
              <AlertCircle size={40} className="text-red-500 mb-4" />
              <p className="text-white font-bold mb-4 text-sm">{error}</p>
              <button 
                onClick={startCamera}
                className="px-6 py-3 bg-white text-[#001F3F] rounded-xl font-black text-xs active:scale-95 transition-all"
              >
                RETRY
              </button>
            </div>
          )}
        </div>
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-black/40 backdrop-blur-md rounded-full text-white border border-white/10 z-20"
        >
          <X size={18} strokeWidth={3} />
        </button>

        <div className="p-6 sm:p-8 bg-neutral-900/50 backdrop-blur-md border-t border-white/5">
          {previewUrl ? (
            <div className="flex items-center gap-3 animate-in slide-in-from-bottom-4">
              <button 
                onClick={handleRetake}
                className="flex-1 px-4 py-3 bg-white/10 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
              >
                Retake
              </button>
              <button 
                onClick={handleConfirm}
                className="flex-[2] px-4 py-3 bg-white text-[#001F3F] rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl"
              >
                Confirm
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              {!error && !isStarting && (
                <button 
                  onClick={handleShutter}
                  className="w-16 h-16 rounded-full bg-white flex items-center justify-center p-1 active:scale-90 transition-all group"
                >
                  <div className="w-full h-full rounded-full border-[3px] border-[#001F3F] flex items-center justify-center">
                    <div className="w-10 h-10 bg-[#001F3F] rounded-full group-hover:scale-90 transition-transform" />
                  </div>
                </button>
              )}
              <div className="text-center">
                <p className="text-blue-200 text-[8px] font-black uppercase tracking-[0.3em]">Operational Verification</p>
              </div>
            </div>
          )}
        </div>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

interface OpsViewProps {
  user: User;
  allUsers: User[];
  templates: ChecklistTemplate[];
  existingSubmissions: ChecklistSubmission[];
  onUpdate: (data: { id?: string; templateId: string; responses: any; isFinal: boolean; targetDate: string }) => void;
}

const OpsView: React.FC<OpsViewProps> = ({ user, allUsers, templates, existingSubmissions, onUpdate }) => {
  const [activeTemplate, setActiveTemplate] = useState<ChecklistTemplate | null>(() => {
    const saved = localStorage.getItem('boundaries_active_template_id');
    return saved ? templates.find(t => t.id === saved) || null : null;
  });
  const [activeSubmissionId, setActiveSubmissionId] = useState<string | null>(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [responses, setResponses] = useState<Record<string, { completed: boolean, photo?: string, value?: string, comment?: string, completedByUserId: string, completedAt: string }>>({});
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [capturingTaskId, setCapturingTaskId] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  const interactionLock = useRef<Record<string, number>>({});

  const getTargetDate = useCallback((template: ChecklistTemplate) => {
    const now = new Date();
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayNameInTemplate = daysOfWeek.find(d => template.name.includes(d));
    
    if (template.type === 'WEEKLY' && dayNameInTemplate) {
      const targetDayIndex = daysOfWeek.indexOf(dayNameInTemplate);
      const currentDayIndex = now.getDay();
      let diff = currentDayIndex - targetDayIndex;
      if (diff < 0) diff += 7; 
      const targetDateObj = new Date(now);
      targetDateObj.setDate(now.getDate() - diff);
      return targetDateObj.toISOString().split('T')[0];
    }
    return now.toISOString().split('T')[0];
  }, []);

  const markInteraction = useCallback((taskId: string) => {
    interactionLock.current[taskId] = Date.now();
  }, []);

  // Persist template selection to survive camera reloads
  useEffect(() => {
    if (activeTemplate) {
      localStorage.setItem('boundaries_active_template_id', activeTemplate.id);
    } else {
      localStorage.removeItem('boundaries_active_template_id');
    }
  }, [activeTemplate]);

  // Sync with shared cloud data heartbeat
  useEffect(() => {
    if (activeTemplate) {
      const targetDate = getTargetDate(activeTemplate);
      const submission = existingSubmissions.find(s => 
        s.templateId === activeTemplate.id && 
        s.date === targetDate
      );

      if (submission) {
        setActiveSubmissionId(submission.id);
        setIsReadOnly(submission.status !== 'DRAFT');
        
        setResponses(prev => {
          const next = { ...prev };
          let changed = false;
          submission.taskResults.forEach(res => {
            const lastInteraction = interactionLock.current[res.taskId] || 0;
            // Shield: Only update from cloud if we haven't touched this task in 8 seconds (longer shield for camera)
            if (Date.now() - lastInteraction > 8000) {
              if (
                !next[res.taskId] || 
                next[res.taskId].completed !== res.completed ||
                next[res.taskId].value !== res.value ||
                next[res.taskId].comment !== res.comment ||
                next[res.taskId].photo !== res.photoUrl
              ) {
                next[res.taskId] = {
                  completed: res.completed,
                  photo: res.photoUrl,
                  value: res.value,
                  comment: res.comment,
                  completedByUserId: res.completedByUserId,
                  completedAt: res.completedAt
                };
                changed = true;
              }
            }
          });
          return changed ? next : prev;
        });
      }
    }
  }, [existingSubmissions, activeTemplate, getTargetDate]);

  const handleToggle = (taskId: string) => {
    if (isReadOnly) return;
    markInteraction(taskId);
    const task = activeTemplate?.tasks.find(t => t.id === taskId);
    
    setResponses(prev => {
      const currentResp = prev[taskId];
      const isCompleted = !currentResp?.completed;

      if (task?.requiresPhoto && isCompleted && !currentResp?.photo) {
        setValidationError(`Verification Required: "${task.title}"`);
        openCamera(taskId);
        return prev;
      }

      setValidationError(null);
      
      const nextTask = { 
        ...prev[taskId], 
        completed: isCompleted,
        completedByUserId: isCompleted ? user.id : (prev[taskId]?.completedByUserId || ''),
        completedAt: isCompleted ? new Date().toISOString() : (prev[taskId]?.completedAt || '')
      };

      // Allow resubmitting photos: Clear photo when unchecking so it can be retaken
      if (!isCompleted && nextTask.photo) {
        delete nextTask.photo;
      }

      const updated = {
        ...prev,
        [taskId]: nextTask
      };
      
      onUpdate({
        id: activeSubmissionId || undefined,
        templateId: activeTemplate!.id,
        responses: updated,
        isFinal: false,
        targetDate: getTargetDate(activeTemplate!)
      });
      return updated;
    });
  };

  const handleValueChange = (taskId: string, val: string) => {
    if (isReadOnly) return;
    markInteraction(taskId);
    setResponses(prev => {
      const updated = { 
        ...prev, 
        [taskId]: { 
          ...prev[taskId], 
          value: val,
          completedByUserId: prev[taskId]?.completed ? prev[taskId].completedByUserId : user.id,
          completedAt: prev[taskId]?.completed ? prev[taskId].completedAt : new Date().toISOString()
        }
      };
      onUpdate({
        id: activeSubmissionId || undefined,
        templateId: activeTemplate!.id,
        responses: updated,
        isFinal: false,
        targetDate: getTargetDate(activeTemplate!)
      });
      return updated;
    });
  };

  const handleCommentChange = (taskId: string, comment: string) => {
    if (isReadOnly) return;
    markInteraction(taskId);
    setResponses(prev => {
      const updated = { ...prev, [taskId]: { ...prev[taskId], comment } };
      onUpdate({
        id: activeSubmissionId || undefined,
        templateId: activeTemplate!.id,
        responses: updated,
        isFinal: false,
        targetDate: getTargetDate(activeTemplate!)
      });
      return updated;
    });
  };

  const openCamera = (taskId: string) => {
    if (isReadOnly) return;
    markInteraction(taskId); // Lock the task during camera session
    setCapturingTaskId(taskId);
    setIsCameraOpen(true);
  };

  const handlePhotoCapture = (dataUrl: string) => {
    if (capturingTaskId && !isReadOnly) {
      markInteraction(capturingTaskId);
      setResponses(prev => {
        const updated = {
          ...prev,
          [capturingTaskId]: { 
            ...prev[capturingTaskId], 
            photo: dataUrl, 
            completed: true,
            completedByUserId: user.id,
            completedAt: new Date().toISOString()
          }
        };
        onUpdate({
          id: activeSubmissionId || undefined,
          templateId: activeTemplate!.id,
          responses: updated,
          isFinal: false,
          targetDate: getTargetDate(activeTemplate!)
        });
        setValidationError(null);
        return updated;
      });
    }
    setCapturingTaskId(null);
  };

  const handleAction = (isFinal: boolean) => {
    if (isReadOnly) return;
    if (isFinal) {
      const missingPhotos = activeTemplate?.tasks.filter(t => t.requiresPhoto && !responses[t.id]?.photo);
      if (missingPhotos && missingPhotos.length > 0) {
        alert(`Verification missing! ${missingPhotos.length} standards require photo proof.`);
        return;
      }
      const isAllDone = activeTemplate?.tasks.every(t => responses[t.id]?.completed);
      if (!isAllDone && !confirm('Incomplete standards detected. Authorize final submission?')) return;
    }
    
    onUpdate({
      id: activeSubmissionId || undefined,
      templateId: activeTemplate!.id,
      responses,
      isFinal,
      targetDate: getTargetDate(activeTemplate!)
    });

    if (isFinal) {
      setActiveTemplate(null);
    }
  };

  if (activeTemplate) {
    const targetDate = getTargetDate(activeTemplate);
    const todayStr = new Date().toISOString().split('T')[0];
    const isToday = targetDate === todayStr;
    const isLate = (isToday && new Date().getHours() >= activeTemplate.deadlineHour) || (!isToday && targetDate < todayStr);

    return (
      <div className="space-y-6 sm:space-y-8 animate-in slide-in-from-bottom-6 duration-500">
        <CameraModal 
          isOpen={isCameraOpen}
          onClose={() => setIsCameraOpen(false)}
          onCapture={handlePhotoCapture}
        />

        <header className="flex flex-col md:flex-row md:items-center justify-between bg-white p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] shadow-xl border border-neutral-100 gap-4">
          <div className="flex-1">
            <h2 className="text-xl sm:text-3xl font-black text-[#001F3F] tracking-tighter uppercase leading-tight">{activeTemplate.name}</h2>
            <div className="flex flex-wrap items-center gap-3 mt-2">
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full border transition-all ${
                isReadOnly ? 'bg-green-50 text-green-600 border-green-100' : 'bg-blue-50 text-blue-600 border-blue-100'
              }`}>
                {isReadOnly ? <Lock size={12} /> : <Users size={12} />}
                <span className="text-[9px] font-black uppercase tracking-widest">
                  {isReadOnly ? `Archived: ${targetDate}` : `Collaborative Log: ${targetDate}`}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isReadOnly && (
              <div className="flex items-center gap-1 bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border border-blue-100 animate-pulse">
                <CloudCheck size={12} /> Sync Active
              </div>
            )}
            <button onClick={() => setActiveTemplate(null)} className="p-2 sm:p-3 bg-neutral-100 hover:bg-[#001F3F] hover:text-white rounded-xl transition-all">
              <X size={18} strokeWidth={3} />
            </button>
          </div>
        </header>

        <div className="space-y-3 sm:space-y-4">
          {activeTemplate.tasks.map(task => {
            const resp = responses[task.id];
            const isVerified = resp?.completed;
            const verifyingUser = resp?.completedByUserId ? allUsers.find(u => u.id === resp.completedByUserId) : null;
            const isTeammateEntry = verifyingUser && verifyingUser.id !== user.id;
            
            return (
              <div 
                key={task.id} 
                className={`p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] transition-all duration-300 relative overflow-hidden border ${
                  isVerified 
                    ? 'border-green-200 bg-green-50/5' 
                    : task.isCritical && !isReadOnly
                      ? 'border-red-500 bg-red-50/30' 
                      : 'border-neutral-100 bg-white shadow-sm'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start justify-between gap-4 sm:gap-6">
                  <div className="flex-1 w-full">
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      {isVerified && (
                        <span className={`px-2 py-0.5 text-white text-[7px] sm:text-[9px] font-black uppercase tracking-widest rounded flex items-center gap-1.5 animate-in zoom-in ${isTeammateEntry ? 'bg-[#001F3F]' : 'bg-green-600'}`}>
                          {isTeammateEntry ? <Users size={10} /> : <CheckCircle2 size={10} />}
                          {verifyingUser?.name || 'Teammate'}
                        </span>
                      )}
                      <h3 className={`font-bold text-base sm:text-lg tracking-tight leading-snug transition-colors ${
                        isVerified ? 'text-neutral-400 line-through' : 'text-[#001F3F]'
                      }`}>
                        {task.title}
                      </h3>
                    </div>
                    
                    {task.requiresValue && (
                      <div className="mt-4">
                        <label className="block text-[8px] sm:text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1.5 ml-1">{task.requiresValue}</label>
                        <input 
                          type="text" 
                          placeholder={isReadOnly ? "No value logged" : "Log value..."}
                          value={resp?.value || ''}
                          disabled={isReadOnly}
                          onChange={(e) => handleValueChange(task.id, e.target.value)}
                          className="w-full border rounded-xl px-4 py-3 focus:ring-2 outline-none font-bold text-sm bg-neutral-50 border-neutral-100 focus:bg-white"
                        />
                      </div>
                    )}

                    <div className="mt-6 pt-4 border-t border-neutral-50">
                      <textarea
                        rows={1}
                        placeholder={isReadOnly ? "No observations" : "Add observation..."}
                        value={resp?.comment || ''}
                        disabled={isReadOnly}
                        onChange={(e) => handleCommentChange(task.id, e.target.value)}
                        className="w-full border rounded-xl px-4 py-3 text-xs font-medium outline-none resize-none bg-neutral-50 border-neutral-100 focus:bg-white"
                      />
                    </div>
                  </div>

                  {!isReadOnly && (
                    <button 
                      onClick={() => handleToggle(task.id)}
                      className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl flex items-center justify-center transition-all duration-300 shadow-lg active:scale-90 shrink-0 ${
                        isVerified 
                          ? isTeammateEntry ? 'bg-[#001F3F] text-white' : 'bg-green-600 text-white' 
                          : 'bg-neutral-50 text-neutral-200 border border-neutral-100'
                      }`}
                    >
                      <Check strokeWidth={4} size={28} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {!isReadOnly && (
          <div className="pb-24">
            <button 
              onClick={() => handleAction(true)}
              className="w-full py-6 text-white bg-[#001F3F] rounded-[2rem] font-black flex items-center justify-center gap-3 transition-all shadow-xl uppercase tracking-widest text-xs"
            >
              <Send size={18} strokeWidth={3} /> Finalize Protocol for {targetDate}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8 sm:space-y-12 animate-in fade-in duration-700">
      <header className="max-w-2xl">
        <h1 className="text-4xl sm:text-6xl font-[900] text-[#001F3F] tracking-tighter mb-2 leading-none uppercase">Logbook</h1>
        <p className="text-neutral-500 font-medium text-base sm:text-lg">Collaborative shift standards.</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {templates.map(tpl => {
          const targetDate = getTargetDate(tpl);
          const draft = existingSubmissions.find(s => 
            s.templateId === tpl.id && 
            s.date === targetDate && 
            s.status === 'DRAFT'
          );
          const finalizedSubmission = existingSubmissions.find(s => 
            s.templateId === tpl.id && 
            s.date === targetDate && 
            s.status !== 'DRAFT'
          );
          
          const isFinalized = !!finalizedSubmission;
          
          return (
            <button
              key={tpl.id}
              onClick={() => setActiveTemplate(tpl)}
              className={`group relative bg-white p-6 sm:p-8 rounded-[2rem] sm:rounded-[3rem] border transition-all duration-300 text-left overflow-hidden ${
                isFinalized 
                  ? 'border-green-200 bg-green-50/20' 
                  : 'border-neutral-100 hover:border-[#001F3F] shadow-sm hover:shadow-xl active:scale-[0.98]'
              }`}
            >
              <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-2">
                {isFinalized ? (
                  <span className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white text-[8px] font-black uppercase tracking-widest rounded-lg shadow-sm">
                    <Lock size={10} /> LOGGED
                  </span>
                ) : draft ? (
                  <div className="flex flex-col items-end gap-1">
                    <span className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-[#001F3F] text-[8px] font-black uppercase tracking-widest rounded-lg animate-pulse">
                      <Users size={10} /> ACTIVE TEAM
                    </span>
                  </div>
                ) : null}
              </div>
              
              <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-[1.5rem] flex items-center justify-center mb-6 transition-all ${
                isFinalized ? 'bg-green-100 text-green-600' : 'bg-[#001F3F] text-white'
              }`}>
                {isFinalized ? <Check strokeWidth={4} size={28} /> : <ClipboardList size={28} />}
              </div>
              
              <h3 className={`text-lg sm:text-2xl font-black tracking-tight mb-1 uppercase leading-none ${isFinalized ? 'text-green-800' : 'text-black'}`}>{tpl.name}</h3>
              <p className={`text-[10px] sm:text-sm font-bold leading-snug ${isFinalized ? 'text-green-600' : 'text-neutral-400'}`}>
                {targetDate}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default OpsView;
