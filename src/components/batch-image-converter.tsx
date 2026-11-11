'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { 
  Images, Plus, Download, Trash2, 
  Loader2, Sparkles, FolderArchive, SlidersHorizontal, CheckCircle2
} from 'lucide-react';
import JSZip from 'jszip';
import { notifyCompleted, notifyError } from '@/lib/notify';

type TargetFormat = 'image/webp' | 'image/png' | 'image/jpeg';
type ResizePreset = 'original' | '1920' | '1280' | '800';

interface ImageItem {
  id: string;
  file: File;
  previewUrl: string;
  originalSize: number;
  convertedBlob?: Blob;
  convertedUrl?: string;
  convertedSize?: number;
}

export default function BatchImageConverter() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [targetFormat, setTargetFormat] = useState<TargetFormat>('image/webp');
  const [quality, setQuality] = useState(0.85);
  const [resize, setResize] = useState<ResizePreset>('original');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const incoming = Array.from(e.target.files).map((f) => ({
        id: Math.random().toString(36).substring(2, 9),
        file: f,
        previewUrl: URL.createObjectURL(f),
        originalSize: f.size,
      }));
      setImages((prev) => [...prev, ...incoming]);
    }
  };

  const removeImage = (id: string) => {
    setImages((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item) {
        URL.revokeObjectURL(item.previewUrl);
        if (item.convertedUrl) URL.revokeObjectURL(item.convertedUrl);
      }
      return prev.filter((i) => i.id !== id);
    });
  };

  const clearAll = () => {
    images.forEach((i) => {
      URL.revokeObjectURL(i.previewUrl);
      if (i.convertedUrl) URL.revokeObjectURL(i.convertedUrl);
    });
    setImages([]);
  };

  const convertSingleImage = (item: ImageItem): Promise<{ blob: Blob; url: string; size: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        let w = img.width;
        let h = img.height;

        if (resize !== 'original') {
          const maxDim = parseInt(resize, 10);
          if (w > maxDim || h > maxDim) {
            const scale = Math.min(maxDim / w, maxDim / h);
            w = Math.round(w * scale);
            h = Math.round(h * scale);
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context unavailable'));
          return;
        }

        if (targetFormat === 'image/jpeg') {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, w, h);
        }

        ctx.drawImage(img, 0, 0, w, h);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Conversion failed'));
              return;
            }
            resolve({
              blob,
              url: URL.createObjectURL(blob),
              size: blob.size,
            });
          },
          targetFormat,
          targetFormat === 'image/png' ? undefined : quality
        );
      };
      img.onerror = () => reject(new Error(`Failed to load ${item.file.name}`));
      img.src = item.previewUrl;
    });
  };

  const handleConvertAll = async () => {
    if (images.length === 0) return;
    setIsProcessing(true);
    setProgress(0);

    const ext = targetFormat === 'image/webp' ? 'webp' : targetFormat === 'image/png' ? 'png' : 'jpg';
    const updatedImages = [...images];

    try {
      const zip = new JSZip();

      for (let i = 0; i < updatedImages.length; i++) {
        const item = updatedImages[i];
        const res = await convertSingleImage(item);
        item.convertedBlob = res.blob;
        item.convertedUrl = res.url;
        item.convertedSize = res.size;

        const baseName = item.file.name.replace(/\.[^/.]+$/, '');
        const filename = `${baseName}.${ext}`;
        zip.file(filename, res.blob);

        setProgress(Math.round(((i + 1) / updatedImages.length) * 100));
      }

      setImages([...updatedImages]);

      // Download all as ZIP
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `converted_images_${ext}.zip`;
      link.click();

      notifyCompleted(
        'Batch Conversion Complete',
        `Successfully converted ${images.length} image(s) to ${ext.toUpperCase()} in a ZIP bundle.`
      );
    } catch (err: any) {
      console.error(err);
      notifyError('Conversion Failed', err?.message || 'Error processing images.');
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const totalOriginalBytes = images.reduce((acc, i) => acc + i.originalSize, 0);
  const totalConvertedBytes = images.reduce((acc, i) => acc + (i.convertedSize || 0), 0);
  const hasFinishedAny = images.some((i) => i.convertedSize !== undefined);

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      <Card className="border-none shadow-2xl bg-card/80 backdrop-blur-xl">
        <CardHeader className="p-8 border-b">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-600">
                <Images className="w-7 h-7" />
              </div>
              <div>
                <CardTitle className="text-3xl font-black">Batch Image Converter & Compressor</CardTitle>
                <CardDescription className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                  Convert images to WebP, PNG, or JPEG client-side with zero quality loss or upload
                </CardDescription>
              </div>
            </div>

            {images.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                className="text-xs font-bold text-rose-500 hover:bg-rose-500/10"
              >
                Clear All
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-8 space-y-8">
          {/* Dropzone */}
          <div className="relative group">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFiles}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
            />
            <div className="h-36 border-4 border-dashed border-cyan-500/30 rounded-[2rem] flex flex-col items-center justify-center bg-cyan-500/5 group-hover:bg-cyan-500/10 transition-all cursor-pointer">
              <Plus className="w-10 h-10 text-cyan-600 mb-2 opacity-60 group-hover:scale-125 transition-transform" />
              <p className="text-sm font-black text-cyan-700 dark:text-cyan-300 uppercase tracking-wider">
                Select or Drop Images (PNG, JPG, WebP, AVIF, BMP)
              </p>
              <p className="text-xs text-muted-foreground mt-1">Multi-image batch processing 100% offline</p>
            </div>
          </div>

          {/* Config Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 rounded-2xl bg-muted/20 border">
            {/* Target Format */}
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                Target Format
              </Label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'image/webp', label: 'WebP' },
                  { id: 'image/png', label: 'PNG' },
                  { id: 'image/jpeg', label: 'JPG' },
                ].map((fmt) => (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => setTargetFormat(fmt.id as TargetFormat)}
                    className={`p-2.5 rounded-xl text-xs font-bold border transition-all ${
                      targetFormat === fmt.id
                        ? 'bg-cyan-600 text-white border-cyan-600 shadow-sm'
                        : 'bg-card hover:bg-muted text-foreground'
                    }`}
                  >
                    {fmt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Resize Preset */}
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                Max Dimension
              </Label>
              <div className="grid grid-cols-4 gap-1">
                {[
                  { id: 'original', label: 'Original' },
                  { id: '1920', label: '1080p' },
                  { id: '1280', label: '720p' },
                  { id: '800', label: '800px' },
                ].map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setResize(r.id as ResizePreset)}
                    className={`p-2.5 rounded-xl text-[11px] font-bold border transition-all ${
                      resize === r.id
                        ? 'bg-cyan-600 text-white border-cyan-600 shadow-sm'
                        : 'bg-card hover:bg-muted text-foreground'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quality Slider (for WebP & JPG) */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-black uppercase tracking-wider text-muted-foreground">
                <span>Quality</span>
                <span className="text-cyan-600 font-bold">
                  {targetFormat === 'image/png' ? 'Lossless (100%)' : `${Math.round(quality * 100)}%`}
                </span>
              </div>
              <input
                type="range"
                min={0.3}
                max={1.0}
                step={0.05}
                disabled={targetFormat === 'image/png'}
                value={quality}
                onChange={(e) => setQuality(parseFloat(e.target.value))}
                className="w-full accent-cyan-600 cursor-pointer h-9 disabled:opacity-40"
              />
            </div>
          </div>

          {/* Images Grid */}
          {images.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
                <span>
                  {images.length} Image(s) • Total Input: {(totalOriginalBytes / 1024 / 1024).toFixed(2)} MB
                </span>
                {hasFinishedAny && totalConvertedBytes > 0 && (
                  <span className="text-emerald-600 font-extrabold">
                    Output: {(totalConvertedBytes / 1024 / 1024).toFixed(2)} MB (
                    {Math.max(
                      0,
                      Math.round(((totalOriginalBytes - totalConvertedBytes) / totalOriginalBytes) * 100)
                    )}
                    % smaller)
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 max-h-[420px] overflow-y-auto p-2 scrollbar-thin">
                {images.map((item) => (
                  <div
                    key={item.id}
                    className="group relative p-2.5 rounded-2xl border bg-card flex flex-col items-center shadow-sm"
                  >
                    <div className="w-full h-28 rounded-xl overflow-hidden bg-muted/40 flex items-center justify-center relative border">
                      <img src={item.previewUrl} alt={item.file.name} className="max-h-full max-w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(item.id)}
                        className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white hover:bg-rose-600 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                    <p className="text-[10px] font-bold truncate w-full mt-1.5 text-center text-foreground">
                      {item.file.name}
                    </p>

                    <div className="flex items-center justify-between w-full text-[9px] text-muted-foreground mt-0.5">
                      <span>{(item.originalSize / 1024).toFixed(0)} KB</span>
                      {item.convertedSize !== undefined && (
                        <span className="text-emerald-600 font-bold">
                          → {(item.convertedSize / 1024).toFixed(0)} KB
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isProcessing && (
            <div className="w-full bg-muted rounded-full h-4 overflow-hidden relative border">
              <div
                className="bg-cyan-600 h-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-white mix-blend-difference">
                {progress}%
              </span>
            </div>
          )}

          <Button
            className="w-full h-16 rounded-2xl bg-cyan-600 hover:bg-cyan-700 text-white font-black text-lg gap-2 shadow-xl shadow-cyan-600/20 hover:shadow-2xl transition-all disabled:opacity-50"
            disabled={images.length === 0 || isProcessing}
            onClick={handleConvertAll}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>CONVERTING IMAGES ({progress}%)...</span>
              </>
            ) : (
              <>
                <Download className="w-6 h-6" />
                <span>
                  CONVERT {images.length} IMAGE(S) TO{' '}
                  {targetFormat === 'image/webp' ? 'WEBP' : targetFormat === 'image/png' ? 'PNG' : 'JPG'} & DOWNLOAD ZIP
                </span>
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
