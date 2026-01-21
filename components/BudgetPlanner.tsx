import { useState } from "react";

interface BudgetCategory {
  name: string;
  planned: number;
  actual: number;
}

export function BudgetPlanner() {
  const [income, setIncome] = useState<string>("");
  const [categories, setCategories] = useState<BudgetCategory[]>([
    { name: "Logement", planned: 0, actual: 0 },
    { name: "Alimentation", planned: 0, actual: 0 },
    { name: "Transport", planned: 0, actual: 0 },
    { name: "Santé", planned: 0, actual: 0 },
    { name: "Loisirs", planned: 0, actual: 0 },
    { name: "Épargne", planned: 0, actual: 0 },
  ]);

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
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Revenu mensuel net (€)
        </label>
        <input
          type="number"
          value={income}
          onChange={(e) => setIncome(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="2500"
        />
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-semibold text-gray-700">
            Catégories de dépenses
          </label>
          <button
            onClick={addCategory}
            className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
          >
            + Ajouter
          </button>
        </div>

        <div className="space-y-2">
          <div className="grid grid-cols-4 gap-2 text-sm font-semibold text-gray-600 px-2">
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
                className="grid grid-cols-4 gap-2 p-2 bg-gray-50 rounded-lg items-center"
              >
                <input
                  type="text"
                  value={cat.name}
                  onChange={(e) => updateCategory(index, "name", e.target.value)}
                  className="p-2 border border-gray-300 rounded text-sm"
                />
                <input
                  type="number"
                  value={cat.planned || ""}
                  onChange={(e) =>
                    updateCategory(index, "planned", Number(e.target.value))
                  }
                  className="p-2 border border-gray-300 rounded text-sm"
                  placeholder="0"
                />
                <input
                  type="number"
                  value={cat.actual || ""}
                  onChange={(e) =>
                    updateCategory(index, "actual", Number(e.target.value))
                  }
                  className="p-2 border border-gray-300 rounded text-sm"
                  placeholder="0"
                />
                <div className="flex items-center gap-1">
                  <span
                    className={`text-sm font-semibold ${diff >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {diff >= 0 ? "+" : ""}
                    {diff.toFixed(0)}€
                  </span>
                  <button
                    onClick={() => removeCategory(index)}
                    className="ml-auto px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
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
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-700 mb-2">Budget prévu</h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Total dépenses:</span>
              <span className="font-semibold">{totalPlanned.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between">
              <span>Reste à budgéter:</span>
              <span
                className={`font-semibold ${remainingPlanned >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                {remainingPlanned.toFixed(2)} €
              </span>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-700 mb-2">Budget réel</h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Total dépenses:</span>
              <span className="font-semibold">{totalActual.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between">
              <span>Solde restant:</span>
              <span
                className={`font-semibold ${remainingActual >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                {remainingActual.toFixed(2)} €
              </span>
            </div>
          </div>
        </div>
      </div>

      {incomeValue > 0 && (
        <div className="bg-gray-100 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-700 mb-2">Répartition du budget</h3>
          <div className="space-y-2">
            {categories.map((cat, index) => {
              const percent = (cat.planned / incomeValue) * 100;
              return (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-sm w-24 truncate">{cat.name}</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full transition-all"
                      style={{ width: `${Math.min(percent, 100)}%` }}
                    />
                  </div>
                  <span className="text-sm w-12 text-right">{percent.toFixed(0)}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
