import React, { createContext, useContext, useState } from 'react';
import { EventData, User } from '../types';
import { logout as logoutAction } from '../actions/auth';

interface AppContextType {
  user: User | null;
  event: EventData | null;
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
  const [user, setUser] = useState<User | null>(initialUser);
  const [event] = useState<EventData | null>(initialEvent);
  const [isLoading, setIsLoading] = useState(false);

  const logout = async () => {
    setIsLoading(true);
    await logoutAction();
    setUser(null);
    setIsLoading(false);
  };

  return (
    <AppContext.Provider value={{ user, event, isLoading, logout }}>
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