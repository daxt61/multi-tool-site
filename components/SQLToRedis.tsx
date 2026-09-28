import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Database, FileCode, Copy, Check, Trash2, AlertCircle, Download, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

const MAX_LENGTH = 100000;

type RedisStructure = 'hash' | 'json' | 'string' | 'set';
type KeySeparator = ':' | '_' | '.' | '/';
type CommandCasing = 'UPPERCASE' | 'lowercase';

interface Preset {
  id: string;
  label: string;
  data: string;
  structure: RedisStructure;
}

const REDIS_PRESETS: Preset[] = [
  {
    id: 'ecommerce_hash',
    label: 'E-Commerce Catalog (HSET)',
    structure: 'hash',
    data: `CREATE TABLE products (
  product_id INT PRIMARY KEY,
  sku VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  stock_quantity INT DEFAULT 0,
  category VARCHAR(100)
);

INSERT INTO products (product_id, sku, title, price, stock_quantity, category)
VALUES (101, 'PROD-101', 'Wireless Noise-Canceling Headphones', 199.99, 45, 'Electronics');

SELECT title, price, stock_quantity FROM products WHERE product_id = 101;`
  },
  {
    id: 'user_sessions_json',
    label: 'User Sessions (JSON.SET)',
    structure: 'json',
    data: `CREATE TABLE user_sessions (
  user_id INT PRIMARY KEY,
  session_token VARCHAR(64) NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  is_authenticated BOOLEAN DEFAULT TRUE
);

INSERT INTO user_sessions (user_id, session_token, ip_address, user_agent, is_authenticated)
VALUES (42, 'sess_abc123xyz987', '192.168.1.100', 'Mozilla/5.0 Chrome/120.0', true);

SELECT * FROM user_sessions WHERE user_id = 42;`
  },
  {
    id: 'sql_crud_queries',
    label: 'SQL CRUD Queries',
    structure: 'hash',
    data: `INSERT INTO users (id, name, email, role) VALUES (1, 'Alice Smith', 'alice@example.com', 'admin');
SELECT name, email FROM users WHERE id = 1;
UPDATE users SET role = 'superadmin', status = 'active' WHERE id = 1;
DELETE FROM users WHERE id = 1;`
  },
  {
    id: 'cache_ttl_expiration',
    label: 'Caching & Key Expiration',
    structure: 'string',
    data: `INSERT INTO api_cache (cache_key, response_data, status_code)
VALUES ('weather_paris', '{"temp": 18.5, "condition": "Sunny"}', 200);

SELECT response_data FROM api_cache WHERE cache_key = 'weather_paris';`
  }
];

export function SQLToRedis({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [input, setInput] = useState<string>(initialData?.input || REDIS_PRESETS[0].data);
  const [output, setOutput] = useState<string>(initialData?.output || '');
  const [error, setError] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [activePreset, setActivePreset] = useState<string | null>('ecommerce_hash');

  const [structure, setStructure] = useState<RedisStructure>('hash');
  const [separator, setSeparator] = useState<KeySeparator>(':');
  const [casing, setCasing] = useState<CommandCasing>('UPPERCASE');
  const [ttlSeconds, setTtlSeconds] = useState<string>('');

  const primaryInputRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const formatCmd = useCallback((cmd: string): string => {
    return casing === 'UPPERCASE' ? cmd.toUpperCase() : cmd.toLowerCase();
  }, [casing]);

  const sanitizeStr = (val: string): string => {
    const trimmed = val.trim();
    if ((trimmed.startsWith("'") && trimmed.endsWith("'")) || (trimmed.startsWith('"') && trimmed.endsWith('"'))) {
      return trimmed.slice(1, -1);
    }
    return trimmed;
  };

  const parseSqlToRedis = useCallback((sql: string): string => {
    if (!sql.trim()) return '';

    const statements = sql
      .split(/;\s*$/m)
      .map(s => s.trim())
      .filter(Boolean);

    const redisCommands: string[] = [];

    for (const stmt of statements) {
      if (stmt.startsWith('--') || stmt.startsWith('#')) continue;

      // 1. CREATE TABLE
      if (/^CREATE\ TABLE\b/i.test(stmt)) {
        const tableMatch = stmt.match(/CREATE\ TABLE\s+(?:IF\ NOT\ EXISTS\s+)?\`?([a-zA-Z0-9_\.]+)\`?\s*\(([\s\S]*)\)/i);
        if (tableMatch) {
          const fullTableName = tableMatch[1].replace(/[\`\"\[\]]/g, '');
          const tableName = fullTableName.includes('.') ? fullTableName.split('.').pop()! : fullTableName;
          const body = tableMatch[2];

          const columnDefs: Array<{ name: string; type: string; isPk: boolean }> = [];
          const lines = body.split('\n').map(l => l.trim()).filter(Boolean);

          let pkCol = 'id';
          for (const line of lines) {
            if (/^PRIMARY\ KEY\b/i.test(line)) {
              const pkMatch = line.match(/PRIMARY\ KEY\s*\(([^)]+)\)/i);
              if (pkMatch) {
                pkCol = pkMatch[1].split(',')[0].trim().replace(/[\`\"\[\]]/g, '');
              }
              continue;
            }
            if (/^(FOREIGN\ KEY|UNIQUE|CONSTRAINT|CHECK|INDEX|KEY)\b/i.test(line)) continue;

            const colMatch = line.match(/^\`?([a-zA-Z0-9_]+)\`?\s+([a-zA-Z0-9_\(\)]+)/);
            if (colMatch) {
              const colName = colMatch[1];
              const colType = colMatch[2];
              const isInlinePk = /PRIMARY\ KEY/i.test(line);
              if (isInlinePk) pkCol = colName;
              columnDefs.push({ name: colName, type: colType, isPk: isInlinePk });
            }
          }

          redisCommands.push(`# Schema Mapping for table "${tableName}"`);
          redisCommands.push(`# Key pattern: ${tableName}${separator}<${pkCol}>`);

          if (structure === 'hash') {
            const hsetCmd = formatCmd('HSET');
            const sampleFields = columnDefs.map(c => `${c.name} "sample_${c.name}"`).join(' ');
            redisCommands.push(`${hsetCmd} ${tableName}${separator}1 ${sampleFields}`);
          } else if (structure === 'json') {
            const jsonSetCmd = formatCmd('JSON.SET');
            const sampleObj = Object.create(null);
            columnDefs.forEach(c => {
              sampleObj[c.name] = `sample_${c.name}`;
            });
            redisCommands.push(`${jsonSetCmd} ${tableName}${separator}1 $ '${JSON.stringify(sampleObj)}'`);
          } else if (structure === 'string') {
            const setCmd = formatCmd('SET');
            const sampleObj = Object.create(null);
            columnDefs.forEach(c => {
              sampleObj[c.name] = `sample_${c.name}`;
            });
            redisCommands.push(`${setCmd} ${tableName}${separator}1 '${JSON.stringify(sampleObj)}'`);
          } else if (structure === 'set') {
            const saddCmd = formatCmd('SADD');
            redisCommands.push(`${saddCmd} ${tableName}${separator}ids "1"`);
          }
          redisCommands.push('');
        }
        continue;
      }

      // 2. INSERT INTO
      if (/^INSERT\ INTO\b/i.test(stmt)) {
        const insertMatch = stmt.match(/INSERT\ INTO\s+\`?([a-zA-Z0-9_\.]+)\`?\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/i);
        if (insertMatch) {
          const rawTableName = insertMatch[1].replace(/[\`\"\[\]]/g, '');
          const tableName = rawTableName.includes('.') ? rawTableName.split('.').pop()! : rawTableName;
          const cols = insertMatch[2].split(',').map(c => c.trim().replace(/[\`\"\[\]]/g, ''));

          // Smart comma splitting for values
          const rawValsStr = insertMatch[3];
          const vals: string[] = [];
          let currentVal = '';
          let inQuotes = false;
          let quoteChar = '';

          for (let i = 0; i < rawValsStr.length; i++) {
            const ch = rawValsStr[i];
            if ((ch === "'" || ch === '"')) {
              if (!inQuotes) {
                inQuotes = true;
                quoteChar = ch;
              } else if (ch === quoteChar) {
                inQuotes = false;
              }
            }
            if (ch === ',' && !inQuotes) {
              vals.push(sanitizeStr(currentVal));
              currentVal = '';
            } else {
              currentVal += ch;
            }
          }
          if (currentVal.trim()) {
            vals.push(sanitizeStr(currentVal));
          }

          let idVal = vals[0] || '1';
          const pkIndex = cols.findIndex(c => /id|pk|key/i.test(c));
          if (pkIndex !== -1 && vals[pkIndex]) {
            idVal = vals[pkIndex];
          }

          const key = `${tableName}${separator}${idVal}`;

          if (structure === 'hash') {
            const hsetCmd = formatCmd('HSET');
            const fieldArgs = cols.map((col, idx) => {
              const val = vals[idx] !== undefined ? vals[idx] : '';
              return `${col} "${val}"`;
            }).join(' ');
            redisCommands.push(`${hsetCmd} ${key} ${fieldArgs}`);
          } else if (structure === 'json') {
            const jsonSetCmd = formatCmd('JSON.SET');
            const obj = Object.create(null);
            cols.forEach((col, idx) => {
              const rawV = vals[idx];
              let parsedV: any = rawV;
              if (rawV === 'true') parsedV = true;
              else if (rawV === 'false') parsedV = false;
              else if (rawV !== undefined && !isNaN(Number(rawV)) && rawV !== '') parsedV = Number(rawV);
              obj[col] = parsedV;
            });
            redisCommands.push(`${jsonSetCmd} ${key} $ '${JSON.stringify(obj)}'`);
          } else if (structure === 'string') {
            const setCmd = formatCmd('SET');
            const obj = Object.create(null);
            cols.forEach((col, idx) => {
              obj[col] = vals[idx];
            });
            redisCommands.push(`${setCmd} ${key} '${JSON.stringify(obj)}'`);
          } else if (structure === 'set') {
            const saddCmd = formatCmd('SADD');
            redisCommands.push(`${saddCmd} ${tableName}${separator}ids "${idVal}"`);
          }

          if (ttlSeconds && !isNaN(Number(ttlSeconds)) && Number(ttlSeconds) > 0) {
            const expireCmd = formatCmd('EXPIRE');
            redisCommands.push(`${expireCmd} ${key} ${ttlSeconds.trim()}`);
          }
        }
        continue;
      }

      // 3. SELECT
      if (/^SELECT\b/i.test(stmt)) {
        const selectMatch = stmt.match(/SELECT\s+(.+)\s+FROM\s+\`?([a-zA-Z0-9_\.]+)\`?(?:\s+WHERE\s+(.+))?/i);
        if (selectMatch) {
          const fieldsStr = selectMatch[1].trim();
          const rawTableName = selectMatch[2].replace(/[\`\"\[\]]/g, '');
          const tableName = rawTableName.includes('.') ? rawTableName.split('.').pop()! : rawTableName;
          const whereClause = selectMatch[3] ? selectMatch[3].trim() : '';

          let idVal = '1';
          if (whereClause) {
            const idMatch = whereClause.match(/(?:[a-zA-Z0-9_]+)\s*=\s*(?:'([^']+)'|"([^"]+)"|([0-9a-zA-Z_\-]+))/i);
            if (idMatch) {
              idVal = idMatch[1] || idMatch[2] || idMatch[3];
            }
          }

          const key = `${tableName}${separator}${idVal}`;

          if (fieldsStr === '*') {
            if (structure === 'hash') {
              const hgetallCmd = formatCmd('HGETALL');
              redisCommands.push(`${hgetallCmd} ${key}`);
            } else if (structure === 'json') {
              const jsonGetCmd = formatCmd('JSON.GET');
              redisCommands.push(`${jsonGetCmd} ${key}`);
            } else if (structure === 'string') {
              const getCmd = formatCmd('GET');
              redisCommands.push(`${getCmd} ${key}`);
            } else if (structure === 'set') {
              const smembersCmd = formatCmd('SMEMBERS');
              redisCommands.push(`${smembersCmd} ${tableName}${separator}ids`);
            }
          } else {
            const fields = fieldsStr.split(',').map(f => f.trim().replace(/[\`\"\[\]]/g, ''));
            if (structure === 'hash') {
              const hmgetCmd = formatCmd('HMGET');
              redisCommands.push(`${hmgetCmd} ${key} ${fields.join(' ')}`);
            } else if (structure === 'json') {
              const jsonGetCmd = formatCmd('JSON.GET');
              const jsonPaths = fields.map(f => `$.${f}`).join(' ');
              redisCommands.push(`${jsonGetCmd} ${key} ${jsonPaths}`);
            } else if (structure === 'string') {
              const getCmd = formatCmd('GET');
              redisCommands.push(`${getCmd} ${key}`);
            } else if (structure === 'set') {
              const sismemberCmd = formatCmd('SISMEMBER');
              redisCommands.push(`${sismemberCmd} ${tableName}${separator}ids "${idVal}"`);
            }
          }
        }
        continue;
      }

      // 4. UPDATE
      if (/^UPDATE\b/i.test(stmt)) {
        const updateMatch = stmt.match(/UPDATE\s+\`?([a-zA-Z0-9_\.]+)\`?\s+SET\s+(.+?)(?:\s+WHERE\s+(.+))?$/i);
        if (updateMatch) {
          const rawTableName = updateMatch[1].replace(/[\`\"\[\]]/g, '');
          const tableName = rawTableName.includes('.') ? rawTableName.split('.').pop()! : rawTableName;
          const setAssignments = updateMatch[2].split(',').map(s => s.trim());
          const whereClause = updateMatch[3] ? updateMatch[3].trim() : '';

          let idVal = '1';
          if (whereClause) {
            const idMatch = whereClause.match(/(?:[a-zA-Z0-9_]+)\s*=\s*(?:'([^']+)'|"([^"]+)"|([0-9a-zA-Z_\-]+))/i);
            if (idMatch) {
              idVal = idMatch[1] || idMatch[2] || idMatch[3];
            }
          }

          const key = `${tableName}${separator}${idVal}`;

          if (structure === 'hash') {
            const hsetCmd = formatCmd('HSET');
            const fieldArgs = setAssignments.map(assign => {
              const parts = assign.split('=').map(p => p.trim());
              const col = parts[0].replace(/[\`\"\[\]]/g, '');
              const val = sanitizeStr(parts[1] || '');
              return `${col} "${val}"`;
            }).join(' ');
            redisCommands.push(`${hsetCmd} ${key} ${fieldArgs}`);
          } else if (structure === 'json') {
            for (const assign of setAssignments) {
              const jsonSetCmd = formatCmd('JSON.SET');
              const parts = assign.split('=').map(p => p.trim());
              const col = parts[0].replace(/[\`\"\[\]]/g, '');
              const val = sanitizeStr(parts[1] || '');
              redisCommands.push(`${jsonSetCmd} ${key} $.${col} '"${val}"'`);
            }
          } else if (structure === 'string') {
            const setCmd = formatCmd('SET');
            redisCommands.push(`# Re-SET string payload for ${key}`);
            redisCommands.push(`${setCmd} ${key} '<updated_json_payload>'`);
          }

          if (ttlSeconds && !isNaN(Number(ttlSeconds)) && Number(ttlSeconds) > 0) {
            const expireCmd = formatCmd('EXPIRE');
            redisCommands.push(`${expireCmd} ${key} ${ttlSeconds.trim()}`);
          }
        }
        continue;
      }

      // 5. DELETE
      if (/^DELETE\b/i.test(stmt)) {
        const deleteMatch = stmt.match(/DELETE\s+FROM\s+\`?([a-zA-Z0-9_\.]+)\`?(?:\s+WHERE\s+(.+))?/i);
        if (deleteMatch) {
          const rawTableName = deleteMatch[1].replace(/[\`\"\[\]]/g, '');
          const tableName = rawTableName.includes('.') ? rawTableName.split('.').pop()! : rawTableName;
          const whereClause = deleteMatch[2] ? deleteMatch[2].trim() : '';

          let idVal = '1';
          if (whereClause) {
            const idMatch = whereClause.match(/(?:[a-zA-Z0-9_]+)\s*=\s*(?:'([^']+)'|"([^"]+)"|([0-9a-zA-Z_\-]+))/i);
            if (idMatch) {
              idVal = idMatch[1] || idMatch[2] || idMatch[3];
            }
          }

          const key = `${tableName}${separator}${idVal}`;
          if (structure === 'set') {
            const sremCmd = formatCmd('SREM');
            redisCommands.push(`${sremCmd} ${tableName}${separator}ids "${idVal}"`);
          } else {
            const delCmd = formatCmd('DEL');
            redisCommands.push(`${delCmd} ${key}`);
          }
        }
        continue;
      }
    }

    return redisCommands.join('\n');
  }, [separator, structure, formatCmd, ttlSeconds]);

  const handleConvert = useCallback(() => {
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

      const redisCode = parseSqlToRedis(input);
      if (!redisCode.trim()) {
        setError(t('sqltoredis.no_commands_found') || 'No recognizable SQL statements (CREATE, INSERT, SELECT, UPDATE, DELETE) found.');
        setOutput('');
        return;
      }

      setOutput(redisCode);
      setError('');
    } catch (e: any) {
      setError('SQL Parsing Error: ' + (e.message || e));
    }
  }, [input, parseSqlToRedis, t]);

  useEffect(() => {
    handleConvert();
  }, [handleConvert]);

  useEffect(() => {
    onStateChange?.({ input, output, structure, separator, casing, ttlSeconds });
  }, [input, output, structure, separator, casing, ttlSeconds, onStateChange]);

  const handleClear = useCallback(() => {
    setInput('');
    setOutput('');
    setError('');
    setActivePreset(null);
    toast.success(t('common.cleared', { defaultValue: 'Cleared' }));
    primaryInputRef.current?.focus();
  }, [t]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success(t('common.copied', { defaultValue: 'Copied to clipboard' }));
    setTimeout(() => setCopied(false), 2000);
  }, [output, t]);

  const handlersRef = useRef({ handleClear, handleCopy });
  useEffect(() => {
    handlersRef.current = { handleClear, handleCopy };
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!containerRef.current || !containerRef.current.contains(document.activeElement)) {
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        handlersRef.current.handleClear();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        const selectedText = window.getSelection()?.toString();
        if (!selectedText) {
          e.preventDefault();
          handlersRef.current.handleCopy();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleApplyPreset = (preset: Preset) => {
    setInput(preset.data);
    setStructure(preset.structure);
    setActivePreset(preset.id);
    toast.success(t('common.preset_applied', { name: preset.label, defaultValue: `Applied preset: ${preset.label}` }));
    primaryInputRef.current?.focus();
  };

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `redis-commands-${Date.now()}.redis`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(t('common.downloaded') || 'Downloaded file');
  };

  return (
    <div ref={containerRef} className="max-w-6xl mx-auto space-y-8">
      {/* Quick Start Presets */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2 mb-3 px-1">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {t('sqltoredis.presets_title') || 'Quick Start SQL Presets'}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {REDIS_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleApplyPreset(preset)}
              aria-pressed={activePreset === preset.id}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                activePreset === preset.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Configuration Controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label htmlFor="sql-redis-structure" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            {t('sqltoredis.structure_label') || 'Target Data Structure'}
          </label>
          <select
            id="sql-redis-structure"
            value={structure}
            onChange={(e) => setStructure(e.target.value as RedisStructure)}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="hash">Hashes (HSET / HGETALL / HMGET)</option>
            <option value="json">RedisJSON (JSON.SET / JSON.GET)</option>
            <option value="string">Strings / Key-Value (SET / GET)</option>
            <option value="set">Sets (SADD / SMEMBERS / SREM)</option>
          </select>
        </div>

        <div>
          <label htmlFor="sql-redis-separator" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            {t('sqltoredis.separator_label') || 'Key Separator'}
          </label>
          <select
            id="sql-redis-separator"
            value={separator}
            onChange={(e) => setSeparator(e.target.value as KeySeparator)}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value=":">Colon ( table:id )</option>
            <option value="_">Underscore ( table_id )</option>
            <option value=".">Dot ( table.id )</option>
            <option value="/">Slash ( table/id )</option>
          </select>
        </div>

        <div>
          <label htmlFor="sql-redis-casing" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            {t('sqltoredis.casing_label') || 'Command Casing'}
          </label>
          <select
            id="sql-redis-casing"
            value={casing}
            onChange={(e) => setCasing(e.target.value as CommandCasing)}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="UPPERCASE">UPPERCASE ( HSET, GET )</option>
            <option value="lowercase">lowercase ( hset, get )</option>
          </select>
        </div>

        <div>
          <label htmlFor="sql-redis-ttl" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            {t('sqltoredis.ttl_label') || 'Auto-EXPIRE TTL (Seconds)'}
          </label>
          <input
            id="sql-redis-ttl"
            type="number"
            value={ttlSeconds}
            onChange={(e) => setTtlSeconds(e.target.value)}
            placeholder="e.g. 3600 (Optional)"
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      {/* Editor & Output Pane */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-500" />
              <label htmlFor="sql-redis-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('sqltoredis.input_label') || 'SQL Statements Input'}
              </label>
            </div>
            <div className="flex gap-2 items-center">
              <kbd className="hidden sm:inline-flex items-center justify-center px-1.5 py-0.5 border border-rose-200 dark:border-rose-800 rounded text-[10px] font-bold text-rose-400 bg-white dark:bg-slate-900">
                Esc
              </kbd>
              <button
                onClick={handleClear}
                disabled={!input && !output}
                className="text-xs font-bold px-3 py-1 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
              >
                <Trash2 className="w-3 h-3" /> {t('common.clear') || 'Clear'}
              </button>
            </div>
          </div>
          <textarea
            id="sql-redis-input"
            ref={primaryInputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setActivePreset(null);
            }}
            placeholder="INSERT INTO users (id, name, email) VALUES (1, 'Alice', 'alice@example.com');"
            className="w-full h-96 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-emerald-500" />
              <label htmlFor="redis-output" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('sqltoredis.output_label') || 'Generated Redis Commands'}
              </label>
            </div>
            <div className="flex gap-2 items-center">
              <kbd className="hidden sm:inline-flex items-center justify-center px-1.5 py-0.5 border border-slate-200 dark:border-slate-800 rounded text-[10px] font-bold text-slate-400 bg-white dark:bg-slate-900">
                Ctrl+C
              </kbd>
              <button
                onClick={handleDownload}
                disabled={!output}
                className="text-xs font-bold px-3 py-1 rounded-full text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all flex items-center gap-1 disabled:opacity-50"
              >
                <Download className="w-3 h-3" /> {t('common.download') || 'Download'}
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
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}{' '}
                {copied ? t('common.copied') || 'Copied' : t('common.copy') || 'Copy'}
              </button>
            </div>
          </div>
          <textarea
            id="redis-output"
            value={output}
            readOnly
            placeholder={t('sqltoredis.placeholder_output') || 'Generated Redis CLI commands will appear here...'}
            className="w-full h-96 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>
      </div>

      {/* Educational / Documentation Footer */}
      <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-8 rounded-[2rem] flex items-start gap-6">
        <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0">
          <Database className="w-6 h-6" />
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white">{t('sqltoredis.about_title') || 'SQL to Redis Commands Generator'}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('sqltoredis.about_text') ||
              'Convert SQL CREATE TABLE, INSERT INTO, SELECT, UPDATE, and DELETE queries into ready-to-run Redis CLI commands.'}
          </p>
          <ul className="text-sm text-slate-500 dark:text-slate-400 space-y-2 list-disc pl-5">
            <li>{t('sqltoredis.list_item_1') || 'Supports Redis Hashes (HSET/HGETALL/HMGET), RedisJSON (JSON.SET/JSON.GET), Key-Value Strings (SET/GET), and Sets (SADD/SMEMBERS).'}</li>
            <li>{t('sqltoredis.list_item_2') || 'Configurable key delimiter patterns (table:id, table_id, table.id, table/id) and command casing.'}</li>
            <li>{t('sqltoredis.list_item_3') || 'Includes optional TTL EXPIRE command generation for caching scenarios.'}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
