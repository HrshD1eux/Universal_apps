'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Minimize2, FileText, Download, Loader2, Zap, Info, ShieldCheck, Sparkles, Sliders } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import * as pdfjs from 'pdfjs-dist';
import { notifyCompleted, notifyError } from '@/lib/notify';

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

type CompressMode = 'vector' | 'raster';

export default function PdfCompress() {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<CompressMode>('vector');
  const [rasterQuality, setRasterQuality] = useState(0.65);
  const [rasterDpi, setRasterDpi] = useState<number>(1.2); // scale: 1.0 = ~72-96 dpi, 1.5 = ~150 dpi, 2.0 = ~300 dpi
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [lastResult, setLastResult] = useState<{ origMb: string; newMb: string; savedPercent: number } | null>(null);

  const compressPdf = async () => {
    if (!file) return;
    setIsProcessing(true);
    setProgress(0);
    setLastResult(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      let pdfBytes: Uint8Array;

      if (mode === 'vector') {
        // Mode A: Clean Structural Optimization (Preserves selectable vector text)
        setProgress(25);
        const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
        setProgress(60);
        
        // Save with object stream compression and minimal redundant structures
        pdfBytes = await pdfDoc.save({
          useObjectStreams: true,
          addDefaultPage: false,
        });
        setProgress(100);
      } else {
        // Mode B: High-Ratio Canvas Rasterization (For scans & image-heavy files)
        let pdf;
        try {
          pdf = await pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
        } catch (loadErr: any) {
          if (loadErr?.name === 'PasswordException' || loadErr?.message?.includes('password')) {
            notifyError('Protected PDF', 'This PDF is password-protected. Unlock it first.');
            return;
          }
          throw loadErr;
        }

        const totalPages = pdf.numPages;
        const newPdf = await PDFDocument.create();

        for (let i = 1; i <= totalPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: rasterDpi });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.height = viewport.height;
          canvas.width = viewport.width;

          if (context) {
            await page.render({ canvasContext: context, viewport }).promise;
            const imgData = canvas.toDataURL('image/jpeg', rasterQuality);
            const imgBytes = await fetch(imgData).then((res) => res.arrayBuffer());
            const img = await newPdf.embedJpg(imgBytes);

            const origVp = page.getViewport({ scale: 1.0 });
            const newPage = newPdf.addPage([origVp.width, origVp.height]);
            newPage.drawImage(img, {
              x: 0,
              y: 0,
              width: origVp.width,
              height: origVp.height,
            });
          }
          setProgress(Math.round((i / totalPages) * 100));
        }

        pdfBytes = await newPdf.save({ useObjectStreams: true });
      }

      const origSize = file.size;
      const newSize = pdfBytes.length;
      const origMb = (origSize / (1024 * 1024)).toFixed(2);
      const newMb = (newSize / (1024 * 1024)).toFixed(2);
      const saved = Math.max(0, Math.round(((origSize - newSize) / origSize) * 100));

      setLastResult({ origMb, newMb, savedPercent: saved });

      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `compressed_${file.name}`;
      link.click();

      notifyCompleted(
        'Compression Finished',
        `File size: ${origMb}MB → ${newMb}MB (${saved}% reduction).`
      );
    } catch (err: any) {
      console.error(err);
      notifyError('Compression failed', err?.message || 'Could not compress this document.');
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  return (
    <Card className="max-w-3xl mx-auto border-none shadow-2xl bg-card/80 backdrop-blur-xl">
      <CardHeader className="text-center p-8">
        <div className="mx-auto w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-600 mb-4">
          <Minimize2 className="w-8 h-8" />
        </div>
        <CardTitle className="text-3xl font-black">Pro PDF Compressor</CardTitle>
        <CardDescription>
          Choose between Lossless Vector Optimization or High-Ratio Image Resampling.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-8 space-y-8">
        {!file ? (
          <div className="border-4 border-dashed border-muted rounded-[2rem] p-12 text-center hover:border-blue-500/50 transition-colors relative cursor-pointer group">
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setFile(e.target.files[0]);
                  setLastResult(null);
                }
              }}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <Minimize2 className="w-14 h-14 text-blue-500/40 group-hover:text-blue-500 transition-colors mx-auto mb-4" />
            <p className="font-black text-lg text-foreground">Select PDF to Compress</p>
            <p className="text-xs text-muted-foreground mt-1">Smart offline stream compression & image resampling</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="p-4 bg-muted/40 rounded-2xl border flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="w-8 h-8 text-blue-600 flex-shrink-0" />
                <div className="overflow-hidden">
                  <p className="font-bold truncate text-sm">{file.name}</p>
                  <p className="text-[11px] font-semibold text-muted-foreground">
                    Original Size: {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFile(null);
                  setLastResult(null);
                }}
                className="text-xs text-rose-500 font-bold uppercase hover:bg-rose-500/10"
              >
                Change PDF
              </Button>
            </div>

            {/* Mode Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMode('vector')}
                className={`p-5 rounded-2xl border-2 text-left transition-all ${
                  mode === 'vector'
                    ? 'border-blue-600 bg-blue-600/5 shadow-md shadow-blue-500/10'
                    : 'border-muted hover:border-blue-400/40 bg-card'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <span className="font-bold text-sm">Lossless Vector Mode</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Preserves 100% vector sharpness and text selectability. Strips redundant stream dictionaries.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setMode('raster')}
                className={`p-5 rounded-2xl border-2 text-left transition-all ${
                  mode === 'raster'
                    ? 'border-blue-600 bg-blue-600/5 shadow-md shadow-blue-500/10'
                    : 'border-muted hover:border-blue-400/40 bg-card'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <Zap className="w-5 h-5 text-blue-600" />
                  <span className="font-bold text-sm">High-Ratio Resampling</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Re-encodes pages as optimized JPEGs. Ideal for heavy scans and camera documents.
                </p>
              </button>
            </div>

            {/* Raster Controls if active */}
            {mode === 'raster' && (
              <div className="p-6 rounded-2xl bg-muted/20 border space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                      Target Resolution
                    </Label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { label: 'Web (1x)', val: 1.0 },
                        { label: 'Balanced (1.4x)', val: 1.4 },
                        { label: 'Print (1.8x)', val: 1.8 },
                      ].map((item) => (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => setRasterDpi(item.val)}
                          className={`p-2 rounded-xl text-xs font-bold border transition-all ${
                            rasterDpi === item.val
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-background hover:bg-muted text-foreground'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-black uppercase tracking-wider text-muted-foreground">
                      <span>JPEG Quality</span>
                      <span className="text-blue-600 font-bold">{Math.round(rasterQuality * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0.3}
                      max={0.85}
                      step={0.05}
                      value={rasterQuality}
                      onChange={(e) => setRasterQuality(parseFloat(e.target.value))}
                      className="w-full accent-blue-600 cursor-pointer h-9"
                    />
                  </div>
                </div>

                <div className="flex items-start gap-2 p-3 bg-blue-500/10 rounded-xl text-[11px] text-blue-700 dark:text-blue-300 font-medium leading-relaxed">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    Resampling flattens pages into compressed image layers. Use this when the PDF has large image scans.
                  </span>
                </div>
              </div>
            )}

            {/* Previous compression stats */}
            {lastResult && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-between text-xs font-bold">
                <span className="text-emerald-700 dark:text-emerald-400">
                  Compressed from {lastResult.origMb} MB to {lastResult.newMb} MB
                </span>
                <span className="bg-emerald-600 text-white px-2 py-0.5 rounded-full text-[11px]">
                  {lastResult.savedPercent}% Reduced
                </span>
              </div>
            )}

            {isProcessing && (
              <div className="w-full bg-muted rounded-full h-4 overflow-hidden relative border">
                <div
                  className="bg-blue-600 h-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-white mix-blend-difference">
                  {progress}%
                </span>
              </div>
            )}

            <Button
              className="w-full h-16 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-lg gap-2 shadow-xl shadow-blue-600/20 hover:shadow-2xl transition-all"
              disabled={isProcessing}
              onClick={compressPdf}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>COMPRESSING DOCUMENT...</span>
                </>
              ) : (
                <>
                  <Zap className="w-6 h-6" />
                  <span>START COMPRESSION & DOWNLOAD</span>
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
