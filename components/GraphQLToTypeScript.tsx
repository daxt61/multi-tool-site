import { useState, useEffect, useCallback, useRef } from 'react';
import { FileCode, Copy, Check, Trash2, AlertCircle, Download, Info, Sparkles } from 'lucide-react';
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

export function GraphQLToTypeScript({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState(initialData?.input || '');
  const [output, setOutput] = useState(initialData?.output || '');
  const [idType, setIdType] = useState<'string' | 'string_number'>(initialData?.idType || 'string');
  const [dateTimeType, setDateTimeType] = useState<'string' | 'Date'>(initialData?.dateTimeType || 'string');
  const [nullabilityStyle, setNullabilityMode] = useState<'optional' | 'nullable' | 'both'>(initialData?.nullabilityStyle || 'both');
  const [enumStyle, setEnumStyle] = useState<'enum' | 'union'>(initialData?.enumStyle || 'enum');
  const [exportStyle, setExportStyle] = useState<boolean>(initialData?.exportStyle !== false);
  const [useReadonly, setUseReadonly] = useState<boolean>(initialData?.useReadonly || false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ input, output, idType, dateTimeType, nullabilityStyle, enumStyle, exportStyle, useReadonly });
  }, [input, output, idType, dateTimeType, nullabilityStyle, enumStyle, exportStyle, useReadonly, onStateChange]);

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

  const sanitizeFieldName = (fieldName: string): { key: string; isQuoted: boolean } => {
    if (TS_RESERVED_KEYWORDS.has(fieldName) || !/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(fieldName)) {
      return { key: JSON.stringify(fieldName), isQuoted: true };
    }
    return { key: fieldName, isQuoted: false };
  };

  const convertGqlTypeToTs = (
    gqlTypeStr: string,
    customScalars: Set<string>
  ): { tsType: string; isNonNull: boolean } => {
    const raw = gqlTypeStr.trim();
    const isNonNull = raw.endsWith('!');
    const typeWithoutOuterBang = isNonNull ? raw.slice(0, -1).trim() : raw;

    // Check if list type e.g. [Type!] or [Type]
    if (typeWithoutOuterBang.startsWith('[') && typeWithoutOuterBang.endsWith(']')) {
      const innerGql = typeWithoutOuterBang.slice(1, -1).trim();
      const innerConverted = convertGqlTypeToTs(innerGql, customScalars);
      let innerType = innerConverted.tsType;
      if (!innerConverted.isNonNull) {
        innerType = `${innerType} | null`;
      }
      return { tsType: `(${innerType})[]`, isNonNull };
    }

    // Base type
    let base = typeWithoutOuterBang;
    let tsType = 'any';

    if (base === 'String') tsType = 'string';
    else if (base === 'Int' || base === 'Float') tsType = 'number';
    else if (base === 'Boolean') tsType = 'boolean';
    else if (base === 'ID') tsType = idType === 'string' ? 'string' : 'string | number';
    else if (base === 'DateTime' || base === 'Date' || base === 'Time' || base === 'Timestamp') {
      tsType = dateTimeType;
    } else if (base === 'JSON' || base === 'JSONObject' || base === 'JSONSchema') {
      tsType = 'Record<string, unknown>';
    } else if (customScalars.has(base)) {
      tsType = 'any';
    } else {
      tsType = base;
    }

    return { tsType, isNonNull };
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

      // Strip GraphQL comments (# comment)
      const cleanInput = input
        .replace(/#.*$/gm, '')
        .replace(/"""[\s\S]*?"""/g, '')
        .replace(/"[\s\S]*?"/g, (m: string) => m.includes('\n') ? '""' : m);

      // Collect custom scalars
      const customScalars = new Set<string>();
      const scalarRegex = /scalar\s+([A-Za-z0-9_]+)/g;
      let scalarMatch: RegExpExecArray | null;
      while ((scalarMatch = scalarRegex.exec(cleanInput)) !== null) {
        if (scalarMatch[1]) customScalars.add(scalarMatch[1]);
      }

      const outputBlocks: string[] = [];
      const exp = exportStyle ? 'export ' : '';
      const readonlyPrefix = useReadonly ? 'readonly ' : '';

      // 1. Process Enums
      const enumRegex = /enum\s+([A-Za-z0-9_]+)\s*\{([^}]*)\}/g;
      let enumMatch;
      while ((enumMatch = enumRegex.exec(cleanInput)) !== null) {
        const enumName = enumMatch[1];
        const enumValues = enumMatch[2]
          .split(/\s+/)
          .map(v => v.trim())
          .filter(Boolean);

        if (enumStyle === 'enum') {
          let block = `${exp}enum ${enumName} {\n`;
          enumValues.forEach(v => {
            block += `  ${v} = '${v}',\n`;
          });
          block += `}`;
          outputBlocks.push(block);
        } else {
          const unionStr = enumValues.map(v => `'${v}'`).join(' | ') || 'string';
          outputBlocks.push(`${exp}type ${enumName} = ${unionStr};`);
        }
      }

      // 2. Process Unions
      const unionRegex = /union\s+([A-Za-z0-9_]+)\s*=\s*([^;\n]+)/g;
      let unionMatch;
      while ((unionMatch = unionRegex.exec(cleanInput)) !== null) {
        const unionName = unionMatch[1];
        const typesStr = unionMatch[2]
          .split('|')
          .map(t => t.trim())
          .filter(Boolean)
          .join(' | ');
        outputBlocks.push(`${exp}type ${unionName} = ${typesStr};`);
      }

      // 3. Process Custom Scalars
      customScalars.forEach(scalarName => {
        outputBlocks.push(`${exp}type ${scalarName} = any;`);
      });

      // 4. Process Object Types, Interfaces, Inputs
      const structRegex = /(type|interface|input)\s+([A-Za-z0-9_]+)(?:\s+implements\s+[^{]+)?\s*\{([^}]*)\}/g;
      let structMatch;

      while ((structMatch = structRegex.exec(cleanInput)) !== null) {
        const kind = structMatch[1]; // type, interface, input
        const name = structMatch[2];
        const body = structMatch[3];

        const lines = body
          .split('\n')
          .map(l => l.trim())
          .filter(l => l && !l.startsWith('#'));

        let block = `${exp}interface ${name} {\n`;

        lines.forEach(line => {
          // Remove field arguments if present e.g. fieldName(arg1: String): Type!
          const cleanLine = line.replace(/\([^)]*\)/, '');
          const colonIdx = cleanLine.indexOf(':');
          if (colonIdx === -1) return;

          const rawFieldName = cleanLine.substring(0, colonIdx).trim();
          const rawTypeStr = cleanLine.substring(colonIdx + 1).trim();

          if (!rawFieldName || !rawTypeStr) return;

          const { key } = sanitizeFieldName(rawFieldName);
          const { tsType, isNonNull } = convertGqlTypeToTs(rawTypeStr, customScalars);

          let isOptional = false;
          let finalTsType = tsType;

          if (!isNonNull) {
            if (nullabilityStyle === 'optional') {
              isOptional = true;
            } else if (nullabilityStyle === 'nullable') {
              finalTsType = `${tsType} | null`;
            } else {
              // both
              isOptional = true;
              finalTsType = `${tsType} | null`;
            }
          }

          const optSymbol = isOptional ? '?' : '';
          block += `  ${readonlyPrefix}${key}${optSymbol}: ${finalTsType};\n`;
        });

        block += `}`;
        outputBlocks.push(block);
      }

      if (outputBlocks.length === 0) {
        setError(t('graphqltotypescript.no_types_found', 'No valid GraphQL types, interfaces, inputs, or enums found.'));
        setOutput('');
        return;
      }

      setOutput(outputBlocks.join('\n\n'));
      setError('');
    } catch (e: any) {
      setError(t('graphqltotypescript.error_parsing', 'Error parsing GraphQL schema') + ': ' + e.message);
      setOutput('');
    }
  }, [input, idType, dateTimeType, nullabilityStyle, enumStyle, exportStyle, useReadonly, t]);

  useEffect(() => {
    handleConvert();
  }, [handleConvert]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success(t('graphqltotypescript.toast_copied', 'TypeScript definitions copied to clipboard!'));
    setTimeout(() => setCopied(false), 2000);
  }, [output, t]);

  const handleClear = useCallback(() => {
    setInput('');
    setOutput('');
    setError('');
    toast.success(t('graphqltotypescript.toast_cleared', 'Inputs cleared!'));
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [t]);

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/typescript' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'schema.types.ts';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(t('common.downloaded', 'Downloaded schema.types.ts!'));
  };

  const loadPreset = (presetKey: keyof typeof PRESETS) => {
    setInput(PRESETS[presetKey]);
    toast.success(t('graphqltotypescript.preset_loaded', 'Loaded GraphQL preset!'));
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
            {t('graphqltotypescript.presets_title', 'Quick Start Presets:')}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => loadPreset('ecommerce')}
            className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 rounded-xl transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
          >
            {t('graphqltotypescript.preset_ecommerce', 'E-Commerce Catalog')}
          </button>
          <button
            onClick={() => loadPreset('user_auth')}
            className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 rounded-xl transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
          >
            {t('graphqltotypescript.preset_user_auth', 'User Management & Auth')}
          </button>
          <button
            onClick={() => loadPreset('social_feed')}
            className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 rounded-xl transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
          >
            {t('graphqltotypescript.preset_social_feed', 'Social Feed & Comments')}
          </button>
        </div>
      </div>

      {/* Options Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-5 bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="space-y-1.5">
          <label htmlFor="id-type" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('graphqltotypescript.id_type', 'GraphQL ID Scalar')}
          </label>
          <select
            id="id-type"
            value={idType}
            onChange={(e) => setIdType(e.target.value as any)}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="string">string (default)</option>
            <option value="string_number">string | number</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="datetime-type" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('graphqltotypescript.datetime_type', 'DateTime Scalar')}
          </label>
          <select
            id="datetime-type"
            value={dateTimeType}
            onChange={(e) => setDateTimeType(e.target.value as any)}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="string">string (default)</option>
            <option value="Date">Date</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="nullability-style" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('graphqltotypescript.nullability_style', 'Nullable Fields')}
          </label>
          <select
            id="nullability-style"
            value={nullabilityStyle}
            onChange={(e) => setNullabilityMode(e.target.value as any)}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="both">Optional & Nullable (field?: T | null)</option>
            <option value="optional">Optional Only (field?: T)</option>
            <option value="nullable">Nullable Only (field: T | null)</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="enum-style" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('graphqltotypescript.enum_style', 'Enum Style')}
          </label>
          <select
            id="enum-style"
            value={enumStyle}
            onChange={(e) => setEnumStyle(e.target.value as any)}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="enum">TypeScript enum</option>
            <option value="union">String Union Type ('A' | 'B')</option>
          </select>
        </div>

        <div className="flex flex-col justify-center space-y-2 pt-2 md:col-span-2">
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={exportStyle}
                onChange={(e) => setExportStyle(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
              />
              {t('graphqltotypescript.export_types', 'Export Types & Interfaces')}
            </label>
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={useReadonly}
                onChange={(e) => setUseReadonly(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
              />
              {t('graphqltotypescript.use_readonly', 'Readonly Properties')}
            </label>
          </div>
        </div>
      </div>

      {/* Editor Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-indigo-500" aria-hidden="true" />
              <label htmlFor="graphql-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('graphqltotypescript.graphql_input_label', 'GraphQL SDL Schema')}
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
            id="graphql-input"
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('graphqltotypescript.placeholder_graphql', 'Paste GraphQL SDL schema here...')}
            className="w-full h-[450px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-emerald-500" aria-hidden="true" />
              <label htmlFor="ts-output" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('graphqltotypescript.output_label', 'TypeScript Definitions')}
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
            id="ts-output"
            value={output}
            readOnly
            placeholder={t('graphqltotypescript.placeholder_output', 'TypeScript interfaces and type aliases will appear here...')}
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
          <h4 className="font-bold dark:text-white">{t('graphqltotypescript.about_title', 'About GraphQL SDL to TypeScript Converter')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('graphqltotypescript.about_text', 'Convert GraphQL Schema Definition Language (SDL) statements (types, interfaces, inputs, enums, unions) directly into strongly-typed TypeScript interfaces and type definitions.')}
          </p>
        </div>
      </div>
    </div>
  );
}
