'use client';

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldAlert, ImageIcon, FileCode, Download, 
  Loader2, Sparkles, Zap, Info, EyeOff, FileArchive, Upload
} from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';

export default function DeepFileStego() {
  const [activeTab, setActiveTab] = useState<'hide' | 'reveal'>('hide');
  const [hostImage, setHostImage] = useState<File | null>(null);
  const [secretFile, setSecretFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const { t } = useLanguage();
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleHostSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setHostImage(e.target.files[0]);
  };

  const handleSecretSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setSecretFile(e.target.files[0]);
  };

  const processHide = async () => {
    if (!hostImage || !secretFile) return;
    setIsProcessing(true);
    setProgress(10);

    try {
      const img = new Image();
      img.src = URL.createObjectURL(hostImage);
      await new Promise(resolve => img.onload = resolve);

      const canvas = canvasRef.current!;
      const ctx = canvas.getContext('2d')!;
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;

      // Read secret file as ArrayBuffer
      const fileBuffer = await secretFile.arrayBuffer();
      const fileData = new Uint8Array(fileBuffer);
      const fileName = secretFile.name;
      const fileNameBytes = new TextEncoder().encode(fileName);
      
      // Data format: [Magic(4)][FileNameLen(1)][FileName][FileSize(4)][Data]
      const totalLen = 4 + 1 + fileNameBytes.length + 4 + fileData.length;
      
      const payload = new Uint8Array(totalLen);
      let offset = 0;
      
      // Magic: 'STGO'
      payload.set([83, 84, 71, 79], offset); offset += 4;
      // FileName Len
      payload[offset] = fileNameBytes.length; offset += 1;
      // FileName
      payload.set(fileNameBytes, offset); offset += fileNameBytes.length;
      // FileSize (32-bit)
      const sizeView = new DataView(new ArrayBuffer(4));
      sizeView.setUint32(0, fileData.length);
      payload.set(new Uint8Array(sizeView.buffer), offset); offset += 4;
      // File Data
      payload.set(fileData, offset);

      // Embed using LSB (2 bits per channel)
      let pIdx = 0;
      for (let i = 0; i < payload.length; i++) {
        let byte = payload[i];
        for (let bit = 0; bit < 4; bit++) { // 2 bits per sub-pixel, 4 pairs = 8 bits
          const chunk = (byte >> (bit * 2)) & 3;
          pixels[pIdx] = (pixels[pIdx] & 0xFC) | chunk;
          pIdx++;
          // Skip Alpha channel for better compatibility
          if ((pIdx + 1) % 4 === 0) pIdx++;
        }
        if (i % 1000 === 0) setProgress(10 + (i / payload.length) * 80);
      }

      ctx.putImageData(imageData, 0, 0);
      
      const link = document.createElement('a');
      link.download = `stego_${hostImage.name.split('.')[0]}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      toast({ title: "Stealth Success", description: "Your secret file is now part of the image." });
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const processReveal = async () => {
    if (!hostImage) return;
    setIsProcessing(true);
    setProgress(20);

    try {
      const img = new Image();
      img.src = URL.createObjectURL(hostImage);
      await new Promise(resolve => img.onload = resolve);

      const canvas = canvasRef.current!;
      const ctx = canvas.getContext('2d')!;
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      
      const extractByte = (pOffset: number) => {
        let byte = 0;
        let localIdx = pOffset;
        for (let bit = 0; bit < 4; bit++) {
          const chunk = pixels[localIdx] & 3;
          byte |= (chunk << (bit * 2));
          localIdx++;
          if ((localIdx + 1) % 4 === 0) localIdx++;
        }
        return { byte, nextIdx: localIdx };
      };

      let currentIdx = 0;
      const getBytes = (len: number) => {
        const arr = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          const { byte, nextIdx } = extractByte(currentIdx);
          arr[i] = byte;
          currentIdx = nextIdx;
        }
        return arr;
      };

      // Check Magic
      const magic = getBytes(4);
      if (new TextDecoder().decode(magic) !== 'STGO') {
        throw new Error("No hidden data found in this image!");
      }

      const nameLen = getBytes(1)[0];
      const fileName = new TextDecoder().decode(getBytes(nameLen));
      
      const sizeBytes = getBytes(4);
      const fileSize = new DataView(sizeBytes.buffer).getUint32(0);
      
      const fileData = getBytes(fileSize);

      const blob = new Blob([fileData]);
      const link = document.createElement('a');
      link.download = fileName;
      link.href = URL.createObjectURL(blob);
      link.click();

      toast({ title: "Reveal Complete", description: `Extracted: ${fileName}` });
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 px-4">
      <Card className="border-none shadow-2xl bg-gradient-to-br from-background via-muted/50 to-background overflow-hidden font-sans">
        <CardHeader className="bg-primary/5 border-b border-primary/10 p-8">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex items-center gap-4">
                 <div className="p-4 bg-primary text-primary-foreground rounded-2xl shadow-lg shadow-primary/20">
                    <EyeOff className="w-8 h-8" />
                 </div>
                 <div>
                    <CardTitle className="text-3xl font-black tracking-tight">{t('fileStegoTitle' as any)}</CardTitle>
                    <CardDescription className="text-base font-bold text-primary/60">{t('fileStegoDesc' as any)}</CardDescription>
                 </div>
              </div>
              
              <div className="flex p-1 bg-muted rounded-2xl border-2">
                 <button onClick={() => setActiveTab('hide')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black transition-all ${activeTab === 'hide' ? 'bg-background shadow-lg text-primary scale-105' : 'text-muted-foreground hover:text-primary'}`}>HIDE FILE</button>
                 <button onClick={() => setActiveTab('reveal')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black transition-all ${activeTab === 'reveal' ? 'bg-background shadow-lg text-primary scale-105' : 'text-muted-foreground hover:text-primary'}`}>EXTRACT FILE</button>
              </div>
           </div>
        </CardHeader>

        <CardContent className="p-8">
           <AnimatePresence mode="wait">
              {activeTab === 'hide' && (
                 <motion.div key="hide" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-4">
                          <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Host Image (Carrier)</label>
                          <div className="relative group h-48 border-4 border-dashed border-primary/10 rounded-[2.5rem] flex flex-col items-center justify-center hover:bg-primary/5 transition-all">
                             <input type="file" accept="image/*" onChange={handleHostSelect} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                             {hostImage ? (
                                <div className="text-center px-4">
                                   <ImageIcon className="w-8 h-8 text-primary mx-auto mb-2" />
                                   <p className="text-xs font-black truncate">{hostImage.name}</p>
                                </div>
                             ) : (
                                <>
                                   <Upload className="w-8 h-8 text-primary/40 mb-2 group-hover:scale-110 transition-transform" />
                                   <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Drop Host Image</p>
                                </>
                             )}
                          </div>
                       </div>

                       <div className="space-y-4">
                          <label className="text-[10px] font-black uppercase tracking-widest text-indigo-500 ml-1">Secret File (ZIP, EXE, etc)</label>
                          <div className="relative group h-48 border-4 border-dashed border-indigo-500/10 rounded-[2.5rem] flex flex-col items-center justify-center hover:bg-indigo-500/5 transition-all">
                             <input type="file" onChange={handleSecretSelect} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                             {secretFile ? (
                                <div className="text-center px-4">
                                   <FileArchive className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
                                   <p className="text-xs font-black truncate">{secretFile.name}</p>
                                   <p className="text-[9px] font-bold opacity-40">{(secretFile.size / 1024).toFixed(1)} KB</p>
                                </div>
                             ) : (
                                <>
                                   <FileCode className="w-8 h-8 text-indigo-500/40 mb-2 group-hover:scale-110 transition-transform" />
                                   <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Drop Secret File</p>
                                </>
                             )}
                          </div>
                       </div>
                    </div>

                    <div className="relative">
                       {isProcessing && (
                          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-30 flex flex-col items-center justify-center rounded-[2rem] border-2">
                             <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                             <p className="text-xs font-black uppercase tracking-[0.2em]">Encoding: {Math.round(progress)}%</p>
                          </div>
                       )}

                       <Button 
                         onClick={processHide}
                         disabled={!hostImage || !secretFile || isProcessing}
                         className="w-full h-24 rounded-[2.5rem] bg-primary hover:bg-primary/90 text-white font-black text-xl gap-4 shadow-2xl shadow-primary/20 group"
                       >
                          <Zap className="w-8 h-8 group-hover:scale-125 transition-transform" />
                          STOW INVISIBLE FILE
                       </Button>
                    </div>

                    <div className="p-8 rounded-[2.5rem] bg-muted/30 border-2 border-dashed space-y-4">
                       <div className="flex items-center gap-2">
                          <ShieldAlert className="w-4 h-4 text-primary" />
                          <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Privacy Protocol</span>
                       </div>
                       <p className="text-xs font-bold text-muted-foreground leading-relaxed">
                          Our LSB (Least Significant Bit) algorithm modifies the two lowest bits of each color channel. This ensures the host image looks 100% identical to the naked eye while storing binary data in the noise.
                       </p>
                    </div>
                 </motion.div>
              )}

              {activeTab === 'reveal' && (
                 <motion.div key="reveal" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
                    <div className="max-w-md mx-auto space-y-6">
                       <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-4">Select Stego-Image</label>
                       <div className="relative group h-64 border-4 border-dashed border-primary/10 rounded-[3rem] flex flex-col items-center justify-center hover:bg-primary/5 transition-all">
                          <input type="file" accept="image/*" onChange={handleHostSelect} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                          {hostImage ? (
                             <div className="text-center px-4">
                                <img src={URL.createObjectURL(hostImage)} alt="preview" className="w-32 h-32 object-cover rounded-2xl mb-4 shadow-xl" />
                                <p className="text-xs font-black truncate">{hostImage.name}</p>
                             </div>
                          ) : (
                             <>
                                <ImageIcon className="w-12 h-12 text-primary/40 mb-2 group-hover:rotate-12 transition-transform" />
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Upload Stego Image</p>
                             </>
                          )}
                       </div>

                       <Button 
                         onClick={processReveal}
                         disabled={!hostImage || isProcessing}
                         className="w-full h-20 rounded-[2rem] bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg gap-4 shadow-xl shadow-indigo-500/20"
                       >
                          {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : <Download className="w-6 h-6" />}
                          REVEAL HIDDEN FILE
                       </Button>
                    </div>
                 </motion.div>
              )}
           </AnimatePresence>
        </CardContent>
      </Card>
      
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}
