import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Link as LinkIcon, Copy, Check, Info, Settings, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function SlugGenerator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState(initialData?.text || '');
  const [lowercase, setLowercase] = useState(initialData?.lowercase ?? true);
  const [removeAccents, setRemoveAccents] = useState(initialData?.removeAccents ?? true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ text, lowercase, removeAccents });
  }, [text, lowercase, removeAccents, onStateChange]);

  const slug = useMemo(() => {
    if (!text) return '';

    let result = text;

    if (removeAccents) {
      result = result.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    }

    if (lowercase) {
      result = result.toLowerCase();
    }

    // Replace spaces and special characters with hyphens
    result = result
      .replace(/[^a-z0-9]/gi, '-')
      .replace(/-+/g, '-')     // Remove consecutive hyphens
      .replace(/^-+|-+$/g, ''); // Remove leading and trailing hyphens

    return result;
  }, [text, lowercase, removeAccents]);

  const handleCopy = useCallback(() => {
    if (!slug) return;
    navigator.clipboard.writeText(slug);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [slug]);

  const handleClear = useCallback(() => {
    setText('');
    setCopied(false);
    inputRef.current?.focus();
  }, []);

  const handleCopyRef = useRef(handleCopy);
  const handleClearRef = useRef(handleClear);

  useEffect(() => {
    handleCopyRef.current = handleCopy;
    handleClearRef.current = handleClear;
  }, [handleCopy, handleClear]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInputFocused =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement instanceof HTMLSelectElement ||
        activeElement?.getAttribute("contenteditable") === "true";

      if (isInputFocused && e.key === "Escape") {
        e.preventDefault();
        handleClearRef.current();
        return;
      }

      if (isInputFocused) return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key === "Escape") {
        e.preventDefault();
        handleClearRef.current();
      } else if (e.key.toLowerCase() === "c") {
        e.preventDefault();
        handleCopyRef.current();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Display Area */}
      <div className="bg-slate-900 dark:bg-black p-8 md:p-12 rounded-[2.5rem] shadow-xl shadow-indigo-500/5 relative overflow-hidden group">
        <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
          <div className="flex-1 w-full text-center md:text-left">
            <div className="text-xs font-black uppercase tracking-widest text-white/30 mb-4 px-1">{t('slug.result_label')}</div>
            <div
              className={`text-2xl md:text-4xl font-mono text-white outline-none tracking-tight break-all selection:bg-indigo-500/30 ${!slug ? 'opacity-20 italic' : 'opacity-100'}`}
              aria-live="polite"
              aria-atomic="true"
            >
              {slug || t('slug.placeholder')}
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleCopy}
              disabled={!slug}
              title={`${t('common.copy')} (C)`}
              className={`px-8 py-4 rounded-2xl transition-all active:scale-95 flex items-center gap-2 font-black text-lg disabled:opacity-50 disabled:scale-100 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none group ${
                copied ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-white text-slate-900 hover:bg-slate-100'
              }`}
            >
              {copied ? <Check className="w-6 h-6" /> : <Copy className="w-6 h-6" />}
              <span>{copied ? t('common.copied') : t('common.copy')}</span>
              {!copied && (
                <kbd className="hidden sm:inline-flex items-center justify-center w-6 h-6 border rounded text-xs font-bold ml-1 transition-all bg-black/5 border-black/10 text-slate-400 group-hover:bg-black/10 dark:bg-white/5 dark:border-white/10 dark:text-slate-500 dark:group-hover:bg-white/10">C</kbd>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input area */}
        <section className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{t('slug.source_label')}</h3>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="hidden sm:inline-flex items-center justify-center px-1.5 py-0.5 border border-rose-200 dark:border-rose-800 rounded text-[10px] font-bold text-rose-400 bg-white dark:bg-slate-900">Esc</kbd>
              <button
                onClick={handleClear}
                disabled={!text}
                className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
              >
                <Trash2 className="w-3 h-3" /> {t('common.clear')}
              </button>
            </div>
          </div>
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.preventDefault();
                handleClear();
              }
            }}
            className="w-full h-48 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none font-medium dark:text-slate-300"
            placeholder={t('slug.input_placeholder')}
          />
        </section>

        {/* Settings & Info */}
        <div className="space-y-6">
          <section className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex items-center gap-2 px-1">
              <Settings className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{t('slug.options_label')}</h3>
            </div>
            <div className="space-y-3">
              {[
                { label: t('slug.lowercase_label'), state: lowercase, set: setLowercase },
                { label: t('slug.accents_label'), state: removeAccents, set: setRemoveAccents },
              ].map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => opt.set(!opt.state)}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
                    opt.state
                    ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                  }`}
                >
                  <span className="font-bold text-sm">{opt.label}</span>
                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                    opt.state ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 dark:border-slate-600'
                  }`}>
                    {opt.state && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="bg-white dark:bg-slate-900/40 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-2 px-1">
              <Info className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{t('slug.about_title')}</h3>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed px-1">
              {t('slug.about_text')}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
