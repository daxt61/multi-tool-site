import { useState, useEffect, useCallback, useRef } from 'react';
import { Table, Copy, Check, Trash2, AlertCircle, Download, Settings2, FileText, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;

type QuoteMode = 'smart' | 'always' | 'strip';

interface Preset {
  nameKey: string;
  delimiter: string;
  quoteMode: QuoteMode;
  hasHeader: boolean;
  trimCells: boolean;
  markdown: string;
}

const PRESETS: Preset[] = [
  {
    nameKey: 'markdowntabletocsv.preset_products',
    delimiter: ',',
    quoteMode: 'smart',
    hasHeader: true,
    trimCells: true,
    markdown: `| ID | Product Name | Category | Price | Stock |\n| --- | :--- | :---: | ---: | :---: |\n| 101 | Wireless Headphones, Pro | Electronics | $89.99 | In Stock |\n| 102 | Ergonomic Mouse | Accessories | $45.50 | Low Stock |\n| 103 | Mechanical Keyboard | Peripherals | $129.00 | In Stock |`,
  },
  {
    nameKey: 'markdowntabletocsv.preset_users',
    delimiter: ';',
    quoteMode: 'smart',
    hasHeader: true,
    trimCells: true,
    markdown: `| User ID | Full Name | Email Address | Role |\n| :--- | :--- | :--- | :--- |\n| USR-001 | Alice Dupont | alice@example.com | Administrator |\n| USR-002 | Bob Martin | bob@example.com | Editor |\n| USR-003 | Charlie Roy | charlie@example.com | Viewer |`,
  },
  {
    nameKey: 'markdowntabletocsv.preset_financial',
    delimiter: '\t',
    quoteMode: 'smart',
    hasHeader: true,
    trimCells: true,
    markdown: `| Month | Revenue | Expenses | Net Profit |\n| --- | ---: | ---: | ---: |\n| January | 45000.00 | 28000.00 | 17000.00 |\n| February | 52000.00 | 31000.00 | 21000.00 |\n| March | 61000.00 | 34000.00 | 27000.00 |`,
  },
  {
    nameKey: 'markdowntabletocsv.preset_status',
    delimiter: '|',
    quoteMode: 'strip',
    hasHeader: true,
    trimCells: true,
    markdown: `| Service | Region | Status | Uptime |\n| :--- | :--- | :---: | ---: |\n| API Gateway | us-east-1 | OPERATIONAL | 99.99% |\n| Auth Service | eu-west-1 | OPERATIONAL | 99.95% |\n| Database Cluster | us-west-2 | DEGRADED | 98.50% |`,
  },
];

export function MarkdownTableToCSV({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [markdown, setMarkdown] = useState(initialData?.markdown || PRESETS[0].markdown);
  const [delimiter, setDelimiter] = useState(initialData?.delimiter || PRESETS[0].delimiter);
  const [quoteMode, setQuoteMode] = useState<QuoteMode>(initialData?.quoteMode || PRESETS[0].quoteMode);
  const [hasHeader, setHasHeader] = useState(initialData?.hasHeader ?? true);
  const [trimCells, setTrimCells] = useState(initialData?.trimCells ?? true);
  const [skipEmptyRows, setSkipEmptyRows] = useState(initialData?.skipEmptyRows ?? true);

  const [outputCsv, setOutputCsv] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState({ rows: 0, cols: 0, inputChars: 0, outputChars: 0 });

  useEffect(() => {
    onStateChange?.({ markdown, delimiter, quoteMode, hasHeader, trimCells, skipEmptyRows });
  }, [markdown, delimiter, quoteMode, hasHeader, trimCells, skipEmptyRows, onStateChange]);

  const isSeparatorRow = (line: string): boolean => {
    const trimmed = line.trim().replace(/^\||\|$/g, '');
    if (!trimmed) return false;
    const cells = trimmed.split('|');
    return cells.every(cell => /^[\s:-]+$/.test(cell));
  };

  const parseMarkdownLine = (line: string): string[] => {
    let clean = line.trim();
    if (clean.startsWith('|')) clean = clean.slice(1);
    if (clean.endsWith('|') && !clean.endsWith('\\|')) clean = clean.slice(0, -1);

    const cells: string[] = [];
    let cur = '';
    let escaped = false;

    for (let i = 0; i < clean.length; i++) {
      const char = clean[i];
      if (escaped) {
        cur += char;
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === '|') {
        cells.push(cur);
        cur = '';
      } else {
        cur += char;
      }
    }
    cells.push(cur);

    return cells.map(c => (trimCells ? c.trim() : c));
  };

  const formatCSVCell = (val: string, delim: string, mode: QuoteMode): string => {
    let cell = val;
    if (mode === 'strip') {
      return cell.replace(/"/g, '');
    }

    const needsQuotes =
      mode === 'always' ||
      cell.includes(delim) ||
      cell.includes('\n') ||
      cell.includes('\r') ||
      cell.includes('"');

    if (needsQuotes) {
      return `"${cell.replace(/"/g, '""')}"`;
    }

    return cell;
  };

  const convertMarkdownToCSV = useCallback(() => {
    if (!markdown.trim()) {
      setOutputCsv('');
      setError(null);
      setStats({ rows: 0, cols: 0, inputChars: 0, outputChars: 0 });
      return;
    }

    if (markdown.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
      setOutputCsv('');
      return;
    }

    try {
      const lines = markdown.trim().split('\n');
      const validRows: string[][] = [];

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed && skipEmptyRows) continue;
        if (isSeparatorRow(line)) continue;
        if (!trimmed.includes('|')) continue;

        const cells = parseMarkdownLine(line);
        validRows.push(cells);
      }

      if (validRows.length === 0) {
        setError(t('markdowntabletocsv.no_table_found'));
        setOutputCsv('');
        setStats({ rows: 0, cols: 0, inputChars: markdown.length, outputChars: 0 });
        return;
      }

      const maxCols = Math.max(...validRows.map(r => r.length));

      const formattedRows = validRows.map(row => {
        const paddedRow = [...row];
        while (paddedRow.length < maxCols) {
          paddedRow.push('');
        }
        return paddedRow.map(cell => formatCSVCell(cell, delimiter, quoteMode)).join(delimiter);
      });

      const result = formattedRows.join('\n');
      setOutputCsv(result);
      setError(null);
      setStats({
        rows: formattedRows.length,
        cols: maxCols,
        inputChars: markdown.length,
        outputChars: result.length,
      });
    } catch (err: any) {
      setError(err.message || 'Error converting Markdown table');
      setOutputCsv('');
    }
  }, [markdown, delimiter, quoteMode, trimCells, skipEmptyRows, t]);

  useEffect(() => {
    const timeout = setTimeout(convertMarkdownToCSV, 150);
    return () => clearTimeout(timeout);
  }, [convertMarkdownToCSV]);

  const handleCopy = useCallback(() => {
    if (!outputCsv) return;
    navigator.clipboard.writeText(outputCsv);
    setCopied(true);
    toast.success(t('markdowntabletocsv.toast_copied'));
    setTimeout(() => setCopied(false), 2000);
  }, [outputCsv, t]);

  const handleClear = useCallback(() => {
    setMarkdown('');
    setOutputCsv('');
    setError(null);
    setStats({ rows: 0, cols: 0, inputChars: 0, outputChars: 0 });
    toast.success(t('markdowntabletocsv.toast_cleared'));
    inputRef.current?.focus();
  }, [t]);

  const handleDownload = () => {
    if (!outputCsv) return;
    const ext = delimiter === '\t' ? 'tsv' : 'csv';
    const blob = new Blob([outputCsv], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `table_export.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(t('common.download_success'));
  };

  const handleLoadPreset = (preset: Preset) => {
    setDelimiter(preset.delimiter);
    setQuoteMode(preset.quoteMode);
    setHasHeader(preset.hasHeader);
    setTrimCells(preset.trimCells);
    setMarkdown(preset.markdown);
    toast.success(t('markdowntabletocsv.toast_preset_loaded'));
  };

  const handlersRef = useRef({
    onClear: handleClear,
    onCopy: handleCopy,
  });

  useEffect(() => {
    handlersRef.current = {
      onClear: handleClear,
      onCopy: handleCopy,
    };
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const htmlEl = activeEl as HTMLElement | null;
      const isEditable = htmlEl && (
        htmlEl.tagName === 'INPUT' ||
        htmlEl.tagName === 'TEXTAREA' ||
        Boolean(htmlEl.isContentEditable)
      );

      if (e.key === 'Escape') {
        if (isEditable && htmlEl) {
          htmlEl.blur();
        }
        handlersRef.current.onClear();
      } else if ((e.key === 'c' || e.key === 'C') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (!isEditable) {
          e.preventDefault();
          handlersRef.current.onCopy();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Quick Presets */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-500" />
          <span className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('markdowntabletocsv.presets_title')}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleLoadPreset(p)}
              className="text-xs font-bold px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 text-slate-700 dark:text-slate-200 transition-all shadow-sm"
            >
              {t(p.nameKey)}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Dataset Statistics */}
      {stats.rows > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
              {t('markdowntabletocsv.stat_rows')}
            </span>
            <span className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400">{stats.rows}</span>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
              {t('markdowntabletocsv.stat_cols')}
            </span>
            <span className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400">{stats.cols}</span>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
              {t('markdowntabletocsv.stat_input_chars')}
            </span>
            <span className="text-xl font-extrabold text-slate-700 dark:text-slate-300">{stats.inputChars}</span>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
              {t('markdowntabletocsv.stat_output_chars')}
            </span>
            <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">{stats.outputChars}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Settings Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-6 shadow-sm">
            <div className="flex items-center gap-2 px-1">
              <Settings2 className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{t('common.options')}</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="output-delimiter" className="text-xs font-bold text-slate-500 px-1 uppercase">
                  {t('markdowntabletocsv.output_delimiter')}
                </label>
                <select
                  id="output-delimiter"
                  value={delimiter}
                  onChange={(e) => setDelimiter(e.target.value)}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-bold cursor-pointer"
                >
                  <option value=",">Comma (,)</option>
                  <option value=";">Semicolon (;)</option>
                  <option value="	">Tab (\t)</option>
                  <option value="|">Pipe (|)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="quote-mode" className="text-xs font-bold text-slate-500 px-1 uppercase">
                  {t('markdowntabletocsv.quote_mode')}
                </label>
                <select
                  id="quote-mode"
                  value={quoteMode}
                  onChange={(e) => setQuoteMode(e.target.value as QuoteMode)}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-bold cursor-pointer"
                >
                  <option value="smart">{t('markdowntabletocsv.quote_smart')}</option>
                  <option value="always">{t('markdowntabletocsv.quote_always')}</option>
                  <option value="strip">{t('markdowntabletocsv.quote_strip')}</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => setTrimCells(!trimCells)}
                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                  trimCells
                    ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                }`}
              >
                <span className="text-sm font-bold">{t('markdowntabletocsv.trim_cells')}</span>
                <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                  trimCells ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 dark:border-slate-600'
                }`}>
                  {trimCells && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSkipEmptyRows(!skipEmptyRows)}
                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                  skipEmptyRows
                    ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                }`}
              >
                <span className="text-sm font-bold">{t('markdowntabletocsv.skip_empty_rows')}</span>
                <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                  skipEmptyRows ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 dark:border-slate-600'
                }`}>
                  {skipEmptyRows && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Main Editor */}
        <div className="lg:col-span-8 space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-500" />
                <label htmlFor="md-table-input" className="text-xs font-black uppercase tracking-widest text-slate-400">
                  {t('markdowntabletocsv.input_label')}
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Kbd modifier={null}>Esc</Kbd>
                <button
                  onClick={handleClear}
                  disabled={!markdown}
                  className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl transition-all disabled:opacity-50 flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {t('common.clear')}
                </button>
              </div>
            </div>
            <textarea
              id="md-table-input"
              ref={inputRef}
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              placeholder="| Header 1 | Header 2 |\n| --- | --- |\n| Cell 1 | Cell 2 |"
              className="w-full h-52 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm dark:text-slate-300 resize-none"
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <div className="flex items-center gap-2">
                <Table className="w-4 h-4 text-emerald-500" />
                <label htmlFor="csv-table-output" className="text-xs font-black uppercase tracking-widest text-slate-400">
                  {t('markdowntabletocsv.output_label')}
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Kbd modifier={null}>C</Kbd>
                <button
                  onClick={handleDownload}
                  disabled={!outputCsv}
                  className="text-xs font-bold px-3 py-1.5 rounded-xl text-indigo-600 bg-indigo-50 dark:bg-indigo-900/10 hover:bg-indigo-100 transition-all flex items-center gap-1 disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" /> {t('common.download')}
                </button>
                <button
                  onClick={handleCopy}
                  disabled={!outputCsv}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 border ${
                    copied
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                      : 'text-slate-600 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  } disabled:opacity-50`}
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} {copied ? t('common.copied') : t('common.copy')}
                </button>
              </div>
            </div>
            <textarea
              id="csv-table-output"
              value={outputCsv}
              readOnly
              placeholder={t('markdowntabletocsv.placeholder_output')}
              className="w-full h-64 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-mono text-sm leading-relaxed text-indigo-600 dark:text-indigo-400 resize-none shadow-inner"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
