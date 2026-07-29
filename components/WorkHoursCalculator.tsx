import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Briefcase, Copy, Check, Trash2, Calendar, Clock, DollarSign, Download, Play, Info, Settings2, Sparkles, RefreshCw, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

interface DayLog {
  dayId: string;
  active: boolean;
  startTime: string; // "HH:MM"
  endTime: string;   // "HH:MM"
  breakMinutes: number; // in minutes
}

const DEFAULT_DAYS = (): DayLog[] => [
  { dayId: 'monday', active: true, startTime: '09:00', endTime: '17:00', breakMinutes: 60 },
  { dayId: 'tuesday', active: true, startTime: '09:00', endTime: '17:00', breakMinutes: 60 },
  { dayId: 'wednesday', active: true, startTime: '09:00', endTime: '17:00', breakMinutes: 60 },
  { dayId: 'thursday', active: true, startTime: '09:00', endTime: '17:00', breakMinutes: 60 },
  { dayId: 'friday', active: true, startTime: '09:00', endTime: '17:00', breakMinutes: 60 },
  { dayId: 'saturday', active: false, startTime: '09:00', endTime: '17:00', breakMinutes: 60 },
  { dayId: 'sunday', active: false, startTime: '09:00', endTime: '17:00', breakMinutes: 60 },
];

export function WorkHoursCalculator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'fr';

  // State initialization with URL / initialData state checks
  const [days, setDays] = useState<DayLog[]>(() => {
    if (initialData?.days && Array.isArray(initialData.days)) {
      return initialData.days.map((day: any) => ({
        dayId: String(day.dayId),
        active: !!day.active,
        startTime: typeof day.startTime === 'string' ? day.startTime : '09:00',
        endTime: typeof day.endTime === 'string' ? day.endTime : '17:00',
        breakMinutes: typeof day.breakMinutes === 'number' ? Math.max(0, Math.min(1440, day.breakMinutes)) : 60,
      }));
    }
    return DEFAULT_DAYS();
  });

  const [hourlyRate, setHourlyRate] = useState<string>(() => {
    const val = initialData?.hourlyRate;
    return typeof val === 'string' || typeof val === 'number' ? String(val) : '20';
  });

  const [useDailyOvertime, setUseDailyOvertime] = useState<boolean>(() => !!initialData?.useDailyOvertime);
  const [dailyOvertimeThreshold, setDailyOvertimeThreshold] = useState<string>(() => String(initialData?.dailyOvertimeThreshold || '8'));
  const [dailyOvertimeMultiplier, setDailyOvertimeMultiplier] = useState<string>(() => String(initialData?.dailyOvertimeMultiplier || '1.5'));

  const [useWeeklyOvertime, setUseWeeklyOvertime] = useState<boolean>(() => initialData?.useWeeklyOvertime ?? true);
  const [weeklyOvertimeThreshold, setWeeklyOvertimeThreshold] = useState<string>(() => String(initialData?.weeklyOvertimeThreshold || '40'));
  const [weeklyOvertimeMultiplier, setWeeklyOvertimeMultiplier] = useState<string>(() => String(initialData?.weeklyOvertimeMultiplier || '1.5'));

  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state upward safely
  useEffect(() => {
    onStateChange?.({
      days,
      hourlyRate,
      useDailyOvertime,
      dailyOvertimeThreshold,
      dailyOvertimeMultiplier,
      useWeeklyOvertime,
      weeklyOvertimeThreshold,
      weeklyOvertimeMultiplier,
    });
  }, [days, hourlyRate, useDailyOvertime, dailyOvertimeThreshold, dailyOvertimeMultiplier, useWeeklyOvertime, weeklyOvertimeThreshold, weeklyOvertimeMultiplier]);

  // Safe numeric parsed inputs with bounds
  const parsedHourlyRate = useMemo(() => {
    const val = parseFloat(hourlyRate);
    if (isNaN(val) || val < 0) return 0;
    return Math.min(10000, val); // DoS/Overflow safeguard
  }, [hourlyRate]);

  const parsedDailyThreshold = useMemo(() => {
    const val = parseFloat(dailyOvertimeThreshold);
    if (isNaN(val) || val < 0) return 8;
    return Math.min(24, val);
  }, [dailyOvertimeThreshold]);

  const parsedDailyMultiplier = useMemo(() => {
    const val = parseFloat(dailyOvertimeMultiplier);
    if (isNaN(val) || val < 0) return 1;
    return Math.min(10, val);
  }, [dailyOvertimeMultiplier]);

  const parsedWeeklyThreshold = useMemo(() => {
    const val = parseFloat(weeklyOvertimeThreshold);
    if (isNaN(val) || val < 0) return 40;
    return Math.min(168, val);
  }, [weeklyOvertimeThreshold]);

  const parsedWeeklyMultiplier = useMemo(() => {
    const val = parseFloat(weeklyOvertimeMultiplier);
    if (isNaN(val) || val < 0) return 1;
    return Math.min(10, val);
  }, [weeklyOvertimeMultiplier]);

  // Duration parsers
  const parseTimeToMinutes = (timeStr: string): number => {
    if (!timeStr) return 0;
    const parts = timeStr.split(':');
    const h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;
    return Math.min(1439, Math.max(0, h * 60 + m));
  };

  const getDayLabel = (dayId: string): string => {
    return t(`week.${dayId}`, dayId.charAt(0).toUpperCase() + dayId.slice(1));
  };

  // Main calculations engine
  const calculationResult = useMemo(() => {
    let totalWorkMinutes = 0;
    const dailyBreakdown = days.map(day => {
      if (!day.active) {
        return { ...day, workMinutes: 0, workHours: 0, regularHours: 0, overtimeHours: 0 };
      }

      const start = parseTimeToMinutes(day.startTime);
      let end = parseTimeToMinutes(day.endTime);

      // Handle overnight shift (e.g. 22:00 to 06:00 is 8 hours total)
      if (end < start) {
        end += 24 * 60;
      }

      const totalSpan = end - start;
      const netSpan = Math.max(0, totalSpan - day.breakMinutes);
      const workHours = netSpan / 60;

      let regularHours = workHours;
      let overtimeHours = 0;

      if (useDailyOvertime) {
        if (workHours > parsedDailyThreshold) {
          regularHours = parsedDailyThreshold;
          overtimeHours = workHours - parsedDailyThreshold;
        }
      }

      totalWorkMinutes += netSpan;

      return {
        ...day,
        workMinutes: netSpan,
        workHours,
        regularHours,
        overtimeHours,
      };
    });

    const totalHours = totalWorkMinutes / 60;
    let finalRegularHours = 0;
    let finalOvertimeHours = 0;

    if (useDailyOvertime) {
      finalRegularHours = dailyBreakdown.reduce((sum, d) => sum + d.regularHours, 0);
      finalOvertimeHours = dailyBreakdown.reduce((sum, d) => sum + d.overtimeHours, 0);
    } else if (useWeeklyOvertime) {
      if (totalHours > parsedWeeklyThreshold) {
        finalRegularHours = parsedWeeklyThreshold;
        finalOvertimeHours = totalHours - parsedWeeklyThreshold;
      } else {
        finalRegularHours = totalHours;
        finalOvertimeHours = 0;
      }
    } else {
      finalRegularHours = totalHours;
      finalOvertimeHours = 0;
    }

    const regularPay = finalRegularHours * parsedHourlyRate;
    const overtimePay = finalOvertimeHours * parsedHourlyRate * (useDailyOvertime ? parsedDailyMultiplier : parsedWeeklyMultiplier);
    const totalPay = regularPay + overtimePay;

    return {
      dailyBreakdown,
      totalHours,
      regularHours: finalRegularHours,
      overtimeHours: finalOvertimeHours,
      regularPay,
      overtimePay,
      totalPay,
    };
  }, [days, useDailyOvertime, parsedDailyThreshold, useWeeklyOvertime, parsedWeeklyThreshold, parsedHourlyRate, parsedDailyMultiplier, parsedWeeklyMultiplier]);

  const updateDay = (dayId: string, updates: Partial<DayLog>) => {
    setDays(prev => prev.map(d => d.dayId === dayId ? { ...d, ...updates } : d));
  };

  const loadPreset = (presetType: 'standard' | 'forty' | 'parttime') => {
    setError(null);
    let newDays = DEFAULT_DAYS();
    if (presetType === 'standard') {
      newDays = DEFAULT_DAYS();
    } else if (presetType === 'forty') {
      newDays = DEFAULT_DAYS().map(d => {
        if (['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].includes(d.dayId)) {
          return { ...d, startTime: '08:00', endTime: '17:00', breakMinutes: 60 };
        }
        return d;
      });
    } else if (presetType === 'parttime') {
      newDays = DEFAULT_DAYS().map(d => {
        if (['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].includes(d.dayId)) {
          return { ...d, startTime: '08:00', endTime: '12:00', breakMinutes: 0 };
        }
        return d;
      });
    }
    setDays(newDays);
    toast.success(t('workhours.toast_preset', 'Preset template loaded successfully!'));
  };

  const handleReset = useCallback(() => {
    setDays(DEFAULT_DAYS());
    setHourlyRate('20');
    setUseDailyOvertime(false);
    setUseWeeklyOvertime(true);
    setDailyOvertimeThreshold('8');
    setDailyOvertimeMultiplier('1.5');
    setWeeklyOvertimeThreshold('40');
    setWeeklyOvertimeMultiplier('1.5');
    setError(null);
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    toast.success(t('workhours.toast_reset', 'Calculator reset to default configurations.'));
  }, [t]);

  const formatCurrency = (val: number): string => {
    return new Intl.NumberFormat(currentLang === 'fr' ? 'fr-FR' : 'en-US', {
      style: 'currency',
      currency: currentLang === 'fr' ? 'EUR' : 'USD',
    }).format(val);
  };

  const getFullSummaryText = useCallback(() => {
    let summary = `*** ${t('workhours.summary_title', 'Work Hours Summary')} ***\n\n`;
    calculationResult.dailyBreakdown.forEach(d => {
      const activeText = d.active ? `${d.startTime} - ${d.endTime} (${d.breakMinutes}m break)` : t('workhours.off', 'Off');
      summary += `${getDayLabel(d.dayId)}: ${activeText} => ${d.workHours.toFixed(2)}h\n`;
    });
    summary += `\n---------------------------------------\n`;
    summary += `${t('workhours.total_hours', 'Total Hours')}: ${calculationResult.totalHours.toFixed(2)}h\n`;
    summary += `${t('workhours.regular_hours', 'Regular Hours')}: ${calculationResult.regularHours.toFixed(2)}h\n`;
    summary += `${t('workhours.overtime_hours', 'Overtime Hours')}: ${calculationResult.overtimeHours.toFixed(2)}h\n`;
    summary += `---------------------------------------\n`;
    summary += `${t('workhours.hourly_rate', 'Hourly Rate')}: ${formatCurrency(parsedHourlyRate)}\n`;
    summary += `${t('workhours.regular_pay', 'Regular Pay')}: ${formatCurrency(calculationResult.regularPay)}\n`;
    summary += `${t('workhours.overtime_pay', 'Overtime Pay')}: ${formatCurrency(calculationResult.overtimePay)}\n`;
    summary += `${t('workhours.gross_pay', 'Estimated Gross Pay')}: ${formatCurrency(calculationResult.totalPay)}\n`;
    return summary;
  }, [calculationResult, parsedHourlyRate, currentLang, t]);

  const handleCopySummary = useCallback(() => {
    navigator.clipboard.writeText(getFullSummaryText());
    setCopied(true);
    toast.success(t('workhours.toast_copied', 'Full summary copied to clipboard!'));
    setTimeout(() => setCopied(false), 2000);
  }, [getFullSummaryText, t]);

  const handleDownloadCSV = () => {
    let csvContent = `Day,Active,Start Time,End Time,Break (mins),Work Hours\n`;
    calculationResult.dailyBreakdown.forEach(d => {
      csvContent += `"${getDayLabel(d.dayId)}",${d.active},"${d.startTime}","${d.endTime}",${d.breakMinutes},${d.workHours.toFixed(2)}\n`;
    });
    csvContent += `\nTotal Hours,${calculationResult.totalHours.toFixed(2)}\n`;
    csvContent += `Hourly Rate,${parsedHourlyRate}\n`;
    csvContent += `Gross Pay,${calculationResult.totalPay.toFixed(2)}\n`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `work_hours_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(t('workhours.toast_download_csv', 'CSV export downloaded successfully!'));
  };

  // Keyboard shortcut listener wrappers
  const handlersRef = useRef({ handleReset, handleCopySummary, loadPreset });
  useEffect(() => {
    handlersRef.current = { handleReset, handleCopySummary, loadPreset };
  }, [handleReset, handleCopySummary, loadPreset]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isEditable = activeElement && (
        (activeElement.tagName === 'INPUT' && !['checkbox', 'radio'].includes((activeElement as HTMLInputElement).type)) ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.getAttribute('contenteditable') === 'true'
      );

      if (isEditable && e.key !== 'Escape') return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      const { handleReset, handleCopySummary, loadPreset } = handlersRef.current;

      if (e.key === 'Escape') {
        e.preventDefault();
        handleReset();
      } else if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handleCopySummary();
      } else if (e.key.toLowerCase() === 't') {
        e.preventDefault();
        loadPreset('standard');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Upper header action blocks */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-3xl border border-slate-200/60 dark:border-slate-800">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => loadPreset('standard')}
            className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            {t('workhours.preset_standard', 'Standard 9-5')}
            <Kbd modifier={null} className="ml-1 text-[9px] bg-slate-100/50 dark:bg-slate-900/30">T</Kbd>
          </button>
          <button
            onClick={() => loadPreset('forty')}
            className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            {t('workhours.preset_forty', '40h Week')}
          </button>
          <button
            onClick={() => loadPreset('parttime')}
            className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            {t('workhours.preset_parttime', 'Part-time')}
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleDownloadCSV}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            title={t('workhours.download_csv_tooltip', 'Download CSV report')}
          >
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
          <button
            onClick={handleCopySummary}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
              copied
                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                : 'text-indigo-600 dark:text-indigo-400 border-transparent bg-indigo-50 dark:bg-indigo-900/25 hover:bg-indigo-100/80 dark:hover:bg-indigo-900/40'
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? t('common.copied') : t('workhours.copy_summary', 'Copy Summary')}
            <Kbd modifier={null} className="ml-1 text-[9px] bg-white/40 dark:bg-black/20">C</Kbd>
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-2 text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 border border-transparent rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
            title={`${t('common.clear')} (Esc)`}
          >
            <RefreshCw className="w-3.5 h-3.5" /> {t('common.reset')}
            <Kbd modifier={null} className="ml-1 text-[9px] bg-white/50 dark:bg-black/20 text-rose-400">Esc</Kbd>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Main calculation card and tables */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Daily timecard logging grid */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Calendar className="w-4 h-4 text-indigo-500" />
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{t('workhours.timecard_title', 'Daily Timecard Logs')}</h3>
          </div>

          <div className="space-y-3">
            {days.map((day, idx) => {
              const dayLabel = getDayLabel(day.dayId);
              const breakdown = calculationResult.dailyBreakdown.find(d => d.dayId === day.dayId);
              const totalSpanHours = breakdown ? breakdown.workHours : 0;

              return (
                <div
                  key={day.dayId}
                  className={`p-5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    day.active
                      ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm'
                      : 'bg-slate-50/50 dark:bg-slate-900/10 border-slate-100 dark:border-slate-900/50 opacity-60'
                  }`}
                >
                  {/* Left block: Day switch and name */}
                  <div className="flex items-center gap-3 min-w-[130px]">
                    <input
                      type="checkbox"
                      id={`active-${day.dayId}`}
                      checked={day.active}
                      onChange={(e) => updateDay(day.dayId, { active: e.target.checked })}
                      className="w-4.5 h-4.5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 focus:ring-2 cursor-pointer"
                    />
                    <label
                      htmlFor={`active-${day.dayId}`}
                      className="text-sm font-black text-slate-700 dark:text-slate-200 cursor-pointer select-none"
                    >
                      {dayLabel}
                    </label>
                  </div>

                  {/* Center inputs: Start, End, Break */}
                  {day.active ? (
                    <div className="flex flex-wrap items-center gap-4 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400">{t('common.from', 'From')}:</span>
                        <input
                          type="time"
                          value={day.startTime}
                          onChange={(e) => updateDay(day.dayId, { startTime: e.target.value })}
                          className="px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400">{t('common.to', 'To')}:</span>
                        <input
                          type="time"
                          value={day.endTime}
                          onChange={(e) => updateDay(day.dayId, { endTime: e.target.value })}
                          className="px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400">{t('workhours.break', 'Break')}:</span>
                        <div className="relative flex items-center">
                          <input
                            type="number"
                            min="0"
                            max="1440"
                            value={day.breakMinutes}
                            onChange={(e) => updateDay(day.dayId, { breakMinutes: Math.min(1440, Math.max(0, parseInt(e.target.value, 10) || 0)) })}
                            className="w-16 px-2 py-1.5 pr-6 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                          />
                          <span className="absolute right-2 text-[10px] font-bold text-slate-400">m</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 text-xs text-slate-400 italic">
                      {t('workhours.not_working', 'Rest day / Not working')}
                    </div>
                  )}

                  {/* Right block: day total duration */}
                  <div className="text-right min-w-[70px]">
                    {day.active ? (
                      <span className="text-sm font-black font-mono text-indigo-600 dark:text-indigo-400">
                        {totalSpanHours.toFixed(2)}h
                      </span>
                    ) : (
                      <span className="text-sm font-black font-mono text-slate-400">
                        -
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Total summary metrics, pay, and settings */}
        <div className="lg:col-span-4 space-y-6">
          {/* Section: Hourly rate & Overtime configs */}
          <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="flex items-center gap-2 text-indigo-500 px-1">
              <Settings2 className="w-4 h-4" />
              <h3 className="font-black uppercase tracking-widest text-[10px] text-slate-400">{t('workhours.config_title', 'Hourly Rate & Overtime Settings')}</h3>
            </div>

            {/* Input: Hourly Rate */}
            <div className="space-y-2">
              <label htmlFor="hourly-rate-input" className="text-xs font-bold text-slate-400 px-1 block">{t('workhours.hourly_rate', 'Hourly Rate')}</label>
              <div className="relative">
                <input
                  id="hourly-rate-input"
                  type="number"
                  min="0"
                  max="10000"
                  step="0.01"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold font-mono outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="20.00"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">
                  {currentLang === 'fr' ? '€' : '$'}
                </span>
              </div>
            </div>

            <div className="border-t border-slate-200/50 dark:border-slate-700/50 pt-4 space-y-4">
              {/* Toggle & Inputs: Daily Overtime */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{t('workhours.daily_overtime', 'Daily Overtime')}</span>
                  <input
                    type="checkbox"
                    checked={useDailyOvertime}
                    onChange={(e) => {
                      setUseDailyOvertime(e.target.checked);
                      if (e.target.checked) setUseWeeklyOvertime(false);
                    }}
                    className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 focus:ring-2 cursor-pointer"
                  />
                </div>

                {useDailyOvertime && (
                  <div className="grid grid-cols-2 gap-3 animate-in fade-in zoom-in-95 duration-200">
                    <div className="space-y-1">
                      <label htmlFor="daily-ot-threshold" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{t('workhours.threshold_hours', 'Threshold (h)')}</label>
                      <input
                        id="daily-ot-threshold"
                        type="number"
                        min="1"
                        max="24"
                        value={dailyOvertimeThreshold}
                        onChange={(e) => setDailyOvertimeThreshold(e.target.value)}
                        className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="daily-ot-multiplier" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{t('workhours.multiplier', 'Multiplier (x)')}</label>
                      <input
                        id="daily-ot-multiplier"
                        type="number"
                        min="1"
                        max="10"
                        step="0.1"
                        value={dailyOvertimeMultiplier}
                        onChange={(e) => setDailyOvertimeMultiplier(e.target.value)}
                        className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Toggle & Inputs: Weekly Overtime */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{t('workhours.weekly_overtime', 'Weekly Overtime')}</span>
                  <input
                    type="checkbox"
                    checked={useWeeklyOvertime}
                    onChange={(e) => {
                      setUseWeeklyOvertime(e.target.checked);
                      if (e.target.checked) setUseDailyOvertime(false);
                    }}
                    className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 focus:ring-2 cursor-pointer"
                  />
                </div>

                {useWeeklyOvertime && (
                  <div className="grid grid-cols-2 gap-3 animate-in fade-in zoom-in-95 duration-200">
                    <div className="space-y-1">
                      <label htmlFor="weekly-ot-threshold" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{t('workhours.threshold_hours', 'Threshold (h)')}</label>
                      <input
                        id="weekly-ot-threshold"
                        type="number"
                        min="1"
                        max="168"
                        value={weeklyOvertimeThreshold}
                        onChange={(e) => setWeeklyOvertimeThreshold(e.target.value)}
                        className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="weekly-ot-multiplier" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{t('workhours.multiplier', 'Multiplier (x)')}</label>
                      <input
                        id="weekly-ot-multiplier"
                        type="number"
                        min="1"
                        max="10"
                        step="0.1"
                        value={weeklyOvertimeMultiplier}
                        onChange={(e) => setWeeklyOvertimeMultiplier(e.target.value)}
                        className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section: Output Metrics Breakdown */}
          <div className="bg-slate-900 text-white p-6 rounded-[2rem] shadow-xl space-y-6">
            <div className="text-center space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('workhours.gross_pay', 'Estimated Gross Pay')}</span>
              <div className="text-4xl font-black font-mono tracking-tighter text-indigo-400">
                {formatCurrency(calculationResult.totalPay)}
              </div>
            </div>

            <div className="border-t border-slate-800 pt-4 space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">{t('workhours.total_hours', 'Total Hours')}:</span>
                <span className="font-bold font-mono text-slate-200">{calculationResult.totalHours.toFixed(2)}h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">{t('workhours.regular_hours', 'Regular Hours')}:</span>
                <span className="font-bold font-mono text-slate-200">{calculationResult.regularHours.toFixed(2)}h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">{t('workhours.overtime_hours', 'Overtime Hours')}:</span>
                <span className="font-bold font-mono text-slate-200">{calculationResult.overtimeHours.toFixed(2)}h</span>
              </div>

              <div className="border-t border-slate-800/80 pt-3 flex justify-between">
                <span className="text-slate-400">{t('workhours.regular_pay', 'Regular Pay')}:</span>
                <span className="font-bold font-mono text-slate-200">{formatCurrency(calculationResult.regularPay)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">{t('workhours.overtime_pay', 'Overtime Pay')}:</span>
                <span className="font-bold font-mono text-slate-200">{formatCurrency(calculationResult.overtimePay)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* About / Guide Information block */}
      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <Info className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('workhours.about_title', 'About Work Hours Calculator')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('workhours.about_text', 'Track your daily shift times (supporting overnight hours), subtract mandatory breaks, and calculate total hours worked. You can configure custom hourly rates and standard daily or weekly overtime rules with multipliers to estimate gross earnings instantly. Export your logging to CSV or copy a full text-based invoice report with a click.')}
          </p>
        </div>
      </div>
    </div>
  );
}
