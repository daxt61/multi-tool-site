import { useState, useEffect } from 'react';
import { Dog, Calculator, Info, Trash2, Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type DogSize = 'small' | 'medium' | 'large' | 'giant';

export function DogAgeConverter({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [dogAge, setDogAge] = useState<number>(initialData?.dogAge || 1);
  const [dogSize, setDogSize] = useState<DogSize>(initialData?.dogSize || 'medium');

  useEffect(() => {
    onStateChange?.({ dogAge, dogSize });
  }, [dogAge, dogSize, onStateChange]);

  const humanAge = (() => {
    if (dogAge <= 0) return 0;

    // First year is roughly 15 human years for all sizes
    if (dogAge === 1) return 15;

    // Second year adds roughly 9 years (total 24)
    if (dogAge === 2) return 24;

    // From year 3, it depends on size
    const baseAge = 24;
    const remainingYears = dogAge - 2;

    let factor = 4;
    if (dogSize === 'small') factor = 4;
    else if (dogSize === 'medium') factor = 5;
    else if (dogSize === 'large') factor = 6;
    else if (dogSize === 'giant') factor = 7;

    return baseAge + (remainingYears * factor);
  })();

  const handleClear = () => {
    setDogAge(1);
    setDogSize('medium');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex justify-end px-1">
        <button
          onClick={handleClear}
          className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
        >
          <Trash2 className="w-3 h-3" /> {t('common.reset')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="dog-age" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('dogage.dog_years', 'Âge du chien (années)')}
              </label>
              <span className="text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400">{dogAge}</span>
            </div>
            <input
              id="dog-age"
              type="range"
              min="1"
              max="20"
              step="1"
              value={dogAge}
              onChange={(e) => setDogAge(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
            />
          </div>

          <div className="space-y-4">
            <label className="block text-xs font-black uppercase tracking-widest text-slate-400 px-1">
              {t('dogage.size', 'Taille du chien')}
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'small', label: t('dogage.small', 'Petit'), desc: '< 10kg' },
                { id: 'medium', label: t('dogage.medium', 'Moyen'), desc: '10-25kg' },
                { id: 'large', label: t('dogage.large', 'Grand'), desc: '25-45kg' },
                { id: 'giant', label: t('dogage.giant', 'Géant'), desc: '> 45kg' }
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setDogSize(s.id as DogSize)}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    dogSize === s.id
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-indigo-500/50'
                  }`}
                >
                  <div className="font-bold text-sm">{s.label}</div>
                  <div className={`text-[10px] font-medium opacity-60 ${dogSize === s.id ? 'text-white' : ''}`}>{s.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center p-8 bg-indigo-600 rounded-[2.5rem] text-white shadow-xl shadow-indigo-600/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-2xl -ml-24 -mb-24"></div>

          <div className="relative z-10 text-center space-y-4">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Dog className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold opacity-80 uppercase tracking-widest">{t('dogage.human_equivalent', 'Équivalent Humain')}</h3>
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-8xl font-black font-mono tracking-tighter">{humanAge}</span>
              <span className="text-2xl font-bold opacity-60">{t('agecalculator.years', 'ans')}</span>
            </div>
            <p className="max-w-[250px] mx-auto text-indigo-100 font-medium leading-relaxed">
              {t('dogage.result_msg', { age: humanAge })}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20 rounded-3xl p-6 text-sm text-indigo-900 dark:text-indigo-400 flex gap-4 items-start">
        <div className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm text-indigo-500 shrink-0">
          <Info className="w-5 h-5" />
        </div>
        <div>
          <p className="font-bold mb-1">{t('dogage.about_title', 'Comment est calculé l\'âge d\'un chien ?')}</p>
          <p className="opacity-80 leading-relaxed">
            {t('dogage.about_text', 'L\'idée reçue qu\'une année de chien équivaut à 7 années humaines est une simplification. En réalité, les chiens mûrissent plus vite au début de leur vie. La première année compte pour environ 15 ans, la deuxième pour 9, puis chaque année supplémentaire compte pour 4 à 7 ans selon la taille et la race de l\'animal.')}
          </p>
        </div>
      </div>
    </div>
  );
}
