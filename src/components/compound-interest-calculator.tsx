'use client';

import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { InterestResult } from '@/lib/types';
import { saveToHistory } from '@/lib/db';
import { safeInvoke, isTauri } from '@/lib/tauri-utils';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Wallet, Calendar, RefreshCcw, Copy, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { formatCurrency, numberToWords } from '@/lib/utils';
import { useLanguage } from '@/context/language-context';
import { useSettings } from '@/context/settings-context';

const FREQUENCIES = [
  { label: 'Annually', value: '1' },
  { label: 'Semi-Annually', value: '2' },
  { label: 'Quarterly', value: '4' },
  { label: 'Monthly', value: '12' },
  { label: 'Daily', value: '365' },
];

export default function CompoundInterestCalculator() {
  const [principal, setPrincipal] = useState('10000');
  const [rate, setRate] = useState('5');
  const [isSekda, setIsSekda] = useState(false);
  const [time, setTime] = useState('10');
  const [frequency, setFrequency] = useState('12');
  const [result, setResult] = useState<InterestResult | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const { toast } = useToast();
  const { showWords } = useLanguage();
  const { currency } = useSettings();

  const handleCalculate = async () => {
    if (!isTauri()) return;
    try {
      const annualRate = isSekda ? parseFloat(rate) * 12 : parseFloat(rate);
      const res = await safeInvoke<InterestResult>('calculate_compound_interest', {
        principal: parseFloat(principal),
        rate: annualRate,
        time: parseFloat(time),
        frequency: parseInt(frequency)
      });
      setResult(res);

      const data = [];
      const p = parseFloat(principal);
      const r = annualRate / 100;
      const n = parseInt(frequency);
      const t = parseFloat(time);

      for (let i = 0; i <= t; i++) {
        const amount = p * Math.pow(1 + r / n, n * i);
        data.push({
          year: i,
          amount: Math.round(amount * 100) / 100
        });
      }
      setChartData(data);

      await saveToHistory(
        'Compound Interest Calculator',
        'Finance',
        { principal, rate, time, frequency },
        { final_amount: res.final_amount, total_interest: res.total_interest },
        res.duration_ms
      );

    } catch (err) {
      toast({
        title: "Calculation Error",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="max-w-5xl mx-auto border-none shadow-2xl bg-gradient-to-br from-background via-muted/50 to-background overflow-hidden relative">
      {!isTauri() && (
        <div className="absolute inset-0 z-50 backdrop-blur-sm bg-background/20 flex flex-col items-center justify-center p-6 text-center">
            <div className="bg-background/90 p-8 rounded-3xl shadow-2xl border-2 border-primary/20 max-w-sm">
                <TrendingUp className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
                <h3 className="text-xl font-bold mb-2">Standalone App Required</h3>
                <p className="text-sm text-muted-foreground mb-6">
                    Financial projections are calculated on your machine for maximum privacy and speed.
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
            <TrendingUp className="w-6 h-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl">Compound Interest Calculator</CardTitle>
            <CardDescription>Visualize your wealth growth over time.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Inputs Section */}
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold flex items-center gap-2">
                <Wallet className="w-4 h-4 text-primary" />
                Principal Amount
              </label>
              <Input
                type="number"
                value={principal}
                onChange={(e) => setPrincipal(e.target.value)}
                className="h-12 border-2 rounded-xl focus:ring-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold flex items-center gap-2">
                    {isSekda ? 'Interest (Sekda)' : '% Annual Rate'}
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
                    className="h-12 border-2 rounded-xl pr-12 focus:ring-primary"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                    {isSekda ? '₹/100' : '%'}
                  </span>
                </div>
                {isSekda && (
                   <p className="text-[10px] text-muted-foreground italic px-1 leading-tight">
                      * ₹{rate} per 100 per month ({parseFloat(rate) * 12}% p.a.)
                   </p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  Time (Years)
                </label>
                <Input
                  type="number"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="h-12 border-2 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold flex items-center gap-2">
                <RefreshCcw className="w-4 h-4 text-primary" />
                Compounding Frequency
              </label>
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger className="h-12 border-2 rounded-xl">
                  <SelectValue placeholder="Select Frequency" />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCIES.map(f => (
                    <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleCalculate} className="w-full h-14 text-lg font-bold rounded-2xl shadow-lg transition-transform active:scale-95">
              Calculate Growth
            </Button>

            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-6 rounded-2xl bg-primary/5 border border-primary/10 space-y-4"
                >
                  <p className="text-xs uppercase font-bold tracking-widest text-primary text-center">Future Value</p>
                  <p className="text-4xl font-black text-primary text-center">{formatCurrency(result.final_amount, currency)}</p>
                  {showWords && (
                    <p className="text-[10px] text-primary/70 text-center font-bold italic mt-1 leading-tight">
                      {numberToWords(result.final_amount, currency)}
                    </p>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-primary/10">
                    <div className="text-center">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Invested</p>
                      <p className="text-lg font-bold">{formatCurrency(parseFloat(principal), currency)}</p>
                      {showWords && (
                        <p className="text-[8px] text-muted-foreground font-bold italic leading-tight">
                          {numberToWords(parseFloat(principal), currency)}
                        </p>
                      )}
                    </div>
                    <div className="text-center border-l border-primary/10">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Interest</p>
                      <p className="text-lg font-bold text-green-600">{formatCurrency(result.total_interest, currency)}</p>
                      {showWords && (
                        <p className="text-[8px] text-green-600/70 font-bold italic leading-tight">
                          {numberToWords(result.total_interest, currency)}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Visualization Section */}
          <div className="min-h-[300px] h-full flex flex-col items-center justify-center bg-muted/20 rounded-3xl border p-6">
            {chartData.length > 0 ? (
              <div className="w-full h-full space-y-4">
                <p className="text-sm font-semibold text-center opacity-70">Growth Projection</p>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="year" fontSize={12} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                    <YAxis fontSize={10} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} tickFormatter={(val) => `${(val/1000).toFixed(0)}k`} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      formatter={(val: any) => [formatCurrency(val, currency), 'Amount']}
                    />
                    <Area type="monotone" dataKey="amount" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center space-y-3 opacity-40">
                <TrendingUp className="w-12 h-12 mx-auto" />
                <p className="text-sm font-medium">Enter values to see your growth chart</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
