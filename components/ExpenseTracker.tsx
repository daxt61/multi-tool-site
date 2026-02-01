import { useState, useEffect, useMemo } from "react";
import { Plus, Trash2, CreditCard, Calendar, Tag, PieChart, TrendingDown, ArrowRight, History } from "lucide-react";

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

const CATEGORY_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  Alimentation: { bg: "bg-emerald-50 dark:bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500" },
  Transport: { bg: "bg-blue-50 dark:bg-blue-500/10", text: "text-blue-600 dark:text-blue-400", dot: "bg-blue-500" },
  Logement: { bg: "bg-purple-50 dark:bg-purple-500/10", text: "text-purple-600 dark:text-purple-400", dot: "bg-purple-500" },
  Loisirs: { bg: "bg-pink-50 dark:bg-pink-500/10", text: "text-pink-600 dark:text-pink-400", dot: "bg-pink-500" },
  Santé: { bg: "bg-red-50 dark:bg-red-500/10", text: "text-red-600 dark:text-red-400", dot: "bg-red-500" },
  Shopping: { bg: "bg-amber-50 dark:bg-amber-500/10", text: "text-amber-600 dark:text-amber-400", dot: "bg-amber-500" },
  Factures: { bg: "bg-indigo-50 dark:bg-indigo-500/10", text: "text-indigo-600 dark:text-indigo-400", dot: "bg-indigo-500" },
  Autre: { bg: "bg-slate-50 dark:bg-slate-500/10", text: "text-slate-600 dark:text-slate-400", dot: "bg-slate-500" },
};

export function ExpenseTracker() {
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem("expenses");
    return saved ? JSON.parse(saved) : [];
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
    <div className="max-w-6xl mx-auto space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form & Totals */}
        <div className="lg:col-span-7 space-y-8">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-6">
             <div className="flex items-center gap-2 px-1">
                <Plus className="w-4 h-4 text-indigo-500" />
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Nouvelle dépense</h3>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Description</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-bold"
                    placeholder="Courses, Loyer..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Montant (€)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-black text-xl text-indigo-600 dark:text-indigo-400"
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Catégorie</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-bold appearance-none cursor-pointer"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-bold"
                  />
                </div>
             </div>

             <button
                onClick={addExpense}
                className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-lg shadow-lg transition-all active:scale-[0.98] hover:opacity-90 flex items-center justify-center gap-2"
             >
                Ajouter la dépense <ArrowRight className="w-5 h-5" />
             </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-rose-500 rounded-[2.5rem] p-8 text-white shadow-xl shadow-rose-500/10 flex flex-col justify-between min-h-[160px]">
              <div className="flex justify-between items-start">
                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                  <TrendingDown className="w-6 h-6" />
                </div>
                <CreditCard className="w-8 h-8 opacity-20" />
              </div>
              <div>
                <div className="text-xs font-black uppercase tracking-widest opacity-60 mb-1">Total Dépenses</div>
                <div className="text-4xl font-black">{totalExpenses.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</div>
              </div>
            </div>

            <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-indigo-600/10 flex flex-col justify-between min-h-[160px]">
              <div className="flex justify-between items-start">
                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                  <PieChart className="w-6 h-6" />
                </div>
                <Tag className="w-8 h-8 opacity-20" />
              </div>
              <div>
                <div className="text-xs font-black uppercase tracking-widest opacity-60 mb-1">Nombre d'opérations</div>
                <div className="text-4xl font-black">{expenses.length}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Categories & History */}
        <div className="lg:col-span-5 space-y-8">
          {expensesByCategory.length > 0 && (
            <div className="bg-white dark:bg-slate-900/40 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-6">
               <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-2">
                  <PieChart className="w-4 h-4" /> Répartition par catégorie
               </h3>
               <div className="space-y-4">
                  {expensesByCategory.map((cat) => (
                    <div key={cat.category} className="space-y-2">
                      <div className="flex justify-between text-sm font-bold px-1">
                        <span className="text-slate-600 dark:text-slate-300">{cat.category}</span>
                        <span className="text-slate-900 dark:text-white">{cat.total.toFixed(2)} €</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${CATEGORY_COLORS[cat.category]?.dot || 'bg-slate-400'} transition-all duration-1000`}
                          style={{ width: `${(cat.total / totalExpenses) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
               </div>
            </div>
          )}

          <div className="bg-white dark:bg-slate-900/40 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-2">
              <History className="w-4 h-4" /> Historique récent
            </h3>

            <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2 no-scrollbar">
              {expenses.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                   <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-300">
                      <CreditCard className="w-6 h-6" />
                   </div>
                   <p className="text-sm font-medium text-slate-400">Aucune dépense enregistrée</p>
                </div>
              ) : (
                expenses.map((expense) => {
                  const colors = CATEGORY_COLORS[expense.category] || CATEGORY_COLORS.Autre;
                  return (
                    <div
                      key={expense.id}
                      className="group flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all"
                    >
                      <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center ${colors.text}`}>
                        <Tag className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-slate-900 dark:text-white truncate">{expense.description}</div>
                        <div className="text-xs font-bold text-slate-400 flex items-center gap-2">
                          {new Date(expense.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                          <span className="w-1 h-1 rounded-full bg-slate-300" />
                          {expense.category}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-black text-rose-500">-{expense.amount.toFixed(2)} €</div>
                        <button
                          onClick={() => removeExpense(expense.id)}
                          className="text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
