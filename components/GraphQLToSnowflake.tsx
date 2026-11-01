import { useState, useTransition, useId, useRef, useEffect, useCallback } from 'react';
import { Database, Copy, Check, Download, AlertCircle, Trash2, FileCode } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

type SnowflakeTableType = 'PERMANENT' | 'TRANSIENT' | 'TEMPORARY' | 'HYBRID';
type CasingOption = 'UPPERCASE' | 'snake_case' | 'camelCase' | 'original';

interface ParsedField {
  name: string;
  type: string;
  rawType: string;
  isNonNull: boolean;
  isList: boolean;
  isCustomType: boolean;
  isEnum: boolean;
}

interface ParsedType {
  name: string;
  kind: 'type' | 'interface' | 'input';
  fields: ParsedField[];
  comment?: string;
}

interface ParsedEnum {
  name: string;
  values: string[];
}

const DEFAULT_GRAPHQL = `type User {
  id: ID!
  email: String!
  username: String!
  isActive: Boolean!
  role: Role!
  tags: [String!]
  metadata: JSON
  score: Float
  createdAt: DateTime!
  updatedAt: DateTime
}

enum Role {
  ADMIN
  EDITOR
  VIEWER
  GUEST
}

type Order {
  id: ID!
  userId: ID!
  totalAmount: Float!
  itemsCount: Int!
  status: OrderStatus!
  shippingAddress: JSON!
  placedAt: DateTime!
}

enum OrderStatus {
  PENDING
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
}`;

const PRESETS = [
  {
    id: 'ecommerce',
    label: 'E-Commerce Orders & Users',
    schema: `type User {
  id: ID!
  email: String!
  username: String!
  isActive: Boolean!
  role: Role!
  tags: [String!]
  metadata: JSON
  score: Float
  createdAt: DateTime!
  updatedAt: DateTime
}

enum Role {
  ADMIN
  EDITOR
  VIEWER
  GUEST
}

type Order {
  id: ID!
  userId: ID!
  totalAmount: Float!
  itemsCount: Int!
  status: OrderStatus!
  shippingAddress: JSON!
  placedAt: DateTime!
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
    id: 'telemetry',
    label: 'Sensor & IoT Telemetry',
    schema: `type DeviceMetric {
  metricId: ID!
  deviceId: String!
  deviceType: String!
  temperature: Float!
  humidity: Float!
  batteryVoltage: Float!
  status: DeviceStatus!
  readingPayload: JSON
  recordedAt: DateTime!
}

enum DeviceStatus {
  ONLINE
  OFFLINE
  DEGRADED
  MAINTENANCE
}

type DeviceAlert {
  alertId: ID!
  deviceId: String!
  severity: AlertSeverity!
  message: String!
  isAcknowledged: Boolean!
  triggeredAt: DateTime!
}`
  },
  {
    id: 'saas',
    label: 'SaaS Multi-Tenant Billing',
    schema: `type Organization {
  orgId: ID!
  name: String!
  tier: SubscriptionTier!
  seatsQuota: Int!
  isEnterprise: Boolean!
  billingDetails: JSON
  createdDate: Date!
}

enum SubscriptionTier {
  STARTER
  GROWTH
  ENTERPRISE
}

type SubscriptionInvoice {
  invoiceId: ID!
  orgId: ID!
  amountUsd: Float!
  status: InvoiceStatus!
  dueTimestamp: DateTime!
  lineItems: [JSON!]!
}

enum InvoiceStatus {
  DRAFT
  ISSUED
  PAID
  VOID
}`
  }
];

function applyCasing(str: string, casing: CasingOption): string {
  if (casing === 'original') return str;
  if (casing === 'UPPERCASE') {
    return str
      .replace(/([A-Z])/g, '_$1')
      .replace(/[-_\s]+/g, '_')
      .replace(/^_/, '')
      .toUpperCase();
  }
  if (casing === 'snake_case') {
    return str
      .replace(/([A-Z])/g, '_$1')
      .replace(/[-_\s]+/g, '_')
      .replace(/^_/, '')
      .toLowerCase();
  }
  if (casing === 'camelCase') {
    const cleaned = str.replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''));
    return cleaned.charAt(0).toLowerCase() + cleaned.slice(1);
  }
  return str;
}

function escapeSnowflakeIdentifier(identifier: string): string {
  // If standard uppercase alphanumeric with underscore, no need for double quotes
  if (/^[A-Z_][A-Z0-9_]*$/.test(identifier)) {
    return identifier;
  }
  return `"${identifier.replace(/"/g, '""')}"`;
}

function escapeSnowflakeString(value: string): string {
  return value.replace(/'/g, "''");
}

function mapScalarToSnowflake(type: string, isList: boolean, isEnum: boolean): string {
  if (isList) return 'ARRAY';
  if (isEnum) return 'VARCHAR(100)';

  switch (type) {
    case 'Int':
      return 'INTEGER';
    case 'Float':
      return 'FLOAT';
    case 'String':
      return 'VARCHAR(16777216)';
    case 'Boolean':
      return 'BOOLEAN';
    case 'ID':
      return 'VARCHAR(36)';
    case 'DateTime':
    case 'Timestamp':
      return 'TIMESTAMP_NTZ';
    case 'Date':
      return 'DATE';
    case 'Time':
      return 'TIME';
    case 'JSON':
    case 'JSONObject':
      return 'VARIANT';
    default:
      return 'VARIANT';
  }
}

function parseGraphQLSDL(sdl: string): { types: ParsedType[]; enums: ParsedEnum[] } {
  const enums: ParsedEnum[] = [];
  const types: ParsedType[] = [];

  const enumRegex = /enum\s+([A-Za-z0-9_]+)\s*\{([^}]+)\}/g;
  let enumMatch: RegExpExecArray | null;
  const knownEnums = Object.create(null) as Record<string, string[]>;

  while ((enumMatch = enumRegex.exec(sdl)) !== null) {
    const enumName = enumMatch[1];
    const rawValues = enumMatch[2]
      .split('\n')
      .map((line) => line.replace(/#.*$/, '').trim())
      .filter((line) => line.length > 0);

    const values: string[] = [];
    for (const line of rawValues) {
      const parts = line.split(/\s+/);
      if (parts[0] && /^[A-Za-z0-9_]+$/.test(parts[0])) {
        values.push(parts[0]);
      }
    }

    enums.push({ name: enumName, values });
    knownEnums[enumName] = values;
  }

  const typeRegex = /(?:type|interface|input)\s+([A-Za-z0-9_]+)(?:\s+implements\s+[A-Za-z0-9_,\s]+)?\s*\{([^}]+)\}/g;
  let typeMatch: RegExpExecArray | null;

  while ((typeMatch = typeRegex.exec(sdl)) !== null) {
    const typeName = typeMatch[1];
    if (typeName === 'Query' || typeName === 'Mutation' || typeName === 'Subscription') {
      continue;
    }

    const kindMatch = typeMatch[0].match(/^(type|interface|input)/);
    const kind = (kindMatch ? kindMatch[1] : 'type') as 'type' | 'interface' | 'input';

    const rawFields = typeMatch[2]
      .split('\n')
      .map((line) => line.replace(/#.*$/, '').trim())
      .filter((line) => line.length > 0 && line.includes(':'));

    const fields: ParsedField[] = [];

    for (const line of rawFields) {
      const colonIdx = line.indexOf(':');
      if (colonIdx === -1) continue;

      let fieldName = line.slice(0, colonIdx).trim();
      if (fieldName.includes('(')) {
        fieldName = fieldName.slice(0, fieldName.indexOf('(')).trim();
      }

      const rest = line.slice(colonIdx + 1).trim();
      const typePart = rest.split(/\s+/)[0];

      const isNonNull = typePart.endsWith('!');
      const cleanType = typePart.replace(/!/g, '');
      const isList = cleanType.startsWith('[') && cleanType.endsWith(']');
      const innerType = cleanType.replace(/[\[\]]/g, '');

      const isEnum = Boolean(knownEnums[innerType]);
      const standardScalars = ['Int', 'Float', 'String', 'Boolean', 'ID', 'DateTime', 'Date', 'Time', 'JSON', 'JSONObject'];
      const isCustomType = !standardScalars.includes(innerType) && !isEnum;

      fields.push({
        name: fieldName,
        type: innerType,
        rawType: typePart,
        isNonNull,
        isList,
        isCustomType,
        isEnum
      });
    }

    if (fields.length > 0) {
      types.push({ name: typeName, kind, fields });
    }
  }

  return { types, enums };
}

export function GraphQLToSnowflake() {
  const { t } = useTranslation();
  const [, startTransition] = useTransition();

  const [input, setInput] = useState<string>(DEFAULT_GRAPHQL);
  const [output, setOutput] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>('ecommerce');

  // Snowflake configuration state
  const [tableType, setTableType] = useState<SnowflakeTableType>('PERMANENT');
  const [casing, setCasing] = useState<CasingOption>('UPPERCASE');
  const [useOrReplace, setUseOrReplace] = useState<boolean>(true);
  const [clusterByKeys, setClusterByKeys] = useState<string>('');
  const [retentionDays, setRetentionDays] = useState<string>('');
  const [addCheckConstraints, setAddCheckConstraints] = useState<boolean>(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const primaryInputRef = useRef<HTMLTextAreaElement>(null);

  const generateSnowflakeDDL = useCallback(() => {
    setError(null);
    if (!input.trim()) {
      setOutput('');
      return;
    }

    if (input.length > 100000) {
      setError(t('graphqlto_snowflake.error_size', { defaultValue: 'Input GraphQL SDL exceeds max allowable size (100,000 characters)' }));
      setOutput('');
      return;
    }

    try {
      const { types, enums } = parseGraphQLSDL(input);

      if (types.length === 0) {
        setOutput('-- No GraphQL types, interfaces, or inputs detected.');
        return;
      }

      const enumMap = Object.create(null) as Record<string, string[]>;
      for (const e of enums) {
        enumMap[e.name] = e.values;
      }

      const ddlStatements: string[] = [];

      for (const type of types) {
        const rawTableName = type.name;
        const formattedTableName = applyCasing(rawTableName, casing);
        const escapedTableName = escapeSnowflakeIdentifier(formattedTableName);

        let tableHeader = 'CREATE ';
        if (useOrReplace) {
          tableHeader += 'OR REPLACE ';
        }
        if (tableType === 'TRANSIENT') {
          tableHeader += 'TRANSIENT TABLE ';
        } else if (tableType === 'TEMPORARY') {
          tableHeader += 'TEMPORARY TABLE ';
        } else if (tableType === 'HYBRID') {
          tableHeader += 'HYBRID TABLE ';
        } else {
          tableHeader += 'TABLE ';
        }

        tableHeader += escapedTableName;

        const columnLines: string[] = [];
        let primaryKeyCol: string | null = null;

        for (const field of type.fields) {
          const formattedColName = applyCasing(field.name, casing);
          const escapedColName = escapeSnowflakeIdentifier(formattedColName);
          const sfType = mapScalarToSnowflake(field.type, field.isList, field.isEnum);

          let line = `  ${escapedColName} ${sfType}`;

          if (field.isNonNull) {
            line += ' NOT NULL';
          }

          if (field.name.toLowerCase() === 'id' || field.name.toLowerCase() === `${type.name.toLowerCase()}id`) {
            if (!primaryKeyCol) {
              primaryKeyCol = escapedColName;
            }
          }

          if (field.isEnum && addCheckConstraints && enumMap[field.type]) {
            const vals = enumMap[field.type].map((v) => `'${escapeSnowflakeString(v)}'`).join(', ');
            line += ` CHECK (${escapedColName} IN (${vals}))`;
          }

          if (field.isCustomType && !field.isList) {
            line += ` COMMENT 'Nested GraphQL reference: ${escapeSnowflakeString(field.type)}'`;
          }

          columnLines.push(line);
        }

        if (primaryKeyCol) {
          columnLines.push(`  PRIMARY KEY (${primaryKeyCol})`);
        }

        let stmt = `${tableHeader} (\n${columnLines.join(',\n')}\n)`;

        const options: string[] = [];

        if (clusterByKeys.trim()) {
          const keys = clusterByKeys
            .split(',')
            .map((k) => escapeSnowflakeIdentifier(applyCasing(k.trim(), casing)))
            .join(', ');
          options.push(`CLUSTER BY (${keys})`);
        }

        if (retentionDays.trim() && !isNaN(Number(retentionDays))) {
          options.push(`DATA_RETENTION_TIME_IN_DAYS = ${parseInt(retentionDays, 10)}`);
        }

        options.push(`COMMENT = 'Generated from GraphQL ${type.kind} ${escapeSnowflakeString(type.name)}'`);

        if (options.length > 0) {
          stmt += '\n' + options.join('\n');
        }

        stmt += ';';
        ddlStatements.push(stmt);
      }

      setOutput(ddlStatements.join('\n\n'));
    } catch (e: any) {
      setError(e.message || 'Failed to parse GraphQL SDL.');
      setOutput('');
    }
  }, [input, tableType, casing, useOrReplace, clusterByKeys, retentionDays, addCheckConstraints, t]);

  useEffect(() => {
    startTransition(() => {
      generateSnowflakeDDL();
    });
  }, [generateSnowflakeDDL]);

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success(t('graphqlto_snowflake.toast_copied', { defaultValue: 'Snowflake DDL copied to clipboard' }));
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'snowflake_schema.sql';
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t('graphqlto_snowflake.toast_downloaded', { defaultValue: 'Snowflake schema downloaded' }));
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    setActivePreset(null);
    setError(null);
    primaryInputRef.current?.focus();
    toast.info(t('graphqlto_snowflake.toast_cleared', { defaultValue: 'Input cleared' }));
  };

  const handlePreset = (presetId: string, schema: string) => {
    setInput(schema);
    setActivePreset(presetId);
    primaryInputRef.current?.focus();
    toast.success(t('graphqlto_snowflake.toast_preset_loaded', { defaultValue: 'Preset loaded' }));
  };

  const handlersRef = useRef({ handleClear, handleCopy });
  useEffect(() => {
    handlersRef.current = { handleClear, handleCopy };
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!containerRef.current?.contains(document.activeElement)) return;

      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT';

      if (e.key === 'Escape') {
        e.preventDefault();
        handlersRef.current.handleClear();
      } else if (e.key.toLowerCase() === 'c' && !isInput && (e.metaKey || e.ctrlKey || (!e.metaKey && !e.ctrlKey))) {
        e.preventDefault();
        handlersRef.current.handleCopy();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div ref={containerRef} className="max-w-6xl mx-auto space-y-6">
      {/* Quick-Start Presets */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-3xl shadow-sm">
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-xs font-black uppercase tracking-widest text-slate-400">
            {t('graphqlto_snowflake.presets_title', { defaultValue: 'Quick Presets' })}
          </span>
          <span className="text-[10px] text-slate-400">GraphQL SDL ➔ Snowflake DDL</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => handlePreset(p.id, p.schema)}
              aria-pressed={activePreset === p.id}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                activePreset === p.id
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Configuration Controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label htmlFor="graphql-snowflake-table-type" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            {t('graphqlto_snowflake.table_type', { defaultValue: 'Snowflake Table Type' })}
          </label>
          <select
            id="graphql-snowflake-table-type"
            value={tableType}
            onChange={(e) => setTableType(e.target.value as SnowflakeTableType)}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="PERMANENT">PERMANENT</option>
            <option value="TRANSIENT">TRANSIENT</option>
            <option value="TEMPORARY">TEMPORARY</option>
            <option value="HYBRID">HYBRID (Unistore OLTP/OLAP)</option>
          </select>
        </div>

        <div>
          <label htmlFor="graphql-snowflake-casing" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            {t('graphqlto_snowflake.casing', { defaultValue: 'Field & Table Casing' })}
          </label>
          <select
            id="graphql-snowflake-casing"
            value={casing}
            onChange={(e) => setCasing(e.target.value as CasingOption)}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="UPPERCASE">UPPERCASE (Snowflake Standard)</option>
            <option value="snake_case">snake_case</option>
            <option value="camelCase">camelCase</option>
            <option value="original">Original</option>
          </select>
        </div>

        <div>
          <label htmlFor="graphql-snowflake-clusterby" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            {t('graphqlto_snowflake.cluster_by', { defaultValue: 'Cluster By Keys' })}
          </label>
          <input
            id="graphql-snowflake-clusterby"
            type="text"
            value={clusterByKeys}
            onChange={(e) => setClusterByKeys(e.target.value)}
            placeholder="e.g. createdAt, role"
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="graphql-snowflake-retention" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            {t('graphqlto_snowflake.retention_days', { defaultValue: 'Data Retention Days (Time Travel)' })}
          </label>
          <input
            id="graphql-snowflake-retention"
            type="number"
            min="0"
            max="90"
            value={retentionDays}
            onChange={(e) => setRetentionDays(e.target.value)}
            placeholder="e.g. 1 or 90"
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
            {t('graphqlto_snowflake.use_or_replace', { defaultValue: 'CREATE OR REPLACE TABLE' })}
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={addCheckConstraints}
              onChange={(e) => setAddCheckConstraints(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
            />
            {t('graphqlto_snowflake.check_constraints', { defaultValue: 'Generate CHECK constraints for enums' })}
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
              <label htmlFor="graphql-snowflake-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('graphqlto_snowflake.input_label', { defaultValue: 'GraphQL SDL Input' })}
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
            id="graphql-snowflake-input"
            ref={primaryInputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setActivePreset(null);
            }}
            placeholder="Paste GraphQL SDL schema here..."
            className="w-full h-96 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-emerald-500" />
              <label htmlFor="snowflake-output" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('graphqlto_snowflake.output_label', { defaultValue: 'Snowflake SQL DDL Output' })}
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
            id="snowflake-output"
            value={output}
            readOnly
            placeholder={t('graphqlto_snowflake.placeholder_output', { defaultValue: 'Snowflake SQL DDL statements will appear here...' })}
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
            {t('graphqlto_snowflake.about_title', { defaultValue: 'About GraphQL SDL to Snowflake Converter' })}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('graphqlto_snowflake.about_text', {
              defaultValue:
                'Convert GraphQL SDL schema models into Snowflake Cloud Data Warehouse SQL DDL statements. Map GraphQL scalar types to Snowflake native data types (NUMBER, FLOAT, VARCHAR, TIMESTAMP_NTZ, VARIANT, ARRAY) with full support for table types (PERMANENT, TRANSIENT, TEMPORARY, HYBRID), cluster keys, retention periods, and enum constraints.'
            })}
          </p>
          <ul className="text-sm text-slate-500 dark:text-slate-400 space-y-2 list-disc pl-5">
            <li>{t('graphqlto_snowflake.list_1', { defaultValue: 'Native Snowflake data type mapping with VARIANT support for JSON/nested objects and ARRAY for lists.' })}</li>
            <li>{t('graphqlto_snowflake.list_2', { defaultValue: 'Supports standard PERMANENT, TRANSIENT, TEMPORARY, and Unistore HYBRID tables with primary key enforcement.' })}</li>
            <li>{t('graphqlto_snowflake.list_3', { defaultValue: 'Customizable clustering keys, Time Travel data retention (DATA_RETENTION_TIME_IN_DAYS), and identifier casing.' })}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
