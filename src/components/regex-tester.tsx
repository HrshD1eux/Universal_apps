'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { SearchCode, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import { useLanguage } from '@/context/language-context';

export default function RegexTester() {
  const [pattern, setPattern] = useState('[A-Z]\\w+');
  const [flags, setFlags] = useState('g');
  const [testString, setTestString] = useState('Hello World! This is a Regex Tester.');
  const { t } = useLanguage();

  const { matches, error, highlightedText } = useMemo(() => {
    if (!pattern) return { matches: [], error: null, highlightedText: [] };
    
    try {
      const regex = new RegExp(pattern, flags.includes('g') ? flags : flags + 'g'); // Ensure 'g' is present for highlighting multiple matches
      const singleRegex = new RegExp(pattern, flags); // For testing validity
      
      const allMatches = [];
      let match;
      
      // We need to use String.prototype.matchAll if possible, or a loop
      const text = testString || '';
      
      // Build highlighted text
      const parts = [];
      let lastIndex = 0;
      
      while ((match = regex.exec(text)) !== null) {
        if (match.index === regex.lastIndex) {
            regex.lastIndex++; // Prevent infinite loops with zero-length matches
        }
        allMatches.push(match[0]);
        
        parts.push({ text: text.slice(lastIndex, match.index), isMatch: false });
        parts.push({ text: match[0], isMatch: true });
        lastIndex = match.index + match[0].length;
      }
      parts.push({ text: text.slice(lastIndex), isMatch: false });
      
      return { matches: allMatches, error: null, highlightedText: parts };
    } catch (err: any) {
      return { matches: [], error: err.message, highlightedText: [{ text: testString, isMatch: false }] };
    }
  }, [pattern, flags, testString]);

  const toggleFlag = (flag: string) => {
    if (flags.includes(flag)) {
      setFlags(flags.replace(flag, ''));
    } else {
      setFlags(flags + flag);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <Card className="border-none shadow-2xl bg-card/80 backdrop-blur-xl border-2 border-primary/5 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white p-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-md">
                <SearchCode className="w-8 h-8" />
              </div>
              <div>
                <CardTitle className="text-3xl font-black tracking-tight">{t('regexTitle' as any) || 'Regex Tester'}</CardTitle>
                <CardDescription className="text-white/70 font-bold">{t('regexDesc' as any) || 'Test regular expressions with real-time highlighting.'}</CardDescription>
              </div>
            </div>
            <Button onClick={() => { setPattern(''); setTestString(''); }} variant="ghost" className="h-12 px-6 rounded-xl font-black gap-2 text-white hover:bg-white/20">
               <Trash2 className="w-4 h-4" /> CLEAR ALL
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-8 space-y-8">
          
          {/* Regex Input Area */}
          <div className="space-y-4">
             <label className="text-sm font-black uppercase tracking-widest text-primary/60">Regular Expression</label>
             <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 flex items-center bg-muted/50 rounded-2xl border-2 px-4 focus-within:border-violet-500 transition-colors">
                   <span className="text-2xl font-bold text-muted-foreground mr-2">/</span>
                   <Input 
                     value={pattern}
                     onChange={(e) => setPattern(e.target.value)}
                     placeholder="Expression (e.g. ^[a-z]+$)"
                     className="border-none bg-transparent focus-visible:ring-0 text-xl font-mono px-0 h-16"
                   />
                   <span className="text-2xl font-bold text-muted-foreground ml-2">/</span>
                   <Input 
                     value={flags}
                     onChange={(e) => setFlags(e.target.value)}
                     placeholder="gmi"
                     className="border-none bg-transparent focus-visible:ring-0 text-xl font-mono px-0 w-16 text-violet-600"
                   />
                </div>
             </div>
             {error && (
                <div className="flex items-center gap-2 text-red-500 font-bold text-sm mt-2">
                   <XCircle className="w-4 h-4" /> Invalid Expression: {error}
                </div>
             )}
             <div className="flex gap-2 flex-wrap">
                {[
                  { id: 'g', label: 'Global (g)' },
                  { id: 'i', label: 'Case Insensitive (i)' },
                  { id: 'm', label: 'Multiline (m)' },
                ].map(f => (
                   <Button 
                     key={f.id} 
                     size="sm" 
                     variant={flags.includes(f.id) ? "default" : "outline"}
                     onClick={() => toggleFlag(f.id)}
                     className={`rounded-full ${flags.includes(f.id) ? 'bg-violet-600 hover:bg-violet-700 text-white border-none' : 'border-2'}`}
                   >
                     {f.label}
                   </Button>
                ))}
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
             {/* Test String */}
             <div className="space-y-4">
               <label className="text-sm font-black uppercase tracking-widest text-primary/60">Test String</label>
               <Textarea 
                 value={testString}
                 onChange={(e) => setTestString(e.target.value)}
                 className="min-h-[300px] resize-none rounded-2xl border-2 focus:ring-0 focus:border-violet-500 p-6 text-lg bg-card font-mono leading-relaxed"
                 placeholder="Type the text you want to test against..."
               />
             </div>
             
             {/* Match Results */}
             <div className="space-y-4">
               <div className="flex items-center justify-between">
                 <label className="text-sm font-black uppercase tracking-widest text-violet-600">Match Preview</label>
                 <div className="text-sm font-bold text-muted-foreground">
                    {matches.length} {matches.length === 1 ? 'Match' : 'Matches'}
                 </div>
               </div>
               
               <div className="min-h-[300px] rounded-2xl border-2 border-violet-500/20 bg-violet-50/30 dark:bg-violet-950/20 p-6 text-lg font-mono leading-relaxed whitespace-pre-wrap overflow-y-auto max-h-[500px]">
                  {!testString ? (
                     <span className="text-muted-foreground/50">Awaiting input...</span>
                  ) : error ? (
                     <span className="text-red-500/50">Fix regex error to see matches.</span>
                  ) : (
                     highlightedText.map((part, i) => (
                        part.isMatch ? (
                           <mark key={i} className="bg-violet-500/30 text-violet-900 dark:text-violet-100 rounded-[4px] px-0.5 border border-violet-500/50 font-bold">
                              {part.text}
                           </mark>
                        ) : (
                           <span key={i}>{part.text}</span>
                        )
                     ))
                  )}
               </div>
             </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
