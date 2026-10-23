import { useState, useEffect, useCallback, useRef } from 'react';
import { Database, Copy, Check, Trash2, AlertCircle, Download, Info, Sparkles, FileCode } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;

const CASSANDRA_KEYWORDS = new Set([
  'add', 'aggregate', 'all', 'allow', 'alter', 'and', 'any', 'apply', 'as', 'asc', 'ascii',
  'authorize', 'batch', 'begin', 'bigint', 'blob', 'boolean', 'by', 'clustering', 'compact',
  'contains', 'count', 'counter', 'create', 'custom', 'date', 'decimal', 'delete', 'desc',
  'describe', 'distinct', 'double', 'drop', 'entries', 'execute', 'exists', 'filtering',
  'float', 'from', 'frozen', 'full', 'grant', 'if', 'in', 'index', 'inet', 'infinity',
  'insert', 'int', 'into', 'is', 'keyspace', 'keyspaces', 'limit', 'list', 'map', 'nan',
  'no', 'not', 'null', 'of', 'on', 'one', 'order', 'primary', 'rename', 'replace',
  'revoke', 'schema', 'select', 'set', 'smallint', 'storage', 'supercolumn', 'table',
  'text', 'time', 'timestamp', 'timeuuid', 'tinyint', 'to', 'token', 'truncate', 'ttl',
  'tuple', 'type', 'unlogged', 'update', 'use', 'user', 'users', 'using', 'uuid', 'values',
  'varchar', 'varint', 'where', 'with'
]);

type FieldCasing = 'snake_case' | 'camelCase' | 'PascalCase' | 'original';

export function GraphQLToCassandra({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [input, setInput] = useState(initialData?.input || '');
  const [output, setOutput] = useState(initialData?.output || '');
  const [fieldCasing, setFieldCasing] = useState<FieldCasing>(initialData?.fieldCasing || 'snake_case');
  const [keyspace, setKeyspace] = useState(initialData?.keyspace || 'app_keyspace');
  const [includeKeyspace, setIncludeKeyspace] = useState(initialData?.includeKeyspace ?? true);
  const [activePresetId, setActivePresetId] = useState<string | null>(initialData?.activePresetId || null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({
      input,
      output,
      fieldCasing,
      keyspace,
      includeKeyspace,
      activePresetId,
    });
  }, [input, output, fieldCasing, keyspace, includeKeyspace, activePresetId, onStateChange]);

  const PRESETS = {
    sensor_telemetry: `# IoT Sensor Telemetry Schema
type SensorReading {
  sensorId: ID!
  readingTimestamp: DateTime!
  temperature: Float
  humidity: Float
  batteryLevel: Int
  status: String
}

enum SensorStatus {
  ACTIVE
  INACTIVE
  MAINTENANCE
  ERROR
}`,
    user_sessions: `# User Auth & Sessions Schema
type UserSession {
  userId: ID!
  sessionId: String!
  ipAddress: String
  userAgent: String
  createdAt: DateTime!
  expiresAt: DateTime
  isActive: Boolean!
}`,
    ecommerce_catalog: `# E-Commerce Catalog Schema
type Product {
  categoryId: ID!
  productId: String!
  title: String!
  price: Float!
  stockQuantity: Int!
  isAvailable: Boolean!
  createdAt: DateTime!
}`
  };

  const transformCase = (str: string, style: FieldCasing): string => {
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

  const sanitizeName = (key: string, style: FieldCasing): string => {
    let transformed = transformCase(key, style);
    let safeKey = transformed.replace(/[^a-zA-Z0-9_]/g, '_');
    if (/^[0-9]/.test(safeKey)) safeKey = '_' + safeKey;
    if (CASSANDRA_KEYWORDS.has(safeKey.toLowerCase()) || ['__proto__', 'constructor', 'prototype'].includes(key) || !safeKey) {
      safeKey = `"${safeKey}"`;
    }
    return safeKey;
  };

  const mapGqlTypeToCassandra = (
    gqlTypeStr: string,
    enumNames: Set<string>,
    udtNames: Set<string>
  ): { cqlType: string; isNonNull: boolean; isList: boolean } => {
    const raw = gqlTypeStr.trim();
    const isNonNull = raw.endsWith('!');
    const typeWithoutOuterBang = isNonNull ? raw.slice(0, -1).trim() : raw;
    const isList = typeWithoutOuterBang.startsWith('[') && typeWithoutOuterBang.endsWith(']');
    const baseType = isList ? typeWithoutOuterBang.slice(1, -1).replace(/!$/, '').trim() : typeWithoutOuterBang;

    let cqlType = 'text';

    if (baseType === 'ID') {
      cqlType = 'uuid';
    } else if (baseType === 'String') {
      cqlType = 'text';
    } else if (baseType === 'Int') {
      cqlType = 'int';
    } else if (baseType === 'Float') {
      cqlType = 'double';
    } else if (baseType === 'Boolean') {
      cqlType = 'boolean';
    } else if (baseType === 'DateTime' || baseType === 'Date' || baseType === 'Timestamp') {
      cqlType = 'timestamp';
    } else if (baseType === 'JSON' || baseType === 'JSONObject') {
      cqlType = 'text';
    } else if (enumNames.has(baseType)) {
      cqlType = 'text';
    } else if (udtNames.has(baseType)) {
      cqlType = `frozen<${sanitizeName(baseType, fieldCasing)}>`;
    }

    if (isList) {
      cqlType = `list<${cqlType}>`;
    }

    return { cqlType, isNonNull, isList };
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
        setOutput('');
        return;
      }

      const cleanInput = input
        .replace(/#.*$/gm, '')
        .replace(/"""[\s\S]*?"""/g, '')
        .replace(/"[\s\S]*?"/g, (m: string) => m.includes('\n') ? '""' : m);

      // Collect Enums
      const enumNames = new Set<string>();
      const enumRegex = /enum\s+([A-Za-z0-9_]+)\s*\{([^}]*)\}/g;
      let enumMatch: RegExpExecArray | null;
      while ((enumMatch = enumRegex.exec(cleanInput)) !== null) {
        enumNames.add(enumMatch[1]);
      }

      // Collect UDTs & Types
      const udtNames = new Set<string>();
      const structRegex = /(type|interface|input)\s+([A-Za-z0-9_]+)(?:\s+implements\s+[^{]+)?\s*\{([^}]*)\}/g;
      let structMatch: RegExpExecArray | null;
      const allTypes: Array<{ kind: string; name: string; body: string }> = [];

      while ((structMatch = structRegex.exec(cleanInput)) !== null) {
        const kind = structMatch[1];
        const name = structMatch[2];
        const body = structMatch[3];
        allTypes.push({ kind, name, body });
        if (kind === 'input') {
          udtNames.add(name);
        }
      }

      const cqlBlocks: string[] = [];

      if (includeKeyspace && keyspace.trim()) {
        const safeKeyspace = sanitizeName(keyspace.trim(), 'snake_case');
        cqlBlocks.push(
          `CREATE KEYSPACE IF NOT EXISTS ${safeKeyspace}\nWITH replication = {'class': 'SimpleStrategy', 'replication_factor': 1};\n\nUSE ${safeKeyspace};`
        );
      }

      allTypes.forEach(({ kind, name, body }) => {
        const tableName = sanitizeName(name, fieldCasing);
        const lines = body
          .split('\n')
          .map(l => l.trim())
          .filter(l => l && !l.startsWith('#'));

        const fields: Array<{ name: string; cqlType: string; rawName: string }> = [];
        let primaryKeys: string[] = [];

        lines.forEach(line => {
          const cleanLine = line.replace(/\([^)]*\)/, '');
          const colonIdx = cleanLine.indexOf(':');
          if (colonIdx === -1) return;

          const rawFieldName = cleanLine.substring(0, colonIdx).trim();
          const rawTypeStr = cleanLine.substring(colonIdx + 1).trim();

          if (!rawFieldName || !rawTypeStr) return;

          const fieldName = sanitizeName(rawFieldName, fieldCasing);
          const { cqlType } = mapGqlTypeToCassandra(rawTypeStr, enumNames, udtNames);

          if (rawFieldName.toLowerCase().includes('id') || rawFieldName.toLowerCase() === 'pk') {
            if (!primaryKeys.includes(fieldName)) {
              primaryKeys.push(fieldName);
            }
          }

          fields.push({ name: fieldName, cqlType, rawName: rawFieldName });
        });

        if (fields.length === 0) return;

        if (primaryKeys.length === 0) {
          primaryKeys = [fields[0].name];
        }

        if (kind === 'input') {
          // Generate User Defined Type (UDT)
          const fieldDefs = fields.map(f => `  ${f.name} ${f.cqlType}`);
          cqlBlocks.push(`CREATE TYPE IF NOT EXISTS ${tableName} (\n${fieldDefs.join(',\n')}\n);`);
        } else {
          // Generate Cassandra Table
          const fieldDefs = fields.map(f => `  ${f.name} ${f.cqlType}`);
          let pkClause = '';
          if (primaryKeys.length > 1) {
            pkClause = `  PRIMARY KEY ((${primaryKeys[0]}), ${primaryKeys.slice(1).join(', ')})`;
          } else {
            pkClause = `  PRIMARY KEY (${primaryKeys[0]})`;
          }
          fieldDefs.push(pkClause);

          cqlBlocks.push(`CREATE TABLE IF NOT EXISTS ${tableName} (\n${fieldDefs.join(',\n')}\n);`);
        }
      });

      if (cqlBlocks.length === 0) {
        setError(t('graphqltocassandra.no_types_found', 'No valid GraphQL types or inputs found.'));
        setOutput('');
        return;
      }

      setOutput(cqlBlocks.join('\n\n').trim());
      setError('');
    } catch (e: any) {
      setError(t('graphqltocassandra.error_parsing', 'Error parsing GraphQL schema') + ': ' + e.message);
      setOutput('');
    }
  }, [input, fieldCasing, keyspace, includeKeyspace, t]);

  useEffect(() => {
    handleConvert();
  }, [handleConvert]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success(t('graphqltocassandra.toast_copied', 'Cassandra CQL schema copied to clipboard!'));
    setTimeout(() => setCopied(false), 2000);
  }, [output, t]);

  const handleClear = useCallback(() => {
    setInput('');
    setOutput('');
    setError('');
    setActivePresetId(null);
    toast.success(t('common.cleared', 'Cleared!'));
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [t]);

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'schema.cql';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(t('graphqltocassandra.toast_downloaded', 'Downloaded schema.cql!'));
  };

  const loadPreset = (presetKey: keyof typeof PRESETS) => {
    setInput(PRESETS[presetKey]);
    setActivePresetId(presetKey);
    toast.success(t('graphqltocassandra.preset_loaded', 'Loaded GraphQL preset!'));
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
        activeElement?.getAttribute('contenteditable') === 'true';

      const isBodyOrContainer =
        !activeElement ||
        activeElement === document.body ||
        containerRef.current?.contains(activeElement as Node);

      if (e.key === 'Escape' && isBodyOrContainer) {
        e.preventDefault();
        handlersRef.current.handleClear();
      } else if (e.key.toLowerCase() === 'c' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        if (!isEditable && isBodyOrContainer && handlersRef.current.output) {
          e.preventDefault();
          handlersRef.current.handleCopy();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div ref={containerRef} className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Presets Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-500" aria-hidden="true" />
          <span className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('graphqltocassandra.presets_title', 'Quick Start Presets:')}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(['sensor_telemetry', 'user_sessions', 'ecommerce_catalog'] as const).map((pKey) => {
            const isActive = activePresetId === pKey;
            return (
              <button
                key={pKey}
                type="button"
                onClick={() => loadPreset(pKey)}
                aria-pressed={isActive}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all shadow-sm border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                  isActive
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-indigo-600/20'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-500'
                }`}
              >
                {t(`graphqltocassandra.preset_${pKey}`, pKey === 'sensor_telemetry' ? 'IoT Sensor Telemetry' : pKey === 'user_sessions' ? 'User Auth & Sessions' : 'E-Commerce Catalog')}
              </button>
            );
          })}
        </div>
      </div>

      {/* Options Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-5 bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="space-y-1.5">
          <label htmlFor="cassandra-keyspace-input" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('graphqltocassandra.keyspace_label', 'Keyspace Name')}
          </label>
          <input
            id="cassandra-keyspace-input"
            type="text"
            value={keyspace}
            onChange={(e) => setKeyspace(e.target.value)}
            placeholder="e.g. app_keyspace"
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="cassandra-field-casing" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('graphqltocassandra.field_casing', 'Field Casing')}
          </label>
          <select
            id="cassandra-field-casing"
            value={fieldCasing}
            onChange={(e) => setFieldCasing(e.target.value as FieldCasing)}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="snake_case">snake_case (Cassandra Standard)</option>
            <option value="camelCase">camelCase</option>
            <option value="PascalCase">PascalCase</option>
            <option value="original">Original Field Name</option>
          </select>
        </div>

        <div className="flex items-center pt-6 col-span-1 md:col-span-2 lg:col-span-1">
          <label htmlFor="cassandra-include-keyspace" className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              id="cassandra-include-keyspace"
              type="checkbox"
              checked={includeKeyspace}
              onChange={(e) => setIncludeKeyspace(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
            {t('graphqltocassandra.include_keyspace', 'Include CREATE KEYSPACE statement')}
          </label>
        </div>
      </div>

      {/* Editor Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-500" aria-hidden="true" />
              <label htmlFor="graphql-cassandra-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('graphqltocassandra.graphql_input_label', 'GraphQL SDL Schema')}
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Kbd modifier={null} className="hidden sm:inline-flex border-rose-200 dark:border-rose-800 text-rose-400 dark:bg-slate-900">Esc</Kbd>
              <button
                type="button"
                onClick={handleClear}
                disabled={!input && !output}
                className="text-xs font-bold px-3 py-1.5 rounded-xl text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all flex items-center gap-1 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
              >
                <Trash2 className="w-3 h-3" aria-hidden="true" /> {t('common.clear')}
              </button>
            </div>
          </div>
          <textarea
            id="graphql-cassandra-input"
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              if (activePresetId) setActivePresetId(null);
            }}
            placeholder={t('graphqltocassandra.placeholder_graphql', 'Paste GraphQL SDL schema statements here...')}
            className="w-full h-[450px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-emerald-500" aria-hidden="true" />
              <label htmlFor="cassandra-output" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('graphqltocassandra.output_label', 'Generated Cassandra CQL Schema')}
              </label>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleDownload}
                disabled={!output}
                className="text-xs font-bold px-3 py-1.5 rounded-xl text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 transition-all flex items-center gap-1 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
              >
                <Download className="w-3 h-3" aria-hidden="true" /> {t('common.download')}
              </button>
              <button
                type="button"
                onClick={handleCopy}
                disabled={!output}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                  copied
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                    : 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                {copied ? <Check className="w-3 h-3" aria-hidden="true" /> : <Copy className="w-3 h-3" aria-hidden="true" />} {copied ? t('common.copied') : t('common.copy')}
                {!copied && input && <Kbd modifier={null} className="hidden sm:inline-flex w-4 h-4 bg-white/50 dark:bg-black/20 ml-1">C</Kbd>}
              </button>
            </div>
          </div>
          <textarea
            id="cassandra-output"
            value={output}
            readOnly
            placeholder={t('graphqltocassandra.placeholder_output', 'Generated Cassandra CQL queries will appear here...')}
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
          <h4 className="font-bold dark:text-white">{t('graphqltocassandra.about_title', 'About GraphQL SDL to Apache Cassandra CQL Generator')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('graphqltocassandra.about_text', 'Convert GraphQL Schema Definition Language (SDL) types, inputs, and enums into Apache Cassandra CQL CREATE TABLE, CREATE TYPE (UDT), and CREATE KEYSPACE statements. Supports data type mapping (uuid, text, int, double, boolean, timestamp), input types as frozen UDTs, field casing, and reserved keyword protections.')}
          </p>
        </div>
      </div>
    </div>
  );
}
