'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CalculationResult } from '@/lib/types';
import { saveToHistory } from '@/lib/db';
import { safeInvoke, isTauri } from '@/lib/tauri-utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, RotateCcw, Copy, HelpCircle, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const BUTTONS = [
    ['(', ')', 'MC', 'M+', 'M-', 'MR'],
    ['C', '÷', '×', '-', '+', '='],
    ['7', '8', '9', 'sin', 'cos', 'tan'],
    ['4', '5', '6', 'log', 'ln', '√'],
    ['1', '2', '3', 'x²', 'xʸ', 'π'],
    ['0', '.', '%', 'e', 'Deg', 'Rad']
];

export default function ScientificCalculator() {
    const [expression, setExpression] = useState('');
    const [result, setResult] = useState<CalculationResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isCalculating, setIsCalculating] = useState(false);
    const [calcTab, setCalcTab] = useState<'standard' | 'power'>('standard');
    const [powerInputs, setPowerInputs] = useState({ x: '2', y: '3', n: '8' });
    const { toast } = useToast();

    const handleEvaluate = async () => {
        if (!expression.trim()) return;

        if (!isTauri()) {
            toast({
                title: "Desktop Only",
                description: "This feature is only available within the desktop application window.",
                variant: "destructive"
            });
            return;
        }
        
        setIsCalculating(true);
        setError(null);
        
        try {
            const res = await safeInvoke<CalculationResult>('evaluate_scientific', { expression });
            setResult(res);
            
            await saveToHistory(
                'Scientific Calculator',
                'Math',
                { expression },
                { result: res.result },
                res.execution_time_ms
            );
            
        } catch (err) {
            toast({
                title: "Calculation Error",
                description: err instanceof Error ? err.message : String(err),
                variant: "destructive"
            });
        } finally {
            setIsCalculating(false);
        }
    };

    const handleClear = () => {
        setExpression('');
        setResult(null);
        setError(null);
    };

    const handleButtonClick = (val: string) => {
        if (val === '=') {
            handleEvaluate();
        } else if (val === 'C') {
            handleClear();
        } else {
            setExpression(prev => prev + val);
        }
    };

    const copyToClipboard = () => {
        if (result) {
            navigator.clipboard.writeText(result.formatted);
            toast({
                title: "Copied!",
                description: "Result copied to clipboard."
            });
        }
    };

    return (
        <Card className="max-w-4xl mx-auto border-none shadow-2xl bg-gradient-to-br from-background via-muted/50 to-background overflow-hidden relative">
            {!isTauri() && (
                <div className="absolute inset-0 z-50 backdrop-blur-sm bg-background/20 flex flex-col items-center justify-center p-6 text-center">
                    <div className="bg-background/90 p-8 rounded-3xl shadow-2xl border-2 border-primary/20 max-w-sm">
                        <Zap className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
                        <h3 className="text-xl font-bold mb-2">Desktop Environment Required</h3>
                        <p className="text-sm text-muted-foreground mb-6">
                            This calculator uses a high-performance expression engine that is only available in the standalone desktop app.
                        </p>
                        <Button variant="outline" className="rounded-xl" onClick={() => window.location.reload()}>
                            Retry Detection
                        </Button>
                    </div>
                </div>
            )}
            <CardHeader className="bg-primary/5 border-b border-primary/10">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Calculator className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="text-2xl">Scientific Calculator</CardTitle>
                        <CardDescription>High-precision calculations with industrial-grade accuracy.</CardDescription>
                    </div>
                    <div className="flex p-1 bg-muted rounded-xl border border-primary/10 ml-auto">
                        <Button variant={calcTab === 'standard' ? 'default' : 'ghost'} size="sm" onClick={() => setCalcTab('standard')} className="rounded-lg text-[10px] font-black h-8">STANDARD</Button>
                        <Button variant={calcTab === 'power' ? 'default' : 'ghost'} size="sm" onClick={() => setCalcTab('power')} className="rounded-lg text-[10px] font-black h-8">EXPONENT SOLVER</Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                     {calcTab === 'standard' ? (
                        <>
                        <div className="lg:col-span-2 space-y-6">
                            <div className="relative">
                                <Input
                                    value={expression}
                                    onChange={(e) => setExpression(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleEvaluate()}
                                    className="text-3xl h-20 px-6 font-mono bg-muted/30 border-2 focus-visible:ring-primary/30 transition-all text-right"
                                    placeholder="0"
                                />
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex gap-2">
                                    <Button size="icon" variant="ghost" className="rounded-full" onClick={handleClear}>
                                        <RotateCcw className="w-4 h-4 opacity-50" />
                                    </Button>
                                </div>
                            </div>

                            <AnimatePresence mode="wait">
                                {result && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="p-6 rounded-2xl bg-primary/5 border border-primary/20 relative"
                                    >
                                        <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">Result</p>
                                        <div className="flex items-end justify-between gap-4">
                                            <p className="text-5xl font-bold tracking-tight text-primary truncate">
                                                {result.formatted}
                                            </p>
                                            <Button variant="outline" size="icon" onClick={copyToClipboard} className="shrink-0 rounded-xl hover:bg-primary/10 border-primary/20">
                                                <Copy className="w-4 h-4" />
                                            </Button>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground mt-4 flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                            Calculated in {result.execution_time_ms}ms (High-speed Engine)
                                        </p>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                                {BUTTONS.flat().map((btn) => (
                                    <Button
                                        key={btn}
                                        onClick={() => handleButtonClick(btn)}
                                        variant={['=', 'C', '÷', '×', '-', '+'].includes(btn) ? 'default' : 'secondary'}
                                        className={`h-14 text-lg font-semibold rounded-xl transition-all active:scale-95 ${
                                            btn === '=' ? 'col-span-1 bg-primary hover:bg-primary/90' : 
                                            btn === 'C' ? 'text-destructive bg-destructive/10 hover:bg-destructive/20 border-destructive/20' : ''
                                        }`}
                                    >
                                        {btn}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="p-4 rounded-xl border border-border bg-muted/20">
                                <div className="flex items-center gap-2 mb-3 text-sm font-semibold">
                                    <HelpCircle className="w-4 h-4 text-primary" />
                                    Quick Tips
                                </div>
                                <ul className="space-y-2 text-xs text-muted-foreground">
                                    <li>• Enter expressions like: <code className="bg-muted px-1 rounded">sin(PI / 4) * sqrt(2)</code></li>
                                    <li>• Supports <code className="bg-muted px-1 rounded">^</code> for powers and common constants</li>
                                    <li>• All calculations are processed securely on-device</li>
                                    <li>• Use keyboard shortcuts for faster navigation</li>
                                </ul>
                            </div>
                        </div>
                        </>
                     ) : (
                        <div className="lg:col-span-3 space-y-12 py-8">
                           <div className="text-center space-y-4">
                              <h3 className="text-5xl font-black tracking-tighter">x<sup>y</sup> = n</h3>
                              <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.3em]">Solve for any variable</p>
                           </div>

                           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                              {[
                                { id: 'x', label: 'Base (x)', desc: 'Solve for Base' },
                                { id: 'y', label: 'Exponent (y)', desc: 'Solve for Power' },
                                { id: 'n', label: 'Result (n)', desc: 'Solve for Result' }
                              ].map((input) => (
                                <div key={input.id} className="p-8 rounded-[2.5rem] bg-card border-2 shadow-xl hover:border-primary/50 transition-all space-y-4">
                                   <label className="text-[10px] font-black uppercase tracking-widest text-primary">{input.label}</label>
                                   <Input 
                                      value={powerInputs[input.id as keyof typeof powerInputs]} 
                                      onChange={(e) => setPowerInputs(prev => ({ ...prev, [input.id]: e.target.value }))}
                                      className="h-16 rounded-2xl border-2 text-3xl font-black text-center"
                                   />
                                   <div className="pt-6 border-t border-dashed">
                                      <p className="text-[8px] font-black uppercase opacity-40 mb-1">{input.desc}</p>
                                      <p className="text-xl font-black text-primary">
                                         {(() => {
                                            const x = parseFloat(powerInputs.x);
                                            const y = parseFloat(powerInputs.y);
                                            const n = parseFloat(powerInputs.n);
                                            if (input.id === 'y') return (Math.log(n) / Math.log(x)).toFixed(4);
                                            if (input.id === 'x') return (Math.pow(n, 1/y)).toFixed(4);
                                            if (input.id === 'n') return (Math.pow(x, y)).toFixed(4);
                                            return '0';
                                         })()}
                                      </p>
                                   </div>
                                </div>
                              ))}
                           </div>
                        </div>
                     )}
                </div>
            </CardContent>
        </Card>
    );
}
