import { useState, useEffect, useCallback, useRef } from 'react';
import { Table, Copy, Check, Trash2, FileJson, AlertCircle, Info, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_LENGTH = 50000;

export function ASCIITableToJson({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [input, setInput] = useState(initialData?.input || '');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ input });
  }, [input, onStateChange]);

  const parseTable = useCallback((text: string) => {
    if (!text.trim()) {
      setOutput('');
      setError(null);
      return;
    }

    try {
      const lines = text.trim().split('\n');
      if (lines.length < 2) {
        throw new Error('Table must have at least a header and one data row.');
      }

      // Filter out decorative lines (e.g., +---+ or |---|)
      const dataLines = lines.filter(line => {
        const trimmed = line.trim();
        // Markdown separator line: |---|---|
        if (/^\|?(\s*:?-+:?\s*\|?)+$/.test(trimmed)) return false;
        // ASCII border line: +---+---+
        if (/^\+[-+]*\+$/.test(trimmed)) return false;
        return trimmed.length > 0;
      });

      if (dataLines.length < 1) throw new Error('No data found in table.');

      const parseRow = (line: string) => {
        // Handle both | cell | cell | and space-separated cells
        if (line.includes('|')) {
          return line
            .split('|')
            .filter((_, i, arr) => {
               // Remove empty first/last elements if it starts/ends with |
               if (i === 0 && line.trim().startsWith('|')) return false;
               if (i === arr.length - 1 && line.trim().endsWith('|')) return false;
               return true;
            })
            .map(cell => cell.trim());
        }
        // Fallback to splitting by multiple spaces or tabs
        return line.trim().split(/\s{2,}|\t/).map(cell => cell.trim());
      };

      const headers = parseRow(dataLines[0]);
      const result = [];

      for (let i = 1; i < dataLines.length; i++) {
        const cells = parseRow(dataLines[i]);
        const obj: Record<string, any> = {};

        headers.forEach((header, index) => {
          let value: any = cells[index] || '';
          // Simple type inference
          if (value.toLowerCase() === 'true') value = true;
          else if (value.toLowerCase() === 'false') value = false;
          else if (value.toLowerCase() === 'null') value = null;
          else if (!isNaN(Number(value)) && value !== '') value = Number(value);

          obj[header || `field_${index}`] = value;
        });
        result.push(obj);
      }

      setOutput(JSON.stringify(result, null, 2));
      setError(null);
    } catch (e: any) {
      setError(e.message);
      setOutput('');
    }
  }, []);

  useEffect(() => {
    if (input.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
      setOutput('');
    } else {
      parseTable(input);
    }
  }, [input, parseTable, t]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [output]);

  const handleClear = useCallback(() => {
    setInput('');
    setOutput('');
    setError(null);
  }, []);

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `table-data.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlersRef = useRef({
    handleCopy,
    handleClear
  });

  useEffect(() => {
    handlersRef.current = { handleCopy, handleClear };
  }, [handleCopy, handleClear]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isEditable =
        activeElement?.tagName === "INPUT" ||
        activeElement?.tagName === "TEXTAREA" ||
        activeElement?.getAttribute('contenteditable') === 'true';

      if (isEditable) {
        if (e.key === 'Escape' && activeElement?.id === 'table-input') {
          handlersRef.current.handleClear();
        }
        return;
      }

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

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="table-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Table className="w-4 h-4 text-indigo-500" /> {t('common.input')} (ASCII/Markdown Table)
            </label>
            <div className="flex items-center gap-2">
              <kbd className="hidden sm:inline-flex items-center justify-center px-1.5 py-0.5 border border-rose-200 dark:border-rose-800 rounded text-[10px] font-bold text-rose-400 bg-white dark:bg-slate-900">Esc</kbd>
              <button
                onClick={handleClear}
                disabled={!input}
                className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 transition-all px-2 py-1 rounded-lg flex items-center gap-1 disabled:opacity-50"
              >
                <Trash2 className="w-3 h-3" /> {t('common.clear')}
              </button>
            </div>
          </div>
          <textarea
            id="table-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="| Name | Age |\n|------|-----|\n| John | 30 |"
            className="w-full h-96 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="json-output" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <FileJson className="w-4 h-4 text-emerald-500" /> JSON Output
            </label>
            <div className="flex gap-2">
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
                className={`text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-2 border ${
                  copied
                    ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                    : "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 border-transparent"
                } disabled:opacity-50`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? t('common.copied') : t('common.copy')}
                {!copied && <kbd className="hidden sm:inline-flex items-center justify-center w-4 h-4 border border-indigo-200 dark:border-indigo-800 rounded text-[10px] font-bold bg-white dark:bg-slate-900 ml-1">C</kbd>}
              </button>
            </div>
          </div>
          <textarea
            id="json-output"
            value={output}
            readOnly
            placeholder={t('asciitable.placeholder_output')}
            className="w-full h-96 p-6 bg-slate-900 text-indigo-300 border border-slate-800 rounded-[2.5rem] outline-none font-mono text-sm leading-relaxed resize-none"
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
        <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <Info className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('asciitable.about_title')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('asciitable.about_text')}
          </p>
        </div>
      </div>
    </div>
  );
}
