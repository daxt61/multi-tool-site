import { useState, useEffect } from 'react';
import { Binary, Copy, Check, Trash2, Info, AlertCircle, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const MAX_LENGTH = 50000;

export function Base58Converter({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [input, setInput] = useState(initialData?.input || '');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<'encode' | 'decode'>(initialData?.mode || 'encode');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ input, mode });
  }, [input, mode, onStateChange]);

  const encode = (source: Uint8Array): string => {
    if (source.length === 0) return '';

    let x = BigInt(0);
    for (const b of source) {
      x = (x << 8n) + BigInt(b);
    }

    let result = '';
    while (x > 0n) {
      result = ALPHABET[Number(x % 58n)] + result;
      x /= 58n;
    }

    for (let i = 0; i < source.length && source[i] === 0; i++) {
      result = ALPHABET[0] + result;
    }

    return result;
  };

  const decode = (str: string): Uint8Array => {
    if (str.length === 0) return new Uint8Array(0);

    let x = BigInt(0);
    for (const char of str) {
      const value = ALPHABET.indexOf(char);
      if (value === -1) throw new Error('Invalid Base58 character: ' + char);
      x = x * 58n + BigInt(value);
    }

    const res = [];
    while (x > 0n) {
      res.push(Number(x & 0xffn));
      x >>= 8n;
    }

    for (let i = 0; i < str.length && str[i] === ALPHABET[0]; i++) {
      res.push(0);
    }

    return new Uint8Array(res.reverse());
  };

  useEffect(() => {
    if (!input) {
      setOutput('');
      setError(null);
      return;
    }
    try {
      setError(null);
      if (mode === 'encode') {
        const bytes = new TextEncoder().encode(input);
        setOutput(encode(bytes));
      } else {
        const decoded = decode(input);
        setOutput(new TextDecoder().decode(decoded));
      }
    } catch (e: any) {
      setError(e.message);
      setOutput('');
    }
  }, [input, mode]);

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    setError(null);
  };

  const handleSwap = () => {
    setMode(mode === 'encode' ? 'decode' : 'encode');
    setInput(output);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="flex justify-center">
        <div className="inline-flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setMode('encode')}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
              mode === 'encode'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-md'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            {t('base58.encode')}
          </button>
          <button
            onClick={() => setMode('decode')}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
              mode === 'decode'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-md'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            {t('base58.decode')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-5 space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="b58-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
              {mode === 'encode' ? t('common.input') : 'Base58'}
            </label>
            <button
              onClick={handleClear}
              disabled={!input}
              className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50"
            >
              <Trash2 className="w-3 h-3" /> {t('common.clear')}
            </button>
          </div>
          <textarea
            id="b58-input"
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, MAX_LENGTH))}
            placeholder={mode === 'encode' ? t('base64.placeholder_text') : 'Enter Base58 here...'}
            className="w-full h-64 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        <div className="lg:col-span-2 flex flex-col items-center justify-center gap-2">
          <button
            onClick={handleSwap}
            disabled={!output}
            className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-indigo-600/20 transition-all hover:scale-110 active:scale-95 disabled:opacity-50 group"
          >
            <RefreshCw className="w-6 h-6 group-hover:rotate-180 transition-transform duration-500" />
          </button>
        </div>

        <div className="lg:col-span-5 space-y-4">
          <div className="flex justify-between items-center px-1">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400">
              {mode === 'encode' ? 'Base58' : t('common.output')}
            </label>
            <button
              onClick={handleCopy}
              disabled={!output}
              className={`text-xs font-bold px-4 py-1.5 rounded-xl transition-all border flex items-center gap-2 ${
                copied
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                  : 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 border-transparent'
              } disabled:opacity-50`}
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? t('common.copied') : t('common.copy')}
            </button>
          </div>
          <div className="w-full h-64 p-6 bg-slate-900 text-indigo-300 border border-slate-800 rounded-[2.5rem] font-mono text-sm leading-relaxed overflow-y-auto break-all whitespace-pre-wrap">
            {output || <span className="text-slate-600 italic">{t('common.waiting')}</span>}
          </div>
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <Info className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">About Base58</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Base58 is a group of binary-to-text encoding schemes used to represent large integers as alphanumeric text. It is similar to Base64 but has been modified to avoid both non-alphanumeric characters and letters which might look ambiguous when printed (0, O, I, l). It is widely used in cryptocurrency platforms like Bitcoin for addresses.
          </p>
        </div>
      </div>
    </div>
  );
}
