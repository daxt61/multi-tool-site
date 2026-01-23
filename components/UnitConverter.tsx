import { useState } from 'react';

type ConversionCategory = 'length' | 'weight' | 'temperature' | 'area' | 'volume' | 'digital' | 'speed' | 'pressure';

interface ConversionUnit {
  name: string;
  toBase: (value: number) => number;
  fromBase: (value: number) => number;
}

export function UnitConverter() {
  const [category, setCategory] = useState<ConversionCategory>('length');
  const [fromUnit, setFromUnit] = useState('m');
  const [toUnit, setToUnit] = useState('km');
  const [fromValue, setFromValue] = useState('1');
  const [toValue, setToValue] = useState('0.001');

  const conversions: Record<ConversionCategory, Record<string, ConversionUnit>> = {
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
      'C': {
        name: 'Celsius',
        toBase: (v) => v,
        fromBase: (v) => v
      },
      'F': {
        name: 'Fahrenheit',
        toBase: (v) => (v - 32) * 5/9,
        fromBase: (v) => (v * 9/5) + 32
      },
      'K': {
        name: 'Kelvin',
        toBase: (v) => v - 273.15,
        fromBase: (v) => v + 273.15
      }
    },
    area: {
      'm2': { name: 'Mètres carrés', toBase: (v) => v, fromBase: (v) => v },
      'km2': { name: 'Kilomètres carrés', toBase: (v) => v * 1000000, fromBase: (v) => v / 1000000 },
      'cm2': { name: 'Centimètres carrés', toBase: (v) => v / 10000, fromBase: (v) => v * 10000 },
      'mm2': { name: 'Millimètres carrés', toBase: (v) => v / 1000000, fromBase: (v) => v * 1000000 },
      'ha': { name: 'Hectares', toBase: (v) => v * 10000, fromBase: (v) => v / 10000 },
      'ac': { name: 'Acres', toBase: (v) => v * 4046.86, fromBase: (v) => v / 4046.86 },
      'ft2': { name: 'Pieds carrés', toBase: (v) => v * 0.092903, fromBase: (v) => v / 0.092903 },
      'in2': { name: 'Pouces carrés', toBase: (v) => v * 0.00064516, fromBase: (v) => v * 1550.0031 }
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
      'm/s': { name: 'Mètres par seconde', toBase: (v) => v, fromBase: (v) => v },
      'km/h': { name: 'Kilomètres par heure', toBase: (v) => v / 3.6, fromBase: (v) => v * 3.6 },
      'mph': { name: 'Miles par heure', toBase: (v) => v / 2.23694, fromBase: (v) => v * 2.23694 },
      'knot': { name: 'Nœuds', toBase: (v) => v / 1.94384, fromBase: (v) => v * 1.94384 },
      'ft/s': { name: 'Pieds par seconde', toBase: (v) => v * 0.3048, fromBase: (v) => v / 0.3048 }
    },
    pressure: {
      'Pa': { name: 'Pascal (Pa)', toBase: (v) => v, fromBase: (v) => v },
      'bar': { name: 'Bar', toBase: (v) => v * 100000, fromBase: (v) => v / 100000 },
      'psi': { name: 'PSI', toBase: (v) => v * 6894.76, fromBase: (v) => v / 6894.76 },
      'atm': { name: 'Atmosphère (atm)', toBase: (v) => v * 101325, fromBase: (v) => v / 101325 },
      'mmHg': { name: 'Millimètres de mercure', toBase: (v) => v * 133.322, fromBase: (v) => v / 133.322 }
    }
  };

  const convert = (value: string, from: string, to: string, cat: ConversionCategory) => {
    const num = parseFloat(value);
    if (isNaN(num)) return '0';
    
    const baseValue = conversions[cat][from].toBase(num);
    const result = conversions[cat][to].fromBase(baseValue);
    
    return result.toFixed(6).replace(/\.?0+$/, '');
  };

  const handleFromValueChange = (value: string) => {
    setFromValue(value);
    setToValue(convert(value, fromUnit, toUnit, category));
  };

  const handleCategoryChange = (newCategory: ConversionCategory) => {
    setCategory(newCategory);
    const units = Object.keys(conversions[newCategory]);
    setFromUnit(units[0]);
    setToUnit(units[1]);
    setFromValue('1');
    setToValue(convert('1', units[0], units[1], newCategory));
  };

  const handleFromUnitChange = (unit: string) => {
    setFromUnit(unit);
    setToValue(convert(fromValue, unit, toUnit, category));
  };

  const handleToUnitChange = (unit: string) => {
    setToUnit(unit);
    setToValue(convert(fromValue, fromUnit, unit, category));
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Category selector */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => handleCategoryChange('length')}
          className={`flex-1 min-w-[100px] py-3 rounded-lg font-semibold transition-all ${
            category === 'length'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          Longueur
        </button>
        <button
          onClick={() => handleCategoryChange('weight')}
          className={`flex-1 min-w-[100px] py-3 rounded-lg font-semibold transition-all ${
            category === 'weight'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          Poids
        </button>
        <button
          onClick={() => handleCategoryChange('temperature')}
          className={`flex-1 min-w-[100px] py-3 rounded-lg font-semibold transition-all ${
            category === 'temperature'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          Température
        </button>
        <button
          onClick={() => handleCategoryChange('area')}
          className={`flex-1 min-w-[100px] py-3 rounded-lg font-semibold transition-all ${
            category === 'area'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          Surface
        </button>
        <button
          onClick={() => handleCategoryChange('volume')}
          className={`flex-1 min-w-[100px] py-3 rounded-lg font-semibold transition-all ${
            category === 'volume'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          Volume
        </button>
        <button
          onClick={() => handleCategoryChange('digital')}
          className={`flex-1 min-w-[100px] py-3 rounded-lg font-semibold transition-all ${
            category === 'digital'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          Informatique
        </button>
        <button
          onClick={() => handleCategoryChange('speed')}
          className={`flex-1 min-w-[100px] py-3 rounded-lg font-semibold transition-all ${
            category === 'speed'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          Vitesse
        </button>
        <button
          onClick={() => handleCategoryChange('pressure')}
          className={`flex-1 min-w-[100px] py-3 rounded-lg font-semibold transition-all ${
            category === 'pressure'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          Pression
        </button>
      </div>

      {/* From */}
      <div className="bg-gray-50 p-6 rounded-lg mb-4">
        <label className="block text-sm text-gray-600 mb-2">De</label>
        <div className="flex gap-3">
          <input
            type="number"
            value={fromValue}
            onChange={(e) => handleFromValueChange(e.target.value)}
            className="flex-1 p-3 border border-gray-300 rounded-lg text-lg"
            placeholder="Valeur"
          />
          <select
            value={fromUnit}
            onChange={(e) => handleFromUnitChange(e.target.value)}
            className="p-3 border border-gray-300 rounded-lg bg-white"
          >
            {Object.entries(conversions[category]).map(([key, unit]) => (
              <option key={key} value={key}>
                {unit.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* To */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <label className="block text-sm text-gray-600 mb-2">Vers</label>
        <div className="flex gap-3">
          <input
            type="text"
            value={toValue}
            readOnly
            className="flex-1 p-3 border border-gray-300 rounded-lg text-lg bg-white"
          />
          <select
            value={toUnit}
            onChange={(e) => handleToUnitChange(e.target.value)}
            className="p-3 border border-gray-300 rounded-lg bg-white"
          >
            {Object.entries(conversions[category]).map(([key, unit]) => (
              <option key={key} value={key}>
                {unit.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
