'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, RotateCw, RotateCcw, Download, Loader2, FileText, CheckCircle2 } from 'lucide-react';
import { PDFDocument, degrees } from 'pdf-lib';
import * as pdfjs from 'pdfjs-dist';
import { notifyCompleted, notifyError } from '@/lib/notify';

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

interface PageItem {
  pageNumber: number;
  rotationDelta: number; // in degrees (0, 90, 180, 270)
  canvasUrl?: string;
  aspectRatio: number;
}

export default function PdfRotate() {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [isLoadingPages, setIsLoadingPages] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Load PDF and generate page thumbnails
  useEffect(() => {
    if (!file) {
      setPages([]);
      return;
    }

    let isMounted = true;
    const loadPdfThumbnails = async () => {
      setIsLoadingPages(true);
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
        const total = pdf.numPages;
        const newPages: PageItem[] = [];

        for (let i = 1; i <= total; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 0.35 });
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = viewport.width;
          canvas.height = viewport.height;

          if (ctx) {
            await page.render({ canvasContext: ctx, viewport }).promise;
            newPages.push({
              pageNumber: i,
              rotationDelta: 0,
              canvasUrl: canvas.toDataURL('image/jpeg', 0.8),
              aspectRatio: viewport.width / viewport.height,
            });
          }
        }

        if (isMounted) {
          setPages(newPages);
        }
      } catch (err: any) {
        console.error('Thumbnail generation error:', err);
        notifyError('Could not load PDF pages', err?.message || 'Check if PDF is password protected.');
      } finally {
        if (isMounted) setIsLoadingPages(false);
      }
    };

    loadPdfThumbnails();
    return () => {
      isMounted = false;
    };
  }, [file]);

  const rotateSinglePage = (pageNum: number, delta: number) => {
    setPages((prev) =>
      prev.map((p) => {
        if (p.pageNumber !== pageNum) return p;
        const nextRotation = (p.rotationDelta + delta) % 360;
        return {
          ...p,
          rotationDelta: nextRotation < 0 ? nextRotation + 360 : nextRotation,
        };
      })
    );
  };

  const rotateAll = (delta: number) => {
    setPages((prev) =>
      prev.map((p) => {
        const next = (p.rotationDelta + delta) % 360;
        return { ...p, rotationDelta: next < 0 ? next + 360 : next };
      })
    );
  };

  const resetAll = () => {
    setPages((prev) => prev.map((p) => ({ ...p, rotationDelta: 0 })));
  };

  const hasAnyRotations = pages.some((p) => p.rotationDelta !== 0);

  const saveRotatedPdf = async () => {
    if (!file || pages.length === 0) return;
    setIsProcessing(true);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      const docPages = pdfDoc.getPages();

      let rotatedCount = 0;
      pages.forEach((p, idx) => {
        if (p.rotationDelta !== 0 && idx < docPages.length) {
          const docPage = docPages[idx];
          const curr = docPage.getRotation().angle;
          docPage.setRotation(degrees((curr + p.rotationDelta) % 360));
          rotatedCount++;
        }
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `rotated_${file.name}`;
      link.click();

      notifyCompleted(
        'PDF Rotated Successfully',
        `Saved document with ${rotatedCount} adjusted page orientation(s).`
      );
    } catch (err: any) {
      console.error(err);
      notifyError('Failed to rotate PDF', err?.message || 'Error processing PDF document.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="max-w-5xl mx-auto border-none shadow-2xl bg-card/80 backdrop-blur-xl">
      <CardHeader className="text-center p-8">
        <div className="mx-auto w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-600 mb-4">
          <RotateCw className="w-8 h-8" />
        </div>
        <CardTitle className="text-3xl font-black">Visual PDF Rotator</CardTitle>
        <CardDescription>
          Click thumbnails to rotate individual pages or use bulk actions with instant preview.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-8 space-y-8">
        {!file ? (
          <div className="border-4 border-dashed border-muted rounded-[2rem] p-12 text-center hover:border-emerald-500/50 transition-colors relative cursor-pointer group">
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => e.target.files && setFile(e.target.files[0])}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <RefreshCw className="w-14 h-14 text-emerald-500/40 group-hover:text-emerald-500 transition-colors mx-auto mb-4" />
            <p className="font-black text-lg text-foreground">Select PDF to Rotate</p>
            <p className="text-xs text-muted-foreground mt-1">Interactive visual page grid & instant rotation</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="p-4 bg-muted/40 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                <div>
                  <span className="font-bold truncate text-sm block">{file.name}</span>
                  <span className="text-[11px] text-muted-foreground font-semibold">
                    {pages.length} Pages • {hasAnyRotations ? 'Modifications Pending' : 'Original Alignment'}
                  </span>
                </div>
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

            {/* Bulk Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-muted/20 border rounded-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => rotateAll(90)}
                  className="rounded-xl font-bold text-xs gap-1.5"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Rotate All 90° CW</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => rotateAll(180)}
                  className="rounded-xl font-bold text-xs gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Flip All 180°</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => rotateAll(-90)}
                  className="rounded-xl font-bold text-xs gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Rotate All 90° CCW</span>
                </Button>
              </div>

              {hasAnyRotations && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetAll}
                  className="text-xs font-bold text-muted-foreground hover:text-foreground"
                >
                  Reset All to 0°
                </Button>
              )}
            </div>

            {/* Thumbnail Grid */}
            {isLoadingPages ? (
              <div className="py-16 text-center space-y-3">
                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
                <p className="font-bold text-sm text-muted-foreground">Rendering page thumbnails...</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-h-[550px] overflow-y-auto p-2 scrollbar-thin">
                {pages.map((p) => (
                  <div
                    key={p.pageNumber}
                    className={`group relative p-3 rounded-2xl border-2 transition-all flex flex-col items-center bg-card shadow-sm ${
                      p.rotationDelta !== 0
                        ? 'border-emerald-500 bg-emerald-500/5 shadow-md shadow-emerald-500/10'
                        : 'border-muted hover:border-emerald-500/40'
                    }`}
                  >
                    {/* Header info */}
                    <div className="w-full flex items-center justify-between text-[11px] font-bold text-muted-foreground mb-2">
                      <span>Pg {p.pageNumber}</span>
                      {p.rotationDelta !== 0 ? (
                        <span className="text-emerald-600 font-extrabold bg-emerald-500/10 px-1.5 py-0.5 rounded text-[10px]">
                          +{p.rotationDelta}°
                        </span>
                      ) : (
                        <span className="opacity-40 text-[10px]">0°</span>
                      )}
                    </div>

                    {/* Preview Image with CSS Rotation */}
                    <div className="w-full h-36 flex items-center justify-center overflow-hidden bg-muted/30 rounded-xl p-1 relative">
                      {p.canvasUrl ? (
                        <img
                          src={p.canvasUrl}
                          alt={`Page ${p.pageNumber}`}
                          className="max-h-full max-w-full object-contain transition-transform duration-300 drop-shadow-sm"
                          style={{
                            transform: `rotate(${p.rotationDelta}deg)`,
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                          Pg {p.pageNumber}
                        </div>
                      )}
                    </div>

                    {/* Individual Control Buttons */}
                    <div className="w-full flex items-center justify-between gap-1 mt-2.5 pt-2 border-t border-muted">
                      <button
                        type="button"
                        onClick={() => rotateSinglePage(p.pageNumber, -90)}
                        title="Rotate 90° CCW"
                        className="flex-1 py-1 px-1.5 rounded-lg text-[10px] font-bold bg-muted hover:bg-muted/80 text-foreground flex items-center justify-center gap-1 transition-colors"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>-90°</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => rotateSinglePage(p.pageNumber, 90)}
                        title="Rotate 90° CW"
                        className="flex-1 py-1 px-1.5 rounded-lg text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-1 transition-colors shadow-sm"
                      >
                        <RotateCw className="w-3 h-3" />
                        <span>+90°</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Button
              className="w-full h-16 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-lg gap-2 shadow-xl shadow-emerald-600/20 hover:shadow-2xl transition-all"
              disabled={isProcessing || isLoadingPages}
              onClick={saveRotatedPdf}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>SAVING ROTATIONS...</span>
                </>
              ) : (
                <>
                  <Download className="w-6 h-6" />
                  <span>DOWNLOAD ROTATED PDF</span>
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
