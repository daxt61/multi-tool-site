import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Braces, Copy, Check, Trash2, HelpCircle, AlertCircle, FileCode } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;
const MAX_DEPTH = 20;
const POLLUTE_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

// Case converters
function toCamelCase(str: string): string {
  const cleaned = str.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[^a-zA-Z0-9]+/g, ' ').trim();
  if (!cleaned) return '';
  return cleaned
    .toLowerCase()
    .split(' ')
    .map((word, i) => i === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

function toSnakeCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
}

function toPascalCase(str: string): string {
  const cleaned = str.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[^a-zA-Z0-9]+/g, ' ').trim();
  if (!cleaned) return '';
  return cleaned
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function toConstantCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase();
}

function toSentenceCase(str: string): string {
  const words = str
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .toLowerCase();
  if (!words) return '';
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function toTitleCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .toLowerCase()
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function toDotNotation(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1.$2')
    .replace(/[^a-zA-Z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '')
    .toLowerCase();
}

function convertKeys(obj: any, casing: string, depth = 0): any {
  if (depth > MAX_DEPTH) return obj;
  if (obj === null || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(item => convertKeys(item, casing, depth + 1));
  }

  const result = Object.create(null);
  for (const key of Object.keys(obj)) {
    if (POLLUTE_KEYS.has(key)) continue;

    let newKey = key;
    if (casing === 'camelCase') newKey = toCamelCase(key);
    else if (casing === 'snake_case') newKey = toSnakeCase(key);
    else if (casing === 'PascalCase') newKey = toPascalCase(key);
    else if (casing === 'kebab-case') newKey = toKebabCase(key);
    else if (casing === 'CONSTANT_CASE') newKey = toConstantCase(key);
    else if (casing === 'sentence') newKey = toSentenceCase(key);
    else if (casing === 'title') newKey = toTitleCase(key);
    else if (casing === 'dot') newKey = toDotNotation(key);

    if (POLLUTE_KEYS.has(newKey) || !newKey) {
      newKey = key || 'empty';
    }

    result[newKey] = convertKeys(obj[key], casing, depth + 1);
  }
  return result;
}

export function JSONCasingConverter({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [inputJSON, setInputJSON] = useState(initialData?.inputJSON || '{\n  "first_name": "John",\n  "LastName": "Doe",\n  "company-details": {\n    "OFFICE_LOCATIONS": ["Paris", "New York"],\n    "year.founded": 2021\n  }\n}');
  const [casing, setCasing] = useState<string>(initialData?.casing || 'camelCase');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Convert on input/casing changes
  const outputJSON = useMemo(() => {
    if (!inputJSON.trim()) {
      setError(null);
      return '';
    }

    if (inputJSON.length > MAX_LENGTH) {
      setError(t('jsoncasing.error_max_length', { max: MAX_LENGTH }) || `JSON is too large (maximum ${MAX_LENGTH} characters).`);
      return '';
    }

    try {
      const parsed = JSON.parse(inputJSON);
      setError(null);
      const converted = convertKeys(parsed, casing);
      return JSON.stringify(converted, null, 2);
    } catch (e: any) {
      setError(t('jsoncasing.error_invalid_json') || `Invalid JSON syntax: ${e.message}`);
      return '';
    }
  }, [inputJSON, casing, t]);

  useEffect(() => {
    onStateChange?.({ inputJSON, casing });
  }, [inputJSON, casing]);

  const handleCopy = useCallback(() => {
    if (!outputJSON) return;
    navigator.clipboard.writeText(outputJSON);
    setCopied(true);
    toast.success(t('jsoncasing.toast_copied') || 'Converted JSON copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  }, [outputJSON, t]);

  const handleClear = useCallback(() => {
    setInputJSON('');
    setError(null);
    toast.success(t('jsoncasing.toast_cleared') || 'Cleared!');
    textareaRef.current?.focus();
  }, [t]);

  const handlersRef = useRef({ onClear: handleClear, onCopy: handleCopy });
  useEffect(() => {
    handlersRef.current = { onClear: handleClear, onCopy: handleCopy };
  }, [handleClear, handleCopy]);

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
        handlersRef.current.onClear();
      } else if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handlersRef.current.onCopy();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const presets = [
    { name: 'User Profile', value: '{\n  "user-info": {\n    "first_name": "Jane",\n    "LastName": "Smith",\n    "email_address": "jane@example.com"\n  },\n  "ROLE_LIST": ["admin", "editor"]\n}' },
    { name: 'SaaS Config', value: '{\n  "database.config": {\n    "HOST_NAME": "localhost",\n    "PORT-NUMBER": 5432,\n    "MAX-CONNECTIONS_POOL": 20\n  }\n}' }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8" role="region" aria-label={t('jsoncasing.title') || "JSON Key Case Converter"}>
      {/* Top action header */}
      <div className="flex justify-end gap-3 px-1 items-center">
        <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
          <Kbd modifier={null} className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400">Esc</Kbd>
          {t('common.clear') || 'Clear'}
        </span>
        <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400 mr-2">
          <Kbd modifier={null} className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400">C</Kbd>
          {t('common.copy') || 'Copy'}
        </span>
        <button
          onClick={handleClear}
          disabled={!inputJSON}
          className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
        >
          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" /> {t('common.clear') || 'Clear'}
        </button>
      </div>

      {/* Target casing options */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {[
          { id: 'camelCase', label: 'camelCase' },
          { id: 'snake_case', label: 'snake_case' },
          { id: 'PascalCase', label: 'PascalCase' },
          { id: 'kebab-case', label: 'kebab-case' },
          { id: 'CONSTANT_CASE', label: 'CONST_CASE' },
          { id: 'sentence', label: 'Sentence' },
          { id: 'title', label: 'Title Case' },
          { id: 'dot', label: 'dot.notation' }
        ].map(opt => (
          <button
            key={opt.id}
            onClick={() => setCasing(opt.id)}
            className={`py-3 px-2 rounded-2xl text-xs font-bold border transition-all ${
              casing === opt.id
                ? 'bg-indigo-600 text-white border-transparent shadow-md shadow-indigo-600/10'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-500'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Main textareas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Braces className="w-4 h-4 text-indigo-500" />
              <label htmlFor="json-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('jsoncasing.input_label') || "Raw JSON Input"}
              </label>
            </div>
            <div className="flex gap-2">
              {presets.map(p => (
                <button
                  key={p.name}
                  onClick={() => setInputJSON(p.value)}
                  className="text-[10px] font-bold text-indigo-500 hover:text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded"
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
          <textarea
            id="json-input"
            ref={textareaRef}
            value={inputJSON}
            onChange={(e) => setInputJSON(e.target.value)}
            placeholder='{"some_key": "value"}'
            className="w-full h-96 p-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl font-mono text-sm dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
            spellCheck="false"
          />
        </div>

        {/* Output */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-indigo-500" />
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                {t('jsoncasing.output_label') || "Converted JSON Output"}
              </span>
            </div>
            {outputJSON && (
              <button
                onClick={handleCopy}
                className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all border ${
                  copied
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                    : 'bg-indigo-600 text-white border-transparent hover:bg-indigo-700'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? t('common.copied') || 'Copied' : t('common.copy') || 'Copy'}
              </button>
            )}
          </div>
          <div className="relative">
            <textarea
              readOnly
              value={outputJSON}
              placeholder={error ? '' : (t('jsoncasing.output_placeholder') || "Converted JSON will appear here...")}
              className="w-full h-96 p-5 bg-slate-950 text-indigo-300 border border-slate-800 rounded-3xl font-mono text-sm outline-none cursor-default"
              spellCheck="false"
            />
            {error && (
              <div className="absolute inset-0 bg-slate-950/90 rounded-3xl p-6 flex flex-col justify-center items-center text-center space-y-4">
                <AlertCircle className="w-12 h-12 text-rose-500" />
                <p className="text-rose-400 font-bold max-w-md text-sm">{error}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info section */}
      <div className="bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-900/20 p-8 rounded-[2.5rem] flex gap-4">
        <div className="shrink-0 w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center text-amber-600" aria-hidden="true">
          <HelpCircle className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h5 className="font-bold text-amber-900 dark:text-amber-100">
            {t('jsoncasing.how_title') || "How does it work?"}
          </h5>
          <p className="text-sm text-amber-700 dark:text-amber-300 leading-relaxed">
            {t('jsoncasing.how_text') || "Paste any valid JSON in the left panel, then choose your target key casing. The tool will recursively map over all keys and apply the transformation, while keeping values intact. Built-in prototype pollution prevention ignores special fields such as __proto__ to keep your environment secure."}
          </p>
        </div>
      </div>
    </div>
  );
}
