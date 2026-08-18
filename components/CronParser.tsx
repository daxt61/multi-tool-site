import { useState, useEffect, useRef, useMemo } from 'react';
import { Clock, Copy, Check, Trash2, Download, AlertCircle, Sparkles, Calendar, Play } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100;

interface Preset {
  id: string;
  nameKey: string;
  cron: string;
}

const PRESETS: Preset[] = [
  { id: 'every_15m', nameKey: 'cronparser.preset_every_15m', cron: '*/15 * * * *' },
  { id: 'hourly', nameKey: 'cronparser.preset_hourly', cron: '0 * * * *' },
  { id: 'daily_midnight', nameKey: 'cronparser.preset_daily_midnight', cron: '0 0 * * *' },
  { id: 'weekdays_9am', nameKey: 'cronparser.preset_weekdays_9am', cron: '0 9 * * 1-5' },
  { id: 'monthly_first', nameKey: 'cronparser.preset_monthly_first', cron: '0 3 1 * *' },
  { id: 'sunday_night', nameKey: 'cronparser.preset_sunday_night', cron: '30 23 * * 0' }
];

const MONTH_NAMES_EN = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTH_NAMES_FR = ['', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

const DAY_NAMES_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_NAMES_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

// Helper to parse a single field with min/max bounds
function parseField(field: string, min: number, max: number): Set<number> | null {
  const result = new Set<number>();
  const parts = field.split(',');

  for (const part of parts) {
    if (part === '*') {
      for (let i = min; i <= max; i++) result.add(i);
      continue;
    }

    // Handle step (e.g. */15 or 1-30/5)
    if (part.includes('/')) {
      const [subPart, stepStr] = part.split('/');
      const step = parseInt(stepStr, 10);
      if (isNaN(step) || step <= 0) return null;

      let start = min;
      let end = max;

      if (subPart !== '*') {
        if (subPart.includes('-')) {
          const [s, e] = subPart.split('-').map((v) => parseInt(v, 10));
          if (isNaN(s) || isNaN(e)) return null;
          start = s;
          end = e;
        } else {
          start = parseInt(subPart, 10);
          if (isNaN(start)) return null;
        }
      }

      for (let i = start; i <= end; i += step) {
        if (i >= min && i <= max) result.add(i);
      }
      continue;
    }

    // Handle range (e.g. 1-5)
    if (part.includes('-')) {
      const [s, e] = part.split('-').map((v) => parseInt(v, 10));
      if (isNaN(s) || isNaN(e) || s > e) return null;
      for (let i = s; i <= e; i++) {
        if (i >= min && i <= max) result.add(i);
      }
      continue;
    }

    // Handle single number
    const num = parseInt(part, 10);
    if (isNaN(num) || num < min || num > max) return null;
    result.add(num);
  }

  return result.size > 0 ? result : null;
}

// Generate next execution dates
function getNextExecutions(cron: string, count = 10): Date[] | null {
  const fields = cron.trim().split(/\s+/);
  if (fields.length !== 5) return null;

  const minutes = parseField(fields[0], 0, 59);
  const hours = parseField(fields[1], 0, 23);
  const daysOfMonth = parseField(fields[2], 1, 31);
  const months = parseField(fields[3], 1, 12);
  const daysOfWeek = parseField(fields[4], 0, 6); // 0 or 7 = Sunday

  // Convert day 7 to 0 if present
  if (fields[4].includes('7') && daysOfWeek) {
    daysOfWeek.add(0);
  }

  if (!minutes || !hours || !daysOfMonth || !months || !daysOfWeek) return null;

  const nextDates: Date[] = [];
  const current = new Date();
  current.setSeconds(0, 0);
  current.setMinutes(current.getMinutes() + 1); // Start from the next minute

  let iterations = 0;
  const maxIterations = 100000; // Safeguard against infinite loops

  while (nextDates.length < count && iterations < maxIterations) {
    iterations++;

    const m = current.getMonth() + 1; // 1-12
    if (!months.has(m)) {
      current.setMonth(current.getMonth() + 1, 1);
      current.setHours(0, 0, 0, 0);
      continue;
    }

    const dom = current.getDate(); // 1-31
    const dow = current.getDay(); // 0-6

    // Handle Day of Month / Day of Week logic
    const domStar = fields[2] === '*';
    const dowStar = fields[4] === '*';

    let dayMatch = false;
    if (domStar && dowStar) {
      dayMatch = true;
    } else if (!domStar && !dowStar) {
      dayMatch = daysOfMonth.has(dom) || daysOfWeek.has(dow);
    } else if (!domStar) {
      dayMatch = daysOfMonth.has(dom);
    } else {
      dayMatch = daysOfWeek.has(dow);
    }

    if (!dayMatch) {
      current.setDate(current.getDate() + 1);
      current.setHours(0, 0, 0, 0);
      continue;
    }

    const h = current.getHours();
    if (!hours.has(h)) {
      current.setHours(current.getHours() + 1, 0, 0, 0);
      continue;
    }

    const min = current.getMinutes();
    if (!minutes.has(min)) {
      current.setMinutes(current.getMinutes() + 1, 0, 0);
      continue;
    }

    nextDates.push(new Date(current));
    current.setMinutes(current.getMinutes() + 1);
  }

  return nextDates;
}

// Generate human readable explanation
function describeCron(cron: string, lang: string): string {
  const fields = cron.trim().split(/\s+/);
  if (fields.length !== 5) {
    return lang === 'fr' ? 'Expression Cron invalide (doit comporter 5 champs)' : 'Invalid Cron expression (must have 5 fields)';
  }

  const [min, hr, dom, mon, dow] = fields;
  const isFr = lang === 'fr';

  // Helper for minute description
  let minDesc = '';
  if (min === '*') {
    minDesc = isFr ? 'chaque minute' : 'every minute';
  } else if (min.startsWith('*/')) {
    const step = min.replace('*/', '');
    minDesc = isFr ? `toutes les ${step} minutes` : `every ${step} minutes`;
  } else {
    minDesc = isFr ? `à la minute ${min}` : `at minute ${min}`;
  }

  // Helper for hour description
  let hrDesc = '';
  if (hr === '*') {
    hrDesc = isFr ? 'de chaque heure' : 'of every hour';
  } else if (hr.startsWith('*/')) {
    const step = hr.replace('*/', '');
    hrDesc = isFr ? `toutes les ${step} heures` : `every ${step} hours`;
  } else if (hr.includes('-')) {
    const [start, end] = hr.split('-');
    hrDesc = isFr ? `entre ${start}h00 et ${end}h00` : `between ${start}:00 and ${end}:00`;
  } else {
    hrDesc = isFr ? `à ${hr}h00` : `at ${hr.padStart(2, '0')}:00`;
  }

  // Helper for day of week description
  let dowDesc = '';
  if (dow !== '*') {
    if (dow === '1-5') {
      dowDesc = isFr ? 'du lundi au vendredi' : 'on weekdays (Mon-Fri)';
    } else if (dow === '0,6' || dow === '6,0') {
      dowDesc = isFr ? 'le week-end (samedi et dimanche)' : 'on weekends (Sat-Sun)';
    } else {
      const days = dow.split(',').map((d) => {
        const idx = parseInt(d, 10) % 7;
        return isFr ? DAY_NAMES_FR[idx] : DAY_NAMES_EN[idx];
      });
      dowDesc = isFr ? `le ${days.join(', ')}` : `on ${days.join(', ')}`;
    }
  }

  // Helper for month description
  let monDesc = '';
  if (mon !== '*') {
    const months = mon.split(',').map((m) => {
      const idx = parseInt(m, 10);
      return isFr ? MONTH_NAMES_FR[idx] : MONTH_NAMES_EN[idx];
    });
    monDesc = isFr ? `en ${months.join(', ')}` : `in ${months.join(', ')}`;
  }

  // Helper for day of month
  let domDesc = '';
  if (dom !== '*') {
    domDesc = isFr ? `le ${dom} du mois` : `on day ${dom} of the month`;
  }

  const parts = [minDesc, hrDesc, domDesc, dowDesc, monDesc].filter(Boolean);
  const sentence = parts.join(' ');
  return sentence.charAt(0).toUpperCase() + sentence.slice(1);
}

// Relative time countdown formatter
function formatCountdown(target: Date, lang: string): string {
  const diffMs = target.getTime() - Date.now();
  if (diffMs <= 0) return lang === 'fr' ? 'À l\'instant' : 'Just now';

  const totalSec = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);

  if (lang === 'fr') {
    if (days > 0) return `dans ${days}d ${hours}h`;
    if (hours > 0) return `dans ${hours}h ${minutes}m`;
    return `dans ${minutes}m`;
  } else {
    if (days > 0) return `in ${days}d ${hours}h`;
    if (hours > 0) return `in ${hours}h ${minutes}m`;
    return `in ${minutes}m`;
  }
}

export function CronParser({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language || 'en';

  const [cron, setCron] = useState<string>(initialData?.cron || '*/15 * * * *');
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    onStateChange?.({ cron });
  }, [cron, onStateChange]);

  const error = useMemo(() => {
    if (!cron.trim()) return null;
    if (cron.length > MAX_LENGTH) {
      return t('error.max_length', { max: MAX_LENGTH });
    }
    const fields = cron.trim().split(/\s+/);
    if (fields.length !== 5) {
      return lang === 'fr'
        ? 'Expression Cron invalide : doit comporter exactement 5 champs (Minute Heure Jour Mois Jour-Semaine)'
        : 'Invalid Cron expression: must have exactly 5 fields (Minute Hour Day Month Day-of-Week)';
    }
    const executions = getNextExecutions(cron);
    if (!executions) {
      return lang === 'fr' ? 'Expression Cron ou plage de valeurs invalide' : 'Invalid Cron expression or value range';
    }
    return null;
  }, [cron, lang, t]);

  const explanation = useMemo(() => {
    if (error || !cron.trim()) return '';
    return describeCron(cron, lang);
  }, [cron, lang, error]);

  const upcomingExecutions = useMemo(() => {
    if (error || !cron.trim()) return [];
    return getNextExecutions(cron, 10) || [];
  }, [cron, error]);

  const fieldsList = useMemo(() => {
    const parts = cron.trim().split(/\s+/);
    return [
      { label: lang === 'fr' ? 'Minute' : 'Minute', value: parts[0] || '*', range: '0-59' },
      { label: lang === 'fr' ? 'Heure' : 'Hour', value: parts[1] || '*', range: '0-23' },
      { label: lang === 'fr' ? 'Jour (Mois)' : 'Day (Month)', value: parts[2] || '*', range: '1-31' },
      { label: lang === 'fr' ? 'Mois' : 'Month', value: parts[3] || '*', range: '1-12' },
      { label: lang === 'fr' ? 'Jour (Semaine)' : 'Day (Week)', value: parts[4] || '*', range: '0-6' }
    ];
  }, [cron, lang]);

  // Keyboard shortcut handler ref
  const handlersRef = useRef({
    handleClear: () => {
      setCron('');
      toast.success(t('cronparser.cleared_toast') || 'Input cleared!');
      inputRef.current?.focus();
    },
    handleCopy: () => {
      if (!explanation || error) return;
      const copyText = `Cron: ${cron}\nSchedule: ${explanation}\nNext Run: ${upcomingExecutions[0]?.toLocaleString() || ''}`;
      navigator.clipboard.writeText(copyText);
      setCopied(true);
      toast.success(t('cronparser.copied_toast') || 'Schedule explanation copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  });

  useEffect(() => {
    handlersRef.current = {
      handleClear: () => {
        setCron('');
        toast.success(t('cronparser.cleared_toast') || 'Input cleared!');
        inputRef.current?.focus();
      },
      handleCopy: () => {
        if (!explanation || error) return;
        const copyText = `Cron: ${cron}\nSchedule: ${explanation}\nNext Run: ${upcomingExecutions[0]?.toLocaleString() || ''}`;
        navigator.clipboard.writeText(copyText);
        setCopied(true);
        toast.success(t('cronparser.copied_toast') || 'Schedule explanation copied!');
        setTimeout(() => setCopied(false), 2000);
      }
    };
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handlersRef.current.handleClear();
        return;
      }

      const activeElement = document.activeElement;
      const isInputFocused =
        activeElement?.tagName === 'INPUT' ||
        activeElement?.tagName === 'TEXTAREA' ||
        (activeElement as HTMLElement)?.isContentEditable;

      if (!isInputFocused && (e.key === 'c' || e.key === 'C') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        handlersRef.current.handleCopy();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleDownload = () => {
    if (!explanation || error) return;
    const content = `CRON EXPRESSION REPORT\nExpression: ${cron}\nDescription: ${explanation}\n\nUPCOMING EXECUTIONS:\n` +
      upcomingExecutions.map((d, i) => `${i + 1}. ${d.toLocaleString()} (${formatCountdown(d, lang)})`).join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cron-schedule-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(t('cronparser.downloaded_toast') || 'Report downloaded!');
  };

  const applyPreset = (p: Preset) => {
    setCron(p.cron);
    toast.success(t('cronparser.preset_loaded') || 'Preset loaded!');
    inputRef.current?.focus();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8" data-testid="cron-parser-container">
      {/* Presets */}
      <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-500" aria-hidden="true" />
          <h3 className="font-black uppercase tracking-widest text-xs text-slate-500 dark:text-slate-400">
            {t('cronparser.presets_label') || 'Quick Presets'}
          </h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => applyPreset(preset)}
              className="px-3.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-2"
            >
              <code className="text-indigo-600 dark:text-indigo-400 font-mono font-bold text-[11px]">{preset.cron}</code>
              <span>{t(preset.nameKey) || preset.id}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Input Section */}
      <div className="p-6 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-6 shadow-sm">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <label htmlFor="cron-parser-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
              {t('cronparser.expression_label') || 'Cron Expression'}
            </label>
            <Kbd modifier={null}>Esc</Kbd>
          </div>
          <button
            onClick={() => handlersRef.current.handleClear()}
            disabled={!cron}
            className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" /> {t('common.clear')}
          </button>
        </div>

        <input
          id="cron-parser-input"
          ref={inputRef}
          type="text"
          value={cron}
          maxLength={MAX_LENGTH}
          onChange={(e) => setCron(e.target.value)}
          placeholder="*/15 * * * *"
          className="w-full p-4 text-center font-mono text-xl sm:text-2xl font-bold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-indigo-600 dark:text-indigo-400 tracking-wider shadow-inner"
        />

        {/* Fields breakdown badges */}
        <div className="grid grid-cols-5 gap-2 pt-2">
          {fieldsList.map((f, i) => (
            <div key={i} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 text-center space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block truncate">{f.label}</span>
              <code className="text-sm sm:text-base font-mono font-extrabold text-indigo-500 block">{f.value}</code>
              <span className="text-[9px] font-mono text-slate-400 block">{f.range}</span>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 shrink-0" aria-hidden="true" />
          {error}
        </div>
      )}

      {/* Explanation Banner */}
      {!error && explanation && (
        <div className="p-6 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-500/20 rounded-3xl space-y-3">
          <div className="flex justify-between items-start gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                {t('cronparser.explanation_label') || 'Human Readable Schedule'}
              </span>
              <p className="text-lg sm:text-xl font-extrabold text-slate-800 dark:text-slate-100 leading-snug">
                “{explanation}”
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={handleDownload}
                className="p-2 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-all"
                aria-label={t('common.download')}
              >
                <Download className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                onClick={() => handlersRef.current.handleCopy()}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  copied
                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-500/20'
                }`}
              >
                {copied ? <Check className="w-4 h-4" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
                {copied ? t('common.copied') : t('common.copy')}
                <Kbd modifier={null} className="bg-white/20 text-white border-white/30">C</Kbd>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Next Executions List */}
      {!error && upcomingExecutions.length > 0 && (
        <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Calendar className="w-4 h-4 text-indigo-500" aria-hidden="true" />
            <h3 className="font-black uppercase tracking-widest text-xs text-slate-500 dark:text-slate-400">
              {t('cronparser.upcoming_label') || 'Next 10 Upcoming Executions'}
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {upcomingExecutions.map((date, idx) => (
              <div
                key={idx}
                className="flex justify-between items-center p-3.5 bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm hover:border-indigo-500/30 transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-black rounded-lg flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                    {date.toLocaleString()}
                  </span>
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 rounded-full shrink-0">
                  {formatCountdown(date, lang)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
