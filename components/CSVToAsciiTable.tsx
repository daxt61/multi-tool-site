import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { FileSpreadsheet, Table, Copy, Check, Trash2, Download, AlertCircle, Info, Settings2, Sparkles } from 'lucide-react';
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

type TableStyle = 'basic' | 'bordered' | 'unicode' | 'markdown';

const PRESETS = [
  {
    id: 'employees',
    labelKey: 'csvtoascii.preset_employees',
    defaultLabel: 'Employee Directory',
    data: 'Name,Role,Department,City\nJohn Doe,Developer,Engineering,New York\nJane Smith,Designer,Design,London\nBob Johnson,Manager,Management,Paris',
  },
  {
    id: 'catalog',
    labelKey: 'csvtoascii.preset_catalog',
    defaultLabel: 'Product Catalog',
    data: 'ID,Product,Category,Price,Stock\n101,Laptop Stand,Accessories,29.99,150\n102,USB-C Hub,Electronics,45.00,80\n103,Wireless Mouse,Electronics,25.50,210',
  },
  {
    id: 'servers',
    labelKey: 'csvtoascii.preset_servers',
    defaultLabel: 'Server Inventory',
    data: 'Hostname,IP Address,Region,Status,Uptime\nweb-srv-01,192.168.1.10,us-east,Online,99.9%\napp-srv-02,192.168.1.20,us-west,Online,99.8%\ndb-srv-01,192.168.1.30,eu-central,Maintenance,98.5%',
  },
];

export function CSVToAsciiTable({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [input, setInput] = useState<string>(initialData?.input ?? PRESETS[0].data);
  const [delimiter, setDelimiter] = useState<string>(initialData?.delimiter || ',');
  const [hasHeader, setHasHeader] = useState<boolean>(initialData?.hasHeader ?? true);
  const [style, setStyle] = useState<TableStyle>(initialData?.style || 'bordered');
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    onStateChange?.({ input, delimiter, hasHeader, style });
  }, [input, delimiter, hasHeader, style, onStateChange]);

  const parseCSVLine = useCallback((line: string, delim: string): string[] => {
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
      let trimmed = v.trim();
      if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
        trimmed = trimmed.substring(1, trimmed.length - 1).replace(/""/g, '"');
      }
      return trimmed;
    });
  }, []);

  const output = useMemo(() => {
    if (!input.trim()) return '';
    if (input.length > MAX_LENGTH) return '';

    try {
      const lines = input.trim().split(/\r?\n/).filter((line: string) => line.trim().length > 0);
      if (lines.length === 0) return '';

      const data = lines.map((line: string) => parseCSVLine(line, delimiter));
      const colCount = Math.max(...data.map((row: string[]) => row.length));

      const normalizedData = data.map((row: string[]) => {
        const newRow = [...row];
        while (newRow.length < colCount) newRow.push('');
        return newRow;
      });

      const headers = hasHeader ? normalizedData[0] : Array.from({ length: colCount }, (_, i) => `Col ${i + 1}`);
      const body = hasHeader ? normalizedData.slice(1) : normalizedData;

      const columnWidths = Array.from({ length: colCount }, (_, i) => {
        return Math.max(
          headers[i].length,
          ...body.map((row: string[]) => String(row[i] ?? '').length)
        );
      });

      let result = '';
      const pad = (str: string, length: number) => str + ' '.repeat(Math.max(0, length - str.length));

      if (style === 'basic') {
        result += headers.map((h: string, i: number) => pad(h, columnWidths[i])).join('  ') + '\n';
        result += columnWidths.map(w => '-'.repeat(w)).join('  ') + '\n';
        body.forEach((row: string[]) => {
          result += row.map((cell: string, i: number) => pad(String(cell ?? ''), columnWidths[i])).join('  ') + '\n';
        });
      } else if (style === 'bordered') {
        const line = '+' + columnWidths.map(w => '-'.repeat(w + 2)).join('+') + '+';
        result += line + '\n';
        result += '| ' + headers.map((h: string, i: number) => pad(h, columnWidths[i])).join(' | ') + ' |\n';
        result += line + '\n';
        body.forEach((row: string[]) => {
          result += '| ' + row.map((cell: string, i: number) => pad(String(cell ?? ''), columnWidths[i])).join(' | ') + ' |\n';
        });
        result += line;
      } else if (style === 'unicode') {
        const top = '┌' + columnWidths.map(w => '─'.repeat(w + 2)).join('┬') + '┐';
        const mid = '├' + columnWidths.map(w => '─'.repeat(w + 2)).join('┼') + '┤';
        const bot = '└' + columnWidths.map(w => '─'.repeat(w + 2)).join('┴') + '┘';

        result += top + '\n';
        result += '│ ' + headers.map((h: string, i: number) => pad(h, columnWidths[i])).join(' │ ') + ' │\n';
        result += mid + '\n';
        body.forEach((row: string[]) => {
          result += '│ ' + row.map((cell: string, i: number) => pad(String(cell ?? ''), columnWidths[i])).join(' │ ') + ' │\n';
        });
        result += bot;
      } else if (style === 'markdown') {
        result += '| ' + headers.join(' | ') + ' |\n';
        result += '| ' + columnWidths.map(w => '-'.repeat(Math.max(3, w))).join(' | ') + ' |\n';
        body.forEach((row: string[]) => {
          result += '| ' + row.join(' | ') + ' |\n';
        });
      }
      return result;
    } catch {
      return '';
    }
  }, [input, delimiter, hasHeader, style, parseCSVLine]);

  const errorMsg = useMemo(() => {
    if (input.length > MAX_LENGTH) {
      return t('error.max_length', { max: MAX_LENGTH.toLocaleString() });
    }
    return null;
  }, [input, t]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success(t('csvtoascii.toast_copied', 'ASCII table copied to clipboard!'));
    setTimeout(() => setCopied(false), 2000);
  }, [output, t]);

  const handleClear = useCallback(() => {
    setInput('');
    if (inputRef.current) inputRef.current.focus();
    toast.success(t('csvtoascii.toast_cleared', 'Input cleared and focus restored!'));
  }, [t]);

  const handleDownload = useCallback(() => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `table-ascii-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t('common.download_success', 'Download successful'));
  }, [output, t]);

  const handleLoadPreset = useCallback((presetData: string) => {
    setInput(presetData);
    toast.success(t('csvtoascii.toast_preset_loaded', 'Preset loaded successfully!'));
  }, [t]);

  // Global Keyboard Shortcuts
  const handlersRef = useRef({ handleClear, handleCopy });
  useEffect(() => {
    handlersRef.current = { handleClear, handleCopy };
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isEditing = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');

      if (e.key === 'Escape') {
        e.preventDefault();
        handlersRef.current.handleClear();
      } else if ((e.key === 'c' || e.key === 'C') && !isEditing && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        handlersRef.current.handleCopy();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Presets Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-500" aria-hidden="true" />
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {t('csvtoascii.presets_title', 'Quick Presets:')}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleLoadPreset(preset.data)}
              className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-800 rounded-xl text-xs font-semibold transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
            >
              {t(preset.labelKey, preset.defaultLabel)}
            </button>
          ))}
        </div>
      </div>

      {errorMsg && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 shrink-0" aria-hidden="true" />
          {errorMsg}
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-indigo-500" aria-hidden="true" />
              <label htmlFor="csv-ascii-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                CSV {t('common.input', 'Input')}
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Kbd modifier={null}>Esc</Kbd>
              <button
                onClick={handleClear}
                className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                {t('common.clear', 'Clear')}
              </button>
            </div>
          </div>
          <textarea
            id="csv-ascii-input"
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full h-[400px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
            placeholder="Name,Age,City..."
          />
        </div>

        {/* Output */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Table className="w-4 h-4 text-indigo-500" aria-hidden="true" />
              <label htmlFor="ascii-table-output" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('jsontoascii.ascii_output', 'ASCII Table Output')}
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Kbd modifier={null}>C</Kbd>
              <button
                onClick={handleDownload}
                disabled={!output}
                title={t('common.download', 'Download')}
                className="text-xs font-bold p-2 rounded-xl text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-all disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
              >
                <Download className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                onClick={handleCopy}
                disabled={!output}
                className={`text-xs font-bold px-4 py-1.5 rounded-xl transition-all flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                  copied
                    ? 'bg-emerald-500 text-white'
                    : 'text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" aria-hidden="true" /> : <Copy className="w-3.5 h-3.5" aria-hidden="true" />}
                {copied ? t('common.copied', 'Copied') : t('common.copy', 'Copy')}
              </button>
            </div>
          </div>
          <textarea
            id="ascii-table-output"
            readOnly
            value={output}
            placeholder={t('jsontoascii.placeholder', 'The ASCII table will appear here...')}
            className="w-full h-[400px] p-6 bg-slate-900 dark:bg-black border border-slate-800 rounded-3xl overflow-auto font-mono text-xs md:text-sm leading-none text-indigo-300 selection:bg-indigo-500/30 whitespace-pre resize-none outline-none"
          />
        </div>
      </div>

      {/* Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-8 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2rem] space-y-6">
          <div className="flex items-center gap-2 text-indigo-500 px-1">
            <Settings2 className="w-4 h-4" aria-hidden="true" />
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{t('common.options', 'Options')}</h3>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-400 px-1 uppercase tracking-wider block">
                {t('csvtosql.delimiter', 'Delimiter')}
              </label>
              <div className="flex flex-wrap gap-2">
                {DELIMITERS.map(d => (
                  <button
                    key={d.value}
                    onClick={() => setDelimiter(d.value)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                      delimiter === d.value
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
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
              <span>{t('csvtosql.has_header', 'First row is header')}</span>
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${hasHeader ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300'}`}>
                {hasHeader && <Check className="w-3.5 h-3.5 text-white" aria-hidden="true" />}
              </div>
            </button>
          </div>
        </div>

        <div className="p-8 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-[2rem] space-y-6 shadow-sm">
          <div className="flex items-center gap-2 text-indigo-500 px-1">
            <Settings2 className="w-4 h-4" aria-hidden="true" />
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{t('csvtoascii.table_style', 'Table Style')}</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {(['bordered', 'unicode', 'basic', 'markdown'] as const).map(s => (
              <button
                key={s}
                onClick={() => setStyle(s)}
                className={`px-4 py-3 rounded-xl text-xs font-bold transition-all border ${
                  style === s
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-100 dark:border-slate-700 hover:border-indigo-500/50'
                }`}
              >
                {t(`jsontoascii.style_${s}`, s.charAt(0).toUpperCase() + s.slice(1))}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-6 rounded-[2rem] border border-indigo-100 dark:border-indigo-900/20 flex gap-4">
        <Info className="w-6 h-6 text-indigo-600 shrink-0 mt-0.5" aria-hidden="true" />
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('jsontoascii.about_title', 'About ASCII Tables')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('jsontoascii.about_text', 'ASCII tables are a text-based way to represent tabular data. They are commonly used in documentation, source code comments, or terminal outputs where graphical tables are not available.')}
          </p>
        </div>
      </div>
    </div>
  );
}
