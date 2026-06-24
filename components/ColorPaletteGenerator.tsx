import { useState, useMemo, useEffect } from 'react';
import { Copy, Check, RefreshCw, Palette, Layers, Download, Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getSecureRandomInt } from './ui/crypto';

export function ColorPaletteGenerator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [baseColor, setBaseColor] = useState(initialData?.baseColor || '#6366f1');
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    onStateChange?.({ baseColor });
  }, [baseColor]);

  const hexToRgb = (hex: string) => {
    let r = 0, g = 0, b = 0;
    if (hex.length === 4) {
      r = parseInt(hex[1] + hex[1], 16);
      g = parseInt(hex[2] + hex[2], 16);
      b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) {
      r = parseInt(hex.substring(1, 3), 16);
      g = parseInt(hex.substring(3, 5), 16);
      b = parseInt(hex.substring(5, 7), 16);
    }
    return { r, g, b };
  };

  const getLuminance = (r: number, g: number, b: number) => {
    const a = [r, g, b].map(v => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  };

  const getContrastRatio = (lum1: number, lum2: number) => {
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    return (brightest + 0.05) / (darkest + 0.05);
  };

  const hexToHsl = (hex: string) => {
    const { r, g, b } = hexToRgb(hex);
    const rNorm = r / 255, gNorm = g / 255, bNorm = b / 255;
    const max = Math.max(rNorm, gNorm, bNorm), min = Math.min(rNorm, gNorm, bNorm);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case rNorm: h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0); break;
        case gNorm: h = (bNorm - rNorm) / d + 2; break;
        case bNorm: h = (rNorm - gNorm) / d + 4; break;
      }
      h /= 6;
    }
    return { h: h * 360, s: s * 100, l: l * 100 };
  };

  const hslToHex = (h: number, s: number, l: number) => {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  };

  const palettes = useMemo(() => {
    const { h, s, l } = hexToHsl(baseColor);

    const generatePalette = (offsets: number[]) => {
      return offsets.map(offset => hslToHex((h + offset + 360) % 360, s, l));
    };

    return [
      {
        id: 'comp',
        name: t('palette.comp'),
        colors: generatePalette([0, 180]),
        desc: t('palette.comp_desc')
      },
      {
        id: 'analogue',
        name: t('palette.analogue'),
        colors: generatePalette([-30, 0, 30]),
        desc: t('palette.analogue_desc')
      },
      {
        id: 'triadic',
        name: t('palette.triadic'),
        colors: generatePalette([0, 120, 240]),
        desc: t('palette.triadic_desc')
      },
      {
        id: 'split_comp',
        name: t('palette.split_comp'),
        colors: generatePalette([0, 150, 210]),
        desc: t('palette.split_comp_desc')
      },
      {
         id: 'rectangle',
         name: t('palette.rectangle'),
         colors: generatePalette([0, 30, 180, 210]),
         desc: t('palette.rectangle_desc')
      },
      {
        id: 'mono',
        name: t('palette.mono'),
        colors: [
          hslToHex(h, s, Math.max(l - 30, 10)),
          hslToHex(h, s, Math.max(l - 15, 20)),
          baseColor,
          hslToHex(h, s, Math.min(l + 15, 85)),
          hslToHex(h, s, Math.min(l + 30, 95)),
        ],
        desc: t('palette.mono_desc')
      },
      {
        id: 'shades',
        name: t('palette.shades'),
        colors: [
           hslToHex(h, Math.max(s - 20, 0), Math.min(l + 40, 95)),
           hslToHex(h, Math.max(s - 10, 0), Math.min(l + 20, 90)),
           baseColor,
           hslToHex(h, Math.min(s + 10, 100), Math.max(l - 20, 10)),
           hslToHex(h, Math.min(s + 20, 100), Math.max(l - 40, 5)),
        ],
        desc: t('palette.shades_desc')
      },
      {
        id: 'tetra',
        name: t('palette.tetra'),
        colors: generatePalette([0, 60, 180, 240]),
        desc: t('palette.tetra_desc')
      },
      {
        id: 'square',
        name: t('palette.square'),
        colors: generatePalette([0, 90, 180, 270]),
        desc: t('palette.square_desc')
      }
    ];
  }, [baseColor, t]);

  const copyToClipboard = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopied(hex);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDownload = () => {
    let content = `Palette: ${baseColor.toUpperCase()}\n\n`;
    palettes.forEach(p => {
      content += `${p.name}:\n`;
      content += p.colors.map(c => c.toUpperCase()).join(', ') + '\n\n';
    });
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `palette-${baseColor.replace('#', '')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const generateRandom = () => {
    // Generate aesthetic "brand" colors using better HSL ranges
    const h = getSecureRandomInt(360);
    const s = getSecureRandomInt(40) + 50; // 50% - 90%
    const l = getSecureRandomInt(30) + 40; // 40% - 70%
    setBaseColor(hslToHex(h, s, l));
  };

  const ContrastBadge = ({ color }: { color: string }) => {
     const { r, g, b } = hexToRgb(color);
     const lum = getLuminance(r, g, b);
     const whiteContrast = getContrastRatio(lum, 1);
     const blackContrast = getContrastRatio(lum, 0);

     const bestText = whiteContrast > blackContrast ? 'white' : 'black';
     const bestRatio = Math.max(whiteContrast, blackContrast);

     return (
        <div className={`px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-tighter flex items-center gap-1 ${
           bestText === 'white' ? 'bg-white/20 text-white' : 'bg-black/10 text-black/60'
        }`}>
           <Eye className="w-2 h-2" />
           {bestRatio.toFixed(1)}:1
        </div>
     );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      {/* Control Panel */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex items-center gap-6">
          <div className="space-y-2">
            <label htmlFor="baseColor" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">{t('palette.base_color')}</label>
            <div className="flex items-center gap-3">
              <input
                id="baseColor"
                type="color"
                value={baseColor}
                onChange={(e) => setBaseColor(e.target.value)}
                className="w-16 h-16 rounded-2xl border-4 border-white dark:border-slate-800 shadow-lg cursor-pointer overflow-hidden"
              />
              <input
                type="text"
                value={baseColor.toUpperCase()}
                onChange={(e) => {
                  const val = e.target.value;
                  if (/^#[0-9A-F]{0,6}$/i.test(val)) setBaseColor(val);
                }}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-xl font-mono font-black text-lg w-32 focus:border-indigo-500 outline-none transition-all dark:text-white"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <button
            onClick={handleDownload}
            className="px-6 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl font-bold transition-all hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
          >
            <Download className="w-5 h-5" /> {t('common.download')}
          </button>
          <button
            onClick={generateRandom}
            className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2"
          >
            <RefreshCw className="w-5 h-5" /> {t('palette.random')}
          </button>
        </div>
      </div>

      {/* Palettes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {palettes.map((palette) => (
          <div key={palette.id} className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 space-y-6 flex flex-col">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-black dark:text-white">{palette.name}</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">{palette.desc}</p>
              </div>
              <Palette className="w-5 h-5 text-indigo-500 opacity-20" />
            </div>

            <div className="flex h-28 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm">
              {palette.colors.map((color, i) => (
                <button
                  key={`${palette.id}-${i}`}
                  onClick={() => copyToClipboard(color)}
                  className="flex-1 relative group transition-all hover:flex-[1.5] flex flex-col items-center justify-end pb-3"
                  style={{ backgroundColor: color }}
                  title={color}
                >
                  <div className="mb-auto mt-3">
                     <ContrastBadge color={color} />
                  </div>
                  <div className={`absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity`}>
                    {copied === color ? <Check className="w-5 h-5 text-white" /> : <Copy className="w-5 h-5 text-white" />}
                  </div>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
               {palette.colors.map((color, i) => (
                 <button
                   key={i}
                   onClick={() => copyToClipboard(color)}
                   className="text-[10px] font-mono font-black py-2 px-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700 hover:border-indigo-500/30 transition-all dark:text-slate-300 flex items-center justify-between group"
                 >
                   {color.toUpperCase()}
                   <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                 </button>
               ))}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 flex items-start gap-4">
         <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
            <Layers className="w-6 h-6" />
         </div>
         <div className="space-y-2">
            <h4 className="font-bold dark:text-white">{t('palette.about_title')}</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              {t('palette.about_text')} The <Eye className="w-3 h-3 inline-block" /> icon shows the WCAG contrast ratio against the most readable text color (white or black). A ratio of 4.5:1 is recommended for standard text.
            </p>
         </div>
      </div>
    </div>
  );
}
