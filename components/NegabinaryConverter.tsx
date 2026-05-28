import { useState, useMemo, useEffect, useCallback } from 'react';
import { Hash, RefreshCw, Copy, Check, Trash2, Download, AlertCircle, Settings2, Info, ArrowRightLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function NegabinaryConverter({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [decimal, setDecimal] = useState(initialData?.decimal || '');
  const [negabinary, setNegabinary] = useState(initialData?.negabinary || '');
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onStateChange?.({ decimal, negabinary });
  }, [decimal, negabinary, onStateChange]);

  const toNegabinary = useCallback((decStr: string) => {
    try {
      if (!decStr) return '';
      let n = BigInt(decStr);
      if (n === 0n) return '0';

      let result = '';
      while (n !== 0n) {
        let remainder = n % -2n;
        n = n / -2n;

        if (remainder < 0n) {
          remainder += 2n;
          n += 1n;
        }
        result = remainder.toString() + result;
      }
      return result;
    } catch (e) {
      return '';
    }
  }, []);

  const fromNegabinary = useCallback((negaStr: string) => {
    try {
      if (!negaStr) return '';
      if (!/^[01]+$/.test(negaStr)) throw new Error('Invalid negabinary');

      let result = 0n;
      let base = 1n;
      for (let i = negaStr.length - 1; i >= 0; i--) {
        if (negaStr[i] === '1') {
          result += base;
        }
        base *= -2n;
      }
      return result.toString();
    } catch (e) {
      return '';
    }
  }, []);

  const handleDecimalChange = (val: string) => {
    setDecimal(val);
    setError(null);
    if (val === '-' || val === '') {
        setNegabinary('');
        return;
    }
    try {
      const nega = toNegabinary(val);
      setNegabinary(nega);
    } catch (e) {
      setError('Invalid decimal number');
    }
  };

  const handleNegabinaryChange = (val: string) => {
    const cleanVal = val.replace(/[^01]/g, '');
    setNegabinary(cleanVal);
    setError(null);
    if (!cleanVal) {
      setDecimal('');
      return;
    }
    const dec = fromNegabinary(cleanVal);
    setDecimal(dec);
  };

  const handleCopy = (text: string, id: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
        {/* Decimal Input */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="dec-input" className="text-xs font-black uppercase tracking-widest text-slate-400">
              {t('numberconverter.dec', 'Decimal (Base 10)')}
            </label>
            <button
              onClick={() => handleCopy(decimal, 'dec')}
              className={`p-2 rounded-xl transition-all ${copied === 'dec' ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10' : 'text-slate-400 hover:text-indigo-500'}`}
            >
              {copied === 'dec' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <input
            id="dec-input"
            type="text"
            value={decimal}
            onChange={(e) => handleDecimalChange(e.target.value)}
            placeholder="e.g. 42"
            className="w-full p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-xl dark:text-white"
          />
        </div>

        {/* Separator / Switch Icon */}
        <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="p-3 bg-white dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 shadow-xl text-indigo-500">
            <ArrowRightLeft className="w-5 h-5" />
          </div>
        </div>

        {/* Negabinary Input */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="nega-input" className="text-xs font-black uppercase tracking-widest text-slate-400">
               Negabinary (Base -2)
            </label>
            <button
              onClick={() => handleCopy(negabinary, 'nega')}
              className={`p-2 rounded-xl transition-all ${copied === 'nega' ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10' : 'text-slate-400 hover:text-indigo-500'}`}
            >
              {copied === 'nega' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <input
            id="nega-input"
            type="text"
            value={negabinary}
            onChange={(e) => handleNegabinaryChange(e.target.value)}
            placeholder="e.g. 110110"
            className="w-full p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-xl dark:text-white tracking-widest"
          />
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={() => { setDecimal(''); setNegabinary(''); setError(null); }}
          className="flex items-center gap-2 px-6 py-3 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-2xl font-bold hover:bg-rose-100 transition-all"
        >
          <Trash2 className="w-4 h-4" /> {t('common.clear')}
        </button>
      </div>

      {/* Info Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white dark:bg-slate-800 text-indigo-600 rounded-xl shadow-sm">
              <Info className="w-5 h-5" />
            </div>
            <h4 className="font-bold dark:text-white">{t('negabinary.about_title')}</h4>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('negabinary.about_text')}
          </p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-4">
          <h4 className="font-bold dark:text-white">{t('negabinary.examples_title')}</h4>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="text-slate-400">{t('negabinary.examples_decimal')} 1</div><div className="dark:text-indigo-300 font-bold">1</div>
            <div className="text-slate-400">{t('negabinary.examples_decimal')} 2</div><div className="dark:text-indigo-300 font-bold">110</div>
            <div className="text-slate-400">{t('negabinary.examples_decimal')} -1</div><div className="dark:text-indigo-300 font-bold">11</div>
            <div className="text-slate-400">{t('negabinary.examples_decimal')} -2</div><div className="dark:text-indigo-300 font-bold">10</div>
          </div>
        </div>
      </div>
    </div>
  );
}
