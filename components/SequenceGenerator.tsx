import { useState, useMemo, useEffect } from 'react';
import {
  TrendingUp, Copy, Check, Trash2, Download,
  Settings2, Hash, RefreshCw, AlertCircle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_TERMS = 1000;

type SequenceType = 'arithmetic' | 'geometric' | 'fibonacci';

export function SequenceGenerator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [type, setType] = useState<SequenceType>(initialData?.type || 'arithmetic');
  const [start, setStart] = useState<number>(initialData?.start ?? 0);
  const [step, setStep] = useState<number>(initialData?.step ?? 1);
  const [count, setCount] = useState<number>(initialData?.count ?? 20);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onStateChange?.({ type, start, step, count });
  }, [type, start, step, count, onStateChange]);

  const sequence = useMemo(() => {
    const result: (number | string)[] = [];
    const n = Math.min(Math.max(1, count), MAX_TERMS);

    try {
      if (type === 'arithmetic') {
        for (let i = 0; i < n; i++) {
          result.push(start + (i * step));
        }
      } else if (type === 'geometric') {
        for (let i = 0; i < n; i++) {
          result.push(start * Math.pow(step, i));
        }
      } else if (type === 'fibonacci') {
        let a = BigInt(0);
        let b = BigInt(1);
        for (let i = 0; i < n; i++) {
          result.push(a.toString());
          const next = a + b;
          a = b;
          b = next;
        }
      }
    } catch (e) {
      console.error('Sequence generation error:', e);
      return [];
    }

    return result;
  }, [type, start, step, count]);

  const handleCopy = () => {
    if (sequence.length === 0) return;
    navigator.clipboard.writeText(sequence.join(', '));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (sequence.length === 0) return;
    const blob = new Blob([sequence.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sequence-${type}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setStart(0);
    setStep(1);
    setCount(20);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Configuration */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
              <Settings2 className="w-4 h-4 text-indigo-500" /> {t('sequence.config')}
            </div>

            <div className="space-y-4">
              <div className="flex bg-slate-200/50 dark:bg-slate-800 p-1 rounded-xl">
                {(['arithmetic', 'geometric', 'fibonacci'] as SequenceType[]).map((tType) => (
                  <button
                    key={tType}
                    onClick={() => setType(tType)}
                    className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                      type === tType
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    {t(`sequence.type_${tType}`)}
                  </button>
                ))}
              </div>

              {type !== 'fibonacci' && (
                <>
                  <div className="space-y-2">
                    <label htmlFor="seq-start" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">{t('sequence.start')}</label>
                    <input
                      id="seq-start"
                      type="number"
                      value={start}
                      onChange={(e) => setStart(parseFloat(e.target.value) || 0)}
                      className="w-full p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="seq-step" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                      {type === 'arithmetic' ? t('sequence.step') : t('sequence.ratio')}
                    </label>
                    <input
                      id="seq-step"
                      type="number"
                      value={step}
                      onChange={(e) => setStep(parseFloat(e.target.value) || 0)}
                      className="w-full p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label htmlFor="seq-count" className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('sequence.count')}</label>
                  <span className="text-xs font-bold text-indigo-500">{count}</span>
                </div>
                <input
                  id="seq-count"
                  type="range"
                  min="1"
                  max={MAX_TERMS}
                  value={count}
                  onChange={(e) => setCount(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>
            </div>

            <button
              onClick={handleReset}
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
              <Hash className="w-4 h-4 text-indigo-500" /> {t('sequence.result')}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                disabled={sequence.length === 0}
                className="text-xs font-bold px-3 py-1.5 rounded-xl text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 transition-all flex items-center gap-1 disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleCopy}
                disabled={sequence.length === 0}
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

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 h-[500px] overflow-y-auto relative group">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {sequence.map((term, i) => (
                <div
                  key={i}
                  className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center space-y-1 hover:border-indigo-500/30 transition-all group/term animate-in fade-in zoom-in-95 duration-300"
                  style={{ animationDelay: `${Math.min(i * 10, 500)}ms` }}
                >
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">#{i + 1}</span>
                  <div className="text-sm font-black font-mono dark:text-white break-all text-center">
                    {term}
                  </div>
                </div>
              ))}
            </div>
            {sequence.length === 0 && (
              <div className="h-full flex items-center justify-center text-slate-300 italic font-medium">
                {t('sequence.waiting')}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <TrendingUp className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('sequence.about_title')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('sequence.about_text')}
          </p>
        </div>
      </div>
    </div>
  );
}
