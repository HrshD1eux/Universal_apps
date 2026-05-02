'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Link2, Trash2, Copy, Sparkles, Zap, Info, 
  RefreshCcw, CheckCircle2, ShieldCheck, Share2, Scissors
} from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';

const TRACKING_PARAMS = [
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
  'fbclid', 'gclid', 'msclkid', 'mc_cid', 'mc_eid', 'igshid', 'si',
  'ref', 'ref_', 'feature', 's', 'source', 'click_id', 'aff_id'
];

export default function UrlCleaner() {
  const [url, setUrl] = useState('');
  const [cleanUrl, setCleanUrl] = useState('');
  const [removedCount, setRemovedCount] = useState(0);
  
  const { t } = useLanguage();
  const { toast } = useToast();

  const cleanLink = () => {
    try {
      const urlObj = new URL(url.trim());
      const searchParams = urlObj.searchParams;
      let count = 0;

      TRACKING_PARAMS.forEach(param => {
        // Handle exact matches and prefix matches (like ref_)
        const keysToRemove = Array.from(searchParams.keys()).filter(key => 
          key === param || key.startsWith(param)
        );
        
        keysToRemove.forEach(key => {
          searchParams.delete(key);
          count++;
        });
      });

      setCleanUrl(urlObj.toString());
      setRemovedCount(count);
      if (count > 0) {
        toast({ title: "Link Purged!", description: `Removed ${count} tracking parameters.` });
      } else {
        toast({ title: "Already Clean", description: "No tracking parameters found." });
      }
    } catch (e) {
      toast({ title: "Invalid URL", variant: "destructive" });
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(cleanUrl);
    toast({ title: "Copied", description: "Clean link copied to clipboard." });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 px-4">
      <Card className="border-none shadow-2xl bg-gradient-to-br from-background via-muted/50 to-background overflow-hidden font-sans">
        <CardHeader className="bg-indigo-500/5 border-b border-indigo-500/10 p-8">
           <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-4">
                 <div className="p-4 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-500/20">
                    <Scissors className="w-8 h-8" />
                 </div>
                 <div>
                    <CardTitle className="text-3xl font-black tracking-tight uppercase">{t('urlCleanerTitle' as any)}</CardTitle>
                    <CardDescription className="text-base font-bold text-indigo-600/60">{t('urlCleanerDesc' as any)}</CardDescription>
                 </div>
              </div>
              <div className="p-3 bg-muted rounded-2xl border-2 flex items-center gap-3">
                 <ShieldCheck className="w-4 h-4 text-indigo-600" />
                 <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Privacy Mode</span>
              </div>
           </div>
        </CardHeader>

        <CardContent className="p-8">
           <div className="space-y-12">
              <div className="space-y-4">
                 <label className="text-[10px] font-black uppercase tracking-widest text-indigo-600 ml-1">Original URL (Amazon, Instagram, Twitter, etc)</label>
                 <div className="relative group">
                    <Input 
                      value={url} 
                      onChange={(e) => setUrl(e.target.value)} 
                      placeholder="Paste your long, messy link here..." 
                      className="h-20 rounded-[2rem] border-2 text-lg font-medium focus:ring-indigo-500 pl-8 pr-20 shadow-xl transition-all"
                    />
                    <div className="absolute right-6 top-1/2 -translate-y-1/2">
                       <Link2 className="w-8 h-8 text-indigo-600 opacity-20" />
                    </div>
                 </div>
              </div>

              <div className="flex gap-4">
                 <Button 
                   onClick={cleanLink}
                   disabled={!url}
                   className="flex-1 h-20 rounded-[2rem] bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xl gap-3 shadow-2xl shadow-indigo-500/20 group"
                 >
                    <Zap className="w-8 h-8 group-hover:scale-125 transition-transform" />
                    PURGE TRACKING ID
                 </Button>
                 <Button 
                   variant="outline" 
                   onClick={() => { setUrl(''); setCleanUrl(''); setRemovedCount(0); }}
                   className="h-20 w-20 rounded-[2rem] border-2 text-rose-500"
                 >
                    <Trash2 className="w-8 h-8" />
                 </Button>
              </div>

              <AnimatePresence>
                 {cleanUrl && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      className="p-10 rounded-[3rem] bg-card border-2 shadow-2xl space-y-8 relative overflow-hidden group"
                    >
                       <Sparkles className="absolute top-0 right-0 p-8 w-40 h-40 opacity-5 group-hover:scale-110 transition-transform" />
                       
                       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                          <div>
                             <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-2 flex items-center gap-2">
                                <CheckCircle2 className="w-3 h-3" /> CLEAN LINK READY
                             </p>
                             <p className="text-sm font-bold opacity-60 leading-relaxed max-w-xl break-all">
                                {cleanUrl}
                             </p>
                          </div>
                          <Button 
                            onClick={copyToClipboard}
                            className="h-16 px-10 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-lg gap-2 shadow-xl shadow-emerald-500/20"
                          >
                             <Copy className="w-5 h-5" /> COPY
                          </Button>
                       </div>

                       <div className="pt-8 border-t border-dashed flex items-center gap-6">
                          <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black">-{removedCount}</div>
                             <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Tags Removed</span>
                          </div>
                          <div className="flex items-center gap-3">
                             <Share2 className="w-5 h-5 text-indigo-600" />
                             <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Ready for Private Sharing</span>
                          </div>
                       </div>
                    </motion.div>
                 )}
              </AnimatePresence>
           </div>
        </CardContent>
      </Card>
      
      <div className="p-8 rounded-[3rem] bg-muted/30 border-2 border-dashed flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
         <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center flex-shrink-0">
            <Info className="w-8 h-8 text-indigo-600" />
         </div>
         <div className="flex-grow space-y-2">
            <h4 className="text-sm font-black uppercase tracking-widest">Digital Hygiene</h4>
            <p className="text-xs font-bold text-muted-foreground leading-relaxed uppercase tracking-tighter">
               Companies use tracking IDs (UTM, FBCLID) to map your social circles. This tool strips them locally, ensuring you share the content, not your data footprint.
            </p>
         </div>
      </div>
    </div>
  );
}
