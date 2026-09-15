import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Download, Gamepad2, User, Home } from 'lucide-react';

export function Layout() {
  const location = useLocation();
  
  // Hide navbar/footer if in game
  if (location.pathname === '/play') {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
      <nav className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2 text-xl font-bold hover:text-blue-400 transition-colors">
            <Gamepad2 className="w-6 h-6 text-blue-500" />
            <span>Mario Clone</span>
          </Link>
          
          <div className="flex items-center space-x-6 text-sm font-medium">
            <Link to="/" className={`flex items-center space-x-1 hover:text-white transition-colors ${location.pathname === '/' ? 'text-white' : 'text-zinc-400'}`}>
              <Home className="w-4 h-4" />
              <span>Home</span>
            </Link>
            <a href="https://github.com/ariel-zemmour/PixarCraft-Mario-Clone-main/releases/latest/download/Mario-Clone-Setup.exe" download="Mario-Clone-Setup.exe" className={`flex items-center space-x-1 hover:text-white transition-colors text-zinc-400`}>
              <Download className="w-4 h-4" />
              <span>Download</span>
            </a>
            <Link to="/account" className={`flex items-center space-x-1 hover:text-white transition-colors ${location.pathname === '/account' ? 'text-white' : 'text-zinc-400'}`}>
              <User className="w-4 h-4" />
              <span>Account</span>
            </Link>
            <Link to="/play" className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
              <Gamepad2 className="w-4 h-4" />
              <span>Play in Browser</span>
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>

      <footer className="border-t border-zinc-800 bg-zinc-950 py-8 text-center text-zinc-500 text-sm">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
          <p>© {new Date().getFullYear()} PixarCraft Mario Clone. All rights reserved.</p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <Link to="/" className="hover:text-zinc-300">Home</Link>
            <a href="https://github.com/ariel-zemmour/PixarCraft-Mario-Clone-main/releases/latest/download/Mario-Clone-Setup.exe" download="Mario-Clone-Setup.exe" className="hover:text-zinc-300">Download</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
