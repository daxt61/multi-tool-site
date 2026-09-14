import { useState, useEffect, useCallback, useRef } from 'react';
import { Database, Copy, Check, Trash2, FileCode, AlertCircle, Info, Download, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;
const MAX_DEPTH = 20;

const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

function transformCase(str: string, casing: string): string {
  if (!str || casing === 'original') return str;
  if (DANGEROUS_KEYS.has(str)) return str;

  const words = str
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[^a-zA-Z0-9]/g, ' ')
    .trim()
    .split(/\s+/);

  if (words.length === 0 || !words[0]) return str;

  switch (casing) {
    case 'camelCase':
      return words[0].toLowerCase() + words.slice(1).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
    case 'snake_case':
      return words.map(w => w.toLowerCase()).join('_');
    case 'pascalCase':
      return words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
    case 'kebabCase':
      return words.map(w => w.toLowerCase()).join('-');
    default:
      return str;
  }
}

const PRESETS = [
  {
    id: 'user_profile',
    labelKey: 'jsontotypebox.preset_user',
    defaultLabel: 'User Profile',
    schemaName: 'UserSchema',
    includeStaticType: true,
    useOptional: true,
    useReadonly: false,
    useExport: true,
    casing: 'camelCase',
    json: JSON.stringify({
      id: "usr_98213",
      username: "alex_dev",
      email: "alex@example.com",
      age: 29,
      isVerified: true,
      roles: ["admin", "developer"],
      profile: {
        bio: "Full-stack engineer",
        avatarUrl: "https://example.com/avatar.png",
        website: null
      }
    }, null, 2)
  },
  {
    id: 'ecommerce_product',
    labelKey: 'jsontotypebox.preset_product',
    defaultLabel: 'Product Catalog',
    schemaName: 'ProductSchema',
    includeStaticType: true,
    useOptional: true,
    useReadonly: true,
    useExport: true,
    casing: 'original',
    json: JSON.stringify({
      id: 1042,
      sku: "PROD-LPT-001",
      title: "UltraSlim Laptop 15",
      price: 1299.99,
      in_stock: true,
      tags: ["electronics", "computers", "portable"],
      dimensions: {
        width_cm: 35.5,
        height_cm: 24.2,
        weight_kg: 1.45
      }
    }, null, 2)
  },
  {
    id: 'api_response',
    labelKey: 'jsontotypebox.preset_api',
    defaultLabel: 'API Response Payload',
    schemaName: 'ApiResponseSchema',
    includeStaticType: true,
    useOptional: false,
    useReadonly: false,
    useExport: true,
    casing: 'original',
    json: JSON.stringify({
      status: 200,
      message: "Success",
      data: [
        { id: 1, name: "Alpha", active: true },
        { id: 2, name: "Beta", active: false }
      ],
      page_info: {
        current_page: 1,
        total_pages: 5,
        has_next: true
      }
    }, null, 2)
  }
];

export function JSONToTypeBox({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [json, setJson] = useState(initialData?.json || PRESETS[0].json);
  const [schemaName, setSchemaName] = useState(initialData?.schemaName || PRESETS[0].schemaName);
  const [includeStaticType, setIncludeStaticType] = useState(initialData?.includeStaticType ?? PRESETS[0].includeStaticType);
  const [useOptional, setUseOptional] = useState(initialData?.useOptional ?? PRESETS[0].useOptional);
  const [useReadonly, setUseReadonly] = useState(initialData?.useReadonly ?? PRESETS[0].useReadonly);
  const [useExport, setUseExport] = useState(initialData?.useExport ?? PRESETS[0].useExport);
  const [casing, setCasing] = useState(initialData?.casing || PRESETS[0].casing);
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ json, schemaName, includeStaticType, useOptional, useReadonly, useExport, casing });
  }, [json, schemaName, includeStaticType, useOptional, useReadonly, useExport, casing, onStateChange]);

  const inferTypeBox = useCallback((val: any, depth: number, indentLevel: number): string => {
    if (depth > MAX_DEPTH) return 'Type.Unknown()';

    const indent = '  '.repeat(indentLevel);
    const innerIndent = '  '.repeat(indentLevel + 1);

    if (val === null) {
      return useOptional ? 'Type.Optional(Type.Null())' : 'Type.Null()';
    }

    if (Array.isArray(val)) {
      if (val.length === 0) {
        return 'Type.Array(Type.Unknown())';
      }
      const itemType = inferTypeBox(val[0], depth + 1, indentLevel);
      return `Type.Array(${itemType})`;
    }

    if (typeof val === 'object' && val !== null) {
      const keys = Object.keys(val).filter(k => !DANGEROUS_KEYS.has(k));
      if (keys.length === 0) {
        return 'Type.Object({})';
      }

      const safeObj = Object.assign(Object.create(null), val);
      const props: string[] = [];

      for (const key of keys) {
        const value = safeObj[key];
        const transformedKey = transformCase(key, casing);
        const isValidIdentifier = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(transformedKey);
        const formattedKey = isValidIdentifier ? transformedKey : JSON.stringify(transformedKey);

        let itemType = inferTypeBox(value, depth + 1, indentLevel + 1);

        if (value === null && useOptional) {
          // already wrapped in Optional
        } else if (value === undefined && useOptional) {
          itemType = `Type.Optional(${itemType})`;
        }

        if (useReadonly) {
          itemType = `Type.Readonly(${itemType})`;
        }

        props.push(`${innerIndent}${formattedKey}: ${itemType}`);
      }

      return `Type.Object({\n${props.join(',\n')}\n${indent}})`;
    }

    if (typeof val === 'number') {
      return 'Type.Number()';
    }

    if (typeof val === 'boolean') {
      return 'Type.Boolean()';
    }

    if (typeof val === 'string') {
      return 'Type.String()';
    }

    return 'Type.Unknown()';
  }, [useOptional, useReadonly, casing]);

  const generateTypeBox = useCallback(() => {
    if (!json.trim()) {
      setOutput('');
      setError(null);
      return;
    }

    if (json.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
      setOutput('');
      return;
    }

    try {
      const parsed = JSON.parse(json);
      const safeName = (schemaName || 'Schema').trim().replace(/[^a-zA-Z0-9_$]/g, '') || 'Schema';
      const cleanName = safeName.charAt(0).toUpperCase() + safeName.slice(1);

      const generatedSchema = inferTypeBox(parsed, 1, 0);

      const exportPrefix = useExport ? 'export ' : '';
      let code = `import { Type, Static } from '@sinclair/typebox';\n\n`;
      code += `${exportPrefix}const ${cleanName} = ${generatedSchema};\n`;

      if (includeStaticType) {
        const typeName = cleanName.endsWith('Schema') ? cleanName.replace(/Schema$/, 'Type') : `${cleanName}Type`;
        code += `\n${exportPrefix}type ${typeName} = Static<typeof ${cleanName}>;\n`;
      }

      setOutput(code);
      setError(null);
    } catch (e: any) {
      setError(t('error.invalid_json') + ': ' + e.message);
      setOutput('');
    }
  }, [json, schemaName, includeStaticType, useExport, inferTypeBox, t]);

  useEffect(() => {
    const timeout = setTimeout(generateTypeBox, 200);
    return () => clearTimeout(timeout);
  }, [generateTypeBox]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success(t('common.copied', { defaultValue: 'Copied to clipboard!' }));
    setTimeout(() => setCopied(false), 2000);
  }, [output, t]);

  const handleClear = useCallback(() => {
    setJson('');
    setOutput('');
    setError(null);
    toast.success(t('common.cleared', { defaultValue: 'Cleared input' }));
    textareaRef.current?.focus();
  }, [t]);

  const loadPreset = (preset: typeof PRESETS[0]) => {
    setJson(preset.json);
    setSchemaName(preset.schemaName);
    setIncludeStaticType(preset.includeStaticType);
    setUseOptional(preset.useOptional);
    setUseReadonly(preset.useReadonly);
    setUseExport(preset.useExport);
    setCasing(preset.casing);
    const label = t(preset.labelKey, { defaultValue: preset.defaultLabel });
    toast.success(t('common.preset_loaded', { name: label, defaultValue: `Loaded preset: ${label}` }));
    textareaRef.current?.focus();
  };

  const handlersRef = useRef({ handleCopy, handleClear });
  useEffect(() => {
    handlersRef.current = { handleCopy, handleClear };
  }, [handleCopy, handleClear]);

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

      if (e.key === 'Escape') {
        e.preventDefault();
        handlersRef.current.handleClear();
      } else if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handlersRef.current.handleCopy();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${schemaName || 'Schema'}.ts`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(t('common.downloaded', { defaultValue: 'File downloaded' }));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Quick Start Presets */}
      <div className="bg-white dark:bg-slate-900/40 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-indigo-500">
          <Sparkles className="w-4 h-4" />
          <span>{t('common.presets', { defaultValue: 'Quick Start Presets' })}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => loadPreset(preset)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800"
            >
              {t(preset.labelKey, { defaultValue: preset.defaultLabel })}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Input Section */}
        <div className="space-y-6">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="typebox-json-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <FileCode className="w-4 h-4 text-indigo-500" /> {t('common.input', { defaultValue: 'Input' })} JSON
            </label>
            <div className="flex gap-2 items-center">
              <Kbd modifier={null} className="hidden sm:inline-flex border-rose-200 dark:border-rose-800 text-rose-400 dark:bg-slate-900">Esc</Kbd>
              <button
                onClick={handleClear}
                className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all"
              >
                <Trash2 className="w-3 h-3" /> {t('common.clear', { defaultValue: 'Clear' })}
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900/40 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="typebox-schema-name" className="text-xs font-bold text-slate-500 px-1">
                  {t('jsontotypebox.schema_name', { defaultValue: 'Schema Name' })}
                </label>
                <input
                  id="typebox-schema-name"
                  type="text"
                  value={schemaName}
                  onChange={(e) => setSchemaName(e.target.value)}
                  placeholder="UserSchema"
                  className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-slate-300"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="typebox-casing" className="text-xs font-bold text-slate-500 px-1">
                  {t('jsontotypebox.key_casing', { defaultValue: 'Key Casing' })}
                </label>
                <select
                  id="typebox-casing"
                  value={casing}
                  onChange={(e) => setCasing(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-slate-300"
                >
                  <option value="original">{t('casing.original', { defaultValue: 'Original' })}</option>
                  <option value="camelCase">camelCase</option>
                  <option value="snake_case">snake_case</option>
                  <option value="pascalCase">PascalCase</option>
                  <option value="kebabCase">kebab-case</option>
                </select>
              </div>

              <div className="flex flex-col gap-2 sm:col-span-2 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-600 dark:text-slate-400">
                  <input
                    type="checkbox"
                    checked={includeStaticType}
                    onChange={(e) => setIncludeStaticType(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>{t('jsontotypebox.static_type', { defaultValue: 'Include Static<typeof Schema> Export' })}</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-600 dark:text-slate-400">
                  <input
                    type="checkbox"
                    checked={useOptional}
                    onChange={(e) => setUseOptional(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>{t('jsontotypebox.use_optional', { defaultValue: 'Infer Optional Fields on Null/Undefined' })}</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-600 dark:text-slate-400">
                  <input
                    type="checkbox"
                    checked={useReadonly}
                    onChange={(e) => setUseReadonly(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>{t('jsontotypebox.use_readonly', { defaultValue: 'Wrap Properties in Type.Readonly()' })}</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-600 dark:text-slate-400">
                  <input
                    type="checkbox"
                    checked={useExport}
                    onChange={(e) => setUseExport(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>{t('jsontotypebox.use_export', { defaultValue: 'Include "export" keyword' })}</span>
                </label>
              </div>
            </div>
          </div>

          <textarea
            id="typebox-json-input"
            ref={textareaRef}
            value={json}
            onChange={(e) => setJson(e.target.value)}
            placeholder='{"id": 1, "name": "John"}'
            className="w-full h-[380px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        {/* Output Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="typebox-output" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-500" /> {t('jsontotypebox.output_label', { defaultValue: 'TypeBox Schema Output' })}
            </label>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                disabled={!output}
                className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" /> {t('common.download', { defaultValue: 'Download' })}
              </button>
              <button
                onClick={handleCopy}
                disabled={!output}
                title={`${t('common.copy', { defaultValue: 'Copy' })} (C)`}
                className={`text-xs font-bold px-4 py-1.5 rounded-xl transition-all border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none flex items-center gap-2 ${
                  copied
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200'
                    : 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-slate-200 dark:border-slate-700 hover:border-indigo-500/50'
                } disabled:opacity-50`}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? t('common.copied', { defaultValue: 'Copied' }) : t('common.copy', { defaultValue: 'Copy' })}
                {!copied && <Kbd modifier={null} className="hidden sm:inline-flex w-4 h-4 bg-white/50 dark:bg-black/20 ml-1">C</Kbd>}
              </button>
            </div>
          </div>
          <textarea
            id="typebox-output"
            readOnly
            value={output}
            placeholder="TypeBox schema will appear here..."
            className="w-full h-[610px] p-6 bg-slate-900 border border-slate-800 rounded-3xl outline-none font-mono text-sm leading-relaxed text-indigo-300 resize-none"
          />
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <Info className="w-6 h-6 text-indigo-500 mt-1" />
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('jsontotypebox.about_title', { defaultValue: 'About TypeBox Schema Generator' })}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('jsontotypebox.about_text', { defaultValue: 'TypeBox is an in-memory JSON Schema builder that creates fast, type-safe runtime validations with TypeScript Static type inference. This tool infers TypeBox object schemas directly from sample JSON payloads.' })}
          </p>
        </div>
      </div>
    </div>
  );
}
