import { useState, useMemo } from "react";
import { PiggyBank, TrendingUp, Wallet, RotateCcw, Coins, Calendar, Percent, Info, Banknote, Trash2, AreaChart as ChartIcon } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "./ui/chart";

import { useEffect } from 'react';

export function SavingsCalculator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const [initialAmount, setInitialAmount] = useState<string>(initialData?.initialAmount || "");
  const [monthlyDeposit, setMonthlyDeposit] = useState<string>(initialData?.monthlyDeposit || "");
  const [annualRate, setAnnualRate] = useState<string>(initialData?.annualRate || "");
  const [years, setYears] = useState<string>(initialData?.years || "");

  useEffect(() => {
    onStateChange?.({ initialAmount, monthlyDeposit, annualRate, years });
  }, [initialAmount, monthlyDeposit, annualRate, years, onStateChange]);

  const calculation = useMemo(() => {
    const p = parseFloat(initialAmount) || 0;
    const pmt = parseFloat(monthlyDeposit) || 0;
    const r = (parseFloat(annualRate) || 0) / 100 / 12;
    const y = parseFloat(years) || 0;
    const n = Math.floor(y * 12);

    const data = [];
    let currentBalance = p;
    let totalDeposited = p;

    // Add initial state
    data.push({
      month: 0,
      year: 0,
      balance: Math.round(currentBalance),
      deposited: Math.round(totalDeposited),
      interest: 0,
    });

    if (n > 0) {
      for (let i = 1; i <= n; i++) {
        if (r > 0) {
          currentBalance = currentBalance * (1 + r) + pmt;
        } else {
          currentBalance += pmt;
        }
        totalDeposited += pmt;

        // Only add yearly points or the last point to keep chart clean
        if (i % 12 === 0 || i === n) {
          data.push({
            month: i,
            year: +(i / 12).toFixed(1),
            balance: Math.round(currentBalance),
            deposited: Math.round(totalDeposited),
            interest: Math.round(currentBalance - totalDeposited),
          });
        }
      }

      return {
        finalAmount: currentBalance,
        totalDeposited,
        totalInterest: currentBalance - totalDeposited,
        chartData: data,
      };
    }
    return {
      finalAmount: p,
      totalDeposited: p,
      totalInterest: 0,
      chartData: data,
    };
  }, [initialAmount, monthlyDeposit, annualRate, years]);

  const handleClear = () => {
    setInitialAmount("");
    setMonthlyDeposit("");
    setAnnualRate("");
    setYears("");
  };

  const chartConfig = {
    balance: {
      label: "Capital total",
      color: "var(--color-balance)",
    },
    deposited: {
      label: "Total versé",
      color: "var(--color-deposited)",
    },
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="initialAmount" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Banknote className="w-3 h-3" /> Capital initial
              </label>
              <button
                onClick={handleClear}
                disabled={!initialAmount && !monthlyDeposit && !annualRate && !years}
                className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-3 h-3" /> Effacer
              </button>
            </div>
            <div className="relative">
              <input
                id="initialAmount"
                type="number"
                value={initialAmount}
                onChange={(e) => setInitialAmount(e.target.value)}
                className="w-full p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl text-3xl font-black font-mono outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
                placeholder="1000"
              />
              <span className="absolute right-6 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-300">€</span>
            </div>

            <div className="space-y-3">
              <label htmlFor="monthlyDeposit" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-2">
                <Wallet className="w-3 h-3" /> Versement mensuel
              </label>
              <div className="relative">
                <input
                  id="monthlyDeposit"
                  type="number"
                  value={monthlyDeposit}
                  onChange={(e) => setMonthlyDeposit(e.target.value)}
                  className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
                  placeholder="100"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-slate-400">€</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <label htmlFor="annualRate" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-2">
                  <Percent className="w-3 h-3" /> Taux annuel
                </label>
                <div className="relative">
                  <input
                    id="annualRate"
                    type="number"
                    value={annualRate}
                    onChange={(e) => setAnnualRate(e.target.value)}
                    className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
                    placeholder="3"
                    step="0.01"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-slate-400">%</span>
                </div>
              </div>
              <div className="space-y-3">
                <label htmlFor="years" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-2">
                  <Calendar className="w-3 h-3" /> Durée (ans)
                </label>
                <input
                  id="years"
                  type="number"
                  value={years}
                  onChange={(e) => setYears(e.target.value)}
                  className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
                  placeholder="10"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-900 dark:bg-black p-8 md:p-10 rounded-[2.5rem] shadow-xl shadow-indigo-500/10 flex flex-col items-center justify-center space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>

            <div className="text-slate-400 font-bold uppercase tracking-widest text-xs">Capital final estimé</div>
            <div className="text-5xl md:text-6xl font-black text-white font-mono tracking-tighter">
              {calculation.finalAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-indigo-400 font-black text-xl md:text-2xl uppercase tracking-widest">
              EUROS
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2 text-center">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2">
                <Coins className="w-3 h-3" /> Total versé
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                {calculation.totalDeposited.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€
              </div>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20 p-6 rounded-3xl space-y-2 text-center">
              <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center justify-center gap-2">
                <TrendingUp className="w-3 h-3" /> Intérêts
              </div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                +{calculation.totalInterest.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€
              </div>
            </div>
          </div>

          {calculation.chartData.length > 1 && (
            <div className="bg-white dark:bg-slate-900/40 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center gap-2 px-1">
                <ChartIcon className="w-4 h-4 text-indigo-500" />
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Évolution du capital</h3>
              </div>
              <ChartContainer config={chartConfig} className="h-[250px] w-full">
                <AreaChart data={calculation.chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="rgb(99, 102, 241)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="rgb(99, 102, 241)" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorDeposited" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="rgb(16, 185, 129)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="rgb(16, 185, 129)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(203, 213, 225, 0.2)" />
                  <XAxis
                    dataKey="year"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
                    label={{ value: 'Années', position: 'insideBottomRight', offset: -5, fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
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
                    dataKey="balance"
                    stroke="rgb(99, 102, 241)"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorBalance)"
                    name="Capital total"
                  />
                  <Area
                    type="monotone"
                    dataKey="deposited"
                    stroke="rgb(16, 185, 129)"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorDeposited)"
                    name="Total versé"
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
            <PiggyBank className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black">L'intérêt composé</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            C'est l'effet "boule de neige" : vos intérêts génèrent eux-mêmes des intérêts. Plus vous épargnez longtemps, plus cet effet est puissant.
          </p>
        </div>

        <div className="space-y-4">
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center text-emerald-600">
            <TrendingUp className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black">La régularité</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Épargner un petit montant chaque mois est souvent plus efficace que de verser une grosse somme ponctuellement, grâce au lissage dans le temps.
          </p>
        </div>

        <div className="space-y-4">
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center text-amber-600">
            <Info className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black">Inflation</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            N'oubliez pas que l'inflation réduit le pouvoir d'achat de votre monnaie. Un taux d'intérêt supérieur à l'inflation est nécessaire pour réellement s'enrichir.
          </p>
        </div>
      </div>
    </div>
  );
}
