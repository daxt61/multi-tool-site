import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FileSpreadsheet, Download, Trash2, AlertCircle, Info, Table, Columns, Copy, Check
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function JSONToExcel({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [jsonInput, setJsonInput] = useState(initialData?.jsonInput || '');
  const [delimiter, setDelimiter] = useState(initialData?.delimiter || ',');
  const [error, setError] = useState<string | null>(null);
  const [csvData, setCsvData] = useState<string | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ jsonInput, delimiter });
  }, [jsonInput, delimiter, onStateChange]);

  const flattenObject = (obj: any, prefix = '') => {
    return Object.keys(obj).reduce((acc: any, k) => {
      const pre = prefix.length ? prefix + '.' : '';
      const lowerKey = k.toLowerCase();
      // Sentinel: Sanitize dangerous keys to prevent Prototype Pollution
      const safeKey = (lowerKey === '__proto__' || lowerKey === 'constructor' || lowerKey === 'prototype') ? `_${k}` : k;

      if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
        Object.assign(acc, flattenObject(obj[k], pre + safeKey));
      } else {
        acc[pre + safeKey] = obj[k];
      }
      return acc;
    }, Object.create(null));
  };

  const convertToCSV = useCallback(() => {
    if (!jsonInput.trim()) {
      setCsvData(null);
      setPreview([]);
      setError(null);
      return;
    }

    try {
      const parsed = JSON.parse(jsonInput);
      const dataArray = Array.isArray(parsed) ? parsed : [parsed];

      if (dataArray.length === 0) {
        throw new Error('JSON array is empty');
      }

      const flattenedData = dataArray.map(item => flattenObject(item));
      const headers = Array.from(new Set(flattenedData.flatMap(item => Object.keys(item))));

      const rows = flattenedData.map(item =>
        headers.map(header => {
          const val = Object.prototype.hasOwnProperty.call(item, header) ? item[header] : undefined;
          if (val === null || val === undefined) return '';
          const str = String(val).replace(/"/g, '""');
          return str.includes(delimiter) || str.includes('\n') ? `"${str}"` : str;
        }).join(delimiter)
      );

      const csv = [headers.join(delimiter), ...rows].join('\n');
      setCsvData(csv);
      setPreview(flattenedData.slice(0, 5));
      setTotalCount(dataArray.length);
      setError(null);
    } catch (e: any) {
      setError(e.message || t('error.invalid_json'));
      setCsvData(null);
      setPreview([]);
    }
  }, [jsonInput, delimiter, t]);

  useEffect(() => {
    const timeout = setTimeout(convertToCSV, 300);
    return () => clearTimeout(timeout);
  }, [convertToCSV]);

  const handleDownload = () => {
    if (!csvData) return;
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `data-${Date.now()}.csv`);
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    if (csvData) {
      navigator.clipboard.writeText(csvData);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Area */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="json-input" className="text-xs font-black uppercase tracking-widest text-slate-400">{t('jsontoexcel.json_input')}</label>
            <button
              onClick={() => setJsonInput('')}
              className="text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" /> {t('common.clear')}
            </button>
          </div>
          <textarea
            id="json-input"
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder='[{"id": 1, "user": {"name": "John"}}, ...]'
            className="w-full h-[400px] p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2rem] font-mono text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none"
          />

          <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <Columns className="w-3 h-3 text-indigo-500" /> {t('jsontoexcel.settings')}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-600 dark:text-slate-400">{t('jsontoexcel.delimiter')}</span>
              <select
                value={delimiter}
                onChange={(e) => setDelimiter(e.target.value)}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 font-bold text-sm outline-none cursor-pointer"
              >
                <option value=",">{t('jsontoexcel.comma')} (,)</option>
                <option value=";">{t('jsontoexcel.semicolon')} (;)</option>
                <option value="\t">{t('jsontoexcel.tab')} (Tab)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Preview and Actions */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
              <Table className="w-4 h-4 text-indigo-500" /> {t('jsontoexcel.preview')}
            </div>
            <div className="flex gap-2">
              {csvData && (
                <>
                  <button
                    onClick={handleCopy}
                    className={`text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-2 border ${
                      copied
                        ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 border-emerald-200'
                        : 'bg-white dark:bg-slate-900 text-slate-600 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? t('common.copied') : t('common.copy')}
                  </button>
                  <button
                    onClick={handleDownload}
                    className="text-xs font-bold px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20"
                  >
                    <Download className="w-4 h-4" /> {t('common.download')}
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2rem] overflow-hidden min-h-[400px]">
            {preview.length > 0 ? (
              <div className="overflow-x-auto max-h-[500px]">
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      {Object.keys(preview[0]).map((header) => (
                        <th key={header} className="px-6 py-4 font-black text-indigo-500 uppercase tracking-tighter whitespace-nowrap">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {preview.map((row, i) => (
                      <tr key={i} className="hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-colors">
                        {Object.keys(preview[0]).map((header) => (
                          <td key={header} className="px-6 py-4 font-medium dark:text-slate-300 whitespace-nowrap max-w-[200px] truncate">
                            {String(row[header] ?? '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {csvData && preview.length < totalCount && (
                  <div className="p-4 text-center text-xs font-bold text-slate-400 bg-slate-100/50 dark:bg-slate-900/50 italic">
                    {t('jsontoexcel.preview_limit', { count: 5 })}
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-slate-400 space-y-4">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                  <FileSpreadsheet className="w-8 h-8 opacity-20" />
                </div>
                <p className="font-medium">{t('common.waiting')}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <Info className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('jsontoexcel.about_title')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('jsontoexcel.about_text')}
          </p>
        </div>
      </div>
    </div>
  );
}
