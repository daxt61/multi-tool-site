import React, { useState, useEffect, useMemo } from 'react';
import { Clock, Globe, Plus, Trash2, X, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface TimezoneItem {
  id: string;
  name: string;
  zone: string;
}

const COMMON_TIMEZONES = [
  { name: 'London', zone: 'Europe/London' },
  { name: 'Paris', zone: 'Europe/Paris' },
  { name: 'New York', zone: 'America/New_York' },
  { name: 'Tokyo', zone: 'Asia/Tokyo' },
  { name: 'Sydney', zone: 'Australia/Sydney' },
  { name: 'Dubai', zone: 'Asia/Dubai' },
  { name: 'Hong Kong', zone: 'Asia/Hong_Kong' },
  { name: 'Los Angeles', zone: 'America/Los_Angeles' },
  { name: 'São Paulo', zone: 'America/Sao_Paulo' },
  { name: 'Mumbai', zone: 'Asia/Kolkata' },
  { name: 'Singapore', zone: 'Asia/Singapore' },
  { name: 'Berlin', zone: 'Europe/Berlin' },
  { name: 'Moscow', zone: 'Europe/Moscow' },
  { name: 'Cairo', zone: 'Africa/Cairo' },
  { name: 'Johannesburg', zone: 'Africa/Johannesburg' },
  { name: 'Seoul', zone: 'Asia/Seoul' },
  { name: 'Istanbul', zone: 'Europe/Istanbul' },
  { name: 'Mexico City', zone: 'America/Mexico_City' },
  { name: 'Bangkok', zone: 'Asia/Bangkok' },
  { name: 'Toronto', zone: 'America/Toronto' },
];

export function WorldClock({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t, i18n } = useTranslation();
  const [clocks, setClocks] = useState<TimezoneItem[]>(initialData?.clocks || [
    { id: '1', name: 'Local', zone: Intl.DateTimeFormat().resolvedOptions().timeZone }
  ]);
  const [now, setNow] = useState(new Date());
  const [isAdding, setIsAdding] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    onStateChange?.({ clocks });
  }, [clocks, onStateChange]);

  const addClock = (timezone: { name: string, zone: string }) => {
    const newClock = {
      id: crypto.randomUUID(),
      name: timezone.name,
      zone: timezone.zone
    };
    setClocks([...clocks, newClock]);
    setIsAdding(false);
    setSearch('');
  };

  const removeClock = (id: string) => {
    setClocks(clocks.filter(c => c.id !== id));
  };

  const filteredTimezones = useMemo(() => {
    if (!search) return COMMON_TIMEZONES;
    return COMMON_TIMEZONES.filter(tz =>
      tz.name.toLowerCase().includes(search.toLowerCase()) ||
      tz.zone.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  const getTimeParts = (date: Date, zone: string) => {
    const options: Intl.DateTimeFormatOptions = {
      timeZone: zone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    };
    const timeStr = date.toLocaleTimeString(i18n.language === 'en' ? 'en-US' : 'fr-FR', options);

    const dateOptions: Intl.DateTimeFormatOptions = {
      timeZone: zone,
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    };
    const dateStr = date.toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'fr-FR', dateOptions);

    return { timeStr, dateStr };
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-center px-1">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
          <Globe className="w-4 h-4 text-indigo-500" /> {t('worldclock.title', 'World Clock')}
        </h3>
        <button
          onClick={() => setIsAdding(true)}
          className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 px-4 py-2 rounded-xl flex items-center gap-2 transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
        >
          <Plus className="w-4 h-4" /> {t('worldclock.add', 'Add Clock')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clocks.map((clock) => {
          const { timeStr, dateStr } = getTimeParts(now, clock.zone);
          return (
            <div
              key={clock.id}
              className="relative p-8 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2rem] shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all group"
            >
              <button
                onClick={() => removeClock(clock.id)}
                className="absolute top-4 right-4 p-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                aria-label={t('common.remove', 'Remove')}
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <div className="space-y-1 mb-4">
                <h4 className="font-black text-slate-900 dark:text-white truncate">{clock.name}</h4>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest truncate">{clock.zone}</p>
              </div>

              <div className="space-y-2">
                <div className="text-4xl font-mono font-black text-indigo-600 dark:text-indigo-400 tabular-nums">
                  {timeStr}
                </div>
                <div className="text-sm font-bold text-slate-500 dark:text-slate-400">
                  {dateStr}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-black">{t('worldclock.add_title', 'Add a city')}</h3>
              <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  autoFocus
                  type="text"
                  placeholder={t('worldclock.search_placeholder', 'Search for a city...')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>

              <div className="max-h-[300px] overflow-y-auto no-scrollbar space-y-1">
                {filteredTimezones.map((tz) => (
                  <button
                    key={tz.zone}
                    onClick={() => addClock(tz)}
                    className="w-full flex items-center justify-between p-4 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-2xl transition-colors group"
                  >
                    <div className="text-left">
                      <div className="font-bold group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{tz.name}</div>
                      <div className="text-xs text-slate-400 font-mono">{tz.zone}</div>
                    </div>
                    <Plus className="w-4 h-4 text-slate-300 group-hover:text-indigo-500" />
                  </button>
                ))}
                {filteredTimezones.length === 0 && (
                  <div className="py-12 text-center text-slate-500 font-medium">
                    {t('search.no_results', 'No results found')}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2rem] border border-indigo-100 dark:border-indigo-900/20">
        <h4 className="font-bold text-slate-900 dark:text-white mb-2">{t('worldclock.about_title', 'About World Clock')}</h4>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          {t('worldclock.about_text', 'Monitor current time and date in multiple cities around the world simultaneously. Perfect for scheduling international meetings or keeping track of global markets.')}
        </p>
      </div>
    </div>
  );
}
