import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { Clock, Banknote, Percent, TrendingUp, HelpCircle, BookOpen, Trash2, Copy, Check, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Kbd } from "./ui/Kbd";

interface Preset {
  id: string;
  nameKey: string;
  hourlyRate: string;
  hours25: string;
  hours50: string;
  taxRate: string;
}

const PRESETS: Preset[] = [
  { id: "standard", nameKey: "overtime.preset_standard", hourlyRate: "15", hours25: "5", hours50: "0", taxRate: "22" },
  { id: "crunch", nameKey: "overtime.preset_crunch", hourlyRate: "18", hours25: "8", hours50: "4", taxRate: "22" },
  { id: "max", nameKey: "overtime.preset_max", hourlyRate: "20", hours25: "8", hours50: "12", taxRate: "22" },
];

export function OvertimeCalculator() {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const hourlyRateInputRef = useRef<HTMLInputElement>(null);

  const [hourlyRate, setHourlyRate] = useState<string>("15");
  const [hours25, setHours25] = useState<string>("0");
  const [hours50, setHours50] = useState<string>("0");
  const [taxRate, setTaxRate] = useState<string>("22");
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const results = useMemo(() => {
    const rate = parseFloat(hourlyRate) || 0;
    const h25 = parseFloat(hours25) || 0;
    const h50 = parseFloat(hours50) || 0;
    const tr = parseFloat(taxRate) || 0;

    const gross25 = h25 * (rate * 1.25);
    const gross50 = h50 * (rate * 1.5);
    const totalGross = gross25 + gross50;

    const netRate = 1 - tr / 100;
    const totalNet = totalGross * (netRate + 0.11);

    return {
      gross25,
      gross50,
      totalGross,
      totalNet: Math.min(totalGross, totalNet),
      totalHours: h25 + h50,
    };
  }, [hourlyRate, hours25, hours50, taxRate]);

  const handleClear = useCallback(() => {
    setHours25("0");
    setHours50("0");
    setActivePresetId(null);
    toast.success(t("overtime.toast_cleared"));
    if (hourlyRateInputRef.current) {
      hourlyRateInputRef.current.focus();
    }
  }, [t]);

  const handleCopySummary = useCallback(() => {
    const summaryText = `${t("overtime.title")}:\n` +
      `- ${t("overtime.hourly_rate")}: ${hourlyRate}€/h\n` +
      `- ${t("overtime.hours_25")}: ${hours25}h (${results.gross25.toFixed(2)}€ ${t("overtime.gross")})\n` +
      `- ${t("overtime.hours_50")}: ${hours50}h (${results.gross50.toFixed(2)}€ ${t("overtime.gross")})\n` +
      `- ${t("overtime.total_hours")}: ${results.totalHours}h\n` +
      `- ${t("overtime.total_gross")}: ${results.totalGross.toFixed(2)}€\n` +
      `- ${t("overtime.estimated_net")}: ${results.totalNet.toFixed(2)}€`;

    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    toast.success(t("overtime.toast_copied"));
    setTimeout(() => setCopied(false), 2000);
  }, [t, hourlyRate, hours25, hours50, results]);

  const handleApplyPreset = useCallback((preset: Preset) => {
    setHourlyRate(preset.hourlyRate);
    setHours25(preset.hours25);
    setHours50(preset.hours50);
    setTaxRate(preset.taxRate);
    setActivePresetId(preset.id);
    toast.success(t("overtime.toast_preset_loaded", { name: t(preset.nameKey) }));
  }, [t]);

  const handlersRef = useRef({
    handleClear,
    handleCopySummary,
  });

  useEffect(() => {
    handlersRef.current = {
      handleClear,
      handleCopySummary,
    };
  }, [handleClear, handleCopySummary]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isContainerFocused =
        containerRef.current?.contains(activeElement) || activeElement === document.body;

      if (!isContainerFocused) return;

      const isInputFocused =
        activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement;

      if (e.key === "Escape") {
        e.preventDefault();
        handlersRef.current.handleClear();
      } else if ((e.key === "c" || e.key === "C") && !e.ctrlKey && !e.metaKey && !e.altKey && !isInputFocused) {
        e.preventDefault();
        handlersRef.current.handleCopySummary();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div ref={containerRef} className="max-w-4xl mx-auto space-y-8 focus:outline-none">
      {/* Quick Presets */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> {t("overtime.presets_title")}
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => {
            const isActive = activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                aria-pressed={isActive}
                onClick={() => handleApplyPreset(preset)}
                className={`px-3.5 py-2 text-xs font-bold rounded-2xl transition-all flex items-center gap-1.5 ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20 ring-2 ring-indigo-500/30"
                    : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/80"
                }`}
              >
                {t(preset.nameKey)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="hourly-rate" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Banknote className="w-3.5 h-3.5" /> {t("overtime.hourly_rate")}
            </label>
            <button
              type="button"
              onClick={handleClear}
              className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all focus-visible:ring-2 focus-visible:ring-rose-500"
            >
              <Trash2 className="w-3.5 h-3.5" /> {t("overtime.clear")}
              <Kbd modifier={null}>Esc</Kbd>
            </button>
          </div>
          <div className="relative">
            <input
              ref={hourlyRateInputRef}
              id="hourly-rate"
              type="number"
              value={hourlyRate}
              onChange={(e) => {
                setHourlyRate(e.target.value);
                setActivePresetId(null);
              }}
              className="w-full p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl text-3xl md:text-4xl font-black font-mono outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
              placeholder="15"
            />
            <span className="absolute right-6 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-300">€</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <label htmlFor="hours-25" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" /> {t("overtime.hours_25")}
              </label>
              <input
                id="hours-25"
                type="number"
                value={hours25}
                onChange={(e) => {
                  setHours25(e.target.value);
                  setActivePresetId(null);
                }}
                className="w-full p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
                placeholder="0"
              />
            </div>
            <div className="space-y-3">
              <label htmlFor="hours-50" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" /> {t("overtime.hours_50")}
              </label>
              <input
                id="hours-50"
                type="number"
                value={hours50}
                onChange={(e) => {
                  setHours50(e.target.value);
                  setActivePresetId(null);
                }}
                className="w-full p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
                placeholder="0"
              />
            </div>
          </div>

          <div className="space-y-3">
            <label htmlFor="tax-rate" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-2">
              <Percent className="w-3.5 h-3.5" /> {t("overtime.tax_rate")}
            </label>
            <input
              id="tax-rate"
              type="number"
              value={taxRate}
              onChange={(e) => {
                setTaxRate(e.target.value);
                setActivePresetId(null);
              }}
              className="w-full p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
              placeholder="22"
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 dark:bg-black p-8 md:p-10 rounded-[2.5rem] shadow-xl shadow-indigo-500/10 flex flex-col items-center justify-center space-y-4 min-h-[300px] relative overflow-hidden">
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl"></div>

            <div className="flex justify-between items-center w-full relative z-10">
              <div className="text-slate-400 font-bold uppercase tracking-widest text-xs">
                {t("overtime.estimated_net")}
              </div>
              <button
                type="button"
                onClick={handleCopySummary}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all focus-visible:ring-2 focus-visible:ring-indigo-400"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {t("overtime.copy_summary")}
                <Kbd modifier={null} className="bg-white/20 text-white border-white/30">C</Kbd>
              </button>
            </div>

            <div className="text-5xl md:text-7xl font-black text-white font-mono tracking-tighter relative z-10">
              {results.totalNet.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-indigo-400 font-black text-xl md:text-2xl uppercase tracking-widest text-center relative z-10">
              {t("overtime.euros_net")}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2 text-center">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t("overtime.total_gross")}</div>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                {results.totalGross.toFixed(2)}€
              </div>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20 p-6 rounded-3xl space-y-2 text-center">
              <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">{t("overtime.total_hours")}</div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {results.totalHours} {t("overtime.hours_suffix")}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[2rem] space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">{t("overtime.breakdown")}</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="text-slate-500">{t("overtime.hours_25_breakdown")}</span>
                <span className="font-mono dark:text-white">{results.gross25.toFixed(2)}€ {t("overtime.gross")}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="text-slate-500">{t("overtime.hours_50_breakdown")}</span>
                <span className="font-mono dark:text-white">{results.gross50.toFixed(2)}€ {t("overtime.gross")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Educational Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-600">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black">{t("overtime.edu_overtime_title")}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t("overtime.edu_overtime_text")}
          </p>
        </div>

        <div className="space-y-4">
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center text-emerald-600">
            <TrendingUp className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black">{t("overtime.edu_tax_title")}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t("overtime.edu_tax_text")}
          </p>
        </div>

        <div className="space-y-4">
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center text-amber-600">
            <HelpCircle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black">{t("overtime.edu_comp_title")}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t("overtime.edu_comp_text")}
          </p>
        </div>
      </div>
    </div>
  );
}
