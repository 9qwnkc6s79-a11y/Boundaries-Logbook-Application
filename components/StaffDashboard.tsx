import React, { useMemo } from 'react';
import { User, ChecklistSubmission, ChecklistTemplate, UserProgress, TrainingModule, ToastTimeEntry, ToastSalesData } from '../types';
import {
  Trophy, TrendingUp, Target, Award, Zap, Users, Clock, CheckCircle,
  Star, Flame, Medal, Crown, Activity, BarChart3, Timer, Coffee,
  GraduationCap, ClipboardCheck, AlertCircle, ChevronRight
} from 'lucide-react';
import { detectLeaders } from '../utils/leadershipTracking';

interface StaffDashboardProps {
  currentUser: User;
  allUsers: User[];
  submissions: ChecklistSubmission[];
  templates: ChecklistTemplate[];
  progress: UserProgress[];
  curriculum: TrainingModule[];
  toastSales?: ToastSalesData | null;
  toastClockedIn: ToastTimeEntry[];
}

const StaffDashboard: React.FC<StaffDashboardProps> = ({
  currentUser,
  allUsers,
  submissions,
  templates,
  progress,
  curriculum,
  toastSales,
  toastClockedIn
}) => {
  // Calculate personal stats
  const personalStats = useMemo(() => {
    // Get submissions where user completed tasks
    const userSubmissions = submissions.filter(sub =>
      sub.taskResults?.some(tr => tr.completedByUserId === currentUser.id)
    );

    // Calculate timeliness
    let onTimeCount = 0;
    let lateCount = 0;

    userSubmissions.forEach(sub => {
      const template = templates.find(t => t.id === sub.templateId);
      if (!template || !sub.submittedAt) return;

      const deadline = new Date(sub.date);
      deadline.setHours(template.deadlineHour, 0, 0, 0);
      const submittedDate = new Date(sub.submittedAt);

      if (submittedDate <= deadline) {
        onTimeCount++;
      } else {
        lateCount++;
      }
    });

    const totalSubmissions = onTimeCount + lateCount;
    const onTimeRate = totalSubmissions > 0 ? (onTimeCount / totalSubmissions) * 100 : 0;

    // Training progress
    const completedLessons = progress.filter(p => p.status === 'COMPLETED').length;
    const totalLessons = curriculum.reduce((sum, mod) => sum + mod.lessons.length, 0);
    const trainingProgress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

    // Calculate streak (consecutive on-time submissions)
    let currentStreak = 0;
    const sortedSubs = [...userSubmissions]
      .filter(s => s.submittedAt)
      .sort((a, b) => new Date(b.submittedAt!).getTime() - new Date(a.submittedAt!).getTime());

    for (const sub of sortedSubs) {
      const template = templates.find(t => t.id === sub.templateId);
      if (!template || !sub.submittedAt) break;

      const deadline = new Date(sub.date);
      deadline.setHours(template.deadlineHour, 0, 0, 0);
      const submittedDate = new Date(sub.submittedAt);

      if (submittedDate <= deadline) {
        currentStreak++;
      } else {
        break;
      }
    }

    return {
      totalSubmissions,
      onTimeCount,
      lateCount,
      onTimeRate,
      completedLessons,
      totalLessons,
      trainingProgress,
      currentStreak
    };
  }, [currentUser, submissions, templates, progress, curriculum]);

  // Calculate team leaderboard
  const leaderboard = useMemo(() => {
    const stats = new Map<string, any>();

    submissions.forEach(sub => {
      const template = templates.find(t => t.id === sub.templateId);
      if (!template || !sub.submittedAt) return;

      const deadline = new Date(sub.date);
      deadline.setHours(template.deadlineHour, 0, 0, 0);
      const submittedDate = new Date(sub.submittedAt);
      const onTime = submittedDate <= deadline;

      // Get all users who contributed to this submission
      const contributors = new Set(sub.taskResults?.map(tr => tr.completedByUserId) || []);

      contributors.forEach(userId => {
        const user = allUsers.find(u => u.id === userId);
        if (!user) return;

        const existing = stats.get(userId);
        if (existing) {
          existing.total++;
          if (onTime) existing.onTime++;
        } else {
          stats.set(userId, {
            userId,
            name: user.name,
            total: 1,
            onTime: onTime ? 1 : 0
          });
        }
      });
    });

    return Array.from(stats.values())
      .map(stat => ({
        ...stat,
        onTimeRate: stat.total > 0 ? (stat.onTime / stat.total) * 100 : 0
      }))
      .sort((a, b) => {
        // Sort by on-time rate, then by total submissions
        if (b.onTimeRate !== a.onTimeRate) return b.onTimeRate - a.onTimeRate;
        return b.total - a.total;
      })
      .slice(0, 10); // Top 10
  }, [submissions, templates, allUsers]);

  const userRank = leaderboard.findIndex(l => l.userId === currentUser.id) + 1;

  // Detect current shift leader
  const currentLeaders = detectLeaders(toastClockedIn, allUsers);
  const highestPriority = currentLeaders.length > 0 ? Math.min(...currentLeaders.map(l => l.priority)) : 999;
  const activeLeaders = currentLeaders.filter(l => l.priority === highestPriority);

  // Achievements/Badges
  const badges = useMemo(() => {
    const earned = [];

    if (personalStats.currentStreak >= 5) {
      earned.push({ icon: Flame, label: 'On Fire', desc: `${personalStats.currentStreak} streak`, color: 'text-orange-500' });
    }
    if (personalStats.onTimeRate >= 95) {
      earned.push({ icon: Target, label: 'Precision', desc: '95%+ on-time', color: 'text-blue-500' });
    }
    if (personalStats.trainingProgress === 100) {
      earned.push({ icon: GraduationCap, label: 'Graduate', desc: 'All lessons complete', color: 'text-purple-500' });
    }
    if (userRank === 1) {
      earned.push({ icon: Crown, label: 'Top Performer', desc: '#1 on leaderboard', color: 'text-yellow-500' });
    }
    if (personalStats.totalSubmissions >= 50) {
      earned.push({ icon: Award, label: 'Veteran', desc: '50+ submissions', color: 'text-green-500' });
    }

    return earned;
  }, [personalStats, userRank]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Hero Section - Personal Performance */}
      <section className="bg-gradient-to-br from-purple-600 to-blue-600 p-8 rounded-[2.5rem] shadow-xl text-white">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight mb-2">
              Welcome, {currentUser.name.split(' ')[0]}
            </h1>
            <p className="text-sm text-white/80 font-bold uppercase tracking-widest">Your Performance Dashboard</p>
          </div>
          {userRank > 0 && (
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-6 py-4 text-center border border-white/30">
              <div className="text-4xl font-black">#{userRank}</div>
              <div className="text-[9px] font-bold uppercase tracking-widest text-white/80 mt-1">Team Rank</div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/20">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle size={16} className="text-green-300" />
              <h3 className="text-[9px] font-black uppercase tracking-widest text-white/80">On-Time Rate</h3>
            </div>
            <div className="text-3xl font-black">{personalStats.onTimeRate.toFixed(0)}%</div>
            <div className="text-[9px] text-white/60 font-medium mt-1">
              {personalStats.onTimeCount} of {personalStats.totalSubmissions}
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/20">
            <div className="flex items-center gap-2 mb-2">
              <Flame size={16} className="text-orange-300" />
              <h3 className="text-[9px] font-black uppercase tracking-widest text-white/80">Current Streak</h3>
            </div>
            <div className="text-3xl font-black">{personalStats.currentStreak}</div>
            <div className="text-[9px] text-white/60 font-medium mt-1">consecutive on-time</div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/20">
            <div className="flex items-center gap-2 mb-2">
              <GraduationCap size={16} className="text-blue-300" />
              <h3 className="text-[9px] font-black uppercase tracking-widest text-white/80">Training</h3>
            </div>
            <div className="text-3xl font-black">{personalStats.trainingProgress.toFixed(0)}%</div>
            <div className="text-[9px] text-white/60 font-medium mt-1">
              {personalStats.completedLessons}/{personalStats.totalLessons} lessons
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/20">
            <div className="flex items-center gap-2 mb-2">
              <ClipboardCheck size={16} className="text-purple-300" />
              <h3 className="text-[9px] font-black uppercase tracking-widest text-white/80">Total Logs</h3>
            </div>
            <div className="text-3xl font-black">{personalStats.totalSubmissions}</div>
            <div className="text-[9px] text-white/60 font-medium mt-1">all time</div>
          </div>
        </div>
      </section>

      {/* Badges/Achievements */}
      {badges.length > 0 && (
        <section className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Award size={16} className="text-amber-500" />
            <h2 className="text-sm font-black text-[#001F3F] uppercase tracking-tight">Achievements</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {badges.map((badge, idx) => (
              <div key={idx} className="bg-gradient-to-br from-neutral-50 to-neutral-100 p-4 rounded-xl text-center border border-neutral-200">
                <badge.icon size={32} className={`${badge.color} mx-auto mb-2`} />
                <div className="text-xs font-black text-[#001F3F] uppercase tracking-tight">{badge.label}</div>
                <div className="text-[9px] text-neutral-500 font-medium mt-1">{badge.desc}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Leaderboard */}
        <section className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Trophy size={16} className="text-amber-500" />
              <h2 className="text-sm font-black text-[#001F3F] uppercase tracking-tight">Team Leaderboard</h2>
            </div>
            <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Top 10</span>
          </div>

          <div className="space-y-2">
            {leaderboard.map((person, idx) => {
              const isCurrentUser = person.userId === currentUser.id;
              return (
                <div
                  key={person.userId}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                    isCurrentUser
                      ? 'bg-blue-50 border-2 border-blue-200'
                      : idx < 3
                      ? 'bg-neutral-50 border border-neutral-100'
                      : 'border border-neutral-100'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm ${
                      idx === 0
                        ? 'bg-amber-400 text-white'
                        : idx === 1
                        ? 'bg-neutral-300 text-white'
                        : idx === 2
                        ? 'bg-orange-400 text-white'
                        : 'bg-neutral-100 text-neutral-400'
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs font-black uppercase tracking-tight truncate ${
                      isCurrentUser ? 'text-blue-900' : 'text-[#001F3F]'
                    }`}>
                      {person.name} {isCurrentUser && '(You)'}
                    </div>
                    <div className="text-[9px] text-neutral-500 font-medium">
                      {person.total} submissions
                    </div>
                  </div>
                  <div className={`text-right ${
                    person.onTimeRate >= 90 ? 'text-green-600' :
                    person.onTimeRate >= 70 ? 'text-blue-600' : 'text-amber-600'
                  }`}>
                    <div className="text-lg font-black">{person.onTimeRate.toFixed(0)}%</div>
                    <div className="text-[8px] font-bold uppercase tracking-wide">on-time</div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Current Shift Info */}
        <section className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Activity size={16} className="text-blue-500" />
            <h2 className="text-sm font-black text-[#001F3F] uppercase tracking-tight">Current Shift</h2>
          </div>

          <div className="space-y-4">
            {/* Shift Leader */}
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
              <div className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-2">Shift Leader</div>
              {activeLeaders.length === 0 ? (
                <div className="flex items-center gap-2 text-amber-600">
                  <AlertCircle size={16} />
                  <span className="text-xs font-bold">No leader on duty</span>
                </div>
              ) : activeLeaders.length > 1 ? (
                <div>
                  <div className="text-sm font-black text-[#001F3F] mb-1">Multiple Leaders</div>
                  <div className="text-[9px] text-neutral-600 font-medium">
                    {activeLeaders.map(l => l.name).join(', ')}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="text-sm font-black text-[#001F3F]">{activeLeaders[0].name}</div>
                  <div className="text-[9px] text-neutral-500 font-medium uppercase tracking-wide mt-0.5">
                    {activeLeaders[0].jobTitle}
                  </div>
                </div>
              )}
            </div>

            {/* Store Performance */}
            {toastSales && (
              <>
                <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-100">
                  <div className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-2">Turn Time</div>
                  <div className={`text-2xl font-black ${
                    (toastSales.averageTurnTime || 0) < 3.5 ? 'text-green-600' :
                    (toastSales.averageTurnTime || 0) < 5 ? 'text-blue-600' :
                    (toastSales.averageTurnTime || 0) < 6 ? 'text-amber-600' : 'text-red-600'
                  }`}>
                    {toastSales.averageTurnTime?.toFixed(1) || '—'} min
                  </div>
                  <div className="text-[9px] text-neutral-500 font-medium mt-1">
                    {(toastSales.averageTurnTime || 0) < 3.5 ? 'Excellent!' :
                     (toastSales.averageTurnTime || 0) < 5 ? 'Good' :
                     (toastSales.averageTurnTime || 0) < 6 ? 'Fair' : 'Needs improvement'}
                  </div>
                </div>

                <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-100">
                  <div className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-2">Today's Sales</div>
                  <div className="text-2xl font-black text-green-600">
                    ${toastSales.totalSales?.toFixed(0) || '—'}
                  </div>
                  <div className="text-[9px] text-neutral-500 font-medium mt-1">
                    {toastSales.totalOrders || 0} orders
                  </div>
                </div>
              </>
            )}

            {/* Staff Count */}
            <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-100">
              <div className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-2">On Duty</div>
              <div className="text-2xl font-black text-[#001F3F]">{toastClockedIn.length}</div>
              <div className="text-[9px] text-neutral-500 font-medium mt-1 truncate">
                {toastClockedIn.slice(0, 3).map(e => e.employeeName.split(' ')[0]).join(', ')}
                {toastClockedIn.length > 3 && '...'}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Goals Section */}
      <section className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-100">
        <div className="flex items-center gap-2 mb-4">
          <Target size={16} className="text-green-600" />
          <h2 className="text-sm font-black text-[#001F3F] uppercase tracking-tight">Your Goals</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border border-green-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[9px] font-black text-green-600 uppercase tracking-widest">On-Time Goal</span>
              <CheckCircle size={14} className={personalStats.onTimeRate >= 90 ? 'text-green-500' : 'text-neutral-300'} />
            </div>
            <div className="text-2xl font-black text-[#001F3F] mb-2">{personalStats.onTimeRate.toFixed(0)}%</div>
            <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
                style={{ width: `${Math.min(personalStats.onTimeRate, 100)}%` }}
              />
            </div>
            <div className="text-[9px] text-neutral-500 font-medium mt-2">Target: 90%</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-green-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[9px] font-black text-green-600 uppercase tracking-widest">Training Goal</span>
              <GraduationCap size={14} className={personalStats.trainingProgress >= 100 ? 'text-green-500' : 'text-neutral-300'} />
            </div>
            <div className="text-2xl font-black text-[#001F3F] mb-2">{personalStats.trainingProgress.toFixed(0)}%</div>
            <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                style={{ width: `${Math.min(personalStats.trainingProgress, 100)}%` }}
              />
            </div>
            <div className="text-[9px] text-neutral-500 font-medium mt-2">
              {personalStats.totalLessons - personalStats.completedLessons} lessons remaining
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-green-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[9px] font-black text-green-600 uppercase tracking-widest">Streak Goal</span>
              <Flame size={14} className={personalStats.currentStreak >= 10 ? 'text-orange-500' : 'text-neutral-300'} />
            </div>
            <div className="text-2xl font-black text-[#001F3F] mb-2">{personalStats.currentStreak}</div>
            <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-500"
                style={{ width: `${Math.min((personalStats.currentStreak / 10) * 100, 100)}%` }}
              />
            </div>
            <div className="text-[9px] text-neutral-500 font-medium mt-2">Target: 10 in a row</div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default StaffDashboard;
