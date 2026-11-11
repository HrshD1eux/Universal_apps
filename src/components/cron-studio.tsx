'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { Clock, Copy, Check, Sparkles, Calendar, Terminal, Play } from 'lucide-react';
import { notifyCopied, notifyCompleted } from '@/lib/notify';

// Helper to explain individual fields
function explainField(val: string, type: 'min' | 'hour' | 'dom' | 'month' | 'dow'): string {
  if (val === '*') {
    switch (type) {
      case 'min': return 'every minute';
      case 'hour': return 'every hour';
      case 'dom': return 'every day of the month';
      case 'month': return 'every month';
      case 'dow': return 'every day of the week';
    }
  }

  if (val.startsWith('*/')) {
    const step = val.replace('*/', '');
    switch (type) {
      case 'min': return `every ${step} minutes`;
      case 'hour': return `every ${step} hours`;
      case 'dom': return `every ${step} days`;
      case 'month': return `every ${step} months`;
      case 'dow': return `every ${step} days of the week`;
    }
  }

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  if (type === 'dow') {
    if (val === '1-5') return 'Monday through Friday (weekdays)';
    if (val === '0,6' || val === '6,0') return 'Saturday and Sunday (weekends)';
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && days[parsed]) return `on ${days[parsed]}`;
  }

  if (type === 'month') {
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && months[parsed - 1]) return `in ${months[parsed - 1]}`;
  }

  if (type === 'dom') return `on day ${val} of the month`;
  if (type === 'hour') return `at hour ${val.padStart(2, '0')}:00`;
  if (type === 'min') return `at minute ${val}`;

  return val;
}

// Full human-readable breakdown
function explainCron(cronStr: string): string {
  const parts = cronStr.trim().split(/\s+/);
  if (parts.length !== 5) return 'Invalid cron expression (must have 5 fields)';

  const [min, hour, dom, mon, dow] = parts;

  if (min === '*' && hour === '*' && dom === '*' && mon === '*' && dow === '*') {
    return 'Every minute, every hour, every single day.';
  }

  if (min.startsWith('*/') && hour === '*' && dom === '*' && mon === '*' && dow === '*') {
    return `Every ${min.replace('*/', '')} minutes.`;
  }

  if (min === '0' && hour === '0' && dom === '*' && mon === '*' && dow === '*') {
    return 'At 00:00 (midnight) every day.';
  }

  if (min === '0' && hour !== '*' && dom === '*' && mon === '*' && dow === '1-5') {
    return `At ${hour.padStart(2, '0')}:00 on every weekday (Monday through Friday).`;
  }

  return `Runs ${explainField(min, 'min')}, ${explainField(hour, 'hour')}, ${explainField(dom, 'dom')}, ${explainField(mon, 'month')}, and ${explainField(dow, 'dow')}.`;
}

// Calculate the next 5 execution dates
function getNextExecutions(cronStr: string, count: number = 5): string[] {
  const parts = cronStr.trim().split(/\s+/);
  if (parts.length !== 5) return [];

  const results: string[] = [];
  const current = new Date();
  const testDate = new Date(current.getTime());

  // Simple, deterministic forward scanner (up to 30 days ahead)
  let iterations = 0;
  while (results.length < count && iterations < 43200) { // 30 days in minutes
    iterations++;
    testDate.setMinutes(testDate.getMinutes() + 1);
    testDate.setSeconds(0);
    testDate.setMilliseconds(0);

    const m = testDate.getMinutes();
    const h = testDate.getHours();
    const dom = testDate.getDate();
    const mon = testDate.getMonth() + 1;
    const dow = testDate.getDay();

    const matchPart = (part: string, val: number, isDow = false) => {
      if (part === '*') return true;
      if (part.startsWith('*/')) {
        const step = parseInt(part.replace('*/', ''), 10);
        return step > 0 && val % step === 0;
      }
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(Number);
        return val >= start && val <= end;
      }
      if (part.includes(',')) {
        return part.split(',').map(Number).includes(val);
      }
      return parseInt(part, 10) === val;
    };

    if (
      matchPart(parts[0], m) &&
      matchPart(parts[1], h) &&
      matchPart(parts[2], dom) &&
      matchPart(parts[3], mon) &&
      matchPart(parts[4], dow, true)
    ) {
      results.push(testDate.toLocaleString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }));
    }
  }

  return results;
}

export default function CronStudio() {
  const [cronExpression, setCronExpression] = useState<string>('*/15 9-17 * * 1-5');

  const humanExplanation = useMemo(() => explainCron(cronExpression), [cronExpression]);
  const upcomingRuns = useMemo(() => getNextExecutions(cronExpression, 5), [cronExpression]);

  const copyCron = () => {
    navigator.clipboard.writeText(cronExpression);
    notifyCopied(cronExpression);
  };

  const setPreset = (cron: string) => {
    setCronExpression(cron);
    notifyCompleted('Preset Applied', cron);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 px-4">
      <Card className="border shadow-xl bg-card overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20">
                <Clock className="w-8 h-8 text-white" />
              </div>
              <div>
                <CardTitle className="text-3xl font-black tracking-tight">
                  Cron Expression Studio & Explainer
                </CardTitle>
                <CardDescription className="text-white/75 font-semibold">
                  Translate, build, and forecast crontab schedules offline with zero network latency
                </CardDescription>
              </div>
            </div>

            <Button
              onClick={copyCron}
              className="bg-white text-slate-900 hover:bg-white/90 font-black shadow-lg gap-2 h-11 px-5 rounded-xl"
            >
              <Copy className="w-4 h-4" /> Copy Cron Expression
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-8 space-y-8">
          {/* Main Input & Explanation Display */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Terminal className="w-4 h-4" /> Cron Expression (5 Standard Fields)
              </label>
              <Input
                value={cronExpression}
                onChange={(e) => setCronExpression(e.target.value)}
                className="font-mono text-2xl font-black h-16 px-6 tracking-widest text-primary rounded-2xl border-2"
                placeholder="* * * * *"
              />
              <div className="grid grid-cols-5 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground pt-1">
                <span>Minute (0-59)</span>
                <span>Hour (0-23)</span>
                <span>Day of Month (1-31)</span>
                <span>Month (1-12)</span>
                <span>Day of Week (0-6)</span>
              </div>
            </div>

            {/* Natural Language Explanation Box */}
            <div className="p-6 rounded-2xl bg-primary/5 border-2 border-primary/20 flex items-center gap-4">
              <div className="p-3 bg-primary text-primary-foreground rounded-xl shadow-md">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="text-[10px] font-black uppercase tracking-wider text-primary">
                  Human-Readable Explanation
                </div>
                <div className="text-base sm:text-lg font-bold text-foreground">
                  “{humanExplanation}”
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Quick Presets */}
            <div className="lg:col-span-6 space-y-4">
              <div className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                Common Production Schedules
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  { name: 'Every 15 Minutes', cron: '*/15 * * * *' },
                  { name: 'Every Hour', cron: '0 * * * *' },
                  { name: 'Daily at Midnight', cron: '0 0 * * *' },
                  { name: 'Daily at 9:00 AM', cron: '0 9 * * *' },
                  { name: 'Weekdays at 9:00 AM', cron: '0 9 * * 1-5' },
                  { name: 'Weekly on Sunday', cron: '0 0 * * 0' },
                  { name: 'Monthly on the 1st', cron: '0 0 1 * *' },
                  { name: 'Twice a Day (Noon & Midnight)', cron: '0 0,12 * * *' },
                ].map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => setPreset(preset.cron)}
                    className="p-3 text-left rounded-xl border bg-muted/20 hover:bg-muted/60 transition-all flex flex-col justify-between"
                  >
                    <span className="text-xs font-bold text-foreground">{preset.name}</span>
                    <span className="text-[11px] font-mono text-primary font-bold mt-1">{preset.cron}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Next 5 Forecasted Executions */}
            <div className="lg:col-span-6 space-y-4">
              <div className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Next 5 Scheduled Occurrences
              </div>
              <div className="border rounded-2xl p-5 bg-card/60 space-y-2.5">
                {upcomingRuns.length > 0 ? (
                  upcomingRuns.map((time, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border text-xs font-mono"
                    >
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[11px]">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-foreground">{time}</span>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-xs text-muted-foreground font-medium">
                    No upcoming runs found in the next 30 days. Check your expression.
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
