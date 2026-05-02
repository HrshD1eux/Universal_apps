'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Clock, Plus, Trash2, Search, MapPin, Zap, ChevronRight, Layout, Info, Navigation } from 'lucide-react';
import { useLanguage } from '@/context/language-context';

const TIMEZONES = [
  { name: 'London', zone: 'Europe/London', short: 'GMT/BST', long: 'Greenwich Mean Time' },
  { name: 'Mumbai', zone: 'Asia/Kolkata', short: 'IST', long: 'India Standard Time' },
  { name: 'New York', zone: 'America/New_York', short: 'EST/EDT', long: 'Eastern Standard Time' },
  { name: 'San Francisco', zone: 'America/Los_Angeles', short: 'PST/PDT', long: 'Pacific Standard Time' },
  { name: 'Tokyo', zone: 'Asia/Tokyo', short: 'JST', long: 'Japan Standard Time' },
  { name: 'Dubai', zone: 'Asia/Dubai', short: 'GST', long: 'Gulf Standard Time' },
  { name: 'Sydney', zone: 'Australia/Sydney', short: 'AEST/AEDT', long: 'Australian Eastern Time' },
  { name: 'Singapore', zone: 'Asia/Singapore', short: 'SGT', long: 'Singapore Time' },
  { name: 'Paris', zone: 'Europe/Paris', short: 'CET/CEST', long: 'Central European Time' },
  { name: 'Berlin', zone: 'Europe/Berlin', short: 'CET/CEST', long: 'Central European Time' },
  { name: 'Moscow', zone: 'Europe/Moscow', short: 'MSK', long: 'Moscow Standard Time' },
  { name: 'Hong Kong', zone: 'Asia/Hong_Kong', short: 'HKT', long: 'Hong Kong Time' },
  { name: 'Seoul', zone: 'Asia/Seoul', short: 'KST', long: 'Korea Standard Time' },
  { name: 'Sao Paulo', zone: 'America/Sao_Paulo', short: 'BRT', long: 'Brasilia Time' },
  { name: 'Johannesburg', zone: 'Africa/Johannesburg', short: 'SAST', long: 'South Africa Standard Time' },
  { name: 'Bangkok', zone: 'Asia/Bangkok', short: 'ICT', long: 'Indochina Time' },
  { name: 'Istanbul', zone: 'Europe/Istanbul', short: 'TRT', long: 'Turkey Time' },
  { name: 'Vancouver', zone: 'America/Vancouver', short: 'PST/PDT', long: 'Pacific Standard Time' },
  { name: 'Auckland', zone: 'Pacific/Auckland', short: 'NZST/NZDT', long: 'New Zealand Time' },
  { name: 'Beijing', zone: 'Asia/Shanghai', short: 'CST', long: 'China Standard Time' },
  { name: 'Cairo', zone: 'Africa/Cairo', short: 'EET', long: 'Eastern European Time' },
  { name: 'Chicago', zone: 'America/Chicago', short: 'CST/CDT', long: 'Central Standard Time' },
  { name: 'Denver', zone: 'America/Denver', short: 'MST/MDT', long: 'Mountain Standard Time' },
  { name: 'Rome', zone: 'Europe/Rome', short: 'CET/CEST', long: 'Central European Time' },
  { name: 'Toronto', zone: 'America/Toronto', short: 'EST/EDT', long: 'Eastern Standard Time' },
  { name: 'Mexico City', zone: 'America/Mexico_City', short: 'CST', long: 'Central Standard Time' },
  { name: 'Madrid', zone: 'Europe/Madrid', short: 'CET/CEST', long: 'Central European Time' },
  { name: 'Stockholm', zone: 'Europe/Stockholm', short: 'CET/CEST', long: 'Central European Time' }
];

export default function TimeZoneConverter() {
  const [selectedZones, setSelectedZones] = useState(['Asia/Kolkata', 'Europe/London', 'America/New_York']);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [search, setSearch] = useState('');
  const { t } = useLanguage();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date, zone: string) => {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: zone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }).format(date);
  };

  const getOffset = (zone: string) => {
    const date = new Date();
    const utc = date.toLocaleString('en-US', { timeZone: 'UTC' });
    const z = date.toLocaleString('en-US', { timeZone: zone });
    const diff = (new Date(z).getTime() - new Date(utc).getTime()) / 3600000;
    const sign = diff >= 0 ? '+' : '-';
    const hours = Math.floor(Math.abs(diff));
    const mins = Math.round((Math.abs(diff) - hours) * 60);
    return `GMT${sign}${hours}:${mins === 0 ? '00' : mins}`;
  };

  const addZone = (zone: string) => {
    if (!selectedZones.includes(zone)) setSelectedZones([zone, ...selectedZones]);
  };

  const removeZone = (zone: string) => {
    setSelectedZones(selectedZones.filter(z => z !== zone));
  };

  const filteredZones = TIMEZONES.filter(z => 
    z.name.toLowerCase().includes(search.toLowerCase()) || 
    z.zone.toLowerCase().includes(search.toLowerCase()) ||
    z.short.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <Card className="border-none shadow-2xl bg-card/80 backdrop-blur-xl border-2 border-primary/5 overflow-hidden min-h-[700px] flex flex-col">
        <CardHeader className="bg-gradient-to-r from-primary to-indigo-600 text-white p-8 shrink-0">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
             <div className="flex items-center gap-4">
                <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-md shadow-lg">
                   <Globe className="w-8 h-8 text-white" />
                </div>
                <div>
                   <CardTitle className="text-4xl font-black tracking-tight">{t('timezoneTitle')}</CardTitle>
                   <CardDescription className="text-white/70 font-bold text-base">{t('timezoneDesc')}</CardDescription>
                </div>
             </div>
             <div className="bg-white/10 backdrop-blur-md p-6 rounded-[2.5rem] border border-white/20 text-center min-w-[240px] shadow-xl">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-2">My Local Time</p>
                <p className="text-4xl font-black font-mono tabular-nums">{formatTime(currentTime, Intl.DateTimeFormat().resolvedOptions().timeZone)}</p>
                <div className="mt-2 flex items-center justify-center gap-2">
                   <MapPin className="w-3 h-3 opacity-60" />
                   <p className="text-[10px] font-bold opacity-60">{Intl.DateTimeFormat().resolvedOptions().timeZone}</p>
                </div>
             </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0 flex-grow grid grid-cols-1 lg:grid-cols-[380px,1fr]">
            {/* Sidebar Search */}
            <div className="border-r border-primary/5 bg-muted/20 p-8 flex flex-col h-full">
               <div className="relative mb-8">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search city, zone, or short code..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-12 h-14 rounded-2xl border-2 bg-background/50 focus:ring-primary shadow-sm"
                  />
               </div>

               <div className="space-y-3 flex-grow overflow-y-auto pr-2 scrollbar-hide">
                  <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 mb-4 ml-2">World Cities</div>
                  {filteredZones.map(z => (
                    <motion.button 
                      key={z.zone} 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => addZone(z.zone)}
                      className="w-full flex items-center justify-between p-5 rounded-2xl bg-card border hover:border-primary/30 hover:shadow-lg transition-all group relative overflow-hidden"
                    >
                       <div className="text-left relative z-10">
                          <p className="font-black text-sm group-hover:text-primary transition-colors">{z.name}</p>
                          <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{z.short} • {z.long}</p>
                       </div>
                       <Plus className="w-5 h-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity relative z-10" />
                       <div className="absolute right-0 bottom-0 p-2 opacity-5">
                          <Clock className="w-12 h-12" />
                       </div>
                    </motion.button>
                  ))}
               </div>
            </div>

            {/* Clocks Grid */}
            <div className="p-10 bg-background/30 overflow-y-auto scrollbar-hide">
               <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-2">
                     <Layout className="w-4 h-4 text-primary" />
                     <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Monitored Zones</h3>
                  </div>
                  <p className="text-[10px] font-bold text-muted-foreground">{selectedZones.length} Active Clocks</p>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <AnimatePresence mode="popLayout">
                     {selectedZones.map(zone => {
                        const zoneData = TIMEZONES.find(z => z.zone === zone) || { 
                           name: zone.split('/').pop()?.replace('_', ' '), 
                           short: 'UTC', 
                           long: zone 
                        };
                        return (
                          <motion.div
                            key={zone}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="p-8 rounded-[3rem] bg-card border-2 shadow-sm hover:shadow-2xl hover:border-primary/40 transition-all relative group group-clock flex flex-col justify-between h-[240px] overflow-hidden"
                          >
                             <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity rotate-12 group-hover:rotate-0 transition-transform duration-700">
                                <Clock className="w-40 h-40" />
                             </div>

                             <div className="flex justify-between items-start relative z-10">
                                <div>
                                   <div className="flex items-center gap-2 mb-2">
                                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">{zoneData.short}</p>
                                   </div>
                                   <h3 className="text-2xl font-black tracking-tight">{zoneData.name}</h3>
                                   <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1 opacity-60">{getOffset(zone)}</p>
                                </div>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity text-rose-500 hover:bg-rose-50 h-10 w-10 shadow-sm"
                                  onClick={() => removeZone(zone)}
                                >
                                   <Trash2 className="w-4 h-4" />
                                </Button>
                             </div>

                             <div className="relative z-10">
                                <p className="text-5xl font-black font-mono tracking-tighter text-foreground tabular-nums group-hover:scale-105 transition-transform origin-left duration-500">
                                   {formatTime(currentTime, zone)}
                                </p>
                             </div>

                             <div className="flex items-center justify-between text-[10px] font-black text-muted-foreground/60 pt-6 border-t border-dashed relative z-10">
                                <div className="flex items-center gap-1">
                                   <Navigation className="w-3 h-3" />
                                   <span>{new Intl.DateTimeFormat('en-US', { timeZone: zone, weekday: 'short', month: 'short', day: 'numeric' }).format(currentTime)}</span>
                                </div>
                                <span className="text-[9px]">{zoneData.long}</span>
                             </div>
                          </motion.div>
                        );
                     })}
                  </AnimatePresence>
               </div>
               
               {selectedZones.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                     <Clock className="w-20 h-20" />
                     <p className="text-xl font-black italic">No clocks active. Add some from the left.</p>
                  </div>
               )}
            </div>
        </CardContent>
      </Card>
      
      <div className="flex flex-col md:flex-row gap-6">
         <Card className="flex-1 border-none bg-indigo-500/5 p-8 rounded-[2.5rem] border-2 border-dashed border-indigo-500/20">
            <div className="flex items-center gap-4">
               <div className="p-3 bg-indigo-500/10 rounded-2xl">
                  <Info className="w-6 h-6 text-indigo-600" />
               </div>
               <div>
                  <h4 className="font-black text-sm uppercase tracking-widest mb-1">Time Sync</h4>
                  <p className="text-xs font-medium text-muted-foreground">All clocks are synchronized with your system time and adjusted for local offsets including Daylight Savings Time (DST).</p>
               </div>
            </div>
         </Card>
         <Card className="flex-1 border-none bg-amber-500/5 p-8 rounded-[2.5rem] border-2 border-dashed border-amber-500/20">
            <div className="flex items-center gap-4">
               <div className="p-3 bg-amber-500/10 rounded-2xl">
                  <Zap className="w-6 h-6 text-amber-600" />
               </div>
               <div>
                  <h4 className="font-black text-sm uppercase tracking-widest mb-1">Global Coverage</h4>
                  <p className="text-xs font-medium text-muted-foreground">Support for all IANA time zones worldwide. Search by city name or use the short codes for quick access.</p>
               </div>
            </div>
         </Card>
      </div>
    </div>
  );
}
