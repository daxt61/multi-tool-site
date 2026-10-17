import { useState, useEffect, useCallback, useRef } from 'react';
import { Database as DatabaseIcon, Copy, Check, Trash2, AlertCircle, Download, Info, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;

const TS_RESERVED_KEYWORDS = new Set([
  'type', 'interface', 'class', 'function', 'var', 'let', 'const', 'import', 'export',
  'default', 'return', 'enum', 'extends', 'implements', 'public', 'private', 'protected',
  'readonly', 'static', 'package', 'new', 'this', 'super', 'in', 'of', 'for', 'if', 'else',
  'while', 'do', 'try', 'catch', 'finally', 'throw', 'delete', 'typeof', 'instanceof',
  'void', 'null', 'undefined', 'never', 'any', 'unknown', 'boolean', 'string', 'number',
  'symbol', 'bigint', 'object'
]);

type CasingStyle = 'original' | 'camelCase' | 'snake_case' | 'PascalCase';

const transformCasing = (str: string, casing: CasingStyle): string => {
  if (casing === 'original') return str;

  // Split word boundaries
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

const sanitizeFieldName = (name: string): string => {
  if (TS_RESERVED_KEYWORDS.has(name) || !/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name)) {
    return JSON.stringify(name);
  }
  return name;
};

export function GraphQLToKysely({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState(initialData?.input || '');
  const [output, setOutput] = useState(initialData?.output || '');
  const [idType, setIdType] = useState<'generated_string' | 'generated_number' | 'string'>(initialData?.idType || 'generated_string');
  const [timestampType, setTimestampType] = useState<'generated_date' | 'generated_string' | 'date' | 'string'>(initialData?.timestampType || 'generated_date');
  const [useJsonColumn, setUseJsonColumn] = useState<boolean>(initialData?.useJsonColumn !== false);
  const [includeDatabase, setIncludeDatabase] = useState<boolean>(initialData?.includeDatabase !== false);
  const [fieldCasing, setFieldCasing] = useState<CasingStyle>(initialData?.fieldCasing || 'original');
  const [activePresetId, setActivePresetId] = useState<string | null>(initialData?.activePresetId || null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ input, output, idType, timestampType, useJsonColumn, includeDatabase, fieldCasing, activePresetId });
  }, [input, output, idType, timestampType, useJsonColumn, includeDatabase, fieldCasing, activePresetId, onStateChange]);

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
  categoryId: ID!
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
}

union AuthResult = User | AuthError

type AuthError {
  code: String!
  message: String!
}`,
    social_feed: `# Social Feed & Comments Schema
type User {
  id: ID!
  username: String!
  avatarUrl: String
}

type Comment {
  id: ID!
  authorId: ID!
  content: String!
  createdAt: DateTime!
  likesCount: Int!
}

type Post {
  id: ID!
  authorId: ID!
  title: String!
  body: String!
  isPublished: Boolean!
  createdAt: DateTime!
}`
  };

  const convertGqlTypeToKysely = (
    gqlTypeStr: string,
    customScalars: Set<string>,
    enumNames: Set<string>,
    knownInterfaces: Set<string>
  ): { kyselyType: string; isNonNull: boolean; isArray: boolean } => {
    const raw = gqlTypeStr.trim();
    const isNonNull = raw.endsWith('!');
    const typeWithoutOuterBang = isNonNull ? raw.slice(0, -1).trim() : raw;

    if (typeWithoutOuterBang.startsWith('[') && typeWithoutOuterBang.endsWith(']')) {
      const innerGql = typeWithoutOuterBang.slice(1, -1).trim();
      const innerConverted = convertGqlTypeToKysely(innerGql, customScalars, enumNames, knownInterfaces);
      let innerType = innerConverted.kyselyType;
      if (!innerConverted.isNonNull) {
        innerType = `${innerType} | null`;
      }
      return { kyselyType: `(${innerType})[]`, isNonNull, isArray: true };
    }

    const base = typeWithoutOuterBang;
    let kyselyType = 'unknown';

    if (base === 'String') kyselyType = 'string';
    else if (base === 'Int' || base === 'Float') kyselyType = 'number';
    else if (base === 'Boolean') kyselyType = 'boolean';
    else if (base === 'ID') {
      if (idType === 'generated_string') kyselyType = 'Generated<string>';
      else if (idType === 'generated_number') kyselyType = 'Generated<number>';
      else kyselyType = 'string';
    } else if (base === 'DateTime' || base === 'Date' || base === 'Timestamp') {
      if (timestampType === 'generated_date') kyselyType = 'Generated<Date>';
      else if (timestampType === 'generated_string') kyselyType = 'Generated<string>';
      else if (timestampType === 'date') kyselyType = 'Date';
      else kyselyType = 'string';
    } else if (base === 'JSON' || base === 'JSONObject') {
      kyselyType = useJsonColumn ? 'JSONColumnType<Record<string, unknown>>' : 'Record<string, unknown>';
    } else if (enumNames.has(base)) {
      kyselyType = base;
    } else if (customScalars.has(base)) {
      kyselyType = 'unknown';
    } else if (knownInterfaces.has(base)) {
      kyselyType = base;
    } else {
      // Foreign relation or complex object reference
      kyselyType = useJsonColumn ? `JSONColumnType<${base}>` : base;
    }

    return { kyselyType, isNonNull, isArray: false };
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

      // Clean GraphQL comments
      const cleanInput = input
        .replace(/#.*$/gm, '')
        .replace(/"""[\s\S]*?"""/g, '')
        .replace(/"[\s\S]*?"/g, (m: string) => m.includes('\n') ? '""' : m);

      // Collect custom scalars, enums, known interfaces/types
      const customScalars = new Set<string>();
      const scalarRegex = /scalar\s+([A-Za-z0-9_]+)/g;
      let scalarMatch: RegExpExecArray | null;
      while ((scalarMatch = scalarRegex.exec(cleanInput)) !== null) {
        if (scalarMatch[1]) customScalars.add(scalarMatch[1]);
      }

      const enumNames = new Set<string>();
      const enumRegex = /enum\s+([A-Za-z0-9_]+)\s*\{([^}]*)\}/g;
      let enumMatch: RegExpExecArray | null;
      while ((enumMatch = enumRegex.exec(cleanInput)) !== null) {
        if (enumMatch[1]) enumNames.add(enumMatch[1]);
      }

      const knownInterfaces = new Set<string>();
      const typeCollectRegex = /(type|interface|input)\s+([A-Za-z0-9_]+)/g;
      let typeMatch: RegExpExecArray | null;
      while ((typeMatch = typeCollectRegex.exec(cleanInput)) !== null) {
        if (typeMatch[2]) knownInterfaces.add(typeMatch[2]);
      }

      const importsSet = new Set<string>();
      if (idType.startsWith('generated_') || timestampType.startsWith('generated_')) {
        importsSet.add('Generated');
      }
      if (useJsonColumn) {
        importsSet.add('JSONColumnType');
      }

      const interfaceBlocks: string[] = [];
      const enumBlocks: string[] = [];
      const tableMap = Object.create(null);

      // Reset regexes
      enumRegex.lastIndex = 0;
      while ((enumMatch = enumRegex.exec(cleanInput)) !== null) {
        const enumName = enumMatch[1];
        const enumValues = enumMatch[2]
          .split(/\s+/)
          .map(v => v.trim())
          .filter(Boolean);

        if (enumValues.length > 0) {
          const unionItems = enumValues.map(v => `'${v}'`).join(' | ');
          enumBlocks.push(`export type ${enumName} = ${unionItems};`);
        }
      }

      const structRegex = /(type|interface|input)\s+([A-Za-z0-9_]+)(?:\s+implements\s+[^{]+)?\s*\{([^}]*)\}/g;
      let structMatch: RegExpExecArray | null;

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

        let fieldsCode = '';

        lines.forEach(line => {
          const cleanLine = line.replace(/\([^)]*\)/, '');
          const colonIdx = cleanLine.indexOf(':');
          if (colonIdx === -1) return;

          const rawFieldName = cleanLine.substring(0, colonIdx).trim();
          const rawTypeStr = cleanLine.substring(colonIdx + 1).trim();

          if (!rawFieldName || !rawTypeStr) return;

          const transformedName = transformCasing(rawFieldName, fieldCasing);
          const fieldKey = sanitizeFieldName(transformedName);

          const { kyselyType, isNonNull } = convertGqlTypeToKysely(
            rawTypeStr,
            customScalars,
            enumNames,
            knownInterfaces
          );

          let finalType = kyselyType;
          if (!isNonNull) {
            finalType = `${finalType} | null`;
          }

          fieldsCode += `  ${fieldKey}: ${finalType};\n`;
        });

        const interfaceName = `${name}Table`;
        tableMap[name] = interfaceName;

        interfaceBlocks.push(`export interface ${interfaceName} {\n${fieldsCode}}`);
      }

      if (interfaceBlocks.length === 0 && enumBlocks.length === 0) {
        setError(t('graphqltokysely.no_types_found', 'No valid GraphQL types, interfaces, inputs, or enums found.'));
        setOutput('');
        return;
      }

      let code = '';
      if (importsSet.size > 0) {
        code += `import { ${Array.from(importsSet).sort().join(', ')} } from 'kysely';\n\n`;
      }

      if (enumBlocks.length > 0) {
        code += enumBlocks.join('\n\n') + '\n\n';
      }

      if (interfaceBlocks.length > 0) {
        code += interfaceBlocks.join('\n\n');
      }

      if (includeDatabase && Object.keys(tableMap).length > 0) {
        code += '\n\nexport interface Database {\n';
        Object.keys(tableMap).forEach(typeName => {
          const tableName = transformCasing(typeName, fieldCasing === 'original' ? 'snake_case' : fieldCasing);
          const tableKey = sanitizeFieldName(tableName);
          code += `  ${tableKey}: ${tableMap[typeName]};\n`;
        });
        code += '}';
      }

      setOutput(code);
      setError('');
    } catch (e: any) {
      setError(t('graphqltokysely.error_parsing', 'Error parsing GraphQL schema') + ': ' + e.message);
      setOutput('');
    }
  }, [input, idType, timestampType, useJsonColumn, includeDatabase, fieldCasing, t]);

  useEffect(() => {
    handleConvert();
  }, [handleConvert]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success(t('graphqltokysely.toast_copied', 'Kysely TypeScript interfaces copied to clipboard!'));
    setTimeout(() => setCopied(false), 2000);
  }, [output, t]);

  const handleClear = useCallback(() => {
    setInput('');
    setOutput('');
    setError('');
    setActivePresetId(null);
    toast.success(t('graphqltokysely.toast_cleared', 'Inputs cleared!'));
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
    setActivePresetId(presetKey);
    toast.success(t('graphqltokysely.preset_loaded', 'Loaded GraphQL preset!'));
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
            {t('graphqltokysely.presets_title', 'Quick Start Presets:')}
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
            {t('graphqltokysely.preset_ecommerce', 'E-Commerce Catalog')}
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
            {t('graphqltokysely.preset_user_auth', 'User Management & Auth')}
          </button>
          <button
            type="button"
            aria-pressed={activePresetId === 'social_feed'}
            onClick={() => loadPreset('social_feed')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
              activePresetId === 'social_feed'
                ? 'bg-indigo-600 text-white dark:bg-indigo-500 border border-indigo-600'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500'
            }`}
          >
            {t('graphqltokysely.preset_social_feed', 'Social Feed & Comments')}
          </button>
        </div>
      </div>

      {/* Options Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-5 bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="space-y-1.5">
          <label htmlFor="id-type" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('graphqltokysely.id_type', 'ID Scalar Mapping')}
          </label>
          <select
            id="id-type"
            value={idType}
            onChange={(e) => setIdType(e.target.value as any)}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="generated_string">Generated&lt;string&gt;</option>
            <option value="generated_number">Generated&lt;number&gt;</option>
            <option value="string">string</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="timestamp-type" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('graphqltokysely.timestamp_type', 'DateTime Mapping')}
          </label>
          <select
            id="timestamp-type"
            value={timestampType}
            onChange={(e) => setTimestampType(e.target.value as any)}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="generated_date">Generated&lt;Date&gt;</option>
            <option value="generated_string">Generated&lt;string&gt;</option>
            <option value="date">Date</option>
            <option value="string">string</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="field-casing" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('graphqltokysely.field_casing', 'Property Casing')}
          </label>
          <select
            id="field-casing"
            value={fieldCasing}
            onChange={(e) => setFieldCasing(e.target.value as CasingStyle)}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="original">Original</option>
            <option value="snake_case">snake_case</option>
            <option value="camelCase">camelCase</option>
            <option value="PascalCase">PascalCase</option>
          </select>
        </div>

        <div className="flex flex-col justify-center space-y-2 pt-2">
          <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={useJsonColumn}
              onChange={(e) => setUseJsonColumn(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
            {t('graphqltokysely.use_json_column', 'Wrap JSON (JSONColumnType<T>)')}
          </label>
          <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={includeDatabase}
              onChange={(e) => setIncludeDatabase(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
            {t('graphqltokysely.include_database', 'Generate Root Database Interface')}
          </label>
        </div>
      </div>

      {/* Editor Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <DatabaseIcon className="w-4 h-4 text-indigo-500" aria-hidden="true" />
              <label htmlFor="graphql-kysely-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('graphqltokysely.graphql_input_label', 'GraphQL SDL Schema')}
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
            id="graphql-kysely-input"
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setActivePresetId(null);
            }}
            placeholder={t('graphqltokysely.placeholder_graphql', 'Paste GraphQL SDL schema here...')}
            className="w-full h-[450px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <DatabaseIcon className="w-4 h-4 text-emerald-500" aria-hidden="true" />
              <label htmlFor="kysely-output" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('graphqltokysely.output_label', 'Kysely TypeScript Interfaces')}
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
            id="kysely-output"
            value={output}
            readOnly
            placeholder={t('graphqltokysely.placeholder_output', 'Kysely TypeScript database interfaces will appear here...')}
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
          <h4 className="font-bold dark:text-white">{t('graphqltokysely.about_title', 'About GraphQL SDL to Kysely Converter')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('graphqltokysely.about_text', 'Convert GraphQL Schema Definition Language (SDL) constructs (types, interfaces, inputs, enums, unions) directly into strongly-typed Kysely TypeScript database interfaces with Generated<T>, JSONColumnType<T>, property casing transforms, and root Database interface exports.')}
          </p>
        </div>
      </div>
    </div>
  );
}
