import { useState, useEffect } from 'react';
import { Copy, Check } from 'lucide-react';

export function ColorConverter() {
  const [hex, setHex] = useState('#3B82F6');
  const [rgb, setRgb] = useState({ r: 59, g: 130, b: 246 });
  const [hsl, setHsl] = useState({ h: 217, s: 91, l: 60 });
  const [copied, setCopied] = useState('');

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  const rgbToHex = (r: number, g: number, b: number) => {
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  };

  const rgbToHsl = (r: number, g: number, b: number) => {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  };

  const hslToRgb = (h: number, s: number, l: number) => {
    h /= 360;
    s /= 100;
    l /= 100;
    let r, g, b;

    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    };
  };

  const updateFromHex = (newHex: string) => {
    setHex(newHex);
    const rgbValue = hexToRgb(newHex);
    if (rgbValue) {
      setRgb(rgbValue);
      setHsl(rgbToHsl(rgbValue.r, rgbValue.g, rgbValue.b));
    }
  };

  const updateFromRgb = (newRgb: { r: number, g: number, b: number }) => {
    setRgb(newRgb);
    setHex(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
    setHsl(rgbToHsl(newRgb.r, newRgb.g, newRgb.b));
  };

  const updateFromHsl = (newHsl: { h: number, s: number, l: number }) => {
    setHsl(newHsl);
    const rgbValue = hslToRgb(newHsl.h, newHsl.s, newHsl.l);
    setRgb(rgbValue);
    setHex(rgbToHex(rgbValue.r, rgbValue.g, rgbValue.b));
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(''), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Color preview */}
      <div
        className="w-full h-48 rounded-lg mb-6 shadow-lg relative overflow-hidden focus-within:ring-4 focus-within:ring-indigo-500/20 transition-all"
        style={{ backgroundColor: hex }}
      >
        <input
          type="color"
          value={hex}
          onChange={(e) => updateFromHex(e.target.value)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer outline-none"
          title="Ouvrir le sélecteur de couleur"
          aria-label="Sélecteur de couleur"
        />
      </div>

      {/* HEX */}
      <div className="bg-gray-50 p-6 rounded-lg mb-4">
        <div className="flex items-center justify-between mb-3">
          <label className="font-semibold text-lg">HEX</label>
          <button
            onClick={() => copyToClipboard(hex, 'hex')}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            aria-label="Copier le code HEX"
          >
            {copied === 'hex' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
        <input
          type="text"
          value={hex}
          onChange={(e) => updateFromHex(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg font-mono text-lg"
        />
      </div>

      {/* RGB */}
      <div className="bg-gray-50 p-6 rounded-lg mb-4">
        <div className="flex items-center justify-between mb-3">
          <label className="font-semibold text-lg">RGB</label>
          <button
            onClick={() => copyToClipboard(`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`, 'rgb')}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            aria-label="Copier le code RGB"
          >
            {copied === 'rgb' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">R</label>
            <input
              type="number"
              min="0"
              max="255"
              value={rgb.r}
              onChange={(e) => updateFromRgb({ ...rgb, r: Number(e.target.value) })}
              className="w-full p-3 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">G</label>
            <input
              type="number"
              min="0"
              max="255"
              value={rgb.g}
              onChange={(e) => updateFromRgb({ ...rgb, g: Number(e.target.value) })}
              className="w-full p-3 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">B</label>
            <input
              type="number"
              min="0"
              max="255"
              value={rgb.b}
              onChange={(e) => updateFromRgb({ ...rgb, b: Number(e.target.value) })}
              className="w-full p-3 border border-gray-300 rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* HSL */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <label className="font-semibold text-lg">HSL</label>
          <button
            onClick={() => copyToClipboard(`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`, 'hsl')}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            aria-label="Copier le code HSL"
          >
            {copied === 'hsl' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">H (0-360)</label>
            <input
              type="number"
              min="0"
              max="360"
              value={hsl.h}
              onChange={(e) => updateFromHsl({ ...hsl, h: Number(e.target.value) })}
              className="w-full p-3 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">S (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={hsl.s}
              onChange={(e) => updateFromHsl({ ...hsl, s: Number(e.target.value) })}
              className="w-full p-3 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">L (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={hsl.l}
              onChange={(e) => updateFromHsl({ ...hsl, l: Number(e.target.value) })}
              className="w-full p-3 border border-gray-300 rounded-lg"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
