'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import PdfToolsDashboard from '@/components/pdf/pdf-tools-dashboard';
import PdfMerger from '@/components/pdf/pdf-merger';
import PdfSplitter from '@/components/pdf/pdf-splitter';
import PdfToJpg from '@/components/pdf/pdf-to-jpg';
import PdfEditor from '@/components/pdf/pdf-editor';
import PdfWatermark from '@/components/pdf/pdf-watermark';
import PdfPageNumbers from '@/components/pdf/pdf-page-numbers';
import JpgToPdf from '@/components/pdf/jpg-to-pdf';
import PdfRemovePages from '@/components/pdf/pdf-remove-pages';
import PdfCompress from '@/components/pdf/pdf-compress';
import PdfProtect from '@/components/pdf/pdf-protect';
import PdfUnlock from '@/components/pdf/pdf-unlock';
import PdfRotate from '@/components/pdf/pdf-rotate';
import PdfGrayscale from '@/components/pdf/pdf-grayscale';

import { Button } from '@/components/ui/button';
import { ChevronLeft, FileText, Sparkles } from 'lucide-react';
import { useLanguage } from '@/context/language-context';

export default function PdfPage() {
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const { t } = useLanguage();

  useEffect(() => {
    const tool = searchParams.get('tool');
    if (tool) setActiveTool(tool);
  }, [searchParams]);

  const renderTool = () => {
    switch (activeTool) {
      case 'merge': return <PdfMerger />;
      case 'split': return <PdfSplitter />;
      case 'pdf-to-jpg': return <PdfToJpg />;
      case 'jpg-to-pdf': return <JpgToPdf />;
      case 'editor': return <PdfEditor />;
      case 'watermark': return <PdfWatermark />;
      case 'page-numbers': return <PdfPageNumbers />;
      case 'remove-pages': return <PdfRemovePages />;
      case 'compress': return <PdfCompress />;
      case 'protect': return <PdfProtect />;
      case 'unlock': return <PdfUnlock />;
      case 'rotate': return <PdfRotate />;
      case 'grayscale': return <PdfGrayscale />;
      default: return (
        <div className="space-y-12">
            <div className="text-center space-y-6">
                <div className="mx-auto w-24 h-24 bg-red-500/10 rounded-[2.5rem] flex items-center justify-center text-red-600 shadow-xl border border-red-500/20">
                    <FileText className="w-12 h-12" />
                </div>
                <div className="space-y-2">
                    <h1 className="text-5xl font-black tracking-tighter bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">{t('pdfStudioTitle' as any)}</h1>
                    <p className="text-lg text-muted-foreground font-bold max-w-xl mx-auto leading-relaxed">
                        {t('pdfStudioDesc' as any)}
                    </p>
                </div>
                <div className="flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest text-primary/40 bg-muted/50 w-fit mx-auto px-4 py-2 rounded-full border">
                   <Sparkles className="w-3 h-3" /> Privacy-First Architecture
                </div>
            </div>
            <PdfToolsDashboard onSelect={setActiveTool} />
        </div>
      );
    }
  };

  return (
    <div className="container mx-auto py-12 px-6 max-max-w-7xl">
      {activeTool && (
        <Button 
          variant="ghost" 
          onClick={() => setActiveTool(null)}
          className="mb-8 h-12 px-6 font-black gap-2 hover:bg-primary/10 rounded-xl group transition-all"
        >
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
        </Button>
      )}
      <React.Suspense fallback={<div className="h-96 flex items-center justify-center"><Sparkles className="w-8 h-8 animate-spin text-primary" /></div>}>
        {renderTool()}
      </React.Suspense>
    </div>
  );
}
