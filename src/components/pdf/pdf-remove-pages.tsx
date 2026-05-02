'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, FileText, Download, Loader2, Info } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { useToast } from '@/hooks/use-toast';

export default function PdfRemovePages() {
  const [file, setFile] = useState<File | null>(null);
  const [pagesToRemove, setPagesToRemove] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const removePages = async () => {
    if (!file || !pagesToRemove) return;
    setIsProcessing(true);
    try {
      const existingPdfBytes = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const totalPages = pdfDoc.getPageCount();
      
      const toRemove = new Set<number>();
      const parts = pagesToRemove.split(',').map(p => p.trim());
      
      for (const part of parts) {
        if (part.includes('-')) {
          const [start, end] = part.split('-').map(Number);
          if (!isNaN(start) && !isNaN(end)) {
            for (let i = start; i <= end; i++) {
              if (i >= 1 && i <= totalPages) toRemove.add(i);
            }
          }
        } else {
          const p = Number(part);
          if (!isNaN(p) && p >= 1 && p <= totalPages) toRemove.add(p);
        }
      }

      if (toRemove.size === 0) throw new Error("No valid pages selected for removal.");
      if (toRemove.size >= totalPages) throw new Error("Cannot remove all pages from the PDF.");

      const pagesToKeep: number[] = [];
      for (let i = 1; i <= totalPages; i++) {
        if (!toRemove.has(i)) {
          pagesToKeep.push(i - 1); // 0-indexed for copyPages
        }
      }

      const newPdf = await PDFDocument.create();
      const copiedPages = await newPdf.copyPages(pdfDoc, pagesToKeep);
      copiedPages.forEach(p => newPdf.addPage(p));

      const pdfBytes = await newPdf.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `pages_removed_${file.name}`;
      link.click();
      toast({ title: "Success", description: `${toRemove.size} pages removed successfully!` });
    } catch (err: any) {
      toast({ title: "Failed", description: err.message || "Error processing file.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto border-none shadow-2xl bg-card/80 backdrop-blur-xl">
      <CardHeader className="text-center p-8">
        <div className="mx-auto w-16 h-16 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-500 mb-4">
          <Trash2 className="w-8 h-8" />
        </div>
        <CardTitle className="text-3xl font-black">Remove Pages</CardTitle>
        <CardDescription>Delete specific pages or ranges from your PDF file.</CardDescription>
      </CardHeader>
      <CardContent className="p-8 space-y-6">
        {!file ? (
          <div className="border-4 border-dashed border-muted rounded-[2rem] p-12 text-center hover:border-rose-500/50 transition-colors relative">
            <input type="file" accept="application/pdf" onChange={(e) => e.target.files && setFile(e.target.files[0])} className="absolute inset-0 opacity-0 cursor-pointer" />
            <Trash2 className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="font-bold text-muted-foreground">Select PDF to edit</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="p-4 bg-muted/30 rounded-2xl border-2 flex items-center gap-3">
               <FileText className="w-8 h-8 text-rose-500" />
               <div className="flex-1 overflow-hidden">
                  <span className="font-black truncate block">{file.name}</span>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Ready to edit</span>
               </div>
               <Button variant="ghost" onClick={() => setFile(null)} className="text-xs text-rose-500 font-bold uppercase">Change</Button>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Pages to Remove</label>
              <Input placeholder="e.g. 1, 3-5, 10" value={pagesToRemove} onChange={(e) => setPagesToRemove(e.target.value)} className="h-14 rounded-2xl border-2 font-mono text-lg px-6 focus-visible:ring-rose-500" />
              <div className="flex items-start gap-2 p-4 bg-rose-500/5 rounded-2xl text-[10px] text-muted-foreground font-medium leading-tight">
                 <Info className="w-4 h-4 text-rose-500 shrink-0" />
                 <p>Enter individual pages (1, 3) or ranges (3-5). We'll keep all other pages in their original order.</p>
              </div>
            </div>
            <Button 
              className="w-full h-16 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-lg gap-2 shadow-xl shadow-rose-600/20"
              disabled={!pagesToRemove || isProcessing}
              onClick={removePages}
            >
              {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : <Trash2 className="w-6 h-6" />}
              REMOVE SELECTED PAGES
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
