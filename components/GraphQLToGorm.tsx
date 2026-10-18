import { useState, useEffect, useCallback, useRef } from 'react';
import { Database, Copy, Check, Trash2, AlertCircle, Download, Info, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;

type FieldCasing = 'PascalCase' | 'snake_case' | 'camelCase' | 'original';
type NullableHandling = 'pointers' | 'omit_pointers';
type Dialect = 'postgres' | 'mysql' | 'sqlite';

const GO_KEYWORDS = new Set([
  'break', 'default', 'func', 'interface', 'select', 'case', 'defer', 'go', 'map',
  'struct', 'chan', 'else', 'goto', 'package', 'switch', 'const', 'fallthrough',
  'if', 'range', 'type', 'continue', 'for', 'import', 'return', 'var', 'string',
  'int', 'int64', 'bool', 'float64', 'uint', 'byte'
]);

const escapeGoTag = (str: string): string => {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
    .replace(/`/g, '');
};

export function GraphQLToGorm({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState(initialData?.input || '');
  const [output, setOutput] = useState(initialData?.output || '');
  const [packageName, setPackageName] = useState(initialData?.packageName || 'models');
  const [dialect, setDialect] = useState<Dialect>(initialData?.dialect || 'postgres');
  const [fieldCasing, setFieldCasing] = useState<FieldCasing>(initialData?.fieldCasing || 'PascalCase');
  const [nullableHandling, setNullableHandling] = useState<NullableHandling>(initialData?.nullableHandling || 'pointers');
  const [embedGormModel, setEmbedGormModel] = useState<boolean>(initialData?.embedGormModel !== undefined ? initialData.embedGormModel : true);
  const [useJsonTag, setUseJsonTag] = useState<boolean>(initialData?.useJsonTag !== undefined ? initialData.useJsonTag : true);
  const [generateTableName, setGenerateTableName] = useState<boolean>(initialData?.generateTableName !== undefined ? initialData.generateTableName : true);
  const [activePresetId, setActivePresetId] = useState<string | null>(initialData?.activePresetId || null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({
      input,
      output,
      packageName,
      dialect,
      fieldCasing,
      nullableHandling,
      embedGormModel,
      useJsonTag,
      generateTableName,
      activePresetId,
    });
  }, [input, output, packageName, dialect, fieldCasing, nullableHandling, embedGormModel, useJsonTag, generateTableName, activePresetId, onStateChange]);

  const PRESETS = {
    ecommerce: {
      id: 'ecommerce',
      code: `# E-Commerce Schema
type Category {
  id: ID!
  name: String!
  slug: String!
  description: String
}

type Product {
  id: ID!
  sku: String!
  title: String!
  description: String
  price: Float!
  stockQuantity: Int!
  isAvailable: Boolean!
  categoryId: ID!
  createdAt: DateTime!
}

type Order {
  id: ID!
  orderNumber: String!
  totalAmount: Float!
  status: OrderStatus!
}

enum OrderStatus {
  PENDING
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
}`
    },
    user_auth: {
      id: 'user_auth',
      code: `# User Management & Auth Schema
enum UserRole {
  ADMIN
  MANAGER
  MEMBER
  GUEST
}

type User {
  id: ID!
  email: String!
  username: String!
  fullName: String!
  role: UserRole!
  isVerified: Boolean!
  lastLogin: DateTime
  bio: String
}

type UserSession {
  id: ID!
  userId: ID!
  token: String!
  expiresAt: DateTime!
}`
    },
    social_feed: {
      id: 'social_feed',
      code: `# Social Feed & Comments Schema
type Profile {
  id: ID!
  handle: String!
  bio: String
  avatarUrl: String
}

type Post {
  id: ID!
  authorId: ID!
  title: String!
  content: String!
  likesCount: Int!
  isPublished: Boolean!
}

type Comment {
  id: ID!
  postId: ID!
  authorId: ID!
  text: String!
  createdAt: DateTime!
}`
    }
  };

  const applyCasing = (str: string, casing: FieldCasing): string => {
    if (casing === 'original') return str;

    const words = str
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/[-_]+/g, ' ')
      .trim()
      .split(/\s+/);

    if (words.length === 0 || !words[0]) return str;

    if (casing === 'PascalCase') {
      return words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
    }
    if (casing === 'snake_case') {
      return words.map(w => w.toLowerCase()).join('_');
    }
    if (casing === 'camelCase') {
      return words[0].toLowerCase() + words.slice(1).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
    }

    return str;
  };

  const sanitizeGoFieldName = (name: string): string => {
    let pascalName = applyCasing(name, 'PascalCase');
    if (GO_KEYWORDS.has(pascalName.toLowerCase())) {
      pascalName = `${pascalName}Val`;
    }
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(pascalName)) {
      pascalName = `X${pascalName.replace(/[^A-Za-z0-9_]/g, '_')}`;
    }
    return pascalName;
  };

  const mapGqlTypeToGoGorm = (
    gqlTypeStr: string,
    currentDialect: Dialect,
    customScalars: Set<string>
  ): { goType: string; gormType: string; isNonNull: boolean; isSlice: boolean } => {
    const raw = gqlTypeStr.trim();
    const isNonNull = raw.endsWith('!');
    const typeWithoutOuterBang = isNonNull ? raw.slice(0, -1).trim() : raw;

    if (typeWithoutOuterBang.startsWith('[') && typeWithoutOuterBang.endsWith(']')) {
      const innerGql = typeWithoutOuterBang.slice(1, -1).trim();
      const innerConverted = mapGqlTypeToGoGorm(innerGql, currentDialect, customScalars);
      const innerGo = innerConverted.goType;
      const gormSliceType = currentDialect === 'postgres' ? 'jsonb' : 'json';
      return { goType: `[]${innerGo}`, gormType: gormSliceType, isNonNull, isSlice: true };
    }

    const base = typeWithoutOuterBang;
    let goType = 'any';
    let gormType = 'varchar(255)';

    if (base === 'String') {
      goType = 'string';
      gormType = 'varchar(255)';
    } else if (base === 'Int') {
      goType = 'int';
      gormType = 'bigint';
    } else if (base === 'Float') {
      goType = 'float64';
      gormType = 'numeric';
    } else if (base === 'Boolean') {
      goType = 'bool';
      gormType = 'boolean';
    } else if (base === 'ID') {
      goType = 'string';
      gormType = 'varchar(191)';
    } else if (base === 'DateTime' || base === 'Date' || base === 'Time' || base === 'Timestamp') {
      goType = 'time.Time';
      gormType = currentDialect === 'postgres' ? 'timestamptz' : 'datetime';
    } else if (base === 'JSON' || base === 'JSONObject' || base === 'JSONSchema') {
      goType = 'string';
      gormType = currentDialect === 'postgres' ? 'jsonb' : 'json';
    } else if (customScalars.has(base)) {
      goType = 'string';
      gormType = 'text';
    } else {
      goType = base;
      gormType = 'varchar(255)';
    }

    return { goType, gormType, isNonNull, isSlice: false };
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
        .replace(/#.*$/gm, '')
        .replace(/"""[\s\S]*?"""/g, '')
        .replace(/"[\s\S]*?"/g, (m: string) => m.includes('\n') ? '""' : m);

      const customScalars = new Set<string>();
      const scalarRegex = /scalar\s+([A-Za-z0-9_]+)/g;
      let scalarMatch: RegExpExecArray | null;
      while ((scalarMatch = scalarRegex.exec(cleanInput)) !== null) {
        if (scalarMatch[1]) customScalars.add(scalarMatch[1]);
      }

      const importsNeeded = new Set<string>();
      const outputBlocks: string[] = [];
      const tableNameMethods: string[] = [];

      // 1. Process Enums
      const enumRegex = /enum\s+([A-Za-z0-9_]+)\s*\{([^}]*)\}/g;
      let enumMatch: RegExpExecArray | null;
      while ((enumMatch = enumRegex.exec(cleanInput)) !== null) {
        const enumName = sanitizeGoFieldName(enumMatch[1]);
        const enumValues = enumMatch[2]
          .split(/\s+/)
          .map(v => v.trim())
          .filter(Boolean);

        let block = `type ${enumName} string\n\nconst (\n`;
        enumValues.forEach(v => {
          const constName = `${enumName}${sanitizeGoFieldName(v)}`;
          block += `\t${constName} ${enumName} = "${escapeGoTag(v)}"\n`;
        });
        block += `)`;
        outputBlocks.push(block);
      }

      // 2. Process Structs (Types, Interfaces, Inputs)
      const structRegex = /(type|interface|input)\s+([A-Za-z0-9_]+)(?:\s+implements\s+[^{]+)?\s*\{([^}]*)\}/g;
      let structMatch: RegExpExecArray | null;

      while ((structMatch = structRegex.exec(cleanInput)) !== null) {
        const rawTypeName = structMatch[2];
        const structName = sanitizeGoFieldName(rawTypeName);
        const body = structMatch[3];

        const lines = body
          .split('\n')
          .map(l => l.trim())
          .filter(l => l && !l.startsWith('#'));

        let block = `type ${structName} struct {\n`;
        if (embedGormModel) {
          block += `\tgorm.Model\n`;
          importsNeeded.add('gorm.io/gorm');
        }

        let fieldCount = 0;

        lines.forEach(line => {
          const cleanLine = line.replace(/\([^)]*\)/, '');
          const colonIdx = cleanLine.indexOf(':');
          if (colonIdx === -1) return;

          const rawFieldName = cleanLine.substring(0, colonIdx).trim();
          const rawTypeStr = cleanLine.substring(colonIdx + 1).trim();

          if (!rawFieldName || !rawTypeStr) return;

          // Skip ID, CreatedAt, UpdatedAt, DeletedAt if gorm.Model is embedded
          if (embedGormModel && ['id', 'createdat', 'updatedat', 'deletedat'].includes(rawFieldName.toLowerCase())) {
            return;
          }

          const fieldNameCased = applyCasing(rawFieldName, fieldCasing);
          const goFieldName = sanitizeGoFieldName(fieldNameCased);

          const { goType, gormType, isNonNull, isSlice } = mapGqlTypeToGoGorm(rawTypeStr, dialect, customScalars);

          if (goType.includes('time.Time')) {
            importsNeeded.add('time');
          }

          let finalType = goType;
          let isPointer = false;

          if (!isNonNull && !isSlice && nullableHandling === 'pointers') {
            if (!goType.startsWith('*') && goType !== 'any' && !goType.startsWith('map[')) {
              finalType = `*${goType}`;
              isPointer = true;
            }
          }

          const tags: string[] = [];
          const columnSnake = applyCasing(rawFieldName, 'snake_case');

          const gormOpts: string[] = [`column:${escapeGoTag(columnSnake)}`, `type:${gormType}`];
          if (rawFieldName === 'id') gormOpts.push('primaryKey', 'autoIncrement');
          if (isNonNull) gormOpts.push('not null');

          tags.push(`gorm:"${gormOpts.join(';')}"`);

          if (useJsonTag) {
            const omitOpt = (!isNonNull || isPointer) ? ',omitempty' : '';
            tags.push(`json:"${escapeGoTag(columnSnake)}${omitOpt}"`);
          }

          const tagString = ` \`${tags.join(' ')}\``;
          block += `\t${goFieldName} ${finalType}${tagString}\n`;
          fieldCount++;
        });

        block += `}`;
        if (fieldCount > 0 || embedGormModel) {
          outputBlocks.push(block);

          if (generateTableName) {
            const tableName = applyCasing(rawTypeName, 'snake_case') + 's';
            tableNameMethods.push(
              `func (${structName}) TableName() string {\n\treturn "${escapeGoTag(tableName)}"\n}`
            );
          }
        }
      }

      if (outputBlocks.length === 0) {
        setError(t('graphqltogorm.no_types_found', 'No valid GraphQL types, interfaces, inputs, or enums found.'));
        setOutput('');
        return;
      }

      const cleanPkgName = packageName.trim().replace(/[^a-zA-Z0-9_]/g, '') || 'models';
      const headerLines: string[] = [`package ${cleanPkgName}`];

      if (importsNeeded.size > 0) {
        headerLines.push('');
        headerLines.push('import (');
        Array.from(importsNeeded).sort().forEach(imp => {
          headerLines.push(`\t"${imp}"`);
        });
        headerLines.push(')');
      }

      const fullOutput = `${headerLines.join('\n')}\n\n${outputBlocks.join('\n\n')}${
        tableNameMethods.length > 0 ? '\n\n' + tableNameMethods.join('\n\n') : ''
      }`;

      setOutput(fullOutput);
      setError('');
    } catch (e: any) {
      setError(t('graphqltogorm.error_parsing', 'Error parsing GraphQL schema') + ': ' + e.message);
      setOutput('');
    }
  }, [input, packageName, dialect, fieldCasing, nullableHandling, embedGormModel, useJsonTag, generateTableName, t]);

  useEffect(() => {
    handleConvert();
  }, [handleConvert]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success(t('graphqltogorm.toast_copied', 'GORM Go struct definitions copied to clipboard!'));
    setTimeout(() => setCopied(false), 2000);
  }, [output, t]);

  const handleClear = useCallback(() => {
    setInput('');
    setOutput('');
    setError('');
    setActivePresetId(null);
    toast.success(t('graphqltogorm.toast_cleared', 'Inputs cleared!'));
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [t]);

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/x-go' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${packageName || 'models'}.go`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(t('common.downloaded', 'Downloaded Go models!'));
  };

  const loadPreset = (presetKey: keyof typeof PRESETS) => {
    const preset = PRESETS[presetKey];
    setInput(preset.code);
    setActivePresetId(preset.id);
    toast.success(t('graphqltogorm.preset_loaded', 'Loaded GraphQL preset!'));
  };

  const handlersRef = useRef({ handleClear, handleCopy, output });
  useEffect(() => {
    handlersRef.current = { handleClear, handleCopy, output };
  }, [handleClear, handleCopy, output]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!containerRef.current?.contains(document.activeElement)) return;

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
    <div ref={containerRef} className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Presets Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" aria-hidden="true" />
          <span className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('graphqltogorm.presets_title', 'Quick Start Presets:')}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {Object.entries(PRESETS).map(([key, preset]) => (
            <button
              key={key}
              onClick={() => loadPreset(key as keyof typeof PRESETS)}
              aria-pressed={activePresetId === preset.id}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                activePresetId === preset.id
                  ? 'bg-indigo-600 text-white shadow-indigo-500/20'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-indigo-500'
              }`}
            >
              {key === 'ecommerce' && t('graphqltogorm.preset_ecommerce', 'E-Commerce Catalog')}
              {key === 'user_auth' && t('graphqltogorm.preset_user_auth', 'User Management & Auth')}
              {key === 'social_feed' && t('graphqltogorm.preset_social_feed', 'Social Feed & Comments')}
            </button>
          ))}
        </div>
      </div>

      {/* Options Panel */}
      <div className="p-5 bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="package-name" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              {t('graphqltogorm.package_name', 'Package Name')}
            </label>
            <input
              id="package-name"
              type="text"
              value={packageName}
              onChange={(e) => {
                setPackageName(e.target.value);
                setActivePresetId(null);
              }}
              placeholder="models"
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="dialect" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              {t('graphqltogorm.dialect', 'SQL Dialect')}
            </label>
            <select
              id="dialect"
              value={dialect}
              onChange={(e) => {
                setDialect(e.target.value as Dialect);
                setActivePresetId(null);
              }}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="postgres">PostgreSQL</option>
              <option value="mysql">MySQL</option>
              <option value="sqlite">SQLite</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="field-casing" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              {t('graphqltogorm.field_casing', 'Struct Field Casing')}
            </label>
            <select
              id="field-casing"
              value={fieldCasing}
              onChange={(e) => {
                setFieldCasing(e.target.value as FieldCasing);
                setActivePresetId(null);
              }}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="PascalCase">PascalCase (Exported)</option>
              <option value="camelCase">camelCase</option>
              <option value="snake_case">snake_case</option>
              <option value="original">Original</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="nullable-handling" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              {t('graphqltogorm.nullable_handling', 'Nullable Fields')}
            </label>
            <select
              id="nullable-handling"
              value={nullableHandling}
              onChange={(e) => {
                setNullableHandling(e.target.value as NullableHandling);
                setActivePresetId(null);
              }}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="pointers">Pointers (*T)</option>
              <option value="omit_pointers">Plain Value (T)</option>
            </select>
          </div>
        </div>

        {/* Feature Toggles */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-6">
          <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold">
            <input
              type="checkbox"
              checked={embedGormModel}
              onChange={(e) => {
                setEmbedGormModel(e.target.checked);
                setActivePresetId(null);
              }}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
            />
            {t('graphqltogorm.embed_gorm_model', 'Embed gorm.Model (ID, Timestamps, Soft Delete)')}
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold">
            <input
              type="checkbox"
              checked={useJsonTag}
              onChange={(e) => {
                setUseJsonTag(e.target.checked);
                setActivePresetId(null);
              }}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
            />
            {t('graphqltogorm.include_json_tags', 'Include `json:"..."` Tags')}
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold">
            <input
              type="checkbox"
              checked={generateTableName}
              onChange={(e) => {
                setGenerateTableName(e.target.checked);
                setActivePresetId(null);
              }}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
            />
            {t('graphqltogorm.generate_table_name', 'Generate TableName() Receiver Methods')}
          </label>
        </div>
      </div>

      {/* Editor Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-500" aria-hidden="true" />
              <label htmlFor="graphql-gorm-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('graphqltogorm.graphql_input_label', 'GraphQL SDL Schema')}
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
            id="graphql-gorm-input"
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setActivePresetId(null);
            }}
            placeholder={t('graphqltogorm.placeholder_graphql', 'Paste GraphQL SDL schema here...')}
            className="w-full h-[450px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-500" aria-hidden="true" />
              <label htmlFor="gorm-output" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('graphqltogorm.output_label', 'Generated GORM Models')}
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
            id="gorm-output"
            value={output}
            readOnly
            placeholder={t('graphqltogorm.placeholder_output', 'Generated GORM Go struct models will appear here...')}
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
          <h4 className="font-bold dark:text-white">{t('graphqltogorm.about_title', 'About GraphQL SDL to GORM Converter')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('graphqltogorm.about_text', 'Convert GraphQL Schema Definition Language (SDL) types into Go GORM ORM models with database column types (`gorm:"column:X;type:Y"`), embedded `gorm.Model` support, soft deletion, custom `TableName()` receiver methods, and dialect selection for PostgreSQL, MySQL, or SQLite.')}
          </p>
        </div>
      </div>
    </div>
  );
}
