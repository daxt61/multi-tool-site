import { useState } from 'react';

export function CurrencyConverter() {
  const [amount, setAmount] = useState('100');
  const [fromCurrency, setFromCurrency] = useState('EUR');
  const [toCurrency, setToCurrency] = useState('USD');

  // Taux de change fictifs (base EUR) - Updated with more realistic but still static values
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
    SAR: 4.09,
    KRW: 1450.50,
    SGD: 1.47,
    NZD: 1.82,
    HKD: 8.52,
    SEK: 11.45,
    NOK: 11.55,
    TRY: 33.20,
    ZAR: 20.80,
    ILS: 4.05,
    PLN: 4.35,
    THB: 39.50,
    IDR: 17200.00,
    TWD: 34.40,
    MYR: 5.15,
    PHP: 61.20,
    CZK: 25.30,
    HUF: 395.00,
    CLP: 1020.00,
    COP: 4250.00,
    EGP: 52.40,
    ARS: 950.00,
    VND: 27000.00,
    MAD: 11.05
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
    { code: 'SAR', name: 'Riyal saoudien', symbol: 'SAR' },
    { code: 'KRW', name: 'Won sud-coréen', symbol: '₩' },
    { code: 'SGD', name: 'Dollar de Singapour', symbol: 'S$' },
    { code: 'NZD', name: 'Dollar néo-zélandais', symbol: 'NZ$' },
    { code: 'HKD', name: 'Dollar de Hong Kong', symbol: 'HK$' },
    { code: 'SEK', name: 'Couronne suédoise', symbol: 'kr' },
    { code: 'NOK', name: 'Couronne norvégienne', symbol: 'kr' },
    { code: 'TRY', name: 'Livre turque', symbol: '₺' },
    { code: 'ZAR', name: 'Rand sud-africain', symbol: 'R' },
    { code: 'ILS', name: 'Shekel israélien', symbol: '₪' },
    { code: 'PLN', name: 'Zloty polonais', symbol: 'zł' },
    { code: 'THB', name: 'Baht thaïlandais', symbol: '฿' },
    { code: 'IDR', name: 'Roupie indonésienne', symbol: 'Rp' },
    { code: 'TWD', name: 'Dollar de Taïwan', symbol: 'NT$' },
    { code: 'MYR', name: 'Ringgit malaisien', symbol: 'RM' },
    { code: 'PHP', name: 'Peso philippin', symbol: '₱' },
    { code: 'CZK', name: 'Couronne tchèque', symbol: 'Kč' },
    { code: 'HUF', name: 'Forint hongrois', symbol: 'Ft' },
    { code: 'CLP', name: 'Peso chilien', symbol: '$' },
    { code: 'COP', name: 'Peso colombien', symbol: '$' },
    { code: 'EGP', name: 'Livre égyptienne', symbol: 'E£' },
    { code: 'ARS', name: 'Peso argentin', symbol: '$' },
    { code: 'VND', name: 'Dong vietnamien', symbol: '₫' },
    { code: 'MAD', name: 'Dirham marocain', symbol: 'DH' }
  ].sort((a, b) => a.name.localeCompare(b.name));

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
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 text-sm text-amber-800 flex items-start gap-3 shadow-sm">
        <span className="text-xl">⚠️</span>
        <div>
          <p className="font-bold">Attention</p>
          <p className="opacity-90">Les taux de change sont indicatifs et basés sur des valeurs moyennes. Pour des transactions réelles, veuillez consulter une institution financière.</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700 ml-1">Montant à convertir</label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-3xl font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all pl-12"
                placeholder="0.00"
              />
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-gray-400 font-bold">
                {currencies.find(c => c.code === fromCurrency)?.symbol}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] items-center gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700 ml-1">De</label>
              <select
                value={fromCurrency}
                onChange={(e) => setFromCurrency(e.target.value)}
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-lg font-semibold outline-none hover:border-gray-300 transition-colors"
              >
                {currencies.map(currency => (
                  <option key={currency.code} value={currency.code}>
                    {currency.code} - {currency.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={swapCurrencies}
              className="mt-6 p-4 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all shadow-md active:scale-90"
              title="Inverser les devises"
            >
              <span className="text-xl block rotate-90 md:rotate-0">⇄</span>
            </button>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700 ml-1">Vers</label>
              <select
                value={toCurrency}
                onChange={(e) => setToCurrency(e.target.value)}
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-lg font-semibold outline-none hover:border-gray-300 transition-colors"
              >
                {currencies.map(currency => (
                  <option key={currency.code} value={currency.code}>
                    {currency.code} - {currency.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-indigo-600 to-blue-700 text-white p-10 rounded-2xl text-center shadow-xl">
        <div className="text-sm font-medium opacity-70 mb-2 uppercase tracking-widest">Résultat de la conversion</div>
        <div className="flex items-center justify-center gap-4">
          <span className="text-2xl opacity-50 font-mono">{amount} {fromCurrency} =</span>
          <div className="text-6xl font-black font-mono">
            {convert()} <span className="text-2xl font-bold opacity-80">{toCurrency}</span>
          </div>
        </div>
        <div className="mt-6 pt-6 border-t border-white/10 text-xs opacity-60">
          1 {fromCurrency} ≈ {(rates[toCurrency] / rates[fromCurrency]).toFixed(4)} {toCurrency}
        </div>
      </div>
    </div>
  );
}
