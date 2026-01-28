import { useState } from "react";
import { TrendingUp, Info, DollarSign, Percent, Calculator as CalcIcon } from "lucide-react";

export function MarginCalculator() {
  const [costPrice, setCostPrice] = useState<string>("");
  const [sellingPrice, setSellingPrice] = useState<string>("");
  const [marginPercent, setMarginPercent] = useState<string>("");
  const [markupPercent, setMarkupPercent] = useState<string>("");

  const calculateFromCostAndSelling = () => {
    const cost = parseFloat(costPrice);
    const selling = parseFloat(sellingPrice);
    if (!isNaN(cost) && !isNaN(selling) && selling > 0) {
      const margin = ((selling - cost) / selling) * 100;
      const markup = cost !== 0 ? ((selling - cost) / cost) * 100 : 0;
      setMarginPercent(margin.toFixed(2));
      setMarkupPercent(markup.toFixed(2));
    }
  };

  const calculateFromCostAndMargin = () => {
    const cost = parseFloat(costPrice);
    const margin = parseFloat(marginPercent);
    if (!isNaN(cost) && !isNaN(margin) && margin < 100) {
      const selling = cost / (1 - margin / 100);
      const markup = ((selling - cost) / cost) * 100;
      setSellingPrice(selling.toFixed(2));
      setMarkupPercent(markup.toFixed(2));
    }
  };

  const calculateFromCostAndMarkup = () => {
    const cost = parseFloat(costPrice);
    const markup = parseFloat(markupPercent);
    if (!isNaN(cost) && !isNaN(markup)) {
      const selling = cost * (1 + markup / 100);
      const margin = ((selling - cost) / selling) * 100;
      setSellingPrice(selling.toFixed(2));
      setMarginPercent(margin.toFixed(2));
    }
  };

  const profit =
    parseFloat(sellingPrice) - parseFloat(costPrice) || 0;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-2">
                <DollarSign className="w-3 h-3" /> Prix d'achat (Coût)
              </label>
              <input
                type="number"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                className="w-full p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-2xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
                placeholder="0.00"
              />
            </div>
            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-2">
                <TrendingUp className="w-3 h-3" /> Prix de vente
              </label>
              <input
                type="number"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                className="w-full p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-2xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
                placeholder="0.00"
              />
            </div>
          </div>

          <button
            onClick={calculateFromCostAndSelling}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all"
          >
            <CalcIcon className="w-5 h-5" /> Calculer marge et coefficient
          </button>

          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-2">
                <Percent className="w-3 h-3" /> Marge (%)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={marginPercent}
                  onChange={(e) => setMarginPercent(e.target.value)}
                  className="flex-1 p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
                  placeholder="0.00"
                />
                <button
                  onClick={calculateFromCostAndMargin}
                  className="px-6 bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 rounded-2xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700"
                >
                  Calculer
                </button>
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-2">
                <TrendingUp className="w-3 h-3" /> Coefficient (Markup %)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={markupPercent}
                  onChange={(e) => setMarkupPercent(e.target.value)}
                  className="flex-1 p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
                  placeholder="0.00"
                />
                <button
                  onClick={calculateFromCostAndMarkup}
                  className="px-6 bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 rounded-2xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700"
                >
                  Calculer
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 dark:bg-black p-10 rounded-[2.5rem] shadow-xl shadow-indigo-500/10 flex flex-col items-center justify-center space-y-4 min-h-[300px]">
             <div className="text-slate-400 font-bold uppercase tracking-widest text-xs">Bénéfice par unité</div>
             <div className={`text-6xl font-black font-mono tracking-tighter ${profit >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
               {profit.toFixed(2)}€
             </div>
             <div className={`${profit >= 0 ? "text-emerald-500/50" : "text-rose-500/50"} font-black text-2xl uppercase tracking-widest`}>
               {profit >= 0 ? "Profit" : "Perte"}
             </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-[2rem] space-y-4">
             <div className="flex items-center gap-2 text-indigo-500 mb-2">
                <Info className="w-5 h-5" />
                <span className="font-bold text-sm uppercase tracking-wider">Formules</span>
             </div>
             <div className="space-y-4 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <p className="font-bold text-slate-900 dark:text-white mb-1">Marge</p>
                  <code className="text-indigo-600 dark:text-indigo-400">(Prix de vente - Coût) / Prix de vente × 100</code>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <p className="font-bold text-slate-900 dark:text-white mb-1">Markup (Coefficient)</p>
                  <code className="text-indigo-600 dark:text-indigo-400">(Prix de vente - Coût) / Coût × 100</code>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
