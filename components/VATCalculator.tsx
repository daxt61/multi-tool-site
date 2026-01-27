import { useState } from "react";
import { Info } from "lucide-react";

export function VATCalculator() {
  const [amount, setAmount] = useState<string>("");
  const [vatRate, setVatRate] = useState<string>("20");
  const [mode, setMode] = useState<"ht-to-ttc" | "ttc-to-ht">("ht-to-ttc");

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

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
            <button
              onClick={() => setMode("ht-to-ttc")}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${mode === "ht-to-ttc" ? "bg-white dark:bg-slate-700 text-indigo-600 shadow-sm" : "text-slate-500"}`}
            >
              HT → TTC
            </button>
            <button
              onClick={() => setMode("ttc-to-ht")}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${mode === "ttc-to-ht" ? "bg-white dark:bg-slate-700 text-indigo-600 shadow-sm" : "text-slate-500"}`}
            >
              TTC → HT
            </button>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">
              Montant {mode === "ht-to-ttc" ? "HT" : "TTC"}
            </label>
            <div className="relative">
               <input
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
             <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Taux de TVA</label>
             <div className="grid grid-cols-2 gap-2">
                {commonRates.map((rate) => (
                  <button
                    key={rate.value}
                    onClick={() => setVatRate(rate.value)}
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
          <div className="bg-slate-900 dark:bg-black p-10 rounded-[2.5rem] shadow-xl shadow-indigo-500/10 space-y-8">
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
