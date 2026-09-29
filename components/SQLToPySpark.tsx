import { useState, useEffect, useCallback, useRef } from 'react';
import { Database, Copy, Check, Trash2, AlertCircle, Download, Info, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;

const PYTHON_KEYWORDS = new Set([
  'and', 'as', 'assert', 'async', 'await', 'break', 'class', 'continue',
  'def', 'del', 'elif', 'else', 'except', 'False', 'finally', 'for',
  'from', 'global', 'if', 'import', 'in', 'is', 'lambda', 'None',
  'nonlocal', 'not', 'or', 'pass', 'raise', 'return', 'True', 'try',
  'while', 'with', 'yield'
]);

const PRESETS = [
  {
    id: 'ecommerce_catalog',
    labelKey: 'sqltopyspark.preset_ecommerce',
    defaultLabel: 'E-Commerce Catalog',
    sql: `CREATE TABLE products (
  id INT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(50) UNIQUE,
  price DECIMAL(10, 2) NOT NULL,
  stock_quantity INT DEFAULT 0,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`
  },
  {
    id: 'user_auth_events',
    labelKey: 'sqltopyspark.preset_user_auth',
    defaultLabel: 'User Auth & Events',
    sql: `CREATE TABLE user_events (
  event_id UUID PRIMARY KEY,
  user_id INT NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  payload TEXT,
  device_ip VARCHAR(45),
  is_processed BOOLEAN DEFAULT FALSE,
  event_timestamp TIMESTAMP NOT NULL
);`
  },
  {
    id: 'financial_transactions',
    labelKey: 'sqltopyspark.preset_financial',
    defaultLabel: 'Financial Transactions',
    sql: `CREATE TABLE transactions (
  transaction_id BIGINT PRIMARY KEY,
  account_number VARCHAR(34) NOT NULL,
  amount DOUBLE NOT NULL,
  currency CHAR(3) DEFAULT 'USD',
  status VARCHAR(20) NOT NULL,
  transacted_at TIMESTAMP NOT NULL
);`
  }
];

export function SQLToPySpark({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [sql, setSql] = useState(initialData?.sql || '');
  const [output, setOutput] = useState(initialData?.output || '');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  // Configuration options
  const [outputStyle, setOutputStyle] = useState<'struct_type' | 'ddl_string' | 'dataframe_snippet'>(
    initialData?.outputStyle || 'struct_type'
  );
  const [fieldCasing, setFieldCasing] = useState<'original' | 'snake_case' | 'camelCase' | 'PascalCase'>(
    initialData?.fieldCasing || 'original'
  );
  const [includeImports, setIncludeImports] = useState(initialData?.includeImports ?? true);

  useEffect(() => {
    onStateChange?.({
      sql,
      output,
      outputStyle,
      fieldCasing,
      includeImports,
    });
  }, [sql, output, outputStyle, fieldCasing, includeImports, onStateChange]);

  const applyCasing = (str: string, style: 'original' | 'snake_case' | 'camelCase' | 'PascalCase'): string => {
    const clean = str.replace(/[`"'[\]]/g, '').trim();
    if (style === 'original') return clean;

    const words = clean.split(/[^a-zA-Z0-9]+/).filter(Boolean);
    if (words.length === 0) return clean;

    if (style === 'snake_case') {
      return words.map(w => w.toLowerCase()).join('_');
    }

    if (style === 'camelCase') {
      return words.map((w, idx) => {
        const lower = w.toLowerCase();
        return idx === 0 ? lower : lower.charAt(0).toUpperCase() + lower.slice(1);
      }).join('');
    }

    if (style === 'PascalCase') {
      return words.map(w => {
        const lower = w.toLowerCase();
        return lower.charAt(0).toUpperCase() + lower.slice(1);
      }).join('');
    }

    return clean;
  };

  const sanitizePySparkField = (field: string): string => {
    if (PYTHON_KEYWORDS.has(field)) {
      return field + '_';
    }
    return field;
  };

  const mapSqlTypeToPySpark = (rawType: string): { sparkType: string; importType: string; ddlType: string } => {
    const upper = rawType.toUpperCase().trim();

    if (upper.includes('INT') || upper.includes('INTEGER')) {
      if (upper.includes('BIG') || upper.includes('INT8')) return { sparkType: 'LongType()', importType: 'LongType', ddlType: 'LONG' };
      if (upper.includes('SMALL') || upper.includes('INT2')) return { sparkType: 'ShortType()', importType: 'ShortType', ddlType: 'SHORT' };
      if (upper.includes('TINY') || upper.includes('INT1')) return { sparkType: 'ByteType()', importType: 'ByteType', ddlType: 'BYTE' };
      return { sparkType: 'IntegerType()', importType: 'IntegerType', ddlType: 'INT' };
    }

    if (upper.includes('FLOAT') || upper.includes('REAL')) {
      return { sparkType: 'FloatType()', importType: 'FloatType', ddlType: 'FLOAT' };
    }

    if (upper.includes('DOUBLE') || upper.includes('NUMERIC') || upper.includes('DECIMAL') || upper.includes('MONEY')) {
      const match = upper.match(/DECIMAL\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)/) || upper.match(/NUMERIC\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)/);
      if (match) {
        return {
          sparkType: `DecimalType(${match[1]}, ${match[2]})`,
          importType: 'DecimalType',
          ddlType: `DECIMAL(${match[1]}, ${match[2]})`
        };
      }
      return { sparkType: 'DoubleType()', importType: 'DoubleType', ddlType: 'DOUBLE' };
    }

    if (upper.includes('BOOL')) {
      return { sparkType: 'BooleanType()', importType: 'BooleanType', ddlType: 'BOOLEAN' };
    }

    if (upper.includes('TIMESTAMP') || upper.includes('DATETIME')) {
      return { sparkType: 'TimestampType()', importType: 'TimestampType', ddlType: 'TIMESTAMP' };
    }

    if (upper.includes('DATE')) {
      return { sparkType: 'DateType()', importType: 'DateType', ddlType: 'DATE' };
    }

    if (upper.includes('BLOB') || upper.includes('BINARY') || upper.includes('BYTEA')) {
      return { sparkType: 'BinaryType()', importType: 'BinaryType', ddlType: 'BINARY' };
    }

    return { sparkType: 'StringType()', importType: 'StringType', ddlType: 'STRING' };
  };

  const handleConvert = useCallback(() => {
    if (!sql.trim()) {
      setOutput('');
      setError('');
      return;
    }

    if (sql.length > MAX_LENGTH) {
      setError(t('error.max_length_sql', { max: MAX_LENGTH.toLocaleString() }));
      setOutput('');
      return;
    }

    try {
      // Find all CREATE TABLE statements
      const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([`"'a-zA-Z0-9_.]+)\s*\(([\s\S]*?)\)(?:;|\n\s*$|\s*ENGINE|\s*WITH|\s*$)/gi;
      const tables: { name: string; columns: { name: string; sparkType: string; importType: string; ddlType: string; nullable: boolean }[] }[] = [];

      let match;
      while ((match = tableRegex.exec(sql)) !== null) {
        const tableNameRaw = match[1].replace(/[`"'[\]]/g, '').split('.').pop() || 'table_name';
        const tableName = applyCasing(tableNameRaw, fieldCasing === 'original' ? 'snake_case' : fieldCasing);
        const body = match[2];

        const lines = body.split('\n');
        const columns: { name: string; sparkType: string; importType: string; ddlType: string; nullable: boolean }[] = [];

        for (let line of lines) {
          line = line.trim();
          if (!line || line.startsWith('--') || line.startsWith('/*')) continue;

          // Skip table level constraints
          const upperLine = line.toUpperCase();
          if (
            upperLine.startsWith('PRIMARY KEY') ||
            upperLine.startsWith('FOREIGN KEY') ||
            upperLine.startsWith('CONSTRAINT') ||
            upperLine.startsWith('UNIQUE') ||
            upperLine.startsWith('INDEX') ||
            upperLine.startsWith('KEY')
          ) {
            continue;
          }

          // Column line parsing
          const colMatch = line.match(/^([`"'a-zA-Z0-9_]+)\s+([a-zA-Z0-9_()]+(?:\s*\(\s*\d+(?:\s*,\s*\d+)?\s*\))?)(.*)/);
          if (colMatch) {
            const rawColName = colMatch[1];
            const rawColType = colMatch[2];
            const rest = colMatch[3] ? colMatch[3].toUpperCase() : '';

            const colName = sanitizePySparkField(applyCasing(rawColName, fieldCasing));
            const { sparkType, importType, ddlType } = mapSqlTypeToPySpark(rawColType);
            const nullable = !rest.includes('NOT NULL');

            columns.push({
              name: colName,
              sparkType,
              importType,
              ddlType,
              nullable
            });
          }
        }

        if (columns.length > 0) {
          tables.push({ name: tableName, columns });
        }
      }

      if (tables.length === 0) {
        setError(t('sqltopyspark.no_tables_found') || 'No valid CREATE TABLE DDL statements found.');
        setOutput('');
        return;
      }

      // Format output according to outputStyle
      const requiredImports = new Set<string>(['StructType', 'StructField']);
      tables.forEach(t => t.columns.forEach(c => requiredImports.add(c.importType)));

      let result = '';

      if (outputStyle === 'struct_type') {
        let importsStr = '';
        if (includeImports) {
          const importsList = Array.from(requiredImports).sort();
          importsStr = `from pyspark.sql.types import ${importsList.join(', ')}\n\n`;
        }

        const schemasStr = tables.map(tbl => {
          const fieldsStr = tbl.columns
            .map(c => `    StructField("${c.name}", ${c.sparkType}, ${c.nullable ? 'True' : 'False'})`)
            .join(',\n');
          return `${tbl.name}_schema = StructType([\n${fieldsStr}\n])`;
        }).join('\n\n');

        result = importsStr + schemasStr;
      } else if (outputStyle === 'ddl_string') {
        result = tables.map(tbl => {
          const ddlFields = tbl.columns.map(c => `${c.name} ${c.ddlType}${c.nullable ? '' : ' NOT NULL'}`).join(', ');
          return `${tbl.name}_schema_ddl = "${ddlFields}"`;
        }).join('\n\n');
      } else if (outputStyle === 'dataframe_snippet') {
        const importsList = Array.from(requiredImports).sort();
        let code = `from pyspark.sql import SparkSession\nfrom pyspark.sql.types import ${importsList.join(', ')}\n\n`;
        code += `spark = SparkSession.builder \\\n    .appName("PySparkApp") \\\n    .getOrCreate()\n\n`;

        const dfsStr = tables.map(tbl => {
          const fieldsStr = tbl.columns
            .map(c => `    StructField("${c.name}", ${c.sparkType}, ${c.nullable ? 'True' : 'False'})`)
            .join(',\n');
          return `${tbl.name}_schema = StructType([\n${fieldsStr}\n])\n\n# Create an empty DataFrame with schema\ndf_${tbl.name} = spark.createDataFrame([], schema=${tbl.name}_schema)`;
        }).join('\n\n');

        result = code + dfsStr;
      }

      setOutput(result);
      setError('');
    } catch (e: any) {
      setError(t('sqltopyspark.error_parsing') + ': ' + (e.message || String(e)));
      setOutput('');
    }
  }, [sql, outputStyle, fieldCasing, includeImports, t]);

  useEffect(() => {
    handleConvert();
  }, [handleConvert]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success(t('sqltopyspark.toast_copied') || 'PySpark schema copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  }, [output, t]);

  const handleClear = useCallback(() => {
    setSql('');
    setOutput('');
    setError('');
    setActivePreset(null);
    toast.success(t('sqltopyspark.toast_cleared') || 'Inputs cleared!');
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [t]);

  const handleLoadPreset = (preset: typeof PRESETS[0]) => {
    setSql(preset.sql);
    setActivePreset(preset.id);
    toast.success(t('sqltopyspark.preset_loaded', { name: t(preset.labelKey) || preset.defaultLabel }) || 'Loaded preset!');
    setTimeout(() => inputRef.current?.focus(), 50);
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
  }, [handleClear, handleCopy]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable) {
        if (e.key === "Escape") {
          e.preventDefault();
          handlersRef.current.onClear();
        }
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        handlersRef.current.onClear();
      } else if (e.key.toLowerCase() === "c" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        handlersRef.current.onCopy();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/x-python' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'pyspark_schema.py';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(t('sqltopyspark.toast_downloaded') || 'Downloaded pyspark_schema.py!');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8" role="region" aria-label="SQL to PySpark Schema Generator">
      {/* Header bar with presets and shortcut badges */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-3xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 mr-1">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            {t('sqltopyspark.presets_title') || 'Quick Start Presets:'}
          </span>
          {PRESETS.map((preset) => {
            const label = t(preset.labelKey) || preset.defaultLabel;
            const isActive = activePreset === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => handleLoadPreset(preset)}
                aria-pressed={isActive}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  isActive
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
            <Kbd modifier={null} className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400">Esc</Kbd>
            {t('common.clear')}
          </span>
          <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400 mr-2">
            <Kbd modifier={null} className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400">C</Kbd>
            {t('common.copy')}
          </span>
          <button
            onClick={handleClear}
            disabled={!sql && !output}
            className="text-xs font-bold px-3 py-1.5 rounded-xl text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-all flex items-center gap-1 disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" /> {t('common.clear')}
          </button>
        </div>
      </div>

      {/* Options Panel */}
      <div className="p-6 bg-slate-50 dark:bg-slate-900/40 rounded-3xl border border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label htmlFor="output-style-select" className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-2">
            {t('sqltopyspark.output_style') || 'Output Format'}
          </label>
          <select
            id="output-style-select"
            value={outputStyle}
            onChange={(e) => setOutputStyle(e.target.value as any)}
            className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-xs outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="struct_type">PySpark StructType Schema</option>
            <option value="ddl_string">PySpark DDL String</option>
            <option value="dataframe_snippet">Full DataFrame Code Snippet</option>
          </select>
        </div>

        <div>
          <label htmlFor="field-casing-select" className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-2">
            {t('sqltopyspark.field_casing') || 'Field Casing'}
          </label>
          <select
            id="field-casing-select"
            value={fieldCasing}
            onChange={(e) => setFieldCasing(e.target.value as any)}
            className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-xs outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="original">Original (from SQL)</option>
            <option value="snake_case">snake_case</option>
            <option value="camelCase">camelCase</option>
            <option value="PascalCase">PascalCase</option>
          </select>
        </div>

        <div className="flex flex-col justify-end">
          <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">
            <input
              type="checkbox"
              checked={includeImports}
              onChange={(e) => setIncludeImports(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
            />
            {t('sqltopyspark.include_imports') || 'Include PySpark types imports'}
          </label>
        </div>
      </div>

      {/* Editor & Output Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-500" />
              <label htmlFor="sql-pyspark-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('sqltopyspark.sql_input_label') || 'SQL CREATE TABLE DDL'}
              </label>
            </div>
          </div>
          <textarea
            id="sql-pyspark-input"
            ref={inputRef}
            value={sql}
            onChange={(e) => {
              setSql(e.target.value);
              if (activePreset) setActivePreset(null);
            }}
            placeholder={t('sqltopyspark.placeholder_sql') || 'Paste SQL CREATE TABLE DDL statements here...'}
            className="w-full h-[450px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-500" />
              <label htmlFor="pyspark-output" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('sqltopyspark.output_label') || 'Generated PySpark Schema'}
              </label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                disabled={!output}
                className="text-xs font-bold px-3 py-1.5 rounded-xl text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 transition-all flex items-center gap-1 disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" /> {t('common.download')}
              </button>
              <button
                onClick={handleCopy}
                disabled={!output}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                  copied
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                    : 'text-slate-500 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} {copied ? t('common.copied') : t('common.copy')}
              </button>
            </div>
          </div>
          <textarea
            id="pyspark-output"
            value={output}
            readOnly
            placeholder={t('sqltopyspark.placeholder_output') || 'Generated PySpark schema code will appear here...'}
            className="w-full h-[450px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-mono text-sm leading-relaxed text-indigo-600 dark:text-indigo-400 resize-none"
          />
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Information Box */}
      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <Info className="w-6 h-6 text-indigo-500 mt-1" />
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('sqltopyspark.about_title') || 'About SQL DDL to PySpark Schema Generator'}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('sqltopyspark.about_text') || 'Convert SQL CREATE TABLE DDL queries directly into PySpark StructType/StructField schema definitions or DDL strings for Apache Spark / Databricks data pipelines. Maps SQL column types to Spark DataType instances (IntegerType, StringType, DoubleType, TimestampType, etc.), configures nullability, and handles field casing transformations.'}
          </p>
        </div>
      </div>
    </div>
  );
}
