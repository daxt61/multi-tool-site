import { useState, useEffect, useCallback, useRef } from 'react';
import { Calendar, Copy, Check, Trash2, SortAsc, SortDesc, Info, Download, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_LENGTH = 50000;

export function DateSorter({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState(initialData?.input || '');
  const [order, setOrder] = useState<'asc' | 'desc'>(initialData?.order || 'asc');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ input, order });
  }, [input, order, onStateChange]);

  const sortDates = useCallback(() => {
    if (!input.trim()) {
      setOutput('');
      setError(null);
      return;
    }

    const lines = input.split('\n').filter((line: string) => line.trim().length > 0);
    const parsedDates: { original: string; date: Date }[] = [];
    let hasInvalid = false;

    for (const line of lines) {
      const trimmed = line.trim();
      const timestamp = Date.parse(trimmed);

      if (isNaN(timestamp)) {
        // Fallback for some common European formats like DD/MM/YYYY
        const dmyMatch = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
        if (dmyMatch) {
          const day = parseInt(dmyMatch[1]);
          const month = parseInt(dmyMatch[2]) - 1;
          const year = parseInt(dmyMatch[3]);
          const d = new Date(year, month, day);
          if (d.getFullYear() === year && d.getMonth() === month && d.getDate() === day) {
            parsedDates.push({ original: trimmed, date: d });
            continue;
          }
        }
        hasInvalid = true;
      } else {
        parsedDates.push({ original: trimmed, date: new Date(timestamp) });
      }
    }

    if (hasInvalid) {
      setError(t('datesorter.error_invalid'));
      setOutput('');
      return;
    }

    setError(null);
    const sorted = [...parsedDates].sort((a, b) => {
      const diff = a.date.getTime() - b.date.getTime();
      return order === 'asc' ? diff : -diff;
    });

    setOutput(sorted.map(d => d.original).join('\n'));
  }, [input, order, t]);

  useEffect(() => {
    if (input.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
      setOutput('');
    } else {
      sortDates();
    }
  }, [input, order, sortDates, t]);

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setInput('');
    textareaRef.current?.focus();
  };

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sorted-dates-${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <label htmlFor="dates-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-500" /> {t('datesorter.input_label')}
          </label>
          <button
            onClick={handleClear}
            disabled={!input}
            className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
          >
            <Trash2 className="w-3 h-3" /> {t('common.clear')}
          </button>
        </div>
        <textarea
          id="dates-input"
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="2023-12-25&#10;01/01/2024&#10;March 15, 2022"
          className="w-full h-48 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-lg leading-relaxed dark:text-slate-300 resize-none font-mono"
        />
      </div>

      <div className="flex justify-center">
        <div className="inline-flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setOrder('asc')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
              order === 'asc'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-md'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            <SortAsc className="w-4 h-4" /> {t('datesorter.asc')}
          </button>
          <button
            onClick={() => setOrder('desc')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
              order === 'desc'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-md'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            <SortDesc className="w-4 h-4" /> {t('datesorter.desc')}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <label htmlFor="dates-output" className="text-xs font-black uppercase tracking-widest text-slate-400">{t('common.result')}</label>
          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              disabled={!output}
              className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
            >
              <Download className="w-3 h-3" /> {t('common.download')}
            </button>
            <button
              onClick={handleCopy}
              disabled={!output}
              className={`text-xs font-bold px-4 py-1.5 rounded-xl transition-all border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none flex items-center gap-2 ${
                copied
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                  : 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-slate-200 dark:border-slate-700 hover:border-indigo-500/50'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? t('common.copied') : t('common.copy')}
            </button>
          </div>
        </div>
        <div
          id="dates-output"
          className="w-full min-h-[160px] p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-lg leading-relaxed dark:text-white break-all whitespace-pre-wrap font-mono"
        >
          {output || <span className="text-slate-400 italic">{t('caseconverter.result_placeholder')}</span>}
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <Info className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('datesorter.about_title')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('datesorter.about_text')}
          </p>
        </div>
      </div>
    </div>
  );
}
