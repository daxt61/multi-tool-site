import { useState, useEffect, useCallback } from 'react';
import { FileSpreadsheet, Copy, Check, Trash2, ArrowRightLeft, Download, AlertCircle, Settings2, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_LENGTH = 100000;

export function TSVCSVConverter({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [csvInput, setCsvInput] = useState(initialData?.csvInput || '');
  const [tsvInput, setTsvInput] = useState(initialData?.tsvInput || '');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<'csv' | 'tsv' | null>(null);

  useEffect(() => {
    onStateChange?.({ csvInput, tsvInput });
  }, [csvInput, tsvInput, onStateChange]);

  const parseLine = (line: string, delimiter: string) => {
    const result = [];
    let startValueIndex = 0;
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') inQuotes = !inQuotes;
      if (line[i] === delimiter && !inQuotes) {
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

  const formatValue = (val: string, delimiter: string) => {
    if (val.includes(delimiter) || val.includes('"') || val.includes('\n')) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  };

  const csvToTsv = (csv: string) => {
    if (!csv.trim()) return '';
    const lines = csv.trim().split(/\r?\n/);
    return lines.map(line => {
      const fields = parseLine(line, ',');
      return fields.map(f => formatValue(f, '\t')).join('\t');
    }).join('\n');
  };

  const tsvToCsv = (tsv: string) => {
    if (!tsv.trim()) return '';
    const lines = tsv.trim().split(/\r?\n/);
    return lines.map(line => {
      const fields = parseLine(line, '\t');
      return fields.map(f => formatValue(f, ',')).join(',');
    }).join('\n');
  };

  const handleCsvChange = (val: string) => {
    setCsvInput(val);
    if (val.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
      return;
    }
    setError('');
    setTsvInput(csvToTsv(val));
  };

  const handleTsvChange = (val: string) => {
    setTsvInput(val);
    if (val.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
      return;
    }
    setError('');
    setCsvInput(tsvToCsv(val));
  };

  const copyToClipboard = (text: string, type: 'csv' | 'tsv') => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleClear = () => {
    setCsvInput('');
    setTsvInput('');
    setError('');
  };

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative">
        <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="bg-white dark:bg-slate-800 p-3 rounded-full shadow-xl border border-slate-200 dark:border-slate-800 text-indigo-500">
            <ArrowRightLeft className="w-6 h-6" />
          </div>
        </div>

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
                className="text-xs font-bold px-3 py-1 rounded-full text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 transition-all flex items-center gap-1 disabled:opacity-50"
              >
                <Download className="w-3 h-3" /> {t('common.download')}
              </button>
              <button
                onClick={() => copyToClipboard(csvInput, 'csv')}
                className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 border ${
                  copied === 'csv'
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                    : 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-transparent'
                }`}
              >
                {copied === 'csv' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied === 'csv' ? t('common.copied') : t('common.copy')}
              </button>
              <button
                onClick={handleClear}
                disabled={!csvInput && !tsvInput}
                className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50"
              >
                <Trash2 className="w-3 h-3" /> {t('common.clear')}
              </button>
            </div>
          </div>
          <textarea
            id="csv-input"
            value={csvInput}
            onChange={(e) => handleCsvChange(e.target.value)}
            placeholder="name,age,city&#10;John,30,New York"
            className="w-full h-[400px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none shadow-sm"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-indigo-500" />
              <label htmlFor="tsv-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">TSV</label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleDownload(tsvInput, 'data.tsv')}
                disabled={!tsvInput}
                className="text-xs font-bold px-3 py-1 rounded-full text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 transition-all flex items-center gap-1 disabled:opacity-50"
              >
                <Download className="w-3 h-3" /> {t('common.download')}
              </button>
              <button
                onClick={() => copyToClipboard(tsvInput, 'tsv')}
                className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 border ${
                  copied === 'tsv'
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                    : 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-transparent'
                }`}
              >
                {copied === 'tsv' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied === 'tsv' ? t('common.copied') : t('common.copy')}
              </button>
            </div>
          </div>
          <textarea
            id="tsv-input"
            value={tsvInput}
            onChange={(e) => handleTsvChange(e.target.value)}
            placeholder={'name\tage\tcity\nJohn\t30\tNew York'}
            className="w-full h-[400px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none shadow-sm"
          />
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <Info className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('tsv_csv.about_title', 'TSV to CSV Converter')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('tsv_csv.about_text', 'This tool provides a quick way to convert data between Tab-Separated Values (TSV) and Comma-Separated Values (CSV). It correctly handles fields containing delimiters or quotes by wrapping them in double quotes and escaping existing quotes.')}
          </p>
        </div>
      </div>
    </div>
  );
}
