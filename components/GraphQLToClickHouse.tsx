import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Database, FileCode, Copy, Check, Trash2, AlertCircle, Download, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

const MAX_LENGTH = 100000;

type CasingOption = 'original' | 'camelCase' | 'snake_case' | 'PascalCase';
type ClickHouseEngine = 'MergeTree' | 'ReplacingMergeTree' | 'SummingMergeTree' | 'Log' | 'TinyLog' | 'Memory';

interface Preset {
  id: string;
  label: string;
  data: string;
}

const GRAPHQL_CLICKHOUSE_PRESETS: Preset[] = [
  {
    id: 'analytics_orders',
    label: 'Analytics Order Log',
    data: `type Order {
  id: ID!
  orderNumber: String!
  customerUuid: String!
  totalAmount: Float!
  taxAmount: Float
  discountRate: Float
  isCompleted: Boolean!
  itemCount: Int!
  status: OrderStatus!
  placedAt: String!
  updatedAt: String
}

enum OrderStatus {
  PENDING
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
}`
  },
  {
    id: 'user_activity',
    label: 'User Activity Telemetry',
    data: `type UserEvent {
  id: ID!
  userId: String!
  sessionId: String!
  eventType: String!
  pageUrl: String
  durationMs: Int!
  isError: Boolean!
  metadataJson: String
  timestamp: String!
}`
  },
  {
    id: 'sensor_metrics',
    label: 'Sensor Time-Series Metrics',
    data: `type SensorReading {
  id: ID!
  sensorCode: String!
  temperature: Float!
  humidity: Float!
  pressureMsbar: Float
  batteryLevel: Float!
  rawPayload: String
  recordedAt: String!
}`
  }
];

export function GraphQLToClickHouse({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [input, setInput] = useState<string>(initialData?.input || GRAPHQL_CLICKHOUSE_PRESETS[0].data);
  const [output, setOutput] = useState<string>(initialData?.output || '');
  const [error, setError] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [activePreset, setActivePreset] = useState<string | null>('analytics_orders');
  const [casing, setCasing] = useState<CasingOption>('snake_case');
  const [engine, setEngine] = useState<ClickHouseEngine>('MergeTree');
  const [useNullable, setUseNullable] = useState<boolean>(true);
  const [orderByKey, setOrderByKey] = useState<string>('');

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

  const mapGraphQLTypeToClickHouse = (graphqlType: string): string => {
    const clean = graphqlType.replace(/[!\[\]]/g, '').trim();

    if (clean === 'ID') return 'UUID';
    if (clean === 'Int') return 'Int32';
    if (clean === 'Float') return 'Float64';
    if (clean === 'Boolean') return 'Bool';
    if (clean === 'String') return 'String';

    if (clean.includes('HugeInt')) return 'Int128';
    if (clean.includes('BigInt')) return 'Int64';
    if (clean.includes('Decimal')) return 'Decimal(18, 4)';
    if (clean.includes('Date')) return 'Date32';
    if (clean.includes('Time') || clean.includes('Timestamp')) return 'DateTime64(3)';
    if (clean.includes('JSON')) return 'JSON';

    return 'String';
  };

  const parseGraphQLSdl = (sdl: string) => {
    const cleaned = sdl.replace(/#.*$/gm, '').replace(/"""[\s\S]*?"""/g, '');

    const typeBlockRegex = /type\s+([A-Za-z0-9_]+)(?:\s+implements\s+[^{]+)?\s*\{([^}]*)\}/g;
    const enumBlockRegex = /enum\s+([A-Za-z0-9_]+)\s*\{([^}]*)\}/g;

    const enums = Object.create(null);
    let enumMatch: RegExpExecArray | null;
    while ((enumMatch = enumBlockRegex.exec(cleaned)) !== null) {
      const enumName = enumMatch[1];
      const enumValues = enumMatch[2]
        .split('\n')
        .map((v) => v.trim())
        .filter((v) => v && !v.startsWith('#'));
      enums[enumName] = enumValues;
    }

    const tables: Array<{
      tableName: string;
      columns: Array<{ name: string; type: string; isNotNull: boolean; isPrimaryKey: boolean }>;
      primaryKeyCols: string[];
    }> = [];

    let typeMatch: RegExpExecArray | null;
    while ((typeMatch = typeBlockRegex.exec(cleaned)) !== null) {
      const rawTypeName = typeMatch[1];
      if (['Query', 'Mutation', 'Subscription'].includes(rawTypeName)) continue;

      const tableName = sanitizeName(rawTypeName, casing);
      const fieldsBody = typeMatch[2];

      const columns: Array<{ name: string; type: string; isNotNull: boolean; isPrimaryKey: boolean }> = [];
      const primaryKeyCols: string[] = [];

      const fieldLines = fieldsBody.split('\n');
      for (const rawLine of fieldLines) {
        const line = rawLine.trim();
        if (!line || line.startsWith('#')) continue;

        const fieldMatch = line.match(/^([A-Za-z0-9_]+)(?:\([^)]*\))?\s*:\s*([A-Za-z0-9_!\[\]]+)/);
        if (fieldMatch) {
          const rawFieldName = fieldMatch[1];
          const rawFieldType = fieldMatch[2];

          const colName = sanitizeName(rawFieldName, casing);
          const isNotNull = rawFieldType.endsWith('!');
          const isPk = rawFieldName.toLowerCase() === 'id' || colName === 'id';

          let chType = mapGraphQLTypeToClickHouse(rawFieldType);

          if (isPk) {
            primaryKeyCols.push(colName);
          }

          columns.push({
            name: colName,
            type: chType,
            isNotNull,
            isPrimaryKey: isPk
          });
        }
      }

      if (columns.length > 0) {
        tables.push({ tableName, columns, primaryKeyCols });
      }
    }

    if (tables.length === 0) {
      throw new Error('No valid GraphQL type definitions found');
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

      const tables = parseGraphQLSdl(input);

      let ddlStatements: string[] = [];

      for (const table of tables) {
        const columnDefs = table.columns.map((col) => {
          let finalType = col.type;
          if (!col.isNotNull && useNullable && col.type !== 'JSON') {
            finalType = `Nullable(${col.type})`;
          }
          return `  \`${col.name}\` ${finalType}`;
        });

        let orderClause = orderByKey.trim();
        if (!orderClause) {
          if (table.primaryKeyCols.length > 0) {
            orderClause = table.primaryKeyCols.join(', ');
          } else if (table.columns.length > 0) {
            orderClause = table.columns[0].name;
          } else {
            orderClause = 'tuple()';
          }
        }

        let ddl = `CREATE TABLE IF NOT EXISTS \`${table.tableName}\` (\n`;
        ddl += columnDefs.join(',\n');
        ddl += `\n)\nENGINE = ${engine}()`;

        if (['MergeTree', 'ReplacingMergeTree', 'SummingMergeTree'].includes(engine)) {
          if (orderClause) {
            ddl += `\nORDER BY (${orderClause})`;
          }
        }

        ddl += ';';
        ddlStatements.push(ddl);
      }

      setOutput(ddlStatements.join('\n\n'));
      setError('');
    } catch (e: any) {
      setError('GraphQL Parsing Error: ' + (e.message || e));
    }
  }, [input, casing, engine, useNullable, orderByKey, t]);

  useEffect(() => {
    handleConvert();
  }, [handleConvert]);

  useEffect(() => {
    onStateChange?.({ input, output, casing, engine, useNullable, orderByKey });
  }, [input, output, casing, engine, useNullable, orderByKey, onStateChange]);

  const handleClear = useCallback(() => {
    setInput('');
    setOutput('');
    setError('');
    setActivePreset(null);
    toast.success(t('graphqltoch.toast_cleared', { defaultValue: 'Inputs cleared!' }));
    primaryInputRef.current?.focus();
  }, [t]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success(t('graphqltoch.toast_copied', { defaultValue: 'ClickHouse DDL output copied to clipboard!' }));
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
    toast.success(t('graphqltoch.preset_loaded', { name: preset.label, defaultValue: `Loaded preset ${preset.label}!` }));
    primaryInputRef.current?.focus();
  };

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `clickhouse-graphql-schema-${Date.now()}.sql`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(t('graphqltoch.toast_downloaded', { defaultValue: 'Downloaded ClickHouse schema file!' }));
  };

  return (
    <div ref={containerRef} className="max-w-6xl mx-auto space-y-8">
      {/* Quick Start Presets */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2 mb-3 px-1">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {t('graphqltoch.presets_title', { defaultValue: 'Quick Start Presets:' })}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {GRAPHQL_CLICKHOUSE_PRESETS.map((preset) => (
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
          <label htmlFor="graphql-clickhouse-engine" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            {t('graphqltoch.engine', { defaultValue: 'Table Engine' })}
          </label>
          <select
            id="graphql-clickhouse-engine"
            value={engine}
            onChange={(e) => setEngine(e.target.value as ClickHouseEngine)}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="MergeTree">MergeTree</option>
            <option value="ReplacingMergeTree">ReplacingMergeTree</option>
            <option value="SummingMergeTree">SummingMergeTree</option>
            <option value="Log">Log</option>
            <option value="TinyLog">TinyLog</option>
            <option value="Memory">Memory</option>
          </select>
        </div>

        <div>
          <label htmlFor="graphql-clickhouse-casing" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            {t('graphqltoch.field_casing', { defaultValue: 'Field Casing' })}
          </label>
          <select
            id="graphql-clickhouse-casing"
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

        <div>
          <label htmlFor="graphql-clickhouse-orderby" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            {t('graphqltoch.order_by', { defaultValue: 'Custom ORDER BY' })}
          </label>
          <input
            id="graphql-clickhouse-orderby"
            type="text"
            value={orderByKey}
            onChange={(e) => setOrderByKey(e.target.value)}
            placeholder="e.g. id, created_at"
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center pt-6">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={useNullable}
              onChange={(e) => setUseNullable(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
            />
            {t('graphqltoch.use_nullable', { defaultValue: 'Nullable(T) for optional fields' })}
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
              <label htmlFor="graphql-clickhouse-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('graphqltoch.graphql_input_label', { defaultValue: 'GraphQL SDL Input' })}
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
            id="graphql-clickhouse-input"
            ref={primaryInputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setActivePreset(null);
            }}
            placeholder={t('graphqltoch.placeholder_graphql', { defaultValue: 'Paste GraphQL SDL schemas here...' })}
            className="w-full h-96 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-emerald-500" />
              <label htmlFor="clickhouse-output" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('graphqltoch.output_label', { defaultValue: 'Generated ClickHouse DDL Output' })}
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
            id="clickhouse-output"
            value={output}
            readOnly
            placeholder={t('graphqltoch.placeholder_output', { defaultValue: 'Generated ClickHouse DDL will appear here...' })}
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
            {t('graphqltoch.about_title', { defaultValue: 'About GraphQL SDL to ClickHouse Converter' })}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('graphqltoch.about_text', {
              defaultValue:
                'Convert GraphQL SDL schema definitions into ClickHouse analytical database DDL statements with support for MergeTree engines, Nullable(T) column constraints, and customizable ORDER BY sorting keys.'
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
