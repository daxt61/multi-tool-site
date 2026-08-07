import { useState, useEffect, useRef, useCallback } from 'react';
import { FileCode, Search, Copy, Check, Trash2, AlertCircle, Terminal, Download, Info, Sparkles } from 'lucide-react';
import { JSONPath } from 'jsonpath-plus';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;

export function JSONPathTester({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [jsonInput, setJsonInput] = useState(initialData?.jsonInput || '');
  const [pathInput, setPathInput] = useState(initialData?.pathInput || '$');
  const [output, setOutput] = useState(initialData?.output || '');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const jsonInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    onStateChange?.({ jsonInput, pathInput, output });
  }, [jsonInput, pathInput, output]);

  const handleTest = () => {
    try {
      setError('');
      if (!jsonInput.trim()) {
        setOutput('');
        return;
      }
      if (jsonInput.length > MAX_LENGTH) {
        setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
        return;
      }

      const parsed = JSON.parse(jsonInput);
      const result = JSONPath({
        path: pathInput,
        json: parsed,
        wrap: false,
        // Sentinel: Disable eval to prevent arbitrary code execution via JSONPath filter expressions
        eval: false
      });

      setOutput(JSON.stringify(result, null, 2));
    } catch (e: any) {
      setError(t('error.invalid_json') + ' : ' + e.message);
      setOutput('');
    }
  };

  useEffect(() => {
    if (jsonInput.trim() && pathInput.trim()) {
      handleTest();
    } else if (!jsonInput.trim()) {
      setOutput('');
    }
  }, [jsonInput, pathInput]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success(t('jsonpath.copied_toast') || 'Result copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  }, [output, t]);

  const handleClear = useCallback(() => {
    setJsonInput('');
    setPathInput('$');
    setOutput('');
    setError('');
    toast.success(t('jsonpath.cleared_toast') || 'Inputs cleared!');
    jsonInputRef.current?.focus();
  }, [t]);

  // Use local useRef-backed handlersRef keyboard shortcuts to avoid stale closures
  const handlersRef = useRef({
    onCopy: handleCopy,
    onClear: handleClear,
  });

  useEffect(() => {
    handlersRef.current = {
      onCopy: handleCopy,
      onClear: handleClear,
    };
  }, [handleCopy, handleClear]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isEditable = activeEl && (
        activeEl.tagName === 'INPUT' ||
        activeEl.tagName === 'TEXTAREA' ||
        activeEl.tagName === 'SELECT' ||
        activeEl.getAttribute('contenteditable') === 'true'
      );

      if (isEditable) {
        if (e.key === 'Escape') {
          e.preventDefault();
          handlersRef.current.onClear();
        }
        return;
      }

      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        handlersRef.current.onClear();
      } else if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handlersRef.current.onCopy();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'result.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const presets = [
    {
      name: t('jsonpath.preset_store') || 'E-Commerce Store',
      json: JSON.stringify({
        store: {
          book: [
            { category: "reference", author: "Nigel Rees", title: "Sayings of the Century", price: 8.95 },
            { category: "fiction", author: "Evelyn Waugh", title: "Sword of Honour", price: 12.99 },
            { category: "fiction", author: "Herman Melville", title: "Moby Dick", isbn: "0-553-21311-3", price: 8.99 },
            { category: "fiction", author: "J. R. R. Tolkien", title: "The Lord of the Rings", isbn: "0-395-19395-8", price: 22.99 }
          ],
          bicycle: { color: "red", price: 19.95 }
        }
      }, null, 2),
      path: '$.store.book[*].author'
    },
    {
      name: t('jsonpath.preset_users') || 'User Directory',
      json: JSON.stringify([
        { id: 1, name: "Alice Smith", role: "Admin", active: true, contact: { email: "alice@example.com" } },
        { id: 2, name: "Bob Jones", role: "User", active: false, contact: { email: "bob@example.com" } },
        { id: 3, name: "Charlie Brown", role: "User", active: true, contact: { email: "charlie@example.com" } }
      ], null, 2),
      path: '$[*].contact.email'
    }
  ];

  const applyPreset = (json: string, path: string) => {
    setJsonInput(json);
    setPathInput(path);
    toast.success(t('jsonpath.preset_loaded') || 'Preset applied successfully!');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8" role="region" aria-label={t('tool.json-path.name')}>
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="flex justify-end gap-3 px-1 items-center">
        <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
          <Kbd modifier={null} className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400">Esc</Kbd>
          {t('common.clear')}
        </span>
        <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400 mr-2">
          <Kbd modifier={null} className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400">C</Kbd>
          {t('common.copy')}
        </span>
        <button
          onClick={handleClear}
          disabled={!jsonInput && output === ''}
          className="text-xs font-bold px-3 py-1.5 rounded-xl text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
        >
          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" /> {t('common.clear')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-indigo-500" />
              <label htmlFor="json-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">{t('jsonpath.json_data')}</label>
            </div>
          </div>
          <textarea
            id="json-input"
            ref={jsonInputRef}
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder='{"store": {"book": [{"title": "Sayings of the Century", "price": 8.95}]}}'
            className="w-full h-[350px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />

          <div className="space-y-2">
            <div className="flex items-center gap-2 px-1">
              <Search className="w-4 h-4 text-indigo-500" />
              <label htmlFor="path-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">{t('jsonpath.expression')}</label>
            </div>
            <input
              id="path-input"
              type="text"
              value={pathInput}
              onChange={(e) => setPathInput(e.target.value)}
              placeholder="$.store.book[*].author"
              className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm dark:text-slate-300"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-500" />
              <label htmlFor="result-output" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">{t('jsonpath.result')}</label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                disabled={!output}
                className="text-xs font-bold px-3 py-1 rounded-full text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 transition-all flex items-center gap-1 disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleCopy}
                disabled={!output}
                className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                  copied
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                    : 'text-slate-500 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {copied ? <Check className="w-3.5 h-3.5" aria-hidden="true" /> : <Copy className="w-3.5 h-3.5" aria-hidden="true" />} {copied ? t('common.copied') : t('common.copy')}
              </button>
            </div>
          </div>
          <textarea
            id="result-output"
            value={output}
            readOnly
            placeholder={t('jsonpath.placeholder_result')}
            className="w-full h-[450px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-mono text-sm leading-relaxed text-indigo-600 dark:text-indigo-400 resize-none"
          />
        </div>
      </div>

      <div className="space-y-4" role="group" aria-labelledby="jsonpath-presets-heading">
        <h4 id="jsonpath-presets-heading" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> {t('jsonpath.presets_title') || 'Quick Presets'}
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {presets.map((preset, index) => (
            <button
              key={index}
              onClick={() => applyPreset(preset.json, preset.path)}
              className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-left hover:border-indigo-500/50 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-all group focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
            >
              <div className="font-bold text-sm mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{preset.name}</div>
              <div className="font-mono text-xs text-slate-400 truncate">{preset.path}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500">
            <Info className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-slate-900 dark:text-white">{t('jsonpath.guide_title')}</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <h5 className="text-sm font-bold text-slate-700 dark:text-slate-300">{t('jsonpath.operators')}</h5>
            <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
              <li><code className="text-indigo-500 font-bold">$</code> : {t('jsonpath.root')}</li>
              <li><code className="text-indigo-500 font-bold">@</code> : {t('jsonpath.current')}</li>
              <li><code className="text-indigo-500 font-bold">.</code> ou <code className="text-indigo-500 font-bold">[]</code> : {t('jsonpath.child')}</li>
              <li><code className="text-indigo-500 font-bold">..</code> : {t('jsonpath.deep')}</li>
              <li><code className="text-indigo-500 font-bold">*</code> : {t('jsonpath.wildcard')}</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h5 className="text-sm font-bold text-slate-700 dark:text-slate-300">{t('jsonpath.examples')}</h5>
            <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
              <li><code className="text-indigo-500 font-bold">$.store.book[*].author</code> : {t('jsonpath.example_authors')}</li>
              <li><code className="text-indigo-500 font-bold">$..author</code> : {t('jsonpath.example_all_authors')}</li>
              <li><code className="text-indigo-500 font-bold">$.store..price</code> : {t('jsonpath.example_prices')}</li>
              <li><code className="text-indigo-500 font-bold">$..book[?(@.price &lt; 10)]</code> : {t('jsonpath.example_filter')}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
