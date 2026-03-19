import { useState, useEffect } from "react";
import { Trash2, Plus } from "lucide-react";

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
    const defaultCategories = [
      { name: "Logement", planned: 0, actual: 0 },
      { name: "Alimentation", planned: 0, actual: 0 },
      { name: "Transport", planned: 0, actual: 0 },
      { name: "Santé", planned: 0, actual: 0 },
      { name: "Loisirs", planned: 0, actual: 0 },
      { name: "Épargne", planned: 0, actual: 0 },
    ];
    try {
      const saved = localStorage.getItem("budget_categories");
      const parsed = saved ? JSON.parse(saved) : null;
      return Array.isArray(parsed) ? parsed : defaultCategories;
    } catch (e) {
      console.error("Failed to parse budget categories", e);
      return defaultCategories;
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

  const clearAll = () => {
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

  const totalPlanned = categories.reduce((sum, cat) => sum + cat.planned, 0);
  const totalActual = categories.reduce((sum, cat) => sum + cat.actual, 0);
  const incomeValue = parseFloat(income) || 0;
  const remainingPlanned = incomeValue - totalPlanned;
  const remainingActual = incomeValue - totalActual;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center px-1">
        <div className="flex-1">
          <label htmlFor="budget-income" className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">
            Revenu mensuel net (€)
          </label>
          <input
            id="budget-income"
            type="number"
            value={income}
            onChange={(e) => setIncome(e.target.value)}
            className="w-full max-w-xs p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-lg"
            placeholder="2500"
          />
        </div>
        <button
          onClick={clearAll}
          className="text-xs font-bold px-3 py-1 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 transition-all flex items-center gap-1"
        >
          <Trash2 className="w-3 h-3" /> Effacer tout
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <label className="text-xs font-black uppercase tracking-widest text-slate-400">
            Catégories de dépenses
          </label>
          <button
            onClick={addCategory}
            className="text-xs font-bold px-3 py-1 rounded-full text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 transition-all flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> Ajouter
          </button>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-4 text-[10px] font-black uppercase tracking-widest text-slate-400 px-4">
            <span>Catégorie</span>
            <span className="text-center">Prévu (€)</span>
            <span className="text-center">Réel (€)</span>
            <span className="text-right pr-8">Écart</span>
          </div>
          {categories.map((cat, index) => {
            const diff = cat.planned - cat.actual;
            return (
              <div
                key={index}
                className="grid grid-cols-4 gap-4 p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl items-center group transition-all hover:border-indigo-500/30"
              >
                <input
                  type="text"
                  value={cat.name}
                  onChange={(e) => updateCategory(index, "name", e.target.value)}
                  className="bg-transparent font-bold text-slate-700 dark:text-slate-300 outline-none"
                  aria-label="Nom de la catégorie"
                />
                <input
                  type="number"
                  value={cat.planned || ""}
                  onChange={(e) =>
                    updateCategory(index, "planned", Number(e.target.value))
                  }
                  className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl text-center font-mono outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="0"
                  aria-label="Montant prévu"
                />
                <input
                  type="number"
                  value={cat.actual || ""}
                  onChange={(e) =>
                    updateCategory(index, "actual", Number(e.target.value))
                  }
                  className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl text-center font-mono outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="0"
                  aria-label="Montant réel"
                />
                <div className="flex items-center gap-2 justify-end">
                  <span
                    className={`text-sm font-black font-mono ${diff >= 0 ? "text-emerald-500" : "text-rose-500"}`}
                  >
                    {diff >= 0 ? "+" : ""}
                    {diff.toFixed(0)}€
                  </span>
                  <button
                    onClick={() => removeCategory(index)}
                    className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors"
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-indigo-50/50 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/10 p-6 rounded-[2rem]">
          <h3 className="text-xs font-black uppercase tracking-widest text-indigo-500 mb-4">Budget prévu</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-slate-500">Total dépenses</span>
              <span className="text-xl font-black font-mono">{totalPlanned.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-indigo-100 dark:border-indigo-500/10">
              <span className="text-sm font-bold text-slate-500">Reste à budgéter</span>
              <span
                className={`text-xl font-black font-mono ${remainingPlanned >= 0 ? "text-emerald-500" : "text-rose-500"}`}
              >
                {remainingPlanned.toFixed(2)} €
              </span>
            </div>
          </div>
        </div>

        <div className="bg-emerald-50/50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/10 p-6 rounded-[2rem]">
          <h3 className="text-xs font-black uppercase tracking-widest text-emerald-500 mb-4">Budget réel</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-slate-500">Total dépenses</span>
              <span className="text-xl font-black font-mono">{totalActual.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-emerald-100 dark:border-emerald-500/10">
              <span className="text-sm font-bold text-slate-500">Solde restant</span>
              <span
                className={`text-xl font-black font-mono ${remainingActual >= 0 ? "text-emerald-500" : "text-rose-500"}`}
              >
                {remainingActual.toFixed(2)} €
              </span>
            </div>
          </div>
        </div>
      </div>

      {incomeValue > 0 && (
        <div className="pt-8 border-t border-slate-100 dark:border-slate-800">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">Visualisation</h3>
          <div className="space-y-4">
            {categories.map((cat, index) => {
              const percent = (cat.planned / incomeValue) * 100;
              return (
                <div key={index} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold px-1">
                    <span className="text-slate-600 dark:text-slate-400">{cat.name}</span>
                    <span className="text-indigo-500">{percent.toFixed(0)}%</span>
                  </div>
                  <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
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
    </div>
  );
}
