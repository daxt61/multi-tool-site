import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { FileSpreadsheet, Copy, Check, Trash2, Download, Settings2, Sparkles, ArrowUpDown, SlidersHorizontal } from 'lucide-react';
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

export type SortMode = 'text' | 'numeric' | 'date' | 'length';
export type SortDirection = 'asc' | 'desc';

interface Preset {
  id: string;
  nameKey: string;
  delimiter: string;
  hasHeader: boolean;
  targetColumnIndex: number;
  sortMode: SortMode;
  sortDirection: SortDirection;
  isCaseSensitive: boolean;
  input: string;
}

const PRESETS: Preset[] = [
  {
    id: 'orders_by_total',
    nameKey: 'csv_row_sorter.preset_orders_by_total',
    delimiter: ',',
    hasHeader: true,
    targetColumnIndex: 4, // Total
    sortMode: 'numeric',
    sortDirection: 'desc',
    isCaseSensitive: false,
    input: `OrderID,Customer,Email,Category,Total,Status\n1001,Alice Smith,alice@example.com,Electronics,249.99,Completed\n1002,Bob Jones,bob@example.com,Home,89.50,Pending\n1003,Charlie Brown,charlie@example.com,Apparel,120.00,Completed\n1004,Diana Prince,diana@example.com,Electronics,499.00,Shipped\n1005,Evan Wright,evan@example.com,Books,15.20,Completed`,
  },
  {
    id: 'users_by_name',
    nameKey: 'csv_row_sorter.preset_users_by_name',
    delimiter: ';',
    hasHeader: true,
    targetColumnIndex: 0, // Name
    sortMode: 'text',
    sortDirection: 'asc',
    isCaseSensitive: false,
    input: `Name;Role;Department;Location\nPierre Martin;Product Manager;Product;Marseille\nAlice Smith;Software Engineer;Engineering;Paris\nMarie Curie;Research Lead;R&D;Lyon\nBob Jones;DevOps Specialist;Engineering;Paris`,
  },
  {
    id: 'logs_by_date',
    nameKey: 'csv_row_sorter.preset_logs_by_date',
    delimiter: ',',
    hasHeader: true,
    targetColumnIndex: 0, // Timestamp
    sortMode: 'date',
    sortDirection: 'desc',
    isCaseSensitive: false,
    input: `Timestamp,Level,Service,Message\n2023-10-24T14:32:01Z,INFO,AuthService,User logged in\n2023-10-25T08:15:22Z,ERROR,PaymentService,Gateway timeout\n2023-10-23T19:00:10Z,WARN,Database,High memory usage\n2023-10-25T11:45:00Z,INFO,UserService,Profile updated`,
  },
  {
    id: 'emails_by_length',
    nameKey: 'csv_row_sorter.preset_emails_by_length',
    delimiter: ',',
    hasHeader: true,
    targetColumnIndex: 2, // Email
    sortMode: 'length',
    sortDirection: 'asc',
    isCaseSensitive: false,
    input: `ID,Name,Email,Department\n1,Alice,alice.smith.dev@enterprise.org,Engineering\n2,Bob,bob@me.com,Marketing\n3,Charlie,charlie.brown@company.net,Design\n4,David,d@x.io,Sales`,
  },
];

export function CSVRowSorter({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [input, setInput] = useState(initialData?.input || '');
  const [delimiter, setDelimiter] = useState(initialData?.delimiter || ',');
  const [hasHeader, setHasHeader] = useState(initialData?.hasHeader ?? true);
  const [targetColumnIndex, setTargetColumnIndex] = useState<number>(initialData?.targetColumnIndex ?? 0);
  const [sortMode, setSortMode] = useState<SortMode>(initialData?.sortMode || 'text');
  const [sortDirection, setSortDirection] = useState<SortDirection>(initialData?.sortDirection || 'asc');
  const [isCaseSensitive, setIsCaseSensitive] = useState(initialData?.isCaseSensitive ?? false);
  const [copied, setCopied] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    onStateChange?.({
      input,
      delimiter,
      hasHeader,
      targetColumnIndex,
      sortMode,
      sortDirection,
      isCaseSensitive,
    });
  }, [input, delimiter, hasHeader, targetColumnIndex, sortMode, sortDirection, isCaseSensitive, onStateChange]);

  const parseCSVLine = (line: string, delim: string) => {
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
    return result.map(v => {
      v = v.trim();
      if (v.startsWith('"') && v.endsWith('"')) {
        return v.substring(1, v.length - 1).replace(/""/g, '"');
      }
      return v;
    });
  };

  const parsedLines = useMemo(() => {
    if (!input.trim()) return [];
    const rawLines = input.trim().split(/\r?\n/).filter((line: string) => line.trim().length > 0);
    return rawLines.map((line: string) => parseCSVLine(line, delimiter));
  }, [input, delimiter]);

  const columns = useMemo(() => {
    if (parsedLines.length === 0) return [];
    const maxCols = Math.max(...parsedLines.map((row: string[]) => row.length));
    const headerRow = hasHeader ? parsedLines[0] : [];

    return Array.from({ length: maxCols }, (_, i) => ({
      index: i,
      name: headerRow[i] ? headerRow[i] : `Column ${i + 1}`,
    }));
  }, [parsedLines, hasHeader]);

  const sortedData = useMemo(() => {
    if (parsedLines.length === 0) return { header: null as string[] | null, rows: [] as string[][] };

    const header = hasHeader ? parsedLines[0] : null;
    const rows = hasHeader ? parsedLines.slice(1) : [...parsedLines];

    rows.sort((a, b) => {
      const valA = a[targetColumnIndex] ?? '';
      const valB = b[targetColumnIndex] ?? '';

      let comparison = 0;

      if (sortMode === 'numeric') {
        const numA = parseFloat(valA);
        const numB = parseFloat(valB);
        const isANan = isNaN(numA);
        const isBNan = isNaN(numB);

        if (isANan && isBNan) comparison = 0;
        else if (isANan) comparison = 1;
        else if (isBNan) comparison = -1;
        else comparison = numA - numB;
      } else if (sortMode === 'date') {
        const dateA = Date.parse(valA);
        const dateB = Date.parse(valB);
        const isANan = isNaN(dateA);
        const isBNan = isNaN(dateB);

        if (isANan && isBNan) comparison = 0;
        else if (isANan) comparison = 1;
        else if (isBNan) comparison = -1;
        else comparison = dateA - dateB;
      } else if (sortMode === 'length') {
        comparison = valA.length - valB.length;
      } else {
        // Text mode
        const strA = isCaseSensitive ? valA : valA.toLowerCase();
        const strB = isCaseSensitive ? valB : valB.toLowerCase();
        comparison = strA.localeCompare(strB);
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return { header, rows };
  }, [parsedLines, hasHeader, targetColumnIndex, sortMode, sortDirection, isCaseSensitive]);

  const outputCSV = useMemo(() => {
    const allRows: string[][] = [];
    if (sortedData.header) {
      allRows.push(sortedData.header);
    }
    allRows.push(...sortedData.rows);

    if (allRows.length === 0) return '';

    return allRows.map(row => {
      return row.map(val => {
        if (val.includes(delimiter) || val.includes('"') || val.includes('\n')) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      }).join(delimiter);
    }).join('\n');
  }, [sortedData, delimiter]);

  const totalRowsCount = useMemo(() => {
    if (parsedLines.length === 0) return 0;
    return hasHeader ? Math.max(0, parsedLines.length - 1) : parsedLines.length;
  }, [parsedLines, hasHeader]);

  const handleCopy = useCallback(() => {
    if (!outputCSV) return;
    navigator.clipboard.writeText(outputCSV);
    setCopied(true);
    toast.success(t('csv_row_sorter.toast_copied', { defaultValue: 'Sorted CSV copied to clipboard!' }));
    setTimeout(() => setCopied(false), 2000);
  }, [outputCSV, t]);

  const handleDownload = useCallback(() => {
    if (!outputCSV) return;
    const blob = new Blob([outputCSV], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sorted-csv-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(t('csv_row_sorter.toast_downloaded', { defaultValue: 'CSV file downloaded successfully!' }));
  }, [outputCSV, t]);

  const handleClear = useCallback(() => {
    setInput('');
    toast.success(t('csv_row_sorter.toast_cleared', { defaultValue: 'Cleared input!' }));
    inputRef.current?.focus();
  }, [t]);

  const applyPreset = useCallback((preset: Preset) => {
    setInput(preset.input);
    setDelimiter(preset.delimiter);
    setHasHeader(preset.hasHeader);
    setTargetColumnIndex(preset.targetColumnIndex);
    setSortMode(preset.sortMode);
    setSortDirection(preset.sortDirection);
    setIsCaseSensitive(preset.isCaseSensitive);
    toast.success(t('csv_row_sorter.toast_preset_loaded', { defaultValue: 'Preset loaded!' }));
  }, [t]);

  // Keyboard shortcut handlers
  const handlersRef = useRef({
    handleClear,
    handleCopy,
    outputCSV,
  });

  useEffect(() => {
    handlersRef.current = { handleClear, handleCopy, outputCSV };
  }, [handleClear, handleCopy, outputCSV]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInputFocused = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT' || (activeEl as HTMLElement).isContentEditable);

      if (e.key === 'Escape') {
        e.preventDefault();
        handlersRef.current.handleClear();
      } else if ((e.key === 'c' || e.key === 'C') && !e.ctrlKey && !e.metaKey && !e.altKey && !isInputFocused) {
        if (handlersRef.current.outputCSV) {
          e.preventDefault();
          handlersRef.current.handleCopy();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8" data-testid="csv-sorter-container">
      {/* Presets Bar */}
      <div className="flex flex-wrap items-center gap-2 p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mr-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
          {t('csv_row_sorter.presets', { defaultValue: 'Quick Presets' })}:
        </span>
        {PRESETS.map((p) => (
          <button
            key={p.id}
            onClick={() => applyPreset(p)}
            className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold transition-all hover:border-indigo-300 shadow-sm"
          >
            {t(p.nameKey, { defaultValue: p.id })}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="csv-sort-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-indigo-500" aria-hidden="true" />
                {t('common.input', { defaultValue: 'Input' })} CSV / TSV
              </label>
              <div className="flex items-center gap-2">
                <Kbd modifier={null} className="text-[10px]">Esc</Kbd>
                <button
                  onClick={handleClear}
                  disabled={!input}
                  className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  {t('common.clear', { defaultValue: 'Clear' })}
                </button>
              </div>
            </div>
            <textarea
              id="csv-sort-input"
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, MAX_LENGTH))}
              placeholder={t('csv_row_sorter.placeholder_input', { defaultValue: 'Paste your CSV / TSV dataset here...' })}
              className="w-full h-64 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none shadow-sm"
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="csv-sort-output" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4 text-emerald-500" aria-hidden="true" />
                {t('common.output', { defaultValue: 'Output' })} CSV ({totalRowsCount} {t('csv_row_sorter.rows_unit', { defaultValue: 'sorted rows' })})
              </label>
              <div className="flex items-center gap-2">
                <Kbd modifier={null} className="text-[10px]">C</Kbd>
                <button
                  onClick={handleDownload}
                  disabled={!outputCSV}
                  className="p-2 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg hover:bg-indigo-100 disabled:opacity-50 transition-all"
                  title={t('common.download', { defaultValue: 'Download' })}
                >
                  <Download className="w-4 h-4" aria-hidden="true" />
                </button>
                <button
                  onClick={handleCopy}
                  disabled={!outputCSV}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                    copied
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                      : 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {copied ? <Check className="w-4 h-4" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
                  {copied ? t('common.copied', { defaultValue: 'Copied!' }) : t('common.copy', { defaultValue: 'Copy' })}
                </button>
              </div>
            </div>
            <textarea
              id="csv-sort-output"
              value={outputCSV}
              readOnly
              placeholder={t('csv_row_sorter.placeholder_output', { defaultValue: 'Sorted CSV results will appear here...' })}
              className="w-full h-64 p-6 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-mono text-sm leading-relaxed text-indigo-600 dark:text-indigo-400 resize-none shadow-sm"
            />
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="p-8 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2rem] space-y-6">
            <div className="flex items-center gap-2 px-1">
              <Settings2 className="w-4 h-4 text-indigo-500" aria-hidden="true" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{t('common.options', { defaultValue: 'Options' })}</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 px-1 uppercase tracking-wider">{t('csv_row_sorter.delimiter', { defaultValue: 'Delimiter' })}</label>
                <div className="flex flex-wrap gap-2">
                  {DELIMITERS.map(d => (
                    <button
                      key={d.value}
                      onClick={() => setDelimiter(d.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                        delimiter === d.value
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-indigo-500/50'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setHasHeader(!hasHeader)}
                className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all font-bold text-sm ${
                  hasHeader
                    ? 'bg-white dark:bg-slate-800 border-indigo-500/50 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                }`}
              >
                <span>{t('csv_row_sorter.header_checkbox', { defaultValue: 'First row is header' })}</span>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${hasHeader ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300'}`}>
                  {hasHeader && <Check className="w-3 h-3 text-white" aria-hidden="true" />}
                </div>
              </button>
            </div>
          </div>

          {/* Sort Rules Config */}
          <div className="p-8 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-[2rem] space-y-6 shadow-sm">
            <div className="flex items-center gap-2 px-1">
              <SlidersHorizontal className="w-4 h-4 text-indigo-500" aria-hidden="true" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{t('csv_row_sorter.sort_settings', { defaultValue: 'Sort Parameters' })}</h3>
            </div>

            <div className="space-y-4">
              {/* Target Column */}
              <div className="space-y-2">
                <label htmlFor="target-sort-column" className="text-xs font-bold text-slate-400 px-1 uppercase tracking-wider">
                  {t('csv_row_sorter.target_column', { defaultValue: 'Sort Column' })}
                </label>
                <select
                  id="target-sort-column"
                  value={targetColumnIndex}
                  onChange={(e) => setTargetColumnIndex(parseInt(e.target.value, 10))}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-slate-200"
                >
                  {columns.map(col => (
                    <option key={col.index} value={col.index}>
                      {col.name} ({t('csv_row_sorter.col_prefix', { defaultValue: 'Col' })} {col.index + 1})
                    </option>
                  ))}
                  {columns.length === 0 && <option value={0}>Column 1</option>}
                </select>
              </div>

              {/* Sort Mode */}
              <div className="space-y-2">
                <label htmlFor="sort-mode" className="text-xs font-bold text-slate-400 px-1 uppercase tracking-wider">
                  {t('csv_row_sorter.sort_mode', { defaultValue: 'Sort Type' })}
                </label>
                <select
                  id="sort-mode"
                  value={sortMode}
                  onChange={(e) => setSortMode(e.target.value as SortMode)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-slate-200"
                >
                  <option value="text">{t('csv_row_sorter.mode_text', { defaultValue: 'Text / Alphabetical (A-Z)' })}</option>
                  <option value="numeric">{t('csv_row_sorter.mode_numeric', { defaultValue: 'Numerical (1, 2, 10)' })}</option>
                  <option value="date">{t('csv_row_sorter.mode_date', { defaultValue: 'Date / Timestamp' })}</option>
                  <option value="length">{t('csv_row_sorter.mode_length', { defaultValue: 'Text Length' })}</option>
                </select>
              </div>

              {/* Sort Direction */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 px-1 uppercase tracking-wider">
                  {t('csv_row_sorter.direction_label', { defaultValue: 'Order' })}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setSortDirection('asc')}
                    className={`p-2.5 rounded-xl text-xs font-bold transition-all border ${
                      sortDirection === 'asc'
                        ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-indigo-300'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {t('csv_row_sorter.dir_asc', { defaultValue: 'Ascending (A-Z / 1-9)' })}
                  </button>
                  <button
                    onClick={() => setSortDirection('desc')}
                    className={`p-2.5 rounded-xl text-xs font-bold transition-all border ${
                      sortDirection === 'desc'
                        ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-indigo-300'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {t('csv_row_sorter.dir_desc', { defaultValue: 'Descending (Z-A / 9-1)' })}
                  </button>
                </div>
              </div>

              {/* Case Sensitivity */}
              {sortMode === 'text' && (
                <button
                  onClick={() => setIsCaseSensitive(!isCaseSensitive)}
                  aria-pressed={isCaseSensitive}
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all font-bold text-xs ${
                    isCaseSensitive
                      ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 text-indigo-600 dark:text-indigo-400'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                  }`}
                >
                  <span>{t('csv_row_sorter.case_sensitive', { defaultValue: 'Case sensitive sorting' })}</span>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${isCaseSensitive ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300'}`}>
                    {isCaseSensitive && <Check className="w-2.5 h-2.5 text-white" aria-hidden="true" />}
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
