'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { saveToHistory } from '@/lib/db';
import { safeInvoke, isTauri } from '@/lib/tauri-utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Landmark, Wallet, Calendar, Percent, PieChart as PieIcon, List, Zap, TrendingUp, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { formatCurrency, numberToWords } from '@/lib/utils';
import { useLanguage } from '@/context/language-context';
import { useSettings } from '@/context/settings-context';

export default function EMICalculator() {
  const [principal, setPrincipal] = useState('1000000');
  const [rate, setRate] = useState('8.5');
  const [years, setYears] = useState('20');
  const [isSekda, setIsSekda] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const { t, showWords } = useLanguage();
  const { currency } = useSettings();
  const { toast } = useToast();

  const handleCalculate = async () => {
    if (!isTauri()) return;

    setIsCalculating(true);
    try {
      const annualRate = isSekda ? parseFloat(rate) * 12 : parseFloat(rate);
      const res = await safeInvoke<any>('calculate_emi', {
        principal: parseFloat(principal),
        annualRate,
        tenureYears: parseFloat(years)
      });
      setResult(res);

      await saveToHistory(
        'EMI Calculator',
        'Finance',
        { principal, rate, years },
        { monthly_emi: res.monthly_emi, total_payable: res.total_payable, total_interest: res.total_interest },
        res.duration_ms
      );
    } catch (err) {
      toast({
        title: "Calculation Error",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive"
      });
    } finally {
      setIsCalculating(false);
    }
  };

  useEffect(() => {
    if (principal && rate && years) {
      handleCalculate();
    }
  }, [principal, rate, years]);

  const pieData = result ? [
    { name: 'Principal Amount', value: parseFloat(principal), color: 'hsl(var(--primary))' },
    { name: 'Total Interest', value: parseFloat(result.total_interest), color: 'hsl(var(--destructive))' }
  ] : [];

  return (
    <Card className="max-w-5xl mx-auto border-none shadow-2xl bg-gradient-to-br from-background via-muted/50 to-background overflow-hidden relative">
      {!isTauri() && (
        <div className="absolute inset-0 z-50 backdrop-blur-sm bg-background/20 flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-background/90 p-8 rounded-3xl shadow-2xl border-2 border-primary/20 max-w-sm">
            <Landmark className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
            <h3 className="text-xl font-bold mb-2">Desktop Required</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Loan amortization and high-precision EMI calculations require the local desktop engine.
            </p>
            <Button variant="outline" className="rounded-xl" onClick={() => window.location.reload()}>
              Retry Detection
            </Button>
          </div>
        </div>
      )}
      <CardHeader className="bg-primary/5 border-b border-primary/10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Landmark className="w-6 h-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl">EMI/Loan Calculator</CardTitle>
            <CardDescription>Plan your loans with precise amortization schedules.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,1.2fr] gap-12">
          {/* Inputs Section */}
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold flex items-center gap-2">
                <Wallet className="w-4 h-4 text-primary" />
                Loan Amount
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
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold flex items-center gap-2">
                    <Percent className="w-4 h-4 text-primary" />
                    {isSekda ? 'Interest (Sekda)' : 'Interest Rate (%)'}
                  </label>
                  <button 
                    onClick={() => setIsSekda(!isSekda)}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors ${isSekda ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                  >
                    {isSekda ? 'Sekda mode' : 'Standard mode'}
                  </button>
                </div>
                <div className="relative">
                  <Input
                    type="number"
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    className="h-14 text-xl border-2 rounded-2xl font-mono pr-12"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                    {isSekda ? '₹/100' : '%'}
                  </span>
                </div>
                {isSekda && (
                   <p className="text-[10px] text-muted-foreground italic px-1">
                      * Calculates as ₹{rate} per 100 per month ({parseFloat(rate) * 12}% per year)
                   </p>
                )}
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
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 rounded-3xl bg-primary/5 border-2 border-primary/20 space-y-4"
                >
                  <p className="text-xs uppercase font-bold tracking-widest text-primary text-center">Monthly EMI</p>
                  <p className="text-4xl font-black text-primary text-center">{formatCurrency(result.monthly_emi, currency)}</p>
                  {showWords && (
                    <p className="text-[10px] text-primary/70 text-center font-bold italic mt-1 leading-tight">
                      {numberToWords(result.monthly_emi, currency)}
                    </p>
                  )}
                  <div className="pt-2 flex justify-center">
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-primary/10">
                    <div className="text-center">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">{t('totalInterest')}</p>
                      <p className="text-lg font-bold text-destructive">{formatCurrency(result.total_interest, currency)}</p>
                      {showWords && (
                        <p className="text-[8px] text-destructive/70 font-bold italic">
                          {numberToWords(result.total_interest, currency)}
                        </p>
                      )}
                    </div>
                    <div className="text-center border-l border-primary/10">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">{t('totalPayable')}</p>
                      <p className="text-lg font-bold">{formatCurrency(result.total_payable, currency)}</p>
                      {showWords && (
                        <p className="text-[8px] text-muted-foreground font-bold italic">
                          {numberToWords(result.total_payable, currency)}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Visualization & Summary */}
          <div className="space-y-8">
            <div className="h-[300px] w-full bg-muted/20 rounded-3xl p-6 flex flex-col items-center justify-center relative overflow-hidden">
              <div className="absolute top-4 left-6 flex items-center gap-2 text-xs font-bold text-muted-foreground">
                <PieIcon className="w-4 h-4" />
                BREAKUP OF TOTAL PAYMENT
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
                <div className="text-center opacity-30 select-none">
                  <TrendingUp className="w-12 h-12 mx-auto mb-2" />
                  <p className="text-sm font-medium">Results will appear here</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl border bg-card hover:bg-muted/50 transition-colors cursor-help group">
                 <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-green-500/10 rounded-lg text-green-600">
                       <Zap className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">Interest Ratio</span>
                 </div>
                 <p className="text-xl font-bold">
                    {result ? ((parseFloat(result.total_interest) / parseFloat(result.total_payable)) * 100).toFixed(1) : '0'}%
                 </p>
              </div>
              <div className="p-4 rounded-2xl border bg-card hover:bg-muted/50 transition-colors cursor-help group">
                 <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-blue-500/10 rounded-lg text-blue-600">
                       <List className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">Total Months</span>
                 </div>
                 <p className="text-xl font-bold">{parseFloat(years) * 12}</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
