'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { safeInvoke, isTauri } from '@/lib/tauri-utils';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart4, Hash, Sigma, Binary, Zap, ArrowRight, ListOrdered, Plus, RefreshCcw } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';

export default function StatisticsTool() {
  const [data, setData] = useState('10, 20, 30, 40, 50, 60, 70, 80, 90, 100');
  const [result, setResult] = useState<any>(null);
  const { t } = useLanguage();
  const { toast } = useToast();

  const handleCalculate = async () => {
    if (!isTauri() || !data) return;

    try {
      const numbers = data.split(/[,\s\n]+/).map(n => parseFloat(n)).filter(n => !isNaN(n));
      if (numbers.length === 0) return;

      const res = await safeInvoke<any>('calculate_statistics', { numbers });
      setResult(res);
    } catch (err) {
      toast({
        title: "Statistics Error",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    handleCalculate();
  }, [data]);

  const chartData = data.split(/[,\s\n]+/)
    .map(n => parseFloat(n))
    .filter(n => !isNaN(n))
    .map((val, i) => ({ name: `P${i+1}`, value: val }));

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <Card className="border-none shadow-2xl bg-gradient-to-br from-background via-muted/50 to-background overflow-hidden">
        <CardHeader className="bg-primary/5 border-b border-primary/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-500/10 rounded-lg">
              <BarChart4 className="w-6 h-6 text-rose-600" />
            </div>
            <div>
              <CardTitle className="text-2xl">{t('statsTitle')}</CardTitle>
              <CardDescription>{t('statsDesc')}</CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr,1.5fr] gap-12">
            {/* Input Section */}
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-semibold flex items-center gap-2">
                   <ListOrdered className="w-4 h-4 text-primary" />
                   {t('enterData')}
                </label>
                <Textarea
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  placeholder="e.g. 10, 20.5, 30..."
                  className="min-h-[200px] text-lg border-2 rounded-2xl focus:ring-rose-500 font-mono p-6 resize-none"
                />
              </div>

              {chartData.length > 0 && (
                <div className="h-[200px] w-full bg-muted/30 rounded-3xl p-4 border border-border/50">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                      <XAxis dataKey="name" hide />
                      <YAxis hide />
                      <RechartsTooltip 
                        cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Results Section */}
            <div className="space-y-6">
              <AnimatePresence mode="wait">
                {result && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                  >
                    <StatCard label="Mean" value={result.mean.toFixed(2)} icon={<Sigma className="w-5 h-5" />} color="blue" />
                    <StatCard label="Median" value={result.median.toFixed(2)} icon={<Binary className="w-5 h-5" />} color="green" />
                    <StatCard label="Sum" value={result.sum.toFixed(2)} icon={<Plus className="w-5 h-5" />} color="indigo" />
                    <StatCard label="Geo Mean" value={result.geometric_mean > 0 ? result.geometric_mean.toFixed(2) : 'N/A'} icon={<Zap className="w-5 h-5" />} color="cyan" />
                    <StatCard label="Variance" value={result.variance.toFixed(4)} icon={<RefreshCcw className="w-5 h-5" />} color="violet" />
                    <StatCard label="Std Deviation" value={result.std_dev.toFixed(4)} icon={<Zap className="w-5 h-5" />} color="amber" />
                    <StatCard label="Min" value={result.min} icon={<ArrowRight className="w-5 h-5 rotate-135" />} color="rose" />
                    <StatCard label="Max" value={result.max} icon={<ArrowRight className="w-5 h-5 -rotate-45" />} color="emerald" />
                    <StatCard 
                        label="Mode" 
                        value={result.mode.length > 0 ? result.mode.join(', ') : 'None'} 
                        icon={<Hash className="w-5 h-5" />} 
                        color="purple" 
                        full 
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value, icon, color, full = false }: { label: string, value: string | number, icon: React.ReactNode, color: string, full?: boolean }) {
  return (
    <div className={`p-6 rounded-[2rem] border-2 bg-card hover:border-primary/30 transition-all ${full ? 'sm:col-span-2' : ''}`}>
       <div className={`w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 text-primary`}>
          {icon}
       </div>
       <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest mb-1">{label}</p>
       <p className="text-2xl font-black truncate">{value}</p>
    </div>
  );
}
