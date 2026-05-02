'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { safeInvoke, isTauri } from '@/lib/tauri-utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Calendar, Percent, TrendingUp, Zap, Clock, Landmark } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, numberToWords } from '@/lib/utils';
import { useLanguage } from '@/context/language-context';
import { useSettings } from '@/context/settings-context';

export default function LocalByajCalculator() {
  const [principal, setPrincipal] = useState('2000000');
  const [rate, setRate] = useState('2');
  const [years, setYears] = useState('1');
  const [months, setMonths] = useState('0');
  const [result, setResult] = useState<any>(null);
  const { showWords, t } = useLanguage();
  const { currency } = useSettings();
  const { toast } = useToast();

  const handleCalculate = async () => {
    if (!isTauri()) return;

    try {
      const res = await safeInvoke<any>('calculate_local_byaj', {
        principal: parseFloat(principal),
        monthlyRate: parseFloat(rate),
        years: parseInt(years) || 0,
        months: parseInt(months) || 0
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
    if (principal && rate && (years || months)) {
      handleCalculate();
    }
  }, [principal, rate, years, months]);

  return (
    <Card className="max-w-5xl mx-auto border-none shadow-2xl bg-gradient-to-br from-background via-muted/50 to-background overflow-hidden relative">
      <CardHeader className="bg-primary/5 border-b border-primary/10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Coins className="w-6 h-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl">{t('byajTitle')}</CardTitle>
            <CardDescription>{t('byajDesc')}</CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,1.2fr] gap-12">
          {/* Inputs Section */}
          <div className="space-y-8">
            <div className="space-y-2">
              <label className="text-sm font-semibold flex items-center gap-2">
                <Coins className="w-4 h-4 text-primary" />
                {t('principalAmount')}
              </label>
              <div className="relative group">
                <Input
                  type="number"
                  value={principal}
                  onChange={(e) => setPrincipal(e.target.value)}
                className="h-14 text-2xl border-2 rounded-2xl focus:ring-primary font-mono pr-12"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">₹</div>
              </div>
              <div className="flex justify-between items-center px-1 mt-1.5 min-h-[1.25rem]">
                <p className="text-[11px] font-bold text-primary/90">
                  {principal ? formatCurrency(principal, currency) : ''}
                </p>
                {showWords && principal && (
                  <p className="text-[10px] text-muted-foreground font-bold italic animate-in fade-in slide-in-from-top-1 text-right">
                    {numberToWords(principal, currency)}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <Percent className="w-4 h-4 text-primary" />
                  {t('monthlyRate')}
                </label>
                <div className="relative">
                  <Input
                    type="number"
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    className="h-14 text-xl border-2 rounded-2xl font-mono pr-12"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                    ₹/100
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground italic px-1">
                  * Interest calculated per month (e.g., ₹2 per ₹100)
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    {t('tenureYears')}
                  </label>
                  <Input
                    type="number"
                    value={years}
                    onChange={(e) => setYears(e.target.value)}
                    className="h-14 text-xl border-2 rounded-2xl font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    Months
                  </label>
                  <Input
                    type="number"
                    value={months}
                    onChange={(e) => setMonths(e.target.value)}
                    className="h-14 text-xl border-2 rounded-2xl font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 space-y-2">
               <div className="flex flex-wrap items-center gap-2 text-[10px] font-black text-primary uppercase tracking-widest">
                  <Zap className="w-4 h-4" />
                  {t('annualCompounding')}
               </div>
               <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Monthly simple interest is calculated. At the end of every year, the interest is added to the principal for next year's calculation.
               </p>
            </div>
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            <AnimatePresence mode="wait">
              {result && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-6"
                >
                  <div className="p-8 rounded-[2.5rem] bg-primary text-primary-foreground shadow-2xl shadow-primary/20 relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                        <TrendingUp className="w-32 h-32" />
                     </div>
                     <p className="text-xs uppercase font-black tracking-widest opacity-60 mb-2">Total Interest (Byaj)</p>
                     <p className="text-5xl font-black mb-1">{formatCurrency(result.total_interest, currency)}</p>
                     {showWords && (
                        <p className="text-[10px] font-bold italic opacity-80 mb-6 leading-tight">
                          {numberToWords(result.total_interest, currency)}
                        </p>
                     )}
                      <div className="mb-4">
                      </div>
                     
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-white/20">
                        <div>
                           <p className="text-[10px] uppercase font-bold opacity-60 mb-1">Monthly Interest</p>
                           <p className="text-xl font-bold">{formatCurrency(result.monthly_interest, currency)}</p>
                           {showWords && (
                              <p className="text-[8px] font-bold italic opacity-70 leading-tight">
                                {numberToWords(result.monthly_interest, currency)}
                              </p>
                           )}
                        </div>
                        <div>
                           <p className="text-[10px] uppercase font-bold opacity-60 mb-1">Total Amount</p>
                           <p className="text-xl font-bold">{formatCurrency(result.final_amount, currency)}</p>
                           {showWords && (
                              <p className="text-[8px] font-bold italic opacity-70 leading-tight">
                                {numberToWords(result.final_amount, currency)}
                              </p>
                           )}
                        </div>
                     </div>
                  </div>

                  <div className="space-y-3">
                     <h4 className="text-sm font-bold flex items-center gap-2 ml-1">
                        <Landmark className="w-4 h-4 text-primary" />
                        Yearly Growth (Annual Compounding)
                     </h4>
                     <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {result.yearly_breakup.map((row: any) => (
                           <div key={row.year} className="p-4 rounded-2xl bg-muted/30 border text-sm flex justify-between items-center group hover:bg-muted/50 transition-colors">
                              <div className="flex items-center gap-4">
                                 <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-xs text-primary">
                                    Y{row.year}
                                 </div>
                                 <div className="space-y-0.5">
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Interest</p>
                                    <p className="font-bold">{formatCurrency(row.interest, currency)}</p>
                                 </div>
                              </div>
                              <div className="text-right">
                                 <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Closing</p>
                                 <p className="font-bold font-mono text-primary">{formatCurrency(row.closing_balance, currency)}</p>
                              </div>
                           </div>
                        ))}
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
