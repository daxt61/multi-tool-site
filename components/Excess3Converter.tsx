import { useState, useEffect, useCallback, useRef } from 'react';
import { Binary, Copy, Check, Trash2, ArrowRightLeft, Info, AlertCircle, Download, Hash } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 10000;

export function Excess3Converter({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [decimal, setDecimal] = useState(initialData?.decimal || '');
  const [excess3, setExcess3] = useState(initialData?.excess3 || '');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<'decimal' | 'excess3' | null>(null);

  useEffect(() => {
    onStateChange?.({ decimal, excess3 });
  }, [decimal, excess3, onStateChange]);

  const decimalToExcess3 = useCallback((dec: string) => {
    if (!dec.trim()) return '';
    if (!/^\d+$/.test(dec.trim())) {
      setError(t('excess3.error_invalid_decimal', 'Invalid decimal input. Only positive integers are allowed.'));
      return '';
    }
    setError(null);
    return dec.trim().split('').map(digit => {
      return (parseInt(digit) + 3).toString(2).padStart(4, '0');
    }).join(' ');
  }, [t]);

  const excess3ToDecimal = useCallback((ex3Str: string) => {
    const cleanEx3 = ex3Str.replace(/\s+/g, '');
    if (!cleanEx3) return '';
    if (!/^[01]+$/.test(cleanEx3) || cleanEx3.length % 4 !== 0) {
      setError(t('excess3.error_invalid_excess3', 'Invalid Excess-3 input. Must be groups of 4 bits (0 or 1).'));
      return '';
    }

    let result = '';
    for (let i = 0; i < cleanEx3.length; i += 4) {
      const nibble = cleanEx3.slice(i, i + 4);
      const digit = parseInt(nibble, 2) - 3;
      if (digit < 0 || digit > 9) {
        setError(t('excess3.error_invalid_nibble', 'Invalid Excess-3 nibble: {{nibble}} does not represent a valid digit (0-9).', { nibble }));
        return '';
      }
      result += digit.toString();
    }
    setError(null);
    return result;
  }, [t]);

  const handleDecimalChange = (val: string) => {
    setDecimal(val);
    if (val.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
      return;
    }
    setExcess3(decimalToExcess3(val));
  };

  const handleExcess3Change = (val: string) => {
    setExcess3(val);
    if (val.length > MAX_LENGTH * 5) {
      setError(t('error.max_length', { max: (MAX_LENGTH * 5).toLocaleString() }));
      return;
    }
    setDecimal(excess3ToDecimal(val));
  };

  const handleCopy = useCallback((text: string, type: 'decimal' | 'excess3') => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  const handleClear = useCallback(() => {
    setDecimal('');
    setExcess3('');
    setError(null);
  }, []);

  const handleDownload = (text: string, filename: string) => {
    if (!text) return;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlersRef = useRef({ handleClear });
  useEffect(() => {
    handlersRef.current = { handleClear };
  }, [handleClear]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        document.activeElement?.getAttribute('contenteditable') === 'true'
      ) {
        if (e.key === 'Escape') {
          e.preventDefault();
          handlersRef.current.handleClear();
        }
        return;
      }

      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        handlersRef.current.handleClear();
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Decimal Input */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-indigo-500" />
              <label htmlFor="decimal-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">{t('excess3.decimal_label', 'Decimal')}</label>
            </div>
            <div className="flex gap-2 items-center">
              <Kbd modifier={null} className="hidden sm:inline-flex border-rose-200 dark:border-rose-800 text-rose-400">Esc</Kbd>
              <button
                onClick={handleClear}
                disabled={!decimal && !excess3}
                className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 px-3 py-1.5 rounded-xl transition-all disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-rose-500 outline-none"
              >
                <Trash2 className="w-3.5 h-3.5" /> {t('common.clear')}
              </button>
            </div>
          </div>
          <div className="relative">
            <textarea
              id="decimal-input"
              value={decimal}
              onChange={(e) => handleDecimalChange(e.target.value)}
              placeholder="123"
              className="w-full h-64 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-xl dark:text-slate-300 resize-none"
            />
            <div className="absolute bottom-4 right-4 flex gap-2">
              <button
                onClick={() => handleDownload(decimal, 'decimal')}
                disabled={!decimal}
                className="p-2 text-slate-400 hover:text-indigo-500 transition-colors disabled:opacity-50"
                title={t('common.download')}
              >
                <Download className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleCopy(decimal, 'decimal')}
                disabled={!decimal}
                className={`p-2 rounded-xl transition-all ${
                  copied === 'decimal'
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600'
                    : 'text-slate-400 hover:text-indigo-500'
                }`}
              >
                {copied === 'decimal' ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Excess-3 Input */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Binary className="w-4 h-4 text-emerald-500" />
              <label htmlFor="excess3-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">{t('excess3.excess3_label', 'Excess-3')}</label>
            </div>
          </div>
          <div className="relative">
            <textarea
              id="excess3-input"
              value={excess3}
              onChange={(e) => handleExcess3Change(e.target.value)}
              placeholder="0100 0101 0110"
              className="w-full h-64 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-xl text-indigo-600 dark:text-indigo-400 resize-none"
            />
            <div className="absolute bottom-4 right-4 flex gap-2">
              <button
                onClick={() => handleDownload(excess3, 'excess3')}
                disabled={!excess3}
                className="p-2 text-slate-400 hover:text-indigo-500 transition-colors disabled:opacity-50"
                title={t('common.download')}
              >
                <Download className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleCopy(excess3, 'excess3')}
                disabled={!excess3}
                className={`p-2 rounded-xl transition-all ${
                  copied === 'excess3'
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600'
                    : 'text-slate-400 hover:text-indigo-500'
                }`}
              >
                {copied === 'excess3' ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <Info className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('excess3.about_title', 'About Excess-3 Code')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('excess3.about_text', 'Excess-3 code (also called XS-3, 3-excess code or Stibitz code) is a non-weighted BCD code. It is obtained by adding 3 to each decimal digit and then representing the sum as a 4-bit binary number. It is a self-complementing code.')}
          </p>
        </div>
      </div>
    </div>
  );
}
