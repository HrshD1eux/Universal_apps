'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { DateMathResult } from '@/lib/types';
import { safeInvoke, isTauri } from '@/lib/tauri-utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Plus, Minus, Hash, Clock, History, MoreHorizontal, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatNumber } from '@/lib/utils';

export default function DateCalculator() {
  const [mode, setMode] = useState<'diff' | 'add'>('diff');
  // Mode-specific state
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Add/Sub specific
  const [years, setYears] = useState('0');
  const [months, setMonths] = useState('0');
  const [days, setDays] = useState('0');
  const [op, setOp] = useState<'add' | 'sub'>('add');

  const [result, setResult] = useState<DateMathResult | null>(null);
  const { toast } = useToast();

  const handleCalculate = async () => {
    if (!isTauri()) return;

    try {
      const res = await safeInvoke<DateMathResult>('calculate_date_math', {
        mode,
        startDate,
        endDate: mode === 'diff' ? endDate : null,
        years: mode === 'add' ? parseInt(years || '0') : null,
        months: mode === 'add' ? parseInt(months || '0') : null,
        days: mode === 'add' ? parseInt(days || '0') : null,
        op: mode === 'add' ? op : null,
      });
      setResult(res);
    } catch (err) {
      toast({
        title: "Date Math Error",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    handleCalculate();
  }, [mode, startDate, endDate, years, months, days, op]);

  return (
    <Card className="max-w-4xl mx-auto border-none shadow-2xl bg-gradient-to-br from-background via-muted/50 to-background overflow-hidden relative">
      <CardHeader className="bg-primary/5 border-b border-primary/10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Calendar className="w-6 h-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl">Date Calculator</CardTitle>
            <CardDescription>Calculate durations or find future/past dates.</CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-8">
        <Tabs value={mode} onValueChange={(v) => setMode(v as any)} className="space-y-8">
          <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto h-12 p-1 bg-muted rounded-2xl">
            <TabsTrigger value="diff" className="rounded-xl text-xs font-black uppercase tracking-widest">
              Difference
            </TabsTrigger>
            <TabsTrigger value="add" className="rounded-xl text-xs font-black uppercase tracking-widest">
              Add / Subtract
            </TabsTrigger>
          </TabsList>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Input Panel */}
            <div className="space-y-6">
              <TabsContent value="diff" className="space-y-6 mt-0">
                <div className="space-y-2">
                  <label className="text-sm font-semibold flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    Start Date
                  </label>
                  <Input 
                    type="date" 
                    value={startDate} 
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-14 text-lg border-2 rounded-2xl focus:ring-primary cursor-pointer"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold flex items-center gap-2">
                    <ArrowRight className="w-4 h-4 text-primary" />
                    End Date
                  </label>
                  <Input 
                    type="date" 
                    value={endDate} 
                    onChange={(e) => setEndDate(e.target.value)}
                    className="h-14 text-lg border-2 rounded-2xl focus:ring-primary cursor-pointer"
                  />
                </div>
              </TabsContent>

              <TabsContent value="add" className="space-y-6 mt-0">
                <div className="space-y-2">
                  <label className="text-sm font-semibold flex items-center gap-2">
                    Base Date
                  </label>
                  <Input 
                    type="date" 
                    value={startDate} 
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-14 text-lg border-2 rounded-2xl focus:ring-primary cursor-pointer"
                  />
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant={op === 'add' ? 'default' : 'outline'} 
                    onClick={() => setOp('add')}
                    className="flex-1 h-12 rounded-xl font-bold"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Add
                  </Button>
                  <Button 
                    variant={op === 'sub' ? 'default' : 'outline'} 
                    onClick={() => setOp('sub')}
                    className="flex-1 h-12 rounded-xl font-bold"
                  >
                    <Minus className="w-4 h-4 mr-2" /> Subtract
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Years</label>
                    <Input type="number" value={years} onChange={(e) => setYears(e.target.value)} className="h-12 border-2 rounded-xl font-mono text-center" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Months</label>
                    <Input type="number" value={months} onChange={(e) => setMonths(e.target.value)} className="h-12 border-2 rounded-xl font-mono text-center" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Days</label>
                    <Input type="number" value={days} onChange={(e) => setDays(e.target.value)} className="h-12 border-2 rounded-xl font-mono text-center" />
                  </div>
                </div>
              </TabsContent>
            </div>

            {/* Display Panel */}
            <div className="space-y-6">
              <AnimatePresence mode="wait">
                {result && (
                  <motion.div
                    key={mode + (result.target_date || '')}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="h-full"
                  >
                    {mode === 'diff' ? (
                      <div className="space-y-4">
                        <div className="p-8 rounded-[2.5rem] bg-card border-4 border-primary/10 shadow-xl text-center">
                          <p className="text-xs uppercase font-black tracking-widest text-muted-foreground mb-4">Time Difference</p>
                          <div className="grid grid-cols-3 gap-2 items-center">
                            <div>
                              <p className="text-3xl font-black text-primary">{result.years}</p>
                              <p className="text-[10px] uppercase font-bold text-muted-foreground">Years</p>
                            </div>
                            <div>
                              <p className="text-3xl font-black text-primary">{result.months}</p>
                              <p className="text-[10px] uppercase font-bold text-muted-foreground">Months</p>
                            </div>
                            <div>
                              <p className="text-3xl font-black text-primary">{result.days}</p>
                              <p className="text-[10px] uppercase font-bold text-muted-foreground">Days</p>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                           <div className="p-4 rounded-3xl bg-muted/30 border-2 border-border/50">
                              <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Total Days</p>
                              <p className="text-xl font-bold">{formatNumber(Math.abs(result.total_days))} Days</p>
                           </div>
                           <div className="p-4 rounded-3xl bg-muted/30 border-2 border-border/50">
                              <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Total Weeks</p>
                              <p className="text-xl font-bold">{formatNumber(Math.floor(Math.abs(result.total_days) / 7))} Weeks</p>
                           </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="p-8 rounded-[2.5rem] bg-primary text-primary-foreground shadow-2xl relative overflow-hidden group">
                           <div className="absolute top-0 right-0 p-8 opacity-10">
                              <Calendar className="w-24 h-24" />
                           </div>
                           <div className="text-center relative">
                              <p className="text-[10px] uppercase font-black tracking-widest opacity-60 mb-2">Target Date</p>
                              <p className="text-4xl font-black">
                                {result.target_date ? new Date(result.target_date).toLocaleDateString(undefined, {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                }) : '--'}
                              </p>
                              <div className="mt-4 flex items-center justify-center gap-2 text-xs font-bold bg-white/10 py-1.5 px-4 rounded-full mx-auto w-fit">
                                 <Clock className="w-3.5 h-3.5" />
                                 {formatNumber(Math.abs(result.total_days))} Days from Start
                              </div>
                           </div>
                        </div>

                        <div className="p-6 rounded-3xl border-2 border-dashed border-border flex items-center justify-between">
                            <div className="space-y-1">
                               <p className="text-xs font-bold text-muted-foreground uppercase">Offset Applied</p>
                               <p className="text-sm font-black text-primary">
                                  {years}Y, {months}M, {days}D
                               </p>
                            </div>
                            <div className={op === 'add' ? 'text-green-500' : 'text-red-500'}>
                                {op === 'add' ? <Plus className="w-8 h-8" /> : <Minus className="w-8 h-8" />}
                            </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
}
