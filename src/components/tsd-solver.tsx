'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, Clock, MoveHorizontal, Ship, LayoutGrid, Info, 
  Settings, RotateCcw, Play, Plus, Trash2, TrainFront, Waypoints
} from 'lucide-react';
import { useLanguage } from '@/context/language-context';

type TSDMode = 'relative' | 'boats' | 'trains' | 'projectile';

export default function TSDSolver() {
  const [activeTab, setActiveTab] = useState<TSDMode>('relative');
  const [v1, setV1] = useState('60');
  const [v2, setV2] = useState('40');
  const [direction, setDirection] = useState<'same' | 'opposite'>('opposite');
  const [boatSpeed, setBoatSpeed] = useState('15');
  const [streamSpeed, setStreamSpeed] = useState('5');
  const [trainLen, setTrainLen] = useState('200');
  const [platformLen, setPlatformLen] = useState('400');
  const [trainSpeed, setTrainSpeed] = useState('72');
  const [projSpeed, setProjSpeed] = useState('20');
  const [projAngle, setProjAngle] = useState('45');
  
  const { t } = useLanguage();

  const results = useMemo(() => {
    // Relative Speed
    const sp1 = parseFloat(v1) || 0;
    const sp2 = parseFloat(v2) || 0;
    const relSpeed = direction === 'same' ? Math.abs(sp1 - sp2) : sp1 + sp2;

    // Boats
    const b = parseFloat(boatSpeed) || 0;
    const s = parseFloat(streamSpeed) || 0;
    const downstream = b + s;
    const upstream = b - s;

    // Trains (Time to cross platform)
    const l1 = parseFloat(trainLen) || 0;
    const l2 = parseFloat(platformLen) || 0;
    const vs = (parseFloat(trainSpeed) || 0) * (5/18); // km/h to m/s
    const timeToCross = vs > 0 ? (l1 + l2) / vs : 0;

    // Projectile Motion
    const u = parseFloat(projSpeed) || 0;
    const theta = (parseFloat(projAngle) || 0) * Math.PI / 180;
    const g = 9.80665;
    
    const timeOfFlight = (2 * u * Math.sin(theta)) / g;
    const maxHeight = (Math.pow(u * Math.sin(theta), 2)) / (2 * g);
    const range = (Math.pow(u, 2) * Math.sin(2 * theta)) / g;
    const vx = u * Math.cos(theta);
    const vy = u * Math.sin(theta);

    return { relSpeed, downstream, upstream, timeToCross, timeOfFlight, maxHeight, range, vx, vy };
  }, [v1, v2, direction, boatSpeed, streamSpeed, trainLen, platformLen, trainSpeed, projSpeed, projAngle]);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <Card className="border-none shadow-2xl bg-gradient-to-br from-background via-muted/50 to-background overflow-hidden font-sans">
        <CardHeader className="bg-primary/5 border-b border-primary/10 p-8">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex items-center gap-4">
                 <div className="p-4 bg-primary text-white rounded-2xl shadow-lg shadow-primary/20">
                    <Waypoints className="w-8 h-8" />
                 </div>
                 <div>
                    <CardTitle className="text-3xl font-black tracking-tight uppercase">{t('tsdSolverTitle' as any)}</CardTitle>
                    <CardDescription className="text-base font-bold text-primary/60">{t('tsdSolverDesc' as any)}</CardDescription>
                 </div>
              </div>
              
              <div className="flex p-1 bg-muted rounded-2xl border-2 overflow-x-auto scrollbar-hide max-w-full">
                 {[
                   { id: 'relative', label: 'RELATIVE SPEED' },
                   { id: 'boats', label: 'BOATS & STREAMS' },
                   { id: 'trains', label: 'TRAIN LOGIC' },
                   { id: 'projectile', label: 'PROJECTILE' }
                 ].map(tab => (
                   <button
                     key={tab.id}
                     onClick={() => setActiveTab(tab.id as any)}
                     className={`px-6 py-2.5 rounded-xl text-[10px] font-black transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-background shadow-lg text-primary scale-105' : 'text-muted-foreground hover:text-primary'}`}
                   >
                     {tab.label}
                   </button>
                 ))}
              </div>
           </div>
        </CardHeader>

        <CardContent className="p-8">
           <div className="grid grid-cols-1 lg:grid-cols-[1fr,1.3fr] gap-12">
              <AnimatePresence mode="wait">
                 {activeTab === 'relative' && (
                    <motion.div key="relative" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-8">
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Obj 1 Speed (km/h)</label>
                             <Input type="number" value={v1} onChange={(e) => setV1(e.target.value)} className="h-12 rounded-xl border-2 font-black" />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Obj 2 Speed (km/h)</label>
                             <Input type="number" value={v2} onChange={(e) => setV2(e.target.value)} className="h-12 rounded-xl border-2 font-black" />
                          </div>
                       </div>
                       
                       <div className="flex p-1 bg-muted rounded-2xl border-2">
                          <button onClick={() => setDirection('opposite')} className={`flex-1 py-2 rounded-xl text-[10px] font-black transition-all ${direction === 'opposite' ? 'bg-primary text-white shadow-lg' : 'text-muted-foreground'}`}>OPPOSITE DIR (+)</button>
                          <button onClick={() => setDirection('same')} className={`flex-1 py-2 rounded-xl text-[10px] font-black transition-all ${direction === 'same' ? 'bg-primary text-white shadow-lg' : 'text-muted-foreground'}`}>SAME DIR (-)</button>
                       </div>

                       <div className="p-10 rounded-[3rem] bg-primary text-white shadow-2xl relative overflow-hidden group">
                          <Zap className="absolute top-0 right-0 p-8 w-40 h-40 opacity-10 group-hover:scale-110 transition-transform" />
                          <div className="relative z-10">
                             <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Net Relative Speed</p>
                             <p className="text-6xl font-black">{results.relSpeed.toFixed(1)} <span className="text-xl opacity-60 font-medium tracking-normal">km/h</span></p>
                             <div className="mt-8 flex gap-4 text-[10px] font-bold uppercase opacity-60 border-t border-white/10 pt-8">
                                <span>{(results.relSpeed * 5/18).toFixed(2)} m/s</span>
                                <span>•</span>
                                <span>{direction === 'opposite' ? 'Cumulative Force' : 'Catch-up Velocity'}</span>
                             </div>
                          </div>
                       </div>
                    </motion.div>
                 )}

                 {activeTab === 'boats' && (
                    <motion.div key="boats" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-8">
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Boat in Still Water (km/h)</label>
                             <Input type="number" value={boatSpeed} onChange={(e) => setBoatSpeed(e.target.value)} className="h-12 rounded-xl border-2 font-black" />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Stream Velocity (km/h)</label>
                             <Input type="number" value={streamSpeed} onChange={(e) => setStreamSpeed(e.target.value)} className="h-12 rounded-xl border-2 font-black" />
                          </div>
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-8 rounded-[2.5rem] bg-indigo-600 text-white shadow-xl space-y-4">
                             <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Downstream (B+S)</p>
                             <p className="text-4xl font-black">{results.downstream.toFixed(1)} <span className="text-sm opacity-60 font-medium tracking-normal">km/h</span></p>
                          </div>
                          <div className="p-8 rounded-[2.5rem] bg-rose-600 text-white shadow-xl space-y-4">
                             <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Upstream (B-S)</p>
                             <p className="text-4xl font-black">{results.upstream.toFixed(1)} <span className="text-sm opacity-60 font-medium tracking-normal">km/h</span></p>
                          </div>
                       </div>

                       <div className="p-8 rounded-[2.5rem] bg-muted/50 border-2 border-dashed flex items-center gap-4">
                          <Ship className="w-8 h-8 text-primary opacity-20" />
                          <p className="text-xs font-bold text-muted-foreground uppercase leading-relaxed tracking-tighter">
                             Exam Tip: Still Water Speed = (Down + Up) / 2 | Stream Speed = (Down - Up) / 2
                          </p>
                       </div>
                    </motion.div>
                 )}

                 {activeTab === 'trains' && (
                    <motion.div key="trains" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-8">
                       <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Train Length (m)</label>
                                <Input type="number" value={trainLen} onChange={(e) => setTrainLen(e.target.value)} className="h-12 rounded-xl border-2 font-black" />
                             </div>
                             <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Platform/Obj Length (m)</label>
                                <Input type="number" value={platformLen} onChange={(e) => setPlatformLen(e.target.value)} className="h-12 rounded-xl border-2 font-black" />
                             </div>
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Train Speed (km/h)</label>
                             <Input type="number" value={trainSpeed} onChange={(e) => setTrainSpeed(e.target.value)} className="h-20 rounded-[2rem] border-2 font-black text-3xl focus:ring-primary pl-8" />
                          </div>
                       </div>

                       <div className="p-10 rounded-[3rem] bg-card border-2 shadow-2xl relative overflow-hidden group">
                          <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform">
                             <TrainFront className="w-40 h-40" />
                          </div>
                          <div className="relative z-10 space-y-4 text-center">
                             <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Time to Complete Cross</p>
                             <p className="text-6xl font-black text-primary">{results.timeToCross.toFixed(2)} <span className="text-xl font-medium tracking-normal text-muted-foreground uppercase">Seconds</span></p>
                             <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pt-4 border-t border-dashed border-primary/20">Formula: T = (L1 + L2) / (Speed × 5/18)</p>
                          </div>
                       </div>
                    </motion.div>
                 )}

                 {activeTab === 'projectile' && (
                    <motion.div key="projectile" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-8">
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Initial Speed (m/s)</label>
                             <Input type="number" value={projSpeed} onChange={(e) => setProjSpeed(e.target.value)} className="h-12 rounded-xl border-2 font-black" />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Launch Angle (deg)</label>
                             <Input type="number" value={projAngle} onChange={(e) => setProjAngle(e.target.value)} className="h-12 rounded-xl border-2 font-black" />
                          </div>
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="p-6 rounded-3xl bg-indigo-500/10 border-2 border-indigo-500/20 text-center">
                             <p className="text-[8px] font-black uppercase text-indigo-600 mb-1">Max Height</p>
                             <p className="text-2xl font-black text-indigo-700">{results.maxHeight.toFixed(2)} m</p>
                          </div>
                          <div className="p-6 rounded-3xl bg-emerald-500/10 border-2 border-emerald-500/20 text-center">
                             <p className="text-[8px] font-black uppercase text-emerald-600 mb-1">Range</p>
                             <p className="text-2xl font-black text-emerald-700">{results.range.toFixed(2)} m</p>
                          </div>
                          <div className="p-6 rounded-3xl bg-amber-500/10 border-2 border-amber-500/20 text-center">
                             <p className="text-[8px] font-black uppercase text-amber-600 mb-1">Flight Time</p>
                             <p className="text-2xl font-black text-amber-700">{results.timeOfFlight.toFixed(2)} s</p>
                          </div>
                       </div>

                       <div className="p-10 rounded-[3rem] bg-slate-900 text-white shadow-2xl relative overflow-hidden group">
                          <div className="relative z-10 flex justify-between items-center">
                             <div>
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">Velocity Components</p>
                                <div className="space-y-1">
                                   <p className="text-lg font-black text-primary">Vx: {results.vx.toFixed(2)} m/s</p>
                                   <p className="text-lg font-black text-primary">Vy: {results.vy.toFixed(2)} m/s</p>
                                </div>
                             </div>
                             <div className="text-right">
                                <Zap className="w-12 h-12 text-primary opacity-20" />
                                <p className="text-[8px] font-bold opacity-40 mt-2">G = 9.81 m/s²</p>
                             </div>
                          </div>
                       </div>
                    </motion.div>
                 )}
              </AnimatePresence>

              <div className="bg-muted/30 rounded-[3rem] border-2 shadow-inner p-10 flex flex-col items-center justify-center text-center space-y-12 h-[500px] relative overflow-hidden">
                 <div className="absolute inset-0 p-20 opacity-5 -z-10 rotate-12 scale-150">
                    <Waypoints className="w-full h-full" />
                 </div>
                 <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                    <Clock className="w-12 h-12 text-primary" />
                 </div>
                 <div className="max-w-sm">
                    <h3 className="text-2xl font-black mb-4 uppercase tracking-tighter italic">Relativity Engine</h3>
                    <p className="text-sm font-bold text-muted-foreground leading-relaxed uppercase tracking-tighter">
                       Our TSD engine handles all units automatically, converting between km/h and m/s to provide exam-ready precision for B.Tech and Diploma entrance modules.
                    </p>
                 </div>
                 <div className="flex gap-4">
                    <div className="px-6 py-2 rounded-full bg-card border-2 text-[10px] font-black uppercase tracking-widest shadow-sm">SPEED READY</div>
                    <div className="px-6 py-2 rounded-full bg-card border-2 text-[10px] font-black uppercase tracking-widest shadow-sm">EXAM LOGIC</div>
                 </div>
              </div>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
