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
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Montant de l'addition (€)
        </label>
        <input
          type="number"
          value={billAmount}
          onChange={(e) => setBillAmount(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="50.00"
          step="0.01"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Pourboire: {tipPercent}%
        </label>
        <div className="flex gap-2 mb-3">
          {tipButtons.map((percent) => (
            <button
              key={percent}
              onClick={() => setTipPercent(percent)}
              className={`flex-1 py-2 px-3 rounded-lg font-semibold transition-all ${
                tipPercent === percent
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
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
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Nombre de personnes
        </label>
        <div className="flex items-center gap-3">
          <button
            onClick={() =>
              setNumberOfPeople(String(Math.max(1, people - 1)))
            }
            className="w-12 h-12 bg-gray-200 rounded-lg text-xl font-bold hover:bg-gray-300"
          >
            -
          </button>
          <input
            type="number"
            value={numberOfPeople}
            onChange={(e) => setNumberOfPeople(e.target.value)}
            className="flex-1 p-3 border border-gray-300 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
            min="1"
          />
          <button
            onClick={() => setNumberOfPeople(String(people + 1))}
            className="w-12 h-12 bg-gray-200 rounded-lg text-xl font-bold hover:bg-gray-300"
          >
            +
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-100 p-4 rounded-lg text-center">
            <span className="text-sm text-gray-600">Pourboire</span>
            <div className="text-2xl font-bold text-blue-600">
              {tipAmount.toFixed(2)} €
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 p-4 rounded-lg text-center">
            <span className="text-sm text-gray-600">Total</span>
            <div className="text-2xl font-bold text-green-600">
              {totalAmount.toFixed(2)} €
            </div>
          </div>
        </div>

        {people > 1 && (
          <div className="bg-gradient-to-br from-purple-50 to-indigo-100 border border-purple-200 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-700 mb-2 text-center">
              Par personne ({people} personnes)
            </h3>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <span className="text-sm text-gray-600">Part pourboire</span>
                <div className="text-xl font-bold text-purple-600">
                  {tipPerPerson.toFixed(2)} €
                </div>
              </div>
              <div>
                <span className="text-sm text-gray-600">Total par personne</span>
                <div className="text-xl font-bold text-indigo-600">
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
