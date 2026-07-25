import { useState, useMemo, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  Clock,
  Globe,
  ArrowRight,
  Info,
  Calendar,
  Search,
  Trash2,
  Copy,
  Check,
  Plus,
  X,
  Sliders,
  Sparkles
} from 'lucide-react';
import { Kbd } from './ui/Kbd';

// Comprehensive list of standard common IANA timezones (~80 zones)
const COMMON_TIMEZONES = [
  'UTC',
  'Africa/Cairo',
  'Africa/Casablanca',
  'Africa/Johannesburg',
  'Africa/Lagos',
  'Africa/Nairobi',
  'America/Anchorage',
  'America/Argentina/Buenos_Aires',
  'America/Bogota',
  'America/Caracas',
  'America/Chicago',
  'America/Denver',
  'America/Halifax',
  'America/Los_Angeles',
  'America/Mexico_City',
  'America/New_York',
  'America/Phoenix',
  'America/Santiago',
  'America/Sao_Paulo',
  'America/St_Johns',
  'America/Toronto',
  'America/Vancouver',
  'Asia/Baghdad',
  'Asia/Baku',
  'Asia/Bangkok',
  'Asia/Dubai',
  'Asia/Hong_Kong',
  'Asia/Istanbul',
  'Asia/Jakarta',
  'Asia/Jerusalem',
  'Asia/Kabul',
  'Asia/Karachi',
  'Asia/Kolkata',
  'Asia/Manila',
  'Asia/Riyadh',
  'Asia/Seoul',
  'Asia/Shanghai',
  'Asia/Singapore',
  'Asia/Tehran',
  'Asia/Tokyo',
  'Atlantic/Azores',
  'Atlantic/Canary',
  'Australia/Adelaide',
  'Australia/Brisbane',
  'Australia/Darwin',
  'Australia/Melbourne',
  'Australia/Perth',
  'Australia/Sydney',
  'Europe/Amsterdam',
  'Europe/Athens',
  'Europe/Belgrade',
  'Europe/Berlin',
  'Europe/Brussels',
  'Europe/Budapest',
  'Europe/Copenhagen',
  'Europe/Dublin',
  'Europe/Helsinki',
  'Europe/Kiev',
  'Europe/Lisbon',
  'Europe/London',
  'Europe/Madrid',
  'Europe/Moscow',
  'Europe/Oslo',
  'Europe/Paris',
  'Europe/Prague',
  'Europe/Rome',
  'Europe/Stockholm',
  'Europe/Vienna',
  'Europe/Warsaw',
  'Europe/Zurich',
  'Pacific/Auckland',
  'Pacific/Chatham',
  'Pacific/Fiji',
  'Pacific/Guam',
  'Pacific/Honolulu',
  'Pacific/Kiritimati',
  'Pacific/Pago_Pago',
  'Pacific/Samoa'
];

interface TrackedZone {
  id: string;
  name: string;
}

export function TimezoneConverter() {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'en';

  // Base configurations
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(() => new Date().toTimeString().slice(0, 5));
  const [fromTz, setFromTz] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');

  // Multi-timezone tracked list (initialized with a few favorites)
  const [trackedZones, setTrackedZones] = useState<TrackedZone[]>([
    { id: 'UTC', name: 'UTC' },
    { id: 'America/New_York', name: 'America/New_York' },
    { id: 'Europe/Paris', name: 'Europe/Paris' },
    { id: 'Asia/Tokyo', name: 'Asia/Tokyo' }
  ]);

  // Fuzzy search fields
  const [searchTerm, setSearchTerm] = useState('');
  const [isCopiedId, setIsCopiedId] = useState<string | null>(null);

  // Keyboard shortcut input focus reference
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Compute base datetime in ms
  const baseDateTime = useMemo(() => {
    try {
      const dt = new Date(`${date}T${time}`);
      if (isNaN(dt.getTime())) return new Date();
      return dt;
    } catch {
      return new Date();
    }
  }, [date, time]);

  // Horizontal meeting scheduler slider state: active hour (0 to 23)
  const activeHourValue = useMemo(() => {
    const hours = parseInt(time.split(':')[0], 10);
    return isNaN(hours) ? 12 : hours;
  }, [time]);

  const handleSliderChange = (newHour: number) => {
    const formattedHour = String(newHour).padStart(2, '0');
    const minutes = time.split(':')[1] || '00';
    setTime(`${formattedHour}:${minutes}`);
  };

  // Helper to determine work/sleep/off status for any given hour
  const getHourStatus = (hour: number) => {
    if (hour >= 9 && hour < 17) {
      return {
        key: 'work',
        color: 'bg-emerald-500 text-white dark:bg-emerald-600',
        text: t('timezone.status.work', 'Work Hours'),
        bgLight: 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30'
      };
    }
    if (hour >= 22 || hour < 6) {
      return {
        key: 'sleep',
        color: 'bg-indigo-950 text-indigo-200 dark:bg-slate-900',
        text: t('timezone.status.sleep', 'Sleeping'),
        bgLight: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
      };
    }
    return {
      key: 'off',
      color: 'bg-amber-500 text-white dark:bg-amber-600',
      text: t('timezone.status.off', 'Off-Hours'),
      bgLight: 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/30'
    };
  };

  // Converted zones details computation
  const convertedZones = useMemo(() => {
    return trackedZones.map(zone => {
      try {
        // Resolve date time in destination zone
        const locString = baseDateTime.toLocaleString('en-US', { timeZone: fromTz });
        const fromDate = new Date(locString);
        const targetLocString = baseDateTime.toLocaleString('en-US', { timeZone: zone.id });
        const targetDate = new Date(targetLocString);

        // Calculate offset difference
        const offsetDiffMin = Math.round((targetDate.getTime() - fromDate.getTime()) / 60000);
        const offsetHours = Math.floor(Math.abs(offsetDiffMin) / 60);
        const offsetMins = Math.abs(offsetDiffMin) % 60;
        const offsetSign = offsetDiffMin >= 0 ? '+' : '-';
        const formattedOffset = `UTC${offsetSign}${offsetHours}${offsetMins ? `:${offsetMins}` : ''}`;

        // Get time & hour details for local status
        const localHour = targetDate.getHours();

        // Standard string output representation
        const langCode = currentLang === 'fr' ? 'fr-FR' : 'en-US';
        const formattedFull = new Intl.DateTimeFormat(langCode, {
          dateStyle: 'full',
          timeStyle: 'medium',
          timeZone: zone.id
        }).format(baseDateTime);

        return {
          id: zone.id,
          name: zone.name,
          formattedFull,
          offset: formattedOffset,
          localHour,
          status: getHourStatus(localHour),
          timeOnly: targetDate.toLocaleTimeString(langCode, { hour: '2-digit', minute: '2-digit' }),
          dateOnly: targetDate.toLocaleDateString(langCode, { month: 'short', day: 'numeric', year: 'numeric' })
        };
      } catch (e) {
        return {
          id: zone.id,
          name: zone.name,
          formattedFull: t('timezone.error.convert', 'Conversion Error'),
          offset: 'UTC',
          localHour: 12,
          status: getHourStatus(12),
          timeOnly: '--:--',
          dateOnly: ''
        };
      }
    });
  }, [trackedZones, baseDateTime, fromTz, currentLang, t]);

  // Formatted exports for base configuration
  const exportFormats = useMemo(() => {
    try {
      const ts = Math.floor(baseDateTime.getTime() / 1000);
      return {
        iso: baseDateTime.toISOString(),
        rfc: baseDateTime.toUTCString(),
        unix: String(ts),
        utc: baseDateTime.toLocaleString('en-US', { timeZone: 'UTC' })
      };
    } catch {
      return { iso: '', rfc: '', unix: '', utc: '' };
    }
  }, [baseDateTime]);

  // Filter timezones for fuzzy autocomplete list
  const filteredTimezones = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return [];
    return COMMON_TIMEZONES.filter(tz => {
      const norm = tz.toLowerCase();
      return norm.includes(term) && !trackedZones.some(t => t.id === tz);
    }).slice(0, 8);
  }, [searchTerm, trackedZones]);

  // Handlers
  const handleAddTracked = (zoneId: string) => {
    if (!trackedZones.some(z => z.id === zoneId)) {
      setTrackedZones(prev => [...prev, { id: zoneId, name: zoneId }]);
      toast.success(t('timezone.toast.added', 'Timezone added successfully'));
    }
    setSearchTerm('');
  };

  const handleRemoveTracked = (zoneId: string) => {
    setTrackedZones(prev => prev.filter(z => z.id !== zoneId));
    toast.success(t('timezone.toast.removed', 'Timezone removed'));
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setIsCopiedId(id);
    toast.success(t('timezone.toast.copied', 'Copied to clipboard'));
    setTimeout(() => setIsCopiedId(null), 2000);
  };

  // Local escape key listener pattern
  const handlersRef = useRef({
    onEscape: () => {
      setDate(new Date().toISOString().split('T')[0]);
      setTime(new Date().toTimeString().slice(0, 5));
      setFromTz(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
      setSearchTerm('');
      searchInputRef.current?.focus();
      toast.info(t('timezone.toast.reset', 'Reset to current system parameters'));
    }
  });

  useEffect(() => {
    handlersRef.current = {
      onEscape: () => {
        setDate(new Date().toISOString().split('T')[0]);
        setTime(new Date().toTimeString().slice(0, 5));
        setFromTz(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
        setSearchTerm('');
        searchInputRef.current?.focus();
        toast.info(t('timezone.toast.reset', 'Reset to current system parameters'));
      }
    };
  }, [t]);

  useEffect(() => {
    const handleGlobalKeys = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const target = e.target as HTMLElement;
        if (target && ['INPUT', 'TEXTAREA'].includes(target.tagName)) {
          // Normal behavior inside input forms, or we reset
        }
        handlersRef.current.onEscape();
      }
    };
    window.addEventListener('keydown', handleGlobalKeys);
    return () => window.removeEventListener('keydown', handleGlobalKeys);
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Configuration Controls */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-6 md:p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-6 shadow-sm">
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <Calendar className="w-4 h-4 text-indigo-500" />
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
                  {t('timezone.section.datetime', 'Date & Time Source')}
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="base-date" className="text-xs font-bold text-slate-500 dark:text-slate-400 px-1">
                    {t('timezone.label.date', 'Date')}
                  </label>
                  <input
                    id="base-date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold focus:border-indigo-500 outline-none transition-all dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="base-time" className="text-xs font-bold text-slate-500 dark:text-slate-400 px-1">
                    {t('timezone.label.time', 'Time')}
                  </label>
                  <input
                    id="base-time"
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <Globe className="w-4 h-4 text-indigo-500" />
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
                  {t('timezone.section.source_tz', 'Base Timezone')}
                </h3>
              </div>

              <div className="space-y-2">
                <label htmlFor="source-tz-select" className="text-xs font-bold text-slate-500 dark:text-slate-400 px-1">
                  {t('timezone.label.source_tz', 'Source Zone')}
                </label>
                <select
                  id="source-tz-select"
                  value={fromTz}
                  onChange={(e) => setFromTz(e.target.value)}
                  className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold focus:border-indigo-500 outline-none transition-all dark:text-white cursor-pointer"
                >
                  {COMMON_TIMEZONES.map(tz => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Fuzzy Search to Add tracked zones */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-indigo-500" />
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
                    {t('timezone.section.add_tz', 'Track New Timezone')}
                  </h3>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-400 font-medium">
                  <span>Reset:</span>
                  <Kbd>Esc</Kbd>
                </div>
              </div>

              <div className="relative space-y-2">
                <label htmlFor="tz-search" className="sr-only">Search Timezone</label>
                <input
                  id="tz-search"
                  ref={searchInputRef}
                  type="text"
                  placeholder={t('timezone.search.placeholder', 'Type city or region... e.g., Tokyo')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold focus:border-indigo-500 outline-none transition-all dark:text-white"
                  autoComplete="off"
                  spellCheck={false}
                />

                {filteredTimezones.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-lg max-h-60 overflow-y-auto overflow-hidden divide-y divide-slate-100 dark:divide-slate-700/50">
                    {filteredTimezones.map(tz => (
                      <button
                        key={tz}
                        onClick={() => handleAddTracked(tz)}
                        className="w-full p-3 text-left font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-between transition-all"
                      >
                        <span>{tz}</span>
                        <Plus className="w-4 h-4 text-indigo-500" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => {
                setDate(new Date().toISOString().split('T')[0]);
                setTime(new Date().toTimeString().slice(0, 5));
                setFromTz(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
              }}
              className="w-full py-4 text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all"
            >
              <Trash2 className="w-4 h-4" /> {t('timezone.button.reset_now', 'Reset to Now')}
            </button>
          </div>
        </div>

        {/* Right Side: Tracked Timezones Comparison Table */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-6 md:p-8 space-y-6 shadow-sm">
            <div className="flex items-center justify-between pb-2">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-500" />
                <h3 className="font-bold dark:text-white text-lg">
                  {t('timezone.section.tracked', 'Tracked & Converted Zones')}
                </h3>
              </div>
              <span className="text-xs bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-full font-black">
                {trackedZones.length} {t('timezone.count_label', 'Active Zones')}
              </span>
            </div>

            {/* Slider to easily scrub hours */}
            <div className="bg-slate-50 dark:bg-slate-900/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                  {t('timezone.slider.label', 'Hour Meeting Scrub Slider')}
                </span>
                <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">{time}</span>
              </div>
              <input
                type="range"
                min="0"
                max="23"
                value={activeHourValue}
                onChange={(e) => handleSliderChange(parseInt(e.target.value, 10))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-bold font-mono px-1">
                <span>12 AM</span>
                <span>6 AM</span>
                <span>12 PM</span>
                <span>6 PM</span>
                <span>11 PM</span>
              </div>
            </div>

            {/* List of tracked zones */}
            <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1">
              {convertedZones.map(zone => (
                <div
                  key={zone.id}
                  className="p-5 bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-4 hover:border-slate-200 dark:hover:border-slate-700/60 transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-800 dark:text-white text-sm">{zone.name}</span>
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-md">
                          {zone.offset}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-semibold">{zone.dateOnly}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-lg font-black font-mono text-slate-800 dark:text-white">{zone.timeOnly}</span>
                        <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5 border text-center ${zone.status.bgLight}`}>
                          {zone.status.text}
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => handleCopyText(zone.formattedFull, zone.id)}
                          className={`p-2 rounded-lg border transition-all ${
                            isCopiedId === zone.id
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-950/20 dark:border-emerald-900/40 dark:text-emerald-400'
                              : 'bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400'
                          }`}
                          title={t('timezone.tooltip.copy', 'Copy Full String')}
                        >
                          {isCopiedId === zone.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>

                        {/* Prevent removing the main reference zone unless multiple exist */}
                        {trackedZones.length > 1 && (
                          <button
                            onClick={() => handleRemoveTracked(zone.id)}
                            className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:text-rose-600 text-slate-400 rounded-lg transition-all"
                            title={t('timezone.tooltip.remove', 'Remove Zone')}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Visual 24h timeline strip indicating day parts */}
                  <div className="space-y-1">
                    <div className="flex h-2.5 w-full rounded-full overflow-hidden border border-slate-100 dark:border-slate-800">
                      {Array.from({ length: 24 }).map((_, h) => {
                        const status = getHourStatus(h);
                        const isActive = h === zone.localHour;
                        return (
                          <div
                            key={h}
                            className={`flex-1 h-full transition-all ${
                              isActive
                                ? 'ring-2 ring-indigo-600 ring-offset-2 dark:ring-offset-slate-900 scale-110 z-10 bg-indigo-600 dark:bg-indigo-400'
                                : status.key === 'work'
                                ? 'bg-emerald-500/80 dark:bg-emerald-600/80'
                                : status.key === 'sleep'
                                ? 'bg-indigo-950/90 dark:bg-slate-900'
                                : 'bg-amber-400/80 dark:bg-amber-600/80'
                            }`}
                            title={`${h}:00 - ${status.text}`}
                          />
                        );
                      })}
                    </div>
                    <div className="flex justify-between text-[8px] text-slate-400 font-bold font-mono px-0.5">
                      <span>12am</span>
                      <span>8am</span>
                      <span>12pm</span>
                      <span>4pm</span>
                      <span>11pm</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Export format card */}
            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
              <h4 className="font-bold text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                {t('timezone.section.exports', 'Exporters (ISO, Unix, UTC)')}
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 block uppercase">ISO 8601</span>
                  <div className="flex items-center justify-between">
                    <code className="text-slate-600 dark:text-slate-300 font-bold truncate pr-2">{exportFormats.iso}</code>
                    <button
                      onClick={() => handleCopyText(exportFormats.iso, 'iso')}
                      className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-500 dark:text-slate-400 transition-all"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 block uppercase">UNIX Timestamp</span>
                  <div className="flex items-center justify-between">
                    <code className="text-slate-600 dark:text-slate-300 font-bold truncate pr-2">{exportFormats.unix}</code>
                    <button
                      onClick={() => handleCopyText(exportFormats.unix, 'unix')}
                      className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-500 dark:text-slate-400 transition-all"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/50 p-6 md:p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 flex items-start gap-4 shadow-sm">
             <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                <Info className="w-6 h-6" />
             </div>
             <div className="space-y-2">
                <h4 className="font-bold dark:text-white">{t('timezone.info.title', 'International Meeting Planner')}</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  {t('timezone.info.desc', 'Scrub the hourly slider to instantly project and synchronize times across your favorite global cities. Easily coordinate business meeting slots without sleep-hour conflicts.')}
                </p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
