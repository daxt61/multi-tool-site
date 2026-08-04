import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { Banknote, Briefcase, Info, TrendingDown, TrendingUp, RotateCcw, HelpCircle, BookOpen, ChevronRight, Calculator, Copy, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Kbd } from "./ui/Kbd";

export function SalaryCalculator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const grossSalaryInputRef = useRef<HTMLInputElement>(null);

  const [grossAnnual, setGrossAnnual] = useState<string>(initialData?.grossAnnual || "35000");
  const [status, setStatus] = useState<"non-cadre" | "cadre">(initialData?.status || "non-cadre");
  const [is13thMonth, setIs13thMonth] = useState(initialData?.is13thMonth ?? false);
  const [mealVoucherValue, setMealVoucherValue] = useState<string>(initialData?.mealVoucherValue || "0");
  const [mealVoucherDays, setMealVoucherDays] = useState<string>(initialData?.mealVoucherDays || "20");
  const [employerShare, setEmployerShare] = useState<string>(initialData?.employerShare || "50");
  const [benefitsInKind, setBenefitsInKind] = useState<string>(initialData?.benefitsInKind || "0");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ grossAnnual, status, is13thMonth, mealVoucherValue, mealVoucherDays, employerShare, benefitsInKind });
  }, [grossAnnual, status, is13thMonth, mealVoucherValue, mealVoucherDays, employerShare, benefitsInKind, onStateChange]);

  const results = useMemo(() => {
    const gross = parseFloat(grossAnnual) || 0;
    const benefits = parseFloat(benefitsInKind) || 0;
    const mvValue = parseFloat(mealVoucherValue) || 0;
    const mvDays = parseFloat(mealVoucherDays) || 0;
    const mvShare = parseFloat(employerShare) || 0;

    const rates = {
      "non-cadre": 0.22,
      cadre: 0.25,
    };

    const chargeRate = rates[status];
    const netAnnualBeforeTax = gross * (1 - chargeRate);

    // Simplified French Income Tax calculation (progressive)
    const taxableIncome = (netAnnualBeforeTax + (benefits * 12)) * 0.9;
    let tax = 0;
    const brackets = [
      { limit: 11294, rate: 0 },
      { limit: 28797, rate: 0.11 },
      { limit: 82341, rate: 0.30 },
      { limit: 177106, rate: 0.41 },
      { limit: Infinity, rate: 0.45 },
    ];

    let previousLimit = 0;
    for (const bracket of brackets) {
      if (taxableIncome > previousLimit) {
        const taxableInBracket = Math.min(taxableIncome, bracket.limit) - previousLimit;
        tax += taxableInBracket * bracket.rate;
        previousLimit = bracket.limit;
      } else {
        break;
      }
    }

    const mealVoucherEmployeeShareMonthly = mvValue * (1 - mvShare / 100) * mvDays;
    const netAnnualAfterTax = netAnnualBeforeTax - tax - (mealVoucherEmployeeShareMonthly * 12);

    const months = is13thMonth ? 13 : 12;

    return {
      grossAnnual: gross,
      grossMonthly: gross / months,
      netAnnualBeforeTax,
      netMonthlyBeforeTax: netAnnualBeforeTax / months,
      netAnnualAfterTax,
      netMonthlyAfterTax: netAnnualAfterTax / months,
      chargesAnnual: gross - netAnnualBeforeTax,
      chargesMonthly: (gross - netAnnualBeforeTax) / months,
      taxAnnual: tax,
      taxMonthly: tax / months,
      mealVoucherDeduction: mealVoucherEmployeeShareMonthly,
      benefitsInKind: benefits,
    };
  }, [grossAnnual, status, is13thMonth, mealVoucherValue, mealVoucherDays, employerShare, benefitsInKind]);

  const handleClear = useCallback(() => {
    setGrossAnnual("");
    setMealVoucherValue("0");
    setBenefitsInKind("0");
    toast.success(t("salary.reset_success"));
    setTimeout(() => {
      grossSalaryInputRef.current?.focus();
    }, 50);
  }, [t]);

  const handleCopy = useCallback(() => {
    const text = `${t("salary.gross_monthly")} : ${results.grossAnnual.toFixed(2)}€ / an (${results.grossMonthly.toFixed(2)}€/mois)
${t("salary.net_after_tax")} : ${results.netAnnualAfterTax.toFixed(2)}€ / an (${results.netMonthlyAfterTax.toFixed(2)}€/mois)`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(t("salary.copied_success"));
    setTimeout(() => setCopied(false), 2000);
  }, [results, t]);

  // Safe global/local keyboard listener using useRef safeguard to avoid stale closures
  const handlersRef = useRef({ handleClear, handleCopy });
  useEffect(() => {
    handlersRef.current = { handleClear, handleCopy };
  }, [handleClear, handleCopy]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
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

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="space-y-6">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="gross-salary" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 cursor-pointer">
              <Banknote className="w-3 h-3" aria-hidden="true" /> {t("salary.gross_annual")}
            </label>
            <div className="flex items-center gap-2">
              <Kbd modifier={null} className="text-slate-400">Esc</Kbd>
              <button
                onClick={handleClear}
                disabled={!grossAnnual && mealVoucherValue === "0" && benefitsInKind === "0"}
                className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
                aria-label={t("common.reset")}
              >
                <RotateCcw className="w-3 h-3" aria-hidden="true" /> {t("common.reset")}
              </button>
            </div>
          </div>
          <div className="relative">
            <input
              id="gross-salary"
              ref={grossSalaryInputRef}
              type="number"
              value={grossAnnual}
              onChange={(e) => setGrossAnnual(e.target.value)}
              className="w-full p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl text-3xl md:text-4xl font-black font-mono outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white focus-visible:ring-indigo-500"
              placeholder="35000"
            />
            <span className="absolute right-6 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-300" aria-hidden="true">€</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <span id="salary-status-group" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-2">
                <Briefcase className="w-3 h-3" aria-hidden="true" /> {t("salary.status")}
              </span>
              <div role="radiogroup" aria-labelledby="salary-status-group" className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  type="button"
                  role="radio"
                  aria-checked={status === "non-cadre"}
                  onClick={() => setStatus("non-cadre")}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${status === "non-cadre" ? "bg-white dark:bg-slate-700 text-indigo-600 shadow-sm" : "text-slate-500"}`}
                >
                  {t("salary.status_non_cadre")}
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={status === "cadre"}
                  onClick={() => setStatus("cadre")}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${status === "cadre" ? "bg-white dark:bg-slate-700 text-indigo-600 shadow-sm" : "text-slate-500"}`}
                >
                  {t("salary.status_cadre")}
                </button>
              </div>
            </div>
            <div className="space-y-3">
              <span id="salary-period-group" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-2">
                <Calculator className="w-3 h-3" aria-hidden="true" /> {t("salary.period")}
              </span>
              <div role="radiogroup" aria-labelledby="salary-period-group" className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  type="button"
                  role="radio"
                  aria-checked={!is13thMonth}
                  onClick={() => setIs13thMonth(false)}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${!is13thMonth ? "bg-white dark:bg-slate-700 text-indigo-600 shadow-sm" : "text-slate-500"}`}
                >
                  {t("salary.period_12")}
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={is13thMonth}
                  onClick={() => setIs13thMonth(true)}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${is13thMonth ? "bg-white dark:bg-slate-700 text-indigo-600 shadow-sm" : "text-slate-500"}`}
                >
                  {t("salary.period_13")}
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">{t("salary.benefits_fees")}</h4>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="meal-vouchers" className="text-[10px] font-bold text-slate-500 uppercase px-1 cursor-pointer">{t("salary.meal_vouchers")}</label>
                <div className="relative">
                  <input
                    id="meal-vouchers"
                    type="number"
                    value={mealVoucherValue}
                    onChange={(e) => setMealVoucherValue(e.target.value)}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold outline-none focus:border-indigo-500 transition-colors dark:text-white focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
                    placeholder="9.50"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-300" aria-hidden="true">€</span>
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="benefits" className="text-[10px] font-bold text-slate-500 uppercase px-1 cursor-pointer">{t("salary.benefits_in_kind")}</label>
                <div className="relative">
                  <input
                    id="benefits"
                    type="number"
                    value={benefitsInKind}
                    onChange={(e) => setBenefitsInKind(e.target.value)}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold outline-none focus:border-indigo-500 transition-colors dark:text-white focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
                    placeholder="0"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-300" aria-hidden="true">€</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/20 p-6 rounded-3xl flex items-start gap-4">
            <div className="p-2 bg-white dark:bg-slate-800 text-amber-600 rounded-xl shadow-sm shrink-0">
              <Info className="w-5 h-5" aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <h5 className="text-xs font-black uppercase tracking-wider text-amber-800 dark:text-amber-500">{t("salary.disclaimer_title")}</h5>
              <p className="text-sm text-amber-800 dark:text-amber-400 font-medium leading-relaxed">
                {t("salary.disclaimer_desc")}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 dark:bg-black p-8 md:p-10 rounded-[2.5rem] shadow-xl shadow-indigo-500/10 flex flex-col items-center justify-center space-y-4 min-h-[300px] relative overflow-hidden group">
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
                aria-label={t("salary.copy_all")}
                title={t("salary.copy_all")}
              >
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
             </div>

             <div className="text-slate-400 font-bold uppercase tracking-widest text-xs text-center">{t("salary.net_after_tax_monthly")}</div>
             <div className="text-5xl md:text-6xl font-black text-white font-mono tracking-tighter" aria-live="polite" aria-atomic="true">
               {results.netMonthlyAfterTax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
             </div>
             <div className="text-indigo-400 font-black text-xl md:text-2xl uppercase tracking-widest">
               {t("salary.monthly_unit")}
             </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
             <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="text-xs font-black uppercase tracking-widest text-slate-400 flex justify-between">
                  <span>{t("salary.monthly_detail")}</span>
                  <span className="text-indigo-500">{t("salary.estimations")}</span>
                </div>
                <div className="space-y-3">
                   <div className="flex justify-between items-center gap-2">
                      <span className="text-sm text-slate-500 flex items-center gap-1"><TrendingUp className="w-3 h-3" aria-hidden="true" /> {t("salary.gross_monthly")}</span>
                      <span className="font-bold font-mono">{results.grossMonthly.toFixed(2)}€</span>
                   </div>
                   <div className="flex justify-between items-center gap-2 text-rose-500">
                      <span className="text-sm flex items-center gap-1"><TrendingDown className="w-3 h-3" aria-hidden="true" /> {t("salary.contributions")}</span>
                      <span className="font-bold font-mono">-{results.chargesMonthly.toFixed(2)}€</span>
                   </div>
                   <div className="flex justify-between items-center gap-2 text-slate-900 dark:text-white border-t border-slate-100 dark:border-slate-800 pt-2 font-bold">
                      <span className="text-sm">{t("salary.net_before_tax")}</span>
                      <span className="font-mono">{results.netMonthlyBeforeTax.toFixed(2)}€</span>
                   </div>
                   <div className="flex justify-between items-center gap-2 text-amber-600">
                      <span className="text-sm flex items-center gap-1"><TrendingDown className="w-3 h-3" aria-hidden="true" /> {t("salary.estimated_tax")}</span>
                      <span className="font-bold font-mono">-{results.taxMonthly.toFixed(2)}€</span>
                   </div>
                   {results.mealVoucherDeduction > 0 && (
                     <div className="flex justify-between items-center gap-2 text-rose-500">
                        <span className="text-sm flex items-center gap-1"><TrendingDown className="w-3 h-3" aria-hidden="true" /> {t("salary.meal_voucher_share")}</span>
                        <span className="font-bold font-mono">-{results.mealVoucherDeduction.toFixed(2)}€</span>
                     </div>
                   )}
                   <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center gap-2 text-emerald-500">
                      <span className="font-bold text-sm uppercase tracking-wider">{t("salary.net_after_tax")}</span>
                      <span className="font-black font-mono text-xl text-right">{results.netMonthlyAfterTax.toFixed(2)}€</span>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Educational Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-600">
            <BookOpen className="w-6 h-6" aria-hidden="true" />
          </div>
          <h3 className="text-lg font-black">Brut vs Net</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Le salaire brut est le montant avant toute déduction. Le salaire net est ce que vous recevez réellement après le paiement des cotisations sociales.
          </p>
          <ul className="space-y-2">
            {['Sécurité sociale', 'Retraite', 'Chômage'].map(item => (
              <li key={item} className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300">
                <ChevronRight className="w-4 h-4 text-indigo-500" aria-hidden="true" /> {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-4">
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center text-amber-600">
            <Calculator className="w-6 h-6" aria-hidden="true" />
          </div>
          <h3 className="text-lg font-black">Impôt sur le Revenu</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Depuis 2019, l'impôt est prélevé à la source. Notre calculateur estime ce montant en utilisant le barème progressif de l'impôt sur le revenu français.
          </p>
        </div>

        <div className="space-y-4">
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center text-emerald-600">
            <HelpCircle className="w-6 h-6" aria-hidden="true" />
          </div>
          <h3 className="text-lg font-black">Cadre ou Non-Cadre ?</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Le statut cadre implique généralement des cotisations sociales plus élevées (environ 25%) contre 22% pour les non-cadres, principalement pour la retraite complémentaire.
          </p>
        </div>
      </div>

      <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800">
        <h4 className="font-black mb-4">{t("salary.faq_title")}</h4>
        <div className="space-y-6">
          <div>
            <h5 className="font-bold text-sm mb-2">{t("salary.faq_q1")}</h5>
            <p className="text-sm text-slate-500 dark:text-slate-400">{t("salary.faq_a1")}</p>
          </div>
          <div>
            <h5 className="font-bold text-sm mb-2">{t("salary.faq_q2")}</h5>
            <p className="text-sm text-slate-500 dark:text-slate-400">{t("salary.faq_a2")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
