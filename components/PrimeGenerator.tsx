import { useState, useEffect, useCallback, useRef } from 'react';
import { Hash, Copy, Check, RefreshCw, Trash2, Download, AlertCircle, Info, Settings2, Square } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_PRIMES = 10000;
const MAX_VALUE = 10000000;
const CHUNK_SIZE = 1000;

export function PrimeGenerator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [min, setMin] = useState(initialData?.min ?? 1);
  const [max, setMax] = useState(initialData?.max ?? 1000);
  const [count, setCount] = useState(initialData?.count ?? 100);
  const [mode, setMode] = useState<'range' | 'count'>(initialData?.mode ?? 'range');
  const [primes, setPrimes] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const isGeneratingRef = useRef(false);

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

  const generatePrimes = async () => {
    if (isGenerating) {
        isGeneratingRef.current = false;
        setIsGenerating(false);
        return;
    }

    setError(null);
    setIsGenerating(true);
    isGeneratingRef.current = true;
    const result: number[] = [];

    if (mode === 'range') {
      const start = Math.max(1, min);
      const end = Math.min(MAX_VALUE, max);

      if (start > end) {
        setError(t('prime.error_range'));
        setIsGenerating(false);
        isGeneratingRef.current = false;
        return;
      }

      for (let i = start; i <= end; i++) {
        if (!isGeneratingRef.current) break;
        if (isPrime(i)) {
          result.push(i);
        }
        if (result.length >= MAX_PRIMES) break;

        if (i % CHUNK_SIZE === 0) {
            setPrimes([...result]);
            await new Promise(resolve => setTimeout(resolve, 0));
        }
      }
    } else {
      let current = Math.max(1, min);
      const limit = Math.min(MAX_PRIMES, count);

      while (result.length < limit && current <= MAX_VALUE) {
        if (!isGeneratingRef.current) break;
        if (isPrime(current)) {
          result.push(current);
        }
        current++;

        if (current % CHUNK_SIZE === 0) {
            setPrimes([...result]);
            await new Promise(resolve => setTimeout(resolve, 0));
        }
      }
    }

    if (isGeneratingRef.current) {
        setPrimes(result);
    }
    setIsGenerating(false);
    isGeneratingRef.current = false;
  };

  const handleCopy = useCallback(() => {
    if (primes.length === 0) return;
    navigator.clipboard.writeText(primes.join(', '));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [primes]);

  const handleClear = useCallback(() => {
    isGeneratingRef.current = false;
    setIsGenerating(false);
    setPrimes([]);
    setError(null);
  }, []);

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

  // Keyboard shortcuts using the "latest ref" pattern
  const handlersRef = useRef({
    handleCopy,
    handleClear,
    generatePrimes,
    isGenerating
  });

  useEffect(() => {
    handlersRef.current = {
      handleCopy,
      handleClear,
      generatePrimes,
      isGenerating
    };
  }, [handleCopy, handleClear, generatePrimes, isGenerating]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isEditable =
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        document.activeElement?.tagName === "SELECT" ||
        document.activeElement?.getAttribute('contenteditable') === 'true';

      if (isEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        handlersRef.current.handleClear();
      } else if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handlersRef.current.handleCopy();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handlersRef.current.generatePrimes();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
                disabled={isGenerating}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${mode === 'range' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500'} disabled:opacity-50`}
              >
                {t('prime.mode_range')}
              </button>
              <button
                onClick={() => setMode('count')}
                aria-pressed={mode === 'count'}
                disabled={isGenerating}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${mode === 'count' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500'} disabled:opacity-50`}
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
                disabled={isGenerating}
                onChange={(e) => setMin(parseInt(e.target.value) || 0)}
                className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl font-black font-mono outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white disabled:opacity-50"
              />
            </div>
            {mode === 'range' ? (
              <div className="space-y-2">
                <label htmlFor="max-input" className="text-xs font-bold text-slate-400 px-1">{t('prime.max_val')}</label>
                <input
                  id="max-input"
                  type="number"
                  value={max}
                  disabled={isGenerating}
                  onChange={(e) => setMax(parseInt(e.target.value) || 0)}
                  className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl font-black font-mono outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white disabled:opacity-50"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <label htmlFor="count-input" className="text-xs font-bold text-slate-400 px-1">{t('prime.count')}</label>
                <input
                  id="count-input"
                  type="number"
                  value={count}
                  disabled={isGenerating}
                  onChange={(e) => setCount(parseInt(e.target.value) || 0)}
                  className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl font-black font-mono outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white disabled:opacity-50"
                />
              </div>
            )}
          </div>

          <button
            onClick={generatePrimes}
            className={`w-full h-16 rounded-2xl font-black text-lg transition-all shadow-lg active:scale-95 flex items-center justify-center gap-3 ${
                isGenerating
                ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-600/20'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20'
            }`}
          >
            {isGenerating ? <Square className="w-6 h-6 fill-current" /> : <RefreshCw className={`w-6 h-6 ${isGenerating ? 'animate-spin' : ''}`} />}
            {isGenerating ? t('common.stop') : t('prime.generate')}
            <kbd className={`hidden md:inline-flex items-center justify-center px-1.5 py-0.5 border rounded text-[10px] font-bold ml-1 transition-all ${
                isGenerating ? 'bg-white/10 border-white/20 text-white/70' : 'bg-black/10 border-black/20 text-white/70'
            }`}>Enter</kbd>
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
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? t('common.copied') : t('common.copy')}
                {!copied && <kbd className="hidden sm:inline-flex items-center justify-center w-4 h-4 border border-slate-200 dark:border-slate-700 rounded text-[10px] font-bold bg-white dark:bg-slate-900 ml-1">C</kbd>}
              </button>
              <button
                onClick={handleClear}
                disabled={primes.length === 0 && !isGenerating}
                className="text-xs font-bold px-3 py-1.5 rounded-xl text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 transition-all disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none group"
                title={`${t('common.clear')} (Esc)`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <kbd className="hidden sm:inline-flex items-center justify-center px-1.5 py-0.5 border border-rose-200 dark:border-rose-800 rounded text-[10px] font-bold text-rose-400 bg-white dark:bg-slate-900 ml-1 group-hover:bg-rose-50 transition-colors">Esc</kbd>
              </button>
            </div>
          </div>
          <div className="w-full h-[300px] p-6 bg-slate-900 dark:bg-black border border-slate-800 rounded-[2rem] overflow-y-auto font-mono text-sm leading-relaxed text-indigo-400 selection:bg-indigo-500/30 relative">
            {isGenerating && (
                <div className="absolute top-4 right-4 flex items-center gap-2 text-[10px] font-bold text-indigo-500/50 uppercase tracking-widest animate-pulse">
                    <RefreshCw className="w-3 h-3 animate-spin" /> {t('prime.generating')}
                </div>
            )}
            {primes.length > 0 ? (
              primes.join(', ')
            ) : (
              <span className="text-slate-600 italic">{isGenerating ? t('prime.generating') : t('prime.placeholder')}</span>
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
