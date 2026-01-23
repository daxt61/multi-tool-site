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
    if (bmi <= 0) return { label: 'En attente de données', color: 'bg-gray-400', range: '' };
    if (bmi < 16) return { label: 'Insuffisance pondérale sévère', color: 'bg-blue-700', range: '< 16' };
    if (bmi < 17) return { label: 'Insuffisance pondérale modérée', color: 'bg-blue-600', range: '16 - 16.9' };
    if (bmi < 18.5) return { label: 'Insuffisance pondérale légère', color: 'bg-blue-400', range: '17 - 18.4' };
    if (bmi < 25) return { label: 'Poids normal', color: 'bg-green-500', range: '18.5 - 24.9' };
    if (bmi < 30) return { label: 'Surpoids', color: 'bg-yellow-500', range: '25 - 29.9' };
    if (bmi < 35) return { label: 'Obésité (Classe I)', color: 'bg-orange-500', range: '30 - 34.9' };
    if (bmi < 40) return { label: 'Obésité (Classe II)', color: 'bg-red-500', range: '35 - 39.9' };
    return { label: 'Obésité (Classe III - Massive)', color: 'bg-red-700', range: '≥ 40' };
  };

  const category = getCategory();

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
        <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-xl">
          <button
            onClick={() => setUnit('metric')}
            className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
              unit === 'metric'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Métrique (kg/cm)
          </button>
          <button
            onClick={() => setUnit('imperial')}
            className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
              unit === 'imperial'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Impérial (lb/in)
          </button>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700">
              Poids ({unit === 'metric' ? 'kg' : 'lb'})
            </label>
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="Ex: 70"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700">
              Taille ({unit === 'metric' ? 'cm' : 'in'})
            </label>
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="Ex: 170"
            />
          </div>
        </div>
      </div>

      <div className={`${category.color} text-white p-8 rounded-2xl text-center mb-6 shadow-lg transition-colors duration-500`}>
        <div className="text-sm font-medium opacity-80 mb-2 uppercase tracking-wider">Votre Indice de Masse Corporelle</div>
        <div className="text-7xl font-black mb-2 font-mono">
          {bmi > 0 ? bmi.toFixed(1) : '--'}
        </div>
        <div className="text-2xl font-bold mb-1">
          {category.label}
        </div>
        <div className="text-sm opacity-80">
          Range: {category.range}
        </div>

        {/* Visual Scale Indicator */}
        <div className="relative w-full h-6 bg-black/10 rounded-full mt-8 overflow-hidden border border-white/20">
          <div className="absolute top-0 left-0 h-full w-[40%] bg-blue-400/30 border-r border-white/10" title="Insuffisance"></div>
          <div className="absolute top-0 left-[40%] h-full w-[22.5%] bg-green-400/30 border-r border-white/10" title="Normal"></div>
          <div className="absolute top-0 left-[62.5%] h-full w-[12.5%] bg-yellow-400/30 border-r border-white/10" title="Surpoids"></div>
          <div className="absolute top-0 left-[75%] h-full w-[25%] bg-red-400/30" title="Obésité"></div>

          {/* Pointer */}
          <div
            className="absolute top-0 w-1.5 h-full bg-white shadow-[0_0_15px_rgba(255,255,255,1)] transition-all duration-700 cubic-bezier(0.34, 1.56, 0.64, 1) z-10"
            style={{ left: `${Math.min(Math.max((bmi / 40) * 100, 0), 99)}%` }}
          >
            <div className="absolute -top-1 -left-1 w-3.5 h-3.5 bg-white rounded-full border-2 border-blue-500 shadow-sm"></div>
          </div>
        </div>
        <div className="flex justify-between mt-2 text-[10px] font-bold opacity-70 px-1 font-mono uppercase tracking-tighter">
          <span>0</span>
          <span>16</span>
          <span>18.5</span>
          <span>25</span>
          <span>30</span>
          <span>35</span>
          <span>40+</span>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
          <div className="w-1.5 h-6 bg-blue-500 rounded-full"></div>
          Classification OMS
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
          {[
            { label: 'Sévère', range: '< 16.0', color: 'bg-blue-700' },
            { label: 'Modérée', range: '16.0 - 16.9', color: 'bg-blue-600' },
            { label: 'Légère', range: '17.0 - 18.4', color: 'bg-blue-400' },
            { label: 'Poids normal', range: '18.5 - 24.9', color: 'bg-green-500' },
            { label: 'Surpoids', range: '25.0 - 29.9', color: 'bg-yellow-500' },
            { label: 'Obésité I', range: '30.0 - 34.9', color: 'bg-orange-500' },
            { label: 'Obésité II', range: '35.0 - 39.9', color: 'bg-red-500' },
            { label: 'Obésité III', range: '≥ 40.0', color: 'bg-red-700' },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 ${item.color} rounded-full`}></div>
                <span className="text-sm font-medium text-gray-700">{item.label}</span>
              </div>
              <span className="text-sm font-mono text-gray-400">{item.range}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-6 pt-4 border-t border-gray-50 italic">
          ℹ️ L'Indice de Masse Corporelle (IMC) est une mesure standardisée de la corpulence. Elle ne remplace pas un diagnostic médical et ne prend pas en compte la masse musculaire, l'ossature ou la répartition des graisses.
        </p>
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
