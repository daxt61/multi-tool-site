import { useState, useEffect, useMemo } from 'react';
import { Palette, Copy, Check, Trash2, ArrowRight, Download, Sliders } from 'lucide-react';

export function ColorMixer({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const [color1, setColor1] = useState(initialData?.color1 || '#6366f1');
  const [color2, setColor2] = useState(initialData?.color2 || '#f43f5e');
  const [ratio, setRatio] = useState(initialData?.ratio ?? 50);
  const [copied, setCopied] = useState('');

  useEffect(() => {
    onStateChange?.({ color1, color2, ratio });
  }, [color1, color2, ratio, onStateChange]);

  const mixedColor = useMemo(() => {
    const hexToRgb = (hex: string) => {
      const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
      const fullHex = hex.replace(shorthandRegex, (_m, r, g, b) => r + r + g + g + b + b);
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : { r: 0, g: 0, b: 0 };
    };

    const rgbToHex = (r: number, g: number, b: number) => {
      return '#' + [r, g, b].map(x => {
        const hex = Math.round(x).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      }).join('');
    };

    const c1 = hexToRgb(color1);
    const c2 = hexToRgb(color2);
    const r = ratio / 100;

    const mixedR = c1.r * (1 - r) + c2.r * r;
    const mixedG = c1.g * (1 - r) + c2.g * r;
    const mixedB = c1.b * (1 - r) + c2.b * r;

    const hex = rgbToHex(mixedR, mixedG, mixedB);

    // RGB to HSL
    const r_norm = mixedR / 255;
    const g_norm = mixedG / 255;
    const b_norm = mixedB / 255;
    const max = Math.max(r_norm, g_norm, b_norm);
    const min = Math.min(r_norm, g_norm, b_norm);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r_norm) h = (g_norm - b_norm) / d + (g_norm < b_norm ? 6 : 0);
      else if (max === g_norm) h = (b_norm - r_norm) / d + 2;
      else h = (r_norm - g_norm) / d + 4;
      h /= 6;
    }

    return {
      hex,
      rgb: `rgb(${Math.round(mixedR)} ${Math.round(mixedG)} ${Math.round(mixedB)})`,
      hsl: `hsl(${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%)`,
    };
  }, [color1, color2, ratio]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  };

  const handleClear = () => {
    setColor1('#6366f1');
    setColor2('#f43f5e');
    setRatio(50);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="flex justify-between items-center px-1">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
          <Palette className="w-4 h-4" /> Mélangeur de Couleurs
        </h3>
        <button
          onClick={handleClear}
          className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
        >
          <Trash2 className="w-3 h-3" /> Effacer
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
        <div className="space-y-4">
          <label htmlFor="color1" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Couleur 1</label>
          <div className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm">
            <input
              id="color1"
              type="color"
              value={color1}
              onChange={(e) => setColor1(e.target.value)}
              className="w-full h-32 rounded-2xl cursor-pointer overflow-hidden border-none"
            />
            <input
              type="text"
              value={color1}
              onChange={(e) => setColor1(e.target.value)}
              className="w-full mt-2 text-center font-mono font-bold text-sm bg-transparent outline-none dark:text-white"
            />
          </div>
        </div>

        <div className="flex flex-col items-center gap-6">
          <div className="w-full space-y-4">
            <div className="flex justify-between px-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ratio: {100 - ratio}%</span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{ratio}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={ratio}
              onChange={(e) => setRatio(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
            />
          </div>
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
            <ArrowRight className="w-6 h-6" />
          </div>
        </div>

        <div className="space-y-4">
          <label htmlFor="color2" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Couleur 2</label>
          <div className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm">
            <input
              id="color2"
              type="color"
              value={color2}
              onChange={(e) => setColor2(e.target.value)}
              className="w-full h-32 rounded-2xl cursor-pointer overflow-hidden border-none"
            />
            <input
              type="text"
              value={color2}
              onChange={(e) => setColor2(e.target.value)}
              className="w-full mt-2 text-center font-mono font-bold text-sm bg-transparent outline-none dark:text-white"
            />
          </div>
        </div>
      </div>

      <div className="bg-slate-900 dark:bg-black p-10 md:p-16 rounded-[3rem] shadow-2xl shadow-indigo-500/10 flex flex-col md:flex-row items-center gap-12 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-500/5 rounded-full -ml-32 -mt-32 blur-3xl"></div>

        <div
          className="w-48 h-48 md:w-64 md:h-64 rounded-full shadow-2xl border-8 border-white/10 shrink-0 transition-colors duration-300"
          style={{ backgroundColor: mixedColor.hex }}
        />

        <div className="flex-1 space-y-6 w-full">
          {[
            { label: 'HEX', value: mixedColor.hex, id: 'hex' },
            { label: 'RGB', value: mixedColor.rgb, id: 'rgb' },
            { label: 'HSL', value: mixedColor.hsl, id: 'hsl' },
          ].map((format) => (
            <div key={format.id} className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center justify-between group hover:bg-white/10 transition-all">
              <div className="space-y-1">
                <div className="text-[10px] font-black text-white/40 uppercase tracking-widest">{format.label}</div>
                <div className="text-xl font-black text-white font-mono">{format.value}</div>
              </div>
              <button
                onClick={() => handleCopy(format.value, format.id)}
                className={`p-3 rounded-xl transition-all ${copied === format.id ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/60 hover:text-white hover:bg-white/20'}`}
              >
                {copied === format.id ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <Sliders className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">Comment ça marche ?</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Le mélangeur calcule la moyenne pondérée des composantes Rouge, Vert et Bleu (RGB) de vos deux couleurs. Le ratio détermine l'influence de la deuxième couleur sur le résultat final.
          </p>
        </div>
      </div>
    </div>
  );
}
