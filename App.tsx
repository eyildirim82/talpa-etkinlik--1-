import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { EventData, User } from './types';
import AdminPage from './src/pages/AdminPage';
import { EmptyState } from './components/EmptyState';
import { AuthModal } from './components/AuthModal';
import { LoadingState } from './src/components/common/LoadingState';
import { LuxuryHeader } from './src/components/layout/LuxuryHeader';
import { CinematicHero } from './src/components/home/CinematicHero';
import { StickyFooter } from './src/components/home/StickyFooter';
import { ThemeLayout } from './src/components/layout/ThemeLayout';
import TicketViewPage from './src/pages/TicketViewPage';

const AppContent = () => {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<EventData[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const loadData = async () => {
      try {
        // Import Supabase client
        const { createClient } = await import('./utils/supabase/browser');
        const supabase = createClient();

        const fetchUser = async (sessionUser: any) => {
          if (sessionUser) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', sessionUser.id)
              .single();
            if (profile) setUser(profile);
          } else {
            setUser(null);
          }
        };

        // Initial load
        const { data: { user: authUser } } = await supabase.auth.getUser();
        await fetchUser(authUser);

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          fetchUser(session?.user);
        });

        // Fetch active event from view
        const { data: activeEvent } = await supabase
          .from('active_event_view')
          .select('*')
          .maybeSingle();

        if (activeEvent) {
          setEvents([activeEvent]);
        } else {
          setEvents([]);
        }

        return () => subscription.unsubscribe();

      } catch (error) {
        console.error('[AppWrapper] Error loading data:', error);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return <LoadingState />;
  }

  const activeEvent = events && events.length > 0 ? events.find(event => event.remaining_stock > 0) : null;

  const handleAdminClick = () => {
    navigate('/admin');
  };

  const handleHomeClick = () => {
    navigate('/');
  };

  return (
    <Routes>
      <Route path="/admin" element={
        <ThemeLayout variant="dark">
          <AdminPage onBack={handleHomeClick} />
        </ThemeLayout>
      } />
      <Route path="/ticket/:id" element={
        <ThemeLayout variant="dark">
          <TicketViewPage />
        </ThemeLayout>
      } />
      <Route path="/" element={
        <ThemeLayout variant="dark">
          <LuxuryHeader
            user={user}
            onAuthClick={() => setShowAuthModal(true)}
            onAdminClick={handleAdminClick}
          />
          {!activeEvent ? (
            <EmptyState />
          ) : (
            <>
              <CinematicHero event={activeEvent} />
              <StickyFooter event={activeEvent} />
            </>
          )}
          {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
        </ThemeLayout>
      } />
    </Routes>
  );
};

const App = () => {
  return <AppContent />;
};

export default App;