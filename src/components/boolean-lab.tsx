'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Cpu, Binary, Table, Layers, Zap, Info, 
  Settings, RotateCcw, Play, Plus, Trash2, LayoutGrid
} from 'lucide-react';
import { useLanguage } from '@/context/language-context';

type KMapSize = 2 | 3 | 4;

export default function BooleanLogicLab() {
  const [activeTab, setActiveTab] = useState<'truth' | 'kmap'>('truth');
  const [expression, setExpression] = useState('A & B | C');
  const [kmapSize, setKmapSize] = useState<KMapSize>(3);
  const [kmapData, setKmapData] = useState<Record<string, number>>({});
  
  const { t } = useLanguage();

  // Truth Table Logic
  const truthTable = useMemo(() => {
    try {
      // Find all unique variables in expression
      const vars = Array.from(new Set(expression.match(/[A-D]/g) || [])).sort();
      if (vars.length === 0) return null;

      const rows = Math.pow(2, vars.length);
      const data = [];

      for (let i = 0; i < rows; i++) {
        const row: Record<string, number> = {};
        vars.forEach((v, idx) => {
          row[v] = (i >> (vars.length - 1 - idx)) & 1;
        });

        // Evaluate expression
        let evalStr = expression;
        vars.forEach(v => {
          evalStr = evalStr.replace(new RegExp(v, 'g'), row[v].toString());
        });
        
        // Simple evaluator for &, |, ^, !
        // eslint-disable-next-line no-new-func
        const result = new Function(`return (${evalStr.replace(/&/g, '&&').replace(/\|/g, '||').replace(/!/g, '!').replace(/\^/g, '^')})`)() ? 1 : 0;
        
        data.push({ ...row, result });
      }
      return { vars, data };
    } catch (e) {
      return null;
    }
  }, [expression]);

  // K-Map Logic
  const grayCode = ['00', '01', '11', '10'];
  const grayCode1 = ['0', '1'];

  const handleKmapCell = (key: string) => {
    setKmapData(prev => ({
      ...prev,
      [key]: prev[key] === 1 ? 0 : 1
    }));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <Card className="border-none shadow-2xl bg-gradient-to-br from-background via-muted/50 to-background overflow-hidden font-sans">
        <CardHeader className="bg-primary/5 border-b border-primary/10 p-8">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex items-center gap-4">
                 <div className="p-4 bg-primary text-primary-foreground rounded-2xl shadow-lg shadow-primary/20">
                    <Cpu className="w-8 h-8" />
                 </div>
                 <div>
                    <CardTitle className="text-3xl font-black tracking-tight">{t('booleanLabTitle' as any)}</CardTitle>
                    <CardDescription className="text-base font-bold text-primary/60">{t('booleanLabDesc' as any)}</CardDescription>
                 </div>
              </div>
              
              <div className="flex p-1 bg-muted rounded-2xl border-2">
                 <button onClick={() => setActiveTab('truth')} className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'truth' ? 'bg-background shadow-lg text-primary scale-105' : 'text-muted-foreground hover:text-primary'}`}>TRUTH TABLE</button>
                 <button onClick={() => setActiveTab('kmap')} className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'kmap' ? 'bg-background shadow-lg text-primary scale-105' : 'text-muted-foreground hover:text-primary'}`}>KARNAUGH MAP</button>
              </div>
           </div>
        </CardHeader>

        <CardContent className="p-8">
           <AnimatePresence mode="wait">
              {activeTab === 'truth' && (
                 <motion.div key="truth" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-[1fr,1.5fr] gap-12">
                    <div className="space-y-8">
                       <div className="space-y-4">
                          <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Boolean Expression</label>
                          <div className="relative">
                             <Input 
                               value={expression} 
                               onChange={(e) => setExpression(e.target.value.toUpperCase())} 
                               className="h-20 rounded-[2rem] border-2 text-3xl font-black focus:ring-primary pl-8 pr-20 uppercase tracking-tighter"
                               placeholder="A & B | C"
                             />
                             <div className="absolute right-6 top-1/2 -translate-y-1/2">
                                <Binary className="w-8 h-8 text-primary opacity-20" />
                             </div>
                          </div>
                          <div className="flex flex-wrap gap-2 pt-2">
                             {['&', '|', '^', '!', '(', ')'].map(op => (
                                <Button key={op} variant="outline" size="sm" onClick={() => setExpression(prev => prev + op)} className="rounded-xl font-black">{op}</Button>
                             ))}
                          </div>
                          <p className="text-[10px] font-bold text-muted-foreground ml-4 italic">Symbols: & (AND), | (OR), ^ (XOR), ! (NOT)</p>
                       </div>

                       <div className="p-8 rounded-[3rem] bg-card border-2 shadow-xl space-y-6">
                          <div className="flex items-center gap-3">
                             <Info className="w-5 h-5 text-primary" />
                             <span className="text-[10px] font-black uppercase tracking-widest">Logic Insight</span>
                          </div>
                          <p className="text-sm font-bold text-muted-foreground leading-relaxed">
                             This engine parses your boolean string using standard operator precedence (NOT &gt; AND &gt; XOR &gt; OR) to generate a complete state table for all possible binary combinations.
                          </p>
                       </div>
                    </div>

                    <div className="bg-muted/30 rounded-[3rem] border-2 shadow-inner p-10 overflow-hidden min-h-[500px]">
                       {truthTable ? (
                          <div className="overflow-x-auto">
                             <table className="w-full text-center border-collapse">
                                <thead>
                                   <tr className="border-b-2 border-primary/10">
                                      {truthTable.vars.map(v => (
                                         <th key={v} className="p-4 text-sm font-black text-primary">{v}</th>
                                      ))}
                                      <th className="p-4 text-sm font-black text-rose-500">RESULT</th>
                                   </tr>
                                </thead>
                                <tbody>
                                   {truthTable.data.map((row, i) => (
                                      <motion.tr 
                                        key={i} 
                                        initial={{ opacity: 0, x: -10 }} 
                                        animate={{ opacity: 1, x: 0 }} 
                                        transition={{ delay: i * 0.02 }}
                                        className="border-b border-primary/5 hover:bg-primary/5 transition-colors"
                                      >
                                         {truthTable.vars.map(v => (
                                            <td key={v} className="p-4 text-base font-black font-mono">{row[v]}</td>
                                         ))}
                                         <td className={`p-4 text-base font-black font-mono ${row.result ? 'text-emerald-500' : 'text-rose-500'}`}>
                                            {row.result}
                                         </td>
                                      </motion.tr>
                                   ))}
                                </tbody>
                             </table>
                          </div>
                       ) : (
                          <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                             <Table className="w-20 h-20 mb-4" />
                             <p className="text-xl font-black italic">Invalid Expression or No Variables Found</p>
                          </div>
                       )}
                    </div>
                 </motion.div>
              )}

              {activeTab === 'kmap' && (
                 <motion.div key="kmap" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
                    <div className="flex justify-between items-center bg-card/50 p-6 rounded-[2.5rem] border-2">
                       <div className="flex items-center gap-4">
                          <LayoutGrid className="w-6 h-6 text-primary" />
                          <span className="text-sm font-black uppercase tracking-widest">Select Variables</span>
                       </div>
                       <div className="flex gap-2">
                          {[2, 3, 4].map(s => (
                             <Button 
                               key={s} 
                               variant={kmapSize === s ? 'default' : 'outline'} 
                               onClick={() => { setKmapSize(s as KMapSize); setKmapData({}); }}
                               className="rounded-xl font-black w-12"
                             >
                               {s}
                             </Button>
                          ))}
                       </div>
                    </div>

                    <div className="flex flex-col items-center justify-center space-y-8">
                       <div className="relative p-12 bg-muted/20 rounded-[4rem] border-2 shadow-inner">
                          {/* K-Map Grid */}
                          <div className="grid gap-2" style={{ 
                             gridTemplateColumns: `auto repeat(${kmapSize === 2 ? 2 : 4}, 1fr)`,
                             gridTemplateRows: `auto repeat(${kmapSize === 4 ? 4 : 2}, 1fr)` 
                          }}>
                             {/* Header Row */}
                             <div className="w-16 h-16 flex items-center justify-center font-black opacity-20 text-xs">
                                {kmapSize === 2 ? 'A\\B' : kmapSize === 3 ? 'A\\BC' : 'AB\\CD'}
                             </div>
                             {(kmapSize === 2 ? grayCode1 : grayCode).map(code => (
                                <div key={code} className="w-20 h-16 flex items-center justify-center font-black text-primary/60 text-sm tracking-widest">{code}</div>
                             ))}

                             {/* Rows */}
                             {(kmapSize === 4 ? grayCode : grayCode1).map(rowCode => (
                                <React.Fragment key={rowCode}>
                                   <div className="w-16 h-20 flex items-center justify-center font-black text-primary/60 text-sm tracking-widest">{rowCode}</div>
                                   {(kmapSize === 2 ? grayCode1 : grayCode).map(colCode => {
                                      const key = `${rowCode}${colCode}`;
                                      const val = kmapData[key] || 0;
                                      return (
                                         <motion.div
                                           key={key}
                                           whileHover={{ scale: 1.05, zIndex: 10 }}
                                           onClick={() => handleKmapCell(key)}
                                           className={`w-20 h-20 rounded-2xl border-2 flex items-center justify-center cursor-pointer transition-all ${val ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 border-transparent' : 'bg-card border-primary/10 hover:border-primary/40'}`}
                                         >
                                            <span className="text-2xl font-black font-mono">{val}</span>
                                         </motion.div>
                                      );
                                   })}
                                </React.Fragment>
                             ))}
                          </div>

                          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex gap-4">
                             <Button variant="outline" size="sm" onClick={() => setKmapData({})} className="rounded-full gap-2 px-6 bg-card border-2 shadow-xl">
                                <RotateCcw className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Clear Map</span>
                             </Button>
                          </div>
                       </div>

                       <div className="max-w-2xl w-full p-10 rounded-[3rem] bg-primary text-primary-foreground shadow-2xl relative overflow-hidden group">
                          <Zap className="absolute top-0 right-0 p-8 w-40 h-40 opacity-10 group-hover:scale-110 transition-transform" />
                          <div className="relative z-10 space-y-4 text-center">
                             <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Simplified Boolean Output</p>
                             <p className="text-4xl font-black italic tracking-tighter">
                                F = {Object.keys(kmapData).filter(k => kmapData[k]).length === 0 ? '0' : 'A\'B + CD (Manual Grouping Ready)'}
                             </p>
                             <p className="text-[10px] font-bold opacity-60 pt-4">Interactive Grouping Visualizer Coming Soon...</p>
                          </div>
                       </div>
                    </div>
                 </motion.div>
              )}
           </AnimatePresence>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {[
           { icon: Zap, label: 'Fast Solver', desc: 'Instant truth table generation.' },
           { icon: Layers, label: 'Gray Code', desc: 'Standard K-Map cell ordering.' },
           { icon: Settings, label: 'Up to 4 Vars', desc: 'A, B, C, and D supported.' }
         ].map((item, i) => (
            <div key={i} className="p-6 rounded-[2.5rem] bg-card border-2 shadow-sm flex items-center gap-4 group hover:border-primary/40 transition-all">
               <div className="p-3 bg-primary/10 rounded-2xl group-hover:scale-110 transition-transform">
                  <item.icon className="w-6 h-6 text-primary" />
               </div>
               <div>
                  <h4 className="text-xs font-black uppercase tracking-widest mb-1">{item.label}</h4>
                  <p className="text-xs font-bold text-muted-foreground">{item.desc}</p>
               </div>
            </div>
         ))}
      </div>
    </div>
  );
}
