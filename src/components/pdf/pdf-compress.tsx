'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Minimize2, FileText, Download, Loader2, Zap, Info } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import * as pdfjs from 'pdfjs-dist';
import { useToast } from '@/hooks/use-toast';

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function PdfCompress() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const compressPdf = async () => {
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
          toast({ title: "🔒 Protected PDF", description: "This PDF is password-protected and cannot be compressed.", variant: "destructive" });
          return;
        }
        throw loadErr;
      }
      const totalPages = pdf.numPages;
      const newPdf = await PDFDocument.create();

      for (let i = 1; i <= totalPages; i++) {
        const page = await pdf.getPage(i);
        // Scale down for compression (1.2 is a good balance for quality/size)
        const viewport = page.getViewport({ scale: 1.2 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        if (context) {
          await page.render({ canvasContext: context, viewport }).promise;
          // Use high JPEG compression (0.6 - 0.7 for 80-90% reduction)
          const imgData = canvas.toDataURL('image/jpeg', 0.6);
          const imgBytes = await fetch(imgData).then(res => res.arrayBuffer());
          const img = await newPdf.embedJpg(imgBytes);
          
          const newPage = newPdf.addPage([img.width, img.height]);
          newPage.drawImage(img, {
            x: 0,
            y: 0,
            width: img.width,
            height: img.height,
          });
        }
        setProgress(Math.round((i / totalPages) * 100));
      }

      const pdfBytes = await newPdf.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `compressed_pro_${file.name}`;
      link.click();
      
      const oldSize = (file.size / 1024 / 1024).toFixed(2);
      const newSize = (pdfBytes.length / 1024 / 1024).toFixed(2);
      
      toast({ 
        title: "Compression Success", 
        description: `Reduced from ${oldSize}MB to ${newSize}MB. High-efficiency mode active.` 
      });
    } catch (err) {
      console.error(err);
      toast({ title: "Compression failed", variant: "destructive" });
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto border-none shadow-2xl bg-card/80 backdrop-blur-xl">
      <CardHeader className="text-center p-8">
        <div className="mx-auto w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 mb-4">
          <Minimize2 className="w-8 h-8" />
        </div>
        <CardTitle className="text-3xl font-black">Pro PDF Compressor</CardTitle>
        <CardDescription>Industrial-grade compression with up to 90% size reduction.</CardDescription>
      </CardHeader>
      <CardContent className="p-8 space-y-6">
        {!file ? (
          <div className="border-4 border-dashed border-muted rounded-[2rem] p-12 text-center hover:border-blue-500/50 transition-colors relative">
            <input type="file" accept="application/pdf" onChange={(e) => e.target.files && setFile(e.target.files[0])} className="absolute inset-0 opacity-0 cursor-pointer" />
            <Minimize2 className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="font-bold text-muted-foreground">Select PDF to compress</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="p-6 bg-muted/30 rounded-3xl border-2 flex items-center gap-4">
               <FileText className="w-10 h-10 text-blue-500" />
               <div className="flex-1 overflow-hidden">
                  <p className="font-black truncate">{file.name}</p>
                  <p className="text-xs font-bold text-muted-foreground">Original: {(file.size / 1024 / 1024).toFixed(2)} MB</p>
               </div>
            </div>

            <div className="flex items-start gap-2 p-4 bg-blue-500/5 rounded-2xl text-[11px] text-muted-foreground font-medium leading-tight">
               <Info className="w-4 h-4 text-blue-500 shrink-0" />
               <p>Our Pro mode re-encodes pages with high-efficiency JPEG compression to achieve maximum size reduction while preserving readability.</p>
            </div>

            {isProcessing && (
              <div className="w-full bg-muted rounded-full h-4 overflow-hidden relative border-2">
                <div className="bg-blue-500 h-full transition-all duration-300" style={{ width: `${progress}%` }} />
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-white mix-blend-difference">{progress}%</span>
              </div>
            )}

            <Button 
              className="w-full h-16 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-lg gap-2 shadow-xl"
              disabled={isProcessing}
              onClick={compressPdf}
            >
              {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : <Zap className="w-6 h-6" />}
              START COMPRESSION
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
