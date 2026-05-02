'use client';

import React, { useState, useEffect } from 'react';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { getHistory, deleteHistoryItem, clearHistory } from '@/lib/db';
import { useSettings } from '@/context/settings-context';
import { CalculatorHistoryItem } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { isTauri } from '@/lib/tauri-utils';
import { 
  History as HistoryIcon, 
  Trash2, 
  Clock, 
  Trash, 
  Calculator, 
  Calendar,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function HistoryView() {
  const [history, setHistory] = useState<CalculatorHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const { currency } = useSettings();
  const { toast } = useToast();

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const data = await getHistory(50);
      setHistory(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await deleteHistoryItem(id);
      setHistory(prev => prev.filter(item => item.id !== id));
      toast({ title: "Removed from history" });
    } catch (err) {
      toast({
        title: "Delete failed",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive"
      });
    }
  };

  const handleClearAll = async () => {
    await clearHistory();
    setHistory([]);
    setIsAlertOpen(false);
    toast({ title: "History cleared" });
  };

  return (
    <Card className="border-none shadow-xl bg-card/50 backdrop-blur-xl overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6 border-b border-border/40">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 rounded-lg">
                <HistoryIcon className="w-5 h-5 text-primary" />
            </div>
            <CardTitle className="text-xl font-bold">Calculation History</CardTitle>
          </div>
          <CardDescription>Review your past 50 calculations.</CardDescription>
        </div>
        {history.length > 0 && (
          <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="h-9 hover:bg-destructive/10 hover:text-destructive group transition-all">
                <Trash2 className="w-4 h-4 mr-2 group-hover:animate-bounce" />
                Clear All
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-[2rem] border-2">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-xl font-bold">Clear All History?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete all your calculation records from this device.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="gap-2">
                <AlertDialogCancel className="rounded-xl border-2">Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleClearAll}
                  className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 font-bold"
                >
                  Clear All Records
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[500px]">
          <div className="divide-y divide-border/40">
            <AnimatePresence mode="popLayout">
              {history.length > 0 ? (
                history.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="p-5 hover:bg-muted/30 transition-colors group cursor-default"
                  >
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-grow min-w-0">
                        <div className="p-2.5 bg-muted rounded-xl shrink-0 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                           <Calculator className="w-5 h-5" />
                        </div>
                        <div className="space-y-1 overflow-hidden">
                          <div className="flex items-center gap-2">
                             <h4 className="font-bold text-sm truncate">{item.calculator_name}</h4>
                             <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold uppercase tracking-wider">{item.category}</span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate font-mono">
                             {Object.entries(item.inputs).map(([k, v]) => `${k}: ${v}`).join(', ')}
                          </p>
                          <div className="flex items-center gap-2 pt-2">
                             <div className="px-3 py-1 bg-background rounded-lg border border-border/60 text-xs font-bold text-primary shadow-sm">
                                Result: {formatCurrency(Object.values(item.outputs)[0] as string, currency)}
                             </div>
                             <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium">
                                <Zap className="w-3 h-3 text-primary" />
                                {item.execution_time_ms}ms
                             </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-3 shrink-0">
                        <div className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
                           <Calendar className="w-3 h-3" />
                           {new Date(item.created_at).toLocaleDateString()}
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDelete(item.id)}
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : !isLoading ? (
                <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 px-6">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                     {isTauri() ? <Clock className="w-8 h-8 text-muted-foreground/50" /> : <Zap className="w-8 h-8 text-primary" />}
                  </div>
                  <div>
                    <p className="font-bold text-muted-foreground">{isTauri() ? "No History Yet" : "Desktop History Only"}</p>
                    <p className="text-sm text-muted-foreground/60 max-w-[200px]">
                      {isTauri() 
                        ? "Perform your first calculation to see entries here." 
                        : "Calculation history is stored locally on your device and is only accessible in the desktop app."}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-10 text-center text-sm text-muted-foreground animate-pulse">
                   Fetching records...
                </div>
              )}
            </AnimatePresence>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
