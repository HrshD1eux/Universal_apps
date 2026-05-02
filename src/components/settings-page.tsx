'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Palette, Globe, Coins, Check, Moon, Sun, Monitor } from 'lucide-react';
import { useSettings } from '@/context/settings-context';
import { useLanguage } from '@/context/language-context';
import { motion } from 'framer-motion';

export default function SettingsPage() {
  const { theme, setTheme, currency, setCurrency, mode, setMode } = useSettings();
  const { t } = useLanguage();

  const themes = [
    { id: 'amber', name: t('colorAmber'), color: '#f59e0b' },
    { id: 'blue', name: t('colorBlue'), color: '#3b82f6' },
    { id: 'green', name: t('colorGreen'), color: '#22c55e' },
    { id: 'purple', name: t('colorPurple'), color: '#8b5cf6' },
    { id: 'rose', name: t('colorRose'), color: '#e11d48' },
  ] as const;

  const currencies = [
    { id: 'INR', name: 'Indian Rupee (₹)' },
    { id: 'USD', name: 'US Dollar ($)' },
    { id: 'EUR', name: 'Euro (€)' },
    { id: 'GBP', name: 'British Pound (£)' },
  ] as const;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-primary/10 rounded-2xl">
          <Settings className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h1 className="text-4xl font-black tracking-tight">{t('settings')}</h1>
          <p className="text-muted-foreground font-medium">Customize your experience and preferences.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Appearance */}
        <Card className="border-none shadow-xl bg-muted/30 overflow-hidden">
          <CardHeader className="border-b bg-background/50">
            <div className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-primary" />
              <CardTitle>{t('appearance')}</CardTitle>
            </div>
            <CardDescription>{t('themeColor')}</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Mode Toggle */}
            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Theme Mode</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setMode('light')}
                  className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                    mode === 'light' ? 'bg-primary/10 border-primary shadow-lg shadow-primary/10' : 'bg-background border-transparent hover:border-primary/30'
                  }`}
                >
                  <Sun className={`w-5 h-5 ${mode === 'light' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className="font-bold text-sm">Light</span>
                </button>
                <button
                  onClick={() => setMode('dark')}
                  className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                    mode === 'dark' ? 'bg-primary/10 border-primary shadow-lg shadow-primary/10' : 'bg-background border-transparent hover:border-primary/30'
                  }`}
                >
                  <Moon className={`w-5 h-5 ${mode === 'dark' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className="font-bold text-sm">Dark</span>
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Theme Color</label>
              <div className="grid grid-cols-1 gap-2">
              {themes.map((tItem) => (
                <button
                  key={tItem.id}
                  onClick={() => setTheme(tItem.id)}
                  className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                    theme === tItem.id 
                      ? 'bg-primary/10 border-primary shadow-lg shadow-primary/10' 
                      : 'bg-background border-transparent hover:border-primary/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-6 h-6 rounded-full shadow-inner" 
                      style={{ backgroundColor: tItem.color }} 
                    />
                    <span className="font-bold text-sm">{tItem.name}</span>
                  </div>
                  {theme === tItem.id && (
                    <motion.div layoutId="check-theme">
                      <Check className="w-5 h-5 text-primary" />
                    </motion.div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

        {/* Currency & Localization */}
        <Card className="border-none shadow-xl bg-muted/30 overflow-hidden">
          <CardHeader className="border-b bg-background/50">
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-primary" />
              <CardTitle>{t('baseCurrency')}</CardTitle>
            </div>
            <CardDescription>Select your preferred default currency.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 gap-2">
              {currencies.map((curr) => (
                <button
                  key={curr.id}
                  onClick={() => setCurrency(curr.id)}
                  className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                    currency === curr.id 
                      ? 'bg-primary/10 border-primary shadow-lg shadow-primary/10' 
                      : 'bg-background border-transparent hover:border-primary/30'
                  }`}
                >
                  <span className="font-bold text-sm">{curr.name}</span>
                  {currency === curr.id && (
                    <motion.div layoutId="check-curr">
                      <Check className="w-5 h-5 text-primary" />
                    </motion.div>
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
