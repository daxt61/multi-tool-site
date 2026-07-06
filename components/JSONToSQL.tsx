import { useState, useEffect, useCallback, useRef } from 'react';
import { FileCode, Copy, Check, Trash2, AlertCircle, Database, Download, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;

type Dialect = 'standard' | 'mysql' | 'sqlserver' | 'oracle';
type SQLMode = 'INSERT' | 'UPDATE' | 'UPSERT' | 'DELETE';

export function JSONToSQL({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [input, setInput] = useState(initialData?.input || '');
  const [tableName, setTableName] = useState(initialData?.tableName || 'users');
  const [output, setOutput] = useState(initialData?.output || '');
  const [includeCreate, setIncludeCreate] = useState(initialData?.includeCreate ?? false);
  const [batchInsert, setBatchInsert] = useState(initialData?.batchInsert ?? false);
  const [dialect, setDialect] = useState<Dialect>(initialData?.dialect || 'standard');
  const [mode, setMode] = useState<SQLMode>(initialData?.mode || 'INSERT');
  const [whereColumns, setWhereColumns] = useState<string[]>(initialData?.whereColumns || ['id']);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ input, tableName, output, includeCreate, batchInsert, dialect, mode, whereColumns });
  }, [input, tableName, output, includeCreate, batchInsert, dialect, mode, whereColumns, onStateChange]);

  const escapeIdentifier = (id: string, dialect: Dialect) => {
    if (dialect === 'mysql') {
      return `\`${id.replace(/`/g, '``')}\``;
    } else if (dialect === 'sqlserver') {
      return `[${id.replace(/\]/g, ']]')}]`;
    } else if (dialect === 'oracle') {
      return `"${id.replace(/"/g, '""').toUpperCase()}"`;
    }
    return `"${id.replace(/"/g, '""')}"`;
  };

  const inferType = (val: any) => {
    if (val === null) return 'TEXT';
    if (typeof val === 'number') return Number.isInteger(val) ? 'INTEGER' : 'DECIMAL';
    if (typeof val === 'boolean') return 'BOOLEAN';
    if (typeof val === 'string') {
      if (/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/.test(val)) return 'TIMESTAMP';
      if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return 'DATE';
    }
    return 'TEXT';
  };

  const handleConvert = useCallback(() => {
    try {
      if (!input.trim()) return;
      if (input.length > MAX_LENGTH) {
        setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
        return;
      }

      const parsed = JSON.parse(input);
      const data = Array.isArray(parsed) ? parsed : [parsed];

      if (data.length === 0) {
        setError(t('jsontosql.error_empty'));
        return;
      }

      const columnsSet = new Set<string>();
      data.forEach((row: any) => {
        if (typeof row === 'object' && row !== null) {
          Object.keys(row).forEach(key => columnsSet.add(key));
        }
      });
      const columns = Array.from(columnsSet);

      const sqlTableName = escapeIdentifier(tableName.trim() || 'table_name', dialect);
      const escapedColumns = columns.map(col => escapeIdentifier(col, dialect));

      let result = '';

      if (includeCreate && mode === 'INSERT') {
        const columnDefs = columns.map(col => {
          const firstRow = data.find(row => Object.prototype.hasOwnProperty.call(row, col) && row[col] !== null);
          const firstVal = firstRow ? firstRow[col] : null;
          return `${escapeIdentifier(col, dialect)} ${inferType(firstVal)}`;
        });
        result += `CREATE TABLE ${sqlTableName} (\n  ${columnDefs.join(',\n  ')}\n);\n\n`;
      }

      const escapeValue = (val: any) => {
        if (val === undefined || val === null) return 'NULL';
        if (typeof val === 'boolean') return val ? '1' : '0';
        let str = typeof val === 'object' ? JSON.stringify(val) : String(val);
        let escaped = str.replace(/'/g, "''");
        if (dialect === 'mysql') escaped = escaped.replace(/\\/g, '\\\\');
        if (typeof val === 'number') return val;
        return `'${escaped}'`;
      };

      if (mode === 'INSERT') {
        if (batchInsert && data.length > 0) {
          const allValues = data.map((row: any) => {
            const values = columns.map(col => escapeValue(Object.prototype.hasOwnProperty.call(row, col) ? row[col] : null));
            return `(${values.join(', ')})`;
          });
          result += `INSERT INTO ${sqlTableName} (${escapedColumns.join(', ')}) VALUES\n${allValues.join(',\n')};`;
        } else {
          const statements = data.map((row: any) => {
            const values = columns.map(col => escapeValue(Object.prototype.hasOwnProperty.call(row, col) ? row[col] : null));
            return `INSERT INTO ${sqlTableName} (${escapedColumns.join(', ')}) VALUES (${values.join(', ')});`;
          });
          result += statements.join('\n');
        }
      } else if (mode === 'UPDATE') {
        const statements = data.map((row: any) => {
          const setClause = columns
            .filter(col => !whereColumns.includes(col))
            .map(col => `${escapeIdentifier(col, dialect)} = ${escapeValue(Object.prototype.hasOwnProperty.call(row, col) ? row[col] : null)}`)
            .join(', ');
          const whereClause = whereColumns
            .map(col => `${escapeIdentifier(col, dialect)} = ${escapeValue(Object.prototype.hasOwnProperty.call(row, col) ? row[col] : null)}`)
            .join(' AND ');
          return `UPDATE ${sqlTableName} SET ${setClause} WHERE ${whereClause};`;
        });
        result += statements.join('\n');
      } else if (mode === 'UPSERT') {
        const statements = data.map((row: any) => {
          const values = columns.map(col => escapeValue(Object.prototype.hasOwnProperty.call(row, col) ? row[col] : null));
          const nonWhereColumns = columns.filter(col => !whereColumns.includes(col));

          if (dialect === 'mysql') {
            const updateClause = nonWhereColumns
              .map(col => `${escapeIdentifier(col, dialect)} = VALUES(${escapeIdentifier(col, dialect)})`)
              .join(', ');
            return `INSERT INTO ${sqlTableName} (${escapedColumns.join(', ')}) VALUES (${values.join(', ')}) ON DUPLICATE KEY UPDATE ${updateClause};`;
          } else if (dialect === 'standard') {
            const updateClause = nonWhereColumns
              .map(col => `${escapeIdentifier(col, dialect)} = EXCLUDED.${escapeIdentifier(col, dialect)}`)
              .join(', ');
            const conflictTarget = whereColumns.map(col => escapeIdentifier(col, dialect)).join(', ');
            return `INSERT INTO ${sqlTableName} (${escapedColumns.join(', ')}) VALUES (${values.join(', ')}) ON CONFLICT (${conflictTarget}) DO UPDATE SET ${updateClause};`;
          } else {
            // MERGE for SQL Server and Oracle
            const sourceValues = columns.map((col, i) => `${values[i]} AS ${escapeIdentifier(col, dialect)}`).join(', ');
            const onClause = whereColumns.map(col => `target.${escapeIdentifier(col, dialect)} = source.${escapeIdentifier(col, dialect)}`).join(' AND ');
            const updateSet = nonWhereColumns.map(col => `${escapeIdentifier(col, dialect)} = source.${escapeIdentifier(col, dialect)}`).join(', ');
            const insertCols = columns.map(col => escapeIdentifier(col, dialect)).join(', ');
            const insertVals = columns.map(col => `source.${escapeIdentifier(col, dialect)}`).join(', ');

            return `MERGE INTO ${sqlTableName} AS target\nUSING (SELECT ${sourceValues}) AS source\nON (${onClause})\nWHEN MATCHED THEN\n  UPDATE SET ${updateSet}\nWHEN NOT MATCHED THEN\n  INSERT (${insertCols}) VALUES (${insertVals});`;
          }
        });
        result += statements.join('\n');
      } else if (mode === 'DELETE') {
        const statements = data.map((row: any) => {
          const whereClause = whereColumns
            .map(col => `${escapeIdentifier(col, dialect)} = ${escapeValue(Object.prototype.hasOwnProperty.call(row, col) ? row[col] : null)}`)
            .join(' AND ');
          return `DELETE FROM ${sqlTableName} WHERE ${whereClause};`;
        });
        result += statements.join('\n');
      }

      setOutput(result);
      setError('');
    } catch (e: any) {
      setError(t('error.invalid_json') + ': ' + e.message);
    }
  }, [input, tableName, dialect, mode, includeCreate, batchInsert, whereColumns, t]);

  const handleClear = useCallback(() => {
    setInput('');
    setOutput('');
    setError('');
  }, []);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [output]);

  const handleConvertRef = useRef(handleConvert);
  const handleClearRef = useRef(handleClear);
  const handleCopyRef = useRef(handleCopy);

  useEffect(() => {
    handleConvertRef.current = handleConvert;
    handleClearRef.current = handleClear;
    handleCopyRef.current = handleCopy;
  }, [handleConvert, handleClear, handleCopy]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInputFocused =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement instanceof HTMLSelectElement ||
        activeElement?.getAttribute("contenteditable") === "true";

      if (isInputFocused && !((e.ctrlKey || e.metaKey) && e.key === 'Enter') && e.key !== 'Escape') return;

      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleConvertRef.current();
        return;
      }

      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key === "Escape") {
        e.preventDefault();
        handleClearRef.current();
      } else if (e.key.toLowerCase() === "c") {
        e.preventDefault();
        handleCopyRef.current();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${tableName || 'data'}.sql`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const toggleWhereColumn = (col: string) => {
    setWhereColumns(prev =>
      prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]
    );
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
        <div className="space-y-6">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-indigo-500" />
              <label htmlFor="json-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('jsontosql.json_input')}
              </label>
            </div>
            <div className="flex gap-2 items-center">
              <Kbd modifier={null} className="hidden sm:inline-flex border-rose-200 dark:border-rose-800 text-rose-400 dark:bg-slate-900">Esc</Kbd>
              <button
                onClick={handleClear}
                disabled={!input && !output}
                className="text-xs font-bold px-3 py-1 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
              >
                <Trash2 className="w-3 h-3" /> {t('common.clear')}
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900/40 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="table-name" className="text-xs font-bold text-slate-500 px-1">
                  {t('jsontosql.table_name')}
                </label>
                <input
                  id="table-name"
                  type="text"
                  value={tableName}
                  onChange={(e) => setTableName(e.target.value)}
                  placeholder="users"
                  className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-slate-300"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="dialect-select" className="text-xs font-bold text-slate-500 px-1">
                  {t('jsontosql.dialect')}
                </label>
                <select
                  id="dialect-select"
                  value={dialect}
                  onChange={(e) => setDialect(e.target.value as Dialect)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-slate-300 cursor-pointer"
                >
                  <option value="standard">{t('jsontosql.dialect_standard')}</option>
                  <option value="mysql">{t('jsontosql.dialect_mysql')}</option>
                  <option value="sqlserver">MS SQL Server</option>
                  <option value="oracle">Oracle</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
               <label className="text-xs font-bold text-slate-500 px-1 block">{t('jsontosql.mode')}</label>
               <div className="flex flex-wrap bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit gap-1">
                  {(['INSERT', 'UPDATE', 'UPSERT', 'DELETE'] as const).map(m => (
                    <button
                      key={m}
                      onClick={() => setMode(m)}
                      className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                        mode === m
                          ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
               </div>
            </div>

            <div className="flex flex-wrap gap-4 px-1">
              {mode === 'INSERT' ? (
                <>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={includeCreate}
                      onChange={(e) => setIncludeCreate(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">
                      {t('jsontosql.include_create')}
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={batchInsert}
                      onChange={(e) => setBatchInsert(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">
                      {t('jsontosql.batch_insert')}
                    </span>
                  </label>
                </>
              ) : (
                <div className="space-y-3 w-full">
                  <label className="text-xs font-bold text-slate-500 block">
                    {mode === 'UPDATE' || mode === 'DELETE' ? t('jsontosql.where_columns') : t('jsontosql.conflict_target')}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {(() => {
                      try {
                        const parsed = JSON.parse(input);
                        const first = Array.isArray(parsed) ? (parsed[0] || {}) : parsed;
                        if (!first || typeof first !== 'object' || Object.keys(first).length === 0) {
                           return <p className="text-[10px] text-slate-400 italic">Enter valid JSON with fields to select columns</p>;
                        }
                        return Object.keys(first).map(col => (
                          <button
                            key={col}
                            onClick={() => toggleWhereColumn(col)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all flex items-center gap-2 ${
                              whereColumns.includes(col)
                                ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                            }`}
                          >
                            <div className={`w-3 h-3 rounded border flex items-center justify-center transition-all ${
                              whereColumns.includes(col) ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 dark:border-slate-600'
                            }`}>
                              {whereColumns.includes(col) && <Check className="w-2 h-2 stroke-[4]" />}
                            </div>
                            {col}
                          </button>
                        ));
                      } catch {
                        return <p className="text-[10px] text-slate-400 italic">Enter valid JSON to select columns</p>;
                      }
                    })()}
                  </div>
                </div>
              )}
            </div>
          </div>

          <textarea
            id="json-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='[{"id": 1, "name": "John Doe", "email": "john@example.com"}]'
            className="w-full h-[300px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-500" />
              <label htmlFor="sql-output" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('jsontosql.sql_output')}
              </label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                disabled={!output}
                className="text-xs font-bold px-3 py-1 rounded-full text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 transition-all flex items-center gap-1 disabled:opacity-50"
              >
                <Download className="w-3 h-3" /> {t('common.download')}
              </button>
              <button
                onClick={handleCopy}
                disabled={!output}
                className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                  copied
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                    : 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied ? t('common.copied') : t('common.copy')}
                {!copied && <Kbd modifier={null} className="hidden sm:inline-flex w-4 h-4 bg-white/50 dark:bg-black/20 ml-1">C</Kbd>}
              </button>
            </div>
          </div>
          <textarea
            id="sql-output"
            value={output}
            readOnly
            placeholder={t('jsontosql.placeholder_output')}
            className="w-full h-[550px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-mono text-sm leading-relaxed text-indigo-600 dark:text-indigo-400 resize-none"
          />
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={handleConvert}
          className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
        >
          <Database className="w-5 h-5" /> {t('jsontosql.generate')}
          <Kbd className="ml-2 hidden sm:inline-flex border-white/20 bg-white/10 text-white">Enter</Kbd>
        </button>
      </div>
    </div>
  );
}
