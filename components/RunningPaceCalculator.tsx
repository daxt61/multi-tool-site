import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Activity, Clock, Ruler, Timer, Table, Info, RotateCcw, Copy, Check, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

type Unit = 'km' | 'mi';

interface DistancePreset {
  id: string;
  name: string;
  val: number;
  unit: Unit;
}

const COMMON_DISTANCES: DistancePreset[] = [
  { id: '5k', name: '5K', val: 5, unit: 'km' },
  { id: '10k', name: '10K', val: 10, unit: 'km' },
  { id: 'half', name: 'Half Marathon', val: 21.0975, unit: 'km' },
  { id: 'marathon', name: 'Marathon', val: 42.195, unit: 'km' },
  { id: '5mi', name: '5 Miles', val: 5, unit: 'mi' },
  { id: '10mi', name: '10 Miles', val: 10, unit: 'mi' },
];

export function RunningPaceCalculator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();

  const [distance, setDistance] = useState<string>(initialData?.distance || '5');
  const [unit, setUnit] = useState<Unit>(initialData?.unit || 'km');
  const [activePresetId, setActivePresetId] = useState<string | null>(
    (!initialData?.distance || initialData?.distance === '5') && (!initialData?.unit || initialData?.unit === 'km')
      ? '5k'
      : null
  );

  const [hours, setHours] = useState<string>(initialData?.hours || '0');
  const [minutes, setMinutes] = useState<string>(initialData?.minutes || '25');
  const [seconds, setSeconds] = useState<string>(initialData?.seconds || '0');

  const [paceMinutes, setPaceMinutes] = useState<string>(initialData?.paceMinutes || '5');
  const [paceSeconds, setPaceSeconds] = useState<string>(initialData?.paceSeconds || '00');
  const [copied, setCopied] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const distanceInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    onStateChange?.({ distance, unit, hours, minutes, seconds, paceMinutes, paceSeconds });
  }, [distance, unit, hours, minutes, seconds, paceMinutes, paceSeconds, onStateChange]);

  const totalSeconds = useMemo(() => {
    return (parseInt(hours) || 0) * 3600 + (parseInt(minutes) || 0) * 60 + (parseInt(seconds) || 0);
  }, [hours, minutes, seconds]);

  const paceInSecondsPerUnit = useMemo(() => {
    const dist = parseFloat(distance);
    if (!dist || totalSeconds <= 0) return 0;
    return totalSeconds / dist;
  }, [distance, totalSeconds]);

  const calculatedPace = useMemo(() => {
    if (paceInSecondsPerUnit <= 0) return { min: 0, sec: 0 };
    return {
      min: Math.floor(paceInSecondsPerUnit / 60),
      sec: Math.round(paceInSecondsPerUnit % 60)
    };
  }, [paceInSecondsPerUnit]);

  const speed = paceInSecondsPerUnit > 0 ? (3600 / paceInSecondsPerUnit).toFixed(2) : '0.00';
  const paceOther = paceInSecondsPerUnit > 0
    ? (unit === 'km'
      ? `${Math.floor(paceInSecondsPerUnit * 1.60934 / 60)}:${Math.round((paceInSecondsPerUnit * 1.60934) % 60).toString().padStart(2, '0')}`
      : `${Math.floor(paceInSecondsPerUnit / 1.60934 / 60)}:${Math.round((paceInSecondsPerUnit / 1.60934) % 60).toString().padStart(2, '0')}`)
    : '0:00';

  const handleReset = useCallback(() => {
    setDistance('5');
    setUnit('km');
    setActivePresetId('5k');
    setHours('0');
    setMinutes('25');
    setSeconds('0');
    setPaceMinutes('5');
    setPaceSeconds('00');
    toast.success(t('runningpace.cleared'));
    setTimeout(() => {
      distanceInputRef.current?.focus();
    }, 0);
  }, [t]);

  const handleApplyPreset = (d: DistancePreset) => {
    setDistance(d.val.toString());
    setUnit(d.unit);
    setActivePresetId(d.id);
    toast.success(t('runningpace.preset_loaded'));
    setTimeout(() => {
      distanceInputRef.current?.focus();
    }, 0);
  };

  const handleCopySummary = useCallback(() => {
    const paceStr = `${calculatedPace.min}:${calculatedPace.sec < 10 ? '0' + calculatedPace.sec : calculatedPace.sec} min/${unit}`;
    const timeFormatted = `${hours}h ${minutes}m ${seconds}s`;
    const summary = `${distance} ${unit} in ${timeFormatted}\nPace: ${paceStr}\nSpeed: ${speed} ${unit}/h\nPace (${unit === 'km' ? 'mi' : 'km'}): ${paceOther} min/${unit === 'km' ? 'mi' : 'km'}`;

    navigator.clipboard.writeText(summary).then(() => {
      setCopied(true);
      toast.success(t('runningpace.summary_copied'));
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      // Fallback or silently handle clipboard errors
    });
  }, [calculatedPace, distance, unit, hours, minutes, seconds, speed, paceOther, t]);

  // Keydown listeners for Esc and C
  const handlersRef = useRef({
    onReset: handleReset,
    onCopy: handleCopySummary,
  });

  useEffect(() => {
    handlersRef.current = {
      onReset: handleReset,
      onCopy: handleCopySummary,
    };
  }, [handleReset, handleCopySummary]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInput =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement instanceof HTMLSelectElement;

      const isInsideContainer = containerRef.current?.contains(activeElement) || activeElement === document.body;

      if (!isInsideContainer) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        handlersRef.current.onReset();
      } else if (e.key.toLowerCase() === 'c' && !isInput && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        handlersRef.current.onCopy();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const splits = useMemo(() => {
    const dist = parseFloat(distance);
    if (!dist || paceInSecondsPerUnit <= 0) return [];
    const items = [];
    const maxSplits = Math.min(Math.ceil(dist), 50);

    for (let i = 1; i <= maxSplits; i++) {
        const currentDist = i === maxSplits ? dist : i;
        const totalSecs = paceInSecondsPerUnit * currentDist;
        const h = Math.floor(totalSecs / 3600);
        const m = Math.floor((totalSecs % 3600) / 60);
        const s = Math.round(totalSecs % 60);

        items.push({
            dist: currentDist,
            time: `${h > 0 ? h + ':' : ''}${m < 10 && h > 0 ? '0' + m : m}:${s < 10 ? '0' + s : s}`
        });
        if (i === maxSplits) break;
    }
    return items;
  }, [distance, paceInSecondsPerUnit]);

  return (
    <div ref={containerRef} className="max-w-4xl mx-auto space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          {/* Distance */}
          <div className="bg-white dark:bg-slate-900/40 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Ruler className="w-4 h-4 text-indigo-500" />
                <label htmlFor="distance-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                  {t('runningpace.distance', 'Distance')}
                </label>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>{t('runningpace.presets_title')}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <input
                id="distance-input"
                ref={distanceInputRef}
                type="number"
                value={distance}
                onChange={(e) => {
                  setDistance(e.target.value);
                  setActivePresetId(null);
                }}
                className="flex-1 p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-xl outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/20"
                placeholder="5"
                step="any"
              />
              <select
                id="unit-select"
                aria-label="Unit"
                value={unit}
                onChange={(e) => {
                  setUnit(e.target.value as Unit);
                  setActivePresetId(null);
                }}
                className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold outline-none cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <option value="km">km</option>
                <option value="mi">mi</option>
              </select>
            </div>
            <div className="flex flex-wrap gap-2">
              {COMMON_DISTANCES.map(d => {
                const isActive = activePresetId === d.id;
                return (
                  <button
                    key={d.id}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => handleApplyPreset(d)}
                    className={`px-3 py-1.5 transition-all rounded-lg text-[10px] font-black uppercase tracking-tighter border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                      isActive
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-500/20'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-transparent hover:bg-indigo-500 hover:text-white'
                    }`}
                  >
                    {d.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time */}
          <div className="bg-white dark:bg-slate-900/40 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-2 px-1">
              <Clock className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{t('runningpace.time', 'Time')}</h3>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label htmlFor="time-hours" className="text-[10px] font-bold text-slate-500 px-1 cursor-pointer">
                  {t('runningpace.hours', 'HH')}
                </label>
                <input
                  id="time-hours"
                  type="number"
                  aria-label={t('runningpace.hours', 'Hours')}
                  value={hours}
                  onChange={e => setHours(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-center font-mono font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="time-minutes" className="text-[10px] font-bold text-slate-500 px-1 cursor-pointer">
                  {t('runningpace.minutes', 'MM')}
                </label>
                <input
                  id="time-minutes"
                  type="number"
                  aria-label={t('runningpace.minutes', 'Minutes')}
                  value={minutes}
                  onChange={e => setMinutes(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-center font-mono font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="time-seconds" className="text-[10px] font-bold text-slate-500 px-1 cursor-pointer">
                  {t('runningpace.seconds', 'SS')}
                </label>
                <input
                  id="time-seconds"
                  type="number"
                  aria-label={t('runningpace.seconds', 'Seconds')}
                  value={seconds}
                  onChange={e => setSeconds(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-center font-mono font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 hover:bg-rose-500 hover:text-white transition-all rounded-2xl font-bold text-sm flex items-center justify-center gap-2 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
              aria-label={t('common.reset')}
            >
              <RotateCcw className="w-4 h-4 group-hover:rotate-180 transition-transform" />
              <span>{t('common.reset')}</span>
              <Kbd modifier={null}>Esc</Kbd>
            </button>
            <button
              type="button"
              onClick={handleCopySummary}
              className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white transition-all rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm shadow-indigo-600/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              aria-label={t('runningpace.copy_summary')}
            >
              {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>{t('runningpace.copy_summary')}</span>
              <Kbd modifier={null}>C</Kbd>
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Pace Display */}
          <div className="bg-indigo-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-indigo-600/20 flex flex-col items-center justify-center text-center space-y-2">
            <Timer className="w-8 h-8 mb-2 opacity-50" />
            <h4 className="text-sm font-black uppercase tracking-widest opacity-80">{t('runningpace.calculated_pace', 'Calculated Pace')}</h4>
            <div className="text-6xl font-black font-mono tracking-tighter">
              {calculatedPace.min}:{calculatedPace.sec < 10 ? '0' + calculatedPace.sec : calculatedPace.sec}
            </div>
            <p className="text-indigo-200 font-bold">min / {unit}</p>
          </div>

          {/* Speed conversion */}
          <div className="grid grid-cols-2 gap-4">
             <div className="bg-white dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{t('runningpace.speed', 'Speed')}</div>
                <div className="text-xl font-black">{speed} {unit}/h</div>
             </div>
             <div className="bg-white dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{t('runningpace.pace_other', 'Pace (Other)')}</div>
                <div className="text-xl font-black">
                    {paceOther} min/{unit === 'km' ? 'mi' : 'km'}
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Splits Table */}
      {splits.length > 0 && (
        <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] overflow-hidden">
          <div className="bg-slate-50 dark:bg-slate-900/50 px-8 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
             <Table className="w-5 h-5 text-indigo-500" />
             <span className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-xs">{t('runningpace.splits', 'Splits')}</span>
          </div>
          <div className="p-4 overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="text-left text-slate-400 border-b border-slate-100 dark:border-slate-800">
                        <th className="px-4 py-3 font-black uppercase text-[10px] tracking-widest">{t('runningpace.split_unit', 'Split')} ({unit})</th>
                        <th className="px-4 py-3 font-black uppercase text-[10px] tracking-widest">{t('runningpace.split_time', 'Time')}</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {splits.map((s, i) => (
                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="px-4 py-3 font-mono font-bold text-slate-500 dark:text-slate-400">{s.dist}</td>
                            <td className="px-4 py-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">{s.time}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-900/20 p-6 rounded-[2rem] flex gap-4">
        <Info className="w-6 h-6 text-amber-600 shrink-0" />
        <div className="space-y-1">
          <h4 className="font-bold text-amber-900 dark:text-amber-100">{t('runningpace.about_title', 'Running Pace Calculator')}</h4>
          <p className="text-sm text-amber-700 dark:text-amber-300 leading-relaxed">
            {t('runningpace.about_text', 'Plan your next race or training session. Enter the distance and your target time to see the required pace and kilometer/mile splits. All calculations are performed instantly as you type.')}
          </p>
        </div>
      </div>
    </div>
  );
}
