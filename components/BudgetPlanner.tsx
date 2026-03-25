import { useState, useEffect } from "react";
import { Trash2, Plus, Wallet, PieChart, TrendingUp, Info } from "lucide-react";

interface BudgetCategory {
  name: string;
  planned: number;
  actual: number;
}

const DEFAULT_CATEGORIES = [
  { name: "Logement", planned: 0, actual: 0 },
  { name: "Alimentation", planned: 0, actual: 0 },
  { name: "Transport", planned: 0, actual: 0 },
  { name: "Santé", planned: 0, actual: 0 },
  { name: "Loisirs", planned: 0, actual: 0 },
  { name: "Épargne", planned: 0, actual: 0 },
];

export function BudgetPlanner() {
  const [income, setIncome] = useState<string>(() => {
    return localStorage.getItem("budget_income") || "";
  });
  const [categories, setCategories] = useState<BudgetCategory[]>(() => {
    try {
      const saved = localStorage.getItem("budget_categories");
      const parsed = saved ? JSON.parse(saved) : null;
      return Array.isArray(parsed) ? parsed : DEFAULT_CATEGORIES;
    } catch (e) {
      return DEFAULT_CATEGORIES;
    }
  });

  useEffect(() => {
    localStorage.setItem("budget_income", income);
  }, [income]);

  useEffect(() => {
    localStorage.setItem("budget_categories", JSON.stringify(categories));
  }, [categories]);

  const addCategory = () => {
    setCategories([...categories, { name: "Nouvelle catégorie", planned: 0, actual: 0 }]);
  };

  const removeCategory = (index: number) => {
    setCategories(categories.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    setIncome("");
    setCategories(DEFAULT_CATEGORIES);
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

  const totalPlanned = categories.reduce((sum, cat) => sum + cat.planned, 0);
  const totalActual = categories.reduce((sum, cat) => sum + cat.actual, 0);
  const incomeValue = parseFloat(income) || 0;
  const remainingPlanned = incomeValue - totalPlanned;
  const remainingActual = incomeValue - totalActual;

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <div className="flex justify-between items-center px-1">
        <h3 className="font-bold flex items-center gap-2 dark:text-white uppercase tracking-wider text-xs">
          <Wallet className="w-5 h-5 text-indigo-500" /> Planificateur de Budget
        </h3>
        <button
          onClick={clearAll}
          className="text-xs font-bold px-3 py-1 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 transition-all flex items-center gap-1"
        >
          <Trash2 className="w-3 h-3" /> Effacer tout
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Input and Categories */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="space-y-4">
              <label htmlFor="income-input" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Revenu mensuel net (€)</label>
              <input
                id="income-input"
                type="number"
                value={income}
                onChange={(e) => setIncome(e.target.value)}
                className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all dark:text-white"
                placeholder="Ex: 2500"
              />
            </div>

            <div className="space-y-4 pt-6 border-t border-slate-200 dark:border-slate-800">
              <div className="flex justify-between items-center mb-2 px-1">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">Catégories de dépenses</label>
                <button
                  onClick={addCategory}
                  className="px-4 py-2 bg-indigo-600 text-white text-xs font-black rounded-xl hover:bg-indigo-700 transition-all flex items-center gap-2"
                >
                  <Plus className="w-3 h-3" /> Ajouter
                </button>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-12 gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400 px-4">
                  <span className="col-span-4">Catégorie</span>
                  <span className="col-span-3">Prévu (€)</span>
                  <span className="col-span-3">Réel (€)</span>
                  <span className="col-span-2 text-right">Action</span>
                </div>
                {categories.map((cat, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-12 gap-3 p-3 bg-white dark:bg-slate-800 rounded-2xl items-center border border-slate-100 dark:border-slate-700 shadow-sm transition-all hover:border-indigo-500/30 group"
                  >
                    <div className="col-span-4">
                      <input
                        type="text"
                        value={cat.name}
                        onChange={(e) => updateCategory(index, "name", e.target.value)}
                        className="w-full bg-transparent font-bold text-sm outline-none dark:text-white"
                      />
                    </div>
                    <div className="col-span-3">
                      <input
                        type="number"
                        value={cat.planned || ""}
                        onChange={(e) => updateCategory(index, "planned", Number(e.target.value))}
                        className="w-full bg-transparent font-mono text-sm outline-none dark:text-slate-300"
                        placeholder="0"
                      />
                    </div>
                    <div className="col-span-3">
                      <input
                        type="number"
                        value={cat.actual || ""}
                        onChange={(e) => updateCategory(index, "actual", Number(e.target.value))}
                        className="w-full bg-transparent font-mono text-sm outline-none dark:text-slate-300"
                        placeholder="0"
                      />
                    </div>
                    <div className="col-span-2 flex justify-end">
                      <button
                        onClick={() => removeCategory(index)}
                        className="p-2 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                        aria-label="Supprimer"
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

        {/* Right Column: Summaries and Distribution */}
        <div className="space-y-6">
          <div className="p-8 bg-indigo-600 rounded-[2.5rem] text-white space-y-6 shadow-xl shadow-indigo-500/20">
            <h3 className="font-black uppercase tracking-widest text-xs opacity-70">Récapitulatif Prévu</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <span className="text-sm font-bold opacity-80">Total dépenses:</span>
                <span className="text-2xl font-black font-mono">{totalPlanned.toFixed(0)} €</span>
              </div>
              <div className="flex justify-between items-end pt-4 border-t border-white/10">
                <span className="text-sm font-bold opacity-80">Reste à budgéter:</span>
                <span className={`text-2xl font-black font-mono ${remainingPlanned >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                  {remainingPlanned.toFixed(0)} €
                </span>
              </div>
            </div>
          </div>

          <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] space-y-6 shadow-sm">
            <h3 className="font-black uppercase tracking-widest text-xs text-slate-400">Suivi Réel</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <span className="text-sm font-bold text-slate-500">Total dépensé:</span>
                <span className="text-2xl font-black font-mono dark:text-white">{totalActual.toFixed(0)} €</span>
              </div>
              <div className="flex justify-between items-end pt-4 border-t border-slate-100 dark:border-slate-800">
                <span className="text-sm font-bold text-slate-500">Solde restant:</span>
                <span className={`text-2xl font-black font-mono ${remainingActual >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                  {remainingActual.toFixed(0)} €
                </span>
              </div>
            </div>
          </div>

          {incomeValue > 0 && (
            <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] space-y-6 shadow-sm">
              <h3 className="font-black dark:text-white flex items-center gap-2 uppercase tracking-widest text-[10px]">
                <PieChart className="w-4 h-4 text-indigo-500" /> Répartition du budget
              </h3>
              <div className="space-y-4">
                {categories.map((cat, index) => {
                  const percent = (cat.planned / incomeValue) * 100;
                  if (percent <= 0) return null;
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                        <span className="text-slate-400 truncate w-32">{cat.name}</span>
                        <span className="text-indigo-500">{percent.toFixed(0)}%</span>
                      </div>
                      <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-500 h-full transition-all duration-500"
                          style={{ width: `${Math.min(percent, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl space-y-3 border border-slate-100 dark:border-slate-800">
            <h4 className="font-black text-slate-400 flex items-center gap-2 text-[10px] uppercase tracking-wider">
              <Info className="w-4 h-4" /> Confidentialité
            </h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-bold">
              Vos données budgétaires sont stockées localement dans votre navigateur. Aucune information n'est transmise ou sauvegardée sur nos serveurs.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
