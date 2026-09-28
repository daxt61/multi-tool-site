import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Copy, Check, Trash2, Download, Braces, ShieldCheck, Info, ArrowRight, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;
const MAX_DEPTH = 20;

// Sanitize key names to prevent prototype pollution collisions
const sanitizeKey = (key: string): string => {
  const lower = key.toLowerCase();
  if (lower === '__proto__' || lower === 'constructor' || lower === 'prototype') {
    return `_${key}`;
  }
  return key;
};

interface Preset {
  nameKey: string;
  data: object;
}

const PRESETS: Preset[] = [
  {
    nameKey: 'jsontovalibot.preset_user',
    data: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      username: 'john_doe',
      email: 'john@example.com',
      age: 30,
      isActive: true,
      roles: ['admin', 'developer'],
      profile: {
        bio: 'Software Engineer',
        website: 'https://example.com'
      }
    }
  },
  {
    nameKey: 'jsontovalibot.preset_order',
    data: {
      orderId: 'ORD-2025-991',
      totalAmount: 199.99,
      isPaid: true,
      items: [
        { productId: 'P-100', name: 'Mechanical Keyboard', price: 149.99, quantity: 1 },
        { productId: 'P-101', name: 'Desk Pad', price: 50.0, quantity: 1 }
      ],
      createdAt: '2025-01-20T10:30:00Z'
    }
  },
  {
    nameKey: 'jsontovalibot.preset_config',
    data: {
      appName: 'MultiToolSuite',
      version: '1.0.0',
      debug: false,
      maxConnections: 100,
      features: {
        analytics: true,
        authProvider: 'oauth2'
      }
    }
  }
];

export function JSONToValibot({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [json, setJson] = useState(
    initialData?.json ||
      JSON.stringify(
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'John Doe',
          email: 'john@example.com',
          website: 'https://example.com',
          isActive: true,
          tags: ['admin', 'user'],
          profile: {
            bio: 'Software Engineer',
            age: 30
          }
        },
        null,
        2
      )
  );
  const [copied, setCopied] = useState(false);

  // Configuration options
  const [outputStyle, setOutputStyle] = useState<'full' | 'schema_only'>(initialData?.outputStyle || 'full');
  const [schemaName, setSchemaName] = useState<string>(initialData?.schemaName || 'MySchema');
  const [detectFormats, setDetectFormats] = useState<boolean>(initialData?.detectFormats ?? true);

  useEffect(() => {
    onStateChange?.({ json, outputStyle, schemaName, detectFormats });
  }, [json, outputStyle, schemaName, detectFormats, onStateChange]);

  const { valibotSchema, error } = useMemo(() => {
    if (!json.trim()) return { valibotSchema: '', error: null };
    if (json.length > MAX_LENGTH) {
      return { valibotSchema: '', error: t('error.max_length', { max: MAX_LENGTH.toLocaleString() }) };
    }

    try {
      const parsed = JSON.parse(json);
      const cleanSchemaVar = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(schemaName) ? schemaName : 'MySchema';
      const typeName = cleanSchemaVar.charAt(0).toUpperCase() + cleanSchemaVar.slice(1) + 'Type';

      let output = '';
      if (outputStyle === 'full') {
        output += `import * as v from 'valibot';\n\nexport const ${cleanSchemaVar} = `;
      }

      const generateValibot = (obj: any, indent: string = '', depth: number = 0): string => {
        if (depth > MAX_DEPTH) return 'v.any()';

        if (Array.isArray(obj)) {
          if (obj.length === 0) return 'v.array(v.any())';

          // Sample up to 5 elements to detect mixed types
          const samples = obj.slice(0, 5);
          const sampleSchemas = samples.map(s => generateValibot(s, indent, depth + 1));
          const uniqueSchemas = Array.from(new Set(sampleSchemas));

          if (uniqueSchemas.length > 1) {
            return `v.array(v.union([${uniqueSchemas.join(', ')}]))`;
          }

          return `v.array(${generateValibot(obj[0], indent, depth + 1)})`;
        } else if (typeof obj === 'object' && obj !== null) {
          let res = 'v.object({\n';
          const entries = Object.entries(obj);
          if (entries.length === 0) return 'v.object({})';

          entries.forEach(([key, value], index) => {
            const cleanKey = sanitizeKey(key);
            const safeKey = /^[a-z_$][a-z0-9_$]*$/i.test(cleanKey) ? cleanKey : JSON.stringify(cleanKey);
            res += `${indent}  ${safeKey}: ${generateValibot(value, indent + '  ', depth + 1)}${index === entries.length - 1 ? '' : ','}\n`;
          });
          res += `${indent}})`;
          return res;
        } else if (typeof obj === 'string') {
          if (detectFormats) {
            const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            const urlRegex = /^https?:\/\/[^\s$.?#].[^\s]*$/;
            const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
            const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:?\d{2})?$/;

            if (emailRegex.test(obj)) {
              return 'v.pipe(v.string(), v.email())';
            }
            if (urlRegex.test(obj)) {
              return 'v.pipe(v.string(), v.url())';
            }
            if (uuidRegex.test(obj)) {
              return 'v.pipe(v.string(), v.uuid())';
            }
            if (isoDateRegex.test(obj)) {
              return 'v.pipe(v.string(), v.isoDateTime())';
            }
          }
          return 'v.string()';
        } else if (typeof obj === 'number') {
          if (Number.isInteger(obj)) {
            return 'v.pipe(v.number(), v.integer())';
          }
          return 'v.number()';
        } else if (typeof obj === 'boolean') {
          return 'v.boolean()';
        } else if (obj === null) {
          return 'v.nullable(v.unknown())';
        }
        return 'v.any()';
      };

      const schemaBody = generateValibot(parsed);
      output += schemaBody;

      if (outputStyle === 'full') {
        output += `;\n\nexport type ${typeName} = v.InferOutput<typeof ${cleanSchemaVar}>;`;
      }

      return { valibotSchema: output, error: null };
    } catch (e: any) {
      return { valibotSchema: '', error: t('error.invalid_json') + ': ' + e.message };
    }
  }, [json, outputStyle, schemaName, detectFormats, t]);

  const handleCopy = useCallback(() => {
    if (!valibotSchema) return;
    navigator.clipboard.writeText(valibotSchema);
    setCopied(true);
    toast.success(t('jsontovalibot.toast_copied', 'Valibot schema copied to clipboard!'));
    setTimeout(() => setCopied(false), 2000);
  }, [valibotSchema, t]);

  const handleDownload = useCallback(() => {
    if (!valibotSchema) return;
    const blob = new Blob([valibotSchema], { type: 'text/typescript' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${schemaName || 'schema'}.ts`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(t('common.downloaded', 'Downloaded schema file!'));
  }, [valibotSchema, schemaName, t]);

  const handleClear = useCallback(() => {
    setJson('');
    toast.success(t('jsontovalibot.toast_cleared', 'Input cleared!'));
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [t]);

  const loadPreset = (preset: Preset) => {
    setJson(JSON.stringify(preset.data, null, 2));
    toast.success(t('jsontovalibot.preset_loaded', 'Loaded preset!'));
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handlersRef = useRef({ handleCopy, handleClear });
  useEffect(() => {
    handlersRef.current = { handleCopy, handleClear };
  }, [handleCopy, handleClear]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isEditable =
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.tagName === 'SELECT' ||
        document.activeElement?.getAttribute('contenteditable') === 'true';

      if (isEditable && e.key !== 'Escape') return;

      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        handlersRef.current.handleClear();
      } else if (e.key.toLowerCase() === 'c') {
        if (valibotSchema) {
          e.preventDefault();
          handlersRef.current.handleCopy();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [valibotSchema]);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Presets Bar */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center gap-2 px-1">
          <Sparkles className="w-4 h-4 text-amber-500" aria-hidden="true" />
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{t('jsontovalibot.presets_title', 'Quick Start Presets')}</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => loadPreset(preset)}
              className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none"
            >
              {t(preset.nameKey, preset.nameKey)}
            </button>
          ))}
        </div>
      </div>

      {/* Options Bar */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-4">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">{t('common.options', 'Configuration')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-1">
          <div>
            <label htmlFor="valibot-output-style" className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
              {t('jsontovalibot.output_style', 'Output Style')}
            </label>
            <select
              id="valibot-output-style"
              value={outputStyle}
              onChange={(e) => setOutputStyle(e.target.value as any)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="full">{t('jsontovalibot.style_full', 'Full File (Imports + Types)')}</option>
              <option value="schema_only">{t('jsontovalibot.style_schemas', 'Schema Expression Only')}</option>
            </select>
          </div>

          <div>
            <label htmlFor="valibot-schema-name" className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
              {t('jsontovalibot.schema_name', 'Schema Variable Name')}
            </label>
            <input
              id="valibot-schema-name"
              type="text"
              value={schemaName}
              onChange={(e) => setSchemaName(e.target.value)}
              placeholder="MySchema"
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 pt-5">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={detectFormats}
                onChange={(e) => setDetectFormats(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              {t('jsontovalibot.detect_formats', 'Auto-detect String Formats (Email, URL, UUID)')}
            </label>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Input */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="json-valibot-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Braces className="w-4 h-4 text-indigo-500" aria-hidden="true" /> {t('common.input')} JSON
            </label>
            <div className="flex items-center gap-2">
              <Kbd modifier={null} className="hidden sm:inline-flex border-rose-200 dark:border-rose-800 text-rose-400 dark:bg-slate-900">Esc</Kbd>
              <button
                onClick={handleClear}
                disabled={!json}
                className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" /> {t('common.clear')}
              </button>
            </div>
          </div>
          <div className="relative group">
            <textarea
              id="json-valibot-input"
              ref={inputRef}
              value={json}
              onChange={(e) => setJson(e.target.value)}
              placeholder='{"key": "value"}'
              className={`w-full h-[500px] p-6 bg-slate-50 dark:bg-slate-900 border ${error ? 'border-rose-500 focus:ring-rose-500/20' : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-500/20'} rounded-3xl outline-none focus:ring-2 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none`}
            />
            {error && (
              <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-rose-500 text-white text-xs font-bold rounded-xl animate-in fade-in zoom-in">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Right: Output */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="valibot-output" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" aria-hidden="true" /> {t('jsontovalibot.output_label', 'Generated Valibot Schema')}
            </label>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                disabled={!valibotSchema}
                className="text-xs font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" aria-hidden="true" /> {t('common.download')}
              </button>
              <button
                onClick={handleCopy}
                disabled={!valibotSchema}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 border ${
                  copied
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                    : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700'
                } disabled:opacity-50`}
              >
                {copied ? <Check className="w-3.5 h-3.5" aria-hidden="true" /> : <Copy className="w-3.5 h-3.5" aria-hidden="true" />}
                {copied ? t('common.copied') : t('common.copy')}
                {!copied && valibotSchema && <Kbd modifier={null} className="hidden sm:inline-flex w-4 h-4 bg-white/50 dark:bg-black/20 ml-1">C</Kbd>}
              </button>
            </div>
          </div>
          <div className="relative group">
            <textarea
              id="valibot-output"
              value={valibotSchema}
              readOnly
              placeholder={t('common.waiting', 'Waiting for valid JSON input...')}
              className="w-full h-[500px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-mono text-sm leading-relaxed text-indigo-600 dark:text-indigo-400 resize-none"
            />
          </div>
        </div>
      </div>

      {/* Info Sections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2 text-indigo-500">
            <Info className="w-4 h-4" aria-hidden="true" /> {t('valibot.what_is_title', 'What is Valibot?')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('valibot.what_is_text', 'Valibot is a modular and type-safe schema validation library for TypeScript. It is designed to be extremely lightweight by using a functional approach that allows for excellent tree-shaking.')}
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2 text-indigo-500">
            <ArrowRight className="w-4 h-4" aria-hidden="true" /> {t('valibot.how_it_works_title', 'How it works?')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('valibot.how_it_works_text', 'The tool parses your JSON and generates the corresponding TypeScript code using Valibot functions (v.string(), v.number(), v.object(), etc.). It also provides the inferred type automatically.')}
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2 text-indigo-500">
            <ShieldCheck className="w-4 h-4" aria-hidden="true" /> {t('valibot.advantages_title', 'Advantages')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('valibot.advantages_text', 'By using Valibot, you get a minimal bundle size impact compared to other libraries like Zod, while maintaining full type safety and a rich ecosystem of validation rules.')}
          </p>
        </div>
      </div>
    </div>
  );
}
