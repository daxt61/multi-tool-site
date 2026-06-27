import { useState, useEffect } from 'react';
import { FileCode, FileSpreadsheet, Copy, Check, Trash2, AlertCircle, Download, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import yaml from 'js-yaml';

const MAX_LENGTH = 100000;

export function CSVToYAML({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [csvInput, setCsvInput] = useState(initialData?.csvInput || '');
  const [yamlOutput, setYamlOutput] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ csvInput });
  }, [csvInput, onStateChange]);

  const parseCSVLine = (line: string) => {
    const result = [];
    let startValueIndex = 0;
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') inQuotes = !inQuotes;
      if (line[i] === ',' && !inQuotes) {
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

  const convertCsvToYaml = (csv: string) => {
    try {
      setError('');
      if (!csv.trim()) return '';
      const lines = csv.trim().split('\n');
      if (lines.length < 2) return '';

      const headers = parseCSVLine(lines[0]).map(h => {
        const trimmed = h.trim();
        const lower = trimmed.toLowerCase();
        // Sentinel: Sanitize dangerous keys to prevent Prototype Pollution
        if (lower === '__proto__' || lower === 'constructor' || lower === 'prototype') {
          return `_${trimmed}`;
        }
        return trimmed;
      });
      const result = lines.slice(1).map(line => {
        const values = parseCSVLine(line);
        return headers.reduce((obj, header, index) => {
          let val: any = values[index] ?? '';
          if (val === 'true') val = true;
          else if (val === 'false') val = false;
          else if (!isNaN(Number(val)) && val !== '') val = Number(val);
          obj[header] = val;
          return obj;
        }, Object.create(null));
      });

      return yaml.dump(result);
    } catch (e: any) {
      setError(t('error.invalid_csv', 'Invalid CSV') + ': ' + e.message);
      return '';
    }
  };

  useEffect(() => {
    if (csvInput.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
      setYamlOutput('');
      return;
    }
    const result = convertCsvToYaml(csvInput);
    setYamlOutput(result);
  }, [csvInput]);

  const handleCopy = () => {
    if (!yamlOutput) return;
    navigator.clipboard.writeText(yamlOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setCsvInput('');
    setYamlOutput('');
    setError('');
  };

  const handleDownload = () => {
    if (!yamlOutput) return;
    const blob = new Blob([yamlOutput], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `converted-${Date.now()}.yaml`;
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
              <FileSpreadsheet className="w-4 h-4 text-indigo-500" />
              <label htmlFor="csv-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">CSV</label>
            </div>
            <button
              onClick={handleClear}
              disabled={!csvInput}
              className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50"
            >
              <Trash2 className="w-3 h-3" /> {t('common.clear')}
            </button>
          </div>
          <textarea
            id="csv-input"
            value={csvInput}
            onChange={(e) => setCsvInput(e.target.value)}
            placeholder="id,name&#10;1,Test"
            className="w-full h-[400px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-indigo-500" />
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">YAML</label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                disabled={!yamlOutput}
                className="text-xs font-bold px-3 py-1 rounded-full text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 transition-all flex items-center gap-1 disabled:opacity-50"
              >
                <Download className="w-3 h-3" /> {t('common.download')}
              </button>
              <button
                onClick={handleCopy}
                disabled={!yamlOutput}
                className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                  copied
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                    : 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700'
                } disabled:opacity-50`}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied ? t('common.copied') : t('common.copy')}
              </button>
            </div>
          </div>
          <textarea
            readOnly
            value={yamlOutput}
            placeholder="- id: 1&#10;  name: Test"
            className="w-full h-[400px] p-6 bg-slate-900 text-indigo-300 border border-slate-800 rounded-3xl font-mono text-sm leading-relaxed dark:text-indigo-400 resize-none outline-none"
          />
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <Info className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('csv_yaml.about_title', 'CSV to YAML Converter')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('csv_yaml.about_text', 'This tool converts CSV data into a YAML array of objects. The first row of the CSV is used as keys for each object. Numerical and boolean values are automatically detected and converted.')}
          </p>
        </div>
      </div>
    </div>
  );
}
