import React, { useEffect, useState, useMemo } from 'react';
import {
  ChevronLeft, ChevronRight, Plus, X, Check, Trash2,
  Calendar as CalIcon, StickyNote, Bell, Users2, Target, Search, Truck
} from 'lucide-react';
import { format, addMonths, subMonths, isSameDay, parseISO } from 'date-fns';
import type { CalendarNote, DailyLog, Project } from '@/lib/sitecommand-types';
import { NOTE_TYPES } from '@/lib/sitecommand-types';
import { getCalendarGrid, getPriorityDot, formatDate, todayStr, calculatePriority } from '@/lib/sitecommand-utils';
import PriorityBadge from './PriorityBadge';
import * as store from '@/lib/sitecommand-store';

interface CalendarPageProps {
  onNavigate: (page: string, data?: any) => void;
  initialData?: any;
}

const inputCls = 'w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm focus:outline-none focus:border-amber-500';
const labelCls = 'block text-xs font-medium text-slate-400 mb-1';

const CalendarPage: React.FC<CalendarPageProps> = ({ onNavigate, initialData }) => {
  const [month, setMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [notes, setNotes] = useState<CalendarNote[]>([]);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [showAddNote, setShowAddNote] = useState(false);
  const [loading, setLoading] = useState(true);

  // Note form
  const [noteForm, setNoteForm] = useState({
    title: '', description: '', note_type: 'note', priority: 'low', project_id: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [n, l, p] = await Promise.all([
        store.fetchCalendarNotes(month.getMonth(), month.getFullYear()),
        store.fetchDailyLogs(),
        store.fetchProjects(),
      ]);
      setNotes(n);
      setLogs(l);
      setProjects(p);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [month]);

  const grid = getCalendarGrid(month.getFullYear(), month.getMonth());

  // Get items for a specific date
  const getDateItems = (dateStr: string) => {
    const dateLogs = logs.filter(l => l.log_date === dateStr);
    const dateNotes = notes.filter(n => n.note_date === dateStr);
    return { logs: dateLogs, notes: dateNotes };
  };

  const selectedItems = getDateItems(selectedDate);

  const handleAddNote = async () => {
    try {
      await store.createCalendarNote({
        ...noteForm,
        note_date: selectedDate,
        project_id: noteForm.project_id || null,
        is_completed: false,
      } as any);
      setNoteForm({ title: '', description: '', note_type: 'note', priority: 'low', project_id: '' });
      setShowAddNote(false);
      loadData();
    } catch (e) { console.error(e); }
  };

  const handleToggleNote = async (id: string, completed: boolean) => {
    await store.updateCalendarNote(id, { is_completed: completed });
    loadData();
  };

  const handleDeleteNote = async (id: string) => {
    await store.deleteCalendarNote(id);
    loadData();
  };

  const noteTypeIcon: Record<string, React.ElementType> = {
    note: StickyNote,
    reminder: Bell,
    meeting: Users2,
    deadline: Target,
    inspection: Search,
    delivery: Truck,
  };

  const noteTypeColor: Record<string, string> = {
    note: 'bg-blue-500',
    reminder: 'bg-purple-500',
    meeting: 'bg-indigo-500',
    deadline: 'bg-red-500',
    inspection: 'bg-amber-500',
    delivery: 'bg-green-500',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Calendar</h1>
        <button
          onClick={() => setShowAddNote(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-900 text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Note
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setMonth(subMonths(month, 1))} className="p-2 rounded-lg hover:bg-slate-700 text-slate-400">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold text-white">{format(month, 'MMMM yyyy')}</h2>
            <button onClick={() => setMonth(addMonths(month, 1))} className="p-2 rounded-lg hover:bg-slate-700 text-slate-400">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="text-center text-xs font-medium text-slate-500 py-2">{d}</div>
            ))}
          </div>

          {/* Calendar cells */}
          {grid.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 gap-1">
              {week.map((day, di) => {
                if (!day) return <div key={di} className="aspect-square" />;
                const dateStr = format(day, 'yyyy-MM-dd');
                const isSelected = dateStr === selectedDate;
                const isToday = isSameDay(day, new Date());
                const items = getDateItems(dateStr);
                const hasLogs = items.logs.length > 0;
                const hasNotes = items.notes.length > 0;

                return (
                  <button
                    key={di}
                    onClick={() => setSelectedDate(dateStr)}
                    className={`aspect-square p-1 rounded-lg flex flex-col items-start transition-colors relative ${
                      isSelected ? 'bg-amber-500/20 border-2 border-amber-500/50'
                      : isToday ? 'bg-slate-700/50 border border-slate-600'
                      : 'hover:bg-slate-700/30 border border-transparent'
                    }`}
                  >
                    <span className={`text-xs font-medium ${isSelected ? 'text-amber-400' : isToday ? 'text-white' : 'text-slate-300'}`}>
                      {day.getDate()}
                    </span>
                    <div className="flex gap-0.5 mt-auto flex-wrap">
                      {hasLogs && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                      {items.notes.slice(0, 3).map((n, ni) => (
                        <span key={ni} className={`w-1.5 h-1.5 rounded-full ${noteTypeColor[n.note_type] || 'bg-blue-500'}`} />
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          ))}

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-slate-700/50">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-amber-400" /> Jobs
            </div>
            {NOTE_TYPES.map(t => (
              <div key={t.value} className="flex items-center gap-1.5 text-xs text-slate-400">
                <span className={`w-2 h-2 rounded-full ${t.color}`} /> {t.label}
              </div>
            ))}
          </div>
        </div>

        {/* Selected Date Panel */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 overflow-y-auto max-h-[700px]">
          <h3 className="text-sm font-bold text-white mb-3">
            {format(parseISO(selectedDate), 'EEEE, dd MMMM yyyy')}
          </h3>

          {/* Jobs for this date */}
          {selectedItems.logs.length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-slate-400 uppercase mb-2">Jobs</h4>
              <div className="space-y-2">
                {selectedItems.logs.map(log => (
                  <button
                    key={log.id}
                    onClick={() => onNavigate('daily-logs', { logId: log.id })}
                    className="w-full text-left p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 hover:border-amber-500/40 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-amber-400">#{log.project?.job_number || '—'}</span>
                      <PriorityBadge priority={log.priority} size="sm" showIcon={false} />
                    </div>
                    <p className="text-sm font-medium text-white mt-1">{log.project?.name || 'Unknown'}</p>
                    {log.weather && <p className="text-xs text-slate-400 mt-1">{log.weather} {log.temperature}</p>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Notes for this date */}
          {selectedItems.notes.length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-slate-400 uppercase mb-2">Notes & Reminders</h4>
              <div className="space-y-2">
                {selectedItems.notes.map(note => {
                  const NoteIcon = noteTypeIcon[note.note_type] || StickyNote;
                  return (
                    <div
                      key={note.id}
                      className={`p-3 rounded-lg border transition-colors ${
                        note.is_completed ? 'bg-slate-800/30 border-slate-700/30 opacity-60' : 'bg-slate-700/30 border-slate-600/50'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <input
                          type="checkbox"
                          checked={note.is_completed}
                          onChange={e => handleToggleNote(note.id, e.target.checked)}
                          className="w-4 h-4 mt-0.5 rounded border-slate-500 bg-slate-700 text-amber-500"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <NoteIcon className="w-3.5 h-3.5 text-slate-400" />
                            <span className={`text-sm font-medium ${note.is_completed ? 'line-through text-slate-500' : 'text-white'}`}>
                              {note.title}
                            </span>
                          </div>
                          {note.description && (
                            <p className="text-xs text-slate-400 mt-1">{note.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <PriorityBadge priority={note.priority} size="sm" showIcon={false} />
                            <span className="text-[10px] text-slate-500 capitalize">{note.note_type}</span>
                          </div>
                        </div>
                        <button onClick={() => handleDeleteNote(note.id)} className="p-1 rounded hover:bg-red-500/20 text-red-400">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {selectedItems.logs.length === 0 && selectedItems.notes.length === 0 && (
            <div className="text-center py-8">
              <CalIcon className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-400">Nothing scheduled</p>
              <button onClick={() => setShowAddNote(true)} className="mt-2 text-xs text-amber-400 hover:text-amber-300">
                Add a note or reminder
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add Note Dialog */}
      {showAddNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowAddNote(false)}>
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h2 className="text-lg font-bold text-white">Add Note</h2>
              <button onClick={() => setShowAddNote(false)} className="p-1 rounded-lg hover:bg-slate-700 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className={labelCls}>Date</label>
                <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Title *</label>
                <input value={noteForm.title} onChange={e => setNoteForm({ ...noteForm, title: e.target.value })} className={inputCls} placeholder="e.g. Order plasterboard" />
              </div>
              <div>
                <label className={labelCls}>Description</label>
                <textarea value={noteForm.description} onChange={e => setNoteForm({ ...noteForm, description: e.target.value })} rows={2} className={`${inputCls} resize-none`} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Type</label>
                  <select value={noteForm.note_type} onChange={e => setNoteForm({ ...noteForm, note_type: e.target.value })} className={inputCls}>
                    {NOTE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Priority</label>
                  <select value={noteForm.priority} onChange={e => setNoteForm({ ...noteForm, priority: e.target.value })} className={inputCls}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div>
                <label className={labelCls}>Link to Project (optional)</label>
                <select value={noteForm.project_id} onChange={e => setNoteForm({ ...noteForm, project_id: e.target.value })} className={inputCls}>
                  <option value="">None (General)</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowAddNote(false)} className="flex-1 py-2.5 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 text-sm font-medium">Cancel</button>
                <button onClick={handleAddNote} disabled={!noteForm.title.trim()} className="flex-1 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-900 text-sm font-bold disabled:opacity-50">Add Note</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarPage;
