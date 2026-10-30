import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Database, FileCode, Copy, Check, Trash2, AlertCircle, Download, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

const MAX_LENGTH = 100000;

type CasingOption = 'snake_case' | 'camelCase' | 'PascalCase' | 'original';
type OutputFormat = 'sql_ddl' | 'json_schema' | 'python_sdk' | 'terraform';
type PartitionOption = 'none' | 'created_at_day' | 'updated_at_day' | 'ingestion_time';

interface Preset {
  id: string;
  label: string;
  data: string;
}

const GRAPHQL_BIGQUERY_PRESETS: Preset[] = [
  {
    id: 'ecommerce_analytics',
    label: 'E-Commerce Orders & Items',
    data: `type Order {
  id: ID!
  orderNumber: String!
  customerUuid: String!
  totalAmount: Float!
  taxAmount: Float
  discountRate: Float
  itemCount: Int!
  status: OrderStatus!
  isFulfilled: Boolean!
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
    id: 'user_activity_logs',
    label: 'User Activity & Event Logs',
    data: `type UserEvent {
  id: ID!
  userId: String!
  sessionId: String!
  eventType: String!
  pageUrl: String
  durationMs: Int!
  isError: Boolean!
  payloadJson: String
  createdAt: String!
}`
  },
  {
    id: 'iot_sensor_telemetry',
    label: 'IoT Telemetry & Metrics',
    data: `type SensorMetric {
  id: ID!
  deviceId: String!
  sensorType: String!
  temperatureCelsius: Float!
  humidityPct: Float!
  batteryVoltage: Float!
  statusFlags: Int!
  recordedAt: String!
}`
  }
];

export function GraphQLToBigQuery({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [input, setInput] = useState<string>(initialData?.input || GRAPHQL_BIGQUERY_PRESETS[0].data);
  const [output, setOutput] = useState<string>(initialData?.output || '');
  const [error, setError] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [activePreset, setActivePreset] = useState<string | null>('ecommerce_analytics');
  const [casing, setCasing] = useState<CasingOption>('snake_case');
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('sql_ddl');
  const [partitionOption, setPartitionOption] = useState<PartitionOption>('created_at_day');
  const [datasetName, setDatasetName] = useState<string>('analytics');

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
      safeKey = '_' + (safeKey || 'field');
    }
    return safeKey;
  };

  const mapGraphQLTypeToBigQuery = (graphqlType: string): string => {
    const clean = graphqlType.replace(/[!\[\]]/g, '').trim();

    if (clean === 'ID') return 'STRING';
    if (clean === 'Int') return 'INT64';
    if (clean === 'Float') return 'FLOAT64';
    if (clean === 'Boolean') return 'BOOL';
    if (clean === 'String') return 'STRING';

    if (clean.includes('BigInt')) return 'INT64';
    if (clean.includes('Decimal') || clean.includes('Numeric')) return 'NUMERIC';
    if (clean.includes('Date')) return 'DATE';
    if (clean.includes('Time') || clean.includes('Timestamp') || clean.includes('At')) {
      return 'TIMESTAMP';
    }
    if (clean.includes('JSON')) return 'JSON';
    if (clean.includes('Bytes')) return 'BYTES';

    return 'STRING';
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
      columns: Array<{ name: string; type: string; mode: 'REQUIRED' | 'NULLABLE' | 'REPEATED'; isTimestamp: boolean }>;
    }> = [];

    let typeMatch: RegExpExecArray | null;
    while ((typeMatch = typeBlockRegex.exec(cleaned)) !== null) {
      const rawTypeName = typeMatch[1];
      if (['Query', 'Mutation', 'Subscription'].includes(rawTypeName)) continue;

      const tableName = sanitizeName(rawTypeName, casing);
      const fieldsBody = typeMatch[2];

      const columns: Array<{ name: string; type: string; mode: 'REQUIRED' | 'NULLABLE' | 'REPEATED'; isTimestamp: boolean }> = [];

      const fieldLines = fieldsBody.split('\n');
      for (const rawLine of fieldLines) {
        const line = rawLine.trim();
        if (!line || line.startsWith('#')) continue;

        const fieldMatch = line.match(/^([A-Za-z0-9_]+)(?:\([^)]*\))?\s*:\s*([A-Za-z0-9_!\[\]]+)/);
        if (fieldMatch) {
          const rawFieldName = fieldMatch[1];
          const rawFieldType = fieldMatch[2];

          const colName = sanitizeName(rawFieldName, casing);
          const isArray = rawFieldType.includes('[');
          const isNonNull = rawFieldType.endsWith('!');

          let mode: 'REQUIRED' | 'NULLABLE' | 'REPEATED' = 'NULLABLE';
          if (isArray) {
            mode = 'REPEATED';
          } else if (isNonNull) {
            mode = 'REQUIRED';
          }

          let bqType = mapGraphQLTypeToBigQuery(rawFieldType);
          const isTimestamp = bqType === 'TIMESTAMP' || bqType === 'DATE';

          columns.push({
            name: colName,
            type: bqType,
            mode,
            isTimestamp
          });
        }
      }

      if (columns.length > 0) {
        tables.push({ tableName, columns });
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
      const safeDataset = sanitizeName(datasetName || 'analytics', 'snake_case');

      if (outputFormat === 'sql_ddl') {
        const ddlStatements: string[] = [];

        for (const table of tables) {
          const columnDefs = table.columns.map((col) => {
            const modeClause = col.mode === 'REQUIRED' ? ' NOT NULL' : '';
            return `  ${col.name} ${col.type}${modeClause}`;
          });

          let sqlDdl = `CREATE OR REPLACE TABLE \`${safeDataset}.${table.tableName}\` (\n`;
          sqlDdl += columnDefs.join(',\n');
          sqlDdl += '\n)';

          // Partitioning options
          let timestampCol = table.columns.find((c) => c.isTimestamp)?.name;
          if (partitionOption === 'created_at_day' && timestampCol) {
            sqlDdl += `\nPARTITION BY DATE(${timestampCol})`;
          } else if (partitionOption === 'ingestion_time') {
            sqlDdl += `\nPARTITION BY _PARTITIONDATE`;
          }

          sqlDdl += ';';
          ddlStatements.push(sqlDdl);
        }

        setOutput(ddlStatements.join('\n\n'));
      } else if (outputFormat === 'json_schema') {
        const schemas: Record<string, any> = {};

        for (const table of tables) {
          schemas[table.tableName] = table.columns.map((col) => ({
            name: col.name,
            type: col.type,
            mode: col.mode,
            description: `Field ${col.name} generated from GraphQL SDL`
          }));
        }

        setOutput(JSON.stringify(schemas, null, 2));
      } else if (outputFormat === 'python_sdk') {
        const mainTable = tables[0];
        let py = `from google.cloud import bigquery\n\n`;
        py += `client = bigquery.Client()\n`;
        py += `table_id = "${safeDataset}.${mainTable.tableName}"\n\n`;
        py += `schema = [\n`;
        for (const col of mainTable.columns) {
          py += `    bigquery.SchemaField("${col.name}", "${col.type}", mode="${col.mode}"),\n`;
        }
        py += `]\n\n`;
        py += `table = bigquery.Table(table_id, schema=schema)\n`;
        if (partitionOption === 'created_at_day' && mainTable.columns.find((c) => c.isTimestamp)) {
          const tsCol = mainTable.columns.find((c) => c.isTimestamp)?.name;
          py += `table.time_partitioning = bigquery.TimePartitioning(\n`;
          py += `    type_=bigquery.TimePartitioningType.DAY,\n`;
          py += `    field="${tsCol}"\n`;
          py += `)\n`;
        }
        py += `table = client.create_table(table, exists_ok=True)\n`;
        py += `print(f"Created table {table.table_id}")`;
        setOutput(py);
      } else if (outputFormat === 'terraform') {
        const mainTable = tables[0];
        let tf = `resource "google_bigquery_table" "${mainTable.tableName}" {\n`;
        tf += `  dataset_id = "${safeDataset}"\n`;
        tf += `  table_id   = "${mainTable.tableName}"\n\n`;
        tf += `  schema = <<EOF\n[\n`;
        const jsonSchema = mainTable.columns.map((col) => ({
          name: col.name,
          type: col.type,
          mode: col.mode
        }));
        tf += JSON.stringify(jsonSchema, null, 4)
          .split('\n')
          .map((line) => '  ' + line)
          .join('\n');
        tf += `\n]\nEOF\n}\n`;
        setOutput(tf);
      }

      setError('');
    } catch (e: any) {
      setError('GraphQL Parsing Error: ' + (e.message || e));
    }
  }, [input, casing, outputFormat, partitionOption, datasetName, t]);

  useEffect(() => {
    handleConvert();
  }, [handleConvert]);

  useEffect(() => {
    onStateChange?.({ input, output, casing, outputFormat, partitionOption, datasetName });
  }, [input, output, casing, outputFormat, partitionOption, datasetName, onStateChange]);

  const handleClear = useCallback(() => {
    setInput('');
    setOutput('');
    setError('');
    setActivePreset(null);
    toast.success(t('graphqltobigquery.toast_cleared', { defaultValue: 'Inputs cleared!' }));
    primaryInputRef.current?.focus();
  }, [t]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success(t('graphqltobigquery.toast_copied', { defaultValue: 'BigQuery output copied to clipboard!' }));
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
    toast.success(t('graphqltobigquery.preset_loaded', { name: preset.label, defaultValue: `Loaded preset ${preset.label}!` }));
    primaryInputRef.current?.focus();
  };

  const handleDownload = () => {
    if (!output) return;
    const ext = outputFormat === 'json_schema' ? 'json' : outputFormat === 'python_sdk' ? 'py' : outputFormat === 'terraform' ? 'tf' : 'sql';
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bigquery-schema-${Date.now()}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(t('graphqltobigquery.toast_downloaded', { defaultValue: 'Downloaded BigQuery schema file!' }));
  };

  return (
    <div ref={containerRef} className="max-w-6xl mx-auto space-y-8">
      {/* Quick Start Presets */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2 mb-3 px-1">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {t('graphqltobigquery.presets_title', { defaultValue: 'Quick Start Presets:' })}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {GRAPHQL_BIGQUERY_PRESETS.map((preset) => (
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

      {/* Configuration Options */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label htmlFor="graphql-bigquery-dataset" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            {t('graphqltobigquery.dataset_name', { defaultValue: 'BigQuery Dataset' })}
          </label>
          <input
            id="graphql-bigquery-dataset"
            type="text"
            value={datasetName}
            onChange={(e) => setDatasetName(e.target.value)}
            placeholder="analytics"
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="graphql-bigquery-format" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            {t('graphqltobigquery.output_format', { defaultValue: 'Output Format' })}
          </label>
          <select
            id="graphql-bigquery-format"
            value={outputFormat}
            onChange={(e) => setOutputFormat(e.target.value as OutputFormat)}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="sql_ddl">BigQuery SQL DDL</option>
            <option value="json_schema">BigQuery JSON Schema</option>
            <option value="python_sdk">Python BigQuery SDK</option>
            <option value="terraform">Terraform Google Provider</option>
          </select>
        </div>

        <div>
          <label htmlFor="graphql-bigquery-casing" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            {t('graphqltobigquery.field_casing', { defaultValue: 'Field Casing' })}
          </label>
          <select
            id="graphql-bigquery-casing"
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
          <label htmlFor="graphql-bigquery-partition" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            {t('graphqltobigquery.partition_by', { defaultValue: 'Partitioning Strategy' })}
          </label>
          <select
            id="graphql-bigquery-partition"
            value={partitionOption}
            onChange={(e) => setPartitionOption(e.target.value as PartitionOption)}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="created_at_day">Timestamp Field (DAY)</option>
            <option value="ingestion_time">Ingestion Time (_PARTITIONDATE)</option>
            <option value="none">No Partitioning</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      {/* Main Input / Output Textareas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-500" />
              <label htmlFor="graphql-bigquery-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('graphqltobigquery.graphql_input_label', { defaultValue: 'GraphQL SDL Input' })}
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
            id="graphql-bigquery-input"
            ref={primaryInputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setActivePreset(null);
            }}
            placeholder={t('graphqltobigquery.placeholder_graphql', { defaultValue: 'Paste GraphQL SDL schema here...' })}
            className="w-full h-96 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-emerald-500" />
              <label htmlFor="bigquery-output" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('graphqltobigquery.output_label', { defaultValue: 'Generated BigQuery Schema' })}
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
            id="bigquery-output"
            value={output}
            readOnly
            placeholder={t('graphqltobigquery.placeholder_output', { defaultValue: 'Generated BigQuery schema code will appear here...' })}
            className="w-full h-96 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-8 rounded-[2rem] flex items-start gap-6">
        <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0">
          <Database className="w-6 h-6" />
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white">
            {t('graphqltobigquery.about_title', { defaultValue: 'About GraphQL SDL to BigQuery Converter' })}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('graphqltobigquery.about_text', {
              defaultValue:
                'Convert GraphQL SDL schemas into Google BigQuery SQL DDL, JSON Schema definitions, Python BigQuery Client SDK code, or Terraform infrastructure resources. Supports automatic partitioning by TIMESTAMP or DATE fields.'
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
