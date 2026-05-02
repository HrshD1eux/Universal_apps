'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { safeInvoke, isTauri } from '@/lib/tauri-utils';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, IndianRupee, Calendar, Percent, PieChart as PieIcon, Zap, Wallet, ArrowUpRight, Landmark } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, numberToWords } from '@/lib/utils';
import { useLanguage } from '@/context/language-context';
import { useSettings } from '@/context/settings-context';

export default function StepUpSIPCalculator() {
  const [initialInvestment, setInitialInvestment] = useState('25000');
  const [rate, setRate] = useState('12');
  const [years, setYears] = useState('20');
  const [stepUp, setStepUp] = useState('10');
  const [result, setResult] = useState<any>(null);
  const { showWords, t } = useLanguage();
  const { currency } = useSettings();
  const { toast } = useToast();

  const handleCalculate = async () => {
    if (!isTauri()) return;

    try {
      const res = await safeInvoke<any>('calculate_step_up_sip', {
        initialMonthly: parseFloat(initialInvestment),
        annualRate: parseFloat(rate),
        years: parseInt(years),
        stepUpPercent: parseFloat(stepUp)
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
    if (initialInvestment && rate && years && stepUp) {
      handleCalculate();
    }
  }, [initialInvestment, rate, years, stepUp]);

  return (
    <Card className="max-w-5xl mx-auto border-none shadow-2xl bg-gradient-to-br from-background via-muted/50 to-background overflow-hidden relative">
      <CardHeader className="bg-primary/5 border-b border-primary/10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-500/10 rounded-lg">
            <TrendingUp className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <CardTitle className="text-2xl">{t('stepUpTitle')}</CardTitle>
            <CardDescription>{t('stepUpDesc')}</CardDescription>
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
                {t('initialInvestment')}
              </label>
              <Input
                type="number"
                value={initialInvestment}
                onChange={(e) => setInitialInvestment(e.target.value)}
                className="h-14 text-xl border-2 rounded-2xl focus:ring-primary font-mono"
              />
              <div className="flex justify-between items-center px-1 mt-1.5 min-h-[1.25rem]">
                <p className="text-[11px] font-bold text-primary/90">
                  {initialInvestment ? formatCurrency(initialInvestment, currency) : ''}
                </p>
                {showWords && initialInvestment && (
                  <p className="text-[10px] text-muted-foreground font-bold italic text-right">
                    {numberToWords(initialInvestment, currency)}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <Percent className="w-4 h-4 text-primary" />
                  Return (%)
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
                  Years
                </label>
                <Input
                  type="number"
                  value={years}
                  onChange={(e) => setYears(e.target.value)}
                  className="h-14 text-xl border-2 rounded-2xl font-mono"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold flex items-center gap-2">
                <ArrowUpRight className="w-4 h-4 text-green-600" />
                {t('stepUpPercent')}
              </label>
              <div className="relative">
                <Input
                  type="number"
                  value={stepUp}
                  onChange={(e) => setStepUp(e.target.value)}
                  className="h-14 text-xl border-2 rounded-2xl focus:ring-green-500 font-mono"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">%</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-green-500/5 border border-green-500/20 space-y-2">
               <div className="flex items-center gap-2 text-[10px] font-black text-green-700 uppercase tracking-widest">
                  <Zap className="w-4 h-4" />
                  Why Step-up?
               </div>
               <p className="text-[10px] text-muted-foreground leading-relaxed">
                  As your salary increases annually, stepping up your SIP by just {stepUp}% can lead to significantly higher wealth creation compared to a normal SIP.
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
                  <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-green-600 to-emerald-700 text-white shadow-2xl shadow-green-500/20 relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                        <TrendingUp className="w-32 h-32" />
                     </div>
                     <p className="text-xs uppercase font-black tracking-widest opacity-60 mb-2">Estimated Wealth</p>
                     <p className="text-5xl font-black mb-1">{formatCurrency(result.total_value, currency)}</p>
                     {showWords && (
                        <p className="text-[10px] font-bold italic opacity-80 mb-6 leading-tight">
                          {numberToWords(result.total_value, currency)}
                        </p>
                     )}
                     
                     <div className="grid grid-cols-2 gap-6 pt-6 border-t border-white/10">
                        <div>
                           <p className="text-[10px] uppercase font-bold opacity-60 mb-1">Total Invested</p>
                           <p className="text-xl font-bold">{formatCurrency(result.invested_amount, currency)}</p>
                           {showWords && (
                              <p className="text-[8px] font-bold italic opacity-70 leading-tight">
                                {numberToWords(result.invested_amount, currency)}
                              </p>
                           )}
                        </div>
                        <div>
                           <p className="text-[10px] uppercase font-bold opacity-60 mb-1">Wealth Gained</p>
                           <p className="text-xl font-bold">{formatCurrency(result.wealth_gained, currency)}</p>
                           {showWords && (
                              <p className="text-[8px] font-bold italic opacity-70 leading-tight">
                                {numberToWords(result.wealth_gained, currency)}
                              </p>
                           )}
                        </div>
                     </div>
                  </div>

                  <div className="space-y-3">
                     <h4 className="text-sm font-bold flex items-center gap-2 ml-1">
                        <Landmark className="w-4 h-4 text-primary" />
                        Yearly Investment Schedule
                     </h4>
                     <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {result.yearly_breakup.map((row: any) => (
                           <div key={row.year} className="p-4 rounded-2xl bg-muted/30 border text-sm flex justify-between items-center group hover:bg-muted/50 transition-colors">
                              <div className="flex items-center gap-4">
                                 <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-xs text-primary">
                                    Y{row.year}
                                 </div>
                                 <div className="space-y-0.5">
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">SIP Amount</p>
                                    <p className="font-bold">{formatCurrency(row.investment, currency)} / mo</p>
                                 </div>
                              </div>
                              <div className="text-right">
                                 <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Expected Value</p>
                                 <p className="font-bold font-mono text-green-600">{formatCurrency(row.value, currency)}</p>
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
