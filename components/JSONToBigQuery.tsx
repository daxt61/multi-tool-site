import { useState, useEffect, useCallback, useRef } from 'react';
import { FileCode, Braces, Copy, Check, Trash2, AlertCircle, Download, Database } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_LENGTH = 100000;
const MAX_DEPTH = 20;

export function JSONToBigQuery({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [input, setInput] = useState(initialData?.input || '');
  const [output, setOutput] = useState(initialData?.output || '');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    onStateChange?.({ input, output });
  }, [input, output, onStateChange]);

  const inferBigQueryType = (val: any): string => {
    if (val === null || val === undefined) return 'STRING';
    if (typeof val === 'boolean') return 'BOOL';
    if (typeof val === 'number') {
      return Number.isInteger(val) ? 'INT64' : 'FLOAT64';
    }
    if (typeof val === 'string') {
      // Basic date/timestamp detection
      if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return 'DATE';
      if (/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(\.\d+)?Z?$/.test(val)) return 'TIMESTAMP';
      return 'STRING';
    }
    return 'STRING';
  };

  const generateSchema = (obj: any, depth = 0): any[] => {
    if (depth > MAX_DEPTH) return [];
    if (typeof obj !== 'object' || obj === null) return [];

    return Object.entries(obj).map(([key, value]) => {
      const field: any = {
        name: key,
        mode: 'NULLABLE'
      };

      if (Array.isArray(value)) {
        field.mode = 'REPEATED';
        const firstElem = value[0];
        if (typeof firstElem === 'object' && firstElem !== null) {
          field.type = 'RECORD';
          field.fields = generateSchema(firstElem, depth + 1);
        } else {
          field.type = inferBigQueryType(firstElem);
        }
      } else if (typeof value === 'object' && value !== null) {
        field.type = 'RECORD';
        field.fields = generateSchema(value, depth + 1);
      } else {
        field.type = inferBigQueryType(value);
      }

      return field;
    });
  };

  const handleConvert = useCallback(() => {
    try {
      if (!input.trim()) {
        setOutput('');
        setError('');
        return;
      }

      if (input.length > MAX_LENGTH) {
        setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
        return;
      }

      const parsed = JSON.parse(input);
      // Sample the first 5 elements for arrays to find all possible fields
      let sample = parsed;
      if (Array.isArray(parsed)) {
        if (parsed.length === 0) {
          setError(t('jsontosql.error_empty'));
          return;
        }
        // Merge top level keys for sample
        sample = parsed.slice(0, 5).reduce((acc, curr) => {
          if (typeof curr === 'object' && curr !== null) {
            return { ...acc, ...curr };
          }
          return acc;
        }, {});
      }

      const schema = generateSchema(sample);
      setOutput(JSON.stringify(schema, null, 2));
      setError('');
    } catch (e: any) {
      setError(t('error.invalid_json') + ': ' + e.message);
    }
  }, [input, t]);

  const handleClear = useCallback(() => {
    setInput('');
    setOutput('');
    setError('');
    textareaRef.current?.focus();
  }, []);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [output]);

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bq-schema-${Date.now()}.json`;
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Braces className="w-4 h-4 text-indigo-500" />
              <label htmlFor="json-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('jsontobigquery.input_label')}
              </label>
            </div>
            <div className="flex gap-2 items-center">
              <kbd className="hidden sm:inline-flex items-center justify-center px-1.5 py-0.5 border border-rose-200 dark:border-rose-800 rounded text-[10px] font-bold text-rose-400 bg-white dark:bg-slate-900">Esc</kbd>
              <button
                onClick={handleClear}
                disabled={!input && !output}
                className="text-xs font-bold px-3 py-1 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
              >
                <Trash2 className="w-3 h-3" /> {t('common.clear')}
              </button>
            </div>
          </div>
          <textarea
            id="json-input"
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='[{"id": 1, "name": "Test", "meta": {"created_at": "2023-01-01"}}]'
            className="w-full h-80 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
          <button
            onClick={handleConvert}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
          >
            <Database className="w-5 h-5" />
            {t('jsontobigquery.convert')}
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-emerald-500" />
              <label htmlFor="bq-output" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('jsontobigquery.output_label')}
              </label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                disabled={!output}
                className="text-xs font-bold px-3 py-1 rounded-full text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 transition-all flex items-center gap-1 disabled:opacity-50"
              >
                <Download className="w-3 h-3" /> {t('common.download')}
              </button>
              <button
                onClick={handleCopy}
                disabled={!output}
                className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                  copied
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                    : 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied ? t('common.copied') : t('common.copy')}
              </button>
            </div>
          </div>
          <textarea
            id="bq-output"
            value={output}
            readOnly
            placeholder={t('jsontobigquery.placeholder_output')}
            className="w-full h-[450px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-8 rounded-[2rem] flex items-start gap-6">
        <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0">
          <Database className="w-6 h-6" />
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white">{t('jsontobigquery.about_title')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('jsontobigquery.about_text')}
          </p>
          <ul className="text-sm text-slate-500 dark:text-slate-400 space-y-2 list-disc pl-5">
            <li>{t('jsontobigquery.list_item_1')}</li>
            <li>{t('jsontobigquery.list_item_2')}</li>
            <li>{t('jsontobigquery.list_item_3')}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
