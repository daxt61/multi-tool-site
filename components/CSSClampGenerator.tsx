import { useState, useEffect, useMemo } from 'react';
import { Copy, Check, Info, Settings2, Maximize2, Monitor } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function CSSClampGenerator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [minViewport, setMinViewport] = useState(initialData?.minViewport || 320);
  const [maxViewport, setMaxViewport] = useState(initialData?.maxViewport || 1200);
  const [minValue, setMinValue] = useState(initialData?.minValue || 16);
  const [maxValue, setMaxValue] = useState(initialData?.maxValue || 48);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ minViewport, maxViewport, minValue, maxValue });
  }, [minViewport, maxViewport, minValue, maxValue, onStateChange]);

  const clampValue = useMemo(() => {
    const minV = Number(minViewport);
    const maxV = Number(maxViewport);
    const minS = Number(minValue);
    const maxS = Number(maxValue);

    if (isNaN(minV) || isNaN(maxV) || isNaN(minS) || isNaN(maxS) || maxV === minV) {
      return 'clamp(0px, 0vw, 0px)';
    }

    const slope = (maxS - minS) / (maxV - minV);
    const yIntersection = -minV * slope + minS;
    const slopeVw = (slope * 100).toFixed(3);
    const intersectionRem = (yIntersection / 16).toFixed(3);
    const minRem = (minS / 16).toFixed(3);
    const maxRem = (maxS / 16).toFixed(3);

    return `clamp(${minRem}rem, ${intersectionRem}rem + ${slopeVw}vw, ${maxRem}rem)`;
  }, [minViewport, maxViewport, minValue, maxValue]);

  const handleCopy = () => {
    navigator.clipboard.writeText(clampValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="flex items-center gap-2 px-1">
              <Monitor className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{t('cssclamp.viewport_range')}</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="min-viewport" className="text-[10px] font-bold text-slate-400 uppercase">Min (px)</label>
                <input
                  id="min-viewport"
                  type="number"
                  value={minViewport}
                  onChange={(e) => setMinViewport(Number(e.target.value))}
                  className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-black focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="max-viewport" className="text-[10px] font-bold text-slate-400 uppercase">Max (px)</label>
                <input
                  id="max-viewport"
                  type="number"
                  value={maxViewport}
                  onChange={(e) => setMaxViewport(Number(e.target.value))}
                  className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-black focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all dark:text-white"
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-2 px-1">
              <Maximize2 className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{t('cssclamp.value_range')}</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="min-value" className="text-[10px] font-bold text-slate-400 uppercase">Min (px)</label>
                <input
                  id="min-value"
                  type="number"
                  value={minValue}
                  onChange={(e) => setMinValue(Number(e.target.value))}
                  className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-black focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="max-value" className="text-[10px] font-bold text-slate-400 uppercase">Max (px)</label>
                <input
                  id="max-value"
                  type="number"
                  value={maxValue}
                  onChange={(e) => setMaxValue(Number(e.target.value))}
                  className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-black focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
            {t('common.result')}
          </div>
          <button
            onClick={handleCopy}
            className={`text-xs font-bold px-6 py-2 rounded-xl transition-all flex items-center gap-2 border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
              copied
                ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                : "bg-indigo-600 text-white border-transparent shadow-lg shadow-indigo-600/20 hover:bg-indigo-700"
            }`}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? t('common.copied') : t('common.copy')}
          </button>
        </div>
        <div className="p-8 bg-slate-900 text-indigo-300 border border-slate-800 rounded-[2.5rem] font-mono text-lg md:text-xl leading-relaxed text-center break-all">
          {clampValue}
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <Info className="w-6 h-6 text-indigo-500 mt-1" />
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('cssclamp.about_title')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('cssclamp.about_text')}
          </p>
        </div>
      </div>
    </div>
  );
}
