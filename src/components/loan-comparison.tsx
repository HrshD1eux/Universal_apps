'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { Landmark, ArrowRight, Wallet, Clock, Percent, TrendingDown, Info, ShieldCheck as ShieldCheckIcon, Scale, CheckCircle2 } from 'lucide-react';
import { safeInvoke, isTauri } from '@/lib/tauri-utils';
import { formatCurrency } from '@/lib/utils';
import { useSettings } from '@/context/settings-context';

export default function LoanComparison() {
  const { currency } = useSettings();
  const [amount, setAmount] = useState('1000000');
  
  // Loan A
  const [rateA, setRateA] = useState('8.5');
  const [tenureA, setTenureA] = useState('20');
  const [isSekdaA, setIsSekdaA] = useState(false);
  
  // Loan B
  const [rateB, setRateB] = useState('9.0');
  const [tenureB, setTenureB] = useState('15');
  const [isSekdaB, setIsSekdaB] = useState(false);

  const [resultA, setResultA] = useState<any>(null);
  const [resultB, setResultB] = useState<any>(null);

  const calculateLoans = async () => {
    if (!isTauri()) return;
    
    try {
      const annualRateA = isSekdaA ? parseFloat(rateA) * 12 : parseFloat(rateA);
      const resA = await safeInvoke<any>('calculate_emi', {
        principal: parseFloat(amount),
        annualRate: annualRateA,
        tenureYears: parseFloat(tenureA)
      });
      setResultA(resA);

      const annualRateB = isSekdaB ? parseFloat(rateB) * 12 : parseFloat(rateB);
      const resB = await safeInvoke<any>('calculate_emi', {
        principal: parseFloat(amount),
        annualRate: annualRateB,
        tenureYears: parseFloat(tenureB)
      });
      setResultB(resB);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    calculateLoans();
  }, [amount, rateA, tenureA, rateB, tenureB, isSekdaA, isSekdaB]);

  const betterEmi = resultA && resultB ? (parseFloat(resultA.monthly_emi) < parseFloat(resultB.monthly_emi) ? 'A' : 'B') : null;
  const betterInterest = resultA && resultB ? (parseFloat(resultA.total_interest) < parseFloat(resultB.total_interest) ? 'A' : 'B') : null;

  return (
    <Card className="max-w-6xl mx-auto border-none shadow-2xl bg-gradient-to-br from-background via-muted/50 to-background overflow-hidden">
      <CardHeader className="bg-primary/5 border-b border-primary/10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Scale className="w-6 h-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl">Loan Comparison</CardTitle>
            <CardDescription>Compare two loan offers side-by-side to find the best deal.</CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-8 space-y-12">
        {/* Global Amount */}
        <div className="max-w-md mx-auto text-center space-y-4">
           <label className="text-sm font-black uppercase tracking-widest text-muted-foreground">Loan Amount</label>
           <div className="relative">
              <Wallet className="absolute left-6 top-1/2 -translate-y-1/2 w-8 h-8 text-primary opacity-50" />
              <Input 
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-20 text-4xl border-4 rounded-[2rem] text-center font-black focus:ring-primary pl-16 pr-6 shadow-xl"
              />
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16">
          {/* Loan A */}
          <ComparisonOffer 
             title="Offer A"
             rate={rateA}
             setRate={setRateA}
             isSekda={isSekdaA}
             setIsSekda={setIsSekdaA}
             tenure={tenureA}
             setTenure={setTenureA}
             result={resultA}
             isBetterEmi={betterEmi === 'A'}
             isBetterInterest={betterInterest === 'A'}
             currency={currency}
          />

          {/* Loan B */}
          <ComparisonOffer 
             title="Offer B"
             rate={rateB}
             setRate={setRateB}
             isSekda={isSekdaB}
             setIsSekda={setIsSekdaB}
             tenure={tenureB}
             setTenure={setTenureB}
             result={resultB}
             isBetterEmi={betterEmi === 'B'}
             isBetterInterest={betterInterest === 'B'}
             color="bg-primary/5"
             accentColor="text-primary"
             currency={currency}
          />
        </div>

        {/* Summary Message */}
        <AnimatePresence>
           {resultA && resultB && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 rounded-3xl bg-primary/10 border-2 border-primary/20 flex flex-col md:flex-row items-center gap-6"
              >
                  <div className="p-4 bg-primary rounded-2xl text-primary-foreground">
                     <ShieldCheckIcon className="w-8 h-8" />
                  </div>
                  <div className="flex-grow text-center md:text-left">
                     <h4 className="text-lg font-bold">Comparison Insight</h4>
                     <p className="text-sm text-muted-foreground">
                        {betterEmi === betterInterest 
                           ? `Offer ${betterEmi} is superior in both monthly payment and total cost.` 
                           : `Offer ${betterEmi} has a lower EMI, but Offer ${betterInterest} saves you ${formatCurrency(Math.abs(parseFloat(resultA.total_interest) - parseFloat(resultB.total_interest)), currency)} in total interest.`
                        }
                     </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-background border border-border shadow-sm">
                     <p className="text-[10px] font-black uppercase text-muted-foreground">Difference in Total Cost</p>
                     <p className="text-xl font-black text-primary">
                        {formatCurrency(Math.abs(parseFloat(resultA.total_payable) - parseFloat(resultB.total_payable)), currency)}
                     </p>
                  </div>
              </motion.div>
           )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

function ComparisonOffer({ 
  title, rate, setRate, isSekda, setIsSekda, tenure, setTenure, result, isBetterEmi, isBetterInterest, currency,
  color = "bg-primary/5", accentColor = "text-primary" 
}: any) {
  return (
    <div className={`p-8 rounded-[3rem] border-2 border-border/50 ${color} space-y-8 relative overflow-hidden transition-all hover:border-primary/30`}>
        <div className="flex items-center justify-between">
           <h3 className={`text-xl font-black ${accentColor}`}>{title}</h3>
           <button 
             onClick={() => setIsSekda(!isSekda)}
             className={`text-[10px] font-bold px-3 py-1 rounded-full transition-all ${isSekda ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
           >
              {isSekda ? 'Sekda mode' : 'Standard mode'}
           </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
           <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">
                {isSekda ? 'Interest (Sekda)' : 'Interest Rate (%)'}
              </label>
              <div className="relative">
                 <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                 <Input type="number" value={rate} onChange={(e) => setRate(e.target.value)} className="h-12 pl-8 pr-10 border-2 rounded-2xl font-mono" />
                 <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold opacity-40">
                    {isSekda ? '₹/100' : '%'}
                 </span>
              </div>
           </div>
           <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Tenure (Years)</label>
              <div className="relative">
                 <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                 <Input type="number" value={tenure} onChange={(e) => setTenure(e.target.value)} className="h-12 pl-8 border-2 rounded-2xl font-mono" />
              </div>
           </div>
        </div>

        {result && (
           <div className="space-y-4">
              <div className={`p-5 rounded-3xl bg-background border-2 relative transition-all ${isBetterEmi ? 'border-green-500/50 shadow-lg' : 'border-border'}`}>
                 <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Monthly EMI</p>
                 <div className="flex items-center justify-between">
                    <p className={`text-2xl font-black ${isBetterEmi ? 'text-green-600' : ''}`}>{formatCurrency(result.monthly_emi, currency)}</p>
                    {isBetterEmi && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                 </div>
              </div>

              <div className={`p-5 rounded-3xl bg-background border-2 relative transition-all ${isBetterInterest ? 'border-green-500/50 shadow-lg' : 'border-border'}`}>
                 <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Total Interest</p>
                 <div className="flex items-center justify-between">
                    <p className={`text-2xl font-black ${isBetterInterest ? 'text-green-600' : ''}`}>{formatCurrency(result.total_interest, currency)}</p>
                    {isBetterInterest && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                 </div>
              </div>

              <div className="p-5 rounded-3xl bg-background/50 border-2 border-dashed border-border">
                 <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Total Payable</p>
                 <p className="text-xl font-bold">{formatCurrency(result.total_payable, currency)}</p>
              </div>
           </div>
        )}
    </div>
  )
}
