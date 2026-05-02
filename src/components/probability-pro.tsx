'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Dices, Hash, RefreshCcw, Percent, 
  Target, Sparkles, Brain, Calculator, 
  ArrowRight, Layers, BarChart3, Binary, Info
} from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { 
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip as ChartTooltip, ResponsiveContainer, Cell 
} from 'recharts';

export default function ProbabilityPro() {
  const [n, setN] = useState('10');
  const [r, setR] = useState('3');
  const [p, setP] = useState('0.5'); 
  const [mu, setMu] = useState('0');
  const [sigma, setSigma] = useState('1');
  const [activeTab, setActiveTab] = useState<'comb' | 'binomial' | 'normal' | 'dice'>('comb');
  
  const { t } = useLanguage();



  const nCr = (n: number, r: number) => {
    if (r < 0 || r > n) return 0;
    if (r === 0 || r === n) return 1;
    if (r > n / 2) r = n - r;
    
    let res = 1;
    for (let i = 1; i <= r; i++) {
      res = res * (n - i + 1) / i;
    }
    return Math.round(res);
  };

  const nPr = (n: number, r: number) => {
    if (r < 0 || r > n) return 0;
    let res = 1;
    for (let i = 0; i < r; i++) {
      res *= (n - i);
    }
    return res;
  };

  const binomialData = useMemo(() => {
    const numN = parseInt(n) || 0;
    const probP = parseFloat(p) || 0;
    if (numN > 50) return [];
    const data = [];
    for (let k = 0; k <= numN; k++) {
      const prob = nCr(numN, k) * Math.pow(probP, k) * Math.pow(1 - probP, numN - k);
      data.push({ k, prob: parseFloat(prob.toFixed(4)) });
    }
    return data;
  }, [n, p]);

  const normalData = useMemo(() => {
    const mean = parseFloat(mu) || 0;
    const stdDev = parseFloat(sigma) || 1;
    const data = [];
    for (let x = mean - 4 * stdDev; x <= mean + 4 * stdDev; x += stdDev / 5) {
      const prob = (1 / (stdDev * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((x - mean) / stdDev, 2));
      data.push({ x: parseFloat(x.toFixed(2)), density: parseFloat(prob.toFixed(4)) });
    }
    return data;
  }, [mu, sigma]);

  const diceData = useMemo(() => {
    const numDice = Math.min(Math.max(parseInt(n) || 1, 1), 5);
    const outcomes: Record<number, number> = { 0: 1 };
    for (let i = 0; i < numDice; i++) {
       const newOutcomes: Record<number, number> = {};
       for (const sum in outcomes) {
          for (let face = 1; face <= 6; face++) {
             const newSum = parseInt(sum) + face;
             newOutcomes[newSum] = (newOutcomes[newSum] || 0) + outcomes[sum];
          }
       }
       Object.assign(outcomes, newOutcomes);
       for (const key in outcomes) if (parseInt(key) <= i) delete outcomes[key];
    }
    const total = Math.pow(6, numDice);
    return Object.entries(outcomes).map(([sum, count]) => ({
       sum: parseInt(sum),
       prob: parseFloat((count / total).toFixed(4))
    })).sort((a, b) => a.sum - b.sum);
  }, [n]);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <Card className="border-none shadow-2xl bg-gradient-to-br from-background via-muted/50 to-background overflow-hidden font-sans">
        <CardHeader className="bg-primary/5 border-b border-primary/10 p-8">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex items-center gap-4">
                 <div className="p-4 bg-primary text-primary-foreground rounded-2xl shadow-lg shadow-primary/20">
                    <Brain className="w-8 h-8" />
                 </div>
                 <div>
                    <CardTitle className="text-3xl font-black tracking-tight">{t('probProTitle')}</CardTitle>
                    <CardDescription className="text-base font-bold text-primary/60">{t('probProDesc')}</CardDescription>
                 </div>
              </div>
              
              <div className="flex p-1 bg-muted rounded-2xl border-2 max-w-full overflow-x-auto">
                 {[
                   { id: 'comb', icon: Hash, label: 'Combinatorics' },
                   { id: 'binomial', icon: BarChart3, label: 'Binomial' },
                   { id: 'normal', icon: Activity, label: 'Normal' },
                   { id: 'dice', icon: Dices, label: 'Dice Engine' }
                 ].map(tab => (
                   <button
                     key={tab.id}
                     onClick={() => setActiveTab(tab.id as any)}
                     className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-background shadow-lg text-primary scale-105' : 'text-muted-foreground hover:text-primary'}`}
                   >
                     <tab.icon className="w-4 h-4" />
                     {tab.label.toUpperCase()}
                   </button>
                 ))}
              </div>
           </div>
        </CardHeader>

        <CardContent className="p-8">
          <AnimatePresence mode="wait">
            {activeTab === 'comb' && (
              <motion.div 
                key="comb"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-1 lg:grid-cols-[1fr,1.5fr] gap-12"
              >
                <div className="space-y-8">
                   <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1 text-primary">Total Items (n)</label>
                         <Input type="number" value={n} onChange={(e) => setN(e.target.value)} className="h-16 rounded-2xl border-2 text-2xl font-black focus:ring-primary" />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1 text-primary">Choose (r)</label>
                         <Input type="number" value={r} onChange={(e) => setR(e.target.value)} className="h-16 rounded-2xl border-2 text-2xl font-black focus:ring-primary" />
                      </div>
                   </div>

                   <div className="space-y-6">
                       <div className="p-10 rounded-[3rem] bg-primary text-primary-foreground shadow-2xl relative overflow-hidden group">
                         <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                            <Calculator className="w-24 h-24" />
                         </div>
                         <div className="relative z-10 space-y-8">
                            <div>
                               <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">{t('combinations')}</p>
                               <p className="text-6xl font-black">{isNaN(parseInt(n)) || isNaN(parseInt(r)) ? '0' : nCr(parseInt(n) || 0, parseInt(r) || 0).toLocaleString()}</p>
                            </div>
                            <div className="pt-8 border-t border-white/10">
                               <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">{t('permutations')}</p>
                               <p className="text-4xl font-black">{isNaN(parseInt(n)) || isNaN(parseInt(r)) ? '0' : nPr(parseInt(n) || 0, parseInt(r) || 0).toLocaleString()}</p>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="bg-card rounded-[3rem] border-2 shadow-xl p-10 flex flex-col items-center">
                   <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-12 text-primary">Visualizing Selection (Slots)</h3>
                   <div className="flex flex-wrap justify-center gap-4">
                      {Array.from({ length: Math.min(parseInt(n) || 0, 30) }).map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: i * 0.02 }}
                           className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center text-xs font-black ${i < (parseInt(r) || 0) ? 'bg-primary border-primary text-primary-foreground shadow-lg' : 'bg-muted/50 border-muted text-muted-foreground/30'}`}
                        >
                          {i + 1}
                        </motion.div>
                      ))}
                      {(parseInt(n) || 0) > 30 && <span className="text-xs font-black opacity-40 self-center">... + {(parseInt(n) || 0) - 30} more</span>}
                   </div>
                   <div className="mt-12 p-8 rounded-3xl bg-muted/30 border-2 border-dashed w-full space-y-2">
                      <p className="text-xs font-black uppercase tracking-wider opacity-60">Mathematical Logic</p>
                      <p className="text-sm font-bold leading-relaxed">
                          nCr (Combinations) uses the formula: <span className="text-primary">n! / (r! * (n-r)!)</span> where order does NOT matter.
                      </p>
                      <p className="text-sm font-bold leading-relaxed">
                          nPr (Permutations) uses the formula: <span className="text-primary">n! / (n-r)!</span> where order DOES matter.
                      </p>
                   </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'binomial' && (
              <motion.div 
                key="binomial"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-10"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-4">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Number of Trials (n)</label>
                          <Input type="number" value={n} onChange={(e) => setN(e.target.value)} max="50" className="h-16 rounded-2xl border-2 text-2xl font-black focus:ring-primary" />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Success Probability (p)</label>
                          <Input type="number" step="0.1" min="0" max="1" value={p} onChange={(e) => setP(e.target.value)} className="h-16 rounded-2xl border-2 text-2xl font-black focus:ring-primary" />
                      </div>
                   </div>

                    <div className="p-8 rounded-[2.5rem] bg-primary text-primary-foreground flex flex-col justify-center space-y-4 shadow-xl">
                      <div className="flex items-center gap-3">
                         <BarChart3 className="w-6 h-6 opacity-60" />
                         <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Distribution Summary</span>
                      </div>
                      <div className="grid grid-cols-2 gap-8">
                         <div>
                            <p className="text-xs font-bold opacity-60">Expected Value (μ)</p>
                            <p className="text-4xl font-black">{((parseFloat(n) || 0) * (parseFloat(p) || 0)).toFixed(2)}</p>
                         </div>
                         <div>
                            <p className="text-xs font-bold opacity-60">Variance (σ²)</p>
                            <p className="text-4xl font-black">{((parseFloat(n) || 0) * (parseFloat(p) || 0) * (1 - (parseFloat(p) || 0))).toFixed(2)}</p>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="bg-card rounded-[3rem] border-2 shadow-xl p-10 h-[400px]">
                   <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={binomialData}>
                         <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                         <XAxis dataKey="k" tick={{ fontSize: 10, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                         <YAxis tick={{ fontSize: 10, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                         <ChartTooltip 
                           cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }}
                           contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                         />
                         <Bar dataKey="prob" radius={[6, 6, 0, 0]}>
                            {binomialData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={index === Math.round(parseFloat(n) * parseFloat(p)) ? 'var(--primary)' : 'var(--primary-muted)'} />
                            ))}
                         </Bar>
                      </BarChart>
                   </ResponsiveContainer>
                </div>
              </motion.div>
            )}

            {activeTab === 'normal' && (
              <motion.div key="normal" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-10">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black opacity-60">Mean (μ)</label>
                          <Input type="number" value={mu} onChange={(e) => setMu(e.target.value)} className="h-16 rounded-2xl border-2 font-black focus:ring-primary" />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black opacity-60">Std Dev (σ)</label>
                          <Input type="number" value={sigma} onChange={(e) => setSigma(e.target.value)} className="h-16 rounded-2xl border-2 font-black focus:ring-primary" />
                       </div>
                    </div>
                    <div className="p-8 rounded-[2.5rem] bg-primary/10 border-2 border-primary/20 flex flex-col justify-center">
                       <div className="flex items-center gap-2 mb-2"><Info className="w-4 h-4 text-primary" /><span className="text-[10px] font-black uppercase text-primary">Z-Score Insight</span></div>
                       <p className="text-sm font-bold text-primary/80">95% of values fall within {parseFloat(mu) - 2 * parseFloat(sigma)} and {parseFloat(mu) + 2 * parseFloat(sigma)}.</p>
                    </div>
                 </div>
                 <div className="bg-card rounded-[3rem] border-2 shadow-xl p-10 h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                       <AreaChart data={normalData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                          <XAxis dataKey="x" tick={{ fontSize: 10, fontWeight: 'bold' }} />
                          <YAxis hide />
                          <ChartTooltip />
                          <Area type="monotone" dataKey="density" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.1} strokeWidth={4} />
                       </AreaChart>
                    </ResponsiveContainer>
                 </div>
              </motion.div>
            )}

            {activeTab === 'dice' && (
              <motion.div key="dice" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-10">
                 <div className="max-w-md mx-auto space-y-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black opacity-60 uppercase text-center block">Number of 6-Sided Dice</label>
                       <Input type="number" min="1" max="5" value={n} onChange={(e) => setN(e.target.value)} className="h-20 rounded-[2rem] border-4 text-4xl font-black text-center focus:ring-primary" />
                    </div>
                 </div>
                 <div className="bg-card rounded-[3rem] border-2 shadow-xl p-10 h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                       <BarChart data={diceData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                          <XAxis dataKey="sum" />
                          <YAxis />
                          <ChartTooltip />
                          <Bar dataKey="prob" fill="var(--primary)" radius={[6, 6, 0, 0]} />
                       </BarChart>
                    </ResponsiveContainer>
                 </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}
