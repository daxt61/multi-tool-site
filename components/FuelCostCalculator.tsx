import { useState, useEffect, useMemo } from "react";
import { Fuel, Map, Droplets, Users, Trash2, Copy, Check, Download, Info, Euro } from "lucide-react";

export function FuelCostCalculator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const [distance, setDistance] = useState<string>(initialData?.distance || "");
  const [consumption, setConsumption] = useState<string>(initialData?.consumption || "");
  const [fuelPrice, setFuelPrice] = useState<string>(initialData?.fuelPrice || "");
  const [people, setPeople] = useState<string>(initialData?.people || "1");
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

    return { totalFuel, totalCost, costPerPerson, n };
  }, [distance, consumption, fuelPrice, people]);

  const handleClear = () => {
    setDistance("");
    setConsumption("");
    setFuelPrice("");
    setPeople("1");
  };

  const handleCopy = () => {
    if (stats.totalCost === 0) return;
    const text = `Coût total : ${stats.totalCost.toFixed(2)}€ | Coût par personne : ${stats.costPerPerson.toFixed(2)}€ | Carburant nécessaire : ${stats.totalFuel.toFixed(2)}L`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (stats.totalCost === 0) return;
    const content = `Calcul du coût du trajet :
- Distance : ${distance} km
- Consommation : ${consumption} L/100km
- Prix du carburant : ${fuelPrice} €/L
- Nombre de personnes : ${people}
-----------------------------------
- Carburant nécessaire : ${stats.totalFuel.toFixed(2)} L
- Coût total : ${stats.totalCost.toFixed(2)} €
- Coût par personne : ${stats.costPerPerson.toFixed(2)} €`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cout-trajet-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="flex justify-between items-center px-1">
             <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Fuel className="w-3 h-3" /> Paramètres du trajet
             </label>
             <div className="flex gap-2">
                <button
                  onClick={handleDownload}
                  disabled={!distance || !consumption || !fuelPrice}
                  className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
                >
                  <Download className="w-3 h-3" /> Télécharger
                </button>
                <button
                  onClick={handleClear}
                  disabled={!distance && !consumption && !fuelPrice && people === "1"}
                  className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
                >
                  <Trash2 className="w-3 h-3" /> Effacer
                </button>
             </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="distance" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 cursor-pointer">Distance (km)</label>
              <div className="relative">
                <input
                  id="distance"
                  type="number"
                  value={distance}
                  onChange={(e) => setDistance(e.target.value)}
                  className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
                  placeholder="100"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-slate-300">km</span>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="consumption" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 cursor-pointer">Consommation moyenne (L/100km)</label>
              <div className="relative">
                <input
                  id="consumption"
                  type="number"
                  value={consumption}
                  onChange={(e) => setConsumption(e.target.value)}
                  className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
                  placeholder="6.5"
                  step="0.1"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-slate-300">L/100</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="fuelPrice" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 cursor-pointer">Prix du carburant</label>
                <div className="relative">
                  <input
                    id="fuelPrice"
                    type="number"
                    value={fuelPrice}
                    onChange={(e) => setFuelPrice(e.target.value)}
                    className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
                    placeholder="1.80"
                    step="0.001"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-slate-300">€/L</span>
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="people" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 cursor-pointer">Passagers</label>
                <div className="relative">
                  <input
                    id="people"
                    type="number"
                    value={people}
                    onChange={(e) => setPeople(e.target.value)}
                    className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
                    placeholder="1"
                    min="1"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-slate-300"><Users className="w-4 h-4" /></span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="bg-slate-900 dark:bg-black p-10 rounded-[2.5rem] text-center flex flex-col items-center justify-center space-y-4 shadow-xl shadow-indigo-500/10 relative group overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>

            <button
              onClick={handleCopy}
              disabled={stats.totalCost === 0}
              className={`absolute top-6 right-6 p-3 rounded-2xl transition-all border z-20 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none ${
                copied
                  ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                  : "bg-white/10 text-white/40 border-transparent hover:text-white hover:bg-white/20 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
              } disabled:opacity-0`}
              title="Copier le résultat"
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </button>

            <div className="text-slate-400 font-bold uppercase tracking-widest text-xs">Coût Total Estimé</div>
            <div className="text-6xl md:text-7xl font-black text-white font-mono tracking-tighter">
              {stats.totalCost.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€
            </div>
            <div className="flex items-center gap-2 px-6 py-2 rounded-full bg-indigo-500/20 text-indigo-400 font-black text-sm uppercase tracking-widest">
              {stats.costPerPerson.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€ / personne
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-1 text-center">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-center gap-1">
                  <Droplets className="w-3 h-3" /> Carburant total
                </div>
                <div className="text-xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
                  {stats.totalFuel.toFixed(2)} L
                </div>
             </div>
             <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-1 text-center">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-center gap-1">
                  <Map className="w-3 h-3" /> Distance
                </div>
                <div className="text-xl font-black text-slate-900 dark:text-white font-mono">
                  {parseFloat(distance) || 0} km
                </div>
             </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-8 shadow-sm">
        <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-3xl shrink-0">
          <Info className="w-8 h-8" />
        </div>
        <div className="space-y-2 text-center md:text-left">
           <h4 className="font-black text-slate-900 dark:text-white">Conseils pour réduire votre consommation</h4>
           <ul className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed list-disc list-inside space-y-1">
             <li>Maintenez une vitesse stable et évitez les accélérations brusques.</li>
             <li>Vérifiez régulièrement la pression de vos pneus.</li>
             <li>Évitez de transporter des charges inutiles dans votre véhicule.</li>
             <li>Utilisez le frein moteur au lieu de freiner brusquement.</li>
           </ul>
        </div>
      </div>
    </div>
  );
}
