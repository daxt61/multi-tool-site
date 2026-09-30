import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Database, FileCode, Copy, Check, Trash2, AlertCircle, Download, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

const MAX_LENGTH = 100000;

type CasingOption = 'original' | 'camelCase' | 'snake_case' | 'PascalCase';
type OutputStyle = 'sql_ddl' | 'python_api' | 'parquet_export' | 'node_api';
type TableModifier = 'CREATE TABLE' | 'CREATE OR REPLACE TABLE' | 'CREATE TABLE IF NOT EXISTS' | 'CREATE TEMP TABLE';

interface Preset {
  id: string;
  label: string;
  data: string;
}

const DUCKDB_PRESETS: Preset[] = [
  {
    id: 'ecommerce_analytics',
    label: 'E-Commerce Analytics',
    data: `CREATE TABLE orders (
  order_id BIGINT PRIMARY KEY,
  customer_id UUID NOT NULL,
  order_status VARCHAR(50) DEFAULT 'completed',
  total_amount DECIMAL(18,4) NOT NULL,
  discount_amount DECIMAL(18,4) DEFAULT 0.0,
  tax_amount DECIMAL(18,4) DEFAULT 0.0,
  is_first_order BOOLEAN DEFAULT FALSE,
  payment_method VARCHAR(50),
  shipping_address TEXT,
  placed_at TIMESTAMP_TZ NOT NULL,
  updated_at TIMESTAMP_TZ
);`
  },
  {
    id: 'user_event_log',
    label: 'User Event Log & Metrics',
    data: `CREATE TABLE user_events (
  event_id UUID NOT NULL PRIMARY KEY,
  user_id HUGEINT NOT NULL,
  session_id VARCHAR(64) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  page_url VARCHAR(2048),
  referrer VARCHAR(2048),
  device_category VARCHAR(30),
  browser VARCHAR(50),
  response_time_ms INT,
  is_error BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL
);`
  },
  {
    id: 'parquet_lakehouse',
    label: 'Parquet Lakehouse Pipeline',
    data: `CREATE TABLE sensor_telemetry (
  device_id VARCHAR(100) NOT NULL,
  location_id INT NOT NULL,
  temperature DOUBLE NOT NULL,
  humidity DOUBLE NOT NULL,
  pressure DOUBLE,
  battery_level DECIMAL(5,2),
  status_code SMALLINT DEFAULT 200,
  payload_raw BLOB,
  recorded_at TIMESTAMP NOT NULL
);`
  }
];

export function SQLToDuckDB({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [input, setInput] = useState<string>(initialData?.input || DUCKDB_PRESETS[0].data);
  const [output, setOutput] = useState<string>(initialData?.output || '');
  const [error, setError] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [activePreset, setActivePreset] = useState<string | null>('ecommerce_analytics');
  const [casing, setCasing] = useState<CasingOption>('snake_case');
  const [outputStyle, setOutputStyle] = useState<OutputStyle>('sql_ddl');
  const [tableModifier, setTableModifier] = useState<TableModifier>('CREATE TABLE IF NOT EXISTS');
  const [useStrictDuckDBTypes, setUseStrictDuckDBTypes] = useState<boolean>(true);

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

  const sanitizeName = (key: string, style: CasingOption): string => {
    let transformed = transformCase(key, style);
    let safeKey = transformed.replace(/[^a-zA-Z0-9_]/g, '_');
    if (/^[0-9]/.test(safeKey)) safeKey = '_' + safeKey;
    if (['__proto__', 'constructor', 'prototype'].includes(key) || !safeKey) {
      safeKey = '_' + (safeKey || 'column');
    }
    return safeKey;
  };

  const mapSqlTypeToDuckDB = (typeStr: string): string => {
    const clean = typeStr.toUpperCase().trim();

    if (clean.includes('HUGEINT')) return 'HUGEINT';
    if (clean.includes('UBIGINT')) return 'UBIGINT';
    if (clean.includes('UINTEGER') || clean.includes('UINT')) return 'UINTEGER';
    if (clean.includes('USMALLINT')) return 'USMALLINT';
    if (clean.includes('UTINYINT')) return 'UTINYINT';

    if (clean.includes('BIGINT')) return 'BIGINT';
    if (clean.includes('SMALLINT')) return 'SMALLINT';
    if (clean.includes('TINYINT')) return 'TINYINT';
    if (clean.includes('INT') || clean.includes('SERIAL')) return 'INTEGER';

    if (clean.includes('FLOAT') || clean.includes('REAL')) return 'FLOAT';
    if (clean.includes('DOUBLE') || clean.includes('PRECISION')) return 'DOUBLE';
    if (clean.includes('DECIMAL') || clean.includes('NUMERIC')) {
      const match = clean.match(/\(\s*(\d+)\s*,\s*(\d+)\s*\)/);
      if (match) return `DECIMAL(${match[1]}, ${match[2]})`;
      return 'DECIMAL(18, 4)';
    }

    if (clean.includes('BOOL')) return 'BOOLEAN';
    if (clean.includes('UUID')) return 'UUID';
    if (clean.includes('BLOB') || clean.includes('BYTEA') || clean.includes('VARBINARY')) return 'BLOB';

    if (clean.includes('TIMESTAMP_TZ') || clean.includes('TIMESTAMPTZ') || clean.includes('TIMESTAMP WITH TIME ZONE')) {
      return useStrictDuckDBTypes ? 'TIMESTAMPTZ' : 'TIMESTAMP';
    }
    if (clean.includes('TIMESTAMP') || clean.includes('DATETIME')) return 'TIMESTAMP';
    if (clean.includes('DATE')) return 'DATE';
    if (clean.includes('TIME')) return 'TIME';
    if (clean.includes('JSON')) return 'JSON';

    return 'VARCHAR';
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

    const columns: Array<{ name: string; type: string; isNotNull: boolean; isPrimaryKey: boolean; defaultValue?: string }> = [];
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
        const rest = columnMatch[3] || '';

        const colName = sanitizeName(rawColName, casing);
        const duckType = mapSqlTypeToDuckDB(rawType);
        const isNotNull = /NOT\ NULL/i.test(line);
        const isInlinePk = /PRIMARY\ KEY/i.test(line);

        let defaultValue: string | undefined;
        const defaultMatch = rest.match(/DEFAULT\s+([^\s,;]+)/i);
        if (defaultMatch) {
          defaultValue = defaultMatch[1];
        }

        if (isInlinePk && !primaryKeyCols.includes(colName)) {
          primaryKeyCols.push(colName);
        }

        columns.push({
          name: colName,
          type: duckType,
          isNotNull: isNotNull || isInlinePk,
          isPrimaryKey: isInlinePk,
          defaultValue
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
        let def = `  "${col.name}" ${col.type}`;
        if (col.isNotNull) {
          def += ' NOT NULL';
        }
        if (col.defaultValue) {
          def += ` DEFAULT ${col.defaultValue}`;
        }
        return def;
      });

      let sqlDdl = `${tableModifier} "${tableName}" (\n`;
      sqlDdl += columnDefs.join(',\n');
      if (primaryKeyCols.length > 0) {
        sqlDdl += `,\n  PRIMARY KEY (${primaryKeyCols.map((c) => `"${c}"`).join(', ')})`;
      }
      sqlDdl += '\n);';

      if (outputStyle === 'sql_ddl') {
        setOutput(sqlDdl);
      } else if (outputStyle === 'python_api') {
        let py = `import duckdb\n\n`;
        py += `# Connect to in-memory or file-backed DuckDB instance\n`;
        py += `con = duckdb.connect('analytics.duckdb')\n\n`;
        py += `# Create DuckDB table schema\n`;
        py += `con.sql("""\n${sqlDdl}\n""")\n\n`;
        py += `# Query or export as PyArrow / Pandas DataFrame\n`;
        py += `df = con.sql("SELECT * FROM ${tableName}").df()\n`;
        py += `print(df)`;
        setOutput(py);
      } else if (outputStyle === 'parquet_export') {
        let pq = `-- 1. Create DuckDB Table\n${sqlDdl}\n\n`;
        pq += `-- 2. Export DuckDB Table directly to Parquet file\n`;
        pq += `COPY "${tableName}" TO '${tableName}.parquet' (FORMAT PARQUET, COMPRESSION ZSTD);\n\n`;
        pq += `-- 3. Query Parquet file directly with DuckDB\n`;
        pq += `SELECT * FROM read_parquet('${tableName}.parquet') LIMIT 10;`;
        setOutput(pq);
      } else if (outputStyle === 'node_api') {
        let js = `import { DuckDBInstance } from '@duckdb/node-api';\n\n`;
        js += `async function run() {\n`;
        js += `  const instance = await DuckDBInstance.create('analytics.duckdb');\n`;
        js += `  const connection = await instance.connect();\n\n`;
        js += `  // Initialize DuckDB table schema\n`;
        js += `  await connection.run(\`\n${sqlDdl}\n  \`);\n\n`;
        js += `  console.log('DuckDB table ${tableName} created successfully');\n`;
        js += `}\n\n`;
        js += `run();`;
        setOutput(js);
      }

      setError('');
    } catch (e: any) {
      setError('SQL Parsing Error: ' + (e.message || e));
    }
  }, [input, casing, outputStyle, tableModifier, useStrictDuckDBTypes, t]);

  useEffect(() => {
    handleConvert();
  }, [handleConvert]);

  useEffect(() => {
    onStateChange?.({ input, output, casing, outputStyle, tableModifier, useStrictDuckDBTypes });
  }, [input, output, casing, outputStyle, tableModifier, useStrictDuckDBTypes, onStateChange]);

  const handleClear = useCallback(() => {
    setInput('');
    setOutput('');
    setError('');
    setActivePreset(null);
    toast.success(t('sqltoduckdb.toast_cleared', { defaultValue: 'Inputs cleared!' }));
    primaryInputRef.current?.focus();
  }, [t]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success(t('sqltoduckdb.toast_copied', { defaultValue: 'DuckDB output copied to clipboard!' }));
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
    toast.success(t('sqltoduckdb.preset_loaded', { name: preset.label, defaultValue: `Loaded preset ${preset.label}!` }));
    primaryInputRef.current?.focus();
  };

  const handleDownload = () => {
    if (!output) return;
    const ext = outputStyle === 'python_api' ? 'py' : outputStyle === 'node_api' ? 'js' : 'sql';
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `duckdb-schema-${Date.now()}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(t('sqltoduckdb.toast_downloaded', { defaultValue: 'Downloaded duckdb schema file!' }));
  };

  return (
    <div ref={containerRef} className="max-w-6xl mx-auto space-y-8">
      {/* Quick Start Presets */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2 mb-3 px-1">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {t('sqltoduckdb.presets_title', { defaultValue: 'Quick Start Presets:' })}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {DUCKDB_PRESETS.map((preset) => (
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
          <label htmlFor="sql-duckdb-style" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            {t('sqltoduckdb.output_style', { defaultValue: 'Output Format' })}
          </label>
          <select
            id="sql-duckdb-style"
            value={outputStyle}
            onChange={(e) => setOutputStyle(e.target.value as OutputStyle)}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="sql_ddl">DuckDB SQL DDL</option>
            <option value="python_api">Python DuckDB API</option>
            <option value="parquet_export">DuckDB Parquet COPY</option>
            <option value="node_api">Node.js DuckDB API</option>
          </select>
        </div>

        <div>
          <label htmlFor="sql-duckdb-modifier" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            {t('sqltoduckdb.table_modifier', { defaultValue: 'Table Clause' })}
          </label>
          <select
            id="sql-duckdb-modifier"
            value={tableModifier}
            onChange={(e) => setTableModifier(e.target.value as TableModifier)}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="CREATE TABLE">CREATE TABLE</option>
            <option value="CREATE TABLE IF NOT EXISTS">CREATE TABLE IF NOT EXISTS</option>
            <option value="CREATE OR REPLACE TABLE">CREATE OR REPLACE TABLE</option>
            <option value="CREATE TEMP TABLE">CREATE TEMP TABLE</option>
          </select>
        </div>

        <div>
          <label htmlFor="sql-duckdb-casing" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            {t('sqltoduckdb.field_casing', { defaultValue: 'Field Casing' })}
          </label>
          <select
            id="sql-duckdb-casing"
            value={casing}
            onChange={(e) => setCasing(e.target.value as CasingOption)}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="snake_case">snake_case</option>
            <option value="camelCase">camelCase</option>
            <option value="PascalCase">PascalCase</option>
            <option value="original">Original</option>
          </select>
        </div>

        <div className="flex items-center pt-6">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={useStrictDuckDBTypes}
              onChange={(e) => setUseStrictDuckDBTypes(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
            />
            {t('sqltoduckdb.strict_types', { defaultValue: 'Strict DuckDB types (TIMESTAMPTZ, HUGEINT, UUID)' })}
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
              <label htmlFor="sql-duckdb-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('sqltoduckdb.sql_input_label', { defaultValue: 'SQL CREATE TABLE DDL' })}
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
                <Trash2 className="w-3 h-3" /> {t('common.clear', { defaultValue: 'Clear' })}
              </button>
            </div>
          </div>
          <textarea
            id="sql-duckdb-input"
            ref={primaryInputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setActivePreset(null);
            }}
            placeholder={t('sqltoduckdb.placeholder_sql', { defaultValue: 'Paste SQL CREATE TABLE DDL statements here...' })}
            className="w-full h-96 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-emerald-500" />
              <label htmlFor="duckdb-output" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('sqltoduckdb.output_label', { defaultValue: 'Generated DuckDB Schema' })}
              </label>
            </div>
            <div className="flex gap-2 items-center">
              <kbd className="hidden sm:inline-flex items-center justify-center px-1.5 py-0.5 border border-slate-200 dark:border-slate-800 rounded text-[10px] font-bold text-slate-400 bg-white dark:bg-slate-900">
                C
              </kbd>
              <button
                onClick={handleDownload}
                disabled={!output}
                className="text-xs font-bold px-3 py-1 rounded-full text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all flex items-center gap-1 disabled:opacity-50"
              >
                <Download className="w-3 h-3" /> {t('common.download', { defaultValue: 'Download' })}
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
                {copied ? t('common.copied', { defaultValue: 'Copied' }) : t('common.copy', { defaultValue: 'Copy' })}
              </button>
            </div>
          </div>
          <textarea
            id="duckdb-output"
            value={output}
            readOnly
            placeholder={t('sqltoduckdb.placeholder_output', { defaultValue: 'Generated DuckDB schema code will appear here...' })}
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
          <h4 className="font-bold dark:text-white">
            {t('sqltoduckdb.about_title', { defaultValue: 'About SQL DDL to DuckDB Schema Generator' })}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('sqltoduckdb.about_text', {
              defaultValue:
                'Convert standard SQL CREATE TABLE DDL statements into DuckDB-optimized SQL DDL, Python API code, or Parquet lakehouse export scripts. DuckDB is an in-process analytical SQL database engine optimized for fast columnar analytics and Parquet/CSV data processing.'
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
