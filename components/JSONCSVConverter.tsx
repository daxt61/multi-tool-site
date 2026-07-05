import { useState, useEffect, useCallback, useRef } from 'react';
import { FileCode, FileSpreadsheet, Copy, Check, Trash2, AlertCircle, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;

export function JSONCSVConverter({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const jsonRef = useRef<HTMLTextAreaElement>(null);
  const [jsonInput, setJsonInput] = useState(initialData?.jsonInput || '');
  const [csvInput, setCsvInput] = useState(initialData?.csvInput || '');
  const [delimiter, setDelimiter] = useState(initialData?.delimiter || ',');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<'json' | 'csv' | null>(null);

  useEffect(() => {
    onStateChange?.({ jsonInput, csvInput, delimiter });
  }, [jsonInput, csvInput, delimiter, onStateChange]);

  const formatValue = (val: any, delim: string) => {
    if (val === null || val === undefined) return '';
    let str = String(val);
    if (str.includes(delim) || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const parseCSVLine = (line: string, delim: string) => {
    const result = [];
    let startValueIndex = 0;
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') inQuotes = !inQuotes;
      if (line[i] === delim && !inQuotes) {
        result.push(line.substring(startValueIndex, i));
        startValueIndex = i + 1;
      }
    }
    result.push(line.substring(startValueIndex));
    return result.map(v => {
      v = v.trim();
      if (v.startsWith('"') && v.endsWith('"')) {
        return v.substring(1, v.length - 1).replace(/""/g, '"');
      }
      return v;
    });
  };

  const jsonToCsv = (json: string, delim: string) => {
    try {
      setError('');
      if (!json.trim()) return '';
      const obj = JSON.parse(json);
      const array = Array.isArray(obj) ? obj : [obj];
      if (array.length === 0) return '';

      // Collect all unique headers from all objects
      const headersSet = new Set<string>();
      array.forEach((row: any) => {
        if (typeof row === 'object' && row !== null) {
          Object.keys(row).forEach(key => headersSet.add(key));
        }
      });
      const headers = Array.from(headersSet);

      const csvRows = [
        headers.join(delim),
        ...array.map(row => headers.map(header => {
          // Sentinel: Prevent inherited properties from leaking into the CSV
          const val = Object.prototype.hasOwnProperty.call(row, header) ? row[header] : undefined;
          return formatValue(val, delim);
        }).join(delim))
      ];
      return csvRows.join('\n');
    } catch (e) {
      setError(t('error.invalid_json'));
      return '';
    }
  };

  const csvToJson = (csv: string, delim: string) => {
    try {
      setError('');
      if (!csv.trim()) return '';
      const lines = csv.trim().split(/\r?\n/);
      if (lines.length < 2) return '';
      const headers = parseCSVLine(lines[0], delim).map(h => {
        const trimmed = h.trim();
        const lower = trimmed.toLowerCase();
        if (lower === '__proto__' || lower === 'constructor' || lower === 'prototype') {
          return `_${trimmed}`;
        }
        return trimmed;
      });
      const result = lines.slice(1).map(line => {
        const values = parseCSVLine(line, delim);
        return headers.reduce((obj, header, index) => {
          let val: any = values[index] ?? '';
          if (val === 'true') val = true;
          else if (val === 'false') val = false;
          else if (!isNaN(Number(val)) && val !== '') val = Number(val);
          obj[header] = val;
          return obj;
        }, Object.create(null));
      });
      return JSON.stringify(result, null, 2);
    } catch (e) {
      setError('CSV ' + t('error.invalid_json').toLowerCase());
      return '';
    }
  };

  const handleJsonChange = (val: string, delim: string = delimiter) => {
    setJsonInput(val);
    if (val.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
      return;
    }
    setError('');
    const csv = jsonToCsv(val, delim);
    if (csv) setCsvInput(csv);
  };

  const handleCsvChange = (val: string, delim: string = delimiter) => {
    setCsvInput(val);
    if (val.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
      return;
    }
    setError('');
    const json = csvToJson(val, delim);
    if (json) setJsonInput(json);
  };

  const handleClear = useCallback(() => {
    setJsonInput('');
    setCsvInput('');
    setError('');
    setTimeout(() => jsonRef.current?.focus(), 0);
  }, []);

  const handleCopy = useCallback((text: string, type: 'json' | 'csv') => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(type);
    toast.success(t('common.copied'));
    setTimeout(() => setCopied(null), 2000);
  }, [t]);

  const handlersRef = useRef({ handleClear, handleCopyJson: () => handleCopy(jsonInput, 'json'), handleCopyCsv: () => handleCopy(csvInput, 'csv') });
  useEffect(() => {
    handlersRef.current = { handleClear, handleCopyJson: () => handleCopy(jsonInput, 'json'), handleCopyCsv: () => handleCopy(csvInput, 'csv') };
  }, [handleClear, handleCopy, jsonInput, csvInput]);

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
        e.preventDefault();
        // Default copy the one that has content, prioritizes JSON
        if (jsonInput) handlersRef.current.handleCopyJson();
        else if (csvInput) handlersRef.current.handleCopyCsv();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [jsonInput, csvInput]);

  const handleDownload = (content: string, filename: string) => {
    if (!content) return;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
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

      <div className="flex flex-wrap gap-4 justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-4 rounded-3xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label htmlFor="delim-select" className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('csvmapper.input_delimiter')}</label>
            <select
              id="delim-select"
              value={delimiter}
              onChange={(e) => {
                const newDelim = e.target.value;
                setDelimiter(newDelim);
                if (jsonInput) handleJsonChange(jsonInput, newDelim);
                else if (csvInput) handleCsvChange(csvInput, newDelim);
              }}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 font-bold text-xs outline-none cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <option value=",">Comma (,)</option>
              <option value=";">Semicolon (;)</option>
              <option value="	">Tab (\t)</option>
              <option value="|">Pipe (|)</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2 items-center">
          <Kbd modifier={null} className="hidden sm:inline-flex border-rose-200 dark:border-rose-800 text-rose-400 dark:bg-slate-900">Esc</Kbd>
          <button
            onClick={handleClear}
            disabled={!jsonInput && !csvInput && !error}
            className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-4 py-2 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
          >
            <Trash2 className="w-3 h-3" /> {t('common.clear')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* JSON Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-indigo-500" />
              <label htmlFor="json-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">JSON</label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleDownload(jsonInput, 'data.json')}
                disabled={!jsonInput}
                className="text-xs font-bold px-3 py-1 rounded-full text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 transition-all flex items-center gap-1 disabled:opacity-50"
              >
                <Download className="w-3 h-3" /> {t('common.download')}
              </button>
              <button
                onClick={() => handleCopy(jsonInput, 'json')}
                disabled={!jsonInput}
                className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                  copied === 'json'
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                    : 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700'
                } disabled:opacity-50`}
                title={`${t('common.copy')} (C)`}
              >
                {copied === 'json' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied === 'json' ? t('common.copied') : t('common.copy')}
                {(!copied && jsonInput) && <Kbd modifier={null} className="hidden sm:inline-flex w-4 h-4 bg-white/50 dark:bg-black/20 ml-1">C</Kbd>}
              </button>
            </div>
          </div>
          <textarea
            id="json-input"
            ref={jsonRef}
            value={jsonInput}
            onChange={(e) => handleJsonChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                handleClear();
              }
            }}
            placeholder='[{"id": 1, "name": "Test"}]'
            className={`w-full h-[400px] p-6 bg-slate-50 dark:bg-slate-900 border ${jsonInput.length > MAX_LENGTH ? 'border-rose-500 ring-rose-500/20' : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-500/20'} rounded-3xl outline-none focus:ring-2 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none`}
          />
        </div>

        {/* CSV Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-indigo-500" />
              <label htmlFor="csv-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">CSV</label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleDownload(csvInput, 'data.csv')}
                disabled={!csvInput}
                className="text-xs font-bold px-3 py-1 rounded-full text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 transition-all flex items-center gap-1 disabled:opacity-50"
              >
                <Download className="w-3 h-3" /> {t('common.download')}
              </button>
              <button
                onClick={() => handleCopy(csvInput, 'csv')}
                disabled={!csvInput}
                className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                  copied === 'csv'
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                    : 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700'
                } disabled:opacity-50`}
                title={`${t('common.copy')} (C)`}
              >
                {copied === 'csv' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied === 'csv' ? t('common.copied') : t('common.copy')}
                {(!copied && !jsonInput && csvInput) && <Kbd modifier={null} className="hidden sm:inline-flex w-4 h-4 bg-white/50 dark:bg-black/20 ml-1">C</Kbd>}
              </button>
            </div>
          </div>
          <textarea
            id="csv-input"
            value={csvInput}
            onChange={(e) => handleCsvChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                handleClear();
              }
            }}
            placeholder='id,name\n1,Test'
            className={`w-full h-[400px] p-6 bg-slate-50 dark:bg-slate-900 border ${csvInput.length > MAX_LENGTH ? 'border-rose-500 ring-rose-500/20' : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-500/20'} rounded-3xl outline-none focus:ring-2 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none`}
          />
        </div>
      </div>
    </div>
  );
}
