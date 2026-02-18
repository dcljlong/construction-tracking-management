import React, { useEffect, useState, useMemo } from 'react';
import {
  HardHat, Users, Package, AlertTriangle, Clock, CheckCircle2,
  Plus, ArrowRight, Briefcase, Shield, TrendingUp, Activity,
  Wrench, UserCheck, Truck, Eye, ClipboardList
} from 'lucide-react';

import type { Project, DailyLog } from '@/lib/sitecommand-types';
import { calculatePriority, getPriorityDot, formatDate, todayStr } from '@/lib/sitecommand-utils';
import { fetchProjects, fetchDailyLogs, fetchDashboardStats, fetchAllIncompleteItems } from '@/lib/sitecommand-store';
import PriorityBadge from './PriorityBadge';

interface DashboardPageProps {
  onNavigate: (page: string, data?: any) => void;
  onQuickAdd: () => void;
}

interface Stats {
  activeProjects: number;
  totalLogs: number;
  highPriorityLogs: number;
  safetyIncidents: number;
  overdueActivities: number;
  overdueMaterials: number;
  pendingMaterials: number;
  totalOverdue: number;
}

interface IncompleteItems {
  activities: any[];
  materials: any[];
  equipment: any[];
  crew: any[];
}

const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate, onQuickAdd }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [todayLogs, setTodayLogs] = useState<DailyLog[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [incomplete, setIncomplete] = useState<IncompleteItems | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [p, tl, s, inc] = await Promise.all([
        fetchProjects(),
        fetchDailyLogs({ date: todayStr() }),
        fetchDashboardStats(),
        fetchAllIncompleteItems(),
      ]);
      setProjects(p);
      setTodayLogs(tl);
      setStats(s);
      setIncomplete(inc);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const allIncompleteFlat = useMemo(() => {
    if (!incomplete) return [];
    const items: any[] = [];
    incomplete.activities.forEach(a => items.push({
      ...a, _type: 'activity', _dueDate: a.due_date,
      _project: a.daily_logs?.projects?.name || 'Unknown',
      _jobNumber: a.daily_logs?.projects?.job_number || '',
    }));
    incomplete.materials.forEach(m => items.push({
      ...m, _type: 'material', _dueDate: m.required_date,
      _project: m.daily_logs?.projects?.name || 'Unknown',
      _jobNumber: m.daily_logs?.projects?.job_number || '',
    }));
    incomplete.equipment.forEach(e => items.push({
      ...e, _type: 'equipment', _dueDate: e.due_date,
      _project: e.daily_logs?.projects?.name || 'Unknown',
      _jobNumber: e.daily_logs?.projects?.job_number || '',
    }));
    incomplete.crew.forEach(c => items.push({
      ...c, _type: 'crew', _dueDate: c.due_date,
      _project: c.daily_logs?.projects?.name || 'Unknown',
      _jobNumber: c.daily_logs?.projects?.job_number || '',
    }));

    return items
      .map(i => ({ ...i, _priority: calculatePriority(i._dueDate) }))
      .filter(i => priorityFilter === 'all' || i._priority === priorityFilter)
      .sort((a, b) => {
        const order = { high: 0, medium: 1, low: 2 };
        return order[a._priority] - order[b._priority];
      });
  }, [incomplete, priorityFilter]);

  const statCards = stats ? [
    { label: 'Active Projects', value: stats.activeProjects, icon: Briefcase, color: 'from-blue-500 to-blue-600', textColor: 'text-blue-400' },
    { label: 'High Priority', value: stats.highPriorityLogs, icon: AlertTriangle, color: 'from-red-500 to-red-600', textColor: 'text-red-400' },
    { label: 'Overdue Items', value: stats.totalOverdue, icon: Clock, color: 'from-amber-500 to-orange-500', textColor: 'text-amber-400' },
    { label: 'Pending Materials', value: stats.pendingMaterials, icon: Package, color: 'from-purple-500 to-purple-600', textColor: 'text-purple-400' },
    { label: 'Safety Incidents', value: stats.safetyIncidents, icon: Shield, color: 'from-emerald-500 to-emerald-600', textColor: 'text-emerald-400' },
    { label: 'Total Logs', value: stats.totalLogs, icon: ClipboardList, color: 'from-indigo-500 to-indigo-600', textColor: 'text-indigo-400' },
  ] : [];

  const quickActions = [
    { label: 'Work Activity', icon: Activity, color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', action: () => onNavigate('daily-logs', { tab: 'activities' }) },
    { label: 'Materials', icon: Package, color: 'bg-purple-500/10 text-purple-400 border-purple-500/20', action: () => onNavigate('daily-logs', { tab: 'materials' }) },
    { label: 'Equipment', icon: Wrench, color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', action: () => onNavigate('daily-logs', { tab: 'equipment' }) },
    { label: 'Crew', icon: UserCheck, color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', action: () => onNavigate('daily-logs', { tab: 'crew' }) },
    { label: 'Visitor', icon: Eye, color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20', action: () => onNavigate('daily-logs', { tab: 'visitors' }) },
    { label: 'Delivery', icon: Truck, color: 'bg-rose-500/10 text-rose-400 border-rose-500/20', action: () => onNavigate('calendar', { type: 'delivery' }) },
  ];

  const typeIcons: Record<string, React.ElementType> = {
    activity: Activity,
    material: Package,
    equipment: Wrench,
    crew: UserCheck,
  };

  const typeLabels: Record<string, string> = {
    activity: 'Activity',
    material: 'Material',
    equipment: 'Equipment',
    crew: 'Crew',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Command Center</h1>
          <p className="text-slate-400 text-sm mt-1">{formatDate(todayStr())} — {todayLogs.length} job{todayLogs.length !== 1 ? 's' : ''} logged today</p>
        </div>
        <button
          onClick={onQuickAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Job
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 hover:border-slate-600/50 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="text-2xl font-bold text-white">{s.value}</div>
              <div className="text-xs text-slate-400 mt-0.5">{s.label}</div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">Quick Add</h2>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {quickActions.map((a, i) => {
            const Icon = a.icon;
            return (
              <button
                key={i}
                onClick={a.action}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border ${a.color} hover:scale-105 transition-transform`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{a.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Projects */}
        <div className="lg:col-span-1">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Active Projects</h2>
            <button onClick={() => onNavigate('daily-logs')} className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {projects.filter(p => p.status === 'active').length === 0 ? (
              <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-6 text-center">
                <HardHat className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No active projects</p>
                <button onClick={onQuickAdd} className="mt-2 text-xs text-amber-400 hover:text-amber-300">
                  Create your first job
                </button>
              </div>
            ) : (
              projects.filter(p => p.status === 'active').map(p => {
                const projectLogs = todayLogs.filter(l => l.project_id === p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => onNavigate('daily-logs', { project_id: p.id })}
                    className="w-full text-left bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 hover:border-amber-500/30 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                            {p.job_number || '#'}
                          </span>
                        </div>
                        <h3 className="text-sm font-semibold text-white mt-1 truncate">{p.name}</h3>
                        <p className="text-xs text-slate-400 truncate">{p.location || p.client || 'No location'}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 ml-2">
                        {projectLogs.length > 0 && (
                          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded-full border border-emerald-500/20">
                            Logged today
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Priority Items Feed */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Priority Items</h2>
            <div className="flex gap-1">
              {(['all', 'high', 'medium', 'low'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setPriorityFilter(f)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    priorityFilter === f
                      ? f === 'high' ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : f === 'medium' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : f === 'low' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-700 text-white border border-slate-600'
                      : 'text-slate-400 hover:text-slate-300 border border-transparent'
                  }`}
                >
                  {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                  {f !== 'all' && incomplete && (
                    <span className="ml-1">
                      ({[...incomplete.activities, ...incomplete.materials, ...incomplete.equipment, ...incomplete.crew]
                        .filter(i => calculatePriority(i.due_date || i.required_date) === f).length})
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {allIncompleteFlat.length === 0 ? (
              <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-8 text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                <p className="text-sm text-slate-300 font-medium">All clear!</p>
                <p className="text-xs text-slate-500 mt-1">No outstanding items to show</p>
              </div>
            ) : (
              allIncompleteFlat.slice(0, 20).map((item, i) => {
                const TypeIcon = typeIcons[item._type] || Activity;
                return (
                  <div
                    key={`${item._type}-${item.id}-${i}`}
                    className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 hover:border-slate-600/50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${getPriorityDot(item._priority)}`} />
                      <TypeIcon className="w-4 h-4 text-slate-500 mt-1 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-white truncate">
                            {item.description || item.equipment_name || item.worker_name || 'Unnamed'}
                          </span>
                          <PriorityBadge priority={item._priority} size="sm" showIcon={false} />
                          <span className="text-[10px] text-slate-500 bg-slate-700/50 px-1.5 py-0.5 rounded">
                            {typeLabels[item._type]}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                          <span>{item._project}</span>
                          {item._jobNumber && <span className="font-mono text-amber-400/60">#{item._jobNumber}</span>}
                          {item._dueDate && <span>Due: {formatDate(item._dueDate)}</span>}
                        </div>
                        {item.notes && (
                          <p className="text-xs text-slate-500 mt-1 truncate">{item.notes}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Today's Jobs */}
      {todayLogs.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">Today's Jobs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {todayLogs.map(log => (
              <button
                key={log.id}
                onClick={() => onNavigate('daily-logs', { logId: log.id })}
                className="text-left bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 hover:border-amber-500/30 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                    {log.project?.job_number || '#'}
                  </span>
                  <PriorityBadge priority={log.priority} size="sm" />
                </div>
                <h3 className="text-sm font-semibold text-white">{log.project?.name || 'Unknown Project'}</h3>
                <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                  {log.weather && <span>{log.weather}</span>}
                  {log.temperature && <span>{log.temperature}</span>}
                </div>
                {log.critical_items && (
                  <div className="mt-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                    <p className="text-xs text-red-400 line-clamp-2">{log.critical_items}</p>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;

