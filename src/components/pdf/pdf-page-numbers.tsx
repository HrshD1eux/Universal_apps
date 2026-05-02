'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileDigit, FileText, Download, Loader2 } from 'lucide-react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { useToast } from '@/hooks/use-toast';

export default function PdfPageNumbers() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const addPageNumbers = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const existingPdfBytes = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const pages = pdfDoc.getPages();

      pages.forEach((page, index) => {
        const { width, height } = page.getSize();
        page.drawText(`${index + 1} / ${pages.length}`, {
          x: width / 2 - 20,
          y: 20,
          size: 10,
          font: helveticaFont,
          color: rgb(0.5, 0.5, 0.5),
        });
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `numbered_${file.name}`;
      link.click();
      toast({ title: "Success", description: "Page numbers added successfully!" });
    } catch (err) {
      toast({ title: "Failed", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto border-none shadow-2xl bg-card/80 backdrop-blur-xl">
      <CardHeader className="text-center p-8">
        <div className="mx-auto w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-500 mb-4">
          <FileDigit className="w-8 h-8" />
        </div>
        <CardTitle className="text-3xl font-black">Add Page Numbers</CardTitle>
        <CardDescription>Automatically add page numbers to the bottom of every page.</CardDescription>
      </CardHeader>
      <CardContent className="p-8 space-y-6">
        {!file ? (
          <div className="border-4 border-dashed border-muted rounded-[2rem] p-12 text-center hover:border-indigo-500/50 transition-colors relative">
            <input type="file" accept="application/pdf" onChange={(e) => e.target.files && setFile(e.target.files[0])} className="absolute inset-0 opacity-0 cursor-pointer" />
            <FileDigit className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="font-bold text-muted-foreground">Select PDF to number</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="p-4 bg-muted/30 rounded-2xl border-2 flex items-center gap-3">
               <FileText className="w-8 h-8 text-indigo-500" />
               <span className="font-bold truncate text-sm flex-1">{file.name}</span>
               <Button variant="ghost" onClick={() => setFile(null)} className="text-xs text-rose-500 font-bold uppercase">Change</Button>
            </div>
            <Button 
              className="w-full h-16 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg gap-2 shadow-xl"
              disabled={isProcessing}
              onClick={addPageNumbers}
            >
              {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : <Download className="w-6 h-6" />}
              ADD NUMBERS & DOWNLOAD
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
