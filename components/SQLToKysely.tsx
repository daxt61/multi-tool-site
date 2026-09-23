import { useState, useEffect, useCallback, useRef } from 'react';
import { Database, Copy, Check, Trash2, AlertCircle, Download, Info, Sparkles, FileCode } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;

export function SQLToKysely({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState(initialData?.input || '');
  const [output, setOutput] = useState(initialData?.output || '');
  const [dialect, setDialect] = useState<'pg' | 'mysql' | 'sqlite'>(initialData?.dialect || 'pg');
  const [casing, setCasing] = useState<'original' | 'camelCase' | 'snake_case' | 'PascalCase'>(initialData?.casing || 'camelCase');
  const [timestampType, setTimestampType] = useState<'Date' | 'string' | 'number'>(initialData?.timestampType || 'Date');
  const [useGenerated, setUseGenerated] = useState(initialData?.useGenerated !== false);
  const [useJsonType, setUseJsonType] = useState(initialData?.useJsonType !== false);
  const [includeImports, setIncludeImports] = useState(initialData?.includeImports !== false);
  const [exportTypes, setExportTypes] = useState(initialData?.exportTypes !== false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  useEffect(() => {
    onStateChange?.({ input, output, dialect, casing, timestampType, useGenerated, useJsonType, includeImports, exportTypes });
  }, [input, output, dialect, casing, timestampType, useGenerated, useJsonType, includeImports, exportTypes, onStateChange]);

  const PRESETS = {
    ecommerce: `-- E-Commerce Catalog Schema
CREATE TABLE categories (
  id INT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  parent_id INT DEFAULT NULL
);

CREATE TABLE products (
  id INT PRIMARY KEY,
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
    blog: `-- Blog Posts & Comments Schema
CREATE TABLE posts (
  post_id INT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  author_email VARCHAR(255) NOT NULL,
  published_at DATETIME,
  view_count INT DEFAULT 0,
  is_draft BOOLEAN DEFAULT FALSE
);

CREATE TABLE comments (
  comment_id INT PRIMARY KEY,
  post_id INT NOT NULL,
  author_name VARCHAR(100) NOT NULL,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL
);`
  };

  const transformCase = (str: string, targetCasing: 'original' | 'camelCase' | 'snake_case' | 'PascalCase'): string => {
    if (targetCasing === 'original') return str;

    const words = str
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .replace(/[^a-zA-Z0-9]/g, '_')
      .split('_')
      .filter(Boolean);

    if (words.length === 0) return str;

    if (targetCasing === 'snake_case') {
      return words.map(w => w.toLowerCase()).join('_');
    }

    if (targetCasing === 'PascalCase') {
      return words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
    }

    // camelCase
    return words[0].toLowerCase() + words.slice(1).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
  };

  const toTypeName = (tableName: string): string => {
    const pascal = transformCase(tableName, 'PascalCase');
    return pascal.endsWith('s') ? pascal.slice(0, -1) + 'Table' : pascal + 'Table';
  };

  const mapSqlTypeToTs = (
    sqlType: string,
    isPrimary: boolean,
    selectedDialect: 'pg' | 'mysql' | 'sqlite',
    tsTime: 'Date' | 'string' | 'number',
    withGenerated: boolean,
    withJson: boolean,
    usedImports: Set<string>
  ): string => {
    const type = (sqlType || 'VARCHAR').toUpperCase();

    if ((type.includes('SERIAL') || (type.includes('INT') && isPrimary)) && withGenerated) {
      usedImports.add('Generated');
      return 'Generated<number>';
    }

    if (type.includes('UUID') && isPrimary && withGenerated) {
      usedImports.add('Generated');
      return 'Generated<string>';
    }

    if (type.includes('INT') || type.includes('SERIAL')) {
      return 'number';
    }

    if (type.includes('FLOAT') || type.includes('DOUBLE') || type.includes('REAL') || type.includes('DECIMAL') || type.includes('NUMERIC')) {
      return 'number';
    }

    if (type.includes('BOOL') || type.includes('BIT')) {
      return 'boolean';
    }

    if (type.includes('TIMESTAMP') || type.includes('DATETIME') || type.includes('DATE')) {
      return tsTime;
    }

    if (type.includes('JSON')) {
      if (withJson) {
        usedImports.add('JSONColumnType');
        return 'JSONColumnType<Record<string, any>>';
      }
      return 'Record<string, any>';
    }

    return 'string';
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

      // Strip SQL comments
      const cleanInput = input
        .replace(/--.*$/gm, '')
        .replace(/\/\*[\s\S]*?\*\//g, '');

      const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:["`]?(\w+)["`]?\.)?["`]?(\w+)["`]?\s*\(([\s\S]*?)\);/gi;
      let match;
      const tables: { tableName: string; typeName: string; columns: { rawName: string; propName: string; tsType: string; isNullable: boolean }[] }[] = [];
      const usedImports = new Set<string>();

      while ((match = tableRegex.exec(cleanInput)) !== null) {
        const tableName = match[2];
        const columnsContent = match[3];

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

        const columns = filteredLines.map(line => {
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

          if (!rawName) return null;

          const upperLine = line.toUpperCase();
          const isPrimary = upperLine.includes('PRIMARY KEY');
          const isNotNull = upperLine.includes('NOT NULL') || isPrimary;
          const isNullable = !isNotNull;

          const propName = transformCase(rawName, casing);
          let tsType = mapSqlTypeToTs(sqlType, isPrimary, dialect, timestampType, useGenerated, useJsonType, usedImports);

          if (isNullable && !tsType.startsWith('JSONColumnType') && !tsType.startsWith('Generated')) {
            tsType += ' | null';
          }

          return {
            rawName,
            propName,
            tsType,
            isNullable
          };
        }).filter(Boolean) as { rawName: string; propName: string; tsType: string; isNullable: boolean }[];

        if (columns.length > 0) {
          tables.push({ tableName, typeName: toTypeName(tableName), columns });
        }
      }

      if (tables.length === 0) {
        setError(t('sqltokysely.no_tables_found', 'No valid CREATE TABLE statements found.'));
        setOutput('');
        return;
      }

      const exportKeyword = exportTypes ? 'export ' : '';
      let generated = '';

      if (includeImports && usedImports.size > 0) {
        const sortedImports = Array.from(usedImports).sort().join(', ');
        generated += `import { ${sortedImports} } from 'kysely';\n\n`;
      }

      tables.forEach(table => {
        generated += `${exportKeyword}interface ${table.typeName} {\n`;
        table.columns.forEach(col => {
          const isValidIdent = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(col.propName);
          const keyStr = isValidIdent ? col.propName : JSON.stringify(col.propName);
          generated += `  ${keyStr}: ${col.tsType};\n`;
        });
        generated += `}\n\n`;
      });

      // Database interface
      generated += `${exportKeyword}interface Database {\n`;
      tables.forEach(table => {
        const isValidIdent = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(table.tableName);
        const keyStr = isValidIdent ? table.tableName : JSON.stringify(table.tableName);
        generated += `  ${keyStr}: ${table.typeName};\n`;
      });
      generated += `}\n`;

      setOutput(generated.trim());
      setError('');
    } catch (e: any) {
      setError(t('sqltokysely.error_parsing', 'Error parsing SQL DDL') + ': ' + e.message);
      setOutput('');
    }
  }, [input, dialect, casing, timestampType, useGenerated, useJsonType, includeImports, exportTypes, t]);

  useEffect(() => {
    handleConvert();
  }, [handleConvert]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success(t('sqltokysely.toast_copied', 'Kysely schema copied to clipboard!'));
    setTimeout(() => setCopied(false), 2000);
  }, [output, t]);

  const handleClear = useCallback(() => {
    setInput('');
    setOutput('');
    setError('');
    setActivePreset(null);
    toast.success(t('sqltokysely.toast_cleared', 'Inputs cleared!'));
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [t]);

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/typescript' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'database.kysely.ts';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(t('common.downloaded', 'Downloaded database.kysely.ts!'));
  };

  const loadPreset = (presetKey: keyof typeof PRESETS) => {
    setInput(PRESETS[presetKey]);
    setActivePreset(presetKey);
    toast.success(t('sqltokysely.preset_loaded', 'Loaded SQL preset!'));
  };

  const handlersRef = useRef({ handleClear, handleCopy, output });
  useEffect(() => {
    handlersRef.current = { handleClear, handleCopy, output };
  }, [handleClear, handleCopy, output]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      if (
        containerRef.current &&
        !containerRef.current.contains(activeElement) &&
        activeElement !== document.body
      ) {
        return;
      }

      const isEditable =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement instanceof HTMLSelectElement ||
        activeElement?.getAttribute("contenteditable") === "true";

      if (isEditable && e.key !== 'Escape') return;

      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key === "Escape") {
        e.preventDefault();
        handlersRef.current.handleClear();
      } else if (e.key.toLowerCase() === "c") {
        if (handlersRef.current.output) {
          e.preventDefault();
          handlersRef.current.handleCopy();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div ref={containerRef} className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Presets Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" aria-hidden="true" />
          <span className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('sqltokysely.presets_title', 'Quick Start Presets:')}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => loadPreset('ecommerce')}
            aria-pressed={activePreset === 'ecommerce'}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all shadow-sm border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
              activePreset === 'ecommerce'
                ? 'bg-indigo-600 text-white border-indigo-600 dark:bg-indigo-500 dark:border-indigo-500'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-500'
            }`}
          >
            {t('sqltokysely.preset_ecommerce', 'E-Commerce Catalog')}
          </button>
          <button
            onClick={() => loadPreset('user_auth')}
            aria-pressed={activePreset === 'user_auth'}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all shadow-sm border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
              activePreset === 'user_auth'
                ? 'bg-indigo-600 text-white border-indigo-600 dark:bg-indigo-500 dark:border-indigo-500'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-500'
            }`}
          >
            {t('sqltokysely.preset_user_auth', 'User Auth & Roles')}
          </button>
          <button
            onClick={() => loadPreset('blog')}
            aria-pressed={activePreset === 'blog'}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all shadow-sm border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
              activePreset === 'blog'
                ? 'bg-indigo-600 text-white border-indigo-600 dark:bg-indigo-500 dark:border-indigo-500'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-500'
            }`}
          >
            {t('sqltokysely.preset_blog', 'Blog Posts & Comments')}
          </button>
        </div>
      </div>

      {/* Options Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-5 bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="space-y-1.5">
          <label htmlFor="kysely-dialect" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('sqltokysely.dialect', 'SQL Dialect')}
          </label>
          <select
            id="kysely-dialect"
            value={dialect}
            onChange={(e) => setDialect(e.target.value as any)}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="pg">PostgreSQL</option>
            <option value="mysql">MySQL</option>
            <option value="sqlite">SQLite</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="kysely-casing" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('sqltokysely.field_casing', 'Property Casing')}
          </label>
          <select
            id="kysely-casing"
            value={casing}
            onChange={(e) => setCasing(e.target.value as any)}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="camelCase">camelCase (default)</option>
            <option value="snake_case">snake_case</option>
            <option value="PascalCase">PascalCase</option>
            <option value="original">Original (from SQL)</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="kysely-time-type" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('sqltokysely.timestamp_type', 'Date / Timestamp Type')}
          </label>
          <select
            id="kysely-time-type"
            value={timestampType}
            onChange={(e) => setTimestampType(e.target.value as any)}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="Date">Date (JS Date object)</option>
            <option value="string">string (ISO 8601)</option>
            <option value="number">number (Unix ms)</option>
          </select>
        </div>

        <div className="flex flex-col justify-center space-y-2 pt-2">
          <label htmlFor="kysely-use-generated" className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              id="kysely-use-generated"
              type="checkbox"
              checked={useGenerated}
              onChange={(e) => setUseGenerated(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
            {t('sqltokysely.use_generated', 'Use Generated<T> for PKs')}
          </label>
          <label htmlFor="kysely-use-json" className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              id="kysely-use-json"
              type="checkbox"
              checked={useJsonType}
              onChange={(e) => setUseJsonType(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
            {t('sqltokysely.use_json_type', 'Use JSONColumnType<T>')}
          </label>
        </div>
      </div>

      {/* Editor Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-500" aria-hidden="true" />
              <label htmlFor="sql-kysely-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('sqltokysely.sql_input_label', 'SQL CREATE TABLE DDL')}
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
            id="sql-kysely-input"
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              if (activePreset) setActivePreset(null);
            }}
            placeholder={t('sqltokysely.placeholder_sql', 'Paste SQL CREATE TABLE DDL statements here...')}
            className="w-full h-[450px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-emerald-500" aria-hidden="true" />
              <label htmlFor="kysely-output" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('sqltokysely.output_label', 'Generated Kysely Schema')}
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
            id="kysely-output"
            value={output}
            readOnly
            placeholder={t('sqltokysely.placeholder_output', 'Kysely TypeScript interfaces will appear here...')}
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
          <h4 className="font-bold dark:text-white">{t('sqltokysely.about_title', 'About SQL to Kysely TypeScript Schema Generator')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('sqltokysely.about_text', 'Convert SQL CREATE TABLE DDL queries into strongly-typed Kysely TypeScript database interfaces. Supports Generated<T> for auto-incrementing / serial primary keys, JSONColumnType<T> for JSON fields, property casing options, and custom timestamp types.')}
          </p>
        </div>
      </div>
    </div>
  );
}
