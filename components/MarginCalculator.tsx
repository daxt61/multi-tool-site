import React, { useState, useEffect, useRef, useCallback } from "react";
import { TrendingUp, Info, DollarSign, Percent, Calculator as CalcIcon, Trash2, Copy, Check, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Kbd } from "./ui/Kbd";

interface Preset {
  id: string;
  nameKey: string;
  cost: string;
  selling: string;
  margin: string;
  markup: string;
}

const PRESETS: Preset[] = [
  {
    id: "retail_product",
    nameKey: "margin.preset_retail",
    cost: "50.00",
    selling: "100.00",
    margin: "50.00",
    markup: "100.00",
  },
  {
    id: "saas_sub",
    nameKey: "margin.preset_saas",
    cost: "20.00",
    selling: "100.00",
    margin: "80.00",
    markup: "400.00",
  },
  {
    id: "wholesale_goods",
    nameKey: "margin.preset_wholesale",
    cost: "80.00",
    selling: "100.00",
    margin: "20.00",
    markup: "25.00",
  },
  {
    id: "high_volume",
    nameKey: "margin.preset_high_volume",
    cost: "90.00",
    selling: "100.00",
    margin: "10.00",
    markup: "11.11",
  },
];

export function MarginCalculator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const costPriceInputRef = useRef<HTMLInputElement>(null);

  const [costPrice, setCostPrice] = useState<string>(initialData?.costPrice || "");
  const [sellingPrice, setSellingPrice] = useState<string>(initialData?.sellingPrice || "");
  const [marginPercent, setMarginPercent] = useState<string>(initialData?.marginPercent || "");
  const [markupPercent, setMarkupPercent] = useState<string>(initialData?.markupPercent || "");
  const [activePresetId, setActivePresetId] = useState<string | null>(initialData?.activePresetId || null);
  const [copiedSummary, setCopiedSummary] = useState(false);

  useEffect(() => {
    onStateChange?.({ costPrice, sellingPrice, marginPercent, markupPercent, activePresetId });
  }, [costPrice, sellingPrice, marginPercent, markupPercent, activePresetId, onStateChange]);

  const handleClear = useCallback(() => {
    setCostPrice("");
    setSellingPrice("");
    setMarginPercent("");
    setMarkupPercent("");
    setActivePresetId(null);
    costPriceInputRef.current?.focus();
    toast.success(t("margin.cleared_toast", "Calculator reset"));
  }, [t]);

  const calculateFromCostAndSelling = () => {
    const cost = parseFloat(costPrice);
    const selling = parseFloat(sellingPrice);
    if (!isNaN(cost) && !isNaN(selling) && selling > 0) {
      const margin = ((selling - cost) / selling) * 100;
      const markup = cost !== 0 ? ((selling - cost) / cost) * 100 : 0;
      setMarginPercent(margin.toFixed(2));
      setMarkupPercent(markup.toFixed(2));
    }
  };

  const calculateFromCostAndMargin = () => {
    const cost = parseFloat(costPrice);
    const margin = parseFloat(marginPercent);
    if (!isNaN(cost) && !isNaN(margin) && margin < 100) {
      const selling = cost / (1 - margin / 100);
      const markup = ((selling - cost) / cost) * 100;
      setSellingPrice(selling.toFixed(2));
      setMarkupPercent(markup.toFixed(2));
    }
  };

  const calculateFromCostAndMarkup = () => {
    const cost = parseFloat(costPrice);
    const markup = parseFloat(markupPercent);
    if (!isNaN(cost) && !isNaN(markup)) {
      const selling = cost * (1 + markup / 100);
      const margin = ((selling - cost) / selling) * 100;
      setSellingPrice(selling.toFixed(2));
      setMarginPercent(margin.toFixed(2));
    }
  };

  const loadPreset = (preset: Preset) => {
    setCostPrice(preset.cost);
    setSellingPrice(preset.selling);
    setMarginPercent(preset.margin);
    setMarkupPercent(preset.markup);
    setActivePresetId(preset.id);
    toast.success(t("margin.preset_loaded", { name: t(preset.nameKey), defaultValue: `Loaded preset: ${t(preset.nameKey)}` }));
  };

  const profit = parseFloat(sellingPrice) - parseFloat(costPrice) || 0;

  const handleCopySummary = useCallback(() => {
    const summary = `${t("margin.cost_price", "Cost Price")}: ${costPrice || "0.00"}€\n` +
      `${t("margin.selling_price", "Selling Price")}: ${sellingPrice || "0.00"}€\n` +
      `${t("margin.margin_percent", "Margin")}: ${marginPercent || "0.00"}%\n` +
      `${t("margin.markup_percent", "Markup")}: ${markupPercent || "0.00"}%\n` +
      `${t("margin.profit_per_unit", "Profit per unit")}: ${profit.toFixed(2)}€ (${profit >= 0 ? t("margin.profit", "Profit") : t("margin.loss", "Loss")})`;

    navigator.clipboard.writeText(summary);
    setCopiedSummary(true);
    toast.success(t("margin.copied_toast", "Summary copied to clipboard"));
    setTimeout(() => setCopiedSummary(false), 2000);
  }, [costPrice, sellingPrice, marginPercent, markupPercent, profit, t]);

  const handlersRef = useRef({ handleClear, handleCopySummary });
  useEffect(() => {
    handlersRef.current = { handleClear, handleCopySummary };
  }, [handleClear, handleCopySummary]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!containerRef.current || !containerRef.current.contains(e.target as Node)) {
        return;
      }

      const target = e.target as HTMLElement | null;
      const isEditable = target && (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      );

      if (e.key === "Escape") {
        e.preventDefault();
        handlersRef.current.handleClear();
      } else if ((e.key === "c" || e.key === "C") && !isEditable && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        handlersRef.current.handleCopySummary();
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
            {t("margin.presets_title", "Quick Start Presets:")}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              aria-pressed={activePresetId === preset.id}
              onClick={() => loadPreset(preset)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                activePresetId === preset.id
                  ? "bg-indigo-600 text-white dark:bg-indigo-500 border border-indigo-600"
                  : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500"
              }`}
            >
              {t(preset.nameKey, preset.id)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-between items-center px-1">
        <div className="flex items-center gap-2">
          <Kbd modifier={null}>Esc</Kbd>
          <span className="text-xs text-slate-400 dark:text-slate-500">{t("common.reset", "Reset")}</span>
          <span className="text-slate-300 dark:text-slate-700 mx-1">•</span>
          <Kbd modifier={null}>C</Kbd>
          <span className="text-xs text-slate-400 dark:text-slate-500">{t("common.copy", "Copy")}</span>
        </div>
        <button
          type="button"
          onClick={handleClear}
          disabled={!costPrice && !sellingPrice && !marginPercent && !markupPercent}
          className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
          aria-label={t("margin.clear", "Reset Calculator")}
        >
          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{t("margin.clear", "Reset")}</span>
          <Kbd modifier={null} className="ml-1 text-[10px] bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-300 border-rose-200 dark:border-rose-800">Esc</Kbd>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-3">
              <label htmlFor="cost-price" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-2 cursor-pointer">
                <DollarSign className="w-3 h-3 text-indigo-500" aria-hidden="true" />
                <span>{t("margin.cost_price", "Cost Price (€)")}</span>
              </label>
              <input
                id="cost-price"
                ref={costPriceInputRef}
                type="number"
                value={costPrice}
                onChange={(e) => {
                  setCostPrice(e.target.value);
                  setActivePresetId(null);
                  if (!e.target.value) {
                    setMarginPercent("");
                    setMarkupPercent("");
                  }
                }}
                className="w-full p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-2xl font-black font-mono focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all dark:text-white"
                placeholder="0.00"
              />
            </div>
            <div className="space-y-3">
              <label htmlFor="selling-price" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-2 cursor-pointer">
                <TrendingUp className="w-3 h-3 text-indigo-500" aria-hidden="true" />
                <span>{t("margin.selling_price", "Selling Price (€)")}</span>
              </label>
              <input
                id="selling-price"
                type="number"
                value={sellingPrice}
                onChange={(e) => {
                  setSellingPrice(e.target.value);
                  setActivePresetId(null);
                  if (!e.target.value) {
                    setMarginPercent("");
                    setMarkupPercent("");
                  }
                }}
                className="w-full p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-2xl font-black font-mono focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all dark:text-white"
                placeholder="0.00"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={calculateFromCostAndSelling}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
          >
            <CalcIcon className="w-5 h-5" aria-hidden="true" />
            <span>{t("margin.calc_margin_markup", "Calculate Margin & Markup")}</span>
          </button>

          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-3">
              <label htmlFor="margin-percent" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-2 cursor-pointer">
                <Percent className="w-3 h-3 text-indigo-500" aria-hidden="true" />
                <span>{t("margin.margin_percent", "Margin (%)")}</span>
              </label>
              <div className="flex gap-2">
                <input
                  id="margin-percent"
                  type="number"
                  value={marginPercent}
                  onChange={(e) => {
                    setMarginPercent(e.target.value);
                    setActivePresetId(null);
                    if (!e.target.value) {
                      setSellingPrice("");
                      setMarkupPercent("");
                    }
                  }}
                  className="flex-1 p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-xl font-black font-mono focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all dark:text-white"
                  placeholder="0.00"
                />
                <button
                  type="button"
                  onClick={calculateFromCostAndMargin}
                  className="px-6 bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 rounded-2xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
                >
                  {t("margin.calculate", "Calculate")}
                </button>
              </div>
            </div>
            <div className="space-y-3">
              <label htmlFor="markup-percent" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-2 cursor-pointer">
                <TrendingUp className="w-3 h-3 text-indigo-500" aria-hidden="true" />
                <span>{t("margin.markup_percent", "Markup (%)")}</span>
              </label>
              <div className="flex gap-2">
                <input
                  id="markup-percent"
                  type="number"
                  value={markupPercent}
                  onChange={(e) => {
                    setMarkupPercent(e.target.value);
                    setActivePresetId(null);
                    if (!e.target.value) {
                      setSellingPrice("");
                      setMarginPercent("");
                    }
                  }}
                  className="flex-1 p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-xl font-black font-mono focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all dark:text-white"
                  placeholder="0.00"
                />
                <button
                  type="button"
                  onClick={calculateFromCostAndMarkup}
                  className="px-6 bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 rounded-2xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
                >
                  {t("margin.calculate", "Calculate")}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 dark:bg-black p-8 md:p-10 rounded-[2.5rem] shadow-xl shadow-indigo-500/10 flex flex-col items-center justify-center space-y-4 min-h-[300px] relative">
            <button
              type="button"
              onClick={handleCopySummary}
              className={`absolute top-6 right-6 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                copiedSummary
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                  : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
              }`}
              aria-label={t("margin.copy_summary", "Copy Summary")}
            >
              {copiedSummary ? <Check className="w-3.5 h-3.5" aria-hidden="true" /> : <Copy className="w-3.5 h-3.5" aria-hidden="true" />}
              <span>{copiedSummary ? t("common.copied", "Copied") : t("margin.copy_summary", "Copy Summary")}</span>
              <Kbd modifier={null} className="ml-1 text-[10px] bg-slate-700 text-slate-300 border-slate-600">C</Kbd>
            </button>

            <div className="text-slate-400 font-bold uppercase tracking-widest text-xs">{t("margin.profit_per_unit", "Profit per unit")}</div>
            <div className={`text-6xl font-black font-mono tracking-tighter ${profit >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {profit.toFixed(2)}€
            </div>
            <div className={`${profit >= 0 ? "text-emerald-500/50" : "text-rose-500/50"} font-black text-2xl uppercase tracking-widest`}>
              {profit >= 0 ? t("margin.profit", "Profit") : t("margin.loss", "Loss")}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-[2rem] space-y-4">
            <div className="flex items-center gap-2 text-indigo-500 mb-2">
              <Info className="w-5 h-5" aria-hidden="true" />
              <span className="font-bold text-sm uppercase tracking-wider">{t("margin.formulas", "Formulas")}</span>
            </div>
            <div className="space-y-4 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                <p className="font-bold text-slate-900 dark:text-white mb-1">{t("margin.formula_margin_title", "Margin Formula")}</p>
                <code className="text-indigo-600 dark:text-indigo-400">{t("margin.formula_margin", "Margin % = ((Selling Price - Cost Price) / Selling Price) × 100")}</code>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                <p className="font-bold text-slate-900 dark:text-white mb-1">{t("margin.formula_markup_title", "Markup Formula")}</p>
                <code className="text-indigo-600 dark:text-indigo-400">{t("margin.formula_markup", "Markup % = ((Selling Price - Cost Price) / Cost Price) × 100")}</code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
