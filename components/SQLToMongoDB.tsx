import { useState, useEffect, useCallback, useRef } from 'react';
import { Database, Copy, Check, Trash2, AlertCircle, Download, Info, Terminal } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;

export function SQLToMongoDB({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState(initialData?.input || '');
  const [output, setOutput] = useState(initialData?.output || '');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ input, output });
  }, [input, output, onStateChange]);

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

  const handleConvert = useCallback(() => {
    if (!input.trim()) {
      setOutput('');
      setError('');
      return;
    }

    if (input.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
      return;
    }

    try {
      const cleanInput = input.trim().replace(/--.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
      let result = '';

      const sanitizeKey = (key: string) => {
        const lower = key.toLowerCase();
        // Sentinel: Sanitize dangerous keys to prevent Prototype Pollution
        if (lower === '__proto__' || lower === 'constructor' || lower === 'prototype') {
          return `_${key}`;
        }
        return key;
      };

      // Handle INSERT INTO
      const insertRegex = /INSERT\s+INTO\s+([^\s(]+)\s*\(([^)]+)\)\s*VALUES\s*([\s\S]+);?/i;
      const insertMatch = cleanInput.match(insertRegex);

      if (insertMatch) {
        const collection = insertMatch[1].replace(/[`"[]/g, '');
        const columns = insertMatch[2].split(',').map((c: string) => c.trim().replace(/[`"[]/g, ''));
        let valuesBlock = insertMatch[3].trim();
        if (valuesBlock.endsWith(';')) valuesBlock = valuesBlock.slice(0, -1).trim();

        // Split values by (), but handle commas inside strings
        const rows: any[] = [];
        let currentRow = '';
        let insideString = false;
        let parenLevel = 0;

        const processRow = (rowStr: string) => {
          const m = rowStr.trim().match(/^\(([\s\S]+)\)$/);
          if (m) {
            const vals: any[] = [];
            let currentVal = '';
            let inStr = false;
            for (let i = 0; i < m[1].length; i++) {
              const char = m[1][i];
              if (char === "'" && m[1][i-1] !== '\\') inStr = !inStr;
              if (!inStr && char === ',') {
                vals.push(parseValue(currentVal));
                currentVal = '';
              } else {
                currentVal += char;
              }
            }
            vals.push(parseValue(currentVal));

            const obj: any = Object.create(null);
            columns.forEach((col: string, idx: number) => {
              obj[sanitizeKey(col)] = vals[idx];
            });
            rows.push(obj);
          }
        };

        for (let i = 0; i < valuesBlock.length; i++) {
          const char = valuesBlock[i];
          if (char === "'" && valuesBlock[i-1] !== '\\') insideString = !insideString;
          if (!insideString) {
            if (char === '(') parenLevel++;
            if (char === ')') parenLevel--;
          }

          if (!insideString && char === ',' && parenLevel === 0) {
            // End of a row
            processRow(currentRow);
            currentRow = '';
          } else {
            currentRow += char;
          }
        }
        processRow(currentRow);

        result = `db.${collection}.insertMany(${JSON.stringify(rows, null, 2)})`;
      } else {
        // Handle SELECT
        const selectRegex = /SELECT\s+([\s\S]+?)\s+FROM\s+([^\s;]+)(?:\s+WHERE\s+([\s\S]+?))?(?:\s+LIMIT\s+(\d+))?\s*;?$/i;
        const selectMatch = cleanInput.match(selectRegex);

        if (selectMatch) {
          const fields = selectMatch[1].trim();
          const collection = selectMatch[2].replace(/[`"[]/g, '');
          const where = selectMatch[3];
          const limit = selectMatch[4];

          let query = '{}';
          if (where) {
            const conditions = where.split(/\s+AND\s+/i);
            const queryObj: any = Object.create(null);
            conditions.forEach((cond: string) => {
              const partMatch = cond.match(/([^\s>=<!]+)\s*(=|!=|<>|>|<|>=|<=|LIKE|IN)\s*(.+)/i);
              if (partMatch) {
                const key = sanitizeKey(partMatch[1].trim().replace(/[`"[]/g, ''));
                const op = partMatch[2].toUpperCase();
                const val = parseValue(partMatch[3]);

                if (op === '=') queryObj[key] = val;
                else if (op === '!=' || op === '<>') queryObj[key] = { $ne: val };
                else if (op === '>') queryObj[key] = { $gt: val };
                else if (op === '<') queryObj[key] = { $lt: val };
                else if (op === '>=') queryObj[key] = { $gte: val };
                else if (op === '<=') queryObj[key] = { $lte: val };
                else if (op === 'IN') {
                   const inVals = partMatch[3].trim().replace(/^\(|\)$/g, '').split(',').map((v: string) => parseValue(v));
                   queryObj[key] = { $in: inVals };
                }
                else if (op === 'LIKE') {
                   const pattern = String(val).replace(/%/g, '.*').replace(/_/g, '.');
                   queryObj[key] = { $regex: `^${pattern}$`, $options: 'i' };
                }
              }
            });
            query = JSON.stringify(queryObj, null, 2);
          }

          let projection = '';
          if (fields !== '*') {
            const projObj: any = Object.create(null);
            fields.split(',').forEach((f: string) => projObj[sanitizeKey(f.trim().replace(/[`"[]/g, ''))] = 1);
            projection = `, ${JSON.stringify(projObj)}`;
          }

          result = `db.${collection}.find(${query}${projection})`;
          if (limit) result += `.limit(${limit})`;
        } else {
          throw new Error(t('sqltomongodb.error_unsupported', 'Unsupported SQL statement. Only simple INSERT INTO and SELECT are supported.'));
        }
      }

      setOutput(result);
      setError('');
    } catch (e: any) {
      setError(e.message);
      setOutput('');
    }
  }, [input, t]);

  const handleClear = useCallback(() => {
    setInput('');
    setOutput('');
    setError('');
    setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success(t('common.copied'));
    setTimeout(() => setCopied(false), 2000);
  }, [output, t]);

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `query.js`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        document.activeElement?.getAttribute('contenteditable') === 'true'
      ) {
        if (e.key === 'Escape') {
          e.preventDefault();
          handleClear();
        }
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        handleClear();
      } else if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handleCopy();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClear, handleCopy]);

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
            <label htmlFor="sql-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-500" /> SQL Input
            </label>
            <div className="flex gap-2 items-center">
               <Kbd modifier={null} className="hidden sm:inline-flex border-rose-200 dark:border-rose-800 text-rose-400">Esc</Kbd>
               <button
                onClick={handleClear}
                disabled={!input}
                className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-3 h-3" /> {t('common.clear')}
              </button>
            </div>
          </div>
          <textarea
            id="sql-input"
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={"INSERT INTO users (id, name) VALUES (1, 'John');\n\nSELECT * FROM users WHERE age > 18;"}
            className="w-full h-80 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="mongo-output" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-500" /> MongoDB Query
            </label>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                disabled={!output}
                className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" /> {t('common.download')}
              </button>
              <button
                onClick={handleCopy}
                disabled={!output}
                className={`text-xs font-bold px-4 py-1.5 rounded-xl transition-all flex items-center gap-2 border ${
                  copied
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                    : 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-slate-200 dark:border-slate-700 hover:border-indigo-500/50'
                } disabled:opacity-50`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? t('common.copied') : t('common.copy')}
              </button>
            </div>
          </div>
          <textarea
            id="mongo-output"
            value={output}
            readOnly
            placeholder="MongoDB shell command will appear here..."
            className="w-full h-80 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-mono text-sm leading-relaxed text-indigo-600 dark:text-indigo-400 resize-none"
          />
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={handleConvert}
          disabled={!input}
          className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
        >
          <Database className="w-5 h-5" /> Convert to MongoDB
        </button>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <Info className="w-6 h-6 text-indigo-500 mt-1 flex-shrink-0" />
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('sqltomongodb.about_title', 'About SQL to MongoDB')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('sqltomongodb.about_text', 'This tool converts standard SQL commands into MongoDB shell syntax. It currently supports INSERT INTO statements (converted to insertMany) and SELECT statements (converted to find, including WHERE conditions, projections, and LIMIT). All processing is done locally in your browser.')}
          </p>
        </div>
      </div>
    </div>
  );
}
