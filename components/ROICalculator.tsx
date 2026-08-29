import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { TrendingUp, Calendar, Info, LineChart, Target, Trash2, Copy, Check, Download, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Kbd } from "./ui/Kbd";

export function ROICalculator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const initialInvestmentRef = useRef<HTMLInputElement>(null);

  const [initialInvestment, setInitialInvestment] = useState<string>(initialData?.initialInvestment || "");
  const [finalValue, setFinalValue] = useState<string>(initialData?.finalValue || "");
  const [duration, setDuration] = useState<string>(initialData?.duration || "");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ initialInvestment, finalValue, duration });
  }, [initialInvestment, finalValue, duration, onStateChange]);

  const stats = useMemo(() => {
    const initial = parseFloat(initialInvestment) || 0;
    const final = parseFloat(finalValue) || 0;
    const years = parseFloat(duration) || 0;

    const gain = final - initial;
    const roi = initial > 0 ? ((final - initial) / initial) * 100 : 0;
    const annualizedROI = initial > 0 && years > 0
      ? (Math.pow(final / initial, 1 / years) - 1) * 100
      : 0;
    const multiplier = initial > 0 ? final / initial : 0;

    return { initial, final, years, gain, roi, annualizedROI, multiplier };
  }, [initialInvestment, finalValue, duration]);

  const handleClear = useCallback(() => {
    setInitialInvestment("");
    setFinalValue("");
    setDuration("");
    initialInvestmentRef.current?.focus();
    toast.success(t("roi.cleared_toast"));
  }, [t]);

  const handleCopy = useCallback(() => {
    if (stats.roi === 0 && stats.gain === 0) return;
    const text = `ROI : ${stats.roi.toFixed(2)}% | Gain : ${stats.gain.toFixed(2)}€ | Multiplier : x${stats.multiplier.toFixed(2)}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(t("roi.copied_toast"));
    setTimeout(() => setCopied(false), 2000);
  }, [stats, t]);

  const handleDownload = useCallback(() => {
    if (stats.roi === 0 && stats.gain === 0) return;
    const content = `${t("roi.parameters")} :
- ${t("roi.initial_investment")} : ${stats.initial.toFixed(2)} €
- ${t("roi.final_value")} : ${stats.final.toFixed(2)} €
- ${t("roi.duration")} : ${stats.years} ${t("roi.years_suffix")}
-----------------------------------
- Gain / Loss : ${stats.gain.toFixed(2)} €
- ${t("roi.total_roi")} : ${stats.roi.toFixed(2)} %
- ${t("roi.annualized")} : ${stats.annualizedROI.toFixed(2)} %
- ${t("roi.multiplier")} : x${stats.multiplier.toFixed(2)}`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rapport-roi-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(t("roi.downloaded_toast"));
  }, [stats, t]);

  const handlersRef = useRef({ handleClear, handleCopy });
  useEffect(() => {
    handlersRef.current = { handleClear, handleCopy };
  }, [handleClear, handleCopy]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInside = containerRef.current?.contains(activeElement) || activeElement === document.body;
      if (!isInside) return;

      const isEditable = activeElement && (
        activeElement.tagName === "INPUT" ||
        activeElement.tagName === "TEXTAREA" ||
        activeElement.getAttribute("contenteditable") === "true"
      );

      if (e.key === "Escape") {
        e.preventDefault();
        handlersRef.current.handleClear();
      } else if ((e.key === "c" || e.key === "C") && !isEditable && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        handlersRef.current.handleCopy();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div ref={containerRef} className="max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center px-1">
        <div className="flex items-center gap-2">
          <Kbd modifier={null}>Esc</Kbd>
          <span className="text-xs text-slate-400 dark:text-slate-500">{t("common.reset")}</span>
          <span className="text-slate-300 dark:text-slate-700 mx-1">•</span>
          <Kbd modifier={null}>C</Kbd>
          <span className="text-xs text-slate-400 dark:text-slate-500">{t("common.copy")}</span>
        </div>
        <button
          onClick={handleClear}
          disabled={!initialInvestment && !finalValue && !duration}
          className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
          aria-label={t("roi.clear")}
        >
          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{t("roi.clear")}</span>
          <Kbd modifier={null} className="ml-1 text-[10px] bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-300 border-rose-200 dark:border-rose-800">Esc</Kbd>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="flex justify-between items-center px-1">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Target className="w-3.5 h-3.5 text-indigo-500" aria-hidden="true" />
              <span>{t("roi.parameters")}</span>
            </label>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                disabled={!initialInvestment || !finalValue}
                className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
                aria-label={t("roi.download")}
              >
                <Download className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{t("roi.download")}</span>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="initialInvestment" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 cursor-pointer">
                {t("roi.initial_investment")}
              </label>
              <div className="relative">
                <input
                  id="initialInvestment"
                  ref={initialInvestmentRef}
                  type="number"
                  value={initialInvestment}
                  onChange={(e) => setInitialInvestment(e.target.value)}
                  className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xl font-black font-mono focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all dark:text-white"
                  placeholder="10000"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-slate-300 pointer-events-none" aria-hidden="true">€</span>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="finalValue" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 cursor-pointer">
                {t("roi.final_value")}
              </label>
              <div className="relative">
                <input
                  id="finalValue"
                  type="number"
                  value={finalValue}
                  onChange={(e) => setFinalValue(e.target.value)}
                  className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xl font-black font-mono focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all dark:text-white"
                  placeholder="15000"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-slate-300 pointer-events-none" aria-hidden="true">€</span>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="duration" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 cursor-pointer">
                {t("roi.duration")}
              </label>
              <div className="relative">
                <input
                  id="duration"
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xl font-black font-mono focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all dark:text-white"
                  placeholder="5"
                  step="0.5"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-slate-300 pointer-events-none" aria-hidden="true">{t("roi.years_suffix")}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="bg-slate-900 dark:bg-black p-10 rounded-[2.5rem] text-center flex flex-col items-center justify-center space-y-4 shadow-xl shadow-indigo-500/10 relative group overflow-hidden" aria-live="polite">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none" aria-hidden="true"></div>

            <button
              onClick={handleCopy}
              disabled={stats.roi === 0 && stats.gain === 0}
              className={`absolute top-6 right-6 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border z-20 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                copied
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                  : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
              } disabled:opacity-0`}
              aria-label={t("roi.copy_summary")}
            >
              {copied ? <Check className="w-3.5 h-3.5" aria-hidden="true" /> : <Copy className="w-3.5 h-3.5" aria-hidden="true" />}
              <span>{copied ? t("common.copied") : t("roi.copy_summary")}</span>
              <Kbd modifier={null} className="ml-1 text-[10px] bg-slate-700 text-slate-300 border-slate-600">C</Kbd>
            </button>

            <div className="text-slate-400 font-bold uppercase tracking-widest text-xs">{t("roi.total_roi")}</div>
            <div className={`text-6xl md:text-7xl font-black font-mono tracking-tighter ${stats.gain >= 0 ? 'text-white' : 'text-rose-500'}`}>
              {stats.roi >= 0 ? "+" : ""}{stats.roi.toFixed(2)}%
            </div>
            <div className={`flex items-center gap-2 px-6 py-2 rounded-full font-black text-sm uppercase tracking-widest ${stats.gain >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
              {stats.gain >= 0 ? <ArrowUpRight className="w-4 h-4" aria-hidden="true" /> : <ArrowDownRight className="w-4 h-4" aria-hidden="true" />}
              <span>{stats.gain.toLocaleString(undefined, { minimumFractionDigits: 2 })}€</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4" aria-live="polite">
            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-1 text-center">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-center gap-1">
                <LineChart className="w-3 h-3 text-indigo-500" aria-hidden="true" />
                <span>{t("roi.annualized")}</span>
              </div>
              <div className="text-xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
                {stats.annualizedROI.toFixed(2)}%
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-1 text-center">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-center gap-1">
                <TrendingUp className="w-3 h-3 text-indigo-500" aria-hidden="true" />
                <span>{t("roi.multiplier")}</span>
              </div>
              <div className="text-xl font-black text-slate-900 dark:text-white font-mono">
                x{stats.multiplier.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-8 shadow-sm">
        <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-3xl shrink-0">
          <Info className="w-8 h-8" aria-hidden="true" />
        </div>
        <div className="space-y-2 text-center md:text-left">
          <h4 className="font-black text-slate-900 dark:text-white">{t("roi.how_to_interpret")}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t("roi.interpretation_text")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-12 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <div className="w-12 h-12 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center text-slate-400 border border-slate-100 dark:border-slate-800">
            <Target className="w-6 h-6 text-indigo-500" aria-hidden="true" />
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white">{t("roi.formula_total_title")}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-mono bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
            ((Valeur Finale - Investissement) / Investissement) × 100
          </p>
        </div>
        <div className="space-y-4">
          <div className="w-12 h-12 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center text-slate-400 border border-slate-100 dark:border-slate-800">
            <Calendar className="w-6 h-6 text-indigo-500" aria-hidden="true" />
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white">{t("roi.formula_annualized_title")}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-mono bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
            ((Valeur Finale / Investissement)^(1 / années) - 1) × 100
          </p>
        </div>
      </div>
    </div>
  );
}
