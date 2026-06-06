import React, { useState, useEffect, useCallback } from 'react';
import { Scissors, Copy, Check, Trash2, Info, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_LENGTH = 100000;

export function SQLMinifier({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [input, setInput] = useState(initialData?.input || '');
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ input });
  }, [input, onStateChange]);

  const minifySQL = useCallback((sql: string) => {
    if (!sql.trim()) return '';

    // Remove single line comments (-- ...)
    let minified = sql.replace(/--.*$/gm, '');

    // Remove multi-line comments (/* ... */)
    minified = minified.replace(/\/\*[\s\S]*?\*\//g, '');

    // Collapse multiple whitespaces and newlines
    minified = minified.replace(/\s+/g, ' ').trim();

    // Remove spaces around special characters
    minified = minified.replace(/\s*([,;()=<>!+*/-])\s*/g, '$1');

    return minified;
  }, []);

  useEffect(() => {
    setOutput(minifySQL(input));
  }, [input, minifySQL]);

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `minified.sql`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="sql-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Scissors className="w-4 h-4 text-indigo-500" /> SQL Input
            </label>
            <button
              onClick={() => setInput('')}
              className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 transition-all px-2 py-1 rounded-lg flex items-center gap-1 disabled:opacity-50"
              disabled={!input}
            >
              <Trash2 className="w-3 h-3" /> {t('common.clear')}
            </button>
          </div>
          <textarea
            id="sql-input"
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, MAX_LENGTH))}
            placeholder={"SELECT * FROM users\nWHERE active = 1;\n-- This is a comment"}
            className="w-full h-80 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="sql-output" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500" /> Minified Output
            </label>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                disabled={!output}
                className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" /> {t('common.download')}
              </button>
              <button
                onClick={handleCopy}
                disabled={!output}
                className={`text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-2 border ${
                  copied
                    ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                    : "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 border-transparent"
                } disabled:opacity-50`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? t('common.copied') : t('common.copy')}
              </button>
            </div>
          </div>
          <textarea
            id="sql-output"
            value={output}
            readOnly
            placeholder="Minified SQL will appear here..."
            className="w-full h-80 p-6 bg-slate-900 text-indigo-300 border border-slate-800 rounded-[2.5rem] outline-none font-mono text-sm leading-relaxed resize-none"
          />
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <Info className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('sqlminifier.about_title')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('sqlminifier.about_text')}
          </p>
        </div>
      </div>
    </div>
  );
}
