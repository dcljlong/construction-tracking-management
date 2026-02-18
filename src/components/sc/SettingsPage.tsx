import React, { useEffect, useState } from 'react';
import {
  Settings, Save, Check, BarChart3, Cloud, Users, ClipboardCheck,
  FileText, RefreshCw, Brain, Bell, Building2, Clock, Shield, HardHat, AlertCircle, User
} from 'lucide-react';
import type { AppSettings, UserRole } from '@/lib/sitecommand-types';
import { DEFAULT_SETTINGS, USER_ROLES } from '@/lib/sitecommand-types';
import { fetchSettings, saveSettings } from '@/lib/sitecommand-store';
import { useAuth } from '@/lib/auth';

const inputCls = 'w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm focus:outline-none focus:border-amber-500';
const labelCls = 'block text-xs font-medium text-slate-400 mb-1';

const roleIcons: Record<string, React.ElementType> = {
  site_manager: Shield,
  foreman: HardHat,
  safety_officer: AlertCircle,
};

const SettingsPage: React.FC<{ userRole?: UserRole | null }> = ({ userRole }) => {
  const { user, profile, updateProfile } = useAuth();
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profileName, setProfileName] = useState('');
  const [profileRole, setProfileRole] = useState<UserRole>('foreman');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  useEffect(() => {
    fetchSettings().then(s => { setSettings(s); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (profile) {
      setProfileName(profile.full_name);
      setProfileRole(profile.role);
    }
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error(e);
      alert('Failed to save settings');
    }
    setSaving(false);
  };

  const handleProfileSave = async () => {
    setProfileSaving(true);
    try {
      await updateProfile({ full_name: profileName, role: profileRole });
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2000);
    } catch (e) {
      console.error(e);
    }
    setProfileSaving(false);
  };

  const updateFeature = (key: keyof AppSettings['features'], value: boolean) => {
    setSettings(prev => ({
      ...prev,
      features: { ...prev.features, [key]: value },
    }));
  };

  const featureToggles: { key: keyof AppSettings['features']; label: string; description: string; icon: React.ElementType }[] = [
    { key: 'analytics', label: 'Analytics & Insights', description: 'Track crew productivity, project health, and trends', icon: BarChart3 },
    { key: 'weatherAlerts', label: 'Weather Alerts', description: 'Get weather forecasts and site impact warnings', icon: Cloud },
    { key: 'teamCollaboration', label: 'Team Collaboration', description: 'Comments, mentions, and team notes on logs', icon: Users },
    { key: 'approvalWorkflow', label: 'Approval Workflow', description: 'Require manager sign-off on daily logs', icon: ClipboardCheck },
    { key: 'customReports', label: 'Custom Reports', description: 'Build custom report templates and formats', icon: FileText },
    { key: 'autoCarryForward', label: 'Auto Carry Forward', description: 'Automatically move incomplete items to next day', icon: RefreshCw },
    { key: 'aiSummary', label: 'AI Daily Summary', description: 'Get AI-powered morning briefings across all jobs', icon: Brain },
    { key: 'notifications', label: 'Smart Notifications', description: 'Automated alerts for overdue items and reminders', icon: Bell },
  ];

  if (loading) {
    return <div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-400" /></div>;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-slate-400 text-sm mt-1">Configure your SiteCommand preferences</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
            saved ? 'bg-emerald-500 text-white' : 'bg-amber-500 hover:bg-amber-400 text-slate-900'
          } disabled:opacity-50`}
        >
          {saved ? <><Check className="w-4 h-4" /> Saved</> : saving ? 'Saving...' : <><Save className="w-4 h-4" /> Save Settings</>}
        </button>
      </div>

      {/* User Profile Section */}
      {user && (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-amber-400" />
            <h2 className="text-sm font-bold text-white">Your Profile</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className={labelCls}>Full Name</label>
              <input
                value={profileName}
                onChange={e => setProfileName(e.target.value)}
                className={inputCls}
                placeholder="Your full name"
              />
            </div>
            <div>
              <label className={labelCls}>Email</label>
              <input
                value={user.email || ''}
                disabled
                className={`${inputCls} opacity-60 cursor-not-allowed`}
              />
            </div>
          </div>

          {/* Role Selector */}
          <div className="mb-4">
            <label className={labelCls}>Your Role</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {USER_ROLES.map(r => {
                const Icon = roleIcons[r.value] || User;
                const selected = profileRole === r.value;
                return (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setProfileRole(r.value)}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                      selected
                        ? 'bg-amber-500/10 border-amber-500/50'
                        : 'bg-slate-700/40 border-slate-600/50 hover:border-slate-500'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      selected ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700 text-slate-400'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${selected ? 'text-amber-400' : 'text-slate-300'}`}>{r.label}</p>
                      <p className="text-[10px] text-slate-500 leading-tight">{r.description.split(',')[0]}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={handleProfileSave}
            disabled={profileSaving}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
              profileSaved ? 'bg-emerald-500 text-white' : 'bg-amber-500 hover:bg-amber-400 text-slate-900'
            } disabled:opacity-50`}
          >
            {profileSaved ? <><Check className="w-3 h-3" /> Profile Saved</> : profileSaving ? 'Saving...' : <><Save className="w-3 h-3" /> Update Profile</>}
          </button>
        </div>
      )}

      {/* Not logged in notice */}
      {!user && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-center gap-3">
          <Shield className="w-5 h-5 text-amber-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-400">Sign in to manage your profile</p>
            <p className="text-xs text-slate-400">Create an account to save your settings and access role-based features.</p>
          </div>
        </div>
      )}

      {/* Company Settings */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="w-5 h-5 text-amber-400" />
          <h2 className="text-sm font-bold text-white">Company Details</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Company Name</label>
            <input
              value={settings.companyName}
              onChange={e => setSettings({ ...settings, companyName: e.target.value })}
              className={inputCls}
              placeholder="e.g. Long Line Builders"
            />
          </div>
          <div>
            <label className={labelCls}>Company Logo URL</label>
            <input
              value={settings.companyLogo}
              onChange={e => setSettings({ ...settings, companyLogo: e.target.value })}
              className={inputCls}
              placeholder="https://example.com/logo.png"
            />
            <p className="text-[10px] text-slate-500 mt-1">Used on PDF/Excel exports</p>
          </div>
        </div>
      </div>

      {/* Timesheet Settings */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-amber-400" />
          <h2 className="text-sm font-bold text-white">Timesheet Configuration</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Timesheet Period</label>
            <div className="flex gap-2">
              {([1, 2] as const).map(p => (
                <button key={p} onClick={() => setSettings({ ...settings, timesheetPeriod: p })}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    settings.timesheetPeriod === p ? 'bg-amber-500 text-slate-900' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}>{p} Week{p > 1 ? 's' : ''}</button>
              ))}
            </div>
          </div>
          <div>
            <label className={labelCls}>Week Ending Day</label>
            <select value={settings.weekEndingDay} onChange={e => setSettings({ ...settings, weekEndingDay: e.target.value as any })} className={inputCls}>
              {['Sunday', 'Saturday', 'Friday', 'Thursday', 'Wednesday', 'Tuesday', 'Monday'].map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Default Lunch</label>
            <div className="flex gap-2">
              {([30, 60] as const).map(m => (
                <button key={m} onClick={() => setSettings({ ...settings, lunchDefaultMinutes: m })}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    settings.lunchDefaultMinutes === m ? 'bg-amber-500 text-slate-900' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}>{m} min</button>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-4">
          <label className={labelCls}>Rounding (minutes)</label>
          <div className="flex gap-2">
            {[5, 10, 15, 30].map(r => (
              <button key={r} onClick={() => setSettings({ ...settings, roundingMinutes: r })}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  settings.roundingMinutes === r ? 'bg-amber-500 text-slate-900' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}>{r} min</button>
            ))}
          </div>
        </div>
      </div>

      {/* Feature Toggles */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-5 h-5 text-amber-400" />
          <h2 className="text-sm font-bold text-white">Features</h2>
          <span className="text-[10px] text-slate-500 ml-2">Toggle features on/off</span>
        </div>
        <div className="space-y-3">
          {featureToggles.map(ft => {
            const Icon = ft.icon;
            const enabled = settings.features[ft.key];
            return (
              <div key={ft.key} className={`flex items-center gap-4 p-3 rounded-xl border transition-colors ${
                enabled ? 'bg-slate-700/30 border-slate-600/50' : 'bg-slate-800/30 border-slate-700/30 opacity-60'
              }`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  enabled ? 'bg-amber-500/15 text-amber-400' : 'bg-slate-700 text-slate-500'
                }`}><Icon className="w-5 h-5" /></div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-white">{ft.label}</h3>
                  <p className="text-xs text-slate-400">{ft.description}</p>
                </div>
                <button onClick={() => updateFeature(ft.key, !enabled)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${enabled ? 'bg-amber-500' : 'bg-slate-600'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Role Access Info */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
        <h2 className="text-sm font-bold text-white mb-3">Role Access Levels</h2>
        <p className="text-xs text-slate-400 mb-3">Each role has different access to features:</p>
        <div className="space-y-2">
          {USER_ROLES.map(r => {
            const Icon = roleIcons[r.value] || User;
            const isCurrent = userRole === r.value;
            return (
              <div key={r.value} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                isCurrent ? 'bg-amber-500/10 border-amber-500/20' : 'bg-slate-700/20 border-slate-700/30'
              }`}>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  isCurrent ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700 text-slate-400'
                }`}><Icon className="w-4 h-4" /></div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold ${isCurrent ? 'text-amber-400' : 'text-white'}`}>{r.label}</span>
                    {isCurrent && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-medium">Current</span>}
                  </div>
                  <p className="text-xs text-slate-400">{r.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
