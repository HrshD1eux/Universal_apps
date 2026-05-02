'use client';

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Download, Code, Palette } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/language-context';

const GRADIENTS = [
  'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500',
  'bg-gradient-to-br from-emerald-500 to-teal-600',
  'bg-gradient-to-br from-orange-400 to-rose-500',
  'bg-gradient-to-br from-cyan-500 to-blue-600',
  'bg-gradient-to-br from-gray-800 to-black',
];

export default function CodeSnippetMaker() {
  const [code, setCode] = useState('function sayHello() {\n  console.log("Hello, World!");\n}\n\nsayHello();');
  const [bgIndex, setBgIndex] = useState(0);
  const snippetRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();
  const { toast } = useToast();

  const handleExport = async () => {
    if (!snippetRef.current) return;
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(snippetRef.current, {
        scale: 3, // High resolution
        backgroundColor: null, // Transparent background outside the box if needed
        useCORS: true
      });
      
      const imgData = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = imgData;
      a.download = 'beautiful-snippet.png';
      a.click();
      toast({ title: "Exported", description: "Snippet downloaded successfully." });
    } catch (err) {
      toast({ title: "Export Failed", description: "Could not generate image.", variant: "destructive" });
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <Card className="border-none shadow-2xl bg-card/80 backdrop-blur-xl border-2 border-primary/5 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-md">
                <Code className="w-8 h-8" />
              </div>
              <div>
                <CardTitle className="text-3xl font-black tracking-tight">{t('snippetTitle' as any) || 'Code Snippet Maker'}</CardTitle>
                <CardDescription className="text-white/70 font-bold">{t('snippetDesc' as any) || 'Create beautiful macOS-style code screenshots.'}</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-4">
               <Button onClick={() => setBgIndex((prev) => (prev + 1) % GRADIENTS.length)} variant="secondary" className="h-12 px-6 rounded-xl font-black gap-2 shadow-lg">
                  <Palette className="w-4 h-4" /> CHANGE THEME
               </Button>
               <Button onClick={handleExport} className="h-12 px-6 rounded-xl font-black gap-2 bg-black hover:bg-gray-800 text-white shadow-lg">
                  <Download className="w-4 h-4" /> EXPORT PNG
               </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8 space-y-8 bg-muted/10">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
             
             {/* Input Area */}
             <div className="space-y-4">
               <label className="text-sm font-black uppercase tracking-widest text-primary/60">Source Code</label>
               <Textarea 
                 value={code}
                 onChange={(e) => setCode(e.target.value)}
                 className="min-h-[400px] resize-none rounded-2xl border-2 focus:ring-0 focus:border-cyan-500 p-6 text-sm font-mono bg-card"
                 placeholder="Paste your code here..."
               />
             </div>

             {/* Preview Area */}
             <div className="space-y-4 flex flex-col items-center">
               <label className="text-sm font-black uppercase tracking-widest text-primary/60 w-full">Preview</label>
               
               {/* The element to capture */}
               <div className="w-full flex justify-center overflow-x-auto p-4 scrollbar-hide">
                   <div 
                   ref={snippetRef} 
                   className={`p-6 sm:p-12 md:p-16 rounded-3xl md:rounded-[2rem] shadow-2xl ${GRADIENTS[bgIndex]} transition-all duration-500 w-full max-w-full md:max-w-[600px]`}
                 >
                    <div className="bg-[#1e1e1e]/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 overflow-hidden w-full">
                       
                       {/* macOS Title Bar */}
                       <div className="flex items-center px-4 py-3 bg-[#2d2d2d]/80 border-b border-white/5">
                          <div className="flex items-center gap-2">
                             <div className="w-3 h-3 rounded-full bg-[#ff5f56] shadow-inner" />
                             <div className="w-3 h-3 rounded-full bg-[#ffbd2e] shadow-inner" />
                             <div className="w-3 h-3 rounded-full bg-[#27c93f] shadow-inner" />
                          </div>
                       </div>

                       {/* Code Content */}
                       <div className="p-6 overflow-x-auto">
                          <pre className="text-sm md:text-base font-mono text-[#d4d4d4] leading-relaxed">
                             <code>{code || ' '}</code>
                          </pre>
                       </div>
                    </div>
                 </div>
               </div>

             </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
