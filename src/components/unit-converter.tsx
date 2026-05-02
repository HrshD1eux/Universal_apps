'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { safeInvoke, isTauri } from '@/lib/tauri-utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRightLeft, Scale, Search, History, Zap, Info, ChevronRight, Calculator } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { UNIT_CATEGORIES } from '@/lib/unit-data';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function UnitConverter() {
  const [value, setValue] = useState('1');
  const [category, setCategory] = useState(UNIT_CATEGORIES[0]);
  const [fromUnit, setFromUnit] = useState(UNIT_CATEGORIES[0].units[0]);
  const [toUnit, setToUnit] = useState(UNIT_CATEGORIES[0].units[1]);
  const [result, setResult] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const { toast } = useToast();

  const categories = useMemo(() => {
    if (!search) return UNIT_CATEGORIES;
    return UNIT_CATEGORIES.map(cat => ({
      ...cat,
      units: cat.units.filter(u => 
        u.name.toLowerCase().includes(search.toLowerCase()) || 
        cat.name.toLowerCase().includes(search.toLowerCase())
      )
    })).filter(cat => cat.units.length > 0);
  }, [search]);

  const handleConvert = async () => {
    if (!isTauri() || !value) return;

    try {
      const res = await safeInvoke<any>('convert_units', {
        request: {
          value: parseFloat(value),
          from_unit: fromUnit.id,
          to_unit: toUnit.id,
          category: category.id
        }
      });
      setResult(res.formatted);
    } catch (err) {
      toast({
        title: "Conversion Error",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    handleConvert();
  }, [value, fromUnit, toUnit, category]);

  const handleCategoryChange = (cat: any) => {
    setCategory(cat);
    setFromUnit(cat.units[0]);
    setToUnit(cat.units[1] || cat.units[0]);
    setResult(null);
  };

  const swapUnits = () => {
    const temp = fromUnit;
    setFromUnit(toUnit);
    setToUnit(temp);
  };

  return (
    <Card className="max-w-6xl mx-auto border-none shadow-2xl bg-gradient-to-br from-background via-muted/50 to-background overflow-hidden relative">
      {!isTauri() && (
        <div className="absolute inset-0 z-50 backdrop-blur-sm bg-background/20 flex flex-col items-center justify-center p-6 text-center">
            <div className="bg-background/90 p-8 rounded-3xl shadow-2xl border-2 border-primary/20 max-w-sm">
                <ArrowRightLeft className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
                <h3 className="text-xl font-bold mb-2">Desktop Required</h3>
                <p className="text-sm text-muted-foreground mb-6">
                    Universal unit conversions require the high-precision desktop engine for accuracy.
                </p>
                <Button variant="outline" className="rounded-xl" onClick={() => window.location.reload()}>
                    Retry Detection
                </Button>
            </div>
        </div>
      )}
      
      <CardHeader className="bg-primary/5 border-b border-primary/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Scale className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">Universal Unit Converter</CardTitle>
              <CardDescription>High-precision calculations with industrial-grade accuracy.</CardDescription>
            </div>
          </div>
          <div className="relative w-64 hidden md:block">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
             <Input 
                placeholder="Search units..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-background/50 border-primary/20 rounded-xl"
             />
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 flex flex-col md:flex-row md:h-[600px]">
        {/* Sidebar Categories */}
        <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-border/50 bg-muted/30 flex flex-col max-h-[300px] md:max-h-full">
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4 px-2">Categories</p>
              <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryChange(cat)}
                    className={`whitespace-nowrap md:whitespace-normal flex items-center justify-between px-4 py-2.5 rounded-xl text-sm transition-all shrink-0 md:shrink-1 ${
                      category.id === cat.id 
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 font-bold' 
                      : 'hover:bg-primary/10 text-muted-foreground hover:text-primary'
                    }`}
                  >
                    <span className="truncate">{cat.name}</span>
                    <ChevronRight className={`hidden md:block w-3.5 h-3.5 transition-transform ${category.id === cat.id ? 'rotate-90' : ''}`} />
                  </button>
                ))}
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* Main Work Area */}
        <div className="flex-1 p-8 flex flex-col gap-8 bg-background/50 backdrop-blur-sm overflow-y-auto">
           <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] gap-6 items-center">
              {/* FROM */}
              <div className="space-y-4">
                 <div className="p-6 rounded-3xl bg-card border-2 border-border shadow-sm space-y-4">
                    <p className="text-[10px] font-black uppercase text-muted-foreground">From</p>
                    <Input 
                       type="number"
                       value={value}
                       onChange={(e) => setValue(e.target.value)}
                       className="h-14 text-3xl font-black bg-transparent border-none p-0 focus-visible:ring-0"
                    />
                    <select 
                      value={fromUnit.id}
                      onChange={(e) => setFromUnit(category.units.find(u => u.id === e.target.value)!)}
                      className="w-full bg-muted/50 border-none rounded-xl h-10 px-3 text-xs font-bold outline-none appearance-none cursor-pointer"
                    >
                      {category.units.map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                 </div>
              </div>

              <Button 
                variant="outline" 
                size="icon" 
                onClick={swapUnits}
                className="rounded-full w-12 h-12 shadow-xl hover:rotate-180 transition-transform duration-500 bg-background"
              >
                 <ArrowRightLeft className="w-5 h-5 text-primary" />
              </Button>

              {/* TO */}
              <div className="space-y-4">
                 <div className="p-6 rounded-3xl bg-primary shadow-2xl shadow-primary/20 space-y-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                       <Zap className="w-24 h-24 text-white" />
                    </div>
                    <p className="text-[10px] font-black uppercase text-primary-foreground/60">To (Result)</p>
                    <div className="h-14 flex items-center">
                       <p className="text-3xl font-black text-primary-foreground truncate">
                          {result || '---'}
                       </p>
                    </div>
                    <select 
                      value={toUnit.id}
                      onChange={(e) => setToUnit(category.units.find(u => u.id === e.target.value)!)}
                      className="w-full bg-white/10 border-none rounded-xl h-10 px-3 text-xs font-bold text-white outline-none appearance-none cursor-pointer"
                    >
                      {category.units.map(u => (
                        <option key={u.id} value={u.id} className="text-black">{u.name}</option>
                      ))}
                    </select>
                 </div>
              </div>
           </div>

           {category.id === 'area_rural' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-2xl bg-primary/10 border border-primary/20 text-[10px] text-primary leading-relaxed"
              >
                  <b>Regional Note:</b> Bigha values vary significantly across India. This converter uses the <b>Standard (Pucca) Bigha</b> equivalent to 3,025 square yards (approx. 2,529 sqm). Please verify local measurements for specific regional accuracy.
              </motion.div>
           )}

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-auto">
              <div className="p-6 rounded-[2rem] border-2 border-dashed border-primary/20 flex items-center gap-4 group hover:bg-primary/5 transition-colors">
                 <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                    <Calculator className="w-5 h-5" />
                 </div>
                 <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase opacity-60">Accuracy</p>
                    <p className="text-sm font-bold">10 Significant Digits</p>
                 </div>
              </div>
              <div className="p-6 rounded-[2rem] border-2 border-dashed border-primary/20 flex items-center gap-4 group hover:bg-primary/5 transition-colors">
                 <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                    <Info className="w-5 h-5" />
                 </div>
                 <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase opacity-60">Context</p>
                    <p className="text-sm font-bold truncate">Converting {category.name}</p>
                 </div>
              </div>
           </div>
        </div>
      </CardContent>
    </Card>
  );
}
