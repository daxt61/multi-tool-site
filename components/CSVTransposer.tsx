import { useState, useEffect, useCallback, useRef } from 'react';
import { Copy, Check, Trash2, ArrowLeftRight, Download, FileSpreadsheet, Info, AlertCircle, ArrowUpDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;

export function CSVTransposer({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState(initialData?.input || 'ID,Name,Email\n1,John,john@example.com\n2,Jane,jane@example.com');
  const [delimiter, setDelimiter] = useState(initialData?.delimiter || ',');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ input, delimiter });
  }, [input, delimiter, onStateChange]);

  const parseCSV = (text: string, delim: string): string[][] => {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentCell = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentCell += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delim && !inQuotes) {
        currentRow.push(currentCell);
        currentCell = '';
      } else if ((char === '\n' || char === '\r') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') i++;
        currentRow.push(currentCell);
        rows.push(currentRow);
        currentRow = [];
        currentCell = '';
      } else {
        currentCell += char;
      }
    }
    if (currentRow.length > 0 || currentCell !== '') {
      currentRow.push(currentCell);
      rows.push(currentRow);
    }
    return rows;
  };

  const stringifyCSV = (rows: string[][], delim: string): string => {
    return rows.map(row =>
      row.map(cell => {
        const needsQuotes = cell.includes(delim) || cell.includes('"') || cell.includes('\n') || cell.includes('\r');
        return needsQuotes ? `"${cell.replace(/"/g, '""')}"` : cell;
      }).join(delim)
    ).join('\n');
  };

  const handleTranspose = useCallback(() => {
    if (!input.trim()) {
      setOutput('');
      setError(null);
      return;
    }

    if (input.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
      setOutput('');
      return;
    }

    try {
      const rows = parseCSV(input, delimiter).filter(row => row.length > 0 || (row.length === 1 && row[0] !== ''));
      if (rows.length === 0) {
        setOutput('');
        return;
      }

      const maxCols = Math.max(...rows.map(row => row.length));
      const transposed: string[][] = Array.from({ length: maxCols }, () => []);

      for (let r = 0; r < rows.length; r++) {
        for (let c = 0; c < maxCols; c++) {
          transposed[c][r] = rows[r][c] || '';
        }
      }

      setOutput(stringifyCSV(transposed, delimiter));
      setError(null);
    } catch (e: any) {
      setError((t('error.invalid_csv') || 'Invalid CSV') + ': ' + e.message);
      setOutput('');
    }
  }, [input, delimiter, t]);

  useEffect(() => {
    const timeout = setTimeout(handleTranspose, 300);
    return () => clearTimeout(timeout);
  }, [handleTranspose]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success(t('common.copied'));
    setTimeout(() => setCopied(false), 2000);
  }, [output, t]);

  const handleClear = useCallback(() => {
    setInput('');
    setOutput('');
    setError(null);
    setTimeout(() => textareaRef.current?.focus(), 0);
  }, []);

  const handleSwap = useCallback(() => {
    if (!output) return;
    setInput(output);
    setTimeout(() => textareaRef.current?.focus(), 0);
  }, [output]);

  const handlersRef = useRef({ handleCopy, handleClear, handleSwap });
  useEffect(() => {
    handlersRef.current = { handleCopy, handleClear, handleSwap };
  }, [handleCopy, handleClear, handleSwap]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isEditable =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement instanceof HTMLSelectElement ||
        activeElement?.getAttribute("contenteditable") === "true";

      if (isEditable && e.key !== 'Escape') return;

      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        handlersRef.current.handleClear();
      } else if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handlersRef.current.handleCopy();
      } else if (e.key.toLowerCase() === 's') {
        e.preventDefault();
        handlersRef.current.handleSwap();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transposed.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="space-y-6">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="csv-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-indigo-500" /> {t('common.input')} CSV/TSV
            </label>
            <div className="flex gap-2 items-center">
              <select
                value={delimiter}
                onChange={(e) => setDelimiter(e.target.value)}
                className="text-xs font-bold bg-slate-100 dark:bg-slate-800 border-none rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-indigo-500/20"
                aria-label={t('csvmapper.input_delimiter')}
              >
                <option value=",">Comma (,)</option>
                <option value=";">Semicolon (;)</option>
                <option value="	">Tab (\t)</option>
                <option value="|">Pipe (|)</option>
              </select>
              <Kbd modifier={null} className="hidden sm:inline-flex border-rose-200 dark:border-rose-800 text-rose-400 dark:bg-slate-900">Esc</Kbd>
              <button
                onClick={handleClear}
                className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all"
              >
                <Trash2 className="w-3 h-3" /> {t('common.clear')}
              </button>
            </div>
          </div>

          <textarea
            id="csv-input"
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste your CSV data here..."
            className="w-full h-[400px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="csv-output" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4 text-emerald-500" /> {t('common.result')}
            </label>
            <div className="flex gap-2">
              <button
                onClick={handleSwap}
                disabled={!output}
                className="text-xs font-bold px-3 py-1.5 rounded-xl text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 transition-all flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                title={`${t('common.swap')} (S)`}
              >
                <ArrowUpDown className="w-3.5 h-3.5" /> {t('common.swap')}
                <Kbd modifier={null} className="hidden sm:inline-flex border-indigo-200 dark:border-indigo-800 text-slate-400 ml-0.5">S</Kbd>
              </button>
              <button
                onClick={handleDownload}
                disabled={!output}
                className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" /> {t('common.download')}
              </button>
              <button
                onClick={handleCopy}
                disabled={!output}
                className={`text-xs font-bold px-4 py-1.5 rounded-xl transition-all border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none flex items-center gap-2 ${
                  copied
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200'
                    : 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-slate-200 dark:border-slate-700 hover:border-indigo-500/50'
                } disabled:opacity-50`}
                title={`${t('common.copy')} (C)`}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? t('common.copied') : t('common.copy')}
                {!copied && <Kbd modifier={null} className="hidden sm:inline-flex border-indigo-200 dark:border-indigo-800 text-slate-400 ml-0.5">C</Kbd>}
              </button>
            </div>
          </div>
          <textarea
            id="csv-output"
            readOnly
            value={output}
            placeholder="Transposed CSV will appear here..."
            className="w-full h-[400px] p-6 bg-slate-900 border border-slate-800 rounded-3xl outline-none font-mono text-sm leading-relaxed text-indigo-300 resize-none"
          />
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <Info className="w-6 h-6 text-indigo-500 mt-1" />
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">About CSV Transposer</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            This tool swaps the rows and columns of your CSV or TSV data. This operation is known as transposing a matrix. It's particularly useful when you need to change the orientation of a dataset for analysis or reporting. The tool correctly handles quoted fields containing delimiters or newlines.
          </p>
        </div>
      </div>
    </div>
  );
}
