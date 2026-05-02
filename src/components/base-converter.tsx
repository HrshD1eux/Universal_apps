'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { safeInvoke, isTauri } from '@/lib/tauri-utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Binary, Hash, Cpu, RefreshCcw, Copy, Zap, ArrowRightLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const BASES = [
  { name: 'Binary (2)', value: 2 },
  { name: 'Octal (8)', value: 8 },
  { name: 'Decimal (10)', value: 10 },
  { name: 'Hexadecimal (16)', value: 16 }
];

export default function BaseConverter() {
  const [inputValue, setInputValue] = useState('255');
  const [fromBase, setFromBase] = useState(10);
  const [results, setResults] = useState<any[]>([]);
  const { toast } = useToast();

  const handleConvert = async () => {
    if (!isTauri() || !inputValue) return;

    try {
      const conversions = [];
      for (const base of BASES) {
        if (base.value === fromBase) continue;
        const res = await safeInvoke<string>('base_convert', {
          value: inputValue,
          fromBase: fromBase,
          toBase: base.value
        });
        conversions.push({ ...base, result: res });
      }
      setResults(conversions);
    } catch (err) {
      // Don't show toast for every partial input
      setResults([]);
    }
  };

  useEffect(() => {
    handleConvert();
  }, [inputValue, fromBase]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${text} copied to clipboard`,
    });
  };

  return (
    <Card className="max-w-4xl mx-auto border-none shadow-2xl bg-gradient-to-br from-background via-muted/50 to-background overflow-hidden relative">
      <CardHeader className="bg-primary/5 border-b border-primary/10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Cpu className="w-6 h-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl">Base Converter</CardTitle>
            <CardDescription>Convert numbers between Binary, Octal, Decimal, and Hex.</CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-[1.5fr,1fr] gap-6 items-end">
           <div className="space-y-4">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Input Value</label>
              <div className="relative">
                 <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary opacity-50" />
                 <Input 
                   value={inputValue}
                   onChange={(e) => setInputValue(e.target.value)}
                   className="h-16 text-3xl font-mono pl-12 rounded-2xl border-2 focus:ring-primary uppercase"
                   placeholder="Enter number..."
                 />
              </div>
           </div>
           <div className="space-y-4">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">From Base</label>
              <select 
                value={fromBase}
                onChange={(e) => setFromBase(parseInt(e.target.value))}
                className="w-full h-16 bg-muted/50 border-2 border-border rounded-2xl px-4 text-lg font-bold outline-none focus:ring-2 ring-primary appearance-none cursor-pointer"
              >
                {BASES.map(b => (
                  <option key={b.value} value={b.value}>{b.name}</option>
                ))}
              </select>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <AnimatePresence mode="popLayout">
              {results.length > 0 ? (
                results.map((res, index) => (
                  <motion.div
                    key={res.value}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-6 rounded-3xl bg-primary shadow-xl shadow-primary/10 relative group border-2 border-primary/20"
                  >
                     <div className="flex items-center justify-between mb-4">
                        <p className="text-[10px] font-black uppercase text-primary-foreground/60">{res.name}</p>
                        <button 
                          onClick={() => copyToClipboard(res.result)}
                          className="p-1.5 bg-white/10 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/20"
                        >
                           <Copy className="w-3.5 h-3.5" />
                        </button>
                     </div>
                     <p className="text-2xl font-black text-white break-all font-mono leading-tight">
                        {res.result}
                     </p>
                     <div className="absolute -bottom-2 -right-2 p-4 opacity-5">
                        <Binary className="w-16 h-16 text-white" />
                     </div>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-3 h-48 flex flex-col items-center justify-center text-muted-foreground bg-muted/20 rounded-3xl border-2 border-dashed border-border/50">
                   <RefreshCcw className="w-12 h-12 opacity-20 mb-3 animate-spin-slow" />
                   <p className="text-sm font-medium">Listening for valid input...</p>
                </div>
              )}
           </AnimatePresence>
        </div>

        <div className="p-6 rounded-[2rem] bg-primary/5 border-2 border-dashed border-primary/20">
           <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                 <Zap className="w-6 h-6" />
              </div>
              <div>
                 <p className="text-sm font-bold">Real-time Conversion</p>
                 <p className="text-xs text-muted-foreground">
                    Instantly view your input in Binary, Octal, Decimal, and Hex formats as you type.
                 </p>
              </div>
           </div>
        </div>
      </CardContent>
    </Card>
  );
}
