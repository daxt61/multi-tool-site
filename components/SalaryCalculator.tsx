import { useState } from "react";
import { Banknote, Briefcase, Info, TrendingDown, TrendingUp } from "lucide-react";

export function SalaryCalculator() {
  const [grossAnnual, setGrossAnnual] = useState<string>("");
  const [status, setStatus] = useState<"non-cadre" | "cadre">("non-cadre");

  const gross = parseFloat(grossAnnual) || 0;

  const rates = {
    "non-cadre": {
      charges: 0.22,
      label: "Non-cadre (~22%)",
    },
    cadre: {
      charges: 0.25,
      label: "Cadre (~25%)",
    },
  };

  const chargeRate = rates[status].charges;
  const netAnnual = gross * (1 - chargeRate);
  const netMonthly = netAnnual / 12;
  const grossMonthly = gross / 12;
  const chargesAnnual = gross - netAnnual;
  const chargesMonthly = chargesAnnual / 12;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="space-y-3">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-2">
              <Banknote className="w-3 h-3" /> Salaire brut annuel
            </label>
            <div className="relative">
              <input
                type="number"
                value={grossAnnual}
                onChange={(e) => setGrossAnnual(e.target.value)}
                className="w-full p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl text-4xl font-black font-mono outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
                placeholder="35000"
              />
              <span className="absolute right-6 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-300">€</span>
            </div>
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
            <div className="p-2 bg-white dark:bg-slate-800 text-amber-600 rounded-xl shadow-sm">
              <Info className="w-6 h-6" />
            </div>
            <p className="text-sm text-amber-800 dark:text-amber-400 font-medium leading-relaxed">
              Ce calcul est une estimation basée sur les taux moyens. Le montant réel peut varier selon votre situation.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 dark:bg-black p-10 rounded-[2.5rem] shadow-xl shadow-indigo-500/10 flex flex-col items-center justify-center space-y-4 min-h-[300px] relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>

             <div className="text-slate-400 font-bold uppercase tracking-widest text-xs">Salaire net mensuel</div>
             <div className="text-6xl font-black text-white font-mono tracking-tighter">
               {netMonthly.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
             </div>
             <div className="text-indigo-400 font-black text-2xl uppercase tracking-widest">
               EUROS / MOIS
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="text-xs font-black uppercase tracking-widest text-slate-400">Mensuel</div>
                <div className="space-y-3">
                   <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-500 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Brut</span>
                      <span className="font-bold font-mono">{grossMonthly.toFixed(2)}€</span>
                   </div>
                   <div className="flex justify-between items-center text-rose-500">
                      <span className="text-sm flex items-center gap-1"><TrendingDown className="w-3 h-3" /> Charges</span>
                      <span className="font-bold font-mono">-{chargesMonthly.toFixed(2)}€</span>
                   </div>
                   <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-emerald-500">
                      <span className="font-bold text-sm">Net</span>
                      <span className="font-black font-mono text-lg">{netMonthly.toFixed(2)}€</span>
                   </div>
                </div>
             </div>

             <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="text-xs font-black uppercase tracking-widest text-slate-400">Annuel</div>
                <div className="space-y-3">
                   <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-500 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Brut</span>
                      <span className="font-bold font-mono">{gross.toFixed(2)}€</span>
                   </div>
                   <div className="flex justify-between items-center text-rose-500">
                      <span className="text-sm flex items-center gap-1"><TrendingDown className="w-3 h-3" /> Charges</span>
                      <span className="font-bold font-mono">-{chargesAnnual.toFixed(2)}€</span>
                   </div>
                   <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-emerald-500">
                      <span className="font-bold text-sm">Net</span>
                      <span className="font-black font-mono text-lg">{netAnnual.toFixed(2)}€</span>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
