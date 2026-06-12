import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Calendar, Clock, Heart, Baby, Gift, Info, Star, Trash2, Copy, Check, Download, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function AgeCalculator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [birthDate, setBirthDate] = useState<string>(initialData?.birthDate || '1990-01-01');
  const [copied, setCopied] = useState(false);
  const [copiedReport, setCopiedReport] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const birthDateInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    onStateChange?.({ birthDate });
  }, [birthDate, onStateChange]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const ageData = useMemo(() => {
    const today = currentTime;
    const birth = new Date(birthDate);
    if (isNaN(birth.getTime())) return null;

    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();
    let days = today.getDate() - birth.getDate();

    if (days < 0) {
      months -= 1;
      const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      days += lastMonth.getDate();
    }
    if (months < 0) {
      years -= 1;
      months += 12;
    }

    // Next birthday
    let nextBirthday = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
    if (nextBirthday < today) {
      nextBirthday.setFullYear(today.getFullYear() + 1);
    }
    const diffTime = nextBirthday.getTime() - today.getTime();

    const daysToNextBirthday = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const hoursToNextBirthday = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minsToNextBirthday = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));
    const secsToNextBirthday = Math.floor((diffTime % (1000 * 60)) / 1000);

    // Stats
    const totalMs = today.getTime() - birth.getTime();
    const totalDays = Math.floor(totalMs / (1000 * 60 * 60 * 24));
    const totalWeeks = Math.floor(totalDays / 7);
    const totalMonths = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth());
    const totalHours = totalDays * 24;

    return {
      years, months, days,
      daysToNextBirthday,
      hoursToNextBirthday,
      minsToNextBirthday,
      secsToNextBirthday,
      totalDays, totalWeeks, totalMonths, totalHours,
      zodiac: getZodiacSign(birth.getMonth() + 1, birth.getDate())
    };
  }, [birthDate, currentTime]);

  function getZodiacSign(month: number, day: number) {
    const signs = [
      { name: t('agecalculator.zodiac.capricorn'), icon: "♑" }, { name: t('agecalculator.zodiac.aquarius'), icon: "♒" },
      { name: t('agecalculator.zodiac.pisces'), icon: "♓" }, { name: t('agecalculator.zodiac.aries'), icon: "♈" },
      { name: t('agecalculator.zodiac.taurus'), icon: "♉" }, { name: t('agecalculator.zodiac.gemini'), icon: "♊" },
      { name: t('agecalculator.zodiac.cancer'), icon: "♋" }, { name: t('agecalculator.zodiac.leo'), icon: "♌" },
      { name: t('agecalculator.zodiac.virgo'), icon: "♍" }, { name: t('agecalculator.zodiac.libra'), icon: "♎" },
      { name: t('agecalculator.zodiac.scorpio'), icon: "♏" }, { name: t('agecalculator.zodiac.sagittarius'), icon: "♐" }
    ];
    const boundaries = [20, 19, 20, 20, 21, 21, 22, 23, 23, 23, 22, 21];
    let index = (day >= boundaries[month - 1]) ? month % 12 : month - 1;
    return signs[index];
  }

  const handleCopy = useCallback(() => {
    if (!ageData) return;
    const parts = [];
    if (ageData.years > 0) parts.push(`${ageData.years} ${t('agecalculator.years').toLowerCase()}`);
    if (ageData.months > 0) parts.push(`${ageData.months} ${t('agecalculator.months').toLowerCase()}`);
    if (ageData.days > 0) parts.push(`${ageData.days} ${t('agecalculator.days').toLowerCase()}`);

    let text = parts.join(', ');
    if (parts.length > 1) {
      const lastCommaIndex = text.lastIndexOf(', ');
      const connector = t('common.and');
      text = text.substring(0, lastCommaIndex) + connector + text.substring(lastCommaIndex + 2);
    }

    navigator.clipboard.writeText(text || `0 ${t('agecalculator.days').toLowerCase()}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [ageData, t]);

  const getReportContent = useCallback(() => {
    if (!ageData) return "";
    return `${t('agecalculator.report_title')} :
- ${t('agecalculator.birth_date')} : ${birthDate}
- ${t('agecalculator.current_age')} : ${ageData.years} ${t('agecalculator.years').toLowerCase()}, ${ageData.months} ${t('agecalculator.months').toLowerCase()}, ${ageData.days} ${t('agecalculator.days').toLowerCase()}
- ${t('agecalculator.zodiac_sign')} : ${ageData.zodiac.name} ${ageData.zodiac.icon}
- ${t('agecalculator.next_birthday')} : ${ageData.daysToNextBirthday}${t('agecalculator.days_short')} ${ageData.hoursToNextBirthday}${t('agecalculator.hours').charAt(0).toLowerCase()} ${ageData.minsToNextBirthday}${t('agecalculator.min').charAt(0).toLowerCase()}

${t('agecalculator.life_stats')} :
- ${t('agecalculator.stats_total_months')} : ${ageData.totalMonths.toLocaleString()}
- ${t('agecalculator.stats_total_weeks')} : ${ageData.totalWeeks.toLocaleString()}
- ${t('agecalculator.stats_total_days')} : ${ageData.totalDays.toLocaleString()}
- ${t('agecalculator.stats_total_hours')} : ${ageData.totalHours.toLocaleString()}`;
  }, [ageData, t, birthDate]);

  const handleDownload = useCallback(() => {
    const content = getReportContent();
    if (!content) return;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rapport-age-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }, [getReportContent]);

  const handleCopyReport = useCallback(() => {
    const content = getReportContent();
    if (!content) return;
    navigator.clipboard.writeText(content);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  }, [getReportContent]);

  const handleReset = useCallback(() => {
    setBirthDate('');
    birthDateInputRef.current?.focus();
  }, []);

  const handleResetRef = useRef(handleReset);
  const handleCopyRef = useRef(handleCopy);
  const handleCopyReportRef = useRef(handleCopyReport);
  const handleDownloadRef = useRef(handleDownload);

  useEffect(() => {
    handleResetRef.current = handleReset;
    handleCopyRef.current = handleCopy;
    handleCopyReportRef.current = handleCopyReport;
    handleDownloadRef.current = handleDownload;
  }, [handleReset, handleCopy, handleCopyReport, handleDownload]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInputFocused =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement instanceof HTMLSelectElement ||
        activeElement?.getAttribute("contenteditable") === "true";

      if (isInputFocused) return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key === "Escape") {
        e.preventDefault();
        handleResetRef.current();
      } else if (e.key.toLowerCase() === "c") {
        e.preventDefault();
        handleCopyRef.current();
      } else if (e.key.toLowerCase() === "r") {
        e.preventDefault();
        handleCopyReportRef.current();
      } else if (e.key.toLowerCase() === "d") {
        e.preventDefault();
        handleDownloadRef.current();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="birth-date" className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2 cursor-pointer">
                <Baby className="w-4 h-4" aria-hidden="true" /> {t('agecalculator.birth_date')}
              </label>
              <div className="flex gap-2">
                <button
                  onClick={handleCopyReport}
                  disabled={!ageData}
                  title={`${t('common.copy')} (R)`}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                    copiedReport
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                      : 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30'
                  }`}
                >
                  {copiedReport ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span className="hidden sm:inline">{copiedReport ? t('common.copied') : t('common.copy')}</span>
                  {!copiedReport && <kbd className="hidden md:inline-flex items-center justify-center w-4 h-4 border border-indigo-200 dark:border-indigo-800 rounded text-[10px] font-bold bg-white dark:bg-slate-900 ml-1">R</kbd>}
                </button>
                <button
                  onClick={handleDownload}
                  disabled={!ageData}
                  title={`${t('common.download')} (D)`}
                  className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
                >
                  <Download className="w-3 h-3" />
                  <span className="hidden sm:inline">{t('common.download')}</span>
                  <kbd className="hidden md:inline-flex items-center justify-center w-4 h-4 border border-indigo-200 dark:border-indigo-800 rounded text-[10px] font-bold bg-white dark:bg-slate-900 ml-1">D</kbd>
                </button>
                <button
                  onClick={handleReset}
                  disabled={!birthDate}
                  title={`${t('common.reset')} (Esc)`}
                  className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span className="hidden sm:inline">{t('common.reset')}</span>
                  <kbd className="hidden md:inline-flex items-center justify-center px-1.5 py-0.5 border border-rose-200 dark:border-rose-800 rounded text-[10px] font-bold text-rose-400 bg-white dark:bg-slate-900 ml-1">Esc</kbd>
                </button>
              </div>
            </div>
            <input
              id="birth-date"
              ref={birthDateInputRef}
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
            />
            {ageData && (
              <div className="pt-4 space-y-4">
                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-500 dark:text-indigo-300 uppercase tracking-tight">{t('agecalculator.zodiac_sign')}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl" aria-hidden="true">{ageData.zodiac.icon}</span>
                    <span className="font-black text-indigo-600 dark:text-indigo-400">{ageData.zodiac.name}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-indigo-600/10 text-center space-y-4" aria-live="polite" aria-atomic="true">
             <Gift className="w-8 h-8 mx-auto mb-2 opacity-50" aria-hidden="true" />
             <div className="space-y-1">
               <p className="text-indigo-100 text-xs font-black uppercase tracking-widest">{t('agecalculator.next_birthday')}</p>
               <h4 className="text-4xl font-black">{ageData?.daysToNextBirthday || 0}{t('agecalculator.days_short')}</h4>
             </div>
             <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10">
                <div className="space-y-1">
                  <div className="text-xl font-black font-mono">{ageData?.hoursToNextBirthday || 0}</div>
                  <div className="text-[10px] font-bold uppercase opacity-60">{t('agecalculator.hours')}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xl font-black font-mono">{ageData?.minsToNextBirthday || 0}</div>
                  <div className="text-[10px] font-bold uppercase opacity-60">{t('agecalculator.min')}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xl font-black font-mono">{ageData?.secsToNextBirthday || 0}</div>
                  <div className="text-[10px] font-bold uppercase opacity-60">{t('agecalculator.sec')}</div>
                </div>
             </div>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-8 space-y-8">
          {/* Main Age Display */}
          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-center space-y-6 relative group overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>

             <button
               onClick={handleCopy}
               disabled={!ageData}
               title={`${t('agecalculator.copy_age')} (C)`}
               className={`absolute top-6 right-6 p-3 rounded-2xl transition-all z-20 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none flex items-center gap-2 ${
                 copied
                   ? 'bg-emerald-500 text-white'
                   : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-indigo-500 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100'
               } disabled:opacity-0`}
               aria-label={t('agecalculator.copy_age')}
             >
               {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
               {!copied && <kbd className="hidden sm:inline-flex items-center justify-center w-5 h-5 border border-slate-200 dark:border-slate-800 rounded text-[10px] font-bold bg-white dark:bg-slate-900">C</kbd>}
             </button>

             <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">{t('agecalculator.current_age')}</h3>
             <div className="flex flex-wrap justify-center gap-4 md:gap-8" aria-live="polite" aria-atomic="true">
                <div className="space-y-1">
                  <div className="text-6xl md:text-8xl font-black text-slate-900 dark:text-white font-mono tracking-tighter">
                    {ageData?.years || 0}
                  </div>
                  <div className="text-xs font-black uppercase tracking-widest text-slate-500">{t('agecalculator.years')}</div>
                </div>
                <div className="text-6xl md:text-8xl font-black text-slate-200 dark:text-slate-800 font-mono" aria-hidden="true">:</div>
                <div className="space-y-1">
                  <div className="text-6xl md:text-8xl font-black text-slate-900 dark:text-white font-mono tracking-tighter">
                    {ageData?.months || 0}
                  </div>
                  <div className="text-xs font-black uppercase tracking-widest text-slate-500">{t('agecalculator.months')}</div>
                </div>
                <div className="text-6xl md:text-8xl font-black text-slate-200 dark:text-slate-800 font-mono" aria-hidden="true">:</div>
                <div className="space-y-1">
                  <div className="text-6xl md:text-8xl font-black text-slate-900 dark:text-white font-mono tracking-tighter">
                    {ageData?.days || 0}
                  </div>
                  <div className="text-xs font-black uppercase tracking-widest text-slate-500">{t('agecalculator.days')}</div>
                </div>
             </div>
          </div>

          {/* Life Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             {[
               { icon: <Calendar className="w-4 h-4" />, label: t('agecalculator.stats_total_months'), value: ageData?.totalMonths.toLocaleString() },
               { icon: <Star className="w-4 h-4" />, label: t('agecalculator.stats_total_weeks'), value: ageData?.totalWeeks.toLocaleString() },
               { icon: <Clock className="w-4 h-4" />, label: t('agecalculator.stats_total_days'), value: ageData?.totalDays.toLocaleString() },
               { icon: <Heart className="w-4 h-4" />, label: t('agecalculator.stats_total_hours'), value: ageData?.totalHours.toLocaleString() },
             ].map((stat, i) => (
               <div key={i} className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-3xl space-y-3">
                 <div className="text-indigo-500" aria-hidden="true">{stat.icon}</div>
                 <div className="text-xl font-black font-mono tracking-tight dark:text-white">{stat.value}</div>
                 <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{stat.label}</div>
               </div>
             ))}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-[2rem] flex items-start gap-4">
         <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl">
            <Info className="w-6 h-6" aria-hidden="true" />
         </div>
         <div className="space-y-2">
            <h4 className="font-bold dark:text-white">{t('agecalculator.how_it_works_title')}</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              {t('agecalculator.how_it_works_text')}
            </p>
         </div>
      </div>
    </div>
  );
}
