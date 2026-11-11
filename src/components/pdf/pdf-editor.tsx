'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Edit3, Type, Image as ImageIcon, 
  Trash2, Download, Loader2, 
  ChevronLeft, ChevronRight, Eraser, PenTool, Check, X
} from 'lucide-react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as pdfjs from 'pdfjs-dist';
import { notifyCompleted, notifyError } from '@/lib/notify';

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

type EditElement = {
  id: string;
  type: 'text' | 'image' | 'whiteout';
  content: string;
  x: number;
  y: number;
  page: number;
  fontSize: number;
  color: string;
  width: number;
  height: number;
};

const hexToRgbColor = (hex: string) => {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return rgb(0, 0, 0);
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  return rgb(isNaN(r) ? 0 : r, isNaN(g) ? 0 : g, isNaN(b) ? 0 : b);
};

export default function PdfEditor() {
  const [file, setFile] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjs.PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [elements, setElements] = useState<EditElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [sigColor, setSigColor] = useState('#0f172a');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sigCanvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setFile(f);
      try {
        const arrayBuffer = await f.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
        setPdfDoc(pdf);
        setCurrentPage(1);
        setElements([]);
      } catch (err: any) {
        if (err?.name === 'PasswordException' || err?.message?.includes('password')) {
          notifyError('Protected PDF', 'This PDF is password-protected and cannot be edited.');
          setFile(null);
        } else {
          notifyError('Load Failed', 'Failed to read PDF document.');
        }
      }
    }
  };

  const renderPage = async () => {
    if (!pdfDoc || !canvasRef.current) return;
    try {
      const page = await pdfDoc.getPage(currentPage);
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      if (context) {
        await page.render({ canvasContext: context, viewport }).promise;
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    renderPage();
  }, [pdfDoc, currentPage]);

  const addText = () => {
    const newEl: EditElement = {
      id: Math.random().toString(36).substring(2, 9),
      type: 'text',
      content: 'Click to edit text',
      x: 60,
      y: 60,
      page: currentPage,
      fontSize: 16,
      color: '#000000',
      width: 160,
      height: 24,
    };
    setElements([...elements, newEl]);
    setSelectedId(newEl.id);
  };

  const addWhiteout = () => {
    const newEl: EditElement = {
      id: Math.random().toString(36).substring(2, 9),
      type: 'whiteout',
      content: '',
      x: 100,
      y: 100,
      page: currentPage,
      fontSize: 0,
      color: '#FFFFFF',
      width: 120,
      height: 35,
    };
    setElements([...elements, newEl]);
    setSelectedId(newEl.id);
  };

  const addImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newEl: EditElement = {
          id: Math.random().toString(36).substring(2, 9),
          type: 'image',
          content: event.target?.result as string,
          x: 100,
          y: 100,
          page: currentPage,
          fontSize: 0,
          color: '',
          width: 160,
          height: 100,
        };
        setElements([...elements, newEl]);
        setSelectedId(newEl.id);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  // Signature canvas handlers
  const startSigDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    isDrawingRef.current = true;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const drawSig = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.strokeStyle = sigColor;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopSigDrawing = () => {
    isDrawingRef.current = false;
  };

  const clearSignature = () => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const insertSignature = () => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const newEl: EditElement = {
      id: Math.random().toString(36).substring(2, 9),
      type: 'image',
      content: dataUrl,
      x: 100,
      y: 120,
      page: currentPage,
      fontSize: 0,
      color: '',
      width: 160,
      height: 70,
    };
    setElements([...elements, newEl]);
    setSelectedId(newEl.id);
    setIsSigning(false);
  };

  const updateElement = (id: string, updates: Partial<EditElement>) => {
    setElements(elements.map((el) => (el.id === id ? { ...el, ...updates } : el)));
  };

  const removeElement = (id: string) => {
    setElements(elements.filter((el) => el.id !== id));
    setSelectedId(null);
  };

  const savePdf = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const existingPdfBytes = await file.arrayBuffer();
      const pdfDocLib = await PDFDocument.load(existingPdfBytes, { ignoreEncryption: true });
      const pages = pdfDocLib.getPages();
      const helveticaFont = await pdfDocLib.embedFont(StandardFonts.HelveticaBold);

      const canvas = canvasRef.current;
      if (!canvas) return;

      for (const el of elements) {
        const pageIndex = el.page - 1;
        if (pageIndex < 0 || pageIndex >= pages.length) continue;

        const page = pages[pageIndex];
        const { width: pWidth, height: pHeight } = page.getSize();

        const scaleX = pWidth / canvas.width;
        const scaleY = pHeight / canvas.height;

        const pdfX = el.x * scaleX;
        const pdfY =
          pHeight -
          el.y * scaleY -
          (el.type === 'text' ? el.fontSize * scaleY : el.height * scaleY);

        if (el.type === 'text') {
          page.drawText(el.content, {
            x: pdfX,
            y: pdfY,
            size: el.fontSize * scaleY,
            font: helveticaFont,
            color: hexToRgbColor(el.color || '#000000'),
          });
        } else if (el.type === 'image') {
          const imgBytes = await fetch(el.content).then((res) => res.arrayBuffer());
          const img = el.content.includes('png')
            ? await pdfDocLib.embedPng(imgBytes)
            : await pdfDocLib.embedJpg(imgBytes);

          page.drawImage(img, {
            x: pdfX,
            y: pdfY,
            width: el.width * scaleX,
            height: el.height * scaleY,
          });
        } else if (el.type === 'whiteout') {
          page.drawRectangle({
            x: pdfX,
            y: pdfY,
            width: el.width * scaleX,
            height: el.height * scaleY,
            color: rgb(1, 1, 1),
          });
        }
      }

      const pdfBytes = await pdfDocLib.save();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `edited_${file.name}`;
      link.click();

      notifyCompleted(
        'Edited PDF Downloaded',
        `Saved document with ${elements.length} applied annotation(s).`
      );
    } catch (err: any) {
      console.error(err);
      notifyError('Failed to save edited PDF', err?.message || 'Error processing PDF document.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="border-none shadow-2xl bg-card/80 backdrop-blur-xl overflow-hidden">
      <CardHeader className="bg-amber-500/10 border-b border-amber-500/20 p-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-500 text-white rounded-xl shadow-lg">
              <Edit3 className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-2xl font-black">Pro PDF Editor & Signer</CardTitle>
              <CardDescription className="text-amber-700 dark:text-amber-400 font-bold text-xs uppercase tracking-wider">
                Add text, erase content, and place digital signatures offline
              </CardDescription>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={savePdf}
              disabled={!file || isProcessing}
              className="bg-amber-600 hover:bg-amber-700 font-black gap-2 rounded-xl shadow-lg shadow-amber-600/20"
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              <span>SAVE & DOWNLOAD</span>
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 flex flex-col md:flex-row h-[750px]">
        {/* Sidebar */}
        <div className="w-full md:w-80 bg-muted/30 border-r p-6 space-y-6 overflow-y-auto">
          {!file ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
              <input
                type="file"
                accept="application/pdf"
                onChange={handleFileSelect}
                id="pdf-upload-vis"
                className="hidden"
              />
              <label
                htmlFor="pdf-upload-vis"
                className="cursor-pointer p-8 border-4 border-dashed rounded-3xl hover:bg-amber-500/5 transition-colors"
              >
                <Edit3 className="w-12 h-12 text-muted-foreground mx-auto mb-2 opacity-30" />
                <p className="font-bold text-sm">Upload PDF to start</p>
              </label>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                  Editor Tools
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={addText}
                    variant="outline"
                    className="h-12 font-bold rounded-xl border gap-1.5 text-xs hover:bg-amber-500/10 hover:border-amber-500/30"
                  >
                    <Type className="w-4 h-4 text-amber-600" />
                    <span>Add Text</span>
                  </Button>

                  <Button
                    onClick={() => setIsSigning(true)}
                    variant="outline"
                    className="h-12 font-bold rounded-xl border gap-1.5 text-xs hover:bg-amber-500/10 hover:border-amber-500/30"
                  >
                    <PenTool className="w-4 h-4 text-amber-600" />
                    <span>Sign PDF</span>
                  </Button>

                  <label className="flex items-center justify-center h-12 font-bold rounded-xl border cursor-pointer hover:bg-amber-500/10 hover:border-amber-500/30 transition-all text-xs gap-1.5 bg-card">
                    <ImageIcon className="w-4 h-4 text-amber-600" />
                    <span>Add Image</span>
                    <input type="file" accept="image/*" onChange={addImage} className="hidden" />
                  </label>

                  <Button
                    onClick={addWhiteout}
                    variant="outline"
                    className="h-12 font-bold rounded-xl border gap-1.5 text-xs hover:bg-amber-500/10 hover:border-amber-500/30"
                  >
                    <Eraser className="w-4 h-4 text-amber-600" />
                    <span>Whiteout</span>
                  </Button>
                </div>
              </div>

              {/* Selected Element Properties */}
              {selectedId && (
                <div className="space-y-4 p-4 bg-card rounded-2xl border shadow-sm animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-amber-600">Properties</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeElement(selectedId)}
                      className="h-7 w-7 text-rose-500 hover:bg-rose-500/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>

                  {elements.find((e) => e.id === selectedId)?.type === 'text' ? (
                    <div className="space-y-3">
                      <Input
                        value={elements.find((e) => e.id === selectedId)?.content || ''}
                        onChange={(e) => updateElement(selectedId, { content: e.target.value })}
                        className="font-bold border focus-visible:ring-amber-500 h-9 text-xs"
                        placeholder="Text content..."
                      />

                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Font Color</span>
                        <div className="flex gap-2">
                          {[
                            { hex: '#000000', label: 'Black' },
                            { hex: '#1d4ed8', label: 'Blue' },
                            { hex: '#dc2626', label: 'Red' },
                            { hex: '#16a34a', label: 'Green' },
                          ].map((c) => (
                            <button
                              key={c.hex}
                              type="button"
                              onClick={() => updateElement(selectedId, { color: c.hex })}
                              className={`w-6 h-6 rounded-full border-2 transition-all ${
                                elements.find((e) => e.id === selectedId)?.color === c.hex
                                  ? 'ring-2 ring-amber-500 ring-offset-1 border-white'
                                  : 'border-transparent'
                              }`}
                              style={{ backgroundColor: c.hex }}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">
                          Font Size ({elements.find((e) => e.id === selectedId)?.fontSize}px)
                        </span>
                        <input
                          type="range"
                          min={10}
                          max={48}
                          value={elements.find((e) => e.id === selectedId)?.fontSize || 16}
                          onChange={(e) => updateElement(selectedId, { fontSize: parseInt(e.target.value, 10) })}
                          className="w-full accent-amber-600 cursor-pointer"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-muted-foreground">Width</span>
                          <Input
                            type="number"
                            value={elements.find((e) => e.id === selectedId)?.width}
                            onChange={(e) => updateElement(selectedId, { width: Number(e.target.value) })}
                            className="h-8 text-xs font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-muted-foreground">Height</span>
                          <Input
                            type="number"
                            value={elements.find((e) => e.id === selectedId)?.height}
                            onChange={(e) => updateElement(selectedId, { height: Number(e.target.value) })}
                            className="h-8 text-xs font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  <p className="text-[10px] text-muted-foreground italic">Drag on PDF to reposition.</p>
                </div>
              )}

              {/* Page Navigation */}
              <div className="space-y-2 pt-2">
                <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                  Page Navigation
                </Label>
                <div className="flex items-center justify-between bg-card border rounded-2xl p-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="rounded-xl h-8 w-8"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="font-bold text-xs">
                    Page {currentPage} of {pdfDoc?.numPages || 1}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCurrentPage((p) => Math.min(pdfDoc?.numPages || 1, p + 1))}
                    disabled={currentPage === pdfDoc?.numPages}
                    className="rounded-xl h-8 w-8"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* PDF Canvas Workspace */}
        <div
          className="flex-1 bg-muted/10 overflow-auto p-8 relative flex justify-center items-start"
          ref={containerRef}
        >
          {file && (
            <div
              className="relative shadow-2xl border-4 border-white bg-white"
              style={{ width: canvasRef.current?.width, height: canvasRef.current?.height }}
            >
              <canvas ref={canvasRef} className="pointer-events-none" />

              {/* Elements Overlay */}
              {elements
                .filter((el) => el.page === currentPage)
                .map((el) => (
                  <div
                    key={el.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedId(el.id);
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setSelectedId(el.id);
                      const startX = e.clientX - el.x;
                      const startY = e.clientY - el.y;

                      const handleMove = (moveEvent: MouseEvent) => {
                        updateElement(el.id, {
                          x: moveEvent.clientX - startX,
                          y: moveEvent.clientY - startY,
                        });
                      };

                      const handleUp = () => {
                        window.removeEventListener('mousemove', handleMove);
                        window.removeEventListener('mouseup', handleUp);
                      };
                      window.addEventListener('mousemove', handleMove);
                      window.addEventListener('mouseup', handleUp);
                    }}
                    className={`absolute cursor-move select-none transition-shadow ${
                      selectedId === el.id
                        ? 'ring-2 ring-amber-500 ring-offset-2 z-50'
                        : 'hover:ring-1 hover:ring-amber-300 z-10'
                    }`}
                    style={{
                      left: el.x,
                      top: el.y,
                      padding: el.type === 'text' ? '4px' : '0',
                      backgroundColor: el.type === 'whiteout' ? '#FFFFFF' : 'transparent',
                      width: el.type !== 'text' ? el.width : 'auto',
                      height: el.type !== 'text' ? el.height : 'auto',
                      border: el.type === 'whiteout' ? '1px dashed #94a3b8' : 'none',
                    }}
                  >
                    {el.type === 'text' ? (
                      <span
                        style={{
                          fontSize: el.fontSize,
                          color: el.color || '#000000',
                          whiteSpace: 'nowrap',
                          fontWeight: 'bold',
                          fontFamily: 'Arial, sans-serif',
                        }}
                      >
                        {el.content}
                      </span>
                    ) : el.type === 'image' ? (
                      <img
                        src={el.content}
                        style={{ width: el.width, height: el.height }}
                        draggable={false}
                        className="block object-contain"
                        alt="Signature/Stamp"
                      />
                    ) : (
                      <div className="w-full h-full" />
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>
      </CardContent>

      {/* Signature Pad Dialog Modal */}
      {isSigning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-card border-2 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PenTool className="w-4 h-4 text-amber-600" />
                <h3 className="font-black text-lg">Draw Digital Signature</h3>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSigning(false)}
                className="h-8 w-8 rounded-full"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Sign below using your mouse, trackpad, or touchscreen:
            </p>

            <div className="border-2 border-dashed border-amber-500/40 rounded-2xl bg-white overflow-hidden">
              <canvas
                ref={sigCanvasRef}
                width={380}
                height={160}
                onMouseDown={startSigDrawing}
                onMouseMove={drawSig}
                onMouseUp={stopSigDrawing}
                onMouseLeave={stopSigDrawing}
                className="cursor-crosshair w-full block"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Ink:</span>
                {[
                  { hex: '#0f172a', label: 'Dark' },
                  { hex: '#1d4ed8', label: 'Blue' },
                  { hex: '#b91c1c', label: 'Red' },
                ].map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setSigColor(c.hex)}
                    className={`w-5 h-5 rounded-full border-2 transition-all ${
                      sigColor === c.hex ? 'ring-2 ring-amber-500 ring-offset-1 border-white' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={clearSignature}
                className="text-xs font-bold rounded-xl h-8"
              >
                Clear
              </Button>
            </div>

            <Button
              onClick={insertSignature}
              className="w-full h-12 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-sm gap-2 shadow-lg"
            >
              <Check className="w-4 h-4" />
              <span>INSERT SIGNATURE ONTO PAGE {currentPage}</span>
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
