import { useState, useEffect, useCallback, useMemo } from 'react';
import { Palette, Table, Info, Plus, Trash2, Check, X, Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function ColorContrastMatrix({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [colors, setColors] = useState<string[]>(initialData?.colors || ['#FFFFFF', '#000000', '#4F46E5', '#10B981', '#F59E0B']);
  const [newColor, setNewColor] = useState('#6366F1');

  useEffect(() => {
    onStateChange?.({ colors });
  }, [colors, onStateChange]);

  const addColor = () => {
    if (/^#[0-9A-F]{6}$/i.test(newColor)) {
      setColors(prev => Array.from(new Set([...prev, newColor.toUpperCase()])));
    }
  };

  const removeColor = (idx: number) => {
    setColors(prev => prev.filter((_, i) => i !== idx));
  };

  const getLuminance = (hex: string) => {
    const rgb = hex.substring(1).match(/.{2}/g)?.map(x => parseInt(x, 16) / 255) || [0, 0, 0];
    const res = rgb.map(v => {
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * res[0] + 0.7152 * res[1] + 0.0722 * res[2];
  };

  const getContrast = (hex1: string, hex2: string) => {
    const l1 = getLuminance(hex1);
    const l2 = getLuminance(hex2);
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    return ratio;
  };

  const getCompliance = (ratio: number) => {
    return {
      aa: ratio >= 4.5,
      aaa: ratio >= 7,
      aaLarge: ratio >= 3
    };
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Color List */}
        <div className="w-full md:w-80 space-y-6 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 px-1">
            <Palette className="w-4 h-4 text-indigo-500" />
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{t('contrastmatrix.colors', 'Color Palette')}</h3>
          </div>

          <div className="space-y-2">
            {colors.map((c, i) => (
              <div key={i} className="flex items-center gap-2 group">
                <div className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm" style={{ backgroundColor: c }} />
                <div className="flex-1 font-mono font-bold text-sm dark:text-slate-300">{c}</div>
                <button onClick={() => removeColor(i)} className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-rose-500 transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex gap-2">
            <input
              type="color"
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
              className="w-12 h-12 rounded-xl border-0 p-0 overflow-hidden cursor-pointer"
            />
            <input
              type="text"
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
              className="flex-1 min-w-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 font-mono font-bold text-sm uppercase outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
            <button
              onClick={addColor}
              className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/20"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Matrix */}
        <div className="flex-1 w-full bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] overflow-hidden shadow-sm overflow-x-auto">
          <div className="bg-slate-50 dark:bg-slate-900/50 px-8 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
             <Table className="w-5 h-5 text-indigo-500" />
             <span className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-xs">{t('contrastmatrix.matrix', 'Contrast Matrix')}</span>
          </div>
          <div className="p-4">
            <table className="border-collapse mx-auto">
                <thead>
                    <tr>
                        <th className="p-2"></th>
                        {colors.map((c, i) => (
                            <th key={i} className="p-2 min-w-[100px] text-center">
                                <div className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 mx-auto mb-1" style={{ backgroundColor: c }} />
                                <div className="text-[9px] font-black uppercase text-slate-400 font-mono">{c}</div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {colors.map((bg, i) => (
                        <tr key={i}>
                            <th className="p-2 text-right">
                                <div className="flex items-center gap-2 justify-end">
                                    <span className="text-[9px] font-black uppercase text-slate-400 font-mono">{bg}</span>
                                    <div className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700" style={{ backgroundColor: bg }} />
                                </div>
                            </th>
                            {colors.map((fg, j) => {
                                if (i === j) return <td key={j} className="p-1"><div className="w-full h-full bg-slate-50 dark:bg-slate-800/50 rounded-xl" /></td>;
                                const ratio = getContrast(fg, bg);
                                const comp = getCompliance(ratio);
                                return (
                                    <td key={j} className="p-1">
                                        <div className="p-3 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2 group hover:border-indigo-500/50 transition-all text-center">
                                            <div className="text-sm font-black font-mono" style={{ color: fg === bg ? 'transparent' : fg }}>Aa</div>
                                            <div className="text-lg font-black font-mono">{ratio.toFixed(2)}:1</div>
                                            <div className="flex justify-center gap-1">
                                                <div title="AA" className={`w-5 h-5 rounded-md flex items-center justify-center text-[8px] font-black ${comp.aa ? 'bg-emerald-500 text-white' : 'bg-rose-100 text-rose-500 dark:bg-rose-900/30'}`}>AA</div>
                                                <div title="AAA" className={`w-5 h-5 rounded-md flex items-center justify-center text-[8px] font-black ${comp.aaa ? 'bg-emerald-500 text-white' : 'bg-rose-100 text-rose-500 dark:bg-rose-900/30'}`}>AAA</div>
                                            </div>
                                        </div>
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-16 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" /> {t('contrastmatrix.what_is_title', 'What is Contrast Matrix?')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('contrastmatrix.what_is_text', 'This tool compares all colors in your palette against each other as text (foreground) and background. It helps you design accessible interfaces where any combination of your brand colors is readable.')}
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Eye className="w-4 h-4 text-indigo-500" /> {t('contrastmatrix.wcag_title', 'WCAG 2.1 Standards')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('contrastmatrix.wcag_text', 'AA level requires 4.5:1 for normal text. AAA level requires 7:1. UI components and large text (18pt+) require 3:1.')}
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Check className="w-4 h-4 text-indigo-500" /> {t('contrastmatrix.tips_title', 'Design Tip')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('contrastmatrix.tips_text', 'Use a matrix to define which pairings are allowed in your design system. Green cells indicate pairings that are safe to use for all users.')}
          </p>
        </div>
      </div>
    </div>
  );
}
