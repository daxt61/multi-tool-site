import { useState } from 'react';
import { ArrowDown, Copy, Check, Trash2 } from 'lucide-react';

type ConversionCategory = 'length' | 'weight' | 'temperature' | 'area' | 'volume' | 'digital' | 'pressure' | 'energy' | 'speed' | 'time';

interface ConversionUnit {
  name: string;
  toBase: (value: number) => number;
  fromBase: (value: number) => number;
}

// ⚡ Bolt Optimization: Move static conversion data outside of the component to prevent redundant object re-allocation on every render/keystroke.
const CONVERSIONS: Record<ConversionCategory, Record<string, ConversionUnit>> = {
  length: {
    'm': { name: 'Mètres', toBase: (v) => v, fromBase: (v) => v },
    'km': { name: 'Kilomètres', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
    'cm': { name: 'Centimètres', toBase: (v) => v / 100, fromBase: (v) => v * 100 },
    'mm': { name: 'Millimètres', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
    'mi': { name: 'Miles', toBase: (v) => v * 1609.34, fromBase: (v) => v / 1609.34 },
    'yd': { name: 'Yards', toBase: (v) => v * 0.9144, fromBase: (v) => v / 0.9144 },
    'ft': { name: 'Pieds', toBase: (v) => v * 0.3048, fromBase: (v) => v / 0.3048 },
    'in': { name: 'Pouces', toBase: (v) => v * 0.0254, fromBase: (v) => v / 0.0254 }
  },
  weight: {
    'kg': { name: 'Kilogrammes', toBase: (v) => v, fromBase: (v) => v },
    'g': { name: 'Grammes', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
    'mg': { name: 'Milligrammes', toBase: (v) => v / 1000000, fromBase: (v) => v * 1000000 },
    'lb': { name: 'Livres', toBase: (v) => v * 0.453592, fromBase: (v) => v / 0.453592 },
    'oz': { name: 'Onces', toBase: (v) => v * 0.0283495, fromBase: (v) => v / 0.0283495 },
    't': { name: 'Tonnes', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 }
  },
  temperature: {
    'C': { name: 'Celsius', toBase: (v) => v, fromBase: (v) => v },
    'F': { name: 'Fahrenheit', toBase: (v) => (v - 32) * 5/9, fromBase: (v) => (v * 9/5) + 32 },
    'K': { name: 'Kelvin', toBase: (v) => v - 273.15, fromBase: (v) => v + 273.15 }
  },
  area: {
    'm2': { name: 'Mètres carrés', toBase: (v) => v, fromBase: (v) => v },
    'km2': { name: 'Kilomètres carrés', toBase: (v) => v * 1000000, fromBase: (v) => v / 1000000 },
    'cm2': { name: 'Centimètres carrés', toBase: (v) => v / 10000, fromBase: (v) => v * 10000 },
    'mm2': { name: 'Millimètres carrés', toBase: (v) => v / 1000000, fromBase: (v) => v * 1000000 },
    'ha': { name: 'Hectares', toBase: (v) => v * 10000, fromBase: (v) => v / 10000 },
    'ac': { name: 'Acres', toBase: (v) => v * 4046.86, fromBase: (v) => v / 4046.86 },
    'ft2': { name: 'Pieds carrés', toBase: (v) => v * 0.092903, fromBase: (v) => v / 0.092903 },
    'in2': { name: 'Pouces carrés', toBase: (v) => v * 0.00064516, fromBase: (v) => v / 0.00064516 }
  },
  volume: {
    'm3': { name: 'Mètres cubes', toBase: (v) => v, fromBase: (v) => v },
    'l': { name: 'Litres', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
    'ml': { name: 'Millilitres', toBase: (v) => v / 1000000, fromBase: (v) => v * 1000000 },
    'cm3': { name: 'Centimètres cubes', toBase: (v) => v / 1000000, fromBase: (v) => v * 1000000 },
    'gal': { name: 'Gallons (US)', toBase: (v) => v * 0.00378541, fromBase: (v) => v / 0.00378541 },
    'qt': { name: 'Quarts (US)', toBase: (v) => v * 0.000946353, fromBase: (v) => v / 0.000946353 },
    'pt': { name: 'Pintes (US)', toBase: (v) => v * 0.000473176, fromBase: (v) => v / 0.000473176 },
    'cup': { name: 'Tasses (US)', toBase: (v) => v * 0.000236588, fromBase: (v) => v / 0.000236588 }
  },
  digital: {
    'B': { name: 'Octets (B)', toBase: (v) => v, fromBase: (v) => v },
    'KB': { name: 'Kilooctets (KB)', toBase: (v) => v * 1024, fromBase: (v) => v / 1024 },
    'MB': { name: 'Megaoctets (MB)', toBase: (v) => v * Math.pow(1024, 2), fromBase: (v) => v / Math.pow(1024, 2) },
    'GB': { name: 'Gigaoctets (GB)', toBase: (v) => v * Math.pow(1024, 3), fromBase: (v) => v / Math.pow(1024, 3) },
    'TB': { name: 'Teraoctets (TB)', toBase: (v) => v * Math.pow(1024, 4), fromBase: (v) => v / Math.pow(1024, 4) }
  },
  speed: {
    'm/s': { name: 'Mètres par seconde (m/s)', toBase: (v) => v, fromBase: (v) => v },
    'km/h': { name: 'Kilomètres par heure (km/h)', toBase: (v) => v / 3.6, fromBase: (v) => v * 3.6 },
    'mph': { name: 'Miles par heure (mph)', toBase: (v) => v * 0.44704, fromBase: (v) => v / 0.44704 },
    'kn': { name: 'Noeuds (kn)', toBase: (v) => v * 0.514444, fromBase: (v) => v / 0.514444 }
  },
  time: {
    's': { name: 'Secondes (s)', toBase: (v) => v, fromBase: (v) => v },
    'ms': { name: 'Millisecondes (ms)', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
    'min': { name: 'Minutes (min)', toBase: (v) => v * 60, fromBase: (v) => v / 60 },
    'h': { name: 'Heures (h)', toBase: (v) => v * 3600, fromBase: (v) => v / 3600 },
    'd': { name: 'Jours (j)', toBase: (v) => v * 86400, fromBase: (v) => v / 86400 },
    'w': { name: 'Semaines', toBase: (v) => v * 604800, fromBase: (v) => v / 604800 },
    'y': { name: 'Années', toBase: (v) => v * 31536000, fromBase: (v) => v / 31536000 }
  },
  pressure: {
    'Pa': { name: 'Pascal (Pa)', toBase: (v) => v, fromBase: (v) => v },
    'hPa': { name: 'Hectopascal (hPa)', toBase: (v) => v * 100, fromBase: (v) => v / 100 },
    'bar': { name: 'Bar', toBase: (v) => v * 100000, fromBase: (v) => v / 100000 },
    'psi': { name: 'PSI', toBase: (v) => v * 6894.76, fromBase: (v) => v / 6894.76 },
    'atm': { name: 'Atmosphère', toBase: (v) => v * 101325, fromBase: (v) => v / 101325 }
  },
  energy: {
    'J': { name: 'Joule (J)', toBase: (v) => v, fromBase: (v) => v },
    'kJ': { name: 'Kilojoule (kJ)', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
    'cal': { name: 'Calorie (cal)', toBase: (v) => v * 4.184, fromBase: (v) => v / 4.184 },
    'kcal': { name: 'Kilocalorie (kcal)', toBase: (v) => v * 4184, fromBase: (v) => v / 4184 },
    'Wh': { name: 'Watt-heure (Wh)', toBase: (v) => v * 3600, fromBase: (v) => v / 3600 },
    'kWh': { name: 'Kilowatt-heure (kWh)', toBase: (v) => v * 3600000, fromBase: (v) => v / 3600000 }
  }
};

const CATEGORIES_MAP = [
  { id: 'length', name: 'Longueur' },
  { id: 'weight', name: 'Poids' },
  { id: 'temperature', name: 'Température' },
  { id: 'area', name: 'Surface' },
  { id: 'volume', name: 'Volume' },
  { id: 'digital', name: 'Digital' },
  { id: 'speed', name: 'Vitesse' },
  { id: 'time', name: 'Temps' },
  { id: 'pressure', name: 'Pression' },
  { id: 'energy', name: 'Énergie' }
];

export function UnitConverter() {
  const [category, setCategory] = useState<ConversionCategory>('length');
  const [fromUnit, setFromUnit] = useState('m');
  const [toUnit, setToUnit] = useState('km');
  const [fromValue, setFromValue] = useState('1');
  const [toValue, setToValue] = useState('0.001');
  const [copied, setCopied] = useState(false);

  const convert = (value: string, from: string, to: string, cat: ConversionCategory) => {
    const num = parseFloat(value);
    if (isNaN(num)) return '0';
    const baseValue = CONVERSIONS[cat][from].toBase(num);
    const result = CONVERSIONS[cat][to].fromBase(baseValue);
    return result.toFixed(6).replace(/\.?0+$/, '');
  };

  const handleCategoryChange = (newCategory: ConversionCategory) => {
    setCategory(newCategory);
    const units = Object.keys(CONVERSIONS[newCategory]);
    setFromUnit(units[0]);
    setToUnit(units[1]);
    setToValue(convert(fromValue, units[0], units[1], newCategory));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(toValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setFromValue('');
    setToValue('0');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      {/* Category Nav - Scrollable on mobile */}
      <div className="sticky top-0 z-10 bg-white dark:bg-slate-950/80 backdrop-blur-sm py-2 md:py-4 -mx-8 md:-mx-12 px-10 md:px-14 border-b border-slate-100 dark:border-slate-800 md:border-none md:bg-transparent md:static">
        <div className="flex gap-2 overflow-x-auto no-scrollbar justify-start md:justify-center">
          {CATEGORIES_MAP.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id as ConversionCategory)}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all border whitespace-nowrap ${
                category === cat.id
                  ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-950 dark:border-white shadow-lg shadow-indigo-500/10'
                  : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-slate-300'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* De */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400">De</label>
            <button
              onClick={handleClear}
              className="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3 h-3" /> Effacer
            </button>
          </div>
          <div className="flex flex-col gap-3 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
            <input
              type="number"
              value={fromValue}
              onChange={(e) => {
                setFromValue(e.target.value);
                setToValue(convert(e.target.value, fromUnit, toUnit, category));
              }}
              className="bg-transparent text-4xl font-black font-mono outline-none dark:text-white"
              placeholder="0"
            />
            <select
              value={fromUnit}
              onChange={(e) => {
                setFromUnit(e.target.value);
                setToValue(convert(fromValue, e.target.value, toUnit, category));
              }}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 font-bold text-sm outline-none cursor-pointer"
            >
              {Object.entries(CONVERSIONS[category]).map(([key, unit]) => (
                <option key={key} value={key}>{unit.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="hidden md:flex justify-center pt-8">
           <div className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-indigo-600/20 -rotate-90">
             <ArrowDown className="w-6 h-6" />
           </div>
        </div>
        <div className="md:hidden flex justify-center">
           <div className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-indigo-600/20">
             <ArrowDown className="w-5 h-5" />
           </div>
        </div>

        {/* Vers */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400">Vers</label>
            <button
              onClick={handleCopy}
              className={`text-xs font-bold flex items-center gap-1 transition-colors ${copied ? 'text-emerald-500' : 'text-indigo-500 hover:text-indigo-600'}`}
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copié' : 'Copier'}
            </button>
          </div>
          <div className="flex flex-col gap-3 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800 transition-all">
            <input
              type="text"
              value={toValue}
              readOnly
              className="bg-transparent text-4xl font-black font-mono outline-none text-indigo-600 dark:text-indigo-400"
            />
            <select
              value={toUnit}
              onChange={(e) => {
                setToUnit(e.target.value);
                setToValue(convert(fromValue, fromUnit, e.target.value, category));
              }}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 font-bold text-sm outline-none cursor-pointer"
            >
              {Object.entries(CONVERSIONS[category]).map(([key, unit]) => (
                <option key={key} value={key}>{unit.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
