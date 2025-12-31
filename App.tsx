'use client';

import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './contexts/AppContext';
import { Hero } from './components/Hero';
import { InfoCockpit } from './components/InfoCockpit';
import { ActionZone } from './components/ActionZone';
import { EventData, User } from './types';
import { LogOut, Settings } from 'lucide-react';
import AdminPage from './src/pages/AdminPage';

interface AppProps {
  initialEvent: EventData | null;
  initialUser: User | null;
}

type Page = 'home' | 'admin';

interface HeaderProps {
  onAdminClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onAdminClick }) => {
  const { user, logout } = useApp();
  const isAdmin = user?.role === 'admin';

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
          <div className="flex items-center gap-3">
            {/* Admin Button */}
            {isAdmin && (
              <button
                onClick={onAdminClick}
                className="px-4 py-2 text-sm font-medium text-white bg-[#C41E3A] hover:bg-[#A01729] transition-colors rounded-sm flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Admin Panel</span>
              </button>
            )}

            <div className="text-right hidden md:block">
              <span className="block text-[10px] font-bold text-talpa-secondary uppercase tracking-wider">KAPTAN PİLOT</span>
              <span className="block text-sm font-semibold text-talpa-primary">{user.full_name}</span>
            </div>
            <button
              onClick={() => logout()}
              className="px-4 py-2 text-sm font-medium text-talpa-secondary hover:text-talpa-danger transition-colors bg-gray-50 hover:bg-red-50 rounded-sm border border-talpa-border flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Çıkış Yap</span>
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

interface MainContentProps {
  onAdminClick: () => void;
}

const MainContent: React.FC<MainContentProps> = ({ onAdminClick }) => {
  const { event, isLoading } = useApp();

  // If not loading and no event, we can't show anything useful (maybe 404 later)
  if (!isLoading && !event) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-12">
      <Header onAdminClick={onAdminClick} />

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

const App: React.FC<AppProps> = ({ initialEvent, initialUser }) => {
  const [currentPage, setCurrentPage] = useState<Page>('home');

  // Handle hash-based routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === '#admin') {
        setCurrentPage('admin');
      } else {
        setCurrentPage('home');
      }
    };

    // Check initial hash
    handleHashChange();

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (page: Page) => {
    if (page === 'admin') {
      window.location.hash = 'admin';
    } else {
      window.location.hash = '';
    }
    setCurrentPage(page);
  };

  // Render Admin Page
  if (currentPage === 'admin') {
    return <AdminPage onBack={() => navigateTo('home')} />;
  }

  // Render Main App
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider initialEvent={initialEvent} initialUser={initialUser}>
        <MainContent onAdminClick={() => navigateTo('admin')} />
      </AppProvider>
    </QueryClientProvider>
  );
};

export default App;