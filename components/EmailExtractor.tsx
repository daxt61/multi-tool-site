import { useState, useEffect, useRef, useCallback } from 'react';
import { Mail, Copy, Check, Trash2, Download, AlertCircle, List } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;

export function EmailExtractor({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [text, setText] = useState(initialData?.text || '');
  const [emails, setEmails] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const handlersRef = useRef({
    handleCopy: () => {},
    handleClear: () => {}
  });

  useEffect(() => {
    onStateChange?.({ text });
    extractEmails(text);
  }, [text]);

  const extractEmails = (val: string) => {
    if (!val.trim()) {
      setEmails([]);
      return;
    }
    if (val.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
      return;
    }
    setError(null);

    // Robust Email regex
    const emailRegex = /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/gi;
    const matches = val.match(emailRegex);
    if (matches) {
      const uniqueEmails = Array.from(new Set(matches.map(e => e.toLowerCase())));
      setEmails(uniqueEmails);
    } else {
      setEmails([]);
    }
  };

  const handleCopy = useCallback(() => {
    if (emails.length === 0) return;
    navigator.clipboard.writeText(emails.join('\n'));
    setCopied(true);
    toast.success(t('common.copied'));
    setTimeout(() => setCopied(false), 2000);
  }, [emails, t]);

  const handleClear = useCallback(() => {
    setText('');
    setError(null);
    textareaRef.current?.focus();
  }, []);

  const handleDownload = useCallback(() => {
    if (emails.length === 0) return;
    const blob = new Blob([emails.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `emails-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }, [emails]);

  useEffect(() => {
    handlersRef.current = { handleCopy, handleClear };
  }, [handleCopy, handleClear]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isEditable =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement instanceof HTMLSelectElement ||
        activeElement?.getAttribute('contenteditable') === 'true';

      if (isEditable && activeElement !== textareaRef.current) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        handlersRef.current.handleClear();
      } else if (e.key.toLowerCase() === 'c' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        if (isEditable && activeElement === textareaRef.current) return;
        e.preventDefault();
        handlersRef.current.handleCopy();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="extractor-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">{t('common.input')}</label>
            <div className="flex items-center gap-2">
              <Kbd modifier={null} className="hidden sm:inline-flex border-rose-200 dark:border-rose-800 text-rose-400">Esc</Kbd>
              <button
                onClick={handleClear}
                disabled={!text}
                className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
              >
                <Trash2 className="w-3.5 h-3.5" /> {t('common.clear')}
              </button>
            </div>
          </div>
          <textarea
            id="extractor-input"
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                handleClear();
              }
            }}
            placeholder={t('emailextractor.placeholder_input') || 'Paste text here to extract emails...'}
            className="w-full h-96 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none shadow-sm"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">{t('emailextractor.emails_found') || 'Emails Found'}</label>
              <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-[10px] font-black rounded-full">
                {emails.length}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                disabled={emails.length === 0}
                className="p-2 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg hover:bg-indigo-100 disabled:opacity-50 transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
                aria-label={t('common.download')}
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={handleCopy}
                disabled={emails.length === 0}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                  copied ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-transparent hover:bg-slate-200'
                } disabled:opacity-50`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? t('common.copied') : t('common.copy')}
                {!copied && <Kbd modifier={null} className="hidden sm:inline-flex w-4 h-4 border-slate-200 dark:border-slate-700 ml-1">C</Kbd>}
              </button>
            </div>
          </div>
          <div className="w-full h-96 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-y-auto shadow-inner">
            {emails.length > 0 ? (
              <ul className="space-y-3">
                {emails.map((email, idx) => (
                  <li key={idx} className="flex items-start gap-3 p-3 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50 group hover:border-indigo-500/30 transition-all">
                    <Mail className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                    <span className="text-sm font-mono text-slate-600 dark:text-slate-400 break-all">
                      {email}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
                <List className="w-8 h-8 opacity-20" />
                <p className="text-xs font-bold uppercase tracking-widest opacity-50">{t('emailextractor.no_emails') || 'No Emails Found'}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
