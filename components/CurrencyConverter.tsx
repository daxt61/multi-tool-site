import { useState } from 'react';

export function CurrencyConverter() {
  const [amount, setAmount] = useState('100');
  const [fromCurrency, setFromCurrency] = useState('EUR');
  const [toCurrency, setToCurrency] = useState('USD');

  // Taux de change fictifs (base EUR)
  const rates: Record<string, number> = {
    EUR: 1,
    USD: 1.09,
    GBP: 0.86,
    JPY: 163.25,
    CHF: 0.94,
    CAD: 1.51,
    AUD: 1.68,
    CNY: 7.86,
    INR: 90.45,
    BRL: 5.42,
    RUB: 100.12,
    MXN: 18.65,
    AED: 4.01,
    SAR: 4.09
  };

  const currencies = [
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'USD', name: 'Dollar américain', symbol: '$' },
    { code: 'GBP', name: 'Livre sterling', symbol: '£' },
    { code: 'JPY', name: 'Yen japonais', symbol: '¥' },
    { code: 'CHF', name: 'Franc suisse', symbol: 'CHF' },
    { code: 'CAD', name: 'Dollar canadien', symbol: 'C$' },
    { code: 'AUD', name: 'Dollar australien', symbol: 'A$' },
    { code: 'CNY', name: 'Yuan chinois', symbol: '¥' },
    { code: 'INR', name: 'Roupie indienne', symbol: '₹' },
    { code: 'BRL', name: 'Real brésilien', symbol: 'R$' },
    { code: 'RUB', name: 'Rouble russe', symbol: '₽' },
    { code: 'MXN', name: 'Peso mexicain', symbol: 'MX$' },
    { code: 'AED', name: 'Dirham émirati', symbol: 'AED' },
    { code: 'SAR', name: 'Riyal saoudien', symbol: 'SAR' }
  ];

  const convert = () => {
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum)) return 0;
    
    // Convertir d'abord en EUR, puis vers la devise cible
    const amountInEur = amountNum / rates[fromCurrency];
    const result = amountInEur * rates[toCurrency];
    
    return result.toFixed(2);
  };

  const swapCurrencies = () => {
    const temp = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(temp);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-sm text-yellow-800">
        ℹ️ Note : Ces taux de change sont fictifs et à titre d'exemple uniquement.
      </div>

      <div className="bg-gray-50 p-6 rounded-lg mb-4">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Montant</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full p-4 border border-gray-300 rounded-lg text-2xl"
          placeholder="0.00"
        />
      </div>

      <div className="bg-gray-50 p-6 rounded-lg mb-4">
        <label className="block text-sm font-semibold text-gray-700 mb-2">De</label>
        <select
          value={fromCurrency}
          onChange={(e) => setFromCurrency(e.target.value)}
          className="w-full p-4 border border-gray-300 rounded-lg text-lg bg-white"
        >
          {currencies.map(currency => (
            <option key={currency.code} value={currency.code}>
              {currency.symbol} {currency.name} ({currency.code})
            </option>
          ))}
        </select>
      </div>

      <div className="flex justify-center mb-4">
        <button
          onClick={swapCurrencies}
          className="p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
        >
          ⇅
        </button>
      </div>

      <div className="bg-gray-50 p-6 rounded-lg mb-4">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Vers</label>
        <select
          value={toCurrency}
          onChange={(e) => setToCurrency(e.target.value)}
          className="w-full p-4 border border-gray-300 rounded-lg text-lg bg-white"
        >
          {currencies.map(currency => (
            <option key={currency.code} value={currency.code}>
              {currency.symbol} {currency.name} ({currency.code})
            </option>
          ))}
        </select>
      </div>

      <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-8 rounded-lg text-center">
        <div className="text-sm opacity-90 mb-2">Résultat</div>
        <div className="text-5xl font-bold">
          {convert()} {toCurrency}
        </div>
      </div>
    </div>
  );
}
