'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { safeInvoke, isTauri } from '@/lib/tauri-utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Banknote, Clock, Wallet, Calendar, ArrowUpRight, ArrowDownRight, Info, Table, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, numberToWords } from '@/lib/utils';
import { useLanguage } from '@/context/language-context';
import { useSettings } from '@/context/settings-context';

export default function SalaryCalculator() {
  const [amount, setAmount] = useState('50000');
  const [frequency, setFrequency] = useState('yearly');
  const [hoursPerWeek, setHoursPerWeek] = useState('40');
  const [result, setResult] = useState<any>(null);
  const { showWords } = useLanguage();
  const { currency } = useSettings();
  const { toast } = useToast();

  const handleCalculate = async () => {
    if (!isTauri() || !amount) return;

    try {
      const res = await safeInvoke<any>('calculate_salary', {
        amount: parseFloat(amount),
        frequency,
        hoursPerWeek: parseFloat(hoursPerWeek)
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
    handleCalculate();
  }, [amount, frequency, hoursPerWeek]);

  return (
    <Card className="max-w-4xl mx-auto border-none shadow-2xl bg-gradient-to-br from-background via-muted/50 to-background overflow-hidden relative">
      {!isTauri() && (
        <div className="absolute inset-0 z-50 backdrop-blur-sm bg-background/20 flex flex-col items-center justify-center p-6 text-center">
            <div className="bg-background/90 p-8 rounded-3xl shadow-2xl border-2 border-primary/20 max-w-sm">
                <Banknote className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
                <h3 className="text-xl font-bold mb-2">Desktop Required</h3>
                <p className="text-sm text-muted-foreground mb-6">
                    Multi-frequency salary conversions are handled by the local desktop engine.
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
            <Banknote className="w-6 h-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl">Salary Calculator</CardTitle>
            <CardDescription>Convert your income across different time periods.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-primary" />
                  Salary Amount
                </label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="h-14 text-2xl border-2 rounded-2xl focus:ring-primary font-mono"
                />
                <div className="flex justify-between items-center px-1 mt-1.5 min-h-[1.25rem]">
                  <p className="text-[11px] font-bold text-primary/90">
                    {amount ? formatCurrency(amount, currency) : ''}
                  </p>
                  {showWords && amount && (
                    <p className="text-[10px] text-muted-foreground font-bold italic animate-in fade-in slide-in-from-top-1 text-right">
                      {numberToWords(amount, currency)}
                    </p>
                  )}
                </div>
              </div>

              <Tabs value={frequency} onValueChange={setFrequency} className="w-full">
                <TabsList className="grid grid-cols-4 w-full h-11 p-1 bg-muted rounded-xl">
                  <TabsTrigger value="yearly" className="text-[10px] font-bold uppercase transition-all data-[state=active]:bg-background">Year</TabsTrigger>
                  <TabsTrigger value="monthly" className="text-[10px] font-bold uppercase transition-all data-[state=active]:bg-background">Month</TabsTrigger>
                  <TabsTrigger value="weekly" className="text-[10px] font-bold uppercase transition-all data-[state=active]:bg-background">Week</TabsTrigger>
                  <TabsTrigger value="hourly" className="text-[10px] font-bold uppercase transition-all data-[state=active]:bg-background">Hour</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                Working Hours / Week
              </label>
              <div className="relative">
                <Input
                  type="number"
                  value={hoursPerWeek}
                  onChange={(e) => setHoursPerWeek(e.target.value)}
                  className="h-12 border-2 rounded-xl focus:ring-primary font-mono pr-10"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-xs">HRS</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex gap-3">
                <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <p className="text-[10px] text-muted-foreground leading-relaxed italic">
                  Assumes 52 weeks per year and 5 working days per week for daily conversions.
                </p>
            </div>
          </div>

          <div className="space-y-6">
            <AnimatePresence mode="wait">
              {result && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <ResultCard label="Yearly" value={result.yearly} icon={<Calendar className="w-4 h-4" />} highlight currency={currency} />
                     <ResultCard label="Monthly" value={result.monthly} icon={<Wallet className="w-4 h-4" />} currency={currency} />
                     <ResultCard label="Bi-Weekly" value={result.bi_weekly} icon={<Table className="w-4 h-4" />} currency={currency} />
                     <ResultCard label="Weekly" value={result.weekly} icon={<Calendar className="w-4 h-4" />} currency={currency} />
                     <ResultCard label="Daily" value={result.daily} icon={<Clock className="w-4 h-4" />} currency={currency} />
                     <ResultCard label="Hourly" value={result.hourly} icon={<Zap className="w-4 h-4 text-primary" />} currency={currency} />
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

function ResultCard({ label, value, icon, currency, highlight = false }: { label: string, value: string, icon: React.ReactNode, currency: string, highlight?: boolean }) {
  return (
    <div className={`p-4 rounded-3xl border-2 transition-all ${highlight ? 'bg-primary border-primary shadow-lg shadow-primary/20' : 'bg-card border-border/50 hover:border-primary/30'}`}>
       <div className="flex items-center justify-between mb-2">
          <span className={`text-[10px] font-black uppercase tracking-widest ${highlight ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{label}</span>
          <div className={highlight ? 'text-primary-foreground/70' : 'text-primary/50'}>
             {icon}
          </div>
       </div>
       <div className={`text-xl font-black ${highlight ? 'text-primary-foreground' : 'text-foreground'}`}>
          {formatCurrency(value, currency)}
       </div>
    </div>
  )
}
