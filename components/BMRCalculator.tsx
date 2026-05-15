import { useState, useMemo, useEffect } from 'react';
import { Heart, Activity, User, Ruler, Weight, RotateCcw, Info, Check, Zap, Trash2, Copy } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type Gender = 'male' | 'female';
type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export function BMRCalculator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t, i18n } = useTranslation();
  const [age, setAge] = useState<string>(initialData?.age || '');
  const [weight, setWeight] = useState<string>(initialData?.weight || '');
  const [height, setHeight] = useState<string>(initialData?.height || '');
  const [gender, setGender] = useState<Gender>(initialData?.gender || 'male');
  const [activity, setActivity] = useState<ActivityLevel>(initialData?.activity || 'sedentary');
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    onStateChange?.({ age, weight, height, gender, activity });
  }, [age, weight, height, gender, activity, onStateChange]);

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

  const activityLevels: ActivityLevel[] = ['sedentary', 'light', 'moderate', 'active', 'very_active'];

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Input Controls */}
        <div className="lg:col-span-7 space-y-8">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <User className="w-4 h-4" /> {t('bmrcalculator.your_info')}
              </h3>
              <button
                onClick={handleClear}
                disabled={!age && !weight && !height}
                className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
              >
                <Trash2 className="w-3 h-3" /> {t('common.clear')}
              </button>
            </div>

            <div className="space-y-6">
              {/* Gender Selection */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-500 px-1">{t('bmrcalculator.gender')}</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setGender('male')}
                    aria-pressed={gender === 'male'}
                    className={`py-4 rounded-2xl font-bold text-sm transition-all border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                      gender === 'male'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20'
                        : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {t('bmrcalculator.male')}
                  </button>
                  <button
                    onClick={() => setGender('female')}
                    aria-pressed={gender === 'female'}
                    className={`py-4 rounded-2xl font-bold text-sm transition-all border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                      gender === 'female'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20'
                        : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {t('bmrcalculator.female')}
                  </button>
                </div>
              </div>

              {/* Age, Weight, Height Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label htmlFor="age" className="text-xs font-bold text-slate-500 px-1">{t('bmrcalculator.age')}</label>
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
                  <label htmlFor="weight" className="text-xs font-bold text-slate-500 px-1">{t('bmrcalculator.weight')}</label>
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
                  <label htmlFor="height" className="text-xs font-bold text-slate-500 px-1">{t('bmrcalculator.height')}</label>
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
                <label htmlFor="activity" className="text-xs font-bold text-slate-500 px-1">{t('bmrcalculator.activity_level')}</label>
                <div className="grid grid-cols-1 gap-2">
                  {activityLevels.map((level) => (
                    <button
                      key={level}
                      onClick={() => setActivity(level)}
                      aria-pressed={activity === level}
                      className={`flex items-start gap-4 p-4 rounded-2xl border transition-all text-left focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
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
                          {t(`bmrcalculator.${level}`)}
                        </div>
                        <div className="text-xs text-slate-400 font-medium">{t(`bmrcalculator.${level}_desc`)}</div>
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
                className={`absolute top-6 right-6 p-3 rounded-2xl transition-all z-20 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                  copied === 'tdee'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-white/10 text-white/40 hover:text-white hover:bg-white/20 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100'
                }`}
                aria-label={t('bmrcalculator.copy_tdee')}
                title={t('bmrcalculator.copy_tdee')}
              >
                {copied === 'tdee' ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
            )}

            <div className="text-slate-400 font-bold uppercase tracking-widest text-xs">{t('bmrcalculator.maintenance')}</div>
            <div className="text-5xl md:text-6xl font-black text-white font-mono tracking-tighter" aria-live="polite">
              {results ? results.tdee.toLocaleString(i18n.language === 'en' ? 'en-US' : 'fr-FR') : "0"}
            </div>
            <div className="text-indigo-400 font-black text-xl md:text-2xl uppercase tracking-widest">
              {t('bmrcalculator.kcal_day')}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="text-xs font-black uppercase tracking-widest text-slate-400 flex justify-between">
                <span>{t('bmrcalculator.goals')}</span>
                <span className="text-indigo-500">{t('bmrcalculator.estimations')}</span>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center gap-2 group/bmr">
                  <span className="text-sm text-slate-500 flex items-center gap-1"><Heart className="w-3 h-3" /> {t('bmrcalculator.bmr_full')}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold font-mono">{results ? results.bmr.toLocaleString(i18n.language === 'en' ? 'en-US' : 'fr-FR') : "0"} kcal</span>
                    {results && (
                      <button
                        onClick={() => handleCopy(results.bmr, 'bmr')}
                        className={`p-1.5 rounded-lg transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                          copied === 'bmr'
                            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 md:opacity-0 focus-visible:opacity-100 group-hover/bmr:opacity-100'
                        }`}
                        aria-label={t('bmrcalculator.copy_bmr')}
                      >
                        {copied === 'bmr' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-center gap-2 text-rose-500 group/lose">
                  <span className="text-sm flex items-center gap-1"><Activity className="w-3 h-3" /> {t('bmrcalculator.lose_weight')}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold font-mono">{results ? results.lose.toLocaleString(i18n.language === 'en' ? 'en-US' : 'fr-FR') : "0"} kcal</span>
                    {results && (
                      <button
                        onClick={() => handleCopy(results.lose, 'lose')}
                        className={`p-1.5 rounded-lg transition-all focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none ${
                          copied === 'lose'
                            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 md:opacity-0 focus-visible:opacity-100 group-hover/lose:opacity-100'
                        }`}
                        aria-label={t('bmrcalculator.copy_lose')}
                      >
                        {copied === 'lose' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-center gap-2 text-emerald-500 group/gain">
                  <span className="text-sm flex items-center gap-1"><Zap className="w-3 h-3" /> {t('bmrcalculator.gain_weight')}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold font-mono">{results ? results.gain.toLocaleString(i18n.language === 'en' ? 'en-US' : 'fr-FR') : "0"} kcal</span>
                    {results && (
                      <button
                        onClick={() => handleCopy(results.gain, 'gain')}
                        className={`p-1.5 rounded-lg transition-all focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none ${
                          copied === 'gain'
                            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 md:opacity-0 focus-visible:opacity-100 group-hover/gain:opacity-100'
                        }`}
                        aria-label={t('bmrcalculator.copy_gain')}
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
                {t('bmrcalculator.complete_info')}
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
          <h3 className="text-lg font-black">{t('bmrcalculator.what_is_bmr')}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('bmrcalculator.bmr_desc')}
          </p>
        </div>

        <div className="space-y-4">
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center text-emerald-600">
            <Activity className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black">{t('bmrcalculator.tdee_vs_bmr')}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('bmrcalculator.tdee_desc')}
          </p>
        </div>

        <div className="space-y-4">
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center text-amber-600">
            <Info className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black">{t('bmrcalculator.mifflin_title')}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('bmrcalculator.mifflin_desc')}
          </p>
        </div>
      </div>
    </div>
  );
}
