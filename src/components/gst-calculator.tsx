'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { saveToHistory } from '@/lib/db';
import { safeInvoke, isTauri } from '@/lib/tauri-utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Receipt, Wallet, Percent, Check, ArrowRight, Zap, Info, ShieldCheck as ShieldCheckIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, numberToWords } from '@/lib/utils';
import { useLanguage } from '@/context/language-context';
import { useSettings } from '@/context/settings-context';

// Fallback calculation for non-Tauri environments
const calculateGSTFallback = (amount: number, rate: number, isInclusive: boolean) => {
  if (isInclusive) {
    // Total amount includes GST
    const base_amount = amount / (1 + rate / 100);
    const gst_amount = amount - base_amount;
    return {
      base_amount: parseFloat(base_amount.toFixed(2)),
      gst_amount: parseFloat(gst_amount.toFixed(2)),
      total_amount: parseFloat(amount.toFixed(2))
    };
  } else {
    // Amount is before GST
    const gst_amount = (amount * rate) / 100;
    const total_amount = amount + gst_amount;
    return {
      base_amount: parseFloat(amount.toFixed(2)),
      gst_amount: parseFloat(gst_amount.toFixed(2)),
      total_amount: parseFloat(total_amount.toFixed(2))
    };
  }
};

function formatINR(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

export default function GSTCalculator() {
  const [amount, setAmount] = useState('10000');
  const [rate, setRate] = useState('18');
  const [mode, setMode] = useState<'exclusive' | 'inclusive'>('exclusive');
  const [result, setResult] = useState<any>(null);
  const { showWords } = useLanguage();
  const { currency } = useSettings();
  const { toast } = useToast();

  const handleCalculate = async () => {
    try {
      let res;
      
      if (isTauri()) {
        // Use Tauri backend calculation
        res = await safeInvoke<any>('calculate_gst', {
          amount: parseFloat(amount),
          rate: parseFloat(rate),
          isInclusive: mode === 'inclusive'
        });
      } else {
        // Use fallback calculation for web environments
        res = calculateGSTFallback(
          parseFloat(amount),
          parseFloat(rate),
          mode === 'inclusive'
        );
      }

      setResult(res);

      await saveToHistory(
        'GST Calculator',
        'Finance',
        { amount, rate, mode },
        { base: res.base_amount, gst: res.gst_amount, total: res.total_amount },
        0
      );
    } catch (err) {
      toast({
        title: "Calculation Error",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (amount && rate) {
      handleCalculate();
    }
  }, [amount, rate, mode]);

  return (
    <Card className="max-w-4xl mx-auto border-none shadow-2xl bg-gradient-to-br from-background via-muted/50 to-background overflow-hidden relative">
      <CardHeader className="bg-primary/5 border-b border-primary/10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Receipt className="w-6 h-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl">GST Calculator</CardTitle>
            <CardDescription>Calculate Goods and Services Tax quickly and accurately.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-8 space-y-8">
        <Tabs value={mode} onValueChange={(v: any) => setMode(v)} className="w-full">
          <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto h-12 p-1 bg-muted rounded-2xl">
            <TabsTrigger value="exclusive" className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm">
              GST Exclusive
            </TabsTrigger>
            <TabsTrigger value="inclusive" className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm">
              GST Inclusive
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold flex items-center gap-2">
                <Wallet className="w-4 h-4 text-primary" />
                {mode === 'exclusive' ? 'Base Amount' : 'Total Amount (Incl. GST)'}
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

            <div className="space-y-4">
              <label className="text-sm font-semibold flex items-center gap-2">
                <Percent className="w-4 h-4 text-primary" />
                GST Rate
              </label>
              <div className="flex flex-wrap gap-2">
                {['5', '12', '18', '28'].map((r) => (
                  <Button
                    key={r}
                    variant={rate === r ? 'default' : 'outline'}
                    onClick={() => setRate(r)}
                    className="flex-1 min-w-[60px] h-12 rounded-xl text-lg font-bold"
                  >
                    {r}%
                  </Button>
                ))}
                <div className="w-full md:w-auto flex-grow">
                  <Input
                    type="number"
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    placeholder="Custom %"
                    className="h-12 rounded-xl text-center font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-muted/30 border space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                <ShieldCheckIcon className="w-4 h-4 text-green-500" />
                India GST Standards
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Automatically splits taxes into CGST (Central) and SGST (State) for intra-state transactions (50/50 split).
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <AnimatePresence mode="wait">
              {result && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-4"
                >
                  <div className="p-6 rounded-3xl bg-primary/5 border-2 border-primary/20 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Zap className="w-16 h-16 text-primary" />
                    </div>
                    
                    <div className="flex justify-between items-end mb-6">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Total Tax (GST)</p>
                        <p className="text-4xl font-black text-primary mb-1">{formatCurrency(result.gst_amount, currency)}</p>
                        {showWords && (
                          <p className="text-[9px] font-bold italic text-primary/70 leading-tight">
                            {numberToWords(result.gst_amount, currency)}
                          </p>
                        )}
                      </div>
                      <Button size="icon" variant="ghost" className="rounded-full h-10 w-10">
                        <Check className="w-5 h-5 text-primary" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t border-primary/10 pt-4">
                      <div className="space-y-1">
                        <p className="text-[9px] uppercase font-bold text-muted-foreground">CGST ({(parseFloat(rate)/2).toFixed(1)}%)</p>
                        <p className="text-sm font-bold">{formatINR(parseFloat(result.gst_amount)/2)}</p>
                      </div>
                      <div className="space-y-1 border-l border-primary/10 pl-4">
                        <p className="text-[9px] uppercase font-bold text-muted-foreground">SGST ({(parseFloat(rate)/2).toFixed(1)}%)</p>
                        <p className="text-sm font-bold">{formatINR(parseFloat(result.gst_amount)/2)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 rounded-3xl border-2 border-border/50 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-muted-foreground">Base Amount</span>
                      <span className="text-lg font-bold font-mono">{formatCurrency(result.base_amount, currency)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold">Net Total</span>
                        {showWords && (
                          <span className="text-[8px] font-bold italic text-muted-foreground leading-tight mt-1 max-w-[150px]">
                            {numberToWords(result.total_amount, currency)}
                          </span>
                        )}
                      </div>
                      <span className="text-2xl font-black font-mono text-primary">{formatCurrency(result.total_amount, currency)}</span>
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
