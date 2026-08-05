import { useState, useEffect, useCallback, useRef } from 'react';
import { Network, Copy, Check, Trash2, AlertCircle, Download, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;

interface Column {
  name: string;
  type: string;
  isPk: boolean;
  isFk: boolean;
  nullable: boolean;
}

interface ForeignKey {
  fromTable: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
}

interface TableData {
  name: string;
  columns: Column[];
  primaryKeys: string[];
}

export function SQLToMermaid({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState(initialData?.input || '');
  const [output, setOutput] = useState(initialData?.output || '');
  const [includeTypes, setIncludeTypes] = useState(initialData?.includeTypes !== false);
  const [cardinalityType, setCardinalityType] = useState(initialData?.cardinalityType || 'one_to_many');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ input, output, includeTypes, cardinalityType });
  }, [input, output, includeTypes, cardinalityType, onStateChange]);

  const samples = {
    blog: `CREATE TABLE users (
  id INT PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  email VARCHAR(100) UNIQUE,
  created_at TIMESTAMP
);

CREATE TABLE posts (
  id INT PRIMARY KEY,
  author_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  published BOOLEAN DEFAULT false,
  FOREIGN KEY (author_id) REFERENCES users(id)
);

CREATE TABLE comments (
  id INT PRIMARY KEY,
  post_id INT REFERENCES posts(id) ON DELETE CASCADE,
  author_id INT REFERENCES users(id),
  body TEXT NOT NULL
);`,
    ecommerce: `CREATE TABLE customers (
  customer_id INT PRIMARY KEY,
  first_name VARCHAR(50),
  last_name VARCHAR(50),
  email VARCHAR(100)
);

CREATE TABLE orders (
  order_id INT PRIMARY KEY,
  customer_id INT NOT NULL,
  order_date DATE,
  total_amount DECIMAL(10,2),
  FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
);

CREATE TABLE products (
  product_id INT PRIMARY KEY,
  name VARCHAR(150),
  price DECIMAL(10,2),
  stock_quantity INT
);

CREATE TABLE order_items (
  item_id INT PRIMARY KEY,
  order_id INT,
  product_id INT,
  quantity INT,
  price DECIMAL(10,2),
  FOREIGN KEY (order_id) REFERENCES orders(order_id),
  FOREIGN KEY (product_id) REFERENCES products(product_id)
);`
  };

  const sanitizeName = (name: string): string => {
    return name.replace(/[^a-zA-Z0-9_]/g, '');
  };

  const parseSqlToMermaid = useCallback(() => {
    try {
      if (!input.trim()) {
        setOutput('');
        setError('');
        return;
      }

      if (input.length > MAX_LENGTH) {
        setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
        return;
      }

      // Strip comments
      const cleanInput = input
        .replace(/--.*$/gm, '')
        .replace(/\/\*[\s\S]*?\*\//g, '');

      const tables: TableData[] = [];
      const foreignKeys: ForeignKey[] = [];
      const parsedTables = new Set<string>();

      // Parse standalone FOREIGN KEY constraints via ALTER TABLE
      const standaloneFkRegex = /ALTER\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:["`]?\w+["`]?\.)?["`]?(\w+)["`]?\s+ADD\s+(?:CONSTRAINT\s+["`]?\w+["`]?\s+)?FOREIGN\s+KEY\s*\(\s*["`]?(\w+)["`]?\s*\)\s*REFERENCES\s+(?:["`]?\w+["`]?\.)?["`]?(\w+)["`]?\s*\(\s*["`]?(\w+)["`]?\s*\)/gi;
      let fkMatch;
      while ((fkMatch = standaloneFkRegex.exec(cleanInput)) !== null) {
        foreignKeys.push({
          fromTable: sanitizeName(fkMatch[1]),
          fromColumn: sanitizeName(fkMatch[2]),
          toTable: sanitizeName(fkMatch[3]),
          toColumn: sanitizeName(fkMatch[4])
        });
      }

      // Deterministic nested parenthesis matching parser to extract CREATE TABLE statements
      let pos = 0;
      while (true) {
        const matchIndex = cleanInput.toUpperCase().indexOf('CREATE TABLE', pos);
        if (matchIndex === -1) break;

        const openParenIndex = cleanInput.indexOf('(', matchIndex);
        if (openParenIndex === -1) {
          pos = matchIndex + 12;
          continue;
        }

        const tableHeader = cleanInput.substring(matchIndex + 12, openParenIndex).trim();
        const headerParts = tableHeader.split(/\s+/).filter(Boolean);
        let rawTableName = '';
        if (headerParts.length > 0) {
          rawTableName = headerParts[headerParts.length - 1];
        }
        const tableName = sanitizeName(rawTableName);
        if (!tableName) {
          pos = openParenIndex + 1;
          continue;
        }

        let parenDepth = 1;
        let closeParenIndex = -1;
        let inQuotes = false;
        let quoteChar = '';

        for (let i = openParenIndex + 1; i < cleanInput.length; i++) {
          const char = cleanInput[i];
          if ((char === '"' || char === '`' || char === "'") && cleanInput[i - 1] !== '\\') {
            if (!inQuotes) {
              inQuotes = true;
              quoteChar = char;
            } else if (char === quoteChar) {
              inQuotes = false;
            }
          }
          if (!inQuotes) {
            if (char === '(') parenDepth++;
            if (char === ')') parenDepth--;
            if (parenDepth === 0) {
              closeParenIndex = i;
              break;
            }
          }
        }

        if (closeParenIndex === -1) {
          pos = openParenIndex + 1;
          continue;
        }

        const body = cleanInput.substring(openParenIndex + 1, closeParenIndex);
        parsedTables.add(tableName.toLowerCase());

        const columns: Column[] = [];
        const primaryKeys: string[] = [];

        // Split body lines safely respecting nested parents
        const lines: string[] = [];
        let currentLine = '';
        let subParenDepth = 0;
        let subInQuotes = false;
        let subQuoteChar = '';

        for (let i = 0; i < body.length; i++) {
          const char = body[i];
          if ((char === '"' || char === '`' || char === "'") && body[i - 1] !== '\\') {
            if (!subInQuotes) {
              subInQuotes = true;
              subQuoteChar = char;
            } else if (char === subQuoteChar) {
              subInQuotes = false;
            }
          }
          if (!subInQuotes) {
            if (char === '(') subParenDepth++;
            if (char === ')') subParenDepth--;
          }

          if (char === ',' && subParenDepth === 0 && !subInQuotes) {
            lines.push(currentLine.trim());
            currentLine = '';
          } else {
            currentLine += char;
          }
        }
        if (currentLine.trim()) lines.push(currentLine.trim());

        lines.forEach(line => {
          const upperLine = line.toUpperCase().trim();
          if (!upperLine) return;

          // Table level PRIMARY KEY (col1, col2, ...)
          if (upperLine.startsWith('PRIMARY KEY')) {
            const pkMatch = line.match(/PRIMARY\s+KEY\s*\(([^)]+)\)/i);
            if (pkMatch) {
              pkMatch[1].split(',').forEach(col => {
                primaryKeys.push(sanitizeName(col.trim()));
              });
            }
            return;
          }

          // Table level FOREIGN KEY (col) REFERENCES other(col)
          if (upperLine.startsWith('FOREIGN KEY') || upperLine.includes('FOREIGN KEY')) {
            const fkMatch = line.match(/(?:CONSTRAINT\s+["`]?\w+["`]?\s+)?FOREIGN\s+KEY\s*\(\s*["`]?(\w+)["`]?\s*\)\s*REFERENCES\s+(?:["`]?\w+["`]?\.)?["`]?(\w+)["`]?\s*\(\s*["`]?(\w+)["`]?\s*\)/i);
            if (fkMatch) {
              foreignKeys.push({
                fromTable: tableName,
                fromColumn: sanitizeName(fkMatch[1]),
                toTable: sanitizeName(fkMatch[2]),
                toColumn: sanitizeName(fkMatch[3])
              });
            }
            return;
          }

          // Skip other constraints
          if (upperLine.startsWith('CONSTRAINT') || upperLine.startsWith('UNIQUE') || upperLine.startsWith('CHECK') || upperLine.startsWith('INDEX') || upperLine.startsWith('KEY')) {
            return;
          }

          // Column parsing
          let colName = '';
          let rest = '';

          if (line.startsWith('"') || line.startsWith('`') || line.startsWith("'")) {
            const quote = line[0];
            let i = 1;
            while (i < line.length && (line[i] !== quote || line[i - 1] === '\\')) {
              colName += line[i];
              i++;
            }
            rest = line.substring(i + 1).trim();
          } else {
            const parts = line.split(/\s+/);
            colName = parts[0];
            rest = parts.slice(1).join(' ').trim();
          }

          if (!colName) return;

          const colNameSanitized = sanitizeName(colName);
          const partsRest = rest.split(/\s+/);
          const colType = partsRest[0] || 'any';

          const isPk = upperLine.includes('PRIMARY KEY');
          const isNullable = !upperLine.includes('NOT NULL');

          if (isPk) {
            primaryKeys.push(colNameSanitized);
          }

          // Inline REFERENCES constraint
          const inlineRefMatch = line.match(/REFERENCES\s+(?:["`]?\w+["`]?\.)?["`]?(\w+)["`]?\s*\(\s*["`]?(\w+)["`]?\s*\)/i);
          if (inlineRefMatch) {
            foreignKeys.push({
              fromTable: tableName,
              fromColumn: colNameSanitized,
              toTable: sanitizeName(inlineRefMatch[1]),
              toColumn: sanitizeName(inlineRefMatch[2])
            });
          }

          columns.push({
            name: colNameSanitized,
            type: colType.toLowerCase(),
            isPk,
            isFk: false,
            nullable: isNullable
          });
        });

        tables.push({
          name: tableName,
          columns,
          primaryKeys
        });

        pos = closeParenIndex + 1;
      }

      // Sync PK & FK flags
      tables.forEach(table => {
        table.columns.forEach(col => {
          if (table.primaryKeys.includes(col.name)) {
            col.isPk = true;
          }
          const hasFk = foreignKeys.some(fk => fk.fromTable === table.name && fk.fromColumn === col.name);
          if (hasFk) {
            col.isFk = true;
          }
        });
      });

      // Generate Mermaid Output
      let mermaidResult = 'erDiagram\n\n';

      tables.forEach(table => {
        mermaidResult += `    ${table.name} {\n`;
        table.columns.forEach(col => {
          let typeLabel = col.type.replace(/[^a-zA-Z0-9]/g, '');
          if (!includeTypes) {
            typeLabel = 'column';
          }
          const pkLabel = col.isPk ? 'PK' : '';
          const fkLabel = col.isFk ? 'FK' : '';
          const modifier = [pkLabel, fkLabel].filter(Boolean).join(',');
          const cleanColName = col.name;

          mermaidResult += `        ${typeLabel} ${cleanColName}`;
          if (modifier) {
            mermaidResult += ` ${modifier}`;
          }
          mermaidResult += '\n';
        });
        mermaidResult += `    }\n\n`;
      });

      const renderedRelations = new Set<string>();
      foreignKeys.forEach(fk => {
        const fromExists = parsedTables.has(fk.fromTable.toLowerCase());
        const toExists = parsedTables.has(fk.toTable.toLowerCase());

        if (fromExists && toExists) {
          let relConnector = '||--o{';
          if (cardinalityType === 'one_to_one') {
            relConnector = '||--||';
          } else if (cardinalityType === 'zero_to_many') {
            relConnector = '}o--||';
          } else if (cardinalityType === 'many_to_many') {
            relConnector = '}o--o{';
          }

          const relString = `    ${fk.toTable} ${relConnector} ${fk.fromTable} : "fk_${fk.fromColumn}"`;
          const relKey = `${fk.toTable}-${fk.fromTable}-${fk.fromColumn}`;

          if (!renderedRelations.has(relKey)) {
            mermaidResult += relString + '\n';
            renderedRelations.add(relKey);
          }
        }
      });

      if (tables.length === 0) {
        setError(t('sqltomermaid.no_tables_found', 'No valid CREATE TABLE statements found.'));
        setOutput('');
      } else {
        setOutput(mermaidResult.trim());
        setError('');
      }
    } catch (err: any) {
      setError(t('sqltomermaid.error_parsing', 'Error parsing SQL') + ': ' + err.message);
      setOutput('');
    }
  }, [input, includeTypes, cardinalityType, t]);

  useEffect(() => {
    parseSqlToMermaid();
  }, [parseSqlToMermaid]);

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
    setError('');
    toast.success(t('common.cleared'));
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [t]);

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'er-diagram.mmd';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(t('common.downloaded'));
  };

  const loadSample = (key: 'blog' | 'ecommerce') => {
    setInput(samples[key]);
    toast.success(t('sqltomermaid.sample_loaded', 'Sample SQL DDL loaded!'));
  };

  const handlersRef = useRef({ handleClear, handleCopy, input, output });
  useEffect(() => {
    handlersRef.current = { handleClear, handleCopy, input, output };
  }, [handleClear, handleCopy, input, output]);

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
        if (handlersRef.current.output) {
          e.preventDefault();
          handlersRef.current.handleCopy();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between p-6 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-3xl">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => loadSample('blog')}
            className="text-xs font-bold px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 text-slate-600 dark:text-slate-300 rounded-xl transition-all"
          >
            📊 {t('sqltomermaid.sample_blog', 'Sample: Blogging App')}
          </button>
          <button
            onClick={() => loadSample('ecommerce')}
            className="text-xs font-bold px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 text-slate-600 dark:text-slate-300 rounded-xl transition-all"
          >
            🛒 {t('sqltomermaid.sample_ecommerce', 'Sample: E-Commerce')}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-600 dark:text-slate-300 select-none">
            <input
              type="checkbox"
              checked={includeTypes}
              onChange={(e) => setIncludeTypes(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500/20"
            />
            {t('sqltomermaid.include_types', 'Include Data Types')}
          </label>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 select-none">{t('sqltomermaid.cardinality', 'Cardinality')}:</span>
            <select
              value={cardinalityType}
              onChange={(e) => setCardinalityType(e.target.value)}
              className="text-xs font-bold px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500"
            >
              <option value="one_to_many">{t('sqltomermaid.card_one_to_many', '1 to Many (||--o{)')}</option>
              <option value="zero_to_many">{t('sqltomermaid.card_zero_to_many', 'Zero to Many (}o--||)')}</option>
              <option value="one_to_one">{t('sqltomermaid.card_one_to_one', '1 to 1 (||--||)')}</option>
              <option value="many_to_many">{t('sqltomermaid.card_many_to_many', 'Many to Many (}o--o{)')}</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Network className="w-4 h-4 text-indigo-500" />
              <label htmlFor="sql-ddl-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">{t('sqltomermaid.sql_input_label', 'SQL CREATE TABLE DDL')}</label>
            </div>
            <div className="flex items-center gap-2">
              <Kbd modifier={null} className="hidden sm:inline-flex border-rose-200 dark:border-rose-800 text-rose-400 dark:bg-slate-900">Esc</Kbd>
              <button
                onClick={handleClear}
                disabled={!input && !output}
                className="text-xs font-bold px-3 py-1.5 rounded-xl text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all flex items-center gap-1 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
              >
                <Trash2 className="w-3 h-3" /> {t('common.clear')}
              </button>
            </div>
          </div>
          <textarea
            id="sql-ddl-input"
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`CREATE TABLE users (\n  id INT PRIMARY KEY,\n  username VARCHAR(50) NOT NULL,\n  email VARCHAR(100)\n);`}
            className="w-full h-[450px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Network className="w-4 h-4 text-emerald-500 animate-pulse" />
              <label htmlFor="mermaid-er-output" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">{t('sqltomermaid.mermaid_output_label', 'Mermaid ER Diagram')}</label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                disabled={!output}
                className="text-xs font-bold px-3 py-1.5 rounded-xl text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 transition-all flex items-center gap-1 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
              >
                <Download className="w-3 h-3" /> {t('common.download')}
              </button>
              <button
                onClick={handleCopy}
                disabled={!output}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                  copied
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                    : 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied ? t('common.copied') : t('common.copy')}
                {!copied && input && <Kbd modifier={null} className="hidden sm:inline-flex w-4 h-4 bg-white/50 dark:bg-black/20 ml-1">C</Kbd>}
              </button>
            </div>
          </div>
          <textarea
            id="mermaid-er-output"
            value={output}
            readOnly
            placeholder={t('sqltomermaid.placeholder_output', 'Mermaid diagram representation will appear here...')}
            className="w-full h-[450px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-mono text-sm leading-relaxed text-indigo-600 dark:text-indigo-400 resize-none"
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
          <h4 className="font-bold dark:text-white">{t('sqltomermaid.about_title', 'About SQL to Mermaid ER Diagram')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('sqltomermaid.about_text', 'Paste SQL CREATE TABLE statements on the left to instantly generate a standard-compliant Mermaid.js ER Diagram syntax. Standalone and inline foreign key constraints are analyzed and translated into visual relationship lines in the diagram representation. You can copy-paste the output directly into Notion, Obsidian, GitHub markdown, or the official Mermaid Live Editor!')}
          </p>
        </div>
      </div>
    </div>
  );
}
