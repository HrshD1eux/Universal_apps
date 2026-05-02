'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { FileJson2, Copy, Trash2, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';

export default function JsonToTs() {
  const [jsonInput, setJsonInput] = useState('{\n  "id": 1,\n  "name": "Leanne Graham",\n  "username": "Bret",\n  "email": "Sincere@april.biz",\n  "address": {\n    "street": "Kulas Light",\n    "suite": "Apt. 556",\n    "city": "Gwenborough",\n    "zipcode": "92998-3874",\n    "geo": {\n      "lat": "-37.3159",\n      "lng": "81.1496"\n    }\n  },\n  "phone": "1-770-736-8031 x56442",\n  "website": "hildegard.org",\n  "company": {\n    "name": "Romaguera-Crona",\n    "catchPhrase": "Multi-layered client-server neural-net",\n    "bs": "harness real-time e-markets"\n  }\n}');
  const [interfaceName, setInterfaceName] = useState('RootObject');
  const [tsOutput, setTsOutput] = useState('');
  const [error, setError] = useState('');
  const { t } = useLanguage();
  const { toast } = useToast();

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  const getType = (value: any): string => {
    if (value === null) return 'null';
    if (Array.isArray(value)) {
      if (value.length === 0) return 'any[]';
      const firstElementType = getType(value[0]);
      // Note: A robust tool would check all elements, but this is a simple version
      return `${firstElementType}[]`;
    }
    if (typeof value === 'object') return 'object';
    return typeof value;
  };

  const generateTs = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      const interfaces: string[] = [];
      
      const parseObject = (obj: any, name: string) => {
        let result = `export interface ${name} {\n`;
        for (const key in obj) {
          const value = obj[key];
          let type = getType(value);
          
          if (type === 'object') {
            const childName = capitalize(key);
            type = childName;
            parseObject(value, childName); // recursive call to build nested interfaces
          } else if (type === 'object[]') {
             const childName = capitalize(key);
             type = `${childName}[]`;
             parseObject(value[0], childName);
          }
          
          result += `  ${key}: ${type};\n`;
        }
        result += `}\n`;
        interfaces.push(result);
      };

      if (Array.isArray(parsed)) {
        if (parsed.length > 0 && typeof parsed[0] === 'object') {
            parseObject(parsed[0], interfaceName);
        } else {
            setError('Root element is a primitive array.');
            setTsOutput('');
            return;
        }
      } else {
         parseObject(parsed, interfaceName);
      }
      
      setTsOutput(interfaces.reverse().join('\n'));
      setError('');
      toast({ title: "Generated", description: "TypeScript interface generated successfully." });
    } catch (e: any) {
      setError(e.message || 'Invalid JSON');
      setTsOutput('');
    }
  };

  const handleCopy = () => {
    if (!tsOutput) return;
    navigator.clipboard.writeText(tsOutput);
    toast({ title: "Copied", description: "TypeScript code copied to clipboard." });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <Card className="border-none shadow-2xl bg-card/80 backdrop-blur-xl border-2 border-primary/5 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-md">
                <FileJson2 className="w-8 h-8" />
              </div>
              <div>
                <CardTitle className="text-3xl font-black tracking-tight">{t('jsonTsTitle' as any) || 'JSON to TypeScript'}</CardTitle>
                <CardDescription className="text-white/70 font-bold">{t('jsonTsDesc' as any) || 'Instantly convert JSON objects into TypeScript Interfaces.'}</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-4">
               <Input 
                 value={interfaceName}
                 onChange={(e) => setInterfaceName(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                 placeholder="Root Interface Name"
                 className="bg-black/20 border-white/20 text-white placeholder:text-white/50 h-12 rounded-xl focus-visible:ring-white/50 w-48 font-mono"
               />
               <Button onClick={generateTs} className="h-12 px-6 rounded-xl font-black gap-2 bg-white text-indigo-600 hover:bg-white/90 shadow-lg">
                  GENERATE TS <ArrowRight className="w-4 h-4" />
               </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          
          <div className="grid grid-cols-1 lg:grid-cols-2">
             {/* JSON Input Area */}
             <div className="p-8 border-r border-border/50 space-y-4 bg-muted/10">
               <div className="flex items-center justify-between">
                 <label className="text-sm font-black uppercase tracking-widest text-primary/60">JSON Input</label>
                 <Button variant="ghost" size="sm" onClick={() => setJsonInput('')} className="h-8 text-xs font-bold text-muted-foreground hover:text-red-500">
                    CLEAR
                 </Button>
               </div>
               <Textarea 
                 value={jsonInput}
                 onChange={(e) => setJsonInput(e.target.value)}
                 className={`min-h-[500px] resize-none rounded-2xl border-2 focus:ring-0 p-6 text-sm font-mono bg-card leading-relaxed ${error ? 'border-red-500/50 focus:border-red-500' : 'focus:border-indigo-500'}`}
                 placeholder="Paste your JSON here..."
                 spellCheck={false}
               />
               {error && <div className="text-red-500 font-bold text-sm">Error: {error}</div>}
             </div>

             {/* TypeScript Output Area */}
             <div className="p-8 space-y-4 bg-indigo-50/30 dark:bg-indigo-950/10">
               <div className="flex items-center justify-between">
                 <label className="text-sm font-black uppercase tracking-widest text-indigo-600">TypeScript Interfaces</label>
                 <Button variant="ghost" size="sm" onClick={handleCopy} disabled={!tsOutput} className="h-8 text-xs font-bold text-indigo-600 hover:bg-indigo-100">
                    <Copy className="w-4 h-4 mr-2" /> COPY
                 </Button>
               </div>
               <Textarea 
                 value={tsOutput}
                 readOnly
                 className="min-h-[500px] resize-none rounded-2xl border-2 border-indigo-500/20 bg-white/50 dark:bg-black/20 p-6 text-sm font-mono text-indigo-900 dark:text-indigo-300 leading-relaxed focus:ring-0"
                 placeholder="TypeScript definitions will appear here..."
                 spellCheck={false}
               />
             </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
