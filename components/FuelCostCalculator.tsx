import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Fuel, Map, Droplets, Users, RotateCcw, Copy, Check, Download, Info, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Kbd } from "./ui/Kbd";

interface FuelPreset {
  id: string;
  labelKey: string;
  distance: string;
  consumption: string;
  fuelPrice: string;
  people: string;
}

const FUEL_PRESETS: FuelPreset[] = [
  { id: 'commute', labelKey: 'fuelcost.preset_commute', distance: '30', consumption: '6.0', fuelPrice: '1.85', people: '1' },
  { id: 'weekend', labelKey: 'fuelcost.preset_weekend', distance: '250', consumption: '6.5', fuelPrice: '1.85', people: '2' },
  { id: 'roadtrip', labelKey: 'fuelcost.preset_roadtrip', distance: '800', consumption: '7.2', fuelPrice: '1.90', people: '4' },
  { id: 'city_suv', labelKey: 'fuelcost.preset_city_suv', distance: '15', consumption: '9.0', fuelPrice: '1.85', people: '1' },
];

export function FuelCostCalculator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const distanceInputRef = useRef<HTMLInputElement>(null);

  const [distance, setDistance] = useState<string>(initialData?.distance || "");
  const [consumption, setConsumption] = useState<string>(initialData?.consumption || "");
  const [fuelPrice, setFuelPrice] = useState<string>(initialData?.fuelPrice || "");
  const [people, setPeople] = useState<string>(initialData?.people || "1");
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ distance, consumption, fuelPrice, people });
  }, [distance, consumption, fuelPrice, people, onStateChange]);

  const stats = useMemo(() => {
    const d = parseFloat(distance) || 0;
    const c = parseFloat(consumption) || 0;
    const p = parseFloat(fuelPrice) || 0;
    const n = parseFloat(people) || 1;

    const totalFuel = (d * c) / 100;
    const totalCost = totalFuel * p;
    const costPerPerson = n > 0 ? totalCost / n : totalCost;

    return { totalFuel, totalCost, costPerPerson, n, d, c, p };
  }, [distance, consumption, fuelPrice, people]);

  const handleApplyPreset = useCallback((preset: FuelPreset) => {
    setDistance(preset.distance);
    setConsumption(preset.consumption);
    setFuelPrice(preset.fuelPrice);
    setPeople(preset.people);
    setActivePresetId(preset.id);
    toast.success(t('fuelcost.preset_loaded', { name: t(preset.labelKey) }));
    setTimeout(() => distanceInputRef.current?.focus(), 0);
  }, [t]);

  const handleClear = useCallback(() => {
    setDistance("");
    setConsumption("");
    setFuelPrice("");
    setPeople("1");
    setActivePresetId(null);
    toast.success(t("fuelcost.cleared_toast"));
    setTimeout(() => distanceInputRef.current?.focus(), 0);
  }, [t]);

  const handleCopy = useCallback(() => {
    if (stats.totalCost === 0) return;
    const text = `${t("fuelcost.total_cost")} : ${stats.totalCost.toFixed(2)}€ | ${t("fuelcost.cost_per_person", { cost: stats.costPerPerson.toFixed(2) })} | ${t("fuelcost.total_fuel")} : ${stats.totalFuel.toFixed(2)}L`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(t("fuelcost.copied_toast"));
    setTimeout(() => setCopied(false), 2000);
  }, [stats, t]);

  const handleDownload = useCallback(() => {
    if (stats.totalCost === 0) return;
    const content = `${t("fuelcost.title")} :
- ${t("fuelcost.distance")} : ${distance} km
- ${t("fuelcost.consumption")} : ${consumption} L/100km
- ${t("fuelcost.fuel_price")} : ${fuelPrice} €/L
- ${t("fuelcost.passengers")} : ${people}
-----------------------------------
- ${t("fuelcost.total_fuel")} : ${stats.totalFuel.toFixed(2)} L
- ${t("fuelcost.total_cost")} : ${stats.totalCost.toFixed(2)} €
- ${t("fuelcost.cost_per_person", { cost: stats.costPerPerson.toFixed(2) })}`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rapport-carburant-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(t("fuelcost.downloaded_toast"));
  }, [distance, consumption, fuelPrice, people, stats, t]);

  // Safe global/local keyboard listener using handlersRef to avoid stale closures
  const handlersRef = useRef({ handleClear, handleCopy, stats });
  useEffect(() => {
    handlersRef.current = { handleClear, handleCopy, stats };
  }, [handleClear, handleCopy, stats]);

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
        return;
      }

      if (isEditable) return;

      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if ((e.key === "c" || e.key === "C") && handlersRef.current.stats.totalCost > 0) {
        e.preventDefault();
        handlersRef.current.handleCopy();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div ref={containerRef} className="max-w-4xl mx-auto space-y-8">
      {/* Quick Start Presets Bar */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 px-1">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" aria-hidden="true" />
          <span>{t('fuelcost.presets_title')}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {FUEL_PRESETS.map((preset) => {
            const isActive = activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => handleApplyPreset(preset)}
                aria-pressed={isActive}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border text-left flex flex-col gap-0.5 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                  isActive
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700'
                }`}
              >
                <span className="font-extrabold truncate">{t(preset.labelKey)}</span>
                <span className={`text-[10px] font-mono ${isActive ? 'text-indigo-100' : 'text-slate-400'}`}>
                  {preset.distance}km • {preset.consumption}L
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Parameters */}
        <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="flex justify-between items-center px-1">
             <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Fuel className="w-3.5 h-3.5 text-indigo-500" aria-hidden="true" />
                <span>{t("fuelcost.trip_parameters")}</span>
             </label>
             <div className="flex items-center gap-2">
                <button
                  onClick={handleDownload}
                  disabled={!distance || !consumption || !fuelPrice}
                  className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
                  aria-label={t("common.download")}
                >
                  <Download className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{t("common.download")}</span>
                </button>
                <button
                  onClick={handleClear}
                  disabled={!distance && !consumption && !fuelPrice && people === "1"}
                  className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
                  aria-label={`${t("common.reset")} (Esc)`}
                  title={`${t("common.reset")} (Esc)`}
                >
                  <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{t("common.reset")}</span>
                  <Kbd modifier={null} className="ml-1 text-[10px] bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-300 border-rose-200 dark:border-rose-800">Esc</Kbd>
                </button>
             </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="distance" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 cursor-pointer">
                {t("fuelcost.distance")}
              </label>
              <div className="relative">
                <input
                  id="distance"
                  ref={distanceInputRef}
                  type="number"
                  value={distance}
                  onChange={(e) => {
                    setDistance(e.target.value);
                    setActivePresetId(null);
                  }}
                  className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xl font-black font-mono focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all dark:text-white"
                  placeholder="100"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-slate-300 pointer-events-none" aria-hidden="true">km</span>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="consumption" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 cursor-pointer">
                {t("fuelcost.consumption")}
              </label>
              <div className="relative">
                <input
                  id="consumption"
                  type="number"
                  value={consumption}
                  onChange={(e) => {
                    setConsumption(e.target.value);
                    setActivePresetId(null);
                  }}
                  className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xl font-black font-mono focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all dark:text-white"
                  placeholder="6.5"
                  step="0.1"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-slate-300 pointer-events-none" aria-hidden="true">L/100</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="fuelPrice" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 cursor-pointer">
                  {t("fuelcost.fuel_price")}
                </label>
                <div className="relative">
                  <input
                    id="fuelPrice"
                    type="number"
                    value={fuelPrice}
                    onChange={(e) => {
                      setFuelPrice(e.target.value);
                      setActivePresetId(null);
                    }}
                    className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xl font-black font-mono focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all dark:text-white"
                    placeholder="1.85"
                    step="0.01"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-slate-300 pointer-events-none" aria-hidden="true">€/L</span>
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="people" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 cursor-pointer">
                  {t("fuelcost.passengers")}
                </label>
                <div className="relative">
                  <input
                    id="people"
                    type="number"
                    value={people}
                    onChange={(e) => {
                      setPeople(e.target.value);
                      setActivePresetId(null);
                    }}
                    className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xl font-black font-mono focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all dark:text-white"
                    placeholder="1"
                    min="1"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-slate-300 pointer-events-none flex items-center gap-1" aria-hidden="true">
                    <Users className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Results Summary Area */}
        <div className="flex flex-col gap-6">
          <div
            className="bg-slate-900 dark:bg-black p-10 rounded-[2.5rem] text-center flex flex-col items-center justify-center space-y-4 shadow-xl shadow-indigo-500/10 relative group overflow-hidden"
            aria-live="polite"
            aria-atomic="true"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none" aria-hidden="true"></div>

            <button
              onClick={handleCopy}
              disabled={stats.totalCost === 0}
              className={`absolute top-6 right-6 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border z-20 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                copied
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                  : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
              } disabled:opacity-0`}
              aria-label={`${t("common.copy")} (C)`}
              title={`${t("common.copy")} (C)`}
            >
              {copied ? <Check className="w-3.5 h-3.5" aria-hidden="true" /> : <Copy className="w-3.5 h-3.5" aria-hidden="true" />}
              <span>{copied ? t("common.copied") : t("common.copy")}</span>
              <Kbd modifier={null} className="ml-1 text-[10px] bg-slate-700 text-slate-300 border-slate-600">C</Kbd>
            </button>

            <div className="text-slate-400 font-bold uppercase tracking-widest text-xs">{t("fuelcost.total_cost")}</div>
            <div className="text-6xl md:text-7xl font-black text-white font-mono tracking-tighter">
              {stats.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€
            </div>
            <div className="flex items-center gap-2 px-6 py-2 rounded-full bg-indigo-500/20 text-indigo-400 font-black text-sm uppercase tracking-widest">
              {t("fuelcost.cost_per_person", { cost: stats.costPerPerson.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-1 text-center">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-center gap-1">
                  <Droplets className="w-3.5 h-3.5 text-indigo-500" aria-hidden="true" />
                  <span>{t("fuelcost.total_fuel")}</span>
                </div>
                <div className="text-xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
                  {stats.totalFuel.toFixed(2)} L
                </div>
             </div>
             <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-1 text-center">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-center gap-1">
                  <Map className="w-3.5 h-3.5 text-indigo-500" aria-hidden="true" />
                  <span>{t("fuelcost.distance")}</span>
                </div>
                <div className="text-xl font-black text-slate-900 dark:text-white font-mono">
                  {parseFloat(distance) || 0} km
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Advice Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-8 shadow-sm">
        <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-3xl shrink-0">
          <Info className="w-8 h-8" aria-hidden="true" />
        </div>
        <div className="space-y-2 text-center md:text-left">
           <h4 className="font-black text-slate-900 dark:text-white">{t("fuelcost.advice_title")}</h4>
           <ul className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed list-disc list-inside space-y-1">
             <li>{t("fuelcost.advice_1")}</li>
             <li>{t("fuelcost.advice_2")}</li>
             <li>{t("fuelcost.advice_3")}</li>
             <li>{t("fuelcost.advice_4")}</li>
           </ul>
        </div>
      </div>
    </div>
  );
}
