import React, { useState, useEffect, useCallback } from 'react';
import { FileSpreadsheet, FileCode, Download, Copy, Check, Trash2, Info, AlertCircle, ArrowLeftRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

const MAX_LENGTH = 100000;
const MAX_DEPTH = 20;

export function XmlCsvConverter({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [xmlInput, setXmlInput] = useState(initialData?.xmlInput || '');
  const [csvOutput, setCsvOutput] = useState(initialData?.csvOutput || '');
  const [delimiter, setOutputDelimiter] = useState(initialData?.delimiter || ',');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ xmlInput, csvOutput, delimiter });
  }, [xmlInput, csvOutput, delimiter, onStateChange]);

  const sanitizeKey = (key: string) => {
    const forbidden = ['__proto__', 'constructor', 'prototype'];
    return forbidden.includes(key.toLowerCase()) ? `_${key}` : key;
  };

  const flattenObject = useCallback((obj: any, prefix = '', depth = 0): Record<string, any> => {
    if (depth > MAX_DEPTH) return {};
    const result = Object.create(null);

    for (const key in obj) {
      if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
      const sanitizedKey = sanitizeKey(key);
      const newKey = prefix ? `${prefix}.${sanitizedKey}` : sanitizedKey;

      if (obj[key] !== null && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
        Object.assign(result, flattenObject(obj[key], newKey, depth + 1));
      } else {
        result[newKey] = obj[key];
      }
    }
    return result;
  }, []);

  const xmlToObj = (node: Node, depth = 0): any => {
    if (depth > MAX_DEPTH) return null;

    if (node.nodeType === Node.TEXT_NODE) {
      return node.nodeValue?.trim() || null;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return null;

    const obj = Object.create(null);
    const element = node as Element;

    // Attributes
    if (element.attributes.length > 0) {
      for (let i = 0; i < element.attributes.length; i++) {
        const attr = element.attributes[i];
        obj[`@${sanitizeKey(attr.name)}`] = attr.value;
      }
    }

    // Children
    const children = element.childNodes;
    if (children.length > 0) {
      let hasElementChild = false;
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (child.nodeType === Node.ELEMENT_NODE) {
          hasElementChild = true;
          const name = sanitizeKey((child as Element).tagName);
          const value = xmlToObj(child, depth + 1);

          if (value === null) continue;

          if (obj[name] === undefined) {
            obj[name] = value;
          } else {
            if (!Array.isArray(obj[name])) {
              obj[name] = [obj[name]];
            }
            obj[name].push(value);
          }
        }
      }

      if (!hasElementChild && element.textContent) {
        const text = element.textContent.trim();
        if (text) {
          if (element.attributes.length > 0) {
             obj['#text'] = text;
          } else {
             return text;
          }
        }
      }
    }

    return Object.keys(obj).length === 0 ? null : obj;
  };

  const convertToCsv = useCallback(() => {
    if (!xmlInput.trim()) {
      setCsvOutput('');
      setError(null);
      return;
    }

    if (xmlInput.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
      return;
    }

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(xmlInput, 'text/xml');
      if (doc.querySelector('parsererror')) {
        throw new Error('XML parsing error');
      }

      const root = doc.documentElement;
      const data = xmlToObj(root);

      if (!data) {
        setCsvOutput('');
        return;
      }

      // Try to find an array to iterate over (rows)
      let rows: any[] = [];
      if (Array.isArray(data)) {
        rows = data;
      } else {
        // If the root has one child that is an array, use that (e.g., <users><user>...</user></users>)
        const keys = Object.keys(data);
        const arrayKey = keys.find(k => Array.isArray(data[k]));
        if (arrayKey) {
          rows = data[arrayKey];
        } else {
          rows = [data];
        }
      }

      const flattenedRows = rows.map(row => (typeof row === 'object' ? flattenObject(row) : { value: row }));

      // Get unique headers
      const headers = Array.from(new Set(flattenedRows.flatMap(row => Object.keys(row))));

      if (headers.length === 0) {
        setCsvOutput('');
        return;
      }

      const csvRows = [
        headers.join(delimiter),
        ...flattenedRows.map(row =>
          headers.map(header => {
            const val = Object.prototype.hasOwnProperty.call(row, header) ? row[header] : '';
            const str = (val === null || val === undefined ? '' : String(val)).replace(/"/g, '""');
            return str.includes(delimiter) || str.includes('\n') || str.includes('"') ? `"${str}"` : str;
          }).join(delimiter)
        )
      ];

      setCsvOutput(csvRows.join('\n'));
      setError(null);
    } catch (e) {
      setError(t('error.invalid_xml', 'Invalid XML format'));
    }
  }, [xmlInput, delimiter, flattenObject, t]);

  useEffect(() => {
    const timer = setTimeout(convertToCsv, 300);
    return () => clearTimeout(timer);
  }, [convertToCsv]);

  const handleCopy = () => {
    if (!csvOutput) return;
    navigator.clipboard.writeText(csvOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success(t('common.copied'));
  };

  const handleDownload = () => {
    if (!csvOutput) return;
    const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `converted-${Date.now()}.csv`);
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* XML Input */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="xml-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <FileCode className="w-4 h-4 text-indigo-500" /> XML
            </label>
            <button
              onClick={() => setXmlInput('')}
              className="text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 px-2 py-1 rounded-lg transition-all"
            >
              {t('common.clear')}
            </button>
          </div>
          <textarea
            id="xml-input"
            value={xmlInput}
            onChange={(e) => setXmlInput(e.target.value)}
            placeholder='<users><user><id>1</id><name>John</name></user></users>'
            spellCheck={false}
            className="w-full h-96 p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm resize-none dark:text-slate-300"
          />
        </div>

        {/* CSV Output */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="csv-output" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" /> CSV
            </label>
            <div className="flex gap-2">
              <select
                value={delimiter}
                onChange={(e) => setOutputDelimiter(e.target.value)}
                className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 border-none rounded-lg px-2 outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value=",">Comma (,)</option>
                <option value=";">Semicolon (;)</option>
                <option value="	">Tab (\t)</option>
              </select>
              <button
                onClick={handleCopy}
                disabled={!csvOutput}
                className="p-2 text-slate-400 hover:text-indigo-500 transition-colors disabled:opacity-30"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
              <button
                onClick={handleDownload}
                disabled={!csvOutput}
                className="p-2 text-slate-400 hover:text-emerald-500 transition-colors disabled:opacity-30"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
          <textarea
            id="csv-output"
            value={csvOutput}
            readOnly
            placeholder="CSV result will appear here..."
            className="w-full h-96 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none font-mono text-sm resize-none dark:text-slate-300"
          />
        </div>
      </div>

      {/* Footer Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <ArrowLeftRight className="w-4 h-4 text-indigo-500" /> {t('common.options')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Convert XML data structures into flat CSV tables. The tool automatically identifies repeating elements to treat them as rows. Nested objects are flattened using dot notation.
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" /> Technical Details
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Supports XML attributes (prefixed with @), text nodes (labeled #text if attributes exist), and multi-level nesting up to 20 levels deep.
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Check className="w-4 h-4 text-indigo-500" /> {t('common.privacy')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Processing is done entirely in your browser using the standard DOMParser. Your data is never transmitted to any external server.
          </p>
        </div>
      </div>
    </div>
  );
}
