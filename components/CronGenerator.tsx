import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Clock, Copy, Check, Info, Trash2, Calendar } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'minutes' | 'hours' | 'dayOfMonth' | 'month' | 'dayOfWeek'>('minutes');

  const mainInputRef = useRef<HTMLInputElement>(null);

  // Denial of Service Mitigation: Enforce limits on text inputs
  const sanitizeInput = (val: string, maxLen: number = 30) => {
    return val.slice(0, maxLen).replace(/[^0-9a-zA-Z*?/,#-]/g, '');
  };

  const matchesCronField = useCallback((value: number, pattern: string, min: number, max: number): boolean => {
    if (pattern === '*' || pattern === '?') return true;
    if (pattern.startsWith('*/')) {
      const step = parseInt(pattern.slice(2), 10);
      return !isNaN(step) && step > 0 && value % step === 0;
    }
    if (pattern.includes(',')) {
      return pattern.split(',').some(p => matchesCronField(value, p, min, max));
    }
    if (pattern.includes('-')) {
      const [start, end] = pattern.split('-').map(p => parseInt(p, 10));
      return !isNaN(start) && !isNaN(end) && value >= start && value <= end;
    }
    const valInt = parseInt(pattern, 10);
    return !isNaN(valInt) && valInt === value;
  }, []);

  const nextRuns = useMemo(() => {
    const runs: string[] = [];
    let current = new Date();
    current.setSeconds(0, 0);

    // Limit computation range to prevent browser freezing
    const limit = new Date(current.getTime() + 24 * 60 * 60 * 1000);

    let iterations = 0;
    while (runs.length < 5 && current < limit && iterations < 5000) {
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
      const mIdx = parseInt(month, 10);
      res += t('cron.desc_in_month', { month: monthsArr[mIdx] || month }) + " ";
    }

    // Day of Week
    if (dayOfWeek !== '*') {
      const parseDay = (val: string) => {
        const d = parseInt(val, 10);
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
    toast.success(t('common.copied') || 'Copié !');
    setTimeout(() => setCopied(false), 2000);
  }, [cron, t]);

  const handleClear = useCallback(() => {
    setMinutes('*');
    setHours('*');
    setDayOfMonth('*');
    setMonth('*');
    setDayOfWeek('*');
    toast.success(t('common.clear') || 'Effacé !');
    mainInputRef.current?.focus();
  }, [t]);

  // Keyboard shortcut handlers with useRef closure safeguard
  const handlersRef = useRef({ handleCopy, handleClear });
  useEffect(() => {
    handlersRef.current = { handleCopy, handleClear };
  }, [handleCopy, handleClear]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInput = activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA' || activeElement?.hasAttribute('contenteditable');

      if (e.key === 'Escape') {
        e.preventDefault();
        handlersRef.current.handleClear();
      } else if (e.key.toLowerCase() === 'c' && !e.ctrlKey && !e.metaKey && !e.altKey && !isInput) {
        e.preventDefault();
        handlersRef.current.handleCopy();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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
      toast.success(t('cron.preset_applied') || 'Préréglage appliqué !');
    }
  };

  // Helper arrays for options
  const minuteOptions = [
    { label: t('cron.opt_every_minute') || 'Chaque minute', value: '*' },
    { label: t('cron.opt_every_5_minutes') || 'Toutes les 5 minutes', value: '*/5' },
    { label: t('cron.opt_every_10_minutes') || 'Toutes les 10 minutes', value: '*/10' },
    { label: t('cron.opt_every_15_minutes') || 'Toutes les 15 minutes', value: '*/15' },
    { label: t('cron.opt_every_30_minutes') || 'Toutes les 30 minutes', value: '*/30' },
    { label: '0', value: '0' },
    { label: '15', value: '15' },
    { label: '30', value: '30' },
    { label: '45', value: '45' },
  ];

  const hourOptions = [
    { label: t('cron.opt_every_hour') || 'Chaque heure', value: '*' },
    { label: t('cron.opt_every_2_hours') || 'Toutes les 2 heures', value: '*/2' },
    { label: t('cron.opt_every_4_hours') || 'Toutes les 4 heures', value: '*/4' },
    { label: t('cron.opt_every_6_hours') || 'Toutes les 6 heures', value: '*/6' },
    { label: t('cron.opt_every_12_hours') || 'Toutes les 12 heures', value: '*/12' },
    { label: '00:00', value: '0' },
    { label: '12:00', value: '12' },
  ];

  const domOptions = [
    { label: t('cron.opt_every_day') || 'Chaque jour', value: '*' },
    { label: t('cron.opt_first_day') || 'Premier jour', value: '1' },
    { label: t('cron.opt_last_day') || 'Dernier jour', value: 'L' },
    { label: '15', value: '15' },
  ];

  const monthOptions = [
    { label: t('cron.opt_every_month') || 'Chaque mois', value: '*' },
    { label: t('unit.symbol.time.january') || 'Janvier', value: '1' },
    { label: t('unit.symbol.time.april') || 'Avril', value: '4' },
    { label: t('unit.symbol.time.july') || 'Juillet', value: '7' },
    { label: t('unit.symbol.time.october') || 'Octobre', value: '10' },
  ];

  const dowOptions = [
    { label: t('cron.opt_every_day_week') || 'Chaque jour de la semaine', value: '*' },
    { label: t('unit.symbol.time.monday') || 'Lundi', value: '1' },
    { label: t('unit.symbol.time.friday') || 'Vendredi', value: '5' },
    { label: t('unit.symbol.time.weekend') || 'Week-end (Sam, Dim)', value: '0,6' },
    { label: t('unit.symbol.time.weekdays') || 'Jours ouvrés (Lun-Ven)', value: '1-5' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <div className="flex justify-between items-center px-1">
        <div className="flex gap-2 text-xs text-slate-400">
          <Kbd modifier={null} className="bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            Esc
          </Kbd>
          <span>{t('cron.shortcut_clear') || 'Effacer'}</span>
          <Kbd modifier={null} className="bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 ml-2">
            C
          </Kbd>
          <span>{t('cron.shortcut_copy') || 'Copier'}</span>
        </div>
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

      {/* Interactive Tabs Controller */}
      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-6">
        <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
          {[
            { id: 'minutes', label: t('cron.minute'), value: minutes },
            { id: 'hours', label: t('cron.hour'), value: hours },
            { id: 'dayOfMonth', label: t('cron.day_month'), value: dayOfMonth },
            { id: 'month', label: t('cron.month'), value: month },
            { id: 'dayOfWeek', label: t('cron.day_week'), value: dayOfWeek },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/10'
                  : 'bg-white dark:bg-slate-850 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label} <span className="font-mono text-xs opacity-70">({tab.value})</span>
            </button>
          ))}
        </div>

        {/* Dynamic Options for active tab */}
        <div className="space-y-4">
          <h4 className="text-sm font-bold text-slate-600 dark:text-slate-300">
            {t('cron.select_preset_for') || 'Sélectionner une option de préréglage pour'} {t(`cron.${activeTab}`)}
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {activeTab === 'minutes' &&
              minuteOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setMinutes(opt.value)}
                  className={`p-3 rounded-xl border text-center text-sm font-bold transition-all ${
                    minutes === opt.value
                      ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}

            {activeTab === 'hours' &&
              hourOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setHours(opt.value)}
                  className={`p-3 rounded-xl border text-center text-sm font-bold transition-all ${
                    hours === opt.value
                      ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}

            {activeTab === 'dayOfMonth' &&
              domOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setDayOfMonth(opt.value)}
                  className={`p-3 rounded-xl border text-center text-sm font-bold transition-all ${
                    dayOfMonth === opt.value
                      ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}

            {activeTab === 'month' &&
              monthOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setMonth(opt.value)}
                  className={`p-3 rounded-xl border text-center text-sm font-bold transition-all ${
                    month === opt.value
                      ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}

            {activeTab === 'dayOfWeek' &&
              dowOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setDayOfWeek(opt.value)}
                  className={`p-3 rounded-xl border text-center text-sm font-bold transition-all ${
                    dayOfWeek === opt.value
                      ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
          </div>
        </div>
      </div>

      {/* Manual Input Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { id: 'cron-minute', label: t('cron.minute'), value: minutes, setter: setMinutes, hint: '0-59, *, */n', ref: mainInputRef },
          { id: 'cron-hour', label: t('cron.hour'), value: hours, setter: setHours, hint: '0-23, *, */n' },
          { id: 'cron-dom', label: t('cron.day_month'), value: dayOfMonth, setter: setDayOfMonth, hint: '1-31, *, L' },
          { id: 'cron-month', label: t('cron.month'), value: month, setter: setMonth, hint: '1-12, *, JAN-DEC' },
          { id: 'cron-dow', label: t('cron.day_week'), value: dayOfWeek, setter: setDayOfWeek, hint: '0-6, *, SUN-SAT' },
        ].map((field) => (
          <div key={field.id} className="space-y-2">
            <label htmlFor={field.id} className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 cursor-pointer flex justify-between items-center">
              <span>{field.label}</span>
            </label>
            <input
              id={field.id}
              ref={field.ref}
              type="text"
              value={field.value}
              onChange={(e) => field.setter(sanitizeInput(e.target.value))}
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
