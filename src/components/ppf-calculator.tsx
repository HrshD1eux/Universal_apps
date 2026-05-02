'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { safeInvoke, isTauri } from '@/lib/tauri-utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck as ShieldCheckIcon, Wallet, Calendar, Percent, PieChart as PieIcon, Zap, ArrowUpRight, Table } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { formatCurrency, numberToWords } from '@/lib/utils';
import { useLanguage } from '@/context/language-context';
import { useSettings } from '@/context/settings-context';

export default function PPFCalculator() {
  const [investment, setInvestment] = useState('150000');
  const [rate, setRate] = useState('7.1');
  const [years, setYears] = useState('15');
  const [result, setResult] = useState<any>(null);
  const { showWords, t } = useLanguage();
  const { currency } = useSettings();
  const { toast } = useToast();

  const handleCalculate = async () => {
    if (!isTauri()) return;

    try {
      const res = await safeInvoke<any>('calculate_ppf', {
        annualInvestment: parseFloat(investment),
        annualRate: parseFloat(rate),
        years: parseInt(years)
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
    if (investment && rate && years) {
      handleCalculate();
    }
  }, [investment, rate, years]);

  const pieData = result ? [
    { name: 'Total Invested', value: parseFloat(result.total_invested), color: 'hsl(var(--primary))' },
    { name: 'Interest Earned', value: parseFloat(result.total_interest), color: '#10b981' }
  ] : [];

  return (
    <Card className="max-w-6xl mx-auto border-none shadow-2xl bg-gradient-to-br from-background via-muted/50 to-background overflow-hidden relative">
      <CardHeader className="bg-primary/5 border-b border-primary/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <ShieldCheckIcon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">{t('ppfTitle')}</CardTitle>
              <CardDescription>{t('ppfDesc')}</CardDescription>
            </div>
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
                {t('annualInvestment')}
              </label>
              <Input
                type="number"
                value={investment}
                max="150000"
                onChange={(e) => setInvestment(e.target.value)}
                className="h-14 text-xl border-2 rounded-2xl focus:ring-primary font-mono"
              />
              <div className="flex justify-between items-center px-1 mt-1.5 min-h-[1.25rem]">
                <p className="text-[11px] font-bold text-primary/90">
                  {investment ? formatCurrency(investment, currency) : ''}
                </p>
                {showWords && investment && (
                  <p className="text-[10px] text-muted-foreground font-bold italic text-right">
                    {numberToWords(investment, currency)}
                  </p>
                )}
              </div>
              {parseFloat(investment) > 150000 && (
                <p className="text-[10px] text-destructive font-bold">* Max limit is ₹1.5 Lakh per year.</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                  <label className="text-sm font-semibold flex items-center gap-2">
                    <Percent className="w-4 h-4 text-primary" />
                    Interest (%)
                  </label>
                  <Input
                    type="number"
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    className="h-12 border-2 rounded-xl font-mono"
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
                    min="15"
                    max="50"
                    onChange={(e) => setYears(e.target.value)}
                    className="h-12 border-2 rounded-xl font-mono"
                  />
              </div>
            </div>

            <div className="p-6 rounded-[2rem] bg-primary/5 border-2 border-dashed border-primary/20 space-y-4">
               <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                     <Zap className="w-6 h-6" />
                  </div>
                  <div>
                     <p className="text-sm font-bold">Tax Savings (80C)</p>
                     <p className="text-xs text-muted-foreground">
                        PPF falls under the EEE (Exempt-Exempt-Exempt) category, meaning your investment, interest, and maturity are all tax-free.
                     </p>
                  </div>
               </div>
            </div>

            {result && (
              <div className="h-[250px] w-full bg-muted/20 rounded-3xl p-6 flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute top-4 left-6 flex items-center gap-2 text-xs font-bold text-muted-foreground">
                  <PieIcon className="w-4 h-4" />
                  TOTAL BREAKUP
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
            )}
          </div>

          {/* Results Schedule */}
          <div className="space-y-6">
            <AnimatePresence mode="wait">
              {result && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-6"
                >
                  <div className="p-8 rounded-[3rem] bg-primary text-primary-foreground shadow-2xl shadow-primary/20 relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                        <Calendar className="w-32 h-32" />
                     </div>
                     <p className="text-xs uppercase font-black tracking-widest opacity-60 mb-2">Maturity Value ({years} Years)</p>
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
                        </div>
                        <div>
                           <p className="text-[10px] uppercase font-bold opacity-60 mb-1">Total Interest</p>
                           <p className="text-xl font-bold">{formatCurrency(result.total_interest, currency)}</p>
                        </div>
                     </div>
                  </div>

                  <div className="space-y-3">
                     <h4 className="text-sm font-bold flex items-center gap-2 ml-1">
                        <Table className="w-4 h-4 text-primary" />
                        {years}-Year Maturity Schedule
                     </h4>
                     <div className="rounded-[2.5rem] border-2 border-muted overflow-hidden">
                        <div className="overflow-x-auto custom-scrollbar max-h-[400px]">
                           <table className="w-full text-sm">
                              <thead className="bg-muted sticky top-0 z-10">
                                 <tr className="text-left">
                                    <th className="p-4 font-black uppercase text-[10px] tracking-widest text-muted-foreground">Year</th>
                                    <th className="p-4 font-black uppercase text-[10px] tracking-widest text-muted-foreground">Opening</th>
                                    <th className="p-4 font-black uppercase text-[10px] tracking-widest text-muted-foreground">Interest</th>
                                    <th className="p-4 font-black uppercase text-[10px] tracking-widest text-muted-foreground">Closing</th>
                                 </tr>
                              </thead>
                              <tbody className="divide-y divide-muted/50">
                                 {result.yearly_breakup.map((row: any) => (
                                    <tr key={row.year} className="hover:bg-primary/5 transition-colors group">
                                       <td className="p-4 font-bold text-primary">Year {row.year}</td>
                                       <td className="p-4 font-medium opacity-60">{formatCurrency(row.opening_balance, currency)}</td>
                                       <td className="p-4 font-bold text-green-600">+{formatCurrency(row.interest_earned, currency)}</td>
                                       <td className="p-4 font-black">{formatCurrency(row.closing_balance, currency)}</td>
                                    </tr>
                                 ))}
                              </tbody>
                           </table>
                        </div>
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
