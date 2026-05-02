'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { safeInvoke, isTauri } from '@/lib/tauri-utils';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Wallet, Calendar, Percent, PieChart as PieIcon, Zap, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { formatCurrency, numberToWords } from '@/lib/utils';
import { useLanguage } from '@/context/language-context';
import { useSettings } from '@/context/settings-context';

export default function SIPCalculator() {
  const [monthlyInvestment, setMonthlyInvestment] = useState('5000');
  const [rate, setRate] = useState('12');
  const [years, setYears] = useState('10');
  const [result, setResult] = useState<any>(null);
  const { showWords } = useLanguage();
  const { currency } = useSettings();
  const { toast } = useToast();

  const handleCalculate = async () => {
    if (!isTauri()) return;

    try {
      const res = await safeInvoke<any>('calculate_sip', {
        monthlyInvestment: parseFloat(monthlyInvestment),
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
    if (monthlyInvestment && rate && years) {
      handleCalculate();
    }
  }, [monthlyInvestment, rate, years]);

  const pieData = result ? [
    { name: 'Invested Amount', value: parseFloat(result.invested_amount), color: 'hsl(var(--primary))' },
    { name: 'Wealth Gained', value: parseFloat(result.wealth_gained), color: '#10b981' }
  ] : [];

  return (
    <Card className="max-w-5xl mx-auto border-none shadow-2xl bg-gradient-to-br from-background via-muted/50 to-background overflow-hidden relative">
      <CardHeader className="bg-primary/5 border-b border-primary/10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <TrendingUp className="w-6 h-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl">SIP Calculator</CardTitle>
            <CardDescription>Calculate the future value of your Systematic Investment Plan.</CardDescription>
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
                Monthly Investment
              </label>
              <Input
                type="number"
                value={monthlyInvestment}
                onChange={(e) => setMonthlyInvestment(e.target.value)}
                className="h-14 text-xl border-2 rounded-2xl focus:ring-primary font-mono"
              />
              <div className="flex justify-between items-center px-1 mt-1.5 min-h-[1.25rem]">
                <p className="text-[11px] font-bold text-primary/90">
                  {monthlyInvestment ? formatCurrency(monthlyInvestment, currency) : ''}
                </p>
                {showWords && monthlyInvestment && (
                  <p className="text-[10px] text-muted-foreground font-bold italic animate-in fade-in slide-in-from-top-1 text-right">
                    {numberToWords(monthlyInvestment, currency)}
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

            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-6 rounded-3xl bg-primary/5 border-2 border-primary/20 space-y-4"
                >
                  <p className="text-xs uppercase font-bold tracking-widest text-primary text-center">Estimated Maturity Value</p>
                  <p className="text-4xl font-black text-primary text-center">{formatCurrency(result.total_value, currency)}</p>
                  {showWords && (
                    <p className="text-[10px] text-primary/70 text-center font-bold italic mt-1 leading-tight">
                      {numberToWords(result.total_value, currency)}
                    </p>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-primary/10">
                    <div className="text-center">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Total Investment</p>
                      <p className="text-lg font-bold">{formatCurrency(result.invested_amount, currency)}</p>
                      {showWords && (
                        <p className="text-[8px] text-muted-foreground font-bold italic leading-tight">
                          {numberToWords(result.invested_amount, currency)}
                        </p>
                      )}
                    </div>
                    <div className="text-center border-l border-primary/10">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Wealth Gained</p>
                      <p className="text-lg font-bold text-green-600">{formatCurrency(result.wealth_gained, currency)}</p>
                      {showWords && (
                        <p className="text-[8px] text-green-600/70 font-bold italic leading-tight">
                          {numberToWords(result.wealth_gained, currency)}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Visualization */}
          <div className="space-y-8">
            <div className="h-[300px] w-full bg-muted/20 rounded-3xl p-6 flex flex-col items-center justify-center relative overflow-hidden">
              <div className="absolute top-4 left-6 flex items-center gap-2 text-xs font-bold text-muted-foreground">
                <PieIcon className="w-4 h-4" />
                INVESTMENT BREAKUP
              </div>
              
              {result ? (
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
              ) : (
                <div className="text-center opacity-30">
                  <Wallet className="w-12 h-12 mx-auto mb-2" />
                  <p className="text-sm font-medium">Results will appear here</p>
                </div>
              )}
            </div>

            <div className="p-6 rounded-[2rem] border-2 border-dashed border-primary/20 bg-background/50 backdrop-blur-sm">
               <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-500/10 rounded-2xl text-green-600">
                     <Zap className="w-6 h-6" />
                  </div>
                  <div>
                     <p className="text-sm font-bold">Wealth Generation</p>
                     <p className="text-xs text-muted-foreground">
                        Your small monthly investments could grow into {result ? formatCurrency(result.total_value, currency) : '---'} in {years} years.
                     </p>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
