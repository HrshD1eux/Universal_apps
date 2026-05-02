'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Percent, Scale, TrendingUp, TrendingDown, 
  Coins, Zap, Sparkles, Calculator, 
  ArrowRightLeft, Activity
} from 'lucide-react';
import { useLanguage } from '@/context/language-context';

export default function PercentageMaster() {
  const [activeTab, setActiveTab] = useState<'percent' | 'ratio' | 'margin' | 'interest'>('percent');
  const [val1, setVal1] = useState('1000');
  const [val2, setVal2] = useState('20');
  const [val3, setVal3] = useState('1'); 
  
  const { t } = useLanguage();

  const results = useMemo(() => {
    const v1 = parseFloat(val1) || 0;
    const v2 = parseFloat(val2) || 0;
    const v3 = parseFloat(val3) || 1;

    if (activeTab === 'percent') {
      const increase = v1 * (1 + v2 / 100);
      const decrease = v1 * (1 - v2 / 100);
      const percentageOf = (v2 / 100) * v1;
      return { increase, decrease, percentageOf };
    } else if (activeTab === 'ratio') {
      const totalParts = v2 + v3;
      const part1 = (v2 / totalParts) * v1;
      const part2 = (v3 / totalParts) * v1;
      return { part1, part2, totalParts };
    } else if (activeTab === 'margin') {
      const price = v1 / (1 - v2 / 100);
      const markup = (price / v1 - 1) * 100;
      const profit = price - v1;
      return { price, markup, profit };
    } else {
      const r = v2 / 100;
      const amount = v1 * Math.pow(1 + r, v3);
      return { amount, interest: amount - v1 };
    }
  }, [activeTab, val1, val2, val3]);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <Card className="border-none shadow-2xl bg-gradient-to-br from-background via-muted/50 to-background overflow-hidden font-sans">
        <CardHeader className="bg-primary/5 border-b border-primary/10 p-8">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex items-center gap-4">
                 <div className="p-4 bg-primary text-primary-foreground rounded-2xl shadow-lg shadow-primary/20">
                    <Percent className="w-8 h-8" />
                 </div>
                 <div>
                    <CardTitle className="text-3xl font-black tracking-tight">{t('percentMasterTitle')}</CardTitle>
                    <CardDescription className="text-base font-bold text-primary/60">{t('percentMasterDesc')}</CardDescription>
                 </div>
              </div>
              
              <div className="flex p-1 bg-muted rounded-2xl border-2">
                 {[
                   { id: 'percent', icon: TrendingUp, label: 'Percentage' },
                   { id: 'ratio', icon: Scale, label: 'Ratios' },
                   { id: 'margin', icon: Coins, label: 'Margin' },
                   { id: 'interest', icon: Calculator, label: 'Interest' }
                 ].map(tab => (
                   <button
                     key={tab.id}
                     onClick={() => setActiveTab(tab.id as any)}
                     className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === tab.id ? 'bg-background shadow-lg text-primary scale-105' : 'text-muted-foreground hover:text-primary'}`}
                   >
                     <tab.icon className="w-4 h-4" />
                     {tab.label.toUpperCase()}
                   </button>
                 ))}
              </div>
           </div>
        </CardHeader>

        <CardContent className="p-8">
           <div className="grid grid-cols-1 lg:grid-cols-[1fr,1.5fr] gap-12">
              <div className="space-y-8">
                 <div className="space-y-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1 text-primary">
                          {activeTab === 'ratio' ? 'Total Amount' : 'Initial Amount'}
                       </label>
                       <Input type="number" value={val1} onChange={(e) => setVal1(e.target.value)} className="h-16 rounded-2xl border-2 text-2xl font-black focus:ring-primary" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1 text-primary">
                             {activeTab === 'percent' ? 'Percentage' : activeTab === 'ratio' ? 'Ratio Part A' : activeTab === 'margin' ? 'Margin %' : 'Rate (%)'}
                          </label>
                          <Input type="number" value={val2} onChange={(e) => setVal2(e.target.value)} className="h-16 rounded-2xl border-2 text-2xl font-black focus:ring-primary" />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1 text-primary">
                             {activeTab === 'percent' ? 'N/A' : activeTab === 'ratio' ? 'Ratio Part B' : activeTab === 'margin' ? 'N/A' : 'Years'}
                          </label>
                          <Input type="number" disabled={activeTab === 'percent' || activeTab === 'margin'} value={val3} onChange={(e) => setVal3(e.target.value)} className="h-16 rounded-2xl border-2 text-2xl font-black focus:ring-primary disabled:opacity-30" />
                       </div>
                    </div>
                 </div>

                 <div className="p-10 rounded-[3rem] bg-primary text-primary-foreground shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                       <Zap className="w-24 h-24" />
                    </div>
                    <div className="relative z-10 space-y-8">
                       <AnimatePresence mode="wait">
                          {activeTab === 'percent' && (
                             <motion.div key="percent" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                                <div>
                                   <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Increased by {val2}%</p>
                                   <p className="text-5xl font-black">{results.increase?.toLocaleString()}</p>
                                </div>
                                <div className="pt-6 border-t border-white/10">
                                   <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Decreased by {val2}%</p>
                                   <p className="text-3xl font-black">{results.decrease?.toLocaleString()}</p>
                                </div>
                             </motion.div>
                          )}
                          {activeTab === 'ratio' && (
                             <motion.div key="ratio" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                                <div>
                                   <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Part A ({val2})</p>
                                   <p className="text-4xl font-black">{results.part1?.toLocaleString()}</p>
                                </div>
                                <div className="pt-6 border-t border-white/10">
                                   <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Part B ({val3})</p>
                                   <p className="text-4xl font-black">{results.part2?.toLocaleString()}</p>
                                </div>
                             </motion.div>
                          )}
                          {activeTab === 'margin' && (
                             <motion.div key="margin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                                <div>
                                   <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Selling Price</p>
                                   <p className="text-5xl font-black">{results.price?.toLocaleString()}</p>
                                </div>
                                <div className="pt-6 border-t border-white/10">
                                   <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Profit Amount</p>
                                   <p className="text-3xl font-black">{results.profit?.toLocaleString()}</p>
                                </div>
                             </motion.div>
                          )}
                          {activeTab === 'interest' && (
                             <motion.div key="interest" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                                <div>
                                   <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Future Value</p>
                                   <p className="text-5xl font-black">{results.amount?.toLocaleString()}</p>
                                </div>
                                <div className="pt-6 border-t border-white/10">
                                   <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Total Interest</p>
                                   <p className="text-3xl font-black">{results.interest?.toLocaleString()}</p>
                                 </div>
                              </motion.div>
                           )}
                        </AnimatePresence>
                     </div>
                  </div>
               </div>

               <div className="bg-muted/30 rounded-[3rem] border-2 shadow-inner p-10 flex flex-col items-center justify-center relative overflow-hidden">
                  <div className="absolute top-8 left-8 flex items-center gap-2">
                     <Activity className="w-4 h-4 text-primary animate-pulse" />
                     <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Proportion Analysis</span>
                  </div>
                  
                  <div className="w-full space-y-12">
                     <div className="flex flex-col items-center gap-6">
                        <h3 className="text-xs font-black uppercase tracking-widest text-primary">Visual Scale</h3>
                        <div className="w-full h-12 bg-muted rounded-2xl overflow-hidden flex shadow-inner border-2">
                           {activeTab === 'ratio' ? (
                             <>
                                <motion.div 
                                 initial={{ width: 0 }}
                                 animate={{ width: `${(parseFloat(val2) / (parseFloat(val2) + parseFloat(val3))) * 100}%` }}
                                 className="bg-primary h-full flex items-center justify-center text-[10px] font-black text-primary-foreground"
                                >
                                   {(parseFloat(val2) / (parseFloat(val2) + parseFloat(val3)) * 100).toFixed(0)}%
                                </motion.div>
                                <div className="bg-primary/20 flex-grow h-full flex items-center justify-center text-[10px] font-black text-primary">
                                   {(parseFloat(val3) / (parseFloat(val2) + parseFloat(val3)) * 100).toFixed(0)}%
                                </div>
                             </>
                           ) : (
                             <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(parseFloat(val2), 100)}%` }}
                              className="bg-primary h-full flex items-center justify-center text-[10px] font-black text-primary-foreground"
                             >
                                {val2}%
                             </motion.div>
                           )}
                        </div>
                     </div>

                     <div className="grid grid-cols-1 gap-6">
                        <div className="p-8 rounded-[2.5rem] bg-card border-2 shadow-xl space-y-4">
                           <div className="flex items-center gap-3">
                              <Sparkles className="w-5 h-5 text-primary" />
                              <p className="text-xs font-black uppercase tracking-widest">Statistical Insight</p>
                           </div>
                           <p className="text-sm font-bold text-muted-foreground leading-relaxed">
                              {activeTab === 'percent' 
                                ? `A ${val2}% increase is mathematically equivalent to multiplying the value by ${1 + (parseFloat(val2) / 100)}.` 
                                : activeTab === 'ratio'
                                ? `The ratio ${val2}:${val3} implies that for every ${val2} units of A, there are ${val3} units of B.`
                                : activeTab === 'margin'
                                ? `A ${val2}% margin on a cost of $${val1} yields a selling price of $${results.price?.toFixed(2)}.`
                                : `With ${val2}% interest over ${val3} years, your investment grows significantly.`}
                           </p>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
