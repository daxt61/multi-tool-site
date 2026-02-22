import { useState } from 'react';
import { Percent, ArrowRight, Info, TrendingUp, Check, Copy, Trash2 } from 'lucide-react';

export function PercentageCalculator() {
  const [value1, setValue1] = useState('100');
  const [value2, setValue2] = useState('20');
  const [value3, setValue3] = useState('150');
  const [value4, setValue4] = useState('100');
  const [initialVal, setInitialVal] = useState('100');
  const [finalVal, setFinalVal] = useState('150');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const percentageOf = (Number(value2) / 100) * Number(value1);
  const whatPercent = Number(value4) !== 0 ? (Number(value3) / Number(value4)) * 100 : 0;

  const v1 = Number(initialVal);
  const v2 = Number(finalVal);
  const percentChange = v1 !== 0 ? ((v2 - v1) / v1) * 100 : 0;

  const handleCopy = (value: number | string, section: string) => {
    navigator.clipboard.writeText(String(value));
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section 1: X% de Y */}
        <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-6 relative group">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-500">
                <Percent className="w-4 h-4" />
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">Combien font X% de Y ?</label>
              </div>
              <button
                onClick={() => { setValue2(''); setValue1(''); }}
                className="text-slate-400 hover:text-rose-500 transition-colors"
                aria-label="Effacer les champs de la section 1"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <input
                id="percent-val"
                type="number"
                value={value2}
                onChange={(e) => setValue2(e.target.value)}
                className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
                placeholder="20"
                aria-label="Pourcentage"
              />
              <span className="text-xl font-bold text-slate-400 whitespace-nowrap">% de</span>
              <input
                id="total-val"
                type="number"
                value={value1}
                onChange={(e) => setValue1(e.target.value)}
                className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
                placeholder="100"
                aria-label="Valeur totale"
              />
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 text-center relative">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Résultat</div>
            <div className="text-4xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
               {isNaN(percentageOf) ? '0' : percentageOf.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </div>
            <button
              onClick={() => handleCopy(percentageOf, 'section1')}
              className={`absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all ${
                copiedSection === 'section1' ? 'bg-emerald-500 text-white' : 'text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'
              }`}
              aria-label="Copier le résultat de la section 1"
            >
              {copiedSection === 'section1' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Section 2: X représente quel % de Y */}
        <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-6 relative">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-500">
                <ArrowRight className="w-4 h-4" />
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">X représente quel % de Y ?</label>
              </div>
              <button
                onClick={() => { setValue3(''); setValue4(''); }}
                className="text-slate-400 hover:text-rose-500 transition-colors"
                aria-label="Effacer les champs de la section 2"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <input
                id="part-val"
                type="number"
                value={value3}
                onChange={(e) => setValue3(e.target.value)}
                className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
                placeholder="150"
                aria-label="Valeur partielle"
              />
              <span className="text-xl font-bold text-slate-400 whitespace-nowrap">de</span>
              <input
                id="whole-val"
                type="number"
                value={value4}
                onChange={(e) => setValue4(e.target.value)}
                className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
                placeholder="100"
                aria-label="Valeur totale"
              />
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 text-center relative">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Résultat</div>
            <div className="text-4xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
               {isNaN(whatPercent) ? '0' : whatPercent.toLocaleString(undefined, { maximumFractionDigits: 2 })}%
            </div>
            <button
              onClick={() => handleCopy(whatPercent, 'section2')}
              className={`absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all ${
                copiedSection === 'section2' ? 'bg-emerald-500 text-white' : 'text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'
              }`}
              aria-label="Copier le résultat de la section 2"
            >
              {copiedSection === 'section2' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Section 3: Variation en % */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-500">
            <TrendingUp className="w-4 h-4" />
            <label className="text-xs font-black uppercase tracking-widest text-slate-400">Variation en % (Augmentation/Diminution)</label>
          </div>
          <button
            onClick={() => { setInitialVal(''); setFinalVal(''); }}
            className="text-slate-400 hover:text-rose-500 transition-colors"
            aria-label="Effacer les champs de la section 3"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
             <label htmlFor="initial-val" className="text-xs font-bold text-slate-400 px-1 uppercase tracking-widest cursor-pointer">Valeur initiale</label>
             <input
              id="initial-val"
              type="number"
              value={initialVal}
              onChange={(e) => setInitialVal(e.target.value)}
              className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-2xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
            />
          </div>
          <div className="space-y-3">
             <label htmlFor="final-val" className="text-xs font-bold text-slate-400 px-1 uppercase tracking-widest cursor-pointer">Valeur finale</label>
             <input
              id="final-val"
              type="number"
              value={finalVal}
              onChange={(e) => setFinalVal(e.target.value)}
              className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-2xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
            />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 text-center relative">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Variation</div>
            <div className={`text-5xl font-black font-mono ${percentChange >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
               {percentChange > 0 ? '+' : ''}{isNaN(percentChange) ? '0' : percentChange.toLocaleString(undefined, { maximumFractionDigits: 2 })}%
            </div>
            <button
              onClick={() => handleCopy(percentChange, 'section3')}
              className={`absolute right-6 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all ${
                copiedSection === 'section3' ? 'bg-emerald-500 text-white' : 'text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'
              }`}
              aria-label="Copier la variation"
            >
              {copiedSection === 'section3' ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </button>
        </div>
      </div>

      {/* Section 4: Résultat après % de changement */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-500">
            <Info className="w-4 h-4" />
            <label className="text-xs font-black uppercase tracking-widest text-slate-400">Calculer une valeur après changement</label>
          </div>
          <button
            onClick={() => { setValue1(''); setValue2(''); }}
            className="text-slate-400 hover:text-rose-500 transition-colors"
            aria-label="Effacer les champs de la section 4"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
             <label className="text-xs font-bold text-slate-400 px-1 uppercase tracking-widest">Valeur de base</label>
             <input
              type="number"
              value={value1}
              onChange={(e) => setValue1(e.target.value)}
              className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-2xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
            />
          </div>
          <div className="space-y-3">
             <label className="text-xs font-bold text-slate-400 px-1 uppercase tracking-widest">Pourcentage (+ ou -)</label>
             <input
              type="number"
              value={value2}
              onChange={(e) => setValue2(e.target.value)}
              className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-2xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20 p-6 rounded-2xl text-center relative group/result">
             <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">Si Augmentation (+)</div>
             <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
               {(Number(value1) * (1 + Math.abs(Number(value2)) / 100)).toLocaleString(undefined, { maximumFractionDigits: 2 })}
             </div>
             <button
                onClick={() => handleCopy((Number(value1) * (1 + Math.abs(Number(value2)) / 100)).toFixed(2), 'section4a')}
                className={`absolute right-3 top-3 p-1.5 rounded-lg transition-all opacity-0 group-hover/result:opacity-100 ${
                  copiedSection === 'section4a' ? 'bg-emerald-500 text-white opacity-100' : 'text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
                }`}
                aria-label="Copier l'augmentation"
              >
                {copiedSection === 'section4a' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
           </div>
           <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/20 p-6 rounded-2xl text-center relative group/result">
             <div className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest mb-1">Si Diminution (-)</div>
             <div className="text-3xl font-black text-rose-600 dark:text-rose-400 font-mono">
               {(Number(value1) * (1 - Math.abs(Number(value2)) / 100)).toLocaleString(undefined, { maximumFractionDigits: 2 })}
             </div>
             <button
                onClick={() => handleCopy((Number(value1) * (1 - Math.abs(Number(value2)) / 100)).toFixed(2), 'section4b')}
                className={`absolute right-3 top-3 p-1.5 rounded-lg transition-all opacity-0 group-hover/result:opacity-100 ${
                  copiedSection === 'section4b' ? 'bg-rose-500 text-white opacity-100' : 'text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/40'
                }`}
                aria-label="Copier la diminution"
              >
                {copiedSection === 'section4b' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}
