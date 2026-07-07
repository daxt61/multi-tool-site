import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Grid3X3, Copy, Check, Trash2, AlertCircle, Shield, ShieldCheck, Download, Info, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

type MatrixSize = 2 | 3;

export function HillCipher({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [input, setInput] = useState(initialData?.input || '');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<'encrypt' | 'decrypt'>(initialData?.mode || 'encrypt');
  const [matrixSize, setMatrixSize] = useState<MatrixSize>(initialData?.matrixSize || 2);
  const [matrix, setMatrix] = useState<number[][]>(initialData?.matrix || [[3, 3], [2, 5]]);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    onStateChange?.({ input, mode, matrixSize, matrix });
  }, [input, mode, matrixSize, matrix, onStateChange]);

  const mod = (n: number, m: number) => ((n % m) + m) % m;

  const gcd = (a: number, b: number): number => {
    while (b) {
      a %= b;
      [a, b] = [b, a];
    }
    return a;
  };

  const modInverse = (a: number, m: number) => {
    a = mod(a, m);
    for (let x = 1; x < m; x++) {
      if (mod(a * x, m) === 1) return x;
    }
    return null;
  };

  const getDeterminant = (m: number[][]) => {
    if (m.length === 2) {
      return m[0][0] * m[1][1] - m[0][1] * m[1][0];
    }
    // 3x3 determinant
    return (
      m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) -
      m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) +
      m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0])
    );
  };

  const getInverseMatrix = (m: number[][]) => {
    const det = getDeterminant(m);
    const invDet = modInverse(det, 26);
    if (invDet === null) return null;

    if (m.length === 2) {
      return [
        [mod(m[1][1] * invDet, 26), mod(-m[0][1] * invDet, 26)],
        [mod(-m[1][0] * invDet, 26), mod(m[0][0] * invDet, 26)],
      ];
    }

    // 3x3 Adjugate matrix
    const adj: number[][] = Array(3).fill(0).map(() => Array(3).fill(0));
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        const subMatrix = m
          .filter((_, row) => row !== i)
          .map(row => row.filter((_, col) => col !== j));
        const cofactor = subMatrix[0][0] * subMatrix[1][1] - subMatrix[0][1] * subMatrix[1][0];
        adj[j][i] = mod(((i + j) % 2 === 0 ? 1 : -1) * cofactor * invDet, 26);
      }
    }
    return adj;
  };

  const processText = useCallback(() => {
    setError(null);
    if (!input.trim()) {
      setOutput('');
      return;
    }

    const det = getDeterminant(matrix);
    if (gcd(mod(det, 26), 26) !== 1) {
      setError(t('hillcipher.error_invertible'));
      setOutput('');
      return;
    }

    let keyMatrix = matrix;
    if (mode === 'decrypt') {
      const inv = getInverseMatrix(matrix);
      if (!inv) {
        setError(t('hillcipher.error_invertible'));
        setOutput('');
        return;
      }
      keyMatrix = inv;
    }

    const cleanedInput = input.toUpperCase().replace(/[^A-Z]/g, '');
    let paddedInput = cleanedInput;
    while (paddedInput.length % matrixSize !== 0) {
      paddedInput += 'X';
    }

    let result = '';
    for (let i = 0; i < paddedInput.length; i += matrixSize) {
      const vector = [];
      for (let j = 0; j < matrixSize; j++) {
        vector.push(paddedInput.charCodeAt(i + j) - 65);
      }

      for (let row = 0; row < matrixSize; row++) {
        let sum = 0;
        for (let col = 0; col < matrixSize; col++) {
          sum += keyMatrix[row][col] * vector[col];
        }
        result += String.fromCharCode(mod(sum, 26) + 65);
      }
    }

    setOutput(result);
  }, [input, mode, matrix, matrixSize, t]);

  useEffect(() => {
    processText();
  }, [processText]);

  const handleMatrixChange = (row: number, col: number, value: string) => {
    const newVal = parseInt(value) || 0;
    const newMatrix = matrix.map((r, i) =>
      r.map((c, j) => (i === row && j === col ? newVal : c))
    );
    setMatrix(newMatrix);
  };

  const toggleSize = (size: MatrixSize) => {
    setMatrixSize(size);
    if (size === 2) {
      setMatrix([[3, 3], [2, 5]]);
    } else {
      setMatrix([[6, 24, 1], [13, 16, 10], [20, 17, 15]]);
    }
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    setError(null);
    textareaRef.current?.focus();
  };

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success(t('common.copied'));
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hill-cipher-${mode}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlersRef = useRef({ handleCopy, handleClear });
  useEffect(() => {
    handlersRef.current = { handleCopy, handleClear };
  }, [handleCopy, handleClear]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") {
        if (e.key !== 'Escape') return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        handlersRef.current.handleClear();
      } else if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handlersRef.current.handleCopy();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Configuration Column */}
        <div className="space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex items-center justify-between px-1">
               <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                 <Shield className="w-4 h-4 text-indigo-500" /> {t('common.options')}
               </label>
               <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-xl">
                  <button
                    onClick={() => setMode('encrypt')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${mode === 'encrypt' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                  >
                    {t('common.encrypt')}
                  </button>
                  <button
                    onClick={() => setMode('decrypt')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${mode === 'decrypt' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                  >
                    {t('common.decrypt')}
                  </button>
               </div>
            </div>

            <div className="space-y-4">
               <div className="flex justify-between items-center px-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{t('hillcipher.matrix_size')}</span>
                  <div className="flex gap-2">
                     {[2, 3].map(size => (
                       <button
                         key={size}
                         onClick={() => toggleSize(size as MatrixSize)}
                         className={`w-8 h-8 rounded-lg text-xs font-bold transition-all border ${matrixSize === size ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'}`}
                       >
                         {size}x{size}
                       </button>
                     ))}
                  </div>
               </div>

               <div className="flex justify-center py-4">
                  <div className={`grid gap-2`} style={{ gridTemplateColumns: `repeat(${matrixSize}, minmax(0, 1fr))` }}>
                    {matrix.map((row, i) =>
                      row.map((val, j) => (
                        <input
                          key={`${i}-${j}`}
                          type="number"
                          value={val}
                          onChange={(e) => handleMatrixChange(i, j, e.target.value)}
                          className="w-16 h-16 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-center font-mono font-bold text-lg focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all dark:text-white"
                        />
                      ))
                    )}
                  </div>
               </div>

               <div className="text-center">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-[10px] font-bold text-slate-400">
                     Determinant: <span className={gcd(mod(getDeterminant(matrix), 26), 26) === 1 ? 'text-emerald-500' : 'text-rose-500'}>
                       {mod(getDeterminant(matrix), 26)}
                     </span>
                  </div>
               </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="hill-input" className="text-xs font-black uppercase tracking-widest text-slate-400">{t('common.input')}</label>
              <button
                onClick={handleClear}
                className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 px-3 py-1 rounded-full transition-all flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" /> {t('common.clear')}
              </button>
            </div>
            <textarea
              id="hill-input"
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="HELLO WORLD"
              className="w-full h-48 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
            />
          </div>
        </div>

        {/* Output Column */}
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="hill-output" className="text-xs font-black uppercase tracking-widest text-slate-400">{t('common.output')}</label>
              <div className="flex gap-2">
                <button
                  onClick={handleDownload}
                  disabled={!output}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-indigo-600 transition-all disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={handleCopy}
                  disabled={!output}
                  className={`text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-2 border ${
                    copied
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200'
                      : 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 border-transparent'
                  } disabled:opacity-50`}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? t('common.copied') : t('common.copy')}
                </button>
              </div>
            </div>
            <textarea
              id="hill-output"
              value={output}
              readOnly
              placeholder={t('common.waiting')}
              className="w-full h-80 p-6 bg-slate-900 border border-slate-800 rounded-[2rem] outline-none font-mono text-xl leading-relaxed text-indigo-400 resize-none"
            />
          </div>

          {error && (
            <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
            <Info className="w-6 h-6 text-indigo-500 mt-1" />
            <div className="space-y-2">
              <h4 className="font-bold dark:text-white">{t('hillcipher.about_title')}</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                {t('hillcipher.about_text')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
