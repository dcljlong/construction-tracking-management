import React from 'react';
import {
  LayoutDashboard, ClipboardList, Calendar, Clock, BarChart3, Settings,
  HardHat, ChevronLeft, ChevronRight, Plus, Lock
} from 'lucide-react';
import type { PageKey, UserRole } from '@/lib/sitecommand-types';
import { ROLE_ACCESS } from '@/lib/sitecommand-types';

interface SidebarProps {
  currentPage: PageKey;
  onNavigate: (page: PageKey) => void;
  collapsed: boolean;
  onToggle: () => void;
  onQuickAdd?: () => void;
  stats?: { overdue: number; highPriority: number };
  userRole?: UserRole | null;
}

const NAV_ITEMS: { key: PageKey; label: string; icon: React.ElementType }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'daily-logs', label: 'Daily Logs', icon: ClipboardList },
  { key: 'calendar', label: 'Calendar', icon: Calendar },
  { key: 'timesheets', label: 'Timesheets', icon: Clock },
  { key: 'reports', label: 'Reports', icon: BarChart3 },
  { key: 'settings', label: 'Settings', icon: Settings },
];

const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate, collapsed, onToggle, onQuickAdd, stats, userRole }) => {
  const allowedPages = userRole ? ROLE_ACCESS[userRole] : NAV_ITEMS.map(i => i.key);

  return (
    <aside
      className={`fixed left-0 top-0 h-full z-40 flex flex-col bg-slate-900 border-r border-slate-700/50 transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-slate-700/50">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0">
          <HardHat className="w-5 h-5 text-slate-900" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-base font-bold text-white tracking-tight leading-none">SiteCommand</h1>
            <p className="text-[10px] text-slate-400 mt-0.5">Construction Diary</p>
          </div>
        )}
      </div>

      {/* Quick Add */}
      {onQuickAdd && (
        <div className="px-3 mt-4">
          <button
            onClick={onQuickAdd}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold text-sm transition-colors ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            <Plus className="w-4 h-4" />
            {!collapsed && <span>New Job</span>}
          </button>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 mt-4 px-2 space-y-1">
        {NAV_ITEMS.map(({ key, label, icon: Icon }) => {
          const isActive = currentPage === key;
          const showBadge = key === 'dashboard' && stats && stats.overdue > 0;
          const isLocked = !allowedPages.includes(key);
          return (
            <button
              key={key}
              onClick={() => !isLocked && onNavigate(key)}
              disabled={isLocked}
              title={isLocked ? `${label} requires a higher role` : label}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all relative ${
                isLocked
                  ? 'text-slate-600 cursor-not-allowed border border-transparent'
                  : isActive
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent'
              } ${collapsed ? 'justify-center' : ''}`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{label}</span>}
              {isLocked && !collapsed && <Lock className="w-3 h-3 ml-auto text-slate-600" />}
              {showBadge && !isLocked && (
                <span className={`${collapsed ? 'absolute -top-1 -right-1' : 'ml-auto'} bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1`}>
                  {stats.overdue}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="px-3 pb-4">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors text-sm"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <><ChevronLeft className="w-4 h-4" /><span>Collapse</span></>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
