import { useState, useMemo } from "react";
import { PiggyBank, TrendingUp, Wallet, RotateCcw, Coins, Calendar, Percent, Info, Banknote } from "lucide-react";

export function SavingsCalculator() {
  const [initialAmount, setInitialAmount] = useState<string>("");
  const [monthlyDeposit, setMonthlyDeposit] = useState<string>("");
  const [annualRate, setAnnualRate] = useState<string>("");
  const [years, setYears] = useState<string>("");

  const result = useMemo(() => {
    const p = parseFloat(initialAmount) || 0;
    const pmt = parseFloat(monthlyDeposit) || 0;
    const r = (parseFloat(annualRate) || 0) / 100 / 12;
    const n = (parseFloat(years) || 0) * 12;

    if (n > 0) {
      let finalAmount: number;

      if (r > 0) {
        const compoundedPrincipal = p * Math.pow(1 + r, n);
        const futureValueOfDeposits = pmt * ((Math.pow(1 + r, n) - 1) / r);
        finalAmount = compoundedPrincipal + futureValueOfDeposits;
      } else {
        finalAmount = p + pmt * n;
      }

      const totalDeposited = p + pmt * n;
      const totalInterest = finalAmount - totalDeposited;

      return {
        finalAmount,
        totalDeposited,
        totalInterest,
      };
    }
    return null;
  }, [initialAmount, monthlyDeposit, annualRate, years]);

  const handleClear = () => {
    setInitialAmount("");
    setMonthlyDeposit("");
    setAnnualRate("");
    setYears("");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="initialAmount" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Banknote className="w-3 h-3" /> Capital initial
            </label>
            <button
              onClick={handleClear}
              className="text-xs font-bold text-indigo-500 hover:text-indigo-600 flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" /> Effacer
            </button>
          </div>
          <div className="relative">
            <input
              id="initialAmount"
              type="number"
              value={initialAmount}
              onChange={(e) => setInitialAmount(e.target.value)}
              className="w-full p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl text-3xl md:text-4xl font-black font-mono outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
              placeholder="1000"
            />
            <span className="absolute right-6 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-300">€</span>
          </div>

          <div className="space-y-3">
            <label htmlFor="monthlyDeposit" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-2">
              <Wallet className="w-3 h-3" /> Versement mensuel
            </label>
            <div className="relative">
              <input
                id="monthlyDeposit"
                type="number"
                value={monthlyDeposit}
                onChange={(e) => setMonthlyDeposit(e.target.value)}
                className="w-full p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
                placeholder="100"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-slate-400">€</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <label htmlFor="annualRate" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-2">
                <Percent className="w-3 h-3" /> Taux annuel
              </label>
              <div className="relative">
                <input
                  id="annualRate"
                  type="number"
                  value={annualRate}
                  onChange={(e) => setAnnualRate(e.target.value)}
                  className="w-full p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
                  placeholder="3"
                  step="0.01"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-slate-400">%</span>
              </div>
            </div>
            <div className="space-y-3">
              <label htmlFor="years" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-2">
                <Calendar className="w-3 h-3" /> Durée (ans)
              </label>
              <input
                id="years"
                type="number"
                value={years}
                onChange={(e) => setYears(e.target.value)}
                className="w-full p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
                placeholder="10"
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 dark:bg-black p-10 rounded-[2.5rem] shadow-xl shadow-indigo-500/10 flex flex-col items-center justify-center space-y-4 min-h-[300px] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>

            <div className="text-slate-400 font-bold uppercase tracking-widest text-xs">Capital final estimé</div>
            <div className="text-5xl md:text-6xl font-black text-white font-mono tracking-tighter">
              {result ? result.finalAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0,00"}
            </div>
            <div className="text-indigo-400 font-black text-xl md:text-2xl uppercase tracking-widest">
              EUROS
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2 text-center">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2">
                <Coins className="w-3 h-3" /> Total versé
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                {result ? result.totalDeposited.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) : "0,00"}€
              </div>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20 p-6 rounded-3xl space-y-2 text-center">
              <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center justify-center gap-2">
                <TrendingUp className="w-3 h-3" /> Intérêts
              </div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                +{result ? result.totalInterest.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) : "0,00"}€
              </div>
            </div>
          </div>

          {!result && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[2rem] flex items-start gap-4">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                <Info className="w-6 h-6" />
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                Simulez la croissance de votre épargne en fonction de vos versements et du taux d'intérêt composé.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Educational Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-600">
            <PiggyBank className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black">L'intérêt composé</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            C'est l'effet "boule de neige" : vos intérêts génèrent eux-mêmes des intérêts. Plus vous épargnez longtemps, plus cet effet est puissant.
          </p>
        </div>

        <div className="space-y-4">
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center text-emerald-600">
            <TrendingUp className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black">La régularité</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Épargner un petit montant chaque mois est souvent plus efficace que de verser une grosse somme ponctuellement, grâce au lissage dans le temps.
          </p>
        </div>

        <div className="space-y-4">
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center text-amber-600">
            <Info className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black">Inflation</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            N'oubliez pas que l'inflation réduit le pouvoir d'achat de votre monnaie. Un taux d'intérêt supérieur à l'inflation est nécessaire pour réellement s'enrichir.
          </p>
        </div>
      </div>
    </div>
  );
}
