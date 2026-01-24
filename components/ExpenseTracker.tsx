import { useState, useEffect } from "react";

interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
}

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

  const categories = [
    "Alimentation",
    "Transport",
    "Logement",
    "Loisirs",
    "Santé",
    "Shopping",
    "Factures",
    "Autre",
  ];

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

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  const expensesByCategory = categories.map((cat) => ({
    category: cat,
    total: expenses
      .filter((e) => e.category === cat)
      .reduce((sum, e) => sum + e.amount, 0),
  })).filter((c) => c.total > 0);

  const categoryColors: Record<string, string> = {
    Alimentation: "bg-green-500",
    Transport: "bg-blue-500",
    Logement: "bg-purple-500",
    Loisirs: "bg-pink-500",
    Santé: "bg-red-500",
    Shopping: "bg-yellow-500",
    Factures: "bg-indigo-500",
    Autre: "bg-gray-500",
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg space-y-3 border border-gray-100 dark:border-gray-800">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="p-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            placeholder="Description de la dépense"
          />
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="p-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            placeholder="Montant (€)"
            step="0.01"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="p-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="p-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          />
        </div>
        <button
          onClick={addExpense}
          className="w-full py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-all"
        >
          Ajouter la dépense
        </button>
      </div>

      <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/10 border border-red-200 dark:border-red-900/50 p-4 rounded-lg text-center">
        <span className="text-sm text-gray-600 dark:text-gray-400">Total des dépenses</span>
        <div className="text-3xl font-bold text-red-600 dark:text-red-400">
          {totalExpenses.toFixed(2)} €
        </div>
      </div>

      {expensesByCategory.length > 0 && (
        <div className="bg-gray-100 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-800">
          <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-3">Par catégorie</h3>
          <div className="space-y-2">
            {expensesByCategory.map((cat) => (
              <div key={cat.category} className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${categoryColors[cat.category]}`}
                />
                <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">{cat.category}</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">{cat.total.toFixed(2)} €</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  ({((cat.total / totalExpenses) * 100).toFixed(0)}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {expenses.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-2 px-1">
            Historique ({expenses.length})
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto no-scrollbar">
            {expenses.map((expense) => (
              <div
                key={expense.id}
                className="flex items-center gap-2 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm"
              >
                <div
                  className={`w-2 h-8 rounded ${categoryColors[expense.category]}`}
                />
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 dark:text-gray-100">{expense.description}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {expense.category} • {new Date(expense.date).toLocaleDateString("fr-FR")}
                  </div>
                </div>
                <span className="font-bold text-red-600 dark:text-red-400">
                  -{expense.amount.toFixed(2)} €
                </span>
                <button
                  onClick={() => removeExpense(expense.id)}
                  className="p-1 text-gray-400 hover:text-red-600 transition-colors"
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
