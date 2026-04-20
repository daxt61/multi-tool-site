import { useState, useEffect } from "react";
import { Info, Trash2, Copy, Check, BadgeEuro } from "lucide-react";

export function VATCalculator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const [amount, setAmount] = useState<string>(initialData?.amount || "");
  const [vatRate, setVatRate] = useState<string>(initialData?.vatRate || "20");
  const [mode, setMode] = useState<"ht-to-ttc" | "ttc-to-ht">(initialData?.mode || "ht-to-ttc");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ amount, vatRate, mode });
  }, [amount, vatRate, mode, onStateChange]);

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
    { label: "20% (Normal)", value: "20" },
    { label: "10% (Inter)", value: "10" },
    { label: "5.5% (Réduit)", value: "5.5" },
    { label: "2.1% (Super)", value: "2.1" },
  ];

  const handleClear = () => {
    setAmount("");
  };

  const handleCopy = () => {
    if (!amount) return;
    const text = `Montant HT: ${ht.toFixed(2)}€ | TVA (${vatRate}%): ${tva.toFixed(2)}€ | Montant TTC: ${ttc.toFixed(2)}€`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
            <button
              onClick={() => setMode("ht-to-ttc")}
              aria-pressed={mode === "ht-to-ttc"}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${mode === "ht-to-ttc" ? "bg-white dark:bg-slate-700 text-indigo-600 shadow-sm" : "text-slate-500"}`}
            >
              HT → TTC
            </button>
            <button
              onClick={() => setMode("ttc-to-ht")}
              aria-pressed={mode === "ttc-to-ht"}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${mode === "ttc-to-ht" ? "bg-white dark:bg-slate-700 text-indigo-600 shadow-sm" : "text-slate-500"}`}
            >
              TTC → HT
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="amount" className="text-xs font-black uppercase tracking-widest text-slate-400">
                Montant {mode === "ht-to-ttc" ? "HT" : "TTC"}
              </label>
              <button
                onClick={handleClear}
                disabled={!amount}
                className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
              >
                <Trash2 className="w-3 h-3" /> Effacer
              </button>
            </div>
            <div className="relative">
               <input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl text-4xl font-black font-mono outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
                placeholder="0.00"
                step="0.01"
              />
              <span className="absolute right-6 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-300">€</span>
            </div>
          </div>

          <div className="space-y-3">
             <label htmlFor="vatRate" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Taux de TVA</label>
             <div className="grid grid-cols-2 gap-2">
                {commonRates.map((rate) => (
                  <button
                    key={rate.value}
                    onClick={() => setVatRate(rate.value)}
                    aria-pressed={vatRate === rate.value}
                    className={`py-3 rounded-xl font-bold text-sm transition-all border ${
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
                  onChange={(e) => setVatRate(e.target.value)}
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
                onClick={handleCopy}
                disabled={!amount}
                className={`absolute top-6 right-6 p-3 rounded-2xl transition-all border z-20 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none ${
                  copied
                    ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                    : "bg-white/10 text-white/40 border-transparent hover:text-white hover:bg-white/20 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
                } disabled:opacity-0`}
                title="Copier le résultat"
              >
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>

             <div className="text-center pb-4">
                <div className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-2">Montant TTC</div>
                <div className="text-6xl font-black text-white font-mono tracking-tighter">
                  {ttc.toFixed(2)}€
                </div>
             </div>

             <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800">
                <div className="text-center">
                   <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Montant HT</div>
                   <div className="text-2xl font-black text-white font-mono">{ht.toFixed(2)}€</div>
                </div>
                <div className="text-center border-l border-slate-800">
                   <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">TVA ({vatRate}%)</div>
                   <div className="text-2xl font-black text-indigo-400 font-mono">{tva.toFixed(2)}€</div>
                </div>
             </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[2rem] flex items-start gap-4">
             <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                <Info className="w-6 h-6" />
             </div>
             <div className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed space-y-2">
                <p className="font-bold text-slate-900 dark:text-white">Taux en France :</p>
                <ul className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <li>Normal: 20%</li>
                  <li>Intermédiaire: 10%</li>
                  <li>Réduit: 5.5%</li>
                  <li>Super réduit: 2.1%</li>
                </ul>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
