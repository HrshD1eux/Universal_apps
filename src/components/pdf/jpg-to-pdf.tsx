'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ImageIcon, FileText, Download, Loader2, Trash2, 
  MoveUp, MoveDown, Plus, Sparkles, FileImage, Settings2
} from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/language-context';
import { motion, Reorder, AnimatePresence } from 'framer-motion';

interface PDFFile {
  id: string;
  name: string;
  file: File;
  preview: string;
}

export default function JpgToPdf() {
  const [files, setFiles] = useState<PDFFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pageSize, setPageSize] = useState<'auto' | 'a4'>('auto');
  const { toast } = useToast();
  const { t } = useLanguage();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        file,
        preview: URL.createObjectURL(file)
      }));
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (id: string) => {
    setFiles(prev => {
      const filtered = prev.filter(f => f.id !== id);
      const removed = prev.find(f => f.id === id);
      if (removed) URL.revokeObjectURL(removed.preview);
      return filtered;
    });
  };

  const moveFile = (index: number, direction: 'up' | 'down') => {
    const newFiles = [...files];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= files.length) return;
    [newFiles[index], newFiles[targetIndex]] = [newFiles[targetIndex], newFiles[index]];
    setFiles(newFiles);
  };

  const convertToPdf = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    try {
      const pdfDoc = await PDFDocument.create();
      
      for (const item of files) {
        const imgBytes = await item.file.arrayBuffer();
        let img;
        try {
          if (item.file.type === 'image/png') {
            img = await pdfDoc.embedPng(imgBytes);
          } else {
            img = await pdfDoc.embedJpg(imgBytes);
          }
        } catch (e) {
          // Fallback if embedding fails (sometimes happens with specific encodings)
          console.error("Embedding failed", e);
          continue;
        }

        let width = img.width;
        let height = img.height;

        if (pageSize === 'a4') {
          // A4 dimensions in points: 595.28 x 841.89
          const a4Width = 595.28;
          const a4Height = 841.89;
          const ratio = Math.min(a4Width / width, a4Height / height);
          width *= ratio;
          height *= ratio;
          const page = pdfDoc.addPage([a4Width, a4Height]);
          page.drawImage(img, {
            x: (a4Width - width) / 2,
            y: (a4Height - height) / 2,
            width,
            height,
          });
        } else {
          const page = pdfDoc.addPage([width, height]);
          page.drawImage(img, {
            x: 0,
            y: 0,
            width,
            height,
          });
        }
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `converted_images_${new Date().getTime()}.pdf`;
      link.click();
      toast({ title: "Success", description: "Your PDF is ready for download!" });
    } catch (err) {
      toast({ title: "Error", description: "Failed to generate PDF", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 px-4">
      <Card className="border-none shadow-2xl bg-gradient-to-br from-background via-muted/50 to-background overflow-hidden font-sans">
        <CardHeader className="bg-teal-500/5 border-b border-teal-500/10 p-8">
           <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-4">
                 <div className="p-4 bg-teal-600 text-white rounded-2xl shadow-lg shadow-teal-500/20">
                    <FileImage className="w-8 h-8" />
                 </div>
                 <div>
                    <CardTitle className="text-3xl font-black tracking-tight uppercase">Image to PDF Studio</CardTitle>
                    <CardDescription className="text-base font-bold text-teal-600/60">Secure offline conversion with layout control.</CardDescription>
                 </div>
              </div>

              <div className="flex p-1 bg-muted rounded-2xl border-2">
                 <button 
                   onClick={() => setPageSize('auto')} 
                   className={`px-6 py-2 rounded-xl text-[10px] font-black transition-all ${pageSize === 'auto' ? 'bg-background shadow-lg text-teal-600 scale-105' : 'text-muted-foreground'}`}
                 >
                   FIT IMAGE
                 </button>
                 <button 
                   onClick={() => setPageSize('a4')} 
                   className={`px-6 py-2 rounded-xl text-[10px] font-black transition-all ${pageSize === 'a4' ? 'bg-background shadow-lg text-teal-600 scale-105' : 'text-muted-foreground'}`}
                 >
                   A4 PAPER
                 </button>
              </div>
           </div>
        </CardHeader>

        <CardContent className="p-8">
           <div className="grid grid-cols-1 lg:grid-cols-[1.5fr,1fr] gap-12">
              <div className="space-y-6">
                 <div className="relative group">
                    <input 
                      type="file" 
                      multiple 
                      accept="image/jpeg,image/png" 
                      onChange={handleFileSelect} 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" 
                    />
                    <div className="h-40 border-4 border-dashed border-teal-500/20 rounded-[2.5rem] flex flex-col items-center justify-center bg-teal-500/5 group-hover:bg-teal-500/10 transition-all border-spacing-4">
                       <Plus className="w-10 h-10 text-teal-600 mb-2 opacity-40 group-hover:scale-125 transition-transform" />
                       <p className="text-sm font-black text-teal-600/60 uppercase tracking-widest">Add Images (JPG / PNG)</p>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                       <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Selected Pages ({files.length})</p>
                       {files.length > 0 && <Button variant="ghost" onClick={() => setFiles([])} className="h-6 text-[10px] font-black text-rose-500 uppercase">Clear All</Button>}
                    </div>
                    
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                       <AnimatePresence initial={false}>
                          {files.map((file, index) => (
                             <motion.div
                               key={file.id}
                               layout
                               initial={{ opacity: 0, x: -20 }}
                               animate={{ opacity: 1, x: 0 }}
                               exit={{ opacity: 0, x: 20 }}
                               className="p-4 bg-card border-2 rounded-2xl flex items-center gap-4 group hover:border-teal-500/30 transition-all shadow-sm"
                             >
                                <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                                   <img src={file.preview} alt="preview" className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-grow">
                                   <p className="text-xs font-black truncate max-w-[150px]">{file.name}</p>
                                   <p className="text-[9px] font-bold opacity-40 uppercase tracking-tighter">Page {index + 1}</p>
                                </div>
                                <div className="flex items-center gap-1">
                                   <Button variant="ghost" size="icon" onClick={() => moveFile(index, 'up')} disabled={index === 0} className="h-8 w-8 rounded-lg"><MoveUp className="w-3 h-3" /></Button>
                                   <Button variant="ghost" size="icon" onClick={() => moveFile(index, 'down')} disabled={index === files.length - 1} className="h-8 w-8 rounded-lg"><MoveDown className="w-3 h-3" /></Button>
                                   <Button variant="ghost" size="icon" onClick={() => removeFile(file.id)} className="h-8 w-8 rounded-lg text-rose-500 hover:bg-rose-50"><Trash2 className="w-3 h-3" /></Button>
                                </div>
                             </motion.div>
                          ))}
                       </AnimatePresence>
                       {files.length === 0 && (
                          <div className="py-20 text-center opacity-20 border-2 border-dashed rounded-[2rem]">
                             <ImageIcon className="w-12 h-12 mx-auto mb-2" />
                             <p className="text-[10px] font-black uppercase tracking-widest">No images selected</p>
                          </div>
                       )}
                    </div>
                 </div>
              </div>

              <div className="space-y-8">
                 <div className="p-10 rounded-[3rem] bg-teal-600 text-white shadow-2xl relative overflow-hidden group">
                    <Sparkles className="absolute top-0 right-0 p-8 w-40 h-40 opacity-10 group-hover:scale-110 transition-transform" />
                    <div className="relative z-10 space-y-8">
                       <div>
                          <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Output Quality</p>
                          <p className="text-4xl font-black">100% <span className="text-xl opacity-60 font-medium tracking-normal italic uppercase">Lossless</span></p>
                       </div>
                       
                       <div className="space-y-4 pt-8 border-t border-white/10">
                          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                             <span>Security Protocol</span>
                             <span className="text-teal-200">Local Only</span>
                          </div>
                          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                             <span>Privacy</span>
                             <span className="text-teal-200">Zero-Upload</span>
                          </div>
                       </div>
                    </div>
                 </div>

                 <Button 
                   className="w-full h-24 rounded-[2rem] bg-teal-600 hover:bg-teal-700 text-white font-black text-xl gap-3 shadow-xl group disabled:opacity-50"
                   disabled={files.length === 0 || isProcessing}
                   onClick={convertToPdf}
                 >
                    {isProcessing ? (
                       <Loader2 className="w-8 h-8 animate-spin" />
                    ) : (
                       <>
                          <Download className="w-8 h-8 group-hover:translate-y-1 transition-transform" />
                          GENERATE PDF
                       </>
                    )}
                 </Button>

                 <div className="p-8 rounded-[2.5rem] bg-muted/50 border-2 border-dashed space-y-4">
                    <div className="flex items-center gap-2">
                       <Settings2 className="w-4 h-4 text-teal-600" />
                       <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Layout Intelligence</span>
                    </div>
                    <p className="text-xs font-bold text-muted-foreground leading-relaxed">
                       {pageSize === 'auto' 
                         ? "Fit Image: Each page in the PDF will match the exact dimensions of the corresponding image." 
                         : "A4 Paper: Images will be automatically scaled and centered to fit standard A4 paper dimensions."}
                    </p>
                 </div>
              </div>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
