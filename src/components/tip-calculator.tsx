'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { safeInvoke, isTauri } from '@/lib/tauri-utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Users, Percent, Zap, HandCoins, Info, Coffee, UtensilsCrossed, Pizza } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';
import { useSettings } from '@/context/settings-context';

export default function TipCalculator() {
  const [bill, setBill] = useState('1000');
  const [tipPct, setTipPct] = useState('15');
  const [people, setPeople] = useState('2');
  const [result, setResult] = useState<any>(null);
  const { currency } = useSettings();
  const { toast } = useToast();

  const handleCalculate = async () => {
    if (!isTauri() || !bill) return;

    try {
      const res = await safeInvoke<any>('calculate_tip', {
        bill: parseFloat(bill),
        tipPct: parseFloat(tipPct),
        people: parseInt(people)
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
  }, [bill, tipPct, people]);

  return (
    <Card className="max-w-4xl mx-auto border-none shadow-2xl bg-gradient-to-br from-background via-muted/50 to-background overflow-hidden relative">
      {!isTauri() && (
        <div className="absolute inset-0 z-50 backdrop-blur-sm bg-background/20 flex flex-col items-center justify-center p-6 text-center">
            <div className="bg-background/90 p-8 rounded-3xl shadow-2xl border-2 border-primary/20 max-w-sm">
                <Coffee className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
                <h3 className="text-xl font-bold mb-2">Desktop Required</h3>
                <p className="text-sm text-muted-foreground mb-6">
                    Real-time bill splitting arithmetic is handled by the local desktop engine.
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
            <UtensilsCrossed className="w-6 h-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl">Tip & Split Calculator</CardTitle>
            <CardDescription>Split bills among friends with custom tips.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-6">
             <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-primary" />
                  Bill Amount
                </label>
                <Input
                  type="number"
                  value={bill}
                  onChange={(e) => setBill(e.target.value)}
                  className="h-14 text-2xl border-2 rounded-2xl focus:ring-primary font-mono"
                />
             </div>

             <div className="space-y-3">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <Percent className="w-4 h-4 text-primary" />
                  Tip Percentage
                </label>
                <div className="flex gap-2">
                   {[10, 15, 20, 25].map(pct => (
                      <Button 
                        key={pct} 
                        variant={tipPct === pct.toString() ? 'default' : 'outline'}
                        onClick={() => setTipPct(pct.toString())}
                        className="flex-1 rounded-xl font-bold"
                      >
                         {pct}%
                      </Button>
                   ))}
                </div>
                <Input
                  type="number"
                  value={tipPct}
                  onChange={(e) => setTipPct(e.target.value)}
                  placeholder="Custom Tip %"
                  className="h-10 border-2 rounded-xl font-mono text-center"
                />
             </div>

             <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  Number of People
                </label>
                <Input
                  type="number"
                  value={people}
                  onChange={(e) => setPeople(e.target.value)}
                  min="1"
                  className="h-14 text-2xl border-2 rounded-2xl focus:ring-primary font-mono text-center"
                />
             </div>
          </div>

          <div className="space-y-6">
            <AnimatePresence mode="wait">
              {result && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-6"
                >
                   <div className="p-8 rounded-[2.5rem] bg-primary text-primary-foreground shadow-2xl relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-8 opacity-10">
                         <Pizza className="w-24 h-24" />
                      </div>
                      <div className="text-center relative">
                         <p className="text-[10px] uppercase font-black tracking-widest opacity-60 mb-2">Total per Person</p>
                         <p className="text-6xl font-black">{formatCurrency(result.per_person_bill, currency)}</p>
                         <p className="text-xs mt-2 opacity-80 font-bold">
                            Inc. {formatCurrency(result.per_person_tip, currency)} tip
                         </p>
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div className="p-5 rounded-3xl bg-muted/40 border-2 border-border/50">
                         <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Total Tip</p>
                         <p className="text-2xl font-black text-primary">{formatCurrency(result.tip_amount, currency)}</p>
                      </div>
                      <div className="p-5 rounded-3xl bg-muted/40 border-2 border-border/50">
                         <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Total Payable</p>
                         <p className="text-2xl font-black text-primary">{formatCurrency(result.total_amount, currency)}</p>
                      </div>
                   </div>

                   <div className="p-4 rounded-xl border border-dashed border-primary/30 flex items-center gap-3">
                      <HandCoins className="w-5 h-5 text-primary" />
                      <p className="text-[10px] text-muted-foreground font-medium leading-relaxed">
                         Calculated precisely for {people} {parseInt(people) === 1 ? 'person' : 'people'}. 
                         Tip split is accounted for individually.
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
