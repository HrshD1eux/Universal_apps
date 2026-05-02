'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { safeInvoke, isTauri } from '@/lib/tauri-utils';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Calendar, Percent, Zap, Wallet, ArrowDownRight, Scale } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, numberToWords } from '@/lib/utils';
import { useLanguage } from '@/context/language-context';
import { useSettings } from '@/context/settings-context';

export default function InflationCalculator() {
  const [amount, setAmount] = useState('100000');
  const [rate, setRate] = useState('6');
  const [years, setYears] = useState('10');
  const [result, setResult] = useState<any>(null);
  const { showWords, t } = useLanguage();
  const { currency } = useSettings();
  const { toast } = useToast();

  const handleCalculate = async () => {
    if (!isTauri()) return;

    try {
      const res = await safeInvoke<any>('calculate_inflation', {
        amount: parseFloat(amount),
        inflationRate: parseFloat(rate),
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
    if (amount && rate && years) {
      handleCalculate();
    }
  }, [amount, rate, years]);

  return (
    <Card className="max-w-5xl mx-auto border-none shadow-2xl bg-gradient-to-br from-background via-muted/50 to-background overflow-hidden relative">
      <CardHeader className="bg-primary/5 border-b border-primary/10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-500/10 rounded-lg">
            <TrendingUp className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <CardTitle className="text-2xl">{t('inflationTitle')}</CardTitle>
            <CardDescription>{t('inflationDesc')}</CardDescription>
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
                Current Amount
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
                  {t('inflationRate')}
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
                  Time Period (Years)
                </label>
                <Input
                  type="number"
                  value={years}
                  onChange={(e) => setYears(e.target.value)}
                  className="h-14 text-xl border-2 rounded-2xl font-mono"
                />
              </div>
            </div>

            <div className="p-6 rounded-[2rem] bg-orange-500/5 border-2 border-dashed border-orange-500/20 space-y-4">
               <div className="flex items-center gap-4">
                  <div className="p-3 bg-orange-500/10 rounded-2xl text-orange-600">
                     <Scale className="w-6 h-6" />
                  </div>
                  <div>
                     <p className="text-sm font-bold">The Silent Tax</p>
                     <p className="text-xs text-muted-foreground">
                        Inflation gradually reduces what your money can buy. Plan your investments to beat this rate.
                     </p>
                  </div>
               </div>
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
                  {/* Future Value */}
                  <div className="p-8 rounded-[2.5rem] bg-muted/50 border-2 border-border shadow-xl relative overflow-hidden group">
                     <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground mb-2">Cost of same items in {years} years</p>
                     <p className="text-4xl font-black mb-1">{formatCurrency(result.future_value, currency)}</p>
                     <p className="text-[10px] font-bold text-orange-600 flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        Price Increase: {result.total_increase_pct.toFixed(1)}%
                     </p>
                  </div>

                  {/* Purchasing Power */}
                  <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-orange-600 to-red-700 text-white shadow-2xl shadow-orange-500/20 relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                        <ArrowDownRight className="w-32 h-32" />
                     </div>
                     <p className="text-xs uppercase font-black tracking-widest opacity-60 mb-2">Value of your money then</p>
                     <p className="text-5xl font-black mb-1">{formatCurrency(result.purchasing_power, currency)}</p>
                     {showWords && (
                        <p className="text-[10px] font-bold italic opacity-80 mb-6 leading-tight">
                          {numberToWords(result.purchasing_power, currency)}
                        </p>
                     )}
                     <p className="text-xs font-medium opacity-80">
                         In {years} years, {formatCurrency(amount, currency)} will only buy what {formatCurrency(result.purchasing_power, currency)} buys today.
                     </p>
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
