import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { PiggyBank, TrendingUp, Wallet, RotateCcw, Coins, Calendar, Percent, Info, Banknote, Copy, Check, AreaChart as ChartIcon } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "./ui/chart";
import { Kbd } from "./ui/Kbd";

export function SavingsCalculator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t, i18n } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const initialAmountInputRef = useRef<HTMLInputElement>(null);

  const [initialAmount, setInitialAmount] = useState<string>(initialData?.initialAmount || "");
  const [monthlyDeposit, setMonthlyDeposit] = useState<string>(initialData?.monthlyDeposit || "");
  const [annualRate, setAnnualRate] = useState<string>(initialData?.annualRate || "");
  const [years, setYears] = useState<string>(initialData?.years || "");
  const [copied, setCopied] = useState<boolean>(false);

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

  const handleClear = useCallback(() => {
    setInitialAmount("");
    setMonthlyDeposit("");
    setAnnualRate("");
    setYears("");
    toast.success(t("savings.reset_success"));
    setTimeout(() => {
      initialAmountInputRef.current?.focus();
    }, 50);
  }, [t]);

  const handleCopy = useCallback(() => {
    const text = `${t("savings.estimated_final")}: ${calculation.finalAmount.toFixed(2)}€
${t("savings.total_deposited")}: ${calculation.totalDeposited.toFixed(2)}€
${t("savings.total_interest")}: +${calculation.totalInterest.toFixed(2)}€`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(t("savings.copied_success"));
    setTimeout(() => setCopied(false), 2000);
  }, [calculation, t]);

  // Keyboard shortcut listener with container isolation and handlersRef safeguard
  const handlersRef = useRef({ handleClear, handleCopy });
  useEffect(() => {
    handlersRef.current = { handleClear, handleCopy };
  }, [handleClear, handleCopy]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInsideContainer = containerRef.current?.contains(activeElement) || activeElement === document.body;

      if (!isInsideContainer) return;

      const isInputFocused =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement instanceof HTMLSelectElement ||
        activeElement?.getAttribute("contenteditable") === "true";

      if (isInputFocused) {
        if (e.key === "Escape") {
          e.preventDefault();
          handlersRef.current.handleClear();
        }
        return;
      }

      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key === "Escape") {
        e.preventDefault();
        handlersRef.current.handleClear();
      } else if (e.key.toLowerCase() === "c") {
        e.preventDefault();
        handlersRef.current.handleCopy();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const chartConfig = {
    balance: {
      label: t("savings.chart_balance"),
      color: "var(--color-balance)",
    },
    deposited: {
      label: t("savings.chart_deposited"),
      color: "var(--color-deposited)",
    },
  };

  const locale = i18n.language.startsWith("fr") ? "fr-FR" : "en-US";

  return (
    <div ref={containerRef} className="max-w-5xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="initialAmount" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 cursor-pointer">
                <Banknote className="w-3 h-3" aria-hidden="true" /> {t("savings.initial_amount")}
              </label>
              <div className="flex items-center gap-2">
                <Kbd modifier={null} className="text-slate-400">Esc</Kbd>
                <button
                  onClick={handleClear}
                  disabled={!initialAmount && !monthlyDeposit && !annualRate && !years}
                  className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
                  aria-label={t("common.reset")}
                >
                  <RotateCcw className="w-3 h-3" aria-hidden="true" /> {t("common.reset")}
                </button>
              </div>
            </div>
            <div className="relative">
              <input
                id="initialAmount"
                ref={initialAmountInputRef}
                type="number"
                value={initialAmount}
                onChange={(e) => setInitialAmount(e.target.value)}
                className="w-full p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl text-3xl font-black font-mono outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white focus-visible:ring-2 focus-visible:ring-indigo-500"
                placeholder="1000"
              />
              <span className="absolute right-6 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-300" aria-hidden="true">€</span>
            </div>

            <div className="space-y-3">
              <label htmlFor="monthlyDeposit" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-2 cursor-pointer">
                <Wallet className="w-3 h-3" aria-hidden="true" /> {t("savings.monthly_deposit")}
              </label>
              <div className="relative">
                <input
                  id="monthlyDeposit"
                  type="number"
                  value={monthlyDeposit}
                  onChange={(e) => setMonthlyDeposit(e.target.value)}
                  className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white focus-visible:ring-2 focus-visible:ring-indigo-500"
                  placeholder="100"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-slate-400" aria-hidden="true">€</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <label htmlFor="annualRate" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-2 cursor-pointer">
                  <Percent className="w-3 h-3" aria-hidden="true" /> {t("savings.annual_rate")}
                </label>
                <div className="relative">
                  <input
                    id="annualRate"
                    type="number"
                    value={annualRate}
                    onChange={(e) => setAnnualRate(e.target.value)}
                    className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white focus-visible:ring-2 focus-visible:ring-indigo-500"
                    placeholder="3"
                    step="0.01"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-slate-400" aria-hidden="true">%</span>
                </div>
              </div>
              <div className="space-y-3">
                <label htmlFor="years" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-2 cursor-pointer">
                  <Calendar className="w-3 h-3" aria-hidden="true" /> {t("savings.duration_years")}
                </label>
                <input
                  id="years"
                  type="number"
                  value={years}
                  onChange={(e) => setYears(e.target.value)}
                  className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white focus-visible:ring-2 focus-visible:ring-indigo-500"
                  placeholder="10"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-900 dark:bg-black p-8 md:p-10 rounded-[2.5rem] shadow-xl shadow-indigo-500/10 flex flex-col items-center justify-center space-y-4 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>

            <div className="absolute top-6 right-6 flex items-center gap-2 z-20">
              <Kbd modifier={null} className="bg-slate-800 border-slate-700 text-slate-400">C</Kbd>
              <button
                onClick={handleCopy}
                className={`p-3 rounded-2xl transition-all border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                  copied
                    ? "bg-emerald-500 text-white border-emerald-500"
                    : "bg-white/10 text-white border-transparent hover:text-white hover:bg-white/20"
                }`}
                aria-label={t("savings.copy_summary")}
                title={t("savings.copy_summary")}
              >
                {copied ? <Check className="w-5 h-5" aria-hidden="true" /> : <Copy className="w-5 h-5" aria-hidden="true" />}
              </button>
            </div>

            <div className="text-slate-400 font-bold uppercase tracking-widest text-xs text-center">{t("savings.estimated_final")}</div>
            <div className="text-5xl md:text-6xl font-black text-white font-mono tracking-tighter" aria-live="polite" aria-atomic="true">
              {calculation.finalAmount.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-indigo-400 font-black text-xl md:text-2xl uppercase tracking-widest">
              EUROS
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2 text-center">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2">
                <Coins className="w-3 h-3" aria-hidden="true" /> {t("savings.total_deposited")}
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                {calculation.totalDeposited.toLocaleString(locale, { minimumFractionDigits: 2 })}€
              </div>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20 p-6 rounded-3xl space-y-2 text-center">
              <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center justify-center gap-2">
                <TrendingUp className="w-3 h-3" aria-hidden="true" /> {t("savings.total_interest")}
              </div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                +{calculation.totalInterest.toLocaleString(locale, { minimumFractionDigits: 2 })}€
              </div>
            </div>
          </div>

          {calculation.chartData.length > 1 && (
            <div className="bg-white dark:bg-slate-900/40 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center gap-2 px-1">
                <ChartIcon className="w-4 h-4 text-indigo-500" aria-hidden="true" />
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{t("savings.chart_title")}</h3>
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
                    label={{ value: t("savings.chart_years_axis"), position: 'insideBottomRight', offset: -5, fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
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
                    name={t("savings.chart_balance")}
                  />
                  <Area
                    type="monotone"
                    dataKey="deposited"
                    stroke="rgb(16, 185, 129)"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorDeposited)"
                    name={t("savings.chart_deposited")}
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
            <PiggyBank className="w-6 h-6" aria-hidden="true" />
          </div>
          <h3 className="text-lg font-black">{t("savings.compound_interest_title")}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t("savings.compound_interest_desc")}
          </p>
        </div>

        <div className="space-y-4">
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center text-emerald-600">
            <TrendingUp className="w-6 h-6" aria-hidden="true" />
          </div>
          <h3 className="text-lg font-black">{t("savings.regularity_title")}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t("savings.regularity_desc")}
          </p>
        </div>

        <div className="space-y-4">
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center text-amber-600">
            <Info className="w-6 h-6" aria-hidden="true" />
          </div>
          <h3 className="text-lg font-black">{t("savings.inflation_title")}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t("savings.inflation_desc")}
          </p>
        </div>
      </div>
    </div>
  );
}
