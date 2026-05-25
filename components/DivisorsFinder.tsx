import { useState, useMemo, useEffect } from 'react';
import {
  Hash, Copy, Check, Trash2, Download,
  Calculator, List, Info, AlertCircle, Sparkles
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_VALUE = 1000000000000; // 1 trillion

export function DivisorsFinder({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [number, setNumber] = useState<string>(initialData?.number || '42');
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onStateChange?.({ number });
  }, [number, onStateChange]);

  const stats = useMemo(() => {
    const n = parseInt(number);
    if (isNaN(n) || n < 1) return null;
    if (n > MAX_VALUE) return null;

    const divisors: number[] = [];
    const sqrt = Math.sqrt(n);
    for (let i = 1; i <= sqrt; i++) {
      if (n % i === 0) {
        divisors.push(i);
        if (i * i !== n) divisors.push(n / i);
      }
    }
    divisors.sort((a, b) => a - b);

    const sum = divisors.reduce((a, b) => a + b, 0);
    const properSum = sum - n;
    const isPrime = divisors.length === 2;
    const isPerfect = properSum === n;
    const isAbundant = properSum > n;
    const isDeficient = properSum < n;

    // Prime Factorization
    let temp = n;
    const factors: Record<number, number> = {};
    let d = 2;
    while (temp >= d * d) {
      if (temp % d === 0) {
        factors[d] = (factors[d] || 0) + 1;
        temp /= d;
      } else {
        d++;
      }
    }
    if (temp > 1) factors[temp] = (factors[temp] || 0) + 1;

    return {
      n,
      divisors,
      count: divisors.length,
      sum,
      properSum,
      isPrime,
      isPerfect,
      isAbundant,
      isDeficient,
      factors: Object.entries(factors).map(([p, e]) => ({ p: parseInt(p), e }))
    };
  }, [number]);

  const handleCopy = (val: string, id: string) => {
    navigator.clipboard.writeText(val);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleInputChange = (val: string) => {
    setNumber(val);
    const n = parseInt(val);
    if (val && (isNaN(n) || n < 1)) {
      setError(t('divisors.error_invalid'));
    } else if (n > MAX_VALUE) {
      setError(t('divisors.error_too_large', { max: MAX_VALUE.toLocaleString() }));
    } else {
      setError(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="num-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Hash className="w-4 h-4 text-indigo-500" /> {t('divisors.input_label')}
              </label>
              <button
                onClick={() => setNumber('')}
                className="text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors"
              >
                {t('common.clear')}
              </button>
            </div>
            <input
              id="num-input"
              type="number"
              value={number}
              onChange={(e) => handleInputChange(e.target.value)}
              className="w-full p-6 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-3xl text-4xl font-black font-mono outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all dark:text-white"
              placeholder="42"
            />
          </div>

          {stats && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-6 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-2">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('divisors.classification')}</div>
                <div className="flex flex-wrap gap-2">
                  {stats.isPrime && <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-bold">{t('divisors.prime')}</span>}
                  {stats.isPerfect && <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-bold">{t('divisors.perfect')}</span>}
                  {stats.isAbundant && <span className="px-3 py-1 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-full text-xs font-bold">{t('divisors.abundant')}</span>}
                  {stats.isDeficient && <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full text-xs font-bold">{t('divisors.deficient')}</span>}
                </div>
              </div>
              <div className="p-6 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-2">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('divisors.prime_factorization')}</div>
                <div className="text-xl font-black font-mono dark:text-white">
                  {stats.factors.map((f, i) => (
                    <span key={i}>
                      {f.p}{f.e > 1 && <sup className="text-indigo-500">{f.e}</sup>}
                      {i < stats.factors.length - 1 && <span className="mx-1 text-slate-400">×</span>}
                    </span>
                  )) || '1'}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="p-8 bg-indigo-600 rounded-[2.5rem] text-white shadow-xl shadow-indigo-600/20 space-y-6">
            <div className="flex items-center gap-3">
              <Calculator className="w-6 h-6 opacity-50" />
              <h3 className="text-xl font-black">{t('divisors.summary')}</h3>
            </div>
            {stats ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-white/10 pb-4">
                  <span className="text-indigo-100 text-sm font-bold uppercase tracking-wider">{t('divisors.count')}</span>
                  <span className="text-2xl font-black font-mono">{stats.count}</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/10 pb-4">
                  <span className="text-indigo-100 text-sm font-bold uppercase tracking-wider">{t('divisors.sum')}</span>
                  <span className="text-2xl font-black font-mono">{stats.sum}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-indigo-100 text-sm font-bold uppercase tracking-wider">{t('divisors.proper_sum')}</span>
                  <span className="text-2xl font-black font-mono">{stats.properSum}</span>
                </div>
              </div>
            ) : (
              <p className="text-indigo-100 text-sm italic font-medium leading-relaxed">
                {t('divisors.waiting')}
              </p>
            )}
          </div>
        </div>
      </div>

      {stats && (
        <div className="p-8 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] space-y-6">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
              <List className="w-4 h-4 text-indigo-500" /> {t('divisors.list_title')}
            </div>
            <button
              onClick={() => handleCopy(stats.divisors.join(', '), 'list')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                copied === 'list'
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600'
                  : 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 hover:bg-indigo-100'
              }`}
            >
              {copied === 'list' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied === 'list' ? t('common.copied') : t('common.copy')}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {stats.divisors.map((d, i) => (
              <div
                key={i}
                className="px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 font-bold font-mono text-sm dark:text-slate-200 hover:border-indigo-500/30 transition-all"
              >
                {d}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info */}
      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <Info className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('divisors.about_title')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('divisors.about_text')}
          </p>
        </div>
      </div>
    </div>
  );
}
