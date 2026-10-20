import { useState, useEffect, useMemo, useRef } from 'react';
import { Calculator, Info, Activity, RotateCcw, Copy, Check, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  Line
} from 'recharts';

interface FIREPreset {
  id: string;
  nameKey: string;
  currentSavings: number;
  monthlySavings: number;
  annualSpending: number;
  expectedReturn: number;
  withdrawalRate: number;
  inflationRate: number;
}

const FIRE_PRESETS: FIREPreset[] = [
  {
    id: 'lean',
    nameKey: 'fire.preset_lean',
    currentSavings: 20000,
    monthlySavings: 1500,
    annualSpending: 24000,
    expectedReturn: 7,
    withdrawalRate: 4,
    inflationRate: 2
  },
  {
    id: 'standard',
    nameKey: 'fire.preset_standard',
    currentSavings: 50000,
    monthlySavings: 2000,
    annualSpending: 40000,
    expectedReturn: 7,
    withdrawalRate: 4,
    inflationRate: 2
  },
  {
    id: 'fat',
    nameKey: 'fire.preset_fat',
    currentSavings: 100000,
    monthlySavings: 4000,
    annualSpending: 80000,
    expectedReturn: 8,
    withdrawalRate: 3.5,
    inflationRate: 2
  },
  {
    id: 'coast',
    nameKey: 'fire.preset_coast',
    currentSavings: 15000,
    monthlySavings: 3000,
    annualSpending: 36000,
    expectedReturn: 8,
    withdrawalRate: 4,
    inflationRate: 2
  }
];

export function FIRECalculator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const primaryInputRef = useRef<HTMLInputElement>(null);

  const [currentSavings, setCurrentSavings] = useState(initialData?.currentSavings ?? 50000);
  const [monthlySavings, setMonthlySavings] = useState(initialData?.monthlySavings ?? 2000);
  const [annualSpending, setAnnualSpending] = useState(initialData?.annualSpending ?? 40000);
  const [expectedReturn, setExpectedReturn] = useState(initialData?.expectedReturn ?? 7);
  const [withdrawalRate, setWithdrawalRate] = useState(initialData?.withdrawalRate ?? 4);
  const [inflationRate, setAnnualInflation] = useState(initialData?.inflationRate ?? 2);
  const [activePresetId, setActivePresetId] = useState<string | null>('standard');
  const [copied, setCopied] = useState(false);

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

  const handleApplyPreset = (preset: FIREPreset) => {
    setCurrentSavings(preset.currentSavings);
    setMonthlySavings(preset.monthlySavings);
    setAnnualSpending(preset.annualSpending);
    setExpectedReturn(preset.expectedReturn);
    setWithdrawalRate(preset.withdrawalRate);
    setAnnualInflation(preset.inflationRate);
    setActivePresetId(preset.id);
    toast.success(t('fire.toast_preset_loaded', 'Loaded FIRE preset!'));
  };

  const handleReset = () => {
    setCurrentSavings(50000);
    setMonthlySavings(2000);
    setAnnualSpending(40000);
    setExpectedReturn(7);
    setWithdrawalRate(4);
    setAnnualInflation(2);
    setActivePresetId('standard');
    toast.success(t('fire.toast_reset', 'FIRE parameters reset to defaults'));
    primaryInputRef.current?.focus();
  };

  const handleCopySummary = () => {
    const summary = `FIRE Target: ${Math.round(fireResults.fireTarget).toLocaleString()} € | Time Remaining: ${fireResults.yearsToFIRE} years (Current Savings: ${currentSavings.toLocaleString()} €, Monthly Savings: ${monthlySavings.toLocaleString()} €, Annual Spending: ${annualSpending.toLocaleString()} €)`;
    navigator.clipboard.writeText(summary);
    setCopied(true);
    toast.success(t('fire.toast_copied', 'FIRE summary copied to clipboard!'));
    setTimeout(() => setCopied(false), 2000);
  };

  const handlersRef = useRef({ handleReset, handleCopySummary });
  useEffect(() => {
    handlersRef.current = { handleReset, handleCopySummary };
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isEditing = activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        (activeElement as HTMLElement).isContentEditable
      );

      if (e.key === 'Escape') {
        if (containerRef.current?.contains(activeElement) || activeElement === document.body) {
          e.preventDefault();
          handlersRef.current.handleReset();
        }
      } else if ((e.key === 'c' || e.key === 'C') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (!isEditing && (containerRef.current?.contains(activeElement) || activeElement === document.body)) {
          e.preventDefault();
          handlersRef.current.handleCopySummary();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div ref={containerRef} className="max-w-6xl mx-auto space-y-12">
      {/* Quick Start Presets Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>{t('fire.presets_title', 'Quick Start Presets:')}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {FIRE_PRESETS.map((preset) => {
            const isActive = activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                aria-pressed={isActive}
                onClick={() => handleApplyPreset(preset)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                  isActive
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {t(preset.nameKey, preset.id)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar: Inputs */}
        <div className="space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-indigo-500" />
                <span className="text-xs font-black uppercase tracking-widest text-slate-400">{t('common.options')}</span>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-rose-500 transition-colors"
                title="Reset (Esc)"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t('common.reset')}</span>
                <Kbd modifier={null} className="ml-1 text-rose-400 border-rose-200 dark:border-rose-800">Esc</Kbd>
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="currentSavings" className="text-[10px] font-bold text-slate-400 uppercase">
                  {t('fire.current_savings')}
                </label>
                <input
                  id="currentSavings"
                  ref={primaryInputRef}
                  type="number"
                  value={currentSavings}
                  onChange={(e) => {
                    setCurrentSavings(Number(e.target.value));
                    setActivePresetId(null);
                  }}
                  className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="monthlySavings" className="text-[10px] font-bold text-slate-400 uppercase">
                  {t('fire.monthly_savings')}
                </label>
                <input
                  id="monthlySavings"
                  type="number"
                  value={monthlySavings}
                  onChange={(e) => {
                    setMonthlySavings(Number(e.target.value));
                    setActivePresetId(null);
                  }}
                  className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="annualSpending" className="text-[10px] font-bold text-slate-400 uppercase">
                  {t('fire.annual_spending')}
                </label>
                <input
                  id="annualSpending"
                  type="number"
                  value={annualSpending}
                  onChange={(e) => {
                    setAnnualSpending(Number(e.target.value));
                    setActivePresetId(null);
                  }}
                  className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="expectedReturn" className="text-[10px] font-bold text-slate-400 uppercase">
                  {t('fire.expected_return')}
                </label>
                <input
                  id="expectedReturn"
                  type="number"
                  step="0.1"
                  value={expectedReturn}
                  onChange={(e) => {
                    setExpectedReturn(Number(e.target.value));
                    setActivePresetId(null);
                  }}
                  className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="withdrawalRate" className="text-[10px] font-bold text-slate-400 uppercase">
                  {t('fire.withdrawal_rate')}
                </label>
                <input
                  id="withdrawalRate"
                  type="number"
                  step="0.1"
                  value={withdrawalRate}
                  onChange={(e) => {
                    setWithdrawalRate(Number(e.target.value));
                    setActivePresetId(null);
                  }}
                  className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="inflationRate" className="text-[10px] font-bold text-slate-400 uppercase">
                  {t('fire.inflation_rate')}
                </label>
                <input
                  id="inflationRate"
                  type="number"
                  step="0.1"
                  value={inflationRate}
                  onChange={(e) => {
                    setAnnualInflation(Number(e.target.value));
                    setActivePresetId(null);
                  }}
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
             <div className="p-6 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-[2rem] space-y-1 relative">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600/60 dark:text-emerald-400/60">{t('fire.target')}</span>
                <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                   {Math.round(fireResults.fireTarget).toLocaleString()} €
                </div>
                <p className="text-xs text-emerald-600/60 font-bold">{t('fire.target_desc')}</p>
             </div>
             <div className="p-6 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-[2rem] space-y-1 relative">
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600/60 dark:text-indigo-400/60">{t('fire.time_remaining')}</span>
                <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
                   {fireResults.yearsToFIRE} {t('agecalculator.years').toLowerCase()}
                </div>
                <p className="text-xs text-indigo-600/60 font-bold">{t('fire.time_remaining_desc')}</p>
             </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 space-y-6">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
                      <Activity className="w-5 h-5 text-indigo-500" />
                   </div>
                   <span className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-xs">{t('fire.projection')}</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopySummary}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold transition-all"
                  title="Copy Summary (C)"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{t('fire.copy_summary', 'Copy Summary')}</span>
                  <Kbd modifier={null} className="hidden sm:inline-flex bg-white/50 dark:bg-black/20 border-slate-200 dark:border-slate-700 text-slate-500">C</Kbd>
                </button>
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
