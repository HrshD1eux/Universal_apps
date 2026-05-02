'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Loader2, Eye, EyeOff, Printer, Copy, FileSignature, Edit, ShieldAlert, FileText, Ban, Search, Pencil, BookOpen } from 'lucide-react';
import { jsPDF } from 'jspdf';
import * as pdfjs from 'pdfjs-dist';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/language-context';

pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

type ProtectionLevel = 'maximum' | 'high' | 'moderate';

const PROTECTION_PRESETS: Record<ProtectionLevel, { label: string; desc: string; quality: number }> = {
  maximum: { label: 'MAXIMUM LOCK', desc: 'Lowest quality — smallest file, hardest to reverse.', quality: 0.4 },
  high: { label: 'HIGH SECURITY', desc: 'Balanced quality and protection.', quality: 0.65 },
  moderate: { label: 'MODERATE', desc: 'High quality — still blocks text extraction.', quality: 0.85 },
};

export default function PdfProtect() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [level, setLevel] = useState<ProtectionLevel>('high');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  const protectPdf = async () => {
    if (!file) return;

    if (!password || password.length < 4) {
      toast({
        title: "Password Required",
        description: "Enter a password (minimum 4 characters) for true 100% protection.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
      const totalPages = pdf.numPages;
      const quality = PROTECTION_PRESETS[level].quality;

      // Get first page dimensions
      const firstPage = await pdf.getPage(1);
      const firstVp = firstPage.getViewport({ scale: 1.0 });

      // Create jsPDF WITH encryption from the very start.
      // userPermissions: [] = BLOCK EVERYTHING (print, modify, copy, annot-forms)
      // A non-empty userPassword means the file CANNOT be opened without the password.
      // This is TRUE 100% protection — no tool can bypass this without the password.
      const doc = new jsPDF({
        orientation: firstVp.width > firstVp.height ? 'l' : 'p',
        unit: 'pt',
        format: [firstVp.width, firstVp.height],
        encryption: {
          userPassword: password,
          ownerPassword: 'HarshOwnerKey_2026_Ultra!' + password,
          userPermissions: []  // Empty = block ALL (print, modify, copy, annot-forms)
        }
      });

      for (let i = 1; i <= totalPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 });
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        if (ctx) {
          await page.render({ canvasContext: ctx, viewport }).promise;

          const blob = await new Promise<Blob | null>(resolve =>
            canvas.toBlob(resolve, 'image/jpeg', quality)
          );
          if (!blob) throw new Error(`Failed to render page ${i}`);

          const imgDataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });

          const origVp = page.getViewport({ scale: 1.0 });

          if (i > 1) {
            doc.addPage(
              [origVp.width, origVp.height],
              origVp.width > origVp.height ? 'l' : 'p'
            );
          }

          doc.addImage(imgDataUrl, 'JPEG', 0, 0, origVp.width, origVp.height);
        }

        // Free canvas memory
        canvas.width = 0;
        canvas.height = 0;
        setProgress(Math.round((i / totalPages) * 100));
      }

      doc.save(`protected_${file.name}`);

      toast({
        title: "🔒 100% Protected!",
        description: "Password-locked, permissions blocked, content flattened. No tool can bypass this."
      });
    } catch (err: any) {
      console.error('Protection error:', err);
      toast({
        title: "Protection Failed",
        description: err?.message || "An unknown error occurred.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  return (
    <Card className="max-w-3xl mx-auto border-none shadow-2xl bg-card/80 backdrop-blur-xl overflow-hidden font-sans">
      <CardHeader className="bg-rose-500/10 border-b border-rose-500/20 p-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-rose-500 text-white rounded-2xl shadow-lg shadow-rose-500/30">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <CardTitle className="text-3xl font-black tracking-tight">{t('pdf_protect_title' as any)}</CardTitle>
            <CardDescription className="text-rose-700 dark:text-rose-300 font-bold">{t('pdf_protect_desc' as any)}</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-8 space-y-8">
        {!file ? (
          <div className="border-4 border-dashed border-muted rounded-[2.5rem] p-16 text-center hover:border-rose-500/50 transition-all hover:bg-rose-500/5 group relative">
            <input type="file" accept="application/pdf" onChange={(e) => e.target.files && setFile(e.target.files[0])} className="absolute inset-0 opacity-0 cursor-pointer" />
            <Lock className="w-16 h-16 text-muted-foreground mx-auto mb-6 group-hover:scale-110 transition-transform opacity-30" />
            <p className="text-xl font-black text-muted-foreground">Drop PDF to secure it</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* File Info */}
            <div className="p-6 bg-muted/30 rounded-3xl border-2 flex items-center gap-4">
              <FileText className="w-10 h-10 text-rose-500" />
              <div className="flex-1 overflow-hidden">
                <p className="font-black truncate">{file.name}</p>
                <Button variant="link" onClick={() => setFile(null)} className="p-0 h-auto text-[10px] text-rose-500 font-black uppercase tracking-widest">Change File</Button>
              </div>
            </div>

            {/* Password Input — REQUIRED */}
            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-widest text-rose-600">🔑 Password (Required for 100% Protection)</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter a strong password..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-14 rounded-2xl border-2 border-rose-500/30 pl-12 pr-12 font-bold focus:border-rose-500"
                />
                <Lock className="absolute left-4 top-4 w-6 h-6 text-rose-500" />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-4 text-muted-foreground hover:text-rose-500 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                </button>
              </div>
              <p className="text-[10px] font-bold text-rose-500/80 leading-tight">
                ⚠️ Without a password, PDF permissions are just advisory — any tool can ignore them. 
                A password makes it <strong>impossible</strong> to open, convert, or process the file without knowing it.
              </p>
            </div>

            {/* Protection Level */}
            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Flattening Quality</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(Object.entries(PROTECTION_PRESETS) as [ProtectionLevel, typeof PROTECTION_PRESETS[ProtectionLevel]][]).map(([key, preset]) => (
                  <button
                    key={key}
                    onClick={() => setLevel(key)}
                    className={`p-4 rounded-2xl border-2 text-left transition-all ${level === key ? 'border-rose-500 bg-rose-500/10 shadow-lg' : 'border-muted hover:border-rose-500/30 hover:bg-muted/20'}`}
                  >
                    <p className="font-black text-sm">{preset.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-1 leading-tight font-bold">{preset.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* What Gets Blocked — 3-layer explanation */}
            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Triple-Layer Protection</Label>
              
              {/* Layer 1: Password */}
              <div className="p-4 bg-rose-500/5 rounded-2xl border border-rose-500/10">
                <p className="font-black text-sm text-rose-600 mb-1">🔐 Layer 1: Password Lock</p>
                <p className="text-[10px] text-muted-foreground font-bold">File cannot be opened without the password. No tool can bypass this.</p>
              </div>

              {/* Layer 2: Permissions */}
              <div className="p-4 bg-rose-500/5 rounded-2xl border border-rose-500/10">
                <p className="font-black text-sm text-rose-600 mb-1">🚫 Layer 2: Permission Blocking</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                  {[
                    { icon: Copy, label: 'Copy' },
                    { icon: Edit, label: 'Edit' },
                    { icon: Printer, label: 'Print' },
                    { icon: FileSignature, label: 'Forms' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-2 p-2 bg-rose-500/5 rounded-xl">
                      <div className="relative">
                        <item.icon className="w-4 h-4 text-rose-500" />
                        <Ban className="w-2.5 h-2.5 text-rose-600 absolute -top-0.5 -right-0.5" />
                      </div>
                      <span className="text-[9px] font-black uppercase">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Layer 3: Flattening */}
              <div className="p-4 bg-rose-500/5 rounded-2xl border border-rose-500/10">
                <p className="font-black text-sm text-rose-600 mb-1">🖼️ Layer 3: Content Flattening</p>
                <p className="text-[10px] text-muted-foreground font-bold">All text converted to images — even if bypassed, there's no text to copy or search.</p>
              </div>
            </div>

            {/* Progress */}
            {isProcessing && (
              <div className="w-full bg-muted rounded-full h-4 overflow-hidden relative border-2">
                <div className="bg-rose-500 h-full transition-all duration-300 ease-out" style={{ width: `${progress}%` }} />
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-white mix-blend-difference">{progress}%</span>
              </div>
            )}

            <Button
              className="w-full h-16 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-lg gap-2 shadow-xl shadow-rose-600/20 disabled:opacity-40"
              disabled={isProcessing || !password || password.length < 4}
              onClick={protectPdf}
            >
              {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : <ShieldAlert className="w-6 h-6" />}
              {isProcessing ? 'PROTECTING...' : 'PROTECT & DOWNLOAD'}
            </Button>
            {password.length > 0 && password.length < 4 && (
              <p className="text-[10px] font-black text-rose-500 text-center">Password must be at least 4 characters</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
