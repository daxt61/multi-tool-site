import { useState, useEffect, useCallback } from 'react';
import { FileCode, Copy, Check, Trash2, AlertCircle, Download, FileSpreadsheet, Settings2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_LENGTH = 100000;

export function CSVToXML({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [csv, setCsv] = useState(initialData?.csv || '');
  const [rootElement, setRootElement] = useState(initialData?.rootElement || 'root');
  const [rowElement, setRowElement] = useState(initialData?.rowElement || 'row');
  const [delimiter, setDelimiter] = useState(initialData?.delimiter || ',');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ csv, rootElement, rowElement, delimiter });
  }, [csv, rootElement, rowElement, delimiter, onStateChange]);

  const parseCSVLine = (line: string, delim: string) => {
    const result = [];
    let curValue = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delim && !inQuotes) {
        result.push(curValue.trim());
        curValue = '';
      } else {
        curValue += char;
      }
    }
    result.push(curValue.trim());
    return result.map(v => {
      if (v.startsWith('"') && v.endsWith('"')) {
        return v.slice(1, -1).replace(/""/g, '"');
      }
      return v;
    });
  };

  const escapeXML = (val: string) => {
    return val
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };

  const sanitizeTag = (tag: string) => {
    return tag.replace(/[^a-zA-Z0-9_-]/g, '') || 'tag';
  };

  const convertToXML = useCallback(() => {
    if (!csv.trim()) {
      setOutput('');
      setError(null);
      return;
    }

    if (csv.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
      setOutput('');
      return;
    }

    try {
      const lines = csv.trim().split('\n');
      if (lines.length === 0) return;

      const headers = parseCSVLine(lines[0], delimiter).map(h => sanitizeTag(h) || 'item');
      const safeRoot = sanitizeTag(rootElement);
      const safeRow = sanitizeTag(rowElement);

      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<${safeRoot}>\n`;

      lines.slice(1).forEach((line: string) => {
        const values = parseCSVLine(line, delimiter);
        xml += `  <${safeRow}>\n`;
        headers.forEach((header, i) => {
          const val = values[i] || '';
          xml += `    <${header}>${escapeXML(val)}</${header}>\n`;
        });
        xml += `  </${safeRow}>\n`;
      });

      xml += `</${safeRoot}>`;
      setOutput(xml);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Error parsing CSV');
      setOutput('');
    }
  }, [csv, rootElement, rowElement, delimiter, t]);

  useEffect(() => {
    const timeout = setTimeout(convertToXML, 200);
    return () => clearTimeout(timeout);
  }, [convertToXML]);

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'data.xml';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex items-center gap-2 px-1">
              <Settings2 className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">XML Config</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Root Element</label>
                <input
                  type="text"
                  value={rootElement}
                  onChange={(e) => setRootElement(e.target.value)}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Row Element</label>
                <input
                  type="text"
                  value={rowElement}
                  onChange={(e) => setRowElement(e.target.value)}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">CSV Delimiter</label>
                <select
                  value={delimiter}
                  onChange={(e) => setDelimiter(e.target.value)}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-bold"
                >
                  <option value=",">Comma (,)</option>
                  <option value=";">Semicolon (;)</option>
                  <option value="	">Tab (\t)</option>
                  <option value="|">Pipe (|)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-indigo-500" />
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">CSV Data</label>
              </div>
              <button
                onClick={() => setCsv('')}
                disabled={!csv}
                className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl transition-all disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <textarea
              value={csv}
              onChange={(e) => setCsv(e.target.value)}
              placeholder="name,age,city&#10;John,30,New York&#10;Jane,25,London"
              className="w-full h-40 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm dark:text-slate-300 resize-none"
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-emerald-500" />
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">XML Result</label>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleDownload}
                  disabled={!output}
                  className="text-xs font-bold px-3 py-1 rounded-xl text-indigo-600 bg-indigo-50 dark:bg-indigo-900/10 hover:bg-indigo-100 transition-all flex items-center gap-1 disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" /> {t('common.download')}
                </button>
                <button
                  onClick={handleCopy}
                  disabled={!output}
                  className={`text-xs font-bold px-3 py-1 rounded-xl transition-all flex items-center gap-1 border ${
                    copied
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                      : 'text-slate-600 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  } disabled:opacity-50`}
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} {copied ? t('common.copied') : t('common.copy')}
                </button>
              </div>
            </div>
            <textarea
              value={output}
              readOnly
              placeholder="XML will appear here..."
              className="w-full h-64 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-mono text-sm leading-relaxed text-indigo-600 dark:text-indigo-400 resize-none shadow-inner"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}
    </div>
  );
}
