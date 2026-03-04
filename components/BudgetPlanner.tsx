import { useState, useEffect } from "react";
import { Plus, Trash2, Wallet, PiggyBank, CreditCard, PieChart } from "lucide-react";

interface BudgetCategory {
  name: string;
  planned: number;
  actual: number;
}

export function BudgetPlanner() {
  const [income, setIncome] = useState<string>(() => {
    // Sentinel: Securely load income from localStorage.
    return localStorage.getItem("budget_income") || "";
  });
  const [categories, setCategories] = useState<BudgetCategory[]>(() => {
    try {
      // Sentinel: Securely parse localStorage data to prevent app crashes (local DoS)
      // if the data is malformed or tampered with.
      const saved = localStorage.getItem("budget_categories");
      const parsed = saved ? JSON.parse(saved) : null;

      // Sentinel: Validate data structure and content to prevent state poisoning.
      if (Array.isArray(parsed)) {
        return parsed.filter(cat =>
          typeof cat === 'object' &&
          cat !== null &&
          typeof cat.name === 'string' &&
          typeof cat.planned === 'number' &&
          typeof cat.actual === 'number'
        ).slice(0, 50); // Limit to 50 categories to prevent DoS.
      }
    } catch (e) {
      console.error("Failed to load budget categories from localStorage", e);
    }

    return [
      { name: "Logement", planned: 0, actual: 0 },
      { name: "Alimentation", planned: 0, actual: 0 },
      { name: "Transport", planned: 0, actual: 0 },
      { name: "Santé", planned: 0, actual: 0 },
      { name: "Loisirs", planned: 0, actual: 0 },
      { name: "Épargne", planned: 0, actual: 0 },
    ];
  });

  useEffect(() => {
    localStorage.setItem("budget_income", income);
  }, [income]);

  useEffect(() => {
    localStorage.setItem("budget_categories", JSON.stringify(categories));
  }, [categories]);

  const addCategory = () => {
    if (categories.length < 50) {
      setCategories([...categories, { name: "Nouvelle catégorie", planned: 0, actual: 0 }]);
    }
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
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Section */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
                <Wallet className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Revenus</h3>
            </div>

            <div className="space-y-2">
              <label htmlFor="budget-income" className="text-xs font-bold text-slate-500 dark:text-slate-400 px-1 cursor-pointer">Revenu mensuel net (€)</label>
              <input
                id="budget-income"
                type="number"
                value={income}
                onChange={(e) => setIncome(e.target.value)}
                className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white text-2xl"
                placeholder="2500"
              />
            </div>
          </div>

          <div className="bg-slate-900 dark:bg-black p-8 rounded-[2.5rem] space-y-6 shadow-xl shadow-indigo-500/10">
            <div className="space-y-2">
              <div className="text-indigo-400 font-bold uppercase tracking-widest text-[10px]">Budget Prévu</div>
              <div className={`text-3xl font-black font-mono tracking-tighter ${remainingPlanned >= 0 ? 'text-white' : 'text-rose-500'}`}>
                {remainingPlanned.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
              </div>
              <div className="text-[10px] text-slate-500 font-bold uppercase">Restant à budgéter</div>
            </div>

            <div className="h-px bg-slate-800" />

            <div className="space-y-2">
              <div className="text-emerald-400 font-bold uppercase tracking-widest text-[10px]">Solde Réel</div>
              <div className={`text-3xl font-black font-mono tracking-tighter ${remainingActual >= 0 ? 'text-white' : 'text-rose-500'}`}>
                {remainingActual.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
              </div>
              <div className="text-[10px] text-slate-500 font-bold uppercase">Disponible</div>
            </div>
          </div>
        </div>

        {/* Categories Section */}
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8 px-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
                  <CreditCard className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Dépenses par catégorie</h3>
              </div>
              <button
                onClick={addCategory}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-indigo-700 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" /> Ajouter
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-12 gap-4 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                <div className="col-span-5">Catégorie</div>
                <div className="col-span-2 text-right">Prévu (€)</div>
                <div className="col-span-2 text-right">Réel (€)</div>
                <div className="col-span-3 text-right">Écart</div>
              </div>

              {categories.map((cat, index) => {
                const diff = cat.planned - cat.actual;
                return (
                  <div
                    key={index}
                    className="grid grid-cols-12 gap-4 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl items-center group transition-all hover:border-indigo-500/30"
                  >
                    <div className="col-span-5">
                      <input
                        type="text"
                        value={cat.name}
                        onChange={(e) => updateCategory(index, "name", e.target.value)}
                        className="w-full bg-transparent font-bold dark:text-white outline-none focus:text-indigo-600 dark:focus:text-indigo-400 transition-colors"
                        placeholder="Catégorie"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        value={cat.planned || ""}
                        onChange={(e) =>
                          updateCategory(index, "planned", Number(e.target.value))
                        }
                        className="w-full bg-transparent font-bold text-right font-mono outline-none focus:text-indigo-600 dark:text-white"
                        placeholder="0"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        value={cat.actual || ""}
                        onChange={(e) =>
                          updateCategory(index, "actual", Number(e.target.value))
                        }
                        className="w-full bg-transparent font-bold text-right font-mono outline-none focus:text-indigo-600 dark:text-white"
                        placeholder="0"
                      />
                    </div>
                    <div className="col-span-3 flex items-center justify-end gap-3">
                      <span
                        className={`font-mono font-black text-sm ${diff >= 0 ? "text-emerald-500" : "text-rose-500"}`}
                      >
                        {diff >= 0 ? "+" : ""}
                        {diff.toFixed(0)}€
                      </span>
                      <button
                        onClick={() => removeCategory(index)}
                        className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
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

          {incomeValue > 0 && (
            <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-8 px-2">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                  <PieChart className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Répartition du budget prévu</h3>
              </div>
              <div className="space-y-4">
                {categories.map((cat, index) => {
                  const percent = (cat.planned / incomeValue) * 100;
                  if (percent <= 0) return null;
                  return (
                    <div key={index} className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                        <span className="text-slate-500 truncate max-w-[200px]">{cat.name}</span>
                        <span className="text-indigo-600 dark:text-indigo-400">{percent.toFixed(1)}%</span>
                      </div>
                      <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-full transition-all duration-500"
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
      </div>
    </div>
  );
}
