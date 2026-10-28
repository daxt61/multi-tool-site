import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Copy, Check, Trash2, Download, Database, Sparkles, BookOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;

const TS_RESERVED_KEYWORDS = new Set([
  'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default', 'delete',
  'do', 'else', 'enum', 'export', 'extends', 'false', 'finally', 'for', 'function', 'if',
  'import', 'in', 'instanceof', 'new', 'null', 'return', 'super', 'switch', 'this', 'throw',
  'true', 'try', 'typeof', 'var', 'void', 'while', 'with', 'yield', 'let', 'static', 'yield',
  'abstract', 'as', 'asserts', 'any', 'async', 'await', 'boolean', 'constructor', 'declare',
  'get', 'infer', 'is', 'keyof', 'module', 'namespace', 'never', 'readonly', 'require',
  'number', 'object', 'set', 'string', 'symbol', 'type', 'undefined', 'unique', 'unknown',
  'from', 'of', 'interface', 'implements', 'package', 'private', 'protected', 'public'
]);

function sanitizeIdentifier(name: string): string {
  let sanitized = name.replace(/[^a-zA-Z0-9_$]/g, '_');
  if (/^[0-9]/.test(sanitized)) {
    sanitized = `_${sanitized}`;
  }
  if (TS_RESERVED_KEYWORDS.has(sanitized)) {
    sanitized = `${sanitized}_`;
  }
  return sanitized;
}

function escapeJsString(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}

function convertCasing(str: string, casing: 'camelCase' | 'snake_case' | 'PascalCase' | 'original'): string {
  if (casing === 'original') return str;

  // Split into words
  const words = str
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .split(/\s+/);

  if (words.length === 0 || words[0] === '') return str;

  if (casing === 'camelCase') {
    return words[0].toLowerCase() + words.slice(1).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
  }
  if (casing === 'PascalCase') {
    return words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
  }
  if (casing === 'snake_case') {
    return words.map(w => w.toLowerCase()).join('_');
  }
  return str;
}

interface Preset {
  id: string;
  nameKey: string;
  sdl: string;
}

const PRESETS: Preset[] = [
  {
    id: 'ecommerce',
    nameKey: 'graphqltomikroorm.preset_ecommerce',
    sdl: `enum OrderStatus {
  PENDING
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
}

type Category {
  id: ID!
  name: String!
  description: String
  products: [Product!]!
}

type Product {
  id: ID!
  title: String!
  price: Float!
  inventory: Int!
  isAvailable: Boolean!
  category: Category!
}

type Order {
  id: ID!
  orderNumber: String!
  totalAmount: Float!
  status: OrderStatus!
  placedAt: String!
}`
  },
  {
    id: 'user_auth',
    nameKey: 'graphqltomikroorm.preset_user_auth',
    sdl: `enum UserRole {
  ADMIN
  MEMBER
  GUEST
}

type User {
  id: ID!
  email: String!
  username: String!
  role: UserRole!
  isActive: Boolean!
  bio: String
  posts: [Post!]!
}

type Post {
  id: ID!
  title: String!
  content: String!
  published: Boolean!
  author: User!
}`
  },
  {
    id: 'social_feed',
    nameKey: 'graphqltomikroorm.preset_social_feed',
    sdl: `type Author {
  id: ID!
  handle: String!
  displayName: String!
  comments: [Comment!]!
}

type Comment {
  id: ID!
  body: String!
  likesCount: Int!
  author: Author!
}`
  }
];

export function GraphQLToMikroORM({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { t } = useTranslation();

  const [inputSdl, setInputSdl] = useState<string>(
    initialData?.inputSdl || PRESETS[0].sdl
  );
  const [driver, setDriver] = useState<'postgresql' | 'mysql' | 'sqlite' | 'mongo'>(
    initialData?.driver || 'postgresql'
  );
  const [idType, setIdType] = useState<'serial' | 'uuid' | 'objectid'>(
    initialData?.idType || 'serial'
  );
  const [fieldCasing, setFieldCasing] = useState<'camelCase' | 'snake_case' | 'PascalCase' | 'original'>(
    initialData?.fieldCasing || 'camelCase'
  );
  const [useTimestamps, setUseTimestamps] = useState<boolean>(
    initialData?.useTimestamps ?? true
  );
  const [useSoftDelete, setUseSoftDelete] = useState<boolean>(
    initialData?.useSoftDelete ?? false
  );
  const [activePresetId, setActivePresetId] = useState<string | null>(
    initialData?.activePresetId || 'ecommerce'
  );

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({
      inputSdl,
      driver,
      idType,
      fieldCasing,
      useTimestamps,
      useSoftDelete,
      activePresetId
    });
  }, [inputSdl, driver, idType, fieldCasing, useTimestamps, useSoftDelete, activePresetId]);

  const convertedCode = useMemo(() => {
    if (!inputSdl || inputSdl.trim().length === 0) return '';
    if (inputSdl.length > MAX_LENGTH) {
      return `// ${t('error.max_length', { max: MAX_LENGTH.toLocaleString() })}`;
    }

    try {
      // Prototype-pollution safe maps
      const enums = Object.create(null) as Record<string, string[]>;
      const objectTypes = Object.create(null) as Record<string, Array<{ name: string; type: string; isList: boolean; isNonNull: boolean }>>;

      // Strip comments
      const cleanSdl = inputSdl.replace(/#.*$/gm, '');

      // Parse Enums
      const enumRegex = /enum\s+([A-Za-z0-9_]+)\s*\{([^}]+)\}/g;
      let enumMatch: RegExpExecArray | null;
      while ((enumMatch = enumRegex.exec(cleanSdl)) !== null) {
        const enumName = enumMatch[1];
        const valuesRaw = enumMatch[2];
        const values = valuesRaw
          .split(/\s+/)
          .map(v => v.trim())
          .filter(v => v.length > 0);
        enums[enumName] = values;
      }

      // Parse Types & Inputs
      const typeRegex = /(?:type|input)\s+([A-Za-z0-9_]+)(?:\s+implements\s+[A-Za-z0-9_\s&]+)?\s*\{([^}]+)\}/g;
      let typeMatch: RegExpExecArray | null;
      while ((typeMatch = typeRegex.exec(cleanSdl)) !== null) {
        const typeName = typeMatch[1];
        // Ignore Root Query / Mutation / Subscription
        if (['Query', 'Mutation', 'Subscription'].includes(typeName)) continue;

        const body = typeMatch[2];
        const fieldLines = body.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        const fields: Array<{ name: string; type: string; isList: boolean; isNonNull: boolean }> = [];

        for (const line of fieldLines) {
          // e.g. title: String! or products: [Product!]!
          const fieldParts = line.match(/^([A-Za-z0-9_]+)\s*:\s*(\[?\s*([A-Za-z0-9_!]+)\s*\]?!?)/);
          if (fieldParts) {
            const fieldName = fieldParts[1];
            const typeSig = fieldParts[2];
            const isList = typeSig.startsWith('[');
            const isNonNull = typeSig.endsWith('!');
            const rawType = fieldParts[3].replace(/!/g, '');

            fields.push({
              name: fieldName,
              type: rawType,
              isList,
              isNonNull
            });
          }
        }
        objectTypes[typeName] = fields;
      }

      const generatedClasses: string[] = [];

      // Generate Enum Definitions
      for (const [eName, eVals] of Object.entries(enums)) {
        const sEnumName = sanitizeIdentifier(eName);
        const enumEntries = eVals.map(v => `  ${sanitizeIdentifier(v)} = '${escapeJsString(v)}'`).join(',\n');
        generatedClasses.push(`export enum ${sEnumName} {\n${enumEntries}\n}`);
      }

      // Generate Entity Classes
      for (const [tName, tFields] of Object.entries(objectTypes)) {
        const className = sanitizeIdentifier(tName);
        const classLines: string[] = [];

        classLines.push(`@Entity()`);
        classLines.push(`export class ${className} {`);

        // Check if there is an ID field or create default primary key
        const idField = tFields.find(f => f.name.toLowerCase() === 'id');

        if (idField) {
          if (idType === 'serial') {
            classLines.push(`  @PrimaryKey()`);
            classLines.push(`  id!: number;\n`);
          } else if (idType === 'uuid') {
            classLines.push(`  @PrimaryKey({ type: 'uuid' })`);
            classLines.push(`  id: string = v4();\n`);
          } else {
            classLines.push(`  @PrimaryKey()`);
            classLines.push(`  id!: ObjectId;\n`);
          }
        } else {
          if (idType === 'serial') {
            classLines.push(`  @PrimaryKey()`);
            classLines.push(`  id!: number;\n`);
          } else if (idType === 'uuid') {
            classLines.push(`  @PrimaryKey({ type: 'uuid' })`);
            classLines.push(`  id: string = v4();\n`);
          } else {
            classLines.push(`  @PrimaryKey()`);
            classLines.push(`  id!: ObjectId;\n`);
          }
        }

        for (const field of tFields) {
          if (field.name.toLowerCase() === 'id') continue;

          const propName = sanitizeIdentifier(convertCasing(field.name, fieldCasing));

          // Check if relation or enum or scalar
          if (enums[field.type]) {
            const sEnumName = sanitizeIdentifier(field.type);
            const nullableOpt = field.isNonNull ? '' : ', nullable: true';
            classLines.push(`  @Enum({ items: () => ${sEnumName}${nullableOpt} })`);
            classLines.push(`  ${propName}${field.isNonNull ? '!' : '?'}: ${sEnumName};\n`);
          } else if (objectTypes[field.type]) {
            const relType = sanitizeIdentifier(field.type);
            if (field.isList) {
              classLines.push(`  @OneToMany(() => ${relType}, e => e.${className.toLowerCase()})`);
              classLines.push(`  ${propName} = new Collection<${relType}>(this);\n`);
            } else {
              const nullableOpt = field.isNonNull ? '' : ', nullable: true';
              classLines.push(`  @ManyToOne(() => ${relType}${nullableOpt})`);
              classLines.push(`  ${propName}${field.isNonNull ? '!' : '?'}: ${relType};\n`);
            }
          } else {
            // Scalar property
            let tsType = 'string';
            let mikroType = '';

            switch (field.type) {
              case 'Int':
              case 'Float':
                tsType = 'number';
                break;
              case 'Boolean':
                tsType = 'boolean';
                break;
              case 'String':
                tsType = 'string';
                break;
              case 'ID':
                tsType = 'string';
                break;
              case 'DateTime':
              case 'Date':
                tsType = 'Date';
                mikroType = ", type: 'date'";
                break;
              default:
                tsType = 'string';
            }

            if (field.isList) {
              classLines.push(`  @Property({ type: 'json'${field.isNonNull ? '' : ', nullable: true'} })`);
              classLines.push(`  ${propName}${field.isNonNull ? '!' : '?'}: ${tsType}[];\n`);
            } else {
              const nullableOpt = field.isNonNull ? '' : ', nullable: true';
              classLines.push(`  @Property({${nullableOpt.slice(2)}${mikroType} })`);
              classLines.push(`  ${propName}${field.isNonNull ? '!' : '?'}: ${tsType};\n`);
            }
          }
        }

        if (useTimestamps) {
          classLines.push(`  @Property({ onCreate: () => new Date() })`);
          classLines.push(`  createdAt: Date = new Date();\n`);
          classLines.push(`  @Property({ onUpdate: () => new Date() })`);
          classLines.push(`  updatedAt: Date = new Date();\n`);
        }

        if (useSoftDelete) {
          classLines.push(`  @Property({ nullable: true })`);
          classLines.push(`  deletedAt?: Date;\n`);
        }

        classLines.push(`}`);
        generatedClasses.push(classLines.join('\n'));
      }

      const imports = [
        "import { Entity, PrimaryKey, Property, Enum, ManyToOne, OneToMany, Collection } from '@mikro-orm/core';"
      ];
      if (idType === 'uuid') {
        imports.push("import { v4 } from 'uuid';");
      } else if (idType === 'objectid') {
        imports.push("import { ObjectId } from '@mikro-orm/mongodb';");
      }

      return `${imports.join('\n')}\n\n${generatedClasses.join('\n\n')}`;
    } catch (err: any) {
      return `// ${t('graphqltomikroorm.error_parsing')}: ${err?.message || err}`;
    }
  }, [inputSdl, driver, idType, fieldCasing, useTimestamps, useSoftDelete, t]);

  const handleCopy = useCallback(() => {
    if (!convertedCode) return;
    navigator.clipboard.writeText(convertedCode);
    setCopied(true);
    toast.success(t('graphqltomikroorm.toast_copied'));
    setTimeout(() => setCopied(false), 2000);
  }, [convertedCode, t]);

  const handleDownload = useCallback(() => {
    if (!convertedCode) return;
    const blob = new Blob([convertedCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `entities.ts`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(t('common.download_success'));
  }, [convertedCode, t]);

  const handleClear = useCallback(() => {
    setInputSdl('');
    setActivePresetId(null);
    toast.success(t('graphqltomikroorm.toast_cleared'));
    inputRef.current?.focus();
  }, [t]);

  const handlePresetSelect = useCallback((preset: Preset) => {
    setInputSdl(preset.sdl);
    setActivePresetId(preset.id);
    toast.success(t('graphqltomikroorm.preset_loaded'));
    inputRef.current?.focus();
  }, [t]);

  const handlersRef = useRef({ handleClear, handleCopy });
  useEffect(() => {
    handlersRef.current = { handleClear, handleCopy };
  }, [handleClear, handleCopy]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const container = containerRef.current;
      if (!container) return;

      const activeElement = document.activeElement;
      const isInsideContainer = container.contains(activeElement);

      const isEditable =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement instanceof HTMLSelectElement ||
        activeElement?.getAttribute('contenteditable') === 'true';

      const { handleClear, handleCopy } = handlersRef.current;

      if (e.key === 'Escape') {
        if (isInsideContainer || isEditable) {
          e.preventDefault();
          handleClear();
        }
        return;
      }

      if (isEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key.toLowerCase() === 'c' && isInsideContainer) {
        e.preventDefault();
        handleCopy();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div ref={containerRef} className="max-w-5xl mx-auto space-y-8">
      {/* Presets Bar */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 px-1">
          <Sparkles className="w-4 h-4 text-indigo-500" />
          <span>{t('graphqltomikroorm.presets_title')}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {PRESETS.map((preset) => {
            const isSelected = activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handlePresetSelect(preset)}
                aria-pressed={isSelected}
                className={`p-4 rounded-2xl text-left transition-all border flex flex-col justify-between ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500'
                }`}
              >
                <div className="font-bold text-xs">{t(preset.nameKey)}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Options Bar */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label htmlFor="driver-select" className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {t('graphqltomikroorm.driver')}
            </label>
            <select
              id="driver-select"
              value={driver}
              onChange={(e) => setDriver(e.target.value as any)}
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold focus:border-indigo-500 outline-none transition-all dark:text-white"
            >
              <option value="postgresql">PostgreSQL</option>
              <option value="mysql">MySQL / MariaDB</option>
              <option value="sqlite">SQLite / LibSQL</option>
              <option value="mongo">MongoDB</option>
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="idtype-select" className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {t('graphqltomikroorm.id_type')}
            </label>
            <select
              id="idtype-select"
              value={idType}
              onChange={(e) => setIdType(e.target.value as any)}
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold focus:border-indigo-500 outline-none transition-all dark:text-white"
            >
              <option value="serial">Auto-increment (number)</option>
              <option value="uuid">UUID string (v4)</option>
              <option value="objectid">MongoDB ObjectId</option>
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="casing-select" className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {t('graphqltomikroorm.field_casing')}
            </label>
            <select
              id="casing-select"
              value={fieldCasing}
              onChange={(e) => setFieldCasing(e.target.value as any)}
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold focus:border-indigo-500 outline-none transition-all dark:text-white"
            >
              <option value="camelCase">camelCase</option>
              <option value="snake_case">snake_case</option>
              <option value="PascalCase">PascalCase</option>
              <option value="original">Original</option>
            </select>
          </div>

          <div className="flex flex-col justify-end space-y-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-600 dark:text-slate-300">
              <input
                type="checkbox"
                checked={useTimestamps}
                onChange={(e) => setUseTimestamps(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700"
              />
              <span>{t('graphqltomikroorm.timestamps')}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-600 dark:text-slate-300">
              <input
                type="checkbox"
                checked={useSoftDelete}
                onChange={(e) => setUseSoftDelete(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700"
              />
              <span>{t('graphqltomikroorm.soft_delete')}</span>
            </label>
          </div>
        </div>
      </div>

      {/* Main Conversion Editor Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input SDL Column */}
        <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-4 flex flex-col">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="graphql-mikroorm-input" className="text-xs font-black uppercase tracking-widest text-slate-400">
              {t('graphqltomikroorm.graphql_input_label')}
            </label>
            <div className="flex items-center gap-2">
              <Kbd modifier={null} className="hidden sm:inline-flex border-rose-200 dark:border-rose-800 text-rose-400">
                Esc
              </Kbd>
              <button
                type="button"
                onClick={handleClear}
                disabled={!inputSdl}
                className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
              >
                <Trash2 className="w-3 h-3" /> {t('common.clear')}
              </button>
            </div>
          </div>
          <textarea
            id="graphql-mikroorm-input"
            ref={inputRef}
            value={inputSdl}
            onChange={(e) => {
              setInputSdl(e.target.value);
              setActivePresetId(null);
            }}
            placeholder={t('graphqltomikroorm.placeholder_graphql')}
            className="w-full h-[400px] p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-mono text-sm focus:border-indigo-500 outline-none transition-all resize-none dark:text-white"
          />
        </div>

        {/* Output TypeScript Column */}
        <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-4 flex flex-col">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="mikroorm-output" className="text-xs font-black uppercase tracking-widest text-slate-400">
              {t('graphqltomikroorm.output_label')}
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownload}
                disabled={!convertedCode}
                className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
              >
                <Download className="w-3 h-3" /> {t('common.download')}
              </button>
              <button
                type="button"
                onClick={handleCopy}
                disabled={!convertedCode}
                className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? t('common.copied') : t('common.copy')}</span>
                <Kbd modifier={null} className="hidden sm:inline-flex border-emerald-200 dark:border-emerald-800 text-emerald-600">
                  C
                </Kbd>
              </button>
            </div>
          </div>
          <textarea
            id="mikroorm-output"
            readOnly
            value={convertedCode}
            placeholder={t('graphqltomikroorm.placeholder_output')}
            className="w-full h-[400px] p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-mono text-sm outline-none transition-all resize-none dark:text-white"
          />
        </div>
      </div>

      {/* Educational Information Footer */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-4">
        <h3 className="text-base font-black flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-500" />
          <span>{t('graphqltomikroorm.about_title')}</span>
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          {t('graphqltomikroorm.about_text')}
        </p>
      </div>
    </div>
  );
}
