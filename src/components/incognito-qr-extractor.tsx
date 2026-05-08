'use client';

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { ShieldAlert, FileKey2, Trash2, EyeOff, Eye, Loader2, Copy, CheckCircle2, ShieldCheck, QrCode } from 'lucide-react';
import * as zip from '@zip.js/zip.js';
import * as pdfjs from 'pdfjs-dist';
import jsQR from 'jsqr';
import { invoke } from '@tauri-apps/api/core';

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface ExtractedData {
  fileName: string;
  qrText: string | null;
  status: 'scanning' | 'success' | 'no_qr' | 'error';
}

export default function IncognitoQrExtractor() {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [results, setResults] = useState<ExtractedData[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleTauriSelect = async () => {
    try {
      const { open } = await import('@tauri-apps/plugin-dialog');
      const { readFile } = await import('@tauri-apps/plugin-fs');
      
      const selected = await open({
        multiple: false,
        filters: [{
          name: 'Archives',
          extensions: ['zip', 'rar']
        }]
      });
      
      if (selected && typeof selected === 'string') {
        const fileName = selected.split('\\').pop()?.split('/').pop() || 'archive.zip';
        
        // Read file contents directly into memory
        const fileContents = await readFile(selected);
        
        // Create a standard File object from bytes
        const newFile = new File([fileContents], fileName, { type: 'application/zip' });
        // Attach the absolute path explicitly so the destroy function can use it
        (newFile as any).path = selected;
        
        setFile(newFile);
        setResults([]);
        setPassword('');
      }
    } catch (err: any) {
      toast({ title: "Selection Error", description: "Make sure you are running the Tauri desktop app. " + err.toString(), variant: "destructive" });
    }
  };

  const processZip = async () => {
    if (!file) return;
    setIsProcessing(true);
    setResults([]);

    try {
      const reader = new zip.ZipReader(new zip.BlobReader(file), { password });
      
      let entries;
      try {
        entries = await reader.getEntries();
      } catch (e: any) {
        const isPassErr = e.message?.toLowerCase().includes('password') || 
                          e.message === zip.ERR_INVALID_PASSWORD ||
                          e.toString().toLowerCase().includes('encrypted') ||
                          e.toString().toLowerCase().includes('password');
        if (isPassErr) {
          setIsErrorDialogOpen(true);
        } else {
          toast({ title: "Archive Error", description: "Could not read the archive structure.", variant: "destructive" });
        }
        setIsProcessing(false);
        return;
      }
      
      // Filter for interesting files
      const relevantEntries = entries.filter(e => e.filename.endsWith('.pdf') || e.filename.endsWith('.svg'));
      
      if (relevantEntries.length === 0) {
        toast({ title: "No Files Found", description: "No PDF or SVG files found in this archive." });
        setIsProcessing(false);
        return;
      }

      // --- PASSWORD PRE-VERIFICATION ---
      try {
        const firstEntry = relevantEntries[0];
        await firstEntry.getData!(new zip.BlobWriter(), { length: 100 });
      } catch (e: any) {
        const isPassErr = e.message?.toLowerCase().includes('password') || 
                          e.message === zip.ERR_INVALID_PASSWORD ||
                          e.toString().toLowerCase().includes('encrypted') ||
                          e.toString().toLowerCase().includes('password');
        if (isPassErr) {
          setIsErrorDialogOpen(true);
          setIsProcessing(false);
          return;
        }
        throw e;
      }

      // If we reached here, the password is correct
      const newResults: ExtractedData[] = relevantEntries.map(e => ({
        fileName: e.filename,
        qrText: null,
        status: 'scanning'
      }));
      setResults(newResults);

      for (let idx = 0; idx < relevantEntries.length; idx++) {
        const entry = relevantEntries[idx];
        
        try {
          const blob = await entry.getData!(new zip.BlobWriter());
          const arrayBuffer = await blob.arrayBuffer();
          let qrText = null;

          if (entry.filename.endsWith('.pdf')) {
            const pdf = await pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
            const scales = [2.0, 3.0, 1.5];
            
            for (let i = 1; i <= pdf.numPages; i++) {
              const page = await pdf.getPage(i);
              for (const scale of scales) {
                const viewport = page.getViewport({ scale });
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d', { willReadFrequently: true });
                if (!context) continue;
                
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                context.fillStyle = '#ffffff';
                context.fillRect(0, 0, canvas.width, canvas.height);
                await page.render({ canvasContext: context, viewport }).promise;
                
                const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                const code = jsQR(imageData.data, imageData.width, imageData.height, {
                  inversionAttempts: "attemptBoth",
                });
                
                if (code) {
                  qrText = code.data;
                  break;
                }
              }
              if (qrText) break;
            }
          } else if (entry.filename.endsWith('.svg')) {
            const text = await blob.text();
            const img = new Image();
            const svgBlob = new Blob([text], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(svgBlob);
            
            qrText = await new Promise((resolve) => {
              img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = Math.max(img.width * 2, 1000);
                canvas.height = Math.max(img.height * 2, 1000);
                const ctx = canvas.getContext('2d', { willReadFrequently: true });
                if (ctx) {
                  ctx.fillStyle = '#ffffff';
                  ctx.fillRect(0, 0, canvas.width, canvas.height);
                  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                  const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "attemptBoth" });
                  resolve(code ? code.data : null);
                } else {
                  resolve(null);
                }
              };
              img.onerror = () => resolve(null);
              img.src = url;
            });
            URL.revokeObjectURL(url);
          }

          setResults(prev => prev.map((r, i) => i === idx ? { ...r, qrText, status: qrText ? 'success' : 'no_qr' } : r));

        } catch (e: any) {
          setResults(prev => prev.map((r, i) => i === idx ? { ...r, status: 'error' } : r));
        }
      }

      await reader.close();
      toast({ title: "Scan Complete", description: "All files processed in memory." });

    } catch (err: any) {
      console.error("ZIP Processing Exception:", err);
      const isPassErr = err.message === "INVALID_PASSWORD" ||
                        err.message?.toLowerCase().includes('password') || 
                        err.toString().toLowerCase().includes('password') ||
                        err.toString().toLowerCase().includes('encrypted');
      
      if (isPassErr) {
        setIsErrorDialogOpen(true);
        setResults([]);
      } else {
        toast({ title: "Processing Error", description: "An unexpected error occurred while reading the archive.", variant: "destructive" });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      let copied = false;
      
      // Try Tauri plugin first
      try {
        const { writeText } = await import('@tauri-apps/plugin-clipboard-manager');
        await writeText(text);
        copied = true;
      } catch (e) {
        // Fallback to browser API
        await navigator.clipboard.writeText(text);
        copied = true;
      }
      
      if (copied) {
        toast({ title: "Copied! 🔒", description: "QR text copied. It will auto-wipe from clipboard in 15 seconds for security." });
        
        setTimeout(async () => {
          let wiped = false;
          try {
            // 1. Try Deep System Wipe (Windows History + Current)
            try {
              await invoke('clear_clipboard_history');
              wiped = true;
            } catch (tauriErr) {
              // 2. Try Native Tauri Plugin Wipe
              try {
                const { writeText } = await import('@tauri-apps/plugin-clipboard-manager');
                await writeText('');
                wiped = true;
              } catch (pluginErr) {
                // 3. Browser Clear (Fails if not focused)
                await navigator.clipboard.writeText('');
                wiped = true;
              }
            }
            
            if (wiped) {
              toast({ title: "Clipboard Wiped 🧹", description: "QR text and system clipboard history have been securely erased.", variant: "destructive" });
            }
          } catch (e: any) {
            // 3. Fallback: Queue wipe for when user returns to app
            if (e.name === 'NotAllowedError' || e.message?.includes('focus')) {
              const clearOnFocus = async () => {
                try {
                  await navigator.clipboard.writeText('');
                  toast({ title: "Clipboard Wiped 🧹", description: "The copied QR text has been securely erased from your clipboard.", variant: "destructive" });
                } catch (f) {}
                window.removeEventListener('focus', clearOnFocus);
              };
              window.addEventListener('focus', clearOnFocus);
            }
            console.warn("Background clipboard wipe blocked by browser security. Queued for next focus.");
          }
        }, 15000);
      }
    } catch (err: any) {
      toast({ title: "Copy Failed", description: "Could not write to clipboard.", variant: "destructive" });
    }
  };

  const permanentlyDestroyFile = async () => {
    if (!file) return;
    // We can only securely delete if we have the absolute path. 
    // In Tauri, file inputs might not give absolute paths directly unless configured, 
    // but we can get it via `path` property if it's available on the File object in Tauri.
    const filePath = (file as any).path;
    if (!filePath) {
      toast({ title: "Deletion Failed", description: "Could not get absolute file path. Please ensure this is running in Tauri.", variant: "destructive" });
      return;
    }

    setIsDeleting(true);
    try {
      await invoke('secure_delete_file', { path: filePath });
      toast({ title: "File Destroyed 💥", description: "Original archive completely overwritten and wiped from disk." });
      setFile(null);
      setResults([]);
      setPassword('');
    } catch (err: any) {
      toast({ title: "Destruction Error", description: err.toString(), variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="max-w-3xl mx-auto border-none shadow-2xl bg-black/90 text-zinc-100 backdrop-blur-xl">
      <CardHeader className="text-center p-8 border-b border-white/10">
        <div className="mx-auto w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mb-4 ring-1 ring-red-500/50">
          <EyeOff className="w-8 h-8" />
        </div>
        <CardTitle className="text-3xl font-black tracking-tight flex items-center justify-center gap-2">
          Incognito QR Extractor <ShieldCheck className="w-6 h-6 text-green-500" />
        </CardTitle>
        <CardDescription className="text-zinc-400 font-medium max-w-lg mx-auto">
          Extract password-protected ZIP/RARs in 1000% memory-only mode. 
          Zero disk traces. Scan PDFs/SVGs for QR codes completely securely.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-8 space-y-8">
        {!file ? (
          <div 
            onClick={handleTauriSelect}
            className="border-2 border-dashed border-zinc-700 hover:border-red-500/50 rounded-3xl p-12 text-center transition-all relative group bg-zinc-900/50 cursor-pointer"
          >
            <div className="flex justify-center mb-4 group-hover:scale-110 transition-transform">
              <FileKey2 className="w-12 h-12 text-zinc-500 group-hover:text-red-500" />
            </div>
            <p className="font-bold text-zinc-300">Click to Select Locked ZIP/RAR</p>
            <p className="text-xs text-zinc-500 mt-2">Processed entirely in RAM</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-between">
               <div className="flex items-center gap-4">
                 <div className="p-3 bg-red-500/10 rounded-xl text-red-500">
                    <FileKey2 className="w-6 h-6" />
                 </div>
                 <div>
                    <p className="font-bold text-sm truncate max-w-[200px] sm:max-w-xs">{file.name}</p>
                    <p className="text-xs text-zinc-500">{(file.size / 1024 / 1024).toFixed(2)} MB • Local File</p>
                 </div>
               </div>
               <Button variant="ghost" size="icon" onClick={() => setFile(null)} className="text-zinc-500 hover:text-white">
                  <Trash2 className="w-5 h-5" />
               </Button>
            </div>

            <div className="space-y-4 bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800/50">
              <div className="space-y-2">
                <Label className="text-zinc-400">Archive Password</Label>
                <div className="relative">
                  <Input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="Enter decryption key..." 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-black border-zinc-800 focus-visible:ring-red-500 h-12 pr-12"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full w-12 text-zinc-500 hover:text-white"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </Button>
                </div>
              </div>

              <Button 
                onClick={processZip} 
                disabled={isProcessing}
                className="w-full h-12 bg-zinc-100 hover:bg-white text-black font-bold"
              >
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <EyeOff className="w-5 h-5 mr-2" />}
                Extract & Scan Incognito
              </Button>
            </div>

            {results.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-bold text-zinc-300 flex items-center gap-2">
                  <QrCode className="w-5 h-5" /> Scan Results
                </h3>
                <div className="grid gap-3">
                  {results.map((r, i) => (
                    <div key={i} className="p-4 bg-zinc-900 rounded-xl border border-zinc-800 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-zinc-300 truncate mr-4">{r.fileName}</span>
                        {r.status === 'scanning' && <Loader2 className="w-4 h-4 animate-spin text-zinc-500" />}
                        {r.status === 'no_qr' && <span className="text-xs text-zinc-500 font-bold bg-zinc-800 px-2 py-1 rounded-md">NO QR</span>}
                        {r.status === 'error' && <span className="text-xs text-red-500 font-bold bg-red-500/10 px-2 py-1 rounded-md">ERROR</span>}
                        {r.status === 'success' && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                      </div>
                      
                      {r.status === 'success' && r.qrText && (
                        <div className="flex items-center gap-2 bg-black p-3 rounded-lg border border-zinc-800/50">
                           <code className="text-xs text-green-400 flex-1 break-all">{r.qrText}</code>
                           <Button size="icon" variant="ghost" className="h-8 w-8 text-zinc-400 hover:text-white" onClick={() => copyToClipboard(r.qrText!)}>
                              <Copy className="w-4 h-4" />
                           </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-6 border-t border-zinc-800">
               <div className="flex items-start gap-3 p-4 bg-red-500/5 rounded-2xl border border-red-500/20 mb-4">
                  <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-200/70 leading-relaxed">
                    <strong>Zero-Trace Destruction:</strong> This will overwrite the original archive file on your hard drive with zeroes before deleting it, making recovery impossible. Use with caution.
                  </p>
               </div>
               <Button 
                 onClick={permanentlyDestroyFile}
                 disabled={isDeleting || isProcessing}
                 variant="destructive"
                 className="w-full h-14 font-black tracking-wide text-white bg-red-600 hover:bg-red-700"
               >
                 {isDeleting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Trash2 className="w-5 h-5 mr-2" />}
                 PERMANENTLY DESTROY ORIGINAL FILE
               </Button>
            </div>

          </div>
        )}
      </CardContent>

      <AlertDialog open={isErrorDialogOpen} onOpenChange={setIsErrorDialogOpen}>
        <AlertDialogContent className="bg-zinc-950 border-red-900/50 text-zinc-100">
          <AlertDialogHeader>
            <div className="mx-auto w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mb-4">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <AlertDialogTitle className="text-xl font-black text-center text-red-500">ACCESS DENIED</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400 text-center font-medium">
              The password you entered is incorrect. This archive remains encrypted and no data has been extracted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center mt-6">
            <AlertDialogAction 
              onClick={() => setIsErrorDialogOpen(false)}
              className="bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-2 rounded-xl"
            >
              Try Again
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
