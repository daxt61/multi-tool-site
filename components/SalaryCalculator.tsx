import { useState } from "react";

export function SalaryCalculator() {
  const [grossAnnual, setGrossAnnual] = useState<string>("");
  const [status, setStatus] = useState<"non-cadre" | "cadre">("non-cadre");

  const gross = parseFloat(grossAnnual) || 0;

  const rates = {
    "non-cadre": {
      charges: 0.22,
      label: "Non-cadre (~22%)",
    },
    cadre: {
      charges: 0.25,
      label: "Cadre (~25%)",
    },
  };

  const chargeRate = rates[status].charges;
  const netAnnual = gross * (1 - chargeRate);
  const netMonthly = netAnnual / 12;
  const grossMonthly = gross / 12;
  const chargesAnnual = gross - netAnnual;
  const chargesMonthly = chargesAnnual / 12;

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
          Salaire brut annuel (€)
        </label>
        <input
          type="number"
          value={grossAnnual}
          onChange={(e) => setGrossAnnual(e.target.value)}
          className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="35000"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Statut
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => setStatus("non-cadre")}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
              status === "non-cadre"
                ? "bg-blue-500 text-white shadow-lg"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            Non-cadre (~22%)
          </button>
          <button
            onClick={() => setStatus("cadre")}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
              status === "cadre"
                ? "bg-blue-500 text-white shadow-lg"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            Cadre (~25%)
          </button>
        </div>
      </div>

      {gross > 0 && (
        <>
          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/10 border border-green-200 dark:border-green-800/50 p-6 rounded-lg text-center shadow-sm transition-colors">
            <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Salaire net mensuel</span>
            <div className="text-4xl font-bold text-green-600 dark:text-green-400">
              {netMonthly.toFixed(2)} €
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-100 dark:bg-gray-900/50 border border-transparent dark:border-gray-800 p-4 rounded-lg transition-colors">
              <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-3 border-b dark:border-gray-700 pb-2">Mensuel</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Brut:</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">{grossMonthly.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between text-red-600 dark:text-red-400">
                  <span>Charges:</span>
                  <span className="font-semibold">-{chargesMonthly.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between text-green-600 dark:text-green-400 border-t dark:border-gray-700 pt-2 font-bold">
                  <span>Net:</span>
                  <span>{netMonthly.toFixed(2)} €</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/50 p-4 rounded-lg transition-colors">
              <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-3 border-b border-blue-100 dark:border-blue-800/50 pb-2">Annuel</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Brut:</span>
                  <span className="font-semibold">{gross.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>Charges:</span>
                  <span className="font-semibold">-{chargesAnnual.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between text-green-600 border-t pt-2">
                  <span>Net:</span>
                  <span className="font-bold">{netAnnual.toFixed(2)} €</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/50 p-4 rounded-lg text-sm text-gray-700 dark:text-gray-300">
            <p className="font-semibold mb-1 text-gray-800 dark:text-gray-200">Note:</p>
            <p className="italic">
              Ce calcul est une estimation basée sur les taux moyens de cotisations
              sociales. Le montant réel peut varier selon votre situation (mutuelle,
              prévoyance, CSG/CRDS, etc.).
            </p>
          </div>
        </>
      )}
    </div>
  );
}
