import { useState } from 'react';

export function Calculator() {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [newNumber, setNewNumber] = useState(true);

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
      case '÷': return b !== 0 ? a / b : 0;
      default: return b;
    }
  };

  const handleEquals = () => {
    if (operation && previousValue !== null) {
      const current = parseFloat(display);
      const result = calculate(previousValue, current, operation);
      setDisplay(String(result));
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

  const buttons = [
    ['C', '←', '÷'],
    ['7', '8', '9', '×'],
    ['4', '5', '6', '-'],
    ['1', '2', '3', '+'],
    ['0', '.', '=']
  ];

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-gray-900 text-white p-6 rounded-lg mb-4 text-right">
        <div className="text-sm text-gray-400 mb-2 h-6">
          {previousValue !== null && operation ? `${previousValue} ${operation}` : ''}
        </div>
        <div className="text-4xl font-mono break-all">
          {display}
        </div>
      </div>

      <div className="grid gap-2">
        {buttons.map((row, i) => (
          <div key={i} className="grid grid-cols-4 gap-2">
            {row.map((btn) => (
              <button
                key={btn}
                onClick={() => {
                  if (btn === 'C') handleClear();
                  else if (btn === '←') handleBackspace();
                  else if (btn === '=') handleEquals();
                  else if (['+', '-', '×', '÷'].includes(btn)) handleOperation(btn);
                  else if (btn === '.') handleDecimal();
                  else handleNumber(btn);
                }}
                className={`p-4 rounded-lg font-semibold text-lg transition-all ${
                  btn === 'C' || btn === '←'
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : btn === '='
                    ? 'bg-green-500 text-white hover:bg-green-600'
                    : ['+', '-', '×', '÷'].includes(btn)
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gray-200 hover:bg-gray-300'
                } ${btn === '0' ? 'col-span-2' : ''}`}
              >
                {btn}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
