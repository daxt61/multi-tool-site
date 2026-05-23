import { useState, useEffect, useCallback } from 'react';
import { Calculator, Copy, Check, Trash2, ArrowRight, RotateCcw, AlertCircle, Settings2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type Matrix = number[][];

export function MatrixCalculator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [rowsA, setRowsA] = useState(initialData?.rowsA || 3);
  const [colsA, setColsA] = useState(initialData?.colsA || 3);
  const [rowsB, setRowsB] = useState(initialData?.rowsB || 3);
  const [colsB, setColsB] = useState(initialData?.colsB || 3);

  const [matrixA, setMatrixA] = useState<Matrix>(initialData?.matrixA || Array(3).fill(0).map(() => Array(3).fill(0)));
  const [matrixB, setMatrixB] = useState<Matrix>(initialData?.matrixB || Array(3).fill(0).map(() => Array(3).fill(0)));
  const [result, setResult] = useState<Matrix | number | null>(null);
  const [operation, setOperation] = useState<'add' | 'sub' | 'mul' | 'detA' | 'detB' | 'transA' | 'transB'>(initialData?.operation || 'add');

  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onStateChange?.({ rowsA, colsA, rowsB, colsB, matrixA, matrixB, operation });
  }, [rowsA, colsA, rowsB, colsB, matrixA, matrixB, operation]);

  const updateMatrixA = (r: number, c: number, val: string) => {
    const newMatrix = [...matrixA];
    newMatrix[r][c] = parseFloat(val) || 0;
    setMatrixA(newMatrix);
  };

  const updateMatrixB = (r: number, c: number, val: string) => {
    const newMatrix = [...matrixB];
    newMatrix[r][c] = parseFloat(val) || 0;
    setMatrixB(newMatrix);
  };

  const resizeMatrixA = (newRows: number, newCols: number) => {
    const r = Math.max(1, Math.min(5, newRows));
    const c = Math.max(1, Math.min(5, newCols));
    setRowsA(r);
    setColsA(c);
    const newMatrix = Array(r).fill(0).map((_, i) =>
      Array(c).fill(0).map((_, j) => (matrixA[i] && matrixA[i][j]) || 0)
    );
    setMatrixA(newMatrix);
  };

  const resizeMatrixB = (newRows: number, newCols: number) => {
    const r = Math.max(1, Math.min(5, newRows));
    const c = Math.max(1, Math.min(5, newCols));
    setRowsB(r);
    setColsB(c);
    const newMatrix = Array(r).fill(0).map((_, i) =>
      Array(c).fill(0).map((_, j) => (matrixB[i] && matrixB[i][j]) || 0)
    );
    setMatrixB(newMatrix);
  };

  const calculateDeterminant = (m: Matrix): number => {
    const size = m.length;
    if (size !== m[0].length) return 0;
    if (size === 1) return m[0][0];
    if (size === 2) return m[0][0] * m[1][1] - m[0][1] * m[1][0];
    if (size === 3) {
      return m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) -
             m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) +
             m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
    }
    // Simple expansion for 4x4 and 5x5 is complex, limit det to 3x3 for now or implement generic
    setError(t('matrix.error_det_limit'));
    return 0;
  };

  const calculate = () => {
    setError(null);
    setResult(null);

    try {
      switch (operation) {
        case 'add':
          if (rowsA !== rowsB || colsA !== colsB) {
            setError(t('matrix.error_dim_add'));
            return;
          }
          setResult(matrixA.map((row, i) => row.map((val, j) => val + matrixB[i][j])));
          break;
        case 'sub':
          if (rowsA !== rowsB || colsA !== colsB) {
            setError(t('matrix.error_dim_sub'));
            return;
          }
          setResult(matrixA.map((row, i) => row.map((val, j) => val - matrixB[i][j])));
          break;
        case 'mul':
          if (colsA !== rowsB) {
            setError(t('matrix.error_dim_mul'));
            return;
          }
          const mulRes = Array(rowsA).fill(0).map(() => Array(colsB).fill(0));
          for (let i = 0; i < rowsA; i++) {
            for (let j = 0; j < colsB; j++) {
              for (let k = 0; k < colsA; k++) {
                mulRes[i][j] += matrixA[i][k] * matrixB[k][j];
              }
            }
          }
          setResult(mulRes);
          break;
        case 'detA':
          if (rowsA !== colsA) {
            setError(t('matrix.error_square'));
            return;
          }
          setResult(calculateDeterminant(matrixA));
          break;
        case 'detB':
          if (rowsB !== colsB) {
            setError(t('matrix.error_square'));
            return;
          }
          setResult(calculateDeterminant(matrixB));
          break;
        case 'transA':
          setResult(Array(colsA).fill(0).map((_, j) => Array(rowsA).fill(0).map((_, i) => matrixA[i][j])));
          break;
        case 'transB':
          setResult(Array(colsB).fill(0).map((_, j) => Array(rowsB).fill(0).map((_, i) => matrixB[i][j])));
          break;
      }
    } catch (e) {
      setError(t('matrix.error_calc'));
    }
  };

  const handleCopy = () => {
    if (result === null) return;
    const text = Array.isArray(result)
      ? result.map(row => row.join('\t')).join('\n')
      : result.toString();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
        {/* Matrix A */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{t('matrix.matrix_a')}</h3>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={rowsA}
                onChange={(e) => resizeMatrixA(Number(e.target.value), colsA)}
                className="w-12 p-1 bg-white dark:bg-slate-800 border border-slate-200 rounded text-center text-xs font-bold"
              />
              <span className="text-slate-400">×</span>
              <input
                type="number"
                value={colsA}
                onChange={(e) => resizeMatrixA(rowsA, Number(e.target.value))}
                className="w-12 p-1 bg-white dark:bg-slate-800 border border-slate-200 rounded text-center text-xs font-bold"
              />
            </div>
          </div>
          <div
            className="grid gap-2 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl"
            style={{ gridTemplateColumns: `repeat(${colsA}, minmax(0, 1fr))` }}
          >
            {matrixA.map((row, r) => row.map((val, c) => (
              <input
                key={`${r}-${c}`}
                type="number"
                value={val}
                onChange={(e) => updateMatrixA(r, c, e.target.value)}
                className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-center font-mono text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            )))}
          </div>
        </div>

        {/* Matrix B */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{t('matrix.matrix_b')}</h3>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={rowsB}
                onChange={(e) => resizeMatrixB(Number(e.target.value), colsB)}
                className="w-12 p-1 bg-white dark:bg-slate-800 border border-slate-200 rounded text-center text-xs font-bold"
              />
              <span className="text-slate-400">×</span>
              <input
                type="number"
                value={colsB}
                onChange={(e) => resizeMatrixB(rowsB, Number(e.target.value))}
                className="w-12 p-1 bg-white dark:bg-slate-800 border border-slate-200 rounded text-center text-xs font-bold"
              />
            </div>
          </div>
          <div
            className="grid gap-2 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl"
            style={{ gridTemplateColumns: `repeat(${colsB}, minmax(0, 1fr))` }}
          >
            {matrixB.map((row, r) => row.map((val, c) => (
              <input
                key={`${r}-${c}`}
                type="number"
                value={val}
                onChange={(e) => updateMatrixB(r, c, e.target.value)}
                className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-center font-mono text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            )))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 justify-center">
        {[
          { id: 'add', label: 'A + B' },
          { id: 'sub', label: 'A - B' },
          { id: 'mul', label: 'A × B' },
          { id: 'detA', label: 'det(A)' },
          { id: 'detB', label: 'det(B)' },
          { id: 'transA', label: 'Aᵀ' },
          { id: 'transB', label: 'Bᵀ' },
        ].map((op) => (
          <button
            key={op.id}
            onClick={() => setOperation(op.id as any)}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all border ${operation === op.id ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-indigo-500/50'}`}
          >
            {op.label}
          </button>
        ))}
        <button
          onClick={calculate}
          className="px-8 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-black text-sm flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all"
        >
          <Calculator className="w-4 h-4" /> {t('common.convert') || 'Calculate'}
        </button>
      </div>

      {result !== null && (
        <div className="space-y-4 animate-in zoom-in-95 duration-300">
           <div className="flex justify-between items-center px-1">
             <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{t('matrix.result')}</h3>
             <button
               onClick={handleCopy}
               className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                 copied ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
               }`}
             >
               {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
               {copied ? t('common.copied') : t('common.copy')}
             </button>
           </div>
           <div className="p-8 bg-indigo-50 dark:bg-indigo-900/10 border-2 border-indigo-200 dark:border-indigo-500/20 rounded-[2.5rem] flex items-center justify-center min-h-[150px]">
             {Array.isArray(result) ? (
                <div
                  className="grid gap-4"
                  style={{ gridTemplateColumns: `repeat(${result[0].length}, minmax(0, 1fr))` }}
                >
                  {result.map((row, r) => row.map((val, c) => (
                    <div key={`${r}-${c}`} className="text-xl font-black font-mono text-indigo-600 dark:text-indigo-400 text-center px-4">
                      {val.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                    </div>
                  )))}
                </div>
             ) : (
                <div className="text-4xl font-black font-mono text-indigo-600 dark:text-indigo-400">
                  {result.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                </div>
             )}
           </div>
        </div>
      )}
    </div>
  );
}
