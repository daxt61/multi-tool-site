import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Copy, Check, Trash2, Braces, FileCode, Info, AlertCircle, Download, ToggleLeft, ToggleRight, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;
const MAX_DEPTH = 20;

export function ZodSchemaGenerator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // States
  const [jsonInput, setJsonInput] = useState(initialData?.jsonInput || '');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Advanced toggles
  const [detectFormats, setDetectFormats] = useState<boolean>(initialData?.detectFormats ?? true);
  const [detectNumbers, setDetectNumbers] = useState<boolean>(initialData?.detectNumbers ?? true);
  const [minOneString, setMinOneString] = useState<boolean>(initialData?.minOneString ?? false);
  const [strictObject, setStrictObject] = useState<boolean>(initialData?.strictObject ?? false);
  const [passthroughObject, setPassthroughObject] = useState<boolean>(initialData?.passthroughObject ?? false);
  const [partialObject, setPartialObject] = useState<boolean>(initialData?.partialObject ?? false);
  const [requiredObject, setRequiredObject] = useState<boolean>(initialData?.requiredObject ?? false);
  const [outputStyle, setOutputStyle] = useState<'full' | 'schema_only'>(initialData?.outputStyle || 'full');
  const [variableName, setVariableName] = useState<string>(initialData?.variableName || 'schema');

  useEffect(() => {
    onStateChange?.({
      jsonInput,
      detectFormats,
      detectNumbers,
      minOneString,
      strictObject,
      passthroughObject,
      partialObject,
      requiredObject,
      outputStyle,
      variableName
    });
  }, [
    jsonInput,
    detectFormats,
    detectNumbers,
    minOneString,
    strictObject,
    passthroughObject,
    partialObject,
    requiredObject,
    outputStyle,
    variableName,
    onStateChange
  ]);

  const handleClear = useCallback(() => {
    setJsonInput('');
    setError(null);
    toast.success(t('zod.toast_cleared') || 'Input cleared!');
    inputRef.current?.focus();
  }, [t]);

  // Deep recursive generator
  const generateZodSchema = useCallback((obj: any, indent: string = '', depth: number = 0): string => {
    if (depth > MAX_DEPTH) {
      return 'z.any()';
    }

    if (obj === null) {
      return 'z.any().nullable()';
    }

    const type = typeof obj;

    if (Array.isArray(obj)) {
      if (obj.length === 0) return 'z.array(z.any())';

      // Sample up to 5 elements to detect mixed types or optional fields
      const samples = obj.slice(0, 5);
      const sampleSchemas = samples.map(s => generateZodSchema(s, indent, depth + 1));
      const uniqueSchemas = Array.from(new Set(sampleSchemas));

      if (uniqueSchemas.length > 1) {
        return `z.array(z.union([${uniqueSchemas.join(', ')}]))`;
      }

      const itemSchema = generateZodSchema(obj[0], indent, depth + 1);
      return `z.array(${itemSchema})`;
    }

    if (type === 'object') {
      let result = 'z.object({\n';
      const nextIndent = indent + '  ';
      const entries = Object.entries(obj);

      if (entries.length === 0) return 'z.object({})';

      entries.forEach(([key, value]) => {
        const valueSchema = generateZodSchema(value, nextIndent, depth + 1);
        const safeKey = /^[a-z_$][a-z0-9_$]*$/i.test(key) ? key : JSON.stringify(key);
        result += `${nextIndent}${safeKey}: ${valueSchema},\n`;
      });
      result += `${indent}})`;

      // Object modifiers
      if (strictObject) {
        result += '.strict()';
      } else if (passthroughObject) {
        result += '.passthrough()';
      }

      if (partialObject) {
        result += '.partial()';
      } else if (requiredObject) {
        result += '.required()';
      }

      return result;
    }

    if (type === 'string') {
      let zodStr = 'z.string()';

      if (minOneString) {
        zodStr += '.min(1)';
      }

      if (detectFormats) {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        const urlRegex = /^https?:\/\/[^\s$.?#].[^\s]*$/;
        const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
        const dateTimeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}(:?\d{2})?)?$/;
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

        if (emailRegex.test(obj)) {
          zodStr += '.email()';
        } else if (urlRegex.test(obj)) {
          zodStr += '.url()';
        } else if (uuidRegex.test(obj)) {
          zodStr += '.uuid()';
        } else if (dateTimeRegex.test(obj)) {
          zodStr += '.datetime()';
        } else if (dateRegex.test(obj)) {
          zodStr += '.date()';
        }
      }

      return zodStr;
    }

    if (type === 'number') {
      let zodNum = 'z.number()';

      if (detectNumbers) {
        if (Number.isInteger(obj)) {
          zodNum += '.int()';
        }
        if (obj > 0) {
          zodNum += '.positive()';
        } else if (obj < 0) {
          zodNum += '.negative()';
        } else if (obj >= 0) {
          zodNum += '.nonnegative()';
        }
      }

      return zodNum;
    }

    if (type === 'boolean') return 'z.boolean()';

    return 'z.any()';
  }, [detectFormats, detectNumbers, minOneString, strictObject, passthroughObject, partialObject, requiredObject]);

  const zodResult = useMemo(() => {
    if (!jsonInput.trim()) {
      setError(null);
      return '';
    }

    try {
      const parsed = JSON.parse(jsonInput);
      setError(null);
      const schema = generateZodSchema(parsed);

      const cleanVarName = /^[a-zA-Z_$][a-z0-9_$]*$/i.test(variableName) ? variableName : 'schema';

      if (outputStyle === 'schema_only') {
        return schema;
      }

      return `import { z } from "zod";\n\nexport const ${cleanVarName} = ${schema};\n\nexport type ${cleanVarName.charAt(0).toUpperCase() + cleanVarName.slice(1)}Type = z.infer<typeof ${cleanVarName}>;`;
    } catch (e: any) {
      setError(e.message);
      return '';
    }
  }, [jsonInput, generateZodSchema, variableName, outputStyle]);

  const handleCopy = useCallback(() => {
    if (!zodResult) return;
    navigator.clipboard.writeText(zodResult);
    setCopied(true);
    toast.success(t('common.copied') || 'Copied!');
    setTimeout(() => setCopied(false), 2000);
  }, [zodResult, t]);

  const handleClearRef = useRef(handleClear);
  const handleCopyRef = useRef(handleCopy);

  useEffect(() => {
    handleClearRef.current = handleClear;
    handleCopyRef.current = handleCopy;
  }, [handleClear, handleCopy]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInputFocused =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement instanceof HTMLSelectElement ||
        activeElement?.getAttribute("contenteditable") === "true";

      if (isInputFocused && e.key !== 'Escape') return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key === "Escape") {
        e.preventDefault();
        handleClearRef.current();
      } else if (e.key.toLowerCase() === "c") {
        e.preventDefault();
        handleCopyRef.current();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleDownload = () => {
    if (!zodResult) return;
    const blob = new Blob([zodResult], { type: 'text/typescript' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${variableName || 'schema'}.ts`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(t('common.download_success') || 'Downloaded successfully!');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8" role="region" aria-label={t('zonschemato_ts.title') || 'Zod Schema Generator'}>
      {/* Header controls & badges */}
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
          disabled={!jsonInput}
          className="text-xs font-bold px-3 py-1.5 rounded-xl text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
        >
          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" /> {t('common.clear')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Input + Config */}
        <div className="lg:col-span-6 space-y-8">
          {/* Input JSON */}
          <div className="space-y-4">
            <label htmlFor="json-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 px-1">
              <Braces className="w-4 h-4 text-indigo-500" aria-hidden="true" /> {t('common.input')} JSON
            </label>
            <div className="relative group">
              <textarea
                id="json-input"
                ref={inputRef}
                value={jsonInput}
                onChange={(e) => {
                  const val = e.target.value;
                  setJsonInput(val);
                  if (val.length > MAX_LENGTH) {
                    setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
                  } else {
                    setError(null);
                  }
                }}
                placeholder='{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Jane Doe",
  "email": "jane@example.com",
  "website": "https://example.com",
  "age": 28,
  "isAdmin": true,
  "joinedAt": "2023-11-20T14:30:00Z",
  "tags": ["developer", "designer"]
}'
                className={`w-full h-80 p-6 bg-slate-50 dark:bg-slate-900 border ${error ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'} rounded-[2rem] outline-none focus:ring-2 ${error ? 'focus:ring-rose-500/20' : 'focus:ring-indigo-500/20'} transition-all font-mono text-sm dark:text-slate-300 resize-none`}
              />
              {error && (
                <div className="absolute bottom-6 left-6 right-6 p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2">
                  <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" aria-hidden="true" />
                  <p className="text-xs font-bold text-rose-600 dark:text-rose-400">{error}</p>
                </div>
              )}
            </div>
          </div>

          {/* Premium Configuration options */}
          <div className="bg-slate-50 dark:bg-slate-900/40 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-500" aria-hidden="true" /> {t('common.options') || 'Configuration'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Output Style */}
              <div className="space-y-2">
                <label htmlFor="output-style" className="text-xs font-bold text-slate-500 dark:text-slate-400 block">
                  {t('jsonschemato_ts.output_format') || 'Output Style'}
                </label>
                <select
                  id="output-style"
                  value={outputStyle}
                  onChange={(e) => setOutputStyle(e.target.value as 'full' | 'schema_only')}
                  className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
                >
                  <option value="full">{t('zod.option_full_file') || 'Full TS File (Import + Type)'}</option>
                  <option value="schema_only">{t('zod.option_schema_only') || 'Schema Expression Only'}</option>
                </select>
              </div>

              {/* Variable Name */}
              <div className="space-y-2">
                <label htmlFor="variable-name" className="text-xs font-bold text-slate-500 dark:text-slate-400 block">
                  {t('jsonschemato_ts.root_name') || 'Variable / Schema Name'}
                </label>
                <input
                  id="variable-name"
                  type="text"
                  value={variableName}
                  onChange={(e) => setVariableName(e.target.value.replace(/[^a-zA-Z0-9_$]/g, ''))}
                  disabled={outputStyle === 'schema_only'}
                  className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-mono font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white disabled:opacity-50"
                  placeholder="schema"
                />
              </div>
            </div>

            {/* Smart Detection Rules */}
            <div className="space-y-4 pt-2 border-t border-slate-200/50 dark:border-slate-800/50">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    {t('zod.detect_formats') || 'Auto-detect formats'}
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    {t('zod.detect_formats_desc') || 'Emails, URLs, UUIDs, Date/Times'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setDetectFormats(!detectFormats)}
                  aria-pressed={detectFormats}
                  className="text-indigo-500 hover:text-indigo-600 focus:outline-none"
                  aria-label={t('zod.detect_formats') || 'Auto-detect formats'}
                >
                  {detectFormats ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8 text-slate-400" />}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    {t('zod.detect_numbers') || 'Auto-detect number limits'}
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    {t('zod.detect_numbers_desc') || 'Integers, positives, negatives, nonnegative'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setDetectNumbers(!detectNumbers)}
                  aria-pressed={detectNumbers}
                  className="text-indigo-500 hover:text-indigo-600 focus:outline-none"
                  aria-label={t('zod.detect_numbers') || 'Auto-detect number limits'}
                >
                  {detectNumbers ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8 text-slate-400" />}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    {t('zod.min_one_string') || 'Disallow empty strings'}
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    {t('zod.min_one_string_desc') || 'Appends .min(1) to all string types'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setMinOneString(!minOneString)}
                  aria-pressed={minOneString}
                  className="text-indigo-500 hover:text-indigo-600 focus:outline-none"
                  aria-label={t('zod.min_one_string') || 'Disallow empty strings'}
                >
                  {minOneString ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8 text-slate-400" />}
                </button>
              </div>
            </div>

            {/* Object Strictness Modifiers */}
            <div className="space-y-4 pt-4 border-t border-slate-200/50 dark:border-slate-800/50">
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={strictObject}
                    disabled={passthroughObject}
                    onChange={(e) => setStrictObject(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                  />
                  <span className="text-xs font-bold text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors disabled:opacity-50">
                    {t('zod.strict_objects') || '.strict() Objects'}
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={passthroughObject}
                    disabled={strictObject}
                    onChange={(e) => setPassthroughObject(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                  />
                  <span className="text-xs font-bold text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors disabled:opacity-50">
                    {t('zod.passthrough_objects') || '.passthrough()'}
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={partialObject}
                    disabled={requiredObject}
                    onChange={(e) => setPartialObject(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                  />
                  <span className="text-xs font-bold text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors disabled:opacity-50">
                    {t('zod.partial_objects') || '.partial()'}
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={requiredObject}
                    disabled={partialObject}
                    onChange={(e) => setRequiredObject(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                  />
                  <span className="text-xs font-bold text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors disabled:opacity-50">
                    {t('zod.required_objects') || '.required()'}
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Schema Output */}
        <div className="lg:col-span-6 space-y-4 flex flex-col h-full justify-between">
          <div className="space-y-4 flex-1 flex flex-col">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="zod-output" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <FileCode className="w-4 h-4 text-indigo-500" aria-hidden="true" /> {t('zod.generated_schema')}
              </label>
              <div className="flex gap-2">
                <button
                  onClick={handleDownload}
                  disabled={!zodResult}
                  className="text-xs font-bold px-3 py-1 rounded-full text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 transition-all flex items-center gap-1 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
                  title={t('common.download')}
                >
                  <Download className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
                <button
                  onClick={handleCopy}
                  disabled={!zodResult}
                  className={`text-xs font-bold px-4 py-1.5 rounded-full transition-all flex items-center gap-1.5 border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${copied ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' : 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 border-transparent'} disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {copied ? <Check className="w-3.5 h-3.5" aria-hidden="true" /> : <Copy className="w-3.5 h-3.5" aria-hidden="true" />}
                  {copied ? t('common.copied') : t('common.copy')}
                </button>
              </div>
            </div>
            <div className="bg-slate-900 dark:bg-black rounded-[2rem] p-6 flex-1 min-h-[400px] overflow-auto border border-slate-800 shadow-xl shadow-indigo-500/5 relative">
              <pre id="zod-output" className="text-sm font-mono text-emerald-400 leading-relaxed whitespace-pre-wrap break-all">
                {zodResult || <span className="text-slate-600 italic">{t('zod.waiting')}</span>}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* Educational / Info Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-600" aria-hidden="true">
            <Braces className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black">{t('zod.what_is_title')}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('zod.what_is_text')}
          </p>
        </div>

        <div className="space-y-4">
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center text-emerald-600" aria-hidden="true">
            <Info className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black">{t('zod.how_it_works_title')}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('zod.how_it_works_text')}
          </p>
        </div>

        <div className="space-y-4">
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center text-amber-600" aria-hidden="true">
            <FileCode className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black">{t('zod.advantages_title')}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('zod.advantages_text')}
          </p>
        </div>
      </div>
    </div>
  );
}
