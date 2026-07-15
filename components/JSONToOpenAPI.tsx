import { useState, useEffect, useCallback, useRef } from 'react';
import { FileCode, Copy, Check, Trash2, AlertCircle, Download, Info, Braces } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';
import jsyaml from 'js-yaml';

const MAX_LENGTH = 100000;
const MAX_DEPTH = 20;

export function JSONToOpenAPI({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [input, setInput] = useState(initialData?.input || '');
  const [output, setOutput] = useState('');
  const [format, setOutputFormat] = useState<'yaml' | 'json'>(initialData?.format || 'yaml');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    onStateChange?.({ input, format });
  }, [input, format, onStateChange]);

  const generateSchema = (val: any, depth: number): any => {
    if (depth > MAX_DEPTH) return { type: 'object', description: 'Max depth reached' };
    if (val === null) return { type: 'object', nullable: true };

    const type = typeof val;

    if (Array.isArray(val)) {
      const items = val.length > 0 ? generateSchema(val[0], depth + 1) : { type: 'object' };
      return {
        type: 'array',
        items
      };
    }

    if (type === 'object') {
      const properties: Record<string, any> = Object.create(null);
      const required: string[] = [];

      Object.entries(val).forEach(([key, value]) => {
        // Sentinel: Prevent prototype pollution by using Object.create(null) and sanitizing keys.
        const safeKey = key === '__proto__' || key === 'constructor' || key === 'prototype' ? `_${key}` : key;
        properties[safeKey] = generateSchema(value, depth + 1);
        required.push(safeKey);
      });

      return {
        type: 'object',
        properties,
        required: required.length > 0 ? required : undefined
      };
    }

    if (type === 'string') {
      const schema: any = { type: 'string' };
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val)) {
        schema.format = 'date-time';
      } else if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
        schema.format = 'date';
      }
      return schema;
    }

    if (type === 'number') {
      return {
        type: Number.isInteger(val) ? 'integer' : 'number',
        format: Number.isInteger(val) ? 'int64' : 'float'
      };
    }

    if (type === 'boolean') {
      return { type: 'boolean' };
    }

    return { type: 'string' };
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
      const parsed = JSON.parse(input);
      const schema = generateSchema(parsed, 0);

      const openapi = {
        openapi: '3.0.0',
        info: {
          title: 'Generated API',
          version: '1.0.0'
        },
        paths: {},
        components: {
          schemas: {
            Root: schema
          }
        }
      };

      if (format === 'yaml') {
        setOutput(jsyaml.dump(openapi, { indent: 2, noRefs: true }));
      } else {
        setOutput(JSON.stringify(openapi, null, 2));
      }
      setError('');
    } catch (e: any) {
      setError(t('error.invalid_json') + ': ' + e.message);
      setOutput('');
    }
  }, [input, format, t]);

  useEffect(() => {
    handleConvert();
  }, [handleConvert]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success(t('common.copied'));
    setTimeout(() => setCopied(false), 2000);
  }, [output, t]);

  const handleClear = useCallback(() => {
    setInput('');
    setOutput('');
    setError('');
    textareaRef.current?.focus();
  }, []);

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: format === 'yaml' ? 'text/yaml' : 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `openapi.${format}`;
    link.click();
    URL.revokeObjectURL(url);
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

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-wrap gap-4 justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800">
        <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 w-full sm:w-auto">
          <button
            onClick={() => setOutputFormat('yaml')}
            className={`flex-1 sm:flex-none px-6 py-1.5 rounded-lg text-xs font-bold transition-all ${format === 'yaml' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            YAML
          </button>
          <button
            onClick={() => setOutputFormat('json')}
            className={`flex-1 sm:flex-none px-6 py-1.5 rounded-lg text-xs font-bold transition-all ${format === 'json' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            JSON
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Braces className="w-4 h-4 text-indigo-500" />
              <label htmlFor="json-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">{t('common.input')} JSON</label>
            </div>
            <div className="flex items-center gap-2">
              <Kbd modifier={null} className="hidden sm:inline-flex border-rose-200 dark:border-rose-800 text-rose-400 dark:bg-slate-900">Esc</Kbd>
              <button
                onClick={handleClear}
                disabled={!input && !output}
                className="text-xs font-bold px-3 py-1 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 transition-all flex items-center gap-1 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
              >
                <Trash2 className="w-3 h-3" /> {t('common.clear')}
              </button>
            </div>
          </div>
          <textarea
            id="json-input"
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='{"id": 1, "name": "API"}'
            className="w-full h-[500px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-emerald-500" />
              <label htmlFor="openapi-output" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">OpenAPI 3.0</label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                disabled={!output}
                className="text-xs font-bold px-3 py-1 rounded-full text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 transition-all flex items-center gap-1 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
              >
                <Download className="w-3 h-3" /> {t('common.download')}
              </button>
              <button
                onClick={handleCopy}
                disabled={!output}
                className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                  copied
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                    : 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied ? t('common.copied') : t('common.copy')}
                {!copied && <Kbd modifier={null} className="hidden sm:inline-flex w-4 h-4 bg-white/50 dark:bg-black/20 ml-1">C</Kbd>}
              </button>
            </div>
          </div>
          <textarea
            id="openapi-output"
            value={output}
            readOnly
            placeholder="OpenAPI schema will appear here..."
            className="w-full h-[500px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-mono text-sm leading-relaxed text-indigo-600 dark:text-indigo-400 resize-none"
          />
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <Info className="w-6 h-6 text-indigo-500 mt-1" />
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('jsontoopenapi.about_title', 'About JSON to OpenAPI')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('jsontoopenapi.about_text', 'This tool converts a JSON object or array into an OpenAPI 3.0 schema definition. It automatically infers types, formats (like date-time), and marks fields as required. You can export the result in YAML or JSON format.')}
          </p>
        </div>
      </div>
    </div>
  );
}
