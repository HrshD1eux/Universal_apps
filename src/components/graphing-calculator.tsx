'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Line, ReferenceLine } from 'recharts';
import { LayoutGrid, TrendingUp, Zap, HelpCircle, Expand, RefreshCw } from 'lucide-react';
import { safeInvoke, isTauri } from '@/lib/tauri-utils';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/language-context';

export default function GraphingCalculator() {
  const [expression, setExpression] = useState('x * x');
  const [xMin, setXMin] = useState('-10');
  const [xMax, setXMax] = useState('10');
  const [data, setData] = useState<any[]>([]);
  const { t } = useLanguage();
  const { toast } = useToast();

  const handleCalculate = useCallback(async () => {
    if (!isTauri() || !expression.trim()) return;
    try {
      const res = await safeInvoke<any>('calculate_function_samples', {
        expression,
        xMin: parseFloat(xMin),
        xMax: parseFloat(xMax),
        points: 100
      });
      setData(res.functions);
    } catch (err) {
      // Don't toast on every keystroke error
    }
  }, [expression, xMin, xMax]);

  useEffect(() => {
    const timer = setTimeout(() => handleCalculate(), 300);
    return () => clearTimeout(timer);
  }, [handleCalculate]);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <Card className="border-none shadow-2xl bg-gradient-to-br from-background via-muted/50 to-background overflow-hidden">
        <CardHeader className="bg-primary/5 border-b border-primary/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-lg">
              <TrendingUp className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <CardTitle className="text-2xl">{t('graphTitle')}</CardTitle>
              <CardDescription>{t('graphDesc')}</CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr,2.5fr] gap-12">
            <div className="space-y-6">
               <div className="space-y-2">
                  <label className="text-sm font-bold opacity-60 uppercase tracking-widest ml-1">Expression f(x)</label>
                  <div className="relative">
                     <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-primary">y = </span>
                     <Input 
                        value={expression} 
                        onChange={(e) => setExpression(e.target.value)} 
                        className="h-14 pl-12 rounded-2xl border-2 font-mono text-lg focus:ring-primary shadow-inner"
                        placeholder="e.g. x * x + 2"
                     />
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase opacity-60 tracking-widest ml-1">X Min</label>
                     <Input type="number" value={xMin} onChange={(e) => setXMin(e.target.value)} className="h-12 rounded-2xl border-2 font-mono" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase opacity-60 tracking-widest ml-1">X Max</label>
                     <Input type="number" value={xMax} onChange={(e) => setXMax(e.target.value)} className="h-12 rounded-2xl border-2 font-mono" />
                  </div>
               </div>

               <div className="p-6 rounded-[2rem] bg-indigo-500/5 border-2 border-dashed border-indigo-500/20 space-y-4">
                  <div className="flex gap-4">
                     <HelpCircle className="w-5 h-5 text-indigo-600 shrink-0" />
                     <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-wider text-indigo-600">Tip</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                           Use operators like `*`, `/`, `+`, `-`, and functions like `sin(x)`, `cos(x)`, `log(x)`, `sqrt(x)`.
                        </p>
                     </div>
                  </div>
               </div>
            </div>

            {/* Graph Visualization */}
            <div className="bg-card/50 rounded-[2.5rem] border-2 shadow-xl p-6 min-h-[500px] flex flex-col relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32" />
               
               <div className="flex justify-between items-center mb-6 relative z-10">
                  <div className="flex items-center gap-3">
                     <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                     <span className="text-[10px] font-black uppercase tracking-widest opacity-60">High-Precision Plotter</span>
                  </div>
                  <div className="flex gap-2">
                     <Button variant="outline" size="sm" onClick={() => { setExpression('x*x'); handleCalculate(); }} className="rounded-xl text-[10px] font-black h-8">PARABOLA</Button>
                     <Button variant="outline" size="sm" onClick={() => { setExpression('sin(x)'); handleCalculate(); }} className="rounded-xl text-[10px] font-black h-8">SINE</Button>
                     <Button variant="ghost" size="icon" onClick={handleCalculate} className="rounded-full h-8 w-8">
                        <RefreshCw className="w-4 h-4" />
                     </Button>
                  </div>
               </div>

               <div className="flex-grow h-[450px] relative z-10">
                  <ResponsiveContainer width="100%" height="100%">
                     <LineChart>
                        <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={true} stroke="currentColor" opacity={0.05} />
                        <XAxis 
                          dataKey="x" 
                          type="number" 
                          domain={[parseFloat(xMin) || -10, parseFloat(xMax) || 10]} 
                          tick={{ fontSize: 10, fontWeight: 'bold', fill: 'currentColor', opacity: 0.5 }}
                          axisLine={false}
                          tickLine={false}
                          allowDataOverflow={true}
                        />
                        <YAxis 
                          type="number" 
                          domain={['auto', 'auto']}
                          tick={{ fontSize: 10, fontWeight: 'bold', fill: 'currentColor', opacity: 0.5 }}
                          axisLine={false}
                          tickLine={false}
                          allowDataOverflow={true}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            borderRadius: '1.5rem', 
                            border: '1px solid rgba(var(--primary), 0.1)', 
                            boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                            background: 'rgba(var(--background), 0.8)',
                            backdropFilter: 'blur(8px)',
                            padding: '12px 16px'
                          }}
                          itemStyle={{ fontWeight: 'bold', fontSize: '12px' }}
                        />
                        <ReferenceLine x={0} stroke="currentColor" strokeWidth={2} opacity={0.2} />
                        <ReferenceLine y={0} stroke="currentColor" strokeWidth={2} opacity={0.2} />
                        {data.map((points, idx) => (
                          <Line 
                            key={idx}
                            data={points}
                            type="monotone" 
                            dataKey="y" 
                            stroke={['#6366f1', '#f43f5e', '#8b5cf6', '#10b981'][idx % 4]} 
                            strokeWidth={4} 
                            dot={false}
                            animationDuration={1000}
                            isAnimationActive={true}
                            connectNulls={false}
                          />
                        ))}
                     </LineChart>
                  </ResponsiveContainer>
               </div>
               
               <div className="mt-4 flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                  {expression.split(';').filter(s => s.trim()).map((expr, i) => (
                     <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted/50 border border-primary/10 shrink-0">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ['#6366f1', '#f43f5e', '#8b5cf6', '#10b981'][i % 4] }} />
                        <span className="text-[10px] font-black opacity-80 uppercase tracking-tighter">f{i+1}(x) = {expr}</span>
                     </div>
                  ))}
               </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
