import { useState, useEffect } from "react";
import { Plus, Trash2, Wallet, PiggyBank, Receipt, TrendingDown, LayoutGrid } from "lucide-react";

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
      return "";
    }
  });
  const [categories, setCategories] = useState<BudgetCategory[]>(() => {
    try {
      const saved = localStorage.getItem("budget_categories");
      if (!saved) return DEFAULT_CATEGORIES;
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed.filter(cat =>
        cat && typeof cat === 'object' && typeof cat.name === 'string'
      ) : DEFAULT_CATEGORIES;
    } catch (e) {
      console.error("Failed to load budget_categories", e);
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

  const totalPlanned = categories.reduce((sum, cat) => sum + cat.planned, 0);
  const totalActual = categories.reduce((sum, cat) => sum + cat.actual, 0);
  const incomeValue = parseFloat(income) || 0;
  const remainingPlanned = incomeValue - totalPlanned;
  const remainingActual = incomeValue - totalActual;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800">
        <div className="max-w-md">
          <label htmlFor="income-input" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 block mb-2">
            Revenu mensuel net (€)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Wallet className="h-5 w-5 text-slate-400" />
            </div>
            <input
              id="income-input"
              type="number"
              value={income}
              onChange={(e) => setIncome(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all dark:text-white"
              placeholder="Ex: 2500"
            />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-indigo-500" /> Catégories de dépenses
          </h3>
          <button
            onClick={addCategory}
            className="w-full sm:w-auto px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> Ajouter une catégorie
          </button>
        </div>

        <div className="space-y-4">
          <div className="hidden md:grid grid-cols-4 gap-4 px-4 text-xs font-black uppercase tracking-widest text-slate-400">
            <span>Catégorie</span>
            <span>Prévu (€)</span>
            <span>Réel (€)</span>
            <span className="text-right">Écart</span>
          </div>

          <div className="space-y-3">
            {categories.map((cat, index) => {
              const diff = cat.planned - cat.actual;
              return (
                <div
                  key={index}
                  className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 md:p-2 bg-slate-50 dark:bg-slate-900/50 rounded-2xl items-center group hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                >
                  <div className="relative">
                    <label htmlFor={`cat-name-${index}`} className="sr-only">Nom de la catégorie</label>
                    <input
                      id={`cat-name-${index}`}
                      type="text"
                      value={cat.name}
                      onChange={(e) => updateCategory(index, "name", e.target.value)}
                      className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold dark:text-white"
                    />
                  </div>
                  <div className="relative">
                    <label htmlFor={`cat-planned-${index}`} className="sr-only">Montant prévu</label>
                    <input
                      id={`cat-planned-${index}`}
                      type="number"
                      value={cat.planned || ""}
                      onChange={(e) =>
                        updateCategory(index, "planned", Number(e.target.value))
                      }
                      className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold dark:text-white"
                      placeholder="0"
                    />
                  </div>
                  <div className="relative">
                    <label htmlFor={`cat-actual-${index}`} className="sr-only">Montant réel</label>
                    <input
                      id={`cat-actual-${index}`}
                      type="number"
                      value={cat.actual || ""}
                      onChange={(e) =>
                        updateCategory(index, "actual", Number(e.target.value))
                      }
                      className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold dark:text-white"
                      placeholder="0"
                    />
                  </div>
                  <div className="flex items-center justify-between md:justify-end gap-4 px-2">
                    <span
                      className={`text-sm font-black ${diff >= 0 ? "text-emerald-600" : "text-rose-600"}`}
                    >
                      {diff >= 0 ? "+" : ""}
                      {diff.toFixed(0)}€
                    </span>
                    <button
                      onClick={() => removeCategory(index)}
                      className="p-2 text-slate-400 hover:text-rose-500 transition-colors rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10"
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 p-8 rounded-[2rem]">
          <h3 className="text-xs font-black uppercase tracking-widest text-indigo-400 mb-6 flex items-center gap-2">
            <PiggyBank className="w-4 h-4" /> Budget prévu
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <span className="text-sm font-bold text-slate-500">Total dépenses</span>
              <span className="text-2xl font-black dark:text-white">{totalPlanned.toFixed(2)} €</span>
            </div>
            <div className="pt-4 border-t border-indigo-200/50 dark:border-indigo-800/30 flex justify-between items-end">
              <span className="text-sm font-bold text-slate-500">Reste à budgéter</span>
              <span
                className={`text-2xl font-black ${remainingPlanned >= 0 ? "text-emerald-600" : "text-rose-600"}`}
              >
                {remainingPlanned.toFixed(2)} €
              </span>
            </div>
          </div>
        </div>

        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50 p-8 rounded-[2rem]">
          <h3 className="text-xs font-black uppercase tracking-widest text-emerald-400 mb-6 flex items-center gap-2">
            <TrendingDown className="w-4 h-4" /> Budget réel
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <span className="text-sm font-bold text-slate-500">Total dépenses</span>
              <span className="text-2xl font-black dark:text-white">{totalActual.toFixed(2)} €</span>
            </div>
            <div className="pt-4 border-t border-emerald-200/50 dark:border-emerald-800/30 flex justify-between items-end">
              <span className="text-sm font-bold text-slate-500">Solde restant</span>
              <span
                className={`text-2xl font-black ${remainingActual >= 0 ? "text-emerald-600" : "text-rose-600"}`}
              >
                {remainingActual.toFixed(2)} €
              </span>
            </div>
          </div>
        </div>
      </div>

      {incomeValue > 0 && (
        <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-8 flex items-center gap-2">
            <LayoutGrid className="w-4 h-4 text-indigo-500" /> Répartition du budget
          </h3>
          <div className="grid gap-6">
            {categories.map((cat, index) => {
              const percent = (cat.planned / incomeValue) * 100;
              return (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between text-sm font-bold">
                    <span className="dark:text-white">{cat.name}</span>
                    <span className="text-slate-400">{percent.toFixed(1)}%</span>
                  </div>
                  <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full transition-all duration-500 ease-out rounded-full shadow-lg shadow-indigo-500/20"
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
