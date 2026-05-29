import { useState, useEffect, useMemo, useCallback } from 'react';
import { Clock, Copy, Check, Info, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function CronGenerator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t, i18n } = useTranslation();
  const [minutes, setMinutes] = useState(initialData?.minutes || '*');
  const [hours, setHours] = useState(initialData?.hours || '*');
  const [dayOfMonth, setDayOfMonth] = useState(initialData?.dayOfMonth || '*');
  const [month, setMonth] = useState(initialData?.month || '*');
  const [dayOfWeek, setDayOfWeek] = useState(initialData?.dayOfWeek || '*');
  const [cron, setCron] = useState('* * * * *');
  const [copied, setCopied] = useState(false);

  const matchesCronField = useCallback((value: number, pattern: string, min: number, max: number): boolean => {
    if (pattern === '*') return true;
    if (pattern.startsWith('*/')) {
      const step = parseInt(pattern.slice(2));
      return value % step === 0;
    }
    if (pattern.includes(',')) {
      return pattern.split(',').some(p => matchesCronField(value, p, min, max));
    }
    if (pattern.includes('-')) {
      const [start, end] = pattern.split('-').map(Number);
      return value >= start && value <= end;
    }
    return parseInt(pattern) === value;
  }, []);

  const nextRuns = useMemo(() => {
    const runs: string[] = [];
    let current = new Date();
    current.setSeconds(0, 0);

    // Safety limit to avoid infinite loops
    const limit = new Date(current.getTime() + 24 * 60 * 60 * 1000); // 24 hours

    while (runs.length < 3 && current < limit) {
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

  const handleCopy = () => {
    navigator.clipboard.writeText(cron);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
    setMinutes(parts[0]);
    setHours(parts[1]);
    setDayOfMonth(parts[2]);
    setMonth(parts[3]);
    setDayOfWeek(parts[4]);
  };

  const handleClear = () => {
    setMinutes('*');
    setHours('*');
    setDayOfMonth('*');
    setMonth('*');
    setDayOfWeek('*');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <div className="flex justify-end px-1">
        <button
          onClick={handleClear}
          disabled={cron === '* * * * *'}
          className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
        >
          <Trash2 className="w-3 h-3" /> {t('common.clear')}
        </button>
      </div>

      <div className="bg-slate-900 dark:bg-black p-10 rounded-[2.5rem] shadow-xl shadow-indigo-500/10 text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-500/10 text-indigo-400 rounded-full text-xs font-black uppercase tracking-widest border border-indigo-500/20">
          <Clock className="w-3 h-3" /> {t('cron.expression_label')}
        </div>
        <div className="space-y-2">
          <div className="text-4xl md:text-6xl font-mono font-black text-white tracking-wider break-all">
            {cron}
          </div>
          <p className="text-indigo-300 font-medium text-sm md:text-base animate-in fade-in slide-in-from-bottom-2 duration-500">
            {humanDescription}
          </p>
        </div>
        <button
          onClick={handleCopy}
          className={`px-8 py-4 rounded-2xl transition-all active:scale-95 flex items-center gap-2 font-black text-lg mx-auto ${
            copied ? 'bg-emerald-500 text-white' : 'bg-white text-slate-900 hover:bg-slate-100'
          }`}
        >
          {copied ? <Check className="w-6 h-6" /> : <Copy className="w-6 h-6" />}
          {copied ? t('common.copied') : t('common.copy')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {[
          { id: 'cron-minute', label: t('cron.minute'), value: minutes, setter: setMinutes, hint: '0-59, *, */n' },
          { id: 'cron-hour', label: t('cron.hour'), value: hours, setter: setHours, hint: '0-23, *, */n' },
          { id: 'cron-dom', label: t('cron.day_month'), value: dayOfMonth, setter: setDayOfMonth, hint: '1-31, *, L' },
          { id: 'cron-month', label: t('cron.month'), value: month, setter: setMonth, hint: '1-12, *, JAN-DEC' },
          { id: 'cron-dow', label: t('cron.day_week'), value: dayOfWeek, setter: setDayOfWeek, hint: '0-6, *, SUN-SAT' },
        ].map((field) => (
          <div key={field.id} className="space-y-2">
            <label htmlFor={field.id} className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 cursor-pointer">
              {field.label}
            </label>
            <input
              id={field.id}
              type="text"
              value={field.value}
              onChange={(e) => field.setter(e.target.value)}
              className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center font-mono font-bold text-xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
            />
            <p className="text-[10px] text-center text-slate-400 font-bold">{field.hint}</p>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">{t('cron.presets_title')}</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {presets.map((preset) => (
            <button
              key={preset.name}
              onClick={() => applyPreset(preset.value)}
              className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-left hover:border-indigo-500/50 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-all group"
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
            <Clock className="w-4 h-4 text-indigo-500" /> {t('cron.next_runs')}
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
        <div className="shrink-0 w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center text-amber-600">
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
