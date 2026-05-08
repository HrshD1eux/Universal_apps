'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Smile, Lock, Unlock, Copy, Trash2, 
  Sparkles, Zap, Info, ShieldCheck, Share2, Eye, EyeOff
} from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import { copyToClipboard } from '@/lib/tauri-utils';

const EMOJI_MAP: Record<string, string> = {
  '0': '🍎', '1': '🍌', '2': '🍒', '3': '🍇',
  '4': '🍓', '5': '🥑', '6': '🥥', '7': '🍍',
  '8': '🥨', '9': '🍕', 'A': '🍔', 'B': '🍟',
  'C': '🌮', 'D': '🍦', 'E': '🍩', 'F': '🍭'
};

const REVERSE_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(EMOJI_MAP).map(([k, v]) => [v, k])
);

export default function EmojiCipher() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  
  const { t } = useLanguage();
  const { toast } = useToast();

  const process = () => {
    try {
      if (mode === 'encode') {
        const bytes = new TextEncoder().encode(input);
        const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join('');
        const emojiStr = Array.from(hex).map(char => EMOJI_MAP[char]).join('');
        setOutput(emojiStr);
        toast({ title: "Encoded!", description: "Message hidden in emojis." });
      } else {
        // Find all emojis in input
        const emojiArray = Array.from(input).filter(c => REVERSE_MAP[c]);
        const hex = emojiArray.map(c => REVERSE_MAP[c]).join('');
        const bytes = new Uint8Array(hex.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []);
        setOutput(new TextDecoder().decode(bytes));
        toast({ title: "Decoded!", description: "Secret message revealed." });
      }
    } catch (e) {
      toast({ title: "Failed", description: "Invalid input format.", variant: "destructive" });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 px-4">
      <Card className="border-none shadow-2xl bg-gradient-to-br from-background via-muted/50 to-background overflow-hidden font-sans">
        <CardHeader className="bg-amber-500/5 border-b border-amber-500/10 p-8">
           <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-4">
                 <div className="p-4 bg-amber-600 text-white rounded-2xl shadow-lg shadow-amber-500/20">
                    <Smile className="w-8 h-8" />
                 </div>
                 <div>
                    <CardTitle className="text-3xl font-black tracking-tight uppercase">{t('emojiCipherTitle' as any)}</CardTitle>
                    <CardDescription className="text-base font-bold text-amber-600/60">{t('emojiCipherDesc' as any)}</CardDescription>
                 </div>
              </div>
              
              <div className="flex p-1 bg-muted rounded-2xl border-2">
                 <button 
                   onClick={() => { setMode('encode'); setOutput(''); }} 
                   className={`px-6 py-2 rounded-xl text-[10px] font-black transition-all ${mode === 'encode' ? 'bg-background shadow-lg text-amber-600 scale-105' : 'text-muted-foreground'}`}
                 >
                   ENCODE
                 </button>
                 <button 
                   onClick={() => { setMode('decode'); setOutput(''); }} 
                   className={`px-6 py-2 rounded-xl text-[10px] font-black transition-all ${mode === 'decode' ? 'bg-background shadow-lg text-amber-600 scale-105' : 'text-muted-foreground'}`}
                 >
                   DECODE
                 </button>
              </div>
           </div>
        </CardHeader>

        <CardContent className="p-8">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-6">
                 <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-amber-600 ml-1">
                       {mode === 'encode' ? 'Your Secret Message' : 'Paste Emojis Here'}
                    </label>
                    <Textarea 
                      value={input} 
                      onChange={(e) => setInput(e.target.value)} 
                      placeholder={mode === 'encode' ? "Hello, meet me at 9 PM..." : "🍎🍒🍕..."}
                      className="h-60 rounded-[2.5rem] border-2 p-8 font-medium focus:ring-amber-500 text-lg shadow-inner bg-card/50"
                    />
                 </div>

                 <Button 
                   onClick={process}
                   disabled={!input}
                   className="w-full h-20 rounded-[2rem] bg-amber-600 hover:bg-amber-700 text-white font-black text-xl gap-3 shadow-2xl shadow-amber-500/20 group"
                 >
                    {mode === 'encode' ? <Lock className="w-8 h-8" /> : <Unlock className="w-8 h-8" />}
                    {mode === 'encode' ? 'CONVERT TO EMOJIS' : 'REVEAL MESSAGE'}
                 </Button>
              </div>

              <div className="space-y-8">
                 <div className="p-10 rounded-[3rem] bg-card border-2 shadow-2xl space-y-6 relative overflow-hidden group min-h-[400px] flex flex-col">
                    <Sparkles className="absolute top-0 right-0 p-8 w-40 h-40 opacity-5 group-hover:scale-110 transition-transform pointer-events-none" />
                    
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-amber-600" />
                          <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Result Output</span>
                       </div>
                        {output && (
                          <Button variant="ghost" size="sm" onClick={async () => { 
                             const success = await copyToClipboard(output);
                             if (success) {
                               toast({ title: "Copied", description: "Emoji cipher copied to clipboard." });
                             } else {
                               toast({ title: "Copy Failed", description: "Please try selecting and copying manually.", variant: "destructive" });
                             }
                          }} className="h-6 text-[10px] font-black uppercase text-amber-600">Copy Result</Button>
                       )}
                    </div>
                    
                    <div className="flex-grow flex items-center justify-center text-center">
                       {output ? (
                          <p className={`font-bold leading-relaxed break-all ${mode === 'encode' ? 'text-4xl tracking-widest' : 'text-2xl text-amber-900 dark:text-amber-100 italic'}`}>
                             {output}
                          </p>
                       ) : (
                          <div className="opacity-20 flex flex-col items-center">
                             <Share2 className="w-16 h-16 mb-4" />
                             <p className="text-[10px] font-black uppercase tracking-[0.2em]">Ready for Transmission</p>
                          </div>
                       )}
                    </div>
                    
                    <div className="pt-6 border-t border-dashed flex items-center gap-4 text-[9px] font-bold text-muted-foreground uppercase">
                       <ShieldCheck className="w-4 h-4 text-emerald-600" />
                       <span>Hidden-in-Plain-Sight Protocol</span>
                    </div>
                 </div>

                 <div className="p-8 rounded-[2.5rem] bg-muted/50 border-2 border-dashed space-y-4">
                    <div className="flex items-center gap-2">
                       <Info className="w-4 h-4 text-amber-600" />
                       <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Visual Stealth</span>
                    </div>
                    <p className="text-xs font-bold text-muted-foreground leading-relaxed uppercase tracking-tighter">
                       This tool converts your text into a sequence of emojis using hex-mapping. It looks like a random string of food/fruit icons, making it perfect for private notes on public platforms.
                    </p>
                 </div>
              </div>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
