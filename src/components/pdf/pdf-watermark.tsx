'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Stamp, FileText, Download, Loader2, Sparkles, SlidersHorizontal, Eye, Image as ImageIcon } from 'lucide-react';
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
import { notifyCompleted, notifyError } from '@/lib/notify';

type WatermarkPlacement = 'center-diagonal' | 'center-horizontal' | 'top-header' | 'bottom-footer';
type ColorChoice = 'gray' | 'red' | 'blue' | 'black';

export default function PdfWatermark() {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<'text' | 'image'>('text');
  const [text, setText] = useState('CONFIDENTIAL');
  const [image, setImage] = useState<string | null>(null);
  const [placement, setPlacement] = useState<WatermarkPlacement>('center-diagonal');
  const [color, setColor] = useState<ColorChoice>('red');
  const [opacity, setOpacity] = useState(0.25);
  const [fontSize, setFontSize] = useState(54);
  const [isProcessing, setIsProcessing] = useState(false);

  const presets = ['CONFIDENTIAL', 'DO NOT COPY', 'DRAFT', 'SAMPLE', 'APPROVED', 'ORIGINAL'];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => setImage(event.target?.result as string);
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const getRgbColor = () => {
    switch (color) {
      case 'red':
        return rgb(0.86, 0.15, 0.15); // Vibrant stamp red
      case 'blue':
        return rgb(0.14, 0.38, 0.92); // Clean stamp blue
      case 'black':
        return rgb(0.05, 0.05, 0.05);
      case 'gray':
      default:
        return rgb(0.45, 0.5, 0.58);
    }
  };

  const addWatermark = async () => {
    if (!file || (mode === 'text' && !text.trim()) || (mode === 'image' && !image)) return;
    setIsProcessing(true);

    try {
      const existingPdfBytes = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const pages = pdfDoc.getPages();
      const markColor = getRgbColor();

      let watermarkImage: any = null;
      if (mode === 'image' && image) {
        const imgBytes = await fetch(image).then((res) => res.arrayBuffer());
        watermarkImage = image.includes('png')
          ? await pdfDoc.embedPng(imgBytes)
          : await pdfDoc.embedJpg(imgBytes);
      }

      for (const page of pages) {
        const { width, height } = page.getSize();

        if (mode === 'text') {
          const watermarkText = text.trim();
          const textWidth = helveticaFont.widthOfTextAtSize(watermarkText, fontSize);
          const textHeight = helveticaFont.heightAtSize(fontSize);

          let x = width / 2 - textWidth / 2;
          let y = height / 2 - textHeight / 2;
          let angle = 0;

          if (placement === 'center-diagonal') {
            angle = 45;
            // Center calculation for 45 deg rotated text
            const rad = (45 * Math.PI) / 180;
            x = width / 2 - (textWidth * Math.cos(rad)) / 2 + (textHeight * Math.sin(rad)) / 2;
            y = height / 2 - (textWidth * Math.sin(rad)) / 2 - (textHeight * Math.cos(rad)) / 2;
          } else if (placement === 'center-horizontal') {
            angle = 0;
            x = width / 2 - textWidth / 2;
            y = height / 2 - textHeight / 2;
          } else if (placement === 'top-header') {
            angle = 0;
            x = width / 2 - textWidth / 2;
            y = height - 50;
          } else if (placement === 'bottom-footer') {
            angle = 0;
            x = width / 2 - textWidth / 2;
            y = 35;
          }

          page.drawText(watermarkText, {
            x,
            y,
            size: fontSize,
            font: helveticaFont,
            color: markColor,
            opacity,
            rotate: degrees(angle),
          });
        } else if (watermarkImage) {
          const maxDim = Math.min(width, height) * 0.55;
          const imgScale = Math.min(maxDim / watermarkImage.width, maxDim / watermarkImage.height);
          const imgWidth = watermarkImage.width * imgScale;
          const imgHeight = watermarkImage.height * imgScale;

          page.drawImage(watermarkImage, {
            x: width / 2 - imgWidth / 2,
            y: height / 2 - imgHeight / 2,
            width: imgWidth,
            height: imgHeight,
            opacity,
          });
        }
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `watermarked_${file.name}`;
      link.click();

      notifyCompleted(
        'Watermark Applied',
        `Successfully stamped ${pages.length} pages in "${file.name}".`
      );
    } catch (err: any) {
      console.error(err);
      notifyError('Watermark Failed', err?.message || 'Could not apply watermark to PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="max-w-3xl mx-auto border-none shadow-2xl bg-card/80 backdrop-blur-xl">
      <CardHeader className="text-center p-8">
        <div className="mx-auto w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-600 mb-4">
          <Stamp className="w-8 h-8" />
        </div>
        <CardTitle className="text-3xl font-black">Pro PDF Watermark</CardTitle>
        <CardDescription>
          Apply customizable text stamps or image watermarks with precise angle and opacity control.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-8 space-y-8">
        {!file ? (
          <div className="border-4 border-dashed border-muted rounded-[2rem] p-12 text-center hover:border-purple-500/50 transition-colors relative cursor-pointer group">
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => e.target.files && setFile(e.target.files[0])}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <Stamp className="w-14 h-14 text-purple-500/40 group-hover:text-purple-500 transition-colors mx-auto mb-4" />
            <p className="font-black text-lg text-foreground">Select PDF Document</p>
            <p className="text-xs text-muted-foreground mt-1">Watermark every page offline in vector quality</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="p-4 bg-muted/40 rounded-2xl border flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="w-6 h-6 text-purple-500 flex-shrink-0" />
                <span className="font-bold truncate text-sm">{file.name}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFile(null)}
                className="text-xs text-rose-500 font-bold uppercase hover:bg-rose-500/10"
              >
                Change PDF
              </Button>
            </div>

            <Tabs value={mode} onValueChange={(v) => setMode(v as 'text' | 'image')} className="w-full">
              <TabsList className="grid grid-cols-2 p-1.5 h-12 rounded-xl bg-muted/50">
                <TabsTrigger value="text" className="rounded-lg font-bold text-xs">
                  Text Watermark
                </TabsTrigger>
                <TabsTrigger value="image" className="rounded-lg font-bold text-xs">
                  Image Watermark
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {mode === 'text' ? (
              <div className="space-y-5 p-6 rounded-2xl bg-muted/20 border">
                {/* Watermark Text Input & Quick Chips */}
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                    Watermark Text
                  </Label>
                  <Input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="font-black h-11 text-base rounded-xl border-2 uppercase"
                    placeholder="CONFIDENTIAL"
                  />
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {presets.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setText(p)}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all ${
                          text === p
                            ? 'bg-purple-600 text-white border-purple-600'
                            : 'bg-background hover:bg-muted text-muted-foreground'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Placement Options */}
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                    Placement & Angle
                  </Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'center-diagonal', label: 'Diagonal 45°' },
                      { id: 'center-horizontal', label: 'Center (0°)' },
                      { id: 'top-header', label: 'Header Top' },
                      { id: 'bottom-footer', label: 'Footer Bottom' },
                    ].map((pl) => (
                      <button
                        key={pl.id}
                        type="button"
                        onClick={() => setPlacement(pl.id as WatermarkPlacement)}
                        className={`p-2.5 rounded-xl text-xs font-bold border transition-all ${
                          placement === pl.id
                            ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                            : 'bg-background hover:bg-muted text-foreground'
                        }`}
                      >
                        {pl.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color and Typography Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold text-muted-foreground uppercase">Color</Label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[
                        { id: 'red', bg: 'bg-rose-500', label: 'Red' },
                        { id: 'blue', bg: 'bg-blue-500', label: 'Blue' },
                        { id: 'gray', bg: 'bg-slate-500', label: 'Gray' },
                        { id: 'black', bg: 'bg-black', label: 'Black' },
                      ].map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setColor(c.id as ColorChoice)}
                          className={`h-9 rounded-xl border-2 flex items-center justify-center transition-all ${
                            color === c.id ? 'border-purple-600 ring-2 ring-purple-500/20' : 'border-transparent'
                          }`}
                        >
                          <span className={`w-4 h-4 rounded-full ${c.bg}`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[11px] font-bold text-muted-foreground uppercase">
                      <span>Opacity</span>
                      <span>{Math.round(opacity * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0.05}
                      max={0.8}
                      step={0.05}
                      value={opacity}
                      onChange={(e) => setOpacity(parseFloat(e.target.value))}
                      className="w-full accent-purple-600 cursor-pointer h-9"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[11px] font-bold text-muted-foreground uppercase">
                      <span>Font Size</span>
                      <span>{fontSize}pt</span>
                    </div>
                    <input
                      type="range"
                      min={24}
                      max={90}
                      step={2}
                      value={fontSize}
                      onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
                      className="w-full accent-purple-600 cursor-pointer h-9"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-5 p-6 rounded-2xl bg-muted/20 border">
                <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                  Watermark Stamp Image (PNG / JPG)
                </Label>
                <div className="border-2 border-dashed border-muted rounded-xl p-8 text-center hover:border-purple-500/40 transition-colors relative cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  {image ? (
                    <div className="space-y-2">
                      <img src={image} alt="Watermark preview" className="max-h-24 mx-auto object-contain rounded-lg" />
                      <p className="text-xs font-bold text-purple-600">Click to change stamp image</p>
                    </div>
                  ) : (
                    <div>
                      <ImageIcon className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-50" />
                      <p className="font-bold text-sm">Select Stamp / Logo Image</p>
                      <p className="text-[11px] text-muted-foreground">Transparent PNG recommended</p>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[11px] font-bold text-muted-foreground uppercase">
                    <span>Opacity</span>
                    <span>{Math.round(opacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0.05}
                    max={0.9}
                    step={0.05}
                    value={opacity}
                    onChange={(e) => setOpacity(parseFloat(e.target.value))}
                    className="w-full accent-purple-600 cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* Live Sheet Visual Preview */}
            <div className="p-4 rounded-2xl bg-muted/40 border space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
                <span className="flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" /> Stamp Simulation</span>
                <span className="font-mono text-purple-600 dark:text-purple-400">Position: {placement}</span>
              </div>
              <div className="relative w-44 h-56 mx-auto bg-white dark:bg-slate-900 border-2 border-purple-500/30 rounded-xl shadow-md p-3 flex flex-col justify-center items-center overflow-hidden">
                <div className="space-y-2 w-full opacity-15">
                  <div className="h-1.5 bg-slate-400 rounded w-full"></div>
                  <div className="h-1.5 bg-slate-400 rounded w-5/6"></div>
                  <div className="h-1.5 bg-slate-400 rounded w-full"></div>
                  <div className="h-1.5 bg-slate-400 rounded w-4/6"></div>
                  <div className="h-1.5 bg-slate-400 rounded w-full"></div>
                </div>

                <div
                  className="absolute pointer-events-none text-center font-black transition-all"
                  style={{
                    color: color === 'red' ? '#e11d48' : color === 'blue' ? '#2563eb' : color === 'black' ? '#0f172a' : '#64748b',
                    opacity,
                    transform:
                      placement === 'center-diagonal'
                        ? 'rotate(-30deg)'
                        : 'none',
                    top: placement === 'top-header' ? '12px' : placement === 'bottom-footer' ? 'auto' : 'auto',
                    bottom: placement === 'bottom-footer' ? '12px' : 'auto',
                    fontSize: `${Math.max(12, Math.min(22, fontSize / 3))}px`,
                    letterSpacing: '2px',
                  }}
                >
                  {mode === 'text' ? (text || 'WATERMARK') : 'STAMP IMAGE'}
                </div>
              </div>
            </div>

            <Button
              className="w-full h-16 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black text-lg gap-2 shadow-xl hover:shadow-2xl transition-all"
              disabled={isProcessing}
              onClick={addWatermark}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>APPLYING WATERMARK...</span>
                </>
              ) : (
                <>
                  <Download className="w-6 h-6" />
                  <span>APPLY WATERMARK & DOWNLOAD</span>
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
