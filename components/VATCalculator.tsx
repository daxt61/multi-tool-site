import { useState } from "react";

export function VATCalculator() {
  const [amount, setAmount] = useState<string>("");
  const [vatRate, setVatRate] = useState<string>("20");
  const [mode, setMode] = useState<"ht-to-ttc" | "ttc-to-ht">("ht-to-ttc");

  const amountValue = parseFloat(amount) || 0;
  const rateValue = parseFloat(vatRate) || 0;

  let ht: number, tva: number, ttc: number;

  if (mode === "ht-to-ttc") {
    ht = amountValue;
    tva = ht * (rateValue / 100);
    ttc = ht + tva;
  } else {
    ttc = amountValue;
    ht = ttc / (1 + rateValue / 100);
    tva = ttc - ht;
  }

  const commonRates = [
    { label: "20% (normal)", value: "20" },
    { label: "10% (intermédiaire)", value: "10" },
    { label: "5.5% (réduit)", value: "5.5" },
    { label: "2.1% (super réduit)", value: "2.1" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <button
          onClick={() => setMode("ht-to-ttc")}
          className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
            mode === "ht-to-ttc"
              ? "bg-white dark:bg-gray-700 shadow text-blue-600 dark:text-blue-400"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
          }`}
        >
          HT → TTC
        </button>
        <button
          onClick={() => setMode("ttc-to-ht")}
          className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
            mode === "ttc-to-ht"
              ? "bg-white dark:bg-gray-700 shadow text-blue-600 dark:text-blue-400"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
          }`}
        >
          TTC → HT
        </button>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
          Montant {mode === "ht-to-ttc" ? "HT" : "TTC"} (€)
        </label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="0.00"
          step="0.01"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Taux de TVA
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
          {commonRates.map((rate) => (
            <button
              key={rate.value}
              onClick={() => setVatRate(rate.value)}
              className={`py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
                vatRate === rate.value
                  ? "bg-blue-500 text-white shadow-md"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              {rate.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={vatRate}
            onChange={(e) => setVatRate(e.target.value)}
            className="flex-1 p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="20"
            step="0.1"
          />
          <span className="text-gray-600 dark:text-gray-400 font-semibold">%</span>
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800/50 p-6 rounded-lg">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Montant HT</span>
            <div className="text-xl font-bold text-gray-800 dark:text-gray-100">
              {ht.toFixed(2)} €
            </div>
          </div>
          <div>
            <span className="text-sm text-gray-600 dark:text-gray-400">TVA ({vatRate}%)</span>
            <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
              {tva.toFixed(2)} €
            </div>
          </div>
          <div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Montant TTC</span>
            <div className="text-xl font-bold text-green-600 dark:text-green-400">
              {ttc.toFixed(2)} €
            </div>
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/50 p-4 rounded-lg text-sm text-gray-700 dark:text-gray-300">
        <p className="font-semibold mb-1">Taux de TVA en France (2024):</p>
        <ul className="list-disc list-inside space-y-1">
          <li><strong>20%</strong> - Taux normal (la plupart des biens/services)</li>
          <li><strong>10%</strong> - Restauration, transport, travaux</li>
          <li><strong>5.5%</strong> - Alimentation, livres, énergie</li>
          <li><strong>2.1%</strong> - Médicaments, presse</li>
        </ul>
      </div>
    </div>
  );
}
