import React, { useEffect, useState, useMemo } from 'react';
import {
  Search, Filter, Download, Calendar, BarChart3, TrendingUp,
  Users, Package, Activity, AlertTriangle, CheckCircle2
} from 'lucide-react';
import { format, parseISO, subDays } from 'date-fns';
import type { Project, DailyLog } from '@/lib/sitecommand-types';
import { calculatePriority, formatDate, getPriorityDot } from '@/lib/sitecommand-utils';
import PriorityBadge from './PriorityBadge';
import * as store from '@/lib/sitecommand-store';

interface ReportsPageProps {
  onNavigate: (page: string, data?: any) => void;
}

const ReportsPage: React.FC<ReportsPageProps> = ({ onNavigate }) => {
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [projectFilter, setProjectFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [l, p] = await Promise.all([
        store.fetchDailyLogs(),
        store.fetchProjects(),
      ]);
      setLogs(l);
      setProjects(p);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const filteredLogs = useMemo(() => {
    return logs.filter(l => {
      if (l.log_date < dateFrom || l.log_date > dateTo) return false;
      if (projectFilter !== 'all' && l.project_id !== projectFilter) return false;
      if (priorityFilter !== 'all' && l.priority !== priorityFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const match = (l.project?.name || '').toLowerCase().includes(q) ||
          (l.project?.job_number || '').toLowerCase().includes(q) ||
          (l.notes || '').toLowerCase().includes(q) ||
          (l.weather || '').toLowerCase().includes(q) ||
          (l.critical_items || '').toLowerCase().includes(q) ||
          (l.safety_incidents || '').toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [logs, dateFrom, dateTo, projectFilter, priorityFilter, searchQuery]);

  // Summary stats
  const summary = useMemo(() => {
    const total = filteredLogs.length;
    const high = filteredLogs.filter(l => l.priority === 'high').length;
    const medium = filteredLogs.filter(l => l.priority === 'medium').length;
    const low = filteredLogs.filter(l => l.priority === 'low').length;
    const withSafety = filteredLogs.filter(l => l.safety_incidents && l.safety_incidents.trim()).length;
    const withCritical = filteredLogs.filter(l => l.critical_items && l.critical_items.trim()).length;
    const uniqueProjects = new Set(filteredLogs.map(l => l.project_id)).size;
    return { total, high, medium, low, withSafety, withCritical, uniqueProjects };
  }, [filteredLogs]);

  const inputCls = 'px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm focus:outline-none focus:border-amber-500';

  if (loading) {
    return <div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-400" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Reports</h1>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium hover:bg-blue-500/20 transition-colors">
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      {/* Filters */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className={`w-full pl-9 ${inputCls}`}
              placeholder="Search logs, projects, notes..."
            />
          </div>
          <div>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className={`w-full ${inputCls}`} />
          </div>
          <div>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className={`w-full ${inputCls}`} />
          </div>
          <div className="flex gap-2">
            <select value={projectFilter} onChange={e => setProjectFilter(e.target.value)} className={`flex-1 ${inputCls}`}>
              <option value="all">All Projects</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} className={inputCls}>
              <option value="all">All</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          { label: 'Total Logs', value: summary.total, icon: BarChart3, color: 'text-blue-400' },
          { label: 'Projects', value: summary.uniqueProjects, icon: TrendingUp, color: 'text-indigo-400' },
          { label: 'High Priority', value: summary.high, icon: AlertTriangle, color: 'text-red-400' },
          { label: 'Medium', value: summary.medium, icon: Activity, color: 'text-amber-400' },
          { label: 'Low', value: summary.low, icon: CheckCircle2, color: 'text-emerald-400' },
          { label: 'Safety Issues', value: summary.withSafety, icon: AlertTriangle, color: 'text-orange-400' },
          { label: 'Critical Items', value: summary.withCritical, icon: Package, color: 'text-purple-400' },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 text-center">
              <Icon className={`w-5 h-5 mx-auto mb-1 ${s.color}`} />
              <div className="text-xl font-bold text-white">{s.value}</div>
              <div className="text-[10px] text-slate-400">{s.label}</div>
            </div>
          );
        })}
      </div>

      {/* Logs Table */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="py-3 px-4 text-xs font-semibold text-slate-400">Date</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-400">Project</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-400">Job #</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-400">Weather</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-400">Priority</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-400">Safety</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-400">Critical</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-400">Notes</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-sm text-slate-500">
                    No logs found matching your filters
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr
                    key={log.id}
                    onClick={() => onNavigate('daily-logs', { logId: log.id })}
                    className="border-b border-slate-700/20 hover:bg-slate-700/20 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 text-xs text-white font-medium">{formatDate(log.log_date)}</td>
                    <td className="py-3 px-4 text-xs text-slate-300">{log.project?.name || '—'}</td>
                    <td className="py-3 px-4">
                      <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                        {log.project?.job_number || '—'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-400">{log.weather || '—'} {log.temperature}</td>
                    <td className="py-3 px-4"><PriorityBadge priority={log.priority} size="sm" showIcon={false} /></td>
                    <td className="py-3 px-4 text-xs text-slate-400 max-w-[120px] truncate">{log.safety_incidents || '—'}</td>
                    <td className="py-3 px-4 text-xs text-slate-400 max-w-[120px] truncate">{log.critical_items || '—'}</td>
                    <td className="py-3 px-4 text-xs text-slate-400 max-w-[150px] truncate">{log.notes || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
