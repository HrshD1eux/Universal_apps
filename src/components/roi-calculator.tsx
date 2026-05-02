'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { safeInvoke, isTauri } from '@/lib/tauri-utils';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Target, Activity, Calendar, ArrowUpRight, ArrowDownRight, Info, PieChart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';
import { useSettings } from '@/context/settings-context';

export default function ROICalculator() {
  const [initial, setInitial] = useState('100000');
  const [current, setCurrent] = useState('150000');
  const [years, setYears] = useState('5');
  const [result, setResult] = useState<any>(null);
  const { currency } = useSettings();
  const { toast } = useToast();

  const handleCalculate = async () => {
    if (!isTauri() || !initial || !current) return;

    try {
      const res = await safeInvoke<any>('calculate_roi', {
        initial: parseFloat(initial),
        current: parseFloat(current),
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
    handleCalculate();
  }, [initial, current, years]);

  const isProfit = result ? parseFloat(result.profit) >= 0 : true;

  return (
    <Card className="max-w-4xl mx-auto border-none shadow-2xl bg-gradient-to-br from-background via-muted/50 to-background overflow-hidden relative">
      {!isTauri() && (
        <div className="absolute inset-0 z-50 backdrop-blur-sm bg-background/20 flex flex-col items-center justify-center p-6 text-center">
            <div className="bg-background/90 p-8 rounded-3xl shadow-2xl border-2 border-primary/20 max-w-sm">
                <Target className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
                <h3 className="text-xl font-bold mb-2">Desktop Required</h3>
                <p className="text-sm text-muted-foreground mb-6">
                    Investment ROI and CAGR metrics are calculated using the local desktop engine.
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
            <CardTitle className="text-2xl">ROI Calculator</CardTitle>
            <CardDescription>Analyze investment returns and annualized growth (CAGR).</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-6">
             <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                  Initial Investment
                </label>
                <Input
                  type="number"
                  value={initial}
                  onChange={(e) => setInitial(e.target.value)}
                  className="h-14 text-2xl border-2 rounded-2xl focus:ring-primary font-mono"
                />
             </div>

             <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                  Current Value
                </label>
                <Input
                  type="number"
                  value={current}
                  onChange={(e) => setCurrent(e.target.value)}
                  className="h-14 text-2xl border-2 rounded-2xl focus:ring-primary font-mono"
                />
             </div>

             <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                  Duration (Years)
                </label>
                <Input
                  type="number"
                  value={years}
                  onChange={(e) => setYears(e.target.value)}
                  className="h-12 border-2 rounded-xl focus:ring-primary font-mono text-center"
                />
             </div>

             <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex gap-3">
                <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Annualized ROI represents the geometric mean return (CAGR) over the specified duration.
                </p>
            </div>
          </div>

          <div className="space-y-6">
            <AnimatePresence mode="wait">
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                   <div className={`p-8 rounded-[2.5rem] border-4 relative overflow-hidden transition-all ${isProfit ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                      <div className="absolute top-0 right-0 p-8 opacity-10">
                         {isProfit ? <TrendingUp className="w-24 h-24 text-green-500" /> : <TrendingDown className="w-24 h-24 text-red-500" />}
                      </div>
                      
                      <div className="text-center relative">
                         <p className={`text-[10px] uppercase font-black tracking-widest mb-2 ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                            {isProfit ? 'Total Profit' : 'Total Loss'}
                         </p>
                         <div className="flex items-center justify-center gap-2">
                            {isProfit ? <ArrowUpRight className="w-8 h-8 text-green-500" /> : <ArrowDownRight className="w-8 h-8 text-red-500" />}
                            <p className={`text-5xl font-black ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                               {formatCurrency(Math.abs(parseFloat(result.profit)), currency)}
                            </p>
                         </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-dashed border-border/50">
                         <div className="text-center">
                            <p className="text-[10px] uppercase font-black text-muted-foreground mb-1">Simple ROI</p>
                            <p className={`text-2xl font-black ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                               {result.roi_pct}%
                            </p>
                         </div>
                         <div className="text-center border-l">
                            <p className="text-[10px] uppercase font-black text-muted-foreground mb-1">Annualized</p>
                            <p className="text-2xl font-black text-primary">
                               {result.annualized_roi_pct || '--'}%
                            </p>
                         </div>
                      </div>
                   </div>

                   <div className="flex items-center justify-between p-4 rounded-2xl bg-primary/5 border border-primary/20">
                      <div className="flex items-center gap-2 text-xs font-bold text-primary">
                         <PieChart className="w-4 h-4" />
                         Capital Growth
                      </div>
                      <span className="text-lg font-black">
                         {(parseFloat(current) / parseFloat(initial)).toFixed(2)}x
                      </span>
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
