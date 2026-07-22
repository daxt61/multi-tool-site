import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Copy, Check, Trash2, Braces, FileCode, Info, AlertCircle, Download, Settings, ShieldAlert, ListFilter } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;
const MAX_DEPTH = 20;

const DRAFT_URLS: Record<string, string> = {
  'Draft-07': 'http://json-schema.org/draft-07/schema#',
  'Draft-04': 'http://json-schema.org/draft-04/schema#',
  'Draft-06': 'http://json-schema.org/draft-06/schema#',
  'Draft 2019-09': 'https://json-schema.org/draft/2019-09/schema',
  'Draft 2020-12': 'https://json-schema.org/draft/2020-12/schema',
};

const sanitizeKey = (key: string): string => {
  if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
    return '_' + key;
  }
  return key;
};

export function JSONSchemaGenerator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();

  const [jsonInput, setJsonInput] = useState(initialData?.jsonInput || '');
  const [draftVersion, setDraftVersion] = useState<string>(initialData?.draftVersion || 'Draft-07');
  const [requiredMode, setRequiredMode] = useState<'auto' | 'optional'>(initialData?.requiredMode || 'auto');
  const [additionalProperties, setAdditionalProperties] = useState<boolean>(initialData?.additionalProperties ?? true);
  const [includeDefaults, setIncludeDefaults] = useState<boolean>(initialData?.includeDefaults ?? false);
  const [includeExamples, setIncludeExamples] = useState<boolean>(initialData?.includeExamples ?? false);

  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    onStateChange?.({
      jsonInput,
      draftVersion,
      requiredMode,
      additionalProperties,
      includeDefaults,
      includeExamples,
    });
  }, [jsonInput, draftVersion, requiredMode, additionalProperties, includeDefaults, includeExamples, onStateChange]);

  const generateSchema = useCallback((obj: any, depth: number = 0): any => {
    if (depth > MAX_DEPTH) {
      return { type: 'object', description: 'Maximum depth reached' };
    }

    if (obj === null) {
      return { type: 'null' };
    }

    const type = typeof obj;

    if (Array.isArray(obj)) {
      const items = obj.length > 0 ? generateSchema(obj[0], depth + 1) : {};
      const schema: any = {
        type: 'array',
        items,
      };
      if (includeDefaults) {
        schema.default = [];
      }
      if (includeExamples && obj.length > 0) {
        schema.examples = [obj];
      }
      return schema;
    }

    if (type === 'object') {
      const properties: any = Object.create(null);
      const required: string[] = [];

      Object.entries(obj).forEach(([rawKey, value]) => {
        const key = sanitizeKey(rawKey);
        properties[key] = generateSchema(value, depth + 1);
        if (requiredMode === 'auto') {
          required.push(key);
        }
      });

      const schema: any = {
        type: 'object',
        properties,
      };

      if (required.length > 0) {
        schema.required = required;
      }

      if (!additionalProperties) {
        schema.additionalProperties = false;
      }

      if (includeDefaults) {
        schema.default = {};
      }

      if (includeExamples) {
        schema.examples = [obj];
      }

      return schema;
    }

    const schema: any = { type };

    if (type === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(obj)) {
      schema.format = 'date-time';
    }

    if (includeDefaults) {
      if (type === 'string') schema.default = '';
      else if (type === 'number') schema.default = 0;
      else if (type === 'boolean') schema.default = false;
    }

    if (includeExamples) {
      schema.examples = [obj];
    }

    return schema;
  }, [requiredMode, additionalProperties, includeDefaults, includeExamples]);

  const schemaResult = useMemo(() => {
    if (!jsonInput.trim()) {
      return '';
    }

    try {
      if (jsonInput.length > MAX_LENGTH) {
        setError(t('jsonschema.error_length', { max: MAX_LENGTH.toLocaleString() }));
        return '';
      }
      const parsed = JSON.parse(jsonInput);
      setError(null);
      const schema = {
        $schema: DRAFT_URLS[draftVersion] || DRAFT_URLS['Draft-07'],
        title: "Generated Schema",
        ...generateSchema(parsed, 0)
      };
      return JSON.stringify(schema, null, 2);
    } catch (e: any) {
      setError(e.message);
      return '';
    }
  }, [jsonInput, draftVersion, generateSchema, t]);

  const handleCopy = useCallback(() => {
    if (!schemaResult) return;
    navigator.clipboard.writeText(schemaResult);
    setCopied(true);
    toast.success(t('jsonschema.copied'));
    setTimeout(() => setCopied(false), 2000);
  }, [schemaResult, t]);

  const handleClear = useCallback(() => {
    setJsonInput('');
    setError(null);
    setTimeout(() => textareaRef.current?.focus(), 0);
  }, []);

  const handleDownload = () => {
    if (!schemaResult) return;
    const blob = new Blob([schemaResult], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'schema.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Setup keyboard shortcuts securely with useRef-backed handlers
  const handlersRef = useRef({ handleCopy, handleClear });
  useEffect(() => {
    handlersRef.current = { handleCopy, handleClear };
  }, [handleCopy, handleClear]);

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
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Configuration Card */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-6">
        <div className="flex items-center gap-2 px-1">
          <Settings className="w-4 h-4 text-indigo-500" />
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">
            {t('jsonschema.options_title')}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Draft version selection */}
          <div className="space-y-2">
            <label htmlFor="draft-version" className="text-xs font-bold text-slate-500 px-1">
              {t('jsonschema.draft_version')}
            </label>
            <select
              id="draft-version"
              value={draftVersion}
              onChange={(e) => setDraftVersion(e.target.value)}
              className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold text-sm text-slate-700 dark:text-slate-200"
            >
              {Object.keys(DRAFT_URLS).map((ver) => (
                <option key={ver} value={ver}>
                  {ver}
                </option>
              ))}
            </select>
          </div>

          {/* Required Fields Mode */}
          <div className="space-y-2">
            <label htmlFor="required-mode" className="text-xs font-bold text-slate-500 px-1">
              {t('jsonschema.required_mode')}
            </label>
            <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                id="required-mode-auto"
                type="button"
                onClick={() => setRequiredMode('auto')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${requiredMode === 'auto' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                {t('jsonschema.req_auto')}
              </button>
              <button
                id="required-mode-optional"
                type="button"
                onClick={() => setRequiredMode('optional')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${requiredMode === 'optional' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                {t('jsonschema.req_optional')}
              </button>
            </div>
          </div>
        </div>

        {/* Boolean Option Toggles */}
        <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setAdditionalProperties(!additionalProperties)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
              additionalProperties
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'bg-white dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {additionalProperties ? <Check className="w-4 h-4 inline mr-1" /> : null} {t('jsonschema.additional_properties')}
          </button>
          <button
            type="button"
            onClick={() => setIncludeDefaults(!includeDefaults)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
              includeDefaults
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'bg-white dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {includeDefaults ? <Check className="w-4 h-4 inline mr-1" /> : null} {t('jsonschema.include_defaults')}
          </button>
          <button
            type="button"
            onClick={() => setIncludeExamples(!includeExamples)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
              includeExamples
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'bg-white dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {includeExamples ? <Check className="w-4 h-4 inline mr-1" /> : null} {t('jsonschema.include_examples')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Column */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="json-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 cursor-pointer">
              <Braces className="w-4 h-4 text-indigo-500" /> {t('jsonschema.input_label')}
            </label>
            <div className="flex gap-2 items-center">
              <Kbd modifier={null} className="hidden sm:inline-flex border-rose-200 dark:border-rose-800 text-rose-400 dark:bg-slate-900">Esc</Kbd>
              <button
                type="button"
                onClick={handleClear}
                disabled={!jsonInput}
                className="text-xs font-bold px-3 py-1 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
              >
                <Trash2 className="w-3 h-3" /> {t('common.clear')}
              </button>
            </div>
          </div>
          <div className="relative group">
            <textarea
              id="json-input"
              ref={textareaRef}
              value={jsonInput}
              onChange={(e) => {
                setJsonInput(e.target.value);
              }}
              placeholder='{ "name": "Alice", "age": 28, "isActive": true }'
              className={`w-full h-[500px] p-6 bg-slate-50 dark:bg-slate-900 border ${error ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'} rounded-[2rem] outline-none focus:ring-2 ${error ? 'focus:ring-rose-500/20' : 'focus:ring-indigo-500/20'} transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none`}
            />
            {error && (
              <div className="absolute bottom-6 left-6 right-6 p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2">
                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                <p className="text-xs font-bold text-rose-600 dark:text-rose-400">{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Output Column */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="schema-output" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 cursor-pointer">
              <FileCode className="w-4 h-4 text-indigo-500" /> {t('jsonschema.output_label')}
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleDownload}
                disabled={!schemaResult}
                className="text-xs font-bold px-3 py-1 rounded-full text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 transition-all flex items-center gap-1 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
              >
                <Download className="w-3 h-3" /> {t('jsonschema.download')}
              </button>
              <button
                type="button"
                onClick={handleCopy}
                disabled={!schemaResult}
                className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none border ${
                  copied
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                    : 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                title={`${t('common.copy')} (C)`}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied ? t('common.copied') : t('common.copy')}
                {!copied && <Kbd modifier={null} className="hidden sm:inline-flex w-4 h-4 bg-white/50 dark:bg-black/20 ml-1">C</Kbd>}
              </button>
            </div>
          </div>
          <div className="bg-slate-900 dark:bg-black rounded-[2rem] p-6 h-[500px] overflow-auto border border-slate-800 shadow-xl shadow-indigo-500/5">
            <pre id="schema-output" className="text-sm font-mono text-indigo-400 leading-relaxed">
              {schemaResult || <span className="text-slate-600 italic">{t('jsonschema.placeholder_output')}</span>}
            </pre>
          </div>
        </div>
      </div>

      {/* Info Sections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-600">
            <Braces className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black">{t('jsonschema.about_title')}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('jsonschema.about_text')}
          </p>
        </div>

        <div className="space-y-4">
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center text-emerald-600">
            <Info className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black">{t('jsonschema.how_title')}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('jsonschema.how_text')}
          </p>
        </div>

        <div className="space-y-4">
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center text-amber-600">
            <FileCode className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black">{t('jsonschema.use_title')}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('jsonschema.use_text')}
          </p>
        </div>
      </div>
    </div>
  );
}
