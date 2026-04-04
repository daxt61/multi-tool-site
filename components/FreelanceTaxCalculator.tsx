import { useState, useMemo } from 'react';
import { Briefcase, Calculator, Trash2, Info, PiggyBank, PieChart, Landmark } from 'lucide-react';

type ActivityType = 'service' | 'vente' | 'liberal';

export function FreelanceTaxCalculator() {
  const [revenue, setRevenue] = useState<string>('3000');
  const [activity, setActivity] = useState<ActivityType>('service');
  const [acre, setAcre] = useState<boolean>(false);

  const rates = {
    service: { social: 0.211, acre: 0.106 },
    vente: { social: 0.123, acre: 0.062 },
    liberal: { social: 0.212, acre: 0.106 },
  };

  const results = useMemo(() => {
    const ca = parseFloat(revenue);
    if (isNaN(ca) || ca < 0) return null;

    const currentRate = acre ? rates[activity].acre : rates[activity].social;
    const socialContributions = ca * currentRate;

    // Simplification for the demo: 0.2% for training (CFP)
    const cfp = ca * 0.002;

    const totalDeductions = socialContributions + cfp;
    const netRevenue = ca - totalDeductions;

    return {
      ca,
      socialContributions,
      cfp,
      totalDeductions,
      netRevenue,
      rate: currentRate * 100
    };
  }, [revenue, activity, acre]);

  const handleClear = () => {
    setRevenue('');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Settings Panel */}
        <div className="lg:col-span-5 space-y-8 bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800">
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="revenue" className="text-xs font-black uppercase tracking-widest text-slate-400">Chiffre d'affaires (€)</label>
              <button
                onClick={handleClear}
                disabled={!revenue}
                className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 px-2 py-1 rounded-lg flex items-center gap-1 transition-all disabled:opacity-50"
              >
                <Trash2 className="w-3 h-3" /> Effacer
              </button>
            </div>
            <input
              id="revenue"
              type="number"
              value={revenue}
              onChange={(e) => setRevenue(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl text-3xl font-black font-mono outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
              placeholder="0"
            />
          </div>

          <div className="space-y-4">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Type d'activité</label>
            <div className="grid grid-cols-1 gap-2">
              {[
                { id: 'service', label: 'Prestation de services (BNC/BIC)', icon: Briefcase },
                { id: 'vente', label: 'Achat / Revente de marchandises', icon: PiggyBank },
                { id: 'liberal', label: 'Profession Libérale (CIPAV)', icon: Landmark },
              ].map((type) => (
                <button
                  key={type.id}
                  onClick={() => setActivity(type.id as ActivityType)}
                  className={`flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${
                    activity === type.id
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-indigo-300'
                  }`}
                >
                  <type.icon className={`w-5 h-5 ${activity === type.id ? 'text-white' : 'text-indigo-500'}`} />
                  <span className="font-bold text-sm">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
             <div className="space-y-1">
               <div className="font-bold text-sm dark:text-white">Bénéficiaire de l'ACRE</div>
               <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Réduction de cotisations (1ère année)</div>
             </div>
             <button
               onClick={() => setAcre(!acre)}
               className={`w-12 h-6 rounded-full transition-all relative ${acre ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'}`}
             >
               <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${acre ? 'right-1' : 'left-1'}`} />
             </button>
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-900 dark:bg-black p-10 rounded-[2.5rem] shadow-xl shadow-indigo-500/10 text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-black uppercase tracking-widest border border-emerald-500/20">
              Revenu Net estimé
            </div>
            <div className="text-5xl md:text-7xl font-black text-white tracking-tight font-mono">
              {results ? `${Math.round(results.netRevenue).toLocaleString()} €` : '---'}
            </div>
            <p className="text-slate-400 font-medium">Après déduction des cotisations sociales</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-2">
              <div className="text-xs font-black text-slate-400 uppercase tracking-widest">Cotisations Sociales</div>
              <div className="text-2xl font-black text-rose-500 font-mono">
                -{results ? Math.round(results.socialContributions).toLocaleString() : 0} €
              </div>
              <div className="text-[10px] font-bold text-slate-400 italic">Taux appliqué : {results?.rate.toFixed(1)}%</div>
            </div>
            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-2">
              <div className="text-xs font-black text-slate-400 uppercase tracking-widest">Formation (CFP)</div>
              <div className="text-2xl font-black text-amber-500 font-mono">
                -{results ? results.cfp.toFixed(2) : 0} €
              </div>
              <div className="text-[10px] font-bold text-slate-400 italic">Contribution obligatoire</div>
            </div>
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex gap-6">
            <div className="shrink-0 w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <PieChart className="w-6 h-6" />
            </div>
            <div className="space-y-2">
               <h4 className="font-bold text-indigo-900 dark:text-indigo-100">Détails de l'estimation</h4>
               <p className="text-sm text-indigo-700 dark:text-indigo-300 leading-relaxed">
                 Cette simulation concerne le régime de la micro-entreprise en France pour l'année 2024. Elle n'inclut pas l'impôt sur le revenu (prélèvement libératoire ou barème classique) ni la CFE.
               </p>
            </div>
          </div>
        </div>
      </div>

      {/* Info Sections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-16 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" /> Précision des taux
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Les taux utilisés sont les taux standards de l'Urssaf. Notez que ces taux peuvent varier selon votre situation spécifique ou l'évolution de la législation.
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Calculator className="w-4 h-4 text-indigo-500" /> Hors Impôts
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Le montant "Net" affiché est le revenu après cotisations sociales. Vous devrez potentiellement payer l'impôt sur le revenu sur cette base, selon votre foyer fiscal.
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Landmark className="w-4 h-4 text-indigo-500" /> Déclarations
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            N'oubliez pas de déclarer votre chiffre d'affaires chaque mois ou chaque trimestre sur le site officiel de l'Urssaf Auto-entrepreneur.
          </p>
        </div>
      </div>
    </div>
  );
}
