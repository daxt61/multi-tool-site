import { useState, useEffect } from 'react';
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
    if (!newHex.startsWith('#')) newHex = '#' + newHex;
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
    <div className="max-w-5xl mx-auto space-y-12">
      {/* Visual Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 relative group">
          <div
            className="w-full h-[300px] lg:h-full min-h-[300px] rounded-[2.5rem] shadow-2xl transition-all duration-500 group-hover:scale-[1.01]"
            style={{ backgroundColor: hex }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-[2.5rem]"></div>
            <input
              type="color"
              value={hex}
              onChange={(e) => updateFromHex(e.target.value)}
              className="absolute bottom-8 right-8 w-16 h-16 rounded-full border-4 border-white dark:border-slate-800 cursor-pointer shadow-xl overflow-hidden"
            />
          </div>
        </div>

        <div className="lg:col-span-5 space-y-4">
          {[
            { id: 'hex', label: 'HEX', value: hex.toUpperCase(), icon: <Hash className="w-4 h-4" /> },
            { id: 'rgb', label: 'RGB', value: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`, icon: <Palette className="w-4 h-4" /> },
            { id: 'hsl', label: 'HSL', value: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`, icon: <Sliders className="w-4 h-4" /> },
          ].map((item) => (
            <div key={item.id} className="p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-3 group transition-all hover:border-indigo-500/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-400 group-hover:text-indigo-500 transition-colors">
                  {item.icon}
                  <span className="text-xs font-black uppercase tracking-widest">{item.label}</span>
                </div>
                <button
                  onClick={() => copyToClipboard(item.value, item.id)}
                  className={`p-2 rounded-xl transition-all ${copied === item.id ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-slate-600 shadow-sm border border-transparent hover:border-slate-100 dark:hover:border-slate-700'}`}
                >
                  {copied === item.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <div className="text-2xl font-black font-mono dark:text-slate-200">
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Inputs Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* RGB Sliders */}
        <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-8 rounded-[2.5rem] space-y-8">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Composantes RGB</h4>
          <div className="space-y-6">
            {[
              { label: 'Rouge', key: 'r', color: 'bg-rose-500' },
              { label: 'Vert', key: 'g', color: 'bg-emerald-500' },
              { label: 'Bleu', key: 'b', color: 'bg-blue-500' },
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
                  className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-slate-100 dark:bg-slate-800 accent-indigo-600`}
                />
              </div>
            ))}
          </div>
        </div>

        {/* HSL Sliders */}
        <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-8 rounded-[2.5rem] space-y-8">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Composantes HSL</h4>
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-xs font-bold text-slate-500">Teinte</label>
                <span className="text-sm font-black font-mono">{hsl.h}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="360"
                value={hsl.h}
                onChange={(e) => updateFromHsl({ ...hsl, h: Number(e.target.value) })}
                className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-slate-100 dark:bg-slate-800 accent-indigo-600"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-xs font-bold text-slate-500">Saturation</label>
                <span className="text-sm font-black font-mono">{hsl.s}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={hsl.s}
                onChange={(e) => updateFromHsl({ ...hsl, s: Number(e.target.value) })}
                className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-slate-100 dark:bg-slate-800 accent-indigo-600"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-xs font-bold text-slate-500">Luminosité</label>
                <span className="text-sm font-black font-mono">{hsl.l}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={hsl.l}
                onChange={(e) => updateFromHsl({ ...hsl, l: Number(e.target.value) })}
                className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-slate-100 dark:bg-slate-800 accent-indigo-600"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
