'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { saveToHistory } from '@/lib/db';
import { safeInvoke, isTauri } from '@/lib/tauri-utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Tag, Percent, ShoppingBag, Zap, TrendingDown, ArrowRight, ShieldCheck as ShieldCheckIcon, Info, Coins } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, numberToWords } from '@/lib/utils';
import { useSettings } from '@/context/settings-context';

export default function DiscountCalculator() {
  const { currency } = useSettings();
  const [price, setPrice] = useState('1000');
  const [discount, setDiscount] = useState('20');
  const [tax, setTax] = useState('18');
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const handleCalculate = async () => {
    if (!isTauri() || !price || !discount) return;

    try {
      const res = await safeInvoke<any>('calculate_discount', {
        price: parseFloat(price),
        discountPct: parseFloat(discount),
        taxPct: parseFloat(tax || '0')
      });
      setResult(res);

      await saveToHistory(
        'Discount Calculator',
        'Finance',
        { price, discount, tax },
        { savings: res.savings, final_price: res.final_price },
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
    handleCalculate();
  }, [price, discount, tax]);

  return (
    <Card className="max-w-4xl mx-auto border-none shadow-2xl bg-gradient-to-br from-background via-muted/50 to-background overflow-hidden relative">
      {!isTauri() && (
        <div className="absolute inset-0 z-50 backdrop-blur-sm bg-background/20 flex flex-col items-center justify-center p-6 text-center">
            <div className="bg-background/90 p-8 rounded-3xl shadow-2xl border-2 border-primary/20 max-w-sm">
                <Tag className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
                <h3 className="text-xl font-bold mb-2">Desktop Required</h3>
                <p className="text-sm text-muted-foreground mb-6">
                    Real-time retail price calculations are optimized using the local desktop engine.
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
            <Tag className="w-6 h-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl">Discount Calculator</CardTitle>
            <CardDescription>Calculate final price after discounts and taxes.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold flex items-center gap-2">
                <Tag className="w-4 h-4 text-primary" />
                Original Price
              </label>
              <Input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="h-14 text-2xl border-2 rounded-2xl focus:ring-primary font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                  <label className="text-sm font-semibold flex items-center gap-2">
                     <Percent className="w-4 h-4 text-primary" />
                     Discount %
                  </label>
                  <Input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    className="h-12 border-2 rounded-xl font-mono"
                  />
               </div>
               <div className="space-y-2">
                  <label className="text-sm font-semibold flex items-center gap-2">
                     Tax %
                  </label>
                  <Input
                    type="number"
                    value={tax}
                    onChange={(e) => setTax(e.target.value)}
                    className="h-12 border-2 rounded-xl font-mono"
                  />
               </div>
            </div>

            <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex gap-3">
                <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Tax is applied to the discounted price. This matches standard retail checkout procedures.
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
                  <div className="p-8 rounded-[2.5rem] bg-card border-4 border-primary/10 shadow-xl relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                        <ShoppingBag className="w-24 h-24 text-primary" />
                     </div>
                     
                     <div className="text-center space-y-2 relative">
                        <p className="text-xs uppercase font-black tracking-widest text-muted-foreground">You Pay</p>
                        <p className="text-5xl font-black mb-1">{formatCurrency(result.final_price, currency)}</p>
                        <p className="text-[10px] text-primary/70 font-bold italic mt-1 leading-tight">
                           {numberToWords(result.final_price, currency)}
                        </p>
                     </div>

                     <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-dashed">
                        <div>
                           <p className="text-[10px] uppercase font-bold text-green-600/70 mb-1">Total Savings</p>
                           <p className="text-xl font-bold text-green-500">{formatCurrency(result.savings, currency)}</p>
                        </div>
                        <div className="border-l pl-4">
                           <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Tax Collected</p>
                           <p className="text-xl font-bold">{formatCurrency(result.tax_amount, currency)}</p>
                        </div>
                     </div>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-2xl bg-primary/5 border border-primary/20">
                     <div className="flex items-center gap-2 text-xs font-bold text-primary">
                        <TrendingDown className="w-4 h-4" />
                        Effective Off
                     </div>
                     <span className="text-lg font-black text-primary">
                        {((parseFloat(result.savings) / parseFloat(price)) * 100).toFixed(1)}%
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
