import { useState, useMemo, useEffect, useCallback } from 'react';
import { Hash, RefreshCw, Copy, Check, Trash2, Download, AlertCircle, Settings2, Info, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_VALUE = 60; // Beyond this, the number of partitions grows too large for a browser
const MAX_PARTITIONS = 10000;

export function IntegerPartitions({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [input, setInput] = useState<number>(initialData?.input ?? 10);
  const [separator, setSeparator] = useState(initialData?.separator || ' + ');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onStateChange?.({ input, separator });
  }, [input, separator, onStateChange]);

  const generatePartitions = useCallback((n: number) => {
    const result: number[][] = [];
    const partition: number[] = new Array(n);

    const findPartitions = (target: number, max: number, index: number) => {
      if (result.length >= MAX_PARTITIONS) return;

      if (target === 0) {
        result.push(partition.slice(0, index));
        return;
      }

      for (let i = Math.min(max, target); i >= 1; i--) {
        partition[index] = i;
        findPartitions(target - i, i, index + 1);
        if (result.length >= MAX_PARTITIONS) return;
      }
    };

    findPartitions(n, n, 0);
    return result;
  }, []);

  const partitions = useMemo(() => {
    if (input < 1) return [];
    if (input > MAX_VALUE) {
      setError(t('integer_partitions.error_too_large', { max: MAX_VALUE }));
      return [];
    }
    setError(null);
    return generatePartitions(input);
  }, [input, generatePartitions, t]);

  const handleCopy = () => {
    if (partitions.length === 0) return;
    const text = partitions.map(p => p.join(separator)).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (partitions.length === 0) return;
    const text = partitions.map(p => p.join(separator)).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `partitions-${input}.txt`;
    a.click();
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Controls */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
              <Settings2 className="w-4 h-4 text-indigo-500" /> {t('common.options')}
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="int-input" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                  {t('integer_partitions.input_number')}
                </label>
                <input
                  id="int-input"
                  type="number"
                  min="1"
                  max={MAX_VALUE}
                  value={input}
                  onChange={(e) => setInput(parseInt(e.target.value) || 0)}
                  className="w-full p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="sep-input" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                  {t('integer_partitions.separator')}
                </label>
                <input
                  id="sep-input"
                  type="text"
                  value={separator}
                  onChange={(e) => setSeparator(e.target.value)}
                  placeholder="e.g. + , -"
                  className="w-full p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
                />
              </div>
            </div>

            <button
              onClick={() => setInput(10)}
              className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all"
            >
              <RefreshCw className="w-4 h-4" /> {t('common.reset')}
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
              <Hash className="w-4 h-4 text-indigo-500" /> {t('common.result')}
              <span className="ml-2 text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-lg">
                {partitions.length}{partitions.length >= MAX_PARTITIONS ? '+' : ''}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                disabled={partitions.length === 0}
                className="text-xs font-bold px-3 py-1.5 rounded-xl text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 transition-all flex items-center gap-1 disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleCopy}
                disabled={partitions.length === 0}
                className={`text-xs font-bold px-4 py-1.5 rounded-xl transition-all border flex items-center gap-2 ${
                  copied
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 border-emerald-200'
                    : 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-slate-200 dark:border-slate-700 hover:border-indigo-500/50'
                } disabled:opacity-50`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? t('common.copied') : t('common.copy')}
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 h-[500px] overflow-y-auto relative font-mono text-sm dark:text-slate-300">
            {partitions.length > 0 ? (
              <div className="space-y-1">
                {partitions.map((p, i) => (
                  <div key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 p-1 rounded transition-colors">
                    <span className="text-slate-400 mr-4 select-none inline-block w-12">{i + 1}.</span>
                    {p.join(separator)}
                  </div>
                ))}
                {partitions.length >= MAX_PARTITIONS && (
                  <div className="text-amber-500 font-bold pt-4 text-center">
                    {t('integer_partitions.limit_reached', { max: MAX_PARTITIONS })}
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-300 italic font-medium">
                {t('common.waiting')}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <Plus className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('integer_partitions.about_title')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('integer_partitions.about_text')}
          </p>
        </div>
      </div>
    </div>
  );
}
