import { useState, useEffect, useCallback } from 'react';
import { History as HistoryIcon, Trash2, Delete, Calculator as CalcIcon, Copy, Check, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

export function Calculator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [display, setDisplay] = useState(initialData?.display || '0');
  const [previousValue, setPreviousValue] = useState<number | null>(initialData?.previousValue ?? null);
  const [operation, setOperation] = useState<string | null>(initialData?.operation ?? null);
  const [newNumber, setNewNumber] = useState(initialData?.newNumber ?? true);
  const [isScientific, setIsScientific] = useState(false);
  const [isRadians, setIsRadians] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeBtn, setActiveBtn] = useState<string | null>(null);
  const [history, setHistory] = useState<{ expression: string; result: string }[]>(() => {
    try {
      const saved = localStorage.getItem('calc_history');
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed)
        ? parsed
            .filter((item: any) => (
              item &&
              typeof item.expression === 'string' &&
              typeof item.result === 'string'
            ))
            .slice(0, 10)
        : [];
    } catch (e) {
      console.error("Failed to load calculator history", e);
      return [];
    }
  });

  useEffect(() => {
    onStateChange?.({ display, previousValue, operation, newNumber });
  }, [display, previousValue, operation, newNumber, onStateChange]);

  const [memory, setMemory] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('calc_memory');
      const parsed = saved ? parseFloat(saved) : 0;
      // Sentinel: Ensure memory is a valid finite number.
      return isFinite(parsed) ? parsed : 0;
    } catch (e) {
      return 0;
    }
  });

  const handleNumber = (num: string) => {
    if (newNumber) {
      setDisplay(num);
      setNewNumber(false);
    } else {
      setDisplay(display === '0' ? num : display + num);
    }
  };

  const handleDecimal = () => {
    if (newNumber) {
      setDisplay('0.');
      setNewNumber(false);
    } else if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  };

  const calculate = useCallback((a: number, b: number, op: string): number => {
    switch (op) {
      case '+': return a + b;
      case '-': return a - b;
      case '×': return a * b;
      case '÷': return b !== 0 ? a / b : NaN;
      case 'x^y': return Math.pow(a, b);
      default: return b;
    }
  }, []);

  const handleOperation = (op: string) => {
    const current = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(current);
    } else if (operation) {
      if (newNumber) {
        setOperation(op);
        return;
      }
      const result = calculate(previousValue, current, operation);

      let resultStr = '';
      if (isNaN(result)) {
        resultStr = 'Erreur';
      } else if (!isFinite(result)) {
        resultStr = 'Infini';
      } else {
        resultStr = String(Number(result.toFixed(10)));
      }

      setDisplay(resultStr);
      setPreviousValue(result);
    }

    setOperation(op);
    setNewNumber(true);
  };

  const handleMemory = (action: string) => {
    const current = parseFloat(display);
    let newMemory = memory;

    switch (action) {
      case 'MC':
        newMemory = 0;
        break;
      case 'MR':
        setDisplay(String(memory));
        setNewNumber(true);
        return;
      case 'M+':
        newMemory = memory + (isNaN(current) ? 0 : current);
        break;
      case 'M-':
        newMemory = memory - (isNaN(current) ? 0 : current);
        break;
    }

    setMemory(newMemory);
    localStorage.setItem('calc_memory', String(newMemory));
    setNewNumber(true);
  };

  const handleScientificAction = (action: string) => {
    const current = parseFloat(display);
    let result = 0;

    const angle = isRadians ? current : (current * Math.PI / 180);

    switch (action) {
      case 'sin': result = Math.sin(angle); break;
      case 'cos': result = Math.cos(angle); break;
      case 'tan': result = Math.tan(angle); break;
      case 'log': result = Math.log10(current); break;
      case 'ln': result = Math.log(current); break;
      case '√': result = Math.sqrt(current); break;
      case 'x²': result = Math.pow(current, 2); break;
      case 'exp': result = Math.exp(current); break;
      case 'abs': result = Math.abs(current); break;
      case 'n!': {
        if (current < 0 || !Number.isInteger(current)) result = NaN;
        else if (current > 170) result = Infinity;
        else if (current === 0) result = 1;
        else {
          let f = 1;
          for (let i = 1; i <= current; i++) f *= i;
          result = f;
        }
        break;
      }
      case 'π': result = Math.PI; break;
      case 'e': result = Math.E; break;
      case 'G': result = 6.67430e-11; break;
      case 'c': result = 299792458; break;
      case 'h': result = 6.62607015e-34; break;
      case 'Φ': result = 1.618033988749895; break;
      default: return;
    }

    const resultStr = isNaN(result)
      ? 'Erreur'
      : !isFinite(result)
        ? 'Infini'
        : String(Number(result.toFixed(10)));
    setDisplay(resultStr);
    setNewNumber(true);

    const expression = `${action}(${isNaN(current) ? 'Erreur' : current})`;
    const newHistory = [{ expression, result: resultStr }, ...history].slice(0, 10);
    setHistory(newHistory);
    localStorage.setItem('calc_history', JSON.stringify(newHistory));
  };

  const handleEquals = () => {
    if (operation && previousValue !== null) {
      const current = parseFloat(display);
      const result = calculate(previousValue, current, operation);
      const expression = `${isNaN(previousValue) ? 'Erreur' : previousValue} ${operation} ${isNaN(current) ? 'Erreur' : current}`;

      let resultStr = '';
      if (isNaN(result)) {
        resultStr = 'Erreur';
      } else if (!isFinite(result)) {
        resultStr = 'Infini';
      } else {
        resultStr = String(Number(result.toFixed(10)));
      }

      const newHistory = [{ expression, result: resultStr }, ...history].slice(0, 10);
      setHistory(newHistory);
      localStorage.setItem('calc_history', JSON.stringify(newHistory));

      setDisplay(resultStr);
      setPreviousValue(null);
      setOperation(null);
      setNewNumber(true);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(display);
    setCopied(true);
    toast.success(t('common.copied'));
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setNewNumber(true);
  };

  const handleDownloadHistory = () => {
    if (history.length === 0) return;
    const content = history.map(item => `${item.expression} = ${item.result}`).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `calculator-history-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleBackspace = () => {
    if (display === 'Erreur' || display === 'Infini') {
      setDisplay('0');
      setNewNumber(true);
      return;
    }
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
      setNewNumber(true);
    }
  };

  const handleToggleSign = () => {
    if (display === '0' || display === 'Erreur' || display === 'Infini') return;
    if (display.startsWith('-')) {
      setDisplay(display.substring(1));
    } else {
      setDisplay('-' + display);
    }
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('calc_history');
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        document.activeElement?.getAttribute('contenteditable') === 'true'
      ) {
        return;
      }

      let btnKey = e.key;
      if (e.key >= '0' && e.key <= '9') handleNumber(e.key);
      else if (e.key === '.' || e.key === ',') { handleDecimal(); btnKey = '.'; }
      else if (e.key === '+') handleOperation('+');
      else if (e.key === '-') handleOperation('-');
      else if (e.key === '*') { handleOperation('×'); btnKey = '×'; }
      else if (e.key === '/') {
        e.preventDefault();
        handleOperation('÷');
        btnKey = '÷';
      }
      else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        handleEquals();
        btnKey = '=';
      }
      else if (e.key === 'Backspace') { handleBackspace(); btnKey = '←'; }
      else if (e.key === 'Escape' || (e.key.toLowerCase() === 'c' && !e.metaKey && !e.ctrlKey)) {
        e.preventDefault();
        handleClear();
        btnKey = 'C';
      }
      else return;

      setActiveBtn(btnKey);
    };

    const handleKeyUp = () => setActiveBtn(null);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [display, previousValue, operation, newNumber, handleNumber, handleDecimal, handleOperation, handleEquals, handleBackspace, handleClear]);

  const standardButtons = [
    ['C', '±', '÷', '×'],
    ['7', '8', '9', '-'],
    ['4', '5', '6', '+'],
    ['1', '2', '3', '←'],
    ['0', '.', '=']
  ];

  const scientificButtons = [
    ['sin', 'cos', 'tan', 'abs', 'n!'],
    ['log', 'ln', '√', 'exp', 'Φ'],
    ['G', 'c', 'h', 'π', 'e'],
    ['C', '±', '÷', '×', 'x²'],
    ['7', '8', '9', '-', 'x^y'],
    ['4', '5', '6', '+', '.'],
    ['1', '2', '3', '0', '←'],
    ['=']
  ];

  const getColSpan = (btn: string, isScientific: boolean) => {
    if (isScientific) {
      if (btn === '=') return 'col-span-5';
    } else {
      if (btn === '0') return 'col-span-2';
    }
    return '';
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setIsScientific(false)}
            aria-pressed={!isScientific}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${!isScientific ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'}`}
          >
            {t('common.standard')}
          </button>
          <button
            onClick={() => setIsScientific(true)}
            aria-pressed={isScientific}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${isScientific ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'}`}
          >
            {t('calculator.scientific')}
          </button>
        </div>

        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          {['MC', 'MR', 'M+', 'M-'].map((m) => {
             const getMemoryLabel = (id: string) => {
               if (id === 'MC') return t('calculator.memory_clear');
               if (id === 'MR') return t('calculator.memory_recall');
               if (id === 'M+') return t('calculator.memory_add');
               if (id === 'M-') return t('calculator.memory_subtract');
               return id;
             };
             return (
              <button
                key={m}
                onClick={() => handleMemory(m)}
                aria-label={getMemoryLabel(m)}
                className="px-3 py-1.5 rounded-lg text-xs font-black text-slate-500 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-700 transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
              >
                {m}
              </button>
            );
          })}
        </div>

        {isScientific && (
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setIsRadians(false)}
              aria-pressed={!isRadians}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${!isRadians ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500'}`}
            >
              {t('calculator.degrees')}
            </button>
            <button
              onClick={() => setIsRadians(true)}
              aria-pressed={isRadians}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${isRadians ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500'}`}
            >
              {t('calculator.radians')}
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          {/* Display */}
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-right overflow-hidden group transition-all focus-within:ring-2 focus-within:ring-indigo-500/20 relative">
            <button
              onClick={handleCopy}
              disabled={display === '0' || display === 'Erreur'}
              className={`absolute top-4 left-4 p-2.5 rounded-xl transition-all z-10 border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none disabled:opacity-0 disabled:cursor-not-allowed ${
                copied
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                  : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:text-indigo-500 hover:border-indigo-500/50'
              }`}
              title={`${t('common.copy')} (Cmd+C)`}
              aria-label={t('common.copy')}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
            <div className="text-sm font-bold text-slate-400 dark:text-slate-500 mb-2 h-6 flex justify-between items-center px-1">
              <div className="flex items-center gap-2">
                {memory !== 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-md font-black" aria-label={t('calculator.memory')}>M</span>
                )}
              </div>
              <div className="flex items-center gap-2" aria-hidden="true">
                {previousValue !== null && operation && (
                  <>
                    <span>{isNaN(previousValue) ? 'Erreur' : previousValue}</span>
                    <span className="text-indigo-500">{operation}</span>
                  </>
                )}
              </div>
            </div>
            <div
              className="text-5xl md:text-6xl font-black font-mono tracking-tighter truncate dark:text-white"
              aria-live="polite"
              aria-atomic="true"
              aria-label={t('calculator.display')}
            >
              {display === 'NaN' || display === 'Infinity'
                ? (display === 'NaN' ? 'Erreur' : 'Infini')
                : display}
            </div>
          </div>

          {/* Keypad */}
          <div className="grid gap-2">
            {(isScientific ? scientificButtons : standardButtons).map((row, i) => (
              <div
                key={i}
                className="grid gap-2"
                style={{
                  gridTemplateColumns: `repeat(${isScientific ? 5 : 4}, minmax(0, 1fr))`
                }}
              >
                {row.map((btn) => {
                  const getAriaLabel = (label: string) => {
                    if (label === 'C') return t('calculator.btn.clear');
                    if (label === '←') return t('calculator.btn.backspace');
                    if (label === '±') return t('calculator.btn.plus_minus');
                    if (label === '=') return t('calculator.btn.equals');
                    if (label === '+') return t('calculator.btn.plus');
                    if (label === '-') return t('calculator.btn.minus');
                    if (label === '×') return t('calculator.btn.multiply');
                    if (label === '÷') return t('calculator.btn.divide');
                    if (label === '.') return t('calculator.btn.decimal');
                    if (label === 'Φ') return t('calculator.btn.phi');
                    if (label === 'G') return t('calculator.btn.g');
                    if (label === 'c') return t('calculator.btn.speed_light');
                    if (label === 'h') return t('calculator.btn.planck');
                    return label;
                  };

                  return (
                  <button
                    key={btn}
                    aria-label={getAriaLabel(btn)}
                    title={btn === 'C' ? `${t('calculator.btn.clear')} (Esc or C)` : btn === '=' ? `${t('calculator.btn.equals')} (Enter)` : undefined}
                    onClick={() => {
                      if (btn === 'C') handleClear();
                      else if (btn === '←') handleBackspace();
                      else if (btn === '±') handleToggleSign();
                      else if (btn === '=') handleEquals();
                      else if (['+', '-', '×', '÷', 'x^y'].includes(btn)) handleOperation(btn);
                      else if (['sin', 'cos', 'tan', 'log', 'ln', '√', 'x²', 'π', 'e', 'G', 'c', 'h', 'Φ', 'exp', 'abs', 'n!'].includes(btn)) handleScientificAction(btn);
                      else if (btn === '.') handleDecimal();
                      else handleNumber(btn);
                    }}
                    className={`h-16 md:h-20 rounded-2xl text-xl font-bold transition-all active:scale-95 flex items-center justify-center focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                      activeBtn === btn ? 'ring-4 ring-indigo-500/50 scale-95' : ''
                    } ${
                      btn === 'C'
                        ? 'bg-rose-50 text-rose-500 dark:bg-rose-500/10 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20'
                        : btn === '←'
                        ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200'
                        : btn === '='
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700'
                        : ['+', '-', '×', '÷', 'x^y'].includes(btn)
                        ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 hover:bg-indigo-100'
                        : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-100 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 shadow-sm'
                    } ${getColSpan(btn, isScientific)}`}
                  >
                    {btn === '←' ? <Delete className="w-6 h-6" /> : btn}
                  </button>
                );})}
              </div>
            ))}
          </div>
        </div>

        {/* History */}
        <div className="lg:col-span-4 bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] border border-slate-200 dark:border-slate-800 p-8">
          <div className="flex items-center justify-between mb-8 px-2">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <HistoryIcon className="w-4 h-4" /> {t('calculator.history')}
            </h3>
            <div className="flex gap-2">
              {history.length > 0 && (
                <button
                  onClick={handleDownloadHistory}
                  className="text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 p-1.5 rounded-lg transition-all"
                  aria-label={t('common.download')}
                  title={t('common.download')}
                >
                  <Download className="w-4 h-4" />
                </button>
              )}
              {history.length > 0 && (
                <button
                  onClick={clearHistory}
                  className="text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 p-1.5 rounded-lg transition-all"
                  aria-label={t('calculator.clear_history')}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {history.length === 0 ? (
              <div className="text-center py-12 px-4 space-y-3">
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-300">
                  <CalcIcon className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium text-slate-400">{t('calculator.no_history')}</p>
              </div>
            ) : (
              history.map((item, index) => (
                <button
                  key={index}
                  className="w-full text-right p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl hover:border-indigo-500/30 transition-all group animate-in slide-in-from-right-2 duration-300"
                  onClick={() => {
                    setDisplay(item.result);
                    setNewNumber(true);
                  }}
                >
                  <div className="text-xs font-bold text-slate-400 mb-1 group-hover:text-slate-500 transition-colors">{item.expression}</div>
                  <div className="text-lg font-black font-mono dark:text-slate-200">{item.result === 'NaN' ? 'Erreur' : item.result}</div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
