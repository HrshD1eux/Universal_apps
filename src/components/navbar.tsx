'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft, LayoutGrid, Calculator, FileText, Settings as SettingsIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

import { useLanguage } from '@/context/language-context';

export default function Navbar() {
  const pathname = usePathname();
  const isHome = pathname === '/';
  const { language, setLanguage, showWords, setShowWords, t } = useLanguage();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl transition-all">
      <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg overflow-hidden transition-transform group-hover:rotate-6">
              <img src="/icon.png" alt="Logo" className="w-full h-full object-cover" />
            </div>
            {isHome && <span className="font-bold text-lg tracking-tighter">{t('appTitle')}</span>}
          </Link>

          <AnimatePresence mode="wait">
            {!isHome && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
              >
                <Link href="/">
                  <Button variant="ghost" size="sm" className="rounded-full gap-2 pl-2 pr-4 hover:bg-primary/10 hover:text-primary transition-all">
                    <ChevronLeft className="w-4 h-4" />
                    <span className="font-bold text-xs uppercase tracking-widest">{t('backToApps')}</span>
                  </Button>
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-muted/50 rounded-full p-1 border">
            <Button 
              variant={showWords ? 'default' : 'ghost'} 
              size="sm" 
              onClick={() => setShowWords(!showWords)}
              className="rounded-full h-7 w-7 p-0 transition-all"
              title="Show amount in words"
            >
              <FileText className="w-3.5 h-3.5" />
            </Button>
            <div className="w-[1px] h-4 bg-border mx-1" />
            <Button
              variant={language === 'en' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setLanguage('en')}
              className="rounded-full h-7 px-3 text-[10px] font-bold transition-all"
            >
              EN
            </Button>
            <Button
              variant={language === 'hi' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setLanguage('hi')}
              className="rounded-full h-7 px-3 text-[10px] font-bold transition-all"
            >
              Hinglish
            </Button>
          </div>

          <Link href="/settings">
            <Button 
              variant="ghost" 
              size="icon" 
              className={`rounded-full transition-all ${pathname === '/settings' ? 'bg-primary/20 text-primary' : 'opacity-60 hover:opacity-100 hover:bg-primary/10'}`}
            >
              <SettingsIcon className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
