import { useState, useMemo } from 'react';
import { Droplets, Info, Weight, Activity, Copy, Check, Trash2, GlassWater, Waves } from 'lucide-react';

type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

const ACTIVITY_LABELS: Record<ActivityLevel, { label: string; desc: string; extra: number }> = {
  sedentary: { label: 'Faible', desc: 'Peu ou pas d\'exercice', extra: 0 },
  light: { label: 'Légère', desc: 'Exercice léger 1-3 jours/sem', extra: 300 },
  moderate: { label: 'Modérée', desc: 'Exercice modéré 3-5 jours/sem', extra: 500 },
  active: { label: 'Élevée', desc: 'Exercice intense 6-7 jours/sem', extra: 700 },
  very_active: { label: 'Très élevée', desc: 'Travail physique ou entraînement intense', extra: 1000 },
};

export function WaterCalculator() {
  const [weight, setWeight] = useState<string>('70');
  const [activity, setActivity] = useState<ActivityLevel>('moderate');
  const [copied, setCopied] = useState(false);

  const waterNeeds = useMemo(() => {
    const w = parseFloat(weight);
    if (isNaN(w) || w <= 0) return 0;

    // Base: 35ml per kg of body weight
    const baseNeeds = w * 35;
    const extra = ACTIVITY_LABELS[activity].extra;

    return baseNeeds + extra;
  }, [weight, activity]);

  const handleCopy = () => {
    if (waterNeeds > 0) {
      navigator.clipboard.writeText(`${(waterNeeds / 1000).toFixed(2)} Litres`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClear = () => {
    setWeight('');
    setActivity('sedentary');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Inputs */}
        <div className="lg:col-span-7 space-y-8">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Weight className="w-4 h-4 text-indigo-500" /> Vos Données
              </h3>
              <button
                onClick={handleClear}
                disabled={!weight}
                className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-3 h-3" /> Effacer
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <label htmlFor="weight" className="text-xs font-bold text-slate-500 px-1">Votre Poids (kg)</label>
                <input
                  id="weight"
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-2xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
                  placeholder="70"
                />
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-500 px-1">Niveau d'activité physique</label>
                <div className="grid grid-cols-1 gap-2">
                  {(Object.keys(ACTIVITY_LABELS) as ActivityLevel[]).map((level) => (
                    <button
                      key={level}
                      onClick={() => setActivity(level)}
                      aria-pressed={activity === level}
                      className={`flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${
                        activity === level
                          ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 shadow-sm'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
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

        {/* Results */}
        <div className="lg:col-span-5 space-y-8">
          <div className="bg-slate-900 dark:bg-black p-10 rounded-[2.5rem] shadow-xl shadow-indigo-500/10 flex flex-col items-center justify-center space-y-4 min-h-[300px] relative overflow-hidden text-center group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>

            {waterNeeds > 0 && (
              <button
                onClick={handleCopy}
                className={`absolute top-6 right-6 p-3 rounded-2xl transition-all z-20 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none ${
                  copied
                    ? 'bg-emerald-500 text-white'
                    : 'bg-white/10 text-white/40 hover:text-white hover:bg-white/20 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100'
                }`}
                title="Copier le résultat"
                aria-label="Copier le résultat"
              >
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
            )}

            <div className="text-slate-400 font-bold uppercase tracking-widest text-xs">Besoins quotidiens estimés</div>
            <div className="text-6xl md:text-7xl font-black text-white font-mono tracking-tighter">
              {waterNeeds > 0 ? (waterNeeds / 1000).toFixed(2) : "0.00"}
            </div>
            <div className="text-blue-400 font-black text-xl md:text-2xl uppercase tracking-widest">
              LITRES / JOUR
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-[2rem] flex flex-col items-center text-center gap-4">
               <div className="p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-3xl">
                  <GlassWater className="w-8 h-8" />
               </div>
               <div className="space-y-1">
                  <div className="text-2xl font-black text-slate-900 dark:text-white">
                    ~{waterNeeds > 0 ? Math.ceil(waterNeeds / 250) : "0"} verres
                  </div>
                  <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">Basé sur 250ml par verre</div>
               </div>
            </div>
          </div>

          {!waterNeeds && (
            <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 p-6 rounded-[2rem] flex items-start gap-4">
              <div className="p-3 bg-white dark:bg-slate-800 text-blue-500 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                <Info className="w-6 h-6" />
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                Saisissez votre poids pour obtenir une estimation personnalisée de vos besoins en hydratation.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Educational Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600">
            <Droplets className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black">Pourquoi boire ?</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            L'eau représente environ 60% du poids d'un adulte. Elle est essentielle pour la régulation thermique, le transport des nutriments et l'élimination des déchets.
          </p>
        </div>

        <div className="space-y-4">
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-600">
            <Activity className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black">L'effort physique</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Pendant l'exercice, vous perdez beaucoup d'eau par la sueur. Il est crucial d'augmenter votre consommation de 500ml à 1L par heure d'effort intense.
          </p>
        </div>

        <div className="space-y-4">
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center text-emerald-600">
            <Waves className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black">Hydratation et Santé</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Une bonne hydratation améliore la concentration, réduit la fatigue et peut aider à prévenir certains maux de tête et problèmes digestifs.
          </p>
        </div>
      </div>

      <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800">
        <h4 className="font-black mb-4">Conseils pratiques</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <h5 className="font-bold text-sm text-blue-600">N'attendez pas la soif</h5>
            <p className="text-sm text-slate-500 dark:text-slate-400">La sensation de soif apparaît quand vous êtes déjà légèrement déshydraté. Buvez régulièrement par petites gorgées tout au long de la journée.</p>
          </div>
          <div className="space-y-2">
            <h5 className="font-bold text-sm text-indigo-600">Fruits et légumes</h5>
            <p className="text-sm text-slate-500 dark:text-slate-400">Environ 20% de votre apport en eau provient de votre alimentation. Les concombres, la pastèque et les fraises sont d'excellentes sources.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
