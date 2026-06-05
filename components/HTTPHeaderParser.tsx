import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Copy, Check, Trash2, Info, FileSearch, Code, LayoutGrid, List } from 'lucide-react';

interface Header {
  key: string;
  value: string;
}

export function HTTPHeaderParser({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [rawHeaders, setRawHeaders] = useState<string>(initialData?.rawHeaders || '');
  const [viewMode, setViewMode] = useState<'table' | 'json'>(initialData?.viewMode || 'table');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ rawHeaders, viewMode });
  }, [rawHeaders, viewMode, onStateChange]);

  const parsedHeaders = useMemo(() => {
    if (!rawHeaders.trim()) return [];

    // Sentinel: Limit parsing size to prevent DoS
    const lines = rawHeaders.split(/\r?\n/).slice(0, 200);
    const result: Header[] = [];

    lines.forEach(line => {
      const match = line.match(/^([^: ]+):\s*(.*)$/);
      if (match) {
        result.push({
          key: match[1],
          value: match[2].trim()
        });
      } else if (line.startsWith('HTTP/') || /^(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS|CONNECT|TRACE)/.test(line)) {
        // Special case for status line or request line
        result.push({
          key: 'Start Line',
          value: line.trim()
        });
      }
    });

    return result;
  }, [rawHeaders]);

  const jsonOutput = useMemo(() => {
    const obj: Record<string, string> = {};
    parsedHeaders.forEach(h => {
      obj[h.key] = h.value;
    });
    return JSON.stringify(obj, null, 2);
  }, [parsedHeaders]);

  const handleCopy = () => {
    const text = viewMode === 'table'
      ? parsedHeaders.map(h => `${h.key}: ${h.value}`).join('\n')
      : jsonOutput;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setRawHeaders('');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="raw-headers" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Code className="w-3 h-3" /> {t('headerparser.input_label')}
            </label>
            <button
              onClick={handleClear}
              disabled={!rawHeaders}
              className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50"
            >
              <Trash2 className="w-3 h-3" /> {t('common.clear')}
            </button>
          </div>
          <textarea
            id="raw-headers"
            value={rawHeaders}
            onChange={(e) => setRawHeaders(e.target.value)}
            placeholder={t('headerparser.placeholder')}
            className="w-full h-[400px] p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl font-mono text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white resize-none"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
                  viewMode === 'table' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <List className="w-3 h-3" /> {t('headerparser.view_table')}
              </button>
              <button
                onClick={() => setViewMode('json')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
                  viewMode === 'json' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <LayoutGrid className="w-3 h-3" /> {t('headerparser.view_json')}
              </button>
            </div>
            <button
              onClick={handleCopy}
              disabled={parsedHeaders.length === 0}
              className={`text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
                copied ? 'bg-emerald-500 text-white shadow-lg' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-indigo-500 disabled:opacity-50'
              }`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? t('common.copied') : t('common.copy')}
            </button>
          </div>

          <div className="h-[400px] bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-[2rem] overflow-hidden">
            {parsedHeaders.length > 0 ? (
              <div className="h-full overflow-auto no-scrollbar">
                {viewMode === 'table' ? (
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-slate-50 dark:bg-slate-900 z-10">
                      <tr className="border-b border-slate-200 dark:border-slate-800">
                        <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400 w-1/3">{t('headerparser.header_name')}</th>
                        <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400">{t('headerparser.header_value')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedHeaders.map((header, i) => (
                        <tr key={i} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-colors">
                          <td className="p-4 font-bold text-xs text-indigo-600 dark:text-indigo-400 break-all">{header.key}</td>
                          <td className="p-4 font-mono text-xs text-slate-600 dark:text-slate-300 break-all">{header.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <pre className="p-6 font-mono text-xs text-indigo-600 dark:text-indigo-300 whitespace-pre-wrap">
                    {jsonOutput}
                  </pre>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                <FileSearch className="w-12 h-12 opacity-20" />
                <p className="text-sm font-medium">{t('common.waiting')}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-100 dark:border-slate-800">
        <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-4">
          <h3 className="font-black flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <Info className="w-5 h-5" /> {t('headerparser.about_title')}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('headerparser.about_text')}
          </p>
        </div>
        <div className="bg-indigo-50/50 dark:bg-indigo-900/10 p-8 rounded-[2rem] border border-indigo-100 dark:border-indigo-900/20 space-y-4">
          <h3 className="font-black flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <Search className="w-5 h-5" /> {t('headerparser.how_to_use_title')}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed italic">
            {t('headerparser.how_to_use_text')}
          </p>
        </div>
      </div>
    </div>
  );
}
