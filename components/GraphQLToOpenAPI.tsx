import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { FileCode, Copy, Check, RotateCw, Sparkles, BookOpen, ChevronRight, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;

interface Preset {
  id: string;
  nameKey: string;
  descriptionKey: string;
  schema: string;
}

const PRESETS: Preset[] = [
  {
    id: 'ecommerce',
    nameKey: 'graphqltoopenapi.preset_ecommerce_title',
    descriptionKey: 'graphqltoopenapi.preset_ecommerce_desc',
    schema: `type Product {
  id: ID!
  title: String!
  description: String
  price: Float!
  inStock: Boolean!
  tags: [String!]
  category: Category
}

type Category {
  id: ID!
  name: String!
  slug: String!
}

enum OrderStatus {
  PENDING
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
}

type Order {
  id: ID!
  items: [Product!]!
  totalAmount: Float!
  status: OrderStatus!
  createdAt: String!
}

type Query {
  product(id: ID!): Product
  products(category: String, limit: Int): [Product!]!
  order(id: ID!): Order
}

type Mutation {
  createOrder(productIds: [ID!]!): Order!
  updateOrderStatus(id: ID!, status: OrderStatus!): Order!
}`
  },
  {
    id: 'user_auth',
    nameKey: 'graphqltoopenapi.preset_user_auth_title',
    descriptionKey: 'graphqltoopenapi.preset_user_auth_desc',
    schema: `enum UserRole {
  ADMIN
  MEMBER
  GUEST
}

type User {
  id: ID!
  username: String!
  email: String!
  role: UserRole!
  isActive: Boolean!
  profile: UserProfile
}

type UserProfile {
  bio: String
  avatarUrl: String
  website: String
}

type AuthPayload {
  token: String!
  user: User!
}

type Query {
  me: User
  user(id: ID!): User
}

type Mutation {
  login(email: String!, password: String!): AuthPayload!
  register(username: String!, email: String!, password: String!): AuthPayload!
}`
  },
  {
    id: 'social_feed',
    nameKey: 'graphqltoopenapi.preset_social_feed_title',
    descriptionKey: 'graphqltoopenapi.preset_social_feed_desc',
    schema: `type Author {
  id: ID!
  name: String!
  handle: String!
}

type Comment {
  id: ID!
  content: String!
  author: Author!
  createdAt: String!
}

type Post {
  id: ID!
  title: String!
  body: String!
  author: Author!
  likesCount: Int!
  comments: [Comment!]!
  createdAt: String!
}

type Query {
  feed(limit: Int, offset: Int): [Post!]!
  post(id: ID!): Post
}

type Mutation {
  createPost(title: String!, body: String!): Post!
  likePost(id: ID!): Post!
}`
  }
];

function applyCasing(str: string, casing: 'camelCase' | 'snake_case' | 'PascalCase' | 'original'): string {
  if (casing === 'original') return str;
  const words = str.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[^a-zA-Z0-9]/g, ' ').trim().split(/\s+/);
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
}

export function GraphQLToOpenAPI({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [inputSchema, setInputSchema] = useState<string>(initialData?.inputSchema ?? PRESETS[0].schema);
  const [openApiVersion, setOpenApiVersion] = useState<'3.0.3' | '3.1.0'>(initialData?.openApiVersion ?? '3.0.3');
  const [outputFormat, setOutputFormat] = useState<'yaml' | 'json'>(initialData?.outputFormat ?? 'yaml');
  const [propertyCasing, setPropertyCasing] = useState<'camelCase' | 'snake_case' | 'PascalCase' | 'original'>(initialData?.propertyCasing ?? 'original');
  const [generatePaths, setGeneratePaths] = useState<boolean>(initialData?.generatePaths ?? true);
  const [apiTitle, setApiTitle] = useState<string>(initialData?.apiTitle ?? 'GraphQL Generated API');
  const [apiVersion, setApiVersion] = useState<string>(initialData?.apiVersion ?? '1.0.0');
  const [activePresetId, setActivePresetId] = useState<string | null>(initialData?.activePresetId ?? PRESETS[0].id);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    onStateChange?.({
      inputSchema,
      openApiVersion,
      outputFormat,
      propertyCasing,
      generatePaths,
      apiTitle,
      apiVersion,
      activePresetId
    });
  }, [inputSchema, openApiVersion, outputFormat, propertyCasing, generatePaths, apiTitle, apiVersion, activePresetId, onStateChange]);

  const convertGraphQLToOpenAPI = useCallback((
    schemaText: string,
    version: '3.0.3' | '3.1.0',
    format: 'yaml' | 'json',
    casing: 'camelCase' | 'snake_case' | 'PascalCase' | 'original',
    genPaths: boolean,
    title: string,
    vStr: string
  ): string => {
    if (!schemaText.trim()) return '';
    if (schemaText.length > MAX_LENGTH) {
      return format === 'json'
        ? JSON.stringify({ error: t('graphqltoopenapi.dos_limit') }, null, 2)
        : `error: "${t('graphqltoopenapi.dos_limit')}"`;
    }

    try {
      const typesMap = Object.create(null) as Record<string, { kind: string; fields: { name: string; type: string; isList: boolean; isNonNull: boolean }[]; values?: string[] }>;
      const cleanSchema = schemaText.replace(/#.*$/gm, '');

      // Parse Enums
      const enumRegex = /enum\s+([A-Za-z0-9_]+)\s*\{([^}]+)\}/g;
      let enumMatch;
      while ((enumMatch = enumRegex.exec(cleanSchema)) !== null) {
        const enumName = enumMatch[1];
        const enumBody = enumMatch[2];
        const values = enumBody.split(/\s+/).map(v => v.trim()).filter(Boolean);
        typesMap[enumName] = { kind: 'ENUM', fields: [], values };
      }

      // Parse Types/Inputs
      const typeRegex = /(?:type|input)\s+([A-Za-z0-9_]+)\s*(?:implements\s+[A-Za-z0-9_&\s]+)?\s*\{([^}]+)\}/g;
      let typeMatch;
      while ((typeMatch = typeRegex.exec(cleanSchema)) !== null) {
        const typeName = typeMatch[1];
        const typeBody = typeMatch[2];
        const fieldLines = typeBody.split('\n').map(l => l.trim()).filter(Boolean);
        const fields: { name: string; type: string; isList: boolean; isNonNull: boolean }[] = [];

        for (const line of fieldLines) {
          const fieldMatch = line.match(/^([A-Za-z0-9_]+)(?:\([^)]*\))?\s*:\s*(\[?[A-Za-z0-9_!]+\]?!?)/);
          if (fieldMatch) {
            const rawName = fieldMatch[1];
            const rawTypeStr = fieldMatch[2];

            const isNonNull = rawTypeStr.endsWith('!');
            const unwrappedNonNull = isNonNull ? rawTypeStr.slice(0, -1) : rawTypeStr;
            const isList = unwrappedNonNull.startsWith('[') && unwrappedNonNull.endsWith(']');
            const baseType = unwrappedNonNull.replace(/[[\]!]/g, '');

            fields.push({
              name: applyCasing(rawName, casing),
              type: baseType,
              isList,
              isNonNull
            });
          }
        }

        typesMap[typeName] = { kind: 'OBJECT', fields };
      }

      // Build OpenAPI Schemas
      const schemasObj = Object.create(null) as Record<string, any>;

      const mapScalarToOpenAPI = (scalarName: string): any => {
        switch (scalarName) {
          case 'Int':
            return { type: 'integer', format: 'int32' };
          case 'Float':
            return { type: 'number', format: 'float' };
          case 'Boolean':
            return { type: 'boolean' };
          case 'ID':
            return { type: 'string', format: 'uuid' };
          case 'String':
          default:
            return { type: 'string' };
        }
      };

      for (const [typeName, typeDef] of Object.entries(typesMap)) {
        if (typeName === 'Query' || typeName === 'Mutation' || typeName === 'Subscription') continue;

        if (typeDef.kind === 'ENUM') {
          schemasObj[typeName] = {
            type: 'string',
            enum: typeDef.values || []
          };
          continue;
        }

        const properties = Object.create(null);
        const requiredFields: string[] = [];

        for (const field of typeDef.fields) {
          if (field.isNonNull) {
            requiredFields.push(field.name);
          }

          let propSchema: any;
          if (typesMap[field.type]) {
            propSchema = { $ref: `#/components/schemas/${field.type}` };
          } else {
            propSchema = mapScalarToOpenAPI(field.type);
          }

          if (field.isList) {
            properties[field.name] = {
              type: 'array',
              items: propSchema
            };
          } else {
            properties[field.name] = propSchema;
          }
        }

        const schemaDef: any = {
          type: 'object',
          properties
        };
        if (requiredFields.length > 0) {
          schemaDef.required = requiredFields;
        }
        schemasObj[typeName] = schemaDef;
      }

      // Build OpenAPI Paths from Query / Mutation
      const pathsObj = Object.create(null) as Record<string, any>;

      if (genPaths) {
        if (typesMap['Query']) {
          for (const field of typesMap['Query'].fields) {
            const pathName = `/${field.name.toLowerCase()}`;
            const responseSchema = field.isList
              ? { type: 'array', items: typesMap[field.type] ? { $ref: `#/components/schemas/${field.type}` } : mapScalarToOpenAPI(field.type) }
              : (typesMap[field.type] ? { $ref: `#/components/schemas/${field.type}` } : mapScalarToOpenAPI(field.type));

            pathsObj[pathName] = {
              get: {
                summary: `Retrieve ${field.name}`,
                operationId: `get_${field.name}`,
                responses: {
                  '200': {
                    description: 'Successful response',
                    content: {
                      'application/json': {
                        schema: responseSchema
                      }
                    }
                  }
                }
              }
            };
          }
        }

        if (typesMap['Mutation']) {
          for (const field of typesMap['Mutation'].fields) {
            const pathName = `/${field.name.toLowerCase()}`;
            const responseSchema = field.isList
              ? { type: 'array', items: typesMap[field.type] ? { $ref: `#/components/schemas/${field.type}` } : mapScalarToOpenAPI(field.type) }
              : (typesMap[field.type] ? { $ref: `#/components/schemas/${field.type}` } : mapScalarToOpenAPI(field.type));

            pathsObj[pathName] = {
              post: {
                summary: `Execute ${field.name}`,
                operationId: `post_${field.name}`,
                requestBody: {
                  required: true,
                  content: {
                    'application/json': {
                      schema: {
                        type: 'object',
                        properties: {}
                      }
                    }
                  }
                },
                responses: {
                  '200': {
                    description: 'Successful mutation',
                    content: {
                      'application/json': {
                        schema: responseSchema
                      }
                    }
                  }
                }
              }
            };
          }
        }
      }

      const openApiSpec = {
        openapi: version,
        info: {
          title: title.trim() || 'GraphQL Generated API',
          version: vStr.trim() || '1.0.0',
          description: 'OpenAPI specification auto-generated from GraphQL SDL Schema'
        },
        paths: pathsObj,
        components: {
          schemas: schemasObj
        }
      };

      if (format === 'json') {
        return JSON.stringify(openApiSpec, null, 2);
      } else {
        // Output clean YAML format
        let yamlStr = `openapi: "${openApiSpec.openapi}"\n`;
        yamlStr += `info:\n  title: "${openApiSpec.info.title}"\n  version: "${openApiSpec.info.version}"\n  description: "${openApiSpec.info.description}"\n`;

        yamlStr += `paths:\n`;
        if (Object.keys(pathsObj).length === 0) {
          yamlStr += `  {}\n`;
        } else {
          for (const [p, pDef] of Object.entries(pathsObj)) {
            yamlStr += `  ${p}:\n`;
            for (const [method, mDef] of Object.entries(pDef as any)) {
              yamlStr += `    ${method}:\n`;
              yamlStr += `      summary: "${(mDef as any).summary}"\n`;
              yamlStr += `      operationId: "${(mDef as any).operationId}"\n`;
              if ((mDef as any).requestBody) {
                yamlStr += `      requestBody:\n        required: true\n        content:\n          application/json:\n            schema:\n              type: object\n`;
              }
              yamlStr += `      responses:\n        '200':\n          description: "${(mDef as any).responses['200'].description}"\n          content:\n            application/json:\n              schema:\n`;
              const sch = (mDef as any).responses['200'].content['application/json'].schema;
              if (sch.$ref) {
                yamlStr += `                $ref: "${sch.$ref}"\n`;
              } else if (sch.type === 'array') {
                yamlStr += `                type: array\n                items:\n`;
                if (sch.items.$ref) {
                  yamlStr += `                  $ref: "${sch.items.$ref}"\n`;
                } else {
                  yamlStr += `                  type: ${sch.items.type}\n`;
                }
              } else {
                yamlStr += `                type: ${sch.type}\n`;
              }
            }
          }
        }

        yamlStr += `components:\n  schemas:\n`;
        for (const [sName, sDef] of Object.entries(schemasObj)) {
          yamlStr += `    ${sName}:\n`;
          if (sDef.type === 'string' && sDef.enum) {
            yamlStr += `      type: string\n      enum:\n`;
            for (const ev of sDef.enum) {
              yamlStr += `        - "${ev}"\n`;
            }
          } else {
            yamlStr += `      type: object\n`;
            if (sDef.required && sDef.required.length > 0) {
              yamlStr += `      required:\n`;
              for (const req of sDef.required) {
                yamlStr += `        - ${req}\n`;
              }
            }
            yamlStr += `      properties:\n`;
            for (const [propName, propDef] of Object.entries(sDef.properties as any)) {
              yamlStr += `        ${propName}:\n`;
              if ((propDef as any).$ref) {
                yamlStr += `          $ref: "${(propDef as any).$ref}"\n`;
              } else if ((propDef as any).type === 'array') {
                yamlStr += `          type: array\n          items:\n`;
                if ((propDef as any).items.$ref) {
                  yamlStr += `            $ref: "${(propDef as any).items.$ref}"\n`;
                } else {
                  yamlStr += `            type: ${(propDef as any).items.type}\n`;
                  if ((propDef as any).items.format) {
                    yamlStr += `            format: ${(propDef as any).items.format}\n`;
                  }
                }
              } else {
                yamlStr += `          type: ${(propDef as any).type}\n`;
                if ((propDef as any).format) {
                  yamlStr += `          format: ${(propDef as any).format}\n`;
                }
              }
            }
          }
        }

        return yamlStr;
      }
    } catch (err: any) {
      return format === 'json'
        ? JSON.stringify({ error: err?.message || 'Invalid GraphQL SDL syntax' }, null, 2)
        : `error: "${err?.message || 'Invalid GraphQL SDL syntax'}"`;
    }
  }, [t]);

  const outputCode = useMemo(() => {
    return convertGraphQLToOpenAPI(
      inputSchema,
      openApiVersion,
      outputFormat,
      propertyCasing,
      generatePaths,
      apiTitle,
      apiVersion
    );
  }, [inputSchema, openApiVersion, outputFormat, propertyCasing, generatePaths, apiTitle, apiVersion, convertGraphQLToOpenAPI]);

  const handleCopy = useCallback(() => {
    if (!outputCode) return;
    navigator.clipboard.writeText(outputCode);
    setCopied(true);
    toast.success(t('graphqltoopenapi.copied_toast'));
    setTimeout(() => setCopied(false), 2000);
  }, [outputCode, t]);

  const handleClear = useCallback(() => {
    setInputSchema('');
    setActivePresetId(null);
    toast.success(t('graphqltoopenapi.cleared_toast'));
    inputRef.current?.focus();
  }, [t]);

  const handleSelectPreset = useCallback((preset: Preset) => {
    setInputSchema(preset.schema);
    setActivePresetId(preset.id);
    toast.success(t('graphqltoopenapi.preset_loaded_toast'));
  }, [t]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputSchema(e.target.value);
    setActivePresetId(null);
  }, []);

  const handlersRef = useRef({ handleClear, handleCopy });
  useEffect(() => {
    handlersRef.current = { handleClear, handleCopy };
  }, [handleClear, handleCopy]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isEditable =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement instanceof HTMLSelectElement ||
        activeElement?.getAttribute('contenteditable') === 'true';

      const { handleClear, handleCopy } = handlersRef.current;

      if (isEditable && e.key !== 'Escape') return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        handleClear();
      } else if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handleCopy();
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('keydown', handleKeyDown);
      return () => container.removeEventListener('keydown', handleKeyDown);
    }
  }, []);

  return (
    <div ref={containerRef} tabIndex={-1} className="max-w-6xl mx-auto space-y-8 outline-none">
      {/* Quick Start Presets */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 px-1">
          <Sparkles className="w-4 h-4 text-indigo-500" />
          <span>{t('graphqltoopenapi.presets_title')}</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleSelectPreset(preset)}
              aria-pressed={activePresetId === preset.id}
              className={`p-4 rounded-2xl text-left transition-all border flex flex-col justify-between space-y-2 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                activePresetId === preset.id
                  ? 'bg-indigo-50/80 dark:bg-indigo-900/30 border-indigo-500 text-indigo-900 dark:text-indigo-200 shadow-sm'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-300 dark:hover:border-indigo-700'
              }`}
            >
              <div className="font-bold text-sm flex items-center justify-between">
                <span>{t(preset.nameKey)}</span>
                {activePresetId === preset.id && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {t(preset.descriptionKey)}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Configuration Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800">
        <div className="space-y-2">
          <label htmlFor="openapi-version" className="text-xs font-bold text-slate-400 uppercase tracking-widest block">
            {t('graphqltoopenapi.label_version')}
          </label>
          <select
            id="openapi-version"
            value={openApiVersion}
            onChange={(e) => setOpenApiVersion(e.target.value as '3.0.3' | '3.1.0')}
            className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:border-indigo-500 outline-none"
          >
            <option value="3.0.3">OpenAPI 3.0.3</option>
            <option value="3.1.0">OpenAPI 3.1.0</option>
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="openapi-format" className="text-xs font-bold text-slate-400 uppercase tracking-widest block">
            {t('graphqltoopenapi.label_format')}
          </label>
          <select
            id="openapi-format"
            value={outputFormat}
            onChange={(e) => setOutputFormat(e.target.value as 'yaml' | 'json')}
            className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:border-indigo-500 outline-none"
          >
            <option value="yaml">YAML Spec</option>
            <option value="json">JSON Spec</option>
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="openapi-casing" className="text-xs font-bold text-slate-400 uppercase tracking-widest block">
            {t('graphqltoopenapi.label_casing')}
          </label>
          <select
            id="openapi-casing"
            value={propertyCasing}
            onChange={(e) => setPropertyCasing(e.target.value as any)}
            className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:border-indigo-500 outline-none"
          >
            <option value="original">Original</option>
            <option value="camelCase">camelCase</option>
            <option value="snake_case">snake_case</option>
            <option value="PascalCase">PascalCase</option>
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="api-title" className="text-xs font-bold text-slate-400 uppercase tracking-widest block">
            {t('graphqltoopenapi.label_title')}
          </label>
          <input
            id="api-title"
            type="text"
            value={apiTitle}
            onChange={(e) => setApiTitle(e.target.value)}
            className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 focus:border-indigo-500 outline-none"
            placeholder="My API"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="api-version" className="text-xs font-bold text-slate-400 uppercase tracking-widest block">
            {t('graphqltoopenapi.label_api_version')}
          </label>
          <input
            id="api-version"
            type="text"
            value={apiVersion}
            onChange={(e) => setApiVersion(e.target.value)}
            className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 focus:border-indigo-500 outline-none"
            placeholder="1.0.0"
          />
        </div>

        <div className="space-y-2 flex flex-col justify-end">
          <label htmlFor="toggle-generate-paths" className="flex items-center gap-2 cursor-pointer p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-indigo-500 transition-all">
            <input
              id="toggle-generate-paths"
              type="checkbox"
              checked={generatePaths}
              onChange={(e) => setGeneratePaths(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 border-slate-300"
            />
            <span>{t('graphqltoopenapi.label_paths')}</span>
          </label>
        </div>
      </div>

      {/* Editor Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Column */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <label htmlFor="graphql-openapi-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 cursor-pointer">
              <FileCode className="w-4 h-4 text-indigo-500" />
              <span>{t('graphqltoopenapi.input_label')}</span>
            </label>
            <div className="flex items-center gap-2">
              <Kbd modifier={null} className="hidden sm:inline-flex text-rose-400 border-rose-200 dark:border-rose-800">Esc</Kbd>
              <button
                onClick={handleClear}
                disabled={!inputSchema}
                className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-40 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>{t('common.clear')}</span>
              </button>
            </div>
          </div>

          <textarea
            id="graphql-openapi-input"
            ref={inputRef}
            value={inputSchema}
            onChange={handleInputChange}
            placeholder={t('graphqltoopenapi.input_placeholder')}
            rows={18}
            className="w-full p-4 bg-slate-900 text-slate-100 rounded-3xl border border-slate-800 font-mono text-sm leading-relaxed focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all resize-y shadow-inner"
          />
        </div>

        {/* Output Column */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <label htmlFor="openapi-output" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 cursor-pointer">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              <span>{t('graphqltoopenapi.output_label')}</span>
            </label>
            <div className="flex items-center gap-2">
              <Kbd modifier={null} className="hidden sm:inline-flex text-indigo-400 border-indigo-200 dark:border-indigo-800">C</Kbd>
              <button
                onClick={handleCopy}
                disabled={!outputCode}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                  copied
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                    : 'text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20'
                } disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? t('common.copied') : t('common.copy')}</span>
              </button>
            </div>
          </div>

          <textarea
            id="openapi-output"
            readOnly
            value={outputCode}
            rows={18}
            className="w-full p-4 bg-slate-950 text-indigo-300 rounded-3xl border border-slate-800 font-mono text-sm leading-relaxed outline-none resize-y shadow-inner"
          />
        </div>
      </div>

      {/* Educational Information Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-200 dark:border-slate-800">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
            <BookOpen className="w-4 h-4" />
            <h3>{t('graphqltoopenapi.edu_title_1')}</h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('graphqltoopenapi.edu_desc_1')}
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
            <Zap className="w-4 h-4" />
            <h3>{t('graphqltoopenapi.edu_title_2')}</h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('graphqltoopenapi.edu_desc_2')}
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
            <ChevronRight className="w-4 h-4" />
            <h3>{t('graphqltoopenapi.edu_title_3')}</h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('graphqltoopenapi.edu_desc_3')}
          </p>
        </div>
      </div>
    </div>
  );
}
