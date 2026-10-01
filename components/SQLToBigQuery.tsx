import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Database, FileCode, Copy, Check, Trash2, AlertCircle, Download, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;

type CasingOption = 'original' | 'camelCase' | 'snake_case' | 'PascalCase';
type OutputFormatMode = 'json_schema' | 'sql_ddl';

interface Preset {
  id: string;
  labelKey: string;
  defaultLabel: string;
  data: string;
}

const SQL_BIGQUERY_PRESETS: Preset[] = [
  {
    id: 'ecommerce_orders',
    labelKey: 'sqltobigquery.preset_ecommerce',
    defaultLabel: 'E-Commerce Orders',
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
    labelKey: 'sqltobigquery.preset_user_auth',
    defaultLabel: 'User Accounts & Profiles',
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
    labelKey: 'sqltobigquery.preset_analytics',
    defaultLabel: 'Analytics Events Log',
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
  const [casing, setCasing] = useState<CasingOption>(initialData?.casing || 'original');
  const [outputFormat, setOutputFormat] = useState<OutputFormatMode>(initialData?.outputFormat || 'json_schema');
  const [datasetName, setDatasetName] = useState(initialData?.datasetName || 'analytics');

  const primaryInputRef = useRef<HTMLTextAreaElement>(null);

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
    const tableMatch = sql.match(/CREATE\ TABLE\s+(?:IF\ NOT\ EXISTS\s+)?\`?([a-zA-Z0-9_\.]+)\`?\s*\(([\s\S]*)\)/i);
    if (!tableMatch) {
      throw new Error('No valid CREATE TABLE statement found');
    }

    let fullTableName = tableMatch[1].replace(/[\`\"\[\]]/g, '');
    const tableName = fullTableName.includes('.') ? fullTableName.split('.').pop()! : fullTableName;
    const body = tableMatch[2];

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

    const fields: any[] = [];

    for (const rawLine of linesToProcess) {
      const line = rawLine.trim();
      if (!line) continue;

      if (
        /^(PRIMARY\ KEY|FOREIGN\ KEY|UNIQUE|CONSTRAINT|CHECK|INDEX|KEY)\b/i.test(line)
      ) {
        continue;
      }

      const columnMatch = line.match(/^\`?([a-zA-Z0-9_]+)\`?\s+([a-zA-Z0-9_\(\),\s]+)(.*)$/);
      if (columnMatch) {
        const colName = columnMatch[1];
        const rawType = columnMatch[2].split(/\s+/)[0];

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
        setError(t('error.max_length_sql', { max: MAX_LENGTH.toLocaleString() }));
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
    toast.success(t('sqltobigquery.toast_cleared') || 'Inputs cleared!');
    setTimeout(() => primaryInputRef.current?.focus(), 50);
  }, [t]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success(t('sqltobigquery.toast_copied') || 'BigQuery schema copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  }, [output, t]);

  const handlersRef = useRef({ handleClear, handleCopy });
  useEffect(() => {
    handlersRef.current = { handleClear, handleCopy };
  }, [handleClear, handleCopy]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable) {
        if (e.key === "Escape") {
          e.preventDefault();
          handlersRef.current.handleClear();
        }
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        handlersRef.current.handleClear();
      } else if (e.key.toLowerCase() === 'c' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        handlersRef.current.handleCopy();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleApplyPreset = (preset: Preset) => {
    setInput(preset.data);
    setActivePreset(preset.id);
    const label = t(preset.labelKey) || preset.defaultLabel;
    toast.success(t('sqltobigquery.preset_loaded', { name: label }) || `Loaded preset: ${label}`);
    setTimeout(() => primaryInputRef.current?.focus(), 50);
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
    link.download = `bq-schema.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(t('sqltobigquery.toast_downloaded') || 'Downloaded BigQuery schema!');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8" role="region" aria-label="SQL DDL to BigQuery Schema Converter">
      {/* Header bar with presets and shortcut badges */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-3xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 mr-1">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            {t('sqltobigquery.presets_title') || 'Quick Start SQL Presets:'}
          </span>
          {SQL_BIGQUERY_PRESETS.map((preset) => {
            const label = t(preset.labelKey) || preset.defaultLabel;
            const isActive = activePreset === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => handleApplyPreset(preset)}
                aria-pressed={isActive}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  isActive
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
            <Kbd modifier={null} className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400">Esc</Kbd>
            {t('common.clear')}
          </span>
          <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400 mr-2">
            <Kbd modifier={null} className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400">C</Kbd>
            {t('common.copy')}
          </span>
          <button
            onClick={handleClear}
            disabled={!input && !output}
            className="text-xs font-bold px-3 py-1.5 rounded-xl text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-all flex items-center gap-1 disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" /> {t('common.clear')}
          </button>
        </div>
      </div>

      {/* Configuration Controls */}
      <div className="p-6 bg-slate-50 dark:bg-slate-900/40 rounded-3xl border border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label htmlFor="sql-bq-output-format" className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">
            {t('sqltobigquery.output_format') || 'Output Mode'}
          </label>
          <select
            id="sql-bq-output-format"
            value={outputFormat}
            onChange={(e) => setOutputFormat(e.target.value as OutputFormatMode)}
            className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="json_schema">JSON Schema Array</option>
            <option value="sql_ddl">BigQuery CREATE TABLE DDL</option>
          </select>
        </div>

        <div>
          <label htmlFor="sql-bq-casing-select" className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">
            {t('sqltobigquery.field_casing') || 'Field Casing'}
          </label>
          <select
            id="sql-bq-casing-select"
            value={casing}
            onChange={(e) => setCasing(e.target.value as CasingOption)}
            className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="original">Original</option>
            <option value="snake_case">snake_case</option>
            <option value="camelCase">camelCase</option>
            <option value="PascalCase">PascalCase</option>
          </select>
        </div>

        {outputFormat === 'sql_ddl' && (
          <div>
            <label htmlFor="sql-bq-dataset-name" className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">
              Dataset Name
            </label>
            <input
              id="sql-bq-dataset-name"
              type="text"
              value={datasetName}
              onChange={(e) => setDatasetName(e.target.value)}
              className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        )}
      </div>

      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold">
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
          </div>
          <textarea
            id="sql-bq-input"
            ref={primaryInputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              if (activePreset) setActivePreset(null);
            }}
            placeholder="CREATE TABLE my_table (id INT PRIMARY KEY, name VARCHAR(100) NOT NULL);"
            className="w-full h-[450px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
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
              <button
                onClick={handleDownload}
                disabled={!output}
                className="text-xs font-bold px-3 py-1.5 rounded-xl text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 transition-all flex items-center gap-1 disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" /> {t('common.download')}
              </button>
              <button
                onClick={handleCopy}
                disabled={!output}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                  copied
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                    : 'text-slate-500 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} {copied ? t('common.copied') : t('common.copy')}
              </button>
            </div>
          </div>
          <textarea
            id="sql-bq-output"
            value={output}
            readOnly
            placeholder={t('sqltobigquery.placeholder_output') || 'BigQuery schema will appear here...'}
            className="w-full h-[450px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-mono text-sm leading-relaxed text-indigo-600 dark:text-indigo-400 resize-none"
          />
        </div>
      </div>

      {/* Educational / Documentation Footer */}
      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <Database className="w-6 h-6 text-indigo-500 mt-1 shrink-0" />
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('sqltobigquery.about_title') || 'SQL DDL to BigQuery Schema'}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('sqltobigquery.about_text') ||
              'Convert standard SQL CREATE TABLE DDL queries (from PostgreSQL, MySQL, SQLite, Oracle, or SQL Server) into Google Cloud BigQuery JSON Schema or BigQuery SQL DDL.'}
          </p>
        </div>
      </div>
    </div>
  );
}
