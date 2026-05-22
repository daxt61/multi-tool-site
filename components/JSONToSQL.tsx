import { useState, useEffect } from 'react';
import { FileCode, Copy, Check, Trash2, AlertCircle, Database, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_LENGTH = 100000;

type Dialect = 'standard' | 'mysql' | 'sqlserver' | 'oracle';

export function JSONToSQL({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [input, setInput] = useState(initialData?.input || '');
  const [tableName, setTableName] = useState(initialData?.tableName || 'users');
  const [output, setOutput] = useState(initialData?.output || '');
  const [includeCreate, setIncludeCreate] = useState(initialData?.includeCreate ?? false);
  const [batchInsert, setBatchInsert] = useState(initialData?.batchInsert ?? false);
  const [dialect, setDialect] = useState<Dialect>(initialData?.dialect || 'standard');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ input, tableName, output, includeCreate, batchInsert, dialect });
  }, [input, tableName, output, includeCreate, batchInsert, dialect]);

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
      // Basic ISO date detection
      if (/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/.test(val)) {
        return 'TIMESTAMP';
      }
      if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
        return 'DATE';
      }
    }
    return 'TEXT';
  };

  const handleConvert = () => {
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

      // Collect all unique columns from all objects
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

      if (includeCreate) {
        const columnDefs = columns.map(col => {
          // Find first non-null value for this column to infer type
          const firstVal = data.find(row => row[col] !== undefined && row[col] !== null)?.[col];
          return `${escapeIdentifier(col, dialect)} ${inferType(firstVal)}`;
        });
        result += `CREATE TABLE ${sqlTableName} (\n  ${columnDefs.join(',\n  ')}\n);\n\n`;
      }

      if (batchInsert && data.length > 0) {
        const allValues = data.map((row: any) => {
          const values = columns.map(col => {
            const val = row[col];
            if (val === undefined || val === null) return 'NULL';
            if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
            if (typeof val === 'boolean') return val ? '1' : '0';
            if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
            return val;
          });
          return `(${values.join(', ')})`;
        });
        result += `INSERT INTO ${sqlTableName} (${escapedColumns.join(', ')}) VALUES\n${allValues.join(',\n')};`;
      } else {
        const statements = data.map((row: any) => {
          const values = columns.map(col => {
            const val = row[col];
            if (val === undefined || val === null) return 'NULL';
            if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
            if (typeof val === 'boolean') return val ? '1' : '0';
            if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
            return val;
          });
          return `INSERT INTO ${sqlTableName} (${escapedColumns.join(', ')}) VALUES (${values.join(', ')});`;
        });
        result += statements.join('\n');
      }

      setOutput(result);
      setError('');
    } catch (e: any) {
      setError(t('error.invalid_json') + ': ' + e.message);
    }
  };

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    setError('');
  };

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
              <FileCode className="w-4 h-4 text-indigo-500" />
              <label htmlFor="json-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('jsontosql.json_input')}
              </label>
            </div>
            <button
              onClick={handleClear}
              disabled={!input && !output}
              className="text-xs font-bold px-3 py-1 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-3 h-3" /> {t('common.clear')}
            </button>
          </div>

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
                className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-slate-300"
              >
                <option value="standard">{t('jsontosql.dialect_standard')}</option>
                <option value="mysql">{t('jsontosql.dialect_mysql')}</option>
                <option value="sqlserver">MS SQL Server</option>
                <option value="oracle">Oracle</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 px-1">
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
          </div>

          <textarea
            id="json-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                handleConvert();
              }
            }}
            placeholder='[{"id": 1, "name": "John Doe"}]'
            className="w-full h-[350px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
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
                className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 ${
                  copied
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                    : 'text-slate-500 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied ? t('common.copied') : t('common.copy')}
              </button>
            </div>
          </div>
          <textarea
            id="sql-output"
            value={output}
            readOnly
            placeholder={t('jsontosql.placeholder_output')}
            className="w-full h-[450px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-mono text-sm leading-relaxed text-indigo-600 dark:text-indigo-400 resize-none"
          />
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={handleConvert}
          className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
        >
          <Database className="w-5 h-5" /> {t('jsontosql.generate')}
          <kbd className="ml-2 hidden sm:inline-flex items-center gap-1 px-2 py-0.5 border border-white/20 rounded text-[10px] font-bold bg-white/10">
            Ctrl + Enter
          </kbd>
        </button>
      </div>
    </div>
  );
}
