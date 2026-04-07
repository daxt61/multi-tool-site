import { useState, useMemo } from 'react';
import { Tag, Percent, Banknote, Trash2, Info, ShoppingCart, TrendingDown, ArrowRight } from 'lucide-react';

export function DiscountCalculator() {
  const [price, setPrice] = useState<string>('');
  const [discount1, setDiscount1] = useState<string>('');
  const [discount2, setDiscount2] = useState<string>('');

  const result = useMemo(() => {
    const p = parseFloat(price) || 0;
    const d1 = parseFloat(discount1) || 0;
    const d2 = parseFloat(discount2) || 0;

    if (p <= 0) return null;

    const savings1 = p * (d1 / 100);
    const intermediatePrice = p - savings1;
    const savings2 = intermediatePrice * (d2 / 100);
    const finalPrice = intermediatePrice - savings2;
    const totalSavings = p - finalPrice;
    const totalDiscountPercent = (totalSavings / p) * 100;

    return {
      finalPrice,
      totalSavings,
      totalDiscountPercent,
      savings1,
      savings2,
      intermediatePrice
    };
  }, [price, discount1, discount2]);

  const handleClear = () => {
    setPrice('');
    setDiscount1('');
    setDiscount2('');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Input */}
        <div className="lg:col-span-6 space-y-8 bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Paramètres du calcul</h3>
            <button
              onClick={handleClear}
              className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 transition-all px-3 py-1.5 rounded-xl flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" /> Effacer
            </button>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="price" className="text-xs font-bold text-slate-500 dark:text-slate-400 px-1 flex items-center gap-2">
                <Banknote className="w-3 h-3" /> Prix original (€)
              </label>
              <div className="relative">
                <input
                  id="price"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl text-3xl font-black font-mono outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
                />
                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-300">€</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="discount1" className="text-xs font-bold text-slate-500 dark:text-slate-400 px-1 flex items-center gap-2">
                  <Percent className="w-3 h-3" /> Remise 1 (%)
                </label>
                <div className="relative">
                  <input
                    id="discount1"
                    type="number"
                    value={discount1}
                    onChange={(e) => setDiscount1(e.target.value)}
                    placeholder="20"
                    className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xl font-black font-mono outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-slate-400">%</span>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="discount2" className="text-xs font-bold text-slate-500 dark:text-slate-400 px-1 flex items-center gap-2">
                  <Percent className="w-3 h-3" /> Remise 2 (%) <span className="text-[10px] opacity-50 ml-1">(Facultatif)</span>
                </label>
                <div className="relative">
                  <input
                    id="discount2"
                    type="number"
                    value={discount2}
                    onChange={(e) => setDiscount2(e.target.value)}
                    placeholder="0"
                    className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xl font-black font-mono outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-slate-400">%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Output */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-slate-900 dark:bg-black p-10 rounded-[2.5rem] shadow-xl shadow-indigo-500/10 flex flex-col items-center justify-center space-y-4 relative overflow-hidden text-center">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>

            <div className="text-slate-400 font-bold uppercase tracking-widest text-xs">Prix après remise</div>
            <div className="text-6xl md:text-7xl font-black text-white font-mono tracking-tighter">
              {result ? result.finalPrice.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0,00"}
            </div>
            <div className="text-emerald-400 font-black text-xl md:text-2xl uppercase tracking-widest flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" /> EUROS
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20 p-6 rounded-3xl space-y-2 text-center">
              <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center justify-center gap-2">
                <TrendingDown className="w-3 h-3" /> Économie totale
              </div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                -{result ? result.totalSavings.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) : "0,00"}€
              </div>
            </div>
            <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20 p-6 rounded-3xl space-y-2 text-center">
              <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest flex items-center justify-center gap-2">
                <Percent className="w-3 h-3" /> Remise totale
              </div>
              <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
                {result ? result.totalDiscountPercent.toFixed(1) : "0.0"}%
              </div>
            </div>
          </div>

          {result && discount2 && parseFloat(discount2) > 0 && (
            <div className="bg-white dark:bg-slate-900/40 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Détail des remises successives</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm font-medium">
                  <span className="text-slate-500">Prix initial</span>
                  <span className="font-mono dark:text-white">{parseFloat(price).toFixed(2)}€</span>
                </div>
                <div className="flex justify-between items-center text-sm font-medium text-emerald-500">
                  <span>Remise 1 (-{discount1}%)</span>
                  <span className="font-mono">-{result.savings1.toFixed(2)}€</span>
                </div>
                <div className="flex justify-between items-center text-sm font-bold border-t border-slate-100 dark:border-slate-800 pt-2">
                  <span className="text-slate-400">Sous-total</span>
                  <span className="font-mono dark:text-white">{result.intermediatePrice.toFixed(2)}€</span>
                </div>
                <div className="flex justify-between items-center text-sm font-medium text-emerald-500">
                  <span>Remise 2 (-{discount2}%)</span>
                  <span className="font-mono">-{result.savings2.toFixed(2)}€</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Info Section */}
      <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 p-8 rounded-[2.5rem] flex items-start gap-4">
        <div className="p-3 bg-white dark:bg-slate-800 text-amber-500 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <Info className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold text-amber-900 dark:text-amber-100">Comment sont calculées les remises successives ?</h4>
          <p className="text-sm text-amber-800/80 dark:text-amber-400/80 leading-relaxed">
            Lorsque vous appliquez deux remises, la deuxième ne s'applique pas au prix original mais au prix déjà réduit par la première remise.
            Par exemple, -20% puis -10% sur 100€ ne fait pas -30% (70€), mais 100€ → 80€ → 72€. La remise réelle totale est de 28%.
          </p>
        </div>
      </div>
    </div>
  );
}
