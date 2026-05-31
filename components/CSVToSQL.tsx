import { useState, useEffect, useCallback } from 'react';
import { Database, Copy, Check, Trash2, AlertCircle, Download, Settings2, FileSpreadsheet } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_LENGTH = 100000;

export function CSVToSQL({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [csv, setCsv] = useState(initialData?.csv || '');
  const [tableName, setTableName] = useState(initialData?.tableName || 'my_table');
  const [delimiter, setDelimiter] = useState(initialData?.delimiter || ',');
  const [hasHeader, setHeader] = useState(initialData?.hasHeader ?? true);
  const [sql, setSql] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ csv, tableName, delimiter, hasHeader });
  }, [csv, tableName, delimiter, hasHeader, onStateChange]);

  const parseCSVLine = (line: string, delim: string) => {
    const result = [];
    let curValue = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delim && !inQuotes) {
        result.push(curValue.trim());
        curValue = '';
      } else {
        curValue += char;
      }
    }
    result.push(curValue.trim());
    return result.map(v => {
      if (v.startsWith('"') && v.endsWith('"')) {
        return v.slice(1, -1).replace(/""/g, '"');
      }
      return v;
    });
  };

  const generateSQL = useCallback(() => {
    if (!csv.trim()) {
      setSql('');
      setError(null);
      return;
    }

    if (csv.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
      setSql('');
      return;
    }

    try {
      const lines = csv.trim().split('\n');
      if (lines.length === 0) return;

      let headers: string[] = [];
      let startRow = 0;

      if (hasHeader) {
        headers = parseCSVLine(lines[0], delimiter);
        startRow = 1;
      } else {
        const firstLine = parseCSVLine(lines[0], delimiter);
        headers = firstLine.map((_, i) => `column${i + 1}`);
        startRow = 0;
      }

      if (headers.length === 0) throw new Error('No columns found');

      // Sanitize table and column names
      const safeTable = tableName.replace(/[^a-zA-Z0-9_]/g, '');
      const safeHeaders = headers.map(h => h.replace(/[^a-zA-Z0-9_]/g, '') || 'col');

      const statements = lines.slice(startRow).map((line: string) => {
        const values = parseCSVLine(line, delimiter);
        const sqlValues = values.map(val => {
          if (val === '' || val.toLowerCase() === 'null') return 'NULL';
          if (!isNaN(Number(val)) && val.trim() !== '') return val;
          // Escape single quotes for SQL
          return `'${val.replace(/'/g, "''")}'`;
        });

        // Ensure we match header count
        while (sqlValues.length < safeHeaders.length) sqlValues.push('NULL');
        const limitedValues = sqlValues.slice(0, safeHeaders.length);

        return `INSERT INTO ${safeTable} (${safeHeaders.join(', ')}) VALUES (${limitedValues.join(', ')});`;
      });

      setSql(statements.join('\n'));
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Error parsing CSV');
      setSql('');
    }
  }, [csv, tableName, delimiter, hasHeader, t]);

  useEffect(() => {
    const timeout = setTimeout(generateSQL, 200);
    return () => clearTimeout(timeout);
  }, [generateSQL]);

  const handleCopy = () => {
    if (!sql) return;
    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!sql) return;
    const blob = new Blob([sql], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tableName || 'export'}.sql`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Configuration Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-6 shadow-sm">
            <div className="flex items-center gap-2 px-1">
              <Settings2 className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{t('common.options')}</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="table-name" className="text-xs font-bold text-slate-500 px-1 uppercase">{t('csvtosql.table_name')}</label>
                <input
                  id="table-name"
                  type="text"
                  value={tableName}
                  onChange={(e) => setTableName(e.target.value)}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-bold"
                  placeholder="my_table"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="delimiter" className="text-xs font-bold text-slate-500 px-1 uppercase">{t('csvtosql.delimiter')}</label>
                <select
                  id="delimiter"
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

              <button
                onClick={() => setHeader(!hasHeader)}
                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                  hasHeader
                    ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                }`}
              >
                <span className="text-sm font-bold">{t('csvtosql.has_header')}</span>
                <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                  hasHeader ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 dark:border-slate-600'
                }`}>
                  {hasHeader && <Check className="w-3 h-3 stroke-[3]" />}
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
                <FileSpreadsheet className="w-4 h-4 text-indigo-500" />
                <label htmlFor="csv-input" className="text-xs font-black uppercase tracking-widest text-slate-400">CSV Input</label>
              </div>
              <button
                onClick={() => setCsv('')}
                disabled={!csv}
                className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl transition-all disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <textarea
              id="csv-input"
              value={csv}
              onChange={(e) => setCsv(e.target.value)}
              placeholder="id,name,email&#10;1,John,john@example.com&#10;2,Jane,jane@example.com"
              className="w-full h-48 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm dark:text-slate-300 resize-none"
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-500" />
                <label htmlFor="sql-output" className="text-xs font-black uppercase tracking-widest text-slate-400">SQL Output</label>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleDownload}
                  disabled={!sql}
                  className="text-xs font-bold px-3 py-1.5 rounded-xl text-indigo-600 bg-indigo-50 dark:bg-indigo-900/10 hover:bg-indigo-100 transition-all flex items-center gap-1 disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" /> {t('common.download')}
                </button>
                <button
                  onClick={handleCopy}
                  disabled={!sql}
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
              id="sql-output"
              value={sql}
              readOnly
              placeholder="SQL statements will appear here..."
              className="w-full h-64 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-mono text-sm leading-relaxed text-indigo-600 dark:text-indigo-400 resize-none shadow-inner"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
