'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { 
  Printer, Palette, AlertTriangle, CheckCircle2, 
  Info, Copy, ShieldAlert, Sparkles, Layers
} from 'lucide-react';
import { notifyCopied, notifyCompleted } from '@/lib/notify';

export default function CmykVerifier() {
  const [c, setC] = useState<number>(60);
  const [m, setM] = useState<number>(40);
  const [y, setY] = useState<number>(40);
  const [k, setK] = useState<number>(100);

  // Total Ink Coverage (TIC / TAC)
  const totalInkCoverage = useMemo(() => c + m + y + k, [c, m, y, k]);

  // Convert CMYK to approximate sRGB for screen rendering
  const rgb = useMemo(() => {
    const cNorm = c / 100;
    const mNorm = m / 100;
    const yNorm = y / 100;
    const kNorm = k / 100;

    const r = Math.round(255 * (1 - cNorm) * (1 - kNorm));
    const g = Math.round(255 * (1 - mNorm) * (1 - kNorm));
    const b = Math.round(255 * (1 - yNorm) * (1 - kNorm));
    return { r, g, b };
  }, [c, m, y, k]);

  const hexColor = useMemo(() => {
    const toHex = (n: number) => n.toString(16).padStart(2, '0');
    return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
  }, [rgb]);

  // Handle direct HEX input
  const handleHexChange = (hex: string) => {
    const cleanHex = hex.replace('#', '');
    if (cleanHex.length === 6) {
      const r = parseInt(cleanHex.substring(0, 2), 16);
      const g = parseInt(cleanHex.substring(2, 4), 16);
      const b = parseInt(cleanHex.substring(4, 6), 16);

      const rNorm = r / 255;
      const gNorm = g / 255;
      const bNorm = b / 255;

      const kVal = 1 - Math.max(rNorm, gNorm, bNorm);
      if (kVal === 1) {
        setC(0); setM(0); setY(0); setK(100);
      } else {
        const cVal = Math.round(((1 - rNorm - kVal) / (1 - kVal)) * 100);
        const mVal = Math.round(((1 - gNorm - kVal) / (1 - kVal)) * 100);
        const yVal = Math.round(((1 - bNorm - kVal) / (1 - kVal)) * 100);
        setC(Math.max(0, Math.min(100, cVal)));
        setM(Math.max(0, Math.min(100, mVal)));
        setY(Math.max(0, Math.min(100, yVal)));
        setK(Math.round(kVal * 100));
      }
    }
  };

  // Black Classification Analysis
  const blackAnalysis = useMemo(() => {
    if (k === 100 && c === 0 && m === 0 && y === 0) {
      return {
        type: 'Pure Standard Black (K: 100%)',
        desc: 'Ideal for body text, fine lines, and barcodes. No ink registration misalignment on offset presses.',
        isSafeText: true,
      };
    }
    if (c === 100 && m === 100 && y === 100 && k === 100) {
      return {
        type: 'Registration Black (400% TIC)',
        desc: 'DANGER: Never use in design artwork! Strictly reserved for printer trim/crop alignment marks.',
        isCritical: true,
      };
    }
    if (k >= 80 && (c > 0 || m > 0 || y > 0)) {
      return {
        type: 'Rich Black Formula',
        desc: 'Adds colored undertones beneath black ink for deep, rich solid backgrounds. Do NOT use for small text.',
        isRichBlack: true,
      };
    }
    return null;
  }, [c, m, y, k]);

  // Quick Presets
  const applyPreset = (newC: number, newM: number, newY: number, newK: number) => {
    setC(newC);
    setM(newM);
    setY(newY);
    setK(newK);
  };

  const copyCorelString = () => {
    const text = `C:${c} M:${m} Y:${y} K:${k}`;
    navigator.clipboard.writeText(text);
    notifyCopied(text);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 px-4">
      <Card className="border shadow-xl bg-card overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20">
                <Printer className="w-8 h-8 text-white" />
              </div>
              <div>
                <CardTitle className="text-3xl font-black tracking-tight">
                  CMYK & Rich Black Print Verifier
                </CardTitle>
                <CardDescription className="text-white/75 font-semibold">
                  Total Ink Coverage (TIC) calculator & offset press color separation for CorelDRAW designers
                </CardDescription>
              </div>
            </div>

            {/* TIC Badge */}
            <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl border backdrop-blur-md ${
              totalInkCoverage <= 300 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : totalInkCoverage <= 340
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                : 'bg-red-500/20 border-red-500/40 text-red-300'
            }`}>
              {totalInkCoverage <= 300 ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-amber-400" />
              )}
              <div>
                <div className="text-[10px] font-black uppercase tracking-wider opacity-80">Total Ink Coverage</div>
                <div className="text-2xl font-black font-mono">{totalInkCoverage}%</div>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Controls: CMYK Sliders */}
            <div className="lg:col-span-6 space-y-6">
              {/* Cyan */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-black uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                  <span>Cyan (C)</span>
                  <span className="font-mono text-sm">{c}%</span>
                </div>
                <Slider value={[c]} min={0} max={100} step={1} onValueChange={([v]) => setC(v)} />
              </div>

              {/* Magenta */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-black uppercase tracking-wider text-fuchsia-600 dark:text-fuchsia-400">
                  <span>Magenta (M)</span>
                  <span className="font-mono text-sm">{m}%</span>
                </div>
                <Slider value={[m]} min={0} max={100} step={1} onValueChange={([v]) => setM(v)} />
              </div>

              {/* Yellow */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-black uppercase tracking-wider text-yellow-600 dark:text-yellow-400">
                  <span>Yellow (Y)</span>
                  <span className="font-mono text-sm">{y}%</span>
                </div>
                <Slider value={[y]} min={0} max={100} step={1} onValueChange={([v]) => setY(v)} />
              </div>

              {/* Key / Black */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-300">
                  <span>Black / Key (K)</span>
                  <span className="font-mono text-sm">{k}%</span>
                </div>
                <Slider value={[k]} min={0} max={100} step={1} onValueChange={([v]) => setK(v)} />
              </div>

              {/* Standard Print Presets */}
              <div className="space-y-3 pt-4 border-t">
                <div className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                  Industry Standard Print Presets
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => applyPreset(0, 0, 0, 100)}
                    className="font-bold text-xs justify-start"
                  >
                    Pure K-100 (Text Safe)
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => applyPreset(60, 40, 40, 100)}
                    className="font-bold text-xs justify-start"
                  >
                    Standard Rich Black (240%)
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => applyPreset(60, 0, 0, 100)}
                    className="font-bold text-xs justify-start"
                  >
                    Cool Rich Black (160%)
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => applyPreset(0, 60, 30, 100)}
                    className="font-bold text-xs justify-start"
                  >
                    Warm Rich Black (190%)
                  </Button>
                </div>
              </div>
            </div>

            {/* Right Column: Visual Swatch & Press Safety Verdict */}
            <div className="lg:col-span-6 space-y-6">
              {/* Swatch & Values Card */}
              <div className="border rounded-2xl p-6 bg-muted/20 space-y-5">
                <div className="flex items-center gap-6">
                  {/* Color Swatch */}
                  <div
                    className="w-24 h-24 rounded-2xl border shadow-inner transition-all flex-shrink-0"
                    style={{ backgroundColor: hexColor }}
                  />

                  {/* Values */}
                  <div className="space-y-1.5 flex-1">
                    <div className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                      sRGB Simulation
                    </div>
                    <div className="text-2xl font-black font-mono tracking-tight">{hexColor.toUpperCase()}</div>
                    <div className="text-xs font-mono text-muted-foreground">
                      rgb({rgb.r}, {rgb.g}, {rgb.b})
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={copyCorelString}
                    className="font-bold text-xs gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copy CMYK
                  </Button>
                </div>

                {/* Print Verification & Safety Verdict */}
                <div className="border-t pt-4 space-y-4">
                  {totalInkCoverage <= 300 ? (
                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 space-y-1">
                      <div className="font-bold text-sm flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" /> Safe for Coated Offset Press (FOGRA39 / SWOP)
                      </div>
                      <p className="text-xs opacity-90 leading-relaxed">
                        Total ink coverage is under the standard 300% TAC limit. Minimal risk of ink offsetting, smudging, or paper saturation.
                      </p>
                    </div>
                  ) : totalInkCoverage <= 340 ? (
                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 space-y-1">
                      <div className="font-bold text-sm flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" /> Warning: High Ink Coverage ({totalInkCoverage}%)
                      </div>
                      <p className="text-xs opacity-90 leading-relaxed">
                        Exceeds 300% limit. Many offset and flex printing presses will reject this file or require extended drying times.
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-300 space-y-1">
                      <div className="font-bold text-sm flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4" /> DANGER: Extreme Ink Saturation ({totalInkCoverage}%)
                      </div>
                      <p className="text-xs opacity-90 leading-relaxed">
                        Severe risk of paper warping, ink bleeding through the sheet, and offset transfer. Reduce Cyan, Magenta, or Yellow.
                      </p>
                    </div>
                  )}

                  {/* Black Classification */}
                  {blackAnalysis && (
                    <div className="p-4 rounded-xl bg-card border space-y-1.5">
                      <div className="font-bold text-xs uppercase tracking-wider text-primary">
                        {blackAnalysis.type}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {blackAnalysis.desc}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
