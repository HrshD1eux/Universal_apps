'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { safeInvoke, isTauri } from '@/lib/tauri-utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Landmark, Wallet, Calendar, Percent, PieChart as PieIcon, Zap, ShieldCheck as ShieldCheckIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { formatCurrency, numberToWords } from '@/lib/utils';
import { useLanguage } from '@/context/language-context';
import { useSettings } from '@/context/settings-context';

export default function FDRDCalculator() {
  const [type, setType] = useState<'fd' | 'rd'>('fd');
  const [amount, setAmount] = useState('100000');
  const [rate, setRate] = useState('7');
  const [years, setYears] = useState('5');
  const [result, setResult] = useState<any>(null);
  const { showWords, t } = useLanguage();
  const { currency } = useSettings();
  const { toast } = useToast();

  const handleCalculate = async () => {
    if (!isTauri()) return;

    try {
      const res = await safeInvoke<any>('calculate_fd_rd', {
        amount: parseFloat(amount),
        annualRate: parseFloat(rate),
        years: parseFloat(years),
        isRd: type === 'rd'
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
    if (amount && rate && years) {
      handleCalculate();
    }
  }, [amount, rate, years, type]);

  const pieData = result ? [
    { name: 'Invested Amount', value: parseFloat(result.total_invested), color: 'hsl(var(--primary))' },
    { name: 'Interest Earned', value: parseFloat(result.total_interest), color: '#10b981' }
  ] : [];

  return (
    <Card className="max-w-5xl mx-auto border-none shadow-2xl bg-gradient-to-br from-background via-muted/50 to-background overflow-hidden relative">
      <CardHeader className="bg-primary/5 border-b border-primary/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-lg">
              <Landmark className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <CardTitle className="text-2xl">{type === 'fd' ? t('fdTitle') : t('rdTitle')}</CardTitle>
              <CardDescription>{type === 'fd' ? t('fdDesc') : t('rdDesc')}</CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,1.2fr] gap-12">
          {/* Inputs */}
          <div className="space-y-6">
            <Tabs value={type} onValueChange={(v) => setType(v as any)} className="w-full">
              <TabsList className="grid grid-cols-2 w-full h-12 p-1 bg-muted rounded-2xl">
                <TabsTrigger value="fd" className="rounded-xl font-bold uppercase tracking-wider transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">Fixed Deposit</TabsTrigger>
                <TabsTrigger value="rd" className="rounded-xl font-bold uppercase tracking-wider transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">Recurring Deposit</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="space-y-2">
              <label className="text-sm font-semibold flex items-center gap-2">
                <Wallet className="w-4 h-4 text-primary" />
                {type === 'fd' ? t('principalAmount') : 'Monthly Deposit'}
              </label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-14 text-xl border-2 rounded-2xl focus:ring-primary font-mono"
              />
              <div className="flex justify-between items-center px-1 mt-1.5 min-h-[1.25rem]">
                <p className="text-[11px] font-bold text-primary/90">
                  {amount ? formatCurrency(amount, currency) : ''}
                </p>
                {showWords && amount && (
                  <p className="text-[10px] text-muted-foreground font-bold italic text-right">
                    {numberToWords(amount, currency)}
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
                  Tenure (Years)
                </label>
                <Input
                  type="number"
                  value={years}
                  onChange={(e) => setYears(e.target.value)}
                  className="h-14 text-xl border-2 rounded-2xl font-mono"
                />
              </div>
            </div>

            <div className="p-6 rounded-[2rem] bg-indigo-500/5 border-2 border-dashed border-indigo-500/20">
               <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-600">
                     <ShieldCheckIcon className="w-6 h-6" />
                  </div>
                  <div>
                     <p className="text-sm font-bold">Safe & Secure</p>
                     <p className="text-xs text-muted-foreground">
                        FD and RD schemes are among the safest investment options in India, offering guaranteed returns.
                     </p>
                  </div>
               </div>
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
                  <div className="p-8 rounded-[3rem] bg-gradient-to-br from-indigo-600 to-blue-700 text-white shadow-2xl shadow-indigo-500/20 relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                        <Wallet className="w-32 h-32" />
                     </div>
                     <p className="text-xs uppercase font-black tracking-widest opacity-60 mb-2">{t('maturityAmount')}</p>
                     <p className="text-5xl font-black mb-1">{formatCurrency(result.maturity_amount, currency)}</p>
                     {showWords && (
                        <p className="text-[10px] font-bold italic opacity-80 mb-6 leading-tight">
                          {numberToWords(result.maturity_amount, currency)}
                        </p>
                     )}
                     
                     <div className="grid grid-cols-2 gap-6 pt-6 border-t border-white/20">
                        <div>
                           <p className="text-[10px] uppercase font-bold opacity-60 mb-1">Total Invested</p>
                           <p className="text-xl font-bold">{formatCurrency(result.total_invested, currency)}</p>
                           {showWords && (
                              <p className="text-[8px] font-bold italic opacity-70 leading-tight">
                                {numberToWords(result.total_invested, currency)}
                              </p>
                           )}
                        </div>
                        <div>
                           <p className="text-[10px] uppercase font-bold opacity-60 mb-1">Interest Gained</p>
                           <p className="text-xl font-bold">{formatCurrency(result.total_interest, currency)}</p>
                           {showWords && (
                              <p className="text-[8px] font-bold italic opacity-70 leading-tight">
                                {numberToWords(result.total_interest, currency)}
                              </p>
                           )}
                        </div>
                     </div>
                  </div>

                  <div className="h-[250px] w-full bg-muted/20 rounded-3xl p-6 flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="absolute top-4 left-6 flex items-center gap-2 text-xs font-bold text-muted-foreground">
                      <PieIcon className="w-4 h-4" />
                      BREAKUP
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
