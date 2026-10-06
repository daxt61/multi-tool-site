import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, Check, RotateCcw, Download, Sparkles, AlertCircle, Table } from 'lucide-react';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;

interface Preset {
  id: string;
  name: string;
  csv: string;
}

const PRESETS: Preset[] = [
  {
    id: 'users',
    name: 'User Directory',
    csv: `id,first_name,last_name,email,is_active,age
101,Alice,Smith,alice@example.com,true,28
102,Bob,Jones,bob@example.com,false,34
103,Charlie,Brown,charlie@example.com,true,22`,
  },
  {
    id: 'products',
    name: 'Product Catalog',
    csv: `sku,product_name,category,price,in_stock
PRD-001,Wireless Ergonomic Mouse,Electronics,49.99,true
PRD-002,Mechanical RGB Keyboard,Electronics,129.50,true
PRD-003,Standing Desk Converter,Furniture,299.00,false`,
  },
  {
    id: 'financial',
    name: 'Financial Transactions',
    csv: `tx_id,date,description,amount,status
TX-9001,2025-01-15,Cloud Hosting Services,-150.00,SETTLED
TX-9002,2025-01-16,Client Payment - ACME Corp,2500.00,SETTLED
TX-9003,2025-01-17,Software Subscription,-29.99,PENDING`,
  },
];

type OutputMode = 'objects' | 'array_2d' | 'keyed_map' | 'ndjson';
type CasingMode = 'original' | 'camelCase' | 'snake_case' | 'PascalCase' | 'CONSTANT_CASE';

export function CSVToJSON({
  initialData,
  onStateChange,
}: {
  initialData?: any;
  onStateChange?: (state: any) => void;
}) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [csvInput, setCsvInput] = useState<string>(initialData?.csvInput ?? PRESETS[0].csv);
  const [outputMode, setOutputMode] = useState<OutputMode>(initialData?.outputMode ?? 'objects');
  const [delimiter, setDelimiter] = useState<string>(initialData?.delimiter ?? 'auto');
  const [customDelimiter, setCustomDelimiter] = useState<string>(initialData?.customDelimiter ?? '');
  const [casingMode, setCasingMode] = useState<CasingMode>(initialData?.casingMode ?? 'original');
  const [hasHeader, setHasHeader] = useState<boolean>(initialData?.hasHeader ?? true);
  const [autoCast, setAutoCast] = useState<boolean>(initialData?.autoCast ?? true);
  const [trimCells, setTrimCells] = useState<boolean>(initialData?.trimCells ?? true);
  const [skipEmptyRows, setSkipEmptyRows] = useState<boolean>(initialData?.skipEmptyRows ?? true);
  const [keyColumn, setKeyColumn] = useState<string>(initialData?.keyColumn ?? '');
  const [indentation, setIndentation] = useState<number>(initialData?.indentation ?? 2);
  const [activePresetId, setActivePresetId] = useState<string | null>(PRESETS[0].id);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    onStateChange?.({
      csvInput,
      outputMode,
      delimiter,
      customDelimiter,
      casingMode,
      hasHeader,
      autoCast,
      trimCells,
      skipEmptyRows,
      keyColumn,
      indentation,
    });
  }, [
    csvInput,
    outputMode,
    delimiter,
    customDelimiter,
    casingMode,
    hasHeader,
    autoCast,
    trimCells,
    skipEmptyRows,
    keyColumn,
    indentation,
    onStateChange,
  ]);

  const detectDelimiter = (text: string): string => {
    const sampleLines = text.trim().split(/\r?\n/).slice(0, 5).filter(Boolean);
    if (sampleLines.length === 0) return ',';

    const counts: Record<string, number> = {
      ',': 0,
      ';': 0,
      '\t': 0,
      '|': 0,
      ':': 0,
    };

    sampleLines.forEach((line) => {
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') inQuotes = !inQuotes;
        if (!inQuotes && Object.prototype.hasOwnProperty.call(counts, char)) {
          counts[char]++;
        }
      }
    });

    let bestDelim = ',';
    let maxCount = -1;
    for (const [delim, count] of Object.entries(counts)) {
      if (count > maxCount) {
        maxCount = count;
        bestDelim = delim;
      }
    }

    return maxCount > 0 ? bestDelim : ',';
  };

  const actualDelimiter = useMemo(() => {
    if (delimiter === 'custom') return customDelimiter || ',';
    if (delimiter === 'auto') return detectDelimiter(csvInput);
    return delimiter;
  }, [delimiter, customDelimiter, csvInput]);

  const transformCasing = (key: string, mode: CasingMode): string => {
    if (!key) return '';
    const trimmed = key.trim();
    if (mode === 'original') return trimmed;

    const words = trimmed
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/[^a-zA-Z0-9]+/g, ' ')
      .trim()
      .split(/\s+/);

    if (words.length === 0 || !words[0]) return trimmed;

    if (mode === 'camelCase') {
      return words
        .map((w, idx) => (idx === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))
        .join('');
    }
    if (mode === 'snake_case') {
      return words.map((w) => w.toLowerCase()).join('_');
    }
    if (mode === 'PascalCase') {
      return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
    }
    if (mode === 'CONSTANT_CASE') {
      return words.map((w) => w.toUpperCase()).join('_');
    }
    return trimmed;
  };

  const parseValue = (raw: string, cast: boolean, doTrim: boolean): any => {
    let val = doTrim ? raw.trim() : raw;
    if (!cast) return val;

    if (val === '') return '';
    if (val === 'null' || val === 'NULL') return null;
    if (val === 'true' || val === 'TRUE') return true;
    if (val === 'false' || val === 'FALSE') return false;

    if (!isNaN(Number(val)) && val !== '') {
      const num = Number(val);
      if (Number.isSafeInteger(num) || !isNaN(num)) return num;
    }

    return val;
  };

  const parseCSVLines = (csvText: string, delim: string): string[][] => {
    const lines: string[][] = [];
    let currentLine: string[] = [];
    let currentToken = '';
    let inQuotes = false;

    for (let i = 0; i < csvText.length; i++) {
      const char = csvText[i];
      const nextChar = csvText[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentToken += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delim && !inQuotes) {
        currentLine.push(currentToken);
        currentToken = '';
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') i++; // skip \n
        currentLine.push(currentToken);
        lines.push(currentLine);
        currentLine = [];
        currentToken = '';
      } else {
        currentToken += char;
      }
    }

    if (currentToken || currentLine.length > 0) {
      currentLine.push(currentToken);
      lines.push(currentLine);
    }

    return lines;
  };

  const sanitizeHeaderKey = (rawHeader: string): string => {
    let key = rawHeader.trim();
    if (!key) key = 'column';
    const lower = key.toLowerCase();
    if (lower === '__proto__' || lower === 'constructor' || lower === 'prototype') {
      return `_${key}`;
    }
    return key;
  };

  const { jsonOutput, parsedStats, error } = useMemo(() => {
    if (!csvInput.trim()) {
      return { jsonOutput: '', parsedStats: { rows: 0, cols: 0 }, error: '' };
    }

    if (csvInput.length > MAX_LENGTH) {
      return {
        jsonOutput: '',
        parsedStats: { rows: 0, cols: 0 },
        error: t('error.max_length', { max: MAX_LENGTH.toLocaleString() }),
      };
    }

    try {
      const rawRows = parseCSVLines(csvInput, actualDelimiter);
      let filteredRows = rawRows;

      if (skipEmptyRows) {
        filteredRows = rawRows.filter((r) => r.some((cell) => cell.trim() !== ''));
      }

      if (filteredRows.length === 0) {
        return { jsonOutput: '', parsedStats: { rows: 0, cols: 0 }, error: '' };
      }

      let headers: string[] = [];
      let dataRows: string[][] = [];

      if (hasHeader) {
        const headerRow = filteredRows[0];
        headers = headerRow.map((h, i) => {
          const transformed = transformCasing(h, casingMode);
          return sanitizeHeaderKey(transformed || `column_${i + 1}`);
        });
        dataRows = filteredRows.slice(1);
      } else {
        const maxCols = Math.max(...filteredRows.map((r) => r.length));
        headers = Array.from({ length: maxCols }, (_, i) => `column_${i + 1}`);
        dataRows = filteredRows;
      }

      const totalCols = headers.length;
      const totalRows = dataRows.length;

      let resultData: any;

      if (outputMode === 'objects') {
        resultData = dataRows.map((row) => {
          const obj = Object.create(null);
          headers.forEach((header, colIdx) => {
            const cellVal = row[colIdx] ?? '';
            obj[header] = parseValue(cellVal, autoCast, trimCells);
          });
          return obj;
        });
      } else if (outputMode === 'array_2d') {
        const formattedHeader = headers;
        const formattedRows = dataRows.map((row) =>
          headers.map((_, colIdx) => parseValue(row[colIdx] ?? '', autoCast, trimCells))
        );
        resultData = hasHeader ? [formattedHeader, ...formattedRows] : formattedRows;
      } else if (outputMode === 'keyed_map') {
        const mapObj = Object.create(null);
        const targetKeyHeader = keyColumn ? transformCasing(keyColumn, casingMode) : headers[0];

        dataRows.forEach((row, rowIdx) => {
          const obj = Object.create(null);
          headers.forEach((header, colIdx) => {
            const cellVal = row[colIdx] ?? '';
            obj[header] = parseValue(cellVal, autoCast, trimCells);
          });

          const primaryVal = obj[targetKeyHeader] ?? `row_${rowIdx + 1}`;
          const primaryKeyStr = sanitizeHeaderKey(String(primaryVal));
          mapObj[primaryKeyStr] = obj;
        });
        resultData = mapObj;
      } else if (outputMode === 'ndjson') {
        const lines = dataRows.map((row) => {
          const obj = Object.create(null);
          headers.forEach((header, colIdx) => {
            const cellVal = row[colIdx] ?? '';
            obj[header] = parseValue(cellVal, autoCast, trimCells);
          });
          return JSON.stringify(obj);
        });
        return {
          jsonOutput: lines.join('\n'),
          parsedStats: { rows: totalRows, cols: totalCols },
          error: '',
        };
      }

      return {
        jsonOutput: JSON.stringify(resultData, null, indentation),
        parsedStats: { rows: totalRows, cols: totalCols },
        error: '',
      };
    } catch (err: any) {
      return {
        jsonOutput: '',
        parsedStats: { rows: 0, cols: 0 },
        error: err.message || t('csvtojson.error_parsing'),
      };
    }
  }, [
    csvInput,
    actualDelimiter,
    hasHeader,
    casingMode,
    skipEmptyRows,
    outputMode,
    autoCast,
    trimCells,
    keyColumn,
    indentation,
    t,
  ]);

  const detectedHeaders = useMemo(() => {
    if (!csvInput.trim()) return [];
    try {
      const rawRows = parseCSVLines(csvInput, actualDelimiter);
      if (rawRows.length === 0) return [];
      return rawRows[0].map((h, i) => h.trim() || `column_${i + 1}`);
    } catch {
      return [];
    }
  }, [csvInput, actualDelimiter]);

  const handleClear = useCallback(() => {
    setCsvInput('');
    setActivePresetId(null);
    toast.success(t('csvtojson.toast_cleared'));
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [t]);

  const handleCopy = useCallback(() => {
    if (!jsonOutput) return;
    navigator.clipboard.writeText(jsonOutput);
    setCopied(true);
    toast.success(t('csvtojson.toast_copied'));
    setTimeout(() => setCopied(false), 2000);
  }, [jsonOutput, t]);

  const handleDownload = useCallback(() => {
    if (!jsonOutput) return;
    const extension = outputMode === 'ndjson' ? 'ndjson' : 'json';
    const blob = new Blob([jsonOutput], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `data.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(t('csvtojson.toast_downloaded'));
  }, [jsonOutput, outputMode, t]);

  const handleLoadPreset = (preset: Preset) => {
    setCsvInput(preset.csv);
    setActivePresetId(preset.id);
    toast.success(t('csvtojson.preset_loaded', { name: preset.name }));
  };

  const handlersRef = useRef({ handleClear, handleCopy });
  useEffect(() => {
    handlersRef.current = { handleClear, handleCopy };
  }, [handleClear, handleCopy]);

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
      <div className="flex flex-col gap-3 bg-slate-50 dark:bg-slate-900/50 p-5 rounded-3xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-500" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            {t('csvtojson.presets_title')}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => {
            const isActive = activePresetId === preset.id && csvInput === preset.csv;
            return (
              <button
                key={preset.id}
                onClick={() => handleLoadPreset(preset)}
                aria-pressed={isActive}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                  isActive
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                {t(`csvtojson.preset_${preset.id}`, { defaultValue: preset.name })}
              </button>
            );
          })}
        </div>
      </div>

      {/* Control Bar Options */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Output Mode */}
          <div className="space-y-1.5">
            <label htmlFor="csv-json-mode" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {t('csvtojson.output_mode')}
            </label>
            <select
              id="csv-json-mode"
              value={outputMode}
              onChange={(e) => setOutputMode(e.target.value as OutputMode)}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold outline-none cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <option value="objects">{t('csvtojson.mode_objects')}</option>
              <option value="array_2d">{t('csvtojson.mode_array_2d')}</option>
              <option value="keyed_map">{t('csvtojson.mode_keyed_map')}</option>
              <option value="ndjson">{t('csvtojson.mode_ndjson')}</option>
            </select>
          </div>

          {/* Delimiter */}
          <div className="space-y-1.5">
            <label htmlFor="csv-json-delimiter" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {t('csvtojson.delimiter_label')}
            </label>
            <div className="flex gap-2">
              <select
                id="csv-json-delimiter"
                value={delimiter}
                onChange={(e) => setDelimiter(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold outline-none cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <option value="auto">{t('csvtojson.delim_auto')}</option>
                <option value=",">{t('csvtojson.delim_comma')}</option>
                <option value=";">{t('csvtojson.delim_semicolon')}</option>
                <option value="&#9;">{t('csvtojson.delim_tab')}</option>
                <option value="|">{t('csvtojson.delim_pipe')}</option>
                <option value=":">{t('csvtojson.delim_colon')}</option>
                <option value="custom">{t('csvtojson.delim_custom')}</option>
              </select>

              {delimiter === 'custom' && (
                <input
                  id="csv-json-custom-delim"
                  type="text"
                  maxLength={5}
                  value={customDelimiter}
                  onChange={(e) => setCustomDelimiter(e.target.value)}
                  placeholder=";"
                  aria-label={t('csvtojson.custom_delim_label')}
                  className="w-16 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-2 text-xs font-bold text-center outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                />
              )}
            </div>
          </div>

          {/* Header Property Casing */}
          <div className="space-y-1.5">
            <label htmlFor="csv-json-casing" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {t('csvtojson.casing_label')}
            </label>
            <select
              id="csv-json-casing"
              value={casingMode}
              onChange={(e) => setCasingMode(e.target.value as CasingMode)}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold outline-none cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <option value="original">original</option>
              <option value="camelCase">camelCase</option>
              <option value="snake_case">snake_case</option>
              <option value="PascalCase">PascalCase</option>
              <option value="CONSTANT_CASE">CONSTANT_CASE</option>
            </select>
          </div>

          {/* Key Column Selector for Keyed Map Mode */}
          {outputMode === 'keyed_map' && (
            <div className="space-y-1.5">
              <label htmlFor="csv-json-key-col" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {t('csvtojson.key_col_label')}
              </label>
              <select
                id="csv-json-key-col"
                value={keyColumn}
                onChange={(e) => setKeyColumn(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold outline-none cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <option value="">{t('csvtojson.key_col_first')}</option>
                {detectedHeaders.map((col) => (
                  <option key={col} value={col}>
                    {col}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Indentation */}
          {outputMode !== 'ndjson' && (
            <div className="space-y-1.5">
              <label htmlFor="csv-json-indent" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {t('csvtojson.indent_label')}
              </label>
              <select
                id="csv-json-indent"
                value={indentation}
                onChange={(e) => setIndentation(Number(e.target.value))}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold outline-none cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <option value={2}>2 {t('csvtojson.indent_spaces')}</option>
                <option value={4}>4 {t('csvtojson.indent_spaces')}</option>
                <option value={0}>0 ({t('csvtojson.indent_minified')})</option>
              </select>
            </div>
          )}
        </div>

        {/* Checkbox Toggles */}
        <div className="flex flex-wrap gap-6 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={hasHeader}
              onChange={(e) => setHasHeader(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            {t('csvtojson.has_header')}
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={autoCast}
              onChange={(e) => setAutoCast(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            {t('csvtojson.auto_cast')}
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={trimCells}
              onChange={(e) => setTrimCells(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            {t('csvtojson.trim_cells')}
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={skipEmptyRows}
              onChange={(e) => setSkipEmptyRows(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            {t('csvtojson.skip_empty_rows')}
          </label>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold text-sm animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Input / Output Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CSV Input */}
        <div className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Table className="w-4 h-4 text-indigo-500" />
              <label htmlFor="csv-json-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('csvtojson.input_label')}
              </label>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400">
                {parsedStats.rows} {t('csvtojson.stat_rows')} • {parsedStats.cols} {t('csvtojson.stat_cols')}
              </span>
              <button
                onClick={handleClear}
                disabled={!csvInput}
                className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1 rounded-full transition-all disabled:opacity-50 flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
              >
                <RotateCcw className="w-3 h-3" /> {t('common.clear')}
                <Kbd modifier={null} className="hidden sm:inline-flex border-rose-200 dark:border-rose-800 text-rose-400 dark:bg-slate-900 ml-1">Esc</Kbd>
              </button>
            </div>
          </div>
          <textarea
            id="csv-json-input"
            ref={inputRef}
            value={csvInput}
            onChange={(e) => {
              setCsvInput(e.target.value);
              setActivePresetId(null);
            }}
            placeholder={t('csvtojson.placeholder_input')}
            className="w-full h-[400px] p-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono text-xs leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        {/* JSON Output */}
        <div className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">
              {t('csvtojson.output_label')}
            </span>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                disabled={!jsonOutput}
                className="text-xs font-bold px-3.5 py-1 rounded-full text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
              >
                <Download className="w-3 h-3" /> {t('common.download')}
              </button>
              <button
                onClick={handleCopy}
                disabled={!jsonOutput}
                className={`text-xs font-bold px-3.5 py-1 rounded-full transition-all flex items-center gap-1.5 border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                  copied
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                    : 'text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                } disabled:opacity-50`}
                title={`${t('common.copy')} (C)`}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? t('common.copied') : t('common.copy')}
                <Kbd modifier={null} className="hidden sm:inline-flex bg-white/50 dark:bg-black/20 ml-1">C</Kbd>
              </button>
            </div>
          </div>
          <textarea
            id="json-output"
            readOnly
            value={jsonOutput}
            placeholder={t('csvtojson.placeholder_output')}
            className="w-full h-[400px] p-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none transition-all font-mono text-xs leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>
      </div>

      {/* Educational / Explanatory Section */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
          {t('csvtojson.about_title')}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          {t('csvtojson.about_text')}
        </p>
      </div>
    </div>
  );
}
