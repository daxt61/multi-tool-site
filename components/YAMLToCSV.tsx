import { useState, useEffect, useMemo } from 'react';
import { FileCode, FileSpreadsheet, Copy, Check, Trash2, AlertCircle, Download, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import yaml from 'js-yaml';

const MAX_LENGTH = 100000;

export function YAMLToCSV({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [yamlInput, setYamlInput] = useState(initialData?.yamlInput || '');
  const [csvOutput, setCsvOutput] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ yamlInput });
  }, [yamlInput, onStateChange]);

  const formatValue = (val: any) => {
    if (val === null || val === undefined) return '';
    let str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const convertYamlToCsv = (input: string) => {
    try {
      setError('');
      if (!input.trim()) return '';
      const obj = yaml.load(input);
      const array = Array.isArray(obj) ? obj : [obj];
      if (array.length === 0) return '';

      const headersSet = new Set<string>();
      array.forEach((row: any) => {
        if (typeof row === 'object' && row !== null) {
          Object.keys(row).forEach(key => headersSet.add(key));
        }
      });
      const headers = Array.from(headersSet);

      const csvRows = [
        headers.join(','),
        ...array.map(row => headers.map(header => formatValue(row[header])).join(','))
      ];
      return csvRows.join('\n');
    } catch (e: any) {
      setError(t('error.invalid_yaml', 'Invalid YAML') + ': ' + e.message);
      return '';
    }
  };

  useEffect(() => {
    if (yamlInput.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
      setCsvOutput('');
      return;
    }
    const result = convertYamlToCsv(yamlInput);
    setCsvOutput(result);
  }, [yamlInput]);

  const handleCopy = () => {
    if (!csvOutput) return;
    navigator.clipboard.writeText(csvOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setYamlInput('');
    setCsvOutput('');
    setError('');
  };

  const handleDownload = () => {
    if (!csvOutput) return;
    const blob = new Blob([csvOutput], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `converted-${Date.now()}.csv`;
    link.click();
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-indigo-500" />
              <label htmlFor="yaml-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">YAML</label>
            </div>
            <button
              onClick={handleClear}
              disabled={!yamlInput}
              className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50"
            >
              <Trash2 className="w-3 h-3" /> {t('common.clear')}
            </button>
          </div>
          <textarea
            id="yaml-input"
            value={yamlInput}
            onChange={(e) => setYamlInput(e.target.value)}
            placeholder=" - id: 1&#10;   name: Test"
            className="w-full h-[400px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-indigo-500" />
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">CSV</label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                disabled={!csvOutput}
                className="text-xs font-bold px-3 py-1 rounded-full text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 transition-all flex items-center gap-1 disabled:opacity-50"
              >
                <Download className="w-3 h-3" /> {t('common.download')}
              </button>
              <button
                onClick={handleCopy}
                disabled={!csvOutput}
                className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 border ${
                  copied
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                    : 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-transparent hover:bg-slate-200'
                } disabled:opacity-50`}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied ? t('common.copied') : t('common.copy')}
              </button>
            </div>
          </div>
          <textarea
            readOnly
            value={csvOutput}
            placeholder="id,name&#10;1,Test"
            className="w-full h-[400px] p-6 bg-slate-900 text-indigo-300 border border-slate-800 rounded-3xl font-mono text-sm leading-relaxed dark:text-indigo-400 resize-none outline-none"
          />
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <Info className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('yaml_csv.about_title', 'YAML to CSV Converter')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('yaml_csv.about_text', 'This tool converts YAML data into CSV format. If the YAML contains an array of objects, the keys will be used as headers. If it contains a single object, it will be treated as a single row. Nested structures are flattened to their string representation.')}
          </p>
        </div>
      </div>
    </div>
  );
}
