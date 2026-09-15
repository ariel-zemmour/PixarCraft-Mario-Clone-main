import React from 'react';
import { Link } from 'react-router-dom';
import { Download, Monitor, Shield, Zap, Gamepad2 } from 'lucide-react';

export function Home() {
  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full relative overflow-hidden py-24 px-4 flex flex-col items-center text-center">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 to-zinc-950 -z-10" />
        <Gamepad2 className="w-24 h-24 text-blue-500 mb-8 animate-pulse" />
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
          PixarCraft Mario Clone
        </h1>
        
        <p className="text-xl md:text-2xl text-zinc-400 max-w-3xl mb-12">
          Experience the ultimate platformer adventure. Collect coins, upgrade weapons, defeat bosses, and sync your progress to the cloud!
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link 
            to="/download" 
            className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white bg-blue-600 rounded-xl overflow-hidden shadow-2xl hover:bg-blue-500 transition-all hover:scale-105 active:scale-95 text-lg"
          >
            <div className="absolute inset-0 w-full h-full -mt-1 rounded-lg opacity-30 bg-gradient-to-b from-transparent via-transparent to-black" />
            <Download className="w-6 h-6 ml-3 group-hover:-translate-y-1 transition-transform" />
            הורדת המשחק
          </Link>
          <Link 
            to="/play" 
            className="inline-flex items-center justify-center px-8 py-4 font-bold text-zinc-300 bg-zinc-800 border border-zinc-700 rounded-xl hover:bg-zinc-700 hover:text-white transition-all active:scale-95"
          >
            PLAY IN BROWSER
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full max-w-6xl px-4 py-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-2xl flex flex-col items-center text-center">
            <div className="bg-blue-500/10 p-4 rounded-full mb-6">
              <Monitor className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="text-xl font-bold mb-3">Native Windows App</h3>
            <p className="text-zinc-400">Play seamlessly on your desktop with a dedicated, optimized native application.</p>
          </div>
          
          <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-2xl flex flex-col items-center text-center">
            <div className="bg-green-500/10 p-4 rounded-full mb-6">
              <Shield className="w-8 h-8 text-green-400" />
            </div>
            <h3 className="text-xl font-bold mb-3">Cloud Save</h3>
            <p className="text-zinc-400">Your progress is automatically saved to the cloud. Switch between web and desktop instantly!</p>
          </div>
          
          <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-2xl flex flex-col items-center text-center">
            <div className="bg-purple-500/10 p-4 rounded-full mb-6">
              <Zap className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="text-xl font-bold mb-3">Auto Updates</h3>
            <p className="text-zinc-400">Never miss a new weapon or level. The desktop app updates automatically in the background.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
