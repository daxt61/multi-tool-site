import { useState, useEffect, useCallback } from 'react';
import { FileSpreadsheet, Copy, Check, Trash2, ArrowLeftRight, Download, Info, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

const MAX_LENGTH = 100000;

export function CSVTransposer({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [input, setInput] = useState(initialData?.input || '');
  const [output, setOutput] = useState('');
  const [delimiter, setDelimiter] = useState(initialData?.delimiter || ',');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ input, delimiter });
  }, [input, delimiter, onStateChange]);

  const parseLine = (line: string, delim: string) => {
    const result = [];
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
      let val = v.trim();
      if (val.startsWith('"') && val.endsWith('"')) {
        return val.substring(1, val.length - 1).replace(/""/g, '"');
      }
      return val;
    });
  };

  const formatValue = (val: string, delim: string) => {
    if (val.includes(delim) || val.includes('"') || val.includes('\n')) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  };

  const handleTranspose = useCallback(() => {
    if (!input.trim()) {
      setOutput('');
      setError(null);
      return;
    }

    if (input.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
      return;
    }

    try {
      const lines = input.trim().split(/\r?\n/);
      const grid = lines.map((line: string) => parseLine(line, delimiter));

      // Transpose logic
      const rowCount = grid.length;
      const colCount = Math.max(...grid.map((row: string[]) => row.length));

      const transposed: string[][] = Array.from({ length: colCount }, () => Array(rowCount).fill(''));

      for (let r = 0; r < rowCount; r++) {
        for (let c = 0; c < grid[r].length; c++) {
          transposed[c][r] = grid[r][c];
        }
      }

      const outputStr = transposed
        .map(row => row.map(cell => formatValue(cell, delimiter)).join(delimiter))
        .join('\n');

      setOutput(outputStr);
      setError(null);
    } catch (e: any) {
      setError('Error: ' + e.message);
    }
  }, [input, delimiter, t]);

  useEffect(() => {
    handleTranspose();
  }, [handleTranspose]);

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success(t('common.copied'));
  };

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transposed-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="csv-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-indigo-500" /> {t('common.input')}
            </label>
            <div className="flex gap-2">
               <select
                value={delimiter}
                onChange={(e) => setDelimiter(e.target.value)}
                className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 border-none rounded-lg px-2 outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value=",">Comma (,)</option>
                <option value=";">Semicolon (;)</option>
                <option value="	">Tab (\t)</option>
              </select>
              <button
                onClick={() => setInput('')}
                className="text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 px-2 py-1 rounded-lg transition-all"
              >
                {t('common.clear')}
              </button>
            </div>
          </div>
          <textarea
            id="csv-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Header1,Header2&#10;Value1,Value2"
            spellCheck={false}
            className="w-full h-96 p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm resize-none dark:text-slate-300"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="csv-output" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4 text-emerald-500" /> {t('common.output')}
            </label>
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                disabled={!output}
                className="p-2 text-slate-400 hover:text-indigo-500 transition-colors disabled:opacity-30"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
              <button
                onClick={handleDownload}
                disabled={!output}
                className="p-2 text-slate-400 hover:text-emerald-500 transition-colors disabled:opacity-30"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
          <textarea
            id="csv-output"
            value={output}
            readOnly
            placeholder="Transposed result will appear here..."
            className="w-full h-96 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none font-mono text-sm resize-none dark:text-slate-300"
          />
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <Info className="w-6 h-6 text-indigo-600 shrink-0" />
        <div>
          <h4 className="font-bold dark:text-white">{t('csv_transpose.about_title')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('csv_transpose.about_text')}
          </p>
        </div>
      </div>
    </div>
  );
}
