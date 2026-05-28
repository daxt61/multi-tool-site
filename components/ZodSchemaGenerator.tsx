import { useState, useMemo, useEffect } from 'react';
import { Copy, Check, Trash2, Braces, FileCode, Info, AlertCircle, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_LENGTH = 100000;
const MAX_DEPTH = 20;

export function ZodSchemaGenerator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [jsonInput, setJsonInput] = useState(initialData?.jsonInput || '');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onStateChange?.({ jsonInput });
  }, [jsonInput, onStateChange]);

  const generateZodSchema = (obj: any, indent: string = '', depth: number = 0): string => {
    if (depth > MAX_DEPTH) {
      return 'z.any()';
    }

    if (obj === null) {
      return 'z.any().nullable()';
    }

    const type = typeof obj;

    if (Array.isArray(obj)) {
      if (obj.length === 0) return 'z.array(z.any())';
      const itemSchema = generateZodSchema(obj[0], indent, depth + 1);
      return `z.array(${itemSchema})`;
    }

    if (type === 'object') {
      let result = 'z.object({\n';
      const nextIndent = indent + '  ';
      const entries = Object.entries(obj);

      if (entries.length === 0) return 'z.object({})';

      entries.forEach(([key, value]) => {
        const valueSchema = generateZodSchema(value, nextIndent, depth + 1);
        const safeKey = /^[a-z_$][a-z0-9_$]*$/i.test(key) ? key : JSON.stringify(key);
        result += `${nextIndent}${safeKey}: ${valueSchema},\n`;
      });
      result += `${indent}})`;
      return result;
    }

    if (type === 'string') return 'z.string()';
    if (type === 'number') return 'z.number()';
    if (type === 'boolean') return 'z.boolean()';

    return 'z.any()';
  };

  const zodResult = useMemo(() => {
    if (!jsonInput.trim()) {
      setError(null);
      return '';
    }

    try {
      const parsed = JSON.parse(jsonInput);
      setError(null);
      const schema = generateZodSchema(parsed);
      return `import { z } from "zod";\n\nexport const schema = ${schema};\n\nexport type SchemaType = z.infer<typeof schema>;`;
    } catch (e: any) {
      setError(e.message);
      return '';
    }
  }, [jsonInput]);

  const handleCopy = () => {
    if (!zodResult) return;
    navigator.clipboard.writeText(zodResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setJsonInput('');
    setError(null);
  };

  const handleDownload = () => {
    if (!zodResult) return;
    const blob = new Blob([zodResult], { type: 'text/typescript' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'schema.ts';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="json-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Braces className="w-4 h-4 text-indigo-500" /> {t('common.input')} JSON
            </label>
            <button
              onClick={handleClear}
              disabled={!jsonInput}
              className="text-xs font-bold px-3 py-1 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-3 h-3" /> {t('common.clear')}
            </button>
          </div>
          <div className="relative group">
            <textarea
              id="json-input"
              value={jsonInput}
              onChange={(e) => {
                const val = e.target.value;
                setJsonInput(val);
                if (val.length > MAX_LENGTH) {
                  setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
                } else {
                  setError(null);
                }
              }}
              placeholder='{ "name": "John", "age": 30 }'
              className={`w-full h-[500px] p-6 bg-slate-50 dark:bg-slate-900 border ${error ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'} rounded-[2rem] outline-none focus:ring-2 ${error ? 'focus:ring-rose-500/20' : 'focus:ring-indigo-500/20'} transition-all font-mono text-sm dark:text-slate-300 resize-none`}
            />
            {error && (
              <div className="absolute bottom-6 left-6 right-6 p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2">
                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                <p className="text-xs font-bold text-rose-600 dark:text-rose-400">{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Output */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="zod-output" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <FileCode className="w-4 h-4 text-indigo-500" /> {t('zod.generated_schema')}
            </label>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                disabled={!zodResult}
                className="text-xs font-bold px-3 py-1 rounded-full text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 transition-all flex items-center gap-1 disabled:opacity-50"
                title={t('common.download')}
              >
                <Download className="w-3 h-3" />
              </button>
              <button
                onClick={handleCopy}
                disabled={!zodResult}
                className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 ${copied ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20'} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? t('common.copied') : t('common.copy')}
              </button>
            </div>
          </div>
          <div className="bg-slate-900 dark:bg-black rounded-[2rem] p-6 h-[500px] overflow-auto border border-slate-800 shadow-xl shadow-indigo-500/5">
            <pre className="text-sm font-mono text-emerald-400 leading-relaxed">
              {zodResult || <span className="text-slate-600 italic">{t('zod.waiting')}</span>}
            </pre>
          </div>
        </div>
      </div>

      {/* Info Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-600">
            <Braces className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black">{t('zod.what_is_title')}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('zod.what_is_text')}
          </p>
        </div>

        <div className="space-y-4">
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center text-emerald-600">
            <Info className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black">{t('zod.how_it_works_title')}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('zod.how_it_works_text')}
          </p>
        </div>

        <div className="space-y-4">
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center text-amber-600">
            <FileCode className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black">{t('zod.advantages_title')}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('zod.advantages_text')}
          </p>
        </div>
      </div>
    </div>
  );
}
