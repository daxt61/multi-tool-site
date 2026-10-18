import { useState, useEffect, useCallback, useRef } from 'react';
import { Database, Copy, Check, Trash2, AlertCircle, Download, Info, Sparkles, FileCode } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;

type Dialect = 'pg' | 'mysql' | 'sqlite';
type CasingStyle = 'original' | 'camelCase' | 'snake_case' | 'PascalCase';

const JS_RESERVED_KEYWORDS = new Set([
  'abstract', 'arguments', 'await', 'boolean', 'break', 'byte', 'case', 'catch',
  'char', 'class', 'const', 'continue', 'debugger', 'default', 'delete', 'do',
  'double', 'else', 'enum', 'eval', 'export', 'extends', 'false', 'final',
  'finally', 'float', 'for', 'function', 'goto', 'if', 'implements', 'import',
  'in', 'instanceof', 'int', 'interface', 'let', 'long', 'native', 'new',
  'null', 'package', 'private', 'protected', 'public', 'return', 'short', 'static',
  'super', 'switch', 'synchronized', 'this', 'throw', 'throws', 'transient',
  'true', 'try', 'typeof', 'var', 'void', 'volatile', 'while', 'with', 'yield'
]);

const escapeJsString = (str: string): string => {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
};

const transformCasing = (str: string, casing: CasingStyle): string => {
  if (casing === 'original') return str;

  const words = str
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
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
  if (JS_RESERVED_KEYWORDS.has(name) || !/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name)) {
    return JSON.stringify(name);
  }
  return name;
};

export function GraphQLToDrizzle({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState(initialData?.input || '');
  const [output, setOutput] = useState(initialData?.output || '');
  const [dialect, setDialect] = useState<Dialect>(initialData?.dialect || 'pg');
  const [casing, setCasing] = useState<CasingStyle>(initialData?.casing || 'camelCase');
  const [idType, setIdType] = useState<'serial' | 'uuid' | 'varchar'>(initialData?.idType || 'serial');
  const [includeImports, setIncludeImports] = useState(initialData?.includeImports !== false);
  const [exportTypes, setExportTypes] = useState(initialData?.exportTypes || false);
  const [useExport, setUseExport] = useState(initialData?.useExport !== false);
  const [activePresetId, setActivePresetId] = useState<string | null>(initialData?.activePresetId || null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ input, output, dialect, casing, idType, includeImports, exportTypes, useExport, activePresetId });
  }, [input, output, dialect, casing, idType, includeImports, exportTypes, useExport, activePresetId, onStateChange]);

  const PRESETS = {
    ecommerce: `# E-Commerce Catalog Schema
type Category {
  id: ID!
  name: String!
  slug: String!
  parentId: ID
}

type Product {
  id: ID!
  title: String!
  description: String
  price: Float!
  sku: String!
  isActive: Boolean!
  categoryId: ID!
  createdAt: DateTime!
}

input CreateProductInput {
  title: String!
  description: String
  price: Float!
  categoryId: ID!
}

enum OrderStatus {
  PENDING
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
}`,
    user_auth: `# User Authentication & Roles Schema
enum Role {
  ADMIN
  MANAGER
  MEMBER
  GUEST
}

type User {
  id: ID!
  email: String!
  fullName: String!
  role: Role!
  isVerified: Boolean!
  lastLogin: DateTime
  loginCount: Int
}

type UserRole {
  userId: ID!
  roleId: ID!
  assignedAt: DateTime!
}`,
    blog: `# Blog Posts & Comments Schema
type Post {
  id: ID!
  title: String!
  content: String!
  authorEmail: String!
  publishedAt: DateTime
  viewCount: Int!
  isDraft: Boolean!
}

type Comment {
  id: ID!
  postId: ID!
  authorName: String!
  commentText: String!
  createdAt: DateTime!
}`
  };

  const mapGqlTypeToDrizzle = (
    gqlTypeStr: string,
    rawColName: string,
    selectedDialect: Dialect,
    enumNames: Set<string>
  ): { drizzleFn: string; drizzleModuleImport: string; isArray: boolean; isNonNull: boolean } => {
    const raw = gqlTypeStr.trim();
    const isNonNull = raw.endsWith('!');
    const typeWithoutOuterBang = isNonNull ? raw.slice(0, -1).trim() : raw;
    const isArray = typeWithoutOuterBang.startsWith('[') && typeWithoutOuterBang.endsWith(']');
    const baseType = isArray ? typeWithoutOuterBang.slice(1, -1).replace(/!$/, '').trim() : typeWithoutOuterBang;

    if (baseType === 'ID') {
      if (idType === 'serial') {
        if (selectedDialect === 'pg') return { drizzleFn: 'serial', drizzleModuleImport: 'serial', isArray, isNonNull };
        if (selectedDialect === 'mysql') return { drizzleFn: 'int', drizzleModuleImport: 'int', isArray, isNonNull };
        return { drizzleFn: 'integer', drizzleModuleImport: 'integer', isArray, isNonNull };
      }
      if (idType === 'uuid') {
        if (selectedDialect === 'pg') return { drizzleFn: 'uuid', drizzleModuleImport: 'uuid', isArray, isNonNull };
        return { drizzleFn: 'varchar', drizzleModuleImport: 'varchar', isArray, isNonNull };
      }
      return { drizzleFn: 'varchar', drizzleModuleImport: 'varchar', isArray, isNonNull };
    }

    if (baseType === 'String') {
      return { drizzleFn: 'text', drizzleModuleImport: 'text', isArray, isNonNull };
    }
    if (baseType === 'Int') {
      if (selectedDialect === 'mysql') return { drizzleFn: 'int', drizzleModuleImport: 'int', isArray, isNonNull };
      return { drizzleFn: 'integer', drizzleModuleImport: 'integer', isArray, isNonNull };
    }
    if (baseType === 'Float') {
      if (selectedDialect === 'pg') return { drizzleFn: 'real', drizzleModuleImport: 'real', isArray, isNonNull };
      if (selectedDialect === 'mysql') return { drizzleFn: 'float', drizzleModuleImport: 'float', isArray, isNonNull };
      return { drizzleFn: 'real', drizzleModuleImport: 'real', isArray, isNonNull };
    }
    if (baseType === 'Boolean') {
      return { drizzleFn: 'boolean', drizzleModuleImport: 'boolean', isArray, isNonNull };
    }
    if (baseType === 'DateTime' || baseType === 'Date' || baseType === 'Timestamp') {
      if (selectedDialect === 'pg') return { drizzleFn: 'timestamp', drizzleModuleImport: 'timestamp', isArray, isNonNull };
      if (selectedDialect === 'mysql') return { drizzleFn: 'datetime', drizzleModuleImport: 'datetime', isArray, isNonNull };
      return { drizzleFn: 'text', drizzleModuleImport: 'text', isArray, isNonNull };
    }
    if (baseType === 'JSON' || baseType === 'JSONObject') {
      if (selectedDialect === 'pg') return { drizzleFn: 'jsonb', drizzleModuleImport: 'jsonb', isArray, isNonNull };
      if (selectedDialect === 'mysql') return { drizzleFn: 'json', drizzleModuleImport: 'json', isArray, isNonNull };
      return { drizzleFn: 'text', drizzleModuleImport: 'text', isArray, isNonNull };
    }

    if (enumNames.has(baseType)) {
      if (selectedDialect === 'pg') return { drizzleFn: transformCasing(baseType, 'camelCase') + 'Enum', drizzleModuleImport: 'pgEnum', isArray, isNonNull };
      if (selectedDialect === 'mysql') return { drizzleFn: 'mysqlEnum', drizzleModuleImport: 'mysqlEnum', isArray, isNonNull };
      return { drizzleFn: 'text', drizzleModuleImport: 'text', isArray, isNonNull };
    }

    // Default fallback
    return { drizzleFn: 'text', drizzleModuleImport: 'text', isArray, isNonNull };
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
        setOutput('');
        return;
      }

      // Strip GraphQL comments
      const cleanInput = input
        .replace(/#.*$/gm, '')
        .replace(/"""[\s\S]*?"""/g, '')
        .replace(/"[\s\S]*?"/g, (m: string) => m.includes('\n') ? '""' : m);

      // Collect Enums
      const enumNames = new Set<string>();
      const enumMap = Object.create(null);
      const enumRegex = /enum\s+([A-Za-z0-9_]+)\s*\{([^}]*)\}/g;
      let enumMatch: RegExpExecArray | null;
      while ((enumMatch = enumRegex.exec(cleanInput)) !== null) {
        const enumName = enumMatch[1];
        const enumValues = enumMatch[2]
          .split(/\s+/)
          .map(v => v.trim())
          .filter(Boolean);
        if (enumValues.length > 0) {
          enumNames.add(enumName);
          enumMap[enumName] = enumValues;
        }
      }

      const structRegex = /(type|interface|input)\s+([A-Za-z0-9_]+)(?:\s+implements\s+[^{]+)?\s*\{([^}]*)\}/g;
      let structMatch: RegExpExecArray | null;

      const requiredImports = new Set<string>();
      const tableFnName = dialect === 'pg' ? 'pgTable' : dialect === 'mysql' ? 'mysqlTable' : 'sqliteTable';
      requiredImports.add(tableFnName);

      const generatedTables: {
        tableName: string;
        varName: string;
        typeName: string;
        columns: { keyStr: string; expr: string }[];
      }[] = [];

      const enumCodeBlocks: string[] = [];

      // Generate Enum Definitions
      Object.keys(enumMap).forEach(enumName => {
        const values = enumMap[enumName] as string[];
        const valuesFormatted = values.map(v => `'${escapeJsString(v)}'`).join(', ');
        const enumVarName = transformCasing(enumName, 'camelCase') + 'Enum';

        if (dialect === 'pg') {
          requiredImports.add('pgEnum');
          const sqlEnumName = transformCasing(enumName, 'snake_case');
          enumCodeBlocks.push(`export const ${enumVarName} = pgEnum('${escapeJsString(sqlEnumName)}', [${valuesFormatted}]);`);
        } else if (dialect === 'mysql') {
          // Handled per column in MySQL
        }
      });

      while ((structMatch = structRegex.exec(cleanInput)) !== null) {
        const constructKind = structMatch[1];
        const name = structMatch[2];
        const body = structMatch[3];

        const normalizedBody = body
          .replace(/(!|[a-zA-Z0-9_\]]+)\s+([a-zA-Z0-9_$]+)\s*:/g, '$1\n$2:')
          .trim();

        const lines = normalizedBody
          .split('\n')
          .map(l => l.trim())
          .filter(l => l && !l.startsWith('#'));

        const columns: { keyStr: string; expr: string }[] = [];

        lines.forEach(line => {
          const cleanLine = line.replace(/\([^)]*\)/, '');
          const colonIdx = cleanLine.indexOf(':');
          if (colonIdx === -1) return;

          const rawFieldName = cleanLine.substring(0, colonIdx).trim();
          const rawTypeStr = cleanLine.substring(colonIdx + 1).trim();

          if (!rawFieldName || !rawTypeStr) return;

          const propName = transformCasing(rawFieldName, casing);
          const keyStr = sanitizeIdentifier(propName);
          const sqlColName = transformCasing(rawFieldName, 'snake_case');

          const isPrimary = rawFieldName.toLowerCase() === 'id';
          const { drizzleFn, drizzleModuleImport, isNonNull } = mapGqlTypeToDrizzle(
            rawTypeStr,
            sqlColName,
            dialect,
            enumNames
          );

          if (drizzleModuleImport) {
            requiredImports.add(drizzleModuleImport);
          }

          let args = `'${escapeJsString(sqlColName)}'`;

          // Handle mysqlEnum
          const baseType = rawTypeStr.replace(/!/g, '').replace(/\[|\]/g, '').trim();
          if (dialect === 'mysql' && enumNames.has(baseType)) {
            requiredImports.add('mysqlEnum');
            const enumValues = (enumMap[baseType] as string[] || []).map(v => `'${escapeJsString(v)}'`).join(', ');
            args += `, [${enumValues}]`;
          }

          let expr = `${drizzleFn}(${args})`;

          if (isPrimary) {
            if (idType === 'serial') {
              if (dialect === 'pg') expr += '.primaryKey()';
              else if (dialect === 'mysql') expr += '.autoincrement().primaryKey()';
              else expr += '.primaryKey({ autoIncrement: true })';
            } else {
              expr += '.primaryKey()';
            }
          } else if (isNonNull) {
            expr += '.notNull()';
          }

          columns.push({ keyStr, expr });
        });

        if (columns.length > 0) {
          const sqlTableName = transformCasing(name, 'snake_case');
          const varName = transformCasing(name, 'camelCase');
          const typeName = transformCasing(name, 'PascalCase');

          generatedTables.push({
            tableName: sqlTableName,
            varName,
            typeName,
            columns
          });
        }
      }

      if (generatedTables.length === 0 && enumCodeBlocks.length === 0) {
        setError(t('graphqltodrizzle.no_types_found', 'No valid GraphQL types, interfaces, or inputs found.'));
        setOutput('');
        return;
      }

      const exportKeyword = useExport ? 'export ' : '';
      let generated = '';

      if (includeImports) {
        const packageName = dialect === 'pg' ? 'drizzle-orm/pg-core' : dialect === 'mysql' ? 'drizzle-orm/mysql-core' : 'drizzle-orm/sqlite-core';
        const sortedImports = Array.from(requiredImports).sort().join(', ');
        generated += `import { ${sortedImports} } from '${packageName}';\n`;
        if (exportTypes) {
          generated += `import { type InferSelectModel, type InferInsertModel } from 'drizzle-orm';\n`;
        }
        generated += `\n`;
      }

      if (enumCodeBlocks.length > 0) {
        generated += enumCodeBlocks.join('\n\n') + '\n\n';
      }

      generatedTables.forEach(table => {
        generated += `${exportKeyword}const ${table.varName} = ${tableFnName}('${escapeJsString(table.tableName)}', {\n`;
        table.columns.forEach(col => {
          generated += `  ${col.keyStr}: ${col.expr},\n`;
        });
        generated += `});\n\n`;

        if (exportTypes) {
          generated += `${exportKeyword}type ${table.typeName} = InferSelectModel<typeof ${table.varName}>;\n`;
          generated += `${exportKeyword}type New${table.typeName} = InferInsertModel<typeof ${table.varName}>;\n\n`;
        }
      });

      setOutput(generated.trim());
      setError('');
    } catch (e: any) {
      setError(t('graphqltodrizzle.error_parsing', 'Error parsing GraphQL SDL schema') + ': ' + e.message);
      setOutput('');
    }
  }, [input, dialect, casing, idType, includeImports, exportTypes, useExport, t]);

  useEffect(() => {
    handleConvert();
  }, [handleConvert]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success(t('graphqltodrizzle.toast_copied', 'Drizzle ORM schema copied to clipboard!'));
    setTimeout(() => setCopied(false), 2000);
  }, [output, t]);

  const handleClear = useCallback(() => {
    setInput('');
    setOutput('');
    setError('');
    setActivePresetId(null);
    toast.success(t('graphqltodrizzle.toast_cleared', 'Inputs cleared!'));
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [t]);

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/typescript' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'schema.drizzle.ts';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(t('common.downloaded', 'Downloaded schema.drizzle.ts!'));
  };

  const loadPreset = (presetKey: keyof typeof PRESETS) => {
    setInput(PRESETS[presetKey]);
    setActivePresetId(presetKey);
    toast.success(t('graphqltodrizzle.preset_loaded', 'Loaded GraphQL preset!'));
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
            {t('graphqltodrizzle.presets_title', 'Quick Start Presets:')}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            aria-pressed={activePresetId === 'ecommerce'}
            onClick={() => loadPreset('ecommerce')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
              activePresetId === 'ecommerce'
                ? 'bg-indigo-600 text-white dark:bg-indigo-500 border border-indigo-600'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500'
            }`}
          >
            {t('graphqltodrizzle.preset_ecommerce', 'E-Commerce Catalog')}
          </button>
          <button
            type="button"
            aria-pressed={activePresetId === 'user_auth'}
            onClick={() => loadPreset('user_auth')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
              activePresetId === 'user_auth'
                ? 'bg-indigo-600 text-white dark:bg-indigo-500 border border-indigo-600'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500'
            }`}
          >
            {t('graphqltodrizzle.preset_user_auth', 'User Management & Auth')}
          </button>
          <button
            type="button"
            aria-pressed={activePresetId === 'blog'}
            onClick={() => loadPreset('blog')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
              activePresetId === 'blog'
                ? 'bg-indigo-600 text-white dark:bg-indigo-500 border border-indigo-600'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500'
            }`}
          >
            {t('graphqltodrizzle.preset_blog', 'Blog Posts & Comments')}
          </button>
        </div>
      </div>

      {/* Options Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-5 bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="space-y-1.5">
          <label htmlFor="drizzle-dialect" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('graphqltodrizzle.dialect', 'SQL Dialect')}
          </label>
          <select
            id="drizzle-dialect"
            value={dialect}
            onChange={(e) => setDialect(e.target.value as Dialect)}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="pg">PostgreSQL (pgTable)</option>
            <option value="mysql">MySQL (mysqlTable)</option>
            <option value="sqlite">SQLite (sqliteTable)</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="drizzle-casing" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('graphqltodrizzle.field_casing', 'Property Casing')}
          </label>
          <select
            id="drizzle-casing"
            value={casing}
            onChange={(e) => setCasing(e.target.value as CasingStyle)}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="camelCase">camelCase (default)</option>
            <option value="snake_case">snake_case</option>
            <option value="PascalCase">PascalCase</option>
            <option value="original">Original</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="drizzle-id-type" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('graphqltodrizzle.id_type', 'ID Primary Key Type')}
          </label>
          <select
            id="drizzle-id-type"
            value={idType}
            onChange={(e) => setIdType(e.target.value as any)}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="serial">Auto-Increment (serial/int)</option>
            <option value="uuid">UUID (uuid/varchar)</option>
            <option value="varchar">String/Varchar</option>
          </select>
        </div>

        <div className="flex flex-col justify-center space-y-2 pt-2">
          <label htmlFor="drizzle-imports" className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              id="drizzle-imports"
              type="checkbox"
              checked={includeImports}
              onChange={(e) => setIncludeImports(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
            {t('graphqltodrizzle.include_imports', 'Include Drizzle Imports')}
          </label>
          <label htmlFor="drizzle-export-types" className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              id="drizzle-export-types"
              type="checkbox"
              checked={exportTypes}
              onChange={(e) => setExportTypes(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
            {t('graphqltodrizzle.export_types', 'Export InferSelect/Insert Types')}
          </label>
        </div>
      </div>

      {/* Editor Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-500" aria-hidden="true" />
              <label htmlFor="graphql-drizzle-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('graphqltodrizzle.graphql_input_label', 'GraphQL SDL Schema')}
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
            id="graphql-drizzle-input"
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              if (activePresetId) setActivePresetId(null);
            }}
            placeholder={t('graphqltodrizzle.placeholder_graphql', 'Paste GraphQL SDL schema statements here...')}
            className="w-full h-[450px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-emerald-500" aria-hidden="true" />
              <label htmlFor="drizzle-output" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('graphqltodrizzle.output_label', 'Generated Drizzle ORM Schema')}
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
            id="drizzle-output"
            value={output}
            readOnly
            placeholder={t('graphqltodrizzle.placeholder_output', 'Drizzle ORM schema code will appear here...')}
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
          <h4 className="font-bold dark:text-white">{t('graphqltodrizzle.about_title', 'About GraphQL SDL to Drizzle ORM Schema Converter')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('graphqltodrizzle.about_text', 'Convert GraphQL Schema Definition Language (SDL) constructs (types, interfaces, inputs, enums) directly into strongly-typed Drizzle ORM schema definitions. Supports PostgreSQL (pgTable/pgEnum), MySQL (mysqlTable/mysqlEnum), and SQLite (sqliteTable) dialects, property casing choices, notNull & primaryKey modifiers, and optional InferSelectModel/InferInsertModel TypeScript type exports.')}
          </p>
        </div>
      </div>
    </div>
  );
}
