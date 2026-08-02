import { useState, useEffect, useRef, useCallback } from 'react';
import { Maximize2, Monitor, Smartphone, Laptop, Tablet, Tv, Info, Trash2, Copy, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

export function AspectRatioCalculator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const widthInputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();
  const [width, setWidth] = useState<string>(initialData?.width || '1920');
  const [height, setHeight] = useState<string>(initialData?.height || '1080');
  const [ratioW, setRatioW] = useState<string>(initialData?.ratioW || '16');
  const [ratioH, setRatioH] = useState<string>(initialData?.ratioH || '9');
  const [copiedFormat, setCopiedFormat] = useState(false);
  const [copiedRatio, setCopiedRatio] = useState(false);

  useEffect(() => {
    onStateChange?.({ width, height, ratioW, ratioH });
  }, [width, height, ratioW, ratioH, onStateChange]);

  const commonRatios = [
    { name: '16:9', w: 16, h: 9, icon: <Monitor className="w-4 h-4" aria-hidden="true" />, key: '16_9' },
    { name: '4:3', w: 4, h: 3, icon: <Tv className="w-4 h-4" aria-hidden="true" />, key: '4_3' },
    { name: '1:1', w: 1, h: 1, icon: <Maximize2 className="w-4 h-4" aria-hidden="true" />, key: '1_1' },
    { name: '9:16', w: 9, h: 16, icon: <Smartphone className="w-4 h-4" aria-hidden="true" />, key: '9_16' },
    { name: '3:2', w: 3, h: 2, icon: <Laptop className="w-4 h-4" aria-hidden="true" />, key: '3_2' },
    { name: '21:9', w: 21, h: 9, icon: <Monitor className="w-4 h-4" aria-hidden="true" />, key: '21_9' },
    { name: '4:5', w: 4, h: 5, icon: <Smartphone className="w-4 h-4" aria-hidden="true" />, key: '4_5' },
    { name: '2:3', w: 2, h: 3, icon: <Tablet className="w-4 h-4" aria-hidden="true" />, key: '2_3' },
  ];

  const gcd = (a: number, b: number): number => {
    return b === 0 ? a : gcd(b, a % b);
  };

  const calculateFromDims = (w: number, h: number) => {
    if (w > 0 && h > 0) {
      const common = gcd(w, h);
      setRatioW((w / common).toString());
      setRatioH((h / common).toString());
    } else {
      setRatioW('');
      setRatioH('');
    }
  };

  const calculateFromRatio = (rw: number, rh: number, val: number, isWidth: boolean) => {
    if (rw > 0 && rh > 0 && val > 0) {
      if (isWidth) {
        setHeight(Math.round((val * rh) / rw).toString());
      } else {
        setWidth(Math.round((val * rw) / rh).toString());
      }
    }
  };

  const handleClear = useCallback(() => {
    setWidth('');
    setHeight('');
    setRatioW('');
    setRatioH('');
    setTimeout(() => {
      widthInputRef.current?.focus();
    }, 0);
  }, []);

  const handleCopyFormat = useCallback(() => {
    if (width && height) {
      navigator.clipboard.writeText(`${width} × ${height}`);
      setCopiedFormat(true);
      toast.success(t('common.copied'));
      setTimeout(() => setCopiedFormat(false), 2000);
    }
  }, [width, height, t]);

  const handleCopyRatio = useCallback(() => {
    if (ratioW && ratioH) {
      navigator.clipboard.writeText(`${ratioW}:${ratioH}`);
      setCopiedRatio(true);
      toast.success(t('common.copied'));
      setTimeout(() => setCopiedRatio(false), 2000);
    }
  }, [ratioW, ratioH, t]);

  const handlersRef = useRef({ handleClear, handleCopyFormat, width, height });
  useEffect(() => {
    handlersRef.current = { handleClear, handleCopyFormat, width, height };
  }, [handleClear, handleCopyFormat, width, height]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isEditable =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement instanceof HTMLSelectElement ||
        activeElement?.getAttribute("contenteditable") === "true";

      const { handleClear, handleCopyFormat, width, height } = handlersRef.current;

      if (isEditable && e.key !== 'Escape') return;

      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        handleClear();
      } else if (e.key.toLowerCase() === 'c' && width && height) {
        e.preventDefault();
        handleCopyFormat();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Input Controls */}
        <div className="lg:col-span-7 space-y-8">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">

            {/* Header / Clear bar */}
            <div className="flex justify-between items-center px-1">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Maximize2 className="w-4 h-4 text-indigo-500" aria-hidden="true" /> {t('aspectratio.dimensions')}
              </h3>
              <button
                onClick={handleClear}
                disabled={!width && !height && !ratioW && !ratioH}
                className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
              >
                <Trash2 className="w-3 h-3" aria-hidden="true" /> {t('common.clear')}
                <Kbd modifier={null} className="ml-1 text-rose-400 border-rose-200 dark:border-rose-800">Esc</Kbd>
              </button>
            </div>

            {/* Dimensions Section */}
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="width" className="text-xs font-bold text-slate-500 px-1">{t('aspectratio.width')}</label>
                  <input
                    id="width"
                    ref={widthInputRef}
                    type="number"
                    value={width}
                    onChange={(e) => {
                      const val = e.target.value;
                      setWidth(val);
                      calculateFromDims(Number(val), Number(height));
                    }}
                    onKeyDown={(e) => e.key === 'Escape' && handleClear()}
                    className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="height" className="text-xs font-bold text-slate-500 px-1">{t('aspectratio.height')}</label>
                  <input
                    id="height"
                    type="number"
                    value={height}
                    onChange={(e) => {
                      const val = e.target.value;
                      setHeight(val);
                      calculateFromDims(Number(width), Number(val));
                    }}
                    onKeyDown={(e) => e.key === 'Escape' && handleClear()}
                    className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Ratio Section */}
            <div className="space-y-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 px-1">
                <Monitor className="w-4 h-4 text-indigo-500" aria-hidden="true" /> {t('aspectratio.ratio')}
              </h3>
              <div className="flex items-center gap-4">
                <div className="flex-1 space-y-2">
                  <label htmlFor="ratioW" className="text-xs font-bold text-slate-500 px-1">{t('aspectratio.ratio_width')}</label>
                  <input
                    id="ratioW"
                    type="number"
                    value={ratioW}
                    onChange={(e) => {
                      const val = e.target.value;
                      setRatioW(val);
                      calculateFromRatio(Number(val), Number(ratioH), Number(width), true);
                    }}
                    onKeyDown={(e) => e.key === 'Escape' && handleClear()}
                    className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white text-indigo-600 dark:text-indigo-400"
                  />
                </div>
                <div className="text-3xl font-black text-slate-300 dark:text-slate-700 pt-8" aria-hidden="true">:</div>
                <div className="flex-1 space-y-2">
                  <label htmlFor="ratioH" className="text-xs font-bold text-slate-500 px-1">{t('aspectratio.ratio_height')}</label>
                  <input
                    id="ratioH"
                    type="number"
                    value={ratioH}
                    onChange={(e) => {
                      const val = e.target.value;
                      setRatioH(val);
                      calculateFromRatio(Number(ratioW), Number(val), Number(width), true);
                    }}
                    onKeyDown={(e) => e.key === 'Escape' && handleClear()}
                    className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white text-indigo-600 dark:text-indigo-400"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Results Summary */}
          <div className="bg-indigo-600 rounded-[2rem] p-8 text-white shadow-xl shadow-indigo-600/10">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="text-center md:text-left flex flex-col items-center md:items-start gap-1">
                <p className="text-indigo-100 text-sm font-bold uppercase tracking-widest mb-1">{t('aspectratio.result_format')}</p>
                <div className="flex items-center gap-3">
                  <h4 className="text-3xl font-black font-mono" aria-live="polite">{width || '0'} × {height || '0'}</h4>
                  {width && height && (
                    <button
                      onClick={handleCopyFormat}
                      className={`p-1.5 rounded-lg border transition-all focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none flex items-center gap-1.5 ${
                        copiedFormat
                          ? 'bg-emerald-500 border-emerald-400 text-white'
                          : 'bg-white/10 border-white/10 hover:bg-white/25 text-white/80 hover:text-white'
                      }`}
                      title={`${t('common.copy')} (C)`}
                      aria-label={`${t('common.copy')} ${t('aspectratio.result_format')} (C)`}
                    >
                      {copiedFormat ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <Kbd modifier={null} className="bg-white/5 border-white/20 text-white/50 text-[10px] hidden sm:inline-flex">C</Kbd>
                    </button>
                  )}
                </div>
              </div>
              <div className="h-12 w-px bg-white/20 hidden md:block" />
              <div className="text-center md:text-right flex flex-col items-center md:items-end gap-1">
                <p className="text-indigo-100 text-sm font-bold uppercase tracking-widest mb-1">{t('aspectratio.simplified_ratio')}</p>
                <div className="flex items-center gap-3">
                  {ratioW && ratioH && (
                    <button
                      onClick={handleCopyRatio}
                      className={`p-1.5 rounded-lg border transition-all focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none ${
                        copiedRatio
                          ? 'bg-emerald-500 border-emerald-400 text-white'
                          : 'bg-white/10 border-white/10 hover:bg-white/25 text-white/80 hover:text-white'
                      }`}
                      title={t('common.copy')}
                      aria-label={`${t('common.copy')} ${t('aspectratio.simplified_ratio')}`}
                    >
                      {copiedRatio ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  )}
                  <h4 className="text-3xl font-black font-mono" aria-live="polite">{ratioW || '0'}:{ratioH || '0'}</h4>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Visual Preview & Presets */}
        <div className="lg:col-span-5 space-y-8">
          {/* Visual Preview */}
          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 space-y-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">{t('aspectratio.preview')}</h3>
            <div className="aspect-square bg-slate-50 dark:bg-slate-900 rounded-3xl flex items-center justify-center p-8 border border-slate-100 dark:border-slate-800 overflow-hidden">
               <div
                 className="bg-indigo-500/20 border-2 border-indigo-500 rounded-lg shadow-2xl shadow-indigo-500/10 transition-all duration-500 flex items-center justify-center text-indigo-500 font-black text-xs"
                 style={{
                   aspectRatio: ratioW && ratioH ? `${ratioW}/${ratioH}` : '1/1',
                   maxWidth: '100%',
                   maxHeight: '100%',
                   width: ratioW && ratioH && Number(ratioW) >= Number(ratioH) ? '100%' : 'auto',
                   height: ratioW && ratioH && Number(ratioH) > Number(ratioW) ? '100%' : 'auto',
                 }}
               >
                 {ratioW && ratioH ? `${ratioW}:${ratioH}` : '—'}
               </div>
            </div>
          </div>

          {/* Presets */}
          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 px-1">{t('aspectratio.standards')}</h3>
            <div className="grid grid-cols-2 gap-3">
              {commonRatios.map((r) => (
                <button
                  key={r.name}
                  onClick={() => {
                    setRatioW(r.w.toString());
                    setRatioH(r.h.toString());
                    const baseWidth = Number(width) > 0 ? Number(width) : 1920;
                    if (!width) setWidth('1920');
                    calculateFromRatio(r.w, r.h, baseWidth, true);
                  }}
                  aria-label={`${r.name} - ${t(`aspectratio.preset.${r.key}`)}`}
                  className="flex flex-col items-start p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl hover:border-indigo-500/30 hover:bg-white dark:hover:bg-slate-800 transition-all text-left group focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-white dark:bg-slate-700 rounded-lg text-slate-400 group-hover:text-indigo-500 transition-colors">
                      {r.icon}
                    </div>
                    <span className="font-black text-sm dark:text-white">{r.name}</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{t(`aspectratio.preset.${r.key}`)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 flex items-start gap-4">
         <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
            <Info className="w-6 h-6" aria-hidden="true" />
         </div>
         <div className="space-y-2">
            <h4 className="font-bold dark:text-white">{t('aspectratio.why_title')}</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              {t('aspectratio.why_text')}
            </p>
         </div>
      </div>
    </div>
  );
}
