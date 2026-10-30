import React, { useState, useEffect } from 'react';
import { Download, Monitor, Smartphone, CheckCircle2 } from 'lucide-react';
import { DOWNLOAD_URLS, detectOS, type DetectedOS } from '../services/deviceDetection';

interface DownloadMenuProps {
  compact?: boolean;
  deferredPrompt?: any;
  onInstallPWA?: () => void;
  className?: string;
}

export function DownloadMenu({
  compact = false,
  deferredPrompt,
  onInstallPWA,
  className = ''
}: DownloadMenuProps) {
  const [currentOS, setCurrentOS] = useState<DetectedOS>('unknown');

  useEffect(() => {
    setCurrentOS(detectOS());
  }, []);

  const handleMobileDownload = (e: React.MouseEvent) => {
    // אם הדפדפן תומך בהתקנת PWA ישירה
    if (deferredPrompt && onInstallPWA) {
      onInstallPWA();
    }
  };

  if (compact) {
    return (
      <div className={`flex flex-col gap-2.5 w-full ${className}`} dir="rtl">
        <div className="flex items-center justify-between text-xs text-zinc-400 font-medium px-1">
          <span>הורדת המשחק למכשירך:</span>
          {currentOS !== 'unknown' && (
            <span className="text-blue-400 flex items-center gap-1">
              <CheckCircle2 size={12} />
              זוהה: {currentOS === 'windows' ? 'Windows' : currentOS === 'mac' ? 'Mac' : currentOS === 'android' ? 'אנדרואיד' : currentOS === 'ios' ? 'אייפון / אייפד' : 'Linux'}
            </span>
          )}
        </div>

        {/* 1. הורדה ל-Windows */}
        <a
          href={DOWNLOAD_URLS.windows}
          download="Mario-Clone-Setup.exe"
          className={`relative group flex items-center justify-between p-3 rounded-xl transition-all border ${
            currentOS === 'windows'
              ? 'bg-blue-600/20 hover:bg-blue-600/30 border-blue-500/60 shadow-lg shadow-blue-900/20'
              : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-700/80 hover:border-zinc-600'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${currentOS === 'windows' ? 'bg-blue-500 text-white' : 'bg-zinc-800 text-zinc-300'}`}>
              <Monitor size={18} />
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>הורדה ל-Windows</span>
                {currentOS === 'windows' && (
                  <span className="text-[10px] bg-blue-500/30 text-blue-300 px-1.5 py-0.5 rounded-full font-normal">מומלץ</span>
                )}
              </div>
              <span className="text-[11px] text-zinc-400">התקנה למחשב (.exe)</span>
            </div>
          </div>
          <Download size={16} className="text-zinc-400 group-hover:text-white transition-colors" />
        </a>

        {/* 2. הורדה ל-Mac */}
        <a
          href={DOWNLOAD_URLS.mac}
          download="Mario-Clone.dmg"
          className={`relative group flex items-center justify-between p-3 rounded-xl transition-all border ${
            currentOS === 'mac'
              ? 'bg-purple-600/20 hover:bg-purple-600/30 border-purple-500/60 shadow-lg shadow-purple-900/20'
              : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-700/80 hover:border-zinc-600'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${currentOS === 'mac' ? 'bg-purple-500 text-white' : 'bg-zinc-800 text-zinc-300'}`}>
              <span className="text-lg leading-none">🍎</span>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>הורדה ל-Mac</span>
                {currentOS === 'mac' && (
                  <span className="text-[10px] bg-purple-500/30 text-purple-300 px-1.5 py-0.5 rounded-full font-normal">מומלץ</span>
                )}
              </div>
              <span className="text-[11px] text-zinc-400">חבילת macOS (.dmg)</span>
            </div>
          </div>
          <Download size={16} className="text-zinc-400 group-hover:text-white transition-colors" />
        </a>

        {/* 3. הורדה לנייד */}
        <a
          href={DOWNLOAD_URLS.mobile}
          download="Mario-Clone.apk"
          onClick={handleMobileDownload}
          className={`relative group flex items-center justify-between p-3 rounded-xl transition-all border ${
            currentOS === 'android' || currentOS === 'ios'
              ? 'bg-emerald-600/20 hover:bg-emerald-600/30 border-emerald-500/60 shadow-lg shadow-emerald-900/20'
              : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-700/80 hover:border-zinc-600'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${currentOS === 'android' || currentOS === 'ios' ? 'bg-emerald-500 text-white' : 'bg-zinc-800 text-zinc-300'}`}>
              <Smartphone size={18} />
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>הורדה לטלפון (Mobile)</span>
                {(currentOS === 'android' || currentOS === 'ios') && (
                  <span className="text-[10px] bg-emerald-500/30 text-emerald-300 px-1.5 py-0.5 rounded-full font-normal">מומלץ</span>
                )}
              </div>
              <span className="text-[11px] text-zinc-400">
                {deferredPrompt ? 'התקנה ישירה למסך הבית / APK' : 'חבילת מובייל (.apk)'}
              </span>
            </div>
          </div>
          <Download size={16} className="text-zinc-400 group-hover:text-white transition-colors" />
        </a>

        <p className="text-[11px] text-zinc-400 text-center mt-1 leading-relaxed">
          המשחק מתעדכן אוטומטית ברקע בכל הפלטפורמות! 🔄
        </p>
      </div>
    );
  }

  // גרסה רחבה (דף הבית / אזור הורדות מרכזי)
  return (
    <div className={`w-full max-w-4xl mx-auto ${className}`} dir="rtl">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. הורדה ל-Windows */}
        <a
          href={DOWNLOAD_URLS.windows}
          download="Mario-Clone-Setup.exe"
          className={`group relative flex flex-col items-center justify-between p-6 rounded-2xl transition-all border text-center ${
            currentOS === 'windows'
              ? 'bg-gradient-to-b from-blue-900/40 to-zinc-900 border-blue-500 shadow-xl shadow-blue-950/50 scale-[1.02]'
              : 'bg-zinc-900/80 hover:bg-zinc-800 border-zinc-800 hover:border-blue-500/50'
          }`}
        >
          {currentOS === 'windows' && (
            <span className="absolute -top-3 bg-blue-500 text-white text-xs px-3 py-1 rounded-full font-bold shadow-md">
              מומלץ למחשב שלך
            </span>
          )}
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-4 group-hover:scale-110 transition-transform">
            <Monitor className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white mb-1">הורדה ל-Windows</h3>
          <p className="text-xs text-zinc-400 mb-6">מתקין רשמי ל-Windows 10 / 11 (.exe)</p>
          <div className="w-full py-3 px-4 bg-blue-600 group-hover:bg-blue-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors text-sm shadow-lg">
            <Download size={18} />
            <span>הורדה למחשב</span>
          </div>
        </a>

        {/* 2. הורדה ל-Mac */}
        <a
          href={DOWNLOAD_URLS.mac}
          download="Mario-Clone.dmg"
          className={`group relative flex flex-col items-center justify-between p-6 rounded-2xl transition-all border text-center ${
            currentOS === 'mac'
              ? 'bg-gradient-to-b from-purple-900/40 to-zinc-900 border-purple-500 shadow-xl shadow-purple-950/50 scale-[1.02]'
              : 'bg-zinc-900/80 hover:bg-zinc-800 border-zinc-800 hover:border-purple-500/50'
          }`}
        >
          {currentOS === 'mac' && (
            <span className="absolute -top-3 bg-purple-500 text-white text-xs px-3 py-1 rounded-full font-bold shadow-md">
              מומלץ ל-Mac שלך
            </span>
          )}
          <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-4 group-hover:scale-110 transition-transform">
            <span className="text-3xl leading-none">🍎</span>
          </div>
          <h3 className="text-xl font-bold text-white mb-1">הורדה ל-Mac</h3>
          <p className="text-xs text-zinc-400 mb-6">עבור Apple Silicon & Intel (.dmg)</p>
          <div className="w-full py-3 px-4 bg-zinc-700 group-hover:bg-zinc-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors text-sm shadow-lg">
            <Download size={18} />
            <span>הורדה ל-macOS</span>
          </div>
        </a>

        {/* 3. הורדה לנייד */}
        <a
          href={DOWNLOAD_URLS.mobile}
          download="Mario-Clone.apk"
          onClick={handleMobileDownload}
          className={`group relative flex flex-col items-center justify-between p-6 rounded-2xl transition-all border text-center ${
            currentOS === 'android' || currentOS === 'ios'
              ? 'bg-gradient-to-b from-emerald-900/40 to-zinc-900 border-emerald-500 shadow-xl shadow-emerald-950/50 scale-[1.02]'
              : 'bg-zinc-900/80 hover:bg-zinc-800 border-zinc-800 hover:border-emerald-500/50'
          }`}
        >
          {(currentOS === 'android' || currentOS === 'ios') && (
            <span className="absolute -top-3 bg-emerald-500 text-white text-xs px-3 py-1 rounded-full font-bold shadow-md">
              מומלץ לנייד שלך
            </span>
          )}
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
            <Smartphone className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white mb-1">הורדה לטלפון (Mobile)</h3>
          <p className="text-xs text-zinc-400 mb-6">
            {deferredPrompt ? 'התקנה ישירה במסך הבית או קובץ APK' : 'חבילת מובייל לסמארטפונים (.apk)'}
          </p>
          <div className="w-full py-3 px-4 bg-emerald-600 group-hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors text-sm shadow-lg">
            <Download size={18} />
            <span>{deferredPrompt ? 'התקנה / הורדה לנייד' : 'הורדה לטלפון'}</span>
          </div>
        </a>
      </div>
    </div>
  );
}
