'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'amber' | 'blue' | 'green' | 'purple' | 'rose';
type Currency = 'INR' | 'USD' | 'EUR' | 'GBP';
type Mode = 'light' | 'dark';

interface SettingsContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  mode: Mode;
  setMode: (mode: Mode) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('amber');
  const [currency, setCurrency] = useState<Currency>('INR');
  const [mode, setMode] = useState<Mode>('dark');

  // Load from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('app-theme') as Theme;
    const savedCurrency = localStorage.getItem('app-currency') as Currency;
    const savedMode = localStorage.getItem('app-mode') as Mode;
    if (savedTheme) setTheme(savedTheme);
    if (savedCurrency) setCurrency(savedCurrency);
    if (savedMode) setMode(savedMode);
  }, []);

  // Apply theme and mode to html
  useEffect(() => {
    const root = document.documentElement;
    // Remove all theme classes
    root.classList.remove('theme-blue', 'theme-green', 'theme-purple', 'theme-rose');
    
    if (theme !== 'amber') {
      root.classList.add(`theme-${theme}`);
    }
    
    // Handle mode
    if (mode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    localStorage.setItem('app-theme', theme);
    localStorage.setItem('app-mode', mode);
  }, [theme, mode]);

  useEffect(() => {
    localStorage.setItem('app-currency', currency);
  }, [currency]);

  return (
    <SettingsContext.Provider value={{ theme, setTheme, currency, setCurrency, mode, setMode }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
