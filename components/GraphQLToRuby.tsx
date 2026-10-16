import { useState, useEffect, useCallback, useRef } from 'react';
import { FileCode, Copy, Check, Trash2, AlertCircle, Download, Info, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;

export type RubyConstructStyle = 'class' | 'data' | 'struct' | 'sorbet' | 'dry_struct';
export type RubyPropertyCasing = 'snake_case' | 'camelCase' | 'PascalCase' | 'original';

const RUBY_KEYWORDS = new Set([
  '__ENCODING__', '__LINE__', '__FILE__', 'BEGIN', 'END', 'alias', 'and', 'begin',
  'break', 'case', 'class', 'def', 'defined', 'do', 'else', 'elsif', 'end', 'ensure',
  'false', 'for', 'if', 'in', 'module', 'next', 'nil', 'not', 'or', 'redo', 'rescue',
  'retry', 'return', 'self', 'super', 'then', 'true', 'undef', 'unless', 'until', 'when',
  'while', 'yield', 'attr_accessor', 'attr_reader', 'attr_writer', 'initialize', 'include', 'extend'
]);

export function sanitizeRubyIdentifier(name: string): string {
  if (!name) return 'property';
  let sanitized = name.replace(/[^a-zA-Z0-9_]/g, '_');
  if (/^[0-9]/.test(sanitized)) {
    sanitized = `r_${sanitized}`;
  }
  const lower = sanitized.toLowerCase();
  if (RUBY_KEYWORDS.has(lower) || RUBY_KEYWORDS.has(sanitized)) {
    return `${sanitized}_var`;
  }
  return sanitized;
}

export function escapeRubyString(str: string): string {
  if (!str) return '';
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/#/g, '\\#')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}

export function GraphQLToRuby({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [input, setInput] = useState<string>(initialData?.input || '');
  const [output, setOutput] = useState<string>(initialData?.output || '');
  const [constructStyle, setConstructStyle] = useState<RubyConstructStyle>(initialData?.constructStyle || 'class');
  const [propertyCasing, setPropertyCasing] = useState<RubyPropertyCasing>(initialData?.propertyCasing || 'snake_case');
  const [idType, setIdType] = useState<'String' | 'Integer' | 'String_Integer'>(initialData?.idType || 'String');
  const [dateTimeType, setDateTimeType] = useState<'DateTime' | 'Time' | 'String'>(initialData?.dateTimeType || 'DateTime');
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    onStateChange?.({
      input,
      output,
      constructStyle,
      propertyCasing,
      idType,
      dateTimeType,
    });
  }, [input, output, constructStyle, propertyCasing, idType, dateTimeType, onStateChange]);

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

  const applyCasing = (str: string, casing: RubyPropertyCasing): string => {
    if (casing === 'original') return str;

    const words = str
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/[-_]+/g, ' ')
      .trim()
      .split(/\s+/);

    if (words.length === 0 || !words[0]) return str;

    if (casing === 'snake_case') {
      return words.map(w => w.toLowerCase()).join('_');
    }
    if (casing === 'camelCase') {
      return words[0].toLowerCase() + words.slice(1).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
    }
    if (casing === 'PascalCase') {
      return words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
    }

    return str;
  };

  const mapGqlTypeToRuby = (
    gqlTypeStr: string,
    customScalars: Set<string>
  ): { rubyType: string; sorbetType: string; dryType: string; isList: boolean; isNonNull: boolean } => {
    const raw = gqlTypeStr.trim();
    const isNonNull = raw.endsWith('!');
    const typeWithoutOuterBang = isNonNull ? raw.slice(0, -1).trim() : raw;

    if (typeWithoutOuterBang.startsWith('[') && typeWithoutOuterBang.endsWith(']')) {
      const innerGql = typeWithoutOuterBang.slice(1, -1).trim();
      const innerConverted = mapGqlTypeToRuby(innerGql, customScalars);
      const innerRuby = innerConverted.rubyType;
      const innerSorbet = innerConverted.sorbetType;
      const innerDry = innerConverted.dryType;

      return {
        rubyType: `Array<${innerRuby}>`,
        sorbetType: `T::Array[${innerSorbet}]`,
        dryType: `Types::Array.of(${innerDry})`,
        isList: true,
        isNonNull
      };
    }

    let base = typeWithoutOuterBang;
    let rubyType = 'Object';
    let sorbetType = 'T.untyped';
    let dryType = 'Types::Nominal::Any';

    if (base === 'String') {
      rubyType = 'String';
      sorbetType = 'String';
      dryType = 'Types::String';
    } else if (base === 'Int') {
      rubyType = 'Integer';
      sorbetType = 'Integer';
      dryType = 'Types::Integer';
    } else if (base === 'Float') {
      rubyType = 'Float';
      sorbetType = 'Float';
      dryType = 'Types::Float';
    } else if (base === 'Boolean') {
      rubyType = 'Boolean';
      sorbetType = 'T::Boolean';
      dryType = 'Types::Bool';
    } else if (base === 'ID') {
      if (idType === 'String') {
        rubyType = 'String';
        sorbetType = 'String';
        dryType = 'Types::String';
      } else if (idType === 'Integer') {
        rubyType = 'Integer';
        sorbetType = 'Integer';
        dryType = 'Types::Integer';
      } else {
        rubyType = 'String | Integer';
        sorbetType = 'T.any(String, Integer)';
        dryType = 'Types::String | Types::Integer';
      }
    } else if (base === 'DateTime' || base === 'Date' || base === 'Time' || base === 'Timestamp') {
      if (dateTimeType === 'DateTime') {
        rubyType = 'DateTime';
        sorbetType = 'DateTime';
        dryType = 'Types::JSON::DateTime';
      } else if (dateTimeType === 'Time') {
        rubyType = 'Time';
        sorbetType = 'Time';
        dryType = 'Types::JSON::Time';
      } else {
        rubyType = 'String';
        sorbetType = 'String';
        dryType = 'Types::String';
      }
    } else if (base === 'JSON' || base === 'JSONObject' || base === 'Hash') {
      rubyType = 'Hash';
      sorbetType = 'T::Hash[Symbol, T.untyped]';
      dryType = 'Types::Hash';
    } else if (customScalars.has(base)) {
      rubyType = 'Object';
      sorbetType = 'T.untyped';
      dryType = 'Types::Nominal::Any';
    } else {
      const pascalName = base.charAt(0).toUpperCase() + base.slice(1);
      rubyType = pascalName;
      sorbetType = pascalName;
      dryType = pascalName;
    }

    return { rubyType, sorbetType, dryType, isList: false, isNonNull };
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

      // Clean comments and docstrings
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

      // 1. Process Enums
      const enumRegex = /enum\s+([A-Za-z0-9_]+)\s*\{([^}]*)\}/g;
      let enumMatch: RegExpExecArray | null;
      while ((enumMatch = enumRegex.exec(cleanInput)) !== null) {
        const rawEnumName = enumMatch[1];
        const enumName = rawEnumName.charAt(0).toUpperCase() + rawEnumName.slice(1);
        const enumValues = enumMatch[2]
          .split(/\s+/)
          .map(v => v.trim())
          .filter(Boolean);

        if (constructStyle === 'sorbet') {
          let enumBlock = `class ${enumName} < T::Enum\n`;
          enumBlock += `  enums do\n`;
          enumValues.forEach(v => {
            const caseName = sanitizeRubyIdentifier(v.toUpperCase());
            const safeVal = escapeRubyString(v);
            enumBlock += `    ${caseName} = new("${safeVal}")\n`;
          });
          enumBlock += `  end\n`;
          enumBlock += `end`;
          outputBlocks.push(enumBlock);
        } else if (constructStyle === 'dry_struct') {
          let enumBlock = `module ${enumName}\n`;
          enumValues.forEach(v => {
            const caseName = sanitizeRubyIdentifier(v.toUpperCase());
            const safeVal = escapeRubyString(v);
            enumBlock += `  ${caseName} = "${safeVal}".freeze\n`;
          });
          enumBlock += `  ALL = [${enumValues.map(v => `${sanitizeRubyIdentifier(v.toUpperCase())}`).join(', ')}].freeze\n`;
          enumBlock += `end`;
          outputBlocks.push(enumBlock);
        } else {
          let enumBlock = `module ${enumName}\n`;
          enumValues.forEach(v => {
            const caseName = sanitizeRubyIdentifier(v.toUpperCase());
            const safeVal = escapeRubyString(v);
            enumBlock += `  ${caseName} = "${safeVal}".freeze\n`;
          });
          enumBlock += `  VALUES = [${enumValues.map(v => `${sanitizeRubyIdentifier(v.toUpperCase())}`).join(', ')}].freeze\n`;
          enumBlock += `end`;
          outputBlocks.push(enumBlock);
        }
      }

      // 2. Process Object Types & Inputs
      const structRegex = /(type|input|interface)\s+([A-Za-z0-9_]+)(?:\s+implements\s+([^{]+))?\s*\{([^}]*)\}/g;
      let structMatch: RegExpExecArray | null;

      while ((structMatch = structRegex.exec(cleanInput)) !== null) {
        const kind = structMatch[1];
        const rawTypeName = structMatch[2];
        const implementsClause = structMatch[3] ? structMatch[3].trim().split(/\s*,\s*/).map(s => s.trim()) : [];
        const body = structMatch[4];

        const className = rawTypeName.charAt(0).toUpperCase() + rawTypeName.slice(1);

        const lines = body
          .split('\n')
          .map(l => l.trim())
          .filter(l => l && !l.startsWith('#'));

        const parsedProps: Array<{
          rawFieldName: string;
          fieldName: string;
          rubyType: string;
          sorbetType: string;
          dryType: string;
          isList: boolean;
          isNonNull: boolean;
        }> = [];

        lines.forEach(line => {
          const cleanLine = line.replace(/\([^)]*\)/, '');
          const colonIdx = cleanLine.indexOf(':');
          if (colonIdx === -1) return;

          const rawFieldName = cleanLine.substring(0, colonIdx).trim();
          const rawTypeStr = cleanLine.substring(colonIdx + 1).trim();

          if (!rawFieldName || !rawTypeStr) return;

          const fieldCased = applyCasing(rawFieldName, propertyCasing);
          const fieldName = sanitizeRubyIdentifier(fieldCased);
          const { rubyType, sorbetType, dryType, isList, isNonNull } = mapGqlTypeToRuby(rawTypeStr, customScalars);

          parsedProps.push({
            rawFieldName,
            fieldName,
            rubyType,
            sorbetType,
            dryType,
            isList,
            isNonNull,
          });
        });

        let classBlock = '';

        if (constructStyle === 'sorbet') {
          const isInterface = kind === 'interface';
          if (isInterface) {
            classBlock += `module ${className}\n`;
            classBlock += `  extend T::Sig\n`;
            classBlock += `  abstract!\n\n`;
            parsedProps.forEach(p => {
              const typeSig = p.isNonNull ? p.sorbetType : `T.nilable(${p.sorbetType})`;
              classBlock += `  sig { abstract.returns(${typeSig}) }\n`;
              classBlock += `  def ${p.fieldName}; end\n\n`;
            });
            classBlock += `end`;
          } else {
            const mixins = implementsClause.length > 0 ? `\n  include ${implementsClause.join('\n  include ')}` : '';
            classBlock += `class ${className} < T::Struct${mixins}\n`;
            parsedProps.forEach(p => {
              const propKeyword = p.isNonNull ? 'const' : 'prop';
              const typeSig = p.isNonNull ? p.sorbetType : `T.nilable(${p.sorbetType})`;
              classBlock += `  ${propKeyword} :${p.fieldName}, ${typeSig}\n`;
            });
            classBlock += `end`;
          }
        } else if (constructStyle === 'dry_struct') {
          classBlock += `class ${className} < Dry::Struct\n`;
          parsedProps.forEach(p => {
            const isOpt = !p.isNonNull;
            const attrType = isOpt ? `${p.dryType}.optional` : p.dryType;
            const attrKey = isOpt ? 'attribute?' : 'attribute';
            classBlock += `  ${attrKey} :${p.fieldName}, ${attrType}\n`;
          });
          classBlock += `end`;
        } else if (constructStyle === 'data') {
          // Ruby 3.2+ Data.define
          if (parsedProps.length > 0) {
            classBlock += `${className} = Data.define(${parsedProps.map(p => `:${p.fieldName}`).join(', ')})`;
          } else {
            classBlock += `${className} = Data.define`;
          }
        } else if (constructStyle === 'struct') {
          // Struct.new
          if (parsedProps.length > 0) {
            classBlock += `${className} = Struct.new(${parsedProps.map(p => `:${p.fieldName}`).join(', ')}, keyword_init: true) do\n`;
            classBlock += `  # Struct helper methods\n`;
            classBlock += `end`;
          } else {
            classBlock += `${className} = Struct.new do\n  # Empty struct\nend`;
          }
        } else {
          // Standard Ruby Class
          classBlock += `class ${className}\n`;
          if (parsedProps.length > 0) {
            classBlock += `  attr_accessor ${parsedProps.map(p => `:${p.fieldName}`).join(', ')}\n\n`;
            classBlock += `  def initialize(${parsedProps.map(p => `${p.fieldName}: ${p.isNonNull ? '' : 'nil'}`).join(', ')})\n`;
            parsedProps.forEach(p => {
              classBlock += `    @${p.fieldName} = ${p.fieldName}\n`;
            });
            classBlock += `  end\n`;
          } else {
            classBlock += `  # No attributes\n`;
          }
          classBlock += `end`;
        }

        outputBlocks.push(classBlock);
      }

      if (outputBlocks.length === 0) {
        setError(t('graphqltoruby.no_types_found', 'No valid GraphQL types, interfaces, inputs, or enums found.'));
        setOutput('');
        return;
      }

      let fullOutput = `# frozen_string_literal: true\n\n`;
      if (constructStyle === 'sorbet') {
        fullOutput = `# typed: strict\n# frozen_string_literal: true\n\nrequire 'sorbet-runtime'\n\n`;
      } else if (constructStyle === 'dry_struct') {
        fullOutput = `# frozen_string_literal: true\n\nrequire 'dry-struct'\nrequire 'dry-types'\n\nmodule Types\n  include Dry.Types()\nend\n\n`;
      }

      fullOutput += outputBlocks.join('\n\n');

      setOutput(fullOutput);
      setError('');
    } catch (e: any) {
      setError(t('graphqltoruby.error_parsing', 'Error parsing GraphQL schema') + ': ' + e.message);
      setOutput('');
    }
  }, [input, constructStyle, propertyCasing, idType, dateTimeType, t]);

  useEffect(() => {
    handleConvert();
  }, [handleConvert]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success(t('graphqltoruby.toast_copied', 'Ruby models copied to clipboard!'));
    setTimeout(() => setCopied(false), 2000);
  }, [output, t]);

  const handleClear = useCallback(() => {
    setInput('');
    setOutput('');
    setError('');
    setActivePresetId(null);
    toast.success(t('graphqltoruby.toast_cleared', 'Inputs cleared!'));
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [t]);

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/x-ruby' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'models.rb';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(t('common.downloaded', 'Downloaded models.rb!'));
  };

  const loadPreset = (presetKey: keyof typeof PRESETS) => {
    setInput(PRESETS[presetKey]);
    setActivePresetId(presetKey);
    toast.success(t('graphqltoruby.preset_loaded', 'Loaded GraphQL preset!'));
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
    <div ref={containerRef} className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Presets Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" aria-hidden="true" />
          <span className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('graphqltoruby.presets_title', 'Quick Start Presets:')}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => loadPreset('ecommerce')}
            aria-pressed={activePresetId === 'ecommerce'}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
              activePresetId === 'ecommerce'
                ? 'bg-indigo-600 text-white border border-indigo-600'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500'
            }`}
          >
            {t('graphqltoruby.preset_ecommerce', 'E-Commerce Catalog')}
          </button>
          <button
            onClick={() => loadPreset('user_auth')}
            aria-pressed={activePresetId === 'user_auth'}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
              activePresetId === 'user_auth'
                ? 'bg-indigo-600 text-white border border-indigo-600'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500'
            }`}
          >
            {t('graphqltoruby.preset_user_auth', 'User Management & Auth')}
          </button>
          <button
            onClick={() => loadPreset('social_feed')}
            aria-pressed={activePresetId === 'social_feed'}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
              activePresetId === 'social_feed'
                ? 'bg-indigo-600 text-white border border-indigo-600'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500'
            }`}
          >
            {t('graphqltoruby.preset_social_feed', 'Social Feed & Comments')}
          </button>
        </div>
      </div>

      {/* Options Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-5 bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="space-y-1.5">
          <label htmlFor="ruby-construct-style" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('graphqltoruby.construct_style', 'Model Construct')}
          </label>
          <select
            id="ruby-construct-style"
            value={constructStyle}
            onChange={(e) => setConstructStyle(e.target.value as RubyConstructStyle)}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="class">Standard Class (class Model)</option>
            <option value="data">Ruby 3.2+ Data (Data.define)</option>
            <option value="struct">Struct (Struct.new)</option>
            <option value="sorbet">Sorbet (T::Struct)</option>
            <option value="dry_struct">Dry-Types (Dry::Struct)</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="ruby-property-casing" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('graphqltoruby.property_casing', 'Property Casing')}
          </label>
          <select
            id="ruby-property-casing"
            value={propertyCasing}
            onChange={(e) => setPropertyCasing(e.target.value as RubyPropertyCasing)}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="snake_case">snake_case (@product_name)</option>
            <option value="camelCase">camelCase (@productName)</option>
            <option value="PascalCase">PascalCase (@ProductName)</option>
            <option value="original">Original</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="ruby-id-type" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('graphqltoruby.id_type', 'GraphQL ID Type')}
          </label>
          <select
            id="ruby-id-type"
            value={idType}
            onChange={(e) => setIdType(e.target.value as any)}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="String">String (default)</option>
            <option value="Integer">Integer</option>
            <option value="String_Integer">String | Integer</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="ruby-datetime-type" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('graphqltoruby.datetime_type', 'DateTime Mapping')}
          </label>
          <select
            id="ruby-datetime-type"
            value={dateTimeType}
            onChange={(e) => setDateTimeType(e.target.value as any)}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="DateTime">DateTime (default)</option>
            <option value="Time">Time</option>
            <option value="String">String</option>
          </select>
        </div>
      </div>

      {/* Editor Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-indigo-500" aria-hidden="true" />
              <label htmlFor="graphql-ruby-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('graphqltoruby.graphql_input_label', 'GraphQL SDL Schema')}
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
            id="graphql-ruby-input"
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('graphqltoruby.placeholder_graphql', 'Paste GraphQL SDL schema here...')}
            className="w-full h-[450px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-emerald-500" aria-hidden="true" />
              <label htmlFor="ruby-output" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('graphqltoruby.output_label', 'Generated Ruby Models')}
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
            id="ruby-output"
            value={output}
            readOnly
            placeholder={t('graphqltoruby.placeholder_output', 'Generated Ruby models will appear here...')}
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
          <h4 className="font-bold dark:text-white">{t('graphqltoruby.about_title', 'About GraphQL SDL to Ruby Converter')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('graphqltoruby.about_text', 'Convert GraphQL Schema Definition Language (SDL) types, interfaces, inputs, enums, and unions directly into strongly-typed Ruby models, Data.define DTOs, Structs, Sorbet T::Struct, or Dry::Struct models.')}
          </p>
        </div>
      </div>
    </div>
  );
}
