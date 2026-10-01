import { useState, useEffect, useCallback, useRef } from 'react';
import { FileCode, Copy, Check, Trash2, AlertCircle, Download, Info, Settings, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;

export function GraphQLToJSONSchema({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [input, setInput] = useState(initialData?.input || '');
  const [output, setOutput] = useState(initialData?.output || '');
  const [draftVersion, setDraftVersion] = useState<'draft-07' | 'draft-2020-12'>(initialData?.draftVersion || 'draft-07');
  const [idType, setIdType] = useState<'string' | 'uuid'>(initialData?.idType || 'string');
  const [nullableMode, setNullableMode] = useState<'type_array' | 'nullable_prop'>(initialData?.nullableMode || 'type_array');
  const [rootType, setRootType] = useState<string>(initialData?.rootType || '');
  const [availableTypes, setAvailableTypes] = useState<string[]>([]);
  const [activePreset, setActivePreset] = useState<string | null>(initialData?.activePreset || null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({
      input,
      output,
      draftVersion,
      idType,
      nullableMode,
      rootType,
      activePreset
    });
  }, [input, output, draftVersion, idType, nullableMode, rootType, activePreset, onStateChange]);

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
}

union FeedItem = Post | Comment`
  };

  const convertGqlTypeToJSONSchema = (
    gqlTypeStr: string,
    customScalars: Set<string>,
    definedTypes: Set<string>
  ): { schema: any; isNonNull: boolean } => {
    const raw = gqlTypeStr.trim();
    const isNonNull = raw.endsWith('!');
    const typeWithoutOuterBang = isNonNull ? raw.slice(0, -1).trim() : raw;

    if (typeWithoutOuterBang.startsWith('[') && typeWithoutOuterBang.endsWith(']')) {
      const innerGql = typeWithoutOuterBang.slice(1, -1).trim();
      const innerConverted = convertGqlTypeToJSONSchema(innerGql, customScalars, definedTypes);
      let itemsSchema = innerConverted.schema;

      if (!innerConverted.isNonNull) {
        if (nullableMode === 'type_array') {
          if (Array.isArray(itemsSchema.type)) {
            if (!itemsSchema.type.includes('null')) {
              itemsSchema.type = [...itemsSchema.type, 'null'];
            }
          } else if (itemsSchema.type) {
            itemsSchema.type = [itemsSchema.type, 'null'];
          } else if (itemsSchema.$ref) {
            itemsSchema = {
              oneOf: [itemsSchema, { type: 'null' }]
            };
          }
        } else {
          itemsSchema.nullable = true;
        }
      }

      return {
        schema: {
          type: 'array',
          items: itemsSchema
        },
        isNonNull
      };
    }

    let base = typeWithoutOuterBang;
    let schema: any = {};

    if (base === 'String') {
      schema = { type: 'string' };
    } else if (base === 'Int') {
      schema = { type: 'integer' };
    } else if (base === 'Float') {
      schema = { type: 'number' };
    } else if (base === 'Boolean') {
      schema = { type: 'boolean' };
    } else if (base === 'ID') {
      schema = idType === 'uuid' ? { type: 'string', format: 'uuid' } : { type: 'string' };
    } else if (base === 'DateTime' || base === 'Date' || base === 'Timestamp') {
      schema = { type: 'string', format: 'date-time' };
    } else if (base === 'JSON' || base === 'JSONObject') {
      schema = { type: 'object' };
    } else if (customScalars.has(base)) {
      schema = {};
    } else if (definedTypes.has(base)) {
      schema = { $ref: `#/definitions/${base}` };
    } else {
      schema = { $ref: `#/definitions/${base}` };
    }

    return { schema, isNonNull };
  };

  const handleConvert = useCallback(() => {
    try {
      if (!input.trim()) {
        setOutput('');
        setError('');
        setAvailableTypes([]);
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

      const customScalars = new Set<string>();
      const scalarRegex = /scalar\s+([A-Za-z0-9_]+)/g;
      let scalarMatch: RegExpExecArray | null;
      while ((scalarMatch = scalarRegex.exec(cleanInput)) !== null) {
        if (scalarMatch[1]) customScalars.add(scalarMatch[1]);
      }

      const definedTypes = new Set<string>();
      const typeCollectRegex = /(type|interface|input|enum|union)\s+([A-Za-z0-9_]+)/g;
      let typeMatch;
      const detectedTypesList: string[] = [];

      while ((typeMatch = typeCollectRegex.exec(cleanInput)) !== null) {
        if (typeMatch[2]) {
          definedTypes.add(typeMatch[2]);
          detectedTypesList.push(typeMatch[2]);
        }
      }

      setAvailableTypes(detectedTypesList);

      const definitions: Record<string, any> = Object.create(null);

      // 1. Enums
      const enumRegex = /enum\s+([A-Za-z0-9_]+)\s*\{([^}]*)\}/g;
      let enumMatch;
      while ((enumMatch = enumRegex.exec(cleanInput)) !== null) {
        const enumName = enumMatch[1];
        const enumValues = enumMatch[2]
          .split(/\s+/)
          .map((v) => v.trim())
          .filter(Boolean);

        if (enumValues.length > 0) {
          definitions[enumName] = {
            type: 'string',
            enum: enumValues
          };
        }
      }

      // 2. Unions
      const unionRegex = /union\s+([A-Za-z0-9_]+)\s*=\s*([^;\n]+)/g;
      let unionMatch;
      while ((unionMatch = unionRegex.exec(cleanInput)) !== null) {
        const unionName = unionMatch[1];
        const typesList = unionMatch[2]
          .split('|')
          .map((t) => t.trim())
          .filter(Boolean);

        if (typesList.length > 0) {
          definitions[unionName] = {
            oneOf: typesList.map((tName) => ({ $ref: `#/definitions/${tName}` }))
          };
        }
      }

      // 3. Custom Scalars
      customScalars.forEach((scalarName) => {
        definitions[scalarName] = { type: 'string' };
      });

      // 4. Object Types, Interfaces, Inputs
      const structRegex = /(type|interface|input)\s+([A-Za-z0-9_]+)(?:\s+implements\s+[^{]+)?\s*\{([^}]*)\}/g;
      let structMatch;

      while ((structMatch = structRegex.exec(cleanInput)) !== null) {
        const name = structMatch[2];
        const body = structMatch[3];

        const normalizedBody = body
          .replace(/(!|[a-zA-Z0-9_\]]+)\s+([a-zA-Z0-9_$]+)\s*:/g, '$1\n$2:')
          .trim();

        const lines = normalizedBody
          .split('\n')
          .map((l) => l.trim())
          .filter((l) => l && !l.startsWith('#'));

        const properties: Record<string, any> = Object.create(null);
        const requiredFields: string[] = [];

        lines.forEach((line) => {
          const cleanLine = line.replace(/\([^)]*\)/, '');
          const colonIdx = cleanLine.indexOf(':');
          if (colonIdx === -1) return;

          const rawFieldName = cleanLine.substring(0, colonIdx).trim();
          const rawTypeStr = cleanLine.substring(colonIdx + 1).trim();

          if (!rawFieldName || !rawTypeStr) return;

          const { schema, isNonNull } = convertGqlTypeToJSONSchema(
            rawTypeStr,
            customScalars,
            definedTypes
          );

          let finalPropSchema = { ...schema };

          if (isNonNull) {
            requiredFields.push(rawFieldName);
          } else {
            if (nullableMode === 'type_array') {
              if (finalPropSchema.type) {
                if (Array.isArray(finalPropSchema.type)) {
                  if (!finalPropSchema.type.includes('null')) {
                    finalPropSchema.type = [...finalPropSchema.type, 'null'];
                  }
                } else {
                  finalPropSchema.type = [finalPropSchema.type, 'null'];
                }
              } else if (finalPropSchema.$ref) {
                finalPropSchema = {
                  oneOf: [{ $ref: finalPropSchema.$ref }, { type: 'null' }]
                };
              }
            } else {
              finalPropSchema.nullable = true;
            }
          }

          properties[rawFieldName] = finalPropSchema;
        });

        const structSchema: any = {
          type: 'object',
          properties,
          additionalProperties: false
        };

        if (requiredFields.length > 0) {
          structSchema.required = requiredFields;
        }

        definitions[name] = structSchema;
      }

      const keys = Object.keys(definitions);
      if (keys.length === 0) {
        setError(t('graphqltojsonschema.no_types_found', 'No valid GraphQL types, interfaces, inputs, or enums found.'));
        setOutput('');
        return;
      }

      const activeRoot = rootType && definitions[rootType] ? rootType : keys[0];

      const schemaUrl =
        draftVersion === 'draft-2020-12'
          ? 'https://json-schema.org/draft/2020-12/schema'
          : 'http://json-schema.org/draft-07/schema#';

      const jsonSchema: any = {
        $schema: schemaUrl,
        title: activeRoot,
        type: definitions[activeRoot]?.type || 'object',
        properties: definitions[activeRoot]?.properties || undefined,
        required: definitions[activeRoot]?.required || undefined,
        oneOf: definitions[activeRoot]?.oneOf || undefined,
        enum: definitions[activeRoot]?.enum || undefined,
        definitions
      };

      if (!jsonSchema.properties) delete jsonSchema.properties;
      if (!jsonSchema.required) delete jsonSchema.required;
      if (!jsonSchema.oneOf) delete jsonSchema.oneOf;
      if (!jsonSchema.enum) delete jsonSchema.enum;

      setOutput(JSON.stringify(jsonSchema, null, 2));
      setError('');
    } catch (e: any) {
      setError(t('graphqltojsonschema.error_parsing', 'Error parsing GraphQL schema') + ': ' + e.message);
      setOutput('');
    }
  }, [input, draftVersion, idType, nullableMode, rootType, t]);

  useEffect(() => {
    handleConvert();
  }, [handleConvert]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success(t('graphqltojsonschema.toast_copied', 'JSON Schema copied to clipboard!'));
    setTimeout(() => setCopied(false), 2000);
  }, [output, t]);

  const handleClear = useCallback(() => {
    setInput('');
    setOutput('');
    setError('');
    setActivePreset(null);
    setAvailableTypes([]);
    setRootType('');
    toast.success(t('graphqltojsonschema.toast_cleared', 'Inputs cleared!'));
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [t]);

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${rootType || 'schema'}.schema.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(t('common.downloaded', 'Downloaded .schema.json file!'));
  };

  const loadPreset = (presetKey: keyof typeof PRESETS) => {
    setInput(PRESETS[presetKey]);
    setActivePreset(presetKey);
    toast.success(t('graphqltojsonschema.preset_loaded', 'Loaded GraphQL preset!'));
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
      {/* Configuration Panel */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-6">
        <div className="flex items-center gap-2 px-1">
          <Settings className="w-4 h-4 text-indigo-500" aria-hidden="true" />
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">
            {t('graphqltojsonschema.options_title', 'JSON Schema Options')}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Draft Spec */}
          <div className="space-y-1.5">
            <label htmlFor="draft-version-select" className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {t('graphqltojsonschema.draft_version', 'JSON Schema Draft')}
            </label>
            <select
              id="draft-version-select"
              value={draftVersion}
              onChange={(e) => setDraftVersion(e.target.value as any)}
              className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold"
            >
              <option value="draft-07">Draft-07</option>
              <option value="draft-2020-12">2020-12</option>
            </select>
          </div>

          {/* Root Type Selector */}
          <div className="space-y-1.5">
            <label htmlFor="root-type-select" className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {t('graphqltojsonschema.root_type', 'Root Schema Type')}
            </label>
            <select
              id="root-type-select"
              value={rootType}
              onChange={(e) => setRootType(e.target.value)}
              disabled={availableTypes.length === 0}
              className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold disabled:opacity-50"
            >
              {availableTypes.length === 0 ? (
                <option value="">{t('graphqltojsonschema.no_types', 'No Types Detected')}</option>
              ) : (
                availableTypes.map((tName) => (
                  <option key={tName} value={tName}>
                    {tName}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* ID Type */}
          <div className="space-y-1.5">
            <label htmlFor="id-type-select" className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {t('graphqltojsonschema.id_type', 'GraphQL ID Scalar')}
            </label>
            <select
              id="id-type-select"
              value={idType}
              onChange={(e) => setIdType(e.target.value as any)}
              className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold"
            >
              <option value="string">string</option>
              <option value="uuid">string (format: uuid)</option>
            </select>
          </div>

          {/* Nullable Mode */}
          <div className="space-y-1.5">
            <label htmlFor="nullable-mode-select" className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {t('graphqltojsonschema.nullable_mode', 'Nullability Representation')}
            </label>
            <select
              id="nullable-mode-select"
              value={nullableMode}
              onChange={(e) => setNullableMode(e.target.value as any)}
              className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold"
            >
              <option value="type_array">type: ["string", "null"]</option>
              <option value="nullable_prop">nullable: true</option>
            </select>
          </div>
        </div>

        {/* Presets Bar */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" aria-hidden="true" />
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              {t('graphqltojsonschema.presets_title', 'Quick Start Presets:')}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => loadPreset('ecommerce')}
              aria-pressed={activePreset === 'ecommerce'}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none border ${
                activePreset === 'ecommerce'
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-500 text-slate-700 dark:text-slate-300'
              }`}
            >
              {t('graphqltojsonschema.preset_ecommerce', 'E-Commerce Catalog')}
            </button>
            <button
              onClick={() => loadPreset('user_auth')}
              aria-pressed={activePreset === 'user_auth'}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none border ${
                activePreset === 'user_auth'
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-500 text-slate-700 dark:text-slate-300'
              }`}
            >
              {t('graphqltojsonschema.preset_user_auth', 'User Management & Auth')}
            </button>
            <button
              onClick={() => loadPreset('social_feed')}
              aria-pressed={activePreset === 'social_feed'}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none border ${
                activePreset === 'social_feed'
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-500 text-slate-700 dark:text-slate-300'
              }`}
            >
              {t('graphqltojsonschema.preset_social_feed', 'Social Feed & Comments')}
            </button>
          </div>
        </div>
      </div>

      {/* Editor Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-indigo-500" aria-hidden="true" />
              <label htmlFor="graphql-jsonschema-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('graphqltojsonschema.graphql_input_label', 'GraphQL SDL Schema')}
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
            id="graphql-jsonschema-input"
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('graphqltojsonschema.placeholder_graphql', 'Paste GraphQL SDL schema here...')}
            className="w-full h-[450px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-emerald-500" aria-hidden="true" />
              <label htmlFor="jsonschema-output" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('graphqltojsonschema.output_label', 'Generated JSON Schema')}
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
            id="jsonschema-output"
            value={output}
            readOnly
            placeholder={t('graphqltojsonschema.placeholder_output', 'Generated JSON Schema will appear here...')}
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

      {/* Info Card */}
      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <Info className="w-6 h-6 text-indigo-500 mt-1 shrink-0" aria-hidden="true" />
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('graphqltojsonschema.about_title', 'About GraphQL SDL to JSON Schema Converter')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t(
              'graphqltojsonschema.about_text',
              'Convert GraphQL Schema Definition Language (SDL) statements (types, interfaces, inputs, enums, unions) directly into standard JSON Schema definitions supporting Draft-07 or 2020-12 specifications, root schema selection, and custom nullability configurations.'
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
