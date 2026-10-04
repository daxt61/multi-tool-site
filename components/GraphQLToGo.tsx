import { useState, useEffect, useCallback, useRef } from 'react';
import { FileCode, Copy, Check, Trash2, AlertCircle, Download, Info, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;

type FieldCasing = 'PascalCase' | 'snake_case' | 'camelCase' | 'original';
type NullableHandling = 'pointers' | 'omit_pointers';
type IdType = 'string' | 'int64' | 'int';
type DateTimeType = 'time.Time' | 'string' | 'int64';

const GO_KEYWORDS = new Set([
  'break', 'default', 'func', 'interface', 'select', 'case', 'defer', 'go', 'map',
  'struct', 'chan', 'else', 'goto', 'package', 'switch', 'const', 'fallthrough',
  'if', 'range', 'type', 'continue', 'for', 'import', 'return', 'var', 'string',
  'int', 'int64', 'bool', 'float64', 'uint', 'byte'
]);

export function GraphQLToGo({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState(initialData?.input || '');
  const [output, setOutput] = useState(initialData?.output || '');
  const [packageName, setPackageName] = useState(initialData?.packageName || 'main');
  const [fieldCasing, setFieldCasing] = useState<FieldCasing>(initialData?.fieldCasing || 'PascalCase');
  const [nullableHandling, setNullableHandling] = useState<NullableHandling>(initialData?.nullableHandling || 'pointers');
  const [useJsonTag, setUseJsonTag] = useState<boolean>(initialData?.useJsonTag !== undefined ? initialData.useJsonTag : true);
  const [useYamlTag, setUseYamlTag] = useState<boolean>(initialData?.useYamlTag || false);
  const [useXmlTag, setUseXmlTag] = useState<boolean>(initialData?.useXmlTag || false);
  const [useGormTag, setUseGormTag] = useState<boolean>(initialData?.useGormTag || false);
  const [idType, setIdType] = useState<IdType>(initialData?.idType || 'string');
  const [dateTimeType, setDateTimeType] = useState<DateTimeType>(initialData?.dateTimeType || 'time.Time');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({
      input,
      output,
      packageName,
      fieldCasing,
      nullableHandling,
      useJsonTag,
      useYamlTag,
      useXmlTag,
      useGormTag,
      idType,
      dateTimeType,
    });
  }, [input, output, packageName, fieldCasing, nullableHandling, useJsonTag, useYamlTag, useXmlTag, useGormTag, idType, dateTimeType, onStateChange]);

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

  const sanitizeGoFieldName = (name: string): string => {
    let pascalName = applyCasing(name, 'PascalCase');
    if (GO_KEYWORDS.has(pascalName.toLowerCase())) {
      pascalName = `${pascalName}Val`;
    }
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(pascalName)) {
      pascalName = `X${pascalName.replace(/[^A-Za-z0-9_]/g, '_')}`;
    }
    return pascalName;
  };

  const mapGqlTypeToGo = (
    gqlTypeStr: string,
    customScalars: Set<string>
  ): { goType: string; isNonNull: boolean; isSlice: boolean } => {
    const raw = gqlTypeStr.trim();
    const isNonNull = raw.endsWith('!');
    const typeWithoutOuterBang = isNonNull ? raw.slice(0, -1).trim() : raw;

    if (typeWithoutOuterBang.startsWith('[') && typeWithoutOuterBang.endsWith(']')) {
      const innerGql = typeWithoutOuterBang.slice(1, -1).trim();
      const innerConverted = mapGqlTypeToGo(innerGql, customScalars);
      let innerGo = innerConverted.goType;
      return { goType: `[]${innerGo}`, isNonNull, isSlice: true };
    }

    let base = typeWithoutOuterBang;
    let goType = 'any';

    if (base === 'String') goType = 'string';
    else if (base === 'Int') goType = 'int';
    else if (base === 'Float') goType = 'float64';
    else if (base === 'Boolean') goType = 'bool';
    else if (base === 'ID') goType = idType;
    else if (base === 'DateTime' || base === 'Date' || base === 'Time' || base === 'Timestamp') {
      goType = dateTimeType;
    } else if (base === 'JSON' || base === 'JSONObject' || base === 'JSONSchema') {
      goType = 'map[string]any';
    } else if (customScalars.has(base)) {
      goType = 'any';
    } else {
      goType = base;
    }

    return { goType, isNonNull, isSlice: false };
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
      const outputBlocks: string[] = [];

      // 1. Process Enums
      const enumRegex = /enum\s+([A-Za-z0-9_]+)\s*\{([^}]*)\}/g;
      let enumMatch: RegExpExecArray | null;
      while ((enumMatch = enumRegex.exec(cleanInput)) !== null) {
        const enumName = sanitizeGoFieldName(enumMatch[1]);
        const enumValues = enumMatch[2]
          .split(/\s+/)
          .map(v => v.trim())
          .filter(Boolean);

        let block = `type ${enumName} string\n\nconst (\n`;
        enumValues.forEach(v => {
          const constName = `${enumName}${sanitizeGoFieldName(v)}`;
          block += `\t${constName} ${enumName} = "${v}"\n`;
        });
        block += `)`;
        outputBlocks.push(block);
      }

      // 2. Process Unions
      const unionRegex = /union\s+([A-Za-z0-9_]+)\s*=\s*([^;\n]+)/g;
      let unionMatch: RegExpExecArray | null;
      while ((unionMatch = unionRegex.exec(cleanInput)) !== null) {
        const unionName = sanitizeGoFieldName(unionMatch[1]);
        const typesList = unionMatch[2]
          .split('|')
          .map(t => t.trim())
          .filter(Boolean);

        let block = `type ${unionName} struct {\n`;
        typesList.forEach(tName => {
          const goType = sanitizeGoFieldName(tName);
          block += `\t${goType} *${goType}\n`;
        });
        block += `}`;
        outputBlocks.push(block);
      }

      // 3. Process Custom Scalars
      customScalars.forEach(scalarName => {
        const typeName = sanitizeGoFieldName(scalarName);
        outputBlocks.push(`type ${typeName} any`);
      });

      // 4. Process Structs (Types, Interfaces, Inputs)
      const structRegex = /(type|interface|input)\s+([A-Za-z0-9_]+)(?:\s+implements\s+[^{]+)?\s*\{([^}]*)\}/g;
      let structMatch: RegExpExecArray | null;

      while ((structMatch = structRegex.exec(cleanInput)) !== null) {
        const rawTypeName = structMatch[2];
        const structName = sanitizeGoFieldName(rawTypeName);
        const body = structMatch[3];

        const lines = body
          .split('\n')
          .map(l => l.trim())
          .filter(l => l && !l.startsWith('#'));

        let block = `type ${structName} struct {\n`;
        let fieldCount = 0;

        lines.forEach(line => {
          const cleanLine = line.replace(/\([^)]*\)/, '');
          const colonIdx = cleanLine.indexOf(':');
          if (colonIdx === -1) return;

          const rawFieldName = cleanLine.substring(0, colonIdx).trim();
          const rawTypeStr = cleanLine.substring(colonIdx + 1).trim();

          if (!rawFieldName || !rawTypeStr) return;

          const fieldNameCased = applyCasing(rawFieldName, fieldCasing);
          const goFieldName = sanitizeGoFieldName(fieldNameCased);

          const { goType, isNonNull, isSlice } = mapGqlTypeToGo(rawTypeStr, customScalars);

          if (goType.includes('time.Time')) {
            importsNeeded.add('time');
          }

          let finalType = goType;
          let isPointer = false;

          if (!isNonNull && !isSlice && nullableHandling === 'pointers') {
            if (!goType.startsWith('*') && goType !== 'any' && !goType.startsWith('map[')) {
              finalType = `*${goType}`;
              isPointer = true;
            }
          }

          // Build tags
          const tags: string[] = [];
          const tagValue = applyCasing(rawFieldName, 'snake_case');

          if (useJsonTag) {
            const omitOpt = (!isNonNull || isPointer) ? ',omitempty' : '';
            tags.push(`json:"${tagValue}${omitOpt}"`);
          }
          if (useYamlTag) {
            const omitOpt = (!isNonNull || isPointer) ? ',omitempty' : '';
            tags.push(`yaml:"${tagValue}${omitOpt}"`);
          }
          if (useXmlTag) {
            const omitOpt = (!isNonNull || isPointer) ? ',omitempty' : '';
            tags.push(`xml:"${tagValue}${omitOpt}"`);
          }
          if (useGormTag) {
            const gormOpts: string[] = [`column:${tagValue}`];
            if (rawFieldName === 'id') gormOpts.push('primaryKey');
            if (isNonNull) gormOpts.push('not null');
            tags.push(`gorm:"${gormOpts.join(';')}"`);
          }

          const tagString = tags.length > 0 ? ` \`${tags.join(' ')}\`` : '';

          block += `\t${goFieldName} ${finalType}${tagString}\n`;
          fieldCount++;
        });

        block += `}`;
        if (fieldCount > 0) {
          outputBlocks.push(block);
        }
      }

      if (outputBlocks.length === 0) {
        setError(t('graphqltogo.no_types_found', 'No valid GraphQL types, interfaces, inputs, or enums found.'));
        setOutput('');
        return;
      }

      // Build Package Header
      const headerLines: string[] = [`package ${packageName || 'main'}`];

      if (importsNeeded.size > 0) {
        headerLines.push('');
        headerLines.push('import (');
        Array.from(importsNeeded).sort().forEach(imp => {
          headerLines.push(`\t"${imp}"`);
        });
        headerLines.push(')');
      }

      const fullOutput = `${headerLines.join('\n')}\n\n${outputBlocks.join('\n\n')}`;
      setOutput(fullOutput);
      setError('');
    } catch (e: any) {
      setError(t('graphqltogo.error_parsing', 'Error parsing GraphQL schema') + ': ' + e.message);
      setOutput('');
    }
  }, [input, packageName, fieldCasing, nullableHandling, useJsonTag, useYamlTag, useXmlTag, useGormTag, idType, dateTimeType, t]);

  useEffect(() => {
    handleConvert();
  }, [handleConvert]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success(t('graphqltogo.toast_copied', 'Go struct definitions copied to clipboard!'));
    setTimeout(() => setCopied(false), 2000);
  }, [output, t]);

  const handleClear = useCallback(() => {
    setInput('');
    setOutput('');
    setError('');
    toast.success(t('graphqltogo.toast_cleared', 'Inputs cleared!'));
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [t]);

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/x-go' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'models.go';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(t('common.downloaded', 'Downloaded models.go!'));
  };

  const loadPreset = (presetKey: keyof typeof PRESETS) => {
    setInput(PRESETS[presetKey]);
    toast.success(t('graphqltogo.preset_loaded', 'Loaded GraphQL preset!'));
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
            {t('graphqltogo.presets_title', 'Quick Start Presets:')}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => loadPreset('ecommerce')}
            className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 rounded-xl transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
          >
            {t('graphqltogo.preset_ecommerce', 'E-Commerce Catalog')}
          </button>
          <button
            onClick={() => loadPreset('user_auth')}
            className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 rounded-xl transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
          >
            {t('graphqltogo.preset_user_auth', 'User Management & Auth')}
          </button>
          <button
            onClick={() => loadPreset('social_feed')}
            className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 rounded-xl transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
          >
            {t('graphqltogo.preset_social_feed', 'Social Feed & Comments')}
          </button>
        </div>
      </div>

      {/* Options Panel */}
      <div className="p-5 bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="package-name" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              {t('graphqltogo.package_name', 'Package Name')}
            </label>
            <input
              id="package-name"
              type="text"
              value={packageName}
              onChange={(e) => setPackageName(e.target.value)}
              placeholder="main"
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="field-casing" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              {t('graphqltogo.field_casing', 'Struct Field Casing')}
            </label>
            <select
              id="field-casing"
              value={fieldCasing}
              onChange={(e) => setFieldCasing(e.target.value as FieldCasing)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="PascalCase">PascalCase (Exported)</option>
              <option value="camelCase">camelCase</option>
              <option value="snake_case">snake_case</option>
              <option value="original">Original</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="nullable-handling" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              {t('graphqltogo.nullable_handling', 'Nullable Fields')}
            </label>
            <select
              id="nullable-handling"
              value={nullableHandling}
              onChange={(e) => setNullableHandling(e.target.value as NullableHandling)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="pointers">Pointers (*T)</option>
              <option value="omit_pointers">Plain Value (T)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="id-type" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              {t('graphqltogo.id_type', 'GraphQL ID Type')}
            </label>
            <select
              id="id-type"
              value={idType}
              onChange={(e) => setIdType(e.target.value as IdType)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="string">string</option>
              <option value="int64">int64</option>
              <option value="int">int</option>
            </select>
          </div>
        </div>

        {/* Go Field Tags Checkboxes */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-6">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('graphqltogo.tags_title', 'Go Struct Tags:')}
          </span>
          <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold">
            <input
              type="checkbox"
              checked={useJsonTag}
              onChange={(e) => setUseJsonTag(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
            />
            `json:"..."`
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold">
            <input
              type="checkbox"
              checked={useYamlTag}
              onChange={(e) => setUseYamlTag(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
            />
            `yaml:"..."`
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold">
            <input
              type="checkbox"
              checked={useXmlTag}
              onChange={(e) => setUseXmlTag(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
            />
            `xml:"..."`
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold">
            <input
              type="checkbox"
              checked={useGormTag}
              onChange={(e) => setUseGormTag(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
            />
            `gorm:"..."`
          </label>
        </div>
      </div>

      {/* Editor Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-indigo-500" aria-hidden="true" />
              <label htmlFor="graphql-go-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('graphqltogo.graphql_input_label', 'GraphQL SDL Schema')}
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
            id="graphql-go-input"
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('graphqltogo.placeholder_graphql', 'Paste GraphQL SDL schema here...')}
            className="w-full h-[450px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-emerald-500" aria-hidden="true" />
              <label htmlFor="go-output" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('graphqltogo.output_label', 'Generated Go Code')}
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
            id="go-output"
            value={output}
            readOnly
            placeholder={t('graphqltogo.placeholder_output', 'Generated Go struct definitions will appear here...')}
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
          <h4 className="font-bold dark:text-white">{t('graphqltogo.about_title', 'About GraphQL SDL to Go Converter')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('graphqltogo.about_text', 'Convert GraphQL Schema Definition Language (SDL) types, interfaces, inputs, enums, and unions directly into strongly-typed Go struct definitions with customizable tags (`json`, `yaml`, `xml`, `gorm`), pointer nullability, and reserved keyword sanitization.')}
          </p>
        </div>
      </div>
    </div>
  );
}
