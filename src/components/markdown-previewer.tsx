'use client';

import React, { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, FileCode, Layout, Split, Sparkles, Loader2 } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';

export default function MarkdownPreviewer() {
  const [markdown, setMarkdown] = useState('# 📄 Professional Markdown Preview\n\nWelcome to the **Industrial-Grade MD Editor**. \n\n## 🛠 features\n- [x] Standard Compliant GFM\n- [x] High-Precision Preview\n- [x] Document Structure Analysis\n- [x] Professional PDF Export\n\n### 💻 Usage Example\n```js\n// Simple and clean document formatting\nconst doc = createDocument("report.md");\n```\n\n> "Simplicity is the ultimate sophistication." - Leonardo da Vinci');
  const [viewMode, setViewMode] = useState<'split' | 'preview'>('split');
  const [isExporting, setIsExporting] = useState(false);
  const { t } = useLanguage();
  const { toast } = useToast();
  const previewRef = useRef<HTMLDivElement>(null);

  // ── Native Print-to-PDF Engine ──────────────────────────────────────
  // Since html2canvas/jsPDF fail due to Tauri webview canvas readback bugs,
  // we leverage the native browser print engine. It guarantees perfect text
  // selection, flawless tables, and intelligent page breaks.
  const exportToPdf = async () => {
    if (!previewRef.current || isExporting) return;
    setIsExporting(true);

    try {
      const articleEl = previewRef.current.querySelector('article');
      if (!articleEl) {
        toast({ title: "Export Failed", description: "No content found.", variant: "destructive" });
        setIsExporting(false);
        return;
      }

      // 1. Create a dedicated container just for printing
      const printContainer = document.createElement('div');
      printContainer.id = 'pdf-native-print-container';
      printContainer.innerHTML = articleEl.outerHTML;
      document.body.appendChild(printContainer);

      // 2. Inject perfectly tuned Print CSS
      const style = document.createElement('style');
      style.id = 'pdf-native-print-style';
      style.innerHTML = `
        @media screen {
          #pdf-native-print-container {
            display: none !important;
          }
        }
        @media print {
          /* Hide the entire app UI */
          body > *:not(#pdf-native-print-container) {
            display: none !important;
          }
          
          /* Show only our print container */
          #pdf-native-print-container {
            display: block !important;
            width: 100%;
            background: white !important;
            color: #111827 !important;
            font-family: 'Segoe UI', system-ui, sans-serif !important;
          }

          /* Professional A4 Margins */
          @page {
            size: A4 portrait;
            margin: 20mm;
          }

          /* Clean, professional typography */
          #pdf-native-print-container article { max-width: none !important; }
          #pdf-native-print-container h1 { font-size: 24pt !important; font-weight: 800; margin-bottom: 12pt; border-bottom: 2px solid #e5e7eb; padding-bottom: 8pt; color: #000 !important; }
          #pdf-native-print-container h2 { font-size: 18pt !important; font-weight: 700; margin-top: 18pt; margin-bottom: 8pt; border-bottom: 1px solid #f3f4f6; padding-bottom: 4pt; color: #1f2937 !important; }
          #pdf-native-print-container h3 { font-size: 14pt !important; font-weight: 600; margin-top: 14pt; margin-bottom: 6pt; color: #374151 !important; }
          #pdf-native-print-container p, 
          #pdf-native-print-container li { font-size: 11pt !important; line-height: 1.6 !important; margin-bottom: 8pt; color: #374151 !important; }
          
          /* Table Formatting */
          #pdf-native-print-container table { width: 100% !important; border-collapse: collapse !important; margin-bottom: 14pt; font-size: 10pt !important; }
          #pdf-native-print-container th, 
          #pdf-native-print-container td { border: 1px solid #d1d5db !important; padding: 8pt 10pt !important; text-align: left !important; }
          #pdf-native-print-container th { background-color: #f9fafb !important; font-weight: bold !important; color: #111827 !important; }

          /* Code Blocks */
          #pdf-native-print-container pre { background: #f3f4f6 !important; padding: 12pt !important; border: 1px solid #e5e7eb !important; border-radius: 6pt !important; font-size: 9.5pt !important; font-family: 'Consolas', monospace !important; white-space: pre-wrap !important; word-wrap: break-word !important; margin-bottom: 12pt !important; }
          #pdf-native-print-container code { font-family: 'Consolas', monospace !important; font-size: 0.9em !important; background: #f3f4f6 !important; padding: 2pt 4pt !important; border-radius: 3pt !important; }
          
          /* Blockquotes */
          #pdf-native-print-container blockquote { border-left: 4pt solid #6366f1 !important; padding-left: 12pt !important; margin: 12pt 0 !important; color: #4b5563 !important; font-style: italic !important; }

          /* Images */
          #pdf-native-print-container img { max-width: 100% !important; height: auto !important; border-radius: 6pt !important; }

          /* Smart Page Breaks - Never cut tables, code, or images in half! */
          #pdf-native-print-container table, 
          #pdf-native-print-container tr, 
          #pdf-native-print-container pre, 
          #pdf-native-print-container img, 
          #pdf-native-print-container blockquote {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          
          /* Keep headings with their following paragraphs */
          #pdf-native-print-container h1, 
          #pdf-native-print-container h2, 
          #pdf-native-print-container h3 {
            page-break-after: avoid !important;
            break-after: avoid !important;
          }
        }
      `;
      document.head.appendChild(style);

      // Give browser a tiny moment to apply styles
      await new Promise(r => setTimeout(r, 100));

      // 3. Trigger native print dialog
      // In Tauri, this opens the system dialog where the user selects "Save as PDF"
      window.print();

      toast({ 
        title: "Print Dialog Opened", 
        description: "Select 'Save as PDF' (or 'Microsoft Print to PDF') to export.",
      });

      // Cleanup
      setTimeout(() => {
        const cleanupContainer = document.getElementById('pdf-native-print-container');
        const cleanupStyle = document.getElementById('pdf-native-print-style');
        if (cleanupContainer) document.body.removeChild(cleanupContainer);
        if (cleanupStyle) document.head.removeChild(cleanupStyle);
      }, 1000);

    } catch (err) {
      console.error('[PDF Export] Error:', err);
      toast({ title: "Export Failed", description: String(err), variant: "destructive" });
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
