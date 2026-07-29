import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Clock, Copy, Check, Info, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

export function CronGenerator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t, i18n } = useTranslation();
  const [minutes, setMinutes] = useState(initialData?.minutes || '*');
  const [hours, setHours] = useState(initialData?.hours || '*');
  const [dayOfMonth, setDayOfMonth] = useState(initialData?.dayOfMonth || '*');
  const [month, setMonth] = useState(initialData?.month || '*');
  const [dayOfWeek, setDayOfWeek] = useState(initialData?.dayOfWeek || '*');
  const [cron, setCron] = useState('* * * * *');
  const [copied, setCopied] = useState(false);

  const minuteInputRef = useRef<HTMLInputElement>(null);

  const matchesCronField = useCallback((value: number, pattern: string, min: number, max: number): boolean => {
    if (pattern === '*') return true;
    if (pattern.startsWith('*/')) {
      const step = parseInt(pattern.slice(2));
      return isNaN(step) || step <= 0 ? true : value % step === 0;
    }
    if (pattern.includes(',')) {
      return pattern.split(',').some(p => matchesCronField(value, p, min, max));
    }
    if (pattern.includes('-')) {
      const parts = pattern.split('-');
      if (parts.length === 2) {
        const start = Number(parts[0]);
        const end = Number(parts[1]);
        if (!isNaN(start) && !isNaN(end)) {
          return value >= start && value <= end;
        }
      }
    }
    return parseInt(pattern) === value;
  }, []);

  const nextRuns = useMemo(() => {
    const runs: string[] = [];
    let current = new Date();
    current.setSeconds(0, 0);

    // Safety limit to avoid infinite loops (24 hours)
    const limit = new Date(current.getTime() + 24 * 60 * 60 * 1000);

    // Enforce size/iteration boundaries to safeguard against client-side Denial of Service (DoS)
    let iterations = 0;
    const maxIterations = 5000;

    while (runs.length < 3 && current < limit && iterations < maxIterations) {
      iterations++;
      current.setMinutes(current.getMinutes() + 1);

      const m = current.getMinutes();
      const h = current.getHours();
      const dom = current.getDate();
      const mon = current.getMonth() + 1;
      const dow = current.getDay();

      if (
        matchesCronField(m, minutes, 0, 59) &&
        matchesCronField(h, hours, 0, 23) &&
        matchesCronField(dom, dayOfMonth, 1, 31) &&
        matchesCronField(mon, month, 1, 12) &&
        matchesCronField(dow, dayOfWeek, 0, 6)
      ) {
        runs.push(current.toLocaleString(i18n.language, {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }));
      }
    }
    return runs;
  }, [minutes, hours, dayOfMonth, month, dayOfWeek, i18n.language, matchesCronField]);

  const humanDescription = useMemo(() => {
    if (cron === '* * * * *') return t('cron.desc_every_minute');

    const monthsArr = ['', t('unit.symbol.time.january'), t('unit.symbol.time.february'), t('unit.symbol.time.march'), t('unit.symbol.time.april'), t('unit.symbol.time.may'), t('unit.symbol.time.june'), t('unit.symbol.time.july'), t('unit.symbol.time.august'), t('unit.symbol.time.september'), t('unit.symbol.time.october'), t('unit.symbol.time.november'), t('unit.symbol.time.december')];
    const daysArr = [t('unit.symbol.time.sunday'), t('unit.symbol.time.monday'), t('unit.symbol.time.tuesday'), t('unit.symbol.time.wednesday'), t('unit.symbol.time.thursday'), t('unit.symbol.time.friday'), t('unit.symbol.time.saturday'), t('unit.symbol.time.sunday')];

    let res = t('cron.desc_runs') + " ";

    // Minutes
    if (minutes === '*') res += t('cron.desc_every_minute_connect') + " ";
    else if (minutes.startsWith('*/')) res += t('cron.desc_every_n_minutes', { count: minutes.slice(2) }) + " ";
    else res += t('cron.desc_at_minute', { count: minutes }) + " ";

    // Hours
    if (hours === '*') {
      if (minutes !== '*') res += t('cron.desc_every_hour_connect') + " ";
    } else if (hours.startsWith('*/')) res += t('cron.desc_every_n_hours', { count: hours.slice(2) }) + " ";
    else res += t('cron.desc_at_hour', { count: hours }) + " ";

    // Day of Month
    if (dayOfMonth !== '*') {
      res += t('cron.desc_on_day', { day: dayOfMonth === 'L' ? t('cron.last_day') : dayOfMonth }) + " ";
    }

    // Month
    if (month !== '*') {
      const mIdx = parseInt(month);
      res += t('cron.desc_in_month', { month: monthsArr[mIdx] || month }) + " ";
    }

    // Day of Week
    if (dayOfWeek !== '*') {
      const parseDay = (val: string) => {
        const d = parseInt(val);
        return daysArr[d] || val;
      };

      if (dayOfWeek.includes('-')) {
        const [start, end] = dayOfWeek.split('-');
        res += t('cron.desc_from_to', { start: parseDay(start), end: parseDay(end) }) + " ";
      } else if (dayOfWeek.includes(',')) {
        const list = dayOfWeek.split(',').map(parseDay);
        const last = list.pop();
        res += t('cron.desc_on_list', { list: list.join(', '), last }) + " ";
      } else {
        res += t('cron.desc_on_day_week', { day: parseDay(dayOfWeek) }) + " ";
      }
    }

    return res.trim() + ".";
  }, [cron, minutes, hours, dayOfMonth, month, dayOfWeek, t]);

  useEffect(() => {
    const newCron = `${minutes} ${hours} ${dayOfMonth} ${month} ${dayOfWeek}`;
    setCron(newCron);
    onStateChange?.({ minutes, hours, dayOfMonth, month, dayOfWeek, cron: newCron });
  }, [minutes, hours, dayOfMonth, month, dayOfWeek]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(cron);
    setCopied(true);
    toast.success(t('cron.toast_copied') || 'Cron expression copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  }, [cron, t]);

  const handleClear = useCallback(() => {
    setMinutes('*');
    setHours('*');
    setDayOfMonth('*');
    setMonth('*');
    setDayOfWeek('*');
    toast.success(t('cron.toast_cleared') || 'Cron expression reset!');
    minuteInputRef.current?.focus();
  }, [t]);

  // Keyboard shortcut handlers
  const handlersRef = useRef({
    onClear: handleClear,
    onCopy: handleCopy,
  });

  useEffect(() => {
    handlersRef.current = {
      onClear: handleClear,
      onCopy: handleCopy,
    };
  }, [handleClear, handleCopy]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable) {
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        handlersRef.current.onClear();
      } else if (e.key.toLowerCase() === "c" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        handlersRef.current.onCopy();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const presets = [
    { name: t('cron.preset_every_minute'), value: '* * * * *' },
    { name: t('cron.preset_every_5'), value: '*/5 * * * *' },
    { name: t('cron.preset_every_hour'), value: '0 * * * *' },
    { name: t('cron.preset_midnight'), value: '0 0 * * *' },
    { name: t('cron.preset_sunday'), value: '0 0 * * 0' },
    { name: t('cron.preset_monthly'), value: '0 0 1 * *' },
  ];

  const applyPreset = (value: string) => {
    const parts = value.split(' ');
    if (parts.length === 5) {
      setMinutes(parts[0]);
      setHours(parts[1]);
      setDayOfMonth(parts[2]);
      setMonth(parts[3]);
      setDayOfWeek(parts[4]);
      toast.success(t('cron.toast_preset_loaded') || 'Preset applied successfully!');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10" role="region" aria-label={t('tool.cron-generator.name')}>
      <div className="flex justify-end gap-3 px-1 items-center">
        <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
          <Kbd modifier={null} className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400">Esc</Kbd>
          {t('common.clear')}
        </span>
        <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400 mr-2">
          <Kbd modifier={null} className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400">C</Kbd>
          {t('common.copy')}
        </span>
        <button
          onClick={handleClear}
          disabled={cron === '* * * * *'}
          className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
        >
          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" /> {t('common.clear')}
        </button>
      </div>

      <div className="bg-slate-900 dark:bg-black p-10 rounded-[2.5rem] shadow-xl shadow-indigo-500/10 text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-500/10 text-indigo-400 rounded-full text-xs font-black uppercase tracking-widest border border-indigo-500/20">
          <Clock className="w-3 h-3" aria-hidden="true" /> {t('cron.expression_label')}
        </div>
        <div className="space-y-2">
          <div className="text-4xl md:text-6xl font-mono font-black text-white tracking-wider break-all" aria-live="polite" aria-atomic="true">
            {cron}
          </div>
          <p className="text-indigo-300 font-medium text-sm md:text-base animate-in fade-in slide-in-from-bottom-2 duration-500">
            {humanDescription}
          </p>
        </div>
        <button
          onClick={handleCopy}
          className={`px-8 py-4 rounded-2xl transition-all active:scale-95 flex items-center gap-2 font-black text-lg mx-auto focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
            copied ? 'bg-emerald-500 text-white' : 'bg-white text-slate-900 hover:bg-slate-100'
          }`}
        >
          {copied ? <Check className="w-6 h-6" aria-hidden="true" /> : <Copy className="w-6 h-6" aria-hidden="true" />}
          {copied ? t('common.copied') : t('common.copy')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {[
          { id: 'cron-minute', label: t('cron.minute'), value: minutes, setter: setMinutes, hint: '0-59, *, */n', ref: minuteInputRef },
          { id: 'cron-hour', label: t('cron.hour'), value: hours, setter: setHours, hint: '0-23, *, */n' },
          { id: 'cron-dom', label: t('cron.day_month'), value: dayOfMonth, setter: setDayOfMonth, hint: '1-31, *, L' },
          { id: 'cron-month', label: t('cron.month'), value: month, setter: setMonth, hint: '1-12, *, JAN-DEC' },
          { id: 'cron-dow', label: t('cron.day_week'), value: dayOfWeek, setter: setDayOfWeek, hint: '0-6, *, SUN-SAT' },
        ].map((field) => (
          <div key={field.id} className="space-y-2">
            <label htmlFor={field.id} className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 cursor-pointer block">
              {field.label}
            </label>
            <input
              id={field.id}
              ref={field.ref}
              type="text"
              value={field.value}
              onChange={(e) => field.setter(e.target.value)}
              className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center font-mono font-bold text-xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
            />
            <p className="text-[10px] text-center text-slate-400 font-bold">{field.hint}</p>
          </div>
        ))}
      </div>

      <div className="space-y-4" role="group" aria-labelledby="cron-presets-heading">
        <h4 id="cron-presets-heading" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">{t('cron.presets_title')}</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {presets.map((preset) => (
            <button
              key={preset.name}
              onClick={() => applyPreset(preset.value)}
              className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-left hover:border-indigo-500/50 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-all group focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
            >
              <div className="font-bold text-sm mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{preset.name}</div>
              <div className="font-mono text-xs text-slate-400">{preset.value}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-[2.5rem] space-y-4">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 px-1">
            <Clock className="w-4 h-4 text-indigo-500" aria-hidden="true" /> {t('cron.next_runs')}
          </h4>
          <div className="space-y-2">
            {nextRuns.length > 0 ? (
              nextRuns.map((run, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-950 rounded-xl font-mono text-sm border border-slate-100 dark:border-slate-800">
                  <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-[10px] font-black">{i + 1}</span>
                  <span className="dark:text-slate-300">{run}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400 italic px-1">{t('cron.no_upcoming_runs')}</p>
            )}
          </div>
        </div>

        <div className="bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-900/20 p-8 rounded-[2.5rem] flex gap-4">
          <div className="shrink-0 w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center text-amber-600" aria-hidden="true">
            <Info className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h5 className="font-bold text-amber-900 dark:text-amber-100">{t('cron.how_title')}</h5>
            <p className="text-sm text-amber-700 dark:text-amber-300 leading-relaxed">
              {t('cron.how_text')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
