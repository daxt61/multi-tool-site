import { useState, useEffect, useCallback, useRef } from 'react';
import { FileCode, Copy, Check, Trash2, AlertCircle, Download, Info, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

const MAX_LENGTH = 100000;
const MAX_DEPTH = 20;

const PRESETS = [
  {
    nameKey: 'jsontojoi.preset_user',
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
    nameKey: 'jsontojoi.preset_product',
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
    nameKey: 'jsontojoi.preset_config',
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

export function JSONToJoi({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState(initialData?.input || PRESETS[0].json);
  const [output, setOutput] = useState(initialData?.output || '');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ input, output });
  }, [input, output, onStateChange]);

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

      const getJoiSchema = (val: any, depth: number): string => {
        if (depth > MAX_DEPTH) return 'Joi.any()';
        if (val === null || val === undefined) return 'Joi.any()';

        if (Array.isArray(val)) {
          if (val.length === 0) return 'Joi.array()';
          const itemType = getJoiSchema(val[0], depth + 1);
          return `Joi.array().items(${itemType})`;
        }

        if (typeof val === 'object') {
          const keys = Object.entries(val).map(([key, value]) => {
            const schema = getJoiSchema(value, depth + 1);
            const isValidIdent = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key);
            const safeKey = isValidIdent ? key : JSON.stringify(key);
            return `  ${safeKey}: ${schema}`;
          });

          if (keys.length === 0) return 'Joi.object()';
          return `Joi.object({\n${keys.join(',\n')}\n})`;
        }

        if (typeof val === 'string') {
          let str = 'Joi.string()';
          if (val.includes('@') && val.includes('.')) str += '.email()';
          if (/^https?:\/\//.test(val)) str += '.uri()';
          return str;
        }

        if (typeof val === 'number') {
          let num = 'Joi.number()';
          if (Number.isInteger(val)) num += '.integer()';
          return num;
        }

        if (typeof val === 'boolean') return 'Joi.boolean()';

        return 'Joi.any()';
      };

      const schema = getJoiSchema(parsed, 0);
      let result = "const Joi = require('joi');\n\n";
      result += `const schema = ${schema};`;

      setOutput(result);
      setError('');
    } catch (e: any) {
      setError(t('error.invalid_json') + ': ' + e.message);
      setOutput('');
    }
  }, [input, t]);

  useEffect(() => {
    handleConvert();
  }, [handleConvert]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success(t('jsontojoi.copied', 'Joi schema copied to clipboard'));
    setTimeout(() => setCopied(false), 2000);
  }, [output, t]);

  const handleClear = useCallback(() => {
    setInput('');
    setOutput('');
    setError('');
    toast.success(t('jsontojoi.cleared', 'JSON input cleared'));
    inputRef.current?.focus();
  }, [t]);

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'schema.joi.js';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(t('jsontojoi.downloaded', 'Downloaded schema.joi.js'));
  };

  const handlersRef = useRef({ handleClear, handleCopy });
  useEffect(() => {
    handlersRef.current = { handleClear, handleCopy };
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
        handlersRef.current.handleClear();
      } else if (e.key.toLowerCase() === "c") {
        e.preventDefault();
        handlersRef.current.handleCopy();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Presets */}
      <div className="flex flex-wrap gap-2 items-center justify-between bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-500" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('jsontojoi.presets', 'Presets')}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => {
                setInput(preset.json);
                setError('');
                toast.success(t('jsontojoi.preset_loaded', 'Loaded preset: {{name}}', { name: preset.defaultName }));
              }}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 transition-all text-slate-700 dark:text-slate-300"
            >
              {t(preset.nameKey, preset.defaultName)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-indigo-500" />
              <label htmlFor="json-joi-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">{t('common.input')} JSON</label>
            </div>
            <div className="flex gap-2 items-center">
              <kbd className="hidden sm:inline-flex items-center justify-center px-1.5 py-0.5 border border-rose-200 dark:border-rose-800 rounded text-[10px] font-bold text-rose-400 bg-white dark:bg-slate-900">Esc</kbd>
              <button
                onClick={handleClear}
                disabled={!input && !output}
                className="text-xs font-bold px-3 py-1 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
              >
                <Trash2 className="w-3 h-3" /> {t('common.clear')}
              </button>
            </div>
          </div>
          <textarea
            id="json-joi-input"
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='{"id": 1, "username": "johndoe", "email": "john@example.com"}'
            className="w-full h-[450px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-emerald-500" />
              <label htmlFor="joi-schema-output" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">Joi Schema</label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                disabled={!output}
                className="text-xs font-bold px-3 py-1 rounded-full text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 transition-all flex items-center gap-1 disabled:opacity-50"
              >
                <Download className="w-3 h-3" /> {t('common.download')}
              </button>
              <button
                onClick={handleCopy}
                disabled={!output}
                className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                  copied
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                    : 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 border-transparent'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? t('common.copied') : t('common.copy')}
                {!copied && <kbd className="hidden sm:inline-flex items-center justify-center w-4 h-4 border border-slate-200 dark:border-slate-700 rounded text-[10px] font-bold bg-white/50 dark:bg-black/20 ml-1">C</kbd>}
              </button>
            </div>
          </div>
          <textarea
            id="joi-schema-output"
            value={output}
            readOnly
            className="w-full h-[450px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-mono text-sm leading-relaxed text-indigo-600 dark:text-indigo-400 resize-none"
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
          <h4 className="font-bold dark:text-white">À propos de la génération de schéma Joi</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Joi est une bibliothèque de validation de schémas puissante pour JavaScript. Cet outil analyse votre objet JSON et génère un schéma Joi correspondant. Il détecte automatiquement les types de base, les emails, les URIs et les entiers pour vous faire gagner du temps lors de la configuration de vos validations.
          </p>
        </div>
      </div>
    </div>
  );
}
