'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, FileText, Download, Loader2, Info, X, Check, RefreshCw } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import * as pdfjs from 'pdfjs-dist';
import { notifyCompleted, notifyError } from '@/lib/notify';

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

interface PageItem {
  pageNumber: number;
  canvasUrl?: string;
  isMarkedForRemoval: boolean;
}

export default function PdfRemovePages() {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [pagesInput, setPagesInput] = useState('');
  const [isLoadingPages, setIsLoadingPages] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Load PDF and generate page thumbnails
  useEffect(() => {
    if (!file) {
      setPages([]);
      setPagesInput('');
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
              canvasUrl: canvas.toDataURL('image/jpeg', 0.8),
              isMarkedForRemoval: false,
            });
          }
        }

        if (isMounted) {
          setPages(newPages);
        }
      } catch (err: any) {
        console.error('Thumbnail generation error:', err);
        notifyError('Could not load PDF pages', err?.message || 'Check if PDF is protected.');
      } finally {
        if (isMounted) setIsLoadingPages(false);
      }
    };

    loadPdfThumbnails();
    return () => {
      isMounted = false;
    };
  }, [file]);

  // Update input text when marked pages change
  const updateInputFromPages = (updatedPages: PageItem[]) => {
    const markedNums = updatedPages.filter((p) => p.isMarkedForRemoval).map((p) => p.pageNumber);
    setPagesInput(markedNums.join(', '));
  };

  const togglePageRemoval = (pageNum: number) => {
    setPages((prev) => {
      const next = prev.map((p) =>
        p.pageNumber === pageNum ? { ...p, isMarkedForRemoval: !p.isMarkedForRemoval } : p
      );
      updateInputFromPages(next);
      return next;
    });
  };

  const handleManualInputChange = (text: string) => {
    setPagesInput(text);
    const toRemove = new Set<number>();
    const parts = text.split(',').map((p) => p.trim());
    for (const part of parts) {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(Number);
        if (!isNaN(start) && !isNaN(end)) {
          for (let i = start; i <= end; i++) toRemove.add(i);
        }
      } else {
        const p = Number(part);
        if (!isNaN(p)) toRemove.add(p);
      }
    }

    setPages((prev) =>
      prev.map((p) => ({
        ...p,
        isMarkedForRemoval: toRemove.has(p.pageNumber),
      }))
    );
  };

  const selectEvenPages = () => {
    setPages((prev) => {
      const next = prev.map((p) => ({ ...p, isMarkedForRemoval: p.pageNumber % 2 === 0 }));
      updateInputFromPages(next);
      return next;
    });
  };

  const selectOddPages = () => {
    setPages((prev) => {
      const next = prev.map((p) => ({ ...p, isMarkedForRemoval: p.pageNumber % 2 !== 0 }));
      updateInputFromPages(next);
      return next;
    });
  };

  const clearSelection = () => {
    setPages((prev) => {
      const next = prev.map((p) => ({ ...p, isMarkedForRemoval: false }));
      updateInputFromPages(next);
      return next;
    });
  };

  const markedCount = pages.filter((p) => p.isMarkedForRemoval).length;
  const remainingCount = pages.length - markedCount;

  const removePages = async () => {
    if (!file || pages.length === 0) return;
    if (markedCount === 0) {
      notifyError('No Pages Selected', 'Click thumbnails or enter page numbers to delete.');
      return;
    }
    if (remainingCount === 0) {
      notifyError('Invalid Selection', 'Cannot delete all pages from the document.');
      return;
    }

    setIsProcessing(true);
    try {
      const existingPdfBytes = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(existingPdfBytes, { ignoreEncryption: true });

      const pagesToKeep: number[] = [];
      pages.forEach((p, idx) => {
        if (!p.isMarkedForRemoval) {
          pagesToKeep.push(idx); // 0-indexed for copyPages
        }
      });

      const newPdf = await PDFDocument.create();
      const copiedPages = await newPdf.copyPages(pdfDoc, pagesToKeep);
      copiedPages.forEach((p) => newPdf.addPage(p));

      const pdfBytes = await newPdf.save();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `pages_removed_${file.name}`;
      link.click();

      notifyCompleted(
        'Pages Removed Successfully',
        `Deleted ${markedCount} page(s). New PDF contains ${remainingCount} pages.`
      );
    } catch (err: any) {
      console.error(err);
      notifyError('Removal Failed', err?.message || 'Error processing PDF document.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="max-w-5xl mx-auto border-none shadow-2xl bg-card/80 backdrop-blur-xl">
      <CardHeader className="text-center p-8">
        <div className="mx-auto w-16 h-16 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-600 mb-4">
          <Trash2 className="w-8 h-8" />
        </div>
        <CardTitle className="text-3xl font-black">Visual Page Remover</CardTitle>
        <CardDescription>
          Click pages on the visual grid to delete them, or enter specific page ranges.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-8 space-y-8">
        {!file ? (
          <div className="border-4 border-dashed border-muted rounded-[2rem] p-12 text-center hover:border-rose-500/50 transition-colors relative cursor-pointer group">
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => e.target.files && setFile(e.target.files[0])}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <Trash2 className="w-14 h-14 text-rose-500/40 group-hover:text-rose-500 transition-colors mx-auto mb-4" />
            <p className="font-black text-lg text-foreground">Select PDF to Delete Pages</p>
            <p className="text-xs text-muted-foreground mt-1">Interactive page grid with click-to-delete marks</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="p-4 bg-muted/40 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="w-6 h-6 text-rose-600 flex-shrink-0" />
                <div>
                  <span className="font-bold truncate text-sm block">{file.name}</span>
                  <span className="text-[11px] text-muted-foreground font-semibold">
                    Total: {pages.length} Pages • <span className="text-rose-600 font-bold">Removing {markedCount}</span> • <span className="text-emerald-600 font-bold">Keeping {remainingCount}</span>
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

            {/* Selection Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-muted/20 border rounded-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectEvenPages}
                  className="rounded-xl font-bold text-xs"
                >
                  Delete Even Pages
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectOddPages}
                  className="rounded-xl font-bold text-xs"
                >
                  Delete Odd Pages
                </Button>
                {markedCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSelection}
                    className="text-xs font-bold text-muted-foreground hover:text-foreground"
                  >
                    Clear All
                  </Button>
                )}
              </div>

              <div className="w-full sm:w-64">
                <Input
                  placeholder="e.g. 1, 3-5, 10"
                  value={pagesInput}
                  onChange={(e) => handleManualInputChange(e.target.value)}
                  className="h-9 rounded-xl font-mono text-xs"
                />
              </div>
            </div>

            {/* Thumbnail Grid */}
            {isLoadingPages ? (
              <div className="py-16 text-center space-y-3">
                <Loader2 className="w-8 h-8 text-rose-600 animate-spin mx-auto" />
                <p className="font-bold text-sm text-muted-foreground">Generating page thumbnails...</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-h-[550px] overflow-y-auto p-2 scrollbar-thin">
                {pages.map((p) => (
                  <div
                    key={p.pageNumber}
                    onClick={() => togglePageRemoval(p.pageNumber)}
                    className={`group relative p-3 rounded-2xl border-2 transition-all flex flex-col items-center bg-card shadow-sm cursor-pointer select-none ${
                      p.isMarkedForRemoval
                        ? 'border-rose-500 bg-rose-500/10 shadow-md shadow-rose-500/10'
                        : 'border-muted hover:border-rose-400'
                    }`}
                  >
                    {/* Header info */}
                    <div className="w-full flex items-center justify-between text-[11px] font-bold text-muted-foreground mb-2">
                      <span>Pg {p.pageNumber}</span>
                      {p.isMarkedForRemoval ? (
                        <span className="text-rose-600 font-extrabold bg-rose-500/10 px-1.5 py-0.5 rounded text-[10px] flex items-center gap-1">
                          <Trash2 className="w-3 h-3" /> DELETE
                        </span>
                      ) : (
                        <span className="text-emerald-600 font-bold text-[10px] flex items-center gap-0.5">
                          <Check className="w-3 h-3" /> KEEP
                        </span>
                      )}
                    </div>

                    {/* Preview Image with Red Overlay if marked */}
                    <div className="w-full h-36 flex items-center justify-center overflow-hidden bg-muted/30 rounded-xl p-1 relative">
                      {p.canvasUrl ? (
                        <img
                          src={p.canvasUrl}
                          alt={`Page ${p.pageNumber}`}
                          className={`max-h-full max-w-full object-contain transition-opacity ${
                            p.isMarkedForRemoval ? 'opacity-30 grayscale' : 'opacity-100'
                          }`}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                          Pg {p.pageNumber}
                        </div>
                      )}

                      {p.isMarkedForRemoval && (
                        <div className="absolute inset-0 flex items-center justify-center bg-rose-600/20 backdrop-blur-[1px]">
                          <div className="w-10 h-10 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg">
                            <X className="w-6 h-6 stroke-[3]" />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="w-full text-center mt-2 pt-1 border-t border-muted/50 text-[10px] font-bold text-muted-foreground">
                      {p.isMarkedForRemoval ? 'Click to Restore' : 'Click to Delete'}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Button
              className="w-full h-16 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-lg gap-2 shadow-xl shadow-rose-600/20 hover:shadow-2xl transition-all"
              disabled={isProcessing || isLoadingPages || markedCount === 0 || remainingCount === 0}
              onClick={removePages}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>DELETING {markedCount} PAGES...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-6 h-6" />
                  <span>
                    REMOVE {markedCount} PAGE(S) & DOWNLOAD ({remainingCount} REMAINING)
                  </span>
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
