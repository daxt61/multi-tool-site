import { useState, useEffect, useCallback, useRef } from 'react';
import { FileCode, Copy, Check, Trash2, AlertCircle, Download, Info, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;

type OutputFormat = 'pydantic_v2' | 'pydantic_v1' | 'dataclass' | 'strawberry';
type FieldCasing = 'snake_case' | 'camelCase' | 'PascalCase' | 'original';
type NullableSyntax = 'union_none' | 'optional';

const PYTHON_KEYWORDS = new Set([
  'and', 'as', 'assert', 'async', 'await', 'break', 'class', 'continue', 'def', 'del',
  'elif', 'else', 'except', 'false', 'finally', 'for', 'from', 'global', 'if', 'import',
  'in', 'is', 'lambda', 'none', 'nonlocal', 'not', 'or', 'pass', 'raise', 'return',
  'true', 'try', 'while', 'with', 'yield'
]);

export function GraphQLToPython({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState(initialData?.input || '');
  const [output, setOutput] = useState(initialData?.output || '');
  const [outputFormat, setOutputFormat] = useState<OutputFormat>(initialData?.outputFormat || 'pydantic_v2');
  const [fieldCasing, setFieldCasing] = useState<FieldCasing>(initialData?.fieldCasing || 'snake_case');
  const [nullableSyntax, setNullableSyntax] = useState<NullableSyntax>(initialData?.nullableSyntax || 'union_none');
  const [idType, setIdType] = useState<'str' | 'str_int' | 'UUID'>(initialData?.idType || 'str');
  const [dateTimeType, setDateTimeType] = useState<'datetime' | 'str'>(initialData?.dateTimeType || 'datetime');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({
      input,
      output,
      outputFormat,
      fieldCasing,
      nullableSyntax,
      idType,
      dateTimeType,
    });
  }, [input, output, outputFormat, fieldCasing, nullableSyntax, idType, dateTimeType, onStateChange]);

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

  const applyCasing = (str: string, casing: FieldCasing): string => {
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

  const sanitizePythonIdentifier = (name: string): { pyName: string; isKeywordEscaped: boolean } => {
    const lowerName = name.toLowerCase();
    if (PYTHON_KEYWORDS.has(lowerName)) {
      return { pyName: `${name}_`, isKeywordEscaped: true };
    }
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
      return { pyName: `_${name.replace(/[^a-zA-Z0-9_]/g, '_')}`, isKeywordEscaped: true };
    }
    return { pyName: name, isKeywordEscaped: false };
  };

  const mapGqlTypeToPy = (
    gqlTypeStr: string,
    customScalars: Set<string>
  ): { pyType: string; isNonNull: boolean } => {
    const raw = gqlTypeStr.trim();
    const isNonNull = raw.endsWith('!');
    const typeWithoutOuterBang = isNonNull ? raw.slice(0, -1).trim() : raw;

    if (typeWithoutOuterBang.startsWith('[') && typeWithoutOuterBang.endsWith(']')) {
      const innerGql = typeWithoutOuterBang.slice(1, -1).trim();
      const innerConverted = mapGqlTypeToPy(innerGql, customScalars);
      let innerPy = innerConverted.pyType;
      if (!innerConverted.isNonNull) {
        innerPy = nullableSyntax === 'union_none' ? `${innerPy} | None` : `Optional[${innerPy}]`;
      }
      return { pyType: `List[${innerPy}]`, isNonNull };
    }

    let base = typeWithoutOuterBang;
    let pyType = 'Any';

    if (base === 'String') pyType = 'str';
    else if (base === 'Int') pyType = 'int';
    else if (base === 'Float') pyType = 'float';
    else if (base === 'Boolean') pyType = 'bool';
    else if (base === 'ID') {
      if (idType === 'str') pyType = 'str';
      else if (idType === 'str_int') pyType = nullableSyntax === 'union_none' ? 'str | int' : 'Union[str, int]';
      else pyType = 'UUID';
    } else if (base === 'DateTime' || base === 'Date' || base === 'Time' || base === 'Timestamp') {
      pyType = dateTimeType === 'datetime' ? 'datetime' : 'str';
    } else if (base === 'JSON' || base === 'JSONObject' || base === 'JSONSchema') {
      pyType = 'Dict[str, Any]';
    } else if (customScalars.has(base)) {
      pyType = 'Any';
    } else {
      pyType = base;
    }

    return { pyType, isNonNull };
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

      const importsNeeded = new Set<string>();
      const typingImports = new Set<string>();
      const pydanticImports = new Set<string>();

      const outputBlocks: string[] = [];

      // 1. Process Enums
      const enumRegex = /enum\s+([A-Za-z0-9_]+)\s*\{([^}]*)\}/g;
      let enumMatch: RegExpExecArray | null;
      while ((enumMatch = enumRegex.exec(cleanInput)) !== null) {
        const enumName = enumMatch[1];
        const enumValues = enumMatch[2]
          .split(/\s+/)
          .map(v => v.trim())
          .filter(Boolean);

        importsNeeded.add('enum');

        if (outputFormat === 'strawberry') {
          importsNeeded.add('strawberry');
          let block = `@strawberry.enum\nclass ${enumName}(enum.Enum):\n`;
          enumValues.forEach(v => {
            const { pyName } = sanitizePythonIdentifier(v);
            block += `    ${pyName} = "${v}"\n`;
          });
          outputBlocks.push(block.trimEnd());
        } else {
          let block = `class ${enumName}(str, enum.Enum):\n`;
          enumValues.forEach(v => {
            const { pyName } = sanitizePythonIdentifier(v);
            block += `    ${pyName} = "${v}"\n`;
          });
          outputBlocks.push(block.trimEnd());
        }
      }

      // 2. Process Unions
      const unionRegex = /union\s+([A-Za-z0-9_]+)\s*=\s*([^;\n]+)/g;
      let unionMatch: RegExpExecArray | null;
      while ((unionMatch = unionRegex.exec(cleanInput)) !== null) {
        const unionName = unionMatch[1];
        const typesStr = unionMatch[2]
          .split('|')
          .map(t => t.trim())
          .filter(Boolean)
          .join(', ');

        if (outputFormat === 'strawberry') {
          importsNeeded.add('strawberry');
          outputBlocks.push(`${unionName} = strawberry.union("${unionName}", (${typesStr},))`);
        } else {
          if (nullableSyntax === 'union_none') {
            outputBlocks.push(`${unionName} = ${typesStr.replace(/,/g, ' |')}`);
          } else {
            typingImports.add('Union');
            outputBlocks.push(`${unionName} = Union[${typesStr}]`);
          }
        }
      }

      // 3. Process Custom Scalars
      customScalars.forEach(scalarName => {
        if (outputFormat === 'strawberry') {
          importsNeeded.add('strawberry');
          outputBlocks.push(`${scalarName} = strawberry.scalar(NewType("${scalarName}", str))`);
        } else {
          outputBlocks.push(`${scalarName} = Any`);
          typingImports.add('Any');
        }
      });

      // 4. Process Object Types, Interfaces, Inputs
      const structRegex = /(type|interface|input)\s+([A-Za-z0-9_]+)(?:\s+implements\s+[^{]+)?\s*\{([^}]*)\}/g;
      let structMatch: RegExpExecArray | null;

      while ((structMatch = structRegex.exec(cleanInput)) !== null) {
        const kind = structMatch[1]; // type, interface, input
        const rawTypeName = structMatch[2];
        const body = structMatch[3];

        const lines = body
          .split('\n')
          .map(l => l.trim())
          .filter(l => l && !l.startsWith('#'));

        let decorator = '';
        let baseClass = '';

        if (outputFormat === 'pydantic_v2' || outputFormat === 'pydantic_v1') {
          pydanticImports.add('BaseModel');
          baseClass = '(BaseModel)';
        } else if (outputFormat === 'dataclass') {
          importsNeeded.add('dataclasses');
          decorator = '@dataclasses.dataclass\n';
        } else if (outputFormat === 'strawberry') {
          importsNeeded.add('strawberry');
          if (kind === 'input') {
            decorator = '@strawberry.input\n';
          } else if (kind === 'interface') {
            decorator = '@strawberry.interface\n';
          } else {
            decorator = '@strawberry.type\n';
          }
        }

        let block = `${decorator}class ${rawTypeName}${baseClass}:\n`;
        let fieldLinesCount = 0;

        lines.forEach(line => {
          const cleanLine = line.replace(/\([^)]*\)/, '');
          const colonIdx = cleanLine.indexOf(':');
          if (colonIdx === -1) return;

          const rawFieldName = cleanLine.substring(0, colonIdx).trim();
          const rawTypeStr = cleanLine.substring(colonIdx + 1).trim();

          if (!rawFieldName || !rawTypeStr) return;

          const fieldCased = applyCasing(rawFieldName, fieldCasing);
          const { pyName, isKeywordEscaped } = sanitizePythonIdentifier(fieldCased);

          const { pyType, isNonNull } = mapGqlTypeToPy(rawTypeStr, customScalars);

          if (pyType.includes('List[')) typingImports.add('List');
          if (pyType.includes('Dict[')) typingImports.add('Dict');
          if (pyType.includes('Any')) typingImports.add('Any');
          if (pyType.includes('Optional[')) typingImports.add('Optional');
          if (pyType.includes('Union[')) typingImports.add('Union');
          if (pyType.includes('UUID')) importsNeeded.add('uuid');
          if (pyType.includes('datetime')) importsNeeded.add('datetime');

          let finalPyType = pyType;
          let defaultValue = '';

          if (!isNonNull) {
            if (nullableSyntax === 'union_none') {
              finalPyType = `${pyType} | None`;
              defaultValue = ' = None';
            } else {
              typingImports.add('Optional');
              finalPyType = `Optional[${pyType}]`;
              defaultValue = ' = None';
            }
          }

          let fieldExtra = '';
          if ((outputFormat === 'pydantic_v2' || outputFormat === 'pydantic_v1') && (rawFieldName !== pyName || isKeywordEscaped)) {
            pydanticImports.add('Field');
            if (outputFormat === 'pydantic_v2') {
              fieldExtra = ` = Field(${defaultValue ? 'None, ' : ''}alias="${rawFieldName}")`;
            } else {
              fieldExtra = ` = Field(${defaultValue ? 'None, ' : ''}alias="${rawFieldName}")`;
            }
            defaultValue = ''; // Handled in Field
          }

          block += `    ${pyName}: ${finalPyType}${fieldExtra}${defaultValue}\n`;
          fieldLinesCount++;
        });

        if (fieldLinesCount === 0) {
          block += '    pass\n';
        }

        outputBlocks.push(block.trimEnd());
      }

      if (outputBlocks.length === 0) {
        setError(t('graphqltopython.no_types_found', 'No valid GraphQL types, interfaces, inputs, or enums found.'));
        setOutput('');
        return;
      }

      // Build Imports Header
      const headerLines: string[] = [];

      if (importsNeeded.has('datetime')) headerLines.push('from datetime import datetime');
      if (importsNeeded.has('uuid')) headerLines.push('from uuid import UUID');
      if (importsNeeded.has('enum')) headerLines.push('import enum');
      if (importsNeeded.has('dataclasses')) headerLines.push('import dataclasses');
      if (importsNeeded.has('strawberry')) headerLines.push('import strawberry');

      if (typingImports.size > 0) {
        const sortedTyping = Array.from(typingImports).sort();
        headerLines.push(`from typing import ${sortedTyping.join(', ')}`);
      }

      if (pydanticImports.size > 0) {
        const sortedPydantic = Array.from(pydanticImports).sort();
        headerLines.push(`from pydantic import ${sortedPydantic.join(', ')}`);
      }

      const fullOutput = headerLines.length > 0
        ? `${headerLines.join('\n')}\n\n${outputBlocks.join('\n\n')}`
        : outputBlocks.join('\n\n');

      setOutput(fullOutput);
      setError('');
    } catch (e: any) {
      setError(t('graphqltopython.error_parsing', 'Error parsing GraphQL schema') + ': ' + e.message);
      setOutput('');
    }
  }, [input, outputFormat, fieldCasing, nullableSyntax, idType, dateTimeType, t]);

  useEffect(() => {
    handleConvert();
  }, [handleConvert]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success(t('graphqltopython.toast_copied', 'Python code copied to clipboard!'));
    setTimeout(() => setCopied(false), 2000);
  }, [output, t]);

  const handleClear = useCallback(() => {
    setInput('');
    setOutput('');
    setError('');
    toast.success(t('graphqltopython.toast_cleared', 'Inputs cleared!'));
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [t]);

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/x-python' });
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
    toast.success(t('graphqltopython.preset_loaded', 'Loaded GraphQL preset!'));
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
            {t('graphqltopython.presets_title', 'Quick Start Presets:')}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => loadPreset('ecommerce')}
            className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 rounded-xl transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
          >
            {t('graphqltopython.preset_ecommerce', 'E-Commerce Catalog')}
          </button>
          <button
            onClick={() => loadPreset('user_auth')}
            className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 rounded-xl transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
          >
            {t('graphqltopython.preset_user_auth', 'User Management & Auth')}
          </button>
          <button
            onClick={() => loadPreset('social_feed')}
            className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 rounded-xl transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
          >
            {t('graphqltopython.preset_social_feed', 'Social Feed & Comments')}
          </button>
        </div>
      </div>

      {/* Options Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-5 bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="space-y-1.5">
          <label htmlFor="output-format" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('graphqltopython.output_format', 'Python Target Format')}
          </label>
          <select
            id="output-format"
            value={outputFormat}
            onChange={(e) => setOutputFormat(e.target.value as OutputFormat)}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="pydantic_v2">Pydantic V2 (BaseModel)</option>
            <option value="pydantic_v1">Pydantic V1 (BaseModel)</option>
            <option value="dataclass">Python @dataclass</option>
            <option value="strawberry">Strawberry GraphQL Types</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="field-casing" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('graphqltopython.field_casing', 'Attribute Casing')}
          </label>
          <select
            id="field-casing"
            value={fieldCasing}
            onChange={(e) => setFieldCasing(e.target.value as FieldCasing)}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="snake_case">snake_case (PEP 8 default)</option>
            <option value="camelCase">camelCase</option>
            <option value="PascalCase">PascalCase</option>
            <option value="original">Original</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="nullable-syntax" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('graphqltopython.nullable_syntax', 'Nullable Type Syntax')}
          </label>
          <select
            id="nullable-syntax"
            value={nullableSyntax}
            onChange={(e) => setNullableSyntax(e.target.value as NullableSyntax)}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="union_none">T | None (Python 3.10+)</option>
            <option value="optional">Optional[T] (typing)</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="id-type" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('graphqltopython.id_type', 'GraphQL ID Scalar')}
          </label>
          <select
            id="id-type"
            value={idType}
            onChange={(e) => setIdType(e.target.value as any)}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="str">str (default)</option>
            <option value="str_int">str | int</option>
            <option value="UUID">UUID (uuid)</option>
          </select>
        </div>
      </div>

      {/* Editor Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-indigo-500" aria-hidden="true" />
              <label htmlFor="graphql-python-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('graphqltopython.graphql_input_label', 'GraphQL SDL Schema')}
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
            id="graphql-python-input"
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('graphqltopython.placeholder_graphql', 'Paste GraphQL SDL schema here...')}
            className="w-full h-[450px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-emerald-500" aria-hidden="true" />
              <label htmlFor="python-output" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('graphqltopython.output_label', 'Generated Python Code')}
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
            id="python-output"
            value={output}
            readOnly
            placeholder={t('graphqltopython.placeholder_output', 'Generated Python models will appear here...')}
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
          <h4 className="font-bold dark:text-white">{t('graphqltopython.about_title', 'About GraphQL SDL to Python Converter')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('graphqltopython.about_text', 'Convert GraphQL Schema Definition Language (SDL) types, interfaces, inputs, enums, and unions directly into strongly-typed Python models: Pydantic V2/V1, Python dataclasses, or Strawberry GraphQL types.')}
          </p>
        </div>
      </div>
    </div>
  );
}
