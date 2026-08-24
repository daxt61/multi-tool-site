import { useState, useEffect, useCallback, useRef } from 'react';
import { Copy, Check, Trash2, Braces, AlertCircle, Info, Download, Terminal, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;
const MAX_DEPTH = 20;

export function JSONToEnv({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const jsonInputRef = useRef<HTMLTextAreaElement>(null);
  const [jsonInput, setJsonInput] = useState(initialData?.jsonInput || '');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [uppercaseKeys, setUppercaseKeys] = useState(initialData?.uppercaseKeys ?? true);
  const [quoteValues, setQuoteValues] = useState(initialData?.quoteValues ?? false);
  const [prefix, setPrefix] = useState(initialData?.prefix || '');

  useEffect(() => {
    onStateChange?.({ jsonInput, uppercaseKeys, quoteValues, prefix });
  }, [jsonInput, uppercaseKeys, quoteValues, prefix, onStateChange]);

  const PRESETS = {
    fullstack: `{
  "app": {
    "name": "My Web Application",
    "port": 3000,
    "env": "development",
    "url": "http://localhost:3000"
  },
  "api": {
    "key": "secret_api_key_12345",
    "timeout": 5000
  }
}`,
    database: `{
  "db": {
    "host": "localhost",
    "port": 5432,
    "user": "postgres",
    "password": "supersecretpassword",
    "name": "app_db"
  },
  "redis": {
    "host": "127.0.0.1",
    "port": 6379
  }
}`,
    oauth_stripe: `{
  "google": {
    "client_id": "123456789.apps.googleusercontent.com",
    "client_secret": "GOCSPX-secretkey"
  },
  "stripe": {
    "public_key": "pk_test_123456789",
    "secret_key": "sk_test_987654321",
    "webhook_secret": "whsec_000000"
  }
}`
  };

  const convertToEnv = useCallback(() => {
    if (!jsonInput.trim()) {
      setOutput('');
      setError(null);
      return;
    }

    if (jsonInput.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
      setOutput('');
      return;
    }

    try {
      const parsed = JSON.parse(jsonInput);
      const lines: string[] = [];

      const flatten = (obj: any, path: string[] = [], depth: number = 0) => {
        // Sentinel: Enforce recursion depth limit to prevent Stack Overflow DoS.
        if (depth > MAX_DEPTH) return;

        if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
          let key = path.join('_');
          if (uppercaseKeys) key = key.toUpperCase();
          if (prefix) {
            let p = prefix;
            if (uppercaseKeys) p = p.toUpperCase();
            key = `${p}${key}`;
          }

          // Sentinel: Sanitize the environment variable key to prevent breakout via newlines,
          // carriage returns, equals, or other special characters. Only allow alphanumeric and underscores.
          key = key.replace(/[^a-zA-Z0-9_]/g, '_');

          let value = String(obj);
          // Sentinel: Prevent dotenv/newline injection. If the value contains any newline, carriage return,
          // space, or quotes, we force quotes and escape newlines and carriage returns securely.
          if (quoteValues || value.includes(' ') || value.includes('"') || value.includes("'") || value.includes('\n') || value.includes('\r')) {
             value = `"${value.replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r')}"`;
          }
          lines.push(`${key}=${value}`);
          return;
        }

        Object.entries(obj).forEach(([key, value]) => {
          flatten(value, [...path, key], depth + 1);
        });
      };

      flatten(parsed);
      setOutput(lines.join('\n'));
      setError(null);
    } catch (e) {
      setError(t('error.invalid_json'));
      setOutput('');
    }
  }, [jsonInput, uppercaseKeys, quoteValues, prefix, t]);

  useEffect(() => {
    convertToEnv();
  }, [convertToEnv]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success(t('jsontoenv.toast_copied', 'Env configuration copied to clipboard!'));
    setTimeout(() => setCopied(false), 2000);
  }, [output, t]);

  const handleClear = useCallback(() => {
    setJsonInput('');
    setOutput('');
    setError(null);
    toast.success(t('jsontoenv.toast_cleared', 'Inputs cleared!'));
    setTimeout(() => jsonInputRef.current?.focus(), 0);
  }, [t]);

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = '.env';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(t('jsontoenv.toast_downloaded', '.env file downloaded!'));
  };

  const loadPreset = (presetKey: keyof typeof PRESETS) => {
    setJsonInput(PRESETS[presetKey]);
    toast.success(t('jsontoenv.toast_preset_loaded', 'Preset loaded successfully!'));
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
            {t('jsontoenv.presets_title', 'Clickable Presets')}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => loadPreset('fullstack')}
            className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 rounded-xl transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
          >
            {t('jsontoenv.preset_fullstack', 'Full-Stack Web App')}
          </button>
          <button
            onClick={() => loadPreset('database')}
            className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 rounded-xl transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
          >
            {t('jsontoenv.preset_database', 'Database & Redis Config')}
          </button>
          <button
            onClick={() => loadPreset('oauth_stripe')}
            className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 rounded-xl transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
          >
            {t('jsontoenv.preset_oauth_stripe', 'OAuth & Stripe Keys')}
          </button>
        </div>
      </div>

      {/* Options Toolbar */}
      <div className="flex flex-wrap gap-4 justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800">
        <div className="flex flex-wrap gap-6 items-center">
          <label className="flex items-center gap-2 cursor-pointer group">
            <div className={`w-10 h-6 rounded-full transition-colors relative ${uppercaseKeys ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'}`}>
              <input
                type="checkbox"
                className="sr-only"
                checked={uppercaseKeys}
                onChange={() => setUppercaseKeys(!uppercaseKeys)}
              />
              <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${uppercaseKeys ? 'translate-x-4' : ''}`} />
            </div>
            <span className="text-sm font-bold text-slate-600 dark:text-slate-300 group-hover:text-indigo-500 transition-colors">{t('jsontoenv.uppercase')}</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer group">
            <div className={`w-10 h-6 rounded-full transition-colors relative ${quoteValues ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'}`}>
              <input
                type="checkbox"
                className="sr-only"
                checked={quoteValues}
                onChange={() => setQuoteValues(!quoteValues)}
              />
              <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${quoteValues ? 'translate-x-4' : ''}`} />
            </div>
            <span className="text-sm font-bold text-slate-600 dark:text-slate-300 group-hover:text-indigo-500 transition-colors">{t('jsontoenv.quotes')}</span>
          </label>

          <div className="flex items-center gap-2">
            <label htmlFor="prefix-input" className="text-sm font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap cursor-pointer">
              {t('jsontoenv.prefix')}
            </label>
            <input
              id="prefix-input"
              type="text"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              placeholder="ex: APP_"
              className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>
      </div>

      {/* Editor Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Braces className="w-4 h-4 text-indigo-500" aria-hidden="true" />
              <label htmlFor="json-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('common.input')} (JSON)
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Kbd modifier={null} className="hidden sm:inline-flex border-rose-200 dark:border-rose-800 text-rose-400 dark:bg-slate-900">Esc</Kbd>
              <button
                onClick={handleClear}
                disabled={!jsonInput && !output}
                className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
              >
                <Trash2 className="w-3 h-3" aria-hidden="true" /> {t('common.clear')}
              </button>
            </div>
          </div>
          <textarea
            id="json-input"
            ref={jsonInputRef}
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder='{"api": {"key": "secret", "url": "https://api.com"}}'
            className={`w-full h-[400px] p-6 bg-slate-50 dark:bg-slate-900 border ${error ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'} rounded-3xl outline-none focus:ring-2 ${error ? 'focus:ring-rose-500/20' : 'focus:ring-indigo-500/20'} transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none`}
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-indigo-500" aria-hidden="true" />
              <label htmlFor="env-output" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('common.output')} (.env)
              </label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                disabled={!output}
                className="text-xs font-bold px-3 py-1.5 rounded-xl text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 transition-all flex items-center gap-1 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
              >
                <Download className="w-3 h-3" aria-hidden="true" /> .env
              </button>
              <button
                onClick={handleCopy}
                disabled={!output}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none flex items-center gap-1 ${
                  copied
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                    : 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-slate-200 dark:border-slate-700 hover:border-indigo-500/50'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {copied ? <Check className="w-3 h-3" aria-hidden="true" /> : <Copy className="w-3 h-3" aria-hidden="true" />}
                {copied ? t('common.copied') : t('common.copy')}
                {!copied && output && <Kbd modifier={null} className="hidden sm:inline-flex w-4 h-4 bg-white/50 dark:bg-black/20 ml-1">C</Kbd>}
              </button>
            </div>
          </div>
          <textarea
            id="env-output"
            value={output}
            readOnly
            placeholder={t('jsontoenv.placeholder_output')}
            className="w-full h-[400px] p-6 bg-slate-900 border border-slate-800 rounded-3xl outline-none font-mono text-sm leading-relaxed text-indigo-300 resize-none"
          />
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" aria-hidden="true" />
          {error}
        </div>
      )}

      {/* Info */}
      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <Info className="w-6 h-6 text-indigo-500 mt-1" aria-hidden="true" />
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('jsontoenv.about_title')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('jsontoenv.about_text')}
          </p>
        </div>
      </div>
    </div>
  );
}
