import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Database, FileCode, Copy, Check, Trash2, AlertCircle, Download, Sparkles, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

const MAX_LENGTH = 100000;

type CasingOption = 'original' | 'camelCase' | 'snake_case' | 'PascalCase';
type TablePrefixMode = 'CREATE TABLE' | 'CREATE TABLE IF NOT EXISTS' | 'CREATE TEMPORARY TABLE';
type DistStyleMode = 'AUTO' | 'EVEN' | 'ALL' | 'KEY';
type SortKeyMode = 'AUTO' | 'COMPOUND' | 'INTERLEAVED' | 'NONE';
type CompressionEncoding = 'AUTO' | 'AZ64' | 'ZSTD' | 'LZO' | 'RAW' | 'RUNLENGTH';

interface Preset {
  id: string;
  label: string;
  sql: string;
}

const REDSHIFT_PRESETS: Preset[] = [
  {
    id: 'ecommerce_catalog',
    label: 'E-Commerce Catalog & Orders',
    sql: `CREATE TABLE products (
  product_id INT PRIMARY KEY,
  sku VARCHAR(64) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  category_id INT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
  order_id BIGINT PRIMARY KEY,
  customer_id INT NOT NULL,
  order_status VARCHAR(32) NOT NULL,
  total_amount DECIMAL(12, 2) NOT NULL,
  metadata JSONB,
  order_date DATE NOT NULL,
  updated_at TIMESTAMPTZ
);`
  },
  {
    id: 'user_events',
    label: 'User Sessions & Event Analytics',
    sql: `CREATE TABLE event_logs (
  event_id VARCHAR(64) PRIMARY KEY,
  session_id VARCHAR(64) NOT NULL,
  user_id INT,
  event_type VARCHAR(50) NOT NULL,
  payload TEXT,
  ip_address VARCHAR(45),
  device_info VARCHAR(128),
  timestamp TIMESTAMPTZ NOT NULL
);`
  },
  {
    id: 'financial_audit',
    label: 'Financial Transactions & Audit Log',
    sql: `CREATE TABLE transactions (
  trans_id BIGINT PRIMARY KEY,
  account_id INT NOT NULL,
  amount DECIMAL(18, 4) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  transaction_type VARCHAR(20) NOT NULL,
  is_settled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL
);`
  }
];

const REDSHIFT_RESERVED_KEYWORDS = new Set([
  'aes128', 'aes256', 'all', 'allowoverwrite', 'analyse', 'analyze', 'and', 'any', 'array', 'as',
  'asc', 'authorization', 'az64', 'backup', 'between', 'binary', 'blanksasnull', 'both', 'bytedict',
  'case', 'cast', 'check', 'collate', 'column', 'constraint', 'create', 'credentials', 'cross',
  'current_date', 'current_time', 'current_timestamp', 'current_user', 'current_user_id', 'default',
  'deferrable', 'deflate', 'defrag', 'delta', 'delta32k', 'desc', 'disable', 'distinct', 'distkey',
  'diststyle', 'do', 'else', 'emptyasnull', 'enable', 'encode', 'encrypt', 'encryption', 'end',
  'except', 'explicit', 'false', 'for', 'foreign', 'from', 'full', 'grant', 'group', 'gzip', 'having',
  'identity', 'ignore', 'ilike', 'in', 'initially', 'inner', 'intersect', 'into', 'is', 'isnull',
  'join', 'key', 'language', 'like', 'limit', 'local', 'lzo', 'lzop', 'minus', 'mostly8', 'mostly16',
  'mostly32', 'not', 'notnull', 'null', 'nulls', 'off', 'offline', 'offset', 'oid', 'old', 'on', 'only',
  'open', 'or', 'order', 'outer', 'overlaps', 'parallel', 'partition', 'percent', 'permissions',
  'placing', 'primary', 'raw', 'readratio', 'recover', 'references', 'rejectlog', 'resort', 'restore',
  'right', 'runlength', 'select', 'session_user', 'similar', 'some', 'sortkey', 'sysid', 'table',
  'tag', 'then', 'to', 'top', 'trailing', 'true', 'truncate', 'type', 'union', 'unique', 'user',
  'using', 'verbose', 'wallet', 'when', 'where', 'with', 'without', 'zstd'
]);

interface ParsedColumn {
  name: string;
  type: string;
  isPrimaryKey: boolean;
  isNotNull: boolean;
  defaultValue?: string;
}

interface ParsedTable {
  tableName: string;
  columns: ParsedColumn[];
  primaryKeys: string[];
}

export function SQLToRedshift({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [input, setInput] = useState(initialData?.input || REDSHIFT_PRESETS[0].sql);
  const [output, setOutput] = useState(initialData?.output || '');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>('ecommerce_catalog');
  const [casing, setCasing] = useState<CasingOption>('original');
  const [tablePrefix, setTablePrefix] = useState<TablePrefixMode>('CREATE TABLE IF NOT EXISTS');
  const [distStyle, setDistStyle] = useState<DistStyleMode>('AUTO');
  const [sortKeyStyle, setSortKeyStyle] = useState<SortKeyMode>('AUTO');
  const [encodingStyle, setEncodingStyle] = useState<CompressionEncoding>('AZ64');

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

  const sanitizeRedshiftIdentifier = (name: string, style: CasingOption): string => {
    let transformed = transformCase(name, style);
    let clean = transformed.replace(/[^a-zA-Z0-9_]/g, '_');
    if (/^[0-9]/.test(clean)) clean = '_' + clean;

    if (REDSHIFT_RESERVED_KEYWORDS.has(clean.toLowerCase())) {
      return `"${clean}"`;
    }
    return clean;
  };

  const mapSqlToRedshiftType = (sqlType: string): string => {
    const norm = sqlType.trim().toUpperCase();

    if (/^INT(EGER)?$/i.test(norm) || /^INT4$/i.test(norm)) return 'INTEGER';
    if (/^BIGINT$/i.test(norm) || /^INT8$/i.test(norm)) return 'BIGINT';
    if (/^SMALLINT$/i.test(norm) || /^INT2$/i.test(norm) || /^TINYINT$/i.test(norm)) return 'SMALLINT';
    if (/^BOOL(EAN)?$/i.test(norm)) return 'BOOLEAN';
    if (/^FLOAT/i.test(norm) || /^DOUBLE/i.test(norm) || /^REAL$/i.test(norm)) return 'DOUBLE PRECISION';
    if (/^DECIMAL/i.test(norm) || /^NUMERIC/i.test(norm)) return norm.includes('(') ? norm : 'DECIMAL(18, 4)';
    if (/^VARCHAR/i.test(norm) || /^TEXT/i.test(norm) || /^CHAR/i.test(norm) || /^STRING/i.test(norm)) {
      if (norm.startsWith('VARCHAR(') || norm.startsWith('CHAR(')) return norm;
      return 'VARCHAR(256)';
    }
    if (/^DATE$/i.test(norm)) return 'DATE';
    if (/^TIMESTAMP_TZ$/i.test(norm) || /^TIMESTAMPTZ$/i.test(norm)) return 'TIMESTAMPTZ';
    if (/^TIMESTAMP/i.test(norm) || /^DATETIME/i.test(norm)) return 'TIMESTAMP';
    if (/^JSON/i.test(norm) || /^SUPER$/i.test(norm)) return 'SUPER';
    if (/^BLOB/i.test(norm) || /^VARBINARY/i.test(norm) || /^BYTEA/i.test(norm)) return 'VARBYTE(64000)';
    if (/^GEOMETRY$/i.test(norm)) return 'GEOMETRY';

    return 'VARCHAR(256)';
  };

  const parseSqlDDL = (sqlInput: string): ParsedTable[] => {
    const tables: ParsedTable[] = [];
    const cleanSql = sqlInput.replace(/--.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
    const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:`|"|')?([a-zA-Z0-9_]+)(?:`|"|')?\s*\(([\s\S]*?)\);/gi;

    let match;
    while ((match = tableRegex.exec(cleanSql)) !== null) {
      const rawTableName = match[1];
      const body = match[2];
      const columns: ParsedColumn[] = [];
      const primaryKeys: string[] = [];

      const pkMatch = body.match(/PRIMARY\s+KEY\s*\(([^)]+)\)/i);
      if (pkMatch) {
        pkMatch[1].split(',').forEach((k) => {
          const cleanK = k.replace(/[`"']/g, '').trim();
          if (cleanK) primaryKeys.push(cleanK);
        });
      }

      const lines = body.split(/,\n(?![^(]*\))/);
      lines.forEach((line) => {
        const trimmed = line.trim();
        if (
          !trimmed ||
          /^(CONSTRAINT|PRIMARY\s+KEY|FOREIGN\s+KEY|KEY|INDEX|UNIQUE)/i.test(trimmed)
        ) {
          return;
        }

        const colMatch = trimmed.match(/^(`|"|')?([a-zA-Z0-9_]+)(`|"|')?\s+([a-zA-Z0-9_]+(?:\([^)]+\))?)([\s\S]*)$/i);
        if (colMatch) {
          const colName = colMatch[2];
          const rawType = colMatch[4];
          const constraints = colMatch[5] || '';

          const isInlinePk = /PRIMARY\s+KEY/i.test(constraints);
          if (isInlinePk && !primaryKeys.includes(colName)) {
            primaryKeys.push(colName);
          }

          const isNotNull = /NOT\s+NULL/i.test(constraints) || isInlinePk;
          const defaultMatch = constraints.match(/DEFAULT\s+([^,\s]+)/i);

          columns.push({
            name: colName,
            type: mapSqlToRedshiftType(rawType),
            isPrimaryKey: isInlinePk,
            isNotNull,
            defaultValue: defaultMatch ? defaultMatch[1] : undefined
          });
        }
      });

      tables.push({
        tableName: rawTableName,
        columns,
        primaryKeys
      });
    }

    return tables;
  };

  const generateRedshiftDDL = useCallback(() => {
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

      const tables = parseSqlDDL(input);
      if (tables.length === 0) {
        setOutput('');
        setError(t('sqltoredshift.no_tables_found') || 'No valid CREATE TABLE statements found.');
        return;
      }

      const ddlStatements: string[] = [];

      tables.forEach((tbl) => {
        const safeTableName = sanitizeRedshiftIdentifier(tbl.tableName, casing);
        const colLines: string[] = [];
        let autoDistKeyCandidate: string | null = null;
        const autoSortKeyCandidates: string[] = [];

        tbl.columns.forEach((col) => {
          const safeColName = sanitizeRedshiftIdentifier(col.name, casing);
          let colDef = `  ${safeColName} ${col.type}`;

          if (encodingStyle !== 'AUTO') {
            colDef += ` ENCODE ${encodingStyle}`;
          }

          if (col.isNotNull) {
            colDef += ' NOT NULL';
          }

          if (col.defaultValue) {
            colDef += ` DEFAULT ${col.defaultValue}`;
          }

          colLines.push(colDef);

          if (!autoDistKeyCandidate && (col.isPrimaryKey || tbl.primaryKeys.includes(col.name))) {
            autoDistKeyCandidate = safeColName;
          }

          if (/DATE|TIMESTAMP/i.test(col.type) || col.isPrimaryKey) {
            autoSortKeyCandidates.push(safeColName);
          }
        });

        if (tbl.primaryKeys.length > 0) {
          const pkList = tbl.primaryKeys
            .map((k) => sanitizeRedshiftIdentifier(k, casing))
            .join(', ');
          colLines.push(`  PRIMARY KEY (${pkList})`);
        }

        let statement = `${tablePrefix} ${safeTableName} (\n${colLines.join(',\n')}\n)`;

        // Diststyle Clause
        if (distStyle === 'AUTO') {
          statement += '\nDISTSTYLE AUTO';
        } else if (distStyle === 'EVEN') {
          statement += '\nDISTSTYLE EVEN';
        } else if (distStyle === 'ALL') {
          statement += '\nDISTSTYLE ALL';
        } else if (distStyle === 'KEY') {
          const keyCol = autoDistKeyCandidate || (colLines[0] ? colLines[0].trim().split(' ')[0] : 'id');
          statement += `\nDISTSTYLE KEY\nDISTKEY (${keyCol})`;
        }

        // Sortkey Clause
        if (sortKeyStyle === 'AUTO') {
          statement += '\nSORTKEY AUTO';
        } else if (sortKeyStyle === 'COMPOUND' && autoSortKeyCandidates.length > 0) {
          statement += `\nCOMPOUND SORTKEY (${autoSortKeyCandidates.slice(0, 4).join(', ')})`;
        } else if (sortKeyStyle === 'INTERLEAVED' && autoSortKeyCandidates.length > 0) {
          statement += `\nINTERLEAVED SORTKEY (${autoSortKeyCandidates.slice(0, 4).join(', ')})`;
        }

        statement += ';';
        ddlStatements.push(statement);
      });

      setOutput(ddlStatements.join('\n\n'));
      setError('');
    } catch (e: any) {
      setError(t('sqltoredshift.error_parsing') + ': ' + e.message);
    }
  }, [input, casing, tablePrefix, distStyle, sortKeyStyle, encodingStyle, t]);

  useEffect(() => {
    generateRedshiftDDL();
  }, [generateRedshiftDDL]);

  useEffect(() => {
    onStateChange?.({ input, output, casing, tablePrefix, distStyle, sortKeyStyle, encodingStyle });
  }, [input, output, casing, tablePrefix, distStyle, sortKeyStyle, encodingStyle, onStateChange]);

  const handleClear = useCallback(() => {
    setInput('');
    setOutput('');
    setError('');
    setActivePreset(null);
    toast.success(t('sqltoredshift.toast_cleared') || 'Inputs cleared!');
    primaryInputRef.current?.focus();
  }, [t]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success(t('sqltoredshift.toast_copied') || 'Redshift DDL copied to clipboard!');
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
    setInput(preset.sql);
    setActivePreset(preset.id);
    toast.success(t('sqltoredshift.preset_loaded', { name: preset.label, defaultValue: `Loaded preset: ${preset.label}` }));
    primaryInputRef.current?.focus();
  };

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `redshift-schema-${Date.now()}.sql`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(t('sqltoredshift.toast_downloaded') || 'Downloaded redshift-schema.sql!');
  };

  return (
    <div ref={containerRef} className="max-w-6xl mx-auto space-y-8">
      {/* Quick Start Presets */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2 mb-3 px-1">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {t('sqltoredshift.presets_title') || 'Quick Start Presets:'}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {REDSHIFT_PRESETS.map((preset) => (
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
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div>
          <label htmlFor="redshift-prefix-select" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            {t('sqltoredshift.table_prefix') || 'Table Clause'}
          </label>
          <select
            id="redshift-prefix-select"
            value={tablePrefix}
            onChange={(e) => setTablePrefix(e.target.value as TablePrefixMode)}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="CREATE TABLE IF NOT EXISTS">CREATE TABLE IF NOT EXISTS</option>
            <option value="CREATE TABLE">CREATE TABLE</option>
            <option value="CREATE TEMPORARY TABLE">CREATE TEMPORARY TABLE</option>
          </select>
        </div>

        <div>
          <label htmlFor="redshift-diststyle-select" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            {t('sqltoredshift.diststyle') || 'DistStyle'}
          </label>
          <select
            id="redshift-diststyle-select"
            value={distStyle}
            onChange={(e) => setDistStyle(e.target.value as DistStyleMode)}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="AUTO">AUTO (Redshift Default)</option>
            <option value="EVEN">EVEN (Round Robin)</option>
            <option value="ALL">ALL (Full Copy on Nodes)</option>
            <option value="KEY">KEY (Key-based Hash)</option>
          </select>
        </div>

        <div>
          <label htmlFor="redshift-sortkey-select" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            {t('sqltoredshift.sortkey') || 'SortKey Style'}
          </label>
          <select
            id="redshift-sortkey-select"
            value={sortKeyStyle}
            onChange={(e) => setSortKeyStyle(e.target.value as SortKeyMode)}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="AUTO">SORTKEY AUTO</option>
            <option value="COMPOUND">COMPOUND SORTKEY</option>
            <option value="INTERLEAVED">INTERLEAVED SORTKEY</option>
            <option value="NONE">NONE</option>
          </select>
        </div>

        <div>
          <label htmlFor="redshift-encoding-select" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            {t('sqltoredshift.encoding') || 'Compression Encoding'}
          </label>
          <select
            id="redshift-encoding-select"
            value={encodingStyle}
            onChange={(e) => setEncodingStyle(e.target.value as CompressionEncoding)}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="AZ64">ENCODE AZ64 (High Perf)</option>
            <option value="ZSTD">ENCODE ZSTD (High Ratio)</option>
            <option value="LZO">ENCODE LZO</option>
            <option value="RAW">ENCODE RAW (None)</option>
            <option value="RUNLENGTH">ENCODE RUNLENGTH</option>
            <option value="AUTO">AUTO (Omit Column Encodings)</option>
          </select>
        </div>

        <div>
          <label htmlFor="redshift-casing-select" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            {t('sqltoredshift.field_casing') || 'Field Casing'}
          </label>
          <select
            id="redshift-casing-select"
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
              <label htmlFor="sql-redshift-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('sqltoredshift.input_label') || 'SQL CREATE TABLE DDL'}
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
            id="sql-redshift-input"
            ref={primaryInputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setActivePreset(null);
            }}
            placeholder="CREATE TABLE example (id INT PRIMARY KEY, name VARCHAR(255) NOT NULL);"
            className="w-full h-96 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-emerald-500" />
              <label htmlFor="redshift-output" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('sqltoredshift.output_label') || 'Amazon Redshift SQL DDL'}
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
            id="redshift-output"
            value={output}
            readOnly
            placeholder={t('sqltoredshift.placeholder_output') || 'Redshift DDL will appear here...'}
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
          <h4 className="font-bold dark:text-white">{t('sqltoredshift.about_title') || 'About SQL DDL to Amazon Redshift Generator'}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('sqltoredshift.about_text') ||
              'Convert standard SQL CREATE TABLE DDL statements into Amazon Redshift-optimized DDL statements with column compression encodings, table distribution styles, and sort key clauses.'}
          </p>
          <ul className="text-sm text-slate-500 dark:text-slate-400 space-y-2 list-disc pl-5">
            <li>{t('sqltoredshift.list_item_1') || 'Maps SQL column types to Amazon Redshift types (INTEGER, BIGINT, SMALLINT, DECIMAL, DOUBLE PRECISION, BOOLEAN, VARCHAR, DATE, TIMESTAMP, TIMESTAMPTZ, SUPER).'}</li>
            <li>{t('sqltoredshift.list_item_2') || 'Configures Redshift DISTSTYLE (EVEN, ALL, KEY, AUTO) and DISTKEY distribution keys.'}</li>
            <li>{t('sqltoredshift.list_item_3') || 'Supports COMPOUND or INTERLEAVED SORTKEY strategies and column compression encodings (AZ64, ZSTD, LZO, RAW).'}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
