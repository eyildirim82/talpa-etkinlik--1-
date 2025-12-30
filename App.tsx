'use client';

import React from 'react';
import { AppProvider, useApp } from './contexts/AppContext';
import { Hero } from './components/Hero';
import { InfoCockpit } from './components/InfoCockpit';
import { ActionZone } from './components/ActionZone';
import { EventData, User } from './types';
import { LogOut } from 'lucide-react';

interface AppProps {
  initialEvent: EventData | null;
  initialUser: User | null;
}

const Header: React.FC = () => {
  const { user, logout } = useApp();

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-talpa-border h-20 sticky top-0 z-40">
      <div className="max-w-4xl mx-auto h-full px-6 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-talpa-primary tracking-tighter">TALPA</span>
          <span className="hidden md:inline-block h-6 w-[1px] bg-talpa-border mx-2"></span>
          <span className="text-sm font-mono text-talpa-secondary tracking-widest uppercase">Etkinlik</span>
        </div>

        {/* User Menu */}
        {user ? (
          <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
              <span className="block text-[10px] font-bold text-talpa-secondary uppercase tracking-wider">KAPTAN PİLOT</span>
              <span className="block text-sm font-semibold text-talpa-primary">{user.full_name}</span>
            </div>
            <button
              onClick={() => logout()}
              className="p-2 text-talpa-secondary hover:text-talpa-danger transition-colors bg-gray-50 hover:bg-red-50 rounded-sm border border-talpa-border"
              title="Çıkış Yap"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="px-3 py-1 bg-gray-100 rounded-sm border border-gray-200">
            <span className="text-xs font-mono font-medium text-gray-500">GUEST MODE</span>
          </div>
        )}
      </div>
    </header>
  );
};

const MainContent: React.FC = () => {
  const { event, isLoading } = useApp();

  // If not loading and no event, we can't show anything useful (maybe 404 later)
  if (!isLoading && !event) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-12">
      <Header />

      {/* Main Container - Card Style */}
      <main className="flex-grow w-full max-w-4xl mx-auto bg-white shadow-sm md:rounded-b-xl md:mt-0 md:mb-12 overflow-hidden border-x border-b border-talpa-border">
        <Hero isLoading={isLoading} />

        <InfoCockpit />
        <ActionZone />
      </main>

      {/* Footer */}
      <footer className="text-center text-talpa-secondary py-8">
        <p className="text-[10px] font-mono uppercase tracking-widest opacity-60">
          © 2025 Türkiye Havayolu Pilotları Derneği
        </p>
      </footer>
    </div>
  );
};

import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './utils/react-query';
import { BrowserRouter } from 'react-router-dom';

const App: React.FC<AppProps> = ({ initialEvent, initialUser }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppProvider initialEvent={initialEvent} initialUser={initialUser}>
          <MainContent />
        </AppProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;