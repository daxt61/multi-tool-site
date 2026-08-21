import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { FileSpreadsheet, Copy, Check, Trash2, Download, Settings2, Sliders, Filter, Sparkles, SlidersHorizontal } from 'lucide-react';
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

export type FilterOperator =
  | 'contains'
  | 'not_contains'
  | 'equals'
  | 'not_equals'
  | 'starts_with'
  | 'ends_with'
  | 'greater_than'
  | 'less_than'
  | 'greater_equal'
  | 'less_equal'
  | 'is_empty'
  | 'is_not_empty'
  | 'regex';

interface Preset {
  id: string;
  nameKey: string;
  delimiter: string;
  hasHeader: boolean;
  targetColumnIndex: number;
  operator: FilterOperator;
  filterValue: string;
  action: 'keep' | 'remove';
  isCaseSensitive: boolean;
  input: string;
}

const PRESETS: Preset[] = [
  {
    id: 'completed_orders',
    nameKey: 'csv_filter.preset_completed_orders',
    delimiter: ',',
    hasHeader: true,
    targetColumnIndex: 5, // Status
    operator: 'equals',
    filterValue: 'Completed',
    action: 'keep',
    isCaseSensitive: false,
    input: `OrderID,Customer,Email,Category,Total,Status\n1001,Alice Smith,alice@example.com,Electronics,249.99,Completed\n1002,Bob Jones,bob@example.com,Home,89.50,Pending\n1003,Charlie Brown,charlie@example.com,Apparel,120.00,Completed\n1004,Diana Prince,diana@example.com,Electronics,499.00,Shipped\n1005,Evan Wright,evan@example.com,Books,15.20,Completed`,
  },
  {
    id: 'high_value',
    nameKey: 'csv_filter.preset_high_value',
    delimiter: ',',
    hasHeader: true,
    targetColumnIndex: 4, // Total
    operator: 'greater_than',
    filterValue: '100',
    action: 'keep',
    isCaseSensitive: false,
    input: `OrderID,Customer,Email,Category,Total,Status\n1001,Alice Smith,alice@example.com,Electronics,249.99,Completed\n1002,Bob Jones,bob@example.com,Home,89.50,Pending\n1003,Charlie Brown,charlie@example.com,Apparel,120.00,Completed\n1004,Diana Prince,diana@example.com,Electronics,499.00,Shipped\n1005,Evan Wright,evan@example.com,Books,15.20,Completed`,
  },
  {
    id: 'engineering',
    nameKey: 'csv_filter.preset_engineering',
    delimiter: ';',
    hasHeader: true,
    targetColumnIndex: 2, // Department
    operator: 'contains',
    filterValue: 'Engineering',
    action: 'keep',
    isCaseSensitive: false,
    input: `Name;Role;Department;Location;Salary\nJean Dupont;Software Engineer;Engineering;Paris;65000\nMarie Curie;Research Lead;R&D;Lyon;72000\nPierre Martin;Product Manager;Product;Marseille;58000\nSophie Bernard;DevOps Specialist;Engineering;Paris;68000`,
  },
  {
    id: 'remove_blank_emails',
    nameKey: 'csv_filter.preset_remove_blank_emails',
    delimiter: ',',
    hasHeader: true,
    targetColumnIndex: 2, // Email
    operator: 'is_not_empty',
    filterValue: '',
    action: 'keep',
    isCaseSensitive: false,
    input: `ID,Name,Email,Phone\n1,Alice,alice@domain.com,555-0100\n2,Bob,,555-0101\n3,Charlie,charlie@domain.com,555-0102\n4,David,,555-0103`,
  },
];

export function CSVColumnFilter({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [input, setInput] = useState(initialData?.input || '');
  const [delimiter, setDelimiter] = useState(initialData?.delimiter || ',');
  const [hasHeader, setHasHeader] = useState(initialData?.hasHeader ?? true);
  const [targetColumnIndex, setTargetColumnIndex] = useState<number>(initialData?.targetColumnIndex ?? -1);
  const [operator, setOperator] = useState<FilterOperator>(initialData?.operator || 'contains');
  const [filterValue, setFilterValue] = useState(initialData?.filterValue || '');
  const [action, setAction] = useState<'keep' | 'remove'>(initialData?.action || 'keep');
  const [isCaseSensitive, setIsCaseSensitive] = useState(initialData?.isCaseSensitive ?? false);
  const [copied, setCopied] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    onStateChange?.({
      input,
      delimiter,
      hasHeader,
      targetColumnIndex,
      operator,
      filterValue,
      action,
      isCaseSensitive,
    });
  }, [input, delimiter, hasHeader, targetColumnIndex, operator, filterValue, action, isCaseSensitive, onStateChange]);

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

  const evaluateCondition = useCallback((cellValue: string) => {
    const val = isCaseSensitive ? cellValue : cellValue.toLowerCase();
    const target = isCaseSensitive ? filterValue : filterValue.toLowerCase();

    switch (operator) {
      case 'contains':
        return val.includes(target);
      case 'not_contains':
        return !val.includes(target);
      case 'equals':
        return val === target;
      case 'not_equals':
        return val !== target;
      case 'starts_with':
        return val.startsWith(target);
      case 'ends_with':
        return val.endsWith(target);
      case 'is_empty':
        return cellValue.trim().length === 0;
      case 'is_not_empty':
        return cellValue.trim().length > 0;
      case 'greater_than': {
        const numCell = parseFloat(cellValue);
        const numTarget = parseFloat(filterValue);
        return !isNaN(numCell) && !isNaN(numTarget) && numCell > numTarget;
      }
      case 'less_than': {
        const numCell = parseFloat(cellValue);
        const numTarget = parseFloat(filterValue);
        return !isNaN(numCell) && !isNaN(numTarget) && numCell < numTarget;
      }
      case 'greater_equal': {
        const numCell = parseFloat(cellValue);
        const numTarget = parseFloat(filterValue);
        return !isNaN(numCell) && !isNaN(numTarget) && numCell >= numTarget;
      }
      case 'less_equal': {
        const numCell = parseFloat(cellValue);
        const numTarget = parseFloat(filterValue);
        return !isNaN(numCell) && !isNaN(numTarget) && numCell <= numTarget;
      }
      case 'regex': {
        if (!filterValue.trim()) return true;
        try {
          const rx = new RegExp(filterValue, isCaseSensitive ? '' : 'i');
          return rx.test(cellValue);
        } catch {
          return false;
        }
      }
      default:
        return true;
    }
  }, [operator, filterValue, isCaseSensitive]);

  const filteredData = useMemo(() => {
    if (parsedLines.length === 0) return { header: null as string[] | null, rows: [] as string[][] };

    const header = hasHeader ? parsedLines[0] : null;
    const rows = hasHeader ? parsedLines.slice(1) : parsedLines;

    const matchedRows = rows.filter((row: string[]) => {
      let isMatch = false;

      if (targetColumnIndex === -1) {
        // Check all columns in row
        isMatch = row.some((cell: string) => evaluateCondition(cell));
      } else {
        const cell = row[targetColumnIndex] ?? '';
        isMatch = evaluateCondition(cell);
      }

      return action === 'keep' ? isMatch : !isMatch;
    });

    return { header, rows: matchedRows };
  }, [parsedLines, hasHeader, targetColumnIndex, action, evaluateCondition]);

  const outputCSV = useMemo(() => {
    const allRows: string[][] = [];
    if (filteredData.header) {
      allRows.push(filteredData.header);
    }
    allRows.push(...filteredData.rows);

    if (allRows.length === 0) return '';

    return allRows.map(row => {
      return row.map(val => {
        if (val.includes(delimiter) || val.includes('"') || val.includes('\n')) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      }).join(delimiter);
    }).join('\n');
  }, [filteredData, delimiter]);

  const totalRowsCount = useMemo(() => {
    if (parsedLines.length === 0) return 0;
    return hasHeader ? Math.max(0, parsedLines.length - 1) : parsedLines.length;
  }, [parsedLines, hasHeader]);

  const filteredRowsCount = filteredData.rows.length;
  const retentionPercentage = totalRowsCount > 0 ? Math.round((filteredRowsCount / totalRowsCount) * 100) : 0;

  const handleCopy = useCallback(() => {
    if (!outputCSV) return;
    navigator.clipboard.writeText(outputCSV);
    setCopied(true);
    toast.success(t('csv_filter.toast_copied', { defaultValue: 'Filtered CSV copied to clipboard!' }));
    setTimeout(() => setCopied(false), 2000);
  }, [outputCSV, t]);

  const handleDownload = useCallback(() => {
    if (!outputCSV) return;
    const blob = new Blob([outputCSV], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `filtered-csv-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(t('csv_filter.toast_downloaded', { defaultValue: 'CSV file downloaded successfully!' }));
  }, [outputCSV, t]);

  const handleClear = useCallback(() => {
    setInput('');
    setFilterValue('');
    toast.success(t('csv_filter.toast_cleared', { defaultValue: 'Cleared input!' }));
    inputRef.current?.focus();
  }, [t]);

  const applyPreset = useCallback((preset: Preset) => {
    setInput(preset.input);
    setDelimiter(preset.delimiter);
    setHasHeader(preset.hasHeader);
    setTargetColumnIndex(preset.targetColumnIndex);
    setOperator(preset.operator);
    setFilterValue(preset.filterValue);
    setAction(preset.action);
    setIsCaseSensitive(preset.isCaseSensitive);
    toast.success(t('csv_filter.toast_preset_loaded', { defaultValue: 'Preset loaded!' }));
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
    <div className="max-w-6xl mx-auto space-y-8" data-testid="csv-filter-container">
      {/* Presets Bar */}
      <div className="flex flex-wrap items-center gap-2 p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mr-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
          {t('csv_filter.presets', { defaultValue: 'Quick Presets' })}:
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
              <label htmlFor="csv-filter-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
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
              id="csv-filter-input"
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, MAX_LENGTH))}
              placeholder={t('csv_filter.placeholder_input', { defaultValue: 'Paste your CSV / TSV dataset here...' })}
              className="w-full h-64 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none shadow-sm"
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="csv-filter-output" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Filter className="w-4 h-4 text-emerald-500" aria-hidden="true" />
                {t('common.output', { defaultValue: 'Output' })} CSV ({filteredRowsCount} {t('csv_filter.rows_unit', { defaultValue: 'rows' })})
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
              id="csv-filter-output"
              value={outputCSV}
              readOnly
              placeholder={t('csv_filter.placeholder_output', { defaultValue: 'Filtered CSV results will appear here...' })}
              className="w-full h-64 p-6 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-mono text-sm leading-relaxed text-indigo-600 dark:text-indigo-400 resize-none shadow-sm"
            />
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-4 p-5 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl text-center">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{t('csv_filter.total_rows', { defaultValue: 'Total Rows' })}</p>
              <p className="text-xl font-extrabold text-slate-800 dark:text-slate-200">{totalRowsCount}</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{t('csv_filter.retained_rows', { defaultValue: 'Matching Rows' })}</p>
              <p className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400">{filteredRowsCount}</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{t('csv_filter.retention_rate', { defaultValue: 'Retention' })}</p>
              <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">{retentionPercentage}%</p>
            </div>
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
                <label className="text-xs font-bold text-slate-400 px-1 uppercase tracking-wider">{t('csv_filter.delimiter', { defaultValue: 'Delimiter' })}</label>
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
                <span>{t('csv_filter.header_checkbox', { defaultValue: 'First row is header' })}</span>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${hasHeader ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300'}`}>
                  {hasHeader && <Check className="w-3 h-3 text-white" aria-hidden="true" />}
                </div>
              </button>
            </div>
          </div>

          {/* Filter Rules Config */}
          <div className="p-8 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-[2rem] space-y-6 shadow-sm">
            <div className="flex items-center gap-2 px-1">
              <SlidersHorizontal className="w-4 h-4 text-indigo-500" aria-hidden="true" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{t('csv_filter.rules_title', { defaultValue: 'Filter Rules' })}</h3>
            </div>

            <div className="space-y-4">
              {/* Target Column */}
              <div className="space-y-2">
                <label htmlFor="target-column" className="text-xs font-bold text-slate-400 px-1 uppercase tracking-wider">
                  {t('csv_filter.target_column', { defaultValue: 'Target Column' })}
                </label>
                <select
                  id="target-column"
                  value={targetColumnIndex}
                  onChange={(e) => setTargetColumnIndex(parseInt(e.target.value, 10))}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-slate-200"
                >
                  <option value={-1}>{t('csv_filter.all_columns', { defaultValue: 'All Columns' })}</option>
                  {columns.map(col => (
                    <option key={col.index} value={col.index}>
                      {col.name} ({t('csv_filter.col_prefix', { defaultValue: 'Col' })} {col.index + 1})
                    </option>
                  ))}
                </select>
              </div>

              {/* Operator */}
              <div className="space-y-2">
                <label htmlFor="filter-operator" className="text-xs font-bold text-slate-400 px-1 uppercase tracking-wider">
                  {t('csv_filter.operator', { defaultValue: 'Condition Operator' })}
                </label>
                <select
                  id="filter-operator"
                  value={operator}
                  onChange={(e) => setOperator(e.target.value as FilterOperator)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-slate-200"
                >
                  <option value="contains">{t('csv_filter.op_contains', { defaultValue: 'Contains text' })}</option>
                  <option value="not_contains">{t('csv_filter.op_not_contains', { defaultValue: 'Does not contain text' })}</option>
                  <option value="equals">{t('csv_filter.op_equals', { defaultValue: 'Equals exactly' })}</option>
                  <option value="not_equals">{t('csv_filter.op_not_equals', { defaultValue: 'Does not equal' })}</option>
                  <option value="starts_with">{t('csv_filter.op_starts_with', { defaultValue: 'Starts with' })}</option>
                  <option value="ends_with">{t('csv_filter.op_ends_with', { defaultValue: 'Ends with' })}</option>
                  <option value="greater_than">{t('csv_filter.op_greater_than', { defaultValue: 'Greater than (>)' })}</option>
                  <option value="less_than">{t('csv_filter.op_less_than', { defaultValue: 'Less than (<)' })}</option>
                  <option value="greater_equal">{t('csv_filter.op_greater_equal', { defaultValue: 'Greater or equal (>=)' })}</option>
                  <option value="less_equal">{t('csv_filter.op_less_equal', { defaultValue: 'Less or equal (<=)' })}</option>
                  <option value="is_empty">{t('csv_filter.op_is_empty', { defaultValue: 'Is empty / blank' })}</option>
                  <option value="is_not_empty">{t('csv_filter.op_is_not_empty', { defaultValue: 'Is not empty' })}</option>
                  <option value="regex">{t('csv_filter.op_regex', { defaultValue: 'RegEx match' })}</option>
                </select>
              </div>

              {/* Filter Value */}
              {operator !== 'is_empty' && operator !== 'is_not_empty' && (
                <div className="space-y-2">
                  <label htmlFor="filter-value" className="text-xs font-bold text-slate-400 px-1 uppercase tracking-wider">
                    {t('csv_filter.value_label', { defaultValue: 'Filter Value / Pattern' })}
                  </label>
                  <input
                    id="filter-value"
                    type="text"
                    value={filterValue}
                    onChange={(e) => setFilterValue(e.target.value)}
                    placeholder={t('csv_filter.value_placeholder', { defaultValue: 'Enter comparison value...' })}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-slate-200"
                  />
                </div>
              )}

              {/* Match Action (Keep / Remove) */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 px-1 uppercase tracking-wider">
                  {t('csv_filter.action_mode', { defaultValue: 'Row Action' })}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setAction('keep')}
                    className={`p-2.5 rounded-xl text-xs font-bold transition-all border ${
                      action === 'keep'
                        ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-300'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {t('csv_filter.action_keep', { defaultValue: 'Keep Matching' })}
                  </button>
                  <button
                    onClick={() => setAction('remove')}
                    className={`p-2.5 rounded-xl text-xs font-bold transition-all border ${
                      action === 'remove'
                        ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-300'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {t('csv_filter.action_remove', { defaultValue: 'Remove Matching' })}
                  </button>
                </div>
              </div>

              {/* Case Sensitivity */}
              {operator !== 'is_empty' && operator !== 'is_not_empty' && operator !== 'greater_than' && operator !== 'less_than' && operator !== 'greater_equal' && operator !== 'less_equal' && (
                <button
                  onClick={() => setIsCaseSensitive(!isCaseSensitive)}
                  aria-pressed={isCaseSensitive}
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all font-bold text-xs ${
                    isCaseSensitive
                      ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 text-indigo-600 dark:text-indigo-400'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                  }`}
                >
                  <span>{t('csv_filter.case_sensitive', { defaultValue: 'Case sensitive match' })}</span>
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
