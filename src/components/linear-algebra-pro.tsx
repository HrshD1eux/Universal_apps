'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Layers, Maximize, Sparkles, Info, RefreshCw } from 'lucide-react';
import { useLanguage } from '@/context/language-context';

export default function LinearAlgebraPro() {
  const [matrix, setMatrix] = useState([[1, 2], [2, 1]]);
  const { t } = useLanguage();

  const handleCellChange = (r: number, c: number, val: string) => {
    const newMatrix = matrix.map((row, ri) => 
      row.map((cell, ci) => (ri === r && ci === c ? parseFloat(val) || 0 : cell))
    );
    setMatrix(newMatrix);
  };

  const resetMatrix = () => {
    setMatrix([[1, 2], [2, 1]]);
  };

  const analysis = useMemo(() => {
    const [[a, b], [c, d]] = matrix;
    // Characteristic equation: det(A - lambda I) = 0
    // lambda^2 - (a+d)lambda + (ad-bc) = 0
    const trace = a + d;
    const det = a * d - b * c;
    const discriminant = trace * trace - 4 * det;
    
    if (discriminant >= 0) {
      const l1 = (trace + Math.sqrt(discriminant)) / 2;
      const l2 = (trace - Math.sqrt(discriminant)) / 2;
      
      // Eigenvectors: (a - lambda)*x + b*y = 0
      const v1 = b !== 0 ? [b, l1 - a] : [1, 0];
      const v2 = b !== 0 ? [b, l2 - a] : [0, 1];
      
      // Normalize eigenvectors for visualization
      const norm1 = Math.hypot(v1[0], v1[1]) || 1;
      const norm2 = Math.hypot(v2[0], v2[1]) || 1;
      
      return { 
        eigen: [
          { l: l1, v: [v1[0] / norm1, v1[1] / norm1] }, 
          { l: l2, v: [v2[0] / norm2, v2[1] / norm2] }
        ], 
        det, 
        trace,
        isReal: true 
      };
    }
    return { eigen: [], det, trace, isReal: false };
  }, [matrix]);

  // Transformation visualization points (mapping the unit circle through matrix A)
  const transformPoints = useMemo(() => {
    const points = [];
    for (let theta = 0; theta <= 2 * Math.PI + 0.1; theta += 0.1) {
      const x = Math.cos(theta);
      const y = Math.sin(theta);
      const tx = matrix[0][0] * x + matrix[0][1] * y;
      const ty = matrix[1][0] * x + matrix[1][1] * y;
      points.push({ x, y, tx, ty });
    }
    return points;
  }, [matrix]);

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
                <CardTitle className="text-3xl font-black tracking-tight">{t('linearAlgebraProTitle' as any) || 'Linear Algebra Visualizer'}</CardTitle>
                <CardDescription className="text-base font-bold text-primary/60">Eigenvalues, eigenvectors &amp; geometric 2D vector transformations</CardDescription>
              </div>
            </div>
            
            <Button variant="outline" size="sm" onClick={resetMatrix} className="rounded-xl font-bold gap-2">
              <RefreshCw className="w-4 h-4" /> Reset Default
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr,1fr] gap-12">
            <div className="space-y-10">
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Transformation Matrix (2×2)</label>
                <div className="grid grid-cols-2 gap-4 max-w-sm">
                  {matrix.map((row, r) => row.map((cell, c) => (
                    <Input
                      key={`${r}-${c}`}
                      type="number"
                      value={cell}
                      onChange={(e) => handleCellChange(r, c, e.target.value)}
                      className="h-20 rounded-3xl border-2 text-3xl font-black text-center focus:ring-primary shadow-lg font-mono"
                    />
                  )))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-8 rounded-[2.5rem] bg-card border-2 shadow-xl space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Eigenvalues (λ)</p>
                  <div className="space-y-4">
                    {analysis.isReal && analysis.eigen.length > 0 ? (
                      analysis.eigen.map((e, i) => (
                        <div key={i} className="flex justify-between items-center pb-2 border-b">
                          <span className="text-2xl font-black text-primary">λ{i+1}</span>
                          <span className="text-2xl font-black font-mono">{e.l.toFixed(3)}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm font-bold text-rose-500">Complex eigenvalues (no real roots for det(A - λI) = 0)</p>
                    )}
                  </div>
                </div>

                <div className="p-8 rounded-[2.5rem] bg-card border-2 shadow-xl space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Matrix Properties</p>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b">
                      <span className="text-lg font-black opacity-60">Determinant</span>
                      <span className="text-xl font-black font-mono">{analysis.det.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b">
                      <span className="text-lg font-black opacity-60">Trace</span>
                      <span className="text-xl font-black font-mono">{analysis.trace.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {analysis.isReal && analysis.eigen.length > 0 && (
                <div className="p-8 rounded-[2.5rem] bg-primary text-primary-foreground shadow-2xl relative overflow-hidden group">
                  <Sparkles className="absolute top-0 right-0 p-8 w-40 h-40 opacity-10 group-hover:scale-110 transition-transform" />
                  <div className="relative z-10 space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Normalized Eigenvectors</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {analysis.eigen.map((e, i) => (
                        <div key={i} className="space-y-1">
                          <p className="text-xs font-black">Direction v{i+1}</p>
                          <div className="p-3 bg-white/10 rounded-xl font-mono font-bold text-sm">
                            [ {e.v[0].toFixed(3)}, {e.v[1].toFixed(3)} ]ᵀ
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-muted/30 rounded-[3rem] border-2 shadow-inner p-8 flex flex-col relative overflow-hidden min-h-[550px]">
              <div className="flex items-center gap-2 mb-4">
                <Maximize className="w-4 h-4 text-primary" />
                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Geometric 2D Transformation</span>
              </div>

              <div className="flex-grow flex items-center justify-center relative">
                <svg width="340" height="340" viewBox="-8 -8 16 16" className="drop-shadow-xl bg-card rounded-3xl border border-primary/10">
                  {/* Grid lines */}
                  <line x1="-8" y1="0" x2="8" y2="0" stroke="currentColor" opacity="0.15" strokeWidth="0.08" />
                  <line x1="0" y1="-8" x2="0" y2="8" stroke="currentColor" opacity="0.15" strokeWidth="0.08" />
                  
                  {/* Unit Circle (Before transformation) */}
                  <circle cx="0" cy="0" r="1" fill="none" stroke="currentColor" opacity="0.25" strokeWidth="0.06" strokeDasharray="0.3 0.3" />
                  
                  {/* Transformed Ellipse (After transformation) */}
                  <polyline
                    points={transformPoints.map(p => `${p.tx},${-p.ty}`).join(' ')}
                    fill="none"
                    stroke="var(--primary)"
                    strokeWidth="0.12"
                  />

                  {/* Eigenvector rays */}
                  {analysis.isReal && analysis.eigen.map((e, i) => (
                    <line
                      key={i}
                      x1="0" y1="0"
                      x2={e.v[0] * e.l} y2={-e.v[1] * e.l}
                      stroke={i === 0 ? '#ef4444' : '#10b981'}
                      strokeWidth="0.16"
                      strokeLinecap="round"
                    />
                  ))}

                  {/* Basis vectors */}
                  <line x1="0" y1="0" x2="1" y2="0" stroke="#f59e0b" strokeWidth="0.1" opacity="0.6" />
                  <line x1="0" y1="0" x2="0" y2="-1" stroke="#06b6d4" strokeWidth="0.1" opacity="0.6" />
                </svg>
              </div>

              <div className="mt-6 p-4 rounded-2xl bg-card border shadow space-y-2">
                <div className="flex items-start gap-3">
                  <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-xs font-medium text-muted-foreground leading-relaxed">
                    The <span className="font-bold text-primary">solid ellipse</span> shows the image of the unit circle under Matrix A.
                    {analysis.isReal && analysis.eigen.length > 0 && (
                      <> The <span className="text-rose-500 font-bold">Red</span> and <span className="text-emerald-500 font-bold">Green</span> arrows indicate the real eigenvector scaling directions.</>
                    )}
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
