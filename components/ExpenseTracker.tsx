import { useState, useEffect, useMemo } from "react";
import { Trash2, Plus, Receipt, TrendingDown, PieChart, History, Calendar as CalendarIcon } from "lucide-react";

interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
}

const CATEGORIES = [
  "Alimentation",
  "Transport",
  "Logement",
  "Loisirs",
  "Santé",
  "Shopping",
  "Factures",
  "Autre",
];

const CATEGORY_COLORS: Record<string, string> = {
  Alimentation: "bg-emerald-500",
  Transport: "bg-blue-500",
  Logement: "bg-purple-500",
  Loisirs: "bg-pink-500",
  Santé: "bg-rose-500",
  Shopping: "bg-amber-500",
  Factures: "bg-indigo-500",
  Autre: "bg-slate-500",
};

export function ExpenseTracker() {
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    try {
      const saved = localStorage.getItem("expenses");
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  });
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Autre");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    localStorage.setItem("expenses", JSON.stringify(expenses));
  }, [expenses]);

  const addExpense = () => {
    if (description && amount) {
      const newExpense: Expense = {
        id: Date.now().toString(),
        description,
        amount: parseFloat(amount),
        category,
        date,
      };
      setExpenses([newExpense, ...expenses]);
      setDescription("");
      setAmount("");
    }
  };

  const removeExpense = (id: string) => {
    setExpenses(expenses.filter((e) => e.id !== id));
  };

  const { totalExpenses, expensesByCategory } = useMemo(() => {
    let total = 0;
    const totals: Record<string, number> = {};

    expenses.forEach((e) => {
      total += e.amount;
      totals[e.category] = (totals[e.category] || 0) + e.amount;
    });

    const byCategory = Object.entries(totals)
      .map(([cat, amount]) => ({
        category: cat,
        total: amount,
      }))
      .sort((a, b) => b.total - a.total);

    return { totalExpenses: total, expensesByCategory: byCategory };
  }, [expenses]);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Form */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
                <Plus className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Nouvelle dépense</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="exp-desc" className="text-xs font-bold text-slate-500 dark:text-slate-400 px-1 cursor-pointer">Description</label>
                <input
                  id="exp-desc"
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold focus:border-indigo-500 outline-none transition-all dark:text-white"
                  placeholder="Description de la dépense"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="exp-amount" className="text-xs font-bold text-slate-500 dark:text-slate-400 px-1 cursor-pointer">Montant (€)</label>
                  <input
                    id="exp-amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="exp-date" className="text-xs font-bold text-slate-500 dark:text-slate-400 px-1 cursor-pointer">Date</label>
                  <input
                    id="exp-date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold focus:border-indigo-500 outline-none transition-all dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="exp-cat" className="text-xs font-bold text-slate-500 dark:text-slate-400 px-1 cursor-pointer">Catégorie</label>
                <select
                  id="exp-cat"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold outline-none cursor-pointer focus:border-indigo-500 transition-colors dark:text-white"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={addExpense}
                disabled={!description || !amount}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95 disabled:opacity-50 disabled:active:scale-100 mt-2"
              >
                Ajouter la dépense
              </button>
            </div>
          </div>

          {/* Analytics Summary */}
          <div className="bg-slate-900 dark:bg-black p-8 rounded-[2.5rem] text-center space-y-2 shadow-xl shadow-indigo-500/10">
            <div className="text-indigo-400 font-bold uppercase tracking-widest text-[10px]">Dépenses Totales</div>
            <div className="text-5xl font-black text-white font-mono tracking-tighter">
              {totalExpenses.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
            </div>
            <div className="flex items-center justify-center gap-2 text-slate-400 text-xs font-bold pt-2">
              <TrendingDown className="w-3 h-3 text-rose-500" />
              {expenses.length} transaction{expenses.length > 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Categories & History */}
        <div className="lg:col-span-7 space-y-8">
          {/* Categories */}
          {expensesByCategory.length > 0 && (
            <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-8 px-2">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                  <PieChart className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Par catégorie</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {expensesByCategory.map((cat) => (
                  <div key={cat.category} className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-4 group transition-all hover:border-indigo-500/20">
                    <div className={`w-3 h-3 rounded-full ${CATEGORY_COLORS[cat.category] || 'bg-slate-500'} shadow-sm`} />
                    <div className="flex-1">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-tighter">{cat.category}</div>
                      <div className="font-black dark:text-white">{cat.total.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</div>
                    </div>
                    <div className="text-xs font-black text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-lg">
                      {totalExpenses > 0 ? ((cat.total / totalExpenses) * 100).toFixed(0) : 0}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* History */}
          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8 px-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                  <History className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Historique</h3>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                {expenses.length} Entrées
              </span>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 no-scrollbar">
              {expenses.length === 0 ? (
                <div className="text-center py-20 space-y-4">
                  <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto text-slate-200">
                    <Receipt className="w-8 h-8" />
                  </div>
                  <p className="text-slate-400 font-medium">Aucune dépense enregistrée</p>
                </div>
              ) : (
                expenses.map((expense) => (
                  <div
                    key={expense.id}
                    className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl hover:border-indigo-500/30 transition-all group animate-in slide-in-from-right-4 duration-300"
                  >
                    <div className={`w-1.5 h-10 rounded-full ${CATEGORY_COLORS[expense.category] || 'bg-slate-500'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-900 dark:text-white truncate">{expense.description}</div>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                        <span>{expense.category}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1"><CalendarIcon className="w-3 h-3" /> {new Date(expense.date).toLocaleDateString("fr-FR")}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-rose-500 font-mono">-{expense.amount.toFixed(2)} €</div>
                    </div>
                    <button
                      onClick={() => removeExpense(expense.id)}
                      className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                      aria-label="Supprimer la dépense"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Educational Section */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-8 md:p-12 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8 mt-12">
        <div className="max-w-3xl">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-6">Maîtriser vos finances personnelles</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="font-bold text-indigo-600 dark:text-indigo-400">Pourquoi suivre ses dépenses ?</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Le suivi quotidien de vos dépenses est la première étape vers la liberté financière. En identifiant précisément où va votre argent, vous pouvez éliminer les achats impulsifs et les abonnements inutiles, tout en priorisant ce qui compte vraiment pour vous.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-indigo-600 dark:text-indigo-400">La règle du 50/30/20</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Une méthode simple pour gérer son budget : allouez <strong>50%</strong> de vos revenus aux besoins (loyer, factures), <strong>30%</strong> aux envies (loisirs, shopping), et <strong>20%</strong> à l'épargne ou au remboursement de dettes.
              </p>
            </div>
          </div>

          <div className="mt-12 p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
            <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-rose-500" /> Conseils pour épargner efficacement
            </h3>
            <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
              <li className="flex gap-3">
                <span className="text-indigo-500 font-bold">•</span>
                <span><strong>Automatisez votre épargne :</strong> Programmez un virement dès la réception de votre salaire.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-indigo-500 font-bold">•</span>
                <span><strong>Le fonds d'urgence :</strong> Visez à mettre de côté 3 à 6 mois de dépenses courantes pour parer aux imprévus.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-indigo-500 font-bold">•</span>
                <span><strong>Analysez vos catégories :</strong> Si votre budget "Loisirs" dépasse vos prévisions, cherchez des alternatives gratuites ou moins coûteuses.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
