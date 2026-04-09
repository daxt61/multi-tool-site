import { useState, useMemo } from 'react';
import { User, Ruler, Info, Check, Trash2, Heart, Activity, RotateCcw, Scale } from 'lucide-react';

type Gender = 'male' | 'female';

export function BodyFatCalculator() {
  const [gender, setGender] = useState<Gender>('male');
  const [weight, setWeight] = useState<string>('75');
  const [height, setHeight] = useState<string>('180');
  const [neck, setNeck] = useState<string>('38');
  const [waist, setWaist] = useState<string>('85');
  const [hip, setHip] = useState<string>('95');
  const [unit, setUnit] = useState<'metric' | 'imperial'>('metric');

  const stats = useMemo(() => {
    let w = parseFloat(weight);
    let h = parseFloat(height);
    let n = parseFloat(neck);
    let wa = parseFloat(waist);
    let hi = parseFloat(hip);

    if (isNaN(w) || isNaN(h) || isNaN(n) || isNaN(wa) || (gender === 'female' && isNaN(hi))) {
      return null;
    }

    // Convert to Metric if Imperial
    if (unit === 'imperial') {
      w = w * 0.453592;
      h = h * 2.54;
      n = n * 2.54;
      wa = wa * 2.54;
      hi = hi * 2.54;
    }

    let bodyFat = 0;

    // US Navy formula (uses metric: cm and kg)
    if (gender === 'male') {
      // %Fat = 495 / (1.0324 - 0.19077 * log10(waist - neck) + 0.15456 * log10(height)) - 450
      bodyFat = 495 / (1.0324 - 0.19077 * Math.log10(wa - n) + 0.15456 * Math.log10(h)) - 450;
    } else {
      // %Fat = 495 / (1.29579 - 0.35004 * log10(waist + hip - neck) + 0.22100 * log10(height)) - 450
      bodyFat = 495 / (1.29579 - 0.35004 * Math.log10(wa + hi - n) + 0.22100 * Math.log10(h)) - 450;
    }

    // Re-calculate masses in selected unit
    const currentWeight = parseFloat(weight);
    const fatMass = (bodyFat / 100) * currentWeight;
    const leanMass = currentWeight - fatMass;

    return {
      bodyFat: Math.max(0, bodyFat),
      fatMass: Math.max(0, fatMass),
      leanMass: Math.max(0, leanMass)
    };
  }, [gender, weight, height, neck, waist, hip, unit]);

  const getCategory = (bf: number) => {
    if (gender === 'male') {
      if (bf < 6) return { label: 'Essentiel', color: 'text-blue-500', bg: 'bg-blue-500' };
      if (bf < 14) return { label: 'Athlète', color: 'text-emerald-500', bg: 'bg-emerald-500' };
      if (bf < 18) return { label: 'Fitness', color: 'text-emerald-400', bg: 'bg-emerald-400' };
      if (bf < 25) return { label: 'Moyen', color: 'text-amber-500', bg: 'bg-amber-500' };
      return { label: 'Obèse', color: 'text-rose-500', bg: 'bg-rose-500' };
    } else {
      if (bf < 14) return { label: 'Essentiel', color: 'text-blue-500', bg: 'bg-blue-500' };
      if (bf < 21) return { label: 'Athlète', color: 'text-emerald-500', bg: 'bg-emerald-500' };
      if (bf < 25) return { label: 'Fitness', color: 'text-emerald-400', bg: 'bg-emerald-400' };
      if (bf < 32) return { label: 'Moyen', color: 'text-amber-500', bg: 'bg-amber-500' };
      return { label: 'Obèse', color: 'text-rose-500', bg: 'bg-rose-500' };
    }
  };

  const handleReset = () => {
    setWeight('');
    setHeight('');
    setNeck('');
    setWaist('');
    setHip('');
  };

  const handleUnitChange = (newUnit: 'metric' | 'imperial') => {
    if (newUnit === unit) return;

    setUnit(newUnit);
    // Sensible defaults for the new unit
    if (newUnit === 'metric') {
      setHeight('180');
      setWeight('75');
      setNeck('38');
      setWaist('85');
      setHip('95');
    } else {
      setHeight('71');
      setWeight('165');
      setNeck('15');
      setWaist('33');
      setHip('37');
    }
  };

  const category = stats ? getCategory(stats.bodyFat) : null;

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Inputs */}
        <div className="lg:col-span-7 space-y-8">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
            <div className="flex justify-between items-center px-1">
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-48">
                <button
                  onClick={() => handleUnitChange('metric')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${unit === 'metric' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                >
                  Métrique
                </button>
                <button
                  onClick={() => handleUnitChange('imperial')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${unit === 'imperial' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                >
                  Impérial
                </button>
              </div>
              <button
                onClick={handleReset}
                className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all"
              >
                <RotateCcw className="w-3 h-3" /> Réinitialiser
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setGender('male')}
                  className={`py-4 rounded-2xl font-bold text-sm transition-all border ${gender === 'male' ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'}`}
                >
                  Homme
                </button>
                <button
                  onClick={() => setGender('female')}
                  className={`py-4 rounded-2xl font-bold text-sm transition-all border ${gender === 'female' ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'}`}
                >
                  Femme
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="height" className="text-xs font-bold text-slate-500 px-1">Taille ({unit === 'metric' ? 'cm' : 'in'})</label>
                  <input id="height" type="number" value={height} onChange={(e) => setHeight(e.target.value)} className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white" placeholder={unit === 'metric' ? '180' : '71'} />
                </div>
                <div className="space-y-2">
                  <label htmlFor="weight" className="text-xs font-bold text-slate-500 px-1">Poids ({unit === 'metric' ? 'kg' : 'lb'})</label>
                  <input id="weight" type="number" value={weight} onChange={(e) => setWeight(e.target.value)} className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white" placeholder={unit === 'metric' ? '75' : '165'} />
                </div>
                <div className="space-y-2">
                  <label htmlFor="neck" className="text-xs font-bold text-slate-500 px-1">Tour de cou ({unit === 'metric' ? 'cm' : 'in'})</label>
                  <input id="neck" type="number" value={neck} onChange={(e) => setNeck(e.target.value)} className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white" placeholder={unit === 'metric' ? '38' : '15'} />
                </div>
                <div className="space-y-2">
                  <label htmlFor="waist" className="text-xs font-bold text-slate-500 px-1">Tour de taille ({unit === 'metric' ? 'cm' : 'in'})</label>
                  <input id="waist" type="number" value={waist} onChange={(e) => setWaist(e.target.value)} className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white" placeholder={unit === 'metric' ? '85' : '33'} />
                </div>
                {gender === 'female' && (
                  <div className="space-y-2">
                    <label htmlFor="hip" className="text-xs font-bold text-slate-500 px-1">Tour de hanches ({unit === 'metric' ? 'cm' : 'in'})</label>
                    <input id="hip" type="number" value={hip} onChange={(e) => setHip(e.target.value)} className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white" placeholder={unit === 'metric' ? '95' : '37'} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-5 space-y-8">
          <div className="bg-slate-900 dark:bg-black p-10 rounded-[2.5rem] shadow-xl shadow-indigo-500/10 flex flex-col items-center justify-center space-y-4 min-h-[300px] relative overflow-hidden text-center">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>

            <div className="text-slate-400 font-bold uppercase tracking-widest text-xs">Masse Grasse Estimée</div>
            <div className="text-6xl md:text-8xl font-black text-white font-mono tracking-tighter">
              {stats ? stats.bodyFat.toFixed(1) : "0.0"}
            </div>
            <div className="text-indigo-400 font-black text-xl md:text-2xl uppercase tracking-widest">
              %
            </div>

            {category && (
              <div className={`mt-4 px-6 py-2 rounded-full font-black text-sm uppercase tracking-widest ${category.bg} text-white shadow-lg animate-in zoom-in-95 duration-300`}>
                {category.label}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4">
             <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl flex justify-between items-center">
               <div className="flex items-center gap-3">
                 <div className="p-2 bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-lg">
                   <Activity className="w-4 h-4" />
                 </div>
                 <span className="text-sm font-bold text-slate-500">Masse Grasse</span>
               </div>
               <span className="font-black font-mono text-lg dark:text-white">{stats ? stats.fatMass.toFixed(1) : "0.0"} {unit === 'metric' ? 'kg' : 'lb'}</span>
             </div>
             <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl flex justify-between items-center">
               <div className="flex items-center gap-3">
                 <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 rounded-lg">
                   <Scale className="w-4 h-4" />
                 </div>
                 <span className="text-sm font-bold text-slate-500">Masse Maigre</span>
               </div>
               <span className="font-black font-mono text-lg dark:text-white">{stats ? stats.leanMass.toFixed(1) : "0.0"} {unit === 'metric' ? 'kg' : 'lb'}</span>
             </div>
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-900/10 p-6 rounded-[2rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
            <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 shrink-0">
              <Info className="w-6 h-6" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              Cet outil utilise la méthode de la marine américaine (US Navy). Pour plus de précision, mesurez à jeun le matin. Les résultats sont des estimations basées sur des modèles statistiques.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
