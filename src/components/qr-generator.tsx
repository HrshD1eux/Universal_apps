"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import QRCode from "qrcode";
import { jsPDF } from "jspdf";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Sun, Moon, UploadCloud, Download } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

type Theme = "light" | "dark";

export default function QrGenerator() {
  const [isMounted, setIsMounted] = useState(false);
  const [theme, setTheme] = useState<Theme>("dark");
  const [text, setText] = useState("https://github.com/HrshD1eux");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateQrCode = useCallback(async () => {
    if (!text.trim()) {
      setQrCodeDataUrl("");
      return;
    }
    try {
      // Using toDataURL for both PNG and for embedding in SVG/PDF
      const dataUrl = await QRCode.toDataURL(text, { type: 'png', width: 512, margin: 2 });
      setQrCodeDataUrl(dataUrl);
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Error generating QR Code",
        description: "The input text might be too long.",
      });
    }
  }, [text, toast]);

  useEffect(() => {
    generateQrCode();
  }, [generateQrCode]);

  useEffect(() => {
    setIsMounted(true);
    const storedTheme = localStorage.getItem("tax-theme") as Theme | null;
    setTheme(storedTheme || 'dark');
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

  const handleFileDrop = useCallback((files: FileList) => {
    const file = files[0];
    if (file && file.type === "text/plain") {
      const reader = new FileReader();
      reader.onload = (e) => {
        const fileText = e.target?.result as string;
        setText(fileText);
      };
      reader.readAsText(file);
    } else {
      toast({
        variant: "destructive",
        title: "Invalid File",
        description: "Please drop a .txt file.",
      });
    }
  }, [toast]);

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileDrop(e.dataTransfer.files);
      e.dataTransfer.clearData();
    }
  };

  const downloadQrCode = async (format: 'png' | 'svg' | 'pdf') => {
    if (!qrCodeDataUrl) return;

    if (format === 'svg') {
        const svgString = await QRCode.toString(text, { type: 'svg' });
        const blob = new Blob([svgString], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'qrcode.svg';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } else if (format === 'png') {
        const pngUrl = await QRCode.toDataURL(text, { type: 'png', width: 512, margin: 2 });
        const a = document.createElement('a');
        a.href = pngUrl;
        a.download = 'qrcode.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    } else if (format === 'pdf') {
        const doc = new jsPDF();
        const pngUrl = await QRCode.toDataURL(text, { type: 'png', width: 1024, margin: 2 });
        const pdfWidth = doc.internal.pageSize.getWidth();
        const pdfHeight = doc.internal.pageSize.getHeight();
        const qrSize = pdfWidth * 0.6; // QR code will take 60% of the PDF width
        const x = (pdfWidth - qrSize) / 2;
        const y = (pdfHeight - qrSize) / 2;
        doc.addImage(pngUrl, 'PNG', x, y, qrSize, qrSize);
        doc.save('qrcode.pdf');
    }
  };

  if (!isMounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="min-h-screen bg-background text-foreground font-sans">
      <div className="container mx-auto p-4 sm:p-8 flex flex-col items-center">
        <header className="w-full max-w-4xl flex justify-between items-center mb-8">
            <Link href="/" passHref>
               <Button variant="outline" size="icon" className="rounded-full w-10 h-10 transition-transform duration-300 hover:scale-110 border-primary/50 hover:bg-primary/10">
                    <ArrowLeft className="h-5 w-5 text-primary" />
                </Button>
            </Link>
          <h1 className="text-3xl sm:text-4xl font-bold text-primary text-center">
            QR Code Generator
          </h1>
           <Button variant="outline" size="icon" onClick={toggleTheme} aria-label="Toggle theme" className="rounded-full w-10 h-10 transition-transform duration-300 hover:scale-110 text-primary border-primary/50 hover:bg-primary/10">
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
        </header>

        <main className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="shadow-2xl rounded-2xl border-primary/20 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Enter Your Data</CardTitle>
              <CardDescription>Type, paste, or drop a .txt file to generate a QR code.</CardDescription>
            </CardHeader>
            <CardContent onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="qr-text">Text or URL</Label>
                <Textarea
                  id="qr-text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Enter text or URL"
                  className="bg-background/50 min-h-[120px]"
                  rows={5}
                />
              </div>
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors duration-300 ${
                  isDragging ? 'border-primary bg-primary/10' : 'border-muted-foreground/30 hover:border-primary/50 hover:bg-primary/5'
                }`}
              >
                <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-sm text-muted-foreground">
                  {isDragging ? 'Drop the file here...' : 'Drag & drop a .txt file or click to select'}
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt"
                  className="hidden"
                  onChange={(e) => e.target.files && handleFileDrop(e.target.files)}
                />
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-2xl rounded-2xl border-primary/20 bg-card/50 backdrop-blur-sm flex flex-col justify-between">
            <CardHeader>
              <CardTitle>Your QR Code</CardTitle>
              <CardDescription>Download your generated QR code.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex items-center justify-center p-6">
              {qrCodeDataUrl ? (
                <motion.img
                  key={qrCodeDataUrl}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  src={qrCodeDataUrl}
                  alt="Generated QR Code"
                  className="w-full max-w-[250px] h-auto rounded-lg bg-white p-4 shadow-md"
                />
              ) : (
                <div className="w-full max-w-[250px] aspect-square rounded-lg bg-secondary flex items-center justify-center">
                    <p className="text-muted-foreground">Enter text to generate</p>
                </div>
              )}
            </CardContent>
            <CardFooter className="grid grid-cols-3 gap-4">
              <Button onClick={() => downloadQrCode('png')} disabled={!qrCodeDataUrl} className="font-bold">
                <Download className="mr-2 h-4 w-4" /> PNG
              </Button>
              <Button onClick={() => downloadQrCode('svg')} disabled={!qrCodeDataUrl} variant="outline" className="font-bold">
                <Download className="mr-2 h-4 w-4" /> SVG
              </Button>
              <Button onClick={() => downloadQrCode('pdf')} disabled={!qrCodeDataUrl} variant="outline" className="font-bold">
                <Download className="mr-2 h-4 w-4" /> PDF
              </Button>
            </CardFooter>
          </Card>
        </main>
      </div>
    </motion.div>
  );
}
