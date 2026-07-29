import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Info, Check, RotateCcw, Activity, Scale, Copy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

type Gender = 'male' | 'female';

export function BodyFatCalculator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [gender, setGender] = useState<Gender>(initialData?.gender || 'male');
  const [weight, setWeight] = useState<string>(initialData?.weight || '75');
  const [height, setHeight] = useState<string>(initialData?.height || '180');
  const [neck, setNeck] = useState<string>(initialData?.neck || '38');
  const [waist, setWaist] = useState<string>(initialData?.waist || '85');
  const [hip, setHip] = useState<string>(initialData?.hip || '95');
  const [unit, setUnit] = useState<'metric' | 'imperial'>(initialData?.unit || 'metric');
  const [copied, setCopied] = useState(false);
  const heightInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    onStateChange?.({ gender, weight, height, neck, waist, hip, unit });
  }, [gender, weight, height, neck, waist, hip, unit, onStateChange]);

  const stats = useMemo(() => {
    let w = parseFloat(weight);
    let h = parseFloat(height);
    let n = parseFloat(neck);
    let wa = parseFloat(waist);
    let hi = parseFloat(hip);

    if (isNaN(w) || isNaN(h) || isNaN(n) || isNaN(wa) || (gender === 'female' && isNaN(hi))) {
      return null;
    }

    // Convert to Metric if Imperial
    if (unit === 'imperial') {
      w = w * 0.453592;
      h = h * 2.54;
      n = n * 2.54;
      wa = wa * 2.54;
      hi = hi * 2.54;
    }

    let bodyFat = 0;

    // US Navy formula (uses metric: cm and kg)
    if (gender === 'male') {
      // %Fat = 495 / (1.0324 - 0.19077 * log10(waist - neck) + 0.15456 * log10(height)) - 450
      bodyFat = 495 / (1.0324 - 0.19077 * Math.log10(wa - n) + 0.15456 * Math.log10(h)) - 450;
    } else {
      // %Fat = 495 / (1.29579 - 0.35004 * log10(waist + hip - neck) + 0.22100 * log10(height)) - 450
      bodyFat = 495 / (1.29579 - 0.35004 * Math.log10(wa + hi - n) + 0.22100 * Math.log10(h)) - 450;
    }

    // Re-calculate masses in selected unit
    const currentWeight = parseFloat(weight);
    const fatMass = (bodyFat / 100) * currentWeight;
    const leanMass = currentWeight - fatMass;

    return {
      bodyFat: Math.max(0, bodyFat),
      fatMass: Math.max(0, fatMass),
      leanMass: Math.max(0, leanMass)
    };
  }, [gender, weight, height, neck, waist, hip, unit]);

  const getCategory = (bf: number) => {
    if (gender === 'male') {
      if (bf < 6) return { label: t('bodyfat.cat.essential'), color: 'text-blue-500', bg: 'bg-blue-500' };
      if (bf < 14) return { label: t('bodyfat.cat.athlete'), color: 'text-emerald-500', bg: 'bg-emerald-500' };
      if (bf < 18) return { label: t('bodyfat.cat.fitness'), color: 'text-emerald-400', bg: 'bg-emerald-400' };
      if (bf < 25) return { label: t('bodyfat.cat.average'), color: 'text-amber-500', bg: 'bg-amber-500' };
      return { label: t('bodyfat.cat.obese'), color: 'text-rose-500', bg: 'bg-rose-500' };
    } else {
      if (bf < 14) return { label: t('bodyfat.cat.essential'), color: 'text-blue-500', bg: 'bg-blue-500' };
      if (bf < 21) return { label: t('bodyfat.cat.athlete'), color: 'text-emerald-500', bg: 'bg-emerald-500' };
      if (bf < 25) return { label: t('bodyfat.cat.fitness'), color: 'text-emerald-400', bg: 'bg-emerald-400' };
      if (bf < 32) return { label: t('bodyfat.cat.average'), color: 'text-amber-500', bg: 'bg-amber-500' };
      return { label: t('bodyfat.cat.obese'), color: 'text-rose-500', bg: 'bg-rose-500' };
    }
  };

  const handleReset = useCallback(() => {
    setWeight('');
    setHeight('');
    setNeck('');
    setWaist('');
    setHip('');
    setTimeout(() => heightInputRef.current?.focus(), 0);
  }, []);

  const handleUnitChange = useCallback((newUnit: 'metric' | 'imperial') => {
    if (newUnit === unit) return;

    setUnit(newUnit);
    // Sensible defaults for the new unit
    if (newUnit === 'metric') {
      setHeight('180');
      setWeight('75');
      setNeck('38');
      setWaist('85');
      setHip('95');
    } else {
      setHeight('71');
      setWeight('165');
      setNeck('15');
      setWaist('33');
      setHip('37');
    }
  }, [unit]);

  const handleCopy = useCallback(() => {
    if (!stats) return;
    navigator.clipboard.writeText(stats.bodyFat.toFixed(1));
    setCopied(true);
    toast.success(t('common.copied'));
    setTimeout(() => setCopied(false), 2000);
  }, [stats, t]);

  const handlersRef = useRef({ handleReset, handleCopy, stats });
  useEffect(() => {
    handlersRef.current = { handleReset, handleCopy, stats };
  }, [handleReset, handleCopy, stats]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isEditable =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement instanceof HTMLSelectElement ||
        activeElement?.getAttribute("contenteditable") === "true";

      const isInputFocused = activeElement === heightInputRef.current ||
        (activeElement instanceof HTMLInputElement && activeElement.closest('.max-w-5xl') !== null);

      if (e.key === 'Escape') {
        if (isInputFocused || !isEditable) {
          e.preventDefault();
          handlersRef.current.handleReset();
        }
        return;
      }

      if (isEditable) return;

      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key.toLowerCase() === 'c' && handlersRef.current.stats) {
        e.preventDefault();
        handlersRef.current.handleCopy();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const category = stats ? getCategory(stats.bodyFat) : null;

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Inputs */}
        <div className="lg:col-span-7 space-y-8">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
            <div className="flex justify-between items-center px-1">
              <div
                className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-48"
                role="group"
                aria-label={t('unit_system') || 'Unit System'}
              >
                <button
                  onClick={() => handleUnitChange('metric')}
                  aria-pressed={unit === 'metric'}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${unit === 'metric' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                >
                  {t('bodyfat.metric')}
                </button>
                <button
                  onClick={() => handleUnitChange('imperial')}
                  aria-pressed={unit === 'imperial'}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${unit === 'imperial' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                >
                  {t('bodyfat.imperial')}
                </button>
              </div>
              <button
                onClick={handleReset}
                className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
                aria-label={`${t('common.reset')} (Esc)`}
                title={`${t('common.reset')} (Esc)`}
              >
                <RotateCcw className="w-3 h-3" /> {t('common.reset')}
                <Kbd modifier={null} className="ml-1 text-rose-400 border-rose-200 dark:border-rose-800">Esc</Kbd>
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <span id="gender-label" className="text-xs font-bold text-slate-500 px-1">{t('bodyfat.male')} / {t('bodyfat.female')}</span>
                <div
                  className="grid grid-cols-2 gap-3"
                  role="radiogroup"
                  aria-labelledby="gender-label"
                >
                  <button
                    onClick={() => setGender('male')}
                    role="radio"
                    aria-checked={gender === 'male'}
                    className={`py-4 rounded-2xl font-bold text-sm transition-all border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${gender === 'male' ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'}`}
                  >
                    {t('bodyfat.male')}
                  </button>
                  <button
                    onClick={() => setGender('female')}
                    role="radio"
                    aria-checked={gender === 'female'}
                    className={`py-4 rounded-2xl font-bold text-sm transition-all border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${gender === 'female' ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'}`}
                  >
                    {t('bodyfat.female')}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="height" className="text-xs font-bold text-slate-500 px-1">{t('bodyfat.height')} ({unit === 'metric' ? 'cm' : 'in'})</label>
                  <input
                    id="height"
                    ref={heightInputRef}
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
                    placeholder={unit === 'metric' ? '180' : '71'}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="weight" className="text-xs font-bold text-slate-500 px-1">{t('bodyfat.weight')} ({unit === 'metric' ? 'kg' : 'lb'})</label>
                  <input
                    id="weight"
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
                    placeholder={unit === 'metric' ? '75' : '165'}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="neck" className="text-xs font-bold text-slate-500 px-1">{t('bodyfat.neck')} ({unit === 'metric' ? 'cm' : 'in'})</label>
                  <input
                    id="neck"
                    type="number"
                    value={neck}
                    onChange={(e) => setNeck(e.target.value)}
                    className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
                    placeholder={unit === 'metric' ? '38' : '15'}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="waist" className="text-xs font-bold text-slate-500 px-1">{t('bodyfat.waist')} ({unit === 'metric' ? 'cm' : 'in'})</label>
                  <input
                    id="waist"
                    type="number"
                    value={waist}
                    onChange={(e) => setWaist(e.target.value)}
                    className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
                    placeholder={unit === 'metric' ? '85' : '33'}
                  />
                </div>
                {gender === 'female' && (
                  <div className="space-y-2">
                    <label htmlFor="hip" className="text-xs font-bold text-slate-500 px-1">{t('bodyfat.hip')} ({unit === 'metric' ? 'cm' : 'in'})</label>
                    <input
                      id="hip"
                      type="number"
                      value={hip}
                      onChange={(e) => setHip(e.target.value)}
                      className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
                      placeholder={unit === 'metric' ? '95' : '37'}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-5 space-y-8">
          <div
            className="bg-slate-900 dark:bg-black p-10 rounded-[2.5rem] shadow-xl shadow-indigo-500/10 flex flex-col items-center justify-center space-y-4 min-h-[300px] relative overflow-hidden text-center group"
            aria-live="polite"
            aria-atomic="true"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-3xl" aria-hidden="true"></div>

            {stats && (
              <button
                onClick={handleCopy}
                className={`absolute top-6 right-6 p-3 rounded-2xl transition-all z-20 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none flex items-center gap-2 ${
                  copied
                    ? 'bg-emerald-500 text-white'
                    : 'bg-white/10 text-white/40 hover:text-white hover:bg-white/20 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100'
                }`}
                aria-label={`${t('common.copy')} (C)`}
                title={`${t('common.copy')} (C)`}
              >
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                {!copied && <Kbd modifier={null} className="hidden sm:inline-flex bg-white/5 border-white/20 text-white/50">C</Kbd>}
              </button>
            )}

            <div className="text-slate-400 font-bold uppercase tracking-widest text-xs">{t('bodyfat.estimated')}</div>
            <div className="text-6xl md:text-8xl font-black text-white font-mono tracking-tighter">
              {stats ? stats.bodyFat.toFixed(1) : "0.0"}
            </div>
            <div className="text-indigo-400 font-black text-xl md:text-2xl uppercase tracking-widest">
              %
            </div>

            {category && (
              <div className={`mt-4 px-6 py-2 rounded-full font-black text-sm uppercase tracking-widest ${category.bg} text-white shadow-lg animate-in zoom-in-95 duration-300`}>
                {category.label}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4">
             <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl flex justify-between items-center">
               <div className="flex items-center gap-3">
                 <div className="p-2 bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-lg" aria-hidden="true">
                   <Activity className="w-4 h-4" />
                 </div>
                 <span className="text-sm font-bold text-slate-500">{t('bodyfat.fat_mass')}</span>
               </div>
               <span className="font-black font-mono text-lg dark:text-white">{stats ? stats.fatMass.toFixed(1) : "0.0"} {unit === 'metric' ? 'kg' : 'lb'}</span>
             </div>
             <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl flex justify-between items-center">
               <div className="flex items-center gap-3">
                 <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 rounded-lg" aria-hidden="true">
                   <Scale className="w-4 h-4" />
                 </div>
                 <span className="text-sm font-bold text-slate-500">{t('bodyfat.lean_mass')}</span>
               </div>
               <span className="font-black font-mono text-lg dark:text-white">{stats ? stats.leanMass.toFixed(1) : "0.0"} {unit === 'metric' ? 'kg' : 'lb'}</span>
             </div>
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-900/10 p-6 rounded-[2rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
            <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 shrink-0" aria-hidden="true">
              <Info className="w-6 h-6" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              {t('bodyfat.about_text')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
