'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Palette, Copy, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';

// Helper: HEX to HSL
const hexToHsl = (hex: string) => {
  let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { h: 0, s: 0, l: 0 };
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  let max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    let d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
};

// Helper: HSL to HEX
const hslToHex = (h: number, s: number, l: number) => {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
};

export default function ColorPaletteMaker() {
  const [baseColor, setBaseColor] = useState('#6366F1');
  const [palettes, setPalettes] = useState<{name: string, colors: string[]}[]>([]);
  
  const { t } = useLanguage();
  const { toast } = useToast();

  useEffect(() => {
    const hsl = hexToHsl(baseColor);
    
    // Analogous (Hue +/- 30)
    const analogous = [
      hslToHex((hsl.h + 300) % 360, hsl.s, hsl.l),
      hslToHex((hsl.h + 330) % 360, hsl.s, hsl.l),
      baseColor.toUpperCase(),
      hslToHex((hsl.h + 30) % 360, hsl.s, hsl.l),
      hslToHex((hsl.h + 60) % 360, hsl.s, hsl.l),
    ];

    // Monochromatic (Change Lightness)
    const monochromatic = [
      hslToHex(hsl.h, hsl.s, Math.max(0, hsl.l - 40)),
      hslToHex(hsl.h, hsl.s, Math.max(0, hsl.l - 20)),
      baseColor.toUpperCase(),
      hslToHex(hsl.h, hsl.s, Math.min(100, hsl.l + 20)),
      hslToHex(hsl.h, hsl.s, Math.min(100, hsl.l + 40)),
    ];

    // Triadic (Hue + 120, Hue + 240)
    const triadic = [
      baseColor.toUpperCase(),
      hslToHex((hsl.h + 120) % 360, hsl.s, Math.min(100, hsl.l + 10)),
      hslToHex((hsl.h + 120) % 360, hsl.s, hsl.l),
      hslToHex((hsl.h + 240) % 360, hsl.s, Math.min(100, hsl.l + 10)),
      hslToHex((hsl.h + 240) % 360, hsl.s, hsl.l),
    ];

    // Complementary (Hue + 180)
    const complementary = [
      hslToHex(hsl.h, hsl.s, Math.max(0, hsl.l - 20)),
      baseColor.toUpperCase(),
      hslToHex(hsl.h, Math.max(0, hsl.s - 20), Math.min(100, hsl.l + 20)),
      hslToHex((hsl.h + 180) % 360, hsl.s, hsl.l),
      hslToHex((hsl.h + 180) % 360, hsl.s, Math.max(0, hsl.l - 20)),
    ];

    setPalettes([
      { name: 'Analogous', colors: analogous },
      { name: 'Monochromatic', colors: monochromatic },
      { name: 'Triadic', colors: triadic },
      { name: 'Complementary', colors: complementary },
    ]);
  }, [baseColor]);

  const handleCopy = (color: string) => {
    navigator.clipboard.writeText(color);
    toast({ title: "Color Copied", description: `${color} copied to clipboard.` });
  };

  const randomColor = () => {
    setBaseColor('#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0').toUpperCase());
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <Card className="border-none shadow-2xl bg-card/80 backdrop-blur-xl border-2 border-primary/5 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white p-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-md">
                <Palette className="w-8 h-8" />
              </div>
              <div>
                <CardTitle className="text-3xl font-black tracking-tight">{t('paletteTitle' as any) || 'Color Palette Maker'}</CardTitle>
                <CardDescription className="text-white/70 font-bold">{t('paletteDesc' as any) || 'Generate harmonious color schemes from a base color.'}</CardDescription>
              </div>
            </div>
            <Button onClick={randomColor} variant="ghost" className="h-12 px-6 rounded-xl font-black gap-2 text-white hover:bg-white/20">
               <Palette className="w-4 h-4" /> RANDOMIZE BASE
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-8 space-y-12">
          
          <div className="flex flex-col md:flex-row items-center gap-6 max-w-lg mx-auto">
             <label className="text-sm font-black uppercase tracking-widest text-primary/60 whitespace-nowrap">Base Color</label>
             <div className="w-full flex items-center gap-4 bg-muted/50 p-2 rounded-2xl border-2">
                <input 
                  type="color" 
                  value={baseColor} 
                  onChange={(e) => setBaseColor(e.target.value.toUpperCase())}
                  className="w-16 h-16 rounded-xl cursor-pointer bg-transparent border-0 p-0"
                />
                <Input 
                  value={baseColor} 
                  onChange={(e) => setBaseColor(e.target.value.toUpperCase())} 
                  className="border-none font-mono font-black focus-visible:ring-0 bg-transparent text-2xl h-16"
                />
             </div>
          </div>

          <div className="space-y-12">
             {palettes.map(palette => (
               <div key={palette.name} className="space-y-4">
                  <h3 className="text-xl font-black tracking-tight text-primary/80 border-b-2 pb-2">{palette.name}</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                     {palette.colors.map((c, i) => (
                        <div 
                          key={i} 
                          onClick={() => handleCopy(c)}
                          className="group cursor-pointer rounded-2xl overflow-hidden shadow-lg border-2 hover:scale-105 transition-transform duration-200"
                        >
                           <div className="h-24 w-full" style={{ backgroundColor: c }} />
                           <div className="bg-card p-3 flex justify-between items-center">
                              <span className="font-mono font-bold text-sm">{c}</span>
                              <Copy className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
             ))}
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
