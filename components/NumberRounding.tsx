import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Hash, Copy, Check, Trash2, Download,
  Settings2, RefreshCw, Info, AlertCircle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_LENGTH = 100000;

type RoundingMethod = 'round' | 'floor' | 'ceil' | 'trunc';

export function NumberRounding({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [input, setInput] = useState(initialData?.input || '');
  const [method, setRoundingMethod] = useState<RoundingMethod>(initialData?.method || 'round');
  const [precision, setPrecision] = useState<number>(initialData?.precision ?? 2);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onStateChange?.({ input, method, precision });
  }, [input, method, precision, onStateChange]);

  const output = useMemo(() => {
    if (!input.trim()) return '';
    if (input.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
      return '';
    }
    setError(null);

    const lines = input.split('\n');
    const factor = Math.pow(10, precision);

    const processed = lines.map((line: string) => {
      // Find all numbers in the line
      return line.replace(/-?\d+(\.\d+)?/g, (match: string) => {
        const num = parseFloat(match);
        if (isNaN(num)) return match;

        let result: number;
        switch (method) {
          case 'floor':
            result = Math.floor(num * factor) / factor;
            break;
          case 'ceil':
            result = Math.ceil(num * factor) / factor;
            break;
          case 'trunc':
            result = Math.trunc(num * factor) / factor;
            break;
          default:
            result = Math.round(num * factor) / factor;
        }

        return result.toFixed(Math.max(0, precision)).replace(/\.?0+$/, (m) => precision > 0 && m.startsWith('.') ? m : '');
      });
    });

    return processed.join('\n');
  }, [input, method, precision, t]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [output]);

  const handleDownload = useCallback(() => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rounded-numbers-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [output]);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Area */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="num-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Hash className="w-4 h-4 text-indigo-500" /> {t('common.input')}
            </label>
            <button
              onClick={() => setInput('')}
              className="text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors"
            >
              {t('common.clear')}
            </button>
          </div>
          <textarea
            id="num-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="3.14159&#10;2.71828&#10;1.414"
            className="w-full h-48 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-lg dark:text-slate-300 resize-none"
          />

          <div className="space-y-4 pt-4">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="num-output" className="text-xs font-black uppercase tracking-widest text-slate-400">{t('common.output')}</label>
              <div className="flex gap-2">
                <button
                  onClick={handleDownload}
                  disabled={!output}
                  className="text-xs font-bold px-3 py-1.5 rounded-xl text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 transition-all disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleCopy}
                  disabled={!output}
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
            <textarea
              id="num-output"
              value={output}
              readOnly
              placeholder={t('common.waiting')}
              className="w-full h-48 p-6 bg-slate-900 text-indigo-300 border border-slate-800 rounded-3xl outline-none font-mono text-lg resize-none"
            />
          </div>
        </div>

        {/* Sidebar Tools */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-8 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2rem] space-y-6">
            <div className="flex items-center gap-2 text-indigo-500 px-1">
              <Settings2 className="w-4 h-4" />
              <h3 className="font-black uppercase tracking-widest text-[10px] text-slate-400">{t('common.options')}</h3>
            </div>

            <div className="space-y-6">
              {/* Method */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block px-1">
                  {t('number_rounding.method')}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['round', 'floor', 'ceil', 'trunc'] as RoundingMethod[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => setRoundingMethod(m)}
                      className={`p-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${
                        method === m
                          ? 'bg-indigo-600 text-white border-transparent shadow-md'
                          : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-indigo-500/50'
                      }`}
                    >
                      {t(`number_rounding.method_${m}`)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Precision */}
              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <label htmlFor="precision-range" className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {t('number_rounding.precision')}
                  </label>
                  <span className="text-xs font-bold text-indigo-500 font-mono">{precision}</span>
                </div>
                <input
                  id="precision-range"
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={precision}
                  onChange={(e) => setPrecision(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-[10px] font-bold text-slate-400 px-1">
                  <span>0</span>
                  <span>10</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setRoundingMethod('round');
                setPrecision(2);
              }}
              className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all"
            >
              <RefreshCw className="w-4 h-4" /> {t('common.reset')}
            </button>
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-900/10 p-6 rounded-[2rem] border border-indigo-100 dark:border-indigo-900/20 flex gap-4">
            <Info className="w-6 h-6 text-indigo-600 shrink-0" />
            <div className="space-y-2">
              <h4 className="font-bold dark:text-white">{t('number_rounding.about_title')}</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                {t('number_rounding.about_text')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
