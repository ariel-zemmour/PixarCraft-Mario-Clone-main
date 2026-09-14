import React from 'react';
import { Cloud, HardDrive, AlertTriangle } from 'lucide-react';
import type { GameSaveData } from '../types/save';

interface ConflictModalProps {
  isOpen: boolean;
  localSave: GameSaveData;
  cloudSave: GameSaveData;
  onSelectCloud: () => void;
  onSelectLocal: () => void;
}

export const ConflictModal: React.FC<ConflictModalProps> = ({
  isOpen,
  localSave,
  cloudSave,
  onSelectCloud,
  onSelectLocal
}) => {
  if (!isOpen) return null;

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'לא ידוע';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('he-IL', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm" dir="rtl">
      <div className="w-full max-w-lg bg-zinc-900 border border-amber-500/50 rounded-2xl shadow-2xl p-6 relative">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-zinc-800">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-zinc-100">נמצאה התנגשות שמירות!</h3>
            <p className="text-xs text-zinc-400">
              קיימת שמירה מקומית בדפדפן וגם שמירה בענן בחשבונך. באיזו שמירה תרצה להשתמש?
            </p>
          </div>
        </div>

        {/* Comparison Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Cloud Save Card */}
          <div className="bg-zinc-800/80 border border-blue-500/40 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-blue-400 font-semibold text-sm mb-2">
                <Cloud size={18} />
                <span>שמירה בענן</span>
              </div>
              <div className="space-y-1.5 text-xs text-zinc-300">
                <p>💰 מטבעות: <strong className="text-yellow-400">{cloudSave.currency}</strong></p>
                <p>🔫 נשקים ששוחררו: <strong>{cloudSave.unlockedWeapons.length}</strong></p>
                <p>🏆 רמה מקסימלית: <strong>{cloudSave.stats?.maxLevelReached || 1}</strong></p>
                <p className="text-[11px] text-zinc-400 pt-1 border-t border-zinc-700/60 mt-2">
                  זמן: {formatDate(cloudSave.updatedAt)}
                </p>
              </div>
            </div>

            <button
              onClick={onSelectCloud}
              className="mt-4 w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-3 rounded-lg text-xs transition-colors shadow-md flex items-center justify-center gap-1.5"
            >
              <Cloud size={14} />
              השתמש בשמירה בענן
            </button>
          </div>

          {/* Local Save Card */}
          <div className="bg-zinc-800/80 border border-zinc-700 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm mb-2">
                <HardDrive size={18} />
                <span>שמירה מקומית</span>
              </div>
              <div className="space-y-1.5 text-xs text-zinc-300">
                <p>💰 מטבעות: <strong className="text-yellow-400">{localSave.currency}</strong></p>
                <p>🔫 נשקים ששוחררו: <strong>{localSave.unlockedWeapons.length}</strong></p>
                <p>🏆 רמה מקסימלית: <strong>{localSave.stats?.maxLevelReached || 1}</strong></p>
                <p className="text-[11px] text-zinc-400 pt-1 border-t border-zinc-700/60 mt-2">
                  זמן: {formatDate(localSave.updatedAt)}
                </p>
              </div>
            </div>

            <button
              onClick={onSelectLocal}
              className="mt-4 w-full bg-zinc-700 hover:bg-emerald-600 text-white font-semibold py-2.5 px-3 rounded-lg text-xs transition-colors shadow-md flex items-center justify-center gap-1.5"
            >
              <HardDrive size={14} />
              השתמש בשמירה המקומית
            </button>
          </div>
        </div>

        <p className="text-[11px] text-zinc-500 text-center">
          בחירה בשמירה המקומית תעדכן את הענן עם הנתונים המקומיים שלך.
        </p>

      </div>
    </div>
  );
};
