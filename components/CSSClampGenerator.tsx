import { useState, useMemo, useEffect } from 'react';
import { Copy, Check, RotateCcw, Info, Maximize, MousePointer2, Monitor, Layout } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function CSSClampGenerator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [minSize, setMinSize] = useState(initialData?.minSize || 16);
  const [maxSize, setMaxSize] = useState(initialData?.maxSize || 48);
  const [minViewport, setMinViewport] = useState(initialData?.minViewport || 320);
  const [maxViewport, setMaxViewport] = useState(initialData?.maxViewport || 1280);
  const [useRem, setUseRem] = useState(initialData?.useRem ?? true);
  const [baseFontSize, setBaseFontSize] = useState(initialData?.baseFontSize || 16);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ minSize, maxSize, minViewport, maxViewport, useRem, baseFontSize });
  }, [minSize, maxSize, minViewport, maxViewport, useRem, baseFontSize, onStateChange]);

  const clampResult = useMemo(() => {
    const minS = parseFloat(minSize.toString());
    const maxS = parseFloat(maxSize.toString());
    const minV = parseFloat(minViewport.toString());
    const maxV = parseFloat(maxViewport.toString());

    if (isNaN(minS) || isNaN(maxS) || isNaN(minV) || isNaN(maxV) || minV === maxV) {
      return '';
    }

    const slope = (maxS - minS) / (maxV - minV);
    const yIntersection = -minV * slope + minS;

    const toFixed = (num: number) => {
      return parseFloat(num.toFixed(4));
    };

    if (useRem) {
      const minRem = toFixed(minS / baseFontSize);
      const maxRem = toFixed(maxS / baseFontSize);
      const yRem = toFixed(yIntersection / baseFontSize);
      const slopeVw = toFixed(slope * 100);

      return `clamp(${minRem}rem, ${yRem}rem + ${slopeVw}vw, ${maxRem}rem)`;
    } else {
      const slopeVw = toFixed(slope * 100);
      return `clamp(${minS}px, ${toFixed(yIntersection)}px + ${slopeVw}vw, ${maxS}px)`;
    }
  }, [minSize, maxSize, minViewport, maxViewport, useRem, baseFontSize]);

  const handleCopy = () => {
    if (!clampResult) return;
    navigator.clipboard.writeText(clampResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setMinSize(16);
    setMaxSize(48);
    setMinViewport(320);
    setMaxViewport(1280);
    setUseRem(true);
    setBaseFontSize(16);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex justify-end">
        <button
          onClick={handleReset}
          className="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
        >
          <RotateCcw className="w-3 h-3" /> {t('common.reset')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Controls */}
        <div className="space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex items-center gap-2 px-1">
              <Layout className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{t('cssclamp.size_config')}</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 px-1">{t('cssclamp.min_size')} (px)</label>
                <input
                  type="number"
                  value={minSize}
                  onChange={(e) => setMinSize(Number(e.target.value))}
                  className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold focus:border-indigo-500 outline-none transition-all dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 px-1">{t('cssclamp.max_size')} (px)</label>
                <input
                  type="number"
                  value={maxSize}
                  onChange={(e) => setMaxSize(Number(e.target.value))}
                  className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold focus:border-indigo-500 outline-none transition-all dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 px-1 pt-2">
              <Monitor className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{t('cssclamp.viewport_config')}</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 px-1">{t('cssclamp.min_viewport')} (px)</label>
                <input
                  type="number"
                  value={minViewport}
                  onChange={(e) => setMinViewport(Number(e.target.value))}
                  className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold focus:border-indigo-500 outline-none transition-all dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 px-1">{t('cssclamp.max_viewport')} (px)</label>
                <input
                  type="number"
                  value={maxViewport}
                  onChange={(e) => setMaxViewport(Number(e.target.value))}
                  className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold focus:border-indigo-500 outline-none transition-all dark:text-white"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-slate-600 dark:text-slate-400">{t('cssclamp.use_rem')}</label>
                <button
                  onClick={() => setUseRem(!useRem)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${useRem ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${useRem ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              {useRem && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                  <label className="text-xs font-bold text-slate-500 px-1">{t('cssclamp.base_font_size')} (px)</label>
                  <input
                    type="number"
                    value={baseFontSize}
                    onChange={(e) => setBaseFontSize(Number(e.target.value))}
                    className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold focus:border-indigo-500 outline-none transition-all dark:text-white"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Result & Preview */}
        <div className="space-y-6">
          <div className="bg-slate-900 dark:bg-black p-8 rounded-[2rem] shadow-xl space-y-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>

            <div className="flex justify-between items-center relative z-10">
              <h3 className="text-xs font-black uppercase tracking-widest text-indigo-400">Result CSS</h3>
              <button
                onClick={handleCopy}
                disabled={!clampResult}
                className={`p-2 rounded-lg transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'} disabled:opacity-50`}
              >
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>

            <div className="bg-white/5 p-6 rounded-2xl border border-white/10 relative z-10">
              <code className="text-indigo-300 font-mono text-sm md:text-base break-all leading-relaxed">
                {clampResult || 'Waiting for valid input...'}
              </code>
            </div>

            <div className="space-y-2 relative z-10">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/40">{t('cssclamp.usage_example')}</p>
              <pre className="text-xs text-white/60 font-mono">
                {`h1 {\n  font-size: ${clampResult || '...'};\n}`}
              </pre>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-4">
            <h4 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Maximize className="w-4 h-4" /> {t('cssclamp.preview')}
            </h4>
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
               <p
                 style={{ fontSize: clampResult || '16px' }}
                 className="font-bold text-slate-900 dark:text-white transition-all duration-300 leading-tight"
               >
                 {t('cssclamp.preview_text')}
               </p>
               <p className="text-xs text-slate-400 mt-4 italic">
                 {t('cssclamp.preview_hint')}
               </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" /> {t('cssclamp.what_is_title')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('cssclamp.what_is_text')}
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <MousePointer2 className="w-4 h-4 text-indigo-500" /> {t('cssclamp.how_it_works_title')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('cssclamp.how_it_works_text')}
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Layout className="w-4 h-4 text-indigo-500" /> {t('cssclamp.advantages_title')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('cssclamp.advantages_text')}
          </p>
        </div>
      </div>
    </div>
  );
}
