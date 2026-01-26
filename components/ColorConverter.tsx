import { useState } from 'react';
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
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Main Preview & HEX Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div
          className="lg:col-span-8 h-80 rounded-[2.5rem] shadow-xl relative overflow-hidden group border-4 border-white dark:border-slate-800 transition-all focus-within:ring-4 focus-within:ring-indigo-500/20"
          style={{ backgroundColor: hex }}
        >
          <input
            type="color"
            value={hex}
            onChange={(e) => updateFromHex(e.target.value)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            aria-label="Sélecteur de couleur"
          />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity bg-black/10">
            <div className="bg-white/90 dark:bg-slate-900/90 px-6 py-3 rounded-full shadow-xl flex items-center gap-3">
              <Palette className="w-5 h-5 text-indigo-600" />
              <span className="font-bold text-sm">Cliquer pour choisir une couleur</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 flex flex-col justify-center space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Hash className="w-3 h-3" /> Code HEX
              </label>
              <button
                onClick={() => copyToClipboard(hex, 'hex')}
                className={`p-2 rounded-xl transition-all ${copied === 'hex' ? 'bg-emerald-500 text-white' : 'hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500'}`}
              >
                {copied === 'hex' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
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

      {/* Floating Color Picker Button */}
      <input
        type="color"
        value={hex}
        onChange={(e) => updateFromHex(e.target.value)}
        className="fixed bottom-8 right-8 w-16 h-16 rounded-full border-4 border-white dark:border-slate-800 cursor-pointer shadow-xl overflow-hidden z-50 transition-transform hover:scale-110 active:scale-95"
        title="Ouvrir le sélecteur de couleur"
      />

          <div className="grid grid-cols-2 gap-4">
             <button
                onClick={() => copyToClipboard(`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`, 'rgb')}
                className="flex flex-col items-start p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl hover:border-indigo-500/50 transition-all group"
             >
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Copier RGB</span>
                <span className="text-xs font-bold font-mono truncate w-full text-slate-600 dark:text-slate-400 group-hover:text-indigo-500 transition-colors">
                  {rgb.r}, {rgb.g}, {rgb.b}
                </span>
             </button>
             <button
                onClick={() => copyToClipboard(`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`, 'hsl')}
                className="flex flex-col items-start p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl hover:border-indigo-500/50 transition-all group"
             >
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Copier HSL</span>
                <span className="text-xs font-bold font-mono truncate w-full text-slate-600 dark:text-slate-400 group-hover:text-indigo-500 transition-colors">
                  {hsl.h}°, {hsl.s}%, {hsl.l}%
                </span>
             </button>
          </div>
        </div>
      </div>

      {/* Sliders Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* RGB Sliders */}
        <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-8 rounded-[2.5rem] space-y-8">
          <div className="flex justify-between items-center px-1">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <SlidersHorizontal className="w-3 h-3" /> Composantes RGB
            </h4>
          </div>
          <div className="space-y-6">
            {[
              { label: 'Rouge', key: 'r', color: 'accent-rose-500' },
              { label: 'Vert', key: 'g', color: 'accent-emerald-500' },
              { label: 'Bleu', key: 'b', color: 'accent-blue-500' },
            ].map((chan) => (
              <div key={chan.key} className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <label className="text-sm font-bold text-slate-500 dark:text-slate-400">{chan.label}</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="255"
                      value={rgb[chan.key as keyof typeof rgb]}
                      onChange={(e) => updateFromRgb({ ...rgb, [chan.key]: Number(e.target.value) })}
                      className="w-16 p-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-center text-xs font-bold font-mono outline-none"
                    />
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="255"
                  value={rgb[chan.key as keyof typeof rgb]}
                  onChange={(e) => updateFromRgb({ ...rgb, [chan.key]: Number(e.target.value) })}
                  className={`w-full h-2 rounded-lg appearance-none cursor-pointer bg-slate-100 dark:bg-slate-800 ${chan.color}`}
                />
              </div>
            ))}
          </div>
        </div>

        {/* HSL Sliders */}
        <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-8 rounded-[2.5rem] space-y-8">
          <div className="flex justify-between items-center px-1">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <SlidersHorizontal className="w-3 h-3" /> Composantes HSL
            </h4>
          </div>
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center px-1">
                <label className="text-sm font-bold text-slate-500 dark:text-slate-400">Teinte</label>
                <span className="text-xs font-bold font-mono bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-700">{hsl.h}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="360"
                value={hsl.h}
                onChange={(e) => updateFromHsl({ ...hsl, h: Number(e.target.value) })}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-slate-100 dark:bg-slate-800 accent-indigo-500"
              />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center px-1">
                <label className="text-sm font-bold text-slate-500 dark:text-slate-400">Saturation</label>
                <span className="text-xs font-bold font-mono bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-700">{hsl.s}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={hsl.s}
                onChange={(e) => updateFromHsl({ ...hsl, s: Number(e.target.value) })}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-slate-100 dark:bg-slate-800 accent-indigo-500"
              />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center px-1">
                <label className="text-sm font-bold text-slate-500 dark:text-slate-400">Luminosité</label>
                <span className="text-xs font-bold font-mono bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-700">{hsl.l}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={hsl.l}
                onChange={(e) => updateFromHsl({ ...hsl, l: Number(e.target.value) })}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-slate-100 dark:bg-slate-800 accent-indigo-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
