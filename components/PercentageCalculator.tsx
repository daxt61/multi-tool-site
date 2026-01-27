import { useState } from 'react';
import { Percent, ArrowRight, Info } from 'lucide-react';

export function PercentageCalculator() {
  const [value1, setValue1] = useState('100');
  const [value2, setValue2] = useState('20');
  const [value3, setValue3] = useState('150');
  const [value4, setValue4] = useState('100');

  const percentageOf = (Number(value2) / 100) * Number(value1);
  const whatPercent = Number(value4) !== 0 ? (Number(value3) / Number(value4)) * 100 : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section 1: X% de Y */}
        <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-indigo-500">
              <Percent className="w-4 h-4" />
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Combien font X% de Y ?</label>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={value2}
                onChange={(e) => setValue2(e.target.value)}
                className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
                placeholder="20"
              />
              <span className="text-xl font-bold text-slate-400 whitespace-nowrap">% de</span>
              <input
                type="number"
                value={value1}
                onChange={(e) => setValue1(e.target.value)}
                className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
                placeholder="100"
              />
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 text-center">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Résultat</div>
            <div className="text-4xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
               {isNaN(percentageOf) ? '0' : percentageOf.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* Section 2: X représente quel % de Y */}
        <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
             <div className="flex items-center gap-2 text-indigo-500">
              <ArrowRight className="w-4 h-4" />
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">X représente quel % de Y ?</label>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={value3}
                onChange={(e) => setValue3(e.target.value)}
                className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
                placeholder="150"
              />
              <span className="text-xl font-bold text-slate-400 whitespace-nowrap">de</span>
              <input
                type="number"
                value={value4}
                onChange={(e) => setValue4(e.target.value)}
                className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
                placeholder="100"
              />
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 text-center">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Résultat</div>
            <div className="text-4xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
               {isNaN(whatPercent) ? '0' : whatPercent.toLocaleString(undefined, { maximumFractionDigits: 2 })}%
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Augmentation / Diminution */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
        <div className="flex items-center gap-2 text-indigo-500">
          <Info className="w-4 h-4" />
          <label className="text-xs font-black uppercase tracking-widest text-slate-400">Augmentation / Diminution</label>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
             <label className="text-xs font-bold text-slate-400 px-1 uppercase tracking-widest">Valeur initiale</label>
             <input
              type="number"
              value={value1}
              onChange={(e) => setValue1(e.target.value)}
              className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-2xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
            />
          </div>
          <div className="space-y-3">
             <label className="text-xs font-bold text-slate-400 px-1 uppercase tracking-widest">Pourcentage de changement</label>
             <input
              type="number"
              value={value2}
              onChange={(e) => setValue2(e.target.value)}
              className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-2xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20 p-6 rounded-2xl text-center">
             <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">Augmentation</div>
             <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
               {(Number(value1) * (1 + Number(value2) / 100)).toLocaleString(undefined, { maximumFractionDigits: 2 })}
             </div>
           </div>
           <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/20 p-6 rounded-2xl text-center">
             <div className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest mb-1">Diminution</div>
             <div className="text-3xl font-black text-rose-600 dark:text-rose-400 font-mono">
               {(Number(value1) * (1 - Number(value2) / 100)).toLocaleString(undefined, { maximumFractionDigits: 2 })}
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}
