import { useState, useMemo, useEffect, useCallback } from "react";
import { Banknote, Briefcase, Info, TrendingDown, TrendingUp, RotateCcw, HelpCircle, BookOpen, ChevronRight, Calculator, Copy, Check } from "lucide-react";

export function SalaryCalculator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const [grossAnnual, setGrossAnnual] = useState<string>(initialData?.grossAnnual || "35000");
  const [status, setStatus] = useState<"non-cadre" | "cadre">(initialData?.status || "non-cadre");
  const [is13thMonth, setIs13thMonth] = useState(initialData?.is13thMonth ?? false);
  const [mealVoucherValue, setMealVoucherValue] = useState<string>(initialData?.mealVoucherValue || "0");
  const [mealVoucherDays, setMealVoucherDays] = useState<string>(initialData?.mealVoucherDays || "20");
  const [employerShare, setEmployerShare] = useState<string>(initialData?.employerShare || "50");
  const [benefitsInKind, setBenefitsInKind] = useState<string>(initialData?.benefitsInKind || "0");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ grossAnnual, status, is13thMonth, mealVoucherValue, mealVoucherDays, employerShare, benefitsInKind });
  }, [grossAnnual, status, is13thMonth, mealVoucherValue, mealVoucherDays, employerShare, benefitsInKind, onStateChange]);

  const results = useMemo(() => {
    const gross = parseFloat(grossAnnual) || 0;
    const benefits = parseFloat(benefitsInKind) || 0;
    const mvValue = parseFloat(mealVoucherValue) || 0;
    const mvDays = parseFloat(mealVoucherDays) || 0;
    const mvShare = parseFloat(employerShare) || 0;

    const rates = {
      "non-cadre": 0.22,
      cadre: 0.25,
    };

    const chargeRate = rates[status];
    const netAnnualBeforeTax = gross * (1 - chargeRate);

    // Simplified French Income Tax calculation (progressive)
    // Based on taxable income (approx 90% of net before tax after 10% deduction)
    // Benefits in kind are added to taxable income
    const taxableIncome = (netAnnualBeforeTax + (benefits * 12)) * 0.9;
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

    const mealVoucherEmployeeShareMonthly = mvValue * (1 - mvShare / 100) * mvDays;
    const netAnnualAfterTax = netAnnualBeforeTax - tax - (mealVoucherEmployeeShareMonthly * 12);

    const months = is13thMonth ? 13 : 12;

    return {
      grossAnnual: gross,
      grossMonthly: gross / months,
      netAnnualBeforeTax,
      netMonthlyBeforeTax: netAnnualBeforeTax / months,
      netAnnualAfterTax,
      netMonthlyAfterTax: netAnnualAfterTax / months,
      chargesAnnual: gross - netAnnualBeforeTax,
      chargesMonthly: (gross - netAnnualBeforeTax) / months,
      taxAnnual: tax,
      taxMonthly: tax / months,
      mealVoucherDeduction: mealVoucherEmployeeShareMonthly,
      benefitsInKind: benefits,
    };
  }, [grossAnnual, status, is13thMonth, mealVoucherValue, mealVoucherDays, employerShare, benefitsInKind]);

  const handleClear = () => {
    setGrossAnnual("");
    setMealVoucherValue("0");
    setBenefitsInKind("0");
  };

  const handleCopy = useCallback(() => {
    const text = `Salaire Brut : ${results.grossAnnual.toFixed(2)}€ / an (${results.grossMonthly.toFixed(2)}€/mois)
Net après impôts : ${results.netAnnualAfterTax.toFixed(2)}€ / an (${results.netMonthlyAfterTax.toFixed(2)}€/mois)`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [results]);

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
              disabled={!grossAnnual && mealVoucherValue === "0" && benefitsInKind === "0"}
              className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
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
              className="w-full p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl text-3xl md:text-4xl font-black font-mono outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white focus-visible:ring-indigo-500"
              placeholder="35000"
            />
            <span className="absolute right-6 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-300">€</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-2">
                <Briefcase className="w-3 h-3" /> Statut
              </label>
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  onClick={() => setStatus("non-cadre")}
                  aria-pressed={status === "non-cadre"}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${status === "non-cadre" ? "bg-white dark:bg-slate-700 text-indigo-600 shadow-sm" : "text-slate-500"}`}
                >
                  Non-cadre
                </button>
                <button
                  onClick={() => setStatus("cadre")}
                  aria-pressed={status === "cadre"}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${status === "cadre" ? "bg-white dark:bg-slate-700 text-indigo-600 shadow-sm" : "text-slate-500"}`}
                >
                  Cadre
                </button>
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-2">
                <Calculator className="w-3 h-3" /> Périodicité
              </label>
              <button
                onClick={() => setIs13thMonth(!is13thMonth)}
                aria-pressed={is13thMonth}
                className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${is13thMonth ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 text-indigo-600" : "bg-white dark:bg-slate-800 border-slate-200 text-slate-500"}`}
              >
                {is13thMonth ? "13 mois" : "12 mois"}
              </button>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Avantages & Frais</h4>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="meal-vouchers" className="text-[10px] font-bold text-slate-500 uppercase px-1">Tickets Resto (Valeur)</label>
                <div className="relative">
                  <input
                    id="meal-vouchers"
                    type="number"
                    value={mealVoucherValue}
                    onChange={(e) => setMealVoucherValue(e.target.value)}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold outline-none focus:border-indigo-500 transition-colors dark:text-white focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
                    placeholder="9.50"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-300">€</span>
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="benefits" className="text-[10px] font-bold text-slate-500 uppercase px-1">Avantages nature / mois</label>
                <div className="relative">
                  <input
                    id="benefits"
                    type="number"
                    value={benefitsInKind}
                    onChange={(e) => setBenefitsInKind(e.target.value)}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold outline-none focus:border-indigo-500 transition-colors dark:text-white focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
                    placeholder="0"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-300">€</span>
                </div>
              </div>
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
          <div className="bg-slate-900 dark:bg-black p-8 md:p-10 rounded-[2.5rem] shadow-xl shadow-indigo-500/10 flex flex-col items-center justify-center space-y-4 min-h-[300px] relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>

             <button
              onClick={handleCopy}
              className={`absolute top-6 right-6 p-3 rounded-2xl transition-all border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                copied
                  ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                  : "bg-white/10 text-white/40 border-transparent hover:text-white hover:bg-white/20 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
              }`}
              title="Copier le résultat"
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </button>

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
                   {results.mealVoucherDeduction > 0 && (
                     <div className="flex justify-between items-center gap-2 text-rose-500">
                        <span className="text-sm flex items-center gap-1"><TrendingDown className="w-3 h-3" /> Part Tickets Resto</span>
                        <span className="font-bold font-mono">-{results.mealVoucherDeduction.toFixed(2)}€</span>
                     </div>
                   )}
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
