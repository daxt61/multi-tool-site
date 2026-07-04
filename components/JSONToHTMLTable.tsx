import { useState, useEffect, useCallback, useRef } from 'react';
import { Table, Copy, Check, Trash2, FileCode, AlertCircle, Info, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_LENGTH = 100000;

export function JSONToHTMLTable({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [json, setJson] = useState(initialData?.json || '[\n  { "id": 1, "name": "John Doe", "email": "john@example.com" },\n  { "id": 2, "name": "Jane Smith", "email": "jane@example.com" }\n]');
  const [includeHeader, setIncludeHeader] = useState(initialData?.includeHeader ?? true);
  const [fullDocument, setFullDocument] = useState(initialData?.fullDocument ?? false);
  const [border, setBorder] = useState(initialData?.border ?? true);
  const [cellpadding, setCellpadding] = useState(initialData?.cellpadding ?? 5);
  const [cellspacing, setCellspacing] = useState(initialData?.cellspacing ?? 0);
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ json, includeHeader, fullDocument, border, cellpadding, cellspacing });
  }, [json, includeHeader, fullDocument, border, cellpadding, cellspacing]);

  const escapeHTML = (str: string) => {
    return str.replace(/[&<>"']/g, (m) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[m] || m));
  };

  const generateHTMLTable = useCallback(() => {
    if (!json.trim()) {
      setOutput('');
      setError(null);
      return;
    }

    if (json.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
      setOutput('');
      return;
    }

    try {
      const parsed = JSON.parse(json);
      const data = Array.isArray(parsed) ? parsed : [parsed];

      if (data.length === 0) {
        setOutput('');
        setError(null);
        return;
      }

      // Collect all keys for headers
      const keys = Array.from(new Set(data.flatMap(obj => typeof obj === 'object' && obj !== null ? Object.keys(obj) : [])));

      let tableHtml = `<table${border ? ' border="1"' : ''}${cellpadding > 0 ? ` cellpadding="${cellpadding}"` : ''}${cellspacing > 0 ? ` cellspacing="${cellspacing}"` : ''}>\n`;

      if (includeHeader && keys.length > 0) {
        tableHtml += '  <thead>\n    <tr>\n';
        keys.forEach(key => {
          tableHtml += `      <th>${escapeHTML(String(key))}</th>\n`;
        });
        tableHtml += '    </tr>\n  </thead>\n';
      }

      tableHtml += '  <tbody>\n';
      data.forEach(row => {
        tableHtml += '    <tr>\n';
        if (typeof row === 'object' && row !== null) {
          keys.forEach(key => {
            // Sentinel: Prevent inherited properties from leaking into the table
            const val = Object.prototype.hasOwnProperty.call(row, key) ? row[key] : undefined;
            tableHtml += `      <td>${val !== undefined && val !== null ? escapeHTML(String(val)) : ''}</td>\n`;
          });
        } else {
          tableHtml += `      <td colspan="${keys.length || 1}">${escapeHTML(String(row))}</td>\n`;
        }
        tableHtml += '    </tr>\n';
      });
      tableHtml += '  </tbody>\n</table>';

      if (fullDocument) {
        tableHtml = `<!DOCTYPE html>\n<html>\n<head>\n  <meta charset="UTF-8">\n  <title>JSON to HTML Table</title>\n</head>\n<body>\n${tableHtml}\n</body>\n</html>`;
      }

      setOutput(tableHtml);
      setError(null);
    } catch (e: any) {
      setError(t('error.invalid_json') + ': ' + e.message);
      setOutput('');
    }
  }, [json, includeHeader, fullDocument, border, cellpadding, cellspacing, t]);

  useEffect(() => {
    const timeout = setTimeout(generateHTMLTable, 300);
    return () => clearTimeout(timeout);
  }, [generateHTMLTable]);

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setJson('');
    setOutput('');
    setError(null);
    textareaRef.current?.focus();
  };

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'table.html';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="json-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <FileCode className="w-3 h-3" /> {t('common.input')} JSON
            </label>
            <button
              onClick={handleClear}
              className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all"
            >
              <Trash2 className="w-3 h-3" /> {t('common.clear')}
            </button>
          </div>
          <textarea
            id="json-input"
            ref={textareaRef}
            value={json}
            onChange={(e) => setJson(e.target.value)}
            placeholder='[{"name": "John", "age": 30}]'
            className="w-full h-[350px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm dark:text-slate-300 resize-none"
          />

          <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('common.options')}</h4>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={includeHeader}
                  onChange={(e) => setIncludeHeader(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm font-bold text-slate-600 dark:text-slate-400 group-hover:text-indigo-500 transition-colors">{t('json_html.header')}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={fullDocument}
                  onChange={(e) => setFullDocument(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm font-bold text-slate-600 dark:text-slate-400 group-hover:text-indigo-500 transition-colors">{t('json_html.full_html')}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={border}
                  onChange={(e) => setBorder(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm font-bold text-slate-600 dark:text-slate-400 group-hover:text-indigo-500 transition-colors">{t('json_html.border')}</span>
              </label>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2">
               <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">{t('json_html.padding')}</label>
                  <input
                    type="number"
                    value={cellpadding}
                    onChange={(e) => setCellpadding(Number(e.target.value))}
                    className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold"
                  />
               </div>
               <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">{t('json_html.spacing')}</label>
                  <input
                    type="number"
                    value={cellspacing}
                    onChange={(e) => setCellspacing(Number(e.target.value))}
                    className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold"
                  />
               </div>
            </div>
          </div>
        </div>

        {/* Output */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="html-output" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Table className="w-3 h-3" /> HTML Output
            </label>
            <div className="flex gap-2">
               <button
                onClick={handleDownload}
                disabled={!output}
                className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50"
              >
                <Download className="w-3 h-3" /> {t('common.download')}
              </button>
              <button
                onClick={handleCopy}
                disabled={!output}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 border ${
                  copied
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200'
                    : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-transparent hover:bg-slate-200'
                } disabled:opacity-50`}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied ? t('common.copied') : t('common.copy')}
              </button>
            </div>
          </div>
          <textarea
            id="html-output"
            readOnly
            value={output}
            placeholder="HTML code will appear here..."
            className="w-full h-[550px] p-6 bg-slate-900 text-indigo-300 rounded-3xl outline-none font-mono text-sm leading-relaxed resize-none border border-slate-800"
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
          <h4 className="font-bold dark:text-white">{t('json_html.about_title')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('json_html.about_text')}
          </p>
        </div>
      </div>
    </div>
  );
}
