import React, { useState } from 'react';
import {
  X, Mail, Lock, User, Shield, HardHat, Eye, EyeOff,
  AlertCircle, CheckCircle, Loader2
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import type { UserRole } from '@/lib/sitecommand-types';
import { USER_ROLES } from '@/lib/sitecommand-types';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

const inputCls = 'w-full pl-10 pr-4 py-3 rounded-xl bg-slate-700/80 border border-slate-600 text-white text-sm placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition-all';

const AuthModal: React.FC<AuthModalProps> = ({ open, onClose }) => {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('foreman');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFullName('');
    setRole('foreman');
    setError(null);
    setSuccess(null);
  };

  const switchMode = (m: 'signin' | 'signup') => {
    setMode(m);
    resetForm();
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) { setError('Please fill in all fields'); return; }
    setLoading(true);
    const { error: err } = await signIn(email, password);
    setLoading(false);
    if (err) { setError(err); return; }
    onClose();
    resetForm();
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password || !fullName) { setError('Please fill in all fields'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    setLoading(true);
    const { error: err } = await signUp(email, password, fullName, role);
    setLoading(false);
    if (err) { setError(err); return; }
    setSuccess('Account created! You can now sign in.');
    setTimeout(() => { switchMode('signin'); }, 1500);
  };

  if (!open) return null;

  const roleIcons: Record<UserRole, React.ElementType> = {
    site_manager: Shield,
    foreman: HardHat,
    safety_officer: AlertCircle,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-slate-800 border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header gradient */}
        <div className="relative bg-gradient-to-br from-amber-500/20 via-slate-800 to-slate-800 px-6 pt-6 pb-4">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Logo */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <HardHat className="w-5 h-5 text-slate-900" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">SiteCommand</h2>
              <p className="text-xs text-slate-400">Construction Management Platform</p>
            </div>
          </div>

          {/* Tab switcher */}
          <div className="flex bg-slate-700/50 rounded-xl p-1">
            <button
              onClick={() => switchMode('signin')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                mode === 'signin'
                  ? 'bg-amber-500 text-slate-900 shadow-lg shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => switchMode('signup')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                mode === 'signup'
                  ? 'bg-amber-500 text-slate-900 shadow-lg shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 pb-6 pt-2">
          {/* Error / Success messages */}
          {error && (
            <div className="flex items-center gap-2 p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 p-3 mb-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {mode === 'signin' ? (
            <form onSubmit={handleSignIn} className="space-y-4">
              {/* Email */}
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className={inputCls}
                  autoComplete="email"
                />
              </div>

              {/* Password */}
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className={`${inputCls} pr-10`}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-900 font-semibold text-sm transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-4">
              {/* Full Name */}
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Full name"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className={inputCls}
                  autoComplete="name"
                />
              </div>

              {/* Email */}
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className={inputCls}
                  autoComplete="email"
                />
              </div>

              {/* Role selector */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">Your Role</label>
                <div className="grid grid-cols-3 gap-2">
                  {USER_ROLES.map(r => {
                    const Icon = roleIcons[r.value];
                    const selected = role === r.value;
                    return (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setRole(r.value)}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all text-center ${
                          selected
                            ? 'bg-amber-500/10 border-amber-500/50 text-amber-400'
                            : 'bg-slate-700/40 border-slate-600/50 text-slate-400 hover:border-slate-500'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-xs font-medium leading-tight">{r.label}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-slate-500 mt-1.5">
                  {USER_ROLES.find(r => r.value === role)?.description}
                </p>
              </div>

              {/* Password */}
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password (min 6 characters)"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className={`${inputCls} pr-10`}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Confirm Password */}
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className={inputCls}
                  autoComplete="new-password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-900 font-semibold text-sm transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>
          )}

          {/* Footer */}
          <p className="text-center text-xs text-slate-500 mt-4">
            {mode === 'signin' ? (
              <>Don't have an account?{' '}
                <button onClick={() => switchMode('signup')} className="text-amber-400 hover:text-amber-300 font-medium">
                  Create one
                </button>
              </>
            ) : (
              <>Already have an account?{' '}
                <button onClick={() => switchMode('signin')} className="text-amber-400 hover:text-amber-300 font-medium">
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
