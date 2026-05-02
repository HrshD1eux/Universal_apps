'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Beaker, Microscope, Atom, Sparkles, 
  Search, Info, Zap, Calculator, RotateCcw
} from 'lucide-react';
import { useLanguage } from '@/context/language-context';

interface Element {
  number: number;
  symbol: string;
  name: string;
  weight: number;
  category: string;
  xpos: number;
  ypos: number;
  color: string;
  density?: number;
  melt?: number;
  boil?: number;
  summary?: string;
  shells?: number[];
  config?: string;
}

const ELEMENTS: Element[] = [
  { number: 1, symbol: 'H', name: 'Hydrogen', weight: 1.008, category: 'diatomic nonmetal', xpos: 1, ypos: 1, color: '#4d90fe', summary: 'Colorless, odorless, tasteless, highly flammable gas.' },
  { number: 2, symbol: 'He', name: 'Helium', weight: 4.0026, category: 'noble gas', xpos: 18, ypos: 1, color: '#f36', summary: 'Colorless, odorless, tasteless, non-toxic, inert gas.' },
  { number: 3, symbol: 'Li', name: 'Lithium', weight: 6.94, category: 'alkali metal', xpos: 1, ypos: 2, color: '#f90', summary: 'Soft, silvery-white alkali metal.' },
  { number: 4, symbol: 'Be', name: 'Beryllium', weight: 9.0122, category: 'alkaline earth metal', xpos: 2, ypos: 2, color: '#fc0' },
  { number: 5, symbol: 'B', name: 'Boron', weight: 10.81, category: 'metalloid', xpos: 13, ypos: 2, color: '#0c6' },
  { number: 6, symbol: 'C', name: 'Carbon', weight: 12.011, category: 'polyatomic nonmetal', xpos: 14, ypos: 2, color: '#0c0' },
  { number: 7, symbol: 'N', name: 'Nitrogen', weight: 14.007, category: 'diatomic nonmetal', xpos: 15, ypos: 2, color: '#0cf' },
  { number: 8, symbol: 'O', name: 'Oxygen', weight: 15.999, category: 'diatomic nonmetal', xpos: 16, ypos: 2, color: '#06f' },
  { number: 9, symbol: 'F', name: 'Fluorine', weight: 18.998, category: 'diatomic nonmetal', xpos: 17, ypos: 2, color: '#63c' },
  { number: 10, symbol: 'Ne', name: 'Neon', weight: 20.180, category: 'noble gas', xpos: 18, ypos: 2, color: '#f36' },
  { number: 11, symbol: 'Na', name: 'Sodium', weight: 22.990, category: 'alkali metal', xpos: 1, ypos: 3, color: '#f90' },
  { number: 12, symbol: 'Mg', name: 'Magnesium', weight: 24.305, category: 'alkaline earth metal', xpos: 2, ypos: 3, color: '#fc0' },
  { number: 13, symbol: 'Al', name: 'Aluminium', weight: 26.982, category: 'post-transition metal', xpos: 13, ypos: 3, color: '#f9c' },
  { number: 14, symbol: 'Si', name: 'Silicon', weight: 28.085, category: 'metalloid', xpos: 14, ypos: 3, color: '#0c6' },
  { number: 15, symbol: 'P', name: 'Phosphorus', weight: 30.974, category: 'polyatomic nonmetal', xpos: 15, ypos: 3, color: '#0c0' },
  { number: 16, symbol: 'S', name: 'Sulfur', weight: 32.06, category: 'polyatomic nonmetal', xpos: 16, ypos: 3, color: '#0c0' },
  { number: 17, symbol: 'Cl', name: 'Chlorine', weight: 35.45, category: 'diatomic nonmetal', xpos: 17, ypos: 3, color: '#0cf' },
  { number: 18, symbol: 'Ar', name: 'Argon', weight: 39.948, category: 'noble gas', xpos: 18, ypos: 3, color: '#f36' },
  { number: 19, symbol: 'K', name: 'Potassium', weight: 39.098, category: 'alkali metal', xpos: 1, ypos: 4, color: '#f90' },
  { number: 20, symbol: 'Ca', name: 'Calcium', weight: 40.078, category: 'alkaline earth metal', xpos: 2, ypos: 4, color: '#fc0' },
  { number: 21, symbol: 'Sc', name: 'Scandium', weight: 44.956, category: 'transition metal', xpos: 3, ypos: 4, color: '#f66' },
  { number: 22, symbol: 'Ti', name: 'Titanium', weight: 47.867, category: 'transition metal', xpos: 4, ypos: 4, color: '#f66' },
  { number: 23, symbol: 'V', name: 'Vanadium', weight: 50.942, category: 'transition metal', xpos: 5, ypos: 4, color: '#f66' },
  { number: 24, symbol: 'Cr', name: 'Chromium', weight: 51.996, category: 'transition metal', xpos: 6, ypos: 4, color: '#f66' },
  { number: 25, symbol: 'Mn', name: 'Manganese', weight: 54.938, category: 'transition metal', xpos: 7, ypos: 4, color: '#f66' },
  { number: 26, symbol: 'Fe', name: 'Iron', weight: 55.845, category: 'transition metal', xpos: 8, ypos: 4, color: '#f66' },
  { number: 27, symbol: 'Co', name: 'Cobalt', weight: 58.933, category: 'transition metal', xpos: 9, ypos: 4, color: '#f66' },
  { number: 28, symbol: 'Ni', name: 'Nickel', weight: 58.693, category: 'transition metal', xpos: 10, ypos: 4, color: '#f66' },
  { number: 29, symbol: 'Cu', name: 'Copper', weight: 63.546, category: 'transition metal', xpos: 11, ypos: 4, color: '#f66' },
  { number: 30, symbol: 'Zn', name: 'Zinc', weight: 65.38, category: 'transition metal', xpos: 12, ypos: 4, color: '#f66' },
  { number: 31, symbol: 'Ga', name: 'Gallium', weight: 69.723, category: 'post-transition metal', xpos: 13, ypos: 4, color: '#f9c' },
  { number: 32, symbol: 'Ge', name: 'Germanium', weight: 72.63, category: 'metalloid', xpos: 14, ypos: 4, color: '#0c6' },
  { number: 33, symbol: 'As', name: 'Arsenic', weight: 74.922, category: 'metalloid', xpos: 15, ypos: 4, color: '#0c6' },
  { number: 34, symbol: 'Se', name: 'Selenium', weight: 78.971, category: 'polyatomic nonmetal', xpos: 16, ypos: 4, color: '#0c0' },
  { number: 35, symbol: 'Br', name: 'Bromine', weight: 79.904, category: 'diatomic nonmetal', xpos: 17, ypos: 4, color: '#0cf' },
  { number: 36, symbol: 'Kr', name: 'Krypton', weight: 83.798, category: 'noble gas', xpos: 18, ypos: 4, color: '#f36' },
  { number: 37, symbol: 'Rb', name: 'Rubidium', weight: 85.468, category: 'alkali metal', xpos: 1, ypos: 5, color: '#f90' },
  { number: 38, symbol: 'Sr', name: 'Strontium', weight: 87.62, category: 'alkaline earth metal', xpos: 2, ypos: 5, color: '#fc0' },
  { number: 39, symbol: 'Y', name: 'Yttrium', weight: 88.906, category: 'transition metal', xpos: 3, ypos: 5, color: '#f66' },
  { number: 40, symbol: 'Zr', name: 'Zirconium', weight: 91.224, category: 'transition metal', xpos: 4, ypos: 5, color: '#f66' },
  { number: 41, symbol: 'Nb', name: 'Niobium', weight: 92.906, category: 'transition metal', xpos: 5, ypos: 5, color: '#f66' },
  { number: 42, symbol: 'Mo', name: 'Molybdenum', weight: 95.95, category: 'transition metal', xpos: 6, ypos: 5, color: '#f66' },
  { number: 43, symbol: 'Tc', name: 'Technetium', weight: 98, category: 'transition metal', xpos: 7, ypos: 5, color: '#f66' },
  { number: 44, symbol: 'Ru', name: 'Ruthenium', weight: 101.07, category: 'transition metal', xpos: 8, ypos: 5, color: '#f66' },
  { number: 45, symbol: 'Rh', name: 'Rhodium', weight: 102.91, category: 'transition metal', xpos: 9, ypos: 5, color: '#f66' },
  { number: 46, symbol: 'Pd', name: 'Palladium', weight: 106.42, category: 'transition metal', xpos: 10, ypos: 5, color: '#f66' },
  { number: 47, symbol: 'Ag', name: 'Silver', weight: 107.87, category: 'transition metal', xpos: 11, ypos: 5, color: '#f66' },
  { number: 48, symbol: 'Cd', name: 'Cadmium', weight: 112.41, category: 'transition metal', xpos: 12, ypos: 5, color: '#f66' },
  { number: 49, symbol: 'In', name: 'Indium', weight: 114.82, category: 'post-transition metal', xpos: 13, ypos: 5, color: '#f9c' },
  { number: 50, symbol: 'Sn', name: 'Tin', weight: 118.71, category: 'post-transition metal', xpos: 14, ypos: 5, color: '#f9c' },
  { number: 51, symbol: 'Sb', name: 'Antimony', weight: 121.76, category: 'metalloid', xpos: 15, ypos: 5, color: '#0c6' },
  { number: 52, symbol: 'Te', name: 'Tellurium', weight: 127.6, category: 'metalloid', xpos: 16, ypos: 5, color: '#0c6' },
  { number: 53, symbol: 'I', name: 'Iodine', weight: 126.9, category: 'diatomic nonmetal', xpos: 17, ypos: 5, color: '#0cf' },
  { number: 54, symbol: 'Xe', name: 'Xenon', weight: 131.29, category: 'noble gas', xpos: 18, ypos: 5, color: '#f36' },
  { number: 55, symbol: 'Cs', name: 'Caesium', weight: 132.91, category: 'alkali metal', xpos: 1, ypos: 6, color: '#f90' },
  { number: 56, symbol: 'Ba', name: 'Barium', weight: 137.33, category: 'alkaline earth metal', xpos: 2, ypos: 6, color: '#fc0' },
  { number: 72, symbol: 'Hf', name: 'Hafnium', weight: 178.49, category: 'transition metal', xpos: 4, ypos: 6, color: '#f66' },
  { number: 73, symbol: 'Ta', name: 'Tantalum', weight: 180.95, category: 'transition metal', xpos: 5, ypos: 6, color: '#f66' },
  { number: 74, symbol: 'W', name: 'Tungsten', weight: 183.84, category: 'transition metal', xpos: 6, ypos: 6, color: '#f66' },
  { number: 75, symbol: 'Re', name: 'Rhenium', weight: 186.21, category: 'transition metal', xpos: 7, ypos: 6, color: '#f66' },
  { number: 76, symbol: 'Os', name: 'Osmium', weight: 190.23, category: 'transition metal', xpos: 8, ypos: 6, color: '#f66' },
  { number: 77, symbol: 'Ir', name: 'Iridium', weight: 192.22, category: 'transition metal', xpos: 9, ypos: 6, color: '#f66' },
  { number: 78, symbol: 'Pt', name: 'Platinum', weight: 195.08, category: 'transition metal', xpos: 10, ypos: 6, color: '#f66' },
  { number: 79, symbol: 'Au', name: 'Gold', weight: 196.97, category: 'transition metal', xpos: 11, ypos: 6, color: '#f66' },
  { number: 80, symbol: 'Hg', name: 'Mercury', weight: 200.59, category: 'transition metal', xpos: 12, ypos: 6, color: '#f66' },
  { number: 81, symbol: 'Tl', name: 'Thallium', weight: 204.38, category: 'post-transition metal', xpos: 13, ypos: 6, color: '#f9c' },
  { number: 82, symbol: 'Pb', name: 'Lead', weight: 207.2, category: 'post-transition metal', xpos: 14, ypos: 6, color: '#f9c' },
  { number: 83, symbol: 'Bi', name: 'Bismuth', weight: 208.98, category: 'post-transition metal', xpos: 15, ypos: 6, color: '#f9c' },
  { number: 84, symbol: 'Po', name: 'Polonium', weight: 209, category: 'post-transition metal', xpos: 16, ypos: 6, color: '#f9c' },
  { number: 85, symbol: 'At', name: 'Astatine', weight: 210, category: 'metalloid', xpos: 17, ypos: 6, color: '#0c6' },
  { number: 86, symbol: 'Rn', name: 'Radon', weight: 222, category: 'noble gas', xpos: 18, ypos: 6, color: '#f36' },
  { number: 87, symbol: 'Fr', name: 'Francium', weight: 223, category: 'alkali metal', xpos: 1, ypos: 7, color: '#f90' },
  { number: 88, symbol: 'Ra', name: 'Radium', weight: 226, category: 'alkaline earth metal', xpos: 2, ypos: 7, color: '#fc0' },
  { number: 104, symbol: 'Rf', name: 'Rutherfordium', weight: 267, category: 'transition metal', xpos: 4, ypos: 7, color: '#f66' },
  { number: 105, symbol: 'Db', name: 'Dubnium', weight: 268, category: 'transition metal', xpos: 5, ypos: 7, color: '#f66' },
  { number: 106, symbol: 'Sg', name: 'Seaborgium', weight: 269, category: 'transition metal', xpos: 6, ypos: 7, color: '#f66' },
  { number: 107, symbol: 'Bh', name: 'Bohrium', weight: 270, category: 'transition metal', xpos: 7, ypos: 7, color: '#f66' },
  { number: 108, symbol: 'Hs', name: 'Hassium', weight: 269, category: 'transition metal', xpos: 8, ypos: 7, color: '#f66' },
  { number: 109, symbol: 'Mt', name: 'Meitnerium', weight: 278, category: 'unknown', xpos: 9, ypos: 7, color: '#ccc' },
  { number: 110, symbol: 'Ds', name: 'Darmstadtium', weight: 281, category: 'unknown', xpos: 10, ypos: 7, color: '#ccc' },
  { number: 111, symbol: 'Rg', name: 'Roentgenium', weight: 282, category: 'unknown', xpos: 11, ypos: 7, color: '#ccc' },
  { number: 112, symbol: 'Cn', name: 'Copernicium', weight: 285, category: 'transition metal', xpos: 12, ypos: 7, color: '#f66' },
  { number: 113, symbol: 'Nh', name: 'Nihonium', weight: 286, category: 'unknown', xpos: 13, ypos: 7, color: '#ccc' },
  { number: 114, symbol: 'Fl', name: 'Flerovium', weight: 289, category: 'post-transition metal', xpos: 14, ypos: 7, color: '#f9c' },
  { number: 115, symbol: 'Mc', name: 'Moscovium', weight: 290, category: 'unknown', xpos: 15, ypos: 7, color: '#ccc' },
  { number: 116, symbol: 'Lv', name: 'Livermorium', weight: 293, category: 'unknown', xpos: 16, ypos: 7, color: '#ccc' },
  { number: 117, symbol: 'Ts', name: 'Tennessine', weight: 294, category: 'unknown', xpos: 17, ypos: 7, color: '#ccc' },
  { number: 118, symbol: 'Og', name: 'Oganesson', weight: 294, category: 'noble gas', xpos: 18, ypos: 7, color: '#f36' },
  
  // Lanthanides
  { number: 57, symbol: 'La', name: 'Lanthanum', weight: 138.91, category: 'lanthanide', xpos: 4, ypos: 9, color: '#fcc' },
  { number: 58, symbol: 'Ce', name: 'Cerium', weight: 140.12, category: 'lanthanide', xpos: 5, ypos: 9, color: '#fcc' },
  { number: 59, symbol: 'Pr', name: 'Praseodymium', weight: 140.91, category: 'lanthanide', xpos: 6, ypos: 9, color: '#fcc' },
  { number: 60, symbol: 'Nd', name: 'Neodymium', weight: 144.24, category: 'lanthanide', xpos: 7, ypos: 9, color: '#fcc' },
  { number: 61, symbol: 'Pm', name: 'Promethium', weight: 145, category: 'lanthanide', xpos: 8, ypos: 9, color: '#fcc' },
  { number: 62, symbol: 'Sm', name: 'Samarium', weight: 150.36, category: 'lanthanide', xpos: 9, ypos: 9, color: '#fcc' },
  { number: 63, symbol: 'Eu', name: 'Europium', weight: 151.96, category: 'lanthanide', xpos: 10, ypos: 9, color: '#fcc' },
  { number: 64, symbol: 'Gd', name: 'Gadolinium', weight: 157.25, category: 'lanthanide', xpos: 11, ypos: 9, color: '#fcc' },
  { number: 65, symbol: 'Tb', name: 'Terbium', weight: 158.93, category: 'lanthanide', xpos: 12, ypos: 9, color: '#fcc' },
  { number: 66, symbol: 'Dy', name: 'Dysprosium', weight: 162.5, category: 'lanthanide', xpos: 13, ypos: 9, color: '#fcc' },
  { number: 67, symbol: 'Ho', name: 'Holmium', weight: 164.93, category: 'lanthanide', xpos: 14, ypos: 9, color: '#fcc' },
  { number: 68, symbol: 'Er', name: 'Erbium', weight: 167.26, category: 'lanthanide', xpos: 15, ypos: 9, color: '#fcc' },
  { number: 69, symbol: 'Tm', name: 'Thulium', weight: 168.93, category: 'lanthanide', xpos: 16, ypos: 9, color: '#fcc' },
  { number: 70, symbol: 'Yb', name: 'Ytterbium', weight: 173.05, category: 'lanthanide', xpos: 17, ypos: 9, color: '#fcc' },
  { number: 71, symbol: 'Lu', name: 'Lutetium', weight: 174.97, category: 'lanthanide', xpos: 18, ypos: 9, color: '#fcc' },
  
  // Actinides
  { number: 89, symbol: 'Ac', name: 'Actinium', weight: 227, category: 'actinide', xpos: 4, ypos: 10, color: '#ccf' },
  { number: 90, symbol: 'Th', name: 'Thorium', weight: 232.04, category: 'actinide', xpos: 5, ypos: 10, color: '#ccf' },
  { number: 91, symbol: 'Pa', name: 'Protactinium', weight: 231.04, category: 'actinide', xpos: 6, ypos: 10, color: '#ccf' },
  { number: 92, symbol: 'U', name: 'Uranium', weight: 238.03, category: 'actinide', xpos: 7, ypos: 10, color: '#ccf' },
  { number: 93, symbol: 'Np', name: 'Neptunium', weight: 237, category: 'actinide', xpos: 8, ypos: 10, color: '#ccf' },
  { number: 94, symbol: 'Pu', name: 'Plutonium', weight: 244, category: 'actinide', xpos: 9, ypos: 10, color: '#ccf' },
  { number: 95, symbol: 'Am', name: 'Americium', weight: 243, category: 'actinide', xpos: 10, ypos: 10, color: '#ccf' },
  { number: 96, symbol: 'Cm', name: 'Curium', weight: 247, category: 'actinide', xpos: 11, ypos: 10, color: '#ccf' },
  { number: 97, symbol: 'Bk', name: 'Berkelium', weight: 247, category: 'actinide', xpos: 12, ypos: 10, color: '#ccf' },
  { number: 98, symbol: 'Cf', name: 'Californium', weight: 251, category: 'actinide', xpos: 13, ypos: 10, color: '#ccf' },
  { number: 99, symbol: 'Es', name: 'Einsteinium', weight: 252, category: 'actinide', xpos: 14, ypos: 10, color: '#ccf' },
  { number: 100, symbol: 'Fm', name: 'Fermium', weight: 257, category: 'actinide', xpos: 15, ypos: 10, color: '#ccf' },
  { number: 101, symbol: 'Md', name: 'Mendelevium', weight: 258, category: 'actinide', xpos: 16, ypos: 10, color: '#ccf' },
  { number: 102, symbol: 'No', name: 'Nobelium', weight: 259, category: 'actinide', xpos: 17, ypos: 10, color: '#ccf' },
  { number: 103, symbol: 'Lr', name: 'Lawrencium', weight: 262, category: 'actinide', xpos: 18, ypos: 10, color: '#ccf' },
];

export default function PeriodicTablePro() {
  const [selected, setSelected] = useState<Element | null>(null);
  const [formula, setFormula] = useState('H2O');
  const [activeTab, setActiveTab] = useState<'table' | 'lab'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  
  const { t } = useLanguage();

  const molarMass = useMemo(() => {
    // Basic molar mass calculator
    try {
      const parts = formula.match(/([A-Z][a-z]?)(\d*)/g);
      if (!parts) return 0;
      let total = 0;
      parts.forEach(p => {
        const match = p.match(/([A-Z][a-z]?)(\d*)/);
        if (match) {
          const sym = match[1];
          const count = parseInt(match[2] || '1');
          const el = ELEMENTS.find(e => e.symbol === sym);
          if (el) total += el.weight * count;
        }
      });
      return total;
    } catch (e) {
      return 0;
    }
  }, [formula]);

  const filteredElements = useMemo(() => {
    if (!searchQuery) return ELEMENTS;
    return ELEMENTS.filter(e => 
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      e.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.number.toString() === searchQuery
    );
  }, [searchQuery]);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      <Card className="border-none shadow-2xl bg-gradient-to-br from-background via-muted/50 to-background overflow-hidden font-sans">
        <CardHeader className="bg-primary/5 border-b border-primary/10 p-8">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex items-center gap-4">
                 <div className="p-4 bg-primary text-primary-foreground rounded-2xl shadow-lg shadow-primary/20">
                    <Atom className="w-8 h-8" />
                 </div>
                 <div>
                    <CardTitle className="text-3xl font-black tracking-tight">{t('periodicTableTitle' as any)}</CardTitle>
                    <CardDescription className="text-base font-bold text-primary/60">{t('periodicTableDesc' as any)}</CardDescription>
                 </div>
              </div>
              
              <div className="flex p-1 bg-muted rounded-2xl border-2">
                 <button onClick={() => setActiveTab('table')} className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'table' ? 'bg-background shadow-lg text-primary scale-105' : 'text-muted-foreground hover:text-primary'}`}>PERIODIC GRID</button>
                 <button onClick={() => setActiveTab('lab')} className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'lab' ? 'bg-background shadow-lg text-primary scale-105' : 'text-muted-foreground hover:text-primary'}`}>CHEMISTRY LAB</button>
              </div>
           </div>
        </CardHeader>

        <CardContent className="p-8">
           <AnimatePresence mode="wait">
              {activeTab === 'table' && (
                 <motion.div key="table" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
                    <div className="max-w-md relative">
                       <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                       <Input 
                         value={searchQuery} 
                         onChange={(e) => setSearchQuery(e.target.value)} 
                         placeholder="Search elements..." 
                         className="h-12 pl-12 rounded-xl border-2"
                       />
                    </div>

                    <div className="overflow-x-auto pb-8">
                       <div className="grid grid-cols-18 gap-1 min-w-[1000px]">
                          {ELEMENTS.map((el) => (
                             <motion.div
                               key={el.number}
                               style={{ gridColumn: el.xpos, gridRow: el.ypos }}
                               whileHover={{ scale: 1.1, zIndex: 10 }}
                               onClick={() => setSelected(el)}
                               className={`group relative aspect-square rounded-lg border-2 cursor-pointer transition-all flex flex-col items-center justify-center p-1 ${selected?.number === el.number ? 'ring-4 ring-primary border-transparent' : 'border-primary/10 hover:border-primary/40 bg-card'}`}
                             >
                                <span className="text-[8px] font-black absolute top-1 left-1 opacity-40">{el.number}</span>
                                <span className="text-xl font-black tracking-tighter" style={{ color: el.color }}>{el.symbol}</span>
                                <span className="text-[7px] font-bold opacity-60 truncate w-full text-center">{el.name}</span>
                             </motion.div>
                          ))}
                       </div>
                    </div>

                    <AnimatePresence>
                       {selected && (
                          <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="grid grid-cols-1 lg:grid-cols-[1fr,1.5fr] gap-8 border-t pt-12"
                          >
                             <div className="p-10 rounded-[3rem] bg-card border-2 shadow-2xl relative overflow-hidden flex flex-col items-center justify-center text-center">
                                <div className="absolute top-4 left-6 text-2xl font-black opacity-10">{selected.number}</div>
                                <div className="text-8xl font-black mb-4 tracking-tighter" style={{ color: selected.color }}>{selected.symbol}</div>
                                <div className="text-3xl font-black mb-2">{selected.name}</div>
                                <div className="px-4 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest mb-6">{selected.category}</div>
                                <div className="w-full grid grid-cols-2 gap-4 pt-8 border-t">
                                   <div><p className="text-[10px] font-black opacity-40 mb-1">Atomic Mass</p><p className="text-xl font-black">{selected.weight}</p></div>
                                   <div><p className="text-[10px] font-black opacity-40 mb-1">Color Group</p><div className="w-4 h-4 rounded-full mx-auto" style={{ backgroundColor: selected.color }} /></div>
                                </div>
                             </div>

                             <div className="space-y-6">
                                <div className="p-8 rounded-[2.5rem] bg-muted/30 border-2 border-dashed space-y-4">
                                   <div className="flex items-center gap-3">
                                      <Info className="w-5 h-5 text-primary" />
                                      <span className="text-xs font-black uppercase tracking-widest">Chemical Abstract</span>
                                   </div>
                                   <p className="text-sm font-bold text-muted-foreground leading-relaxed">
                                      {selected.summary || `${selected.name} is a chemical element with symbol ${selected.symbol} and atomic number ${selected.number}. It belongs to the ${selected.category} group.`}
                                   </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                   <div className="p-6 rounded-3xl bg-primary text-primary-foreground shadow-xl relative overflow-hidden group">
                                      <Microscope className="absolute -right-4 -bottom-4 w-24 h-24 opacity-10 group-hover:scale-110 transition-transform" />
                                      <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Stability Analysis</p>
                                      <p className="text-xl font-black">Standard Atomic State</p>
                                      <div className="mt-4 flex items-center gap-2">
                                         <Zap className="w-4 h-4" />
                                         <span className="text-xs font-bold">{selected.weight > 200 ? 'Radioactive Potential' : 'Stable Isotope'}</span>
                                      </div>
                                   </div>
                                   <div className="p-6 rounded-3xl bg-muted border-2 flex flex-col justify-center">
                                      <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-4 text-center">Bohr Model Shells</p>
                                      <div className="flex justify-center gap-2">
                                         {Array.from({ length: Math.min(Math.ceil(selected.number / 10), 5) }).map((_, i) => (
                                            <div key={i} className="w-3 h-3 rounded-full bg-primary opacity-40 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
                                         ))}
                                      </div>
                                   </div>
                                </div>
                             </div>
                          </motion.div>
                       )}
                    </AnimatePresence>
                 </motion.div>
              )}

              {activeTab === 'lab' && (
                 <motion.div key="lab" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-[1fr,1.5fr] gap-12">
                    <div className="space-y-8">
                       <div className="space-y-4">
                          <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Compound Formula</label>
                          <div className="relative">
                             <Input 
                               value={formula} 
                               onChange={(e) => setFormula(e.target.value)} 
                               className="h-20 rounded-[2rem] border-2 text-3xl font-black focus:ring-primary pl-8 pr-20"
                             />
                             <div className="absolute right-6 top-1/2 -translate-y-1/2">
                                <Beaker className="w-8 h-8 text-primary opacity-20" />
                             </div>
                          </div>
                          <p className="text-[10px] font-bold text-muted-foreground ml-4 italic">Example: H2O, C6H12O6, NaCl, H2SO4</p>
                       </div>

                       <div className="p-10 rounded-[3rem] bg-primary text-primary-foreground shadow-2xl relative overflow-hidden group">
                          <Sparkles className="absolute top-0 right-0 p-8 w-40 h-40 opacity-10 group-hover:scale-110 transition-transform" />
                          <div className="relative z-10 space-y-8">
                             <div>
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Molecular Molar Mass</p>
                                <p className="text-6xl font-black">{molarMass.toFixed(3)} <span className="text-2xl opacity-60">g/mol</span></p>
                             </div>
                             <div className="pt-8 border-t border-white/10">
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-4">Element Breakdown</p>
                                <div className="flex flex-wrap gap-4">
                                   {formula.match(/([A-Z][a-z]?)(\d*)/g)?.map((p, i) => {
                                      const m = p.match(/([A-Z][a-z]?)(\d*)/);
                                      if (!m) return null;
                                      const el = ELEMENTS.find(e => e.symbol === m[1]);
                                      if (!el) return null;
                                      return (
                                         <div key={i} className="flex flex-col items-center">
                                            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center font-black">{el.symbol}</div>
                                            <span className="text-[8px] font-black mt-1 opacity-60">{m[2] || '1'}</span>
                                         </div>
                                      );
                                   })}
                                </div>
                             </div>
                          </div>
                       </div>
                    </div>

                    <div className="space-y-6">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-8 rounded-[2.5rem] bg-card border-2 shadow-xl space-y-4">
                             <div className="flex items-center gap-2 mb-4">
                                <Zap className="w-4 h-4 text-primary" />
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Ideal Gas Law</span>
                             </div>
                             <div className="space-y-4">
                                <div className="flex justify-between items-center pb-2 border-b">
                                   <span className="text-xs font-bold opacity-60">Pressure (atm)</span>
                                   <Input type="number" defaultValue="1" className="w-20 h-8 text-right font-black" />
                                </div>
                                <div className="flex justify-between items-center pb-2 border-b">
                                   <span className="text-xs font-bold opacity-60">Volume (L)</span>
                                   <Input type="number" defaultValue="22.4" className="w-20 h-8 text-right font-black" />
                                </div>
                                <div className="flex justify-between items-center pb-2 border-b">
                                   <span className="text-xs font-bold opacity-60">Temp (K)</span>
                                   <Input type="number" defaultValue="273.15" className="w-20 h-8 text-right font-black" />
                                </div>
                                <div className="pt-2 text-right">
                                   <p className="text-[10px] font-black text-primary uppercase">n = 1.000 mol</p>
                                </div>
                             </div>
                          </div>

                          <div className="p-8 rounded-[2.5rem] bg-card border-2 shadow-xl space-y-4">
                             <div className="flex items-center gap-2 mb-4">
                                <Beaker className="w-4 h-4 text-primary" />
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Molarity Lab</span>
                             </div>
                             <div className="space-y-4">
                                <div className="flex justify-between items-center pb-2 border-b">
                                   <span className="text-xs font-bold opacity-60">Solute (g)</span>
                                   <Input type="number" defaultValue="58.44" className="w-20 h-8 text-right font-black" />
                                </div>
                                <div className="flex justify-between items-center pb-2 border-b">
                                   <span className="text-xs font-bold opacity-60">Molar Mass</span>
                                   <Input type="number" value={molarMass.toFixed(2)} readOnly className="w-20 h-8 text-right font-black bg-muted/50" />
                                </div>
                                <div className="flex justify-between items-center pb-2 border-b">
                                   <span className="text-xs font-bold opacity-60">Volume (mL)</span>
                                   <Input type="number" defaultValue="1000" className="w-20 h-8 text-right font-black" />
                                </div>
                                <div className="pt-2 text-right">
                                   <p className="text-[10px] font-black text-primary uppercase">Molarity = 1.00 M</p>
                                </div>
                             </div>
                          </div>
                       </div>

                       <div className="p-10 rounded-[3rem] bg-muted/30 border-2 shadow-inner space-y-6">
                          <div className="flex items-center gap-4">
                             <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                                <RotateCcw className="w-6 h-6 text-primary" />
                             </div>
                             <div>
                                <h3 className="text-xl font-black">Dilution Equation</h3>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">M₁V₁ = M₂V₂</p>
                             </div>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                             {[
                               { label: 'M1', unit: 'M', val: '1.0' },
                               { label: 'V1', unit: 'mL', val: '100' },
                               { label: 'M2', unit: 'M', val: '0.1' },
                               { label: 'V2', unit: 'mL', val: '1000' }
                             ].map((d, i) => (
                                <div key={i} className="space-y-2">
                                   <p className="text-[10px] font-black opacity-40">{d.label}</p>
                                   <Input defaultValue={d.val} className="h-10 rounded-xl font-black text-center" />
                                </div>
                             ))}
                          </div>
                       </div>
                    </div>
                 </motion.div>
              )}
           </AnimatePresence>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
         {[
           { label: 'Noble Gases', color: '#f36' },
           { label: 'Alkali Metals', color: '#f90' },
           { label: 'Alkaline Earth', color: '#fc0' },
           { label: 'Transition', color: '#f66' },
           { label: 'Nonmetals', color: '#0c0' }
         ].map((g, i) => (
            <div key={i} className="flex items-center gap-3 p-4 rounded-2xl bg-card border-2">
               <div className="w-3 h-3 rounded-full" style={{ backgroundColor: g.color }} />
               <span className="text-[10px] font-black uppercase tracking-wider">{g.label}</span>
            </div>
         ))}
      </div>
    </div>
  );
}
