'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Palette, Copy, RefreshCcw, Plus, Trash2 } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';

type ColorStop = { id: number; color: string; position: number };

let nextId = 3;

export default function CssGradientGenerator() {
  const [colorStops, setColorStops] = useState<ColorStop[]>([
    { id: 1, color: '#4f46e5', position: 0 },
    { id: 2, color: '#ec4899', position: 100 },
  ]);
  const [angle, setAngle] = useState(135);
  const [type, setType] = useState<'linear' | 'radial' | 'conic'>('linear');
  const [cssCode, setCssCode] = useState('');
  const { t } = useLanguage();
  const { toast } = useToast();

  useEffect(() => {
    const sorted = [...colorStops].sort((a, b) => a.position - b.position);
    const stops = sorted.map(s => `${s.color} ${s.position}%`).join(', ');

    let gradient = '';
    if (type === 'linear') gradient = `linear-gradient(${angle}deg, ${stops})`;
    else if (type === 'radial') gradient = `radial-gradient(circle, ${stops})`;
    else gradient = `conic-gradient(from ${angle}deg, ${stops})`;

    setCssCode(`background: ${sorted[0].color};\nbackground: ${gradient};`);
  }, [colorStops, angle, type]);

  const addStop = () => {
    const mid = Math.round((colorStops[0].position + colorStops[colorStops.length - 1].position) / 2);
    setColorStops(prev => [...prev, { id: nextId++, color: '#ffffff', position: mid }].sort((a,b) => a.position - b.position));
  };

  const removeStop = (id: number) => {
    if (colorStops.length <= 2) return;
    setColorStops(prev => prev.filter(s => s.id !== id));
  };

  const updateStop = (id: number, field: 'color' | 'position', value: string | number) => {
    setColorStops(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const randomGradient = () => {
    const randomColor = () => '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
    const count = Math.floor(Math.random() * 3) + 2; // 2-4 stops
    const stops: ColorStop[] = Array.from({ length: count }, (_, i) => ({
      id: nextId++,
      color: randomColor(),
      position: Math.round((i / (count - 1)) * 100),
    }));
    setColorStops(stops);
    setAngle(Math.floor(Math.random() * 360));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(cssCode);
    toast({ title: "Copied", description: "CSS Code copied to clipboard." });
  };

  const sortedStops = [...colorStops].sort((a, b) => a.position - b.position);
  const gradientPreview = type === 'linear'
    ? `linear-gradient(${angle}deg, ${sortedStops.map(s => `${s.color} ${s.position}%`).join(', ')})`
    : type === 'radial'
    ? `radial-gradient(circle, ${sortedStops.map(s => `${s.color} ${s.position}%`).join(', ')})`
    : `conic-gradient(from ${angle}deg, ${sortedStops.map(s => `${s.color} ${s.position}%`).join(', ')})`;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <Card className="border-none shadow-2xl bg-card/80 backdrop-blur-xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-pink-500 to-rose-500 text-white p-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-md">
                <Palette className="w-8 h-8" />
              </div>
              <div>
                <CardTitle className="text-3xl font-black tracking-tight">CSS Gradient Generator</CardTitle>
                <CardDescription className="text-white/70 font-bold">Multi-stop gradients — linear, radial, and conic.</CardDescription>
              </div>
            </div>
            <Button onClick={randomGradient} variant="ghost" className="h-12 px-6 rounded-xl font-black gap-2 text-white hover:bg-white/20">
               <RefreshCcw className="w-4 h-4" /> RANDOMIZE
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-8 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Controls */}
            <div className="space-y-6">
              {/* Type Selection */}
              <div className="space-y-3">
                <label className="text-sm font-black uppercase tracking-widest text-primary/60">Gradient Type</label>
                <div className="flex gap-3">
                  {(['linear', 'radial', 'conic'] as const).map(t_ => (
                    <Button
                      key={t_}
                      onClick={() => setType(t_)}
                      variant={type === t_ ? 'default' : 'outline'}
                      className={`flex-1 h-11 rounded-xl font-bold capitalize ${type === t_ ? 'bg-pink-600 hover:bg-pink-700 border-none' : ''}`}
                    >
                      {t_}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Angle Slider */}
              {type !== 'radial' && (
                <div className="space-y-3 bg-muted/30 p-4 rounded-2xl border-2">
                  <div className="flex justify-between">
                    <label className="text-sm font-black uppercase tracking-widest text-primary/60">Angle</label>
                    <span className="font-mono font-bold text-pink-600">{angle}°</span>
                  </div>
                  <Slider value={[angle]} min={0} max={360} step={1} onValueChange={v => setAngle(v[0])} className="py-2" />
                </div>
              )}

              {/* Color Stops */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-black uppercase tracking-widest text-primary/60">Color Stops</label>
                  <Button onClick={addStop} size="sm" className="h-8 gap-1 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-xl">
                    <Plus className="w-3.5 h-3.5" /> ADD STOP
                  </Button>
                </div>

                <div className="space-y-3">
                  {sortedStops.map(stop => (
                    <div key={stop.id} className="flex items-center gap-3 bg-muted/40 p-3 rounded-2xl border-2">
                      {/* Color Picker */}
                      <input
                        type="color"
                        value={stop.color}
                        onChange={e => updateStop(stop.id, 'color', e.target.value)}
                        className="w-10 h-10 rounded-xl cursor-pointer border-0 bg-transparent p-0 shrink-0"
                      />
                      <Input
                        value={stop.color.toUpperCase()}
                        onChange={e => updateStop(stop.id, 'color', e.target.value)}
                        className="w-32 font-mono font-bold border-2 text-sm focus-visible:ring-0"
                      />
                      {/* Position */}
                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between text-xs font-bold text-muted-foreground">
                          <span>Position</span><span className="text-pink-600">{stop.position}%</span>
                        </div>
                        <Slider
                          value={[stop.position]}
                          min={0}
                          max={100}
                          step={1}
                          onValueChange={v => updateStop(stop.id, 'position', v[0])}
                        />
                      </div>
                      {/* Remove */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeStop(stop.id)}
                        disabled={colorStops.length <= 2}
                        className="h-8 w-8 text-muted-foreground hover:text-red-500 shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="space-y-6">
              <label className="text-sm font-black uppercase tracking-widest text-primary/60">Live Preview</label>
              <div
                className="w-full h-72 rounded-3xl shadow-2xl border-4 border-white dark:border-muted transition-all duration-300"
                style={{ background: gradientPreview }}
              />
              <div className="relative">
                <pre className="p-6 bg-muted rounded-2xl border-2 font-mono text-sm overflow-x-auto text-primary whitespace-pre-wrap">
                  <code>{cssCode}</code>
                </pre>
                <Button
                  onClick={handleCopy}
                  size="sm"
                  className="absolute top-4 right-4 h-8 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-lg"
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
