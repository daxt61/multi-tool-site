import { useState, useEffect, useCallback, useRef } from 'react';
import { FileCode, Copy, Check, Trash2, AlertCircle, Database, Download, Info, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';
import yaml from 'js-yaml';

const MAX_LENGTH = 100000;

type OutputFormat = 'yaml' | 'json';
type OutputMode = 'schemas' | 'full_spec';

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
  const [outputMode, setOutputMode] = useState<OutputMode>(initialData?.outputMode || 'schemas');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ input, format, outputMode });
  }, [input, format, outputMode, onStateChange]);

  const PRESETS = {
    ecommerce: `-- E-Commerce Catalog Schema
CREATE TABLE categories (
  id INT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  parent_id INT DEFAULT NULL
);

CREATE TABLE products (
  id INT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  sku VARCHAR(50) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  category_id INT NOT NULL,
  created_at TIMESTAMP NOT NULL,
  metadata JSON
);`,
    user_auth: `-- User Authentication & Roles Schema
CREATE TABLE users (
  user_id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100),
  is_verified BOOLEAN DEFAULT FALSE,
  login_count INT DEFAULT 0,
  last_login TIMESTAMP,
  created_at TIMESTAMP NOT NULL
);

CREATE TABLE roles (
  role_id INT PRIMARY KEY,
  role_name VARCHAR(50) NOT NULL,
  permissions JSON
);`
  };

  const parseSQL = (sql: string): Table[] => {
    const tables: Table[] = [];
    const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:[`"\[]?(\w+)[`"\]]?\.)?[`"\[]?(\w+)[`"\]]?\s*\(([\s\S]*?)\)(?:;|$)/gim;

    let match;
    while ((match = tableRegex.exec(sql)) !== null) {
      const tableName = match[2];
      const columnSection = match[3];
      const columns: Column[] = [];

      const rawCols: string[] = [];
      let current = '';
      let parenLevel = 0;
      let inQuote = false;
      let quoteChar = '';

      for (let i = 0; i < columnSection.length; i++) {
        const char = columnSection[i];
        if ((char === '"' || char === '`' || char === "'") && (i === 0 || columnSection[i - 1] !== '\\')) {
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
        if (/^(PRIMARY\s+KEY|FOREIGN\s+KEY|CONSTRAINT|UNIQUE|INDEX|CHECK|KEY)\b/i.test(colDef)) continue;

        const parts = colDef.split(/\s+/);
        if (parts.length < 2) continue;

        let colName = parts[0].replace(/[`"\[\]]/g, '');
        const colTypeRaw = parts[1].toLowerCase();

        const isRequired = /\bNOT\s+NULL\b/i.test(colDef) || /\bPRIMARY\s+KEY\b/i.test(colDef);

        let type = 'string';
        let formatStr: string | undefined = undefined;

        if (colTypeRaw.includes('int') || colTypeRaw.includes('serial')) {
          type = 'integer';
          formatStr = colTypeRaw.includes('bigint') ? 'int64' : 'int32';
        } else if (colTypeRaw.includes('float') || colTypeRaw.includes('double') || colTypeRaw.includes('decimal') || colTypeRaw.includes('numeric') || colTypeRaw.includes('real')) {
          type = 'number';
        } else if (colTypeRaw.includes('bool') || colTypeRaw.includes('bit')) {
          type = colTypeRaw.includes('bit') && !colDef.includes('(1)') ? 'string' : 'boolean';
        } else if (colTypeRaw.includes('date')) {
          type = 'string';
          formatStr = colTypeRaw.includes('time') ? 'date-time' : 'date';
        } else if (colTypeRaw.includes('timestamp') || colTypeRaw.includes('datetime')) {
          type = 'string';
          formatStr = 'date-time';
        } else if (colTypeRaw.includes('json')) {
          type = 'object';
        } else if (colTypeRaw.includes('uuid')) {
          type = 'string';
          formatStr = 'uuid';
        }

        columns.push({
          name: colName,
          type,
          format: formatStr,
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
        setError(t('sqltoopenapi.no_tables_found', 'No valid CREATE TABLE statements found.'));
        setOutput('');
        return;
      }

      const schemas: any = Object.create(null);

      tables.forEach(table => {
        const properties: any = Object.create(null);
        const required: string[] = [];

        table.columns.forEach(col => {
          const lower = col.name.toLowerCase();
          const safeKey = (lower === '__proto__' || lower === 'constructor' || lower === 'prototype') ? `_${col.name}` : col.name;

          properties[safeKey] = {
            type: col.type,
          };
          if (col.format) properties[safeKey].format = col.format;
          if (col.required) required.push(safeKey);
        });

        const lowerTable = table.name.toLowerCase();
        const safeTableName = (lowerTable === '__proto__' || lowerTable === 'constructor' || lowerTable === 'prototype') ? `_${table.name}` : table.name;

        schemas[safeTableName] = {
          type: 'object',
          properties,
        };
        if (required.length > 0) {
          schemas[safeTableName].required = required;
        }
      });

      let exportObj: any = schemas;

      if (outputMode === 'full_spec') {
        const pathsObj: any = Object.create(null);

        tables.forEach(table => {
          const lowerTable = table.name.toLowerCase();
          const safeTableName = (lowerTable === '__proto__' || lowerTable === 'constructor' || lowerTable === 'prototype') ? `_${table.name}` : table.name;
          const resourcePath = `/${safeTableName}`;

          pathsObj[resourcePath] = {
            get: {
              summary: `List all ${safeTableName}`,
              responses: {
                '200': {
                  description: 'Successful response',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'array',
                        items: {
                          $ref: `#/components/schemas/${safeTableName}`
                        }
                      }
                    }
                  }
                }
              }
            },
            post: {
              summary: `Create a new ${safeTableName}`,
              requestBody: {
                required: true,
                content: {
                  'application/json': {
                    schema: {
                      $ref: `#/components/schemas/${safeTableName}`
                    }
                  }
                }
              },
              responses: {
                '201': {
                  description: 'Created successfully',
                  content: {
                    'application/json': {
                      schema: {
                        $ref: `#/components/schemas/${safeTableName}`
                      }
                    }
                  }
                }
              }
            }
          };
        });

        exportObj = {
          openapi: '3.0.3',
          info: {
            title: 'Generated API Specification',
            version: '1.0.0',
            description: 'API specification auto-generated from SQL DDL CREATE TABLE statements'
          },
          paths: pathsObj,
          components: {
            schemas
          }
        };
      }

      if (format === 'yaml') {
        setOutput(yaml.dump(exportObj, { indent: 2, noRefs: true }));
      } else {
        setOutput(JSON.stringify(exportObj, null, 2));
      }
      setError('');
    } catch (e: any) {
      setError(t('sqltoopenapi.error_parsing', 'Error parsing SQL DDL') + ': ' + e.message);
      setOutput('');
    }
  }, [input, format, outputMode, t]);

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
    const blob = new Blob([output], { type: format === 'yaml' ? 'text/yaml' : 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `openapi_spec.${format === 'yaml' ? 'yaml' : 'json'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(t('common.downloaded', 'Downloaded OpenAPI specification!'));
  };

  const loadPreset = (presetKey: keyof typeof PRESETS) => {
    setInput(PRESETS[presetKey]);
    toast.success(t('sqltoopenapi.preset_loaded', 'Loaded SQL preset!'));
  };

  const handlersRef = useRef({ handleClear, handleCopy, output });
  useEffect(() => {
    handlersRef.current = { handleClear, handleCopy, output };
  }, [handleClear, handleCopy, output]);

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
            {t('sqltoopenapi.presets_title', 'Clickable Presets')}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => loadPreset('ecommerce')}
            className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 rounded-xl transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
          >
            {t('sqltoopenapi.preset_ecommerce', 'E-Commerce Catalog')}
          </button>
          <button
            onClick={() => loadPreset('user_auth')}
            className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 rounded-xl transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
          >
            {t('sqltoopenapi.preset_user_auth', 'User Auth & Roles')}
          </button>
        </div>
      </div>

      {/* Mode Controls Bar */}
      <div className="flex flex-wrap gap-4 justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-4 rounded-3xl border border-slate-200 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            {(['yaml', 'json'] as OutputFormat[]).map((f) => (
              <button
                key={f}
                onClick={() => setOutputFormat(f)}
                className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                  format === f
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="openapi-output-mode" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              {t('sqltoopenapi.output_mode', 'Output Mode')}:
            </label>
            <select
              id="openapi-output-mode"
              value={outputMode}
              onChange={(e) => setOutputMode(e.target.value as OutputMode)}
              className="p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="schemas">{t('sqltoopenapi.mode_schemas', 'Components Schemas')}</option>
              <option value="full_spec">{t('sqltoopenapi.mode_full_spec', 'Full OpenAPI Document')}</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2 items-center">
          <Kbd modifier={null} className="hidden sm:inline-flex border-rose-200 dark:border-rose-800 text-rose-400 dark:bg-slate-900">Esc</Kbd>
          <button
            onClick={handleClear}
            disabled={!input && !output}
            className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-4 py-2 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
          >
            <Trash2 className="w-3 h-3" aria-hidden="true" /> {t('common.clear')}
          </button>
        </div>
      </div>

      {/* Main Editor Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-500" aria-hidden="true" />
              <label htmlFor="sql-openapi-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('sqltoopenapi.sql_input_label', 'SQL CREATE TABLE DDL')}
              </label>
            </div>
          </div>
          <textarea
            id="sql-openapi-input"
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('sqltoopenapi.placeholder_sql', 'Paste SQL CREATE TABLE DDL statements here...')}
            className="w-full h-[450px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-emerald-500" aria-hidden="true" />
              <label htmlFor="openapi-output" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('sqltoopenapi.output_label', 'OpenAPI Specification')}
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
                title={`${t('common.copy')} (C)`}
              >
                {copied ? <Check className="w-3 h-3" aria-hidden="true" /> : <Copy className="w-3 h-3" aria-hidden="true" />} {copied ? t('common.copied') : t('common.copy')}
                {!copied && input && <Kbd modifier={null} className="hidden sm:inline-flex w-4 h-4 bg-white/50 dark:bg-black/20 ml-1">C</Kbd>}
              </button>
            </div>
          </div>
          <textarea
            id="openapi-output"
            value={output}
            readOnly
            placeholder={t('common.waiting', 'Waiting for input...')}
            className="w-full h-[450px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-mono text-sm leading-relaxed text-indigo-600 dark:text-indigo-400 resize-none"
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
        <Info className="w-6 h-6 text-indigo-500 mt-1" aria-hidden="true" />
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('sqltoopenapi.about_title', 'About SQL to OpenAPI Generator')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('sqltoopenapi.about_text', 'Convert SQL CREATE TABLE statements into OpenAPI 3.0.3 Schema Definitions or full OpenAPI documents. Supports both YAML and JSON formats, with automatic column type mapping, NOT NULL requirement extraction, and custom output modes.')}
          </p>
        </div>
      </div>
    </div>
  );
}
