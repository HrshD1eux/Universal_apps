'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Scale, Coins, Trash, Plus, CheckCircle2, TrendingDown, Info, Package } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useSettings } from '@/context/settings-context';
import { safeInvoke, isTauri } from '@/lib/tauri-utils';
import { useToast } from '@/hooks/use-toast';

interface ProductItem {
  id: string;
  name: string;
  price: string;
  quantity: string;
  unit: string;
}

export default function PriceComparison() {
  const { currency } = useSettings();
  const [items, setItems] = useState<ProductItem[]>([
    { id: '1', name: 'Option A', price: '500', quantity: '500', unit: 'g' },
    { id: '2', name: 'Option B', price: '900', quantity: '1000', unit: 'g' },
  ]);
  const [results, setResults] = useState<any[]>([]);
  const { toast } = useToast();

  const handleCalculate = async () => {
    if (!isTauri()) return;

    try {
        const validItems = items.filter(i => {
            const p = parseFloat(i.price);
            const q = parseFloat(i.quantity);
            return !isNaN(p) && !isNaN(q) && q > 0;
        });

        if (validItems.length === 0) {
            setResults([]);
            return;
        }

        const res = await safeInvoke<any>('calculate_price_comparison', {
            items: validItems.map(i => ({
                name: i.name,
                price: parseFloat(i.price),
                quantity: parseFloat(i.quantity)
            }))
        });

        // Merge results back with items to keep ID and unit
        const processed = res.items.map((r: any) => {
            const original = validItems.find(i => i.name === r.name);
            return {
                ...original,
                cpu: r.unit_price,
                savings: r.savings_vs_best
            };
        }).sort((a: any, b: any) => a.cpu - b.cpu);

        setResults(processed);
    } catch (err) {
        // Silently fail
    }
  };

  useEffect(() => {
    handleCalculate();
  }, [items]);

  const bestValue = results.length > 0 ? results[0] : null;

  const addItem = () => {
    const nextId = (Math.max(0, ...items.map(i => parseInt(i.id))) + 1).toString();
    setItems([...items, { id: nextId, name: `Option ${String.fromCharCode(65 + items.length)}`, price: '', quantity: '', unit: 'g' }]);
  };

  const removeItem = (id: string) => {
    if (items.length <= 2) return;
    setItems(items.filter(i => i.id !== id));
  };

  const updateItem = (id: string, field: keyof ProductItem, value: string) => {
    setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  return (
    <Card className="max-w-4xl mx-auto border-none shadow-2xl bg-gradient-to-br from-background via-muted/50 to-background overflow-hidden">
      <CardHeader className="bg-primary/5 border-b border-primary/10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Scale className="w-6 h-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl">Price Comparison</CardTitle>
            <CardDescription>Find the best value by comparing cost per unit.</CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Comparison List */}
          <div className="space-y-6">
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {items.map((item, idx) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="p-4 rounded-2xl bg-card border-2 border-border/50 shadow-sm relative group"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <Input 
                        value={item.name} 
                        onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                        className="w-1/2 h-8 border-none bg-transparent font-bold text-sm focus-visible:ring-0 p-0"
                      />
                      {items.length > 2 && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => removeItem(item.id)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive rounded-lg group-hover:bg-destructive/10"
                        >
                          <Trash className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Price</label>
                        <div className="relative">
                          <Coins className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                          <Input 
                            type="number" 
                            placeholder="0"
                            value={item.price} 
                            onChange={(e) => updateItem(item.id, 'price', e.target.value)}
                            className="h-10 pl-8 border-2 rounded-xl font-mono text-sm"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Qty</label>
                        <Input 
                          type="number" 
                          placeholder="0"
                          value={item.quantity} 
                          onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                          className="h-10 border-2 rounded-xl font-mono text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Unit</label>
                        <Input 
                          placeholder="g / ml"
                          value={item.unit} 
                          onChange={(e) => updateItem(item.id, 'unit', e.target.value)}
                          className="h-10 border-2 rounded-xl text-sm"
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <Button 
              onClick={addItem} 
              variant="outline" 
              className="w-full h-12 border-dashed border-2 rounded-2xl text-muted-foreground hover:text-primary hover:border-primary transition-all"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Another Option
            </Button>
          </div>

          {/* Analysis Result */}
          <div className="space-y-6">
             <div className="p-6 rounded-[2.5rem] bg-muted/20 border-2 border-border/50 h-full flex flex-col">
                <div className="flex items-center gap-2 mb-6">
                   <div className="p-2 bg-primary/10 rounded-lg">
                      <TrendingDown className="w-5 h-5 text-primary" />
                   </div>
                   <p className="text-sm font-bold uppercase tracking-wider">Analysis</p>
                </div>

                <div className="space-y-4 flex-grow">
                   {results.filter(r => r.cpu !== Infinity).map((res, idx) => {
                      const isBest = res.id === bestValue?.id;
                      const savings = idx > 0 && bestValue ? ((res.cpu - bestValue.cpu) / res.cpu * 100).toFixed(1) : 0;
                      
                      return (
                        <div key={res.id} className={`p-4 rounded-2xl border-2 transition-all ${isBest ? 'bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105' : 'bg-card border-border/50'}`}>
                           <div className="flex items-center justify-between mb-2">
                              <span className={`text-xs font-black uppercase tracking-widest ${isBest ? 'opacity-80' : 'text-muted-foreground'}`}>{res.name}</span>
                              {isBest && <CheckCircle2 className="w-5 h-5" />}
                           </div>
                           <div className="flex items-end justify-between">
                              <div>
                                 <p className="text-2xl font-black">{formatCurrency(res.cpu, currency)}<span className="text-xs font-normal opacity-70"> / {res.unit}</span></p>
                              </div>
                              {idx > 0 && !isBest && (
                                 <div className="text-[10px] font-bold text-red-500 bg-red-500/10 py-1 px-2 rounded-full">
                                    {savings}% More Expensive
                                 </div>
                              )}
                              {isBest && items.filter(i => i.price !== '').length > 1 && (
                                <div className="text-[10px] font-bold text-white bg-white/20 py-1 px-2 rounded-full">
                                    Best Value
                                 </div>
                              )}
                           </div>
                        </div>
                      )
                   })}

                   {items.every(i => i.price === '') && (
                      <div className="h-full flex flex-col items-center justify-center text-center opacity-30 space-y-3">
                         <Package className="w-12 h-12" />
                         <p className="text-sm font-medium">Enter price and quantity to start comparing.</p>
                      </div>
                   )}
                </div>

                <div className="mt-8 p-4 rounded-xl bg-primary/5 border border-primary/10 flex gap-3">
                    <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <p className="text-[10px] text-muted-foreground leading-relaxed italic">
                      Always ensure units (g, ml, kg) are consistent across all items for an accurate comparison.
                    </p>
                </div>
             </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
