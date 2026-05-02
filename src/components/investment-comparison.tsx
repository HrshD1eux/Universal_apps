'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, Cell } from 'recharts';
import { Wallet, TrendingUp, Scale, Zap, Info, Share2, Calculator } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useSettings } from '@/context/settings-context';
import { safeInvoke, isTauri } from '@/lib/tauri-utils';
import { useToast } from '@/hooks/use-toast';

export default function InvestmentComparison() {
  const [amount, setAmount] = useState('10000'); // Monthly for SIP, Lumpsum for others?
  const [isMonthly, setIsMonthly] = useState(true);
  const [years, setYears] = useState(10);
  const { currency } = useSettings();
  const [resultData, setResultData] = useState<any>(null);
  const { toast } = useToast();

  const scenarios = [
    { name: 'Savings A/C', rate: 3.5, color: '#94a3b8' },
    { name: 'Fixed Deposit', rate: 7.0, color: '#f59e0b' },
    { name: 'PPF', rate: 7.1, color: '#10b981' },
    { name: 'Mutual Fund (SIP)', rate: 12.0, color: '#6366f1' },
    { name: 'Equity (High Risk)', rate: 15.0, color: '#ec4899' },
  ];

  const handleCalculate = async () => {
    if (!isTauri() || !amount) return;

    try {
        const res = await safeInvoke<any>('calculate_investment_comparison', {
            req: {
                amount: parseFloat(amount),
                years: parseFloat(years.toString()),
                is_monthly: isMonthly,
                scenarios: scenarios
            }
        });
        setResultData(res);
    } catch (err) {
        toast({
            title: "Comparison Error",
            description: err instanceof Error ? err.message : String(err),
            variant: "destructive"
        });
    }
  };

  useEffect(() => {
    handleCalculate();
  }, [amount, isMonthly, years]);

  const data = resultData?.data || [];
  const timelineData = resultData?.timeline?.map((t: any) => ({
    year: t.year,
    ...t.values
  })) || [];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <Card className="border-none shadow-2xl bg-gradient-to-br from-background via-muted/50 to-background overflow-hidden">
        <CardHeader className="bg-primary/5 border-b border-primary/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-600">
                <Scale className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-2xl">Investment Comparator</CardTitle>
                <CardDescription>Compare different asset classes side-by-side over time.</CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr,2fr] gap-12">
            {/* Controls */}
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-primary" />
                    Investment Amount
                  </label>
                  <div className="flex bg-muted p-1 rounded-lg scale-90">
                    <button 
                      onClick={() => setIsMonthly(true)}
                      className={`px-3 py-1 rounded-md text-[10px] font-black transition-all ${isMonthly ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground'}`}
                    >
                      MONTHLY
                    </button>
                    <button 
                      onClick={() => setIsMonthly(false)}
                      className={`px-3 py-1 rounded-md text-[10px] font-black transition-all ${!isMonthly ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground'}`}
                    >
                      LUMPSUM
                    </button>
                  </div>
                </div>
                <Input 
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="h-14 text-2xl font-black border-2 rounded-2xl focus:ring-primary"
                />
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-right">
                  Total Invested: {data.length > 0 ? formatCurrency(data[0].total_invested, currency) : '₹0'}
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                   <label className="text-sm font-bold">Time Horizon: <span className="text-primary">{years} Years</span></label>
                </div>
                <Slider 
                  value={[years]} 
                  onValueChange={(v) => setYears(v[0])} 
                  max={40} 
                  min={1} 
                  step={1} 
                  className="py-4"
                />
                <div className="flex justify-between text-[10px] font-black text-muted-foreground">
                   <span>1 YEAR</span>
                   <span>40 YEARS</span>
                </div>
              </div>

              <div className="p-6 rounded-[2rem] bg-primary/5 border-2 border-dashed border-primary/20">
                 <div className="flex gap-4">
                    <Zap className="w-6 h-6 text-primary shrink-0" />
                    <p className="text-xs text-muted-foreground leading-relaxed">
                       This tool uses compound interest logic to project growth. Rates are estimated based on historical market averages.
                    </p>
                 </div>
              </div>
            </div>

            {/* Visuals */}
            <div className="space-y-8">
               <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} layout="vertical" margin={{ left: 40, right: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(0,0,0,0.05)" />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800 }} />
                      <Tooltip 
                        formatter={(val: any) => [formatCurrency(val, currency), 'Estimated Value']}
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={32}>
                         {data.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={entry.color} />
                         ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {data.slice(2).map((item, i) => (
                    <div key={i} className="p-5 rounded-3xl border-2 bg-card relative overflow-hidden group">
                       <div className="absolute top-0 left-0 w-1.5 h-full" style={{ backgroundColor: item.color }} />
                       <p className="text-[10px] font-black text-muted-foreground uppercase mb-1">{item.name}</p>
                       <p className="text-2xl font-black">{formatCurrency(item.value, currency)}</p>
                       <p className="text-[10px] font-bold text-green-600">
                         Profit: {formatCurrency(item.value - item.total_invested, currency)}
                       </p>
                    </div>
                  ))}
               </div>
            </div>
          </div>

          <div className="mt-16 h-[300px] w-full bg-muted/20 rounded-[3rem] p-8 border border-border/50">
             <p className="text-xs font-black text-muted-foreground uppercase mb-6 text-center tracking-widest">Growth Trajectory</p>
             <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timelineData}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                   <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                   <YAxis hide />
                   <Tooltip 
                      formatter={(val: any) => [formatCurrency(val, currency), '']}
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                   />
                   {scenarios.map(s => (
                      <Line 
                        key={s.name} 
                        type="monotone" 
                        dataKey={s.name} 
                        stroke={s.color} 
                        strokeWidth={3} 
                        dot={false} 
                        activeDot={{ r: 6 }} 
                      />
                   ))}
                </LineChart>
             </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
