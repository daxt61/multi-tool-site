import { useState, useEffect } from "react";

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
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
          Revenu mensuel net (€)
        </label>
        <input
          type="number"
          value={income}
          onChange={(e) => setIncome(e.target.value)}
          className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="2500"
        />
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
            Catégories de dépenses
          </label>
          <button
            onClick={addCategory}
            className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
          >
            + Ajouter
          </button>
        </div>

        <div className="space-y-2">
          <div className="hidden sm:grid grid-cols-4 gap-2 text-sm font-semibold text-gray-600 dark:text-gray-400 px-2">
            <span>Catégorie</span>
            <span>Prévu (€)</span>
            <span>Réel (€)</span>
            <span>Écart</span>
          </div>
          {categories.map((cat, index) => {
            const diff = cat.planned - cat.actual;
            return (
              <div
                key={index}
                className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-gray-50 dark:bg-gray-900/50 dark:border dark:border-gray-800 rounded-lg items-center"
              >
                <input
                  type="text"
                  value={cat.name}
                  onChange={(e) => updateCategory(index, "name", e.target.value)}
                  className="p-2 border border-gray-300 dark:border-gray-700 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 col-span-2 sm:col-span-1"
                />
                <input
                  type="number"
                  value={cat.planned || ""}
                  onChange={(e) =>
                    updateCategory(index, "planned", Number(e.target.value))
                  }
                  className="p-2 border border-gray-300 dark:border-gray-700 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  placeholder="Prévu"
                />
                <input
                  type="number"
                  value={cat.actual || ""}
                  onChange={(e) =>
                    updateCategory(index, "actual", Number(e.target.value))
                  }
                  className="p-2 border border-gray-300 dark:border-gray-700 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  placeholder="Réel"
                />
                <div className="flex items-center justify-between sm:justify-start gap-2 col-span-2 sm:col-span-1">
                  <span
                    className={`text-sm font-semibold ${diff >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                  >
                    {diff >= 0 ? "+" : ""}
                    {diff.toFixed(0)}€
                  </span>
                  <button
                    onClick={() => removeCategory(index)}
                    className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
                  >
                    ×
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-2">Budget prévu</h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>Total dépenses:</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">{totalPlanned.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>Reste à budgéter:</span>
              <span
                className={`font-semibold ${remainingPlanned >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
              >
                {remainingPlanned.toFixed(2)} €
              </span>
            </div>
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-2">Budget réel</h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>Total dépenses:</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">{totalActual.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>Solde restant:</span>
              <span
                className={`font-semibold ${remainingActual >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
              >
                {remainingActual.toFixed(2)} €
              </span>
            </div>
          </div>
        </div>
      </div>

      {incomeValue > 0 && (
        <div className="bg-gray-100 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-800">
          <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-2">Répartition du budget</h3>
          <div className="space-y-2">
            {categories.map((cat, index) => {
              const percent = (cat.planned / incomeValue) * 100;
              return (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-sm w-24 truncate text-gray-600 dark:text-gray-400">{cat.name}</span>
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full transition-all"
                      style={{ width: `${Math.min(percent, 100)}%` }}
                    />
                  </div>
                  <span className="text-sm w-12 text-right text-gray-600 dark:text-gray-400">{percent.toFixed(0)}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
