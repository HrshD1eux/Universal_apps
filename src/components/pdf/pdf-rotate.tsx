'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RefreshCw, RotateCw, Download, Loader2, Info, FileText } from 'lucide-react';
import { PDFDocument, degrees } from 'pdf-lib';
import { useToast } from '@/hooks/use-toast';

export default function PdfRotate() {
  const [file, setFile] = useState<File | null>(null);
  const [range, setRange] = useState('');
  const [angle, setAngle] = useState(90);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const rotatePdf = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const totalPages = pdfDoc.getPageCount();
      const pages = pdfDoc.getPages();

      const toRotate = new Set<number>();
      if (!range) {
        // Rotate all pages
        for (let i = 1; i <= totalPages; i++) toRotate.add(i);
      } else {
        const parts = range.split(',').map(p => p.trim());
        for (const part of parts) {
          if (part.includes('-')) {
            const [start, end] = part.split('-').map(Number);
            for (let i = start; i <= end; i++) {
              if (i >= 1 && i <= totalPages) toRotate.add(i);
            }
          } else {
            const p = Number(part);
            if (p >= 1 && p <= totalPages) toRotate.add(p);
          }
        }
      }

      for (const pageNum of toRotate) {
        const page = pages[pageNum - 1];
        const currentRotation = page.getRotation().angle;
        page.setRotation(degrees((currentRotation + angle) % 360));
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `rotated_${file.name}`;
      link.click();
      
      toast({ title: "Rotated!", description: `Successfully rotated ${toRotate.size} pages.` });
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto border-none shadow-2xl bg-card/80 backdrop-blur-xl">
      <CardHeader className="text-center p-8">
        <div className="mx-auto w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 mb-4">
          <RotateCw className="w-8 h-8" />
        </div>
        <CardTitle className="text-3xl font-black">PDF Page Rotator</CardTitle>
        <CardDescription>Fix orientations and rotate specific pages.</CardDescription>
      </CardHeader>
      <CardContent className="p-8 space-y-8">
        {!file ? (
          <div className="border-4 border-dashed border-muted rounded-[2rem] p-12 text-center hover:border-emerald-500/50 transition-colors relative">
            <input type="file" accept="application/pdf" onChange={(e) => e.target.files && setFile(e.target.files[0])} className="absolute inset-0 opacity-0 cursor-pointer" />
            <RefreshCw className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="font-bold text-muted-foreground">Select PDF to rotate</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="p-4 bg-muted/30 rounded-2xl border-2 flex items-center gap-3">
               <FileText className="w-8 h-8 text-emerald-500" />
               <span className="font-bold truncate text-sm flex-1">{file.name}</span>
               <Button variant="ghost" onClick={() => setFile(null)} className="text-xs text-rose-500 font-bold uppercase">Change</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Rotation Angle</label>
                 <div className="grid grid-cols-3 gap-2">
                    {[90, 180, 270].map(a => (
                      <Button key={a} variant={angle === a ? 'default' : 'outline'} onClick={() => setAngle(a)} className="rounded-xl font-bold">{a}°</Button>
                    ))}
                 </div>
               </div>

               <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Page Selection</label>
                 <Input 
                   placeholder="e.g. 1, 3-5 (Empty for all)" 
                   value={range} 
                   onChange={(e) => setRange(e.target.value)} 
                   className="h-12 rounded-xl border-2 font-mono"
                 />
               </div>
            </div>

            <Button 
              className="w-full h-16 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-lg gap-2 shadow-xl shadow-emerald-600/20"
              disabled={isProcessing}
              onClick={rotatePdf}
            >
              {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : <RotateCw className="w-6 h-6" />}
              ROTATE & DOWNLOAD
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
