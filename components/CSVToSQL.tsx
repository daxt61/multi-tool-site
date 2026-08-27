import { useState, useEffect, useCallback, useRef } from 'react';
import { Database, Copy, Check, Trash2, AlertCircle, Download, Settings2, FileSpreadsheet, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;

type Dialect = 'standard' | 'mysql' | 'postgres' | 'sqlite' | 'mssql';

interface Preset {
  nameKey: string;
  tableName: string;
  delimiter: string;
  hasHeader: boolean;
  dialect: Dialect;
  includeCreate: boolean;
  batchInsert: boolean;
  csv: string;
}

const PRESETS: Preset[] = [
  {
    nameKey: 'csvtosql.preset_ecommerce',
    tableName: 'products',
    delimiter: ',',
    hasHeader: true,
    dialect: 'standard',
    includeCreate: true,
    batchInsert: false,
    csv: `id,sku,product_name,price,stock,is_active\n1,PROD-101,Wireless Headphones,89.99,150,true\n2,PROD-102,Gaming Mouse,45.50,230,true\n3,PROD-103,Mechanical Keyboard,129.00,85,true\n4,PROD-104,USB-C Hub,29.99,0,false`,
  },
  {
    nameKey: 'csvtosql.preset_users',
    tableName: 'users',
    delimiter: ',',
    hasHeader: true,
    dialect: 'postgres',
    includeCreate: true,
    batchInsert: true,
    csv: `user_id,full_name,email,role,created_at\n1,Alice Dupont,alice@example.com,admin,2024-01-15\n2,Bob Smith,bob@example.com,editor,2024-02-01\n3,Charlie Brown,charlie@example.com,user,2024-03-10`,
  },
  {
    nameKey: 'csvtosql.preset_financial',
    tableName: 'transactions',
    delimiter: ';',
    hasHeader: true,
    dialect: 'mysql',
    includeCreate: true,
    batchInsert: false,
    csv: `tx_id;account_id;amount;currency;status\n1001;ACC-881;1250.00;EUR;SETTLED\n1002;ACC-882;-45.20;EUR;SETTLED\n1003;ACC-883;3200.50;USD;PENDING`,
  },
];

export function CSVToSQL({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [csv, setCsv] = useState(initialData?.csv || PRESETS[0].csv);
  const [tableName, setTableName] = useState(initialData?.tableName || PRESETS[0].tableName);
  const [delimiter, setDelimiter] = useState(initialData?.delimiter || PRESETS[0].delimiter);
  const [dialect, setDialect] = useState<Dialect>(initialData?.dialect || PRESETS[0].dialect);
  const [hasHeader, setHeader] = useState(initialData?.hasHeader ?? true);
  const [includeCreate, setIncludeCreate] = useState(initialData?.includeCreate ?? true);
  const [batchInsert, setBatchInsert] = useState(initialData?.batchInsert ?? false);
  const [sql, setSql] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ csv, tableName, delimiter, dialect, hasHeader, includeCreate, batchInsert });
  }, [csv, tableName, delimiter, dialect, hasHeader, includeCreate, batchInsert, onStateChange]);

  const parseCSVLine = (line: string, delim: string) => {
    const result: string[] = [];
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

  const getIdentifierQuote = (d: Dialect): [string, string] => {
    switch (d) {
      case 'mysql':
        return ['`', '`'];
      case 'postgres':
      case 'standard':
      case 'sqlite':
        return ['"', '"'];
      case 'mssql':
        return ['[', ']'];
    }
  };

  const inferColumnType = (values: string[], d: Dialect): string => {
    const nonNulls = values.filter(v => v !== '' && v.toLowerCase() !== 'null');
    if (nonNulls.length === 0) return d === 'postgres' ? 'TEXT' : 'VARCHAR(255)';

    const isBool = nonNulls.every(v => ['true', 'false', '1', '0', 't', 'f', 'yes', 'no'].includes(v.toLowerCase()));
    if (isBool) {
      if (d === 'postgres' || d === 'sqlite') return 'BOOLEAN';
      if (d === 'mysql') return 'TINYINT(1)';
      if (d === 'mssql') return 'BIT';
      return 'BOOLEAN';
    }

    const isInt = nonNulls.every(v => /^-?\d+$/.test(v.trim()));
    if (isInt) {
      return d === 'postgres' ? 'INTEGER' : d === 'mssql' ? 'INT' : 'INTEGER';
    }

    const isFloat = nonNulls.every(v => /^-?\d+(\.\d+)?$/.test(v.trim()));
    if (isFloat) {
      if (d === 'postgres') return 'NUMERIC';
      if (d === 'mysql') return 'DECIMAL(10,2)';
      if (d === 'sqlite') return 'REAL';
      return 'DECIMAL(10,2)';
    }

    if (d === 'postgres') return 'VARCHAR(255)';
    if (d === 'mssql') return 'NVARCHAR(255)';
    return 'VARCHAR(255)';
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
      const lines = csv.trim().split('\n').filter((l: string) => l.trim().length > 0);
      if (lines.length === 0) return;

      let headers: string[] = [];
      let startRow = 0;

      if (hasHeader) {
        headers = parseCSVLine(lines[0], delimiter);
        startRow = 1;
      } else {
        const firstLine = parseCSVLine(lines[0], delimiter);
        headers = firstLine.map((_, i) => `column_${i + 1}`);
        startRow = 0;
      }

      if (headers.length === 0) throw new Error('No columns found');

      const [qOpen, qClose] = getIdentifierQuote(dialect);
      const safeTable = `${qOpen}${tableName.replace(/[^a-zA-Z0-9_]/g, '') || 'my_table'}${qClose}`;
      const safeHeaders = headers.map(h => `${qOpen}${h.replace(/[^a-zA-Z0-9_]/g, '') || 'col'}${qClose}`);

      const dataRows = lines.slice(startRow).map((l: string) => parseCSVLine(l, delimiter));
      const statements: string[] = [];

      if (includeCreate) {
        const columnsDTO: string[] = [];
        for (let i = 0; i < safeHeaders.length; i++) {
          const colValues = dataRows.map((row: string[]) => row[i] || '');
          const colType = inferColumnType(colValues, dialect);
          columnsDTO.push(`  ${safeHeaders[i]} ${colType}`);
        }
        const createStmt = `CREATE TABLE ${safeTable} (\n${columnsDTO.join(',\n')}\n);`;
        statements.push(createStmt);
        statements.push('');
      }

      const formatSQLValue = (val: string) => {
        if (val === '' || val.toLowerCase() === 'null') return 'NULL';
        const lower = val.toLowerCase();
        if (lower === 'true') return dialect === 'mssql' ? '1' : 'TRUE';
        if (lower === 'false') return dialect === 'mssql' ? '0' : 'FALSE';
        if (!isNaN(Number(val)) && val.trim() !== '') return val;
        return `'${val.replace(/'/g, "''")}'`;
      };

      const valueRows = dataRows.map((row: string[]) => {
        const values = row.map(formatSQLValue);
        while (values.length < safeHeaders.length) values.push('NULL');
        return values.slice(0, safeHeaders.length);
      });

      if (valueRows.length > 0) {
        if (batchInsert) {
          const formattedTuples = valueRows.map((vals: string[]) => `  (${vals.join(', ')})`);
          statements.push(`INSERT INTO ${safeTable} (${safeHeaders.join(', ')}) VALUES\n${formattedTuples.join(',\n')};`);
        } else {
          valueRows.forEach((vals: string[]) => {
            statements.push(`INSERT INTO ${safeTable} (${safeHeaders.join(', ')}) VALUES (${vals.join(', ')});`);
          });
        }
      }

      setSql(statements.join('\n'));
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Error parsing CSV');
      setSql('');
    }
  }, [csv, tableName, delimiter, dialect, hasHeader, includeCreate, batchInsert, t]);

  useEffect(() => {
    const timeout = setTimeout(generateSQL, 150);
    return () => clearTimeout(timeout);
  }, [generateSQL]);

  const handleCopy = useCallback(() => {
    if (!sql) return;
    navigator.clipboard.writeText(sql);
    setCopied(true);
    toast.success(t('csvtosql.toast_copied'));
    setTimeout(() => setCopied(false), 2000);
  }, [sql, t]);

  const handleClear = useCallback(() => {
    setCsv('');
    setSql('');
    setError(null);
    toast.success(t('csvtosql.toast_cleared'));
    inputRef.current?.focus();
  }, [t]);

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
    toast.success(t('common.download_success'));
  };

  const handleLoadPreset = (preset: Preset) => {
    setTableName(preset.tableName);
    setDelimiter(preset.delimiter);
    setHeader(preset.hasHeader);
    setDialect(preset.dialect);
    setIncludeCreate(preset.includeCreate);
    setBatchInsert(preset.batchInsert);
    setCsv(preset.csv);
    toast.success(t('csvtosql.toast_preset_loaded'));
  };

  const handlersRef = useRef({
    onClear: handleClear,
    onCopy: handleCopy,
  });

  useEffect(() => {
    handlersRef.current = {
      onClear: handleClear,
      onCopy: handleCopy,
    };
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const htmlEl = activeEl as HTMLElement | null;
      const isEditable = htmlEl && (
        htmlEl.tagName === 'INPUT' ||
        htmlEl.tagName === 'TEXTAREA' ||
        Boolean(htmlEl.isContentEditable)
      );

      if (e.key === 'Escape') {
        if (isEditable && htmlEl) {
          htmlEl.blur();
        }
        handlersRef.current.onClear();
      } else if ((e.key === 'c' || e.key === 'C') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (!isEditable) {
          e.preventDefault();
          handlersRef.current.onCopy();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Quick Presets */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-500" />
          <span className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('csvtosql.presets_title')}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleLoadPreset(p)}
              className="text-xs font-bold px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 text-slate-700 dark:text-slate-200 transition-all shadow-sm"
            >
              {t(p.nameKey)}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
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
                <label htmlFor="dialect" className="text-xs font-bold text-slate-500 px-1 uppercase">{t('csvtosql.dialect')}</label>
                <select
                  id="dialect"
                  value={dialect}
                  onChange={(e) => setDialect(e.target.value as Dialect)}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-bold cursor-pointer"
                >
                  <option value="standard">Standard SQL ("tbl")</option>
                  <option value="postgres">PostgreSQL ("tbl")</option>
                  <option value="mysql">MySQL (`tbl`)</option>
                  <option value="sqlite">SQLite ("tbl")</option>
                  <option value="mssql">SQL Server ([tbl])</option>
                </select>
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
                type="button"
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

              <button
                type="button"
                onClick={() => setIncludeCreate(!includeCreate)}
                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                  includeCreate
                    ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                }`}
              >
                <span className="text-sm font-bold">{t('csvtosql.include_create')}</span>
                <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                  includeCreate ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 dark:border-slate-600'
                }`}>
                  {includeCreate && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setBatchInsert(!batchInsert)}
                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                  batchInsert
                    ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                }`}
              >
                <span className="text-sm font-bold">{t('csvtosql.batch_insert')}</span>
                <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                  batchInsert ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 dark:border-slate-600'
                }`}>
                  {batchInsert && <Check className="w-3 h-3 stroke-[3]" />}
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
                <label htmlFor="csv-input" className="text-xs font-black uppercase tracking-widest text-slate-400">
                  {t('csvtosql.csv_input')}
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Kbd modifier={null}>Esc</Kbd>
                <button
                  onClick={handleClear}
                  disabled={!csv}
                  className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl transition-all disabled:opacity-50 flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {t('common.clear')}
                </button>
              </div>
            </div>
            <textarea
              id="csv-input"
              ref={inputRef}
              value={csv}
              onChange={(e) => setCsv(e.target.value)}
              placeholder="id,name,email&#10;1,John,john@example.com&#10;2,Jane,jane@example.com"
              className="w-full h-52 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm dark:text-slate-300 resize-none"
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-500" />
                <label htmlFor="sql-output" className="text-xs font-black uppercase tracking-widest text-slate-400">
                  {t('csvtosql.sql_output')}
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Kbd modifier={null}>C</Kbd>
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
              placeholder={t('csvtosql.placeholder_output')}
              className="w-full h-64 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-mono text-sm leading-relaxed text-indigo-600 dark:text-indigo-400 resize-none shadow-inner"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
