'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Scissors, FileText, Download, Loader2, CheckCircle2, FolderArchive, Layers } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import * as pdfjs from 'pdfjs-dist';
import JSZip from 'jszip';
import { notifyCompleted, notifyError } from '@/lib/notify';

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

interface PageItem {
  pageNumber: number;
  canvasUrl?: string;
  isSelected: boolean;
}

export default function PdfSplitter() {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [splitMode, setSplitMode] = useState<'selected' | 'all'>('selected');
  const [rangeInput, setRangeInput] = useState('');
  const [isLoadingPages, setIsLoadingPages] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Load PDF and render thumbnails
  useEffect(() => {
    if (!file) {
      setPages([]);
      setRangeInput('');
      return;
    }

    let isMounted = true;
    const loadPdf = async () => {
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
              isSelected: i === 1, // default select page 1
            });
          }
        }

        if (isMounted) {
          setPages(newPages);
          setRangeInput('1');
        }
      } catch (err: any) {
        console.error('Failed to load PDF:', err);
        notifyError('Could not load PDF', err?.message || 'Check if document is encrypted.');
      } finally {
        if (isMounted) setIsLoadingPages(false);
      }
    };

    loadPdf();
    return () => {
      isMounted = false;
    };
  }, [file]);

  const updateRangeFromSelection = (updated: PageItem[]) => {
    const selectedNums = updated.filter((p) => p.isSelected).map((p) => p.pageNumber);
    setRangeInput(selectedNums.join(', '));
  };

  const togglePageSelection = (pageNum: number) => {
    setPages((prev) => {
      const next = prev.map((p) =>
        p.pageNumber === pageNum ? { ...p, isSelected: !p.isSelected } : p
      );
      updateRangeFromSelection(next);
      return next;
    });
  };

  const handleRangeInputChange = (text: string) => {
    setRangeInput(text);
    const toSelect = new Set<number>();
    const parts = text.split(',').map((p) => p.trim());
    for (const part of parts) {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(Number);
        if (!isNaN(start) && !isNaN(end)) {
          for (let i = start; i <= end; i++) toSelect.add(i);
        }
      } else {
        const p = Number(part);
        if (!isNaN(p)) toSelect.add(p);
      }
    }

    setPages((prev) =>
      prev.map((p) => ({
        ...p,
        isSelected: toSelect.has(p.pageNumber),
      }))
    );
  };

  const selectAll = () => {
    setPages((prev) => {
      const next = prev.map((p) => ({ ...p, isSelected: true }));
      updateRangeFromSelection(next);
      return next;
    });
  };

  const selectNone = () => {
    setPages((prev) => {
      const next = prev.map((p) => ({ ...p, isSelected: false }));
      updateRangeFromSelection(next);
      return next;
    });
  };

  const selectedCount = pages.filter((p) => p.isSelected).length;

  const handleSplit = async () => {
    if (!file || pages.length === 0) return;

    if (splitMode === 'selected' && selectedCount === 0) {
      notifyError('No Pages Selected', 'Please select at least one page to extract.');
      return;
    }

    setIsProcessing(true);
    try {
      const fileBytes = await file.arrayBuffer();
      const pdf = await PDFDocument.load(fileBytes, { ignoreEncryption: true });
      const totalPages = pdf.getPageCount();

      if (splitMode === 'all') {
        // Split every page into separate PDF inside a ZIP
        const zip = new JSZip();
        for (let i = 0; i < totalPages; i++) {
          const newPdf = await PDFDocument.create();
          const [page] = await newPdf.copyPages(pdf, [i]);
          newPdf.addPage(page);
          const bytes = await newPdf.save();
          zip.file(`page_${i + 1}.pdf`, bytes);
        }

        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(zipBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `split_all_${file.name.replace(/\.pdf$/i, '')}.zip`;
        link.click();

        notifyCompleted(
          'Split All Completed',
          `Exported ${totalPages} individual page PDFs in a ZIP archive.`
        );
      } else {
        // Extract selected pages into a single new PDF
        const selectedIndices = pages
          .filter((p) => p.isSelected)
          .map((p) => p.pageNumber - 1);

        const newPdf = await PDFDocument.create();
        const copiedPages = await newPdf.copyPages(pdf, selectedIndices);
        copiedPages.forEach((p) => newPdf.addPage(p));

        const bytes = await newPdf.save();
        const blob = new Blob([bytes as any], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `extracted_${file.name}`;
        link.click();

        notifyCompleted(
          'Pages Extracted Successfully',
          `Created new document containing ${selectedCount} selected page(s).`
        );
      }
    } catch (err: any) {
      console.error(err);
      notifyError('Split Failed', err?.message || 'Error processing PDF document.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="max-w-5xl mx-auto border-none shadow-2xl bg-card/80 backdrop-blur-xl">
      <CardHeader className="text-center p-8">
        <div className="mx-auto w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-600 mb-4">
          <Scissors className="w-8 h-8" />
        </div>
        <CardTitle className="text-3xl font-black">Visual PDF Splitter & Extractor</CardTitle>
        <CardDescription>
          Extract selected pages into a new document or split every page into a ZIP.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-8 space-y-8">
        {!file ? (
          <div className="border-4 border-dashed border-muted rounded-[2rem] p-12 text-center hover:border-blue-500/50 transition-colors relative cursor-pointer group">
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => e.target.files && setFile(e.target.files[0])}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <Scissors className="w-14 h-14 text-blue-500/40 group-hover:text-blue-500 transition-colors mx-auto mb-4" />
            <p className="font-black text-lg text-foreground">Select PDF to Split or Extract</p>
            <p className="text-xs text-muted-foreground mt-1">Interactive page picker with instant export</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="p-4 bg-muted/40 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="w-6 h-6 text-blue-600 flex-shrink-0" />
                <div>
                  <span className="font-bold truncate text-sm block">{file.name}</span>
                  <span className="text-[11px] text-muted-foreground font-semibold">
                    Total: {pages.length} Pages • {splitMode === 'all' ? 'Split Every Page' : `Selected ${selectedCount} Page(s)`}
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

            {/* Split Mode Toggle */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSplitMode('selected')}
                className={`p-4 rounded-2xl border-2 text-left transition-all ${
                  splitMode === 'selected'
                    ? 'border-blue-600 bg-blue-600/5 shadow-md shadow-blue-500/10'
                    : 'border-muted hover:border-blue-400/40 bg-card'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <span className="font-bold text-sm">Extract Selected Pages</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Combine selected pages into a single new PDF document.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setSplitMode('all')}
                className={`p-4 rounded-2xl border-2 text-left transition-all ${
                  splitMode === 'all'
                    ? 'border-blue-600 bg-blue-600/5 shadow-md shadow-blue-500/10'
                    : 'border-muted hover:border-blue-400/40 bg-card'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <FolderArchive className="w-4 h-4 text-blue-600" />
                  <span className="font-bold text-sm">Split Every Page (ZIP)</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Save every page as its own individual PDF in a ZIP bundle.
                </p>
              </button>
            </div>

            {/* Interactive Thumbnail Picker if 'selected' mode */}
            {splitMode === 'selected' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-muted/20 border rounded-2xl">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={selectAll} className="rounded-xl font-bold text-xs">
                      Select All
                    </Button>
                    <Button variant="outline" size="sm" onClick={selectNone} className="rounded-xl font-bold text-xs">
                      Deselect All
                    </Button>
                  </div>

                  <div className="w-full sm:w-64">
                    <Input
                      placeholder="e.g. 1, 3-5"
                      value={rangeInput}
                      onChange={(e) => handleRangeInputChange(e.target.value)}
                      className="h-9 rounded-xl font-mono text-xs"
                    />
                  </div>
                </div>

                {isLoadingPages ? (
                  <div className="py-16 text-center space-y-3">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
                    <p className="font-bold text-sm text-muted-foreground">Loading page thumbnails...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-h-[500px] overflow-y-auto p-2 scrollbar-thin">
                    {pages.map((p) => (
                      <div
                        key={p.pageNumber}
                        onClick={() => togglePageSelection(p.pageNumber)}
                        className={`group relative p-3 rounded-2xl border-2 transition-all flex flex-col items-center bg-card shadow-sm cursor-pointer select-none ${
                          p.isSelected
                            ? 'border-blue-600 bg-blue-500/10 shadow-md shadow-blue-500/10'
                            : 'border-muted opacity-60 hover:opacity-100 hover:border-blue-400'
                        }`}
                      >
                        <div className="w-full flex items-center justify-between text-[11px] font-bold text-muted-foreground mb-2">
                          <span>Pg {p.pageNumber}</span>
                          {p.isSelected ? (
                            <span className="text-blue-600 font-extrabold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Selected
                            </span>
                          ) : (
                            <span className="opacity-40 text-[10px]">Excluded</span>
                          )}
                        </div>

                        <div className="w-full h-36 flex items-center justify-center overflow-hidden bg-muted/30 rounded-xl p-1 relative">
                          {p.canvasUrl ? (
                            <img
                              src={p.canvasUrl}
                              alt={`Page ${p.pageNumber}`}
                              className="max-h-full max-w-full object-contain drop-shadow-sm"
                            />
                          ) : (
                            <div className="text-xs text-muted-foreground">Pg {p.pageNumber}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <Button
              className="w-full h-16 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-lg gap-2 shadow-xl shadow-blue-600/20 hover:shadow-2xl transition-all"
              disabled={isProcessing || isLoadingPages || (splitMode === 'selected' && selectedCount === 0)}
              onClick={handleSplit}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>PROCESSING SPLIT...</span>
                </>
              ) : (
                <>
                  <Download className="w-6 h-6" />
                  <span>
                    {splitMode === 'all'
                      ? `SPLIT ALL ${pages.length} PAGES TO ZIP`
                      : `EXTRACT ${selectedCount} PAGE(S) & DOWNLOAD`}
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
