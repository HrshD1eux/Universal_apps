'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LockOpen, Unlock, Loader2, Eye, EyeOff, FileKey, FileText, ShieldOff, CheckCircle } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import * as pdfjs from 'pdfjs-dist';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/language-context';

pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

export default function PdfUnlock() {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();
  const { t } = useLanguage();

  const unlockPdf = async () => {
    if (!file || !password) return;
    setIsProcessing(true);
    setProgress(0);

    try {
      const arrayBuffer = await file.arrayBuffer();

      // Step 1: Open the encrypted PDF with the password using pdf.js
      // If the password is wrong, this will throw a PasswordException
      let pdf;
      try {
        pdf = await pdfjs.getDocument({
          data: new Uint8Array(arrayBuffer),
          password: password
        }).promise;
      } catch (loadErr: any) {
        if (loadErr?.name === 'PasswordException' || loadErr?.message?.includes('password')) {
          toast({
            title: "Wrong Password",
            description: "The password you entered is incorrect. Please try again.",
            variant: "destructive"
          });
          return;
        }
        throw loadErr;
      }

      const totalPages = pdf.numPages;

      // Step 2: Rebuild the PDF from scratch — render every page to canvas,
      // then embed as an image in a brand new, completely unencrypted PDF.
      // This guarantees NO encryption dictionary remains in the output.
      const newPdf = await PDFDocument.create();

      for (let i = 1; i <= totalPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 }); // 2x for high quality
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        if (ctx) {
          await page.render({ canvasContext: ctx, viewport }).promise;

          const blob = await new Promise<Blob | null>(resolve =>
            canvas.toBlob(resolve, 'image/jpeg', 0.92) // High quality JPEG
          );
          if (!blob) throw new Error(`Failed to render page ${i}`);

          const imgBytes = await blob.arrayBuffer();
          const img = await newPdf.embedJpg(imgBytes);

          const origVp = page.getViewport({ scale: 1.0 });
          const newPage = newPdf.addPage([origVp.width, origVp.height]);
          newPage.drawImage(img, {
            x: 0,
            y: 0,
            width: origVp.width,
            height: origVp.height,
          });
        }

        // Free canvas memory
        canvas.width = 0;
        canvas.height = 0;
        setProgress(Math.round((i / totalPages) * 100));
      }

      // Step 3: Save the brand new, clean PDF — zero encryption
      const pdfBytes = await newPdf.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `unlocked_${file.name}`;
      link.click();

      toast({
        title: "🔓 Password Removed!",
        description: "PDF is now completely unlocked — no password, no restrictions."
      });
    } catch (err: any) {
      console.error('Unlock error:', err);
      toast({
        title: "Unlock Failed",
        description: err?.message || "An error occurred while processing the PDF.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto border-none shadow-2xl bg-card/80 backdrop-blur-xl overflow-hidden">
      <CardHeader className="bg-blue-500/10 border-b border-blue-500/20 p-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-500 text-white rounded-2xl shadow-lg shadow-blue-500/30">
            <LockOpen className="w-8 h-8" />
          </div>
          <div>
            <CardTitle className="text-3xl font-black tracking-tight">{t('pdf_unlock_title' as any)}</CardTitle>
            <CardDescription className="text-blue-700 dark:text-blue-300 font-bold">{t('pdf_unlock_desc' as any)}</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-8 space-y-6">
        {!file ? (
          <div className="border-4 border-dashed border-muted rounded-[2.5rem] p-16 text-center hover:border-blue-500/50 transition-all hover:bg-blue-500/5 group relative">
            <input type="file" accept="application/pdf" onChange={(e) => e.target.files && setFile(e.target.files[0])} className="absolute inset-0 opacity-0 cursor-pointer" />
            <Unlock className="w-16 h-16 text-muted-foreground mx-auto mb-6 group-hover:scale-110 transition-transform opacity-30" />
            <p className="text-xl font-black text-muted-foreground">Drop protected PDF here</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* File Info */}
            <div className="p-6 bg-muted/30 rounded-3xl border-2 flex items-center gap-4">
              <FileKey className="w-10 h-10 text-blue-500" />
              <div className="flex-1 overflow-hidden">
                <p className="font-black truncate">{file.name}</p>
                <Button variant="link" onClick={() => { setFile(null); setPassword(''); }} className="p-0 h-auto text-[10px] text-rose-500 font-black uppercase tracking-widest">Change File</Button>
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-blue-600">🔑 Enter Current Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter the password to unlock..."
                  className="h-14 rounded-2xl border-2 border-blue-500/30 pr-12 pl-4 font-bold text-lg focus:border-blue-500"
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-blue-500 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-[10px] font-bold text-muted-foreground">Enter the password that was used to protect this PDF.</p>
            </div>

            {/* What Happens */}
            <div className="p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10 space-y-2">
              <p className="font-black text-sm text-blue-600">What this tool does:</p>
              <div className="space-y-1">
                {[
                  'Opens the PDF with your password',
                  'Rebuilds every page from scratch',
                  'Saves a brand new PDF with ZERO encryption',
                  'No password needed to open the new file'
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-blue-500 shrink-0" />
                    <span className="text-[10px] font-bold text-muted-foreground">{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Progress */}
            {isProcessing && (
              <div className="w-full bg-muted rounded-full h-4 overflow-hidden relative border-2">
                <div className="bg-blue-500 h-full transition-all duration-300 ease-out" style={{ width: `${progress}%` }} />
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-white mix-blend-difference">{progress}%</span>
              </div>
            )}

            <Button
              className="w-full h-16 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-lg gap-2 shadow-xl shadow-blue-600/20 disabled:opacity-40"
              disabled={!password || isProcessing}
              onClick={unlockPdf}
            >
              {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : <ShieldOff className="w-6 h-6" />}
              {isProcessing ? 'REMOVING PASSWORD...' : 'REMOVE PASSWORD & DOWNLOAD'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
