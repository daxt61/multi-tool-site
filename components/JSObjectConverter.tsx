import { useState, useEffect, useCallback } from 'react';
import { FileCode, Copy, Check, Trash2, AlertCircle, ArrowLeftRight, Download, Info, Play } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import yaml from 'js-yaml';

const MAX_LENGTH = 50000;

export function JSObjectConverter({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
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

      // Use js-yaml as a safer alternative to new Function() for parsing JS-like literals
      // Most JS object literals are valid YAML.
      const obj = yaml.load(jsInput);
      setJsonInput(JSON.stringify(obj, null, 2));
    } catch (e: any) {
      setError('JS Object Error: ' + e.message);
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

      // Convert to JS literal string
      // We use a custom stringifier to avoid quotes on keys where valid
      const stringifyJs = (item: any, indent: string = ''): string => {
        if (item === null) return 'null';
        if (typeof item === 'string') return `'${item.replace(/'/g, "\\'")}'`;
        if (typeof item !== 'object') return String(item);
        if (Array.isArray(item)) {
          if (item.length === 0) return '[]';
          // Fixed array stringification: item.map(element => ...)
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
    } catch (e: any) {
      setError('JSON Error: ' + e.message);
    }
  }, [jsonInput, t]);

  const handleJsChange = (val: string) => {
    setJsInput(val);
  };

  const handleJsonChange = (val: string) => {
    setJsonInput(val);
  };

  const copyToClipboard = (text: string, type: 'js' | 'json') => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDownload = (content: string, filename: string) => {
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
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative">
        <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="bg-white dark:bg-slate-800 p-3 rounded-full shadow-xl border border-slate-200 dark:border-slate-700 text-indigo-600">
            <ArrowLeftRight className="w-6 h-6" />
          </div>
        </div>

        {/* JS Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-indigo-500" />
              <label htmlFor="js-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">JS Object</label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleConvertJsToJson}
                className="text-xs font-bold px-3 py-1 rounded-full text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 transition-all flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
                title="Convert JS to JSON"
              >
                <Play className="w-3 h-3" /> {t('common.convert', 'Convertir')}
              </button>
              <button
                onClick={() => handleDownload(jsInput, 'object.js')}
                disabled={!jsInput}
                className="text-xs font-bold px-3 py-1 rounded-full text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 transition-all flex items-center gap-1 disabled:opacity-50"
              >
                <Download className="w-3 h-3" />
              </button>
              <button
                onClick={() => copyToClipboard(jsInput, 'js')}
                disabled={!jsInput}
                className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 border ${
                  copied === 'js'
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                    : 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-transparent hover:bg-slate-200'
                } disabled:opacity-50`}
              >
                {copied === 'js' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied === 'js' ? t('common.copied') : t('common.copy')}
              </button>
              <button
                onClick={() => {setJsInput(''); setJsonInput(''); setError('');}}
                disabled={!jsInput && !jsonInput}
                className="text-xs font-bold px-3 py-1 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 transition-all flex items-center gap-1 disabled:opacity-50"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
          <textarea
            id="js-input"
            value={jsInput}
            onChange={(e) => handleJsChange(e.target.value)}
            placeholder="{ name: 'John', age: 30 }"
            className="w-full h-[500px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        {/* JSON Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-indigo-500" />
              <label htmlFor="json-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">JSON</label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleConvertJsonToJs}
                className="text-xs font-bold px-3 py-1 rounded-full text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 transition-all flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
                title="Convert JSON to JS"
              >
                <Play className="w-3 h-3" /> {t('common.convert', 'Convertir')}
              </button>
              <button
                onClick={() => handleDownload(jsonInput, 'data.json')}
                disabled={!jsonInput}
                className="text-xs font-bold px-3 py-1 rounded-full text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 transition-all flex items-center gap-1 disabled:opacity-50"
              >
                <Download className="w-3 h-3" />
              </button>
              <button
                onClick={() => copyToClipboard(jsonInput, 'json')}
                disabled={!jsonInput}
                className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 border ${
                  copied === 'json'
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                    : 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-transparent hover:bg-slate-200'
                } disabled:opacity-50`}
              >
                {copied === 'json' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied === 'json' ? t('common.copied') : t('common.copy')}
              </button>
            </div>
          </div>
          <textarea
            id="json-input"
            value={jsonInput}
            onChange={(e) => handleJsonChange(e.target.value)}
            placeholder='{ "name": "John", "age": 30 }'
            className="w-full h-[500px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <Info className="w-6 h-6 text-indigo-500 mt-1" />
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">À propos de la conversion JS Object / JSON</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Cet outil vous permet de convertir facilement des objets JavaScript (souvent copiés depuis une console ou un fichier de configuration) en JSON valide, et vice-versa. Lors du passage vers JS Object, les guillemets superflus sur les clés sont supprimés et des apostrophes sont utilisées pour les chaînes.
          </p>
          <p className="text-xs text-rose-500 font-bold">
            Note : L'évaluation du code JavaScript est effectuée localement dans votre navigateur. N'utilisez cet outil qu'avec du code en lequel vous avez confiance.
          </p>
        </div>
      </div>
    </div>
  );
}
