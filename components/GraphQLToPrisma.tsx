import { useState, useEffect, useCallback, useRef } from 'react';
import { Database, Copy, Check, Trash2, AlertCircle, Download, Info, Settings, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;

type Provider = 'postgresql' | 'mysql' | 'sqlite' | 'mongodb' | 'sqlserver' | 'cockroachdb';
type IdStrategy = 'autoincrement' | 'uuid' | 'cuid';

const PRISMA_RESERVED_KEYWORDS = new Set([
  'model', 'enum', 'datasource', 'generator', 'type', 'view',
  'String', 'Boolean', 'Int', 'Float', 'DateTime', 'Json', 'Bytes', 'BigInt', 'Decimal'
]);

interface GraphQLField {
  name: string;
  prismaName: string;
  type: string;
  isList: boolean;
  isRequired: boolean;
  isRelation: boolean;
  isEnum: boolean;
}

interface GraphQLType {
  name: string;
  pascalName: string;
  fields: GraphQLField[];
}

interface GraphQLEnum {
  name: string;
  pascalName: string;
  values: string[];
}

export function GraphQLToPrisma({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [input, setInput] = useState(initialData?.input || '');
  const [output, setOutput] = useState('');
  const [provider, setProvider] = useState<Provider>(initialData?.provider || 'postgresql');
  const [idStrategy, setIdStrategy] = useState<IdStrategy>(initialData?.idStrategy || 'autoincrement');
  const [addTimestamps, setAddTimestamps] = useState<boolean>(initialData?.addTimestamps ?? true);
  const [addSoftDelete, setAddSoftDelete] = useState<boolean>(initialData?.addSoftDelete ?? false);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ input, provider, idStrategy, addTimestamps, addSoftDelete });
  }, [input, provider, idStrategy, addTimestamps, addSoftDelete, onStateChange]);

  const sanitizeIdentifier = (str: string): string => {
    let clean = str.replace(/[^a-zA-Z0-9_]/g, '');
    if (/^[0-9]/.test(clean)) {
      clean = 'Model_' + clean;
    }
    if (PRISMA_RESERVED_KEYWORDS.has(clean) || clean === '__proto__' || clean === 'constructor' || clean === 'prototype') {
      clean = '_' + clean;
    }
    return clean || 'Item';
  };

  const toPascalCase = (str: string): string => {
    const cleaned = str.replace(/[^a-zA-Z0-9]/g, ' ');
    const result = cleaned
      .split(/\s+/)
      .filter(Boolean)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
    return sanitizeIdentifier(result || 'Model');
  };

  const toCamelCase = (str: string): string => {
    const pascal = toPascalCase(str);
    const camel = pascal.charAt(0).toLowerCase() + pascal.slice(1);
    return sanitizeIdentifier(camel);
  };

  const PRESETS = {
    ecommerce: `enum OrderStatus {
  PENDING
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
}

type Category {
  id: ID!
  name: String!
  slug: String!
  products: [Product!]!
}

type Product {
  id: ID!
  title: String!
  description: String
  price: Float!
  sku: String!
  category: Category!
  inStock: Boolean!
}

type Order {
  id: ID!
  total: Float!
  status: OrderStatus!
  products: [Product!]!
}`,
    user_auth: `enum Role {
  USER
  ADMIN
  MANAGER
}

type User {
  id: ID!
  email: String!
  name: String
  role: Role!
  profile: Profile
  posts: [Post!]!
}

type Profile {
  id: ID!
  bio: String
  avatarUrl: String
  user: User!
}`,
    social_feed: `type User {
  id: ID!
  username: String!
  email: String!
  posts: [Post!]!
  comments: [Comment!]!
}

type Post {
  id: ID!
  title: String!
  content: String!
  published: Boolean!
  author: User!
  comments: [Comment!]!
}

type Comment {
  id: ID!
  text: String!
  post: Post!
  author: User!
}`
  };

  const mapGraphQLScalarToPrisma = (gqlType: string): string => {
    switch (gqlType) {
      case 'ID':
      case 'String':
        return 'String';
      case 'Int':
        return 'Int';
      case 'Float':
        return 'Float';
      case 'Boolean':
        return 'Boolean';
      case 'DateTime':
      case 'Date':
      case 'Time':
      case 'Timestamp':
        return 'DateTime';
      case 'Json':
      case 'JSON':
      case 'JSONObject':
        return 'Json';
      case 'Bytes':
        return 'Bytes';
      case 'BigInt':
        return 'BigInt';
      case 'Decimal':
        return 'Decimal';
      default:
        return toPascalCase(gqlType);
    }
  };

  const generatePrismaSchema = useCallback(() => {
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
      // Strip multiline and inline comments
      const cleanInput = input
        .replace(/#.*$/gm, '')
        .replace(/"""[\s\S]*?"""/g, '')
        .replace(/"[\s\S]*?"/g, '');

      const enumRegex = /enum\s+([A-Za-z0-9_]+)\s*\{([^}]*)\}/g;
      const parsedEnums: GraphQLEnum[] = [];
      const enumNamesSet = new Set<string>();

      let enumMatch;
      while ((enumMatch = enumRegex.exec(cleanInput)) !== null) {
        const rawName = enumMatch[1];
        const pascalName = toPascalCase(rawName);
        const body = enumMatch[2];
        const values = body
          .split(/\s+/)
          .map(v => v.trim())
          .filter(v => v && !v.startsWith('#'))
          .map(v => sanitizeIdentifier(v));

        if (values.length > 0) {
          parsedEnums.push({ name: rawName, pascalName, values });
          enumNamesSet.add(pascalName);
          enumNamesSet.add(rawName);
        }
      }

      const typeRegex = /(?:type|input|interface)\s+([A-Za-z0-9_]+)(?:\s+implements\s+[A-Za-z0-9_,\s]+)?\s*\{([^}]*)\}/g;
      const parsedTypes: GraphQLType[] = [];
      const typeNamesSet = new Set<string>();

      let typeMatch;
      while ((typeMatch = typeRegex.exec(cleanInput)) !== null) {
        const rawName = typeMatch[1];
        const pascalName = toPascalCase(rawName);
        const body = typeMatch[2];

        if (rawName === 'Query' || rawName === 'Mutation' || rawName === 'Subscription') {
          continue;
        }

        typeNamesSet.add(pascalName);
        typeNamesSet.add(rawName);

        const fieldLines = body
          .split('\n')
          .map(l => l.trim())
          .filter(l => l && !l.startsWith('#'));

        const fields: GraphQLField[] = [];

        fieldLines.forEach(line => {
          const fieldMatch = line.match(/^([A-Za-z0-9_]+)(?:\([^)]*\))?\s*:\s*(\[?\s*([A-Za-z0-9_]+)\s*!?\s*\]?\s*!?)/);
          if (fieldMatch) {
            const rawFieldName = fieldMatch[1];
            const fullTypeSig = fieldMatch[2];
            const baseGqlType = fieldMatch[3];

            const isList = fullTypeSig.includes('[');
            const isRequired = fullTypeSig.endsWith('!');
            const prismaName = toCamelCase(rawFieldName);

            fields.push({
              name: rawFieldName,
              prismaName,
              type: baseGqlType,
              isList,
              isRequired,
              isRelation: false,
              isEnum: false
            });
          }
        });

        if (fields.length > 0) {
          parsedTypes.push({
            name: rawName,
            pascalName,
            fields
          });
        }
      }

      if (parsedTypes.length === 0 && parsedEnums.length === 0) {
        setError(t('graphqltoprisma.no_types_found', 'No valid GraphQL types, inputs, or enums found.'));
        setOutput('');
        return;
      }

      // Identify relations and enums
      parsedTypes.forEach(tItem => {
        tItem.fields.forEach(f => {
          const mappedName = toPascalCase(f.type);
          if (enumNamesSet.has(mappedName) || enumNamesSet.has(f.type)) {
            f.isEnum = true;
          } else if (typeNamesSet.has(mappedName) || typeNamesSet.has(f.type)) {
            f.isRelation = true;
          }
        });
      });

      // Construct Prisma Schema
      let schemaStr = `datasource db {\n  provider = "${provider}"\n  url      = env("DATABASE_URL")\n}\n\ngenerator client {\n  provider = "prisma-client-js"\n}\n\n`;

      // Output Enums
      parsedEnums.forEach(e => {
        schemaStr += `enum ${e.pascalName} {\n`;
        e.values.forEach(v => {
          schemaStr += `  ${v}\n`;
        });
        schemaStr += `}\n\n`;
      });

      // Track created foreign keys to build relational mappings
      const modelNames = new Set(parsedTypes.map(pt => pt.pascalName));

      parsedTypes.forEach(model => {
        schemaStr += `model ${model.pascalName} {\n`;

        const hasExplicitId = model.fields.some(f => f.prismaName === 'id' || f.name.toLowerCase() === 'id');

        if (!hasExplicitId) {
          const isMongo = provider === 'mongodb';
          if (isMongo) {
            schemaStr += `  id String @id @default(auto()) @map("_id") @db.ObjectId\n`;
          } else {
            const idType = idStrategy === 'autoincrement' ? 'Int' : 'String';
            const defaultAttr = idStrategy === 'autoincrement'
              ? '@default(autoincrement())'
              : (idStrategy === 'uuid' ? '@default(uuid())' : '@default(cuid())');
            schemaStr += `  id ${idType} @id ${defaultAttr}\n`;
          }
        }

        model.fields.forEach(f => {
          const fieldName = f.prismaName;
          const isIdField = fieldName === 'id' || f.name.toLowerCase() === 'id';

          if (isIdField) {
            const isMongo = provider === 'mongodb';
            if (isMongo) {
              schemaStr += `  id String @id @default(auto()) @map("_id") @db.ObjectId\n`;
            } else {
              const idType = f.type === 'Int' ? 'Int' : (idStrategy === 'autoincrement' ? 'Int' : 'String');
              const defaultAttr = idType === 'Int'
                ? '@default(autoincrement())'
                : (idStrategy === 'uuid' ? '@default(uuid())' : '@default(cuid())');
              schemaStr += `  ${fieldName} ${idType} @id ${defaultAttr}\n`;
            }
            return;
          }

          if (f.isRelation) {
            const targetModelName = toPascalCase(f.type);
            if (f.isList) {
              schemaStr += `  ${fieldName} ${targetModelName}[]\n`;
            } else {
              const fkFieldName = `${fieldName}Id`;
              const isMongo = provider === 'mongodb';
              const fkTypeStr = isMongo ? 'String @db.ObjectId' : (idStrategy === 'autoincrement' ? 'Int' : 'String');
              const optionalSym = f.isRequired ? '' : '?';

              schemaStr += `  ${fieldName} ${targetModelName}${optionalSym} @relation(fields: [${fkFieldName}], references: [id])\n`;
              schemaStr += `  ${fkFieldName} ${fkTypeStr}${optionalSym}\n`;
            }
          } else if (f.isEnum) {
            const enumTypeName = toPascalCase(f.type);
            const listSym = f.isList ? '[]' : (f.isRequired ? '' : '?');
            schemaStr += `  ${fieldName} ${enumTypeName}${listSym}\n`;
          } else {
            const prismaScalar = mapGraphQLScalarToPrisma(f.type);
            const listSym = f.isList ? '[]' : (f.isRequired ? '' : '?');
            schemaStr += `  ${fieldName} ${prismaScalar}${listSym}\n`;
          }
        });

        if (addTimestamps) {
          const hasCreatedAt = model.fields.some(f => f.prismaName.toLowerCase() === 'createdat');
          const hasUpdatedAt = model.fields.some(f => f.prismaName.toLowerCase() === 'updatedat');

          if (!hasCreatedAt) {
            schemaStr += `  createdAt DateTime @default(now())\n`;
          }
          if (!hasUpdatedAt) {
            schemaStr += `  updatedAt DateTime @updatedAt\n`;
          }
        }

        if (addSoftDelete) {
          const hasDeletedAt = model.fields.some(f => f.prismaName.toLowerCase() === 'deletedat');
          if (!hasDeletedAt) {
            schemaStr += `  deletedAt DateTime?\n`;
          }
        }

        schemaStr += `}\n\n`;
      });

      setOutput(schemaStr.trim());
      setError(null);
    } catch (e: any) {
      setError(t('graphqltoprisma.error_parsing', 'Error parsing GraphQL schema') + ': ' + e.message);
      setOutput('');
    }
  }, [input, provider, idStrategy, addTimestamps, addSoftDelete, t]);

  useEffect(() => {
    generatePrismaSchema();
  }, [generatePrismaSchema]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success(t('graphqltoprisma.toast_copied', 'Prisma Schema copied to clipboard!'));
    setTimeout(() => setCopied(false), 2000);
  }, [output, t]);

  const handleClear = useCallback(() => {
    setInput('');
    setOutput('');
    setError(null);
    setActivePresetId(null);
    toast.success(t('graphqltoprisma.toast_cleared', 'Inputs cleared!'));
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
    toast.success(t('common.downloaded', 'Downloaded schema.prisma!'));
  };

  const loadPreset = (presetKey: keyof typeof PRESETS) => {
    setInput(PRESETS[presetKey]);
    setActivePresetId(presetKey);
    toast.success(t('graphqltoprisma.preset_loaded', 'Loaded GraphQL preset!'));
  };

  const handlersRef = useRef({ handleClear, handleCopy, output });
  useEffect(() => {
    handlersRef.current = { handleClear, handleCopy, output };
  }, [handleClear, handleCopy, output]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      if (containerRef.current && !containerRef.current.contains(activeElement) && activeElement !== document.body) {
        return;
      }

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
    <div ref={containerRef} className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Presets Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" aria-hidden="true" />
          <span className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('graphqltoprisma.presets_title', 'Quick Start Presets:')}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => loadPreset('ecommerce')}
            aria-pressed={activePresetId === 'ecommerce'}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none border ${
              activePresetId === 'ecommerce'
                ? 'bg-indigo-600 text-white border-indigo-600 dark:bg-indigo-500 dark:border-indigo-500'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-500'
            }`}
          >
            {t('graphqltoprisma.preset_ecommerce', 'E-Commerce Catalog')}
          </button>
          <button
            onClick={() => loadPreset('user_auth')}
            aria-pressed={activePresetId === 'user_auth'}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none border ${
              activePresetId === 'user_auth'
                ? 'bg-indigo-600 text-white border-indigo-600 dark:bg-indigo-500 dark:border-indigo-500'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-500'
            }`}
          >
            {t('graphqltoprisma.preset_user_auth', 'User Management & Auth')}
          </button>
          <button
            onClick={() => loadPreset('social_feed')}
            aria-pressed={activePresetId === 'social_feed'}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none border ${
              activePresetId === 'social_feed'
                ? 'bg-indigo-600 text-white border-indigo-600 dark:bg-indigo-500 dark:border-indigo-500'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-500'
            }`}
          >
            {t('graphqltoprisma.preset_social_feed', 'Social Feed & Comments')}
          </button>
        </div>
      </div>

      {/* Options Panel */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-5 bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="space-y-1.5">
          <label htmlFor="gql-prisma-provider" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('graphqltoprisma.provider', 'Database Provider')}
          </label>
          <select
            id="gql-prisma-provider"
            value={provider}
            onChange={(e) => setProvider(e.target.value as Provider)}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="postgresql">PostgreSQL</option>
            <option value="mysql">MySQL</option>
            <option value="sqlite">SQLite</option>
            <option value="mongodb">MongoDB</option>
            <option value="sqlserver">SQL Server</option>
            <option value="cockroachdb">CockroachDB</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="gql-prisma-id-strategy" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('graphqltoprisma.id_strategy', 'ID Strategy')}
          </label>
          <select
            id="gql-prisma-id-strategy"
            value={idStrategy}
            disabled={provider === 'mongodb'}
            onChange={(e) => setIdStrategy(e.target.value as IdStrategy)}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            <option value="autoincrement">autoincrement()</option>
            <option value="uuid">uuid()</option>
            <option value="cuid">cuid()</option>
          </select>
        </div>

        <div className="flex items-center gap-3 pt-6">
          <input
            id="gql-add-timestamps"
            type="checkbox"
            checked={addTimestamps}
            onChange={(e) => setAddTimestamps(e.target.checked)}
            className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
          />
          <label htmlFor="gql-add-timestamps" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
            {t('graphqltoprisma.add_timestamps', 'Include createdAt & updatedAt')}
          </label>
        </div>

        <div className="flex items-center gap-3 pt-6">
          <input
            id="gql-add-soft-delete"
            type="checkbox"
            checked={addSoftDelete}
            onChange={(e) => setAddSoftDelete(e.target.checked)}
            className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
          />
          <label htmlFor="gql-add-soft-delete" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
            {t('graphqltoprisma.add_soft_delete', 'Include deletedAt')}
          </label>
        </div>
      </div>

      {/* Editor Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-500" aria-hidden="true" />
              <label htmlFor="graphql-prisma-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('graphqltoprisma.graphql_input_label', 'GraphQL SDL Schema')}
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
            id="graphql-prisma-input"
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('graphqltoprisma.placeholder_graphql', 'Paste GraphQL SDL schema definitions here...')}
            className="w-full h-[450px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-500" aria-hidden="true" />
              <label htmlFor="prisma-output" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('graphqltoprisma.output_label', 'Generated schema.prisma')}
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
            id="prisma-output"
            value={output}
            readOnly
            placeholder={t('graphqltoprisma.placeholder_output', 'Prisma Schema models will appear here...')}
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
          <h4 className="font-bold dark:text-white">{t('graphqltoprisma.about_title', 'About GraphQL to Prisma Schema Converter')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('graphqltoprisma.about_text', 'Convert GraphQL Schema Definition Language (SDL) statements into fully configured Prisma Schema model definitions. Automatically extracts object types, interfaces, enums, list relations, and handles foreign key mappings across PostgreSQL, MySQL, SQLite, MongoDB, SQL Server, and CockroachDB.')}
          </p>
        </div>
      </div>
    </div>
  );
}
