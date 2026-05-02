'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';
import { Stethoscope, Ruler, Scale, Heart, Info, InfoIcon } from 'lucide-react';
import { useLanguage } from '@/context/language-context';

export default function BodyFatCalculator() {
  const [gender, setGender] = useState('male');
  const [height, setHeight] = useState('175');
  const [neck, setNeck] = useState('40');
  const [waist, setWaist] = useState('90');
  const [hip, setHip] = useState('95'); // For females
  const [result, setResult] = useState<any>(null);
  const { t } = useLanguage();

  const calculate = () => {
    const h = parseFloat(height);
    const n = parseFloat(neck);
    const w = parseFloat(waist);
    const hp = parseFloat(hip);

    if (isNaN(h) || isNaN(n) || isNaN(w)) return;

    let bodyFat = 0;
    if (gender === 'male') {
      // US Navy Method for Men
      bodyFat = 495 / (1.0324 - 0.19077 * Math.log10(w - n) + 0.15456 * Math.log10(h)) - 450;
    } else {
      // US Navy Method for Women
      bodyFat = 495 / (1.29579 - 0.35004 * Math.log10(w + hp - n) + 0.22100 * Math.log10(h)) - 450;
    }

    if (bodyFat < 0) bodyFat = 0;

    let category = '';
    if (gender === 'male') {
      if (bodyFat < 6) category = 'Essential Fat';
      else if (bodyFat < 14) category = 'Athletes';
      else if (bodyFat < 18) category = 'Fitness';
      else if (bodyFat < 25) category = 'Average';
      else category = 'Obese';
    } else {
      if (bodyFat < 14) category = 'Essential Fat';
      else if (bodyFat < 21) category = 'Athletes';
      else if (bodyFat < 25) category = 'Fitness';
      else if (bodyFat < 32) category = 'Average';
      else category = 'Obese';
    }

    setResult({
      percentage: bodyFat.toFixed(1),
      category
    });
  };

  useEffect(() => {
    calculate();
  }, [gender, height, neck, waist, hip]);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <Card className="border-none shadow-2xl bg-gradient-to-br from-background via-muted/50 to-background overflow-hidden">
        <CardHeader className="bg-primary/5 border-b border-primary/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <Stethoscope className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <CardTitle className="text-2xl">{t('bodyFatTitle')}</CardTitle>
              <CardDescription>{t('bodyFatDesc')}</CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr,1.2fr] gap-12">
            <div className="space-y-6">
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

               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <label className="text-sm font-bold opacity-60 uppercase tracking-widest ml-1">{t('neck')}</label>
                     <Input 
                        type="number" 
                        value={neck} 
                        onChange={(e) => setNeck(e.target.value)} 
                        className="h-12 rounded-2xl border-2 font-mono text-lg"
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-sm font-bold opacity-60 uppercase tracking-widest ml-1">{t('waist')}</label>
                     <Input 
                        type="number" 
                        value={waist} 
                        onChange={(e) => setWaist(e.target.value)} 
                        className="h-12 rounded-2xl border-2 font-mono text-lg"
                     />
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <label className="text-sm font-bold opacity-60 uppercase tracking-widest ml-1">Height (cm)</label>
                     <Input 
                        type="number" 
                        value={height} 
                        onChange={(e) => setHeight(e.target.value)} 
                        className="h-12 rounded-2xl border-2 font-mono text-lg"
                     />
                  </div>
                  {gender === 'female' && (
                    <div className="space-y-2">
                       <label className="text-sm font-bold opacity-60 uppercase tracking-widest ml-1">{t('hip')}</label>
                       <Input 
                          type="number" 
                          value={hip} 
                          onChange={(e) => setHip(e.target.value)} 
                          className="h-12 rounded-2xl border-2 font-mono text-lg"
                       />
                    </div>
                  )}
               </div>

               <div className="p-6 rounded-[2rem] bg-red-500/5 border-2 border-dashed border-red-500/20 space-y-4">
                  <div className="flex gap-4">
                     <InfoIcon className="w-5 h-5 text-red-600 shrink-0 mt-1" />
                     <p className="text-xs text-muted-foreground leading-relaxed">
                        The US Navy Method provides an estimate of body fat percentage based on circumferences. Ensure you measure at the widest points.
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
                       <div className="p-10 rounded-[3rem] bg-gradient-to-br from-red-600 to-rose-700 text-white shadow-2xl shadow-red-500/20 text-center relative overflow-hidden group">
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.2),transparent)] opacity-50" />
                          <p className="text-xs uppercase font-black tracking-[0.2em] opacity-60 mb-2">Estimated Body Fat</p>
                          <div className="flex justify-center items-end gap-2 mb-2">
                             <span className="text-7xl font-black">{result.percentage}</span>
                             <span className="text-2xl font-bold opacity-60 pb-2">%</span>
                          </div>
                          <div className="inline-block px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-sm font-black uppercase tracking-widest">
                             {result.category}
                          </div>
                       </div>

                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="p-6 rounded-[2rem] border-2 bg-card relative overflow-hidden group">
                             <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center mb-3 text-primary">
                                <Heart className="w-5 h-5" />
                             </div>
                             <p className="text-[10px] font-black uppercase opacity-60 tracking-widest mb-1">Health Impact</p>
                             <p className="text-sm font-bold leading-tight">
                                {result.category === 'Obese' ? 'Increased risk of metabolic diseases.' : 'Healthy body composition range.'}
                             </p>
                          </div>
                          <div className="p-6 rounded-[2rem] border-2 bg-card relative overflow-hidden group">
                             <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center mb-3 text-primary">
                                <Ruler className="w-5 h-5" />
                             </div>
                             <p className="text-[10px] font-black uppercase opacity-60 tracking-widest mb-1">Method</p>
                             <p className="text-sm font-bold leading-tight">US Navy Circumference Formula</p>
                          </div>
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
