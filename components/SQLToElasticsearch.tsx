import { useState, useEffect, useCallback, useRef } from 'react';
import { Database, Copy, Check, Trash2, AlertCircle, Download, Info, Sparkles, Terminal } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;

export function SQLToElasticsearch({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState(initialData?.input || '');
  const [output, setOutput] = useState(initialData?.output || '');
  const [outputMode, setOutputMode] = useState<'dsl' | 'curl'>(initialData?.outputMode || 'dsl');
  const [trackTotalHits, setTrackTotalHits] = useState<boolean>(initialData?.trackTotalHits !== false);
  const [esHost, setEsHost] = useState<string>(initialData?.esHost || 'http://localhost:9200');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ input, output, outputMode, trackTotalHits, esHost });
  }, [input, output, outputMode, trackTotalHits, esHost, onStateChange]);

  const PRESETS = {
    ecommerce: `-- E-Commerce Product Search
SELECT id, title, price, category, status
FROM products
WHERE category = 'Electronics' AND price <= 500 AND status = 'active'
ORDER BY price ASC
LIMIT 20;`,
    log_analytics: `-- Server Log Analytics Filter
SELECT timestamp, level, message, service
FROM server_logs
WHERE level IN ('ERROR', 'CRITICAL') AND message LIKE '%timeout%'
ORDER BY timestamp DESC
LIMIT 50;`,
    high_value: `-- High Value Active Users
SELECT user_id, email, total_spent
FROM users
WHERE total_spent >= 1000 AND status = 'active'
ORDER BY total_spent DESC
LIMIT 10;`
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

  const sanitizeKey = (key: string) => {
    const clean = key.trim().replace(/[`"[]/g, '');
    const lower = clean.toLowerCase();
    if (lower === '__proto__' || lower === 'constructor' || lower === 'prototype') {
      return `_${clean}`;
    }
    return clean;
  };

  const parseWhereCondition = (cond: string) => {
    const match = cond.match(/([^\s>=<!]+)\s*(=|!=|<>|>|<|>=|<=|LIKE|NOT\s+LIKE|IN|NOT\s+IN|IS\s+NULL|IS\s+NOT\s+NULL)\s*(.*)/i);
    if (!match) return null;

    const field = sanitizeKey(match[1]);
    const op = match[2].toUpperCase().replace(/\s+/g, ' ');
    const rawVal = match[3].trim();

    if (op === 'IS NULL') {
      return { boolType: 'must_not', clause: { exists: { field } } };
    }
    if (op === 'IS NOT NULL') {
      return { boolType: 'filter', clause: { exists: { field } } };
    }
    if (op === '=') {
      const val = parseValue(rawVal);
      return { boolType: 'filter', clause: { term: { [field]: val } } };
    }
    if (op === '!=' || op === '<>') {
      const val = parseValue(rawVal);
      return { boolType: 'must_not', clause: { term: { [field]: val } } };
    }
    if (op === '>' || op === '<' || op === '>=' || op === '<=') {
      const val = parseValue(rawVal);
      const rangeOp = op === '>' ? 'gt' : op === '<' ? 'lt' : op === '>=' ? 'gte' : 'lte';
      return { boolType: 'filter', clause: { range: { [field]: { [rangeOp]: val } } } };
    }
    if (op === 'IN') {
      const inVals = rawVal.replace(/^\(|\)$/g, '').split(',').map(v => parseValue(v));
      return { boolType: 'filter', clause: { terms: { [field]: inVals } } };
    }
    if (op === 'NOT IN') {
      const inVals = rawVal.replace(/^\(|\)$/g, '').split(',').map(v => parseValue(v));
      return { boolType: 'must_not', clause: { terms: { [field]: inVals } } };
    }
    if (op === 'LIKE' || op === 'NOT LIKE') {
      const val = String(parseValue(rawVal));
      let wildcard = val;
      if (!wildcard.includes('%') && !wildcard.includes('_')) {
        wildcard = `*${wildcard}*`;
      } else {
        wildcard = wildcard.replace(/%/g, '*').replace(/_/g, '?');
      }

      const isNot = op.includes('NOT');
      return {
        boolType: isNot ? 'must_not' : 'must',
        clause: { wildcard: { [field]: { value: wildcard, case_insensitive: true } } }
      };
    }

    return null;
  };

  const handleConvert = useCallback(() => {
    try {
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

      const cleanInput = input.trim().replace(/--.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');

      const selectRegex = /SELECT\s+([\s\S]+?)\s+FROM\s+([^\s;]+)(?:\s+WHERE\s+([\s\S]+?))?(?:\s+ORDER\s+BY\s+([\s\S]+?))?(?:\s+LIMIT\s+(\d+)(?:\s+OFFSET\s+(\d+))?)?\s*;?$/i;
      const match = cleanInput.match(selectRegex);

      if (!match) {
        setError(t('sqltoelasticsearch.error_unsupported', 'Please enter a valid SQL SELECT statement.'));
        setOutput('');
        return;
      }

      const rawFields = match[1].trim();
      const indexName = sanitizeKey(match[2]);
      const whereClause = match[3]?.trim();
      const orderByClause = match[4]?.trim();
      const limitVal = match[5]?.trim();
      const offsetVal = match[6]?.trim();

      const dslBody: any = Object.create(null);

      if (trackTotalHits) {
        dslBody.track_total_hits = true;
      }

      // 1. Pagination (from / size)
      if (limitVal) {
        dslBody.size = Number(limitVal);
      }
      if (offsetVal) {
        dslBody.from = Number(offsetVal);
      }

      // 2. Source Projection (_source)
      if (rawFields !== '*') {
        const fields = rawFields.split(',').map((f: string) => sanitizeKey(f)).filter(Boolean);
        if (fields.length > 0) {
          dslBody._source = fields;
        }
      }

      // 3. Query (bool query for WHERE)
      if (whereClause) {
        const boolQuery: any = Object.create(null);
        const filterClauses: any[] = [];
        const mustClauses: any[] = [];
        const mustNotClauses: any[] = [];

        // Split by AND while ignoring inside string quotes
        const conditions: string[] = [];
        let currentCond = '';
        let inQuotes = false;
        let quoteChar = '';

        for (let i = 0; i < whereClause.length; i++) {
          const char = whereClause[i];
          if ((char === "'" || char === '"') && whereClause[i - 1] !== '\\') {
            if (!inQuotes) {
              inQuotes = true;
              quoteChar = char;
            } else if (char === quoteChar) {
              inQuotes = false;
            }
          }

          if (!inQuotes && whereClause.substring(i, i + 5).toUpperCase() === ' AND ') {
            conditions.push(currentCond.trim());
            currentCond = '';
            i += 4;
          } else {
            currentCond += char;
          }
        }
        if (currentCond.trim()) conditions.push(currentCond.trim());

        conditions.forEach(cond => {
          const parsed = parseWhereCondition(cond);
          if (parsed) {
            if (parsed.boolType === 'filter') filterClauses.push(parsed.clause);
            else if (parsed.boolType === 'must') mustClauses.push(parsed.clause);
            else if (parsed.boolType === 'must_not') mustNotClauses.push(parsed.clause);
          }
        });

        if (filterClauses.length > 0) boolQuery.filter = filterClauses;
        if (mustClauses.length > 0) boolQuery.must = mustClauses;
        if (mustNotClauses.length > 0) boolQuery.must_not = mustNotClauses;

        if (Object.keys(boolQuery).length > 0) {
          dslBody.query = { bool: boolQuery };
        } else {
          dslBody.query = { match_all: {} };
        }
      } else {
        dslBody.query = { match_all: {} };
      }

      // 4. Sort (ORDER BY)
      if (orderByClause) {
        const sortItems = orderByClause.split(',').map((item: string) => {
          const parts = item.trim().split(/\s+/);
          const field = sanitizeKey(parts[0]);
          const dir = parts[1]?.toUpperCase() === 'DESC' ? 'desc' : 'asc';
          return { [field]: { order: dir } };
        });
        if (sortItems.length > 0) {
          dslBody.sort = sortItems;
        }
      }

      if (outputMode === 'curl') {
        const cleanHost = esHost.replace(/\/+$/, '');
        const jsonStr = JSON.stringify(dslBody, null, 2);
        const curlCmd = `curl -X POST "${cleanHost}/${indexName}/_search" \\\n  -H 'Content-Type: application/json' \\\n  -d '${jsonStr}'`;
        setOutput(curlCmd);
      } else {
        setOutput(JSON.stringify(dslBody, null, 2));
      }

      setError('');
    } catch (e: any) {
      setError(e.message || t('sqltoelasticsearch.error_parsing', 'Error parsing SQL statement.'));
      setOutput('');
    }
  }, [input, outputMode, trackTotalHits, esHost, t]);

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
    const ext = outputMode === 'curl' ? 'sh' : 'json';
    const blob = new Blob([output], { type: outputMode === 'curl' ? 'text/x-sh' : 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `elasticsearch-query.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(t('common.downloaded', 'Downloaded query!'));
  };

  const loadPreset = (key: keyof typeof PRESETS) => {
    setInput(PRESETS[key]);
    toast.success(t('sqltoelasticsearch.preset_loaded', 'Loaded SQL preset!'));
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
      {/* Presets Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" aria-hidden="true" />
          <span className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('sqltoelasticsearch.presets_title', 'Clickable Presets')}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => loadPreset('ecommerce')}
            className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 rounded-xl transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
          >
            {t('sqltoelasticsearch.preset_ecommerce', 'Product Search')}
          </button>
          <button
            onClick={() => loadPreset('log_analytics')}
            className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 rounded-xl transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
          >
            {t('sqltoelasticsearch.preset_log_analytics', 'Log Analytics')}
          </button>
          <button
            onClick={() => loadPreset('high_value')}
            className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 rounded-xl transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
          >
            {t('sqltoelasticsearch.preset_high_value', 'High Value Users')}
          </button>
        </div>
      </div>

      {/* Options Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="space-y-1.5">
          <label htmlFor="output-mode-select" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('sqltoelasticsearch.output_mode', 'Output Format')}
          </label>
          <select
            id="output-mode-select"
            value={outputMode}
            onChange={(e) => setOutputMode(e.target.value as 'dsl' | 'curl')}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="dsl">Elasticsearch Query DSL (JSON)</option>
            <option value="curl">cURL HTTP POST Command</option>
          </select>
        </div>

        {outputMode === 'curl' && (
          <div className="space-y-1.5 animate-in fade-in duration-200">
            <label htmlFor="es-host-input" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              {t('sqltoelasticsearch.es_host', 'Elasticsearch Host URL')}
            </label>
            <input
              id="es-host-input"
              type="text"
              value={esHost}
              onChange={(e) => setEsHost(e.target.value)}
              placeholder="http://localhost:9200"
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        )}

        <div className="flex items-center gap-3 pt-6">
          <input
            id="track-total-hits"
            type="checkbox"
            checked={trackTotalHits}
            onChange={(e) => setTrackTotalHits(e.target.checked)}
            className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
          />
          <label htmlFor="track-total-hits" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
            {t('sqltoelasticsearch.track_total_hits', 'Include "track_total_hits": true')}
          </label>
        </div>
      </div>

      {/* Editor Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-500" aria-hidden="true" />
              <label htmlFor="sql-elastic-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('sqltoelasticsearch.sql_input_label', 'SQL SELECT Query')}
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
            id="sql-elastic-input"
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('sqltoelasticsearch.placeholder_sql', 'Paste SQL SELECT query here...')}
            className="w-full h-[400px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-500" aria-hidden="true" />
              <label htmlFor="sql-elastic-output" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('sqltoelasticsearch.output_label', 'Elasticsearch Query Output')}
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
            id="sql-elastic-output"
            value={output}
            readOnly
            placeholder={t('sqltoelasticsearch.placeholder_output', 'Elasticsearch query DSL will appear here...')}
            className="w-full h-[400px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-mono text-sm leading-relaxed text-indigo-600 dark:text-indigo-400 resize-none"
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
          <h4 className="font-bold dark:text-white">{t('sqltoelasticsearch.about_title', 'About SQL to Elasticsearch Converter')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('sqltoelasticsearch.about_text', 'Convert standard SQL SELECT queries into Elasticsearch Query DSL JSON or cURL HTTP commands. The parser translates SQL clauses (SELECT source fields, FROM index, WHERE conditions with =, !=, >, <, IN, LIKE, ORDER BY sort, and LIMIT/OFFSET pagination) into bool queries (filter, must, must_not, range, terms, wildcard). All processing is client-side.')}
          </p>
        </div>
      </div>
    </div>
  );
}
