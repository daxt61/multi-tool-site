import { useState } from "react";

export function LoanCalculator() {
  const [principal, setPrincipal] = useState<string>("");
  const [annualRate, setAnnualRate] = useState<string>("");
  const [years, setYears] = useState<string>("");
  const [result, setResult] = useState<{
    monthlyPayment: number;
    totalPayment: number;
    totalInterest: number;
  } | null>(null);

  const calculate = () => {
    const p = parseFloat(principal);
    const r = parseFloat(annualRate) / 100 / 12;
    const n = parseFloat(years) * 12;

    if (!isNaN(p) && !isNaN(r) && !isNaN(n) && r > 0 && n > 0) {
      const monthlyPayment =
        (p * (r * Math.pow(1 + r, n))) / (Math.pow(1 + r, n) - 1);
      const totalPayment = monthlyPayment * n;
      const totalInterest = totalPayment - p;

      setResult({
        monthlyPayment,
        totalPayment,
        totalInterest,
      });
    } else if (!isNaN(p) && r === 0 && !isNaN(n) && n > 0) {
      const monthlyPayment = p / n;
      setResult({
        monthlyPayment,
        totalPayment: p,
        totalInterest: 0,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Montant emprunté (€)
          </label>
          <input
            type="number"
            value={principal}
            onChange={(e) => setPrincipal(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="10000"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Taux annuel (%)
          </label>
          <input
            type="number"
            value={annualRate}
            onChange={(e) => setAnnualRate(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="5"
            step="0.01"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Durée (années)
          </label>
          <input
            type="number"
            value={years}
            onChange={(e) => setYears(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="5"
          />
        </div>
      </div>

      <button
        onClick={calculate}
        className="w-full py-3 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all"
      >
        Calculer
      </button>

      {result && (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 p-6 rounded-lg text-center">
            <span className="text-sm text-gray-600">Mensualité</span>
            <div className="text-4xl font-bold text-blue-600">
              {result.monthlyPayment.toFixed(2)} €
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-100 p-4 rounded-lg text-center">
              <span className="text-sm text-gray-600">Coût total du crédit</span>
              <div className="text-2xl font-bold text-gray-800">
                {result.totalPayment.toFixed(2)} €
              </div>
            </div>
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg text-center">
              <span className="text-sm text-gray-600">Total des intérêts</span>
              <div className="text-2xl font-bold text-red-600">
                {result.totalInterest.toFixed(2)} €
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
