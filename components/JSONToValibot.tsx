import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Copy, Check, Trash2, Download, Braces, ShieldCheck, Info, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_LENGTH = 100000;
const MAX_DEPTH = 20;

export function JSONToValibot({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [json, setJson] = useState(initialData?.json || '{\n  "id": 1,\n  "name": "John Doe",\n  "email": "john@example.com",\n  "isActive": true,\n  "tags": ["admin", "user"],\n  "profile": {\n    "bio": "Software Engineer",\n    "age": 30\n  }\n}');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ json });
  }, [json, onStateChange]);

  const { valibotSchema, error } = useMemo(() => {
    if (!json.trim()) return { valibotSchema: '', error: null };
    if (json.length > MAX_LENGTH) {
      return { valibotSchema: '', error: t('error.max_length', { max: MAX_LENGTH.toLocaleString() }) };
    }

    try {
      const parsed = JSON.parse(json);

      let output = "import * as v from 'valibot';\n\nexport const MySchema = ";

      const generateValibot = (obj: any, indent: string = '', depth: number = 0): string => {
        if (depth > MAX_DEPTH) return 'v.any()';

        if (Array.isArray(obj)) {
          if (obj.length === 0) return 'v.array(v.any())';

          // Sample up to 5 elements to detect mixed types or optional fields
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
          entries.forEach(([key, value], index) => {
            const safeKey = /^[a-z_$][a-z0-9_$]*$/i.test(key) ? key : JSON.stringify(key);
            res += `${indent}  ${safeKey}: ${generateValibot(value, indent + '  ', depth + 1)}${index === entries.length - 1 ? '' : ','}\n`;
          });
          res += `${indent}})`;
          return res;
        } else if (typeof obj === 'string') {
          return 'v.string()';
        } else if (typeof obj === 'number') {
          return 'v.number()';
        } else if (typeof obj === 'boolean') {
          return 'v.boolean()';
        } else if (obj === null) {
          return 'v.null_()';
        }
        return 'v.any()';
      };

      output += generateValibot(parsed);
      output += ';\n\nexport type MyType = v.InferOutput<typeof MySchema>;';
      return { valibotSchema: output, error: null };
    } catch (e) {
      return { valibotSchema: '', error: t('error.invalid_json') };
    }
  }, [json, t]);

  const handleCopy = useCallback(() => {
    if (!valibotSchema) return;
    navigator.clipboard.writeText(valibotSchema);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [valibotSchema]);

  const handleDownload = useCallback(() => {
    if (!valibotSchema) return;
    const blob = new Blob([valibotSchema], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `schema.ts`;
    link.click();
    URL.revokeObjectURL(url);
  }, [valibotSchema]);

  const handleClear = useCallback(() => {
    setJson('');
    textareaRef.current?.focus();
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Input */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="json-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Braces className="w-3 h-3" /> {t('common.input')} JSON
            </label>
            <div className="flex gap-2">
               <button
                onClick={handleClear}
                className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all"
              >
                <Trash2 className="w-3 h-3" /> {t('common.clear')}
              </button>
            </div>
          </div>
          <div className="relative group">
            <textarea
              id="json-input"
              ref={textareaRef}
              value={json}
              onChange={(e) => setJson(e.target.value)}
              placeholder='{"key": "value"}'
              className={`w-full h-[500px] p-6 bg-slate-50 dark:bg-slate-900 border ${error ? 'border-rose-500 focus:ring-rose-500/20' : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-500/20'} rounded-3xl outline-none focus:ring-2 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none`}
            />
            {error && (
              <div className="absolute bottom-4 right-4 px-3 py-1 bg-rose-500 text-white text-xs font-bold rounded-lg animate-in fade-in zoom-in">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Right: Output */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <ShieldCheck className="w-3 h-3" /> Valibot Schema
            </label>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                disabled={!valibotSchema}
                className="text-xs font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50"
              >
                <Download className="w-3 h-3" /> {t('common.download')}
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
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? t('common.copied') : t('common.copy')}
              </button>
            </div>
          </div>
          <div className="relative group">
            <pre className="w-full h-[500px] p-6 bg-slate-900 text-slate-100 rounded-3xl overflow-auto font-mono text-sm leading-relaxed border border-slate-800 scrollbar-thin scrollbar-thumb-slate-700">
              {valibotSchema || t('common.waiting')}
            </pre>
          </div>
        </div>
      </div>

      {/* Info Sections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2 text-indigo-500">
            <Info className="w-4 h-4" /> {t('valibot.what_is_title', 'What is Valibot?')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('valibot.what_is_text', 'Valibot is a modular and type-safe schema validation library for TypeScript. It is designed to be extremely lightweight by using a functional approach that allows for excellent tree-shaking.')}
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2 text-indigo-500">
            <ArrowRight className="w-4 h-4" /> {t('valibot.how_it_works_title', 'How it works?')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('valibot.how_it_works_text', 'The tool parses your JSON and generates the corresponding TypeScript code using Valibot functions (v.string(), v.number(), v.object(), etc.). It also provides the inferred type automatically.')}
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2 text-indigo-500">
            <ShieldCheck className="w-4 h-4" /> {t('valibot.advantages_title', 'Advantages')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('valibot.advantages_text', 'By using Valibot, you get a minimal bundle size impact compared to other libraries like Zod, while maintaining full type safety and a rich ecosystem of validation rules.')}
          </p>
        </div>
      </div>
    </div>
  );
}
