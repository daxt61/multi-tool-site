import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Database, FileCode, Copy, Check, Trash2, AlertCircle, Download, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

const MAX_LENGTH = 100000;

type CasingOption = 'UPPERCASE' | 'snake_case' | 'camelCase' | 'original';
type SnowflakeTableType = 'PERMANENT' | 'TRANSIENT' | 'TEMPORARY';

interface Preset {
  id: string;
  label: string;
  data: string;
}

const SNOWFLAKE_PRESETS: Preset[] = [
  {
    id: 'dw_catalog',
    label: 'Cloud Data Warehouse Catalog',
    data: `CREATE TABLE dw_products (
  product_id INT PRIMARY KEY,
  product_name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  price DECIMAL(10,2) NOT NULL,
  attributes JSON,
  is_discontinued BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP
);`
  },
  {
    id: 'user_directory',
    label: 'User Directory & Roles',
    data: `CREATE TABLE users (
  user_id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(100),
  role VARCHAR(50) DEFAULT 'member',
  metadata JSON,
  registered_at DATE NOT NULL,
  last_active_at DATETIME
);`
  },
  {
    id: 'event_telemetry',
    label: 'Event Telemetry & Variant Logs',
    data: `CREATE TABLE telemetry_events (
  event_id VARCHAR(64) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  user_id INT,
  device_info JSON,
  payload JSON,
  server_timestamp TIMESTAMP NOT NULL
);`
  }
];

export function SQLToSnowflake({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [input, setInput] = useState<string>(initialData?.input || SNOWFLAKE_PRESETS[0].data);
  const [output, setOutput] = useState<string>(initialData?.output || '');
  const [error, setError] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [activePreset, setActivePreset] = useState<string | null>('dw_catalog');
  const [casing, setCasing] = useState<CasingOption>('UPPERCASE');
  const [tableType, setTableType] = useState<SnowflakeTableType>('PERMANENT');
  const [clusterByKeys, setClusterByKeys] = useState<string>('');
  const [useOrReplace, setUseOrReplace] = useState<boolean>(true);
  const [retentionDays, setRetentionDays] = useState<number>(1);

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

    if (style === 'UPPERCASE') {
      return words.map((w) => w.toUpperCase()).join('_');
    }

    if (style === 'snake_case') {
      return words.map((w) => w.toLowerCase()).join('_');
    }

    if (style === 'camelCase') {
      return words
        .map((w, i) =>
          i === 0
            ? w.toLowerCase()
            : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
        )
        .join('');
    }

    return str;
  };

  const sanitizeName = (key: string, style: CasingOption): string => {
    let transformed = transformCase(key, style);
    let safeKey = transformed.replace(/[^a-zA-Z0-9_]/g, '_');
    if (/^[0-9]/.test(safeKey)) safeKey = '_' + safeKey;
    if (['__proto__', 'constructor', 'prototype'].includes(key) || !safeKey) {
      safeKey = '_' + (safeKey || 'COLUMN');
    }
    return safeKey;
  };

  const mapSqlTypeToSnowflake = (typeStr: string): string => {
    const clean = typeStr.toUpperCase().trim();

    if (clean.includes('BIGINT') || clean.includes('INT8')) return 'NUMBER(38, 0)';
    if (clean.includes('SMALLINT') || clean.includes('INT2')) return 'NUMBER(5, 0)';
    if (clean.includes('TINYINT')) return 'NUMBER(3, 0)';
    if (clean.includes('INT') || clean.includes('SERIAL')) return 'NUMBER(38, 0)';
    if (clean.includes('FLOAT') || clean.includes('DOUBLE') || clean.includes('REAL')) return 'FLOAT';
    if (clean.includes('DECIMAL') || clean.includes('NUMERIC')) {
      const match = clean.match(/\(\s*(\d+)\s*,\s*(\d+)\s*\)/);
      if (match) return `NUMBER(${match[1]}, ${match[2]})`;
      return 'NUMBER(38, 4)';
    }
    if (clean.includes('BOOL')) return 'BOOLEAN';
    if (clean.includes('TIMESTAMPTZ')) return 'TIMESTAMP_TZ';
    if (clean.includes('TIMESTAMP')) return 'TIMESTAMP_NTZ';
    if (clean.includes('DATETIME')) return 'TIMESTAMP_NTZ';
    if (clean.includes('DATE')) return 'DATE';
    if (clean.includes('TIME')) return 'TIME';
    if (clean.includes('JSON')) return 'VARIANT';
    if (clean.includes('ARRAY')) return 'ARRAY';
    if (clean.includes('BLOB') || clean.includes('BYTEA') || clean.includes('BINARY')) return 'BINARY';

    return 'VARCHAR(16777216)';
  };

  const parseSqlDdl = (sql: string) => {
    const tableMatch = sql.match(/CREATE\ TABLE\s+(?:IF\ NOT\ EXISTS\s+)?\`?([a-zA-Z0-9_\.]+)\`?\s*\(([\s\S]*)\)/i);
    if (!tableMatch) {
      throw new Error('No valid CREATE TABLE statement found');
    }

    let fullTableName = tableMatch[1].replace(/[\`\"\[\]]/g, '');
    const rawTableName = fullTableName.includes('.') ? fullTableName.split('.').pop()! : fullTableName;
    const tableName = sanitizeName(rawTableName, casing);
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

    const columns: Array<{ name: string; type: string; isNotNull: boolean; isPrimaryKey: boolean }> = [];
    let primaryKeyCols: string[] = [];

    for (const rawLine of linesToProcess) {
      const line = rawLine.trim();
      if (!line) continue;

      if (/^PRIMARY\ KEY\b/i.test(line)) {
        const pkMatch = line.match(/PRIMARY\ KEY\s*\(([^)]+)\)/i);
        if (pkMatch) {
          primaryKeyCols = pkMatch[1].split(',').map((c) => sanitizeName(c.trim().replace(/[\`\"\[\]]/g, ''), casing));
        }
        continue;
      }

      if (/^(FOREIGN\ KEY|UNIQUE|CONSTRAINT|CHECK|INDEX|KEY)\b/i.test(line)) {
        continue;
      }

      const columnMatch = line.match(/^\`?([a-zA-Z0-9_]+)\`?\s+([a-zA-Z0-9_\(\),\s]+)(.*)$/);
      if (columnMatch) {
        const rawColName = columnMatch[1];
        const rawType = columnMatch[2].split(/\s+/)[0];

        const colName = sanitizeName(rawColName, casing);
        const sfType = mapSqlTypeToSnowflake(rawType);
        const isNotNull = /NOT\ NULL/i.test(line);
        const isInlinePk = /PRIMARY\ KEY/i.test(line);

        if (isInlinePk && !primaryKeyCols.includes(colName)) {
          primaryKeyCols.push(colName);
        }

        columns.push({
          name: colName,
          type: sfType,
          isNotNull: isNotNull || isInlinePk,
          isPrimaryKey: isInlinePk
        });
      }
    }

    return { tableName, columns, primaryKeyCols };
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

      const { tableName, columns, primaryKeyCols } = parseSqlDdl(input);

      if (columns.length === 0) {
        setError('No valid columns found in CREATE TABLE statement');
        return;
      }

      const columnDefs = columns.map((col) => {
        const notNull = col.isNotNull ? ' NOT NULL' : '';
        return `  ${col.name} ${col.type}${notNull}`;
      });

      if (primaryKeyCols.length > 0) {
        columnDefs.push(`  PRIMARY KEY (${primaryKeyCols.join(', ')})`);
      }

      let createKeyword = 'CREATE';
      if (useOrReplace) {
        createKeyword = 'CREATE OR REPLACE';
      }

      let tableModifier = '';
      if (tableType === 'TRANSIENT') {
        tableModifier = ' TRANSIENT';
      } else if (tableType === 'TEMPORARY') {
        tableModifier = ' TEMPORARY';
      }

      let ddl = `${createKeyword}${tableModifier} TABLE ${tableName} (\n`;
      ddl += columnDefs.join(',\n');
      ddl += `\n)`;

      if (clusterByKeys.trim()) {
        ddl += `\nCLUSTER BY (${clusterByKeys.trim()})`;
      }

      if (tableType === 'PERMANENT' && retentionDays > 0) {
        ddl += `\nDATA_RETENTION_TIME_IN_DAYS = ${retentionDays}`;
      }

      ddl += ';';

      setOutput(ddl);
      setError('');
    } catch (e: any) {
      setError('SQL Parsing Error: ' + (e.message || e));
    }
  }, [input, casing, tableType, clusterByKeys, useOrReplace, retentionDays, t]);

  useEffect(() => {
    handleConvert();
  }, [handleConvert]);

  useEffect(() => {
    onStateChange?.({ input, output, casing, tableType, clusterByKeys, useOrReplace, retentionDays });
  }, [input, output, casing, tableType, clusterByKeys, useOrReplace, retentionDays, onStateChange]);

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
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `snowflake-schema-${Date.now()}.sql`;
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
            {t('sqltosnowflake.presets_title') || 'Quick Start SQL Presets'}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {SNOWFLAKE_PRESETS.map((preset) => (
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
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label htmlFor="sql-snowflake-table-type" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            {t('sqltosnowflake.table_type') || 'Table Type'}
          </label>
          <select
            id="sql-snowflake-table-type"
            value={tableType}
            onChange={(e) => setTableType(e.target.value as SnowflakeTableType)}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="PERMANENT">PERMANENT</option>
            <option value="TRANSIENT">TRANSIENT</option>
            <option value="TEMPORARY">TEMPORARY</option>
          </select>
        </div>

        <div>
          <label htmlFor="sql-snowflake-casing" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            {t('sqltosnowflake.casing') || 'Field Casing'}
          </label>
          <select
            id="sql-snowflake-casing"
            value={casing}
            onChange={(e) => setCasing(e.target.value as CasingOption)}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="UPPERCASE">UPPERCASE (Snowflake Default)</option>
            <option value="snake_case">snake_case</option>
            <option value="camelCase">camelCase</option>
            <option value="original">Original</option>
          </select>
        </div>

        <div>
          <label htmlFor="sql-snowflake-clusterby" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            {t('sqltosnowflake.cluster_by') || 'Cluster By Keys'}
          </label>
          <input
            id="sql-snowflake-clusterby"
            type="text"
            value={clusterByKeys}
            onChange={(e) => setClusterByKeys(e.target.value)}
            placeholder="e.g. registered_at, role"
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-col justify-center space-y-2 pt-2">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={useOrReplace}
              onChange={(e) => setUseOrReplace(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
            />
            {t('sqltosnowflake.use_or_replace') || 'CREATE OR REPLACE TABLE'}
          </label>
        </div>
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
              <label htmlFor="sql-snowflake-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('sqltosnowflake.input_label') || 'SQL DDL Input'}
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
            id="sql-snowflake-input"
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
              <label htmlFor="snowflake-output" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('sqltosnowflake.output_label') || 'Snowflake SQL DDL Output'}
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
            id="snowflake-output"
            value={output}
            readOnly
            placeholder={t('sqltosnowflake.placeholder_output') || 'Snowflake SQL DDL statement will appear here...'}
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
          <h4 className="font-bold dark:text-white">{t('sqltosnowflake.about_title') || 'SQL DDL to Snowflake Schema'}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('sqltosnowflake.about_text') ||
              'Convert standard SQL CREATE TABLE DDL queries (from PostgreSQL, MySQL, SQLite, or Oracle) into Snowflake Cloud Data Warehouse SQL DDL statements.'}
          </p>
          <ul className="text-sm text-slate-500 dark:text-slate-400 space-y-2 list-disc pl-5">
            <li>{t('sqltosnowflake.list_item_1') || 'Maps SQL column types to Snowflake types (NUMBER, FLOAT, VARCHAR, TIMESTAMP_NTZ, VARIANT, ARRAY).'}</li>
            <li>{t('sqltosnowflake.list_item_2') || 'Supports Snowflake table types (PERMANENT, TRANSIENT, TEMPORARY) and CLUSTER BY keys.'}</li>
            <li>{t('sqltosnowflake.list_item_3') || 'Configures column name casing (UPPERCASE, snake_case) and DATA_RETENTION_TIME_IN_DAYS.'}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
