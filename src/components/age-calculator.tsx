'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { saveToHistory } from '@/lib/db';
import { safeInvoke, isTauri } from '@/lib/tauri-utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, Cake, Clock, Zap, History, Info, PartyPopper, Timer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatNumber } from '@/lib/utils';
import { useLanguage } from '@/context/language-context';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AgeCalculator() {
  const { t } = useLanguage();
  const [dob, setDob] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 25);
    return d.toISOString().split('T')[0];
  });
  const [includeTime, setIncludeTime] = useState(false);
  const [birthHour, setBirthHour] = useState('12');
  const [birthMinute, setBirthMinute] = useState('00');
  const [birthAmPm, setBirthAmPm] = useState('AM');
  
  const [result, setResult] = useState<any>(null);
  const [now, setNow] = useState(new Date());
  const { toast } = useToast();

  const handleCalculate = async () => {
    if (!isTauri() || !dob) return;

    try {
      let birth_time = undefined;
      if (includeTime) {
        // Pad hour and minute
        const h = birthHour.padStart(2, '0');
        const m = birthMinute.padStart(2, '0');
        birth_time = `${h}:${m} ${birthAmPm}`;
      }

      const res = await safeInvoke<any>('calculate_age', { dob, birth_time });
      setResult(res);

      await saveToHistory(
        'Age Calculator',
        'Utility',
        { dob, birth_time: includeTime ? birth_time : 'N/A' },
        { 
          age: `${res.years}y ${res.months}m ${res.days}d ${res.hours}h ${res.minutes}m`, 
          next_bday: res.days_to_birthday 
        },
        0
      );
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
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, [dob, includeTime, birthHour, birthMinute, birthAmPm]);

  return (
    <Card className="max-w-4xl mx-auto border-none shadow-2xl bg-gradient-to-br from-background via-muted/50 to-background overflow-hidden relative">
      {!isTauri() && (
        <div className="absolute inset-0 z-50 backdrop-blur-sm bg-background/20 flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-background/90 p-8 rounded-3xl shadow-2xl border-2 border-primary/20 max-w-sm">
            <Cake className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
            <h3 className="text-xl font-bold mb-2">{t('desktopRequired')}</h3>
            <p className="text-sm text-muted-foreground mb-6">
              {t('desktopRequiredDesc')}
            </p>
            <Button variant="outline" className="rounded-xl" onClick={() => window.location.reload()}>
              {t('retryDetection')}
            </Button>
          </div>
        </div>
      )}
      <CardHeader className="bg-primary/5 border-b border-primary/10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Cake className="w-6 h-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl">{t('ageTitle')}</CardTitle>
            <CardDescription>{t('ageDesc')}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-primary" />
                  {t('dobLabel')}
                </label>
                <Input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="h-14 text-xl border-2 rounded-2xl focus:ring-primary font-mono"
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/20 border-2 border-dashed border-primary/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Timer className="w-4 h-4 text-primary" />
                  </div>
                  <Label htmlFor="include-time" className="font-bold cursor-pointer">{t('includeTime')}</Label>
                </div>
                <Switch 
                  id="include-time" 
                  checked={includeTime} 
                  onCheckedChange={setIncludeTime}
                />
              </div>

              <AnimatePresence>
                {includeTime && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-3 gap-3 p-1">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase opacity-60 ml-1">{t('hour')}</Label>
                        <Select value={birthHour} onValueChange={setBirthHour}>
                          <SelectTrigger className="h-12 rounded-xl border-2">
                            <SelectValue placeholder="Hr" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
                              <SelectItem key={h} value={h.toString()}>{h}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase opacity-60 ml-1">{t('minute')}</Label>
                        <Select value={birthMinute} onValueChange={setBirthMinute}>
                          <SelectTrigger className="h-12 rounded-xl border-2">
                            <SelectValue placeholder="Min" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            {Array.from({ length: 60 }, (_, i) => i).map(m => (
                              <SelectItem key={m} value={m.toString().padStart(2, '0')}>
                                {m.toString().padStart(2, '0')}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase opacity-60 ml-1">AM/PM</Label>
                        <Select value={birthAmPm} onValueChange={setBirthAmPm}>
                          <SelectTrigger className="h-12 rounded-xl border-2">
                            <SelectValue placeholder="AM/PM" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            <SelectItem value="AM">AM</SelectItem>
                            <SelectItem value="PM">PM</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="p-5 rounded-2xl bg-muted/30 border border-border/50">
               <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
                  <Info className="w-4 h-4 text-primary" />
                  Facts
               </div>
               <div className="space-y-3">
                  <div className="flex justify-between items-center">
                     <span className="text-xs text-muted-foreground">Total Days Lived</span>
                     <span className="text-sm font-bold">{formatNumber(result?.total_days || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                     <span className="text-xs text-muted-foreground">Total Hours</span>
                     <span className="text-sm font-bold">{formatNumber(result?.total_hours || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                     <span className="text-xs text-muted-foreground">Total Minutes</span>
                     <span className="text-sm font-bold">{formatNumber(result?.total_minutes || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                     <span className="text-xs text-muted-foreground">Total Weeks</span>
                     <span className="text-sm font-bold">{result ? Math.floor(result.total_days / 7).toLocaleString() : '--'}</span>
                  </div>
               </div>
            </div>
          </div>

          <div className="space-y-6">
            <AnimatePresence mode="wait">
              {result && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-6"
                >
                  <div className="p-8 rounded-[2rem] bg-primary/5 border-2 border-primary/20 relative overflow-hidden text-center">
                     <p className="text-xs uppercase font-black tracking-[0.2em] text-primary/60 mb-2">Current Age</p>
                     <div className="flex justify-center items-end gap-3 mb-1">
                        <span className="text-6xl font-black text-primary leading-none">{result.years}</span>
                        <span className="text-xl font-bold text-primary/70 pb-1">Years</span>
                     </div>
                      <p className="text-lg font-bold text-muted-foreground">
                        {result.months} months, {result.days} days
                        {includeTime && (
                           <>
                              , <br className="md:hidden" />
                              {result.hours} hours, {result.minutes} minutes
                           </>
                        )}
                      </p>
                  </div>

                  <div className="p-6 rounded-[2rem] border-2 border-border/40 bg-card relative overflow-hidden group">
                     <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                           <PartyPopper className="w-5 h-5 text-primary" />
                           <span className="text-xs font-bold uppercase tracking-wider">Next Birthday</span>
                        </div>
                        <div className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase">
                           Countdown
                        </div>
                     </div>
                     
                     <div className="flex items-end gap-2">
                        <span className="text-4xl font-black">{formatNumber(result.days_to_birthday)}</span>
                        <span className="text-sm font-bold text-muted-foreground pb-1.5">days to go</span>
                     </div>
                     
                     <div className="mt-4 h-2 w-full bg-muted rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.max(0, 100 - (result.days_to_birthday / 3.65))}%` }}
                          className="h-full bg-primary"
                        />
                     </div>
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
