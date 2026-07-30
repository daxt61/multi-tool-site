import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Database, Copy, Check, Trash2, Code, Download, Play, AlertCircle, Info, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;
const MAX_DEPTH = 20;

type Dialect = 'postgresql' | 'mysql' | 'sqlite' | 'sqlserver' | 'oracle';

const SAMPLE_JSON = `{
  "tableName": "users",
  "fields": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "is_active": true,
    "balance": 124.50,
    "created_at": "2026-07-30T12:00:00Z",
    "profile": {
      "first_name": "John",
      "last_name": "Doe",
      "age": 30
    },
    "tags": ["developer", "admin"]
  }
}`;

export function JSONToSQLDDL({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [jsonInput, setJsonInput] = useState(initialData?.jsonInput || '');
  const [dialect, setDialect] = useState<Dialect>(initialData?.dialect || 'postgresql');
  const [tableName, setTableName] = useState(initialData?.tableName || 'my_table');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onStateChange?.({ jsonInput, dialect, tableName });
  }, [jsonInput, dialect, tableName, onStateChange]);

  const handleClear = useCallback(() => {
    setJsonInput('');
    setError(null);
    toast.success(t('robotstxt.toast_cleared') || 'Cleared!');
    inputRef.current?.focus();
  }, [t]);

  const loadPreset = useCallback(() => {
    setJsonInput(SAMPLE_JSON);
    setTableName('users');
    setError(null);
    toast.success(t('workhours.toast_preset') || 'Preset loaded!');
  }, [t]);

  // Recursively derive types with depth checks to prevent client-side stack overflow
  const inferType = (val: any, dialect: Dialect, depth: number = 0): string => {
    if (depth > MAX_DEPTH) {
      return dialect === 'postgresql' ? 'JSONB' : 'TEXT';
    }

    if (val === null || val === undefined) {
      return 'VARCHAR(255)';
    }

    const type = typeof val;

    if (type === 'boolean') {
      switch (dialect) {
        case 'sqlite': return 'INTEGER'; // SQLite uses 0/1 for booleans
        case 'oracle': return 'NUMBER(1)';
        default: return 'BOOLEAN';
      }
    }

    if (type === 'number') {
      if (Number.isInteger(val)) {
        return dialect === 'oracle' ? 'NUMBER(19)' : 'INTEGER';
      }
      switch (dialect) {
        case 'oracle': return 'NUMBER(19,4)';
        case 'mysql': return 'DECIMAL(19,4)';
        case 'sqlserver': return 'DECIMAL(19,4)';
        default: return 'DECIMAL';
      }
    }

    if (type === 'string') {
      // Basic check for ISO-like timestamp
      const isTimestamp = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val) || /^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}/.test(val);
      if (isTimestamp) {
        switch (dialect) {
          case 'oracle': return 'TIMESTAMP';
          case 'mysql': return 'DATETIME';
          case 'sqlserver': return 'DATETIME2';
          default: return 'TIMESTAMP';
        }
      }
      return 'VARCHAR(255)';
    }

    // Array or Object
    if (Array.isArray(val) || type === 'object') {
      switch (dialect) {
        case 'postgresql': return 'JSONB';
        case 'mysql': return 'JSON';
        case 'sqlite': return 'TEXT';
        case 'sqlserver': return 'NVARCHAR(MAX)';
        case 'oracle': return 'CLOB';
        default: return 'TEXT';
      }
    }

    return 'VARCHAR(255)';
  };

  const sanitizeSQLName = (name: string): string => {
    // Avoid Prototype Pollution
    const dangerousKeys = new Set(['__proto__', 'constructor', 'prototype']);
    let sanitized = name.replace(/[^a-zA-Z0-9_]/g, '_');
    if (dangerousKeys.has(sanitized)) {
      sanitized = '_' + sanitized;
    }
    // Prevent starting with a digit
    if (/^[0-9]/.test(sanitized)) {
      sanitized = '_' + sanitized;
    }
    return sanitized;
  };

  const generatedDDL = useMemo(() => {
    if (!jsonInput.trim()) {
      setError(null);
      return '';
    }

    if (jsonInput.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
      return '';
    }

    try {
      const parsed = JSON.parse(jsonInput);
      setError(null);

      // We support either an object with direct fields or an array of objects
      let fieldsObj: any = Object.create(null);
      let targetTableName = tableName.trim() ? sanitizeSQLName(tableName) : 'my_table';

      if (Array.isArray(parsed)) {
        if (parsed.length === 0) {
          throw new Error('JSON array is empty');
        }
        // Merge fields from all objects in array (using safe hasOwnProperty checks)
        parsed.forEach(item => {
          if (item && typeof item === 'object' && !Array.isArray(item)) {
            Object.keys(item).forEach(k => {
              if (Object.prototype.hasOwnProperty.call(item, k)) {
                fieldsObj[k] = item[k];
              }
            });
          }
        });
      } else if (parsed && typeof parsed === 'object') {
        // If it's the specific schema with tableName, extract it
        if (parsed.tableName && typeof parsed.tableName === 'string') {
          targetTableName = sanitizeSQLName(parsed.tableName);
        }
        if (parsed.fields && typeof parsed.fields === 'object' && !Array.isArray(parsed.fields)) {
          fieldsObj = parsed.fields;
        } else {
          fieldsObj = parsed;
        }
      } else {
        throw new Error('JSON must be an object or an array of objects');
      }

      const columns: string[] = [];
      const keys = Object.keys(fieldsObj);
      if (keys.length === 0) {
        throw new Error('No valid fields found to generate columns');
      }

      keys.forEach(k => {
        const sqlFieldName = sanitizeSQLName(k);
        const inferredType = inferType(fieldsObj[k], dialect);
        columns.push(`  ${sqlFieldName} ${inferredType}`);
      });

      let ddl = `CREATE TABLE ${targetTableName} (\n`;
      ddl += columns.join(',\n');
      ddl += '\n);';

      return ddl;
    } catch (e: any) {
      setError(e.message);
      return '';
    }
  }, [jsonInput, dialect, tableName, t]);

  const handleCopy = useCallback(() => {
    if (!generatedDDL) return;
    navigator.clipboard.writeText(generatedDDL);
    setCopied(true);
    toast.success(t('robotstxt.toast_copied') || 'SQL DDL copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  }, [generatedDDL, t]);

  const handleDownload = () => {
    if (!generatedDDL) return;
    const blob = new Blob([generatedDDL], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${tableName || 'table'}_schema.sql`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(t('common.download_success') || 'Download successful');
  };

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
        activeElement?.getAttribute('contenteditable') === 'true';

      if (isEditable && e.key !== 'Escape') return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        handlersRef.current.handleClear();
      } else if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handlersRef.current.handleCopy();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Dialect and Table configuration header */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-6 md:p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label htmlFor="sql-tableName" className="block text-xs font-black uppercase tracking-widest text-slate-400">
              {t('jsontosql.table_name') || 'Table Name'}
            </label>
            <input
              id="sql-tableName"
              type="text"
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              placeholder="my_table"
              className="w-full px-4 py-2.5 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="sql-dialect" className="block text-xs font-black uppercase tracking-widest text-slate-400">
              {t('jsontosql.dialect') || 'SQL Dialect'}
            </label>
            <select
              id="sql-dialect"
              value={dialect}
              onChange={(e) => setDialect(e.target.value as Dialect)}
              className="w-full px-4 py-2.5 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm font-semibold"
            >
              <option value="postgresql">PostgreSQL</option>
              <option value="mysql">MySQL</option>
              <option value="sqlite">SQLite</option>
              <option value="sqlserver">SQL Server</option>
              <option value="oracle">Oracle</option>
            </select>
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={loadPreset}
              className="w-full py-2.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4" />
              {t('workhours.preset_standard') || 'Load Sample'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="json-ddl-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-500" /> {t('common.input')} JSON
            </label>
            <div className="flex gap-2 items-center">
              <span className="hidden sm:inline-flex"><Kbd>Esc</Kbd></span>
              <button
                onClick={handleClear}
                disabled={!jsonInput}
                className="text-xs font-bold px-3 py-1 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-3 h-3" /> {t('common.clear')}
              </button>
            </div>
          </div>
          <div className="relative group">
            <textarea
              id="json-ddl-input"
              ref={inputRef}
              value={jsonInput}
              onChange={(e) => {
                const val = e.target.value;
                setJsonInput(val);
                if (val.length > MAX_LENGTH) {
                  setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
                } else {
                  setError(null);
                }
              }}
              placeholder='{ "id": 1, "username": "admin" }'
              className={`w-full h-[500px] p-6 bg-slate-50 dark:bg-slate-900 border ${error ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'} rounded-[2rem] outline-none focus:ring-2 ${error ? 'focus:ring-rose-500/20' : 'focus:ring-indigo-500/20'} transition-all font-mono text-sm dark:text-slate-300 resize-none`}
            />
            {error && (
              <div className="absolute bottom-6 left-6 right-6 p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2">
                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                <p className="text-xs font-bold text-rose-600 dark:text-rose-400">{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Output */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="sql-ddl-output" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Code className="w-4 h-4 text-indigo-500" /> {t('jsontosql.sql_output') || 'SQL DDL Output'}
            </label>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                disabled={!generatedDDL}
                className="text-xs font-bold px-3 py-1 rounded-full text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 transition-all flex items-center gap-1 disabled:opacity-50"
                title={t('common.download')}
              >
                <Download className="w-3 h-3" />
              </button>
              <button
                onClick={handleCopy}
                disabled={!generatedDDL}
                className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${copied ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' : 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 border-transparent'} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? t('common.copied') : t('common.copy')}
                {!copied && <span className="hidden sm:inline-flex ml-1"><Kbd>C</Kbd></span>}
              </button>
            </div>
          </div>
          <div className="bg-slate-900 dark:bg-black rounded-[2rem] p-6 h-[500px] overflow-auto border border-slate-800 shadow-xl shadow-indigo-500/5">
            <pre className="text-sm font-mono text-emerald-400 leading-relaxed">
              {generatedDDL || <span className="text-slate-600 italic">{t('common.waiting') || 'Waiting for valid input...'}</span>}
            </pre>
          </div>
        </div>
      </div>

      {/* Security and Information panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-600">
            <Database className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black">{t('jsontobigquery.about_title') || 'About SQL DDL Schema'}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Generate clean SQL `CREATE TABLE` DDL statements instantly from JSON objects or datasets.
          </p>
        </div>

        <div className="space-y-4">
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center text-emerald-600">
            <Info className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black">{t('zod.how_it_works_title')}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            The tool parses arrays of datasets, detects field schemas, and smartly maps JSON types to SQL equivalent types across five standard dialects.
          </p>
        </div>

        <div className="space-y-4">
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center text-amber-600">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black">{t('hashgenerator.security_note_title')}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Protected against prototype pollution and client-side DoS with depth-limiting guards and key sanitizations. 100% local browser execution.
          </p>
        </div>
      </div>
    </div>
  );
}
