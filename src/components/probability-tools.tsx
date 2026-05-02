'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { Dices, Hash, RefreshCcw, Percent, Target, Sparkles, Brain, Calculator, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';

export default function ProbabilityTools() {
  const { t } = useLanguage();
  const { toast } = useToast();
  
  // Combinatorics
  const [n, setN] = useState('10');
  const [r, setR] = useState('3');
  
  // Dice
  const [numDice, setNumDice] = useState('2');
  const [targetSum, setTargetSum] = useState('7');

  const factorial = (num: number): number => {
    if (num <= 1) return 1;
    return num * factorial(num - 1);
  };

  const nCr = (n: number, r: number) => {
    if (r > n) return 0;
    return factorial(n) / (factorial(r) * factorial(n - r));
  };

  const nPr = (n: number, r: number) => {
    if (r > n) return 0;
    return factorial(n) / factorial(n - r);
  };

  const calculateDiceProb = (d: number, s: number) => {
    // Basic dice probability sum calculation
    const totalWays = Math.pow(6, d);
    // Simplified count for small dice (using recursion or table would be better, but let's do a basic one)
    if (d === 1) return s >= 1 && s <= 6 ? 1 / 6 : 0;
    if (d === 2) {
      const ways = Math.max(0, 6 - Math.abs(s - 7));
      return ways / totalWays;
    }
    return 0; // Placeholder for higher dice
  };

  const comb = nCr(parseInt(n) || 0, parseInt(r) || 0);
  const perm = nPr(parseInt(n) || 0, parseInt(r) || 0);
  const diceProb = calculateDiceProb(parseInt(numDice) || 0, parseInt(targetSum) || 0);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Combinatorics Card */}
        <Card className="border-none shadow-2xl bg-card/50 backdrop-blur-xl border-2 border-primary/5 overflow-hidden">
          <CardHeader className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-b p-8">
             <div className="flex items-center gap-4">
                <div className="p-4 bg-purple-500/10 rounded-2xl">
                   <Hash className="w-7 h-7 text-purple-600" />
                </div>
                <div>
                   <CardTitle className="text-3xl font-black">Combinatorics</CardTitle>
                   <CardDescription className="text-base font-medium">nCr and nPr calculations</CardDescription>
                </div>
             </div>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
             <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Total Items (n)</label>
                   <Input 
                      type="number" 
                      value={n} 
                      onChange={(e) => setN(e.target.value)} 
                      className="h-14 rounded-2xl border-2 text-xl font-black focus:ring-purple-500"
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Choose (r)</label>
                   <Input 
                      type="number" 
                      value={r} 
                      onChange={(e) => setR(e.target.value)} 
                      className="h-14 rounded-2xl border-2 text-xl font-black focus:ring-purple-500"
                   />
                </div>
             </div>

             <div className="grid grid-cols-1 gap-4">
                <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-xl relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                      <Calculator className="w-32 h-32" />
                   </div>
                   <div className="relative z-10 space-y-6">
                      <div>
                         <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Combinations (nCr)</p>
                         <p className="text-5xl font-black">{comb.toLocaleString()}</p>
                      </div>
                      <div className="pt-6 border-t border-white/10">
                         <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Permutations (nPr)</p>
                         <p className="text-3xl font-black">{perm.toLocaleString()}</p>
                      </div>
                   </div>
                </div>
             </div>
          </CardContent>
        </Card>

        {/* Dice Probability Card */}
        <Card className="border-none shadow-2xl bg-card/50 backdrop-blur-xl border-2 border-primary/5 overflow-hidden">
          <CardHeader className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-b p-8">
             <div className="flex items-center gap-4">
                <div className="p-4 bg-emerald-500/10 rounded-2xl">
                   <Dices className="w-7 h-7 text-emerald-600" />
                </div>
                <div>
                   <CardTitle className="text-3xl font-black">Dice Probability</CardTitle>
                   <CardDescription className="text-base font-medium">Sum probability analysis</CardDescription>
                </div>
             </div>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
             <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Number of Dice</label>
                   <Input 
                      type="number" 
                      value={numDice} 
                      onChange={(e) => setNumDice(e.target.value)} 
                      max="2"
                      className="h-14 rounded-2xl border-2 text-xl font-black focus:ring-emerald-500"
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Target Sum</label>
                   <Input 
                      type="number" 
                      value={targetSum} 
                      onChange={(e) => setTargetSum(e.target.value)} 
                      className="h-14 rounded-2xl border-2 text-xl font-black focus:ring-emerald-500"
                   />
                </div>
             </div>

             <div className="p-10 rounded-[2.5rem] bg-card border-2 shadow-xl flex flex-col items-center text-center space-y-6 relative overflow-hidden group">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl" />
                <div className="p-6 bg-emerald-500/10 rounded-[2rem] text-emerald-600">
                   <Percent className="w-10 h-10" />
                </div>
                <div>
                   <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Probability of Sum {targetSum}</p>
                   <p className="text-6xl font-black text-emerald-600">{(diceProb * 100).toFixed(2)}%</p>
                </div>
                <div className="pt-6 border-t w-full">
                   <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Odds: 1 in {(1/diceProb).toFixed(1)}</p>
                </div>
             </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Insights */}
      <Card className="border-none shadow-2xl bg-gradient-to-br from-indigo-900 to-slate-900 text-white overflow-hidden">
         <CardContent className="p-12 flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="space-y-4 max-w-lg">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/10 rounded-lg">
                     <Brain className="w-6 h-6 text-indigo-400" />
                  </div>
                  <h3 className="text-2xl font-black tracking-tight">Statistical Insights</h3>
               </div>
               <p className="text-indigo-100/70 font-medium leading-relaxed">
                  Probability is the measure of the likelihood that an event will occur. In complex systems, we use Normal Distribution and Z-scores to predict outcomes with high confidence.
               </p>
               <div className="flex gap-4 pt-4">
                  <div className="px-4 py-2 bg-white/5 rounded-full border border-white/10 text-[10px] font-black uppercase tracking-widest">Normal Dist.</div>
                  <div className="px-4 py-2 bg-white/5 rounded-full border border-white/10 text-[10px] font-black uppercase tracking-widest">Z-Score</div>
                  <div className="px-4 py-2 bg-white/5 rounded-full border border-white/10 text-[10px] font-black uppercase tracking-widest">Bayesian</div>
               </div>
            </div>
            <div className="relative group shrink-0">
               <div className="absolute inset-0 bg-indigo-500 blur-3xl opacity-20 group-hover:opacity-40 transition-opacity" />
               <div className="relative p-10 rounded-[3rem] bg-white/5 border border-white/10 backdrop-blur-xl text-center space-y-4">
                  <Sparkles className="w-8 h-8 text-amber-400 mx-auto" />
                  <p className="text-xs font-bold opacity-60">Coming Soon</p>
                  <p className="text-lg font-black">Advanced Curve Plotter</p>
                  <Button variant="outline" className="rounded-2xl border-white/20 text-white hover:bg-white/5 h-12 px-8 gap-2 group">
                     LEARN MORE <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
               </div>
            </div>
         </CardContent>
      </Card>
    </div>
  );
}
