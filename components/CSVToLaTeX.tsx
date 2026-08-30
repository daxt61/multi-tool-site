import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { FileCode, Table, Copy, Check, Trash2, Download, AlertCircle, Info, Settings2, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;

type LaTeXStyle = 'booktabs' | 'standard' | 'minimal';
type Alignment = 'left' | 'center' | 'right';

const PRESETS = [
  {
    id: 'academic',
    labelKey: 'csvtolatex.preset_academic',
    defaultLabel: 'Academic Results',
    data: 'Student,Subject,Score,Grade\nAlice,Mathematics,95,A+\nBob,Physics,88,A\nCharlie,Chemistry,76,B',
  },
  {
    id: 'inventory',
    labelKey: 'csvtolatex.preset_inventory',
    defaultLabel: 'Product Inventory',
    data: 'SKU,Product Name,Category,Price ($),Stock\nPRD-001,Wireless Ergonomic Mouse,Electronics,49.99,120\nPRD-002,Mechanical Keyboard,Electronics,129.50,45\nPRD-003,Desk Mat,Accessories,19.99,200',
  },
  {
    id: 'financial',
    labelKey: 'csvtolatex.preset_financial',
    defaultLabel: 'Financial Report',
    data: 'Quarter,Revenue ($),Expenses ($),Net Profit ($)\nQ1 2024,150000.00,95000.00,55000.00\nQ2 2024,182000.00,102000.00,80000.00\nQ3 2024,195000.00,110000.00,85000.00',
  },
];

export function CSVToLaTeX({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [input, setInput] = useState<string>(initialData?.input ?? PRESETS[0].data);
  const [delimiter, setDelimiter] = useState<string>(initialData?.delimiter || 'auto');
  const [hasHeader, setHasHeader] = useState<boolean>(initialData?.hasHeader ?? true);
  const [boldHeader, setBoldHeader] = useState<boolean>(initialData?.boldHeader ?? true);
  const [style, setStyle] = useState<LaTeXStyle>(initialData?.style || 'booktabs');
  const [alignment, setAlignment] = useState<Alignment>(initialData?.alignment || 'left');
  const [vlines, setVlines] = useState<boolean>(initialData?.vlines ?? false);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    onStateChange?.({ input, delimiter, hasHeader, boldHeader, style, alignment, vlines });
  }, [input, delimiter, hasHeader, boldHeader, style, alignment, vlines, onStateChange]);

  // Auto-detect delimiter if requested
  const detectDelimiter = useCallback((text: string): string => {
    const firstLine = text.split(/\r?\n/)[0] || '';
    const counts = {
      ',': (firstLine.match(/,/g) || []).length,
      ';': (firstLine.match(/;/g) || []).length,
      '\t': (firstLine.match(/\t/g) || []).length,
      '|': (firstLine.match(/\|/g) || []).length,
    };
    let best = ',';
    let max = 0;
    for (const [delim, count] of Object.entries(counts)) {
      if (count > max) {
        max = count;
        best = delim;
      }
    }
    return best;
  }, []);

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

  const escapeLaTeX = useCallback((str: string): string => {
    const map: Record<string, string> = {
      '&': '\\&',
      '%': '\\%',
      '$': '\\$',
      '#': '\\#',
      '_': '\\_',
      '{': '\\{',
      '}': '\\}',
      '~': '\\textasciitilde{}',
      '^': '\\textasciicircum{}',
      '\\': '\\textbackslash{}',
    };
    return str.replace(/[&%$#_{}~^\\]/g, (m) => map[m] || m);
  }, []);

  const output = useMemo(() => {
    if (!input.trim()) return '';
    if (input.length > MAX_LENGTH) return '';

    try {
      const activeDelim = delimiter === 'auto' ? detectDelimiter(input) : delimiter;
      const lines = input.trim().split(/\r?\n/).filter(line => line.trim().length > 0);
      if (lines.length === 0) return '';

      const rawData = lines.map(line => parseCSVLine(line, activeDelim));
      const colCount = Math.max(...rawData.map(row => row.length));
      if (colCount === 0) return '';

      const normalizedData = rawData.map(row => {
        const newRow = [...row];
        while (newRow.length < colCount) newRow.push('');
        return newRow;
      });

      const headers = hasHeader
        ? normalizedData[0]
        : Array.from({ length: colCount }, (_, i) => `Col ${i + 1}`);
      const body = hasHeader ? normalizedData.slice(1) : normalizedData;

      const alignChar = alignment === 'left' ? 'l' : alignment === 'center' ? 'c' : 'r';
      const colSpec = vlines
        ? `|${Array(colCount).fill(alignChar).join('|')}|`
        : Array(colCount).fill(alignChar).join(' ');

      let latex = `\\begin{tabular}{${colSpec}}\n`;

      if (style === 'booktabs') {
        latex += '  \\toprule\n';
      } else if (style === 'standard') {
        latex += '  \\hline\n';
      }

      // Format Headers
      if (headers.length > 0) {
        const formattedHeaders = headers.map(h => {
          const escaped = escapeLaTeX(h);
          return boldHeader ? `\\textbf{${escaped}}` : escaped;
        });
        latex += `  ${formattedHeaders.join(' & ')} \\\\\n`;

        if (style === 'booktabs') {
          latex += '  \\midrule\n';
        } else if (style === 'standard') {
          latex += '  \\hline\n';
        }
      }

      // Format Body Rows
      body.forEach(row => {
        const formattedRow = row.map(cell => escapeLaTeX(cell));
        latex += `  ${formattedRow.join(' & ')} \\\\\n`;
        if (style === 'standard') {
          latex += '  \\hline\n';
        }
      });

      if (style === 'booktabs') {
        latex += '  \\bottomrule\n';
      }

      latex += '\\end{tabular}';
      return latex;
    } catch {
      return '';
    }
  }, [input, delimiter, hasHeader, boldHeader, style, alignment, vlines, detectDelimiter, parseCSVLine, escapeLaTeX]);

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
    toast.success(t('csvtolatex.toast_copied', 'LaTeX table code copied to clipboard!'));
    setTimeout(() => setCopied(false), 2000);
  }, [output, t]);

  const handleClear = useCallback(() => {
    setInput('');
    if (inputRef.current) inputRef.current.focus();
    toast.success(t('csvtolatex.toast_cleared', 'Input cleared and focus restored!'));
  }, [t]);

  const handleDownload = useCallback(() => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `table-${Date.now()}.tex`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t('common.download_success', 'Download successful'));
  }, [output, t]);

  const handleLoadPreset = useCallback((presetData: string, nameKey: string) => {
    setInput(presetData);
    toast.success(t('csvtolatex.toast_preset_loaded', 'Preset loaded successfully!'));
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
            {t('csvtolatex.presets_title', 'Quick Presets:')}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleLoadPreset(preset.data, preset.labelKey)}
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
              <FileCode className="w-4 h-4 text-indigo-500" aria-hidden="true" />
              <label htmlFor="csv-latex-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('csvtolatex.input_label', 'CSV / TSV Input Data')}
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
            id="csv-latex-input"
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full h-[400px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
            placeholder="Student,Subject,Score..."
          />
        </div>

        {/* Output */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Table className="w-4 h-4 text-indigo-500" aria-hidden="true" />
              <label htmlFor="csv-latex-output" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('csvtolatex.output_label', 'LaTeX Table Markup')}
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
            id="csv-latex-output"
            readOnly
            value={output}
            placeholder={t('csvtolatex.placeholder_output', 'Generated LaTeX table code will appear here...')}
            className="w-full h-[400px] p-6 bg-slate-900 dark:bg-black border border-slate-800 rounded-3xl overflow-auto font-mono text-xs md:text-sm leading-relaxed text-indigo-300 selection:bg-indigo-500/30 resize-none outline-none"
          />
        </div>
      </div>

      {/* Options Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-8 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2rem] space-y-6">
          <div className="flex items-center gap-2 text-indigo-500 px-1">
            <Settings2 className="w-4 h-4" aria-hidden="true" />
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{t('common.options', 'Options')}</h3>
          </div>

          <div className="space-y-6">
            {/* Delimiter */}
            <div className="space-y-2">
              <label htmlFor="csv-latex-delim" className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                {t('csvtosql.delimiter', 'Delimiter')}
              </label>
              <select
                id="csv-latex-delim"
                value={delimiter}
                onChange={(e) => setDelimiter(e.target.value)}
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer"
              >
                <option value="auto">✨ {t('csv_delimiter_changer.auto_detect', 'Auto-detect')}</option>
                <option value=",">Comma (,)</option>
                <option value=";">Semicolon (;)</option>
                <option value="&#9;">Tab (\t)</option>
                <option value="|">Pipe (|)</option>
              </select>
            </div>

            {/* Column Alignment */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                {t('csvtomarkdowntable.column_alignment', 'Column Alignment')}
              </label>
              <div className="flex gap-2">
                {(['left', 'center', 'right'] as const).map((a) => (
                  <button
                    key={a}
                    onClick={() => setAlignment(a)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${
                      alignment === a
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                        : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-indigo-500/50'
                    }`}
                  >
                    {a.charAt(0).toUpperCase() + a.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Checkbox Toggles */}
            <div className="space-y-3">
              <button
                onClick={() => setHasHeader(!hasHeader)}
                className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all font-bold text-xs ${
                  hasHeader
                    ? 'bg-white dark:bg-slate-800 border-indigo-500/50 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                }`}
              >
                <span>{t('csvtosql.has_header', 'First row is header')}</span>
                <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${hasHeader ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300'}`}>
                  {hasHeader && <Check className="w-3 h-3 text-white" aria-hidden="true" />}
                </div>
              </button>

              <button
                onClick={() => setBoldHeader(!boldHeader)}
                className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all font-bold text-xs ${
                  boldHeader
                    ? 'bg-white dark:bg-slate-800 border-indigo-500/50 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                }`}
              >
                <span>{t('csvtolatex.bold_header', 'Bold headers (\\textbf{})')}</span>
                <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${boldHeader ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300'}`}>
                  {boldHeader && <Check className="w-3 h-3 text-white" aria-hidden="true" />}
                </div>
              </button>

              <button
                onClick={() => setVlines(!vlines)}
                className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all font-bold text-xs ${
                  vlines
                    ? 'bg-white dark:bg-slate-800 border-indigo-500/50 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                }`}
              >
                <span>{t('csvtolatex.vlines', 'Vertical gridlines (|c|c|)')}</span>
                <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${vlines ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300'}`}>
                  {vlines && <Check className="w-3 h-3 text-white" aria-hidden="true" />}
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Style Selector & Help */}
        <div className="p-8 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-[2rem] space-y-6 shadow-sm">
          <div className="flex items-center gap-2 text-indigo-500 px-1">
            <Settings2 className="w-4 h-4" aria-hidden="true" />
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{t('csvtolatex.table_style', 'Table Package Style')}</h3>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {[
              { id: 'booktabs', name: 'Booktabs (\\toprule, \\midrule, \\bottomrule)', desc: 'Professional academic publication style' },
              { id: 'standard', name: 'Standard (\\hline)', desc: 'Classic LaTeX tabular horizontal borders' },
              { id: 'minimal', name: 'Minimal (No horizontal lines)', desc: 'Clean unbordered grid layout' },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setStyle(st.id as LaTeXStyle)}
                className={`p-4 rounded-2xl text-left transition-all border ${
                  style === st.id
                    ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-500 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-indigo-500/50'
                }`}
              >
                <div className="font-bold text-xs">{st.name}</div>
                <div className="text-[11px] opacity-70 mt-0.5">{st.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-6 rounded-[2rem] border border-indigo-100 dark:border-indigo-900/20 flex gap-4">
        <Info className="w-6 h-6 text-indigo-600 shrink-0 mt-0.5" aria-hidden="true" />
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('csvtolatex.about_title', 'About CSV to LaTeX Table Converter')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('csvtolatex.about_text', 'Convert raw CSV, TSV, or delimited data files directly into LaTeX tabular markup. Special characters (&, %, $, #, _, {, }, ~, ^, \\) are automatically escaped to prevent compilation errors in Overleaf or TeX compilers.')}
          </p>
        </div>
      </div>
    </div>
  );
}
