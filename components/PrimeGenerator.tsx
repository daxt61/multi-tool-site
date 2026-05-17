import { useState, useEffect } from 'react';
import { Hash, Copy, Check, RefreshCw, Trash2, Download, AlertCircle, Info, Settings2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_PRIMES = 10000;
const MAX_VALUE = 10000000;

export function PrimeGenerator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [min, setMin] = useState(initialData?.min ?? 1);
  const [max, setMax] = useState(initialData?.max ?? 1000);
  const [count, setCount] = useState(initialData?.count ?? 100);
  const [mode, setMode] = useState<'range' | 'count'>(initialData?.mode ?? 'range');
  const [primes, setPrimes] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ min, max, count, mode });
  }, [min, max, count, mode, onStateChange]);

  const isPrime = (n: number) => {
    if (n <= 1) return false;
    if (n <= 3) return true;
    if (n % 2 === 0 || n % 3 === 0) return false;
    for (let i = 5; i * i <= n; i += 6) {
      if (n % i === 0 || n % (i + 2) === 0) return false;
    }
    return true;
  };

  const generatePrimes = () => {
    setError(null);
    const result: number[] = [];

    if (mode === 'range') {
      const start = Math.max(1, min);
      const end = Math.min(MAX_VALUE, max);

      if (start > end) {
        setError(t('prime.error_range'));
        return;
      }

      for (let i = start; i <= end; i++) {
        if (isPrime(i)) {
          result.push(i);
        }
        if (result.length >= MAX_PRIMES) break;
      }
    } else {
      let current = Math.max(1, min);
      const limit = Math.min(MAX_PRIMES, count);

      while (result.length < limit && current <= MAX_VALUE) {
        if (isPrime(current)) {
          result.push(current);
        }
        current++;
      }
    }

    setPrimes(result);
  };

  const handleCopy = () => {
    if (primes.length === 0) return;
    navigator.clipboard.writeText(primes.join(', '));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (primes.length === 0) return;
    const blob = new Blob([primes.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nombres-premiers-${mode}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{t('prime.config')}</h3>
            </div>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setMode('range')}
                aria-pressed={mode === 'range'}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${mode === 'range' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500'}`}
              >
                {t('prime.mode_range')}
              </button>
              <button
                onClick={() => setMode('count')}
                aria-pressed={mode === 'count'}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${mode === 'count' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500'}`}
              >
                {t('prime.mode_count')}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="min-input" className="text-xs font-bold text-slate-400 px-1">{t('prime.min_val')}</label>
              <input
                id="min-input"
                type="number"
                value={min}
                onChange={(e) => setMin(parseInt(e.target.value) || 0)}
                className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl font-black font-mono outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
              />
            </div>
            {mode === 'range' ? (
              <div className="space-y-2">
                <label htmlFor="max-input" className="text-xs font-bold text-slate-400 px-1">{t('prime.max_val')}</label>
                <input
                  id="max-input"
                  type="number"
                  value={max}
                  onChange={(e) => setMax(parseInt(e.target.value) || 0)}
                  className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl font-black font-mono outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <label htmlFor="count-input" className="text-xs font-bold text-slate-400 px-1">{t('prime.count')}</label>
                <input
                  id="count-input"
                  type="number"
                  value={count}
                  onChange={(e) => setCount(parseInt(e.target.value) || 0)}
                  className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl font-black font-mono outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
                />
              </div>
            )}
          </div>

          <button
            onClick={generatePrimes}
            className="w-full h-16 bg-indigo-600 text-white rounded-2xl font-black text-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95 flex items-center justify-center gap-3"
          >
            <RefreshCw className="w-6 h-6" /> {t('prime.generate')}
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
                {t('prime.result')} ({primes.length})
              </h3>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                disabled={primes.length === 0}
                className="text-xs font-bold px-3 py-1.5 rounded-xl text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 transition-all disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleCopy}
                disabled={primes.length === 0}
                className={`text-xs font-bold px-4 py-1.5 rounded-xl transition-all flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${copied ? 'bg-emerald-500 text-white' : 'text-slate-600 bg-slate-100 dark:bg-slate-800 border border-transparent'}`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} {copied ? t('common.copied') : t('common.copy')}
              </button>
              <button
                onClick={() => setPrimes([])}
                disabled={primes.length === 0}
                className="text-xs font-bold px-3 py-1.5 rounded-xl text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 transition-all disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div className="w-full h-[300px] p-6 bg-slate-900 dark:bg-black border border-slate-800 rounded-[2rem] overflow-y-auto font-mono text-sm leading-relaxed text-indigo-400 selection:bg-indigo-500/30">
            {primes.length > 0 ? (
              primes.join(', ')
            ) : (
              <span className="text-slate-600 italic">{t('prime.placeholder')}</span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-100 dark:border-slate-800">
        <div className="flex gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center flex-shrink-0 text-indigo-600">
            <Info className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold dark:text-white">{t('prime.info_title')}</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{t('prime.info_text')}</p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center flex-shrink-0 text-indigo-600">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold dark:text-white">{t('prime.limit_title')}</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{t('prime.limit_text', { max: MAX_PRIMES.toLocaleString(), val: MAX_VALUE.toLocaleString() })}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
