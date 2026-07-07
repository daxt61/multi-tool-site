import { useState, useMemo, useDeferredValue, useEffect, useCallback, useRef } from 'react';
import { Copy, Check, Trash2, Type, Info, MessageSquare, Volume2, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Kbd } from './ui/Kbd';

const NATO_ALPHABET: Record<string, string> = {
  'A': 'Alfa', 'B': 'Bravo', 'C': 'Charlie', 'D': 'Delta', 'E': 'Echo',
  'F': 'Foxtrot', 'G': 'Golf', 'H': 'Hotel', 'I': 'India', 'J': 'Juliett',
  'K': 'Kilo', 'L': 'Lima', 'M': 'Mike', 'N': 'November', 'O': 'Oscar',
  'P': 'Papa', 'Q': 'Quebec', 'R': 'Romeo', 'S': 'Sierra', 'T': 'Tango',
  'U': 'Uniform', 'V': 'Victor', 'W': 'Whiskey', 'X': 'X-ray', 'Y': 'Yankee',
  'Z': 'Zulu',
  '0': 'Zero', '1': 'One', '2': 'Two', '3': 'Three', '4': 'Four',
  '5': 'Five', '6': 'Six', '7': 'Seven', '8': 'Eight', '9': 'Nine',
  '.': 'Stop', ',': 'Comma', '?': 'Interrogative', '!': 'Exclamation',
  '-': 'Dash', '/': 'Slant', '(': 'Brackets on', ')': 'Brackets off',
  '@': 'At', '&': 'And', '+': 'Plus', '=': 'Equals'
};

export function NatoPhoneticTranslator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [text, setText] = useState(initialData?.text || '');
  const [copied, setCopied] = useState(false);
  const deferredText = useDeferredValue(text);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    onStateChange?.({ text });
  }, [text, onStateChange]);

  const phoneticOutput = useMemo(() => {
    return deferredText
      .toUpperCase()
      .split('')
      .map((char: string) => NATO_ALPHABET[char] || (char === ' ' ? '•' : char))
      .filter((val: string) => val !== '')
      .join(' ');
  }, [deferredText]);

  const handleCopy = useCallback(() => {
    if (!phoneticOutput) return;
    navigator.clipboard.writeText(phoneticOutput.replace(/•/g, ' '));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [phoneticOutput]);

  const handleClear = useCallback(() => {
    setText('');
    setCopied(false);
    setTimeout(() => textareaRef.current?.focus(), 0);
  }, []);

  const handleDownload = useCallback(() => {
    if (!phoneticOutput) return;
    const blob = new Blob([phoneticOutput.replace(/•/g, ' ')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `nato-phonetic-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }, [phoneticOutput]);

  const handlersRef = useRef({ handleClear, handleCopy });
  useEffect(() => {
    handlersRef.current = { handleClear, handleCopy };
  }, [handleClear, handleCopy]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInputFocused =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement instanceof HTMLSelectElement ||
        activeElement?.getAttribute("contenteditable") === "true";

      if (isInputFocused && e.key !== 'Escape') return;

      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key === "Escape") {
        e.preventDefault();
        handlersRef.current.handleClear();
      } else if (e.key.toLowerCase() === "c") {
        if (!isInputFocused || activeElement === textareaRef.current) {
          e.preventDefault();
          handlersRef.current.handleCopy();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <label htmlFor="nato-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
            {t('nato.input_label')}
          </label>
          <div className="flex gap-2 items-center">
            <Kbd modifier={null} className="hidden sm:inline-flex border-rose-200 dark:border-rose-800 text-rose-400">Esc</Kbd>
            <button
              onClick={handleClear}
              disabled={!text}
              className="text-xs font-bold px-3 py-1.5 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
            >
              <Trash2 className="w-3 h-3" /> {t('common.clear')}
            </button>
          </div>
        </div>
        <textarea
          id="nato-input"
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('nato.placeholder')}
          className="w-full h-32 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-xl font-bold dark:text-slate-300"
        />
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-indigo-500" /> {t('nato.output_label')}
          </h3>
          <div className="flex gap-2">
            {phoneticOutput && (
              <>
                <button
                  onClick={handleDownload}
                  className="text-xs font-bold px-3 py-1.5 rounded-full text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-all flex items-center gap-1.5 border border-indigo-100 dark:border-indigo-900/30 focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none"
                >
                  <Download className="w-3.5 h-3.5" /> {t('common.download')}
                </button>
                <button
                  onClick={handleCopy}
                  className={`text-xs font-bold px-4 py-1.5 rounded-full transition-all flex items-center gap-2 border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                    copied
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                      : 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700'
                  }`}
                  title={`${t('common.copy')} (C)`}
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? t('common.copied') : t('common.copy')}
                  {!copied && <Kbd modifier={null} className="hidden sm:inline-flex border-white/20 bg-white/10 text-white">C</Kbd>}
                </button>
              </>
            )}
          </div>
        </div>

        <div className="min-h-48 p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-sm flex flex-wrap gap-x-4 gap-y-3 items-center justify-center text-center" aria-live="polite">
          {text.trim() === '' ? (
            <div className="text-slate-300 dark:text-slate-700 font-black italic text-xl">
              {t('nato.waiting')}
            </div>
          ) : (
            phoneticOutput.split(' ').map((word: string, i: number) => (
              <span
                key={i}
                className={`text-xl md:text-2xl font-black transition-all animate-in zoom-in-95 duration-300 ${
                  word === '•'
                    ? 'text-slate-200 dark:text-slate-800 px-4'
                    : 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-4 py-2 rounded-2xl border border-indigo-100 dark:border-indigo-900/30'
                }`}
                style={{ animationDelay: `${i * 20}ms` }}
              >
                {word}
              </span>
            ))
          )}
        </div>
      </div>

      {/* Educational Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-600">
            <MessageSquare className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black">{t('nato.about_title')}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('nato.about_text')}
          </p>
        </div>

        <div className="space-y-4">
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center text-emerald-600">
            <Type className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black">{t('nato.universality_title')}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('nato.universality_text')}
          </p>
        </div>

        <div className="space-y-4">
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center text-amber-600">
            <Info className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black">{t('nato.usage_title')}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('nato.usage_text')}
          </p>
        </div>
      </div>
    </div>
  );
}
