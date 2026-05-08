'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ShieldAlert, ImageIcon, Download, Loader2, Sparkles, 
  Zap, Info, Eraser, MousePointer2, Square, Grid3X3, Upload, RotateCcw
} from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';

interface Rect {
  x: number; y: number; w: number; h: number; type: 'blur' | 'pixel';
}

export default function ImageCamouflage() {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mode, setMode] = useState<'blur' | 'pixel'>('blur');
  const [rects, setRects] = useState<Rect[]>([]);
  const [currentRect, setCurrentRect] = useState<Rect | null>(null);
  
  const { t } = useLanguage();
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLCanvasElement>(null);

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const file = e.target.files[0];
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => setImage(img);
    }
  };

  const draw = () => {
    if (!image || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    
    // Set canvas size to match image aspect ratio while keeping display size
    canvas.width = image.width;
    canvas.height = image.height;
    
    ctx.drawImage(image, 0, 0);

    rects.forEach(r => applyEffect(ctx, r));
    if (currentRect) applyEffect(ctx, currentRect);
  };

  const applyEffect = (ctx: CanvasRenderingContext2D, r: Rect) => {
    // Prevent InvalidStateError if rectangle has 0 width or height (e.g. during initial drag)
    if (Math.abs(r.w) < 1 || Math.abs(r.h) < 1) return;

    const w = Math.abs(r.w);
    const h = Math.abs(r.h);
    const x = r.w < 0 ? r.x + r.w : r.x;
    const y = r.h < 0 ? r.y + r.h : r.y;

    if (r.type === 'blur') {
      ctx.save();
      ctx.filter = 'blur(10px)';
      ctx.drawImage(ctx.canvas, x, y, w, h, x, y, w, h);
      ctx.restore();
    } else {
      const size = 15;
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = Math.max(1, Math.ceil(w / size));
      tempCanvas.height = Math.max(1, Math.ceil(h / size));
      const tCtx = tempCanvas.getContext('2d')!;
      tCtx.imageSmoothingEnabled = false;
      
      // Draw small
      tCtx.drawImage(ctx.canvas, x, y, w, h, 0, 0, tempCanvas.width, tempCanvas.height);
      
      // Draw back big
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(tempCanvas, 0, 0, tempCanvas.width, tempCanvas.height, x, y, w, h);
      ctx.restore();
    }
    // Draw boundary
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(r.x, r.y, r.w, r.h);
    ctx.setLineDash([]);
  };

  useEffect(() => {
    draw();
  }, [image, rects, currentRect]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!image || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    setCurrentRect({ x, y, w: 0, h: 0, type: mode });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!currentRect || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    setCurrentRect(prev => prev ? ({ ...prev, w: x - prev.x, h: y - prev.y }) : null);
  };

  const handleMouseUp = () => {
    if (currentRect) {
      setRects([...rects, currentRect]);
      setCurrentRect(null);
    }
  };

  const saveImage = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = 'camouflaged_image.png';
    link.href = canvasRef.current.toDataURL();
    link.click();
    toast({ title: "Success", description: "Camouflaged image saved." });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 px-4">
      <Card className="border-none shadow-2xl bg-gradient-to-br from-background via-muted/50 to-background overflow-hidden font-sans">
        <CardHeader className="bg-cyan-500/5 border-b border-cyan-500/10 p-8">
           <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-4">
                 <div className="p-4 bg-cyan-600 text-white rounded-2xl shadow-lg shadow-cyan-500/20">
                    <Eraser className="w-8 h-8" />
                 </div>
                 <div>
                    <CardTitle className="text-3xl font-black tracking-tight uppercase">Image Camouflage</CardTitle>
                    <CardDescription className="text-base font-bold text-cyan-600/60">{t('camouflageDesc' as any)}</CardDescription>
                 </div>
              </div>

              <div className="flex p-1 bg-muted rounded-2xl border-2">
                 <button onClick={() => setMode('blur')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black transition-all ${mode === 'blur' ? 'bg-background shadow-lg text-cyan-600 scale-105' : 'text-muted-foreground'}`}>
                    <Square className="w-3 h-3" /> BLUR ZONE
                 </button>
                 <button onClick={() => setMode('pixel')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black transition-all ${mode === 'pixel' ? 'bg-background shadow-lg text-cyan-600 scale-105' : 'text-muted-foreground'}`}>
                    <Grid3X3 className="w-3 h-3" /> PIXELATE
                 </button>
              </div>
           </div>
        </CardHeader>

        <CardContent className="p-8">
           <div className="grid grid-cols-1 lg:grid-cols-[1fr,350px] gap-12">
              <div className="space-y-6">
                 {!image ? (
                    <div className="relative group h-[500px] border-4 border-dashed border-cyan-500/10 rounded-[3rem] flex flex-col items-center justify-center hover:bg-cyan-500/5 transition-all bg-muted/20">
                       <input type="file" accept="image/*" onChange={handleSelect} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                       <Upload className="w-16 h-16 text-cyan-600/40 mb-4 group-hover:scale-125 transition-transform" />
                       <p className="text-sm font-black text-cyan-600/60 uppercase tracking-widest">Select Image to Redact</p>
                    </div>
                 ) : (
                    <div className="relative rounded-[2rem] overflow-hidden border-2 shadow-2xl bg-black/5 flex items-center justify-center cursor-crosshair">
                       <canvas 
                         ref={canvasRef} 
                         onMouseDown={handleMouseDown}
                         onMouseMove={handleMouseMove}
                         onMouseUp={handleMouseUp}
                         className="max-w-full max-h-[70vh] object-contain"
                       />
                       <div className="absolute top-4 left-4 p-4 rounded-2xl bg-black/50 backdrop-blur-md text-white border border-white/10 flex items-center gap-3">
                          <MousePointer2 className="w-4 h-4 text-cyan-400" />
                          <p className="text-[10px] font-black uppercase tracking-widest">Drag to Redact</p>
                       </div>
                    </div>
                 )}
              </div>

              <div className="space-y-8">
                 <div className="p-8 rounded-[3rem] bg-muted/30 border-2 shadow-inner space-y-6">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-2">
                          <History className="w-4 h-4 text-cyan-600" />
                          <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Redaction History</span>
                       </div>
                       <Button variant="ghost" size="sm" onClick={() => setRects([])} className="h-6 text-[10px] font-black uppercase text-rose-500">Reset</Button>
                    </div>
                    
                    <div className="space-y-3">
                       {rects.map((r, i) => (
                          <div key={i} className="flex items-center justify-between p-3 bg-card border-2 rounded-xl">
                             <div className="flex items-center gap-3">
                                {r.type === 'blur' ? <Square className="w-3 h-3 text-cyan-500" /> : <Grid3X3 className="w-3 h-3 text-cyan-500" />}
                                <span className="text-[10px] font-bold opacity-60">ZONE #{i+1}</span>
                             </div>
                             <Button variant="ghost" size="icon" onClick={() => setRects(prev => prev.filter((_, idx) => idx !== i))} className="h-6 w-6 text-rose-500"><RotateCcw className="w-3 h-3" /></Button>
                          </div>
                       ))}
                       {rects.length === 0 && <p className="py-10 text-center text-[10px] font-black opacity-20 uppercase tracking-widest">No zones created</p>}
                    </div>
                 </div>

                 <Button 
                   onClick={saveImage}
                   disabled={!image}
                   className="w-full h-24 rounded-[2.5rem] bg-cyan-600 hover:bg-cyan-700 text-white font-black text-xl gap-4 shadow-2xl shadow-cyan-500/20 group"
                 >
                    <Download className="w-8 h-8 group-hover:translate-y-1 transition-transform" />
                    SAVE REDACTED IMAGE
                 </Button>

                 <div className="p-8 rounded-[2.5rem] bg-cyan-600 text-white shadow-xl flex items-center gap-6 group overflow-hidden">
                    <ShieldAlert className="w-12 h-12 opacity-20 group-hover:scale-125 transition-transform" />
                    <div>
                       <h4 className="text-sm font-black uppercase tracking-widest mb-1">Visual Privacy</h4>
                       <p className="text-[10px] font-bold opacity-60 italic">Permanent destructive redaction. Non-reversible once saved.</p>
                    </div>
                 </div>
              </div>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}

function History({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>
  );
}
