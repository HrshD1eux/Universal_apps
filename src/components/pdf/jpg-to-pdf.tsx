'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { 
  FileImage, Download, Loader2, Trash2, 
  MoveUp, MoveDown, Plus, Sparkles, Settings2, Image as ImageIcon
} from 'lucide-react';
import { PDFDocument, PageSizes } from 'pdf-lib';
import { motion, AnimatePresence } from 'framer-motion';
import { notifyCompleted, notifyError } from '@/lib/notify';

interface PDFFileItem {
  id: string;
  name: string;
  file: File;
  preview: string;
}

type PageSizeOption = 'auto' | 'a4' | 'letter';
type OrientationOption = 'auto' | 'portrait' | 'landscape';
type MarginOption = 'none' | 'small' | 'standard';

export default function JpgToPdf() {
  const [files, setFiles] = useState<PDFFileItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pageSize, setPageSize] = useState<PageSizeOption>('a4');
  const [orientation, setOrientation] = useState<OrientationOption>('auto');
  const [margin, setMargin] = useState<MarginOption>('small');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const incoming = Array.from(e.target.files).map((file) => ({
        id: Math.random().toString(36).substring(2, 9),
        name: file.name,
        file,
        preview: URL.createObjectURL(file),
      }));
      setFiles((prev) => [...prev, ...incoming]);
    }
  };

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const filtered = prev.filter((f) => f.id !== id);
      const removed = prev.find((f) => f.id === id);
      if (removed) URL.revokeObjectURL(removed.preview);
      return filtered;
    });
  };

  const moveFile = (index: number, direction: 'up' | 'down') => {
    const newFiles = [...files];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= files.length) return;
    [newFiles[index], newFiles[targetIndex]] = [newFiles[targetIndex], newFiles[index]];
    setFiles(newFiles);
  };

  // Convert non-PNG/JPG (e.g. WebP, BMP, AVIF) into PNG bytes via canvas
  const convertImageToStandardBytes = async (file: File): Promise<{ bytes: ArrayBuffer; isPng: boolean }> => {
    const isNativePng = file.type === 'image/png';
    const isNativeJpg = file.type === 'image/jpeg' || file.type === 'image/jpg';

    if (isNativePng) {
      return { bytes: await file.arrayBuffer(), isPng: true };
    }
    if (isNativeJpg) {
      return { bytes: await file.arrayBuffer(), isPng: false };
    }

    // Convert WebP, AVIF, BMP, GIF via canvas
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(objectUrl);
          reject(new Error('Canvas context unavailable'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(async (blob) => {
          URL.revokeObjectURL(objectUrl);
          if (!blob) {
            reject(new Error('Image conversion failed'));
            return;
          }
          resolve({ bytes: await blob.arrayBuffer(), isPng: true });
        }, 'image/png');
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error(`Failed to decode image "${file.name}"`));
      };
      img.src = objectUrl;
    });
  };

  const convertToPdf = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);

    try {
      const pdfDoc = await PDFDocument.create();

      for (const item of files) {
        const { bytes, isPng } = await convertImageToStandardBytes(item.file);
        const embeddedImg = isPng ? await pdfDoc.embedPng(bytes) : await pdfDoc.embedJpg(bytes);

        const imgW = embeddedImg.width;
        const imgH = embeddedImg.height;
        const isImageLandscape = imgW > imgH;

        if (pageSize === 'auto') {
          // Exact match to image dimensions (0 margins)
          const page = pdfDoc.addPage([imgW, imgH]);
          page.drawImage(embeddedImg, { x: 0, y: 0, width: imgW, height: imgH });
        } else {
          // A4 or Letter
          let sheetW = pageSize === 'a4' ? PageSizes.A4[0] : PageSizes.Letter[0];
          let sheetH = pageSize === 'a4' ? PageSizes.A4[1] : PageSizes.Letter[1];

          // Handle orientation
          let isPageLandscape = false;
          if (orientation === 'landscape') {
            isPageLandscape = true;
          } else if (orientation === 'auto') {
            isPageLandscape = isImageLandscape;
          }

          if (isPageLandscape) {
            const temp = sheetW;
            sheetW = sheetH;
            sheetH = temp;
          }

          // Margin points
          let m = 0;
          if (margin === 'small') m = 18;
          if (margin === 'standard') m = 36;

          const usableW = sheetW - 2 * m;
          const usableH = sheetH - 2 * m;

          const scale = Math.min(usableW / imgW, usableH / imgH);
          const finalW = imgW * scale;
          const finalH = imgH * scale;

          const posX = m + (usableW - finalW) / 2;
          const posY = m + (usableH - finalH) / 2;

          const page = pdfDoc.addPage([sheetW, sheetH]);
          page.drawImage(embeddedImg, {
            x: posX,
            y: posY,
            width: finalW,
            height: finalH,
          });
        }
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `images_to_pdf_${Date.now()}.pdf`;
      link.click();

      notifyCompleted(
        'Images to PDF Complete',
        `Successfully compiled ${files.length} image(s) into PDF.`
      );
    } catch (err: any) {
      console.error(err);
      notifyError('Failed to generate PDF', err?.message || 'Error processing images.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 px-4">
      <Card className="border-none shadow-2xl bg-card/80 backdrop-blur-xl overflow-hidden">
        <CardHeader className="bg-teal-500/10 border-b border-teal-500/20 p-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-teal-600 text-white rounded-2xl shadow-lg shadow-teal-500/20">
                <FileImage className="w-8 h-8" />
              </div>
              <div>
                <CardTitle className="text-3xl font-black uppercase tracking-tight">
                  Pro Image to PDF Studio
                </CardTitle>
                <CardDescription className="text-sm font-bold text-teal-700 dark:text-teal-400">
                  Combine JPG, PNG, WebP, and AVIF images into a clean, uniform PDF offline.
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1.5fr,1fr] gap-10">
            {/* Left Column: Upload & Image List */}
            <div className="space-y-6">
              <div className="relative group">
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,image/avif,image/bmp,image/gif"
                  onChange={handleFileSelect}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                />
                <div className="h-40 border-4 border-dashed border-teal-500/30 rounded-[2.5rem] flex flex-col items-center justify-center bg-teal-500/5 group-hover:bg-teal-500/10 transition-all cursor-pointer">
                  <Plus className="w-10 h-10 text-teal-600 mb-2 opacity-60 group-hover:scale-125 transition-transform" />
                  <p className="text-sm font-black text-teal-700 dark:text-teal-300 uppercase tracking-wider">
                    Add Images (JPG, PNG, WebP, AVIF)
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Multi-select or drag & drop files here</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                    Selected Images ({files.length})
                  </p>
                  {files.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setFiles([])}
                      className="h-7 text-xs font-bold text-rose-500 uppercase hover:bg-rose-500/10"
                    >
                      Clear All
                    </Button>
                  )}
                </div>

                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-2 scrollbar-thin">
                  <AnimatePresence initial={false}>
                    {files.map((item, index) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="p-3 bg-card border-2 rounded-2xl flex items-center gap-4 group hover:border-teal-500/30 transition-all shadow-sm"
                      >
                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-muted flex-shrink-0 border">
                          <img src={item.preview} alt="preview" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-grow min-w-0">
                          <p className="text-xs font-bold truncate">{item.name}</p>
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase">
                            Page {index + 1}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => moveFile(index, 'up')}
                            disabled={index === 0}
                            className="h-8 w-8 rounded-lg"
                          >
                            <MoveUp className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => moveFile(index, 'down')}
                            disabled={index === files.length - 1}
                            className="h-8 w-8 rounded-lg"
                          >
                            <MoveDown className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFile(item.id)}
                            className="h-8 w-8 rounded-lg text-rose-500 hover:bg-rose-500/10"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {files.length === 0 && (
                    <div className="py-20 text-center opacity-30 border-2 border-dashed rounded-[2rem]">
                      <ImageIcon className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                        No images added yet
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Layout Controls & Convert Button */}
            <div className="space-y-6">
              <div className="p-6 rounded-3xl bg-muted/20 border space-y-5">
                <div className="flex items-center gap-2 mb-2">
                  <Settings2 className="w-4 h-4 text-teal-600" />
                  <span className="text-xs font-black uppercase tracking-wider text-foreground">
                    Layout Configuration
                  </span>
                </div>

                {/* Page Size */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase">Paper Size</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'a4', label: 'A4' },
                      { id: 'letter', label: 'US Letter' },
                      { id: 'auto', label: 'Fit Image' },
                    ].map((ps) => (
                      <button
                        key={ps.id}
                        type="button"
                        onClick={() => setPageSize(ps.id as PageSizeOption)}
                        className={`p-2.5 rounded-xl text-xs font-bold border transition-all ${
                          pageSize === ps.id
                            ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                            : 'bg-card hover:bg-muted text-foreground'
                        }`}
                      >
                        {ps.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Orientation (if not fit image) */}
                {pageSize !== 'auto' && (
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-muted-foreground uppercase">Orientation</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'auto', label: 'Auto (Match)' },
                        { id: 'portrait', label: 'Portrait' },
                        { id: 'landscape', label: 'Landscape' },
                      ].map((o) => (
                        <button
                          key={o.id}
                          type="button"
                          onClick={() => setOrientation(o.id as OrientationOption)}
                          className={`p-2.5 rounded-xl text-xs font-bold border transition-all ${
                            orientation === o.id
                              ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                              : 'bg-card hover:bg-muted text-foreground'
                          }`}
                        >
                          {o.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Margins */}
                {pageSize !== 'auto' && (
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-muted-foreground uppercase">Margins</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'none', label: 'Zero Margin' },
                        { id: 'small', label: 'Small (18pt)' },
                        { id: 'standard', label: 'Standard (36pt)' },
                      ].map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setMargin(m.id as MarginOption)}
                          className={`p-2.5 rounded-xl text-xs font-bold border transition-all ${
                            margin === m.id
                              ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                              : 'bg-card hover:bg-muted text-foreground'
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Button
                className="w-full h-20 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-black text-lg gap-3 shadow-xl shadow-teal-600/20 hover:shadow-2xl transition-all disabled:opacity-50"
                disabled={files.length === 0 || isProcessing}
                onClick={convertToPdf}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-7 h-7 animate-spin" />
                    <span>GENERATING PDF...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-7 h-7" />
                    <span>COMPILE {files.length} IMAGE(S) TO PDF</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
