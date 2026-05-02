'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, Lock, Unlock, Copy, Trash2, 
  Sparkles, Zap, Info, ShieldX, Key, Loader2
} from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';

export default function NoteShredder() {
  const [note, setNote] = useState('');
  const [password, setPassword] = useState('');
  const [encryptedNote, setEncryptedNote] = useState('');
  const [decryptedNote, setDecryptedNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { t } = useLanguage();
  const { toast } = useToast();

  const deriveKey = async (password: string, salt: Uint8Array) => {
    const encoder = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );
    return window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  };

  const encrypt = async () => {
    if (!note || !password) return;
    setIsProcessing(true);
    try {
      const encoder = new TextEncoder();
      const salt = window.crypto.getRandomValues(new Uint8Array(16));
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const key = await deriveKey(password, salt);
      
      const encrypted = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        encoder.encode(note)
      );

      const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
      combined.set(salt, 0);
      combined.set(iv, salt.length);
      combined.set(new Uint8Array(encrypted), salt.length + iv.length);

      const base64 = btoa(String.fromCharCode(...combined));
      setEncryptedNote(base64);
      setNote(''); // "Shred" original
      toast({ title: "Note Shredded", description: "Original text deleted. Encrypted data ready." });
    } catch (e) {
      toast({ title: "Failed", description: "Encryption error", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const decrypt = async () => {
    if (!encryptedNote || !password) return;
    setIsProcessing(true);
    try {
      const combined = new Uint8Array(atob(encryptedNote).split('').map(c => c.charCodeAt(0)));
      const salt = combined.slice(0, 16);
      const iv = combined.slice(16, 28);
      const data = combined.slice(28);
      
      const key = await deriveKey(password, salt);
      const decrypted = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        data
      );

      setDecryptedNote(new TextDecoder().decode(decrypted));
      toast({ title: "Decrypted", description: "Secure note unlocked." });
    } catch (e) {
      toast({ title: "Access Denied", description: "Incorrect password or corrupted data.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: "Secure data copied to clipboard." });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 px-4">
      <Card className="border-none shadow-2xl bg-gradient-to-br from-background via-muted/50 to-background overflow-hidden font-sans">
        <CardHeader className="bg-rose-500/5 border-b border-rose-500/10 p-8">
           <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-4">
                 <div className="p-4 bg-rose-600 text-white rounded-2xl shadow-lg shadow-rose-500/20">
                    <ShieldX className="w-8 h-8" />
                 </div>
                 <div>
                    <CardTitle className="text-3xl font-black tracking-tight uppercase">Zero-Knowledge Shredder</CardTitle>
                    <CardDescription className="text-base font-bold text-rose-600/60">{t('noteShredderDesc' as any)}</CardDescription>
                 </div>
              </div>

              <div className="flex gap-4">
                 <div className="p-3 bg-muted rounded-2xl border-2 flex items-center gap-3">
                    <Lock className="w-4 h-4 text-rose-600" />
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-40">AES-256</span>
                 </div>
              </div>
           </div>
        </CardHeader>

        <CardContent className="p-8">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-6">
                 <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-rose-600 ml-1">Secure Message</label>
                    <Textarea 
                      value={note} 
                      onChange={(e) => setNote(e.target.value)} 
                      placeholder="Write your sensitive information here..."
                      className="h-60 rounded-[2rem] border-2 p-6 font-medium focus:ring-rose-500"
                    />
                 </div>

                 <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-rose-600 ml-1">Master Password</label>
                    <div className="relative">
                       <Input 
                         type="password"
                         value={password}
                         onChange={(e) => setPassword(e.target.value)}
                         className="h-16 rounded-2xl border-2 pl-12 font-black tracking-widest focus:ring-rose-500"
                         placeholder="••••••••••••"
                       />
                       <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-rose-600/40" />
                    </div>
                 </div>

                 <div className="flex gap-4">
                    <Button 
                      onClick={encrypt}
                      disabled={!note || !password || isProcessing}
                      className="flex-1 h-20 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-lg gap-2 shadow-xl"
                    >
                       {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : <Lock className="w-6 h-6" />}
                       ENCRYPT & SHRED
                    </Button>
                    <Button 
                      onClick={() => { setNote(''); setEncryptedNote(''); setDecryptedNote(''); setPassword(''); }}
                      variant="outline"
                      className="h-20 w-20 rounded-2xl border-2 text-rose-600"
                    >
                       <Trash2 className="w-6 h-6" />
                    </Button>
                 </div>
              </div>

              <div className="space-y-8">
                 <div className="p-8 rounded-[3rem] bg-muted/50 border-2 shadow-inner space-y-6">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-rose-600" />
                          <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Secure Output</span>
                       </div>
                       {encryptedNote && (
                          <Button variant="ghost" size="sm" onClick={() => copyToClipboard(encryptedNote)} className="h-6 text-[10px] font-black uppercase text-rose-600">Copy Data</Button>
                       )}
                    </div>
                    
                    <div className="h-40 bg-card border-2 rounded-2xl p-4 overflow-y-auto break-all font-mono text-[10px] opacity-60 leading-relaxed custom-scrollbar">
                       {encryptedNote || "No encrypted data generated yet."}
                    </div>

                    <div className="pt-6 border-t border-dashed">
                       <p className="text-[10px] font-black uppercase tracking-widest text-rose-600 mb-4">Decrypt Message</p>
                       <div className="space-y-4">
                          <Input 
                            value={encryptedNote}
                            onChange={(e) => setEncryptedNote(e.target.value)}
                            placeholder="Paste encrypted data here..."
                            className="h-10 rounded-xl border-2 text-[10px] font-mono"
                          />
                          <Button 
                            onClick={decrypt}
                            disabled={!encryptedNote || !password || isProcessing}
                            variant="secondary"
                            className="w-full h-12 rounded-xl font-black text-xs gap-2"
                          >
                             <Unlock className="w-4 h-4" /> REVEAL SECRET
                          </Button>
                       </div>
                    </div>

                    <AnimatePresence>
                       {decryptedNote && (
                          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/20">
                             <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-2">Decrypted Content</p>
                             <p className="text-sm font-bold text-emerald-900 dark:text-emerald-100">{decryptedNote}</p>
                          </motion.div>
                       )}
                    </AnimatePresence>
                 </div>
              </div>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
