import React, { useState, useMemo, useEffect } from 'react';
import { FileCode, Copy, Check, Trash2, Download, ListChecks, Settings2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function ListToJSON({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [input, setInput] = useState(initialData?.input || '');
  const [trim, setTrim] = useState(initialData?.trim ?? true);
  const [removeEmpty, setRemoveEmpty] = useState(initialData?.removeEmpty ?? true);
  const [uniqueOnly, setUniqueOnly] = useState(initialData?.uniqueOnly ?? false);
  const [sort, setSort] = useState(initialData?.sort ?? false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ input, trim, removeEmpty, uniqueOnly, sort });
  }, [input, trim, removeEmpty, uniqueOnly, sort]);

  const output = useMemo(() => {
    if (!input.trim()) return '[]';
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

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([output], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'list.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    setInput('');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2 text-indigo-500">
              <ListChecks className="w-4 h-4" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
                {t('list_to_json.input_label', 'Your List (one per line)')}
              </h3>
            </div>
            <div className="flex gap-2 items-center">
              <kbd className="hidden sm:inline-flex items-center justify-center px-1.5 py-0.5 border border-rose-200 dark:border-rose-800 rounded text-[10px] font-bold text-rose-400 bg-white dark:bg-slate-900">Esc</kbd>
              <button
                onClick={handleClear}
                disabled={!input}
                className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50"
              >
                <Trash2 className="w-3 h-3" /> {t('common.clear')}
              </button>
            </div>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') handleClear();
            }}
            placeholder={t('list_to_json.placeholder', 'Item 1\nItem 2\nItem 3...')}
            className="w-full h-[400px] p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
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
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">JSON Output</h3>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleDownload}
                  className="text-xs font-bold px-4 py-1.5 rounded-full text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 transition-all flex items-center gap-2"
                >
                  <Download className="w-3 h-3" /> {t('common.download')}
                </button>
                <button
                  onClick={handleCopy}
                  className={`text-xs font-bold px-4 py-1.5 rounded-full transition-all flex items-center gap-2 ${
                    copied
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                      : 'text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100'
                  }`}
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied ? t('common.copied') : t('common.copy')}
                </button>
              </div>
            </div>
            <textarea
              readOnly
              value={output}
              className="w-full h-[225px] p-6 bg-slate-900 text-indigo-300 border border-slate-800 rounded-3xl font-mono text-sm leading-relaxed resize-none outline-none shadow-inner"
            />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900/40 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800">
        <h4 className="font-bold text-slate-900 dark:text-white mb-4">{t('list_to_json.about_title', 'About List to JSON')}</h4>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          {t('list_to_json.about_text', 'Quickly convert any plain text list into a formatted JSON array. This tool is perfect for developers who need to transform a list of strings into a data structure for configuration files, mock data, or code constants.')}
        </p>
      </div>
    </div>
  );
}
