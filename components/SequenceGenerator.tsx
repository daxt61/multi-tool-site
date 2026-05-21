import { useState, useMemo, useEffect } from 'react';
import { List, Copy, Check, Trash2, Hash, ArrowRight, Info, AlertCircle, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type SequenceType = 'arithmetic' | 'geometric' | 'fibonacci';

export function SequenceGenerator() {
  const { t } = useTranslation();
  const [type, setType] = useState<SequenceType>('arithmetic');
  const [start, setStart] = useState(1);
  const [step, setStep] = useState(1);
  const [ratio, setRatio] = useState(2);
  const [count, setCount] = useState(10);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sequence = useMemo(() => {
    const result: number[] = [];
    const safeCount = Math.max(1, Math.min(1000, count));

    if (type === 'arithmetic') {
      for (let i = 0; i < safeCount; i++) {
        result.push(start + i * step);
      }
    } else if (type === 'geometric') {
      let current = start;
      for (let i = 0; i < safeCount; i++) {
        result.push(current);
        current *= ratio;
        if (!isFinite(current)) break;
      }
    } else if (type === 'fibonacci') {
      let a = 0, b = 1;
      if (safeCount >= 1) result.push(a);
      if (safeCount >= 2) result.push(b);
      for (let i = 2; i < safeCount; i++) {
        const next = a + b;
        if (!isFinite(next)) break;
        result.push(next);
        a = b;
        b = next;
      }
    }
    return result;
  }, [type, start, step, ratio, count]);

  const handleCopy = () => {
    if (sequence.length === 0) return;
    navigator.clipboard.writeText(sequence.join(', '));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setStart(1);
    setStep(1);
    setRatio(2);
    setCount(10);
    setError(null);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Configuration */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[2rem] space-y-6 shadow-sm">
            <div className="flex items-center gap-2 px-1">
              <Hash className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{t('sequence.config')}</h3>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">{t('sequence.type')}</label>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { id: 'arithmetic', label: t('sequence.arithmetic') },
                  { id: 'geometric', label: t('sequence.geometric') },
                  { id: 'fibonacci', label: 'Fibonacci' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setType(opt.id as SequenceType)}
                    className={`p-3 rounded-xl text-xs font-bold text-left transition-all border ${
                      type === opt.id
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-100 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              {type !== 'fibonacci' && (
                <div className="space-y-2">
                  <label htmlFor="seq-start" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">{t('sequence.start')}</label>
                  <input
                    id="seq-start"
                    type="number"
                    value={start}
                    onChange={(e) => setStart(Number(e.target.value))}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-white"
                  />
                </div>
              )}

              {type === 'arithmetic' && (
                <div className="space-y-2">
                  <label htmlFor="seq-step" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">{t('sequence.step')}</label>
                  <input
                    id="seq-step"
                    type="number"
                    value={step}
                    onChange={(e) => setStep(Number(e.target.value))}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-white"
                  />
                </div>
              )}

              {type === 'geometric' && (
                <div className="space-y-2">
                  <label htmlFor="seq-ratio" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">{t('sequence.ratio')}</label>
                  <input
                    id="seq-ratio"
                    type="number"
                    value={ratio}
                    onChange={(e) => setRatio(Number(e.target.value))}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-white"
                  />
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="seq-count" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">{t('sequence.count_label')}</label>
                <input
                  id="seq-count"
                  type="number"
                  min="1"
                  max="1000"
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-white"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleClear}
                className="flex-1 p-3 text-rose-500 bg-rose-50 dark:bg-rose-500/10 rounded-xl hover:bg-rose-100 transition-all font-bold text-xs"
              >
                {t('common.reset')}
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex justify-between items-center px-1">
             <div className="flex items-center gap-2">
                <List className="w-4 h-4 text-indigo-500" />
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{t('sequence.result')}</h3>
             </div>
             <button
               onClick={handleCopy}
               disabled={sequence.length === 0}
               className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                 copied
                   ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                   : "bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm"
               } disabled:opacity-50`}
             >
               {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
               {copied ? t('common.copied') : t('common.copy')}
             </button>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 min-h-[400px]">
            {sequence.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {sequence.map((num, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm animate-in zoom-in-95 duration-200"
                    style={{ animationDelay: `${Math.min(idx * 20, 500)}ms` }}
                  >
                    <span className="text-[10px] font-black text-slate-300 dark:text-slate-600 font-mono">#{idx + 1}</span>
                    <span className="text-sm font-black text-indigo-600 dark:text-indigo-400 font-mono">{num.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-4 py-20">
                <RefreshCw className="w-12 h-12 opacity-20" />
                <p className="font-bold italic">{t('sequence.placeholder')}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Educational Content */}
      <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-12 pt-16 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" /> {t('sequence.arithmetic_title')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('sequence.arithmetic_text')}
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" /> {t('sequence.geometric_title')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('sequence.geometric_text')}
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" /> {t('sequence.fibonacci_title')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('sequence.fibonacci_text')}
          </p>
        </div>
      </div>
    </div>
  );
}
