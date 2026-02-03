import { useState, useMemo } from "react";
import { Banknote, Briefcase, Info, TrendingDown, TrendingUp, RotateCcw, HelpCircle, BookOpen, ChevronRight, Calculator } from "lucide-react";

export function SalaryCalculator() {
  const [grossAnnual, setGrossAnnual] = useState<string>("35000");
  const [status, setStatus] = useState<"non-cadre" | "cadre">("non-cadre");

  const results = useMemo(() => {
    const gross = parseFloat(grossAnnual) || 0;

    const rates = {
      "non-cadre": 0.22,
      cadre: 0.25,
    };

    const chargeRate = rates[status];
    const netAnnualBeforeTax = gross * (1 - chargeRate);

    // Simplified French Income Tax calculation (progressive)
    // Based on taxable income (approx 90% of net before tax after 10% deduction)
    const taxableIncome = netAnnualBeforeTax * 0.9;
    let tax = 0;
    const brackets = [
      { limit: 11294, rate: 0 },
      { limit: 28797, rate: 0.11 },
      { limit: 82341, rate: 0.30 },
      { limit: 177106, rate: 0.41 },
      { limit: Infinity, rate: 0.45 },
    ];

    let previousLimit = 0;
    for (const bracket of brackets) {
      if (taxableIncome > previousLimit) {
        const taxableInBracket = Math.min(taxableIncome, bracket.limit) - previousLimit;
        tax += taxableInBracket * bracket.rate;
        previousLimit = bracket.limit;
      } else {
        break;
      }
    }

    const netAnnualAfterTax = netAnnualBeforeTax - tax;

    return {
      grossAnnual: gross,
      grossMonthly: gross / 12,
      netAnnualBeforeTax,
      netMonthlyBeforeTax: netAnnualBeforeTax / 12,
      netAnnualAfterTax,
      netMonthlyAfterTax: netAnnualAfterTax / 12,
      chargesAnnual: gross - netAnnualBeforeTax,
      chargesMonthly: (gross - netAnnualBeforeTax) / 12,
      taxAnnual: tax,
      taxMonthly: tax / 12,
    };
  }, [grossAnnual, status]);

  const handleClear = () => {
    setGrossAnnual("");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="gross-salary" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Banknote className="w-3 h-3" /> Salaire brut annuel
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
              id="gross-salary"
              type="number"
              value={grossAnnual}
              onChange={(e) => setGrossAnnual(e.target.value)}
              className="w-full p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl text-3xl md:text-4xl font-black font-mono outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
              placeholder="35000"
            />
            <span className="absolute right-6 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-300">€</span>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-2">
              <Briefcase className="w-3 h-3" /> Statut professionnel
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setStatus("non-cadre")}
                className={`py-4 rounded-2xl font-bold text-sm transition-all border ${
                  status === "non-cadre"
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20"
                    : "bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-slate-300"
                }`}
              >
                Non-cadre (~22%)
              </button>
              <button
                onClick={() => setStatus("cadre")}
                className={`py-4 rounded-2xl font-bold text-sm transition-all border ${
                  status === "cadre"
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20"
                    : "bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-slate-300"
                }`}
              >
                Cadre (~25%)
              </button>
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/20 p-6 rounded-3xl flex items-start gap-4">
            <div className="p-2 bg-white dark:bg-slate-800 text-amber-600 rounded-xl shadow-sm shrink-0">
              <Info className="w-5 h-5" />
            </div>
            <p className="text-sm text-amber-800 dark:text-amber-400 font-medium leading-relaxed">
              Estimation basée sur les taux 2024. L'impôt sur le revenu est calculé pour une personne seule (1 part) sans autre revenu.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 dark:bg-black p-8 md:p-10 rounded-[2.5rem] shadow-xl shadow-indigo-500/10 flex flex-col items-center justify-center space-y-4 min-h-[300px] relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>

             <div className="text-slate-400 font-bold uppercase tracking-widest text-xs text-center">Net après impôts mensuel</div>
             <div className="text-5xl md:text-6xl font-black text-white font-mono tracking-tighter">
               {results.netMonthlyAfterTax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
             </div>
             <div className="text-indigo-400 font-black text-xl md:text-2xl uppercase tracking-widest">
               EUROS / MOIS
             </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
             <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="text-xs font-black uppercase tracking-widest text-slate-400 flex justify-between">
                  <span>Détail mensuel</span>
                  <span className="text-indigo-500">Estimations</span>
                </div>
                <div className="space-y-3">
                   <div className="flex justify-between items-center gap-2">
                      <span className="text-sm text-slate-500 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Salaire Brut</span>
                      <span className="font-bold font-mono">{results.grossMonthly.toFixed(2)}€</span>
                   </div>
                   <div className="flex justify-between items-center gap-2 text-rose-500">
                      <span className="text-sm flex items-center gap-1"><TrendingDown className="w-3 h-3" /> Cotisations</span>
                      <span className="font-bold font-mono">-{results.chargesMonthly.toFixed(2)}€</span>
                   </div>
                   <div className="flex justify-between items-center gap-2 text-slate-900 dark:text-white border-t border-slate-100 dark:border-slate-800 pt-2 font-bold">
                      <span className="text-sm">Net avant impôt</span>
                      <span className="font-mono">{results.netMonthlyBeforeTax.toFixed(2)}€</span>
                   </div>
                   <div className="flex justify-between items-center gap-2 text-amber-600">
                      <span className="text-sm flex items-center gap-1"><TrendingDown className="w-3 h-3" /> Impôt estimé</span>
                      <span className="font-bold font-mono">-{results.taxMonthly.toFixed(2)}€</span>
                   </div>
                   <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center gap-2 text-emerald-500">
                      <span className="font-bold text-sm uppercase tracking-wider">Net après impôt</span>
                      <span className="font-black font-mono text-xl text-right">{results.netMonthlyAfterTax.toFixed(2)}€</span>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Educational Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-600">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black">Brut vs Net</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Le salaire brut est le montant avant toute déduction. Le salaire net est ce que vous recevez réellement après le paiement des cotisations sociales.
          </p>
          <ul className="space-y-2">
            {['Sécurité sociale', 'Retraite', 'Chômage'].map(item => (
              <li key={item} className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300">
                <ChevronRight className="w-4 h-4 text-indigo-500" /> {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-4">
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center text-amber-600">
            <Calculator className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black">Impôt sur le Revenu</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Depuis 2019, l'impôt est prélevé à la source. Notre calculateur estime ce montant en utilisant le barème progressif de l'impôt sur le revenu français.
          </p>
        </div>

        <div className="space-y-4">
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center text-emerald-600">
            <HelpCircle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black">Cadre ou Non-Cadre ?</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Le statut cadre implique généralement des cotisations sociales plus élevées (environ 25%) contre 22% pour les non-cadres, principalement pour la retraite complémentaire.
          </p>
        </div>
      </div>

      <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800">
        <h4 className="font-black mb-4">Questions Fréquentes (FAQ)</h4>
        <div className="space-y-6">
          <div>
            <h5 className="font-bold text-sm mb-2">Le calcul inclut-il la CSG ?</h5>
            <p className="text-sm text-slate-500 dark:text-slate-400">Oui, les taux de 22% et 25% incluent les cotisations sociales standards dont la CSG et la CRDS.</p>
          </div>
          <div>
            <h5 className="font-bold text-sm mb-2">Comment est calculé l'impôt ?</h5>
            <p className="text-sm text-slate-500 dark:text-slate-400">Nous appliquons l'abattement forfaitaire de 10% pour frais professionnels avant d'appliquer le barème progressif par tranches.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
