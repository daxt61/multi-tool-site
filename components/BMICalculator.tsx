import { useState } from 'react';
import { Activity, Info, Copy, Check } from 'lucide-react';

export function BMICalculator() {
  const [weight, setWeight] = useState('70');
  const [height, setHeight] = useState('170');
  const [unit, setUnit] = useState<'metric' | 'imperial'>('metric');
  const [copied, setCopied] = useState(false);

  const calculateBMI = () => {
    let weightKg = parseFloat(weight);
    let heightM = parseFloat(height);

    if (isNaN(weightKg) || isNaN(heightM) || heightM === 0) return 0;

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
    if (bmi === 0) return { label: 'En attente', color: 'bg-slate-200', text: 'text-slate-500' };
    if (bmi < 18.5) return { label: 'Insuffisance pondérale', color: 'bg-blue-500', text: 'text-blue-500' };
    if (bmi < 25) return { label: 'Poids normal', color: 'bg-emerald-500', text: 'text-emerald-500' };
    if (bmi < 30) return { label: 'Surpoids', color: 'bg-amber-500', text: 'text-amber-500' };
    return { label: 'Obésité', color: 'bg-rose-500', text: 'text-rose-500' };
  };

  const category = getCategory();

  const handleCopy = () => {
    const text = `Mon IMC est de ${bmi.toFixed(1)} (${category.label})`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-8">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setUnit('metric')}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${unit === 'metric' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500'}`}
            >
              Métrique
            </button>
            <button
              onClick={() => setUnit('imperial')}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${unit === 'imperial' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500'}`}
            >
              Impérial
            </button>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <label htmlFor="weight" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 cursor-pointer">Poids ({unit === 'metric' ? 'kg' : 'lb'})</label>
              <input
                id="weight"
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-2xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
                aria-label={`Poids en ${unit === 'metric' ? 'kilogrammes' : 'livres'}`}
              />
            </div>
            <div className="space-y-3">
              <label htmlFor="height" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 cursor-pointer">Taille ({unit === 'metric' ? 'cm' : 'in'})</label>
              <input
                id="height"
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-2xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
                aria-label={`Taille en ${unit === 'metric' ? 'centimètres' : 'pouces'}`}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex-grow bg-slate-900 dark:bg-black p-10 rounded-[2.5rem] text-center flex flex-col items-center justify-center space-y-4 shadow-xl shadow-indigo-500/10 relative group">
            <button
              onClick={handleCopy}
              className={`absolute top-6 right-6 p-3 rounded-2xl transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/40 hover:text-white hover:bg-white/20 md:opacity-0 md:group-hover:opacity-100'}`}
              title="Copier le résultat"
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </button>
            <div className="text-slate-400 font-bold uppercase tracking-widest text-xs">Votre IMC</div>
            <div className="text-8xl font-black text-white font-mono tracking-tighter">
              {bmi > 0 ? bmi.toFixed(1) : '0.0'}
            </div>
            <div className={`px-6 py-2 rounded-full font-black text-sm uppercase tracking-widest ${category.color} text-white`}>
              {category.label}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[2rem] flex items-start gap-4">
             <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                <Info className="w-6 h-6" />
             </div>
             <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
               L'IMC est un indicateur de corpulence. Il ne mesure pas directement la graisse corporelle et ne tient pas compte de la masse musculaire.
             </p>
          </div>
        </div>
      </div>

      <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800">
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-8 px-2 flex items-center gap-2">
          <Activity className="w-4 h-4" /> Classifications
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Insuffisance', range: '< 18.5', color: 'bg-blue-500' },
            { label: 'Normal', range: '18.5 - 25', color: 'bg-emerald-500' },
            { label: 'Surpoids', range: '25 - 30', color: 'bg-amber-500' },
            { label: 'Obésité', range: '> 30', color: 'bg-rose-500' },
          ].map((item) => (
            <div key={item.label} className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase mb-1">{item.label}</div>
                <div className="font-mono font-black text-slate-900 dark:text-white">{item.range}</div>
              </div>
              <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
