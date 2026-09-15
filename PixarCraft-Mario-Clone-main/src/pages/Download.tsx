import React from 'react';
import { Download, CheckCircle, Package } from 'lucide-react';
import pkg from '../../package.json';

export function DownloadPage() {
  const version = pkg.version;

  return (
    <div className="max-w-4xl mx-auto px-4 py-16 w-full flex flex-col items-center">
      <div className="bg-blue-600/20 p-4 rounded-full mb-6">
        <Download className="w-12 h-12 text-blue-400" />
      </div>
      
      <h1 className="text-4xl font-bold mb-4">Download for Windows</h1>
      <p className="text-zinc-400 text-center mb-12 max-w-xl">
        Get the native desktop experience with smoother performance, offline support, and automatic background updates.
      </p>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 w-full shadow-2xl">
        <div className="flex flex-col md:flex-row items-center justify-between mb-8 pb-8 border-b border-zinc-800">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <h2 className="text-2xl font-bold">Mario Clone v{version}</h2>
              <span className="bg-blue-500/20 text-blue-400 text-xs font-bold px-2 py-1 rounded">LATEST STABLE</span>
            </div>
            <div className="text-sm text-zinc-400 flex flex-col sm:flex-row sm:space-x-4">
              <span>Platform: Windows 64-bit</span>
              <span className="hidden sm:inline">•</span>
              <span>Size: ~85 MB</span>
            </div>
          </div>
          
          <div className="mt-6 md:mt-0">
            <a 
              href="https://github.com/ariel-zemmour/PixarCraft-Mario-Clone-main/releases/latest/download/Mario-Clone-Setup.exe"
              download="Mario-Clone-Setup.exe"
              className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white bg-blue-600 rounded-xl shadow-lg hover:bg-blue-500 transition-all hover:scale-105 active:scale-95 text-lg"
            >
              <Download className="w-5 h-5 ml-2" />
              הורדת המשחק
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            <h3 className="text-lg font-bold mb-4 flex items-center">
              <Package className="w-5 h-5 mr-2 text-blue-400" />
              What's New in v{version}
            </h3>
            <div className="prose prose-invert prose-sm text-zinc-300 whitespace-pre-wrap bg-zinc-950 p-4 rounded-lg border border-zinc-800 h-64 overflow-y-auto">
              - Native Windows application support!
              - Automatic updates enabled.
              - Crosshair aiming system implemented.
              - Enhanced graphics and performance.
              - Cloud save compatibility.
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4">How to Install</h3>
            <ul className="space-y-4 text-zinc-300">
              <li className="flex items-start">
                <span className="bg-zinc-800 text-zinc-400 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold mr-3 shrink-0">1</span>
                <span>Click the download button above to get the <code className="text-blue-300 bg-blue-900/30 px-1 py-0.5 rounded">.exe</code> installer.</span>
              </li>
              <li className="flex items-start">
                <span className="bg-zinc-800 text-zinc-400 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold mr-3 shrink-0">2</span>
                <span>Run the downloaded file. Windows might ask for confirmation.</span>
              </li>
              <li className="flex items-start">
                <span className="bg-zinc-800 text-zinc-400 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold mr-3 shrink-0">3</span>
                <span>The game will install automatically and add a shortcut to your Start Menu.</span>
              </li>
              <li className="flex items-start">
                <span className="bg-zinc-800 text-zinc-400 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold mr-3 shrink-0">4</span>
                <span>Launch the game, log into your cloud account, and continue where you left off!</span>
              </li>
            </ul>
            
            <div className="mt-8 p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-start">
              <CheckCircle className="w-5 h-5 text-green-400 mr-3 shrink-0 mt-0.5" />
              <p className="text-sm text-green-100/70">
                <strong className="text-green-300 block mb-1">Automatic Updates Enabled</strong>
                Once installed, you never need to visit this page again. The desktop app will automatically detect, download, and install future updates while preserving your saves.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-16 text-center text-sm text-zinc-500 max-w-2xl">
        <h4 className="font-bold text-zinc-400 mb-2">System Requirements</h4>
        <p>OS: Windows 10 or 11 (64-bit)</p>
        <p>Memory: 4 GB RAM minimum</p>
        <p>Storage: ~150 MB available space</p>
        <p>Graphics: Any modern GPU with WebGL 2.0 support</p>
      </div>
    </div>
  );
}
