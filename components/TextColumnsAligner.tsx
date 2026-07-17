import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Columns, Copy, Check, Trash2, Download, Settings2, Type, Info, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Kbd } from './ui/Kbd';
import { toast } from 'sonner';

const MAX_LENGTH = 100000;

export function TextColumnsAligner({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [input, setInput] = useState<string>(initialData?.input || '');
  const [delimiterType, setDelimiterType] = useState<'space' | 'tab' | 'comma' | 'semicolon' | 'pipe' | 'custom'>(initialData?.delimiterType || 'space');
  const [customDelimiter, setCustomDelimiter] = useState<string>(initialData?.customDelimiter || '');
  const [margin, setMargin] = useState<number>(initialData?.margin ?? 3);
  const [alignment, setAlignment] = useState<'left' | 'center' | 'right'>(initialData?.alignment || 'left');
  const [collapseDelimiters, setCollapseDelimiters] = useState<boolean>(initialData?.collapseDelimiters ?? true);
  const [trimCells, setTrimCells] = useState<boolean>(initialData?.trimCells ?? true);

  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    onStateChange?.({
      input,
      delimiterType,
      customDelimiter,
      margin,
      alignment,
      collapseDelimiters,
      trimCells,
    });
  }, [input, delimiterType, customDelimiter, margin, alignment, collapseDelimiters, trimCells, onStateChange]);

  const output = useMemo(() => {
    if (!input) return '';
    if (input.length > MAX_LENGTH) {
      return t('error.max_length', { max: MAX_LENGTH.toLocaleString() });
    }

    // Determine the split delimiter
    let delimiter: RegExp | string = ' ';
    if (delimiterType === 'tab') {
      delimiter = '\t';
    } else if (delimiterType === 'comma') {
      delimiter = ',';
    } else if (delimiterType === 'semicolon') {
      delimiter = ';';
    } else if (delimiterType === 'pipe') {
      delimiter = '|';
    } else if (delimiterType === 'custom') {
      delimiter = customDelimiter || ' ';
    }

    const lines = input.split('\n');

    // Parse into grid (array of string arrays) to prevent Prototype Pollution
    const grid: string[][] = lines.map((line) => {
      let cells: string[] = [];

      if (delimiterType === 'space' && collapseDelimiters) {
        // Split by one or more spaces
        cells = line.split(/\s+/);
        // If line started or ended with space, there might be empty strings at ends
        if (cells[0] === '') cells.shift();
        if (cells[cells.length - 1] === '') cells.pop();
      } else if (typeof delimiter === 'string' && collapseDelimiters && delimiter !== '') {
        // Escape helper for building custom delimiter regex
        const escaped = delimiter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`${escaped}+`);
        cells = line.split(regex);
      } else {
        cells = line.split(delimiter);
      }

      if (trimCells) {
        cells = cells.map((cell) => cell.trim());
      }
      return cells;
    });

    // Find the maximum number of columns across all lines
    const colCount = Math.max(...grid.map((row) => row.length));

    // Find maximum length of cells in each column
    const colWidths = Array(colCount).fill(0);
    grid.forEach((row) => {
      row.forEach((cell, colIdx) => {
        colWidths[colIdx] = Math.max(colWidths[colIdx], cell.length);
      });
    });

    const spacer = ' '.repeat(Math.max(1, Math.min(10, margin)));

    // Format every cell according to column widths and global alignment
    return grid
      .map((row) => {
        // Skip entirely empty row
        if (row.length === 1 && row[0] === '') return '';

        return row
          .map((cell, colIdx) => {
            const width = colWidths[colIdx];
            const diff = width - cell.length;
            if (diff <= 0) return cell;

            if (alignment === 'left') {
              return cell + ' '.repeat(diff);
            } else if (alignment === 'right') {
              return ' '.repeat(diff) + cell;
            } else {
              // Center align
              const left = Math.floor(diff / 2);
              const right = diff - left;
              return ' '.repeat(left) + cell + ' '.repeat(right);
            }
          })
          .join(spacer);
      })
      .join('\n');
  }, [input, delimiterType, customDelimiter, margin, alignment, collapseDelimiters, trimCells, t]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success(t('common.copied'));
    setTimeout(() => setCopied(false), 2000);
  }, [output, t]);

  const handleDownload = useCallback(() => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `aligned-columns-${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(t('common.download_success'));
  }, [output, t]);

  const handleClear = useCallback(() => {
    setInput('');
    setDelimiterType('space');
    setCustomDelimiter('');
    setMargin(3);
    setAlignment('left');
    setCollapseDelimiters(true);
    setTrimCells(true);
    inputRef.current?.focus();
  }, []);

  const handlersRef = useRef({ handleClear });
  useEffect(() => {
    handlersRef.current = { handleClear };
  }, [handleClear]);

  // Local keydown handler to prevent global collision
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      handlersRef.current.handleClear();
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8" onKeyDown={handleKeyDown}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column - Options */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 px-1">
              <Settings2 className="w-4 h-4 text-indigo-500" /> {t('common.options')}
            </div>

            <div className="space-y-4">
              {/* Input Delimiter Type */}
              <div className="space-y-2">
                <label htmlFor="delim-type" className="text-[10px] font-bold text-slate-400 uppercase px-1">
                  {t('textcolumnsaligner.delimiter_type', 'Column Delimiter')}
                </label>
                <select
                  id="delim-type"
                  value={delimiterType}
                  onChange={(e) => setDelimiterType(e.target.value as any)}
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-bold"
                >
                  <option value="space">{t('textcolumnsaligner.delim_space', 'Space / Whitespace')}</option>
                  <option value="tab">{t('textcolumnsaligner.delim_tab', 'Tab')}</option>
                  <option value="comma">{t('textcolumnsaligner.delim_comma', 'Comma (,)')}</option>
                  <option value="semicolon">{t('textcolumnsaligner.delim_semicolon', 'Semicolon (;)')}</option>
                  <option value="pipe">{t('textcolumnsaligner.delim_pipe', 'Pipe (|)')}</option>
                  <option value="custom">{t('textcolumnsaligner.delim_custom', 'Custom String')}</option>
                </select>
              </div>

              {/* Custom Delimiter text input */}
              {delimiterType === 'custom' && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                  <label htmlFor="custom-delim-input" className="text-[10px] font-bold text-slate-400 uppercase px-1">
                    {t('textcolumnsaligner.custom_delim', 'Custom Delimiter Character')}
                  </label>
                  <input
                    id="custom-delim-input"
                    type="text"
                    value={customDelimiter}
                    onChange={(e) => setCustomDelimiter(e.target.value)}
                    placeholder="e.g. -> or /"
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono"
                  />
                </div>
              )}

              {/* Margin / Column Spacing */}
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label htmlFor="margin-range" className="text-[10px] font-bold text-slate-400 uppercase">
                    {t('textcolumnsaligner.margin_label', 'Column Margin (spaces)')}
                  </label>
                  <span className="text-xs font-mono font-bold text-indigo-500">{margin}</span>
                </div>
                <input
                  id="margin-range"
                  type="range"
                  min="1"
                  max="10"
                  value={margin}
                  onChange={(e) => setMargin(parseInt(e.target.value) || 1)}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              {/* Global Alignment */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase px-1">
                  {t('texttoimage.alignment')}
                </label>
                <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setAlignment('left')}
                    className={`flex-1 flex items-center justify-center py-2 rounded-lg transition-all ${alignment === 'left' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    aria-label={t('texttoimage.align_left')}
                    title={t('texttoimage.align_left')}
                  >
                    <AlignLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setAlignment('center')}
                    className={`flex-1 flex items-center justify-center py-2 rounded-lg transition-all ${alignment === 'center' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    aria-label={t('texttoimage.align_center')}
                    title={t('texttoimage.align_center')}
                  >
                    <AlignCenter className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setAlignment('right')}
                    className={`flex-1 flex items-center justify-center py-2 rounded-lg transition-all ${alignment === 'right' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    aria-label={t('texttoimage.align_right')}
                    title={t('texttoimage.align_right')}
                  >
                    <AlignRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={collapseDelimiters}
                    onChange={(e) => setCollapseDelimiters(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    {t('textcolumnsaligner.collapse_delimiters', 'Collapse adjacent separators')}
                  </span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={trimCells}
                    onChange={(e) => setTrimCells(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    {t('textcolumnsaligner.trim_cells', 'Trim cell values')}
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Right column - Input/Output */}
        <div className="lg:col-span-2 space-y-6">
          {/* Input Text Area */}
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="input-text" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Type className="w-4 h-4 text-indigo-500" /> {t('common.input')}
              </label>
              <button
                type="button"
                onClick={handleClear}
                className="text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none rounded-lg px-2 py-1"
                aria-label={t('common.clear')}
              >
                <Trash2 className="w-3.5 h-3.5" /> {t('common.clear')}
                <Kbd modifier={null} className="ml-1 border-rose-200 dark:border-rose-800 text-rose-400 dark:bg-slate-900">Esc</Kbd>
              </button>
            </div>
            <textarea
              id="input-text"
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t(
                'textcolumnsaligner.placeholder',
                'id name email\n1 John john@example.com\n2 Jane jane@example.com'
              )}
              className="w-full h-64 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
            />
          </div>

          {/* Output Text Area */}
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="output-text" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Columns className="w-4 h-4 text-indigo-500" /> {t('common.output')}
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={!output}
                  className="text-xs font-bold px-3 py-1.5 rounded-xl text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 transition-all flex items-center gap-1 disabled:opacity-50"
                  aria-label={t('common.download')}
                >
                  <Download className="w-3.5 h-3.5" /> {t('common.download')}
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
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? t('common.copied') : t('common.copy')}
                </button>
              </div>
            </div>
            <textarea
              id="output-text"
              value={output}
              readOnly
              className="w-full h-64 p-6 bg-slate-900 text-indigo-300 border border-slate-800 rounded-[2rem] outline-none font-mono text-sm leading-relaxed resize-none"
              placeholder={t('common.waiting')}
            />
          </div>
        </div>
      </div>

      {/* Educational Block */}
      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <Info className="w-6 h-6 text-indigo-500 mt-1 shrink-0" />
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('textcolumnsaligner.about_title', 'About Text Columns Aligner')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t(
              'textcolumnsaligner.about_text',
              'Align columns in character-separated text. This utility reads raw table data or terminal outputs and formats each column using uniform spacing so that they align vertically. This is ideal for transforming raw logs, CSV outputs, or space-separated lists into readable text-based tables.'
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
