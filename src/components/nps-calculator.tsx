'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { safeInvoke, isTauri } from '@/lib/tauri-utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Calendar, Percent, PieChart as PieIcon, Zap, Briefcase, HeartHandshake, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { formatCurrency, numberToWords } from '@/lib/utils';
import { useLanguage } from '@/context/language-context';
import { useSettings } from '@/context/settings-context';

export default function NPSCalculator() {
  const [monthly, setMonthly] = useState('10000');
  const [rate, setRate] = useState('10');
  const [age, setAge] = useState('30');
  const [annuityPct, setAnnuityPct] = useState(40);
  const [annuityRate, setAnnuityRate] = useState('6');
  const [result, setResult] = useState<any>(null);
  const { showWords, t } = useLanguage();
  const { currency } = useSettings();
  const { toast } = useToast();

  const handleCalculate = async () => {
    if (!isTauri()) return;

    try {
      const res = await safeInvoke<any>('calculate_nps', {
        monthlyInvestment: parseFloat(monthly),
        annualRate: parseFloat(rate),
        currentAge: parseInt(age),
        annuityPercent: annuityPct,
        annuityRate: parseFloat(annuityRate)
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
    if (monthly && rate && age && annuityRate) {
      handleCalculate();
    }
  }, [monthly, rate, age, annuityPct, annuityRate]);

  const pieData = result ? [
    { name: 'Lump Sum', value: parseFloat(result.lump_sum_withdrawal), color: 'hsl(var(--primary))' },
    { name: 'Annuity Corpus', value: parseFloat(result.annuity_corpus), color: '#10b981' }
  ] : [];

  return (
    <Card className="max-w-6xl mx-auto border-none shadow-2xl bg-gradient-to-br from-background via-muted/50 to-background overflow-hidden relative">
      <CardHeader className="bg-primary/5 border-b border-primary/10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-lg">
            <Wallet className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <CardTitle className="text-2xl">{t('npsTitle')}</CardTitle>
            <CardDescription>{t('npsDesc')}</CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,1.4fr] gap-12">
          {/* Inputs */}
          <div className="space-y-8">
            <div className="space-y-2">
              <label className="text-sm font-semibold flex items-center gap-2">
                <Wallet className="w-4 h-4 text-primary" />
                {t('monthlyInvestment')}
              </label>
              <Input
                type="number"
                value={monthly}
                onChange={(e) => setMonthly(e.target.value)}
                className="h-14 text-xl border-2 rounded-2xl focus:ring-primary font-mono"
              />
              <div className="flex justify-between items-center px-1 mt-1.5 min-h-[1.25rem]">
                <p className="text-[11px] font-bold text-primary/90">
                  {monthly ? formatCurrency(monthly, currency) : ''}
                </p>
                {showWords && monthly && (
                  <p className="text-[10px] text-muted-foreground font-bold italic text-right">
                    {numberToWords(monthly, currency)}
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
                  {t('currentAge')}
                </label>
                <Input
                  type="number"
                  value={age}
                  min="18"
                  max="59"
                  onChange={(e) => setAge(e.target.value)}
                  className="h-14 text-xl border-2 rounded-2xl font-mono"
                />
              </div>
            </div>

            <div className="space-y-4">
               <div className="flex justify-between items-center">
                  <label className="text-sm font-semibold flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    {t('annuityPercent')}
                  </label>
                  <span className="text-sm font-black text-primary bg-primary/10 px-3 py-1 rounded-full">{annuityPct}%</span>
               </div>
               <Slider 
                  value={[annuityPct]} 
                  onValueChange={(v) => setAnnuityPct(v[0])} 
                  min={40} 
                  max={100} 
                  step={1} 
               />
               <p className="text-[10px] text-muted-foreground font-medium italic">* Minimum 40% reinvestment is required by law.</p>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <HeartHandshake className="w-4 h-4 text-primary" />
                  {t('annuityRate')}
                </label>
                <Input
                  type="number"
                  value={annuityRate}
                  onChange={(e) => setAnnuityRate(e.target.value)}
                  className="h-14 text-xl border-2 rounded-2xl font-mono"
                />
            </div>
          </div>

          {/* Results Summary */}
          <div className="space-y-6">
            <AnimatePresence mode="wait">
              {result && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {/* Pension Card */}
                     <div className="p-8 rounded-[3rem] bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-2xl shadow-emerald-500/20 relative overflow-hidden group col-span-1 md:col-span-2">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                           <Briefcase className="w-32 h-32" />
                        </div>
                        <p className="text-xs uppercase font-black tracking-widest opacity-60 mb-2">{t('monthlyPension')}</p>
                        <p className="text-5xl font-black mb-1">{formatCurrency(result.monthly_pension, currency)}</p>
                        {showWords && (
                           <p className="text-[10px] font-bold italic opacity-80 leading-tight">
                             {numberToWords(result.monthly_pension, currency)}
                           </p>
                        )}
                        <p className="mt-4 text-xs font-medium opacity-70">
                           Based on your {annuityPct}% annuity corpus reinvestment.
                        </p>
                     </div>

                     {/* Total Corpus */}
                     <div className="p-6 rounded-[2.5rem] bg-muted/50 border-2 border-border shadow-xl">
                        <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground mb-1">Total Corpus at 60</p>
                        <p className="text-2xl font-black">{formatCurrency(result.total_corpus, currency)}</p>
                     </div>

                     {/* Lump Sum */}
                     <div className="p-6 rounded-[2.5rem] bg-primary/10 border-2 border-primary/20 shadow-xl">
                        <p className="text-[10px] uppercase font-black tracking-widest text-primary mb-1">{t('lumpSum')}</p>
                        <p className="text-2xl font-black text-primary">{formatCurrency(result.lump_sum_withdrawal, currency)}</p>
                     </div>
                  </div>

                  <div className="h-[250px] w-full bg-muted/20 rounded-3xl p-6 flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="absolute top-4 left-6 flex items-center gap-2 text-xs font-bold text-muted-foreground">
                      <PieIcon className="w-4 h-4" />
                      CORPUS BREAKUP
                    </div>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          formatter={(val: any) => [formatCurrency(val, currency), '']}
                        />
                        <Legend verticalAlign="bottom" height={36}/>
                      </PieChart>
                    </ResponsiveContainer>
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
