import { useState, useEffect } from 'react';
import { History as HistoryIcon, Trash2 } from 'lucide-react';

export function Calculator() {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [newNumber, setNewNumber] = useState(true);
  const [isScientific, setIsScientific] = useState(false);
  const [angleUnit, setAngleUnit] = useState<'deg' | 'rad'>('deg');
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

  const handleScientific = (func: string) => {
    const current = parseFloat(display);
    let result = 0;
    let expression = '';

    const toRad = (val: number) => angleUnit === 'deg' ? (val * Math.PI) / 180 : val;
    const unitLabel = angleUnit === 'deg' ? '°' : 'rad';

    switch (func) {
      case 'sin':
        result = Math.sin(toRad(current));
        expression = `sin(${current}${unitLabel})`;
        break;
      case 'cos':
        result = Math.cos(toRad(current));
        expression = `cos(${current}${unitLabel})`;
        break;
      case 'tan':
        result = Math.tan(toRad(current));
        expression = `tan(${current}${unitLabel})`;
        break;
      case 'sqrt':
      case '√':
        result = Math.sqrt(current);
        expression = `√(${current})`;
        break;
      case 'log':
        result = Math.log10(current);
        expression = `log(${current})`;
        break;
      case 'ln':
        result = Math.log(current);
        expression = `ln(${current})`;
        break;
      case 'x²':
        result = Math.pow(current, 2);
        expression = `${current}²`;
        break;
      case 'π':
        setDisplay(String(Math.PI));
        setNewNumber(false);
        return;
      case 'e':
        setDisplay(String(Math.E));
        setNewNumber(false);
        return;
      default:
        return;
    }

    const resultStr = String(Number(result.toFixed(8)));
    addToHistory(expression, resultStr);
    setDisplay(resultStr);
    setNewNumber(true);
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
    
    setOperation(op === 'x^y' ? '^' : op);
    setNewNumber(true);
  };

  const calculate = (a: number, b: number, op: string): number => {
    switch (op) {
      case '+': return a + b;
      case '-': return a - b;
      case '×': return a * b;
      case '÷': return b !== 0 ? a / b : 0;
      case '^':
      case 'x^y': return Math.pow(a, b);
      default: return b;
    }
  };

  const addToHistory = (expression: string, result: string) => {
    const newHistory = [{ expression, result }, ...history].slice(0, 10);
    setHistory(newHistory);
    localStorage.setItem('calc_history', JSON.stringify(newHistory));
  };

  const handleEquals = () => {
    if (operation && previousValue !== null) {
      const current = parseFloat(display);
      const result = calculate(previousValue, current, operation);
      const expression = `${previousValue} ${operation} ${current}`;
      const resultStr = String(Number(result.toFixed(8)));

      addToHistory(expression, resultStr);
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

  const simpleButtons = [
    ['C', '←', '÷', '×'],
    ['7', '8', '9', '-'],
    ['4', '5', '6', '+'],
    ['1', '2', '3', '0'],
    ['.', '=']
  ];

  const scientificButtons = [
    ['sin', 'cos', 'tan', 'C', '←'],
    ['log', 'ln', '√', 'x²', '÷'],
    ['x^y', 'π', 'e', '7', '8'],
    ['9', '×', '4', '5', '6'],
    ['-', '1', '2', '3', '0'],
    ['.', '=']
  ];

  return (
    <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <div className="flex justify-end mb-4 gap-2">
          {isScientific && (
            <button
              onClick={() => setAngleUnit(angleUnit === 'deg' ? 'rad' : 'deg')}
              className="text-sm bg-white hover:bg-gray-100 px-4 py-2 rounded-xl shadow-sm transition-all font-semibold text-indigo-600 border border-indigo-100 flex items-center gap-2"
            >
              {angleUnit === 'deg' ? 'Degrés (°)' : 'Radians (rad)'}
            </button>
          )}
          <button
            onClick={() => setIsScientific(!isScientific)}
            className="text-sm bg-white hover:bg-gray-100 px-4 py-2 rounded-xl shadow-sm transition-all font-semibold text-gray-700 border border-gray-100 flex items-center gap-2"
          >
            {isScientific ? 'Mode Simple' : 'Mode Scientifique'}
          </button>
        </div>

        <div className="bg-gray-900 text-white p-6 rounded-2xl mb-4 text-right shadow-inner">
          <div className="text-sm text-gray-400 mb-2 h-6 font-mono">
            {previousValue !== null && operation ? `${previousValue} ${operation}` : ''}
          </div>
          <div className="text-5xl font-mono break-all overflow-hidden h-16 flex items-center justify-end">
            {display}
          </div>
        </div>

        <div className="grid gap-2">
          {(isScientific ? scientificButtons : simpleButtons).map((row, i) => (
            <div
              key={i}
              className="grid gap-2"
              style={{ gridTemplateColumns: `repeat(${isScientific ? 5 : 4}, minmax(0, 1fr))` }}
            >
              {row.map((btn) => (
                <button
                  key={btn}
                  onClick={() => {
                    if (btn === 'C') handleClear();
                    else if (btn === '←') handleBackspace();
                    else if (btn === '=') handleEquals();
                    else if (['+', '-', '×', '÷', 'x^y'].includes(btn)) handleOperation(btn);
                    else if (['sin', 'cos', 'tan', 'log', 'ln', '√', 'x²', 'π', 'e'].includes(btn)) handleScientific(btn);
                    else if (btn === '.') handleDecimal();
                    else handleNumber(btn);
                  }}
                  style={(isScientific && btn === '=') ? { gridColumn: 'span 4 / span 4' } : (!isScientific && btn === '=') ? { gridColumn: 'span 3 / span 3' } : {}}
                  className={`p-4 rounded-xl font-semibold text-lg transition-all active:scale-95 shadow-sm min-h-[64px] flex items-center justify-center ${
                    btn === 'C' || btn === '←'
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : btn === '='
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                      : ['+', '-', '×', '÷', 'x^y'].includes(btn)
                      ? 'bg-blue-500 text-white hover:bg-blue-600'
                      : ['sin', 'cos', 'tan', 'log', 'ln', '√', 'x²', 'π', 'e'].includes(btn)
                      ? 'bg-gray-700 text-gray-100 hover:bg-gray-600'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  } ${isScientific && ['sin', 'cos', 'tan', 'log', 'ln', '√', 'x²', 'π', 'e'].includes(btn) ? 'text-sm' : ''}`}
                >
                  {btn}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 font-bold text-gray-700">
            <HistoryIcon className="w-5 h-5 text-indigo-500" />
            Historique
          </div>
          {history.length > 0 && (
            <button
              onClick={clearHistory}
              className="text-gray-400 hover:text-red-500 p-1 transition-colors"
              title="Effacer l'historique"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="space-y-3">
          {history.length === 0 ? (
            <div className="text-center py-12">
              <HistoryIcon className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">
                Aucun historique récent
              </p>
            </div>
          ) : (
            history.map((item, index) => (
              <div
                key={index}
                className="bg-white p-3 rounded-xl border border-gray-100 text-right cursor-pointer hover:border-indigo-300 hover:shadow-sm transition-all group"
                onClick={() => {
                  setDisplay(item.result);
                  setNewNumber(true);
                }}
              >
                <div className="text-xs text-gray-400 mb-1 group-hover:text-indigo-400">{item.expression} =</div>
                <div className="font-mono font-bold text-gray-800">{item.result}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
