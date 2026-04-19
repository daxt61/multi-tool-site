import { useState, useEffect, useMemo } from "react";
import { Trash2, Plus, Wallet, TrendingUp, PiggyBank, PieChart, Info, Download, RotateCcw, Banknote, Target } from "lucide-react";

interface BudgetCategory {
  name: string;
  planned: number;
  actual: number;
}

export function BudgetPlanner({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const DEFAULT_CATEGORIES = [
    { name: "Logement", planned: 0, actual: 0 },
    { name: "Alimentation", planned: 0, actual: 0 },
    { name: "Transport", planned: 0, actual: 0 },
    { name: "Santé", planned: 0, actual: 0 },
    { name: "Loisirs", planned: 0, actual: 0 },
    { name: "Épargne", planned: 0, actual: 0 },
  ];

  const [income, setIncome] = useState<string>(() => {
    if (initialData?.income) return initialData.income;
    const saved = localStorage.getItem("budget_income");
    return (saved && saved.length < 50) ? saved : "";
  });

  const [categories, setCategories] = useState<BudgetCategory[]>(() => {
    if (initialData?.categories) return initialData.categories;
    try {
      const saved = localStorage.getItem("budget_categories");
      const parsed = saved ? JSON.parse(saved) : null;
      if (!parsed || !Array.isArray(parsed)) return DEFAULT_CATEGORIES;

      return parsed
        .filter(cat => (
          cat &&
          typeof cat.name === 'string' &&
          typeof cat.planned === 'number' &&
          typeof cat.actual === 'number'
        ))
        .slice(0, 50);
    } catch (e) {
      console.error("Failed to load budget categories", e);
      return DEFAULT_CATEGORIES;
    }
  });

  useEffect(() => {
    localStorage.setItem("budget_income", income);
    onStateChange?.({ income, categories });
  }, [income, categories, onStateChange]);

  useEffect(() => {
    localStorage.setItem("budget_categories", JSON.stringify(categories));
  }, [categories]);

  const addCategory = () => {
    if (categories.length >= 50) return;
    setCategories([...categories, { name: "Nouvelle catégorie", planned: 0, actual: 0 }]);
  };

  const removeCategory = (index: number) => {
    if (categories.length > 1) {
      setCategories(categories.filter((_, i) => i !== index));
    }
  };

  const updateCategory = (
    index: number,
    field: keyof BudgetCategory,
    value: string | number
  ) => {
    const newCategories = [...categories];
    newCategories[index] = { ...newCategories[index], [field]: value };
    setCategories(newCategories);
  };

  const handleClear = () => {
    if (window.confirm("Voulez-vous vraiment réinitialiser le budget ?")) {
      setIncome("");
      setCategories(DEFAULT_CATEGORIES);
    }
  };

  const handleDownload = () => {
    const data = {
      income,
      categories,
      summary: {
        totalPlanned,
        totalActual,
        remainingPlanned,
        remainingActual
      }
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `budget-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const { totalPlanned, totalActual, incomeValue, remainingPlanned, remainingActual } = useMemo(() => {
    const tp = categories.reduce((sum, cat) => sum + cat.planned, 0);
    const ta = categories.reduce((sum, cat) => sum + cat.actual, 0);
    const iv = parseFloat(income) || 0;
    return {
      totalPlanned: tp,
      totalActual: ta,
      incomeValue: iv,
      remainingPlanned: iv - tp,
      remainingActual: iv - ta
    };
  }, [categories, income]);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex justify-end gap-2 px-1">
        <button
          onClick={handleDownload}
          className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
        >
          <Download className="w-3 h-3" /> Télécharger JSON
        </button>
        <button
          onClick={handleClear}
          className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
        >
          <Trash2 className="w-3 h-3" /> Effacer
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Inputs */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="space-y-4">
              <label htmlFor="budget-income" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 px-1">
                <Banknote className="w-4 h-4 text-indigo-500" /> Revenu mensuel net
              </label>
              <div className="relative">
                <input
                  id="budget-income"
                  type="number"
                  value={income}
                  onChange={(e) => setIncome(e.target.value)}
                  className="w-full p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl text-3xl font-black font-mono outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
                  placeholder="2500"
                />
                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-300">€</span>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-center px-1">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <Target className="w-4 h-4 text-indigo-500" /> Catégories
                </h3>
                <button
                  onClick={addCategory}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Ajouter
                </button>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-12 gap-3 px-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <div className="col-span-5">Nom</div>
                  <div className="col-span-3">Prévu (€)</div>
                  <div className="col-span-3">Réel (€)</div>
                  <div className="col-span-1 text-center"></div>
                </div>
                {categories.map((cat, index) => (
                  <div key={index} className="grid grid-cols-12 gap-3 items-center group animate-in fade-in slide-in-from-left-2 duration-300">
                    <div className="col-span-5">
                      <input
                        type="text"
                        value={cat.name}
                        onChange={(e) => updateCategory(index, "name", e.target.value)}
                        className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm outline-none focus:border-indigo-500 transition-colors dark:text-white"
                      />
                    </div>
                    <div className="col-span-3">
                      <input
                        type="number"
                        value={cat.planned || ""}
                        onChange={(e) => updateCategory(index, "planned", Number(e.target.value))}
                        className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm font-mono outline-none focus:border-indigo-500 transition-colors dark:text-white text-center"
                        placeholder="0"
                      />
                    </div>
                    <div className="col-span-3">
                      <input
                        type="number"
                        value={cat.actual || ""}
                        onChange={(e) => updateCategory(index, "actual", Number(e.target.value))}
                        className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm font-mono outline-none focus:border-indigo-500 transition-colors dark:text-white text-center"
                        placeholder="0"
                      />
                    </div>
                    <div className="col-span-1 flex justify-center">
                      <button
                        onClick={() => removeCategory(index)}
                        className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                        aria-label="Supprimer la catégorie"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Summary */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900 dark:bg-black p-8 rounded-[2.5rem] shadow-xl shadow-indigo-500/10 flex flex-col items-center justify-center space-y-4 min-h-[250px] relative overflow-hidden group text-center">
             <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>

             <div className="text-slate-400 font-bold uppercase tracking-widest text-xs">Solde réel restant</div>
             <div className={`text-5xl font-black font-mono tracking-tighter ${remainingActual >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
               {remainingActual.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
             </div>
             <div className="text-indigo-400 font-black text-xl uppercase tracking-widest">
               RÉSULTAT DU MOIS
             </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/20 p-6 rounded-3xl space-y-2 text-center">
               <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Dépenses prévues</div>
               <div className="text-xl font-black text-indigo-900 dark:text-indigo-300 font-mono">
                 {totalPlanned.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
               </div>
               <div className={`text-[10px] font-bold ${remainingPlanned >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                 Reste: {remainingPlanned.toLocaleString('fr-FR')} €
               </div>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/20 p-6 rounded-3xl space-y-2 text-center">
               <div className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Dépenses réelles</div>
               <div className="text-xl font-black text-emerald-900 dark:text-emerald-300 font-mono">
                 {totalActual.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
               </div>
               <div className={`text-[10px] font-bold ${totalActual <= totalPlanned ? "text-emerald-600" : "text-rose-600"}`}>
                 Écart: {(totalPlanned - totalActual).toLocaleString('fr-FR')} €
               </div>
            </div>
          </div>

          {incomeValue > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-[2.5rem] space-y-6">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
                <PieChart className="w-4 h-4 text-indigo-500" /> Répartition
              </div>
              <div className="space-y-4">
                {categories.map((cat, index) => {
                  const percent = (cat.planned / incomeValue) * 100;
                  if (percent <= 0) return null;
                  return (
                    <div key={index} className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                        <span className="text-slate-500 truncate max-w-[150px]">{cat.name}</span>
                        <span className="text-indigo-500 font-mono">{percent.toFixed(1)}%</span>
                      </div>
                      <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-full transition-all duration-1000"
                          style={{ width: `${Math.min(percent, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[2rem] flex items-start gap-4">
             <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl shrink-0">
                <Info className="w-5 h-5" />
             </div>
             <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
               Planifiez votre budget mensuel en définissant vos revenus et vos dépenses prévues. Suivez vos dépenses réelles tout au long du mois pour comparer et ajuster vos habitudes financières.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
