'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { safeInvoke, isTauri } from '@/lib/tauri-utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Wallet, Calendar, Percent, TrendingDown, Zap, Clock, ShieldCheck as ShieldCheckIcon, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, numberToWords } from '@/lib/utils';
import { useLanguage } from '@/context/language-context';
import { useSettings } from '@/context/settings-context';

export default function MortgageCalculator() {
  const [principal, setPrincipal] = useState('5000000');
  const [rate, setRate] = useState('8.5');
  const [years, setYears] = useState('20');
  const [extraPayment, setExtraPayment] = useState('0');
  const [result, setResult] = useState<any>(null);
  const { showWords } = useLanguage();
  const { currency } = useSettings();
  const { toast } = useToast();

  const handleCalculate = async () => {
    if (!isTauri()) return;

    try {
      const res = await safeInvoke<any>('calculate_mortgage', {
        principal: parseFloat(principal),
        annualRate: parseFloat(rate),
        years: parseFloat(years),
        extraPayment: parseFloat(extraPayment) || 0
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
    if (principal && rate && years) {
      handleCalculate();
    }
  }, [principal, rate, years, extraPayment]);

  return (
    <Card className="max-w-5xl mx-auto border-none shadow-2xl bg-gradient-to-br from-background via-muted/50 to-background overflow-hidden relative">
      <CardHeader className="bg-primary/5 border-b border-primary/10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Home className="w-6 h-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl">Advanced Mortgage Calculator</CardTitle>
            <CardDescription>Plan your home loan with extra payments to save on interest.</CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,1.2fr] gap-12">
          {/* Inputs */}
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold flex items-center gap-2">
                <Wallet className="w-4 h-4 text-primary" />
                Property Price
              </label>
              <Input
                type="number"
                value={principal}
                onChange={(e) => setPrincipal(e.target.value)}
                className="h-14 text-xl border-2 rounded-2xl focus:ring-primary font-mono"
              />
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <Percent className="w-4 h-4 text-primary" />
                  Interest Rate (%)
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
                  Loan Term (Years)
                </label>
                <Input
                  type="number"
                  value={years}
                  onChange={(e) => setYears(e.target.value)}
                  className="h-14 text-xl border-2 rounded-2xl font-mono"
                />
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-border/50">
              <label className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Extra Monthly Payment (Optional)
              </label>
              <Input
                type="number"
                value={extraPayment}
                onChange={(e) => setExtraPayment(e.target.value)}
                placeholder="0"
                className="h-14 text-xl border-2 border-primary/20 bg-primary/5 rounded-2xl focus:ring-primary font-mono"
              />
              <p className="text-[10px] text-muted-foreground italic px-1">
                Adding extra payments can reduce your loan term significantly.
              </p>
            </div>
          </div>

          {/* Results Summary */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="p-8 rounded-[3rem] bg-primary text-primary-foreground shadow-2xl shadow-primary/20 relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-8 opacity-10">
                      <Home className="w-32 h-32" />
                   </div>
                   <p className="text-xs uppercase font-black tracking-widest opacity-60 mb-2">Monthly EMI</p>
                   <p className="text-5xl font-black mb-1">{formatCurrency(result.monthly_payment, currency)}</p>
                   {showWords && (
                      <p className="text-[10px] font-bold italic opacity-80 mb-6 leading-tight">
                        {numberToWords(result.monthly_payment, currency)}
                      </p>
                   )}
                   
                   <div className="grid grid-cols-2 gap-6 pt-6 border-t border-white/20">
                      <div>
                         <p className="text-[10px] uppercase font-bold opacity-60 mb-1">Total Interest</p>
                         <p className="text-xl font-bold">{formatCurrency(result.total_interest, currency)}</p>
                         {showWords && (
                            <p className="text-[8px] font-bold italic opacity-70 leading-tight">
                              {numberToWords(result.total_interest, currency)}
                            </p>
                         )}
                      </div>
                      <div>
                         <p className="text-[10px] uppercase font-bold opacity-60 mb-1">Total Cost</p>
                         <p className="text-xl font-bold">{formatCurrency(result.total_payment, currency)}</p>
                         {showWords && (
                            <p className="text-[8px] font-bold italic opacity-70 leading-tight">
                              {numberToWords(result.total_payment, currency)}
                            </p>
                         )}
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="p-6 rounded-3xl border-2 bg-card flex items-center gap-4">
                      <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-600">
                         <Clock className="w-6 h-6" />
                      </div>
                      <div>
                         <p className="text-[10px] font-black uppercase text-muted-foreground">New Payoff Time</p>
                         <p className="text-xl font-black">{result.payoff_years} Years</p>
                      </div>
                   </div>
                   <div className="p-6 rounded-3xl border-2 bg-card flex items-center gap-4">
                      <div className="p-3 bg-green-500/10 rounded-2xl text-green-600">
                         <ShieldCheckIcon className="w-6 h-6" />
                      </div>
                      <div>
                         <p className="text-[10px] font-black uppercase text-muted-foreground">Savings Status</p>
                         <p className="text-xl font-black text-green-600">
                            {parseFloat(extraPayment) > 0 ? 'Interest Saved!' : 'Standard Pay'}
                         </p>
                      </div>
                   </div>
                </div>

                {parseFloat(extraPayment) > 0 && (
                   <div className="p-4 rounded-2xl bg-primary/10 border-2 border-primary/20 text-primary text-sm flex items-center gap-3">
                      <Info className="w-5 h-5 flex-shrink-0" />
                      <p>By paying <b>{formatCurrency(extraPayment, currency)}</b> extra monthly, you finish your loan <b>{(parseFloat(years) - result.payoff_years).toFixed(1)} years</b> earlier.</p>
                   </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}
