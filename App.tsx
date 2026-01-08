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
import ProtectedRoute from './src/components/ProtectedRoute';

import { BookingModal } from './src/modules/booking/components/BookingModal';

const AppContent = () => {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<EventData[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const loadData = async () => {
      const start = Date.now();
      console.log(`PERF: Total App Load STARTED at ${start}`);
      try {
        // Import Supabase client
        console.log(`PERF: Import Supabase STARTED at ${Date.now() - start}ms`);
        const { createBrowserClient } = await import('./src/shared/infrastructure/supabase');
        const supabase = createBrowserClient();
        console.log(`PERF: Import Supabase FINISHED at ${Date.now() - start}ms`);

        const fetchUser = async (sessionUser: any) => {
          if (sessionUser) {
            console.log(`PERF: Fetch Profile STARTED at ${Date.now() - start}ms`);
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', sessionUser.id)
              .single();
            if (profile) setUser(profile);
            console.log(`PERF: Fetch Profile FINISHED at ${Date.now() - start}ms`);
          } else {
            setUser(null);
          }
        };

        // Initial load
        console.log(`PERF: Get User STARTED at ${Date.now() - start}ms`);
        const { data: { user: authUser } } = await supabase.auth.getUser();
        console.log(`PERF: Get User FINISHED at ${Date.now() - start}ms`);

        await fetchUser(authUser);

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          fetchUser(session?.user);
        });

        // Fetch active event from view
        console.log(`PERF: Fetch Active Event STARTED at ${Date.now() - start}ms`);
        const { data: activeEvent, error: eventError } = await supabase
          .from('active_event_view')
          .select('*')
          .maybeSingle();
        console.log(`PERF: Fetch Active Event FINISHED at ${Date.now() - start}ms`);

        if (eventError) console.error('Event fetch error:', eventError);

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
        console.log(`PERF: Total App Load FINISHED at ${Date.now() - start}ms`);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return <LoadingState />;
  }

  // Show Active events regardless of stock to display Sold Out state if needed
  const activeEvent = events && events.length > 0 ? events.find(event => event.status === 'ACTIVE') : null;

  const handleAdminClick = () => {
    navigate('/admin');
  };

  const handleHomeClick = () => {
    navigate('/');
  };

  const handleJoinClick = () => {
    if (!user) {
      setShowAuthModal(true);
    } else {
      setShowBookingModal(true);
    }
  };

  return (
    <Routes>
      <Route path="/admin" element={
        <ProtectedRoute requireAdmin>
          <ThemeLayout variant="dark">
            <AdminPage onBack={handleHomeClick} />
          </ThemeLayout>
        </ProtectedRoute>
      } />
      <Route path="/ticket/:id" element={
        <ProtectedRoute>
          <ThemeLayout variant="dark">
            <TicketViewPage />
          </ThemeLayout>
        </ProtectedRoute>
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
              <StickyFooter
                event={activeEvent}
                onJoin={handleJoinClick}
              />
            </>
          )}
          {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
          {showBookingModal && activeEvent && (
            <BookingModal
              eventId={parseInt(activeEvent.id.toString())}
              eventPrice={activeEvent.price}
              user={user}
              onClose={() => setShowBookingModal(false)}
              onSuccess={(queue) => {
                // Optionally show success message or refresh data
                console.log('Joined queue:', queue);
                // Maybe navigate to profile or reload?
                window.location.reload();
              }}
            />
          )}
        </ThemeLayout>
      } />
    </Routes>
  );
};

const App = () => {
  return <AppContent />;
};

export default App;