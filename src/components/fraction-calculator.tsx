'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Divide, Calculator, Sparkles, 
  ChevronRight, ArrowRightLeft, 
  RotateCw, Hash, Percent, Layers
} from 'lucide-react';
import { useLanguage } from '@/context/language-context';

export default function FractionCalculator() {
  const [num1, setNum1] = useState('3');
  const [den1, setDen1] = useState('4');
  const [num2, setNum2] = useState('2');
  const [den2, setDen2] = useState('3');
  const [op, setOp] = useState<'+' | '-' | '*' | '/'>('+');
  const [mode, setMode] = useState<'calc' | 'ratio'>('calc');
  
  const { t } = useLanguage();

  const gcd = (a: number, b: number): number => {
    return b === 0 ? a : gcd(b, a % b);
  };

  const simplify = (num: number, den: number) => {
    const common = Math.abs(gcd(num, den));
    return { n: num / common, d: den / common };
  };

  const results = useMemo(() => {
    const n1 = parseInt(num1) || 0;
    const d1 = parseInt(den1) || 1;
    const n2 = parseInt(num2) || 0;
    const d2 = parseInt(den2) || 1;

    let resN = 0;
    let resD = 1;
    let steps = [];

    if (op === '+' || op === '-') {
      const commonDen = d1 * d2;
      const adjN1 = n1 * d2;
      const adjN2 = n2 * d1;
      resN = op === '+' ? adjN1 + adjN2 : adjN1 - adjN2;
      resD = commonDen;
      steps.push({ type: 'common_den', text: `Find common denominator: ${d1} × ${d2} = ${commonDen}` });
      steps.push({ type: 'adj_num', text: `Adjust numerators: (${n1} × ${d2}) ${op} (${n2} × ${d1})` });
    } else if (op === '*') {
      resN = n1 * n2;
      resD = d1 * d2;
      steps.push({ type: 'multiply', text: `Multiply numerators: ${n1} × ${n2} = ${resN}` });
      steps.push({ type: 'multiply', text: `Multiply denominators: ${d1} × ${d2} = ${resD}` });
    } else if (op === '/') {
      resN = n1 * d2;
      resD = d1 * n2;
      steps.push({ type: 'reciprocal', text: `Invert second fraction and multiply: (${n1}/${d1}) × (${d2}/${n2})` });
    }

    const simplified = simplify(resN, resD);
    const mixed = {
      whole: Math.floor(Math.abs(simplified.n) / simplified.d),
      num: Math.abs(simplified.n) % simplified.d,
      den: simplified.d
    };

    return {
      raw: { n: resN, d: resD },
      simplified,
      mixed,
      steps,
      decimal: (resN / resD).toFixed(4)
    };
  }, [num1, den1, num2, den2, op]);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <Card className="border-none shadow-2xl bg-gradient-to-br from-background via-muted/50 to-background overflow-hidden font-sans">
        <CardHeader className="bg-primary/5 border-b border-primary/10 p-8">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex items-center gap-4">
                 <div className="p-4 bg-primary text-primary-foreground rounded-2xl shadow-lg shadow-primary/20">
                    <Divide className="w-8 h-8" />
                 </div>
                 <div>
                    <CardTitle className="text-3xl font-black tracking-tight">{t('fractionTitle')}</CardTitle>
                    <CardDescription className="text-base font-bold text-primary/60">Advanced rational expression solver.</CardDescription>
                 </div>
              </div>
              <div className="flex p-1 bg-muted rounded-2xl border-2">
                 <button onClick={() => setMode('calc')} className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${mode === 'calc' ? 'bg-background shadow-lg text-primary scale-105' : 'text-muted-foreground hover:text-primary'}`}>ARITHMETIC</button>
                 <button onClick={() => setMode('ratio')} className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${mode === 'ratio' ? 'bg-background shadow-lg text-primary scale-105' : 'text-muted-foreground hover:text-primary'}`}>RATIO SOLVER</button>
              </div>
           </div>
        </CardHeader>

        <CardContent className="p-8">
           <div className="grid grid-cols-1 lg:grid-cols-[1.5fr,1fr] gap-12">
              <div>
                 <AnimatePresence mode="wait">
                    {mode === 'calc' && (
                      <motion.div key="calc" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-12">
                         <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
                            <div className="flex flex-col items-center gap-3">
                               <Input type="number" value={num1} onChange={(e) => setNum1(e.target.value)} className="w-24 h-16 rounded-2xl border-2 text-2xl font-black text-center focus:ring-primary" />
                               <div className="w-24 h-1.5 bg-primary rounded-full shadow-sm" />
                               <Input type="number" value={den1} onChange={(e) => setDen1(e.target.value)} className="w-24 h-16 rounded-2xl border-2 text-2xl font-black text-center focus:ring-primary" />
                            </div>
                            <div className="flex flex-col gap-3">
                               {['+', '-', '*', '/'].map(o => (
                                 <button key={o} onClick={() => setOp(o as any)} className={`w-12 h-12 rounded-xl border-2 font-black transition-all ${op === o ? 'bg-primary border-primary text-primary-foreground scale-110 shadow-lg' : 'text-primary hover:bg-primary/10'}`}>{o === '*' ? '×' : o === '/' ? '÷' : o}</button>
                               ))}
                            </div>
                            <div className="flex flex-col items-center gap-3">
                               <Input type="number" value={num2} onChange={(e) => setNum2(e.target.value)} className="w-24 h-16 rounded-2xl border-2 text-2xl font-black text-center focus:ring-primary" />
                               <div className="w-24 h-1.5 bg-primary rounded-full shadow-sm" />
                               <Input type="number" value={den2} onChange={(e) => setDen2(e.target.value)} className="w-24 h-16 rounded-2xl border-2 text-2xl font-black text-center focus:ring-primary" />
                            </div>
                            <div className="text-4xl font-black text-primary">=</div>
                            <div className="flex flex-col items-center gap-3">
                               <div className="w-24 h-16 flex items-center justify-center text-3xl font-black text-primary">{results.simplified.n}</div>
                               <div className="w-24 h-1.5 bg-primary rounded-full" />
                               <div className="w-24 h-16 flex items-center justify-center text-3xl font-black text-primary">{results.simplified.d}</div>
                            </div>
                         </div>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="p-8 rounded-[2.5rem] bg-primary text-primary-foreground shadow-xl relative overflow-hidden group">
                               <RotateCw className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform w-16 h-16" />
                               <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Mixed Number</p>
                               <p className="text-3xl font-black">{results.mixed.whole > 0 ? results.mixed.whole : ''} {results.mixed.num > 0 ? `${results.mixed.num}/${results.mixed.den}` : results.mixed.whole === 0 ? '0' : ''}</p>
                            </div>
                            <div className="p-8 rounded-[2.5rem] bg-muted/30 border-2 border-dashed">
                               <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">Decimal</p>
                               <p className="text-3xl font-black">{results.decimal}</p>
                            </div>
                            <div className="p-8 rounded-[2.5rem] bg-muted/30 border-2 border-dashed">
                               <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">Ratio</p>
                               <p className="text-3xl font-black">{results.simplified.n}:{results.simplified.d}</p>
                            </div>
                         </div>
                      </motion.div>
                    )}
                    {mode === 'ratio' && (
                       <motion.div key="ratio" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-12 py-10">
                          <div className="flex items-center justify-center gap-8 text-4xl font-black text-primary">
                             <div className="flex flex-col gap-4">
                                <Input value={num1} onChange={(e) => setNum1(e.target.value)} className="w-32 h-20 rounded-3xl border-4 text-center text-3xl" />
                                <div className="h-1 bg-primary rounded-full" />
                                <Input value={den1} onChange={(e) => setDen1(e.target.value)} className="w-32 h-20 rounded-3xl border-4 text-center text-3xl" />
                             </div>
                             <div className="text-6xl">=</div>
                             <div className="flex flex-col gap-4">
                                <Input value={num2} onChange={(e) => setNum2(e.target.value)} className="w-32 h-20 rounded-3xl border-4 text-center text-3xl placeholder:opacity-20" placeholder="x" />
                                <div className="h-1 bg-primary rounded-full" />
                                <Input value={den2} onChange={(e) => setDen2(e.target.value)} className="w-32 h-20 rounded-3xl border-4 text-center text-3xl placeholder:opacity-20" placeholder="y" />
                             </div>
                          </div>
                          <div className="p-10 rounded-[3rem] bg-primary text-primary-foreground shadow-2xl max-w-2xl mx-auto">
                             <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-4">Cross Multiplication Discovery</p>
                             <div className="grid grid-cols-2 gap-8">
                                <div>
                                   <p className="text-xs font-bold opacity-60 mb-1">Product A (a×d)</p>
                                   <p className="text-4xl font-black">{(parseFloat(num1) * parseFloat(den2) || 0).toLocaleString()}</p>
                                </div>
                                <div>
                                   <p className="text-xs font-bold opacity-60 mb-1">Product B (b×c)</p>
                                   <p className="text-4xl font-black">{(parseFloat(den1) * parseFloat(num2) || 0).toLocaleString()}</p>
                                </div>
                             </div>
                          </div>
                       </motion.div>
                    )}
                 </AnimatePresence>
              </div>

              <div className="space-y-8">
                 <div className="bg-card rounded-[3rem] border-2 shadow-xl p-8 space-y-6">
                    <div className="flex items-center gap-3">
                       <Layers className="w-5 h-5 text-primary" />
                       <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Solution Steps</h3>
                    </div>
                    <div className="space-y-4">
                       {results.steps.map((step, i) => (
                         <motion.div 
                          key={i}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-start gap-4 p-4 rounded-2xl bg-muted/30 border-2"
                         >
                           <div className="w-6 h-6 rounded-lg bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-black shrink-0 mt-1">{i + 1}</div>
                           <p className="text-sm font-bold leading-relaxed">{step.text}</p>
                         </motion.div>
                       ))}
                       <div className="flex items-start gap-4 p-4 rounded-2xl bg-primary/5 border-2 border-primary/20">
                          <div className="w-6 h-6 rounded-lg bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-black shrink-0 mt-1">{results.steps.length + 1}</div>
                          <p className="text-sm font-bold leading-relaxed">Simplify result: Find GCD({results.raw.n}, {results.raw.d}) = {Math.abs(gcd(results.raw.n, results.raw.d))}</p>
                       </div>
                    </div>
                 </div>
                 
                 <div className="p-8 rounded-[2.5rem] bg-muted/30 border-2 border-dashed flex items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                       <Sparkles className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                       <p className="text-xs font-black uppercase text-primary tracking-wider">Pro Tip</p>
                       <p className="text-[10px] text-muted-foreground font-bold leading-relaxed uppercase tracking-widest">
                          Always multiply numerators by the other denominator when adding/subtracting fractions.
                       </p>
                    </div>
                 </div>
              </div>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
