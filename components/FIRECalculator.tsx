import { useState, useEffect, useMemo } from 'react';
import { Wallet, TrendingUp, PiggyBank, Target, Info, Landmark, Calculator, ArrowRight, Activity } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';

export function FIRECalculator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [currentSavings, setCurrentSavings] = useState(initialData?.currentSavings || 50000);
  const [monthlySavings, setMonthlySavings] = useState(initialData?.monthlySavings || 2000);
  const [annualSpending, setAnnualSpending] = useState(initialData?.annualSpending || 40000);
  const [expectedReturn, setExpectedReturn] = useState(initialData?.expectedReturn || 7);
  const [withdrawalRate, setWithdrawalRate] = useState(initialData?.withdrawalRate || 4);
  const [inflationRate, setAnnualInflation] = useState(initialData?.inflationRate || 2);

  useEffect(() => {
    onStateChange?.({ currentSavings, monthlySavings, annualSpending, expectedReturn, withdrawalRate, inflationRate });
  }, [currentSavings, monthlySavings, annualSpending, expectedReturn, withdrawalRate, inflationRate, onStateChange]);

  const fireResults = useMemo(() => {
    const fireTarget = annualSpending / (withdrawalRate / 100);
    const data = [];
    let balance = currentSavings;
    let month = 0;
    const maxMonths = 12 * 100; // Max 100 years

    const nominalMonthlyReturn = (expectedReturn / 100) / 12;
    const inflationMonthlyRate = (inflationRate / 100) / 12;

    // Calculate real monthly return to keep everything in today's dollars
    const realMonthlyReturn = (1 + nominalMonthlyReturn) / (1 + inflationMonthlyRate) - 1;

    while (balance < fireTarget && month < maxMonths) {
      balance = balance * (1 + realMonthlyReturn) + monthlySavings;

      if (month % 12 === 0) {
        data.push({
          year: month / 12,
          balance: Math.round(balance),
          target: Math.round(fireTarget)
        });
      }
      month++;
    }

    // Add final data point
    if (month % 12 !== 0) {
        data.push({
            year: Math.ceil(month / 12),
            balance: Math.round(balance),
            target: Math.round(fireTarget)
        });
    }

    return {
      fireTarget,
      yearsToFIRE: (month / 12).toFixed(1),
      data
    };
  }, [currentSavings, monthlySavings, annualSpending, expectedReturn, withdrawalRate, inflationRate]);

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar: Inputs */}
        <div className="space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex items-center gap-2 px-1">
              <Calculator className="w-4 h-4 text-indigo-500" />
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">{t('common.options')}</span>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase">{t('fire.current_savings')}</label>
                <input
                  type="number"
                  value={currentSavings}
                  onChange={(e) => setCurrentSavings(Number(e.target.value))}
                  className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase">{t('fire.monthly_savings')}</label>
                <input
                  type="number"
                  value={monthlySavings}
                  onChange={(e) => setMonthlySavings(Number(e.target.value))}
                  className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase">{t('fire.annual_spending')}</label>
                <input
                  type="number"
                  value={annualSpending}
                  onChange={(e) => setAnnualSpending(Number(e.target.value))}
                  className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase">{t('fire.expected_return')}</label>
                <input
                  type="number"
                  step="0.1"
                  value={expectedReturn}
                  onChange={(e) => setExpectedReturn(Number(e.target.value))}
                  className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase">{t('fire.withdrawal_rate')}</label>
                <input
                  type="number"
                  step="0.1"
                  value={withdrawalRate}
                  onChange={(e) => setWithdrawalRate(Number(e.target.value))}
                  className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase">{t('fire.inflation_rate')}</label>
                <input
                  type="number"
                  step="0.1"
                  value={inflationRate}
                  onChange={(e) => setAnnualInflation(Number(e.target.value))}
                  className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all dark:text-white"
                />
              </div>
            </div>
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-900/10 p-6 rounded-3xl border border-indigo-100 dark:border-indigo-900/20 space-y-4">
             <div className="flex items-center gap-3">
                <div className="p-2 bg-white dark:bg-slate-800 text-indigo-600 rounded-xl shadow-sm">
                   <Info className="w-5 h-5" />
                </div>
                <h4 className="font-bold dark:text-white">{t('fire.rule_title')}</h4>
             </div>
             <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                {t('fire.rule_desc')}
             </p>
          </div>
        </div>

        {/* Main: Results and Graph */}
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="p-6 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-[2rem] space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600/60 dark:text-emerald-400/60">{t('fire.target')}</span>
                <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                   {Math.round(fireResults.fireTarget).toLocaleString()} €
                </div>
                <p className="text-xs text-emerald-600/60 font-bold">{t('fire.target_desc')}</p>
             </div>
             <div className="p-6 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-[2rem] space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600/60 dark:text-indigo-400/60">{t('fire.time_remaining')}</span>
                <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
                   {fireResults.yearsToFIRE} {t('agecalculator.years').toLowerCase()}
                </div>
                <p className="text-xs text-indigo-600/60 font-bold">{t('fire.time_remaining_desc')}</p>
             </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 space-y-6">
             <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
                   <Activity className="w-5 h-5 text-indigo-500" />
                </div>
                <span className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-xs">{t('fire.projection')}</span>
             </div>

             <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={fireResults.data}>
                    <defs>
                      <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                        dataKey="year"
                        axisLine={false}
                        tickLine={false}
                        tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}}
                        label={{ value: t('fire.years'), position: 'insideBottom', offset: -5, fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}}
                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#1e293b',
                            border: 'none',
                            borderRadius: '16px',
                            color: '#fff',
                            fontSize: '12px',
                            fontWeight: 'bold'
                        }}
                        itemStyle={{ color: '#818cf8' }}
                        formatter={(value: number) => [`${value.toLocaleString()} €`, 'Balance']}
                        labelFormatter={(label) => `${t('fire.year')} ${label}`}
                    />
                    <Area type="monotone" dataKey="balance" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorBalance)" />
                    <Line type="monotone" dataKey="target" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
