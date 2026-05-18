import { useState, useEffect } from 'react';
import { Hash, Copy, Check, Trash2, Download, AlertCircle, List, SortAsc, SortDesc, ListChecks } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_LENGTH = 100000;

export function NumberExtractor({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [text, setText] = useState(initialData?.text || '');
  const [numbers, setNumbers] = useState<string[]>([]);
  const [uniqueOnly, setUniqueOnly] = useState(initialData?.uniqueOnly ?? false);
  const [sortOrder, setSortOrder] = useState<'none' | 'asc' | 'desc'>(initialData?.sortOrder || 'none');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onStateChange?.({ text, uniqueOnly, sortOrder });
    extractNumbers(text, uniqueOnly, sortOrder);
  }, [text, uniqueOnly, sortOrder]);

  const extractNumbers = (val: string, unique: boolean, sort: 'none' | 'asc' | 'desc') => {
    if (!val.trim()) {
      setNumbers([]);
      return;
    }
    if (val.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
      return;
    }
    setError(null);

    // Regex for integers and decimals (handles negative numbers)
    const numRegex = /-?\d+(?:\.\d+)?/g;
    const matches = val.match(numRegex);

    if (matches) {
      let result = unique ? Array.from(new Set(matches)) : matches;

      if (sort !== 'none') {
        result = [...result].sort((a, b) => {
          const numA = parseFloat(a);
          const numB = parseFloat(b);
          return sort === 'asc' ? numA - numB : numB - numA;
        });
      }

      setNumbers(result);
    } else {
      setNumbers([]);
    }
  };

  const handleCopy = () => {
    if (numbers.length === 0) return;
    navigator.clipboard.writeText(numbers.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (numbers.length === 0) return;
    const blob = new Blob([numbers.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `numbers-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="extractor-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">{t('common.input')}</label>
            <button
              onClick={() => setText('')}
              disabled={!text}
              className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" /> {t('common.clear')}
            </button>
          </div>
          <textarea
            id="extractor-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t('numberextractor.placeholder_input') || 'Paste text here to extract numbers...'}
            className="w-full h-96 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none shadow-sm"
          />

          <div className="p-6 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4">
            <h3 className="font-black uppercase tracking-widest text-[10px] text-slate-400">{t('common.options')}</h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setUniqueOnly(!uniqueOnly)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                  uniqueOnly
                    ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/30'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                <ListChecks className="w-3.5 h-3.5" />
                {t('listcleaner.remove_duplicates')}
              </button>

              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  onClick={() => setSortOrder('none')}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${sortOrder === 'none' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                >
                  {t('common.na')}
                </button>
                <button
                  onClick={() => setSortOrder('asc')}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all flex items-center gap-1 ${sortOrder === 'asc' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                >
                  <SortAsc className="w-3 h-3" /> ASC
                </button>
                <button
                  onClick={() => setSortOrder('desc')}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all flex items-center gap-1 ${sortOrder === 'desc' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                >
                  <SortDesc className="w-3 h-3" /> DESC
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">{t('numberextractor.numbers_found') || 'Numbers Found'}</label>
              <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-[10px] font-black rounded-full">
                {numbers.length}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                disabled={numbers.length === 0}
                className="p-2 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg hover:bg-indigo-100 disabled:opacity-50 transition-all"
                aria-label={t('common.download')}
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={handleCopy}
                disabled={numbers.length === 0}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  copied ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                } disabled:opacity-50`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? t('common.copied') : t('common.copy')}
              </button>
            </div>
          </div>
          <div className="w-full h-[516px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-y-auto shadow-inner">
            {numbers.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {numbers.map((num, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-3 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50 group hover:border-indigo-500/30 transition-all">
                    <Hash className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span className="text-sm font-mono font-bold text-slate-600 dark:text-slate-400 break-all">
                      {num}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
                <List className="w-8 h-8 opacity-20" />
                <p className="text-xs font-bold uppercase tracking-widest opacity-50">{t('numberextractor.no_numbers') || 'No Numbers Found'}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
