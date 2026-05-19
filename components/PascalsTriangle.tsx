import { useState, useMemo, useEffect, useCallback } from 'react';
import { Triangle, Copy, Check, Hash, Info, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_ROWS = 30;

export function PascalsTriangle({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [rows, setRows] = useState(initialData?.rows || 10);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ rows });
  }, [rows, onStateChange]);

  const triangle = useMemo(() => {
    const tri: bigint[][] = [];
    for (let i = 0; i < rows; i++) {
      tri[i] = new Array(i + 1);
      for (let j = 0; j <= i; j++) {
        if (j === 0 || j === i) {
          tri[i][j] = BigInt(1);
        } else {
          tri[i][j] = tri[i - 1][j - 1] + tri[i - 1][j];
        }
      }
    }
    return tri;
  }, [rows]);

  const textRepresentation = useMemo(() => {
    return triangle.map(row => row.join(' ')).join('\n');
  }, [triangle]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(textRepresentation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [textRepresentation]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([textRepresentation], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pascals-triangle-${rows}-rows.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }, [textRepresentation, rows]);

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="space-y-6">
          <div className="space-y-4 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="rows-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Hash className="w-4 h-4 text-indigo-500" /> {t('common.options')}
              </label>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm font-bold">
                <span className="text-slate-600 dark:text-slate-400">{t('pascal.rows_count')}</span>
                <span className="text-indigo-600 dark:text-indigo-400">{rows}</span>
              </div>
              <input
                id="rows-input"
                type="range"
                min="1"
                max={MAX_ROWS}
                value={rows}
                onChange={(e) => setRows(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="flex justify-between text-[10px] font-bold text-slate-400">
                <span>1</span>
                <span>{MAX_ROWS}</span>
              </div>
            </div>
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-900/10 p-6 rounded-3xl border border-indigo-100 dark:border-indigo-900/20 space-y-4">
            <h4 className="font-bold dark:text-white flex items-center gap-2">
              <Info className="w-4 h-4 text-indigo-500" /> {t('pascal.info_title')}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {t('pascal.info_text')}
            </p>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
                <div className="text-[10px] font-black uppercase text-slate-400 mb-1">{t('pascal.total_sum')}</div>
                <div className="text-sm font-bold dark:text-white">2^{rows-1}</div>
              </div>
              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
                <div className="text-[10px] font-black uppercase text-slate-400 mb-1">{t('pascal.max_value')}</div>
                <div className="text-sm font-bold dark:text-white truncate">
                  {triangle[rows-1][Math.floor((rows-1)/2)].toString().length > 10
                    ? triangle[rows-1][Math.floor((rows-1)/2)].toString().slice(0, 7) + '...'
                    : triangle[rows-1][Math.floor((rows-1)/2)].toString()}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Triangle className="w-4 h-4 text-indigo-500" /> {t('pascal.visualization')}
            </h3>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all"
              >
                <Download className="w-3.5 h-3.5" /> {t('common.download')}
              </button>
              <button
                onClick={handleCopy}
                className={`text-xs font-bold px-4 py-1.5 rounded-xl transition-all border flex items-center gap-2 ${
                  copied
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                    : 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-slate-200 dark:border-slate-700 hover:border-indigo-500/50'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? t('common.copied') : t('common.copy')}
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 overflow-auto max-h-[600px] shadow-inner custom-scrollbar">
            <div className="flex flex-col items-center min-w-max">
              {triangle.map((row, i) => (
                <div key={i} className="flex gap-1 md:gap-2 mb-1 justify-center animate-in fade-in slide-in-from-bottom-1 duration-300" style={{ transitionDelay: `${i * 30}ms` }}>
                  {row.map((val, j) => (
                    <div
                      key={`${i}-${j}`}
                      title={`${i}C${j} = ${val.toString()}`}
                      className="w-8 h-8 md:w-12 md:h-12 flex items-center justify-center bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-lg text-[8px] md:text-xs font-bold hover:bg-indigo-500 hover:text-white dark:hover:bg-indigo-600 transition-colors cursor-default"
                    >
                      {val.toString().length > 4 ? '...' : val.toString()}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
