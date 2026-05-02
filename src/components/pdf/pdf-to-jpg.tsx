'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { FileImage, FileText, Download, Loader2, Sparkles, FolderArchive, Info } from 'lucide-react';
import * as pdfjs from 'pdfjs-dist';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/language-context';
import JSZip from 'jszip';

pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

export default function PdfToJpg() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadAsZip, setDownloadAsZip] = useState(true);
  const [range, setRange] = useState(''); // Empty means all pages
  const { toast } = useToast();
  const { t } = useLanguage();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const convertToImages = async () => {
    if (!file) return;
    setIsProcessing(true);
    setProgress(0);

    try {
      const arrayBuffer = await file.arrayBuffer();
      
      // Attempt to load the PDF — if it's password-protected, pdfjs will throw
      let pdf;
      try {
        pdf = await pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
      } catch (loadErr: any) {
        if (loadErr?.name === 'PasswordException' || loadErr?.message?.includes('password')) {
          toast({ 
            title: "🔒 Protected PDF Detected", 
            description: "This PDF is password-protected and cannot be converted. Remove the password first using the PDF Unlock tool.", 
            variant: "destructive" 
          });
          return;
        }
        throw loadErr;
      }
      const totalPages = pdf.numPages;
      
      const pagesToProcess: number[] = [];
      if (!range) {
        for (let i = 1; i <= totalPages; i++) pagesToProcess.push(i);
      } else {
        const parts = range.split(',').map(p => p.trim());
        for (const part of parts) {
          if (part.includes('-')) {
            const [start, end] = part.split('-').map(Number);
            for (let i = start; i <= end; i++) {
              if (i >= 1 && i <= totalPages) pagesToProcess.push(i);
            }
          } else {
            const p = Number(part);
            if (p >= 1 && p <= totalPages) pagesToProcess.push(p);
          }
        }
      }

      if (pagesToProcess.length === 0) throw new Error("No valid pages selected.");

      const zip = downloadAsZip ? new JSZip() : null;

      for (let i = 0; i < pagesToProcess.length; i++) {
        const pageNum = pagesToProcess[i];
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2.0 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        if (context) {
          await page.render({ canvasContext: context, viewport }).promise;
          const imgData = canvas.toDataURL('image/jpeg', 0.8);
          
          if (zip) {
            const base64Data = imgData.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");
            zip.file(`page_${pageNum}.jpg`, base64Data, { base64: true });
          } else {
            const link = document.createElement('a');
            link.href = imgData;
            link.download = `page_${pageNum}.jpg`;
            link.click();
          }
          
          setProgress(Math.round(((i + 1) / pagesToProcess.length) * 100));
        }
      }

      if (zip) {
        const content = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(content);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${file.name.replace('.pdf', '')}_images.zip`;
        link.click();
      }

      toast({ title: "Success", description: `Converted ${pagesToProcess.length} pages.` });
    } catch (err: any) {
      console.error(err);
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto border-none shadow-2xl bg-card/80 backdrop-blur-xl">
      <CardHeader className="text-center p-8">
        <div className="mx-auto w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 mb-4">
          <FileImage className="w-8 h-8" />
        </div>
        <CardTitle className="text-3xl font-black">{t('pdf_pdf_to_jpg_title' as any)}</CardTitle>
        <CardDescription>{t('pdf_pdf_to_jpg_desc' as any)}</CardDescription>
      </CardHeader>
      <CardContent className="p-8 space-y-6">
        {!file ? (
          <div className="border-4 border-dashed border-muted rounded-[2rem] p-12 text-center hover:border-emerald-500/50 transition-colors relative">
            <input type="file" accept="application/pdf" onChange={handleFileSelect} className="absolute inset-0 opacity-0 cursor-pointer" />
            <FileImage className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="font-bold text-muted-foreground">Select PDF to convert</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="p-4 bg-muted/30 rounded-2xl border-2 flex items-center gap-3">
               <FileText className="w-8 h-8 text-emerald-500" />
               <div className="flex-1 overflow-hidden">
                  <span className="font-black truncate block">{file.name}</span>
                  <span className="text-[10px] font-bold text-muted-foreground">Ready for conversion</span>
               </div>
               <Button variant="ghost" onClick={() => setFile(null)} className="text-xs text-rose-500 font-bold uppercase">Change</Button>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Page Selection</label>
              <Input 
                placeholder="e.g. 1, 3-5 (Leave empty for all)" 
                value={range} 
                onChange={(e) => setRange(e.target.value)}
                className="h-12 rounded-xl border-2 font-mono"
              />
              <p className="text-[9px] text-muted-foreground font-bold">Specify pages or ranges to convert only those parts.</p>
            </div>

            <div className="flex items-center space-x-3 bg-muted/20 p-4 rounded-2xl border-2">
              <Checkbox id="zip-download-jpg" checked={downloadAsZip} onCheckedChange={(v) => setDownloadAsZip(!!v)} className="w-5 h-5" />
              <Label htmlFor="zip-download-jpg" className="text-sm font-black flex items-center gap-2 cursor-pointer">
                <FolderArchive className="w-4 h-4 text-emerald-500" />
                Bundle as ZIP Archive
              </Label>
            </div>

            {isProcessing && (
              <div className="w-full bg-muted rounded-full h-4 overflow-hidden relative border-2">
                <div className="bg-emerald-500 h-full transition-all duration-300" style={{ width: `${progress}%` }} />
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-white mix-blend-difference">{progress}%</span>
              </div>
            )}

            <Button 
              className="w-full h-16 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-lg gap-2 shadow-xl"
              disabled={isProcessing}
              onClick={convertToImages}
            >
              {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6" />}
              CONVERT AND DOWNLOAD
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
