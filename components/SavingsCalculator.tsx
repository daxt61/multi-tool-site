import { useState, useMemo } from "react";
import { PiggyBank, TrendingUp, Clock, Percent, RotateCcw, Table, Info, BookOpen, ChevronRight, Calculator, Landmark } from "lucide-react";

export function SavingsCalculator() {
  const [initialAmount, setInitialAmount] = useState<string>("1000");
  const [monthlyDeposit, setMonthlyDeposit] = useState<string>("100");
  const [annualRate, setAnnualRate] = useState<string>("3");
  const [years, setYears] = useState<string>("10");
  const [showSchedule, setShowSchedule] = useState(false);

  const result = useMemo(() => {
    const p = parseFloat(initialAmount) || 0;
    const pmt = parseFloat(monthlyDeposit) || 0;
    const r = (parseFloat(annualRate) || 0) / 100 / 12;
    const n = (parseFloat(years) || 0) * 12;

    if (n > 0) {
      let finalAmount: number;
      const schedule = [];
      let currentBalance = p;
      let totalDeposited = p;

      for (let i = 1; i <= n; i++) {
        const interestForMonth = currentBalance * r;
        currentBalance += interestForMonth + pmt;
        totalDeposited += pmt;

        if (i % 12 === 0 || i === n) {
          schedule.push({
            year: i / 12,
            month: i,
            balance: currentBalance,
            totalDeposited,
            totalInterest: currentBalance - totalDeposited
          });
        }
      }

      if (r > 0) {
        const compoundedPrincipal = p * Math.pow(1 + r, n);
        const futureValueOfDeposits = pmt * ((Math.pow(1 + r, n) - 1) / r);
        finalAmount = compoundedPrincipal + futureValueOfDeposits;
      } else {
        finalAmount = p + pmt * n;
      }

      return {
        finalAmount,
        totalDeposited,
        totalInterest: finalAmount - totalDeposited,
        schedule
      };
    }
    return null;
  }, [initialAmount, monthlyDeposit, annualRate, years]);

  const handleClear = () => {
    setInitialAmount("");
    setMonthlyDeposit("");
    setAnnualRate("");
    setYears("");
    setShowSchedule(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="initialAmount" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Landmark className="w-3 h-3" /> Capital initial
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
              <TrendingUp className="w-3 h-3" /> Versement mensuel
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
                <Clock className="w-3 h-3" /> Durée (ans)
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

          {result && (
            <button
              onClick={() => setShowSchedule(!showSchedule)}
              className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${
                showSchedule
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                  : "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40"
              }`}
            >
              <Table className="w-5 h-5" /> {showSchedule ? "Masquer le tableau" : "Voir l'évolution annuelle"}
            </button>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 dark:bg-black p-10 rounded-[2.5rem] shadow-xl shadow-indigo-500/10 flex flex-col items-center justify-center space-y-4 min-h-[300px] relative overflow-hidden">
             <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl"></div>

             <div className="text-slate-400 font-bold uppercase tracking-widest text-xs">Capital final estimé</div>
             <div className="text-5xl md:text-7xl font-black text-white font-mono tracking-tighter">
               {result ? result.finalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
             </div>
             <div className="text-indigo-400 font-black text-xl md:text-2xl uppercase tracking-widest text-center">
               EUROS
             </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2 text-center">
               <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total versé</div>
               <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                 {result ? result.totalDeposited.toFixed(2) : "0.00"}€
               </div>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20 p-6 rounded-3xl space-y-2 text-center">
               <div className="text-xs font-bold text-emerald-500 dark:text-emerald-400 uppercase tracking-widest">Intérêts gagnés</div>
               <div className="text-2xl font-black text-emerald-500 dark:text-emerald-400 font-mono">
                 {result ? result.totalInterest.toFixed(2) : "0.00"}€
               </div>
            </div>
          </div>

          {!result && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[2rem] flex items-start gap-4">
               <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                  <Info className="w-6 h-6" />
               </div>
               <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                 Simulez la croissance de votre épargne en tenant compte des intérêts composés et de vos versements réguliers.
               </p>
            </div>
          )}
        </div>
      </div>

      {showSchedule && result && (
        <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="p-8 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-xl font-black flex items-center gap-3">
              <Table className="w-6 h-6 text-indigo-500" /> Évolution de l'épargne
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                  <th className="p-4 text-xs font-black uppercase text-slate-400 text-center">Année</th>
                  <th className="p-4 text-xs font-black uppercase text-slate-400">Capital total</th>
                  <th className="p-4 text-xs font-black uppercase text-slate-400">Total versé</th>
                  <th className="p-4 text-xs font-black uppercase text-slate-400 text-emerald-500">Intérêts cumulés</th>
                </tr>
              </thead>
              <tbody>
                {result.schedule.map((row) => (
                  <tr key={row.month} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-4 font-mono text-sm text-slate-400 text-center">An {row.year}</td>
                    <td className="p-4 font-mono font-bold text-sm">{row.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€</td>
                    <td className="p-4 font-mono text-sm text-slate-500">{row.totalDeposited.toLocaleString(undefined, { minimumFractionDigits: 2 })}€</td>
                    <td className="p-4 font-mono text-sm text-emerald-500">+{row.totalInterest.toLocaleString(undefined, { minimumFractionDigits: 2 })}€</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Educational Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-600">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black">Les intérêts composés</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Les intérêts composés sont calculés sur le capital initial et aussi sur les intérêts accumulés des périodes précédentes. C'est "l'effet boule de neige".
          </p>
          <ul className="space-y-2">
            {['Capital de départ', 'Versements réguliers', 'Taux de rendement'].map(item => (
              <li key={item} className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300">
                <ChevronRight className="w-4 h-4 text-indigo-500" /> {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-4">
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center text-emerald-600">
            <TrendingUp className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black">L'importance de la durée</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Plus l'argent reste investi longtemps, plus les intérêts composés ont d'impact. Commencer à épargner tôt est souvent plus important que le montant versé.
          </p>
        </div>

        <div className="space-y-4">
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center text-amber-600">
            <Calculator className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black">Formule mathématique</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            La valeur future (VF) est calculée ainsi : <br/>
            <code className="bg-slate-100 dark:bg-slate-800 p-1 rounded font-mono text-[10px]">VF = P(1+r)^n + PMT[((1+r)^n - 1)/r]</code><br/>
            Où P est le principal, PMT le versement, r le taux périodique et n le nombre de périodes.
          </p>
        </div>
      </div>
    </div>
  );
}
