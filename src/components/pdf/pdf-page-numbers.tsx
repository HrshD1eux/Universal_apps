'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileDigit, FileText, Download, Loader2, Sparkles, SlidersHorizontal, Eye } from 'lucide-react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { useToast } from '@/hooks/use-toast';
import { notifyCompleted, notifyError } from '@/lib/notify';

type Position = 'bottom-center' | 'bottom-right' | 'bottom-left' | 'top-center' | 'top-right' | 'top-left';
type NumberFormat = 'page-of-total' | 'slash-total' | 'number-only' | 'page-number' | 'dash';

export default function PdfPageNumbers() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [position, setPosition] = useState<Position>('bottom-right');
  const [format, setFormat] = useState<NumberFormat>('page-of-total');
  const [fontSize, setFontSize] = useState<number>(10);
  const [margin, setMargin] = useState<number>(24);
  const [startFromPage, setStartFromPage] = useState<number>(1);
  const [firstNumber, setFirstNumber] = useState<number>(1);
  const [colorHex, setColorHex] = useState<'#64748b' | '#000000' | '#94a3b8'>('#64748b');
  const { toast } = useToast();

  const getSampleText = (n: number, total: number) => {
    switch (format) {
      case 'page-of-total':
        return `Page ${n} of ${total}`;
      case 'slash-total':
        return `${n} / ${total}`;
      case 'page-number':
        return `Page ${n}`;
      case 'dash':
        return `— ${n} —`;
      case 'number-only':
      default:
        return `${n}`;
    }
  };

  const addPageNumbers = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const existingPdfBytes = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const pages = pdfDoc.getPages();
      const totalPages = pages.length;

      // Color mapping
      let textColor = rgb(0.39, 0.45, 0.54); // #64748b
      if (colorHex === '#000000') textColor = rgb(0, 0, 0);
      if (colorHex === '#94a3b8') textColor = rgb(0.58, 0.64, 0.72);

      let numberedCount = 0;
      pages.forEach((page, index) => {
        const pageNum = index + 1;
        if (pageNum < startFromPage) return;

        const effectiveNum = firstNumber + (pageNum - startFromPage);
        const text = getSampleText(effectiveNum, totalPages);
        const textWidth = helveticaFont.widthOfTextAtSize(text, fontSize);
        const textHeight = helveticaFont.heightAtSize(fontSize);
        const { width, height } = page.getSize();

        let x = width / 2 - textWidth / 2;
        let y = margin;

        if (position === 'bottom-left') {
          x = margin;
          y = margin;
        } else if (position === 'bottom-center') {
          x = width / 2 - textWidth / 2;
          y = margin;
        } else if (position === 'bottom-right') {
          x = width - margin - textWidth;
          y = margin;
        } else if (position === 'top-left') {
          x = margin;
          y = height - margin - textHeight;
        } else if (position === 'top-center') {
          x = width / 2 - textWidth / 2;
          y = height - margin - textHeight;
        } else if (position === 'top-right') {
          x = width - margin - textWidth;
          y = height - margin - textHeight;
        }

        page.drawText(text, {
          x,
          y,
          size: fontSize,
          font: helveticaFont,
          color: textColor,
        });
        numberedCount++;
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `numbered_${file.name}`;
      link.click();

      notifyCompleted(
        'Page Numbers Applied',
        `Successfully numbered ${numberedCount} of ${totalPages} pages in "${file.name}".`
      );
    } catch (err: any) {
      console.error(err);
      notifyError('Failed to Number PDF', err?.message || 'Could not process PDF document.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="max-w-3xl mx-auto border-none shadow-2xl bg-card/80 backdrop-blur-xl">
      <CardHeader className="text-center p-8">
        <div className="mx-auto w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-500 mb-4">
          <FileDigit className="w-8 h-8" />
        </div>
        <CardTitle className="text-3xl font-black">Pro Page Numbering</CardTitle>
        <CardDescription>
          Customize positions, formats, fonts, and skip cover pages with live preview.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-8 space-y-8">
        {!file ? (
          <div className="border-4 border-dashed border-muted rounded-[2rem] p-12 text-center hover:border-indigo-500/50 transition-colors relative cursor-pointer group">
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => e.target.files && setFile(e.target.files[0])}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <FileDigit className="w-14 h-14 text-indigo-500/40 group-hover:text-indigo-500 transition-colors mx-auto mb-4" />
            <p className="font-black text-lg text-foreground">Select or Drop a PDF</p>
            <p className="text-xs text-muted-foreground mt-1">Add clean, standardized page numbering offline</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="p-4 bg-muted/40 rounded-2xl border flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="w-6 h-6 text-indigo-500 flex-shrink-0" />
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

            {/* Customization Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-2xl bg-muted/20 border">
              {/* Position Selector */}
              <div className="space-y-3">
                <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                  Position on Page
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'top-left', label: 'Top Left' },
                    { id: 'top-center', label: 'Top Center' },
                    { id: 'top-right', label: 'Top Right' },
                    { id: 'bottom-left', label: 'Bottom Left' },
                    { id: 'bottom-center', label: 'Bottom Center' },
                    { id: 'bottom-right', label: 'Bottom Right' },
                  ].map((pos) => (
                    <button
                      key={pos.id}
                      type="button"
                      onClick={() => setPosition(pos.id as Position)}
                      className={`p-2.5 rounded-xl text-xs font-bold border transition-all ${
                        position === pos.id
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-background hover:bg-muted text-foreground'
                      }`}
                    >
                      {pos.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Number Format */}
              <div className="space-y-3">
                <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                  Number Format
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'page-of-total', label: 'Page 1 of 10' },
                    { id: 'slash-total', label: '1 / 10' },
                    { id: 'number-only', label: '1' },
                    { id: 'dash', label: '— 1 —' },
                  ].map((fmt) => (
                    <button
                      key={fmt.id}
                      type="button"
                      onClick={() => setFormat(fmt.id as NumberFormat)}
                      className={`p-2.5 rounded-xl text-xs font-bold border transition-all ${
                        format === fmt.id
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-background hover:bg-muted text-foreground'
                      }`}
                    >
                      {fmt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Page Range & Start Controls */}
              <div className="space-y-3">
                <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                  Start Numbering At
                </Label>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <span className="text-[10px] text-muted-foreground font-semibold block mb-1">Apply from page</span>
                    <Input
                      type="number"
                      min={1}
                      value={startFromPage}
                      onChange={(e) => setStartFromPage(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="rounded-xl h-10 font-bold"
                    />
                  </div>
                  <div className="flex-1">
                    <span className="text-[10px] text-muted-foreground font-semibold block mb-1">First label number</span>
                    <Input
                      type="number"
                      min={1}
                      value={firstNumber}
                      onChange={(e) => setFirstNumber(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="rounded-xl h-10 font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Font Size & Margin */}
              <div className="space-y-3">
                <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                  Typography & Spacing
                </Label>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <span className="text-[10px] text-muted-foreground font-semibold block mb-1">Font Size ({fontSize}pt)</span>
                    <Input
                      type="number"
                      min={8}
                      max={20}
                      value={fontSize}
                      onChange={(e) => setFontSize(Math.min(24, Math.max(8, parseInt(e.target.value, 10) || 10)))}
                      className="rounded-xl h-10 font-bold"
                    />
                  </div>
                  <div className="flex-1">
                    <span className="text-[10px] text-muted-foreground font-semibold block mb-1">Margin ({margin}pt)</span>
                    <Input
                      type="number"
                      min={10}
                      max={60}
                      value={margin}
                      onChange={(e) => setMargin(Math.min(100, Math.max(8, parseInt(e.target.value, 10) || 24)))}
                      className="rounded-xl h-10 font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Live Visual Preview Sheet */}
            <div className="p-4 rounded-2xl bg-muted/40 border space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
                <span className="flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" /> Sheet Placement Preview</span>
                <span className="font-mono text-indigo-600 dark:text-indigo-400">Sample: "{getSampleText(firstNumber, 10)}"</span>
              </div>
              <div className="relative w-44 h-56 mx-auto bg-white dark:bg-slate-900 border-2 border-indigo-500/30 rounded-xl shadow-md p-3 flex flex-col justify-between overflow-hidden">
                <div className="flex justify-between items-start text-[8px] font-mono">
                  <span className={position === 'top-left' ? 'text-indigo-600 font-bold bg-indigo-50 px-1 rounded' : 'text-slate-300'}>
                    {position === 'top-left' ? getSampleText(firstNumber, 10) : ''}
                  </span>
                  <span className={position === 'top-center' ? 'text-indigo-600 font-bold bg-indigo-50 px-1 rounded' : 'text-slate-300'}>
                    {position === 'top-center' ? getSampleText(firstNumber, 10) : ''}
                  </span>
                  <span className={position === 'top-right' ? 'text-indigo-600 font-bold bg-indigo-50 px-1 rounded' : 'text-slate-300'}>
                    {position === 'top-right' ? getSampleText(firstNumber, 10) : ''}
                  </span>
                </div>
                
                <div className="space-y-1.5 opacity-25">
                  <div className="h-1.5 bg-slate-400 rounded w-full"></div>
                  <div className="h-1.5 bg-slate-400 rounded w-3/4"></div>
                  <div className="h-1.5 bg-slate-400 rounded w-5/6"></div>
                </div>

                <div className="flex justify-between items-end text-[8px] font-mono">
                  <span className={position === 'bottom-left' ? 'text-indigo-600 font-bold bg-indigo-50 px-1 rounded' : 'text-slate-300'}>
                    {position === 'bottom-left' ? getSampleText(firstNumber, 10) : ''}
                  </span>
                  <span className={position === 'bottom-center' ? 'text-indigo-600 font-bold bg-indigo-50 px-1 rounded' : 'text-slate-300'}>
                    {position === 'bottom-center' ? getSampleText(firstNumber, 10) : ''}
                  </span>
                  <span className={position === 'bottom-right' ? 'text-indigo-600 font-bold bg-indigo-50 px-1 rounded' : 'text-slate-300'}>
                    {position === 'bottom-right' ? getSampleText(firstNumber, 10) : ''}
                  </span>
                </div>
              </div>
            </div>

            <Button
              className="w-full h-16 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg gap-2 shadow-xl hover:shadow-2xl transition-all"
              disabled={isProcessing}
              onClick={addPageNumbers}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>NUMBERING PAGES...</span>
                </>
              ) : (
                <>
                  <Download className="w-6 h-6" />
                  <span>APPLY NUMBERS & DOWNLOAD</span>
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
