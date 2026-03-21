import { useState, useEffect, useMemo, useCallback } from "react";
import { Plus, Trash2, Wallet, PieChart, TrendingUp, TrendingDown, RefreshCcw } from "lucide-react";

interface BudgetCategory {
  name: string;
  planned: number;
  actual: number;
}

export function BudgetPlanner() {
  const [income, setIncome] = useState<string>(() => {
    return localStorage.getItem("budget_income") || "";
  });
  const [categories, setCategories] = useState<BudgetCategory[]>(() => {
    try {
      const saved = localStorage.getItem("budget_categories");
      const parsed = saved ? JSON.parse(saved) : null;
      return Array.isArray(parsed) ? parsed : [
        { name: "Logement", planned: 0, actual: 0 },
        { name: "Alimentation", planned: 0, actual: 0 },
        { name: "Transport", planned: 0, actual: 0 },
        { name: "Santé", planned: 0, actual: 0 },
        { name: "Loisirs", planned: 0, actual: 0 },
        { name: "Épargne", planned: 0, actual: 0 },
      ];
    } catch (e) {
      return [];
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
    if (categories.length > 0) {
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

  const handleClearAll = () => {
    setIncome("");
    setCategories([
      { name: "Logement", planned: 0, actual: 0 },
      { name: "Alimentation", planned: 0, actual: 0 },
      { name: "Transport", planned: 0, actual: 0 },
      { name: "Santé", planned: 0, actual: 0 },
      { name: "Loisirs", planned: 0, actual: 0 },
      { name: "Épargne", planned: 0, actual: 0 },
    ]);
  };

  const totals = useMemo(() => {
    return categories.reduce((acc, cat) => {
      acc.planned += cat.planned || 0;
      acc.actual += cat.actual || 0;
      return acc;
    }, { planned: 0, actual: 0 });
  }, [categories]);

  const incomeValue = parseFloat(income) || 0;
  const remainingPlanned = incomeValue - totals.planned;
  const remainingActual = incomeValue - totals.actual;

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
        <div className="space-y-4">
          <label htmlFor="income-input" className="flex items-center gap-2 text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <Wallet className="w-4 h-4 text-indigo-500" /> Revenu mensuel net (€)
          </label>
          <input
            id="income-input"
            type="number"
            value={income}
            onChange={(e) => setIncome(e.target.value)}
            className="w-full p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 text-xl font-bold"
            placeholder="2500"
          />
        </div>
        <div className="flex gap-4">
          <button
            onClick={addCategory}
            className="flex-1 flex items-center justify-center gap-3 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-xl shadow-indigo-500/20 transition-all"
          >
            <Plus className="w-5 h-5" /> Ajouter une catégorie
          </button>
          <button
            onClick={handleClearAll}
            className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-bold hover:bg-rose-50 hover:text-rose-500 hover:border-rose-200 transition-all flex items-center gap-2"
            aria-label="Effacer tout"
          >
            <RefreshCcw className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-12 gap-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
          <div className="col-span-4">Catégorie</div>
          <div className="col-span-3 text-center">Prévu (€)</div>
          <div className="col-span-3 text-center">Réel (€)</div>
          <div className="col-span-2 text-right">Action</div>
        </div>

        <div className="space-y-3">
          {categories.map((cat, index) => (
            <div
              key={index}
              className="grid grid-cols-12 gap-4 p-4 bg-slate-50 dark:bg-slate-900/40 rounded-[2rem] border border-slate-200 dark:border-slate-800 items-center transition-all hover:border-indigo-500/30 group"
            >
              <div className="col-span-4">
                <input
                  type="text"
                  value={cat.name}
                  onChange={(e) => updateCategory(index, "name", e.target.value)}
                  className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="col-span-3">
                <input
                  type="number"
                  value={cat.planned || ""}
                  onChange={(e) =>
                    updateCategory(index, "planned", Number(e.target.value))
                  }
                  className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-center font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="0"
                />
              </div>
              <div className="col-span-3">
                <input
                  type="number"
                  value={cat.actual || ""}
                  onChange={(e) =>
                    updateCategory(index, "actual", Number(e.target.value))
                  }
                  className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-center font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="0"
                />
              </div>
              <div className="col-span-2 flex justify-end">
                <button
                  onClick={() => removeCategory(index)}
                  className="p-3 text-rose-500 bg-rose-50 dark:bg-rose-500/10 rounded-xl opacity-0 group-hover:opacity-100 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all"
                  aria-label="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-800/50 space-y-4">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-widest text-xs mb-2">
            <TrendingUp className="w-4 h-4" /> Budget Prévu
          </div>
          <div className="flex justify-between items-end">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Total prévu</span>
            <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{totals.planned.toFixed(0)}€</span>
          </div>
          <div className="pt-4 border-t border-indigo-200 dark:border-indigo-800 flex justify-between items-center">
             <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Reste à budgéter</span>
             <span className={`text-lg font-black tracking-tight ${remainingPlanned >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
               {remainingPlanned.toFixed(0)}€
             </span>
          </div>
        </div>

        <div className="bg-slate-900 dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl space-y-4">
          <div className="flex items-center gap-2 text-slate-400 font-bold uppercase tracking-widest text-xs mb-2">
            <TrendingDown className="w-4 h-4" /> Budget Réel
          </div>
          <div className="flex justify-between items-end">
            <span className="text-slate-400 font-medium">Total dépensé</span>
            <span className="text-3xl font-black text-white tracking-tighter">{totals.actual.toFixed(0)}€</span>
          </div>
          <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
             <span className="text-sm font-bold text-slate-400">Solde restant</span>
             <span className={`text-lg font-black tracking-tight ${remainingActual >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
               {remainingActual.toFixed(0)}€
             </span>
          </div>
        </div>
      </div>

      {incomeValue > 0 && categories.length > 0 && (
        <div className="bg-slate-50 dark:bg-slate-900/40 p-10 rounded-[3rem] border border-slate-200 dark:border-slate-800">
          <h3 className="font-bold text-slate-900 dark:text-white mb-8 flex items-center gap-3 uppercase tracking-widest text-sm">
             <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-500">
                <PieChart className="w-4 h-4" />
             </div>
             Répartition visuelle
          </h3>
          <div className="space-y-6">
            {categories.map((cat, index) => {
              const plannedPercent = (cat.planned / incomeValue) * 100;
              const actualPercent = (cat.actual / incomeValue) * 100;
              return (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-bold text-slate-700 dark:text-slate-300">{cat.name}</span>
                    <span className="text-slate-400 font-mono">{(cat.actual || 0).toFixed(0)}€ / {(cat.planned || 0).toFixed(0)}€</span>
                  </div>
                  <div className="relative h-4 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 bg-slate-300 dark:bg-slate-700 transition-all duration-500"
                      style={{ width: `${Math.min(plannedPercent, 100)}%` }}
                    />
                    <div
                      className={`absolute inset-y-0 left-0 transition-all duration-500 ${cat.actual > cat.planned ? 'bg-rose-500' : 'bg-indigo-600'}`}
                      style={{ width: `${Math.min(actualPercent, 100)}%` }}
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
