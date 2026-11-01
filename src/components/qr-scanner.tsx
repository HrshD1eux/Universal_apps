'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  QrCode, Upload, Copy, ExternalLink, RefreshCw, 
  CheckCircle2, AlertCircle, Sparkles, ClipboardPaste, ArrowRight, ShieldCheck
} from 'lucide-react';
import jsQR from 'jsqr';
import { useToast } from '@/hooks/use-toast';
import { copyToClipboard } from '@/lib/tauri-utils';

export default function QrScanner() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [decodedText, setDecodedText] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const isUrl = (text: string): boolean => {
    try {
      const url = new URL(text);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid File', description: 'Please select an image file (PNG, JPG, WebP).', variant: 'destructive' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setImagePreview(dataUrl);
      scanImageData(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const scanImageData = (dataUrl: string) => {
    setIsScanning(true);
    setDecodedText(null);
    setErrorMsg(null);

    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setErrorMsg('Failed to create canvas context.');
          setIsScanning(false);
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imgData.data, imgData.width, imgData.height, {
          inversionAttempts: 'attemptBoth'
        });

        if (code && code.data) {
          setDecodedText(code.data);
          toast({ title: 'QR Code Detected!', description: 'Content successfully decoded.' });
        } else {
          setErrorMsg('No valid QR code found in this image. Ensure the code is clearly visible and not cropped.');
        }
      } catch (err: any) {
        setErrorMsg('Error decoding QR code: ' + (err.message || String(err)));
      } finally {
        setIsScanning(false);
      }
    };
    img.onerror = () => {
      setErrorMsg('Failed to load image.');
      setIsScanning(false);
    };
    img.src = dataUrl;
  };

  // Clipboard Paste Listener
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            toast({ title: 'Image Pasted', description: 'Scanning clipboard image...' });
            processImageFile(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processImageFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleCopy = async () => {
    if (!decodedText) return;
    const ok = await copyToClipboard(decodedText);
    if (ok) {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
      toast({ title: 'Copied to Clipboard' });
    }
  };

  const handleOpenUrl = async () => {
    if (!decodedText || !isUrl(decodedText)) return;
    try {
      // In Tauri desktop, try opener plugin if available
      const { openUrl } = await import('@tauri-apps/plugin-opener');
      await openUrl(decodedText);
    } catch {
      window.open(decodedText, '_blank', 'noopener,noreferrer');
    }
  };

  const handleReset = () => {
    setImagePreview(null);
    setDecodedText(null);
    setErrorMsg(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 px-4">
      <Card className="border-none shadow-2xl bg-gradient-to-br from-background via-muted/50 to-background overflow-hidden font-sans">
        <CardHeader className="bg-primary/5 border-b border-primary/10 p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-primary text-primary-foreground rounded-2xl shadow-lg shadow-primary/20">
                <QrCode className="w-8 h-8" />
              </div>
              <div>
                <CardTitle className="text-3xl font-black tracking-tight uppercase">Offline QR Scanner</CardTitle>
                <CardDescription className="text-base font-bold text-primary/60">
                  Instant client-side QR decoder — Paste from clipboard or import image
                </CardDescription>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-4 h-4" /> 100% Offline &amp; Private
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-8 space-y-8">
          {/* Drop / Paste Zone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="group relative border-3 border-dashed border-primary/20 hover:border-primary/50 transition-all rounded-[2.5rem] p-10 flex flex-col items-center justify-center cursor-pointer bg-card/60 hover:bg-card/90 shadow-inner min-h-[220px]"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="p-5 rounded-3xl bg-primary/10 group-hover:scale-110 transition-transform">
                <Upload className="w-10 h-10 text-primary" />
              </div>
              <div>
                <p className="text-lg font-black tracking-tight">Click to Browse or Drag &amp; Drop Image</p>
                <p className="text-sm font-semibold text-muted-foreground mt-1 flex items-center justify-center gap-1.5">
                  <ClipboardPaste className="w-4 h-4 text-primary" /> Or press <kbd className="px-2 py-0.5 rounded bg-muted border font-mono text-xs">Ctrl + V</kbd> anywhere to paste screenshot
                </p>
              </div>
            </div>
          </div>

          {/* Image Preview & Scanner State */}
          {imagePreview && (
            <div className="grid grid-cols-1 md:grid-cols-[260px,1fr] gap-8 p-6 rounded-3xl bg-muted/30 border-2">
              <div className="flex flex-col items-center justify-center bg-card p-4 rounded-2xl border shadow-sm">
                <img
                  src={imagePreview}
                  alt="QR Code Preview"
                  className="max-h-48 max-w-full rounded-xl object-contain shadow-inner"
                />
                <Button variant="ghost" size="sm" onClick={handleReset} className="mt-3 text-xs font-bold gap-1 text-muted-foreground hover:text-foreground">
                  <RefreshCw className="w-3.5 h-3.5" /> Clear Image
                </Button>
              </div>

              <div className="flex flex-col justify-center space-y-4">
                {isScanning && (
                  <div className="flex items-center gap-3 text-primary font-bold">
                    <Sparkles className="w-5 h-5 animate-spin" /> Decoding QR data...
                  </div>
                )}

                {errorMsg && (
                  <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-black">Scan Failed</p>
                      <p className="text-xs font-medium opacity-90 mt-0.5">{errorMsg}</p>
                    </div>
                  </div>
                )}

                {decodedText && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                        <CheckCircle2 className="w-5 h-5" /> Decoded Content
                      </div>
                      <span className="text-[10px] uppercase font-black px-2.5 py-1 rounded-full bg-muted border">
                        {isUrl(decodedText) ? 'Web URL' : 'Plain Text'}
                      </span>
                    </div>

                    <div className="p-5 rounded-2xl bg-card border-2 shadow-inner font-mono text-sm break-all select-all leading-relaxed max-h-48 overflow-y-auto">
                      {decodedText}
                    </div>

                    <div className="flex flex-wrap gap-3 pt-2">
                      <Button onClick={handleCopy} className="rounded-xl font-bold gap-2">
                        <Copy className="w-4 h-4" />
                        {isCopied ? 'Copied!' : 'Copy Content'}
                      </Button>

                      {isUrl(decodedText) && (
                        <Button onClick={handleOpenUrl} variant="default" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold gap-2 shadow-lg shadow-emerald-500/20">
                          <ExternalLink className="w-4 h-4" /> Open Link in Browser
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
