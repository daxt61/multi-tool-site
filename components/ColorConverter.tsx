import { useState } from 'react';
import { Copy, Check, Palette, Hash, Sliders } from 'lucide-react';

export function ColorConverter() {
  const [hex, setHex] = useState('#6366f1');
  const [rgb, setRgb] = useState({ r: 99, g: 102, b: 241 });
  const [hsl, setHsl] = useState({ h: 239, s: 84, l: 67 });
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
      const hexValue = Math.max(0, Math.min(255, x)).toString(16);
      return hexValue.length === 1 ? '0' + hexValue : hexValue;
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
    if (!newHex.startsWith('#')) newHex = '#' + newHex;
    if (!/^#[0-9A-Fa-f]{0,6}$/.test(newHex)) return;

    setHex(newHex);
    if (newHex.length === 7) {
      const rgbValue = hexToRgb(newHex);
      if (rgbValue) {
        setRgb(rgbValue);
        setHsl(rgbToHsl(rgbValue.r, rgbValue.g, rgbValue.b));
      }
    }
  };

  const updateFromRgb = (newRgb: { r: number, g: number, b: number }) => {
    const r = Math.max(0, Math.min(255, newRgb.r));
    const g = Math.max(0, Math.min(255, newRgb.g));
    const b = Math.max(0, Math.min(255, newRgb.b));
    setRgb({ r, g, b });
    setHex(rgbToHex(r, g, b));
    setHsl(rgbToHsl(r, g, b));
  };

  const updateFromHsl = (newHsl: { h: number, s: number, l: number }) => {
    const h = Math.max(0, Math.min(360, newHsl.h));
    const s = Math.max(0, Math.min(100, newHsl.s));
    const l = Math.max(0, Math.min(100, newHsl.l));
    setHsl({ h, s, l });
    const rgbValue = hslToRgb(h, s, l);
    setRgb(rgbValue);
    setHex(rgbToHex(rgbValue.r, rgbValue.g, rgbValue.b));
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      {/* Visual Preview Area */}
      <div className="relative group">
        <div
          className="w-full h-64 rounded-[2.5rem] shadow-2xl shadow-indigo-500/10 transition-all duration-500 group-hover:scale-[1.01]"
          style={{ backgroundColor: hex }}
        />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
          <input
            type="color"
            value={hex}
            onChange={(e) => updateFromHex(e.target.value)}
            aria-label="Choisir une couleur"
            className="w-20 h-20 rounded-full border-4 border-white dark:border-slate-800 cursor-pointer shadow-xl overflow-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:outline-none transition-all"
          />
        </div>
      </div>

      {/* Main Formats Display */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'HEX', value: hex, id: 'hex' },
          { label: 'RGB', value: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`, id: 'rgb' },
          { label: 'HSL', value: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`, id: 'hsl' },
        ].map((format) => (
          <div key={format.id} className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">{format.label}</span>
              <button
                onClick={() => copyToClipboard(format.value, format.id)}
                className={`p-2 rounded-xl transition-all ${copied === format.id ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-indigo-500 bg-white dark:bg-slate-800 shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none'}`}
                aria-label={`Copier le code ${format.label}`}
                title="Copier"
              >
                {copied === format.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <div className="text-xl font-black font-mono truncate dark:text-white">
              {format.value}
            </div>
          </div>
        ))}
      </div>

      {/* Sliders Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* RGB Sliders */}
        <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-8 rounded-[2.5rem] space-y-8">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 px-1">
            <Sliders className="w-4 h-4" /> Composantes RGB
          </h4>
          <div className="space-y-6">
            {[
              { label: 'Rouge', key: 'r', color: 'bg-rose-500' },
              { label: 'Vert', key: 'g', color: 'bg-emerald-500' },
              { label: 'Bleu', key: 'b', color: 'bg-blue-500' },
            ].map((chan) => (
              <div key={chan.key} className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label htmlFor={`rgb-${chan.key}`} className="text-xs font-bold text-slate-500">{chan.label}</label>
                  <span className="text-sm font-black font-mono dark:text-slate-300">{rgb[chan.key as keyof typeof rgb]}</span>
                </div>
                <input
                  id={`rgb-${chan.key}`}
                  type="range"
                  min="0"
                  max="255"
                  value={rgb[chan.key as keyof typeof rgb]}
                  onChange={(e) => updateFromRgb({ ...rgb, [chan.key]: Number(e.target.value) })}
                  className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-slate-100 dark:bg-slate-800 accent-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none transition-all"
                />
              </div>
            ))}
          </div>
        </div>

        {/* HSL Sliders */}
        <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-8 rounded-[2.5rem] space-y-8">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 px-1">
            <Palette className="w-4 h-4" /> Composantes HSL
          </h4>
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label htmlFor="hsl-h" className="text-xs font-bold text-slate-500">Teinte</label>
                <span className="text-sm font-black font-mono dark:text-slate-300">{hsl.h}°</span>
              </div>
              <input
                id="hsl-h"
                type="range"
                min="0"
                max="360"
                value={hsl.h}
                onChange={(e) => updateFromHsl({ ...hsl, h: Number(e.target.value) })}
                className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-slate-100 dark:bg-slate-800 accent-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label htmlFor="hsl-s" className="text-xs font-bold text-slate-500">Saturation</label>
                <span className="text-sm font-black font-mono dark:text-slate-300">{hsl.s}%</span>
              </div>
              <input
                id="hsl-s"
                type="range"
                min="0"
                max="100"
                value={hsl.s}
                onChange={(e) => updateFromHsl({ ...hsl, s: Number(e.target.value) })}
                className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-slate-100 dark:bg-slate-800 accent-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label htmlFor="hsl-l" className="text-xs font-bold text-slate-500">Luminosité</label>
                <span className="text-sm font-black font-mono dark:text-slate-300">{hsl.l}%</span>
              </div>
              <input
                id="hsl-l"
                type="range"
                min="0"
                max="100"
                value={hsl.l}
                onChange={(e) => updateFromHsl({ ...hsl, l: Number(e.target.value) })}
                className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-slate-100 dark:bg-slate-800 accent-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none transition-all"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
