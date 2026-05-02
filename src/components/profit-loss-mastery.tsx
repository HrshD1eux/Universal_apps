'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Tag, TrendingUp, TrendingDown, Percent, Sparkles, 
  Calculator, Zap, Info, ArrowRight, RotateCcw, Scale
} from 'lucide-react';
import { useLanguage } from '@/context/language-context';

export default function ProfitLossMastery() {
  const [activeTab, setActiveTab] = useState<'successive' | 'markup' | 'faulty'>('successive');
  const [discounts, setDiscounts] = useState('10, 20');
  const [costPrice, setCostPrice] = useState('1000');
  const [markupPercent, setMarkupPercent] = useState('40');
  const [discountOnMarked, setDiscountOnMarked] = useState('15');
  const [claimedWeight, setClaimedWeight] = useState('1000');
  const [actualWeight, setActualWeight] = useState('900');

  const { t } = useLanguage();

  const analysis = useMemo(() => {
    // Successive Discounts
    const discArray = discounts.split(',').map(n => parseFloat(n.trim())).filter(n => !isNaN(n));
    let netMultiplier = 1;
    discArray.forEach(d => netMultiplier *= (1 - d / 100));
    const singleDiscount = (1 - netMultiplier) * 100;

    // Markup & Profit
    const cp = parseFloat(costPrice) || 0;
    const mp = cp * (1 + parseFloat(markupPercent) / 100);
    const sp = mp * (1 - parseFloat(discountOnMarked) / 100);
    const profit = sp - cp;
    const profitPercent = (profit / cp) * 100;

    // Faulty Weight
    const claimed = parseFloat(claimedWeight) || 1000;
    const actual = parseFloat(actualWeight) || 1000;
    const faultyProfitPercent = ((claimed - actual) / actual) * 100;

    return { singleDiscount, sp, mp, profit, profitPercent, faultyProfitPercent };
  }, [discounts, costPrice, markupPercent, discountOnMarked, claimedWeight, actualWeight]);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <Card className="border-none shadow-2xl bg-gradient-to-br from-background via-muted/50 to-background overflow-hidden font-sans">
        <CardHeader className="bg-primary/5 border-b border-primary/10 p-8">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex items-center gap-4">
                 <div className="p-4 bg-primary text-primary-foreground rounded-2xl shadow-lg shadow-primary/20">
                    <Tag className="w-8 h-8" />
                 </div>
                 <div>
                    <CardTitle className="text-3xl font-black tracking-tight uppercase">Profit & Loss Master</CardTitle>
                    <CardDescription className="text-base font-bold text-primary/60">Successive discounts, markup analysis, and aptitude math.</CardDescription>
                 </div>
              </div>
              
              <div className="flex p-1 bg-muted rounded-2xl border-2">
                 {[
                   { id: 'successive', label: 'DISCOUNTS' },
                   { id: 'markup', label: 'MARKUP' },
                   { id: 'faulty', label: 'APTITUDE' }
                 ].map(tab => (
                   <button
                     key={tab.id}
                     onClick={() => setActiveTab(tab.id as any)}
                     className={`px-6 py-2.5 rounded-xl text-[10px] font-black transition-all ${activeTab === tab.id ? 'bg-background shadow-lg text-primary scale-105' : 'text-muted-foreground hover:text-primary'}`}
                   >
                     {tab.label}
                   </button>
                 ))}
              </div>
           </div>
        </CardHeader>

        <CardContent className="p-8">
           <div className="grid grid-cols-1 lg:grid-cols-[1fr,1.2fr] gap-12">
              <div className="space-y-8">
                 <AnimatePresence mode="wait">
                    {activeTab === 'successive' && (
                       <motion.div key="successive" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
                          <div className="space-y-4">
                             <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Successive Discounts (%)</label>
                             <Input 
                               value={discounts} 
                               onChange={(e) => setDiscounts(e.target.value)} 
                               className="h-16 rounded-2xl border-2 font-black text-2xl focus:ring-primary pl-6"
                               placeholder="10, 20, 30"
                             />
                             <p className="text-[10px] font-bold text-muted-foreground ml-2">Enter values separated by commas.</p>
                          </div>
                          
                          <div className="p-10 rounded-[3rem] bg-primary text-primary-foreground shadow-2xl relative overflow-hidden group">
                             <Sparkles className="absolute top-0 right-0 p-8 w-40 h-40 opacity-10 group-hover:scale-110 transition-transform" />
                             <div className="relative z-10">
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Single Equivalent Discount</p>
                                <p className="text-6xl font-black">{analysis.singleDiscount.toFixed(2)}%</p>
                                <div className="mt-8 pt-8 border-t border-white/10">
                                   <p className="text-[10px] font-bold opacity-60 italic leading-relaxed">
                                      A successive discount of {discounts} is equal to a single flat discount of {analysis.singleDiscount.toFixed(2)}%.
                                   </p>
                                </div>
                             </div>
                          </div>
                       </motion.div>
                    )}

                    {activeTab === 'markup' && (
                       <motion.div key="markup" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
                          <div className="grid grid-cols-1 gap-4">
                             <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Cost Price (CP)</label>
                                <Input type="number" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} className="h-12 rounded-xl border-2 font-black" />
                             </div>
                             <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                   <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Markup (%)</label>
                                   <Input type="number" value={markupPercent} onChange={(e) => setMarkupPercent(e.target.value)} className="h-12 rounded-xl border-2 font-black" />
                                </div>
                                <div className="space-y-2">
                                   <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Discount (%)</label>
                                   <Input type="number" value={discountOnMarked} onChange={(e) => setDiscountOnMarked(e.target.value)} className="h-12 rounded-xl border-2 font-black" />
                                </div>
                             </div>
                          </div>

                          <div className={`p-10 rounded-[3rem] shadow-2xl relative overflow-hidden transition-colors ${analysis.profit >= 0 ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
                             <div className="relative z-10 space-y-8">
                                <div className="flex justify-between items-start">
                                   <div>
                                      <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Net Profit Percentage</p>
                                      <p className="text-5xl font-black">{analysis.profitPercent.toFixed(2)}%</p>
                                   </div>
                                   {analysis.profit >= 0 ? <TrendingUp className="w-12 h-12 opacity-20" /> : <TrendingDown className="w-12 h-12 opacity-20" />}
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-8 border-t border-white/10">
                                   <div>
                                      <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Marked Price</p>
                                      <p className="text-xl font-black">{analysis.mp.toFixed(2)}</p>
                                   </div>
                                   <div>
                                      <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Selling Price</p>
                                      <p className="text-xl font-black">{analysis.sp.toFixed(2)}</p>
                                   </div>
                                </div>
                             </div>
                          </div>
                       </motion.div>
                    )}

                    {activeTab === 'faulty' && (
                       <motion.div key="faulty" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
                          <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Claimed Wt (g)</label>
                                <Input type="number" value={claimedWeight} onChange={(e) => setClaimedWeight(e.target.value)} className="h-12 rounded-xl border-2 font-black text-center" />
                             </div>
                             <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Actual Wt (g)</label>
                                <Input type="number" value={actualWeight} onChange={(e) => setActualWeight(e.target.value)} className="h-12 rounded-xl border-2 font-black text-center" />
                             </div>
                          </div>

                          <div className="p-10 rounded-[3rem] bg-indigo-600 text-white shadow-2xl relative overflow-hidden">
                             <Scale className="absolute top-0 right-0 p-8 w-40 h-40 opacity-10" />
                             <div className="relative z-10">
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Trader's Profit (Faulty Weight)</p>
                                <p className="text-6xl font-black">{analysis.faultyProfitPercent.toFixed(2)}%</p>
                                <p className="mt-8 text-xs font-bold opacity-60 leading-relaxed uppercase tracking-widest">Aptitude Logic: Profit = (Error / Actual) × 100</p>
                             </div>
                          </div>
                       </motion.div>
                    )}
                 </AnimatePresence>
              </div>

              <div className="bg-muted/30 rounded-[3rem] border-2 shadow-inner p-10 flex flex-col items-center justify-center text-center space-y-10 relative overflow-hidden h-[500px]">
                 <div className="absolute top-0 left-0 p-12 opacity-5 scale-150 -rotate-12">
                    <Calculator className="w-64 h-64" />
                 </div>
                 
                 <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center relative z-10">
                    <Zap className="w-10 h-10 text-primary" />
                 </div>
                 
                 <div className="max-w-xs relative z-10">
                    <h3 className="text-2xl font-black mb-4 uppercase tracking-tighter">Exam Advantage</h3>
                    <p className="text-sm font-bold text-muted-foreground leading-relaxed">
                       Designed for rapid calculation of competitive aptitude questions. Master markup, discounts, and dishonest dealer problems with mathematical precision.
                    </p>
                 </div>

                 <div className="flex gap-4 relative z-10">
                    <div className="px-6 py-2 rounded-full bg-card border-2 text-[10px] font-black uppercase tracking-widest shadow-sm">CAT READY</div>
                    <div className="px-6 py-2 rounded-full bg-card border-2 text-[10px] font-black uppercase tracking-widest shadow-sm">GATE APTI</div>
                 </div>
              </div>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
