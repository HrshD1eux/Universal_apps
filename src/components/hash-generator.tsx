'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Copy, Trash2, Fingerprint, ShieldAlert } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/language-context';

export default function HashGenerator() {
  const [input, setInput] = useState('');
  const [hashes, setHashes] = useState({ sha1: '', sha256: '', sha384: '', sha512: '' });
  const { t } = useLanguage();
  const { toast } = useToast();

  useEffect(() => {
    generateHashes(input);
  }, [input]);

  const generateHashes = async (text: string) => {
    if (!text) {
      setHashes({ sha1: '', sha256: '', sha384: '', sha512: '' });
      return;
    }
    
    const enc = new TextEncoder();
    const data = enc.encode(text);
    
    try {
      const [sha1Buf, sha256Buf, sha384Buf, sha512Buf] = await Promise.all([
        crypto.subtle.digest('SHA-1', data),
        crypto.subtle.digest('SHA-256', data),
        crypto.subtle.digest('SHA-384', data),
        crypto.subtle.digest('SHA-512', data)
      ]);

      const bufToHex = (buf: ArrayBuffer) => {
        return Array.from(new Uint8Array(buf))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
      };

      setHashes({
        sha1: bufToHex(sha1Buf),
        sha256: bufToHex(sha256Buf),
        sha384: bufToHex(sha384Buf),
        sha512: bufToHex(sha512Buf)
      });
    } catch (e) {
      console.error("Hash generation failed", e);
    }
  };

  const handleCopy = (text: string, type: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: `${type} copied to clipboard.` });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <Card className="border-none shadow-2xl bg-card/80 backdrop-blur-xl border-2 border-primary/5 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-orange-500 to-amber-600 text-white p-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-md">
                <Fingerprint className="w-8 h-8" />
              </div>
              <div>
                <CardTitle className="text-3xl font-black tracking-tight">{t('hashTitle' as any) || 'Hash Generator'}</CardTitle>
                <CardDescription className="text-white/70 font-bold">{t('hashDesc' as any) || 'Generate cryptographic hashes instantly.'}</CardDescription>
              </div>
            </div>
            <Button onClick={() => setInput('')} variant="ghost" className="h-12 px-6 rounded-xl font-black gap-2 text-white hover:bg-white/20">
               <Trash2 className="w-4 h-4" /> CLEAR
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-8 space-y-8">
          
          <div className="space-y-4">
             <label className="text-sm font-black uppercase tracking-widest text-primary/60">Input Data</label>
             <Textarea 
               value={input}
               onChange={(e) => setInput(e.target.value)}
               placeholder="Type or paste your text here to generate hashes..."
               className="min-h-[150px] resize-none rounded-2xl border-2 p-6 text-lg focus:ring-0 focus:border-orange-500 bg-muted/30"
             />
          </div>

          <div className="space-y-6 pt-4">
            {[
               { id: 'sha256', label: 'SHA-256 (Recommended)', value: hashes.sha256, color: 'text-orange-600' },
               { id: 'sha512', label: 'SHA-512', value: hashes.sha512, color: 'text-amber-600' },
               { id: 'sha384', label: 'SHA-384', value: hashes.sha384, color: 'text-yellow-600' },
               { id: 'sha1', label: 'SHA-1 (Legacy)', value: hashes.sha1, color: 'text-muted-foreground' },
            ].map(item => (
              <div key={item.id} className="space-y-2">
                 <div className="flex items-center justify-between">
                   <label className={`text-sm font-black uppercase tracking-widest ${item.color}`}>{item.label}</label>
                   <Button variant="ghost" size="sm" onClick={() => handleCopy(item.value, item.label)} className="h-8 text-xs font-bold hover:bg-muted" disabled={!item.value}>
                      <Copy className="w-4 h-4 mr-2" /> COPY
                   </Button>
                 </div>
                 <div className="bg-muted/50 border rounded-xl p-4 font-mono text-sm break-all select-all min-h-[3rem] flex items-center">
                    {item.value || <span className="text-muted-foreground/50">Awaiting input...</span>}
                 </div>
              </div>
            ))}
          </div>

        </CardContent>
      </Card>
      
      <div className="text-center max-w-2xl mx-auto space-y-2 text-sm text-muted-foreground">
         <ShieldAlert className="w-6 h-6 mx-auto text-primary/40 mb-2" />
         <p><strong>Security Note:</strong> Cryptographic hashes (like SHA-256) are mathematically designed to be <strong>one-way functions</strong>. Unlike encryption, a hash cannot be "decrypted" back into the original text. They are used to verify data integrity and store passwords safely.</p>
      </div>
    </div>
  );
}
