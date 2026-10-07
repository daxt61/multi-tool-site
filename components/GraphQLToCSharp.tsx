import { useState, useEffect, useCallback, useRef } from 'react';
import { FileCode, Copy, Check, Trash2, AlertCircle, Download, Info, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;

type OutputFormat = 'record' | 'class' | 'hotchocolate';
type JsonAttributeFormat = 'system' | 'newtonsoft' | 'none';
type PropertyCasing = 'PascalCase' | 'camelCase' | 'snake_case' | 'original';
type IdType = 'string' | 'Guid' | 'int' | 'long';
type DateTimeType = 'DateTime' | 'DateTimeOffset' | 'string';

const CSHARP_KEYWORDS = new Set([
  'abstract', 'as', 'base', 'bool', 'break', 'byte', 'case', 'catch', 'char', 'checked',
  'class', 'const', 'continue', 'decimal', 'default', 'delegate', 'do', 'double', 'else',
  'enum', 'event', 'explicit', 'extern', 'false', 'finally', 'fixed', 'float', 'for',
  'foreach', 'goto', 'if', 'implicit', 'in', 'int', 'interface', 'internal', 'is', 'lock',
  'long', 'namespace', 'new', 'null', 'object', 'operator', 'out', 'override', 'params',
  'private', 'protected', 'public', 'readonly', 'ref', 'return', 'sbyte', 'sealed', 'short',
  'sizeof', 'stackalloc', 'static', 'string', 'struct', 'switch', 'this', 'throw', 'true',
  'try', 'typeof', 'uint', 'ulong', 'unchecked', 'unsafe', 'ushort', 'using', 'virtual',
  'void', 'volatile', 'while', 'record', 'init', 'value', 'var'
]);

export function GraphQLToCSharp({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState(initialData?.input || '');
  const [output, setOutput] = useState(initialData?.output || '');
  const [namespaceName, setNamespaceName] = useState(initialData?.namespaceName || 'GraphQL.Models');
  const [outputFormat, setOutputFormat] = useState<OutputFormat>(initialData?.outputFormat || 'record');
  const [jsonAttributeFormat, setJsonAttributeFormat] = useState<JsonAttributeFormat>(initialData?.jsonAttributeFormat || 'system');
  const [propertyCasing, setPropertyCasing] = useState<PropertyCasing>(initialData?.propertyCasing || 'PascalCase');
  const [useNullableTypes, setUseNullableTypes] = useState<boolean>(initialData?.useNullableTypes !== undefined ? initialData.useNullableTypes : true);
  const [idType, setIdType] = useState<IdType>(initialData?.idType || 'string');
  const [dateTimeType, setDateTimeType] = useState<DateTimeType>(initialData?.dateTimeType || 'DateTime');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({
      input,
      output,
      namespaceName,
      outputFormat,
      jsonAttributeFormat,
      propertyCasing,
      useNullableTypes,
      idType,
      dateTimeType,
    });
  }, [input, output, namespaceName, outputFormat, jsonAttributeFormat, propertyCasing, useNullableTypes, idType, dateTimeType, onStateChange]);

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

    if (casing === 'PascalCase') {
      return words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
    }
    if (casing === 'snake_case') {
      return words.map(w => w.toLowerCase()).join('_');
    }
    if (casing === 'camelCase') {
      return words[0].toLowerCase() + words.slice(1).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
    }

    return str;
  };

  const escapeCSharpString = (str: string): string => {
    return str
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r');
  };

  const sanitizeCSharpIdentifier = (name: string): string => {
    let clean = name.replace(/[^a-zA-Z0-9_]/g, '_');
    if (!/^[a-zA-Z_]/.test(clean)) {
      clean = `_${clean}`;
    }
    if (CSHARP_KEYWORDS.has(clean.toLowerCase())) {
      return `@${clean}`;
    }
    return clean;
  };

  const mapGqlTypeToCSharp = (
    gqlTypeStr: string,
    customScalars: Set<string>
  ): { csharpType: string; isNonNull: boolean; isList: boolean } => {
    const raw = gqlTypeStr.trim();
    const isNonNull = raw.endsWith('!');
    const typeWithoutOuterBang = isNonNull ? raw.slice(0, -1).trim() : raw;

    if (typeWithoutOuterBang.startsWith('[') && typeWithoutOuterBang.endsWith(']')) {
      const innerGql = typeWithoutOuterBang.slice(1, -1).trim();
      const innerConverted = mapGqlTypeToCSharp(innerGql, customScalars);
      let innerType = innerConverted.csharpType;
      if (!innerConverted.isNonNull && useNullableTypes) {
        innerType = `${innerType}?`;
      }
      return { csharpType: `List<${innerType}>`, isNonNull, isList: true };
    }

    let base = typeWithoutOuterBang;
    let csharpType = 'object';

    if (base === 'String') csharpType = 'string';
    else if (base === 'Int') csharpType = 'int';
    else if (base === 'Float') csharpType = 'double';
    else if (base === 'Boolean') csharpType = 'bool';
    else if (base === 'ID') csharpType = idType;
    else if (base === 'DateTime' || base === 'Date' || base === 'Time' || base === 'Timestamp') {
      csharpType = dateTimeType;
    } else if (base === 'JSON' || base === 'JSONObject' || base === 'JSONSchema') {
      csharpType = 'Dictionary<string, object>';
    } else if (customScalars.has(base)) {
      csharpType = 'object';
    } else {
      csharpType = sanitizeCSharpIdentifier(base);
    }

    return { csharpType, isNonNull, isList: false };
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

      const usings = new Set<string>();
      usings.add('System');
      usings.add('System.Collections.Generic');

      if (jsonAttributeFormat === 'system') {
        usings.add('System.Text.Json.Serialization');
      } else if (jsonAttributeFormat === 'newtonsoft') {
        usings.add('Newtonsoft.Json');
      }

      if (outputFormat === 'hotchocolate') {
        usings.add('HotChocolate');
        usings.add('HotChocolate.Types');
      }

      const outputBlocks: string[] = [];

      // 1. Process Enums
      const enumRegex = /enum\s+([A-Za-z0-9_]+)\s*\{([^}]*)\}/g;
      let enumMatch: RegExpExecArray | null;
      while ((enumMatch = enumRegex.exec(cleanInput)) !== null) {
        const enumName = sanitizeCSharpIdentifier(enumMatch[1]);
        const enumValues = enumMatch[2]
          .split(/\s+/)
          .map(v => v.trim())
          .filter(Boolean);

        let block = `public enum ${enumName}\n{\n`;
        enumValues.forEach((v, idx) => {
          const valCased = sanitizeCSharpIdentifier(v);
          const comma = idx < enumValues.length - 1 ? ',' : '';
          block += `    ${valCased}${comma}\n`;
        });
        block += `}`;
        outputBlocks.push(block);
      }

      // 2. Process Unions
      const unionRegex = /union\s+([A-Za-z0-9_]+)\s*=\s*([^;\n]+)/g;
      let unionMatch: RegExpExecArray | null;
      while ((unionMatch = unionRegex.exec(cleanInput)) !== null) {
        const unionName = sanitizeCSharpIdentifier(unionMatch[1]);
        const typesList = unionMatch[2]
          .split('|')
          .map(t => t.trim())
          .filter(Boolean);

        if (outputFormat === 'hotchocolate') {
          let block = `[UnionType("${escapeCSharpString(unionName)}")]\npublic interface I${unionName}\n{\n}`;
          outputBlocks.push(block);
        } else {
          let block = `public interface I${unionName} { }\n\n`;
          block += `public record ${unionName}(\n`;
          typesList.forEach((tName, idx) => {
            const csType = sanitizeCSharpIdentifier(tName);
            const propName = applyCasing(tName, propertyCasing);
            const comma = idx < typesList.length - 1 ? ',' : '';
            block += `    ${csType}? ${propName} = null${comma}\n`;
          });
          block += `) : I${unionName};`;
          outputBlocks.push(block);
        }
      }

      // 3. Process Custom Scalars
      customScalars.forEach(scalarName => {
        const typeName = sanitizeCSharpIdentifier(scalarName);
        outputBlocks.push(`// Custom GraphQL Scalar\npublic record struct ${typeName}(object Value);`);
      });

      // 4. Process Object Types, Interfaces, Inputs
      const structRegex = /(type|interface|input)\s+([A-Za-z0-9_]+)(?:\s+implements\s+([^{]+))?\s*\{([^}]*)\}/g;
      let structMatch: RegExpExecArray | null;

      while ((structMatch = structRegex.exec(cleanInput)) !== null) {
        const kind = structMatch[1]; // type, interface, input
        const rawTypeName = structMatch[2];
        const implementsClause = structMatch[3];
        const body = structMatch[4];

        const csTypeName = sanitizeCSharpIdentifier(rawTypeName);

        let inheritance = '';
        if (implementsClause) {
          const interfaces = implementsClause
            .split('&')
            .map(i => sanitizeCSharpIdentifier(i.trim()))
            .filter(Boolean);
          if (interfaces.length > 0) {
            inheritance = ` : ${interfaces.join(', ')}`;
          }
        }

        const lines = body
          .split('\n')
          .map(l => l.trim())
          .filter(l => l && !l.startsWith('#'));

        let typeKeyword = 'class';
        if (kind === 'interface') {
          typeKeyword = 'interface';
        } else if (outputFormat === 'record') {
          typeKeyword = 'record';
        }

        let classHeader = `public ${typeKeyword} ${csTypeName}${inheritance}`;
        if (outputFormat === 'hotchocolate' && kind === 'input') {
          classHeader = `[InputObjectType]\n${classHeader}`;
        } else if (outputFormat === 'hotchocolate' && kind === 'type') {
          classHeader = `[GraphQLObjectType]\n${classHeader}`;
        }

        let block = `${classHeader}\n{\n`;
        let fieldCount = 0;

        lines.forEach(line => {
          const cleanLine = line.replace(/\([^)]*\)/, '');
          const colonIdx = cleanLine.indexOf(':');
          if (colonIdx === -1) return;

          const rawFieldName = cleanLine.substring(0, colonIdx).trim();
          const rawTypeStr = cleanLine.substring(colonIdx + 1).trim();

          if (!rawFieldName || !rawTypeStr) return;

          const propCased = applyCasing(rawFieldName, propertyCasing);
          const csPropName = sanitizeCSharpIdentifier(propCased);

          const { csharpType, isNonNull, isList } = mapGqlTypeToCSharp(rawTypeStr, customScalars);

          let finalCsType = csharpType;

          if (!isNonNull && useNullableTypes && !isList) {
            finalCsType = `${csharpType}?`;
          }

          // Build attributes
          const attributes: string[] = [];

          if (jsonAttributeFormat === 'system') {
            attributes.push(`[JsonPropertyName("${escapeCSharpString(rawFieldName)}")]`);
          } else if (jsonAttributeFormat === 'newtonsoft') {
            attributes.push(`[JsonProperty("${escapeCSharpString(rawFieldName)}")]`);
          }

          if (outputFormat === 'hotchocolate') {
            if (isNonNull) {
              attributes.push('[NonNullType]');
            }
            if (rawFieldName === 'id') {
              attributes.push('[ID]');
            }
          }

          const attrPrefix = attributes.length > 0 ? `${attributes.join('\n    ')}\n    ` : '';

          if (kind === 'interface') {
            block += `    ${attrPrefix}${finalCsType} ${csPropName} { get; }\n`;
          } else if (outputFormat === 'record') {
            block += `    ${attrPrefix}public ${finalCsType} ${csPropName} { get; init; }\n`;
          } else {
            block += `    ${attrPrefix}public ${finalCsType} ${csPropName} { get; set; }\n`;
          }
          fieldCount++;
        });

        block += `}`;
        if (fieldCount > 0 || kind === 'interface') {
          outputBlocks.push(block);
        }
      }

      if (outputBlocks.length === 0) {
        setError(t('graphqltocsharp.no_types_found', 'No valid GraphQL types, interfaces, inputs, or enums found.'));
        setOutput('');
        return;
      }

      // Build Namespace Header
      const headerLines: string[] = Array.from(usings).sort().map(u => `using ${u};`);

      let fullOutput = `${headerLines.join('\n')}\n\n`;
      if (namespaceName.trim()) {
        const cleanNamespace = namespaceName.trim().replace(/[^a-zA-Z0-9_.]/g, '');
        fullOutput += `namespace ${cleanNamespace}\n{\n${outputBlocks.map(b => b.split('\n').map(l => l ? `    ${l}` : '').join('\n')).join('\n\n')}\n}`;
      } else {
        fullOutput += outputBlocks.join('\n\n');
      }

      setOutput(fullOutput);
      setError('');
    } catch (e: any) {
      setError(t('graphqltocsharp.error_parsing', 'Error parsing GraphQL schema') + ': ' + e.message);
      setOutput('');
    }
  }, [input, namespaceName, outputFormat, jsonAttributeFormat, propertyCasing, useNullableTypes, idType, dateTimeType, t]);

  useEffect(() => {
    handleConvert();
  }, [handleConvert]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success(t('graphqltocsharp.toast_copied', 'C# models copied to clipboard!'));
    setTimeout(() => setCopied(false), 2000);
  }, [output, t]);

  const handleClear = useCallback(() => {
    setInput('');
    setOutput('');
    setError('');
    toast.success(t('graphqltocsharp.toast_cleared', 'Inputs cleared!'));
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [t]);

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'GraphQLModels.cs';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(t('common.downloaded', 'Downloaded GraphQLModels.cs!'));
  };

  const loadPreset = (presetKey: keyof typeof PRESETS) => {
    setInput(PRESETS[presetKey]);
    toast.success(t('graphqltocsharp.preset_loaded', 'Loaded GraphQL preset!'));
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
            {t('graphqltocsharp.presets_title', 'Quick Start Presets:')}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => loadPreset('ecommerce')}
            className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 rounded-xl transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
          >
            {t('graphqltocsharp.preset_ecommerce', 'E-Commerce Catalog')}
          </button>
          <button
            onClick={() => loadPreset('user_auth')}
            className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 rounded-xl transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
          >
            {t('graphqltocsharp.preset_user_auth', 'User Management & Auth')}
          </button>
          <button
            onClick={() => loadPreset('social_feed')}
            className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 rounded-xl transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
          >
            {t('graphqltocsharp.preset_social_feed', 'Social Feed & Comments')}
          </button>
        </div>
      </div>

      {/* Options Panel */}
      <div className="p-5 bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="namespace-name" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              {t('graphqltocsharp.namespace_name', 'C# Namespace')}
            </label>
            <input
              id="namespace-name"
              type="text"
              value={namespaceName}
              onChange={(e) => setNamespaceName(e.target.value)}
              placeholder="GraphQL.Models"
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="output-format" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              {t('graphqltocsharp.output_format', 'C# Target Type')}
            </label>
            <select
              id="output-format"
              value={outputFormat}
              onChange={(e) => setOutputFormat(e.target.value as OutputFormat)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="record">C# 9+ record</option>
              <option value="class">Standard class</option>
              <option value="hotchocolate">HotChocolate GraphQL Annotations</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="json-attribute" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              {t('graphqltocsharp.json_attribute', 'JSON Attributes')}
            </label>
            <select
              id="json-attribute"
              value={jsonAttributeFormat}
              onChange={(e) => setJsonAttributeFormat(e.target.value as JsonAttributeFormat)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="system">System.Text.Json ([JsonPropertyName])</option>
              <option value="newtonsoft">Newtonsoft.Json ([JsonProperty])</option>
              <option value="none">None</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="property-casing" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              {t('graphqltocsharp.property_casing', 'Property Casing')}
            </label>
            <select
              id="property-casing"
              value={propertyCasing}
              onChange={(e) => setPropertyCasing(e.target.value as PropertyCasing)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="PascalCase">PascalCase (C# default)</option>
              <option value="camelCase">camelCase</option>
              <option value="snake_case">snake_case</option>
              <option value="original">Original</option>
            </select>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-6">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mr-2">ID Scalar:</span>
              <select
                value={idType}
                onChange={(e) => setIdType(e.target.value as IdType)}
                className="p-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold"
              >
                <option value="string">string</option>
                <option value="Guid">Guid</option>
                <option value="int">int</option>
                <option value="long">long</option>
              </select>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mr-2">DateTime Scalar:</span>
              <select
                value={dateTimeType}
                onChange={(e) => setDateTimeType(e.target.value as DateTimeType)}
                className="p-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold"
              >
                <option value="DateTime">DateTime</option>
                <option value="DateTimeOffset">DateTimeOffset</option>
                <option value="string">string</option>
              </select>
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              <input
                type="checkbox"
                checked={useNullableTypes}
                onChange={(e) => setUseNullableTypes(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
              C# Nullable (`T?`)
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
              <label htmlFor="graphql-csharp-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('graphqltocsharp.graphql_input_label', 'GraphQL SDL Schema')}
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
            id="graphql-csharp-input"
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('graphqltocsharp.placeholder_graphql', 'Paste GraphQL SDL schema here...')}
            className="w-full h-[450px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-emerald-500" aria-hidden="true" />
              <label htmlFor="csharp-output" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('graphqltocsharp.output_label', 'Generated C# Code')}
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
            id="csharp-output"
            value={output}
            readOnly
            placeholder={t('graphqltocsharp.placeholder_output', 'Generated C# classes/records will appear here...')}
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
          <h4 className="font-bold dark:text-white">{t('graphqltocsharp.about_title', 'About GraphQL SDL to C# Converter')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('graphqltocsharp.about_text', 'Convert GraphQL Schema Definition Language (SDL) types, interfaces, inputs, enums, and unions directly into C# models: C# 9 records, classes, or HotChocolate GraphQL types with System.Text.Json or Newtonsoft.Json attributes.')}
          </p>
        </div>
      </div>
    </div>
  );
}
