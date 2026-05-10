import { useState, useEffect } from 'react';
import { Copy, Check, Palette, Hash, Sliders, RotateCcw } from 'lucide-react';

interface ColorState {
  hex: string;
  rgb: { r: number; g: number; b: number };
  hsl: { h: number; s: number; l: number };
  cmyk: { c: number; m: number; y: number; k: number };
  oklch: { l: number; c: number; h: number };
  oklab: { l: number; a: number; b: number };
}

const DEFAULT_COLORS: ColorState = {
  hex: '#6366f1',
  rgb: { r: 99, g: 102, b: 241 },
  hsl: { h: 239, s: 84, l: 67 },
  cmyk: { c: 59, m: 58, y: 0, k: 5 },
  oklch: { l: 0.58, c: 0.19, h: 260 },
  oklab: { l: 0.58, a: 0.05, b: -0.19 }
};

export function ColorConverter({ initialData, onStateChange }: {
  initialData?: Partial<ColorState>;
  onStateChange?: (state: ColorState) => void
}) {
  const [hex, setHex] = useState(initialData?.hex || DEFAULT_COLORS.hex);
  const [rgb, setRgb] = useState(initialData?.rgb || DEFAULT_COLORS.rgb);
  const [hsl, setHsl] = useState(initialData?.hsl || DEFAULT_COLORS.hsl);
  const [cmyk, setCmyk] = useState(initialData?.cmyk || DEFAULT_COLORS.cmyk);
  const [oklch, setOklch] = useState(initialData?.oklch || DEFAULT_COLORS.oklch);
  const [oklab, setOklab] = useState(initialData?.oklab || DEFAULT_COLORS.oklab);
  const [copied, setCopied] = useState('');

  useEffect(() => {
    const state: ColorState = { hex, rgb, hsl, cmyk, oklch, oklab };
    onStateChange?.(state);
  }, [hex, rgb, hsl, cmyk, oklch, oklab]);

  const formatOklch = (l: number, c: number, h: number) =>
    `oklch(${l.toFixed(2)} ${c.toFixed(2)} ${h.toFixed(0)})`;

  const formatOklab = (l: number, a: number, b: number) =>
    `oklab(${l.toFixed(2)} ${a.toFixed(2)} ${b.toFixed(2)})`;

  const formatDisplayP3 = (r: number, g: number, b: number) =>
    `color(display-p3 ${(r/255).toFixed(3)} ${(g/255).toFixed(3)} ${(b/255).toFixed(3)})`;

  const hexToRgb = (hex: string) => {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    const fullHex = hex.replace(shorthandRegex, (_m, r, g, b) => {
      return r + r + g + g + b + b;
    });
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
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
    r /= 255; g /= 255; b /= 255;
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
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
  };

  const hslToRgb = (h: number, s: number, l: number) => {
    h /= 360; s /= 100; l /= 100;
    let r, g, b;
    if (s === 0) { r = g = b = l; } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1; if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3); g = hue2rgb(p, q, h); b = hue2rgb(p, q, h - 1/3);
    }
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
  };

  const rgbToCmyk = (r: number, g: number, b: number) => {
    let c = 1 - (r / 255); let m = 1 - (g / 255); let y = 1 - (b / 255);
    let k = Math.min(c, m, y);
    if (k === 1) return { c: 0, m: 0, y: 0, k: 100 };
    c = ((c - k) / (1 - k)) * 100; m = ((m - k) / (1 - k)) * 100; y = ((y - k) / (1 - k)) * 100; k = k * 100;
    return { c: Math.round(c), m: Math.round(m), y: Math.round(y), k: Math.round(k) };
  };

  const cmykToRgb = (c: number, m: number, y: number, k: number) => {
    c /= 100; m /= 100; y /= 100; k /= 100;
    const r = 255 * (1 - c) * (1 - k); const g = 255 * (1 - m) * (1 - k); const b = 255 * (1 - y) * (1 - k);
    return { r: Math.round(r), g: Math.round(g), b: Math.round(b) };
  };

  const rgbToOklab = (r: number, g: number, b: number) => {
    const R = r / 255, G = g / 255, B = b / 255;
    const l = 0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B;
    const m = 0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B;
    const s = 0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B;
    const l_ = Math.cbrt(l), m_ = Math.cbrt(m), s_ = Math.cbrt(s);
    return {
      l: 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720403 * s_,
      a: 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
      b: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_
    };
  };

  const oklabToRgb = (L: number, a: number, b_: number) => {
    const l_ = L + 0.3963377774 * a + 0.2158037573 * b_;
    const m_ = L - 0.1055613458 * a - 0.0638541728 * b_;
    const s_ = L - 0.0894841775 * a - 1.2914855480 * b_;
    const l = l_ * l_ * l_, m = m_ * m_ * m_, s = s_ * s_ * s_;
    const R = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
    const G = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
    const B = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;
    return {
      r: Math.round(Math.max(0, Math.min(1, R)) * 255),
      g: Math.round(Math.max(0, Math.min(1, G)) * 255),
      b: Math.round(Math.max(0, Math.min(1, B)) * 255)
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
        setCmyk(rgbToCmyk(rgbValue.r, rgbValue.g, rgbValue.b));
        const lab = rgbToOklab(rgbValue.r, rgbValue.g, rgbValue.b);
        setOklab(lab);
        const C = Math.sqrt(lab.a * lab.a + lab.b * lab.b);
        let H = Math.atan2(lab.b, lab.a) * (180 / Math.PI);
        if (H < 0) H += 360;
        setOklch({ l: lab.l, c: C, h: H });
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
    setCmyk(rgbToCmyk(r, g, b));
    const lab = rgbToOklab(r, g, b);
    setOklab(lab);
    const C = Math.sqrt(lab.a * lab.a + lab.b * lab.b);
    let H = Math.atan2(lab.b, lab.a) * (180 / Math.PI);
    if (H < 0) H += 360;
    setOklch({ l: lab.l, c: C, h: H });
  };

  const updateFromHsl = (newHsl: { h: number, s: number, l: number }) => {
    const h = Math.max(0, Math.min(360, newHsl.h));
    const s = Math.max(0, Math.min(100, newHsl.s));
    const l = Math.max(0, Math.min(100, newHsl.l));
    setHsl({ h, s, l });
    const rgbValue = hslToRgb(h, s, l);
    setRgb(rgbValue);
    setHex(rgbToHex(rgbValue.r, rgbValue.g, rgbValue.b));
    setCmyk(rgbToCmyk(rgbValue.r, rgbValue.g, rgbValue.b));
    const lab = rgbToOklab(rgbValue.r, rgbValue.g, rgbValue.b);
    setOklab(lab);
    const C = Math.sqrt(lab.a * lab.a + lab.b * lab.b);
    let H = Math.atan2(lab.b, lab.a) * (180 / Math.PI);
    if (H < 0) H += 360;
    setOklch({ l: lab.l, c: C, h: H });
  };

  const updateFromCmyk = (newCmyk: { c: number, m: number, y: number, k: number }) => {
    const c = Math.max(0, Math.min(100, newCmyk.c));
    const m = Math.max(0, Math.min(100, newCmyk.m));
    const y = Math.max(0, Math.min(100, newCmyk.y));
    const k = Math.max(0, Math.min(100, newCmyk.k));
    setCmyk({ c, m, y, k });
    const rgbValue = cmykToRgb(c, m, y, k);
    setRgb(rgbValue);
    setHex(rgbToHex(rgbValue.r, rgbValue.g, rgbValue.b));
    setHsl(rgbToHsl(rgbValue.r, rgbValue.g, rgbValue.b));
    const lab = rgbToOklab(rgbValue.r, rgbValue.g, rgbValue.b);
    setOklab(lab);
    const C = Math.sqrt(lab.a * lab.a + lab.b * lab.b);
    let H = Math.atan2(lab.b, lab.a) * (180 / Math.PI);
    if (H < 0) H += 360;
    setOklch({ l: lab.l, c: C, h: H });
  };

  const updateFromOklab = (newL: number, newA: number, newB: number) => {
    const l = Math.max(0, Math.min(1, newL));
    const a = Math.max(-0.4, Math.min(0.4, newA));
    const b = Math.max(-0.4, Math.min(0.4, newB));
    setOklab({ l, a, b });
    const rgbValue = oklabToRgb(l, a, b);
    setRgb(rgbValue);
    setHex(rgbToHex(rgbValue.r, rgbValue.g, rgbValue.b));
    setHsl(rgbToHsl(rgbValue.r, rgbValue.g, rgbValue.b));
    setCmyk(rgbToCmyk(rgbValue.r, rgbValue.g, rgbValue.b));
    const C = Math.sqrt(a * a + b * b);
    let H = Math.atan2(b, a) * (180 / Math.PI);
    if (H < 0) H += 360;
    setOklch({ l: lab.l, c: C, h: H });
  };

  const updateFromOklch = (newL: number, newC: number, newH: number) => {
    const l = Math.max(0, Math.min(1, newL));
    const c = Math.max(0, Math.min(0.4, newC));
    const h = Math.max(0, Math.min(360, newH));
    setOklch({ l, c, h });
    const h_rad = h * (Math.PI / 180);
    const a = c * Math.cos(h_rad);
    const b = c * Math.sin(h_rad);
    setOklab({ l, a, b });
    const rgbValue = oklabToRgb(l, a, b);
    setRgb(rgbValue);
    setHex(rgbToHex(rgbValue.r, rgbValue.g, rgbValue.b));
    setHsl(rgbToHsl(rgbValue.r, rgbValue.g, rgbValue.b));
    setCmyk(rgbToCmyk(rgbValue.r, rgbValue.g, rgbValue.b));
  };

  const getLuminance = (r: number, g: number, b: number) => {
    const a = [r, g, b].map(v => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  };

  const getContrast = (rgb1: { r: number, g: number, b: number }, rgb2: { r: number, g: number, b: number }) => {
    const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
    const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    return (brightest + 0.05) / (darkest + 0.05);
  };

  const contrastWhite = getContrast(rgb, { r: 255, g: 255, b: 255 });
  const contrastBlack = getContrast(rgb, { r: 0, g: 0, b: 0 });

  const getWCAGRating = (contrast: number) => {
    if (contrast >= 7) return 'AAA';
    if (contrast >= 4.5) return 'AA';
    if (contrast >= 3) return 'Large';
    return 'Fail';
  };

  const handleReset = () => {
    setHex(DEFAULT_COLORS.hex);
    setRgb(DEFAULT_COLORS.rgb);
    setHsl(DEFAULT_COLORS.hsl);
    setCmyk(DEFAULT_COLORS.cmyk);
    setOklch(DEFAULT_COLORS.oklch);
    setOklab(DEFAULT_COLORS.oklab);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <div className="flex justify-end px-1">
        <button onClick={handleReset} className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all focus:ring-2 focus:ring-rose-500/20">
          <RotateCcw className="w-3 h-3" /> Réinitialiser
        </button>
      </div>

      <div className="relative group">
        <div className="w-full h-64 rounded-[2.5rem] shadow-2xl transition-all duration-500 group-hover:scale-[1.01]" style={{ backgroundColor: hex }} />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <input type="color" value={hex} onChange={(e) => updateFromHex(e.target.value)} className="w-20 h-20 rounded-full border-4 border-white cursor-pointer shadow-xl" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {[
          { label: 'HEX', value: hex, id: 'hex' },
          { label: 'RGB', value: `rgb(${rgb.r} ${rgb.g} ${rgb.b})`, id: 'rgb' },
          { label: 'HSL', value: `hsl(${hsl.h} ${hsl.s}% ${hsl.l}%)`, id: 'hsl' },
          { label: 'OKLAB', value: formatOklab(oklab.l, oklab.a, oklab.b), id: 'oklab' },
          { label: 'OKLCH', value: formatOklch(oklch.l, oklch.c, oklch.h), id: 'oklch' },
          { label: 'P3', value: formatDisplayP3(rgb.r, rgb.g, rgb.b), id: 'p3' },
        ].map((f) => (
          <div key={f.id} className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black uppercase text-slate-400">{f.label}</span>
              <button onClick={() => copyToClipboard(f.value, f.id)} className={`p-1.5 rounded-lg transition-all ${copied === f.id ? 'text-emerald-500' : 'text-slate-400 hover:text-indigo-500'}`}>
                {copied === f.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="text-sm font-black font-mono truncate dark:text-white">{f.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-8 rounded-[2.5rem] space-y-8">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 px-1"><Sliders className="w-4 h-4" /> RGB</h4>
          <div className="space-y-6">
            {['r', 'g', 'b'].map((k) => (
              <div key={k} className="space-y-2">
                <div className="flex justify-between items-center px-1"><label className="text-xs font-bold text-slate-500 capitalize">{k === 'r' ? 'Rouge' : k === 'g' ? 'Vert' : 'Bleu'}</label><span className="text-sm font-black font-mono dark:text-slate-300">{rgb[k as keyof typeof rgb]}</span></div>
                <input type="range" min="0" max="255" value={rgb[k as keyof typeof rgb]} onChange={(e) => updateFromRgb({ ...rgb, [k]: Number(e.target.value) })} className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-slate-100 dark:bg-slate-800 accent-indigo-600" />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-8 rounded-[2.5rem] space-y-8">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 px-1"><Palette className="w-4 h-4" /> HSL</h4>
          <div className="space-y-6">
            {[
              { label: 'Teinte', key: 'h', max: 360, unit: '°' },
              { label: 'Saturation', key: 's', max: 100, unit: '%' },
              { label: 'Luminosité', key: 'l', max: 100, unit: '%' }
            ].map((chan) => (
              <div key={chan.key} className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-xs font-bold text-slate-500">{chan.label}</label>
                  <span className="text-sm font-black font-mono dark:text-slate-300">{hsl[chan.key as keyof typeof hsl]}{chan.unit}</span>
                </div>
                <input type="range" min="0" max={chan.max} value={hsl[chan.key as keyof typeof hsl]} onChange={(e) => updateFromHsl({ ...hsl, [chan.key]: Number(e.target.value) })} className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-slate-100 dark:bg-slate-800 accent-indigo-600" />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-8 rounded-[2.5rem] space-y-8">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 px-1"><Sliders className="w-4 h-4 text-indigo-500" /> CMYK</h4>
          <div className="space-y-6">
            {[
              { label: 'Cyan', key: 'c' },
              { label: 'Magenta', key: 'm' },
              { label: 'Jaune', key: 'y' },
              { label: 'Noir', key: 'k' },
            ].map((chan) => (
              <div key={chan.key} className="space-y-2">
                <div className="flex justify-between items-center px-1"><label className="text-xs font-bold text-slate-500">{chan.label}</label><span className="text-sm font-black font-mono dark:text-slate-300">{cmyk[chan.key as keyof typeof cmyk]}%</span></div>
                <input type="range" min="0" max="100" value={cmyk[chan.key as keyof typeof cmyk]} onChange={(e) => updateFromCmyk({ ...cmyk, [chan.key]: Number(e.target.value) })} className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-slate-100 dark:bg-slate-800 accent-indigo-600" />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-8 rounded-[2.5rem] space-y-8">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 px-1"><Sliders className="w-4 h-4 text-indigo-500" /> OKLAB</h4>
          <div className="space-y-6">
            {['l', 'a', 'b'].map((k) => (
              <div key={k} className="space-y-2">
                <div className="flex justify-between items-center px-1"><label className="text-xs font-bold text-slate-500 uppercase">{k}</label><span className="text-sm font-black font-mono dark:text-slate-300">{oklab[k as keyof typeof oklab].toFixed(2)}</span></div>
                <input type="range" min={k === 'l' ? 0 : -0.4} max={k === 'l' ? 1 : 0.4} step="0.01" value={oklab[k as keyof typeof oklab]} onChange={(e) => updateFromOklab(k === 'l' ? Number(e.target.value) : oklab.l, k === 'a' ? Number(e.target.value) : oklab.a, k === 'b' ? Number(e.target.value) : oklab.b)} className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-slate-100 dark:bg-slate-800 accent-indigo-600" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
        <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 px-1"><Check className="w-4 h-4 text-indigo-500" /> Accessibilité (WCAG 2.1)</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-6 rounded-3xl space-y-4" style={{ backgroundColor: hex, color: '#FFFFFF' }}>
             <div className="flex justify-between items-center"><span className="text-xs font-bold uppercase opacity-80">Sur Fond Blanc</span><span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${contrastWhite >= 4.5 ? 'bg-emerald-500' : 'bg-rose-500'} text-white`}>{getWCAGRating(contrastWhite)}</span></div>
             <div className="text-3xl font-black">{contrastWhite.toFixed(2)} : 1</div>
             <p className="text-sm font-medium opacity-90">L'herbe est plus verte ailleurs. Le soleil brille pour tout le monde.</p>
          </div>
          <div className="p-6 rounded-3xl space-y-4" style={{ backgroundColor: hex, color: '#000000' }}>
             <div className="flex justify-between items-center"><span className="text-xs font-bold uppercase opacity-80">Sur Fond Noir</span><span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${contrastBlack >= 4.5 ? 'bg-emerald-500' : 'bg-rose-500'} text-white`}>{getWCAGRating(contrastBlack)}</span></div>
             <div className="text-3xl font-black">{contrastBlack.toFixed(2)} : 1</div>
             <p className="text-sm font-medium opacity-90">La nuit, tous les chats sont gris. Le silence est d'or.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
