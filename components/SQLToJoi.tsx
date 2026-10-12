import { useState, useEffect, useCallback, useRef } from 'react';
import { ShieldCheck, Copy, Check, Trash2, AlertCircle, Download, Info, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;

type PropertyCasing = 'camelCase' | 'snake_case' | 'PascalCase' | 'original';

const JS_RESERVED_KEYWORDS = new Set([
  'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default', 'delete',
  'do', 'else', 'export', 'extends', 'finally', 'for', 'function', 'if', 'import', 'in',
  'instanceof', 'new', 'return', 'super', 'switch', 'this', 'throw', 'try', 'typeof',
  'var', 'void', 'while', 'with', 'yield', 'let', 'enum', 'implements', 'interface',
  'package', 'private', 'protected', 'public', 'static', 'await', 'abstract', 'boolean',
  'byte', 'char', 'double', 'final', 'float', 'goto', 'int', 'long', 'native', 'short',
  'synchronized', 'transient', 'volatile', 'null', 'true', 'false'
]);

export function SQLToJoi({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState(initialData?.input || '');
  const [output, setOutput] = useState(initialData?.output || '');
  const [propertyCasing, setPropertyCasing] = useState<PropertyCasing>(initialData?.propertyCasing || 'camelCase');
  const [activePresetId, setActivePresetId] = useState<string | null>(initialData?.activePresetId || null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({
      input,
      output,
      propertyCasing,
      activePresetId,
    });
  }, [input, output, propertyCasing, activePresetId, onStateChange]);

  const PRESETS = {
    ecommerce: `CREATE TABLE categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  parent_id INT
);

CREATE TABLE products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  sku VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  category_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`,
    user_auth: `CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'member',
  is_verified BOOLEAN DEFAULT FALSE,
  last_login DATETIME
);`,
    blog_cms: `CREATE TABLE posts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  author_id INT NOT NULL,
  views_count INT DEFAULT 0,
  published_at DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`
  };

  const applyCasing = (str: string, casing: PropertyCasing): string => {
    if (casing === 'original') return str;

    const words = str
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/[-_]+/g, ' ')
      .trim()
      .split(/\s+/);

    if (words.length === 0 || !words[0]) return str;

    if (casing === 'camelCase') {
      return words[0].toLowerCase() + words.slice(1).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
    }
    if (casing === 'snake_case') {
      return words.map(w => w.toLowerCase()).join('_');
    }
    if (casing === 'PascalCase') {
      return words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
    }

    return str;
  };

  const sanitizeIdentifier = (name: string): string => {
    let clean = name.replace(/[^a-zA-Z0-9_]/g, '_');
    if (!/^[a-zA-Z_]/.test(clean)) {
      clean = `_${clean}`;
    }
    return clean;
  };

  const sanitizeKey = (key: string): string => {
    if (JS_RESERVED_KEYWORDS.has(key) || !/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key)) {
      return `'${key.replace(/'/g, "\\'")}'`;
    }
    return key;
  };

  const mapSqlTypeToJoi = (sqlType: string, isNotNull: boolean): string => {
    const typeUpper = sqlType.toUpperCase().trim();
    let schema = 'Joi.any()';

    if (typeUpper.includes('INT') || typeUpper.includes('FLOAT') || typeUpper.includes('DOUBLE') || typeUpper.includes('DECIMAL') || typeUpper.includes('NUMERIC') || typeUpper.includes('REAL')) {
      schema = 'Joi.number()';
    } else if (typeUpper.includes('BOOL') || typeUpper.includes('BIT')) {
      schema = 'Joi.boolean()';
    } else if (typeUpper.includes('DATE') || typeUpper.includes('TIME') || typeUpper.includes('TIMESTAMP')) {
      schema = 'Joi.date()';
    } else if (typeUpper.includes('VARCHAR') || typeUpper.includes('TEXT') || typeUpper.includes('CHAR') || typeUpper.includes('UUID') || typeUpper.includes('STRING')) {
      schema = 'Joi.string()';
      if (typeUpper.includes('EMAIL')) {
        schema += '.email()';
      }
    } else if (typeUpper.includes('JSON')) {
      schema = 'Joi.object()';
    }

    if (isNotNull) {
      schema += '.required()';
    } else {
      schema += '.optional().allow(null)';
    }

    return schema;
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

      const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:[`"']?[\w.]+[`"']?\.)?[`"']?(\w+)[`"']?\s*\(([\s\S]*?)\)(?:;|$)/gi;
      const outputBlocks: string[] = [];
      const schemaNames: string[] = [];
      let match: RegExpExecArray | null;

      while ((match = tableRegex.exec(input)) !== null) {
        const rawTableName = match[1];
        const body = match[2];

        const PascalTableName = applyCasing(rawTableName, 'PascalCase');
        const schemaName = `${sanitizeIdentifier(PascalTableName)}JoiSchema`;
        schemaNames.push(schemaName);

        const columnLines = body.split(',\n');
        const fields: Record<string, string> = Object.create(null);

        columnLines.forEach(line => {
          const trimmed = line.trim();
          if (
            !trimmed ||
            trimmed.toUpperCase().startsWith('PRIMARY KEY') ||
            trimmed.toUpperCase().startsWith('FOREIGN KEY') ||
            trimmed.toUpperCase().startsWith('CONSTRAINT') ||
            trimmed.toUpperCase().startsWith('KEY') ||
            trimmed.toUpperCase().startsWith('INDEX') ||
            trimmed.toUpperCase().startsWith('UNIQUE')
          ) {
            return;
          }

          const colParts = trimmed.split(/\s+/);
          if (colParts.length < 2) return;

          const rawColName = colParts[0].replace(/[`"']/g, '');
          const rawColType = colParts[1];

          const lineUpper = trimmed.toUpperCase();
          const isNotNull = lineUpper.includes('NOT NULL') || lineUpper.includes('PRIMARY KEY');

          const casedName = applyCasing(rawColName, propertyCasing);
          const safeKey = sanitizeKey(casedName);

          fields[safeKey] = mapSqlTypeToJoi(rawColType, isNotNull);
        });

        const fieldEntries = Object.entries(fields);
        let block = `const ${schemaName} = Joi.object({\n`;
        fieldEntries.forEach(([key, schemaStr], idx) => {
          const comma = idx < fieldEntries.length - 1 ? ',' : '';
          block += `  ${key}: ${schemaStr}${comma}\n`;
        });
        block += `});`;

        outputBlocks.push(block);
      }

      if (outputBlocks.length === 0) {
        setError(t('sqltojoi.no_tables_found', 'No valid CREATE TABLE statements found.'));
        setOutput('');
        return;
      }

      const fullOutput = `const Joi = require('joi');\n\n${outputBlocks.join('\n\n')}\n\nmodule.exports = {\n${schemaNames.map(s => `  ${s}`).join(',\n')}\n};`;
      setOutput(fullOutput);
      setError('');
    } catch (e: any) {
      setError(t('sqltojoi.error_parsing', 'Error parsing SQL DDL') + ': ' + e.message);
      setOutput('');
    }
  }, [input, propertyCasing, t]);

  useEffect(() => {
    handleConvert();
  }, [handleConvert]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success(t('sqltojoi.toast_copied', 'Joi schema copied to clipboard!'));
    setTimeout(() => setCopied(false), 2000);
  }, [output, t]);

  const handleClear = useCallback(() => {
    setInput('');
    setOutput('');
    setError('');
    setActivePresetId(null);
    toast.success(t('sqltojoi.toast_cleared', 'Inputs cleared!'));
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [t]);

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sql_schema.joi.js';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(t('common.downloaded', 'Downloaded sql_schema.joi.js!'));
  };

  const loadPreset = (presetKey: keyof typeof PRESETS) => {
    setInput(PRESETS[presetKey]);
    setActivePresetId(presetKey);
    toast.success(t('sqltojoi.preset_loaded', 'Loaded SQL DDL preset!'));
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
            {t('sqltojoi.presets_title', 'Quick Start Presets:')}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => loadPreset('ecommerce')}
            aria-pressed={activePresetId === 'ecommerce'}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
              activePresetId === 'ecommerce'
                ? 'bg-indigo-600 text-white border border-indigo-600'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500'
            }`}
          >
            {t('sqltojoi.preset_ecommerce', 'Catalogue E-Commerce')}
          </button>
          <button
            onClick={() => loadPreset('user_auth')}
            aria-pressed={activePresetId === 'user_auth'}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
              activePresetId === 'user_auth'
                ? 'bg-indigo-600 text-white border border-indigo-600'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500'
            }`}
          >
            {t('sqltojoi.preset_user_auth', 'Authentification & Rôles')}
          </button>
          <button
            onClick={() => loadPreset('blog_cms')}
            aria-pressed={activePresetId === 'blog_cms'}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
              activePresetId === 'blog_cms'
                ? 'bg-indigo-600 text-white border border-indigo-600'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500'
            }`}
          >
            {t('sqltojoi.preset_blog', 'Blog CMS')}
          </button>
        </div>
      </div>

      {/* Options Panel */}
      <div className="p-5 bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="property-casing" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              {t('sqltojoi.property_casing', 'Property Casing')}
            </label>
            <select
              id="property-casing"
              value={propertyCasing}
              onChange={(e) => setPropertyCasing(e.target.value as PropertyCasing)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="camelCase">camelCase (JS/TS default)</option>
              <option value="snake_case">snake_case</option>
              <option value="PascalCase">PascalCase</option>
              <option value="original">Original</option>
            </select>
          </div>
        </div>
      </div>

      {/* Editor Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-500" aria-hidden="true" />
              <label htmlFor="sql-joi-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('sqltojoi.sql_input_label', 'SQL CREATE TABLE DDL')}
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
            id="sql-joi-input"
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              if (activePresetId) setActivePresetId(null);
            }}
            placeholder={t('sqltojoi.placeholder_sql', 'Paste SQL CREATE TABLE DDL queries here...')}
            className="w-full h-[450px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" aria-hidden="true" />
              <label htmlFor="joi-output" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('sqltojoi.output_label', 'Generated Joi Schema')}
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
            id="joi-output"
            value={output}
            readOnly
            placeholder={t('sqltojoi.placeholder_output', 'Generated Joi validation schemas will appear here...')}
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
          <h4 className="font-bold dark:text-white">{t('sqltojoi.about_title', 'About SQL DDL to Joi Schema Converter')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('sqltojoi.about_text', 'Convert SQL CREATE TABLE DDL statements into strongly-typed Joi validation schema definitions (`Joi.object`, `Joi.string`, `Joi.number`, `Joi.boolean`, `Joi.date`).')}
          </p>
        </div>
      </div>
    </div>
  );
}
