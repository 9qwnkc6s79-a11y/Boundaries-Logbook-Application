import React, { useState } from 'react';
import { FileDown, Loader2 } from 'lucide-react';
import { ChecklistSubmission, ChecklistTemplate, User } from '../types';

interface WeeklyReportProps {
  currentStoreId: string;
  storeName: string;
  submissions: ChecklistSubmission[];
  templates: ChecklistTemplate[];
  allUsers: User[];
}

/** Previous full week, Monday through Sunday, as local YYYY-MM-DD strings. */
function getPreviousWeekRange(): { start: Date; end: Date; days: string[] } {
  const now = new Date();
  // Day of week with Monday = 0
  const dowMon = (now.getDay() + 6) % 7;
  const thisMonday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dowMon);
  const start = new Date(thisMonday);
  start.setDate(start.getDate() - 7);
  const end = new Date(thisMonday);
  end.setDate(end.getDate() - 1);

  const days: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(toLocalDateStr(d));
  }
  return { start, end, days };
}

function toLocalDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function csvField(v: string | number | undefined | null): string {
  const s = v === undefined || v === null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function row(...fields: (string | number | undefined | null)[]): string {
  return fields.map(csvField).join(',');
}

interface DaySales {
  date: string;
  totalSales?: number;
  totalOrders?: number;
  averageCheck?: number;
  averageTurnTime?: number;
  error?: boolean;
}

async function fetchDaySales(location: string, date: string): Promise<DaySales> {
  try {
    const res = await fetch(`/api/toast-sales?location=${location}&startDate=${date}&endDate=${date}`);
    if (!res.ok) throw new Error(`${res.status}`);
    const data = await res.json();
    return {
      date,
      totalSales: data.totalSales,
      totalOrders: data.totalOrders,
      averageCheck: data.averageCheck,
      averageTurnTime: data.averageTurnTime,
    };
  } catch (e) {
    console.warn(`[WeeklyReport] Sales fetch failed for ${date}:`, e);
    return { date, error: true };
  }
}

const WeeklyReport: React.FC<WeeklyReportProps> = ({ currentStoreId, storeName, submissions, templates, allUsers }) => {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateReport = async () => {
    setGenerating(true);
    setError(null);
    try {
      const location = currentStoreId === 'store-prosper' ? 'prosper' : 'littleelm';
      const { days } = getPreviousWeekRange();

      // Fetch sales per day (in parallel) — each day independent so one
      // failed day doesn't sink the report.
      const dailySales = await Promise.all(days.map(d => fetchDaySales(location, d)));

      const lines: string[] = [];
      lines.push(row('Boundaries Coffee — Weekly Report'));
      lines.push(row('Store', storeName));
      lines.push(row('Period', `${days[0]} to ${days[6]}`));
      lines.push(row('Generated', new Date().toLocaleString()));
      lines.push('');

      // ── Weekly Sales Summary ──
      const okDays = dailySales.filter(d => !d.error);
      const weekSales = okDays.reduce((s, d) => s + (d.totalSales || 0), 0);
      const weekOrders = okDays.reduce((s, d) => s + (d.totalOrders || 0), 0);
      const daysWithTurn = okDays.filter(d => d.averageTurnTime && d.averageTurnTime > 0);
      const weekAvgTurn = daysWithTurn.length > 0
        ? daysWithTurn.reduce((s, d) => s + (d.averageTurnTime || 0), 0) / daysWithTurn.length
        : undefined;
      const weekAvgCheck = weekOrders > 0 ? weekSales / weekOrders : undefined;

      lines.push(row('WEEKLY SALES SUMMARY'));
      lines.push(row('Total Net Sales', weekSales ? `$${weekSales.toFixed(2)}` : 'N/A'));
      lines.push(row('Total Orders', weekOrders || 'N/A'));
      lines.push(row('Average Check', weekAvgCheck !== undefined ? `$${weekAvgCheck.toFixed(2)}` : 'N/A'));
      lines.push(row('Average Turn Time', weekAvgTurn !== undefined ? `${weekAvgTurn.toFixed(2)} min` : 'N/A'));
      if (okDays.length < 7) {
        lines.push(row('Note', `Sales data unavailable for ${7 - okDays.length} day(s)`));
      }
      lines.push('');

      // ── Daily Breakdown ──
      lines.push(row('DAILY BREAKDOWN'));
      lines.push(row('Date', 'Net Sales', 'Orders', 'Avg Check', 'Avg Turn Time (min)'));
      dailySales.forEach(d => {
        if (d.error) {
          lines.push(row(d.date, 'N/A', 'N/A', 'N/A', 'N/A'));
        } else {
          lines.push(row(
            d.date,
            d.totalSales !== undefined ? `$${d.totalSales.toFixed(2)}` : 'N/A',
            d.totalOrders ?? 'N/A',
            d.averageCheck !== undefined ? `$${d.averageCheck.toFixed(2)}` : 'N/A',
            d.averageTurnTime !== undefined ? d.averageTurnTime.toFixed(2) : 'N/A'
          ));
        }
      });
      lines.push('');

      // ── Checklist Completion ──
      const dailyTemplates = templates.filter(t =>
        t.type === 'OPENING' || t.type === 'SHIFT_CHANGE' || t.type === 'CLOSING'
      );

      lines.push(row('CHECKLIST COMPLETION'));
      lines.push(row('Date', 'Checklist', 'Type', 'Status', 'Submitted At', 'On Time', 'Tasks Completed', 'Submitted By'));

      const perTemplateStats = new Map<string, { total: number; done: number; onTime: number }>();

      days.forEach(day => {
        dailyTemplates.forEach(tpl => {
          const stats = perTemplateStats.get(tpl.id) || { total: 0, done: 0, onTime: 0 };
          stats.total++;

          const sub = submissions.find(s => s.templateId === tpl.id && s.date === day && s.status !== 'DRAFT');
          if (!sub || !sub.submittedAt) {
            perTemplateStats.set(tpl.id, stats);
            lines.push(row(day, tpl.name, tpl.type, 'MISSING', '', '', `0/${tpl.tasks?.length || 0}`, ''));
            return;
          }

          stats.done++;
          const [y, m, dd] = day.split('-').map(Number);
          const deadline = new Date(y, m - 1, dd, tpl.deadlineHour, 0, 0, 0);
          const submittedAt = new Date(sub.submittedAt);
          const onTime = submittedAt.getTime() <= deadline.getTime();
          if (onTime) stats.onTime++;
          perTemplateStats.set(tpl.id, stats);

          const completed = (sub.taskResults || []).filter(tr => tr.completed).length;
          const submitter = allUsers.find(u => u.id === sub.userId)?.name || '';

          lines.push(row(
            day,
            tpl.name,
            tpl.type,
            sub.status,
            submittedAt.toLocaleString(),
            onTime ? 'YES' : 'LATE',
            `${completed}/${tpl.tasks?.length || 0}`,
            submitter
          ));
        });
      });
      lines.push('');

      // ── Checklist Summary ──
      lines.push(row('CHECKLIST SUMMARY'));
      lines.push(row('Checklist', 'Completed', 'On Time', 'Completion Rate', 'On-Time Rate'));
      dailyTemplates.forEach(tpl => {
        const s = perTemplateStats.get(tpl.id);
        if (!s) return;
        lines.push(row(
          tpl.name,
          `${s.done}/${s.total}`,
          `${s.onTime}/${s.total}`,
          s.total > 0 ? `${Math.round((s.done / s.total) * 100)}%` : 'N/A',
          s.total > 0 ? `${Math.round((s.onTime / s.total) * 100)}%` : 'N/A'
        ));
      });

      // Download
      const csv = lines.join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `boundaries-weekly-report-${location}-${days[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e: any) {
      console.error('[WeeklyReport] Failed:', e);
      setError('Report generation failed. Check your connection and try again.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <section className="bg-white p-4 md:p-6 rounded-xl border border-neutral-100 shadow-sm">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="p-2 bg-green-50 text-green-600 rounded-xl"><FileDown size={20} /></div>
        <div className="flex-1 min-w-[200px]">
          <h2 className="text-lg font-black text-[#0F2B3C] uppercase tracking-tight">Weekly Report</h2>
          <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
            Sales, turn time &amp; checklist completion — previous week (Mon–Sun)
          </p>
        </div>
        <button
          onClick={generateReport}
          disabled={generating}
          className="px-5 py-3 bg-[#0F2B3C] text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 disabled:opacity-60 active:scale-95 transition-all"
        >
          {generating ? (
            <><Loader2 size={14} className="animate-spin" /> Generating...</>
          ) : (
            <><FileDown size={14} /> Download CSV</>
          )}
        </button>
      </div>
      {error && (
        <p className="mt-3 text-xs font-bold text-red-600">{error}</p>
      )}
    </section>
  );
};

export default WeeklyReport;
