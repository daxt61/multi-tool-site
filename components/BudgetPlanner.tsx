import { useState, useEffect, useMemo } from "react";
import {
  Plus, Trash2, PieChart, TrendingUp,
  Banknote, CreditCard,
  PiggyBank, ArrowRight
} from "lucide-react";

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
    ];
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

  const stats = useMemo(() => {
    const totalPlanned = categories.reduce((sum, cat) => sum + cat.planned, 0);
    const totalActual = categories.reduce((sum, cat) => sum + cat.actual, 0);
    const incomeValue = parseFloat(income) || 0;
    return {
      totalPlanned,
      totalActual,
      incomeValue,
      remainingPlanned: incomeValue - totalPlanned,
      remainingActual: incomeValue - totalActual,
      percentUsed: totalPlanned > 0 ? (totalActual / totalPlanned) * 100 : 0
    };
  }, [categories, income]);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 text-white p-8 rounded-[2rem] space-y-4 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <Banknote className="w-20 h-20" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <label htmlFor="income" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Revenu Mensuel</label>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black">€</span>
              <input
                id="income"
                type="number"
                value={income}
                onChange={(e) => setIncome(e.target.value)}
                placeholder="0"
                className="bg-transparent text-4xl font-black outline-none w-full placeholder:text-slate-800"
              />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-[2rem] space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-500" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Total Prévu</span>
          </div>
          <div className="text-4xl font-black tracking-tight dark:text-white">
            {stats.totalPlanned.toFixed(0)} <span className="text-xl text-slate-300">€</span>
          </div>
          <div className={`text-xs font-bold flex items-center gap-1 ${stats.remainingPlanned >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
            {stats.remainingPlanned >= 0 ? 'Restant: ' : 'Excédent: '}
            {Math.abs(stats.remainingPlanned).toFixed(0)} €
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-[2rem] space-y-4">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-indigo-500" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Total Réel</span>
          </div>
          <div className="text-4xl font-black tracking-tight dark:text-white">
            {stats.totalActual.toFixed(0)} <span className="text-xl text-slate-300">€</span>
          </div>
          <div className={`text-xs font-bold flex items-center gap-1 ${stats.remainingActual >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
            {stats.remainingActual >= 0 ? 'Solde: ' : 'Déficit: '}
            {Math.abs(stats.remainingActual).toFixed(0)} €
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Categories List */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex justify-between items-center px-2">
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Catégories de dépenses</h3>
            </div>
            <button
              onClick={addCategory}
              className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-bold hover:opacity-90 transition-all flex items-center gap-2"
            >
              <Plus className="w-3.5 h-3.5" /> Ajouter
            </button>
          </div>

          <div className="space-y-3">
            {categories.map((cat, index) => {
              const diff = cat.planned - cat.actual;
              const percent = cat.planned > 0 ? (cat.actual / cat.planned) * 100 : 0;

              return (
                <div key={index} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 md:p-6 transition-all hover:border-indigo-500/30 group">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                    <div className="md:col-span-4">
                      <input
                        type="text"
                        value={cat.name}
                        onChange={(e) => updateCategory(index, "name", e.target.value)}
                        className="w-full bg-transparent font-bold text-slate-900 dark:text-white outline-none focus:text-indigo-500 transition-colors"
                      />
                    </div>

                    <div className="md:col-span-3">
                      <div className="relative group/input">
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-300 font-bold text-xs">Prévu</span>
                        <input
                          type="number"
                          value={cat.planned || ""}
                          onChange={(e) => updateCategory(index, "planned", Number(e.target.value))}
                          className="w-full pl-12 bg-transparent text-right font-black font-mono text-sm outline-none dark:text-slate-200"
                          placeholder="0"
                        />
                      </div>
                    </div>

                    <div className="md:col-span-3">
                      <div className="relative group/input">
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-300 font-bold text-xs">Réel</span>
                        <input
                          type="number"
                          value={cat.actual || ""}
                          onChange={(e) => updateCategory(index, "actual", Number(e.target.value))}
                          className="w-full pl-12 bg-transparent text-right font-black font-mono text-sm outline-none dark:text-slate-200"
                          placeholder="0"
                        />
                      </div>
                    </div>

                    <div className="md:col-span-2 flex items-center justify-end gap-4">
                      <div className={`text-xs font-black font-mono ${diff >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {diff >= 0 ? '+' : ''}{diff.toFixed(0)}€
                      </div>
                      <button
                        onClick={() => removeCategory(index)}
                        className="p-2 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4 flex items-center gap-4">
                    <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-1000 ${percent > 100 ? 'bg-rose-500' : 'bg-indigo-500'}`}
                        style={{ width: `${Math.min(percent, 100)}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-black font-mono text-slate-400 w-8 text-right">
                      {percent.toFixed(0)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex items-center gap-2 px-1">
              <TrendingUp className="w-4 h-4 text-indigo-500" />
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Répartition</h4>
            </div>

            <div className="space-y-4">
              {categories.map((cat, index) => {
                const percent = stats.incomeValue > 0 ? (cat.planned / stats.incomeValue) * 100 : 0;
                if (cat.planned === 0) return null;

                return (
                  <div key={index} className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      <span className="truncate pr-4">{cat.name}</span>
                      <span>{percent.toFixed(1)}%</span>
                    </div>
                    <div className="h-1 bg-white dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500/40 rounded-full"
                        style={{ width: `${Math.min(percent, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {categories.every(c => c.planned === 0) && (
                <div className="text-center py-8 text-slate-400">
                  <PieChart className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p className="text-xs font-bold">Aucune donnée planifiée</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-indigo-600 text-white p-8 rounded-[2rem] space-y-4 relative overflow-hidden shadow-xl shadow-indigo-500/20">
            <div className="absolute -bottom-4 -right-4 opacity-10">
              <PiggyBank className="w-24 h-24 rotate-12" />
            </div>
            <h4 className="font-black tracking-tight text-lg">Conseil Budgétaire</h4>
            <p className="text-indigo-100 text-xs leading-relaxed font-medium">
              La règle du 50/30/20 est un bon point de départ : 50% pour vos besoins, 30% pour vos envies, et 20% pour l'épargne et le remboursement de dettes.
            </p>
            <div className="pt-2">
              <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:gap-3 transition-all">
                En savoir plus <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
