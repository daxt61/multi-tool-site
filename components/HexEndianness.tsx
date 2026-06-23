import { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeftRight, Copy, Check, Trash2, Download,
  Settings2, Binary, RefreshCw, Info, AlertCircle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_LENGTH = 100000;

export function HexEndianness({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [input, setInput] = useState(initialData?.input || '');
  const [wordSize, setWordSize] = useState<number>(initialData?.wordSize || 32);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onStateChange?.({ input, wordSize });
  }, [input, wordSize, onStateChange]);

  const output = useMemo(() => {
    if (!input.trim()) return '';
    if (input.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
      return '';
    }

    const hex = input.replace(/[^0-9A-Fa-f]/g, '');
    const bytesPerWord = wordSize / 8;
    const nibblesPerWord = bytesPerWord * 2;

    if (hex.length % nibblesPerWord !== 0) {
      setError(t('hex_endianness.error_invalid_length', { bits: wordSize, bytes: nibblesPerWord }));
      return '';
    }

    setError(null);
    let result = '';
    for (let i = 0; i < hex.length; i += nibblesPerWord) {
      const word = hex.substring(i, i + nibblesPerWord);
      // Reverse bytes in word
      const bytes = [];
      for (let j = 0; j < word.length; j += 2) {
        bytes.push(word.substring(j, j + 2));
      }
      result += bytes.reverse().join('');
    }

    // Format output with spaces for readability
    return result.match(/.{1,2}/g)?.join(' ') || '';
  }, [input, wordSize, t]);

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output.replace(/\s/g, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output.replace(/\s/g, '')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hex-endianness-${wordSize}.txt`;
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
        {/* Input Area */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="hex-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Binary className="w-4 h-4 text-indigo-500" /> {t('common.input')} (Hex)
            </label>
            <button
              onClick={() => setInput('')}
              className="text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors"
            >
              {t('common.clear')}
            </button>
          </div>
          <textarea
            id="hex-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. DE AD BE EF"
            className="w-full h-48 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-lg dark:text-slate-300 resize-none"
          />

          <div className="space-y-4 pt-4">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="hex-output" className="text-xs font-black uppercase tracking-widest text-slate-400">{t('common.output')}</label>
              <div className="flex gap-2">
                <button
                  onClick={handleDownload}
                  disabled={!output}
                  className="text-xs font-bold px-3 py-1.5 rounded-xl text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 transition-all disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleCopy}
                  disabled={!output}
                  className={`text-xs font-bold px-4 py-1.5 rounded-xl transition-all border flex items-center gap-2 ${
                    copied
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 border-emerald-200'
                      : 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-slate-200 dark:border-slate-700 hover:border-indigo-500/50'
                  } disabled:opacity-50`}
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? t('common.copied') : t('common.copy')}
                </button>
              </div>
            </div>
            <textarea
              id="hex-output"
              value={output}
              readOnly
              placeholder={t('common.waiting')}
              className="w-full h-48 p-6 bg-slate-900 text-indigo-300 border border-slate-800 rounded-3xl outline-none font-mono text-lg resize-none"
            />
          </div>
        </div>

        {/* Sidebar Tools */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-8 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2rem] space-y-6">
            <div className="flex items-center gap-2 text-indigo-500 px-1">
              <Settings2 className="w-4 h-4" />
              <h3 className="font-black uppercase tracking-widest text-[10px] text-slate-400">{t('common.options')}</h3>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block px-1">
                {t('hex_endianness.word_size')}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[8, 16, 32, 64].map((size) => (
                  <button
                    key={size}
                    onClick={() => setWordSize(size)}
                    className={`p-3 rounded-xl text-xs font-bold transition-all border ${
                      wordSize === size
                        ? 'bg-indigo-600 text-white border-transparent'
                        : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-indigo-500/50'
                    }`}
                  >
                    {size}-bit
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => { setInput(''); setError(null); }}
              className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all"
            >
              <RefreshCw className="w-4 h-4" /> {t('common.reset')}
            </button>
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-900/10 p-6 rounded-[2rem] border border-indigo-100 dark:border-indigo-900/20 flex gap-4">
            <Info className="w-6 h-6 text-indigo-600 shrink-0" />
            <div className="space-y-2">
              <h4 className="font-bold dark:text-white">{t('hex_endianness.about_title')}</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                {t('hex_endianness.about_text')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
