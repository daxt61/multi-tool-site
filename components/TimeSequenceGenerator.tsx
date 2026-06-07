import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Calendar, Copy, Check, Trash2, Download,
  Settings2, RefreshCw, Info, Clock
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_COUNT = 1000;

type IntervalUnit = 'seconds' | 'minutes' | 'hours' | 'days' | 'weeks' | 'months' | 'years';

export function TimeSequenceGenerator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [start, setStart] = useState<string>(initialData?.start || new Date().toISOString().slice(0, 16));
  const [count, setCount] = useState<number>(initialData?.count ?? 10);
  const [interval, setInterval] = useState<number>(initialData?.interval ?? 1);
  const [unit, setUnit] = useState<IntervalUnit>(initialData?.unit || 'days');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onStateChange?.({ start, count, interval, unit });
  }, [start, count, interval, unit, onStateChange]);

  const sequence = useMemo(() => {
    const result: string[] = [];
    const startDate = new Date(start);
    if (isNaN(startDate.getTime())) return [];

    const n = Math.min(Math.max(1, count), MAX_COUNT);

    try {
      for (let i = 0; i < n; i++) {
        const currentDate = new Date(startDate);

        switch (unit) {
          case 'seconds':
            currentDate.setSeconds(startDate.getSeconds() + (i * interval));
            break;
          case 'minutes':
            currentDate.setMinutes(startDate.getMinutes() + (i * interval));
            break;
          case 'hours':
            currentDate.setHours(startDate.getHours() + (i * interval));
            break;
          case 'days':
            currentDate.setDate(startDate.getDate() + (i * interval));
            break;
          case 'weeks':
            currentDate.setDate(startDate.getDate() + (i * interval * 7));
            break;
          case 'months':
            currentDate.setMonth(startDate.getMonth() + (i * interval));
            break;
          case 'years':
            currentDate.setFullYear(startDate.getFullYear() + (i * interval));
            break;
        }

        result.push(currentDate.toLocaleString());
      }
    } catch (e) {
      console.error(e);
    }

    return result;
  }, [start, count, interval, unit]);

  const handleCopy = () => {
    if (sequence.length === 0) return;
    navigator.clipboard.writeText(sequence.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (sequence.length === 0) return;
    const blob = new Blob([sequence.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `time-sequence-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setStart(new Date().toISOString().slice(0, 16));
    setCount(10);
    setInterval(1);
    setUnit('days');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Configuration */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 px-1">
              <Settings2 className="w-4 h-4 text-indigo-500" /> {t('common.options')}
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="start-date" className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">{t('datecalc.start_date')}</label>
                <input
                  id="start-date"
                  type="datetime-local"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  className="w-full p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="interval" className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Interval</label>
                  <input
                    id="interval"
                    type="number"
                    value={interval}
                    onChange={(e) => setInterval(parseInt(e.target.value) || 1)}
                    className="w-full p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="unit" className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Unit</label>
                  <select
                    id="unit"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value as IntervalUnit)}
                    className="w-full p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white cursor-pointer appearance-none"
                  >
                    <option value="seconds">Seconds</option>
                    <option value="minutes">Minutes</option>
                    <option value="hours">Hours</option>
                    <option value="days">Days</option>
                    <option value="weeks">Weeks</option>
                    <option value="months">Months</option>
                    <option value="years">Years</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label htmlFor="count" className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t('sequence.count')}</label>
                  <span className="text-xs font-bold text-indigo-500 font-mono">{count}</span>
                </div>
                <input
                  id="count"
                  type="range"
                  min="1"
                  max={MAX_COUNT}
                  value={count}
                  onChange={(e) => setCount(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>
            </div>

            <button
              onClick={handleReset}
              className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all"
            >
              <RefreshCw className="w-4 h-4" /> {t('common.reset')}
            </button>
          </div>
        </div>

        {/* Results Area */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
              <Calendar className="w-4 h-4 text-indigo-500" /> Sequence
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                disabled={sequence.length === 0}
                className="p-2 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg hover:bg-indigo-100 disabled:opacity-50 transition-all"
                title={t('common.download')}
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={handleCopy}
                disabled={sequence.length === 0}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                  copied
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                    : 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700'
                } disabled:opacity-50`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? t('common.copied') : t('common.copy')}
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-6 h-[500px] overflow-y-auto relative group shadow-sm">
             {sequence.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {sequence.map((item, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 animate-in fade-in slide-in-from-left-2 duration-300" style={{ animationDelay: `${Math.min(i * 10, 500)}ms` }}>
                      <span className="w-8 h-8 flex items-center justify-center bg-white dark:bg-slate-700 rounded-xl text-[10px] font-black text-indigo-500 border border-slate-100 dark:border-slate-600 shadow-sm">{i + 1}</span>
                      <span className="font-bold text-sm dark:text-slate-200 font-mono">{item}</span>
                    </div>
                  ))}
                </div>
             ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-4">
                   <Clock className="w-12 h-12 opacity-20" />
                   <p className="italic font-medium">{t('common.waiting')}</p>
                </div>
             )}
          </div>
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <Info className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">About Time Sequence Generator</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            This tool allows you to generate an ordered series of dates and times. You can specify a starting point, the step size (interval), and the number of elements to generate. It supports units ranging from seconds to years, making it ideal for creating schedules, log entries, or test data.
          </p>
        </div>
      </div>
    </div>
  );
}
