import { useState, useEffect, useCallback, useRef } from 'react';
import { Copy, Check, Trash2, ArrowLeftRight, FileCode, Info, AlertCircle, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_LENGTH = 100000;

export function NDJSONConverter({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState(initialData?.input || '[\n  { "id": 1, "status": "ok" },\n  { "id": 2, "status": "error" }\n]');
  const [output, setOutput] = useState('');
  const [direction, setDirection] = useState<'json-to-ndjson' | 'ndjson-to-json'>(initialData?.direction || 'json-to-ndjson');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ input, direction });
  }, [input, direction]);

  const handleConvert = useCallback(() => {
    if (!input.trim()) {
      setOutput('');
      setError(null);
      return;
    }

    if (input.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
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
            throw new Error(`Line ${idx + 1}: ${t('error.invalid_json')}`);
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
    const timeout = setTimeout(handleConvert, 300);
    return () => clearTimeout(timeout);
  }, [handleConvert]);

  const handleSwap = () => {
    setDirection(prev => prev === 'json-to-ndjson' ? 'ndjson-to-json' : 'json-to-ndjson');
    setInput(output);
    setOutput(input);
    setError(null);
  };

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    setError(null);
    textareaRef.current?.focus();
  };

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
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
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
              <FileCode className="w-3 h-3" /> {direction === 'json-to-ndjson' ? 'JSON Array' : 'NDJSON'}
            </label>
            <button
              onClick={handleClear}
              className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 px-3 py-1 rounded-lg transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
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
        <div className="lg:col-span-2 flex flex-col gap-4 items-center">
          <button
            onClick={handleSwap}
            className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl hover:border-indigo-500 transition-all group shadow-sm"
            title="Swap Direction"
          >
            <ArrowLeftRight className="w-6 h-6 text-slate-400 group-hover:text-indigo-500 group-hover:rotate-180 transition-all duration-500" />
          </button>
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">
             {direction === 'json-to-ndjson' ? t('ndjson.to_ndjson') : t('ndjson.to_json')}
          </div>
        </div>

        {/* Output */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="ndjson-output" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <FileCode className="w-3 h-3 text-emerald-500" /> {direction === 'json-to-ndjson' ? 'NDJSON' : 'JSON Array'}
            </label>
            <div className="flex gap-2">
               <button
                 onClick={handleDownload}
                 disabled={!output}
                 className="p-2 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/10 rounded-lg hover:bg-indigo-100 disabled:opacity-50 transition-all"
               >
                 <Download className="w-3.5 h-3.5" />
               </button>
               <button
                 onClick={handleCopy}
                 disabled={!output}
                 className={`p-2 rounded-lg transition-all ${copied ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20' : 'text-slate-600 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300'} disabled:opacity-50`}
               >
                 {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
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
          <h4 className="font-bold dark:text-white">{t('ndjson.about_title')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('ndjson.about_text')}
          </p>
        </div>
      </div>
    </div>
  );
}
