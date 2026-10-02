import { useState, useEffect, useCallback, useRef } from 'react';
import { FileCode, Copy, Check, Trash2, AlertCircle, Download, Info, Database, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;

const THRIFT_RESERVED_KEYWORDS = new Set([
  'struct', 'service', 'enum', 'exception', 'typedef', 'const', 'required', 'optional',
  'void', 'bool', 'byte', 'i8', 'i16', 'i32', 'i64', 'double', 'string', 'binary',
  'map', 'list', 'set', 'namespace', 'include', 'cpp_include', 'async', 'oneway',
  'extends', 'throws'
]);

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

export function SQLToThrift({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState(initialData?.input || '');
  const [output, setOutput] = useState(initialData?.output || '');
  const [namespaceLang, setNamespaceLang] = useState<string>(initialData?.namespaceLang || 'py');
  const [namespaceValue, setNamespaceValue] = useState<string>(initialData?.namespaceValue || 'app.models');
  const [casingMode, setCasingMode] = useState<'original' | 'snake_case' | 'camelCase' | 'PascalCase'>(initialData?.casingMode || 'camelCase');
  const [qualifierMode, setQualifierMode] = useState<'smart' | 'required_all' | 'optional_all'>(initialData?.qualifierMode || 'smart');
  const [timestampType, setTimestampType] = useState<'string' | 'i64'>(initialData?.timestampType || 'i64');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ input, output, namespaceLang, namespaceValue, casingMode, qualifierMode, timestampType });
  }, [input, output, namespaceLang, namespaceValue, casingMode, qualifierMode, timestampType, onStateChange]);

  const transformCase = (str: string, targetCasing: 'original' | 'snake_case' | 'camelCase' | 'PascalCase'): string => {
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

  const sanitizeFieldName = (name: string): string => {
    let clean = name.replace(/[^a-zA-Z0-9_]/g, '_');
    if (/^[0-9]/.test(clean)) {
      clean = 'field_' + clean;
    }
    if (THRIFT_RESERVED_KEYWORDS.has(clean.toLowerCase())) {
      clean = clean + '_field';
    }
    return clean || 'field';
  };

  const sanitizeStructName = (name: string): string => {
    let pascal = transformCase(name, 'PascalCase');
    if (/^[0-9]/.test(pascal)) {
      pascal = 'Struct' + pascal;
    }
    if (THRIFT_RESERVED_KEYWORDS.has(pascal.toLowerCase())) {
      pascal = pascal + 'Struct';
    }
    return pascal || 'AutoStruct';
  };

  const mapSqlTypeToThrift = (sqlType: string): string => {
    const type = (sqlType || 'VARCHAR').toUpperCase();

    if (type.includes('BIGINT') || type.includes('INT8')) {
      return 'i64';
    }

    if (type.includes('INT') || type.includes('SERIAL') || type.includes('TINYINT') || type.includes('SMALLINT')) {
      return 'i32';
    }

    if (type.includes('FLOAT') || type.includes('REAL') || type.includes('DOUBLE') || type.includes('DECIMAL') || type.includes('NUMERIC')) {
      return 'double';
    }

    if (type.includes('BOOL') || type.includes('BIT')) {
      return 'bool';
    }

    if (type.includes('BLOB') || type.includes('BYTEA') || type.includes('BINARY') || type.includes('VARBINARY')) {
      return 'binary';
    }

    if (type.includes('DATE') || type.includes('TIME') || type.includes('TIMESTAMP')) {
      return timestampType === 'i64' ? 'i64' : 'string';
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
        setError(t('sqltothrift.error_max_length', { max: MAX_LENGTH.toLocaleString() }));
        setOutput('');
        return;
      }

      // Strip SQL comments
      const cleanInput = input
        .replace(/--.*$/gm, '')
        .replace(/\/\*[\s\S]*?\*\//g, '');

      const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:["`]?(\w+)["`]?\.)?["`]?(\w+)["`]?\s*\(([\s\S]*?)\);/gi;
      let match;
      const structs: string[] = [];
      const structNames = Object.create(null);

      while ((match = tableRegex.exec(cleanInput)) !== null) {
        const rawTableName = match[2];
        const columnsContent = match[3];

        let structName = sanitizeStructName(rawTableName);
        let counter = 1;
        const baseStructName = structName;
        while (structNames[structName]) {
          structName = `${baseStructName}${counter++}`;
        }
        structNames[structName] = true;

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

        const fields = filteredLines.map((line, index) => {
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

          const transformed = transformCase(rawName, casingMode);
          const safeName = sanitizeFieldName(transformed);
          const thriftType = mapSqlTypeToThrift(sqlType || 'VARCHAR');

          const upperLine = line.toUpperCase();
          const isNotNull = upperLine.includes('NOT NULL') || upperLine.includes('PRIMARY KEY');

          let qualifier = 'optional';
          if (qualifierMode === 'required_all') {
            qualifier = 'required';
          } else if (qualifierMode === 'optional_all') {
            qualifier = 'optional';
          } else {
            // 'smart'
            qualifier = isNotNull ? 'required' : 'optional';
          }

          const comment = rawName !== safeName ? ` // original: ${rawName}` : '';
          return `  ${index + 1}: ${qualifier} ${thriftType} ${safeName};${comment}`;
        }).filter(Boolean);

        if (fields.length > 0) {
          let structStr = `struct ${structName} {\n`;
          structStr += fields.join('\n');
          structStr += '\n}';
          structs.push(structStr);
        }
      }

      if (structs.length === 0) {
        setError(t('sqltothrift.no_tables_found', 'No valid CREATE TABLE statements found.'));
        setOutput('');
        return;
      }

      let result = '';
      if (namespaceValue.trim()) {
        const lang = namespaceLang || '*';
        result += `namespace ${lang} ${namespaceValue.trim()}\n\n`;
      }

      result += structs.join('\n\n');

      setOutput(result);
      setError('');
    } catch (e: any) {
      setError(t('sqltothrift.error_parsing', 'Error parsing SQL DDL') + ': ' + e.message);
      setOutput('');
    }
  }, [input, namespaceLang, namespaceValue, casingMode, qualifierMode, timestampType, t]);

  useEffect(() => {
    handleConvert();
  }, [handleConvert]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success(t('sqltothrift.toast_copied', 'Apache Thrift IDL copied to clipboard!'));
    setTimeout(() => setCopied(false), 2000);
  }, [output, t]);

  const handleClear = useCallback(() => {
    setInput('');
    setOutput('');
    setError('');
    toast.success(t('sqltothrift.toast_cleared', 'Inputs cleared!'));
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [t]);

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `schema.thrift`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(t('sqltothrift.toast_downloaded', 'Downloaded schema.thrift!'));
  };

  const loadPreset = (presetKey: keyof typeof PRESETS) => {
    setInput(PRESETS[presetKey]);
    toast.success(t('sqltothrift.preset_loaded', 'Loaded SQL preset!'));
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
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Presets Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" aria-hidden="true" />
          <span className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('sqltothrift.presets_title', 'Quick Start Presets:')}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => loadPreset('ecommerce')}
            className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 rounded-xl transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
          >
            {t('sqltothrift.preset_ecommerce', 'E-Commerce Catalog')}
          </button>
          <button
            type="button"
            onClick={() => loadPreset('user_auth')}
            className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 rounded-xl transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
          >
            {t('sqltothrift.preset_user_auth', 'User Auth & Roles')}
          </button>
          <button
            type="button"
            onClick={() => loadPreset('blog')}
            className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 rounded-xl transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
          >
            {t('sqltothrift.preset_blog', 'Blog Posts & Comments')}
          </button>
        </div>
      </div>

      {/* Options Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 p-5 bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="space-y-1.5">
          <label htmlFor="namespace-lang-select" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('sqltothrift.namespace_lang', 'Namespace Scope')}
          </label>
          <select
            id="namespace-lang-select"
            value={namespaceLang}
            onChange={(e) => setNamespaceLang(e.target.value)}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="*">Global (*)</option>
            <option value="py">Python (py)</option>
            <option value="java">Java (java)</option>
            <option value="cpp">C++ (cpp)</option>
            <option value="go">Go (go)</option>
            <option value="js">JavaScript (js)</option>
            <option value="php">PHP (php)</option>
            <option value="rb">Ruby (rb)</option>
            <option value="rs">Rust (rs)</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="namespace-value-input" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('sqltothrift.namespace_value', 'Package / Namespace')}
          </label>
          <input
            id="namespace-value-input"
            type="text"
            value={namespaceValue}
            onChange={(e) => setNamespaceValue(e.target.value)}
            placeholder="app.models"
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="casing-mode-select" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('sqltothrift.casing_mode', 'Field Casing')}
          </label>
          <select
            id="casing-mode-select"
            value={casingMode}
            onChange={(e) => setCasingMode(e.target.value as any)}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="camelCase">camelCase (Thrift standard)</option>
            <option value="snake_case">snake_case</option>
            <option value="PascalCase">PascalCase</option>
            <option value="original">Original (from SQL)</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="qualifier-mode-select" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('sqltothrift.qualifier_mode', 'Field Qualifiers')}
          </label>
          <select
            id="qualifier-mode-select"
            value={qualifierMode}
            onChange={(e) => setQualifierMode(e.target.value as any)}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="smart">Smart (NOT NULL = required, NULL = optional)</option>
            <option value="required_all">Force required on all</option>
            <option value="optional_all">Force optional on all</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="timestamp-type-select" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('sqltothrift.timestamp_type', 'Date/Timestamp Type')}
          </label>
          <select
            id="timestamp-type-select"
            value={timestampType}
            onChange={(e) => setTimestampType(e.target.value as 'string' | 'i64')}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="i64">i64 (Unix Timestamp epoch ms)</option>
            <option value="string">string (ISO-8601)</option>
          </select>
        </div>
      </div>

      {/* Editor Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-500" aria-hidden="true" />
              <label htmlFor="sql-thrift-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('sqltothrift.sql_input_label', 'SQL CREATE TABLE DDL')}
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
            id="sql-thrift-input"
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('sqltothrift.placeholder_sql', 'Paste SQL CREATE TABLE DDL statements here...')}
            className="w-full h-[450px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-emerald-500" aria-hidden="true" />
              <label htmlFor="thrift-output" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('sqltothrift.output_label', 'Apache Thrift IDL')}
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
            id="thrift-output"
            value={output}
            readOnly
            placeholder={t('sqltothrift.placeholder_output', 'Generated Apache Thrift IDL will appear here...')}
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
          <h4 className="font-bold dark:text-white">{t('sqltothrift.about_title', 'About SQL DDL to Apache Thrift Generator')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('sqltothrift.about_text', 'Convert SQL CREATE TABLE DDL queries directly into Apache Thrift IDL struct definitions. Supports custom namespaces, field qualifiers (required / optional), field casing options (camelCase, snake_case, PascalCase), timestamp conversion, and Thrift keyword sanitization.')}
          </p>
        </div>
      </div>
    </div>
  );
}
