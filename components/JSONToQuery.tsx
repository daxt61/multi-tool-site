import { useState, useEffect, useCallback, useRef } from 'react';
import { Braces, Link as LinkIcon, Trash2, Copy, Check, ArrowRightLeft, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;

export function JSONToQuery({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [jsonText, setJsonText] = useState(initialData?.jsonText || '');
  const [queryText, setQueryText] = useState(initialData?.queryText || '');
  const [arrayFormat, setArrayFormat] = useState<'brackets' | 'indices' | 'repeat' | 'comma'>(initialData?.arrayFormat || 'brackets');
  const [sortKeys, setSortKeys] = useState(initialData?.sortKeys || false);
  const [urlEncode, setUrlSafe] = useState(initialData?.urlEncode ?? true);
  const [copied, setCopied] = useState<'json' | 'query' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const jsonInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    onStateChange?.({ jsonText, queryText, arrayFormat, sortKeys, urlEncode });
  }, [jsonText, queryText, arrayFormat, sortKeys, urlEncode, onStateChange]);

  // Convert JSON object/array to Query String recursively
  const stringifyToQuery = useCallback((obj: any, prefix = ''): string[] => {
    if (obj === null || obj === undefined) return [];

    // Safely check if simple value
    if (typeof obj !== 'object') {
      const valStr = String(obj);
      const formattedVal = urlEncode ? encodeURIComponent(valStr) : valStr;
      return [`${prefix}=${formattedVal}`];
    }

    const parts: string[] = [];

    // Array formatting logic
    if (Array.isArray(obj)) {
      if (arrayFormat === 'comma') {
        const valStr = obj.map(v => (v === null || v === undefined ? '' : String(v))).join(',');
        const formattedVal = urlEncode ? encodeURIComponent(valStr) : valStr;
        parts.push(`${prefix}=${formattedVal}`);
      } else {
        obj.forEach((value, index) => {
          let key = prefix;
          if (arrayFormat === 'brackets') {
            key = `${prefix}[]`;
          } else if (arrayFormat === 'indices') {
            key = `${prefix}[${index}]`;
          }
          // repeat keeps the key exactly as prefix (key = prefix)

          parts.push(...stringifyToQuery(value, key));
        });
      }
      return parts;
    }

    // Object logic
    let keys = Object.keys(obj);
    if (sortKeys) {
      keys.sort();
    }

    keys.forEach(key => {
      // Prototype pollution mitigation
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') return;

      const val = obj[key];
      const partPrefix = prefix ? `${prefix}[${key}]` : key;
      parts.push(...stringifyToQuery(val, partPrefix));
    });

    return parts;
  }, [arrayFormat, sortKeys, urlEncode]);

  // Main conversion: JSON -> Query String
  const convertJSONToQuery = useCallback((jsonStr: string) => {
    if (!jsonStr.trim()) return '';
    try {
      const parsed = JSON.parse(jsonStr);
      if (typeof parsed !== 'object' || parsed === null) {
        throw new Error('Root must be an object or an array');
      }
      const queryParts = stringifyToQuery(parsed);
      return queryParts.join('&');
    } catch (e: any) {
      return `Error: ${e.message}`;
    }
  }, [stringifyToQuery]);

  // Safely parse Query String -> JSON
  const convertQueryToJSON = useCallback((queryStr: string): string => {
    const trimmed = queryStr.trim().replace(/^\?/, '');
    if (!trimmed) return '';

    try {
      // Prototype-pollution protected object
      const result = Object.create(null);

      const pairs = trimmed.split('&');
      for (const pair of pairs) {
        if (!pair) continue;
        const eqIdx = pair.indexOf('=');
        let key = eqIdx > -1 ? pair.slice(0, eqIdx) : pair;
        let value = eqIdx > -1 ? pair.slice(eqIdx + 1) : '';

        if (urlEncode) {
          try {
            key = decodeURIComponent(key);
            value = decodeURIComponent(value);
          } catch {
            // fallback if decode fails
          }
        }

        // Avoid prototype pollution keys
        if (key.includes('__proto__') || key.includes('constructor') || key.includes('prototype')) {
          continue;
        }

        // Simple query param assignment with support for path-like brackets: obj[a][b] or arr[]
        // We use a safe regex to tokenize keys: e.g. "a[b][c]" => ["a", "b", "c"]
        const pathKeys: string[] = [];
        const baseKeyMatch = key.match(/^[^[\]]+/);
        if (baseKeyMatch) {
          pathKeys.push(baseKeyMatch[0]);
        }
        const bracketMatches = key.matchAll(/\[([^[\]]*)]/g);
        for (const match of bracketMatches) {
          pathKeys.push(match[1]); // could be empty string for array suffix "[]"
        }

        if (pathKeys.length === 0) continue;

        let current = result;
        for (let i = 0; i < pathKeys.length; i++) {
          const pathKey = pathKeys[i];
          const isLast = i === pathKeys.length - 1;

          // Prevent prototype pollution check on inner keys
          if (pathKey === '__proto__' || pathKey === 'constructor' || pathKey === 'prototype') {
            break;
          }

          if (isLast) {
            if (pathKey === '') {
              // Array leaf "[]"
              if (!Array.isArray(current)) {
                // If current wasn't array, convert parent node? No, usually array leaf means the parent holds the array
              }
            } else {
              // Check if comma-separated values for arrays if we are in comma mode
              if (arrayFormat === 'comma' && value.includes(',')) {
                current[pathKey] = value.split(',');
              } else {
                if (current[pathKey] !== undefined) {
                  // If it already exists, turn it into array or push to it
                  if (Array.isArray(current[pathKey])) {
                    current[pathKey].push(value);
                  } else {
                    current[pathKey] = [current[pathKey], value];
                  }
                } else {
                  current[pathKey] = value;
                }
              }
            }
          } else {
            const nextKey = pathKeys[i + 1];
            if (current[pathKey] === undefined) {
              // If next key is empty string, it's an array leaf "[]"
              current[pathKey] = nextKey === '' ? [] : Object.create(null);
            }

            if (nextKey === '') {
              // Next is array index or array leaf
              if (!Array.isArray(current[pathKey])) {
                current[pathKey] = [];
              }
              current[pathKey].push(value);
              break; // finished since nextKey is leaf array
            } else {
              current[pathKey] = current[pathKey] || Object.create(null);
              current = current[pathKey];
            }
          }
        }
      }

      return JSON.stringify(result, null, 2);
    } catch (e: any) {
      return `Error: ${e.message}`;
    }
  }, [arrayFormat, urlEncode]);

  // Sync JSON text changes -> updates Query String
  const handleJSONChange = (val: string) => {
    if (val.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
      setJsonText(val);
      setQueryText('');
      return;
    }
    setError(null);
    setJsonText(val);
    const converted = convertJSONToQuery(val);
    if (!converted.startsWith('Error:')) {
      setQueryText(converted);
    } else {
      setQueryText('');
    }
  };

  // Sync Query text changes -> updates JSON
  const handleQueryChange = (val: string) => {
    if (val.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
      setQueryText(val);
      setJsonText('');
      return;
    }
    setError(null);
    setQueryText(val);
    const converted = convertQueryToJSON(val);
    if (!converted.startsWith('Error:')) {
      setJsonText(converted);
    } else {
      setJsonText('');
    }
  };

  // Trigger conversion again when configurations change
  useEffect(() => {
    if (jsonText && !jsonText.startsWith('Error:')) {
      const converted = convertJSONToQuery(jsonText);
      if (!converted.startsWith('Error:')) {
        setQueryText(converted);
      }
    }
  }, [arrayFormat, sortKeys, urlEncode, convertJSONToQuery, jsonText]);

  const handleClear = useCallback(() => {
    setJsonText('');
    setQueryText('');
    setError(null);
    jsonInputRef.current?.focus();
    toast.success(t('recent.cleared') || 'Cleared');
  }, [t]);

  const copyToClipboard = useCallback((val: string, type: 'json' | 'query') => {
    if (!val) return;
    navigator.clipboard.writeText(val);
    setCopied(type);
    toast.success(t('tool.link_copied') || 'Copied to clipboard');
    setTimeout(() => setCopied(null), 2000);
  }, [t]);

  const handlersRef = useRef({
    handleClear,
    copyToClipboard,
    jsonText,
    queryText
  });

  useEffect(() => {
    handlersRef.current = { handleClear, copyToClipboard, jsonText, queryText };
  }, [handleClear, copyToClipboard, jsonText, queryText]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isEditable =
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        document.activeElement?.tagName === "SELECT" ||
        document.activeElement?.getAttribute('contenteditable') === 'true';

      if (isEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        handlersRef.current.handleClear();
      } else if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        if (handlersRef.current.queryText) {
          handlersRef.current.copyToClipboard(handlersRef.current.queryText, 'query');
        } else if (handlersRef.current.jsonText) {
          handlersRef.current.copyToClipboard(handlersRef.current.jsonText, 'json');
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
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Configurations panel */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Array Format */}
        <div className="space-y-2">
          <label htmlFor="array-format" className="text-xs font-black uppercase tracking-widest text-slate-400 block">
            {t('jsontoquery.array_format') || 'Array Format'}
          </label>
          <select
            id="array-format"
            value={arrayFormat}
            onChange={(e) => setArrayFormat(e.target.value as any)}
            className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none"
          >
            <option value="brackets">Brackets (arr[])</option>
            <option value="indices">Indices (arr[0])</option>
            <option value="repeat">Repeat (arr=1&arr=2)</option>
            <option value="comma">Comma-separated (arr=1,2)</option>
          </select>
        </div>

        {/* Checkboxes */}
        <div className="flex flex-col justify-center space-y-3">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={sortKeys}
              onChange={(e) => setSortKeys(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-xs font-bold text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
              {t('jsonsortkeys.recursive') || 'Sort keys alphabetically'}
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={urlEncode}
              onChange={(e) => setUrlSafe(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-xs font-bold text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
              {t('jsontoquery.url_encode') || 'URL Encode Keys & Values'}
            </span>
          </label>
        </div>

        {/* Reset / Actions */}
        <div className="flex items-center justify-end gap-3">
          <Kbd modifier={null} className="hidden sm:inline-flex border-rose-200 dark:border-rose-800 text-rose-400">Esc</Kbd>
          <button
            onClick={handleClear}
            className="text-xs font-bold px-4 py-2.5 rounded-xl text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all flex items-center gap-1.5 border border-transparent focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
          >
            <Trash2 className="w-4 h-4" /> {t('common.clear') || 'Clear'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative">
        <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="bg-white dark:bg-slate-800 p-3 rounded-full shadow-xl border border-slate-200 dark:border-slate-700 text-indigo-600">
            <ArrowRightLeft className="w-6 h-6" />
          </div>
        </div>

        {/* JSON Input */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Braces className="w-4 h-4 text-indigo-500" />
              <label htmlFor="json-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('jsontosql.json_input') || 'JSON Input'}
              </label>
            </div>
            <button
              onClick={() => copyToClipboard(jsonText, 'json')}
              disabled={!jsonText}
              className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all flex items-center gap-1 border ${
                copied === 'json'
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                  : 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700'
              } disabled:opacity-50`}
            >
              {copied === 'json' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied === 'json' ? t('common.copied') : t('common.copy')}
            </button>
          </div>
          <textarea
            id="json-input"
            ref={jsonInputRef}
            value={jsonText}
            onChange={(e) => handleJSONChange(e.target.value)}
            placeholder='{\n  "name": "John",\n  "hobbies": ["sports", "music"]\n}'
            className="w-full h-80 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        {/* Query String Output */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-indigo-500" />
              <label htmlFor="query-output" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('jsontoquery.query_output') || 'Query String'}
              </label>
            </div>
            <button
              onClick={() => copyToClipboard(queryText, 'query')}
              disabled={!queryText}
              className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all flex items-center gap-1 border ${
                copied === 'query'
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                  : 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-slate-200 dark:border-slate-700 hover:border-indigo-500/50 shadow-sm'
              } disabled:opacity-50`}
            >
              {copied === 'query' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied === 'query' ? t('common.copied') : t('common.copy')}
              {copied !== 'query' && <Kbd modifier={null} className="ml-1 bg-white/50 dark:bg-black/20 border-slate-200 dark:border-slate-700">C</Kbd>}
            </button>
          </div>
          <textarea
            id="query-output"
            value={queryText}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="name=John&hobbies%5B%5D=sports&hobbies%5B%5D=music"
            className="w-full h-80 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed text-indigo-600 dark:text-indigo-400 break-all resize-none"
          />
        </div>
      </div>

      {/* Description / Information */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-4">
        <h4 className="font-bold text-slate-900 dark:text-white">{t('jsontoquery.about_title') || 'About JSON to Query String Converter'}</h4>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          {t('jsontoquery.about_text') || 'This bidirectional tool allows developers to quickly generate URL query strings from complex nested JSON objects or arrays, as well as reconstruct structured JSON objects from raw query strings. It provides extensive customization for array encoding styles, safe Prototype Pollution filtering, and fully offline processing.'}
        </p>
      </div>
    </div>
  );
}
