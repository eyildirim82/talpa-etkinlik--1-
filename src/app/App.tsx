import React from 'react';
import { LoadingState } from '@/components/common/LoadingState';
import { AppProviders } from './providers';
import { AppRoutes } from './routes';
import { useAppBootstrap } from './hooks/useAppBootstrap';

const AppContent = () => {
  const { loading, user, events } = useAppBootstrap();

  if (loading) {
    return <LoadingState />;
  }

  const activeEvent = events && events.length > 0 ? events.find(event => event.is_active) : null;

  return (
    <AppProviders>
      <AppRoutes user={user} activeEvent={activeEvent || null} />
    </AppProviders>
  );
};

const App = () => {
  return <AppContent />;
};

export default App;