import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Copy, Check, Trash2, Braces, FileCode, Info, AlertCircle, Download, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

const MAX_LENGTH = 100000;
const MAX_DEPTH = 20;

const PRESETS = [
  {
    nameKey: 'jsontoyup.preset_user',
    defaultName: 'User Profile',
    json: JSON.stringify({
      id: 101,
      username: 'johndoe',
      email: 'john@example.com',
      isVerified: true,
      age: 28,
      tags: ['developer', 'admin']
    }, null, 2)
  },
  {
    nameKey: 'jsontoyup.preset_product',
    defaultName: 'E-Commerce Product',
    json: JSON.stringify({
      sku: 'PROD-12345',
      name: 'Wireless Ergonomic Keyboard',
      price: 99.99,
      inStock: true,
      dimensions: {
        width: 45,
        height: 15,
        depth: 3
      }
    }, null, 2)
  },
  {
    nameKey: 'jsontoyup.preset_config',
    defaultName: 'Server Config',
    json: JSON.stringify({
      port: 8080,
      host: '0.0.0.0',
      ssl: {
        enabled: true,
        cert: '/etc/ssl/cert.pem'
      },
      allowedOrigins: ['https://example.com', 'https://admin.example.com']
    }, null, 2)
  }
];

export function JSONToYup({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [jsonInput, setJsonInput] = useState(initialData?.jsonInput || PRESETS[0].json);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onStateChange?.({ jsonInput });
  }, [jsonInput, onStateChange]);

  const handleClear = useCallback(() => {
    setJsonInput('');
    setError(null);
    toast.success(t('jsontoyup.cleared', 'JSON input cleared'));
    inputRef.current?.focus();
  }, [t]);

  const generateYupSchema = (obj: any, indent: string = '', depth: number = 0): string => {
    if (depth > MAX_DEPTH) {
      return 'yup.mixed()';
    }

    if (obj === null) {
      return 'yup.mixed().nullable()';
    }

    const type = typeof obj;

    if (Array.isArray(obj)) {
      if (obj.length === 0) return 'yup.array().of(yup.mixed())';
      const itemSchema = generateYupSchema(obj[0], indent, depth + 1);
      return `yup.array().of(${itemSchema})`;
    }

    if (type === 'object') {
      let result = 'yup.object({\n';
      const nextIndent = indent + '  ';
      const entries = Object.entries(obj);

      if (entries.length === 0) return 'yup.object({})';

      entries.forEach(([key, value]) => {
        const valueSchema = generateYupSchema(value, nextIndent, depth + 1);
        const isValidIdent = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key);
        const safeKey = isValidIdent ? key : JSON.stringify(key);
        result += `${nextIndent}${safeKey}: ${valueSchema},\n`;
      });
      result += `${indent}})`;
      return result;
    }

    if (type === 'string') return 'yup.string()';
    if (type === 'number') return 'yup.number()';
    if (type === 'boolean') return 'yup.boolean()';

    return 'yup.mixed()';
  };

  const yupResult = useMemo(() => {
    if (!jsonInput.trim()) {
      setError(null);
      return '';
    }

    try {
      const parsed = JSON.parse(jsonInput);
      setError(null);
      const schema = generateYupSchema(parsed);
      return `import * as yup from "yup";\n\nexport const schema = ${schema};\n\nexport type SchemaType = yup.InferType<typeof schema>;`;
    } catch (e: any) {
      setError(e.message);
      return '';
    }
  }, [jsonInput]);

  const handleCopy = useCallback(() => {
    if (!yupResult) return;
    navigator.clipboard.writeText(yupResult);
    setCopied(true);
    toast.success(t('jsontoyup.copied', 'Yup schema copied to clipboard'));
    setTimeout(() => setCopied(false), 2000);
  }, [yupResult, t]);

  const handleClearRef = useRef(handleClear);
  const handleCopyRef = useRef(handleCopy);

  useEffect(() => {
    handleClearRef.current = handleClear;
    handleCopyRef.current = handleCopy;
  }, [handleClear, handleCopy]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInputFocused =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement instanceof HTMLSelectElement ||
        activeElement?.getAttribute("contenteditable") === "true";

      if (isInputFocused && e.key !== 'Escape') return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key === "Escape") {
        e.preventDefault();
        handleClearRef.current();
      } else if (e.key.toLowerCase() === "c") {
        e.preventDefault();
        handleCopyRef.current();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleDownload = () => {
    if (!yupResult) return;
    const blob = new Blob([yupResult], { type: 'text/typescript' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'schema.ts';
    link.click();
    URL.revokeObjectURL(url);
    toast.success(t('jsontoyup.downloaded', 'Downloaded schema.ts'));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Presets */}
      <div className="flex flex-wrap gap-2 items-center justify-between bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-500" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('jsontoyup.presets', 'Presets')}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => {
                setJsonInput(preset.json);
                setError(null);
                toast.success(t('jsontoyup.preset_loaded', 'Loaded preset: {{name}}', { name: preset.defaultName }));
              }}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 transition-all text-slate-700 dark:text-slate-300"
            >
              {t(preset.nameKey, preset.defaultName)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="json-yup-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Braces className="w-4 h-4 text-indigo-500" /> {t('common.input')} JSON
            </label>
            <div className="flex gap-2 items-center">
              <kbd className="hidden sm:inline-flex items-center justify-center px-1.5 py-0.5 border border-rose-200 dark:border-rose-800 rounded text-[10px] font-bold text-rose-400 bg-white dark:bg-slate-900">Esc</kbd>
              <button
                onClick={handleClear}
                disabled={!jsonInput}
                className="text-xs font-bold px-3 py-1 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
              >
                <Trash2 className="w-3 h-3" /> {t('common.clear')}
              </button>
            </div>
          </div>
          <div className="relative group">
            <textarea
              id="json-yup-input"
              ref={inputRef}
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
            <label htmlFor="yup-schema-output" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <FileCode className="w-4 h-4 text-indigo-500" /> {t('yup.generated_schema', 'Generated Yup Schema')}
            </label>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                disabled={!yupResult}
                className="text-xs font-bold px-3 py-1 rounded-full text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 transition-all flex items-center gap-1 disabled:opacity-50"
                title={t('common.download')}
              >
                <Download className="w-3 h-3" />
              </button>
              <button
                onClick={handleCopy}
                disabled={!yupResult}
                className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${copied ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' : 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 border-transparent'} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? t('common.copied') : t('common.copy')}
                {!copied && <kbd className="hidden sm:inline-flex items-center justify-center w-4 h-4 border border-slate-200 dark:border-slate-700 rounded text-[10px] font-bold bg-white/50 dark:bg-black/20 ml-1">C</kbd>}
              </button>
            </div>
          </div>
          <div className="bg-slate-900 dark:bg-black rounded-[2.5rem] p-6 h-[500px] overflow-auto border border-slate-800 shadow-xl shadow-indigo-500/5">
            <textarea
              id="yup-schema-output"
              readOnly
              value={yupResult}
              className="w-full h-full bg-transparent text-emerald-400 font-mono text-sm leading-relaxed outline-none resize-none"
              placeholder={t('yup.waiting', 'Yup schema will appear here...')}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
