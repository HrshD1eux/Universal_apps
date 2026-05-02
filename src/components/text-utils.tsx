'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { motion, AnimatePresence } from 'framer-motion';
import { Type, Copy, Trash2, Hash, FileText, AlignLeft, Sparkles, Wand2, ArrowRightLeft, List, Scissors, Eraser, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/language-context';

export default function TextUtils() {
  const [text, setText] = useState('');
  const [stats, setStats] = useState({ words: 0, chars: 0, sentences: 0, lines: 0 });
  const { t } = useLanguage();
  const { toast } = useToast();

  useEffect(() => {
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const chars = text.length;
    const sentences = text.trim() ? text.split(/[.!?]+/).filter(s => s.trim().length > 0).length : 0;
    const lines = text.trim() ? text.split('\n').length : 0;
    setStats({ words, chars, sentences, lines });
  }, [text]);

  const handleTransform = (action: 'upper' | 'lower' | 'title' | 'sentence' | 'clean' | 'slug') => {
    if (!text) return;
    let newText = text;
    switch (action) {
      case 'upper': newText = text.toUpperCase(); break;
      case 'lower': newText = text.toLowerCase(); break;
      case 'title': newText = text.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()); break;
      case 'sentence': 
        newText = text.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, c => c.toUpperCase()); 
        break;
      case 'clean': newText = text.trim().replace(/\s+/g, ' '); break;
      case 'slug': 
        newText = text.toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, '')
          .replace(/[\s_-]+/g, '-')
          .replace(/^-+|-+$/g, '');
        break;
    }
    setText(newText);
    toast({ title: "Magic Applied", description: `Transformed text to ${action} format.` });
  };

  const handlePerfectFormat = () => {
    if (!text) return;
    let formatted = text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n\n') // Normalize paragraphs
      .replace(/\s{2,}/g, ' '); // Remove double spaces
      
    // Fix punctuation spacing: remove spaces before punctuation, add space after punctuation if missing
    formatted = formatted.replace(/\s+([.,!?;:])/g, '$1'); 
    formatted = formatted.replace(/([.,!?;:])(?=[^\s.])/g, '$1 '); 
    
    // Standardize ellipsis (more than 2 dots to 3 dots)
    formatted = formatted.replace(/\.{3,}/g, '...');
    
    // Capitalize standalone isolated lowercase `i`
    formatted = formatted.replace(/(^|\s)i(?=\s|$|[.,!?;:])/g, '$1I');
    
    // Auto-capitalize first letter of each sentence
    formatted = formatted.replace(/(^\s*\w|[.!?]\s*\w)/g, c => c.toUpperCase());
    
    setText(formatted);
    toast({ title: "Perfectly Formatted", description: "Standardized spacing, punctuation, and capitalization." });
  };

  const handleAutoList = () => {
    if (!text) return;
    const lines = text.split('\n').filter(l => l.trim());
    const listed = lines.map((line, i) => {
       if (/^[-*•]\s/.test(line)) return line;
       if (/^\d+\.\s/.test(line)) return line;
       return `• ${line}`;
    }).join('\n');
    setText(listed);
    toast({ title: "List Created", description: "Added bullet points to your lines." });
  };

  const generateLorem = () => {
    const lorem = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";
    setText(lorem);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: "Text copied to clipboard." });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <Card className="border-none shadow-2xl bg-card/80 backdrop-blur-xl border-2 border-primary/5 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-md">
                <Type className="w-8 h-8" />
              </div>
              <div>
                <CardTitle className="text-3xl font-black tracking-tight">{t('textTitle')}</CardTitle>
                <CardDescription className="text-white/70 font-bold">{t('textDesc')}</CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
               <Button variant="secondary" className="rounded-xl h-12 px-6 gap-2 font-black shadow-lg" onClick={handleCopy}>
                  <Copy className="w-4 h-4" /> {t('copy')}
               </Button>
               <Button variant="destructive" className="rounded-xl h-12 px-6 gap-2 font-black shadow-lg" onClick={() => setText('')}>
                  <Eraser className="w-4 h-4" /> CLEAR
               </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-8">
          <div className="grid grid-cols-1 xl:grid-cols-[1fr,350px] gap-12">
            <div className="space-y-8">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-[2.5rem] opacity-10 group-focus-within:opacity-30 blur transition-opacity" />
                <Textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Unleash your content here..."
                  className="min-h-[500px] text-xl border-2 rounded-[2rem] p-10 focus:ring-0 focus:border-primary/50 font-medium resize-none shadow-inner bg-card/50 relative z-10 scrollbar-hide"
                />
              </div>

              <div className="flex flex-wrap gap-3">
                 <TransformButton onClick={() => handleTransform('sentence')} icon={<Type className="w-4 h-4" />} label="Sentence case" />
                 <TransformButton onClick={() => handleTransform('upper')} icon={<Type className="w-4 h-4 uppercase" />} label="UPPERCASE" />
                 <TransformButton onClick={() => handleTransform('lower')} icon={<Type className="w-4 h-4 lowercase" />} label="lowercase" />
                 <TransformButton onClick={() => handleTransform('title')} icon={<Type className="w-4 h-4" />} label="Title Case" />
                 <div className="w-px h-8 bg-border mx-2 hidden sm:block" />
                 <Button onClick={handlePerfectFormat} className="rounded-2xl gap-2 font-black h-12 px-6 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200">
                    <Sparkles className="w-4 h-4" /> PERFECT FORMAT
                 </Button>
                 <Button onClick={handleAutoList} variant="outline" className="rounded-2xl gap-2 font-black h-12 px-6 border-2 border-primary/20 text-primary">
                    <List className="w-4 h-4" /> AUTO-LIST
                 </Button>
                 <TransformButton onClick={() => handleTransform('slug')} icon={<Scissors className="w-4 h-4" />} label="URL SLUG" />
                 <Button variant="ghost" className="rounded-2xl gap-2 font-black h-12 px-6 text-muted-foreground" onClick={generateLorem}>
                    <Sparkles className="w-4 h-4" /> Lorem Ipsum
                 </Button>
              </div>
            </div>

            {/* Sidebar Stats */}
            <div className="space-y-6">
               <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 ml-2">Live Statistics</div>
               <div className="grid grid-cols-1 gap-4">
                  <StatCard label="Words" value={stats.words} icon={<FileText className="w-5 h-5" />} color="blue" />
                  <StatCard label="Characters" value={stats.chars} icon={<Hash className="w-5 h-5" />} color="purple" />
                  <StatCard label="Sentences" value={stats.sentences} icon={<AlignLeft className="w-5 h-5" />} color="indigo" />
                  <StatCard label="Lines" value={stats.lines} icon={<List className="w-5 h-5" />} color="slate" />
               </div>

               <div className="p-8 rounded-[3rem] bg-gradient-to-br from-slate-900 to-black text-white relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform">
                     <Wand2 className="w-24 h-24" />
                  </div>
                  <div className="relative z-10 space-y-4">
                     <div className="flex items-center gap-3">
                        <Zap className="w-5 h-5 text-amber-400" />
                        <h4 className="text-sm font-black uppercase tracking-widest">Pro Tip</h4>
                     </div>
                     <p className="text-xs font-medium text-slate-400 leading-relaxed">
                        Use "Perfect Format" to automatically clean up messy text, normalize spacing, and fix sentence capitalization in one click.
                     </p>
                  </div>
               </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function TransformButton({ onClick, icon, label }: { onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <Button variant="secondary" className="rounded-2xl gap-2 font-black text-[10px] tracking-widest bg-muted/50 border hover:border-primary/50 h-12 px-4 shadow-sm" onClick={onClick}>
       {icon} {label}
    </Button>
  );
}

function StatCard({ label, value, icon, color }: { label: string, value: number, icon: React.ReactNode, color: string }) {
  return (
    <div className="p-6 rounded-[2.5rem] border-2 bg-card/50 relative overflow-hidden group hover:border-primary/30 transition-all flex items-center justify-between">
       <div>
          <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest mb-1">{label}</p>
          <p className="text-3xl font-black tabular-nums">{value.toLocaleString()}</p>
       </div>
       <div className={`w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform`}>
          {icon}
       </div>
    </div>
  );
}
