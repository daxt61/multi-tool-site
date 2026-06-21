import { useState, useEffect, useCallback, useRef } from 'react';
import { Binary, Copy, Check, Trash2, ArrowLeftRight, Info, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const MAX_LENGTH = 100000;

export function Base32Converter({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [text, setText] = useState(initialData?.text || '');
  const [base32, setBase32] = useState(initialData?.base32 || '');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ text, base32 });
  }, [text, base32, onStateChange]);

  const encode = (input: string) => {
    setText(input);
    if (input.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
      return;
    }
    setError(null);
    try {
      const bytes = new TextEncoder().encode(input);
      let bits = 0;
      let value = 0;
      let output = '';

      for (let i = 0; i < bytes.length; i++) {
        value = (value << 8) | bytes[i];
        bits += 8;

        while (bits >= 5) {
          output += ALPHABET[(value >>> (bits - 5)) & 31];
          bits -= 5;
        }
      }

      if (bits > 0) {
        output += ALPHABET[(value << (5 - bits)) & 31];
      }

      while (output.length % 8 !== 0) {
        output += '=';
      }
      setBase32(output);
    } catch (e) {
      setError(t('error.invalid_encoding'));
    }
  };

  const decode = (input: string) => {
    setBase32(input);
    if (input.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
      return;
    }
    setError(null);
    try {
      const cleanInput = input.replace(/=+$/, '').toUpperCase();
      const bytes = [];
      let bits = 0;
      let value = 0;

      for (let i = 0; i < cleanInput.length; i++) {
        const idx = ALPHABET.indexOf(cleanInput[i]);
        if (idx === -1) throw new Error('Invalid character');

        value = (value << 5) | idx;
        bits += 5;

        if (bits >= 8) {
          bytes.push((value >>> (bits - 8)) & 255);
          bits -= 8;
        }
      }

      setText(new TextDecoder().decode(new Uint8Array(bytes)));
    } catch (e) {
      if (input.trim()) {
        setError(t('error.invalid_decoding'));
      } else {
        setText('');
      }
    }
  };

  const handleCopy = useCallback(() => {
    if (!base32) return;
    navigator.clipboard.writeText(base32);
    setCopied(true);
    toast.success(t('common.copied'));
    setTimeout(() => setCopied(false), 2000);
  }, [base32, t]);

  const handleClear = useCallback(() => {
    setText('');
    setBase32('');
    setError(null);
  }, []);

  const handleSwap = useCallback(() => {
    const oldText = text;
    setText(base32);
    setBase32(oldText);
    // Trigger re-conversion if possible or just clear
    setError(null);
  }, [text, base32]);

  const handleSwapRef = useRef(handleSwap);
  const handleCopyRef = useRef(handleCopy);
  const handleClearRef = useRef(handleClear);

  useEffect(() => {
    handleSwapRef.current = handleSwap;
    handleCopyRef.current = handleCopy;
    handleClearRef.current = handleClear;
  }, [handleSwap, handleCopy, handleClear]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInputFocused =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement instanceof HTMLSelectElement ||
        activeElement?.getAttribute("contenteditable") === "true";

      if (isInputFocused) return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key === "Escape") {
        e.preventDefault();
        handleClearRef.current();
      } else if (e.key.toLowerCase() === "c") {
        e.preventDefault();
        handleCopyRef.current();
      } else if (e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSwapRef.current();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-5 space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="input-text" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
              {t('common.input')}
            </label>
            <div className="flex gap-2 items-center">
              <kbd className="hidden sm:inline-flex items-center justify-center px-1.5 py-0.5 border border-rose-200 dark:border-rose-800 rounded text-[10px] font-bold text-rose-400 bg-white dark:bg-slate-900">Esc</kbd>
              <button
                onClick={handleClear}
                className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1 rounded-full transition-all flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
              >
                <Trash2 className="w-3 h-3" /> {t('common.clear')}
              </button>
            </div>
          </div>
          <textarea
            id="input-text"
            value={text}
            onChange={(e) => encode(e.target.value)}
            placeholder={t('stringescaper.placeholder_input')}
            className="w-full h-64 p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-lg leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        <div className="lg:col-span-2 flex flex-col items-center justify-center gap-2">
          <div className="bg-white dark:bg-slate-800 p-3 rounded-full shadow-xl border border-slate-200 dark:border-slate-700 text-indigo-600">
            <ArrowLeftRight className="w-6 h-6" />
          </div>
        </div>

        <div className="lg:col-span-5 space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="output-base32" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
              Base32
            </label>
            <button
              onClick={handleCopy}
              disabled={!base32}
              className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                copied
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                  : 'text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 border-transparent hover:bg-indigo-100 dark:hover:bg-indigo-500/20'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? t('common.copied') : t('common.copy')}
              {!copied && <kbd className="hidden sm:inline-flex items-center justify-center w-4 h-4 border border-slate-200 dark:border-slate-700 rounded text-[10px] font-bold bg-white/50 dark:bg-black/20 ml-1">C</kbd>}
            </button>
          </div>
          <textarea
            id="output-base32"
            value={base32}
            onChange={(e) => decode(e.target.value)}
            placeholder="Result will appear here..."
            className="w-full h-64 p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-lg leading-relaxed text-indigo-600 dark:text-indigo-400 resize-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-16 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" /> {t('base32.about_title')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('base32.about_text')}
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Check className="w-4 h-4 text-indigo-500" /> {t('common.privacy')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('common.privacy_desc')}
          </p>
        </div>
      </div>
    </div>
  );
}
