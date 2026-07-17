import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Droplets, Info, Weight, Activity, Copy, Check, Trash2, GlassWater, Waves } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

const ACTIVITY_EXTRAS: Record<ActivityLevel, number> = {
  sedentary: 0,
  light: 300,
  moderate: 500,
  active: 700,
  very_active: 1000,
};

export function WaterCalculator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const weightInputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();
  const [weight, setWeight] = useState<string>(initialData?.weight || '70');
  const [activity, setActivity] = useState<ActivityLevel>(initialData?.activity || 'moderate');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ weight, activity });
  }, [weight, activity, onStateChange]);

  const waterNeeds = useMemo(() => {
    const w = parseFloat(weight);
    if (isNaN(w) || w <= 0) return 0;

    // Base: 35ml per kg of body weight
    const baseNeeds = w * 35;
    const extra = ACTIVITY_EXTRAS[activity];

    return baseNeeds + extra;
  }, [weight, activity]);

  const handleCopy = useCallback(() => {
    if (waterNeeds > 0) {
      navigator.clipboard.writeText(`${(waterNeeds / 1000).toFixed(2)} Litres`);
      setCopied(true);
      toast.success(t('common.copied'));
      setTimeout(() => setCopied(false), 2000);
    }
  }, [waterNeeds, t]);

  const handleClear = useCallback(() => {
    setWeight('');
    setActivity('sedentary');
    setTimeout(() => weightInputRef.current?.focus(), 0);
  }, []);

  const handlersRef = useRef({ handleClear, handleCopy, waterNeeds });

  useEffect(() => {
    handlersRef.current = { handleClear, handleCopy, waterNeeds };
  }, [handleClear, handleCopy, waterNeeds]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isEditable =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement instanceof HTMLSelectElement ||
        activeElement?.getAttribute("contenteditable") === "true";

      const { handleClear, handleCopy, waterNeeds } = handlersRef.current;

      if (isEditable && e.key !== 'Escape') return;

      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        handleClear();
      } else if (e.key.toLowerCase() === 'c' && waterNeeds > 0) {
        e.preventDefault();
        handleCopy();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const activityLevels: ActivityLevel[] = ['sedentary', 'light', 'moderate', 'active', 'very_active'];

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Inputs */}
        <div className="lg:col-span-7 space-y-8">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Weight className="w-4 h-4 text-indigo-500" /> {t('water.your_data')}
              </h3>
              <button
                onClick={handleClear}
                disabled={!weight}
                className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
              >
                <Trash2 className="w-3 h-3" /> {t('common.clear')}
                <Kbd modifier={null} className="ml-1 text-rose-400 border-rose-200 dark:border-rose-800">Esc</Kbd>
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <label htmlFor="weight" className="text-xs font-bold text-slate-500 px-1 cursor-pointer">{t('water.weight')}</label>
                <input
                  id="weight"
                  ref={weightInputRef}
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  onKeyDown={(e) => e.key === 'Escape' && handleClear()}
                  className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-2xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
                  placeholder="70"
                />
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-500 px-1">{t('water.activity')}</label>
                <div className="grid grid-cols-1 gap-2">
                  {activityLevels.map((level) => (
                    <button
                      key={level}
                      onClick={() => setActivity(level)}
                      aria-pressed={activity === level}
                      className={`flex items-center gap-4 p-4 rounded-2xl border transition-all text-left focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                        activity === level
                          ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 shadow-sm'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        activity === level ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'
                      }`}>
                        {activity === level && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <div>
                        <div className={`font-bold text-sm ${activity === level ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-200'}`}>
                          {t(`water.level.${level}`)}
                        </div>
                        <div className="text-xs text-slate-400 font-medium">{t(`water.level.${level}_desc`)}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-5 space-y-8">
          <div className="bg-slate-900 dark:bg-black p-10 rounded-[2.5rem] shadow-xl shadow-indigo-500/10 flex flex-col items-center justify-center space-y-4 min-h-[300px] relative overflow-hidden text-center group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>

            {waterNeeds > 0 && (
              <button
                onClick={handleCopy}
                className={`absolute top-6 right-6 p-3 rounded-2xl transition-all border z-20 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none flex items-center gap-2 ${
                  copied
                    ? 'bg-emerald-500 text-white'
                    : 'bg-white/10 text-white/40 border-transparent hover:text-white hover:bg-white/20 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100'
                }`}
                title={`${t('common.copy')} (C)`}
                aria-label={`${t('common.copy')} (C)`}
              >
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                {!copied && <Kbd modifier={null} className="hidden sm:inline-flex bg-white/5 border-white/20 text-white/50">C</Kbd>}
              </button>
            )}

            <div className="text-slate-400 font-bold uppercase tracking-widest text-xs">{t('water.result_estimated')}</div>
            <div className="text-6xl md:text-7xl font-black text-white font-mono tracking-tighter" aria-live="polite">
              {waterNeeds > 0 ? (waterNeeds / 1000).toFixed(2) : "0.00"}
            </div>
            <div className="text-blue-400 font-black text-xl md:text-2xl uppercase tracking-widest">
              {t('water.liters_day')}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-[2rem] flex flex-col items-center text-center gap-4">
               <div className="p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-3xl">
                  <GlassWater className="w-8 h-8" />
               </div>
               <div className="space-y-1">
                  <div className="text-2xl font-black text-slate-900 dark:text-white">
                    {t('water.glasses', { count: waterNeeds > 0 ? Math.ceil(waterNeeds / 250) : 0 })}
                  </div>
                  <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">{t('water.based_glass')}</div>
               </div>
            </div>
          </div>

          {!waterNeeds && (
            <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 p-6 rounded-[2rem] flex items-start gap-4">
              <div className="p-3 bg-white dark:bg-slate-800 text-blue-500 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                <Info className="w-6 h-6" />
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                {t('water.placeholder_info')}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Educational Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600">
            <Droplets className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black">{t('water.why_title')}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('water.why_desc')}
          </p>
        </div>

        <div className="space-y-4">
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-600">
            <Activity className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black">{t('water.exercise_title')}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('water.exercise_desc')}
          </p>
        </div>

        <div className="space-y-4">
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center text-emerald-600">
            <Waves className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black">{t('water.health_title')}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('water.health_desc')}
          </p>
        </div>
      </div>

      <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800">
        <h4 className="font-black mb-4">{t('water.tips_title')}</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <h5 className="font-bold text-sm text-blue-600">{t('water.tip_thirst')}</h5>
            <p className="text-sm text-slate-500 dark:text-slate-400">{t('water.tip_thirst_desc')}</p>
          </div>
          <div className="space-y-2">
            <h5 className="font-bold text-sm text-indigo-600">{t('water.tip_food')}</h5>
            <p className="text-sm text-slate-500 dark:text-slate-400">{t('water.tip_food_desc')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
