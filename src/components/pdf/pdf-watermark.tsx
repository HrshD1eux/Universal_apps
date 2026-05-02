'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Stamp, FileText, Download, Loader2, Type, Sliders, Image as ImageIcon, X } from 'lucide-react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { useToast } from '@/hooks/use-toast';

export default function PdfWatermark() {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<'text' | 'image'>('text');
  const [text, setText] = useState('CONFIDENTIAL');
  const [image, setImage] = useState<string | null>(null);
  const [opacity, setOpacity] = useState(0.3);
  const [scale, setScale] = useState(1.0);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => setImage(event.target?.result as string);
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const addWatermark = async () => {
    if (!file || (mode === 'text' && !text) || (mode === 'image' && !image)) return;
    setIsProcessing(true);
    try {
      const existingPdfBytes = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const pages = pdfDoc.getPages();

      let watermarkImage: any = null;
      if (mode === 'image' && image) {
        const imgBytes = await fetch(image).then(res => res.arrayBuffer());
        watermarkImage = image.includes('png') ? await pdfDoc.embedPng(imgBytes) : await pdfDoc.embedJpg(imgBytes);
      }

      for (const page of pages) {
        const { width, height } = page.getSize();
        
        if (mode === 'text') {
          page.drawText(text, {
            x: width / 2 - (text.length * 15),
            y: height / 2,
            size: 60 * scale,
            font: helveticaFont,
            color: rgb(0.5, 0.5, 0.5),
            opacity: opacity,
            rotate: { type: 'degrees', angle: 45 } as any,
          });
        } else if (watermarkImage) {
          const imgWidth = watermarkImage.width * 0.5 * scale;
          const imgHeight = watermarkImage.height * 0.5 * scale;
          page.drawImage(watermarkImage, {
            x: width / 2 - imgWidth / 2,
            y: height / 2 - imgHeight / 2,
            width: imgWidth,
            height: imgHeight,
            opacity: opacity,
          });
        }
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `watermarked_${file.name}`;
      link.click();
      toast({ title: "Success", description: "Watermark applied to all pages!" });
    } catch (err) {
      toast({ title: "Failed", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto border-none shadow-2xl bg-card/80 backdrop-blur-xl">
      <CardHeader className="text-center p-8">
        <div className="mx-auto w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-500 mb-4">
          <Stamp className="w-8 h-8" />
        </div>
        <CardTitle className="text-3xl font-black">PDF Watermark</CardTitle>
        <CardDescription>Secure your documents with text or image watermarks.</CardDescription>
      </CardHeader>
      <CardContent className="p-8 space-y-6">
        {!file ? (
          <div className="border-4 border-dashed border-muted rounded-[2rem] p-12 text-center hover:border-purple-500/50 transition-colors relative">
            <input type="file" accept="application/pdf" onChange={(e) => e.target.files && setFile(e.target.files[0])} className="absolute inset-0 opacity-0 cursor-pointer" />
            <Stamp className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="font-bold text-muted-foreground">Select PDF to watermark</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="p-4 bg-muted/30 rounded-2xl border-2 flex items-center gap-3">
               <FileText className="w-8 h-8 text-purple-500" />
               <span className="font-bold truncate text-sm flex-1">{file.name}</span>
               <Button variant="ghost" onClick={() => setFile(null)} className="text-xs text-rose-500 font-bold uppercase">Change</Button>
            </div>

            <Tabs value={mode} onValueChange={(v) => setMode(v as any)} className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-12 rounded-xl p-1 bg-muted">
                <TabsTrigger value="text" className="rounded-lg font-bold gap-2"><Type className="w-4 h-4" /> Text</TabsTrigger>
                <TabsTrigger value="image" className="rounded-lg font-bold gap-2"><ImageIcon className="w-4 h-4" /> Image</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
              {mode === 'text' ? (
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Watermark Text</label>
                  <Input value={text} onChange={(e) => setText(e.target.value)} className="h-12 rounded-xl font-bold" />
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Watermark Image</label>
                  {image ? (
                    <div className="relative w-full h-12 border-2 rounded-xl overflow-hidden group">
                       <img src={image} className="w-full h-full object-contain bg-white" />
                       <Button size="icon" variant="destructive" className="absolute top-1 right-1 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setImage(null)}><X className="w-3 h-3" /></Button>
                    </div>
                  ) : (
                    <label className="flex items-center justify-center h-12 border-2 border-dashed rounded-xl cursor-pointer hover:bg-purple-50/50 transition-colors">
                      <ImageIcon className="w-4 h-4 text-purple-500 mr-2" />
                      <span className="text-xs font-bold">Upload Image</span>
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>
                  )}
                </div>
              )}
              
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Opacity & Scale</label>
                <div className="flex flex-col gap-2">
                   <div className="flex items-center gap-3">
                     <Sliders className="w-4 h-4 text-purple-500" />
                     <input type="range" min="0.1" max="1" step="0.1" value={opacity} onChange={(e) => setOpacity(Number(e.target.value))} className="flex-1" />
                     <span className="text-[10px] font-black w-8">{Math.round(opacity * 100)}%</span>
                   </div>
                   <div className="flex items-center gap-3">
                     <Sliders className="w-4 h-4 text-purple-500" />
                     <input type="range" min="0.5" max="3" step="0.1" value={scale} onChange={(e) => setScale(Number(e.target.value))} className="flex-1" />
                     <span className="text-[10px] font-black w-8">{scale}x</span>
                   </div>
                </div>
              </div>
            </div>

            <Button 
              className="w-full h-16 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black text-lg gap-2 shadow-xl"
              disabled={isProcessing}
              onClick={addWatermark}
            >
              {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : <Download className="w-6 h-6" />}
              APPLY WATERMARK
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
