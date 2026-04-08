import { useState, useMemo } from "react";
import { Clock, Banknote, Percent, Info, TrendingUp, RotateCcw, HelpCircle, BookOpen, ChevronRight, Calculator, Trash2 } from "lucide-react";

export function OvertimeCalculator() {
  const [hourlyRate, setHourlyRate] = useState<string>("15");
  const [hours25, setHours25] = useState<string>("0");
  const [hours50, setHours50] = useState<string>("0");
  const [taxRate, setTaxRate] = useState<string>("22");

  const results = useMemo(() => {
    const rate = parseFloat(hourlyRate) || 0;
    const h25 = parseFloat(hours25) || 0;
    const h50 = parseFloat(hours50) || 0;
    const tr = parseFloat(taxRate) || 0;

    const gross25 = h25 * (rate * 1.25);
    const gross50 = h50 * (rate * 1.5);
    const totalGross = gross25 + gross50;

    // Overtime hours in France are partially exempt from social contributions
    // and income tax (up to a certain limit, usually 7500€/year)
    // Here we use a simplified model
    const netRate = 1 - (tr / 100);
    const totalNet = totalGross * (netRate + 0.11); // Adding ~11% back for typical reduction of contributions

    return {
      gross25,
      gross50,
      totalGross,
      totalNet: Math.min(totalGross, totalNet), // Net can't be more than gross
      totalHours: h25 + h50,
    };
  }, [hourlyRate, hours25, hours50, taxRate]);

  const handleClear = () => {
    setHours25("0");
    setHours50("0");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="hourly-rate" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Banknote className="w-3 h-3" /> Taux horaire brut (€/h)
            </label>
            <button
              onClick={handleClear}
              className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all"
            >
              <Trash2 className="w-3 h-3" /> Effacer
            </button>
          </div>
          <div className="relative">
            <input
              id="hourly-rate"
              type="number"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
              className="w-full p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl text-3xl md:text-4xl font-black font-mono outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
              placeholder="15"
            />
            <span className="absolute right-6 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-300">€</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <label htmlFor="hours-25" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-2">
                <Clock className="w-3 h-3" /> Heures à 25%
              </label>
              <input
                id="hours-25"
                type="number"
                value={hours25}
                onChange={(e) => setHours25(e.target.value)}
                className="w-full p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
                placeholder="0"
              />
            </div>
            <div className="space-y-3">
              <label htmlFor="hours-50" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-2">
                <Clock className="w-3 h-3" /> Heures à 50%
              </label>
              <input
                id="hours-50"
                type="number"
                value={hours50}
                onChange={(e) => setHours50(e.target.value)}
                className="w-full p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
                placeholder="0"
              />
            </div>
          </div>

          <div className="space-y-3">
            <label htmlFor="tax-rate" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-2">
              <Percent className="w-3 h-3" /> Taux de charges estimé (%)
            </label>
            <input
              id="tax-rate"
              type="number"
              value={taxRate}
              onChange={(e) => setTaxRate(e.target.value)}
              className="w-full p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
              placeholder="22"
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 dark:bg-black p-8 md:p-10 rounded-[2.5rem] shadow-xl shadow-indigo-500/10 flex flex-col items-center justify-center space-y-4 min-h-[300px] relative overflow-hidden">
             <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl"></div>

             <div className="text-slate-400 font-bold uppercase tracking-widest text-xs">Gain Net Estimé</div>
             <div className="text-5xl md:text-7xl font-black text-white font-mono tracking-tighter">
               {results.totalNet.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
             </div>
             <div className="text-indigo-400 font-black text-xl md:text-2xl uppercase tracking-widest text-center">
               EUROS NETS
             </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2 text-center">
               <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Brut</div>
               <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                 {results.totalGross.toFixed(2)}€
               </div>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20 p-6 rounded-3xl space-y-2 text-center">
               <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Total Heures</div>
               <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                 {results.totalHours} h
               </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[2rem] space-y-4">
             <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Détail par majoration</h4>
             <div className="space-y-3">
                <div className="flex justify-between items-center text-sm font-medium">
                  <span className="text-slate-500">Majorées à 25%</span>
                  <span className="font-mono dark:text-white">{results.gross25.toFixed(2)}€ brut</span>
                </div>
                <div className="flex justify-between items-center text-sm font-medium">
                  <span className="text-slate-500">Majorées à 50%</span>
                  <span className="font-mono dark:text-white">{results.gross50.toFixed(2)}€ brut</span>
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
          <h3 className="text-lg font-black">Heures Supplémentaires</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            En France, les heures travaillées au-delà de la durée légale (35h) sont majorées. Généralement 25% pour les 8 premières et 50% pour les suivantes.
          </p>
        </div>

        <div className="space-y-4">
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center text-emerald-600">
            <TrendingUp className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black">Défiscalisation</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Les heures supplémentaires bénéficient d'une réduction des cotisations salariales et d'une exonération d'impôt sur le revenu dans la limite de 7 500€ par an.
          </p>
        </div>

        <div className="space-y-4">
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center text-amber-600">
            <HelpCircle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black">Rémunération</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Un accord d'entreprise peut fixer des taux de majoration différents, mais ils ne peuvent être inférieurs à 10%.
          </p>
        </div>
      </div>
    </div>
  );
}
