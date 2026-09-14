import React from 'react';
import { User as UserIcon, LogOut, LogIn, Sparkles } from 'lucide-react';
import type { User } from '../types/save';
import { SaveIndicator } from './SaveIndicator';

interface UserMenuProps {
  user: User | null;
  onOpenAuth: (mode?: 'login' | 'signup') => void;
  onLogout: () => void;
  currency: number;
}

export const UserMenu: React.FC<UserMenuProps> = ({
  user,
  onOpenAuth,
  onLogout,
  currency
}) => {
  return (
    <div className="w-full flex flex-wrap items-center justify-between gap-3 bg-zinc-800/80 border border-zinc-700/80 rounded-xl px-4 py-2.5 mb-4 shadow-md backdrop-blur-sm">
      
      {/* User Info / Guest Status */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-inner font-bold text-xs">
          {user ? user.email.charAt(0).toUpperCase() : <UserIcon size={16} />}
        </div>

        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-xs md:text-sm text-zinc-100">
              {user ? user.email : 'שחקן אורח'}
            </span>
            <SaveIndicator isLoggedIn={!!user} />
          </div>

          {!user && (
            <p className="text-[11px] text-zinc-400 hidden sm:block">
              צור חשבון כדי לשמור את ההתקדמות שלך בכל מכשיר
            </p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        {user ? (
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 text-xs bg-zinc-700/80 hover:bg-red-900/40 text-zinc-300 hover:text-red-300 px-3 py-1.5 rounded-lg border border-zinc-600/50 hover:border-red-500/40 transition-colors"
            title="התנתק מהחשבון"
          >
            <LogOut size={14} />
            <span>התנתק</span>
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenAuth('login')}
              className="flex items-center gap-1.5 text-xs bg-zinc-700 hover:bg-zinc-600 text-zinc-200 px-3 py-1.5 rounded-lg border border-zinc-600 transition-colors"
            >
              <LogIn size={14} />
              <span>התחברות</span>
            </button>
            <button
              onClick={() => onOpenAuth('signup')}
              className="flex items-center gap-1.5 text-xs bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium px-3 py-1.5 rounded-lg shadow-sm transition-all hover:scale-[1.02]"
            >
              <Sparkles size={14} className="text-amber-300" />
              <span>שמור בענן (הרשמה)</span>
            </button>
          </div>
        )}
      </div>

    </div>
  );
};
