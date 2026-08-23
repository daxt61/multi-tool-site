import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { FileSpreadsheet, Copy, Check, Trash2, Download, Settings2, Info, Sparkles, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Kbd } from './ui/Kbd';
import { toast } from 'sonner';

const MAX_LENGTH = 100000;

export function CSVDelimiterChanger({
  initialData,
  onStateChange,
}: {
  initialData?: any;
  onStateChange?: (state: any) => void;
}) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [input, setInput] = useState<string>(initialData?.input || '');
  const [inputDelimiterMode, setInputDelimiterMode] = useState<string>(initialData?.inputDelimiterMode || 'auto');
  const [customInputDelimiter, setCustomInputDelimiter] = useState<string>(initialData?.customInputDelimiter || '');
  const [outputDelimiterMode, setOutputDelimiterMode] = useState<string>(initialData?.outputDelimiterMode || ';');
  const [customOutputDelimiter, setCustomOutputDelimiter] = useState<string>(initialData?.customOutputDelimiter || '');
  const [quoteHandling, setQuoteHandling] = useState<'smart' | 'always' | 'as_needed' | 'strip'>(
    initialData?.quoteHandling || 'smart'
  );
  const [trimCells, setTrimCells] = useState<boolean>(initialData?.trimCells ?? true);
  const [skipEmptyLines, setSkipEmptyLines] = useState<boolean>(initialData?.skipEmptyLines ?? true);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    onStateChange?.({
      input,
      inputDelimiterMode,
      customInputDelimiter,
      outputDelimiterMode,
      customOutputDelimiter,
      quoteHandling,
      trimCells,
      skipEmptyLines,
    });
  }, [
    input,
    inputDelimiterMode,
    customInputDelimiter,
    outputDelimiterMode,
    customOutputDelimiter,
    quoteHandling,
    trimCells,
    skipEmptyLines,
    onStateChange,
  ]);

  // Helper to resolve actual input delimiter string
  const resolvedInputDelimiter = useMemo(() => {
    if (inputDelimiterMode === 'custom') {
      return customInputDelimiter || ',';
    }
    if (inputDelimiterMode !== 'auto') {
      return inputDelimiterMode === '\\t' ? '\t' : inputDelimiterMode;
    }

    // Auto-detect delimiter from first few non-empty lines
    if (!input) return ',';
    const lines = input.split('\n').filter((l) => l.trim().length > 0);
    if (lines.length === 0) return ',';

    const sample = lines.slice(0, 5).join('\n');
    const commaCount = (sample.match(/,/g) || []).length;
    const semiCount = (sample.match(/;/g) || []).length;
    const tabCount = (sample.match(/\t/g) || []).length;
    const pipeCount = (sample.match(/\|/g) || []).length;
    const colonCount = (sample.match(/:/g) || []).length;

    const counts = [
      { delim: ',', count: commaCount },
      { delim: ';', count: semiCount },
      { delim: '\t', count: tabCount },
      { delim: '|', count: pipeCount },
      { delim: ':', count: colonCount },
    ];

    counts.sort((a, b) => b.count - a.count);
    return counts[0].count > 0 ? counts[0].delim : ',';
  }, [inputDelimiterMode, customInputDelimiter, input]);

  // Helper to resolve actual output delimiter string
  const resolvedOutputDelimiter = useMemo(() => {
    if (outputDelimiterMode === 'custom') {
      return customOutputDelimiter || ';';
    }
    return outputDelimiterMode === '\\t' ? '\t' : outputDelimiterMode;
  }, [outputDelimiterMode, customOutputDelimiter]);

  // Robust CSV parser considering quoted values
  const parseCSVRow = useCallback((line: string, delimiter: string): string[] => {
    const result: string[] = [];
    let currentCell = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentCell += '"';
          i++; // Skip escaped quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        result.push(currentCell);
        currentCell = '';
      } else {
        currentCell += char;
      }
    }
    result.push(currentCell);
    return result;
  }, []);

  // Format cell value according to quote handling and output delimiter
  const formatCell = useCallback(
    (cell: string, targetDelimiter: string): string => {
      let cleaned = cell;
      if (trimCells) {
        cleaned = cleaned.trim();
      }

      if (quoteHandling === 'strip') {
        // Unquote completely
        return cleaned.replace(/"/g, '');
      }

      const needsQuoting =
        quoteHandling === 'always' ||
        (quoteHandling === 'smart' &&
          (cleaned.includes(targetDelimiter) ||
            cleaned.includes('"') ||
            cleaned.includes('\n') ||
            cleaned.includes('\r'))) ||
        (quoteHandling === 'as_needed' &&
          (cleaned.includes(targetDelimiter) || cleaned.includes('"')));

      if (needsQuoting) {
        const escaped = cleaned.replace(/"/g, '""');
        return `"${escaped}"`;
      }

      return cleaned;
    },
    [trimCells, quoteHandling]
  );

  const { output, stats } = useMemo(() => {
    if (!input) {
      return {
        output: '',
        stats: { rows: 0, cols: 0, inputChars: 0, outputChars: 0 },
      };
    }

    if (input.length > MAX_LENGTH) {
      return {
        output: t('error.max_length', { max: MAX_LENGTH.toLocaleString() }),
        stats: { rows: 0, cols: 0, inputChars: input.length, outputChars: 0 },
      };
    }

    const lines = input.split(/\r?\n/);
    let maxCols = 0;
    let processedRowsCount = 0;

    const formattedLines: string[] = [];

    for (const rawLine of lines) {
      if (skipEmptyLines && rawLine.trim() === '') {
        continue;
      }

      const parsedCells = parseCSVRow(rawLine, resolvedInputDelimiter);
      maxCols = Math.max(maxCols, parsedCells.length);
      processedRowsCount++;

      const formattedCells = parsedCells.map((cell) => formatCell(cell, resolvedOutputDelimiter));
      formattedLines.push(formattedCells.join(resolvedOutputDelimiter));
    }

    const resultOutput = formattedLines.join('\n');

    return {
      output: resultOutput,
      stats: {
        rows: processedRowsCount,
        cols: maxCols,
        inputChars: input.length,
        outputChars: resultOutput.length,
      },
    };
  }, [
    input,
    skipEmptyLines,
    resolvedInputDelimiter,
    resolvedOutputDelimiter,
    parseCSVRow,
    formatCell,
    t,
  ]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success(t('common.copied', 'Copied to clipboard!'));
    setTimeout(() => setCopied(false), 2000);
  }, [output, t]);

  const handleDownload = useCallback(() => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `converted-delimiter-${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(t('common.download_success', 'File downloaded!'));
  }, [output, t]);

  const handleClear = useCallback(() => {
    setInput('');
    setInputDelimiterMode('auto');
    setCustomInputDelimiter('');
    setOutputDelimiterMode(';');
    setCustomOutputDelimiter('');
    setQuoteHandling('smart');
    setTrimCells(true);
    setSkipEmptyLines(true);

    if (inputRef.current) {
      inputRef.current.focus();
    }
    toast.success(
      t('csv_delimiter_changer.cleared', 'Inputs cleared and focus restored')
    );
  }, [t]);

  const loadPreset = (preset: 'comma_to_semi' | 'csv_to_tsv' | 'semi_to_pipe' | 'clean_quotes') => {
    if (preset === 'comma_to_semi') {
      setInput('ID,Name,Role,Country\n1,"Doe, John",Engineer,USA\n2,"Smith, Jane",Manager,UK');
      setInputDelimiterMode(',');
      setOutputDelimiterMode(';');
      setQuoteHandling('smart');
      setTrimCells(true);
      setSkipEmptyLines(true);
    } else if (preset === 'csv_to_tsv') {
      setInput('Order_ID,Product,Price,Quantity\n1001,Wireless Mouse,29.99,2\n1002,Mechanical Keyboard,89.50,1');
      setInputDelimiterMode(',');
      setOutputDelimiterMode('\\t');
      setQuoteHandling('smart');
      setTrimCells(true);
      setSkipEmptyLines(true);
    } else if (preset === 'semi_to_pipe') {
      setInput('SKU;Title;Category;Stock\nPROD-01;Laptop Stand;Electronics;45\nPROD-02;Ergonomic Chair;Furniture;12');
      setInputDelimiterMode(';');
      setOutputDelimiterMode('|');
      setQuoteHandling('smart');
      setTrimCells(true);
      setSkipEmptyLines(true);
    } else if (preset === 'clean_quotes') {
      setInput('"Name","Age","City"\n"Alice","30","New York"\n"Bob","25","London"');
      setInputDelimiterMode(',');
      setOutputDelimiterMode(',');
      setQuoteHandling('strip');
      setTrimCells(true);
      setSkipEmptyLines(true);
    }
    toast.success(t('csv_delimiter_changer.preset_loaded', 'Preset loaded!'));
  };

  const handlersRef = useRef({ handleClear, handleCopy });
  useEffect(() => {
    handlersRef.current = { handleClear, handleCopy };
  }, [handleClear, handleCopy]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const active = document.activeElement as HTMLElement | null;
      const isEditable =
        active &&
        (active.tagName === 'INPUT' ||
          active.tagName === 'TEXTAREA' ||
          active.isContentEditable);

      if (e.key === 'Escape') {
        e.preventDefault();
        handlersRef.current.handleClear();
      } else if (
        e.key.toLowerCase() === 'c' &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey &&
        !isEditable
      ) {
        e.preventDefault();
        handlersRef.current.handleCopy();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getDelimiterLabel = (delim: string) => {
    switch (delim) {
      case ',':
        return t('csv_delimiter_changer.comma', 'Comma (,)');
      case ';':
        return t('csv_delimiter_changer.semicolon', 'Semicolon (;)');
      case '\t':
      case '\\t':
        return t('csv_delimiter_changer.tab', 'Tab (\\t)');
      case '|':
        return t('csv_delimiter_changer.pipe', 'Pipe (|)');
      case ':':
        return t('csv_delimiter_changer.colon', 'Colon (:)');
      case ' ':
        return t('csv_delimiter_changer.space', 'Space ( )');
      default:
        return delim;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8" data-testid="csv-delimiter-changer-container">
      {/* Quick Presets */}
      <div className="flex flex-wrap items-center gap-2 p-1">
        <span className="text-xs font-black uppercase tracking-widest text-slate-400 mr-2 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" aria-hidden="true" />
          {t('csv_delimiter_changer.presets_title', 'Quick Presets')}:
        </span>
        <button
          type="button"
          onClick={() => loadPreset('comma_to_semi')}
          className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 border border-slate-200 dark:border-slate-700 hover:border-indigo-500/30 text-slate-600 dark:text-slate-300 transition-all"
        >
          🔄 {t('csv_delimiter_changer.preset_comma_to_semi', 'Comma to Semicolon')}
        </button>
        <button
          type="button"
          onClick={() => loadPreset('csv_to_tsv')}
          className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 border border-slate-200 dark:border-slate-700 hover:border-indigo-500/30 text-slate-600 dark:text-slate-300 transition-all"
        >
          📑 {t('csv_delimiter_changer.preset_csv_to_tsv', 'CSV to TSV (Tab)')}
        </button>
        <button
          type="button"
          onClick={() => loadPreset('semi_to_pipe')}
          className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 border border-slate-200 dark:border-slate-700 hover:border-indigo-500/30 text-slate-600 dark:text-slate-300 transition-all"
        >
          ⚡ {t('csv_delimiter_changer.preset_semi_to_pipe', 'Semicolon to Pipe')}
        </button>
        <button
          type="button"
          onClick={() => loadPreset('clean_quotes')}
          className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 border border-slate-200 dark:border-slate-700 hover:border-indigo-500/30 text-slate-600 dark:text-slate-300 transition-all"
        >
          ✂️ {t('csv_delimiter_changer.preset_clean_quotes', 'Strip All Quotes')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column - Configuration Options */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 px-1">
              <Settings2 className="w-4 h-4 text-indigo-500" aria-hidden="true" />
              {t('common.options', 'Settings')}
            </div>

            <div className="space-y-4">
              {/* Input Delimiter Selection */}
              <div className="space-y-2">
                <label htmlFor="input-delimiter-mode" className="text-[10px] font-bold text-slate-400 uppercase px-1">
                  {t('csv_delimiter_changer.input_delimiter', 'Input Delimiter')}
                </label>
                <select
                  id="input-delimiter-mode"
                  value={inputDelimiterMode}
                  onChange={(e) => setInputDelimiterMode(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold"
                >
                  <option value="auto">
                    {t('csv_delimiter_changer.auto_detect', '✨ Auto Detect')} ({getDelimiterLabel(resolvedInputDelimiter)})
                  </option>
                  <option value=",">{t('csv_delimiter_changer.comma', 'Comma (,)')}</option>
                  <option value=";">{t('csv_delimiter_changer.semicolon', 'Semicolon (;)')}</option>
                  <option value="\t">{t('csv_delimiter_changer.tab', 'Tab (\\t)')}</option>
                  <option value="|">{t('csv_delimiter_changer.pipe', 'Pipe (|)')}</option>
                  <option value=":">{t('csv_delimiter_changer.colon', 'Colon (:)')}</option>
                  <option value=" ">{t('csv_delimiter_changer.space', 'Space ( )')}</option>
                  <option value="custom">{t('csv_delimiter_changer.custom', 'Custom String')}</option>
                </select>

                {inputDelimiterMode === 'custom' && (
                  <input
                    id="custom-input-delimiter"
                    type="text"
                    value={customInputDelimiter}
                    onChange={(e) => setCustomInputDelimiter(e.target.value)}
                    placeholder={t('csv_delimiter_changer.custom_input_placeholder', 'Custom delimiter...')}
                    className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                )}
              </div>

              {/* Output Delimiter Selection */}
              <div className="space-y-2">
                <label htmlFor="output-delimiter-mode" className="text-[10px] font-bold text-slate-400 uppercase px-1">
                  {t('csv_delimiter_changer.output_delimiter', 'New Output Delimiter')}
                </label>
                <select
                  id="output-delimiter-mode"
                  value={outputDelimiterMode}
                  onChange={(e) => setOutputDelimiterMode(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold text-indigo-600 dark:text-indigo-400"
                >
                  <option value=";">{t('csv_delimiter_changer.semicolon', 'Semicolon (;)')}</option>
                  <option value=",">{t('csv_delimiter_changer.comma', 'Comma (,)')}</option>
                  <option value="\t">{t('csv_delimiter_changer.tab', 'Tab (\\t)')}</option>
                  <option value="|">{t('csv_delimiter_changer.pipe', 'Pipe (|)')}</option>
                  <option value=":">{t('csv_delimiter_changer.colon', 'Colon (:)')}</option>
                  <option value=" ">{t('csv_delimiter_changer.space', 'Space ( )')}</option>
                  <option value="custom">{t('csv_delimiter_changer.custom', 'Custom String')}</option>
                </select>

                {outputDelimiterMode === 'custom' && (
                  <input
                    id="custom-output-delimiter"
                    type="text"
                    value={customOutputDelimiter}
                    onChange={(e) => setCustomOutputDelimiter(e.target.value)}
                    placeholder={t('csv_delimiter_changer.custom_output_placeholder', 'Custom output delimiter...')}
                    className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                )}
              </div>

              {/* Quote Handling */}
              <div className="space-y-2">
                <label htmlFor="quote-handling" className="text-[10px] font-bold text-slate-400 uppercase px-1">
                  {t('csv_delimiter_changer.quote_handling', 'Quote Handling')}
                </label>
                <select
                  id="quote-handling"
                  value={quoteHandling}
                  onChange={(e) => setQuoteHandling(e.target.value as any)}
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold"
                >
                  <option value="smart">{t('csv_delimiter_changer.quote_smart', 'Smart (Quote if delimiter or newline present)')}</option>
                  <option value="always">{t('csv_delimiter_changer.quote_always', 'Always Quote Every Cell')}</option>
                  <option value="as_needed">{t('csv_delimiter_changer.quote_as_needed', 'As Needed Only')}</option>
                  <option value="strip">{t('csv_delimiter_changer.quote_strip', 'Strip All Quotes')}</option>
                </select>
              </div>

              {/* Checkbox Toggles */}
              <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={trimCells}
                    onChange={(e) => setTrimCells(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    {t('csv_delimiter_changer.trim_cells', 'Trim cell whitespace')}
                  </span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={skipEmptyLines}
                    onChange={(e) => setSkipEmptyLines(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    {t('csv_delimiter_changer.skip_empty_lines', 'Skip empty lines')}
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Dataset Statistics */}
          <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">
              {t('csv_delimiter_changer.stats_title', 'Dataset Analytics')}
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block text-[10px] font-bold uppercase">{t('csv_delimiter_changer.rows_count', 'Rows')}</span>
                <span className="font-mono text-base font-bold text-indigo-600 dark:text-indigo-400">{stats.rows}</span>
              </div>
              <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block text-[10px] font-bold uppercase">{t('csv_delimiter_changer.cols_count', 'Columns')}</span>
                <span className="font-mono text-base font-bold text-indigo-600 dark:text-indigo-400">{stats.cols}</span>
              </div>
              <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block text-[10px] font-bold uppercase">{t('csv_delimiter_changer.input_chars', 'Input Chars')}</span>
                <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-300">{stats.inputChars}</span>
              </div>
              <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block text-[10px] font-bold uppercase">{t('csv_delimiter_changer.output_chars', 'Output Chars')}</span>
                <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">{stats.outputChars}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right column - Input and Output textareas */}
        <div className="lg:col-span-2 space-y-6">
          {/* Input Text Area */}
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="csv-delimiter-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-indigo-500" aria-hidden="true" />
                {t('common.input', 'Input CSV / TSV')}
              </label>
              <button
                type="button"
                onClick={handleClear}
                className="text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none rounded-lg px-2 py-1"
                aria-label={t('common.clear', 'Clear')}
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                {t('common.clear', 'Clear')}
                <Kbd modifier={null} className="ml-1 border-rose-200 dark:border-rose-800 text-rose-400 dark:bg-slate-900">
                  Esc
                </Kbd>
              </button>
            </div>
            <textarea
              id="csv-delimiter-input"
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('csv_delimiter_changer.placeholder', 'Paste your CSV or TSV data here...\ne.g. ID,Name,Price\n1,Widget,10.99')}
              className="w-full h-64 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
            />
          </div>

          {/* Output Text Area */}
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="csv-delimiter-output" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-emerald-500" aria-hidden="true" />
                {t('csv_delimiter_changer.converted_output', 'Converted Result')}
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={!output}
                  className="text-xs font-bold px-3 py-1.5 rounded-xl text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 transition-all flex items-center gap-1 disabled:opacity-50"
                  aria-label={t('common.download', 'Download')}
                >
                  <Download className="w-3.5 h-3.5" aria-hidden="true" />
                  {t('common.download', 'Download')}
                </button>
                <button
                  type="button"
                  onClick={handleCopy}
                  disabled={!output}
                  className={`text-xs font-bold px-4 py-1.5 rounded-xl transition-all flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                    copied
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200'
                      : 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700 hover:border-indigo-500/50'
                  } disabled:opacity-50`}
                >
                  {copied ? <Check className="w-3.5 h-3.5" aria-hidden="true" /> : <Copy className="w-3.5 h-3.5" aria-hidden="true" />}
                  {copied ? t('common.copied', 'Copied!') : t('common.copy', 'Copy')}
                  <Kbd className="ml-1 bg-white/50 dark:bg-slate-700/20 border-slate-300 dark:border-slate-700 text-slate-400">
                    C
                  </Kbd>
                </button>
              </div>
            </div>
            <textarea
              id="csv-delimiter-output"
              value={output}
              readOnly
              className="w-full h-64 p-6 bg-slate-900 text-emerald-300 border border-slate-800 rounded-[2rem] outline-none font-mono text-sm leading-relaxed resize-none"
              placeholder={t('common.waiting', 'Awaiting input...')}
            />
          </div>
        </div>
      </div>

      {/* Educational Block */}
      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <Info className="w-6 h-6 text-indigo-500 mt-1 shrink-0" aria-hidden="true" />
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">
            {t('csv_delimiter_changer.about_title', 'About CSV Delimiter Converter')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t(
              'csv_delimiter_changer.about_text',
              'Convert delimiters in CSV or TSV files (comma, semicolon, tab, pipe, colon) seamlessly without corrupting enclosed text quotes. Includes quote escaping rules, trimming, and instant file export.'
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
