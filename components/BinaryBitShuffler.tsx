import { useState, useEffect, useCallback, useRef } from 'react';
import { Shuffle, Copy, Check, Trash2, Binary, FileText, Info, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getSecureRandomInt } from './ui/crypto';

const MAX_BITS = 10000;

export function BinaryBitShuffler({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [input, setInput] = useState(initialData?.input || '');
  const [output, setOutput] = useState(initialData?.output || '');
  const [mode, setMode] = useState<'text' | 'binary'>(initialData?.mode || 'text');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ input, output, mode });
  }, [input, output, mode, onStateChange]);

  const shuffleArray = <T,>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = getSecureRandomInt(i + 1);
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  const handleShuffle = useCallback(() => {
    try {
      if (!input.trim()) return;

      let bits = '';
      if (mode === 'text') {
        bits = Array.from(new TextEncoder().encode(input))
          .map(byte => byte.toString(2).padStart(8, '0'))
          .join('');
      } else {
        if (!/^[01\s]+$/.test(input)) {
          throw new Error(t('bitcounter.error_invalid_binary'));
        }
        bits = input.replace(/\s/g, '');
      }

      if (bits.length > MAX_BITS) {
        throw new Error(t('error.max_length', { max: MAX_BITS.toLocaleString() }));
      }

      const bitArray = bits.split('');
      const shuffled = shuffleArray(bitArray).join('');

      // Group by 8 for readability
      const grouped = shuffled.match(/.{1,8}/g)?.join(' ') || shuffled;
      setOutput(grouped);
      setError('');
    } catch (e: any) {
      setError(e.message);
    }
  }, [input, mode, t]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [output]);

  const handleClear = useCallback(() => {
    setInput('');
    setOutput('');
    setError('');
    inputRef.current?.focus();
  }, []);

  const handleReset = useCallback(() => {
    handleClear();
  }, [handleClear]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInputFocused =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement?.getAttribute("contenteditable") === "true";

      if (isInputFocused && e.key !== 'Escape') return;

      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key === "Escape") {
        e.preventDefault();
        handleReset();
      } else if (e.key.toLowerCase() === "c") {
        e.preventDefault();
        handleCopy();
      } else if (e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleShuffle();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleReset, handleCopy, handleShuffle]);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-wrap gap-4 justify-center">
        {[
          { id: 'text', icon: FileText, label: t('bitshuffler.mode_text') },
          { id: 'binary', icon: Binary, label: t('bitshuffler.mode_binary') }
        ].map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id as any)}
            className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 border ${
              mode === m.id
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-indigo-500'
            }`}
          >
            <m.icon className="w-4 h-4" />
            {m.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400">
              {t('common.input')}
            </label>
            <div className="flex gap-2 items-center">
              <button
                onClick={handleClear}
                disabled={!input}
                className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 px-3 py-1.5 rounded-full transition-all disabled:opacity-50"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={mode === 'text' ? 'Enter text...' : '0101 1010...'}
            className="w-full h-64 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed resize-none"
          />
        </div>

        {/* Output */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400">
              {t('common.result')}
            </label>
            <button
              onClick={handleCopy}
              disabled={!output}
              className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all flex items-center gap-1 border ${
                copied
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 border-emerald-200'
                  : 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-transparent hover:bg-slate-200'
              } disabled:opacity-50`}
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? t('common.copied') : t('common.copy')}
            </button>
          </div>
          <textarea
            value={output}
            readOnly
            placeholder={t('common.waiting')}
            className="w-full h-64 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-mono text-sm leading-relaxed text-indigo-600 dark:text-indigo-400 resize-none"
          />
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 rounded-2xl text-rose-600 text-sm font-bold animate-in fade-in slide-in-from-top-2">
          {error}
        </div>
      )}

      <div className="flex justify-center pt-4">
        <button
          onClick={handleShuffle}
          disabled={!input.trim()}
          className="px-12 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xl shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-3 disabled:opacity-50"
        >
          <Shuffle className="w-6 h-6" />
          {t('random.shuffle')}
          <kbd className="hidden md:inline-flex items-center justify-center px-2 py-1 border border-white/20 rounded text-[10px] font-bold bg-white/10 ml-2">S</kbd>
        </button>
      </div>

      <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-12 pt-16 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Shuffle className="w-4 h-4 text-indigo-500" /> {t('bitshuffler.title')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('bitshuffler.desc')}
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" /> {t('bitshuffler.how_title')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('bitshuffler.how_desc')}
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-indigo-500" /> {t('common.reset')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('bitshuffler.reset_desc')}
          </p>
        </div>
      </div>
    </div>
  );
}
