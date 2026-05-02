'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Edit3, Type, Image as ImageIcon, 
  Trash2, Download, Loader2, 
  ChevronLeft, ChevronRight, Save, Plus, Move, Eraser, Square
} from 'lucide-react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as pdfjs from 'pdfjs-dist';
import { useToast } from '@/hooks/use-toast';

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

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

export default function PdfEditor() {
  const [file, setFile] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjs.PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [elements, setElements] = useState<EditElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

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
          toast({ title: "🔒 Protected PDF", description: "This PDF is password-protected and cannot be edited.", variant: "destructive" });
          setFile(null);
        } else {
          toast({ title: "Failed to load PDF", variant: "destructive" });
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
      id: Math.random().toString(36).substr(2, 9),
      type: 'text',
      content: 'Edit this text',
      x: 50,
      y: 50,
      page: currentPage,
      fontSize: 16,
      color: '#000000',
      width: 150,
      height: 20
    };
    setElements([...elements, newEl]);
    setSelectedId(newEl.id);
  };

  const addWhiteout = () => {
    const newEl: EditElement = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'whiteout',
      content: '',
      x: 100,
      y: 100,
      page: currentPage,
      fontSize: 0,
      color: '#FFFFFF',
      width: 100,
      height: 30
    };
    setElements([...elements, newEl]);
    setSelectedId(newEl.id);
  };

  const addImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newEl: EditElement = {
          id: Math.random().toString(36).substr(2, 9),
          type: 'image',
          content: event.target?.result as string,
          x: 100,
          y: 100,
          page: currentPage,
          fontSize: 0,
          color: '',
          width: 150,
          height: 100
        };
        setElements([...elements, newEl]);
        setSelectedId(newEl.id);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const updateElement = (id: string, updates: Partial<EditElement>) => {
    setElements(elements.map(el => el.id === id ? { ...el, ...updates } : el));
  };

  const removeElement = (id: string) => {
    setElements(elements.filter(el => el.id !== id));
    setSelectedId(null);
  };

  const savePdf = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const existingPdfBytes = await file.arrayBuffer();
      const pdfDocLib = await PDFDocument.load(existingPdfBytes);
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
        const pdfY = pHeight - (el.y * scaleY) - (el.type === 'text' ? (el.fontSize * scaleY) : (el.height * scaleY));

        if (el.type === 'text') {
          page.drawText(el.content, {
            x: pdfX,
            y: pdfY,
            size: el.fontSize * scaleY,
            font: helveticaFont,
            color: rgb(0, 0, 0),
          });
        } else if (el.type === 'image') {
          const imgBytes = await fetch(el.content).then(res => res.arrayBuffer());
          const img = el.content.includes('png') ? await pdfDocLib.embedPng(imgBytes) : await pdfDocLib.embedJpg(imgBytes);
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
            color: rgb(1, 1, 1), // White
          });
        }
      }

      const pdfBytes = await pdfDocLib.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `edited_${file.name}`;
      link.click();
      toast({ title: "Saved!", description: "Edited PDF downloaded successfully." });
    } catch (err) {
      console.error(err);
      toast({ title: "Error saving PDF", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="border-none shadow-2xl bg-card/80 backdrop-blur-xl overflow-hidden">
      <CardHeader className="bg-amber-500/10 border-b border-amber-500/20 p-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-500 text-white rounded-xl shadow-lg"><Edit3 className="w-6 h-6" /></div>
            <div>
              <CardTitle className="text-2xl font-black">Visual PDF Editor</CardTitle>
              <CardDescription className="text-amber-700 font-bold text-xs uppercase tracking-widest">Edit, Erase and Add Content</CardDescription>
            </div>
          </div>
          <div className="flex gap-2">
             <Button onClick={savePdf} disabled={!file || isProcessing} className="bg-amber-600 hover:bg-amber-700 font-black gap-2 rounded-xl shadow-lg shadow-amber-600/20">
               {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} SAVE PDF
             </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0 flex flex-col md:flex-row h-[700px]">
        {/* Sidebar */}
        <div className="w-full md:w-80 bg-muted/30 border-r p-6 space-y-8 overflow-y-auto">
          {!file ? (
             <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
               <input type="file" accept="application/pdf" onChange={handleFileSelect} id="pdf-upload-vis" className="hidden" />
               <label htmlFor="pdf-upload-vis" className="cursor-pointer p-8 border-4 border-dashed rounded-3xl hover:bg-amber-500/5 transition-colors">
                 <Edit3 className="w-12 h-12 text-muted-foreground mx-auto mb-2 opacity-30" />
                 <p className="font-bold text-sm">Upload PDF to start</p>
               </label>
             </div>
          ) : (
            <>
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Editor Tools</label>
                <div className="grid grid-cols-2 gap-3">
                  <Button onClick={addText} variant="outline" className="h-14 gap-2 font-bold rounded-xl border-2 hover:bg-amber-500/5 hover:border-amber-500/30 transition-all flex-col text-[10px]">
                    <Type className="w-5 h-5 text-amber-600" /> ADD TEXT
                  </Button>
                  <label className="flex flex-col items-center justify-center h-14 gap-2 font-bold rounded-xl border-2 cursor-pointer hover:bg-amber-500/5 hover:border-amber-500/30 transition-all text-[10px]">
                    <ImageIcon className="w-5 h-5 text-amber-600" /> ADD IMAGE
                    <input type="file" accept="image/*" onChange={addImage} className="hidden" />
                  </label>
                  <Button onClick={addWhiteout} variant="outline" className="h-14 gap-2 font-bold rounded-xl border-2 hover:bg-amber-500/5 hover:border-amber-500/30 transition-all flex-col text-[10px] col-span-2">
                    <Eraser className="w-5 h-5 text-amber-600" /> WHITEOUT / ERASE CONTENT
                  </Button>
                </div>
              </div>

              {selectedId && (
                <div className="space-y-4 p-5 bg-muted/50 rounded-2xl border-2 animate-in fade-in slide-in-from-bottom-2">
                   <div className="flex justify-between items-center">
                     <span className="text-[10px] font-black uppercase text-amber-600 tracking-widest">Properties</span>
                     <Button variant="ghost" size="icon" onClick={() => removeElement(selectedId)} className="h-8 w-8 text-rose-500 hover:bg-rose-500/10"><Trash2 className="w-4 h-4" /></Button>
                   </div>
                   
                   {elements.find(e => e.id === selectedId)?.type === 'text' ? (
                     <div className="space-y-3">
                       <Input 
                         value={elements.find(e => e.id === selectedId)?.content} 
                         onChange={(e) => updateElement(selectedId, { content: e.target.value })}
                         className="font-bold border-2 focus-visible:ring-amber-500"
                         placeholder="Text content..."
                       />
                       <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <span className="text-[9px] font-bold text-muted-foreground">Font Size</span>
                            <Input type="number" value={elements.find(e => e.id === selectedId)?.fontSize} onChange={(e) => updateElement(selectedId, { fontSize: Number(e.target.value) })} className="h-8" />
                          </div>
                       </div>
                     </div>
                   ) : (
                     <div className="space-y-2">
                       <div className="grid grid-cols-2 gap-2">
                         <div className="space-y-1">
                           <span className="text-[9px] font-bold text-muted-foreground">Width</span>
                           <Input type="number" value={elements.find(e => e.id === selectedId)?.width} onChange={(e) => updateElement(selectedId, { width: Number(e.target.value) })} className="h-8" />
                         </div>
                         <div className="space-y-1">
                           <span className="text-[9px] font-bold text-muted-foreground">Height</span>
                           <Input type="number" value={elements.find(e => e.id === selectedId)?.height} onChange={(e) => updateElement(selectedId, { height: Number(e.target.value) })} className="h-8" />
                         </div>
                       </div>
                     </div>
                   )}
                   <p className="text-[9px] text-muted-foreground leading-tight italic">Drag the element on the PDF to reposition it.</p>
                </div>
              )}

              <div className="space-y-3">
                 <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Navigation</label>
                 <div className="flex items-center justify-between bg-muted/50 border-2 rounded-2xl p-2">
                    <Button variant="ghost" size="icon" onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1} className="rounded-xl"><ChevronLeft className="w-4 h-4" /></Button>
                    <span className="font-black text-sm">Pg {currentPage} / {pdfDoc?.numPages || 1}</span>
                    <Button variant="ghost" size="icon" onClick={() => setCurrentPage(p => Math.min(pdfDoc?.numPages || 1, p+1))} disabled={currentPage === pdfDoc?.numPages} className="rounded-xl"><ChevronRight className="w-4 h-4" /></Button>
                 </div>
              </div>
            </>
          )}
        </div>

        {/* Workspace */}
        <div className="flex-1 bg-muted/10 overflow-auto p-12 relative flex justify-center items-start" ref={containerRef}>
          {file && (
            <div className="relative shadow-2xl border-4 border-white bg-white" style={{ width: canvasRef.current?.width, height: canvasRef.current?.height }}>
              <canvas ref={canvasRef} className="pointer-events-none" />
              
              {/* Overlays */}
              {elements.filter(el => el.page === currentPage).map(el => (
                <div
                  key={el.id}
                  onClick={(e) => { e.stopPropagation(); setSelectedId(el.id); }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setSelectedId(el.id);
                    const rect = canvasRef.current?.getBoundingClientRect();
                    if (!rect) return;
                    
                    const startX = e.clientX - el.x;
                    const startY = e.clientY - el.y;
                    
                    const handleMove = (moveEvent: MouseEvent) => {
                      const newX = moveEvent.clientX - startX;
                      const newY = moveEvent.clientY - startY;
                      updateElement(el.id, { x: newX, y: newY });
                    };
                    
                    const handleUp = () => {
                      window.removeEventListener('mousemove', handleMove);
                      window.removeEventListener('mouseup', handleUp);
                    };
                    window.addEventListener('mousemove', handleMove);
                    window.addEventListener('mouseup', handleUp);
                  }}
                  className={`absolute cursor-move group select-none transition-shadow ${selectedId === el.id ? 'ring-2 ring-amber-500 ring-offset-2 z-50' : 'hover:ring-1 hover:ring-amber-300 z-10'}`}
                  style={{ 
                    left: el.x, 
                    top: el.y, 
                    padding: el.type === 'text' ? '4px' : '0',
                    backgroundColor: el.type === 'whiteout' ? 'white' : 'transparent',
                    width: el.type !== 'text' ? el.width : 'auto',
                    height: el.type !== 'text' ? el.height : 'auto',
                    border: el.type === 'whiteout' ? '1px dashed #ccc' : 'none'
                  }}
                >
                  {el.type === 'text' ? (
                    <span style={{ fontSize: el.fontSize, color: el.color, whiteSpace: 'nowrap', fontWeight: 'bold', fontFamily: 'Arial, sans-serif' }}>{el.content}</span>
                  ) : el.type === 'image' ? (
                    <img src={el.content} style={{ width: el.width, height: el.height }} draggable={false} className="block" />
                  ) : (
                    <div className="w-full h-full" />
                  )}
                  {selectedId === el.id && (
                    <div className="absolute -top-3 -left-3 bg-amber-500 rounded-full p-1 text-white shadow-lg">
                      <Move className="w-3 h-3" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
