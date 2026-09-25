import { useState, useEffect, useCallback, useRef } from 'react';
import { FileCode, Copy, Check, Trash2, AlertCircle, Download, Info, Database, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;

type FieldCasing = 'camelCase' | 'snake_case' | 'PascalCase' | 'original';
type LanguageMode = 'javascript' | 'typescript';

export function SQLToKnex({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [input, setInput] = useState(initialData?.input || '');
  const [output, setOutput] = useState(initialData?.output || '');
  const [language, setLanguage] = useState<LanguageMode>(initialData?.language || 'typescript');
  const [fieldCasing, setFieldCasing] = useState<FieldCasing>(initialData?.fieldCasing || 'snake_case');
  const [useTimestamps, setUseTimestamps] = useState(initialData?.useTimestamps ?? true);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({
      input,
      output,
      language,
      fieldCasing,
      useTimestamps,
    });
  }, [input, output, language, fieldCasing, useTimestamps, onStateChange]);

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
  sku VARCHAR(50) UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  category_id INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  metadata JSON
);`,
    user_auth: `-- User Auth & Roles Schema
CREATE TABLE users (
  user_id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100),
  is_verified BOOLEAN DEFAULT FALSE,
  login_count INT DEFAULT 0,
  last_login TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE roles (
  role_id INT PRIMARY KEY AUTO_INCREMENT,
  role_name VARCHAR(50) NOT NULL,
  permissions JSON
);`,
    blog: `-- Blog CMS Schema
CREATE TABLE posts (
  post_id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  body TEXT NOT NULL,
  published_at DATETIME,
  view_count INT DEFAULT 0,
  is_draft BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE comments (
  comment_id INT PRIMARY KEY AUTO_INCREMENT,
  post_id INT NOT NULL,
  author_name VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);`
  };

  const toPascalCase = (str: string) => {
    const pascal = str
      .replace(/[^a-zA-Z0-9]/g, ' ')
      .split(' ')
      .filter(Boolean)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
    return pascal || 'Table';
  };

  const toCamelCase = (str: string) => {
    const pascal = toPascalCase(str);
    return pascal.charAt(0).toLowerCase() + pascal.slice(1);
  };

  const toSnakeCase = (str: string) => {
    return str
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .replace(/[^a-zA-Z0-9]/g, '_')
      .replace(/_+/g, '_')
      .toLowerCase();
  };

  const formatFieldName = (name: string) => {
    if (fieldCasing === 'camelCase') return toCamelCase(name);
    if (fieldCasing === 'snake_case') return toSnakeCase(name);
    if (fieldCasing === 'PascalCase') return toPascalCase(name);
    return name;
  };

  const formatDefaultValue = (defaultVal: string) => {
    const upper = defaultVal.toUpperCase().trim();
    if (upper === 'TRUE') return 'true';
    if (upper === 'FALSE') return 'false';
    if (upper === 'NULL') return 'null';
    if (upper === 'CURRENT_TIMESTAMP' || upper === 'NOW()' || upper === 'CURRENT_TIMESTAMP()') return 'knex.fn.now()';
    if (!isNaN(Number(defaultVal))) return defaultVal;
    if (defaultVal.startsWith("'") || defaultVal.startsWith('"')) return defaultVal;
    return `'${defaultVal.replace(/'/g, "\\'")}'`;
  };

  const mapSqlTypeToKnex = (
    rawFieldName: string,
    formattedName: string,
    sqlType: string,
    isPrimary: boolean,
    isAutoIncrement: boolean
  ): string => {
    const type = (sqlType || 'VARCHAR').toUpperCase();

    if (isPrimary && isAutoIncrement) {
      if (type.includes('BIGINT')) {
        return `table.bigIncrements('${formattedName}')`;
      }
      return `table.increments('${formattedName}')`;
    }

    if (isPrimary && type.includes('UUID')) {
      return `table.uuid('${formattedName}')`;
    }

    if (type.includes('UUID')) return `table.uuid('${formattedName}')`;
    if (type.includes('BIGINT')) return `table.bigInteger('${formattedName}')`;
    if (type.includes('SMALLINT') || type.includes('TINYINT')) return `table.integer('${formattedName}')`;
    if (type.includes('INT') || type.includes('SERIAL')) return `table.integer('${formattedName}')`;
    if (type.includes('TINYINT(1)') || type.includes('BOOLEAN') || type.includes('BOOL')) return `table.boolean('${formattedName}')`;

    if (type.includes('DECIMAL') || type.includes('NUMERIC')) {
      const match = type.match(/\((\d+)\s*,\s*(\d+)\)/);
      if (match) {
        return `table.decimal('${formattedName}', ${match[1]}, ${match[2]})`;
      }
      return `table.decimal('${formattedName}')`;
    }

    if (type.includes('FLOAT') || type.includes('REAL')) return `table.float('${formattedName}')`;
    if (type.includes('DOUBLE')) return `table.double('${formattedName}')`;
    if (type.includes('DATETIME')) return `table.datetime('${formattedName}')`;
    if (type.includes('TIMESTAMP')) return `table.timestamp('${formattedName}')`;
    if (type.includes('DATE')) return `table.date('${formattedName}')`;
    if (type.includes('TIME')) return `table.time('${formattedName}')`;
    if (type.includes('JSONB')) return `table.jsonb('${formattedName}')`;
    if (type.includes('JSON')) return `table.json('${formattedName}')`;
    if (type.includes('TEXT') || type.includes('CLOB')) return `table.text('${formattedName}')`;
    if (type.includes('BLOB') || type.includes('BYTEA')) return `table.binary('${formattedName}')`;

    const varcharMatch = type.match(/VARCHAR\((\d+)\)/) || type.match(/CHAR\((\d+)\)/);
    if (varcharMatch) {
      return `table.string('${formattedName}', ${varcharMatch[1]})`;
    }

    return `table.string('${formattedName}')`;
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
      const tables: Array<{
        tableName: string;
        lines: string[];
        hasCreatedAndUpdated: boolean;
      }> = [];

      while ((match = tableRegex.exec(cleanInput)) !== null) {
        const rawTableName = match[2];
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

        const fields: Array<{
          rawName: string;
          formattedName: string;
          sqlType: string;
          isPrimaryKey: boolean;
          isAutoIncrement: boolean;
          isNullable: boolean;
          isUnique: boolean;
          defaultValue?: string;
        }> = [];

        columnLines.forEach(line => {
          const trimmed = line.trim();
          if (!trimmed) return;
          const upper = trimmed.toUpperCase();

          if (
            upper.startsWith('CONSTRAINT') ||
            upper.startsWith('PRIMARY KEY') ||
            upper.startsWith('FOREIGN KEY') ||
            upper.startsWith('UNIQUE') ||
            upper.startsWith('INDEX') ||
            upper.startsWith('KEY')
          ) {
            return;
          }

          let rawName = '';
          let sqlType = '';

          if (trimmed.startsWith('"') || trimmed.startsWith('`') || trimmed.startsWith("'")) {
            const quote = trimmed[0];
            let i = 1;
            while (i < trimmed.length && (trimmed[i] !== quote || trimmed[i - 1] === '\\')) {
              rawName += trimmed[i];
              i++;
            }
            const remaining = trimmed.substring(i + 1).trim();
            sqlType = remaining.split(/\s+/)[0];
          } else {
            const parts = trimmed.split(/\s+/);
            rawName = parts[0];
            sqlType = parts[1];
          }

          if (!rawName) return;

          const isPrimaryKey = upper.includes('PRIMARY KEY');
          const isAutoIncrement = upper.includes('AUTO_INCREMENT') || upper.includes('SERIAL');
          const isNullable = !upper.includes('NOT NULL') && !isPrimaryKey;
          const isUnique = upper.includes('UNIQUE');

          let defaultValue: string | undefined = undefined;
          const defaultMatch = trimmed.match(/DEFAULT\s+('([^']*)'|"([^"]*)"|[\w_()+.-]+)/i);
          if (defaultMatch) {
            defaultValue = defaultMatch[1];
          }

          fields.push({
            rawName,
            formattedName: formatFieldName(rawName),
            sqlType,
            isPrimaryKey,
            isAutoIncrement,
            isNullable,
            isUnique,
            defaultValue,
          });
        });

        let hasCreatedAt = false;
        let hasUpdatedAt = false;
        const knexLines: string[] = [];

        fields.forEach(f => {
          const lowerRaw = f.rawName.toLowerCase();
          if (lowerRaw === 'created_at' || lowerRaw === 'createdat') hasCreatedAt = true;
          if (lowerRaw === 'updated_at' || lowerRaw === 'updatedat') hasUpdatedAt = true;

          if (useTimestamps && (lowerRaw === 'created_at' || lowerRaw === 'updated_at' || lowerRaw === 'createdat' || lowerRaw === 'updatedat')) {
            return; // We'll handle timestamps with table.timestamps(true, true)
          }

          let call = mapSqlTypeToKnex(f.rawName, f.formattedName, f.sqlType, f.isPrimaryKey, f.isAutoIncrement);

          if (f.isPrimaryKey) {
            call += '.primary()';
          }

          if (f.isUnique && !f.isPrimaryKey) {
            call += '.unique()';
          }

          if (!f.isNullable) {
            call += '.notNullable()';
          } else if (!f.isPrimaryKey && !f.isAutoIncrement) {
            call += '.nullable()';
          }

          if (f.defaultValue !== undefined) {
            call += `.defaultTo(${formatDefaultValue(f.defaultValue)})`;
          }

          knexLines.push(`      ${call};`);
        });

        const hasTimestampsCombined = useTimestamps && (hasCreatedAt || hasUpdatedAt);
        if (hasTimestampsCombined) {
          knexLines.push('      table.timestamps(true, true);');
        }

        tables.push({
          tableName: rawTableName,
          lines: knexLines,
          hasCreatedAndUpdated: hasTimestampsCombined,
        });
      }

      if (tables.length === 0) {
        setError(t('sqltoknex.no_tables_found', 'No valid CREATE TABLE statements found.'));
        setOutput('');
        return;
      }

      let generated = '';

      if (language === 'typescript') {
        generated += `import { Knex } from 'knex';\n\n`;
        generated += `export async function up(knex: Knex): Promise<void> {\n`;
        generated += `  return knex.schema\n`;
        tables.forEach((tData, idx) => {
          const isLast = idx === tables.length - 1;
          generated += `    .createTable('${tData.tableName}', (table) => {\n`;
          generated += tData.lines.join('\n') + '\n';
          generated += `    })${isLast ? ';' : ''}\n`;
        });
        generated += `}\n\n`;

        generated += `export async function down(knex: Knex): Promise<void> {\n`;
        generated += `  return knex.schema\n`;
        const reversedTables = [...tables].reverse();
        reversedTables.forEach((tData, idx) => {
          const isLast = idx === reversedTables.length - 1;
          generated += `    .dropTableIfExists('${tData.tableName}')${isLast ? ';' : ''}\n`;
        });
        generated += `}\n`;
      } else {
        generated += `/**\n * @param { import("knex").Knex } knex\n * @returns { Promise<void> }\n */\n`;
        generated += `exports.up = function(knex) {\n`;
        generated += `  return knex.schema\n`;
        tables.forEach((tData, idx) => {
          const isLast = idx === tables.length - 1;
          generated += `    .createTable('${tData.tableName}', function(table) {\n`;
          generated += tData.lines.join('\n') + '\n';
          generated += `    })${isLast ? ';' : ''}\n`;
        });
        generated += `};\n\n`;

        generated += `/**\n * @param { import("knex").Knex } knex\n * @returns { Promise<void> }\n */\n`;
        generated += `exports.down = function(knex) {\n`;
        generated += `  return knex.schema\n`;
        const reversedTables = [...tables].reverse();
        reversedTables.forEach((tData, idx) => {
          const isLast = idx === reversedTables.length - 1;
          generated += `    .dropTableIfExists('${tData.tableName}')${isLast ? ';' : ''}\n`;
        });
        generated += `};\n`;
      }

      setOutput(generated.trim());
      setError('');
    } catch (e: any) {
      setError(t('sqltoknex.error_parsing', 'Error parsing SQL DDL') + ': ' + e.message);
      setOutput('');
    }
  }, [input, language, fieldCasing, useTimestamps, t]);

  useEffect(() => {
    handleConvert();
  }, [handleConvert]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success(t('sqltoknex.toast_copied', 'Knex migration copied to clipboard!'));
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
    const ext = language === 'typescript' ? 'ts' : 'js';
    const filename = `migration.${ext}`;
    const blob = new Blob([output], { type: language === 'typescript' ? 'text/typescript' : 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(t('sqltoknex.toast_downloaded', `Downloaded ${filename}!`));
  };

  const loadPreset = (presetKey: keyof typeof PRESETS) => {
    setInput(PRESETS[presetKey]);
    setActivePreset(presetKey);
    toast.success(t('sqltoknex.preset_loaded', 'Loaded SQL preset!'));
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
            {t('sqltoknex.presets_title', 'Quick Presets')}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(['ecommerce', 'user_auth', 'blog'] as const).map((pKey) => {
            const isActive = activePreset === pKey;
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
                {t(`sqltoknex.preset_${pKey}`, pKey === 'ecommerce' ? 'E-Commerce Catalog' : pKey === 'user_auth' ? 'User Auth & Roles' : 'Blog CMS')}
              </button>
            );
          })}
        </div>
      </div>

      {/* Options Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="space-y-1.5">
          <label htmlFor="knex-language" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('sqltoknex.language', 'Language')}
          </label>
          <select
            id="knex-language"
            value={language}
            onChange={(e) => setLanguage(e.target.value as LanguageMode)}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="typescript">TypeScript (export async function up/down)</option>
            <option value="javascript">JavaScript (exports.up/down)</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="knex-field-casing" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('sqltoknex.field_casing', 'Column Casing')}
          </label>
          <select
            id="knex-field-casing"
            value={fieldCasing}
            onChange={(e) => setFieldCasing(e.target.value as FieldCasing)}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="snake_case">snake_case (Knex Standard)</option>
            <option value="camelCase">camelCase</option>
            <option value="PascalCase">PascalCase</option>
            <option value="original">Original Column Name</option>
          </select>
        </div>

        <div className="flex flex-col justify-end space-y-2 pt-2 md:pt-0">
          <div className="flex items-center gap-2">
            <input
              id="knex-timestamps"
              type="checkbox"
              checked={useTimestamps}
              onChange={(e) => setUseTimestamps(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
            <label htmlFor="knex-timestamps" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
              {t('sqltoknex.use_timestamps', 'Use table.timestamps(true, true)')}
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
              <label htmlFor="sql-knex-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('sqltoknex.sql_input_label', 'SQL CREATE TABLE DDL')}
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
            id="sql-knex-input"
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              if (activePreset) setActivePreset(null);
            }}
            placeholder={t('sqltoknex.placeholder_sql', 'Paste SQL CREATE TABLE DDL statements here...')}
            className="w-full h-[450px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-emerald-500" aria-hidden="true" />
              <label htmlFor="knex-output" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('sqltoknex.output_label', 'Generated Knex.js Migration')}
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
            id="knex-output"
            value={output}
            readOnly
            placeholder={t('sqltoknex.placeholder_output', 'Generated Knex.js migration code will appear here...')}
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
          <h4 className="font-bold dark:text-white">{t('sqltoknex.about_title', 'About SQL to Knex.js Migration Generator')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('sqltoknex.about_text', 'Convert SQL CREATE TABLE DDL queries into Knex.js migration scripts (exports.up / exports.down or TypeScript export async function up/down). Supports column data types, primary keys, defaults, nullability, unique constraints, and automatic timestamp helpers.')}
          </p>
        </div>
      </div>
    </div>
  );
}
