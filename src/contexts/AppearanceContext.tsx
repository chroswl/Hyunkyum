import React, { createContext, useState, useEffect, useContext } from 'react';
import type { ThemeSettings } from '../types';
import { fetchThemeSettings } from '../firebase';

export interface AppearanceContextType {
  theme: ThemeSettings | null;
  setTheme: (theme: ThemeSettings) => void;
  isLoading: boolean;
}

const AppearanceContext = createContext<AppearanceContextType | undefined>(undefined);

export function AppearanceProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchThemeSettings().then(data => {
      setThemeState(data);
      setIsLoading(false);
    });
  }, []);

  const setTheme = (newTheme: ThemeSettings) => {
    setThemeState(newTheme);
  };

  return (
    <AppearanceContext.Provider value={{ theme, setTheme, isLoading }}>
      {children}
    </AppearanceContext.Provider>
  );
}

export function useAppearance() {
  const context = useContext(AppearanceContext);
  if (!context) {
    throw new Error('useAppearance must be used within an AppearanceProvider');
  }
  return context;
}
