import { useState, useEffect, useMemo } from "react";
import { Plus, Trash2, Wallet, PieChart, TrendingDown, TrendingUp, Banknote } from "lucide-react";

interface BudgetCategory {
  name: string;
  planned: number;
  actual: number;
}

const DEFAULT_CATEGORIES: BudgetCategory[] = [
  { name: "Logement", planned: 0, actual: 0 },
  { name: "Alimentation", planned: 0, actual: 0 },
  { name: "Transport", planned: 0, actual: 0 },
  { name: "Santé", planned: 0, actual: 0 },
  { name: "Loisirs", planned: 0, actual: 0 },
  { name: "Épargne", planned: 0, actual: 0 },
];

export function BudgetPlanner() {
  const [income, setIncome] = useState<string>(() => {
    try {
      return localStorage.getItem("budget_income") || "";
    } catch (e) {
      console.error("Failed to load income from localStorage", e);
      return "";
    }
  });

  const [categories, setCategories] = useState<BudgetCategory[]>(() => {
    try {
      const saved = localStorage.getItem("budget_categories");
      if (!saved) return DEFAULT_CATEGORIES;
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : DEFAULT_CATEGORIES;
    } catch (e) {
      console.error("Failed to load budget categories from localStorage", e);
      return DEFAULT_CATEGORIES;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("budget_income", income);
    } catch (e) {
      console.error("Failed to save income to localStorage", e);
    }
  }, [income]);

  useEffect(() => {
    try {
      localStorage.setItem("budget_categories", JSON.stringify(categories));
    } catch (e) {
      console.error("Failed to save budget categories to localStorage", e);
    }
  }, [categories]);

  const addCategory = () => {
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

  const totalPlanned = useMemo(() => categories.reduce((sum, cat) => sum + (Number(cat.planned) || 0), 0), [categories]);
  const totalActual = useMemo(() => categories.reduce((sum, cat) => sum + (Number(cat.actual) || 0), 0), [categories]);
  const incomeValue = parseFloat(income) || 0;
  const remainingPlanned = incomeValue - totalPlanned;
  const remainingActual = incomeValue - totalActual;

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      {/* Income Section */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800">
        <div className="max-w-md">
          <label htmlFor="monthly-income" className="block text-sm font-black uppercase tracking-widest text-slate-400 mb-3 px-1">
            Revenu mensuel net (€)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Banknote className="h-5 w-5 text-slate-400" />
            </div>
            <input
              id="monthly-income"
              type="number"
              value={income}
              onChange={(e) => setIncome(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xl font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300"
              placeholder="Ex: 2500"
            />
          </div>
        </div>
      </div>

      {/* Categories Table */}
      <div className="bg-white dark:bg-slate-900/40 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <Wallet className="w-4 h-4" /> Catégories de dépenses
          </h3>
          <button
            onClick={addCategory}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" /> Ajouter
          </button>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[600px] p-6 md:p-8 space-y-3">
            <div className="grid grid-cols-12 gap-4 text-xs font-black uppercase tracking-widest text-slate-400 px-4 mb-2">
              <div className="col-span-4">Catégorie</div>
              <div className="col-span-2">Prévu (€)</div>
              <div className="col-span-2">Réel (€)</div>
              <div className="col-span-3">Écart</div>
              <div className="col-span-1 text-center">Action</div>
            </div>

            {categories.map((cat, index) => {
              const diff = (Number(cat.planned) || 0) - (Number(cat.actual) || 0);
              return (
                <div
                  key={index}
                  className="grid grid-cols-12 gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl items-center border border-transparent hover:border-slate-200 dark:hover:border-slate-800 transition-all"
                >
                  <div className="col-span-4">
                    <input
                      type="text"
                      value={cat.name}
                      onChange={(e) => updateCategory(index, "name", e.target.value)}
                      className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:border-indigo-500 transition-all"
                      aria-label="Nom de la catégorie"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      value={cat.planned || ""}
                      onChange={(e) =>
                        updateCategory(index, "planned", e.target.value === "" ? 0 : Number(e.target.value))
                      }
                      className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:border-indigo-500 transition-all"
                      placeholder="0"
                      aria-label="Montant prévu"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      value={cat.actual || ""}
                      onChange={(e) =>
                        updateCategory(index, "actual", e.target.value === "" ? 0 : Number(e.target.value))
                      }
                      className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:border-indigo-500 transition-all"
                      placeholder="0"
                      aria-label="Montant réel"
                    />
                  </div>
                  <div className="col-span-3 flex items-center">
                    <span
                      className={`text-sm font-black ${diff >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}
                    >
                      {diff >= 0 ? "+" : ""}
                      {diff.toLocaleString()} €
                    </span>
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
              );
            })}
          </div>
        </div>
      </div>

      {/* Summaries */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-indigo-50 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/10 p-8 rounded-3xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-sm">Budget prévu</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-baseline">
              <span className="text-slate-500 dark:text-slate-400 font-bold">Total dépenses:</span>
              <span className="text-2xl font-black text-slate-900 dark:text-white">{totalPlanned.toLocaleString()} €</span>
            </div>
            <div className="flex justify-between items-baseline pt-4 border-t border-indigo-100 dark:border-indigo-500/10">
              <span className="text-slate-500 dark:text-slate-400 font-bold">Reste à budgéter:</span>
              <span
                className={`text-2xl font-black ${remainingPlanned >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}
              >
                {remainingPlanned.toLocaleString()} €
              </span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl shadow-slate-900/10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-white/10 text-white rounded-xl flex items-center justify-center backdrop-blur-sm">
              <TrendingDown className="w-5 h-5" />
            </div>
            <h3 className="font-black uppercase tracking-wider text-sm">Budget réel</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-baseline">
              <span className="text-slate-400 font-bold">Total dépenses:</span>
              <span className="text-2xl font-black">{totalActual.toLocaleString()} €</span>
            </div>
            <div className="flex justify-between items-baseline pt-4 border-t border-white/10">
              <span className="text-slate-400 font-bold">Solde restant:</span>
              <span
                className={`text-2xl font-black ${remainingActual >= 0 ? "text-emerald-400" : "text-rose-400"}`}
              >
                {remainingActual.toLocaleString()} €
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Distribution */}
      {incomeValue > 0 && (
        <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-3xl border border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-8 flex items-center gap-2">
            <PieChart className="w-4 h-4" /> Répartition du budget
          </h3>
          <div className="space-y-6">
            {categories.map((cat, index) => {
              const percent = (incomeValue > 0 ? (Number(cat.planned) || 0) / incomeValue : 0) * 100;
              return (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between text-sm font-bold">
                    <span className="text-slate-700 dark:text-slate-300 truncate">{cat.name}</span>
                    <span className="text-slate-500">{percent.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full transition-all duration-500 rounded-full"
                      style={{ width: `${Math.min(percent, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
