"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Sun, Moon } from "lucide-react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";

type Theme = "light" | "dark";

export default function PercentageCalculator() {
  const [isMounted, setIsMounted] = useState(false);
  const [theme, setTheme] = useState<Theme>("dark");

  const [activeTab, setActiveTab] = useState("p1");

  // Tab 1: What is X% of Y?
  const [p1Value1, setP1Value1] = useState("15");
  const [p1Value2, setP1Value2] = useState("500");
  
  // Tab 2: X is what percent of Y?
  const [p2Value1, setP2Value1] = useState("75");
  const [p2Value2, setP2Value2] = useState("500");

  // Tab 3: Balance Calculator
  const [p3Total, setP3Total] = useState("1000");
  const [p3Paid, setP3Paid] = useState("250");


  useEffect(() => {
    setIsMounted(true);
    const storedTheme = localStorage.getItem("tax-theme") as Theme | null;
    if (storedTheme) {
        setTheme(storedTheme);
    } else {
        setTheme('dark');
    }
  }, []);

  useEffect(() => {
    if (isMounted) {
      document.documentElement.classList.remove("light", "dark");
      document.documentElement.classList.add(theme);
      localStorage.setItem("tax-theme", theme);
    }
  }, [theme, isMounted]);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const p1Result = useMemo(() => {
    const v1 = parseFloat(p1Value1);
    const v2 = parseFloat(p1Value2);
    if (!isNaN(v1) && !isNaN(v2)) {
      return ((v1 / 100) * v2).toFixed(2);
    }
    return "0.00";
  }, [p1Value1, p1Value2]);

  const p2Result = useMemo(() => {
    const v1 = parseFloat(p2Value1);
    const v2 = parseFloat(p2Value2);
    if (!isNaN(v1) && !isNaN(v2) && v2 !== 0) {
      return ((v1 / v2) * 100).toFixed(2);
    }
    return "0.00";
  }, [p2Value1, p2Value2]);
  
  const p3Result = useMemo(() => {
    const total = parseFloat(p3Total);
    const paid = parseFloat(p3Paid);
    if (!isNaN(total) && !isNaN(paid)) {
        return (total - paid).toFixed(2);
    }
    return "0.00";
  }, [p3Total, p3Paid]);
  
  if (!isMounted) {
     return (
      <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const renderResult = (result: string, suffix = "") => (
    <div className="text-center pt-4">
        <p className="text-muted-foreground">Result</p>
        <AnimatePresence mode="wait">
            <motion.p
                key={result}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.2 }}
                className="text-4xl font-bold text-primary"
            >
                {result}{suffix}
            </motion.p>
        </AnimatePresence>
    </div>
  );

  return (
    <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="min-h-screen bg-background text-foreground font-sans">
      <div className="container mx-auto p-4 sm:p-8 flex flex-col items-center">
        <header className="w-full max-w-2xl flex justify-between items-center mb-8">
           <Link href="/" passHref>
               <Button variant="outline" size="icon" className="rounded-full w-10 h-10 transition-transform duration-300 hover:scale-110 border-primary/50 hover:bg-primary/10">
                    <ArrowLeft className="h-5 w-5 text-primary" />
                </Button>
            </Link>
          <h1 className="text-3xl sm:text-4xl font-bold text-primary text-center">
            Percentage Calculator
          </h1>
           <Button variant="outline" size="icon" onClick={toggleTheme} aria-label="Toggle theme" className="rounded-full w-10 h-10 transition-transform duration-300 hover:scale-110 text-primary border-primary/50 hover:bg-primary/10">
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
        </header>

        <main className="w-full max-w-2xl">
          <Card className="shadow-2xl rounded-2xl border-primary/20 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-6">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-3 bg-secondary rounded-xl">
                    <TabsTrigger value="p1" className="rounded-lg">X% of Y</TabsTrigger>
                    <TabsTrigger value="p2" className="rounded-lg">X is what % of Y</TabsTrigger>
                    <TabsTrigger value="p3" className="rounded-lg">Balance</TabsTrigger>
                  </TabsList>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab}
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -10, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <TabsContent value="p1" className="mt-6">
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium text-center">What is <span className="text-primary">{p1Value1 || 'X'}%</span> of <span className="text-primary">{p1Value2 || 'Y'}</span>?</h3>
                            <div className="flex items-center gap-4">
                                <Input type="number" value={p1Value1} onChange={(e) => setP1Value1(e.target.value)} placeholder="15" className="bg-background/50 text-center"/>
                                <Label className="text-muted-foreground">% of</Label>
                                <Input type="number" value={p1Value2} onChange={(e) => setP1Value2(e.target.value)} placeholder="500" className="bg-background/50 text-center"/>
                            </div>
                            {renderResult(p1Result)}
                        </div>
                      </TabsContent>
                      <TabsContent value="p2" className="mt-6">
                         <div className="space-y-4">
                            <h3 className="text-lg font-medium text-center"><span className="text-primary">{p2Value1 || 'X'}</span> is what percent of <span className="text-primary">{p2Value2 || 'Y'}</span>?</h3>
                            <div className="flex items-center gap-4">
                                <Input type="number" value={p2Value1} onChange={(e) => setP2Value1(e.target.value)} placeholder="75" className="bg-background/50 text-center"/>
                                <Label className="text-muted-foreground">is what % of</Label>
                                <Input type="number" value={p2Value2} onChange={(e) => setP2Value2(e.target.value)} placeholder="500" className="bg-background/50 text-center"/>
                            </div>
                            {renderResult(p2Result, "%")}
                        </div>
                      </TabsContent>
                      <TabsContent value="p3" className="mt-6">
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium text-center">Balance Calculator</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="total-amount">Total Amount</Label>
                                    <Input id="total-amount" type="number" value={p3Total} onChange={(e) => setP3Total(e.target.value)} placeholder="1000" className="bg-background/50"/>
                                </div>
                                 <div className="space-y-2">
                                    <Label htmlFor="paid-amount">Paid Amount</Label>
                                    <Input id="paid-amount" type="number" value={p3Paid} onChange={(e) => setP3Paid(e.target.value)} placeholder="250" className="bg-background/50"/>
                                </div>
                            </div>
                            <div className="text-center pt-4">
                              <p className="text-muted-foreground">Balance Left</p>
                              <AnimatePresence mode="wait">
                                  <motion.p
                                      key={p3Result}
                                      initial={{ opacity: 0, y: -20 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      exit={{ opacity: 0, y: 20 }}
                                      transition={{ duration: 0.2 }}
                                      className="text-4xl font-bold text-primary"
                                  >
                                      {p3Result}
                                  </motion.p>
                              </AnimatePresence>
                            </div>
                        </div>
                      </TabsContent>
                    </motion.div>
                  </AnimatePresence>
                </Tabs>
            </CardContent>
          </Card>
        </main>
      </div>
    </motion.div>
  );
}
