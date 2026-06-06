import React, { useState, useMemo, useEffect } from 'react';
import { Layers, Copy, Check, Info, Settings2, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function SoftShadowGenerator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [layers, setLayers] = useState(initialData?.layers || 6);
  const [transparency, setTransparency] = useState(initialData?.transparency || 0.07);
  const [blur, setBlur] = useState(initialData?.blur || 100);
  const [spread, setSpread] = useState(initialData?.spread || 0);
  const [color, setColor] = useState(initialData?.color || '#000000');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ layers, transparency, blur, spread, color });
  }, [layers, transparency, blur, spread, color, onStateChange]);

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
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setLayers(6);
    setTransparency(0.07);
    setBlur(100);
    setSpread(0);
    setColor('#000000');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Controls */}
        <div className="space-y-8 bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-indigo-500" /> {t('common.options')}
            </h3>
            <button
              onClick={handleReset}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors"
            >
              <RefreshCw className="w-3 h-3" /> {t('common.reset')}
            </button>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <label className="text-sm font-bold dark:text-white">{t('softshadow.layers')}</label>
                <span className="text-sm font-mono text-indigo-600 dark:text-indigo-400">{layers}</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={layers}
                onChange={(e) => setLayers(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <label className="text-sm font-bold dark:text-white">{t('softshadow.transparency')}</label>
                <span className="text-sm font-mono text-indigo-600 dark:text-indigo-400">{transparency.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.01"
                max="0.5"
                step="0.01"
                value={transparency}
                onChange={(e) => setTransparency(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <label className="text-sm font-bold dark:text-white">{t('softshadow.blur')}</label>
                <span className="text-sm font-mono text-indigo-600 dark:text-indigo-400">{blur}px</span>
              </div>
              <input
                type="range"
                min="1"
                max="250"
                step="1"
                value={blur}
                onChange={(e) => setBlur(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <label className="text-sm font-bold dark:text-white">{t('softshadow.spread')}</label>
                <span className="text-sm font-mono text-indigo-600 dark:text-indigo-400">{spread}px</span>
              </div>
              <input
                type="range"
                min="-50"
                max="50"
                step="1"
                value={spread}
                onChange={(e) => setSpread(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-bold dark:text-white">{t('common.color')}</label>
              <div className="flex gap-4 items-center">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-12 h-12 rounded-xl cursor-pointer border-4 border-white dark:border-slate-800 shadow-sm"
                />
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="flex-1 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-sm dark:text-white uppercase"
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
          <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-500" /> CSS Code
          </label>
          <button
            onClick={handleCopy}
            className={`text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-2 border ${
              copied
                ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                : "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 border-transparent"
            }`}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? t('common.copied') : t('common.copy')}
          </button>
        </div>
        <div className="p-8 bg-slate-900 rounded-[2.5rem] font-mono text-sm leading-relaxed text-indigo-300 border border-slate-800 overflow-x-auto">
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
