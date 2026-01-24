import { useState, useEffect, useCallback } from 'react';
import { History as HistoryIcon, Trash2 } from 'lucide-react';

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

  const handleBackspace = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
      setNewNumber(true);
    }
  };

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

  const clearHistory = () => {
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

  return (
    <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
      <div className="md:col-span-2">
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          {isScientific && (
            <button
              onClick={() => setIsRadians(!isRadians)}
              className={`text-xs px-3 py-1 rounded-full transition-all font-bold ${
                isRadians
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}
            >
              {isRadians ? 'RAD' : 'DEG'}
            </button>
          )}
        </div>
        <button
          onClick={() => setIsScientific(!isScientific)}
          className="text-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 px-3 py-1 rounded-full transition-colors font-medium text-gray-600 dark:text-gray-400"
        >
          {isScientific ? 'Mode Simple' : 'Mode Scientifique'}
        </button>
      </div>

      <div className="bg-gray-900 dark:bg-black text-white p-6 rounded-lg mb-4 text-right shadow-inner">
        <div className="text-sm text-gray-400 mb-2 h-6">
          {previousValue !== null && operation ? `${previousValue} ${operation}` : ''}
        </div>
        <div className="text-4xl font-mono break-all">
          {display}
        </div>
      </div>

      <div className="grid gap-1.5 md:gap-2">
        {(isScientific ? scientificButtons : standardButtons).map((row, i) => (
          <div
            key={i}
            className="grid gap-1.5 md:gap-2"
            style={{
              gridTemplateColumns: `repeat(${isScientific ? 5 : 4}, minmax(0, 1fr))`
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
                className={`p-3 md:p-4 rounded-lg font-semibold text-base md:text-lg transition-all flex items-center justify-center min-h-[50px] md:min-h-[60px] ${
                  btn === 'C' || btn === '←'
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : btn === '='
                    ? 'bg-green-500 hover:bg-green-600 text-white'
                    : ['+', '-', '×', '÷', 'x^y'].includes(btn)
                    ? 'bg-blue-500 hover:bg-blue-600 text-white'
                    : ['sin', 'cos', 'tan', 'log', 'ln', '√', 'x²', 'π', 'e', 'exp', 'abs', 'n!'].includes(btn)
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                } ${isScientific && btn === '=' ? 'col-span-5' : (!isScientific && btn === '=') ? 'col-span-3' : ''}`}
              >
                {btn}
              </button>
            ))}
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

      <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-lg border border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 font-semibold text-gray-700 dark:text-gray-300">
            <HistoryIcon className="w-5 h-5" />
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
                className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700 text-right cursor-pointer hover:border-blue-300 dark:hover:border-blue-500 transition-colors"
                onClick={() => {
                  setDisplay(item.result);
                  setNewNumber(true);
                }}
              >
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{item.expression} =</div>
                <div className="font-mono font-bold text-gray-800 dark:text-gray-100">{item.result}</div>
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
