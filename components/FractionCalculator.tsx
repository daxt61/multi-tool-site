import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Copy, Check, Trash2, RotateCcw, Info, Equal, X, Divide, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

type Operator = '+' | '-' | '*' | '/';

interface FractionPreset {
  id: string;
  labelKey: string;
  num1: number;
  den1: number;
  num2: number;
  den2: number;
  operator: Operator;
}

const PRESETS: FractionPreset[] = [
  { id: 'half_plus_quarter', labelKey: 'fraction.preset_half_quarter', num1: 1, den1: 2, num2: 1, den2: 4, operator: '+' },
  { id: 'three_quarters_minus_third', labelKey: 'fraction.preset_sub_thirds', num1: 3, den1: 4, num2: 1, den2: 3, operator: '-' },
  { id: 'two_thirds_times_three_fifths', labelKey: 'fraction.preset_multiply', num1: 2, den1: 3, num2: 3, den2: 5, operator: '*' },
  { id: 'five_sixths_div_half', labelKey: 'fraction.preset_divide', num1: 5, den1: 6, num2: 1, den2: 2, operator: '/' },
];

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
  const [activePresetId, setActivePresetId] = useState<string | null>('half_plus_quarter');
  const [copied, setCopied] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
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
    setActivePresetId('half_plus_quarter');
    toast.success(t('fraction.reset_success', 'Calculatrice réinitialisée'));
    setTimeout(() => num1Ref.current?.focus(), 0);
  }, [t]);

  const handleApplyPreset = (preset: FractionPreset) => {
    setNum1(preset.num1);
    setDen1(preset.den1);
    setNum2(preset.num2);
    setDen2(preset.den2);
    setOperator(preset.operator);
    setActivePresetId(preset.id);
    toast.success(t('fraction.preset_loaded', 'Préréglage appliqué'));
    setTimeout(() => num1Ref.current?.focus(), 0);
  };

  const handlersRef = useRef({ handleCopy, handleReset });
  useEffect(() => {
    handlersRef.current = { handleCopy, handleReset };
  }, [handleCopy, handleReset]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      if (!containerRef.current?.contains(activeElement) && activeElement !== document.body) return;

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

  const getOperatorName = (op: Operator) => {
    switch (op) {
      case '+': return t('fraction.op_add', 'Addition (+)');
      case '-': return t('fraction.op_subtract', 'Soustraction (-)');
      case '*': return t('fraction.op_multiply', 'Multiplication (×)');
      case '/': return t('fraction.op_divide', 'Division (÷)');
    }
  };

  return (
    <div ref={containerRef} className="max-w-4xl mx-auto space-y-8">
      {/* Presets and Reset Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mr-1">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            {t('fraction.presets_title', 'Préréglages')} :
          </span>
          {PRESETS.map((preset) => {
            const isActive = activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleApplyPreset(preset)}
                aria-pressed={isActive}
                className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                  isActive
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-500 dark:hover:border-indigo-500'
                }`}
              >
                {t(preset.labelKey)}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
            title={`${t('common.reset')} (Esc)`}
            aria-label={`${t('common.reset')} (Esc)`}
          >
            <RotateCcw className="w-3 h-3" />
            <span>{t('common.reset')}</span>
            <Kbd modifier={null} className="ml-1 text-[10px] text-rose-500 border-rose-200 dark:border-rose-800">Esc</Kbd>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Fraction 1 */}
        <div className="md:col-span-4 space-y-4">
          <div className="flex flex-col gap-4 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800">
            <input
              id="num1"
              ref={num1Ref}
              type="number"
              value={num1}
              aria-label={t('fraction.num1_label', 'Numérateur 1')}
              onChange={(e) => {
                setNum1(parseInt(e.target.value, 10) || 0);
                setActivePresetId(null);
              }}
              className="bg-transparent text-3xl font-black font-mono text-center outline-none focus:ring-2 focus:ring-indigo-500/30 rounded-xl dark:text-white border-b border-slate-300 dark:border-slate-700 pb-2"
              placeholder="0"
            />
            <input
              id="den1"
              type="number"
              value={den1}
              aria-label={t('fraction.den1_label', 'Dénominateur 1')}
              onChange={(e) => {
                setDen1(parseInt(e.target.value, 10) || 0);
                setActivePresetId(null);
              }}
              onBlur={() => { if (den1 === 0) setDen1(1); }}
              className="bg-transparent text-3xl font-black font-mono text-center outline-none focus:ring-2 focus:ring-indigo-500/30 rounded-xl dark:text-white pt-2"
              placeholder="1"
            />
          </div>
        </div>

        {/* Operator */}
        <div className="md:col-span-1 flex justify-center">
          <div className="grid grid-cols-2 md:grid-cols-1 gap-2" role="group" aria-label={t('fraction.operator_group', 'Opérateur arithmétique')}>
            {(['+', '-', '*', '/'] as Operator[]).map((op) => (
              <button
                key={op}
                type="button"
                onClick={() => {
                  setOperator(op);
                  setActivePresetId(null);
                }}
                aria-pressed={operator === op}
                aria-label={getOperatorName(op)}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all border font-bold focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
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
              id="num2"
              type="number"
              value={num2}
              aria-label={t('fraction.num2_label', 'Numérateur 2')}
              onChange={(e) => {
                setNum2(parseInt(e.target.value, 10) || 0);
                setActivePresetId(null);
              }}
              className="bg-transparent text-3xl font-black font-mono text-center outline-none focus:ring-2 focus:ring-indigo-500/30 rounded-xl dark:text-white border-b border-slate-300 dark:border-slate-700 pb-2"
              placeholder="0"
            />
            <input
              id="den2"
              type="number"
              value={den2}
              aria-label={t('fraction.den2_label', 'Dénominateur 2')}
              onChange={(e) => {
                setDen2(parseInt(e.target.value, 10) || 0);
                setActivePresetId(null);
              }}
              onBlur={() => { if (den2 === 0) setDen2(1); }}
              className="bg-transparent text-3xl font-black font-mono text-center outline-none focus:ring-2 focus:ring-indigo-500/30 rounded-xl dark:text-white pt-2"
              placeholder="1"
            />
          </div>
        </div>

        {/* Result Arrow */}
        <div className="md:col-span-1 flex justify-center">
           <Equal className="w-8 h-8 text-slate-300" aria-hidden="true" />
        </div>

        {/* Final Result */}
        <div className="md:col-span-2">
          {result && !('error' in result) ? (
            <div className="flex flex-col items-center gap-2" aria-live="polite">
              <div className="text-3xl font-black font-mono text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600/30 dark:border-indigo-400/30 pb-1">
                {result.numerator}
              </div>
              <div className="text-3xl font-black font-mono text-indigo-600 dark:text-indigo-400 pt-1">
                {result.denominator}
              </div>
            </div>
          ) : (
             <div className="text-rose-500 text-xs font-bold text-center" aria-live="assertive">
               {result && 'error' in result ? result.error : t('fraction.error_invalid')}
             </div>
          )}
        </div>
      </div>

      {result && !('error' in result) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
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
           <div className={`p-8 bg-indigo-50 dark:bg-indigo-900/10 rounded-[2rem] border border-indigo-100 dark:border-indigo-900/20 space-y-4 ${!result.mixed ? 'md:col-span-2' : ''}`}>
              <div className="flex items-center justify-between">
                 <h4 className="text-xs font-black uppercase tracking-widest text-indigo-500">{t('fraction.decimal_value')}</h4>
                 <button
                  type="button"
                  onClick={handleCopy}
                  className={`p-2 rounded-xl transition-all flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                    copied
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'text-indigo-600 hover:bg-indigo-100 dark:hover:bg-indigo-900/40'
                  }`}
                  title={`${copied ? t('common.copied') : t('common.copy')} (C)`}
                  aria-label={`${copied ? t('common.copied') : t('common.copy')} (C)`}
                 >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span className="text-xs font-bold">{copied ? t('common.copied') : t('common.copy')}</span>
                    {!copied && <Kbd modifier={null} className="hidden sm:inline-flex border-indigo-200 dark:border-indigo-800 text-indigo-400 text-[10px]">C</Kbd>}
                 </button>
              </div>
              <div className="text-4xl font-black font-mono text-indigo-600 dark:text-indigo-400 truncate" aria-live="polite">
                {result.decimal.toLocaleString(undefined, { maximumFractionDigits: 10 })}
              </div>
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
