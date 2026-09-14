import React from 'react';
import { Trophy, Sparkles, Coins, Award, RefreshCw, ShoppingBag, X } from 'lucide-react';

interface VictoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlayAgain: () => void;
  onOpenShop: () => void;
  rewardCoins: number;
  rewardScore: number;
  weaponUnlockedName?: string;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  isOpen,
  onClose,
  onPlayAgain,
  onOpenShop,
  rewardCoins,
  rewardScore,
  weaponUnlockedName
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in" dir="rtl">
      <div className="bg-gradient-to-b from-zinc-900 via-zinc-850 to-zinc-900 border-2 border-yellow-500/60 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative overflow-hidden text-zinc-100">
        {/* Glow ambient background */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-yellow-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800/80 transition-colors"
          title="סגור"
        >
          <X size={20} />
        </button>

        {/* Header Icon */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="relative mb-3">
            <div className="w-20 h-20 bg-gradient-to-tr from-yellow-600 to-amber-300 rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-500/30 border border-yellow-300/40">
              <Trophy size={42} className="text-zinc-950 fill-zinc-950 animate-bounce" />
            </div>
            <Sparkles size={24} className="absolute -top-2 -right-2 text-yellow-300 animate-pulse" />
          </div>

          <span className="inline-block px-3 py-1 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 text-xs font-bold rounded-full mb-2 tracking-wide uppercase">
            ניצחון אפי ומכריע!
          </span>
          <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-200 to-yellow-500">
            הבסת את טיטאן הצללים!
          </h2>
          <p className="text-zinc-400 text-sm mt-1">
            כל הכבוד! הצלת את העולם וסיימת את המשחק בהצלחה מוחצת!
          </p>
        </div>

        {/* Reward Cards */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-zinc-800/80 border border-yellow-500/30 rounded-xl p-3 flex items-center gap-3 shadow-inner">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center text-yellow-400">
              <Coins size={22} />
            </div>
            <div>
              <div className="text-xs text-zinc-400">מטבעות שהרווחת</div>
              <div className="text-lg font-bold text-yellow-400">+{rewardCoins.toLocaleString()}</div>
            </div>
          </div>

          <div className="bg-zinc-800/80 border border-purple-500/30 rounded-xl p-3 flex items-center gap-3 shadow-inner">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400">
              <Award size={22} />
            </div>
            <div>
              <div className="text-xs text-zinc-400">ניקוד בונוס</div>
              <div className="text-lg font-bold text-purple-300">+{rewardScore.toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* Unlocked Weapon Banner */}
        {weaponUnlockedName && (
          <div className="mb-6 p-3.5 bg-gradient-to-r from-yellow-950/40 via-amber-900/30 to-yellow-950/40 border border-yellow-500/40 rounded-xl flex items-center gap-3 shadow-md">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/30 flex items-center justify-center text-yellow-300">
              <Sparkles size={22} />
            </div>
            <div className="flex-1">
              <div className="text-xs font-semibold text-yellow-400">נשק אגדי נפתח בחינם!</div>
              <div className="text-sm font-bold text-white">{weaponUnlockedName}</div>
            </div>
            <span className="text-xs bg-yellow-500 text-zinc-950 px-2 py-0.5 rounded font-black">
              נעול ➔ נפתח!
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onPlayAgain}
            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-green-600/30 transition-all hover:scale-[1.02]"
          >
            <RefreshCw size={18} />
            שחק שוב
          </button>
          <button
            onClick={onOpenShop}
            className="flex-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-zinc-100 font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
          >
            <ShoppingBag size={18} />
            חנות הנשקים
          </button>
        </div>
      </div>
    </div>
  );
};
