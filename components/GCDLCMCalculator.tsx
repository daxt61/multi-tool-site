import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Calculator, Copy, Check, Trash2, Download, Hash, Info, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_LENGTH = 10000;

export function GCDLCMCalculator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { t } = useTranslation();
  const [input, setInput] = useState(initialData?.input || '24, 36, 48');
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onStateChange?.({ input });
  }, [input, onStateChange]);

  const numbers = useMemo(() => {
    if (!input || input.length > MAX_LENGTH) return [];
    const items = input.split(/[\n,;\s]+/).filter((item: string) => item.trim() !== '');
    try {
      const parsed = items.map((item: string) => BigInt(item.replace(/[^0-9-]/g, '')));
      return parsed.filter((n: bigint) => n !== 0n);
    } catch (e) {
      return [];
    }
  }, [input]);

  const gcd = useCallback((a: bigint, b: bigint): bigint => {
    a = a < 0n ? -a : a;
    b = b < 0n ? -b : b;
    while (b !== 0n) {
      a %= b;
      [a, b] = [b, a];
    }
    return a;
  }, []);

  const lcm = useCallback((a: bigint, b: bigint): bigint => {
    if (a === 0n || b === 0n) return 0n;
    const g = gcd(a, b);
    const res = (a * b) / g;
    return res < 0n ? -res : res;
  }, [gcd]);

  const results = useMemo(() => {
    if (numbers.length < 2) return null;

    try {
      let currentGcd = numbers[0];
      let currentLcm = numbers[0];

      for (let i = 1; i < numbers.length; i++) {
        currentGcd = gcd(currentGcd, numbers[i]);
        currentLcm = lcm(currentLcm, numbers[i]);
      }

      return {
        gcd: currentGcd.toString(),
        lcm: currentLcm.toString()
      };
    } catch (e) {
      console.error(e);
      return null;
    }
  }, [numbers, gcd, lcm]);

  const handleCopy = (val: string, id: string) => {
    navigator.clipboard.writeText(val);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleClear = useCallback(() => {
    setInput('');
    setError(null);
    inputRef.current?.focus();
  }, []);

  const handleDownload = useCallback(() => {
    if (!results) return;
    const content = `Numbers: ${input}\nGCD: ${results.gcd}\nLCM: ${results.lcm}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gcd-lcm-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [input, results]);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="num-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Hash className="w-4 h-4 text-indigo-500" /> {t('numstats.input_label')}
            </label>
            <button
              onClick={handleClear}
              disabled={!input}
              className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-rose-500 outline-none"
            >
              <Trash2 className="w-3.5 h-3.5" /> {t('common.clear')}
            </button>
          </div>
          <textarea
            id="num-input"
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              if (e.target.value.length > MAX_LENGTH) {
                setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
              } else {
                setError(null);
              }
            }}
            placeholder="24, 36, 48..."
            className="w-full h-48 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-xl font-mono dark:text-slate-300 resize-none"
          />
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div className="p-8 bg-indigo-600 rounded-[2rem] text-white shadow-xl shadow-indigo-600/20 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calculator className="w-6 h-6 opacity-50" />
                <h3 className="text-xl font-black">GCD & LCM</h3>
              </div>
              <button
                onClick={handleDownload}
                disabled={!results}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all disabled:opacity-30"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-1">
                <div className="flex justify-between items-center px-1">
                  <span className="text-indigo-100 text-[10px] font-black uppercase tracking-widest">GCD (PGCD)</span>
                  {results && (
                    <button
                      onClick={() => handleCopy(results.gcd, 'gcd')}
                      className={`p-1.5 rounded-lg transition-all ${copied === 'gcd' ? 'bg-emerald-500' : 'hover:bg-white/10'}`}
                    >
                      {copied === 'gcd' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
                <div className="text-2xl font-black font-mono break-all">
                  {results ? results.gcd : '--'}
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center px-1">
                  <span className="text-indigo-100 text-[10px] font-black uppercase tracking-widest">LCM (PPCM)</span>
                  {results && (
                    <button
                      onClick={() => handleCopy(results.lcm, 'lcm')}
                      className={`p-1.5 rounded-lg transition-all ${copied === 'lcm' ? 'bg-emerald-500' : 'hover:bg-white/10'}`}
                    >
                      {copied === 'lcm' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
                <div className="text-2xl font-black font-mono break-all">
                  {results ? results.lcm : '--'}
                </div>
              </div>
            </div>

            {!results && (
              <p className="text-indigo-100 text-xs italic font-medium leading-relaxed">
                {t('numstats.waiting', 'Enter at least two numbers to see results.')}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <Info className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">Greatest Common Divisor & Least Common Multiple</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            The **Greatest Common Divisor (GCD)** is the largest positive integer that divides each of the integers.
            The **Least Common Multiple (LCM)** is the smallest positive integer that is divisible by each of the integers.
            This tool uses `BigInt` to support numbers of any size without losing precision.
          </p>
        </div>
      </div>
    </div>
  );
}
