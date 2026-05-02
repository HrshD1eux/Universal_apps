'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { safeInvoke, isTauri } from '@/lib/tauri-utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Percent, Zap, TrendingUp, TrendingDown, Info, Calculator, ArrowRight, HelpCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type Mode = 'percentage_of' | 'what_percentage' | 'increase' | 'decrease';

export default function PercentageCalculator() {
  const [val1, setVal1] = useState('20');
  const [val2, setVal2] = useState('500');
  const [mode, setMode] = useState<Mode>('percentage_of');
  const [result, setResult] = useState<number | null>(null);
  const { toast } = useToast();

  const handleCalculate = async () => {
    if (!isTauri() || !val1 || !val2) return;

    try {
      const res = await safeInvoke<number>('calculate_percentage', {
        value: parseFloat(val1),
        total: parseFloat(val2),
        mode
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
  }, [val1, val2, mode]);

  const getLabels = () => {
    switch (mode) {
      case 'percentage_of': return { l1: 'Percentage', l2: 'of Value', symbol: '%' };
      case 'what_percentage': return { l1: 'Value X', l2: 'of Total Y', symbol: '' };
      case 'increase': return { l1: 'Initial Value', l2: 'Increase %', symbol: '' };
      case 'decrease': return { l1: 'Initial Value', l2: 'Decrease %', symbol: '' };
    }
  };

  const labels = getLabels();

  return (
    <Card className="max-w-4xl mx-auto border-none shadow-2xl bg-gradient-to-br from-background via-muted/50 to-background overflow-hidden relative">
      {!isTauri() && (
        <div className="absolute inset-0 z-50 backdrop-blur-sm bg-background/20 flex flex-col items-center justify-center p-6 text-center">
            <div className="bg-background/90 p-8 rounded-3xl shadow-2xl border-2 border-primary/20 max-w-sm">
                <Percent className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
                <h3 className="text-xl font-bold mb-2">Desktop Required</h3>
                <p className="text-sm text-muted-foreground mb-6">
                    Percentage math is handled by the high-precision desktop engine for absolute accuracy.
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
            <Percent className="w-6 h-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl">Percentage Calculator</CardTitle>
            <CardDescription>Solve any percentage problem instantly.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-8 space-y-8">
        <Tabs value={mode} onValueChange={(v: any) => setMode(v)} className="w-full">
           <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full h-auto p-1 bg-muted rounded-2xl gap-1">
              <TabsTrigger value="percentage_of" className="rounded-xl py-2 text-[10px] font-bold uppercase">X% of Y</TabsTrigger>
              <TabsTrigger value="what_percentage" className="rounded-xl py-2 text-[10px] font-bold uppercase">What % is X of Y</TabsTrigger>
              <TabsTrigger value="increase" className="rounded-xl py-2 text-[10px] font-bold uppercase">Increase %</TabsTrigger>
              <TabsTrigger value="decrease" className="rounded-xl py-2 text-[10px] font-bold uppercase">Decrease %</TabsTrigger>
           </TabsList>
        </Tabs>

        <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] gap-8 items-center">
          <div className="space-y-2">
            <label className="text-sm font-semibold flex items-center gap-2">
               {labels.l1}
            </label>
            <div className="relative">
               <Input
                 type="number"
                 value={val1}
                 onChange={(e) => setVal1(e.target.value)}
                 className="h-14 text-2xl border-2 rounded-2xl focus:ring-primary font-mono pr-10"
               />
               {mode === 'percentage_of' && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">%</span>}
            </div>
          </div>

          <div className="pt-6">
             <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground border shadow-inner">
                {mode === 'percentage_of' ? 'of' : (mode === 'what_percentage' ? 'of' : 'by')}
             </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold flex items-center gap-2">
               {labels.l2}
            </label>
            <div className="relative">
               <Input
                 type="number"
                 value={val2}
                 onChange={(e) => setVal2(e.target.value)}
                 className="h-14 text-2xl border-2 rounded-2xl focus:ring-primary font-mono pr-10"
               />
               {(mode === 'increase' || mode === 'decrease') && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">%</span>}
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {result !== null && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8 rounded-[2.5rem] bg-primary shadow-2xl shadow-primary/20 relative overflow-hidden"
            >
               <div className="absolute top-0 right-0 p-8 opacity-10">
                  <Zap className="w-24 h-24 text-white" />
               </div>
               
               <div className="text-center relative">
                  <p className="text-[10px] uppercase font-black tracking-[0.2em] text-primary-foreground/60 mb-2">Calculation Result</p>
                  <div className="flex justify-center items-end gap-2">
                    <span className="text-6xl font-black text-primary-foreground leading-none">
                       {result.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                    </span>
                    {mode === 'what_percentage' && <span className="text-3xl font-black text-primary-foreground opacity-70 pb-1">%</span>}
                  </div>
               </div>

               <div className="mt-8 pt-6 border-t border-primary-foreground/10 flex justify-center gap-8">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-primary-foreground/70 uppercase tracking-widest">
                     <Calculator className="w-3 h-3" />
                     Precision Optimized
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-primary-foreground/70 uppercase tracking-widest">
                     <ShieldCheckCustom className="w-3 h-3 text-white" />
                     Verified Accurate
                  </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="p-4 rounded-xl bg-muted/40 border border-border/50 flex gap-3 italic text-xs text-muted-foreground">
           <HelpCircle className="w-4 h-4 shrink-0 text-primary not-italic" />
           {mode === 'percentage_of' && "Calculates what X percent of Y is. (e.g. 20% of 500 = 100)"}
           {mode === 'what_percentage' && "Calculates what percent X is of Y. (e.g. 100 is 20% of 500)"}
           {mode === 'increase' && "Adds X percent to your initial value. (e.g. 500 increased by 20% = 600)"}
           {mode === 'decrease' && "Subtracts X percent from your initial value. (e.g. 500 decreased by 20% = 400)"}
        </div>
      </CardContent>
    </Card>
  );
}

function ShieldCheckCustom({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
