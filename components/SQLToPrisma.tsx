import { useState, useEffect, useCallback, useRef } from 'react';
import { Database, Copy, Check, Trash2, AlertCircle, Download, Info, Settings, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;

type Provider = 'postgresql' | 'mysql' | 'sqlite' | 'sqlserver' | 'cockroachdb';

interface ParsedColumn {
  name: string;
  pascalName: string;
  camelName: string;
  sqlType: string;
  prismaType: string;
  isPrimaryKey: boolean;
  isNullable: boolean;
  isUnique: boolean;
  defaultValue?: string;
  isAutoIncrement: boolean;
  isUuid: boolean;
  foreignKey?: {
    targetTable: string;
    targetColumn: string;
  };
}

interface ParsedTable {
  tableName: string;
  modelName: string;
  columns: ParsedColumn[];
  primaryKeys: string[];
}

export function SQLToPrisma({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState(initialData?.input || '');
  const [output, setOutput] = useState('');
  const [provider, setProvider] = useState<Provider>(initialData?.provider || 'postgresql');
  const [useMapAttributes, setUseMapAttributes] = useState<boolean>(initialData?.useMapAttributes ?? true);
  const [addTimestamps, setAddTimestamps] = useState<boolean>(initialData?.addTimestamps ?? false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ input, provider, useMapAttributes, addTimestamps });
  }, [input, provider, useMapAttributes, addTimestamps, onStateChange]);

  const toPascalCase = (str: string): string => {
    const cleaned = str.replace(/[^a-zA-Z0-9]/g, ' ');
    const result = cleaned
      .split(/\s+/)
      .filter(Boolean)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
    return result || 'Model';
  };

  const toCamelCase = (str: string): string => {
    const pascal = toPascalCase(str);
    return pascal.charAt(0).toLowerCase() + pascal.slice(1);
  };

  const PRESETS = {
    ecommerce: `-- E-Commerce Database Schema
CREATE TABLE categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  parent_id INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES categories(id)
);

CREATE TABLE products (
  product_id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  sku VARCHAR(50) UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  category_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);`,
    user_auth: `-- User Authentication & Roles Schema
CREATE TABLE users (
  user_id UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100),
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_roles (
  user_id UUID NOT NULL,
  role_name VARCHAR(50) NOT NULL,
  PRIMARY KEY (user_id, role_name),
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);`,
    blog: `-- Blog Posts & Comments
CREATE TABLE authors (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  bio TEXT
);

CREATE TABLE posts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  author_id INT NOT NULL,
  published_at TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES authors(id)
);

CREATE TABLE comments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  body TEXT NOT NULL,
  post_id INT NOT NULL,
  author_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id),
  FOREIGN KEY (author_id) REFERENCES authors(id)
);`
  };

  const mapSqlTypeToPrisma = (sqlType: string): string => {
    const type = sqlType.toUpperCase();

    if (type.includes('BIGINT') || type.includes('BIGSERIAL')) {
      return 'BigInt';
    }
    if (type.includes('INT') || type.includes('SERIAL') || type.includes('INTEGER') || type.includes('SMALLINT') || type.includes('TINYINT')) {
      return 'Int';
    }
    if (type.includes('BOOL') || type.includes('BIT')) {
      return 'Boolean';
    }
    if (type.includes('DECIMAL') || type.includes('NUMERIC') || type.includes('MONEY')) {
      return 'Decimal';
    }
    if (type.includes('FLOAT') || type.includes('DOUBLE') || type.includes('REAL')) {
      return 'Float';
    }
    if (type.includes('DATE') || type.includes('TIME') || type.includes('TIMESTAMP')) {
      return 'DateTime';
    }
    if (type.includes('JSON') || type.includes('JSONB')) {
      return 'Json';
    }
    if (type.includes('BLOB') || type.includes('BYTEA') || type.includes('BINARY') || type.includes('VARBINARY')) {
      return 'Bytes';
    }
    return 'String';
  };

  const parseSqlDDL = useCallback(() => {
    if (!input.trim()) {
      setOutput('');
      setError(null);
      return;
    }

    if (input.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
      setOutput('');
      return;
    }

    try {
      // Strip comments
      const cleanInput = input
        .replace(/--.*$/gm, '')
        .replace(/\/\*[\s\S]*?\*\//g, '');

      const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:["`]?(\w+)["`]?\.)?["`]?(\w+)["`]?\s*\(([\s\S]*?)\);/gi;
      let match;
      const parsedTables: ParsedTable[] = [];

      while ((match = tableRegex.exec(cleanInput)) !== null) {
        const rawTableName = match[2];
        const columnsContent = match[3];
        const modelName = toPascalCase(rawTableName);

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

        const columns: ParsedColumn[] = [];
        const primaryKeys: string[] = [];
        const tableForeignKeys: { colName: string; targetTable: string; targetCol: string }[] = [];

        // First pass: extract constraints
        columnLines.forEach(line => {
          const upper = line.toUpperCase();

          if (upper.startsWith('PRIMARY KEY')) {
            const pkMatch = line.match(/PRIMARY\s+KEY\s*\(([^)]+)\)/i);
            if (pkMatch) {
              const keys = pkMatch[1].split(',').map(k => k.trim().replace(/["`']/g, ''));
              primaryKeys.push(...keys);
            }
          } else if (upper.startsWith('FOREIGN KEY')) {
            const fkMatch = line.match(/FOREIGN\s+KEY\s*\(([^)]+)\)\s*REFERENCES\s+["`]?(\w+)["`]?\s*\(([^)]+)\)/i);
            if (fkMatch) {
              const colName = fkMatch[1].trim().replace(/["`']/g, '');
              const targetTable = fkMatch[2].trim();
              const targetCol = fkMatch[3].trim().replace(/["`']/g, '');
              tableForeignKeys.push({ colName, targetTable, targetCol });
            }
          }
        });

        // Second pass: parse columns
        columnLines.forEach(line => {
          const upperLine = line.toUpperCase();
          if (upperLine.startsWith('PRIMARY KEY') ||
              upperLine.startsWith('CONSTRAINT') ||
              upperLine.startsWith('UNIQUE') ||
              upperLine.startsWith('FOREIGN KEY') ||
              upperLine.startsWith('INDEX') ||
              upperLine.startsWith('KEY')) {
            return;
          }

          let rawColName = '';
          let sqlType = '';

          if (line.startsWith('"') || line.startsWith('`') || line.startsWith("'")) {
            const quote = line[0];
            let i = 1;
            while (i < line.length && (line[i] !== quote || line[i - 1] === '\\')) {
              rawColName += line[i];
              i++;
            }
            const remaining = line.substring(i + 1).trim();
            sqlType = remaining.split(/\s+/)[0];
          } else {
            const parts = line.split(/\s+/);
            rawColName = parts[0];
            sqlType = parts[1];
          }

          if (!rawColName) return;

          const isInlinePk = upperLine.includes('PRIMARY KEY');
          if (isInlinePk && !primaryKeys.includes(rawColName)) {
            primaryKeys.push(rawColName);
          }

          const isNotNull = upperLine.includes('NOT NULL');
          const isNullable = !isNotNull && !isInlinePk;
          const isUnique = upperLine.includes('UNIQUE');
          const isAutoIncrement = upperLine.includes('AUTO_INCREMENT') || upperLine.includes('AUTOINCREMENT') || upperLine.includes('SERIAL');
          const isUuid = upperLine.includes('UUID') || upperLine.includes('GEN_RANDOM_UUID') || upperLine.includes('UUID_GENERATE_V4');

          let defaultValue: string | undefined = undefined;
          const defaultMatch = line.match(/DEFAULT\s+([^,\s]+(?:\([^)]*\))?)/i);
          if (defaultMatch) {
            defaultValue = defaultMatch[1].replace(/['"]/g, '');
          }

          let fkInfo = tableForeignKeys.find(fk => fk.colName === rawColName);
          if (!fkInfo && upperLine.includes('REFERENCES')) {
            const inlineFkMatch = line.match(/REFERENCES\s+["`]?(\w+)["`]?\s*\(([^)]+)\)/i);
            if (inlineFkMatch) {
              fkInfo = {
                colName: rawColName,
                targetTable: inlineFkMatch[1].trim(),
                targetCol: inlineFkMatch[2].trim().replace(/["`']/g, '')
              };
            }
          }

          columns.push({
            name: rawColName,
            pascalName: toPascalCase(rawColName),
            camelName: toCamelCase(rawColName),
            sqlType: sqlType || 'VARCHAR',
            prismaType: mapSqlTypeToPrisma(sqlType || 'VARCHAR'),
            isPrimaryKey: isInlinePk || primaryKeys.includes(rawColName),
            isNullable,
            isUnique,
            defaultValue,
            isAutoIncrement,
            isUuid,
            foreignKey: fkInfo ? { targetTable: fkInfo.targetTable, targetColumn: fkInfo.targetCol } : undefined
          });
        });

        parsedTables.push({
          tableName: rawTableName,
          modelName,
          columns,
          primaryKeys
        });
      }

      if (parsedTables.length === 0) {
        setError(t('sqltoprisma.no_tables_found', 'No valid CREATE TABLE DDL statements found.'));
        setOutput('');
        return;
      }

      // Build Prisma Schema output
      let schemaStr = `datasource db {\n  provider = "${provider}"\n  url      = env("DATABASE_URL")\n}\n\ngenerator client {\n  provider = "prisma-client-js"\n}\n\n`;

      parsedTables.forEach(table => {
        schemaStr += `model ${table.modelName} {\n`;

        table.columns.forEach(col => {
          const fieldName = useMapAttributes ? col.camelName : col.name;
          const mapAttr = (useMapAttributes && col.camelName !== col.name) ? ` @map("${col.name}")` : '';

          let typeStr = col.prismaType;
          if (col.isNullable && !col.isPrimaryKey) {
            typeStr += '?';
          }

          let attrs = '';
          if (col.isPrimaryKey && table.primaryKeys.length === 1) {
            attrs += ' @id';
            if (col.isAutoIncrement || col.sqlType.toUpperCase().includes('SERIAL')) {
              attrs += ' @default(autoincrement())';
            } else if (col.isUuid || (col.defaultValue && col.defaultValue.toUpperCase().includes('UUID'))) {
              attrs += ' @default(uuid())';
            }
          }

          if (col.isUnique && !col.isPrimaryKey) {
            attrs += ' @unique';
          }

          if (col.defaultValue && !attrs.includes('@default')) {
            const defUpper = col.defaultValue.toUpperCase();
            if (defUpper.includes('CURRENT_TIMESTAMP') || defUpper.includes('NOW()')) {
              attrs += ' @default(now())';
            } else if (defUpper === 'TRUE' || defUpper === 'FALSE') {
              attrs += ` @default(${defUpper.toLowerCase()})`;
            } else if (!isNaN(Number(col.defaultValue))) {
              attrs += ` @default(${col.defaultValue})`;
            } else if (defUpper !== 'NULL') {
              attrs += ` @default("${col.defaultValue}")`;
            }
          }

          schemaStr += `  ${fieldName} ${typeStr}${attrs}${mapAttr}\n`;

          // Add relation field if foreign key is defined
          if (col.foreignKey) {
            const targetModel = toPascalCase(col.foreignKey.targetTable);
            const relationFieldName = toCamelCase(col.foreignKey.targetTable);
            const targetColCamel = toCamelCase(col.foreignKey.targetColumn);
            schemaStr += `  ${relationFieldName} ${targetModel} @relation(fields: [${fieldName}], references: [${targetColCamel}])\n`;
          }
        });

        if (addTimestamps && !table.columns.some(c => c.name.toLowerCase() === 'created_at' || c.name.toLowerCase() === 'createdat')) {
          schemaStr += `  createdAt DateTime @default(now())\n`;
          schemaStr += `  updatedAt DateTime @updatedAt\n`;
        }

        if (table.primaryKeys.length > 1) {
          const pkFields = table.primaryKeys.map(k => useMapAttributes ? toCamelCase(k) : k).join(', ');
          schemaStr += `\n  @@id([${pkFields}])\n`;
        }

        if (useMapAttributes && table.modelName.toLowerCase() !== table.tableName.toLowerCase()) {
          schemaStr += `  @@map("${table.tableName}")\n`;
        }

        schemaStr += `}\n\n`;
      });

      setOutput(schemaStr.trim());
      setError(null);
    } catch (e: any) {
      setError(t('sqltoprisma.error_parsing', 'Error parsing SQL DDL') + ': ' + e.message);
      setOutput('');
    }
  }, [input, provider, useMapAttributes, addTimestamps, t]);

  useEffect(() => {
    parseSqlDDL();
  }, [parseSqlDDL]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success(t('common.copied', 'Copied to clipboard!'));
    setTimeout(() => setCopied(false), 2000);
  }, [output, t]);

  const handleClear = useCallback(() => {
    setInput('');
    setOutput('');
    setError(null);
    toast.success(t('common.cleared', 'Cleared!'));
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [t]);

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'schema.prisma';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(t('sqltoprisma.downloaded', 'Downloaded schema.prisma!'));
  };

  const loadPreset = (presetKey: keyof typeof PRESETS) => {
    setInput(PRESETS[presetKey]);
    toast.success(t('sqltoprisma.preset_loaded', 'Loaded SQL preset!'));
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
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Presets Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" aria-hidden="true" />
          <span className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('sqltoprisma.presets_title', 'Clickable SQL Presets')}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => loadPreset('ecommerce')}
            className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 rounded-xl transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
          >
            {t('sqltoprisma.preset_ecommerce', 'E-Commerce Database')}
          </button>
          <button
            onClick={() => loadPreset('user_auth')}
            className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 rounded-xl transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
          >
            {t('sqltoprisma.preset_user_auth', 'User Auth & Roles')}
          </button>
          <button
            onClick={() => loadPreset('blog')}
            className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 rounded-xl transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
          >
            {t('sqltoprisma.preset_blog', 'Blog & Comments')}
          </button>
        </div>
      </div>

      {/* Options Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-5 bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="space-y-1.5">
          <label htmlFor="sql-prisma-provider" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('sqltoprisma.provider', 'Database Provider')}
          </label>
          <select
            id="sql-prisma-provider"
            value={provider}
            onChange={(e) => setProvider(e.target.value as Provider)}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="postgresql">PostgreSQL</option>
            <option value="mysql">MySQL</option>
            <option value="sqlite">SQLite</option>
            <option value="sqlserver">SQL Server</option>
            <option value="cockroachdb">CockroachDB</option>
          </select>
        </div>

        <div className="flex items-center gap-3 pt-6">
          <input
            id="use-map-attributes"
            type="checkbox"
            checked={useMapAttributes}
            onChange={(e) => setUseMapAttributes(e.target.checked)}
            className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
          />
          <label htmlFor="use-map-attributes" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
            {t('sqltoprisma.use_map', 'Add @map and @@map attributes for snake_case names')}
          </label>
        </div>

        <div className="flex items-center gap-3 pt-6">
          <input
            id="add-timestamps"
            type="checkbox"
            checked={addTimestamps}
            onChange={(e) => setAddTimestamps(e.target.checked)}
            className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
          />
          <label htmlFor="add-timestamps" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
            {t('sqltoprisma.add_timestamps', 'Add createdAt & updatedAt fields automatically')}
          </label>
        </div>
      </div>

      {/* Editor Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-500" aria-hidden="true" />
              <label htmlFor="sql-prisma-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('sqltoprisma.sql_input_label', 'SQL CREATE TABLE DDL')}
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
            id="sql-prisma-input"
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('sqltoprisma.placeholder_sql', 'Paste SQL CREATE TABLE statements here...')}
            className="w-full h-[450px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-500" aria-hidden="true" />
              <label htmlFor="prisma-schema-output" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('sqltoprisma.output_label', 'Generated schema.prisma')}
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
            id="prisma-schema-output"
            value={output}
            readOnly
            placeholder={t('sqltoprisma.placeholder_output', 'Prisma Schema models will appear here...')}
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
          <h4 className="font-bold dark:text-white">{t('sqltoprisma.about_title', 'About SQL to Prisma Converter')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('sqltoprisma.about_text', 'Convert SQL DDL CREATE TABLE queries directly into fully configured Prisma Schema models. The parser handles table mapping, column type inference, primary keys, foreign keys, relationships, default values, and unique constraints for PostgreSQL, MySQL, SQLite, and SQL Server databases.')}
          </p>
        </div>
      </div>
    </div>
  );
}
