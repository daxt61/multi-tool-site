import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as LinkIcon, Plus, Trash2, Copy, Check, ArrowRight, AlertCircle, RefreshCw, Layers, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';
import { getSecureRandomInt } from './ui/crypto';

const MAX_LENGTH = 100000;

interface QueryParam {
  id: string;
  key: string;
  value: string;
}

export function UrlQueryModifier({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [urlInput, setUrlInput] = useState(initialData?.urlInput || 'https://api.example.com/v1/search?q=developer+tools&category=dev&sort=rating&limit=10');
  const [baseUrl, setBaseUrl] = useState('');
  const [params, setParams] = useState<QueryParam[]>([]);
  const [bulkText, setBulkText] = useState('');
  const [bulkMode, setBulkMode] = useState(false);
  const [urlEncode, setUrlEncode] = useState(true);
  const [copied, setCopied] = useState<'url' | 'query' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const urlInputRef = useRef<HTMLInputElement>(null);

  // Sync state with parent container if state changes
  useEffect(() => {
    onStateChange?.({ urlInput, baseUrl, params, bulkText, bulkMode, urlEncode });
  }, [urlInput, baseUrl, params, bulkText, bulkMode, urlEncode, onStateChange]);

  // Safely parse URL input into base and query parameters
  const parseUrl = useCallback((input: string) => {
    if (!input.trim()) {
      setBaseUrl('');
      setParams([]);
      return;
    }

    if (input.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
      return;
    }
    setError(null);

    let resolvedUrl = input.trim();
    let queryStr = '';
    let base = '';

    // Handle relative paths or raw query strings
    try {
      if (resolvedUrl.startsWith('?') || resolvedUrl.startsWith('/') || !resolvedUrl.includes('://')) {
        const dummyBase = 'https://localhost';
        const urlObj = new URL(resolvedUrl.startsWith('?') ? dummyBase + resolvedUrl : dummyBase + '/' + resolvedUrl);
        base = input.split('?')[0];
        queryStr = urlObj.search;
      } else {
        const urlObj = new URL(resolvedUrl);
        base = urlObj.origin + urlObj.pathname;
        queryStr = urlObj.search;
      }

      setBaseUrl(base);

      const searchParams = new URLSearchParams(queryStr);
      const parsedParams: QueryParam[] = [];
      let index = 0;
      searchParams.forEach((val, key) => {
        parsedParams.push({
          id: `${Date.now()}-${index++}`,
          key,
          value: val,
        });
      });
      setParams(parsedParams);
    } catch (e: any) {
      // Fallback manual parsing if URL constructor fails
      const qIdx = resolvedUrl.indexOf('?');
      if (qIdx > -1) {
        base = resolvedUrl.slice(0, qIdx);
        queryStr = resolvedUrl.slice(qIdx + 1);
        setBaseUrl(base);

        const parts = queryStr.split('&');
        const parsedParams: QueryParam[] = [];
        parts.forEach((part, index) => {
          if (!part) return;
          const eqIdx = part.indexOf('=');
          const k = eqIdx > -1 ? part.slice(0, eqIdx) : part;
          const v = eqIdx > -1 ? part.slice(eqIdx + 1) : '';
          try {
            parsedParams.push({
              id: `${Date.now()}-${index}`,
              key: decodeURIComponent(k),
              value: decodeURIComponent(v),
            });
          } catch {
            parsedParams.push({
              id: `${Date.now()}-${index}`,
              key: k,
              value: v,
            });
          }
        });
        setParams(parsedParams);
      } else {
        setBaseUrl(resolvedUrl);
        setParams([]);
      }
    }
  }, [t]);

  // Initialize input
  useEffect(() => {
    parseUrl(urlInput);
  }, []);

  // Compute final generated URL and query string
  const computedOutputs = React.useMemo(() => {
    const searchParams = new URLSearchParams();
    params.forEach(p => {
      if (p.key.trim()) {
        searchParams.append(p.key, p.value);
      }
    });

    const queryString = searchParams.toString();
    const decodedQueryString = params
      .filter(p => p.key.trim())
      .map(p => `${p.key}=${p.value}`)
      .join('&');

    let finalizedUrl = baseUrl;
    const separator = baseUrl.includes('?') ? '&' : '?';

    const currentQuery = urlEncode ? queryString : decodedQueryString;
    if (currentQuery) {
      finalizedUrl = `${baseUrl}${separator}${currentQuery}`;
    }

    return {
      finalizedUrl,
      queryString: currentQuery ? `?${currentQuery}` : '',
    };
  }, [baseUrl, params, urlEncode]);

  // Handle URL key updates
  const updateParamKey = (id: string, newKey: string) => {
    setParams(prev => prev.map(p => p.id === id ? { ...p, key: newKey } : p));
  };

  // Handle URL value updates
  const updateParamValue = (id: string, newVal: string) => {
    setParams(prev => prev.map(p => p.id === id ? { ...p, value: newVal } : p));
  };

  // Delete specific parameter
  const deleteParam = (id: string) => {
    setParams(prev => prev.filter(p => p.id !== id));
    toast.success(t('query_modifier.param_deleted', { defaultValue: 'Parameter deleted' }));
  };

  // Add new parameter row
  const addParam = () => {
    setParams(prev => [...prev, { id: `${Date.now()}-${getSecureRandomInt(1000000)}`, key: '', value: '' }]);
    toast.success(t('query_modifier.param_added', { defaultValue: 'Parameter added' }));
  };

  // Bulk Edit toggle and load
  const loadBulkText = () => {
    const lines = bulkText.split('\n');
    const parsedParams: QueryParam[] = [];
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      const eqIdx = trimmed.indexOf('=');
      const k = eqIdx > -1 ? trimmed.slice(0, eqIdx) : trimmed;
      const v = eqIdx > -1 ? trimmed.slice(eqIdx + 1) : '';
      parsedParams.push({
        id: `${Date.now()}-${index}`,
        key: k.trim(),
        value: v.trim()
      });
    });
    setParams(parsedParams);
    setBulkMode(false);
    toast.success(t('query_modifier.bulk_applied', { defaultValue: 'Bulk configuration applied' }));
  };

  // Switch to bulk editor, pre-populating with current state
  const openBulkMode = () => {
    const text = params.map(p => `${p.key}=${p.value}`).join('\n');
    setBulkText(text);
    setBulkMode(true);
  };

  // Reset or clear inputs
  const handleClear = useCallback(() => {
    setUrlInput('');
    setBaseUrl('');
    setParams([]);
    setBulkText('');
    setBulkMode(false);
    setError(null);
    urlInputRef.current?.focus();
    toast.success(t('recent.cleared') || 'Cleared');
  }, [t]);

  const copyToClipboard = useCallback((val: string, type: 'url' | 'query') => {
    if (!val) return;
    navigator.clipboard.writeText(val);
    setCopied(type);
    toast.success(t('tool.link_copied') || 'Copied to clipboard');
    setTimeout(() => setCopied(null), 2000);
  }, [t]);

  // Global keypress handlers
  const handlersRef = useRef({
    handleClear,
    copyToClipboard,
    finalizedUrl: computedOutputs.finalizedUrl,
  });

  useEffect(() => {
    handlersRef.current = {
      handleClear,
      copyToClipboard,
      finalizedUrl: computedOutputs.finalizedUrl,
    };
  }, [handleClear, copyToClipboard, computedOutputs.finalizedUrl]);

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
        if (handlersRef.current.finalizedUrl) {
          handlersRef.current.copyToClipboard(handlersRef.current.finalizedUrl, 'url');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8" role="region" aria-label={t('tool.url-query-modifier.name', { defaultValue: 'URL Query Builder' })}>
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Main input URL */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <LinkIcon className="w-5 h-5 text-indigo-500" />
            <label htmlFor="url-input" className="text-sm font-black uppercase tracking-widest text-slate-400">
              {t('query_modifier.input_label', { defaultValue: 'Input URL or Query String' })}
            </label>
          </div>
          <div className="flex items-center gap-3">
            <Kbd modifier={null} className="hidden sm:inline-flex border-slate-200 dark:border-slate-700 text-slate-400">Esc</Kbd>
            <button
              onClick={handleClear}
              className="text-xs font-bold px-3 py-2 rounded-xl text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
            >
              <Trash2 className="w-4 h-4" /> {t('common.clear')}
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          <input
            id="url-input"
            ref={urlInputRef}
            type="text"
            value={urlInput}
            onChange={(e) => {
              setUrlInput(e.target.value);
              parseUrl(e.target.value);
            }}
            placeholder="https://api.example.com/search?q=developer"
            className="flex-1 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm dark:text-white"
          />
          <button
            onClick={() => parseUrl(urlInput)}
            className="px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold transition-all active:scale-95 flex items-center gap-2"
            title={t('query_modifier.reparse', { defaultValue: 'Reparse input URL' })}
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">{t('query_modifier.parse', { defaultValue: 'Parse' })}</span>
          </button>
        </div>
      </div>

      {/* Editor Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Dynamic parameter lists */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">
              {t('query_modifier.parameters', { defaultValue: 'Query Parameters' })} ({params.length})
            </h3>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (bulkMode) {
                    setBulkMode(false);
                  } else {
                    openBulkMode();
                  }
                }}
                className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all flex items-center gap-1 ${
                  bulkMode
                    ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-indigo-200'
                    : 'text-slate-500 bg-slate-50 border-slate-200 hover:border-slate-300 dark:bg-slate-900 dark:border-slate-800'
                }`}
              >
                <Edit className="w-3.5 h-3.5" />
                {bulkMode ? t('query_modifier.normal_mode', { defaultValue: 'Visual Mode' }) : t('query_modifier.bulk_mode', { defaultValue: 'Bulk Edit' })}
              </button>
              {!bulkMode && (
                <button
                  onClick={addParam}
                  className="text-xs font-bold px-3 py-1.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white transition-all flex items-center gap-1 active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {t('common.add')}
                </button>
              )}
            </div>
          </div>

          {bulkMode ? (
            <div className="space-y-4 animate-in fade-in duration-300">
              <textarea
                id="bulk-textarea"
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder="key1=value1&#10;key2=value2"
                className="w-full h-80 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300"
              />
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setBulkMode(false)}
                  className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  {t('common.reset')}
                </button>
                <button
                  onClick={loadBulkText}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all"
                >
                  {t('query_modifier.apply_changes', { defaultValue: 'Apply Changes' })}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 no-scrollbar">
              {params.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/30 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                  <p className="text-sm text-slate-400 italic">
                    {t('query_modifier.empty_params', { defaultValue: 'No query parameters found. Add some or parse a URL.' })}
                  </p>
                </div>
              ) : (
                params.map((p, idx) => (
                  <div key={p.id} className="flex gap-2 items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-2xl animate-in fade-in duration-200">
                    <span className="text-xs font-mono font-bold text-slate-400 w-6 text-center">#{idx + 1}</span>
                    <input
                      type="text"
                      value={p.key}
                      onChange={(e) => updateParamKey(p.id, e.target.value)}
                      placeholder="key"
                      aria-label={`Param key ${idx + 1}`}
                      className="flex-1 min-w-0 p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-mono text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-white"
                    />
                    <span className="text-slate-400 font-mono">=</span>
                    <input
                      type="text"
                      value={p.value}
                      onChange={(e) => updateParamValue(p.id, e.target.value)}
                      placeholder="value"
                      aria-label={`Param value ${idx + 1}`}
                      className="flex-1 min-w-0 p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-mono text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-white"
                    />
                    <button
                      onClick={() => deleteParam(p.id)}
                      className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all"
                      title={t('common.remove')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Configuration settings sidebar */}
        <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6 h-fit">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">
            {t('common.options')}
          </h3>

          <div className="space-y-4">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={urlEncode}
                onChange={(e) => setUrlEncode(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-xs font-bold text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
                {t('jsontoquery.url_encode', { defaultValue: 'URL Encode Keys & Values' })}
              </span>
            </label>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block px-1">
              {t('query_modifier.base_url', { defaultValue: 'Base URL' })}
            </span>
            <div className="p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl font-mono text-xs truncate dark:text-slate-300">
              {baseUrl || t('common.na')}
            </div>
          </div>
        </div>
      </div>

      {/* Result Generation Outputs */}
      <div className="bg-slate-900 dark:bg-black p-8 md:p-12 rounded-[2.5rem] shadow-xl shadow-indigo-500/10 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-500/10 text-indigo-400 rounded-full text-xs font-black uppercase tracking-widest border border-indigo-500/20">
            <Layers className="w-3.5 h-3.5" />
            {t('query_modifier.final_result', { defaultValue: 'Output Result' })}
          </div>
          <div className="flex items-center gap-3">
            <Kbd modifier={null} className="hidden sm:inline-flex border-slate-700 text-slate-400">C</Kbd>
            <button
              onClick={() => copyToClipboard(computedOutputs.finalizedUrl, 'url')}
              disabled={!computedOutputs.finalizedUrl}
              className={`text-xs font-bold px-4 py-2.5 rounded-2xl transition-all flex items-center gap-1.5 border ${
                copied === 'url'
                  ? 'bg-emerald-500 text-white border-transparent'
                  : 'bg-white hover:bg-slate-100 text-slate-900 border-transparent'
              } disabled:opacity-50`}
            >
              {copied === 'url' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied === 'url' ? t('common.copied') : t('query_modifier.copy_full', { defaultValue: 'Copy Updated URL' })}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {/* Main finished URL */}
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              {t('query_modifier.full_url', { defaultValue: 'Full URL' })}
            </span>
            <div className="p-5 bg-slate-950/50 rounded-2xl border border-slate-800 font-mono text-sm text-indigo-300 break-all select-all">
              {computedOutputs.finalizedUrl || '...'}
            </div>
          </div>

          {/* Just query string */}
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              {t('jsontoquery.query_output', { defaultValue: 'Query String' })}
            </span>
            <div className="p-5 bg-slate-950/50 rounded-2xl border border-slate-800 font-mono text-sm text-slate-300 break-all select-all">
              {computedOutputs.queryString || '...'}
            </div>
          </div>
        </div>
      </div>

      {/* Info panel */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-4">
        <h4 className="font-bold text-slate-900 dark:text-white">{t('query_modifier.about_title', { defaultValue: 'About URL Query Builder' })}</h4>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          {t('query_modifier.about_text', { defaultValue: 'This interactive tool allows developers, testers, and digital marketers to parse and rebuild URL query string structures with absolute ease. You can modify parameters, add keys/values on the fly, decode dynamic parameters, or perform bulk changes in standard key=value format. All evaluations are fully client-side protecting your absolute privacy.' })}
        </p>
      </div>
    </div>
  );
}
