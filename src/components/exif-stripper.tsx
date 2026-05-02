'use client';

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ShieldCheck, ImageIcon, Download, Loader2, Sparkles, 
  Zap, Info, MapPinOff, CameraOff, History, Trash2, Upload
} from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';

export default function ExifStripper() {
  const [image, setImage] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  
  const { t } = useLanguage();
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const file = e.target.files[0];
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const processStrip = async () => {
    if (!image || !preview) return;
    setIsProcessing(true);

    try {
      const img = new Image();
      // Ensure we handle orientation and loading correctly
      img.crossOrigin = "anonymous";
      
      const loadPromise = new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => reject(new Error("Failed to load image for processing."));
        img.src = preview;
      });

      await loadPromise;

      const canvas = canvasRef.current!;
      const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
      
      // Use natural dimensions for full quality
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      
      // Draw image to canvas. This process strips all original EXIF metadata
      // as the canvas only contains the raw pixel data.
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0);

      // Export as a new image, preserving original format if possible
      const mimeType = image.type || 'image/jpeg';
      const sterileDataUrl = canvas.toDataURL(mimeType, 0.95);
      
      const link = document.createElement('a');
      link.download = `sterile_${image.name}`;
      link.href = sterileDataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({ 
        title: "Privacy Restored", 
        description: `Successfully purged metadata from ${image.name}.` 
      });
    } catch (e: any) {
      toast({ title: "Sterilization Error", description: e.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 px-4">
      <Card className="border-none shadow-2xl bg-gradient-to-br from-background via-muted/50 to-background overflow-hidden font-sans">
        <CardHeader className="bg-emerald-500/5 border-b border-emerald-500/10 p-8">
           <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-4">
                 <div className="p-4 bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-500/20">
                    <ShieldCheck className="w-8 h-8" />
                 </div>
                 <div>
                    <CardTitle className="text-3xl font-black tracking-tight uppercase">EXIF Stripper</CardTitle>
                    <CardDescription className="text-base font-bold text-emerald-600/60">{t('exifStripperDesc' as any)}</CardDescription>
                 </div>
              </div>

              <div className="flex gap-4">
                 <div className="p-3 bg-muted rounded-2xl border-2 flex items-center gap-3">
                    <MapPinOff className="w-4 h-4 text-emerald-600" />
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-40">GPS PURGE</span>
                 </div>
                 <div className="p-3 bg-muted rounded-2xl border-2 flex items-center gap-3">
                    <CameraOff className="w-4 h-4 text-emerald-600" />
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-40">EXIF KILL</span>
                 </div>
              </div>
           </div>
        </CardHeader>

        <CardContent className="p-8">
           <div className="grid grid-cols-1 lg:grid-cols-[1.2fr,1fr] gap-12">
              <div className="space-y-8">
                 <div className="relative group h-80 border-4 border-dashed border-emerald-500/10 rounded-[3rem] flex flex-col items-center justify-center hover:bg-emerald-500/5 transition-all overflow-hidden bg-muted/20">
                    <input type="file" accept="image/*" onChange={handleSelect} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                    {preview ? (
                       <div className="relative w-full h-full p-4">
                          <img src={preview} alt="preview" className="w-full h-full object-contain rounded-2xl" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                             <p className="text-white font-black uppercase tracking-widest text-xs">Change Image</p>
                          </div>
                       </div>
                    ) : (
                       <>
                          <Upload className="w-12 h-12 text-emerald-600/40 mb-4 group-hover:scale-125 transition-transform" />
                          <p className="text-sm font-black text-emerald-600/60 uppercase tracking-widest">Select Image to Purge</p>
                       </>
                    )}
                 </div>

                 <Button 
                   onClick={processStrip}
                   disabled={!image || isProcessing}
                   className="w-full h-24 rounded-[2.5rem] bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xl gap-4 shadow-2xl shadow-emerald-500/20 group"
                 >
                    {isProcessing ? (
                       <Loader2 className="w-8 h-8 animate-spin" />
                    ) : (
                       <>
                          <Sparkles className="w-8 h-8 group-hover:rotate-12 transition-transform" />
                          PURGE METADATA
                       </>
                    )}
                 </Button>
              </div>

              <div className="space-y-6">
                 <div className="p-8 rounded-[3rem] bg-muted/30 border-2 shadow-inner space-y-6">
                    <div className="flex items-center gap-3">
                       <Info className="w-5 h-5 text-emerald-600" />
                       <span className="text-[10px] font-black uppercase tracking-widest">How it works</span>
                    </div>
                    <p className="text-sm font-bold text-muted-foreground leading-relaxed">
                       Digital photos contain invisible data packets (EXIF) that store your exact GPS coordinates, camera serial numbers, and editing history.
                    </p>
                    <div className="pt-4 border-t border-dashed space-y-4">
                       <div className="flex items-start gap-4">
                          <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0"><History className="w-3 h-3 text-emerald-600" /></div>
                          <p className="text-[10px] font-bold opacity-60 uppercase leading-relaxed">Destroys creation timestamps</p>
                       </div>
                       <div className="flex items-start gap-4">
                          <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0"><Trash2 className="w-3 h-3 text-emerald-600" /></div>
                          <p className="text-[10px] font-bold opacity-60 uppercase leading-relaxed">Deletes Software fingerprints</p>
                       </div>
                    </div>
                 </div>

                 <div className="p-8 rounded-[2.5rem] bg-emerald-600 text-white shadow-xl flex items-center gap-6 group overflow-hidden">
                    <Zap className="w-12 h-12 opacity-20 group-hover:scale-125 transition-transform" />
                    <div>
                       <h4 className="text-sm font-black uppercase tracking-widest mb-1">Instant Sterilization</h4>
                       <p className="text-[10px] font-bold opacity-60">100% Client-side. Your photos never leave your device.</p>
                    </div>
                 </div>
              </div>
           </div>
        </CardContent>
      </Card>
      
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}
