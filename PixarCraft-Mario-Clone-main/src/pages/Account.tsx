import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User as UserIcon, LogOut, Cloud, ShieldCheck } from 'lucide-react';
import { authService } from '../services/authService';
import { AuthModal } from '../components/AuthModal';
import type { User, GameSaveData } from '../types/save';

export function AccountPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadUser() {
      const { user } = await authService.getCurrentUser();
      setCurrentUser(user);
      if (!user) {
        setAuthModalOpen(true);
      }
      setLoading(false);
    }
    loadUser();
  }, []);

  const handleLogout = async () => {
    await authService.logout();
    setCurrentUser(null);
    setAuthModalOpen(true);
  };

  const handleCloseAuth = () => {
    if (!currentUser) {
      navigate('/');
    } else {
      setAuthModalOpen(false);
    }
  };

  if (loading) {
    return <div className="flex-1 flex items-center justify-center text-zinc-500 animate-pulse">Loading account data...</div>;
  }

  return (
    <div className="flex flex-col items-center py-24 px-4 w-full">
      <h1 className="text-4xl font-bold mb-12 flex items-center gap-4">
        <UserIcon className="w-10 h-10 text-blue-500" />
        Your Account
      </h1>

      {currentUser ? (
        <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl w-full max-w-xl shadow-2xl">
          <div className="flex items-center space-x-4 mb-8 pb-8 border-b border-zinc-800">
            <div className="bg-blue-600/20 p-4 rounded-full">
              <ShieldCheck className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-zinc-400 mb-1">Logged in as</p>
              <h2 className="text-xl font-bold">{currentUser.email}</h2>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center space-x-3 text-zinc-300">
              <Cloud className="w-5 h-5 text-green-400" />
              <span>Cloud Saving is Active. Your progress is synced securely.</span>
            </div>
            
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center space-x-2 bg-red-600/10 hover:bg-red-600/20 text-red-400 py-3 rounded-xl border border-red-500/20 transition-colors mt-8"
            >
              <LogOut className="w-5 h-5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center text-zinc-400 max-w-md">
          <p>You need to log in to access cloud saves.</p>
          <AuthModal 
            isOpen={authModalOpen} 
            onClose={handleCloseAuth}
            onSuccess={(user) => {
              setCurrentUser(user);
              setAuthModalOpen(false);
            }}
          />
        </div>
      )}
    </div>
  );
}
