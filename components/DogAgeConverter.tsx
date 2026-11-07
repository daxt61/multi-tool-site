import { useState, useEffect, useRef, useCallback } from 'react';
import { Dog, Info, Trash2, Copy, Check, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

type DogSize = 'small' | 'medium' | 'large' | 'giant';

interface DogPreset {
  id: string;
  labelKey: string;
  age: number;
  size: DogSize;
}

const DOG_PRESETS: DogPreset[] = [
  { id: 'puppy', labelKey: 'dogage.preset_puppy', age: 1, size: 'medium' },
  { id: 'young_adult', labelKey: 'dogage.preset_young_adult', age: 3, size: 'large' },
  { id: 'mature', labelKey: 'dogage.preset_mature', age: 7, size: 'small' },
  { id: 'senior', labelKey: 'dogage.preset_senior', age: 10, size: 'giant' },
];

export function DogAgeConverter({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLInputElement>(null);
  const [dogAge, setDogAge] = useState<number>(initialData?.dogAge || 1);
  const [dogSize, setDogSize] = useState<DogSize>(initialData?.dogSize || 'medium');
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    onStateChange?.({ dogAge, dogSize });
  }, [dogAge, dogSize, onStateChange]);

  const humanAge = (() => {
    if (dogAge <= 0) return 0;
    if (dogAge === 1) return 15;
    if (dogAge === 2) return 24;

    const baseAge = 24;
    const remainingYears = dogAge - 2;

    let factor = 4;
    if (dogSize === 'small') factor = 4;
    else if (dogSize === 'medium') factor = 5;
    else if (dogSize === 'large') factor = 6;
    else if (dogSize === 'giant') factor = 7;

    return baseAge + (remainingYears * factor);
  })();

  const handleCopy = useCallback(() => {
    const text = `${humanAge} ${t('agecalculator.years', 'ans')}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(t('common.copied'));
    setTimeout(() => setCopied(false), 2000);
  }, [humanAge, t]);

  const handleClear = useCallback(() => {
    setDogAge(1);
    setDogSize('medium');
    setActivePresetId(null);
    toast.success(t('dogage.reset_success', 'Réinitialisé aux valeurs par défaut'));
    setTimeout(() => sliderRef.current?.focus(), 0);
  }, [t]);

  const handleApplyPreset = (preset: DogPreset) => {
    setDogAge(preset.age);
    setDogSize(preset.size);
    setActivePresetId(preset.id);
    toast.success(t('dogage.preset_loaded', 'Préréglage chargé'));
  };

  const handlersRef = useRef({ handleClear, handleCopy, humanAge });
  useEffect(() => {
    handlersRef.current = { handleClear, handleCopy, humanAge };
  }, [handleClear, handleCopy, humanAge]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      // Ensure listener is container-isolated or not interfering with other elements
      if (!containerRef.current?.contains(activeElement) && activeElement !== document.body) return;

      const isEditable =
        activeElement instanceof HTMLInputElement && activeElement.type !== 'range' ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement instanceof HTMLSelectElement ||
        activeElement?.getAttribute('contenteditable') === 'true';

      // Don't intercept if user is typing in search or command menu
      if (isEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        handlersRef.current.handleClear();
      } else if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handlersRef.current.handleCopy();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div ref={containerRef} className="max-w-4xl mx-auto space-y-8">
      {/* Quick Presets & Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mr-1">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            {t('dogage.presets_title', 'Préréglages')} :
          </span>
          {DOG_PRESETS.map((preset) => {
            const isActive = activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => handleApplyPreset(preset)}
                aria-pressed={isActive}
                className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                  isActive
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-500 dark:hover:border-indigo-500'
                }`}
              >
                {t(preset.labelKey)}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleClear}
            className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
            title={`${t('common.reset')} (Esc)`}
            aria-label={`${t('common.reset')} (Esc)`}
          >
            <Trash2 className="w-3 h-3" />
            <span>{t('common.reset')}</span>
            <Kbd modifier={null} className="ml-1 text-[10px] text-rose-500 border-rose-200 dark:border-rose-800">Esc</Kbd>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="dog-age" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('dogage.dog_years', 'Âge du chien (années)')}
              </label>
              <span className="text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400">{dogAge}</span>
            </div>
            <input
              id="dog-age"
              ref={sliderRef}
              type="range"
              min="1"
              max="20"
              step="1"
              value={dogAge}
              aria-valuenow={dogAge}
              aria-valuemin={1}
              aria-valuemax={20}
              aria-valuetext={`${dogAge} ${t('agecalculator.years', 'ans')}`}
              onChange={(e) => {
                setDogAge(Number(e.target.value));
                setActivePresetId(null);
              }}
              className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
            />
          </div>

          <div className="space-y-4">
            <label className="block text-xs font-black uppercase tracking-widest text-slate-400 px-1">
              {t('dogage.size', 'Taille du chien')}
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'small', label: t('dogage.small', 'Petit'), desc: '< 10kg' },
                { id: 'medium', label: t('dogage.medium', 'Moyen'), desc: '10-25kg' },
                { id: 'large', label: t('dogage.large', 'Grand'), desc: '25-45kg' },
                { id: 'giant', label: t('dogage.giant', 'Géant'), desc: '> 45kg' }
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setDogSize(s.id as DogSize);
                    setActivePresetId(null);
                  }}
                  aria-pressed={dogSize === s.id}
                  className={`p-4 rounded-2xl border text-left transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                    dogSize === s.id
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-indigo-500/50'
                  }`}
                >
                  <div className="font-bold text-sm">{s.label}</div>
                  <div className={`text-[10px] font-medium opacity-60 ${dogSize === s.id ? 'text-white' : ''}`}>{s.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center p-8 bg-indigo-600 rounded-[2.5rem] text-white shadow-xl shadow-indigo-600/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-2xl -ml-24 -mb-24"></div>

          {/* Copy button */}
          <button
            onClick={handleCopy}
            className={`absolute top-6 right-6 p-2.5 rounded-xl transition-all border z-20 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none flex items-center gap-1.5 ${
              copied
                ? 'bg-emerald-500 text-white border-emerald-400 shadow-md'
                : 'bg-white/10 text-white/80 border-white/20 hover:text-white hover:bg-white/20'
            }`}
            title={`${t('common.copy')} (C)`}
            aria-label={`${t('common.copy')} (C)`}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <Kbd modifier={null} className="hidden sm:inline-flex bg-white/10 border-white/20 text-white text-[10px]">C</Kbd>
          </button>

          <div className="relative z-10 text-center space-y-4">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Dog className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold opacity-80 uppercase tracking-widest">{t('dogage.human_equivalent', 'Équivalent Humain')}</h3>
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-8xl font-black font-mono tracking-tighter" aria-live="polite">{humanAge}</span>
              <span className="text-2xl font-bold opacity-60">{t('agecalculator.years', 'ans')}</span>
            </div>
            <p className="max-w-[250px] mx-auto text-indigo-100 font-medium leading-relaxed">
              {t('dogage.result_msg', { age: humanAge })}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20 rounded-3xl p-6 text-sm text-indigo-900 dark:text-indigo-400 flex gap-4 items-start">
        <div className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm text-indigo-500 shrink-0">
          <Info className="w-5 h-5" />
        </div>
        <div>
          <p className="font-bold mb-1">{t('dogage.about_title', 'Comment est calculé l\'âge d\'un chien ?')}</p>
          <p className="opacity-80 leading-relaxed">
            {t('dogage.about_text', 'L\'idée reçue qu\'une année de chien équivaut à 7 années humaines est une simplification. En réalité, les chiens mûrissent plus vite au début de leur vie. La première année compte pour environ 15 ans, la deuxième pour 9, puis chaque année supplémentaire compte pour 4 à 7 ans selon la taille et la race de l\'animal.')}
          </p>
        </div>
      </div>
    </div>
  );
}
