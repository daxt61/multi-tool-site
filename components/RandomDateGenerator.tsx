import { useState, useEffect, useCallback } from 'react';
import { Calendar, Copy, Check, RefreshCw, Trash2, Download, Settings2, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getSecureRandomInt } from './ui/crypto';

export function RandomDateGenerator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [count, setCount] = useState(initialData?.count ?? 10);
  const [startDate, setStartDate] = useState(initialData?.startDate || '2000-01-01');
  const [endDate, setEndDate] = useState(initialData?.endDate || '2025-12-31');
  const [format, setFormat] = useState(initialData?.format || 'YYYY-MM-DD');
  const [dates, setDates] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ count, startDate, endDate, format });
  }, [count, startDate, endDate, format, onStateChange]);

  const formatDate = (date: Date, fmt: string) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');

    switch (fmt) {
      case 'DD/MM/YYYY': return `${dd}/${mm}/${yyyy}`;
      case 'MM/DD/YYYY': return `${mm}/${dd}/${yyyy}`;
      case 'ISO': return date.toISOString();
      case 'Timestamp': return String(date.getTime());
      default: return `${yyyy}-${mm}-${dd}`;
    }
  };

  const generateDates = useCallback(() => {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();

    if (isNaN(start) || isNaN(end) || start > end) return;

    const range = end - start;
    const limit = Math.max(1, Math.min(1000, count));
    const newDates = Array.from({ length: limit }, () => {
      const randomMs = getSecureRandomInt(range + 1);
      return formatDate(new Date(start + randomMs), format);
    });

    setDates(newDates);
    setCopied(false);
  }, [count, startDate, endDate, format]);

  const handleCopy = () => {
    if (dates.length === 0) return;
    navigator.clipboard.writeText(dates.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (dates.length === 0) return;
    const blob = new Blob([dates.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `random-dates-${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 px-1">
            <Settings2 className="w-4 h-4 text-indigo-500" /> {t('common.options')}
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase px-1">{t('common.count')}</label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={count}
                  onChange={(e) => setCount(Math.max(1, Math.min(1000, parseInt(e.target.value) || 0)))}
                  className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase px-1">{t('randomdate.format', 'Format')}</label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-xs outline-none cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="ISO">ISO 8601</option>
                  <option value="Timestamp">Timestamp (ms)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase px-1">{t('randomdate.start', 'Start Date')}</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-xs outline-none transition-all dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase px-1">{t('randomdate.end', 'End Date')}</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-xs outline-none transition-all dark:text-white"
                />
              </div>
            </div>
          </div>

          <button
            onClick={generateDates}
            className="w-full h-16 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-5 h-5" /> {t('random.generate')}
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
              <Calendar className="w-4 h-4 text-indigo-500" /> {t('common.result')}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                disabled={dates.length === 0}
                className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-all flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={handleCopy}
                disabled={dates.length === 0}
                className={`text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-2 border ${
                  copied
                    ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                    : "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 border-transparent"
                } disabled:opacity-50`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? t('common.copied') : t('common.copy')}
              </button>
            </div>
          </div>
          <textarea
            readOnly
            value={dates.join('\n')}
            placeholder={t('randomdate.placeholder', 'Generated dates will appear here...')}
            className="w-full h-80 p-8 bg-slate-900 text-indigo-300 border border-slate-800 rounded-[2.5rem] font-mono text-sm leading-relaxed resize-none outline-none"
          />
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <Info className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('randomdate.about_title', 'About Random Date Generator')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('randomdate.about_text', 'Generate a list of random dates within a specified range. You can choose different output formats including standard YYYY-MM-DD, localized formats, ISO 8601, or Unix timestamps in milliseconds.')}
          </p>
        </div>
      </div>
    </div>
  );
}
