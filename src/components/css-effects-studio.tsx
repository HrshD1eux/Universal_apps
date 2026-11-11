'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Droplet, Sparkles, Copy, Check, Palette } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { notifyCopied } from '@/lib/notify';

export default function CssEffectsStudio() {
  const [activeTab, setActiveTab] = useState<'shadow' | 'glass' | 'neumorphism'>('shadow');

  // Shadow State
  const [x, setX] = useState(12);
  const [y, setY] = useState(16);
  const [blur, setBlur] = useState(24);
  const [spread, setSpread] = useState(-4);
  const [shadowColor, setShadowColor] = useState('#000000');
  const [shadowOpacity, setShadowOpacity] = useState(0.25);
  const [isInset, setIsInset] = useState(false);
  const [boxColor, setBoxColor] = useState('#ffffff');

  // Glassmorphism State
  const [glassBlur, setGlassBlur] = useState(16);
  const [glassOpacity, setGlassOpacity] = useState(0.25);
  const [glassBorderOpacity, setGlassBorderOpacity] = useState(0.3);
  const [glassColor, setGlassColor] = useState('#ffffff');
  const [glassBgPreset, setGlassBgPreset] = useState('linear-gradient(135deg, #6366f1 0%, #ec4899 100%)');

  // Neumorphism State
  const [neuDistance, setNeuDistance] = useState(14);
  const [neuBlur, setNeuBlur] = useState(28);
  const [neuIntensity, setNeuIntensity] = useState(0.15);
  const [neuColor, setNeuColor] = useState('#e0e5ec');
  const [neuShape, setNeuShape] = useState<'flat' | 'concave' | 'convex' | 'pressed'>('flat');

  const { t } = useLanguage();

  // Shadow CSS Calculation
  const shadowCss = useMemo(() => {
    const hex = shadowColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16) || 0;
    const g = parseInt(hex.substring(2, 4), 16) || 0;
    const b = parseInt(hex.substring(4, 6), 16) || 0;
    const rgba = `rgba(${r}, ${g}, ${b}, ${shadowOpacity})`;
    const val = `${isInset ? 'inset ' : ''}${x}px ${y}px ${blur}px ${spread}px ${rgba}`;
    return `box-shadow: ${val};\n-webkit-box-shadow: ${val};`;
  }, [x, y, blur, spread, shadowColor, shadowOpacity, isInset]);

  // Glassmorphism CSS Calculation
  const glassCss = useMemo(() => {
    const hex = glassColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16) || 255;
    const g = parseInt(hex.substring(2, 4), 16) || 255;
    const b = parseInt(hex.substring(4, 6), 16) || 255;
    return `background: rgba(${r}, ${g}, ${b}, ${glassOpacity});\nbackdrop-filter: blur(${glassBlur}px);\n-webkit-backdrop-filter: blur(${glassBlur}px);\nborder: 1px solid rgba(255, 255, 255, ${glassBorderOpacity});\nborder-radius: 20px;`;
  }, [glassColor, glassOpacity, glassBlur, glassBorderOpacity]);

  // Neumorphism CSS Calculation
  const neuCss = useMemo(() => {
    const d = neuDistance;
    const b = neuBlur;
    return `background: ${neuColor};\nborder-radius: 24px;\nbox-shadow: ${d}px ${d}px ${b}px rgba(0, 0, 0, ${neuIntensity}),\n            -${d}px -${d}px ${b}px rgba(255, 255, 255, 0.9);`;
  }, [neuDistance, neuBlur, neuIntensity, neuColor]);

  const activeCss = activeTab === 'shadow' ? shadowCss : activeTab === 'glass' ? glassCss : neuCss;

  const copyCss = () => {
    navigator.clipboard.writeText(activeCss);
    notifyCopied('CSS styles');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16 px-4">
      <Card className="border shadow-xl bg-card overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20">
                <Layers className="w-8 h-8 text-white" />
              </div>
              <div>
                <CardTitle className="text-3xl font-black tracking-tight">CSS Visual Effects Studio</CardTitle>
                <CardDescription className="text-white/75 font-semibold">
                  Generate professional box-shadows, glassmorphism, and soft neumorphic UI styles
                </CardDescription>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex p-1 bg-black/30 rounded-xl border border-white/10">
              <button
                onClick={() => setActiveTab('shadow')}
                className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${
                  activeTab === 'shadow'
                    ? 'bg-white text-blue-900 shadow-md'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                Box Shadow
              </button>
              <button
                onClick={() => setActiveTab('glass')}
                className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${
                  activeTab === 'glass'
                    ? 'bg-white text-blue-900 shadow-md'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                Glassmorphism
              </button>
              <button
                onClick={() => setActiveTab('neumorphism')}
                className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${
                  activeTab === 'neumorphism'
                    ? 'bg-white text-blue-900 shadow-md'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                Neumorphism
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Controls */}
            <div className="lg:col-span-6 space-y-6">
              <AnimatePresence mode="wait">
                {activeTab === 'shadow' && (
                  <motion.div
                    key="shadow-controls"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-5"
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-black uppercase tracking-wider text-muted-foreground">
                        <span>Horizontal Offset (X)</span>
                        <span>{x}px</span>
                      </div>
                      <Slider value={[x]} min={-50} max={50} step={1} onValueChange={([v]) => setX(v)} />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-black uppercase tracking-wider text-muted-foreground">
                        <span>Vertical Offset (Y)</span>
                        <span>{y}px</span>
                      </div>
                      <Slider value={[y]} min={-50} max={50} step={1} onValueChange={([v]) => setY(v)} />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-black uppercase tracking-wider text-muted-foreground">
                        <span>Blur Radius</span>
                        <span>{blur}px</span>
                      </div>
                      <Slider value={[blur]} min={0} max={100} step={1} onValueChange={([v]) => setBlur(v)} />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-black uppercase tracking-wider text-muted-foreground">
                        <span>Spread Radius</span>
                        <span>{spread}px</span>
                      </div>
                      <Slider value={[spread]} min={-30} max={50} step={1} onValueChange={([v]) => setSpread(v)} />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-black uppercase tracking-wider text-muted-foreground">
                        <span>Shadow Opacity</span>
                        <span>{Math.round(shadowOpacity * 100)}%</span>
                      </div>
                      <Slider value={[shadowOpacity]} min={0} max={1} step={0.01} onValueChange={([v]) => setShadowOpacity(v)} />
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div>
                        <label className="text-xs font-black uppercase tracking-wider text-muted-foreground block mb-1">
                          Shadow Color
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={shadowColor}
                            onChange={(e) => setShadowColor(e.target.value)}
                            className="w-10 h-10 rounded-lg cursor-pointer border p-0.5"
                          />
                          <Input
                            value={shadowColor}
                            onChange={(e) => setShadowColor(e.target.value)}
                            className="font-mono text-xs uppercase"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between border rounded-xl p-3">
                        <span className="text-xs font-black uppercase tracking-wider">Inset Shadow</span>
                        <Switch checked={isInset} onCheckedChange={setIsInset} />
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'glass' && (
                  <motion.div
                    key="glass-controls"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-5"
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-black uppercase tracking-wider text-muted-foreground">
                        <span>Backdrop Blur</span>
                        <span>{glassBlur}px</span>
                      </div>
                      <Slider value={[glassBlur]} min={0} max={40} step={1} onValueChange={([v]) => setGlassBlur(v)} />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-black uppercase tracking-wider text-muted-foreground">
                        <span>Glass Opacity</span>
                        <span>{Math.round(glassOpacity * 100)}%</span>
                      </div>
                      <Slider value={[glassOpacity]} min={0.05} max={0.9} step={0.01} onValueChange={([v]) => setGlassOpacity(v)} />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-black uppercase tracking-wider text-muted-foreground">
                        <span>Border Opacity</span>
                        <span>{Math.round(glassBorderOpacity * 100)}%</span>
                      </div>
                      <Slider value={[glassBorderOpacity]} min={0} max={0.9} step={0.01} onValueChange={([v]) => setGlassBorderOpacity(v)} />
                    </div>

                    <div className="space-y-2 pt-2">
                      <label className="text-xs font-black uppercase tracking-wider text-muted-foreground block mb-2">
                        Canvas Background Preset
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { name: 'Aurora', bg: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)' },
                          { name: 'Sunset', bg: 'linear-gradient(135deg, #f97316 0%, #db2777 100%)' },
                          { name: 'Emerald', bg: 'linear-gradient(135deg, #059669 0%, #0284c7 100%)' },
                          { name: 'Cyberpunk', bg: 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)' },
                          { name: 'Dark Mode', bg: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' },
                          { name: 'Gold Mesh', bg: 'linear-gradient(135deg, #eab308 0%, #ef4444 100%)' },
                        ].map((item) => (
                          <button
                            key={item.name}
                            onClick={() => setGlassBgPreset(item.bg)}
                            className="h-9 rounded-lg border text-[11px] font-bold text-white shadow-sm flex items-center justify-center transition-transform hover:scale-105"
                            style={{ background: item.bg }}
                          >
                            {item.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'neumorphism' && (
                  <motion.div
                    key="neu-controls"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-5"
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-black uppercase tracking-wider text-muted-foreground">
                        <span>Elevation Distance</span>
                        <span>{neuDistance}px</span>
                      </div>
                      <Slider value={[neuDistance]} min={4} max={30} step={1} onValueChange={([v]) => setNeuDistance(v)} />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-black uppercase tracking-wider text-muted-foreground">
                        <span>Shadow Blur</span>
                        <span>{neuBlur}px</span>
                      </div>
                      <Slider value={[neuBlur]} min={5} max={60} step={1} onValueChange={([v]) => setNeuBlur(v)} />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-black uppercase tracking-wider text-muted-foreground">
                        <span>Shadow Intensity</span>
                        <span>{Math.round(neuIntensity * 100)}%</span>
                      </div>
                      <Slider value={[neuIntensity]} min={0.05} max={0.4} step={0.01} onValueChange={([v]) => setNeuIntensity(v)} />
                    </div>

                    <div>
                      <label className="text-xs font-black uppercase tracking-wider text-muted-foreground block mb-1">
                        Base Surface Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={neuColor}
                          onChange={(e) => setNeuColor(e.target.value)}
                          className="w-10 h-10 rounded-lg cursor-pointer border p-0.5"
                        />
                        <Input
                          value={neuColor}
                          onChange={(e) => setNeuColor(e.target.value)}
                          className="font-mono text-xs uppercase"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Right Live Preview & Generated Code */}
            <div className="lg:col-span-6 space-y-6">
              {/* Visual Preview Box */}
              <div
                className="w-full h-72 rounded-2xl border flex items-center justify-center p-8 transition-all overflow-hidden relative"
                style={{
                  background:
                    activeTab === 'glass'
                      ? glassBgPreset
                      : activeTab === 'neumorphism'
                      ? neuColor
                      : '#f8fafc',
                }}
              >
                {activeTab === 'shadow' && (
                  <div
                    className="w-48 h-48 rounded-2xl flex items-center justify-center font-black text-sm text-foreground bg-white transition-all"
                    style={{
                      boxShadow: `${isInset ? 'inset ' : ''}${x}px ${y}px ${blur}px ${spread}px rgba(0, 0, 0, ${shadowOpacity})`,
                    }}
                  >
                    Shadow Box
                  </div>
                )}

                {activeTab === 'glass' && (
                  <div
                    className="w-56 h-44 flex flex-col items-center justify-center text-white font-bold text-sm p-4 transition-all"
                    style={{
                      background: `rgba(255, 255, 255, ${glassOpacity})`,
                      backdropFilter: `blur(${glassBlur}px)`,
                      WebkitBackdropFilter: `blur(${glassBlur}px)`,
                      border: `1px solid rgba(255, 255, 255, ${glassBorderOpacity})`,
                      borderRadius: '20px',
                    }}
                  >
                    <Droplet className="w-8 h-8 mb-2 opacity-90" />
                    <span>Frosted Glass</span>
                    <span className="text-[10px] opacity-75 font-mono">blur({glassBlur}px)</span>
                  </div>
                )}

                {activeTab === 'neumorphism' && (
                  <div
                    className="w-44 h-44 rounded-3xl flex flex-col items-center justify-center font-black text-sm text-slate-700 transition-all"
                    style={{
                      background: neuColor,
                      boxShadow: `${neuDistance}px ${neuDistance}px ${neuBlur}px rgba(0, 0, 0, ${neuIntensity}), -${neuDistance}px -${neuDistance}px ${neuBlur}px rgba(255, 255, 255, 0.9)`,
                    }}
                  >
                    <Layers className="w-8 h-8 mb-1 opacity-70" />
                    <span>Soft UI</span>
                  </div>
                )}
              </div>

              {/* Code Box */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                    Generated CSS Code
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={copyCss}
                    className="font-bold text-xs gap-1.5 h-8"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copy CSS
                  </Button>
                </div>
                <pre className="p-4 rounded-xl bg-slate-950 text-slate-50 font-mono text-xs overflow-x-auto border border-slate-800 leading-relaxed">
                  {activeCss}
                </pre>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
