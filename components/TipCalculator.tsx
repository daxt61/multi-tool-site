import { useState, useEffect, useRef } from "react";
import { UtensilsCrossed, Users, Euro, Percent, Copy, Check, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Kbd } from "./ui/Kbd";

export function TipCalculator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const billAmountRef = useRef<HTMLInputElement>(null);

  const [billAmount, setBillAmount] = useState<string>(initialData?.billAmount || "");
  const [tipPercent, setTipPercent] = useState<number>(initialData?.tipPercent ?? 15);
  const [numberOfPeople, setNumberOfPeople] = useState<string>(initialData?.numberOfPeople || "1");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ billAmount, tipPercent, numberOfPeople });
  }, [billAmount, tipPercent, numberOfPeople]);

  const bill = parseFloat(billAmount) || 0;
  const people = parseInt(numberOfPeople) || 1;
  const tipAmount = bill * (tipPercent / 100);
  const totalAmount = bill + tipAmount;
  const perPerson = people !== 0 ? totalAmount / people : totalAmount;

  const tipButtons = [10, 15, 18, 20, 25];

  const handleCopy = () => {
    const text = `${t("tipcalculator.bill_amount")}: ${bill.toFixed(2)}€\n${t("tipcalculator.tip")} (${tipPercent}%): ${tipAmount.toFixed(2)}€\n${t("tipcalculator.total")}: ${totalAmount.toFixed(2)}€${people > 1 ? `\n${t("tipcalculator.per_person")}: ${perPerson.toFixed(2)}€` : ''}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(t("tipcalculator.copied_summary_toast"));
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setBillAmount("");
    setTipPercent(15);
    setNumberOfPeople("1");
    billAmountRef.current?.focus();
    toast.success(t("common.reset"));
  };

  const handleClearRef = useRef(handleClear);
  const handleCopyRef = useRef(handleCopy);

  useEffect(() => {
    handleClearRef.current = handleClear;
    handleCopyRef.current = handleCopy;
  }, [handleClear, handleCopy]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClearRef.current();
        return;
      }

      const activeEl = document.activeElement;
      const isEditable = activeEl && (
        activeEl.tagName === "INPUT" ||
        activeEl.tagName === "TEXTAREA" ||
        activeEl.getAttribute("contenteditable") === "true"
      );

      if (isEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key.toLowerCase() === "c") {
        e.preventDefault();
        handleCopyRef.current();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="bill-amount" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 cursor-pointer">
              <Euro className="w-3 h-3" aria-hidden="true" /> {t("tipcalculator.bill_amount")}
            </label>
            <div className="flex items-center gap-2">
              <Kbd modifier={null} className="text-slate-400">Esc</Kbd>
              <button
                onClick={handleClear}
                disabled={!billAmount && tipPercent === 15 && numberOfPeople === "1"}
                className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
                aria-label={t("tipcalculator.clear")}
              >
                <Trash2 className="w-3 h-3" aria-hidden="true" /> {t("tipcalculator.clear")}
              </button>
            </div>
          </div>
          <div className="space-y-3">
            <div className="relative">
               <input
                id="bill-amount"
                ref={billAmountRef}
                type="number"
                value={billAmount}
                onChange={(e) => setBillAmount(e.target.value)}
                className="w-full p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl text-4xl font-black font-mono outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
                placeholder="0.00"
                step="0.01"
              />
              <span className="absolute right-6 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-300">€</span>
            </div>
          </div>

          <div className="space-y-3">
             <label htmlFor="tip-range" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-2 cursor-pointer">
               <Percent className="w-3 h-3" aria-hidden="true" /> {t("tipcalculator.tip")}: {tipPercent}%
             </label>
             <div className="grid grid-cols-5 gap-2" role="group" aria-label={t("tipcalculator.tip")}>
                {tipButtons.map((percent) => (
                  <button
                    key={percent}
                    onClick={() => setTipPercent(percent)}
                    aria-pressed={tipPercent === percent}
                    className={`py-3 rounded-xl font-bold text-sm transition-all border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                      tipPercent === percent
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20"
                        : "bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-slate-300"
                    }`}
                  >
                    {percent}%
                  </button>
                ))}
             </div>
             <input
                id="tip-range"
                type="range"
                min="0"
                max="50"
                value={tipPercent}
                onChange={(e) => setTipPercent(Number(e.target.value))}
                className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600 mt-4 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
              />
          </div>

          <div className="space-y-3">
            <label htmlFor="people-count" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-2 cursor-pointer">
              <Users className="w-3 h-3" aria-hidden="true" /> {t("tipcalculator.number_of_people")}
            </label>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setNumberOfPeople(String(Math.max(1, people - 1)))}
                className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-2xl font-black hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
                aria-label={t("tipcalculator.decrease_people")}
              >
                -
              </button>
              <input
                id="people-count"
                type="number"
                value={numberOfPeople}
                onChange={(e) => setNumberOfPeople(e.target.value)}
                className="flex-1 p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-2xl font-black font-mono text-center outline-none focus:ring-2 focus:ring-indigo-500/20"
                min="1"
              />
              <button
                onClick={() => setNumberOfPeople(String(people + 1))}
                className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-2xl font-black hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
                aria-label={t("tipcalculator.increase_people")}
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 dark:bg-black p-10 rounded-[2.5rem] shadow-xl shadow-indigo-500/10 space-y-8 relative">
            <div className="flex justify-between items-center border-b border-slate-800/60 pb-4">
              <span className="text-xs font-black uppercase tracking-widest text-slate-500">{t("common.result")}</span>
              <button
                onClick={handleCopy}
                className={`p-3 rounded-2xl transition-all border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none flex items-center gap-2 ${
                  copied
                    ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                    : "bg-white/10 text-white/40 border-transparent hover:text-white hover:bg-white/20"
                }`}
                title={t("tipcalculator.copy_summary_title")}
                aria-label={t("tipcalculator.copy_summary_title")}
              >
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                {!copied && <Kbd modifier={null} className="hidden sm:inline-flex bg-white/10 text-white border-transparent">C</Kbd>}
              </button>
            </div>

            <div className="flex justify-between items-center border-b border-slate-800 pb-6">
              <div className="space-y-1">
                <div className="text-white font-black text-xl">{t("tipcalculator.tip")}</div>
                <div className="text-slate-500 text-xs font-bold uppercase tracking-widest">{t("tipcalculator.total")}</div>
              </div>
              <div className="text-4xl font-black text-indigo-400 font-mono">
                {tipAmount.toFixed(2)}€
              </div>
            </div>

            <div className="flex justify-between items-center border-b border-slate-800 pb-6">
              <div className="space-y-1">
                <div className="text-white font-black text-xl">{t("tipcalculator.total")}</div>
                <div className="text-slate-500 text-xs font-bold uppercase tracking-widest">{t("tipcalculator.bill_plus_tip")}</div>
              </div>
              <div className="text-4xl font-black text-emerald-400 font-mono">
                {totalAmount.toFixed(2)}€
              </div>
            </div>

            {people > 1 && (
              <div className="pt-2 space-y-6">
                <div className="flex justify-between items-center opacity-60">
                   <div className="text-slate-300 font-bold text-sm">{t("tipcalculator.per_person")}</div>
                   <div className="text-slate-300 font-black font-mono text-lg">{perPerson.toFixed(2)}€</div>
                </div>
                <div className="bg-indigo-500/10 border border-indigo-500/20 p-6 rounded-3xl text-center">
                   <div className="text-indigo-400 text-xs font-bold uppercase tracking-widest mb-2">{t("tipcalculator.total_per_person")}</div>
                   <div className="text-5xl font-black text-white font-mono tracking-tighter">
                     {perPerson.toFixed(2)}<span className="text-2xl ml-1 text-indigo-400">€</span>
                   </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl flex items-start gap-4">
             <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                <UtensilsCrossed className="w-6 h-6" aria-hidden="true" />
             </div>
             <div className="space-y-1">
                <h4 className="font-bold text-sm dark:text-white">{t("tipcalculator.how_it_works_title")}</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  {t("tipcalculator.how_it_works")}
                </p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
