import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { FileSpreadsheet, Copy, Check, Trash2, Download, Settings2, Sliders, ArrowUp, ArrowDown, ArrowUpDown, Sparkles, Eye, EyeOff } from 'lucide-react';
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

export interface ColumnItem {
  originalIndex: number;
  name: string;
  customName: string;
  enabled: boolean;
}

interface Preset {
  id: string;
  nameKey: string;
  inputDelimiter: string;
  outputDelimiter: string;
  hasHeader: boolean;
  columnOrderIndices: number[]; // order of original indices
  customNames?: Record<number, string>;
  input: string;
}

const PRESETS: Preset[] = [
  {
    id: 'id_first',
    nameKey: 'csv_reorder.preset_id_first',
    inputDelimiter: ',',
    outputDelimiter: ',',
    hasHeader: true,
    columnOrderIndices: [3, 0, 1, 2], // Move ID (index 3) to front
    input: `FirstName,LastName,Department,ID\nAlice,Smith,Engineering,USR-101\nBob,Jones,Marketing,USR-102\nCharlie,Brown,Finance,USR-103`,
  },
  {
    id: 'user_directory',
    nameKey: 'csv_reorder.preset_user_directory',
    inputDelimiter: ',',
    outputDelimiter: ',',
    hasHeader: true,
    columnOrderIndices: [1, 0, 2, 3], // LastName, FirstName, Email, Role
    customNames: { 0: 'First Name', 1: 'Last Name' },
    input: `FirstName,LastName,Email,Role\nAlice,Smith,alice@example.com,Admin\nBob,Jones,bob@example.com,Editor\nCharlie,Brown,charlie@example.com,Viewer`,
  },
  {
    id: 'sales_summary',
    nameKey: 'csv_reorder.preset_sales_summary',
    inputDelimiter: ';',
    outputDelimiter: ';',
    hasHeader: true,
    columnOrderIndices: [2, 0, 1, 3], // Date, Region, Product, Revenue
    input: `Product;Region;Date;Revenue\nWidget A;North;2025-01-15;1500\nGadget B;South;2025-01-16;2300\nWidget C;West;2025-01-17;1800`,
  },
];

export function CSVColumnReorderer({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [input, setInput] = useState(initialData?.input || '');
  const [inputDelimiter, setInputDelimiter] = useState(initialData?.inputDelimiter || ',');
  const [outputDelimiter, setOutputDelimiter] = useState(initialData?.outputDelimiter || ',');
  const [hasHeader, setHasHeader] = useState(initialData?.hasHeader ?? true);
  const [columnOrder, setColumnOrder] = useState<ColumnItem[]>(initialData?.columnOrder || []);
  const [copied, setCopied] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    onStateChange?.({
      input,
      inputDelimiter,
      outputDelimiter,
      hasHeader,
      columnOrder,
    });
  }, [input, inputDelimiter, outputDelimiter, hasHeader, columnOrder, onStateChange]);

  const parseCSVLine = (line: string, delim: string) => {
    const result = [];
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

  const parsedData = useMemo(() => {
    if (!input.trim()) return [];
    const lines = input.trim().split(/\r?\n/);
    return lines.map((line: string) => parseCSVLine(line, inputDelimiter));
  }, [input, inputDelimiter]);

  // Sync detected columns with columnOrder
  const detectedColsCount = useMemo(() => {
    if (parsedData.length === 0) return 0;
    return Math.max(...parsedData.map((row: string[]) => row.length));
  }, [parsedData]);

  useEffect(() => {
    if (detectedColsCount === 0) {
      setColumnOrder([]);
      return;
    }

    const headerRow = hasHeader && parsedData.length > 0 ? parsedData[0] : [];

    setColumnOrder(prevOrder => {
      // Build updated list maintaining existing order where possible
      const existingMap = new Map<number, ColumnItem>();
      prevOrder.forEach(item => existingMap.set(item.originalIndex, item));

      const newItems: ColumnItem[] = [];
      // Keep items from prevOrder that are within detected range
      prevOrder.forEach(item => {
        if (item.originalIndex < detectedColsCount) {
          const defaultName = headerRow[item.originalIndex] || `${t('csv_reorder.col_default', { defaultValue: 'Column' })} ${item.originalIndex + 1}`;
          newItems.push({
            ...item,
            name: defaultName,
          });
        }
      });

      // Append any newly detected columns not in existing list
      for (let i = 0; i < detectedColsCount; i++) {
        if (!existingMap.has(i)) {
          const defaultName = headerRow[i] || `${t('csv_reorder.col_default', { defaultValue: 'Column' })} ${i + 1}`;
          newItems.push({
            originalIndex: i,
            name: defaultName,
            customName: '',
            enabled: true,
          });
        }
      }

      return newItems;
    });
  }, [detectedColsCount, hasHeader, parsedData, t]);

  const formatCell = (val: string, delim: string) => {
    if (val.includes(delim) || val.includes('"') || val.includes('\n')) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  };

  const output = useMemo(() => {
    if (parsedData.length === 0 || columnOrder.length === 0) return '';

    const activeCols = columnOrder.filter(c => c.enabled);
    if (activeCols.length === 0) return '';

    return parsedData.map((row: string[], rowIndex: number) => {
      if (hasHeader && rowIndex === 0) {
        // Header Row
        return activeCols.map(col => {
          const colTitle = col.customName.trim() || col.name;
          return formatCell(colTitle, outputDelimiter);
        }).join(outputDelimiter);
      }

      // Data Row
      return activeCols.map(col => {
        const val = row[col.originalIndex] || '';
        return formatCell(val, outputDelimiter);
      }).join(outputDelimiter);
    }).join('\n');
  }, [parsedData, columnOrder, hasHeader, outputDelimiter]);

  const moveColumn = (index: number, direction: 'up' | 'down') => {
    setColumnOrder(prev => {
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const next = [...prev];
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      return next;
    });
  };

  const toggleColumnEnabled = (index: number) => {
    setColumnOrder(prev => prev.map((item, i) => i === index ? { ...item, enabled: !item.enabled } : item));
  };

  const updateCustomName = (index: number, value: string) => {
    setColumnOrder(prev => prev.map((item, i) => i === index ? { ...item, customName: value } : item));
  };

  const sortAlphabetical = () => {
    setColumnOrder(prev => [...prev].sort((a, b) => {
      const nameA = (a.customName.trim() || a.name).toLowerCase();
      const nameB = (b.customName.trim() || b.name).toLowerCase();
      return nameA.localeCompare(nameB);
    }));
    toast.success(t('csv_reorder.toast_sorted_az', { defaultValue: 'Columns sorted alphabetically (A-Z)' }));
  };

  const sortReverseAlphabetical = () => {
    setColumnOrder(prev => [...prev].sort((a, b) => {
      const nameA = (a.customName.trim() || a.name).toLowerCase();
      const nameB = (b.customName.trim() || b.name).toLowerCase();
      return nameB.localeCompare(nameA);
    }));
    toast.success(t('csv_reorder.toast_sorted_za', { defaultValue: 'Columns sorted in reverse (Z-A)' }));
  };

  const reverseOrder = () => {
    setColumnOrder(prev => [...prev].reverse());
    toast.success(t('csv_reorder.toast_reversed', { defaultValue: 'Column order reversed!' }));
  };

  const resetOriginalOrder = () => {
    setColumnOrder(prev => [...prev].sort((a, b) => a.originalIndex - b.originalIndex).map(c => ({ ...c, enabled: true, customName: '' })));
    toast.success(t('csv_reorder.toast_reset', { defaultValue: 'Reset to original column order!' }));
  };

  const toggleSelectAll = () => {
    setColumnOrder(prev => {
      const allEnabled = prev.every(c => c.enabled);
      return prev.map(c => ({ ...c, enabled: !allEnabled }));
    });
  };

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success(t('csv_reorder.toast_copied', { defaultValue: 'Reordered CSV copied to clipboard!' }));
    setTimeout(() => setCopied(false), 2000);
  }, [output, t]);

  const handleDownload = useCallback(() => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reordered-csv-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(t('csv_reorder.toast_downloaded', { defaultValue: 'CSV file downloaded!' }));
  }, [output, t]);

  const handleClear = useCallback(() => {
    setInput('');
    setColumnOrder([]);
    toast.success(t('csv_reorder.toast_cleared', { defaultValue: 'Input cleared!' }));
    inputRef.current?.focus();
  }, [t]);

  const applyPreset = useCallback((preset: Preset) => {
    setInput(preset.input);
    setInputDelimiter(preset.inputDelimiter);
    setOutputDelimiter(preset.outputDelimiter);
    setHasHeader(preset.hasHeader);

    // Parse input lines to establish original columns
    const lines = preset.input.trim().split(/\r?\n/);
    const firstRow = lines.length > 0 ? parseCSVLine(lines[0], preset.inputDelimiter) : [];
    const maxCols = firstRow.length;

    const newOrder: ColumnItem[] = [];
    preset.columnOrderIndices.forEach(origIdx => {
      if (origIdx < maxCols) {
        const defaultName = preset.hasHeader && firstRow[origIdx] ? firstRow[origIdx] : `Column ${origIdx + 1}`;
        newOrder.push({
          originalIndex: origIdx,
          name: defaultName,
          customName: preset.customNames?.[origIdx] || '',
          enabled: true,
        });
      }
    });

    // Append any remaining indices not specified in preset
    for (let i = 0; i < maxCols; i++) {
      if (!preset.columnOrderIndices.includes(i)) {
        const defaultName = preset.hasHeader && firstRow[i] ? firstRow[i] : `Column ${i + 1}`;
        newOrder.push({
          originalIndex: i,
          name: defaultName,
          customName: preset.customNames?.[i] || '',
          enabled: true,
        });
      }
    }

    setColumnOrder(newOrder);
    toast.success(t('csv_reorder.toast_preset_loaded', { defaultValue: 'Preset loaded!' }));
  }, [t]);

  // Keyboard shortcut safeguard
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
    <div className="max-w-6xl mx-auto space-y-8" data-testid="csv-reorder-container">
      {/* Presets Bar */}
      <div className="flex flex-wrap items-center gap-2 p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mr-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
          {t('csv_reorder.presets', { defaultValue: 'Quick Presets' })}:
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
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="csv-reorder-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-indigo-500" aria-hidden="true" /> {t('common.input')} CSV
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
              id="csv-reorder-input"
              ref={inputRef}
              value={input}
              maxLength={MAX_LENGTH}
              onChange={(e) => setInput(e.target.value.slice(0, MAX_LENGTH))}
              placeholder={t('csv_reorder.placeholder_input', { defaultValue: 'FirstName,LastName,Department,ID\nJohn,Doe,Engineering,USR-101' })}
              className="w-full h-64 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none shadow-sm"
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="csv-reorder-output" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4 text-emerald-500" aria-hidden="true" /> {t('common.output')} CSV
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
              id="csv-reorder-output"
              value={output}
              readOnly
              placeholder={t('csv_reorder.placeholder_output', { defaultValue: 'Reordered CSV will appear here...' })}
              className="w-full h-64 p-6 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-mono text-sm leading-relaxed text-indigo-600 dark:text-indigo-400 resize-none shadow-sm"
            />
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2rem] space-y-6">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-indigo-500" aria-hidden="true" />
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{t('common.options')}</h3>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 px-1 uppercase tracking-wider">{t('csv_reorder.input_delimiter', { defaultValue: 'Input CSV Delimiter' })}</label>
                <div className="flex flex-wrap gap-2">
                  {DELIMITERS.map(d => (
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
                <label className="text-xs font-bold text-slate-400 px-1 uppercase tracking-wider">{t('csv_reorder.output_delimiter', { defaultValue: 'Output CSV Delimiter' })}</label>
                <div className="flex flex-wrap gap-2">
                  {DELIMITERS.map(d => (
                    <button
                      key={`out-${d.value}`}
                      onClick={() => setOutputDelimiter(d.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                        outputDelimiter === d.value
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-emerald-500/50'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setHasHeader(!hasHeader)}
                className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all font-bold text-xs ${
                  hasHeader
                    ? 'bg-white dark:bg-slate-800 border-indigo-500/50 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                }`}
              >
                <span>{t('csv_reorder.has_header', { defaultValue: 'Input Has Header Row' })}</span>
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${hasHeader ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300'}`}>
                  {hasHeader && <Check className="w-2.5 h-2.5 text-white" aria-hidden="true" />}
                </div>
              </button>
            </div>
          </div>

          <div className="p-6 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-[2rem] space-y-6 shadow-sm">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-500" aria-hidden="true" />
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{t('csv_reorder.reorder_columns', { defaultValue: 'Arrange & Rename Columns' })}</h3>
              </div>
              <span className="text-xs font-semibold text-slate-400">
                {columnOrder.filter(c => c.enabled).length} / {columnOrder.length} {t('csv_reorder.cols_active', { defaultValue: 'active' })}
              </span>
            </div>

            {/* Quick Sort Actions */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={sortAlphabetical}
                disabled={columnOrder.length === 0}
                className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 transition-all disabled:opacity-50"
              >
                {t('csv_reorder.sort_az', { defaultValue: 'Sort A-Z' })}
              </button>
              <button
                onClick={sortReverseAlphabetical}
                disabled={columnOrder.length === 0}
                className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 transition-all disabled:opacity-50"
              >
                {t('csv_reorder.sort_za', { defaultValue: 'Sort Z-A' })}
              </button>
              <button
                onClick={reverseOrder}
                disabled={columnOrder.length === 0}
                className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 transition-all disabled:opacity-50"
              >
                {t('csv_reorder.reverse_order', { defaultValue: 'Reverse Order' })}
              </button>
              <button
                onClick={resetOriginalOrder}
                disabled={columnOrder.length === 0}
                className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 transition-all disabled:opacity-50"
              >
                {t('csv_reorder.reset_order', { defaultValue: 'Reset Order' })}
              </button>
            </div>

            <div className="flex justify-end px-1">
              <button
                onClick={toggleSelectAll}
                disabled={columnOrder.length === 0}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline disabled:opacity-50"
              >
                {columnOrder.every(c => c.enabled)
                  ? t('csv_reorder.deselect_all', { defaultValue: 'Deselect All' })
                  : t('csv_reorder.select_all', { defaultValue: 'Select All' })}
              </button>
            </div>

            {/* Column Order List */}
            <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1 no-scrollbar">
              {columnOrder.length > 0 ? columnOrder.map((col, idx) => (
                <div
                  key={`col-${col.originalIndex}`}
                  className={`p-3.5 rounded-2xl border transition-all space-y-2 ${
                    col.enabled
                      ? 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700'
                      : 'bg-slate-100/50 dark:bg-slate-900/50 border-slate-200/50 dark:border-slate-800 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-5 h-5 flex items-center justify-center bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-black shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                        {col.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => moveColumn(idx, 'up')}
                        disabled={idx === 0}
                        aria-label={`Move ${col.name} up`}
                        className="p-1 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                      >
                        <ArrowUp className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                      <button
                        onClick={() => moveColumn(idx, 'down')}
                        disabled={idx === columnOrder.length - 1}
                        aria-label={`Move ${col.name} down`}
                        className="p-1 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                      >
                        <ArrowDown className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                      <button
                        onClick={() => toggleColumnEnabled(idx)}
                        aria-label={col.enabled ? `Disable ${col.name}` : `Enable ${col.name}`}
                        className={`p-1 rounded-lg transition-colors ${
                          col.enabled
                            ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20'
                            : 'text-slate-400 bg-slate-200 dark:bg-slate-700'
                        }`}
                      >
                        {col.enabled ? <Eye className="w-3.5 h-3.5" aria-hidden="true" /> : <EyeOff className="w-3.5 h-3.5" aria-hidden="true" />}
                      </button>
                    </div>
                  </div>

                  {col.enabled && (
                    <div>
                      <input
                        type="text"
                        value={col.customName}
                        onChange={(e) => updateCustomName(idx, e.target.value)}
                        placeholder={t('csv_reorder.rename_placeholder', { defaultValue: 'Custom header (optional)' })}
                        className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  )}
                </div>
              )) : (
                <p className="text-sm text-slate-400 italic text-center py-6">{t('csv_reorder.empty_cols', { defaultValue: 'No columns detected in input CSV' })}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
