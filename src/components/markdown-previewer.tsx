'use client';

import React, { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, FileCode, Layout, Maximize2, Split, Palette, Sparkles } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { jsPDF } from 'jspdf';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function MarkdownPreviewer() {
  const [markdown, setMarkdown] = useState('# 📄 Professional Markdown Preview\n\nWelcome to the **Industrial-Grade MD Editor**. \n\n## 🛠 features\n- [x] Standard Compliant GFM\n- [x] High-Precision Preview\n- [x] Document Structure Analysis\n- [x] Professional PDF Export\n\n### 💻 Usage Example\n```js\n// Simple and clean document formatting\nconst doc = createDocument("report.md");\n```\n\n> "Simplicity is the ultimate sophistication." - Leonardo da Vinci');
  const [viewMode, setViewMode] = useState<'split' | 'preview'>('split');
  const [isExporting, setIsExporting] = useState(false);
  const { t } = useLanguage();
  const { toast } = useToast();
  const previewRef = useRef<HTMLDivElement>(null);

  const exportToPdf = async () => {
    if (!previewRef.current || isExporting) return;
    setIsExporting(true);
    
    try {
      const html2canvas = (await import('html2canvas')).default;
      const element = previewRef.current;
      
      // Temporary styling for export - remove borders and shadows for a clean PDF look
      const originalStyle = element.style.cssText;
      element.style.width = '800px'; 
      element.style.padding = '40px';
      element.style.boxShadow = 'none';
      element.style.border = 'none';
      
      // Capture the element
      const canvas = await html2canvas(element, {
        scale: 2, 
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });
      
      // Restore original style
      element.style.cssText = originalStyle;
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15; 
      const contentWidth = pageWidth - (margin * 2);
      
      const imgProps = pdf.getImageProperties(imgData);
      const contentHeight = (imgProps.height * contentWidth) / imgProps.width;
      
      const pageContentHeight = pageHeight - (margin * 2);
      let heightLeft = contentHeight;
      let position = margin;
      
      // Add first page
      pdf.addImage(imgData, 'PNG', margin, position, contentWidth, contentHeight);
      
      // Mask bottom margin of first page
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, pageHeight - margin, pageWidth, margin, 'F');
      
      heightLeft -= pageContentHeight;
      
      // Add subsequent pages if needed
      while (heightLeft > 0) {
        pdf.addPage();
        position = margin - (contentHeight - heightLeft);
        
        pdf.addImage(imgData, 'PNG', margin, position, contentWidth, contentHeight);
        
        // Mask top and bottom margins to hide overflow/sliced text
        pdf.setFillColor(255, 255, 255);
        pdf.rect(0, 0, pageWidth, margin, 'F');
        pdf.rect(0, pageHeight - margin, pageWidth, margin, 'F');
        
        heightLeft -= pageContentHeight;
      }
      
      pdf.save('markdown-professional-report.pdf');
      toast({ title: "Export Successful", description: "Your document is ready." });
    } catch (err) {
      console.error(err);
      toast({ title: "Export Failed", description: "Could not generate PDF.", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <Card className="border-none shadow-2xl bg-card/80 backdrop-blur-xl overflow-hidden h-[85vh] flex flex-col border-2 border-primary/10">
        <CardHeader className="bg-gradient-to-r from-primary/10 via-background to-secondary/10 border-b p-6 shrink-0">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
             <div className="flex items-center gap-4">
                <div className="p-4 bg-slate-900 rounded-2xl text-white shadow-lg">
                   <FileText className="w-6 h-6" />
                </div>
                <div>
                   <CardTitle className="text-3xl font-black text-slate-900 dark:text-white">
                      {t('markdownTitle')}
                   </CardTitle>
                   <CardDescription className="font-bold flex items-center gap-2">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      {t('markdownDesc')}
                   </CardDescription>
                </div>
             </div>
             
             <div className="flex items-center gap-2 bg-background/50 backdrop-blur-md p-2 rounded-[2rem] border shadow-xl">
                <Button 
                  variant={viewMode === 'split' ? 'default' : 'ghost'} 
                  size="sm" 
                  className={`rounded-full gap-2 font-black text-[10px] h-10 px-6 transition-all ${viewMode === 'split' ? 'shadow-lg shadow-primary/20' : ''}`}
                  onClick={() => setViewMode('split')}
                >
                   <Split className="w-3 h-3" /> SPLIT VIEW
                </Button>
                <Button 
                  variant={viewMode === 'preview' ? 'default' : 'ghost'} 
                  size="sm" 
                  className={`rounded-full gap-2 font-black text-[10px] h-10 px-6 transition-all ${viewMode === 'preview' ? 'shadow-lg shadow-primary/20' : ''}`}
                  onClick={() => setViewMode('preview')}
                >
                   <Layout className="w-3 h-3" /> PREVIEW ONLY
                </Button>
                <div className="w-px h-4 bg-border mx-2" />
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-full gap-2 font-black text-[10px] h-10 px-6 border-primary/30 text-primary hover:bg-primary/5 transition-all"
                  onClick={exportToPdf}
                >
                   <Download className="w-3 h-3" /> {t('exportPdf')}
                </Button>
             </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0 flex-grow overflow-hidden bg-muted/5">
          <div className={`grid h-full ${viewMode === 'split' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
             {viewMode === 'split' && (
                <div className="border-r border-primary/5 bg-background/30 p-8 flex flex-col">
                   <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                         <FileCode className="w-3 h-3" /> Markdown Source
                      </div>
                      <div className="flex gap-1">
                         <div className="w-2 h-2 rounded-full bg-red-400/20" />
                         <div className="w-2 h-2 rounded-full bg-amber-400/20" />
                         <div className="w-2 h-2 rounded-full bg-green-400/20" />
                      </div>
                   </div>
                   <textarea 
                     value={markdown}
                     onChange={(e) => setMarkdown(e.target.value)}
                     className="w-full flex-grow bg-transparent border-none focus:ring-0 resize-none font-mono text-sm p-6 scrollbar-hide selection:bg-primary/10 leading-relaxed"
                     placeholder="Unleash your creativity here..."
                   />
                </div>
             )}
             
             <div className="p-12 overflow-y-auto bg-gradient-to-br from-white to-muted/20 dark:from-zinc-950 dark:to-zinc-900 scrollbar-hide">
                <div className="max-w-4xl mx-auto md-preview-content" ref={previewRef}>
                    <div className="flex items-center gap-2 mb-10 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-4">
                       <Layout className="w-3 h-3" /> Document Preview
                    </div>
                   <article className="prose prose-colorful dark:prose-invert prose-headings:font-black prose-a:text-indigo-600 prose-img:rounded-3xl prose-pre:rounded-2xl prose-pre:shadow-2xl">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                         {markdown}
                      </ReactMarkdown>
                   </article>
                </div>
             </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
