import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Trash2, Download, FileSpreadsheet } from 'lucide-react';
import { format, addDays, subDays, parseISO } from 'date-fns';
import type { AppSettings } from '@/lib/sitecommand-types';
import { ANALYSIS_CODES } from '@/lib/sitecommand-types';
import { calculateHours, formatTime12 } from '@/lib/sitecommand-utils';
import { fetchSettings } from '@/lib/sitecommand-store';
import { v4 as uuid } from 'uuid';

interface TimesheetLine {
  id: string;
  startTime: string;
  lunch: boolean;
  lunchMinutes: number;
  finishTime: string;
  jobNo: string;
  analysisCode: string;
  other: string;
}

interface DayData {
  day: string;
  date: string;
  lines: TimesheetLine[];
}

interface SignOff {
  name: string;
  date: string;
}

const inputCls = 'px-2 py-1.5 rounded-lg bg-slate-700 border border-slate-600 text-white text-xs focus:outline-none focus:border-amber-500';

const makeLine = (lunchDefault: number): TimesheetLine => ({
  id: uuid(),
  startTime: '',
  lunch: false,
  lunchMinutes: lunchDefault,
  finishTime: '',
  jobNo: '',
  analysisCode: '',
  other: '',
});

const TimesheetPage: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [employeeName, setEmployeeName] = useState('');
  const [weekEnding, setWeekEnding] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [messages, setMessages] = useState('');
  const [nightsAway, setNightsAway] = useState('');
  const [staffSignOff, setStaffSignOff] = useState<SignOff>({ name: '', date: '' });
  const [managerSignOff, setManagerSignOff] = useState<SignOff>({ name: '', date: '' });
  const [days, setDays] = useState<DayData[]>([]);

  useEffect(() => {
    fetchSettings().then(s => setSettings(s)).catch(console.error);
  }, []);

  // Build days based on settings
  useEffect(() => {
    if (!settings || !weekEnding) return;
    const numDays = settings.timesheetPeriod === 2 ? 14 : 7;
    const endDate = parseISO(weekEnding);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const newDays: DayData[] = [];

    for (let i = numDays - 1; i >= 0; i--) {
      const d = subDays(endDate, i);
      const dateStr = format(d, 'yyyy-MM-dd');
      const existing = days.find(dd => dd.date === dateStr);
      newDays.push({
        day: dayNames[d.getDay()],
        date: dateStr,
        lines: existing?.lines || [makeLine(settings.lunchDefaultMinutes)],
      });
    }
    setDays(newDays);
  }, [weekEnding, settings?.timesheetPeriod]);

  const updateLine = (dayIdx: number, lineId: string, patch: Partial<TimesheetLine>) => {
    setDays(prev => prev.map((d, i) =>
      i === dayIdx ? { ...d, lines: d.lines.map(l => l.id === lineId ? { ...l, ...patch } : l) } : d
    ));
  };

  const addLine = (dayIdx: number) => {
    if (!settings) return;
    setDays(prev => prev.map((d, i) =>
      i === dayIdx ? { ...d, lines: [...d.lines, makeLine(settings.lunchDefaultMinutes)] } : d
    ));
  };

  const removeLine = (dayIdx: number, lineId: string) => {
    if (!settings) return;
    setDays(prev => prev.map((d, i) => {
      if (i !== dayIdx) return d;
      const next = d.lines.filter(l => l.id !== lineId);
      return { ...d, lines: next.length === 0 ? [makeLine(settings.lunchDefaultMinutes)] : next };
    }));
  };

  const lineHours = (l: TimesheetLine): number => {
    return calculateHours(l.startTime, l.finishTime, l.lunch ? l.lunchMinutes : 0);
  };

  const dayTotal = (d: DayData): number => {
    return d.lines.reduce((sum, l) => sum + (l.startTime && l.finishTime ? lineHours(l) : 0), 0);
  };

  const weekTotal = useMemo(() => days.reduce((sum, d) => sum + dayTotal(d), 0), [days]);

  // Save to localStorage
  useEffect(() => {
    if (days.length > 0) {
      localStorage.setItem('sc_timesheet', JSON.stringify({
        employeeName, weekEnding, messages, nightsAway, staffSignOff, managerSignOff, days,
      }));
    }
  }, [employeeName, weekEnding, messages, nightsAway, staffSignOff, managerSignOff, days]);

  // Load from localStorage
  useEffect(() => {
    const raw = localStorage.getItem('sc_timesheet');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed.employeeName) setEmployeeName(parsed.employeeName);
        if (parsed.weekEnding) setWeekEnding(parsed.weekEnding);
        if (parsed.messages) setMessages(parsed.messages);
        if (parsed.nightsAway) setNightsAway(parsed.nightsAway);
        if (parsed.staffSignOff) setStaffSignOff(parsed.staffSignOff);
        if (parsed.managerSignOff) setManagerSignOff(parsed.managerSignOff);
        if (parsed.days) setDays(parsed.days);
      } catch {}
    }
  }, []);

  if (!settings) {
    return <div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-400" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Timesheet</h1>
          <p className="text-slate-400 text-sm mt-1">{settings.timesheetPeriod === 2 ? 'Fortnightly' : 'Weekly'} timesheet</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium hover:bg-emerald-500/20 transition-colors">
            <FileSpreadsheet className="w-4 h-4" />
            Export Excel
          </button>
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium hover:bg-blue-500/20 transition-colors">
            <Download className="w-4 h-4" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Header fields */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Employee Name</label>
            <input value={employeeName} onChange={e => setEmployeeName(e.target.value)} className={`w-full ${inputCls}`} placeholder="Your name" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Week Ending</label>
            <input type="date" value={weekEnding} onChange={e => setWeekEnding(e.target.value)} className={`w-full ${inputCls}`} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Period</label>
            <div className="text-sm text-white mt-1">{settings.timesheetPeriod === 2 ? '2 Weeks' : '1 Week'}</div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Week Total</label>
            <div className="text-2xl font-bold text-amber-400">{weekTotal.toFixed(2)} hrs</div>
          </div>
        </div>
      </div>

      {/* Timesheet Table */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="py-3 px-3 text-xs font-semibold text-slate-400 w-36">Day / Date</th>
                <th className="py-3 px-3 text-xs font-semibold text-slate-400">Start</th>
                <th className="py-3 px-3 text-xs font-semibold text-slate-400">Lunch</th>
                <th className="py-3 px-3 text-xs font-semibold text-slate-400">Finish</th>
                <th className="py-3 px-3 text-xs font-semibold text-slate-400 text-right">Hours</th>
                <th className="py-3 px-3 text-xs font-semibold text-slate-400">Job No.</th>
                <th className="py-3 px-3 text-xs font-semibold text-slate-400">Analysis Code</th>
                <th className="py-3 px-3 text-xs font-semibold text-slate-400">Other</th>
                <th className="py-3 px-3 text-xs font-semibold text-slate-400 w-16"></th>
              </tr>
            </thead>
            <tbody>
              {days.map((d, dayIdx) => (
                <React.Fragment key={d.date}>
                  {d.lines.map((line, lineIdx) => {
                    const hrs = line.startTime && line.finishTime ? lineHours(line) : 0;
                    return (
                      <tr key={line.id} className="border-b border-slate-700/20 hover:bg-slate-700/20">
                        <td className="py-2 px-3">
                          {lineIdx === 0 && (
                            <div>
                              <div className="text-xs font-bold text-white">{d.day}</div>
                              <div className="text-[10px] text-slate-400">{format(parseISO(d.date), 'dd/MM')}</div>
                              <div className="text-[10px] text-amber-400/70 mt-0.5">
                                Day: {dayTotal(d).toFixed(2)}h
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="time"
                            value={line.startTime}
                            onChange={e => updateLine(dayIdx, line.id, { startTime: e.target.value })}
                            onFocus={() => { if (!line.startTime) updateLine(dayIdx, line.id, { startTime: '07:00' }); }}
                            className={`w-24 ${inputCls}`}
                          />
                        </td>
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={line.lunch}
                              onChange={e => updateLine(dayIdx, line.id, { lunch: e.target.checked })}
                              className="w-4 h-4 rounded border-slate-500 bg-slate-700 text-amber-500"
                            />
                            {line.lunch && (
                              <select
                                value={line.lunchMinutes}
                                onChange={e => updateLine(dayIdx, line.id, { lunchMinutes: Number(e.target.value) })}
                                className={`w-16 ${inputCls}`}
                              >
                                <option value={30}>0:30</option>
                                <option value={60}>1:00</option>
                              </select>
                            )}
                          </div>
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="time"
                            value={line.finishTime}
                            onChange={e => updateLine(dayIdx, line.id, { finishTime: e.target.value })}
                            onFocus={() => { if (!line.finishTime) updateLine(dayIdx, line.id, { finishTime: '16:30' }); }}
                            className={`w-24 ${inputCls}`}
                          />
                        </td>
                        <td className="py-2 px-3 text-right">
                          <span className="text-sm font-bold text-white">{hrs > 0 ? hrs.toFixed(2) : ''}</span>
                        </td>
                        <td className="py-2 px-3">
                          <input
                            value={line.jobNo}
                            onChange={e => updateLine(dayIdx, line.id, { jobNo: e.target.value })}
                            className={`w-36 ${inputCls}`}
                            placeholder="e.g. 1234 - Job"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <select
                            value={line.analysisCode}
                            onChange={e => updateLine(dayIdx, line.id, { analysisCode: e.target.value })}
                            className={`w-40 ${inputCls}`}
                          >
                            <option value="">—</option>
                            {ANALYSIS_CODES.map(a => (
                              <option key={a.code} value={a.code}>{a.code} — {a.label}</option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 px-3">
                          <input
                            value={line.other}
                            onChange={e => updateLine(dayIdx, line.id, { other: e.target.value })}
                            className={`w-full min-w-[120px] ${inputCls}`}
                          />
                        </td>
                        <td className="py-2 px-3">
                          <div className="flex gap-1">
                            <button onClick={() => removeLine(dayIdx, line.id)} className="p-1 rounded hover:bg-red-500/20 text-red-400">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            {lineIdx === d.lines.length - 1 && (
                              <button onClick={() => addLine(dayIdx)} className="p-1 rounded hover:bg-emerald-500/20 text-emerald-400">
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {/* Day separator */}
                  <tr><td colSpan={9} className="h-1 bg-slate-700/20" /></tr>
                </React.Fragment>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-600">
                <td colSpan={4} className="py-3 px-3 text-sm font-bold text-white">WEEK TOTAL</td>
                <td className="py-3 px-3 text-right text-lg font-bold text-amber-400">{weekTotal.toFixed(2)}</td>
                <td colSpan={4}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Messages & Sign-off */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
          <label className="block text-xs font-semibold text-slate-400 mb-2">Messages</label>
          <textarea
            value={messages}
            onChange={e => setMessages(e.target.value)}
            rows={3}
            className={`w-full ${inputCls} resize-none`}
            placeholder="Any messages or notes..."
          />
          <div className="mt-3">
            <label className="block text-xs font-semibold text-slate-400 mb-1">No. Nights Away</label>
            <input value={nightsAway} onChange={e => setNightsAway(e.target.value)} className={`w-full ${inputCls}`} />
          </div>
        </div>

        <div className="space-y-3">
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
            <h4 className="text-xs font-bold text-white mb-2">Staff Sign-off</h4>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-slate-500 mb-1">Name</label>
                <input value={staffSignOff.name} onChange={e => setStaffSignOff({ ...staffSignOff, name: e.target.value })} className={`w-full ${inputCls}`} />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 mb-1">Date</label>
                <input type="date" value={staffSignOff.date} onChange={e => setStaffSignOff({ ...staffSignOff, date: e.target.value })} className={`w-full ${inputCls}`} />
              </div>
            </div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
            <h4 className="text-xs font-bold text-white mb-2">Site Manager Sign-off</h4>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-slate-500 mb-1">Name</label>
                <input value={managerSignOff.name} onChange={e => setManagerSignOff({ ...managerSignOff, name: e.target.value })} className={`w-full ${inputCls}`} />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 mb-1">Date</label>
                <input type="date" value={managerSignOff.date} onChange={e => setManagerSignOff({ ...managerSignOff, date: e.target.value })} className={`w-full ${inputCls}`} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimesheetPage;
