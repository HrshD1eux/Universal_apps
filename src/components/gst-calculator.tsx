"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sun, Moon, Trash2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

type Currency = "INR" | "USD" | "EUR";
type Theme = "light" | "dark";
type HistoryItem = {
  id: number;
  baseAmount: number;
  gstAmount: number;
  totalAmount: number;
  gstRate: number;
  isInclusive: boolean;
  currency: Currency;
};

const PRESET_RATES = [5, 12, 18, 28];

const currencySymbols: Record<Currency, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
};

const formatCurrency = (amount: number, currency: Currency) => {
    return `${currencySymbols[currency]}${amount.toFixed(2)}`;
};

export default function GstCalculator() {
  const [isMounted, setIsMounted] = useState(false);
  const [theme, setTheme] = useState<Theme>("dark");
  const [currency, setCurrency] = useState<Currency>("INR");
  
  const [amountStr, setAmountStr] = useState("1000");
  const [gstRate, setGstRate] = useState<number>(18);
  const [customGstRate, setCustomGstRate] = useState("");
  const [isInclusive, setIsInclusive] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [activeRate, setActiveRate] = useState<number | 'custom'>(18);


  useEffect(() => {
    setIsMounted(true);
    const storedTheme = localStorage.getItem("tax-theme") as Theme | null;
    if (storedTheme) {
        setTheme(storedTheme);
    } else {
        setTheme('dark');
    }
    
    const storedHistory = localStorage.getItem("tax-history");
    if (storedHistory) {
      setHistory(JSON.parse(storedHistory));
    }

    const storedCurrency = localStorage.getItem("tax-currency") as Currency | null;
    if (storedCurrency) {
      setCurrency(storedCurrency);
    }
  }, []);

  useEffect(() => {
    if (isMounted) {
      document.documentElement.classList.remove("light", "dark");
      document.documentElement.classList.add(theme);
      localStorage.setItem("tax-theme", theme);
    }
  }, [theme, isMounted]);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem("tax-history", JSON.stringify(history));
    }
  }, [history, isMounted]);
  
  useEffect(() => {
    if(isMounted) {
      localStorage.setItem("tax-currency", currency);
    }
  }, [currency, isMounted]);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const { baseAmount, gstAmount, totalAmount } = useMemo(() => {
    const amount = parseFloat(amountStr) || 0;
    const rate = gstRate / 100;
    
    if (amount === 0) return { baseAmount: 0, gstAmount: 0, totalAmount: 0 };

    if (isInclusive) {
      const total = amount;
      const base = amount / (1 + rate);
      const gst = total - base;
      return { baseAmount: base, gstAmount: gst, totalAmount: total };
    } else {
      const base = amount;
      const gst = base * rate;
      const total = base + gst;
      return { baseAmount: base, gstAmount: gst, totalAmount: total };
    }
  }, [amountStr, gstRate, isInclusive]);

  const handlePresetRateClick = (rate: number) => {
    setGstRate(rate);
    setCustomGstRate("");
    setActiveRate(rate);
  };

  const handleCustomRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomGstRate(value);
    setActiveRate('custom');
    const parsedValue = parseFloat(value);
    if (!isNaN(parsedValue)) {
      setGstRate(parsedValue);
    } else if (value === "") {
        setGstRate(0);
    }
  };

  const handleSaveToHistory = () => {
    const newEntry: HistoryItem = {
      id: Date.now(),
      baseAmount,
      gstAmount,
      totalAmount,
      gstRate,
      isInclusive,
      currency,
    };
    setHistory([newEntry, ...history].slice(0, 10)); // Keep last 10
  };

  const handleClearHistory = () => {
    setHistory([]);
  };

  if (!isMounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
          <div className="p-8 bg-card rounded-lg shadow-2xl">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
          </div>
      </div>
    );
  }

  return (
    <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="min-h-screen bg-background text-foreground font-sans transition-colors duration-500">
      <div className="container mx-auto p-4 sm:p-8 flex flex-col items-center">
        <header className="w-full max-w-3xl flex justify-between items-center mb-8">
            <Link href="/" passHref>
               <Button variant="outline" size="icon" className="rounded-full w-10 h-10 transition-transform duration-300 hover:scale-110 border-primary/50 hover:bg-primary/10">
                    <ArrowLeft className="h-5 w-5 text-primary" />
                </Button>
            </Link>
          <h1 className="text-3xl sm:text-4xl font-bold text-primary">
            GST Calculator
          </h1>
          <div className="flex items-center gap-2">
            <Select value={currency} onValueChange={(value: Currency) => setCurrency(value)}>
              <SelectTrigger className="w-[90px] rounded-full bg-card border-primary/50 text-primary">
                <SelectValue placeholder="Currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INR">₹ INR</SelectItem>
                <SelectItem value="USD">$ USD</SelectItem>
                <SelectItem value="EUR">€ EUR</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={toggleTheme} aria-label="Toggle theme" className="rounded-full w-10 h-10 transition-transform duration-300 hover:scale-110 text-primary border-primary/50 hover:bg-primary/10">
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
          </div>
        </header>

        <main className="w-full max-w-3xl space-y-8">
          <Card className="shadow-2xl rounded-2xl border-primary/20 bg-card/50 backdrop-blur-sm transition-all duration-500 hover:shadow-primary/20">
            <CardContent className="p-6 grid gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                  <div className="space-y-2">
                      <Label htmlFor="amount" className="font-medium text-muted-foreground">{isInclusive ? 'Total Amount' : 'Base Amount'}</Label>
                      <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-muted-foreground">{currencySymbols[currency]}</span>
                          <Input
                              id="amount"
                              type="number"
                              placeholder="0.00"
                              value={amountStr}
                              onChange={(e) => setAmountStr(e.target.value)}
                              className="pl-12 text-2xl font-semibold h-14 rounded-lg bg-background/50 border-primary/30 focus:border-primary focus:bg-background"
                          />
                      </div>
                  </div>
                  <div className="flex items-center space-x-2 pb-2 justify-self-start md:justify-self-end">
                      <Label htmlFor="inclusive-switch" className="mr-2 cursor-pointer text-muted-foreground">Inclusive GST</Label>
                      <Switch
                          id="inclusive-switch"
                          checked={isInclusive}
                          onCheckedChange={setIsInclusive}
                      />
                  </div>
              </div>
              
              <div className="space-y-3">
                <Label className="font-medium text-muted-foreground">GST Rate (%)</Label>
                <div className="flex flex-wrap gap-2 items-center">
                  {PRESET_RATES.map((rate) => (
                    <Button
                      key={rate}
                      variant={activeRate === rate ? "default" : "outline"}
                      onClick={() => handlePresetRateClick(rate)}
                      className="transition-all duration-300 rounded-full px-5 py-2 transform hover:scale-105 border-primary/50 dark:hover:bg-primary/90 dark:hover:text-primary-foreground"
                    >
                      {rate}%
                    </Button>
                  ))}
                  <div className="relative flex-grow min-w-[120px]">
                      <Input
                          type="number"
                          placeholder="Custom"
                          value={customGstRate}
                          onFocus={() => setActiveRate('custom')}
                          onChange={handleCustomRateChange}
                          className="pr-8 h-10 rounded-full bg-background/50 border-primary/30"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                  </div>
                </div>
              </div>
            </CardContent>
            <Separator className="bg-primary/20"/>
            <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                <motion.div
                    key={`base-${baseAmount}`}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="p-4 bg-secondary rounded-xl transition-transform duration-300 hover:scale-105 hover:shadow-lg">
                    <p className="text-sm text-muted-foreground">Base Amount</p>
                    <p className="text-2xl font-semibold text-secondary-foreground">{formatCurrency(baseAmount, currency)}</p>
                </motion.div>
                <motion.div
                    key={`gst-${gstAmount}`}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
                    className="p-4 bg-secondary rounded-xl transition-transform duration-300 hover:scale-105 hover:shadow-lg">
                    <p className="text-sm text-muted-foreground">GST Amount</p>
                    <p className="text-2xl font-semibold text-secondary-foreground">{formatCurrency(gstAmount, currency)}</p>
                </motion.div>
                <motion.div 
                    key={`total-${totalAmount}`}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.2 }}
                    className="p-4 bg-primary/20 dark:bg-primary dark:text-primary-foreground rounded-xl transition-transform duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/30">
                    <p className="text-sm font-medium text-primary dark:text-primary-foreground">Total Amount</p>
                    <p className="text-2xl font-bold text-primary dark:text-primary-foreground">{formatCurrency(totalAmount, currency)}</p>
                </motion.div>
            </CardContent>
            <CardFooter className="p-6">
              <Button onClick={handleSaveToHistory} className="w-full h-12 text-lg rounded-xl font-bold transition-transform duration-300 hover:scale-102 active:scale-98" disabled={!parseFloat(amountStr)}>Save Calculation</Button>
            </CardFooter>
          </Card>

          <AnimatePresence>
          {history.length > 0 && (
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                transition={{ duration: 0.5 }}
            >
            <Card className="shadow-lg rounded-2xl border-primary/20 bg-card/50">
              <CardHeader className="flex flex-row items-center justify-between p-6">
                <div >
                  <CardTitle>History</CardTitle>
                  <CardDescription className="text-muted-foreground">Your last 10 calculations.</CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={handleClearHistory} aria-label="Clear history" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full">
                  <Trash2 className="h-5 w-5" />
                </Button>
              </CardHeader>
              <CardContent className="px-2 sm:px-6 pb-6">
                <ScrollArea className="h-[200px] pr-4">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent border-primary/20">
                        <TableHead>Total</TableHead>
                        <TableHead className="hidden sm:table-cell">Base</TableHead>
                        <TableHead className="hidden sm:table-cell">GST</TableHead>
                        <TableHead className="text-right">Rate</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <AnimatePresence>
                      {history.map((item) => (
                        <motion.tr 
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0, x: -50 }}
                          key={item.id} className="border-primary/10">
                          <TableCell className="font-medium">{formatCurrency(item.totalAmount, item.currency)}</TableCell>
                          <TableCell className="hidden sm:table-cell">{formatCurrency(item.baseAmount, item.currency)}</TableCell>
                          <TableCell className="hidden sm:table-cell">{formatCurrency(item.gstAmount, item.currency)}</TableCell>
                          <TableCell className="text-right">{item.gstRate}% {item.isInclusive && <span className="text-xs text-muted-foreground">(Inc.)</span>}</TableCell>
                        </motion.tr>
                      ))}
                      </AnimatePresence>
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
            </motion.div>
          )}
          </AnimatePresence>
        </main>
      </div>
    </motion.div>
  );
}
