import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Database, Copy, Check, Trash2, AlertCircle, Download, Info, Sparkles, FileCode } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;

type CasingOption = 'original' | 'snake_case' | 'camelCase' | 'PascalCase';

interface Preset {
  id: string;
  labelKey: string;
  defaultLabel: string;
  sql: string;
}

const PRESETS: Preset[] = [
  {
    id: 'ecommerce_catalog',
    labelKey: 'sqltoavro.preset_ecommerce',
    defaultLabel: 'E-Commerce Catalog',
    sql: `CREATE TABLE products (
  id INT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(50) UNIQUE,
  price DECIMAL(10, 2) NOT NULL,
  stock_quantity INT DEFAULT 0,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`
  },
  {
    id: 'user_auth_roles',
    labelKey: 'sqltoavro.preset_user_auth',
    defaultLabel: 'User Auth & Roles',
    sql: `CREATE TABLE users (
  user_id UUID PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  bio TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  login_count INT DEFAULT 0,
  created_at TIMESTAMP NOT NULL
);`
  },
  {
    id: 'financial_audit',
    labelKey: 'sqltoavro.preset_financial',
    defaultLabel: 'Financial Audit',
    sql: `CREATE TABLE audit_logs (
  log_id BIGINT PRIMARY KEY,
  account_number VARCHAR(34) NOT NULL,
  amount DOUBLE NOT NULL,
  currency CHAR(3) DEFAULT 'USD',
  ip_address VARCHAR(45),
  transacted_at TIMESTAMP NOT NULL
);`
  }
];

export function SQLToAvro({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [sql, setSql] = useState(initialData?.sql || PRESETS[0].sql);
  const [namespace, setNamespace] = useState(initialData?.namespace || 'com.example.avro');
  const [casing, setCasing] = useState<CasingOption>(initialData?.casing || 'original');
  const [useLogicalTypes, setUseLogicalTypes] = useState<boolean>(initialData?.useLogicalTypes ?? true);
  const [nullFirst, setNullFirst] = useState<boolean>(initialData?.nullFirst ?? true);
  const [output, setOutput] = useState(initialData?.output || '');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>('ecommerce_catalog');

  useEffect(() => {
    onStateChange?.({ sql, namespace, casing, useLogicalTypes, nullFirst, output });
  }, [sql, namespace, casing, useLogicalTypes, nullFirst, output, onStateChange]);

  const applyCasing = (str: string, style: CasingOption): string => {
    const clean = str.replace(/[`"'[\]]/g, '').trim();
    if (style === 'original' || !clean) return clean;

    const words = clean.split(/[^a-zA-Z0-9]+/).filter(Boolean);
    if (words.length === 0) return clean;

    if (style === 'snake_case') {
      return words.map(w => w.toLowerCase()).join('_');
    }

    if (style === 'camelCase') {
      return words.map((w, idx) => {
        const lower = w.toLowerCase();
        return idx === 0 ? lower : lower.charAt(0).toUpperCase() + lower.slice(1);
      }).join('');
    }

    if (style === 'PascalCase') {
      return words.map(w => {
        const lower = w.toLowerCase();
        return lower.charAt(0).toUpperCase() + lower.slice(1);
      }).join('');
    }

    return clean;
  };

  const mapSqlTypeToAvro = (typeStr: string, logical: boolean): any => {
    const upper = typeStr.toUpperCase().trim();

    if (upper.includes('INT') || upper.includes('INTEGER')) {
      if (upper.includes('BIG') || upper.includes('INT8')) return 'long';
      return 'int';
    }

    if (upper.includes('FLOAT') || upper.includes('REAL')) return 'float';

    if (upper.includes('DOUBLE') || upper.includes('DECIMAL') || upper.includes('NUMERIC') || upper.includes('MONEY')) {
      const match = upper.match(/(?:DECIMAL|NUMERIC)\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)/);
      if (match && logical) {
        return {
          type: 'bytes',
          logicalType: 'decimal',
          precision: parseInt(match[1], 10),
          scale: parseInt(match[2], 10)
        };
      }
      return 'double';
    }

    if (upper.includes('BOOL')) return 'boolean';

    if (upper.includes('TIMESTAMP') || upper.includes('DATETIME')) {
      if (logical) {
        return {
          type: 'long',
          logicalType: 'timestamp-millis'
        };
      }
      return 'long';
    }

    if (upper.includes('DATE')) {
      if (logical) {
        return {
          type: 'int',
          logicalType: 'date'
        };
      }
      return 'int';
    }

    if (upper.includes('BLOB') || upper.includes('BINARY') || upper.includes('BYTEA')) {
      return 'bytes';
    }

    return 'string';
  };

  const handleConvert = useCallback(() => {
    if (!sql.trim()) {
      setOutput('');
      setError('');
      return;
    }

    if (sql.length > MAX_LENGTH) {
      setError(t('error.max_length_sql', { max: MAX_LENGTH.toLocaleString() }));
      setOutput('');
      return;
    }

    try {
      const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([`"'a-zA-Z0-9_.]+)\s*\(([\s\S]*?)\)(?:;|\n\s*$|\s*ENGINE|\s*WITH|\s*$)/gi;
      const avroSchemas: any[] = [];

      let match;
      while ((match = tableRegex.exec(sql)) !== null) {
        const rawTableName = match[1].replace(/[`"'[\]]/g, '').split('.').pop() || 'record';
        const tableName = applyCasing(rawTableName, 'PascalCase');
        const body = match[2];

        const lines = body.split('\n');
        const fields: any[] = [];

        for (let line of lines) {
          line = line.trim();
          if (!line || line.startsWith('--') || line.startsWith('/*')) continue;

          const upperLine = line.toUpperCase();
          if (
            upperLine.startsWith('PRIMARY KEY') ||
            upperLine.startsWith('FOREIGN KEY') ||
            upperLine.startsWith('CONSTRAINT') ||
            upperLine.startsWith('UNIQUE') ||
            upperLine.startsWith('INDEX') ||
            upperLine.startsWith('KEY')
          ) {
            continue;
          }

          const colMatch = line.match(/^([`"'a-zA-Z0-9_]+)\s+([a-zA-Z0-9_()]+(?:\s*\(\s*\d+(?:\s*,\s*\d+)?\s*\))?)(.*)/);
          if (colMatch) {
            const rawColName = colMatch[1];
            const rawColType = colMatch[2];
            const rest = colMatch[3] ? colMatch[3].toUpperCase() : '';

            const fieldName = applyCasing(rawColName, casing);
            const avroBaseType = mapSqlTypeToAvro(rawColType, useLogicalTypes);
            const isNullable = !rest.includes('NOT NULL');

            let finalType: any;
            if (isNullable) {
              finalType = nullFirst ? ['null', avroBaseType] : [avroBaseType, 'null'];
            } else {
              finalType = avroBaseType;
            }

            const fieldObj: any = Object.create(null);
            fieldObj.name = fieldName;
            fieldObj.type = finalType;

            if (isNullable && nullFirst) {
              fieldObj.default = null;
            }

            fields.push(fieldObj);
          }
        }

        if (fields.length > 0) {
          const schemaObj: any = Object.create(null);
          schemaObj.type = 'record';
          schemaObj.name = tableName;
          schemaObj.namespace = namespace.trim() || 'com.example.avro';
          schemaObj.fields = fields;

          avroSchemas.push(schemaObj);
        }
      }

      if (avroSchemas.length === 0) {
        setError(t('sqltoavro.no_tables_found') || 'No valid CREATE TABLE DDL statements found.');
        setOutput('');
        return;
      }

      const result = avroSchemas.length === 1
        ? JSON.stringify(avroSchemas[0], null, 2)
        : JSON.stringify(avroSchemas, null, 2);

      setOutput(result);
      setError('');
    } catch (e: any) {
      setError((t('sqltoavro.error_parsing') || 'Error parsing SQL DDL') + ': ' + (e.message || String(e)));
      setOutput('');
    }
  }, [sql, namespace, casing, useLogicalTypes, nullFirst, t]);

  useEffect(() => {
    handleConvert();
  }, [handleConvert]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success(t('sqltoavro.toast_copied') || 'Avro schema copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  }, [output, t]);

  const handleClear = useCallback(() => {
    setSql('');
    setOutput('');
    setError('');
    setActivePreset(null);
    toast.success(t('sqltoavro.toast_cleared') || 'Inputs cleared!');
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [t]);

  const handleLoadPreset = (preset: Preset) => {
    setSql(preset.sql);
    setActivePreset(preset.id);
    const label = t(preset.labelKey) || preset.defaultLabel;
    toast.success(t('sqltoavro.preset_loaded', { name: label }) || `Loaded preset: ${label}`);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handlersRef = useRef({
    onClear: handleClear,
    onCopy: handleCopy,
  });

  useEffect(() => {
    handlersRef.current = {
      onClear: handleClear,
      onCopy: handleCopy,
    };
  }, [handleClear, handleCopy]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable) {
        if (e.key === "Escape") {
          e.preventDefault();
          handlersRef.current.onClear();
        }
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        handlersRef.current.onClear();
      } else if (e.key.toLowerCase() === "c" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        handlersRef.current.onCopy();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'schema.avsc';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(t('sqltoavro.toast_downloaded') || 'Downloaded schema.avsc!');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8" role="region" aria-label="SQL DDL to Apache Avro Schema Generator">
      {/* Header bar with presets and shortcut badges */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-3xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 mr-1">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            {t('sqltoavro.presets_title') || 'Quick Start Presets:'}
          </span>
          {PRESETS.map((preset) => {
            const label = t(preset.labelKey) || preset.defaultLabel;
            const isActive = activePreset === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => handleLoadPreset(preset)}
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
            disabled={!sql && !output}
            className="text-xs font-bold px-3 py-1.5 rounded-xl text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-all flex items-center gap-1 disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" /> {t('common.clear')}
          </button>
        </div>
      </div>

      {/* Configuration Panel */}
      <div className="p-6 bg-slate-50 dark:bg-slate-900/40 rounded-3xl border border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-4 gap-6">
        <div>
          <label htmlFor="avro-namespace-input" className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-2">
            {t('sqltoavro.namespace') || 'Avro Namespace'}
          </label>
          <input
            id="avro-namespace-input"
            type="text"
            value={namespace}
            onChange={(e) => setNamespace(e.target.value)}
            placeholder="com.example.avro"
            className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-xs outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div>
          <label htmlFor="avro-casing-select" className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-2">
            {t('sqltoavro.field_casing') || 'Field Casing'}
          </label>
          <select
            id="avro-casing-select"
            value={casing}
            onChange={(e) => setCasing(e.target.value as CasingOption)}
            className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-xs outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="original">Original (from SQL)</option>
            <option value="snake_case">snake_case</option>
            <option value="camelCase">camelCase</option>
            <option value="PascalCase">PascalCase</option>
          </select>
        </div>

        <div className="flex flex-col justify-end">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">
            <input
              type="checkbox"
              checked={useLogicalTypes}
              onChange={(e) => setUseLogicalTypes(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
            />
            {t('sqltoavro.use_logical_types') || 'Use Avro Logical Types (timestamp, decimal)'}
          </label>
        </div>

        <div className="flex flex-col justify-end">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">
            <input
              type="checkbox"
              checked={nullFirst}
              onChange={(e) => setNullFirst(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
            />
            {t('sqltoavro.null_first') || 'Union order ["null", type] (default null)'}
          </label>
        </div>
      </div>

      {/* Editor & Output Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-500" />
              <label htmlFor="sql-avro-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('sqltoavro.sql_input_label') || 'SQL CREATE TABLE DDL'}
              </label>
            </div>
          </div>
          <textarea
            id="sql-avro-input"
            ref={inputRef}
            value={sql}
            onChange={(e) => {
              setSql(e.target.value);
              if (activePreset) setActivePreset(null);
            }}
            placeholder={t('sqltoavro.placeholder_sql') || 'Paste SQL CREATE TABLE DDL statements here...'}
            className="w-full h-[450px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-emerald-500" />
              <label htmlFor="avro-output" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('sqltoavro.output_label') || 'Generated Avro .avsc Schema'}
              </label>
            </div>
            <div className="flex gap-2">
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
            id="avro-output"
            value={output}
            readOnly
            placeholder={t('sqltoavro.placeholder_output') || 'Generated Apache Avro schema will appear here...'}
            className="w-full h-[450px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-mono text-sm leading-relaxed text-indigo-600 dark:text-indigo-400 resize-none"
          />
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Educational Footer */}
      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <Info className="w-6 h-6 text-indigo-500 mt-1" />
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('sqltoavro.about_title') || 'About SQL DDL to Apache Avro Schema Generator'}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('sqltoavro.about_text') || 'Convert SQL CREATE TABLE DDL queries directly into Apache Avro record schema definitions (.avsc). Maps SQL primitive types to Avro types (int, long, float, double, string, bytes, boolean), supports Avro logical types (timestamp-millis, decimal, date), handles nullability via unions, and customizes namespaces.'}
          </p>
        </div>
      </div>
    </div>
  );
}
