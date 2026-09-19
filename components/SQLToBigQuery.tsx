import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Database, FileCode, Copy, Check, Trash2, AlertCircle, Download, Sparkles, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

const MAX_LENGTH = 100000;

type CasingOption = 'original' | 'camelCase' | 'snake_case' | 'PascalCase';
type OutputFormatMode = 'json_schema' | 'sql_ddl';

interface Preset {
  id: string;
  label: string;
  data: string;
}

const SQL_BIGQUERY_PRESETS: Preset[] = [
  {
    id: 'ecommerce_orders',
    label: 'E-Commerce Orders',
    data: `CREATE TABLE orders (
  order_id INT PRIMARY KEY,
  customer_id INT NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  is_paid BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL,
  shipping_address TEXT,
  items JSON
);`
  },
  {
    id: 'user_profiles',
    label: 'User Accounts & Profiles',
    data: `CREATE TABLE users (
  user_id VARCHAR(36) NOT NULL,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(100),
  bio TEXT,
  age INT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  joined_at DATE NOT NULL,
  last_login_at DATETIME
);`
  },
  {
    id: 'analytics_events',
    label: 'Analytics Events Log',
    data: `CREATE TABLE event_logs (
  event_id VARCHAR(64) NOT NULL,
  event_name VARCHAR(100) NOT NULL,
  user_id INT,
  session_id VARCHAR(128),
  payload JSON,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP NOT NULL
);`
  }
];

export function SQLToBigQuery({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [input, setInput] = useState(initialData?.input || SQL_BIGQUERY_PRESETS[0].data);
  const [output, setOutput] = useState(initialData?.output || '');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>('ecommerce_orders');
  const [casing, setCasing] = useState<CasingOption>('original');
  const [outputFormat, setOutputFormat] = useState<OutputFormatMode>('json_schema');
  const [datasetName, setDatasetName] = useState('analytics');

  const primaryInputRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const transformCase = (str: string, style: CasingOption): string => {
    if (style === 'original' || !str) return str;

    const words = str
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/[^a-zA-Z0-9]/g, ' ')
      .trim()
      .split(/\s+/);

    if (words.length === 0 || (words.length === 1 && !words[0])) return str;

    if (style === 'camelCase') {
      return words
        .map((w, i) =>
          i === 0
            ? w.toLowerCase()
            : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
        )
        .join('');
    }

    if (style === 'snake_case') {
      return words.map((w) => w.toLowerCase()).join('_');
    }

    if (style === 'PascalCase') {
      return words
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join('');
    }

    return str;
  };

  const sanitizeBigQueryName = (key: string, style: CasingOption): string => {
    let transformed = transformCase(key, style);
    let safeKey = transformed.replace(/[^a-zA-Z0-9_]/g, '_');
    if (/^[0-9]/.test(safeKey)) safeKey = '_' + safeKey;
    if (['__proto__', 'constructor', 'prototype'].includes(key) || !safeKey) {
      safeKey = '_' + (safeKey || 'field');
    }
    return safeKey;
  };

  const mapSqlTypeToBigQuery = (typeStr: string): string => {
    const cleanType = typeStr.toUpperCase().trim();

    if (cleanType.includes('INT') || cleanType.includes('SERIAL')) return 'INT64';
    if (cleanType.includes('FLOAT') || cleanType.includes('DOUBLE') || cleanType.includes('REAL')) return 'FLOAT64';
    if (cleanType.includes('DECIMAL') || cleanType.includes('NUMERIC')) return 'NUMERIC';
    if (cleanType.includes('BOOL')) return 'BOOL';
    if (cleanType.includes('TIMESTAMP') || cleanType.includes('TIMESTAMPTZ')) return 'TIMESTAMP';
    if (cleanType.includes('DATETIME')) return 'DATETIME';
    if (cleanType.includes('DATE')) return 'DATE';
    if (cleanType.includes('TIME')) return 'TIME';
    if (cleanType.includes('BLOB') || cleanType.includes('BYTEA') || cleanType.includes('BINARY')) return 'BYTES';
    if (cleanType.includes('JSON')) return 'JSON';
    if (cleanType.includes('GEOMETRY') || cleanType.includes('GEOGRAPHY')) return 'GEOGRAPHY';

    return 'STRING';
  };

  const parseSqlDdl = (sql: string): { tableName: string; fields: any[] } => {
    // Basic CREATE TABLE parser
    const tableMatch = sql.match(/CREATE\ TABLE\s+(?:IF\ NOT\ EXISTS\s+)?\`?([a-zA-Z0-9_\.]+)\`?\s*\(([\s\S]*)\)/i);
    if (!tableMatch) {
      throw new Error('No valid CREATE TABLE statement found');
    }

    let fullTableName = tableMatch[1].replace(/[\`\"\[\]]/g, '');
    const tableName = fullTableName.includes('.') ? fullTableName.split('.').pop()! : fullTableName;
    const body = tableMatch[2];

    const lines = body.split(',\n');
    const fields: any[] = [];

    // Helper to process line-by-line
    const linesToProcess: string[] = [];
    let currentLine = '';
    let parenDepth = 0;

    for (let i = 0; i < body.length; i++) {
      const char = body[i];
      if (char === '(') parenDepth++;
      if (char === ')') parenDepth--;

      if (char === ',' && parenDepth === 0) {
        linesToProcess.push(currentLine.trim());
        currentLine = '';
      } else {
        currentLine += char;
      }
    }
    if (currentLine.trim()) {
      linesToProcess.push(currentLine.trim());
    }

    for (const rawLine of linesToProcess) {
      const line = rawLine.trim();
      if (!line) continue;

      // Skip table-level constraints
      if (
        /^(PRIMARY\ KEY|FOREIGN\ KEY|UNIQUE|CONSTRAINT|CHECK|INDEX|KEY)\b/i.test(line)
      ) {
        continue;
      }

      const columnMatch = line.match(/^\`?([a-zA-Z0-9_]+)\`?\s+([a-zA-Z0-9_\(\),\s]+)(.*)$/);
      if (columnMatch) {
        const colName = columnMatch[1];
        const rawType = columnMatch[2].split(/\s+/)[0];
        const rest = columnMatch[3] || '';

        const bqType = mapSqlTypeToBigQuery(rawType);
        const isNotNull = /NOT\ NULL/i.test(line);
        const isArray = /ARRAY/i.test(line) || /\[\]/.test(line);

        const field: any = Object.create(null);
        field.name = sanitizeBigQueryName(colName, casing);
        field.type = bqType;
        field.mode = isArray ? 'REPEATED' : isNotNull ? 'REQUIRED' : 'NULLABLE';

        fields.push(field);
      }
    }

    return { tableName, fields };
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

      const { tableName, fields } = parseSqlDdl(input);

      if (fields.length === 0) {
        setError('No valid columns found in CREATE TABLE statement');
        return;
      }

      if (outputFormat === 'sql_ddl') {
        const cleanDataset = datasetName.trim().replace(/[^a-zA-Z0-9_]/g, '') || 'dataset';
        const cleanTable = tableName.trim().replace(/[^a-zA-Z0-9_]/g, '') || 'table';

        const bodyLines = fields.map((f) => {
          const notNull = f.mode === 'REQUIRED' ? ' NOT NULL' : '';
          if (f.mode === 'REPEATED') {
            return `  ${f.name} ARRAY<${f.type}>`;
          }
          return `  ${f.name} ${f.type}${notNull}`;
        });

        const sqlDdlOutput = `CREATE TABLE \`${cleanDataset}.${cleanTable}\` (\n${bodyLines.join(',\n')}\n);`;
        setOutput(sqlDdlOutput);
      } else {
        setOutput(JSON.stringify(fields, null, 2));
      }
      setError('');
    } catch (e: any) {
      setError('SQL Parsing Error: ' + e.message);
    }
  }, [input, casing, outputFormat, datasetName, t]);

  useEffect(() => {
    handleConvert();
  }, [handleConvert]);

  useEffect(() => {
    onStateChange?.({ input, output, casing, outputFormat, datasetName });
  }, [input, output, casing, outputFormat, datasetName, onStateChange]);

  const handleClear = useCallback(() => {
    setInput('');
    setOutput('');
    setError('');
    setActivePreset(null);
    toast.success(t('common.cleared', { defaultValue: 'Cleared' }));
    primaryInputRef.current?.focus();
  }, [t]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success(t('common.copied', { defaultValue: 'Copied to clipboard' }));
    setTimeout(() => setCopied(false), 2000);
  }, [output, t]);

  const handlersRef = useRef({ handleClear, handleCopy });
  useEffect(() => {
    handlersRef.current = { handleClear, handleCopy };
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!containerRef.current || !containerRef.current.contains(document.activeElement)) {
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        handlersRef.current.handleClear();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        const selectedText = window.getSelection()?.toString();
        if (!selectedText) {
          e.preventDefault();
          handlersRef.current.handleCopy();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleApplyPreset = (preset: Preset) => {
    setInput(preset.data);
    setActivePreset(preset.id);
    toast.success(t('common.preset_applied', { name: preset.label, defaultValue: `Applied preset: ${preset.label}` }));
    primaryInputRef.current?.focus();
  };

  const handleDownload = () => {
    if (!output) return;
    const isSql = outputFormat === 'sql_ddl';
    const extension = isSql ? 'sql' : 'json';
    const mimeType = isSql ? 'text/plain' : 'application/json';
    const blob = new Blob([output], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bq-schema-sql-${Date.now()}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(t('common.downloaded') || 'Downloaded file');
  };

  return (
    <div ref={containerRef} className="max-w-6xl mx-auto space-y-8">
      {/* Quick Start Presets */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2 mb-3 px-1">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {t('sqltobigquery.presets_title') || 'Quick Start SQL Presets'}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {SQL_BIGQUERY_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleApplyPreset(preset)}
              aria-pressed={activePreset === preset.id}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                activePreset === preset.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Configuration Controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="sql-bq-output-format" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            {t('sqltobigquery.output_format') || 'Output Mode'}
          </label>
          <select
            id="sql-bq-output-format"
            value={outputFormat}
            onChange={(e) => setOutputFormat(e.target.value as OutputFormatMode)}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="json_schema">JSON Schema Array</option>
            <option value="sql_ddl">BigQuery CREATE TABLE DDL</option>
          </select>
        </div>

        <div>
          <label htmlFor="sql-bq-casing-select" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            {t('sqltobigquery.field_casing') || 'Field Casing'}
          </label>
          <select
            id="sql-bq-casing-select"
            value={casing}
            onChange={(e) => setCasing(e.target.value as CasingOption)}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="original">Original</option>
            <option value="snake_case">snake_case</option>
            <option value="camelCase">camelCase</option>
            <option value="PascalCase">PascalCase</option>
          </select>
        </div>

        {outputFormat === 'sql_ddl' && (
          <div>
            <label htmlFor="sql-bq-dataset-name" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Dataset Name
            </label>
            <input
              id="sql-bq-dataset-name"
              type="text"
              value={datasetName}
              onChange={(e) => setDatasetName(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        )}
      </div>

      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      {/* Editor & Output Pane */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-500" />
              <label htmlFor="sql-bq-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('sqltobigquery.input_label') || 'SQL DDL Input'}
              </label>
            </div>
            <div className="flex gap-2 items-center">
              <kbd className="hidden sm:inline-flex items-center justify-center px-1.5 py-0.5 border border-rose-200 dark:border-rose-800 rounded text-[10px] font-bold text-rose-400 bg-white dark:bg-slate-900">
                Esc
              </kbd>
              <button
                onClick={handleClear}
                disabled={!input && !output}
                className="text-xs font-bold px-3 py-1 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
              >
                <Trash2 className="w-3 h-3" /> {t('common.clear') || 'Clear'}
              </button>
            </div>
          </div>
          <textarea
            id="sql-bq-input"
            ref={primaryInputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setActivePreset(null);
            }}
            placeholder="CREATE TABLE my_table (id INT PRIMARY KEY, name VARCHAR(100) NOT NULL);"
            className="w-full h-96 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-emerald-500" />
              <label htmlFor="sql-bq-output" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('sqltobigquery.output_label') || 'BigQuery Schema Output'}
              </label>
            </div>
            <div className="flex gap-2 items-center">
              <kbd className="hidden sm:inline-flex items-center justify-center px-1.5 py-0.5 border border-slate-200 dark:border-slate-800 rounded text-[10px] font-bold text-slate-400 bg-white dark:bg-slate-900">
                Ctrl+C
              </kbd>
              <button
                onClick={handleDownload}
                disabled={!output}
                className="text-xs font-bold px-3 py-1 rounded-full text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all flex items-center gap-1 disabled:opacity-50"
              >
                <Download className="w-3 h-3" /> {t('common.download') || 'Download'}
              </button>
              <button
                onClick={handleCopy}
                disabled={!output}
                className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                  copied
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                    : 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}{' '}
                {copied ? t('common.copied') || 'Copied' : t('common.copy') || 'Copy'}
              </button>
            </div>
          </div>
          <textarea
            id="sql-bq-output"
            value={output}
            readOnly
            placeholder={t('sqltobigquery.placeholder_output') || 'BigQuery schema will appear here...'}
            className="w-full h-96 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>
      </div>

      {/* Educational / Documentation Footer */}
      <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-8 rounded-[2rem] flex items-start gap-6">
        <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0">
          <Database className="w-6 h-6" />
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white">{t('sqltobigquery.about_title') || 'SQL DDL to BigQuery Schema'}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('sqltobigquery.about_text') ||
              'Convert standard SQL CREATE TABLE DDL queries (from PostgreSQL, MySQL, SQLite, Oracle, or SQL Server) into Google Cloud BigQuery JSON Schema or BigQuery SQL DDL.'}
          </p>
          <ul className="text-sm text-slate-500 dark:text-slate-400 space-y-2 list-disc pl-5">
            <li>{t('sqltobigquery.list_item_1') || 'Converts SQL data types (INT, VARCHAR, TIMESTAMP, DECIMAL, JSON) to BigQuery types.'}</li>
            <li>{t('sqltobigquery.list_item_2') || 'Handles column nullability (NOT NULL -> REQUIRED, default NULLABLE).'}</li>
            <li>{t('sqltobigquery.list_item_3') || 'Supports field casing transformations and output as JSON Schema or BigQuery DDL.'}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
