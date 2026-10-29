import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { FileCode, Copy, Check, RotateCw, Sparkles, BookOpen, ChevronRight, Database } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;

const PYTHON_KEYWORDS = new Set([
  'False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await', 'break',
  'class', 'continue', 'def', 'del', 'elif', 'else', 'except', 'finally',
  'for', 'from', 'global', 'if', 'import', 'in', 'is', 'lambda', 'nonlocal',
  'not', 'or', 'pass', 'raise', 'return', 'try', 'while', 'with', 'yield',
  'metadata', 'query'
]);

function escapePythonString(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r');
}

function sanitizePythonIdentifier(name: string): string {
  let cleaned = name.replace(/[^a-zA-Z0-9_]/g, '_');
  if (/^[0-9]/.test(cleaned)) {
    cleaned = `_${cleaned}`;
  }
  if (PYTHON_KEYWORDS.has(cleaned)) {
    cleaned = `${cleaned}_`;
  }
  return cleaned;
}

function applyCasing(str: string, casing: 'camelCase' | 'snake_case' | 'PascalCase' | 'original'): string {
  if (casing === 'original') return sanitizePythonIdentifier(str);
  const words = str.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[^a-zA-Z0-9]/g, ' ').trim().split(/\s+/);
  if (words.length === 0 || !words[0]) return sanitizePythonIdentifier(str);

  let res = str;
  if (casing === 'camelCase') {
    res = words[0].toLowerCase() + words.slice(1).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
  } else if (casing === 'snake_case') {
    res = words.map(w => w.toLowerCase()).join('_');
  } else if (casing === 'PascalCase') {
    res = words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
  }
  return sanitizePythonIdentifier(res);
}

interface Preset {
  id: string;
  nameKey: string;
  descriptionKey: string;
  schema: string;
}

const PRESETS: Preset[] = [
  {
    id: 'ecommerce',
    nameKey: 'graphqltosqlalchemy.preset_ecommerce_title',
    descriptionKey: 'graphqltosqlalchemy.preset_ecommerce_desc',
    schema: `type Product {
  id: ID!
  title: String!
  description: String
  price: Float!
  inStock: Boolean!
  sku: String!
}

type Category {
  id: ID!
  name: String!
  slug: String!
  products: [Product!]!
}

enum OrderStatus {
  PENDING
  PAID
  SHIPPED
  COMPLETED
  CANCELLED
}

type Order {
  id: ID!
  totalAmount: Float!
  status: OrderStatus!
  createdAt: String!
}`
  },
  {
    id: 'user_auth',
    nameKey: 'graphqltosqlalchemy.preset_user_auth_title',
    descriptionKey: 'graphqltosqlalchemy.preset_user_auth_desc',
    schema: `enum Role {
  ADMIN
  USER
  GUEST
}

type User {
  id: ID!
  username: String!
  email: String!
  role: Role!
  isVerified: Boolean!
  profile: Profile
}

type Profile {
  id: ID!
  bio: String
  website: String
  avatarUrl: String
}`
  },
  {
    id: 'blog_cms',
    nameKey: 'graphqltosqlalchemy.preset_blog_cms_title',
    descriptionKey: 'graphqltosqlalchemy.preset_blog_cms_desc',
    schema: `type Author {
  id: ID!
  name: String!
  email: String!
  articles: [Article!]!
}

type Article {
  id: ID!
  title: String!
  content: String!
  viewsCount: Int!
  published: Boolean!
  author: Author!
}`
  }
];

export function GraphQLToSQLAlchemy({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [inputSchema, setInputSchema] = useState<string>(initialData?.inputSchema ?? PRESETS[0].schema);
  const [sqlalchemyVersion, setSqlalchemyVersion] = useState<'2.0' | '1.4'>(initialData?.sqlalchemyVersion ?? '2.0');
  const [fieldCasing, setFieldCasing] = useState<'snake_case' | 'camelCase' | 'PascalCase' | 'original'>(initialData?.fieldCasing ?? 'snake_case');
  const [includeRepr, setIncludeRepr] = useState<boolean>(initialData?.includeRepr ?? true);
  const [includeToDict, setIncludeToDict] = useState<boolean>(initialData?.includeToDict ?? true);
  const [activePresetId, setActivePresetId] = useState<string | null>(initialData?.activePresetId ?? PRESETS[0].id);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    onStateChange?.({
      inputSchema,
      sqlalchemyVersion,
      fieldCasing,
      includeRepr,
      includeToDict,
      activePresetId
    });
  }, [inputSchema, sqlalchemyVersion, fieldCasing, includeRepr, includeToDict, activePresetId, onStateChange]);

  const convertGraphQLToSQLAlchemy = useCallback((
    schemaText: string,
    sqlaVer: '2.0' | '1.4',
    casing: 'snake_case' | 'camelCase' | 'PascalCase' | 'original',
    genRepr: boolean,
    genDict: boolean
  ): string => {
    if (!schemaText.trim()) return '';
    if (schemaText.length > MAX_LENGTH) {
      return `# Error: ${t('graphqltosqlalchemy.dos_limit')}`;
    }

    try {
      const typesMap = Object.create(null) as Record<string, { kind: string; fields: { name: string; type: string; isList: boolean; isNonNull: boolean }[]; values?: string[] }>;
      const cleanSchema = schemaText.replace(/#.*$/gm, '');

      // Enums
      const enumRegex = /enum\s+([A-Za-z0-9_]+)\s*\{([^}]+)\}/g;
      let enumMatch;
      while ((enumMatch = enumRegex.exec(cleanSchema)) !== null) {
        const enumName = enumMatch[1];
        const enumBody = enumMatch[2];
        const values = enumBody.split(/\s+/).map(v => v.trim()).filter(Boolean);
        typesMap[enumName] = { kind: 'ENUM', fields: [], values };
      }

      // Types & Inputs
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

      let pyCode = sqlaVer === '2.0'
        ? `import enum\nfrom typing import Optional, List\nfrom sqlalchemy import String, Integer, Float, Boolean, ForeignKey, Enum as SQLEnum\nfrom sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship\n\nclass Base(DeclarativeBase):\n    pass\n\n`
        : `import enum\nfrom sqlalchemy import Column, String, Integer, Float, Boolean, ForeignKey, Enum as SQLEnum\nfrom sqlalchemy.ext.declarative import declarative_base\nfrom sqlalchemy.orm import relationship\n\nBase = declarative_base()\n\n`;

      // Generate Python Enums
      for (const [typeName, typeDef] of Object.entries(typesMap)) {
        if (typeDef.kind === 'ENUM') {
          const enumClassName = sanitizePythonIdentifier(typeName);
          pyCode += `class ${enumClassName}(enum.Enum):\n`;
          if (typeDef.values && typeDef.values.length > 0) {
            for (const val of typeDef.values) {
              const safeVal = sanitizePythonIdentifier(val);
              pyCode += `    ${safeVal} = "${escapePythonString(val)}"\n`;
            }
          } else {
            pyCode += `    PASS = "PASS"\n`;
          }
          pyCode += `\n`;
        }
      }

      // Map Scalars
      const mapScalarToPy = (scalarName: string) => {
        switch (scalarName) {
          case 'Int': return { sqla: 'Integer', py: 'int' };
          case 'Float': return { sqla: 'Float', py: 'float' };
          case 'Boolean': return { sqla: 'Boolean', py: 'bool' };
          case 'ID': return { sqla: 'String(36)', py: 'str' };
          case 'String':
          default: return { sqla: 'String(255)', py: 'str' };
        }
      };

      // Generate Models
      for (const [typeName, typeDef] of Object.entries(typesMap)) {
        if (typeName === 'Query' || typeName === 'Mutation' || typeName === 'Subscription' || typeDef.kind === 'ENUM') continue;

        const className = sanitizePythonIdentifier(typeName);
        const tableName = className.toLowerCase() + 's';

        pyCode += `class ${className}(Base):\n`;
        pyCode += `    __tablename__ = "${escapePythonString(tableName)}"\n\n`;

        const rels: string[] = [];

        for (const field of typeDef.fields) {
          const fieldName = field.name;
          const isPk = fieldName === 'id';

          if (typesMap[field.type] && typesMap[field.type].kind === 'ENUM') {
            const enumName = sanitizePythonIdentifier(field.type);
            if (sqlaVer === '2.0') {
              const pyType = field.isNonNull ? enumName : `Optional[${enumName}]`;
              pyCode += `    ${fieldName}: Mapped[${pyType}] = mapped_column(SQLEnum(${enumName}), nullable=${!field.isNonNull ? 'True' : 'False'})\n`;
            } else {
              pyCode += `    ${fieldName} = Column(SQLEnum(${enumName}), nullable=${!field.isNonNull ? 'True' : 'False'})\n`;
            }
          } else if (typesMap[field.type] && typesMap[field.type].kind === 'OBJECT') {
            // Relationship
            const targetClass = sanitizePythonIdentifier(field.type);
            if (field.isList) {
              if (sqlaVer === '2.0') {
                rels.push(`    ${fieldName}: Mapped[List["${escapePythonString(targetClass)}"]] = relationship()`);
              } else {
                rels.push(`    ${fieldName} = relationship("${escapePythonString(targetClass)}")`);
              }
            } else {
              const fkName = `${fieldName}_id`;
              if (sqlaVer === '2.0') {
                const pyType = field.isNonNull ? 'str' : 'Optional[str]';
                pyCode += `    ${fkName}: Mapped[${pyType}] = mapped_column(ForeignKey("${escapePythonString(targetClass.toLowerCase())}s.id"), nullable=${!field.isNonNull ? 'True' : 'False'})\n`;
                rels.push(`    ${fieldName}: Mapped["${escapePythonString(targetClass)}"] = relationship()`);
              } else {
                pyCode += `    ${fkName} = Column(String(36), ForeignKey("${escapePythonString(targetClass.toLowerCase())}s.id"), nullable=${!field.isNonNull ? 'True' : 'False'})\n`;
                rels.push(`    ${fieldName} = relationship("${escapePythonString(targetClass)}")`);
              }
            }
          } else {
            // Scalar
            const mappedInfo = mapScalarToPy(field.type);
            if (sqlaVer === '2.0') {
              const pyType = field.isNonNull ? mappedInfo.py : `Optional[${mappedInfo.py}]`;
              const pkClause = isPk ? ', primary_key=True' : '';
              const nullClause = !isPk ? `, nullable=${!field.isNonNull ? 'True' : 'False'}` : '';
              pyCode += `    ${fieldName}: Mapped[${pyType}] = mapped_column(${mappedInfo.sqla}${pkClause}${nullClause})\n`;
            } else {
              const pkClause = isPk ? ', primary_key=True' : '';
              const nullClause = !isPk ? `, nullable=${!field.isNonNull ? 'True' : 'False'}` : '';
              pyCode += `    ${fieldName} = Column(${mappedInfo.sqla}${pkClause}${nullClause})\n`;
            }
          }
        }

        if (rels.length > 0) {
          pyCode += `\n` + rels.join('\n') + `\n`;
        }

        if (genRepr) {
          pyCode += `\n    def __repr__(self) -> str:\n`;
          pyCode += `        return f"<${escapePythonString(className)} id={getattr(self, 'id', None)}">"\n`;
        }

        if (genDict) {
          pyCode += `\n    def to_dict(self) -> dict:\n`;
          pyCode += `        return {\n`;
          for (const f of typeDef.fields) {
            if (!typesMap[f.type] || typesMap[f.type].kind === 'ENUM') {
              pyCode += `            "${escapePythonString(f.name)}": self.${f.name},\n`;
            }
          }
          pyCode += `        }\n`;
        }

        pyCode += `\n`;
      }

      return pyCode.trim();
    } catch (err: any) {
      return `# Error converting GraphQL SDL to SQLAlchemy: ${err?.message || 'Invalid syntax'}`;
    }
  }, [t]);

  const outputCode = useMemo(() => {
    return convertGraphQLToSQLAlchemy(
      inputSchema,
      sqlalchemyVersion,
      fieldCasing,
      includeRepr,
      includeToDict
    );
  }, [inputSchema, sqlalchemyVersion, fieldCasing, includeRepr, includeToDict, convertGraphQLToSQLAlchemy]);

  const handleCopy = useCallback(() => {
    if (!outputCode) return;
    navigator.clipboard.writeText(outputCode);
    setCopied(true);
    toast.success(t('graphqltosqlalchemy.copied_toast'));
    setTimeout(() => setCopied(false), 2000);
  }, [outputCode, t]);

  const handleClear = useCallback(() => {
    setInputSchema('');
    setActivePresetId(null);
    toast.success(t('graphqltosqlalchemy.cleared_toast'));
    inputRef.current?.focus();
  }, [t]);

  const handleSelectPreset = useCallback((preset: Preset) => {
    setInputSchema(preset.schema);
    setActivePresetId(preset.id);
    toast.success(t('graphqltosqlalchemy.preset_loaded_toast'));
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
          <span>{t('graphqltosqlalchemy.presets_title')}</span>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800">
        <div className="space-y-2">
          <label htmlFor="sqla-version" className="text-xs font-bold text-slate-400 uppercase tracking-widest block">
            {t('graphqltosqlalchemy.label_version')}
          </label>
          <select
            id="sqla-version"
            value={sqlalchemyVersion}
            onChange={(e) => setSqlalchemyVersion(e.target.value as '2.0' | '1.4')}
            className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:border-indigo-500 outline-none"
          >
            <option value="2.0">SQLAlchemy 2.0 (Mapped)</option>
            <option value="1.4">SQLAlchemy 1.4 (Column)</option>
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="sqla-casing" className="text-xs font-bold text-slate-400 uppercase tracking-widest block">
            {t('graphqltosqlalchemy.label_casing')}
          </label>
          <select
            id="sqla-casing"
            value={fieldCasing}
            onChange={(e) => setFieldCasing(e.target.value as any)}
            className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:border-indigo-500 outline-none"
          >
            <option value="snake_case">snake_case</option>
            <option value="camelCase">camelCase</option>
            <option value="PascalCase">PascalCase</option>
            <option value="original">Original</option>
          </select>
        </div>

        <div className="space-y-2 flex flex-col justify-end">
          <label htmlFor="toggle-repr" className="flex items-center gap-2 cursor-pointer p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-indigo-500 transition-all">
            <input
              id="toggle-repr"
              type="checkbox"
              checked={includeRepr}
              onChange={(e) => setIncludeRepr(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 border-slate-300"
            />
            <span>{t('graphqltosqlalchemy.label_repr')}</span>
          </label>
        </div>

        <div className="space-y-2 flex flex-col justify-end">
          <label htmlFor="toggle-todict" className="flex items-center gap-2 cursor-pointer p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-indigo-500 transition-all">
            <input
              id="toggle-todict"
              type="checkbox"
              checked={includeToDict}
              onChange={(e) => setIncludeToDict(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 border-slate-300"
            />
            <span>{t('graphqltosqlalchemy.label_todict')}</span>
          </label>
        </div>
      </div>

      {/* Editor Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Column */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <label htmlFor="graphql-sqlalchemy-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 cursor-pointer">
              <FileCode className="w-4 h-4 text-indigo-500" />
              <span>{t('graphqltosqlalchemy.input_label')}</span>
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
            id="graphql-sqlalchemy-input"
            ref={inputRef}
            value={inputSchema}
            onChange={handleInputChange}
            placeholder={t('graphqltosqlalchemy.input_placeholder')}
            rows={18}
            className="w-full p-4 bg-slate-900 text-slate-100 rounded-3xl border border-slate-800 font-mono text-sm leading-relaxed focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all resize-y shadow-inner"
          />
        </div>

        {/* Output Column */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <label htmlFor="sqlalchemy-output" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 cursor-pointer">
              <Database className="w-4 h-4 text-indigo-500" />
              <span>{t('graphqltosqlalchemy.output_label')}</span>
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
            id="sqlalchemy-output"
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
            <h3>{t('graphqltosqlalchemy.edu_title_1')}</h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('graphqltosqlalchemy.edu_desc_1')}
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
            <Database className="w-4 h-4" />
            <h3>{t('graphqltosqlalchemy.edu_title_2')}</h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('graphqltosqlalchemy.edu_desc_2')}
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
            <ChevronRight className="w-4 h-4" />
            <h3>{t('graphqltosqlalchemy.edu_title_3')}</h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('graphqltosqlalchemy.edu_desc_3')}
          </p>
        </div>
      </div>
    </div>
  );
}
