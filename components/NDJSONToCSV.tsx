import { useState, useEffect, useCallback, useRef } from 'react';
import { Copy, Check, Trash2, FileSpreadsheet, Download, Sparkles, AlertCircle, Info, Settings2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;

type DelimiterOption = 'comma' | 'tab' | 'semicolon' | 'pipe';
type CasingOption = 'original' | 'camelCase' | 'snake_case' | 'PascalCase' | 'CONSTANT_CASE';

interface Preset {
  id: string;
  labelKey: string;
  defaultLabel: string;
  ndjson: string;
}

const PRESETS: Preset[] = [
  {
    id: 'server_events',
    labelKey: 'ndjsontocsv.preset_events',
    defaultLabel: 'Server Event Logs',
    ndjson: `{"timestamp":"2026-03-15T10:00:00Z","level":"INFO","event":"user_login","userId":"usr_101","meta":{"ip":"192.168.1.1","browser":"Chrome"}}
{"timestamp":"2026-03-15T10:01:05Z","level":"WARN","event":"rate_limit_exceeded","userId":"usr_102","meta":{"ip":"10.0.0.55","browser":"Firefox"}}
{"timestamp":"2026-03-15T10:02:10Z","level":"ERROR","event":"payment_failed","userId":"usr_103","meta":{"ip":"172.16.0.4","browser":"Safari"}}`
  },
  {
    id: 'user_profiles',
    labelKey: 'ndjsontocsv.preset_users',
    defaultLabel: 'User Profiles',
    ndjson: `{"id":1,"name":"Alice Smith","email":"alice@example.com","role":"admin","active":true}
{"id":2,"name":"Bob Jones","email":"bob@example.com","role":"user","active":false}
{"id":3,"name":"Charlie Brown","email":"charlie@example.com","role":"developer","active":true}`
  },
  {
    id: 'e_commerce',
    labelKey: 'ndjsontocsv.preset_ecommerce',
    defaultLabel: 'E-Commerce Transactions',
    ndjson: `{"orderId":"ORD-901","customer":"Diana","amount":149.99,"status":"shipped","items":["laptop","mouse"]}
{"orderId":"ORD-902","customer":"Evan","amount":29.50,"status":"pending","items":["keyboard"]}
{"orderId":"ORD-903","customer":"Fiona","amount":89.00,"status":"delivered","items":["headphones","stand"]}`
  }
];

function transformCasing(str: string, casing: CasingOption): string {
  if (casing === 'original') return str;

  // Split into words by non-alphanumeric or capital boundaries
  const words = str
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .split(/\s+/);

  if (words.length === 0 || words[0] === '') return str;

  switch (casing) {
    case 'camelCase':
      return words[0].toLowerCase() + words.slice(1).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
    case 'snake_case':
      return words.map(w => w.toLowerCase()).join('_');
    case 'PascalCase':
      return words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
    case 'CONSTANT_CASE':
      return words.map(w => w.toUpperCase()).join('_');
    default:
      return str;
  }
}

function flattenObject(obj: any, prefix = ''): Record<string, any> {
  const result: Record<string, any> = Object.create(null);

  for (const key in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
    // Protect against prototype pollution keys
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;

    const propName = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];

    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      const flatChild = flattenObject(value, propName);
      for (const childKey in flatChild) {
        if (Object.prototype.hasOwnProperty.call(flatChild, childKey)) {
          result[childKey] = flatChild[childKey];
        }
      }
    } else {
      result[propName] = value;
    }
  }

  return result;
}

function escapeCsvField(val: any, delimiterChar: string, includeQuotes: boolean): string {
  if (val === null || val === undefined) return '';

  let str = '';
  if (Array.isArray(val)) {
    str = val.join('; ');
  } else if (typeof val === 'object') {
    str = JSON.stringify(val);
  } else {
    str = String(val);
  }

  const needsQuotes = includeQuotes || str.includes(delimiterChar) || str.includes('"') || str.includes('\n') || str.includes('\r');

  if (needsQuotes) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function NDJSONToCSV({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [ndjsonInput, setNdjsonInput] = useState<string>(initialData?.ndjsonInput ?? PRESETS[0].ndjson);
  const [delimiter, setDelimiter] = useState<DelimiterOption>(initialData?.delimiter ?? 'comma');
  const [casing, setCasing] = useState<CasingOption>(initialData?.casing ?? 'original');
  const [flatten, setFlatten] = useState<boolean>(initialData?.flatten ?? true);
  const [includeHeaders, setIncludeHeaders] = useState<boolean>(initialData?.includeHeaders ?? true);
  const [forceQuotes, setForceQuotes] = useState<boolean>(initialData?.forceQuotes ?? false);

  const [outputCsv, setOutputCsv] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [activePresetId, setActivePresetId] = useState<string | null>(PRESETS[0].id);

  useEffect(() => {
    onStateChange?.({ ndjsonInput, delimiter, casing, flatten, includeHeaders, forceQuotes });
  }, [ndjsonInput, delimiter, casing, flatten, includeHeaders, forceQuotes, onStateChange]);

  const convertNDJSONToCSV = useCallback(() => {
    if (!ndjsonInput.trim()) {
      setOutputCsv('');
      setError(null);
      return;
    }

    if (ndjsonInput.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString(), defaultValue: `Input exceeds maximum length of ${MAX_LENGTH.toLocaleString()} characters.` }));
      setOutputCsv('');
      return;
    }

    try {
      const lines = ndjsonInput.trim().split(/\r?\n/);
      const objects: Record<string, any>[] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        try {
          const parsed = JSON.parse(line);
          if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
            throw new Error(`Line ${i + 1} is not a valid JSON object`);
          }
          const item = flatten ? flattenObject(parsed) : parsed;
          objects.push(item);
        } catch (e: any) {
          throw new Error(`Line ${i + 1}: ${e.message}`);
        }
      }

      if (objects.length === 0) {
        setOutputCsv('');
        setError(null);
        return;
      }

      // Collect all unique header keys across all objects while preserving insertion order
      const headersSet = new Set<string>();
      for (const obj of objects) {
        for (const key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
            headersSet.add(key);
          }
        }
      }

      const rawHeaders = Array.from(headersSet);
      if (rawHeaders.length === 0) {
        setOutputCsv('');
        setError(null);
        return;
      }

      const delimiterChar = delimiter === 'tab' ? '\t' : delimiter === 'semicolon' ? ';' : delimiter === 'pipe' ? '|' : ',';
      const formattedHeaders = rawHeaders.map(h => transformCasing(h, casing));

      const rows: string[] = [];

      if (includeHeaders) {
        rows.push(formattedHeaders.map(h => escapeCsvField(h, delimiterChar, forceQuotes)).join(delimiterChar));
      }

      for (const obj of objects) {
        const rowValues = rawHeaders.map(key => {
          const val = Object.prototype.hasOwnProperty.call(obj, key) ? obj[key] : '';
          return escapeCsvField(val, delimiterChar, forceQuotes);
        });
        rows.push(rowValues.join(delimiterChar));
      }

      setOutputCsv(rows.join('\n'));
      setError(null);
    } catch (e: any) {
      setError(e.message);
      setOutputCsv('');
    }
  }, [ndjsonInput, delimiter, casing, flatten, includeHeaders, forceQuotes, t]);

  useEffect(() => {
    const timer = setTimeout(convertNDJSONToCSV, 150);
    return () => clearTimeout(timer);
  }, [convertNDJSONToCSV]);

  const handleCopy = useCallback(() => {
    if (!outputCsv) return;
    navigator.clipboard.writeText(outputCsv);
    setCopied(true);
    toast.success(t('common.copied', { defaultValue: 'Copied to clipboard!' }));
    setTimeout(() => setCopied(false), 2000);
  }, [outputCsv, t]);

  const handleClear = useCallback(() => {
    setNdjsonInput('');
    setOutputCsv('');
    setError(null);
    setActivePresetId(null);
    toast.success(t('common.cleared', { defaultValue: 'Cleared input' }));
    textareaRef.current?.focus();
  }, [t]);

  const handleDownload = useCallback(() => {
    if (!outputCsv) return;
    const ext = delimiter === 'tab' ? 'tsv' : 'csv';
    const mimeType = delimiter === 'tab' ? 'text/tab-separated-values' : 'text/csv';
    const blob = new Blob([outputCsv], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `data.${ext}`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(t('common.downloaded', { defaultValue: 'File downloaded' }));
  }, [outputCsv, delimiter, t]);

  const loadPreset = (preset: Preset) => {
    setNdjsonInput(preset.ndjson);
    setActivePresetId(preset.id);
    const label = t(preset.labelKey, { defaultValue: preset.defaultLabel });
    toast.success(t('common.preset_loaded', { name: label, defaultValue: `Loaded preset: ${label}` }));
    textareaRef.current?.focus();
  };

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
        activeElement?.getAttribute('contenteditable') === 'true';

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
      {/* Quick Start Presets */}
      <div className="bg-white dark:bg-slate-900/40 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-indigo-500">
          <Sparkles className="w-4 h-4" />
          <span>{t('common.presets', { defaultValue: 'Quick Start Presets' })}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => loadPreset(preset)}
              aria-pressed={activePresetId === preset.id}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                activePresetId === preset.id
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 border-transparent hover:border-indigo-200 dark:hover:border-indigo-800'
              }`}
            >
              {t(preset.labelKey, { defaultValue: preset.defaultLabel })}
            </button>
          ))}
        </div>
      </div>

      {/* Controls Bar */}
      <div className="bg-white dark:bg-slate-900/40 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
          <Settings2 className="w-4 h-4 text-indigo-500" />
          <span>{t('ndjsontocsv.formatting_options', { defaultValue: 'Conversion Options' })}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Delimiter */}
          <div className="space-y-1.5">
            <label htmlFor="delimiter-select" className="text-xs font-bold text-slate-600 dark:text-slate-400">
              {t('ndjsontocsv.delimiter', { defaultValue: 'Delimiter' })}
            </label>
            <select
              id="delimiter-select"
              value={delimiter}
              onChange={(e) => setDelimiter(e.target.value as DelimiterOption)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-slate-200"
            >
              <option value="comma">Comma ( , )</option>
              <option value="tab">Tab ( \t )</option>
              <option value="semicolon">Semicolon ( ; )</option>
              <option value="pipe">Pipe ( | )</option>
            </select>
          </div>

          {/* Key Casing */}
          <div className="space-y-1.5">
            <label htmlFor="casing-select" className="text-xs font-bold text-slate-600 dark:text-slate-400">
              {t('ndjsontocsv.header_casing', { defaultValue: 'Header Casing' })}
            </label>
            <select
              id="casing-select"
              value={casing}
              onChange={(e) => setCasing(e.target.value as CasingOption)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-slate-200"
            >
              <option value="original">Original</option>
              <option value="camelCase">camelCase</option>
              <option value="snake_case">snake_case</option>
              <option value="PascalCase">PascalCase</option>
              <option value="CONSTANT_CASE">CONSTANT_CASE</option>
            </select>
          </div>

          {/* Checkbox Controls */}
          <div className="sm:col-span-2 flex flex-wrap items-center gap-6 pt-3">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={flatten}
                onChange={(e) => setFlatten(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span>{t('ndjsontocsv.flatten_nested', { defaultValue: 'Flatten Nested Objects' })}</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={includeHeaders}
                onChange={(e) => setIncludeHeaders(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span>{t('ndjsontocsv.include_headers', { defaultValue: 'Include Header Row' })}</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={forceQuotes}
                onChange={(e) => setForceQuotes(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span>{t('ndjsontocsv.force_quotes', { defaultValue: 'Quote All Fields' })}</span>
            </label>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Editor Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="ndjson-csv-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-indigo-500" />
              <span>{t('ndjsontocsv.input_ndjson', { defaultValue: 'NDJSON Input Stream' })}</span>
            </label>
            <div className="flex gap-2 items-center">
              <Kbd modifier={null} className="hidden sm:inline-flex border-rose-200 dark:border-rose-800 text-rose-400 dark:bg-slate-900">Esc</Kbd>
              <button
                onClick={handleClear}
                className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t('common.clear', { defaultValue: 'Clear' })}</span>
              </button>
            </div>
          </div>
          <textarea
            id="ndjson-csv-input"
            ref={textareaRef}
            value={ndjsonInput}
            onChange={(e) => {
              setNdjsonInput(e.target.value);
              setActivePresetId(null);
            }}
            placeholder={'{"id": 1, "name": "Alice"}\n{"id": 2, "name": "Bob"}'}
            className="w-full h-96 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm dark:text-slate-300 resize-none"
          />
        </div>

        {/* Output */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="csv-output" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
              <span>{delimiter === 'tab' ? 'TSV Output' : 'CSV Output'}</span>
            </label>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                disabled={!outputCsv}
                className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{t('common.download', { defaultValue: 'Download' })}</span>
              </button>
              <button
                onClick={handleCopy}
                disabled={!outputCsv}
                title={`${t('common.copy', { defaultValue: 'Copy' })} (C)`}
                className={`text-xs font-bold px-4 py-1.5 rounded-xl transition-all border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none flex items-center gap-2 ${
                  copied
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200'
                    : 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-slate-200 dark:border-slate-700 hover:border-indigo-500/50'
                } disabled:opacity-50`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? t('common.copied', { defaultValue: 'Copied' }) : t('common.copy', { defaultValue: 'Copy' })}</span>
                {!copied && <Kbd modifier={null} className="hidden sm:inline-flex w-4 h-4 bg-white/50 dark:bg-black/20 ml-1">C</Kbd>}
              </button>
            </div>
          </div>
          <textarea
            id="csv-output"
            readOnly
            value={outputCsv}
            placeholder="CSV output will appear here..."
            className="w-full h-96 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-mono text-sm dark:text-slate-300 resize-none shadow-inner"
          />
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <Info className="w-6 h-6 text-indigo-500 mt-1 flex-shrink-0" />
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('ndjsontocsv.about_title', { defaultValue: 'About NDJSON to CSV / TSV Converter' })}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('ndjsontocsv.about_text', { defaultValue: 'Newline-Delimited JSON (NDJSON / JSON Lines) streams individual JSON records on separate lines. This tool automatically flattens nested structures, harmonizes header keys across variable lines, and exports formatted CSV or TSV data compatible with Excel, Google Sheets, or data engineering pipelines.' })}
          </p>
        </div>
      </div>
    </div>
  );
}
