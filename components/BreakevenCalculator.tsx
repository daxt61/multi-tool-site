import { useState, useMemo } from "react";
import { Target, TrendingUp, DollarSign, Package, RotateCcw, Info, Trash2, LineChart as ChartIcon, BarChart3, ChevronRight, BookOpen } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "./ui/chart";

export function BreakevenCalculator() {
  const [fixedCosts, setFixedCosts] = useState<string>("5000");
  const [variableCost, setVariableCost] = useState<string>("20");
  const [sellingPrice, setSellingPrice] = useState<string>("50");
  const [targetUnits, setTargetUnits] = useState<string>("300");

  const calculation = useMemo(() => {
    const fc = parseFloat(fixedCosts) || 0;
    const vc = parseFloat(variableCost) || 0;
    const sp = parseFloat(sellingPrice) || 0;
    const tu = parseInt(targetUnits) || 0;

    const contributionMargin = sp - vc;
    const breakevenUnits = contributionMargin > 0 ? fc / contributionMargin : 0;
    const breakevenSales = breakevenUnits * sp;
    const contributionMarginRatio = sp > 0 ? (contributionMargin / sp) * 100 : 0;

    const data = [];
    const maxUnits = Math.max(tu, Math.ceil(breakevenUnits * 1.5), 10);
    const step = Math.ceil(maxUnits / 10);

    for (let i = 0; i <= maxUnits; i += step) {
      data.push({
        units: i,
        totalRevenue: i * sp,
        totalCosts: fc + (i * vc),
        fixedCosts: fc
      });
    }

    // Ensure the last point is included if not exactly on step
    if (data[data.length - 1].units !== maxUnits) {
        data.push({
            units: maxUnits,
            totalRevenue: maxUnits * sp,
            totalCosts: fc + (maxUnits * vc),
            fixedCosts: fc
        });
    }

    return {
      breakevenUnits,
      breakevenSales,
      contributionMargin,
      contributionMarginRatio,
      chartData: data,
    };
  }, [fixedCosts, variableCost, sellingPrice, targetUnits]);

  const handleClear = () => {
    setFixedCosts("");
    setVariableCost("");
    setSellingPrice("");
    setTargetUnits("");
  };

  const chartConfig = {
    totalRevenue: {
      label: "Chiffre d'affaires",
      color: "var(--color-revenue)",
    },
    totalCosts: {
      label: "Coûts totaux",
      color: "var(--color-costs)",
    },
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="fixedCosts" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <DollarSign className="w-3 h-3" /> Coûts Fixes Totaux
              </label>
              <button
                onClick={handleClear}
                disabled={!fixedCosts && !variableCost && !sellingPrice && !targetUnits}
                className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-3 h-3" /> Effacer
              </button>
            </div>
            <div className="relative">
              <input
                id="fixedCosts"
                type="number"
                value={fixedCosts}
                onChange={(e) => setFixedCosts(e.target.value)}
                className="w-full p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl text-3xl font-black font-mono outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
                placeholder="5000"
              />
              <span className="absolute right-6 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-300">€</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <label htmlFor="variableCost" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-2">
                  <Package className="w-3 h-3" /> Coût variable / unité
                </label>
                <div className="relative">
                  <input
                    id="variableCost"
                    type="number"
                    value={variableCost}
                    onChange={(e) => setVariableCost(e.target.value)}
                    className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
                    placeholder="20"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-slate-400">€</span>
                </div>
              </div>
              <div className="space-y-3">
                <label htmlFor="sellingPrice" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-2">
                  <DollarSign className="w-3 h-3" /> Prix de vente / unité
                </label>
                <div className="relative">
                  <input
                    id="sellingPrice"
                    type="number"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
                    placeholder="50"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-slate-400">€</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label htmlFor="targetUnits" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-2">
                <Target className="w-3 h-3" /> Unités prévues (pour le graphique)
              </label>
              <input
                id="targetUnits"
                type="number"
                value={targetUnits}
                onChange={(e) => setTargetUnits(e.target.value)}
                className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
                placeholder="300"
              />
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-900 dark:bg-black p-8 md:p-10 rounded-[2.5rem] shadow-xl shadow-indigo-500/10 flex flex-col items-center justify-center space-y-4 relative overflow-hidden text-center">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>

            <div className="text-slate-400 font-bold uppercase tracking-widest text-xs">Seuil de Rentabilité (Unités)</div>
            <div className="text-5xl md:text-6xl font-black text-white font-mono tracking-tighter">
              {calculation.breakevenUnits > 0 ? Math.ceil(calculation.breakevenUnits).toLocaleString('fr-FR') : "0"}
            </div>
            <div className="text-indigo-400 font-black text-xl md:text-2xl uppercase tracking-widest">
              UNITÉS VENDUES
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2 text-center">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2">
                <BarChart3 className="w-3 h-3" /> Chiffre d'affaires critique
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                {calculation.breakevenSales.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€
              </div>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20 p-6 rounded-3xl space-y-2 text-center">
              <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center justify-center gap-2">
                <TrendingUp className="w-3 h-3" /> Marge sur coût variable
              </div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {calculation.contributionMarginRatio.toFixed(1)}%
              </div>
            </div>
          </div>

          {calculation.chartData.length > 1 && (
            <div className="bg-white dark:bg-slate-900/40 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center gap-2 px-1">
                <ChartIcon className="w-4 h-4 text-indigo-500" />
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Graphique du Seuil de Rentabilité</h3>
              </div>
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <AreaChart data={calculation.chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="rgb(99, 102, 241)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="rgb(99, 102, 241)" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorCosts" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="rgb(244, 63, 94)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="rgb(244, 63, 94)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(203, 213, 225, 0.2)" />
                  <XAxis
                    dataKey="units"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
                    label={{ value: 'Unités', position: 'insideBottomRight', offset: -5, fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="totalRevenue"
                    stroke="rgb(99, 102, 241)"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                    name="Chiffre d'affaires"
                  />
                  <Area
                    type="monotone"
                    dataKey="totalCosts"
                    stroke="rgb(244, 63, 94)"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorCosts)"
                    name="Coûts totaux"
                  />
                </AreaChart>
              </ChartContainer>
            </div>
          )}
        </div>
      </div>

      {/* Educational Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-600">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black">C'est quoi le seuil ?</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Le seuil de rentabilité (ou point mort) est le niveau d'activité à partir duquel une entreprise commence à réaliser un bénéfice. À ce point, le chiffre d'affaires égalise les coûts totaux.
          </p>
        </div>

        <div className="space-y-4">
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center text-emerald-600">
            <TrendingUp className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black">Marge sur Coût Variable</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            C'est la différence entre le prix de vente et les coûts variables. Cette marge doit être suffisante pour couvrir les coûts fixes et générer un profit.
          </p>
        </div>

        <div className="space-y-4">
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center text-amber-600">
            <Info className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black">Coûts Fixes vs Variables</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Les coûts fixes ne varient pas avec la production (loyer, assurances). Les coûts variables évoluent selon le nombre d'unités produites (matières premières, packaging).
          </p>
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2rem] border border-indigo-100 dark:border-indigo-900/20">
        <h4 className="font-black mb-4">Conseils stratégiques</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <h5 className="font-bold text-sm text-indigo-600 flex items-center gap-2">
                <ChevronRight className="w-4 h-4" /> Réduire le seuil
            </h5>
            <p className="text-sm text-slate-500 dark:text-slate-400">Pour abaisser votre seuil de rentabilité, vous pouvez soit augmenter vos prix, soit réduire vos coûts variables ou fixes.</p>
          </div>
          <div className="space-y-2">
            <h5 className="font-bold text-sm text-emerald-600 flex items-center gap-2">
                <ChevronRight className="w-4 h-4" /> Sécurité financière
            </h5>
            <p className="text-sm text-slate-500 dark:text-slate-400">Visez toujours un volume de ventes nettement supérieur au seuil de rentabilité pour disposer d'une "marge de sécurité" en cas de baisse d'activité.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
