import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Calculator, Copy, Check, Trash2, RotateCcw, Info, Equal, Plus, Minus, X, Divide } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

type Operator = '+' | '-' | '*' | '/';

function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    a %= b;
    [a, b] = [b, a];
  }
  return a;
}

function simplify(num: number, den: number): [number, number] {
  if (den === 0) return [num, den];
  const common = gcd(num, den);
  let resNum = num / common;
  let resDen = den / common;
  if (resDen < 0) {
    resNum = -resNum;
    resDen = -resDen;
  }
  return [resNum, resDen];
}

export function FractionCalculator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [num1, setNum1] = useState(initialData?.num1 ?? 1);
  const [den1, setDen1] = useState(initialData?.den1 ?? 2);
  const [num2, setNum2] = useState(initialData?.num2 ?? 1);
  const [den2, setDen2] = useState(initialData?.den2 ?? 4);
  const [operator, setOperator] = useState<Operator>(initialData?.operator ?? '+');
  const [copied, setCopied] = useState(false);
  const num1Ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    onStateChange?.({ num1, den1, num2, den2, operator });
  }, [num1, den1, num2, den2, operator, onStateChange]);

  const result = useMemo(() => {
    if (den1 === 0 || den2 === 0) return null;

    let resNum = 0;
    let resDen = 1;

    switch (operator) {
      case '+':
        resNum = num1 * den2 + num2 * den1;
        resDen = den1 * den2;
        break;
      case '-':
        resNum = num1 * den2 - num2 * den1;
        resDen = den1 * den2;
        break;
      case '*':
        resNum = num1 * num2;
        resDen = den1 * den2;
        break;
      case '/':
        if (num2 === 0) return { error: t('fraction.error_div_zero') };
        resNum = num1 * den2;
        resDen = den1 * num2;
        break;
    }

    const [sNum, sDen] = simplify(resNum, resDen);
    const decimal = sDen !== 0 ? sNum / sDen : 0;

    let mixed = null;
    if (sDen !== 0 && Math.abs(sNum) >= Math.abs(sDen)) {
      const whole = Math.trunc(sNum / sDen);
      const remainderNum = Math.abs(sNum % sDen);
      if (remainderNum !== 0) {
        mixed = { whole, numerator: remainderNum, denominator: Math.abs(sDen) };
      }
    }

    return {
      numerator: sNum,
      denominator: sDen,
      decimal,
      mixed,
      originalNum: resNum,
      originalDen: resDen
    };
  }, [num1, den1, num2, den2, operator, t]);

  const handleCopy = useCallback(() => {
    if (!result || 'error' in result) return;
    const text = `${num1}/${den1} ${operator} ${num2}/${den2} = ${result.numerator}/${result.denominator} (${result.decimal})`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(t('common.copied'));
    setTimeout(() => setCopied(false), 2000);
  }, [num1, den1, num2, den2, operator, result, t]);

  const handleReset = useCallback(() => {
    setNum1(1);
    setDen1(2);
    setNum2(1);
    setDen2(4);
    setOperator('+');
    setTimeout(() => num1Ref.current?.focus(), 0);
  }, []);

  const handlersRef = useRef({ handleCopy, handleReset });
  useEffect(() => {
    handlersRef.current = { handleCopy, handleReset };
  }, [handleCopy, handleReset]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isEditable =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement?.getAttribute("contenteditable") === "true";

      if (isEditable && e.key !== 'Escape') return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key === "Escape") {
        e.preventDefault();
        handlersRef.current.handleReset();
      } else if (e.key.toLowerCase() === "c") {
        e.preventDefault();
        handlersRef.current.handleCopy();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Fraction 1 */}
        <div className="md:col-span-4 space-y-4">
          <div className="flex flex-col gap-4 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800">
            <input
              ref={num1Ref}
              type="number"
              value={num1}
              onChange={(e) => setNum1(parseInt(e.target.value, 10) || 0)}
              className="bg-transparent text-3xl font-black font-mono text-center outline-none dark:text-white border-b border-slate-300 dark:border-slate-700 pb-2"
              placeholder="0"
            />
            <input
              type="number"
              value={den1}
              onChange={(e) => setDen1(parseInt(e.target.value, 10) || 0)}
              onBlur={() => { if (den1 === 0) setDen1(1); }}
              className="bg-transparent text-3xl font-black font-mono text-center outline-none dark:text-white pt-2"
              placeholder="1"
            />
          </div>
        </div>

        {/* Operator */}
        <div className="md:col-span-1 flex justify-center">
          <div className="grid grid-cols-2 md:grid-cols-1 gap-2">
            {(['+', '-', '*', '/'] as Operator[]).map((op) => (
              <button
                key={op}
                onClick={() => setOperator(op)}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all border font-bold ${
                  operator === op
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20 scale-110'
                    : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 hover:border-indigo-500'
                }`}
              >
                {op === '*' ? <X className="w-4 h-4" /> : op === '/' ? <Divide className="w-4 h-4" /> : op}
              </button>
            ))}
          </div>
        </div>

        {/* Fraction 2 */}
        <div className="md:col-span-4 space-y-4">
          <div className="flex flex-col gap-4 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800">
            <input
              type="number"
              value={num2}
              onChange={(e) => setNum2(parseInt(e.target.value, 10) || 0)}
              className="bg-transparent text-3xl font-black font-mono text-center outline-none dark:text-white border-b border-slate-300 dark:border-slate-700 pb-2"
              placeholder="0"
            />
            <input
              type="number"
              value={den2}
              onChange={(e) => setDen2(parseInt(e.target.value, 10) || 0)}
              onBlur={() => { if (den2 === 0) setDen2(1); }}
              className="bg-transparent text-3xl font-black font-mono text-center outline-none dark:text-white pt-2"
              placeholder="1"
            />
          </div>
        </div>

        {/* Result Arrow */}
        <div className="md:col-span-1 flex justify-center">
           <Equal className="w-8 h-8 text-slate-300" />
        </div>

        {/* Final Result */}
        <div className="md:col-span-2">
          {result && !('error' in result) ? (
            <div className="flex flex-col items-center gap-2">
              <div className="text-3xl font-black font-mono text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600/30 dark:border-indigo-400/30 pb-1">
                {result.numerator}
              </div>
              <div className="text-3xl font-black font-mono text-indigo-600 dark:text-indigo-400 pt-1">
                {result.denominator}
              </div>
            </div>
          ) : (
             <div className="text-rose-500 text-xs font-bold text-center">
               {result && 'error' in result ? result.error : t('fraction.error_invalid')}
             </div>
          )}
        </div>
      </div>

      {result && !('error' in result) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8">
           {result.mixed && (
              <div className="p-8 bg-emerald-50 dark:bg-emerald-900/10 rounded-[2rem] border border-emerald-100 dark:border-emerald-900/20 space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-emerald-500">{t('fraction.mixed_fraction')}</h4>
                <div className="flex items-center justify-center gap-2 font-mono font-black text-emerald-600 dark:text-emerald-400">
                  <span className="text-4xl">{result.mixed.whole}</span>
                  <div className="flex flex-col items-center">
                    <span className="text-xl border-b border-emerald-600/30 dark:border-emerald-400/30">{result.mixed.numerator}</span>
                    <span className="text-xl">{result.mixed.denominator}</span>
                  </div>
                </div>
              </div>
           )}
           <div className="p-8 bg-indigo-50 dark:bg-indigo-900/10 rounded-[2rem] border border-indigo-100 dark:border-indigo-900/20 space-y-4">
              <div className="flex items-center justify-between">
                 <h4 className="text-xs font-black uppercase tracking-widest text-indigo-500">{t('fraction.decimal_value')}</h4>
                 <button
                  onClick={handleCopy}
                  className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-xl transition-all flex items-center gap-1"
                  title={`${t('common.copy')} (C)`}
                 >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {!copied && <Kbd modifier={null} className="hidden sm:inline-flex border-indigo-200 dark:border-indigo-800 text-indigo-400">C</Kbd>}
                 </button>
              </div>
              <div className="text-4xl font-black font-mono text-indigo-600 dark:text-indigo-400 truncate">
                {result.decimal.toLocaleString(undefined, { maximumFractionDigits: 10 })}
              </div>
           </div>

           <div className="p-8 bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-4 flex flex-col justify-center">
              <button
                onClick={handleReset}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold hover:bg-slate-50 transition-all text-rose-500 group"
              >
                <RotateCcw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" /> {t('common.reset')}
                <Kbd modifier={null} className="hidden sm:inline-flex border-rose-200 dark:border-rose-800 text-rose-400">Esc</Kbd>
              </button>
           </div>
        </div>
      )}

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <Info className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('fraction.about_title')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('fraction.about_text')}
          </p>
        </div>
      </div>
    </div>
  );
}
