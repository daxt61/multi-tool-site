import { useState } from 'react';

export function BMICalculator() {
  const [weight, setWeight] = useState('70');
  const [height, setHeight] = useState('170');
  const [unit, setUnit] = useState<'metric' | 'imperial'>('metric');

  const calculateBMI = () => {
    let weightKg = parseFloat(weight);
    let heightM = parseFloat(height);

    if (isNaN(weightKg) || isNaN(heightM) || heightM === 0) return 0;

    if (unit === 'imperial') {
      // Convert pounds to kg and inches to meters
      weightKg = weightKg * 0.453592;
      heightM = heightM * 0.0254;
    } else {
      // Convert cm to meters
      heightM = heightM / 100;
    }

    return weightKg / (heightM * heightM);
  };

  const bmi = calculateBMI();

  const getCategory = () => {
    if (bmi < 18.5) return { label: 'Insuffisance pondérale', color: 'bg-blue-500' };
    if (bmi < 25) return { label: 'Poids normal', color: 'bg-green-500' };
    if (bmi < 30) return { label: 'Surpoids', color: 'bg-yellow-500' };
    return { label: 'Obésité', color: 'bg-red-500' };
  };

  const category = getCategory();

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-gray-50 p-6 rounded-lg mb-6">
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setUnit('metric')}
            className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
              unit === 'metric'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            Métrique (kg/cm)
          </button>
          <button
            onClick={() => setUnit('imperial')}
            className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
              unit === 'imperial'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            Impérial (lb/in)
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Poids ({unit === 'metric' ? 'kg' : 'lb'})
            </label>
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg text-lg"
              placeholder="70"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Taille ({unit === 'metric' ? 'cm' : 'in'})
            </label>
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg text-lg"
              placeholder="170"
            />
          </div>
        </div>
      </div>

      <div className={`${category.color} text-white p-8 rounded-lg text-center mb-6`}>
        <div className="text-sm opacity-90 mb-2">Votre IMC</div>
        <div className="text-6xl font-bold mb-2">
          {bmi > 0 ? bmi.toFixed(1) : '0'}
        </div>
        <div className="text-xl font-semibold">
          {category.label}
        </div>
      </div>

      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="font-semibold text-lg mb-4">Classification de l'IMC</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span className="text-sm">Insuffisance pondérale : &lt; 18.5</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-sm">Poids normal : 18.5 - 24.9</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
            <span className="text-sm">Surpoids : 25 - 29.9</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-sm">Obésité : ≥ 30</span>
          </div>
        </div>
        <p className="text-xs text-gray-600 mt-4">
          ℹ️ L'IMC est un indicateur général et ne tient pas compte de la composition corporelle, de l'âge ou du sexe.
        </p>
      </div>
    </div>
  );
}
