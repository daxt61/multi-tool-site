import { useState, useMemo } from 'react';
import { Clock, Globe, ArrowRight, Info, Calendar, Search, Trash2, Copy, Check } from 'lucide-react';

const TIMEZONES = [
  'UTC',
  'Europe/Paris',
  'Europe/London',
  'Europe/Berlin',
  'America/New_York',
  'America/Los_Angeles',
  'America/Chicago',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Dubai',
  'Australia/Sydney',
  'Pacific/Auckland',
  'America/Sao_Paulo',
  'Africa/Lagos',
  'Africa/Johannesburg'
].sort();

export function TimezoneConverter() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(new Date().toTimeString().slice(0, 5));
  const [fromTz, setFromTz] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
  const [toTz, setToTz] = useState('UTC');
  const [copied, setCopied] = useState(false);

  const convertedTime = useMemo(() => {
    try {
      const dt = new Date(`${date}T${time}`);
      const invDate = new Date(dt.toLocaleString('en-US', { timeZone: fromTz }));
      const diff = dt.getTime() - invDate.getTime();
      const resultDate = new Date(dt.getTime() + diff);

      return new Intl.DateTimeFormat('fr-FR', {
        timeZone: toTz,
        dateStyle: 'full',
        timeStyle: 'medium'
      }).format(resultDate);
    } catch (e) {
      return 'Erreur de conversion';
    }
  }, [date, time, fromTz, toTz]);

  const handleCopy = () => {
    navigator.clipboard.writeText(convertedTime);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Configuration */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
            <div className="space-y-6">
              <div className="flex items-center gap-2 px-1">
                <Calendar className="w-4 h-4 text-indigo-500" />
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Date & Heure</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="date-input" className="text-xs font-bold text-slate-500 px-1">Date</label>
                  <input
                    id="date-input"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold focus:border-indigo-500 outline-none transition-all dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="time-input" className="text-xs font-bold text-slate-500 px-1">Heure</label>
                  <input
                    id="time-input"
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-2 px-1">
                <Globe className="w-4 h-4 text-indigo-500" />
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Fuseaux Horaires</h3>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="from-tz" className="text-xs font-bold text-slate-500 px-1">De (Source)</label>
                  <select
                    id="from-tz"
                    value={fromTz}
                    onChange={(e) => setFromTz(e.target.value)}
                    className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold focus:border-indigo-500 outline-none transition-all dark:text-white cursor-pointer"
                  >
                    {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                  </select>
                </div>

                <div className="flex justify-center">
                   <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-full text-indigo-600">
                      <ArrowRight className="w-5 h-5 rotate-90 lg:rotate-0" />
                   </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="to-tz" className="text-xs font-bold text-slate-500 px-1">Vers (Destination)</label>
                  <select
                    id="to-tz"
                    value={toTz}
                    onChange={(e) => setToTz(e.target.value)}
                    className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold focus:border-indigo-500 outline-none transition-all dark:text-white cursor-pointer"
                  >
                    {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setDate(new Date().toISOString().split('T')[0]);
                setTime(new Date().toTimeString().slice(0, 5));
              }}
              className="w-full py-4 text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all"
            >
              <Trash2 className="w-4 h-4" /> Réinitialiser à maintenant
            </button>
          </div>
        </div>

        {/* Result */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-10 space-y-8 flex flex-col items-center text-center shadow-sm">
            <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-3xl flex items-center justify-center text-indigo-600 mb-2">
              <Clock className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Heure convertie</p>
              <h2 className="text-3xl md:text-4xl font-black dark:text-white leading-tight">
                {convertedTime}
              </h2>
              <p className="text-indigo-600 dark:text-indigo-400 font-bold">{toTz}</p>
            </div>

            <button
              onClick={handleCopy}
              className={`flex items-center gap-2 px-8 py-4 rounded-2xl font-black transition-all border ${
                copied
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                  : 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent hover:opacity-90'
              }`}
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              {copied ? 'Copié !' : 'Copier le résultat'}
            </button>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 flex items-start gap-4">
             <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                <Info className="w-6 h-6" />
             </div>
             <div className="space-y-2">
                <h4 className="font-bold dark:text-white">Pourquoi utiliser un convertisseur de fuseaux horaires ?</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Indispensable pour planifier des réunions internationales ou suivre des événements mondiaux. Cet outil prend en compte les changements d'heure (été/hiver) automatiquement grâce à la base de données de fuseaux horaires standard de votre navigateur.
                </p>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-16 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Search className="w-4 h-4 text-indigo-500" /> Recherche facilitée
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Sélectionnez simplement les villes ou fuseaux de départ et d'arrivée pour voir instantanément la correspondance.
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Globe className="w-4 h-4 text-indigo-500" /> UTC & GMT
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            UTC (Temps Universel Coordonné) est la base de tous les fuseaux horaires du monde. GMT est souvent utilisé de manière interchangeable dans le langage courant.
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-500" /> Précision
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Les calculs sont effectués à la seconde près, garantissant une conversion fiable pour tous vos besoins professionnels ou personnels.
          </p>
        </div>
      </div>
    </div>
  );
}
