import { useState, useEffect, useCallback, useRef } from 'react';
import { Database, Copy, Check, Trash2, AlertCircle, Download, Info, Terminal, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;

export function SQLToMongoDB({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState(initialData?.input || '');
  const [output, setOutput] = useState(initialData?.output || '');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ input, output });
  }, [input, output, onStateChange]);

  const PRESETS = {
    insert_ecommerce: `-- E-Commerce Product Catalog Insert
INSERT INTO products (id, title, category, price, in_stock)
VALUES (101, 'Wireless Mouse', 'Electronics', 29.99, true),
       (102, 'Mechanical Keyboard', 'Electronics', 89.50, true);`,
    select_users: `-- Filter Active Users
SELECT user_id, email, full_name, login_count
FROM users
WHERE status = 'active' AND login_count >= 5
LIMIT 20;`,
    select_advanced: `-- IN & LIKE Conditions
SELECT id, sku, category, price
FROM catalog
WHERE category IN ('Gadgets', 'Audio') AND title LIKE '%pro%'
LIMIT 10;`
  };

  const parseValue = (val: string) => {
    val = val.trim();
    if (val.toUpperCase() === 'NULL') return null;
    if (val.toUpperCase() === 'TRUE') return true;
    if (val.toUpperCase() === 'FALSE') return false;
    if (/^-?\d+(\.\d+)?$/.test(val)) return Number(val);
    if ((val.startsWith("'") && val.endsWith("'")) || (val.startsWith('"') && val.endsWith('"'))) {
      return val.slice(1, -1).replace(/''/g, "'").replace(/""/g, '"');
    }
    return val;
  };

  const sanitizeKey = (key: string) => {
    const clean = key.trim().replace(/[`"[]/g, '');
    const lower = clean.toLowerCase();
    if (lower === '__proto__' || lower === 'constructor' || lower === 'prototype') {
      return `_${clean}`;
    }
    return clean;
  };

  const handleConvert = useCallback(() => {
    if (!input.trim()) {
      setOutput('');
      setError('');
      return;
    }

    if (input.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
      setOutput('');
      return;
    }

    try {
      const cleanInput = input.trim().replace(/--.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
      let result = '';

      // Handle INSERT INTO
      const insertRegex = /INSERT\s+INTO\s+([^\s(]+)\s*\(([^)]+)\)\s*VALUES\s*([\s\S]+);?/i;
      const insertMatch = cleanInput.match(insertRegex);

      if (insertMatch) {
        const collection = sanitizeKey(insertMatch[1]);
        const columns = insertMatch[2].split(',').map((c: string) => sanitizeKey(c));
        let valuesBlock = insertMatch[3].trim();
        if (valuesBlock.endsWith(';')) valuesBlock = valuesBlock.slice(0, -1).trim();

        // Split values by (), but handle commas inside strings
        const rows: any[] = [];
        let currentRow = '';
        let insideString = false;
        let parenLevel = 0;

        const processRow = (rowStr: string) => {
          const m = rowStr.trim().match(/^\(([\s\S]+)\)$/);
          if (m) {
            const vals: any[] = [];
            let currentVal = '';
            let inStr = false;
            for (let i = 0; i < m[1].length; i++) {
              const char = m[1][i];
              if (char === "'" && m[1][i-1] !== '\\') inStr = !inStr;
              if (!inStr && char === ',') {
                vals.push(parseValue(currentVal));
                currentVal = '';
              } else {
                currentVal += char;
              }
            }
            vals.push(parseValue(currentVal));

            const obj: any = Object.create(null);
            columns.forEach((col: string, idx: number) => {
              obj[col] = vals[idx];
            });
            rows.push(obj);
          }
        };

        for (let i = 0; i < valuesBlock.length; i++) {
          const char = valuesBlock[i];
          if (char === "'" && valuesBlock[i-1] !== '\\') insideString = !insideString;
          if (!insideString) {
            if (char === '(') parenLevel++;
            if (char === ')') parenLevel--;
          }

          if (!insideString && char === ',' && parenLevel === 0) {
            processRow(currentRow);
            currentRow = '';
          } else {
            currentRow += char;
          }
        }
        processRow(currentRow);

        result = `db.${collection}.insertMany(${JSON.stringify(rows, null, 2)})`;
      } else {
        // Handle SELECT
        const selectRegex = /SELECT\s+([\s\S]+?)\s+FROM\s+([^\s;]+)(?:\s+WHERE\s+([\s\S]+?))?(?:\s+LIMIT\s+(\d+))?\s*;?$/i;
        const selectMatch = cleanInput.match(selectRegex);

        if (selectMatch) {
          const fields = selectMatch[1].trim();
          const collection = sanitizeKey(selectMatch[2]);
          const where = selectMatch[3];
          const limit = selectMatch[4];

          let query = '{}';
          if (where) {
            const conditions = where.split(/\s+AND\s+/i);
            const queryObj: any = Object.create(null);
            conditions.forEach((cond: string) => {
              const partMatch = cond.match(/([^\s>=<!]+)\s*(>=|<=|!=|<>|=|>|<|LIKE|IN)\s*(.+)/i);
              if (partMatch) {
                const key = sanitizeKey(partMatch[1]);
                const op = partMatch[2].toUpperCase();
                const val = parseValue(partMatch[3]);

                if (op === '=') queryObj[key] = val;
                else if (op === '!=' || op === '<>') queryObj[key] = { $ne: val };
                else if (op === '>') queryObj[key] = { $gt: val };
                else if (op === '<') queryObj[key] = { $lt: val };
                else if (op === '>=') queryObj[key] = { $gte: val };
                else if (op === '<=') queryObj[key] = { $lte: val };
                else if (op === 'IN') {
                   const inVals = partMatch[3].trim().replace(/^\(|\)$/g, '').split(',').map((v: string) => parseValue(v));
                   queryObj[key] = { $in: inVals };
                }
                else if (op === 'LIKE') {
                   const pattern = String(val).replace(/%/g, '.*').replace(/_/g, '.');
                   queryObj[key] = { $regex: `^${pattern}$`, $options: 'i' };
                }
              }
            });
            query = JSON.stringify(queryObj, null, 2);
          }

          let projection = '';
          if (fields !== '*') {
            const projObj: any = Object.create(null);
            fields.split(',').forEach((f: string) => projObj[sanitizeKey(f)] = 1);
            projection = `, ${JSON.stringify(projObj)}`;
          }

          result = `db.${collection}.find(${query}${projection})`;
          if (limit) result += `.limit(${limit})`;
        } else {
          setError(t('sqltomongodb.error_unsupported', 'Unsupported SQL statement. Only INSERT INTO and SELECT are supported.'));
          setOutput('');
          return;
        }
      }

      setOutput(result);
      setError('');
    } catch (e: any) {
      setError(e.message || t('sqltomongodb.error_parsing', 'Error parsing SQL query.'));
      setOutput('');
    }
  }, [input, t]);

  useEffect(() => {
    handleConvert();
  }, [handleConvert]);

  const handleClear = useCallback(() => {
    setInput('');
    setOutput('');
    setError('');
    toast.success(t('common.cleared', 'Cleared!'));
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [t]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success(t('common.copied', 'Copied to clipboard!'));
    setTimeout(() => setCopied(false), 2000);
  }, [output, t]);

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `query.js`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(t('common.downloaded', 'Downloaded query.js!'));
  };

  const loadPreset = (key: keyof typeof PRESETS) => {
    setInput(PRESETS[key]);
    toast.success(t('sqltomongodb.preset_loaded', 'Loaded SQL preset!'));
  };

  const handlersRef = useRef({ handleClear, handleCopy, output });
  useEffect(() => {
    handlersRef.current = { handleClear, handleCopy, output };
  }, [handleClear, handleCopy, output]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const active = document.activeElement;
      const isEditable =
        active instanceof HTMLInputElement ||
        active instanceof HTMLTextAreaElement ||
        active instanceof HTMLSelectElement ||
        active?.getAttribute("contenteditable") === "true";

      if (isEditable && e.key !== 'Escape') return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key === "Escape") {
        e.preventDefault();
        handlersRef.current.handleClear();
      } else if (e.key.toLowerCase() === "c") {
        if (handlersRef.current.output) {
          e.preventDefault();
          handlersRef.current.handleCopy();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Presets Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" aria-hidden="true" />
          <span className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('sqltomongodb.presets_title', 'Clickable Presets')}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => loadPreset('insert_ecommerce')}
            className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 rounded-xl transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
          >
            {t('sqltomongodb.preset_insert', 'Product Insert')}
          </button>
          <button
            onClick={() => loadPreset('select_users')}
            className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 rounded-xl transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
          >
            {t('sqltomongodb.preset_users', 'Filter Users')}
          </button>
          <button
            onClick={() => loadPreset('select_advanced')}
            className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 rounded-xl transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
          >
            {t('sqltomongodb.preset_advanced', 'IN & LIKE Search')}
          </button>
        </div>
      </div>

      {/* Editor Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-500" aria-hidden="true" />
              <label htmlFor="sql-mongo-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('sqltomongodb.sql_input_label', 'SQL Query Input')}
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Kbd modifier={null} className="hidden sm:inline-flex border-rose-200 dark:border-rose-800 text-rose-400 dark:bg-slate-900">Esc</Kbd>
              <button
                onClick={handleClear}
                disabled={!input && !output}
                className="text-xs font-bold px-3 py-1.5 rounded-xl text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all flex items-center gap-1 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
              >
                <Trash2 className="w-3 h-3" aria-hidden="true" /> {t('common.clear')}
              </button>
            </div>
          </div>
          <textarea
            id="sql-mongo-input"
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('sqltomongodb.placeholder_sql', 'Paste SQL query here (e.g. INSERT INTO or SELECT)...')}
            className="w-full h-80 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-500" aria-hidden="true" />
              <label htmlFor="sql-mongo-output" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('sqltomongodb.output_label', 'MongoDB Shell Command')}
              </label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                disabled={!output}
                className="text-xs font-bold px-3 py-1.5 rounded-xl text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 transition-all flex items-center gap-1 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
              >
                <Download className="w-3 h-3" aria-hidden="true" /> {t('common.download')}
              </button>
              <button
                onClick={handleCopy}
                disabled={!output}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                  copied
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                    : 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                {copied ? <Check className="w-3 h-3" aria-hidden="true" /> : <Copy className="w-3 h-3" aria-hidden="true" />} {copied ? t('common.copied') : t('common.copy')}
                {!copied && input && <Kbd modifier={null} className="hidden sm:inline-flex w-4 h-4 bg-white/50 dark:bg-black/20 ml-1">C</Kbd>}
              </button>
            </div>
          </div>
          <textarea
            id="sql-mongo-output"
            value={output}
            readOnly
            placeholder={t('sqltomongodb.placeholder_output', 'MongoDB shell query will appear here...')}
            className="w-full h-80 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-mono text-sm leading-relaxed text-indigo-600 dark:text-indigo-400 resize-none"
          />
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" aria-hidden="true" />
          {error}
        </div>
      )}

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <Info className="w-6 h-6 text-indigo-500 mt-1 flex-shrink-0" aria-hidden="true" />
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('sqltomongodb.about_title', 'About SQL to MongoDB')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('sqltomongodb.about_text', 'This tool converts standard SQL commands into MongoDB shell syntax. It currently supports INSERT INTO statements (converted to insertMany) and SELECT statements (converted to find, including WHERE conditions, projections, and LIMIT). All processing is done locally in your browser.')}
          </p>
        </div>
      </div>
    </div>
  );
}
