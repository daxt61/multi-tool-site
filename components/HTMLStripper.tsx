import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Type, Copy, Check, FileText, Download, Info, RotateCcw, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

const MAX_LENGTH = 100000;

export function HTMLStripper({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState(initialData?.input || '');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ input });
  }, [input, onStateChange]);

  const isTooLong = input.length > MAX_LENGTH;

  const output = useMemo(() => {
    if (!input || isTooLong) return '';

    // Create a temporary element to let the browser handle HTML decoding/stripping safely
    const doc = new DOMParser().parseFromString(input, 'text/html');

    // Remove scripts and style tags to prevent code leakage/execution context pollution
    const scripts = doc.querySelectorAll('script');
    scripts.forEach(el => el.remove());

    const styles = doc.querySelectorAll('style');
    styles.forEach(el => el.remove());

    return doc.body.textContent || '';
  }, [input, isTooLong]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success(t('htmlstripper.copy_success'));
    setTimeout(() => setCopied(false), 2000);
  }, [output, t]);

  const handleReset = useCallback(() => {
    setInput('');
    toast.success(t('htmlstripper.clear_success'));
    inputRef.current?.focus();
  }, [t]);

  const handleDownload = useCallback(() => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stripped-text-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [output]);

  const handleCopyRef = useRef(handleCopy);
  const handleResetRef = useRef(handleReset);

  useEffect(() => {
    handleCopyRef.current = handleCopy;
    handleResetRef.current = handleReset;
  }, [handleCopy, handleReset]);

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
        handleResetRef.current();
      } else if (e.key.toLowerCase() === "c") {
        e.preventDefault();
        handleCopyRef.current();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {isTooLong && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {t('htmlstripper.error_max_length')}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="html-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Type className="w-4 h-4 text-indigo-500" /> {t('htmlstripper.html_input')}
            </label>
            <div className="flex gap-2 items-center">
              <kbd className="hidden sm:inline-flex items-center justify-center px-1.5 py-0.5 border border-rose-200 dark:border-rose-800 rounded text-[10px] font-bold text-rose-400 bg-white dark:bg-slate-900">Esc</kbd>
              <button
                onClick={handleReset}
                disabled={!input}
                className="text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors flex items-center gap-1 disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5" /> {t('common.reset')}
              </button>
            </div>
          </div>
          <textarea
            id="html-input"
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="<p>Hello <b>World</b>!</p>"
            className="w-full h-80 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none shadow-sm"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="plain-output" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-500" /> {t('htmlstripper.plain_text')}
            </label>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                disabled={!output || isTooLong}
                className="text-xs font-bold px-3 py-1.5 rounded-xl text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 transition-all disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleCopy}
                disabled={!output || isTooLong}
                className={`text-xs font-bold px-4 py-1.5 rounded-xl transition-all flex items-center gap-2 border ${copied ? 'bg-emerald-500 text-white border-transparent' : 'text-slate-600 bg-slate-100 dark:bg-slate-800 border-transparent hover:border-indigo-500/50'} disabled:opacity-50`}
                title={`${t('common.copy')} (C)`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} {copied ? t('common.copied') : t('common.copy')}
                {!copied && <kbd className="hidden sm:inline-flex items-center justify-center w-4 h-4 border border-indigo-200 dark:border-indigo-800 rounded text-[10px] font-bold bg-white dark:bg-slate-900">C</kbd>}
              </button>
            </div>
          </div>
          <textarea
            id="plain-output"
            value={output}
            readOnly
            className="w-full h-80 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-mono text-sm leading-relaxed dark:text-slate-300 resize-none shadow-sm"
          />
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <Info className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('htmlstripper.about_title')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('htmlstripper.about_text')}
          </p>
        </div>
      </div>
    </div>
  );
}
