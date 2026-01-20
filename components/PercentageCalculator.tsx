import { useState } from 'react';

export function PercentageCalculator() {
  const [value1, setValue1] = useState('100');
  const [value2, setValue2] = useState('20');
  const [value3, setValue3] = useState('150');
  const [value4, setValue4] = useState('100');

  const percentageOf = (Number(value2) / 100) * Number(value1);
  const whatPercent = (Number(value3) / Number(value4)) * 100;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* What is X% of Y? */}
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-lg">
        <h3 className="text-xl font-semibold mb-4">Combien font X% de Y ?</h3>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-lg">Combien font</span>
          <input
            type="number"
            value={value2}
            onChange={(e) => setValue2(e.target.value)}
            className="w-24 p-2 rounded bg-white text-gray-900 text-center"
          />
          <span className="text-lg">% de</span>
          <input
            type="number"
            value={value1}
            onChange={(e) => setValue1(e.target.value)}
            className="w-24 p-2 rounded bg-white text-gray-900 text-center"
          />
          <span className="text-lg">?</span>
        </div>
        <div className="text-3xl font-bold bg-white text-blue-600 p-4 rounded-lg text-center">
          = {isNaN(percentageOf) ? '0' : percentageOf.toFixed(2)}
        </div>
      </div>

      {/* X is what % of Y? */}
      <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-lg">
        <h3 className="text-xl font-semibold mb-4">X représente quel % de Y ?</h3>
        <div className="flex items-center gap-3 mb-4">
          <input
            type="number"
            value={value3}
            onChange={(e) => setValue3(e.target.value)}
            className="w-24 p-2 rounded bg-white text-gray-900 text-center"
          />
          <span className="text-lg">représente quel % de</span>
          <input
            type="number"
            value={value4}
            onChange={(e) => setValue4(e.target.value)}
            className="w-24 p-2 rounded bg-white text-gray-900 text-center"
          />
          <span className="text-lg">?</span>
        </div>
        <div className="text-3xl font-bold bg-white text-purple-600 p-4 rounded-lg text-center">
          = {isNaN(whatPercent) ? '0' : whatPercent.toFixed(2)}%
        </div>
      </div>

      {/* Percentage increase/decrease */}
      <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-lg">
        <h3 className="text-xl font-semibold mb-4">Augmentation / Diminution</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-2">Valeur initiale</label>
            <input
              type="number"
              value={value1}
              onChange={(e) => setValue1(e.target.value)}
              className="w-full p-2 rounded bg-white text-gray-900 text-center"
            />
          </div>
          <div>
            <label className="block text-sm mb-2">Pourcentage de changement</label>
            <input
              type="number"
              value={value2}
              onChange={(e) => setValue2(e.target.value)}
              className="w-full p-2 rounded bg-white text-gray-900 text-center"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="bg-white text-green-600 p-4 rounded-lg">
            <div className="text-sm opacity-75 mb-1">Augmentation</div>
            <div className="text-2xl font-bold">
              {(Number(value1) * (1 + Number(value2) / 100)).toFixed(2)}
            </div>
          </div>
          <div className="bg-white text-red-600 p-4 rounded-lg">
            <div className="text-sm opacity-75 mb-1">Diminution</div>
            <div className="text-2xl font-bold">
              {(Number(value1) * (1 - Number(value2) / 100)).toFixed(2)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
