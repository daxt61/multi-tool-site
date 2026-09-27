import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Database, FileCode, Copy, Check, Trash2, AlertCircle, Download, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

const MAX_LENGTH = 100000;

type CasingOption = 'snake_case' | 'camelCase' | 'PascalCase' | 'original';

interface Preset {
  id: string;
  label: string;
  data: string;
}

const CASSANDRA_PRESETS: Preset[] = [
  {
    id: 'sensor_telemetry',
    label: 'IoT Sensor Telemetry',
    data: `CREATE TABLE sensor_readings (
  sensor_id VARCHAR(36) NOT NULL,
  reading_timestamp TIMESTAMP NOT NULL,
  temperature DECIMAL(5,2),
  humidity DECIMAL(5,2),
  battery_level INT,
  status VARCHAR(20) DEFAULT 'OK',
  PRIMARY KEY (sensor_id, reading_timestamp)
);`
  },
  {
    id: 'user_sessions',
    label: 'User Auth & Sessions',
    data: `CREATE TABLE user_sessions (
  user_id VARCHAR(36) NOT NULL,
  session_id VARCHAR(64) NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP NOT NULL,
  expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  PRIMARY KEY (user_id, session_id)
);`
  },
  {
    id: 'ecommerce_catalog',
    label: 'E-Commerce Product Catalog',
    data: `CREATE TABLE products (
  category_id INT NOT NULL,
  product_id VARCHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  stock_quantity INT DEFAULT 0,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL,
  PRIMARY KEY (category_id, product_id)
);`
  }
];

export function SQLToCassandra({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [input, setInput] = useState<string>(initialData?.input || CASSANDRA_PRESETS[0].data);
  const [output, setOutput] = useState<string>(initialData?.output || '');
  const [error, setError] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [activePreset, setActivePreset] = useState<string | null>('sensor_telemetry');
  const [casing, setCasing] = useState<CasingOption>('snake_case');
  const [keyspace, setKeyspace] = useState<string>('store_keyspace');
  const [includeKeyspace, setIncludeKeyspace] = useState<boolean>(true);
  const [customPartitionKeys, setCustomPartitionKeys] = useState<string>('');
  const [customClusteringKeys, setCustomClusteringKeys] = useState<string>('');

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

  const mapSqlTypeToCassandra = (typeStr: string): string => {
    const clean = typeStr.toUpperCase().trim();

    if (clean.includes('BIGINT') || clean.includes('INT8')) return 'bigint';
    if (clean.includes('SMALLINT') || clean.includes('INT2')) return 'smallint';
    if (clean.includes('TINYINT')) return 'tinyint';
    if (clean.includes('INT') || clean.includes('SERIAL')) return 'int';
    if (clean.includes('FLOAT') || clean.includes('REAL')) return 'float';
    if (clean.includes('DOUBLE')) return 'double';
    if (clean.includes('DECIMAL') || clean.includes('NUMERIC')) return 'decimal';
    if (clean.includes('BOOL')) return 'boolean';
    if (clean.includes('TIMESTAMP') || clean.includes('TIMESTAMPTZ') || clean.includes('DATETIME')) return 'timestamp';
    if (clean.includes('DATE')) return 'date';
    if (clean.includes('TIME')) return 'time';
    if (clean.includes('UUID')) return 'uuid';
    if (clean.includes('BLOB') || clean.includes('BYTEA') || clean.includes('BINARY')) return 'blob';
    if (clean.includes('JSON')) return 'text';

    return 'text';
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

    const columns: Array<{ name: string; type: string; isNotNull: boolean }> = [];
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
        const cqlType = mapSqlTypeToCassandra(rawType);
        const isNotNull = /NOT\ NULL/i.test(line);
        const isInlinePk = /PRIMARY\ KEY/i.test(line);

        if (isInlinePk && !primaryKeyCols.includes(colName)) {
          primaryKeyCols.push(colName);
        }

        columns.push({
          name: colName,
          type: cqlType,
          isNotNull: isNotNull || isInlinePk,
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

      let cql = '';

      if (includeKeyspace && keyspace.trim()) {
        const safeKeyspace = sanitizeName(keyspace.trim(), 'snake_case');
        cql += `CREATE KEYSPACE IF NOT EXISTS ${safeKeyspace}\n`;
        cql += `WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 1};\n\n`;
        cql += `USE ${safeKeyspace};\n\n`;
      }

      const columnDefs = columns.map((col) => `  ${col.name} ${col.type}`);

      // Primary Key Assembly
      let partitionKeys: string[] = [];
      let clusteringKeys: string[] = [];

      if (customPartitionKeys.trim()) {
        partitionKeys = customPartitionKeys.split(',').map((k) => sanitizeName(k.trim(), casing)).filter(Boolean);
      }
      if (customClusteringKeys.trim()) {
        clusteringKeys = customClusteringKeys.split(',').map((k) => sanitizeName(k.trim(), casing)).filter(Boolean);
      }

      if (partitionKeys.length === 0) {
        if (primaryKeyCols.length > 0) {
          partitionKeys = [primaryKeyCols[0]];
          clusteringKeys = primaryKeyCols.slice(1);
        } else if (columns.length > 0) {
          partitionKeys = [columns[0].name];
        }
      }

      let pkClause = '';
      if (partitionKeys.length > 1) {
        const partStr = `(${partitionKeys.join(', ')})`;
        if (clusteringKeys.length > 0) {
          pkClause = `PRIMARY KEY (${partStr}, ${clusteringKeys.join(', ')})`;
        } else {
          pkClause = `PRIMARY KEY (${partStr})`;
        }
      } else if (partitionKeys.length === 1) {
        if (clusteringKeys.length > 0) {
          pkClause = `PRIMARY KEY (${partitionKeys[0]}, ${clusteringKeys.join(', ')})`;
        } else {
          pkClause = `PRIMARY KEY (${partitionKeys[0]})`;
        }
      }

      if (pkClause) {
        columnDefs.push(`  ${pkClause}`);
      }

      cql += `CREATE TABLE IF NOT EXISTS ${tableName} (\n`;
      cql += columnDefs.join(',\n');
      cql += `\n);`;

      setOutput(cql);
      setError('');
    } catch (e: any) {
      setError('SQL Parsing Error: ' + (e.message || e));
    }
  }, [input, casing, keyspace, includeKeyspace, customPartitionKeys, customClusteringKeys, t]);

  useEffect(() => {
    handleConvert();
  }, [handleConvert]);

  useEffect(() => {
    onStateChange?.({ input, output, casing, keyspace, includeKeyspace, customPartitionKeys, customClusteringKeys });
  }, [input, output, casing, keyspace, includeKeyspace, customPartitionKeys, customClusteringKeys, onStateChange]);

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
    setCustomPartitionKeys('');
    setCustomClusteringKeys('');
    toast.success(t('common.preset_applied', { name: preset.label, defaultValue: `Applied preset: ${preset.label}` }));
    primaryInputRef.current?.focus();
  };

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cassandra-schema-${Date.now()}.cql`;
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
            {t('sqltocassandra.presets_title') || 'Quick Start SQL Presets'}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {CASSANDRA_PRESETS.map((preset) => (
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
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label htmlFor="sql-cassandra-keyspace" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            {t('sqltocassandra.keyspace_label') || 'Keyspace Name'}
          </label>
          <input
            id="sql-cassandra-keyspace"
            type="text"
            value={keyspace}
            onChange={(e) => setKeyspace(e.target.value)}
            placeholder="e.g. my_keyspace"
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="sql-cassandra-casing" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            {t('sqltocassandra.casing') || 'Field Casing'}
          </label>
          <select
            id="sql-cassandra-casing"
            value={casing}
            onChange={(e) => setCasing(e.target.value as CasingOption)}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="snake_case">snake_case (Cassandra Default)</option>
            <option value="camelCase">camelCase</option>
            <option value="PascalCase">PascalCase</option>
            <option value="original">Original</option>
          </select>
        </div>

        <div>
          <label htmlFor="sql-cassandra-partition" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            {t('sqltocassandra.partition_keys') || 'Custom Partition Key(s)'}
          </label>
          <input
            id="sql-cassandra-partition"
            type="text"
            value={customPartitionKeys}
            onChange={(e) => setCustomPartitionKeys(e.target.value)}
            placeholder="e.g. sensor_id, date"
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="sql-cassandra-clustering" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            {t('sqltocassandra.clustering_keys') || 'Custom Clustering Key(s)'}
          </label>
          <input
            id="sql-cassandra-clustering"
            type="text"
            value={customClusteringKeys}
            onChange={(e) => setCustomClusteringKeys(e.target.value)}
            placeholder="e.g. reading_timestamp"
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center pt-6">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={includeKeyspace}
              onChange={(e) => setIncludeKeyspace(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
            />
            {t('sqltocassandra.include_keyspace') || 'Include CREATE KEYSPACE & USE statements'}
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
              <label htmlFor="sql-cassandra-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('sqltocassandra.input_label') || 'SQL DDL Input'}
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
            id="sql-cassandra-input"
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
              <label htmlFor="cassandra-output" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('sqltocassandra.output_label') || 'Cassandra CQL Output'}
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
            id="cassandra-output"
            value={output}
            readOnly
            placeholder={t('sqltocassandra.placeholder_output') || 'Cassandra CQL statement will appear here...'}
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
          <h4 className="font-bold dark:text-white">{t('sqltocassandra.about_title') || 'SQL DDL to Apache Cassandra CQL'}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('sqltocassandra.about_text') ||
              'Convert standard SQL CREATE TABLE DDL statements into Apache Cassandra / DataStax CQL schema queries.'}
          </p>
          <ul className="text-sm text-slate-500 dark:text-slate-400 space-y-2 list-disc pl-5">
            <li>{t('sqltocassandra.list_item_1') || 'Maps SQL column types to CQL types (int, bigint, text, timestamp, decimal, float, boolean, uuid, blob).'}</li>
            <li>{t('sqltocassandra.list_item_2') || 'Configures Partition Keys and Clustering Keys according to NoSQL distribution rules.'}</li>
            <li>{t('sqltocassandra.list_item_3') || 'Includes optional CREATE KEYSPACE statement with SimpleStrategy replication.'}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
