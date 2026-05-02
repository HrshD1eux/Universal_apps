'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Plus, Trash2, TrendingUp, TrendingDown, Target, Wallet, ArrowUpRight, ArrowDownRight, Sparkles } from 'lucide-react';
import { safeInvoke, isTauri } from '@/lib/tauri-utils';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';
import { useLanguage } from '@/context/language-context';
import { useSettings } from '@/context/settings-context';

export default function StockAverage() {
  const [entries, setEntries] = useState([{ price: '', qty: '' }]);
  const [targetPrice, setTargetPrice] = useState('');
  const [result, setResult] = useState<any>(null);
  const { t } = useLanguage();
  const { currency } = useSettings();
  const { toast } = useToast();

  const handleCalculate = async () => {
    if (!isTauri()) return;
    const validEntries = entries
      .filter(e => e.price && e.qty)
      .map(e => ({ price: parseFloat(e.price), qty: parseFloat(e.qty) }));

    if (validEntries.length === 0) return;

    try {
      const res = await safeInvoke<any>('calculate_stock_average', { entries: validEntries });
      setResult(res);
    } catch (err) {
      toast({ title: "Calculation Error", description: String(err), variant: "destructive" });
    }
  };

  useEffect(() => {
    handleCalculate();
  }, [entries]);

  const addEntry = () => setEntries([...entries, { price: '', qty: '' }]);
  const removeEntry = (index: number) => {
    if (entries.length > 1) {
      setEntries(entries.filter((_, i) => i !== index));
    }
  };

  const updateEntry = (index: number, field: 'price' | 'qty', value: string) => {
    const newEntries = [...entries];
    newEntries[index][field] = value;
    setEntries(newEntries);
  };

  const projection = result && targetPrice ? {
    profit: (parseFloat(targetPrice) - result.avg_price) * result.total_qty,
    percent: ((parseFloat(targetPrice) - result.avg_price) / result.avg_price) * 100
  } : null;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr,1fr] gap-8">
        <Card className="border-none shadow-2xl bg-card/50 backdrop-blur-xl border-2 border-primary/5">
          <CardHeader className="border-b bg-primary/5 p-8">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <div className="p-4 bg-blue-500/10 rounded-2xl">
                    <BarChart className="w-7 h-7 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-3xl font-black">{t('stockAvgTitle')}</CardTitle>
                    <CardDescription className="text-base font-medium">{t('stockAvgDesc')}</CardDescription>
                  </div>
               </div>
               <Button onClick={addEntry} size="sm" className="rounded-xl gap-2 font-bold px-6 shadow-lg shadow-primary/20">
                  <Plus className="w-4 h-4" /> ADD ENTRY
               </Button>
            </div>
          </CardHeader>
          
          <CardContent className="p-8">
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 scrollbar-hide">
              <AnimatePresence mode="popLayout">
                {entries.map((entry, index) => (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex items-center gap-4 group"
                  >
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-[10px] font-black opacity-40 shrink-0">
                       {index + 1}
                    </div>
                    <div className="flex-1 grid grid-cols-2 gap-4">
                      <div className="relative">
                        <Input
                          placeholder="Price"
                          type="number"
                          value={entry.price}
                          onChange={(e) => updateEntry(index, 'price', e.target.value)}
                          className="h-14 rounded-2xl border-2 bg-background/50 pl-4 font-mono text-lg focus:ring-blue-500"
                        />
                      </div>
                      <div className="relative">
                        <Input
                          placeholder="Quantity"
                          type="number"
                          value={entry.qty}
                          onChange={(e) => updateEntry(index, 'qty', e.target.value)}
                          className="h-14 rounded-2xl border-2 bg-background/50 pl-4 font-mono text-lg focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => removeEntry(index)}
                      className="rounded-xl text-destructive hover:bg-destructive/10 h-14 w-14 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>

        {/* Advanced Summary & Projections */}
        <div className="space-y-6">
           <Card className="border-none shadow-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white overflow-hidden relative">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                 <TrendingUp className="w-32 h-32" />
              </div>
              <CardContent className="p-10 relative z-10">
                 <div className="flex items-center gap-2 mb-8 text-[10px] font-black uppercase tracking-[0.2em] opacity-60">
                    <Wallet className="w-3 h-3" /> Portfolio Average
                 </div>
                 <div className="space-y-2">
                    <p className="text-sm font-bold opacity-80">Average Buy Price</p>
                    <p className="text-5xl font-black">{result ? formatCurrency(result.avg_price, currency) : '---'}</p>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-8 mt-12 pt-8 border-t border-white/10">
                    <div>
                       <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Total Qty</p>
                       <p className="text-2xl font-black">{result?.total_qty || '0'}</p>
                    </div>
                    <div>
                       <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Total Cost</p>
                       <p className="text-2xl font-black">{result ? formatCurrency(result.total_cost, currency) : '---'}</p>
                    </div>
                 </div>
              </CardContent>
           </Card>

           <Card className="border-none shadow-xl bg-card/50 backdrop-blur-xl border-2 border-primary/5">
              <CardContent className="p-8 space-y-6">
                 <div className="flex items-center gap-2 mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">
                    <Target className="w-3 h-3" /> Profit/Loss Projection
                 </div>
                 <div className="space-y-2">
                    <label className="text-xs font-bold uppercase opacity-60">Target Selling Price</label>
                    <Input 
                      type="number" 
                      placeholder="Enter target price..." 
                      value={targetPrice}
                      onChange={(e) => setTargetPrice(e.target.value)}
                      className="h-14 rounded-2xl border-2 text-xl font-black focus:ring-blue-500"
                    />
                 </div>

                 {projection && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`p-6 rounded-3xl border-2 flex items-center justify-between transition-all ${
                        projection.profit >= 0 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' : 'bg-rose-500/10 border-rose-500/20 text-rose-600'
                      }`}
                    >
                       <div>
                          <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Potential {projection.profit >= 0 ? 'Profit' : 'Loss'}</p>
                          <p className="text-2xl font-black">{formatCurrency(projection.profit, currency)}</p>
                       </div>
                       <div className="text-right">
                          <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Return (%)</p>
                          <p className="text-2xl font-black flex items-center gap-1">
                             {projection.profit >= 0 ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                             {projection.percent.toFixed(2)}%
                          </p>
                       </div>
                    </motion.div>
                 )}

                 {!projection && (
                    <div className="p-8 rounded-3xl bg-muted/30 border-2 border-dashed flex flex-col items-center text-center space-y-3">
                       <Sparkles className="w-6 h-6 text-muted-foreground opacity-40" />
                       <p className="text-xs font-bold text-muted-foreground">Enter a target price to see your <br/> projected profit or loss.</p>
                    </div>
                 )}
              </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
}
