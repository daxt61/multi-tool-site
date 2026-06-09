import { useState, useEffect, useCallback } from 'react';
import { Type, Copy, Check, Trash2, Info, AlertCircle, ArrowLeftRight, Download, Hash } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_LENGTH = 100000;

export function ASCIIDecimalConverter({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [text, setText] = useState(initialData?.text || '');
  const [decimal, setDecimal] = useState(initialData?.decimal || '');
  const [separator, setSeparator] = useState(initialData?.separator || ' ');
  const [copied, setCopied] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onStateChange?.({ text, decimal, separator });
  }, [text, decimal, separator, onStateChange]);

  const encode = (input: string, sep: string) => {
    setText(input);
    if (input.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
      return;
    }
    setError(null);
    const encoded = Array.from(input).map(char => char.codePointAt(0)).join(sep);
    setDecimal(encoded);
  };

  const decode = (input: string, sep: string) => {
    setDecimal(input);
    if (input.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
      return;
    }
    setError(null);

    try {
      const parts = input.trim().split(sep === ' ' ? /\s+/ : sep).filter(Boolean);
      const decoded = parts.map(code => {
        const num = parseInt(code, 10);
        if (isNaN(num)) return '';
        try {
          return String.fromCodePoint(num);
        } catch {
          return '';
        }
      }).join('');
      setText(decoded);
    } catch (e) {
      setError(t('error.invalid_encoding'));
    }
  };

  const handleTextChange = (val: string) => {
    encode(val, separator);
  };

  const handleDecimalChange = (val: string) => {
    decode(val, separator);
  };

  const handleSeparatorChange = (newSep: string) => {
    setSeparator(newSep);
    encode(text, newSep);
  };

  const handleCopy = (val: string, id: string) => {
    if (!val) return;
    navigator.clipboard.writeText(val);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  };

  const handleClear = useCallback(() => {
    setText('');
    setDecimal('');
    setError(null);
  }, []);

  const handleDownload = (val: string, filename: string) => {
    if (!val) return;
    const blob = new Blob([val], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Text Input */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="ascii-text" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer flex items-center gap-2">
              <Type className="w-4 h-4 text-indigo-500" /> {t('common.input')} (Text)
            </label>
            <div className="flex gap-2 items-center">
              <button
                onClick={() => handleDownload(text, 'text')}
                disabled={!text}
                className="p-2 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg hover:bg-indigo-100 disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleClear}
                disabled={!text && !decimal}
                className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1 rounded-full transition-all flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
              >
                <Trash2 className="w-3 h-3" /> {t('common.clear')}
              </button>
            </div>
          </div>
          <textarea
            id="ascii-text"
            value={text}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder="Type something..."
            className="w-full h-64 p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-lg leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        {/* Decimal Input */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="decimal-output" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer flex items-center gap-2">
              <Hash className="w-4 h-4 text-indigo-500" /> {t('common.output')} (Decimal)
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => handleDownload(decimal, 'decimal')}
                disabled={!decimal}
                className="p-2 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg hover:bg-indigo-100 disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleCopy(decimal, 'dec')}
                disabled={!decimal}
                className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                  copied === 'dec'
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                    : 'text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 border-transparent hover:bg-indigo-100 dark:hover:bg-indigo-500/20'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {copied === 'dec' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied === 'dec' ? t('common.copied') : t('common.copy')}
              </button>
            </div>
          </div>
          <textarea
            id="decimal-output"
            value={decimal}
            onChange={(e) => handleDecimalChange(e.target.value)}
            placeholder="65 66 67..."
            className="w-full h-64 p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-lg leading-relaxed text-indigo-600 dark:text-indigo-400 resize-none"
          />
        </div>
      </div>

      <div className="flex justify-center">
         <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-4 shadow-sm">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400">{t('stringjoiner.separator')}</label>
            <div className="flex gap-2">
              {[
                { label: 'Space', val: ' ' },
                { label: 'Comma', val: ',' },
                { label: 'Dash', val: '-' },
                { label: 'None', val: '' }
              ].map(opt => (
                <button
                  key={opt.label}
                  onClick={() => handleSeparatorChange(opt.val)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${separator === opt.val ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-indigo-500'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
         </div>
      </div>

      {/* Info */}
      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <Info className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('asciidecimal.about_title')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('asciidecimal.about_text')}
          </p>
        </div>
      </div>
    </div>
  );
}
