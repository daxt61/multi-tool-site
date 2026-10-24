import { useState, useEffect, useCallback, useRef } from 'react';
import { Percent, ArrowRight, Info, TrendingUp, Trash2, Copy, Check, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

interface CalculationPreset {
  id: string;
  nameKey: string;
  descriptionKey: string;
  v2: string;
  v1: string;
}

const CALC_PRESETS: CalculationPreset[] = [
  {
    id: 'vat_20',
    nameKey: 'percentage.preset_vat20_title',
    descriptionKey: 'percentage.preset_vat20_desc',
    v2: '20',
    v1: '150'
  },
  {
    id: 'discount_15',
    nameKey: 'percentage.preset_discount15_title',
    descriptionKey: 'percentage.preset_discount15_desc',
    v2: '15',
    v1: '80'
  },
  {
    id: 'increase_20',
    nameKey: 'percentage.preset_increase20_title',
    descriptionKey: 'percentage.preset_increase20_desc',
    v2: '20',
    v1: '250'
  },
  {
    id: 'part_25',
    nameKey: 'percentage.preset_part25_title',
    descriptionKey: 'percentage.preset_part25_desc',
    v2: '25',
    v1: '400'
  }
];

export function PercentageCalculator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const percentInputRef = useRef<HTMLInputElement>(null);

  const [value1, setValue1] = useState(initialData?.value1 || '');
  const [value2, setValue2] = useState(initialData?.value2 || '');
  const [value3, setValue3] = useState(initialData?.value3 || '');
  const [value4, setValue4] = useState(initialData?.value4 || '');
  const [initialVal, setInitialVal] = useState(initialData?.initialVal || '');
  const [finalVal, setFinalVal] = useState(initialData?.finalVal || '');
  const [valAfter, setValAfter] = useState(initialData?.valAfter || '');
  const [percentAfter, setPercentAfter] = useState(initialData?.percentAfter || '');
  const [activePresetId, setActivePresetId] = useState<string | null>(initialData?.activePresetId ?? null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    onStateChange?.({ value1, value2, value3, value4, initialVal, finalVal, valAfter, percentAfter, activePresetId });
  }, [value1, value2, value3, value4, initialVal, finalVal, valAfter, percentAfter, activePresetId, onStateChange]);

  const percentageOf = (value1 !== '' && value2 !== '' && !isNaN(Number(value1)) && !isNaN(Number(value2))) ? (Number(value2) / 100) * Number(value1) : NaN;
  const whatPercent = (value3 !== '' && value4 !== '' && Number(value4) !== 0 && !isNaN(Number(value3)) && !isNaN(Number(value4))) ? (Number(value3) / Number(value4)) * 100 : NaN;

  const v1 = Number(initialVal);
  const v2 = Number(finalVal);
  const percentChange = (initialVal !== '' && finalVal !== '' && v1 !== 0 && !isNaN(v1) && !isNaN(v2)) ? ((v2 - v1) / v1) * 100 : NaN;

  const afterIncrease = (valAfter !== '' && percentAfter !== '' && !isNaN(Number(valAfter)) && !isNaN(Number(percentAfter))) ? Number(valAfter) * (1 + Math.abs(Number(percentAfter)) / 100) : NaN;
  const afterDecrease = (valAfter !== '' && percentAfter !== '' && !isNaN(Number(valAfter)) && !isNaN(Number(percentAfter))) ? Number(valAfter) * (1 - Math.abs(Number(percentAfter)) / 100) : NaN;

  const handleClear = useCallback(() => {
    setValue1('');
    setValue2('');
    setValue3('');
    setValue4('');
    setInitialVal('');
    setFinalVal('');
    setValAfter('');
    setPercentAfter('');
    setActivePresetId(null);
    toast.success(t('percentage.cleared_toast'));
    setTimeout(() => {
      percentInputRef.current?.focus();
    }, 0);
  }, [t]);

  const handleApplyPreset = useCallback((preset: CalculationPreset) => {
    setValue2(preset.v2);
    setValue1(preset.v1);
    setActivePresetId(preset.id);
    toast.success(t('percentage.preset_loaded_toast'));
  }, [t]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success(t('common.copied'));
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handlersRef = useRef({ handleClear, percentageOf, copyToClipboard });
  useEffect(() => {
    handlersRef.current = { handleClear, percentageOf, copyToClipboard };
  }, [handleClear, percentageOf]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isEditable =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement instanceof HTMLSelectElement ||
        activeElement?.getAttribute("contenteditable") === "true";

      const { handleClear, percentageOf, copyToClipboard } = handlersRef.current;

      if (isEditable && e.key !== 'Escape') return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        handleClear();
      } else if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        if (!isNaN(percentageOf)) {
          copyToClipboard(percentageOf.toFixed(2), 'copy1');
        }
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('keydown', handleKeyDown);
      return () => container.removeEventListener('keydown', handleKeyDown);
    }
  }, []);

  const hasContent = value1 || value2 || value3 || value4 || initialVal || finalVal || valAfter || percentAfter;

  return (
    <div ref={containerRef} tabIndex={-1} className="max-w-4xl mx-auto space-y-8 outline-none">
      {/* Quick Start Presets */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 px-1">
          <Sparkles className="w-4 h-4 text-indigo-500" />
          <span>{t('percentage.presets_title')}</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {CALC_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleApplyPreset(preset)}
              aria-pressed={activePresetId === preset.id}
              className={`p-3.5 rounded-2xl text-left transition-all border flex flex-col justify-between space-y-1 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                activePresetId === preset.id
                  ? 'bg-indigo-50/80 dark:bg-indigo-900/30 border-indigo-500 text-indigo-900 dark:text-indigo-200 shadow-sm'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-300 dark:hover:border-indigo-700'
              }`}
            >
              <div className="font-bold text-xs flex items-center justify-between">
                <span>{t(preset.nameKey)}</span>
                {activePresetId === preset.id && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                {t(preset.descriptionKey)}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-between px-1 gap-2 items-center">
        <div className="flex items-center gap-2">
          <Kbd modifier={null} className="hidden sm:inline-flex text-indigo-400 border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-900">C</Kbd>
          <span className="text-xs text-slate-400 font-medium">{t('percentage.kbd_copy_hint')}</span>
        </div>
        <div className="flex items-center gap-2">
          <Kbd modifier={null} className="hidden sm:inline-flex text-rose-400 border-rose-200 dark:border-rose-800 bg-white dark:bg-slate-900">Esc</Kbd>
          <button
            onClick={handleClear}
            disabled={!hasContent}
            className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
          >
            <Trash2 className="w-4 h-4" /> {t('common.clear')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section 1: X% de Y */}
        <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-500">
                <Percent className="w-4 h-4" />
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{t('percentage.title1')}</h3>
              </div>
              <button
                onClick={() => { setValue2(''); setValue1(''); setActivePresetId(null); }}
                disabled={!value2 && !value1}
                className="text-[10px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-2 py-0.5 rounded-lg transition-all disabled:opacity-0 disabled:pointer-events-none"
              >
                {t('common.clear')}
              </button>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-full">
                <label htmlFor="percent-val" className="text-xs font-bold text-slate-400 block mb-1">{t('percentage.label_percent')}</label>
                <input
                  id="percent-val"
                  ref={percentInputRef}
                  type="number"
                  value={value2}
                  onChange={(e) => { setValue2(e.target.value); setActivePresetId(null); }}
                  className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
                  placeholder="20"
                />
              </div>
              <span className="text-xl font-bold text-slate-400 whitespace-nowrap mt-6">{t('percentage.percent_of')}</span>
              <div className="w-full">
                <label htmlFor="total-val" className="text-xs font-bold text-slate-400 block mb-1">{t('percentage.label_total')}</label>
                <input
                  id="total-val"
                  type="number"
                  value={value1}
                  onChange={(e) => { setValue1(e.target.value); setActivePresetId(null); }}
                  className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
                  placeholder="100"
                />
              </div>
            </div>
          </div>
          <div className="relative group/copy bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 text-center">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{t('percentage.result')}</div>
            <div className="text-4xl font-black text-indigo-600 dark:text-indigo-400 font-mono" aria-live="polite" aria-atomic="true">
               {isNaN(percentageOf) ? '0' : percentageOf.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </div>
            <button
              onClick={() => copyToClipboard(percentageOf.toFixed(2), 'copy1')}
              disabled={isNaN(percentageOf)}
              className={`absolute top-2 right-2 p-2 rounded-xl transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none focus-visible:opacity-100 ${
                copiedId === 'copy1'
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 opacity-100'
                  : 'text-slate-400 hover:text-indigo-500 bg-white dark:bg-slate-800 opacity-0 group-hover/copy:opacity-100 shadow-sm border border-slate-100 dark:border-slate-700'
              } disabled:opacity-0 disabled:pointer-events-none`}
              aria-label={t('percentage.copy_result_of')}
            >
              {copiedId === 'copy1' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Section 2: X représente quel % de Y */}
        <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
             <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-500">
                <ArrowRight className="w-4 h-4" />
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{t('percentage.title2')}</h3>
              </div>
              <button
                onClick={() => { setValue3(''); setValue4(''); }}
                disabled={!value3 && !value4}
                className="text-[10px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-2 py-0.5 rounded-lg transition-all disabled:opacity-0 disabled:pointer-events-none"
              >
                {t('common.clear')}
              </button>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-full">
                <label htmlFor="part-val" className="text-xs font-bold text-slate-400 block mb-1">{t('percentage.label_part')}</label>
                <input
                  id="part-val"
                  type="number"
                  value={value3}
                  onChange={(e) => setValue3(e.target.value)}
                  className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
                  placeholder="150"
                />
              </div>
              <span className="text-xl font-bold text-slate-400 whitespace-nowrap mt-6">{t('percentage.of')}</span>
              <div className="w-full">
                <label htmlFor="whole-val" className="text-xs font-bold text-slate-400 block mb-1">{t('percentage.label_reference')}</label>
                <input
                  id="whole-val"
                  type="number"
                  value={value4}
                  onChange={(e) => setValue4(e.target.value)}
                  className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
                  placeholder="100"
                />
              </div>
            </div>
          </div>
          <div className="relative group/copy bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 text-center">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{t('percentage.result')}</div>
            <div className="text-4xl font-black text-indigo-600 dark:text-indigo-400 font-mono" aria-live="polite" aria-atomic="true">
               {isNaN(whatPercent) ? '0' : whatPercent.toLocaleString(undefined, { maximumFractionDigits: 2 })}%
            </div>
            <button
              onClick={() => copyToClipboard(whatPercent.toFixed(2) + '%', 'copy2')}
              disabled={isNaN(whatPercent)}
              className={`absolute top-2 right-2 p-2 rounded-xl transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none focus-visible:opacity-100 ${
                copiedId === 'copy2'
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 opacity-100'
                  : 'text-slate-400 hover:text-indigo-500 bg-white dark:bg-slate-800 opacity-0 group-hover/copy:opacity-100 shadow-sm border border-slate-100 dark:border-slate-700'
              } disabled:opacity-0 disabled:pointer-events-none`}
              aria-label={t('percentage.copy_result_represents')}
            >
              {copiedId === 'copy2' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Section 3: Variation en % */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-500">
            <TrendingUp className="w-4 h-4" />
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{t('percentage.title3')}</h3>
          </div>
          <button
            onClick={() => { setInitialVal(''); setFinalVal(''); }}
            disabled={!initialVal && !finalVal}
            className="text-[10px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-2 py-0.5 rounded-lg transition-all disabled:opacity-0 disabled:pointer-events-none"
          >
            {t('common.clear')}
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
             <label htmlFor="initial-val" className="text-xs font-bold text-slate-400 px-1 uppercase tracking-widest cursor-pointer">{t('percentage.val_initial')}</label>
             <input
              id="initial-val"
              type="number"
              value={initialVal}
              onChange={(e) => setInitialVal(e.target.value)}
              className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-2xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
              aria-label={t('percentage.val_initial')}
            />
          </div>
          <div className="space-y-3">
             <label htmlFor="final-val" className="text-xs font-bold text-slate-400 px-1 uppercase tracking-widest cursor-pointer">{t('percentage.val_final')}</label>
             <input
              id="final-val"
              type="number"
              value={finalVal}
              onChange={(e) => setFinalVal(e.target.value)}
              className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-2xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
              aria-label={t('percentage.val_final')}
            />
          </div>
        </div>

        <div className="relative group/copy bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 text-center">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{t('percentage.variation')}</div>
            <div className={`text-5xl font-black font-mono ${percentChange >= 0 || isNaN(percentChange) ? 'text-emerald-500' : 'text-rose-500'}`} aria-live="polite" aria-atomic="true">
               {percentChange > 0 ? '+' : ''}{isNaN(percentChange) ? '0' : percentChange.toLocaleString(undefined, { maximumFractionDigits: 2 })}%
            </div>
            <button
              onClick={() => copyToClipboard((percentChange > 0 ? '+' : '') + percentChange.toFixed(2) + '%', 'copy3')}
              disabled={isNaN(percentChange)}
              className={`absolute top-4 right-4 p-2 rounded-xl transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none focus-visible:opacity-100 ${
                copiedId === 'copy3'
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 opacity-100'
                  : 'text-slate-400 hover:text-indigo-500 bg-white dark:bg-slate-800 opacity-0 group-hover/copy:opacity-100 shadow-sm border border-slate-100 dark:border-slate-700'
              } disabled:opacity-0 disabled:pointer-events-none`}
              aria-label={t('percentage.copy_result_variation')}
            >
              {copiedId === 'copy3' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
        </div>
      </div>

      {/* Section 4: Résultat après % de changement */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-500">
            <Info className="w-4 h-4" />
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{t('percentage.title4')}</h3>
          </div>
          <button
            onClick={() => { setValAfter(''); setPercentAfter(''); }}
            disabled={!valAfter && !percentAfter}
            className="text-[10px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-2 py-0.5 rounded-lg transition-all disabled:opacity-0 disabled:pointer-events-none"
          >
            {t('common.clear')}
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
             <label htmlFor="base-val-after" className="text-xs font-bold text-slate-400 px-1 uppercase tracking-widest cursor-pointer">{t('percentage.val_base')}</label>
             <input
              id="base-val-after"
              type="number"
              value={valAfter}
              onChange={(e) => setValAfter(e.target.value)}
              className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-2xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
              placeholder="100"
              aria-label={t('percentage.val_base')}
            />
          </div>
          <div className="space-y-3">
             <label htmlFor="percent-change-after" className="text-xs font-bold text-slate-400 px-1 uppercase tracking-widest cursor-pointer">{t('percentage.percent_change')}</label>
             <input
              id="percent-change-after"
              type="number"
              value={percentAfter}
              onChange={(e) => setPercentAfter(e.target.value)}
              className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-2xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
              placeholder="20"
              aria-label={t('percentage.percent_change')}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <div className="relative group/copy bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20 p-6 rounded-2xl text-center">
             <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">{t('percentage.increase')}</div>
             <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono" aria-live="polite" aria-atomic="true">
               {isNaN(afterIncrease) ? '0' : afterIncrease.toLocaleString(undefined, { maximumFractionDigits: 2 })}
             </div>
             <button
              onClick={() => copyToClipboard(afterIncrease.toFixed(2), 'copy4')}
              disabled={isNaN(afterIncrease)}
              className={`absolute top-2 right-2 p-2 rounded-xl transition-all focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none focus-visible:opacity-100 ${
                copiedId === 'copy4'
                  ? 'bg-white text-emerald-600 opacity-100'
                  : 'text-emerald-400 hover:text-emerald-600 bg-white/50 opacity-0 group-hover/copy:opacity-100 shadow-sm border border-emerald-100'
              } disabled:opacity-0 disabled:pointer-events-none`}
              aria-label={t('percentage.copy_increase')}
            >
              {copiedId === 'copy4' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
           </div>
           <div className="relative group/copy bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/20 p-6 rounded-2xl text-center">
             <div className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest mb-1">{t('percentage.decrease')}</div>
             <div className="text-3xl font-black text-rose-600 dark:text-rose-400 font-mono" aria-live="polite" aria-atomic="true">
               {isNaN(afterDecrease) ? '0' : afterDecrease.toLocaleString(undefined, { maximumFractionDigits: 2 })}
             </div>
             <button
              onClick={() => copyToClipboard(afterDecrease.toFixed(2), 'copy5')}
              disabled={isNaN(afterDecrease)}
              className={`absolute top-2 right-2 p-2 rounded-xl transition-all focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none focus-visible:opacity-100 ${
                copiedId === 'copy5'
                  ? 'bg-white text-rose-600 opacity-100'
                  : 'text-rose-400 hover:text-rose-600 bg-white/50 opacity-0 group-hover/copy:opacity-100 shadow-sm border border-rose-100'
              } disabled:opacity-0 disabled:pointer-events-none`}
              aria-label={t('percentage.copy_decrease')}
            >
              {copiedId === 'copy5' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
           </div>
        </div>
      </div>
    </div>
  );
}
