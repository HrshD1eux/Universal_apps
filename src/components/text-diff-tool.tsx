'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  GitCompare, ArrowLeftRight, Copy, Trash2, 
  Check, FileCode, SlidersHorizontal, Sparkles
} from 'lucide-react';
import { notifyCompleted, notifyCopied } from '@/lib/notify';

interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  text: string;
  leftNum?: number;
  rightNum?: number;
}

// LCS-based line comparison
function computeLineDiff(originalText: string, modifiedText: string): DiffLine[] {
  const origLines = originalText.split('\n');
  const modLines = modifiedText.split('\n');
  const n = origLines.length;
  const m = modLines.length;

  // dp table
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      if (origLines[i] === modLines[j]) {
        dp[i + 1][j + 1] = dp[i][j] + 1;
      } else {
        dp[i + 1][j + 1] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  // backtrack
  let i = n;
  let j = m;
  const result: DiffLine[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && origLines[i - 1] === modLines[j - 1]) {
      result.unshift({
        type: 'unchanged',
        text: origLines[i - 1],
        leftNum: i,
        rightNum: j,
      });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({
        type: 'added',
        text: modLines[j - 1],
        rightNum: j,
      });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      result.unshift({
        type: 'removed',
        text: origLines[i - 1],
        leftNum: i,
      });
      i--;
    }
  }

  return result;
}

export default function TextDiffTool() {
  const sampleOriginal = `function calculateTotal(items) {
  let sum = 0;
  for (let i = 0; i < items.length; i++) {
    sum += items[i].price;
  }
  return sum;
}`;

  const sampleModified = `function calculateTotal(items) {
  // Use modern reduce for readability
  return items.reduce((acc, item) => {
    return acc + (item.price || 0);
  }, 0);
}`;

  const [original, setOriginal] = useState(sampleOriginal);
  const [modified, setModified] = useState(sampleModified);
  const [viewMode, setViewMode] = useState<'unified' | 'split'>('unified');
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);

  const diffResult = useMemo(() => {
    const orig = ignoreWhitespace ? original.replace(/[ \t]+$/gm, '') : original;
    const mod = ignoreWhitespace ? modified.replace(/[ \t]+$/gm, '') : modified;
    return computeLineDiff(orig, mod);
  }, [original, modified, ignoreWhitespace]);

  const stats = useMemo(() => {
    let added = 0;
    let removed = 0;
    let unchanged = 0;
    diffResult.forEach((d) => {
      if (d.type === 'added') added++;
      else if (d.type === 'removed') removed++;
      else unchanged++;
    });
    return { added, removed, unchanged };
  }, [diffResult]);

  const handleSwap = () => {
    const temp = original;
    setOriginal(modified);
    setModified(temp);
    notifyCompleted('Swapped Inputs', 'Switched original and modified text.');
  };

  const handleClear = () => {
    setOriginal('');
    setModified('');
    notifyCompleted('Cleared Inputs', 'Both text inputs are now empty.');
  };

  const copyDiffOutput = () => {
    const textOutput = diffResult
      .map((d) => {
        const prefix = d.type === 'added' ? '+ ' : d.type === 'removed' ? '- ' : '  ';
        return `${prefix}${d.text}`;
      })
      .join('\n');
    navigator.clipboard.writeText(textOutput);
    notifyCopied('Diff text report');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      <Card className="border-none shadow-2xl bg-card/80 backdrop-blur-xl">
        <CardHeader className="p-8 border-b">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600">
                <GitCompare className="w-7 h-7" />
              </div>
              <div>
                <CardTitle className="text-3xl font-black">Offline Text & Code Diff</CardTitle>
                <CardDescription className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                  Compare two code snippets, config files, or notes side-by-side offline
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSwap}
                className="rounded-xl font-bold text-xs gap-1.5"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span>Swap</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={copyDiffOutput}
                className="rounded-xl font-bold text-xs gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Diff</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="rounded-xl font-bold text-xs text-rose-500 hover:bg-rose-500/10"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-8 space-y-6">
          {/* Inputs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                  Original (Left / Before)
                </Label>
                <span className="text-[11px] font-mono text-muted-foreground font-semibold">
                  {original.split('\n').length} lines
                </span>
              </div>
              <Textarea
                value={original}
                onChange={(e) => setOriginal(e.target.value)}
                placeholder="Paste original text or code here..."
                rows={10}
                className="font-mono text-xs leading-relaxed resize-y rounded-2xl border-2 p-4 bg-muted/20"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                  Modified (Right / After)
                </Label>
                <span className="text-[11px] font-mono text-muted-foreground font-semibold">
                  {modified.split('\n').length} lines
                </span>
              </div>
              <Textarea
                value={modified}
                onChange={(e) => setModified(e.target.value)}
                placeholder="Paste updated text or code here..."
                rows={10}
                className="font-mono text-xs leading-relaxed resize-y rounded-2xl border-2 p-4 bg-muted/20"
              />
            </div>
          </div>

          {/* Controls Bar & Diff Stats */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-muted/30 border">
            <div className="flex items-center gap-3">
              <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                Diff Stats:
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                +{stats.added} Added
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/20">
                -{stats.removed} Removed
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-500/15 text-slate-700 dark:text-slate-400 border border-slate-500/20">
                {stats.unchanged} Unchanged
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIgnoreWhitespace(!ignoreWhitespace)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                  ignoreWhitespace ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-muted'
                }`}
              >
                Ignore Whitespace
              </button>

              <div className="flex bg-background border rounded-xl p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode('unified')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    viewMode === 'unified' ? 'bg-muted text-foreground shadow-sm' : 'text-muted-foreground'
                  }`}
                >
                  Unified
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('split')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    viewMode === 'split' ? 'bg-muted text-foreground shadow-sm' : 'text-muted-foreground'
                  }`}
                >
                  Split View
                </button>
              </div>
            </div>
          </div>

          {/* Diff Result Rendering */}
          <div className="rounded-2xl border bg-background overflow-hidden font-mono text-xs shadow-inner max-h-[500px] overflow-y-auto">
            {diffResult.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground">
                Paste or type text above to compute diff.
              </div>
            ) : viewMode === 'unified' ? (
              <div className="divide-y divide-muted/40">
                {diffResult.map((line, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start px-4 py-1 leading-relaxed ${
                      line.type === 'added'
                        ? 'bg-emerald-500/15 text-emerald-900 dark:text-emerald-200'
                        : line.type === 'removed'
                        ? 'bg-rose-500/15 text-rose-900 dark:text-rose-200'
                        : 'text-foreground'
                    }`}
                  >
                    <span className="w-10 text-[10px] text-muted-foreground/60 select-none flex-shrink-0 text-right pr-3">
                      {line.leftNum || ''}
                    </span>
                    <span className="w-10 text-[10px] text-muted-foreground/60 select-none flex-shrink-0 text-right pr-3">
                      {line.rightNum || ''}
                    </span>
                    <span className="w-5 font-bold select-none flex-shrink-0 text-center">
                      {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
                    </span>
                    <span className="whitespace-pre-wrap break-all flex-1">{line.text || ' '}</span>
                  </div>
                ))}
              </div>
            ) : (
              /* Split View */
              <div className="grid grid-cols-2 divide-x divide-muted">
                {/* Left Side */}
                <div className="divide-y divide-muted/40">
                  {diffResult.map((line, idx) => (
                    <div
                      key={`l-${idx}`}
                      className={`flex items-start px-3 py-1 leading-relaxed ${
                        line.type === 'removed'
                          ? 'bg-rose-500/15 text-rose-900 dark:text-rose-200'
                          : line.type === 'added'
                          ? 'bg-muted/10 opacity-30 select-none'
                          : 'text-foreground'
                      }`}
                    >
                      <span className="w-8 text-[10px] text-muted-foreground/60 select-none flex-shrink-0 pr-2 text-right">
                        {line.leftNum || ''}
                      </span>
                      <span className="whitespace-pre-wrap break-all flex-1">
                        {line.type === 'added' ? ' ' : line.text || ' '}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Right Side */}
                <div className="divide-y divide-muted/40">
                  {diffResult.map((line, idx) => (
                    <div
                      key={`r-${idx}`}
                      className={`flex items-start px-3 py-1 leading-relaxed ${
                        line.type === 'added'
                          ? 'bg-emerald-500/15 text-emerald-900 dark:text-emerald-200'
                          : line.type === 'removed'
                          ? 'bg-muted/10 opacity-30 select-none'
                          : 'text-foreground'
                      }`}
                    >
                      <span className="w-8 text-[10px] text-muted-foreground/60 select-none flex-shrink-0 pr-2 text-right">
                        {line.rightNum || ''}
                      </span>
                      <span className="whitespace-pre-wrap break-all flex-1">
                        {line.type === 'removed' ? ' ' : line.text || ' '}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
