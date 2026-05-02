'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Scissors, FileText, Download, Loader2, Info, LayoutGrid, FileStack } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { useToast } from '@/hooks/use-toast';
import JSZip from 'jszip';

export default function PdfSplitter() {
  const [file, setFile] = useState<File | null>(null);
  const [range, setRange] = useState('');
  const [splitAll, setSplitAll] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const splitPdf = async () => {
    if (!file || (!range && !splitAll)) {
      toast({ title: "Input required", description: "Please enter a page range or select 'Split all pages'.", variant: "destructive" });
      return;
    }

    setIsProcessing(true);
    try {
      const fileBytes = await file.arrayBuffer();
      const pdf = await PDFDocument.load(fileBytes);
      const totalPages = pdf.getPageCount();
      const zip = new JSZip();
      
      if (splitAll) {
        for (let i = 0; i < totalPages; i++) {
          const newPdf = await PDFDocument.create();
          const [page] = await newPdf.copyPages(pdf, [i]);
          newPdf.addPage(page);
          const pdfBytes = await newPdf.save();
          zip.file(`page_${i + 1}.pdf`, pdfBytes);
        }
        const content = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(content);
        const link = document.createElement('a');
        link.href = url;
        link.download = `split_all_${file.name.replace('.pdf', '')}.zip`;
        link.click();
      } else {
        const ranges = range.split(',').map(r => r.trim()).filter(r => r.length > 0);
        
        if (ranges.length === 1 && !ranges[0].includes('-') && !ranges[0].includes(',')) {
          // Simple single page extract
          const pageNum = Number(ranges[0]);
          if (isNaN(pageNum) || pageNum < 1 || pageNum > totalPages) throw new Error("Invalid page number");
          
          const newPdf = await PDFDocument.create();
          const [page] = await newPdf.copyPages(pdf, [pageNum - 1]);
          newPdf.addPage(page);
          const pdfBytes = await newPdf.save();
          const blob = new Blob([pdfBytes], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `page_${pageNum}_${file.name}`;
          link.click();
        } else if (ranges.length === 1) {
          // Single complex range (e.g. 1-5 or 1,3,5) into ONE file
          const pagesToExtract: number[] = [];
          const parts = ranges[0].split('-').map(Number);
          if (parts.length === 2) {
             for (let i = parts[0]; i <= parts[1]; i++) {
                if (i >= 1 && i <= totalPages) pagesToExtract.push(i - 1);
             }
          } else {
             const p = Number(ranges[0]);
             if (!isNaN(p) && p >= 1 && p <= totalPages) pagesToExtract.push(p - 1);
          }

          const newPdf = await PDFDocument.create();
          const copiedPages = await newPdf.copyPages(pdf, pagesToExtract);
          copiedPages.forEach(p => newPdf.addPage(p));
          const pdfBytes = await newPdf.save();
          const blob = new Blob([pdfBytes], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `split_${file.name}`;
          link.click();
        } else {
          // MULTIPLE RANGES -> Multiple files in a ZIP
          for (let idx = 0; idx < ranges.length; idx++) {
            const r = ranges[idx];
            const pagesToExtract: number[] = [];
            if (r.includes('-')) {
              const [start, end] = r.split('-').map(Number);
              for (let i = start; i <= end; i++) {
                if (i >= 1 && i <= totalPages) pagesToExtract.push(i - 1);
              }
            } else {
              const p = Number(r);
              if (!isNaN(p) && p >= 1 && p <= totalPages) pagesToExtract.push(p - 1);
            }

            if (pagesToExtract.length > 0) {
              const newPdf = await PDFDocument.create();
              const copiedPages = await newPdf.copyPages(pdf, pagesToExtract);
              copiedPages.forEach(p => newPdf.addPage(p));
              const pdfBytes = await newPdf.save();
              zip.file(`split_part_${idx + 1}_pages_${r}.pdf`, pdfBytes);
            }
          }
          
          const content = await zip.generateAsync({ type: 'blob' });
          const url = URL.createObjectURL(content);
          const link = document.createElement('a');
          link.href = url;
          link.download = `multiple_splits_${file.name.replace('.pdf', '')}.zip`;
          link.click();
        }
      }
      
      toast({ title: "Success", description: "PDF split successfully!" });
    } catch (err: any) {
      toast({ title: "Split failed", description: err.message || "Invalid range or file.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto border-none shadow-2xl bg-card/80 backdrop-blur-xl">
      <CardHeader className="text-center p-8">
        <div className="mx-auto w-16 h-16 bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-500 mb-4">
          <Scissors className="w-8 h-8" />
        </div>
        <CardTitle className="text-3xl font-black">PDF Splitter & Extractor</CardTitle>
        <CardDescription>Extract pages or split into multiple separate files.</CardDescription>
      </CardHeader>
      <CardContent className="p-8 space-y-8">
        {!file ? (
          <div className="border-4 border-dashed border-muted rounded-[2rem] p-12 text-center hover:border-orange-500/50 transition-colors relative">
            <input type="file" accept="application/pdf" onChange={handleFileSelect} className="absolute inset-0 opacity-0 cursor-pointer" />
            <Scissors className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="font-bold text-muted-foreground">Click to select PDF to split</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="p-6 bg-muted/30 rounded-3xl border-2 flex items-center gap-4">
               <FileText className="w-10 h-10 text-orange-500" />
               <div className="flex-1 overflow-hidden">
                  <p className="font-black truncate">{file.name}</p>
                  <Button variant="link" onClick={() => setFile(null)} className="p-0 h-auto text-xs text-rose-500 font-bold uppercase">Change File</Button>
               </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3 bg-muted/20 p-4 rounded-2xl border-2">
                <Checkbox id="split-all-new" checked={splitAll} onCheckedChange={(v) => setSplitAll(!!v)} className="w-5 h-5" />
                <Label htmlFor="split-all-new" className="text-sm font-black flex items-center gap-2 cursor-pointer">
                  <LayoutGrid className="w-4 h-4 text-orange-500" />
                  Split every page into a separate file
                </Label>
              </div>

              {!splitAll && (
                <div className="space-y-3">
                  <div className="flex justify-between items-end">
                    <label className="text-sm font-black uppercase tracking-widest text-primary/60">Page Ranges</label>
                    <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full flex items-center gap-1">
                      <FileStack className="w-3 h-3" /> Creates multiple files
                    </span>
                  </div>
                  <Input 
                    placeholder="e.g. 1-3, 5, 10-15" 
                    value={range} 
                    onChange={(e) => setRange(e.target.value)}
                    className="h-14 rounded-2xl border-2 font-mono text-lg px-6"
                  />
                  <div className="flex items-start gap-2 p-4 bg-orange-500/5 rounded-2xl text-[10px] text-muted-foreground font-medium leading-tight">
                     <Info className="w-4 h-4 text-orange-500 shrink-0" />
                     <p>Use commas to create <strong>separate PDF files</strong> (e.g. 1-3, 5 will download 2 files). Individual pages or ranges are supported.</p>
                  </div>
                </div>
              )}
            </div>

            <Button 
              className="w-full h-16 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-black text-lg gap-2 shadow-xl"
              disabled={(!range && !splitAll) || isProcessing}
              onClick={splitPdf}
            >
              {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : <Download className="w-6 h-6" />}
              {splitAll ? 'SPLIT ALL AND DOWNLOAD ZIP' : range.includes(',') ? 'EXTRACT MULTIPLE FILES (ZIP)' : 'EXTRACT PAGES'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
