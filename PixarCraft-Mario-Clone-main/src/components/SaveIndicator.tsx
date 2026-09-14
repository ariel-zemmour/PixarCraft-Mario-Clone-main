import React, { useEffect, useState } from 'react';
import { Cloud, CloudCheck, Loader2, WifiOff, AlertTriangle } from 'lucide-react';
import { saveService } from '../services/saveService';
import type { SaveStatusState } from '../types/save';

export const SaveIndicator: React.FC<{ isLoggedIn: boolean }> = ({ isLoggedIn }) => {
  const [status, setStatus] = useState<SaveStatusState>('saved');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    const unsubscribe = saveService.subscribeStatus((newStatus, msg) => {
      setStatus(newStatus);
      if (msg) setMessage(msg);
    });
    return unsubscribe;
  }, []);

  if (!isLoggedIn) {
    return (
      <div 
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-800/80 border border-zinc-700/60 text-xs text-zinc-400 backdrop-blur-sm shadow-sm"
        title="ההתקדמות נשמרת בדפדפן המקומי. התחבר כדי לשמור בענן."
      >
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
        <span>שמירה מקומית (אורח)</span>
      </div>
    );
  }

  return (
    <div 
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs backdrop-blur-sm transition-all shadow-sm border ${
        status === 'saving' 
          ? 'bg-blue-900/40 border-blue-600/60 text-blue-300' 
          : status === 'offline' 
          ? 'bg-yellow-900/40 border-yellow-600/60 text-yellow-300' 
          : status === 'error' 
          ? 'bg-red-900/40 border-red-600/60 text-red-300' 
          : 'bg-emerald-950/40 border-emerald-600/50 text-emerald-300'
      }`}
      title={message || 'מצב שמירה בענן'}
    >
      {status === 'saving' && <Loader2 size={13} className="animate-spin text-blue-400" />}
      {status === 'saved' && <CloudCheck size={13} className="text-emerald-400" />}
      {status === 'offline' && <WifiOff size={13} className="text-yellow-400" />}
      {status === 'error' && <AlertTriangle size={13} className="text-red-400" />}

      <span>
        {status === 'saving' 
          ? 'שומר בענן...' 
          : status === 'offline' 
          ? 'לא מקוון (שמור מקומית)' 
          : status === 'error' 
          ? 'שמירה מקומית' 
          : 'נשמר בענן'}
      </span>
    </div>
  );
};
