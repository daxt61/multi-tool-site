import { useState, useEffect, useCallback, useRef } from 'react';
import { Calendar, History, Info, RotateCcw, Copy, Check, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function DateCalculator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t, i18n } = useTranslation();
  const today = new Date().toISOString().split('T')[0];
  const [date1, setDate1] = useState(initialData?.date1 || today);
  const [date2, setDate2] = useState(initialData?.date2 || today);
  const [daysToAdd, setDaysToAdd] = useState(initialData?.daysToAdd || '30');
  const [activeSection, setActiveSection] = useState<'diff' | 'add'>('diff');
  const date1Ref = useRef<HTMLInputElement>(null);
  const date2Ref = useRef<HTMLInputElement>(null);
  const daysRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    onStateChange?.({ date1, date2, daysToAdd });
  }, [date1, date2, daysToAdd, onStateChange]);

  const calculateDifference = () => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);

    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
      return { totalDays: 0, years: 0, months: 0, days: 0, workingDays: 0 };
    }

    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    const totalDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    const start = d1 < d2 ? d1 : d2;
    const end = d1 < d2 ? d2 : d1;

    let years = end.getFullYear() - start.getFullYear();
    let months = end.getMonth() - start.getMonth();
    let days = end.getDate() - start.getDate();

    if (days < 0) {
      months -= 1;
      const prevMonth = new Date(end.getFullYear(), end.getMonth(), 0);
      days += prevMonth.getDate();
    }

    if (months < 0) {
      years -= 1;
      months += 12;
    }

    let workingDays = 0;
    const curDate = new Date(start);
    while (curDate < end) {
      const dayOfWeek = curDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) workingDays++;
      curDate.setDate(curDate.getDate() + 1);
    }

    return { totalDays, years, months, days, workingDays };
  };

  const addDaysToDate = (date: string, days: number) => {
    if (!date) return "";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "";
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  const getDayOfWeek = (date: string) => {
    if (!date) return "";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString(i18n.language, { weekday: 'long' });
  };

  const [copiedDiff, setCopiedDiff] = useState(false);
  const [copiedDate, setCopiedDate] = useState(false);

  const diff = calculateDifference();
  const newDate = addDaysToDate(date1, parseInt(daysToAdd) || 0);

  const handleCopyDiff = () => {
    const text = `${diff.years}${t('agecalculator.years').charAt(0)} ${diff.months}m ${diff.days}${t('agecalculator.days_short')} (${diff.totalDays} ${t('agecalculator.days')}, ${diff.workingDays} ${t('datecalc.working_days_short')})`;
    navigator.clipboard.writeText(text);
    setCopiedDiff(true);
    setTimeout(() => setCopiedDiff(false), 2000);
  };

  const handleCopyDate = () => {
    if (!newDate) return;
    const text = `${newDate} (${getDayOfWeek(newDate)})`;
    navigator.clipboard.writeText(text);
    setCopiedDate(true);
    setTimeout(() => setCopiedDate(false), 2000);
  };

  const handleDownloadDiff = () => {
    const content = `${t('datecalc.diff_title')} :
- ${t('datecalc.start_date')} : ${date1}
- ${t('datecalc.end_date')} : ${date2}
- ${t('percentage.result')} : ${diff.years} ${t('agecalculator.years')}, ${diff.months} ${t('agecalculator.months')}, ${diff.days} ${t('agecalculator.days')}
- ${t('agecalculator.stats_total_days')} : ${diff.totalDays}
- ${t('datecalc.working_days')} : ${diff.workingDays}`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `difference-dates-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadAdd = () => {
    if (!newDate) return;
    const content = `${t('datecalc.add_title')} :
- ${t('datecalc.start_date')} : ${date1}
- ${t('datecalc.offset_label')} : ${daysToAdd}
- ${t('datecalc.new_date')} : ${newDate} (${getDayOfWeek(newDate)})`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `calcul-date-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = useCallback(() => {
    setDate1(today);
    setDate2(today);
    setDaysToAdd('30');
    // Standardize behavior: focus the first logical input
    date1Ref.current?.focus();
  }, [today]);

  const handleResetRef = useRef(handleReset);
  const handleCopyDiffRef = useRef(handleCopyDiff);
  const handleCopyDateRef = useRef(handleCopyDate);
  const handleDownloadDiffRef = useRef(handleDownloadDiff);
  const handleDownloadAddRef = useRef(handleDownloadAdd);
  const activeSectionRef = useRef(activeSection);

  useEffect(() => {
    handleResetRef.current = handleReset;
    handleCopyDiffRef.current = handleCopyDiff;
    handleCopyDateRef.current = handleCopyDate;
    handleDownloadDiffRef.current = handleDownloadDiff;
    handleDownloadAddRef.current = handleDownloadAdd;
    activeSectionRef.current = activeSection;
  }, [handleReset, handleCopyDiff, handleCopyDate, handleDownloadDiff, handleDownloadAdd, activeSection]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInputFocused =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement instanceof HTMLSelectElement ||
        activeElement?.getAttribute("contenteditable") === "true";

      if (isInputFocused) {
        if (e.key === "Escape") {
          e.preventDefault();
          handleResetRef.current();
        }
        return;
      }

      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key === "Escape") {
        e.preventDefault();
        handleResetRef.current();
      } else if (e.key.toLowerCase() === "c") {
        e.preventDefault();
        if (activeSectionRef.current === 'diff') handleCopyDiffRef.current();
        else handleCopyDateRef.current();
      } else if (e.key.toLowerCase() === "d") {
        e.preventDefault();
        if (activeSectionRef.current === 'diff') handleDownloadDiffRef.current();
        else handleDownloadAddRef.current();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Date Difference Calculator */}
      <div
        onFocus={() => setActiveSection('diff')}
        onClick={() => setActiveSection('diff')}
        className={`bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border ${activeSection === 'diff' ? 'border-indigo-500/30' : 'border-slate-200 dark:border-slate-800'} space-y-8 transition-colors shadow-sm`}
      >
        <div className="flex justify-between items-center px-1">
          <div className="flex items-center gap-2 text-indigo-500">
            <History className="w-4 h-4" />
            <label className="text-xs font-black uppercase tracking-widest text-slate-400">{t('datecalc.diff_title')}</label>
          </div>
          <div className="flex gap-2 items-center">
            <button
              onClick={handleDownloadDiff}
              title={`${t('common.download')} (D)`}
              className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
            >
              <Download className="w-3 h-3" /> {t('common.download')}
              <kbd className="hidden md:inline-flex items-center justify-center w-4 h-4 border border-indigo-200 dark:border-indigo-800 rounded text-[10px] font-bold bg-white dark:bg-slate-900 ml-0.5 uppercase">D</kbd>
            </button>
            <button
              onClick={handleReset}
              disabled={date1 === today && date2 === today && daysToAdd === '30'}
              title={`${t('common.reset')} (Esc)`}
              className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
            >
              <RotateCcw className="w-3 h-3" /> {t('common.reset')}
              <kbd className="hidden md:inline-flex items-center justify-center px-1.5 py-0.5 border border-rose-200 dark:border-rose-800 rounded text-[10px] font-bold bg-white dark:bg-slate-900 ml-0.5">Esc</kbd>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <label htmlFor="date1" className="text-xs font-bold text-slate-400 px-1 uppercase tracking-widest cursor-pointer">{t('datecalc.start_date')}</label>
            <input
              id="date1"
              ref={date1Ref}
              type="date"
              value={date1}
              onChange={(e) => setDate1(e.target.value)}
              className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
            />
            <div className="text-xs font-bold text-indigo-500 px-1 capitalize">{getDayOfWeek(date1)}</div>
          </div>
          <div className="space-y-3">
            <label htmlFor="date2" className="text-xs font-bold text-slate-400 px-1 uppercase tracking-widest cursor-pointer">{t('datecalc.end_date')}</label>
            <input
              id="date2"
              ref={date2Ref}
              type="date"
              value={date2}
              onChange={(e) => setDate2(e.target.value)}
              className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
            />
            <div className="text-xs font-bold text-indigo-500 px-1 capitalize">{getDayOfWeek(date2)}</div>
          </div>
        </div>

        <div className="relative group/diff">
          <button
            onClick={handleCopyDiff}
            className={`absolute top-2 right-2 p-2 rounded-xl transition-all z-10 flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
              copiedDiff
                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200'
                : 'text-slate-400 hover:text-indigo-500 bg-white dark:bg-slate-800 md:opacity-0 md:group-hover/diff:opacity-100 md:focus-visible:opacity-100 shadow-sm border border-slate-100 dark:border-slate-700'
            }`}
            title={`${t('common.copy')} (C)`}
          >
            {copiedDiff ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {!copiedDiff && <kbd className="hidden md:inline-flex items-center justify-center w-4 h-4 border border-slate-200 dark:border-slate-800 rounded text-[10px] font-bold bg-white dark:bg-slate-900">C</kbd>}
          </button>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4" aria-live="polite" aria-atomic="true">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 text-center">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{t('agecalculator.years')} / {t('agecalculator.months')} / {t('agecalculator.days')}</div>
              <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
                {diff.years}{t('agecalculator.years').charAt(0)} {diff.months}m {diff.days}{t('agecalculator.days_short')}
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 text-center">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{t('agecalculator.stats_total_days')}</div>
              <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
                {diff.totalDays} {t('agecalculator.days_short')}
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 text-center">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{t('agecalculator.stats_total_weeks')}</div>
              <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
                {(diff.totalDays / 7).toFixed(1)} w
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 text-center">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{t('datecalc.working_days')}</div>
              <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
                {diff.workingDays} j
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Subtract Days */}
      <div
        onFocus={() => setActiveSection('add')}
        onClick={() => setActiveSection('add')}
        className={`bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border ${activeSection === 'add' ? 'border-indigo-500/30' : 'border-slate-200 dark:border-slate-800'} space-y-8 transition-colors shadow-sm`}
      >
        <div className="flex justify-between items-center px-1">
          <div className="flex items-center gap-2 text-indigo-500">
            <Calendar className="w-4 h-4" />
            <label className="text-xs font-black uppercase tracking-widest text-slate-400">{t('datecalc.add_title')}</label>
          </div>
          <div className="flex gap-2 items-center">
            <button
              onClick={handleDownloadAdd}
              disabled={!newDate}
              title={`${t('common.download')} (D)`}
              className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
            >
              <Download className="w-3 h-3" /> {t('common.download')}
              <kbd className="hidden md:inline-flex items-center justify-center w-4 h-4 border border-indigo-200 dark:border-indigo-800 rounded text-[10px] font-bold bg-white dark:bg-slate-900 ml-0.5 uppercase">D</kbd>
            </button>
            <button
              onClick={handleReset}
              disabled={date1 === today && date2 === today && daysToAdd === '30'}
              title={`${t('common.reset')} (Esc)`}
              className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
            >
              <RotateCcw className="w-3 h-3" /> {t('common.reset')}
              <kbd className="hidden md:inline-flex items-center justify-center px-1.5 py-0.5 border border-rose-200 dark:border-rose-800 rounded text-[10px] font-bold bg-white dark:bg-slate-900 ml-0.5">Esc</kbd>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
             <label htmlFor="base-date" className="text-xs font-bold text-slate-400 px-1 uppercase tracking-widest cursor-pointer">{t('datecalc.start_date')}</label>
             <input
              id="base-date"
              type="date"
              value={date1}
              onChange={(e) => setDate1(e.target.value)}
              className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
            />
          </div>
          <div className="space-y-3">
             <label htmlFor="days-offset" className="text-xs font-bold text-slate-400 px-1 uppercase tracking-widest cursor-pointer">{t('datecalc.offset_label')}</label>
             <div className="relative">
                <input
                  id="days-offset"
                  ref={daysRef}
                  type="number"
                  value={daysToAdd}
                  onChange={(e) => setDaysToAdd(e.target.value)}
                  className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
                  placeholder="30"
                />
             </div>
          </div>
        </div>

        <div className="bg-slate-900 dark:bg-black p-8 rounded-3xl text-center shadow-xl shadow-indigo-500/10 relative group/date" aria-live="polite" aria-atomic="true">
          <button
            onClick={handleCopyDate}
            className={`absolute top-4 right-4 p-3 rounded-2xl transition-all z-10 flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none ${
              copiedDate
                ? 'bg-emerald-500 text-white'
                : 'text-white/40 hover:text-white hover:bg-white/10 md:opacity-0 md:group-hover/date:opacity-100 md:focus-visible:opacity-100'
            }`}
            title={`${t('common.copy')} (C)`}
            aria-label={t('common.copy')}
          >
            {copiedDate ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            {!copiedDate && <kbd className="hidden md:inline-flex items-center justify-center w-5 h-5 border border-white/20 rounded text-[10px] font-bold bg-white/5 text-white/50 ml-1">C</kbd>}
          </button>
          <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2">{t('datecalc.new_date')}</div>
          <div className="text-4xl font-black text-white font-mono tracking-tight">
            {newDate || "Invalid Date"}
          </div>
          <div className="text-sm font-bold text-slate-500 mt-2 uppercase tracking-widest capitalize">
            {getDayOfWeek(newDate)}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[2rem] flex items-start gap-4">
         <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl">
            <Info className="w-6 h-6" />
         </div>
         <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
           {t('datecalc.about_text')}
         </p>
      </div>
    </div>
  );
}
