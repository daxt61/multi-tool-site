import { useState, useEffect, useCallback, useRef } from 'react';
import { FileCode, Copy, Check, Trash2, AlertCircle, Download, Info, Settings, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;

type PydanticVersion = 'v2' | 'v1';
type FieldCasing = 'snake_case' | 'camelCase' | 'PascalCase' | 'original';
type NullableSyntax = 'union' | 'optional';

const PYTHON_KEYWORDS = new Set([
  'False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await',
  'break', 'class', 'continue', 'def', 'del', 'elif', 'else', 'except',
  'finally', 'for', 'from', 'global', 'if', 'import', 'in', 'is',
  'lambda', 'nonlocal', 'not', 'or', 'pass', 'raise', 'return', 'try',
  'while', 'with', 'yield', 'type', 'id', 'dict', 'list', 'set', 'str', 'int', 'float', 'bool'
]);

const escapePythonString = (str: string): string => {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r');
};

const sanitizePythonIdentifier = (str: string): string => {
  let clean = str.replace(/[^a-zA-Z0-9_]/g, '');
  if (/^[0-9]/.test(clean)) {
    clean = 'field_' + clean;
  }
  if (PYTHON_KEYWORDS.has(clean) || clean === '__proto__' || clean === 'constructor' || clean === 'prototype') {
    clean = clean + '_';
  }
  return clean || 'field_';
};

interface GraphQLField {
  name: string;
  pythonName: string;
  type: string;
  isList: boolean;
  isRequired: boolean;
  isEnum: boolean;
  isCustomType: boolean;
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

export function GraphQLToPydantic({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [input, setInput] = useState(initialData?.input || '');
  const [output, setOutput] = useState('');
  const [version, setVersion] = useState<PydanticVersion>(initialData?.version || 'v2');
  const [casing, setCasing] = useState<FieldCasing>(initialData?.casing || 'snake_case');
  const [nullableSyntax, setNullableSyntax] = useState<NullableSyntax>(initialData?.nullableSyntax || 'union');
  const [useFieldAlias, setUseFieldAlias] = useState<boolean>(initialData?.useFieldAlias ?? true);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ input, version, casing, nullableSyntax, useFieldAlias });
  }, [input, version, casing, nullableSyntax, useFieldAlias, onStateChange]);

  const toSnakeCase = (str: string): string => {
    return str
      .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
      .replace(/[^a-zA-Z0-9_]/g, '_')
      .toLowerCase();
  };

  const toCamelCase = (str: string): string => {
    const pascal = toPascalCase(str);
    return pascal.charAt(0).toLowerCase() + pascal.slice(1);
  };

  const toPascalCase = (str: string): string => {
    const cleaned = str.replace(/[^a-zA-Z0-9]/g, ' ');
    const result = cleaned
      .split(/\s+/)
      .filter(Boolean)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
    return sanitizePythonIdentifier(result || 'Model');
  };

  const formatFieldName = (rawName: string, casingMode: FieldCasing): string => {
    let formatted = rawName;
    if (casingMode === 'snake_case') {
      formatted = toSnakeCase(rawName);
    } else if (casingMode === 'camelCase') {
      formatted = toCamelCase(rawName);
    } else if (casingMode === 'PascalCase') {
      formatted = toPascalCase(rawName);
    }
    return sanitizePythonIdentifier(formatted);
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
  totalAmount: Float!
  status: OrderStatus!
  items: [Product!]!
}`,
    user_auth: `enum UserRole {
  USER
  ADMIN
  MANAGER
}

type User {
  id: ID!
  email: String!
  fullName: String
  role: UserRole!
  profile: Profile
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
}

type Post {
  id: ID!
  title: String!
  content: String!
  publishedAt: String
  author: User!
  comments: [Comment!]!
}

type Comment {
  id: ID!
  text: String!
  author: User!
}`
  };

  const mapGraphQLScalarToPython = (gqlType: string): string => {
    switch (gqlType) {
      case 'ID':
      case 'String':
        return 'str';
      case 'Int':
        return 'int';
      case 'Float':
        return 'float';
      case 'Boolean':
        return 'bool';
      case 'DateTime':
      case 'Date':
      case 'Timestamp':
        return 'datetime';
      case 'Json':
      case 'JSON':
      case 'JSONObject':
        return 'dict[str, Any]';
      default:
        return toPascalCase(gqlType);
    }
  };

  const generatePydanticCode = useCallback(() => {
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
          .map(v => sanitizePythonIdentifier(v));

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
            const pythonName = formatFieldName(rawFieldName, casing);

            fields.push({
              name: rawFieldName,
              pythonName,
              type: baseGqlType,
              isList,
              isRequired,
              isEnum: false,
              isCustomType: false
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
        setError(t('graphqltopydantic.no_types_found', 'No valid GraphQL types, inputs, or enums found.'));
        setOutput('');
        return;
      }

      // Mark custom types & enums
      parsedTypes.forEach(pType => {
        pType.fields.forEach(f => {
          const mappedName = toPascalCase(f.type);
          if (enumNamesSet.has(mappedName) || enumNamesSet.has(f.type)) {
            f.isEnum = true;
          } else if (typeNamesSet.has(mappedName) || typeNamesSet.has(f.type)) {
            f.isCustomType = true;
          }
        });
      });

      // Assemble Python Code
      let codeStr = `from enum import Enum\nfrom datetime import datetime\nfrom typing import Any\n`;
      if (nullableSyntax === 'optional') {
        codeStr += `from typing import Optional\n`;
      }

      if (version === 'v2') {
        codeStr += `from pydantic import BaseModel, Field, ConfigDict\n\n`;
      } else {
        codeStr += `from pydantic import BaseModel, Field\n\n`;
      }

      // Enums
      parsedEnums.forEach(e => {
        codeStr += `class ${e.pascalName}(str, Enum):\n`;
        e.values.forEach(val => {
          codeStr += `    ${val} = "${escapePythonString(val)}"\n`;
        });
        codeStr += `\n\n`;
      });

      // Models
      parsedTypes.forEach(model => {
        codeStr += `class ${model.pascalName}(BaseModel):\n`;

        if (version === 'v2') {
          codeStr += `    model_config = ConfigDict(populate_by_name=True)\n\n`;
        }

        model.fields.forEach(f => {
          let basePyType = mapGraphQLScalarToPython(f.type);

          if (f.isList) {
            basePyType = `list[${basePyType}]`;
          }

          let pyTypeStr = basePyType;
          let defaultValueStr = '';

          if (!f.isRequired) {
            if (nullableSyntax === 'union') {
              pyTypeStr = `${basePyType} | None`;
            } else {
              pyTypeStr = `Optional[${basePyType}]`;
            }
            defaultValueStr = ' = None';
          }

          let aliasAttr = '';
          if (useFieldAlias && f.pythonName !== f.name) {
            aliasAttr = f.isRequired ? `Field(..., alias="${escapePythonString(f.name)}")` : `Field(None, alias="${escapePythonString(f.name)}")`;
            defaultValueStr = ` = ${aliasAttr}`;
          }

          codeStr += `    ${f.pythonName}: ${pyTypeStr}${defaultValueStr}\n`;
        });

        if (version === 'v1' && useFieldAlias) {
          codeStr += `\n    class Config:\n        allow_population_by_field_name = True\n`;
        }

        codeStr += `\n\n`;
      });

      setOutput(codeStr.trim());
      setError(null);
    } catch (e: any) {
      setError(t('graphqltopydantic.error_parsing', 'Error parsing GraphQL schema') + ': ' + e.message);
      setOutput('');
    }
  }, [input, version, casing, nullableSyntax, useFieldAlias, t]);

  useEffect(() => {
    generatePydanticCode();
  }, [generatePydanticCode]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success(t('graphqltopydantic.toast_copied', 'Python code copied to clipboard!'));
    setTimeout(() => setCopied(false), 2000);
  }, [output, t]);

  const handleClear = useCallback(() => {
    setInput('');
    setOutput('');
    setError(null);
    setActivePresetId(null);
    toast.success(t('graphqltopydantic.toast_cleared', 'Inputs cleared!'));
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [t]);

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'models.py';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(t('common.downloaded', 'Downloaded models.py!'));
  };

  const loadPreset = (presetKey: keyof typeof PRESETS) => {
    setInput(PRESETS[presetKey]);
    setActivePresetId(presetKey);
    toast.success(t('graphqltopydantic.preset_loaded', 'Loaded GraphQL preset!'));
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
            {t('graphqltopydantic.presets_title', 'Quick Start Presets:')}
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
            {t('graphqltopydantic.preset_ecommerce', 'E-Commerce Catalog')}
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
            {t('graphqltopydantic.preset_user_auth', 'User Management & Auth')}
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
            {t('graphqltopydantic.preset_social_feed', 'Social Feed & Comments')}
          </button>
        </div>
      </div>

      {/* Options Panel */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-5 bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="space-y-1.5">
          <label htmlFor="pydantic-version" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('graphqltopydantic.version', 'Pydantic Version')}
          </label>
          <select
            id="pydantic-version"
            value={version}
            onChange={(e) => setVersion(e.target.value as PydanticVersion)}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="v2">Pydantic V2</option>
            <option value="v1">Pydantic V1</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="pydantic-casing" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('graphqltopydantic.casing', 'Attribute Casing')}
          </label>
          <select
            id="pydantic-casing"
            value={casing}
            onChange={(e) => setCasing(e.target.value as FieldCasing)}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="snake_case">snake_case (PEP 8)</option>
            <option value="camelCase">camelCase</option>
            <option value="PascalCase">PascalCase</option>
            <option value="original">Original (GraphQL)</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="pydantic-nullable-syntax" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('graphqltopydantic.nullable_syntax', 'Nullable Type Syntax')}
          </label>
          <select
            id="pydantic-nullable-syntax"
            value={nullableSyntax}
            onChange={(e) => setNullableSyntax(e.target.value as NullableSyntax)}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="union">T | None (Python 3.10+)</option>
            <option value="optional">Optional[T] (typing)</option>
          </select>
        </div>

        <div className="flex items-center gap-3 pt-6">
          <input
            id="pydantic-use-alias"
            type="checkbox"
            checked={useFieldAlias}
            onChange={(e) => setUseFieldAlias(e.target.checked)}
            className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
          />
          <label htmlFor="pydantic-use-alias" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
            {t('graphqltopydantic.use_alias', 'Include Field(alias=...) for mapped names')}
          </label>
        </div>
      </div>

      {/* Editor Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-indigo-500" aria-hidden="true" />
              <label htmlFor="graphql-pydantic-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('graphqltopydantic.graphql_input_label', 'GraphQL SDL Schema')}
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
            id="graphql-pydantic-input"
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('graphqltopydantic.placeholder_graphql', 'Paste GraphQL SDL schema definitions here...')}
            className="w-full h-[450px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-emerald-500" aria-hidden="true" />
              <label htmlFor="pydantic-output" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('graphqltopydantic.output_label', 'Generated Python Pydantic Models')}
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
            id="pydantic-output"
            value={output}
            readOnly
            placeholder={t('graphqltopydantic.placeholder_output', 'Python Pydantic models will appear here...')}
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
          <h4 className="font-bold dark:text-white">{t('graphqltopydantic.about_title', 'About GraphQL to Pydantic Converter')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('graphqltopydantic.about_text', 'Convert GraphQL Schema Definition Language (SDL) statements directly into Python Pydantic V2 or V1 models. Supports PEP 8 snake_case attribute conversion, Field aliases, Python 3.10+ union nullability (T | None) or Optional[T], and string Enum classes.')}
          </p>
        </div>
      </div>
    </div>
  );
}
