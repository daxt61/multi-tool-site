import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Hash, Copy, Check, Trash2, Download, AlertCircle, RefreshCw, Settings2, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_RESULTS = 5000;

type Mode = 'range' | 'length';

export function PalindromicNumberGenerator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<Mode>(initialData?.mode || 'range');
  const [min, setMin] = useState(initialData?.min ?? 1);
  const [max, setMax] = useState(initialData?.max ?? 1000);
  const [length, setLength] = useState(initialData?.length ?? 3);
  const [quantity, setQuantity] = useState(initialData?.quantity ?? 10);
  const [separator, setSeparator] = useState(initialData?.separator || '\n');
  const [results, setResults] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onStateChange?.({ mode, min, max, length, quantity, separator });
  }, [mode, min, max, length, quantity, separator, onStateChange]);

  const isPalindrome = (n: string) => {
    return n === n.split('').reverse().join('');
  };

  const generateByRange = useCallback(() => {
    const list: string[] = [];
    const start = Math.min(min, max);
    const end = Math.max(min, max);

    for (let i = start; i <= end; i++) {
      const s = i.toString();
      if (isPalindrome(s)) {
        list.push(s);
      }
      if (list.length >= MAX_RESULTS) break;
    }
    setResults(list);
    if (list.length >= MAX_RESULTS) {
      setError(t('palindromic.limit_reached', { max: MAX_RESULTS }));
    } else {
      setError(null);
    }
  }, [min, max, t]);

  const generateByLength = useCallback(() => {
    if (length < 1 || length > 20) {
      setError(t('palindromic.error_length'));
      return;
    }

    const list: string[] = [];
    const halfLen = Math.ceil(length / 2);
    const minPrefix = Math.pow(10, halfLen - 1);
    const maxPrefix = Math.pow(10, halfLen) - 1;

    // We want 'quantity' results. We'll pick random prefixes and mirror them.
    const seen = new Set<string>();
    let attempts = 0;
    const maxAttempts = quantity * 10;

    while (list.length < quantity && attempts < maxAttempts) {
      attempts++;
      const prefix = Math.floor(Math.random() * (maxPrefix - minPrefix + 1)) + minPrefix;
      const s = prefix.toString();
      let p = s;

      if (length % 2 === 0) {
        p += s.split('').reverse().join('');
      } else {
        p += s.slice(0, -1).split('').reverse().join('');
      }

      if (!seen.has(p)) {
        seen.add(p);
        list.push(p);
      }
    }

    setResults(list.sort((a, b) => a.length - b.length || a.localeCompare(b)));
    setError(null);
  }, [length, quantity, t]);

  const handleGenerate = () => {
    if (mode === 'range') {
      generateByRange();
    } else {
      generateByLength();
    }
  };

  const handleCopy = () => {
    if (results.length === 0) return;
    navigator.clipboard.writeText(results.join(separator === '\\n' ? '\n' : separator));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (results.length === 0) return;
    const content = results.join(separator === '\\n' ? '\n' : separator);
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `palindromic-numbers-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Configuration */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
            <div className="flex items-center gap-2 px-1">
              <Settings2 className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{t('common.options')}</h3>
            </div>

            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setMode('range')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${mode === 'range' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {t('palindromic.mode_range')}
              </button>
              <button
                onClick={() => setMode('length')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${mode === 'length' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {t('palindromic.mode_length')}
              </button>
            </div>

            <div className="space-y-6">
              {mode === 'range' ? (
                <>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">{t('random.min')}</label>
                    <input
                      type="number"
                      value={min}
                      onChange={(e) => setMin(parseInt(e.target.value) || 0)}
                      className="w-full p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-2xl font-mono font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">{t('random.max')}</label>
                    <input
                      type="number"
                      value={max}
                      onChange={(e) => setMax(parseInt(e.target.value) || 0)}
                      className="w-full p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-2xl font-mono font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">{t('palindromic.digit_length')}</label>
                    <input
                      type="number"
                      min="1"
                      max="15"
                      value={length}
                      onChange={(e) => setLength(parseInt(e.target.value) || 1)}
                      className="w-full p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-2xl font-mono font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">{t('nanoid.quantity', { count: '' })}</label>
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                      className="w-full p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-2xl font-mono font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">{t('stringjoiner.separator')}</label>
                <select
                  value={separator}
                  onChange={(e) => setSeparator(e.target.value)}
                  className="w-full p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white appearance-none cursor-pointer"
                >
                  <option value="\n">{t('listcleaner.remove_empty_lines')} (New line)</option>
                  <option value=", ">Comma (, )</option>
                  <option value=" ">Space</option>
                  <option value=" | ">Pipe ( | )</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleGenerate}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-indigo-700 active:scale-95 transition-all shadow-lg shadow-indigo-600/20"
            >
              <RefreshCw className="w-5 h-5" />
              {t('random.generate')}
            </button>
          </div>
        </div>

        {/* Results Area */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
              <Hash className="w-4 h-4 text-indigo-500" /> {t('common.result')}
              {results.length > 0 && <span className="ml-2 lowercase font-medium opacity-70">({results.length} found)</span>}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                disabled={results.length === 0}
                className="text-xs font-bold px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-all disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={handleCopy}
                disabled={results.length === 0}
                className={`text-xs font-bold px-6 py-2 rounded-xl transition-all border flex items-center gap-2 ${
                  copied
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 border-emerald-200'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-indigo-600 hover:border-indigo-500/50'
                } disabled:opacity-50`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? t('common.copied') : t('common.copy')}
              </button>
              <button
                onClick={() => setResults([])}
                disabled={results.length === 0}
                className="p-2 text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 rounded-xl transition-all disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="relative h-[500px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] overflow-hidden">
            <div className="absolute inset-0 p-8 overflow-y-auto font-mono text-lg leading-relaxed dark:text-slate-300">
              {results.length > 0 ? (
                <div className="flex flex-wrap gap-x-6 gap-y-2">
                   {results.map((n, i) => (
                     <span key={i} className="hover:text-indigo-500 transition-colors cursor-default select-all">
                       {n}{i < results.length - 1 && separator !== '\\n' ? separator : (separator === '\\n' ? '\n' : '')}
                     </span>
                   ))}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-300 dark:text-slate-600 font-bold italic text-center">
                  {t('palindromic.waiting')}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <Info className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('palindromic.about_title')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('palindromic.about_text')}
          </p>
        </div>
      </div>
    </div>
  );
}
