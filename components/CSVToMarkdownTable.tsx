import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Table, Copy, Check, Trash2, Download, Sparkles, Sliders, AlertCircle, Info, FileSpreadsheet } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;

export function CSVToMarkdownTable({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [input, setInput] = useState<string>(initialData?.input || '');
  const [delimiter, setDelimiter] = useState<string>(initialData?.delimiter || 'auto');
  const [customDelim, setCustomDelim] = useState<string>(initialData?.customDelim || '');
  const [hasHeader, setHasHeader] = useState<boolean>(initialData?.hasHeader ?? true);
  const [globalAlign, setGlobalAlign] = useState<'left' | 'center' | 'right'>(initialData?.globalAlign || 'left');
  const [prettyPadding, setPrettyPadding] = useState<boolean>(initialData?.prettyPadding ?? true);

  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state with parent dashboard
  useEffect(() => {
    onStateChange?.({
      input,
      delimiter,
      customDelim,
      hasHeader,
      globalAlign,
      prettyPadding,
    });
  }, [input, delimiter, customDelim, hasHeader, globalAlign, prettyPadding, onStateChange]);

  const handleInputChange = (val: string) => {
    setInput(val);
    if (val.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
    } else {
      setError(null);
    }
  };

  const handleClear = useCallback(() => {
    setInput('');
    setError(null);
    toast.success(t('csvtomarkdowntable.toast_cleared', 'Cleared inputs!'));
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [t]);

  // Delimiter auto-detection logic
  const actualDelimiter = useMemo(() => {
    if (delimiter !== 'auto') {
      if (delimiter === 'comma') return ',';
      if (delimiter === 'semicolon') return ';';
      if (delimiter === 'tab') return '\t';
      if (delimiter === 'pipe') return '|';
      if (delimiter === 'custom') return customDelim || ',';
      return ',';
    }

    if (!input.trim()) return ',';
    const sample = input.slice(0, 5000);
    const delims = [
      { sep: ',', count: (sample.match(/,/g) || []).length },
      { sep: ';', count: (sample.match(/;/g) || []).length },
      { sep: '\t', count: (sample.match(/\t/g) || []).length },
      { sep: '|', count: (sample.match(/\|/g) || []).length },
    ];
    delims.sort((a, b) => b.count - a.count);
    return delims[0].count > 0 ? delims[0].sep : ',';
  }, [delimiter, customDelim, input]);

  // Parse CSV/TSV into rows and columns
  const parsedData = useMemo(() => {
    if (!input.trim() || input.length > MAX_LENGTH) return [];

    const lines = input.trim().split('\n');
    const delim = actualDelimiter;

    const parseLine = (line: string): string[] => {
      const result: string[] = [];
      let startValueIndex = 0;
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        if (line[i] === '"') {
          inQuotes = !inQuotes;
        }
        if (line[i] === delim && !inQuotes) {
          result.push(line.substring(startValueIndex, i));
          startValueIndex = i + 1;
        }
      }
      result.push(line.substring(startValueIndex));

      return result.map(cell => {
        let v = cell.trim();
        if (v.startsWith('"') && v.endsWith('"') && v.length >= 2) {
          v = v.substring(1, v.length - 1).replace(/""/g, '"');
        }
        return v;
      });
    };

    return lines.map(parseLine);
  }, [input, actualDelimiter]);

  // Generate Markdown Table output
  const markdownOutput = useMemo(() => {
    if (parsedData.length === 0) return '';

    let headers: string[] = [];
    let rows: string[][] = [];

    if (hasHeader) {
      headers = parsedData[0];
      rows = parsedData.slice(1);
    } else {
      const maxCols = Math.max(...parsedData.map(r => r.length), 1);
      headers = Array.from({ length: maxCols }, (_, i) => `Column ${i + 1}`);
      rows = parsedData;
    }

    const numCols = headers.length;
    if (numCols === 0) return '';

    // Normalize row column counts
    const normalizedRows = rows.map(r => {
      const newRow = [...r];
      while (newRow.length < numCols) newRow.push('');
      return newRow.slice(0, numCols);
    });

    const escapeCell = (val: string) => String(val).replace(/\|/g, '\\|').replace(/\n/g, ' ');

    if (!prettyPadding) {
      const headerLine = '| ' + headers.map(escapeCell).join(' | ') + ' |';
      const sepLine = '| ' + Array(numCols).fill(
        globalAlign === 'center' ? ':---:' : globalAlign === 'right' ? '---:' : ':---'
      ).join(' | ') + ' |';
      const rowLines = normalizedRows.map(r => '| ' + r.map(escapeCell).join(' | ') + ' |');
      return [headerLine, sepLine, ...rowLines].join('\n');
    }

    // Calculate max width for each column for pretty alignment
    const colWidths: number[] = Array(numCols).fill(3);

    headers.forEach((h, colIdx) => {
      colWidths[colIdx] = Math.max(colWidths[colIdx], escapeCell(h).length);
    });

    normalizedRows.forEach(r => {
      r.forEach((cell, colIdx) => {
        colWidths[colIdx] = Math.max(colWidths[colIdx], escapeCell(cell).length);
      });
    });

    // Format Header Row
    const headerCells = headers.map((h, i) => escapeCell(h).padEnd(colWidths[i]));
    const formattedHeader = '| ' + headerCells.join(' | ') + ' |';

    // Format Separator Row
    const sepCells = colWidths.map(w => {
      if (globalAlign === 'center') {
        return ':' + '-'.repeat(Math.max(w - 2, 1)) + ':';
      } else if (globalAlign === 'right') {
        return '-'.repeat(Math.max(w - 1, 1)) + ':';
      } else {
        return ':' + '-'.repeat(Math.max(w - 1, 1));
      }
    });
    const formattedSep = '| ' + sepCells.join(' | ') + ' |';

    // Format Data Rows
    const formattedRows = normalizedRows.map(r => {
      const cells = r.map((cell, i) => {
        const str = escapeCell(cell);
        if (globalAlign === 'right') {
          return str.padStart(colWidths[i]);
        } else if (globalAlign === 'center') {
          const totalPad = colWidths[i] - str.length;
          const padLeft = Math.floor(totalPad / 2);
          const padRight = totalPad - padLeft;
          return ' '.repeat(padLeft) + str + ' '.repeat(padRight);
        } else {
          return str.padEnd(colWidths[i]);
        }
      });
      return '| ' + cells.join(' | ') + ' |';
    });

    return [formattedHeader, formattedSep, ...formattedRows].join('\n');
  }, [parsedData, hasHeader, globalAlign, prettyPadding]);

  const handleCopy = useCallback(() => {
    if (!markdownOutput) return;
    navigator.clipboard.writeText(markdownOutput);
    setCopied(true);
    toast.success(t('common.copied', 'Copied to clipboard!'));
    setTimeout(() => setCopied(false), 2000);
  }, [markdownOutput, t]);

  // keyboard handlers via ref to avoid stale closures
  const handlersRef = useRef({ handleClear, handleCopy });
  useEffect(() => {
    handlersRef.current = { handleClear, handleCopy };
  }, [handleClear, handleCopy]);

  // Global keydown listeners for shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const active = document.activeElement;
      const isEditable =
        active instanceof HTMLInputElement ||
        active instanceof HTMLTextAreaElement ||
        active?.getAttribute('contenteditable') === 'true';

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

  // Quick Presets
  const applyPreset = (type: 'catalog' | 'users' | 'financial' | 'servers') => {
    setError(null);
    if (type === 'catalog') {
      setInput('SKU,Product Name,Category,Price,Stock\nPRD-001,Wireless Ergonomic Mouse,Electronics,49.99,150\nPRD-002,Mechanical RGB Keyboard,Electronics,129.90,85\nPRD-003,UltraWide Monitor 34",Electronics,499.00,20\nPRD-004,Noise-Canceling Headphones,Audio,199.50,45');
      setDelimiter('auto');
      setHasHeader(true);
      setGlobalAlign('left');
      setPrettyPadding(true);
      toast.success(t('csvtomarkdowntable.preset_loaded', 'Preset loaded!'));
    } else if (type === 'users') {
      setInput('ID\tName\tEmail\tRole\tStatus\n1\tAlice Smith\talice@example.com\tAdmin\tActive\n2\tBob Johnson\tbob@domain.org\tDeveloper\tActive\n3\tCharlie Brown\tcharlie@company.com\tViewer\tPending\n4\tDiana Prince\tdiana@hero.net\tManager\tInactive');
      setDelimiter('auto');
      setHasHeader(true);
      setGlobalAlign('left');
      setPrettyPadding(true);
      toast.success(t('csvtomarkdowntable.preset_loaded', 'Preset loaded!'));
    } else if (type === 'financial') {
      setInput('Quarter;Revenue ($);Expenses ($);Net Profit ($);Growth (%)\nQ1 2024;150000;95000;55000;+12.5\nQ2 2024;185000;105000;80000;+18.2\nQ3 2024;210000;115000;95000;+14.0\nQ4 2024;260000;130000;130000;+22.8');
      setDelimiter('auto');
      setHasHeader(true);
      setGlobalAlign('right');
      setPrettyPadding(true);
      toast.success(t('csvtomarkdowntable.preset_loaded', 'Preset loaded!'));
    } else if (type === 'servers') {
      setInput('Hostname | IP Address | Region | CPU Usage | Uptime\nsrv-us-east-1 | 10.0.1.42 | US East | 34% | 99.98%\nsrv-us-west-2 | 10.0.2.88 | US West | 62% | 99.95%\nsrv-eu-central-1 | 10.1.0.12 | EU Central | 18% | 100.00%\nsrv-ap-southeast-1 | 10.2.0.55 | AP Asia | 45% | 99.91%');
      setDelimiter('auto');
      setHasHeader(true);
      setGlobalAlign('center');
      setPrettyPadding(true);
      toast.success(t('csvtomarkdowntable.preset_loaded', 'Preset loaded!'));
    }
  };

  const handleDownload = () => {
    if (!markdownOutput) return;
    const blob = new Blob([markdownOutput], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `table-${Date.now()}.md`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(t('common.downloaded', 'Downloaded file successfully!'));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8" role="region" aria-label={t('tool.csv-to-markdown-table.name', 'CSV to Markdown Table Converter')}>
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" aria-hidden="true" />
          {error}
        </div>
      )}

      {/* Quick Presets Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
          <Sparkles className="w-4 h-4" aria-hidden="true" />
          <span className="text-xs font-bold uppercase tracking-wider">
            {t('csvtomarkdowntable.presets_label', 'Quick Presets')}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => applyPreset('catalog')}
            className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 transition-all"
          >
            {t('csvtomarkdowntable.preset_catalog', 'Product Catalog (CSV)')}
          </button>
          <button
            type="button"
            onClick={() => applyPreset('users')}
            className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 transition-all"
          >
            {t('csvtomarkdowntable.preset_users', 'User Directory (TSV)')}
          </button>
          <button
            type="button"
            onClick={() => applyPreset('financial')}
            className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 transition-all"
          >
            {t('csvtomarkdowntable.preset_financial', 'Financial Report (;)')}
          </button>
          <button
            type="button"
            onClick={() => applyPreset('servers')}
            className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 transition-all"
          >
            {t('csvtomarkdowntable.preset_servers', 'Server Inventory (|)')}
          </button>
        </div>
      </div>

      {/* Control Panel Settings */}
      <div className="p-6 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2rem] grid grid-cols-1 md:grid-cols-4 gap-6 shadow-sm">
        {/* Delimiter */}
        <div className="space-y-2">
          <label htmlFor="delimiter-select" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer block">
            {t('csvtomarkdowntable.delimiter_label', 'Delimiter')}
          </label>
          <select
            id="delimiter-select"
            value={delimiter}
            onChange={(e) => setDelimiter(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
          >
            <option value="auto">{t('csvtomarkdowntable.delim_auto', 'Auto Detect')}</option>
            <option value="comma">{t('listseparatorchanger.separator_comma', 'Comma (, )')}</option>
            <option value="semicolon">{t('listseparatorchanger.separator_semicolon', 'Semicolon (; )')}</option>
            <option value="tab">{t('listseparatorchanger.separator_tab', 'Tab (\\t)')}</option>
            <option value="pipe">{t('csvtomarkdowntable.delim_pipe', 'Pipe (|)')}</option>
            <option value="custom">{t('listseparatorchanger.separator_custom', 'Custom')}</option>
          </select>
          {delimiter === 'custom' && (
            <input
              type="text"
              value={customDelim}
              onChange={(e) => setCustomDelim(e.target.value)}
              placeholder="e.g. #"
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono outline-none"
              autoComplete="off"
              spellCheck={false}
            />
          )}
        </div>

        {/* Global Alignment */}
        <div className="space-y-2">
          <label htmlFor="align-select" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer block">
            {t('csvtomarkdowntable.alignment_label', 'Text Alignment')}
          </label>
          <select
            id="align-select"
            value={globalAlign}
            onChange={(e) => setGlobalAlign(e.target.value as any)}
            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
          >
            <option value="left">{t('csvtomarkdowntable.align_left', 'Left (:---)')}</option>
            <option value="center">{t('csvtomarkdowntable.align_center', 'Center (:---:)')}</option>
            <option value="right">{t('csvtomarkdowntable.align_right', 'Right (---:)')}</option>
          </select>
        </div>

        {/* Has Header Checkbox */}
        <div className="space-y-2 flex flex-col justify-center">
          <label className="text-xs font-black uppercase tracking-widest text-slate-400 block">
            {t('csvtomarkdowntable.header_toggle_label', 'Header Row')}
          </label>
          <label htmlFor="header-checkbox" className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300 pt-1">
            <input
              id="header-checkbox"
              type="checkbox"
              checked={hasHeader}
              onChange={(e) => setHasHeader(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
            />
            {t('csvtomarkdowntable.has_header_option', 'First line is header')}
          </label>
        </div>

        {/* Pretty Padding Checkbox */}
        <div className="space-y-2 flex flex-col justify-center">
          <label className="text-xs font-black uppercase tracking-widest text-slate-400 block">
            {t('csvtomarkdowntable.formatting_label', 'Formatting')}
          </label>
          <label htmlFor="pretty-checkbox" className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300 pt-1">
            <input
              id="pretty-checkbox"
              type="checkbox"
              checked={prettyPadding}
              onChange={(e) => setPrettyPadding(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
            />
            {t('csvtomarkdowntable.pretty_padding_option', 'Pretty space padding')}
          </label>
        </div>
      </div>

      {/* Input / Output Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* CSV/TSV Input */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="csv-md-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 cursor-pointer">
              <FileSpreadsheet className="w-4 h-4 text-indigo-500" aria-hidden="true" />
              <span>{t('csvtomarkdowntable.input_label', 'CSV / TSV Input Data')}</span>
            </label>
            <button
              type="button"
              onClick={handleClear}
              disabled={!input}
              className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
            >
              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" /> {t('common.clear')}
              <Kbd modifier={null} className="ml-1 hidden sm:inline-flex border-rose-200 dark:border-rose-800 text-rose-400 dark:bg-slate-900">Esc</Kbd>
            </button>
          </div>
          <textarea
            id="csv-md-input"
            ref={inputRef}
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            autoComplete="off"
            spellCheck={false}
            placeholder={t('csvtomarkdowntable.input_placeholder', 'Paste your CSV, TSV, or separated table data here...\n\nHeader 1, Header 2, Header 3\nValue 1, Value 2, Value 3')}
            className="w-full h-96 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm leading-relaxed dark:text-slate-300 resize-none font-mono"
          />
        </div>

        {/* Markdown Table Output */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="csv-md-output" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 cursor-pointer">
              <Table className="w-4 h-4 text-emerald-500" aria-hidden="true" />
              <span>{t('csvtomarkdowntable.output_label', 'Markdown Table Markup')}</span>
            </label>
            <div className="flex gap-2 items-center">
              <button
                type="button"
                onClick={handleDownload}
                disabled={!markdownOutput}
                className="p-2 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg hover:bg-indigo-100 disabled:opacity-50 transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
                title={t('common.download')}
              >
                <Download className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={handleCopy}
                disabled={!markdownOutput}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                  copied
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                    : 'bg-indigo-600 text-white border-transparent hover:bg-indigo-700 shadow-md shadow-indigo-600/20'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {copied ? <Check className="w-4 h-4" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
                {copied ? t('common.copied') : t('common.copy')}
                <Kbd modifier={null} className="ml-1 hidden sm:inline-flex border-indigo-400 text-white bg-indigo-700">C</Kbd>
              </button>
            </div>
          </div>
          <textarea
            id="csv-md-output"
            value={markdownOutput}
            readOnly
            placeholder={t('csvtomarkdowntable.output_placeholder', 'Generated Markdown table will appear here...')}
            className="w-full h-96 p-6 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-mono text-xs leading-relaxed text-indigo-600 dark:text-indigo-400 resize-none shadow-sm whitespace-pre overflow-x-auto"
          />
        </div>
      </div>

      {/* About Section */}
      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 shrink-0">
          <Info className="w-6 h-6" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">
            {t('csvtomarkdowntable.about_title', 'About CSV to Markdown Table Converter')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t(
              'csvtomarkdowntable.about_desc',
              'Convert CSV, TSV, or custom separated table datasets directly into clean, formatted Markdown table syntax. Includes column alignment options, delimiter auto-detection, and padding customizers. Runs entirely in your browser.'
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
