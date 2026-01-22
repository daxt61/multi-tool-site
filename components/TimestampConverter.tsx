import { useState, useEffect } from 'react';
import { Clock, Calendar, ArrowRightLeft, Copy, Check } from 'lucide-react';

export function TimestampConverter() {
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));
  const [timestampInput, setTimestampInput] = useState(now.toString());
  const [dateInput, setDateInput] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    day: new Date().getDate(),
    hours: new Date().getHours(),
    minutes: new Date().getMinutes(),
    seconds: new Date().getSeconds(),
  });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTimestamp = (ts: number) => {
    const d = new Date(ts * 1000);
    if (isNaN(d.getTime())) {
      return {
        local: 'Date invalide',
        utc: 'Date invalide',
        relative: 'Date invalide',
      };
    }
    return {
      local: d.toLocaleString('fr-FR'),
      utc: d.toUTCString(),
      relative: getRelativeTime(d),
    };
  };

  const getRelativeTime = (d: Date) => {
    const diff = d.getTime() - Date.now();
    const absDiff = Math.abs(diff);
    const seconds = Math.floor(absDiff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    const prefix = diff > 0 ? 'Dans ' : 'Il y a ';

    if (seconds < 60) return `${prefix}${seconds} seconde${seconds !== 1 ? 's' : ''}`;
    if (minutes < 60) return `${prefix}${minutes} minute${minutes !== 1 ? 's' : ''}`;
    if (hours < 24) return `${prefix}${hours} heure${hours !== 1 ? 's' : ''}`;
    return `${prefix}${days} jour${days !== 1 ? 's' : ''}`;
  };

  const dateToTimestamp = () => {
    const d = new Date(
      dateInput.year,
      dateInput.month - 1,
      dateInput.day,
      dateInput.hours,
      dateInput.minutes,
      dateInput.seconds
    );
    return Math.floor(d.getTime() / 1000);
  };

  const results = formatTimestamp(parseInt(timestampInput) || 0);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Current Timestamp */}
      <div className="bg-indigo-600 text-white p-6 rounded-2xl shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Clock className="w-8 h-8 opacity-80" />
          <div>
            <div className="text-indigo-100 text-sm font-medium">Timestamp Unix actuel</div>
            <div className="text-3xl font-mono font-bold">{now}</div>
          </div>
        </div>
        <button
          onClick={() => handleCopy(now.toString())}
          className="bg-white/10 hover:bg-white/20 p-3 rounded-xl transition-colors flex items-center gap-2"
        >
          {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
          {copied ? 'Copié !' : 'Copier'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Timestamp to Date */}
        <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-indigo-500" />
            Timestamp vers Date
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-500 mb-1">Timestamp Unix (secondes)</label>
              <input
                type="number"
                value={timestampInput}
                onChange={(e) => setTimestampInput(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-mono focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              />
            </div>
            <div className="bg-gray-50 p-4 rounded-xl space-y-3">
              <div>
                <div className="text-xs text-gray-400 uppercase font-bold tracking-wider">Heure Locale</div>
                <div className="text-gray-800 font-medium">{results.local}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 uppercase font-bold tracking-wider">Heure UTC</div>
                <div className="text-gray-800 font-medium">{results.utc}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 uppercase font-bold tracking-wider">Temps relatif</div>
                <div className="text-gray-800 font-medium">{results.relative}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Date to Timestamp */}
        <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-500" />
            Date vers Timestamp
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Jour</label>
                <input
                  type="number"
                  value={dateInput.day}
                  onChange={(e) => setDateInput({ ...dateInput, day: parseInt(e.target.value) || 1 })}
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-center"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Mois</label>
                <input
                  type="number"
                  value={dateInput.month}
                  onChange={(e) => setDateInput({ ...dateInput, month: parseInt(e.target.value) || 1 })}
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-center"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Année</label>
                <input
                  type="number"
                  value={dateInput.year}
                  onChange={(e) => setDateInput({ ...dateInput, year: parseInt(e.target.value) || 2024 })}
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-center"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Heures</label>
                <input
                  type="number"
                  value={dateInput.hours}
                  onChange={(e) => setDateInput({ ...dateInput, hours: parseInt(e.target.value) || 0 })}
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-center"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Minutes</label>
                <input
                  type="number"
                  value={dateInput.minutes}
                  onChange={(e) => setDateInput({ ...dateInput, minutes: parseInt(e.target.value) || 0 })}
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-center"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Secondes</label>
                <input
                  type="number"
                  value={dateInput.seconds}
                  onChange={(e) => setDateInput({ ...dateInput, seconds: parseInt(e.target.value) || 0 })}
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-center"
                />
              </div>
            </div>
            <div className="bg-emerald-50 p-4 rounded-xl text-center">
              <div className="text-xs text-emerald-600 uppercase font-bold tracking-wider mb-1">Résultat Timestamp</div>
              <div className="text-2xl font-mono font-bold text-emerald-700">{dateToTimestamp()}</div>
              <button
                onClick={() => handleCopy(dateToTimestamp().toString())}
                className="mt-2 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Copier le résultat
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-xl text-sm text-gray-600">
        <p><strong>Note :</strong> Le timestamp Unix est le nombre de secondes écoulées depuis le 1er janvier 1970 (UTC). C'est un format universel utilisé en informatique.</p>
      </div>
    </div>
  );
}
