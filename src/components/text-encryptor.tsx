'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Copy, Trash2, Lock, Unlock, ShieldAlert, Key } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/language-context';

export default function TextEncryptor() {
  const [input, setInput] = useState('');
  const [password, setPassword] = useState('');
  const [output, setOutput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { t } = useLanguage();
  const { toast } = useToast();

  const encryptText = async (text: string, pass: string) => {
    const enc = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(pass), {name: "PBKDF2"}, false, ["deriveKey"]);
    const key = await crypto.subtle.deriveKey(
      { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
      keyMaterial, { name: "AES-GCM", length: 256 }, false, ["encrypt"]
    );
    const cipherBuffer = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(text));
    
    const result = new Uint8Array(salt.length + iv.length + cipherBuffer.byteLength);
    result.set(salt, 0);
    result.set(iv, salt.length);
    result.set(new Uint8Array(cipherBuffer), salt.length + iv.length);
    
    // Uint8Array to Base64
    let binary = '';
    result.forEach(b => binary += String.fromCharCode(b));
    return btoa(binary);
  };

  const decryptText = async (base64Cipher: string, pass: string) => {
    const dec = new TextDecoder();
    const enc = new TextEncoder();
    const rawData = atob(base64Cipher);
    const data = new Uint8Array(rawData.length);
    for(let i=0; i<rawData.length; i++) data[i] = rawData.charCodeAt(i);
    
    const salt = data.slice(0, 16);
    const iv = data.slice(16, 28);
    const cipherData = data.slice(28);
    
    const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(pass), {name: "PBKDF2"}, false, ["deriveKey"]);
    const key = await crypto.subtle.deriveKey(
      { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
      keyMaterial, { name: "AES-GCM", length: 256 }, false, ["decrypt"]
    );
    
    const decryptedBuffer = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, cipherData);
    return dec.decode(decryptedBuffer);
  };

  const handleEncrypt = async () => {
    if (!input || !password) {
      toast({ title: "Error", description: "Text and Password are required.", variant: "destructive" });
      return;
    }
    setIsProcessing(true);
    try {
      const res = await encryptText(input, password);
      setOutput(res);
      toast({ title: "Encrypted", description: "Text secured using AES-256-GCM." });
    } catch (e) {
      toast({ title: "Encryption Failed", description: "An error occurred.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecrypt = async () => {
    if (!input || !password) {
      toast({ title: "Error", description: "Ciphertext and Password are required.", variant: "destructive" });
      return;
    }
    setIsProcessing(true);
    try {
      const res = await decryptText(input, password);
      setOutput(res);
      toast({ title: "Decrypted", description: "Text successfully unlocked." });
    } catch (e) {
      toast({ title: "Decryption Failed", description: "Invalid password or corrupted data.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
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
    setPassword('');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <Card className="border-none shadow-2xl bg-card/80 backdrop-blur-xl border-2 border-primary/5 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-red-600 to-rose-600 text-white p-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-md shadow-inner">
                <Lock className="w-8 h-8" />
              </div>
              <div>
                <CardTitle className="text-3xl font-black tracking-tight">{t('encryptorTitle' as any) || 'AES Text Encryptor'}</CardTitle>
                <CardDescription className="text-white/70 font-bold">{t('encryptorDesc' as any) || 'Secure text with military-grade AES-256-GCM encryption.'}</CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8 space-y-8">
          
          <div className="max-w-md mx-auto relative group">
             <div className="absolute -inset-1 bg-gradient-to-r from-red-500 to-rose-500 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
             <div className="relative flex items-center bg-card rounded-xl border-2 p-2">
                <Key className="w-5 h-5 ml-3 text-muted-foreground" />
                <Input 
                   type="password" 
                   value={password}
                   onChange={(e) => setPassword(e.target.value)}
                   placeholder="Enter Secret Password..."
                   className="border-none focus-visible:ring-0 text-lg font-bold"
                />
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="space-y-4">
               <div className="flex items-center justify-between">
                 <label className="text-sm font-black uppercase tracking-widest text-primary/60">Input Text or Cipher</label>
                 <Button variant="ghost" size="sm" onClick={() => setInput('')} className="h-8 text-xs font-bold text-muted-foreground hover:text-red-500">
                    CLEAR
                 </Button>
               </div>
               <Textarea 
                 value={input}
                 onChange={(e) => setInput(e.target.value)}
                 placeholder="Type your plain text to encrypt, or paste a Base64 cipher to decrypt..."
                 className="min-h-[250px] resize-none rounded-2xl border-2 focus:ring-0 focus:border-red-500 p-6 text-lg bg-muted/30"
               />
             </div>
             
             <div className="space-y-4">
               <div className="flex items-center justify-between">
                 <label className="text-sm font-black uppercase tracking-widest text-primary/60">Result</label>
                 <Button variant="ghost" size="sm" onClick={handleCopy} className="h-8 text-xs font-bold text-red-600 hover:bg-red-50" disabled={!output}>
                    <Copy className="w-4 h-4 mr-2" /> COPY
                 </Button>
               </div>
               <Textarea 
                 value={output}
                 readOnly
                 placeholder="Encrypted or decrypted result will appear here..."
                 className="min-h-[250px] resize-none rounded-2xl border-2 border-red-500/20 bg-red-50/30 dark:bg-red-950/20 p-6 text-lg font-mono focus:ring-0 break-all"
               />
             </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 bg-muted/50 p-6 rounded-3xl border-2">
            <Button onClick={handleEncrypt} disabled={isProcessing} className="h-14 px-8 rounded-2xl font-black gap-2 bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20">
               <Lock className="w-5 h-5" /> ENCRYPT
            </Button>
            <Button onClick={handleDecrypt} disabled={isProcessing} variant="outline" className="h-14 px-8 rounded-2xl font-black gap-2 border-2 border-rose-600/20 text-rose-600 hover:bg-rose-50">
               <Unlock className="w-5 h-5" /> DECRYPT
            </Button>
            <Button onClick={clearAll} variant="ghost" className="h-14 px-8 rounded-2xl font-black gap-2 text-muted-foreground hover:bg-red-50 hover:text-red-600">
               <Trash2 className="w-5 h-5" /> RESET
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <div className="text-center max-w-2xl mx-auto space-y-2 text-sm text-muted-foreground">
         <ShieldAlert className="w-6 h-6 mx-auto text-primary/40 mb-2" />
         <p><strong>Military-Grade Security:</strong> This tool uses AES-256-GCM encryption with PBKDF2 key derivation (100,000 iterations). Your password is never sent to any server.</p>
      </div>
    </div>
  );
}
