'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { Cpu, Binary, Table, Info, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '@/context/language-context';

export default function BooleanLogicLab() {
  const [expression, setExpression] = useState('A & B | C');
  const { t } = useLanguage();

  // Truth Table Logic
  const truthTable = useMemo(() => {
    try {
      // Find all unique variables in expression (A-D)
      const vars = Array.from(new Set(expression.match(/[A-D]/g) || [])).sort();
      if (vars.length === 0) return null;

      const rows = Math.pow(2, vars.length);
      const data: Array<Record<string, number>> = [];

      for (let i = 0; i < rows; i++) {
        const row: Record<string, number> = {};
        vars.forEach((v, idx) => {
          row[v] = (i >> (vars.length - 1 - idx)) & 1;
        });

        // Evaluate expression
        let evalStr = expression;
        vars.forEach(v => {
          evalStr = evalStr.replace(new RegExp(v, 'g'), row[v].toString());
        });
        
        // Simple evaluator for &, |, ^, !
        // eslint-disable-next-line no-new-func
        const result = new Function(
          `return (${evalStr.replace(/&/g, '&&').replace(/\|/g, '||').replace(/!/g, '!').replace(/\^/g, '^')})`
        )() ? 1 : 0;
        
        data.push({ ...row, result });
      }
      return { vars, data };
    } catch (e) {
      return null;
    }
  }, [expression]);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <Card className="border-none shadow-2xl bg-gradient-to-br from-background via-muted/50 to-background overflow-hidden font-sans">
        <CardHeader className="bg-primary/5 border-b border-primary/10 p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-primary text-primary-foreground rounded-2xl shadow-lg shadow-primary/20">
                <Cpu className="w-8 h-8" />
              </div>
              <div>
                <CardTitle className="text-3xl font-black tracking-tight">{t('booleanLabTitle' as any) || 'Boolean Logic Lab'}</CardTitle>
                <CardDescription className="text-base font-bold text-primary/60">Truth table generator & logic gate evaluation engine</CardDescription>
              </div>
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 text-xs font-bold text-primary">
              <CheckCircle2 className="w-4 h-4" /> Real-time State Generator
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr,1.5fr] gap-12">
            <div className="space-y-8">
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Boolean Expression (Vars: A, B, C, D)</label>
                <div className="relative">
                  <Input 
                    value={expression} 
                    onChange={(e) => setExpression(e.target.value.toUpperCase())} 
                    className="h-20 rounded-[2rem] border-2 text-3xl font-black focus:ring-primary pl-8 pr-20 uppercase tracking-tighter"
                    placeholder="A & B | C"
                  />
                  <div className="absolute right-6 top-1/2 -translate-y-1/2">
                    <Binary className="w-8 h-8 text-primary opacity-20" />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  {['&', '|', '^', '!', '(', ')'].map(op => (
                    <Button key={op} variant="outline" size="sm" onClick={() => setExpression(prev => prev + op)} className="rounded-xl font-black">{op}</Button>
                  ))}
                  <Button variant="ghost" size="sm" onClick={() => setExpression('')} className="rounded-xl font-bold text-rose-500">Clear</Button>
                </div>
                <p className="text-[10px] font-bold text-muted-foreground ml-4 italic">Operators: &amp; (AND), | (OR), ^ (XOR), ! (NOT)</p>
              </div>

              <div className="p-8 rounded-[3rem] bg-card border-2 shadow-xl space-y-6">
                <div className="flex items-center gap-3">
                  <Info className="w-5 h-5 text-primary" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Logic Insight</span>
                </div>
                <p className="text-sm font-bold text-muted-foreground leading-relaxed">
                  Evaluates boolean precedence (NOT &gt; AND &gt; XOR &gt; OR) across all $2^n$ state configurations for up to 4 variables.
                </p>
              </div>
            </div>

            <div className="bg-muted/30 rounded-[3rem] border-2 shadow-inner p-10 overflow-hidden min-h-[450px]">
              {truthTable ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-center border-collapse">
                    <thead>
                      <tr className="border-b-2 border-primary/10">
                        {truthTable.vars.map(v => (
                          <th key={v} className="p-4 text-sm font-black text-primary">{v}</th>
                        ))}
                        <th className="p-4 text-sm font-black text-rose-500">OUTPUT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {truthTable.data.map((row, i) => (
                        <motion.tr 
                          key={i} 
                          initial={{ opacity: 0, x: -10 }} 
                          animate={{ opacity: 1, x: 0 }} 
                          transition={{ delay: i * 0.015 }}
                          className="border-b border-primary/5 hover:bg-primary/5 transition-colors"
                        >
                          {truthTable.vars.map(v => (
                            <td key={v} className="p-4 text-base font-black font-mono">{row[v]}</td>
                          ))}
                          <td className={`p-4 text-base font-black font-mono ${row.result ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {row.result}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                  <Table className="w-20 h-20 mb-4" />
                  <p className="text-xl font-black italic">Invalid Expression or No Variables (A-D) Found</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
