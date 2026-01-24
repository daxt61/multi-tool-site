import { useState } from "react";

export function MarginCalculator() {
  const [costPrice, setCostPrice] = useState<string>("");
  const [sellingPrice, setSellingPrice] = useState<string>("");
  const [marginPercent, setMarginPercent] = useState<string>("");
  const [markupPercent, setMarkupPercent] = useState<string>("");

  const calculateFromCostAndSelling = () => {
    const cost = parseFloat(costPrice);
    const selling = parseFloat(sellingPrice);
    if (!isNaN(cost) && !isNaN(selling) && selling > 0) {
      const margin = ((selling - cost) / selling) * 100;
      const markup = ((selling - cost) / cost) * 100;
      setMarginPercent(margin.toFixed(2));
      setMarkupPercent(markup.toFixed(2));
    }
  };

  const calculateFromCostAndMargin = () => {
    const cost = parseFloat(costPrice);
    const margin = parseFloat(marginPercent);
    if (!isNaN(cost) && !isNaN(margin) && margin < 100) {
      const selling = cost / (1 - margin / 100);
      const markup = ((selling - cost) / cost) * 100;
      setSellingPrice(selling.toFixed(2));
      setMarkupPercent(markup.toFixed(2));
    }
  };

  const calculateFromCostAndMarkup = () => {
    const cost = parseFloat(costPrice);
    const markup = parseFloat(markupPercent);
    if (!isNaN(cost) && !isNaN(markup)) {
      const selling = cost * (1 + markup / 100);
      const margin = ((selling - cost) / selling) * 100;
      setSellingPrice(selling.toFixed(2));
      setMarginPercent(margin.toFixed(2));
    }
  };

  const profit =
    parseFloat(sellingPrice) - parseFloat(costPrice) || 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Prix d'achat (coût)
          </label>
          <input
            type="number"
            value={costPrice}
            onChange={(e) => setCostPrice(e.target.value)}
            className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0.00"
            step="0.01"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Prix de vente
          </label>
          <input
            type="number"
            value={sellingPrice}
            onChange={(e) => setSellingPrice(e.target.value)}
            className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0.00"
            step="0.01"
          />
        </div>
      </div>

      <button
        onClick={calculateFromCostAndSelling}
        className="w-full py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-all"
      >
        Calculer marge et coefficient
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Marge (%)
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              value={marginPercent}
              onChange={(e) => setMarginPercent(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
              step="0.01"
            />
            <button
              onClick={calculateFromCostAndMargin}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              title="Calculer à partir du coût et de la marge"
            >
              Calc
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Coefficient (markup %)
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              value={markupPercent}
              onChange={(e) => setMarkupPercent(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
              step="0.01"
            />
            <button
              onClick={calculateFromCostAndMarkup}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              title="Calculer à partir du coût et du coefficient"
            >
              Calc
            </button>
          </div>
        </div>
      </div>

      {profit !== 0 && !isNaN(profit) && (
        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-800/50 p-4 rounded-lg">
          <div className="text-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Bénéfice par unité</span>
            <div
              className={`text-3xl font-bold ${profit >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
            >
              {profit.toFixed(2)} €
            </div>
          </div>
        </div>
      )}

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 p-4 rounded-lg text-sm text-gray-700 dark:text-gray-300">
        <p className="font-semibold mb-2 text-gray-800 dark:text-gray-200">Formules:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>
            <strong>Marge</strong> = (Prix de vente - Coût) / Prix de vente × 100
          </li>
          <li>
            <strong>Markup</strong> = (Prix de vente - Coût) / Coût × 100
          </li>
        </ul>
      </div>
    </div>
  );
}
