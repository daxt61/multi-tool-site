import { useState, useEffect } from 'react';
import { History as HistoryIcon, Trash2, Delete, Calculator as CalcIcon } from 'lucide-react';

export function Calculator() {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [newNumber, setNewNumber] = useState(true);
  const [isScientific, setIsScientific] = useState(false);
  const [isRadians, setIsRadians] = useState(false);
  const [history, setHistory] = useState<{ expression: string; result: string }[]>(() => {
    const saved = localStorage.getItem('calc_history');
    return saved ? JSON.parse(saved) : [];
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

  const handleOperation = (op: string) => {
    const current = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(current);
    } else if (operation) {
      const result = calculate(previousValue, current, operation);
      setDisplay(String(result));
      setPreviousValue(result);
    }

    setOperation(op);
    setNewNumber(true);
  };

  const calculate = (a: number, b: number, op: string): number => {
    switch (op) {
      case '+': return a + b;
      case '-': return a - b;
      case '×': return a * b;
      case '÷': return b !== 0 ? a / b : NaN;
      case 'x^y': return Math.pow(a, b);
      default: return b;
    }
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
        if (current < 0) result = NaN;
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
      default: return;
    }

    const resultStr = isNaN(result) ? 'Erreur' : String(Number(result.toFixed(10)));
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
      const resultStr = isNaN(result) ? 'Erreur' : String(result);

      const newHistory = [{ expression, result: resultStr === 'NaN' ? 'Erreur' : resultStr }, ...history].slice(0, 10);
      setHistory(newHistory);
      localStorage.setItem('calc_history', JSON.stringify(newHistory));

      setDisplay(resultStr);
      setPreviousValue(null);
      setOperation(null);
      setNewNumber(true);
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setNewNumber(true);
  };

  const handleBackspace = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
      setNewNumber(true);
    }
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('calc_history');
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') handleNumber(e.key);
      if (e.key === '.') handleDecimal();
      if (e.key === ',') handleDecimal();
      if (e.key === '+') handleOperation('+');
      if (e.key === '-') handleOperation('-');
      if (e.key === '*') handleOperation('×');
      if (e.key === '/') {
        e.preventDefault();
        handleOperation('÷');
      }
      if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        handleEquals();
      }
      if (e.key === 'Backspace') handleBackspace();
      if (e.key === 'Escape') handleClear();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [display, previousValue, operation, newNumber]);

  const standardButtons = [
    ['C', '←', '÷', '×'],
    ['7', '8', '9', '-'],
    ['4', '5', '6', '+'],
    ['1', '2', '3', '.'],
    ['0', '=']
  ];

  const scientificButtons = [
    ['sin', 'cos', 'tan', 'abs', 'n!'],
    ['log', 'ln', '√', 'exp', 'π'],
    ['C', '←', '÷', '×', 'e'],
    ['7', '8', '9', '-', 'x²'],
    ['4', '5', '6', '+', 'x^y'],
    ['1', '2', '3', '0', '.'],
    ['=']
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setIsScientific(false)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${!isScientific ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'}`}
          >
            Standard
          </button>
          <button
            onClick={() => setIsScientific(true)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${isScientific ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'}`}
          >
            Scientifique
          </button>
        </div>

        {isScientific && (
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setIsRadians(false)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${!isRadians ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500'}`}
            >
              DEG
            </button>
            <button
              onClick={() => setIsRadians(true)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${isRadians ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500'}`}
            >
              RAD
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          {/* Display */}
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-right overflow-hidden group transition-all focus-within:ring-2 focus-within:ring-indigo-500/20">
            <div className="text-sm font-bold text-slate-400 dark:text-slate-500 mb-2 h-6 flex justify-end items-center gap-2">
              {previousValue !== null && operation && (
                <>
                  <span>{isNaN(previousValue) ? 'Erreur' : previousValue}</span>
                  <span className="text-indigo-500">{operation}</span>
                </>
              )}
            </div>
            <div className="text-5xl md:text-6xl font-black font-mono tracking-tighter truncate dark:text-white">
              {display === 'NaN' ? 'Erreur' : display}
            </div>
          </div>

          {/* Keypad */}
          <div className="grid gap-2">
            {(isScientific ? scientificButtons : standardButtons).map((row, i) => (
              <div
                key={i}
                className="grid gap-2"
                style={{
                  gridTemplateColumns: `repeat(${row.length === 1 ? (isScientific ? 5 : 4) : row.length}, minmax(0, 1fr))`
                }}
              >
                {row.map((btn) => (
                  <button
                    key={btn}
                    onClick={() => {
                      if (btn === 'C') handleClear();
                      else if (btn === '←') handleBackspace();
                      else if (btn === '=') handleEquals();
                      else if (['+', '-', '×', '÷', 'x^y'].includes(btn)) handleOperation(btn);
                      else if (['sin', 'cos', 'tan', 'log', 'ln', '√', 'x²', 'π', 'e', 'exp', 'abs', 'n!'].includes(btn)) handleScientificAction(btn);
                      else if (btn === '.') handleDecimal();
                      else handleNumber(btn);
                    }}
                    className={`h-16 md:h-20 rounded-2xl text-xl font-bold transition-all active:scale-95 flex items-center justify-center ${
                      btn === 'C'
                        ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 hover:bg-rose-100'
                        : btn === '←'
                        ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200'
                        : btn === '='
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700'
                        : ['+', '-', '×', '÷', 'x^y'].includes(btn)
                        ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 hover:bg-indigo-100'
                        : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-100 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 shadow-sm'
                    } ${row.length === 1 ? 'col-span-full' : ''}`}
                  >
                    {btn === '←' ? <Delete className="w-6 h-6" /> : btn}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* History */}
        <div className="lg:col-span-4 bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] border border-slate-200 dark:border-slate-800 p-8">
          <div className="flex items-center justify-between mb-8 px-2">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <HistoryIcon className="w-4 h-4" /> Historique
            </h3>
            {history.length > 0 && (
              <button
                onClick={clearHistory}
                className="text-slate-400 hover:text-rose-500 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="space-y-4">
            {history.length === 0 ? (
              <div className="text-center py-12 px-4 space-y-3">
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-300">
                  <CalcIcon className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium text-slate-400">Aucun calcul récent</p>
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
