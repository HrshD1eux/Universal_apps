'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  FilePlus, Scissors, Minimize2, Stamp, 
  FileDigit, Trash2, FileImage, ImageIcon, 
  Edit3, LayoutGrid, FileText, Lock, LockOpen, RefreshCw, Palette
} from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { motion } from 'framer-motion';

const PDF_TOOLS = [
  { id: 'merge', icon: FilePlus, color: 'bg-red-500' },
  { id: 'split', icon: Scissors, color: 'bg-orange-500' },
  { id: 'compress', icon: Minimize2, color: 'bg-blue-500' },
  { id: 'watermark', icon: Stamp, color: 'bg-purple-500' },
  { id: 'page-numbers', icon: FileDigit, color: 'bg-indigo-500' },
  { id: 'remove-pages', icon: Trash2, color: 'bg-rose-500' },
  { id: 'pdf-to-jpg', icon: FileImage, color: 'bg-emerald-500' },
  { id: 'jpg-to-pdf', icon: ImageIcon, color: 'bg-teal-500' },
  { id: 'editor', icon: Edit3, color: 'bg-amber-500' },
  { id: 'protect', icon: Lock, color: 'bg-rose-600' },
  { id: 'unlock', icon: LockOpen, color: 'bg-blue-600' },
  { id: 'rotate', icon: RefreshCw, color: 'bg-emerald-600' },
  { id: 'grayscale', icon: Palette, color: 'bg-slate-600' },
];

export default function PdfToolsDashboard({ onSelect }: { onSelect: (id: string) => void }) {
  const { t } = useLanguage();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {PDF_TOOLS.map((tool, index) => (
        <motion.div
          key={tool.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <Card 
            className="group cursor-pointer hover:shadow-2xl transition-all border-none bg-card/80 backdrop-blur-xl overflow-hidden hover:-translate-y-1"
            onClick={() => onSelect(tool.id)}
          >
            <CardContent className="p-6 flex items-center gap-6">
              <div className={`p-4 rounded-2xl ${tool.color} text-white shadow-lg group-hover:scale-110 transition-transform`}>
                <tool.icon className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-black tracking-tight">{t(`pdf_${tool.id.replace(/-/g, '_')}_title` as any)}</h3>
                <p className="text-xs text-muted-foreground font-medium line-clamp-2">{t(`pdf_${tool.id.replace(/-/g, '_')}_desc` as any)}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
