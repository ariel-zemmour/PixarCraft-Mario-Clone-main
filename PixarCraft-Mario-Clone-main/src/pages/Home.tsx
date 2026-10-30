import React from 'react';
import { Link } from 'react-router-dom';
import { Monitor, Shield, Zap, Gamepad2, Play } from 'lucide-react';
import { DownloadMenu } from '../components/DownloadMenu';

export function Home() {
  return (
    <div className="flex flex-col items-center" dir="rtl">
      {/* Hero Section */}
      <section className="w-full relative overflow-hidden py-20 px-4 flex flex-col items-center text-center">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 via-zinc-950/80 to-zinc-950 -z-10" />
        <Gamepad2 className="w-20 h-20 text-blue-500 mb-6 animate-pulse" />
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-gradient-to-r from-blue-400 via-cyan-300 to-emerald-400 bg-clip-text text-transparent">
          משחק אריאל - מריו הרפתקה
        </h1>
        
        <p className="text-xl md:text-2xl text-zinc-300 max-w-3xl mb-10 leading-relaxed">
          חוויית פלטפורמה מלהיבה ועשירה. אספו מטבעות ויהלומים, שדרגו 20 כלי נשק אגדיים, הביסו בוסים מפלצתיים וסנכרנו את ההתקדמות בענן!
        </p>

        {/* Play in Browser Call to Action */}
        <div className="mb-12">
          <Link 
            to="/play" 
            className="group inline-flex items-center justify-center px-10 py-4 font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-2xl hover:from-blue-500 hover:to-indigo-500 transition-all hover:scale-105 active:scale-95 text-lg border border-blue-400/30"
          >
            <Play className="w-6 h-6 ml-3 fill-current group-hover:scale-110 transition-transform" />
            <span>שחק עכשיו בדפדפן</span>
          </Link>
        </div>

        {/* 3 Dedicated Download Options */}
        <div className="w-full max-w-4xl px-2">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="h-px bg-zinc-800 flex-1 max-w-xs" />
            <span className="text-sm font-semibold tracking-wider uppercase text-zinc-400">
              או הורידו את האפליקציה למכשירכם
            </span>
            <div className="h-px bg-zinc-800 flex-1 max-w-xs" />
          </div>

          <DownloadMenu />
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full max-w-6xl px-4 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-2xl flex flex-col items-center text-center">
            <div className="bg-blue-500/10 p-4 rounded-full mb-6">
              <Monitor className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="text-xl font-bold mb-3">מותאם לכל הפלטפורמות</h3>
            <p className="text-zinc-400">פועל באופן חלק ומותאם אישית למחשבי Windows, למחשבי Mac ולסמארטפונים עם מקלדת, עכבר או מסך מגע.</p>
          </div>
          
          <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-2xl flex flex-col items-center text-center">
            <div className="bg-green-500/10 p-4 rounded-full mb-6">
              <Shield className="w-8 h-8 text-green-400" />
            </div>
            <h3 className="text-xl font-bold mb-3">שמירה בענן (Cloud Save)</h3>
            <p className="text-zinc-400">ההתקדמות שלכם נשמרת אוטומטית ובאופן מאובטח בענן. תוכלו לעבור בין הדפדפן, המחשב והנייד בכל רגע!</p>
          </div>
          
          <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-2xl flex flex-col items-center text-center">
            <div className="bg-purple-500/10 p-4 rounded-full mb-6">
              <Zap className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="text-xl font-bold mb-3">עדכונים אוטומטיים</h3>
            <p className="text-zinc-400">האפליקציה מתעדכנת ברקע בכל שדרוג של שלב או נשק חדש, ללא צורך בהתקנה חוזרת מאפס.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
