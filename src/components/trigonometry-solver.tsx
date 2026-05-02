'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Triangle, Ruler, Activity, Zap, 
  Sparkles, Compass, Maximize2, Move
} from 'lucide-react';
import { useLanguage } from '@/context/language-context';

export default function TrigonometrySolver() {
  // Inputs for sides a, b, c and angles A, B, C (opposite to sides)
  const [inputs, setInputs] = useState<Record<string, string>>({
    a: '3', b: '4', c: '',
    A: '', B: '', C: '90'
  });
  const [angle, setAngle] = useState('45');
  const [activeTab, setActiveTab] = useState<'triangle' | 'unit'>('triangle');
  
  const { t } = useLanguage();

  const updateInput = (key: string, val: string) => {
    setInputs(prev => ({ ...prev, [key]: val }));
  };

  const results = useMemo(() => {
    const a = parseFloat(inputs.a) || 0;
    const b = parseFloat(inputs.b) || 0;
    const c = parseFloat(inputs.c) || 0;
    const A = parseFloat(inputs.A) || 0; // Degrees
    const B = parseFloat(inputs.B) || 0; // Degrees
    const C = parseFloat(inputs.C) || 0; // Degrees

    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const toDeg = (rad: number) => (rad * 180) / Math.PI;

    let res = { a, b, c, A, B, C, type: 'Incomplete' };

    // Case 1: SSS (Side Side Side)
    if (a && b && c) {
      res.A = toDeg(Math.acos((b*b + c*c - a*a) / (2*b*c)));
      res.B = toDeg(Math.acos((a*a + c*c - b*b) / (2*a*c)));
      res.C = 180 - res.A - res.B;
      res.type = 'SSS';
    }
    // Case 2: SAS (Side Angle Side - C is between a and b)
    else if (a && b && C) {
      res.c = Math.sqrt(a*a + b*b - 2*a*b*Math.cos(toRad(C)));
      res.A = toDeg(Math.asin((a * Math.sin(toRad(C))) / res.c));
      res.B = 180 - C - res.A;
      res.type = 'SAS';
    }
    // Case 3: ASA (Angle Side Angle)
    else if (A && c && B) {
      res.C = 180 - A - B;
      res.a = (c * Math.sin(toRad(A))) / Math.sin(toRad(res.C));
      res.b = (c * Math.sin(toRad(B))) / Math.sin(toRad(res.C));
      res.type = 'ASA';
    }
    // Case 4: Right Angled (Pythagoras)
    else if (a && b && !c && C === 90) {
      res.c = Math.sqrt(a*a + b*b);
      res.A = toDeg(Math.atan(a/b));
      res.B = 90 - res.A;
      res.type = 'Right Angled';
    }

    return res;
  }, [inputs]);

  // SVG Coordinates for triangle
  const points = useMemo(() => {
    const { a, b, c, C } = results;
    if (!a || !b || !c || isNaN(a) || isNaN(b) || isNaN(c)) return null;
    if (!isFinite(a) || !isFinite(b) || !isFinite(c)) return null;
    
    // Scale for SVG (max side length ~ 80 units)
    const maxSide = Math.max(a, b, c);
    if (maxSide === 0) return null;
    const scale = 70 / maxSide;
    
    // Origin at (15, 85)
    // C is at origin
    // side b is along X axis.
    const pC = { x: 15, y: 85 };
    const pA = { x: 15 + b * scale, y: 85 };
    
    // Point B using law of cosines for coordinates
    const radC = (results.C * Math.PI) / 180;
    if (isNaN(radC)) return null;

    const pB = {
      x: 15 + a * Math.cos(radC) * scale,
      y: 85 - a * Math.sin(radC) * scale
    };

    // Final sanity check for NaN
    if (isNaN(pA.x) || isNaN(pB.x) || isNaN(pB.y) || !isFinite(pA.x) || !isFinite(pB.x) || !isFinite(pB.y)) return null;

    return { pA, pB, pC };
  }, [results]);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <Card className="border-none shadow-2xl bg-gradient-to-br from-background via-muted/50 to-background overflow-hidden font-sans">
        <CardHeader className="bg-primary/5 border-b border-primary/10 p-8">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex items-center gap-4">
                 <div className="p-4 bg-primary text-primary-foreground rounded-2xl shadow-lg shadow-primary/20">
                    <Triangle className="w-8 h-8" />
                 </div>
                 <div>
                    <CardTitle className="text-3xl font-black tracking-tight">{t('trigTitle')}</CardTitle>
                    <CardDescription className="text-base font-bold text-primary/60">Advanced triangle and circular trigonometry engine.</CardDescription>
                 </div>
              </div>
              <div className="flex p-1 bg-muted rounded-2xl border-2">
                 <button onClick={() => setActiveTab('triangle')} className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'triangle' ? 'bg-background shadow-lg text-primary scale-105' : 'text-muted-foreground hover:text-primary'}`}>TRIANGLE</button>
                 <button onClick={() => setActiveTab('unit')} className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'unit' ? 'bg-background shadow-lg text-primary scale-105' : 'text-muted-foreground hover:text-primary'}`}>UNIT CIRCLE</button>
              </div>
           </div>
        </CardHeader>

        <CardContent className="p-8">
          <AnimatePresence mode="wait">
            {activeTab === 'triangle' && (
              <motion.div key="triangle" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="grid grid-cols-1 lg:grid-cols-[1.5fr,1.2fr] gap-12">
                <div className="space-y-8">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                         <h3 className="text-xs font-black uppercase tracking-widest text-primary">Sides</h3>
                         <div className="grid grid-cols-3 gap-4">
                            {['a', 'b', 'c'].map(s => (
                              <div key={s} className="space-y-1">
                                 <label className="text-[10px] font-black opacity-40 ml-1">Side {s}</label>
                                 <Input value={inputs[s]} onChange={(e) => updateInput(s, e.target.value)} className="h-12 rounded-xl border-2 text-center font-black" />
                              </div>
                            ))}
                         </div>
                      </div>
                      <div className="space-y-4">
                         <h3 className="text-xs font-black uppercase tracking-widest text-primary">Angles (deg)</h3>
                         <div className="grid grid-cols-3 gap-4">
                            {['A', 'B', 'C'].map(s => (
                              <div key={s} className="space-y-1">
                                 <label className="text-[10px] font-black opacity-40 ml-1">Angle {s}</label>
                                 <Input value={inputs[s]} onChange={(e) => updateInput(s, e.target.value)} className="h-12 rounded-xl border-2 text-center font-black" />
                              </div>
                            ))}
                         </div>
                      </div>
                   </div>
                    <div className="p-10 rounded-[3rem] bg-primary text-primary-foreground shadow-2xl relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform"><Compass className="w-24 h-24" /></div>
                      <div className="relative z-10">
                         <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Identity: {results.type}</p>
                         <div className="grid grid-cols-2 md:grid-cols-3 gap-8 pt-8 border-t border-white/10">
                            <div><p className="text-[10px] font-black opacity-60 mb-2">Side a</p><p className="text-2xl font-black">{results.a.toFixed(2)}</p></div>
                            <div><p className="text-[10px] font-black opacity-60 mb-2">Side b</p><p className="text-2xl font-black">{results.b.toFixed(2)}</p></div>
                            <div><p className="text-[10px] font-black opacity-60 mb-2">Side c</p><p className="text-2xl font-black">{results.c.toFixed(2)}</p></div>
                            <div className="pt-4"><p className="text-[10px] font-black opacity-60 mb-2">Angle A</p><p className="text-2xl font-black">{results.A.toFixed(1)}°</p></div>
                            <div className="pt-4"><p className="text-[10px] font-black opacity-60 mb-2">Angle B</p><p className="text-2xl font-black">{results.B.toFixed(1)}°</p></div>
                            <div className="pt-4"><p className="text-[10px] font-black opacity-60 mb-2">Angle C</p><p className="text-2xl font-black">{results.C.toFixed(1)}°</p></div>
                         </div>
                      </div>
                    </div>
                </div>
                <div className="bg-muted/30 rounded-[3rem] border-2 shadow-inner p-10 flex flex-col items-center justify-center">
                   <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-12 text-primary">Dynamic Visualization</h3>
                   <div className="relative w-full aspect-square max-w-[350px]">
                      {points ? (
                        <svg viewBox="0 0 100 100" className="w-full h-full text-primary drop-shadow-2xl">
                           <motion.path initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} d={`M ${points.pC.x} ${points.pC.y} L ${points.pA.x} ${points.pA.y} L ${points.pB.x} ${points.pB.y} Z`} fill="currentColor" fillOpacity={0.1} stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                           <circle cx={points.pC.x} cy={points.pC.y} r="2" fill="currentColor" />
                           <circle cx={points.pA.x} cy={points.pA.y} r="2" fill="currentColor" />
                           <circle cx={points.pB.x} cy={points.pB.y} r="2" fill="currentColor" />
                           <text x={points.pC.x-5} y={points.pC.y+5} fontSize="4" fontWeight="black" fill="currentColor">C</text>
                           <text x={points.pA.x+2} y={points.pA.y+5} fontSize="4" fontWeight="black" fill="currentColor">A</text>
                           <text x={points.pB.x} y={points.pB.y-5} fontSize="4" fontWeight="black" fill="currentColor" textAnchor="middle">B</text>
                        </svg>
                      ) : <div className="text-xs font-bold opacity-30 italic">Enter values to visualize</div>}
                   </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'unit' && (
              <motion.div key="unit" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="grid grid-cols-1 lg:grid-cols-[1fr,1.5fr] gap-12">
                 <div className="space-y-8">
                    <div className="space-y-4">
                       <label className="text-[10px] font-black uppercase tracking-widest text-primary">Angle (θ) in Degrees</label>
                       <Input type="number" value={angle} onChange={(e) => setAngle(e.target.value)} className="h-16 rounded-2xl border-2 text-3xl font-black focus:ring-primary" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       {[
                         { label: 'Sin θ', val: Math.sin(parseFloat(angle) * Math.PI / 180).toFixed(4) },
                         { label: 'Cos θ', val: Math.cos(parseFloat(angle) * Math.PI / 180).toFixed(4) },
                         { label: 'Tan θ', val: Math.tan(parseFloat(angle) * Math.PI / 180).toFixed(4) },
                         { label: 'Rad', val: (parseFloat(angle) * Math.PI / 180).toFixed(4) }
                       ].map((item, i) => (
                         <div key={i} className="p-6 rounded-3xl bg-card border-2 shadow-lg">
                            <p className="text-[10px] font-black opacity-40 uppercase mb-2">{item.label}</p>
                            <p className="text-2xl font-black text-primary">{item.val}</p>
                         </div>
                       ))}
                    </div>
                 </div>
                 <div className="bg-card rounded-[3rem] border-2 shadow-xl p-10 flex flex-col items-center">
                    <h3 className="text-[10px] font-black uppercase tracking-widest mb-12 text-primary">Unit Circle Phasor</h3>
                    <div className="relative w-full aspect-square max-w-[300px]">
                       <svg viewBox="0 0 100 100" className="w-full h-full text-primary">
                          <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.2" />
                          <line x1="10" y1="50" x2="90" y2="50" stroke="currentColor" strokeWidth="0.5" opacity="0.1" />
                          <line x1="50" y1="10" x2="50" y2="90" stroke="currentColor" strokeWidth="0.5" opacity="0.1" />
                          
                          {(() => {
                             const a = parseFloat(angle) || 0;
                             const rad = a * Math.PI / 180;
                             const px = 50 + 40 * Math.cos(rad);
                             const py = 50 - 40 * Math.sin(rad);
                             return (
                                <>
                                   <motion.line initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} x1="50" y1="50" x2={px} y2={py} stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                   <circle cx={px} cy={py} r="3" fill="currentColor" />
                                   <line x1={px} y1="50" x2={px} y2={py} stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" opacity="0.5" />
                                   <line x1="50" y1={py} x2={px} y2={py} stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" opacity="0.5" />
                                </>
                             );
                          })()}
                       </svg>
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
