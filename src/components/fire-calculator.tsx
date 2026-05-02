'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Wallet, Calendar, Percent, Zap, PiggyBank, Target, ArrowRight } from 'lucide-react';
import { safeInvoke, isTauri } from '@/lib/tauri-utils';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';
import { useLanguage } from '@/context/language-context';
import { useSettings } from '@/context/settings-context';

export default function FireCalculator() {
  const [currentAge, setCurrentAge] = useState('30');
  const [targetAge, setTargetAge] = useState('45');
  const [expenses, setExpenses] = useState('50000');
  const [inflation, setInflation] = useState('6');
  const [swr, setSwr] = useState('4');
  const [result, setResult] = useState<any>(null);
  const { t } = useLanguage();
  const { currency } = useSettings();
  const { toast } = useToast();

  const handleCalculate = async () => {
    if (!isTauri()) return;
    try {
      const res = await safeInvoke<any>('calculate_fire_projection', {
        currentAge: parseInt(currentAge),
        targetAge: parseInt(targetAge),
        monthlyExpenses: parseFloat(expenses),
        inflationRate: parseFloat(inflation),
        swr: parseFloat(swr)
      });
      setResult(res);
    } catch (err) {
      toast({ title: "Calculation Error", description: String(err), variant: "destructive" });
    }
  };

  useEffect(() => {
    if (currentAge && targetAge && expenses) handleCalculate();
  }, [currentAge, targetAge, expenses, inflation, swr]);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <Card className="border-none shadow-2xl bg-gradient-to-br from-background via-muted/50 to-background overflow-hidden">
        <CardHeader className="bg-primary/5 border-b border-primary/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <Flame className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <CardTitle className="text-2xl">{t('fireTitle')}</CardTitle>
              <CardDescription>{t('fireDesc')}</CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr,1.5fr] gap-12">
            <div className="space-y-6">
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <label className="text-sm font-bold opacity-60 uppercase tracking-widest ml-1">Current Age</label>
                     <Input type="number" value={currentAge} onChange={(e) => setCurrentAge(e.target.value)} className="h-12 rounded-2xl border-2" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-sm font-bold opacity-60 uppercase tracking-widest ml-1">Target Retirement</label>
                     <Input type="number" value={targetAge} onChange={(e) => setTargetAge(e.target.value)} className="h-12 rounded-2xl border-2" />
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-sm font-bold opacity-60 uppercase tracking-widest ml-1">Current Monthly Expenses</label>
                  <Input type="number" value={expenses} onChange={(e) => setExpenses(e.target.value)} className="h-14 text-xl rounded-2xl border-2 font-mono" />
                  <p className="text-[10px] font-bold text-orange-600 px-1">{formatCurrency(expenses, currency)} / mo</p>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <label className="text-sm font-bold opacity-60 uppercase tracking-widest ml-1">Inflation (%)</label>
                     <Input type="number" value={inflation} onChange={(e) => setInflation(e.target.value)} className="h-12 rounded-2xl border-2" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-sm font-bold opacity-60 uppercase tracking-widest ml-1">Withdrawal Rate (%)</label>
                     <Input type="number" value={swr} onChange={(e) => setSwr(e.target.value)} className="h-12 rounded-2xl border-2" />
                  </div>
               </div>

               <div className="p-6 rounded-[2rem] bg-orange-500/5 border-2 border-dashed border-orange-500/20">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                     The **4% Rule** is a common benchmark for FIRE, suggesting you can safely withdraw 4% of your portfolio annually without running out of money.
                  </p>
               </div>
            </div>

            {/* Results */}
            <div className="space-y-8">
               <AnimatePresence mode="wait">
                  {result && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="space-y-8"
                    >
                       <div className="p-10 rounded-[3rem] bg-gradient-to-br from-orange-600 to-red-700 text-white shadow-2xl shadow-orange-500/20 relative overflow-hidden group text-center">
                          <p className="text-xs uppercase font-black tracking-widest opacity-60 mb-2">Corpus Needed for Retirement</p>
                          <p className="text-5xl font-black mb-1">{formatCurrency(result.corpus_needed, currency)}</p>
                          <p className="text-sm font-bold opacity-80 mt-4 flex items-center justify-center gap-2">
                             In {result.years_to_fire} Years <ArrowRight className="w-4 h-4" /> Age {targetAge}
                          </p>
                       </div>

                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="p-6 rounded-[2rem] border-2 bg-card relative overflow-hidden group">
                             <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center mb-3 text-primary">
                                <Wallet className="w-5 h-5" />
                             </div>
                             <p className="text-[10px] font-black uppercase opacity-60 tracking-widest mb-1">Monthly Expense Then</p>
                             <p className="text-xl font-black">{formatCurrency(result.future_annual_expenses / 12, currency)}</p>
                          </div>
                          <div className="p-6 rounded-[2rem] border-2 bg-card relative overflow-hidden group">
                             <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center mb-3 text-primary">
                                <PiggyBank className="w-5 h-5" />
                             </div>
                             <p className="text-[10px] font-black uppercase opacity-60 tracking-widest mb-1">Total Savings Goal</p>
                             <p className="text-xl font-black">{formatCurrency(result.corpus_needed, currency)}</p>
                          </div>
                       </div>

                       <div className="p-8 rounded-[2.5rem] bg-muted/50 border-2 border-dashed border-border flex items-center gap-6">
                          <div className="p-4 bg-primary/10 rounded-2xl text-primary">
                             <Target className="w-8 h-8" />
                          </div>
                          <div>
                             <p className="text-sm font-bold">Retirement Readiness</p>
                             <p className="text-xs text-muted-foreground">Start investing early to harness the power of compounding and hit your target of {targetAge} sooner.</p>
                          </div>
                       </div>
                    </motion.div>
                  )}
               </AnimatePresence>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
