import { useState, useEffect, useCallback, useRef } from 'react';
import { Database, Copy, Check, Trash2, AlertCircle, Download, Info, Terminal, Sparkles, Code2, Layers } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;

type Mode = 'createtable' | 'awssdk' | 'partiql';

export function SQLToDynamoDB({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState(initialData?.input || '');
  const [output, setOutput] = useState(initialData?.output || '');
  const [mode, setMode] = useState<Mode>(initialData?.mode || 'createtable');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ input, output, mode });
  }, [input, output, mode, onStateChange]);

  const PRESETS = {
    create_ecommerce: `-- DynamoDB Table for E-Commerce Products
CREATE TABLE products (
  id VARCHAR(64) NOT NULL,
  category VARCHAR(32) NOT NULL,
  title VARCHAR(255) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  in_stock BOOLEAN DEFAULT true,
  created_at TIMESTAMP,
  PRIMARY KEY (id, category)
);`,
    create_users: `-- User Auth & Sessions Table
CREATE TABLE user_sessions (
  user_id VARCHAR(128) NOT NULL PRIMARY KEY,
  session_token VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45),
  expires_at BIGINT
);`,
    insert_product: `-- Insert Product Record
INSERT INTO products (id, category, title, price, in_stock)
VALUES ('p101', 'electronics', 'Wireless Mouse', 29.99, true);`,
    select_query: `-- Filter User Orders by Customer ID
SELECT order_id, total, status
FROM orders
WHERE customer_id = 'c_8891' AND status = 'COMPLETED'
LIMIT 10;`
  };

  const sanitizeKey = (key: string) => {
    const clean = key.trim().replace(/[`"[]/g, '');
    const lower = clean.toLowerCase();
    if (lower === '__proto__' || lower === 'constructor' || lower === 'prototype') {
      return `_${clean}`;
    }
    return clean;
  };

  const parseValue = (val: string) => {
    val = val.trim();
    if (val.toUpperCase() === 'NULL') return null;
    if (val.toUpperCase() === 'TRUE') return true;
    if (val.toUpperCase() === 'FALSE') return false;
    if (/^-?\d+(\.\d+)?$/.test(val)) return Number(val);
    if ((val.startsWith("'") && val.endsWith("'")) || (val.startsWith('"') && val.endsWith('"'))) {
      return val.slice(1, -1).replace(/''/g, "'").replace(/""/g, '"');
    }
    return val;
  };

  const mapSQLTypeToDynamo = (sqlType: string): 'S' | 'N' | 'B' | 'BOOL' | 'M' => {
    const t = sqlType.toUpperCase();
    if (t.includes('INT') || t.includes('FLOAT') || t.includes('DOUBLE') || t.includes('DECIMAL') || t.includes('NUMERIC') || t.includes('REAL')) {
      return 'N';
    }
    if (t.includes('BOOL')) {
      return 'BOOL';
    }
    if (t.includes('BLOB') || t.includes('BYTEA') || t.includes('BINARY')) {
      return 'B';
    }
    if (t.includes('JSON')) {
      return 'M';
    }
    return 'S';
  };

  const handleConvert = useCallback(() => {
    if (!input.trim()) {
      setOutput('');
      setError('');
      return;
    }

    if (input.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
      setOutput('');
      return;
    }

    try {
      const cleanInput = input.trim().replace(/--.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
      let result = '';

      // Check for CREATE TABLE
      const createTableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([^\s(]+)\s*\(([\s\S]+)\);?/i;
      const createMatch = cleanInput.match(createTableRegex);

      // Check for INSERT INTO
      const insertRegex = /INSERT\s+INTO\s+([^\s(]+)\s*\(([^)]+)\)\s*VALUES\s*([\s\S]+);?/i;
      const insertMatch = cleanInput.match(insertRegex);

      // Check for SELECT
      const selectRegex = /SELECT\s+([\s\S]+?)\s+FROM\s+([^\s;]+)(?:\s+WHERE\s+([\s\S]+?))?(?:\s+LIMIT\s+(\d+))?\s*;?$/i;
      const selectMatch = cleanInput.match(selectRegex);

      if (createMatch) {
        const tableName = sanitizeKey(createMatch[1]);
        const body = createMatch[2];

        // Split column definitions and table constraints
        const lines = body.split(/,(?![^(]*\))/).map((s: string) => s.trim()).filter(Boolean);

        const columns: { name: string; type: string; isPk: boolean }[] = [];
        let pkNames: string[] = [];

        lines.forEach((line: string) => {
          if (/^PRIMARY\s+KEY/i.test(line)) {
            const pkMatch = line.match(/PRIMARY\s+KEY\s*\(([^)]+)\)/i);
            if (pkMatch) {
              pkNames = pkMatch[1].split(',').map((s: string) => sanitizeKey(s));
            }
          } else {
            const parts = line.split(/\s+/);
            if (parts.length >= 2) {
              const colName = sanitizeKey(parts[0]);
              const colType = parts[1];
              const isInlinePk = /PRIMARY\s+KEY/i.test(line);
              if (isInlinePk) {
                pkNames.push(colName);
              }
              columns.push({ name: colName, type: colType, isPk: isInlinePk });
            }
          }
        });

        if (pkNames.length === 0 && columns.length > 0) {
          pkNames.push(columns[0].name);
        }

        const partitionKey = pkNames[0];
        const sortKey = pkNames.length > 1 ? pkNames[1] : null;

        const keySchema: { AttributeName: string; KeyType: 'HASH' | 'RANGE' }[] = [
          { AttributeName: partitionKey, KeyType: 'HASH' }
        ];
        if (sortKey) {
          keySchema.push({ AttributeName: sortKey, KeyType: 'RANGE' });
        }

        const attributeDefinitions: { AttributeName: string; AttributeType: 'S' | 'N' | 'B' | 'BOOL' | 'M' }[] = [];

        const keyAttrNames = new Set(pkNames);
        columns.forEach(col => {
          if (keyAttrNames.has(col.name)) {
            attributeDefinitions.push({
              AttributeName: col.name,
              AttributeType: mapSQLTypeToDynamo(col.type)
            });
          }
        });

        if (mode === 'createtable') {
          const createTableObj = {
            TableName: tableName,
            AttributeDefinitions: attributeDefinitions,
            KeySchema: keySchema,
            BillingMode: 'PAY_PER_REQUEST'
          };
          result = JSON.stringify(createTableObj, null, 2);
        } else if (mode === 'awssdk') {
          result = `import { DynamoDBClient, CreateTableCommand } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({});

const command = new CreateTableCommand(${JSON.stringify({
            TableName: tableName,
            AttributeDefinitions: attributeDefinitions,
            KeySchema: keySchema,
            BillingMode: 'PAY_PER_REQUEST'
          }, null, 2)});

async function createTable() {
  try {
    const response = await client.send(command);
    console.log("Table created successfully:", response.TableDescription?.TableArn);
  } catch (error) {
    console.error("Error creating DynamoDB table:", error);
  }
}

createTable();`;
        } else {
          result = `-- PartiQL DDL Statement for Amazon DynamoDB
CREATE TABLE "${tableName}" VALUE {
  '${partitionKey}': 'STRING'${sortKey ? `,\n  '${sortKey}': 'STRING'` : ''}
};`;
        }
      } else if (insertMatch) {
        const tableName = sanitizeKey(insertMatch[1]);
        const columns = insertMatch[2].split(',').map((s: string) => sanitizeKey(s));
        let valuesBlock = insertMatch[3].trim();
        if (valuesBlock.endsWith(';')) valuesBlock = valuesBlock.slice(0, -1).trim();

        // Extract first row values
        const rowMatch = valuesBlock.match(/^\(([\s\S]+)\)$/);
        const rowVals: any[] = [];
        if (rowMatch) {
          let currentVal = '';
          let inStr = false;
          for (let i = 0; i < rowMatch[1].length; i++) {
            const char = rowMatch[1][i];
            if (char === "'" && rowMatch[1][i-1] !== '\\') inStr = !inStr;
            if (!inStr && char === ',') {
              rowVals.push(parseValue(currentVal));
              currentVal = '';
            } else {
              currentVal += char;
            }
          }
          rowVals.push(parseValue(currentVal));
        }

        const itemObj: any = Object.create(null);
        columns.forEach((col: string, idx: number) => {
          itemObj[col] = rowVals[idx] !== undefined ? rowVals[idx] : null;
        });

        if (mode === 'createtable') {
          result = JSON.stringify({
            TableName: tableName,
            Item: itemObj
          }, null, 2);
        } else if (mode === 'awssdk') {
          result = `import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const command = new PutCommand({
  TableName: "${tableName}",
  Item: ${JSON.stringify(itemObj, null, 2)}
});

async function putItem() {
  try {
    const response = await docClient.send(command);
    console.log("Item inserted successfully:", response);
  } catch (error) {
    console.error("Error putting item to DynamoDB:", error);
  }
}

putItem();`;
        } else {
          result = `-- Amazon DynamoDB PartiQL Insert Statement
INSERT INTO "${tableName}" VALUE ${JSON.stringify(itemObj, null, 2)};`;
        }
      } else if (selectMatch) {
        const fields = selectMatch[1].trim();
        const tableName = sanitizeKey(selectMatch[2]);
        const where = selectMatch[3];
        const limit = selectMatch[4];

        const queryObj: any = Object.create(null);
        let keyExpr = '';
        const attrValues: any = Object.create(null);

        if (where) {
          const conditions = where.split(/\s+AND\s+/i);
          const exprs: string[] = [];
          conditions.forEach((cond: string) => {
            const partMatch = cond.match(/([^\s>=<!]+)\s*(>=|<=|!=|<>|=|>|<)\s*(.+)/i);
            if (partMatch) {
              const key = sanitizeKey(partMatch[1]);
              const op = partMatch[2];
              const val = parseValue(partMatch[3]);
              const placeholder = `:${key}`;
              exprs.push(`${key} ${op} ${placeholder}`);
              attrValues[placeholder] = val;
            }
          });
          keyExpr = exprs.join(' AND ');
        }

        if (mode === 'createtable') {
          result = JSON.stringify({
            TableName: tableName,
            KeyConditionExpression: keyExpr || undefined,
            ExpressionAttributeValues: Object.keys(attrValues).length ? attrValues : undefined,
            Limit: limit ? Number(limit) : undefined
          }, null, 2);
        } else if (mode === 'awssdk') {
          const isQuery = !!keyExpr;
          const commandName = isQuery ? 'QueryCommand' : 'ScanCommand';
          result = `import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ${commandName} } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const command = new ${commandName}({
  TableName: "${tableName}"${keyExpr ? `,\n  KeyConditionExpression: "${keyExpr}"` : ''}${Object.keys(attrValues).length ? `,\n  ExpressionAttributeValues: ${JSON.stringify(attrValues, null, 4)}` : ''}${limit ? `,\n  Limit: ${limit}` : ''}
});

async function runQuery() {
  try {
    const response = await docClient.send(command);
    console.log("DynamoDB items retrieved:", response.Items);
  } catch (error) {
    console.error("Error querying DynamoDB:", error);
  }
}

runQuery();`;
        } else {
          result = `-- Amazon DynamoDB PartiQL Query
SELECT ${fields === '*' ? '*' : fields} FROM "${tableName}"${where ? ` WHERE ${where}` : ''}${limit ? ` LIMIT ${limit}` : ''};`;
        }
      } else {
        setError(t('sqltodynamodb.error_unsupported', 'Unsupported SQL statement. Supports CREATE TABLE, INSERT INTO, and SELECT.'));
        setOutput('');
        return;
      }

      setOutput(result);
      setError('');
    } catch (e: any) {
      setError(e.message || t('sqltodynamodb.error_parsing', 'Error parsing SQL query.'));
      setOutput('');
    }
  }, [input, mode, t]);

  useEffect(() => {
    handleConvert();
  }, [handleConvert]);

  const handleClear = useCallback(() => {
    setInput('');
    setOutput('');
    setError('');
    toast.success(t('common.cleared', 'Cleared!'));
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [t]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success(t('common.copied', 'Copied to clipboard!'));
    setTimeout(() => setCopied(false), 2000);
  }, [output, t]);

  const handleDownload = () => {
    if (!output) return;
    const ext = mode === 'createtable' ? 'json' : mode === 'awssdk' ? 'ts' : 'sql';
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dynamodb-output.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(t('common.downloaded', `Downloaded dynamodb-output.${ext}!`));
  };

  const loadPreset = (key: keyof typeof PRESETS) => {
    setInput(PRESETS[key]);
    toast.success(t('sqltodynamodb.preset_loaded', 'Loaded SQL preset!'));
  };

  const handlersRef = useRef({ handleClear, handleCopy, output });
  useEffect(() => {
    handlersRef.current = { handleClear, handleCopy, output };
  }, [handleClear, handleCopy, output]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const active = document.activeElement;
      const isEditable =
        active instanceof HTMLInputElement ||
        active instanceof HTMLTextAreaElement ||
        active instanceof HTMLSelectElement ||
        active?.getAttribute("contenteditable") === "true";

      if (isEditable && e.key !== 'Escape') return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key === "Escape") {
        e.preventDefault();
        handlersRef.current.handleClear();
      } else if (e.key.toLowerCase() === "c") {
        if (handlersRef.current.output) {
          e.preventDefault();
          handlersRef.current.handleCopy();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Target Output Format Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-500" aria-hidden="true" />
          <span className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('sqltodynamodb.output_mode_title', 'Target Output Format')}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setMode('createtable')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
              mode === 'createtable'
                ? 'bg-indigo-600 text-white'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-500'
            }`}
          >
            {t('sqltodynamodb.mode_create_table', 'CreateTable JSON Schema')}
          </button>
          <button
            onClick={() => setMode('awssdk')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
              mode === 'awssdk'
                ? 'bg-indigo-600 text-white'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-500'
            }`}
          >
            {t('sqltodynamodb.mode_aws_sdk', 'AWS SDK v3 (JS/TS)')}
          </button>
          <button
            onClick={() => setMode('partiql')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
              mode === 'partiql'
                ? 'bg-indigo-600 text-white'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-500'
            }`}
          >
            {t('sqltodynamodb.mode_partiql', 'PartiQL Statement')}
          </button>
        </div>
      </div>

      {/* Presets Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" aria-hidden="true" />
          <span className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('sqltodynamodb.presets_title', 'Clickable Presets')}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => loadPreset('create_ecommerce')}
            className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 rounded-xl transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
          >
            {t('sqltodynamodb.preset_ecommerce', 'E-Commerce Catalog (PK+SK)')}
          </button>
          <button
            onClick={() => loadPreset('create_users')}
            className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 rounded-xl transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
          >
            {t('sqltodynamodb.preset_users', 'User Sessions Table')}
          </button>
          <button
            onClick={() => loadPreset('insert_product')}
            className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 rounded-xl transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
          >
            {t('sqltodynamodb.preset_insert', 'INSERT / PutItem')}
          </button>
          <button
            onClick={() => loadPreset('select_query')}
            className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 rounded-xl transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
          >
            {t('sqltodynamodb.preset_select', 'SELECT / Query Command')}
          </button>
        </div>
      </div>

      {/* Editor Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-500" aria-hidden="true" />
              <label htmlFor="sql-dynamo-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('sqltodynamodb.sql_input_label', 'SQL Query or DDL Input')}
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Kbd modifier={null} className="hidden sm:inline-flex border-rose-200 dark:border-rose-800 text-rose-400 dark:bg-slate-900">Esc</Kbd>
              <button
                onClick={handleClear}
                disabled={!input && !output}
                className="text-xs font-bold px-3 py-1.5 rounded-xl text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all flex items-center gap-1 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
              >
                <Trash2 className="w-3 h-3" aria-hidden="true" /> {t('common.clear')}
              </button>
            </div>
          </div>
          <textarea
            id="sql-dynamo-input"
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('sqltodynamodb.placeholder_sql', 'Paste SQL query or CREATE TABLE DDL here...')}
            className="w-full h-80 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-emerald-500" aria-hidden="true" />
              <label htmlFor="dynamo-output" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('sqltodynamodb.output_label', 'DynamoDB Command / Schema Output')}
              </label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                disabled={!output}
                className="text-xs font-bold px-3 py-1.5 rounded-xl text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 transition-all flex items-center gap-1 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
              >
                <Download className="w-3 h-3" aria-hidden="true" /> {t('common.download')}
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
                {copied ? <Check className="w-3 h-3" aria-hidden="true" /> : <Copy className="w-3 h-3" aria-hidden="true" />} {copied ? t('common.copied') : t('common.copy')}
                {!copied && input && <Kbd modifier={null} className="hidden sm:inline-flex w-4 h-4 bg-white/50 dark:bg-black/20 ml-1">C</Kbd>}
              </button>
            </div>
          </div>
          <textarea
            id="dynamo-output"
            value={output}
            readOnly
            placeholder={t('sqltodynamodb.placeholder_output', 'DynamoDB output will appear here...')}
            className="w-full h-80 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-mono text-sm leading-relaxed text-indigo-600 dark:text-indigo-400 resize-none"
          />
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" aria-hidden="true" />
          {error}
        </div>
      )}

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <Info className="w-6 h-6 text-indigo-500 mt-1 flex-shrink-0" aria-hidden="true" />
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('sqltodynamodb.about_title', 'About SQL to DynamoDB')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('sqltodynamodb.about_text', 'This tool converts standard SQL CREATE TABLE DDL, INSERT INTO statements, and SELECT queries into Amazon DynamoDB CreateTable JSON definitions, AWS SDK v3 JavaScript/TypeScript code (@aws-sdk/lib-dynamodb), or PartiQL statements. All conversion processing is performed entirely in your browser.')}
          </p>
        </div>
      </div>
    </div>
  );
}
