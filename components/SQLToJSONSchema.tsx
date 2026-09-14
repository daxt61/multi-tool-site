import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Copy, Check, Trash2, Database, FileCode, Download, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

const MAX_LENGTH = 100000;

interface SQLToJSONSchemaProps {
  initialData?: any;
  onStateChange?: (state: any) => void;
}

type DraftVersion = '2020-12' | '07' | '04';
type SchemaMode = 'array' | 'defs' | 'object';
type CasingMode = 'original' | 'camelCase' | 'snake_case' | 'PascalCase';

const PRESETS = [
  {
    nameKey: 'sql_jsonschema.preset_users',
    defaultName: 'User Profiles & Roles',
    sql: `CREATE TABLE users (
  id INT NOT NULL AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  rating DOUBLE PRECISION DEFAULT 0.0,
  bio TEXT,
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);`
  },
  {
    nameKey: 'sql_jsonschema.preset_orders',
    defaultName: 'E-Commerce Orders & Items',
    sql: `CREATE TABLE orders (
  order_id UUID NOT NULL PRIMARY KEY,
  customer_email VARCHAR(255) NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) NOT NULL,
  items_count INT DEFAULT 1,
  shipping_address JSON,
  ordered_at DATETIME NOT NULL
);`
  },
  {
    nameKey: 'sql_jsonschema.preset_servers',
    defaultName: 'Server Telemetry Logs',
    sql: `CREATE TABLE server_logs (
  log_id BIGINT NOT NULL PRIMARY KEY,
  server_name VARCHAR(100) NOT NULL,
  cpu_usage FLOAT NOT NULL,
  memory_mb INT NOT NULL,
  status_code INT DEFAULT 200,
  error_message VARCHAR(500),
  logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`
  }
];

function toCasing(str: string, casing: CasingMode): string {
  if (!str) return str;
  if (casing === 'original') return str;

  const clean = str.replace(/[^a-zA-Z0-9_]/g, ' ');
  const words = clean.trim().split(/[\s_]+/).filter(Boolean);
  if (words.length === 0) return str;

  if (casing === 'camelCase') {
    return words.map((w, i) => i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
  }
  if (casing === 'snake_case') {
    return words.map(w => w.toLowerCase()).join('_');
  }
  if (casing === 'PascalCase') {
    return words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
  }
  return str;
}

function sqlColumnTypeToJsonType(columnType: string): { type: string; format?: string } {
  const t = columnType.toUpperCase();
  if (t.includes('INT') || t.includes('SERIAL')) return { type: 'integer' };
  if (t.includes('FLOAT') || t.includes('DOUBLE') || t.includes('DECIMAL') || t.includes('NUMERIC') || t.includes('REAL')) return { type: 'number' };
  if (t.includes('BOOL')) return { type: 'boolean' };
  if (t.includes('JSON') || t.includes('JSONB')) return { type: 'object' };
  if (t.includes('DATE') || t.includes('TIME')) {
    if (t.includes('DATETIME') || t.includes('TIMESTAMP')) return { type: 'string', format: 'date-time' };
    if (t.includes('TIME')) return { type: 'string', format: 'time' };
    return { type: 'string', format: 'date' };
  }
  if (t.includes('UUID')) return { type: 'string', format: 'uuid' };
  return { type: 'string' };
}

export function SQLToJSONSchema({ initialData, onStateChange }: SQLToJSONSchemaProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [sqlInput, setSqlInput] = useState<string>(initialData?.sqlInput ?? PRESETS[0].sql);
  const [draft, setDraft] = useState<DraftVersion>(initialData?.draft ?? '2020-12');
  const [mode, setMode] = useState<SchemaMode>(initialData?.mode ?? 'defs');
  const [casing, setCasing] = useState<CasingMode>(initialData?.casing ?? 'original');
  const [includeSchemaUri, setIncludeSchemaUri] = useState<boolean>(initialData?.includeSchemaUri ?? true);
  const [requireNotNull, setRequireNotNull] = useState<boolean>(initialData?.requireNotNull ?? true);
  const [includeExamples, setIncludeExamples] = useState<boolean>(initialData?.includeExamples ?? true);
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onStateChange?.({ sqlInput, draft, mode, casing, includeSchemaUri, requireNotNull, includeExamples });
  }, [sqlInput, draft, mode, casing, includeSchemaUri, requireNotNull, includeExamples, onStateChange]);

  const handleClear = useCallback(() => {
    setSqlInput('');
    setError(null);
    toast.success(t('sql_jsonschema.cleared', 'SQL input cleared'));
    inputRef.current?.focus();
  }, [t]);

  const parseSqlToSchema = useCallback(() => {
    if (!sqlInput.trim()) return '';

    if (sqlInput.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
      return '';
    }

    try {
      const tableBlocks = sqlInput.split(/CREATE\s+TABLE/i).slice(1);
      if (tableBlocks.length === 0) {
        throw new Error(t('sql_jsonschema.err_no_table', 'No CREATE TABLE statements found in SQL input.'));
      }

      const definitions: Record<string, any> = Object.create(null);

      tableBlocks.forEach((block) => {
        const tableNameMatch = block.match(/^\s*(?:IF\s+NOT\s+EXISTS\s+)?["`']?([a-zA-Z0-9_]+)["`']?\s*\(([\s\S]*)\)/i);
        if (!tableNameMatch) return;

        const rawTableName = tableNameMatch[1];
        const tableContent = tableNameMatch[2];
        const tableName = toCasing(rawTableName, casing);

        const properties: Record<string, any> = Object.create(null);
        const requiredFields: string[] = [];

        const lines = tableContent.split(',\n');
        lines.forEach((line) => {
          const trimmed = line.trim();
          if (!trimmed || /^(PRIMARY\s+KEY|FOREIGN\s+KEY|UNIQUE|KEY|INDEX|CONSTRAINT)/i.test(trimmed)) {
            return;
          }

          const colMatch = trimmed.match(/^["`']?([a-zA-Z0-9_]+)["`']?\s+([a-zA-Z0-9_()]+)([\s\S]*)$/i);
          if (!colMatch) return;

          const rawColName = colMatch[1];
          const colTypeStr = colMatch[2];
          const colRest = colMatch[3] || '';

          const colName = toCasing(rawColName, casing);
          const parsedType = sqlColumnTypeToJsonType(colTypeStr);

          const colProp: Record<string, any> = {
            type: parsedType.type
          };

          if (parsedType.format) {
            colProp.format = parsedType.format;
          }

          if (/NOT\s+NULL/i.test(colRest)) {
            if (requireNotNull) {
              requiredFields.push(colName);
            }
          }

          if (includeExamples) {
            if (parsedType.type === 'integer') colProp.examples = [1];
            else if (parsedType.type === 'number') colProp.examples = [19.99];
            else if (parsedType.type === 'boolean') colProp.examples = [true];
            else if (parsedType.type === 'object') colProp.examples = [{ key: 'value' }];
            else if (parsedType.format === 'date-time') colProp.examples = ['2025-01-01T12:00:00Z'];
            else if (parsedType.format === 'uuid') colProp.examples = ['123e4567-e89b-12d3-a456-426614174000'];
            else colProp.examples = [`sample_${colName}`];
          }

          properties[colName] = colProp;
        });

        const tableSchema: Record<string, any> = {
          type: 'object',
          title: tableName,
          properties
        };

        if (requiredFields.length > 0) {
          tableSchema.required = requiredFields;
        }

        definitions[tableName] = tableSchema;
      });

      const keys = Object.keys(definitions);
      if (keys.length === 0) {
        throw new Error(t('sql_jsonschema.err_parse_columns', 'Could not parse columns from CREATE TABLE statements.'));
      }

      let schemaUri = '';
      if (includeSchemaUri) {
        if (draft === '2020-12') schemaUri = 'https://json-schema.org/draft/2020-12/schema';
        else if (draft === '07') schemaUri = 'http://json-schema.org/draft-07/schema#';
        else schemaUri = 'http://json-schema.org/draft-04/schema#';
      }

      let finalSchema: Record<string, any> = Object.create(null);

      if (schemaUri) {
        finalSchema['$schema'] = schemaUri;
      }

      const defsKey = draft === '2020-12' ? '$defs' : 'definitions';

      if (mode === 'defs') {
        finalSchema[defsKey] = definitions;
        if (keys.length === 1) {
          const singleTable = definitions[keys[0]];
          finalSchema = {
            ...(schemaUri ? { $schema: schemaUri } : {}),
            ...singleTable,
            [defsKey]: definitions
          };
        }
      } else if (mode === 'array') {
        const primaryTable = definitions[keys[0]];
        finalSchema.type = 'array';
        finalSchema.title = `${keys[0]}List`;
        finalSchema.items = primaryTable;
        if (keys.length > 1) {
          finalSchema[defsKey] = definitions;
        }
      } else {
        if (keys.length === 1) {
          finalSchema = {
            ...(schemaUri ? { $schema: schemaUri } : {}),
            ...definitions[keys[0]]
          };
        } else {
          finalSchema[defsKey] = definitions;
        }
      }

      setError(null);
      return JSON.stringify(finalSchema, null, 2);
    } catch (err: any) {
      setError(err.message || 'Error parsing SQL DDL');
      return '';
    }
  }, [sqlInput, draft, mode, casing, includeSchemaUri, requireNotNull, includeExamples, t]);

  const outputSchema = useMemo(() => parseSqlToSchema(), [parseSqlToSchema]);

  const handleCopy = useCallback(() => {
    if (!outputSchema) return;
    navigator.clipboard.writeText(outputSchema);
    setCopied(true);
    toast.success(t('sql_jsonschema.copied', 'JSON Schema copied to clipboard'));
    setTimeout(() => setCopied(false), 2000);
  }, [outputSchema, t]);

  const handleDownload = () => {
    if (!outputSchema) return;
    const blob = new Blob([outputSchema], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'schema.json';
    link.click();
    URL.revokeObjectURL(url);
    toast.success(t('sql_jsonschema.downloaded', 'Downloaded schema.json'));
  };

  const handlersRef = useRef({ handleClear, handleCopy });
  useEffect(() => {
    handlersRef.current = { handleClear, handleCopy };
  }, [handleClear, handleCopy]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInputFocused =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement instanceof HTMLSelectElement ||
        activeElement?.getAttribute("contenteditable") === "true";

      if (isInputFocused && e.key !== 'Escape') return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key === "Escape") {
        e.preventDefault();
        handlersRef.current.handleClear();
      } else if (e.key.toLowerCase() === "c") {
        e.preventDefault();
        handlersRef.current.handleCopy();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Presets */}
      <div className="flex flex-wrap gap-2 items-center justify-between bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-500" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('sql_jsonschema.presets', 'Presets')}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => {
                setSqlInput(preset.sql);
                setError(null);
                toast.success(t('sql_jsonschema.preset_loaded', 'Loaded preset: {{name}}', { name: preset.defaultName }));
              }}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 transition-all text-slate-700 dark:text-slate-300"
            >
              {t(preset.nameKey, preset.defaultName)}
            </button>
          ))}
        </div>
      </div>

      {/* Options Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 text-sm">
        <div>
          <label htmlFor="draft-select" className="block text-xs font-bold text-slate-500 mb-1">{t('sql_jsonschema.draft', 'Draft Version')}</label>
          <select
            id="draft-select"
            value={draft}
            onChange={(e) => setDraft(e.target.value as DraftVersion)}
            className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-slate-100 font-semibold"
          >
            <option value="2020-12">Draft 2020-12 ($defs)</option>
            <option value="07">Draft-07 (definitions)</option>
            <option value="04">Draft-04 (definitions)</option>
          </select>
        </div>

        <div>
          <label htmlFor="mode-select" className="block text-xs font-bold text-slate-500 mb-1">{t('sql_jsonschema.mode', 'Schema Mode')}</label>
          <select
            id="mode-select"
            value={mode}
            onChange={(e) => setMode(e.target.value as SchemaMode)}
            className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-slate-100 font-semibold"
          >
            <option value="defs">{t('sql_jsonschema.mode_defs', 'Definitions ($defs)')}</option>
            <option value="array">{t('sql_jsonschema.mode_array', 'Root Array of Records')}</option>
            <option value="object">{t('sql_jsonschema.mode_object', 'Single Root Object')}</option>
          </select>
        </div>

        <div>
          <label htmlFor="casing-select" className="block text-xs font-bold text-slate-500 mb-1">{t('sql_jsonschema.casing', 'Key Casing')}</label>
          <select
            id="casing-select"
            value={casing}
            onChange={(e) => setCasing(e.target.value as CasingMode)}
            className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-slate-100 font-semibold"
          >
            <option value="original">{t('sql_jsonschema.casing_original', 'Original (from SQL)')}</option>
            <option value="camelCase">camelCase</option>
            <option value="snake_case">snake_case</option>
            <option value="PascalCase">PascalCase</option>
          </select>
        </div>

        <div className="space-y-2 flex flex-col justify-center">
          <label className="flex items-center gap-2 cursor-pointer font-semibold text-xs text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={requireNotNull}
              onChange={(e) => setRequireNotNull(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            {t('sql_jsonschema.not_null_required', 'NOT NULL → Required')}
          </label>
          <label className="flex items-center gap-2 cursor-pointer font-semibold text-xs text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={includeExamples}
              onChange={(e) => setIncludeExamples(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            {t('sql_jsonschema.include_examples', 'Include Examples')}
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="sql-jsonschema-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-500" /> {t('common.input')} SQL DDL
            </label>
            <div className="flex gap-2 items-center">
              <kbd className="hidden sm:inline-flex items-center justify-center px-1.5 py-0.5 border border-rose-200 dark:border-rose-800 rounded text-[10px] font-bold text-rose-400 bg-white dark:bg-slate-900">Esc</kbd>
              <button
                onClick={handleClear}
                disabled={!sqlInput}
                className="text-xs font-bold px-3 py-1 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
              >
                <Trash2 className="w-3 h-3" /> {t('common.clear')}
              </button>
            </div>
          </div>
          <div className="relative group">
            <textarea
              id="sql-jsonschema-input"
              ref={inputRef}
              value={sqlInput}
              onChange={(e) => setSqlInput(e.target.value)}
              placeholder="CREATE TABLE example ( id INT NOT NULL PRIMARY KEY, name VARCHAR(100) );"
              className={`w-full h-[500px] p-6 bg-slate-50 dark:bg-slate-900 border ${error ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'} rounded-[2rem] outline-none focus:ring-2 ${error ? 'focus:ring-rose-500/20' : 'focus:ring-indigo-500/20'} transition-all font-mono text-sm dark:text-slate-300 resize-none`}
            />
            {error && (
              <div className="absolute bottom-6 left-6 right-6 p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2">
                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                <p className="text-xs font-bold text-rose-600 dark:text-rose-400">{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Output */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="json-schema-output" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <FileCode className="w-4 h-4 text-indigo-500" /> {t('sql_jsonschema.output', 'Generated JSON Schema')}
            </label>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                disabled={!outputSchema}
                className="text-xs font-bold px-3 py-1 rounded-full text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 transition-all flex items-center gap-1 disabled:opacity-50"
                title={t('common.download')}
              >
                <Download className="w-3 h-3" />
              </button>
              <button
                onClick={handleCopy}
                disabled={!outputSchema}
                className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${copied ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' : 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 border-transparent'} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? t('common.copied') : t('common.copy')}
                {!copied && <kbd className="hidden sm:inline-flex items-center justify-center w-4 h-4 border border-slate-200 dark:border-slate-700 rounded text-[10px] font-bold bg-white/50 dark:bg-black/20 ml-1">C</kbd>}
              </button>
            </div>
          </div>
          <div className="bg-slate-900 dark:bg-black rounded-[2.5rem] p-6 h-[500px] overflow-auto border border-slate-800 shadow-xl shadow-indigo-500/5">
            <textarea
              id="json-schema-output"
              readOnly
              value={outputSchema}
              className="w-full h-full bg-transparent text-emerald-400 font-mono text-sm leading-relaxed outline-none resize-none"
              placeholder={t('sql_jsonschema.waiting', 'JSON Schema output will appear here...')}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
