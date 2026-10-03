import { useState, useEffect, useCallback, useRef } from 'react';
import { Database, Copy, Check, Trash2, AlertCircle, Download, Info, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;

type SqlDialect = 'postgresql' | 'mysql' | 'sqlite' | 'sqlserver';
type FieldCasing = 'snake_case' | 'camelCase' | 'PascalCase' | 'original';

const SQL_RESERVED_KEYWORDS = new Set([
  'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'FROM', 'WHERE', 'AND', 'OR', 'NOT',
  'CREATE', 'TABLE', 'DROP', 'ALTER', 'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES',
  'INDEX', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'FULL', 'ON', 'AS', 'IN',
  'IS', 'NULL', 'DEFAULT', 'CHECK', 'CONSTRAINT', 'UNIQUE', 'ORDER', 'BY', 'GROUP',
  'HAVING', 'LIMIT', 'OFFSET', 'UNION', 'ALL', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END',
  'INTO', 'VALUES', 'SET', 'USER', 'ROLE', 'ORDER', 'GROUP', 'DATABASE', 'SCHEMA', 'TYPE'
]);

export function GraphQLToSQL({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState(initialData?.input || '');
  const [output, setOutput] = useState(initialData?.output || '');
  const [dialect, setDialect] = useState<SqlDialect>(initialData?.dialect || 'postgresql');
  const [fieldCasing, setFieldCasing] = useState<FieldCasing>(initialData?.fieldCasing || 'snake_case');
  const [idType, setIdType] = useState<'bigint' | 'uuid' | 'text'>(initialData?.idType || 'bigint');
  const [generateForeignKeys, setGenerateForeignKeys] = useState<boolean>(initialData?.generateForeignKeys !== false);
  const [useQuotedIdentifiers, setUseQuotedIdentifiers] = useState<boolean>(initialData?.useQuotedIdentifiers || false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ input, output, dialect, fieldCasing, idType, generateForeignKeys, useQuotedIdentifiers });
  }, [input, output, dialect, fieldCasing, idType, generateForeignKeys, useQuotedIdentifiers, onStateChange]);

  const PRESETS = {
    ecommerce: `# E-Commerce Schema
type Category {
  id: ID!
  name: String!
  slug: String!
  parent: Category
}

type Product {
  id: ID!
  title: String!
  description: String
  price: Float!
  sku: String!
  isActive: Boolean!
  category: Category!
  tags: [String!]!
  createdAt: DateTime!
}

input CreateProductInput {
  title: String!
  description: String
  price: Float!
  categoryId: ID!
  tags: [String!]
}

enum OrderStatus {
  PENDING
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
}`,
    user_auth: `# User Management & Auth Schema
enum Role {
  ADMIN
  MANAGER
  MEMBER
  GUEST
}

interface Node {
  id: ID!
}

type User implements Node {
  id: ID!
  email: String!
  fullName: String!
  role: Role!
  isVerified: Boolean!
  lastLogin: DateTime
  metadata: JSON
}

input RegisterUserInput {
  email: String!
  password: String!
  fullName: String!
  role: Role
}`,
    social_feed: `# Social Feed & Comments Schema
type User {
  id: ID!
  username: String!
  avatarUrl: String
}

type Comment {
  id: ID!
  author: User!
  content: String!
  createdAt: DateTime!
  likesCount: Int!
}

type Post {
  id: ID!
  author: User!
  title: String!
  body: String!
  comments: [Comment!]!
  isPublished: Boolean!
}`
  };

  const applyCasing = (str: string, casing: FieldCasing): string => {
    if (casing === 'original') return str;

    // Split on camelCase boundaries or underscores/dashes
    const words = str
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/[-_]+/g, ' ')
      .trim()
      .split(/\s+/);

    if (words.length === 0 || !words[0]) return str;

    if (casing === 'snake_case') {
      return words.map(w => w.toLowerCase()).join('_');
    }
    if (casing === 'camelCase') {
      return words[0].toLowerCase() + words.slice(1).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
    }
    if (casing === 'PascalCase') {
      return words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
    }

    return str;
  };

  const quoteIdentifier = (name: string, dialect: SqlDialect, forceQuote: boolean): string => {
    const uppercase = name.toUpperCase();
    const needsQuote = forceQuote || SQL_RESERVED_KEYWORDS.has(uppercase) || !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name);

    if (!needsQuote) return name;

    if (dialect === 'mysql') return `\`${name}\``;
    if (dialect === 'sqlserver') return `[${name}]`;
    return `"${name}"`;
  };

  const mapGqlTypeToSql = (
    gqlTypeStr: string,
    dialect: SqlDialect,
    customEnums: Set<string>,
    customTypes: Set<string>
  ): { sqlDataType: string; isNonNull: boolean; isArray: boolean; isForeignKey: boolean; targetTable?: string } => {
    const raw = gqlTypeStr.trim();
    const isNonNull = raw.endsWith('!');
    const typeWithoutOuterBang = isNonNull ? raw.slice(0, -1).trim() : raw;

    let isArray = false;
    let base = typeWithoutOuterBang;

    if (base.startsWith('[') && base.endsWith(']')) {
      isArray = true;
      base = base.slice(1, -1).trim();
      if (base.endsWith('!')) {
        base = base.slice(0, -1).trim();
      }
    }

    let sqlDataType = 'VARCHAR(255)';
    let isForeignKey = false;
    let targetTable: string | undefined = undefined;

    if (base === 'String') {
      sqlDataType = dialect === 'postgresql' || dialect === 'sqlite' ? 'TEXT' : 'VARCHAR(255)';
    } else if (base === 'Int') {
      sqlDataType = 'INTEGER';
    } else if (base === 'Float') {
      sqlDataType = dialect === 'postgresql' ? 'DOUBLE PRECISION' : 'DOUBLE';
    } else if (base === 'Boolean') {
      sqlDataType = dialect === 'postgresql' || dialect === 'sqlite' ? 'BOOLEAN' : (dialect === 'sqlserver' ? 'BIT' : 'TINYINT(1)');
    } else if (base === 'ID') {
      if (idType === 'bigint') {
        sqlDataType = dialect === 'postgresql' ? 'BIGINT' : 'BIGINT';
      } else if (idType === 'uuid') {
        sqlDataType = dialect === 'postgresql' ? 'UUID' : 'VARCHAR(36)';
      } else {
        sqlDataType = dialect === 'sqlite' || dialect === 'postgresql' ? 'TEXT' : 'VARCHAR(255)';
      }
    } else if (base === 'DateTime' || base === 'Timestamp') {
      sqlDataType = dialect === 'postgresql' ? 'TIMESTAMPTZ' : (dialect === 'sqlite' ? 'TEXT' : 'DATETIME');
    } else if (base === 'Date') {
      sqlDataType = 'DATE';
    } else if (base === 'Time') {
      sqlDataType = 'TIME';
    } else if (base === 'JSON' || base === 'JSONObject' || base === 'JSONSchema') {
      sqlDataType = dialect === 'postgresql' ? 'JSONB' : (dialect === 'sqlite' ? 'TEXT' : 'JSON');
    } else if (customEnums.has(base)) {
      if (dialect === 'postgresql') {
        sqlDataType = applyCasing(base, 'snake_case');
      } else if (dialect === 'mysql') {
        sqlDataType = 'VARCHAR(100)';
      } else {
        sqlDataType = 'VARCHAR(100)';
      }
    } else if (customTypes.has(base)) {
      isForeignKey = true;
      targetTable = base;
      if (idType === 'bigint') {
        sqlDataType = 'BIGINT';
      } else if (idType === 'uuid') {
        sqlDataType = dialect === 'postgresql' ? 'UUID' : 'VARCHAR(36)';
      } else {
        sqlDataType = dialect === 'sqlite' || dialect === 'postgresql' ? 'TEXT' : 'VARCHAR(255)';
      }
    }

    if (isArray) {
      if (dialect === 'postgresql') {
        sqlDataType = `${sqlDataType}[]`;
      } else {
        sqlDataType = 'TEXT'; // Fallback JSON/Comma text for array in MySQL/SQLite
      }
    }

    return { sqlDataType, isNonNull, isArray, isForeignKey, targetTable };
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

      // Strip GraphQL comments
      const cleanInput = input
        .replace(/#.*$/gm, '')
        .replace(/"""[\s\S]*?"""/g, '')
        .replace(/"[\s\S]*?"/g, (m: string) => m.includes('\n') ? '""' : m);

      // First pass: collect enums and type names
      const customEnums = new Set<string>();
      const customTypes = new Set<string>();

      const enumRegexPass = /enum\s+([A-Za-z0-9_]+)/g;
      let enumPassMatch: RegExpExecArray | null;
      while ((enumPassMatch = enumRegexPass.exec(cleanInput)) !== null) {
        if (enumPassMatch[1]) customEnums.add(enumPassMatch[1]);
      }

      const structRegexPass = /(type|input)\s+([A-Za-z0-9_]+)/g;
      let structPassMatch: RegExpExecArray | null;
      while ((structPassMatch = structRegexPass.exec(cleanInput)) !== null) {
        if (structPassMatch[2]) customTypes.add(structPassMatch[2]);
      }

      const outputStatements: string[] = [];

      // 1. Process Enums for PostgreSQL
      if (dialect === 'postgresql') {
        const enumRegex = /enum\s+([A-Za-z0-9_]+)\s*\{([^}]*)\}/g;
        let enumMatch: RegExpExecArray | null;
        while ((enumMatch = enumRegex.exec(cleanInput)) !== null) {
          const enumName = enumMatch[1];
          const enumValues = enumMatch[2]
            .split(/\s+/)
            .map(v => v.trim())
            .filter(Boolean);

          const formattedEnumName = quoteIdentifier(applyCasing(enumName, 'snake_case'), dialect, useQuotedIdentifiers);
          const formattedValues = enumValues.map(v => `'${v}'`).join(', ');

          outputStatements.push(`CREATE TYPE ${formattedEnumName} AS ENUM (${formattedValues});`);
        }
      }

      // 2. Process Object Types & Inputs
      const structRegex = /(type|input)\s+([A-Za-z0-9_]+)(?:\s+implements\s+[^{]+)?\s*\{([^}]*)\}/g;
      let structMatch: RegExpExecArray | null;

      while ((structMatch = structRegex.exec(cleanInput)) !== null) {
        const kind = structMatch[1]; // type or input
        const rawTypeName = structMatch[2];
        const body = structMatch[3];

        const tableName = quoteIdentifier(applyCasing(rawTypeName, 'snake_case'), dialect, useQuotedIdentifiers);

        const lines = body
          .split('\n')
          .map(l => l.trim())
          .filter(l => l && !l.startsWith('#'));

        const columnDefs: string[] = [];
        const foreignKeyConstraints: string[] = [];

        // Track primary key
        let hasPrimaryKey = false;

        lines.forEach(line => {
          const cleanLine = line.replace(/\([^)]*\)/, '');
          const colonIdx = cleanLine.indexOf(':');
          if (colonIdx === -1) return;

          const rawFieldName = cleanLine.substring(0, colonIdx).trim();
          const rawTypeStr = cleanLine.substring(colonIdx + 1).trim();

          if (!rawFieldName || !rawTypeStr) return;

          const fieldNameCased = applyCasing(rawFieldName, fieldCasing);
          const columnName = quoteIdentifier(fieldNameCased, dialect, useQuotedIdentifiers);

          const { sqlDataType, isNonNull, isForeignKey, targetTable } = mapGqlTypeToSql(
            rawTypeStr,
            dialect,
            customEnums,
            customTypes
          );

          let columnLine = `  ${columnName} ${sqlDataType}`;

          if (rawFieldName === 'id') {
            hasPrimaryKey = true;
            if (dialect === 'postgresql') {
              if (idType === 'bigint') {
                columnLine = `  ${columnName} BIGSERIAL PRIMARY KEY`;
              } else {
                columnLine = `  ${columnName} ${sqlDataType} PRIMARY KEY`;
              }
            } else if (dialect === 'mysql') {
              if (idType === 'bigint') {
                columnLine = `  ${columnName} BIGINT AUTO_INCREMENT PRIMARY KEY`;
              } else {
                columnLine = `  ${columnName} ${sqlDataType} PRIMARY KEY`;
              }
            } else if (dialect === 'sqlite') {
              if (idType === 'bigint') {
                columnLine = `  ${columnName} INTEGER PRIMARY KEY AUTOINCREMENT`;
              } else {
                columnLine = `  ${columnName} ${sqlDataType} PRIMARY KEY`;
              }
            } else if (dialect === 'sqlserver') {
              if (idType === 'bigint') {
                columnLine = `  ${columnName} BIGINT IDENTITY(1,1) PRIMARY KEY`;
              } else {
                columnLine = `  ${columnName} ${sqlDataType} PRIMARY KEY`;
              }
            }
          } else {
            if (isNonNull) {
              columnLine += ' NOT NULL';
            }

            if (generateForeignKeys && isForeignKey && targetTable) {
              const targetTableName = quoteIdentifier(applyCasing(targetTable, 'snake_case'), dialect, useQuotedIdentifiers);
              const targetIdCol = quoteIdentifier('id', dialect, useQuotedIdentifiers);
              foreignKeyConstraints.push(
                `  FOREIGN KEY (${columnName}) REFERENCES ${targetTableName}(${targetIdCol}) ON DELETE SET NULL`
              );
            }
          }

          columnDefs.push(columnLine);
        });

        if (columnDefs.length === 0) return;

        const allDefinitions = [...columnDefs, ...foreignKeyConstraints];
        let createTableStmt = `CREATE TABLE ${tableName} (\n${allDefinitions.join(',\n')}\n);`;

        outputStatements.push(createTableStmt);
      }

      if (outputStatements.length === 0) {
        setError(t('graphqltosql.no_types_found', 'No valid GraphQL object types or inputs found.'));
        setOutput('');
        return;
      }

      setOutput(outputStatements.join('\n\n'));
      setError('');
    } catch (e: any) {
      setError(t('graphqltosql.error_parsing', 'Error parsing GraphQL schema') + ': ' + e.message);
      setOutput('');
    }
  }, [input, dialect, fieldCasing, idType, generateForeignKeys, useQuotedIdentifiers, t]);

  useEffect(() => {
    handleConvert();
  }, [handleConvert]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success(t('graphqltosql.toast_copied', 'SQL DDL queries copied to clipboard!'));
    setTimeout(() => setCopied(false), 2000);
  }, [output, t]);

  const handleClear = useCallback(() => {
    setInput('');
    setOutput('');
    setError('');
    toast.success(t('graphqltosql.toast_cleared', 'Inputs cleared!'));
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [t]);

  const handleDownload = () => {
    if (!output) return;
    const ext = dialect === 'postgresql' ? 'pg.sql' : `${dialect}.sql`;
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `schema.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(t('common.downloaded', 'Downloaded SQL schema file!'));
  };

  const loadPreset = (presetKey: keyof typeof PRESETS) => {
    setInput(PRESETS[presetKey]);
    toast.success(t('graphqltosql.preset_loaded', 'Loaded GraphQL preset!'));
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
            {t('graphqltosql.presets_title', 'Quick Start Presets:')}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => loadPreset('ecommerce')}
            className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 rounded-xl transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
          >
            {t('graphqltosql.preset_ecommerce', 'E-Commerce Catalog')}
          </button>
          <button
            onClick={() => loadPreset('user_auth')}
            className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 rounded-xl transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
          >
            {t('graphqltosql.preset_user_auth', 'User Management & Auth')}
          </button>
          <button
            onClick={() => loadPreset('social_feed')}
            className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 rounded-xl transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
          >
            {t('graphqltosql.preset_social_feed', 'Social Feed & Comments')}
          </button>
        </div>
      </div>

      {/* Options Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-5 bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="space-y-1.5">
          <label htmlFor="sql-dialect" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('graphqltosql.sql_dialect', 'SQL Dialect')}
          </label>
          <select
            id="sql-dialect"
            value={dialect}
            onChange={(e) => setDialect(e.target.value as SqlDialect)}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="postgresql">PostgreSQL</option>
            <option value="mysql">MySQL</option>
            <option value="sqlite">SQLite</option>
            <option value="sqlserver">SQL Server (TSQL)</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="field-casing" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('graphqltosql.field_casing', 'Column Casing')}
          </label>
          <select
            id="field-casing"
            value={fieldCasing}
            onChange={(e) => setFieldCasing(e.target.value as FieldCasing)}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="snake_case">snake_case (default)</option>
            <option value="camelCase">camelCase</option>
            <option value="PascalCase">PascalCase</option>
            <option value="original">Original</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="id-type" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('graphqltosql.id_type', 'ID Primary Key Type')}
          </label>
          <select
            id="id-type"
            value={idType}
            onChange={(e) => setIdType(e.target.value as any)}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="bigint">BIGINT / BIGSERIAL / AUTO_INCREMENT</option>
            <option value="uuid">UUID / CHAR(36)</option>
            <option value="text">TEXT / VARCHAR(255)</option>
          </select>
        </div>

        <div className="flex flex-col justify-center space-y-2 pt-2 col-span-1 md:col-span-2 lg:col-span-1">
          <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={generateForeignKeys}
              onChange={(e) => setGenerateForeignKeys(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
            {t('graphqltosql.generate_fk', 'Foreign Key Constraints')}
          </label>
          <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={useQuotedIdentifiers}
              onChange={(e) => setUseQuotedIdentifiers(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
            {t('graphqltosql.quoted_identifiers', 'Quote Identifiers')}
          </label>
        </div>
      </div>

      {/* Editor Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-500" aria-hidden="true" />
              <label htmlFor="graphql-sql-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('graphqltosql.graphql_input_label', 'GraphQL SDL Schema')}
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
            id="graphql-sql-input"
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('graphqltosql.placeholder_graphql', 'Paste GraphQL SDL schema here...')}
            className="w-full h-[450px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-500" aria-hidden="true" />
              <label htmlFor="sql-output" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('graphqltosql.output_label', 'SQL CREATE TABLE DDL')}
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
            id="sql-output"
            value={output}
            readOnly
            placeholder={t('graphqltosql.placeholder_output', 'SQL CREATE TABLE queries will appear here...')}
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
          <h4 className="font-bold dark:text-white">{t('graphqltosql.about_title', 'About GraphQL SDL to SQL Converter')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('graphqltosql.about_text', 'Convert GraphQL Schema Definition Language (SDL) types and input definitions directly into strongly-typed SQL CREATE TABLE DDL queries for PostgreSQL, MySQL, SQLite, and SQL Server.')}
          </p>
        </div>
      </div>
    </div>
  );
}
