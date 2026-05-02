'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Binary, Hash, Zap, BookOpen, 
  ChevronRight, Sparkles, Brain, 
  Layers, ListOrdered, Share2
} from 'lucide-react';
import { useLanguage } from '@/context/language-context';

export default function NumberTheoryLab() {
  const [number, setNumber] = useState('48');
  const [numA, setNumA] = useState('24');
  const [numB, setNumB] = useState('36');
  const [mod, setMod] = useState('7');
  const [exponent, setExponent] = useState('10');
  const [activeTab, setActiveTab] = useState<'factor' | 'gcd' | 'prime' | 'advanced'>('factor');
  
  const { t } = useLanguage();

  // Prime Factorization logic
  const primeFactors = useMemo(() => {
    let n = parseInt(number);
    if (isNaN(n) || n < 2) return [];
    const factors: number[] = [];
    let d = 2;
    while (n >= d * d) {
      if (n % d === 0) {
        factors.push(d);
        n /= d;
      } else {
        d++;
      }
    }
    factors.push(n);
    return factors;
  }, [number]);

  // Factor Tree Nodes
  const factorTree = useMemo(() => {
    let n = parseInt(number);
    if (isNaN(n) || n < 2) return null;
    
    interface TreeNode {
      value: number;
      left?: TreeNode;
      right?: TreeNode;
      isPrime: boolean;
    }

    const isPrime = (num: number) => {
      if (num < 2) return false;
      for (let i = 2; i * i <= num; i++) {
        if (num % i === 0) return false;
      }
      return true;
    };

    const buildTree = (num: number): TreeNode => {
      if (isPrime(num)) return { value: num, isPrime: true };
      for (let i = 2; i * i <= num; i++) {
        if (num % i === 0) {
          return {
            value: num,
            isPrime: false,
            left: { value: i, isPrime: true },
            right: buildTree(num / i)
          };
        }
      }
      return { value: num, isPrime: true };
    };

    return buildTree(n);
  }, [number]);

  // GCD/LCM with Euclidean Algorithm steps
  const euclideanSteps = useMemo(() => {
    let a = Math.abs(parseInt(numA));
    let b = Math.abs(parseInt(numB));
    if (isNaN(a) || isNaN(b)) return [];
    
    const steps = [];
    let r = 1;
    while (b !== 0) {
      r = a % b;
      steps.push({ a, b, q: Math.floor(a / b), r });
      a = b;
      b = r;
    }
    return steps;
  }, [numA, numB]);

  const gcd = euclideanSteps.length > 0 ? euclideanSteps[euclideanSteps.length - 1].b : 0;
  const lcm = (parseInt(numA) * parseInt(numB)) / (gcd || 1);

  // Primality Test result
  const primality = useMemo(() => {
    const n = parseInt(number);
    if (isNaN(n)) return null;
    if (n < 2) return { isPrime: false, reason: 'Numbers less than 2 are not prime.' };
    for (let i = 2; i * i <= n; i++) {
      if (n % i === 0) return { isPrime: false, divisor: i };
    }
    return { isPrime: true };
  }, [number]);

  const phi = useMemo(() => {
    let n = parseInt(number);
    if (isNaN(n) || n < 1) return 0;
    let result = n;
    for (let i = 2; i * i <= n; i++) {
       if (n % i === 0) {
          while (n % i === 0) n /= i;
          result -= result / i;
       }
    }
    if (n > 1) result -= result / n;
    return result;
  }, [number]);

  const modPowResult = useMemo(() => {
    let base = parseInt(numA);
    let exp = parseInt(exponent);
    let m = parseInt(mod);
    if (isNaN(base) || isNaN(exp) || isNaN(m) || m === 0) return 0;
    
    let res = BigInt(1);
    let b = BigInt(base) % BigInt(m);
    let e = BigInt(exp);
    const modVal = BigInt(m);
    
    while (e > 0n) {
       if (e % 2n === 1n) res = (res * b) % modVal;
       b = (b * b) % modVal;
       e = e / 2n;
    }
    return res.toString();
  }, [numA, exponent, mod]);

  const sievePrimes = useMemo(() => {
     const limit = Math.min(parseInt(number) || 0, 1000);
     const sieve = new Array(limit + 1).fill(true);
     sieve[0] = sieve[1] = false;
     for (let p = 2; p * p <= limit; p++) {
        if (sieve[p]) {
           for (let i = p * p; i <= limit; i += p) sieve[i] = false;
        }
     }
     const primes = [];
     for (let i = 2; i <= limit; i++) if (sieve[i]) primes.push(i);
     return primes;
  }, [number]);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <Card className="border-none shadow-2xl bg-gradient-to-br from-background via-muted/30 to-background overflow-hidden font-sans">
        <CardHeader className="bg-primary/5 border-b border-primary/10 p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-4">
               <div className="p-4 bg-primary text-primary-foreground rounded-2xl shadow-lg shadow-primary/20">
                  <Binary className="w-8 h-8" />
               </div>
               <div>
                  <CardTitle className="text-3xl font-black tracking-tight">{t('numberTheoryTitle')}</CardTitle>
                  <CardDescription className="text-base font-bold text-primary/60">{t('numberTheoryDesc')}</CardDescription>
               </div>
            </div>
            
            <div className="flex p-1 bg-muted rounded-2xl border-2">
               {[
                { id: 'factor', icon: Layers, label: 'Factorization' },
                { id: 'gcd', icon: ListOrdered, label: 'GCD & LCM' },
                { id: 'prime', icon: Zap, label: 'Sieve & Primes' },
                { id: 'advanced', icon: Sparkles, label: 'Modular Lab' }
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
          <AnimatePresence mode="wait">
            {activeTab === 'factor' && (
              <motion.div 
                key="factor"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-1 lg:grid-cols-[1fr,2fr] gap-12"
              >
                <div className="space-y-8">
                   <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Input Number</label>
                      <Input 
                        type="number" 
                        value={number} 
                        onChange={(e) => setNumber(e.target.value)}
                        className="h-16 rounded-2xl border-2 text-2xl font-black focus:ring-primary shadow-inner"
                      />
                   </div>

                   <div className="p-8 rounded-[2.5rem] bg-muted/30 border-2 border-dashed border-primary/20 space-y-6">
                      <div className="flex items-center gap-3">
                         <Sparkles className="w-5 h-5 text-primary" />
                         <span className="text-xs font-black uppercase tracking-wider">Prime Factors</span>
                      </div>
                      <div className="flex flex-wrap gap-3">
                         {primeFactors.map((f, i) => (
                           <motion.div 
                            key={i}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: i * 0.1 }}
                            className="w-14 h-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center text-xl font-black shadow-lg"
                           >
                             {f}
                           </motion.div>
                         ))}
                      </div>
                      <p className="text-sm font-bold opacity-60">
                         {number} = {primeFactors.join(' × ')}
                      </p>
                   </div>
                </div>

                <div className="bg-card rounded-[3rem] border-2 shadow-xl p-10 flex flex-col items-center overflow-hidden relative">
                   <div className="absolute top-0 right-0 p-8 opacity-5">
                      <Brain className="w-40 h-40" />
                   </div>
                   <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-12 text-primary">Factor Tree Visualization</h3>
                   
                   <div className="flex flex-col items-center space-y-12 w-full">
                      {factorTree && <FactorNode node={factorTree} />}
                   </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'gcd' && (
              <motion.div 
                key="gcd"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-10"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-3">
                       <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Number A</label>
                       <Input value={numA} onChange={(e) => setNumA(e.target.value)} className="h-16 rounded-2xl border-2 text-2xl font-black focus:ring-primary" />
                   </div>
                   <div className="space-y-3">
                       <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Number B</label>
                       <Input value={numB} onChange={(e) => setNumB(e.target.value)} className="h-16 rounded-2xl border-2 text-2xl font-black focus:ring-primary" />
                   </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                   <div className="space-y-6">
                       <div className="p-10 rounded-[3rem] bg-primary text-primary-foreground shadow-2xl relative overflow-hidden group">
                         <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                            <Zap className="w-24 h-24" />
                         </div>
                         <div className="relative z-10 space-y-8">
                            <div>
                               <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Greatest Common Divisor (GCD)</p>
                               <p className="text-6xl font-black">{gcd}</p>
                            </div>
                            <div className="pt-8 border-t border-white/10">
                               <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Least Common Multiple (LCM)</p>
                               <p className="text-4xl font-black">{lcm.toLocaleString()}</p>
                            </div>
                         </div>
                      </div>

                      <div className="p-8 rounded-[2.5rem] bg-muted/30 border-2 border-dashed flex items-center gap-6">
                          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                             <BookOpen className="w-8 h-8" />
                          </div>
                         <div className="space-y-1">
                             <p className="text-xs font-black uppercase text-primary tracking-wider">Concept</p>
                            <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                               GCD is found using the Euclidean Algorithm, which states that GCD(a, b) = GCD(b, a mod b).
                            </p>
                         </div>
                      </div>
                   </div>

                   <div className="bg-card rounded-[3rem] border-2 shadow-xl p-10 space-y-6">
                      <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Euclidean Algorithm Steps</h3>
                      <div className="space-y-4">
                         {euclideanSteps.map((step, i) => (
                           <motion.div 
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="flex items-center gap-4 p-4 rounded-2xl bg-muted/30 border-2"
                           >
                              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary">
                                 {i + 1}
                              </div>
                              <div className="text-sm font-bold">
                                 {step.a} = ({step.b} × {step.q}) + <span className="text-primary">{step.r}</span>
                              </div>
                           </motion.div>
                         ))}
                      </div>
                   </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'prime' && (
              <motion.div key="prime" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-12 py-6">
                 <div className="max-w-2xl mx-auto space-y-6">
                    <div className="space-y-3 text-center">
                       <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Range Search (Max 1000)</label>
                       <Input type="number" value={number} onChange={(e) => setNumber(e.target.value)} className="h-16 rounded-2xl border-2 text-2xl font-black text-center focus:ring-primary" />
                    </div>
                    <div className="flex flex-wrap justify-center gap-2 max-h-[300px] overflow-y-auto p-4 rounded-3xl bg-muted/20 border-2 border-dashed">
                       {sievePrimes.map(p => (
                          <div key={p} className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-lg text-xs font-black text-primary">
                             {p}
                          </div>
                       ))}
                    </div>
                 </div>

                 <AnimatePresence mode="wait">
                    {primality && (
                      <motion.div key={number} initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`p-10 rounded-[3rem] border-4 text-center space-y-6 max-w-xl mx-auto ${primality.isPrime ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-600 shadow-xl' : 'bg-rose-500/5 border-rose-500/20 text-rose-600 shadow-xl'}`}>
                         <div className={`w-20 h-20 rounded-3xl mx-auto flex items-center justify-center ${primality.isPrime ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                            {primality.isPrime ? <Zap className="w-10 h-10" /> : <Hash className="w-10 h-10" />}
                         </div>
                         <div>
                            <h2 className="text-4xl font-black tracking-tight mb-2">{primality.isPrime ? 'PRIME' : 'COMPOSITE'}</h2>
                            <p className="text-sm font-bold opacity-70">{primality.isPrime ? `${number} is a prime number.` : `${number} is divisible by ${primality.divisor}.`}</p>
                         </div>
                      </motion.div>
                    )}
                 </AnimatePresence>
              </motion.div>
            )}

            {activeTab === 'advanced' && (
              <motion.div key="advanced" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-12">
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <div className="space-y-8">
                       <div className="p-8 rounded-[2.5rem] bg-card border-2 shadow-xl space-y-6">
                          <h3 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2"><Sparkles className="w-4 h-4" /> Euler's Totient</h3>
                          <div className="space-y-4">
                             <div className="space-y-2">
                                <label className="text-[10px] font-bold opacity-50 ml-1">Input (n)</label>
                                <Input type="number" value={number} onChange={(e) => setNumber(e.target.value)} className="h-14 rounded-2xl border-2 text-xl font-black focus:ring-primary" />
                             </div>
                             <div className="p-6 rounded-2xl bg-primary text-primary-foreground">
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Phi(n)</p>
                                <p className="text-4xl font-black">{phi}</p>
                                <p className="text-[10px] font-bold opacity-60 mt-4 leading-tight">Number of positive integers up to n that are relatively prime to n.</p>
                             </div>
                          </div>
                       </div>
                    </div>

                    <div className="space-y-8">
                       <div className="p-8 rounded-[2.5rem] bg-card border-2 shadow-xl space-y-6">
                          <h3 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2"><Binary className="w-4 h-4" /> Modular Power</h3>
                          <div className="grid grid-cols-3 gap-4">
                             <div className="space-y-2">
                                <label className="text-[10px] font-bold opacity-50 ml-1">Base (a)</label>
                                <Input value={numA} onChange={(e) => setNumA(e.target.value)} className="h-12 rounded-xl border-2 font-black focus:ring-primary" />
                             </div>
                             <div className="space-y-2">
                                <label className="text-[10px] font-bold opacity-50 ml-1">Exp (b)</label>
                                <Input value={exponent} onChange={(e) => setExponent(e.target.value)} className="h-12 rounded-xl border-2 font-black focus:ring-primary" />
                             </div>
                             <div className="space-y-2">
                                <label className="text-[10px] font-bold opacity-50 ml-1">Mod (m)</label>
                                <Input value={mod} onChange={(e) => setMod(e.target.value)} className="h-12 rounded-xl border-2 font-black focus:ring-primary" />
                             </div>
                          </div>
                          <div className="p-6 rounded-2xl bg-muted/50 border-2 border-dashed flex flex-col items-center">
                             <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-4">Result: a^b mod m</p>
                             <p className="text-5xl font-black text-primary">{modPowResult}</p>
                          </div>
                       </div>
                    </div>
                 </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}

function FactorNode({ node }: { node: any }) {
  return (
    <div className="flex flex-col items-center">
      <motion.div 
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className={`w-20 h-20 rounded-3xl flex items-center justify-center text-2xl font-black shadow-xl relative z-20 ${node.isPrime ? 'bg-primary text-primary-foreground' : 'bg-muted border-4 text-muted-foreground'}`}
      >
        {node.value}
        {node.isPrime && (
          <div className="absolute -top-2 -right-2 bg-amber-400 text-amber-900 text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest border-2 border-white">Prime</div>
        )}
      </motion.div>

      {node.left && node.right && (
        <div className="flex gap-16 mt-12 relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-12 border-t-4 border-muted-foreground/20 rounded-t-[2rem] -mt-12 z-10" />
          <FactorNode node={node.left} />
          <FactorNode node={node.right} />
        </div>
      )}
    </div>
  );
}
