import { useState } from "react";
import { UtensilsCrossed, Users, Euro, Percent, Trash2, Copy, Check } from "lucide-react";

export function TipCalculator() {
  const [billAmount, setBillAmount] = useState<string>("");
  const [tipPercent, setTipPercent] = useState<number>(15);
  const [numberOfPeople, setNumberOfPeople] = useState<string>("1");
  const [copied, setCopied] = useState(false);

  const bill = parseFloat(billAmount) || 0;
  const people = parseInt(numberOfPeople) || 1;
  const tipAmount = bill * (tipPercent / 100);
  const totalAmount = bill + tipAmount;
  const perPerson = people !== 0 ? totalAmount / people : totalAmount;

  const tipButtons = [10, 15, 18, 20, 25];

  const handleClear = () => {
    setBillAmount("");
    setTipPercent(15);
    setNumberOfPeople("1");
  };

  const handleCopy = () => {
    const text = `Addition: ${bill.toFixed(2)}€, Pourboire: ${tipPercent}% (${tipAmount.toFixed(2)}€), Total: ${totalAmount.toFixed(2)}€, Par personne: ${perPerson.toFixed(2)}€`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="bill-amount" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 cursor-pointer">
                <Euro className="w-3 h-3" /> Montant de l'addition
              </label>
              <button
                onClick={handleClear}
                className="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 transition-colors"
                aria-label="Effacer tout"
              >
                <Trash2 className="w-3 h-3" /> Effacer
              </button>
            </div>
            <div className="relative">
               <input
                id="bill-amount"
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
               <Percent className="w-3 h-3" /> Pourboire: {tipPercent}%
             </label>
             <div className="grid grid-cols-5 gap-2">
                {tipButtons.map((percent) => (
                  <button
                    key={percent}
                    onClick={() => setTipPercent(percent)}
                    aria-pressed={tipPercent === percent}
                    className={`py-3 rounded-xl font-bold text-sm transition-all border ${
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
                className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600 mt-4"
              />
          </div>

          <div className="space-y-3">
            <label htmlFor="people-count" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-2 cursor-pointer">
              <Users className="w-3 h-3" /> Nombre de personnes
            </label>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setNumberOfPeople(String(Math.max(1, people - 1)))}
                className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-2xl font-black hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                aria-label="Diminuer le nombre de personnes"
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
                className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-2xl font-black hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                aria-label="Augmenter le nombre de personnes"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 dark:bg-black p-10 rounded-[2.5rem] shadow-xl shadow-indigo-500/10 space-y-8 relative group/results">
            <button
              onClick={handleCopy}
              className={`absolute top-6 right-6 p-3 rounded-2xl transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/40 hover:text-white hover:bg-white/20'}`}
              title="Copier le résultat"
              aria-label="Copier le résultat"
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </button>
            <div className="flex justify-between items-center border-b border-slate-800 pb-6">
              <div className="space-y-1">
                <div className="text-white font-black text-xl">Pourboire</div>
                <div className="text-slate-500 text-xs font-bold uppercase tracking-widest">Total</div>
              </div>
              <div className="text-4xl font-black text-indigo-400 font-mono">
                {tipAmount.toFixed(2)}€
              </div>
            </div>

            <div className="flex justify-between items-center border-b border-slate-800 pb-6">
              <div className="space-y-1">
                <div className="text-white font-black text-xl">Total</div>
                <div className="text-slate-500 text-xs font-bold uppercase tracking-widest">Addition + Pourboire</div>
              </div>
              <div className="text-4xl font-black text-emerald-400 font-mono">
                {totalAmount.toFixed(2)}€
              </div>
            </div>

            {people > 1 && (
              <div className="pt-2 space-y-6">
                <div className="flex justify-between items-center opacity-60">
                   <div className="text-slate-300 font-bold text-sm">Par personne</div>
                   <div className="text-slate-300 font-black font-mono text-lg">{perPerson.toFixed(2)}€</div>
                </div>
                <div className="bg-indigo-500/10 border border-indigo-500/20 p-6 rounded-3xl text-center">
                   <div className="text-indigo-400 text-xs font-bold uppercase tracking-widest mb-2">Total par personne</div>
                   <div className="text-5xl font-black text-white font-mono tracking-tighter">
                     {perPerson.toFixed(2)}<span className="text-2xl ml-1 text-indigo-400">€</span>
                   </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl flex items-start gap-4">
             <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                <UtensilsCrossed className="w-6 h-6" />
             </div>
             <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
               Le pourboire est généralement de 10% à 15% dans la plupart des pays. En France, le service est inclus, mais un petit supplément est toujours apprécié.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
