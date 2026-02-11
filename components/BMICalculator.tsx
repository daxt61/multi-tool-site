import { useState, useMemo } from 'react';
import { Activity, Info, Copy, Check, RotateCcw, HelpCircle, BookOpen, ChevronRight, Scale } from 'lucide-react';

export function BMICalculator() {
  const [weight, setWeight] = useState('70');
  const [height, setHeight] = useState('170');
  const [unit, setUnit] = useState<'metric' | 'imperial'>('metric');
  const [copied, setCopied] = useState(false);

  const { bmi, idealWeightRange } = useMemo(() => {
    let weightKg = parseFloat(weight);
    let heightM = parseFloat(height);

    if (isNaN(weightKg) || isNaN(heightM) || heightM === 0) {
      return { bmi: 0, idealWeightRange: null };
    }

    if (unit === 'imperial') {
      weightKg = weightKg * 0.453592;
      heightM = heightM * 0.0254;
    } else {
      heightM = heightM / 100;
    }

    const bmiValue = weightKg / (heightM * heightM);

    // Ideal weight range based on BMI 18.5 - 25
    const lowKg = 18.5 * (heightM * heightM);
    const highKg = 25 * (heightM * heightM);

    if (unit === 'imperial') {
      return {
        bmi: bmiValue,
        idealWeightRange: {
          low: lowKg / 0.453592,
          high: highKg / 0.453592,
          unit: 'lb'
        }
      };
    }

    return {
      bmi: bmiValue,
      idealWeightRange: {
        low: lowKg,
        high: highKg,
        unit: 'kg'
      }
    };
  }, [weight, height, unit]);

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

  const handleClear = () => {
    setWeight('');
    setHeight('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-8">
          <div className="flex justify-between items-center px-1">
             <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-48">
              <button
                onClick={() => setUnit('metric')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${unit === 'metric' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500'}`}
              >
                Métrique
              </button>
              <button
                onClick={() => setUnit('imperial')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${unit === 'imperial' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500'}`}
              >
                Impérial
              </button>
            </div>
            <button
              onClick={handleClear}
              className="text-xs font-bold text-indigo-500 hover:text-indigo-600 flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" /> Effacer
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
                placeholder={unit === 'metric' ? '70' : '154'}
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
                placeholder={unit === 'metric' ? '170' : '67'}
              />
            </div>
          </div>

          {idealWeightRange && (
            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-3xl border border-indigo-100 dark:border-indigo-900/20 flex items-center gap-4">
               <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm shrink-0">
                  <Scale className="w-6 h-6" />
               </div>
               <div>
                  <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">Poids idéal estimé</div>
                  <div className="text-lg font-black text-indigo-900 dark:text-indigo-300 font-mono">
                    {idealWeightRange.low.toFixed(1)} - {idealWeightRange.high.toFixed(1)} {idealWeightRange.unit}
                  </div>
               </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex-grow bg-slate-900 dark:bg-black p-10 rounded-[2.5rem] text-center flex flex-col items-center justify-center space-y-4 shadow-xl shadow-indigo-500/10 relative group overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>

            <button
              onClick={handleCopy}
              className={`absolute top-6 right-6 p-3 rounded-2xl transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/40 hover:text-white hover:bg-white/20 md:opacity-0 md:group-hover:opacity-100'}`}
              title="Copier le résultat"
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </button>
            <div className="text-slate-400 font-bold uppercase tracking-widest text-xs">Votre IMC</div>
            <div className="text-6xl md:text-8xl font-black text-white font-mono tracking-tighter">
              {bmi > 0 ? bmi.toFixed(1) : '0.0'}
            </div>
            <div className={`px-6 py-2 rounded-full font-black text-sm uppercase tracking-widest ${category.color} text-white shadow-lg`}>
              {category.label}
            </div>

            {/* Visual Scale */}
            <div className="w-full pt-8 space-y-4">
              <div className="relative h-2 w-full bg-slate-800 rounded-full flex overflow-hidden">
                <div className="h-full bg-blue-500" style={{ width: '14%' }} title="Insuffisance"></div>
                <div className="h-full bg-emerald-500" style={{ width: '26%' }} title="Normal"></div>
                <div className="h-full bg-amber-500" style={{ width: '20%' }} title="Surpoids"></div>
                <div className="h-full bg-rose-500" style={{ width: '40%' }} title="Obésité"></div>
              </div>
              <div className="relative w-full h-4">
                 <div
                  className="absolute top-0 transition-all duration-1000 ease-out"
                  style={{
                    left: `${Math.min(Math.max(((bmi - 15) / 25) * 100, 0), 100)}%`,
                    transform: 'translateX(-50%)'
                  }}
                 >
                   <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[8px] border-b-white"></div>
                 </div>
              </div>
              <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-tighter px-1">
                <span>15</span>
                <span>18.5</span>
                <span>25</span>
                <span>30</span>
                <span>40+</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[2rem] flex items-start gap-4">
             <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl shrink-0">
                <Info className="w-5 h-5" />
             </div>
             <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
               L'IMC est un indicateur. Il ne mesure pas la graisse corporelle et ne tient pas compte de la masse musculaire, de la structure osseuse ou de la répartition des graisses.
             </p>
          </div>
        </div>
      </div>

      <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800">
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-8 px-2 flex items-center gap-2">
          <Activity className="w-4 h-4" /> Classifications OMS
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Insuffisance', range: '< 18.5', color: 'bg-blue-500' },
            { label: 'Normal', range: '18.5 - 25', color: 'bg-emerald-500' },
            { label: 'Surpoids', range: '25 - 30', color: 'bg-amber-500' },
            { label: 'Obésité', range: '> 30', color: 'bg-rose-500' },
          ].map((item) => (
            <div key={item.label} className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-between shadow-sm">
              <div>
                <div className="text-[10px] font-black text-slate-400 uppercase mb-1 tracking-wider">{item.label}</div>
                <div className="font-mono font-black text-slate-900 dark:text-white">{item.range}</div>
              </div>
              <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
            </div>
          ))}
        </div>
      </div>

      {/* Educational Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-600">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black">Qu'est-ce que l'IMC ?</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            L'Indice de Masse Corporelle (IMC) est une mesure standard utilisée par l'Organisation Mondiale de la Santé (OMS) pour évaluer les risques pour la santé liés au poids.
          </p>
          <ul className="space-y-2">
            {['Poids / Taille²', 'Standard OMS', 'Adulte (18-65 ans)'].map(item => (
              <li key={item} className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300">
                <ChevronRight className="w-4 h-4 text-indigo-500" /> {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-4">
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center text-amber-600">
            <Scale className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black">Poids Idéal</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Le "poids idéal" affiché correspond à la plage de poids où votre IMC se situerait entre 18.5 et 25. C'est une plage indicative pour une santé optimale.
          </p>
        </div>

        <div className="space-y-4">
          <div className="w-12 h-12 bg-rose-50 dark:bg-rose-900/20 rounded-2xl flex items-center justify-center text-rose-600">
            <HelpCircle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black">Limites de l'IMC</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            L'IMC ne distingue pas la masse grasse de la masse musculaire. Un athlète peut avoir un IMC élevé sans être en surpoids "gras".
          </p>
        </div>
      </div>

      <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800">
        <h4 className="font-black mb-4">Conseils de santé</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <h5 className="font-bold text-sm text-emerald-600">Alimentation équilibrée</h5>
            <p className="text-sm text-slate-500 dark:text-slate-400">Privilégiez les fruits, légumes et protéines maigres tout en limitant les produits transformés.</p>
          </div>
          <div className="space-y-2">
            <h5 className="font-bold text-sm text-indigo-600">Activité physique</h5>
            <p className="text-sm text-slate-500 dark:text-slate-400">L'OMS recommande au moins 150 minutes d'activité physique modérée par semaine.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
