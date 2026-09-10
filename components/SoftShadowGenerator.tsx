import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Layers, Copy, Check, Info, Settings2, RefreshCw, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

export function SoftShadowGenerator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [layers, setLayers] = useState(initialData?.layers || 6);
  const [transparency, setTransparency] = useState(initialData?.transparency || 0.07);
  const [blur, setBlur] = useState(initialData?.blur || 100);
  const [spread, setSpread] = useState(initialData?.spread || 0);
  const [color, setColor] = useState(initialData?.color || '#000000');
  const [copied, setCopied] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const layersInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    onStateChange?.({ layers, transparency, blur, spread, color });
  }, [layers, transparency, blur, spread, color, onStateChange]);

  const presets = [
    {
      name: t('softshadow.subtle_elevation'),
      layers: 4,
      transparency: 0.05,
      blur: 40,
      spread: 0,
      color: '#000000'
    },
    {
      name: t('softshadow.smooth_float'),
      layers: 6,
      transparency: 0.07,
      blur: 100,
      spread: 0,
      color: '#000000'
    },
    {
      name: t('softshadow.deep_glow'),
      layers: 8,
      transparency: 0.12,
      blur: 160,
      spread: 5,
      color: '#4f46e5'
    },
    {
      name: t('softshadow.sharp_layered'),
      layers: 5,
      transparency: 0.15,
      blur: 25,
      spread: -2,
      color: '#0f172a'
    }
  ];

  const shadowString = useMemo(() => {
    const shadows = [];
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : { r: 0, g: 0, b: 0 };
    };

    const rgb = hexToRgb(color);

    for (let i = 1; i <= layers; i++) {
      const ratio = i / layers;
      const x = 0;
      const y = Math.round(Math.pow(ratio, 2) * blur);
      const b = Math.round(Math.pow(ratio, 2) * blur);
      const s = spread ? Math.round(ratio * spread) : 0;
      const a = (Math.pow(1 - ratio, 2) * transparency).toFixed(3);
      shadows.push(`${x}px ${y}px ${b}px ${s}px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${a})`);
    }
    return shadows.join(',\n  ');
  }, [layers, transparency, blur, spread, color]);

  const handleCopy = () => {
    navigator.clipboard.writeText(`box-shadow: ${shadowString};`);
    setCopied(true);
    toast.success(t('softshadow.copied_msg'));
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setLayers(6);
    setTransparency(0.07);
    setBlur(100);
    setSpread(0);
    setColor('#000000');
    toast.success(t('softshadow.reset_msg'));
    layersInputRef.current?.focus();
  };

  const applyPreset = (preset: typeof presets[0]) => {
    setLayers(preset.layers);
    setTransparency(preset.transparency);
    setBlur(preset.blur);
    setSpread(preset.spread);
    setColor(preset.color);
    toast.success(t('softshadow.preset_applied', { name: preset.name }));
  };

  const handlersRef = useRef({ handleReset, handleCopy });
  useEffect(() => {
    handlersRef.current = { handleReset, handleCopy };
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      if (
        containerRef.current &&
        !containerRef.current.contains(activeElement) &&
        activeElement !== document.body
      ) {
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        handlersRef.current.handleReset();
      } else if ((e.key === 'c' || e.key === 'C') && !e.metaKey && !e.ctrlKey) {
        const isEditingText =
          activeElement instanceof HTMLInputElement && activeElement.type === 'text';
        if (!isEditingText) {
          e.preventDefault();
          handlersRef.current.handleCopy();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div ref={containerRef} className="max-w-6xl mx-auto space-y-12">
      {/* Quick Presets */}
      <div className="space-y-3">
        <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" /> {t('softshadow.presets')}
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {presets.map((preset) => (
            <button
              key={preset.name}
              onClick={() => applyPreset(preset)}
              className="p-3 text-left bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 rounded-xl transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <div className="text-xs font-bold text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {preset.name}
              </div>
              <div className="text-[10px] text-slate-400 mt-1 font-mono">
                {preset.layers}L • {preset.blur}px blur
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Controls */}
        <div className="space-y-8 bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-indigo-500" /> {t('common.options')}
            </h3>
            <button
              onClick={handleReset}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg px-2 py-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>{t('common.reset')}</span>
              <Kbd modifier={null}>Esc</Kbd>
            </button>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <label htmlFor="layers-slider" className="text-sm font-bold dark:text-white">
                  {t('softshadow.layers')}
                </label>
                <span className="text-sm font-mono text-indigo-600 dark:text-indigo-400">{layers}</span>
              </div>
              <input
                ref={layersInputRef}
                id="layers-slider"
                type="range"
                min="1"
                max="10"
                step="1"
                value={layers}
                aria-valuemin={1}
                aria-valuemax={10}
                aria-valuenow={layers}
                aria-label={t('softshadow.layers')}
                onChange={(e) => setLayers(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <label htmlFor="transparency-slider" className="text-sm font-bold dark:text-white">
                  {t('softshadow.transparency')}
                </label>
                <span className="text-sm font-mono text-indigo-600 dark:text-indigo-400">{transparency.toFixed(2)}</span>
              </div>
              <input
                id="transparency-slider"
                type="range"
                min="0.01"
                max="0.5"
                step="0.01"
                value={transparency}
                aria-valuemin={0.01}
                aria-valuemax={0.5}
                aria-valuenow={transparency}
                aria-label={t('softshadow.transparency')}
                onChange={(e) => setTransparency(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <label htmlFor="blur-slider" className="text-sm font-bold dark:text-white">
                  {t('softshadow.blur')}
                </label>
                <span className="text-sm font-mono text-indigo-600 dark:text-indigo-400">{blur}px</span>
              </div>
              <input
                id="blur-slider"
                type="range"
                min="1"
                max="250"
                step="1"
                value={blur}
                aria-valuemin={1}
                aria-valuemax={250}
                aria-valuenow={blur}
                aria-label={t('softshadow.blur')}
                onChange={(e) => setBlur(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <label htmlFor="spread-slider" className="text-sm font-bold dark:text-white">
                  {t('softshadow.spread')}
                </label>
                <span className="text-sm font-mono text-indigo-600 dark:text-indigo-400">{spread}px</span>
              </div>
              <input
                id="spread-slider"
                type="range"
                min="-50"
                max="50"
                step="1"
                value={spread}
                aria-valuemin={-50}
                aria-valuemax={50}
                aria-valuenow={spread}
                aria-label={t('softshadow.spread')}
                onChange={(e) => setSpread(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              />
            </div>

            <div className="space-y-3">
              <label htmlFor="color-hex" className="text-sm font-bold dark:text-white">
                {t('common.color')}
              </label>
              <div className="flex gap-4 items-center">
                <input
                  id="color-picker"
                  type="color"
                  value={color}
                  aria-label={t('common.color')}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-12 h-12 rounded-xl cursor-pointer border-4 border-white dark:border-slate-800 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                />
                <input
                  id="color-hex"
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="flex-1 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-sm dark:text-white uppercase focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-8 flex flex-col">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">
            {t('common.result')}
          </h3>
          <div className="flex-1 min-h-[300px] bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 flex items-center justify-center p-12">
            <div
              className="w-48 h-48 bg-white dark:bg-slate-800 rounded-[2rem] transition-all duration-300"
              style={{ boxShadow: shadowString }}
            />
          </div>
        </div>
      </div>

      {/* Code Output */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <label htmlFor="css-code-output" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-500" /> CSS Code
          </label>
          <button
            onClick={handleCopy}
            className={`text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-2 border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
              copied
                ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                : "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 border-transparent"
            }`}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? t('common.copied') : t('common.copy')}</span>
            <Kbd modifier={null} className={copied ? 'bg-emerald-200 text-emerald-800 dark:bg-emerald-800 dark:text-emerald-100' : 'bg-indigo-700 text-indigo-100'}>C</Kbd>
          </button>
        </div>
        <div id="css-code-output" className="p-8 bg-slate-900 rounded-[2.5rem] font-mono text-sm leading-relaxed text-indigo-300 border border-slate-800 overflow-x-auto">
          <pre>
            {`box-shadow: ${shadowString};`}
          </pre>
        </div>
      </div>

      {/* Info */}
      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <Info className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('softshadow.about_title')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('softshadow.about_text')}
          </p>
        </div>
      </div>
    </div>
  );
}
