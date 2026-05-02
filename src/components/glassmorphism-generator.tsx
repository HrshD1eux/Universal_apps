'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Droplet, Copy } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';

const BG_PRESETS = [
  { name: 'Purple Dream', style: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { name: 'Ocean Sunset', style: 'linear-gradient(135deg, #f093fb 0%, #f5576c 50%, #4facfe 100%)' },
  { name: 'Emerald Isle', style: 'linear-gradient(135deg, #0fd850 0%, #f9f047 100%)' },
  { name: 'Midnight City', style: 'linear-gradient(135deg, #232526 0%, #414345 100%)' },
  { name: 'Peachy Keen', style: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' },
  { name: 'Aurora', style: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 50%, #84fab0 100%)' },
];

export default function GlassmorphismGenerator() {
  const [blur, setBlur] = useState(10);
  const [opacity, setOpacity] = useState(0.2);
  const [borderOpacity, setBorderOpacity] = useState(0.3);
  const [color, setColor] = useState('#ffffff');
  const [selectedBg, setSelectedBg] = useState(0);
  const [customBg, setCustomBg] = useState('');
  const [cssCode, setCssCode] = useState('');

  const { t } = useLanguage();
  const { toast } = useToast();

  useEffect(() => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    const bgColor = `rgba(${r}, ${g}, ${b}, ${opacity})`;
    const borderColor = `rgba(255, 255, 255, ${borderOpacity})`;

    setCssCode(
`background: ${bgColor};
backdrop-filter: blur(${blur}px);
-webkit-backdrop-filter: blur(${blur}px);
border: 1px solid ${borderColor};
border-radius: 16px;`
    );
  }, [blur, opacity, borderOpacity, color]);

  const handleCopy = () => {
    navigator.clipboard.writeText(cssCode);
    toast({ title: "Copied", description: "CSS Code copied to clipboard." });
  };

  const bgStyle = customBg || BG_PRESETS[selectedBg].style;

  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) || 255;
  const g = parseInt(hex.substring(2, 4), 16) || 255;
  const b = parseInt(hex.substring(4, 6), 16) || 255;
  const glassStyle = {
    background: `rgba(${r}, ${g}, ${b}, ${opacity})`,
    backdropFilter: `blur(${blur}px)`,
    WebkitBackdropFilter: `blur(${blur}px)`,
    border: `1px solid rgba(255, 255, 255, ${borderOpacity})`,
    borderRadius: '16px',
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <Card className="border-none shadow-2xl bg-card/80 backdrop-blur-xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-teal-400 to-emerald-500 text-white p-8">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-md">
              <Droplet className="w-8 h-8" />
            </div>
            <div>
              <CardTitle className="text-3xl font-black tracking-tight">Glassmorphism Generator</CardTitle>
              <CardDescription className="text-white/70 font-bold">Design frosted-glass CSS effects with custom backgrounds.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

            {/* Controls */}
            <div className="space-y-6">

              {/* Background Presets */}
              <div className="space-y-3">
                <label className="text-sm font-black uppercase tracking-widest text-primary/60">Background Preset</label>
                <div className="grid grid-cols-3 gap-3">
                  {BG_PRESETS.map((bg, i) => (
                    <button
                      key={i}
                      onClick={() => { setSelectedBg(i); setCustomBg(''); }}
                      className={`h-14 rounded-2xl transition-all duration-200 border-4 ${selectedBg === i && !customBg ? 'border-teal-500 scale-105 shadow-xl' : 'border-transparent hover:scale-105'}`}
                      style={{ background: bg.style }}
                      title={bg.name}
                    />
                  ))}
                </div>
                <div className="space-y-2 pt-1">
                  <label className="text-xs font-bold text-muted-foreground">Custom CSS Gradient (optional)</label>
                  <input
                    type="text"
                    value={customBg}
                    onChange={e => setCustomBg(e.target.value)}
                    placeholder="e.g. linear-gradient(45deg, red, blue)"
                    className="w-full h-10 px-4 rounded-xl border-2 font-mono text-sm focus:outline-none focus:border-teal-500 bg-muted/30"
                  />
                </div>
              </div>

              {/* Sliders */}
              {[
                { label: 'Backdrop Blur', val: blur, set: setBlur, min: 0, max: 60, step: 1, suffix: 'px' },
                { label: 'Background Opacity', val: opacity, set: setOpacity, min: 0, max: 1, step: 0.01, suffix: '' },
                { label: 'Border Opacity', val: borderOpacity, set: setBorderOpacity, min: 0, max: 1, step: 0.01, suffix: '' },
              ].map(ctrl => (
                <div key={ctrl.label} className="space-y-3 bg-muted/30 p-4 rounded-2xl border-2">
                  <div className="flex justify-between">
                    <label className="text-sm font-black uppercase tracking-widest text-primary/60">{ctrl.label}</label>
                    <span className="font-mono font-bold text-teal-600 bg-teal-50 dark:bg-teal-950/30 px-2 py-0.5 rounded-md">
                      {ctrl.val}{ctrl.suffix}
                    </span>
                  </div>
                  <Slider value={[ctrl.val]} min={ctrl.min} max={ctrl.max} step={ctrl.step}
                    onValueChange={v => ctrl.set(v[0])} className="py-2" />
                </div>
              ))}

              {/* Tint Color */}
              <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-2xl border-2">
                <label className="text-sm font-black uppercase tracking-widest text-primary/60 flex-1">Tint Color</label>
                <input type="color" value={color} onChange={e => setColor(e.target.value)}
                  className="w-10 h-10 rounded-xl cursor-pointer border-0 bg-transparent p-0" />
                <span className="font-mono text-sm font-bold">{color}</span>
              </div>
            </div>

            {/* Preview */}
            <div className="space-y-6 flex flex-col">
              <label className="text-sm font-black uppercase tracking-widest text-primary/60">Live Preview</label>

              <div
                className="flex-1 flex items-center justify-center rounded-3xl overflow-hidden min-h-[380px] border-2 relative"
                style={{ background: bgStyle }}
              >
                {/* Floating blobs */}
                <div className="absolute w-32 h-32 rounded-full bg-yellow-400/50 blur-2xl top-8 left-8" />
                <div className="absolute w-32 h-32 rounded-full bg-cyan-400/50 blur-2xl bottom-8 right-8" />

                <div className="relative z-10 w-3/4 p-8 space-y-4 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)]" style={glassStyle}>
                  <div className="w-1/2 h-4 bg-white/50 rounded-full" />
                  <div className="space-y-2">
                    <div className="w-full h-3 bg-white/30 rounded-full" />
                    <div className="w-5/6 h-3 bg-white/30 rounded-full" />
                    <div className="w-4/6 h-3 bg-white/30 rounded-full" />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <div className="h-8 w-24 bg-white/40 rounded-xl" />
                    <div className="h-8 w-20 bg-white/20 rounded-xl border border-white/30" />
                  </div>
                </div>
              </div>

              <div className="relative">
                <pre className="p-6 bg-muted rounded-2xl border-2 font-mono text-sm overflow-x-auto text-primary">
                  <code>{cssCode}</code>
                </pre>
                <Button onClick={handleCopy} size="sm"
                  className="absolute top-4 right-4 h-8 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg">
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
