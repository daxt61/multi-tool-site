import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { ArrowUpDown, Info, Copy, Check, Loader2, RefreshCw, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// ⚡ Bolt Optimization: Moved static currencies array outside component
// to prevent redundant allocations and GC pressure on every render.
const CURRENCIES = [
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

export function CurrencyConverter({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const amountRef = useRef<HTMLInputElement>(null);
  const [amount, setAmount] = useState(initialData?.amount || '100');
  const [fromCurrency, setFromCurrency] = useState(initialData?.fromCurrency || 'EUR');
  const [toCurrency, setToCurrency] = useState(initialData?.toCurrency || 'USD');
  const [rates, setRates] = useState<Record<string, number>>({
    EUR: 1, USD: 1.09, GBP: 0.86, JPY: 163.25, CHF: 0.94, CAD: 1.51, AUD: 1.68, CNY: 7.86, INR: 90.45, BRL: 5.42, RUB: 100.12, MXN: 18.65, AED: 4.01, SAR: 4.09,
    NZD: 1.82, SEK: 11.45, NOK: 11.58, DKK: 7.46, TRY: 35.12, SGD: 1.46, HKD: 8.52, KRW: 1452.36, ZAR: 20.45, PLN: 4.32, PHP: 61.23, IDR: 17235.45, MYR: 5.18,
    THB: 39.45, HUF: 395.12, CZK: 25.32, ILS: 4.02, CLP: 1025.45, PKR: 304.12, EGP: 53.45, TWD: 34.12, VND: 26850.12, COP: 4250.45, QAR: 3.97, KWD: 0.33, BHD: 0.41
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    fetchRates();
  }, []);

  useEffect(() => {
    onStateChange?.({ amount, fromCurrency, toCurrency });
  }, [amount, fromCurrency, toCurrency]);

  const fetchRates = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('https://api.frankfurter.app/latest?from=EUR');
      if (!response.ok) throw new Error('Failed to load rates');
      const data = await response.json();
      if (data.rates) {
        // Merge with existing rates to preserve currencies not in the API response
        setRates(prev => ({ ...prev, ...data.rates }));
        setLastUpdated(new Date().toLocaleTimeString());
      }
    } catch (error) {
      console.error('Failed to fetch rates:', error);
      setError(t('currency.error_fetch'));
    } finally {
      setLoading(false);
    }
  };

  // ⚡ Bolt Optimization: result calculation memoized to avoid redundant parseFloat
  // and arithmetic operations on every re-render (e.g. when 'copied' state changes).
  const result = useMemo(() => {
    const num = parseFloat(amount);
    if (isNaN(num)) return 0;
    return (num / rates[fromCurrency]) * rates[toCurrency];
  }, [amount, rates, fromCurrency, toCurrency]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(result.toFixed(2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [result]);

  const handleClear = useCallback(() => {
    setAmount('');
    amountRef.current?.focus();
  }, []);

  const handleSwap = useCallback(() => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  }, [fromCurrency, toCurrency]);

  const handleCopyRef = useRef(handleCopy);
  const handleClearRef = useRef(handleClear);
  const handleSwapRef = useRef(handleSwap);

  useEffect(() => {
    handleCopyRef.current = handleCopy;
    handleClearRef.current = handleClear;
    handleSwapRef.current = handleSwap;
  }, [handleCopy, handleClear, handleSwap]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInputFocused =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement instanceof HTMLSelectElement ||
        activeElement?.getAttribute("contenteditable") === "true";

      if (isInputFocused && e.key === "Escape") {
        e.preventDefault();
        handleClearRef.current();
        return;
      }

      if (isInputFocused) return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key === "Escape") {
        e.preventDefault();
        handleClearRef.current();
      } else if (e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSwapRef.current();
      } else if (e.key.toLowerCase() === "c") {
        e.preventDefault();
        handleCopyRef.current();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 text-sm font-bold animate-in fade-in slide-in-from-top-2">
          <Info className="w-5 h-5 shrink-0" />
          {error}
          <button onClick={fetchRates} className="ml-auto underline decoration-2 underline-offset-4 hover:opacity-80 transition-opacity">{t('common.retry') || 'Retry'}</button>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="space-y-8">
          <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="amount" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">{t('currency.amount')}</label>
              <div className="flex items-center gap-3">
                {lastUpdated && (
                  <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                    <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                    {t('currency.last_updated', { time: lastUpdated })}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <kbd className="hidden sm:inline-flex items-center justify-center px-1.5 py-0.5 border border-rose-200 dark:border-rose-800 rounded text-[10px] font-bold text-rose-400 bg-white dark:bg-slate-900">Esc</kbd>
                  <button
                    onClick={handleClear}
                    disabled={!amount}
                    className="text-xs font-bold px-3 py-1 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
                    aria-label={t('common.clear')}
                  >
                    <Trash2 className="w-3 h-3" /> {t('common.clear')}
                  </button>
                </div>
              </div>
            </div>
            <input
              id="amount"
              ref={amountRef}
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl text-4xl font-black font-mono outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
              placeholder="0.00"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 relative">
            <div className="space-y-2">
              <label htmlFor="fromCurrency" className="text-xs font-bold text-slate-400 px-1 uppercase tracking-widest cursor-pointer">{t('currency.from')}</label>
              <select
                id="fromCurrency"
                value={fromCurrency}
                onChange={(e) => setFromCurrency(e.target.value)}
                className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-sm outline-none cursor-pointer focus:border-indigo-500 transition-colors"
              >
                {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.symbol} {t(`currency.name.${c.code}`, c.name)} ({c.code})</option>)}
              </select>
            </div>

            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pt-4 flex flex-col items-center gap-1">
               <button
                onClick={handleSwap}
                className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-indigo-600/20 hover:scale-110 active:scale-95 transition-all border-4 border-white dark:border-slate-950 group focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
                aria-label={t('currency.swap')}
                title={`${t('currency.swap')} (S)`}
               >
                 <ArrowUpDown className="w-5 h-5 transition-transform group-hover:rotate-180 duration-500" />
               </button>
               <kbd className="hidden sm:inline-flex items-center justify-center w-5 h-5 border border-slate-200 dark:border-slate-800 rounded text-[10px] font-bold text-slate-400 bg-white dark:bg-slate-900">S</kbd>
            </div>

            <div className="space-y-2 pt-4">
              <label htmlFor="toCurrency" className="text-xs font-bold text-slate-400 px-1 uppercase tracking-widest cursor-pointer">{t('currency.to')}</label>
              <select
                id="toCurrency"
                value={toCurrency}
                onChange={(e) => setToCurrency(e.target.value)}
                className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-sm outline-none cursor-pointer focus:border-indigo-500 transition-colors"
              >
                {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.symbol} {t(`currency.name.${c.code}`, c.name)} ({c.code})</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 dark:bg-black p-10 rounded-[2.5rem] text-center flex flex-col items-center justify-center space-y-6 shadow-2xl shadow-indigo-500/10 min-h-[350px] relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-blue-500 opacity-50"></div>

          <div className="text-slate-400 font-bold uppercase tracking-widest text-xs">{t('currency.result')}</div>

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
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all border focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none ${
              copied
                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                : 'bg-white/10 text-white border-transparent hover:bg-white/20'
            }`}
            title={`${t('currency.copy')} (C)`}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? t('common.copied') : t('currency.copy')}
            {!copied && <kbd className="hidden sm:inline-flex items-center justify-center w-5 h-5 border border-white/20 rounded text-[10px] font-bold bg-white/5 text-white/50 ml-1">C</kbd>}
          </button>
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20 p-6 rounded-[2rem] flex items-start gap-4">
        <div className="p-2 bg-white dark:bg-slate-800 text-indigo-600 rounded-xl shadow-sm">
          <Info className="w-6 h-6" />
        </div>
        <p className="text-sm text-indigo-800 dark:text-indigo-400 font-medium leading-relaxed">
          <strong>{t('currency.source')}</strong> {t('currency.source_desc')}
        </p>
      </div>
    </div>
  );
}
