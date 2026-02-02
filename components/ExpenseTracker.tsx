import { useState, useEffect, useMemo } from "react";

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
  Alimentation: "bg-green-500",
  Transport: "bg-blue-500",
  Logement: "bg-purple-500",
  Loisirs: "bg-pink-500",
  Santé: "bg-red-500",
  Shopping: "bg-yellow-500",
  Factures: "bg-indigo-500",
  Autre: "bg-gray-500",
};

export function ExpenseTracker() {
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    try {
      const saved = localStorage.getItem("expenses");
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
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

  // ⚡ Bolt Optimization: Single-pass O(n) calculation for totals and categories
  // instead of O(n * m) where m is the number of categories.
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
    <div className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-lg space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Description de la dépense"
          />
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Montant (€)"
            step="0.01"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={addExpense}
          className="w-full py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-all"
        >
          Ajouter la dépense
        </button>
      </div>

      <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 p-4 rounded-lg text-center">
        <span className="text-sm text-gray-600">Total des dépenses</span>
        <div className="text-3xl font-bold text-red-600">
          {totalExpenses.toFixed(2)} €
        </div>
      </div>

      {expensesByCategory.length > 0 && (
        <div className="bg-gray-100 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-700 mb-3">Par catégorie</h3>
          <div className="space-y-2">
            {expensesByCategory.map((cat) => (
              <div key={cat.category} className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${CATEGORY_COLORS[cat.category] || 'bg-gray-500'}`}
                />
                <span className="flex-1 text-sm">{cat.category}</span>
                <span className="font-semibold">{cat.total.toFixed(2)} €</span>
                <span className="text-sm text-gray-500">
                  ({totalExpenses > 0 ? ((cat.total / totalExpenses) * 100).toFixed(0) : 0}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {expenses.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-700 mb-2">
            Historique ({expenses.length} dépense{expenses.length > 1 ? "s" : ""})
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {expenses.map((expense) => (
              <div
                key={expense.id}
                className="flex items-center gap-2 p-3 bg-white border rounded-lg"
              >
                <div
                  className={`w-2 h-8 rounded ${CATEGORY_COLORS[expense.category] || 'bg-gray-500'}`}
                />
                <div className="flex-1">
                  <div className="font-semibold">{expense.description}</div>
                  <div className="text-xs text-gray-500">
                    {expense.category} • {new Date(expense.date).toLocaleDateString("fr-FR")}
                  </div>
                </div>
                <span className="font-bold text-red-600">
                  -{expense.amount.toFixed(2)} €
                </span>
                <button
                  onClick={() => removeExpense(expense.id)}
                  className="p-1 text-gray-400 hover:text-red-600"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {expenses.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          Aucune dépense enregistrée. Ajoutez votre première dépense ci-dessus.
        </div>
      )}
    </div>
  );
}
