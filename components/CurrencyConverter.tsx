import { useState, useEffect } from 'react';
import { ArrowUpDown, Info, Copy, Check, Loader2, RefreshCw } from 'lucide-react';

export function CurrencyConverter() {
  const [amount, setAmount] = useState('100');
  const [fromCurrency, setFromCurrency] = useState('EUR');
  const [toCurrency, setToCurrency] = useState('USD');
  const [rates, setRates] = useState<Record<string, number>>({
    EUR: 1, USD: 1.09, GBP: 0.86, JPY: 163.25, CHF: 0.94, CAD: 1.51, AUD: 1.68, CNY: 7.86, INR: 90.45, BRL: 5.42, RUB: 100.12, MXN: 18.65, AED: 4.01, SAR: 4.09,
    NZD: 1.82, SEK: 11.45, NOK: 11.58, DKK: 7.46, TRY: 35.12, SGD: 1.46, HKD: 8.52, KRW: 1452.36, ZAR: 20.45, PLN: 4.32, PHP: 61.23, IDR: 17235.45, MYR: 5.18,
    THB: 39.45, HUF: 395.12, CZK: 25.32, ILS: 4.02, CLP: 1025.45, PKR: 304.12, EGP: 53.45, TWD: 34.12, VND: 26850.12, COP: 4250.45, QAR: 3.97, KWD: 0.33, BHD: 0.41
  });
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    fetchRates();
  }, []);

  const fetchRates = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://api.frankfurter.app/latest?from=EUR');
      const data = await response.json();
      if (data.rates) {
        setRates({ EUR: 1, ...data.rates });
        setLastUpdated(new Date().toLocaleTimeString());
      }
    } catch (error) {
      console.error('Failed to fetch rates:', error);
    } finally {
      setLoading(false);
    }
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

  const handleCopy = () => {
    navigator.clipboard.writeText(result.toFixed(2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="space-y-8">
          <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="currency-amount" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">Montant à convertir</label>
              {lastUpdated && (
                <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                  <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                  Actualisé à {lastUpdated}
                </div>
              )}
            </div>
            <input
              id="currency-amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl text-4xl font-black font-mono outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
              placeholder="0.00"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 relative">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 px-1 uppercase tracking-widest">De</label>
              <select
                value={fromCurrency}
                onChange={(e) => setFromCurrency(e.target.value)}
                className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-sm outline-none cursor-pointer focus:border-indigo-500 transition-colors"
              >
                {currencies.map(c => <option key={c.code} value={c.code}>{c.symbol} {c.name} ({c.code})</option>)}
              </select>
            </div>

            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pt-4">
               <button
                onClick={() => {setFromCurrency(toCurrency); setToCurrency(fromCurrency);}}
                className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-indigo-600/20 hover:scale-110 active:scale-95 transition-all border-4 border-white dark:border-slate-950"
                aria-label="Inverser les devises"
               >
                 <ArrowUpDown className="w-5 h-5" />
               </button>
            </div>

            <div className="space-y-2 pt-4">
              <label className="text-xs font-bold text-slate-400 px-1 uppercase tracking-widest">Vers</label>
              <select
                value={toCurrency}
                onChange={(e) => setToCurrency(e.target.value)}
                className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-sm outline-none cursor-pointer focus:border-indigo-500 transition-colors"
              >
                {currencies.map(c => <option key={c.code} value={c.code}>{c.symbol} {c.name} ({c.code})</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 dark:bg-black p-10 rounded-[2.5rem] text-center flex flex-col items-center justify-center space-y-6 shadow-2xl shadow-indigo-500/10 min-h-[350px] relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-blue-500 opacity-50"></div>

          <div className="text-slate-400 font-bold uppercase tracking-widest text-xs">Résultat Estimé</div>

          <div className="space-y-1">
            <div className="text-6xl md:text-7xl font-black text-white font-mono tracking-tighter">
              {loading ? (
                <Loader2 className="w-12 h-12 animate-spin mx-auto text-indigo-500" />
              ) : (
                isNaN(result) ? '0.00' : result.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
              )}
            </div>
            <div className="text-indigo-400 font-black text-2xl uppercase tracking-widest">
              {toCurrency}
            </div>
          </div>

          <button
            onClick={handleCopy}
            disabled={loading || isNaN(result)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
              copied
                ? 'bg-emerald-500 text-white'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copié !' : 'Copier le montant'}
          </button>
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20 p-6 rounded-[2rem] flex items-start gap-4">
        <div className="p-2 bg-white dark:bg-slate-800 text-indigo-600 rounded-xl shadow-sm">
          <Info className="w-6 h-6" />
        </div>
        <p className="text-sm text-indigo-800 dark:text-indigo-400 font-medium leading-relaxed">
          <strong>Source des données :</strong> Les taux de change sont récupérés en temps réel via l'API Frankfurter. Bien que nous nous efforcions de fournir des données précises, ces taux sont à titre indicatif et peuvent varier légèrement des taux de change officiels de votre banque.
        </p>
      </div>
    </div>
  );
}
