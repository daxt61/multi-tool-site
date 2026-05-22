import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  BarChart3, Copy, Check, Trash2, Download,
  Hash, Calculator, Sigma, TrendingUp, AlertCircle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_LENGTH = 100000;

export function NumberStatistics({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [input, setInput] = useState(initialData?.input || '');
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onStateChange?.({ input });
  }, [input, onStateChange]);

  const numbers = useMemo(() => {
    if (!input || input.length > MAX_LENGTH) return [];

    // Split by common delimiters: newline, comma, semicolon, space
    const items = input.split(/[\n,;\s]+/).filter((item: string) => item.trim() !== '');
    const parsed = items.map((item: string) => parseFloat(item.replace(',', '.'))).filter((n: number) => !isNaN(n));

    return parsed;
  }, [input]);

  const stats = useMemo(() => {
    if (numbers.length === 0) return null;

    const sorted = [...numbers].sort((a: number, b: number) => a - b);
    const count = numbers.length;
    const sum = numbers.reduce((a: number, b: number) => a + b, 0);
    const min = sorted[0];
    const max = sorted[count - 1];
    const range = max - min;
    const mean = sum / count;

    // Median
    const mid = Math.floor(count / 2);
    const median = count % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;

    // Mode
    const counts: Record<string, number> = Object.create(null);
    let maxFreq = 0;
    numbers.forEach((n: number) => {
      counts[n] = (counts[n] || 0) + 1;
      if (counts[n] > maxFreq) maxFreq = counts[n];
    });
    const modes = Object.keys(counts)
      .filter((n: string) => counts[n] === maxFreq)
      .map(Number);

    // Variance & Std Dev
    const sqDiffs = numbers.map((n: number) => Math.pow(n - mean, 2));
    const variance = sqDiffs.reduce((a: number, b: number) => a + b, 0) / count;
    const stdDev = Math.sqrt(variance);

    return {
      count,
      sum,
      mean,
      median,
      modes: maxFreq > 1 ? modes : [],
      min,
      max,
      range,
      variance,
      stdDev
    };
  }, [numbers]);

  const handleCopy = (val: string, id: string) => {
    navigator.clipboard.writeText(val);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDownload = () => {
    if (!input) return;
    const blob = new Blob([input], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `numbers-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyReport = () => {
    if (!stats) return;
    const report = `${t('numstats.report_title')}:
- ${t('numstats.count')}: ${stats.count}
- ${t('numstats.sum')}: ${stats.sum}
- ${t('numstats.min')}: ${stats.min}
- ${t('numstats.max')}: ${stats.max}
- ${t('numstats.range')}: ${stats.range}
- ${t('numstats.mean')}: ${stats.mean.toFixed(4)}
- ${t('numstats.median')}: ${stats.median}
- ${t('numstats.mode')}: ${stats.modes.length > 0 ? stats.modes.join(', ') : t('common.na')}
- ${t('numstats.variance')}: ${stats.variance.toFixed(4)}
- ${t('numstats.std_dev')}: ${stats.stdDev.toFixed(4)}`;

    handleCopy(report, 'report');
  };

  const formatNum = (n: number) => {
    if (Number.isInteger(n)) return n.toString();
    return n.toLocaleString(undefined, { maximumFractionDigits: 4 });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="num-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Hash className="w-4 h-4 text-indigo-500" /> {t('numstats.input_label')}
            </label>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                disabled={!input}
                className="text-xs font-bold px-3 py-1.5 rounded-xl text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 transition-all flex items-center gap-1 disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" /> {t('common.download')}
              </button>
              <button
                onClick={() => setInput('')}
                disabled={!input}
                className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" /> {t('common.clear')}
              </button>
            </div>
          </div>
          <textarea
            id="num-input"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              if (e.target.value.length > MAX_LENGTH) {
                setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
              } else {
                setError(null);
              }
            }}
            placeholder={t('numstats.placeholder')}
            className="w-full h-80 p-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-lg font-mono dark:text-slate-300 resize-none"
          />
        </div>

        <div className="space-y-6">
          <div className="p-8 bg-indigo-600 rounded-[2rem] text-white shadow-xl shadow-indigo-600/20 space-y-6">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-6 h-6 opacity-50" />
              <h3 className="text-xl font-black">{t('numstats.summary')}</h3>
            </div>
            {stats ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-white/10 pb-4">
                  <span className="text-indigo-100 text-sm font-bold uppercase tracking-wider">{t('numstats.count')}</span>
                  <span className="text-2xl font-black font-mono">{stats.count}</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/10 pb-4">
                  <span className="text-indigo-100 text-sm font-bold uppercase tracking-wider">{t('numstats.sum')}</span>
                  <span className="text-2xl font-black font-mono">{formatNum(stats.sum)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-indigo-100 text-sm font-bold uppercase tracking-wider">{t('numstats.mean')}</span>
                  <span className="text-2xl font-black font-mono">{formatNum(stats.mean)}</span>
                </div>
                <button
                  onClick={copyReport}
                  className={`w-full py-3 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 ${
                    copied === 'report' ? 'bg-emerald-500' : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  {copied === 'report' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied === 'report' ? t('common.copied') : t('numstats.copy_report')}
                </button>
              </div>
            ) : (
              <p className="text-indigo-100 text-sm italic font-medium leading-relaxed">
                {t('numstats.waiting')}
              </p>
            )}
          </div>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {[
            { label: t('numstats.median'), value: formatNum(stats.median), icon: <TrendingUp className="w-4 h-4" /> },
            { label: t('numstats.min'), value: formatNum(stats.min), icon: <TrendingUp className="w-4 h-4 rotate-180" /> },
            { label: t('numstats.max'), value: formatNum(stats.max), icon: <TrendingUp className="w-4 h-4" /> },
            { label: t('numstats.range'), value: formatNum(stats.range), icon: <TrendingUp className="w-4 h-4" /> },
            { label: t('numstats.std_dev'), value: stats.stdDev.toFixed(4), icon: <Sigma className="w-4 h-4" /> },
            { label: t('numstats.variance'), value: stats.variance.toFixed(4), icon: <Calculator className="w-4 h-4" /> },
            { label: t('numstats.mode'), value: stats.modes.length > 0 ? stats.modes.join(', ') : t('common.na'), icon: <Hash className="w-4 h-4" /> }
          ].map((item, i) => (
            <div key={i} className="group bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-6 rounded-[2rem] space-y-3 hover:border-indigo-500/30 transition-all">
              <div className="flex justify-between items-center">
                <div className="text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 p-2 rounded-xl">
                  {item.icon}
                </div>
                <button
                  onClick={() => handleCopy(item.value.toString(), `stat-${i}`)}
                  className={`p-2 rounded-xl transition-all ${
                    copied === `stat-${i}`
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600'
                    : 'text-slate-400 hover:text-indigo-500 opacity-0 group-hover:opacity-100'
                  }`}
                >
                  {copied === `stat-${i}` ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <div>
                <div className="text-2xl font-black font-mono tracking-tight dark:text-white truncate">
                  {item.value}
                </div>
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {item.label}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
