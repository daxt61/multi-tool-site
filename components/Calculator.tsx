import { useState, useEffect, useCallback } from 'react';
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

  const addToHistory = useCallback((expression: string, result: string) => {
    setHistory(prev => {
      const newHistory = [{ expression, result }, ...prev].slice(0, 10);
      localStorage.setItem('calc_history', JSON.stringify(newHistory));
      return newHistory;
    });
  }, []);

  const handleBackspace = useCallback(() => {
    if (display === 'Erreur') {
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
  }, [display]);

  const handleClear = useCallback(() => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setNewNumber(true);
  }, []);

  const handleNumber = useCallback((num: string) => {
    if (newNumber || display === 'Erreur') {
      setDisplay(num);
      setNewNumber(false);
    } else {
      setDisplay(display === '0' ? num : display + num);
    }
  }, [newNumber, display]);

  const handleDecimal = useCallback(() => {
    if (newNumber || display === 'Erreur') {
      setDisplay('0.');
      setNewNumber(false);
    } else if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  }, [newNumber, display]);

  const calculate = useCallback((a: number, b: number, op: string): number => {
    switch (op) {
      case '+': return a + b;
      case '-': return a - b;
      case '×': return a * b;
      case '÷': return b !== 0 ? a / b : NaN;
      case 'x^y':
      case '^': return Math.pow(a, b);
      default: return b;
    }
  }, []);

  const handleScientific = useCallback((func: string) => {
    const current = parseFloat(display);
    if (isNaN(current) && !['π', 'e'].includes(func)) return;

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
  }, [display, angleUnit, addToHistory]);

  const handleOperation = useCallback((op: string) => {
    const current = parseFloat(display);
    
    if (previousValue === null) {
      setPreviousValue(isNaN(current) ? null : current);
    } else if (operation) {
      const result = calculate(previousValue, current, operation);
      const resultStr = isNaN(result) ? 'Erreur' : String(result);
      setDisplay(resultStr);
      setPreviousValue(isNaN(result) ? null : result);
    }
    
    setOperation(op === 'x^y' ? '^' : op);
    setNewNumber(true);
  }, [display, previousValue, operation, calculate]);

  const handleEquals = useCallback(() => {
    if (operation && previousValue !== null) {
      const current = parseFloat(display);
      const result = calculate(previousValue, current, operation);
      const expression = `${previousValue} ${operation} ${current}`;
      const resultStr = isNaN(result) ? 'Erreur' : String(Number(result.toFixed(8)));

      if (resultStr !== 'Erreur') {
        addToHistory(expression, resultStr);
      }
      setDisplay(resultStr);
      setPreviousValue(null);
      setOperation(null);
      setNewNumber(true);
    }
  }, [display, previousValue, operation, calculate, addToHistory]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem('calc_history');
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleNumber(e.key);
      } else if (e.key === '.' || e.key === ',') {
        handleDecimal();
      } else if (e.key === '+') {
        handleOperation('+');
      } else if (e.key === '-') {
        handleOperation('-');
      } else if (e.key === '*') {
        handleOperation('×');
      } else if (e.key === '/') {
        e.preventDefault();
        handleOperation('÷');
      } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        handleEquals();
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape') {
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNumber, handleDecimal, handleOperation, handleEquals, handleBackspace, handleClear]);

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

      {/* SEO Content Section */}
      <div className="lg:col-span-3 mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-gray-200 pt-12">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Comment utiliser cette calculatrice en ligne ?</h2>
          <p className="text-gray-600 mb-4">
            Notre calculatrice gratuite propose deux modes : Simple et Scientifique. Utilisez le mode simple pour les opérations de base (addition, soustraction, multiplication, division). Basculez en mode scientifique pour accéder aux fonctions avancées comme la trigonométrie (sin, cos, tan), les logarithmes et les puissances.
          </p>
          <ul className="list-disc pl-5 text-gray-600 space-y-2">
            <li><strong>Clavier supporté :</strong> Vous pouvez utiliser les touches de votre clavier pour saisir des chiffres et des opérateurs.</li>
            <li><strong>Historique :</strong> Vos derniers calculs sont automatiquement enregistrés pour que vous puissiez les consulter plus tard.</li>
            <li><strong>Unités d'angle :</strong> En mode scientifique, choisissez entre Degrés et Radians.</li>
          </ul>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Pourquoi utiliser notre outil ?</h2>
          <p className="text-gray-600 mb-4">
            Avoir une calculatrice fiable accessible directement dans votre navigateur est essentiel pour gagner du temps. Que vous soyez étudiant, ingénieur ou que vous ayez simplement besoin de faire un calcul rapide pour vos finances personnelles, notre outil est optimisé pour être rapide et précis.
          </p>
          <p className="text-gray-600">
            Contrairement aux applications natives, notre calculatrice ne nécessite aucune installation et fonctionne sur tous les appareils, qu'il s'agisse d'un ordinateur de bureau, d'une tablette ou d'un smartphone.
          </p>
        </div>
      </div>
    </div>
  );
}
