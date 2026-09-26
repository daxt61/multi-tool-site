import { useState, useEffect, useCallback, useRef } from 'react';
import { FileCode, Copy, Check, Trash2, AlertCircle, Download, Info, Database, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;

const ELIXIR_KEYWORDS = new Set([
  'def', 'defmodule', 'defstruct', 'defmacro', 'defp', 'do', 'end', 'case', 'cond',
  'if', 'unless', 'try', 'catch', 'rescue', 'after', 'else', 'for', 'receive', 'fn',
  'quote', 'unquote', 'import', 'require', 'use', 'alias', 'nil', 'true', 'false',
  'and', 'or', 'not', 'when', 'in', 'schema', 'field', 'primary_key', 'timestamps'
]);

export function SQLToElixir({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [input, setInput] = useState(initialData?.input || '');
  const [output, setOutput] = useState(initialData?.output || '');
  const [modulePrefix, setModulePrefix] = useState(initialData?.modulePrefix || 'MyApp');
  const [casing, setCasing] = useState<'snake_case' | 'camelCase' | 'PascalCase' | 'original'>(initialData?.casing || 'snake_case');
  const [useBinaryId, setUseBinaryId] = useState(initialData?.useBinaryId ?? false);
  const [useTimestamps, setUseTimestamps] = useState(initialData?.useTimestamps ?? true);
  const [timestampsType, setTimestampsType] = useState<':utc_datetime' | ':naive_datetime'>(initialData?.timestampsType || ':utc_datetime');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  useEffect(() => {
    onStateChange?.({
      input,
      output,
      modulePrefix,
      casing,
      useBinaryId,
      useTimestamps,
      timestampsType,
    });
  }, [input, output, modulePrefix, casing, useBinaryId, useTimestamps, timestampsType, onStateChange]);

  const PRESETS = {
    ecommerce: `-- E-Commerce Catalog Schema
CREATE TABLE categories (
  category_id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  parent_id INT DEFAULT NULL
);

CREATE TABLE products (
  product_id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  sku VARCHAR(50) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  category_id INT NOT NULL,
  created_at TIMESTAMP NOT NULL,
  metadata JSON
);`,
    user_auth: `-- User Authentication & Roles Schema
CREATE TABLE users (
  user_id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100),
  is_verified BOOLEAN DEFAULT FALSE,
  login_count INT DEFAULT 0,
  last_login TIMESTAMP,
  created_at TIMESTAMP NOT NULL
);

CREATE TABLE roles (
  role_id INT PRIMARY KEY,
  role_name VARCHAR(50) NOT NULL,
  permissions JSON
);`,
    financial: `-- Financial Audit Log Schema
CREATE TABLE audit_logs (
  log_id BIGINT PRIMARY KEY AUTO_INCREMENT,
  account_number VARCHAR(34) NOT NULL,
  amount DECIMAL(15, 4) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  transaction_type VARCHAR(20) NOT NULL,
  is_flagged BOOLEAN DEFAULT FALSE,
  executed_at DATETIME NOT NULL,
  details JSON
);`
  };

  const toSnakeCase = (str: string) => {
    return str
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .replace(/[^a-zA-Z0-9]/g, '_')
      .replace(/_+/g, '_')
      .toLowerCase();
  };

  const toCamelCase = (str: string) => {
    const pascal = toPascalCase(str);
    return pascal.charAt(0).toLowerCase() + pascal.slice(1);
  };

  const toPascalCase = (str: string) => {
    return str
      .replace(/[^a-zA-Z0-9]/g, ' ')
      .split(' ')
      .filter(Boolean)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join('');
  };

  const formatFieldName = (name: string): string => {
    let formatted = name;
    if (casing === 'snake_case') formatted = toSnakeCase(name);
    else if (casing === 'camelCase') formatted = toCamelCase(name);
    else if (casing === 'PascalCase') formatted = toPascalCase(name);

    if (ELIXIR_KEYWORDS.has(formatted.toLowerCase())) {
      formatted = `${formatted}_field`;
    }
    return formatted;
  };

  const mapSqlTypeToEcto = (sqlType: string): string => {
    if (!sqlType) return ':string';
    const type = sqlType.toUpperCase();

    if (type.includes('BIGINT')) return ':integer';
    if (type.includes('TINYINT(1)') || type.includes('BOOLEAN') || type.includes('BOOL') || type.includes('BIT')) return ':boolean';
    if (type.includes('SMALLINT') || type.includes('INT') || type.includes('SERIAL')) return ':integer';
    if (type.includes('DECIMAL') || type.includes('NUMERIC')) return ':decimal';
    if (type.includes('FLOAT') || type.includes('DOUBLE') || type.includes('REAL')) return ':float';
    if (type.includes('DATE') && !type.includes('TIME')) return ':date';
    if (type.includes('TIME') && !type.includes('STAMP') && !type.includes('DATE')) return ':time';
    if (type.includes('DATETIME') || type.includes('TIMESTAMP')) return timestampsType;
    if (type.includes('UUID')) return ':binary_id';
    if (type.includes('JSON')) return ':map';
    if (type.includes('BLOB') || type.includes('BYTEA') || type.includes('VARBINARY')) return ':binary';

    return ':string';
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

      const cleanInput = input
        .replace(/--.*$/gm, '')
        .replace(/\/\*[\s\S]*?\*\//g, '');

      const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:["`]?(\w+)["`]?\.)?["`]?(\w+)["`]?\s*\(([\s\S]*?)\);/gi;
      let match;
      const modules: string[] = [];

      while ((match = tableRegex.exec(cleanInput)) !== null) {
        const rawTableName = match[2];
        const columnsContent = match[3];

        const moduleName = toPascalCase(rawTableName.replace(/s$/, ''));
        const fullModuleName = modulePrefix.trim() ? `${modulePrefix.trim()}.${moduleName}` : moduleName;

        const columnLines: string[] = [];
        let currentLine = '';
        let inQuotes = false;
        let quoteChar = '';
        let parenDepth = 0;

        for (let i = 0; i < columnsContent.length; i++) {
          const char = columnsContent[i];
          if ((char === '"' || char === '`' || char === "'") && columnsContent[i - 1] !== '\\') {
            if (!inQuotes) {
              inQuotes = true;
              quoteChar = char;
            } else if (char === quoteChar) {
              inQuotes = false;
            }
          }

          if (!inQuotes) {
            if (char === '(') parenDepth++;
            if (char === ')') parenDepth--;
          }

          if (char === ',' && !inQuotes && parenDepth === 0) {
            columnLines.push(currentLine.trim());
            currentLine = '';
          } else {
            currentLine += char;
          }
        }
        if (currentLine.trim()) columnLines.push(currentLine.trim());

        const filteredLines = columnLines.map(line => line.trim()).filter(line => {
          if (!line) return false;
          const upper = line.toUpperCase();
          return !upper.startsWith('PRIMARY KEY') &&
                 !upper.startsWith('CONSTRAINT') &&
                 !upper.startsWith('UNIQUE') &&
                 !upper.startsWith('FOREIGN KEY') &&
                 !upper.startsWith('INDEX') &&
                 !upper.startsWith('KEY');
        });

        const fields: string[] = [];
        let hasCustomPrimaryKey = false;

        filteredLines.forEach(line => {
          let rawName = '';
          let sqlType = '';

          if (line.startsWith('"') || line.startsWith('`') || line.startsWith("'")) {
            const quote = line[0];
            let i = 1;
            rawName = '';
            while (i < line.length && (line[i] !== quote || line[i - 1] === '\\')) {
              rawName += line[i];
              i++;
            }
            const remaining = line.substring(i + 1).trim();
            sqlType = remaining.split(/\s+/)[0];
          } else {
            const parts = line.split(/\s+/);
            rawName = parts[0];
            sqlType = parts[1];
          }

          if (!rawName) return;

          const upperLine = line.toUpperCase();
          const isPrimaryKey = upperLine.includes('PRIMARY KEY');

          // Skip timestamps if generated by timestamps()
          const snakeName = toSnakeCase(rawName);
          if (useTimestamps && (snakeName === 'inserted_at' || snakeName === 'updated_at' || snakeName === 'created_at')) {
            return;
          }

          if (isPrimaryKey && rawName.toLowerCase() === 'id' && !useBinaryId) {
            // Default Ecto schema includes :id auto-generated primary key
            return;
          }

          if (isPrimaryKey && (rawName.toLowerCase() !== 'id' || useBinaryId)) {
            hasCustomPrimaryKey = true;
          }

          const fieldName = formatFieldName(rawName);
          const ectoType = mapSqlTypeToEcto(sqlType || 'TEXT');

          if (isPrimaryKey) {
            fields.push(`    field :${fieldName}, ${ectoType}, primary_key: true`);
          } else {
            fields.push(`    field :${fieldName}, ${ectoType}`);
          }
        });

        let moduleCode = `defmodule ${fullModuleName} do\n  use Ecto.Schema\n  import Ecto.Changeset\n\n`;

        if (useBinaryId) {
          moduleCode += `  @primary_key {:id, :binary_id, autogenerate: true}\n`;
          moduleCode += `  @foreign_key_type :binary_id\n`;
        }

        if (timestampsType !== ':utc_datetime') {
          moduleCode += `  @timestamps_type ${timestampsType}\n`;
        }

        moduleCode += `  schema "${rawTableName}" do\n`;
        if (fields.length > 0) {
          moduleCode += `${fields.join('\n')}\n`;
        }
        if (useTimestamps) {
          moduleCode += `    timestamps()\n`;
        }
        moduleCode += `  end\n\n`;

        // Generate changesets helper
        const castFields = fields.map(f => {
          const match = f.match(/field\s+:([a-zA-Z0-9_]+)/);
          return match ? `:${match[1]}` : null;
        }).filter(Boolean);

        moduleCode += `  @doc false\n  def changeset(${toSnakeCase(moduleName)}, attrs) do\n`;
        moduleCode += `    ${toSnakeCase(moduleName)}\n`;
        moduleCode += `    |> cast(attrs, [${castFields.join(', ')}])\n`;
        moduleCode += `    |> validate_required([])\n`;
        moduleCode += `  end\n`;
        moduleCode += `end`;

        modules.push(moduleCode);
      }

      if (modules.length === 0) {
        setError(t('sqltoelixir.no_tables_found', 'No valid CREATE TABLE statements found.'));
        setOutput('');
        return;
      }

      setOutput(modules.join('\n\n'));
      setError('');
    } catch (e: any) {
      setError(t('sqltoelixir.error_parsing', 'Error parsing SQL DDL') + ': ' + e.message);
      setOutput('');
    }
  }, [input, modulePrefix, casing, useBinaryId, useTimestamps, timestampsType, t]);

  useEffect(() => {
    handleConvert();
  }, [handleConvert]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success(t('sqltoelixir.toast_copied', 'Elixir Ecto schema copied to clipboard!'));
    setTimeout(() => setCopied(false), 2000);
  }, [output, t]);

  const handleClear = useCallback(() => {
    setInput('');
    setOutput('');
    setError('');
    setActivePreset(null);
    toast.success(t('common.cleared', 'Cleared!'));
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [t]);

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'schemas.ex';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(t('common.downloaded', 'Downloaded schemas.ex!'));
  };

  const loadPreset = (presetKey: keyof typeof PRESETS) => {
    setInput(PRESETS[presetKey]);
    setActivePreset(presetKey);
    toast.success(t('sqltoelixir.preset_loaded', 'Loaded SQL preset!'));
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

      if (isEditable && e.key !== 'Escape') return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        handlersRef.current.handleClear();
      } else if (e.key.toLowerCase() === 'c') {
        if (handlersRef.current.output) {
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
          <Sparkles className="w-4 h-4 text-amber-500" aria-hidden="true" />
          <span className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('sqltoelixir.presets_title', 'Quick Presets')}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => loadPreset('ecommerce')}
            aria-pressed={activePreset === 'ecommerce'}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none border ${
              activePreset === 'ecommerce'
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-500'
            }`}
          >
            {t('sqltoelixir.preset_ecommerce', 'E-Commerce Catalog')}
          </button>
          <button
            onClick={() => loadPreset('user_auth')}
            aria-pressed={activePreset === 'user_auth'}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none border ${
              activePreset === 'user_auth'
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-500'
            }`}
          >
            {t('sqltoelixir.preset_user_auth', 'User Auth & Roles')}
          </button>
          <button
            onClick={() => loadPreset('financial')}
            aria-pressed={activePreset === 'financial'}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none border ${
              activePreset === 'financial'
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-500'
            }`}
          >
            {t('sqltoelixir.preset_financial', 'Financial Audit Log')}
          </button>
        </div>
      </div>

      {/* Options Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="space-y-1.5">
          <label htmlFor="elixir-module-prefix" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('sqltoelixir.module_prefix', 'App Module Prefix')}
          </label>
          <input
            id="elixir-module-prefix"
            type="text"
            value={modulePrefix}
            onChange={(e) => setModulePrefix(e.target.value)}
            placeholder="e.g. MyApp.Catalog"
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="elixir-casing" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('sqltoelixir.field_casing', 'Field Casing')}
          </label>
          <select
            id="elixir-casing"
            value={casing}
            onChange={(e) => setCasing(e.target.value as any)}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="snake_case">snake_case (Standard Elixir)</option>
            <option value="camelCase">camelCase</option>
            <option value="PascalCase">PascalCase</option>
            <option value="original">Original Column Name</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="elixir-timestamps-type" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('sqltoelixir.timestamps_type', 'Timestamps Type')}
          </label>
          <select
            id="elixir-timestamps-type"
            value={timestampsType}
            onChange={(e) => setTimestampsType(e.target.value as any)}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value=":utc_datetime">:utc_datetime</option>
            <option value=":naive_datetime">:naive_datetime</option>
          </select>
        </div>

        <div className="col-span-1 md:col-span-3 flex flex-wrap items-center gap-6 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <input
              id="use-binary-id"
              type="checkbox"
              checked={useBinaryId}
              onChange={(e) => setUseBinaryId(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
            <label htmlFor="use-binary-id" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
              {t('sqltoelixir.use_binary_id', 'UUID Binary IDs (@primary_key {:id, :binary_id, ...})')}
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="use-timestamps"
              type="checkbox"
              checked={useTimestamps}
              onChange={(e) => setUseTimestamps(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
            <label htmlFor="use-timestamps" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
              {t('sqltoelixir.use_timestamps', 'Include timestamps() Macro')}
            </label>
          </div>
        </div>
      </div>

      {/* Editor Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-500" aria-hidden="true" />
              <label htmlFor="sql-elixir-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('sqltoelixir.sql_input_label', 'SQL CREATE TABLE DDL')}
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Kbd modifier={null} className="hidden sm:inline-flex border-rose-200 dark:border-rose-800 text-rose-400 dark:bg-slate-900">Esc</Kbd>
              <button
                onClick={handleClear}
                disabled={!input && !output}
                className="text-xs font-bold px-3 py-1.5 rounded-xl text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all flex items-center gap-1 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
              >
                <Trash2 className="w-3 h-3" aria-hidden="true" /> {t('common.clear')}
              </button>
            </div>
          </div>
          <textarea
            id="sql-elixir-input"
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setActivePreset(null);
            }}
            placeholder={t('sqltoelixir.placeholder_sql', 'Paste SQL CREATE TABLE DDL statements here...')}
            className="w-full h-[450px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-purple-500" aria-hidden="true" />
              <label htmlFor="elixir-output" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('sqltoelixir.output_label', 'Generated Elixir Ecto Schemas')}
              </label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                disabled={!output}
                className="text-xs font-bold px-3 py-1.5 rounded-xl text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 transition-all flex items-center gap-1 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
              >
                <Download className="w-3 h-3" aria-hidden="true" /> {t('common.download')}
              </button>
              <button
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
            id="elixir-output"
            value={output}
            readOnly
            placeholder={t('sqltoelixir.placeholder_output', 'Generated Elixir Ecto code will appear here...')}
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
          <h4 className="font-bold dark:text-white">{t('sqltoelixir.about_title', 'About SQL to Elixir Ecto Schema Generator')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('sqltoelixir.about_text', 'Convert SQL CREATE TABLE DDL queries into strongly-typed Elixir Ecto Schema modules. Includes field type mapping, changeset functions, primary key configuration, and timestamps() macro support.')}
          </p>
        </div>
      </div>
    </div>
  );
}
