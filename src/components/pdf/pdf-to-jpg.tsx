'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { FileImage, FileText, Download, Loader2, Sparkles, FolderArchive, Info } from 'lucide-react';
import * as pdfjs from 'pdfjs-dist';
import JSZip from 'jszip';
import { notifyCompleted, notifyError } from '@/lib/notify';

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

type ExportFormat = 'image/jpeg' | 'image/png';

export default function PdfToJpg() {
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<ExportFormat>('image/png');
  const [resolutionScale, setResolutionScale] = useState<number>(2.0); // 1.0 = 72dpi, 2.0 = 150dpi, 3.0 = 300dpi
  const [quality, setQuality] = useState<number>(0.85);
  const [downloadAsZip, setDownloadAsZip] = useState(true);
  const [range, setRange] = useState(''); // Empty means all pages
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const convertToImages = async () => {
    if (!file) return;
    setIsProcessing(true);
    setProgress(0);

    try {
      const arrayBuffer = await file.arrayBuffer();

      let pdf;
      try {
        pdf = await pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
      } catch (loadErr: any) {
        if (loadErr?.name === 'PasswordException' || loadErr?.message?.includes('password')) {
          notifyError('Protected PDF', 'Document is password-protected. Unlock it first.');
          return;
        }
        throw loadErr;
      }

      const totalPages = pdf.numPages;
      const pagesToProcess: number[] = [];

      if (!range.trim()) {
        for (let i = 1; i <= totalPages; i++) pagesToProcess.push(i);
      } else {
        const parts = range.split(',').map((p) => p.trim());
        for (const part of parts) {
          if (part.includes('-')) {
            const [start, end] = part.split('-').map(Number);
            if (!isNaN(start) && !isNaN(end)) {
              for (let i = start; i <= end; i++) {
                if (i >= 1 && i <= totalPages) pagesToProcess.push(i);
              }
            }
          } else {
            const p = Number(part);
            if (!isNaN(p) && p >= 1 && p <= totalPages) pagesToProcess.push(p);
          }
        }
      }

      if (pagesToProcess.length === 0) {
        throw new Error('No valid pages found in specified range.');
      }

      const ext = format === 'image/png' ? 'png' : 'jpg';
      const zip = downloadAsZip || pagesToProcess.length > 1 ? new JSZip() : null;

      for (let i = 0; i < pagesToProcess.length; i++) {
        const pageNum = pagesToProcess[i];
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: resolutionScale });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        if (context) {
          // For JPEG, fill white background to prevent black alpha transparent artifacts
          if (format === 'image/jpeg') {
            context.fillStyle = '#ffffff';
            context.fillRect(0, 0, canvas.width, canvas.height);
          }

          await page.render({ canvasContext: context, viewport }).promise;
          const imgData = canvas.toDataURL(format, format === 'image/jpeg' ? quality : undefined);

          if (zip) {
            const base64Data = imgData.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
            zip.file(`page_${pageNum}.${ext}`, base64Data, { base64: true });
          } else {
            const link = document.createElement('a');
            link.href = imgData;
            link.download = `page_${pageNum}.${ext}`;
            link.click();
          }
        }
        setProgress(Math.round(((i + 1) / pagesToProcess.length) * 100));
      }

      if (zip) {
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(zipBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${file.name.replace(/\.pdf$/i, '')}_images_${ext}.zip`;
        link.click();
      }

      notifyCompleted(
        'Export Finished',
        `Converted ${pagesToProcess.length} page(s) to ${ext.toUpperCase()} at ${resolutionScale === 3.0 ? '300 DPI' : resolutionScale === 2.0 ? '150 DPI' : '72 DPI'}.`
      );
    } catch (err: any) {
      console.error(err);
      notifyError('Conversion Failed', err?.message || 'Error converting pages to images.');
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  return (
    <Card className="max-w-3xl mx-auto border-none shadow-2xl bg-card/80 backdrop-blur-xl">
      <CardHeader className="text-center p-8">
        <div className="mx-auto w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-600 mb-4">
          <FileImage className="w-8 h-8" />
        </div>
        <CardTitle className="text-3xl font-black">Pro PDF to Image Converter</CardTitle>
        <CardDescription>
          Convert PDF pages to lossless PNG or high-efficiency JPG with customizable DPI.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-8 space-y-8">
        {!file ? (
          <div className="border-4 border-dashed border-muted rounded-[2rem] p-12 text-center hover:border-amber-500/50 transition-colors relative cursor-pointer group">
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileSelect}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <FileImage className="w-14 h-14 text-amber-500/40 group-hover:text-amber-500 transition-colors mx-auto mb-4" />
            <p className="font-black text-lg text-foreground">Select PDF to Convert</p>
            <p className="text-xs text-muted-foreground mt-1">Export pages in PNG or JPG with DPI selection</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="p-4 bg-muted/40 rounded-2xl border flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="w-6 h-6 text-amber-600 flex-shrink-0" />
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

            {/* Customization Options */}
            <div className="p-6 rounded-2xl bg-muted/20 border space-y-5">
              {/* Format & Resolution */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                    Output Format
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormat('image/png')}
                      className={`p-3 rounded-xl text-xs font-bold border transition-all ${
                        format === 'image/png'
                          ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                          : 'bg-background hover:bg-muted text-foreground'
                      }`}
                    >
                      PNG (Lossless)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormat('image/jpeg')}
                      className={`p-3 rounded-xl text-xs font-bold border transition-all ${
                        format === 'image/jpeg'
                          ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                          : 'bg-background hover:bg-muted text-foreground'
                      }`}
                    >
                      JPEG (Compact)
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                    DPI & Resolution
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: '72 DPI', scale: 1.0 },
                      { label: '150 DPI', scale: 2.0 },
                      { label: '300 DPI', scale: 3.0 },
                    ].map((item) => (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => setResolutionScale(item.scale)}
                        className={`p-3 rounded-xl text-xs font-bold border transition-all ${
                          resolutionScale === item.scale
                            ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                            : 'bg-background hover:bg-muted text-foreground'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Page Range Input */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <Label className="font-black uppercase tracking-wider text-muted-foreground">
                    Pages to Convert
                  </Label>
                  <span className="text-muted-foreground text-[11px]">Leave empty for all pages</span>
                </div>
                <Input
                  placeholder="e.g. 1, 3-5, 10 (Leave blank for all)"
                  value={range}
                  onChange={(e) => setRange(e.target.value)}
                  className="rounded-xl font-mono text-sm h-11"
                />
              </div>

              {/* Quality slider if JPEG */}
              {format === 'image/jpeg' && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between items-center text-xs font-black uppercase tracking-wider text-muted-foreground">
                    <span>JPEG Quality</span>
                    <span className="text-amber-600 font-bold">{Math.round(quality * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0.4}
                    max={1.0}
                    step={0.05}
                    value={quality}
                    onChange={(e) => setQuality(parseFloat(e.target.value))}
                    className="w-full accent-amber-600 cursor-pointer"
                  />
                </div>
              )}
            </div>

            {isProcessing && (
              <div className="w-full bg-muted rounded-full h-4 overflow-hidden relative border">
                <div
                  className="bg-amber-600 h-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-white mix-blend-difference">
                  {progress}%
                </span>
              </div>
            )}

            <Button
              className="w-full h-16 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-black text-lg gap-2 shadow-xl shadow-amber-600/20 hover:shadow-2xl transition-all"
              disabled={isProcessing}
              onClick={convertToImages}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>CONVERTING PAGES ({progress}%)...</span>
                </>
              ) : (
                <>
                  <Download className="w-6 h-6" />
                  <span>CONVERT TO {format === 'image/png' ? 'PNG' : 'JPG'} & DOWNLOAD</span>
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
