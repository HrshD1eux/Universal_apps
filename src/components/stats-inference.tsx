'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart, LineChart as ChartIcon, Sparkles, Calculator, 
  Zap, Info, ArrowRight, MousePointer2, TrendingUp, Activity
} from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { 
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip as ChartTooltip, ResponsiveContainer, ReferenceLine, Scatter, ScatterChart, ZAxis
} from 'recharts';

// P-value approximation for Normal Distribution
const getPValue = (z: number) => {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp(-z * z / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return z > 0 ? 1 - p : p;
};

export default function StatisticsInference() {
  const [activeTab, setActiveTab] = useState<'hypothesis' | 'regression'>('hypothesis');
  const [dataX, setDataX] = useState('10, 12, 15, 14, 18');
  const [dataY, setDataY] = useState('20, 24, 31, 28, 35');
  const [mu, setMu] = useState('14');
  const [alpha, setAlpha] = useState('0.05');
  const [testType, setTestType] = useState<'z' | 't'>('t');

  const { t } = useLanguage();

  const stats = useMemo(() => {
    const x = dataX.split(',').map(n => parseFloat(n.trim())).filter(n => !isNaN(n));
    const y = dataY.split(',').map(n => parseFloat(n.trim())).filter(n => !isNaN(n));
    
    if (x.length === 0) return null;

    const n = x.length;
    const meanX = x.reduce((a, b) => a + b, 0) / n;
    const stdX = Math.sqrt(x.reduce((a, b) => a + Math.pow(b - meanX, 2), 0) / (n - 1));
    
    const muVal = parseFloat(mu) || 0;
    const score = testType === 'z' 
      ? (meanX - muVal) / (stdX / Math.sqrt(n)) // Z assuming stdX is population std
      : (meanX - muVal) / (stdX / Math.sqrt(n)); // T
    
    const pValue = 2 * (1 - getPValue(Math.abs(score))); // Two-tailed

    // Regression
    let regression = null;
    if (x.length > 1 && x.length === y.length) {
      const meanY = y.reduce((a, b) => a + b, 0) / n;
      const num = x.reduce((acc, val, i) => acc + (val - meanX) * (y[i] - meanY), 0);
      const den = x.reduce((acc, val) => acc + Math.pow(val - meanX, 2), 0);
      const b = num / den;
      const a = meanY - b * meanX;
      
      const ssRes = x.reduce((acc, val, i) => acc + Math.pow(y[i] - (a + b * val), 2), 0);
      const ssTot = y.reduce((acc, val) => acc + Math.pow(val - meanY, 2), 0);
      const r2 = 1 - (ssRes / ssTot);
      
      regression = { a, b, r2 };
    }

    return { n, meanX, stdX, score, pValue, regression };
  }, [dataX, dataY, mu, testType]);

  const chartData = useMemo(() => {
    if (!stats || !stats.regression) return [];
    const x = dataX.split(',').map(n => parseFloat(n.trim())).filter(n => !isNaN(n));
    const y = dataY.split(',').map(n => parseFloat(n.trim())).filter(n => !isNaN(n));
    
    const data = x.map((val, i) => ({
      x: val,
      y: y[i],
      reg: stats.regression ? stats.regression.a + stats.regression.b * val : 0
    })).sort((a, b) => a.x - b.x);

    return data;
  }, [dataX, dataY, stats]);

  const bellCurveData = useMemo(() => {
    const data = [];
    const step = 0.1;
    for (let i = -4; i <= 4; i += step) {
      const y = (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * i * i);
      data.push({ x: i, y });
    }
    return data;
  }, []);

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
                    <CardTitle className="text-3xl font-black tracking-tight">{t('statsInferenceTitle' as any)}</CardTitle>
                    <CardDescription className="text-base font-bold text-primary/60">{t('statsInferenceDesc' as any)}</CardDescription>
                 </div>
              </div>
              
              <div className="flex p-1 bg-muted rounded-2xl border-2">
                 {[
                   { id: 'hypothesis', label: 'HYPOTHESIS TESTING' },
                   { id: 'regression', label: 'LINEAR REGRESSION' }
                 ].map(tab => (
                   <button
                     key={tab.id}
                     onClick={() => setActiveTab(tab.id as any)}
                     className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === tab.id ? 'bg-background shadow-lg text-primary scale-105' : 'text-muted-foreground hover:text-primary'}`}
                   >
                     {tab.label}
                   </button>
                 ))}
              </div>
           </div>
        </CardHeader>

        <CardContent className="p-8">
           <div className="grid grid-cols-1 lg:grid-cols-[1fr,1.5fr] gap-12">
              <div className="space-y-8">
                 <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Input Sample Data (X)</label>
                    <Input 
                      value={dataX} 
                      onChange={(e) => setDataX(e.target.value)} 
                      className="h-16 rounded-2xl border-2 font-bold focus:ring-primary"
                      placeholder="e.g. 10, 12, 15, 14, 18"
                    />
                 </div>

                 {activeTab === 'regression' && (
                    <div className="space-y-4">
                       <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Input Response Data (Y)</label>
                       <Input 
                         value={dataY} 
                         onChange={(e) => setDataY(e.target.value)} 
                         className="h-16 rounded-2xl border-2 font-bold focus:ring-primary"
                         placeholder="e.g. 20, 24, 31, 28, 35"
                       />
                    </div>
                 )}

                 {activeTab === 'hypothesis' && (
                    <div className="grid grid-cols-2 gap-6">
                       <div className="space-y-4">
                          <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Null Hypothesis (μ₀)</label>
                          <Input 
                            type="number" 
                            value={mu} 
                            onChange={(e) => setMu(e.target.value)} 
                            className="h-16 rounded-2xl border-2 font-black focus:ring-primary"
                          />
                       </div>
                       <div className="space-y-4">
                          <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Test Type</label>
                          <select 
                            value={testType} 
                            onChange={(e) => setTestType(e.target.value as any)}
                            className="w-full h-16 rounded-2xl border-2 bg-background font-black px-4 outline-none focus:border-primary transition-all"
                          >
                             <option value="z">Z-Test</option>
                             <option value="t">T-Test</option>
                          </select>
                       </div>
                    </div>
                 )}

                 <div className="pt-6">
                    <AnimatePresence mode="wait">
                       <motion.div 
                         key={activeTab}
                         initial={{ opacity: 0, scale: 0.95 }}
                         animate={{ opacity: 1, scale: 1 }}
                         className="p-10 rounded-[3rem] bg-primary text-primary-foreground shadow-2xl relative overflow-hidden group"
                       >
                          <Sparkles className="absolute top-0 right-0 p-8 w-40 h-40 opacity-10 group-hover:scale-110 transition-transform" />
                          <div className="relative z-10 space-y-8">
                             {activeTab === 'hypothesis' && stats ? (
                                <>
                                   <div>
                                      <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">P-VALUE (TWO-TAILED)</p>
                                      <p className="text-6xl font-black">{stats.pValue.toFixed(4)}</p>
                                   </div>
                                   <div className="pt-8 border-t border-white/10 grid grid-cols-2 gap-4">
                                      <div>
                                         <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Test Statistic</p>
                                         <p className="text-2xl font-black">{stats.score.toFixed(3)}</p>
                                      </div>
                                      <div>
                                         <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Conclusion</p>
                                         <p className="text-sm font-black uppercase tracking-tighter">
                                            {stats.pValue < parseFloat(alpha) ? 'REJECT NULL' : 'FAIL TO REJECT'}
                                         </p>
                                      </div>
                                   </div>
                                </>
                             ) : stats?.regression ? (
                                <>
                                   <div>
                                      <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">R-SQUARED (R²)</p>
                                      <p className="text-6xl font-black">{stats.regression.r2.toFixed(4)}</p>
                                   </div>
                                   <div className="pt-8 border-t border-white/10">
                                      <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Best Fit Equation</p>
                                      <p className="text-2xl font-black italic">y = {stats.regression.a.toFixed(2)} + {stats.regression.b.toFixed(2)}x</p>
                                   </div>
                                </>
                             ) : (
                                <p className="text-xl font-black opacity-60">Waiting for data...</p>
                             )}
                          </div>
                       </motion.div>
                    </AnimatePresence>
                 </div>
              </div>

              <div className="bg-muted/30 rounded-[3rem] border-2 shadow-inner p-10 flex flex-col relative overflow-hidden h-[600px]">
                 <div className="absolute top-8 left-8 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Probability & Distribution Engine</span>
                 </div>
                 
                 <div className="flex-grow pt-12">
                    {activeTab === 'hypothesis' ? (
                       <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={bellCurveData} margin={{ top: 20, right: 20, left: -20, bottom: 20 }}>
                             <defs>
                                <linearGradient id="colorP" x1="0" y1="0" x2="0" y2="1">
                                   <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                   <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                </linearGradient>
                             </defs>
                             <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                             <XAxis dataKey="x" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                             <YAxis hide />
                             <Area type="monotone" dataKey="y" stroke="#6366f1" strokeWidth={3} fill="url(#colorP)" />
                             {stats && (
                                <ReferenceLine 
                                  x={stats.score} 
                                  stroke="#ef4444" 
                                  strokeWidth={3} 
                                  label={{ position: 'top', value: 'STAT', fill: '#ef4444', fontSize: 10, fontWeight: 'black' }} 
                                />
                             )}
                             <ReferenceLine x={1.96} stroke="#6366f1" strokeDasharray="5 5" label={{ position: 'bottom', value: 'α/2', fontSize: 10 }} />
                             <ReferenceLine x={-1.96} stroke="#6366f1" strokeDasharray="5 5" />
                          </AreaChart>
                       </ResponsiveContainer>
                    ) : (
                       <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={chartData} margin={{ top: 20, right: 20, left: -20, bottom: 20 }}>
                             <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                             <XAxis dataKey="x" type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                             <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                             <ChartTooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                             <Scatter name="Data" dataKey="y" fill="#6366f1" />
                             <Line type="monotone" dataKey="reg" stroke="#6366f1" strokeWidth={3} dot={false} />
                          </ComposedChart>
                       </ResponsiveContainer>
                    )}
                 </div>
                 
                 <div className="mt-8 p-6 rounded-2xl bg-card border-2 shadow-xl flex items-start gap-4">
                    <Info className="w-5 h-5 text-primary mt-1" />
                    <div>
                       <p className="text-xs font-black uppercase tracking-widest mb-1">Inference Insight</p>
                       <p className="text-xs font-bold text-muted-foreground leading-relaxed">
                          {activeTab === 'hypothesis' 
                            ? `The p-value of ${stats?.pValue.toFixed(4)} suggests that there is a ${ (stats?.pValue || 0) * 100}% chance that the observed results occurred by random chance under the null hypothesis.` 
                            : `The R² value of ${stats?.regression?.r2.toFixed(4)} indicates that ${(stats?.regression?.r2 || 0) * 100}% of the variance in Y is explained by the linear relationship with X.`}
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

// Internal Recharts fix for AreaChart
import { AreaChart } from 'recharts';
