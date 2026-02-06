import { useState, useEffect, useMemo, useCallback } from "react";
import { Wallet, Plus, Trash2, TrendingUp, TrendingDown, PieChart, Info, Euro, ChevronRight, RotateCcw } from "lucide-react";

interface BudgetCategory {
  name: string;
  planned: number;
  actual: number;
}

export function BudgetPlanner() {
  const [income, setIncome] = useState<string>(() => {
    try {
      return localStorage.getItem("budget_income") || "2500";
    } catch (e) {
      return "2500";
    }
  });
  const [categories, setCategories] = useState<BudgetCategory[]>(() => {
    try {
      const saved = localStorage.getItem("budget_categories");
      return saved ? JSON.parse(saved) : [
        { name: "Logement", planned: 800, actual: 800 },
        { name: "Alimentation", planned: 400, actual: 450 },
        { name: "Transport", planned: 200, actual: 180 },
        { name: "Santé", planned: 100, actual: 50 },
        { name: "Loisirs", planned: 200, actual: 250 },
        { name: "Épargne", planned: 300, actual: 300 },
      ];
    } catch (e) {
      return [
        { name: "Logement", planned: 0, actual: 0 },
        { name: "Alimentation", planned: 0, actual: 0 },
      ];
    }
  });

  useEffect(() => {
    localStorage.setItem("budget_income", income);
  }, [income]);

  useEffect(() => {
    localStorage.setItem("budget_categories", JSON.stringify(categories));
  }, [categories]);

  const addCategory = useCallback(() => {
    setCategories(prev => [...prev, { name: "Nouvelle catégorie", planned: 0, actual: 0 }]);
  }, []);

  const removeCategory = useCallback((index: number) => {
    if (categories.length > 1) {
      setCategories(prev => prev.filter((_, i) => i !== index));
    }
  }, [categories.length]);

  const updateCategory = useCallback((
    index: number,
    field: keyof BudgetCategory,
    value: string | number
  ) => {
    setCategories(prev => {
      const newCategories = [...prev];
      newCategories[index] = { ...newCategories[index], [field]: value };
      return newCategories;
    });
  }, []);

  const handleClear = () => {
    if (window.confirm("Voulez-vous vraiment réinitialiser tout le budget ?")) {
      setIncome("0");
      setCategories([
        { name: "Logement", planned: 0, actual: 0 },
        { name: "Alimentation", planned: 0, actual: 0 },
      ]);
    }
  };

  const totals = useMemo(() => {
    const totalPlanned = categories.reduce((sum, cat) => sum + (cat.planned || 0), 0);
    const totalActual = categories.reduce((sum, cat) => sum + (cat.actual || 0), 0);
    const incomeValue = parseFloat(income) || 0;

    return {
      totalPlanned,
      totalActual,
      incomeValue,
      remainingPlanned: incomeValue - totalPlanned,
      remainingActual: incomeValue - totalActual,
      usagePercent: incomeValue > 0 ? (totalActual / incomeValue) * 100 : 0
    };
  }, [categories, income]);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Input & Controls */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8 shadow-sm">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="income" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Wallet className="w-3 h-3" /> Revenu mensuel net
              </label>
              <button
                onClick={handleClear}
                className="text-xs font-bold text-indigo-500 hover:text-indigo-600 flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3 h-3" /> Effacer
              </button>
            </div>

            <div className="relative">
              <input
                id="income"
                type="number"
                value={income}
                onChange={(e) => setIncome(e.target.value)}
                className="w-full p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl text-4xl font-black font-mono outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
                placeholder="2500"
              />
              <span className="absolute right-6 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-300">€</span>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Catégories</h3>
                <button
                  onClick={addCategory}
                  className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-all flex items-center gap-1.5 shadow-lg shadow-indigo-600/20"
                >
                  <Plus className="w-3 h-3" /> Ajouter
                </button>
              </div>

              <div className="space-y-3 max-h-[400px] overflow-y-auto no-scrollbar pr-1">
                {categories.map((cat, index) => (
                  <div key={index} className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-3 group animate-in fade-in slide-in-from-left-4 duration-300">
                    <div className="flex justify-between gap-2">
                      <input
                        type="text"
                        value={cat.name}
                        onChange={(e) => updateCategory(index, "name", e.target.value)}
                        className="flex-1 bg-transparent font-bold text-sm outline-none border-b border-transparent focus:border-indigo-500 transition-colors"
                        placeholder="Catégorie"
                      />
                      <button
                        onClick={() => removeCategory(index)}
                        className="p-1 text-slate-300 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Prévu</label>
                        <div className="relative">
                          <input
                            type="number"
                            value={cat.planned || ""}
                            onChange={(e) => updateCategory(index, "planned", parseFloat(e.target.value) || 0)}
                            className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg text-sm font-bold font-mono outline-none focus:border-indigo-500"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-300">€</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Réel</label>
                        <div className="relative">
                          <input
                            type="number"
                            value={cat.actual || ""}
                            onChange={(e) => updateCategory(index, "actual", parseFloat(e.target.value) || 0)}
                            className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg text-sm font-bold font-mono outline-none focus:border-indigo-500"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-300">€</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-slate-900 dark:bg-black p-8 rounded-[2.5rem] shadow-xl shadow-indigo-500/10 flex flex-col items-center justify-center space-y-2 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-3xl transition-transform group-hover:scale-150 duration-700"></div>
            <div className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Utilisation du budget</div>
            <div className="text-5xl font-black text-white font-mono tracking-tighter">
              {totals.usagePercent.toFixed(1)}%
            </div>
            <div className="w-full h-1.5 bg-white/10 rounded-full mt-4 overflow-hidden">
               <div
                className={`h-full transition-all duration-1000 ${totals.usagePercent > 100 ? 'bg-rose-500' : 'bg-indigo-500'}`}
                style={{ width: `${Math.min(totals.usagePercent, 100)}%` }}
               ></div>
            </div>
          </div>
        </div>

        {/* Right Column: Visualization & Summary */}
        <div className="lg:col-span-7 space-y-8">
          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 md:p-10 shadow-sm space-y-10">
            <div className="flex items-center gap-3 px-2">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                <PieChart className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Breakdown par catégorie</h3>
            </div>

            <div className="space-y-6">
              {categories.map((cat, index) => {
                const diff = (cat.planned || 0) - (cat.actual || 0);
                const percent = totals.incomeValue > 0 ? ((cat.actual || 0) / totals.incomeValue) * 100 : 0;

                return (
                  <div key={index} className="space-y-2 group">
                    <div className="flex justify-between items-end px-1">
                      <div>
                        <span className="text-sm font-black dark:text-white flex items-center gap-1.5">
                          {cat.name}
                          <ChevronRight className="w-3 h-3 text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </span>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {cat.actual.toFixed(2)}€ sur {cat.planned.toFixed(2)}€ prévu
                        </div>
                      </div>
                      <div className={`text-xs font-black font-mono ${diff >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                        {diff >= 0 ? "+" : ""}{diff.toFixed(2)}€
                      </div>
                    </div>
                    <div className="relative h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="absolute h-full bg-slate-200 dark:bg-slate-700 transition-all duration-700"
                        style={{ width: `${Math.min((cat.planned / totals.incomeValue) * 100, 100)}%` }}
                      ></div>
                      <div
                        className={`absolute h-full transition-all duration-1000 shadow-sm ${diff >= 0 ? 'bg-indigo-500' : 'bg-rose-500'}`}
                        style={{ width: `${Math.min(percent, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/30 p-8 rounded-[2.5rem] space-y-4">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs font-black uppercase tracking-widest">Budget Prévu</span>
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-black font-mono">{totals.totalPlanned.toFixed(2)}€</div>
                <div className={`text-xs font-bold ${totals.remainingPlanned >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                   {totals.remainingPlanned >= 0 ? 'Reste à budgéter: ' : 'Dépassement: '}
                   {Math.abs(totals.remainingPlanned).toFixed(2)}€
                </div>
              </div>
            </div>

            <div className={`border p-8 rounded-[2.5rem] space-y-4 ${totals.remainingActual >= 0 ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/30' : 'bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-900/30'}`}>
              <div className={`flex items-center gap-2 ${totals.remainingActual >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                <TrendingDown className="w-4 h-4" />
                <span className="text-xs font-black uppercase tracking-widest">Budget Réel</span>
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-black font-mono">{totals.totalActual.toFixed(2)}€</div>
                <div className={`text-xs font-bold ${totals.remainingActual >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                   {totals.remainingActual >= 0 ? 'Solde restant: ' : 'Déficit: '}
                   {Math.abs(totals.remainingActual).toFixed(2)}€
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[2rem] flex items-start gap-4">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl">
              <Info className="w-5 h-5" />
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              Utilisez ce planificateur pour comparer vos prévisions avec vos dépenses réelles. Un budget équilibré vous aide à atteindre vos objectifs d'épargne plus rapidement.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
