'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FilePlus, Trash2, ArrowUp, ArrowDown, Download, FileText, Loader2 } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { useToast } from '@/hooks/use-toast';

export default function PdfMerger() {
  const [files, setFiles] = useState<{ id: string, name: string, file: File }[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        file
      }));
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const moveFile = (index: number, direction: 'up' | 'down') => {
    const newFiles = [...files];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < newFiles.length) {
      [newFiles[index], newFiles[targetIndex]] = [newFiles[targetIndex], newFiles[index]];
      setFiles(newFiles);
    }
  };

  const mergePdfs = async () => {
    if (files.length < 2) {
      toast({ title: "Min 2 files required", description: "Please add at least two PDF files to merge.", variant: "destructive" });
      return;
    }

    setIsProcessing(true);
    try {
      const mergedPdf = await PDFDocument.create();
      
      for (const item of files) {
        const fileBytes = await item.file.arrayBuffer();
        const pdf = await PDFDocument.load(fileBytes);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      const mergedPdfBytes = await mergedPdf.save();
      const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `merged_${new Date().getTime()}.pdf`;
      link.click();
      
      toast({ title: "Success", description: "PDFs merged successfully!" });
    } catch (err) {
      console.error(err);
      toast({ title: "Merge failed", description: "There was an error merging your files.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="max-w-3xl mx-auto border-none shadow-2xl bg-card/80 backdrop-blur-xl">
      <CardHeader className="text-center p-8">
        <div className="mx-auto w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 mb-4">
          <FilePlus className="w-8 h-8" />
        </div>
        <CardTitle className="text-3xl font-black">PDF Merger</CardTitle>
        <CardDescription>Combine multiple PDF documents into a single file.</CardDescription>
      </CardHeader>
      <CardContent className="p-8 space-y-6">
        <div className="border-4 border-dashed border-muted rounded-[2rem] p-8 text-center hover:border-red-500/50 transition-colors relative">
          <input 
            type="file" 
            multiple 
            accept="application/pdf" 
            onChange={handleFileSelect}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
          <FilePlus className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="font-bold text-muted-foreground">Click or Drag PDFs here to add</p>
        </div>

        {files.length > 0 && (
          <div className="space-y-3">
            {files.map((file, index) => (
              <div key={file.id} className="flex items-center gap-4 p-4 bg-muted/30 rounded-2xl border-2 transition-all hover:bg-muted/50">
                <FileText className="w-6 h-6 text-red-500 shrink-0" />
                <span className="flex-1 font-bold truncate text-sm">{file.name}</span>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" disabled={index === 0} onClick={() => moveFile(index, 'up')} className="h-8 w-8">
                    <ArrowUp className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" disabled={index === files.length - 1} onClick={() => moveFile(index, 'down')} className="h-8 w-8">
                    <ArrowDown className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => removeFile(file.id)} className="h-8 w-8 text-rose-500">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Button 
          className="w-full h-16 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-lg gap-2 shadow-xl"
          disabled={files.length < 2 || isProcessing}
          onClick={mergePdfs}
        >
          {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : <Download className="w-6 h-6" />}
          MERGE AND DOWNLOAD
        </Button>
      </CardContent>
    </Card>
  );
}
