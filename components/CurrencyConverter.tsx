import { useState } from 'react';
import { ArrowDown, Info } from 'lucide-react';

export function CurrencyConverter() {
  const [amount, setAmount] = useState('100');
  const [fromCurrency, setFromCurrency] = useState('EUR');
  const [toCurrency, setToCurrency] = useState('USD');

  const rates: Record<string, number> = {
    EUR: 1, USD: 1.09, GBP: 0.86, JPY: 163.25, CHF: 0.94, CAD: 1.51, AUD: 1.68, CNY: 7.86, INR: 90.45, BRL: 5.42, RUB: 100.12, MXN: 18.65, AED: 4.01, SAR: 4.09,
    NZD: 1.82, SEK: 11.45, NOK: 11.58, DKK: 7.46, TRY: 35.12, SGD: 1.46, HKD: 8.52, KRW: 1452.36, ZAR: 20.45, PLN: 4.32, PHP: 61.23, IDR: 17235.45, MYR: 5.18,
    THB: 39.45, HUF: 395.12, CZK: 25.32, ILS: 4.02, CLP: 1025.45, PKR: 304.12, EGP: 53.45, TWD: 34.12, VND: 26850.12, COP: 4250.45, QAR: 3.97, KWD: 0.33, BHD: 0.41
  };

  const currencies = [
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'USD', name: 'Dollar US', symbol: '$' },
    { code: 'GBP', name: 'Livre Sterling', symbol: '£' },
    { code: 'JPY', name: 'Yen Japonais', symbol: '¥' },
    { code: 'CHF', name: 'Franc Suisse', symbol: 'CHF' },
    { code: 'CAD', name: 'Dollar Canadien', symbol: 'C$' },
    { code: 'AUD', name: 'Dollar Australien', symbol: 'A$' },
    { code: 'CNY', name: 'Yuan Chinois', symbol: '¥' },
    { code: 'INR', name: 'Roupie Indienne', symbol: '₹' },
    { code: 'BRL', name: 'Real Brésilien', symbol: 'R$' },
    { code: 'RUB', name: 'Rouble Russe', symbol: '₽' },
    { code: 'MXN', name: 'Peso Mexicain', symbol: 'MX$' },
    { code: 'AED', name: 'Dirham Émirati', symbol: 'AED' },
    { code: 'SAR', name: 'Riyal Saoudien', symbol: 'SAR' },
    { code: 'NZD', name: 'Dollar Néo-Zélandais', symbol: 'NZ$' },
    { code: 'SEK', name: 'Couronne Suédoise', symbol: 'kr' },
    { code: 'NOK', name: 'Couronne Norvégienne', symbol: 'kr' },
    { code: 'DKK', name: 'Couronne Danoise', symbol: 'kr' },
    { code: 'TRY', name: 'Lire Turque', symbol: '₺' },
    { code: 'SGD', name: 'Dollar Singapourien', symbol: 'S$' },
    { code: 'HKD', name: 'Dollar de Hong Kong', symbol: 'HK$' },
    { code: 'KRW', name: 'Won Sud-Coréen', symbol: '₩' },
    { code: 'ZAR', name: 'Rand Sud-Africain', symbol: 'R' },
    { code: 'PLN', name: 'Zloty Polonais', symbol: 'zł' },
    { code: 'PHP', name: 'Peso Philippin', symbol: '₱' },
    { code: 'IDR', name: 'Roupie Indonésienne', symbol: 'Rp' },
    { code: 'MYR', name: 'Ringgit Malaisien', symbol: 'RM' },
    { code: 'THB', name: 'Baht Thaïlandais', symbol: '฿' },
    { code: 'HUF', name: 'Forint Hongrois', symbol: 'Ft' },
    { code: 'CZK', name: 'Couronne Tchèque', symbol: 'Kč' },
    { code: 'ILS', name: 'Nouveau Shekel Israélien', symbol: '₪' },
    { code: 'CLP', name: 'Peso Chilien', symbol: 'CLP$' },
    { code: 'PKR', name: 'Roupie Pakistanaise', symbol: '₨' },
    { code: 'EGP', name: 'Livre Égyptienne', symbol: 'E£' },
    { code: 'TWD', name: 'Nouveau Dollar Taïwanais', symbol: 'NT$' },
    { code: 'VND', name: 'Dong Vietnamien', symbol: '₫' },
    { code: 'COP', name: 'Peso Colombien', symbol: 'COL$' },
    { code: 'QAR', name: 'Riyal Qatari', symbol: 'QR' },
    { code: 'KWD', name: 'Dinar Koweïtien', symbol: 'KD' },
    { code: 'BHD', name: 'Dinar Bahreïni', symbol: 'BD' }
  ];

  const result = (parseFloat(amount) / rates[fromCurrency]) * rates[toCurrency];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="space-y-6">
          <div className="space-y-3">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Montant</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl text-4xl font-black font-mono outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
              placeholder="0.00"
            />
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 px-1 uppercase tracking-widest">De</label>
              <select
                value={fromCurrency}
                onChange={(e) => setFromCurrency(e.target.value)}
                className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-sm outline-none cursor-pointer"
              >
                {currencies.map(c => <option key={c.code} value={c.code}>{c.symbol} {c.name} ({c.code})</option>)}
              </select>
            </div>
            <div className="flex justify-center -my-2">
               <button
                onClick={() => {setFromCurrency(toCurrency); setToCurrency(fromCurrency);}}
                className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors border border-slate-200 dark:border-slate-600"
               >
                 <ArrowDown className="w-5 h-5" />
               </button>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 px-1 uppercase tracking-widest">Vers</label>
              <select
                value={toCurrency}
                onChange={(e) => setToCurrency(e.target.value)}
                className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-sm outline-none cursor-pointer"
              >
                {currencies.map(c => <option key={c.code} value={c.code}>{c.symbol} {c.name} ({c.code})</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 dark:bg-black p-10 rounded-[2.5rem] text-center flex flex-col items-center justify-center space-y-4 shadow-xl shadow-indigo-500/5 min-h-[300px]">
          <div className="text-slate-400 font-bold uppercase tracking-widest text-xs">Résultat Estimé</div>
          <div className="text-6xl font-black text-white font-mono tracking-tighter">
            {isNaN(result) ? '0.00' : result.toFixed(2)}
          </div>
          <div className="text-indigo-400 font-black text-2xl uppercase tracking-widest">
            {toCurrency}
          </div>
        </div>
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/20 p-6 rounded-2xl flex items-start gap-4">
        <div className="p-2 bg-white dark:bg-slate-800 text-amber-600 rounded-xl shadow-sm">
          <Info className="w-6 h-6" />
        </div>
        <p className="text-sm text-amber-800 dark:text-amber-400 font-medium leading-relaxed">
          <strong>Note importante :</strong> Ces taux de change sont fictifs et servent uniquement à des fins de démonstration UI. Pour des transactions réelles, veuillez consulter une source financière officielle.
        </p>
      </div>
    </div>
  );
}
