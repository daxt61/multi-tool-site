import { useState, useEffect, useCallback, useRef } from "react";
import { Info, Trash2, Copy, Check, BadgeEuro, Sparkles, RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Kbd } from "./ui/Kbd";

export function VATCalculator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const amountInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [amount, setAmount] = useState<string>(initialData?.amount || "");
  const [vatRate, setVatRate] = useState<string>(initialData?.vatRate || "20");
  const [mode, setMode] = useState<"ht-to-ttc" | "ttc-to-ht">(initialData?.mode || "ht-to-ttc");
  const [activePresetId, setActivePresetId] = useState<string | null>(initialData?.activePresetId || null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ amount, vatRate, mode, activePresetId });
  }, [amount, vatRate, mode, activePresetId, onStateChange]);

  const amountValue = parseFloat(amount) || 0;
  const rateValue = parseFloat(vatRate) || 0;

  let ht: number, tva: number, ttc: number;

  if (mode === "ht-to-ttc") {
    ht = amountValue;
    tva = ht * (rateValue / 100);
    ttc = ht + tva;
  } else {
    ttc = amountValue;
    ht = ttc / (1 + rateValue / 100);
    tva = ttc - ht;
  }

  const commonRates = [
    { label: t("vat.rate_normal", "20% (Normal)"), value: "20" },
    { label: t("vat.rate_inter", "10% (Inter)"), value: "10" },
    { label: t("vat.rate_reduced", "5.5% (Réduit)"), value: "5.5" },
    { label: t("vat.rate_super", "2.1% (Super)"), value: "2.1" },
  ];

  const PRESETS = [
    { id: "sale", name: t("vat.preset_sale", "Standard Business Sale"), amount: "100.00", rate: "20", mode: "ht-to-ttc" as const },
    { id: "food", name: t("vat.preset_food", "Catering / Food"), amount: "45.00", rate: "10", mode: "ht-to-ttc" as const },
    { id: "press", name: t("vat.preset_press", "Press / Book Sale"), amount: "25.00", rate: "5.5", mode: "ht-to-ttc" as const },
    { id: "medical", name: t("vat.preset_medical", "Medical / Super Reduced"), amount: "150.00", rate: "2.1", mode: "ht-to-ttc" as const },
  ];

  const applyPreset = (preset: typeof PRESETS[number]) => {
    setAmount(preset.amount);
    setVatRate(preset.rate);
    setMode(preset.mode);
    setActivePresetId(preset.id);
    toast.success(t("vat.toast_preset_loaded", "VAT preset applied!"));
  };

  const handleClear = useCallback(() => {
    setAmount("");
    setActivePresetId(null);
    toast.success(t("vat.toast_cleared", "Cleared amount!"));
    setTimeout(() => amountInputRef.current?.focus(), 0);
  }, [t]);

  const handleCopy = useCallback(() => {
    if (!amount) return;
    const text = `Montant HT: ${ht.toFixed(2)}€ | TVA (${vatRate}%): ${tva.toFixed(2)}€ | Montant TTC: ${ttc.toFixed(2)}€`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(t("vat.toast_copied", "VAT calculation summary copied to clipboard!"));
    setTimeout(() => setCopied(false), 2000);
  }, [amount, ht, vatRate, tva, ttc, t]);

  const handlersRef = useRef({ handleClear, handleCopy, amount });
  useEffect(() => {
    handlersRef.current = { handleClear, handleCopy, amount };
  }, [handleClear, handleCopy, amount]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!containerRef.current?.contains(document.activeElement)) return;

      const activeElement = document.activeElement;
      const isEditable =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement instanceof HTMLSelectElement ||
        activeElement?.getAttribute("contenteditable") === "true";

      if (isEditable && e.key !== 'Escape') return;

      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key === "Escape") {
        e.preventDefault();
        handlersRef.current.handleClear();
      } else if (e.key.toLowerCase() === "c") {
        if (handlersRef.current.amount) {
          e.preventDefault();
          handlersRef.current.handleCopy();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div ref={containerRef} className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Presets Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" aria-hidden="true" />
          <span className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t("vat.presets_title", "Quick Start Presets:")}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyPreset(preset)}
              aria-pressed={activePresetId === preset.id}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                activePresetId === preset.id
                  ? "bg-indigo-600 text-white shadow-indigo-500/20"
                  : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-indigo-500"
              }`}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setMode("ht-to-ttc");
                setActivePresetId(null);
              }}
              aria-pressed={mode === "ht-to-ttc"}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                mode === "ht-to-ttc"
                  ? "bg-white dark:bg-slate-700 text-indigo-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {t("vat.mode_ht_ttc", "HT → TTC")}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("ttc-to-ht");
                setActivePresetId(null);
              }}
              aria-pressed={mode === "ttc-to-ht"}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                mode === "ttc-to-ht"
                  ? "bg-white dark:bg-slate-700 text-indigo-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {t("vat.mode_ttc_ht", "TTC → HT")}
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="amount" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t("vat.amount_label", "Montant")} {mode === "ht-to-ttc" ? "HT" : "TTC"}
              </label>
              <div className="flex items-center gap-2">
                <Kbd modifier={null} className="hidden sm:inline-flex border-rose-200 dark:border-rose-800 text-rose-400 dark:bg-slate-900">Esc</Kbd>
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={!amount}
                  className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
                >
                  <Trash2 className="w-3 h-3" aria-hidden="true" /> {t("common.clear", "Effacer")}
                </button>
              </div>
            </div>
            <div className="relative">
               <input
                id="amount"
                ref={amountInputRef}
                type="number"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setActivePresetId(null);
                }}
                className="w-full p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl text-4xl font-black font-mono outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
                placeholder="0.00"
                step="0.01"
              />
              <span className="absolute right-6 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-300">€</span>
            </div>
          </div>

          <div className="space-y-3">
             <label htmlFor="vatRate" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 cursor-pointer">
               {t("vat.rate_label", "Taux de TVA")}
             </label>
             <div className="grid grid-cols-2 gap-2">
                {commonRates.map((rate) => (
                  <button
                    key={rate.value}
                    type="button"
                    onClick={() => {
                      setVatRate(rate.value);
                      setActivePresetId(null);
                    }}
                    aria-pressed={vatRate === rate.value}
                    className={`py-3 rounded-xl font-bold text-sm transition-all border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                      vatRate === rate.value
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20"
                        : "bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-slate-300"
                    }`}
                  >
                    {rate.label}
                  </button>
                ))}
             </div>
             <div className="relative mt-2">
                <input
                  id="vatRate"
                  type="number"
                  value={vatRate}
                  onChange={(e) => {
                    setVatRate(e.target.value);
                    setActivePresetId(null);
                  }}
                  className="w-full p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl font-black font-mono outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
                  placeholder="20"
                  step="0.1"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-slate-400">%</span>
             </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 dark:bg-black p-10 rounded-[2.5rem] shadow-xl shadow-indigo-500/10 space-y-8 relative group">
             <button
                type="button"
                onClick={handleCopy}
                disabled={!amount}
                className={`absolute top-6 right-6 p-3 rounded-2xl transition-all border z-20 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none ${
                  copied
                    ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                    : "bg-white/10 text-white/40 border-transparent hover:text-white hover:bg-white/20 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
                } disabled:opacity-0`}
                title={t("vat.copy_summary", "Copier le résultat")}
              >
                {copied ? <Check className="w-5 h-5" aria-hidden="true" /> : <Copy className="w-5 h-5" aria-hidden="true" />}
              </button>

             <div className="text-center pb-4">
                <div className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-2">
                  {t("vat.ttc_label", "Montant TTC")}
                </div>
                <div className="text-6xl font-black text-white font-mono tracking-tighter">
                  {ttc.toFixed(2)}€
                </div>
             </div>

             <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800">
                <div className="text-center">
                   <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">
                     {t("vat.ht_label", "Montant HT")}
                   </div>
                   <div className="text-2xl font-black text-white font-mono">{ht.toFixed(2)}€</div>
                </div>
                <div className="text-center border-l border-slate-800">
                   <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">
                     {t("vat.tva_label", "TVA")} ({vatRate}%)
                   </div>
                   <div className="text-2xl font-black text-indigo-400 font-mono">{tva.toFixed(2)}€</div>
                </div>
             </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[2rem] flex items-start gap-4">
             <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                <Info className="w-6 h-6" aria-hidden="true" />
             </div>
             <div className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed space-y-2">
                <p className="font-bold text-slate-900 dark:text-white">{t("vat.info_title", "Taux en France :")}</p>
                <ul className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <li>{t("vat.info_normal", "Normal: 20%")}</li>
                  <li>{t("vat.info_inter", "Intermédiaire: 10%")}</li>
                  <li>{t("vat.info_reduced", "Réduit: 5.5%")}</li>
                  <li>{t("vat.info_super", "Super réduit: 2.1%")}</li>
                </ul>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
