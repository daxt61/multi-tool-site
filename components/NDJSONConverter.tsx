import { useState, useEffect, useCallback, useRef } from 'react';
import { Copy, Check, Trash2, ArrowLeftRight, FileCode, Info, AlertCircle, Download, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;

const PRESETS = [
  {
    id: 'user_stream',
    labelKey: 'ndjson.preset_users',
    defaultLabel: 'User Stream NDJSON',
    direction: 'ndjson-to-json' as const,
    input: `{"id":101,"name":"Alice","email":"alice@example.com","role":"admin"}\n{"id":102,"name":"Bob","email":"bob@example.com","role":"user"}\n{"id":103,"name":"Charlie","email":"charlie@example.com","role":"developer"}`
  },
  {
    id: 'server_events',
    labelKey: 'ndjson.preset_events',
    defaultLabel: 'Server Event Logs',
    direction: 'json-to-ndjson' as const,
    input: JSON.stringify([
      { timestamp: "2026-03-15T10:00:00Z", level: "INFO", event: "user_login", userId: "usr_1" },
      { timestamp: "2026-03-15T10:01:05Z", level: "WARN", event: "rate_limit_exceeded", userId: "usr_2" },
      { timestamp: "2026-03-15T10:02:10Z", level: "ERROR", event: "payment_failed", userId: "usr_3" }
    ], null, 2)
  },
  {
    id: 'ecommerce_tx',
    labelKey: 'ndjson.preset_ecommerce',
    defaultLabel: 'E-Commerce Transactions',
    direction: 'ndjson-to-json' as const,
    input: `{"tx_id":"TX-01","amount":49.99,"status":"completed"}\n{"tx_id":"TX-02","amount":120.00,"status":"pending"}\n{"tx_id":"TX-03","amount":15.50,"status":"refunded"}`
  }
];

export function NDJSONConverter({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState(initialData?.input || PRESETS[0].input);
  const [output, setOutput] = useState('');
  const [direction, setDirection] = useState<'json-to-ndjson' | 'ndjson-to-json'>(initialData?.direction || PRESETS[0].direction);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ input, direction });
  }, [input, direction, onStateChange]);

  const handleConvert = useCallback(() => {
    if (!input.trim()) {
      setOutput('');
      setError(null);
      return;
    }

    if (input.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
      setOutput('');
      return;
    }

    try {
      if (direction === 'json-to-ndjson') {
        const parsed = JSON.parse(input);
        const array = Array.isArray(parsed) ? parsed : [parsed];
        const ndjson = array.map(item => JSON.stringify(item)).join('\n');
        setOutput(ndjson);
      } else {
        const lines = input.trim().split(/\r?\n/);
        const result = lines.map((line: string, idx: number) => {
          try {
            return JSON.parse(line);
          } catch (e) {
            throw new Error(`Line ${idx + 1}: ${t('error.invalid_json', { defaultValue: 'Invalid JSON line' })}`);
          }
        });
        setOutput(JSON.stringify(result, null, 2));
      }
      setError(null);
    } catch (e: any) {
      setError(e.message);
      setOutput('');
    }
  }, [input, direction, t]);

  useEffect(() => {
    const timeout = setTimeout(handleConvert, 200);
    return () => clearTimeout(timeout);
  }, [handleConvert]);

  const handleSwap = useCallback(() => {
    setDirection(prev => prev === 'json-to-ndjson' ? 'ndjson-to-json' : 'json-to-ndjson');
    setInput(output);
    setOutput(input);
    setError(null);
    toast.success(t('ndjson.swapped', { defaultValue: 'Swapped conversion direction' }));
    textareaRef.current?.focus();
  }, [input, output, t]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success(t('common.copied', { defaultValue: 'Copied to clipboard!' }));
    setTimeout(() => setCopied(false), 2000);
  }, [output, t]);

  const handleClear = useCallback(() => {
    setInput('');
    setOutput('');
    setError(null);
    toast.success(t('common.cleared', { defaultValue: 'Cleared input' }));
    textareaRef.current?.focus();
  }, [t]);

  const loadPreset = (preset: typeof PRESETS[0]) => {
    setInput(preset.input);
    setDirection(preset.direction);
    const label = t(preset.labelKey, { defaultValue: preset.defaultLabel });
    toast.success(t('common.preset_loaded', { name: label, defaultValue: `Loaded preset: ${label}` }));
    textareaRef.current?.focus();
  };

  const handlersRef = useRef({ handleCopy, handleClear, handleSwap });
  useEffect(() => {
    handlersRef.current = { handleCopy, handleClear, handleSwap };
  }, [handleCopy, handleClear, handleSwap]);

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
      } else if (e.key.toLowerCase() === 's') {
        e.preventDefault();
        handlersRef.current.handleSwap();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleDownload = () => {
    if (!output) return;
    const extension = direction === 'json-to-ndjson' ? 'ndjson' : 'json';
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `data.${extension}`;
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

      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Input */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="ndjson-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <FileCode className="w-4 h-4 text-indigo-500" /> {direction === 'json-to-ndjson' ? 'JSON Array' : 'NDJSON'}
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
          <textarea
            id="ndjson-input"
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={direction === 'json-to-ndjson' ? '[{"id":1}, {"id":2}]' : '{"id":1}\n{"id":2}'}
            className="w-full h-80 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm dark:text-slate-300 resize-none"
          />
        </div>

        {/* Controls */}
        <div className="lg:col-span-2 flex flex-col gap-3 items-center">
          <button
            onClick={handleSwap}
            className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl hover:border-indigo-500 transition-all group shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
            title={`${t('ndjson.swap', { defaultValue: 'Swap Direction' })} (S)`}
          >
            <ArrowLeftRight className="w-6 h-6 text-slate-400 group-hover:text-indigo-500 group-hover:rotate-180 transition-all duration-500" />
          </button>
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center flex items-center gap-1">
             <span>{direction === 'json-to-ndjson' ? t('ndjson.to_ndjson', { defaultValue: 'JSON -> NDJSON' }) : t('ndjson.to_json', { defaultValue: 'NDJSON -> JSON' })}</span>
             <Kbd modifier={null} className="hidden sm:inline-flex w-4 h-4 bg-slate-100 dark:bg-slate-800">S</Kbd>
          </div>
        </div>

        {/* Output */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="ndjson-output" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <FileCode className="w-4 h-4 text-emerald-500" /> {direction === 'json-to-ndjson' ? 'NDJSON' : 'JSON Array'}
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
                 {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                 {copied ? t('common.copied', { defaultValue: 'Copied' }) : t('common.copy', { defaultValue: 'Copy' })}
                 {!copied && <Kbd modifier={null} className="hidden sm:inline-flex w-4 h-4 bg-white/50 dark:bg-black/20 ml-1">C</Kbd>}
               </button>
            </div>
          </div>
          <textarea
            id="ndjson-output"
            readOnly
            value={output}
            placeholder="Result will appear here..."
            className="w-full h-80 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-mono text-sm dark:text-slate-300 resize-none shadow-inner"
          />
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <Info className="w-6 h-6 text-indigo-500 mt-1" />
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('ndjson.about_title', { defaultValue: 'About NDJSON Converter' })}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('ndjson.about_text', { defaultValue: 'Newline-Delimited JSON (NDJSON / JSON Lines) stores single JSON objects per line, making it ideal for streaming logs and processing large datasets. This tool converts bidirectionally between standard JSON arrays and NDJSON streams.' })}
          </p>
        </div>
      </div>
    </div>
  );
}
