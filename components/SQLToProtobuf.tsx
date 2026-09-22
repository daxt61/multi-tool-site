import { useState, useEffect, useCallback, useRef } from 'react';
import { FileCode, Copy, Check, Trash2, AlertCircle, Download, Info, Database, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;

const PROTO_RESERVED_KEYWORDS = new Set([
  'package', 'import', 'message', 'service', 'syntax', 'enum', 'oneof', 'map',
  'reserved', 'extensions', 'extend', 'option', 'repeated', 'optional', 'required',
  'double', 'float', 'int32', 'int64', 'uint32', 'uint64', 'sint32', 'sint64',
  'fixed32', 'fixed64', 'sfixed32', 'sfixed64', 'bool', 'string', 'bytes', 'rpc', 'returns'
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

export function SQLToProtobuf({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState(initialData?.input || '');
  const [output, setOutput] = useState(initialData?.output || '');
  const [packageName, setPackageName] = useState(initialData?.packageName || 'model');
  const [syntaxVersion, setSyntaxVersion] = useState<'proto3' | 'proto2'>(initialData?.syntaxVersion || 'proto3');
  const [casingMode, setCasingMode] = useState<'original' | 'snake_case' | 'camelCase' | 'PascalCase'>(initialData?.casingMode || 'snake_case');
  const [timestampType, setTimestampType] = useState<'timestamp' | 'string'>(initialData?.timestampType || 'timestamp');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ input, output, packageName, syntaxVersion, casingMode, timestampType });
  }, [input, output, packageName, syntaxVersion, casingMode, timestampType, onStateChange]);

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
    if (PROTO_RESERVED_KEYWORDS.has(clean.toLowerCase())) {
      clean = clean + '_';
    }
    return clean || 'field';
  };

  const sanitizeMessageName = (name: string): string => {
    let pascal = transformCase(name, 'PascalCase');
    if (/^[0-9]/.test(pascal)) {
      pascal = 'Message' + pascal;
    }
    if (PROTO_RESERVED_KEYWORDS.has(pascal.toLowerCase())) {
      pascal = pascal + 'Message';
    }
    return pascal || 'AutoMessage';
  };

  const mapSqlTypeToProto = (columnName: string, sqlType: string): string => {
    const type = (sqlType || 'VARCHAR').toUpperCase();
    const colNameLower = columnName.toLowerCase();

    if (type.includes('BIGINT') || type.includes('INT8')) {
      return 'int64';
    }

    if (type.includes('INT') || type.includes('SERIAL') || type.includes('TINYINT') || type.includes('SMALLINT')) {
      return 'int32';
    }

    if (type.includes('FLOAT') || type.includes('REAL')) {
      return 'float';
    }

    if (type.includes('DOUBLE') || type.includes('DECIMAL') || type.includes('NUMERIC')) {
      return 'double';
    }

    if (type.includes('BOOL') || type.includes('BIT')) {
      return 'bool';
    }

    if (type.includes('BLOB') || type.includes('BYTEA') || type.includes('BINARY')) {
      return 'bytes';
    }

    if (type.includes('DATE') || type.includes('TIME') || type.includes('TIMESTAMP')) {
      return timestampType === 'timestamp' ? 'google.protobuf.Timestamp' : 'string';
    }

    if (type.includes('JSON')) {
      return 'string';
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
        setError(t('sqltoprotobuf.error_max_length', { max: MAX_LENGTH.toLocaleString() }));
        setOutput('');
        return;
      }

      // Strip SQL comments
      const cleanInput = input
        .replace(/--.*$/gm, '')
        .replace(/\/\*[\s\S]*?\*\//g, '');

      const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:["`]?(\w+)["`]?\.)?["`]?(\w+)["`]?\s*\(([\s\S]*?)\);/gi;
      let match;
      const messages: string[] = [];
      const messageNames = Object.create(null);
      let needsTimestampImport = false;

      while ((match = tableRegex.exec(cleanInput)) !== null) {
        const rawTableName = match[2];
        const columnsContent = match[3];

        let msgName = sanitizeMessageName(rawTableName);
        let counter = 1;
        const baseMsgName = msgName;
        while (messageNames[msgName]) {
          msgName = `${baseMsgName}${counter++}`;
        }
        messageNames[msgName] = true;

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
          const protoType = mapSqlTypeToProto(rawName, sqlType || 'VARCHAR');

          if (protoType === 'google.protobuf.Timestamp') {
            needsTimestampImport = true;
          }

          const upperLine = line.toUpperCase();
          const isNullable = (!upperLine.includes('NOT NULL') && !upperLine.includes('PRIMARY KEY')) || upperLine.includes('DEFAULT NULL');
          const optionalModifier = (syntaxVersion === 'proto2' || isNullable) && syntaxVersion === 'proto2' ? 'optional ' : '';

          const comment = rawName !== safeName ? ` // original: ${rawName}` : '';
          return `  ${optionalModifier}${protoType} ${safeName} = ${index + 1};${comment}`;
        }).filter(Boolean);

        if (fields.length > 0) {
          let msgStr = `message ${msgName} {\n`;
          msgStr += fields.join('\n');
          msgStr += '\n}';
          messages.push(msgStr);
        }
      }

      if (messages.length === 0) {
        setError(t('sqltoprotobuf.no_tables_found', 'No valid CREATE TABLE statements found.'));
        setOutput('');
        return;
      }

      const pkg = packageName.trim() ? packageName.trim().replace(/[^a-zA-Z0-9._]/g, '_') : 'model';
      let result = `syntax = "${syntaxVersion}";\n\npackage ${pkg};\n\n`;

      if (needsTimestampImport) {
        result += `import "google/protobuf/timestamp.proto";\n\n`;
      }

      result += messages.join('\n\n');

      setOutput(result);
      setError('');
    } catch (e: any) {
      setError(t('sqltoprotobuf.error_parsing', 'Error parsing SQL DDL') + ': ' + e.message);
      setOutput('');
    }
  }, [input, packageName, syntaxVersion, casingMode, timestampType, t]);

  useEffect(() => {
    handleConvert();
  }, [handleConvert]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success(t('sqltoprotobuf.toast_copied', 'Protobuf schema copied to clipboard!'));
    setTimeout(() => setCopied(false), 2000);
  }, [output, t]);

  const handleClear = useCallback(() => {
    setInput('');
    setOutput('');
    setError('');
    toast.success(t('sqltoprotobuf.toast_cleared', 'Inputs cleared!'));
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [t]);

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${packageName || 'schema'}.proto`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(t('sqltoprotobuf.toast_downloaded', 'Downloaded .proto file!'));
  };

  const loadPreset = (presetKey: keyof typeof PRESETS) => {
    setInput(PRESETS[presetKey]);
    toast.success(t('sqltoprotobuf.preset_loaded', 'Loaded SQL preset!'));
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
            {t('sqltoprotobuf.presets_title', 'Quick Start Presets:')}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => loadPreset('ecommerce')}
            className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 rounded-xl transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
          >
            {t('sqltoprotobuf.preset_ecommerce', 'E-Commerce Catalog')}
          </button>
          <button
            type="button"
            onClick={() => loadPreset('user_auth')}
            className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 rounded-xl transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
          >
            {t('sqltoprotobuf.preset_user_auth', 'User Auth & Roles')}
          </button>
          <button
            type="button"
            onClick={() => loadPreset('blog')}
            className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 rounded-xl transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
          >
            {t('sqltoprotobuf.preset_blog', 'Blog Posts & Comments')}
          </button>
        </div>
      </div>

      {/* Options Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-5 bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="space-y-1.5">
          <label htmlFor="package-name-input" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('sqltoprotobuf.package_name', 'Package Name')}
          </label>
          <input
            id="package-name-input"
            type="text"
            value={packageName}
            onChange={(e) => setPackageName(e.target.value)}
            placeholder="model"
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="syntax-version-select" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('sqltoprotobuf.syntax_version', 'Protobuf Syntax')}
          </label>
          <select
            id="syntax-version-select"
            value={syntaxVersion}
            onChange={(e) => setSyntaxVersion(e.target.value as 'proto3' | 'proto2')}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="proto3">proto3 (Modern Standard)</option>
            <option value="proto2">proto2 (Legacy)</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="casing-mode-select" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('sqltoprotobuf.casing_mode', 'Field Casing')}
          </label>
          <select
            id="casing-mode-select"
            value={casingMode}
            onChange={(e) => setCasingMode(e.target.value as any)}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="snake_case">snake_case (Protobuf standard)</option>
            <option value="camelCase">camelCase</option>
            <option value="PascalCase">PascalCase</option>
            <option value="original">Original (from SQL)</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="timestamp-type-select" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('sqltoprotobuf.timestamp_type', 'Date/Timestamp Type')}
          </label>
          <select
            id="timestamp-type-select"
            value={timestampType}
            onChange={(e) => setTimestampType(e.target.value as 'timestamp' | 'string')}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="timestamp">google.protobuf.Timestamp</option>
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
              <label htmlFor="sql-proto-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('sqltoprotobuf.sql_input_label', 'SQL CREATE TABLE DDL')}
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
            id="sql-proto-input"
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('sqltoprotobuf.placeholder_sql', 'Paste SQL CREATE TABLE DDL statements here...')}
            className="w-full h-[450px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-emerald-500" aria-hidden="true" />
              <label htmlFor="proto-output" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('sqltoprotobuf.output_label', 'Generated Protobuf (.proto)')}
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
            id="proto-output"
            value={output}
            readOnly
            placeholder={t('sqltoprotobuf.placeholder_output', 'Generated .proto definitions will appear here...')}
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
          <h4 className="font-bold dark:text-white">{t('sqltoprotobuf.about_title', 'About SQL DDL to Protobuf Generator')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('sqltoprotobuf.about_text', 'Convert SQL CREATE TABLE DDL queries directly into Protocol Buffers (proto3 or proto2) message definitions. Supports field casing transformations, google.protobuf.Timestamp mappings, and keyword sanitization for gRPC / RPC services.')}
          </p>
        </div>
      </div>
    </div>
  );
}
