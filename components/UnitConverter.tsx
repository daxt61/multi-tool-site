import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Copy, Check, Trash2, ArrowUpDown, Info, Ruler, Download, Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type ConversionCategory = 'length' | 'weight' | 'temperature' | 'area' | 'volume' | 'digital' | 'digital_si' | 'pressure' | 'energy' | 'speed' | 'time' | 'power' | 'frequency' | 'consumption' | 'angle' | 'torque' | 'force' | 'datarate' | 'illuminance' | 'luminance' | 'radiation' | 'magnetic' | 'acceleration' | 'density' | 'voltage' | 'current' | 'resistance' | 'capacitance' | 'typography' | 'cooking' | 'radioactivity' | 'charge' | 'magnetic_flux' | 'mass_flow' | 'luminous_flux' | 'luminous_intensity' | 'thermal_conductivity' | 'dynamic_viscosity' | 'kinematic_viscosity';

interface ConversionUnit {
  name: string;
  toBase: (value: number) => number;
  fromBase: (value: number) => number;
}

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
    'cup': { name: 'Tasses (US)', toBase: (v) => v * 0.000236588, fromBase: (v) => v / 0.000236588 },
    'tbsp': { name: 'Cuillères à soupe (15ml)', toBase: (v) => v * 0.000015, fromBase: (v) => v / 0.000015 },
    'tsp': { name: 'Cuillères à café (5ml)', toBase: (v) => v * 0.000005, fromBase: (v) => v / 0.000005 }
  },
  digital: {
    'bit': { name: 'Bits (bit)', toBase: (v) => v / 8, fromBase: (v) => v * 8 },
    'Kbit': { name: 'Kilobits (Kbit)', toBase: (v) => (v * 1024) / 8, fromBase: (v) => (v * 8) / 1024 },
    'Mbit': { name: 'Mégabits (Mbit)', toBase: (v) => (v * Math.pow(1024, 2)) / 8, fromBase: (v) => (v * 8) / Math.pow(1024, 2) },
    'Gbit': { name: 'Gigabits (Gbit)', toBase: (v) => (v * Math.pow(1024, 3)) / 8, fromBase: (v) => (v * 8) / Math.pow(1024, 3) },
    'Tbit': { name: 'Térabits (Tbit)', toBase: (v) => (v * Math.pow(1024, 4)) / 8, fromBase: (v) => (v * 8) / Math.pow(1024, 4) },
    'B': { name: 'Octets (B)', toBase: (v) => v, fromBase: (v) => v },
    'KB': { name: 'Kilooctets (KB)', toBase: (v) => v * 1024, fromBase: (v) => v / 1024 },
    'MB': { name: 'Megaoctets (MB)', toBase: (v) => v * Math.pow(1024, 2), fromBase: (v) => v / Math.pow(1024, 2) },
    'GB': { name: 'Gigaoctets (GB)', toBase: (v) => v * Math.pow(1024, 3), fromBase: (v) => v / Math.pow(1024, 3) },
    'TB': { name: 'Teraoctets (TB)', toBase: (v) => v * Math.pow(1024, 4), fromBase: (v) => v / Math.pow(1024, 4) },
    'PB': { name: 'Pétaoctets (PB)', toBase: (v) => v * Math.pow(1024, 5), fromBase: (v) => v / Math.pow(1024, 5) }
  },
  torque: {
    'Nm': { name: 'Newton-mètre (Nm)', toBase: (v) => v, fromBase: (v) => v },
    'lb-ft': { name: 'Livre-force pied (lb-ft)', toBase: (v) => v * 1.355818, fromBase: (v) => v / 1.355818 },
    'lb-in': { name: 'Livre-force pouce (lb-in)', toBase: (v) => v * 0.112985, fromBase: (v) => v / 0.112985 },
    'oz-in': { name: 'Once-force pouce (oz-in)', toBase: (v) => v * 0.00706155, fromBase: (v) => v / 0.00706155 },
    'kgm': { name: 'Kilogramme-mètre (kgm)', toBase: (v) => v * 9.80665, fromBase: (v) => v / 9.80665 }
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
  },
  power: {
    'W': { name: 'Watt (W)', toBase: (v) => v, fromBase: (v) => v },
    'kW': { name: 'Kilowatt (kW)', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
    'MW': { name: 'Mégawatt (MW)', toBase: (v) => v * 1000000, fromBase: (v) => v / 1000000 },
    'hp': { name: 'Chevaux (hp)', toBase: (v) => v * 745.7, fromBase: (v) => v / 745.7 },
  },
  frequency: {
    'Hz': { name: 'Hertz (Hz)', toBase: (v) => v, fromBase: (v) => v },
    'kHz': { name: 'Kilohertz (kHz)', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
    'MHz': { name: 'Mégahertz (MHz)', toBase: (v) => v * 1000000, fromBase: (v) => v / 1000000 },
    'GHz': { name: 'Gigahertz (GHz)', toBase: (v) => v * 1000000000, fromBase: (v) => v / 1000000000 },
    'THz': { name: 'Térahertz (THz)', toBase: (v) => v * 1000000000000, fromBase: (v) => v / 1000000000000 },
  },
  consumption: {
    'l/100km': { name: 'L/100km', toBase: (v) => v, fromBase: (v) => v },
    'mpg_us': { name: 'MPG (US)', toBase: (v) => v === 0 ? 0 : 235.215 / v, fromBase: (v) => v === 0 ? 0 : 235.215 / v },
    'mpg_uk': { name: 'MPG (UK)', toBase: (v) => v === 0 ? 0 : 282.481 / v, fromBase: (v) => v === 0 ? 0 : 282.481 / v },
    'km/l': { name: 'km/L', toBase: (v) => v === 0 ? 0 : 100 / v, fromBase: (v) => v === 0 ? 0 : 100 / v },
  },
  angle: {
    'deg': { name: 'Degrés', toBase: (v) => v, fromBase: (v) => v },
    'rad': { name: 'Radians', toBase: (v) => v * (180 / Math.PI), fromBase: (v) => v * (Math.PI / 180) },
    'grad': { name: 'Grades', toBase: (v) => v * (9 / 10), fromBase: (v) => v * (10 / 9) },
    'tr': { name: 'Tours', toBase: (v) => v * 360, fromBase: (v) => v / 360 }
  },
  force: {
    'N': { name: 'Newton (N)', toBase: (v) => v, fromBase: (v) => v },
    'kN': { name: 'Kilonewton (kN)', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
    'gf': { name: 'Gramme-force (gf)', toBase: (v) => v * 0.00980665, fromBase: (v) => v / 0.00980665 },
    'kgf': { name: 'Kilogramme-force (kgf)', toBase: (v) => v * 9.80665, fromBase: (v) => v / 9.80665 },
    'lbf': { name: 'Pound-force (lbf)', toBase: (v) => v * 4.448222, fromBase: (v) => v / 4.448222 },
    'dyne': { name: 'Dyne (dyn)', toBase: (v) => v / 100000, fromBase: (v) => v * 100000 },
    'pdl': { name: 'Poundal (pdl)', toBase: (v) => v * 0.138255, fromBase: (v) => v / 0.138255 }
  },
  datarate: {
    'bps': { name: 'bps (bit/s)', toBase: (v) => v, fromBase: (v) => v },
    'kbps': { name: 'kbps (kbit/s)', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
    'Mbps': { name: 'Mbps (Mbit/s)', toBase: (v) => v * 1000000, fromBase: (v) => v / 1000000 },
    'Gbps': { name: 'Gbps (Gbit/s)', toBase: (v) => v * 1000000000, fromBase: (v) => v / 1000000000 },
    'Tbps': { name: 'Tbps (Tbit/s)', toBase: (v) => v * 1000000000000, fromBase: (v) => v / 1000000000000 }
  },
  illuminance: {
    'lx': { name: 'Lux (lx)', toBase: (v) => v, fromBase: (v) => v },
    'fc': { name: 'Foot-candle (fc)', toBase: (v) => v * 10.76391, fromBase: (v) => v / 10.76391 },
    'ph': { name: 'Phot (ph)', toBase: (v) => v * 10000, fromBase: (v) => v / 10000 }
  },
  luminance: {
    'cd/m2': { name: 'Candela par m² (cd/m²)', toBase: (v) => v, fromBase: (v) => v },
    'fl': { name: 'Foot-lambert (fL)', toBase: (v) => v * 3.426259, fromBase: (v) => v / 3.426259 },
    'sb': { name: 'Stilb (sb)', toBase: (v) => v * 10000, fromBase: (v) => v / 10000 }
  },
  radiation: {
    'Gy': { name: 'Gray (Gy)', toBase: (v) => v, fromBase: (v) => v },
    'Sv': { name: 'Sievert (Sv)', toBase: (v) => v, fromBase: (v) => v },
    'rad': { name: 'Rad', toBase: (v) => v * 0.01, fromBase: (v) => v / 0.01 },
    'rem': { name: 'Rem', toBase: (v) => v * 0.01, fromBase: (v) => v / 0.01 }
  },
  magnetic: {
    'T': { name: 'Tesla (T)', toBase: (v) => v, fromBase: (v) => v },
    'G': { name: 'Gauss (G)', toBase: (v) => v / 10000, fromBase: (v) => v * 10000 }
  },
  acceleration: {
    'm/s2': { name: 'Mètres par seconde² (m/s²)', toBase: (v) => v, fromBase: (v) => v },
    'g': { name: 'Gravité terrestre (g)', toBase: (v) => v * 9.80665, fromBase: (v) => v / 9.80665 },
    'ft/s2': { name: 'Pieds par seconde² (ft/s²)', toBase: (v) => v * 0.3048, fromBase: (v) => v / 0.3048 }
  },
  density: {
    'kg/m3': { name: 'Kilogrammes par m³', toBase: (v) => v, fromBase: (v) => v },
    'g/cm3': { name: 'Grammes par cm³', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
    'lb/ft3': { name: 'Livres par pied³', toBase: (v) => v * 16.0185, fromBase: (v) => v / 16.0185 }
  },
  voltage: {
    'V': { name: 'Volt (V)', toBase: (v) => v, fromBase: (v) => v },
    'mV': { name: 'Millivolt (mV)', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
    'kV': { name: 'Kilovolt (kV)', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
    'MV': { name: 'Mégavolt (MV)', toBase: (v) => v * 1000000, fromBase: (v) => v / 1000000 }
  },
  current: {
    'A': { name: 'Ampère (A)', toBase: (v) => v, fromBase: (v) => v },
    'mA': { name: 'Milliampère (mA)', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
    'kA': { name: 'Kiloampère (kA)', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
    'uA': { name: 'Microampère (µA)', toBase: (v) => v / 1000000, fromBase: (v) => v * 1000000 }
  },
  resistance: {
    'ohm': { name: 'Ohm (Ω)', toBase: (v) => v, fromBase: (v) => v },
    'mohm': { name: 'Milliohm (mΩ)', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
    'kohm': { name: 'Kilohm (kΩ)', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
    'Mohm': { name: 'Mégohm (MΩ)', toBase: (v) => v * 1000000, fromBase: (v) => v / 1000000 }
  },
  capacitance: {
    'F': { name: 'Farad (F)', toBase: (v) => v, fromBase: (v) => v },
    'mF': { name: 'Millifarad (mF)', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
    'uF': { name: 'Microfarad (µF)', toBase: (v) => v / 1000000, fromBase: (v) => v * 1000000 },
    'nF': { name: 'Nanofarad (nF)', toBase: (v) => v / 1000000000, fromBase: (v) => v * 1000000000 },
    'pF': { name: 'Picofarad (pF)', toBase: (v) => v / 1000000000000, fromBase: (v) => v * 1000000000000 }
  },
  digital_si: {
    'bit': { name: 'Bits (bit)', toBase: (v) => v / 8, fromBase: (v) => v * 8 },
    'kb': { name: 'Kilobits (kb)', toBase: (v) => (v * 1000) / 8, fromBase: (v) => (v * 8) / 1000 },
    'Mb': { name: 'Mégabits (Mb)', toBase: (v) => (v * 1000000) / 8, fromBase: (v) => (v * 8) / 1000000 },
    'Gb': { name: 'Gigabits (Gb)', toBase: (v) => (v * 1000000000) / 8, fromBase: (v) => (v * 8) / 1000000000 },
    'B': { name: 'Octets (B)', toBase: (v) => v, fromBase: (v) => v },
    'KB': { name: 'Kilooctets (KB)', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
    'MB': { name: 'Megaoctets (MB)', toBase: (v) => v * 1000000, fromBase: (v) => v / 1000000 },
    'GB': { name: 'Gigaoctets (GB)', toBase: (v) => v * 1000000000, fromBase: (v) => v / 1000000000 },
    'TB': { name: 'Teraoctets (TB)', toBase: (v) => v * 1000000000000, fromBase: (v) => v / 1000000000000 }
  },
  typography: {
    'pt': { name: 'Point (pt)', toBase: (v) => v, fromBase: (v) => v },
    'pc': { name: 'Pica (pc)', toBase: (v) => v * 12, fromBase: (v) => v / 12 },
    'in': { name: 'Pouce (in)', toBase: (v) => v * 72, fromBase: (v) => v / 72 },
    'cm': { name: 'Centimètre (cm)', toBase: (v) => v * 28.3465, fromBase: (v) => v / 28.3465 },
    'mm': { name: 'Millimètre (mm)', toBase: (v) => v * 2.83465, fromBase: (v) => v / 2.83465 },
    'px': { name: 'Pixel (px)', toBase: (v) => v * 0.75, fromBase: (v) => v / 0.75 },
    'agate': { name: 'Agate', toBase: (v) => v * 5.1428, fromBase: (v) => v / 5.1428 },
    'didot': { name: 'Point Didot', toBase: (v) => v * 1.066, fromBase: (v) => v / 1.066 }
  },
  cooking: {
    'ml': { name: 'Millilitres', toBase: (v) => v, fromBase: (v) => v },
    'l': { name: 'Litres', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
    'tsp': { name: 'Cuillère à café (5ml)', toBase: (v) => v * 5, fromBase: (v) => v / 5 },
    'tbsp': { name: 'Cuillère à soupe (15ml)', toBase: (v) => v * 15, fromBase: (v) => v / 15 },
    'cup': { name: 'Tasse (US - 236.5ml)', toBase: (v) => v * 236.588, fromBase: (v) => v / 236.588 },
    'cup_fr': { name: 'Tasse (Métrique - 250ml)', toBase: (v) => v * 250, fromBase: (v) => v / 250 },
    'glass': { name: 'Verre (200ml)', toBase: (v) => v * 200, fromBase: (v) => v / 200 },
    'pinch': { name: 'Pincée (0.5ml)', toBase: (v) => v * 0.5, fromBase: (v) => v / 0.5 }
  },
  radioactivity: {
    'Bq': { name: 'Becquerel (Bq)', toBase: (v) => v, fromBase: (v) => v },
    'Ci': { name: 'Curie (Ci)', toBase: (v) => v * 3.7e10, fromBase: (v) => v / 3.7e10 },
    'Rd': { name: 'Rutherford (Rd)', toBase: (v) => v * 1e6, fromBase: (v) => v / 1e6 }
  },
  charge: {
    'C': { name: 'Coulomb (C)', toBase: (v) => v, fromBase: (v) => v },
    'mC': { name: 'Millicoulomb (mC)', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
    'uC': { name: 'Microcoulomb (µC)', toBase: (v) => v / 1000000, fromBase: (v) => v * 1000000 },
    'nC': { name: 'Nanocoulomb (nC)', toBase: (v) => v / 1000000000, fromBase: (v) => v * 1000000000 },
    'Ah': { name: 'Ampere-heure (Ah)', toBase: (v) => v * 3600, fromBase: (v) => v / 3600 },
    'mAh': { name: 'Milliampere-heure (mAh)', toBase: (v) => v * 3.6, fromBase: (v) => v / 3.6 }
  },
  magnetic_flux: {
    'Wb': { name: 'Weber (Wb)', toBase: (v) => v, fromBase: (v) => v },
    'mWb': { name: 'Milliweber (mWb)', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
    'uWb': { name: 'Microweber (µWb)', toBase: (v) => v / 1000000, fromBase: (v) => v * 1000000 },
    'Mx': { name: 'Maxwell (Mx)', toBase: (v) => v / 100000000, fromBase: (v) => v * 100000000 }
  },
  mass_flow: {
    'kg/s': { name: 'Kilogrammes par seconde', toBase: (v) => v, fromBase: (v) => v },
    'kg/h': { name: 'Kilogrammes par heure', toBase: (v) => v / 3600, fromBase: (v) => v * 3600 },
    'lb/s': { name: 'Livres par seconde', toBase: (v) => v * 0.453592, fromBase: (v) => v / 0.453592 },
    'lb/h': { name: 'Livres par heure', toBase: (v) => (v * 0.453592) / 3600, fromBase: (v) => (v / 0.453592) * 3600 }
  },
  luminous_flux: {
    'lm': { name: 'Lumen (lm)', toBase: (v) => v, fromBase: (v) => v },
    'cd_sr': { name: 'Candela-stéradian (cd·sr)', toBase: (v) => v, fromBase: (v) => v }
  },
  luminous_intensity: {
    'cd': { name: 'Candela (cd)', toBase: (v) => v, fromBase: (v) => v },
    'cp': { name: 'Candlepower (cp)', toBase: (v) => v * 0.981, fromBase: (v) => v / 0.981 }
  },
  thermal_conductivity: {
    'W/mK': { name: 'Watt par mètre-kelvin', toBase: (v) => v, fromBase: (v) => v },
    'cal/smC': { name: 'Calorie par sec-mètre-°C', toBase: (v) => v * 418.4, fromBase: (v) => v / 418.4 },
    'BTU/hftF': { name: 'BTU par heure-pied-°F', toBase: (v) => v * 1.730735, fromBase: (v) => v / 1.730735 }
  },
  dynamic_viscosity: {
    'Pas': { name: 'Pascal-seconde', toBase: (v) => v, fromBase: (v) => v },
    'P': { name: 'Poise', toBase: (v) => v * 0.1, fromBase: (v) => v / 0.1 },
    'cP': { name: 'Centipoise', toBase: (v) => v * 0.001, fromBase: (v) => v / 0.001 },
    'lb/fts': { name: 'Livre par pied-seconde', toBase: (v) => v * 1.488164, fromBase: (v) => v / 1.488164 }
  },
  kinematic_viscosity: {
    'm2/s': { name: 'Mètre carré par seconde', toBase: (v) => v, fromBase: (v) => v },
    'St': { name: 'Stokes', toBase: (v) => v * 0.0001, fromBase: (v) => v / 0.0001 },
    'cSt': { name: 'Centistokes', toBase: (v) => v * 0.000001, fromBase: (v) => v / 0.000001 },
    'ft2/s': { name: 'Pied carré par seconde', toBase: (v) => v * 0.092903, fromBase: (v) => v / 0.092903 }
  }
};

const CATEGORIES_IDS: ConversionCategory[] = [
  'length', 'weight', 'temperature', 'area', 'volume', 'digital', 'digital_si', 'speed', 'time', 'pressure', 'energy', 'power', 'frequency', 'consumption', 'angle', 'torque', 'force', 'datarate', 'illuminance', 'luminance', 'radiation', 'magnetic', 'acceleration', 'density', 'voltage', 'current', 'resistance', 'capacitance', 'typography', 'cooking', 'radioactivity', 'charge', 'magnetic_flux', 'mass_flow', 'luminous_flux', 'luminous_intensity', 'thermal_conductivity', 'dynamic_viscosity', 'kinematic_viscosity'
];

const convert = (value: string, from: string, to: string, cat: ConversionCategory) => {
  const num = parseFloat(value);
  if (isNaN(num)) return 0;
  const baseValue = CONVERSIONS[cat][from].toBase(num);
  const result = CONVERSIONS[cat][to].fromBase(baseValue);
  return result;
};

export function UnitConverter({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const fromValueRef = useRef<HTMLInputElement>(null);
  const categorySearchInputRef = useRef<HTMLInputElement>(null);
  const { t, i18n } = useTranslation();

  const formatter = useMemo(() => new Intl.NumberFormat(i18n.language === 'en' ? 'en-US' : 'fr-FR', {
    maximumFractionDigits: 10,
    minimumFractionDigits: 0,
  }), [i18n.language]);

  const categoriesMap = useMemo(() => CATEGORIES_IDS.map(id => ({
    id,
    name: t(`unit.${id}`)
  })), [t]);

  const [category, setCategory] = useState<ConversionCategory>(initialData?.category || 'length');
  const [fromUnit, setFromUnit] = useState(initialData?.fromUnit || 'm');
  const [toUnit, setToUnit] = useState(initialData?.toUnit || 'km');
  const [fromValue, setFromValue] = useState(initialData?.fromValue || '1');
  const [toValue, setToValue] = useState(initialData?.toValue || 0.001);
  const [categorySearch, setCategorySearch] = useState('');
  const [copied, setCopied] = useState(false);

  const filteredCategories = useMemo(() => {
    if (!categorySearch.trim()) return categoriesMap;
    const query = categorySearch.toLowerCase().trim();
    return categoriesMap.filter(cat => cat.name.toLowerCase().includes(query));
  }, [categorySearch, categoriesMap]);

  useEffect(() => {
    onStateChange?.({ category, fromUnit, toUnit, fromValue, toValue });
  }, [category, fromUnit, toUnit, fromValue, toValue]);

  const handleDownload = () => {
    if (!fromValue) return;
    const content = `${fromValue} ${t(`unit.symbol.${category}.${fromUnit}`, CONVERSIONS[category][fromUnit].name)} = ${formatter.format(toValue)} ${t(`unit.symbol.${category}.${toUnit}`, CONVERSIONS[category][toUnit].name)}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `conversion-${category}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCategoryChange = (newCategory: ConversionCategory) => {
    setCategory(newCategory);
    const units = Object.keys(CONVERSIONS[newCategory]);
    setFromUnit(units[0]);
    setToUnit(units[1]);
    setToValue(convert(fromValue, units[0], units[1], newCategory));
  };

  const handleCopy = useCallback(() => {
    if (!fromValue) return;
    navigator.clipboard.writeText(String(toValue));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [toValue, fromValue]);

  const handleClear = useCallback(() => {
    setFromValue('');
    setToValue(0);
    setTimeout(() => fromValueRef.current?.focus(), 0);
  }, []);

  const handleSwap = useCallback(() => {
    const newFromUnit = toUnit;
    const newToUnit = fromUnit;
    const newFromValue = toValue.toString();

    setFromUnit(newFromUnit);
    setToUnit(newToUnit);
    setFromValue(newFromValue);
    setToValue(convert(newFromValue, newFromUnit, newToUnit, category));
  }, [fromUnit, toUnit, toValue, category]);

  const handleSwapRef = useRef(handleSwap);
  const handleCopyRef = useRef(handleCopy);

  useEffect(() => {
    handleSwapRef.current = handleSwap;
    handleCopyRef.current = handleCopy;
  }, [handleSwap, handleCopy]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        document.activeElement?.tagName === "SELECT" ||
        document.activeElement?.getAttribute('contenteditable') === 'true'
      ) {
        return;
      }

      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSwapRef.current();
      } else if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handleCopyRef.current();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      {/* Category Search and Nav */}
      <div className="space-y-6">
        <div className="relative group max-w-md mx-auto">
          <label htmlFor="category-search" className="sr-only">{t('unit.search_category')}</label>
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            id="category-search"
            ref={categorySearchInputRef}
            type="text"
            autoComplete="off"
            spellCheck={false}
            placeholder={t('unit.search_category')}
            value={categorySearch}
            onChange={(e) => setCategorySearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setCategorySearch('');
                  setTimeout(() => categorySearchInputRef.current?.focus(), 0);
              } else if (e.key === 'Enter' && filteredCategories.length > 0) {
                handleCategoryChange(filteredCategories[0].id as ConversionCategory);
              }
            }}
            className="block w-full pl-11 pr-11 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-400 text-sm"
          />
          {categorySearch && (
            <button
              onClick={() => {
                setCategorySearch('');
                setTimeout(() => categorySearchInputRef.current?.focus(), 0);
              }}
              className="absolute inset-y-0 right-4 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none rounded-lg"
              aria-label={t('unit.search_clear_aria')}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="sticky top-0 z-50 bg-white dark:bg-slate-950/80 backdrop-blur-sm py-2 md:py-4 -mx-8 md:-mx-12 px-10 md:px-14 border-b border-slate-100 dark:border-slate-800 md:border-none md:bg-transparent md:static">
          <div className="flex gap-2 overflow-x-auto no-scrollbar justify-start md:justify-center">
            {filteredCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.id as ConversionCategory)}
                aria-pressed={category === cat.id}
                className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all border whitespace-nowrap focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* De */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="fromValue" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">{t('common.from')}</label>
            <div className="flex gap-2 items-center">
              <kbd className="hidden sm:inline-flex items-center justify-center px-1.5 py-0.5 border border-rose-200 dark:border-rose-800 rounded text-[10px] font-bold text-rose-400 bg-white dark:bg-slate-900">Esc</kbd>
              <button
                onClick={handleClear}
                disabled={!fromValue}
                className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
              >
                <Trash2 className="w-3 h-3" /> {t('common.clear')}
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-3 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800 focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
            <input
              id="fromValue"
              ref={fromValueRef}
              type="number"
              value={fromValue}
              onChange={(e) => {
                setFromValue(e.target.value);
                setToValue(convert(e.target.value, fromUnit, toUnit, category));
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  handleClear();
                }
              }}
              className="bg-transparent text-4xl font-black font-mono outline-none dark:text-white"
              placeholder="0"
              aria-label={t('unit.from_value_aria')}
            />
            <select
              id="fromUnit"
              value={fromUnit}
              onChange={(e) => {
                setFromUnit(e.target.value);
                setToValue(convert(fromValue, e.target.value, toUnit, category));
              }}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 font-bold text-sm outline-none cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500"
              aria-label={t('unit.from_unit_aria')}
            >
              {Object.entries(CONVERSIONS[category]).map(([key, unit]) => (
                <option key={key} value={key}>{t(`unit.symbol.${category}.${key}`, unit.name)}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center md:pt-8 gap-2">
          <button
            onClick={handleSwap}
            className="w-10 h-10 md:w-12 md:h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-indigo-600/20 transition-all hover:scale-110 active:scale-95 group focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
            aria-label={t('unit.swap_units_aria')}
          >
            <ArrowUpDown className="w-5 h-5 md:w-6 md:h-6 transition-transform group-hover:rotate-180 duration-500" />
          </button>
          <kbd className="hidden sm:inline-flex items-center justify-center w-5 h-5 border border-slate-200 dark:border-slate-800 rounded text-[10px] font-bold text-slate-400 bg-white dark:bg-slate-900">S</kbd>
        </div>

        {/* Vers */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="toUnit" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">{t('common.to')}</label>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                disabled={!fromValue}
                className="text-xs font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 px-2 py-1 rounded-lg flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
              >
                <Download className="w-3 h-3" /> {t('common.download')}
              </button>
              <button
                onClick={handleCopy}
                disabled={!fromValue}
                className={`text-xs font-bold flex items-center gap-1 px-2 py-1 rounded-lg transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${copied ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100'} disabled:opacity-50 disabled:cursor-not-allowed`}
                title={`${t('common.copy')} (C)`}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? t('common.copied') : t('common.copy')}
                {!copied && <kbd className="hidden sm:inline-flex items-center justify-center w-4 h-4 border border-indigo-200 dark:border-indigo-800 rounded text-[10px] font-bold bg-white dark:bg-slate-900 ml-0.5">C</kbd>}
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-3 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800 transition-all">
            <div className="bg-transparent text-4xl font-black font-mono outline-none text-indigo-600 dark:text-indigo-400 truncate" aria-live="polite">
              {formatter.format(toValue)}
            </div>
            <select
              id="toUnit"
              value={toUnit}
              onChange={(e) => {
                setToUnit(e.target.value);
                setToValue(convert(fromValue, fromUnit, e.target.value, category));
              }}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 font-bold text-sm outline-none cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500"
              aria-label={t('unit.to_unit_aria')}
            >
              {Object.entries(CONVERSIONS[category]).map(([key, unit]) => (
                <option key={key} value={key}>{t(`unit.symbol.${category}.${key}`, unit.name)}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Quick Conversions Grid */}
      {fromValue && !isNaN(parseFloat(fromValue)) && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-2 px-1">
            <Ruler className="w-4 h-4 text-indigo-500" />
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
              {t('unit.all_conversions', { value: fromValue, unit: CONVERSIONS[category][fromUnit].name })}
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Object.entries(CONVERSIONS[category]).map(([key, unit]) => {
              if (key === fromUnit) return null;
              const convertedValue = convert(fromValue, fromUnit, key, category);
              return (
                <button
                  key={key}
                  onClick={() => {
                    setToUnit(key);
                    setToValue(convertedValue);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-left hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/5 transition-all group"
                >
                  <div className="text-lg font-black font-mono text-indigo-600 dark:text-indigo-400 truncate group-hover:scale-105 transition-transform origin-left">
                    {formatter.format(convertedValue)}
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight truncate">
                    {t(`unit.symbol.${category}.${key}`, unit.name)}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Educational Content */}
      <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-12 pt-16 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" /> {t('unit.guide_title')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('unit.guide_text')}
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Ruler className="w-4 h-4 text-indigo-500" /> {t('unit.precision_title')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('unit.precision_text')}
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Check className="w-4 h-4 text-indigo-500" /> {t('unit.reliability_title')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('unit.reliability_text')}
          </p>
        </div>
      </div>
    </div>
  );
}
