'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Utensils, Flame, Zap, Scale, Heart, Info } from 'lucide-react';
import { useLanguage } from '@/context/language-context';

export default function BmrCalculator() {
  const [weight, setWeight] = useState('70');
  const [height, setHeight] = useState('170');
  const [age, setAge] = useState('25');
  const [gender, setGender] = useState('male');
  const [activity, setActivity] = useState('1.2');
  const [result, setResult] = useState<any>(null);
  const { t } = useLanguage();

  const calculate = () => {
    const w = parseFloat(weight);
    const h = parseFloat(height);
    const a = parseFloat(age);
    if (isNaN(w) || isNaN(h) || isNaN(a)) return;

    // Mifflin-St Jeor Equation
    let bmr = (10 * w) + (6.25 * h) - (5 * a);
    bmr = gender === 'male' ? bmr + 5 : bmr - 161;

    const tdee = bmr * parseFloat(activity);

    setResult({
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      lose: Math.round(tdee - 500),
      gain: Math.round(tdee + 500)
    });
  };

  useEffect(() => {
    calculate();
  }, [weight, height, age, gender, activity]);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <Card className="border-none shadow-2xl bg-gradient-to-br from-background via-muted/50 to-background overflow-hidden">
        <CardHeader className="bg-primary/5 border-b border-primary/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-500/10 rounded-lg">
              <Activity className="w-6 h-6 text-rose-600" />
            </div>
            <div>
              <CardTitle className="text-2xl">{t('bmrTitle')}</CardTitle>
              <CardDescription>{t('bmrDesc')}</CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr,1.2fr] gap-12">
            <div className="space-y-6">
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <label className="text-sm font-bold opacity-60 uppercase tracking-widest ml-1">Gender</label>
                     <Select value={gender} onValueChange={setGender}>
                        <SelectTrigger className="h-12 rounded-2xl border-2">
                           <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                           <SelectItem value="male">{t('male')}</SelectItem>
                           <SelectItem value="female">{t('female')}</SelectItem>
                        </SelectContent>
                     </Select>
                  </div>
                  <div className="space-y-2">
                     <label className="text-sm font-bold opacity-60 uppercase tracking-widest ml-1">Age</label>
                     <Input 
                        type="number" 
                        value={age} 
                        onChange={(e) => setAge(e.target.value)} 
                        className="h-12 rounded-2xl border-2 font-mono text-lg"
                     />
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <label className="text-sm font-bold opacity-60 uppercase tracking-widest ml-1">Weight (kg)</label>
                     <Input 
                        type="number" 
                        value={weight} 
                        onChange={(e) => setWeight(e.target.value)} 
                        className="h-12 rounded-2xl border-2 font-mono text-lg"
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-sm font-bold opacity-60 uppercase tracking-widest ml-1">Height (cm)</label>
                     <Input 
                        type="number" 
                        value={height} 
                        onChange={(e) => setHeight(e.target.value)} 
                        className="h-12 rounded-2xl border-2 font-mono text-lg"
                     />
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-sm font-bold opacity-60 uppercase tracking-widest ml-1">{t('activityLevel')}</label>
                  <Select value={activity} onValueChange={setActivity}>
                     <SelectTrigger className="h-12 rounded-2xl border-2">
                        <SelectValue />
                     </SelectTrigger>
                     <SelectContent>
                        <SelectItem value="1.2">Sedentary (Little/no exercise)</SelectItem>
                        <SelectItem value="1.375">Light (1-3 days/week)</SelectItem>
                        <SelectItem value="1.55">Moderate (3-5 days/week)</SelectItem>
                        <SelectItem value="1.725">Very Active (6-7 days/week)</SelectItem>
                        <SelectItem value="1.9">Extra Active (Physical job)</SelectItem>
                     </SelectContent>
                  </Select>
               </div>

               <div className="p-6 rounded-[2rem] bg-rose-500/5 border-2 border-dashed border-rose-500/20 space-y-4">
                  <div className="flex gap-4">
                     <Info className="w-5 h-5 text-rose-600 shrink-0 mt-1" />
                     <p className="text-xs text-muted-foreground leading-relaxed">
                        BMR represents the calories you burn at complete rest. TDEE includes your physical activity level.
                     </p>
                  </div>
               </div>
            </div>

            {/* Results */}
            <div className="space-y-6">
               <AnimatePresence mode="wait">
                  {result && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="space-y-6"
                    >
                       <div className="p-8 rounded-[2.5rem] bg-rose-600 text-white shadow-2xl shadow-rose-500/20 relative overflow-hidden group">
                          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform">
                             <Flame className="w-32 h-32" />
                          </div>
                          <p className="text-xs uppercase font-black tracking-widest opacity-60 mb-2">Total Daily Energy Expenditure</p>
                          <p className="text-5xl font-black mb-1">{result.tdee}</p>
                          <p className="text-sm font-bold opacity-80">Calories / Day</p>
                       </div>

                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <ResultCard label="BMR" value={result.bmr} icon={<Zap className="w-5 h-5" />} color="blue" />
                          <ResultCard label="Weight Loss" value={result.lose} icon={<Scale className="w-5 h-5" />} color="emerald" sub="-500 cal" />
                          <ResultCard label="Weight Gain" value={result.gain} icon={<Utensils className="w-5 h-5" />} color="orange" sub="+500 cal" />
                          <ResultCard label="Maintenance" value={result.tdee} icon={<Heart className="w-5 h-5" />} color="rose" />
                       </div>
                    </motion.div>
                  )}
               </AnimatePresence>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ResultCard({ label, value, icon, color, sub }: { label: string, value: number, icon: React.ReactNode, color: string, sub?: string }) {
  return (
    <div className="p-6 rounded-[2rem] border-2 bg-card relative overflow-hidden group hover:border-primary/30 transition-all">
       <div className={`w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center mb-3 text-primary`}>
          {icon}
       </div>
       <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest mb-1">{label}</p>
       <div className="flex items-baseline gap-2">
          <p className="text-2xl font-black">{value}</p>
          <span className="text-[10px] font-bold opacity-40">cal</span>
       </div>
       {sub && <p className="text-[10px] font-bold text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}
