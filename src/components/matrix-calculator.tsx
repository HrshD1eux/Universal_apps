'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { safeInvoke, isTauri } from '@/lib/tauri-utils';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutGrid, Hash, Plus, Minus, X, Binary, Sparkles, RefreshCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/language-context';

export default function MatrixCalculator() {
  const [size, setSize] = useState(3);
  const [matrixA, setMatrixA] = useState<number[][]>(Array(3).fill(0).map(() => Array(3).fill(0)));
  const [matrixB, setMatrixB] = useState<number[][]>(Array(3).fill(0).map(() => Array(3).fill(0)));
  const [op, setOp] = useState<'add' | 'sub' | 'mul' | 'det' | 'inverse' | 'transpose'>('add');
  const [result, setResult] = useState<any>(null);
  const { t } = useLanguage();
  const { toast } = useToast();

  const handleCellChange = (matrix: 'A' | 'B', row: number, col: number, val: string) => {
    const num = parseFloat(val) || 0;
    if (matrix === 'A') {
      const newM = [...matrixA];
      newM[row][col] = num;
      setMatrixA(newM);
    } else {
      const newM = [...matrixB];
      newM[row][col] = num;
      setMatrixB(newM);
    }
  };

  const handleCalculate = async () => {
    if (!isTauri()) return;

    try {
      const a = matrixA.slice(0, size).map(row => row.slice(0, size));
      const b = matrixB.slice(0, size).map(row => row.slice(0, size));

      // Check if matrix A is all zeros (initial state)
      const isAEmpty = a.every(row => row.every(val => val === 0));
      if (isAEmpty && op === 'inverse') {
          setResult(null);
          return;
      }

      if (op === 'det') {
        const res = await safeInvoke<number>('calculate_matrix_det', { a });
        setResult(res);
      } else {
        const res = await safeInvoke<any>('calculate_matrix_ops', { a, b, op });
        setResult(res.data);
      }
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("singular")) {
        setResult("SINGULAR");
      } else {
        toast({
          title: "Matrix Error",
          description: msg,
          variant: "destructive"
        });
        setResult(null);
      }
    }
  };

  useEffect(() => {
    handleCalculate();
  }, [matrixA, matrixB, op, size]);

  const resetMatrices = () => {
     setMatrixA(Array(3).fill(0).map(() => Array(3).fill(0)));
     setMatrixB(Array(3).fill(0).map(() => Array(3).fill(0)));
     setResult(null);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <Card className="border-none shadow-2xl bg-gradient-to-br from-background via-muted/50 to-background overflow-hidden">
        <CardHeader className="bg-primary/5 border-b border-primary/10">
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-3">
               <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-600">
                 <LayoutGrid className="w-6 h-6" />
               </div>
               <div>
                 <CardTitle className="text-2xl">{t('matrixTitle')}</CardTitle>
                 <CardDescription>{t('matrixDesc')}</CardDescription>
               </div>
             </div>
             <div className="flex items-center gap-4">
               <div className="flex bg-muted p-1 rounded-xl">
                  {[2, 3].map(s => (
                     <button
                       key={s}
                       onClick={() => setSize(s)}
                       className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${size === s ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground'}`}
                     >
                       {s}x{s}
                     </button>
                  ))}
               </div>
             </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-8">
          <div className="flex flex-wrap justify-center gap-4 mb-10">
             <OpButton active={op === 'add'} onClick={() => setOp('add')} icon={<Plus className="w-4 h-4" />} label="Add" />
             <OpButton active={op === 'sub'} onClick={() => setOp('sub')} icon={<Minus className="w-4 h-4" />} label="Subtract" />
             <OpButton active={op === 'mul'} onClick={() => setOp('mul')} icon={<X className="w-4 h-4" />} label="Multiply" />
             <OpButton active={op === 'det'} onClick={() => setOp('det')} icon={<Binary className="w-4 h-4" />} label="Determinant" />
             <OpButton active={op === 'inverse'} onClick={() => setOp('inverse')} icon={<RefreshCcw className="w-4 h-4" />} label="Inverse" />
             <OpButton active={op === 'transpose'} onClick={() => setOp('transpose')} icon={<LayoutGrid className="w-4 h-4" />} label="Transpose" />
             <Button variant="outline" size="sm" onClick={resetMatrices} className="rounded-xl font-bold ml-auto opacity-60">
                <RefreshCcw className="w-3 h-3 mr-2" /> Reset
             </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr,auto,1fr] gap-8 items-center justify-center">
             <MatrixInput 
                label={t('matrixA')} 
                matrix={matrixA} 
                size={size} 
                onChange={(r, c, v) => handleCellChange('A', r, c, v)} 
             />

             <div className="hidden lg:flex items-center justify-center">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center shadow-inner">
                   {op === 'add' && <Plus className="w-6 h-6 text-primary" />}
                   {op === 'sub' && <Minus className="w-6 h-6 text-primary" />}
                   {op === 'mul' && <X className="w-6 h-6 text-primary" />}
                   {op === 'det' && <div className="text-[10px] font-black">DET</div>}
                   {op === 'inverse' && <div className="text-[10px] font-black">INV</div>}
                   {op === 'transpose' && <div className="text-[10px] font-black">TRN</div>}
                </div>
             </div>

             {['add', 'sub', 'mul'].includes(op) ? (
                <MatrixInput 
                   label={t('matrixB')} 
                   matrix={matrixB} 
                   size={size} 
                   onChange={(r, c, v) => handleCellChange('B', r, c, v)} 
                />
             ) : (
                <div className="flex flex-col items-center justify-center h-full">
                   <p className="text-xs font-black text-muted-foreground uppercase mb-4">
                     {op === 'det' ? `${t('determinant')} (A)` : op === 'inverse' ? 'Inverse (A)' : 'Transpose (A)'}
                   </p>
                   {op === 'det' ? (
                      <div className="p-12 rounded-[3rem] bg-indigo-600 text-white shadow-2xl shadow-indigo-500/20 text-5xl font-black">
                         {typeof result === 'number' ? result : '?'}
                      </div>
                   ) : result === 'SINGULAR' ? (
                      <div className="p-8 rounded-[2.5rem] bg-destructive/10 text-destructive border-2 border-destructive/20 text-center space-y-2">
                         <X className="w-8 h-8 mx-auto" />
                         <p className="text-sm font-black uppercase">Singular Matrix</p>
                         <p className="text-[10px] font-bold opacity-60">No inverse exists (Det = 0)</p>
                      </div>
                   ) : result && Array.isArray(result) ? (
                      <div 
                         className="grid gap-3 p-8 bg-primary/5 rounded-[3rem] border-2 border-primary/20 shadow-xl"
                         style={{ gridTemplateColumns: `repeat(${result[0].length}, minmax(80px, 1fr))` }}
                      >
                         {result.map((row, r) => (
                            row.map((val, c) => (
                               <div key={`${r}-${c}`} className="h-20 bg-background rounded-2xl flex items-center justify-center text-xl font-black text-primary shadow-sm border border-primary/10 px-4">
                                  {val.toFixed(2)}
                               </div>
                            ))
                         ))}
                      </div>
                   ) : (
                      <div className="flex flex-col items-center gap-4 opacity-20">
                         <LayoutGrid className="w-16 h-16" />
                         <p className="text-xs font-bold uppercase tracking-widest">Awaiting Calculation</p>
                      </div>
                   )}
                </div>
             )}
          </div>

          {/* Result Matrix for Ops */}
          {op !== 'det' && result && Array.isArray(result) && (
             <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="mt-16 flex flex-col items-center gap-6"
             >
                <div className="flex items-center gap-4 text-muted-foreground">
                   <div className="h-[2px] w-20 bg-muted" />
                   <span className="text-xs font-black uppercase tracking-widest">Result Matrix</span>
                   <div className="h-[2px] w-20 bg-muted" />
                </div>
                <div 
                   className="grid gap-3 p-6 bg-primary/5 rounded-[2.5rem] border-2 border-primary/20 shadow-xl"
                   style={{ gridTemplateColumns: `repeat(${result[0].length}, minmax(80px, 1fr))` }}
                >
                   {result.map((row, r) => (
                      row.map((val, c) => (
                         <div key={`${r}-${c}`} className="h-16 bg-background rounded-2xl flex items-center justify-center text-xl font-black text-primary shadow-sm border border-primary/10 px-4">
                            {val.toFixed(1)}
                         </div>
                      ))
                   ))}
                </div>
             </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MatrixInput({ label, matrix, size, onChange }: { label: string, matrix: number[][], size: number, onChange: (r: number, c: number, v: string) => void }) {
   return (
      <div className="space-y-4">
         <p className="text-xs font-black text-muted-foreground uppercase ml-2">{label}</p>
         <div 
            className="grid gap-3 p-4 bg-muted/20 rounded-[2.5rem] border-2 border-border/50 shadow-inner"
            style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
         >
            {matrix.slice(0, size).map((row, r) => (
               row.slice(0, size).map((val, c) => (
                  <Input
                    key={`${r}-${c}`}
                    type="number"
                    value={val || ''}
                    onChange={(e) => onChange(r, c, e.target.value)}
                    className="h-16 text-center text-xl font-mono border-none bg-background rounded-2xl focus:ring-2 focus:ring-primary shadow-sm"
                    placeholder="0"
                  />
               ))
            ))}
         </div>
      </div>
   );
}

function OpButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
   return (
      <Button
        variant={active ? "default" : "outline"}
        onClick={onClick}
        className={`rounded-2xl h-12 px-6 font-bold gap-2 transition-all ${active ? 'shadow-lg shadow-primary/20' : 'opacity-70 hover:opacity-100'}`}
      >
         {icon} {label}
      </Button>
   );
}
