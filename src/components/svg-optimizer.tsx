'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileCode, Upload, Download, Copy, Check, 
  Sparkles, Layers, Sliders, ShieldCheck, ArrowRightLeft, Eye
} from 'lucide-react';
import { notifyCompleted, notifyCopied, notifyDownloaded, notifyError } from '@/lib/notify';

// Sample CorelDRAW exported SVG with classic Corel bloat
const SAMPLE_CORELDRAW_SVG = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<!-- Creator: CorelDRAW 2021 -->
<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" version="1.1" 
     style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"
     viewBox="0 0 2000 2000"
     xmlns:odm="http://product.corel.com/ooxml/1.0"
     xmlns:xlink="http://www.w3.org/1999/xlink">
 <defs>
  <style type="text/css">
   <![CDATA[
    .fil0 {fill:#2563EB}
    .fil1 {fill:#38BDF8}
    .fil2 {fill:#FFFFFF}
    .str0 {stroke:#1E40AF;stroke-width:20;stroke-miterlimit:22.9256}
   ]]>
  </style>
 </defs>
 <g id="Layer_x0020_1">
  <metadata id="CorelCorpID_0Corel-Layer"/>
  <g id="_142981928374">
   <circle class="fil0 str0" cx="1000.000000" cy="1000.000000" r="850.491827"/>
   <g id="_x0000_s1026">
    <path class="fil1" d="M 650.128491 1350.928174 C 750.491827,1100.384729 1250.847192,1100.384729 1350.294817,1350.928174 L 1000.000000,550.281947 Z"/>
    <circle class="fil2" cx="1000.000000" cy="950.481920" r="150.192847"/>
   </g>
  </g>
 </g>
</svg>`;

export default function SvgOptimizer() {
  const [inputSvg, setInputSvg] = useState<string>(SAMPLE_CORELDRAW_SVG);
  const [profile, setProfile] = useState<'corel-clean' | 'web-max' | 'corel-import'>('corel-clean');
  const [precision, setPrecision] = useState<number>(2);
  const [stripMetadata, setStripMetadata] = useState<boolean>(true);
  const [collapseGroups, setCollapseGroups] = useState<boolean>(true);
  const [roundCoordinates, setRoundCoordinates] = useState<boolean>(true);
  const [cleanCorelNamespaces, setCleanCorelNamespaces] = useState<boolean>(true);
  const [viewTab, setViewTab] = useState<'visual' | 'code'>('visual');

  // File upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content.includes('<svg')) {
        setInputSvg(content);
        notifyCompleted('SVG Loaded', `${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
      } else {
        notifyError('Selected file does not appear to be a valid SVG.');
      }
    };
    reader.readAsText(file);
  };

  // SVG Optimization Engine
  const optimizedSvg = useMemo(() => {
    if (!inputSvg || !inputSvg.includes('<svg')) return '';

    let svg = inputSvg;

    // 1. Remove XML declaration and DOCTYPE
    svg = svg.replace(/<\?xml[\s\S]*?\?>/gi, '');
    svg = svg.replace(/<!DOCTYPE[\s\S]*?>/gi, '');

    // 2. Remove comments
    svg = svg.replace(/<!--[\s\S]*?-->/g, '');

    // 3. Remove metadata and CorelCorp tags
    if (stripMetadata) {
      svg = svg.replace(/<metadata[\s\S]*?<\/metadata>/gi, '');
      svg = svg.replace(/<defs>\s*<\/defs>/gi, '');
    }

    // 4. CorelDRAW Export Specific Cleaning
    if (profile === 'corel-clean' || cleanCorelNamespaces) {
      // Remove Corel namespaces and xml:space
      svg = svg.replace(/\s*xmlns:odm="[^"]*"/gi, '');
      svg = svg.replace(/\s*xml:space="preserve"/gi, '');
      svg = svg.replace(/\s*xmlns:sketch="[^"]*"/gi, '');
      svg = svg.replace(/\s*xmlns:inkscape="[^"]*"/gi, '');
      svg = svg.replace(/\s*xmlns:sodipodi="[^"]*"/gi, '');

      // Clean Corel escaped hex ID strings: e.g. Layer_x0020_1 -> layer-1, _x0000_s1026 -> shape-1026
      svg = svg.replace(/id="Layer_x0020_(\d+)"/gi, 'id="layer-$1"');
      svg = svg.replace(/id="_x0000_s(\d+)"/gi, 'id="shape-$1"');
      svg = svg.replace(/id="_(\d{6,})"/gi, 'id="obj-$1"');

      // Strip redundant Corel root inline style rendering flags
      svg = svg.replace(
        /style="shape-rendering:[^"]*fill-rule:evenodd; clip-rule:evenodd"/gi,
        ''
      );
    }

    // 5. CorelDRAW Import Preparation Profile
    if (profile === 'corel-import') {
      // Ensure stroke-miterlimit is safe, ensure standard viewBox exists
      svg = svg.replace(/stroke-miterlimit="[\d.]+"/gi, 'stroke-miterlimit="10"');
      // Ensure fill rules are explicit
      if (!svg.includes('fill-rule=')) {
        svg = svg.replace('<svg ', '<svg fill-rule="evenodd" ');
      }
    }

    // 6. Collapse redundant nested single-child <g> groups
    if (collapseGroups) {
      svg = svg.replace(/<g id="[^"]*">\s*<g id="[^"]*">/gi, '<g>');
      svg = svg.replace(/<\/g>\s*<\/g>/gi, '</g>');
      svg = svg.replace(/<g>\s*<\/g>/gi, '');
    }

    // 7. Coordinate & Decimal Precision Rounding
    if (roundCoordinates) {
      const precisionFactor = Math.pow(10, precision);
      // Matches floating point numbers in attributes and path commands
      svg = svg.replace(/(\d+\.\d{3,})/g, (match) => {
        const num = parseFloat(match);
        return (Math.round(num * precisionFactor) / precisionFactor).toString();
      });
    }

    // 8. Whitespace compression
    svg = svg.replace(/\s{2,}/g, ' ');
    svg = svg.replace(/>\s+</g, '><');
    svg = svg.trim();

    return svg;
  }, [inputSvg, profile, precision, stripMetadata, collapseGroups, roundCoordinates, cleanCorelNamespaces]);

  // Byte calculations
  const originalBytes = useMemo(() => new Blob([inputSvg]).size, [inputSvg]);
  const optimizedBytes = useMemo(() => new Blob([optimizedSvg]).size, [optimizedSvg]);
  const percentSaved = useMemo(() => {
    if (originalBytes === 0) return 0;
    const diff = originalBytes - optimizedBytes;
    return Math.max(0, Math.round((diff / originalBytes) * 1000) / 10);
  }, [originalBytes, optimizedBytes]);

  const copyOptimized = () => {
    navigator.clipboard.writeText(optimizedSvg);
    notifyCopied('Optimized SVG markup');
  };

  const downloadOptimized = () => {
    const blob = new Blob([optimizedSvg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `optimized_${profile}.svg`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    notifyDownloaded(`optimized_${profile}.svg`);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 px-4">
      {/* Header */}
      <Card className="border shadow-xl bg-card overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-purple-800 via-indigo-800 to-blue-900 text-white p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20">
                <FileCode className="w-8 h-8 text-white" />
              </div>
              <div>
                <CardTitle className="text-3xl font-black tracking-tight">
                  SVG Optimizer & CorelDRAW Profiler
                </CardTitle>
                <CardDescription className="text-white/75 font-semibold">
                  Clean bloated Figma, Illustrator & CorelDRAW SVGs with live before/after visual diff
                </CardDescription>
              </div>
            </div>

            {/* Savings Badge */}
            <div className="flex items-center gap-4 bg-white/10 px-5 py-3 rounded-2xl border border-white/20 backdrop-blur-md">
              <div className="text-right">
                <div className="text-[10px] font-black uppercase tracking-wider text-white/70">Total Savings</div>
                <div className="text-2xl font-black text-emerald-400">-{percentSaved}%</div>
              </div>
              <div className="border-l border-white/20 pl-4 text-xs font-mono space-y-0.5">
                <div>{(originalBytes / 1024).toFixed(1)} KB &rarr;</div>
                <div className="text-emerald-300 font-bold">{(optimizedBytes / 1024).toFixed(1)} KB</div>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-8">
          {/* Profile Selector Tabs */}
          <div className="flex flex-wrap gap-3 pb-6 border-b">
            <Button
              variant={profile === 'corel-clean' ? 'default' : 'outline'}
              onClick={() => setProfile('corel-clean')}
              className="font-bold gap-2 rounded-xl"
            >
              <Sparkles className="w-4 h-4" /> CorelDRAW Export Cleaner
            </Button>
            <Button
              variant={profile === 'web-max' ? 'default' : 'outline'}
              onClick={() => setProfile('web-max')}
              className="font-bold gap-2 rounded-xl"
            >
              <Sliders className="w-4 h-4" /> Standard Web Maximum
            </Button>
            <Button
              variant={profile === 'corel-import' ? 'default' : 'outline'}
              onClick={() => setProfile('corel-import')}
              className="font-bold gap-2 rounded-xl"
            >
              <ArrowRightLeft className="w-4 h-4" /> CorelDRAW Import Safe
            </Button>
            <Button
              variant="secondary"
              onClick={() => setInputSvg(SAMPLE_CORELDRAW_SVG)}
              className="ml-auto text-xs font-bold"
            >
              Load Sample Corel SVG
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-6">
            {/* Left Controls & Code Input */}
            <div className="lg:col-span-5 space-y-6">
              {/* File Upload / Paste */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs font-black uppercase tracking-wider text-muted-foreground">
                  <span>Input SVG Source</span>
                  <label className="cursor-pointer text-primary hover:underline font-bold flex items-center gap-1">
                    <Upload className="w-3.5 h-3.5" /> Upload .svg
                    <input type="file" accept=".svg" className="hidden" onChange={handleFileUpload} />
                  </label>
                </div>
                <Textarea
                  value={inputSvg}
                  onChange={(e) => setInputSvg(e.target.value)}
                  rows={8}
                  className="font-mono text-[11px] leading-relaxed resize-none rounded-xl"
                  placeholder="Paste raw SVG code here..."
                />
              </div>

              {/* Optimization Sliders & Toggles */}
              <div className="space-y-4 border rounded-2xl p-5 bg-card/60">
                <div className="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-2">
                  <Sliders className="w-4 h-4" /> Precision & Stripping Rules
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span>Decimal Precision Rounding</span>
                    <span className="font-mono">{precision} decimals</span>
                  </div>
                  <Slider
                    value={[precision]}
                    min={0}
                    max={4}
                    step={1}
                    onValueChange={([v]) => setPrecision(v)}
                    disabled={!roundCoordinates}
                  />
                  <span className="text-[10px] text-muted-foreground block">
                    Reduces 9-digit float coordinate bloat (e.g. 142.349182 &rarr; 142.35).
                  </span>
                </div>

                <div className="space-y-3 pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">Purge Corel Namespaces & ODM</span>
                    <Switch checked={cleanCorelNamespaces} onCheckedChange={setCleanCorelNamespaces} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">Remove Metadata & Comments</span>
                    <Switch checked={stripMetadata} onCheckedChange={setStripMetadata} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">Collapse Redundant Nested &lt;g&gt;</span>
                    <Switch checked={collapseGroups} onCheckedChange={setCollapseGroups} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">Round Path Coordinates</span>
                    <Switch checked={roundCoordinates} onCheckedChange={setRoundCoordinates} />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side: Before / After Visual and Code Diff */}
            <div className="lg:col-span-7 space-y-6">
              {/* Tab Switcher: Visual vs Code */}
              <div className="flex justify-between items-center border-b pb-3">
                <div className="flex gap-2">
                  <Button
                    variant={viewTab === 'visual' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewTab('visual')}
                    className="text-xs font-bold gap-1.5 h-8"
                  >
                    <Eye className="w-3.5 h-3.5" /> Live Visual Comparison
                  </Button>
                  <Button
                    variant={viewTab === 'code' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewTab('code')}
                    className="text-xs font-bold gap-1.5 h-8"
                  >
                    <FileCode className="w-3.5 h-3.5" /> Optimized Code Output
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={copyOptimized}
                    className="text-xs font-bold gap-1.5 h-8"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copy
                  </Button>
                  <Button
                    size="sm"
                    onClick={downloadOptimized}
                    className="text-xs font-bold gap-1.5 h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Download className="w-3.5 h-3.5" /> Download .svg
                  </Button>
                </div>
              </div>

              {viewTab === 'visual' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Original Render */}
                  <div className="border rounded-2xl p-4 bg-muted/20 space-y-3 text-center">
                    <div className="flex justify-between items-center text-xs font-bold text-muted-foreground">
                      <span>Original</span>
                      <span className="font-mono">{(originalBytes / 1024).toFixed(1)} KB</span>
                    </div>
                    <div
                      className="w-full h-64 border rounded-xl bg-white/80 dark:bg-slate-900 flex items-center justify-center p-4 overflow-hidden [&>svg]:max-w-full [&>svg]:max-h-full"
                      dangerouslySetInnerHTML={{ __html: inputSvg }}
                    />
                  </div>

                  {/* Optimized Render */}
                  <div className="border rounded-2xl p-4 bg-emerald-500/5 border-emerald-500/20 space-y-3 text-center">
                    <div className="flex justify-between items-center text-xs font-bold text-emerald-600">
                      <span>Optimized ({profile})</span>
                      <span className="font-mono">{(optimizedBytes / 1024).toFixed(1)} KB</span>
                    </div>
                    <div
                      className="w-full h-64 border rounded-xl bg-white/80 dark:bg-slate-900 flex items-center justify-center p-4 overflow-hidden [&>svg]:max-w-full [&>svg]:max-h-full"
                      dangerouslySetInnerHTML={{ __html: optimizedSvg }}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <pre className="p-4 rounded-xl bg-slate-950 text-slate-50 font-mono text-[11px] leading-relaxed max-h-96 overflow-auto border border-slate-800">
                    {optimizedSvg}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
