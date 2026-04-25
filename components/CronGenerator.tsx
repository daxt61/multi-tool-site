import { useState, useEffect, useMemo } from 'react';
import { Clock, Copy, Check, Info, Trash2 } from 'lucide-react';

export function CronGenerator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const [minutes, setMinutes] = useState(initialData?.minutes || '*');
  const [hours, setHours] = useState(initialData?.hours || '*');
  const [dayOfMonth, setDayOfMonth] = useState(initialData?.dayOfMonth || '*');
  const [month, setMonth] = useState(initialData?.month || '*');
  const [dayOfWeek, setDayOfWeek] = useState(initialData?.dayOfWeek || '*');
  const [cron, setCron] = useState('* * * * *');
  const [copied, setCopied] = useState(false);

  const humanDescription = useMemo(() => {
    if (cron === '* * * * *') return "Toutes les minutes, tous les jours.";

    const monthsArr = ['', 'janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
    const daysArr = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

    let res = "S'exécute ";

    // Minutes
    if (minutes === '*') res += "chaque minute ";
    else if (minutes.startsWith('*/')) res += `toutes les ${minutes.slice(2)} minutes `;
    else res += `à la minute ${minutes} `;

    // Hours
    if (hours === '*') {
      if (minutes !== '*') res += "de chaque heure ";
    } else if (hours.startsWith('*/')) res += `toutes les ${hours.slice(2)} heures `;
    else res += `à ${hours}h `;

    // Day of Month
    if (dayOfMonth !== '*') {
      res += `le ${dayOfMonth === 'L' ? 'dernier jour' : dayOfMonth} du mois `;
    }

    // Month
    if (month !== '*') {
      const mIdx = parseInt(month);
      res += `en ${monthsArr[mIdx] || month} `;
    }

    // Day of Week
    if (dayOfWeek !== '*') {
      const dIdx = parseInt(dayOfWeek);
      res += `le ${daysArr[dIdx] || dayOfWeek} `;
    }

    return res.trim() + ".";
  }, [cron, minutes, hours, dayOfMonth, month, dayOfWeek]);

  useEffect(() => {
    const newCron = `${minutes} ${hours} ${dayOfMonth} ${month} ${dayOfWeek}`;
    setCron(newCron);
    onStateChange?.({ minutes, hours, dayOfMonth, month, dayOfWeek, cron: newCron });
  }, [minutes, hours, dayOfMonth, month, dayOfWeek, onStateChange]);

  const handleCopy = () => {
    navigator.clipboard.writeText(cron);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const presets = [
    { name: 'Toutes les minutes', value: '* * * * *' },
    { name: 'Toutes les 5 minutes', value: '*/5 * * * *' },
    { name: 'Chaque heure', value: '0 * * * *' },
    { name: 'Chaque jour à minuit', value: '0 0 * * *' },
    { name: 'Chaque dimanche à minuit', value: '0 0 * * 0' },
    { name: 'Le 1er de chaque mois à minuit', value: '0 0 1 * *' },
  ];

  const applyPreset = (value: string) => {
    const parts = value.split(' ');
    setMinutes(parts[0]);
    setHours(parts[1]);
    setDayOfMonth(parts[2]);
    setMonth(parts[3]);
    setDayOfWeek(parts[4]);
  };

  const handleClear = () => {
    setMinutes('*');
    setHours('*');
    setDayOfMonth('*');
    setMonth('*');
    setDayOfWeek('*');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <div className="flex justify-end px-1">
        <button
          onClick={handleClear}
          disabled={cron === '* * * * *'}
          className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
        >
          <Trash2 className="w-3 h-3" /> Effacer
        </button>
      </div>

      <div className="bg-slate-900 dark:bg-black p-10 rounded-[2.5rem] shadow-xl shadow-indigo-500/10 text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-500/10 text-indigo-400 rounded-full text-xs font-black uppercase tracking-widest border border-indigo-500/20">
          <Clock className="w-3 h-3" /> Expression Cron
        </div>
        <div className="space-y-2">
          <div className="text-4xl md:text-6xl font-mono font-black text-white tracking-wider break-all">
            {cron}
          </div>
          <p className="text-indigo-300 font-medium text-sm md:text-base animate-in fade-in slide-in-from-bottom-2 duration-500">
            {humanDescription}
          </p>
        </div>
        <button
          onClick={handleCopy}
          className={`px-8 py-4 rounded-2xl transition-all active:scale-95 flex items-center gap-2 font-black text-lg mx-auto ${
            copied ? 'bg-emerald-500 text-white' : 'bg-white text-slate-900 hover:bg-slate-100'
          }`}
        >
          {copied ? <Check className="w-6 h-6" /> : <Copy className="w-6 h-6" />}
          {copied ? 'Copié' : 'Copier'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {[
          { id: 'cron-minute', label: 'Minute', value: minutes, setter: setMinutes, hint: '0-59, *, */n' },
          { id: 'cron-hour', label: 'Heure', value: hours, setter: setHours, hint: '0-23, *, */n' },
          { id: 'cron-dom', label: 'Jour (Mois)', value: dayOfMonth, setter: setDayOfMonth, hint: '1-31, *, L' },
          { id: 'cron-month', label: 'Mois', value: month, setter: setMonth, hint: '1-12, *, JAN-DEC' },
          { id: 'cron-dow', label: 'Jour (Semaine)', value: dayOfWeek, setter: setDayOfWeek, hint: '0-6, *, SUN-SAT' },
        ].map((field) => (
          <div key={field.id} className="space-y-2">
            <label htmlFor={field.id} className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 cursor-pointer">
              {field.label}
            </label>
            <input
              id={field.id}
              type="text"
              value={field.value}
              onChange={(e) => field.setter(e.target.value)}
              className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center font-mono font-bold text-xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
            />
            <p className="text-[10px] text-center text-slate-400 font-bold">{field.hint}</p>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Préréglages rapides</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {presets.map((preset) => (
            <button
              key={preset.name}
              onClick={() => applyPreset(preset.value)}
              className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-left hover:border-indigo-500/50 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-all group"
            >
              <div className="font-bold text-sm mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{preset.name}</div>
              <div className="font-mono text-xs text-slate-400">{preset.value}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-900/20 p-6 rounded-[2rem] flex gap-4">
        <div className="shrink-0 w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center text-amber-600">
          <Info className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h5 className="font-bold text-amber-900 dark:text-amber-100">Comment ça marche ?</h5>
          <p className="text-sm text-amber-700 dark:text-amber-300 leading-relaxed">
            Cron est un utilitaire système qui permet d'exécuter des tâches à des moments précis. Les cinq champs représentent respectivement : Minute, Heure, Jour du mois, Mois et Jour de la semaine.
          </p>
        </div>
      </div>
    </div>
  );
}
