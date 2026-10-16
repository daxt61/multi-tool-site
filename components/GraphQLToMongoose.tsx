import { useState, useEffect, useCallback, useRef } from 'react';
import { Database, Copy, Check, Trash2, AlertCircle, Download, Info, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;

const JS_RESERVED_KEYWORDS = new Set([
  'type', 'interface', 'class', 'function', 'var', 'let', 'const', 'import', 'export',
  'default', 'return', 'enum', 'extends', 'implements', 'public', 'private', 'protected',
  'readonly', 'static', 'package', 'new', 'this', 'super', 'in', 'of', 'for', 'if', 'else',
  'while', 'do', 'try', 'catch', 'finally', 'throw', 'delete', 'typeof', 'instanceof',
  'void', 'null', 'undefined', 'never', 'any', 'unknown', 'boolean', 'string', 'number',
  'symbol', 'bigint', 'object'
]);

const escapeJsString = (str: string): string => {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
};

const toCamelCase = (str: string) => str.replace(/[-_]([a-z])/g, (_, c) => c.toUpperCase()).replace(/^[A-Z]/, c => c.toLowerCase());
const toSnakeCase = (str: string) => str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`).replace(/^_+/, '');
const toPascalCase = (str: string) => {
  const camel = toCamelCase(str);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
};

export function GraphQLToMongoose({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState(initialData?.input || '');
  const [output, setOutput] = useState(initialData?.output || '');
  const [idType, setIdType] = useState<'ObjectId' | 'String'>(initialData?.idType || 'ObjectId');
  const [includeTimestamps, setIncludeTimestamps] = useState<boolean>(initialData?.includeTimestamps !== false);
  const [includeTsInterfaces, setIncludeTsInterfaces] = useState<boolean>(initialData?.includeTsInterfaces !== false);
  const [propertyCasing, setPropertyCasing] = useState<'original' | 'camelCase' | 'snake_case' | 'PascalCase'>(
    initialData?.propertyCasing || 'original'
  );
  const [activePresetId, setActivePresetId] = useState<string | null>(initialData?.activePresetId || null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({
      input,
      output,
      idType,
      includeTimestamps,
      includeTsInterfaces,
      propertyCasing,
      activePresetId
    });
  }, [input, output, idType, includeTimestamps, includeTsInterfaces, propertyCasing, activePresetId, onStateChange]);

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

  const transformCasing = (fieldName: string): string => {
    if (propertyCasing === 'camelCase') return toCamelCase(fieldName);
    if (propertyCasing === 'snake_case') return toSnakeCase(fieldName);
    if (propertyCasing === 'PascalCase') return toPascalCase(fieldName);
    return fieldName;
  };

  const sanitizeFieldName = (fieldName: string): string => {
    const casingName = transformCasing(fieldName);
    if (JS_RESERVED_KEYWORDS.has(casingName) || !/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(casingName)) {
      return JSON.stringify(casingName);
    }
    return casingName;
  };

  const parseGqlType = (gqlTypeStr: string): { base: string; isList: boolean; isNonNull: boolean } => {
    const raw = gqlTypeStr.trim();
    const isNonNull = raw.endsWith('!');
    const typeWithoutOuterBang = isNonNull ? raw.slice(0, -1).trim() : raw;

    if (typeWithoutOuterBang.startsWith('[') && typeWithoutOuterBang.endsWith(']')) {
      const inner = typeWithoutOuterBang.slice(1, -1).trim();
      return { base: inner.replace(/!$/, ''), isList: true, isNonNull };
    }

    return { base: typeWithoutOuterBang, isList: false, isNonNull };
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

      const cleanInput = input
        .replace(/#.*$/gm, '')
        .replace(/"""[\s\S]*?"""/g, '')
        .replace(/"[\s\S]*?"/g, (m: string) => (m.includes('\n') ? '""' : m));

      // Map enums
      const enumMap = Object.create(null);
      const enumRegex = /enum\s+([A-Za-z0-9_]+)\s*\{([^}]*)\}/g;
      let enumMatch;
      while ((enumMatch = enumRegex.exec(cleanInput)) !== null) {
        const enumName = enumMatch[1];
        const enumValues = enumMatch[2]
          .split(/\s+/)
          .map(v => v.trim())
          .filter(Boolean);
        enumMap[enumName] = enumValues;
      }

      // Collect type names
      const knownTypes = new Set<string>();
      const typeCollectRegex = /(type|interface|input)\s+([A-Za-z0-9_]+)/g;
      let typeMatch;
      while ((typeMatch = typeCollectRegex.exec(cleanInput)) !== null) {
        if (typeMatch[2]) knownTypes.add(typeMatch[2]);
      }

      const interfacesCode: string[] = [];
      const schemasCode: string[] = [];
      const modelsCode: string[] = [];

      // Process Types, Interfaces, Inputs
      const structRegex = /(type|interface|input)\s+([A-Za-z0-9_]+)(?:\s+implements\s+[^{]+)?\s*\{([^}]*)\}/g;
      let structMatch;

      while ((structMatch = structRegex.exec(cleanInput)) !== null) {
        const kind = structMatch[1];
        const typeName = structMatch[2];
        const body = structMatch[3];

        const normalizedBody = body
          .replace(/(!|[a-zA-Z0-9_\]]+)\s+([a-zA-Z0-9_$]+)\s*:/g, '$1\n$2:')
          .trim();

        const lines = normalizedBody
          .split('\n')
          .map(l => l.trim())
          .filter(l => l && !l.startsWith('#'));

        const tsFields: string[] = [];
        const mongooseFields: string[] = [];

        lines.forEach(line => {
          const cleanLine = line.replace(/\([^)]*\)/, '');
          const colonIdx = cleanLine.indexOf(':');
          if (colonIdx === -1) return;

          const rawFieldName = cleanLine.substring(0, colonIdx).trim();
          const rawTypeStr = cleanLine.substring(colonIdx + 1).trim();

          if (!rawFieldName || !rawTypeStr) return;
          if (rawFieldName === 'id' && (kind === 'type' || kind === 'interface')) {
            // Mongoose handles _id internally for models
          }

          const propKey = sanitizeFieldName(rawFieldName);
          const { base, isList, isNonNull } = parseGqlType(rawTypeStr);

          // TS type inference
          let tsPropType = 'any';
          if (base === 'String' || base === 'ID') tsPropType = 'string';
          else if (base === 'Int' || base === 'Float') tsPropType = 'number';
          else if (base === 'Boolean') tsPropType = 'boolean';
          else if (base === 'DateTime' || base === 'Date' || base === 'Timestamp') tsPropType = 'Date';
          else if (base === 'JSON' || base === 'JSONObject') tsPropType = 'Record<string, any>';
          else if (enumMap[base]) {
            tsPropType = enumMap[base].map((v: string) => `'${escapeJsString(v)}'`).join(' | ');
          } else if (knownTypes.has(base)) {
            tsPropType = `I${base}`;
          }

          if (isList) {
            tsPropType = `Array<${tsPropType}>`;
          }

          const optionalMarker = isNonNull ? '' : '?';
          tsFields.push(`  ${propKey}${optionalMarker}: ${tsPropType};`);

          // Mongoose schema definition
          let mgType = 'Schema.Types.Mixed';
          let isRef = false;
          let isEnum = false;

          if (base === 'String') mgType = 'String';
          else if (base === 'Int' || base === 'Float') mgType = 'Number';
          else if (base === 'Boolean') mgType = 'Boolean';
          else if (base === 'DateTime' || base === 'Date' || base === 'Timestamp') mgType = 'Date';
          else if (base === 'ID') {
            mgType = idType === 'ObjectId' ? 'Schema.Types.ObjectId' : 'String';
          } else if (base === 'JSON' || base === 'JSONObject') {
            mgType = 'Schema.Types.Mixed';
          } else if (enumMap[base]) {
            mgType = 'String';
            isEnum = true;
          } else if (knownTypes.has(base)) {
            mgType = idType === 'ObjectId' ? 'Schema.Types.ObjectId' : 'String';
            isRef = true;
          }

          let fieldObjStr = '';
          const reqStr = isNonNull ? 'required: true' : 'required: false';

          if (isList) {
            if (isRef) {
              fieldObjStr = `[{ type: ${mgType}, ref: '${base}' }]`;
            } else if (isEnum) {
              const enumVals = enumMap[base].map((v: string) => `'${escapeJsString(v)}'`).join(', ');
              fieldObjStr = `[{ type: ${mgType}, enum: [${enumVals}], ${reqStr} }]`;
            } else {
              fieldObjStr = `[{ type: ${mgType} }]`;
            }
          } else {
            if (isRef) {
              fieldObjStr = `{ type: ${mgType}, ref: '${base}', ${reqStr} }`;
            } else if (isEnum) {
              const enumVals = enumMap[base].map((v: string) => `'${escapeJsString(v)}'`).join(', ');
              fieldObjStr = `{ type: ${mgType}, enum: [${enumVals}], ${reqStr} }`;
            } else {
              fieldObjStr = `{ type: ${mgType}, ${reqStr} }`;
            }
          }

          mongooseFields.push(`  ${propKey}: ${fieldObjStr}`);
        });

        const interfaceName = `I${typeName}`;
        if (includeTsInterfaces) {
          interfacesCode.push(
            `export interface ${interfaceName} extends Document {\n${tsFields.join('\n')}\n}`
          );
        }

        const schemaGeneric = includeTsInterfaces ? `<${interfaceName}>` : '';
        const timestampOpt = includeTimestamps ? ', { timestamps: true }' : '';
        schemasCode.push(
          `export const ${typeName}Schema = new Schema${schemaGeneric}({\n${mongooseFields.join(',\n')}\n}${timestampOpt});`
        );

        if (kind === 'type') {
          modelsCode.push(
            `export const ${typeName} = model${schemaGeneric}('${typeName}', ${typeName}Schema);`
          );
        }
      }

      if (schemasCode.length === 0) {
        setError(t('graphqltomongoose.no_types_found', 'No valid GraphQL types or inputs found.'));
        setOutput('');
        return;
      }

      let header = `import { Schema, model, Document } from 'mongoose';\n\n`;
      let finalCode = header;

      if (interfacesCode.length > 0) {
        finalCode += interfacesCode.join('\n\n') + '\n\n';
      }

      finalCode += schemasCode.join('\n\n') + '\n\n';

      if (modelsCode.length > 0) {
        finalCode += modelsCode.join('\n\n');
      }

      setOutput(finalCode.trim());
      setError('');
    } catch (e: any) {
      setError(t('graphqltomongoose.error_parsing', 'Error parsing GraphQL schema') + ': ' + e.message);
      setOutput('');
    }
  }, [input, idType, includeTimestamps, includeTsInterfaces, propertyCasing, t]);

  useEffect(() => {
    handleConvert();
  }, [handleConvert]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success(t('graphqltomongoose.toast_copied', 'Mongoose schema copied to clipboard!'));
    setTimeout(() => setCopied(false), 2000);
  }, [output, t]);

  const handleClear = useCallback(() => {
    setInput('');
    setOutput('');
    setError('');
    setActivePresetId(null);
    toast.success(t('graphqltomongoose.toast_cleared', 'Inputs cleared!'));
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [t]);

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/typescript' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'mongoose.schema.ts';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(t('common.downloaded', 'Downloaded mongoose.schema.ts!'));
  };

  const loadPreset = (presetKey: keyof typeof PRESETS) => {
    setInput(PRESETS[presetKey]);
    setActivePresetId(presetKey);
    toast.success(t('graphqltomongoose.preset_loaded', 'Loaded GraphQL preset!'));
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
            {t('graphqltomongoose.presets_title', 'Quick Start Presets:')}
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
            {t('graphqltomongoose.preset_ecommerce', 'E-Commerce Catalog')}
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
            {t('graphqltomongoose.preset_user_auth', 'User Management & Auth')}
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
            {t('graphqltomongoose.preset_social_feed', 'Social Feed & Comments')}
          </button>
        </div>
      </div>

      {/* Options Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-5 bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="space-y-1.5">
          <label htmlFor="id-type" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('graphqltomongoose.id_type', 'ID Scalar Type')}
          </label>
          <select
            id="id-type"
            value={idType}
            onChange={(e) => setIdType(e.target.value as any)}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ObjectId">Schema.Types.ObjectId</option>
            <option value="String">String</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="property-casing" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('graphqltomongoose.property_casing', 'Property Casing')}
          </label>
          <select
            id="property-casing"
            value={propertyCasing}
            onChange={(e) => setPropertyCasing(e.target.value as any)}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="original">Original (GraphQL Field Casing)</option>
            <option value="camelCase">camelCase</option>
            <option value="snake_case">snake_case</option>
            <option value="PascalCase">PascalCase</option>
          </select>
        </div>

        <div className="flex flex-col justify-center space-y-2 pt-2 lg:col-span-2">
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={includeTimestamps}
                onChange={(e) => setIncludeTimestamps(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
              />
              {t('graphqltomongoose.include_timestamps', 'Timestamps Option ({ timestamps: true })')}
            </label>
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={includeTsInterfaces}
                onChange={(e) => setIncludeTsInterfaces(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
              />
              {t('graphqltomongoose.include_ts_interfaces', 'TypeScript Document Interfaces (export interface I...)')}
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
              <label htmlFor="graphql-mongoose-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('graphqltomongoose.graphql_input_label', 'GraphQL SDL Schema')}
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
            id="graphql-mongoose-input"
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setActivePresetId(null);
            }}
            placeholder={t('graphqltomongoose.placeholder_graphql', 'Paste GraphQL SDL schema here...')}
            className="w-full h-[450px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-500" aria-hidden="true" />
              <label htmlFor="mongoose-output" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('graphqltomongoose.output_label', 'Mongoose Schemas & Models')}
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
            id="mongoose-output"
            value={output}
            readOnly
            placeholder={t('graphqltomongoose.placeholder_output', 'Mongoose schemas will appear here...')}
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
          <h4 className="font-bold dark:text-white">{t('graphqltomongoose.about_title', 'About GraphQL SDL to Mongoose Converter')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('graphqltomongoose.about_text', 'Convert GraphQL Schema Definition Language (SDL) statements directly into Mongoose schemas (new Schema({...})), TypeScript interfaces (IUser extends Document), and model exports (model<IUser>(...)) for MongoDB applications.')}
          </p>
        </div>
      </div>
    </div>
  );
}
