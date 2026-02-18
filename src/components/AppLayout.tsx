import React, { useState, useCallback, useEffect } from 'react';
import { Menu, X, LogIn, LogOut, User, ChevronDown, Shield, HardHat, AlertCircle } from 'lucide-react';
import type { PageKey, UserRole } from '@/lib/sitecommand-types';
import { ROLE_ACCESS, USER_ROLES } from '@/lib/sitecommand-types';
import { useAuth } from '@/lib/auth';
import Sidebar from './sc/Sidebar';
import DashboardPage from './sc/DashboardPage';
import DailyLogsPage from './sc/DailyLogsPage';
import CalendarPage from './sc/CalendarPage';
import TimesheetPage from './sc/TimesheetPage';
import ReportsPage from './sc/ReportsPage';
import SettingsPage from './sc/SettingsPage';
import JobFormDialog from './sc/JobFormDialog';
import AuthModal from './sc/AuthModal';
import { fetchDashboardStats } from '@/lib/sitecommand-store';

const roleIcons: Record<UserRole, React.ElementType> = {
  site_manager: Shield,
  foreman: HardHat,
  safety_officer: AlertCircle,
};

const AppLayout: React.FC = () => {
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const [currentPage, setCurrentPage] = useState<PageKey>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showJobDialog, setShowJobDialog] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [pageData, setPageData] = useState<any>(null);
  const [overdueBadge, setOverdueBadge] = useState(0);

  const userRole = (profile?.role as UserRole) || null;

  // Load overdue count for sidebar badge
  useEffect(() => {
    fetchDashboardStats().then(s => setOverdueBadge(s.totalOverdue)).catch(() => {});
  }, [currentPage]);

  // Close user menu when clicking outside
  useEffect(() => {
    if (!showUserMenu) return;
    const handler = (e: MouseEvent) => setShowUserMenu(false);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [showUserMenu]);

  const handleNavigate = useCallback((page: string, data?: any) => {
    const p = page as PageKey;
    // Check role access
    if (userRole && !ROLE_ACCESS[userRole].includes(p)) return;
    setCurrentPage(p);
    setPageData(data || null);
    setMobileMenuOpen(false);
  }, [userRole]);

  const handleJobCreated = useCallback((logId: string) => {
    setShowJobDialog(false);
    setCurrentPage('daily-logs');
    setPageData({ logId });
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setShowUserMenu(false);
    setCurrentPage('dashboard');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage onNavigate={handleNavigate} onQuickAdd={() => setShowJobDialog(true)} />;
      case 'daily-logs':
        return <DailyLogsPage initialData={pageData} />;
      case 'calendar':
        return <CalendarPage onNavigate={handleNavigate} initialData={pageData} />;
      case 'timesheets':
        return <TimesheetPage />;
      case 'reports':
        return <ReportsPage onNavigate={handleNavigate} />;
      case 'settings':
        return <SettingsPage userRole={userRole} />;
      default:
        return <DashboardPage onNavigate={handleNavigate} onQuickAdd={() => setShowJobDialog(true)} />;
    }
  };

  // Get display name
  const displayName = profile?.full_name || user?.email?.split('@')[0] || '';
  const displayEmail = user?.email || '';
  const RoleIcon = userRole ? roleIcons[userRole] : User;
  const roleLabel = userRole ? USER_ROLES.find(r => r.value === userRole)?.label || '' : '';

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Sidebar - hidden on mobile unless menu open */}
      <div className="hidden lg:block">
        <Sidebar
          currentPage={currentPage}
          onNavigate={(page) => { handleNavigate(page); }}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          onQuickAdd={() => setShowJobDialog(true)}
          stats={{ overdue: overdueBadge, highPriority: 0 }}
          userRole={userRole}
        />
      </div>

      {/* Mobile sidebar */}
      <div className={`lg:hidden fixed inset-y-0 left-0 z-40 transition-transform duration-300 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar
          currentPage={currentPage}
          onNavigate={(page) => { handleNavigate(page); }}
          collapsed={false}
          onToggle={() => setMobileMenuOpen(false)}
          onQuickAdd={() => { setShowJobDialog(true); setMobileMenuOpen(false); }}
          stats={{ overdue: overdueBadge, highPriority: 0 }}
          userRole={userRole}
        />
      </div>

      <main
        className={`transition-all duration-300 min-h-screen ${
          sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-60'
        }`}
      >
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50 px-4 lg:px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-slate-800 text-slate-400"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              <h2 className="text-sm font-semibold text-slate-300 capitalize">
                {currentPage.replace('-', ' ')}
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 hidden sm:inline">
                {new Date().toLocaleDateString('en-NZ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </span>

              {/* Auth section */}
              {authLoading ? (
                <div className="w-8 h-8 rounded-full bg-slate-700 animate-pulse" />
              ) : user ? (
                /* Logged in - User menu */
                <div className="relative">
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowUserMenu(!showUserMenu); }}
                    className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/50 hover:border-slate-600 transition-all"
                  >
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                      <span className="text-xs font-bold text-slate-900">
                        {displayName.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div className="hidden sm:block text-left">
                      <p className="text-xs font-medium text-white leading-none">{displayName}</p>
                      <p className="text-[10px] text-slate-400 leading-none mt-0.5">{roleLabel}</p>
                    </div>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </button>

                  {/* Dropdown */}
                  {showUserMenu && (
                    <div
                      className="absolute right-0 top-full mt-2 w-64 bg-slate-800 border border-slate-700/50 rounded-xl shadow-2xl overflow-hidden"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* User info */}
                      <div className="px-4 py-3 border-b border-slate-700/50">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                            <span className="text-sm font-bold text-slate-900">
                              {displayName.charAt(0).toUpperCase() || 'U'}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{displayName}</p>
                            <p className="text-xs text-slate-400 truncate">{displayEmail}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 mt-2 px-2 py-1 rounded-lg bg-slate-700/50 w-fit">
                          <RoleIcon className="w-3 h-3 text-amber-400" />
                          <span className="text-[10px] font-medium text-amber-400">{roleLabel}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="p-1.5">
                        <button
                          onClick={() => { setShowUserMenu(false); handleNavigate('settings'); }}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-700/50 hover:text-white transition-colors"
                        >
                          <User className="w-4 h-4" />
                          <span>Profile & Settings</span>
                        </button>
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Not logged in - Sign In button */
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-900 font-semibold text-xs transition-all shadow-lg shadow-amber-500/20"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="p-4 lg:p-6">
          {renderPage()}
        </div>
      </main>

      {/* Job Creation Dialog */}
      <JobFormDialog
        open={showJobDialog}
        onClose={() => setShowJobDialog(false)}
        onCreated={handleJobCreated}
      />

      {/* Auth Modal */}
      <AuthModal
        open={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
};

export default AppLayout;
