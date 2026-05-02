'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Box, Maximize, Activity, Sparkles, Calculator, 
  Zap, Info, ArrowRight, MousePointer2, RefreshCw, Layers
} from 'lucide-react';
import { useLanguage } from '@/context/language-context';

export default function LinearAlgebraPro() {
  const [matrix, setMatrix] = useState([[1, 2], [2, 1]]);
  const [size, setSize] = useState(2);
  const [activeTab, setActiveTab] = useState<'eigen' | 'transform'>('eigen');
  
  const { t } = useLanguage();

  const handleCellChange = (r: number, c: number, val: string) => {
    const newMatrix = matrix.map((row, ri) => 
      row.map((cell, ci) => (ri === r && ci === c ? parseFloat(val) || 0 : cell))
    );
    setMatrix(newMatrix);
  };

  const resizeMatrix = (s: number) => {
    const newMatrix = Array(s).fill(0).map((_, r) => 
      Array(s).fill(0).map((_, c) => matrix[r]?.[c] ?? (r === c ? 1 : 0))
    );
    setSize(s);
    setMatrix(newMatrix);
  };

  const analysis = useMemo(() => {
    if (size === 2) {
      const [[a, b], [c, d]] = matrix;
      // Eigenvalues: det(A - lambda I) = 0
      // lambda^2 - (a+d)lambda + (ad-bc) = 0
      const trace = a + d;
      const det = a * d - b * c;
      const discriminant = trace * trace - 4 * det;
      
      if (discriminant >= 0) {
        const l1 = (trace + Math.sqrt(discriminant)) / 2;
        const l2 = (trace - Math.sqrt(discriminant)) / 2;
        
        // Eigenvectors
        // (a-l1)x + by = 0 => y = -(a-l1)x / b
        const v1 = b !== 0 ? [b, l1 - a] : [1, 0];
        const v2 = b !== 0 ? [b, l2 - a] : [0, 1];
        
        return { eigen: [{ l: l1, v: v1 }, { l: l2, v: v2 }], det, trace };
      }
      return { eigen: [], det, trace };
    }
    return { eigen: [], det: 0, trace: 0 };
  }, [matrix, size]);

  // Transformation visualization points
  const transformPoints = useMemo(() => {
    const points = [];
    for (let theta = 0; theta < 2 * Math.PI; theta += 0.2) {
      const x = Math.cos(theta);
      const y = Math.sin(theta);
      if (size === 2) {
        const tx = matrix[0][0] * x + matrix[0][1] * y;
        const ty = matrix[1][0] * x + matrix[1][1] * y;
        points.push({ x, y, tx, ty });
      }
    }
    return points;
  }, [matrix, size]);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <Card className="border-none shadow-2xl bg-gradient-to-br from-background via-muted/50 to-background overflow-hidden font-sans">
        <CardHeader className="bg-primary/5 border-b border-primary/10 p-8">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex items-center gap-4">
                 <div className="p-4 bg-primary text-primary-foreground rounded-2xl shadow-lg shadow-primary/20">
                    <Layers className="w-8 h-8" />
                 </div>
                 <div>
                    <CardTitle className="text-3xl font-black tracking-tight">{t('linearAlgebraProTitle' as any)}</CardTitle>
                    <CardDescription className="text-base font-bold text-primary/60">{t('linearAlgebraProProDesc' as any)}</CardDescription>
                 </div>
              </div>
              
              <div className="flex gap-2">
                 <Button variant={size === 2 ? 'default' : 'outline'} onClick={() => resizeMatrix(2)} className="rounded-xl font-black">2x2</Button>
                 <Button variant={size === 3 ? 'default' : 'outline'} onClick={() => resizeMatrix(3)} className="rounded-xl font-black">3x3</Button>
              </div>
           </div>
        </CardHeader>

        <CardContent className="p-8">
           <div className="grid grid-cols-1 lg:grid-cols-[1.2fr,1fr] gap-12">
              <div className="space-y-12">
                 <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Input Matrix A</label>
                    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}>
                       {matrix.map((row, r) => row.map((cell, c) => (
                          <Input
                            key={`${r}-${c}`}
                            type="number"
                            value={cell}
                            onChange={(e) => handleCellChange(r, c, e.target.value)}
                            className="h-20 rounded-3xl border-2 text-2xl font-black text-center focus:ring-primary shadow-lg"
                          />
                       )))}
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="p-8 rounded-[2.5rem] bg-card border-2 shadow-xl space-y-4">
                       <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Eigenvalues (λ)</p>
                       <div className="space-y-4">
                          {analysis.eigen.length > 0 ? analysis.eigen.map((e, i) => (
                             <div key={i} className="flex justify-between items-center pb-2 border-b">
                                <span className="text-2xl font-black text-primary">λ{i+1}</span>
                                <span className="text-2xl font-black">{e.l.toFixed(3)}</span>
                             </div>
                          )) : <p className="text-sm font-bold text-muted-foreground">Complex eigenvalues or calculation pending.</p>}
                       </div>
                    </div>

                    <div className="p-8 rounded-[2.5rem] bg-card border-2 shadow-xl space-y-4">
                       <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Matrix Properties</p>
                       <div className="space-y-4">
                          <div className="flex justify-between items-center pb-2 border-b">
                             <span className="text-lg font-black opacity-60">Determinant</span>
                             <span className="text-xl font-black">{analysis.det.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center pb-2 border-b">
                             <span className="text-lg font-black opacity-60">Trace</span>
                             <span className="text-xl font-black">{analysis.trace.toFixed(2)}</span>
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="p-10 rounded-[3rem] bg-primary text-primary-foreground shadow-2xl relative overflow-hidden group">
                    <Sparkles className="absolute top-0 right-0 p-8 w-40 h-40 opacity-10 group-hover:scale-110 transition-transform" />
                    <div className="relative z-10 space-y-6">
                       <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Eigenvector Analysis</p>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          {analysis.eigen.map((e, i) => (
                             <div key={i} className="space-y-2">
                                <p className="text-xs font-black">Vector v{i+1}</p>
                                <div className="flex items-center gap-2">
                                   <div className="p-3 bg-white/10 rounded-xl font-black">[ {e.v[0].toFixed(2)}, {e.v[1].toFixed(2)} ]ᵀ</div>
                                </div>
                             </div>
                          ))}
                       </div>
                    </div>
                 </div>
              </div>

              <div className="bg-muted/30 rounded-[3rem] border-2 shadow-inner p-10 flex flex-col relative overflow-hidden h-[650px]">
                 <div className="absolute top-8 left-8 flex items-center gap-2">
                    <Maximize className="w-4 h-4 text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Vector Transformation Engine</span>
                 </div>

                 <div className="flex-grow flex items-center justify-center relative">
                    <svg width="400" height="400" viewBox="-10 -10 20 20" className="drop-shadow-2xl">
                       {/* Grid lines */}
                       <line x1="-10" y1="0" x2="10" y2="0" stroke="currentColor" opacity="0.1" strokeWidth="0.1" />
                       <line x1="0" y1="-10" x2="0" y2="10" stroke="currentColor" opacity="0.1" strokeWidth="0.1" />
                       
                       {/* Unit Circle */}
                       <circle cx="0" cy="0" r="1" fill="none" stroke="currentColor" opacity="0.2" strokeWidth="0.05" strokeDasharray="0.2 0.2" />
                       
                       {/* Transformed Circle (Ellipse) */}
                       <polyline
                         points={transformPoints.map(p => `${p.tx},${-p.ty}`).join(' ')}
                         fill="none"
                         stroke="var(--primary)"
                         strokeWidth="0.1"
                         className="transition-all duration-1000"
                       />

                       {/* Eigenvectors */}
                       {analysis.eigen.map((e, i) => (
                          <line
                            key={i}
                            x1="0" y1="0"
                            x2={e.v[0] * e.l} y2={-e.v[1] * e.l}
                            stroke={i === 0 ? '#f36' : '#0c6'}
                            strokeWidth="0.15"
                            strokeLinecap="round"
                          />
                       ))}

                       {/* Basis Vectors */}
                       <line x1="0" y1="0" x2="1" y2="0" stroke="#f90" strokeWidth="0.1" opacity="0.5" />
                       <line x1="0" y1="0" x2="0" y2="-1" stroke="#0cf" strokeWidth="0.1" opacity="0.5" />
                    </svg>
                 </div>

                 <div className="mt-8 p-6 rounded-2xl bg-card border-2 shadow-xl space-y-4">
                    <div className="flex items-start gap-4">
                       <Info className="w-5 h-5 text-primary mt-1" />
                       <div>
                          <p className="text-xs font-black uppercase tracking-widest mb-1">Visual Insight</p>
                          <p className="text-xs font-bold text-muted-foreground leading-relaxed">
                             The <span className="text-primary">Indigo ellipse</span> shows how the unit circle is transformed by Matrix A. 
                             The <span className="text-rose-500">Red</span> and <span className="text-emerald-500">Green</span> lines represent the Eigenvectors, indicating the directions along which the transformation acts as simple scaling.
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
