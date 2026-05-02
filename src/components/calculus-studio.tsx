'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, LineChart as ChartIcon, Sparkles, Calculator, 
  Zap, Info, ArrowRight, MousePointer2, RefreshCw
} from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { 
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip as ChartTooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';

export default function CalculusStudio() {
  const [funcStr, setFuncStr] = useState('x^2');
  const [mode, setMode] = useState<'diff' | 'int'>('diff');
  const [point, setPoint] = useState('2'); // For differentiation
  const [lower, setLower] = useState('0'); // For integration
  const [upper, setUpper] = useState('5'); // For integration
  const [error, setError] = useState<string | null>(null);
  
  const { t } = useLanguage();

  // Safe expression evaluator
  const evaluate = (f: string, x: number) => {
    try {
      // Basic sanitization and transformation
      let safeStr = f.toLowerCase()
        .replace(/sin/g, 'Math.sin')
        .replace(/cos/g, 'Math.cos')
        .replace(/tan/g, 'Math.tan')
        .replace(/sqrt/g, 'Math.sqrt')
        .replace(/log/g, 'Math.log')
        .replace(/exp/g, 'Math.exp')
        .replace(/abs/g, 'Math.abs')
        .replace(/pow/g, 'Math.pow')
        .replace(/ceil/g, 'Math.ceil')
        .replace(/floor/g, 'Math.floor')
        .replace(/round/g, 'Math.round')
        .replace(/pi/g, 'Math.PI')
        .replace(/e/g, 'Math.E')
        .replace(/\^/g, '**');

      // Add implicit multiplication: 2x -> 2*x, (x+1)x -> (x+1)*x, etc.
      safeStr = safeStr.replace(/(\d)([a-z\(])/g, '$1*$2');
      safeStr = safeStr.replace(/([x\)])(\d|[a-z\(])/g, '$1*$2');

      const fn = new Function('x', `try { return ${safeStr}; } catch(e) { return 0; }`);
      const res = fn(x);
      return isFinite(res) ? res : 0;
    } catch (e) {
      return 0;
    }
  };

  const results = useMemo(() => {
    const xVal = parseFloat(point) || 0;
    const a = parseFloat(lower) || 0;
    const b = parseFloat(upper) || 0;
    const h = 1e-5;

    // 1st Derivative (Central Difference)
    const f1 = (evaluate(funcStr, xVal + h) - evaluate(funcStr, xVal - h)) / (2 * h);
    
    // 2nd Derivative (Central Difference)
    const f2 = (evaluate(funcStr, xVal + h) - 2 * evaluate(funcStr, xVal) + evaluate(funcStr, xVal - h)) / (h * h);

    // Definite Integral (Simpson's Rule)
    let integral = 0;
    const n = 1000;
    const dx = (b - a) / n;
    
    if (n > 0) {
      let sum = evaluate(funcStr, a) + evaluate(funcStr, b);
      for (let i = 1; i < n; i++) {
        const x = a + i * dx;
        sum += (i % 2 === 0 ? 2 : 4) * evaluate(funcStr, x);
      }
      integral = (dx / 3) * sum;
    }

    return { f1, f2, integral };
  }, [funcStr, point, lower, upper]);

  const graphData = useMemo(() => {
    const data = [];
    const a = mode === 'int' ? Math.min(parseFloat(lower), parseFloat(upper)) - 2 : parseFloat(point) - 5;
    const b = mode === 'int' ? Math.max(parseFloat(lower), parseFloat(upper)) + 2 : parseFloat(point) + 5;
    const steps = 100;
    const stepSize = (b - a) / steps;

    for (let i = 0; i <= steps; i++) {
      const x = a + i * stepSize;
      const y = evaluate(funcStr, x);
      data.push({ 
        x: parseFloat(x.toFixed(2)), 
        y: parseFloat(y.toFixed(4)),
        isArea: mode === 'int' && x >= parseFloat(lower) && x <= parseFloat(upper)
      });
    }
    return data;
  }, [funcStr, point, lower, upper, mode]);

  // Tangent line data for differentiation
  const tangentData = useMemo(() => {
    if (mode !== 'diff') return [];
    const x0 = parseFloat(point) || 0;
    const y0 = evaluate(funcStr, x0);
    const m = results.f1;
    
    const data = [];
    for (let i = -2; i <= 2; i += 0.5) {
      const x = x0 + i;
      const y = y0 + m * (x - x0);
      data.push({ tx: x, ty: y });
    }
    return data;
  }, [funcStr, point, results.f1, mode]);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <Card className="border-none shadow-2xl bg-gradient-to-br from-background via-muted/50 to-background overflow-hidden font-sans">
        <CardHeader className="bg-primary/5 border-b border-primary/10 p-8">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex items-center gap-4">
                 <div className="p-4 bg-primary text-primary-foreground rounded-2xl shadow-lg shadow-primary/20">
                    <Activity className="w-8 h-8" />
                 </div>
                 <div>
                    <CardTitle className="text-3xl font-black tracking-tight">{t('calculusTitle' as any)}</CardTitle>
                    <CardDescription className="text-base font-bold text-primary/60">{t('calculusDesc' as any)}</CardDescription>
                 </div>
              </div>
              
              <div className="flex p-1 bg-muted rounded-2xl border-2">
                 {[
                   { id: 'diff', icon: Zap, label: t('differentiation' as any) },
                   { id: 'int', icon: RefreshCw, label: t('integration' as any) }
                 ].map(m => (
                   <button
                     key={m.id}
                     onClick={() => setMode(m.id as any)}
                     className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black transition-all ${mode === m.id ? 'bg-background shadow-lg text-primary scale-105' : 'text-muted-foreground hover:text-primary'}`}
                   >
                     <m.icon className={`w-4 h-4 ${mode === m.id ? 'animate-pulse' : ''}`} />
                     {m.label.toUpperCase()}
                   </button>
                 ))}
              </div>
           </div>
        </CardHeader>

        <CardContent className="p-8">
           <div className="grid grid-cols-1 lg:grid-cols-[1fr,1.5fr] gap-12">
              <div className="space-y-8">
                 <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">{t('functionLabel' as any)}</label>
                    <div className="relative group">
                       <Input 
                         value={funcStr} 
                         onChange={(e) => setFuncStr(e.target.value)} 
                         className="h-20 rounded-[2rem] border-2 bg-background/50 backdrop-blur-xl text-3xl font-black focus:ring-4 focus:ring-primary/10 transition-all pl-8 pr-16"
                         placeholder="x^2 + 2x + 1"
                       />
                       <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-20 group-hover:opacity-100 transition-opacity">
                          <ChartIcon className="w-8 h-8 text-primary" />
                       </div>
                    </div>
                    <p className="text-[10px] font-bold text-muted-foreground ml-4 italic">Supports: sin, cos, tan, sqrt, log, exp, ^, PI, E</p>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {mode === 'diff' ? (
                       <div className="space-y-4 col-span-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">{t('derivativeAt' as any)}</label>
                          <Input 
                            type="number" 
                            value={point} 
                            onChange={(e) => setPoint(e.target.value)} 
                            className="h-16 rounded-2xl border-2 text-2xl font-black focus:ring-primary" 
                          />
                       </div>
                    ) : (
                       <>
                          <div className="space-y-4">
                             <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Lower Bound (a)</label>
                             <Input 
                               type="number" 
                               value={lower} 
                               onChange={(e) => setLower(e.target.value)} 
                               className="h-16 rounded-2xl border-2 text-2xl font-black focus:ring-primary" 
                             />
                          </div>
                          <div className="space-y-4">
                             <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Upper Bound (b)</label>
                             <Input 
                               type="number" 
                               value={upper} 
                               onChange={(e) => setUpper(e.target.value)} 
                               className="h-16 rounded-2xl border-2 text-2xl font-black focus:ring-primary" 
                             />
                          </div>
                       </>
                    )}
                 </div>

                 <div className="pt-6">
                    <AnimatePresence mode="wait">
                       <motion.div 
                         key={mode}
                         initial={{ opacity: 0, x: -20 }}
                         animate={{ opacity: 1, x: 0 }}
                         exit={{ opacity: 0, x: 20 }}
                         className="p-10 rounded-[3rem] bg-primary text-primary-foreground shadow-2xl relative overflow-hidden group"
                       >
                          <Sparkles className="absolute top-0 right-0 p-8 w-40 h-40 opacity-10 group-hover:scale-110 transition-transform" />
                          <div className="relative z-10 space-y-8">
                             {mode === 'diff' ? (
                                <>
                                   <div>
                                      <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">First Derivative f'(x)</p>
                                      <p className="text-6xl font-black">{results.f1.toFixed(4)}</p>
                                   </div>
                                   <div className="pt-8 border-t border-white/10 grid grid-cols-2 gap-4">
                                      <div>
                                         <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">2nd Derivative f''(x)</p>
                                         <p className="text-2xl font-black">{results.f2.toFixed(4)}</p>
                                      </div>
                                      <div>
                                         <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Slope Angle</p>
                                         <p className="text-2xl font-black">{(Math.atan(results.f1) * 180 / Math.PI).toFixed(1)}°</p>
                                      </div>
                                   </div>
                                </>
                             ) : (
                                <>
                                   <div>
                                      <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Definite Integral</p>
                                      <p className="text-6xl font-black">{results.integral.toFixed(4)}</p>
                                   </div>
                                   <div className="pt-8 border-t border-white/10">
                                      <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Mean Value over [a,b]</p>
                                      <p className="text-2xl font-black">{(results.integral / (parseFloat(upper) - parseFloat(lower) || 1)).toFixed(4)}</p>
                                   </div>
                                </>
                             )}
                          </div>
                       </motion.div>
                    </AnimatePresence>
                 </div>
              </div>

              <div className="bg-muted/30 rounded-[3rem] border-2 shadow-inner p-10 flex flex-col relative overflow-hidden h-[600px]">
                 <div className="absolute top-8 left-8 flex items-center gap-2">
                    <ChartIcon className="w-4 h-4 text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Functional Analysis Engine</span>
                 </div>
                 
                 <div className="flex-grow pt-12">
                    <ResponsiveContainer width="100%" height="100%">
                       <ComposedChart data={graphData} margin={{ top: 20, right: 20, left: -20, bottom: 20 }}>
                          <defs>
                             <linearGradient id="colorY" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                             </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                          <XAxis 
                            dataKey="x" 
                            type="number" 
                            domain={['auto', 'auto']} 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 10, fontWeight: 'bold' }} 
                          />
                          <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 10, fontWeight: 'bold' }} 
                          />
                          <ChartTooltip 
                            contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', background: 'hsl(var(--background))' }}
                            itemStyle={{ fontWeight: 'black', fontSize: '12px' }}
                          />
                          {mode === 'int' && (
                             <Area 
                               type="monotone" 
                               dataKey="y" 
                               stroke="none" 
                               fill="url(#colorY)" 
                               baseValue={0}
                               connectNulls
                             />
                          )}
                          <Line 
                            type="monotone" 
                            dataKey="y" 
                            stroke="#6366f1" 
                            strokeWidth={4} 
                            dot={false} 
                            animationDuration={1000}
                          />
                          
                          {mode === 'diff' && (
                             <ReferenceLine 
                               x={parseFloat(point)} 
                               stroke="#6366f1" 
                               strokeDasharray="3 3" 
                               label={{ position: 'top', value: 'x', fontSize: 10, fontWeight: 'black', fill: '#6366f1' }} 
                             />
                          )}
                       </ComposedChart>
                    </ResponsiveContainer>
                 </div>
                 
                 <div className="mt-8 p-6 rounded-2xl bg-card border-2 shadow-xl flex items-start gap-4">
                    <Info className="w-5 h-5 text-primary mt-1" />
                    <div>
                       <p className="text-xs font-black uppercase tracking-widest mb-1">Visual Insight</p>
                       <p className="text-xs font-bold text-muted-foreground leading-relaxed">
                          {mode === 'diff' 
                            ? `At x = ${point}, the rate of change is ${results.f1.toFixed(4)}. This represents the slope of the tangent line to the curve.` 
                            : `The shaded area from x = ${lower} to ${upper} represents the accumulation of the function, totaling ${results.integral.toFixed(4)} units.`}
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
