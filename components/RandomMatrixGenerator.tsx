import { useState, useEffect, useCallback } from 'react';
import { Grid, Copy, Check, Trash2, RefreshCw, Info, Download, AlertCircle, Settings2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getSecureRandomInt } from './ui/crypto';

export function RandomMatrixGenerator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [rows, setRows] = useState(initialData?.rows ?? 3);
  const [cols, setCols] = useState(initialData?.cols ?? 3);
  const [min, setMin] = useState(initialData?.min ?? 0);
  const [max, setMax] = useState(initialData?.max ?? 100);
  const [decimals, setDecimals] = useState(initialData?.decimals ?? 0);
  const [matrix, setMatrix] = useState<string[][]>([]);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onStateChange?.({ rows, cols, min, max, decimals });
  }, [rows, cols, min, max, decimals, onStateChange]);

  const generateMatrix = useCallback(() => {
    if (rows < 1 || rows > 20 || cols < 1 || cols > 20) {
      setError('Dimensions must be between 1 and 20');
      return;
    }

    let finalMin = min;
    let finalMax = max;
    if (min > max) {
      finalMin = max;
      finalMax = min;
    }

    const newMatrix: string[][] = [];
    const range = finalMax - finalMin;

    for (let i = 0; i < rows; i++) {
      const row: string[] = [];
      for (let j = 0; j < cols; j++) {
        let val: number;
        if (decimals === 0) {
          val = getSecureRandomInt(range + 1) + finalMin;
        } else {
          // Use crypto for high quality randomness then scale
          const randomArray = new Uint32Array(1);
          window.crypto.getRandomValues(randomArray);
          val = (randomArray[0] / 0xFFFFFFFF) * range + finalMin;
        }
        row.push(val.toFixed(decimals));
      }
      newMatrix.push(row);
    }
    setMatrix(newMatrix);
    setError(null);
  }, [rows, cols, min, max, decimals]);

  useEffect(() => {
    generateMatrix();
  }, []); // Generate on mount

  const handleCopy = () => {
    if (matrix.length === 0) return;
    const text = matrix.map(row => row.join('\t')).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (matrix.length === 0) return;
    const text = matrix.map(row => row.join(',')).join('\n');
    const blob = new Blob([text], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `random-matrix-${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">{t('randommatrix.rows')}</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={rows}
                  onChange={(e) => setRows(parseInt(e.target.value) || 1)}
                  className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">{t('randommatrix.cols')}</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={cols}
                  onChange={(e) => setCols(parseInt(e.target.value) || 1)}
                  className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">{t('randommatrix.min')}</label>
                <input
                  type="number"
                  value={min}
                  onChange={(e) => setMin(parseFloat(e.target.value) || 0)}
                  className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">{t('randommatrix.max')}</label>
                <input
                  type="number"
                  value={max}
                  onChange={(e) => setMax(parseFloat(e.target.value) || 0)}
                  className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">{t('randommatrix.decimals')}</label>
              <input
                type="range"
                min="0"
                max="5"
                step="1"
                value={decimals}
                onChange={(e) => setDecimals(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase px-1">
                <span>{t('randommatrix.integers')}</span>
                <span>{decimals}</span>
              </div>
            </div>

            <button
              onClick={generateMatrix}
              className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-lg"
            >
              <RefreshCw className="w-5 h-5" /> {t('random.generate')}
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
              <Grid className="w-4 h-4 text-indigo-500" /> {t('common.result')}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                disabled={matrix.length === 0}
                className="text-xs font-bold px-3 py-1.5 rounded-xl text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 transition-all flex items-center gap-1 disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleCopy}
                disabled={matrix.length === 0}
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

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 min-h-[400px] flex items-center justify-center overflow-auto">
            {matrix.length > 0 ? (
              <div
                className="grid gap-3"
                style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
              >
                {matrix.map((row, r) => row.map((val, c) => (
                  <div
                    key={`${r}-${c}`}
                    className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 font-mono text-sm font-bold text-center dark:text-slate-200 min-w-[60px] animate-in zoom-in-95 duration-200"
                    style={{ animationDelay: `${(r * cols + c) * 10}ms` }}
                  >
                    {val}
                  </div>
                )))}
              </div>
            ) : (
              <div className="text-slate-300 italic font-medium">{t('common.waiting')}</div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <Info className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('randommatrix.about_title')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('randommatrix.about_text')}
          </p>
        </div>
      </div>
    </div>
  );
}
