'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { motion } from 'framer-motion';
import { 
  QrCode, Barcode, Download, Copy, Check, 
  Sparkles, Layers, ArrowRight, ShieldCheck, Printer
} from 'lucide-react';
import QRCode from 'qrcode';
import { notifyCompleted, notifyCopied, notifyDownloaded, notifyError } from '@/lib/notify';

// Code 128 Patterns (Table B)
const CODE128_PATTERNS = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213", // 0-9
  "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132", // 10-19
  "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211", // 20-29
  "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313", // 30-39
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331", // 40-49
  "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111", // 50-59
  "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214", // 60-69
  "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111", // 70-79
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141", // 80-89
  "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141", // 90-99
  "114131", "311141", "411131", "211412", "211214", "211232", "2331112" // 100-106 (106 is STOP)
];

// EAN-13 L and G encodings
const EAN_L = [
  "0001101", "0011001", "0010011", "0111101", "0100011",
  "0110001", "0101111", "0111011", "0110111", "0001011"
];
const EAN_G = [
  "0100111", "0110011", "0011011", "0100001", "0011101",
  "0111001", "0000101", "0010001", "0001001", "0010111"
];
const EAN_R = [
  "1110010", "1100110", "1101100", "1000010", "1011100",
  "1001110", "1010000", "1000100", "1001000", "1110100"
];
const EAN_FIRST_DIGIT_STRUCTURE = [
  "LLLLLL", "LLGLGG", "LLGGLG", "LLGGGL", "LGLLGG",
  "LGGLLG", "LGGGLL", "LGLGLG", "LGLGGL", "LGGLGL"
];

export default function VectorBarcode() {
  const [barcodeType, setBarcodeType] = useState<'code128' | 'ean13' | 'qr'>('code128');
  const [inputText, setInputText] = useState<string>('PRO-CORELDRAW-99');
  const [includeText, setIncludeText] = useState<boolean>(true);
  const [barHeight, setBarHeight] = useState<number>(80);
  const [moduleWidth, setModuleWidth] = useState<number>(2);
  const [qrSvg, setQrSvg] = useState<string>('');

  // Generate QR Code SVG asynchronously via QRCode library
  React.useEffect(() => {
    if (barcodeType === 'qr') {
      QRCode.toString(inputText || 'UniversalApps', {
        type: 'svg',
        margin: 2,
        width: 256,
        color: { dark: '#000000', light: '#ffffff' }
      }, (err, string) => {
        if (!err && string) setQrSvg(string);
      });
    }
  }, [barcodeType, inputText]);

  // Code 128 Vector SVG Generator
  const generateCode128Svg = (text: string) => {
    const cleanText = text.replace(/[^\x20-\x7E]/g, '');
    if (!cleanText) return '';

    // Start with Code 128 Set B (Value 104)
    const codeValues = [104];
    for (let i = 0; i < cleanText.length; i++) {
      codeValues.push(cleanText.charCodeAt(i) - 32);
    }

    // Calculate modulo 103 checksum
    let sum = codeValues[0];
    for (let i = 1; i < codeValues.length; i++) {
      sum += codeValues[i] * i;
    }
    const checksum = sum % 103;
    codeValues.push(checksum);
    codeValues.push(106); // Stop character

    // Build bar patterns
    let bitString = '';
    for (const val of codeValues) {
      const pattern = CODE128_PATTERNS[val];
      let isBar = true;
      for (const char of pattern) {
        const runLength = parseInt(char, 10);
        bitString += (isBar ? '1' : '0').repeat(runLength);
        isBar = !isBar;
      }
    }

    // Convert bitString into vector <rect> SVG
    const quietZone = 20;
    const totalModules = bitString.length;
    const svgWidth = totalModules * moduleWidth + quietZone * 2;
    const svgHeight = barHeight + (includeText ? 30 : 10);

    let rects = '';
    for (let i = 0; i < totalModules; i++) {
      if (bitString[i] === '1') {
        const x = quietZone + i * moduleWidth;
        rects += `<rect x="${x}" y="10" width="${moduleWidth}" height="${barHeight}" fill="#000000" />`;
      }
    }

    const textTag = includeText 
      ? `<text x="${svgWidth / 2}" y="${barHeight + 25}" font-family="monospace, monospace" font-size="12" font-weight="bold" text-anchor="middle" fill="#000000">${cleanText}</text>` 
      : '';

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}">
  <rect width="100%" height="100%" fill="#ffffff"/>
  ${rects}
  ${textTag}
</svg>`;
  };

  // EAN-13 Vector SVG Generator
  const generateEan13Svg = (digits: string) => {
    const raw = digits.replace(/\D/g, '').padEnd(12, '0').slice(0, 12);
    // Checksum digit calculation
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(raw[i], 10) * (i % 2 === 0 ? 1 : 3);
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    const full13 = raw + checkDigit.toString();

    const firstDigit = parseInt(full13[0], 10);
    const structure = EAN_FIRST_DIGIT_STRUCTURE[firstDigit];

    let bits = '101'; // Left guard
    // First 6 digits (using L or G)
    for (let i = 1; i <= 6; i++) {
      const d = parseInt(full13[i], 10);
      bits += structure[i - 1] === 'L' ? EAN_L[d] : EAN_G[d];
    }
    bits += '01010'; // Center guard
    // Last 6 digits (using R)
    for (let i = 7; i <= 12; i++) {
      const d = parseInt(full13[i], 10);
      bits += EAN_R[d];
    }
    bits += '101'; // Right guard

    const quietZone = 20;
    const totalModules = bits.length;
    const svgWidth = totalModules * moduleWidth + quietZone * 2;
    const svgHeight = barHeight + (includeText ? 30 : 10);

    let rects = '';
    for (let i = 0; i < totalModules; i++) {
      if (bits[i] === '1') {
        const x = quietZone + i * moduleWidth;
        rects += `<rect x="${x}" y="10" width="${moduleWidth}" height="${barHeight}" fill="#000000" />`;
      }
    }

    const textTag = includeText 
      ? `<text x="${svgWidth / 2}" y="${barHeight + 25}" font-family="monospace, monospace" font-size="12" font-weight="bold" text-anchor="middle" fill="#000000">${full13}</text>` 
      : '';

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}">
  <rect width="100%" height="100%" fill="#ffffff"/>
  ${rects}
  ${textTag}
</svg>`;
  };

  // Active Output SVG
  const activeSvg = useMemo(() => {
    if (barcodeType === 'qr') return qrSvg;
    if (barcodeType === 'ean13') return generateEan13Svg(inputText);
    return generateCode128Svg(inputText);
  }, [barcodeType, inputText, includeText, barHeight, moduleWidth, qrSvg]);

  const copySvg = () => {
    navigator.clipboard.writeText(activeSvg);
    notifyCopied('Vector Barcode SVG');
  };

  const downloadSvg = () => {
    const blob = new Blob([activeSvg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `barcode_${barcodeType}.svg`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    notifyDownloaded(`barcode_${barcodeType}.svg`);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 px-4">
      <Card className="border shadow-xl bg-card overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-slate-900 via-neutral-900 to-slate-900 text-white p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20">
                <Barcode className="w-8 h-8 text-white" />
              </div>
              <div>
                <CardTitle className="text-3xl font-black tracking-tight">
                  Clean Vector Barcode & QR Studio
                </CardTitle>
                <CardDescription className="text-white/75 font-semibold">
                  Generates 100% editable SVG vector curves ready to import directly into CorelDRAW & laser cutters
                </CardDescription>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={copySvg}
                className="bg-white/10 hover:bg-white/20 text-white border-white/20 font-bold"
              >
                <Copy className="w-4 h-4 mr-2" /> Copy SVG
              </Button>
              <Button
                onClick={downloadSvg}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                <Download className="w-4 h-4 mr-2" /> Download .svg
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-8">
          {/* Format Selector */}
          <div className="flex flex-wrap gap-3 pb-6 border-b">
            <Button
              variant={barcodeType === 'code128' ? 'default' : 'outline'}
              onClick={() => {
                setBarcodeType('code128');
                setInputText('PRO-CORELDRAW-99');
              }}
              className="font-bold gap-2 rounded-xl"
            >
              <Barcode className="w-4 h-4" /> Code 128 (Logistics & Serial)
            </Button>
            <Button
              variant={barcodeType === 'ean13' ? 'default' : 'outline'}
              onClick={() => {
                setBarcodeType('ean13');
                setInputText('890103038312');
              }}
              className="font-bold gap-2 rounded-xl"
            >
              <Barcode className="w-4 h-4" /> EAN-13 (Retail Standard)
            </Button>
            <Button
              variant={barcodeType === 'qr' ? 'default' : 'outline'}
              onClick={() => {
                setBarcodeType('qr');
                setInputText('https://universalapps.io');
              }}
              className="font-bold gap-2 rounded-xl"
            >
              <QrCode className="w-4 h-4" /> QR Code (Vector Matrix)
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-6">
            {/* Left Controls */}
            <div className="lg:col-span-5 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                  {barcodeType === 'ean13' ? '12 or 13 Digits' : 'Barcode Data Text'}
                </label>
                <Input
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={barcodeType === 'ean13' ? '890123456789' : 'Type code text...'}
                  className="font-mono text-sm font-bold h-11 rounded-xl"
                />
              </div>

              {barcodeType !== 'qr' && (
                <div className="space-y-4 border rounded-2xl p-5 bg-card/60">
                  <div className="text-xs font-black uppercase tracking-wider text-primary">
                    Vector Dimension Controls
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold">
                      <span>Bar Height</span>
                      <span className="font-mono">{barHeight}px</span>
                    </div>
                    <Slider value={[barHeight]} min={40} max={180} step={2} onValueChange={([v]) => setBarHeight(v)} />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold">
                      <span>Module Width (Bar Thickness)</span>
                      <span className="font-mono">{moduleWidth}px</span>
                    </div>
                    <Slider value={[moduleWidth]} min={1} max={5} step={0.5} onValueChange={([v]) => setModuleWidth(v)} />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-xs font-bold">Include Human-Readable Text</span>
                    <Switch checked={includeText} onCheckedChange={setIncludeText} />
                  </div>
                </div>
              )}

              <div className="p-4 rounded-xl bg-muted/30 border space-y-2">
                <div className="text-xs font-black uppercase text-foreground flex items-center gap-1.5">
                  <Printer className="w-4 h-4 text-primary" /> CorelDRAW & Laser Cutter Ready
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Unlike CorelDRAW&apos;s OLE Barcode Wizard, this produces pure standard SVG vector paths. You can ungroup, recolor, scale to any billboard size, or send directly to vinyl plotters and laser cutters.
                </p>
              </div>
            </div>

            {/* Right Side: Live Vector Preview */}
            <div className="lg:col-span-7 space-y-4">
              <div className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                Live Vector SVG Preview
              </div>
              <div className="w-full min-h-[260px] border-2 rounded-2xl bg-white p-8 flex items-center justify-center overflow-auto shadow-sm">
                <div
                  className="max-w-full overflow-auto flex items-center justify-center"
                  dangerouslySetInnerHTML={{ __html: activeSvg }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
