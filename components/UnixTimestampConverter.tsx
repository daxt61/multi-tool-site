import { useState, useEffect } from 'react';
import { Clock, Copy, Check, RefreshCw, Calendar, Globe } from 'lucide-react';

export function UnixTimestampConverter() {
  const [timestamp, setTimestamp] = useState(Math.floor(Date.now() / 1000).toString());
  const [copied, setCopied] = useState('');

  const now = Math.floor(Date.now() / 1000);

  const getDates = (ts: string) => {
    try {
      let val = parseInt(ts);
      if (isNaN(val)) return null;

      // If timestamp is too large, assume milliseconds
      if (val > 99999999999) {
        val = Math.floor(val / 1000);
      }

      const date = new Date(val * 1000);
      return {
        iso: date.toISOString(),
        utc: date.toUTCString(),
        local: date.toLocaleString(),
        relative: getRelativeTime(date)
      };
    } catch (e) {
      return null;
    }
  };

  const getRelativeTime = (date: Date) => {
    const diff = date.getTime() - Date.now();
    const absDiff = Math.abs(diff);
    const seconds = Math.floor(absDiff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    const prefix = diff > 0 ? 'Dans ' : 'Il y a ';
    const suffix = diff > 0 ? '' : ''; // In French, "Il y a" is enough

    if (seconds < 60) return `${prefix}${seconds} secondes`;
    if (minutes < 60) return `${prefix}${minutes} minutes`;
    if (hours < 24) return `${prefix}${hours} heures`;
    return `${prefix}${days} jours`;
  };

  const dates = getDates(timestamp);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Input Area */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
          <label className="text-xs font-black uppercase tracking-widest text-slate-400">Unix Timestamp</label>
          <button
            onClick={() => setTimestamp(Math.floor(Date.now() / 1000).toString())}
            className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 px-3 py-1.5 rounded-full transition-all"
          >
            <RefreshCw className="w-3 h-3" /> Utiliser le temps actuel
          </button>
        </div>
        <div className="relative">
          <input
            type="text"
            value={timestamp}
            onChange={(e) => setTimestamp(e.target.value)}
            className="w-full p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-4xl font-black font-mono outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
            placeholder="1712345678"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 font-bold text-sm hidden md:block">
            {timestamp.length > 11 ? 'Millisecondes' : 'Secondes'}
          </div>
        </div>
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { id: 'local', label: 'Heure Locale', value: dates?.local, icon: <Clock className="w-4 h-4" /> },
          { id: 'iso', label: 'ISO 8601', value: dates?.iso, icon: <Calendar className="w-4 h-4" /> },
          { id: 'utc', label: 'UTC / GMT', value: dates?.utc, icon: <Globe className="w-4 h-4" /> },
          { id: 'relative', label: 'Relatif', value: dates?.relative, icon: <RefreshCw className="w-4 h-4" /> },
        ].map((item) => (
          <div key={item.id} className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] space-y-3 group transition-all hover:border-indigo-500/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-400 group-hover:text-indigo-500 transition-colors">
                {item.icon}
                <span className="text-xs font-bold uppercase tracking-widest">{item.label}</span>
              </div>
              <button
                onClick={() => item.value && copyToClipboard(item.value, item.id)}
                className={`p-2 rounded-xl transition-all ${copied === item.id ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-600'}`}
              >
                {copied === item.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <div className="text-lg font-black font-mono break-all dark:text-slate-200">
              {item.value || 'Invalide'}
            </div>
          </div>
        ))}
      </div>

      {/* Conversion from Date to Timestamp */}
      <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32 transition-transform group-hover:scale-110"></div>
        <div className="relative z-10 space-y-6">
          <h3 className="text-xl font-black">Convertir une date en Timestamp</h3>
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="datetime-local"
              onChange={(e) => {
                const date = new Date(e.target.value);
                if (!isNaN(date.getTime())) {
                  setTimestamp(Math.floor(date.getTime() / 1000).toString());
                }
              }}
              className="flex-1 p-4 bg-white/10 border border-white/20 rounded-2xl outline-none focus:ring-2 focus:ring-white/30 transition-all font-bold text-white [color-scheme:dark]"
            />
            <button
              onClick={() => copyToClipboard(timestamp, 'main')}
              className="px-8 py-4 bg-white text-indigo-600 rounded-2xl font-black hover:bg-slate-50 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              {copied === 'main' ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              Copier le résultat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
