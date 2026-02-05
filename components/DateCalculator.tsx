import { useState } from 'react';
import { Calendar, History, Info } from 'lucide-react';

export function DateCalculator() {
  const today = new Date().toISOString().split('T')[0];
  const [date1, setDate1] = useState(today);
  const [date2, setDate2] = useState(today);
  const [daysToAdd, setDaysToAdd] = useState('30');

  const calculateDifference = () => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);

    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
      return { totalDays: 0, years: 0, months: 0, days: 0 };
    }

    // Total days
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Breakdown
    const start = d1 < d2 ? d1 : d2;
    const end = d1 < d2 ? d2 : d1;

    let years = end.getFullYear() - start.getFullYear();
    let months = end.getMonth() - start.getMonth();
    let days = end.getDate() - start.getDate();

    if (days < 0) {
      months -= 1;
      const prevMonth = new Date(end.getFullYear(), end.getMonth(), 0);
      days += prevMonth.getDate();
    }

    if (months < 0) {
      years -= 1;
      months += 12;
    }

    return { totalDays, years, months, days };
  };

  const calculateWorkingDays = () => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);

    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
      return 0;
    }

    const start = d1 < d2 ? new Date(d1) : new Date(d2);
    const end = d1 < d2 ? new Date(d2) : new Date(d1);
    let workingDays = 0;

    const current = new Date(start);
    // Exclusive of the start day, inclusive of the end day (standard duration logic)
    // or should it be inclusive of both?
    // Let's go with inclusive of both if they are different, or 1 if same.
    // Actually, usually difference is end - start.
    // If start is Monday and end is Tuesday, it's 2 working days if inclusive.
    // Let's match the "totalDays" logic which is Math.ceil(diffTime / ...)
    // If d1=d2, totalDays=0.

    while (current < end) {
      current.setDate(current.getDate() + 1);
      const day = current.getDay();
      if (day !== 0 && day !== 6) { // Not Sunday (0) or Saturday (6)
        workingDays++;
      }
    }

    return workingDays;
  };

  const addDaysToDate = (date: string, days: number) => {
    if (!date) return "";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "";
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  const getDayOfWeek = (date: string) => {
    if (!date) return "";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "";
    const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    return days[d.getDay()];
  };

  const diff = calculateDifference();
  const workingDays = calculateWorkingDays();
  const newDate = addDaysToDate(date1, parseInt(daysToAdd) || 0);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Date Difference Calculator */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
        <div className="flex items-center gap-2 text-indigo-500">
          <History className="w-4 h-4" />
          <label className="text-xs font-black uppercase tracking-widest text-slate-400">Différence entre deux dates</label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <label htmlFor="date1" className="text-xs font-bold text-slate-400 px-1 uppercase tracking-widest cursor-pointer">Date de début</label>
            <input
              id="date1"
              type="date"
              value={date1}
              onChange={(e) => setDate1(e.target.value)}
              className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
            />
            <div className="text-xs font-bold text-indigo-500 px-1">{getDayOfWeek(date1)}</div>
          </div>
          <div className="space-y-3">
            <label htmlFor="date2" className="text-xs font-bold text-slate-400 px-1 uppercase tracking-widest cursor-pointer">Date de fin</label>
            <input
              id="date2"
              type="date"
              value={date2}
              onChange={(e) => setDate2(e.target.value)}
              className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
            />
            <div className="text-xs font-bold text-indigo-500 px-1">{getDayOfWeek(date2)}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 text-center">
             <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Ans / Mois / Jours</div>
             <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
               {diff.years}a {diff.months}m {diff.days}j
             </div>
           </div>
           <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 text-center">
             <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total en Jours</div>
             <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
               {diff.totalDays} jours
             </div>
           </div>
           <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 text-center">
             <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Semaines</div>
             <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
               {(diff.totalDays / 7).toFixed(1)} sem.
             </div>
           </div>
           <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 text-center md:col-span-3">
             <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Jours ouvrés (Lundi-Vendredi)</div>
             <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
               {workingDays} jours
             </div>
           </div>
        </div>
      </div>

      {/* Add/Subtract Days */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
        <div className="flex items-center gap-2 text-indigo-500">
          <Calendar className="w-4 h-4" />
          <label className="text-xs font-black uppercase tracking-widest text-slate-400">Ajouter ou soustraire du temps</label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
             <label htmlFor="base-date" className="text-xs font-bold text-slate-400 px-1 uppercase tracking-widest cursor-pointer">Date de départ</label>
             <input
              id="base-date"
              type="date"
              value={date1}
              onChange={(e) => setDate1(e.target.value)}
              className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
            />
          </div>
          <div className="space-y-3">
             <label htmlFor="days-offset" className="text-xs font-bold text-slate-400 px-1 uppercase tracking-widest cursor-pointer">Jours à ajouter/retirer</label>
             <div className="relative">
                <input
                  id="days-offset"
                  type="number"
                  value={daysToAdd}
                  onChange={(e) => setDaysToAdd(e.target.value)}
                  className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
                  placeholder="30"
                />
             </div>
          </div>
        </div>

        <div className="bg-slate-900 dark:bg-black p-8 rounded-3xl text-center shadow-xl shadow-indigo-500/10">
          <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2">Nouvelle Date</div>
          <div className="text-4xl font-black text-white font-mono tracking-tight">
            {newDate || "Invalid Date"}
          </div>
          <div className="text-sm font-bold text-slate-500 mt-2 uppercase tracking-widest">
            {getDayOfWeek(newDate)}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[2rem] flex items-start gap-4">
         <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl">
            <Info className="w-6 h-6" />
         </div>
         <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
           Ce calculateur permet de déterminer l'intervalle exact entre deux dates ou de projeter une date future en ajoutant un nombre de jours précis. Utile pour les délais de paiement, les périodes de préavis ou le suivi de projets.
         </p>
      </div>
    </div>
  );
}
