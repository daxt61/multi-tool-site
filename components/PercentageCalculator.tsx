import { useState } from 'react';
import { Percent, ArrowRight, Info, TrendingUp, Trash2, Copy, Check } from 'lucide-react';

export function PercentageCalculator() {
  const [value1, setValue1] = useState('');
  const [value2, setValue2] = useState('');
  const [value3, setValue3] = useState('');
  const [value4, setValue4] = useState('');
  const [initialVal, setInitialVal] = useState('');
  const [finalVal, setFinalVal] = useState('');
  const [valAfter, setValAfter] = useState('');
  const [percentAfter, setPercentAfter] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const percentageOf = (Number(value2) / 100) * Number(value1);
  const whatPercent = Number(value4) !== 0 ? (Number(value3) / Number(value4)) * 100 : 0;

  const v1 = Number(initialVal);
  const v2 = Number(finalVal);
  const percentChange = v1 !== 0 ? ((v2 - v1) / v1) * 100 : 0;

  const afterIncrease = Number(valAfter) * (1 + Math.abs(Number(percentAfter)) / 100);
  const afterDecrease = Number(valAfter) * (1 - Math.abs(Number(percentAfter)) / 100);

  const handleClear = () => {
    setValue1('');
    setValue2('');
    setValue3('');
    setValue4('');
    setInitialVal('');
    setFinalVal('');
    setValAfter('');
    setPercentAfter('');
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const hasContent = value1 || value2 || value3 || value4 || initialVal || finalVal || valAfter || percentAfter;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex justify-end px-1">
        <button
          onClick={handleClear}
          disabled={!hasContent}
          className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-4 py-2 rounded-xl flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Trash2 className="w-4 h-4" /> Effacer tout
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section 1: X% de Y */}
        <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-500">
                <Percent className="w-4 h-4" />
                <label htmlFor="percent-val" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">Combien font X% de Y ?</label>
              </div>
              <button
                onClick={() => { setValue2(''); setValue1(''); }}
                disabled={!value2 && !value1}
                className="text-[10px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-2 py-0.5 rounded-lg transition-all disabled:opacity-0"
              >
                Effacer
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
          <div className="relative group/copy bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 text-center">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Résultat</div>
            <div className="text-4xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
               {isNaN(percentageOf) ? '0' : percentageOf.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </div>
            <button
              onClick={() => copyToClipboard(percentageOf.toFixed(2), 'copy1')}
              disabled={isNaN(percentageOf)}
              className={`absolute top-2 right-2 p-2 rounded-xl transition-all ${
                copiedId === 'copy1'
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-400 hover:text-indigo-500 bg-white dark:bg-slate-800 opacity-0 group-hover/copy:opacity-100 shadow-sm border border-slate-100 dark:border-slate-700'
              } disabled:opacity-0`}
              aria-label="Copier le résultat"
            >
              {copiedId === 'copy1' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Section 2: X représente quel % de Y */}
        <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
             <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-500">
                <ArrowRight className="w-4 h-4" />
                <label htmlFor="part-val" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">X représente quel % de Y ?</label>
              </div>
              <button
                onClick={() => { setValue3(''); setValue4(''); }}
                disabled={!value3 && !value4}
                className="text-[10px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-2 py-0.5 rounded-lg transition-all disabled:opacity-0"
              >
                Effacer
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
                aria-label="Valeur de référence"
              />
            </div>
          </div>
          <div className="relative group/copy bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 text-center">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Résultat</div>
            <div className="text-4xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
               {isNaN(whatPercent) ? '0' : whatPercent.toLocaleString(undefined, { maximumFractionDigits: 2 })}%
            </div>
            <button
              onClick={() => copyToClipboard(whatPercent.toFixed(2) + '%', 'copy2')}
              disabled={isNaN(whatPercent)}
              className={`absolute top-2 right-2 p-2 rounded-xl transition-all ${
                copiedId === 'copy2'
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-400 hover:text-indigo-500 bg-white dark:bg-slate-800 opacity-0 group-hover/copy:opacity-100 shadow-sm border border-slate-100 dark:border-slate-700'
              } disabled:opacity-0`}
              aria-label="Copier le résultat"
            >
              {copiedId === 'copy2' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Section 3: Variation en % */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-500">
            <TrendingUp className="w-4 h-4" />
            <label htmlFor="initial-val" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">Variation en % (Augmentation/Diminution)</label>
          </div>
          <button
            onClick={() => { setInitialVal(''); setFinalVal(''); }}
            disabled={!initialVal && !finalVal}
            className="text-[10px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-2 py-0.5 rounded-lg transition-all disabled:opacity-0"
          >
            Effacer
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

        <div className="relative group/copy bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 text-center">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Variation</div>
            <div className={`text-5xl font-black font-mono ${percentChange >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
               {percentChange > 0 ? '+' : ''}{isNaN(percentChange) ? '0' : percentChange.toLocaleString(undefined, { maximumFractionDigits: 2 })}%
            </div>
            <button
              onClick={() => copyToClipboard((percentChange > 0 ? '+' : '') + percentChange.toFixed(2) + '%', 'copy3')}
              disabled={isNaN(percentChange)}
              className={`absolute top-4 right-4 p-2 rounded-xl transition-all ${
                copiedId === 'copy3'
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-400 hover:text-indigo-500 bg-white dark:bg-slate-800 opacity-0 group-hover/copy:opacity-100 shadow-sm border border-slate-100 dark:border-slate-700'
              } disabled:opacity-0`}
              aria-label="Copier le résultat"
            >
              {copiedId === 'copy3' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
        </div>
      </div>

      {/* Section 4: Résultat après % de changement */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-500">
            <Info className="w-4 h-4" />
            <label htmlFor="base-val-after" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">Calculer une valeur après changement</label>
          </div>
          <button
            onClick={() => { setValAfter(''); setPercentAfter(''); }}
            disabled={!valAfter && !percentAfter}
            className="text-[10px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-2 py-0.5 rounded-lg transition-all disabled:opacity-0"
          >
            Effacer
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
             <label htmlFor="base-val-after" className="text-xs font-bold text-slate-400 px-1 uppercase tracking-widest cursor-pointer">Valeur de base</label>
             <input
              id="base-val-after"
              type="number"
              value={valAfter}
              onChange={(e) => setValAfter(e.target.value)}
              className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-2xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
              placeholder="100"
            />
          </div>
          <div className="space-y-3">
             <label htmlFor="percent-change-after" className="text-xs font-bold text-slate-400 px-1 uppercase tracking-widest cursor-pointer">Pourcentage (+ ou -)</label>
             <input
              id="percent-change-after"
              type="number"
              value={percentAfter}
              onChange={(e) => setPercentAfter(e.target.value)}
              className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl text-2xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
              placeholder="20"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <div className="relative group/copy bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20 p-6 rounded-2xl text-center">
             <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">Si Augmentation (+)</div>
             <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
               {afterIncrease.toLocaleString(undefined, { maximumFractionDigits: 2 })}
             </div>
             <button
              onClick={() => copyToClipboard(afterIncrease.toFixed(2), 'copy4')}
              className={`absolute top-2 right-2 p-2 rounded-xl transition-all ${
                copiedId === 'copy4'
                  ? 'bg-white text-emerald-600'
                  : 'text-emerald-400 hover:text-emerald-600 bg-white/50 opacity-0 group-hover/copy:opacity-100 shadow-sm border border-emerald-100'
              }`}
              aria-label="Copier l'augmentation"
            >
              {copiedId === 'copy4' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
           </div>
           <div className="relative group/copy bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/20 p-6 rounded-2xl text-center">
             <div className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest mb-1">Si Diminution (-)</div>
             <div className="text-3xl font-black text-rose-600 dark:text-rose-400 font-mono">
               {afterDecrease.toLocaleString(undefined, { maximumFractionDigits: 2 })}
             </div>
             <button
              onClick={() => copyToClipboard(afterDecrease.toFixed(2), 'copy5')}
              className={`absolute top-2 right-2 p-2 rounded-xl transition-all ${
                copiedId === 'copy5'
                  ? 'bg-white text-rose-600'
                  : 'text-rose-400 hover:text-rose-600 bg-white/50 opacity-0 group-hover/copy:opacity-100 shadow-sm border border-rose-100'
              }`}
              aria-label="Copier la diminution"
            >
              {copiedId === 'copy5' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
           </div>
        </div>
      </div>
    </div>
  );
}
