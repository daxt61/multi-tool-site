import { useState, useCallback, useEffect } from 'react';
import { FileSpreadsheet, Copy, Check, Trash2, ArrowRightLeft, Download, AlertCircle, Settings2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_LENGTH = 100000;

export function CSVMapper() {
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [sourceDelimiter, setSourceDelimiter] = useState(',');
  const [targetDelimiter, setTargetDelimiter] = useState(';');
  const [quoteAll, setQuoteAll] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const parseCSVLine = (line: string, delimiter: string) => {
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

  const formatValue = (val: string, delimiter: string, forceQuote: boolean) => {
    let str = String(val);
    const needsQuoting = forceQuote || str.includes(delimiter) || str.includes('"') || str.includes('\n');
    if (needsQuoting) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const convertCSV = useCallback(() => {
    if (!input.trim()) {
      setOutput('');
      setError(null);
      return;
    }

    if (input.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
      return;
    }

    try {
      const lines = input.split('\n').filter(line => line.trim() !== '');
      const converted = lines.map(line => {
        const cells = parseCSVLine(line, sourceDelimiter);
        return cells.map(cell => formatValue(cell, targetDelimiter, quoteAll)).join(targetDelimiter);
      }).join('\n');

      setOutput(converted);
      setError(null);
    } catch (e) {
      setError("Erreur lors de la conversion du CSV.");
    }
  }, [input, sourceDelimiter, targetDelimiter, quoteAll, t]);

  useEffect(() => {
    const timer = setTimeout(convertCSV, 150);
    return () => clearTimeout(timer);
  }, [convertCSV]);

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `converted-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const delimiters = [
    { label: 'Virgule (,)', value: ',' },
    { label: 'Point-virgule (;)', value: ';' },
    { label: 'Tabulation (\\t)', value: '\t' },
    { label: 'Pipe (|)', value: '|' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-indigo-500" />
              <label htmlFor="csv-input" className="text-xs font-black uppercase tracking-widest text-slate-400">{t('csvmapper.input_label')}</label>
            </div>
            <button
              onClick={() => setInput('')}
              className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 px-3 py-1.5 rounded-xl transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <textarea
            id="csv-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="col1,col2,col3\nval1,val2,val3"
            className="w-full h-64 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />

          <div className="flex justify-between items-center px-1 pt-4">
             <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-indigo-500" />
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{t('csvmapper.output_label')}</h3>
             </div>
             <div className="flex gap-2">
               <button
                 onClick={handleDownload}
                 disabled={!output}
                 className="text-xs font-bold px-3 py-1.5 rounded-full text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 transition-all flex items-center gap-1 disabled:opacity-50"
               >
                 <Download className="w-3 h-3" /> {t('common.download')}
               </button>
               <button
                 onClick={handleCopy}
                 disabled={!output}
                 className={`text-xs font-bold px-4 py-1.5 rounded-xl transition-all border flex items-center gap-2 ${
                   copied
                     ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                     : 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-slate-200 dark:border-slate-700 hover:border-indigo-500/50'
                 } disabled:opacity-50`}
               >
                 {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                 {copied ? t('common.copied') : t('common.copy')}
               </button>
             </div>
          </div>
          <textarea
            id="csv-output"
            value={output}
            readOnly
            placeholder={t('csvmapper.output_placeholder')}
            className="w-full h-64 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        {/* Sidebar Controls */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[2rem] space-y-8 shadow-sm">
            <div className="flex items-center gap-2 px-1">
              <Settings2 className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{t('common.options')}</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">{t('csvmapper.source_delimiter')}</label>
                <select
                  value={sourceDelimiter}
                  onChange={(e) => setSourceDelimiter(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-white appearance-none"
                >
                  {delimiters.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </div>

              <div className="flex justify-center py-2">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-full text-indigo-600">
                   <ArrowRightLeft className="w-5 h-5 rotate-90 lg:rotate-0" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">{t('csvmapper.target_delimiter')}</label>
                <select
                  value={targetDelimiter}
                  onChange={(e) => setTargetDelimiter(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-white appearance-none"
                >
                  {delimiters.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
               <button
                 onClick={() => setQuoteAll(!quoteAll)}
                 className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
                   quoteAll
                     ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                     : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500'
                 }`}
               >
                 <span className="text-xs font-bold">{t('csvmapper.quote_all')}</span>
                 <div className={`w-4 h-4 rounded border flex items-center justify-center ${quoteAll ? 'bg-white border-white' : 'border-slate-300'}`}>
                   {quoteAll && <Check className="w-3 h-3 text-indigo-600" />}
                 </div>
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
