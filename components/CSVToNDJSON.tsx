import { useState, useEffect, useCallback, useRef } from 'react';
import { Database, Copy, Check, Trash2, FileSpreadsheet, AlertCircle, Info, Download, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;
const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

const PRESETS = [
  {
    id: 'users_csv',
    labelKey: 'csvtondjson.preset_users',
    defaultLabel: 'User Directory CSV',
    delimiter: 'auto',
    parseTypes: true,
    skipEmpty: true,
    trimCells: true,
    csv: `id,name,email,age,active\n101,Alice Smith,alice@example.com,29,true\n102,Bob Jones,bob@example.com,34,false\n103,Charlie Brown,charlie@example.com,22,true`
  },
  {
    id: 'server_logs_tsv',
    labelKey: 'csvtondjson.preset_logs',
    defaultLabel: 'Server Logs TSV',
    delimiter: '\t',
    parseTypes: true,
    skipEmpty: true,
    trimCells: true,
    csv: `timestamp\tlevel\tservice\tstatus_code\tpath\n2026-03-15T10:00:00Z\tINFO\tauth-service\t200\t/api/v1/login\n2026-03-15T10:00:05Z\tWARN\tpayment-service\t402\t/api/v1/checkout\n2026-03-15T10:00:12Z\tERROR\tdatabase\t500\t/api/v1/query`
  },
  {
    id: 'ecommerce_orders',
    labelKey: 'csvtondjson.preset_orders',
    defaultLabel: 'E-Commerce Orders',
    delimiter: ',',
    parseTypes: true,
    skipEmpty: true,
    trimCells: true,
    csv: `order_id,customer,total_amount,items_count,shipped\nORD-9001,John Doe,129.50,3,true\nORD-9002,Jane Miller,49.99,1,false\nORD-9003,Sam Wilson,899.00,2,true`
  }
];

function detectDelimiter(text: string): string {
  const firstLine = text.split('\n')[0] || '';
  const commaCount = (firstLine.match(/,/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  const pipeCount = (firstLine.match(/\|/g) || []).length;

  const max = Math.max(commaCount, tabCount, semicolonCount, pipeCount);
  if (max === 0) return ',';
  if (max === tabCount) return '\t';
  if (max === semicolonCount) return ';';
  if (max === pipeCount) return '|';
  return ',';
}

function parseCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function parseValue(val: string, parseTypes: boolean): any {
  if (!parseTypes) return val;
  const trimmed = val.trim();

  if (trimmed === '') return '';
  if (trimmed === 'null') return null;
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;

  if (!isNaN(Number(trimmed)) && trimmed !== '') {
    return Number(trimmed);
  }

  return val;
}

export function CSVToNDJSON({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [csv, setCsv] = useState(initialData?.csv || PRESETS[0].csv);
  const [delimiter, setDelimiter] = useState(initialData?.delimiter || PRESETS[0].delimiter);
  const [parseTypes, setParseTypes] = useState(initialData?.parseTypes ?? PRESETS[0].parseTypes);
  const [skipEmpty, setSkipEmpty] = useState(initialData?.skipEmpty ?? PRESETS[0].skipEmpty);
  const [trimCells, setTrimCells] = useState(initialData?.trimCells ?? PRESETS[0].trimCells);
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ csv, delimiter, parseTypes, skipEmpty, trimCells });
  }, [csv, delimiter, parseTypes, skipEmpty, trimCells, onStateChange]);

  const convertCSVToNDJSON = useCallback(() => {
    if (!csv.trim()) {
      setOutput('');
      setError(null);
      return;
    }

    if (csv.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
      setOutput('');
      return;
    }

    try {
      const activeDelimiter = delimiter === 'auto' ? detectDelimiter(csv) : delimiter;
      const lines = csv.split(/\r?\n/);

      if (lines.length === 0) {
        setOutput('');
        return;
      }

      const headers = parseCSVLine(lines[0], activeDelimiter).map(h => (trimCells ? h.trim() : h));

      if (headers.length === 0 || headers.every(h => !h)) {
        setError(t('error.invalid_csv', { defaultValue: 'Invalid CSV headers' }));
        setOutput('');
        return;
      }

      const ndjsonLines: string[] = [];

      for (let i = 1; i < lines.length; i++) {
        const rawLine = lines[i];
        if (skipEmpty && !rawLine.trim()) continue;

        const cells = parseCSVLine(rawLine, activeDelimiter);
        const rowObj = Object.create(null);

        for (let j = 0; j < headers.length; j++) {
          const headerKey = headers[j];
          if (!headerKey || DANGEROUS_KEYS.has(headerKey)) continue;

          let rawCell = cells[j] ?? '';
          if (trimCells) rawCell = rawCell.trim();

          rowObj[headerKey] = parseValue(rawCell, parseTypes);
        }

        ndjsonLines.push(JSON.stringify(rowObj));
      }

      setOutput(ndjsonLines.join('\n'));
      setError(null);
    } catch (e: any) {
      setError(t('error.invalid_csv', { defaultValue: 'Failed to parse CSV' }) + ': ' + e.message);
      setOutput('');
    }
  }, [csv, delimiter, parseTypes, skipEmpty, trimCells, t]);

  useEffect(() => {
    const timeout = setTimeout(convertCSVToNDJSON, 200);
    return () => clearTimeout(timeout);
  }, [convertCSVToNDJSON]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success(t('common.copied', { defaultValue: 'Copied to clipboard!' }));
    setTimeout(() => setCopied(false), 2000);
  }, [output, t]);

  const handleClear = useCallback(() => {
    setCsv('');
    setOutput('');
    setError(null);
    toast.success(t('common.cleared', { defaultValue: 'Cleared input' }));
    textareaRef.current?.focus();
  }, [t]);

  const loadPreset = (preset: typeof PRESETS[0]) => {
    setCsv(preset.csv);
    setDelimiter(preset.delimiter);
    setParseTypes(preset.parseTypes);
    setSkipEmpty(preset.skipEmpty);
    setTrimCells(preset.trimCells);
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

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'application/x-ndjson' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `data.ndjson`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(t('common.downloaded', { defaultValue: 'File downloaded' }));
  };

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
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800"
            >
              {t(preset.labelKey, { defaultValue: preset.defaultLabel })}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Input Section */}
        <div className="space-y-6">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="csv-ndjson-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-indigo-500" /> {t('common.input', { defaultValue: 'Input' })} CSV / TSV
            </label>
            <div className="flex gap-2 items-center">
              <Kbd modifier={null} className="hidden sm:inline-flex border-rose-200 dark:border-rose-800 text-rose-400 dark:bg-slate-900">Esc</Kbd>
              <button
                onClick={handleClear}
                className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all"
              >
                <Trash2 className="w-3 h-3" /> {t('common.clear', { defaultValue: 'Clear' })}
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900/40 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="csv-ndjson-delimiter" className="text-xs font-bold text-slate-500 px-1">
                  {t('csvtondjson.delimiter', { defaultValue: 'Delimiter' })}
                </label>
                <select
                  id="csv-ndjson-delimiter"
                  value={delimiter}
                  onChange={(e) => setDelimiter(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-slate-300"
                >
                  <option value="auto">{t('csvtondjson.auto_detect', { defaultValue: 'Auto-detect' })}</option>
                  <option value=",">Comma (,)</option>
                  <option value="&#9;">Tab (\t)</option>
                  <option value=";">Semicolon (;)</option>
                  <option value="|">Pipe (|)</option>
                </select>
              </div>

              <div className="flex flex-col gap-2 pt-6">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-600 dark:text-slate-400">
                  <input
                    type="checkbox"
                    checked={parseTypes}
                    onChange={(e) => setParseTypes(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>{t('csvtondjson.parse_types', { defaultValue: 'Parse numbers, booleans & nulls' })}</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-600 dark:text-slate-400">
                  <input
                    type="checkbox"
                    checked={trimCells}
                    onChange={(e) => setTrimCells(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>{t('csvtondjson.trim_cells', { defaultValue: 'Trim cell whitespace' })}</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-600 dark:text-slate-400">
                  <input
                    type="checkbox"
                    checked={skipEmpty}
                    onChange={(e) => setSkipEmpty(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>{t('csvtondjson.skip_empty', { defaultValue: 'Skip blank rows' })}</span>
                </label>
              </div>
            </div>
          </div>

          <textarea
            id="csv-ndjson-input"
            ref={textareaRef}
            value={csv}
            onChange={(e) => setCsv(e.target.value)}
            placeholder="id,name,email..."
            className="w-full h-[380px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        {/* Output Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="csv-ndjson-output" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-500" /> {t('csvtondjson.output_label', { defaultValue: 'NDJSON Output' })}
            </label>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                disabled={!output}
                className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" /> {t('common.download', { defaultValue: 'Download' })}
              </button>
              <button
                onClick={handleCopy}
                disabled={!output}
                title={`${t('common.copy', { defaultValue: 'Copy' })} (C)`}
                className={`text-xs font-bold px-4 py-1.5 rounded-xl transition-all border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none flex items-center gap-2 ${
                  copied
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200'
                    : 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-slate-200 dark:border-slate-700 hover:border-indigo-500/50'
                } disabled:opacity-50`}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? t('common.copied', { defaultValue: 'Copied' }) : t('common.copy', { defaultValue: 'Copy' })}
                {!copied && <Kbd modifier={null} className="hidden sm:inline-flex w-4 h-4 bg-white/50 dark:bg-black/20 ml-1">C</Kbd>}
              </button>
            </div>
          </div>
          <textarea
            id="csv-ndjson-output"
            readOnly
            value={output}
            placeholder="Newline-delimited JSON output will appear here..."
            className="w-full h-[580px] p-6 bg-slate-900 border border-slate-800 rounded-3xl outline-none font-mono text-sm leading-relaxed text-indigo-300 resize-none"
          />
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <Info className="w-6 h-6 text-indigo-500 mt-1" />
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('csvtondjson.about_title', { defaultValue: 'About CSV to NDJSON Converter' })}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('csvtondjson.about_text', { defaultValue: 'Newline-Delimited JSON (NDJSON) is a convenient format for streaming data pipelines, log files, and bulk database operations. This tool converts CSV or TSV spreadsheets into line-by-line NDJSON format.' })}
          </p>
        </div>
      </div>
    </div>
  );
}
