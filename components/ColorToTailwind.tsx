import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Copy, Check, Palette, Search, Info, Sliders, RefreshCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { getSecureRandomColor } from './ui/crypto';
import { Kbd } from './ui/Kbd';

// Simplified Tailwind Color Palette
const TAILWIND_COLORS: Record<string, Record<string, string>> = {
  slate: { '50': '#f8fafc', '100': '#f1f5f9', '200': '#e2e8f0', '300': '#cbd5e1', '400': '#94a3b8', '500': '#64748b', '600': '#475569', '700': '#334155', '800': '#1e293b', '900': '#0f172a', '950': '#020617' },
  gray: { '50': '#f9fafb', '100': '#f3f4f6', '200': '#e5e7eb', '300': '#d1d5db', '400': '#9ca3af', '500': '#6b7280', '600': '#4b5563', '700': '#374151', '800': '#1f2937', '900': '#111827', '950': '#030712' },
  zinc: { '50': '#fafafa', '100': '#f4f4f5', '200': '#e4e4e7', '300': '#d4d4d8', '400': '#a1a1aa', '500': '#71717a', '600': '#52525b', '700': '#3f3f46', '800': '#27272a', '900': '#18181b', '950': '#09090b' },
  neutral: { '50': '#fafafa', '100': '#f5f5f5', '200': '#e5e5e5', '300': '#d4d4d4', '400': '#a3a3a3', '500': '#737373', '600': '#525252', '700': '#404040', '800': '#262626', '900': '#171717', '950': '#0a0a0a' },
  stone: { '50': '#fafaf9', '100': '#f5f5f4', '200': '#e7e5e4', '300': '#d6d3d1', '400': '#a8a29e', '500': '#78716c', '600': '#57534e', '700': '#44403c', '800': '#292524', '900': '#1c1917', '950': '#0c0a09' },
  red: { '50': '#fef2f2', '100': '#fee2e2', '200': '#fecaca', '300': '#fca5a5', '400': '#f87171', '500': '#ef4444', '600': '#dc2626', '700': '#b91c1c', '800': '#991b1b', '900': '#7f1d1d', '950': '#450a0a' },
  orange: { '50': '#fff7ed', '100': '#ffedd5', '200': '#fed7aa', '300': '#fdba74', '400': '#fb923c', '500': '#f97316', '600': '#ea580c', '700': '#c2410c', '800': '#9a3412', '900': '#7c2d12', '950': '#431407' },
  amber: { '50': '#fffbeb', '100': '#fef3c7', '200': '#fde68a', '300': '#fcd34d', '400': '#fbbf24', '500': '#f59e0b', '600': '#d97706', '700': '#b45309', '800': '#92400e', '900': '#78350f', '950': '#451a03' },
  yellow: { '50': '#fefce8', '100': '#fef9c3', '200': '#fef08a', '300': '#fde047', '400': '#facc15', '500': '#eab308', '600': '#ca8a04', '700': '#a16207', '800': '#854d0e', '900': '#713f12', '950': '#422006' },
  lime: { '50': '#f7fee7', '100': '#ecfccb', '200': '#d9f99d', '300': '#bef264', '400': '#a3e635', '500': '#84cc16', '600': '#65a30d', '700': '#4d7c0f', '800': '#3f6212', '900': '#365314', '950': '#1a2e05' },
  green: { '50': '#f0fdf4', '100': '#dcfce7', '200': '#bbf7d0', '300': '#86efac', '400': '#4ade80', '500': '#22c55e', '600': '#16a34a', '700': '#15803d', '800': '#166534', '900': '#14532d', '950': '#052e16' },
  emerald: { '50': '#ecfdf5', '100': '#d1fae5', '200': '#a7f3d0', '300': '#6ee7b7', '400': '#34d399', '500': '#10b981', '600': '#059669', '700': '#047857', '800': '#065f46', '900': '#064e3b', '950': '#022c22' },
  teal: { '50': '#f0fdfa', '100': '#ccfbf1', '200': '#99f6e4', '300': '#5eead4', '400': '#2dd4bf', '500': '#14b8a6', '600': '#0d9488', '700': '#0f766e', '800': '#115e59', '900': '#134e4a', '950': '#042f2e' },
  cyan: { '50': '#ecfeff', '100': '#cffafe', '200': '#a5f3fc', '300': '#67e8f9', '400': '#22d3ee', '500': '#06b6d4', '600': '#0891b2', '700': '#0e7490', '800': '#155e75', '900': '#164e63', '950': '#083344' },
  sky: { '50': '#f0f9ff', '100': '#e0f2fe', '200': '#bae6fd', '300': '#7dd3fc', '400': '#38bdf8', '500': '#0ea5e9', '600': '#0284c7', '700': '#0369a1', '800': '#075985', '900': '#0c4a6e', '950': '#082f49' },
  blue: { '50': '#eff6ff', '100': '#dbeafe', '200': '#bfdbfe', '300': '#93c5fd', '400': '#60a5fa', '500': '#3b82f6', '600': '#2563eb', '700': '#1d4ed8', '800': '#1e40af', '900': '#1e3a8a', '950': '#172554' },
  indigo: { '50': '#eef2ff', '100': '#e0e7ff', '200': '#c7d2fe', '300': '#a5b4fc', '400': '#818cf8', '500': '#6366f1', '600': '#4f46e5', '700': '#4338ca', '800': '#3730a3', '900': '#312e81', '950': '#1e1b4b' },
  violet: { '50': '#f5f3ff', '100': '#ede9fe', '200': '#ddd6fe', '300': '#c4b5fd', '400': '#a78bfa', '500': '#8b5cf6', '600': '#7c3aed', '700': '#6d28d9', '800': '#5b21b6', '900': '#4c1d95', '950': '#2e1065' },
  purple: { '50': '#faf5ff', '100': '#f3e8ff', '200': '#e9d5ff', '300': '#d8b4fe', '400': '#c084fc', '500': '#a855f7', '600': '#9333ea', '700': '#7e22ce', '800': '#6b21a8', '900': '#581c87', '950': '#3b0764' },
  fuchsia: { '50': '#fdf4ff', '100': '#fae8ff', '200': '#f5d0fe', '300': '#f0abfc', '400': '#e879f9', '500': '#d946ef', '600': '#c026d3', '700': '#a21caf', '800': '#86198f', '900': '#701a75', '950': '#4a044e' },
  pink: { '50': '#fdf2f8', '100': '#fce7f3', '200': '#fbcfe8', '300': '#f9a8d4', '400': '#f472b6', '500': '#ec4899', '600': '#db2777', '700': '#be185d', '800': '#9d174d', '900': '#831843', '950': '#500724' },
  rose: { '50': '#fff1f2', '100': '#ffe4e6', '200': '#fecdd3', '300': '#fda4af', '400': '#fb7185', '500': '#f43f5e', '600': '#e11d48', '700': '#be123c', '800': '#9f1239', '900': '#881337', '950': '#4c0519' },
};

const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

const calculateDistance = (rgb1: { r: number, g: number, b: number }, rgb2: { r: number, g: number, b: number }) => {
  return Math.sqrt(
    Math.pow(rgb1.r - rgb2.r, 2) +
    Math.pow(rgb1.g - rgb2.g, 2) +
    Math.pow(rgb1.b - rgb2.b, 2)
  );
};

export function ColorToTailwind({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [color, setColor] = useState(initialData?.color || '#6366f1');
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    onStateChange?.({ color });
  }, [color, onStateChange]);

  const handleRandom = useCallback(() => {
    setColor(getSecureRandomColor());
  }, []);

  const nearestMatches = useMemo(() => {
    const inputRgb = hexToRgb(color);
    if (!inputRgb) return [];

    const matches: { name: string, weight: string, hex: string, distance: number }[] = [];

    Object.entries(TAILWIND_COLORS).forEach(([name, weights]) => {
      Object.entries(weights).forEach(([weight, hex]) => {
        const rgb = hexToRgb(hex);
        if (rgb) {
          matches.push({
            name,
            weight,
            hex,
            distance: calculateDistance(inputRgb, rgb)
          });
        }
      });
    });

    return matches.sort((a, b) => a.distance - b.distance).slice(0, 8);
  }, [color]);

  const handleCopy = useCallback((val: string) => {
    navigator.clipboard.writeText(val);
    setCopied(val);
    toast.success(t('common.copied'));
    setTimeout(() => setCopied(null), 2000);
  }, [t]);

  const handlersRef = useRef({
    handleRandom,
    handleCopy,
    nearestMatches
  });

  useEffect(() => {
    handlersRef.current = {
      handleRandom,
      handleCopy,
      nearestMatches
    };
  }, [handleRandom, handleCopy, nearestMatches]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isEditable =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement instanceof HTMLSelectElement ||
        activeElement?.getAttribute("contenteditable") === "true";

      if (isEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      const { handleRandom, handleCopy, nearestMatches } = handlersRef.current;

      if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        handleRandom();
      } else if (e.key.toLowerCase() === 'c') {
        if (nearestMatches.length > 0) {
          e.preventDefault();
          const first = nearestMatches[0];
          handleCopy(`${first.name}-${first.weight}`);
        }
      } else if (e.key.toLowerCase() === 'h') {
        if (nearestMatches.length > 0) {
          e.preventDefault();
          handleCopy(nearestMatches[0].hex);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
              <Palette className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-xl font-black dark:text-white">{t('colortotailwind.select_color', 'Select Color')}</h3>
          </div>

          <div className="flex flex-col gap-4">
            <div className="relative group">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full h-32 rounded-3xl cursor-pointer border-4 border-white dark:border-slate-800 shadow-xl"
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="px-4 py-2 bg-black/50 backdrop-blur-md rounded-full text-white font-mono font-bold text-lg">
                  {color.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-mono text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  placeholder="#000000"
                />
                <div className="absolute inset-y-0 right-3 flex items-center">
                  <Search className="w-4 h-4 text-slate-400" />
                </div>
              </div>
              <button
                onClick={handleRandom}
                className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none flex items-center gap-2 group"
                title={`${t('common.random', 'Random')} (R)`}
              >
                <RefreshCcw className="w-5 h-5 text-slate-500 group-hover:rotate-180 transition-transform duration-500" />
                <Kbd modifier={null} className="hidden lg:inline-flex border-slate-200 dark:border-slate-700 text-slate-400">R</Kbd>
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
              <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-xl font-black dark:text-white">{t('colortotailwind.nearest_matches', 'Nearest Matches')}</h3>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {nearestMatches.map((match, i) => {
              const className = `${match.name}-${match.weight}`;
              return (
                <div
                  key={i}
                  className="group flex items-center justify-between p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl hover:border-indigo-500/30 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-xl shadow-inner border border-black/5"
                      style={{ backgroundColor: match.hex }}
                    />
                    <div>
                      <div className="font-bold dark:text-white">{className}</div>
                      <div className="text-xs font-mono text-slate-400">{match.hex.toUpperCase()}</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCopy(className)}
                      className={`p-2 rounded-lg transition-all flex items-center gap-1 ${copied === className ? 'bg-emerald-50 text-emerald-600' : 'text-slate-400 hover:bg-slate-50 hover:text-indigo-600'}`}
                      title={`${t('common.copy_class', 'Copy Class')}${i === 0 ? ' (C)' : ''}`}
                    >
                      {copied === className ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {i === 0 && !copied && <Kbd modifier={null} className="hidden sm:inline-flex border-slate-200 dark:border-slate-700 text-slate-400 h-4 min-w-[1.25rem] px-1 text-[10px]">C</Kbd>}
                    </button>
                    <button
                      onClick={() => handleCopy(match.hex)}
                      className={`p-2 rounded-lg transition-all flex items-center gap-1 ${copied === match.hex ? 'bg-emerald-50 text-emerald-600' : 'text-slate-400 hover:bg-slate-50 hover:text-indigo-600'}`}
                      title={`${t('common.copy_hex', 'Copy HEX')}${i === 0 ? ' (H)' : ''}`}
                    >
                      <span className="text-[10px] font-bold">HEX</span>
                      {i === 0 && !copied && <Kbd modifier={null} className="hidden sm:inline-flex border-slate-200 dark:border-slate-700 text-slate-400 h-4 min-w-[1.25rem] px-1 text-[10px]">H</Kbd>}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-12 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" /> {t('colortotailwind.how_it_works', 'How it works')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('colortotailwind.how_text', 'This tool calculates the Euclidean distance between your selected color and every color in the default Tailwind CSS palette (v3). The closest matches are displayed above.')}
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-500" /> {t('colortotailwind.usage_title', 'Usage')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('colortotailwind.usage_text', 'Use the color picker or enter a hex code. You can copy the Tailwind class name (e.g., bg-blue-500) or the exact hex value of the Tailwind match.')}
          </p>
        </div>
      </div>
    </div>
  );
}
