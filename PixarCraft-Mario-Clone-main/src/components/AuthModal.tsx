import React, { useState } from 'react';
import { X, Lock, Mail, UserPlus, LogIn, KeyRound, AlertCircle, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import { authService } from '../services/authService';
import type { User, GameSaveData } from '../types/save';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User, save: GameSaveData) => void;
  guestSave?: GameSaveData | null;
  initialMode?: 'login' | 'signup' | 'forgot';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  guestSave,
  initialMode = 'login'
}) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot' | 'reset'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetForm = () => {
    setError(null);
    setSuccessMessage(null);
    setPassword('');
    setConfirmPassword('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!email.trim() || !password) {
        throw new Error('אנא מלא את כל השדות.');
      }
      const res = await authService.login(email.trim(), password);
      onSuccess(res.user, res.save);
      onClose();
    } catch (err: any) {
      setError(err.message || 'שגיאה בהתחברות.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!email.trim() || !password || !confirmPassword) {
        throw new Error('אנא מלא את כל השדות.');
      }
      if (password.length < 6) {
        throw new Error('הסיסמה חייבת להכיל לפחות 6 תווים.');
      }
      if (password !== confirmPassword) {
        throw new Error('הסיסמאות אינן תואמות.');
      }

      const res = await authService.signUp(email.trim(), password, confirmPassword, guestSave);
      onSuccess(res.user, res.save);
      onClose();
    } catch (err: any) {
      setError(err.message || 'שגיאה ביצירת החשבון.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!email.trim()) {
        throw new Error('אנא הזן את כתובת האימייל שלך.');
      }
      const res = await authService.requestPasswordReset(email.trim());
      setSuccessMessage(res.message);
      // Firebase uses an email link instead of a code.
      // Do not transition to "reset" mode. Keep them here or tell them to check email.
    } catch (err: any) {
      setError(err.message || 'שגיאה בשליחת בקשת איפוס סיסמה.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!resetCode.trim() || !password || !confirmPassword) {
        throw new Error('אנא מלא את כל השדות.');
      }
      if (password.length < 6) {
        throw new Error('הסיסמה חייבת להכיל לפחות 6 תווים.');
      }
      if (password !== confirmPassword) {
        throw new Error('הסיסמאות אינן תואמות.');
      }

      const msg = await authService.resetPassword(email.trim(), resetCode.trim(), password, confirmPassword);
      setSuccessMessage(msg);
      setTimeout(() => {
        setMode('login');
        resetForm();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'שגיאה באיפוס הסיסמה.');
    } finally {
      setLoading(false);
    }
  };

  const hasGuestProgress = guestSave && (guestSave.currency > 0 || guestSave.unlockedWeapons.length > 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" dir="rtl">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-2xl p-6 relative overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Glow effect */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"
        >
          <X size={20} />
        </button>

        {/* Header Tabs */}
        <div className="flex items-center gap-2 mb-6 border-b border-zinc-800 pb-3">
          <button
            onClick={() => { setMode('login'); resetForm(); }}
            className={`flex items-center gap-2 pb-2 text-sm font-semibold border-b-2 transition-all ${
              mode === 'login' 
                ? 'border-blue-500 text-blue-400' 
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <LogIn size={16} />
            התחברות
          </button>
          <button
            onClick={() => { setMode('signup'); resetForm(); }}
            className={`flex items-center gap-2 pb-2 text-sm font-semibold border-b-2 transition-all ${
              mode === 'signup' 
                ? 'border-green-500 text-green-400' 
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <UserPlus size={16} />
            הרשמה
          </button>
          {(mode === 'forgot' || mode === 'reset') && (
            <span className="text-sm font-semibold text-amber-400 border-b-2 border-amber-500 pb-2 flex items-center gap-1.5 mr-auto">
              <KeyRound size={16} />
              איפוס סיסמה
            </span>
          )}
        </div>

        {/* Feedback Messages */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-900/30 border border-red-500/50 text-red-200 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-900/30 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Guest Progress Preservation Banner */}
        {mode === 'signup' && hasGuestProgress && (
          <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/30 text-xs text-blue-200 flex items-start gap-2.5">
            <Sparkles size={18} className="text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-300">ההתקדמות שלך תישמר אוטומטית!</p>
              <p className="text-zinc-300 mt-0.5">
                {guestSave.currency} מטבעות ו-{guestSave.unlockedWeapons.length} נשקים יועברו ישירות לחשבונך החדש.
              </p>
            </div>
          </div>
        )}

        {/* LOGIN FORM */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">כתובת אימייל</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="player@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl px-4 py-2.5 pl-10 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
                <Mail size={16} className="absolute left-3 top-3.5 text-zinc-400" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-zinc-300">סיסמה</label>
                <button
                  type="button"
                  onClick={() => { setMode('forgot'); resetForm(); }}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  שכחת סיסמה?
                </button>
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl px-4 py-2.5 pl-10 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
                <Lock size={16} className="absolute left-3 top-3.5 text-zinc-400" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg hover:shadow-blue-600/30 flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn size={18} />
                  התחבר לחשבון
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <span className="text-xs text-zinc-400">אין לך עדיין חשבון? </span>
              <button
                type="button"
                onClick={() => { setMode('signup'); resetForm(); }}
                className="text-xs text-green-400 hover:text-green-300 font-semibold"
              >
                הרשם עכשיו בחינם
              </button>
            </div>
          </form>
        )}

        {/* SIGN UP FORM */}
        {mode === 'signup' && (
          <form onSubmit={handleSignUp} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">כתובת אימייל</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="player@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl px-4 py-2.5 pl-10 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors"
                />
                <Mail size={16} className="absolute left-3 top-3.5 text-zinc-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">סיסמה (לפחות 6 תווים)</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl px-4 py-2.5 pl-10 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors"
                />
                <Lock size={16} className="absolute left-3 top-3.5 text-zinc-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">אימות סיסמה</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl px-4 py-2.5 pl-10 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors"
                />
                <ShieldCheck size={16} className="absolute left-3 top-3.5 text-zinc-400" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg hover:shadow-green-600/30 flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus size={18} />
                  צור חשבון ושמור בענן
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <span className="text-xs text-zinc-400">כבר רשום? </span>
              <button
                type="button"
                onClick={() => { setMode('login'); resetForm(); }}
                className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
              >
                התחבר כאן
              </button>
            </div>
          </form>
        )}

        {/* FORGOT PASSWORD FORM */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <p className="text-xs text-zinc-400 leading-relaxed">
              הזן את כתובת האימייל שאיתה נרשמת, ונשלח אליך קוד איפוס סיסמה.
            </p>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">כתובת אימייל</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="player@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl px-4 py-2.5 pl-10 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                />
                <Mail size={16} className="absolute left-3 top-3.5 text-zinc-400" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg hover:shadow-amber-600/30 flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <KeyRound size={18} />
                  שלח קוד איפוס
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => { setMode('login'); resetForm(); }}
              className="w-full text-xs text-zinc-400 hover:text-white py-1 transition-colors"
            >
              חזור להתחברות
            </button>
          </form>
        )}

        {/* RESET PASSWORD FORM */}
        {mode === 'reset' && (
          <form onSubmit={handleResetPassword} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">קוד איפוס (6 ספרות)</label>
              <input
                type="text"
                required
                maxLength={6}
                placeholder="123456"
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value)}
                className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl px-4 py-2.5 text-center tracking-widest font-mono text-lg text-amber-400 placeholder-zinc-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">סיסמה חדשה</label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">אימות סיסמה חדשה</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg hover:shadow-amber-600/30 flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <ShieldCheck size={18} />
                  עדכן סיסמה חדשה
                </>
              )}
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
