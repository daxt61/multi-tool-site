import { useState, useEffect, useCallback, useRef } from 'react';
import { FileCode, Copy, Check, Trash2, AlertCircle, ArrowLeftRight, Download, Info, Play } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import yaml from 'js-yaml';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 50000;

export function JSObjectConverter({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const primaryInputRef = useRef<HTMLTextAreaElement>(null);

  const [jsInput, setJsInput] = useState(initialData?.jsInput || '');
  const [jsonInput, setJsonInput] = useState(initialData?.jsonInput || '');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<'js' | 'json' | null>(null);

  useEffect(() => {
    onStateChange?.({ jsInput, jsonInput });
  }, [jsInput, jsonInput]);

  const handleConvertJsToJson = useCallback(() => {
    try {
      setError('');
      if (!jsInput.trim()) {
        setJsonInput('');
        return;
      }
      if (jsInput.length > MAX_LENGTH) {
        setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
        return;
      }

      const obj = yaml.load(jsInput);
      setJsonInput(JSON.stringify(obj, null, 2));
      toast.success(t('jsobject.convert_success', 'Converted JS Object to JSON successfully!'));
    } catch (e: any) {
      setError(t('jsobject.js_error', 'JS Object Error: ') + e.message);
    }
  }, [jsInput, t]);

  const handleConvertJsonToJs = useCallback(() => {
    try {
      setError('');
      if (!jsonInput.trim()) {
        setJsInput('');
        return;
      }
      if (jsonInput.length > MAX_LENGTH) {
        setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
        return;
      }
      const obj = JSON.parse(jsonInput);

      const stringifyJs = (item: any, indent: string = ''): string => {
        if (item === null) return 'null';
        if (typeof item === 'string') return `'${item.replace(/'/g, "\\'")}'`;
        if (typeof item !== 'object') return String(item);
        if (Array.isArray(item)) {
          if (item.length === 0) return '[]';
          const items = item.map(element => stringifyJs(element, indent + '  ')).join(', ');
          return `[${items}]`;
        }

        const entries = Object.entries(item);
        if (entries.length === 0) return '{}';

        const nextIndent = indent + '  ';
        const fields = entries.map(([key, value]) => {
          const validKey = /^[a-z_$][a-z0-9_$]*$/i.test(key);
          const finalKey = validKey ? key : `'${key.replace(/'/g, "\\'")}'`;
          return `${nextIndent}${finalKey}: ${stringifyJs(value, nextIndent)}`;
        });

        return `{\n${fields.join(',\n')}\n${indent}}`;
      };

      setJsInput(stringifyJs(obj));
      toast.success(t('jsobject.convert_success_json', 'Converted JSON to JS Object successfully!'));
    } catch (e: any) {
      setError(t('jsobject.json_error', 'JSON Error: ') + e.message);
    }
  }, [jsonInput, t]);

  const handleClear = useCallback(() => {
    setJsInput('');
    setJsonInput('');
    setError('');
    primaryInputRef.current?.focus();
    toast.success(t('jsobject.cleared', 'Cleared inputs!'));
  }, [t]);

  const copyToClipboard = useCallback((text: string, type: 'js' | 'json') => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(type);
    toast.success(t('common.copied'));
    setTimeout(() => setCopied(null), 2000);
  }, [t]);

  const handleDownload = useCallback((content: string, filename: string) => {
    if (!content) return;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(t('common.downloaded'));
  }, [t]);

  const handlersRef = useRef({
    handleClear,
    copyToClipboard,
    jsInput,
    jsonInput,
  });

  useEffect(() => {
    handlersRef.current = {
      handleClear,
      copyToClipboard,
      jsInput,
      jsonInput,
    };
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isEditable = activeEl && (
        activeEl.tagName === 'INPUT' ||
        activeEl.tagName === 'TEXTAREA' ||
        activeEl.getAttribute('contenteditable') === 'true'
      );

      if (isEditable) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        handlersRef.current.handleClear();
      } else if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        if (handlersRef.current.jsonInput) {
          handlersRef.current.copyToClipboard(handlersRef.current.jsonInput, 'json');
        } else if (handlersRef.current.jsInput) {
          handlersRef.current.copyToClipboard(handlersRef.current.jsInput, 'js');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative">
        <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="bg-white dark:bg-slate-800 p-3 rounded-full shadow-xl border border-slate-200 dark:border-slate-700 text-indigo-600">
            <ArrowLeftRight className="w-6 h-6" aria-hidden="true" />
          </div>
        </div>

        {/* JS Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-indigo-500" aria-hidden="true" />
              <label htmlFor="js-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">{t('jsobject.js_title', 'JS Object')}</label>
            </div>
            <div className="flex gap-2 items-center">
              <button
                onClick={handleConvertJsToJson}
                className="text-xs font-bold px-3 py-1.5 rounded-full text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 transition-all flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
                title={t('jsobject.to_json', 'Convert JS to JSON')}
              >
                <Play className="w-3.5 h-3.5" aria-hidden="true" /> {t('common.convert')}
              </button>
              <button
                onClick={() => handleDownload(jsInput, 'object.js')}
                disabled={!jsInput}
                className="text-xs font-bold px-3 py-1.5 rounded-full text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 transition-all flex items-center gap-1 disabled:opacity-50"
                title={t('jsobject.download_js', 'Download JS')}
              >
                <Download className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
              <button
                onClick={() => copyToClipboard(jsInput, 'js')}
                disabled={!jsInput}
                className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all flex items-center gap-1 border ${
                  copied === 'js'
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                    : 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-transparent hover:bg-slate-200'
                } disabled:opacity-50`}
                title={t('jsobject.copy_js', 'Copy JS')}
              >
                {copied === 'js' ? <Check className="w-3.5 h-3.5" aria-hidden="true" /> : <Copy className="w-3.5 h-3.5" aria-hidden="true" />} {copied === 'js' ? t('common.copied') : t('common.copy')}
              </button>
              <Kbd modifier={null} className="text-slate-400">Esc</Kbd>
              <button
                onClick={handleClear}
                disabled={!jsInput && !jsonInput}
                className="text-xs font-bold px-3 py-1.5 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 transition-all flex items-center gap-1 disabled:opacity-50"
                title={t('jsobject.clear_all', 'Clear All')}
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>
          <textarea
            id="js-input"
            ref={primaryInputRef}
            value={jsInput}
            onChange={(e) => setJsInput(e.target.value)}
            placeholder="{ name: 'John', age: 30 }"
            className="w-full h-[500px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        {/* JSON Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-indigo-500" aria-hidden="true" />
              <label htmlFor="json-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">JSON</label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleConvertJsonToJs}
                className="text-xs font-bold px-3 py-1.5 rounded-full text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 transition-all flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
                title={t('jsobject.to_js', 'Convert JSON to JS')}
              >
                <Play className="w-3.5 h-3.5" aria-hidden="true" /> {t('common.convert')}
              </button>
              <button
                onClick={() => handleDownload(jsonInput, 'data.json')}
                disabled={!jsonInput}
                className="text-xs font-bold px-3 py-1.5 rounded-full text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 transition-all flex items-center gap-1 disabled:opacity-50"
                title={t('jsobject.download_json', 'Download JSON')}
              >
                <Download className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
              <button
                onClick={() => copyToClipboard(jsonInput, 'json')}
                disabled={!jsonInput}
                className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all flex items-center gap-1 border ${
                  copied === 'json'
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                    : 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-transparent hover:bg-slate-200'
                } disabled:opacity-50`}
                title={t('jsobject.copy_json', 'Copy JSON (C)')}
              >
                {copied === 'json' ? <Check className="w-3.5 h-3.5" aria-hidden="true" /> : <Copy className="w-3.5 h-3.5" aria-hidden="true" />} {copied === 'json' ? t('common.copied') : t('common.copy')}
                <Kbd modifier={null} className="ml-1 hidden sm:inline-flex border-slate-200 dark:border-slate-700 text-slate-400">C</Kbd>
              </button>
            </div>
          </div>
          <textarea
            id="json-input"
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder='{ "name": "John", "age": 30 }'
            className="w-full h-[500px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <Info className="w-6 h-6 text-indigo-500 mt-1 shrink-0" aria-hidden="true" />
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('jsobject.about_title', 'About JS Object / JSON Conversion')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('jsobject.about_desc', 'This tool allows you to easily convert JavaScript object literals (often copied from consoles or config files) into valid JSON formats and vice-versa. When transforming to a JS Object, quotes on properties are stripped out where valid, and standard single quotes are preferred for text values.')}
          </p>
          <p className="text-xs text-rose-500 font-bold">
            {t('jsobject.about_security', 'Note: Execution of JavaScript parsing happens completely offline. No key/value structures are ever transmitted to our servers.')}
          </p>
        </div>
      </div>
    </div>
  );
}
