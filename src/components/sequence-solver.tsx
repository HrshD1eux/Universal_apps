'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, Activity, ListOrdered, 
  ArrowRight, Info, Zap, LineChart as ChartIcon,
  Variable as VarIcon, Sigma
} from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip as ChartTooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';

export default function SequenceSolver() {
  const [firstTerm, setFirstTerm] = useState('2');
  const [diffRatio, setDiffRatio] = useState('3');
  const [numTerms, setNumTerms] = useState('10');
  const [targetVal, setTargetVal] = useState('20');
  const [type, setType] = useState<'arithmetic' | 'geometric'>('arithmetic');
  const [solveMode, setSolveMode] = useState<'forward' | 'inverse'>('forward');
  
  const { t } = useLanguage();

  const data = useMemo(() => {
    const a = parseFloat(firstTerm) || 0;
    const dr = parseFloat(diffRatio) || 0;
    const n = Math.min(parseInt(numTerms) || 0, 100);
    
    const sequence = [];
    let sum = 0;
    
    for (let i = 1; i <= n; i++) {
      let term;
      if (type === 'arithmetic') {
        term = a + (i - 1) * dr;
      } else {
        term = a * Math.pow(dr, i - 1);
      }
      sum += term;
      sequence.push({ n: i, term: parseFloat(term.toFixed(4)), cumulativeSum: parseFloat(sum.toFixed(4)) });
    }
    return sequence;
  }, [firstTerm, diffRatio, numTerms, type]);

  const stats = useMemo(() => {
    const a = parseFloat(firstTerm) || 0;
    const r = parseFloat(diffRatio) || 0;
    const target = parseFloat(targetVal) || 0;
    
    let sumToInfinity: string | number = 'N/A';
    if (type === 'geometric' && Math.abs(r) < 1) {
      sumToInfinity = (a / (1 - r)).toFixed(4);
    }

    let nForAn: string | number = 'N/A';
    let nForSn: string | number = 'N/A';

    if (solveMode === 'inverse') {
       if (type === 'arithmetic' && r !== 0) {
          nForAn = ((target - a) / r + 1).toFixed(2);
          // Sn = n/2 * (2a + (n-1)d) -> d/2 * n^2 + (a - d/2) * n - Sn = 0
          const A = r / 2;
          const B = a - r / 2;
          const C = -target;
          const discriminant = B * B - 4 * A * C;
          if (discriminant >= 0) {
             nForSn = ((-B + Math.sqrt(discriminant)) / (2 * A)).toFixed(2);
          }
       } else if (type === 'geometric' && r > 0 && r !== 1) {
          nForAn = (Math.log(target / a) / Math.log(r) + 1).toFixed(2);
          // Sn = a(r^n - 1) / (r - 1) -> r^n = Sn(r-1)/a + 1
          const rPowN = (target * (r - 1)) / a + 1;
          if (rPowN > 0) nForSn = (Math.log(rPowN) / Math.log(r)).toFixed(2);
       }
    }

    return {
      nthTerm: data.length > 0 ? data[data.length - 1].term : 0,
      totalSum: data.length > 0 ? data[data.length - 1].cumulativeSum : 0,
      sumToInfinity,
      nForAn,
      nForSn
    };
  }, [data, type, firstTerm, diffRatio, targetVal, solveMode]);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <Card className="border-none shadow-2xl bg-gradient-to-br from-background via-muted/50 to-background overflow-hidden font-sans">
        <CardHeader className="bg-primary/5 border-b border-primary/10 p-8">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex items-center gap-4">
                 <div className="p-4 bg-primary text-primary-foreground rounded-2xl shadow-lg shadow-primary/20">
                    <TrendingUp className="w-8 h-8" />
                 </div>
                 <div>
                    <CardTitle className="text-3xl font-black tracking-tight">{t('sequenceTitle')}</CardTitle>
                    <CardDescription className="text-base font-bold text-primary/60">{t('sequenceDesc')}</CardDescription>
                 </div>
              </div>
              
              <div className="flex p-1 bg-muted rounded-2xl border-2">
                 <button onClick={() => setSolveMode('forward')} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${solveMode === 'forward' ? 'bg-background shadow text-primary' : 'text-muted-foreground'}`}>CALCULATE</button>
                 <button onClick={() => setSolveMode('inverse')} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${solveMode === 'inverse' ? 'bg-background shadow text-primary' : 'text-muted-foreground'}`}>SOLVE FOR N</button>
              </div>
              
              <div className="flex p-1 bg-muted rounded-2xl border-2">
                 <button
                   onClick={() => setType('arithmetic')}
                   className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${type === 'arithmetic' ? 'bg-background shadow-lg text-primary scale-105' : 'text-muted-foreground hover:text-primary'}`}
                 >
                   ARITHMETIC
                 </button>
                 <button
                   onClick={() => setType('geometric')}
                   className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${type === 'geometric' ? 'bg-background shadow-lg text-primary scale-105' : 'text-muted-foreground hover:text-primary'}`}
                 >
                   GEOMETRIC
                 </button>
              </div>
           </div>
        </CardHeader>

        <CardContent className="p-8">
           <div className="grid grid-cols-1 lg:grid-cols-[1fr,2fr] gap-12">
              <div className="space-y-8">
                 <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1 text-primary">First Term (a)</label>
                           <Input type="number" value={firstTerm} onChange={(e) => setFirstTerm(e.target.value)} className="h-16 rounded-2xl border-2 text-2xl font-black focus:ring-primary" />
                       </div>
                       <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1 text-primary">
                              {type === 'arithmetic' ? 'Diff (d)' : 'Ratio (r)'}
                           </label>
                           <Input type="number" value={diffRatio} onChange={(e) => setDiffRatio(e.target.value)} className="h-16 rounded-2xl border-2 text-2xl font-black focus:ring-primary" />
                       </div>
                    </div>
                    {solveMode === 'forward' ? (
                       <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1 text-primary">Number of Terms (n)</label>
                           <Input type="number" value={numTerms} onChange={(e) => setNumTerms(e.target.value)} className="h-16 rounded-2xl border-2 text-2xl font-black focus:ring-primary" />
                       </div>
                    ) : (
                       <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1 text-primary">Target Value (an or Sn)</label>
                           <Input type="number" value={targetVal} onChange={(e) => setTargetVal(e.target.value)} className="h-16 rounded-2xl border-2 text-2xl font-black focus:ring-primary" />
                       </div>
                    )}
                 </div>

                  <div className="p-10 rounded-[3rem] bg-primary text-primary-foreground shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                       <Zap className="w-24 h-24" />
                    </div>
                    <div className="relative z-10 space-y-8">
                       {solveMode === 'forward' ? (
                          <>
                             <div>
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Sum of {numTerms} Terms (Sn)</p>
                                <p className="text-5xl font-black">{stats.totalSum.toLocaleString()}</p>
                             </div>
                             <div className="grid grid-cols-2 gap-4 pt-8 border-t border-white/10">
                                <div><p className="text-[10px] font-black uppercase tracking-widest opacity-60">nth Term (an)</p><p className="text-xl font-black">{stats.nthTerm.toLocaleString()}</p></div>
                                <div><p className="text-[10px] font-black uppercase tracking-widest opacity-60">Sum to ∞</p><p className="text-xl font-black">{stats.sumToInfinity}</p></div>
                             </div>
                          </>
                       ) : (
                          <>
                             <div>
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Target Position (n) if an = {targetVal}</p>
                                <p className="text-5xl font-black">{stats.nForAn}</p>
                             </div>
                             <div className="pt-8 border-t border-white/10">
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Target Position (n) if Sn = {targetVal}</p>
                                <p className="text-4xl font-black">{stats.nForSn}</p>
                             </div>
                          </>
                       )}
                    </div>
                 </div>
              </div>

              <div className="space-y-8">
                 <div className="bg-card rounded-[3rem] border-2 shadow-xl p-8 h-[400px] relative overflow-hidden">
                    <div className="absolute top-6 left-8 flex items-center gap-2 z-10">
                        <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                       <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Convergence Graph</span>
                    </div>
                    <ResponsiveContainer width="100%" height="100%">
                       <LineChart data={data}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.05} />
                          <XAxis dataKey="n" tick={{ fontSize: 10, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 10, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                          <ChartTooltip 
                            contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                          />
                          <ReferenceLine y={0} stroke="currentColor" opacity={0.1} />
                          <Line 
                            type="monotone" 
                            dataKey="term" 
                            stroke="var(--primary)" 
                            strokeWidth={4} 
                            dot={{ r: 4, fill: 'var(--primary)', strokeWidth: 0 }} 
                            activeDot={{ r: 6 }}
                            animationDuration={1500}
                          />
                       </LineChart>
                    </ResponsiveContainer>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-8 rounded-[2.5rem] bg-muted/30 border-2 border-dashed flex items-center gap-6">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                           <Activity className="w-8 h-8" />
                        </div>
                       <div className="space-y-1">
                           <p className="text-xs font-black uppercase text-primary tracking-wider">Trend</p>
                          <p className="text-xs text-muted-foreground font-bold">
                             {type === 'arithmetic' ? 'Linear' : 'Exponential'} {Math.abs(parseFloat(diffRatio)) > (type === 'geometric' ? 1 : 0) ? 'Divergent' : 'Convergent'}
                          </p>
                       </div>
                    </div>
                    <div className="p-8 rounded-[2.5rem] bg-muted/30 border-2 border-dashed flex items-center gap-6">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                           <Sigma className="w-8 h-8" />
                        </div>
                       <div className="space-y-1">
                           <p className="text-xs font-black uppercase text-primary tracking-wider">Formula</p>
                          <p className="text-[10px] font-bold text-muted-foreground leading-tight">
                             {type === 'arithmetic' ? 'an = a + (n-1)d' : 'an = a * r^(n-1)'}
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
