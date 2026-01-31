import { useState, useEffect, useMemo } from "react";
import { Plus, Trash2, CreditCard, PieChart, History, Calendar, Tag, Euro } from "lucide-react";

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
  Logement: "bg-indigo-500",
  Loisirs: "bg-rose-500",
  Santé: "bg-teal-500",
  Shopping: "bg-amber-500",
  Factures: "bg-violet-500",
  Autre: "bg-slate-500",
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
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Form Section */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-6 md:p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-6">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 px-2 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nouvelle Dépense
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Courses"
              className="w-full p-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium dark:text-white"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Montant (€)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              step="0.01"
              className="w-full p-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-black font-mono dark:text-white"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Catégorie</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold cursor-pointer dark:text-white"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold dark:text-white"
            />
          </div>
        </div>
        <button
          onClick={addExpense}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-sm transition-all active:scale-[0.98] shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" /> Ajouter à la liste
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Total Card */}
        <div className="lg:col-span-1 bg-slate-900 dark:bg-black p-8 rounded-[2.5rem] text-white flex flex-col justify-center items-center space-y-4 shadow-xl shadow-indigo-500/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
          <CreditCard className="w-8 h-8 text-indigo-400 mb-2" />
          <span className="text-xs font-black uppercase tracking-widest text-slate-500">Dépenses Totales</span>
          <div className="text-5xl font-black font-mono tracking-tighter">
            {totalExpenses.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}<span className="text-indigo-500 ml-1">€</span>
          </div>
          {expenses.length > 0 && (
            <div className="mt-4 px-4 py-1.5 bg-white/5 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-400 border border-white/5">
              {expenses.length} Transaction{expenses.length > 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Categories Breakdown */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900/40 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-6">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-2">
            <PieChart className="w-4 h-4" /> Analyse par catégorie
          </h3>
          {expensesByCategory.length > 0 ? (
            <div className="space-y-4">
              {expensesByCategory.map((cat) => (
                <div key={cat.category} className="space-y-2">
                  <div className="flex justify-between items-center text-sm font-bold">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${CATEGORY_COLORS[cat.category] || 'bg-slate-500'}`} />
                      <span className="dark:text-slate-300">{cat.category}</span>
                    </div>
                    <div className="flex gap-3">
                      <span className="text-slate-400 text-xs">({((cat.total / (totalExpenses || 1)) * 100).toFixed(0)}%)</span>
                      <span className="dark:text-white font-mono">{cat.total.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</span>
                    </div>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-1000 ${CATEGORY_COLORS[cat.category] || 'bg-slate-500'}`}
                      style={{ width: `${(cat.total / (totalExpenses || 1)) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center py-10 text-slate-400 space-y-3">
              <PieChart className="w-10 h-10 opacity-10" />
              <p className="text-sm font-medium italic">En attente de données...</p>
            </div>
          )}
        </div>
      </div>

      {/* History */}
      <div className="bg-white dark:bg-slate-900/40 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <History className="w-4 h-4" /> Historique récent
          </h3>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[400px] overflow-y-auto no-scrollbar">
          {expenses.length > 0 ? (
            expenses.map((expense) => (
              <div key={expense.id} className="p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                <div className="flex items-center gap-5">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${CATEGORY_COLORS[expense.category] || 'bg-slate-500'} bg-opacity-10 text-opacity-100`}>
                     <Tag className={`w-5 h-5 ${CATEGORY_COLORS[expense.category]?.replace('bg-', 'text-') || 'text-slate-500'}`} />
                  </div>
                  <div>
                    <div className="font-black text-slate-900 dark:text-white">{expense.description}</div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {new Date(expense.date).toLocaleDateString("fr-FR")}
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                        <Euro className="w-3 h-3" /> {expense.category}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <span className="text-lg font-black font-mono text-rose-500">
                    -{expense.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                  </span>
                  <button
                    onClick={() => removeExpense(expense.id)}
                    className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all md:opacity-0 group-hover:opacity-100"
                    aria-label="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-20 text-center text-slate-400 space-y-4">
               <History className="w-12 h-12 mx-auto opacity-10" />
               <p className="text-sm font-bold uppercase tracking-widest">Aucune dépense enregistrée</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
