'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Copy, RefreshCcw, Zap, Key, Lock, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/language-context';

export default function PasswordGenerator() {
  const [length, setLength] = useState(16);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [password, setPassword] = useState('');
  const [strength, setStrength] = useState(0);
  const [copied, setCopied] = useState(false);
  const { t } = useLanguage();
  const { toast } = useToast();

  const generatePassword = () => {
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+~`|}{[]:;?><,./-=';
    
    let chars = lower;
    if (includeUppercase) chars += upper;
    if (includeNumbers) chars += numbers;
    if (includeSymbols) chars += symbols;
    
    let generated = '';
    const array = new Uint32Array(length);
    window.crypto.getRandomValues(array);
    
    for (let i = 0; i < length; i++) {
      generated += chars[array[i] % chars.length];
    }
    
    setPassword(generated);
    calculateStrength(generated);
  };

  const calculateStrength = (pwd: string) => {
    let s = 0;
    if (pwd.length > 8) s += 1;
    if (pwd.length > 12) s += 1;
    if (/[A-Z]/.test(pwd)) s += 1;
    if (/[0-9]/.test(pwd)) s += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) s += 1;
    setStrength(s);
  };

  useEffect(() => {
    generatePassword();
  }, [length, includeUppercase, includeNumbers, includeSymbols]);

  const handleCopy = () => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    toast({ title: "Password Copied", description: "Securely added to your clipboard." });
    setTimeout(() => setCopied(false), 2000);
  };

  const strengthColor = strength <= 2 ? 'bg-red-500' : strength <= 4 ? 'bg-yellow-500' : 'bg-green-500';
  const strengthText = strength <= 2 ? 'Weak' : strength <= 4 ? 'Strong' : 'Very Secure';

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Card className="border-none shadow-2xl bg-gradient-to-br from-background via-muted/50 to-background overflow-hidden">
        <CardHeader className="bg-primary/5 border-b border-primary/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-500/10 rounded-lg">
              <ShieldCheck className="w-6 h-6 text-slate-600" />
            </div>
            <div>
              <CardTitle className="text-2xl">{t('passwordTitle')}</CardTitle>
              <CardDescription>{t('passwordDesc')}</CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr,1fr] gap-12">
            {/* Controls */}
            <div className="space-y-8">
              <div className="space-y-4">
                 <div className="flex justify-between items-center">
                    <label className="text-sm font-bold uppercase tracking-wider opacity-60">{t('length')}</label>
                    <Input 
                      type="number" 
                      value={length} 
                      onChange={(e) => setLength(Math.min(999, parseInt(e.target.value) || 4))}
                      className="w-20 h-10 text-xl font-black text-primary text-center bg-transparent border-none focus-visible:ring-0"
                    />
                 </div>
                 <Slider 
                    value={[length]} 
                    onValueChange={(v) => setLength(v[0])} 
                    max={999} 
                    min={4} 
                    step={1} 
                    className="py-4"
                 />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <ToggleOption 
                    label={t('uppercase')} 
                    checked={includeUppercase} 
                    onChange={setIncludeUppercase} 
                 />
                 <ToggleOption 
                    label={t('numbers')} 
                    checked={includeNumbers} 
                    onChange={setIncludeNumbers} 
                 />
                 <ToggleOption 
                    label={t('symbols')} 
                    checked={includeSymbols} 
                    onChange={setIncludeSymbols} 
                 />
              </div>

              <div className="p-6 rounded-[2rem] bg-primary/5 border-2 border-dashed border-primary/20 space-y-4">
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-xl">
                       <Zap className="w-5 h-5 text-primary" />
                    </div>
                    <p className="text-xs font-bold text-muted-foreground leading-relaxed">
                       Passwords are generated locally on your machine using cryptographically secure random numbers.
                    </p>
                 </div>
              </div>
            </div>

            {/* Result */}
            <div className="flex flex-col justify-center space-y-6">
              <div className="relative group">
                 <div className="absolute inset-0 bg-primary/5 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                 <div 
                   className="relative p-8 rounded-[2.5rem] bg-card border-2 shadow-xl text-center break-all font-mono font-black min-h-[160px] flex items-center justify-center transition-all duration-300"
                   style={{ 
                     fontSize: length > 128 ? '0.75rem' : length > 64 ? '1rem' : length > 32 ? '1.25rem' : '1.5rem',
                     lineHeight: '1.2'
                   }}
                 >
                    {password}
                 </div>
              </div>

              <div className="space-y-2">
                 <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em] opacity-60 px-1">
                    <span>Strength</span>
                    <span>{strengthText}</span>
                 </div>
                 <div className="h-3 w-full bg-muted rounded-full overflow-hidden flex gap-1 p-0.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                       <div 
                        key={i} 
                        className={`h-full flex-1 rounded-full transition-all duration-500 ${i <= strength ? strengthColor : 'bg-muted-foreground/10'}`} 
                       />
                    ))}
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <Button onClick={generatePassword} size="lg" className="h-14 rounded-2xl gap-2 font-black">
                    <RefreshCcw className="w-5 h-5" /> {t('generate')}
                 </Button>
                 <Button onClick={handleCopy} variant="outline" size="lg" className={`h-14 rounded-2xl gap-2 font-black transition-all ${copied ? 'border-green-500 text-green-600' : ''}`}>
                    {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    {copied ? 'COPIED!' : t('copy')}
                 </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ToggleOption({ label, checked, onChange }: { label: string, checked: boolean, onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/20 border-2 border-border/40 hover:border-primary/30 transition-all cursor-pointer" onClick={() => onChange(!checked)}>
       <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
       <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
