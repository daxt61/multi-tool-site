import { useState, useEffect, useCallback, useRef } from 'react';
import { FileCode, Copy, Check, Trash2, AlertCircle, Download, Info, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;

type CasingMode = 'snake_case' | 'camelCase' | 'PascalCase' | 'original';
type StructKind = 'struct' | 'mutable struct';
type PackageStyle = 'structtypes' | 'json3' | 'plain';
type DateTimeType = 'DateTime' | 'Date' | 'String';

const JULIA_KEYWORDS = new Set([
  'baremodule', 'begin', 'break', 'catch', 'const', 'continue', 'do', 'else',
  'elseif', 'end', 'export', 'false', 'finally', 'for', 'function', 'global',
  'if', 'import', 'in', 'isa', 'let', 'local', 'macro', 'module', 'quote',
  'return', 'struct', 'true', 'try', 'type', 'using', 'while', 'where', 'mutable',
  'abstract', 'primitive', 'nothing'
]);

function sanitizeJuliaIdentifier(name: string): string {
  const sanitized = name.replace(/[^a-zA-Z0-9_]/g, '_');
  if (JULIA_KEYWORDS.has(sanitized)) {
    return `${sanitized}_`;
  }
  return sanitized || 'Unnamed';
}

function applyCasing(str: string, mode: CasingMode): string {
  if (mode === 'original') return str;
  const words = str
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .split(/\s+/);

  if (words.length === 0 || (words.length === 1 && words[0] === '')) return str;

  if (mode === 'snake_case') {
    return words.map(w => w.toLowerCase()).join('_');
  }
  if (mode === 'camelCase') {
    return words.map((w, i) => i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
  }
  if (mode === 'PascalCase') {
    return words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
  }
  return str;
}

function mapScalarType(typeStr: string, dateTimeType: DateTimeType): string {
  const clean = typeStr.replace(/[!\[\]]/g, '').trim();
  switch (clean) {
    case 'Int':
      return 'Int64';
    case 'Float':
      return 'Float64';
    case 'String':
      return 'String';
    case 'Boolean':
      return 'Bool';
    case 'ID':
      return 'String';
    case 'DateTime':
    case 'Date':
    case 'Time':
    case 'Timestamp':
      return dateTimeType === 'String' ? 'String' : dateTimeType === 'Date' ? 'Dates.Date' : 'Dates.DateTime';
    default:
      return sanitizeJuliaIdentifier(clean);
  }
}

export function GraphQLToJulia({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [input, setInput] = useState(initialData?.input || '');
  const [output, setOutput] = useState(initialData?.output || '');
  const [casing, setCasing] = useState<CasingMode>(initialData?.casing || 'snake_case');
  const [structKind, setStructKind] = useState<StructKind>(initialData?.structKind || 'struct');
  const [packageStyle, setPackageStyle] = useState<PackageStyle>(initialData?.packageStyle || 'structtypes');
  const [dateTimeType, setDateTimeType] = useState<DateTimeType>(initialData?.dateTimeType || 'DateTime');
  const [wrapModule, setWrapModule] = useState(initialData?.wrapModule !== false);
  const [moduleName, setModuleName] = useState(initialData?.moduleName || 'GraphQLModels');
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({
      input,
      output,
      casing,
      structKind,
      packageStyle,
      dateTimeType,
      wrapModule,
      moduleName,
    });
  }, [input, output, casing, structKind, packageStyle, dateTimeType, wrapModule, moduleName, onStateChange]);

  const PRESETS: Record<string, { label: string; sdl: string }> = {
    ecommerce: {
      label: t('graphqltojulia.preset_ecommerce', 'E-Commerce Catalog'),
      sdl: `# E-Commerce Catalog Schema
enum OrderStatus {
  PENDING
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
}

interface Node {
  id: ID!
}

type Category implements Node {
  id: ID!
  name: String!
  slug: String!
  description: String
}

type Product implements Node {
  id: ID!
  title: String!
  description: String
  price: Float!
  sku: String!
  inStock: Boolean!
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
}`
    },
    user_auth: {
      label: t('graphqltojulia.preset_user_auth', 'User Management & Auth'),
      sdl: `# User Management & Auth Schema
enum UserRole {
  ADMIN
  MANAGER
  MEMBER
  GUEST
}

type User {
  id: ID!
  username: String!
  email: String!
  role: UserRole!
  isVerified: Boolean!
  lastLoginAt: DateTime
}

input RegisterUserInput {
  username: String!
  email: String!
  passwordHash: String!
  role: UserRole
}

union AuthResult = User | AuthError

type AuthError {
  code: String!
  message: String!
}`
    },
    social_feed: {
      label: t('graphqltojulia.preset_social_feed', 'Social Feed & Comments'),
      sdl: `# Social Feed Schema
type Author {
  id: ID!
  name: String!
  handle: String!
  avatarUrl: String
}

type Comment {
  id: ID!
  text: String!
  author: Author!
  createdAt: DateTime!
}

type Post {
  id: ID!
  title: String!
  content: String!
  author: Author!
  likesCount: Int!
  comments: [Comment!]!
  publishedAt: DateTime
}`
    }
  };

  const convertGraphQLToJulia = useCallback((
    sdlText: string,
    casingMode: CasingMode,
    kind: StructKind,
    pkgStyle: PackageStyle,
    dtType: DateTimeType,
    isWrapModule: boolean,
    modName: string
  ) => {
    if (!sdlText.trim()) {
      setOutput('');
      setError('');
      return;
    }

    if (sdlText.length > MAX_LENGTH) {
      setError(t('graphqltojulia.error_too_long', 'Input exceeds maximum allowed length of 100,000 characters'));
      setOutput('');
      return;
    }

    try {
      setError('');
      const knownEnums = new Set<string>();
      const knownCustomTypes = Object.create(null) as Record<string, boolean>;

      // Clean comments & split block
      const cleanSdl = sdlText.replace(/#.*$/gm, '');

      // First pass: collect enums and custom types
      const enumMatches = Array.from(cleanSdl.matchAll(/enum\s+([A-Za-z0-9_]+)\s*\{([^}]+)\}/g));
      enumMatches.forEach(m => knownEnums.add(m[1].trim()));

      const typeMatches = Array.from(cleanSdl.matchAll(/(type|input|interface)\s+([A-Za-z0-9_]+)/g));
      typeMatches.forEach(m => {
        const typeName = m[2].trim();
        if (typeName !== 'Query' && typeName !== 'Mutation' && typeName !== 'Subscription') {
          knownCustomTypes[typeName] = true;
        }
      });

      const lines: string[] = [];
      const structNames: string[] = [];

      if (isWrapModule) {
        const validModName = sanitizeJuliaIdentifier(modName || 'GraphQLModels');
        lines.push(`module ${validModName}`);
        lines.push('');
      }

      const needsDates = dtType !== 'String' && /DateTime|Date|Time|Timestamp/.test(sdlText);
      if (needsDates) {
        lines.push('using Dates');
      }

      if (pkgStyle === 'structtypes') {
        lines.push('using StructTypes');
      } else if (pkgStyle === 'json3') {
        lines.push('using JSON3');
      }

      if (needsDates || pkgStyle !== 'plain') {
        lines.push('');
      }

      // Convert Enums
      enumMatches.forEach(m => {
        const enumName = sanitizeJuliaIdentifier(m[1].trim());
        const rawValues = m[2].trim().split(/\s+/).filter(Boolean);
        const juliaValues = rawValues.map(v => sanitizeJuliaIdentifier(v.toUpperCase()));

        lines.push(`# Enum: ${m[1].trim()}`);
        lines.push(`@enum ${enumName} ${juliaValues.join(' ')}`);
        lines.push('');
      });

      // Convert Types, Inputs, Interfaces
      const typeBlocks = Array.from(cleanSdl.matchAll(/(type|input|interface)\s+([A-Za-z0-9_]+)(?:\s+implements\s+[A-Za-z0-9_,\s]+)?\s*\{([^}]+)\}/g));

      typeBlocks.forEach(m => {
        const constructType = m[1].trim();
        const rawTypeName = m[2].trim();

        // Skip root operational types
        if (rawTypeName === 'Query' || rawTypeName === 'Mutation' || rawTypeName === 'Subscription') {
          return;
        }

        const typeName = sanitizeJuliaIdentifier(rawTypeName);
        structNames.push(typeName);

        const body = m[3];
        const fieldLines = body.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));

        lines.push(`# ${constructType.charAt(0).toUpperCase() + constructType.slice(1)}: ${rawTypeName}`);
        lines.push(`${kind} ${typeName}`);

        fieldLines.forEach(fieldLine => {
          const fieldMatch = fieldLine.match(/^([A-Za-z0-9_]+)\s*(?:\([^)]*\))?\s*:\s*(.+)$/);
          if (!fieldMatch) return;

          const rawFieldName = fieldMatch[1].trim();
          const rawTypeStr = fieldMatch[2].trim();

          const casedFieldName = applyCasing(rawFieldName, casingMode);
          const juliaFieldName = sanitizeJuliaIdentifier(casedFieldName);

          const isRequired = rawTypeStr.endsWith('!') || rawTypeStr.endsWith('!]!');
          const isArray = rawTypeStr.includes('[') && rawTypeStr.includes(']');

          const baseScalar = mapScalarType(rawTypeStr, dtType);

          let juliaType = baseScalar;
          if (isArray) {
            juliaType = `Vector{${baseScalar}}`;
          }

          if (!isRequired) {
            juliaType = `Union{Nothing, ${juliaType}}`;
          }

          lines.push(`    ${juliaFieldName}::${juliaType}`);
        });

        lines.push('end');
        lines.push('');
      });

      // Convert Unions
      const unionMatches = Array.from(cleanSdl.matchAll(/union\s+([A-Za-z0-9_]+)\s*=\s*([A-Za-z0-9_|\s]+)/g));
      unionMatches.forEach(m => {
        const unionName = sanitizeJuliaIdentifier(m[1].trim());
        const members = m[2].split('|').map(x => sanitizeJuliaIdentifier(x.trim())).filter(Boolean);

        lines.push(`# Union: ${m[1].trim()}`);
        lines.push(`const ${unionName} = Union{${members.join(', ')}}`);
        lines.push('');
      });

      // Add Package Serialization Annotations
      if (structNames.length > 0) {
        if (pkgStyle === 'structtypes') {
          lines.push('# StructTypes.jl Bindings');
          structNames.forEach(sName => {
            lines.push(`StructTypes.StructType(::Type{${sName}}) = StructTypes.Struct()`);
          });
          lines.push('');
        } else if (pkgStyle === 'json3') {
          lines.push('# JSON3.jl Bindings');
          structNames.forEach(sName => {
            lines.push(`JSON3.StructType(::Type{${sName}}) = JSON3.Struct()`);
          });
          lines.push('');
        }
      }

      if (isWrapModule) {
        lines.push('end # module');
      }

      setOutput(lines.join('\n').trim());
    } catch (err: any) {
      setError(err?.message || t('graphqltojulia.error_parse', 'Failed to parse GraphQL SDL input.'));
      setOutput('');
    }
  }, [t]);

  useEffect(() => {
    convertGraphQLToJulia(input, casing, structKind, packageStyle, dateTimeType, wrapModule, moduleName);
  }, [input, casing, structKind, packageStyle, dateTimeType, wrapModule, moduleName, convertGraphQLToJulia]);

  const handleInputChange = (val: string) => {
    setInput(val);
    if (activePresetId) {
      setActivePresetId(null);
    }
  };

  const handlePresetSelect = (presetKey: string) => {
    const preset = PRESETS[presetKey];
    if (preset) {
      setInput(preset.sdl);
      setActivePresetId(presetKey);
      toast.success(t('graphqltojulia.preset_loaded', 'Preset {{name}} loaded', { name: preset.label }));
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success(t('graphqltojulia.toast_copied', 'Julia models copied to clipboard!'));
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    setError('');
    setActivePresetId(null);
    toast.info(t('graphqltojulia.toast_cleared', 'Input cleared'));
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${moduleName || 'graphql_models'}.jl`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t('graphqltojulia.toast_downloaded', 'Julia file downloaded!'));
  };

  // Keyboard shortcut handlers
  const handlersRef = useRef({
    handleClear,
    handleCopy,
    output,
  });

  useEffect(() => {
    handlersRef.current = {
      handleClear,
      handleCopy,
      output,
    };
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!containerRef.current?.contains(document.activeElement)) {
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        handlersRef.current.handleClear();
      } else if ((e.key === 'c' || e.key === 'C') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const activeTag = document.activeElement?.tagName.toLowerCase();
        if (activeTag !== 'input' && activeTag !== 'textarea' && activeTag !== 'select') {
          if (handlersRef.current.output) {
            e.preventDefault();
            handlersRef.current.handleCopy();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div ref={containerRef} className="max-w-7xl mx-auto space-y-6 focus:outline-none" tabIndex={-1}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400 rounded-lg">
            <FileCode className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {t('graphqltojulia.title', 'GraphQL to Julia Converter')}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t('graphqltojulia.description', 'Convert GraphQL SDL schemas into strongly-typed Julia structs with StructTypes.jl or JSON3.jl bindings')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleClear}
            className="px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors flex items-center gap-1.5"
            title={t('graphqltojulia.clear', 'Clear Input (Esc)')}
          >
            <Trash2 className="w-4 h-4" />
            <span>{t('common.clear', 'Clear')}</span>
            <Kbd modifier={null}>Esc</Kbd>
          </button>
        </div>
      </div>

      {/* Presets */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>{t('graphqltojulia.presets_label', 'Quick Presets')}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(PRESETS).map(([key, p]) => (
            <button
              key={key}
              onClick={() => handlePresetSelect(key)}
              aria-pressed={activePresetId === key}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all flex items-center gap-1.5 ${
                activePresetId === key
                  ? 'bg-fuchsia-50 dark:bg-fuchsia-950/40 border-fuchsia-500 text-fuchsia-700 dark:text-fuchsia-300 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/70'
              }`}
            >
              <span>{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
            {t('graphqltojulia.label_struct_kind', 'Struct Kind')}
          </label>
          <select
            value={structKind}
            onChange={(e) => setStructKind(e.target.value as StructKind)}
            className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-fuchsia-500"
          >
            <option value="struct">Immutable (struct)</option>
            <option value="mutable struct">Mutable (mutable struct)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
            {t('graphqltojulia.label_pkg_style', 'Serialization Style')}
          </label>
          <select
            value={packageStyle}
            onChange={(e) => setPackageStyle(e.target.value as PackageStyle)}
            className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-fuchsia-500"
          >
            <option value="structtypes">StructTypes.jl</option>
            <option value="json3">JSON3.jl</option>
            <option value="plain">Plain Julia</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
            {t('graphqltojulia.label_casing', 'Field Casing')}
          </label>
          <select
            value={casing}
            onChange={(e) => setCasing(e.target.value as CasingMode)}
            className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-fuchsia-500"
          >
            <option value="snake_case">snake_case</option>
            <option value="camelCase">camelCase</option>
            <option value="PascalCase">PascalCase</option>
            <option value="original">Original</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
            {t('graphqltojulia.label_datetime', 'DateTime Mapping')}
          </label>
          <select
            value={dateTimeType}
            onChange={(e) => setDateTimeType(e.target.value as DateTimeType)}
            className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-fuchsia-500"
          >
            <option value="DateTime">Dates.DateTime</option>
            <option value="Date">Dates.Date</option>
            <option value="String">String</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
            {t('graphqltojulia.label_module_name', 'Module Name')}
          </label>
          <input
            type="text"
            value={moduleName}
            onChange={(e) => setModuleName(e.target.value)}
            disabled={!wrapModule}
            className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-fuchsia-500 disabled:opacity-50"
          />
        </div>

        <div className="flex items-center pt-5">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={wrapModule}
              onChange={(e) => setWrapModule(e.target.checked)}
              className="rounded text-fuchsia-600 focus:ring-fuchsia-500 border-slate-300 dark:border-slate-700"
            />
            <span>{t('graphqltojulia.wrap_module', 'Wrap in Module')}</span>
          </label>
        </div>
      </div>

      {/* Converter Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Textarea */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="graphql-julia-input" className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <span>{t('graphqltojulia.input_label', 'GraphQL SDL Schema')}</span>
            </label>
            <span className="text-xs text-slate-400">
              {input.length.toLocaleString()} / {MAX_LENGTH.toLocaleString()} {t('common.chars', 'chars')}
            </span>
          </div>
          <textarea
            id="graphql-julia-input"
            ref={inputRef}
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder={t('graphqltojulia.input_placeholder', 'Paste GraphQL SDL schema here...\n\ntype User {\n  id: ID!\n  name: String!\n  email: String\n}')}
            className="w-full h-[500px] p-4 font-mono text-xs bg-slate-900 text-slate-100 rounded-xl border border-slate-700 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent resize-none"
            spellCheck={false}
          />
        </div>

        {/* Output Area */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="julia-output" className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <span>{t('graphqltojulia.output_label', 'Julia Models Output')}</span>
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                disabled={!output}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
                title={t('graphqltojulia.copy', 'Copy Output (C)')}
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? t('common.copied', 'Copied') : t('common.copy', 'Copy')}</span>
                <Kbd modifier={null}>C</Kbd>
              </button>
              <button
                onClick={handleDownload}
                disabled={!output}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{t('common.download', 'Download')}</span>
              </button>
            </div>
          </div>

          <div className="relative">
            <textarea
              id="julia-output"
              value={output}
              readOnly
              placeholder={t('graphqltojulia.output_placeholder', 'Julia structs and models will appear here...')}
              className="w-full h-[500px] p-4 font-mono text-xs bg-slate-900 text-slate-100 rounded-xl border border-slate-700 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent resize-none"
              spellCheck={false}
            />

            {error && (
              <div className="absolute inset-x-4 bottom-4 p-3 bg-red-900/90 text-red-200 rounded-lg text-xs flex items-center gap-2 border border-red-700 shadow-lg">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Helper Info Footer */}
      <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 flex items-start gap-3">
        <Info className="w-4 h-4 text-fuchsia-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-slate-700 dark:text-slate-300">
            {t('graphqltojulia.info_title', 'About Julia Models Generator')}
          </p>
          <p>
            {t('graphqltojulia.info_desc', 'Converts GraphQL SDL types, interfaces, inputs, enums, and unions into Julia structs with option for StructTypes.jl or JSON3.jl serialization compatibility, customizable casing, and module packaging.')}
          </p>
        </div>
      </div>
    </div>
  );
}
