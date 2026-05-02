'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Compass, Zap, Share2, Activity, 
  RotateCw, Maximize2, Move, Cpu,
  Calculator, Sparkles
} from 'lucide-react';
import { useLanguage } from '@/context/language-context';

type SolveMode = 'analyze' | 'arithmetic' | 'powers';

export default function ComplexNumberStudio() {
  const [real, setReal] = useState('3');
  const [imag, setImag] = useState('4');
  const [real2, setReal2] = useState('1');
  const [imag2, setImag2] = useState('2');
  const [power, setPower] = useState('2');
  const [solveMode, setSolveMode] = useState<SolveMode>('analyze');
  
  const { t } = useLanguage();

  const z1 = useMemo(() => {
    const r = parseFloat(real) || 0;
    const i = parseFloat(imag) || 0;
    const magnitude = Math.sqrt(r * r + i * i);
    const angleRad = Math.atan2(i, r);
    return { r, i, magnitude, angleRad, angleDeg: (angleRad * 180) / Math.PI };
  }, [real, imag]);

  const z2 = useMemo(() => {
    const r = parseFloat(real2) || 0;
    const i = parseFloat(imag2) || 0;
    const magnitude = Math.sqrt(r * r + i * i);
    const angleRad = Math.atan2(i, r);
    return { r, i, magnitude, angleRad, angleDeg: (angleRad * 180) / Math.PI };
  }, [real2, imag2]);

  const arithmeticResults = useMemo(() => {
    return {
      sum: { r: z1.r + z2.r, i: z1.i + z2.i },
      diff: { r: z1.r - z2.r, i: z1.i - z2.i },
      prod: { r: z1.r * z2.r - z1.i * z2.i, i: z1.r * z2.i + z1.i * z2.r },
      div: (() => {
        const den = z2.r * z2.r + z2.i * z2.i;
        if (den === 0) return { r: 0, i: 0, error: true };
        return { r: (z1.r * z2.r + z1.i * z2.i) / den, i: (z1.i * z2.r - z1.r * z2.i) / den };
      })()
    };
  }, [z1, z2]);

  const deMoivre = useMemo(() => {
    const n = parseFloat(power) || 1;
    const r_n = Math.pow(z1.magnitude, n);
    const theta_n = z1.angleRad * n;
    return {
      r: r_n * Math.cos(theta_n),
      i: r_n * Math.sin(theta_n),
      mag: r_n,
      deg: (theta_n * 180 / Math.PI) % 360
    };
  }, [z1, power]);

  const getArgandPos = (r: number, i: number) => {
    const maxVal = Math.max(Math.abs(z1.r), Math.abs(z1.i), Math.abs(z2.r), Math.abs(z2.i), 1);
    const scale = 40 / maxVal;
    return { x: 50 + r * scale, y: 50 - i * scale };
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <Card className="border-none shadow-2xl bg-gradient-to-br from-background via-muted/50 to-background overflow-hidden font-sans">
        <CardHeader className="bg-primary/5 border-b border-primary/10 p-8">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex items-center gap-4">
                 <div className="p-4 bg-primary text-primary-foreground rounded-2xl shadow-lg shadow-primary/20">
                    <Compass className="w-8 h-8" />
                 </div>
                 <div>
                    <CardTitle className="text-3xl font-black tracking-tight">{t('complexTitle')}</CardTitle>
                    <CardDescription className="text-base font-bold text-primary/60">{t('complexDesc')}</CardDescription>
                 </div>
              </div>
              <div className="flex p-1 bg-muted rounded-2xl border-2">
                 {[
                   { id: 'analyze', icon: Activity, label: 'Analyze' },
                   { id: 'arithmetic', icon: Calculator, label: 'Arithmetic' },
                   { id: 'powers', icon: Zap, label: 'De Moivre' }
                 ].map(tab => (
                   <button
                     key={tab.id}
                     onClick={() => setSolveMode(tab.id as any)}
                     className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black transition-all ${solveMode === tab.id ? 'bg-background shadow-lg text-primary scale-105' : 'text-muted-foreground hover:text-primary'}`}
                   >
                     <tab.icon className="w-4 h-4" />
                     {tab.label.toUpperCase()}
                   </button>
                 ))}
              </div>
           </div>
        </CardHeader>

        <CardContent className="p-8">
           <div className="grid grid-cols-1 lg:grid-cols-[1.5fr,1fr] gap-12">
              <div className="space-y-8">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                       <h4 className="text-[10px] font-black uppercase text-primary tracking-widest">Complex Number Z₁</h4>
                       <div className="grid grid-cols-2 gap-4">
                          <Input type="number" value={real} onChange={(e) => setReal(e.target.value)} className="h-16 rounded-2xl border-2 text-2xl font-black" />
                          <div className="relative">
                             <Input type="number" value={imag} onChange={(e) => setImag(e.target.value)} className="h-16 rounded-2xl border-2 text-2xl font-black pr-10" />
                             <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-xl text-primary">i</span>
                          </div>
                       </div>
                    </div>
                    {solveMode === 'arithmetic' && (
                       <div className="space-y-4">
                          <h4 className="text-[10px] font-black uppercase text-primary tracking-widest">Complex Number Z₂</h4>
                          <div className="grid grid-cols-2 gap-4">
                             <Input type="number" value={real2} onChange={(e) => setReal2(e.target.value)} className="h-16 rounded-2xl border-2 text-2xl font-black" />
                             <div className="relative">
                                <Input type="number" value={imag2} onChange={(e) => setImag2(e.target.value)} className="h-16 rounded-2xl border-2 text-2xl font-black pr-10" />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-xl text-primary">i</span>
                             </div>
                          </div>
                       </div>
                    )}
                    {solveMode === 'powers' && (
                       <div className="space-y-4">
                          <h4 className="text-[10px] font-black uppercase text-primary tracking-widest">Exponent (n)</h4>
                          <Input type="number" value={power} onChange={(e) => setPower(e.target.value)} className="h-16 rounded-2xl border-2 text-2xl font-black" />
                       </div>
                    )}
                 </div>

                 <div className="pt-6 border-t">
                    <AnimatePresence mode="wait">
                       {solveMode === 'analyze' && (
                          <motion.div key="analyze" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                             <div className="p-10 rounded-[3rem] bg-primary text-primary-foreground shadow-2xl relative overflow-hidden group">
                                <RotateCw className="absolute top-0 right-0 p-8 w-40 h-40 opacity-10" />
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Polar Representation</p>
                                <p className="text-5xl font-black">{z1.magnitude.toFixed(3)} ∠ {z1.angleDeg.toFixed(2)}°</p>
                             </div>
                             <div className="grid grid-cols-2 gap-4">
                                <div className="p-6 rounded-3xl bg-muted/30 border-2"><p className="text-[10px] font-black opacity-40 mb-1 uppercase">Conjugate</p><p className="text-xl font-black">{z1.r} - {z1.i}i</p></div>
                                <div className="p-6 rounded-3xl bg-muted/30 border-2"><p className="text-[10px] font-black opacity-40 mb-1 uppercase">Reciprocal</p><p className="text-xl font-black">{(z1.r/(z1.r**2+z1.i**2)).toFixed(3)} + {(-z1.i/(z1.r**2+z1.i**2)).toFixed(3)}i</p></div>
                             </div>
                          </motion.div>
                       )}
                       {solveMode === 'arithmetic' && (
                          <motion.div key="arithmetic" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 gap-4">
                             {[
                                { label: 'Sum (Z₁+Z₂)', res: arithmeticResults.sum },
                                { label: 'Diff (Z₁-Z₂)', res: arithmeticResults.diff },
                                { label: 'Prod (Z₁×Z₂)', res: arithmeticResults.prod },
                                { label: 'Div (Z₁/Z₂)', res: arithmeticResults.div }
                             ].map((item, i) => (
                                <div key={i} className="p-6 rounded-[2rem] bg-card border-2 shadow-lg">
                                   <p className="text-[10px] font-black uppercase text-primary mb-2">{item.label}</p>
                                   <p className="text-xl font-black">{(item.res as any).r.toFixed(2)} { (item.res as any).i >= 0 ? '+' : '-' } {Math.abs((item.res as any).i).toFixed(2)}i</p>
                                </div>
                             ))}
                          </motion.div>
                       )}
                       {solveMode === 'powers' && (
                          <motion.div key="powers" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-10 rounded-[3rem] bg-primary text-primary-foreground shadow-2xl relative overflow-hidden">
                             <Sparkles className="absolute top-0 right-0 p-8 w-40 h-40 opacity-10" />
                             <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Z₁ Raised to Power {power}</p>
                             <p className="text-4xl font-black">{deMoivre.r.toFixed(2)} { deMoivre.i >= 0 ? '+' : '-' } {Math.abs(deMoivre.i).toFixed(2)}i</p>
                             <div className="mt-8 pt-8 border-t border-white/10 grid grid-cols-2 gap-4">
                                <div><p className="text-[10px] font-black opacity-60">Resulting Mag</p><p className="text-xl font-black">{deMoivre.mag.toFixed(3)}</p></div>
                                <div><p className="text-[10px] font-black opacity-60">Resulting Angle</p><p className="text-xl font-black">{deMoivre.deg.toFixed(2)}°</p></div>
                             </div>
                          </motion.div>
                       )}
                    </AnimatePresence>
                 </div>
              </div>

              <div className="bg-muted/30 rounded-[3rem] border-2 shadow-inner p-10 flex flex-col items-center">
                 <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-12 text-primary">Argand Phase Diagram</h3>
                 <div className="relative w-full aspect-square max-w-[300px]">
                    <svg viewBox="0 0 100 100" className="w-full h-full text-primary">
                       <line x1="0" y1="50" x2="100" y2="50" stroke="currentColor" strokeWidth="0.5" opacity="0.2" />
                       <line x1="50" y1="0" x2="50" y2="100" stroke="currentColor" strokeWidth="0.5" opacity="0.2" />
                       <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.1" />
                       
                       <motion.line x1="50" y1="50" x2={getArgandPos(z1.r, z1.i).x} y2={getArgandPos(z1.r, z1.i).y} stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                       {solveMode === 'arithmetic' && <motion.line x1="50" y1="50" x2={getArgandPos(z2.r, z2.i).x} y2={getArgandPos(z2.r, z2.i).y} stroke="currentColor" strokeWidth="2" opacity="0.4" strokeDasharray="2 2" />}
                       
                       <circle cx={getArgandPos(z1.r, z1.i).x} cy={getArgandPos(z1.r, z1.i).y} r="3" fill="currentColor" />
                    </svg>
                 </div>
                 <div className="mt-8 p-6 rounded-2xl bg-amber-500/5 border border-amber-500/20"><p className="text-[10px] font-bold text-amber-700/80 leading-relaxed uppercase tracking-wider">Vector visualization mapped to complex manifold.</p></div>
              </div>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
