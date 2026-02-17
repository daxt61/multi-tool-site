import { useState, useEffect } from "react";
import { Plus, Trash2, Wallet, CreditCard, PiggyBank, ArrowDownCircle, ArrowUpCircle, Info } from "lucide-react";

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
    const saved = localStorage.getItem("budget_categories");
    return saved ? JSON.parse(saved) : [
    { name: "Logement", planned: 0, actual: 0 },
    { name: "Alimentation", planned: 0, actual: 0 },
    { name: "Transport", planned: 0, actual: 0 },
    { name: "Santé", planned: 0, actual: 0 },
    { name: "Loisirs", planned: 0, actual: 0 },
    { name: "Épargne", planned: 0, actual: 0 },
  ];});

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
    <div className="max-w-5xl mx-auto space-y-12">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 dark:bg-black p-8 rounded-[2.5rem] text-white space-y-4 shadow-xl shadow-slate-900/10">
          <div className="flex justify-between items-center">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-indigo-400" />
            </div>
            <span className="text-xs font-black uppercase tracking-widest text-white/40">Revenu</span>
          </div>
          <div className="space-y-1">
            <input
              type="number"
              value={income}
              onChange={(e) => setIncome(e.target.value)}
              className="bg-transparent text-4xl font-black font-mono outline-none w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              placeholder="0"
            />
            <p className="text-sm text-white/40 font-bold">Revenu mensuel net (€)</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-[2.5rem] space-y-4">
          <div className="flex justify-between items-center">
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-rose-500" />
            </div>
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">Dépenses Réelles</span>
          </div>
          <div className="space-y-1">
            <div className="text-4xl font-black font-mono dark:text-white">{totalActual.toFixed(0)}€</div>
            <p className="text-sm text-slate-500 font-bold">Total cumulé ce mois</p>
          </div>
        </div>

        <div className="bg-indigo-600 p-8 rounded-[2.5rem] text-white space-y-4 shadow-xl shadow-indigo-600/20">
          <div className="flex justify-between items-center">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <PiggyBank className="w-5 h-5 text-indigo-200" />
            </div>
            <span className="text-xs font-black uppercase tracking-widest text-white/40">Solde</span>
          </div>
          <div className="space-y-1">
            <div className="text-4xl font-black font-mono">{remainingActual.toFixed(0)}€</div>
            <p className="text-sm text-indigo-100 font-bold">Restant après dépenses</p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-6 md:p-10 space-y-8">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-black dark:text-white">Gestion des catégories</h3>
          <button
            onClick={addCategory}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" /> Ajouter
          </button>
        </div>

        <div className="space-y-4">
          {/* Desktop Header */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-6 text-xs font-black uppercase tracking-widest text-slate-400">
            <div className="col-span-5">Désignation</div>
            <div className="col-span-3 text-center">Prévu (€)</div>
            <div className="col-span-3 text-center">Réel (€)</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>

          <div className="space-y-3">
            {categories.map((cat, index) => {
              const diff = cat.planned - cat.actual;
              return (
                <div
                  key={index}
                  className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 md:p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 items-center transition-all hover:shadow-lg hover:shadow-indigo-500/5"
                >
                  <div className="col-span-5">
                    <input
                      type="text"
                      value={cat.name}
                      onChange={(e) => updateCategory(index, "name", e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  <div className="col-span-3 flex md:block items-center justify-between gap-4">
                    <span className="md:hidden text-xs font-black uppercase text-slate-400">Prévu</span>
                    <input
                      type="number"
                      value={cat.planned || ""}
                      onChange={(e) => updateCategory(index, "planned", Number(e.target.value))}
                      className="w-32 md:w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 font-mono font-bold text-center outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-white"
                      placeholder="0"
                    />
                  </div>

                  <div className="col-span-3 flex md:block items-center justify-between gap-4">
                    <span className="md:hidden text-xs font-black uppercase text-slate-400">Réel</span>
                    <input
                      type="number"
                      value={cat.actual || ""}
                      onChange={(e) => updateCategory(index, "actual", Number(e.target.value))}
                      className="w-32 md:w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 font-mono font-bold text-center outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-white"
                      placeholder="0"
                    />
                  </div>

                  <div className="col-span-1 flex md:block justify-end">
                    <button
                      onClick={() => removeCategory(index)}
                      className="p-3 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all"
                      aria-label="Supprimer"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Analytics & Progress */}
      {incomeValue > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-[2.5rem] space-y-6">
            <h4 className="text-lg font-black flex items-center gap-2 dark:text-white">
              <ArrowDownCircle className="w-5 h-5 text-indigo-500" /> Répartition du budget
            </h4>
            <div className="space-y-4">
              {categories.map((cat, index) => {
                const percent = (cat.planned / incomeValue) * 100;
                if (percent <= 0) return null;
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between text-sm font-bold">
                      <span className="text-slate-600 dark:text-slate-400">{cat.name}</span>
                      <span className="text-slate-900 dark:text-white">{percent.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 transition-all duration-1000"
                        style={{ width: `${Math.min(percent, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-[2.5rem] space-y-6">
            <h4 className="text-lg font-black flex items-center gap-2 dark:text-white">
              <ArrowUpCircle className="w-5 h-5 text-emerald-500" /> Analyse des écarts
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl space-y-2">
                <div className="text-xs font-black uppercase text-slate-400">Total Prévu</div>
                <div className="text-2xl font-black font-mono dark:text-white">{totalPlanned}€</div>
              </div>
              <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl space-y-2">
                <div className="text-xs font-black uppercase text-slate-400">Reste Budgété</div>
                <div className={`text-2xl font-black font-mono ${remainingPlanned >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {remainingPlanned}€
                </div>
              </div>
            </div>
            <div className="p-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-3xl border border-indigo-100 dark:border-indigo-900/40">
              <div className="flex items-start gap-4">
                <Info className="w-5 h-5 text-indigo-500 mt-1 shrink-0" />
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                  {remainingActual >= 0
                    ? `Bravo ! Il vous reste actuellement ${remainingActual}€ sur votre revenu total après avoir payé vos factures réelles.`
                    : `Attention ! Vous avez dépensé ${Math.abs(remainingActual)}€ de plus que votre revenu total ce mois-ci.`}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
