import { useState, useEffect } from 'react';
import { Database, FileJson, Copy, Check, Trash2, AlertCircle, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_LENGTH = 100000;

export function SQLToJSON({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [input, setInput] = useState(initialData?.input || '');
  const [output, setOutput] = useState(initialData?.output || '');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ input, output });
  }, [input, output, onStateChange]);

  const handleConvert = () => {
    try {
      if (!input.trim()) return;
      if (input.length > MAX_LENGTH) {
        setError(t('error.max_length_sql', { max: MAX_LENGTH.toLocaleString() }));
        return;
      }

      const results: any[] = [];
      const insertRegex = /INSERT\s+INTO\s+[`"\[]?(\w+)[`"\]]?\s*\((.*?)\)\s*VALUES\s*(.*?)(?:;|$)/gims;
      let match;

      while ((match = insertRegex.exec(input)) !== null) {
        const columns = match[2].split(',').map(c => c.trim().replace(/[`"\[\]]/g, ''));
        const valuesSection = match[3].trim();

        const rows: string[] = [];
        let currentLevel = 0;
        let start = 0;
        let inString = false;
        let quoteChar = '';

        for (let i = 0; i < valuesSection.length; i++) {
          const char = valuesSection[i];
          if ((char === "'" || char === '"') && (i === 0 || valuesSection[i-1] !== '\\')) {
            if (!inString) {
              inString = true;
              quoteChar = char;
            } else if (char === quoteChar) {
              inString = false;
            }
          }

          if (!inString) {
            if (char === '(') currentLevel++;
            if (char === ')') {
              currentLevel--;
              if (currentLevel === 0) {
                rows.push(valuesSection.substring(start, i + 1));
                let next = i + 1;
                while (next < valuesSection.length && (valuesSection[next] === ',' || /\s/.test(valuesSection[next]))) {
                  next++;
                }
                start = next;
                i = next - 1;
              }
            }
          }
        }

        for (const row of rows) {
          const valMatch = row.match(/^\s*\((.*)\)\s*$/ms);
          if (valMatch) {
            const rowValues: string[] = [];
            const rawVals = valMatch[1];
            let valStart = 0;
            let valInString = false;
            let valQuoteChar = '';

            for (let i = 0; i < rawVals.length; i++) {
              const char = rawVals[i];
               if ((char === "'" || char === '"') && (i === 0 || rawVals[i-1] !== '\\')) {
                if (!valInString) {
                  valInString = true;
                  valQuoteChar = char;
                } else if (char === valQuoteChar) {
                  valInString = false;
                }
              }

              if (!valInString && char === ',') {
                rowValues.push(rawVals.substring(valStart, i).trim());
                valStart = i + 1;
              }
            }
            rowValues.push(rawVals.substring(valStart).trim());

            const obj: any = {};
            columns.forEach((col, idx) => {
              let val = rowValues[idx];
              if (val === undefined) return;

              const trimmedVal = val.trim();
              if (trimmedVal.toLowerCase() === 'null') {
                obj[col] = null;
              } else if (trimmedVal.toLowerCase() === 'true') {
                obj[col] = true;
              } else if (trimmedVal.toLowerCase() === 'false') {
                obj[col] = false;
              } else if (!isNaN(Number(trimmedVal)) && trimmedVal !== '' && !trimmedVal.startsWith("'") && !trimmedVal.startsWith('"')) {
                obj[col] = Number(trimmedVal);
              } else if ((trimmedVal.startsWith("'") && trimmedVal.endsWith("'")) || (trimmedVal.startsWith('"') && trimmedVal.endsWith('"'))) {
                obj[col] = trimmedVal.substring(1, trimmedVal.length - 1).replace(/\\'/g, "'").replace(/\\"/g, '"');
              } else {
                obj[col] = trimmedVal;
              }
            });
            results.push(obj);
          }
        }
      }

      if (results.length === 0) {
        throw new Error(t('sqltojson.error_no_statements'));
      }

      setOutput(JSON.stringify(results, null, 2));
      setError('');
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    setError('');
  };

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.json';
    a.click();
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
              <Database className="w-4 h-4 text-indigo-500" />
              <label htmlFor="sql-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('sqltojson.input_label')}
              </label>
            </div>
            <button
              onClick={handleClear}
              className="text-xs font-bold px-3 py-1 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 transition-all flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" /> {t('common.clear')}
            </button>
          </div>
          <textarea
            id="sql-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('sqltojson.placeholder_input')}
            className="w-full h-[450px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileJson className="w-4 h-4 text-emerald-500" />
              <label htmlFor="json-output" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">{t('sqltojson.output_label')}</label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                disabled={!output}
                className="text-xs font-bold px-3 py-1 rounded-full text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 transition-all flex items-center gap-1 disabled:opacity-50"
              >
                <Download className="w-3 h-3" />
              </button>
              <button
                onClick={handleCopy}
                disabled={!output}
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
            id="json-output"
            value={output}
            readOnly
            placeholder={t('sqltojson.placeholder_output')}
            className="w-full h-[450px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-mono text-sm leading-relaxed text-indigo-600 dark:text-indigo-400 resize-none"
          />
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={handleConvert}
          className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2"
        >
          <FileJson className="w-5 h-5" /> {t('sqltojson.convert_btn')}
        </button>
      </div>
    </div>
  );
}
