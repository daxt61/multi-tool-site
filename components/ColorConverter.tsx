import { useState, useEffect } from 'react';
import { Copy, Check, Palette, Hash, SlidersHorizontal } from 'lucide-react';

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
    const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
    return '#' + [clamp(r), clamp(g), clamp(b)].map(x => {
      const h = x.toString(16);
      return h.length === 1 ? '0' + h : h;
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
    if (!newHex.startsWith('#') && newHex.length > 0) newHex = '#' + newHex;
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

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Main Preview Card */}
      <div
        className="w-full h-64 rounded-[2.5rem] shadow-xl relative overflow-hidden group focus-within:ring-4 focus-within:ring-indigo-500/20 transition-all border border-slate-200 dark:border-slate-800"
        style={{ backgroundColor: hex }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
        <input
          type="color"
          value={hex}
          onChange={(e) => updateFromHex(e.target.value)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer outline-none"
          title="Ouvrir le sélecteur de couleur"
        />
        <div className="absolute bottom-8 right-8 w-16 h-16 rounded-full border-4 border-white dark:border-slate-800 bg-white/10 backdrop-blur-md flex items-center justify-center text-white pointer-events-none group-hover:scale-110 transition-transform">
          <Palette className="w-8 h-8" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Color Codes */}
        <div className="lg:col-span-4 space-y-4">
          {[
            { label: 'HEX', value: hex, id: 'hex' },
            { label: 'RGB', value: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`, id: 'rgb' },
            { label: 'HSL', value: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`, id: 'hsl' },
          ].map((item) => (
            <div key={item.id} className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800 group relative">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">{item.label}</label>
              <div className="flex items-center justify-between">
                <span className="font-mono font-black text-lg truncate dark:text-white">{item.value}</span>
                <button
                  onClick={() => copyToClipboard(item.value, item.id)}
                  className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all text-slate-400 hover:text-indigo-500 shadow-sm border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                >
                  {copied === item.id ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}

          <div className="p-6 bg-indigo-600 rounded-3xl text-white space-y-2">
            <Hash className="w-5 h-5 opacity-50" />
            <h5 className="font-black text-sm uppercase tracking-wider">Note</h5>
            <p className="text-xs font-medium text-indigo-100 leading-relaxed">Cliquez sur la zone de couleur pour ouvrir le sélecteur natif de votre système.</p>
          </div>
        </div>

        {/* Sliders Area */}
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* RGB Sliders */}
          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-8 rounded-[2.5rem] space-y-8 shadow-sm">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-indigo-500" />
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">RGB</h4>
            </div>
            <div className="space-y-6">
              {[
                { label: 'Rouge', key: 'r' },
                { label: 'Vert', key: 'g' },
                { label: 'Bleu', key: 'b' },
              ].map((chan) => (
                <div key={chan.key} className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-xs font-bold text-slate-500">{chan.label}</label>
                    <span className="text-sm font-black font-mono">{rgb[chan.key as keyof typeof rgb]}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="255"
                    value={rgb[chan.key as keyof typeof rgb]}
                    onChange={(e) => updateFromRgb({ ...rgb, [chan.key]: Number(e.target.value) })}
                    className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* HSL Sliders */}
          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-8 rounded-[2.5rem] space-y-8 shadow-sm">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-indigo-500" />
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">HSL</h4>
            </div>
            <div className="space-y-6">
              {[
                { label: 'Teinte', key: 'h', max: 360, unit: '°' },
                { label: 'Saturation', key: 's', max: 100, unit: '%' },
                { label: 'Luminosité', key: 'l', max: 100, unit: '%' },
              ].map((chan) => (
                <div key={chan.key} className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-xs font-bold text-slate-500">{chan.label}</label>
                    <span className="text-sm font-black font-mono">{hsl[chan.key as keyof typeof hsl]}{chan.unit}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={chan.max}
                    value={hsl[chan.key as keyof typeof hsl]}
                    onChange={(e) => updateFromHsl({ ...hsl, [chan.key]: Number(e.target.value) })}
                    className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
