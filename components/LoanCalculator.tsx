import { useState } from "react";
import { Calculator, Info, Percent, Landmark, Clock } from "lucide-react";

export function LoanCalculator() {
  const [principal, setPrincipal] = useState<string>("");
  const [annualRate, setAnnualRate] = useState<string>("");
  const [years, setYears] = useState<string>("");
  const [result, setResult] = useState<{
    monthlyPayment: number;
    totalPayment: number;
    totalInterest: number;
  } | null>(null);

  const calculate = () => {
    const p = parseFloat(principal);
    const r = parseFloat(annualRate) / 100 / 12;
    const n = parseFloat(years) * 12;

    if (!isNaN(p) && !isNaN(r) && !isNaN(n) && r > 0 && n > 0) {
      const monthlyPayment =
        (p * (r * Math.pow(1 + r, n))) / (Math.pow(1 + r, n) - 1);
      const totalPayment = monthlyPayment * n;
      const totalInterest = totalPayment - p;

      setResult({
        monthlyPayment,
        totalPayment,
        totalInterest,
      });
    } else if (!isNaN(p) && r === 0 && !isNaN(n) && n > 0) {
      const monthlyPayment = p / n;
      setResult({
        monthlyPayment,
        totalPayment: p,
        totalInterest: 0,
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="space-y-3">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-2">
              <Landmark className="w-3 h-3" /> Montant emprunté
            </label>
            <div className="relative">
              <input
                type="number"
                value={principal}
                onChange={(e) => setPrincipal(e.target.value)}
                className="w-full p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl text-4xl font-black font-mono outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
                placeholder="10000"
              />
              <span className="absolute right-6 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-300">€</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-2">
                <Percent className="w-3 h-3" /> Taux annuel
              </label>
              <div className="relative">
                 <input
                  type="number"
                  value={annualRate}
                  onChange={(e) => setAnnualRate(e.target.value)}
                  className="w-full p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
                  placeholder="5"
                  step="0.01"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-slate-400">%</span>
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-2">
                <Clock className="w-3 h-3" /> Durée (ans)
              </label>
              <input
                type="number"
                value={years}
                onChange={(e) => setYears(e.target.value)}
                className="w-full p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
                placeholder="5"
              />
            </div>
          </div>

          <button
            onClick={calculate}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all"
          >
            <Calculator className="w-5 h-5" /> Calculer les mensualités
          </button>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 dark:bg-black p-10 rounded-[2.5rem] shadow-xl shadow-indigo-500/10 flex flex-col items-center justify-center space-y-4 min-h-[300px] relative overflow-hidden">
             <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl"></div>

             <div className="text-slate-400 font-bold uppercase tracking-widest text-xs">Mensualité estimée</div>
             <div className="text-7xl font-black text-white font-mono tracking-tighter">
               {result ? result.monthlyPayment.toFixed(2) : "0.00"}
             </div>
             <div className="text-indigo-400 font-black text-2xl uppercase tracking-widest">
               EUROS / MOIS
             </div>
          </div>

          {result && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2 text-center">
                 <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Coût total</div>
                 <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">{result.totalPayment.toFixed(2)}€</div>
              </div>
              <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/20 p-6 rounded-3xl space-y-2 text-center">
                 <div className="text-xs font-bold text-rose-500 dark:text-rose-400 uppercase tracking-widest">Total Intérêts</div>
                 <div className="text-2xl font-black text-rose-500 dark:text-rose-400 font-mono">{result.totalInterest.toFixed(2)}€</div>
              </div>
            </div>
          )}

          {!result && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[2rem] flex items-start gap-4">
               <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                  <Info className="w-6 h-6" />
               </div>
               <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                 Entrez le montant, le taux et la durée pour simuler votre crédit immobilier ou consommation.
               </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
