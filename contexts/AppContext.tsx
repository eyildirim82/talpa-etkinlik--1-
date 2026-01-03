import React, { createContext, useContext, useEffect, useState } from 'react';
import { EventData, User } from '../types';
import { logout } from '@/modules/auth';
import { useActiveEvent } from '@/modules/event';
import { useProfile } from '@/modules/profile';

interface AppContextType {
  user: User | null | undefined;
  event: EventData | null | undefined;
  isLoading: boolean;
  logout: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: React.ReactNode;
  initialEvent: EventData | null;
  initialUser: User | null;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children, initialEvent, initialUser }) => {
  // Use React Query hooks
  const { data: eventData, isLoading: isEventLoading } = useActiveEvent();
  const { user: userData, isLoading: isUserLoading } = useProfile();

  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    await logout();
    setIsLoading(false);
    // Note: useProfile hook monitors auth state, so it should auto-update.
    // However, we might want to reload the page or invalidate queries.
    window.location.reload();
  };

  const finalEvent = eventData ?? initialEvent; // Fallback to initial if needed, but Query is source of truth
  const finalUser = userData ?? initialUser;

  const globalLoading = isEventLoading || isUserLoading || isLoading;

  return (
    <AppContext.Provider value={{ user: finalUser, event: finalEvent, isLoading: globalLoading, logout: handleLogout }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};