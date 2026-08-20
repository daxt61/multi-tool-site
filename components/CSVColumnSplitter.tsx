import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { FileSpreadsheet, Copy, Check, Trash2, Download, Settings2, Sliders, Split, Sparkles } from 'lucide-react';
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

interface Preset {
  id: string;
  nameKey: string;
  inputDelimiter: string;
  outputDelimiter: string;
  hasHeader: boolean;
  targetColumn: number;
  splitDelimiter: string;
  newHeaders: string;
  placement: 'replace' | 'append';
  trimValues: boolean;
  maxSplits: number;
  input: string;
}

const PRESETS: Preset[] = [
  {
    id: 'fullname',
    nameKey: 'csv_splitter.preset_fullname',
    inputDelimiter: ',',
    outputDelimiter: ',',
    hasHeader: true,
    targetColumn: 0,
    splitDelimiter: ' ',
    newHeaders: 'FirstName, LastName',
    placement: 'replace',
    trimValues: true,
    maxSplits: 2,
    input: `FullName,Department,Salary\nAlice Smith,Engineering,85000\nBob Jones,Marketing,72000\nCharlie Brown,Finance,90000\nDiana Prince,Management,95000`,
  },
  {
    id: 'date',
    nameKey: 'csv_splitter.preset_date',
    inputDelimiter: ';',
    outputDelimiter: ';',
    hasHeader: true,
    targetColumn: 1,
    splitDelimiter: '-',
    newHeaders: 'Year, Month, Day',
    placement: 'replace',
    trimValues: true,
    maxSplits: 3,
    input: `User;JoinedDate;Role\nJean Dupont;2023-05-15;Admin\nMarie Curie;2022-11-03;User\nPierre Martin;2024-01-20;Editor`,
  },
  {
    id: 'address',
    nameKey: 'csv_splitter.preset_address',
    inputDelimiter: ',',
    outputDelimiter: ',',
    hasHeader: true,
    targetColumn: 1,
    splitDelimiter: '|',
    newHeaders: 'City, State, Zip',
    placement: 'append',
    trimValues: true,
    maxSplits: 3,
    input: `Customer,Location\nAlice,Springfield|IL|62701\nBob,Metropolis|NY|10001\nCharlie,Gotham|NJ|07001`,
  },
];

export function CSVColumnSplitter({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [input, setInput] = useState(initialData?.input || '');
  const [inputDelimiter, setInputDelimiter] = useState(initialData?.inputDelimiter || ',');
  const [outputDelimiter, setOutputDelimiter] = useState(initialData?.outputDelimiter || ',');
  const [targetColumn, setTargetColumn] = useState<number>(initialData?.targetColumn ?? 0);
  const [hasHeader, setHasHeader] = useState(initialData?.hasHeader ?? true);
  const [splitDelimiter, setSplitDelimiter] = useState(initialData?.splitDelimiter || ' ');
  const [newHeaders, setNewHeaders] = useState(initialData?.newHeaders || 'Part1, Part2');
  const [placement, setPlacement] = useState<'replace' | 'append'>(initialData?.placement || 'replace');
  const [trimValues, setTrimValues] = useState(initialData?.trimValues ?? true);
  const [maxSplits, setMaxSplits] = useState<number>(initialData?.maxSplits || 0);
  const [copied, setCopied] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    onStateChange?.({
      input,
      inputDelimiter,
      outputDelimiter,
      targetColumn,
      hasHeader,
      splitDelimiter,
      newHeaders,
      placement,
      trimValues,
      maxSplits,
    });
  }, [input, inputDelimiter, outputDelimiter, targetColumn, hasHeader, splitDelimiter, newHeaders, placement, trimValues, maxSplits, onStateChange]);

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

  const columns = useMemo(() => {
    if (parsedData.length === 0) return [];
    const maxCols = Math.max(...parsedData.map((row: string[]) => row.length));
    const headerRow = hasHeader ? parsedData[0] : [];

    return Array.from({ length: maxCols }, (_, i) => ({
      index: i,
      name: headerRow[i] || `${t('csv_splitter.col_default', { defaultValue: 'Column' })} ${i + 1}`,
    }));
  }, [parsedData, hasHeader, t]);

  const formatCell = (val: string, delim: string) => {
    if (val.includes(delim) || val.includes('"') || val.includes('\n')) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  };

  const output = useMemo(() => {
    if (parsedData.length === 0) return '';

    const headerNames = newHeaders
      .split(',')
      .map((s: string) => s.trim())
      .filter(Boolean);

    // Calculate maximum number of split parts across rows to align columns correctly
    let calculatedMaxParts = 1;
    const splitRowsData = parsedData.map((row: string[], rowIndex: number) => {
      if (hasHeader && rowIndex === 0) return [];
      const val = row[targetColumn] || '';
      let parts: string[];
      if (!splitDelimiter) {
        parts = [val];
      } else if (maxSplits > 0) {
        const rawParts = val.split(splitDelimiter);
        if (rawParts.length > maxSplits) {
          parts = [
            ...rawParts.slice(0, maxSplits - 1),
            rawParts.slice(maxSplits - 1).join(splitDelimiter)
          ];
        } else {
          parts = rawParts;
        }
      } else {
        parts = val.split(splitDelimiter);
      }
      if (trimValues) {
        parts = parts.map(p => p.trim());
      }
      if (parts.length > calculatedMaxParts) {
        calculatedMaxParts = parts.length;
      }
      return parts;
    });

    const totalSplitCols = Math.max(headerNames.length, calculatedMaxParts);

    return parsedData.map((row: string[], rowIndex: number) => {
      if (hasHeader && rowIndex === 0) {
        // Header Row
        const generatedHeaders = Array.from({ length: totalSplitCols }, (_, i) => {
          return headerNames[i] || `${row[targetColumn] || 'Split'}_${i + 1}`;
        });

        if (placement === 'replace') {
          const newRow: string[] = [];
          row.forEach((cell, i) => {
            if (i === targetColumn) {
              generatedHeaders.forEach(gh => newRow.push(formatCell(gh, outputDelimiter)));
            } else {
              newRow.push(formatCell(cell, outputDelimiter));
            }
          });
          return newRow.join(outputDelimiter);
        } else {
          // Append mode
          const newRow = row.map(cell => formatCell(cell, outputDelimiter));
          generatedHeaders.forEach(gh => newRow.push(formatCell(gh, outputDelimiter)));
          return newRow.join(outputDelimiter);
        }
      }

      // Data Rows
      const splitParts = splitRowsData[rowIndex] || [];
      const paddedParts = Array.from({ length: totalSplitCols }, (_, i) => splitParts[i] || '');

      if (placement === 'replace') {
        const newRow: string[] = [];
        row.forEach((cell, i) => {
          if (i === targetColumn) {
            paddedParts.forEach(part => newRow.push(formatCell(part, outputDelimiter)));
          } else {
            newRow.push(formatCell(cell, outputDelimiter));
          }
        });
        return newRow.join(outputDelimiter);
      } else {
        // Append mode
        const newRow = row.map(cell => formatCell(cell, outputDelimiter));
        paddedParts.forEach(part => newRow.push(formatCell(part, outputDelimiter)));
        return newRow.join(outputDelimiter);
      }
    }).join('\n');
  }, [parsedData, targetColumn, hasHeader, splitDelimiter, newHeaders, placement, trimValues, maxSplits, outputDelimiter]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success(t('csv_splitter.toast_copied', { defaultValue: 'Split CSV copied to clipboard!' }));
    setTimeout(() => setCopied(false), 2000);
  }, [output, t]);

  const handleDownload = useCallback(() => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `split-csv-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(t('csv_splitter.toast_downloaded', { defaultValue: 'CSV file downloaded!' }));
  }, [output, t]);

  const handleClear = useCallback(() => {
    setInput('');
    toast.success(t('csv_splitter.toast_cleared', { defaultValue: 'Input cleared!' }));
    inputRef.current?.focus();
  }, [t]);

  const applyPreset = useCallback((preset: Preset) => {
    setInput(preset.input);
    setInputDelimiter(preset.inputDelimiter);
    setOutputDelimiter(preset.outputDelimiter);
    setHasHeader(preset.hasHeader);
    setTargetColumn(preset.targetColumn);
    setSplitDelimiter(preset.splitDelimiter);
    setNewHeaders(preset.newHeaders);
    setPlacement(preset.placement);
    setTrimValues(preset.trimValues);
    setMaxSplits(preset.maxSplits);
    toast.success(t('csv_splitter.toast_preset_loaded', { defaultValue: 'Preset loaded!' }));
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
    <div className="max-w-6xl mx-auto space-y-8" data-testid="csv-splitter-container">
      {/* Presets Bar */}
      <div className="flex flex-wrap items-center gap-2 p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mr-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
          {t('csv_splitter.presets', { defaultValue: 'Quick Presets' })}:
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
        <div className="lg:col-span-8 space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="csv-splitter-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
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
              id="csv-splitter-input"
              ref={inputRef}
              value={input}
              maxLength={MAX_LENGTH}
              onChange={(e) => setInput(e.target.value.slice(0, MAX_LENGTH))}
              placeholder={t('csv_splitter.placeholder_input', { defaultValue: 'FullName,Department\nJohn Doe,Engineering' })}
              className="w-full h-64 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none shadow-sm"
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="csv-splitter-output" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Split className="w-4 h-4 text-emerald-500" aria-hidden="true" /> {t('common.output')} CSV
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
              id="csv-splitter-output"
              value={output}
              readOnly
              placeholder={t('csv_splitter.placeholder_output', { defaultValue: 'Resulting split CSV will appear here...' })}
              className="w-full h-64 p-6 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-mono text-sm leading-relaxed text-indigo-600 dark:text-indigo-400 resize-none shadow-sm"
            />
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="p-8 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2rem] space-y-6">
            <div className="flex items-center gap-2 px-1">
              <Settings2 className="w-4 h-4 text-indigo-500" aria-hidden="true" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{t('common.options')}</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 px-1 uppercase tracking-wider">{t('csv_splitter.input_delimiter', { defaultValue: 'Input CSV Delimiter' })}</label>
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
                <label className="text-xs font-bold text-slate-400 px-1 uppercase tracking-wider">{t('csv_splitter.output_delimiter', { defaultValue: 'Output CSV Delimiter' })}</label>
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

              <div className="space-y-2">
                <label htmlFor="split-delimiter" className="text-xs font-bold text-slate-400 px-1 uppercase tracking-wider block">
                  {t('csv_splitter.split_delimiter_label', { defaultValue: 'Column Split Delimiter' })}
                </label>
                <input
                  id="split-delimiter"
                  type="text"
                  value={splitDelimiter}
                  onChange={(e) => setSplitDelimiter(e.target.value)}
                  placeholder="e.g. space, dash, comma..."
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="new-headers" className="text-xs font-bold text-slate-400 px-1 uppercase tracking-wider block">
                  {t('csv_splitter.new_headers_label', { defaultValue: 'New Column Headers (Comma separated)' })}
                </label>
                <input
                  id="new-headers"
                  type="text"
                  value={newHeaders}
                  onChange={(e) => setNewHeaders(e.target.value)}
                  placeholder="Part1, Part2, Part3"
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 px-1 uppercase tracking-wider block">
                  {t('csv_splitter.placement_label', { defaultValue: 'Placement Mode' })}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setPlacement('replace')}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                      placement === 'replace'
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {t('csv_splitter.placement_replace', { defaultValue: 'Replace Original' })}
                  </button>
                  <button
                    onClick={() => setPlacement('append')}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                      placement === 'append'
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {t('csv_splitter.placement_append', { defaultValue: 'Append to End' })}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="max-splits" className="text-xs font-bold text-slate-400 px-1 uppercase tracking-wider block">
                  {t('csv_splitter.max_splits_label', { defaultValue: 'Max Splits (0 = Unlimited)' })}
                </label>
                <input
                  id="max-splits"
                  type="number"
                  min={0}
                  max={20}
                  value={maxSplits}
                  onChange={(e) => setMaxSplits(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <button
                onClick={() => setHasHeader(!hasHeader)}
                className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all font-bold text-xs ${
                  hasHeader
                    ? 'bg-white dark:bg-slate-800 border-indigo-500/50 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                }`}
              >
                <span>{t('csv_splitter.has_header', { defaultValue: 'Input Has Header Row' })}</span>
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${hasHeader ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300'}`}>
                  {hasHeader && <Check className="w-2.5 h-2.5 text-white" aria-hidden="true" />}
                </div>
              </button>

              <button
                onClick={() => setTrimValues(!trimValues)}
                className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all font-bold text-xs ${
                  trimValues
                    ? 'bg-white dark:bg-slate-800 border-indigo-500/50 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                }`}
              >
                <span>{t('csv_splitter.trim_values', { defaultValue: 'Trim Whitespace from Values' })}</span>
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${trimValues ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300'}`}>
                  {trimValues && <Check className="w-2.5 h-2.5 text-white" aria-hidden="true" />}
                </div>
              </button>
            </div>
          </div>

          <div className="p-8 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-[2rem] space-y-6 shadow-sm">
            <div className="flex items-center gap-2 px-1">
              <Sliders className="w-4 h-4 text-indigo-500" aria-hidden="true" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{t('csv_splitter.target_column', { defaultValue: 'Target Column to Split' })}</h3>
            </div>

            <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 no-scrollbar">
              {columns.length > 0 ? columns.map(col => (
                <button
                  key={col.index}
                  onClick={() => setTargetColumn(col.index)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all font-bold text-xs ${
                    targetColumn === col.index
                      ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500 hover:border-slate-200'
                  }`}
                >
                  <span className="truncate">{col.name}</span>
                  {targetColumn === col.index && <Check className="w-3.5 h-3.5" aria-hidden="true" />}
                </button>
              )) : (
                <p className="text-sm text-slate-400 italic text-center py-4">{t('csv_splitter.empty_cols', { defaultValue: 'No columns detected' })}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
