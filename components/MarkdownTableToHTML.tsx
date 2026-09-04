import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Table,
  Copy,
  Check,
  Trash2,
  Download,
  Settings,
  Info,
  Sparkles,
  Code2
} from 'lucide-react';
import { Kbd } from './ui/Kbd';
import { toast } from 'sonner';

const MAX_LENGTH = 100000;
const MAX_ROWS = 1000;
const MAX_COLS = 100;

interface MarkdownTableToHTMLProps {
  initialData?: any;
  onStateChange?: (state: any) => void;
}

export const MarkdownTableToHTML: React.FC<MarkdownTableToHTMLProps> = ({
  initialData,
  onStateChange,
}) => {
  const { t } = useTranslation();

  const [input, setInput] = useState<string>(
    initialData?.input ||
      `| SKU | Product Name | Category | Price | Stock |\n| :--- | :---: | :---: | ---: | ---: |\n| ELE-101 | **Wireless Mouse** | Electronics | $29.99 | 150 |\n| ELE-102 | **Mechanical Keyboard** | Electronics | $89.50 | 45 |\n| FUR-201 | *Ergonomic Chair* | Furniture | $199.00 | 12 |\n| KIT-301 | Stainless Water Bottle | Kitchen | $15.00 | 80 |`
  );

  const [hasHeader, setHasHeader] = useState<boolean>(
    initialData?.hasHeader !== undefined ? initialData.hasHeader : true
  );
  const [formatMode, setFormatMode] = useState<'pretty' | 'minified'>(
    initialData?.formatMode || 'pretty'
  );
  const [alignMode, setAlignMode] = useState<'css-class' | 'inline-style' | 'none'>(
    initialData?.alignMode || 'css-class'
  );
  const [parseInlineFormatting, setParseInlineFormatting] = useState<boolean>(
    initialData?.parseInlineFormatting !== undefined ? initialData.parseInlineFormatting : true
  );

  // CSS table class options
  const [isBordered, setIsBordered] = useState<boolean>(
    initialData?.isBordered !== undefined ? initialData.isBordered : true
  );
  const [isStriped, setIsStriped] = useState<boolean>(
    initialData?.isStriped !== undefined ? initialData.isStriped : true
  );
  const [isHoverable, setIsHoverable] = useState<boolean>(
    initialData?.isHoverable !== undefined ? initialData.isHoverable : true
  );
  const [isCompact, setIsCompact] = useState<boolean>(initialData?.isCompact || false);
  const [customClass, setCustomClass] = useState<string>(initialData?.customClass || 'table');

  const [copied, setCopied] = useState<boolean>(false);
  const [output, setOutput] = useState<string>('');

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const outputRef = useRef<HTMLTextAreaElement>(null);

  // Helper to split Markdown line by pipes while respecting escaped pipes (\|)
  const splitMarkdownRow = (line: string): string[] => {
    let text = line.trim();
    if (text.startsWith('|')) text = text.slice(1);
    if (text.endsWith('|')) text = text.slice(0, -1);

    const cells: string[] = [];
    let current = '';
    let isEscaped = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === '\\' && !isEscaped) {
        isEscaped = true;
      } else if (char === '|' && !isEscaped) {
        cells.push(current.trim());
        current = '';
      } else {
        if (isEscaped && char !== '|') {
          current += '\\';
        }
        current += char;
        isEscaped = false;
      }
    }
    cells.push(current.trim());
    return cells;
  };

  // Helper to escape HTML characters
  const escapeHTML = (str: string): string => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  // Safe URL sanitizer to prevent javascript: or data: XSS in Markdown links
  const sanitizeURL = (url: string): string => {
    const trimmed = url.trim();
    if (/^(javascript|data|vbscript):/i.test(trimmed)) {
      return '#';
    }
    return escapeHTML(trimmed);
  };

  // Helper to parse basic inline Markdown (bold, italic, code, links)
  const formatCellContent = (cell: string): string => {
    let escaped = escapeHTML(cell);

    if (!parseInlineFormatting) {
      return escaped;
    }

    // Inline code: `code`
    escaped = escaped.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Bold: **text** or __text__
    escaped = escaped.replace(/(\*\*|__)(.*?)\1/g, '<strong>$2</strong>');

    // Italic: *text* or _text_
    escaped = escaped.replace(/(\*|_)(.*?)\1/g, '<em>$2</em>');

    // Markdown Links: [text](url)
    escaped = escaped.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      (_, linkText, href) => `<a href="${sanitizeURL(href)}" target="_blank" rel="noopener noreferrer">${linkText}</a>`
    );

    return escaped;
  };

  // Determine alignment from delimiter cell
  const getAlignment = (cell: string): 'left' | 'center' | 'right' => {
    const trimmed = cell.trim();
    const startsWithColon = trimmed.startsWith(':');
    const endsWithColon = trimmed.endsWith(':');

    if (startsWithColon && endsWithColon) return 'center';
    if (endsWithColon) return 'right';
    return 'left';
  };

  // Check if row is a Markdown delimiter row (e.g. | :--- | :---: | ---: |)
  const isDelimiterRow = (cells: string[]): boolean => {
    if (cells.length === 0) return false;
    return cells.every((cell) => /^:?-+:?$/.test(cell.trim()));
  };

  // Generate HTML Table markup
  const generateHTMLTable = useCallback(() => {
    if (!input.trim()) {
      setOutput('');
      return;
    }

    if (input.length > MAX_LENGTH) {
      toast.error(t('error.max_length', { max: MAX_LENGTH }));
      return;
    }

    const lines = input
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) {
      setOutput('');
      return;
    }

    if (lines.length > MAX_ROWS) {
      toast.error(t('markdowntabletohtml.error_max_rows', { max: MAX_ROWS }));
      return;
    }

    const parsedRows = lines.map(splitMarkdownRow);

    // Find delimiter row index if present
    const delimIndex = parsedRows.findIndex(isDelimiterRow);

    let alignments: ('left' | 'center' | 'right')[] = [];
    let headerCells: string[] = [];
    let bodyRows: string[][] = [];

    if (delimIndex !== -1) {
      alignments = parsedRows[delimIndex].map(getAlignment);

      if (delimIndex > 0 && hasHeader) {
        headerCells = parsedRows[0];
      }

      // Body rows are rows excluding delimiter row and header row if used
      const startIndex = delimIndex > 0 && hasHeader ? 1 : 0;
      bodyRows = parsedRows.filter((_, idx) => idx !== delimIndex && idx >= startIndex);
    } else {
      // No delimiter row found
      if (hasHeader) {
        headerCells = parsedRows[0];
        bodyRows = parsedRows.slice(1);
      } else {
        bodyRows = parsedRows;
      }
    }

    const maxCols = Math.min(
      MAX_COLS,
      Math.max(
        headerCells.length,
        ...bodyRows.map((r) => r.length),
        alignments.length,
        1
      )
    );

    // Pad alignments if needed
    while (alignments.length < maxCols) {
      alignments.push('left');
    }

    // Fill header row if empty
    if (!hasHeader || headerCells.length === 0) {
      headerCells = Array.from({ length: maxCols }, (_, i) => `Column ${i + 1}`);
    } else {
      while (headerCells.length < maxCols) {
        headerCells.push('');
      }
    }

    // Normalize body rows
    bodyRows = bodyRows.map((r) => {
      const padded = [...r];
      while (padded.length < maxCols) {
        padded.push('');
      }
      return padded.slice(0, maxCols);
    });

    // Build class list for <table>
    const classes = [customClass.trim()];
    if (isBordered) classes.push('table-bordered');
    if (isStriped) classes.push('table-striped');
    if (isHoverable) classes.push('table-hover');
    if (isCompact) classes.push('table-sm');
    const classAttr = classes.filter(Boolean).join(' ');

    // Helper to apply alignment attributes to <th> / <td>
    const getAlignAttr = (align: 'left' | 'center' | 'right'): string => {
      if (alignMode === 'css-class') {
        return ` class="text-${align}"`;
      } else if (alignMode === 'inline-style') {
        return ` style="text-align: ${align};"`;
      }
      return '';
    };

    if (formatMode === 'minified') {
      let html = `<table class="${classAttr}"><thead><tr>`;
      headerCells.slice(0, maxCols).forEach((cell, idx) => {
        const alignAttr = getAlignAttr(alignments[idx] || 'left');
        html += `<th${alignAttr}>${formatCellContent(cell)}</th>`;
      });
      html += `</tr></thead><tbody>`;
      bodyRows.forEach((row) => {
        html += `<tr>`;
        row.forEach((cell, idx) => {
          const alignAttr = getAlignAttr(alignments[idx] || 'left');
          html += `<td${alignAttr}>${formatCellContent(cell)}</td>`;
        });
        html += `</tr>`;
      });
      html += `</tbody></table>`;
      setOutput(html);
    } else {
      const linesOut: string[] = [];
      linesOut.push(`<table class="${classAttr}">`);
      linesOut.push(`  <thead>`);
      linesOut.push(`    <tr>`);
      headerCells.slice(0, maxCols).forEach((cell, idx) => {
        const alignAttr = getAlignAttr(alignments[idx] || 'left');
        linesOut.push(`      <th${alignAttr}>${formatCellContent(cell)}</th>`);
      });
      linesOut.push(`    </tr>`);
      linesOut.push(`  </thead>`);
      linesOut.push(`  <tbody>`);
      bodyRows.forEach((row) => {
        linesOut.push(`    <tr>`);
        row.forEach((cell, idx) => {
          const alignAttr = getAlignAttr(alignments[idx] || 'left');
          linesOut.push(`      <td${alignAttr}>${formatCellContent(cell)}</td>`);
        });
        linesOut.push(`    </tr>`);
      });
      linesOut.push(`  </tbody>`);
      linesOut.push(`</table>`);
      setOutput(linesOut.join('\n'));
    }
  }, [
    input,
    hasHeader,
    formatMode,
    alignMode,
    parseInlineFormatting,
    isBordered,
    isStriped,
    isHoverable,
    isCompact,
    customClass,
    t,
  ]);

  useEffect(() => {
    generateHTMLTable();
  }, [generateHTMLTable]);

  useEffect(() => {
    if (onStateChange) {
      onStateChange({
        input,
        hasHeader,
        formatMode,
        alignMode,
        parseInlineFormatting,
        isBordered,
        isStriped,
        isHoverable,
        isCompact,
        customClass,
      });
    }
  }, [
    input,
    hasHeader,
    formatMode,
    alignMode,
    parseInlineFormatting,
    isBordered,
    isStriped,
    isHoverable,
    isCompact,
    customClass,
    onStateChange,
  ]);

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success(t('markdowntabletohtml.toast_copied', 'HTML table markup copied to clipboard!'));
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
    toast.success(t('markdowntabletohtml.toast_cleared', 'Input cleared!'));
  };

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'table.html';
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
      name: t('markdowntabletohtml.preset_products', 'Product Inventory'),
      data: `| SKU | Product Name | Category | Price | Stock |\n| :--- | :---: | :---: | ---: | ---: |\n| ELE-101 | **Wireless Mouse** | Electronics | $29.99 | 150 |\n| ELE-102 | **Mechanical Keyboard** | Electronics | $89.50 | 45 |\n| FUR-201 | *Ergonomic Chair* | Furniture | $199.00 | 12 |\n| KIT-301 | Stainless Water Bottle | Kitchen | $15.00 | 80 |`,
    },
    {
      name: t('markdowntabletohtml.preset_users', 'Employee Directory'),
      data: `| ID | Full Name | Role | Department | Status |\n| :---: | :--- | :--- | :---: | :---: |\n| USR-1 | Alice Vance | Lead Engineer | Engineering | \`Active\` |\n| USR-2 | Bob Miller | Product Manager | Product | \`Active\` |\n| USR-3 | Charlie Smith | UX Designer | Design | \`On Leave\` |\n| USR-4 | Diana Prince | QA Manager | Quality | \`Active\` |`,
    },
    {
      name: t('markdowntabletohtml.preset_financial', 'Financial Summary'),
      data: `| Quarter | Revenue | Expenses | Net Profit | Margin |\n| :--- | ---: | ---: | ---: | ---: |\n| Q1 2024 | $120000 | $85000 | $35000 | **29.1%** |\n| Q2 2024 | $145000 | $90000 | $55000 | **37.9%** |\n| Q3 2024 | $132000 | $88000 | $44000 | **33.3%** |\n| Q4 2024 | $160000 | $95000 | $65000 | **40.6%** |`,
    },
    {
      name: t('markdowntabletohtml.preset_status', 'System Status'),
      data: `| Service | Host | Environment | Status | Latency |\n| :--- | :--- | :---: | :---: | ---: |\n| Auth API | auth-prod-1 | Production | \`Operational\` | 24ms |\n| Payment Gateway | pay-prod-2 | Production | \`Operational\` | 42ms |\n| Analytics DB | db-analytics-1 | Staging | *Degraded* | 180ms |\n| Search Worker | srch-prod-4 | Production | \`Operational\` | 12ms |`,
    },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Top Bar with Presets & Shortcuts */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 mr-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            {t('markdowntabletohtml.presets_title', 'Quick Presets:')}
          </span>
          {presets.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => {
                setInput(preset.data);
                toast.success(t('markdowntabletohtml.toast_preset_loaded', 'Preset loaded!'));
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
          {/* HTML Format Mode */}
          <div className="space-y-1.5">
            <label
              htmlFor="md-html-format"
              className="block text-xs font-bold text-slate-600 dark:text-slate-400"
            >
              {t('markdowntabletohtml.format_mode', 'HTML Formatting')}
            </label>
            <select
              id="md-html-format"
              value={formatMode}
              onChange={(e) => setFormatMode(e.target.value as 'pretty' | 'minified')}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="pretty">Pretty-Print (Indented)</option>
              <option value="minified">Minified (Single Line)</option>
            </select>
          </div>

          {/* Alignment Output Style */}
          <div className="space-y-1.5">
            <label
              htmlFor="md-html-align-mode"
              className="block text-xs font-bold text-slate-600 dark:text-slate-400"
            >
              {t('markdowntabletohtml.align_mode', 'Alignment Output Style')}
            </label>
            <select
              id="md-html-align-mode"
              value={alignMode}
              onChange={(e) => setAlignMode(e.target.value as 'css-class' | 'inline-style' | 'none')}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="css-class">CSS Class (class="text-left")</option>
              <option value="inline-style">Inline Style (style="text-align: left;")</option>
              <option value="none">None (No alignment attributes)</option>
            </select>
          </div>

          {/* Custom CSS Class */}
          <div className="space-y-1.5">
            <label
              htmlFor="md-html-custom-class"
              className="block text-xs font-bold text-slate-600 dark:text-slate-400"
            >
              {t('markdowntabletohtml.table_class', 'Table Class')}
            </label>
            <input
              id="md-html-custom-class"
              type="text"
              value={customClass}
              onChange={(e) => setCustomClass(e.target.value)}
              placeholder="e.g. table, my-custom-table"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Header Row Toggle */}
          <div className="flex items-center justify-between sm:justify-start gap-3 pt-4 sm:pt-0">
            <label
              htmlFor="md-html-has-header"
              className="text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer"
            >
              {t('markdowntabletohtml.has_header', 'First row is header')}
            </label>
            <input
              id="md-html-has-header"
              type="checkbox"
              checked={hasHeader}
              onChange={(e) => setHasHeader(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Inline Formatting & Table Style Toggles */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-6 text-xs font-semibold text-slate-600 dark:text-slate-400">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={parseInlineFormatting}
              onChange={(e) => setParseInlineFormatting(e.target.checked)}
              className="w-3.5 h-3.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
            />
            {t('markdowntabletohtml.parse_inline', 'Parse Markdown (bold, italic, code, links)')}
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isBordered}
              onChange={(e) => setIsBordered(e.target.checked)}
              className="w-3.5 h-3.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
            />
            {t('markdowntabletohtml.bordered', 'Bordered (.table-bordered)')}
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isStriped}
              onChange={(e) => setIsStriped(e.target.checked)}
              className="w-3.5 h-3.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
            />
            {t('markdowntabletohtml.striped', 'Striped (.table-striped)')}
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isHoverable}
              onChange={(e) => setIsHoverable(e.target.checked)}
              className="w-3.5 h-3.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
            />
            {t('markdowntabletohtml.hoverable', 'Hoverable (.table-hover)')}
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isCompact}
              onChange={(e) => setIsCompact(e.target.checked)}
              className="w-3.5 h-3.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
            />
            {t('markdowntabletohtml.compact', 'Compact (.table-sm)')}
          </label>
        </div>
      </div>

      {/* Main Input / Output Side-by-Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Markdown Input Panel */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label
              htmlFor="md-html-input"
              className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2"
            >
              <Table className="w-4 h-4 text-indigo-500" />
              {t('markdowntabletohtml.input_label', 'Markdown Table Source')}
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
              id="md-html-input"
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste your Markdown table syntax here..."
              rows={14}
              className="w-full p-4 font-mono text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all shadow-sm resize-y placeholder:text-slate-400"
            />
            <div className="absolute bottom-3 right-3 text-[10px] font-medium text-slate-400 bg-white/80 dark:bg-slate-900/80 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-800">
              {input.length} / {MAX_LENGTH}
            </div>
          </div>
        </div>

        {/* HTML Output Panel */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label
              htmlFor="html-table-output"
              className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2"
            >
              <Code2 className="w-4 h-4 text-emerald-500" />
              {t('markdowntabletohtml.output_label', 'HTML Table Markup')}
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
                {copied ? t('common.copied', 'Copied!') : t('common.copy', 'Copy HTML')}
              </button>
            </div>
          </div>

          <textarea
            id="html-table-output"
            ref={outputRef}
            readOnly
            value={output}
            placeholder={t(
              'markdowntabletohtml.placeholder_output',
              'Generated HTML table markup will appear here...'
            )}
            rows={14}
            className="w-full p-4 font-mono text-xs bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all shadow-sm resize-y text-slate-800 dark:text-slate-200"
          />
        </div>
      </div>

      {/* Info Footer */}
      <div className="p-5 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 text-xs text-slate-600 dark:text-slate-400 space-y-2">
        <div className="flex items-center gap-2 font-bold text-indigo-900 dark:text-indigo-300">
          <Info className="w-4 h-4 text-indigo-500" />
          {t('markdowntabletohtml.about_title', 'About Markdown Table to HTML Converter')}
        </div>
        <p className="leading-relaxed">
          {t(
            'markdowntabletohtml.about_text',
            'Convert Markdown table syntax directly into clean, styled HTML <table> markup. Automatically extracts column alignments from delimiter lines (:---, :---:, ---:), parses inline Markdown formatting (bold, italic, code, links), and offers flexible CSS styling and indentation options. All calculations run 100% client-side in your browser.'
          )}
        </p>
      </div>
    </div>
  );
};

export default MarkdownTableToHTML;
