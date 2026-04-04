import { useState, useMemo } from 'react';
import { Heart, Activity, User, Ruler, Weight, RotateCcw, Info, Check, Zap, Trash2, Copy } from 'lucide-react';

type Gender = 'male' | 'female';
type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

const ACTIVITY_LABELS: Record<ActivityLevel, { label: string; desc: string }> = {
  sedentary: { label: 'Sédentaire', desc: 'Peu ou pas d\'exercice' },
  light: { label: 'Légèrement actif', desc: 'Exercice léger 1-3 fois/semaine' },
  moderate: { label: 'Modérément actif', desc: 'Exercice modéré 3-5 fois/semaine' },
  active: { label: 'Très actif', desc: 'Exercice intense 6-7 fois/semaine' },
  very_active: { label: 'Extrêmement actif', desc: 'Travail physique ou entraînement intensif' },
};

export function BMRCalculator() {
  const [age, setAge] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [height, setHeight] = useState<string>('');
  const [gender, setGender] = useState<Gender>('male');
  const [activity, setActivity] = useState<ActivityLevel>('sedentary');
  const [copied, setCopied] = useState<string | null>(null);

  const results = useMemo(() => {
    const a = parseFloat(age);
    const w = parseFloat(weight);
    const h = parseFloat(height);

    if (a > 0 && w > 0 && h > 0) {
      // Mifflin-St Jeor Equation
      let bmr = (10 * w) + (6.25 * h) - (5 * a);
      if (gender === 'male') {
        bmr += 5;
      } else {
        bmr -= 161;
      }

      const tdee = bmr * ACTIVITY_MULTIPLIERS[activity];

      return {
        bmr: Math.round(bmr),
        tdee: Math.round(tdee),
        lose: Math.round(tdee * 0.8),
        gain: Math.round(tdee * 1.15),
      };
    }
    return null;
  }, [age, weight, height, gender, activity]);

  const handleClear = () => {
    setAge('');
    setWeight('');
    setHeight('');
    setGender('male');
    setActivity('sedentary');
  };

  const handleCopy = (value: number, label: string) => {
    navigator.clipboard.writeText(value.toString());
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Input Controls */}
        <div className="lg:col-span-7 space-y-8">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <User className="w-4 h-4" /> Vos Informations
              </h3>
              <button
                onClick={handleClear}
                disabled={!age && !weight && !height}
                className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-3 h-3" /> Effacer
              </button>
            </div>

            <div className="space-y-6">
              {/* Gender Selection */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-500 px-1">Genre</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setGender('male')}
                    className={`py-4 rounded-2xl font-bold text-sm transition-all border ${
                      gender === 'male'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20'
                        : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    Homme
                  </button>
                  <button
                    onClick={() => setGender('female')}
                    className={`py-4 rounded-2xl font-bold text-sm transition-all border ${
                      gender === 'female'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20'
                        : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    Femme
                  </button>
                </div>
              </div>

              {/* Age, Weight, Height Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label htmlFor="age" className="text-xs font-bold text-slate-500 px-1">Âge</label>
                  <div className="relative">
                    <input
                      id="age"
                      type="number"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
                      placeholder="25"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="weight" className="text-xs font-bold text-slate-500 px-1">Poids (kg)</label>
                  <div className="relative">
                    <input
                      id="weight"
                      type="number"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
                      placeholder="70"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="height" className="text-xs font-bold text-slate-500 px-1">Taille (cm)</label>
                  <div className="relative">
                    <input
                      id="height"
                      type="number"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
                      placeholder="175"
                    />
                  </div>
                </div>
              </div>

              {/* Activity Level */}
              <div className="space-y-3">
                <label htmlFor="activity" className="text-xs font-bold text-slate-500 px-1">Niveau d'activité</label>
                <div className="grid grid-cols-1 gap-2">
                  {(Object.keys(ACTIVITY_LABELS) as ActivityLevel[]).map((level) => (
                    <button
                      key={level}
                      onClick={() => setActivity(level)}
                      className={`flex items-start gap-4 p-4 rounded-2xl border transition-all text-left ${
                        activity === level
                          ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 shadow-sm'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        activity === level ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'
                      }`}>
                        {activity === level && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <div>
                        <div className={`font-bold text-sm ${activity === level ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-200'}`}>
                          {ACTIVITY_LABELS[level].label}
                        </div>
                        <div className="text-xs text-slate-400 font-medium">{ACTIVITY_LABELS[level].desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Results Area */}
        <div className="lg:col-span-5 space-y-8">
          <div className="bg-slate-900 dark:bg-black p-10 rounded-[2.5rem] shadow-xl shadow-indigo-500/10 flex flex-col items-center justify-center space-y-4 min-h-[300px] relative overflow-hidden text-center group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>

            {results && (
              <button
                onClick={() => handleCopy(results.tdee, 'tdee')}
                className={`absolute top-6 right-6 p-3 rounded-2xl transition-all ${
                  copied === 'tdee'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-white/10 text-white/40 hover:text-white hover:bg-white/20 md:opacity-0 md:group-hover:opacity-100'
                }`}
                title="Copier le TDEE"
              >
                {copied === 'tdee' ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
            )}

            <div className="text-slate-400 font-bold uppercase tracking-widest text-xs">Maintien du poids (TDEE)</div>
            <div className="text-5xl md:text-6xl font-black text-white font-mono tracking-tighter">
              {results ? results.tdee.toLocaleString() : "0"}
            </div>
            <div className="text-indigo-400 font-black text-xl md:text-2xl uppercase tracking-widest">
              KCAL / JOUR
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="text-xs font-black uppercase tracking-widest text-slate-400 flex justify-between">
                <span>Objectifs caloriques</span>
                <span className="text-indigo-500">Estimations</span>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center gap-2 group/bmr">
                  <span className="text-sm text-slate-500 flex items-center gap-1"><Heart className="w-3 h-3" /> Métabolisme de base (BMR)</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold font-mono">{results ? results.bmr : "0"} kcal</span>
                    {results && (
                      <button
                        onClick={() => handleCopy(results.bmr, 'bmr')}
                        className={`p-1.5 rounded-lg transition-all ${
                          copied === 'bmr'
                            ? 'bg-emerald-500 text-white'
                            : 'text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 opacity-0 group-hover/bmr:opacity-100'
                        }`}
                      >
                        {copied === 'bmr' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-center gap-2 text-rose-500 group/lose">
                  <span className="text-sm flex items-center gap-1"><Activity className="w-3 h-3" /> Perte de poids (-20%)</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold font-mono">{results ? results.lose : "0"} kcal</span>
                    {results && (
                      <button
                        onClick={() => handleCopy(results.lose, 'lose')}
                        className={`p-1.5 rounded-lg transition-all ${
                          copied === 'lose'
                            ? 'bg-emerald-500 text-white'
                            : 'text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 opacity-0 group-hover/lose:opacity-100'
                        }`}
                      >
                        {copied === 'lose' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-center gap-2 text-emerald-500 group/gain">
                  <span className="text-sm flex items-center gap-1"><Zap className="w-3 h-3" /> Prise de masse (+15%)</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold font-mono">{results ? results.gain : "0"} kcal</span>
                    {results && (
                      <button
                        onClick={() => handleCopy(results.gain, 'gain')}
                        className={`p-1.5 rounded-lg transition-all ${
                          copied === 'gain'
                            ? 'bg-emerald-500 text-white'
                            : 'text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 opacity-0 group-hover/gain:opacity-100'
                        }`}
                      >
                        {copied === 'gain' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {!results && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[2rem] flex items-start gap-4">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                <Info className="w-6 h-6" />
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                Complétez vos informations pour calculer votre métabolisme de base et vos besoins caloriques journaliers.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Educational Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-600">
            <Heart className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black">Qu'est-ce que le BMR ?</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Le Basal Metabolic Rate (BMR) correspond aux calories brûlées par votre corps au repos total pour assurer ses fonctions vitales (respiration, digestion, etc.).
          </p>
        </div>

        <div className="space-y-4">
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center text-emerald-600">
            <Activity className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black">TDEE vs BMR</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Le Total Daily Energy Expenditure (TDEE) est votre dépense énergétique totale. Il inclut votre BMR multiplié par un facteur lié à votre activité physique quotidienne.
          </p>
        </div>

        <div className="space-y-4">
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center text-amber-600">
            <Info className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black">L'Équation Mifflin-St Jeor</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            C'est actuellement la formule la plus précise pour estimer le métabolisme de base pour la majorité des individus, devant l'ancienne formule Harris-Benedict.
          </p>
        </div>
      </div>
    </div>
  );
}
