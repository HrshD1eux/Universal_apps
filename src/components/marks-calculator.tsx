"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Plus, Trash2, Sun, Moon } from "lucide-react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";

type Subject = {
  id: number;
  name: string;
  marks: string;
  maxMarks: string;
};

type Theme = "light" | "dark";

export default function MarksCalculator() {
  const [isMounted, setIsMounted] = useState(false);
  const [theme, setTheme] = useState<Theme>("dark");

  const [subjects, setSubjects] = useState<Subject[]>([
    { id: 1, name: "Subject 1", marks: "", maxMarks: "100" },
    { id: 2, name: "Subject 2", marks: "", maxMarks: "100" },
    { id: 3, name: "Subject 3", marks: "", maxMarks: "100" },
    { id: 4, name: "Subject 4", marks: "", maxMarks: "100" },
  ]);

  const [totalMarksObtained, setTotalMarksObtained] = useState("");
  const [totalMaxMarks, setTotalMaxMarks] = useState("");

  const [activeTab, setActiveTab] = useState("subjects");

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

  const subjectCalculation = useMemo(() => {
    let currentTotalMarks = 0;
    let currentTotalMaxMarks = 0;

    subjects.forEach(subject => {
      const marks = parseFloat(subject.marks);
      const maxMarks = parseFloat(subject.maxMarks);

      if (!isNaN(marks) && !isNaN(maxMarks) && marks <= maxMarks) {
        currentTotalMarks += marks;
        currentTotalMaxMarks += maxMarks;
      }
    });

    const percentage = currentTotalMaxMarks > 0 ? (currentTotalMarks / currentTotalMaxMarks) * 100 : 0;
    return { totalMarks: currentTotalMarks, totalMaxMarks: currentTotalMaxMarks, percentage };
  }, [subjects]);

  const totalMarksCalculation = useMemo(() => {
    const obtained = parseFloat(totalMarksObtained);
    const max = parseFloat(totalMaxMarks);
    if (!isNaN(obtained) && !isNaN(max) && max > 0 && obtained <= max) {
      const percentage = (obtained / max) * 100;
      return { totalMarks: obtained, totalMaxMarks: max, percentage };
    }
    return { totalMarks: 0, totalMaxMarks: 0, percentage: 0 };
  }, [totalMarksObtained, totalMaxMarks]);

  const { totalMarks, totalMaxMarks: finalTotalMaxMarks, percentage } = activeTab === 'subjects' ? subjectCalculation : totalMarksCalculation;

  const handleSubjectChange = (id: number, field: keyof Subject, value: string) => {
    setSubjects(subjects.map(sub => (sub.id === id ? { ...sub, [field]: value } : sub)));
  };

  const addSubject = () => {
    setSubjects([...subjects, { id: Date.now(), name: `Subject ${subjects.length + 1}`, marks: "", maxMarks: "100" }]);
  };

  const removeSubject = (id: number) => {
    setSubjects(subjects.filter(sub => sub.id !== id));
  };
  
  if (!isMounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getGrade = (p: number) => {
    if (p >= 90) return 'A+';
    if (p >= 80) return 'A';
    if (p >= 70) return 'B';
    if (p >= 60) return 'C';
    if (p >= 50) return 'D';
    return 'F';
  }

  return (
    <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="min-h-screen bg-background text-foreground font-sans">
      <div className="container mx-auto p-4 sm:p-8 flex flex-col items-center">
        <header className="w-full max-w-3xl flex justify-between items-center mb-8">
            <Link href="/" passHref>
               <Button variant="outline" size="icon" className="rounded-full w-10 h-10 transition-transform duration-300 hover:scale-110 border-primary/50 hover:bg-primary/10">
                    <ArrowLeft className="h-5 w-5 text-primary" />
                </Button>
            </Link>
          <h1 className="text-3xl sm:text-4xl font-bold text-primary text-center">
            Marks Calculator
          </h1>
           <Button variant="outline" size="icon" onClick={toggleTheme} aria-label="Toggle theme" className="rounded-full w-10 h-10 transition-transform duration-300 hover:scale-110 text-primary border-primary/50 hover:bg-primary/10">
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
        </header>

        <main className="w-full max-w-3xl space-y-8">
          <Card className="shadow-2xl rounded-2xl border-primary/20 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-secondary rounded-xl">
                  <TabsTrigger value="subjects" className="rounded-lg">By Subject</TabsTrigger>
                  <TabsTrigger value="total" className="rounded-lg">By Total</TabsTrigger>
                </TabsList>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -10, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <TabsContent value="subjects" className="mt-6">
                        <CardHeader className="p-0 mb-4">
                            <CardTitle>Enter Subject Details</CardTitle>
                            <CardDescription>Add subjects and enter the marks for each.</CardDescription>
                        </CardHeader>
                        <Table>
                            <TableHeader>
                            <TableRow className="hover:bg-transparent border-b-primary/20">
                                <TableHead>Subject Name</TableHead>
                                <TableHead>Marks Obtained</TableHead>
                                <TableHead>Max Marks</TableHead>
                                <TableHead></TableHead>
                            </TableRow>
                            </TableHeader>
                            <TableBody>
                            <AnimatePresence>
                            {subjects.map((subject) => (
                                <motion.tr 
                                  layout
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0, x: -50 }}
                                  key={subject.id}
                                  className="border-b-primary/10"
                                >
                                <TableCell>
                                    <Input
                                    value={subject.name}
                                    onChange={e => handleSubjectChange(subject.id, 'name', e.target.value)}
                                    className="bg-background/50"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Input
                                    type="number"
                                    value={subject.marks}
                                    onChange={e => handleSubjectChange(subject.id, 'marks', e.target.value)}
                                    placeholder="e.g. 85"
                                    className="bg-background/50"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Input
                                    type="number"
                                    value={subject.maxMarks}
                                    onChange={e => handleSubjectChange(subject.id, 'maxMarks', e.target.value)}
                                    placeholder="e.g. 100"
                                    className="bg-background/50"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Button variant="ghost" size="icon" onClick={() => removeSubject(subject.id)} disabled={subjects.length <= 1}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </TableCell>
                                </motion.tr>
                            ))}
                            </AnimatePresence>
                            </TableBody>
                        </Table>
                        <Button onClick={addSubject} className="mt-4 w-full" variant="outline">
                            <Plus className="mr-2 h-4 w-4" /> Add Subject
                        </Button>
                    </TabsContent>
                    <TabsContent value="total" className="mt-6">
                        <CardHeader className="p-0 mb-4">
                            <CardTitle>Enter Total Marks</CardTitle>
                            <CardDescription>Directly input the total marks obtained and the maximum possible marks.</CardDescription>
                        </CardHeader>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="total-obtained">Total Marks Obtained</Label>
                                <Input id="total-obtained" type="number" placeholder="e.g. 450" value={totalMarksObtained} onChange={e => setTotalMarksObtained(e.target.value)} className="bg-background/50"/>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="total-max">Total Maximum Marks</Label>
                                <Input id="total-max" type="number" placeholder="e.g. 500" value={totalMaxMarks} onChange={e => setTotalMaxMarks(e.target.value)} className="bg-background/50"/>
                            </div>
                        </div>
                    </TabsContent>
                  </motion.div>
                </AnimatePresence>
              </Tabs>
            </CardContent>
          </Card>

          <Card className="shadow-lg rounded-2xl border-primary/20 bg-card/50">
            <CardHeader>
              <CardTitle>Results</CardTitle>
              <CardDescription>Here is the summary of your marks.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-secondary rounded-xl">
                    <p className="text-sm text-muted-foreground">Total Marks</p>
                    <p className="text-2xl font-semibold text-secondary-foreground">{totalMarks.toFixed(2)} / {finalTotalMaxMarks.toFixed(2)}</p>
                </div>
                <div className="p-4 bg-secondary rounded-xl">
                    <p className="text-sm text-muted-foreground">Percentage</p>
                    <p className="text-2xl font-semibold text-secondary-foreground">{percentage.toFixed(2)}%</p>
                </div>
                <div className="p-4 bg-primary/20 dark:bg-primary dark:text-primary-foreground rounded-xl">
                    <p className="text-sm font-medium text-primary dark:text-primary-foreground">Grade</p>
                    <p className="text-2xl font-bold text-primary dark:text-primary-foreground">
                      {getGrade(percentage)}
                    </p>
                </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </motion.div>
  );
}
