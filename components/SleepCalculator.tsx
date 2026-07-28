import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Moon, Sun, Clock, Coffee, Info, Check, Copy, Trash2, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

interface SleepCalculatorProps {
  initialData?: any;
  onStateChange?: (state: any) => void;
}

export function SleepCalculator({ initialData, onStateChange }: SleepCalculatorProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [wakeUpTime, setWakeUpTime] = useState(initialData?.wakeUpTime || '07:00');
  const [copiedTime, setCopiedTime] = useState<string | null>(null);

  useEffect(() => {
    onStateChange?.({ wakeUpTime });
  }, [wakeUpTime, onStateChange]);

  const calculateBedtimes = useMemo(() => {
    const [hours, minutes] = wakeUpTime.split(':').map(Number);
    const wakeDate = new Date();
    wakeDate.setHours(hours, minutes, 0, 0);

    const cycles = [6, 5, 4, 3]; // Number of 90-minute cycles
    return cycles.map(cycle => {
      const bedtime = new Date(wakeDate.getTime() - (cycle * 90 + 15) * 60000);
      return {
        time: bedtime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        cycles: cycle,
        duration: (cycle * 1.5).toFixed(1).replace('.5', 'h30').replace('.0', 'h00')
      };
    });
  }, [wakeUpTime]);

  const calculateWakeTimes = useMemo(() => {
    const now = new Date();
    // 15 minutes to fall asleep
    const startDate = new Date(now.getTime() + 15 * 60000);

    const cycles = [3, 4, 5, 6];
    return cycles.map(cycle => {
      const wakeTime = new Date(startDate.getTime() + (cycle * 90) * 60000);
      return {
        time: wakeTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        cycles: cycle,
        duration: (cycle * 1.5).toFixed(1).replace('.5', 'h30').replace('.0', 'h00')
      };
    });
  }, []);

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTime(text);
    toast.success(t('common.copied'));
    setTimeout(() => setCopiedTime(null), 2000);
  }, [t]);

  const handleReset = useCallback(() => {
    setWakeUpTime('07:00');
    toast.success(t('sleep.reset_success'));
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [t]);

  // Keyboard shortcut event listener pattern
  const handlersRef = useRef({
    handleReset,
    copyToClipboard,
    calculateBedtimes,
  });

  useEffect(() => {
    handlersRef.current = {
      handleReset,
      copyToClipboard,
      calculateBedtimes,
    };
  }, [handleReset, copyToClipboard, calculateBedtimes]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isEditable =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement instanceof HTMLSelectElement ||
        activeElement?.getAttribute('contenteditable') === 'true';

      const { handleReset, copyToClipboard, calculateBedtimes } = handlersRef.current;

      // Allow Escape to clear/reset even when focused on input
      if (e.key === 'Escape') {
        e.preventDefault();
        handleReset();
        return;
      }

      if (isEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        if (calculateBedtimes.length > 0) {
          copyToClipboard(calculateBedtimes[0].time);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Wake Up Planning */}
      <section className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8" aria-labelledby="sleep-planning-title">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-1">
          <div className="space-y-1">
            <h3 id="sleep-planning-title" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-500" aria-hidden="true" /> {t('sleep.planning_title')}
            </h3>
            <p className="text-sm text-slate-500">{t('sleep.planning_subtitle')}</p>
          </div>
          <div className="flex items-center gap-4">
            <label htmlFor="wake-up-time" className="sr-only">
              {t('sleep.wake_up_label')}
            </label>
            <input
              id="wake-up-time"
              ref={inputRef}
              type="time"
              value={wakeUpTime}
              onChange={(e) => setWakeUpTime(e.target.value)}
              className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-2xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
            />
            <button
              onClick={handleReset}
              className="p-4 text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 rounded-2xl transition-all focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none flex items-center gap-2"
              title={`${t('common.reset')} (Esc)`}
              aria-label={`${t('common.reset')} (Esc)`}
            >
              <Trash2 className="w-5 h-5" aria-hidden="true" />
              <Kbd modifier={null} className="bg-white/50 border-rose-200 dark:border-rose-900/50 text-rose-600">Esc</Kbd>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {calculateBedtimes.map((item, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-3xl space-y-4 relative group/card transition-all hover:border-indigo-500/30">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest flex justify-between">
                <span>{t('sleep.cycles', { count: item.cycles })}</span>
                <span className={item.cycles >= 5 ? 'text-emerald-500' : 'text-amber-500'}>{item.duration}</span>
              </div>
              <div className="text-3xl font-black font-mono text-slate-900 dark:text-white">{item.time}</div>
              <button
                onClick={() => copyToClipboard(item.time)}
                className={`w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                  copiedTime === item.time
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400'
                }`}
                title={i === 0 ? `${t('sleep.bedtime_action', { time: item.time })} (C)` : t('sleep.bedtime_action', { time: item.time })}
              >
                {copiedTime === item.time ? <Check className="w-4 h-4" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
                {copiedTime === item.time ? t('common.copied') : t('sleep.bedtime_action', { time: item.time })}
                {i === 0 && <Kbd modifier={null} className="ml-1 text-[9px] bg-slate-100 dark:bg-slate-800">C</Kbd>}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Sleep Now */}
      <section className="bg-slate-900 dark:bg-black p-10 rounded-[2.5rem] shadow-xl shadow-indigo-500/10 space-y-8 relative overflow-hidden" aria-labelledby="sleep-now-title">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-32 -mt-32 blur-3xl" aria-hidden="true"></div>

        <div className="relative z-10 space-y-1 text-center md:text-left">
          <h3 id="sleep-now-title" className="text-xs font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2 justify-center md:justify-start">
            <Moon className="w-4 h-4" aria-hidden="true" /> {t('sleep.sleep_now_title')}
          </h3>
          <p className="text-sm text-slate-400">{t('sleep.sleep_now_subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
          {calculateWakeTimes.map((item, i) => (
            <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-3xl space-y-4 hover:bg-white/10 transition-all group/now">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest flex justify-between">
                <span>{t('sleep.cycles', { count: item.cycles })}</span>
                <span className="text-indigo-400">{item.duration}</span>
              </div>
              <div className="text-3xl font-black font-mono text-white">{item.time}</div>
              <button
                onClick={() => copyToClipboard(item.time)}
                className={`w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                  copiedTime === item.time
                    ? 'bg-emerald-500 text-white'
                    : 'bg-white/10 text-white/60 hover:bg-white hover:text-slate-900'
                }`}
              >
                {copiedTime === item.time ? <Check className="w-4 h-4" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
                {copiedTime === item.time ? t('common.copied') : t('sleep.wake_time_action', { time: item.time })}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Educational Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-600">
            <Clock className="w-6 h-6" aria-hidden="true" />
          </div>
          <h3 className="text-lg font-black">{t('sleep.rule_90_title')}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('sleep.rule_90_text')}
          </p>
        </div>

        <div className="space-y-4">
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center text-amber-600">
            <Zap className="w-6 h-6" aria-hidden="true" />
          </div>
          <h3 className="text-lg font-black">{t('sleep.inertia_title')}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('sleep.inertia_text')}
          </p>
        </div>

        <div className="space-y-4">
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center text-emerald-600">
            <Coffee className="w-6 h-6" aria-hidden="true" />
          </div>
          <h3 className="text-lg font-black">{t('sleep.falling_sleep_title')}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('sleep.falling_sleep_text')}
          </p>
        </div>
      </div>

      <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 flex items-start gap-4">
         <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
            <Info className="w-6 h-6" aria-hidden="true" />
         </div>
         <div className="space-y-2">
            <h4 className="font-bold dark:text-white">{t('sleep.tips_title')}</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              {t('sleep.tips_text')}
            </p>
         </div>
      </div>
    </div>
  );
}
