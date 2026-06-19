import { useState, useEffect, useCallback, useMemo } from 'react';
import { Braces, Copy, Check, Trash2, Download, AlertCircle, Info, Settings2, ArrowDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_LENGTH = 100000;

export function JSONFlattener({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [input, setInput] = useState(initialData?.input || '');
  const [separator, setSeparator] = useState(initialData?.separator || '.');
  const [flattenArrays, setFlattenArrays] = useState(initialData?.flattenArrays ?? true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ input, separator, flattenArrays });
  }, [input, separator, flattenArrays, onStateChange]);

  const flatten = useCallback((obj: any, prefix = '', res: Record<string, any> = Object.create(null)) => {
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const lowerKey = key.toLowerCase();
        // Sentinel: Sanitize dangerous keys to prevent Prototype Pollution
        const safeKey = (lowerKey === '__proto__' || lowerKey === 'constructor' || lowerKey === 'prototype') ? `_${key}` : key;
        const propName = prefix ? `${prefix}${separator}${safeKey}` : safeKey;

        if (typeof obj[key] === 'object' && obj[key] !== null && (!Array.isArray(obj[key]) || flattenArrays)) {
          flatten(obj[key], propName, res);
        } else {
          res[propName] = obj[key];
        }
      }
    }
    return res;
  }, [separator, flattenArrays]);

  const output = useMemo(() => {
    if (!input.trim()) return '';
    if (input.length > MAX_LENGTH) return '';

    try {
      const parsed = JSON.parse(input);
      const flattened = flatten(parsed);
      return JSON.stringify(flattened, null, 2);
    } catch (e: any) {
      return '';
    }
  }, [input, flatten]);

  useEffect(() => {
    if (input.trim() && input.length <= MAX_LENGTH) {
      try {
        JSON.parse(input);
        setError(null);
      } catch (e: any) {
        setError(t('error.invalid_json') + ': ' + e.message);
      }
    } else if (input.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
    } else {
      setError(null);
    }
  }, [input, t]);

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flattened-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="json-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Braces className="w-4 h-4 text-indigo-500" /> {t('jsonformatter.input_label')}
            </label>
            <button
              onClick={() => setInput('')}
              className="text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors"
            >
              {t('common.clear')}
            </button>
          </div>
          <textarea
            id="json-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='{"user": {"name": "John", "address": {"city": "New York"}}}'
            className="w-full h-80 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />

          <div className="space-y-4 pt-4">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="json-output" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <ArrowDown className="w-4 h-4 text-emerald-500" /> {t('common.output')}
              </label>
              <div className="flex gap-2">
                <button
                  onClick={handleDownload}
                  disabled={!output}
                  className="text-xs font-bold px-3 py-1.5 rounded-xl text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 transition-all disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleCopy}
                  disabled={!output}
                  className={`text-xs font-bold px-4 py-1.5 rounded-xl transition-all flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${copied ? 'bg-emerald-500 text-white' : 'text-slate-600 bg-slate-100 dark:bg-slate-800 border border-transparent'}`}
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} {copied ? t('common.copied') : t('common.copy')}
                </button>
              </div>
            </div>
            <textarea
              id="json-output"
              value={output}
              readOnly
              className="w-full h-80 p-6 bg-slate-900 text-indigo-300 border border-slate-800 rounded-3xl outline-none font-mono text-sm leading-relaxed resize-none"
            />
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="p-8 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2rem] space-y-6">
            <div className="flex items-center gap-2 text-indigo-500 px-1">
              <Settings2 className="w-4 h-4" />
              <h3 className="font-black uppercase tracking-widest text-[10px] text-slate-400">{t('common.options')}</h3>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase block px-1">{t('jsonflattener.separator')}</label>
                <input
                  type="text"
                  value={separator}
                  onChange={(e) => setSeparator(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono"
                  placeholder="e.g. . or _"
                />
              </div>

              <div className="flex items-center justify-between px-1">
                <label htmlFor="flatten-arrays" className="text-[10px] font-bold text-slate-400 uppercase cursor-pointer">{t('jsonflattener.flatten_arrays')}</label>
                <button
                  id="flatten-arrays"
                  onClick={() => setFlattenArrays(!flattenArrays)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${flattenArrays ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${flattenArrays ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
            <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
              <Info className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h4 className="font-bold dark:text-white">{t('jsonflattener.about_title')}</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                {t('jsonflattener.about_text')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
