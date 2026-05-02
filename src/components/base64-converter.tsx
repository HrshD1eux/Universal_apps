'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Copy, Trash2, ArrowRightLeft, FileCode2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/language-context';

export default function Base64Converter() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const { t } = useLanguage();
  const { toast } = useToast();

  const handleEncode = () => {
    if (!input) return;
    try {
      setOutput(btoa(input));
      toast({ title: "Encoded", description: "Successfully encoded to Base64." });
    } catch (e) {
      toast({ title: "Encoding Failed", description: "Invalid string for Base64 encoding.", variant: "destructive" });
    }
  };

  const handleDecode = () => {
    if (!input) return;
    try {
      setOutput(atob(input));
      toast({ title: "Decoded", description: "Successfully decoded from Base64." });
    } catch (e) {
      toast({ title: "Decoding Failed", description: "Invalid Base64 string.", variant: "destructive" });
    }
  };

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    toast({ title: "Copied", description: "Result copied to clipboard." });
  };

  const clearAll = () => {
    setInput('');
    setOutput('');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <Card className="border-none shadow-2xl bg-card/80 backdrop-blur-xl border-2 border-primary/5 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-md">
                <FileCode2 className="w-8 h-8" />
              </div>
              <div>
                <CardTitle className="text-3xl font-black tracking-tight">{t('base64Title' as any) || 'Base64 Converter'}</CardTitle>
                <CardDescription className="text-white/70 font-bold">{t('base64Desc' as any) || 'Encode and decode Base64 strings safely.'}</CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="space-y-4">
               <div className="flex items-center justify-between">
                 <label className="text-sm font-black uppercase tracking-widest text-primary/60">Input</label>
                 <Button variant="ghost" size="sm" onClick={() => setInput('')} className="h-8 text-xs font-bold text-muted-foreground hover:text-red-500">
                    CLEAR
                 </Button>
               </div>
               <Textarea 
                 value={input}
                 onChange={(e) => setInput(e.target.value)}
                 placeholder="Type or paste your text here..."
                 className="min-h-[300px] resize-none rounded-2xl border-2 focus:ring-0 focus:border-indigo-500 p-6 text-lg bg-muted/30"
               />
             </div>
             
             <div className="space-y-4">
               <div className="flex items-center justify-between">
                 <label className="text-sm font-black uppercase tracking-widest text-primary/60">Output</label>
                 <Button variant="ghost" size="sm" onClick={handleCopy} className="h-8 text-xs font-bold text-indigo-600 hover:bg-indigo-50" disabled={!output}>
                    <Copy className="w-4 h-4 mr-2" /> COPY
                 </Button>
               </div>
               <Textarea 
                 value={output}
                 readOnly
                 placeholder="Result will appear here..."
                 className="min-h-[300px] resize-none rounded-2xl border-2 border-indigo-500/20 bg-indigo-50/30 dark:bg-indigo-950/20 p-6 text-lg font-mono focus:ring-0"
               />
             </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 bg-muted/50 p-6 rounded-3xl border-2">
            <Button onClick={handleEncode} className="h-14 px-8 rounded-2xl font-black gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20">
               ENCODE TO BASE64 <ArrowRightLeft className="w-5 h-5" />
            </Button>
            <Button onClick={handleDecode} variant="outline" className="h-14 px-8 rounded-2xl font-black gap-2 border-2 border-blue-600/20 text-blue-600 hover:bg-blue-50">
               <ArrowRightLeft className="w-5 h-5" /> DECODE FROM BASE64
            </Button>
            <Button onClick={clearAll} variant="ghost" className="h-14 px-8 rounded-2xl font-black gap-2 text-red-500 hover:bg-red-50 hover:text-red-600">
               <Trash2 className="w-5 h-5" /> CLEAR ALL
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
