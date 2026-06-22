import { useState, useEffect, useCallback, useRef } from 'react';
import { Copy, Check, Trash2, ArrowLeftRight, Hash, Info, AlertCircle, Download, Binary } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_LENGTH = 1000;

export function ScientificNotationConverter({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [decimalInput, setDecimalInput] = useState(initialData?.decimalInput || '');
  const [scientificInput, setScientificInput] = useState(initialData?.scientificInput || '');
  const [precision, setPrecision] = useState(initialData?.precision ?? 4);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<'decimal' | 'scientific' | null>(null);

  useEffect(() => {
    onStateChange?.({ decimalInput, scientificInput, precision });
  }, [decimalInput, scientificInput, precision, onStateChange]);

  const toScientific = useCallback((val: string) => {
    try {
      setError('');
      if (!val.trim()) {
        setScientificInput('');
        return;
      }

      const num = parseFloat(val);
      if (isNaN(num)) {
        setError(t('romannumeral.error_invalid_number'));
        return;
      }

      setScientificInput(num.toExponential(precision));
    } catch (e) {
      setError(t('error.invalid_decoding'));
    }
  }, [precision, t]);

  const toDecimal = useCallback((val: string) => {
    try {
      setError('');
      if (!val.trim()) {
        setDecimalInput('');
        return;
      }

      // Check if it's a valid scientific notation (e.g., 1.23e+4)
      if (!/^-?\d+(\.\d+)?[eE][+-]?\d+$/.test(val.trim()) && isNaN(Number(val))) {
        setError(t('scientific.error_invalid_notation', 'Invalid scientific notation'));
        return;
      }

      const num = Number(val);
      if (isNaN(num)) {
        setError(t('romannumeral.error_invalid_number'));
        return;
      }

      // To avoid scientific notation in the decimal output for very large/small numbers
      setDecimalInput(num.toLocaleString('fullwide', { useGrouping: false, maximumFractionDigits: 20 }));
    } catch (e) {
      setError(t('error.invalid_decoding'));
    }
  }, [t]);

  const handleDecimalChange = (val: string) => {
    setDecimalInput(val);
    toScientific(val);
  };

  const handleScientificChange = (val: string) => {
    setScientificInput(val);
    toDecimal(val);
  };

  const copyToClipboard = (text: string, type: 'decimal' | 'scientific') => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleClear = () => {
    setDecimalInput('');
    setScientificInput('');
    setError('');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Decimal Section */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-indigo-500" />
              <label htmlFor="decimal-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">{t('numberconverter.dec')}</label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => copyToClipboard(decimalInput, 'decimal')}
                disabled={!decimalInput}
                className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all flex items-center gap-1 ${
                  copied === 'decimal'
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20'
                } disabled:opacity-50`}
              >
                {copied === 'decimal' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied === 'decimal' ? t('common.copied') : t('common.copy')}
              </button>
            </div>
          </div>
          <input
            id="decimal-input"
            type="text"
            value={decimalInput}
            onChange={(e) => handleDecimalChange(e.target.value)}
            placeholder="1234567.89"
            className="w-full p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-xl dark:text-white"
          />
        </div>

        {/* Controls */}
        <div className="lg:col-span-2 space-y-6 pt-4">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between px-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Precision</label>
              <span className="text-xs font-bold text-indigo-500 font-mono">{precision}</span>
            </div>
            <input
              type="range"
              min="0"
              max="20"
              value={precision}
              onChange={(e) => {
                const p = parseInt(e.target.value);
                setPrecision(p);
                if (decimalInput) toScientific(decimalInput);
              }}
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>

          <button
            onClick={handleClear}
            className="w-full py-3 text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all"
          >
            <Trash2 className="w-4 h-4" /> {t('common.clear')}
          </button>
        </div>

        {/* Scientific Section */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Binary className="w-4 h-4 text-indigo-500" />
              <label htmlFor="scientific-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">{t('scientific.notation', 'Scientific Notation')}</label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => copyToClipboard(scientificInput, 'scientific')}
                disabled={!scientificInput}
                className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all flex items-center gap-1 ${
                  copied === 'scientific'
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20'
                } disabled:opacity-50`}
              >
                {copied === 'scientific' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied === 'scientific' ? t('common.copied') : t('common.copy')}
              </button>
            </div>
          </div>
          <input
            id="scientific-input"
            type="text"
            value={scientificInput}
            onChange={(e) => handleScientificChange(e.target.value)}
            placeholder="1.234e+6"
            className="w-full p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-xl dark:text-white"
          />
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <Info className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('scientific.about_title', 'About Scientific Notation')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('scientific.about_text', 'Scientific notation is a way of expressing numbers that are too large or too small to be conveniently written in decimal form. It is commonly used by scientists, mathematicians, and engineers. This tool allows you to convert any decimal number into scientific notation (E-notation) and vice-versa, with adjustable decimal precision.')}
          </p>
        </div>
      </div>
    </div>
  );
}
