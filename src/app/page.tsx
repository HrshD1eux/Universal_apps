'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Calculator, 
  Percent, 
  GraduationCap, 
  QrCode, 
  TrendingUp, 
  ArrowRightLeft, 
  Search,
  LayoutGrid,
  List,
  Clock,
  Sparkles,
  Heart,
  Landmark,
  Cake,
  Tag,
  Banknote,
  UtensilsCrossed,
  Target,
  Calendar,
  Scale,
  Package,
  PiggyBank,
  Home as HomeIcon,
  Cpu,
  Coins,
  BarChart4,
  ShieldCheck as ShieldCheckIcon,
  Binary,
  Wallet,
  ShieldCheck,
  Type,
  Code2,
  Activity,
  Stethoscope,
  Flame,
  Globe,
  Dices,
  LineChart,
  BarChart,
  MoveHorizontal,
  FileText,
  FileCode2,
  Link2,
  Key,
  Lock,
  Fingerprint,
  EyeOff,
  Code,
  ShieldAlert,
  SearchCode,
  FileJson2,
  FileCode,
  Palette,
  Layers,
  Paintbrush,
  Droplet,
  Maximize,
  Triangle,
  Compass,
  Divide,
  Atom,
  Eraser,
  ShieldX,
  Scissors,
  Smile,
  Waypoints,
  ListOrdered
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import HistoryView from '@/components/history-view';

import { useLanguage } from '@/context/language-context';

const CATEGORIES = [
  { id: 'all', labelKey: 'allTools', icon: LayoutGrid },
  { id: 'math', labelKey: 'math', icon: Calculator },
  { id: 'finance', labelKey: 'finance', icon: TrendingUp },
  { id: 'health', labelKey: 'health', icon: Heart },
  { id: 'dev', labelKey: 'devTools', icon: Code2 },
  { id: 'design', labelKey: 'designTools', icon: Paintbrush },
  { id: 'pdf', labelKey: 'pdfTools', icon: FileText },
  { id: 'utility', labelKey: 'utility', icon: Sparkles },
] as const;

const TOOLS_DATA = [
  { id: 'password', titleKey: 'passwordTitle', descKey: 'passwordDesc', href: '/password-generator', icon: ShieldCheck, category: 'dev', color: 'emerald' },
  { id: 'text', titleKey: 'textTitle', descKey: 'textDesc', href: '/text-utils', icon: Type, category: 'dev', color: 'blue' },
  { id: 'json', titleKey: 'jsonTitle', descKey: 'jsonDesc', href: '/json-tool', icon: Code2, category: 'dev', color: 'amber' },
  { id: 'markdown', titleKey: 'markdownTitle', descKey: 'markdownDesc', href: '/markdown-previewer', icon: FileText, category: 'dev', color: 'indigo' },
  { id: 'scientific', titleKey: 'scientificTitle', descKey: 'scientificDesc', href: '/scientific-calculator', icon: Calculator, category: 'math', color: 'blue' },
  { id: 'base64', titleKey: 'base64Title', descKey: 'base64Desc', href: '/base64-converter', icon: FileCode2, category: 'dev', color: 'indigo' },
  { id: 'url', titleKey: 'urlTitle', descKey: 'urlDesc', href: '/url-converter', icon: Link2, category: 'dev', color: 'emerald' },
  { id: 'jwt', titleKey: 'jwtTitle', descKey: 'jwtDesc', href: '/jwt-decoder', icon: Key, category: 'dev', color: 'purple' },
  { id: 'encryptor', titleKey: 'encryptorTitle', descKey: 'encryptorDesc', href: '/text-encryptor', icon: Lock, category: 'dev', color: 'red' },
  { id: 'hash', titleKey: 'hashTitle', descKey: 'hashDesc', href: '/hash-generator', icon: Fingerprint, category: 'dev', color: 'orange' },
  { id: 'steganography', titleKey: 'stegoTitle', descKey: 'stegoDesc', href: '/steganography', icon: EyeOff, category: 'dev', color: 'slate' },
  { id: 'snippet', titleKey: 'snippetTitle', descKey: 'snippetDesc', href: '/code-snippet', icon: Code, category: 'dev', color: 'cyan' },
  { id: 'regex', titleKey: 'regexTitle', descKey: 'regexDesc', href: '/regex-tester', icon: SearchCode, category: 'dev', color: 'violet' },
  { id: 'json-ts', titleKey: 'jsonTsTitle', descKey: 'jsonTsDesc', href: '/json-to-ts', icon: FileJson2, category: 'dev', color: 'indigo' },
  { id: 'htmljsx', titleKey: 'htmlJsxTitle', descKey: 'htmlJsxDesc', href: '/html-to-jsx', icon: FileCode, category: 'dev', color: 'sky' },
  { id: 'gradient', titleKey: 'gradientTitle', descKey: 'gradientDesc', href: '/css-gradient', icon: Palette, category: 'design', color: 'pink' },
  { id: 'shadow', titleKey: 'shadowTitle', descKey: 'shadowDesc', href: '/box-shadow', icon: Layers, category: 'design', color: 'cyan' },
  { id: 'palette', titleKey: 'paletteTitle', descKey: 'paletteDesc', href: '/color-palette', icon: Paintbrush, category: 'design', color: 'violet' },
  { id: 'glass', titleKey: 'glassTitle', descKey: 'glassDesc', href: '/glassmorphism', icon: Droplet, category: 'design', color: 'teal' },
  { id: 'color-names', titleKey: 'colorNamesTitle', descKey: 'colorNamesDesc', href: '/color-names', icon: Palette, category: 'design', color: 'blue' },
  {id: 'number-theory', titleKey: 'numberTheoryTitle', descKey: 'numberTheoryDesc', href: '/number-theory-lab', icon: Binary, category: 'math', color: 'blue' },
  {id: 'geometry', titleKey: 'geometryTitle', descKey: 'geometryDesc', href: '/geometry-suite', icon: Maximize, category: 'math', color: 'emerald' },
  {id: 'prob-pro', titleKey: 'probProTitle', descKey: 'probProDesc', href: '/probability-pro', icon: Dices, category: 'math', color: 'purple' },
  {id: 'complex', titleKey: 'complexTitle', descKey: 'complexDesc', href: '/complex-number-studio', icon: Compass, category: 'math', color: 'indigo' },
  {id: 'sequence', titleKey: 'sequenceTitle', descKey: 'sequenceDesc', href: '/sequence-solver', icon: TrendingUp, category: 'math', color: 'blue' },
  {id: 'fraction', titleKey: 'fractionTitle', descKey: 'fractionDesc', href: '/fraction-calculator', icon: Divide, category: 'math', color: 'rose' },
  {id: 'percent-master', titleKey: 'percentMasterTitle', descKey: 'percentMasterDesc', href: '/percentage-master', icon: Percent, category: 'math', color: 'amber' },
  {id: 'trig', titleKey: 'trigTitle', descKey: 'trigDesc', href: '/trigonometry-solver', icon: Triangle, category: 'math', color: 'sky' },
  { id: 'unit', titleKey: 'unitTitle', descKey: 'unitDesc', href: '/unit-converter', icon: ArrowRightLeft, category: 'utility', color: 'purple' },
  { id: 'emi', titleKey: 'emiTitle', descKey: 'emiDesc', href: '/emi-calculator', icon: Landmark, category: 'finance', color: 'indigo' },
  { id: 'interest', titleKey: 'interestTitle', descKey: 'interestDesc', href: '/compound-interest-calculator', icon: TrendingUp, category: 'finance', color: 'green' },
  { id: 'gst', titleKey: 'gstTitle', descKey: 'gstDesc', href: '/gst-calculator', icon: Percent, category: 'finance', color: 'orange' },
  { id: 'bmi', titleKey: 'bmiTitle', descKey: 'bmiDesc', href: '/bmi-calculator', icon: Heart, category: 'health', color: 'red' },
  { id: 'age', titleKey: 'ageTitle', descKey: 'ageDesc', href: '/age-calculator', icon: Cake, category: 'utility', color: 'orange' },
  { id: 'date', titleKey: 'dateTitle', descKey: 'dateDesc', href: '/date-calculator', icon: Calendar, category: 'utility', color: 'blue' },
  { id: 'price-comp', titleKey: 'priceCompTitle', descKey: 'priceCompDesc', href: '/price-comparison', icon: Package, category: 'utility', color: 'blue' },
  { id: 'bmr', titleKey: 'bmrTitle', descKey: 'bmrDesc', href: '/bmr-calculator', icon: Activity, category: 'health', color: 'rose' },
  { id: 'body-fat', titleKey: 'bodyFatTitle', descKey: 'bodyFatDesc', href: '/body-fat-calculator', icon: Stethoscope, category: 'health', color: 'pink' },
  { id: 'tax-india', titleKey: 'taxIndiaTitle', descKey: 'taxIndiaDesc', href: '/tax-india-calculator', icon: Banknote, category: 'finance', color: 'emerald' },
  { id: 'fire', titleKey: 'fireTitle', descKey: 'fireDesc', href: '/fire-calculator', icon: Flame, category: 'finance', color: 'orange' },
  { id: 'stock-avg', titleKey: 'stockAvgTitle', descKey: 'stockAvgDesc', href: '/stock-average', icon: BarChart, category: 'finance', color: 'blue' },
  { id: 'graph', titleKey: 'graphTitle', descKey: 'graphDesc', href: '/graphing-calculator', icon: LineChart, category: 'math', color: 'indigo' },
  { id: 'timezone', titleKey: 'timezoneTitle', descKey: 'timezoneDesc', href: '/timezone-converter', icon: Globe, category: 'utility', color: 'blue' },
  { id: 'loan-comp', titleKey: 'loanCompTitle', descKey: 'loanCompDesc', href: '/loan-comparison', icon: Scale, category: 'finance', color: 'indigo' },
  { id: 'discount', titleKey: 'discountTitle', descKey: 'discountDesc', href: '/discount-calculator', icon: Tag, category: 'finance', color: 'emerald' },
  { id: 'salary', titleKey: 'salaryTitle', descKey: 'salaryDesc', href: '/salary-calculator', icon: Banknote, category: 'finance', color: 'emerald' },
  { id: 'tip', titleKey: 'tipTitle', descKey: 'tipDesc', href: '/tip-calculator', icon: UtensilsCrossed, category: 'finance', color: 'amber' },
  { id: 'roi', titleKey: 'roiTitle', descKey: 'roiDesc', href: '/roi-calculator', icon: Target, category: 'finance', color: 'blue' },
  { id: 'marks', titleKey: 'marksTitle', descKey: 'marksDesc', href: '/marks-calculator', icon: GraduationCap, category: 'utility', color: 'indigo' },
  { id: 'qr', titleKey: 'qrTitle', descKey: 'qrDesc', href: '/qr-generator', icon: QrCode, category: 'utility', color: 'cyan' },
  { id: 'sip', titleKey: 'sipTitle', descKey: 'sipDesc', href: '/sip-calculator', icon: TrendingUp, category: 'finance', color: 'emerald' },
  { id: 'lumpsum', titleKey: 'lumpsumTitle', descKey: 'lumpsumDesc', href: '/lumpsum-calculator', icon: PiggyBank, category: 'finance', color: 'green' },
  { id: 'mortgage', titleKey: 'mortgageTitle', descKey: 'mortgageDesc', href: '/mortgage-calculator', icon: HomeIcon, category: 'finance', color: 'blue' },
  { id: 'base-conv', titleKey: 'baseConvTitle', descKey: 'baseConvDesc', href: '/base-converter', icon: Cpu, category: 'math', color: 'slate' },
  { id: 'byaj', titleKey: 'byajTitle', descKey: 'byajDesc', href: '/local-byaj-calculator', icon: Coins, category: 'finance', color: 'amber' },
  { id: 'step-up-sip', titleKey: 'stepUpTitle', descKey: 'stepUpDesc', href: '/step-up-sip-calculator', icon: TrendingUp, category: 'finance', color: 'green' },
  { id: 'goal-planner', titleKey: 'goalTitle', descKey: 'goalDesc', href: '/goal-planner', icon: Target, category: 'finance', color: 'blue' },
  { id: 'fd-rd', titleKey: 'fdTitle', descKey: 'fdDesc', href: '/fd-rd-calculator', icon: Landmark, category: 'finance', color: 'indigo' },
  { id: 'ppf', titleKey: 'ppfTitle', descKey: 'ppfDesc', href: '/ppf-calculator', icon: ShieldCheckIcon, category: 'finance', color: 'orange' },
  { id: 'stats', titleKey: 'statsTitle', descKey: 'statsDesc', href: '/statistics-tool', icon: BarChart4, category: 'math', color: 'rose' },
  { id: 'inflation', titleKey: 'inflationTitle', descKey: 'inflationDesc', href: '/inflation-calculator', icon: TrendingUp, category: 'finance', color: 'orange' },
  { id: 'nps', titleKey: 'npsTitle', descKey: 'npsDesc', href: '/nps-calculator', icon: Wallet, category: 'finance', color: 'emerald' },
  { id: 'investment-comp', titleKey: 'investmentCompTitle', descKey: 'investmentCompDesc', href: '/investment-comparison', icon: Scale, category: 'finance', color: 'indigo' },
  { id: 'equation', titleKey: 'equationTitle', descKey: 'equationDesc', href: '/equation-solver', icon: Binary, category: 'math', color: 'blue' },
  { id: 'matrix', titleKey: 'matrixTitle', descKey: 'matrixDesc', href: '/matrix-calculator', icon: LayoutGrid, category: 'math', color: 'indigo' },
  { id: 'calculus', titleKey: 'calculusTitle', descKey: 'calculusDesc', href: '/calculus-studio', icon: Activity, category: 'math', color: 'violet' },
  { id: 'periodic-table', titleKey: 'periodicTableTitle', descKey: 'periodicTableDesc', href: '/periodic-table', icon: Atom, category: 'utility', color: 'emerald' },
  { id: 'stats-inference', titleKey: 'statsInferenceTitle', descKey: 'statsInferenceDesc', href: '/stats-inference', icon: TrendingUp, category: 'math', color: 'rose' },
  { id: 'linear-algebra', titleKey: 'linearAlgebraProTitle', descKey: 'linearAlgebraProProDesc', href: '/linear-algebra-pro', icon: Layers, category: 'math', color: 'indigo' },
  { id: 'profit-loss', titleKey: 'profitLossTitle', descKey: 'profitLossDesc', href: '/profit-loss', icon: Tag, category: 'finance', color: 'emerald' },
  { id: 'file-stego', titleKey: 'fileStegoTitle', descKey: 'fileStegoDesc', href: '/file-stego', icon: EyeOff, category: 'dev', color: 'indigo' },
  { id: 'exif-stripper', titleKey: 'exifStripperTitle', descKey: 'exifStripperDesc', href: '/exif-stripper', icon: ShieldCheck, category: 'utility', color: 'emerald' },
  { id: 'camouflage', titleKey: 'camouflageTitle', descKey: 'camouflageDesc', href: '/camouflage', icon: Eraser, category: 'utility', color: 'cyan' },
  { id: 'note-shredder', titleKey: 'noteShredderTitle', descKey: 'noteShredderDesc', href: '/note-shredder', icon: ShieldX, category: 'dev', color: 'rose' },
  { id: 'password-vault', titleKey: 'passwordVaultTitle', descKey: 'passwordVaultDesc', href: '/password-vault', icon: ShieldCheck, category: 'dev', color: 'emerald' },
  { id: 'url-cleaner', titleKey: 'urlCleanerTitle', descKey: 'urlCleanerDesc', href: '/url-cleaner', icon: Scissors, category: 'utility', color: 'indigo' },
  { id: 'emoji-cipher', titleKey: 'emojiCipherTitle', descKey: 'emojiCipherDesc', href: '/emoji-cipher', icon: Smile, category: 'dev', color: 'amber' },
  { id: 'tsd-solver', titleKey: 'tsdSolverTitle', descKey: 'tsdSolverDesc', href: '/tsd-solver', icon: Waypoints, category: 'math', color: 'blue' },
  { id: 'pc-rank', titleKey: 'pcRankTitle', descKey: 'pcRankDesc', href: '/pc-rank-finder', icon: ListOrdered, category: 'math', color: 'purple' },
  { id: 'boolean-lab', titleKey: 'booleanLabTitle', descKey: 'booleanLabDesc', href: '/boolean-lab', icon: Cpu, category: 'dev', color: 'cyan' },
  { id: 'pdf-studio', titleKey: 'pdfStudioTitle', descKey: 'pdfStudioDesc', href: '/pdf', icon: FileText, category: 'pdf', color: 'red' },
];

export default function Home() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { t } = useLanguage();
  const [displayCount, setDisplayCount] = useState(0);
  const [usageData, setUsageData] = useState<Record<string, number>>({});
  const [isMounted, setIsMounted] = useState(false);

  // Initialize usage data
  useEffect(() => {
    const stored = localStorage.getItem('tool_usage');
    if (stored) {
      try {
        setUsageData(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse usage data');
      }
    }
    setIsMounted(true);
  }, []);

  const incrementUsage = (toolId: string) => {
    const newData = { ...usageData, [toolId]: (usageData[toolId] || 0) + 1 };
    setUsageData(newData);
    localStorage.setItem('tool_usage', JSON.stringify(newData));
  };

  const sortedTools = useMemo(() => {
    return [...TOOLS_DATA].sort((a, b) => {
      const usageA = usageData[a.id] || 0;
      const usageB = usageData[b.id] || 0;

      // Sort by usage first (descending)
      if (usageA !== usageB) {
        return usageB - usageA;
      }

      // Then sort alphabetically by translated title
      const titleA = t(a.titleKey as any).toLowerCase();
      const titleB = t(b.titleKey as any).toLowerCase();
      return titleA.localeCompare(titleB);
    });
  }, [usageData, t]);

  useEffect(() => {
    let start = 0;
    const end = TOOLS_DATA.length;
    let timer = setInterval(() => {
      start += 1;
      setDisplayCount(start);
      if (start >= end) clearInterval(timer);
    }, 20);
    return () => clearInterval(timer);
  }, []);

  const filteredTools = sortedTools.filter(tool => {
    const matchesCategory = activeCategory === 'all' || tool.category === activeCategory;
    const title = t(tool.titleKey as any);
    const desc = t(tool.descKey as any);
    const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background selection:bg-primary/10">
      {/* Hero Section */}
      <div className="relative pt-20 pb-16 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent -z-10" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-64 bg-primary/20 blur-[120px] rounded-full -z-20 opacity-50" />
        
        <div className="max-w-6xl mx-auto text-center space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-6"
          >
             <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                   {displayCount} Pro Tools Available
                </span>
             </div>
            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-primary to-primary/60 px-4">
              {t('appHeroTitle' as any)}
            </h1>
            <p className="mt-2 text-xl text-muted-foreground max-w-2xl mx-auto font-medium">
              {t('appSubtitle')}
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="max-w-xl mx-auto relative pt-8"
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('searchPlaceholder')} 
                className="w-full h-14 pl-12 pr-6 rounded-2xl border-2 bg-background/50 backdrop-blur-xl shadow-xl focus-visible:ring-primary/20 outline-none focus:border-primary transition-all text-lg"
              />
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-24 space-y-12">
        {/* Category Filters */}
        <div className="max-w-6xl mx-auto px-6 mb-12">
           <div className="flex flex-wrap gap-2 justify-center">
             {CATEGORIES.map(cat => (
               <Button
                 key={cat.id}
                 variant={activeCategory === cat.id ? 'default' : 'ghost'}
                 onClick={() => setActiveCategory(cat.id)}
                 className={`rounded-full gap-2 font-bold transition-all px-6 h-12 ${activeCategory === cat.id ? 'shadow-lg shadow-primary/20' : ''}`}
               >
                 <cat.icon className="w-4 h-4" />
                 {t(cat.labelKey as any)}
               </Button>
             ))}
           </div>
        </div>

        {/* Tools View */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {isMounted && filteredTools.map((tool, index) => {
            const Icon = tool.icon;
            const title = t(tool.titleKey as any);
            const desc = t(tool.descKey as any);

            return (
              <motion.div
                key={tool.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link href={tool.href} onClick={() => incrementUsage(tool.id)}>
                  <Card className="group h-full cursor-pointer hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 relative overflow-hidden bg-card/50 backdrop-blur-sm border-2">
                    <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                    </div>
                    {usageData[tool.id] > 5 && (
                      <div className="absolute -top-1 -right-1">
                        <div className="bg-primary text-[8px] font-black text-white px-2 py-1 rounded-bl-lg uppercase tracking-tighter">Popular</div>
                      </div>
                    )}
                    <CardHeader className="pb-4">
                      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                        <Icon className="w-7 h-7 text-primary" />
                      </div>
                      <CardTitle className="text-2xl font-bold tracking-tight">{title}</CardTitle>
                      <CardDescription className="text-base line-clamp-2 pt-1 font-medium">
                        {desc}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-end pt-4">
                      <div className="text-sm font-bold text-primary flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all -translate-x-4 group-hover:translate-x-0">
                        {t('launchApp')}
                        <span className="text-lg">→</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {filteredTools.length === 0 && (
          <div className="text-center py-20 space-y-4">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto">
              <Search className="w-10 h-10 text-muted-foreground" />
            </div>
            <p className="text-xl font-semibold text-muted-foreground">{t('noToolsFound')}</p>
            <Button variant="link" onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}>
              {t('clearFilters')}
            </Button>
          </div>
        )}

        {/* History Section */}
        <div className="pt-12">
           <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
             <Clock className="w-6 h-6 text-primary" />
             {t('history')}
           </h2>
           <HistoryView />
        </div>
      </div>

      {/* Footer / Status */}
      <footer className="border-t bg-muted/20 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col items-center justify-center text-center">
          <p className="text-sm font-medium text-muted-foreground">© 2026 HrshD1eux. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
