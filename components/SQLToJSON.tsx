import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Database, FileJson, Copy, Check, Trash2, AlertCircle, Download, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;

const SAMPLE_PRESETS = {
  users: {
    name: 'users',
    sql: `INSERT INTO users (id, username, email, role, is_active, created_at) VALUES
(1, 'alex_dev', 'alex@example.com', 'admin', true, '2024-01-15 09:30:00'),
(2, 'maria_s', 'maria@example.com', 'user', true, '2024-02-01 14:15:00'),
(3, 'john_doe', 'john@example.com', 'user', false, '2024-02-10 18:00:00');`
  },
  orders: {
    name: 'orders',
    sql: `INSERT INTO orders (order_id, customer_name, total_amount, status, item_count, is_paid) VALUES
('ORD-1001', 'Sarah Connor', 149.99, 'completed', 3, true),
('ORD-1002', 'John Doe', 89.50, 'pending', 1, false);`
  }
};

export function SQLToJSON({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState<string>(initialData?.input || SAMPLE_PRESETS.users.sql);
  const [copied, setCopied] = useState(false);

  // Reactive Conversion Logic
  const { output, error } = useMemo(() => {
    if (!input.trim()) {
      return { output: '', error: '' };
    }

    if (input.length > MAX_LENGTH) {
      return { output: '', error: t('error.max_length_sql', { max: MAX_LENGTH.toLocaleString() }) };
    }

    try {
      const results: any[] = [];
      const insertRegex = /INSERT\s+INTO\s+[`"\[]?(\w+)[`"\]]?\s*\(([^)]+)\)\s*VALUES\s*([\s\S]+?)(?:;|$)/gi;
      let match;

      while ((match = insertRegex.exec(input)) !== null) {
        const columns = match[2].split(',').map(c => {
          const name = c.trim().replace(/[`"\[\]]/g, '');
          const lower = name.toLowerCase();
          // Sentinel: Sanitize dangerous keys to prevent Prototype Pollution
          if (lower === '__proto__' || lower === 'constructor' || lower === 'prototype') {
            return `_${name}`;
          }
          return name;
        });
        const valuesSection = match[3].trim();

        const rows: string[] = [];
        let currentLevel = 0;
        let start = 0;
        let inString = false;
        let quoteChar = '';

        for (let i = 0; i < valuesSection.length; i++) {
          const char = valuesSection[i];
          if ((char === "'" || char === '"') && (i === 0 || valuesSection[i - 1] !== '\\')) {
            if (!inString) {
              inString = true;
              quoteChar = char;
            } else if (char === quoteChar) {
              inString = false;
            }
          }

          if (!inString) {
            if (char === '(') currentLevel++;
            if (char === ')') {
              currentLevel--;
              if (currentLevel === 0) {
                rows.push(valuesSection.substring(start, i + 1));
                let next = i + 1;
                while (next < valuesSection.length && (valuesSection[next] === ',' || /\s/.test(valuesSection[next]))) {
                  next++;
                }
                start = next;
                i = next - 1;
              }
            }
          }
        }

        for (const row of rows) {
          const valMatch = row.match(/^\s*\((.*)\)\s*$/ms);
          if (valMatch) {
            const rowValues: string[] = [];
            const rawVals = valMatch[1];
            let valStart = 0;
            let valInString = false;
            let valQuoteChar = '';
            let valCurrentLevel = 0;

            for (let i = 0; i < rawVals.length; i++) {
              const char = rawVals[i];
              if ((char === "'" || char === '"') && (i === 0 || rawVals[i - 1] !== '\\')) {
                if (!valInString) {
                  valInString = true;
                  valQuoteChar = char;
                } else if (char === valQuoteChar) {
                  valInString = false;
                }
              }

              if (!valInString) {
                if (char === '(') valCurrentLevel++;
                if (char === ')') valCurrentLevel--;
                if (char === ',' && valCurrentLevel === 0) {
                  rowValues.push(rawVals.substring(valStart, i).trim());
                  valStart = i + 1;
                }
              }
            }
            rowValues.push(rawVals.substring(valStart).trim());

            // Sentinel: Use Object.create(null) to prevent Prototype Pollution
            const obj: any = Object.create(null);
            columns.forEach((col, idx) => {
              let val = rowValues[idx];
              if (val === undefined) return;

              const trimmedVal = val.trim();
              if (trimmedVal.toLowerCase() === 'null') {
                obj[col] = null;
              } else if (trimmedVal.toLowerCase() === 'true') {
                obj[col] = true;
              } else if (trimmedVal.toLowerCase() === 'false') {
                obj[col] = false;
              } else if (!isNaN(Number(trimmedVal)) && trimmedVal !== '' && !trimmedVal.startsWith("'") && !trimmedVal.startsWith('"')) {
                obj[col] = Number(trimmedVal);
              } else if ((trimmedVal.startsWith("'") && trimmedVal.endsWith("'")) || (trimmedVal.startsWith('"') && trimmedVal.endsWith('"'))) {
                obj[col] = trimmedVal.substring(1, trimmedVal.length - 1).replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/''/g, "'");
              } else {
                obj[col] = trimmedVal;
              }
            });
            results.push(obj);
          }
        }
      }

      if (results.length === 0) {
        return { output: '', error: t('sqltojson.error_no_statements') || 'No valid INSERT statements found.' };
      }

      return { output: JSON.stringify(results, null, 2), error: '' };
    } catch (e: any) {
      return { output: '', error: e.message };
    }
  }, [input, t]);

  useEffect(() => {
    onStateChange?.({ input, output });
  }, [input, output, onStateChange]);

  const handleClear = useCallback(() => {
    setInput('');
    toast.success(t('sqltojson.toast_cleared') || 'Cleared!');
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [t]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success(t('common.copied') || 'Copied!');
    setTimeout(() => setCopied(false), 2000);
  }, [output, t]);

  const handleDownload = useCallback(() => {
    if (!output) return;
    const blob = new Blob([output], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'data.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(t('common.download_success') || 'Downloaded!');
  }, [output, t]);

  const loadPreset = useCallback((presetKey: keyof typeof SAMPLE_PRESETS) => {
    const preset = SAMPLE_PRESETS[presetKey];
    if (preset) {
      setInput(preset.sql);
      toast.success(t('sqltojson.preset_loaded') || 'Preset loaded!');
    }
  }, [t]);

  const handlersRef = useRef({
    handleClear,
    handleCopy
  });

  useEffect(() => {
    handlersRef.current = { handleClear, handleCopy };
  }, [handleClear, handleCopy]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isEditable =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement instanceof HTMLSelectElement ||
        activeElement?.getAttribute('contenteditable') === 'true';

      const { handleClear, handleCopy } = handlersRef.current;

      if (isEditable && e.key !== 'Escape') return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        handleClear();
      } else if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handleCopy();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8" role="region" aria-label={t('tool.sql-to-json.name') || 'SQL to JSON'}>
      {/* Presets Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-500" aria-hidden="true" />
          <span className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('sqltojson.presets_title') || 'Quick Presets:'}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => loadPreset('users')}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 text-slate-700 dark:text-slate-200 transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
          >
            {t('sqltojson.preset_users') || 'User Records'}
          </button>
          <button
            onClick={() => loadPreset('orders')}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 text-slate-700 dark:text-slate-200 transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
          >
            {t('sqltojson.preset_orders') || 'E-Commerce Orders'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 shrink-0" aria-hidden="true" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-500" aria-hidden="true" />
              <label htmlFor="sql-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('sqltojson.input_label')}
              </label>
            </div>
            <div className="flex gap-2 items-center">
              <Kbd modifier={null} className="hidden sm:inline-flex border-rose-200 dark:border-rose-800 text-rose-400 dark:bg-slate-900">Esc</Kbd>
              <button
                onClick={handleClear}
                disabled={!input && !output}
                title={`${t('common.clear')} (Esc)`}
                className="text-xs font-bold px-3 py-1 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
              >
                <Trash2 className="w-3 h-3" aria-hidden="true" /> {t('common.clear')}
              </button>
            </div>
          </div>
          <textarea
            id="sql-input"
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('sqltojson.placeholder_input')}
            className="w-full h-[500px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileJson className="w-4 h-4 text-emerald-500" aria-hidden="true" />
              <label htmlFor="json-output" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('sqltojson.output_label')}
              </label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                disabled={!output}
                className="text-xs font-bold px-3 py-1 rounded-full text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 transition-all flex items-center gap-1 disabled:opacity-50"
              >
                <Download className="w-3 h-3" aria-hidden="true" /> {t('common.download')}
              </button>
              <button
                onClick={handleCopy}
                disabled={!output}
                title={`${t('common.copy')} (C)`}
                className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                  copied
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                    : 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                {copied ? <Check className="w-3 h-3" aria-hidden="true" /> : <Copy className="w-3 h-3" aria-hidden="true" />} {copied ? t('common.copied') : t('common.copy')}
                {!copied && <Kbd modifier={null} className="hidden sm:inline-flex w-4 h-4 bg-white/50 dark:bg-black/20 ml-1">C</Kbd>}
              </button>
            </div>
          </div>
          <textarea
            id="json-output"
            value={output}
            readOnly
            placeholder={t('sqltojson.placeholder_output')}
            className="w-full h-[500px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-mono text-sm leading-relaxed text-indigo-600 dark:text-indigo-400 resize-none"
          />
        </div>
      </div>
    </div>
  );
}
