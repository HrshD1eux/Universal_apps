'use client';

import React, { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, FileCode, Layout, Split, Sparkles, Loader2 } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { jsPDF } from 'jspdf';
import { useToast } from '@/hooks/use-toast';

/**
 * Smart PDF export that:
 * 1. Clones the preview DOM into an offscreen container styled for print
 * 2. Renders the entire clone to a single tall canvas via html2canvas
 * 3. Manually slices the canvas into A4-page-height strips
 * 4. Checks each strip for non-white pixels — skips blank pages entirely
 * 5. Adds only content-bearing slices to the PDF
 */

// ── A4 constants (in pt) ────────────────────────────────────────────
const A4_WIDTH_PT  = 595.28;
const A4_HEIGHT_PT = 841.89;
const MARGIN_PT    = 40;
const CONTENT_WIDTH_PT = A4_WIDTH_PT - MARGIN_PT * 2;

// Pixel width we render into (maps to CONTENT_WIDTH_PT in the PDF)
const RENDER_PX = 650;

export default function MarkdownPreviewer() {
  const [markdown, setMarkdown] = useState('# 📄 Professional Markdown Preview\n\nWelcome to the **Industrial-Grade MD Editor**. \n\n## 🛠 features\n- [x] Standard Compliant GFM\n- [x] High-Precision Preview\n- [x] Document Structure Analysis\n- [x] Professional PDF Export\n\n### 💻 Usage Example\n```js\n// Simple and clean document formatting\nconst doc = createDocument("report.md");\n```\n\n> "Simplicity is the ultimate sophistication." - Leonardo da Vinci');
  const [viewMode, setViewMode] = useState<'split' | 'preview'>('split');
  const [isExporting, setIsExporting] = useState(false);
  const { t } = useLanguage();
  const { toast } = useToast();
  const previewRef = useRef<HTMLDivElement>(null);

  // ── Smart PDF Export ──────────────────────────────────────────────
  const exportToPdf = async () => {
    if (!previewRef.current || isExporting) return;
    setIsExporting(true);

    try {
      const html2canvas = (await import('html2canvas')).default;

      // ── 1. Build an offscreen clone with print-friendly styles ─────
      const offscreen = document.createElement('div');
      offscreen.style.cssText = `
        position: fixed; left: -9999px; top: 0;
        width: ${RENDER_PX}px;
        background: #ffffff;
        color: #1a1a2e;
        font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
        font-size: 13px;
        line-height: 1.7;
        padding: 24px 32px;
      `;
      document.body.appendChild(offscreen);

      const clone = previewRef.current.cloneNode(true) as HTMLElement;
      offscreen.appendChild(clone);

      clone.style.cssText = `
        width: 100%; padding: 0; margin: 0;
        background: #ffffff; color: #1a1a2e;
      `;

      // Remove the "Document Preview" header bar
      const headerBar = clone.querySelector('.flex.items-center.gap-2.mb-10');
      if (headerBar) headerBar.remove();

      // Force print-friendly styles on every element
      const allEls = clone.getElementsByTagName('*');
      for (let i = 0; i < allEls.length; i++) {
        const el = allEls[i] as HTMLElement;
        const tag = el.tagName.toLowerCase();

        el.style.color = '#1a1a2e';
        el.style.boxShadow = 'none';
        el.style.textShadow = 'none';
        el.style.filter = 'none';
        el.style.backdropFilter = 'none';

        if (tag === 'pre') {
          el.style.backgroundColor = '#f4f4f8';
          el.style.border = '1px solid #e2e2e8';
          el.style.borderRadius = '8px';
          el.style.padding = '12px 16px';
          el.style.overflow = 'hidden';
          el.style.whiteSpace = 'pre-wrap';
          el.style.wordBreak = 'break-word';
        } else if (tag === 'code' && el.parentElement?.tagName.toLowerCase() !== 'pre') {
          el.style.backgroundColor = '#f0f0f5';
          el.style.padding = '2px 5px';
          el.style.borderRadius = '4px';
          el.style.fontSize = '12px';
        } else {
          el.style.backgroundColor = 'transparent';
        }

        if (tag === 'a') { el.style.color = '#3b5998'; el.style.textDecoration = 'underline'; }
        if (tag === 'h1') { Object.assign(el.style, { fontSize: '22px', fontWeight: '800', marginBottom: '12px', paddingBottom: '8px', borderBottom: '2px solid #e0e0e0', color: '#111827' }); }
        if (tag === 'h2') { Object.assign(el.style, { fontSize: '18px', fontWeight: '700', marginTop: '20px', marginBottom: '8px', paddingBottom: '4px', borderBottom: '1px solid #eee', color: '#1f2937' }); }
        if (tag === 'h3') { Object.assign(el.style, { fontSize: '15px', fontWeight: '700', marginTop: '16px', marginBottom: '6px', color: '#374151' }); }
        if (tag === 'blockquote') { Object.assign(el.style, { borderLeft: '4px solid #6366f1', padding: '12px 16px', margin: '12px 0', color: '#4b5563', fontStyle: 'italic', backgroundColor: '#f8f8fc', borderRadius: '0 8px 8px 0' }); }
        if (tag === 'table') { Object.assign(el.style, { width: '100%', borderCollapse: 'collapse', marginBottom: '16px' }); }
        if (tag === 'th' || tag === 'td') { Object.assign(el.style, { border: '1px solid #e5e7eb', padding: '8px 12px', textAlign: 'left' }); }
        if (tag === 'th') { el.style.backgroundColor = '#f9fafb'; el.style.fontWeight = '600'; }
      }

      // Let the DOM settle
      await new Promise(r => setTimeout(r, 150));

      // ── 2. Render to a single tall canvas ─────────────────────────
      const canvas = await html2canvas(offscreen, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        allowTaint: true,
        width: RENDER_PX,
        windowWidth: RENDER_PX,
      });

      // Cleanup offscreen element immediately
      document.body.removeChild(offscreen);

      // ── 3. Slice canvas into pages & build PDF ────────────────────
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;

      // PDF dimensions in pt
      const pdfPageW = A4_WIDTH_PT;
      const pdfPageH = A4_HEIGHT_PT;
      const contentW = pdfPageW - MARGIN_PT * 2;
      const contentH = pdfPageH - MARGIN_PT * 2;

      // How many canvas pixels correspond to the printable area
      const imgScale = contentW / canvasWidth; // pt per canvas-px
      const sliceHeight = Math.floor(contentH / imgScale); // canvas-px per page

      const totalPages = Math.ceil(canvasHeight / sliceHeight);
      const pdf = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });

      let pagesAdded = 0;

      for (let page = 0; page < totalPages; page++) {
        const srcY = page * sliceHeight;
        const srcH = Math.min(sliceHeight, canvasHeight - srcY);

        if (srcH <= 0) break;

        // Extract slice into a temporary canvas
        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width = canvasWidth;
        sliceCanvas.height = srcH;
        const ctx = sliceCanvas.getContext('2d')!;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvasWidth, srcH);
        ctx.drawImage(canvas, 0, srcY, canvasWidth, srcH, 0, 0, canvasWidth, srcH);

        // ── Check if this slice has actual content (not just white) ──
        const sampleData = ctx.getImageData(0, 0, canvasWidth, srcH).data;
        let hasContent = false;
        // Sample every 40th pixel for speed (checking full image is too slow)
        for (let px = 0; px < sampleData.length; px += 40 * 4) {
          const r = sampleData[px];
          const g = sampleData[px + 1];
          const b = sampleData[px + 2];
          // If pixel is not white/near-white, we have content
          if (r < 250 || g < 250 || b < 250) {
            hasContent = true;
            break;
          }
        }

        if (!hasContent) continue; // Skip blank pages entirely

        // Add a new page (jsPDF starts with one page, so skip addPage for first)
        if (pagesAdded > 0) pdf.addPage();
        pagesAdded++;

        // Place slice image on PDF page
        const imgData = sliceCanvas.toDataURL('image/jpeg', 0.95);
        const drawH = srcH * imgScale;
        pdf.addImage(imgData, 'JPEG', MARGIN_PT, MARGIN_PT, contentW, drawH);
      }

      if (pagesAdded === 0) {
        // Edge case: nothing rendered — add the full canvas on one page
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', MARGIN_PT, MARGIN_PT, contentW, contentH);
      }

      pdf.save('markdown-report.pdf');

      toast({ title: "Export Successful", description: `Exported ${pagesAdded} page${pagesAdded !== 1 ? 's' : ''} with zero blank pages.` });
    } catch (err) {
      console.error('PDF Export Error:', err);
      toast({
        title: "Export Failed",
        description: "Could not generate PDF. Please try again.",
        variant: "destructive",
      });
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
                  disabled={isExporting}
                >
                   {isExporting ? (
                     <><Loader2 className="w-3 h-3 animate-spin" /> EXPORTING...</>
                   ) : (
                     <><Download className="w-3 h-3" /> {t('exportPdf')}</>
                   )}
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
