import { useState, useEffect, useCallback, useRef } from 'react';
import { Database, FileSpreadsheet, Copy, Check, Trash2, AlertCircle, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_LENGTH = 100000;

export function SQLToCSV({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [sqlInput, setSqlInput] = useState(initialData?.sqlInput || '');
  const [csvOutput, setCsvOutput] = useState(initialData?.csvOutput || '');
  const [delimiter, setDelimiter] = useState(initialData?.delimiter || ',');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    onStateChange?.({ sqlInput, csvOutput, delimiter });
  }, [sqlInput, csvOutput, delimiter, onStateChange]);

  const parseSql = useCallback((sql: string) => {
    if (!sql.trim()) {
      setCsvOutput('');
      setError('');
      return;
    }

    if (sql.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
      return;
    }

    try {
      // Basic regex to find INSERT INTO table (cols) VALUES (vals)
      // Supports multiple (vals), (vals)
      const insertRegex = /INSERT\s+INTO\s+([^\s(]+)\s*(?:\(([^)]+)\))?\s+VALUES\s*([\s\S]+?)(?:;|$)/gi;
      let match;
      const allRows: any[][] = [];
      let headers: string[] = [];

      while ((match = insertRegex.exec(sql)) !== null) {
        const tableName = match[1];
        const columnsStr = match[2];
        const valuesStr = match[3];

        if (columnsStr && headers.length === 0) {
          headers = columnsStr.split(',').map(c => c.trim().replace(/[`"\[\]]/g, ''));
        }

        // Parse values: (v1, v2), (v3, v4)
        // This is tricky because values can contain commas within strings
        const rowsMatch = valuesStr.match(/\(([\s\S]+?)\)/g);
        if (rowsMatch) {
          rowsMatch.forEach(rowStr => {
            const innerStr = rowStr.slice(1, -1); // remove ()
            const rowValues: string[] = [];
            let currentVal = '';
            let inString = false;
            let quoteChar = '';

            let valCurrentLevel = 0;
            for (let i = 0; i < innerStr.length; i++) {
              const char = innerStr[i];
              if ((char === "'" || char === '"') && (i === 0 || innerStr[i - 1] !== '\\')) {
                if (!inString) {
                  inString = true;
                  quoteChar = char;
                } else if (char === quoteChar) {
                  inString = false;
                }
                currentVal += char;
              } else if (!inString) {
                if (char === '(') valCurrentLevel++;
                if (char === ')') valCurrentLevel--;
                if (char === ',' && valCurrentLevel === 0) {
                  rowValues.push(cleanValue(currentVal));
                  currentVal = '';
                } else {
                  currentVal += char;
                }
              } else {
                currentVal += char;
              }
            }
            rowValues.push(cleanValue(currentVal));
            allRows.push(rowValues);
          });
        }
      }

      if (allRows.length === 0) {
        setError(t('sqltojson.error_no_statements'));
        setCsvOutput('');
        return;
      }

      const formatCsvValue = (val: string) => {
        if (val.includes(delimiter) || val.includes('"') || val.includes('\n')) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      };

      let csv = '';
      if (headers.length > 0) {
        csv += headers.map(formatCsvValue).join(delimiter) + '\n';
      }
      csv += allRows.map(row => row.map(formatCsvValue).join(delimiter)).join('\n');

      setCsvOutput(csv);
      setError('');
    } catch (e: any) {
      setError(t('error.invalid_encoding') + ': ' + e.message);
    }
  }, [delimiter, t]);

  const cleanValue = (val: string) => {
    let v = val.trim();
    if ((v.startsWith("'") && v.endsWith("'")) || (v.startsWith('"') && v.endsWith('"'))) {
      v = v.slice(1, -1);
    }
    if (v.toLowerCase() === 'null') return '';
    return v.replace(/''/g, "'").replace(/\\'/g, "'").replace(/\\"/g, '"');
  };

  const handleConvert = () => {
    parseSql(sqlInput);
  };

  const handleClear = useCallback(() => {
    setSqlInput('');
    setCsvOutput('');
    setError('');
    textareaRef.current?.focus();
  }, []);

  const handleCopy = useCallback(() => {
    if (!csvOutput) return;
    navigator.clipboard.writeText(csvOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [csvOutput]);

  const handleDownload = () => {
    if (!csvOutput) return;
    const blob = new Blob([csvOutput], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `data-${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-500" />
              <label htmlFor="sql-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('sqltocsv.input_label')}
              </label>
            </div>
            <div className="flex gap-2 items-center">
              <kbd className="hidden sm:inline-flex items-center justify-center px-1.5 py-0.5 border border-rose-200 dark:border-rose-800 rounded text-[10px] font-bold text-rose-400 bg-white dark:bg-slate-900">Esc</kbd>
              <button
                onClick={handleClear}
                disabled={!sqlInput && !csvOutput}
                className="text-xs font-bold px-3 py-1 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
              >
                <Trash2 className="w-3 h-3" /> {t('common.clear')}
              </button>
            </div>
          </div>
          <textarea
            id="sql-input"
            ref={textareaRef}
            value={sqlInput}
            onChange={(e) => setSqlInput(e.target.value)}
            placeholder="INSERT INTO users (id, name) VALUES (1, 'John'), (2, 'Jane');"
            className="w-full h-80 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white dark:bg-slate-900/40 p-6 rounded-3xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-4">
              <label htmlFor="delimiter" className="text-sm font-bold text-slate-500">
                {t('csvmapper.output_delimiter')}
              </label>
              <select
                id="delimiter"
                value={delimiter}
                onChange={(e) => setDelimiter(e.target.value)}
                className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value=",">Comma (,)</option>
                <option value=";">Semicolon (;)</option>
                <option value="\t">Tab</option>
                <option value="|">Pipe (|)</option>
              </select>
            </div>
            <button
              onClick={handleConvert}
              className="w-full sm:w-auto px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <FileSpreadsheet className="w-5 h-5" />
              {t('jsontosql.convert')}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
              <label htmlFor="csv-output" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('sqltocsv.output_label')}
              </label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                disabled={!csvOutput}
                className="text-xs font-bold px-3 py-1 rounded-full text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 transition-all flex items-center gap-1 disabled:opacity-50"
              >
                <Download className="w-3 h-3" /> {t('common.download')}
              </button>
              <button
                onClick={handleCopy}
                disabled={!csvOutput}
                className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                  copied
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                    : 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied ? t('common.copied') : t('common.copy')}
              </button>
            </div>
          </div>
          <textarea
            id="csv-output"
            value={csvOutput}
            readOnly
            placeholder={t('sqltocsv.placeholder_output')}
            className="w-full h-[460px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>
      </div>
    </div>
  );
}
