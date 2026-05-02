'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { safeInvoke, isTauri } from '@/lib/tauri-utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Binary, Hash, Zap, Info, ArrowRight, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/language-context';

export default function EquationSolver() {
  const [mode, setMode] = useState<'quadratic' | 'cubic' | 'quartic' | 'linear2' | 'linear3'>('quadratic');
  
  const resetInputs = () => {
    setQa('1'); setQb('-5'); setQc('6');
    setCa('1'); setCb('-6'); setCc('11'); setCd('-6');
    setBa('1'); setBb('0'); setBc('-5'); setBd('0'); setBe('4');
    setA1('1'); setB1('1'); setC1('5'); setA2('1'); setB2('-1'); setC2('1');
    setLa1('1'); setLb1('1'); setLc1('1'); setLd1('6');
    setLa2('1'); setLb2('-1'); setLc2('1'); setLd2('2');
    setLa3('1'); setLb3('1'); setLc3('-1'); setLd3('0');
    setResult(null);
  };

  // Quadratic states: ax^2 + bx + c = 0
  const [qa, setQa] = useState('1');
  const [qb, setQb] = useState('-5');
  const [qc, setQc] = useState('6');

  // Cubic states: ax^3 + bx^2 + cx + d = 0
  const [ca, setCa] = useState('1');
  const [cb, setCb] = useState('-6');
  const [cc, setCc] = useState('11');
  const [cd, setCd] = useState('-6');

  // Quartic states: ax^4 + bx^3 + cx^2 + dx + e = 0
  const [ba, setBa] = useState('1');
  const [bb, setBb] = useState('0');
  const [bc, setBc] = useState('-5');
  const [bd, setBd] = useState('0');
  const [be, setBe] = useState('4');
  
  // Linear 2 states: a1x + b1y = c1, a2x + b2y = c2
  const [a1, setA1] = useState('1');
  const [b1, setB1] = useState('1');
  const [c1, setC1] = useState('5');
  const [a2, setA2] = useState('1');
  const [b2, setB2] = useState('-1');
  const [c2, setC2] = useState('1');

  // Linear 3 states: a1x + b1y + c1z = d1, etc.
  const [la1, setLa1] = useState('1'); const [lb1, setLb1] = useState('1'); const [lc1, setLc1] = useState('1'); const [ld1, setLd1] = useState('6');
  const [la2, setLa2] = useState('1'); const [lb2, setLb2] = useState('-1'); const [lc2, setLc2] = useState('1'); const [ld2, setLd2] = useState('2');
  const [la3, setLa3] = useState('1'); const [lb3, setLb3] = useState('1'); const [lc3, setLc3] = useState('-1'); const [ld3, setLd3] = useState('0');
  
  const [result, setResult] = useState<any>(null);
  const { t } = useLanguage();
  const { toast } = useToast();

  const handleCalculate = async () => {
    if (!isTauri()) return;

    try {
      let res;
      if (mode === 'quadratic') {
        const a = parseFloat(qa); const b = parseFloat(qb); const c = parseFloat(qc);
        if (isNaN(a) || isNaN(b) || isNaN(c)) return;
        res = await safeInvoke<any>('solve_quadratic', { a, b, c });
      } else if (mode === 'cubic') {
        const a = parseFloat(ca); const b = parseFloat(cb); const c = parseFloat(cc); const d = parseFloat(cd);
        if ([a, b, c, d].some(v => isNaN(v))) return;
        res = await safeInvoke<any>('solve_cubic', { a, b, c, d });
      } else if (mode === 'quartic') {
        const a = parseFloat(ba); const b = parseFloat(bb); const c = parseFloat(bc); const d = parseFloat(bd); const e = parseFloat(be);
        if ([a, b, c, d, e].some(v => isNaN(v))) return;
        res = await safeInvoke<any>('solve_quartic', { a, b, c, d, e });
      } else if (mode === 'linear2') {
        if ([a1, b1, c1, a2, b2, c2].some(v => isNaN(parseFloat(v)))) return;
        res = await safeInvoke<any>('solve_linear_2', { a1: parseFloat(a1), b1: parseFloat(b1), c1: parseFloat(c1), a2: parseFloat(a2), b2: parseFloat(b2), c2: parseFloat(c2) });
      } else {
        if ([la1, lb1, lc1, ld1, la2, lb2, lc2, ld2, la3, lb3, lc3, ld3].some(v => isNaN(parseFloat(v)))) return;
        res = await safeInvoke<any>('solve_linear_3', { 
          a1: parseFloat(la1), b1: parseFloat(lb1), c1: parseFloat(lc1), d1: parseFloat(ld1),
          a2: parseFloat(la2), b2: parseFloat(lb2), c2: parseFloat(lc2), d2: parseFloat(ld2),
          a3: parseFloat(la3), b3: parseFloat(lb3), c3: parseFloat(lc3), d3: parseFloat(ld3)
        });
      }
      setResult(res);
    } catch (err) {
      setResult(null);
      if (err && String(err).includes('no unique solution')) {
        toast({ title: "No Solution", description: String(err), variant: "destructive" });
      }
    }
  };

  useEffect(() => {
    handleCalculate();
  }, [mode, qa, qb, qc, ca, cb, cc, cd, ba, bb, bc, bd, be, a1, b1, c1, a2, b2, c2, la1, lb1, lc1, ld1, la2, lb2, lc2, ld2, la3, lb3, lc3, ld3]);

  return (
    <Card className="max-w-4xl mx-auto border-none shadow-2xl bg-gradient-to-br from-background via-muted/50 to-background overflow-hidden">
      <CardHeader className="bg-primary/5 border-b border-primary/10 text-center py-10 relative">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
            <Binary className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-3xl font-black">{t('equationTitle')}</CardTitle>
          <CardDescription>{t('equationDesc')}</CardDescription>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={resetInputs}
            className="absolute top-4 right-4 rounded-full opacity-50 hover:opacity-100 transition-opacity"
          >
            {t('reset')}
          </Button>
      </CardHeader>
      
      <CardContent className="p-8">
        <Tabs value={mode} onValueChange={(v) => setMode(v as any)} className="w-full mb-10 overflow-x-auto">
          <TabsList className="flex w-fit mx-auto h-14 p-1.5 bg-muted rounded-[2rem] min-w-[500px]">
            <TabsTrigger value="quadratic" className="flex-1 rounded-[1.5rem] font-bold text-xs uppercase tracking-widest px-4">{t('quadratic')}</TabsTrigger>
            <TabsTrigger value="cubic" className="flex-1 rounded-[1.5rem] font-bold text-xs uppercase tracking-widest px-4">{t('cubic')}</TabsTrigger>
            <TabsTrigger value="quartic" className="flex-1 rounded-[1.5rem] font-bold text-xs uppercase tracking-widest px-4">{t('quartic')}</TabsTrigger>
            <TabsTrigger value="linear2" className="flex-1 rounded-[1.5rem] font-bold text-xs uppercase tracking-widest px-4">{t('linear2')}</TabsTrigger>
            <TabsTrigger value="linear3" className="flex-1 rounded-[1.5rem] font-bold text-xs uppercase tracking-widest px-4">{t('linear3')}</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          {/* Inputs Section */}
          <div className="space-y-6">
            <AnimatePresence mode="wait">
              {mode === 'quadratic' ? (
                <motion.div key="quad" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-3xl justify-center text-lg font-mono font-bold mb-6">
                    <span className="text-primary">{qa || '0'}</span>x² + <span className="text-primary">{qb || '0'}</span>x + <span className="text-primary">{qc || '0'}</span> = 0
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                     <InputBlock label="a" value={qa} onChange={setQa} />
                     <InputBlock label="b" value={qb} onChange={setQb} />
                     <InputBlock label="c" value={qc} onChange={setQc} />
                  </div>
                </motion.div>
              ) : mode === 'cubic' ? (
                <motion.div key="cubic" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2 p-4 bg-muted/50 rounded-3xl justify-center text-lg font-mono font-bold mb-6">
                    <span className="text-primary">{ca || '0'}</span>x³ + <span className="text-primary">{cb || '0'}</span>x² + <span className="text-primary">{cc || '0'}</span>x + <span className="text-primary">{cd || '0'}</span> = 0
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                     <InputBlock label="a" value={ca} onChange={setCa} mini />
                     <InputBlock label="b" value={cb} onChange={setCb} mini />
                     <InputBlock label="c" value={cc} onChange={setCc} mini />
                     <InputBlock label="d" value={cd} onChange={setCd} mini />
                  </div>
                </motion.div>
              ) : mode === 'quartic' ? (
                <motion.div key="quartic" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2 p-4 bg-muted/50 rounded-3xl justify-center text-lg font-mono font-bold mb-6">
                    <span className="text-primary">{ba || '0'}</span>x⁴ + <span className="text-primary">{bb || '0'}</span>x³ + <span className="text-primary">{bc || '0'}</span>x² + <span className="text-primary">{bd || '0'}</span>x + <span className="text-primary">{be || '0'}</span> = 0
                  </div>
                  <div className="grid grid-cols-5 gap-1">
                     <InputBlock label="a" value={ba} onChange={setBa} mini />
                     <InputBlock label="b" value={bb} onChange={setBb} mini />
                     <InputBlock label="c" value={bc} onChange={setBc} mini />
                     <InputBlock label="d" value={bd} onChange={setBd} mini />
                     <InputBlock label="e" value={be} onChange={setBe} mini />
                  </div>
                </motion.div>
              ) : mode === 'linear2' ? (
                <motion.div key="linear2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 justify-center">
                       <InputBlock label="a1" value={a1} onChange={setA1} mini />
                       <span className="font-mono font-bold">x +</span>
                       <InputBlock label="b1" value={b1} onChange={setB1} mini />
                       <span className="font-mono font-bold">y =</span>
                       <InputBlock label="c1" value={c1} onChange={setC1} mini />
                    </div>
                    <div className="flex items-center gap-3 justify-center">
                       <InputBlock label="a2" value={a2} onChange={setA2} mini />
                       <span className="font-mono font-bold">x +</span>
                       <InputBlock label="b2" value={b2} onChange={setB2} mini />
                       <span className="font-mono font-bold">y =</span>
                       <InputBlock label="c2" value={c2} onChange={setC2} mini />
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="linear3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  {[
                    { a: la1, b: lb1, c: lc1, d: ld1, setA: setLa1, setB: setLb1, setC: setLc1, setD: setLd1 },
                    { a: la2, b: lb2, c: lc2, d: ld2, setA: setLa2, setB: setLb2, setC: setLc2, setD: setLd2 },
                    { a: la3, b: lb3, c: lc3, d: ld3, setA: setLa3, setB: setLb3, setC: setLc3, setD: setLd3 },
                  ].map((row, i) => (
                    <div key={i} className="flex flex-wrap items-center gap-2 justify-center sm:scale-[0.85] -mx-4">
                       <InputBlock label={`a${i+1}`} value={row.a} onChange={row.setA} mini />
                       <span className="font-mono font-bold">x+</span>
                       <InputBlock label={`b${i+1}`} value={row.b} onChange={row.setB} mini />
                       <span className="font-mono font-bold">y+</span>
                       <InputBlock label={`c${i+1}`} value={row.c} onChange={row.setC} mini />
                       <span className="font-mono font-bold">z=</span>
                       <InputBlock label={`d${i+1}`} value={row.d} onChange={row.setD} mini />
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="p-6 rounded-[2rem] bg-primary/5 border-2 border-dashed border-primary/20">
               <div className="flex gap-4">
                  <Sparkles className="w-6 h-6 text-primary shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                    Our high-performance expression engine handles complex roots and high precision to ensure your results are 100% accurate.
                  </p>
               </div>
            </div>
          </div>

          {/* Results Section */}
          <div className="min-h-[300px] flex flex-col">
            <AnimatePresence mode="wait">
              {result ? (
                <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
                  {mode === 'quadratic' && result.discriminant !== undefined ? (
                    <div className="space-y-4">
                      <ResultCard label="Root x₁" value={formatRoot(result.x1_real, result.x1_imag)} color="hsl(var(--primary))" />
                      <ResultCard label="Root x₂" value={formatRoot(result.x2_real, result.x2_imag)} color="hsl(var(--primary))" />
                      <div className="flex justify-between items-center px-4 py-2 bg-muted/30 rounded-2xl">
                         <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Discriminant (D)</span>
                         <span className={`font-mono font-bold ${result.discriminant < 0 ? 'text-rose-500' : 'text-green-600'}`}>{result.discriminant?.toFixed(2)}</span>
                      </div>
                    </div>
                  ) : (mode === 'cubic' || mode === 'quartic') && result.roots ? (
                    <div className="space-y-3">
                      {result.roots.map((r: any, i: number) => (
                        <ResultCard key={i} label={`Root x${i+1}`} value={formatRoot(r.real, r.imag)} color="hsl(var(--primary))" />
                      ))}
                    </div>
                  ) : mode === 'linear2' && result.x !== undefined ? (
                    <div className="space-y-4">
                      <ResultCard label="Value of x" value={result.x?.toFixed(4)} color="hsl(var(--primary))" />
                      <ResultCard label="Value of y" value={result.y?.toFixed(4)} color="hsl(var(--primary))" />
                    </div>
                  ) : mode === 'linear3' && result.z !== undefined ? (
                    <div className="space-y-3">
                      <ResultCard label="x" value={result.x?.toFixed(4)} color="hsl(var(--primary))" />
                      <ResultCard label="y" value={result.y?.toFixed(4)} color="hsl(var(--primary))" />
                      <ResultCard label="z" value={result.z?.toFixed(4)} color="hsl(var(--primary))" />
                    </div>
                  ) : null}
                </motion.div>
              ) : (
                <motion.div key="no-result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-3 p-8 border-2 border-dashed rounded-3xl h-full flex flex-col justify-center">
                    <Info className="w-8 h-8 text-muted-foreground mx-auto opacity-20" />
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Awaiting Valid Input</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function InputBlock({ label, value, onChange, mini = false }: { label: string, value: string, onChange: (v: string) => void, mini?: boolean }) {
  return (
    <div className="space-y-1">
       <Input
         type="number"
         value={value}
         onChange={(e) => onChange(e.target.value)}
         className={`${mini ? 'w-full px-1' : 'w-full'} h-12 text-lg text-center font-mono border-2 rounded-xl focus:ring-primary`}
       />
       <p className="text-center text-[10px] font-black text-muted-foreground uppercase">{label}</p>
    </div>
  );
}

function ResultCard({ label, value, color }: { label: string, value: string | number, color: string }) {
  return (
    <div className="p-4 rounded-[1.5rem] border-2 bg-card relative overflow-hidden group transition-all hover:border-primary/30 shadow-sm hover:shadow-md">
       <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity" style={{ color }}><Sparkles className="w-8 h-8" /></div>
       <div className="absolute top-0 left-0 w-1 h-full opacity-20" style={{ backgroundColor: color }} />
       <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest mb-0.5">{label}</p>
       <p className="text-xl font-black truncate">{value}</p>
    </div>
  );
}

function formatRoot(real: number, imag: number) {
  if (Math.abs(imag) < 0.00001) return real.toFixed(4);
  const sign = imag >= 0 ? '+' : '-';
  return `${real.toFixed(4)} ${sign} ${Math.abs(imag).toFixed(4)}i`;
}
