'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { FileCode, Copy, Trash2, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';

export default function HtmlToJsx() {
  const [htmlInput, setHtmlInput] = useState('<div class="container">\n  <h1 class="title">Hello World</h1>\n  <input type="text" placeholder="Enter name">\n  <img src="logo.png">\n</div>');
  const [jsxOutput, setJsxOutput] = useState('');
  const { t } = useLanguage();
  const { toast } = useToast();

  const convertToJsx = () => {
    if (!htmlInput) {
      setJsxOutput('');
      return;
    }

    let jsx = htmlInput;

    // Attributes renaming
    jsx = jsx.replace(/class=/g, 'className=');
    jsx = jsx.replace(/for=/g, 'htmlFor=');
    jsx = jsx.replace(/tabindex=/g, 'tabIndex=');
    jsx = jsx.replace(/readonly=/g, 'readOnly=');
    jsx = jsx.replace(/maxlength=/g, 'maxLength=');
    jsx = jsx.replace(/autocomplete=/g, 'autoComplete=');
    jsx = jsx.replace(/autofocus=/g, 'autoFocus=');

    // Self-closing tags
    const voidTags = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'];
    voidTags.forEach(tag => {
      // Find tags that are not self closed e.g. <input type="text"> -> <input type="text" />
      // Regex explanation: <tag (anything except >)* > (that doesn't end with />)
      const regex = new RegExp(`<${tag}([^>]*?)(?<!/)>`, 'gi');
      jsx = jsx.replace(regex, `<${tag}$1 />`);
    });

    // Basic Style attribute conversion (very rudimentary)
    // <div style="color: red; font-size: 12px;"> -> <div style={{ color: 'red', fontSize: '12px' }}>
    jsx = jsx.replace(/style="([^"]*)"/g, (match, styleString) => {
      const styles = styleString.split(';').filter((s: string) => s.trim().length > 0);
      const styleObj = styles.map((s: string) => {
        const [key, value] = s.split(':');
        if (!key || !value) return '';
        // Camel case the key
        const camelKey = key.trim().replace(/-([a-z])/g, (g: string) => g[1].toUpperCase());
        return `${camelKey}: '${value.trim().replace(/'/g, "\\'")}'`;
      }).filter(Boolean).join(', ');
      return `style={{ ${styleObj} }}`;
    });

    // HTML Comments to JSX Comments
    jsx = jsx.replace(/<!--(.*?)-->/gs, '{/* $1 */}');

    setJsxOutput(jsx);
    toast({ title: "Converted", description: "HTML successfully converted to JSX." });
  };

  const handleCopy = () => {
    if (!jsxOutput) return;
    navigator.clipboard.writeText(jsxOutput);
    toast({ title: "Copied", description: "JSX code copied to clipboard." });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <Card className="border-none shadow-2xl bg-card/80 backdrop-blur-xl border-2 border-primary/5 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-sky-500 to-blue-600 text-white p-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-md">
                <FileCode className="w-8 h-8" />
              </div>
              <div>
                <CardTitle className="text-3xl font-black tracking-tight">{t('htmlJsxTitle' as any) || 'HTML to JSX'}</CardTitle>
                <CardDescription className="text-white/70 font-bold">{t('htmlJsxDesc' as any) || 'Quickly convert raw HTML into React JSX format.'}</CardDescription>
              </div>
            </div>
            <Button onClick={convertToJsx} className="h-12 px-8 rounded-xl font-black gap-2 bg-white text-blue-600 hover:bg-white/90 shadow-lg">
               CONVERT TO JSX <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          
          <div className="grid grid-cols-1 lg:grid-cols-2">
             {/* HTML Input Area */}
             <div className="p-8 border-r border-border/50 space-y-4 bg-muted/10">
               <div className="flex items-center justify-between">
                 <label className="text-sm font-black uppercase tracking-widest text-primary/60">HTML Input</label>
                 <Button variant="ghost" size="sm" onClick={() => setHtmlInput('')} className="h-8 text-xs font-bold text-muted-foreground hover:text-red-500">
                    CLEAR
                 </Button>
               </div>
               <Textarea 
                 value={htmlInput}
                 onChange={(e) => setHtmlInput(e.target.value)}
                 className="min-h-[500px] resize-none rounded-2xl border-2 focus:ring-0 focus:border-sky-500 p-6 text-sm font-mono bg-card leading-relaxed"
                 placeholder="Paste your HTML here..."
                 spellCheck={false}
               />
             </div>

             {/* JSX Output Area */}
             <div className="p-8 space-y-4 bg-sky-50/30 dark:bg-sky-950/10">
               <div className="flex items-center justify-between">
                 <label className="text-sm font-black uppercase tracking-widest text-sky-600">JSX Output</label>
                 <Button variant="ghost" size="sm" onClick={handleCopy} disabled={!jsxOutput} className="h-8 text-xs font-bold text-sky-600 hover:bg-sky-100">
                    <Copy className="w-4 h-4 mr-2" /> COPY
                 </Button>
               </div>
               <Textarea 
                 value={jsxOutput}
                 readOnly
                 className="min-h-[500px] resize-none rounded-2xl border-2 border-sky-500/20 bg-white/50 dark:bg-black/20 p-6 text-sm font-mono text-sky-900 dark:text-sky-300 leading-relaxed focus:ring-0"
                 placeholder="React JSX will appear here..."
                 spellCheck={false}
               />
             </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
