import { useState, useEffect, useCallback } from 'react';
import { Type, Copy, Check, Trash2, AlertCircle, RefreshCw, Info, Hash } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_LENGTH = 10000;

export function TextToOctal({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [text, setText] = useState(initialData?.text || '');
  const [octal, setOctal] = useState(initialData?.octal || '');
  const [separator, setSeparator] = useState(initialData?.separator || ' ');
  const [error, setError] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState(false);
  const [copiedOctal, setCopiedOctal] = useState(false);

  useEffect(() => {
    onStateChange?.({ text, octal, separator });
  }, [text, octal, separator, onStateChange]);

  const convertToOctal = useCallback((input: string) => {
    try {
      const result = Array.from(input)
        .map(char => char.charCodeAt(0).toString(8).padStart(3, '0'))
        .join(separator);
      setOctal(result);
      setError(null);
    } catch (err) {
      setError('Conversion error');
    }
  }, [separator]);

  const convertToText = useCallback((input: string) => {
    try {
      const parts = separator === '' ? input.match(/.{1,3}/g) || [] : input.split(separator);
      const result = parts
        .filter(part => part.trim().length > 0)
        .map(part => String.fromCharCode(parseInt(part, 8)))
        .join('');
      setText(result);
      setError(null);
    } catch (err) {
      setError('Invalid octal format');
    }
  }, [separator]);

  const handleTextChange = (val: string) => {
    if (val.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
      return;
    }
    setText(val);
    convertToOctal(val);
  };

  const handleOctalChange = (val: string) => {
    if (val.length > MAX_LENGTH * 4) {
      setError(t('error.max_length', { max: (MAX_LENGTH * 4).toLocaleString() }));
      return;
    }
    setOctal(val);
    convertToText(val);
  };

  const handleCopy = (val: string, setCopied: (v: boolean) => void) => {
    if (!val) return;
    navigator.clipboard.writeText(val);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setText('');
    setOctal('');
    setError(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="flex justify-center">
        <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-2xl border border-slate-200 dark:border-slate-800">
           <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">Separator</label>
           <div className="flex gap-1">
             {[
               { id: 'space', label: 'Space', val: ' ' },
               { id: 'none', label: 'None', val: '' },
               { id: 'comma', label: ',', val: ',' },
               { id: 'dash', label: '-', val: '-' },
             ].map(opt => (
               <button
                 key={opt.id}
                 onClick={() => setSeparator(opt.val)}
                 className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                   separator === opt.val
                     ? 'bg-indigo-600 text-white shadow-sm'
                     : 'text-slate-500 hover:bg-white dark:hover:bg-slate-800'
                 }`}
               >
                 {opt.label}
               </button>
             ))}
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Type className="w-4 h-4 text-indigo-500" />
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">Plain Text</span>
            </div>
            <button
              onClick={() => handleCopy(text, setCopiedText)}
              className={`text-xs font-bold px-3 py-1 rounded-lg transition-all ${
                copiedText ? 'text-emerald-500' : 'text-slate-400 hover:text-indigo-500'
              }`}
            >
              {copiedText ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
          <textarea
            value={text}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder="Enter text..."
            className="w-full h-64 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-lg leading-relaxed dark:text-slate-300 resize-none shadow-sm"
          />
        </div>

        <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-indigo-600 text-white rounded-full items-center justify-center shadow-lg">
           <RefreshCw className="w-5 h-5" />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">Octal</span>
            </div>
            <button
              onClick={() => handleCopy(octal, setCopiedOctal)}
              className={`text-xs font-bold px-3 py-1 rounded-lg transition-all ${
                copiedOctal ? 'text-emerald-500' : 'text-slate-400 hover:text-indigo-500'
              }`}
            >
              {copiedOctal ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
          <textarea
            value={octal}
            onChange={(e) => handleOctalChange(e.target.value)}
            placeholder="010 020 030..."
            className="w-full h-64 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-mono text-sm leading-relaxed text-indigo-600 dark:text-indigo-400 resize-none shadow-inner"
          />
        </div>
      </div>

      <div className="flex justify-center pt-4">
         <button
           onClick={handleClear}
           disabled={!text && !octal}
           className="flex items-center gap-2 px-6 py-3 bg-rose-50 dark:bg-rose-500/10 text-rose-600 rounded-2xl font-bold hover:bg-rose-100 transition-all disabled:opacity-50"
         >
           <Trash2 className="w-4 h-4" /> {t('common.clear')}
         </button>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <Info className="w-6 h-6 text-indigo-500 mt-1 shrink-0" />
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">About Octal Representation</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            The octal numeral system, or base 8, uses digits 0 through 7. While less common today than hexadecimal, octal was widely used in early computing and is still found in Unix file permissions. This tool converts each character's ASCII/Unicode code point into its 3-digit octal equivalent.
          </p>
        </div>
      </div>
    </div>
  );
}
