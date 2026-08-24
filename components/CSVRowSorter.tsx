import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { FileSpreadsheet, Copy, Check, Trash2, Download, Settings2, Sliders, ArrowUpDown, Sparkles, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;

const DELIMITERS = [
  { label: 'Comma (,)', value: ',' },
  { label: 'Semicolon (;)', value: ';' },
  { label: 'Tab (\\t)', value: '\t' },
  { label: 'Pipe (|)', value: '|' },
];

export type SortMode = 'text' | 'number' | 'date' | 'length';
export type SortDirection = 'asc' | 'desc';

interface Preset {
  id: string;
  nameKey: string;
  inputDelimiter: string;
  outputDelimiter: string;
  hasHeader: boolean;
  targetColumn: number;
  sortMode: SortMode;
  sortDirection: SortDirection;
  isCaseSensitive: boolean;
  input: string;
}

const PRESETS: Preset[] = [
  {
    id: 'orders_by_price',
    nameKey: 'csv_row_sorter.preset_orders_by_price',
    inputDelimiter: ',',
    outputDelimiter: ',',
    hasHeader: true,
    targetColumn: 2,
    sortMode: 'number',
    sortDirection: 'asc',
    isCaseSensitive: false,
    input: `OrderID,Customer,Amount,Status\n101,Alice Smith,249.99,Completed\n102,Bob Jones,89.50,Pending\n103,Charlie Brown,120.00,Completed\n104,Diana Prince,499.00,Shipped`,
  },
  {
    id: 'users_by_name',
    nameKey: 'csv_row_sorter.preset_users_by_name',
    inputDelimiter: ';',
    outputDelimiter: ';',
    hasHeader: true,
    targetColumn: 0,
    sortMode: 'text',
    sortDirection: 'asc',
    isCaseSensitive: false,
    input: `Name;Role;Department\nJean Dupont;Software Engineer;Engineering\nMarie Curie;Research Lead;R&D\nPierre Martin;Product Manager;Product\nAlice Smith;UX Designer;Design`,
  },
  {
    id: 'logs_by_date',
    nameKey: 'csv_row_sorter.preset_logs_by_date',
    inputDelimiter: ',',
    outputDelimiter: ',',
    hasHeader: true,
    targetColumn: 0,
    sortMode: 'date',
    sortDirection: 'desc',
    isCaseSensitive: false,
    input: `Timestamp,Level,Message\n2025-01-18 14:22:01,INFO,System startup complete\n2025-01-15 09:15:30,WARN,High memory usage detected\n2025-01-19 10:00:00,ERROR,Database connection timeout\n2025-01-16 18:45:12,INFO,User authenticated`,
  },
  {
    id: 'emails_by_length',
    nameKey: 'csv_row_sorter.preset_emails_by_length',
    inputDelimiter: ',',
    outputDelimiter: ',',
    hasHeader: true,
    targetColumn: 0,
    sortMode: 'length',
    sortDirection: 'asc',
    isCaseSensitive: false,
    input: `Email,Role\nalice.smith.enterprise.account@company.com,Admin\nbob@domain.com,User\ncharlie.brown.test@service.org,Editor\ned@x.io,Guest`,
  },
];

export function CSVRowSorter({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [input, setInput] = useState<string>(initialData?.input || '');
  const [inputDelimiter, setInputDelimiter] = useState<string>(initialData?.inputDelimiter || ',');
  const [outputDelimiter, setOutputDelimiter] = useState<string>(initialData?.outputDelimiter || ',');
  const [hasHeader, setHasHeader] = useState<boolean>(initialData?.hasHeader ?? true);
  const [targetColumn, setTargetColumn] = useState<number>(initialData?.targetColumn ?? 0);
  const [sortMode, setSortMode] = useState<SortMode>(initialData?.sortMode || 'text');
  const [sortDirection, setSortDirection] = useState<SortDirection>(initialData?.sortDirection || 'asc');
  const [isCaseSensitive, setIsCaseSensitive] = useState<boolean>(initialData?.isCaseSensitive ?? false);
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    onStateChange?.({
      input,
      inputDelimiter,
      outputDelimiter,
      hasHeader,
      targetColumn,
      sortMode,
      sortDirection,
      isCaseSensitive,
    });
  }, [input, inputDelimiter, outputDelimiter, hasHeader, targetColumn, sortMode, sortDirection, isCaseSensitive, onStateChange]);

  const parseCSVLine = (line: string, delim: string): string[] => {
    const result: string[] = [];
    let startValueIndex = 0;
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') inQuotes = !inQuotes;
      if (line[i] === delim && !inQuotes) {
        result.push(line.substring(startValueIndex, i));
        startValueIndex = i + 1;
      }
    }
    result.push(line.substring(startValueIndex));
    return result.map((v) => {
      v = v.trim();
      if (v.startsWith('"') && v.endsWith('"')) {
        return v.substring(1, v.length - 1).replace(/""/g, '"');
      }
      return v;
    });
  };

  const formatCellValue = (val: string, delim: string): string => {
    if (val.includes(delim) || val.includes('"') || val.includes('\n') || val.includes('\r')) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  };

  const parsedData = useMemo(() => {
    if (!input.trim()) return [];
    if (input.length > MAX_LENGTH) {
      return [];
    }
    const lines = input.trim().split(/\r?\n/);
    return lines.map((line) => parseCSVLine(line, inputDelimiter));
  }, [input, inputDelimiter]);

  const columnHeaders = useMemo(() => {
    if (parsedData.length === 0) return [];
    const maxCols = Math.max(...parsedData.map((row) => row.length));
    const headerRow = hasHeader ? parsedData[0] : [];

    return Array.from({ length: maxCols }, (_, i) => ({
      index: i,
      name: headerRow[i] ? headerRow[i] : `Column ${i + 1}`,
    }));
  }, [parsedData, hasHeader]);

  const sortedData = useMemo(() => {
    if (parsedData.length === 0) return [];

    const header = hasHeader ? parsedData[0] : null;
    const rowsToSort = hasHeader ? parsedData.slice(1) : [...parsedData];

    const sortedRows = [...rowsToSort].sort((aRow, bRow) => {
      let aVal = aRow[targetColumn] ?? '';
      let bVal = bRow[targetColumn] ?? '';

      if (!isCaseSensitive && sortMode === 'text') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      let cmp = 0;

      if (sortMode === 'number') {
        const aNum = parseFloat(aVal.replace(/[^0-9.-]+/g, ''));
        const bNum = parseFloat(bVal.replace(/[^0-9.-]+/g, ''));
        const aValid = !isNaN(aNum);
        const bValid = !isNaN(bNum);

        if (aValid && bValid) {
          cmp = aNum - bNum;
        } else if (aValid) {
          cmp = -1;
        } else if (bValid) {
          cmp = 1;
        } else {
          cmp = aVal.localeCompare(bVal);
        }
      } else if (sortMode === 'date') {
        const aDate = Date.parse(aVal);
        const bDate = Date.parse(bVal);
        const aValid = !isNaN(aDate);
        const bValid = !isNaN(bDate);

        if (aValid && bValid) {
          cmp = aDate - bDate;
        } else if (aValid) {
          cmp = -1;
        } else if (bValid) {
          cmp = 1;
        } else {
          cmp = aVal.localeCompare(bVal);
        }
      } else if (sortMode === 'length') {
        cmp = aVal.length - bVal.length;
        if (cmp === 0) {
          cmp = aVal.localeCompare(bVal);
        }
      } else {
        // 'text'
        cmp = aVal.localeCompare(bVal, undefined, { sensitivity: isCaseSensitive ? 'variant' : 'base', numeric: true });
      }

      return sortDirection === 'asc' ? cmp : -cmp;
    });

    return header ? [header, ...sortedRows] : sortedRows;
  }, [parsedData, hasHeader, targetColumn, sortMode, sortDirection, isCaseSensitive]);

  const output = useMemo(() => {
    if (sortedData.length === 0) return '';
    return sortedData
      .map((row) => row.map((cell) => formatCellValue(cell, outputDelimiter)).join(outputDelimiter))
      .join('\n');
  }, [sortedData, outputDelimiter]);

  const handleInputChange = (val: string) => {
    setInput(val);
    if (val.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
    } else {
      setError(null);
    }
  };

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success(t('csv_row_sorter.toast_copied', { defaultValue: 'Sorted CSV copied to clipboard!' }));
    setTimeout(() => setCopied(false), 2000);
  }, [output, t]);

  const handleDownload = useCallback(() => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sorted-rows-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(t('csv_row_sorter.toast_downloaded', { defaultValue: 'CSV downloaded successfully!' }));
  }, [output, t]);

  const handleClear = useCallback(() => {
    setInput('');
    setError(null);
    toast.success(t('csv_row_sorter.toast_cleared', { defaultValue: 'Cleared input!' }));
    inputRef.current?.focus();
  }, [t]);

  const applyPreset = useCallback((preset: Preset) => {
    setInput(preset.input);
    setInputDelimiter(preset.inputDelimiter);
    setOutputDelimiter(preset.outputDelimiter);
    setHasHeader(preset.hasHeader);
    setTargetColumn(preset.targetColumn);
    setSortMode(preset.sortMode);
    setSortDirection(preset.sortDirection);
    setIsCaseSensitive(preset.isCaseSensitive);
    setError(null);
    toast.success(t('csv_row_sorter.toast_preset_loaded', { defaultValue: 'Preset loaded!' }));
  }, [t]);

  // Keyboard shortcut safeguards via handlersRef
  const handlersRef = useRef({
    handleClear,
    handleCopy,
    output,
  });

  useEffect(() => {
    handlersRef.current = { handleClear, handleCopy, output };
  }, [handleClear, handleCopy, output]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInputFocused =
        activeEl &&
        (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || (activeEl as HTMLElement).isContentEditable);

      if (e.key === 'Escape') {
        e.preventDefault();
        handlersRef.current.handleClear();
      } else if ((e.key === 'c' || e.key === 'C') && !e.ctrlKey && !e.metaKey && !e.altKey && !isInputFocused) {
        if (handlersRef.current.output) {
          e.preventDefault();
          handlersRef.current.handleCopy();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8" data-testid="csv-row-sorter-container">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" aria-hidden="true" />
          {error}
        </div>
      )}

      {/* Presets Bar */}
      <div className="flex flex-wrap items-center gap-2 p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mr-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
          {t('csv_row_sorter.presets', { defaultValue: 'Quick Presets' })}:
        </span>
        {PRESETS.map((preset) => (
          <button
            key={preset.id}
            onClick={() => applyPreset(preset)}
            className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold transition-all hover:border-indigo-300 shadow-sm"
          >
            {t(preset.nameKey, { defaultValue: preset.id })}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Textareas */}
        <div className="lg:col-span-8 space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="csv-sort-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-indigo-500" aria-hidden="true" /> {t('common.input')} CSV / TSV
              </label>
              <div className="flex items-center gap-2">
                <Kbd modifier={null} className="text-[10px]">Esc</Kbd>
                <button
                  onClick={handleClear}
                  disabled={!input}
                  className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" /> {t('common.clear')}
                </button>
              </div>
            </div>
            <textarea
              id="csv-sort-input"
              ref={inputRef}
              value={input}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder={t('csv_row_sorter.placeholder_input', { defaultValue: 'OrderID,Customer,Amount,Status\n101,Alice,249.99,Completed\n102,Bob,89.50,Pending' })}
              className="w-full h-64 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none shadow-sm"
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="csv-sort-output" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4 text-emerald-500" aria-hidden="true" /> {t('csv_row_sorter.sorted_output', { defaultValue: 'Sorted Output CSV' })}
              </label>
              <div className="flex items-center gap-2">
                <Kbd modifier={null} className="text-[10px]">C</Kbd>
                <button
                  onClick={handleDownload}
                  disabled={!output}
                  className="p-2 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg hover:bg-indigo-100 disabled:opacity-50 transition-all"
                  title={t('common.download')}
                >
                  <Download className="w-4 h-4" aria-hidden="true" />
                </button>
                <button
                  onClick={handleCopy}
                  disabled={!output}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                    copied
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                      : 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {copied ? <Check className="w-4 h-4" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
                  {copied ? t('common.copied') : t('common.copy')}
                </button>
              </div>
            </div>
            <textarea
              id="csv-sort-output"
              value={output}
              readOnly
              placeholder={t('csv_row_sorter.placeholder_output', { defaultValue: 'Sorted CSV rows will appear here...' })}
              className="w-full h-64 p-6 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-mono text-sm leading-relaxed text-indigo-600 dark:text-indigo-400 resize-none shadow-sm"
            />
          </div>
        </div>

        {/* Options & Configuration Panel */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-8 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2rem] space-y-6">
            <div className="flex items-center gap-2 px-1">
              <Settings2 className="w-4 h-4 text-indigo-500" aria-hidden="true" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{t('common.options')}</h3>
            </div>

            <div className="space-y-4">
              {/* Target Column Select */}
              <div className="space-y-2">
                <label htmlFor="target-column-index" className="text-xs font-bold text-slate-400 px-1 uppercase tracking-wider">
                  {t('csv_row_sorter.sort_by_column', { defaultValue: 'Sort By Column' })}
                </label>
                <select
                  id="target-column-index"
                  value={targetColumn}
                  onChange={(e) => setTargetColumn(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  {columnHeaders.length > 0 ? (
                    columnHeaders.map((col) => (
                      <option key={col.index} value={col.index}>
                        {col.name} (Col {col.index + 1})
                      </option>
                    ))
                  ) : (
                    <option value={0}>Column 1</option>
                  )}
                </select>
              </div>

              {/* Sort Comparison Mode */}
              <div className="space-y-2">
                <label htmlFor="sort-mode" className="text-xs font-bold text-slate-400 px-1 uppercase tracking-wider">
                  {t('csv_row_sorter.sort_mode', { defaultValue: 'Comparison Mode' })}
                </label>
                <select
                  id="sort-mode"
                  value={sortMode}
                  onChange={(e) => setSortMode(e.target.value as SortMode)}
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="text">{t('csv_row_sorter.mode_text', { defaultValue: 'Text / Alphabetical (A-Z)' })}</option>
                  <option value="number">{t('csv_row_sorter.mode_number', { defaultValue: 'Numeric Value (0-9)' })}</option>
                  <option value="date">{t('csv_row_sorter.mode_date', { defaultValue: 'Date & Timestamp' })}</option>
                  <option value="length">{t('csv_row_sorter.mode_length', { defaultValue: 'Text Length (Shortest to Longest)' })}</option>
                </select>
              </div>

              {/* Sort Direction Toggle */}
              <div className="space-y-2">
                <label htmlFor="sort-direction" className="text-xs font-bold text-slate-400 px-1 uppercase tracking-wider">
                  {t('csv_row_sorter.sort_direction', { defaultValue: 'Order Direction' })}
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    id="sort-direction"
                    onClick={() => setSortDirection('asc')}
                    aria-pressed={sortDirection === 'asc'}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                      sortDirection === 'asc'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {t('csv_row_sorter.asc', { defaultValue: 'Ascending (A-Z, 0-9)' })}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSortDirection('desc')}
                    aria-pressed={sortDirection === 'desc'}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                      sortDirection === 'desc'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {t('csv_row_sorter.desc', { defaultValue: 'Descending (Z-A, 9-0)' })}
                  </button>
                </div>
              </div>

              {/* Header Checkbox */}
              <button
                type="button"
                onClick={() => setHasHeader(!hasHeader)}
                aria-pressed={hasHeader}
                className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all font-bold text-sm ${
                  hasHeader
                    ? 'bg-white dark:bg-slate-800 border-indigo-500/50 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                }`}
              >
                <span>{t('csv_row_sorter.has_header', { defaultValue: 'First row is header' })}</span>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${hasHeader ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300'}`}>
                  {hasHeader && <Check className="w-3 h-3 text-white" aria-hidden="true" />}
                </div>
              </button>

              {/* Case Sensitivity Checkbox for Text mode */}
              {sortMode === 'text' && (
                <button
                  type="button"
                  onClick={() => setIsCaseSensitive(!isCaseSensitive)}
                  aria-pressed={isCaseSensitive}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all font-bold text-sm ${
                    isCaseSensitive
                      ? 'bg-white dark:bg-slate-800 border-indigo-500/50 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                  }`}
                >
                  <span>{t('csv_row_sorter.case_sensitive', { defaultValue: 'Case sensitive sorting' })}</span>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isCaseSensitive ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300'}`}>
                    {isCaseSensitive && <Check className="w-3 h-3 text-white" aria-hidden="true" />}
                  </div>
                </button>
              )}
            </div>
          </div>

          <div className="p-8 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-[2rem] space-y-6 shadow-sm">
            <div className="flex items-center gap-2 px-1">
              <Sliders className="w-4 h-4 text-indigo-500" aria-hidden="true" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{t('csv_row_sorter.delimiter_settings', { defaultValue: 'Delimiters' })}</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 px-1 uppercase tracking-wider">{t('csv_row_sorter.input_delimiter', { defaultValue: 'Input Delimiter' })}</label>
                <div className="flex flex-wrap gap-2">
                  {DELIMITERS.map((d) => (
                    <button
                      key={`in-${d.value}`}
                      onClick={() => setInputDelimiter(d.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                        inputDelimiter === d.value
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-indigo-500/50'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 px-1 uppercase tracking-wider">{t('csv_row_sorter.output_delimiter', { defaultValue: 'Output Delimiter' })}</label>
                <div className="flex flex-wrap gap-2">
                  {DELIMITERS.map((d) => (
                    <button
                      key={`out-${d.value}`}
                      onClick={() => setOutputDelimiter(d.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                        outputDelimiter === d.value
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-indigo-500/50'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
