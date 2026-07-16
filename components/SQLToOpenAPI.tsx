import { useState, useEffect, useCallback, useRef } from 'react';
import { FileCode, Copy, Check, Trash2, AlertCircle, Database, Download, RotateCcw, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';
import yaml from 'js-yaml';

const MAX_LENGTH = 100000;

type OutputFormat = 'yaml' | 'json';

interface Column {
  name: string;
  type: string;
  required: boolean;
  format?: string;
  description?: string;
}

interface Table {
  name: string;
  columns: Column[];
}

export function SQLToOpenAPI({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState(initialData?.input || '');
  const [output, setOutput] = useState('');
  const [format, setOutputFormat] = useState<OutputFormat>(initialData?.format || 'yaml');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ input, format });
  }, [input, format, onStateChange]);

  const parseSQL = (sql: string): Table[] => {
    const tables: Table[] = [];
    // Basic regex for CREATE TABLE
    const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:[`"\[]?(\w+)[`"\]]?\.)?[`"\[]?(\w+)[`"\]]?\s*\(([\s\S]*?)\)(?:;|$)/gim;

    let match;
    while ((match = tableRegex.exec(sql)) !== null) {
      const tableName = match[2];
      const columnSection = match[3];
      const columns: Column[] = [];

      // Improved column parsing handling commas inside parentheses (like DECIMAL(10,2))
      const rawCols: string[] = [];
      let current = '';
      let parenLevel = 0;
      let inQuote = false;
      let quoteChar = '';

      for (let i = 0; i < columnSection.length; i++) {
        const char = columnSection[i];
        if ((char === '"' || char === '`') && (i === 0 || columnSection[i-1] !== '\\')) {
          if (!inQuote) {
            inQuote = true;
            quoteChar = char;
          } else if (char === quoteChar) {
            inQuote = false;
          }
        }
        if (!inQuote) {
          if (char === '(') parenLevel++;
          if (char === ')') parenLevel--;
          if (char === ',' && parenLevel === 0) {
            rawCols.push(current.trim());
            current = '';
            continue;
          }
        }
        current += char;
      }
      if (current.trim()) rawCols.push(current.trim());

      for (const colDef of rawCols) {
        // Skip constraints like PRIMARY KEY (id), FOREIGN KEY...
        if (/^(PRIMARY\s+KEY|FOREIGN\s+KEY|CONSTRAINT|UNIQUE|INDEX|CHECK|KEY)\b/i.test(colDef)) continue;

        const parts = colDef.split(/\s+/);
        if (parts.length < 2) continue;

        let colName = parts[0].replace(/[`"\[\]]/g, '');
        const colTypeRaw = parts[1].toLowerCase();

        // Mark as required if it has NOT NULL or is PRIMARY KEY
        const isRequired = /\bNOT\s+NULL\b/i.test(colDef) || /\bPRIMARY\s+KEY\b/i.test(colDef);

        let type = 'string';
        let format: string | undefined = undefined;

        if (colTypeRaw.includes('int')) {
          type = 'integer';
          format = colTypeRaw.includes('bigint') ? 'int64' : 'int32';
        } else if (colTypeRaw.includes('float') || colTypeRaw.includes('double') || colTypeRaw.includes('decimal') || colTypeRaw.includes('numeric') || colTypeRaw.includes('real')) {
          type = 'number';
        } else if (colTypeRaw.includes('bool')) {
          type = 'boolean';
        } else if (colTypeRaw.includes('date')) {
          type = 'string';
          format = colTypeRaw.includes('time') ? 'date-time' : 'date';
        } else if (colTypeRaw.includes('timestamp')) {
          type = 'string';
          format = 'date-time';
        } else if (colTypeRaw.includes('json')) {
          type = 'object';
        } else if (colTypeRaw.includes('bit')) {
            type = colDef.includes('(1)') ? 'boolean' : 'string';
        }

        columns.push({
          name: colName,
          type,
          format,
          required: isRequired
        });
      }

      if (columns.length > 0) {
        tables.push({ name: tableName, columns });
      }
    }

    return tables;
  };

  const handleConvert = useCallback(() => {
    try {
      if (!input.trim()) {
        setOutput('');
        setError('');
        return;
      }
      if (input.length > MAX_LENGTH) {
        setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
        return;
      }

      const tables = parseSQL(input);
      if (tables.length === 0) {
        setError(t('sqltots.no_tables_found', 'No valid CREATE TABLE statements found.'));
        return;
      }

      const schemas: any = Object.create(null);

      tables.forEach(table => {
        const properties: any = Object.create(null);
        const required: string[] = [];

        table.columns.forEach(col => {
          // Sentinel: Sanitize dangerous keys to prevent Prototype Pollution in output object
          const lower = col.name.toLowerCase();
          const safeKey = (lower === '__proto__' || lower === 'constructor' || lower === 'prototype') ? `_${col.name}` : col.name;

          properties[safeKey] = {
            type: col.type,
          };
          if (col.format) properties[safeKey].format = col.format;
          if (col.required) required.push(safeKey);
        });

        schemas[table.name] = {
          type: 'object',
          properties,
        };
        if (required.length > 0) {
          schemas[table.name].required = required;
        }
      });

      if (format === 'yaml') {
        setOutput(yaml.dump(schemas, { indent: 2, noRefs: true }));
      } else {
        setOutput(JSON.stringify(schemas, null, 2));
      }
      setError('');
    } catch (e: any) {
      setError(t('sqltots.error_parsing', 'Error parsing SQL') + ': ' + e.message);
    }
  }, [input, format, t]);

  useEffect(() => {
    handleConvert();
  }, [handleConvert]);

  const handleClear = useCallback(() => {
    setInput('');
    setOutput('');
    setError('');
    setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success(t('common.copied'));
    setTimeout(() => setCopied(false), 2000);
  }, [output, t]);

  const handlersRef = useRef({ handleClear, handleCopy });
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
        activeElement?.getAttribute("contenteditable") === "true";

      if (isEditable && e.key !== 'Escape') return;

      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key === "Escape") {
        e.preventDefault();
        handlersRef.current.handleClear();
      } else if (e.key.toLowerCase() === "c") {
        e.preventDefault();
        handlersRef.current.handleCopy();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: format === 'yaml' ? 'text/yaml' : 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `schema.${format === 'yaml' ? 'yaml' : 'json'}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-wrap gap-4 justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-4 rounded-3xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-4">
          <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            {(['yaml', 'json'] as OutputFormat[]).map((f) => (
              <button
                key={f}
                onClick={() => setOutputFormat(f)}
                className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                  format === f
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 items-center">
          <Kbd modifier={null} className="hidden sm:inline-flex border-rose-200 dark:border-rose-800 text-rose-400 dark:bg-slate-900">Esc</Kbd>
          <button
            onClick={handleClear}
            disabled={!input && !output}
            className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-4 py-2 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
          >
            <Trash2 className="w-3 h-3" /> {t('common.clear')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-500" />
              <label htmlFor="sql-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">SQL CREATE TABLE</label>
            </div>
          </div>
          <textarea
            id="sql-input"
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={"CREATE TABLE users (\n  id INT PRIMARY KEY,\n  username VARCHAR(255) NOT NULL,\n  email VARCHAR(255) UNIQUE,\n  created_at TIMESTAMP\n);"}
            className="w-full h-[400px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-emerald-500" />
              <label htmlFor="openapi-output" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">OpenAPI Schema</label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                disabled={!output}
                className="text-xs font-bold px-3 py-1 rounded-full text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 transition-all flex items-center gap-1 disabled:opacity-50"
              >
                <Download className="w-3 h-3" /> {t('common.download')}
              </button>
              <button
                onClick={handleCopy}
                disabled={!output}
                className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                  copied
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                    : 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700'
                } disabled:opacity-50`}
                title={`${t('common.copy')} (C)`}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied ? t('common.copied') : t('common.copy')}
                {!copied && input && <Kbd modifier={null} className="hidden sm:inline-flex w-4 h-4 bg-white/50 dark:bg-black/20 ml-1">C</Kbd>}
              </button>
            </div>
          </div>
          <textarea
            id="openapi-output"
            value={output}
            readOnly
            placeholder={t('common.waiting')}
            className="w-full h-[400px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-mono text-sm leading-relaxed text-indigo-600 dark:text-indigo-400 resize-none"
          />
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <Info className="w-6 h-6 text-indigo-500 mt-1" />
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('sqltots.about_title')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('sqltots.about_text')}
          </p>
        </div>
      </div>
    </div>
  );
}
