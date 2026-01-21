import { useState } from "react";

export function SavingsCalculator() {
  const [initialAmount, setInitialAmount] = useState<string>("");
  const [monthlyDeposit, setMonthlyDeposit] = useState<string>("");
  const [annualRate, setAnnualRate] = useState<string>("");
  const [years, setYears] = useState<string>("");
  const [result, setResult] = useState<{
    finalAmount: number;
    totalDeposited: number;
    totalInterest: number;
  } | null>(null);

  const calculate = () => {
    const p = parseFloat(initialAmount) || 0;
    const pmt = parseFloat(monthlyDeposit) || 0;
    const r = (parseFloat(annualRate) || 0) / 100 / 12;
    const n = (parseFloat(years) || 0) * 12;

    if (n > 0) {
      let finalAmount: number;

      if (r > 0) {
        const compoundedPrincipal = p * Math.pow(1 + r, n);
        const futureValueOfDeposits = pmt * ((Math.pow(1 + r, n) - 1) / r);
        finalAmount = compoundedPrincipal + futureValueOfDeposits;
      } else {
        finalAmount = p + pmt * n;
      }

      const totalDeposited = p + pmt * n;
      const totalInterest = finalAmount - totalDeposited;

      setResult({
        finalAmount,
        totalDeposited,
        totalInterest,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Capital initial (€)
          </label>
          <input
            type="number"
            value={initialAmount}
            onChange={(e) => setInitialAmount(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="1000"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Versement mensuel (€)
          </label>
          <input
            type="number"
            value={monthlyDeposit}
            onChange={(e) => setMonthlyDeposit(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="100"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Taux d'intérêt annuel (%)
          </label>
          <input
            type="number"
            value={annualRate}
            onChange={(e) => setAnnualRate(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="3"
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
            placeholder="10"
          />
        </div>
      </div>

      <button
        onClick={calculate}
        className="w-full py-3 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all"
      >
        Calculer mon épargne
      </button>

      {result && (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 p-6 rounded-lg text-center">
            <span className="text-sm text-gray-600">Capital final</span>
            <div className="text-4xl font-bold text-green-600">
              {result.finalAmount.toFixed(2)} €
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-100 p-4 rounded-lg text-center">
              <span className="text-sm text-gray-600">Total versé</span>
              <div className="text-2xl font-bold text-gray-800">
                {result.totalDeposited.toFixed(2)} €
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-center">
              <span className="text-sm text-gray-600">Intérêts gagnés</span>
              <div className="text-2xl font-bold text-blue-600">
                +{result.totalInterest.toFixed(2)} €
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
