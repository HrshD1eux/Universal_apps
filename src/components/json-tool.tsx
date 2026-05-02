'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { motion, AnimatePresence } from 'framer-motion';
import { Code2, Copy, Trash2, Download, FileJson, Sparkles, Check, AlertCircle, FileDown, Scissors } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/language-context';

export default function JsonTool() {
  const [json, setJson] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { t } = useLanguage();
  const { toast } = useToast();

  const handleAction = (action: 'format' | 'minify' | 'validate') => {
    if (!json) return;
    try {
      const parsed = JSON.parse(json);
      if (action === 'format') setJson(JSON.stringify(parsed, null, 2));
      if (action === 'minify') setJson(JSON.stringify(parsed));
      setError(null);
      if (action === 'validate') {
         toast({ title: "Valid JSON", description: "Your JSON structure is perfect." });
      }
    } catch (e: any) {
      setError(e.message);
      toast({ title: "Invalid JSON", description: e.message, variant: "destructive" });
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(json);
    toast({ title: "Copied", description: "JSON copied to clipboard." });
  };

  const handleExport = () => {
    if (!json) return;
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: "Exported", description: "data.json has been downloaded." });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <Card className="border-none shadow-2xl bg-card/80 backdrop-blur-xl border-2 border-primary/5 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary to-primary/80 text-white p-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-md">
                <Code2 className="w-8 h-8" />
              </div>
              <div>
                <CardTitle className="text-3xl font-black tracking-tight">{t('jsonTitle')}</CardTitle>
                <CardDescription className="text-white/70 font-bold">{t('jsonDesc')}</CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
               <Button variant="secondary" className="rounded-xl h-12 px-6 gap-2 font-black shadow-lg" onClick={handleExport} disabled={!json}>
                  <Download className="w-4 h-4" /> {t('export' as any) || 'EXPORT'}
               </Button>
               <Button variant="destructive" className="rounded-xl h-12 px-6 gap-2 font-black shadow-lg" onClick={() => setJson('')}>
                  <Trash2 className="w-4 h-4" /> CLEAR
               </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-8">
          <div className="grid grid-cols-1 gap-8">
            <div className="relative group">
               <div className={`absolute -inset-1 rounded-[2.5rem] blur transition-opacity ${error ? 'bg-red-500/20 opacity-100' : 'bg-primary/10 opacity-10'}`} />
               <Textarea
                  value={json}
                  onChange={(e) => { setJson(e.target.value); setError(null); }}
                  placeholder='{ "key": "value" }'
                  className="min-h-[600px] text-lg border-2 rounded-[2rem] p-10 focus:ring-0 font-mono focus:border-primary/50 resize-none shadow-inner bg-slate-900 text-primary-foreground relative z-10 scrollbar-hide"
               />
               <div className="absolute top-6 right-6 flex gap-2 z-20">
                  <Button size="sm" variant="ghost" className="rounded-xl bg-white/5 text-white hover:bg-white/10" onClick={handleCopy}>
                     <Copy className="w-4 h-4" />
                  </Button>
               </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-6 p-6 rounded-[2.5rem] bg-muted/30 border-2">
               <div className="flex flex-wrap gap-3">
                  <Button onClick={() => handleAction('format')} className="rounded-2xl gap-2 font-black h-14 px-8 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                     <Sparkles className="w-4 h-4" /> PRETTIFY
                  </Button>
                  <Button onClick={() => handleAction('minify')} variant="outline" className="rounded-2xl gap-2 font-black h-14 px-8 border-2 border-primary/20 text-primary">
                     <Scissors className="w-4 h-4" /> MINIFY
                  </Button>
                  <Button onClick={() => handleAction('validate')} variant="outline" className="rounded-2xl gap-2 font-black h-14 px-8 border-2 border-emerald-500/20 text-emerald-700">
                     <Check className="w-4 h-4" /> VALIDATE
                  </Button>
               </div>

               <AnimatePresence>
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex items-center gap-3 text-red-500 bg-red-50 px-6 py-3 rounded-2xl border border-red-200"
                    >
                       <AlertCircle className="w-5 h-5" />
                       <span className="text-xs font-black uppercase tracking-tight line-clamp-1">{error}</span>
                    </motion.div>
                  )}
               </AnimatePresence>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="p-8 rounded-[2.5rem] bg-card border-2 border-primary/5 flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-2xl text-primary">
               <FileJson className="w-6 h-6" />
            </div>
            <div>
               <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Parser</p>
               <p className="font-bold">Standard V8 Engine</p>
            </div>
         </div>
         <div className="p-8 rounded-[2.5rem] bg-card border-2 border-emerald-500/5 flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-600">
               <Check className="w-6 h-6" />
            </div>
            <div>
               <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Validation</p>
               <p className="font-bold">Real-time Syntax Check</p>
            </div>
         </div>
         <div className="p-8 rounded-[2.5rem] bg-card border-2 border-blue-500/5 flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-600">
               <FileDown className="w-6 h-6" />
            </div>
            <div>
               <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Output</p>
               <p className="font-bold">Local File Download</p>
            </div>
         </div>
      </div>
    </div>
  );
}
