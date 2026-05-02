'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { Banknote, TrendingUp, ShieldCheck, Scale, Zap, Info, ArrowRight, MinusCircle, PlusCircle, FileText, Sparkles } from 'lucide-react';
import { safeInvoke, isTauri } from '@/lib/tauri-utils';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, numberToWords } from '@/lib/utils';
import { useLanguage } from '@/context/language-context';
import { useSettings } from '@/context/settings-context';

export default function TaxIndiaCalculator() {
  const [income, setIncome] = useState('1200000');
  const [businessIncome, setBusinessIncome] = useState('0');
  const [deductions, setDeductions] = useState('150000'); // 80C etc.
  const [result, setResult] = useState<any>(null);
  const { t, showWords } = useLanguage();
  const { currency } = useSettings();
  const { toast } = useToast();

  const handleCalculate = async () => {
    if (!isTauri()) return;
    try {
      const res = await safeInvoke<any>('calculate_income_tax_india', {
        income: parseFloat(income),
        businessIncome: parseFloat(businessIncome),
        deductions: parseFloat(deductions)
      });
      setResult(res);
    } catch (err) {
      toast({ title: "Calculation Error", description: String(err), variant: "destructive" });
    }
  };

  useEffect(() => {
    if (income || businessIncome) handleCalculate();
  }, [income, businessIncome, deductions]);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <Card className="border-none shadow-2xl bg-gradient-to-br from-background via-muted/50 to-background overflow-hidden">
        <CardHeader className="bg-primary/5 border-b border-primary/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <Banknote className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <CardTitle className="text-2xl">{t('taxIndiaTitle')}</CardTitle>
              <CardDescription>{t('taxIndiaDesc')}</CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr,1.5fr] gap-12">
            <div className="space-y-8">
               <div className="space-y-4">
                  <div className="space-y-3">
                     <div className="flex justify-between items-center px-1">
                        <label className="text-[10px] font-black opacity-40 uppercase tracking-[0.2em]">Annual Salary Income</label>
                        <span className="text-[10px] font-black text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase tracking-widest">Active</span>
                     </div>
                     <Input 
                        type="number" 
                        value={income} 
                        onChange={(e) => setIncome(e.target.value)} 
                        className="h-16 rounded-2xl border-2 font-mono text-2xl font-black focus:ring-emerald-500 bg-emerald-500/[0.02]"
                     />
                     <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="p-4 rounded-2xl bg-muted/30 border-2 border-dashed flex items-center gap-3"
                     >
                        <FileText className="w-5 h-5 text-muted-foreground shrink-0" />
                        <p className="text-xs font-bold text-muted-foreground leading-tight">
                           {numberToWords(parseFloat(income))} {t('currency' as any) || 'Rupees'}
                        </p>
                     </motion.div>
                  </div>

                  <div className="space-y-3">
                     <div className="flex justify-between items-center px-1">
                        <label className="text-[10px] font-black opacity-40 uppercase tracking-[0.2em]">{t('businessIncome')} (Gross Turnover)</label>
                        <span className="text-[10px] font-black text-blue-600 bg-blue-500/10 px-2 py-0.5 rounded-full uppercase tracking-widest">44AD/44ADA</span>
                     </div>
                     <Input 
                        type="number" 
                        value={businessIncome} 
                        onChange={(e) => setBusinessIncome(e.target.value)} 
                        className="h-16 rounded-2xl border-2 font-mono text-2xl font-black focus:ring-blue-500 bg-blue-500/[0.02]"
                     />
                     <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="p-4 rounded-2xl bg-blue-500/5 border-2 border-dashed border-blue-500/20 flex items-center gap-3"
                     >
                        <Sparkles className="w-5 h-5 text-blue-600 shrink-0" />
                        <p className="text-xs font-bold text-blue-600 leading-tight">
                           {t('presumptiveTax')}: {numberToWords(parseFloat(businessIncome) * 0.06)} Profit @ 6%
                        </p>
                     </motion.div>
                  </div>

                  <div className="space-y-2">
                     <label className="text-sm font-bold opacity-60 uppercase tracking-widest ml-1">Old Regime Deductions (80C, etc)</label>
                     <Input 
                        type="number" 
                        value={deductions} 
                        onChange={(e) => setDeductions(e.target.value)} 
                        className="h-14 rounded-2xl border-2 font-mono text-xl focus:ring-emerald-500"
                     />
                     <p className="text-[10px] font-bold text-muted-foreground px-1">* New regime does not allow most deductions.</p>
                  </div>
               </div>

               <div className="p-6 rounded-[2rem] bg-emerald-500/5 border-2 border-dashed border-emerald-500/20 space-y-4">
                  <div className="flex gap-4">
                     <Info className="w-6 h-6 text-emerald-600 shrink-0" />
                     <p className="text-xs text-muted-foreground leading-relaxed">
                        Comparing FY 2024-25 (AY 2025-26) slabs. Standard deduction of ₹75,000 applied for New Regime and ₹50,000 for Old Regime.
                     </p>
                  </div>
               </div>
            </div>

            {/* Results Comparison */}
            <div className="space-y-6">
               <AnimatePresence mode="wait">
                  {result && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="grid grid-cols-1 md:grid-cols-2 gap-6"
                    >
                       {/* New Regime Card */}
                       <div className={`p-8 rounded-[2.5rem] border-2 transition-all relative overflow-hidden ${result.new_regime_tax <= result.old_regime_tax ? 'bg-emerald-600 text-white border-emerald-400 shadow-xl' : 'bg-card border-border'}`}>
                          {result.new_regime_tax <= result.old_regime_tax && (
                             <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase">RECOMMENDED</div>
                          )}
                          <p className="text-xs uppercase font-black tracking-widest opacity-60 mb-2">New Regime Tax</p>
                          <p className="text-4xl font-black mb-1">{formatCurrency(result.new_regime_tax, currency)}</p>
                          <p className="text-[10px] font-bold opacity-80 mt-4">Take Home: {formatCurrency(parseFloat(income) - result.new_regime_tax, currency)}</p>
                       </div>

                       {/* Old Regime Card */}
                       <div className={`p-8 rounded-[2.5rem] border-2 transition-all relative overflow-hidden ${result.old_regime_tax < result.new_regime_tax ? 'bg-emerald-600 text-white border-emerald-400 shadow-xl' : 'bg-card border-border'}`}>
                          {result.old_regime_tax < result.new_regime_tax && (
                             <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase">RECOMMENDED</div>
                          )}
                          <p className="text-xs uppercase font-black tracking-widest opacity-60 mb-2">Old Regime Tax</p>
                          <p className="text-4xl font-black mb-1">{formatCurrency(result.old_regime_tax, currency)}</p>
                          <p className="text-[10px] font-bold opacity-80 mt-4">Take Home: {formatCurrency(parseFloat(income) - result.old_regime_tax, currency)}</p>
                       </div>

                       {/* Savings Callout */}
                       <div className="md:col-span-2 p-8 rounded-[2.5rem] bg-amber-500/10 border-2 border-amber-500/20 flex flex-col sm:flex-row items-center justify-between gap-6">
                          <div className="flex items-center gap-4 text-center sm:text-left">
                             <div className="p-4 bg-amber-500/20 rounded-[2rem] text-amber-600">
                                <Zap className="w-8 h-8" />
                             </div>
                             <div>
                                <p className="text-sm font-black uppercase tracking-widest text-amber-600">Potential Savings</p>
                                <p className="text-3xl font-black">{formatCurrency(result.savings, currency)}</p>
                             </div>
                          </div>
                          <div className="text-right hidden sm:block">
                             <p className="text-xs font-bold text-muted-foreground">Switch to {result.new_regime_tax <= result.old_regime_tax ? 'New' : 'Old'} Regime to save</p>
                             <p className="text-[10px] font-black text-amber-600">Calculated for AY 2025-26</p>
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
