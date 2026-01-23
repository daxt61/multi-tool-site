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
      'mph': { name: 'Miles par heure', toBase: (v) => v * 0.44704, fromBase: (v) => v / 0.44704 },
      'kn': { name: 'Noeuds', toBase: (v) => v * 0.514444, fromBase: (v) => v / 0.514444 },
      'ft/s': { name: 'Pieds par seconde', toBase: (v) => v * 0.3048, fromBase: (v) => v / 0.3048 }
    },
    pressure: {
      'Pa': { name: 'Pascal (Pa)', toBase: (v) => v, fromBase: (v) => v },
      'bar': { name: 'Bar', toBase: (v) => v * 100000, fromBase: (v) => v / 100000 },
      'psi': { name: 'PSI', toBase: (v) => v * 6894.76, fromBase: (v) => v / 6894.76 },
      'atm': { name: 'Atmosphère', toBase: (v) => v * 101325, fromBase: (v) => v / 101325 },
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
        {[
          { id: 'length', name: 'Longueur' },
          { id: 'weight', name: 'Poids' },
          { id: 'temperature', name: 'Température' },
          { id: 'area', name: 'Surface' },
          { id: 'volume', name: 'Volume' },
          { id: 'digital', name: 'Informatique' },
          { id: 'speed', name: 'Vitesse' },
          { id: 'pressure', name: 'Pression' }
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleCategoryChange(cat.id as ConversionCategory)}
            className={`flex-1 min-w-[120px] py-3 rounded-lg font-semibold transition-all ${
              category === cat.id
                ? 'bg-blue-500 text-white shadow-md scale-105'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200 shadow-sm'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* From */}
      <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 shadow-inner mb-4">
        <label className="block text-sm font-bold text-gray-700 mb-2">De</label>
        <div className="flex gap-3">
          <input
            type="number"
            value={fromValue}
            onChange={(e) => handleFromValueChange(e.target.value)}
            className="flex-1 p-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            placeholder="Valeur"
          />
          <select
            value={fromUnit}
            onChange={(e) => handleFromUnitChange(e.target.value)}
            className="p-3 border border-gray-300 rounded-lg bg-white font-semibold text-gray-700 outline-none"
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
      <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 shadow-inner">
        <label className="block text-sm font-bold text-gray-700 mb-2">Vers</label>
        <div className="flex gap-3">
          <input
            type="text"
            value={toValue}
            readOnly
            className="flex-1 p-3 border border-gray-300 rounded-lg text-lg bg-white font-mono text-blue-600 font-bold"
          />
          <select
            value={toUnit}
            onChange={(e) => handleToUnitChange(e.target.value)}
            className="p-3 border border-gray-300 rounded-lg bg-white font-semibold text-gray-700 outline-none"
          >
            {Object.entries(conversions[category]).map(([key, unit]) => (
              <option key={key} value={key}>
                {unit.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* SEO Content Section */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-gray-200 pt-12 text-left">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Un convertisseur d'unités complet et gratuit</h2>
          <p className="text-gray-600 mb-4">
            Besoin de convertir des mètres en miles, des kilogrammes en livres ou des Celsius en Fahrenheit ? Notre convertisseur universel prend en charge les catégories les plus courantes : Longueur, Poids, Température, Surface, Volume, Informatique, Vitesse et Pression.
          </p>
          <p className="text-gray-600">
            C'est l'outil idéal pour les voyageurs, les étudiants, les cuisiniers ou toute personne travaillant avec des systèmes de mesure différents (métrique vs impérial).
          </p>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Pourquoi la précision est importante ?</h2>
          <p className="text-gray-600 mb-4">
            Dans de nombreux domaines comme la science, l'ingénierie ou même la cuisine, une erreur de conversion peut avoir des conséquences importantes. Notre outil utilise des facteurs de conversion précis et mis à jour.
          </p>
          <ul className="list-disc pl-5 text-gray-600 space-y-2">
            <li><strong>Facilité d'utilisation :</strong> Sélectionnez simplement la catégorie, entrez la valeur et choisissez les unités.</li>
            <li><strong>Résultats instantanés :</strong> Pas besoin de cliquer sur "calculer", la conversion se fait en temps réel.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
