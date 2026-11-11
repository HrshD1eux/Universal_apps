'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { motion } from 'framer-motion';
import { 
  Smartphone, Upload, Download, Sparkles, Copy, 
  Layers, Palette, ShieldCheck, Check, RefreshCw, Eye
} from 'lucide-react';
import JSZip from 'jszip';
import { notifyCompleted, notifyCopied, notifyDownloaded, notifyError } from '@/lib/notify';

export default function AppIconStudio() {
  const [foregroundImg, setForegroundImg] = useState<HTMLImageElement | null>(null);
  const [foregroundName, setForegroundName] = useState<string>('icon');
  const [scale, setScale] = useState(85); // 85% is Android standard safe zone
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [tintColor, setTintColor] = useState<string>('#ffffff');
  const [applyTint, setApplyTint] = useState<boolean>(false);

  // Background
  const [bgColor, setBgColor] = useState<string>('#2563eb');
  const [bgType, setBgType] = useState<'color' | 'transparent'>('color');

  // Android 13+ Themed Icon preview accent
  const [themedAccent, setThemedAccent] = useState<string>('#a5b4fc');

  // Generating status
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Hidden offscreen canvas for rendering
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Load default icon placeholder if none provided
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    // Draw an elegant vector SVG rocket/sparkle as default
    const defaultSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>`;
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(defaultSvg)}`;
    img.onload = () => setForegroundImg(img);
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setForegroundName(file.name.replace(/\.[^/.]+$/, ''));
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setForegroundImg(img);
        notifyCompleted('Asset Loaded', file.name);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Helper to render foreground onto a target canvas
  const renderForegroundOnCanvas = useCallback((
    ctx: CanvasRenderingContext2D,
    size: number,
    isMonochrome: boolean = false,
    monoColor: string = '#ffffff'
  ) => {
    if (!foregroundImg) return;

    const s = scale / 100;
    const drawSize = size * s;
    const x = (size - drawSize) / 2 + (offsetX * size) / 512;
    const y = (size - drawSize) / 2 + (offsetY * size) / 512;

    if (applyTint || isMonochrome) {
      // Draw tinted or monochrome via offscreen memory buffer
      const offCanvas = document.createElement('canvas');
      offCanvas.width = size;
      offCanvas.height = size;
      const offCtx = offCanvas.getContext('2d')!;

      offCtx.drawImage(foregroundImg, x, y, drawSize, drawSize);
      offCtx.globalCompositeOperation = 'source-in';
      offCtx.fillStyle = isMonochrome ? monoColor : tintColor;
      offCtx.fillRect(0, 0, size, size);

      ctx.drawImage(offCanvas, 0, 0);
    } else {
      ctx.drawImage(foregroundImg, x, y, drawSize, drawSize);
    }
  }, [foregroundImg, scale, offsetX, offsetY, applyTint, tintColor]);

  // Generate binary PNG blob from specific shape
  const createIconBlob = useCallback(async (
    size: number,
    shape: 'square' | 'circle' | 'foreground-only' | 'background-only',
    isMonochrome: boolean = false
  ): Promise<Blob> => {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    if (shape === 'background-only') {
      if (bgType === 'color') {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, size, size);
      }
    } else if (shape === 'foreground-only') {
      renderForegroundOnCanvas(ctx, size, isMonochrome, '#ffffff');
    } else {
      // Combined icon
      if (shape === 'circle') {
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        ctx.clip();
      }

      if (bgType === 'color') {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, size, size);
      }

      renderForegroundOnCanvas(ctx, size, isMonochrome);
    }

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob!), 'image/png');
    });
  }, [bgType, bgColor, renderForegroundOnCanvas]);

  // Export full ZIP with Android Studio Mipmaps & Web Favicons
  const exportFullBundle = async () => {
    setIsExporting(true);
    try {
      const zip = new JSZip();

      // 1. Android Mipmap Folders
      const mipmaps = [
        { folder: 'res/mipmap-mdpi', size: 48 },
        { folder: 'res/mipmap-hdpi', size: 72 },
        { folder: 'res/mipmap-xhdpi', size: 96 },
        { folder: 'res/mipmap-xxhdpi', size: 144 },
        { folder: 'res/mipmap-xxxhdpi', size: 192 },
      ];

      for (const m of mipmaps) {
        const standardBlob = await createIconBlob(m.size, 'square');
        const roundBlob = await createIconBlob(m.size, 'circle');
        zip.folder(m.folder)?.file('ic_launcher.png', standardBlob);
        zip.folder(m.folder)?.file('ic_launcher_round.png', roundBlob);
      }

      // Android Adaptive Drawables (432x432 standard for 108dp)
      const fgBlob = await createIconBlob(432, 'foreground-only');
      const bgBlob = await createIconBlob(432, 'background-only');
      zip.folder('res/drawable')?.file('ic_launcher_foreground.png', fgBlob);
      zip.folder('res/drawable')?.file('ic_launcher_background.png', bgBlob);

      // Adaptive Icon XML
      const adaptiveXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/ic_launcher_background" />
    <foreground android:drawable="@drawable/ic_launcher_foreground" />
    <monochrome android:drawable="@drawable/ic_launcher_foreground" />
</adaptive-icon>`;
      zip.folder('res/mipmap-anydpi-v26')?.file('ic_launcher.xml', adaptiveXml);
      zip.folder('res/mipmap-anydpi-v26')?.file('ic_launcher_round.xml', adaptiveXml);

      // 2. Web & iOS Favicons
      const fav32 = await createIconBlob(32, 'circle');
      const fav16 = await createIconBlob(16, 'circle');
      const apple180 = await createIconBlob(180, 'square');
      const pwa192 = await createIconBlob(192, 'square');
      const pwa512 = await createIconBlob(512, 'square');

      const webFolder = zip.folder('web');
      webFolder?.file('favicon.ico', fav32); // Modern browsers read 32x32 PNG inside .ico
      webFolder?.file('favicon-32x32.png', fav32);
      webFolder?.file('favicon-16x16.png', fav16);
      webFolder?.file('apple-touch-icon.png', apple180);
      webFolder?.file('android-chrome-192x192.png', pwa192);
      webFolder?.file('android-chrome-512x512.png', pwa512);

      // Web Manifest
      const manifest = {
        name: foregroundName || 'App',
        short_name: foregroundName || 'App',
        icons: [
          { src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
        ],
        theme_color: bgColor,
        background_color: bgColor,
        display: 'standalone',
      };
      webFolder?.file('site.webmanifest', JSON.stringify(manifest, null, 2));

      // README instructions
      const readme = `# App & Web Icon Package
Generated via Universal Apps Icon Studio

## Android Studio Integration
1. Copy the contents of the \`res/\` directory directly into your Android project's \`app/src/main/res/\`.
2. Verify \`AndroidManifest.xml\` has:
   android:icon="@mipmap/ic_launcher"
   android:roundIcon="@mipmap/ic_launcher_round"

## Web / HTML Integration
Place the contents of \`web/\` in your public root directory and add to your <head>:
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
`;
      zip.file('README.md', readme);

      // Download ZIP
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${foregroundName}-app-icons.zip`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 10000);

      notifyDownloaded(`${foregroundName}-app-icons.zip`);
      notifyCompleted('Export Complete', 'Full Android Mipmaps and Web Favicon package generated.');
    } catch (err: any) {
      notifyError(err.message || 'Failed to generate icon bundle');
    } finally {
      setIsExporting(false);
    }
  };

  const copyHtmlSnippet = () => {
    const snippet = `<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">`;
    navigator.clipboard.writeText(snippet);
    notifyCopied('HTML head snippet');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 px-4">
      {/* Header */}
      <Card className="border shadow-xl bg-card overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-800 text-white p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20">
                <Smartphone className="w-8 h-8 text-white" />
              </div>
              <div>
                <CardTitle className="text-3xl font-black tracking-tight">
                  Android & Web App Icon Studio
                </CardTitle>
                <CardDescription className="text-white/75 font-semibold">
                  Android Studio-grade Asset Studio with Adaptive Mipmaps, Themed Icons, and Web Favicons
                </CardDescription>
              </div>
            </div>

            <Button
              onClick={exportFullBundle}
              disabled={isExporting || !foregroundImg}
              className="bg-white text-emerald-900 hover:bg-white/90 font-black shadow-lg gap-2 h-12 px-6 rounded-xl"
            >
              <Download className="w-5 h-5" />
              {isExporting ? 'Packaging ZIP...' : 'Export Android & Web Bundle'}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Asset Configuration */}
            <div className="lg:col-span-5 space-y-6">
              {/* Asset Upload */}
              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                  <span>Foreground Asset (SVG / PNG)</span>
                  <span className="text-[10px] text-primary">{foregroundName}</span>
                </label>
                <div className="border-2 border-dashed border-primary/20 rounded-xl p-4 text-center hover:border-primary/50 transition-colors bg-muted/20">
                  <label className="cursor-pointer flex items-center justify-center gap-3">
                    <Upload className="w-5 h-5 text-muted-foreground" />
                    <span className="text-xs font-bold text-foreground">Upload Custom Vector or Image</span>
                    <input
                      type="file"
                      accept="image/png,image/svg+xml,image/jpeg,image/webp"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>
                </div>
              </div>

              {/* Foreground Scaling & Position */}
              <div className="space-y-4 border rounded-2xl p-5 bg-card/60">
                <div className="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-2">
                  <Layers className="w-4 h-4" /> Foreground Layer Controls
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span>Resize / Safe Zone Scale</span>
                    <span>{scale}%</span>
                  </div>
                  <Slider value={[scale]} min={30} max={140} step={1} onValueChange={([v]) => setScale(v)} />
                  <span className="text-[10px] text-muted-foreground block">
                    Recommended: 80%–85% to fit inside Android circular safe zone.
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold">
                      <span>Offset X</span>
                      <span>{offsetX}px</span>
                    </div>
                    <Slider value={[offsetX]} min={-60} max={60} step={1} onValueChange={([v]) => setOffsetX(v)} />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold">
                      <span>Offset Y</span>
                      <span>{offsetY}px</span>
                    </div>
                    <Slider value={[offsetY]} min={-60} max={60} step={1} onValueChange={([v]) => setOffsetY(v)} />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold">Color Tint Overlay</span>
                    {applyTint && (
                      <input
                        type="color"
                        value={tintColor}
                        onChange={(e) => setTintColor(e.target.value)}
                        className="w-6 h-6 rounded cursor-pointer border"
                      />
                    )}
                  </div>
                  <Switch checked={applyTint} onCheckedChange={setApplyTint} />
                </div>
              </div>

              {/* Background Layer Controls */}
              <div className="space-y-4 border rounded-2xl p-5 bg-card/60">
                <div className="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-2">
                  <Palette className="w-4 h-4" /> Background Layer Controls
                </div>

                <div className="flex gap-2">
                  <Button
                    variant={bgType === 'color' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setBgType('color')}
                    className="font-bold text-xs flex-1"
                  >
                    Solid Color
                  </Button>
                  <Button
                    variant={bgType === 'transparent' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setBgType('transparent')}
                    className="font-bold text-xs flex-1"
                  >
                    Transparent
                  </Button>
                </div>

                {bgType === 'color' && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={bgColor}
                        onChange={(e) => setBgColor(e.target.value)}
                        className="w-10 h-10 rounded-lg cursor-pointer border p-0.5"
                      />
                      <Input
                        value={bgColor}
                        onChange={(e) => setBgColor(e.target.value)}
                        className="font-mono text-xs uppercase"
                      />
                    </div>

                    {/* Quick Palette Presets */}
                    <div className="flex gap-2 flex-wrap">
                      {['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#0f172a', '#ffffff'].map((c) => (
                        <button
                          key={c}
                          onClick={() => setBgColor(c)}
                          className="w-6 h-6 rounded-full border shadow-sm transition-transform hover:scale-110"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Android Studio Live Preview Matrix */}
            <div className="lg:col-span-7 space-y-6">
              <div className="border rounded-2xl p-6 bg-muted/20 space-y-6">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Eye className="w-4 h-4" /> Android Studio Adaptive Shape Previews
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                    Pixel & One UI Ready
                  </span>
                </div>

                {/* 4 Adaptive Shapes */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                  {/* Circle */}
                  <div className="space-y-2">
                    <div
                      className="w-24 h-24 mx-auto rounded-full shadow-md overflow-hidden relative border transition-all"
                      style={{ backgroundColor: bgType === 'color' ? bgColor : 'transparent' }}
                    >
                      {foregroundImg && (
                        <div
                          className="absolute inset-0 flex items-center justify-center pointer-events-none"
                          style={{
                            transform: `translate(${offsetX * 0.18}px, ${offsetY * 0.18}px) scale(${scale / 100})`,
                          }}
                        >
                          <img
                            src={foregroundImg.src}
                            alt="Preview"
                            className="w-full h-full object-contain"
                            style={{ filter: applyTint ? `drop-shadow(0 0 0 ${tintColor})` : undefined }}
                          />
                        </div>
                      )}
                    </div>
                    <span className="text-xs font-bold text-muted-foreground">Circle (AOSP)</span>
                  </div>

                  {/* Squircle */}
                  <div className="space-y-2">
                    <div
                      className="w-24 h-24 mx-auto shadow-md overflow-hidden relative border transition-all"
                      style={{
                        borderRadius: '35%',
                        backgroundColor: bgType === 'color' ? bgColor : 'transparent',
                      }}
                    >
                      {foregroundImg && (
                        <div
                          className="absolute inset-0 flex items-center justify-center pointer-events-none"
                          style={{
                            transform: `translate(${offsetX * 0.18}px, ${offsetY * 0.18}px) scale(${scale / 100})`,
                          }}
                        >
                          <img
                            src={foregroundImg.src}
                            alt="Preview"
                            className="w-full h-full object-contain"
                          />
                        </div>
                      )}
                    </div>
                    <span className="text-xs font-bold text-muted-foreground">Squircle (Samsung)</span>
                  </div>

                  {/* Rounded Corner */}
                  <div className="space-y-2">
                    <div
                      className="w-24 h-24 mx-auto rounded-2xl shadow-md overflow-hidden relative border transition-all"
                      style={{ backgroundColor: bgType === 'color' ? bgColor : 'transparent' }}
                    >
                      {foregroundImg && (
                        <div
                          className="absolute inset-0 flex items-center justify-center pointer-events-none"
                          style={{
                            transform: `translate(${offsetX * 0.18}px, ${offsetY * 0.18}px) scale(${scale / 100})`,
                          }}
                        >
                          <img
                            src={foregroundImg.src}
                            alt="Preview"
                            className="w-full h-full object-contain"
                          />
                        </div>
                      )}
                    </div>
                    <span className="text-xs font-bold text-muted-foreground">Rounded (Pixel)</span>
                  </div>

                  {/* Square */}
                  <div className="space-y-2">
                    <div
                      className="w-24 h-24 mx-auto rounded-lg shadow-md overflow-hidden relative border transition-all"
                      style={{ backgroundColor: bgType === 'color' ? bgColor : 'transparent' }}
                    >
                      {foregroundImg && (
                        <div
                          className="absolute inset-0 flex items-center justify-center pointer-events-none"
                          style={{
                            transform: `translate(${offsetX * 0.18}px, ${offsetY * 0.18}px) scale(${scale / 100})`,
                          }}
                        >
                          <img
                            src={foregroundImg.src}
                            alt="Preview"
                            className="w-full h-full object-contain"
                          />
                        </div>
                      )}
                    </div>
                    <span className="text-xs font-bold text-muted-foreground">Square (Legacy)</span>
                  </div>
                </div>

                {/* Specialized Previews: Themed Icon & Notification */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                  {/* Android 13+ Themed / Monochrome Icon */}
                  <div className="p-4 rounded-xl bg-card border space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-black uppercase text-muted-foreground">
                        Android 13+ Themed Icon
                      </span>
                      <input
                        type="color"
                        value={themedAccent}
                        onChange={(e) => setThemedAccent(e.target.value)}
                        className="w-5 h-5 rounded cursor-pointer border"
                      />
                    </div>
                    <div
                      className="w-16 h-16 mx-auto rounded-full flex items-center justify-center shadow-inner relative overflow-hidden"
                      style={{ backgroundColor: `${themedAccent}25` }}
                    >
                      {foregroundImg && (
                        <div
                          className="w-10 h-10 flex items-center justify-center"
                          style={{
                            transform: `scale(${scale / 100})`,
                            filter: 'grayscale(100%) brightness(0.6)',
                          }}
                        >
                          <img src={foregroundImg.src} alt="Themed" className="w-full h-full object-contain" />
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] text-center text-muted-foreground font-medium">
                      Simulates Material You dynamic tinting
                    </p>
                  </div>

                  {/* Notification Bar Tray Mockup */}
                  <div className="p-4 rounded-xl bg-slate-950 text-white border border-slate-800 space-y-3">
                    <span className="text-[11px] font-black uppercase text-slate-400 block">
                      Status Bar Notification Icon
                    </span>
                    <div className="flex items-center gap-3 bg-slate-900/80 px-4 py-2.5 rounded-lg border border-slate-800">
                      {foregroundImg && (
                        <div
                          className="w-6 h-6 flex items-center justify-center overflow-hidden"
                          style={{ filter: 'brightness(0) invert(1)' }}
                        >
                          <img src={foregroundImg.src} alt="Notification" className="w-full h-full object-contain" />
                        </div>
                      )}
                      <div className="text-[11px] font-sans truncate">
                        <span className="font-bold">{foregroundName}</span> • Just now
                      </div>
                    </div>
                    <p className="text-[10px] text-center text-slate-400 font-medium">
                      Alpha-only silhouette for Android status bar
                    </p>
                  </div>
                </div>

                {/* Web Favicon Tab Mockup */}
                <div className="p-4 rounded-xl bg-card border space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-black uppercase text-muted-foreground">
                      Browser Tab Favicon Mockup
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={copyHtmlSnippet}
                      className="text-[11px] font-bold h-7 gap-1"
                    >
                      <Copy className="w-3 h-3" /> Copy HTML
                    </Button>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-2.5 flex items-center gap-3 border">
                    <div className="w-4 h-4 rounded-full overflow-hidden flex-shrink-0" style={{ backgroundColor: bgColor }}>
                      {foregroundImg && (
                        <img src={foregroundImg.src} alt="Favicon" className="w-full h-full object-contain" />
                      )}
                    </div>
                    <span className="text-xs font-bold truncate">{foregroundName} - Official Web App</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
