'use client';

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, Download, EyeOff, Eye, Image as ImageIcon, 
  FileArchive, ShieldCheck, Sparkles, Layers, FileCode 
} from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { notifyCompleted, notifyCopied, notifyDownloaded, notifyError } from '@/lib/notify';

export default function SteganographyTool() {
  const [mode, setMode] = useState<'text' | 'file'>('text');
  const [textAction, setTextAction] = useState<'encode' | 'decode'>('encode');
  const [fileAction, setFileAction] = useState<'hide' | 'reveal'>('hide');

  // Text Stego State
  const [textImageSrc, setTextImageSrc] = useState<string | null>(null);
  const [secretText, setSecretText] = useState('');
  const [decodedText, setDecodedText] = useState('');
  const [isTextProcessing, setIsTextProcessing] = useState(false);
  const textCanvasRef = useRef<HTMLCanvasElement>(null);

  // File Stego State
  const [hostImage, setHostImage] = useState<File | null>(null);
  const [secretFile, setSecretFile] = useState<File | null>(null);
  const [isFileProcessing, setIsFileProcessing] = useState(false);
  const [fileProgress, setFileProgress] = useState(0);
  const fileCanvasRef = useRef<HTMLCanvasElement>(null);

  const { t } = useLanguage();

  // --- TEXT STEGANOGRAPHY HANDLERS ---
  const handleTextImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setTextImageSrc(event.target?.result as string);
      setDecodedText('');
    };
    reader.readAsDataURL(file);
  };

  const encodeMessage = () => {
    if (!textImageSrc || !secretText) {
      notifyError('Image and secret text are required.');
      return;
    }
    setIsTextProcessing(true);
    const canvas = textCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    const img = new Image();

    img.onload = () => {
      if (!canvas || !ctx) return;
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;

      const textToHide = secretText + '|||END|||';
      let binStr = '';
      for (let i = 0; i < textToHide.length; i++) {
        const bin = textToHide.charCodeAt(i).toString(2);
        binStr += '00000000'.slice(bin.length) + bin;
      }

      if (binStr.length > (data.length / 4) * 3) {
        setIsTextProcessing(false);
        notifyError('Image is too small to hold this much text.');
        return;
      }

      let binIdx = 0;
      for (let i = 0; i < data.length; i += 4) {
        if (binIdx < binStr.length) { data[i] = (data[i] & 254) | parseInt(binStr[binIdx++]); }
        if (binIdx < binStr.length) { data[i + 1] = (data[i + 1] & 254) | parseInt(binStr[binIdx++]); }
        if (binIdx < binStr.length) { data[i + 2] = (data[i + 2] & 254) | parseInt(binStr[binIdx++]); }
      }

      ctx.putImageData(imgData, 0, 0);
      setTextImageSrc(canvas.toDataURL('image/png'));
      setIsTextProcessing(false);
      setSecretText('');
      notifyCompleted('Encoded', 'Secret message hidden successfully! Click Download Image.');
    };
    img.src = textImageSrc;
  };

  const decodeMessage = () => {
    if (!textImageSrc) return;
    setIsTextProcessing(true);

    const canvas = textCanvasRef.current;
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
        binStr += (data[i + 1] & 1).toString();
        binStr += (data[i + 2] & 1).toString();
      }

      let result = '';
      for (let i = 0; i < binStr.length; i += 8) {
        const byte = binStr.slice(i, i + 8);
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
      setIsTextProcessing(false);

      if (result) {
        notifyCompleted('Decoded', 'Secret message found and extracted!');
      } else {
        notifyError('Could not find a valid hidden message in this image.');
      }
    };
    img.src = textImageSrc;
  };

  const downloadTextImage = () => {
    if (!textImageSrc) return;
    const a = document.createElement('a');
    a.href = textImageSrc;
    a.download = 'secret_stego_image.png';
    a.click();
    notifyDownloaded('secret_stego_image.png');
  };

  // --- FILE STEGANOGRAPHY HANDLERS ---
  const handleHostSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const buffer = await file.arrayBuffer();
      setHostImage(new File([buffer], file.name, { type: file.type }));
    } catch {
      notifyError('Could not read carrier image into memory.');
    }
  };

  const handleSecretFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const buffer = await file.arrayBuffer();
      setSecretFile(new File([buffer], file.name, { type: file.type }));
    } catch {
      notifyError('Could not read target file into memory.');
    }
  };

  const processFileHide = async () => {
    if (!hostImage || !secretFile) {
      notifyError('Carrier image and secret file are both required.');
      return;
    }
    setIsFileProcessing(true);
    setFileProgress(15);

    try {
      const img = new Image();
      img.src = URL.createObjectURL(hostImage);
      await new Promise((resolve) => { img.onload = resolve; });

      const canvas = fileCanvasRef.current!;
      const ctx = canvas.getContext('2d')!;
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;

      const fileBuffer = await secretFile.arrayBuffer();
      const fileData = new Uint8Array(fileBuffer);
      const fileNameBytes = new TextEncoder().encode(secretFile.name);

      const totalLen = 4 + 1 + fileNameBytes.length + 4 + fileData.length;
      const payload = new Uint8Array(totalLen);
      let offset = 0;

      // Magic 'STGO'
      payload.set([83, 84, 71, 79], offset); offset += 4;
      payload[offset] = fileNameBytes.length; offset += 1;
      payload.set(fileNameBytes, offset); offset += fileNameBytes.length;
      const sizeView = new DataView(new ArrayBuffer(4));
      sizeView.setUint32(0, fileData.length);
      payload.set(new Uint8Array(sizeView.buffer), offset); offset += 4;
      payload.set(fileData, offset);

      // Max capacity check
      const maxBytes = Math.floor(((pixels.length / 4) * 3 * 2) / 8);
      if (payload.length > maxBytes) {
        throw new Error(`Carrier image is too small! Need ${Math.ceil(payload.length / 1024)} KB, but image only holds ${Math.ceil(maxBytes / 1024)} KB.`);
      }

      let pIdx = 0;
      for (let i = 0; i < payload.length; i++) {
        const byte = payload[i];
        for (let bit = 0; bit < 4; bit++) {
          const chunk = (byte >> (bit * 2)) & 3;
          pixels[pIdx] = (pixels[pIdx] & 0xFC) | chunk;
          pIdx++;
          if ((pIdx + 1) % 4 === 0) pIdx++;
        }
        if (i % 1000 === 0) setFileProgress(15 + (i / payload.length) * 75);
      }

      ctx.putImageData(imageData, 0, 0);

      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('Failed to create result PNG.');

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const outName = `stego_${hostImage.name.split('.')[0]}.png`;
      link.download = outName;
      link.href = url;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 10000);

      notifyDownloaded(outName);
      notifyCompleted('Stealth Embedding Complete', `${secretFile.name} embedded securely into ${outName}`);
    } catch (err: any) {
      notifyError(err.message || 'Failed to embed file');
    } finally {
      setIsFileProcessing(false);
      setFileProgress(0);
    }
  };

  const processFileReveal = async () => {
    if (!hostImage) {
      notifyError('Please select a carrier PNG image.');
      return;
    }
    setIsFileProcessing(true);
    setFileProgress(25);

    try {
      const img = new Image();
      const objectUrl = URL.createObjectURL(hostImage);
      img.src = objectUrl;

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => reject(new Error('Failed to load image for extraction.'));
      });

      const canvas = fileCanvasRef.current!;
      const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(objectUrl);

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

      const magicBytes = getBytes(4);
      const magic = new TextDecoder().decode(magicBytes);
      if (magic !== 'STGO') {
        throw new Error('No hidden file found! Ensure this is a lossless PNG saved by this tool.');
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

      notifyDownloaded(fileName);
      notifyCompleted('Extraction Complete', `Extracted "${fileName}" (${(fileSize / 1024).toFixed(1)} KB)`);
    } catch (err: any) {
      notifyError(err.message || 'Extraction failed');
    } finally {
      setIsFileProcessing(false);
      setFileProgress(0);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16 px-4">
      {/* Header & Mode Switcher */}
      <Card className="border shadow-xl bg-card overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20">
                <EyeOff className="w-8 h-8 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="text-3xl font-black tracking-tight">Steganography Studio</CardTitle>
                <CardDescription className="text-white/70 font-semibold">
                  Embed invisible secrets inside image pixels using LSB steganography
                </CardDescription>
              </div>
            </div>

            {/* Top-Level Mode: Text vs File */}
            <div className="flex p-1 bg-black/40 rounded-xl border border-white/10">
              <button
                onClick={() => setMode('text')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-black transition-all ${
                  mode === 'text'
                    ? 'bg-primary text-primary-foreground shadow-lg'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" /> Text Secret
              </button>
              <button
                onClick={() => setMode('file')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-black transition-all ${
                  mode === 'file'
                    ? 'bg-primary text-primary-foreground shadow-lg'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <FileArchive className="w-3.5 h-3.5" /> File / ZIP Secret
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-8">
          <AnimatePresence mode="wait">
            {mode === 'text' ? (
              <motion.div
                key="text-mode"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex border-b pb-4 gap-4">
                  <Button
                    variant={textAction === 'encode' ? 'default' : 'outline'}
                    onClick={() => setTextAction('encode')}
                    className="font-bold gap-2"
                  >
                    <EyeOff className="w-4 h-4" /> Hide Text in Image
                  </Button>
                  <Button
                    variant={textAction === 'decode' ? 'default' : 'outline'}
                    onClick={() => setTextAction('decode')}
                    className="font-bold gap-2"
                  >
                    <Eye className="w-4 h-4" /> Extract Text from Image
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Image Carrier Box */}
                  <div className="space-y-4">
                    <label className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" /> Carrier Image (PNG Recommended)
                    </label>
                    <div className="border-2 border-dashed border-primary/20 rounded-2xl p-6 text-center hover:border-primary/50 transition-colors bg-muted/20">
                      {textImageSrc ? (
                        <div className="space-y-4">
                          <img
                            src={textImageSrc}
                            alt="Carrier Preview"
                            className="max-h-60 mx-auto rounded-xl object-contain border shadow-sm"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setTextImageSrc(null)}
                            className="text-xs font-bold"
                          >
                            Change Image
                          </Button>
                        </div>
                      ) : (
                        <label className="cursor-pointer flex flex-col items-center justify-center gap-3 py-8">
                          <Upload className="w-10 h-10 text-muted-foreground/60" />
                          <span className="text-sm font-bold text-foreground">Click or Drag Image Here</span>
                          <span className="text-xs text-muted-foreground">Supports PNG, JPG, WebP</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleTextImageUpload}
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Text Input / Output */}
                  <div className="space-y-4 flex flex-col justify-between">
                    {textAction === 'encode' ? (
                      <div className="space-y-4">
                        <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                          Secret Message to Hide
                        </label>
                        <Textarea
                          placeholder="Type or paste confidential message..."
                          value={secretText}
                          onChange={(e) => setSecretText(e.target.value)}
                          rows={6}
                          className="font-mono text-sm resize-none rounded-xl"
                        />
                        <div className="flex gap-3">
                          <Button
                            onClick={encodeMessage}
                            disabled={!textImageSrc || !secretText || isTextProcessing}
                            className="w-full font-black py-6 rounded-xl"
                          >
                            {isTextProcessing ? 'Encoding Pixels...' : 'Hide Secret in Image'}
                          </Button>
                          {textImageSrc && (
                            <Button
                              variant="outline"
                              onClick={downloadTextImage}
                              className="font-black px-6 rounded-xl"
                            >
                              <Download className="w-4 h-4 mr-2" /> Download
                            </Button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                          Extracted Secret Message
                        </label>
                        <Textarea
                          readOnly
                          placeholder="Decoded hidden text will appear here..."
                          value={decodedText}
                          rows={6}
                          className="font-mono text-sm resize-none rounded-xl bg-muted/30"
                        />
                        <div className="flex gap-3">
                          <Button
                            onClick={decodeMessage}
                            disabled={!textImageSrc || isTextProcessing}
                            className="w-full font-black py-6 rounded-xl"
                          >
                            {isTextProcessing ? 'Scanning Pixels...' : 'Extract Hidden Message'}
                          </Button>
                          {decodedText && (
                            <Button
                              variant="outline"
                              onClick={() => {
                                navigator.clipboard.writeText(decodedText);
                                notifyCopied('Secret message');
                              }}
                              className="font-black px-6 rounded-xl"
                            >
                              Copy
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <canvas ref={textCanvasRef} className="hidden" />
              </motion.div>
            ) : (
              <motion.div
                key="file-mode"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex border-b pb-4 gap-4">
                  <Button
                    variant={fileAction === 'hide' ? 'default' : 'outline'}
                    onClick={() => setFileAction('hide')}
                    className="font-bold gap-2"
                  >
                    <FileArchive className="w-4 h-4" /> Hide File / ZIP in Image
                  </Button>
                  <Button
                    variant={fileAction === 'reveal' ? 'default' : 'outline'}
                    onClick={() => setFileAction('reveal')}
                    className="font-bold gap-2"
                  >
                    <FileCode className="w-4 h-4" /> Extract Hidden File from Image
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Carrier Image */}
                  <div className="space-y-4">
                    <label className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" /> {fileAction === 'hide' ? 'Carrier Image (Host)' : 'Stego Image with Hidden File'}
                    </label>
                    <div className="border-2 border-dashed border-primary/20 rounded-2xl p-6 text-center hover:border-primary/50 transition-colors bg-muted/20">
                      {hostImage ? (
                        <div className="space-y-3">
                          <p className="font-bold text-sm text-foreground truncate">{hostImage.name}</p>
                          <p className="text-xs text-muted-foreground">{(hostImage.size / 1024).toFixed(1)} KB</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setHostImage(null)}
                            className="text-xs font-bold"
                          >
                            Change Carrier
                          </Button>
                        </div>
                      ) : (
                        <label className="cursor-pointer flex flex-col items-center justify-center gap-3 py-8">
                          <Upload className="w-10 h-10 text-muted-foreground/60" />
                          <span className="text-sm font-bold text-foreground">Select Carrier Image</span>
                          <span className="text-xs text-muted-foreground">PNG, JPG, WebP</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleHostSelect}
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Target Secret File (Only in Hide mode) */}
                  {fileAction === 'hide' ? (
                    <div className="space-y-4">
                      <label className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <FileArchive className="w-4 h-4" /> Secret Payload File (ZIP, PDF, Doc, Any)
                      </label>
                      <div className="border-2 border-dashed border-primary/20 rounded-2xl p-6 text-center hover:border-primary/50 transition-colors bg-muted/20">
                        {secretFile ? (
                          <div className="space-y-3">
                            <p className="font-bold text-sm text-foreground truncate">{secretFile.name}</p>
                            <p className="text-xs text-muted-foreground">{(secretFile.size / 1024).toFixed(1)} KB</p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSecretFile(null)}
                              className="text-xs font-bold"
                            >
                              Change File
                            </Button>
                          </div>
                        ) : (
                          <label className="cursor-pointer flex flex-col items-center justify-center gap-3 py-8">
                            <FileArchive className="w-10 h-10 text-muted-foreground/60" />
                            <span className="text-sm font-bold text-foreground">Select Secret File</span>
                            <span className="text-xs text-muted-foreground">Any file type (ZIP, PDF, TXT, etc.)</span>
                            <input
                              type="file"
                              className="hidden"
                              onChange={handleSecretFileSelect}
                            />
                          </label>
                        )}
                      </div>

                      <Button
                        onClick={processFileHide}
                        disabled={!hostImage || !secretFile || isFileProcessing}
                        className="w-full font-black py-6 rounded-xl mt-4"
                      >
                        {isFileProcessing ? `Embedding (${Math.round(fileProgress)}%)...` : 'Embed File & Download Stego Image'}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4 flex flex-col justify-center">
                      <div className="p-6 rounded-2xl bg-muted/30 border space-y-3">
                        <div className="flex items-center gap-2 text-primary font-black text-sm">
                          <ShieldCheck className="w-5 h-5" />
                          <span>Lossless Bit Extraction</span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Extracts the embedded binary stream, recovers the original file name, verifies the integrity header, and triggers a direct browser download of your recovered secret file.
                        </p>
                      </div>

                      <Button
                        onClick={processFileReveal}
                        disabled={!hostImage || isFileProcessing}
                        className="w-full font-black py-6 rounded-xl"
                      >
                        {isFileProcessing ? `Extracting (${Math.round(fileProgress)}%)...` : 'Extract Hidden File'}
                      </Button>
                    </div>
                  )}
                </div>
                <canvas ref={fileCanvasRef} className="hidden" />
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}
