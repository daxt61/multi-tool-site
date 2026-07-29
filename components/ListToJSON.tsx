import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { FileCode, Copy, Check, Trash2, Download, ListChecks, Settings2, AlertCircle, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;

export function ListToJSON({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [input, setInput] = useState(initialData?.input || '');
  const [trim, setTrim] = useState(initialData?.trim ?? true);
  const [removeEmpty, setRemoveEmpty] = useState(initialData?.removeEmpty ?? true);
  const [uniqueOnly, setUniqueOnly] = useState(initialData?.uniqueOnly ?? false);
  const [sort, setSort] = useState(initialData?.sort ?? false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onStateChange?.({ input, trim, removeEmpty, uniqueOnly, sort });
  }, [input, trim, removeEmpty, uniqueOnly, sort, onStateChange]);

  // Handle Input Max Length Check
  useEffect(() => {
    if (input.length > MAX_LENGTH) {
      setError(t('list_to_json.error_max_length', { max: MAX_LENGTH.toLocaleString() }));
    } else {
      setError(null);
    }
  }, [input, t]);

  const output = useMemo(() => {
    if (!input.trim() || input.length > MAX_LENGTH) return '[]';
    let lines = input.split('\n');

    if (trim) {
      lines = lines.map((l: string) => l.trim());
    }

    if (removeEmpty) {
      lines = lines.filter((l: string) => l.length > 0);
    }

    if (uniqueOnly) {
      lines = Array.from(new Set(lines));
    }

    if (sort) {
      lines.sort((a: string, b: string) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
    }

    return JSON.stringify(lines, null, 2);
  }, [input, trim, removeEmpty, uniqueOnly, sort]);

  const handleCopy = useCallback(() => {
    if (!output || output === '[]') return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success(t('common.copied', 'Copied'));
    setTimeout(() => setCopied(false), 2000);
  }, [output, t]);

  const handleDownload = useCallback(() => {
    if (!output || output === '[]') return;
    const blob = new Blob([output], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'list.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [output]);

  const handleClear = useCallback(() => {
    setInput('');
    setError(null);
    toast.success(t('linesorter.toast_cleared', 'Inputs cleared'));
    setTimeout(() => textareaRef.current?.focus(), 0);
  }, [t]);

  // Safeguard keyboard handlers against stale closures
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
        activeElement?.getAttribute('contenteditable') === 'true';

      const isEditable = activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA';

      if (e.key === 'Escape') {
        if (isInputFocused || !isEditable) {
          e.preventDefault();
          handlersRef.current.handleClear();
        }
        return;
      }

      if (isInputFocused) return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handlersRef.current.handleCopy();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {error && (
        <div role="alert" className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2 text-indigo-500">
              <ListChecks className="w-4 h-4" />
              <label htmlFor="list-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('list_to_json.input_label', 'Your List (one per line)')}
              </label>
            </div>
            <div className="flex gap-2 items-center">
              <button
                onClick={handleClear}
                disabled={!input}
                className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
                title={`${t('common.clear')} (Esc)`}
              >
                <Trash2 className="w-3 h-3" /> {t('common.clear')}
                <Kbd modifier={null} className="hidden sm:inline-flex ml-1 bg-white/50 dark:bg-black/20 border-rose-200 dark:border-rose-800 text-rose-400">Esc</Kbd>
              </button>
            </div>
          </div>
          <textarea
            id="list-input"
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('list_to_json.placeholder', 'Item 1\nItem 2\nItem 3...')}
            className={`w-full h-[400px] p-6 bg-slate-50 dark:bg-slate-900/50 border ${error ? 'border-rose-500 ring-rose-500/20' : 'border-slate-200 dark:border-slate-800'} rounded-3xl outline-none focus:ring-2 ${error ? 'focus:ring-rose-500/20' : 'focus:ring-indigo-500/20'} transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none`}
          />
          <div className="flex justify-between items-center text-xs text-slate-400 px-1">
            <span>{t('linesorter.stat_total', 'Total Lines')}: {input ? input.split('\n').length : 0}</span>
            <span className={input.length > MAX_LENGTH ? 'text-rose-500 font-bold' : ''}>
              {input.length.toLocaleString()} / {MAX_LENGTH.toLocaleString()} {t('common.characters', 'characters')}
            </span>
          </div>
        </div>

        {/* Settings & Output Section */}
        <div className="space-y-8">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex items-center gap-3 px-1">
              <Settings2 className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{t('common.options')}</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 cursor-pointer group transition-colors hover:border-indigo-500/30">
                <input
                  type="checkbox"
                  checked={trim}
                  onChange={(e) => setTrim(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">{t('listcleaner.trim_lines')}</span>
              </label>
              <label className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 cursor-pointer group transition-colors hover:border-indigo-500/30">
                <input
                  type="checkbox"
                  checked={removeEmpty}
                  onChange={(e) => setRemoveEmpty(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">{t('listcleaner.remove_empty_lines')}</span>
              </label>
              <label className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 cursor-pointer group transition-colors hover:border-indigo-500/30">
                <input
                  type="checkbox"
                  checked={uniqueOnly}
                  onChange={(e) => setUniqueOnly(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">{t('common.unique_only')}</span>
              </label>
              <label className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 cursor-pointer group transition-colors hover:border-indigo-500/30">
                <input
                  type="checkbox"
                  checked={sort}
                  onChange={(e) => setSort(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">{t('listcleaner.sorting')}</span>
              </label>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <div className="flex items-center gap-2 text-indigo-500">
                <FileCode className="w-4 h-4" />
                <label htmlFor="json-output" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">JSON Output</label>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleDownload}
                  disabled={!output || output === '[]'}
                  className="text-xs font-bold px-4 py-1.5 rounded-full text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <Download className="w-3 h-3" /> {t('common.download')}
                </button>
                <button
                  onClick={handleCopy}
                  disabled={!output || output === '[]'}
                  className={`text-xs font-bold px-4 py-1.5 rounded-xl transition-all border flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                    copied
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                      : 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-slate-200 dark:border-slate-700 hover:border-indigo-500/50'
                  } disabled:opacity-50`}
                  title={`${t('common.copy')} (C)`}
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied ? t('common.copied') : t('common.copy')}
                  {!copied && <Kbd modifier={null} className="hidden sm:inline-flex ml-1 bg-white/50 dark:bg-black/20 border-slate-200 dark:border-slate-800">C</Kbd>}
                </button>
              </div>
            </div>
            <textarea
              id="json-output"
              readOnly
              value={output}
              className="w-full h-[225px] p-6 bg-slate-900 text-indigo-300 border border-slate-800 rounded-3xl font-mono text-sm leading-relaxed resize-none outline-none shadow-inner"
            />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900/40 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 flex items-start gap-4">
        <Info className="w-6 h-6 text-indigo-500 mt-1 shrink-0" />
        <div className="space-y-2">
          <h4 className="font-bold text-slate-900 dark:text-white">{t('list_to_json.about_title', 'About List to JSON')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('list_to_json.about_text', 'Quickly convert any plain text list into a formatted JSON array. This tool is perfect for developers who need to transform a list of strings into a data structure for configuration files, mock data, or code constants.')}
          </p>
        </div>
      </div>
    </div>
  );
}
