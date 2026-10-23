import { useState, useEffect, useCallback, useRef } from 'react';
import { Database, Copy, Check, Trash2, AlertCircle, Download, Info, Sparkles, Terminal } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;

type FieldCasing = 'snake_case' | 'camelCase' | 'PascalCase' | 'original';

export function GraphQLToElasticsearch({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [input, setInput] = useState(initialData?.input || '');
  const [output, setOutput] = useState(initialData?.output || '');
  const [outputMode, setOutputMode] = useState<'mapping' | 'curl'>(initialData?.outputMode || 'mapping');
  const [fieldCasing, setFieldCasing] = useState<FieldCasing>(initialData?.fieldCasing || 'snake_case');
  const [esHost, setEsHost] = useState(initialData?.esHost || 'http://localhost:9200');
  const [activePresetId, setActivePresetId] = useState<string | null>(initialData?.activePresetId || null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({
      input,
      output,
      outputMode,
      fieldCasing,
      esHost,
      activePresetId,
    });
  }, [input, output, outputMode, fieldCasing, esHost, activePresetId, onStateChange]);

  const PRESETS = {
    ecommerce: `# E-Commerce Catalog Schema
type Category {
  id: ID!
  name: String!
  slug: String!
  description: String
  parentId: ID
}

type Product {
  id: ID!
  title: String!
  description: String
  price: Float!
  sku: String!
  isActive: Boolean!
  categoryId: ID!
  createdAt: DateTime!
  metadata: JSON
}

input CreateProductInput {
  title: String!
  description: String
  price: Float!
  categoryId: ID!
}

enum OrderStatus {
  PENDING
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
}`,
    user_auth: `# User Auth & Roles Schema
type User {
  id: ID!
  email: String!
  passwordHash: String!
  fullName: String!
  isVerified: Boolean!
  loginCount: Int
  lastLogin: DateTime
  createdAt: DateTime!
}

type Role {
  id: ID!
  roleName: String!
  permissions: JSON
}`,
    social_feed: `# Social Feed & Comments Schema
type Post {
  id: ID!
  title: String!
  slug: String!
  body: String!
  publishedAt: DateTime
  viewCount: Int
  isDraft: Boolean!
  createdAt: DateTime!
}

type Comment {
  id: ID!
  postId: ID!
  authorName: String!
  content: String!
  createdAt: DateTime!
}`
  };

  const transformCase = (str: string, style: FieldCasing): string => {
    if (style === 'original' || !str) return str;

    const words = str
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/[^a-zA-Z0-9]/g, ' ')
      .trim()
      .split(/\s+/);

    if (words.length === 0 || (words.length === 1 && !words[0])) return str;

    if (style === 'snake_case') {
      return words.map((w) => w.toLowerCase()).join('_');
    }

    if (style === 'camelCase') {
      return words
        .map((w, i) =>
          i === 0
            ? w.toLowerCase()
            : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
        )
        .join('');
    }

    if (style === 'PascalCase') {
      return words
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join('');
    }

    return str;
  };

  const sanitizeName = (key: string, style: FieldCasing): string => {
    let transformed = transformCase(key, style);
    let safeKey = transformed.replace(/[^a-zA-Z0-9_]/g, '_');
    if (/^[0-9]/.test(safeKey)) safeKey = '_' + safeKey;
    if (['__proto__', 'constructor', 'prototype'].includes(key) || !safeKey) {
      safeKey = '_' + (safeKey || 'field');
    }
    return safeKey;
  };

  const mapGqlTypeToElasticsearch = (
    gqlTypeStr: string,
    enumNames: Set<string>,
    customTypes: Set<string>
  ): Record<string, any> => {
    const raw = gqlTypeStr.trim();
    const isNonNull = raw.endsWith('!');
    const typeWithoutOuterBang = isNonNull ? raw.slice(0, -1).trim() : raw;
    const isList = typeWithoutOuterBang.startsWith('[') && typeWithoutOuterBang.endsWith(']');
    const baseType = isList ? typeWithoutOuterBang.slice(1, -1).replace(/!$/, '').trim() : typeWithoutOuterBang;

    if (baseType === 'ID') {
      return { type: 'keyword' };
    } else if (baseType === 'String') {
      return { type: 'text', fields: { keyword: { type: 'keyword', ignore_above: 256 } } };
    } else if (baseType === 'Int') {
      return { type: 'integer' };
    } else if (baseType === 'Float') {
      return { type: 'double' };
    } else if (baseType === 'Boolean') {
      return { type: 'boolean' };
    } else if (baseType === 'DateTime' || baseType === 'Date' || baseType === 'Timestamp') {
      return { type: 'date' };
    } else if (baseType === 'JSON' || baseType === 'JSONObject') {
      return { type: 'object', enabled: true };
    } else if (enumNames.has(baseType)) {
      return { type: 'keyword' };
    } else if (customTypes.has(baseType)) {
      return { type: isList ? 'nested' : 'object' };
    }

    return { type: 'keyword' };
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
        setOutput('');
        return;
      }

      const cleanInput = input
        .replace(/#.*$/gm, '')
        .replace(/"""[\s\S]*?"""/g, '')
        .replace(/"[\s\S]*?"/g, (m: string) => m.includes('\n') ? '""' : m);

      // Collect Enums
      const enumNames = new Set<string>();
      const enumRegex = /enum\s+([A-Za-z0-9_]+)\s*\{([^}]*)\}/g;
      let enumMatch: RegExpExecArray | null;
      while ((enumMatch = enumRegex.exec(cleanInput)) !== null) {
        enumNames.add(enumMatch[1]);
      }

      // Collect Types
      const customTypes = new Set<string>();
      const structRegex = /(type|interface|input)\s+([A-Za-z0-9_]+)(?:\s+implements\s+[^{]+)?\s*\{([^}]*)\}/g;
      let structMatch: RegExpExecArray | null;
      const allStructs: Array<{ kind: string; name: string; body: string }> = [];

      while ((structMatch = structRegex.exec(cleanInput)) !== null) {
        const kind = structMatch[1];
        const name = structMatch[2];
        const body = structMatch[3];
        customTypes.add(name);
        allStructs.push({ kind, name, body });
      }

      const indexMappings: Record<string, any> = Object.create(null);

      allStructs.forEach(({ name, body }) => {
        const indexName = sanitizeName(name, fieldCasing) + 's';
        const lines = body
          .split('\n')
          .map(l => l.trim())
          .filter(l => l && !l.startsWith('#'));

        const properties: Record<string, any> = Object.create(null);

        lines.forEach(line => {
          const cleanLine = line.replace(/\([^)]*\)/, '');
          const colonIdx = cleanLine.indexOf(':');
          if (colonIdx === -1) return;

          const rawFieldName = cleanLine.substring(0, colonIdx).trim();
          const rawTypeStr = cleanLine.substring(colonIdx + 1).trim();

          if (!rawFieldName || !rawTypeStr) return;

          const fieldName = sanitizeName(rawFieldName, fieldCasing);
          const esType = mapGqlTypeToElasticsearch(rawTypeStr, enumNames, customTypes);

          properties[fieldName] = esType;
        });

        if (Object.keys(properties).length > 0) {
          indexMappings[indexName] = {
            mappings: {
              properties,
            },
          };
        }
      });

      if (Object.keys(indexMappings).length === 0) {
        setError(t('graphqltoelasticsearch.no_types_found', 'No valid GraphQL types found.'));
        setOutput('');
        return;
      }

      if (outputMode === 'curl') {
        const cleanHost = esHost.replace(/\/+$/, '');
        const curlCommands = Object.keys(indexMappings).map(idxName => {
          const mappingObj = indexMappings[idxName];
          return `curl -X PUT "${cleanHost}/${idxName}" \\\n  -H 'Content-Type: application/json' \\\n  -d '${JSON.stringify(mappingObj, null, 2)}'`;
        });
        setOutput(curlCommands.join('\n\n'));
      } else {
        setOutput(JSON.stringify(indexMappings, null, 2));
      }

      setError('');
    } catch (e: any) {
      setError(t('graphqltoelasticsearch.error_parsing', 'Error parsing GraphQL schema') + ': ' + e.message);
      setOutput('');
    }
  }, [input, outputMode, fieldCasing, esHost, t]);

  useEffect(() => {
    handleConvert();
  }, [handleConvert]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success(t('graphqltoelasticsearch.toast_copied', 'Elasticsearch mapping copied to clipboard!'));
    setTimeout(() => setCopied(false), 2000);
  }, [output, t]);

  const handleClear = useCallback(() => {
    setInput('');
    setOutput('');
    setError('');
    setActivePresetId(null);
    toast.success(t('common.cleared', 'Cleared!'));
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [t]);

  const handleDownload = () => {
    if (!output) return;
    const ext = outputMode === 'curl' ? 'sh' : 'json';
    const blob = new Blob([output], { type: outputMode === 'curl' ? 'text/x-sh' : 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `elasticsearch-mappings.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(t('graphqltoelasticsearch.toast_downloaded', `Downloaded mappings.${ext}!`));
  };

  const loadPreset = (presetKey: keyof typeof PRESETS) => {
    setInput(PRESETS[presetKey]);
    setActivePresetId(presetKey);
    toast.success(t('graphqltoelasticsearch.preset_loaded', 'Loaded GraphQL preset!'));
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
        activeElement?.getAttribute('contenteditable') === 'true';

      const isBodyOrContainer =
        !activeElement ||
        activeElement === document.body ||
        containerRef.current?.contains(activeElement as Node);

      if (e.key === 'Escape' && isBodyOrContainer) {
        e.preventDefault();
        handlersRef.current.handleClear();
      } else if (e.key.toLowerCase() === 'c' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        if (!isEditable && isBodyOrContainer && handlersRef.current.output) {
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
          <Sparkles className="w-4 h-4 text-indigo-500" aria-hidden="true" />
          <span className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('graphqltoelasticsearch.presets_title', 'Quick Start Presets:')}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(['ecommerce', 'user_auth', 'social_feed'] as const).map((pKey) => {
            const isActive = activePresetId === pKey;
            return (
              <button
                key={pKey}
                type="button"
                onClick={() => loadPreset(pKey)}
                aria-pressed={isActive}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all shadow-sm border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                  isActive
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-indigo-600/20'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-500'
                }`}
              >
                {t(`graphqltoelasticsearch.preset_${pKey}`, pKey === 'ecommerce' ? 'E-Commerce Catalog' : pKey === 'user_auth' ? 'User Management & Auth' : 'Social Feed & Comments')}
              </button>
            );
          })}
        </div>
      </div>

      {/* Options Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="space-y-1.5">
          <label htmlFor="es-output-mode" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('graphqltoelasticsearch.output_mode', 'Output Format')}
          </label>
          <select
            id="es-output-mode"
            value={outputMode}
            onChange={(e) => setOutputMode(e.target.value as 'mapping' | 'curl')}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="mapping">Index Mapping JSON</option>
            <option value="curl">cURL PUT Index Command</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="es-field-casing" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('graphqltoelasticsearch.field_casing', 'Field Casing')}
          </label>
          <select
            id="es-field-casing"
            value={fieldCasing}
            onChange={(e) => setFieldCasing(e.target.value as FieldCasing)}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="snake_case">snake_case (Elasticsearch Standard)</option>
            <option value="camelCase">camelCase</option>
            <option value="PascalCase">PascalCase</option>
            <option value="original">Original Field Name</option>
          </select>
        </div>

        {outputMode === 'curl' && (
          <div className="space-y-1.5 animate-in fade-in duration-200">
            <label htmlFor="es-host-url" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              {t('graphqltoelasticsearch.es_host', 'Elasticsearch Host URL')}
            </label>
            <input
              id="es-host-url"
              type="text"
              value={esHost}
              onChange={(e) => setEsHost(e.target.value)}
              placeholder="http://localhost:9200"
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        )}
      </div>

      {/* Editor Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-500" aria-hidden="true" />
              <label htmlFor="graphql-elasticsearch-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('graphqltoelasticsearch.graphql_input_label', 'GraphQL SDL Schema')}
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Kbd modifier={null} className="hidden sm:inline-flex border-rose-200 dark:border-rose-800 text-rose-400 dark:bg-slate-900">Esc</Kbd>
              <button
                type="button"
                onClick={handleClear}
                disabled={!input && !output}
                className="text-xs font-bold px-3 py-1.5 rounded-xl text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all flex items-center gap-1 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
              >
                <Trash2 className="w-3 h-3" aria-hidden="true" /> {t('common.clear')}
              </button>
            </div>
          </div>
          <textarea
            id="graphql-elasticsearch-input"
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              if (activePresetId) setActivePresetId(null);
            }}
            placeholder={t('graphqltoelasticsearch.placeholder_graphql', 'Paste GraphQL SDL schema statements here...')}
            className="w-full h-[450px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-500" aria-hidden="true" />
              <label htmlFor="elasticsearch-output" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('graphqltoelasticsearch.output_label', 'Generated Elasticsearch Mappings')}
              </label>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleDownload}
                disabled={!output}
                className="text-xs font-bold px-3 py-1.5 rounded-xl text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 transition-all flex items-center gap-1 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
              >
                <Download className="w-3 h-3" aria-hidden="true" /> {t('common.download')}
              </button>
              <button
                type="button"
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
            id="elasticsearch-output"
            value={output}
            readOnly
            placeholder={t('graphqltoelasticsearch.placeholder_output', 'Generated Elasticsearch Index Mappings will appear here...')}
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
          <h4 className="font-bold dark:text-white">{t('graphqltoelasticsearch.about_title', 'About GraphQL SDL to Elasticsearch Mapping Generator')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('graphqltoelasticsearch.about_text', 'Convert GraphQL Schema Definition Language (SDL) types into Elasticsearch 8.x/7.x Index Mapping specifications or cURL PUT requests. Automatically maps scalar types (keyword, text with keyword subfields, integer, double, boolean, date, object, nested), property casing options, and prototype pollution protections.')}
          </p>
        </div>
      </div>
    </div>
  );
}
