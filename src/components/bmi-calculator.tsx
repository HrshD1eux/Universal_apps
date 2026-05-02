'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Scale, MoveVertical, Activity, Info, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { safeInvoke, isTauri } from '@/lib/tauri-utils';
import { useToast } from '@/hooks/use-toast';

export default function BMICalculator() {
  const [weight, setWeight] = useState('70');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lb'>('kg');
  
  const [heightCm, setHeightCm] = useState('175');
  const [heightFeet, setHeightFeet] = useState('5');
  const [heightInches, setHeightInches] = useState('9');
  const [heightUnit, setHeightUnit] = useState<'cm' | 'ft'>('cm');

  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const handleCalculate = async () => {
    if (!isTauri()) return;

    try {
        let w = parseFloat(weight);
        if (!w) return;

        // Convert weight to kg for calculation
        if (weightUnit === 'lb') {
            w = w * 0.453592;
        }

        let h_cm; 
        if (heightUnit === 'cm') {
            h_cm = parseFloat(heightCm);
        } else {
            const totalInches = (parseFloat(heightFeet) || 0) * 12 + (parseFloat(heightInches) || 0);
            h_cm = totalInches * 2.54;
        }

        if (!h_cm) return;

        const res = await safeInvoke<any>('calculate_bmi', {
            weight: w,
            heightCm: h_cm
        });

        setResult({
            ...res,
            color: res.category === 'Healthy Weight' ? 'text-green-500' : (res.category === 'Underweight' ? 'text-blue-500' : (res.category === 'Overweight' ? 'text-amber-500' : 'text-red-500')),
            percent: Math.min(Math.max((res.bmi / 40) * 100, 0), 100)
        });
    } catch (err) {
        toast({
            title: "Calculation Error",
            description: err instanceof Error ? err.message : String(err),
            variant: "destructive"
        });
    }
  };

  useEffect(() => {
    handleCalculate();
  }, [weight, weightUnit, heightCm, heightFeet, heightInches, heightUnit]);

  return (
    <Card className="max-w-4xl mx-auto border-none shadow-2xl bg-gradient-to-br from-background via-muted/50 to-background overflow-hidden relative">
      <CardHeader className="bg-primary/5 border-b border-primary/10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Heart className="w-6 h-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl">BMI Calculator</CardTitle>
            <CardDescription>Assess your body weight relative to your height.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            {/* Weight Input */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <Scale className="w-4 h-4 text-primary" />
                  Weight
                </label>
                <div className="flex bg-muted p-1 rounded-lg h-8">
                  <button 
                    onClick={() => setWeightUnit('kg')}
                    className={`px-3 rounded-md text-[10px] font-bold transition-all ${weightUnit === 'kg' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground'}`}
                  >
                    KG
                  </button>
                  <button 
                    onClick={() => setWeightUnit('lb')}
                    className={`px-3 rounded-md text-[10px] font-bold transition-all ${weightUnit === 'lb' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground'}`}
                  >
                    LB
                  </button>
                </div>
              </div>
              <Input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="h-14 text-2xl border-2 rounded-2xl focus:ring-primary font-mono"
              />
            </div>
            
            {/* Height Input */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <MoveVertical className="w-4 h-4 text-primary" />
                  Height
                </label>
                <div className="flex bg-muted p-1 rounded-lg h-8">
                  <button 
                    onClick={() => setHeightUnit('cm')}
                    className={`px-3 rounded-md text-[10px] font-bold transition-all ${heightUnit === 'cm' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground'}`}
                  >
                    CM
                  </button>
                  <button 
                    onClick={() => setHeightUnit('ft')}
                    className={`px-3 rounded-md text-[10px] font-bold transition-all ${heightUnit === 'ft' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground'}`}
                  >
                    FT+IN
                  </button>
                </div>
              </div>
              
              {heightUnit === 'cm' ? (
                <div className="relative">
                  <Input
                    type="number"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                    className="h-14 text-2xl border-2 rounded-2xl focus:ring-primary font-mono pr-12"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">cm</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <Input
                      type="number"
                      value={heightFeet}
                      onChange={(e) => setHeightFeet(e.target.value)}
                      className="h-14 text-2xl border-2 rounded-2xl focus:ring-primary font-mono pr-10"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">ft</span>
                  </div>
                  <div className="relative">
                    <Input
                      type="number"
                      value={heightInches}
                      onChange={(e) => setHeightInches(e.target.value)}
                      className="h-14 text-2xl border-2 rounded-2xl focus:ring-primary font-mono pr-10"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">in</span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex gap-3">
                <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  BMI is calculated using standardized formulas. You can mix units (e.g., LB weight and CM height) for your convenience.
                </p>
            </div>
          </div>

          <div className="space-y-8">
            <AnimatePresence mode="wait">
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center space-y-6"
                >
                  <div className="relative inline-block">
                    <div className="text-5xl sm:text-7xl font-black tracking-tighter text-primary">
                      {result.bmi}
                    </div>
                    <div className={`mt-2 text-sm font-bold uppercase tracking-widest ${result.color}`}>
                      {result.category}
                    </div>
                  </div>

                  <div className="space-y-3">
                     <div className="h-4 w-full bg-muted rounded-full overflow-hidden flex shadow-inner">
                        <div className="h-full bg-blue-500/30 w-[18.5%]" />
                        <div className="h-full bg-green-500/30 w-[6.5%]" />
                        <div className="h-full bg-amber-500/30 w-[5%]" />
                        <div className="h-full bg-red-500/30 w-[70%]" />
                     </div>
                     <div className="relative h-2 w-full">
                        <motion.div 
                          initial={{ left: 0 }}
                          animate={{ left: `${result.percent}%` }}
                          className="absolute top-0 -mt-3 transform -translate-x-1/2"
                        >
                           <div className="w-0.5 h-6 bg-primary shadow-xl" />
                        </motion.div>
                     </div>
                     <div className="flex justify-between text-[10px] font-bold text-muted-foreground opacity-50 px-1">
                        <span>18.5</span>
                        <span>25</span>
                        <span>30</span>
                        <span>40+</span>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                     {result.category === 'Healthy Weight' ? (
                       <div className="flex items-center gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-700 text-xs text-left">
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          You are within the healthy range for your height.
                       </div>
                     ) : (
                       <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 text-xs text-left">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          Consult with a healthcare provider for a detailed assessment.
                       </div>
                     )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
