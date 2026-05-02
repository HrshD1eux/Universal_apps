'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { safeInvoke, isTauri } from '@/lib/tauri-utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Calendar, Percent, Zap, Wallet, ArrowRight, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, numberToWords } from '@/lib/utils';
import { useLanguage } from '@/context/language-context';
import { useSettings } from '@/context/settings-context';

export default function GoalPlanner() {
  const [target, setTarget] = useState('10000000'); // 1 Crore
  const [rate, setRate] = useState('12');
  const [years, setYears] = useState('15');
  const [result, setResult] = useState<any>(null);
  const { showWords, t } = useLanguage();
  const { currency } = useSettings();
  const { toast } = useToast();

  const handleCalculate = async () => {
    if (!isTauri()) return;

    try {
      const res = await safeInvoke<any>('calculate_goal_sip', {
        targetAmount: parseFloat(target),
        annualRate: parseFloat(rate),
        years: parseFloat(years)
      });
      setResult(res);
    } catch (err) {
      toast({
        title: "Calculation Error",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (target && rate && years) {
      handleCalculate();
    }
  }, [target, rate, years]);

  return (
    <Card className="max-w-5xl mx-auto border-none shadow-2xl bg-gradient-to-br from-background via-muted/50 to-background overflow-hidden relative">
      <CardHeader className="bg-primary/5 border-b border-primary/10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <Target className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <CardTitle className="text-2xl">{t('goalTitle')}</CardTitle>
            <CardDescription>{t('goalDesc')}</CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,1.2fr] gap-12">
          {/* Inputs Section */}
          <div className="space-y-8">
            <div className="space-y-2">
              <label className="text-sm font-semibold flex items-center gap-2">
                <Wallet className="w-4 h-4 text-primary" />
                {t('targetAmount')}
              </label>
              <Input
                type="number"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="h-14 text-xl border-2 rounded-2xl focus:ring-primary font-mono"
              />
              <div className="flex justify-between items-center px-1 mt-1.5 min-h-[1.25rem]">
                <p className="text-[11px] font-bold text-primary/90">
                  {target ? formatCurrency(target, currency) : ''}
                </p>
                {showWords && target && (
                  <p className="text-[10px] text-muted-foreground font-bold italic text-right">
                    {numberToWords(target, currency)}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <Percent className="w-4 h-4 text-primary" />
                  Expected Return (%)
                </label>
                <Input
                  type="number"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  className="h-14 text-xl border-2 rounded-2xl font-mono"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  Time Frame (Years)
                </label>
                <Input
                  type="number"
                  value={years}
                  onChange={(e) => setYears(e.target.value)}
                  className="h-14 text-xl border-2 rounded-2xl font-mono"
                />
              </div>
            </div>

            <div className="p-6 rounded-[2rem] bg-blue-500/5 border-2 border-dashed border-blue-500/20">
               <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-600">
                     <Zap className="w-6 h-6" />
                  </div>
                  <div>
                     <p className="text-sm font-bold">Dream Big</p>
                     <p className="text-xs text-muted-foreground">
                        Define your target and we'll tell you the exact monthly discipline needed to get there.
                     </p>
                  </div>
               </div>
            </div>
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            <AnimatePresence mode="wait">
              {result && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-2xl shadow-blue-500/20 relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                        <Wallet className="w-32 h-32" />
                     </div>
                     <p className="text-xs uppercase font-black tracking-widest opacity-60 mb-2">{t('monthlyNeeded')}</p>
                     <p className="text-5xl font-black mb-1">{formatCurrency(result.monthly_needed, currency)}</p>
                     {showWords && (
                        <p className="text-[10px] font-bold italic opacity-80 mb-6 leading-tight">
                          {numberToWords(result.monthly_needed, currency)}
                        </p>
                     )}
                     
                     <div className="flex items-center gap-3 pt-6 border-t border-white/10">
                        <ArrowRight className="w-5 h-5 opacity-60" />
                        <p className="text-sm font-medium opacity-90">
                           To reach {formatCurrency(target, currency)} in {years} years.
                        </p>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="p-6 rounded-3xl bg-muted/30 border-2 border-border/50 space-y-1">
                        <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Total Principal</p>
                        <p className="text-xl font-bold">{formatCurrency(result.total_invested, currency)}</p>
                        {showWords && (
                           <p className="text-[8px] font-bold italic text-muted-foreground leading-tight">
                             {numberToWords(result.total_invested, currency)}
                           </p>
                        )}
                     </div>
                     <div className="p-6 rounded-3xl bg-green-500/5 border-2 border-green-500/20 space-y-1">
                        <div className="flex items-center justify-between">
                           <p className="text-[10px] uppercase font-black text-green-700 tracking-widest">Returns Needed</p>
                           <TrendingUp className="w-3 h-3 text-green-600" />
                        </div>
                        <p className="text-xl font-bold text-green-600">{formatCurrency(result.interest_earned, currency)}</p>
                        {showWords && (
                           <p className="text-[8px] font-bold italic text-green-600/70 leading-tight">
                             {numberToWords(result.interest_earned, currency)}
                           </p>
                        )}
                     </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
