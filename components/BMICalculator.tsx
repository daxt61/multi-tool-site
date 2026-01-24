import { useState } from 'react';

export function BMICalculator() {
  const [weight, setWeight] = useState('70');
  const [height, setHeight] = useState('170');
  const [unit, setUnit] = useState<'metric' | 'imperial'>('metric');

  const calculateBMI = () => {
    let weightKg = parseFloat(weight);
    let heightM = parseFloat(height);

    if (isNaN(weightKg) || isNaN(heightM) || heightM <= 0) return 0;

    if (unit === 'imperial') {
      weightKg = weightKg * 0.453592;
      heightM = heightM * 0.0254;
    } else {
      heightM = heightM / 100;
    }

    return weightKg / (heightM * heightM);
  };

  const bmi = calculateBMI();

  const getCategory = () => {
    if (bmi < 18.5) return { label: 'Insuffisance pondérale', color: 'bg-blue-500', text: 'text-blue-500' };
    if (bmi < 25) return { label: 'Poids normal', color: 'bg-green-500', text: 'text-green-500' };
    if (bmi < 30) return { label: 'Surpoids', color: 'bg-yellow-500', text: 'text-yellow-500' };
    return { label: 'Obésité', color: 'bg-red-500', text: 'text-red-500' };
  };

  const category = getCategory();

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-gray-50 dark:bg-gray-900 p-8 rounded-3xl mb-8 border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="flex gap-2 mb-8 bg-gray-100 dark:bg-gray-800 p-1.5 rounded-2xl">
          <button
            onClick={() => setUnit('metric')}
            className={`flex-1 py-3 rounded-xl font-bold transition-all ${
              unit === 'metric'
                ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Métrique (kg/cm)
          </button>
          <button
            onClick={() => setUnit('imperial')}
            className={`flex-1 py-3 rounded-xl font-bold transition-all ${
              unit === 'imperial'
                ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Impérial (lb/in)
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label className="block text-sm font-bold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">
              Poids ({unit === 'metric' ? 'kg' : 'lb'})
            </label>
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full p-4 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-2xl text-2xl font-mono focus:border-indigo-500 outline-none transition-all dark:text-white shadow-sm"
              placeholder="70"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">
              Taille ({unit === 'metric' ? 'cm' : 'in'})
            </label>
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              className="w-full p-4 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-2xl text-2xl font-mono focus:border-indigo-500 outline-none transition-all dark:text-white shadow-sm"
              placeholder="170"
            />
          </div>
        </div>
      </div>

      <div className={`p-10 rounded-[2.5rem] text-center mb-10 transition-colors duration-500 shadow-xl ${category.color} text-white`}>
        <div className="text-white/80 font-bold uppercase tracking-widest text-sm mb-4">Votre IMC</div>
        <div className="text-7xl font-black mb-4">
          {bmi > 0 ? bmi.toFixed(1) : '0'}
        </div>
        <div className="text-2xl font-extrabold px-6 py-2 bg-white/20 backdrop-blur-md rounded-full inline-block">
          {category.label}
        </div>
        <div className="text-sm opacity-80">
          Range: {category.range}
        </div>

      <div className="bg-white dark:bg-gray-800 p-8 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm">
        <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          Classification de l'IMC
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={`flex items-center justify-between p-4 rounded-2xl border ${bmi > 0 && bmi < 18.5 ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-500/10' : 'border-gray-100 dark:border-gray-700'}`}>
            <span className="font-bold dark:text-gray-300">Insuffisance</span>
            <span className="font-mono text-blue-500">&lt; 18.5</span>
          </div>
          <div className={`flex items-center justify-between p-4 rounded-2xl border ${bmi >= 18.5 && bmi < 25 ? 'border-green-500 bg-green-50/50 dark:bg-green-500/10' : 'border-gray-100 dark:border-gray-700'}`}>
            <span className="font-bold dark:text-gray-300">Poids normal</span>
            <span className="font-mono text-green-500">18.5 - 24.9</span>
          </div>
          <div className={`flex items-center justify-between p-4 rounded-2xl border ${bmi >= 25 && bmi < 30 ? 'border-yellow-500 bg-yellow-50/50 dark:bg-yellow-500/10' : 'border-gray-100 dark:border-gray-700'}`}>
            <span className="font-bold dark:text-gray-300">Surpoids</span>
            <span className="font-mono text-yellow-500">25 - 29.9</span>
          </div>
          <div className={`flex items-center justify-between p-4 rounded-2xl border ${bmi >= 30 ? 'border-red-500 bg-red-50/50 dark:bg-red-500/10' : 'border-gray-100 dark:border-gray-700'}`}>
            <span className="font-bold dark:text-gray-300">Obésité</span>
            <span className="font-mono text-red-500">≥ 30</span>
          </div>
        </div>
        <div className="mt-8 p-4 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-start gap-3">
           <span className="text-indigo-600 dark:text-indigo-400 text-sm leading-relaxed font-medium">
             ℹ️ L'indice de masse corporelle (IMC) est une mesure simple du poids par rapport à la taille. Il s'applique aux hommes et aux femmes adultes de 18 à 65 ans.
           </span>
        </div>
      </div>

      {/* SEO Content Section */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-gray-200 pt-12 text-left">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Qu'est-ce que l'Indice de Masse Corporelle (IMC) ?</h2>
          <p className="text-gray-600 mb-4">
            L'IMC est une mesure standardisée utilisée par l'Organisation Mondiale de la Santé (OMS) pour évaluer les risques pour la santé liés au surpoids ou à l'insuffisance pondérale. Il se calcule en divisant le poids (en kg) par le carré de la taille (en mètres).
          </p>
          <p className="text-gray-600">
            Notre calculateur d'IMC en ligne vous permet d'obtenir rapidement votre score et de voir où vous vous situez sur l'échelle de classification officielle.
          </p>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Comment interpréter vos résultats ?</h2>
          <ul className="list-disc pl-5 text-gray-600 space-y-2">
            <li><strong>Moins de 18.5 :</strong> Insuffisance pondérale. Il peut être utile de consulter un professionnel de santé.</li>
            <li><strong>18.5 à 24.9 :</strong> Poids normal. Votre poids est idéal par rapport à votre taille.</li>
            <li><strong>25 à 29.9 :</strong> Surpoids. Un équilibrage alimentaire peut être envisagé.</li>
            <li><strong>30 et plus :</strong> Obésité. Risque accru pour la santé (diabète, hypertension, etc.).</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
