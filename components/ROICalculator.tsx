import { useState } from "react";

export function ROICalculator() {
  const [initialInvestment, setInitialInvestment] = useState<string>("");
  const [finalValue, setFinalValue] = useState<string>("");
  const [duration, setDuration] = useState<string>("");

  const initial = parseFloat(initialInvestment) || 0;
  const final = parseFloat(finalValue) || 0;
  const years = parseFloat(duration) || 1;

  const gain = final - initial;
  const roi = initial > 0 ? ((final - initial) / initial) * 100 : 0;
  const annualizedROI = initial > 0 && years > 0
    ? (Math.pow(final / initial, 1 / years) - 1) * 100
    : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Investissement initial (€)
          </label>
          <input
            type="number"
            value={initialInvestment}
            onChange={(e) => setInitialInvestment(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="10000"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Valeur finale (€)
          </label>
          <input
            type="number"
            value={finalValue}
            onChange={(e) => setFinalValue(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="15000"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Durée (années)
          </label>
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="5"
            step="0.5"
          />
        </div>
      </div>

      {initial > 0 && final > 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div
              className={`p-6 rounded-lg text-center ${
                gain >= 0
                  ? "bg-gradient-to-br from-green-50 to-green-100 border border-green-200"
                  : "bg-gradient-to-br from-red-50 to-red-100 border border-red-200"
              }`}
            >
              <span className="text-sm text-gray-600">Gain / Perte</span>
              <div
                className={`text-3xl font-bold ${
                  gain >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {gain >= 0 ? "+" : ""}
                {gain.toFixed(2)} €
              </div>
            </div>

            <div
              className={`p-6 rounded-lg text-center ${
                roi >= 0
                  ? "bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200"
                  : "bg-gradient-to-br from-red-50 to-red-100 border border-red-200"
              }`}
            >
              <span className="text-sm text-gray-600">ROI Total</span>
              <div
                className={`text-3xl font-bold ${
                  roi >= 0 ? "text-blue-600" : "text-red-600"
                }`}
              >
                {roi >= 0 ? "+" : ""}
                {roi.toFixed(2)}%
              </div>
            </div>
          </div>

          {years > 0 && (
            <div
              className={`p-6 rounded-lg text-center ${
                annualizedROI >= 0
                  ? "bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200"
                  : "bg-gradient-to-br from-red-50 to-red-100 border border-red-200"
              }`}
            >
              <span className="text-sm text-gray-600">
                ROI Annualisé (sur {years} an{years > 1 ? "s" : ""})
              </span>
              <div
                className={`text-3xl font-bold ${
                  annualizedROI >= 0 ? "text-purple-600" : "text-red-600"
                }`}
              >
                {annualizedROI >= 0 ? "+" : ""}
                {annualizedROI.toFixed(2)}% / an
              </div>
            </div>
          )}

          <div className="bg-gray-100 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-700 mb-2">Récapitulatif</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Investissement initial:</span>
                <span className="font-semibold">{initial.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between">
                <span>Valeur finale:</span>
                <span className="font-semibold">{final.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between">
                <span>Multiplicateur:</span>
                <span className="font-semibold">×{(final / initial).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-sm text-gray-700">
        <p className="font-semibold mb-1">Formules:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>
            <strong>ROI</strong> = (Valeur finale - Investissement) / Investissement × 100
          </li>
          <li>
            <strong>ROI Annualisé</strong> = ((Valeur finale / Investissement)^(1/années) - 1) × 100
          </li>
        </ul>
      </div>
    </div>
  );
}
