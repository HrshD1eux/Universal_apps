'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Box, Circle as CircleIcon, Square as SquareIcon, 
  Triangle as TriangleIcon, Database, Pipette,
  Maximize, Activity, Ruler, Layers, SwitchCamera,
  Info, Sparkles, Binary
} from 'lucide-react';
import { useLanguage } from '@/context/language-context';

type Shape2D = 'square' | 'circle' | 'triangle' | 'rectangle' | 'polygon';
type Shape3D = 'cube' | 'sphere' | 'cylinder' | 'cone' | 'torus' | 'ellipsoid';
type Shape = Shape2D | Shape3D;
type SolveMode = 'forward' | 'inverse';

export default function GeometrySuite() {
  const [activeShape, setActiveShape] = useState<Shape>('circle');
  const [solveMode, setSolveMode] = useState<SolveMode>('forward');
  const [values, setValues] = useState<Record<string, string>>({ 
    radius: '5', side: '4', length: '6', width: '4', height: '10', 
    sides: '6', majorRadius: '8', targetArea: '100', targetVolume: '500',
    x1: '0', y1: '0', x2: '40', y2: '0', x3: '20', y3: '35'
  });
  const { t } = useLanguage();

  const updateValue = (key: string, val: string) => {
    setValues(prev => ({ ...prev, [key]: val }));
  };

  const results = useMemo(() => {
    const v = Object.fromEntries(Object.entries(values).map(([k, val]) => [k, parseFloat(val) || 0]));
    const PI = Math.PI;

    if (solveMode === 'forward') {
      switch (activeShape) {
        case 'square':
          return { area: v.side ** 2, perimeter: v.side * 4, formula: 'A = s², P = 4s' };
        case 'circle':
          return { area: PI * (v.radius ** 2), perimeter: 2 * PI * v.radius, formula: 'A = πr², C = 2πr' };
        case 'triangle':
          if (v.x1 !== undefined && v.y1 !== undefined) {
            const area = Math.abs(v.x1*(v.y2-v.y3) + v.x2*(v.y3-v.y1) + v.x3*(v.y1-v.y2)) / 2;
            const a = Math.sqrt((v.x2-v.x3)**2 + (v.y2-v.y3)**2);
            const b = Math.sqrt((v.x1-v.x3)**2 + (v.y1-v.y3)**2);
            const c = Math.sqrt((v.x1-v.x2)**2 + (v.y1-v.y2)**2);
            const p = a + b + c;
            const centroid = { x: (v.x1+v.x2+v.x3)/3, y: (v.y1+v.y2+v.y3)/3 };
            const incentre = { x: (a*v.x1 + b*v.x2 + c*v.x3)/p, y: (a*v.y1 + b*v.y2 + c*v.y3)/p };
            
            const D = 2 * (v.x1 * (v.y2 - v.y3) + v.x2 * (v.y3 - v.y1) + v.x3 * (v.y1 - v.y2));
            const circumX = ((v.x1**2 + v.y1**2)*(v.y2 - v.y3) + (v.x2**2 + v.y2**2)*(v.y3 - v.y1) + (v.x3**2 + v.y3**2)*(v.y1 - v.y2)) / D;
            const circumY = ((v.x1**2 + v.y1**2)*(v.x3 - v.x2) + (v.x2**2 + v.y2**2)*(v.x1 - v.x3) + (v.x3**2 + v.y3**2)*(v.y2 - v.x1)) / D;

            return { area, perimeter: p, centroid, incentre, circumcentre: { x: circumX, y: circumY }, formula: 'A = ½|Σx(y-y)|' };
          }
          return { area: 0.5 * v.length * v.height, formula: 'A = ½bh' };
        case 'rectangle':
          return { area: v.length * v.width, perimeter: 2 * (v.length + v.width), formula: 'A = lw, P = 2(l+w)' };
        case 'polygon':
          const polyArea = (v.sides * v.side ** 2) / (4 * Math.tan(PI / v.sides));
          return { area: polyArea, perimeter: v.sides * v.side, formula: 'A = (ns²)/(4tan(π/n))' };
        case 'cube':
          return { volume: v.side ** 3, surfaceArea: 6 * (v.side ** 2), formula: 'V = s³, SA = 6s²' };
        case 'sphere':
          return { volume: (4/3) * PI * (v.radius ** 3), surfaceArea: 4 * PI * (v.radius ** 2), formula: 'V = 4/3πr³, SA = 4πr²' };
        case 'cylinder':
          return { volume: PI * (v.radius ** 2) * v.height, surfaceArea: 2 * PI * v.radius * (v.radius + v.height), formula: 'V = πr²h, SA = 2πrh + 2πr²' };
        case 'cone':
          const slantHeight = Math.sqrt(v.radius ** 2 + v.height ** 2);
          return { volume: (1/3) * PI * (v.radius ** 2) * v.height, surfaceArea: PI * v.radius * (v.radius + slantHeight), formula: 'V = 1/3πr²h, SA = πr(r+l)' };
        case 'torus':
          const torusVol = (PI * v.radius ** 2) * (2 * PI * v.majorRadius);
          const torusSA = (2 * PI * v.radius) * (2 * PI * v.majorRadius);
          return { volume: torusVol, surfaceArea: torusSA, formula: 'V = 2π²r²R, SA = 4π²rR' };
        case 'ellipsoid':
          const ellipVol = (4/3) * PI * v.length * v.width * v.height;
          // Approximate SA (Knud Thomsen's formula)
          const p = 1.6075;
          const ellipSA = 4 * PI * Math.pow((Math.pow(v.length * v.width, p) + Math.pow(v.length * v.height, p) + Math.pow(v.width * v.height, p)) / 3, 1/p);
          return { volume: ellipVol, surfaceArea: ellipSA, formula: 'V = 4/3πabc' };
        default: return {};
      }
    } else {
      // Inverse Mode: Solve for primary dimension given Area/Volume
      switch (activeShape) {
        case 'square':
          return { side: Math.sqrt(v.targetArea), formula: 's = √A' };
        case 'circle':
          return { radius: Math.sqrt(v.targetArea / PI), formula: 'r = √(A/π)' };
        case 'cube':
          return { side: Math.pow(v.targetVolume, 1/3), formula: 's = ∛V' };
        case 'sphere':
          return { radius: Math.pow(v.targetVolume / ((4/3) * PI), 1/3), formula: 'r = ∛(3V/4π)' };
        default:
          return { error: 'Inverse mode only supported for uniform shapes (Square, Circle, Cube, Sphere).' };
      }
    }
  }, [activeShape, values, solveMode]);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <Card className="border-none shadow-2xl bg-gradient-to-br from-background via-muted/50 to-background overflow-hidden">
        <CardHeader className="bg-primary/5 border-b border-primary/10 p-8">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex items-center gap-4">
                 <div className="p-4 bg-primary text-primary-foreground rounded-2xl shadow-lg shadow-primary/20">
                    <Maximize className="w-8 h-8" />
                 </div>
                 <div>
                    <CardTitle className="text-3xl font-black">{t('geometryTitle')}</CardTitle>
                    <CardDescription className="text-base font-bold text-primary/60">Advanced {solveMode === 'inverse' ? 'Inverse' : 'Visual'} Geometric Engine</CardDescription>
                 </div>
              </div>
              
              <div className="flex flex-wrap gap-2 p-1 bg-muted rounded-2xl border-2 max-w-2xl">
                 {(['circle', 'square', 'rectangle', 'triangle', 'polygon', 'sphere', 'cube', 'cylinder', 'cone', 'torus', 'ellipsoid'] as Shape[]).map(shape => (
                    <button
                      key={shape}
                      onClick={() => setActiveShape(shape)}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest ${activeShape === shape ? 'bg-background shadow-md text-primary scale-105' : 'text-muted-foreground hover:text-primary'}`}
                    >
                      {shape}
                    </button>
                 ))}
              </div>
           </div>
        </CardHeader>

        <CardContent className="p-8">
           <div className="grid grid-cols-1 lg:grid-cols-[1.5fr,1fr] gap-12">
              {/* Visualizer Area */}
              <div className="bg-muted/30 rounded-[3rem] border-2 shadow-inner p-12 flex flex-col items-center justify-center min-h-[450px] relative overflow-hidden group">
                 <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-50" />
                 
                 <div className="absolute top-8 left-8 flex flex-col gap-2 z-20">
                    <div className="flex items-center gap-2">
                       <Activity className="w-4 h-4 text-primary animate-pulse" />
                       <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">Analytical Model</span>
                    </div>
                    {results.formula && (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-primary/10 border border-primary/20 px-3 py-1 rounded-full text-[10px] font-black text-primary"
                      >
                        {results.formula}
                      </motion.div>
                    )}
                 </div>

                 <motion.div
                    key={activeShape}
                    initial={{ scale: 0.8, opacity: 0, rotateY: 45 }}
                    animate={{ scale: 1, opacity: 1, rotateY: 0 }}
                    transition={{ type: 'spring', stiffness: 100 }}
                    className="relative z-10"
                 >
                    {activeShape === 'circle' && (
                      <svg width="240" height="240" viewBox="0 0 100 100" className="text-primary">
                        <circle cx="50" cy="50" r="40" fill="currentColor" fillOpacity={0.1} stroke="currentColor" strokeWidth="2" />
                        <line x1="50" y1="50" x2="90" y2="50" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" />
                        <text x="70" y="45" fontSize="5" fontWeight="bold" fill="currentColor">r</text>
                      </svg>
                    )}
                    {activeShape === 'square' && (
                      <svg width="240" height="240" viewBox="0 0 100 100" className="text-primary">
                        <rect x="20" y="20" width="60" height="60" fill="currentColor" fillOpacity={0.1} stroke="currentColor" strokeWidth="2" rx="4" />
                        <text x="50" y="88" fontSize="5" fontWeight="bold" fill="currentColor" textAnchor="middle">side</text>
                      </svg>
                    )}
                    {activeShape === 'rectangle' && (
                      <svg width="240" height="160" viewBox="0 0 100 60" className="text-primary">
                        <rect x="10" y="10" width="80" height="40" fill="currentColor" fillOpacity={0.1} stroke="currentColor" strokeWidth="2" rx="4" />
                        <text x="50" y="58" fontSize="5" fontWeight="bold" fill="currentColor" textAnchor="middle">l</text>
                        <text x="5" y="30" fontSize="5" fontWeight="bold" fill="currentColor" transform="rotate(-90 5,30)" textAnchor="middle">w</text>
                      </svg>
                    )}
                    {activeShape === 'triangle' && (
                      <svg width="240" height="240" viewBox="-10 -10 120 120" className="text-primary">
                        {values.x1 !== undefined ? (
                          <>
                            <path d={`M ${values.x1} ${100-parseFloat(values.y1)} L ${values.x2} ${100-parseFloat(values.y2)} L ${values.x3} ${100-parseFloat(values.y3)} Z`} fill="currentColor" fillOpacity={0.1} stroke="currentColor" strokeWidth="2" />
                            {results.centroid && <circle cx={results.centroid.x} cy={100-results.centroid.y} r="2" fill="#f43f5e" />}
                            {results.incentre && <circle cx={results.incentre.x} cy={100-results.incentre.y} r="2" fill="#3b82f6" />}
                            {results.circumcentre && <circle cx={results.circumcentre.x} cy={100-results.circumcentre.y} r="2" fill="#10b981" />}
                          </>
                        ) : (
                          <>
                            <path d="M10 70 L90 70 L50 10 Z" fill="currentColor" fillOpacity={0.1} stroke="currentColor" strokeWidth="2" />
                            <line x1="50" y1="10" x2="50" y2="70" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" />
                          </>
                        )}
                      </svg>
                    )}
                    {activeShape === 'polygon' && (
                      <svg width="240" height="240" viewBox="0 0 100 100" className="text-primary">
                        <path 
                           d={(() => {
                              const sides = parseInt(values.sides) || 3;
                              const points = [];
                              for (let i = 0; i < sides; i++) {
                                 const angle = (i / sides) * 2 * Math.PI - Math.PI / 2;
                                 points.push(`${50 + 40 * Math.cos(angle)},${50 + 40 * Math.sin(angle)}`);
                              }
                              return `M ${points.join(' L ')} Z`;
                           })()}
                           fill="currentColor" fillOpacity={0.1} stroke="currentColor" strokeWidth="2" 
                        />
                        <text x="50" y="95" fontSize="5" fontWeight="bold" fill="currentColor" textAnchor="middle">{values.sides} sides</text>
                      </svg>
                    )}
                    {activeShape === 'cube' && (
                       <svg width="240" height="240" viewBox="0 0 100 100" className="text-primary">
                          <rect x="20" y="35" width="45" height="45" fill="none" stroke="currentColor" strokeWidth="2" />
                          <rect x="35" y="20" width="45" height="45" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.4" />
                          <line x1="20" y1="35" x2="35" y2="20" stroke="currentColor" strokeWidth="1" />
                          <line x1="65" y1="35" x2="80" y2="20" stroke="currentColor" strokeWidth="1" />
                          <line x1="20" y1="80" x2="35" y2="65" stroke="currentColor" strokeWidth="1" />
                          <line x1="65" y1="80" x2="80" y2="65" stroke="currentColor" strokeWidth="1" />
                       </svg>
                    )}
                    {activeShape === 'sphere' && (
                       <svg width="240" height="240" viewBox="0 0 100 100" className="text-primary">
                          <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="2" />
                          <ellipse cx="50" cy="50" rx="40" ry="12" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.3" />
                          <line x1="50" y1="50" x2="90" y2="50" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" />
                       </svg>
                    )}
                    {activeShape === 'cylinder' && (
                       <svg width="200" height="240" viewBox="0 0 80 100" className="text-primary">
                          <ellipse cx="40" cy="15" rx="30" ry="8" fill="none" stroke="currentColor" strokeWidth="2" />
                          <ellipse cx="40" cy="85" rx="30" ry="8" fill="none" stroke="currentColor" strokeWidth="2" />
                          <line x1="10" y1="15" x2="10" y2="85" stroke="currentColor" strokeWidth="2" />
                          <line x1="70" y1="15" x2="70" y2="85" stroke="currentColor" strokeWidth="2" />
                       </svg>
                    )}
                    {activeShape === 'cone' && (
                       <svg width="200" height="240" viewBox="0 0 80 100" className="text-primary">
                          <ellipse cx="40" cy="85" rx="30" ry="8" fill="none" stroke="currentColor" strokeWidth="2" />
                          <line x1="40" y1="10" x2="10" y2="85" stroke="currentColor" strokeWidth="2" />
                          <line x1="40" y1="10" x2="70" y2="85" stroke="currentColor" strokeWidth="2" />
                          <line x1="40" y1="10" x2="40" y2="85" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" opacity="0.5" />
                       </svg>
                    )}
                    {activeShape === 'torus' && (
                       <svg width="240" height="240" viewBox="0 0 100 100" className="text-primary">
                          <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="2" />
                          <circle cx="50" cy="50" r="20" fill="none" stroke="currentColor" strokeWidth="1.5" />
                          <ellipse cx="50" cy="50" rx="40" ry="15" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.3" />
                       </svg>
                    )}
                    {activeShape === 'ellipsoid' && (
                       <svg width="240" height="240" viewBox="0 0 100 100" className="text-primary">
                          <ellipse cx="50" cy="50" rx="45" ry="30" fill="currentColor" fillOpacity={0.1} stroke="currentColor" strokeWidth="2" />
                          <ellipse cx="50" cy="50" rx="45" ry="10" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.3" />
                          <ellipse cx="50" cy="50" rx="15" ry="30" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.3" />
                       </svg>
                    )}
                 </motion.div>
              </div>

              {/* Controls Area */}
              <div className="space-y-8">
                 <div className="flex p-1 bg-muted rounded-2xl border-2">
                    <button 
                       onClick={() => setSolveMode('forward')}
                       className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black transition-all ${solveMode === 'forward' ? 'bg-background shadow-md text-primary' : 'text-muted-foreground'}`}
                    >
                       <Ruler className="w-4 h-4" /> CALCULATE
                    </button>
                    <button 
                       onClick={() => setSolveMode('inverse')}
                       className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black transition-all ${solveMode === 'inverse' ? 'bg-background shadow-md text-primary' : 'text-muted-foreground'}`}
                    >
                       <SwitchCamera className="w-4 h-4" /> SOLVE FOR
                    </button>
                 </div>

                 <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Dimensions</h3>
                    <div className="grid grid-cols-1 gap-4">
                       {solveMode === 'forward' ? (
                          <>
                             {activeShape === 'polygon' && (
                                <div className="space-y-2">
                                   <label className="text-[10px] font-bold opacity-50 ml-1">Number of Sides</label>
                                   <Input type="number" value={values.sides} onChange={(e) => updateValue('sides', e.target.value)} className="h-14 rounded-2xl border-2 text-xl font-bold focus:ring-primary" />
                                </div>
                             )}
                             {(['circle', 'sphere', 'cylinder', 'cone', 'torus']).includes(activeShape) && (
                                <div className="space-y-2">
                                   <label className="text-[10px] font-bold opacity-50 ml-1">Minor Radius (r)</label>
                                   <Input type="number" value={values.radius} onChange={(e) => updateValue('radius', e.target.value)} className="h-14 rounded-2xl border-2 text-xl font-bold focus:ring-primary" />
                                </div>
                             )}
                             {activeShape === 'torus' && (
                                <div className="space-y-2">
                                   <label className="text-[10px] font-bold opacity-50 ml-1">Major Radius (R)</label>
                                   <Input type="number" value={values.majorRadius} onChange={(e) => updateValue('majorRadius', e.target.value)} className="h-14 rounded-2xl border-2 text-xl font-bold focus:ring-primary" />
                                </div>
                             )}
                             {(['square', 'cube', 'polygon']).includes(activeShape) && (
                                <div className="space-y-2">
                                   <label className="text-[10px] font-bold opacity-50 ml-1">Side Length (s)</label>
                                   <Input type="number" value={values.side} onChange={(e) => updateValue('side', e.target.value)} className="h-14 rounded-2xl border-2 text-xl font-bold focus:ring-primary" />
                                </div>
                             )}
                             {activeShape === 'triangle' && (
                                <div className="grid grid-cols-2 gap-4">
                                   {['x1', 'y1', 'x2', 'y2', 'x3', 'y3'].map(coord => (
                                      <div key={coord} className="space-y-1">
                                         <label className="text-[10px] font-bold opacity-50 ml-1 uppercase">{coord}</label>
                                         <Input value={values[coord]} onChange={(e) => updateValue(coord, e.target.value)} className="h-10 rounded-xl border-2 font-black" />
                                      </div>
                                   ))}
                                </div>
                             )}
                             {(['rectangle', 'ellipsoid']).includes(activeShape) && (
                                <div className="space-y-2">
                                   <label className="text-[10px] font-bold opacity-50 ml-1">Length / Axis A</label>
                                   <Input type="number" value={values.length} onChange={(e) => updateValue('length', e.target.value)} className="h-14 rounded-2xl border-2 text-xl font-bold focus:ring-primary" />
                                </div>
                             )}
                             {(['rectangle', 'ellipsoid']).includes(activeShape) && (
                                <div className="space-y-2">
                                   <label className="text-[10px] font-bold opacity-50 ml-1">Width / Axis B</label>
                                   <Input type="number" value={values.width} onChange={(e) => updateValue('width', e.target.value)} className="h-14 rounded-2xl border-2 text-xl font-bold focus:ring-primary" />
                                </div>
                             )}
                             {(['triangle', 'cylinder', 'cone', 'ellipsoid']).includes(activeShape) && (
                                <div className="space-y-2">
                                   <label className="text-[10px] font-bold opacity-50 ml-1">Height / Axis C</label>
                                   <Input type="number" value={values.height} onChange={(e) => updateValue('height', e.target.value)} className="h-14 rounded-2xl border-2 text-xl font-bold focus:ring-primary" />
                                </div>
                             )}
                          </>
                       ) : (
                          <div className="space-y-4">
                             {activeShape.includes('sphere') || activeShape.includes('cube') || activeShape.includes('cylinder') || activeShape.includes('cone') || activeShape.includes('torus') || activeShape.includes('ellipsoid') ? (
                                <div className="space-y-2">
                                   <label className="text-[10px] font-bold opacity-50 ml-1">Target Volume (V)</label>
                                   <Input type="number" value={values.targetVolume} onChange={(e) => updateValue('targetVolume', e.target.value)} className="h-14 rounded-2xl border-2 text-xl font-bold focus:ring-primary" />
                                </div>
                             ) : (
                                <div className="space-y-2">
                                   <label className="text-[10px] font-bold opacity-50 ml-1">Target Area (A)</label>
                                   <Input type="number" value={values.targetArea} onChange={(e) => updateValue('targetArea', e.target.value)} className="h-14 rounded-2xl border-2 text-xl font-bold focus:ring-primary" />
                                </div>
                             )}
                             <p className="text-[10px] text-muted-foreground font-medium italic">*Solving for primary dimension (Radius or Side) assuming uniformity.</p>
                          </div>
                       )}
                    </div>
                 </div>

                 {/* Results Area */}
                 <div className="space-y-6 pt-6 border-t">
                    <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Analytical Results</h3>
                    <div className="grid grid-cols-1 gap-4">
                       <AnimatePresence mode="wait">
                          {results.error ? (
                             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 rounded-[2rem] bg-rose-500/5 border-2 border-rose-500/20 text-rose-600 text-xs font-bold leading-relaxed">
                                <Info className="w-4 h-4 mb-2" />
                                {results.error}
                             </motion.div>
                          ) : (
                             <motion.div key={solveMode + activeShape} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                                {results.area !== undefined && (
                                   <div className="p-6 rounded-[2rem] bg-primary/10 border-2 border-primary/20">
                                      <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Surface Area</p>
                                      <p className="text-3xl font-black text-primary">{results.area.toLocaleString(undefined, { maximumFractionDigits: 4 })} <span className="text-sm font-bold opacity-40">sq units</span></p>
                                   </div>
                                )}
                                {results.volume !== undefined && (
                                   <div className="p-6 rounded-[2rem] bg-primary text-primary-foreground shadow-xl shadow-primary/20">
                                      <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Volume</p>
                                      <p className="text-4xl font-black">{results.volume.toLocaleString(undefined, { maximumFractionDigits: 4 })} <span className="text-sm font-bold opacity-60">cubic units</span></p>
                                   </div>
                                )}
                                {results.surfaceArea !== undefined && (
                                   <div className="p-6 rounded-[2rem] bg-primary/10 border-2 border-primary/20">
                                      <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Total Surface Area</p>
                                      <p className="text-3xl font-black text-primary">{results.surfaceArea.toLocaleString(undefined, { maximumFractionDigits: 4 })} <span className="text-sm font-bold opacity-40">sq units</span></p>
                                   </div>
                                )}
                                {results.side !== undefined && (
                                   <div className="p-8 rounded-[3rem] bg-primary text-primary-foreground shadow-2xl">
                                      <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Required Side Length</p>
                                      <p className="text-5xl font-black">{results.side.toLocaleString(undefined, { maximumFractionDigits: 4 })}</p>
                                   </div>
                                )}
                                {results.radius !== undefined && (
                                   <div className="p-8 rounded-[3rem] bg-primary text-primary-foreground shadow-2xl">
                                      <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Required Radius</p>
                                      <p className="text-5xl font-black">{results.radius.toLocaleString(undefined, { maximumFractionDigits: 4 })}</p>
                                   </div>
                                )}
                                {results.perimeter !== undefined && (
                                   <div className="p-6 rounded-[2rem] bg-muted/50 border-2">
                                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Perimeter / Circumference</p>
                                      <p className="text-2xl font-black">{typeof results.perimeter === 'number' ? results.perimeter.toLocaleString(undefined, { maximumFractionDigits: 4 }) : results.perimeter}</p>
                                   </div>
                                )}
                                {results.centroid && (
                                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                                      <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                                         <p className="text-[8px] font-black uppercase text-rose-600 mb-1">Centroid (Red)</p>
                                         <p className="text-sm font-black text-rose-700">({results.centroid.x.toFixed(1)}, {results.centroid.y.toFixed(1)})</p>
                                      </div>
                                      <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                                         <p className="text-[8px] font-black uppercase text-blue-600 mb-1">Incentre (Blue)</p>
                                         <p className="text-sm font-black text-blue-700">({results.incentre.x.toFixed(1)}, {results.incentre.y.toFixed(1)})</p>
                                      </div>
                                      <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                                         <p className="text-[8px] font-black uppercase text-emerald-600 mb-1">Circumcentre (Green)</p>
                                         <p className="text-sm font-black text-emerald-700">({results.circumcentre.x.toFixed(1)}, {results.circumcentre.y.toFixed(1)})</p>
                                      </div>
                                   </div>
                                )}
                             </motion.div>
                          )}
                       </AnimatePresence>
                    </div>
                 </div>

                 <div className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex items-start gap-4">
                    <Sparkles className="w-5 h-5 text-amber-600 shrink-0" />
                    <p className="text-[10px] font-bold text-amber-700/80 leading-relaxed uppercase tracking-wider">
                       Pro geometry utilizes high-precision float operations and standard Euclidean manifolds.
                    </p>
                 </div>
              </div>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
