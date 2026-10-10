import { useState, useEffect, useCallback, useRef } from 'react';
import { FileCode, Copy, Check, Trash2, AlertCircle, Download, Info, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;

type OutputFormat = 'php81_class' | 'php82_readonly' | 'spatie_dto';
type PropertyCasing = 'camelCase' | 'snake_case' | 'PascalCase' | 'original';

const PHP_RESERVED_KEYWORDS = new Set([
  'abstract', 'and', 'array', 'as', 'break', 'callable', 'case', 'catch', 'class',
  'clone', 'const', 'continue', 'declare', 'default', 'die', 'do', 'echo', 'else',
  'elseif', 'empty', 'enddeclare', 'endfor', 'endforeach', 'endif', 'endswitch',
  'endwhile', 'eval', 'exit', 'extends', 'final', 'finally', 'fn', 'for', 'foreach',
  'function', 'global', 'goto', 'if', 'implements', 'include', 'include_once',
  'instanceof', 'insteadof', 'interface', 'isset', 'list', 'match', 'namespace',
  'new', 'or', 'print', 'private', 'protected', 'public', 'readonly', 'require',
  'require_once', 'return', 'static', 'switch', 'throw', 'trait', 'try', 'unset',
  'use', 'var', 'while', 'xor', 'yield', 'int', 'float', 'bool', 'string', 'void',
  'never', 'iterable', 'object', 'mixed', 'null', 'false', 'true', 'parent', 'self'
]);

export function sanitizePhpNamespace(ns: string): string {
  if (!ns) return '';
  return ns
    .replace(/[\r\n\0]/g, '')
    .replace(/\?>/g, '')
    .replace(/[^a-zA-Z0-9_\\]/g, '')
    .replace(/\\+/g, '\\')
    .replace(/^\\+|\\+$/g, '');
}

export function escapePhpSingleQuoteString(str: string): string {
  if (!str) return '';
  return str
    .replace(/\?>/g, '? >')
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/[\r\n]/g, '\\n');
}

export function GraphQLToPHP({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState<string>(initialData?.input || '');
  const [output, setOutput] = useState<string>(initialData?.output || '');
  const [outputFormat, setOutputFormat] = useState<OutputFormat>(initialData?.outputFormat || 'php82_readonly');
  const [propertyCasing, setPropertyCasing] = useState<PropertyCasing>(initialData?.propertyCasing || 'camelCase');
  const [namespace, setNamespace] = useState<string>(initialData?.namespace || 'App\\DTO');
  const [useStrictTypes, setUseStrictTypes] = useState<boolean>(initialData?.useStrictTypes ?? true);
  const [idType, setIdType] = useState<'string' | 'int' | 'string_int'>(initialData?.idType || 'string');
  const [dateTimeType, setDateTimeType] = useState<'DateTimeImmutable' | 'string'>(initialData?.dateTimeType || 'DateTimeImmutable');
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    onStateChange?.({
      input,
      output,
      outputFormat,
      propertyCasing,
      namespace,
      useStrictTypes,
      idType,
      dateTimeType,
    });
  }, [input, output, outputFormat, propertyCasing, namespace, useStrictTypes, idType, dateTimeType, onStateChange]);

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

  const applyCasing = (str: string, casing: PropertyCasing): string => {
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

  const sanitizePhpIdentifier = (name: string): string => {
    const lowerName = name.toLowerCase();
    if (PHP_RESERVED_KEYWORDS.has(lowerName)) {
      return `${name}Val`;
    }
    if (!/^[a-zA-Z_\x80-\xff][a-zA-Z0-9_\x80-\xff]*$/.test(name)) {
      return `val_${name.replace(/[^a-zA-Z0-9_]/g, '_')}`;
    }
    return name;
  };

  const mapGqlTypeToPhp = (
    gqlTypeStr: string,
    customScalars: Set<string>
  ): { phpType: string; docType: string; isList: boolean; innerType: string; isNonNull: boolean } => {
    const raw = gqlTypeStr.trim();
    const isNonNull = raw.endsWith('!');
    const typeWithoutOuterBang = isNonNull ? raw.slice(0, -1).trim() : raw;

    if (typeWithoutOuterBang.startsWith('[') && typeWithoutOuterBang.endsWith(']')) {
      const innerGql = typeWithoutOuterBang.slice(1, -1).trim();
      const innerConverted = mapGqlTypeToPhp(innerGql, customScalars);
      return {
        phpType: 'array',
        docType: `list<${innerConverted.phpType}>`,
        isList: true,
        innerType: innerConverted.phpType,
        isNonNull
      };
    }

    let base = typeWithoutOuterBang;
    let phpType = 'mixed';

    if (base === 'String') phpType = 'string';
    else if (base === 'Int') phpType = 'int';
    else if (base === 'Float') phpType = 'float';
    else if (base === 'Boolean') phpType = 'bool';
    else if (base === 'ID') {
      if (idType === 'string') phpType = 'string';
      else if (idType === 'int') phpType = 'int';
      else phpType = 'string|int';
    } else if (base === 'DateTime' || base === 'Date' || base === 'Time' || base === 'Timestamp') {
      phpType = dateTimeType === 'DateTimeImmutable' ? '\\DateTimeImmutable' : 'string';
    } else if (base === 'JSON' || base === 'JSONObject' || base === 'JSONSchema') {
      phpType = 'array';
    } else if (customScalars.has(base)) {
      phpType = 'mixed';
    } else {
      phpType = sanitizePhpIdentifier(base);
    }

    return { phpType, docType: phpType, isList: false, innerType: phpType, isNonNull };
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

      const cleanNamespace = sanitizePhpNamespace(namespace);
      const outputBlocks: string[] = [];

      // 1. Process Enums (PHP 8.1+ Enum)
      const enumRegex = /enum\s+([A-Za-z0-9_]+)\s*\{([^}]*)\}/g;
      let enumMatch: RegExpExecArray | null;
      while ((enumMatch = enumRegex.exec(cleanInput)) !== null) {
        const rawEnumName = enumMatch[1];
        const enumName = sanitizePhpIdentifier(rawEnumName);
        const enumValues = enumMatch[2]
          .split(/\s+/)
          .map(v => v.trim())
          .filter(Boolean);

        let enumBlock = `enum ${enumName}: string\n{\n`;
        enumValues.forEach(v => {
          const caseName = sanitizePhpIdentifier(v.toUpperCase());
          const safeValue = escapePhpSingleQuoteString(v);
          enumBlock += `    case ${caseName} = '${safeValue}';\n`;
        });
        enumBlock += `}`;
        outputBlocks.push(enumBlock);
      }

      // 2. Process Interfaces (PHP Interface)
      const interfaceRegex = /interface\s+([A-Za-z0-9_]+)\s*\{([^}]*)\}/g;
      let interfaceMatch: RegExpExecArray | null;
      while ((interfaceMatch = interfaceRegex.exec(cleanInput)) !== null) {
        const rawIfaceName = interfaceMatch[1];
        const ifaceName = sanitizePhpIdentifier(rawIfaceName);
        const body = interfaceMatch[2];

        const lines = body
          .split('\n')
          .map(l => l.trim())
          .filter(l => l && !l.startsWith('#'));

        let ifaceBlock = `interface ${ifaceName}\n{\n`;
        lines.forEach(line => {
          const cleanLine = line.replace(/\([^)]*\)/, '');
          const colonIdx = cleanLine.indexOf(':');
          if (colonIdx === -1) return;

          const rawFieldName = cleanLine.substring(0, colonIdx).trim();
          const rawTypeStr = cleanLine.substring(colonIdx + 1).trim();

          if (!rawFieldName || !rawTypeStr) return;

          const fieldCased = applyCasing(rawFieldName, propertyCasing);
          const fieldName = sanitizePhpIdentifier(fieldCased);
          const { phpType, isNonNull } = mapGqlTypeToPhp(rawTypeStr, customScalars);

          const nullablePrefix = !isNonNull && !phpType.includes('mixed') ? '?' : '';
          const getterName = `get${fieldName.charAt(0).toUpperCase()}${fieldName.slice(1)}`;

          ifaceBlock += `    public function ${getterName}(): ${nullablePrefix}${phpType};\n`;
        });
        ifaceBlock += `}`;
        outputBlocks.push(ifaceBlock);
      }

      // 3. Process Object Types & Inputs
      const structRegex = /(type|input)\s+([A-Za-z0-9_]+)(?:\s+implements\s+([^{]+))?\s*\{([^}]*)\}/g;
      let structMatch: RegExpExecArray | null;

      while ((structMatch = structRegex.exec(cleanInput)) !== null) {
        const rawTypeName = structMatch[2];
        const implementsClause = structMatch[3] ? structMatch[3].trim().split(/\s*,\s*/).map(s => sanitizePhpIdentifier(s)).join(', ') : '';
        const body = structMatch[4];

        const className = sanitizePhpIdentifier(rawTypeName);

        const lines = body
          .split('\n')
          .map(l => l.trim())
          .filter(l => l && !l.startsWith('#'));

        const parsedProps: Array<{
          rawFieldName: string;
          fieldName: string;
          phpType: string;
          docType: string;
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
          const fieldName = sanitizePhpIdentifier(fieldCased);
          const { phpType, docType, isList, isNonNull } = mapGqlTypeToPhp(rawTypeStr, customScalars);

          parsedProps.push({
            rawFieldName,
            fieldName,
            phpType,
            docType,
            isList,
            isNonNull,
          });
        });

        let classBlock = '';

        if (outputFormat === 'spatie_dto') {
          const extendsClause = ' extends Data';
          const implClause = implementsClause ? ` implements ${implementsClause}` : '';

          classBlock += `class ${className}${extendsClause}${implClause}\n{\n`;
          classBlock += `    public function __construct(\n`;

          parsedProps.forEach((prop, idx) => {
            const isLast = idx === parsedProps.length - 1;
            const nullablePrefix = !prop.isNonNull && !prop.phpType.includes('mixed') && !prop.phpType.includes('|') ? '?' : '';
            const defaultValue = !prop.isNonNull ? ' = null' : '';

            if (prop.isList) {
              classBlock += `        /** @var ${prop.docType} */\n`;
            }
            classBlock += `        public ${nullablePrefix}${prop.phpType} $${prop.fieldName}${defaultValue}${isLast ? '' : ','}\n`;
          });

          classBlock += `    ) {}\n}`;
        } else if (outputFormat === 'php82_readonly') {
          const implClause = implementsClause ? ` implements ${implementsClause}` : '';

          classBlock += `readonly class ${className}${implClause}\n{\n`;
          classBlock += `    public function __construct(\n`;

          parsedProps.forEach((prop, idx) => {
            const isLast = idx === parsedProps.length - 1;
            const nullablePrefix = !prop.isNonNull && !prop.phpType.includes('mixed') && !prop.phpType.includes('|') ? '?' : '';
            const defaultValue = !prop.isNonNull ? ' = null' : '';

            if (prop.isList) {
              classBlock += `        /** @var ${prop.docType} */\n`;
            }
            classBlock += `        public ${nullablePrefix}${prop.phpType} $${prop.fieldName}${defaultValue}${isLast ? '' : ','}\n`;
          });

          classBlock += `    ) {}\n}`;
        } else {
          // Standard PHP 8.1+ Class
          const implClause = implementsClause ? ` implements ${implementsClause}` : '';

          classBlock += `class ${className}${implClause}\n{\n`;

          // Properties
          parsedProps.forEach((prop) => {
            const nullablePrefix = !prop.isNonNull && !prop.phpType.includes('mixed') && !prop.phpType.includes('|') ? '?' : '';
            const defaultValue = !prop.isNonNull ? ' = null' : '';

            if (prop.isList) {
              classBlock += `    /** @var ${prop.docType} */\n`;
            }
            classBlock += `    public ${nullablePrefix}${prop.phpType} $${prop.fieldName}${defaultValue};\n\n`;
          });

          // Constructor
          classBlock += `    public function __construct(\n`;
          parsedProps.forEach((prop, idx) => {
            const isLast = idx === parsedProps.length - 1;
            const nullablePrefix = !prop.isNonNull && !prop.phpType.includes('mixed') && !prop.phpType.includes('|') ? '?' : '';
            const defaultValue = !prop.isNonNull ? ' = null' : '';

            classBlock += `        ${nullablePrefix}${prop.phpType} $${prop.fieldName}${defaultValue}${isLast ? '' : ','}\n`;
          });
          classBlock += `    ) {\n`;
          parsedProps.forEach((prop) => {
            classBlock += `        $this->${prop.fieldName} = $${prop.fieldName};\n`;
          });
          classBlock += `    }\n}`;
        }

        outputBlocks.push(classBlock);
      }

      if (outputBlocks.length === 0) {
        setError(t('graphqltophp.no_types_found', 'No valid GraphQL types, interfaces, inputs, or enums found.'));
        setOutput('');
        return;
      }

      // Format full PHP file
      let fullOutput = '<?php\n\n';
      if (useStrictTypes) {
        fullOutput += 'declare(strict_types=1);\n\n';
      }
      if (cleanNamespace) {
        fullOutput += `namespace ${cleanNamespace};\n\n`;
      }

      if (outputFormat === 'spatie_dto') {
        fullOutput += 'use Spatie\\LaravelData\\Data;\n\n';
      }

      fullOutput += outputBlocks.join('\n\n');

      setOutput(fullOutput);
      setError('');
    } catch (e: any) {
      setError(t('graphqltophp.error_parsing', 'Error parsing GraphQL schema') + ': ' + e.message);
      setOutput('');
    }
  }, [input, outputFormat, propertyCasing, namespace, useStrictTypes, idType, dateTimeType, t]);

  useEffect(() => {
    handleConvert();
  }, [handleConvert]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success(t('graphqltophp.toast_copied', 'PHP code copied to clipboard!'));
    setTimeout(() => setCopied(false), 2000);
  }, [output, t]);

  const handleClear = useCallback(() => {
    setInput('');
    setOutput('');
    setError('');
    setActivePresetId(null);
    toast.success(t('graphqltophp.toast_cleared', 'Inputs cleared!'));
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [t]);

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/x-php' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'DTOs.php';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(t('common.downloaded', 'Downloaded DTOs.php!'));
  };

  const loadPreset = (presetKey: keyof typeof PRESETS) => {
    setInput(PRESETS[presetKey]);
    setActivePresetId(presetKey);
    toast.success(t('graphqltophp.preset_loaded', 'Loaded GraphQL preset!'));
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
            {t('graphqltophp.presets_title', 'Quick Start Presets:')}
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
            {t('graphqltophp.preset_ecommerce', 'E-Commerce Catalog')}
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
            {t('graphqltophp.preset_user_auth', 'User Management & Auth')}
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
            {t('graphqltophp.preset_social_feed', 'Social Feed & Comments')}
          </button>
        </div>
      </div>

      {/* Options Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-5 bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="space-y-1.5">
          <label htmlFor="php-output-format" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('graphqltophp.output_format', 'PHP Target Construct')}
          </label>
          <select
            id="php-output-format"
            value={outputFormat}
            onChange={(e) => setOutputFormat(e.target.value as OutputFormat)}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="php82_readonly">PHP 8.2 Readonly DTO</option>
            <option value="php81_class">PHP 8.1+ Class</option>
            <option value="spatie_dto">Spatie / Laravel Data DTO</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="php-property-casing" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('graphqltophp.property_casing', 'Property Casing')}
          </label>
          <select
            id="php-property-casing"
            value={propertyCasing}
            onChange={(e) => setPropertyCasing(e.target.value as PropertyCasing)}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="camelCase">camelCase ($productName)</option>
            <option value="snake_case">snake_case ($product_name)</option>
            <option value="PascalCase">PascalCase ($ProductName)</option>
            <option value="original">Original</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="php-namespace" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('graphqltophp.namespace', 'PHP Namespace')}
          </label>
          <input
            id="php-namespace"
            type="text"
            value={namespace}
            onChange={(e) => setNamespace(e.target.value)}
            placeholder="App\DTO"
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="php-id-type" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('graphqltophp.id_type', 'GraphQL ID Type')}
          </label>
          <select
            id="php-id-type"
            value={idType}
            onChange={(e) => setIdType(e.target.value as any)}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="string">string (default)</option>
            <option value="int">int</option>
            <option value="string_int">string|int (union)</option>
          </select>
        </div>
      </div>

      {/* Strict Types Toggle */}
      <div className="flex items-center gap-3 px-2">
        <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer">
          <input
            type="checkbox"
            checked={useStrictTypes}
            onChange={(e) => setUseStrictTypes(e.target.checked)}
            className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
          />
          {t('graphqltophp.strict_types', 'Declare strict_types=1')}
        </label>
      </div>

      {/* Editor Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-indigo-500" aria-hidden="true" />
              <label htmlFor="graphql-php-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('graphqltophp.graphql_input_label', 'GraphQL SDL Schema')}
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
            id="graphql-php-input"
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('graphqltophp.placeholder_graphql', 'Paste GraphQL SDL schema here...')}
            className="w-full h-[450px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-emerald-500" aria-hidden="true" />
              <label htmlFor="php-output" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('graphqltophp.output_label', 'Generated PHP DTO Classes')}
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
            id="php-output"
            value={output}
            readOnly
            placeholder={t('graphqltophp.placeholder_output', 'Generated PHP DTO classes will appear here...')}
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
          <h4 className="font-bold dark:text-white">{t('graphqltophp.about_title', 'About GraphQL SDL to PHP Converter')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('graphqltophp.about_text', 'Convert GraphQL Schema Definition Language (SDL) types, interfaces, inputs, enums, and unions directly into strongly-typed PHP classes, PHP 8.2 readonly DTOs, or Spatie/Laravel Data models.')}
          </p>
        </div>
      </div>
    </div>
  );
}
