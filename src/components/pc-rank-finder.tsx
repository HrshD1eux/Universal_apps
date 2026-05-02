'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Zap, Info, RotateCcw, ListOrdered, 
  Layers, Calculator, Hash, ArrowRight, Dices
} from 'lucide-react';
import { useLanguage } from '@/context/language-context';

export default function PCRankFinder() {
  const [activeTab, setActiveTab] = useState<'pc' | 'rank'>('pc');
  const [n, setN] = useState('5');
  const [r, setR] = useState('2');
  const [word, setWord] = useState('HARSH');
  
  const { t } = useLanguage();

  const factorial = (num: number): number => {
    if (num < 0) return 0;
    if (num === 0 || num === 1) return 1;
    let res = 1;
    for (let i = 2; i <= num; i++) res *= i;
    return res;
  };

  const results = useMemo(() => {
    const nv = parseInt(n) || 0;
    const rv = parseInt(r) || 0;
    
    // nPr
    const npr = rv <= nv ? factorial(nv) / factorial(nv - rv) : 0;
    // nCr
    const ncr = rv <= nv ? factorial(nv) / (factorial(rv) * factorial(nv - rv)) : 0;

    // Word Rank (Standard algorithm for non-repeating characters)
    let rank = 1;
    const w = word.toUpperCase();
    const len = w.length;
    
    for (let i = 0; i < len; i++) {
      let count = 0;
      for (let j = i + 1; j < len; j++) {
        if (w[j] < w[i]) count++;
      }
      rank += count * factorial(len - 1 - i);
    }

    return { npr, ncr, rank };
  }, [n, r, word]);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <Card className="border-none shadow-2xl bg-gradient-to-br from-background via-muted/50 to-background overflow-hidden font-sans">
        <CardHeader className="bg-primary/5 border-b border-primary/10 p-8">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex items-center gap-4">
                 <div className="p-4 bg-primary text-white rounded-2xl shadow-lg shadow-primary/20">
                    <ListOrdered className="w-8 h-8" />
                 </div>
                 <div>
                    <CardTitle className="text-3xl font-black tracking-tight uppercase">{t('pcRankTitle' as any)}</CardTitle>
                    <CardDescription className="text-base font-bold text-primary/60">{t('pcRankDesc' as any)}</CardDescription>
                 </div>
              </div>
              
              <div className="flex p-1 bg-muted rounded-2xl border-2">
                 <button onClick={() => setActiveTab('pc')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black transition-all ${activeTab === 'pc' ? 'bg-background shadow-lg text-primary scale-105' : 'text-muted-foreground hover:text-primary'}`}>P & C SOLVER</button>
                 <button onClick={() => setActiveTab('rank')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black transition-all ${activeTab === 'rank' ? 'bg-background shadow-lg text-primary scale-105' : 'text-muted-foreground hover:text-primary'}`}>WORD RANK</button>
              </div>
           </div>
        </CardHeader>

        <CardContent className="p-8">
           <div className="grid grid-cols-1 lg:grid-cols-[1fr,1.3fr] gap-12">
              <AnimatePresence mode="wait">
                 {activeTab === 'pc' && (
                    <motion.div key="pc" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-8">
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Total Items (n)</label>
                             <Input type="number" value={n} onChange={(e) => setN(e.target.value)} className="h-20 rounded-[2rem] border-2 font-black text-4xl text-center" />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Selection (r)</label>
                             <Input type="number" value={r} onChange={(e) => setR(e.target.value)} className="h-20 rounded-[2rem] border-2 font-black text-4xl text-center" />
                          </div>
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-10 rounded-[3rem] bg-indigo-600 text-white shadow-2xl relative overflow-hidden group">
                             <Zap className="absolute top-0 right-0 p-8 w-40 h-40 opacity-10 group-hover:scale-110 transition-transform" />
                             <div className="relative z-10">
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Permutations (nPr)</p>
                                <p className="text-5xl font-black">{results.npr.toLocaleString()}</p>
                                <p className="text-[9px] font-bold uppercase opacity-60 mt-4 tracking-widest">Order Matters</p>
                             </div>
                          </div>
                          <div className="p-10 rounded-[3rem] bg-rose-600 text-white shadow-2xl relative overflow-hidden group">
                             <Dices className="absolute top-0 right-0 p-8 w-40 h-40 opacity-10 group-hover:scale-110 transition-transform" />
                             <div className="relative z-10">
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Combinations (nCr)</p>
                                <p className="text-5xl font-black">{results.ncr.toLocaleString()}</p>
                                <p className="text-[9px] font-bold uppercase opacity-60 mt-4 tracking-widest">Order Doesn't Matter</p>
                             </div>
                          </div>
                       </div>
                    </motion.div>
                 )}

                 {activeTab === 'rank' && (
                    <motion.div key="rank" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-8">
                       <div className="space-y-4">
                          <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Input Word (Unique Letters)</label>
                          <Input 
                            value={word} 
                            onChange={(e) => setWord(e.target.value.toUpperCase())} 
                            placeholder="HARSH"
                            className="h-24 rounded-[2.5rem] border-2 font-black text-5xl uppercase tracking-widest text-center focus:ring-primary"
                          />
                       </div>

                       <div className="p-12 rounded-[3.5rem] bg-card border-2 shadow-2xl relative overflow-hidden group">
                          <Sparkles className="absolute top-0 right-0 p-12 w-48 h-48 opacity-[0.03] group-hover:rotate-12 transition-transform duration-700" />
                          <div className="relative z-10 text-center space-y-4">
                             <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Alphabetical Rank</p>
                             <p className="text-8xl font-black text-primary tracking-tighter italic">#{results.rank.toLocaleString()}</p>
                             <div className="pt-8 border-t border-dashed border-primary/20">
                                <p className="text-xs font-bold text-muted-foreground uppercase leading-relaxed max-w-xs mx-auto">
                                   If all permutations of "{word}" were listed in alphabetical order, this is its position.
                                </p>
                             </div>
                          </div>
                       </div>
                    </motion.div>
                 )}
              </AnimatePresence>

              <div className="bg-muted/30 rounded-[3rem] border-2 shadow-inner p-10 flex flex-col items-center justify-center text-center space-y-12 h-[500px] relative overflow-hidden">
                 <div className="absolute inset-0 p-20 opacity-[0.03] -z-10 rotate-12 scale-150">
                    <Hash className="w-full h-full" />
                 </div>
                 <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                    <Calculator className="w-12 h-12 text-primary" />
                 </div>
                 <div className="max-w-sm">
                    <h3 className="text-2xl font-black mb-4 uppercase tracking-tighter">Combinatorial Logic</h3>
                    <p className="text-sm font-bold text-muted-foreground leading-relaxed uppercase tracking-tighter italic">
                       Professional engine for calculating arrangements and selections. Essential for probability modules and dictionary-rank problems in high-stakes math exams.
                    </p>
                 </div>
                 <div className="flex gap-4">
                    <div className="px-6 py-2 rounded-full bg-card border-2 text-[10px] font-black uppercase tracking-widest shadow-sm">B.TECH LEVEL</div>
                    <div className="px-6 py-2 rounded-full bg-card border-2 text-[10px] font-black uppercase tracking-widest shadow-sm">DIPLOMA MATH</div>
                 </div>
              </div>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
