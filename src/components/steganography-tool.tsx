'use client';

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Upload, Download, EyeOff, Eye, Image as ImageIcon, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/language-context';

export default function SteganographyTool() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [secretText, setSecretText] = useState('');
  const [decodedText, setDecodedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { t } = useLanguage();
  const { toast } = useToast();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      setImageSrc(event.target?.result as string);
      setDecodedText(''); // clear on new image
    };
    reader.readAsDataURL(file);
  };

  const encodeMessage = () => {
    if (!imageSrc || !secretText) {
      toast({ title: "Error", description: "Image and secret text are required.", variant: "destructive" });
      return;
    }
    
    setIsProcessing(true);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      if (!canvas || !ctx) return;
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      
      // Delimiter to know when text ends
      const textToHide = secretText + '|||END|||'; 
      let binStr = '';
      for (let i = 0; i < textToHide.length; i++) {
        let bin = textToHide.charCodeAt(i).toString(2);
        binStr += '00000000'.slice(bin.length) + bin;
      }
      
      if (binStr.length > (data.length / 4) * 3) {
        setIsProcessing(false);
        toast({ title: "Error", description: "Image is too small to hold this much text.", variant: "destructive" });
        return;
      }
      
      let binIdx = 0;
      for (let i = 0; i < data.length; i += 4) {
        if (binIdx < binStr.length) { data[i] = (data[i] & 254) | parseInt(binStr[binIdx++]); } // R
        if (binIdx < binStr.length) { data[i+1] = (data[i+1] & 254) | parseInt(binStr[binIdx++]); } // G
        if (binIdx < binStr.length) { data[i+2] = (data[i+2] & 254) | parseInt(binStr[binIdx++]); } // B
      }
      
      ctx.putImageData(imgData, 0, 0);
      setImageSrc(canvas.toDataURL('image/png'));
      setIsProcessing(false);
      setSecretText('');
      toast({ title: "Encoded", description: "Secret message hidden successfully! Download the image." });
    };
    img.src = imageSrc;
  };

  const decodeMessage = () => {
    if (!imageSrc) return;
    setIsProcessing(true);
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      if (!canvas || !ctx) return;
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      
      let binStr = '';
      for (let i = 0; i < data.length; i += 4) {
        binStr += (data[i] & 1).toString();
        binStr += (data[i+1] & 1).toString();
        binStr += (data[i+2] & 1).toString();
      }
      
      let result = '';
      for (let i = 0; i < binStr.length; i += 8) {
        const byte = binStr.slice(i, i+8);
        if (byte.length === 8) {
           const charCode = parseInt(byte, 2);
           result += String.fromCharCode(charCode);
           if (result.endsWith('|||END|||')) {
             result = result.slice(0, -9);
             break;
           }
        }
      }
      
      setDecodedText(result);
      setIsProcessing(false);
      
      if (result) {
         toast({ title: "Decoded", description: "Secret message found and extracted!" });
      } else {
         toast({ title: "No Message Found", description: "Could not find a valid hidden message.", variant: "destructive" });
      }
    };
    img.src = imageSrc;
  };

  const downloadImage = () => {
    if (!imageSrc) return;
    const a = document.createElement('a');
    a.href = imageSrc;
    a.download = 'secret-image.png';
    a.click();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <Card className="border-none shadow-2xl bg-card/80 backdrop-blur-xl border-2 border-primary/5 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-gray-800 to-black text-white p-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md">
                <EyeOff className="w-8 h-8" />
              </div>
              <div>
                <CardTitle className="text-3xl font-black tracking-tight">{t('stegoTitle' as any) || 'Image Steganography'}</CardTitle>
                <CardDescription className="text-white/70 font-bold">{t('stegoDesc' as any) || 'Hide or extract secret text inside image files invisibly.'}</CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8 space-y-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             
             {/* Left Column: Image Area */}
             <div className="space-y-4">
                <label className="text-sm font-black uppercase tracking-widest text-primary/60">Carrier Image (PNG recommended)</label>
                
                <div className="border-2 border-dashed border-primary/20 rounded-3xl p-2 relative group bg-muted/20 hover:bg-muted/40 transition-colors flex flex-col items-center justify-center min-h-[300px]">
                   {imageSrc ? (
                     <div className="relative w-full flex flex-col items-center space-y-4">
                        <img src={imageSrc} alt="Carrier" className="max-h-[250px] object-contain rounded-xl" />
                        <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-md text-white text-xs px-3 py-1 rounded-full font-mono">
                           Preview
                        </div>
                     </div>
                   ) : (
                     <div className="text-center p-8 text-muted-foreground">
                        <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p className="font-bold">Click or drag image here</p>
                     </div>
                   )}
                   <Input 
                     type="file" 
                     accept="image/png, image/jpeg" 
                     className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                     onChange={handleImageUpload}
                   />
                </div>
                
                {imageSrc && (
                   <div className="flex gap-4">
                      <Button onClick={() => setImageSrc(null)} variant="outline" className="w-full font-black border-2">
                         REMOVE IMAGE
                      </Button>
                      <Button onClick={downloadImage} className="w-full font-black bg-primary">
                         <Download className="w-4 h-4 mr-2" /> DOWNLOAD
                      </Button>
                   </div>
                )}
             </div>

             {/* Right Column: Encode/Decode Data */}
             <div className="space-y-8">
                
                <div className="space-y-4">
                   <div className="flex items-center justify-between">
                     <label className="text-sm font-black uppercase tracking-widest text-emerald-600">Encode Message</label>
                   </div>
                   <Textarea 
                     value={secretText}
                     onChange={(e) => setSecretText(e.target.value)}
                     placeholder="Type text to hide inside the image..."
                     className="min-h-[120px] resize-none rounded-2xl border-2 focus:ring-0 focus:border-emerald-500 bg-muted/30"
                   />
                   <Button onClick={encodeMessage} disabled={isProcessing || !imageSrc || !secretText} className="w-full h-12 rounded-xl font-black gap-2 bg-emerald-600 hover:bg-emerald-700">
                      <EyeOff className="w-4 h-4" /> HIDE TEXT IN IMAGE
                   </Button>
                </div>

                <div className="h-px bg-border w-full" />

                <div className="space-y-4">
                   <div className="flex items-center justify-between">
                     <label className="text-sm font-black uppercase tracking-widest text-indigo-600">Decode Message</label>
                   </div>
                   <Button onClick={decodeMessage} disabled={isProcessing || !imageSrc} variant="outline" className="w-full h-12 rounded-xl font-black gap-2 border-2 border-indigo-600/20 text-indigo-600 hover:bg-indigo-50">
                      <Search className="w-4 h-4" /> EXTRACT HIDDEN TEXT
                   </Button>
                   <Textarea 
                     value={decodedText}
                     readOnly
                     placeholder="Extracted secret message will appear here..."
                     className="min-h-[120px] resize-none rounded-2xl border-2 border-indigo-500/20 bg-indigo-50/30 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300 font-mono focus:ring-0"
                   />
                </div>

             </div>
          </div>

        </CardContent>
      </Card>
      {/* Hidden canvas for processing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
