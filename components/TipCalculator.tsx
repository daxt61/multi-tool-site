import { useState } from "react";

export function TipCalculator() {
  const [billAmount, setBillAmount] = useState<string>("");
  const [tipPercent, setTipPercent] = useState<number>(15);
  const [numberOfPeople, setNumberOfPeople] = useState<string>("1");

  const bill = parseFloat(billAmount) || 0;
  const people = parseInt(numberOfPeople) || 1;
  const tipAmount = bill * (tipPercent / 100);
  const totalAmount = bill + tipAmount;
  const perPerson = totalAmount / people;
  const tipPerPerson = tipAmount / people;

  const tipButtons = [10, 15, 18, 20, 25];

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
          Montant de l'addition (€)
        </label>
        <input
          type="number"
          value={billAmount}
          onChange={(e) => setBillAmount(e.target.value)}
          className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="50.00"
          step="0.01"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Pourboire: {tipPercent}%
        </label>
        <div className="flex flex-wrap gap-2 mb-3">
          {tipButtons.map((percent) => (
            <button
              key={percent}
              onClick={() => setTipPercent(percent)}
              className={`flex-1 py-2 px-3 rounded-lg font-semibold transition-all ${
                tipPercent === percent
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              {percent}%
            </button>
          ))}
        </div>
        <input
          type="range"
          min="0"
          max="50"
          value={tipPercent}
          onChange={(e) => setTipPercent(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
          Nombre de personnes
        </label>
        <div className="flex items-center gap-3">
          <button
            onClick={() =>
              setNumberOfPeople(String(Math.max(1, people - 1)))
            }
            className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg text-xl font-bold hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200"
          >
            -
          </button>
          <input
            type="number"
            value={numberOfPeople}
            onChange={(e) => setNumberOfPeople(e.target.value)}
            className="flex-1 p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
            min="1"
          />
          <button
            onClick={() => setNumberOfPeople(String(people + 1))}
            className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg text-xl font-bold hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200"
          >
            +
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-gray-100 dark:bg-gray-900/50 p-4 rounded-lg text-center border border-transparent dark:border-gray-800">
            <span className="text-sm text-gray-600 dark:text-gray-400">Pourboire</span>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {tipAmount.toFixed(2)} €
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-800/50 p-4 rounded-lg text-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Total</span>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {totalAmount.toFixed(2)} €
            </div>
          </div>
        </div>

        {people > 1 && (
          <div className="bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-purple-900/20 dark:to-indigo-800/20 border border-purple-200 dark:border-purple-800/50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2 text-center">
              Par personne ({people} personnes)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-center">
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Part pourboire</span>
                <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
                  {tipPerPerson.toFixed(2)} €
                </div>
              </div>
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Total par personne</span>
                <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                  {perPerson.toFixed(2)} €
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
