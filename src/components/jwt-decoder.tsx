'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Copy, Trash2, Key, ShieldAlert } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/language-context';

export default function JwtDecoder() {
  const [token, setToken] = useState('');
  const [header, setHeader] = useState('');
  const [payload, setPayload] = useState('');
  const [error, setError] = useState('');
  const { t } = useLanguage();
  const { toast } = useToast();

  const parseJwt = (token: string) => {
    try {
      if (!token) {
        setHeader('');
        setPayload('');
        setError('');
        return;
      }
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT structure. Must have 3 parts separated by dots.');
      }
      
      const decodeBase64Url = (str: string) => {
        let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
        const pad = base64.length % 4;
        if (pad) {
          if (pad === 1) throw new Error('Invalid base64 string.');
          base64 += new Array(5 - pad).join('=');
        }
        return decodeURIComponent(escape(atob(base64)));
      };

      const decodedHeader = JSON.parse(decodeBase64Url(parts[0]));
      const decodedPayload = JSON.parse(decodeBase64Url(parts[1]));
      
      setHeader(JSON.stringify(decodedHeader, null, 2));
      setPayload(JSON.stringify(decodedPayload, null, 2));
      setError('');
    } catch (e: any) {
      setError(e.message || 'Failed to parse JWT');
      setHeader('');
      setPayload('');
    }
  };

  const handleTokenChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value.trim();
    setToken(val);
    parseJwt(val);
  };

  const handleCopy = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: "JSON copied to clipboard." });
  };

  const clearAll = () => {
    setToken('');
    setHeader('');
    setPayload('');
    setError('');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <Card className="border-none shadow-2xl bg-card/80 backdrop-blur-xl border-2 border-primary/5 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-md">
                <Key className="w-8 h-8" />
              </div>
              <div>
                <CardTitle className="text-3xl font-black tracking-tight">{t('jwtTitle' as any) || 'JWT Decoder'}</CardTitle>
                <CardDescription className="text-white/70 font-bold">{t('jwtDesc' as any) || 'Decode JSON Web Tokens securely on the client.'}</CardDescription>
              </div>
            </div>
            <Button onClick={clearAll} variant="ghost" className="h-12 px-6 rounded-xl font-black gap-2 text-white hover:bg-white/20">
               <Trash2 className="w-4 h-4" /> CLEAR
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-8 space-y-8">
          
          <div className="space-y-4 relative">
             <label className="text-sm font-black uppercase tracking-widest text-primary/60">JWT String</label>
             <Textarea 
               value={token}
               onChange={handleTokenChange}
               placeholder="Paste your JWT here (eyJhbGci...)"
               className={`min-h-[150px] resize-none rounded-2xl border-2 p-6 text-lg font-mono break-all focus:ring-0 ${error ? 'border-red-500/50 bg-red-50/10' : 'focus:border-purple-500 bg-muted/30'}`}
             />
             {error && (
               <div className="absolute -bottom-6 left-2 flex items-center gap-2 text-xs font-bold text-red-500">
                 <ShieldAlert className="w-4 h-4" /> {error}
               </div>
             )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
             {/* Header */}
             <div className="space-y-4">
               <div className="flex items-center justify-between">
                 <label className="text-sm font-black uppercase tracking-widest text-red-500">Header <span className="text-muted-foreground">(Algorithm & Token Type)</span></label>
                 <Button variant="ghost" size="sm" onClick={() => handleCopy(header)} className="h-8 text-xs font-bold text-red-600 hover:bg-red-50" disabled={!header}>
                    <Copy className="w-4 h-4 mr-2" /> COPY
                 </Button>
               </div>
               <Textarea 
                 value={header}
                 readOnly
                 className="min-h-[250px] resize-none rounded-2xl border-2 border-red-500/20 bg-red-50/30 dark:bg-red-950/20 p-6 text-sm font-mono text-red-700 dark:text-red-300 focus:ring-0"
               />
             </div>
             
             {/* Payload */}
             <div className="space-y-4">
               <div className="flex items-center justify-between">
                 <label className="text-sm font-black uppercase tracking-widest text-purple-600">Payload <span className="text-muted-foreground">(Data)</span></label>
                 <Button variant="ghost" size="sm" onClick={() => handleCopy(payload)} className="h-8 text-xs font-bold text-purple-600 hover:bg-purple-50" disabled={!payload}>
                    <Copy className="w-4 h-4 mr-2" /> COPY
                 </Button>
               </div>
               <Textarea 
                 value={payload}
                 readOnly
                 className="min-h-[250px] resize-none rounded-2xl border-2 border-purple-500/20 bg-purple-50/30 dark:bg-purple-950/20 p-6 text-sm font-mono text-purple-700 dark:text-purple-300 focus:ring-0"
               />
             </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
