import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Database, Copy, Check, Trash2, Code, Download, Info, Sparkles, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000; // 100KB DoS protection

type OutputStyle = 'typescript' | 'javascript' | 'schema_only';
type PropertyCasing = 'camelCase' | 'snake_case' | 'PascalCase' | 'original';

interface SQLColumn {
  name: string;
  type: string;
  isNullable: boolean;
  isPrimaryKey: boolean;
  isUnique: boolean;
  defaultValue: string | null;
  referencesTable?: string;
}

interface SQLTable {
  name: string;
  columns: SQLColumn[];
}

const JS_RESERVED_KEYWORDS = new Set([
  'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default', 'delete',
  'do', 'else', 'export', 'extends', 'finally', 'for', 'function', 'if', 'import', 'in',
  'instanceof', 'new', 'return', 'super', 'switch', 'this', 'throw', 'try', 'typeof',
  'var', 'void', 'while', 'with', 'yield', 'let', 'enum', 'implements', 'interface',
  'package', 'private', 'protected', 'public', 'static', 'await', 'abstract', 'boolean',
  'byte', 'char', 'double', 'final', 'float', 'goto', 'int', 'long', 'native', 'short',
  'synchronized', 'transient', 'volatile', 'null', 'true', 'false', 'prototype', '__proto__', 'constructor'
]);

const SAMPLE_PRESETS = {
  ecommerce: `-- E-Commerce Catalog DDL
CREATE TABLE categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(120) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  category_id INT NOT NULL REFERENCES categories(id),
  title VARCHAR(255) NOT NULL,
  sku VARCHAR(64) UNIQUE,
  price DECIMAL(10, 2) NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  tags JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`,

  user_auth: `-- User Auth & Roles DDL
CREATE TABLE roles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL UNIQUE,
  permissions JSON
);

CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  role_id INT NOT NULL REFERENCES roles(id),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`,

  blog: `-- Blog Posts & Comments DDL
CREATE TABLE authors (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL UNIQUE,
  bio TEXT,
  avatar_url VARCHAR(255)
);

CREATE TABLE posts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  author_id INT NOT NULL REFERENCES authors(id),
  title VARCHAR(200) NOT NULL,
  slug VARCHAR(200) NOT NULL UNIQUE,
  content TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'draft',
  views_count INT DEFAULT 0,
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`
};

export function SQLToMongoose({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [input, setInput] = useState<string>(initialData?.input || SAMPLE_PRESETS.ecommerce);
  const [outputStyle, setOutputStyle] = useState<OutputStyle>(initialData?.outputStyle || 'typescript');
  const [casing, setCasing] = useState<PropertyCasing>(initialData?.casing || 'camelCase');
  const [useTimestamps, setUseTimestamps] = useState<boolean>(initialData?.useTimestamps ?? true);
  const [useRequired, setUseRequired] = useState<boolean>(initialData?.useRequired ?? true);
  const [useRefOption, setUseRefOption] = useState<boolean>(initialData?.useRefOption ?? true);

  const [copied, setCopied] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>('ecommerce');

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const outputRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    onStateChange?.({ input, outputStyle, casing, useTimestamps, useRequired, useRefOption });
  }, [input, outputStyle, casing, useTimestamps, useRequired, useRefOption, onStateChange]);

  const toCamelCase = (str: string): string => {
    const clean = str.replace(/[^a-zA-Z0-9_]/g, '');
    const parts = clean.split('_').filter(x => !!x);
    if (parts.length === 0) return 'field';
    return parts[0].toLowerCase() + parts.slice(1).map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join('');
  };

  const toSnakeCase = (str: string): string => {
    return str
      .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
      .replace(/[^a-zA-Z0-9_]/g, '_')
      .toLowerCase()
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '');
  };

  const toPascalCase = (str: string): string => {
    const clean = str.replace(/[^a-zA-Z0-9_]/g, '');
    const parts = clean.split('_').filter(x => !!x);
    if (parts.length === 0) return 'Field';
    return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join('');
  };

  const formatPropertyName = useCallback((colName: string): string => {
    let name = colName;
    if (casing === 'camelCase') name = toCamelCase(colName);
    else if (casing === 'snake_case') name = toSnakeCase(colName);
    else if (casing === 'PascalCase') name = toPascalCase(colName);

    if (JS_RESERVED_KEYWORDS.has(name)) {
      name = `${name}_val`;
    }
    return name;
  }, [casing]);

  const formatClassName = (tableName: string): string => {
    let clean = tableName.replace(/[^a-zA-Z0-9_]/g, '');
    if (clean.endsWith('ies')) clean = clean.slice(0, -3) + 'y';
    else if (clean.endsWith('s') && !clean.endsWith('ss')) clean = clean.slice(0, -1);
    const p = toPascalCase(clean);
    return JS_RESERVED_KEYWORDS.has(p) ? `${p}Model` : p;
  };

  const parseSQLDDL = (sql: string): SQLTable[] => {
    const tables: SQLTable[] = [];
    const cleanSql = sql.replace(/--.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
    const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([`"']?[\w_]+[`"']?)\s*\(([\s\S]*?)\);/gi;

    let match;
    while ((match = tableRegex.exec(cleanSql)) !== null) {
      const rawTableName = match[1].replace(/[`"']/g, '');
      const body = match[2];
      const lines = body.split(/,\n(?![^(]*\))/);
      const columns: SQLColumn[] = [];

      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line || /^(PRIMARY\s+KEY|FOREIGN\s+KEY|UNIQUE|KEY|INDEX|CONSTRAINT)/i.test(line)) {
          continue;
        }

        const colMatch = line.match(/^[`"']?([\w_]+)[`"']?\s+([\w_]+(?:\([\d\s,]+\))?)/i);
        if (!colMatch) continue;

        const colName = colMatch[1];
        const colType = colMatch[2].toUpperCase();
        const upperLine = line.toUpperCase();

        const isNullable = !upperLine.includes('NOT NULL');
        const isPrimaryKey = upperLine.includes('PRIMARY KEY');
        const isUnique = upperLine.includes('UNIQUE');

        let defaultValue: string | null = null;
        const defaultMatch = line.match(/DEFAULT\s+('([^']*)'|"([^"]*)"|[\w_.-]+)/i);
        if (defaultMatch) {
          defaultValue = defaultMatch[2] || defaultMatch[3] || defaultMatch[1];
        }

        let referencesTable: string | undefined;
        const refMatch = line.match(/REFERENCES\s+[`"']?([\w_]+)[`"']?/i);
        if (refMatch) {
          referencesTable = refMatch[1];
        }

        columns.push({
          name: colName,
          type: colType,
          isNullable,
          isPrimaryKey,
          isUnique,
          defaultValue,
          referencesTable
        });
      }

      if (columns.length > 0) {
        tables.push({ name: rawTableName, columns });
      }
    }

    return tables;
  };

  const mapSQLToMongooseType = (sqlType: string, refTable?: string): { mType: string; tsType: string } => {
    const t = sqlType.toUpperCase();
    if (useRefOption && refTable) {
      return { mType: `Schema.Types.ObjectId`, tsType: 'Types.ObjectId' };
    }
    if (t.includes('INT') || t.includes('FLOAT') || t.includes('DOUBLE') || t.includes('REAL') || t.includes('NUMERIC')) {
      return { mType: 'Number', tsType: 'number' };
    }
    if (t.includes('DECIMAL')) {
      return { mType: 'Schema.Types.Decimal128', tsType: 'Types.Decimal128' };
    }
    if (t.includes('CHAR') || t.includes('TEXT') || t.includes('VARCHAR') || t.includes('UUID') || t.includes('ENUM')) {
      return { mType: 'String', tsType: 'string' };
    }
    if (t.includes('BOOL')) {
      return { mType: 'Boolean', tsType: 'boolean' };
    }
    if (t.includes('DATE') || t.includes('TIME')) {
      return { mType: 'Date', tsType: 'Date' };
    }
    if (t.includes('BLOB') || t.includes('BYTEA') || t.includes('BINARY')) {
      return { mType: 'Buffer', tsType: 'Buffer' };
    }
    if (t.includes('JSON')) {
      return { mType: 'Schema.Types.Mixed', tsType: 'Record<string, any>' };
    }
    return { mType: 'Schema.Types.Mixed', tsType: 'any' };
  };

  const generateMongooseCode = (): string => {
    if (!input.trim()) return '';
    if (input.length > MAX_LENGTH) {
      return `// ${t('error.max_length_sql', { max: MAX_LENGTH.toLocaleString() })}`;
    }

    const tables = parseSQLDDL(input);
    if (tables.length === 0) {
      return `// ${t('sqltomongoose.no_tables_found') || 'No valid CREATE TABLE DDL queries found.'}`;
    }

    const blocks: string[] = [];

    // Header imports
    if (outputStyle === 'typescript') {
      blocks.push(`import mongoose, { Schema, Document, Model, Types } from 'mongoose';\n`);
    } else {
      blocks.push(`const mongoose = require('mongoose');\nconst { Schema } = mongoose;\n`);
    }

    for (const table of tables) {
      const modelName = formatClassName(table.name);
      const schemaName = `${modelName}Schema`;
      const interfaceName = `I${modelName}`;

      const schemaFields: string[] = [];
      const tsFields: string[] = [];

      for (const col of table.columns) {
        // Skip createdAt and updatedAt if timestamps option is checked and col matches
        if (useTimestamps && (col.name.toLowerCase() === 'created_at' || col.name.toLowerCase() === 'updated_at')) {
          continue;
        }

        const propName = formatPropertyName(col.name);
        const { mType, tsType } = mapSQLToMongooseType(col.type, col.referencesTable);

        const options: string[] = [`type: ${mType}`];

        if (useRequired && !col.isNullable && !col.isPrimaryKey) {
          options.push(`required: true`);
        }

        if (col.isUnique) {
          options.push(`unique: true`);
        }

        if (col.defaultValue !== null && col.defaultValue !== undefined) {
          const defUpper = col.defaultValue.toUpperCase();
          if (defUpper === 'CURRENT_TIMESTAMP' || defUpper === 'NOW()') {
            options.push(`default: Date.now`);
          } else if (defUpper === 'TRUE' || defUpper === 'FALSE') {
            options.push(`default: ${defUpper.toLowerCase()}`);
          } else if (!isNaN(Number(col.defaultValue))) {
            options.push(`default: ${col.defaultValue}`);
          } else {
            options.push(`default: ${JSON.stringify(col.defaultValue)}`);
          }
        }

        if (useRefOption && col.referencesTable) {
          const refModel = formatClassName(col.referencesTable);
          options.push(`ref: '${refModel}'`);
        }

        if (options.length === 1 && options[0].startsWith('type: ')) {
          schemaFields.push(`  ${propName}: ${mType},`);
        } else {
          schemaFields.push(`  ${propName}: { ${options.join(', ')} },`);
        }

        const optionalMarker = col.isNullable ? '?' : '';
        tsFields.push(`  ${propName}${optionalMarker}: ${tsType};`);
      }

      let code = '';

      if (outputStyle === 'typescript') {
        code += `// Interface definition for ${modelName}\n`;
        code += `export interface ${interfaceName} extends Document {\n`;
        code += tsFields.join('\n') + '\n';
        code += `}\n\n`;
      }

      code += `// Mongoose Schema for ${modelName}\n`;
      code += `export const ${schemaName} = new Schema${outputStyle === 'typescript' ? `<${interfaceName}>` : ''}({\n`;
      code += schemaFields.join('\n') + '\n';
      code += `}${useTimestamps ? `, { timestamps: true }` : ''});\n\n`;

      if (outputStyle !== 'schema_only') {
        code += `export const ${modelName}: Model${outputStyle === 'typescript' ? `<${interfaceName}>` : ''} = mongoose.models.${modelName} || mongoose.model${outputStyle === 'typescript' ? `<${interfaceName}>` : ''}('${modelName}', ${schemaName});\n`;
      }

      blocks.push(code);
    }

    return blocks.join('\n');
  };

  const outputCode = generateMongooseCode();

  const handleCopy = useCallback(() => {
    if (!outputCode) return;
    navigator.clipboard.writeText(outputCode);
    setCopied(true);
    toast.success(t('sqltomongoose.toast_copied') || 'Mongoose schema copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  }, [outputCode, t]);

  const handleClear = useCallback(() => {
    setInput('');
    setActivePreset(null);
    toast.success(t('common.cleared') || 'Cleared input!');
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [t]);

  const handleLoadPreset = (key: keyof typeof SAMPLE_PRESETS) => {
    setInput(SAMPLE_PRESETS[key]);
    setActivePreset(key);
    toast.success(t('sqltomongoose.preset_loaded') || 'Loaded SQL preset!');
  };

  const handleDownload = () => {
    if (!outputCode) return;
    const ext = outputStyle === 'typescript' ? 'ts' : 'js';
    const blob = new Blob([outputCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `models.${ext}`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(t('sqltomongoose.toast_downloaded') || 'Downloaded models file!');
  };

  const handlersRef = useRef({ handleClear, handleCopy });
  useEffect(() => {
    handlersRef.current = { handleClear, handleCopy };
  }, [handleClear, handleCopy]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName) ||
        (e.target as HTMLElement)?.isContentEditable;

      if (e.key === 'Escape') {
        e.preventDefault();
        handlersRef.current.handleClear();
      } else if (!isInput && e.key.toLowerCase() === 'c' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        handlersRef.current.handleCopy();
      }
    };

    const node = containerRef.current || document;
    node.addEventListener('keydown', handleKeyDown as EventListener);
    return () => node.removeEventListener('keydown', handleKeyDown as EventListener);
  }, []);

  return (
    <div ref={containerRef} className="max-w-6xl mx-auto space-y-8" tabIndex={-1}>
      {/* Presets Header */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            <span className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
              {t('sqltomongoose.presets_title') || 'Quick Presets'}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'ecommerce', label: t('sqltomongoose.preset_ecommerce') || 'E-Commerce Catalog' },
              { id: 'user_auth', label: t('sqltomongoose.preset_user_auth') || 'User Auth & Roles' },
              { id: 'blog', label: t('sqltomongoose.preset_blog') || 'Blog CMS & Comments' },
            ].map(p => (
              <button
                key={p.id}
                onClick={() => handleLoadPreset(p.id as keyof typeof SAMPLE_PRESETS)}
                aria-pressed={activePreset === p.id}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  activePreset === p.id
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Options grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
          <div>
            <label htmlFor="mongoose-output-style" className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
              {t('sqltomongoose.output_style') || 'Output Format'}
            </label>
            <select
              id="mongoose-output-style"
              value={outputStyle}
              onChange={(e) => setOutputStyle(e.target.value as OutputStyle)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="typescript">TypeScript Interface & Model</option>
              <option value="javascript">JavaScript Schema & Model</option>
              <option value="schema_only">Schema Definition Only</option>
            </select>
          </div>

          <div>
            <label htmlFor="mongoose-casing" className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
              {t('sqltomongoose.field_casing') || 'Field Casing'}
            </label>
            <select
              id="mongoose-casing"
              value={casing}
              onChange={(e) => setCasing(e.target.value as PropertyCasing)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="camelCase">camelCase</option>
              <option value="snake_case">snake_case</option>
              <option value="PascalCase">PascalCase</option>
              <option value="original">Original (SQL)</option>
            </select>
          </div>

          <div className="flex items-center gap-2 pt-5">
            <input
              id="mongoose-timestamps"
              type="checkbox"
              checked={useTimestamps}
              onChange={(e) => setUseTimestamps(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700"
            />
            <label htmlFor="mongoose-timestamps" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
              {t('sqltomongoose.use_timestamps') || '{ timestamps: true }'}
            </label>
          </div>

          <div className="flex items-center gap-2 pt-5">
            <input
              id="mongoose-required"
              type="checkbox"
              checked={useRequired}
              onChange={(e) => setUseRequired(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700"
            />
            <label htmlFor="mongoose-required" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
              {t('sqltomongoose.use_required') || 'required: true'}
            </label>
          </div>

          <div className="flex items-center gap-2 pt-5 sm:col-span-2 md:col-span-1">
            <input
              id="mongoose-ref"
              type="checkbox"
              checked={useRefOption}
              onChange={(e) => setUseRefOption(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700"
            />
            <label htmlFor="mongoose-ref" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
              {t('sqltomongoose.use_ref') || "ref: 'Model'"}
            </label>
          </div>
        </div>
      </div>

      {/* Editor Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="sql-mongoose-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-500" />
              {t('sqltomongoose.sql_input_label') || 'SQL CREATE TABLE DDL'}
            </label>
            <div className="flex gap-2 items-center">
              <Kbd modifier={null} className="hidden sm:inline-flex border-rose-200 dark:border-rose-800 text-rose-400">Esc</Kbd>
              <button
                onClick={handleClear}
                disabled={!input}
                className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50"
              >
                <Trash2 className="w-3 h-3" /> {t('common.clear')}
              </button>
            </div>
          </div>
          <textarea
            id="sql-mongoose-input"
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('sqltomongoose.placeholder_sql') || 'Paste SQL CREATE TABLE DDL statements here...'}
            className="w-full h-[420px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono text-sm leading-relaxed dark:text-slate-300 resize-none transition-all"
          />
        </div>

        {/* Output */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="mongoose-output" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Code className="w-4 h-4 text-emerald-500" />
              {t('sqltomongoose.output_label') || 'Generated Mongoose Schema & Models'}
            </label>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                disabled={!outputCode}
                className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/30 hover:bg-indigo-100 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50"
              >
                <Download className="w-3 h-3" /> {t('common.download')}
              </button>
              <button
                onClick={handleCopy}
                disabled={!outputCode}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 border ${
                  copied
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                    : 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700'
                } disabled:opacity-50`}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? t('common.copied') : t('common.copy')}
                {!copied && <Kbd modifier={null} className="ml-1 border-slate-200 dark:border-slate-700">C</Kbd>}
              </button>
            </div>
          </div>
          <textarea
            id="mongoose-output"
            ref={outputRef}
            value={outputCode}
            readOnly
            placeholder={t('sqltomongoose.placeholder_output') || 'Generated Mongoose Schema code will appear here...'}
            className="w-full h-[420px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none font-mono text-sm leading-relaxed text-indigo-600 dark:text-indigo-400 resize-none transition-all"
          />
        </div>
      </div>

      {/* Info footer */}
      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <Info className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">
            {t('sqltomongoose.about_title') || 'About SQL DDL to Mongoose Schema Generator'}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('sqltomongoose.about_text') || 'Convert SQL CREATE TABLE DDL queries directly into Mongoose schemas, TypeScript interfaces, and Model exports. Supports MongoDB types (String, Number, Boolean, Date, Buffer, Decimal128, ObjectId), required validation, default values, unique indexes, foreign key ref references, and timestamps.'}
          </p>
        </div>
      </div>
    </div>
  );
}
