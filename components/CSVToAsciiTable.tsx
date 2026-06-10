import { useState, useEffect, useMemo, useCallback } from 'react';
import { FileSpreadsheet, Table, Copy, Check, Trash2, Download, AlertCircle, Info, Settings2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_LENGTH = 50000;

const DELIMITERS = [
  { label: 'Comma (,)', value: ',' },
  { label: 'Semicolon (;)', value: ';' },
  { label: 'Tab (\\t)', value: '\t' },
  { label: 'Pipe (|)', value: '|' },
];

type TableStyle = 'basic' | 'bordered' | 'unicode' | 'markdown';

export function CSVToAsciiTable({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [input, setInput] = useState(initialData?.input || 'Name,Age,City\nJohn Doe,30,New York\nJane Smith,25,London\nBob Johnson,45,Paris');
  const [delimiter, setDelimiter] = useState(initialData?.delimiter || ',');
  const [hasHeader, setHasHeader] = useState(initialData?.hasHeader ?? true);
  const [style, setStyle] = useState<TableStyle>(initialData?.style || 'bordered');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ input, delimiter, hasHeader, style });
  }, [input, delimiter, hasHeader, style, onStateChange]);

  const parseCSVLine = useCallback((line: string, delim: string) => {
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
      v = v.trim();
      if (v.startsWith('"') && v.endsWith('"')) {
        return v.substring(1, v.length - 1).replace(/""/g, '"');
      }
      return v;
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
    } catch (e) {
      return '';
    }
  }, [input, delimiter, hasHeader, style, parseCSVLine]);

  const errorMsg = useMemo(() => {
    if (input.length > MAX_LENGTH) {
      return t('error.max_length', { max: MAX_LENGTH.toLocaleString() });
    }
    return null;
  }, [input, t]);

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `table-ascii-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {errorMsg && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-indigo-500" />
              <label htmlFor="csv-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">CSV {t('common.input')}</label>
            </div>
            <button
              onClick={() => setInput('')}
              className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50"
            >
              {t('common.clear')}
            </button>
          </div>
          <textarea
            id="csv-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full h-[400px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
            placeholder="Name,Age,City..."
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Table className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{t('jsontoascii.ascii_output')}</h3>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                disabled={!output}
                className="text-xs font-bold px-3 py-1.5 rounded-xl text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 transition-all disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleCopy}
                disabled={!output}
                className={`text-xs font-bold px-4 py-1.5 rounded-xl transition-all flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${copied ? 'bg-emerald-500 text-white' : 'text-slate-600 bg-slate-100 dark:bg-slate-800 border border-transparent'}`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} {copied ? t('common.copied') : t('common.copy')}
              </button>
            </div>
          </div>
          <div className="w-full h-[400px] p-6 bg-slate-900 dark:bg-black border border-slate-800 rounded-3xl overflow-auto font-mono text-xs md:text-sm leading-none text-indigo-400 selection:bg-indigo-500/30 whitespace-pre">
            {output || <span className="text-slate-600 italic">{t('jsontoascii.placeholder')}</span>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-8 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2rem] space-y-6">
          <div className="flex items-center gap-2 text-indigo-500 px-1">
            <Settings2 className="w-4 h-4" />
            <h3 className="text-xs font-black uppercase tracking-widest text-[10px] text-slate-400">{t('common.options')}</h3>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-400 px-1 uppercase tracking-wider">{t('csvtosql.delimiter')}</label>
              <div className="flex flex-wrap gap-2">
                {DELIMITERS.map(d => (
                  <button
                    key={d.value}
                    onClick={() => setDelimiter(d.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                      delimiter === d.value
                        ? 'bg-indigo-600 text-white border-indigo-600'
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
              <span>{t('csvtosql.has_header')}</span>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${hasHeader ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300'}`}>
                {hasHeader && <Check className="w-3 h-3 text-white" />}
              </div>
            </button>
          </div>
        </div>

        <div className="p-8 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-[2rem] space-y-6 shadow-sm">
          <div className="flex items-center gap-2 text-indigo-500 px-1">
            <Settings2 className="w-4 h-4" />
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Table Style</h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
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
                {t(`jsontoascii.style_${s}`)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-6 rounded-[2rem] border border-indigo-100 dark:border-indigo-900/20 flex gap-4">
        <Info className="w-6 h-6 text-indigo-600 shrink-0" />
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('jsontoascii.about_title')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('jsontoascii.about_text')}
          </p>
        </div>
      </div>
    </div>
  );
}
