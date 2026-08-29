import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Table,
  Copy,
  Check,
  Trash2,
  Download,
  AlignLeft,
  AlignCenter,
  AlignRight,
  FileSpreadsheet,
  Settings,
  Info,
  Sparkles,
  ArrowRight,
  Scissors
} from 'lucide-react';
import { Kbd } from './ui/Kbd';
import { toast } from 'sonner';

const MAX_LENGTH = 100000;

interface CSVToMarkdownTableProps {
  initialData?: any;
  onStateChange?: (state: any) => void;
}

export const CSVToMarkdownTable: React.FC<CSVToMarkdownTableProps> = ({
  initialData,
  onStateChange,
}) => {
  const { t } = useTranslation();

  const [input, setInput] = useState<string>(
    initialData?.input ||
      `Product,Category,Price,InStock\nLaptop,Electronics,$999.99,Yes\nSmartphone,Electronics,$699.00,Yes\nCoffee Mug,Kitchen,$12.50,No\nDesk Chair,Furniture,$189.00,Yes`
  );

  const [delimiter, setDelimiter] = useState<string>(initialData?.delimiter || 'auto');
  const [alignment, setAlignment] = useState<'left' | 'center' | 'right'>(
    initialData?.alignment || 'left'
  );
  const [hasHeader, setHasHeader] = useState<boolean>(
    initialData?.hasHeader !== undefined ? initialData.hasHeader : true
  );
  const [compact, setCompact] = useState<boolean>(initialData?.compact || false);
  const [trimCells, setTrimCells] = useState<boolean>(
    initialData?.trimCells !== undefined ? initialData.trimCells : true
  );

  const [copied, setCopied] = useState<boolean>(false);
  const [output, setOutput] = useState<string>('');

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const outputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-detect delimiter if 'auto'
  const detectDelimiter = (text: string): string => {
    const sample = text.slice(0, 5000);
    const counts = {
      ',': (sample.match(/,/g) || []).length,
      '\t': (sample.match(/\t/g) || []).length,
      ';': (sample.match(/;/g) || []).length,
      '|': (sample.match(/\|/g) || []).length,
    };
    let maxDelim = ',';
    let maxCount = -1;
    for (const [delim, count] of Object.entries(counts)) {
      if (count > maxCount) {
        maxCount = count;
        maxDelim = delim;
      }
    }
    return maxCount > 0 ? maxDelim : ',';
  };

  // CSV parser respecting quotes
  const parseCSVLine = (line: string, delimChar: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimChar && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  };

  // Generate Markdown Table
  const generateMarkdownTable = useCallback(() => {
    if (!input.trim()) {
      setOutput('');
      return;
    }

    if (input.length > MAX_LENGTH) {
      toast.error(t('error.max_length', { max: MAX_LENGTH }));
      return;
    }

    const actualDelim = delimiter === 'auto' ? detectDelimiter(input) : delimiter;
    const lines = input
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) {
      setOutput('');
      return;
    }

    const rows: string[][] = lines.map((line) => {
      let cells = parseCSVLine(line, actualDelim);
      if (trimCells) {
        cells = cells.map((c) => c.trim());
      }
      // Escape pipes in Markdown cells
      return cells.map((c) => c.replace(/\|/g, '\\|'));
    });

    if (rows.length === 0) {
      setOutput('');
      return;
    }

    // Determine max columns
    const maxCols = Math.max(...rows.map((r) => r.length));

    // Pad rows to equal length
    const normalizedRows = rows.map((r) => {
      const padded = [...r];
      while (padded.length < maxCols) {
        padded.push('');
      }
      return padded;
    });

    let headerRow: string[];
    let bodyRows: string[][];

    if (hasHeader) {
      headerRow = normalizedRows[0];
      bodyRows = normalizedRows.slice(1);
    } else {
      headerRow = Array.from({ length: maxCols }, (_, i) => `Column ${i + 1}`);
      bodyRows = normalizedRows;
    }

    // Calculate column widths
    const colWidths = Array(maxCols).fill(3); // minimum 3 for Markdown separator
    const allRowsForWidth = [headerRow, ...bodyRows];

    allRowsForWidth.forEach((r) => {
      r.forEach((cell, i) => {
        colWidths[i] = Math.max(colWidths[i], cell.length);
      });
    });

    // Helper to format a cell
    const formatCell = (val: string, width: number) => {
      if (compact) return val;
      return val.padEnd(width, ' ');
    };

    // Construct Header
    const formattedHeaderCells = headerRow.map((cell, i) => formatCell(cell, colWidths[i]));
    const headerLine = compact
      ? `|${formattedHeaderCells.join('|')}|`
      : `| ${formattedHeaderCells.join(' | ')} |`;

    // Construct Separator Row
    const separatorCells = colWidths.map((w) => {
      const minDashes = Math.max(3, compact ? 3 : w);
      if (alignment === 'center') {
        return `:${'-'.repeat(minDashes - 2)}:`;
      } else if (alignment === 'right') {
        return `${'-'.repeat(minDashes - 1)}:`;
      } else {
        return `:${'-'.repeat(minDashes - 1)}`;
      }
    });

    const separatorLine = compact
      ? `|${separatorCells.join('|')}|`
      : `| ${separatorCells.join(' | ')} |`;

    // Construct Body Rows
    const formattedBodyLines = bodyRows.map((row) => {
      const formattedCells = row.map((cell, i) => formatCell(cell, colWidths[i]));
      return compact
        ? `|${formattedCells.join('|')}|`
        : `| ${formattedCells.join(' | ')} |`;
    });

    const markdownResult = [headerLine, separatorLine, ...formattedBodyLines].join('\n');
    setOutput(markdownResult);
  }, [input, delimiter, alignment, hasHeader, compact, trimCells, t]);

  useEffect(() => {
    generateMarkdownTable();
  }, [generateMarkdownTable]);

  useEffect(() => {
    if (onStateChange) {
      onStateChange({ input, delimiter, alignment, hasHeader, compact, trimCells });
    }
  }, [input, delimiter, alignment, hasHeader, compact, trimCells, onStateChange]);

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success(t('markdowntabletocsv.toast_copied', 'Markdown table copied to clipboard!'));
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
    toast.success(t('markdowntabletocsv.toast_cleared', 'Input cleared!'));
  };

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'table.md';
    link.click();
    URL.revokeObjectURL(url);
    toast.success(t('common.download_success', 'Download successful'));
  };

  // Keyboard shortcut listener
  const handlersRef = useRef({ handleCopy, handleClear });
  useEffect(() => {
    handlersRef.current = { handleCopy, handleClear };
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isEditable =
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        (document.activeElement as HTMLElement)?.isContentEditable;

      if (e.key === 'Escape') {
        e.preventDefault();
        handlersRef.current.handleClear();
      } else if ((e.key === 'c' || e.key === 'C') && !e.ctrlKey && !e.metaKey && !isEditable) {
        e.preventDefault();
        handlersRef.current.handleCopy();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Presets
  const presets = [
    {
      name: t('csvtomarkdowntable.preset_products', 'Product Catalog'),
      data: `SKU,Product Name,Category,Price,Stock\nELE-101,Wireless Mouse,Electronics,29.99,150\nELE-102,Mechanical Keyboard,Electronics,89.50,45\nFUR-201,Ergonomic Chair,Furniture,199.00,12\nKIT-301,Stainless Water Bottle,Kitchen,15.00,80`,
    },
    {
      name: t('csvtomarkdowntable.preset_users', 'User Directory'),
      data: `ID,Full Name,Role,Department,Status\nUSR-1,Alice Vance,Lead Engineer,Engineering,Active\nUSR-2,Bob Miller,Product Manager,Product,Active\nUSR-3,Charlie Smith,UX Designer,Design,On Leave\nUSR-4,Diana Prince,QA Manager,Quality,Active`,
    },
    {
      name: t('csvtomarkdowntable.preset_financial', 'Financial Summary'),
      data: `Quarter,Revenue,Expenses,Net Profit,Margin\nQ1 2024,$120000,$85000,$35000,29.1%\nQ2 2024,$145000,$90000,$55000,37.9%\nQ3 2024,$132000,$88000,$44000,33.3%\nQ4 2024,$160000,$95000,$65000,40.6%`,
    },
    {
      name: t('csvtomarkdowntable.preset_status', 'Server Inventory'),
      data: `Hostname,IP Address,OS,RAM,Uptime\nnode-01,192.168.1.10,Ubuntu 22.04,32GB,99.98%\nnode-02,192.168.1.11,Debian 12,64GB,99.99%\ndb-main,192.168.1.20,RHEL 9,128GB,100.0%\nredis-cache,192.168.1.30,Alpine,16GB,99.95%`,
    },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Top Bar with Presets & Shortcuts */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 mr-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            {t('csvtomarkdowntable.presets_title', 'Quick Presets:')}
          </span>
          {presets.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => {
                setInput(preset.data);
                toast.success(t('csvtomarkdowntable.toast_preset_loaded', 'Preset loaded!'));
              }}
              className="px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-indigo-500 dark:hover:border-indigo-500 hover:text-indigo-600 transition-all shadow-sm"
            >
              {preset.name}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <Kbd>Esc</Kbd> {t('common.clear', 'Clear')}
          </span>
          <span className="flex items-center gap-1">
            <Kbd>C</Kbd> {t('common.copy', 'Copy')}
          </span>
        </div>
      </div>

      {/* Options Controls */}
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-3">
          <Settings className="w-4 h-4 text-indigo-500" />
          {t('common.options', 'Configuration Options')}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Delimiter Selection */}
          <div className="space-y-1.5">
            <label htmlFor="csv-md-delimiter" className="block text-xs font-bold text-slate-600 dark:text-slate-400">
              {t('csvdelimiter.label', 'Delimiter')}
            </label>
            <select
              id="csv-md-delimiter"
              value={delimiter}
              onChange={(e) => setDelimiter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="auto">✨ Auto-Detect</option>
              <option value=",">Comma (,)</option>
              <option value="&#9;">Tab (\t)</option>
              <option value=";">Semicolon (;)</option>
              <option value="|">Pipe (|)</option>
            </select>
          </div>

          {/* Alignment Selection */}
          <div className="space-y-1.5">
            <label htmlFor="csv-md-alignment" className="block text-xs font-bold text-slate-600 dark:text-slate-400">
              {t('csvtomarkdowntable.column_alignment', 'Column Alignment')}
            </label>
            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 rounded-xl">
              <button
                type="button"
                onClick={() => setAlignment('left')}
                className={`flex-1 flex items-center justify-center py-1 rounded-lg text-xs font-semibold transition-all ${
                  alignment === 'left'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title="Left Align"
              >
                <AlignLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setAlignment('center')}
                className={`flex-1 flex items-center justify-center py-1 rounded-lg text-xs font-semibold transition-all ${
                  alignment === 'center'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title="Center Align"
              >
                <AlignCenter className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setAlignment('right')}
                className={`flex-1 flex items-center justify-center py-1 rounded-lg text-xs font-semibold transition-all ${
                  alignment === 'right'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title="Right Align"
              >
                <AlignRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Header Row Toggle */}
          <div className="flex items-center justify-between sm:justify-start gap-3 pt-4 sm:pt-0">
            <label htmlFor="csv-md-has-header" className="text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer">
              {t('csvtomarkdowntable.has_header', 'First row is header')}
            </label>
            <input
              id="csv-md-has-header"
              type="checkbox"
              checked={hasHeader}
              onChange={(e) => setHasHeader(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
            />
          </div>

          {/* Compact Padding Toggle */}
          <div className="flex items-center justify-between sm:justify-start gap-3 pt-4 sm:pt-0">
            <label htmlFor="csv-md-compact" className="text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer">
              {t('csvtomarkdowntable.compact_mode', 'Compact (No padding)')}
            </label>
            <input
              id="csv-md-compact"
              type="checkbox"
              checked={compact}
              onChange={(e) => setCompact(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Main Input / Output Side-by-Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CSV Input Panel */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label
              htmlFor="csv-md-input"
              className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4 text-indigo-500" />
              {t('csvtomarkdowntable.input_label', 'CSV / TSV Input Data')}
            </label>
            <button
              onClick={handleClear}
              className="text-xs font-semibold text-slate-400 hover:text-rose-500 transition-colors flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {t('common.clear', 'Clear')}
            </button>
          </div>

          <div className="relative">
            <textarea
              id="csv-md-input"
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste your CSV or TSV data here..."
              rows={14}
              className="w-full p-4 font-mono text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all shadow-sm resize-y placeholder:text-slate-400"
            />
            <div className="absolute bottom-3 right-3 text-[10px] font-medium text-slate-400 bg-white/80 dark:bg-slate-900/80 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-800">
              {input.length} / {MAX_LENGTH}
            </div>
          </div>
        </div>

        {/* Markdown Output Panel */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label
              htmlFor="csv-md-output"
              className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2"
            >
              <Table className="w-4 h-4 text-emerald-500" />
              {t('csvtomarkdowntable.output_label', 'Markdown Table Markup')}
            </label>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDownload}
                disabled={!output}
                className="px-2.5 py-1 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 transition-all flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                {t('common.download', 'Download')}
              </button>
              <button
                onClick={handleCopy}
                disabled={!output}
                className={`px-3 py-1 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? t('common.copied', 'Copied!') : t('common.copy', 'Copy Markdown')}
              </button>
            </div>
          </div>

          <textarea
            id="csv-md-output"
            ref={outputRef}
            readOnly
            value={output}
            placeholder={t('csvtomarkdowntable.placeholder_output', 'Generated Markdown table will appear here...')}
            rows={14}
            className="w-full p-4 font-mono text-xs bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all shadow-sm resize-y text-slate-800 dark:text-slate-200"
          />
        </div>
      </div>

      {/* Info Footer */}
      <div className="p-5 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 text-xs text-slate-600 dark:text-slate-400 space-y-2">
        <div className="flex items-center gap-2 font-bold text-indigo-900 dark:text-indigo-300">
          <Info className="w-4 h-4 text-indigo-500" />
          {t('csvtomarkdowntable.about_title', 'About CSV to Markdown Table Converter')}
        </div>
        <p className="leading-relaxed">
          {t(
            'csvtomarkdowntable.about_text',
            'Convert datasets from CSV, TSV, or tab-delimited text files directly into clean Markdown table markup. Features automatic delimiter detection, quote handling, custom column alignments, compact padding, and instant copy/download functionality. All processing happens entirely client-side in your browser for total privacy.'
          )}
        </p>
      </div>
    </div>
  );
};

export default CSVToMarkdownTable;
