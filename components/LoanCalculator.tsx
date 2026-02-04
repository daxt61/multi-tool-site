import { useState, useMemo } from "react";
import { Calculator, Info, Percent, Landmark, Clock, RotateCcw, Table, HelpCircle, BookOpen, ChevronRight } from "lucide-react";

export function LoanCalculator() {
  const [principal, setPrincipal] = useState<string>("10000");
  const [annualRate, setAnnualRate] = useState<string>("5");
  const [years, setYears] = useState<string>("5");
  const [showSchedule, setShowSchedule] = useState(false);

  const result = useMemo(() => {
    const p = parseFloat(principal);
    const r = parseFloat(annualRate) / 100 / 12;
    const n = parseFloat(years) * 12;

    if (!isNaN(p) && !isNaN(r) && !isNaN(n) && r > 0 && n > 0) {
      const monthlyPayment = (p * (r * Math.pow(1 + r, n))) / (Math.pow(1 + r, n) - 1);
      const totalPayment = monthlyPayment * n;
      const totalInterest = totalPayment - p;

      // Amortization schedule
      const schedule = [];
      let remainingBalance = p;
      for (let i = 1; i <= n; i++) {
        const interestForMonth = remainingBalance * r;
        const principalForMonth = monthlyPayment - interestForMonth;
        remainingBalance -= principalForMonth;
        schedule.push({
          month: i,
          payment: monthlyPayment,
          principal: principalForMonth,
          interest: interestForMonth,
          balance: Math.max(0, remainingBalance),
        });
      }

      return {
        monthlyPayment,
        totalPayment,
        totalInterest,
        schedule,
      };
    } else if (!isNaN(p) && r === 0 && !isNaN(n) && n > 0) {
      const monthlyPayment = p / n;
      return {
        monthlyPayment,
        totalPayment: p,
        totalInterest: 0,
        schedule: Array.from({ length: n }, (_, i) => ({
          month: i + 1,
          payment: monthlyPayment,
          principal: monthlyPayment,
          interest: 0,
          balance: p - (monthlyPayment * (i + 1)),
        })),
      };
    }
    return null;
  }, [principal, annualRate, years]);

  const handleClear = () => {
    setPrincipal("");
    setAnnualRate("");
    setYears("");
    setShowSchedule(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="principal" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Landmark className="w-3 h-3" /> Montant emprunté
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
              id="principal"
              type="number"
              value={principal}
              onChange={(e) => setPrincipal(e.target.value)}
              className="w-full p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl text-3xl md:text-4xl font-black font-mono outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
              placeholder="10000"
            />
            <span className="absolute right-6 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-300">€</span>
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
                  placeholder="5"
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
                placeholder="5"
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
              <Table className="w-5 h-5" /> {showSchedule ? "Masquer l'échéancier" : "Voir le tableau d'amortissement"}
            </button>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 dark:bg-black p-10 rounded-[2.5rem] shadow-xl shadow-indigo-500/10 flex flex-col items-center justify-center space-y-4 min-h-[300px] relative overflow-hidden">
             <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl"></div>

             <div className="text-slate-400 font-bold uppercase tracking-widest text-xs">Mensualité estimée</div>
             <div className="text-5xl md:text-7xl font-black text-white font-mono tracking-tighter">
               {result ? result.monthlyPayment.toFixed(2) : "0.00"}
             </div>
             <div className="text-indigo-400 font-black text-xl md:text-2xl uppercase tracking-widest text-center">
               EUROS / MOIS
             </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2 text-center">
               <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Coût total</div>
               <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                 {result ? result.totalPayment.toFixed(2) : "0.00"}€
               </div>
            </div>
            <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/20 p-6 rounded-3xl space-y-2 text-center">
               <div className="text-xs font-bold text-rose-500 dark:text-rose-400 uppercase tracking-widest">Total Intérêts</div>
               <div className="text-2xl font-black text-rose-500 dark:text-rose-400 font-mono">
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
                 Entrez le montant, le taux et la durée pour simuler votre crédit immobilier ou consommation en temps réel.
               </p>
            </div>
          )}
        </div>
      </div>

      {showSchedule && result && (
        <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="p-8 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-xl font-black flex items-center gap-3">
              <Table className="w-6 h-6 text-indigo-500" /> Tableau d'amortissement
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                  <th className="p-4 text-xs font-black uppercase text-slate-400 text-center">Mois</th>
                  <th className="p-4 text-xs font-black uppercase text-slate-400">Mensualité</th>
                  <th className="p-4 text-xs font-black uppercase text-slate-400">Principal</th>
                  <th className="p-4 text-xs font-black uppercase text-slate-400 text-rose-500">Intérêt</th>
                  <th className="p-4 text-xs font-black uppercase text-slate-400">Reste dû</th>
                </tr>
              </thead>
              <tbody>
                {result.schedule.map((row) => (
                  <tr key={row.month} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-4 font-mono text-sm text-slate-400 text-center">{row.month}</td>
                    <td className="p-4 font-mono font-bold text-sm">{row.payment.toFixed(2)}€</td>
                    <td className="p-4 font-mono text-sm text-emerald-500">{row.principal.toFixed(2)}€</td>
                    <td className="p-4 font-mono text-sm text-rose-500">{row.interest.toFixed(2)}€</td>
                    <td className="p-4 font-mono text-sm font-bold">{row.balance.toFixed(2)}€</td>
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
          <h3 className="text-lg font-black">Comment ça marche ?</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Notre calculateur utilise la formule standard des annuités constantes. Il calcule la mensualité fixe qui permet de rembourser le capital et les intérêts sur la durée choisie.
          </p>
          <ul className="space-y-2">
            {['Capital', 'Taux annuel', 'Durée'].map(item => (
              <li key={item} className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300">
                <ChevronRight className="w-4 h-4 text-indigo-500" /> {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-4">
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center text-emerald-600">
            <HelpCircle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black">Pourquoi simuler ?</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Comparer différentes durées et taux vous permet d'optimiser le coût total de votre crédit. Une durée plus courte augmente la mensualité mais réduit considérablement les intérêts totaux.
          </p>
        </div>

        <div className="space-y-4">
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center text-amber-600">
            <Calculator className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black">Informations techniques</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            La formule utilisée est : <br/>
            <code className="bg-slate-100 dark:bg-slate-800 p-1 rounded font-mono text-xs">M = P * [r(1+r)^n] / [(1+r)^n - 1]</code><br/>
            Où M est la mensualité, P le capital, r le taux mensuel et n le nombre de mois.
          </p>
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2rem] border border-indigo-100 dark:border-indigo-900/20">
        <h4 className="font-black mb-4">Questions Fréquentes (FAQ)</h4>
        <div className="space-y-6">
          <div>
            <h5 className="font-bold text-sm mb-2">Puis-je inclure l'assurance ?</h5>
            <p className="text-sm text-slate-500 dark:text-slate-400">Pour plus de précision, vous pouvez ajouter le taux de l'assurance au taux annuel (TAEG).</p>
          </div>
          <div>
            <h5 className="font-bold text-sm mb-2">Le tableau d'amortissement est-il précis ?</h5>
            <p className="text-sm text-slate-500 dark:text-slate-400">Oui, il suit la méthode de calcul bancaire standard française pour les prêts à mensualités constantes.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
