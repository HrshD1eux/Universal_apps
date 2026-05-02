'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Layers, Copy } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';

export default function BoxShadowGenerator() {
  const [x, setX] = useState(10);
  const [y, setY] = useState(10);
  const [blur, setBlur] = useState(15);
  const [spread, setSpread] = useState(-3);
  const [color, setColor] = useState('#000000');
  const [opacity, setOpacity] = useState(0.2);
  const [inset, setInset] = useState(false);
  const [boxColor, setBoxColor] = useState('#ffffff');
  const [bgColor, setBgColor] = useState('#f3f4f6');
  
  const [cssCode, setCssCode] = useState('');
  
  const { t } = useLanguage();
  const { toast } = useToast();

  useEffect(() => {
    // Convert hex + opacity to rgba
    const hex = color.replace('#', '');
    const r = parseInt(hex.length === 3 ? hex[0]+hex[0] : hex.substring(0, 2), 16);
    const g = parseInt(hex.length === 3 ? hex[1]+hex[1] : hex.substring(2, 4), 16);
    const b = parseInt(hex.length === 3 ? hex[2]+hex[2] : hex.substring(4, 6), 16);
    
    const rgba = `rgba(${r}, ${g}, ${b}, ${opacity})`;
    const shadow = `${inset ? 'inset ' : ''}${x}px ${y}px ${blur}px ${spread}px ${rgba}`;
    
    setCssCode(`box-shadow: ${shadow};\n-webkit-box-shadow: ${shadow};\n-moz-box-shadow: ${shadow};`);
  }, [x, y, blur, spread, color, opacity, inset]);

  const handleCopy = () => {
    navigator.clipboard.writeText(cssCode);
    toast({ title: "Copied", description: "CSS Code copied to clipboard." });
  };

  const shadowValue = cssCode.split(';')[0].replace('box-shadow: ', '');

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <Card className="border-none shadow-2xl bg-card/80 backdrop-blur-xl border-2 border-primary/5 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-cyan-600 to-blue-700 text-white p-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-md">
                <Layers className="w-8 h-8" />
              </div>
              <div>
                <CardTitle className="text-3xl font-black tracking-tight">{t('shadowTitle' as any) || 'Box Shadow Generator'}</CardTitle>
                <CardDescription className="text-white/70 font-bold">{t('shadowDesc' as any) || 'Create perfectly tailored CSS drop shadows.'}</CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8 space-y-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
             
             {/* Controls */}
             <div className="space-y-6">
                
                {[
                  { label: 'Shift Right (X)', val: x, set: setX, min: -50, max: 50 },
                  { label: 'Shift Down (Y)', val: y, set: setY, min: -50, max: 50 },
                  { label: 'Blur', val: blur, set: setBlur, min: 0, max: 100 },
                  { label: 'Spread', val: spread, set: setSpread, min: -50, max: 50 },
                  { label: 'Opacity', val: opacity, set: setOpacity, min: 0, max: 1, step: 0.01 },
                ].map(control => (
                  <div key={control.label} className="space-y-4 bg-muted/30 p-4 rounded-2xl border-2">
                     <div className="flex justify-between items-center">
                       <label className="text-sm font-black uppercase tracking-widest text-primary/60">{control.label}</label>
                       <span className="font-mono font-bold text-cyan-600 bg-cyan-50 dark:bg-cyan-950/30 px-2 py-1 rounded-md">{control.val}{control.label !== 'Opacity' ? 'px' : ''}</span>
                     </div>
                     <Slider
                        value={[control.val]}
                        min={control.min}
                        max={control.max}
                        step={control.step || 1}
                        onValueChange={(vals) => control.set(vals[0])}
                        className="py-2"
                     />
                  </div>
                ))}

                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2 bg-muted/30 p-4 rounded-2xl border-2">
                      <label className="text-sm font-black uppercase tracking-widest text-primary/60">Shadow Color</label>
                      <div className="flex items-center gap-2">
                         <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0" />
                         <span className="font-mono text-sm">{color}</span>
                      </div>
                   </div>
                   <div className="space-y-2 bg-muted/30 p-4 rounded-2xl border-2 flex flex-col justify-center items-center">
                      <label className="text-sm font-black uppercase tracking-widest text-primary/60">Inset (Inner)</label>
                      <Switch checked={inset} onCheckedChange={setInset} />
                   </div>
                </div>

             </div>

             {/* Preview Area */}
             <div className="space-y-6 flex flex-col">
               <label className="text-sm font-black uppercase tracking-widest text-primary/60">Live Preview</label>
               
               <div className="flex gap-4">
                  <div className="flex-1 space-y-2">
                     <label className="text-xs font-bold text-muted-foreground">Box Color</label>
                     <input type="color" value={boxColor} onChange={(e) => setBoxColor(e.target.value)} className="w-full h-10 rounded-xl cursor-pointer bg-transparent border-2 p-1" />
                  </div>
                  <div className="flex-1 space-y-2">
                     <label className="text-xs font-bold text-muted-foreground">Background Color</label>
                     <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-full h-10 rounded-xl cursor-pointer bg-transparent border-2 p-1" />
                  </div>
               </div>

               <div 
                 className="flex-1 flex items-center justify-center rounded-3xl transition-colors duration-300 border-2 overflow-hidden min-h-[300px]"
                 style={{ backgroundColor: bgColor }}
               >
                  <div 
                    className="w-48 h-48 rounded-2xl transition-all duration-300 border border-white/20"
                    style={{ 
                       backgroundColor: boxColor,
                       boxShadow: shadowValue
                    }}
                  />
               </div>
               
               <div className="relative">
                  <pre className="p-6 bg-muted rounded-2xl border-2 font-mono text-sm overflow-x-auto text-primary">
                     <code>{cssCode}</code>
                  </pre>
                  <Button 
                    onClick={handleCopy} 
                    size="sm" 
                    className="absolute top-4 right-4 h-8 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-lg shadow-lg"
                  >
                     <Copy className="w-4 h-4 mr-2" /> COPY CSS
                  </Button>
               </div>
             </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
