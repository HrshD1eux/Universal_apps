'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  FilePlus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Download, 
  FileText, 
  Loader2, 
  SlidersHorizontal, 
  AlertTriangle, 
  ExternalLink, 
  CheckCircle2, 
  Maximize2,
  RotateCw
} from 'lucide-react';
import { PDFDocument, PageSizes, degrees, PDFPage } from 'pdf-lib';
import { useToast } from '@/hooks/use-toast';

interface PdfFileItem {
  id: string;
  name: string;
  file: File;
  sizeFormatted: string;
  pageCount?: number;
  dimensions?: {
    width: number;
    height: number;
    isLandscape: boolean;
    label: string;
  };
}

type PageSizeChoice = 'a4' | 'letter' | 'first' | 'original';
type OrientationChoice = 'smart' | 'portrait' | 'rotate_to_portrait';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getPaperLabel(visualW: number, visualH: number): string {
  const w = Math.round(Math.min(visualW, visualH));
  const h = Math.round(Math.max(visualW, visualH));
  if (Math.abs(w - 595) < 15 && Math.abs(h - 842) < 15) return 'A4';
  if (Math.abs(w - 612) < 15 && Math.abs(h - 792) < 15) return 'US Letter';
  if (Math.abs(w - 612) < 15 && Math.abs(h - 1008) < 15) return 'Legal';
  return `${Math.round(visualW)}×${Math.round(visualH)} pt`;
}

function applyPageStandardization(
  page: PDFPage,
  pageSizeOption: PageSizeChoice,
  orientationOption: OrientationChoice,
  marginPercent: number,
  firstPageSize: [number, number] | null
) {
  if (pageSizeOption === 'original') return;

  let stdW = PageSizes.A4[0]; // 595.28
  let stdH = PageSizes.A4[1]; // 841.89
  if (pageSizeOption === 'letter') {
    stdW = PageSizes.Letter[0]; // 612.00
    stdH = PageSizes.Letter[1]; // 792.00
  } else if (pageSizeOption === 'first' && firstPageSize) {
    [stdW, stdH] = firstPageSize;
  }

  const rawRotation = (page.getRotation().angle % 360 + 360) % 360;
  const isRotated90or270 = rawRotation === 90 || rawRotation === 270;

  const rawSize = page.getSize();
  const visualWidth = isRotated90or270 ? rawSize.height : rawSize.width;
  const visualHeight = isRotated90or270 ? rawSize.width : rawSize.height;
  const isLandscape = visualWidth > visualHeight;

  let targetVisualW = Math.min(stdW, stdH);
  let targetVisualH = Math.max(stdW, stdH);

  if (orientationOption === 'rotate_to_portrait' && isLandscape) {
    const newRot = (rawRotation + 90) % 360;
    page.setRotation(degrees(newRot));
    targetVisualW = Math.min(stdW, stdH);
    targetVisualH = Math.max(stdW, stdH);
  } else if (orientationOption === 'smart' && isLandscape) {
    targetVisualW = Math.max(stdW, stdH);
    targetVisualH = Math.min(stdW, stdH);
  } else if (orientationOption === 'portrait') {
    targetVisualW = Math.min(stdW, stdH);
    targetVisualH = Math.max(stdW, stdH);
  }

  const currentRot = (page.getRotation().angle % 360 + 360) % 360;
  const currentRotated = currentRot === 90 || currentRot === 270;

  const targetPhysW = currentRotated ? targetVisualH : targetVisualW;
  const targetPhysH = currentRotated ? targetVisualW : targetVisualH;

  const marginFactor = Math.max(0.6, 1 - (marginPercent / 100) * 2);
  const usableW = targetPhysW * marginFactor;
  const usableH = targetPhysH * marginFactor;

  const currentSize = page.getSize();
  const scale = Math.min(usableW / currentSize.width, usableH / currentSize.height);

  page.scale(scale, scale);
  const scaledSize = page.getSize();

  const xOffset = (targetPhysW - scaledSize.width) / 2;
  const yOffset = (targetPhysH - scaledSize.height) / 2;

  page.translateContent(xOffset, yOffset);
  page.setSize(targetPhysW, targetPhysH);
}

export default function PdfMerger() {
  const [files, setFiles] = useState<PdfFileItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pageSizeOption, setPageSizeOption] = useState<PageSizeChoice>('a4');
  const [orientationOption, setOrientationOption] = useState<OrientationChoice>('smart');
  const [marginOption, setMarginOption] = useState<number>(2);
  const [mergedBlobUrl, setMergedBlobUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selectedFiles = Array.from(e.target.files);

    const initialItems: PdfFileItem[] = selectedFiles.map(file => ({
      id: Math.random().toString(36).substring(2, 9),
      name: file.name,
      file,
      sizeFormatted: formatBytes(file.size),
    }));

    setFiles(prev => [...prev, ...initialItems]);
    setMergedBlobUrl(null);

    // Asynchronously inspect PDF dimensions and page counts
    for (const item of initialItems) {
      try {
        const buffer = await item.file.arrayBuffer();
        const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
        const count = doc.getPageCount();
        if (count > 0) {
          const firstPage = doc.getPage(0);
          const rawSize = firstPage.getSize();
          const rawRot = (firstPage.getRotation().angle % 360 + 360) % 360;
          const isRot = rawRot === 90 || rawRot === 270;
          const visualW = isRot ? rawSize.height : rawSize.width;
          const visualH = isRot ? rawSize.width : rawSize.height;
          const isLandscape = visualW > visualH;
          const label = getPaperLabel(visualW, visualH);

          setFiles(current =>
            current.map(f =>
              f.id === item.id
                ? {
                    ...f,
                    pageCount: count,
                    dimensions: { width: visualW, height: visualH, isLandscape, label },
                  }
                : f
            )
          );
        }
      } catch {
        // Silently skip if metadata extraction fails; merge will still process
      }
    }
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    setMergedBlobUrl(null);
  };

  const moveFile = (index: number, direction: 'up' | 'down') => {
    const newFiles = [...files];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < newFiles.length) {
      [newFiles[index], newFiles[targetIndex]] = [newFiles[targetIndex], newFiles[index]];
      setFiles(newFiles);
    }
  };

  const hasMismatchedDimensions = useMemo(() => {
    const list = files.map(f => f.dimensions).filter(Boolean);
    if (list.length < 2) return false;
    const first = list[0]!;
    return list.some(
      d =>
        Math.abs(d!.width - first.width) > 40 ||
        Math.abs(d!.height - first.height) > 40 ||
        d!.isLandscape !== first.isLandscape
    );
  }, [files]);

  const mergePdfs = async () => {
    if (files.length < 2) {
      toast({
        title: 'Minimum 2 PDFs required',
        description: 'Please select at least two PDF documents to merge.',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    try {
      const mergedPdf = await PDFDocument.create();
      let firstPageSize: [number, number] | null = null;

      for (let i = 0; i < files.length; i++) {
        const item = files[i];
        const fileBytes = await item.file.arrayBuffer();
        const pdf = await PDFDocument.load(fileBytes, { ignoreEncryption: true });

        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());

        for (let pIdx = 0; pIdx < copiedPages.length; pIdx++) {
          const page = copiedPages[pIdx];

          if (!firstPageSize) {
            const raw = page.getSize();
            const rot = (page.getRotation().angle % 360 + 360) % 360;
            const isR = rot === 90 || rot === 270;
            firstPageSize = isR ? [raw.height, raw.width] : [raw.width, raw.height];
          }

          if (pageSizeOption !== 'original') {
            applyPageStandardization(
              page,
              pageSizeOption,
              orientationOption,
              marginOption,
              firstPageSize
            );
          }

          mergedPdf.addPage(page);
        }
      }

      const mergedPdfBytes = await mergedPdf.save();
      const blob = new Blob([mergedPdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setMergedBlobUrl(url);

      // Trigger instant automatic download
      const link = document.createElement('a');
      link.href = url;
      link.download = `merged_${Date.now()}.pdf`;
      link.click();

      toast({
        title: 'PDFs Merged Successfully',
        description:
          pageSizeOption !== 'original'
            ? `Standardized to ${pageSizeOption.toUpperCase()} with uniform page scaling.`
            : 'Combined files while preserving original page dimensions.',
      });
    } catch (err: any) {
      console.error('Merge error:', err);
      toast({
        title: 'Merge Failed',
        description: err.message || 'There was an error reading or merging the PDF files.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="max-w-4xl mx-auto border-none shadow-2xl bg-card/80 backdrop-blur-xl">
      <CardHeader className="text-center p-8 pb-4">
        <div className="mx-auto w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 mb-4 shadow-inner">
          <FilePlus className="w-8 h-8" />
        </div>
        <CardTitle className="text-3xl font-black">Universal PDF Merger</CardTitle>
        <CardDescription className="text-base font-medium">
          Combine multiple PDF files with smart page normalization to fix mismatched, stretched, or tiny pages.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-8 pt-4 space-y-6">
        {/* Upload Zone */}
        <div className="border-4 border-dashed border-muted rounded-[2rem] p-8 text-center hover:border-red-500/50 hover:bg-red-500/[0.02] transition-all relative group cursor-pointer">
          <input
            type="file"
            multiple
            accept="application/pdf"
            onChange={handleFileSelect}
            className="absolute inset-0 opacity-0 cursor-pointer z-10"
          />
          <FilePlus className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50 group-hover:scale-110 group-hover:text-red-500 group-hover:opacity-100 transition-all duration-300" />
          <p className="font-bold text-foreground text-lg">Click or drag PDF documents here</p>
          <p className="text-xs text-muted-foreground font-semibold mt-1">
            Supports multiple documents, scanned pages, and mixed orientations
          </p>
        </div>

        {/* Warning Banner if Mismatched Dimensions Detected */}
        {hasMismatchedDimensions && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 flex items-start gap-3 text-amber-900 dark:text-amber-200">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-black">Mismatched Page Dimensions Detected</p>
              <p className="opacity-90 mt-0.5 text-xs">
                Your selected PDFs have different dimensions or orientations (e.g. A4 portrait vs wide scanned landscape).
                Keeping <strong>Standardize to A4</strong> enabled below scales and centers all pages so they look crisp, aligned, and uniform in all PDF readers.
              </p>
            </div>
          </div>
        )}

        {/* Normalization & Formatting Options */}
        {files.length > 0 && (
          <div className="p-6 rounded-3xl bg-muted/40 border-2 border-primary/10 space-y-5">
            <div className="flex items-center gap-2 text-sm font-black text-foreground">
              <SlidersHorizontal className="w-4 h-4 text-red-500" />
              <span>Page Scaling & Standardization Settings</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Page Size Option */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                  Target Page Size
                </label>
                <select
                  value={pageSizeOption}
                  onChange={e => setPageSizeOption(e.target.value as PageSizeChoice)}
                  className="w-full h-11 px-3 text-xs font-bold rounded-xl border bg-background focus:ring-2 focus:ring-red-500 outline-none"
                >
                  <option value="a4">A4 (Recommended — 595 × 842 pt)</option>
                  <option value="letter">US Letter (612 × 792 pt)</option>
                  <option value="first">Fit to First PDF's Size</option>
                  <option value="original">Original Dimensions (Keep As-Is)</option>
                </select>
              </div>

              {/* Orientation Handling */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                  Orientation Handling
                </label>
                <select
                  value={orientationOption}
                  disabled={pageSizeOption === 'original'}
                  onChange={e => setOrientationOption(e.target.value as OrientationChoice)}
                  className="w-full h-11 px-3 text-xs font-bold rounded-xl border bg-background focus:ring-2 focus:ring-red-500 outline-none disabled:opacity-50"
                >
                  <option value="smart">Smart Fit (Portrait + Landscape A4)</option>
                  <option value="portrait">Uniform Portrait (Fit All to Portrait)</option>
                  <option value="rotate_to_portrait">Rotate Landscape to Portrait (90°)</option>
                </select>
              </div>

              {/* Margins */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                  Content Margin
                </label>
                <select
                  value={marginOption}
                  disabled={pageSizeOption === 'original'}
                  onChange={e => setMarginOption(Number(e.target.value))}
                  className="w-full h-11 px-3 text-xs font-bold rounded-xl border bg-background focus:ring-2 focus:ring-red-500 outline-none disabled:opacity-50"
                >
                  <option value={0}>Edge-to-Edge (0% Margin - Max Size)</option>
                  <option value={2}>Small Margin (2% Padding)</option>
                  <option value={5}>Standard Margin (5% Padding)</option>
                </select>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground/80 italic">
              {pageSizeOption === 'a4' && orientationOption === 'smart' &&
                '✓ Scales each page into standard A4 sheets while preserving aspect ratio, preventing shrunken pages.'}
              {pageSizeOption === 'a4' && orientationOption === 'portrait' &&
                '✓ Fits every page into a vertical A4 portrait page for smooth, uniform continuous vertical scrolling.'}
              {pageSizeOption === 'a4' && orientationOption === 'rotate_to_portrait' &&
                '✓ Rotates wide landscape pages 90° so they fill the full height of standard A4 portrait sheets.'}
              {pageSizeOption === 'original' &&
                '⚠️ Keeps each page’s raw dimensions without resizing. May cause zoom discrepancies in viewers if page sizes differ.'}
            </p>
          </div>
        )}

        {/* Selected Files List */}
        {files.length > 0 && (
          <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                Document Sequence ({files.length} Files)
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFiles([]);
                  setMergedBlobUrl(null);
                }}
                className="text-xs text-rose-500 hover:text-rose-600 h-7 px-2"
              >
                Clear All
              </Button>
            </div>

            {files.map((file, index) => (
              <div
                key={file.id}
                className="flex items-center gap-3 p-3.5 bg-muted/30 rounded-2xl border-2 transition-all hover:bg-muted/50"
              >
                <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500 shrink-0 font-black text-xs">
                  {index + 1}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate text-sm text-foreground">{file.name}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                      {file.sizeFormatted}
                    </span>
                    {file.pageCount !== undefined && (
                      <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                        {file.pageCount} {file.pageCount === 1 ? 'Page' : 'Pages'}
                      </span>
                    )}
                    {file.dimensions && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          file.dimensions.isLandscape
                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {file.dimensions.label} ({file.dimensions.isLandscape ? 'Landscape' : 'Portrait'})
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={index === 0}
                    onClick={() => moveFile(index, 'up')}
                    className="h-8 w-8 rounded-lg"
                    title="Move Up"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={index === files.length - 1}
                    onClick={() => moveFile(index, 'down')}
                    className="h-8 w-8 rounded-lg"
                    title="Move Down"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFile(file.id)}
                    className="h-8 w-8 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                    title="Remove File"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <Button
            className="w-full h-16 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-lg gap-3 shadow-xl transition-all"
            disabled={files.length < 2 || isProcessing}
            onClick={mergePdfs}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                STANDARDIZING & MERGING PAGES...
              </>
            ) : (
              <>
                <Download className="w-6 h-6" />
                MERGE & DOWNLOAD STANDARDIZED PDF
              </>
            )}
          </Button>

          {/* Quick Preview Link when merged */}
          {mergedBlobUrl && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-emerald-950 dark:text-emerald-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="text-xs font-bold">Merge complete! Files combined into uniform document.</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(mergedBlobUrl, '_blank')}
                className="gap-1.5 text-xs font-bold rounded-xl border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 shrink-0"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open / Verify in New Tab
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
