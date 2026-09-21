import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Layers, Copy, Check, Info, Sliders, Palette, Monitor, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

interface ShadowPreset {
  id: string;
  name: string;
  css: string;
  tailwind: string;
}

const PRESETS: ShadowPreset[] = [
  { id: 'soft', name: 'Soft Elevation', css: 'box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);', tailwind: 'shadow-[0_4px_20px_rgba(0,0,0,0.08)]' },
  { id: 'floating', name: 'Floating', css: 'box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12);', tailwind: 'shadow-[0_10px_40px_rgba(0,0,0,0.12)]' },
  { id: 'dreamy', name: 'Dreamy Glow', css: 'box-shadow: 0 15px 50px rgba(99, 102, 241, 0.15);', tailwind: 'shadow-[0_15px_50px_rgba(99,102,241,0.15)]' },
  { id: 'sharp', name: 'Sharp Depth', css: 'box-shadow: 0 8px 0px rgba(0, 0, 0, 0.05), 0 15px 25px rgba(0, 0, 0, 0.1);', tailwind: 'shadow-[0_8px_0px_rgba(0,0,0,0.05),0_15px_25px_rgba(0,0,0,0.1)]' },
  { id: 'inner', name: 'Soft Inset', css: 'box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.1);', tailwind: 'shadow-[inset_0_2px_10px_rgba(0,0,0,0.1)]' },
  { id: 'neon', name: 'Neon Indigo', css: 'box-shadow: 0 0 15px rgba(99, 102, 241, 0.4), 0 0 30px rgba(99, 102, 241, 0.2);', tailwind: 'shadow-[0_0_15px_rgba(99,102,241,0.4),0_0_30px_rgba(99,102,241,0.2)]' },
  { id: 'layered', name: 'Multi-Layered', css: 'box-shadow: 0 1px 1px rgba(0,0,0,0.08), 0 2px 2px rgba(0,0,0,0.08), 0 4px 4px rgba(0,0,0,0.08), 0 8px 8px rgba(0,0,0,0.08), 0 16px 16px rgba(0,0,0,0.08);', tailwind: 'shadow-[0_1px_1px_rgba(0,0,0,0.08),0_2px_2px_rgba(0,0,0,0.08),0_4px_4px_rgba(0,0,0,0.08),0_8px_8px_rgba(0,0,0,0.08),0_16px_16px_rgba(0,0,0,0.08)]' },
  { id: 'heavy', name: 'Heavy Drop', css: 'box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);', tailwind: 'shadow-2xl' },
  { id: 'glass', name: 'Glass Border', css: 'box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37); border: 1px solid rgba(255, 255, 255, 0.18)', tailwind: 'shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] border border-white/20' },
  { id: 'button', name: 'Interactive Button', css: 'box-shadow: 0 2px 4px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.1);', tailwind: 'shadow-sm' },
  { id: 'ring', name: 'Focused Ring', css: 'box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.2);', tailwind: 'shadow-[0_0_0_4px_rgba(99,102,241,0.2)]' },
  { id: 'clay', name: 'Claymorphism', css: 'box-shadow: 10px 10px 20px rgba(0,0,0,0.1), inset -5px -5px 10px rgba(0,0,0,0.1), inset 5px 5px 10px rgba(255,255,255,0.5);', tailwind: 'shadow-[10px_10px_20px_rgba(0,0,0,0.1),inset_-5px_-5px_10px_rgba(0,0,0,0.1),inset_5px_5px_10px_rgba(255,255,255,0.5)]' }
];

const DEFAULT_STATE = {
  baseColor: '#6366f1',
  bgColor: 'bg-white',
  previewScale: 1,
};

export function CSSShadowPalette({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [baseColor, setBaseColor] = useState(initialData?.baseColor || DEFAULT_STATE.baseColor);
  const [bgColor, setBgColor] = useState(initialData?.bgColor || DEFAULT_STATE.bgColor);
  const [previewScale, setPreviewScale] = useState(initialData?.previewScale || DEFAULT_STATE.previewScale);

  const containerRef = useRef<HTMLDivElement>(null);
  const primaryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    onStateChange?.({ baseColor, bgColor, previewScale });
  }, [baseColor, bgColor, previewScale, onStateChange]);

  const hexToRgb = useCallback((hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
      : 'rgba(99, 102, 241';
  }, []);

  const getCustomShadow = useCallback((preset: ShadowPreset) => {
    return preset.css.replace(/rgba\(99, 102, 241/g, hexToRgb(baseColor));
  }, [baseColor, hexToRgb]);

  const handleCopy = useCallback((id: string, text: string, name: string, type: 'CSS' | 'Tailwind') => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success(`Copied ${type} for ${name}!`);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const handleReset = useCallback(() => {
    setBaseColor(DEFAULT_STATE.baseColor);
    setBgColor(DEFAULT_STATE.bgColor);
    setPreviewScale(DEFAULT_STATE.previewScale);
    toast.success('CSS shadow parameters reset');
    primaryInputRef.current?.focus();
  }, []);

  const handlersRef = useRef({ handleReset, handleCopy, getCustomShadow });
  useEffect(() => {
    handlersRef.current = { handleReset, handleCopy, getCustomShadow };
  }, [handleReset, handleCopy, getCustomShadow]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isEditable =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        (activeElement as HTMLElement)?.isContentEditable;

      const isBodyOrComponent =
        !activeElement ||
        activeElement === document.body ||
        containerRef.current?.contains(activeElement as Node);

      if (e.key === 'Escape' && isBodyOrComponent) {
        e.preventDefault();
        handlersRef.current.handleReset();
        return;
      }

      if ((e.key === 'c' || e.key === 'C') && !e.metaKey && !e.ctrlKey && !e.altKey) {
        if (!isEditable && isBodyOrComponent) {
          e.preventDefault();
          const firstPreset = PRESETS[0];
          const css = handlersRef.current.getCustomShadow(firstPreset);
          handlersRef.current.handleCopy(`${firstPreset.id}-css`, css, firstPreset.name, 'CSS');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div ref={containerRef} className="max-w-6xl mx-auto space-y-8">
      {/* Action Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
          <Layers className="w-4 h-4 text-indigo-500" aria-hidden="true" /> CSS Shadow Palette
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3.5 py-1.5 rounded-xl flex items-center gap-2 transition-all focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
          aria-label="Réinitialiser les paramètres d'ombre CSS (Esc)"
        >
          <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
          Réinitialiser
          <Kbd modifier={null} className="hidden sm:inline-flex bg-rose-100 dark:bg-rose-900/30 border-rose-200 dark:border-rose-800 text-rose-500">Esc</Kbd>
        </button>
      </div>

      {/* Controls */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <Palette className="w-3 h-3 text-indigo-500" aria-hidden="true" /> {t('shadowpalette.color_config')}
          </div>
          <div className="flex items-center gap-4">
            <input
              id="shadow-base-color-picker"
              type="color"
              value={baseColor}
              aria-label="Select base shadow color"
              onChange={(e) => setBaseColor(e.target.value)}
              className="w-12 h-12 rounded-xl cursor-pointer bg-white border-2 border-slate-200 p-1"
            />
            <div className="flex-1">
              <label htmlFor="shadow-base-color-text" className="text-xs font-bold text-slate-500 mb-1 block cursor-pointer">
                {t('shadowpalette.base_color')}
              </label>
              <input
                id="shadow-base-color-text"
                ref={primaryInputRef}
                type="text"
                value={baseColor}
                onChange={(e) => setBaseColor(e.target.value)}
                className="w-full text-sm font-mono font-black text-indigo-500 uppercase bg-transparent border-b border-slate-300 dark:border-slate-700 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <Monitor className="w-3 h-3 text-indigo-500" aria-hidden="true" /> {t('shadowpalette.preview_theme')}
          </div>
          <div className="flex gap-2 items-center h-12">
            {[
              { id: 'bg-white', color: '#ffffff', label: 'White' },
              { id: 'bg-slate-50', color: '#f8fafc', label: 'Light Slate' },
              { id: 'bg-slate-100', color: '#f1f5f9', label: 'Medium Slate' },
              { id: 'bg-slate-900', color: '#0f172a', label: 'Dark Slate' },
              { id: 'bg-indigo-600', color: '#4f46e5', label: 'Indigo' },
            ].map((theme) => (
              <button
                key={theme.id}
                type="button"
                onClick={() => setBgColor(theme.id)}
                aria-pressed={bgColor === theme.id}
                aria-label={`Preview background theme: ${theme.label}`}
                className={`w-8 h-8 rounded-full border-2 transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                  bgColor === theme.id ? 'border-indigo-500 scale-110 shadow-lg' : 'border-transparent hover:scale-105'
                }`}
                style={{ backgroundColor: theme.color }}
                title={theme.label}
              />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <label htmlFor="shadow-zoom-slider" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 cursor-pointer">
              <Sliders className="w-3 h-3 text-indigo-500" aria-hidden="true" /> {t('shadowpalette.zoom')}
            </label>
            <span className="text-xs font-mono text-indigo-500 font-bold">{Math.round(previewScale * 100)}%</span>
          </div>
          <input
            id="shadow-zoom-slider"
            type="range"
            min="0.5"
            max="1.5"
            step="0.1"
            value={previewScale}
            aria-valuemin={0.5}
            aria-valuemax={1.5}
            aria-valuenow={previewScale}
            aria-label="Zoom scale level"
            onChange={(e) => setPreviewScale(parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {PRESETS.map((preset) => {
          const customCss = getCustomShadow(preset);
          return (
            <div key={preset.id} className="group flex flex-col h-full bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 overflow-hidden transition-all hover:border-indigo-500/30">
              <div className={`h-48 flex items-center justify-center relative overflow-hidden transition-colors ${bgColor}`}>
                <div
                  className="w-24 h-24 bg-white dark:bg-slate-800 rounded-2xl transition-all duration-500 group-hover:scale-110"
                  style={{
                    ...(customCss.split(';').reduce((acc, rule) => {
                      const [prop, val] = rule.split(':');
                      if (prop && val) {
                        const camelProp = prop.trim().replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                        (acc as any)[camelProp] = val.trim();
                      }
                      return acc;
                    }, {})),
                    transform: `scale(${previewScale})`,
                  }}
                />
              </div>

              <div className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <h3 className="font-black text-slate-700 dark:text-white uppercase tracking-tighter">{preset.name}</h3>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopy(`${preset.id}-css`, customCss, preset.name, 'CSS')}
                      className={`p-2 rounded-xl transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                        copiedId === `${preset.id}-css`
                          ? 'bg-emerald-500 text-white'
                          : 'bg-white dark:bg-slate-800 text-slate-400 hover:text-indigo-500 border border-slate-200 dark:border-slate-700'
                      }`}
                      aria-label={`Copy CSS for ${preset.name}`}
                      title={`Copy CSS for ${preset.name}`}
                    >
                      {copiedId === `${preset.id}-css` ? <Check className="w-4 h-4" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopy(`${preset.id}-tw`, preset.tailwind, preset.name, 'Tailwind')}
                      className={`p-2 rounded-xl transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                        copiedId === `${preset.id}-tw`
                          ? 'bg-emerald-500 text-white'
                          : 'bg-white dark:bg-slate-800 text-slate-400 hover:text-indigo-500 border border-slate-200 dark:border-slate-700'
                      }`}
                      aria-label={`Copy Tailwind class for ${preset.name}`}
                      title={`Copy Tailwind class for ${preset.name}`}
                    >
                      <div className="w-4 h-4 font-black text-[10px] flex items-center justify-center">TW</div>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="p-3 bg-slate-100 dark:bg-slate-950 rounded-xl font-mono text-[10px] text-slate-500 break-all h-12 overflow-hidden line-clamp-2 leading-relaxed">
                    {customCss}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <Info className="w-6 h-6" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('shadowpalette.about_title')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('shadowpalette.about_text')}
          </p>
        </div>
      </div>
    </div>
  );
}
