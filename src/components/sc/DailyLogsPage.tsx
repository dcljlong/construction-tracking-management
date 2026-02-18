import React, { useEffect, useState, useCallback } from 'react';
import {
  ChevronLeft, ChevronRight, Plus, Trash2, Save, Check, X,
  Users, Activity, Package, Wrench, Eye, FileText,
  AlertTriangle, Clock, Calendar as CalendarIcon
} from 'lucide-react';


import { format, addMonths, subMonths, isSameDay, parseISO } from 'date-fns';
import type { DailyLog, CrewAttendance, WorkActivity, Material, EquipmentLog, Visitor } from '@/lib/sitecommand-types';
import { TRADES, WEATHER_OPTIONS } from '@/lib/sitecommand-types';
import { calculatePriority, getPriorityDot, getCalendarGrid, todayStr, calculateHours } from '@/lib/sitecommand-utils';
import PriorityBadge from './PriorityBadge';
import * as store from '@/lib/sitecommand-store';

type SubTab = 'general' | 'crew' | 'activities' | 'materials' | 'equipment' | 'visitors';

interface DailyLogsPageProps {
  initialData?: any;
}

const inputCls = 'w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm focus:outline-none focus:border-amber-500';
const labelCls = 'block text-xs font-medium text-slate-400 mb-1';
const btnPrimary = 'px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-900 text-xs font-semibold transition-colors';
const btnSecondary = 'px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-medium transition-colors';
const btnDanger = 'p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors';
const checkCls = 'w-4 h-4 rounded border-slate-500 bg-slate-700 text-amber-500 focus:ring-amber-500';

const DailyLogsPage: React.FC<DailyLogsPageProps> = ({ initialData }) => {
  const [calMonth, setCalMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [allLogDates, setAllLogDates] = useState<string[]>([]);
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [currentLog, setCurrentLog] = useState<DailyLog | null>(null);
  const [subTab, setSubTab] = useState<SubTab>('general');
  const [loading, setLoading] = useState(false);

  // Load logs for selected date
  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await store.fetchDailyLogs({ date: selectedDate });
      setLogs(data);
      if (data.length > 0 && !selectedLogId) {
        setSelectedLogId(data[0].id);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [selectedDate]);

  // Load full log detail
  const loadLogDetail = useCallback(async () => {
    if (!selectedLogId) { setCurrentLog(null); return; }
    try {
      const full = await store.fetchDailyLogFull(selectedLogId);
      setCurrentLog(full);
    } catch (e) { console.error(e); }
  }, [selectedLogId]);

  // Load all log dates for calendar dots
  const loadAllDates = useCallback(async () => {
    try {
      const all = await store.fetchDailyLogs();
      setAllLogDates(all.map(l => l.log_date));
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { loadLogs(); }, [selectedDate]);
  useEffect(() => { loadLogDetail(); }, [selectedLogId]);
  useEffect(() => { loadAllDates(); }, []);

  useEffect(() => {
    if (initialData?.logId) {
      setSelectedLogId(initialData.logId);
    }
    if (initialData?.tab) {
      setSubTab(initialData.tab as SubTab);
    }
  }, [initialData]);

  // When logs change, auto-select first
  useEffect(() => {
    if (logs.length > 0 && !logs.find(l => l.id === selectedLogId)) {
      setSelectedLogId(logs[0].id);
    }
    if (logs.length === 0) {
      setSelectedLogId(null);
      setCurrentLog(null);
    }
  }, [logs]);

  const grid = getCalendarGrid(calMonth.getFullYear(), calMonth.getMonth());

  const handleDeleteLog = async (id: string) => {
    if (!confirm('Delete this job entry?')) return;
    await store.deleteDailyLog(id);
    setSelectedLogId(null);
    loadLogs();
    loadAllDates();
  };

  const handleUpdateLog = async (field: string, value: any) => {
    if (!currentLog) return;
    try {
      await store.updateDailyLog(currentLog.id, { [field]: value });
      setCurrentLog(prev => prev ? { ...prev, [field]: value } : null);
    } catch (e) { console.error(e); }
  };

  // Sub-tab components
  const subTabs: { key: SubTab; label: string; icon: React.ElementType; count?: number }[] = [
    { key: 'general', label: 'General', icon: FileText },
    { key: 'crew', label: 'Crew', icon: Users, count: currentLog?.crew?.length },
    { key: 'activities', label: 'Activities', icon: Activity, count: currentLog?.activities?.length },
    { key: 'materials', label: 'Materials', icon: Package, count: currentLog?.materials?.length },
    { key: 'equipment', label: 'Equipment', icon: Wrench, count: currentLog?.equipment?.length },
    { key: 'visitors', label: 'Visitors', icon: Eye, count: currentLog?.visitors?.length },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-5rem)]">
      {/* Mobile date picker */}
      <div className="lg:hidden flex items-center gap-2 bg-slate-800/60 border border-slate-700/50 rounded-xl p-3">
        <CalendarIcon className="w-4 h-4 text-amber-400" />
        <input
          type="date"
          value={selectedDate}
          onChange={e => { setSelectedDate(e.target.value); setSelectedLogId(null); }}
          className="flex-1 px-3 py-1.5 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm focus:outline-none focus:border-amber-500"
        />
        <span className="text-xs text-slate-400">{logs.length} job{logs.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Calendar Sidebar - desktop only */}
      <div className="hidden lg:block w-64 flex-shrink-0 bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 overflow-y-auto">

        <div className="flex items-center justify-between mb-3">
          <button onClick={() => setCalMonth(subMonths(calMonth, 1))} className="p-1 rounded hover:bg-slate-700 text-slate-400">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold text-white">{format(calMonth, 'MMMM yyyy')}</span>
          <button onClick={() => setCalMonth(addMonths(calMonth, 1))} className="p-1 rounded hover:bg-slate-700 text-slate-400">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-0.5 text-center mb-1">
          {['S','M','T','W','T','F','S'].map((d, i) => (
            <div key={i} className="text-[10px] text-slate-500 font-medium py-1">{d}</div>
          ))}
        </div>

        {grid.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-0.5">
            {week.map((day, di) => {
              if (!day) return <div key={di} />;
              const dateStr = format(day, 'yyyy-MM-dd');
              const isSelected = dateStr === selectedDate;
              const isToday = isSameDay(day, new Date());
              const hasLogs = allLogDates.includes(dateStr);
              return (
                <button
                  key={di}
                  onClick={() => { setSelectedDate(dateStr); setSelectedLogId(null); }}
                  className={`relative w-full aspect-square flex items-center justify-center rounded-lg text-xs transition-colors ${
                    isSelected ? 'bg-amber-500 text-slate-900 font-bold'
                    : isToday ? 'bg-slate-700 text-white font-semibold'
                    : 'text-slate-300 hover:bg-slate-700/50'
                  }`}
                >
                  {day.getDate()}
                  {hasLogs && !isSelected && (
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-amber-400" />
                  )}
                </button>
              );
            })}
          </div>
        ))}

        {/* Date's logs list */}
        <div className="mt-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">
              {format(parseISO(selectedDate), 'EEE, dd MMM')}
            </span>
            <span className="text-[10px] text-slate-500">{logs.length} job{logs.length !== 1 ? 's' : ''}</span>
          </div>
          {logs.map(log => (
            <button
              key={log.id}
              onClick={() => setSelectedLogId(log.id)}
              className={`w-full text-left p-2 rounded-lg text-xs transition-colors ${
                selectedLogId === log.id
                  ? 'bg-amber-500/15 border border-amber-500/30 text-amber-300'
                  : 'bg-slate-700/30 border border-transparent text-slate-300 hover:bg-slate-700/50'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${getPriorityDot(log.priority)}`} />
                <span className="font-medium truncate">{log.project?.name || 'Unknown'}</span>
              </div>
              {log.project?.job_number && (
                <span className="text-[10px] text-slate-500 ml-3">#{log.project.job_number}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0 overflow-y-auto">
        {!currentLog ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">Select a job from the calendar or create a new one</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Job Header */}
            <div className="flex items-center justify-between bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                    #{currentLog.project?.job_number || '—'}
                  </span>
                  <PriorityBadge priority={currentLog.priority} />
                </div>
                <h2 className="text-lg font-bold text-white mt-1">{currentLog.project?.name || 'Unknown'}</h2>
                <p className="text-xs text-slate-400">
                  {currentLog.project?.location} {currentLog.project?.client ? `• ${currentLog.project.client}` : ''}
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleDeleteLog(currentLog.id)} className="p-2 rounded-lg hover:bg-red-500/20 text-red-400">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Sub-tabs */}
            <div className="flex gap-1 overflow-x-auto pb-1">
              {subTabs.map(t => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.key}
                    onClick={() => setSubTab(t.key)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                      subTab === t.key
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {t.label}
                    {t.count !== undefined && t.count > 0 && (
                      <span className="bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded-full text-[10px]">{t.count}</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
              {subTab === 'general' && <GeneralTab log={currentLog} onUpdate={handleUpdateLog} />}
              {subTab === 'crew' && <CrewTab log={currentLog} onRefresh={loadLogDetail} />}
              {subTab === 'activities' && <ActivitiesTab log={currentLog} onRefresh={loadLogDetail} />}
              {subTab === 'materials' && <MaterialsTab log={currentLog} onRefresh={loadLogDetail} />}
              {subTab === 'equipment' && <EquipmentTab log={currentLog} onRefresh={loadLogDetail} />}
              {subTab === 'visitors' && <VisitorsTab log={currentLog} onRefresh={loadLogDetail} />}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── General Tab ───
const GeneralTab: React.FC<{ log: DailyLog; onUpdate: (field: string, value: any) => void }> = ({ log, onUpdate }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div>
      <label className={labelCls}>Weather</label>
      <select value={log.weather || ''} onChange={e => onUpdate('weather', e.target.value)} className={inputCls}>
        <option value="">Select...</option>
        {WEATHER_OPTIONS.map(w => <option key={w} value={w}>{w}</option>)}
      </select>
    </div>
    <div>
      <label className={labelCls}>Temperature</label>
      <input value={log.temperature || ''} onChange={e => onUpdate('temperature', e.target.value)} className={inputCls} placeholder="e.g. 18°C" />
    </div>
    <div>
      <label className={labelCls}>Wind</label>
      <input value={log.wind || ''} onChange={e => onUpdate('wind', e.target.value)} className={inputCls} placeholder="e.g. Light NW" />
    </div>
    <div>
      <label className={labelCls}>Priority</label>
      <select value={log.priority} onChange={e => onUpdate('priority', e.target.value)} className={inputCls}>
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </select>
    </div>
    <div className="md:col-span-2">
      <label className={labelCls}>Site Conditions</label>
      <input value={log.site_conditions || ''} onChange={e => onUpdate('site_conditions', e.target.value)} className={inputCls} placeholder="e.g. Dry, good access" />
    </div>
    <div className="md:col-span-2">
      <label className={labelCls}>Safety Incidents</label>
      <textarea value={log.safety_incidents || ''} onChange={e => onUpdate('safety_incidents', e.target.value)} rows={2} className={`${inputCls} resize-none`} placeholder="Record any safety incidents..." />
    </div>
    <div className="md:col-span-2">
      <label className={labelCls}>Critical Items</label>
      <textarea value={log.critical_items || ''} onChange={e => onUpdate('critical_items', e.target.value)} rows={2} className={`${inputCls} resize-none`} placeholder="Flag any critical issues..." />
    </div>
    <div className="md:col-span-2">
      <label className={labelCls}>Notes</label>
      <textarea value={log.notes || ''} onChange={e => onUpdate('notes', e.target.value)} rows={3} className={`${inputCls} resize-none`} placeholder="General notes for the day..." />
    </div>
  </div>
);

// ─── Inline Item Row Component ───
interface InlineRowProps<T> {
  item: T;
  fields: { key: string; label: string; type: 'text' | 'select' | 'number' | 'date' | 'time' | 'checkbox'; options?: string[]; width?: string }[];
  onSave: (id: string, data: Partial<T>) => void;
  onDelete: (id: string) => void;
  onToggleComplete: (id: string, val: boolean) => void;
}

function InlineRow<T extends { id: string; is_completed: boolean }>({ item, fields, onSave, onDelete, onToggleComplete }: InlineRowProps<T>) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<any>({ ...item });

  const handleSave = () => {
    const changes: any = {};
    fields.forEach(f => {
      if (draft[f.key] !== (item as any)[f.key]) changes[f.key] = draft[f.key];
    });
    if (Object.keys(changes).length > 0) onSave(item.id, changes);
    setEditing(false);
  };

  const priority = calculatePriority((item as any).due_date || (item as any).required_date);

  return (
    <tr className={`border-b border-slate-700/30 ${item.is_completed ? 'opacity-50' : ''}`}>
      <td className="py-2 px-2">
        <input
          type="checkbox"
          checked={item.is_completed}
          onChange={e => onToggleComplete(item.id, e.target.checked)}
          className={checkCls}
        />
      </td>
      {fields.map(f => (
        <td key={f.key} className="py-2 px-2">
          {editing ? (
            f.type === 'select' ? (
              <select value={draft[f.key] || ''} onChange={e => setDraft({ ...draft, [f.key]: e.target.value })} className="w-full px-2 py-1 rounded bg-slate-600 border border-slate-500 text-white text-xs">
                <option value="">—</option>
                {f.options?.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : f.type === 'checkbox' ? (
              <input type="checkbox" checked={draft[f.key] || false} onChange={e => setDraft({ ...draft, [f.key]: e.target.checked })} className={checkCls} />
            ) : (
              <input
                type={f.type}
                value={draft[f.key] || ''}
                onChange={e => setDraft({ ...draft, [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value })}
                className="w-full px-2 py-1 rounded bg-slate-600 border border-slate-500 text-white text-xs"
              />
            )
          ) : (
            <span className={`text-xs ${item.is_completed ? 'line-through text-slate-500' : 'text-slate-300'}`}>
              {(item as any)[f.key] || '—'}
            </span>
          )}
        </td>
      ))}
      <td className="py-2 px-2">
        <PriorityBadge priority={priority} size="sm" showIcon={false} />
      </td>
      <td className="py-2 px-2">
        <div className="flex gap-1">
          {editing ? (
            <>
              <button onClick={handleSave} className="p-1 rounded hover:bg-emerald-500/20 text-emerald-400"><Check className="w-3.5 h-3.5" /></button>
              <button onClick={() => { setEditing(false); setDraft({ ...item }); }} className="p-1 rounded hover:bg-slate-600 text-slate-400"><X className="w-3.5 h-3.5" /></button>
            </>
          ) : (
            <>
              <button onClick={() => setEditing(true)} className="p-1 rounded hover:bg-slate-600 text-slate-400 text-xs">Edit</button>
              <button onClick={() => onDelete(item.id)} className={btnDanger}><Trash2 className="w-3.5 h-3.5" /></button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

// ─── Crew Tab ───
const CrewTab: React.FC<{ log: DailyLog; onRefresh: () => void }> = ({ log, onRefresh }) => {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ worker_name: '', trade: '', start_time: '07:00', finish_time: '16:30', lunch_minutes: 30, due_date: '', notes: '' });

  const handleAdd = async () => {
    const hrs = calculateHours(form.start_time, form.finish_time, form.lunch_minutes);
    await store.createCrew({ ...form, daily_log_id: log.id, hours_worked: hrs, is_completed: false });
    setForm({ worker_name: '', trade: '', start_time: '07:00', finish_time: '16:30', lunch_minutes: 30, due_date: '', notes: '' });
    setAdding(false);
    onRefresh();
  };

  const fields = [
    { key: 'worker_name', label: 'Name', type: 'text' as const },
    { key: 'trade', label: 'Trade', type: 'select' as const, options: TRADES },
    { key: 'start_time', label: 'Start', type: 'time' as const },
    { key: 'finish_time', label: 'Finish', type: 'time' as const },
    { key: 'due_date', label: 'Due Date', type: 'date' as const },
    { key: 'notes', label: 'Notes', type: 'text' as const },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white">Crew Attendance</h3>
        <button onClick={() => setAdding(!adding)} className={btnPrimary}><Plus className="w-3 h-3 inline mr-1" />Add</button>
      </div>

      {adding && (
        <div className="bg-slate-700/30 border border-slate-600/50 rounded-lg p-3 mb-3 grid grid-cols-2 md:grid-cols-4 gap-2">
          <div><label className={labelCls}>Name *</label><input value={form.worker_name} onChange={e => setForm({ ...form, worker_name: e.target.value })} className={inputCls} /></div>
          <div><label className={labelCls}>Trade</label><select value={form.trade} onChange={e => setForm({ ...form, trade: e.target.value })} className={inputCls}><option value="">—</option>{TRADES.map(t => <option key={t}>{t}</option>)}</select></div>
          <div><label className={labelCls}>Start</label><input type="time" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} className={inputCls} /></div>
          <div><label className={labelCls}>Finish</label><input type="time" value={form.finish_time} onChange={e => setForm({ ...form, finish_time: e.target.value })} className={inputCls} /></div>
          <div><label className={labelCls}>Due Date</label><input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} className={inputCls} /></div>
          <div><label className={labelCls}>Notes</label><input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className={inputCls} /></div>
          <div className="flex items-end gap-2">
            <button onClick={handleAdd} className={btnPrimary}>Save</button>
            <button onClick={() => setAdding(false)} className={btnSecondary}>Cancel</button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-700/50">
              <th className="py-2 px-2 text-[10px] text-slate-500 w-8"></th>
              {fields.map(f => <th key={f.key} className="py-2 px-2 text-[10px] text-slate-500 uppercase">{f.label}</th>)}
              <th className="py-2 px-2 text-[10px] text-slate-500">Priority</th>
              <th className="py-2 px-2 text-[10px] text-slate-500 w-20"></th>
            </tr>
          </thead>
          <tbody>
            {(log.crew || []).map(c => (
              <InlineRow
                key={c.id}
                item={c}
                fields={fields}
                onSave={async (id, data) => { await store.updateCrew(id, data); onRefresh(); }}
                onDelete={async id => { await store.deleteCrew(id); onRefresh(); }}
                onToggleComplete={async (id, val) => { await store.updateCrew(id, { is_completed: val }); onRefresh(); }}
              />
            ))}
          </tbody>
        </table>
        {(!log.crew || log.crew.length === 0) && (
          <p className="text-xs text-slate-500 text-center py-4">No crew recorded. Click Add to start.</p>
        )}
      </div>
    </div>
  );
};

// ─── Activities Tab ───
const ActivitiesTab: React.FC<{ log: DailyLog; onRefresh: () => void }> = ({ log, onRefresh }) => {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ description: '', location: '', trade: '', progress_pct: 0, due_date: '', notes: '' });

  const handleAdd = async () => {
    await store.createActivity({ ...form, daily_log_id: log.id, is_completed: false });
    setForm({ description: '', location: '', trade: '', progress_pct: 0, due_date: '', notes: '' });
    setAdding(false);
    onRefresh();
  };

  const fields = [
    { key: 'description', label: 'Description', type: 'text' as const },
    { key: 'location', label: 'Location', type: 'text' as const },
    { key: 'trade', label: 'Trade', type: 'select' as const, options: TRADES },
    { key: 'progress_pct', label: 'Progress %', type: 'number' as const },
    { key: 'due_date', label: 'Due Date', type: 'date' as const },
    { key: 'notes', label: 'Notes', type: 'text' as const },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white">Work Activities</h3>
        <button onClick={() => setAdding(!adding)} className={btnPrimary}><Plus className="w-3 h-3 inline mr-1" />Add</button>
      </div>

      {adding && (
        <div className="bg-slate-700/30 border border-slate-600/50 rounded-lg p-3 mb-3 grid grid-cols-2 md:grid-cols-3 gap-2">
          <div><label className={labelCls}>Description *</label><input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className={inputCls} /></div>
          <div><label className={labelCls}>Location</label><input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className={inputCls} /></div>
          <div><label className={labelCls}>Trade</label><select value={form.trade} onChange={e => setForm({ ...form, trade: e.target.value })} className={inputCls}><option value="">—</option>{TRADES.map(t => <option key={t}>{t}</option>)}</select></div>
          <div><label className={labelCls}>Progress %</label><input type="number" min={0} max={100} value={form.progress_pct} onChange={e => setForm({ ...form, progress_pct: Number(e.target.value) })} className={inputCls} /></div>
          <div><label className={labelCls}>Due Date</label><input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} className={inputCls} /></div>
          <div><label className={labelCls}>Notes</label><input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className={inputCls} /></div>
          <div className="flex items-end gap-2">
            <button onClick={handleAdd} className={btnPrimary}>Save</button>
            <button onClick={() => setAdding(false)} className={btnSecondary}>Cancel</button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-700/50">
              <th className="py-2 px-2 text-[10px] text-slate-500 w-8"></th>
              {fields.map(f => <th key={f.key} className="py-2 px-2 text-[10px] text-slate-500 uppercase">{f.label}</th>)}
              <th className="py-2 px-2 text-[10px] text-slate-500">Priority</th>
              <th className="py-2 px-2 text-[10px] text-slate-500 w-20"></th>
            </tr>
          </thead>
          <tbody>
            {(log.activities || []).map(a => (
              <InlineRow
                key={a.id}
                item={a}
                fields={fields}
                onSave={async (id, data) => { await store.updateActivity(id, data); onRefresh(); }}
                onDelete={async id => { await store.deleteActivity(id); onRefresh(); }}
                onToggleComplete={async (id, val) => { await store.updateActivity(id, { is_completed: val }); onRefresh(); }}
              />
            ))}
          </tbody>
        </table>
        {(!log.activities || log.activities.length === 0) && (
          <p className="text-xs text-slate-500 text-center py-4">No activities recorded. Click Add to start.</p>
        )}
      </div>
    </div>
  );
};

// ─── Materials Tab ───
const MaterialsTab: React.FC<{ log: DailyLog; onRefresh: () => void }> = ({ log, onRefresh }) => {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ description: '', quantity: '', unit: '', supplier: '', required_date: '', status: 'pending', notes: '' });

  const handleAdd = async () => {
    await store.createMaterial({ ...form, daily_log_id: log.id, is_completed: false });
    setForm({ description: '', quantity: '', unit: '', supplier: '', required_date: '', status: 'pending', notes: '' });
    setAdding(false);
    onRefresh();
  };

  const fields = [
    { key: 'description', label: 'Description', type: 'text' as const },
    { key: 'quantity', label: 'Qty', type: 'text' as const },
    { key: 'unit', label: 'Unit', type: 'text' as const },
    { key: 'supplier', label: 'Supplier', type: 'text' as const },
    { key: 'required_date', label: 'Required Date', type: 'date' as const },
    { key: 'status', label: 'Status', type: 'select' as const, options: ['pending', 'ordered', 'in-transit', 'delivered'] },
    { key: 'notes', label: 'Notes', type: 'text' as const },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white">Materials</h3>
        <button onClick={() => setAdding(!adding)} className={btnPrimary}><Plus className="w-3 h-3 inline mr-1" />Add</button>
      </div>

      {adding && (
        <div className="bg-slate-700/30 border border-slate-600/50 rounded-lg p-3 mb-3 grid grid-cols-2 md:grid-cols-4 gap-2">
          <div><label className={labelCls}>Description *</label><input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className={inputCls} /></div>
          <div><label className={labelCls}>Quantity</label><input value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} className={inputCls} /></div>
          <div><label className={labelCls}>Unit</label><input value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} className={inputCls} placeholder="e.g. m², sheets" /></div>
          <div><label className={labelCls}>Supplier</label><input value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })} className={inputCls} /></div>
          <div><label className={labelCls}>Required Date</label><input type="date" value={form.required_date} onChange={e => setForm({ ...form, required_date: e.target.value })} className={inputCls} /></div>
          <div><label className={labelCls}>Status</label><select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className={inputCls}><option value="pending">Pending</option><option value="ordered">Ordered</option><option value="in-transit">In Transit</option><option value="delivered">Delivered</option></select></div>
          <div><label className={labelCls}>Notes</label><input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className={inputCls} /></div>
          <div className="flex items-end gap-2">
            <button onClick={handleAdd} className={btnPrimary}>Save</button>
            <button onClick={() => setAdding(false)} className={btnSecondary}>Cancel</button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-700/50">
              <th className="py-2 px-2 text-[10px] text-slate-500 w-8"></th>
              {fields.map(f => <th key={f.key} className="py-2 px-2 text-[10px] text-slate-500 uppercase">{f.label}</th>)}
              <th className="py-2 px-2 text-[10px] text-slate-500">Priority</th>
              <th className="py-2 px-2 text-[10px] text-slate-500 w-20"></th>
            </tr>
          </thead>
          <tbody>
            {(log.materials || []).map(m => (
              <InlineRow
                key={m.id}
                item={m}
                fields={fields}
                onSave={async (id, data) => { await store.updateMaterial(id, data); onRefresh(); }}
                onDelete={async id => { await store.deleteMaterial(id); onRefresh(); }}
                onToggleComplete={async (id, val) => { await store.updateMaterial(id, { is_completed: val }); onRefresh(); }}
              />
            ))}
          </tbody>
        </table>
        {(!log.materials || log.materials.length === 0) && (
          <p className="text-xs text-slate-500 text-center py-4">No materials recorded. Click Add to start.</p>
        )}
      </div>
    </div>
  );
};

// ─── Equipment Tab ───
const EquipmentTab: React.FC<{ log: DailyLog; onRefresh: () => void }> = ({ log, onRefresh }) => {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ equipment_name: '', equipment_type: '', hours_used: 0, condition: 'good', due_date: '', notes: '' });

  const handleAdd = async () => {
    await store.createEquipment({ ...form, daily_log_id: log.id, is_completed: false });
    setForm({ equipment_name: '', equipment_type: '', hours_used: 0, condition: 'good', due_date: '', notes: '' });
    setAdding(false);
    onRefresh();
  };

  const fields = [
    { key: 'equipment_name', label: 'Equipment', type: 'text' as const },
    { key: 'equipment_type', label: 'Type', type: 'text' as const },
    { key: 'hours_used', label: 'Hours', type: 'number' as const },
    { key: 'condition', label: 'Condition', type: 'select' as const, options: ['good', 'fair', 'poor', 'needs-repair'] },
    { key: 'due_date', label: 'Due Date', type: 'date' as const },
    { key: 'notes', label: 'Notes', type: 'text' as const },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white">Equipment</h3>
        <button onClick={() => setAdding(!adding)} className={btnPrimary}><Plus className="w-3 h-3 inline mr-1" />Add</button>
      </div>

      {adding && (
        <div className="bg-slate-700/30 border border-slate-600/50 rounded-lg p-3 mb-3 grid grid-cols-2 md:grid-cols-3 gap-2">
          <div><label className={labelCls}>Equipment *</label><input value={form.equipment_name} onChange={e => setForm({ ...form, equipment_name: e.target.value })} className={inputCls} /></div>
          <div><label className={labelCls}>Type</label><input value={form.equipment_type} onChange={e => setForm({ ...form, equipment_type: e.target.value })} className={inputCls} /></div>
          <div><label className={labelCls}>Hours Used</label><input type="number" value={form.hours_used} onChange={e => setForm({ ...form, hours_used: Number(e.target.value) })} className={inputCls} /></div>
          <div><label className={labelCls}>Condition</label><select value={form.condition} onChange={e => setForm({ ...form, condition: e.target.value })} className={inputCls}><option value="good">Good</option><option value="fair">Fair</option><option value="poor">Poor</option><option value="needs-repair">Needs Repair</option></select></div>
          <div><label className={labelCls}>Due Date</label><input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} className={inputCls} /></div>
          <div><label className={labelCls}>Notes</label><input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className={inputCls} /></div>
          <div className="flex items-end gap-2">
            <button onClick={handleAdd} className={btnPrimary}>Save</button>
            <button onClick={() => setAdding(false)} className={btnSecondary}>Cancel</button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-700/50">
              <th className="py-2 px-2 text-[10px] text-slate-500 w-8"></th>
              {fields.map(f => <th key={f.key} className="py-2 px-2 text-[10px] text-slate-500 uppercase">{f.label}</th>)}
              <th className="py-2 px-2 text-[10px] text-slate-500">Priority</th>
              <th className="py-2 px-2 text-[10px] text-slate-500 w-20"></th>
            </tr>
          </thead>
          <tbody>
            {(log.equipment || []).map(eq => (
              <InlineRow
                key={eq.id}
                item={eq}
                fields={fields}
                onSave={async (id, data) => { await store.updateEquipment(id, data); onRefresh(); }}
                onDelete={async id => { await store.deleteEquipment(id); onRefresh(); }}
                onToggleComplete={async (id, val) => { await store.updateEquipment(id, { is_completed: val }); onRefresh(); }}
              />
            ))}
          </tbody>
        </table>
        {(!log.equipment || log.equipment.length === 0) && (
          <p className="text-xs text-slate-500 text-center py-4">No equipment recorded. Click Add to start.</p>
        )}
      </div>
    </div>
  );
};

// ─── Visitors Tab ───
const VisitorsTab: React.FC<{ log: DailyLog; onRefresh: () => void }> = ({ log, onRefresh }) => {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ visitor_name: '', company: '', purpose: '', time_in: '', time_out: '', due_date: '', notes: '' });

  const handleAdd = async () => {
    await store.createVisitor({ ...form, daily_log_id: log.id, is_completed: false });
    setForm({ visitor_name: '', company: '', purpose: '', time_in: '', time_out: '', due_date: '', notes: '' });
    setAdding(false);
    onRefresh();
  };

  const fields = [
    { key: 'visitor_name', label: 'Name', type: 'text' as const },
    { key: 'company', label: 'Company', type: 'text' as const },
    { key: 'purpose', label: 'Purpose', type: 'text' as const },
    { key: 'time_in', label: 'Time In', type: 'time' as const },
    { key: 'time_out', label: 'Time Out', type: 'time' as const },
    { key: 'due_date', label: 'Due Date', type: 'date' as const },
    { key: 'notes', label: 'Notes', type: 'text' as const },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white">Visitors</h3>
        <button onClick={() => setAdding(!adding)} className={btnPrimary}><Plus className="w-3 h-3 inline mr-1" />Add</button>
      </div>

      {adding && (
        <div className="bg-slate-700/30 border border-slate-600/50 rounded-lg p-3 mb-3 grid grid-cols-2 md:grid-cols-4 gap-2">
          <div><label className={labelCls}>Name *</label><input value={form.visitor_name} onChange={e => setForm({ ...form, visitor_name: e.target.value })} className={inputCls} /></div>
          <div><label className={labelCls}>Company</label><input value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} className={inputCls} /></div>
          <div><label className={labelCls}>Purpose</label><input value={form.purpose} onChange={e => setForm({ ...form, purpose: e.target.value })} className={inputCls} /></div>
          <div><label className={labelCls}>Time In</label><input type="time" value={form.time_in} onChange={e => setForm({ ...form, time_in: e.target.value })} className={inputCls} /></div>
          <div><label className={labelCls}>Time Out</label><input type="time" value={form.time_out} onChange={e => setForm({ ...form, time_out: e.target.value })} className={inputCls} /></div>
          <div><label className={labelCls}>Due Date</label><input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} className={inputCls} /></div>
          <div><label className={labelCls}>Notes</label><input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className={inputCls} /></div>
          <div className="flex items-end gap-2">
            <button onClick={handleAdd} className={btnPrimary}>Save</button>
            <button onClick={() => setAdding(false)} className={btnSecondary}>Cancel</button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-700/50">
              <th className="py-2 px-2 text-[10px] text-slate-500 w-8"></th>
              {fields.map(f => <th key={f.key} className="py-2 px-2 text-[10px] text-slate-500 uppercase">{f.label}</th>)}
              <th className="py-2 px-2 text-[10px] text-slate-500">Priority</th>
              <th className="py-2 px-2 text-[10px] text-slate-500 w-20"></th>
            </tr>
          </thead>
          <tbody>
            {(log.visitors || []).map(v => (
              <InlineRow
                key={v.id}
                item={v}
                fields={fields}
                onSave={async (id, data) => { await store.updateVisitor(id, data); onRefresh(); }}
                onDelete={async id => { await store.deleteVisitor(id); onRefresh(); }}
                onToggleComplete={async (id, val) => { await store.updateVisitor(id, { is_completed: val }); onRefresh(); }}
              />
            ))}
          </tbody>
        </table>
        {(!log.visitors || log.visitors.length === 0) && (
          <p className="text-xs text-slate-500 text-center py-4">No visitors recorded. Click Add to start.</p>
        )}
      </div>
    </div>
  );
};

export default DailyLogsPage;
