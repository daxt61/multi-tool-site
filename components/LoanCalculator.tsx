import { useState, useMemo, useEffect } from "react";
import { Calculator, Info, Percent, Landmark, Clock, RotateCcw, Table, HelpCircle, BookOpen, ChevronRight, Trash2, AreaChart as ChartIcon } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "./ui/chart";
import { useTranslation } from "react-i18next";

export function LoanCalculator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t, i18n } = useTranslation();
  const [principal, setPrincipal] = useState<string>(initialData?.principal || "10000");
  const [annualRate, setAnnualRate] = useState<string>(initialData?.annualRate || "5");
  const [years, setYears] = useState<string>(initialData?.years || "5");

  useEffect(() => {
    onStateChange?.({ principal, annualRate, years });
  }, [principal, annualRate, years, onStateChange]);
  const [showSchedule, setShowSchedule] = useState(false);

  const result = useMemo(() => {
    const p = parseFloat(principal);
    const r = parseFloat(annualRate) / 100 / 12;
    const n = parseFloat(years) * 12;

    if (!isNaN(p) && !isNaN(r) && !isNaN(n) && r > 0 && n > 0) {
      const monthlyPayment = (p * (r * Math.pow(1 + r, n))) / (Math.pow(1 + r, n) - 1);
      const totalPayment = monthlyPayment * n;
      const totalInterest = totalPayment - p;

      // Amortization schedule
      const schedule = [];
      let remainingBalance = p;
      for (let i = 1; i <= n; i++) {
        const interestForMonth = remainingBalance * r;
        const principalForMonth = monthlyPayment - interestForMonth;
        remainingBalance -= principalForMonth;
        schedule.push({
          month: i,
          payment: monthlyPayment,
          principal: principalForMonth,
          interest: interestForMonth,
          balance: Math.max(0, remainingBalance),
        });
      }

      const chartData = [];
      let currentCumulativeInterest = 0;
      for (let i = 0; i < schedule.length; i++) {
        currentCumulativeInterest += schedule[i].interest;
        if ((i + 1) % 12 === 0 || i === schedule.length - 1 || i === 0) {
          chartData.push({
            month: schedule[i].month,
            year: Math.ceil(schedule[i].month / 12),
            balance: Math.round(schedule[i].balance),
            interest: Math.round(currentCumulativeInterest),
          });
        }
      }

      return {
        monthlyPayment,
        totalPayment,
        totalInterest,
        schedule,
        chartData,
      };
    } else if (!isNaN(p) && r === 0 && !isNaN(n) && n > 0) {
      const monthlyPayment = p / n;
      const schedule = Array.from({ length: Math.floor(n) }, (_, i) => ({
        month: i + 1,
        payment: monthlyPayment,
        principal: monthlyPayment,
        interest: 0,
        balance: Math.max(0, p - (monthlyPayment * (i + 1))),
      }));

      const chartData = [];
      for (let i = 0; i < schedule.length; i++) {
        if ((i + 1) % 12 === 0 || i === schedule.length - 1 || i === 0) {
          chartData.push({
            month: schedule[i].month,
            year: Math.ceil(schedule[i].month / 12),
            balance: Math.round(schedule[i].balance),
            interest: 0,
          });
        }
      }

      return {
        monthlyPayment,
        totalPayment: p,
        totalInterest: 0,
        schedule,
        chartData,
      };
    }
    return null;
  }, [principal, annualRate, years]);

  const handleClear = () => {
    setPrincipal("");
    setAnnualRate("");
    setYears("");
    setShowSchedule(false);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat(i18n.language === 'fr' ? 'fr-FR' : 'en-US', {
      style: 'currency',
      currency: 'EUR',
    }).format(val);
  };

  const chartConfig = {
    balance: {
      label: t("loancalc.remaining_balance"),
      color: "rgb(99, 102, 241)",
    },
    interest: {
      label: t("loancalc.cumulative_interest"),
      color: "rgb(244, 63, 94)",
    },
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="principal" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Landmark className="w-3 h-3" /> {t("loancalc.principal")}
            </label>
            <button
              onClick={handleClear}
              disabled={!principal && !annualRate && !years}
              className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-3 h-3" /> {t("common.clear")}
            </button>
          </div>
          <div className="relative">
            <input
              id="principal"
              type="number"
              value={principal}
              onChange={(e) => setPrincipal(e.target.value)}
              className="w-full p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl text-3xl md:text-4xl font-black font-mono outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
              placeholder="10000"
            />
            <span className="absolute right-6 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-300">{i18n.language === 'fr' ? '€' : '$'}</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <label htmlFor="annualRate" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-2">
                <Percent className="w-3 h-3" /> {t("loancalc.annual_rate")}
              </label>
              <div className="relative">
                 <input
                  id="annualRate"
                  type="number"
                  value={annualRate}
                  onChange={(e) => setAnnualRate(e.target.value)}
                  className="w-full p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
                  placeholder="5"
                  step="0.01"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-slate-400">%</span>
              </div>
            </div>
            <div className="space-y-3">
              <label htmlFor="years" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-2">
                <Clock className="w-3 h-3" /> {t("loancalc.term_years")}
              </label>
              <input
                id="years"
                type="number"
                value={years}
                onChange={(e) => setYears(e.target.value)}
                className="w-full p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
                placeholder="5"
              />
            </div>
          </div>

          {result && (
            <button
              onClick={() => setShowSchedule(!showSchedule)}
              className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${
                showSchedule
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                  : "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40"
              }`}
            >
              <Table className="w-5 h-5" /> {showSchedule ? t("loancalc.hide_schedule") : t("loancalc.show_schedule")}
            </button>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 dark:bg-black p-10 rounded-[2.5rem] shadow-xl shadow-indigo-500/10 flex flex-col items-center justify-center space-y-4 min-h-[300px] relative overflow-hidden">
             <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl"></div>

             <div className="text-slate-400 font-bold uppercase tracking-widest text-xs">{t("loancalc.estimated_monthly")}</div>
             <div className="text-5xl md:text-7xl font-black text-white font-mono tracking-tighter">
               {result ? result.monthlyPayment.toFixed(2) : "0.00"}
             </div>
             <div className="text-indigo-400 font-black text-xl md:text-2xl uppercase tracking-widest text-center">
               {i18n.language === 'fr' ? 'EUROS / MOIS' : 'USD / MONTH'}
             </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2 text-center">
               <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t("loancalc.total_cost")}</div>
               <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                 {result ? formatCurrency(result.totalPayment) : formatCurrency(0)}
               </div>
            </div>
            <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/20 p-6 rounded-3xl space-y-2 text-center">
               <div className="text-xs font-bold text-rose-500 dark:text-rose-400 uppercase tracking-widest">{t("loancalc.total_interest")}</div>
               <div className="text-2xl font-black text-rose-500 dark:text-rose-400 font-mono">
                 {result ? formatCurrency(result.totalInterest) : formatCurrency(0)}
               </div>
            </div>
          </div>

          {!result ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[2rem] flex items-start gap-4">
               <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                  <Info className="w-6 h-6" />
               </div>
               <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                 {t("loancalc.description")}
               </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900/40 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center gap-2 px-1">
                <ChartIcon className="w-4 h-4 text-indigo-500" />
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{t("loancalc.evolution")}</h3>
              </div>
              <ChartContainer config={chartConfig} className="h-[200px] w-full">
                <AreaChart data={result.chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="rgb(99, 102, 241)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="rgb(99, 102, 241)" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorInterest" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="rgb(244, 63, 94)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="rgb(244, 63, 94)" stopOpacity={0}/>
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
                    name={t("loancalc.remaining_balance")}
                  />
                  <Area
                    type="monotone"
                    dataKey="interest"
                    stroke="rgb(244, 63, 94)"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorInterest)"
                    name={t("loancalc.cumulative_interest")}
                  />
                </AreaChart>
              </ChartContainer>
            </div>
          )}
        </div>
      </div>

      {showSchedule && result && (
        <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="p-8 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-xl font-black flex items-center gap-3">
              <Table className="w-6 h-6 text-indigo-500" /> {t("loancalc.amortization_table")}
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                  <th className="p-4 text-xs font-black uppercase text-slate-400 text-center">{t("loancalc.month")}</th>
                  <th className="p-4 text-xs font-black uppercase text-slate-400">{t("loancalc.monthly_payment")}</th>
                  <th className="p-4 text-xs font-black uppercase text-slate-400">{t("loancalc.principal_part")}</th>
                  <th className="p-4 text-xs font-black uppercase text-slate-400 text-rose-500">{t("loancalc.interest_part")}</th>
                  <th className="p-4 text-xs font-black uppercase text-slate-400">{t("loancalc.balance")}</th>
                </tr>
              </thead>
              <tbody>
                {result.schedule.map((row) => (
                  <tr key={row.month} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-4 font-mono text-sm text-slate-400 text-center">{row.month}</td>
                    <td className="p-4 font-mono font-bold text-sm">{formatCurrency(row.payment)}</td>
                    <td className="p-4 font-mono text-sm text-emerald-500">{formatCurrency(row.principal)}</td>
                    <td className="p-4 font-mono text-sm text-rose-500">{formatCurrency(row.interest)}</td>
                    <td className="p-4 font-mono text-sm font-bold">{formatCurrency(row.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Educational Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-600">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black">{t("loancalc.how_it_works")}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t("loancalc.how_it_works_text")}
          </p>
          <ul className="space-y-2">
            {[t("loancalc.capital"), t("loancalc.rate"), t("loancalc.duration")].map(item => (
              <li key={item} className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300">
                <ChevronRight className="w-4 h-4 text-indigo-500" /> {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-4">
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center text-emerald-600">
            <HelpCircle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black">{t("loancalc.why_simulate")}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t("loancalc.why_simulate_text")}
          </p>
        </div>

        <div className="space-y-4">
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center text-amber-600">
            <Calculator className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black">{t("loancalc.technical_info")}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t("loancalc.formula_text")} <br/>
            <code className="bg-slate-100 dark:bg-slate-800 p-1 rounded font-mono text-xs">M = P * [r(1+r)^n] / [(1+r)^n - 1]</code><br/>
            {t("loancalc.formula_legend")}
          </p>
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2rem] border border-indigo-100 dark:border-indigo-900/20">
        <h4 className="font-black mb-4">{t("loancalc.faq")}</h4>
        <div className="space-y-6">
          <div>
            <h5 className="font-bold text-sm mb-2">{t("loancalc.insurance_q")}</h5>
            <p className="text-sm text-slate-500 dark:text-slate-400">{t("loancalc.insurance_a")}</p>
          </div>
          <div>
            <h5 className="font-bold text-sm mb-2">{t("loancalc.precision_q")}</h5>
            <p className="text-sm text-slate-500 dark:text-slate-400">{t("loancalc.precision_a")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
