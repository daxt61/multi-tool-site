import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Copy, Check, RefreshCw, Palette, Layers, Download, Eye, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { getSecureRandomInt } from './ui/crypto';
import { Kbd } from './ui/Kbd';

interface ColorPreset {
  id: string;
  nameKey: string;
  hex: string;
}

const PRESETS: ColorPreset[] = [
  { id: 'indigo', nameKey: 'palette.preset_indigo', hex: '#6366F1' },
  { id: 'emerald', nameKey: 'palette.preset_emerald', hex: '#10B981' },
  { id: 'violet', nameKey: 'palette.preset_violet', hex: '#8B5CF6' },
  { id: 'rose', nameKey: 'palette.preset_rose', hex: '#F43F5E' },
  { id: 'amber', nameKey: 'palette.preset_amber', hex: '#F59E0B' },
  { id: 'cyan', nameKey: 'palette.preset_cyan', hex: '#06B6D4' }
];

export function ColorPaletteGenerator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const DEFAULT_COLOR = '#6366F1';
  const [baseColor, setBaseColor] = useState<string>(initialData?.baseColor || DEFAULT_COLOR);
  const [copied, setCopied] = useState<string | null>(null);
  const [activePresetId, setActivePresetId] = useState<string | null>(() => {
    const match = PRESETS.find(p => p.hex.toLowerCase() === (initialData?.baseColor || DEFAULT_COLOR).toLowerCase());
    return match ? match.id : 'indigo';
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const hexInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    onStateChange?.({ baseColor });
  }, [baseColor, onStateChange]);

  const updateColor = useCallback((hex: string, presetId: string | null = null) => {
    const normalized = hex.toUpperCase();
    setBaseColor(normalized);
    if (presetId !== null) {
      setActivePresetId(presetId);
    } else {
      const match = PRESETS.find(p => p.hex.toLowerCase() === normalized.toLowerCase());
      setActivePresetId(match ? match.id : null);
    }
  }, []);

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

  const copyToClipboard = useCallback((hex: string) => {
    const textToCopy = hex.toUpperCase();
    navigator.clipboard.writeText(textToCopy);
    setCopied(textToCopy);
    toast.success(`${t('common.copied')}: ${textToCopy}`);
    setTimeout(() => setCopied(null), 2000);
  }, [t]);

  const handleDownload = useCallback(() => {
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
    toast.success(t('common.downloaded'));
  }, [baseColor, palettes, t]);

  const generateRandom = useCallback(() => {
    const h = getSecureRandomInt(360);
    const s = getSecureRandomInt(40) + 50; // 50% - 90%
    const l = getSecureRandomInt(30) + 40; // 40% - 70%
    const newColor = hslToHex(h, s, l).toUpperCase();
    updateColor(newColor, null);
    toast.success(t('palette.toast_random_generated'));
  }, [hslToHex, updateColor, t]);

  const handleReset = useCallback(() => {
    updateColor(DEFAULT_COLOR, 'indigo');
    toast.success(t('palette.toast_reset'));
    hexInputRef.current?.focus();
  }, [updateColor, t]);

  const handlersRef = useRef({
    generateRandom,
    handleReset,
    copyBaseColor: () => copyToClipboard(baseColor)
  });

  useEffect(() => {
    handlersRef.current = {
      generateRandom,
      handleReset,
      copyBaseColor: () => copyToClipboard(baseColor)
    };
  }, [generateRandom, handleReset, baseColor, copyToClipboard]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInputFocused =
        activeEl?.tagName === 'INPUT' ||
        activeEl?.tagName === 'TEXTAREA' ||
        activeEl?.tagName === 'SELECT' ||
        ((activeEl as HTMLElement)?.isContentEditable ?? false);

      const isInside = containerRef.current?.contains(activeEl) || activeEl === document.body;
      if (!isInside) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        handlersRef.current.handleReset();
        return;
      }

      if (isInputFocused) return;

      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;

      if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        handlersRef.current.generateRandom();
      } else if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handlersRef.current.copyBaseColor();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
    <div ref={containerRef} className="max-w-5xl mx-auto space-y-12">
      {/* Control Panel */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 flex flex-col space-y-6">
        {/* Top bar with Presets & Reset */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-black uppercase tracking-widest text-slate-400 mr-2">
              {t('palette.presets_title')}
            </span>
            {PRESETS.map((preset) => {
              const isActive = activePresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => updateColor(preset.hex, preset.id)}
                  aria-pressed={isActive}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 scale-105'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full border border-black/10 dark:border-white/20" style={{ backgroundColor: preset.hex }} />
                  {t(preset.nameKey)}
                </button>
              );
            })}
          </div>

          <button
            onClick={handleReset}
            className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
            aria-label={t('common.reset')}
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" /> {t('common.reset')}
            <Kbd modifier={null} className="ml-1 border-rose-200 dark:border-rose-800 text-[8px] bg-white/50 dark:bg-black/20">Esc</Kbd>
          </button>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-8 pt-4 border-t border-slate-200/60 dark:border-slate-800">
          <div className="flex items-center gap-6">
            <div className="space-y-2">
              <label htmlFor="baseColor-hex" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 cursor-pointer">
                {t('palette.base_color')}
              </label>
              <div className="flex items-center gap-3">
                <input
                  id="baseColor"
                  type="color"
                  value={baseColor}
                  onChange={(e) => updateColor(e.target.value)}
                  className="w-16 h-16 rounded-2xl border-4 border-white dark:border-slate-800 shadow-lg cursor-pointer overflow-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
                  aria-label={t('palette.base_color')}
                />
                <input
                  id="baseColor-hex"
                  ref={hexInputRef}
                  type="text"
                  value={baseColor.toUpperCase()}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^#[0-9A-F]{0,6}$/i.test(val)) updateColor(val);
                  }}
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-xl font-mono font-black text-lg w-36 focus:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none transition-all dark:text-white"
                  aria-label={t('palette.base_color')}
                />
                <button
                  onClick={() => copyToClipboard(baseColor)}
                  className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none flex items-center gap-1.5"
                  aria-label={`${t('common.copy')} ${baseColor}`}
                  title={`${t('common.copy')} (${baseColor})`}
                >
                  {copied === baseColor.toUpperCase() ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
                  <Kbd modifier={null} className="text-[9px]">C</Kbd>
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <button
              onClick={handleDownload}
              className="px-6 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl font-bold transition-all hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
            >
              <Download className="w-5 h-5" aria-hidden="true" /> {t('common.download')}
            </button>
            <button
              onClick={generateRandom}
              className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
            >
              <RefreshCw className="w-5 h-5" aria-hidden="true" /> {t('palette.random')}
              <Kbd modifier={null} className="bg-white/20 text-white border-white/30 text-[10px]">R</Kbd>
            </button>
          </div>
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
                  className="flex-1 relative group transition-all hover:flex-[1.5] flex flex-col items-center justify-end pb-3 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none focus-visible:z-10"
                  style={{ backgroundColor: color }}
                  title={`${color.toUpperCase()} (${t('common.copy')})`}
                  aria-label={`${palette.name} - ${color.toUpperCase()}`}
                >
                  <div className="mb-auto mt-3">
                     <ContrastBadge color={color} />
                  </div>
                  <div className={`absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity`}>
                    {copied === color.toUpperCase() ? <Check className="w-5 h-5 text-white" /> : <Copy className="w-5 h-5 text-white" />}
                  </div>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
               {palette.colors.map((color, i) => (
                 <button
                   key={i}
                   onClick={() => copyToClipboard(color)}
                   aria-label={`${t('common.copy')} ${color.toUpperCase()}`}
                   className="text-[10px] font-mono font-black py-2 px-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700 hover:border-indigo-500/30 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none transition-all dark:text-slate-300 flex items-center justify-between group"
                 >
                   {color.toUpperCase()}
                   <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity" />
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
